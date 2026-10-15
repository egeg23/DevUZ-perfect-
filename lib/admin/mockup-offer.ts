import { TASHKENT_OFFSET_MS } from "@/lib/admin/pulse";

/**
 * Акция после макета: 48 часов на спецусловия.
 *
 * Владелец, 13.10.2026: «когда мы отправили прототип, у клиента есть 48 часов
 * чтобы использовать спец условия, а именно лендинг со всем функционалом за
 * 500$ вместо … $. Если клиент готов подписаться в этот лимит времени —
 * лендинг за 500$ по макету с 3 допами на выбор, 1000$ за полноразмерный
 * корпоративный сайт. Нужно чтобы бот отслеживал с рабочих аккаунтов кому мы
 * выслали макеты и каждый день в 13:00 по Ташкенту напоминал, сколько
 * времени осталось до конца специального предложения. Как только таймер
 * подходит к концу — акция больше не действует и применяются стандартные
 * цены. Напоминание клиенту должно уходить дополнительно за 2 часа до
 * истекающей у него акции, используй не дорогую модель для рассылки».
 *
 * Как устроено:
 * - отсчёт идёт с первой отправки ссылки на макет с рабочего аккаунта —
 *   через очередь бота (ответ из карточки, модель) или руками в Telegram
 *   (скаут видит свои исходящие со ссылкой на макет);
 * - через пару минут после макета тем же аккаунтом уходит сообщение с
 *   условиями и сроком (готовым текстом: условия должны быть точными);
 * - напоминания — в 13:00 по Ташкенту и за 2 часа до конца; их пишет
 *   недорогая модель, факты (цены, срок, сколько осталось) подставляет код и
 *   проверяет, что модель не добавила своих чисел; не прошло — готовый текст;
 * - срок вышел — акция закрыта, команде строка, цены стандартные;
 * - «Макет утверждён» или отказ клиента — напоминания прекращаются.
 *
 * Здесь чистая арифметика и тексты: «сейчас» приходит аргументом. База —
 * lib/admin/mockup-offer-store.ts.
 */

export const OFFER_HOURS = 48;
export const OFFER_MS = OFFER_HOURS * 3600_000;

/**
 * Цены акции и обычные — в одном месте. «Вместо» у лендинга — цена сайта,
 * которую показывает сам макет («сайт 1 700 $, со всеми допами 3 000 $»), у
 * корпоративного — цена с сайта студии («корпоративный сайт от $2500»).
 */
export const PROMO = {
  landing: { price: 500, regular: 1700, addons: 3 },
  corporate: { price: 1000, regular: 2500 },
} as const;

/**
 * Своя цена акции у макета — protos.facts.promo. Владелец, 14.10.2026: у
 * DomTut на макете «1 000 $ вместо 4 800 $» за сайт и приложение, и бот
 * должен написать клиенту те же цифры, что на макете, а не общие PROMO.
 *
 * `{ price, regular, what: { ru, uz } }`: одна цена вместо двух общих. Ещё
 * строки — `more: [{ price, regular, what }]` (до трёх): у DomTut с 14.10.2026
 * сайт 1 000 $ вместо 4 800 $ и приложение для iPhone 3 500 $ вместо 8 750 $.
 * `cash` — скидка за оплату наличными в процентах от итога (1-50). `cur` —
 * валюта: «$» (по умолчанию) или «₽» (владелец, 16.10.2026: у Medikor из
 * России цены на макете в рублях), одна на все строки. Не
 * сходится (не целые, акция не дешевле обычной, в названии цифры) — главная
 * строка: макет идёт по общим ценам; лишняя строка или скидка — пропускается.
 */
export type OwnLine = { price: number; regular: number; what: { ru: string; uz: string }; cur: OwnCurrency };
export type OwnCurrency = "$" | "₽";
export type OwnPromo = OwnLine & { more: OwnLine[]; cash: number };

const OWN_WHAT = { ru: "сайт по этому макету", uz: "shu maket bo‘yicha sayt" };

function ownLine(raw: unknown, fallback: { ru: string; uz: string } | null, cur: OwnCurrency): OwnLine | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as { price?: unknown; regular?: unknown; what?: unknown };
  const price = Number(p.price);
  const regular = Number(p.regular);
  if (!Number.isInteger(price) || !Number.isInteger(regular) || price <= 0 || regular <= price) return null;
  const what = (p.what && typeof p.what === "object" ? p.what : {}) as { ru?: unknown; uz?: unknown };
  // Цифры в названии сломали бы проверку напоминаний: числа там — только цены и срок.
  const ok = (v: unknown) => typeof v === "string" && v.trim() && v.trim().length <= 120 && !/\d/.test(v);
  if (!fallback && !(ok(what.ru) && ok(what.uz))) return null;
  return { price, regular, what: { ru: ok(what.ru) ? String(what.ru).trim() : fallback!.ru, uz: ok(what.uz) ? String(what.uz).trim() : fallback!.uz }, cur };
}

export function ownPromo(facts: unknown): OwnPromo | null {
  const raw = facts && typeof facts === "object" ? (facts as { promo?: unknown }).promo : null;
  const cur: OwnCurrency = raw && typeof raw === "object" && (raw as { cur?: unknown }).cur === "₽" ? "₽" : "$";
  const main = ownLine(raw, OWN_WHAT, cur);
  if (!main) return null;
  const p = raw as { more?: unknown; cash?: unknown };
  const more = (Array.isArray(p.more) ? p.more : []).map((x) => ownLine(x, null, cur)).filter((x): x is OwnLine => !!x).slice(0, 3);
  const cash = Number(p.cash);
  return { ...main, more, cash: Number.isInteger(cash) && cash >= 1 && cash <= 50 ? cash : 0 };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Все строки своей цены: «сайт по этому макету — 1000 $ вместо 4800 $». */
export function ownLines(own: OwnPromo, lang: OfferLang): string[] {
  return [own, ...own.more].map((x) =>
    lang === "uz" ? `${x.what.uz} — ${x.price} ${x.cur} (odatda ${x.regular} ${x.cur})` : `${x.what.ru} — ${x.price} ${x.cur} вместо ${x.regular} ${x.cur}`,
  );
}

/** Скидка за наличные — строкой, если она есть. */
export function cashLine(own: OwnPromo, lang: OfferLang): string | null {
  if (!own.cash) return null;
  return lang === "uz" ? `Naqd to‘lovda jamidan yana ${own.cash}% chegirma.` : `При оплате наличными — ещё минус ${own.cash}% от итога.`;
}

/** Для карточек команде: все строки через точку с запятой и наличные. */
export function ownPromoLine(own: OwnPromo): string {
  return ownLines(own, "ru").join("; ") + (own.cash ? `; наличными −${own.cash}%` : "");
}

/** Условия — пауза после макета: сначала человек открывает ссылку. */
export const ANNOUNCE_AFTER_MS = 3 * 60_000;

/** Ежедневное напоминание — с 13:00 до 16:00 по Ташкенту (свип ходит раз в 5 минут). */
export const DAILY_HOUR = 13;
export const DAILY_LATEST_HOUR = 16;

/** Последнее напоминание — за 2 часа до конца. */
export const FINAL_BEFORE_MS = 2 * 3600_000;

/** Клиенту пишем только днём: с 08:00 до 22:00 по Ташкенту. */
export const QUIET_FROM_HOUR = 22;
export const QUIET_UNTIL_HOUR = 8;

/** Только что пришли условия — ежедневное напоминание в тот же день не нужно. */
export const DAILY_NOT_BEFORE_MS = 6 * 3600_000;

/** Последнее напоминание скоро — ежедневное ему не мешает. */
export const DAILY_FINAL_GAP_MS = 4 * 3600_000;

export type OfferLang = "ru" | "uz";

/** Прототип — по токену; проект витрины — по пути после адреса витрины («engelberg/v2»). */
export type MockupLink = { kind: "proto"; token: string } | { kind: "showcase"; path: string };

/**
 * Ссылки на макеты в тексте: прототипы на devuz.studio/proto/<token> и
 * проекты витрины cases.devuz.studio/<проект>. С https и без, с www и без,
 * с хвостом пути (?key=…, /about) и со знаком препинания сразу за ссылкой.
 * Чужой адрес, который только кончается на «devuz.studio» (mydevuz.studio),
 * — не наш.
 */
export function mockupLinks(text: string): MockupLink[] {
  const out: MockupLink[] = [];
  const seen = new Set<string>();
  for (const m of text.matchAll(/(?<![A-Za-z0-9-])devuz\.studio\/proto\/([A-Za-z0-9_-]{6,80})/gi)) {
    const key = `p:${m[1]}`;
    if (!seen.has(key)) out.push({ kind: "proto", token: m[1] });
    seen.add(key);
  }
  for (const m of text.matchAll(/(?<![A-Za-z0-9-])cases\.devuz\.studio\/([A-Za-z0-9._\/-]{2,120})/gi)) {
    const path = m[1].replace(/[/.-]+$/, "");
    // Главная витрины («/ru») — не макет.
    if (/^(?:ru|uz|en)$/.test(path)) continue;
    const key = `s:${path}`;
    if (!seen.has(key)) out.push({ kind: "showcase", path });
    seen.add(key);
  }
  return out;
}

/** Есть ли в тексте ссылка на макет — для скаута, без разбора. */
export function hasMockupLink(text: string): boolean {
  return mockupLinks(text).length > 0;
}

function tashkent(ms: number): Date {
  return new Date(ms + TASHKENT_OFFSET_MS);
}

/** «15.10 18:40» по Ташкенту. */
export function untilText(iso: string): string {
  const t = tashkent(Date.parse(iso));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(t.getUTCDate())}.${p(t.getUTCMonth() + 1)} ${p(t.getUTCHours())}:${p(t.getUTCMinutes())}`;
}

/** Дата по Ташкенту, ГГГГ-ММ-ДД. */
export function tashkentDay(ms: number): string {
  return tashkent(ms).toISOString().slice(0, 10);
}

function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

/** «1 день 5 часов», «5 часов», «40 минут»; по-узбекски — «1 kun 5 soat». */
export function leftText(expiresAt: string, now: Date, lang: OfferLang): string {
  const ms = Math.max(0, Date.parse(expiresAt) - now.getTime());
  const totalMin = Math.floor(ms / 60_000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const minutes = totalMin % 60;
  if (lang === "uz") {
    if (!days && !hours) return `${minutes} daqiqa`;
    return [days ? `${days} kun` : "", hours ? `${hours} soat` : ""].filter(Boolean).join(" ");
  }
  if (!days && !hours) return `${minutes} ${plural(minutes, "минута", "минуты", "минут")}`;
  return [
    days ? `${days} ${plural(days, "день", "дня", "дней")}` : "",
    hours ? `${hours} ${plural(hours, "час", "часа", "часов")}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function hourOf(ms: number): number {
  return tashkent(ms).getUTCHours();
}

/** Ночь по Ташкенту: клиенту не пишем. */
export function quiet(ms: number): boolean {
  const h = hourOf(ms);
  return h >= QUIET_FROM_HOUR || h < QUIET_UNTIL_HOUR;
}

/**
 * Когда слать последнее напоминание: за 2 часа до конца. Если это ночь —
 * накануне вечером, в 21:00: лучше раньше, чем никогда. Не позже ли оно
 * самой отправки макета — проверяет finalDue.
 */
export function finalAt(expiresAt: string): number {
  const at = Date.parse(expiresAt) - FINAL_BEFORE_MS;
  if (!quiet(at)) return at;
  const t = tashkent(at);
  // 21:00 того же дня (если ночь после 22:00) или предыдущего (если до 08:00).
  const day = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate(), 21, 0));
  if (t.getUTCHours() < QUIET_UNTIL_HOUR) day.setUTCDate(day.getUTCDate() - 1);
  return day.getTime() - TASHKENT_OFFSET_MS;
}

export type OfferState = {
  status: string;
  sent_at: string;
  expires_at: string;
  announced_at: string | null;
  daily_on: string | null;
  final_at: string | null;
};

/** Пора ли сказать условия: макет ушёл, пауза прошла, ещё не говорили. */
export function announceDue(o: OfferState, now: Date): boolean {
  if (o.status !== "active" || o.announced_at) return false;
  const t = now.getTime();
  return t >= Date.parse(o.sent_at) + ANNOUNCE_AFTER_MS && t < Date.parse(o.expires_at) && !quiet(t);
}

/** Ежедневное напоминание в 13:00. */
export function dailyDue(o: OfferState, now: Date): boolean {
  if (o.status !== "active" || !o.announced_at) return false;
  const t = now.getTime();
  const h = hourOf(t);
  if (h < DAILY_HOUR || h >= DAILY_LATEST_HOUR) return false;
  if (o.daily_on === tashkentDay(t)) return false;
  if (t < Date.parse(o.announced_at) + DAILY_NOT_BEFORE_MS) return false;
  // Последнее напоминание скоро — оно и скажет.
  if (!o.final_at && finalAt(o.expires_at) - t < DAILY_FINAL_GAP_MS) return false;
  return t < Date.parse(o.expires_at);
}

/** Напоминание за 2 часа. */
export function finalDue(o: OfferState, now: Date): boolean {
  if (o.status !== "active" || !o.announced_at || o.final_at) return false;
  const t = now.getTime();
  const at = finalAt(o.expires_at);
  // Условия пришли позже, чем пора было напоминать, — напоминать нечего.
  if (at <= Date.parse(o.announced_at)) return false;
  return t >= at && t < Date.parse(o.expires_at) && !quiet(t);
}

/** Срок вышел. */
export function expiredNow(o: OfferState, now: Date): boolean {
  return o.status === "active" && now.getTime() >= Date.parse(o.expires_at);
}

/**
 * Условия акции — готовым текстом, без модели: в них цены и срок, и они
 * должны быть ровно такими, как решил владелец.
 */
export function announceText(lang: OfferLang, expiresAt: string, own: OwnPromo | null = null): string {
  const until = untilText(expiresAt);
  if (own) {
    return lang === "uz"
      ? [
          `Maket bo‘yicha maxsus taklif — ${OFFER_HOURS} soat, Toshkent vaqti bilan ${until} gacha:`,
          ...ownLines(own, "uz").map((x) => `• ${x}.`),
          ...(own.cash ? [`• ${cashLine(own, "uz")}`] : []),
          `Shu muddatda shartnoma imzolasak, narx shunday qoladi. Keyin odatiy narx amal qiladi.`,
        ].join("\n")
      : [
          `Спецусловия по макету — ${OFFER_HOURS} часа, до ${until} по Ташкенту:`,
          ...ownLines(own, "ru").map((x) => `• ${x}.`),
          ...(own.cash ? [`• ${cashLine(own, "ru")}`] : []),
          `Если подпишем договор до этого времени, цена останется такой. Потом — обычная цена.`,
        ].join("\n");
  }
  const l = PROMO.landing;
  const c = PROMO.corporate;
  if (lang === "uz") {
    return [
      `Maket bo‘yicha maxsus taklif — ${OFFER_HOURS} soat, Toshkent vaqti bilan ${until} gacha:`,
      `• shu maket asosida to‘liq funksionalli lending + tanlovingizga ${l.addons} ta qo‘shimcha — ${l.price} $ (odatda ${l.regular} $);`,
      `• to‘liq korporativ sayt — ${c.price} $ (odatda ${c.regular} $ dan).`,
      `Shu muddatda shartnoma imzolasak, narx shunday qoladi. Keyin odatiy narxlar amal qiladi.`,
    ].join("\n");
  }
  return [
    `Спецусловия по макету — ${OFFER_HOURS} часа, до ${until} по Ташкенту:`,
    `• лендинг по этому макету со всем функционалом и ${l.addons} допами на выбор — ${l.price} $ вместо ${l.regular} $;`,
    `• полноразмерный корпоративный сайт — ${c.price} $ вместо ${c.regular} $.`,
    `Если подпишем договор до этого времени, цена останется такой. Потом — обычные цены.`,
  ].join("\n");
}

export type ReminderKind = "daily" | "final";

/** Готовое напоминание — если модель не ответила или ответ не прошёл проверку. */
export function fallbackReminder(kind: ReminderKind, lang: OfferLang, expiresAt: string, now: Date, own: OwnPromo | null = null): string {
  const left = leftText(expiresAt, now, lang);
  const until = untilText(expiresAt);
  if (own) {
    if (lang === "uz") {
      return kind === "final"
        ? `Maxsus taklif tugashiga ${left} qoldi (${until} gacha): ${ownLines(own, "uz").join("; ")}. Keyin odatiy narx. Boshlaymizmi?`
        : `Eslatma: maket bo‘yicha maxsus taklif tugashiga ${left} qoldi (${until} gacha). ${cap(ownLines(own, "uz").join("; "))}. Savollar bo‘lsa, yozing.`;
    }
    return kind === "final"
      ? `До конца спецусловий осталось ${left} (до ${until}): ${ownLines(own, "ru").join("; ")}. Потом — обычная цена. Начинаем?`
      : `Напоминаем: до конца спецусловий по макету осталось ${left} (до ${until}). ${cap(ownLines(own, "ru").join("; "))}. Если есть вопросы — пишите.`;
  }
  const l = PROMO.landing;
  const c = PROMO.corporate;
  if (lang === "uz") {
    return kind === "final"
      ? `Maxsus taklif tugashiga ${left} qoldi (${until} gacha): lending ${l.price} $, korporativ sayt ${c.price} $. Keyin odatiy narxlar. Boshlaymizmi?`
      : `Eslatma: maket bo‘yicha maxsus taklif tugashiga ${left} qoldi (${until} gacha). Lending ${l.price} $, korporativ sayt ${c.price} $. Savollar bo‘lsa, yozing.`;
  }
  return kind === "final"
    ? `До конца спецусловий осталось ${left} (до ${until}): лендинг ${l.price} $, корпоративный сайт ${c.price} $. Потом — обычные цены. Начинаем?`
    : `Напоминаем: до конца спецусловий по макету осталось ${left} (до ${until}). Лендинг ${l.price} $, корпоративный сайт ${c.price} $. Если есть вопросы — пишите.`;
}

/** Числа, которые напоминанию можно называть: цены, срок, сколько осталось. */
export function allowedNumbers(expiresAt: string, now: Date, lang: OfferLang, own: OwnPromo | null = null): Set<string> {
  const nums = new Set<string>();
  const add = (text: string) => {
    for (const n of text.match(/\d+/g) ?? []) nums.add(String(Number(n)));
  };
  add(
    own
      ? `${[own, ...own.more].map((x) => `${x.price} ${x.regular}`).join(" ")} ${own.cash} ${OFFER_HOURS}`
      : `${PROMO.landing.price} ${PROMO.landing.regular} ${PROMO.landing.addons} ${PROMO.corporate.price} ${PROMO.corporate.regular} ${OFFER_HOURS}`,
  );
  add(untilText(expiresAt));
  add(leftText(expiresAt, now, lang));
  return nums;
}

/**
 * Что не так с напоминанием от модели. Пусто — можно отправлять.
 *
 * Модель только подбирает слова: чисел, которых нет в фактах, ссылок,
 * обещаний «скидка навсегда» и длинных простыней быть не должно.
 */
export function reminderProblems(text: string, expiresAt: string, now: Date, lang: OfferLang, own: OwnPromo | null = null): string[] {
  const out: string[] = [];
  const t = text.trim();
  if (!t) return ["пусто"];
  if (t.length > 420) out.push("длинно");
  if (/https?:\/\/|www\./i.test(t)) out.push("ссылка");
  const allowed = allowedNumbers(expiresAt, now, lang, own);
  const extra = [...new Set((t.replace(/\d{1,2}:\d{2}/g, (m) => m.replace(":", " ")).match(/\d+/g) ?? []).map((n) => String(Number(n))))].filter(
    (n) => !allowed.has(n),
  );
  if (extra.length) out.push(`чужие числа: ${extra.join(", ")}`);
  if (own) {
    if (!t.includes(String(own.price))) out.push("нет цены акции");
  } else if (!t.includes(String(PROMO.landing.price))) out.push("нет цены лендинга");
  if (lang === "uz" && /[А-Яа-яЁё]/.test(t)) out.push("кириллица в узбекском");
  if (/навсегда|бессрочн|продлим|продлить/i.test(t)) out.push("обещание продлить");
  return out;
}

/** Задание модели: коротко, по-человечески, факты — только данные. */
export function reminderPrompt(
  kind: ReminderKind,
  lang: OfferLang,
  expiresAt: string,
  now: Date,
  client: string,
  own: OwnPromo | null = null,
): {
  system: string;
  user: string;
} {
  const facts = [
    `Клиент: ${client || "владелец бизнеса"}`,
    own ? `Мы прислали ему макет.` : `Мы прислали ему макет главной страницы его сайта.`,
    `Спецусловия действуют до ${untilText(expiresAt)} по Ташкенту, осталось ${leftText(expiresAt, now, lang)}.`,
    ...(own
      ? [...ownLines(own, "ru").map((x) => `${cap(x)}.`), ...(own.cash ? [cashLine(own, "ru")!] : []), `После срока — обычная цена.`]
      : [
          `Лендинг по макету со всем функционалом и ${PROMO.landing.addons} допами на выбор — ${PROMO.landing.price} $ вместо ${PROMO.landing.regular} $.`,
          `Полноразмерный корпоративный сайт — ${PROMO.corporate.price} $ вместо ${PROMO.corporate.regular} $.`,
          `После срока — обычные цены.`,
        ]),
  ].join("\n");
  const language = lang === "uz" ? "на узбекском (латиница), деловым языком" : "на русском";
  const goal =
    kind === "final"
      ? "Это последнее напоминание: до конца осталось около двух часов. Спокойно скажи, сколько осталось и что потом цены обычные, и предложи начать."
      : "Это ежедневное напоминание. Скажи, сколько времени осталось, и предложи ответить, если есть вопросы по макету.";
  return {
    system: [
      `Ты пишешь клиенту короткое сообщение в Telegram от студии DevUz Studio ${language}.`,
      "1–3 предложения, до 300 знаков, без приветствия и без подписи, без ссылок, без эмодзи в начале.",
      "Числа, цены и сроки — только из фактов, ничего не добавляй и не округляй. Не обещай продлить акцию.",
      "Пиши как живой менеджер: просто и вежливо, без давления и без штампов.",
      goal,
    ].join("\n"),
    user: facts,
  };
}

/** Строка списка для руководителя и владельца. */
export function offerLine(input: {
  client: string;
  name: string;
  status: string;
  expiresAt: string;
  sentAt: string;
  now: Date;
}): string {
  const head = `${input.client || input.name}`;
  if (input.status === "approved") return `✅ ${head} · макет утверждён, в работе`;
  if (input.status === "declined") return `✖ ${head} · клиент отказался`;
  if (input.status === "expired" || Date.parse(input.expiresAt) <= input.now.getTime()) {
    return `⌛ ${head} · акция закончилась ${untilText(input.expiresAt)}, цены обычные`;
  }
  return `⏳ ${head} · акция ещё ${leftText(input.expiresAt, input.now, "ru")} (до ${untilText(input.expiresAt)})`;
}
