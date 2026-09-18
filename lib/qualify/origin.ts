/**
 * Откуда пришёл лид — словами, одинаковыми в уведомлении и в карточке.
 *
 * Владелец, глядя на заявку в чате: «указывай юзернейм, если он есть.
 * Откуда писал, во сколько, где».
 *
 * Просьба про одно: по уведомлению должно быть понятно, с кем имеешь дело,
 * не открывая панель. Раньше в брифе стояли только оценка, канал связи и
 * язык версии сайта — ни ника, ни времени, ни страницы, с которой человек
 * писал. А это ровно то, с чего начинается разговор: пришедший с
 * калькулятора уже считал деньги, пришедший с кейса смотрел работы, а
 * написавший в бота в полночь — не тот же человек, что написал в обед.
 */

/** Канал, по которому пришёл разговор. */
export const CHANNEL: Record<string, string> = {
  chat: "чат на сайте",
  telegram: "бот в Telegram",
  form: "форма на сайте",
  showcase: "витрина — бриф по заказу",
  outreach: "наше холодное касание",
};

export function channelName(source: string | null | undefined): string {
  const key = (source ?? "").trim();
  return CHANNEL[key] ?? (key || "канал не указан");
}

export type LeadOrigin = {
  source?: string | null;
  /** Ник в Telegram — от самого Telegram, без «@». */
  tgUsername?: string | null;
  /** Страница сайта, с которой начался разговор. */
  entryPath?: string | null;
  /** Первый переход на сайт: хост источника или utm_source. */
  entryRef?: string | null;
};

const TZ = "Asia/Tashkent";

/**
 * Время по Ташкенту — «18 сентября, 14:09».
 *
 * Часовой пояс задан явно. Сервер живёт в UTC, и без него владелец читал бы
 * «09:09» про заявку, пришедшую в обед, — и считал бы, что человек пишет по
 * ночам.
 */
export function atTashkent(value: string | number | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "время неизвестно";
  // Дата и время собираются отдельно, а не одним форматом: одним получается
  // «18 сентября в 14:09», и это «в» зависит от версии данных локали в
  // Node. Строка уходит в уведомление и в карточку, её читают глазами, и
  // меняться от обновления рантайма она не должна.
  const where = { timeZone: TZ } as const;
  const day = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", ...where }).format(date);
  const time = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit", ...where }).format(date);
  return `${day}, ${time}`;
}

/**
 * Где именно он писал.
 *
 * Для сайта это страница: та, с которой открыт чат. Для бота — сам бот;
 * писать «страница неизвестна» про разговор в мессенджере было бы враньём
 * по форме и бессмыслицей по сути.
 */
export function placeOf(origin: LeadOrigin): string | null {
  if (origin.source === "telegram") return "личные сообщения боту";
  const path = (origin.entryPath ?? "").trim();
  return path ? `страница ${path}` : null;
}

/**
 * Откуда он вообще у нас оказался: поиск, соцсеть, чужая ссылка.
 *
 * Пусто — значит пришёл напрямую: набрал адрес, открыл закладку или перешёл
 * из приложения, которое источник не передаёт. Так и пишем: «прямой заход»,
 * а не «источник неизвестен» — второе звучит как сбой, хотя это обычный
 * и хороший случай.
 */
export function refOf(origin: LeadOrigin): string | null {
  if (origin.source === "telegram" || origin.source === "outreach") return null;
  const ref = (origin.entryRef ?? "").trim();
  if (!ref) return "прямой заход";
  return `перешёл с ${ref}`;
}

/** Ник с «@», если он есть. Пусто — значит ника нет, и выдумывать нечего. */
export function usernameOf(origin: LeadOrigin): string | null {
  const raw = (origin.tgUsername ?? "").trim().replace(/^@/, "");
  return /^[A-Za-z0-9_]{4,32}$/.test(raw) ? `@${raw}` : null;
}

/**
 * Две строки для брифа: когда и откуда писал, и где именно.
 *
 * Возвращает уже собранный текст без разметки — экранирование остаётся за
 * тем, кто вставляет его в сообщение.
 */
export function originLines(origin: LeadOrigin, at: string | number | Date): string[] {
  const where = [placeOf(origin), refOf(origin)].filter(Boolean).join(" · ");
  return [
    `${atTashkent(at)} · ${channelName(origin.source)}`,
    ...(where ? [where] : []),
  ];
}

/**
 * Страница, присланная браузером.
 *
 * Только путь и только из наших букв: адрес приходит от клиента, а
 * попадает он в уведомление менеджеру, то есть в HTML. Экранирование там
 * есть, но полагаться на одно только экранирование в значении, которое
 * можно не принимать вовсе, — лишнее.
 */
export function pathFromClient(value: unknown): string | null {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  const path = raw.split("?")[0].split("#")[0].slice(0, 120);
  return /^\/[A-Za-z0-9._\-/]*$/.test(path) ? path : null;
}

/** Источник перехода: хост или utm_source, без адреса целиком. */
export function refFromClient(value: unknown): string | null {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!raw) return null;
  const host = raw.replace(/^www\./, "").slice(0, 60);
  return /^[a-z0-9._-]{2,60}$/.test(host) ? host : null;
}
