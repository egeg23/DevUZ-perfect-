import { TASHKENT_OFFSET_MS, periodStart } from "@/lib/admin/pulse";

/**
 * Автопрогон касаний — чистая часть: сколько писем готовить, тексты для
 * бота, ниши для поиска компаний. База — в autopilot-store, ответ клиента —
 * в autopilot-reply, поиск лидов через Firecrawl — в lead-search.
 *
 * Владелец, 05.10.2026: «Лидов, которые ответят на сообщения от тебя на
 * наших аккаунтах, — закидывай сразу через тг бота к менеджерам, чтобы взяли
 * в работу. В день ты делаешь 20 касаний (написано в тг, не меньше), можешь с
 * двух аккаунтов это делать или с трёх».
 *
 * Владелец, 06.10.2026: «Нам главное не 20 попыток связаться, а не
 * останавливать поиск, пока 20 сообщений не будут отправлены. Убираем
 * правило — 1 неделя = 1 ниша. Любые ниши».
 *
 * Как это устроено.
 *
 * 1. Ниши — любые: автопрогон берёт компании из всего пула, худший сайт
 *    первым. Пул пополняют кампании автопоиска по картам — по каждой нише из
 *    AUTOPILOT_NICHES кампания заводится сама — и поиск через Firecrawl
 *    (lib/admin/lead-search.ts).
 * 2. Каждые пять минут свип смотрит, сколько писем автопрогона сегодня
 *    ушло в Telegram и сколько ждут в очереди, и готовит недостающие — по
 *    тем же правилам, что «Связаться» у менеджера: проверка сайта по факту,
 *    письмо человеческим языком, проверка перед отправкой (prepareOutreach,
 *    queueOutreach). Писать — только тем, до кого дотянется Telegram: по
 *    @адресу или мобильному номеру (скаут добавляет номер в контакты, и
 *    Telegram находит по нему аккаунт).
 * 3. Отправляет скаут — с любого живого рабочего аккаунта, в общем пределе
 *    «три в час» на аккаунт и в окне 07:30–20:30. В счёт двадцати идёт
 *    только то, что на деле ушло в Telegram: письмо, которое ушло «руками»
 *    (номер без Telegram), счёт не пополняет — вместо него готовится новое,
 *    и так до двадцати.
 * 4. Касание ничьё, пока клиент не ответил. Ответил — заводится лид и идёт
 *    в очередь на тёплые лиды (днём — по очереди, ночью — всем), с шапкой
 *    «🤖 Ответ на касание автопрогона». Кто взял — того и лид, и переписка.
 * 5. В 18:00, в конце рабочего дня, владельцу и руководителю — отчёт:
 *    сколько написали и сколько ответили (владелец, 05.10.2026: «Отчёт по
 *    автоматическим касаниям мне и Александру каждый день от бота… сколько
 *    написали, сколько ответили в конце рабочего дня»).
 */

export type AutopilotNiche = {
  /** Ключ ниши. */
  key: string;
  /** Как ниша называется в шапке лида: «учебные центры». */
  label: string;
  /** Запрос кампании автопоиска по картам — им же ниша записана у карточек, пришедших с карт. */
  maps: string;
};

/**
 * Ниши, по которым держатся кампании автопоиска по картам и идёт поиск
 * через Firecrawl. Писать автопрогон может любой компании из пула — этот
 * список только про то, где искать новые.
 */
export const AUTOPILOT_NICHES: readonly AutopilotNiche[] = [
  { key: "uchebnyy-centr", label: "учебные центры", maps: "учебный центр" },
  { key: "zastroyshchik", label: "застройщики", maps: "застройщик" },
  { key: "stomatologiya", label: "стоматологии", maps: "стоматология" },
  { key: "magazin-odezhdy", label: "магазины одежды", maps: "Магазин Одежды" },
  { key: "shkoly-sady", label: "частные школы и детские сады", maps: "Частная школа" },
  { key: "medcentr", label: "медицинские центры", maps: "медицинский центр" },
  { key: "avtoservis", label: "автосервисы", maps: "автосервис" },
  { key: "salon-krasoty", label: "салоны красоты", maps: "салон красоты" },
  { key: "mebel", label: "мебель на заказ", maps: "мебель на заказ" },
  { key: "nedvizhimost", label: "агентства недвижимости", maps: "агентство недвижимости" },
  { key: "turagentstvo", label: "турагентства", maps: "турагентство" },
  { key: "restoran", label: "рестораны", maps: "ресторан" },
  { key: "fitnes", label: "фитнес-клубы", maps: "фитнес клуб" },
];

/**
 * Как ниша карточки читается человеком: ключ классификатора сайта
 * («stomatologiya») или кампания с карт («стоматология») — названием из
 * списка, всё остальное — как записано.
 */
export function nicheLabel(value: string | null | undefined): string | null {
  const v = (value ?? "").trim();
  if (!v) return null;
  const low = v.toLowerCase();
  return AUTOPILOT_NICHES.find((n) => n.key === low || n.maps.toLowerCase() === low)?.label ?? v;
}

/** Понедельник этой недели по Ташкенту: «2026-10-05». Для счёта «с начала недели». */
export function weekOf(now: Date): string {
  return periodStart("week", now);
}

/** Сколько писем в день по умолчанию — «20 касаний, не меньше». */
export const DAILY_TARGET = 20;

/**
 * Норма по субботам и воскресеньям — не меньше шестидесяти.
 *
 * Владелец, 17.10.2026: «Давай делать автоматические касания через наши
 * рабочие аккаунты и в выходные, больше шанс на ответ руководителя и они не
 * на работе. Начинаем с сегодня!» По будням аккаунты делят менеджеры и
 * автопрогон; в выходные менеджеры не пишут, и автопрогон берёт их долю.
 * Шестьдесят — по 15 на каждый из четырёх рабочих аккаунтов: в пределе
 * «три в час» за день их уходит до 39 с каждого, так что запас остаётся.
 */
export const WEEKEND_TARGET = 60;

/** Суббота или воскресенье по Ташкенту. */
export function weekendInTashkent(now: Date): boolean {
  const day = new Date(now.getTime() + TASHKENT_OFFSET_MS).getUTCDay();
  return day === 0 || day === 6;
}

/** Норма на этот день: в выходные — не меньше WEEKEND_TARGET. */
export function targetFor(now: Date, target: number): number {
  return weekendInTashkent(now) ? Math.max(target, WEEKEND_TARGET) : target;
}

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
 * подтвердить, номер — не найтись в Telegram. Владелец, 06.10.2026: «не
 * останавливать поиск, пока 20 сообщений не будут отправлены» — поэтому
 * потолок высокий: двести попыток на двадцать писем. Он только страхует от
 * поломки, при которой каждое письмо отбраковывается, — без него такая
 * поломка съела бы за день сотни обходов и вызовов модели.
 */
export const ATTEMPTS_PER_TARGET = 10;

/**
 * Когда готовить письма: с 07:00 до 17:30 по Ташкенту, каждый день.
 *
 * Отправка — с 07:30 (lib/admin/outreach.ts): к её началу первые письма уже
 * готовы. Заканчиваем за полчаса до конца рабочего дня: последние письма
 * успевают уйти до 18:00, ответы на них приходят, пока менеджеры на месте,
 * а отчёт в 18:00 видит день целиком.
 *
 * В выходные рабочего дня нет: письма готовятся до 20:00 — последние уходят
 * до конца окна отправки в 20:30, — и отчёт приходит в 20:30.
 */
export const PREPARE_FROM_MINUTE = 7 * 60;
export const PREPARE_TO_MINUTE = 17 * 60 + 30;
export const WEEKEND_PREPARE_TO_MINUTE = 20 * 60;

function tashkentMinute(now: Date): number {
  const shifted = new Date(now.getTime() + TASHKENT_OFFSET_MS);
  return shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
}

export function prepareWindow(now: Date): boolean {
  const minute = tashkentMinute(now);
  const to = weekendInTashkent(now) ? WEEKEND_PREPARE_TO_MINUTE : PREPARE_TO_MINUTE;
  return minute >= PREPARE_FROM_MINUTE && minute < to;
}

/** Отчёт — в 18:00, в конце рабочего дня; в выходные — в 20:30. */
export const REPORT_MINUTE = 18 * 60;
export const WEEKEND_REPORT_MINUTE = 20 * 60 + 30;

export function reportMinute(now: Date): number {
  return weekendInTashkent(now) ? WEEKEND_REPORT_MINUTE : REPORT_MINUTE;
}

export function reportDue(now: Date): boolean {
  return tashkentMinute(now) >= reportMinute(now);
}

/**
 * С какого времени считать отчёт: с прошлого — вчера в его час. Не с
 * полуночи — иначе ответы, пришедшие вечером и ночью, не попали бы ни в
 * один отчёт: сегодняшний уже ушёл, а завтрашний считал бы с полуночи. И не
 * ровно сутки назад: отчёт субботы в 20:30 начинается с пятничного в 18:00,
 * а понедельничный — с воскресного в 20:30, без дыр между ними.
 */
export function reportSince(now: Date): Date {
  const yesterday = new Date(now.getTime() - 24 * 3600_000);
  const shifted = new Date(yesterday.getTime() + TASHKENT_OFFSET_MS);
  const midnight = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) - TASHKENT_OFFSET_MS;
  return new Date(midnight + reportMinute(yesterday) * 60_000);
}

/** «18:00» или «20:30» — во сколько отчёт за этот день (YYYY-MM-DD по Ташкенту). */
export function reportClock(day: string): string {
  const minute = reportMinute(new Date(`${day}T12:00:00+05:00`));
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
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

/**
 * Письмо автопрогона — после ответа, а не до «Здравствуйте».
 *
 * Разведка «ИИ → код», 10.10.2026: из 94 писем автопрогона за две недели 65
 * так и не понадобились — по-русски ответившим уходит кружок, не ответившим
 * ничего. Теперь при подготовке — только проверка сайта по факту, а письмо
 * пишет свип, когда клиент ответил не по-русски или кружок не ушёл
 * (lib/admin/letter-later.ts). false — вернуть как было.
 */
export const LETTER_AFTER_REPLY = true;

/** Первая строка карточки лида в боте — по ней менеджер узнаёт лид автопрогона. */
export const REPLY_MARK = "🤖 Ответ на касание автопрогона";

/** Шапка карточки лида в очереди: откуда лид и что клиент ответил. */
export function replyHeading(
  input: { host: string | null; label: string | null; words: string; niche: string | null; account?: string | null },
  escape: (s: string) => string,
): string {
  const who = input.host ?? input.label ?? "компания без сайта";
  const words = input.words.replace(/\s+/g, " ").trim();
  const short = words.length > 300 ? `${words.slice(0, 299)}…` : words;
  return [
    `<b>${REPLY_MARK}</b> · ${escape(who)}`,
    input.niche ? `Ниша: ${escape(input.niche)}` : "",
    // С какого аккаунта писали: взявший отвечает оттуда же.
    input.account ? `Аккаунт: ${escape(input.account)}` : "",
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

/** Firecrawl за срок отчёта: потрачено, дневной лимит, кому нашёлся Telegram, сколько новых сайтов ушло на проверку. */
export type SearchStats = { credits: number; cap: number | null; contacts: number; tried: number; queued: number };

export type DayStats = {
  day: string;
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
  /** Последний сбой прохода за срок отчёта — текст ошибки; null — сбоев не было. */
  trouble?: string | null;
  /** Поиск лидов через Firecrawl; null — ключа нет или поиск не работал. */
  search?: SearchStats | null;
  /**
   * Сколько раз кружок не ушёл, потому что в «Избранном» аккаунта его нет:
   * вместо него ушло письмо. 08.10.2026 так прошёл целый день — кружок не
   * загрузили, и никто этого не видел.
   */
  circleMissing?: number;
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
/** Строка отчёта про Firecrawl: на что ушли кредиты и что это дало. */
export function searchLine(s: SearchStats): string {
  const parts = [
    s.tried ? `Telegram или мобильный нашёлся у ${s.contacts} из ${s.tried} компаний без него` : null,
    s.queued ? `новых сайтов на проверку: ${s.queued}` : null,
  ].filter(Boolean);
  // «31 из 33 кредитов» — после «из» слово всегда во множественном.
  const spent = s.cap === null ? `${s.credits} ${ru(s.credits, "кредит", "кредита", "кредитов")}` : `${s.credits} из ${s.cap} кредитов`;
  return `🔎 Поиск лидов (Firecrawl): ${spent}${parts.length ? ` — ${parts.join(", ")}` : ""}`;
}

export function reportText(s: DayStats, escape: (t: string) => string): string {
  const accounts = s.byAccount.length
    ? ` (${s.byAccount.map(({ name, n }) => `${name === null ? "главный" : escape(name)} — ${n}`).join(", ")})`
    : "";
  const mark = s.sent >= s.target ? " ✅" : " ⚠️";
  // null — строки нет; "" — пустая строка между блоками.
  const lines: (string | null)[] = [
    `🤖 <b>Автопрогон касаний — отчёт за ${shortDay(s.day)}</b>`,
    `<i>За сутки до ${reportClock(s.day)} — с прошлого отчёта.</i>`,
    s.enabled ? null : "⏸ Автопрогон выключен в разделе «Касания».",
    "",
    `✉️ Написали — ушло в Telegram: <b>${s.sent}</b> из ${s.target}${mark}${accounts}`,
    s.trouble && s.sent < s.target
      ? `❗ Автопрогон сбоил — письма не готовились. Для разработчика: <code>${escape(s.trouble)}</code>`
      : null,
    s.inFlight
      ? `Ждут отправки: ${s.inFlight} — уйдут ${reportClock(s.day) === "18:00" ? "сегодня до 20:30 или " : ""}завтра с 07:30`
      : null,
    s.manual ? `Не нашлись в Telegram — карточки ушли на звонок: ${s.manual}` : null,
    s.dropped ? `Не написали — проверка по факту ничего не подтвердила или сайт не открылся: ${s.dropped}` : null,
    s.search ? searchLine(s.search) : null,
    s.circleMissing
      ? `🎥 Кружок не ушёл ${s.circleMissing} ${ru(s.circleMissing, "раз", "раза", "раз")}: в «Избранном» рабочих аккаунтов его нет, вместо него ушло письмо. Перешлите кружок боту или загрузите в «Аккаунтах» — он разойдётся по всем аккаунтам.`
      : null,
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
      s.trouble
        ? "Не добрали из-за сбоя выше: компании в нише есть, дело не в них. Перешлите отчёт разработчику."
        : s.attempts >= s.target * ATTEMPTS_PER_TARGET
          ? `Не добрали: ${s.attempts} попыток за день — почти все письма отбраковывались. Перешлите отчёт разработчику.`
          : "Не добрали: в пуле кончились компании, до которых дотянется Telegram, или аккаунты были остановлены. Проверьте раздел «Аккаунты» и кампании автопоиска.",
    );
  }
  return lines.filter((line): line is string => line !== null).join("\n");
}
