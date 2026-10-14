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

import { probeTunnel, startProxyBridge } from "./http-proxy-bridge.mjs";
import { directWebSocket } from "@/lib/egress.mjs";
import { createBuffer } from "@/lib/scout/buffer";
import { openChats } from "@/lib/scout/chats";
import { classify } from "@/lib/scout/classify";
import { DROP_LABEL } from "@/lib/scout/digest";
import { EMPTY_PULSE, accumulate, writePulse } from "@/lib/scout/health";
import { shape } from "@/lib/scout/shape";
import { processBatch } from "@/lib/scout/store";
import { nextStrikes, shouldExit } from "@/lib/scout/watchdog";
import { markDelivered, markFailed, markSent, markUnreachable, nextQueued } from "@/lib/admin/outreach-queue";
import { unreachableText, verdictForHandle, verdictForPhone } from "@/lib/admin/outreach-peer";
import { markCircleSkipped, markReplyFailed, markReplySent, nextReply, recordInbound } from "@/lib/admin/outreach-talk-store";
import { noCircle } from "@/lib/admin/hello-first";
import { hasMockupLink } from "@/lib/admin/mockup-offer";
import { claimMockupScan, finishMockupScan, recordMockupOut } from "@/lib/admin/mockup-offer-store";
import { SCAN_DIALOGS, SCAN_MS, SCAN_PAGE, SCAN_PAUSE_MS, inScan, scanSlot } from "@/lib/admin/mockup-scan";
import {
  CIRCLE_CHECK_MS,
  CIRCLE_LANGS,
  circleDue,
  circleFile,
  circleStates,
  pickCircles,
  recordCircle,
} from "@/lib/admin/circle-store";
import { isPromoPath } from "@/lib/partners/promo-rules";
import path from "node:path";
import { TOO_LATE, editOutcome, markEditFailed, markEdited, nextEdit, sentCheck } from "@/lib/admin/outreach-edit";
import { HOURLY_CAP, isStopError } from "@/lib/admin/outreach";
import {
  bloggerInbound,
  bloggerPhoto,
  isBloggerChat,
  markBloggerHelloFailed,
  markBloggerHelloSent,
  markBloggerReplyFailed,
  markBloggerReplySent,
  markBloggerUnreachable,
  nextBloggerHello,
  nextBloggerReply,
} from "@/lib/bloggers/tg-queue";
import { MAIN_ACCOUNT } from "@/lib/admin/work-accounts";
import { BAN_CHECK_MS, BAN_REPLY_WAIT_MS, spamBotVerdict } from "@/lib/admin/account-ban";
import { lastBanCheck, mainLimitUntil, markMainFlood, recordBanCheck } from "@/lib/admin/account-ban-store";
import { startAccounts } from "./accounts.mjs";

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
// Как часто отдавать ответы модели по уже начатым разговорам. Чаще, чем
// касания: это ответ человеку, который сам нам написал, и он ждёт. Предел
// на рассылку сюда не относится — ограничивают за первые письма незнакомым,
// а не за ответы в своей же переписке.
const REPLY_MS = Number(process.env.SCOUT_REPLY_MS || 30_000);
// Как часто смотреть в очередь правок отправленных писем. Правка — дело
// ручное и редкое, но окно на неё у Telegram 48 часов, так что не медлим.
const EDIT_MS = Number(process.env.SCOUT_EDIT_MS || 20_000);
const MAX_BATCH = Number(process.env.SCOUT_MAX_BATCH || 20);

/** Как часто сторож смотрит на соединение. Два промаха подряд — выход. */
const WATCHDOG_MS = 5 * 60_000;

/** Дата-центр 2 — если в сессии адреса нет. У аккаунта скаута он и есть. */
const TELEGRAM_DC_FALLBACK = "149.154.167.51";

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
  const { Api, TelegramClient } = telegram;
  const { StringSession } = telegram.sessions;
  const { NewMessage } = telegram.events;
  const { PromisedWebSockets } = telegram.extensions;

  const session = new StringSession(env("SCOUT_SESSION"));

  // Прокси тот же, что у остального приложения.
  //
  // Напрямую до Telegram с этого сервера дорога то есть, то нет, поэтому
  // основная — через прокси. Клиент ходит голым TCP, а HTTP-прокси он не
  // понимает; мост переводит одно в другое и живёт в этом же процессе.
  //
  // Но прокси тоже умирает — 25–26 сентября он молчал сутки, и скаут всё это
  // время перезапускался по кругу. Поэтому перед подключением проверяем,
  // пускает ли прокси до дата-центра из сессии; не пускает — идём напрямую.
  //
  // Напрямую — не голым TCP, а через WebSocket по 443, как Telegram Web:
  // голый TCP до дата-центра из России закрыт (26 сентября «Connection to
  // 149.154.167.51:443 timed out» при живом api.telegram.org), а
  // venus.web.telegram.org отвечает. Адрес дата-центра библиотека сама
  // переводит в веб-адрес, когда транспорт — WebSocket.
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || "";
  const dc = { host: session.serverAddress || TELEGRAM_DC_FALLBACK, port: session.port || 443 };
  const refused = proxyUrl ? await probeTunnel(proxyUrl, dc.host, dc.port) : null;
  const bridge = proxyUrl && !refused ? await startProxyBridge(proxyUrl) : null;
  if (bridge) {
    console.log(`scout: выхожу через прокси ${new URL(proxyUrl).host}`);
  } else {
    // Встроенный WebSocket ходит через прокси из .env — подставляем прямой.
    PromisedWebSockets.webSocketImpl = directWebSocket();
    if (refused) {
      console.error(`scout: прокси ${new URL(proxyUrl).host} не пускает к Telegram (${refused}) — подключаюсь напрямую через WebSocket`);
    } else {
      console.log("scout: прокси не задан — подключаюсь напрямую через WebSocket");
    }
  }

  const apiId = Number(env("SCOUT_API_ID"));
  const apiHash = env("SCOUT_API_HASH");
  /**
   * Клиент на сессию — той же дорогой к Telegram, что выбрана выше. Ею же
   * подключаются дополнительные рабочие аккаунты и вход новых: мост через
   * прокси пускает к любому дата-центру, не только к дата-центру главного.
   */
  const makeClient = (clientSession) =>
    new TelegramClient(clientSession, apiId, apiHash, {
      connectionRetries: 5,
      ...(bridge ? { proxy: bridge.socks } : { networkSocket: PromisedWebSockets }),
    });
  const client = makeClient(session);

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
  pulse = {
    ...pulse,
    chatsWatched: watched.length,
    chatsReading: reading,
    // Названия — в пульс, чтобы панель показала, куда вступать.
    unread: [...roster.outside.map((chat) => chat.name), ...roster.failed.map((chat) => chat.name)],
  };
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

  // ── Касания, переписка и правки — на каждом рабочем аккаунте ─────────
  //
  // Главный аккаунт и читает чаты, и пишет. Дополнительные подключаются из
  // панели и только пишут (scout/accounts.mjs). Работник у всех один и тот
  // же — startWorker ниже.
  const workers = new Map();
  /**
   * До какого времени ограничен главный аккаунт (мс). Хранится в базе
   * (lib/admin/account-ban-store.ts): раньше главный после PEER_FLOOD стоял
   * только до перезапуска скаута — а перезапускает его каждая выкатка, и он
   * снова пробовал писать с ограниченного номера.
   */
  let mainUntil = (await mainLimitUntil().catch(() => null)) ?? 0;
  /** Есть ли кроме этого аккаунта ещё кто-то, кто может писать первые письма. */
  const othersAlive = (key) => [...workers.entries()].some(([other, worker]) => other !== key && worker.canSend());
  workers.set(
    MAIN_ACCOUNT,
    startWorker({
      client,
      Api,
      NewMessage,
      key: MAIN_ACCOUNT,
      label: "главный",
      cap: () => HOURLY_CAP,
      paused: () => mainUntil > Date.now(),
      othersAlive,
      // Ограничение главного — в базу: оно переживает перезапуск, его видят
      // расчёт очереди и оповещение команды.
      onFlood: async (why) => {
        mainUntil = await markMainFlood(why).catch(() => Date.now() + 24 * 3600_000);
      },
      afterBanCheck: async () => {
        mainUntil = (await mainLimitUntil().catch(() => null)) ?? 0;
      },
    }),
  );
  const accounts = startAccounts({
    makeClient,
    StringSession,
    Api,
    apiId,
    apiHash,
    workers,
    startWorker: (options) => startWorker({ ...options, Api, NewMessage, othersAlive }),
  });

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
    await accounts.stop();
    await client.disconnect();
    if (bridge) await bridge.close();
    process.exit(0);
  };
  process.on("SIGINT", () => void stop("SIGINT"));
  process.on("SIGTERM", () => void stop("SIGTERM"));
}

/**
 * Работник рабочего аккаунта: первые касания, переписка, правки и входящее
 * в личку — на одном клиенте Telegram.
 *
 * Аккаунтов несколько (владелец, 02.10: «дополнительно будет 2 аккаунта для
 * связи с клиентами»), и у каждого свой работник: предел «два в час» и
 * остановка после PEER_FLOOD — про номер, а не про студию. Очередь одна, и
 * письмо берёт тот аккаунт, у которого освободилось место. Переписку и
 * правки ведёт тот, с которого ушло первое письмо (prospects.sent_via).
 *
 * `cap` и `paused` — функции, а не числа: владелец меняет предел и ставит
 * паузу в панели, и работник узнаёт об этом со следующим тиком.
 */
/** Telegram не нашёл собеседника по номеру: в кэше сессии его нет. */
function lostPeer(error) {
  return /input entity/i.test(error?.message ?? "");
}

function startWorker({ client, Api, NewMessage, key, label, cap, paused, othersAlive, onFlood, afterBanCheck = async () => {} }) {
  /**
   * Номера узбекских кружков, которые этот аккаунт сам положил в
   * «Избранное» (circle-store, pickCircles): по виду кружка язык не узнать.
   * Помнятся в базе — переживают перезапуск скаута.
   */
  let uzIds = [];
  const uzReady = circleStates()
    .then((states) => {
      uzIds = states.get(key)?.uzIds ?? [];
    })
    .catch(() => {});

  /** Кружки «Избранного» этого аккаунта по языкам: { ru, uz }, каждого может не быть. */
  const savedCircles = async () => {
    await uzReady;
    const [found, uzFile] = await Promise.all([
      client.getMessages("me", { limit: 30, filter: new Api.InputMessagesFilterRoundVideo() }),
      circleFile("uz").catch(() => null),
    ]);
    const notes = (found ?? [])
      .filter((m) => m?.media)
      .map((m) => ({ id: Number(m.id), date: Number(m.date), media: m.media, bytes: Number(m.media?.document?.size ?? 0) || null }));
    return pickCircles(notes, uzIds, uzFile?.bytes ?? null);
  };

  /**
   * Отправка тому, кто нам ответил.
   *
   * Номер пользователя Telegram находит только по кэшу сессии, а кэш живёт в
   * памяти и пропадает с перезапуском скаута: 08.10.2026 после выкатки
   * четыре кружка и письмо упали с «Could not find the input entity». Тогда
   * грузим диалоги (собеседник в них есть: он нам писал) и пробуем снова, а
   * не вышло — пишем на @адрес.
   */
  const toPeer = async (reply, send) => {
    try {
      return await send(reply.target);
    } catch (error) {
      if (!lostPeer(error)) throw error;
    }
    await client.getDialogs({ limit: 200 }).catch(() => {});
    try {
      return await send(reply.target);
    } catch (error) {
      if (!lostPeer(error) || !reply.fallback) throw error;
    }
    return send(reply.fallback);
  };

  const timers = [];
  // ── Касания ───────────────────────────────────────────────────────────
  //
  // Раньше здесь было написано «ничего не отправляет». Теперь отправляет —
  // но только то, что человек прочитал, поправил и отправил сам, по одному
  // сообщению и с паузами. Главный аккаунт один и на чтение, и на письмо:
  // если его ограничат за рассылку, студия потеряет и ленту чатов.
  //
  // Первая же ошибка про аккаунт — PEER_FLOOD, FLOOD_WAIT — останавливает
  // этот аккаунт: продолжать после неё значит менять его на десяток писем.
  // Письмо при этом возвращается в очередь, если писать есть кому ещё, и
  // снимается вся очередь, если некому (markFailed).
  let outreachStopped = false;
  const tag = key === MAIN_ACCOUNT ? "" : ` [${label}]`;

  /**
   * Счётчик для импортируемых номеров.
   *
   * Телеграм требует у каждого контакта в одной пачке свой clientId и
   * возвращает его обратно, чтобы было понятно, какой номер к какому
   * пользователю. Пачка здесь всегда из одного, но поле обязательное.
   */
  let contactSeq = 0;

  /**
   * Кому мы на самом деле пишем — спрашиваем до отправки, а не узнаём из
   * ошибки.
   *
   * Первые полсотни касаний ушли в каналы и ботов: @muradbuildings и @ivan
   * по виду не отличаются, а разница в том, что первому написать физически
   * нельзя. Знает об этом только телеграм.
   *
   * Разбор ответа — в lib/admin/outreach-peer.ts и без единого обращения к
   * сети: иначе эту ветку нельзя было бы прогнать тестом, не поднимая
   * телеграм.
   */
  const reachFor = async (job) => {
    if (job.kind === "phone") {
      // Номер сперва попадает в контакты аккаунта: без этого телеграм по
      // нему ничего не скажет. Имя — домен сайта: список контактов рабочего
      // аккаунта должен читаться, а не выглядеть свалкой номеров.
      contactSeq += 1;
      const imported = await client.invoke(
        new Api.contacts.ImportContacts({
          contacts: [
            new Api.InputPhoneContact({
              clientId: contactSeq,
              phone: job.target,
              firstName: job.host,
              lastName: "",
            }),
          ],
        }),
      );
      return { verdict: verdictForPhone(imported), imported: true };
    }

    const resolved = await client.invoke(
      new Api.contacts.ResolveUsername({ username: String(job.target).replace(/^@/, "") }),
    );
    return { verdict: verdictForHandle(resolved), imported: false };
  };

  /**
   * Отказы, которые говорят про адресата, а не про нас.
   *
   * Их нельзя путать: «такого адреса нет» — обычное дело и повод отдать
   * карточку человеку, а FLOOD_WAIT или PEER_FLOOD — повод немедленно
   * остановить очередь целиком.
   */
  const ABOUT_TARGET = /USERNAME_NOT_OCCUPIED|USERNAME_INVALID|PHONE_NOT_OCCUPIED|No user has|Cannot find any entity/i;

  // ── «Здравствуйте» блогерам ───────────────────────────────────────────
  //
  // ИИ-сотрудник «Блогеры» (lib/bloggers/tg-queue.ts): блогеру с Telegram в
  // шапке профиля — только приветствие, по тем же правилам, что компаниям:
  // окно отправки, общий с ними предел в час и пауза этого аккаунта, своя
  // дневная квота. Спрашиваем, только когда компаний в очереди нет: норма
  // касаний компаний — первая.
  const bloggerHello = async () => {
    let job;
    try {
      job = await nextBloggerHello(Date.now(), key, cap());
    } catch (error) {
      console.error("блогеры: очередь не прочиталась —", error?.message ?? error);
      return;
    }
    if (!job) return;
    let verdict;
    try {
      verdict = verdictForHandle(await client.invoke(new Api.contacts.ResolveUsername({ username: job.target.replace(/^@/, "") })));
    } catch (error) {
      const why = error?.errorMessage ?? error?.message ?? String(error);
      if (ABOUT_TARGET.test(why)) await markBloggerUnreachable(job.id, unreachableText("not_found", "handle"));
      else await markBloggerHelloFailed(job.id);
      console.error(`блогеры${tag}: ${job.target} не опознан — ${why}`);
      return;
    }
    if (!verdict.ok) {
      await markBloggerUnreachable(job.id, unreachableText(verdict.why, "handle"));
      console.log(`блогеры${tag}: ${job.target} — в Telegram не написать, блогер вернулся в Direct`);
      return;
    }
    try {
      await client.sendMessage(verdict.userId, { message: job.hello });
      await markBloggerHelloSent(job.id, verdict.userId, key, job.hello);
      console.log(`блогеры${tag}: «${job.hello}» — ${job.target} (@${job.handle} в Instagram)`);
    } catch (error) {
      const why = error?.errorMessage ?? error?.message ?? String(error);
      await markBloggerHelloFailed(job.id);
      if (isStopError(why)) {
        outreachStopped = true;
        await onFlood(why);
      }
      console.error(`блогеры${tag}: не ушло ${job.target} — ${why}${isStopError(why) ? " (аккаунт остановлен)" : ""}`);
    }
  };

  timers.push(setInterval(async () => {
    if (outreachStopped) return;
    // Пауза из панели или сутки после ограничения Telegram — письма ждут
    // другой аккаунт; переписка и правки при этом идут.
    if (paused()) return;
    let job;
    try {
      job = await nextQueued(Date.now(), key, cap());
    } catch (error) {
      console.error("касания: очередь не прочиталась —", error?.message ?? error);
      return;
    }
    if (!job) {
      await bloggerHello();
      return;
    }

    let reach;
    try {
      reach = await reachFor(job);
    } catch (error) {
      const why = error?.errorMessage ?? error?.message ?? String(error);
      if (ABOUT_TARGET.test(why)) {
        const note = unreachableText("not_found", job.kind);
        const next = await markUnreachable(job.id, note, job.kind, job.target);
        console.log(`касания: ${job.target} — ${note}${next === "phone" ? " Пробую по номеру." : ""}`);
      } else {
        const { stopped } = await markFailed(job.id, why, { othersAlive: othersAlive(key) });
        outreachStopped = stopped;
        if (stopped) await onFlood(why);
        console.error(`касания${tag}: адресат не опознан ${job.target} — ${why}${stopped ? " (аккаунт остановлен)" : ""}`);
      }
      return;
    }

    if (!reach.verdict.ok) {
      // Не провал: ничего не сломалось, просто автономно сюда не дотянуться.
      // Место в часовом пределе при этом не тратится — до отправки не дошло.
      const note = unreachableText(reach.verdict.why, job.kind);
      // Адрес оказался каналом или ботом — следующим тиком тот же проспект
      // пойдёт по номеру с сайта, если он мобильный (см. markUnreachable).
      const next = await markUnreachable(job.id, note, job.kind, job.target);
      console.log(`касания: ${job.target} — ${note}${next === "phone" ? " Пробую по номеру." : ""}`);
      return;
    }

    const userId = reach.verdict.userId;
    try {
      // Пишем найденному пользователю, а не строке с сайта: по номеру у
      // человека @адреса может не быть вовсе.
      //
      // Первым — только «Здравствуйте» (lib/admin/hello-first.ts): письмо о
      // сайте от незнакомца получает жалобы «спам», за них Telegram и
      // ограничивает аккаунт. Письмо уйдёт, когда клиент ответит.
      const sent = await client.sendMessage(userId, { message: job.hello });
      const messageId = sent?.id === undefined || sent?.id === null ? null : Number(sent.id);
      await markSent(job.id, userId, messageId, key, job.hello);
      console.log(`касания${tag}: «${job.hello}» — ${job.target} по сайту ${job.host}`);

      // И сразу перечитываем переписку.
      //
      // Ответ на отправку означает только, что сервер запрос принял. Что
      // сообщение лежит у адресата — это другое утверждение: антиспам
      // снимает его уже после приёма, а у заблокировавшего нас оно исчезает
      // молча, и ошибки нам в обоих случаях никто не покажет. Ищем по
      // номеру: не «в переписке что-то есть», а «в переписке есть именно
      // это».
      if (messageId === null) {
        await markDelivered(job.id, false, "Telegram не вернул номер сообщения");
      } else {
        try {
          const back = await client.getMessages(userId, { ids: [messageId] });
          /**
           * Удалённое сообщение приходит не пустым списком, а объектом
           * MessageEmpty с тем же номером: «место было, содержимого нет».
           * Проверка `!m.empty` этого не ловила — такого поля у объекта
           * нет вовсе, и она всегда была истинной, то есть подтверждала бы
           * доставку ровно в том случае, ради которого затевалась. Смотрим
           * на класс.
           *
           * `out` проверяем только когда он явно false: если библиотека его
           * не проставит, «не подтвердилось» посыпалось бы на каждой
           * отправке, а ложная тревога тут не лучше ложного спокойствия.
           */
          const found = (back ?? []).find(
            (m) => m && m.className === "Message" && Number(m.id) === messageId && m.out !== false,
          );
          if (found) {
            await markDelivered(job.id, true);
            console.log(`касания: подтверждено — сообщение ${messageId} лежит в переписке с ${job.target}`);
          } else {
            await markDelivered(job.id, false, "Отправка прошла, но сообщения в переписке нет — проверьте вручную");
            console.error(`касания: ${job.target} — сообщения ${messageId} в переписке нет`);
          }
        } catch (error) {
          // Не нашли из-за сбоя связи — это не «не дошло». Так и пишем:
          // непроверенное и неотправленное — разные новости, и путать их
          // значит либо пугать менеджера зря, либо успокаивать зря.
          const why = error?.errorMessage ?? error?.message ?? String(error);
          await markDelivered(job.id, false, `Проверить доставку не вышло: ${why}`);
        }
      }
    } catch (error) {
      const why = error?.errorMessage ?? error?.message ?? String(error);
      const { stopped } = await markFailed(job.id, why, { othersAlive: othersAlive(key) });
      outreachStopped = stopped;
      if (stopped) await onFlood(why);
      console.error(`касания${tag}: не ушло ${job.target} — ${why}${stopped ? " (аккаунт остановлен)" : ""}`);
    } finally {
      // Импортированный номер убираем из контактов сразу.
      //
      // Две причины. Телефонная книга рабочего аккаунта, распухшая от
      // проспектов, — это подпись рассылки, видная любому, кто её посмотрит.
      // И обратная сторона: телеграм показывает людям «ваш контакт
      // присоединился», и оставленный номер превращает наше касание в
      // уведомление у половины его знакомых.
      if (reach.imported) {
        try {
          await client.invoke(new Api.contacts.DeleteByPhones({ phones: [job.target] }));
        } catch (error) {
          console.error(`касания: номер ${job.target} остался в контактах —`, error?.errorMessage ?? error?.message ?? error);
        }
      }
    }
  }, OUTREACH_MS));

  // Блогеру, который ответил на «Здравствуйте», — текст о партнёрской
  // программе с того же аккаунта (lib/bloggers/tg-queue.ts).
  const bloggerReply = async () => {
    let reply;
    try {
      reply = await nextBloggerReply(key);
    } catch (error) {
      console.error("блогеры: ответы не прочитались —", error?.message ?? error);
      return;
    }
    if (!reply) return;
    try {
      await toPeer(reply, (to) => client.sendMessage(to, { message: reply.body }));
      await markBloggerReplySent(reply.id);
      console.log(`блогеры${tag}: текст о программе — @${reply.handle}`);
    } catch (error) {
      const why = error?.errorMessage ?? error?.message ?? String(error);
      await markBloggerReplyFailed(reply.id, why);
      console.error(`блогеры${tag}: ответ не ушёл @${reply.handle} — ${why}`);
    }
  };

  // ── Переписка по касаниям ─────────────────────────────────────────────
  //
  // Ответы модели тем, кто ответил на наше письмо. Очередь отдельная от
  // касаний и без часового предела: он про первые письма незнакомым людям,
  // а молчать в ответ на вопрос клиента — не осторожность, а потеря лида.
  timers.push(setInterval(async () => {
    let reply;
    try {
      reply = await nextReply(key);
    } catch (error) {
      console.error("переписка: очередь не прочиталась —", error?.message ?? error);
      return;
    }
    if (!reply) {
      await bloggerReply();
      return;
    }

    try {
      if (reply.kind === "circle") {
        // Кружок тем, кто ответил на «Здравствуйте» по-русски или
        // по-узбекски (lib/admin/hello-first.ts) — копия кружка на языке
        // ответа из «Избранного» этого аккаунта, не пересылка: у пересланного
        // стояло бы «переслано от». Не ушёл — вместо него встаёт письмо
        // (markCircleSkipped).
        const circle = (await savedCircles())[reply.lang];
        if (!circle) {
          await markCircleSkipped(reply.id, noCircle(reply.lang));
          console.log(`переписка${tag}: кружка (${reply.lang}) в «Избранном» нет — ${reply.target} уйдёт письмо`);
          return;
        }
        const sentCircle = await toPeer(reply, (to) => client.sendFile(to, { file: circle.media }));
        await markReplySent(reply.id, sentCircle?.id ?? null);
        console.log(`переписка${tag}: кружок (${reply.lang}) ${reply.target} по сайту ${reply.host}`);
        return;
      }
      // Номер ушедшего — для «Исправить» (lib/admin/outreach-edit.ts).
      const sent = await toPeer(reply, (to) => client.sendMessage(to, { message: reply.body }));
      await markReplySent(reply.id, sent?.id ?? null);
      console.log(`переписка${tag}: ответил ${reply.target} по сайту ${reply.host}`);
    } catch (error) {
      const why = error?.errorMessage ?? error?.message ?? String(error);
      // Не ушёл кружок — вместо него уходит письмо, разговор у бота.
      if (reply.kind === "circle") await markCircleSkipped(reply.id, `Кружок не ушёл: ${why}`);
      else await markReplyFailed(reply.id, why);
      console.error(`переписка${tag}: ${reply.kind === "circle" ? "кружок" : "ответ"} не ушёл ${reply.target} — ${why}`);
    }
  }, REPLY_MS));

  // ── Кружки в «Избранном» ──────────────────────────────────────────────
  //
  // Кружок из «Избранного» аккаунта уходит тем, кто ответил на
  // «Здравствуйте»: русский — ответившим по-русски, узбекский — по-узбекски
  // (владелец, 12.10.2026). Есть ли они — видно только из сессии, поэтому
  // смотрим раз в десять минут и пишем в базу: панель показывает это в
  // «Аккаунтах».
  //
  // Кружок, загруженный в «Аккаунтах» или присланный боту
  // (lib/admin/circle-store.ts), скаут кладёт в «Избранное» сам: загружен
  // позже того, что там лежит на этом языке, — уходит туда кружком, с
  // длительностью и размером, иначе Telegram покажет 0:00. Узбекский
  // запоминается по номеру сообщения, прежний узбекский удаляется, чтобы
  // его не приняли за русский. Атрибут видео — только наш: флаг videoNote в
  // teleproto добавляет ещё и «голосовое», и сообщение превращается в аудио.
  const posted = new Set();
  const placeCircle = async (lang, current) => {
    const file = await circleFile(lang);
    const savedAt = current ? Number(current.date) * 1000 : null;
    const mark = `${lang}:${file?.uploadedAt}`;
    if (!file || !circleDue(file, savedAt) || posted.has(mark) || !isPromoPath(file.path)) return false;
    const media = process.env.MEDIA_HOST_DIR || "/var/lib/devuz/media";
    const sent = await client.sendFile("me", {
      file: path.join(media, "promo", file.path),
      attributes: [
        new Api.DocumentAttributeVideo({
          roundMessage: true,
          supportsStreaming: true,
          duration: file.duration,
          w: file.width,
          h: file.height,
        }),
      ],
    });
    // Отметка — после отправки: не ушёл — попробуем в следующий взгляд, а
    // ушёл — второй раз не кладём, даже если Telegram ещё не отдал его в
    // «Избранном» (дата сообщения — по часам Telegram, не по нашим).
    posted.add(mark);
    if (lang === "uz" && sent?.id !== undefined) {
      const old = uzIds;
      uzIds = [Number(sent.id), ...old].slice(0, 20);
      // Прежний узбекский — из «Избранного» долой. Не удалился — он всё
      // равно в списке и за русский не сойдёт.
      if (old.length) await client.deleteMessages("me", old, { revoke: true }).catch(() => {});
    }
    console.log(`кружок${tag}: загруженный кружок (${lang}) положил в «Избранное»`);
    return true;
  };
  const checkCircle = async () => {
    try {
      let circles = await savedCircles();
      for (const lang of CIRCLE_LANGS) {
        const placed = await placeCircle(lang, circles[lang]).catch((error) => {
          console.error(`кружок${tag}: не положил кружок (${lang}) в «Избранное» —`, error?.errorMessage ?? error?.message ?? error);
          return false;
        });
        if (placed) circles = await savedCircles();
      }
      const at = (circle) => (circle ? Number(circle.date) * 1000 : null);
      await recordCircle(key, { savedAt: at(circles.ru), uzSavedAt: at(circles.uz), uzIds });
    } catch (error) {
      console.error(`кружок${tag}: «Избранное» не прочиталось —`, error?.errorMessage ?? error?.message ?? error);
    }
  };
  timers.push(
    setTimeout(() => {
      void checkCircle();
      timers.push(setInterval(checkCircle, CIRCLE_CHECK_MS));
    }, 60_000),
  );

  // ── Правка отправленных касаний ───────────────────────────────────────
  //
  // Уже ушедшее письмо поправить может только тот, кто его отправил, — этот
  // аккаунт, и только 48 часов. Строку в очередь кладёт человек (см.
  // lib/admin/outreach-edit.ts), скаут правит.
  timers.push(setInterval(async () => {
    let job;
    try {
      job = await nextEdit(key);
    } catch (error) {
      console.error("правка: очередь не прочиталась —", error?.message ?? error);
      return;
    }
    if (!job) return;

    try {
      // Сначала читаем само письмо. В личке номера сообщений общие на весь
      // аккаунт, так что хватает номера, а ответ заодно приносит адресата с
      // ключом доступа.
      const found = await client.invoke(
        new Api.messages.GetMessages({ id: [new Api.InputMessageID({ id: job.messageId })] }),
      );
      const check = sentCheck(found, job);
      if (!check.ok) {
        await markEditFailed(job.id, check.why);
        console.error(`правка: ${job.host} — ${check.why}`);
        return;
      }
      await client.editMessage(check.user, { message: job.messageId, text: job.body });
      await markEdited(job);
      console.log(`правка: письмо ${job.messageId} по сайту ${job.host} исправлено`);
    } catch (error) {
      const why = error?.errorMessage ?? error?.message ?? String(error);
      const outcome = editOutcome(why);
      if (outcome === "done") {
        await markEdited(job);
        console.log(`правка: письмо по сайту ${job.host} уже в нужном виде`);
      } else {
        await markEditFailed(job.id, outcome === "expired" ? TOO_LATE : why);
        console.error(`правка: не вышло по сайту ${job.host} — ${why}`);
      }
    }
  }, EDIT_MS));

  // Входящее из лички: это может быть ответ на наше касание.
  //
  // Отдельный обработчик, а не расширение чатового: тот отбирает сообщения
  // по списку открытых чатов, а личка в этот список не входит и входить не
  // должна — в ленту оператора чужая переписка попадать не может.
  //
  // Кто именно написал, решает база: адрес ищется среди тех, кому мы уже
  // писали. Не нашёлся — значит человек пишет по своему делу, и это не
  // наше: аккаунт рабочий, в него пишут и помимо касаний.
  const inbound = async (event) => {
    const message = event.message;
    // Скриншот статистики от блогера (lib/bloggers/tg-queue.ts): качаем
    // картинку, только если пишет блогер из нашей переписки, — чужие фото в
    // рабочий аккаунт не трогаем.
    if (message && !message.out && message.isPrivate && message.photo) {
      try {
        const sender = await message.getSender();
        const id = sender?.id === undefined || sender?.id === null ? "" : String(sender.id);
        if (id && !sender.bot && (await isBloggerChat(id))) {
          const file = await client.downloadMedia(message, {});
          if (file && file.length <= 5 * 1024 * 1024) {
            await bloggerPhoto({ handle: sender.username ? String(sender.username) : "", userId: id, mediaType: "image/jpeg", data: Buffer.from(file).toString("base64") });
            console.log(`блогеры${tag}: скриншот от ${sender.username ? `@${sender.username}` : `id ${id}`}`);
          }
        }
      } catch (error) {
        console.error("блогеры: картинка не скачалась —", error?.message ?? error);
      }
    }
    if (!message?.message || message.out) return;
    if (!message.isPrivate) return;

    // Кто написал — по id в первую очередь.
    //
    // Адреса может не быть вовсе: по номеру находятся как раз такие люди, а
    // маршрут «телефон» для нас основной там, где телеграма на сайте нет.
    // Пока сверялись только по @адресу, их ответы не находили своего
    // разговора и молча уходили в никуда.
    let handle = "";
    let userId = "";
    // Номер виден, если клиент в контактах аккаунта: менеджер, написавший
    // ему руками по номеру с сайта, сначала добавил его туда. Только по нему
    // и узнаётся касание, сделанное мимо скаута, — id такого клиента у нас нет.
    let phone = "";
    try {
      const sender = await message.getSender();
      if (sender?.bot) return;
      handle = sender?.username ? String(sender.username) : "";
      userId = sender?.id === undefined || sender?.id === null ? "" : String(sender.id);
      phone = sender?.phone ? String(sender.phone) : "";
    } catch (error) {
      console.error("переписка: не узнал отправителя —", error?.message ?? error);
      return;
    }
    if (!handle && !userId) return;

    try {
      // Ключ аккаунта — чтобы разговор, начатый менеджером руками с этого
      // аккаунта, перешёл сюда же и бот продолжил его отсюда.
      const hit = await recordInbound({ handle, userId, phone, account: key, body: String(message.message) });
      if (!hit.matched) {
        // Не компания — может быть, блогер ответил на наше «Здравствуйте».
        const blogger = await bloggerInbound({ handle, userId, account: key, body: String(message.message) });
        if (blogger.matched) console.log(`блогеры${tag}: ответ от @${blogger.handle}`);
      }
      if (hit.matched) {
        console.log(
          `переписка${tag}: ответ от ${handle ? `@${handle}` : `id ${userId}`} по сайту ${hit.host} (${hit.verdict})` +
            (hit.bound ? " — касание руками, разговор переведён на этот аккаунт" : ""),
        );
      }
    } catch (error) {
      console.error("переписка: входящее не записалось —", error?.message ?? error);
    }
  };
  const inboundEvent = new NewMessage({ incoming: true });
  client.addEventHandler(inbound, inboundEvent);

  // Своё исходящее со ссылкой на макет — менеджер отправил его руками с
  // этого аккаунта: у клиента пошли 48 часов акции (lib/admin/mockup-offer).
  // Остальные свои сообщения не разбираем, как и раньше.
  const outbound = async (event) => {
    const message = event.message;
    if (!message?.out || !message.isPrivate || !message.message) return;
    const text = String(message.message);
    if (!hasMockupLink(text)) return;
    try {
      const peer = await message.getChat();
      if (peer?.bot) return;
      const started = await recordMockupOut({
        account: key,
        userId: peer?.id === undefined || peer?.id === null ? "" : String(peer.id),
        handle: peer?.username ? String(peer.username) : "",
        body: text,
      });
      if (started) console.log(`макет${tag}: ушёл ${peer?.username ? `@${peer.username}` : `id ${peer?.id}`} — акция 48 часов пошла`);
    } catch (error) {
      console.error("макет: отправку не записал —", error?.message ?? error);
    }
  };
  client.addEventHandler(outbound, new NewMessage({ outgoing: true }));

  // ── Скан макетов: в 09:00 и 15:00 по Ташкенту ─────────────────────────
  //
  // Владелец, 14.10.2026: «Идентифицируй макеты по нашей ссылке… пусть бот
  // сканирует 2 раза в день и вносит туда эти данные». Обработчик выше не
  // видит того, что ушло, пока скаут перезапускался, — скан проходит диалоги
  // этого аккаунта за 14 дней и записывает свои исходящие со ссылкой на
  // макет с датой самого сообщения. Старое клиенту задним числом не пишется
  // (lib/admin/mockup-scan.ts). Бережно к Telegram: один список диалогов,
  // дальше по одному диалогу с паузой, не больше SCAN_DIALOGS; ограниченный
  // аккаунт не сканирует, любая ошибка (и FLOOD_WAIT) останавливает скан
  // до следующего слота.
  let scanning = false;
  const scanMockups = async () => {
    if (scanning || paused()) return;
    const now = new Date();
    const slot = scanSlot(now);
    if (!slot) return;
    scanning = true;
    let seen = 0;
    let found = 0;
    let failure = null;
    let claimed = false;
    try {
      claimed = await claimMockupScan(key, slot);
      if (!claimed) return;
      const since = now.getTime() - SCAN_MS;
      const dialogs = await client.getDialogs({ limit: 100 });
      const people = (dialogs ?? [])
        .filter((d) => d?.isUser && !d.entity?.bot && !d.entity?.self && Number(d.date ?? 0) * 1000 >= since)
        .slice(0, SCAN_DIALOGS);
      for (const dialog of people) {
        if (paused()) break;
        await new Promise((resolve) => setTimeout(resolve, SCAN_PAUSE_MS));
        const history = await client.getMessages(dialog.entity, { limit: SCAN_PAGE });
        seen += 1;
        const mine = (history ?? [])
          .filter((m) => m?.out && m.message && hasMockupLink(String(m.message)) && inScan(new Date(Number(m.date) * 1000), now))
          // Старые сначала: срок акции — от первой отправки.
          .sort((a, b) => Number(a.date) - Number(b.date));
        for (const m of mine) {
          found += await recordMockupOut({
            account: key,
            userId: dialog.entity?.id === undefined || dialog.entity?.id === null ? "" : String(dialog.entity.id),
            handle: dialog.entity?.username ? String(dialog.entity.username) : "",
            body: String(m.message),
            at: new Date(Number(m.date) * 1000),
            scan: { now },
          });
        }
      }
      console.log(`скан макетов${tag}: ${seen} диалогов, новых макетов ${found}`);
    } catch (error) {
      failure = String(error?.errorMessage ?? error?.message ?? error);
      // Лимит на чтение — не повод останавливать отправку: просто ждём
      // следующего слота.
      console.error(`скан макетов${tag}: остановлен —`, failure);
    } finally {
      scanning = false;
    }
    if (claimed) await finishMockupScan(key, slot, { seen, found, error: failure }).catch(() => {});
  };
  // Раз в 10 минут смотрим, не пора ли; со сдвигом, чтобы аккаунты не шли разом.
  timers.push(
    setTimeout(() => {
      void scanMockups();
      timers.push(setInterval(scanMockups, 10 * 60_000));
    }, 3 * 60_000 + Math.floor(Math.random() * 4 * 60_000)),
  );

  // ── Ограничен ли аккаунт: раз в час спрашиваем @SpamBot ──────────────
  //
  // Владелец, 07.10.2026: «Проводи проверку каждый час на предмет бана с
  // уведомлением от бота всем». @SpamBot — служба Telegram: на /start он
  // отвечает, ограничен ли аккаунт и до какого времени. Раньше об
  // ограничении узнавали только по отказу на отправке, и то не все. Ответ
  // разбирается в lib/admin/account-ban.ts, пишется в базу, а команде
  // говорит свип (lib/admin/account-ban-sweep.ts). Сообщения от ботов
  // обработчик лички выше пропускает, так что ответ @SpamBot за ответ
  // клиента не примут.
  const checkBan = async () => {
    try {
      const bot = await client.getInputEntity("SpamBot");
      const asked = await client.sendMessage(bot, { message: "/start" });
      const askedId = Number(asked?.id ?? 0);
      let reply = null;
      for (let waited = 0; waited < BAN_REPLY_WAIT_MS && !reply; waited += 2000) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const recent = await client.getMessages(bot, { limit: 5 });
        reply = (recent ?? []).find((m) => m && !m.out && m.message && Number(m.id) > askedId) ?? null;
      }
      if (!reply) {
        console.error(`бан${tag}: @SpamBot не ответил`);
        return;
      }
      const text = String(reply.message);
      const verdict = spamBotVerdict(text, Date.now());
      await recordBanCheck(key, verdict, text);
      await afterBanCheck(verdict);
      console.log(
        `бан${tag}: ` +
          (verdict === null
            ? `ответ не разобран — «${text.slice(0, 120)}»`
            : verdict.limited
              ? `ограничен${verdict.until ? ` до ${new Date(verdict.until).toISOString()}` : ", срок не назван"}`
              : "ограничений нет"),
      );
    } catch (error) {
      console.error(`бан${tag}: проверка не удалась —`, error?.errorMessage ?? error?.message ?? error);
    }
  };
  // Раз в час, а не при каждом старте: скаут перезапускает каждая выкатка.
  // Первая — когда с прошлой проверки пройдёт час, но не раньше чем через
  // пару минут после старта (со сдвигом, чтобы аккаунты не спрашивали разом).
  let halted = false;
  void lastBanCheck(key)
    .catch(() => null)
    .then((last) => {
      // Аккаунт успели отключить, пока читали базу, — таймер не заводим.
      if (halted) return;
      const jitter = 2 * 60_000 + Math.floor(Math.random() * 3 * 60_000);
      const due = last ? Math.max(jitter, last + BAN_CHECK_MS - Date.now()) : jitter;
      timers.push(
        setTimeout(() => {
          void checkBan();
          timers.push(setInterval(checkBan, BAN_CHECK_MS));
        }, due),
      );
    });

  return {
    /** Может ли этот аккаунт сейчас писать первые письма — для соседей по очереди. */
    canSend: () => !outreachStopped && !paused(),
    stop: () => {
      halted = true;
      for (const timer of timers) clearInterval(timer);
      client.removeEventHandler(inbound, inboundEvent);
    },
  };
}


await (DRY_RUN ? dryRun() : live());
