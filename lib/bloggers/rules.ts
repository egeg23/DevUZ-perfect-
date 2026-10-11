import { HELLO_TEXT } from "@/lib/admin/hello-first";
import { MIN_PAYOUT_USD, PARTNER_TIERS } from "@/lib/partners/rules";

/**
 * ИИ-сотрудник «Блогеры» — правила без базы и сети: разбор выдачи поиска,
 * контакты из шапки профиля, оценка аудитории и первое сообщение.
 *
 * Владелец, 11.10.2026: «Нам нужен агент, который бы общался в инстаграм,
 * писал блоггерам по партнерской программе, сам бы их собирал, просил,
 * оценивал аудиторию». Как писать — решено так же: первым в Instagram
 * официальный API писать не даёт, неофициальную автоматизацию не делаем.
 * Есть Telegram — с рабочего аккаунта уходит только «Здравствуйте»; есть
 * почта или только Instagram — текст готовит агент, отправляет менеджер.
 *
 * Здесь всё, что можно проверить тестом: числа оценки, разбор «12K
 * Followers», ссылка на Direct и то, что условия программы в тексте взяты
 * из lib/partners/rules.ts, а не придуманы (docs/ai-staff/bloggers.md).
 */

/* ── Настройки ──────────────────────────────────────────────────────────── */

export type BloggerSettings = {
  /** Агент ищет и оценивает сам, по свипу. Выключен — только руками из панели. */
  enabled: boolean;
  /** «Здравствуйте» блогерам с рабочих аккаунтов в день. Своя квота: норма касаний компаний (20) её не включает. */
  tgDaily: number;
  /** Сколько первых сообщений в Direct и на почту менеджер отправляет в день. */
  directDaily: number;
  /** Кредитов Firecrawl в день на поиск блогеров — из общего дневного лимита (lib/firecrawl.ts). */
  firecrawlDaily: number;
  minFollowers: number;
  maxFollowers: number;
  /** Ниже — блогер отсеивается. */
  minScore: number;
  /** Что ищет Firecrawl, по кругу. */
  queries: string[];
};

export const DEFAULT_SETTINGS: BloggerSettings = {
  enabled: false,
  tgDaily: 3,
  directDaily: 10,
  firecrawlDaily: 2,
  minFollowers: 3_000,
  maxFollowers: 300_000,
  minScore: 55,
  queries: [
    "site:instagram.com блогер Ташкент",
    "site:instagram.com bloger Toshkent",
    "site:instagram.com предприниматель Ташкент",
    "site:instagram.com biznes Toshkent blog",
    "site:instagram.com маркетолог Ташкент",
    "site:instagram.com SMM Ташкент",
    "site:instagram.com IT блогер Узбекистан",
    "топ блогеров Ташкента instagram",
  ],
};

const clampInt = (v: unknown, min: number, max: number, fallback: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
};

/** Настройки из базы или формы — с пределами: квоту в тысячу сообщений форма не сохранит. */
export function settingsFrom(raw: unknown): BloggerSettings {
  const v = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const d = DEFAULT_SETTINGS;
  const queries = Array.isArray(v.queries)
    ? v.queries.map((q) => String(q).trim().slice(0, 120)).filter(Boolean).slice(0, 20)
    : d.queries;
  const minFollowers = clampInt(v.minFollowers, 500, 1_000_000, d.minFollowers);
  return {
    enabled: v.enabled === true,
    // Telegram ограничивает аккаунт за жалобы на первые сообщения: больше
    // десяти блогеров в день с рабочих аккаунтов не пустим даже руками.
    tgDaily: clampInt(v.tgDaily, 0, 10, d.tgDaily),
    directDaily: clampInt(v.directDaily, 0, 50, d.directDaily),
    firecrawlDaily: clampInt(v.firecrawlDaily, 0, 20, d.firecrawlDaily),
    minFollowers,
    maxFollowers: Math.max(minFollowers, clampInt(v.maxFollowers, 1_000, 10_000_000, d.maxFollowers)),
    minScore: clampInt(v.minScore, 0, 100, d.minScore),
    queries: queries.length ? queries : d.queries,
  };
}

/** Какой запрос следующий: тот, которым дольше всего не искали (или ещё ни разу). */
export function nextQuery(queries: readonly string[], lastUsed: ReadonlyMap<string, number>): string | null {
  let best: string | null = null;
  let bestAt = Number.POSITIVE_INFINITY;
  for (const q of queries) {
    const at = lastUsed.get(q) ?? 0;
    if (at < bestAt) {
      best = q;
      bestAt = at;
    }
  }
  return best;
}

/* ── Ник, контакты, выдача поиска ───────────────────────────────────────── */

/** Не профили: посты, рилсы, служебные страницы Instagram. */
const NOT_PROFILES = new Set([
  "p", "reel", "reels", "explore", "stories", "accounts", "tv", "tags", "direct", "about", "legal",
  "developer", "web", "challenge", "privacy", "help", "press", "api", "instagram", "s", "ar",
]);

export const HANDLE_RE = /^[a-z0-9._]{1,30}$/;

/** «@Nick», «instagram.com/nick/», «https://www.instagram.com/nick?igsh=…» → «nick». */
export function normalizeHandle(raw: string): string | null {
  let s = raw.trim();
  const url = s.match(/instagram\.com\/([A-Za-z0-9._]{1,30})/i);
  if (url) s = url[1];
  s = s.replace(/^@/, "").toLowerCase();
  if (!HANDLE_RE.test(s) || NOT_PROFILES.has(s) || /^\.|\.$|\.\./.test(s)) return null;
  return s;
}

/** Ник профиля из адреса страницы Instagram; пост или рилс — не профиль. */
export function handleFromUrl(url: string): string | null {
  const m = url.match(/^https?:\/\/(?:www\.|m\.)?instagram\.com\/([A-Za-z0-9._]{1,30})\/?(?:[?#].*)?$/i);
  return m ? normalizeHandle(m[1]) : null;
}

/** «12,3K», «1.2M», «12 тыс.», «1 234» → число. */
export function parseCount(raw: string): number | null {
  const s = raw.replace(/ /g, " ").trim().toLowerCase();
  const m = s.match(/^([\d][\d\s.,]*)\s*(k|m|тыс\.?|млн\.?|ming|mln)?$/);
  if (!m) return null;
  const unit = m[2] ?? "";
  let digits = m[1].replace(/\s/g, "");
  if (unit) digits = digits.replace(",", ".");
  else digits = digits.replace(/[.,](?=\d{3}(\D|$))/g, "");
  const n = Number(digits.replace(",", "."));
  if (!Number.isFinite(n)) return null;
  const mult = /^(k|тыс|ming)/.test(unit) ? 1_000 : /^(m|млн|mln)/.test(unit) ? 1_000_000 : 1;
  return Math.round(n * mult);
}

export type SnippetMetrics = { followers: number | null; following: number | null; posts: number | null; name: string | null };

/**
 * Цифры из выдачи поиска по профилю Instagram: «12K Followers, 345
 * Following, 1,234 Posts - See Instagram photos and videos from Имя
 * (@nick)» или то же по-русски. Это всё, что поиск знает без Business
 * Discovery: подписчиков видно, вовлечённости — нет.
 */
export function snippetMetrics(text: string): SnippetMetrics {
  const num = "([\\d][\\d\\s.,]*\\s*(?:[KkMm]|тыс\\.?|млн\\.?)?)";
  const grab = (re: RegExp) => {
    const m = text.match(re);
    return m ? parseCount(m[1]) : null;
  };
  const followers =
    grab(new RegExp(`${num}\\s*Followers`, "i")) ?? grab(new RegExp(`Подписчики:?\\s*${num}`, "i")) ?? grab(new RegExp(`${num}\\s*подписчик`, "i"));
  const following = grab(new RegExp(`${num}\\s*Following`, "i")) ?? grab(new RegExp(`подписки:?\\s*${num}`, "i"));
  const posts = grab(new RegExp(`${num}\\s*Posts`, "i")) ?? grab(new RegExp(`публикации:?\\s*${num}`, "i"));
  const nameMatch = text.match(/(?:videos from|видео)\s+(.{1,60}?)\s*\(@[A-Za-z0-9._]+\)/i);
  return { followers, following, posts, name: nameMatch ? nameMatch[1].trim() : null };
}

export type Found = { url: string; title: string; description: string };
export type Candidate = { handle: string; sourceUrl: string; metrics: SnippetMetrics | null; bio: string };

/**
 * Кандидаты из выдачи: профиль Instagram — с цифрами из описания; статья
 * «топ блогеров Ташкента» — только ники из ссылок на instagram.com в её
 * описании. «@ник» в чужой статье может быть и Telegram — его не берём.
 */
export function candidatesFrom(results: readonly Found[]): Candidate[] {
  const out = new Map<string, Candidate>();
  for (const r of results) {
    const own = handleFromUrl(r.url);
    if (own) {
      const text = `${r.title} ${r.description}`;
      out.set(own, { handle: own, sourceUrl: r.url, metrics: snippetMetrics(text), bio: r.description.slice(0, 500) });
      continue;
    }
    for (const m of `${r.title} ${r.description}`.matchAll(/instagram\.com\/([A-Za-z0-9._]{1,30})/gi)) {
      const h = normalizeHandle(m[1]);
      if (h && !out.has(h)) out.set(h, { handle: h, sourceUrl: r.url, metrics: null, bio: "" });
    }
  }
  return [...out.values()];
}

/**
 * Куда написать, кроме Direct: Telegram и почта из шапки профиля или с его
 * сайта. Голый «@ник» в шапке Instagram — обычно другой аккаунт Instagram,
 * поэтому Telegram — только ссылкой t.me или с пометкой «tg», «телеграм».
 */
export function contactsFromBio(text: string): { telegram: string | null; email: string | null } {
  const tme = text.match(/(?:t\.me|telegram\.me)\/([A-Za-z][A-Za-z0-9_]{4,31})\b/i);
  const tagged = text.match(/(?:tg|телеграм|telegram|телега|тг)\s*[:\-–—]?\s*@([A-Za-z][A-Za-z0-9_]{4,31})\b/i);
  const tgRaw = tme?.[1] ?? tagged?.[1] ?? null;
  // t.me/joinchat, t.me/+… и t.me/s/… — не человек.
  const telegram = tgRaw && !/^(joinchat|share|s|addstickers|proxy)$/i.test(tgRaw) ? tgRaw.toLowerCase() : null;
  const email = text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/)?.[0]?.toLowerCase() ?? null;
  return { telegram, email };
}

/* ── Цифры профиля из Business Discovery ────────────────────────────────── */

export type Post = { likes: number | null; comments: number | null; at: number };

export type ProfileStats = {
  avgLikes: number | null;
  avgComments: number | null;
  /** Вовлечённость: (лайки + комментарии) в среднем на пост, % от подписчиков. */
  engagement: number | null;
  postsPerWeek: number | null;
  lastPostAt: number | null;
};

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

/**
 * Средние по последним постам. Лайки, скрытые автором, Instagram не
 * отдаёт — такие посты в среднее лайков не идут, а не считаются нулём.
 */
export function profileStats(followers: number | null, posts: readonly Post[], now = Date.now()): ProfileStats {
  const likes = avg(posts.map((p) => p.likes).filter((x): x is number => typeof x === "number"));
  const comments = avg(posts.map((p) => p.comments).filter((x): x is number => typeof x === "number"));
  const engagement = followers && followers > 0 && likes !== null ? round(((likes + (comments ?? 0)) / followers) * 100) : null;
  const times = posts.map((p) => p.at).filter(Number.isFinite).sort((a, b) => b - a);
  let postsPerWeek: number | null = null;
  if (times.length >= 2) {
    // От самого старого из последних постов до сегодня: перерыв после
    // последнего поста тоже снижает частоту.
    const weeks = Math.max(1, (now - times[times.length - 1]) / (7 * 86_400_000));
    postsPerWeek = round(times.length / weeks, 1);
  }
  return {
    avgLikes: likes === null ? null : Math.round(likes),
    avgComments: comments === null ? null : Math.round(comments),
    engagement,
    postsPerWeek,
    lastPostAt: times[0] ?? null,
  };
}

/* ── Оценка ─────────────────────────────────────────────────────────────── */

export type Scored = {
  score: number;
  pass: boolean;
  /** Что сложилось в оценку — человеку в панели, по-русски, как и остальные заметки агента. */
  notes: string[];
};

export type ScoreInput = {
  followers: number | null;
  following: number | null;
  engagement: number | null;
  postsPerWeek: number | null;
  lastPostAt: number | null;
  /** Из Узбекистана: город назван или язык ru/uz и модель уверена. null — неизвестно. */
  uzbekistan: boolean | null;
  lang: string | null;
  /** Подходит ли аудитория партнёрской программе студии, 0–10, по мнению модели. */
  fit: number | null;
};

const DAY = 86_400_000;

/**
 * Оценка 0–100: размер аудитории 20, вовлечённость 30, активность 15,
 * Узбекистан 15, тематика 20. Нет данных — середина шкалы и пометка: блогер
 * не проваливается за то, что поиск не знает его лайков, но и не обгоняет
 * тех, про кого всё известно.
 */
export function scoreBlogger(b: ScoreInput, s: Pick<BloggerSettings, "minFollowers" | "maxFollowers" | "minScore">, now = Date.now()): Scored {
  const notes: string[] = [];
  let score = 0;
  let hardFail = false;

  // Размер: лучше всего микроблогеры — живая аудитория и честная цена.
  const f = b.followers;
  if (f === null) {
    score += 8;
    notes.push("подписчиков не знаем");
  } else if (f < s.minFollowers || f > s.maxFollowers) {
    hardFail = true;
    notes.push(`${f.toLocaleString("ru-RU")} подписчиков — вне рамок ${s.minFollowers.toLocaleString("ru-RU")}–${s.maxFollowers.toLocaleString("ru-RU")}`);
  } else {
    score += f >= 10_000 && f <= 100_000 ? 20 : f < 10_000 ? 15 : 14;
  }

  // Вовлечённость: доля подписчиков, которые лайкают и пишут.
  const er = b.engagement;
  if (er === null) {
    score += 12;
    notes.push("вовлечённость не знаем: нужны цифры постов или скриншоты статистики");
  } else if (er > 25 && (f ?? 0) >= 10_000) {
    score += 5;
    notes.push(`вовлечённость ${er}% — слишком высокая, похоже на накрутку`);
  } else {
    score += er >= 6 ? 30 : er >= 3 ? 25 : er >= 1.5 ? 18 : er >= 0.8 ? 10 : 3;
    if (er < 0.8) notes.push(`вовлечённость ${er}% — аудитория почти не реагирует`);
  }

  // Активность: блог, в который давно не пишут, никого не приведёт.
  if (b.lastPostAt !== null && now - b.lastPostAt > 45 * DAY) {
    notes.push(`последний пост ${Math.floor((now - b.lastPostAt) / DAY)} дней назад`);
  } else if (b.postsPerWeek === null) {
    score += 7;
  } else {
    score += b.postsPerWeek >= 2 ? 15 : b.postsPerWeek >= 1 ? 12 : b.postsPerWeek >= 0.3 ? 7 : 0;
  }

  // Узбекистан: студии нужна аудитория, которая может стать её клиентом.
  if (b.uzbekistan === false) {
    hardFail = true;
    notes.push("аудитория не из Узбекистана");
  } else if (b.uzbekistan === true) {
    score += 15;
  } else {
    score += b.lang === "ru" || b.lang === "uz" ? 8 : 4;
    notes.push("город не назван");
  }

  // Тематика: предприниматели, эксперты, IT и маркетинг приводят клиентов на сайты.
  score += b.fit === null ? 8 : Math.max(0, Math.min(10, b.fit)) * 2;

  // Подписок больше, чем подписчиков в полтора раза, — взаимная подписка, а не аудитория.
  if (f && b.following && b.following > f * 1.5) {
    score -= 10;
    notes.push("подписок больше, чем подписчиков: похоже на взаимные подписки");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  return { score, pass: !hardFail && score >= s.minScore, notes };
}

/* ── Первое сообщение ───────────────────────────────────────────────────── */

export type Channel = "telegram" | "email" | "direct";

/** Куда писать: Telegram уходит сам с рабочего аккаунта, почта и Direct — руками. */
export function channelFor(b: { telegram: string | null; email: string | null }): Channel {
  return b.telegram ? "telegram" : b.email ? "email" : "direct";
}

/** Условия программы — из lib/partners/rules.ts: свои цифры агент не придумывает. */
export function programTerms() {
  const profit = PARTNER_TIERS.map((t) => t.profit);
  const turnover = PARTNER_TIERS.map((t) => t.turnover);
  return {
    profitFrom: Math.min(...profit),
    profitTo: Math.max(...profit),
    turnoverFrom: Math.min(...turnover),
    turnoverTo: Math.max(...turnover),
    minPayout: MIN_PAYOUT_USD,
  };
}

export type PitchLang = "ru" | "uz";

export function pitchLang(lang: string | null | undefined): PitchLang {
  return lang === "uz" ? "uz" : "ru";
}

/**
 * Первое сообщение в Direct или письмо. Шаблоном кода, а не моделью: это
 * условия денег, и в них не должно быть ни одного числа, которого нет в
 * правилах программы. Без длинных тире и штампов — его читает живой
 * человек, который узнаёт текст модели за секунду.
 */
export function pitchText(b: { name: string; handle: string }, lang: PitchLang, siteUrl: string): string {
  const t = programTerms();
  const host = siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const name = b.name.trim().split(/\s+/)[0] || "";
  if (lang === "uz") {
    return [
      `Assalomu alaykum${name ? `, ${name}` : ""}! DevUz studiyasidan yozyapmiz (${host}): O‘zbekistondagi biznes uchun saytlar, internet-do‘konlar va Telegram-botlar qilamiz.`,
      `Sizga hamkorlikni taklif qilmoqchimiz: auditoriyangizga bizni shaxsiy havolangiz orqali tavsiya qilasiz, har bir to‘langan loyihadan esa foydaning ${t.profitFrom}% dan ${t.profitTo}% gacha yoki loyiha summasining ${t.turnoverFrom}% dan ${t.turnoverTo}% gacha olasiz, tanlovingiz bo‘yicha. To‘lov ${t.minPayout} $ dan.`,
      `Shartlar: ${host}/uz/partners`,
      "Gaplashib ko‘ramizmi?",
    ].join("\n\n");
  }
  return [
    `Здравствуйте${name ? `, ${name}` : ""}! Пишем из студии DevUz (${host}): делаем сайты, интернет-магазины и Telegram-ботов для бизнеса в Узбекистане.`,
    `Хотим предложить партнёрство: вы рекомендуете нас своей аудитории по личной ссылке, а с каждого оплаченного проекта получаете от ${t.profitFrom} до ${t.profitTo}% прибыли или от ${t.turnoverFrom} до ${t.turnoverTo}% от суммы проекта, на выбор. Выплаты от ${t.minPayout} $.`,
    `Условия: ${host}/ru/partners`,
    "Интересно обсудить?",
  ].join("\n\n");
}

export const PITCH_SUBJECT: Record<PitchLang, string> = {
  ru: "Партнёрство с DevUz: процент с каждого проекта",
  uz: "DevUz bilan hamkorlik: har bir loyihadan foiz",
};

/** Первое сообщение в Telegram — только приветствие (lib/admin/hello-first.ts). */
export function helloText(lang: PitchLang): string {
  return HELLO_TEXT[lang];
}

/** Ссылка, которая открывает Direct с этим блогером в приложении Instagram. */
export function directUrl(handle: string): string {
  return `https://ig.me/m/${encodeURIComponent(handle)}`;
}

export function mailtoUrl(email: string, lang: PitchLang, body: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(PITCH_SUBJECT[lang])}&body=${encodeURIComponent(body)}`;
}

/* ── Дневные квоты ──────────────────────────────────────────────────────── */

/** Сколько ещё можно сегодня: квота минус уже ушедшее, не меньше нуля. */
export function leftToday(quota: number, sentToday: number): number {
  return Math.max(0, quota - sentToday);
}
