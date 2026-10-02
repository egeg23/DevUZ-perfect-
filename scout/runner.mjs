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
import { markReplyFailed, markReplySent, nextReply, recordInbound } from "@/lib/admin/outreach-talk-store";
import { TOO_LATE, editOutcome, markEditFailed, markEdited, nextEdit, sentCheck } from "@/lib/admin/outreach-edit";
import { HOURLY_CAP } from "@/lib/admin/outreach";
import { MAIN_ACCOUNT } from "@/lib/admin/work-accounts";
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
      paused: () => false,
      othersAlive,
      // Главный после ограничения стоит до перезапуска, как и раньше.
      onFlood: async () => {},
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
function startWorker({ client, Api, NewMessage, key, label, cap, paused, othersAlive, onFlood }) {
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
    if (!job) return;

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
      const sent = await client.sendMessage(userId, { message: job.message });
      const messageId = sent?.id === undefined || sent?.id === null ? null : Number(sent.id);
      await markSent(job.id, userId, messageId, key);
      console.log(`касания${tag}: отправлено ${job.target} по сайту ${job.host}`);

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
    if (!reply) return;

    try {
      await client.sendMessage(reply.target, { message: reply.body });
      await markReplySent(reply.id);
      console.log(`переписка${tag}: ответил ${reply.target} по сайту ${reply.host}`);
    } catch (error) {
      const why = error?.errorMessage ?? error?.message ?? String(error);
      await markReplyFailed(reply.id, why);
      console.error(`переписка${tag}: ответ не ушёл ${reply.target} — ${why}`);
    }
  }, REPLY_MS));

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
    try {
      const sender = await message.getSender();
      handle = sender?.username ? String(sender.username) : "";
      userId = sender?.id === undefined || sender?.id === null ? "" : String(sender.id);
    } catch (error) {
      console.error("переписка: не узнал отправителя —", error?.message ?? error);
      return;
    }
    if (!handle && !userId) return;

    try {
      const hit = await recordInbound({ handle, userId, body: String(message.message) });
      if (hit.matched) {
        console.log(`переписка${tag}: ответ от ${handle ? `@${handle}` : `id ${userId}`} по сайту ${hit.host} (${hit.verdict})`);
      }
    } catch (error) {
      console.error("переписка: входящее не записалось —", error?.message ?? error);
    }
  };
  const inboundEvent = new NewMessage({ incoming: true });
  client.addEventHandler(inbound, inboundEvent);

  return {
    /** Может ли этот аккаунт сейчас писать первые письма — для соседей по очереди. */
    canSend: () => !outreachStopped && !paused(),
    stop: () => {
      for (const timer of timers) clearInterval(timer);
      client.removeEventHandler(inbound, inboundEvent);
    },
  };
}


await (DRY_RUN ? dryRun() : live());
