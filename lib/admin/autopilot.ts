import { TASHKENT_OFFSET_MS, periodStart } from "@/lib/admin/pulse";

/**
 * Автопрогон касаний — чистая часть: ниши по неделям, сколько писем
 * готовить, тексты для бота. База — в autopilot-store, ответ клиента — в
 * autopilot-reply.
 *
 * Владелец, 05.10.2026: «Делай авто прогон сам по нишам — 1 неделя = 1
 * ниша. Лидов, которые ответят на сообщения от тебя на наших аккаунтах, —
 * закидывай сразу через тг бота к менеджерам, чтобы взяли в работу. В день
 * ты делаешь 20 касаний (написано в тг, не меньше), можешь с двух аккаунтов
 * это делать или с трёх».
 *
 * Как это устроено.
 *
 * 1. Неделя — одна ниша (AUTOPILOT_NICHES, по кругу). Кампания автопоиска по
 *    картам этой ниши и следующей держится включённой: пока идёт эта неделя,
 *    пул следующей уже набирается.
 * 2. Каждые пять минут свип смотрит, сколько писем автопрогона сегодня
 *    ушло в Telegram и сколько ждут в очереди, и готовит недостающие — по
 *    тем же правилам, что «Связаться» у менеджера: проверка сайта по факту,
 *    письмо человеческим языком, проверка перед отправкой (prepareOutreach,
 *    queueOutreach). Писать — только тем, до кого дотянется Telegram: по
 *    @адресу или мобильному номеру.
 * 3. Отправляет скаут — с любого живого рабочего аккаунта, в общем пределе
 *    «три в час» на аккаунт и в окне 07:30–20:30. В счёт двадцати идёт
 *    только то, что на деле ушло в Telegram: письмо, которое ушло «руками»
 *    (номер без Telegram), счёт не пополняет — вместо него готовится новое.
 * 4. Касание ничьё, пока клиент не ответил. Ответил — заводится лид и идёт
 *    в очередь на тёплые лиды (днём — по очереди, ночью — всем), с шапкой
 *    «🤖 Ответ на касание автопрогона». Кто взял — того и лид, и переписка.
 * 5. В 18:00, в конце рабочего дня, владельцу и руководителю — отчёт:
 *    сколько написали и сколько ответили (владелец, 05.10.2026: «Отчёт по
 *    автоматическим касаниям мне и Александру каждый день от бота… сколько
 *    написали, сколько ответили в конце рабочего дня»).
 */

export type AutopilotNiche = {
  /** Ключ — то, что записывается в autopilot_weeks. Не менять после выкатки. */
  key: string;
  /** Как ниша называется в отчёте и в панели: «учебные центры». */
  label: string;
  /** То же на узбекской и польской панели. */
  uz: string;
  pl: string;
  /** Запрос кампании автопоиска по картам. */
  maps: string;
  /**
   * Чем ниша записана у карточек в пуле: названием кампании, с которой
   * пришла компания, или ключом классификатора сайта. Без учёта регистра.
   */
  match: readonly string[];
};

/**
 * Ниши по порядку. Первые шесть — те, по которым в пуле уже есть компании
 * (кампании заведены владельцем и руководителем), дальше — новые: их
 * кампания включается за неделю до их недели.
 */
export const AUTOPILOT_NICHES: readonly AutopilotNiche[] = [
  { key: "uchebnyy-centr", label: "учебные центры", uz: "o‘quv markazlari", pl: "centra szkoleniowe", maps: "учебный центр", match: ["учебный центр", "uchebnyy-centr", "IT Образование для детей"] },
  { key: "zastroyshchik", label: "застройщики", uz: "quruvchi kompaniyalar", pl: "deweloperzy", maps: "застройщик", match: ["застройщик", "stroitelnaya-kompaniya"] },
  { key: "stomatologiya", label: "стоматологии", uz: "stomatologiyalar", pl: "gabinety stomatologiczne", maps: "стоматология", match: ["стоматология", "stomatologiya"] },
  { key: "magazin-odezhdy", label: "магазины одежды", uz: "kiyim do‘konlari", pl: "sklepy odzieżowe", maps: "Магазин Одежды", match: ["Магазин Одежды", "internet-magazin"] },
  { key: "shkoly-sady", label: "частные школы и детские сады", uz: "xususiy maktablar va bog‘chalar", pl: "szkoły prywatne i przedszkola", maps: "Частная школа", match: ["Частная школа", "Частный детский сад"] },
  { key: "medcentr", label: "медицинские центры", uz: "tibbiyot markazlari", pl: "centra medyczne", maps: "медицинский центр", match: ["медицинский центр", "medcentr"] },
  { key: "avtoservis", label: "автосервисы", uz: "avtoservislar", pl: "warsztaty samochodowe", maps: "автосервис", match: ["автосервис", "avtoservis"] },
  { key: "salon-krasoty", label: "салоны красоты", uz: "go‘zallik salonlari", pl: "salony piękności", maps: "салон красоты", match: ["салон красоты", "salon-krasoty"] },
  { key: "mebel", label: "мебель на заказ", uz: "buyurtma mebel", pl: "meble na zamówienie", maps: "мебель на заказ", match: ["мебель на заказ", "mebel"] },
  { key: "nedvizhimost", label: "агентства недвижимости", uz: "ko‘chmas mulk agentliklari", pl: "agencje nieruchomości", maps: "агентство недвижимости", match: ["агентство недвижимости", "nedvizhimost", "agentstvo-nedvizhimosti"] },
  { key: "turagentstvo", label: "турагентства", uz: "turagentliklar", pl: "biura podróży", maps: "турагентство", match: ["турагентство", "turagentstvo"] },
  { key: "restoran", label: "рестораны", uz: "restoranlar", pl: "restauracje", maps: "ресторан", match: ["ресторан", "restoran", "dostavka-edy"] },
  { key: "fitnes", label: "фитнес-клубы", uz: "fitnes-klublar", pl: "kluby fitness", maps: "фитнес клуб", match: ["фитнес клуб", "fitnes"] },
];

export function nicheByKey(key: string | null | undefined): AutopilotNiche | null {
  return AUTOPILOT_NICHES.find((n) => n.key === key) ?? null;
}

/** Следующая ниша по кругу. Прошлой нет или её убрали из списка — первая. */
export function nextNiche(previous: string | null | undefined): AutopilotNiche {
  const at = AUTOPILOT_NICHES.findIndex((n) => n.key === previous);
  return AUTOPILOT_NICHES[(at + 1) % AUTOPILOT_NICHES.length];
}

/** Понедельник этой недели по Ташкенту: «2026-10-05». */
export function weekOf(now: Date): string {
  return periodStart("week", now);
}

/** Карточка из этой ниши — по тому, как ниша записана у неё. */
export function inNiche(niche: AutopilotNiche, value: string | null | undefined): boolean {
  const v = (value ?? "").trim().toLowerCase();
  return Boolean(v) && niche.match.some((m) => m.toLowerCase() === v);
}

/** Сколько писем в день по умолчанию — «20 касаний, не меньше». */
export const DAILY_TARGET = 20;

/**
 * Сколько писем автопрогона может одновременно ждать отправки.
 *
 * Очередь у скаута общая и идёт по времени постановки: двадцать писем
 * автопрогона, поставленные в 07:00 разом, на два часа задержали бы письма
 * менеджеров. Четыре — это меньше, чем три аккаунта отправляют за полчаса.
 */
export const IN_FLIGHT_MAX = 4;

/** Сколько писем готовить за проход свипа: каждое — до минуты (обход, проверка по факту, модель). */
export const PREPARE_PER_PASS = 2;

/**
 * Попыток в день не больше, чем столько раз по дневной норме.
 *
 * Попытка — карточка, взятая в работу: проверка по факту может ничего не
 * подтвердить, номер — не найтись в Telegram. Без потолка пустой или
 * негодный пул съел бы за день сотни обходов и вызовов модели.
 */
export const ATTEMPTS_PER_TARGET = 4;

/**
 * Когда готовить письма: с 07:00 до 17:30 по Ташкенту, каждый день.
 *
 * Отправка — с 07:30 (lib/admin/outreach.ts): к её началу первые письма уже
 * готовы. Заканчиваем за полчаса до конца рабочего дня: последние письма
 * успевают уйти до 18:00, ответы на них приходят, пока менеджеры на месте,
 * а отчёт в 18:00 видит день целиком.
 */
export const PREPARE_FROM_MINUTE = 7 * 60;
export const PREPARE_TO_MINUTE = 17 * 60 + 30;

export function prepareWindow(now: Date): boolean {
  const shifted = new Date(now.getTime() + TASHKENT_OFFSET_MS);
  const minute = shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
  return minute >= PREPARE_FROM_MINUTE && minute < PREPARE_TO_MINUTE;
}

/** Отчёт — в 18:00, в конце рабочего дня. */
export const REPORT_MINUTE = 18 * 60;

/**
 * За какой срок отчёт: сутки до него, то есть с прошлого отчёта. Не с
 * полуночи — иначе ответы, пришедшие вечером и ночью, не попали бы ни в
 * один отчёт: сегодняшний уже ушёл, а завтрашний считал бы с полуночи.
 */
export const REPORT_SPAN_MS = 24 * 3600_000;

export function reportDue(now: Date): boolean {
  const shifted = new Date(now.getTime() + TASHKENT_OFFSET_MS);
  return shifted.getUTCHours() * 60 + shifted.getUTCMinutes() >= REPORT_MINUTE;
}

/**
 * Сколько писем подготовить сейчас.
 *
 * Недостача до нормы считается от ушедшего и стоящего в очереди: письмо в
 * очереди почти всегда уходит, а если нет (номер без Telegram), следующий
 * проход увидит недостачу снова и подготовит замену.
 */
export function toPrepare(input: { sent: number; inFlight: number; attempts: number; target: number }): number {
  const short = input.target - input.sent - input.inFlight;
  const room = IN_FLIGHT_MAX - input.inFlight;
  const left = input.target * ATTEMPTS_PER_TARGET - input.attempts;
  return Math.max(0, Math.min(short, room, left, PREPARE_PER_PASS));
}

/**
 * От чьего имени пишет автопрогон. Касание ничьё, пока клиент не ответил, —
 * подписываться именем менеджера, который его не писал и, может быть, не
 * возьмёт, нельзя. Возьмут лид — дальше модель подписывается его именем.
 */
export const AUTOPILOT_SENDER = "DevUz Studio";

/** Первая строка карточки лида в боте — по ней менеджер узнаёт лид автопрогона. */
export const REPLY_MARK = "🤖 Ответ на касание автопрогона";

/** Шапка карточки лида в очереди: откуда лид и что клиент ответил. */
export function replyHeading(
  input: { host: string | null; label: string | null; words: string; niche: string | null },
  escape: (s: string) => string,
): string {
  const who = input.host ?? input.label ?? "компания без сайта";
  const words = input.words.replace(/\s+/g, " ").trim();
  const short = words.length > 300 ? `${words.slice(0, 299)}…` : words;
  return [
    `<b>${REPLY_MARK}</b> · ${escape(who)}`,
    input.niche ? `Ниша недели: ${escape(input.niche)}` : "",
    `Клиент ответил: «${escape(short)}»`,
    "Первое письмо и переписка — в карточке лида. Взяли — лид и разговор ваши: модель продолжит от вашего имени, «Отвечать самому» — в карточке.",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Кто ответил: сайт или название, и что с лидом. */
export type Replied = {
  who: string;
  /** Кто взял лид; null — ещё ничей. */
  takenBy: string | null;
  /** Попросил больше не писать: лида нет. */
  refused: boolean;
};

export type DayStats = {
  day: string;
  niche: string | null;
  target: number;
  enabled: boolean;
  /** Ушло в Telegram с рабочих аккаунтов. */
  sent: number;
  /** По аккаунтам: name — как назван в «Аккаунтах»; null — главный. */
  byAccount: readonly { name: string | null; n: number }[];
  inFlight: number;
  attempts: number;
  /** Номер без Telegram: письмо ушло в ручной маршрут — звонок или WhatsApp. */
  manual: number;
  /** Проверка по факту ничего не подтвердила, сайт не открылся, письмо не прошло проверку. */
  dropped: number;
  replies: number;
  taken: number;
  refused: number;
  weekSent: number;
  weekReplies: number;
  /** Кто ответил за срок отчёта — по одному на строку. */
  replied: readonly Replied[];
};

/** Слово при числе: 1 письмо, 3 письма, 5 писем. */
function ru(n: number, one: string, few: string, many: string): string {
  const d = n % 10;
  const dd = n % 100;
  if (d === 1 && dd !== 11) return one;
  if (d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return few;
  return many;
}

/** «06.10» из «2026-10-06». */
function shortDay(day: string): string {
  const [, m, d] = day.split("-");
  return `${d}.${m}`;
}

/** Сколько ответивших показывать поимённо — остальные одной строкой. */
export const REPLIED_SHOWN = 10;

/** Отчёт за сутки — владельцу и руководителю. HTML для бота. */
export function reportText(s: DayStats, escape: (t: string) => string): string {
  const accounts = s.byAccount.length
    ? ` (${s.byAccount.map(({ name, n }) => `${name === null ? "главный" : escape(name)} — ${n}`).join(", ")})`
    : "";
  const mark = s.sent >= s.target ? " ✅" : " ⚠️";
  // null — строки нет; "" — пустая строка между блоками.
  const lines: (string | null)[] = [
    `🤖 <b>Автопрогон касаний — отчёт за ${shortDay(s.day)}</b>`,
    s.niche ? `Ниша недели: ${escape(s.niche)}` : null,
    "<i>За сутки до 18:00 — с прошлого отчёта.</i>",
    s.enabled ? null : "⏸ Автопрогон выключен в разделе «Касания».",
    "",
    `✉️ Написали — ушло в Telegram: <b>${s.sent}</b> из ${s.target}${mark}${accounts}`,
    s.inFlight ? `Ждут отправки: ${s.inFlight} — уйдут сегодня до 20:30 или завтра с 07:30` : null,
    s.manual ? `Не нашлись в Telegram — карточки ушли на звонок: ${s.manual}` : null,
    s.dropped ? `Не написали — проверка по факту ничего не подтвердила или сайт не открылся: ${s.dropped}` : null,
    "",
    `💬 Ответили: <b>${s.replies}</b>${s.replies ? ` → взяли в работу: ${s.taken}${s.refused ? `, просили не писать: ${s.refused}` : ""}` : ""}`,
    ...s.replied
      .slice(0, REPLIED_SHOWN)
      .map((r) => `• ${escape(r.who)} — ${r.refused ? "просил не писать" : r.takenBy ? `взял ${escape(r.takenBy)}` : "⏳ ещё ничей — в очереди лидов"}`),
    s.replied.length > REPLIED_SHOWN ? `• и ещё ${s.replied.length - REPLIED_SHOWN}` : null,
    "",
    `С начала недели: ${s.weekSent} ${ru(s.weekSent, "письмо", "письма", "писем")}, ${s.weekReplies} ${ru(s.weekReplies, "ответ", "ответа", "ответов")}`,
  ];
  if (s.enabled && s.sent < s.target) {
    lines.push(
      s.attempts >= s.target * ATTEMPTS_PER_TARGET
        ? "Не добрали: кончились попытки на день — в пуле ниши мало годных компаний. Проверьте кампанию автопоиска."
        : "Не добрали: в пуле ниши кончились компании, до которых дотянется Telegram, или аккаунты были остановлены. Проверьте раздел «Аккаунты» и кампанию автопоиска.",
    );
  }
  return lines.filter((line): line is string => line !== null).join("\n");
}
