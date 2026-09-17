// Читатель публичных чатов.
//
// Единственное, что он делает, — читает. Ни одного вызова, который
// отправляет сообщение, здесь нет и быть не должно: отвечает оператор
// руками и в том же чате. Это не осторожность ради осторожности — именно
// рассылка, а не чтение, приводит к ограничениям на аккаунт.
//
// Живёт отдельным пакетом, чтобы сайту не достались его зависимости:
// в приложении их пять, и так и должно остаться.
import { readFileSync } from "node:fs";
// teleproto — пакет CommonJS без карты экспортов, поэтому импорт подпапки
// («teleproto/sessions») в ESM не резолвится. Берём всё с верхнего уровня.
import telegram from "teleproto";

import { startProxyBridge } from "./http-proxy-bridge.mjs";
import { createBuffer } from "@/lib/scout/buffer";
import { openChats } from "@/lib/scout/chats";
import { classify } from "@/lib/scout/classify";
import { EMPTY_PULSE, accumulate, writePulse } from "@/lib/scout/health";
import { shape } from "@/lib/scout/shape";
import { processBatch } from "@/lib/scout/store";
import { nextStrikes, shouldExit } from "@/lib/scout/watchdog";
import { markFailed, markSent, nextQueued } from "@/lib/admin/outreach-queue";

const DRY_RUN = process.argv.includes("--dry-run");

/**
 * Окно накопления и размер пачки.
 *
 * Минута — компромисс: в оживлённом чате пачка набирается раньше и уходит
 * сразу, а в тихом сообщение не лежит до вечера.
 */
const FLUSH_MS = Number(process.env.SCOUT_FLUSH_MS || 60_000);
// Как часто заглядывать в очередь касаний. Сама пауза между отправками
// живёт в lib/admin/outreach-queue.ts: предел общий для аккаунта.
const OUTREACH_MS = Number(process.env.SCOUT_OUTREACH_MS || 45_000);
const MAX_BATCH = Number(process.env.SCOUT_MAX_BATCH || 20);

/** Как часто сторож смотрит на соединение. Два промаха подряд — выход. */
const WATCHDOG_MS = 5 * 60_000;

/**
 * Как часто скаут отчитывается о себе в базу.
 *
 * По таймеру, а не по сообщениям: в тихом чате проходов нет вовсе, и пульс
 * по проходам не отличил бы тишину от смерти — ровно ту разницу, ради
 * которой он и нужен. Пять минут против пятнадцати на протухание: пульс
 * успеет обновиться дважды, прежде чем кто-то решит, что скаут умер.
 */
const PULSE_MS = 5 * 60_000;

function env(name, required = true) {
  const value = (process.env[name] || "").trim();
  if (!value && required) {
    console.error(`scout: не задан ${name}`);
    process.exit(1);
  }
  return value;
}

/**
 * Список чатов, за которыми следим.
 *
 * Только чтение уже вступивших чатов. Вступать скрипт не умеет намеренно:
 * массовое вступление — как раз то поведение, по которому аккаунт получает
 * ограничение. В чаты человек входит сам, руками и не за один день.
 */
function chats() {
  const raw = (process.env.SCOUT_CHATS || "").trim();
  if (!raw) {
    console.error(
      "scout: не задан SCOUT_CHATS — список чатов через запятую, " +
        "например «uzdevs,@tashkent_it,-1001234567890»",
    );
    process.exit(1);
  }
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Накопленное за время жизни процесса.
 *
 * Перезапуск обнуляет — и это правильно: пульс отвечает на вопрос «что скаут
 * видит сейчас», а не «сколько всего видел за историю». Числа, пережившие
 * перезапуск, скрыли бы как раз перезапуск.
 */
let pulse = {
  ...EMPTY_PULSE,
  at: new Date().toISOString(),
  startedAt: new Date().toISOString(),
};

async function flushBatch(batch) {
  const run = await processBatch(batch, classify, { rehearsal: DRY_RUN });
  pulse = accumulate(pulse, run);

  // Разбивка отсева — рядом, в той же строке. Отдельной строкой она
  // разъезжается с числами прохода при любом просмотре журнала, а смотрят
  // на них всегда вместе: «до модели дошло 4 из 340» без причины отсева
  // одинаково похоже на тихий чат и на слишком жёсткое правило.
  const dropped = Object.entries(run.dropped)
    .sort((a, b) => b[1] - a[1])
    .map(([reason, count]) => `${DROP_LABEL[reason] ?? reason} ${count}`)
    .join(", ");

  console.log(
    `scout: увидел ${run.seen}, до модели дошло ${run.passedPrefilter}, ` +
      `разобрано ${run.classified}, сохранено ${run.saved}, отправлено ${run.notified}` +
      (dropped ? ` · отсев: ${dropped}` : ""),
  );
}

const buffer = createBuffer({
  flushMs: FLUSH_MS,
  maxBatch: MAX_BATCH,
  onFlush: flushBatch,
});

/**
 * Холостой прогон: гоняет заготовленные сообщения через тот же путь, что и
 * живые, но без подключения к Telegram. Нужен, чтобы проверить связку
 * «отсев → модель → база → канал оператора» до того, как в дело пойдёт
 * настоящий аккаунт.
 *
 * Цепочка проверяется целиком, включая запись и уведомление, — иначе
 * проверять нечего. Но результат помечается: `rehearsal` кладёт сигнал в
 * базу сразу со `status = 'ignored'` и ставит заголовок в уведомлении.
 * Без этого фикстуры неотличимы от лидов, и оператор идёт отвечать
 * выдуманному человеку.
 */
async function dryRun() {
  const file = process.env.SCOUT_SAMPLE || new URL("./sample.json", import.meta.url);
  const sample = JSON.parse(readFileSync(file, "utf8"));

  console.log(`scout: холостой прогон, ${sample.length} сообщений, Telegram не трогаем`);
  for (const message of sample) buffer.push(message);
  await buffer.stop();
}

async function live() {
  const { TelegramClient } = telegram;
  const { StringSession } = telegram.sessions;
  const { NewMessage } = telegram.events;

  // Прокси тот же, что у остального приложения.
  //
  // На сервере без прямого выхода в интернет соединение с Telegram иначе
  // просто не встаёт: клиент ходит голым TCP, а HTTP-прокси он не понимает.
  // Мост переводит одно в другое и живёт в этом же процессе.
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || "";
  const bridge = proxyUrl ? await startProxyBridge(proxyUrl) : null;
  if (bridge) console.log(`scout: выхожу через прокси ${new URL(proxyUrl).host}`);

  const session = new StringSession(env("SCOUT_SESSION"));
  const client = new TelegramClient(
    session,
    Number(env("SCOUT_API_ID")),
    env("SCOUT_API_HASH"),
    { connectionRetries: 5, ...(bridge ? { proxy: bridge.socks } : {}) },
  );

  await client.connect();
  if (!(await client.isUserAuthorized())) {
    console.error("scout: сессия недействительна — выполните npm run login");
    process.exit(1);
  }

  const watched = chats();
  const roster = await openChats(client, watched);

  for (const chat of roster.failed) {
    console.error(`scout: не открыл ${chat.name} — пропускаю (${chat.reason})`);
  }

  if (!roster.opened.length) {
    console.error("scout: не открылся ни один чат из SCOUT_CHATS — читать нечего");
    process.exit(1);
  }

  if (roster.rosterUnknown) {
    console.error("scout: не свериться со списком диалогов — не знаю, где аккаунт состоит");
  } else if (roster.outside.length) {
    // Не ошибка и не повод останавливаться: вступает человек, руками и не
    // за один день. Номера таких чатов остаются в фильтре — вступит позже,
    // и сообщения пойдут без перезапуска.
    console.error(
      `scout: аккаунт не состоит в ${roster.outside.length} чатах, оттуда ничего не придёт: ` +
        roster.outside.map((chat) => chat.name).join(", "),
    );
  }

  const reading = roster.reading;
  console.log(
    `scout: открыл ${roster.opened.length} из ${watched.length}` +
      `${roster.rosterUnknown ? "" : `, состою в ${reading}`}, окно ${FLUSH_MS / 1000} с`,
  );

  // Соответствия адрес → номер, один раз при старте.
  //
  // Адрес по имени — это сетевой resolveUsername при каждом перезапуске, а
  // на него у Telegram отдельный тесный лимит. Номер открывается из кэша,
  // без сети. Строка ниже — готовое значение для SCOUT_CHATS: заменил, и
  // старт больше в сеть за адресами не ходит.
  const byName = roster.opened.filter((chat) => chat.name !== chat.id);
  if (byName.length) {
    console.log(
      `scout: номера для SCOUT_CHATS (вместо адресов, чтобы не резолвить при каждом старте): ` +
        byName.map((chat) => `${chat.name}=${chat.id}`).join(" "),
    );
  }

  // Пульс. Числа чатов известны только здесь, после разбора списка.
  //
  // Первая запись — сразу, не дожидаясь таймера: иначе первые пять минут
  // после старта скаут снаружи выглядит мёртвым, а перезапуски случаются
  // как раз тогда, когда на него смотрят.
  pulse = { ...pulse, chatsWatched: watched.length, chatsReading: reading };
  await writePulse({ ...pulse, at: new Date().toISOString() });
  setInterval(() => {
    void writePulse({ ...pulse, at: new Date().toISOString() });
  }, PULSE_MS);

  // Сторож. Библиотека переподключается сама, но её цикл обновлений
  // выходит, когда клиент считает себя отключённым, — и дальше процесс
  // живёт молча. Два промаха подряд с интервалом в минуты — выходим,
  // systemd перезапустит. Подробности — в lib/scout/watchdog.ts.
  let strikes = 0;
  setInterval(() => {
    strikes = nextStrikes(strikes, {
      disconnected: Boolean(client.disconnected),
      reconnecting: Boolean(client._sender?.isReconnecting),
    });
    if (shouldExit(strikes)) {
      console.error("scout: соединение потеряно и не восстановилось — выхожу, systemd перезапустит");
      process.exit(1);
    }
  }, WATCHDOG_MS);

  // ── Касания ───────────────────────────────────────────────────────────
  //
  // Раньше здесь было написано «ничего не отправляет». Теперь отправляет —
  // но только то, что человек прочитал, поправил и отправил сам, по одному
  // сообщению и с паузами. Аккаунт один на чтение и на письмо: если его
  // ограничат за рассылку, студия потеряет и ленту чатов.
  //
  // Первая же ошибка про аккаунт — PEER_FLOOD, FLOOD_WAIT — снимает всю
  // очередь; продолжать после неё значит менять аккаунт на десяток писем.
  let outreachStopped = false;
  setInterval(async () => {
    if (outreachStopped) return;
    let job;
    try {
      job = await nextQueued();
    } catch (error) {
      console.error("касания: очередь не прочиталась —", error?.message ?? error);
      return;
    }
    if (!job) return;

    try {
      await client.sendMessage(job.target, { message: job.message });
      await markSent(job.id);
      console.log(`касания: отправлено ${job.target} по сайту ${job.host}`);
    } catch (error) {
      const why = error?.errorMessage ?? error?.message ?? String(error);
      const { stopped } = await markFailed(job.id, why);
      outreachStopped = stopped;
      console.error(`касания: не ушло ${job.target} — ${why}${stopped ? " (очередь остановлена)" : ""}`);
    }
  }, OUTREACH_MS);

  let warnedNoChat = false;
  client.addEventHandler((event) => {
    const message = event.message;
    if (!message?.message) return;
    // Свои сообщения не разбираем: оператор отвечает из этого же аккаунта.
    if (message.out) return;

    const shaped = shape(message);
    if (!shaped) {
      // Один раз, а не на каждое: если такое повторяется, причина одна.
      if (!warnedNoChat) {
        warnedNoChat = true;
        console.error(`scout: сообщение ${message.id} пришло без чата — пропускаю такие`);
      }
      return;
    }
    buffer.push(shaped);
  }, new NewMessage({ chats: roster.opened.map((chat) => chat.id) }));

  const stop = async (signal) => {
    console.log(`scout: ${signal}, дочитываю накопленное`);
    await buffer.stop();
    await client.disconnect();
    if (bridge) await bridge.close();
    process.exit(0);
  };
  process.on("SIGINT", () => void stop("SIGINT"));
  process.on("SIGTERM", () => void stop("SIGTERM"));
}

await (DRY_RUN ? dryRun() : live());
