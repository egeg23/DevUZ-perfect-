import { caseBySlug, type Case } from "@/content/cases";
import { proof } from "@/content/company";
import { OUTSIDE_TOPICS, type OutsideTopic } from "@/content/outside-topics";
import { TASHKENT_OFFSET_MS } from "@/lib/admin/pulse";
import { missingStems, numbersIn } from "@/lib/marketing/article-check";
import { aiMarkers, dashSpots } from "@/lib/proto/plain-text";
import { siteUrl } from "@/lib/seo";

/**
 * Статьи на чужих площадках — vc.ru, Дзен, Tenchat руками; Telegraph,
 * ВКонтакте и Telegram-канал сами.
 *
 * Владелец, 07.11.2026: «Хочу автоматизировать статьи на тех площадках, где
 * ты написал», на план — «Делаем по твоей рекомендации». Открытого способа
 * публиковать программой у этих площадок нет, а робот, который сам входит
 * и жмёт «Опубликовать», — против их правил и кончается баном аккаунта (как
 * с рабочими номерами Telegram 28–30.10.2026). Поэтому так: раз в неделю
 * модель пишет по черновику на площадку, код проверяет, человек копирует
 * одной кнопкой в редактор площадки, публикует и вставляет ссылку в
 * панель. Дальше код сам смотрит, жива ли статья и стоит ли ссылка на нас.
 *
 * Владелец, 09.11.2026: «Я хочу минимизировать ручной труд на статьях… Я
 * прям правда не смогу на 25 ресурсов каждый день что-то выкладывать», на
 * «где есть официальный способ — публикует код» — «Делаем, Postiz тоже
 * подключи». Там, где публиковать программой можно по правилам площадки, —
 * публикует код: Telegraph своим открытым API (без регистрации), ВКонтакте
 * и Telegram-канал — через Postiz (его API, площадки подключает человек
 * один раз в самом Postiz). Тот же черновик, та же проверка; не вышло —
 * черновик остаётся «Ждут публикации», и его публикует человек.
 *
 * Здесь — то, что не ходит ни в сеть, ни в базу: площадки, проверки текста,
 * ссылки, расписание. Запись — store.ts, сама неделя — run.ts.
 */

export const PLATFORMS = ["vcru", "dzen", "tenchat", "telegraph", "vk", "telegram"] as const;
export type Platform = (typeof PLATFORMS)[number];

/** Как черновик попадает на площадку: человеком, открытым API Telegraph или через Postiz. */
export type Via = "hand" | "telegraph" | "postiz";

export type PlatformSpec = {
  name: string;
  via: Via;
  /** Площадка в Postiz (`__type` и `identifier` канала) — у тех, что идут через него. */
  postiz?: "vk" | "telegram";
  /** Куда ведёт «Открыть площадку» — главная, редактор открывается оттуда после входа. */
  home: string;
  /** Адреса, с которых принимается ссылка на опубликованную статью. */
  hosts: readonly string[];
  /** Длина текста, знаков: границы проверки. */
  min: number;
  max: number;
  /**
   * Сколько просить у модели — уже, чем границы: 07.11.2026 первый черновик
   * для vc.ru вышел на 8131 знак при пределе 8000, когда просили «до 8000».
   */
  target: readonly [number, number];
  titleMax: number;
  /** Подзаголовков «## » — от и до. */
  headings: readonly [number, number];
  /** Ссылок на нас — до стольких. */
  links: number;
  /** Как площадка пишется в utm_source. */
  utm: string;
  /** Как писать — для модели. */
  style: string;
};

export const PLATFORM: Record<Platform, PlatformSpec> = {
  vcru: {
    name: "vc.ru",
    via: "hand",
    home: "https://vc.ru",
    hosts: ["vc.ru"],
    min: 3500,
    max: 8000,
    target: [4500, 6500],
    titleMax: 120,
    headings: [2, 8],
    links: 2,
    utm: "vc.ru",
    style:
      "vc.ru читают предприниматели и маркетологи. Нужен разбор с опытом: что было у бизнеса, что сделали и почему, что из этого взять себе. Подзаголовки «## », короткие абзацы, можно список. Без рекламного тона: на vc.ru рекламу видно сразу, и её минусуют.",
  },
  dzen: {
    name: "Дзен",
    via: "hand",
    home: "https://dzen.ru",
    hosts: ["dzen.ru", "zen.yandex.ru"],
    min: 2500,
    max: 6000,
    target: [3000, 4500],
    titleMax: 100,
    headings: [2, 8],
    links: 2,
    utm: "dzen",
    style:
      "Дзен читает владелец малого бизнеса без технической подготовки. Простыми словами, как объяснил бы знакомый: что это, зачем, как понять, что нужно именно вам. Подзаголовки «## », абзацы по два-три предложения, без терминов, а если без термина нельзя, объясни его тут же.",
  },
  tenchat: {
    name: "Tenchat",
    via: "hand",
    home: "https://tenchat.ru",
    hosts: ["tenchat.ru"],
    min: 700,
    max: 2200,
    target: [900, 1600],
    titleMax: 90,
    headings: [0, 0],
    links: 1,
    utm: "tenchat",
    style:
      "Tenchat — деловая соцсеть, это пост, а не статья. Одна мысль из практики от лица студии: ситуация, вывод, что сделать. Без подзаголовков, три-шесть коротких абзацев, ссылка одна, в конце.",
  },
  telegraph: {
    name: "Telegraph",
    via: "telegraph",
    home: "https://telegra.ph",
    hosts: ["telegra.ph"],
    min: 2500,
    max: 6000,
    target: [3000, 4500],
    titleMax: 100,
    headings: [2, 8],
    links: 2,
    utm: "telegraph",
    style:
      "Telegraph — отдельная страница-статья без ленты и подписчиков: её находят поиском и открывают по ссылке из Telegram. Пиши как понятную инструкцию для владельца бизнеса: что сделать по шагам и как проверить, что получилось. Подзаголовки «## », короткие абзацы, можно список.",
  },
  vk: {
    name: "ВКонтакте",
    via: "postiz",
    postiz: "vk",
    home: "https://vk.com",
    hosts: ["vk.com", "m.vk.com"],
    min: 600,
    max: 2500,
    target: [800, 1600],
    titleMax: 90,
    headings: [0, 0],
    links: 1,
    utm: "vk",
    style:
      "ВКонтакте — пост в сообществе студии, его листают в ленте с телефона. Заголовок станет первой строкой поста. Одна мысль из практики: ситуация, что с ней делать, что проверить у себя. Без подзаголовков, три-шесть коротких абзацев, ссылка одна, в конце.",
  },
  telegram: {
    name: "Telegram-канал",
    via: "postiz",
    postiz: "telegram",
    home: "https://t.me",
    hosts: ["t.me"],
    min: 400,
    max: 2000,
    target: [600, 1400],
    titleMax: 90,
    headings: [0, 0],
    links: 1,
    utm: "telegram",
    style:
      "Telegram-канал студии — короткий пост, его читают с телефона между делами. Заголовок станет первой строкой жирным. Одна мысль и один совет, который можно сделать сегодня. Без подзаголовков, два-пять коротких абзацев, ссылка одна, в конце.",
  },
};

/** Площадки, которые публикуются сами (без человека). */
export const AUTO_PLATFORMS = PLATFORMS.filter((p) => PLATFORM[p].via !== "hand");

export function isAuto(platform: Platform): boolean {
  return PLATFORM[platform].via !== "hand";
}

export function isPlatform(value: unknown): value is Platform {
  return typeof value === "string" && (PLATFORMS as readonly string[]).includes(value);
}

/** Регион Вордстата и Trends для статей площадок: Россия, читатель там. */
export const OUTSIDE_REGION = { wordstat: 225, trends: "RU", geo: 2643, label: "Россия" } as const;

/* ── Факты и ссылки ────────────────────────────────────────────────────── */

/** Кейсы темы, которые есть в content/cases.ts. */
export function topicCases(topic: OutsideTopic): Case[] {
  return topic.cases.map((slug) => caseBySlug(slug)).filter((c): c is Case => Boolean(c));
}

/** Факты кейса для модели — его русские тексты с сайта, ничего сверх. */
export function caseFacts(item: Case): string[] {
  return [
    `${item.name}: ${item.category.ru}.`,
    item.summary.ru,
    item.description.ru,
    ...item.metrics.map((m) => `${m.value} ${m.label.ru}`),
  ].map((line) => line.trim()).filter(Boolean);
}

export type AllowedLink = { url: string; about: string; names: readonly string[] };

/** Куда статье можно ссылаться: наш сайт, все работы, кейсы темы. Только эти адреса. */
export function allowedLinks(topic: OutsideTopic): AllowedLink[] {
  return [
    { url: `${siteUrl}/ru`, about: "сайт студии DevUz Studio", names: [] },
    { url: `${siteUrl}/ru/cases`, about: "все работы студии", names: [] },
    ...topicCases(topic).map((c) => ({ url: `${siteUrl}/ru/cases/${c.slug}`, about: `кейс ${c.name}`, names: [c.name] })),
  ];
}

const LINK = /\[([^\]\n]{1,120})\]\((https?:\/\/[^)\s]+)\)/g;

export type BodyLink = { anchor: string; url: string };

/** Ссылки текста в разметке «[текст](адрес)». */
export function linksIn(body: string): BodyLink[] {
  return [...body.matchAll(LINK)].map((m) => ({ anchor: m[1].trim(), url: m[2].trim() }));
}

/** Метки для Метрики: откуда пришёл человек и по какой статье. */
export function withUtm(url: string, platform: Platform, topicKey: string): string {
  const join = url.includes("?") ? "&" : "?";
  return `${url}${join}utm_source=${encodeURIComponent(PLATFORM[platform].utm)}&utm_medium=article&utm_campaign=${encodeURIComponent(topicKey)}`;
}

/* ── Проверка текста ───────────────────────────────────────────────────── */

export type OutsideText = { title: string; body: string };

/** Блоки текста: подзаголовки «## », пункты «• », абзацы. */
export type Block = { kind: "h" | "li" | "p"; text: string };

export function blocksOf(body: string): Block[] {
  const out: Block[] = [];
  for (const raw of body.replace(/\r/g, "").split(/\n+/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("## ")) out.push({ kind: "h", text: line.slice(3).trim() });
    else if (line.startsWith("• ")) out.push({ kind: "li", text: line.slice(2).trim() });
    else out.push({ kind: "p", text: line });
  }
  return out;
}

/** Текст без разметки — для длины, тире и чисел. */
export function bareText(body: string): string {
  return blocksOf(body)
    .map((b) => b.text.replace(LINK, "$1").replace(/\*\*/g, ""))
    .join("\n");
}

const CYRILLIC = /[Ѐ-ӿ]/;
const MONEY = /(\$\s*\d|\d\s*(\$|€|₽|руб|доллар|тыс\.?\s*руб|млн\s*руб|сум))/i;
const PROMISE = /гарантир|в\s+\d+\s+раз|окупит\w*\s+за/i;

/** Числа, которые можно писать: наши (proof), из фактов кейсов темы и мелкие — до двух цифр. */
export function allowedNumbers(topic: OutsideTopic): Set<string> {
  const facts = topicCases(topic).flatMap(caseFacts).join("\n");
  return new Set([...numbersIn(facts), String(proof.staff), String(proof.projects), String(proof.countries)]);
}

/**
 * Претензии к черновику — словами, которые поймут и модель при повторе, и
 * человек в отчёте. Пустой список — черновик можно отдавать.
 */
export function outsideProblems(topic: OutsideTopic, platform: Platform, text: OutsideText): string[] {
  const spec = PLATFORM[platform];
  const problems: string[] = [];
  const title = text.title.trim();
  const blocks = blocksOf(text.body);
  const bare = bareText(text.body);
  const all = `${title}\n${bare}`;

  if (title.length < 20 || title.length > spec.titleMax) problems.push(`Заголовок ${title.length} знаков, нужно от 20 до ${spec.titleMax}.`);
  if (!CYRILLIC.test(title)) problems.push("Заголовок без русских слов.");
  if (bare.length < spec.min || bare.length > spec.max) problems.push(`Текст ${bare.length} знаков, для ${spec.name} нужно от ${spec.min} до ${spec.max}.`);

  const headings = blocks.filter((b) => b.kind === "h").length;
  const [hMin, hMax] = spec.headings;
  if (headings < hMin || headings > hMax) {
    problems.push(hMax === 0 ? `В посте для ${spec.name} подзаголовков не бывает: убери «## ».` : `Подзаголовков ${headings}, нужно от ${hMin} до ${hMax}.`);
  }
  if (/^\s*#(?!# )/m.test(text.body) || /^\s*###/m.test(text.body)) problems.push("Подзаголовки — только «## » в начале строки.");
  if (/^\s*[-*]\s/m.test(text.body)) problems.push("Пункты списка — только «• » в начале строки, без дефиса и звёздочки.");

  // Запрос — там, где его видят поисковик и человек: заголовок и первый абзац.
  const first = blocks.find((b) => b.kind === "p")?.text ?? "";
  if (missingStems(topic.query, title).length) problems.push(`Запроса «${topic.query}» нет в заголовке — поставь его естественно.`);
  if (missingStems(topic.query, first.replace(LINK, "$1")).length) problems.push(`Запроса «${topic.query}» нет в первом абзаце.`);

  const spots = dashSpots(all);
  if (spots.length) problems.push(`Длинное тире или тире дефисом: ${spots.map((s) => `«${s}»`).join(", ")}. Замени двоеточием, запятой или точкой.`);
  const markers = aiMarkers(all);
  if (markers.length) problems.push(`Штампы: ${markers.join(", ")}. Скажи проще и конкретнее.`);

  if (all.includes("%")) problems.push("Проценты запрещены: у нас нет таких фактов.");
  if (MONEY.test(all)) problems.push("Суммы денег запрещены: цен в статьях на площадках нет.");
  if (PROMISE.test(all)) problems.push("Обещаний результата нет: ни «гарантируем», ни «в N раз».");
  const allowed = allowedNumbers(topic);
  const extra = [...new Set(numbersIn(all))].filter((n) => n.length > 2 && !allowed.has(n));
  if (extra.length) problems.push(`Числа, которых нет в фактах: ${extra.join(", ")}. Пиши только числа из фактов.`);

  problems.push(...linkProblems(topic, platform, text.body));
  return problems;
}

/** Ссылки: только наши адреса из списка темы, не больше, чем можно площадке, текстом — имя студии или проекта. */
export function linkProblems(topic: OutsideTopic, platform: Platform, body: string): string[] {
  const spec = PLATFORM[platform];
  const allowed = allowedLinks(topic);
  const links = linksIn(body);
  const problems: string[] = [];
  if (!links.length) problems.push("Нет ссылки на нас: поставь одну из списка адресов, текстом ссылки — имя студии или проекта.");
  if (links.length > spec.links) problems.push(`Ссылок ${links.length}, для ${spec.name} — не больше ${spec.links}.`);
  for (const link of links) {
    const target = allowed.find((a) => a.url === link.url.replace(/[?#].*$/, "").replace(/\/+$/, ""));
    if (!target) {
      problems.push(`Ссылка на адрес не из списка: ${link.url}.`);
      continue;
    }
    const anchor = link.anchor.toLowerCase();
    const named = anchor.includes("devuz") || target.names.some((n) => anchor.includes(n.toLowerCase()));
    if (!named) problems.push(`Текст ссылки «${link.anchor}»: в нём должно быть «DevUz» или название проекта, а не поисковая фраза.`);
  }
  const rest = body.replace(LINK, "");
  if (/https?:\/\/|www\.|devuz\.studio/i.test(rest)) problems.push("Адрес голым текстом: только ссылкой «[текст](адрес)».");
  return problems;
}

/* ── Как текст уходит в редактор площадки ──────────────────────────────── */

function escHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Строка с разметкой → HTML: экранирование, **жирный**, ссылки с метками. */
function inlineHtml(text: string, platform: Platform, topicKey: string): string {
  let out = "";
  let at = 0;
  for (const m of text.matchAll(LINK)) {
    out += escHtml(text.slice(at, m.index)).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    out += `<a href="${escHtml(withUtm(m[2], platform, topicKey))}">${escHtml(m[1])}</a>`;
    at = (m.index ?? 0) + m[0].length;
  }
  return out + escHtml(text.slice(at)).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

/**
 * HTML для вставки в редактор vc.ru и Дзена: подзаголовки, списки, ссылки
 * сохраняются, как при копировании со страницы. Ссылки — с метками для
 * Метрики, в базе текст хранится без них.
 */
export function toHtml(body: string, platform: Platform, topicKey: string): string {
  const out: string[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) out.push(`<ul>${list.map((li) => `<li>${li}</li>`).join("")}</ul>`);
    list = [];
  };
  for (const block of blocksOf(body)) {
    if (block.kind === "li") {
      list.push(inlineHtml(block.text, platform, topicKey));
      continue;
    }
    flush();
    out.push(block.kind === "h" ? `<h2>${inlineHtml(block.text, platform, topicKey)}</h2>` : `<p>${inlineHtml(block.text, platform, topicKey)}</p>`);
  }
  flush();
  return out.join("\n");
}

/** Простой текст — для Tenchat и редакторов, которые HTML не берут: ссылка адресом в скобках. */
export function toPlain(body: string, platform: Platform, topicKey: string): string {
  return blocksOf(body)
    .map((b) => {
      const text = b.text.replace(LINK, (_, anchor: string, url: string) => `${anchor} (${withUtm(url, platform, topicKey)})`).replace(/\*\*/g, "");
      return b.kind === "li" ? `• ${text}` : text;
    })
    .join("\n\n");
}

/* ── Как текст уходит на площадку сам ──────────────────────────────────── */

/** Узел страницы Telegraph: строка или тег с детьми (api.telegra.ph, `Node`). */
export type TelegraphNode = string | { tag: string; attrs?: { href: string }; children?: TelegraphNode[] };

/** Строка с разметкой → узлы Telegraph: текст, **жирный**, ссылки с метками. */
function inlineNodes(text: string, platform: Platform, topicKey: string): TelegraphNode[] {
  const out: TelegraphNode[] = [];
  const plain = (chunk: string) => {
    chunk.split(/\*\*(.+?)\*\*/g).forEach((part, i) => {
      if (!part) return;
      out.push(i % 2 ? { tag: "b", children: [part] } : part);
    });
  };
  let at = 0;
  for (const m of text.matchAll(LINK)) {
    plain(text.slice(at, m.index));
    out.push({ tag: "a", attrs: { href: withUtm(m[2], platform, topicKey) }, children: [m[1]] });
    at = (m.index ?? 0) + m[0].length;
  }
  plain(text.slice(at));
  return out;
}

/**
 * Текст → страница Telegraph. Своего h2 у Telegraph нет (теги: h3, h4, p,
 * ul, li, a, b…), поэтому подзаголовок — h3. Строки HTML сюда не попадают:
 * узлы — данные, Telegraph сам их экранирует.
 */
export function toTelegraphNodes(body: string, platform: Platform, topicKey: string): TelegraphNode[] {
  const out: TelegraphNode[] = [];
  let list: TelegraphNode[] = [];
  const flush = () => {
    if (list.length) out.push({ tag: "ul", children: list });
    list = [];
  };
  for (const block of blocksOf(body)) {
    if (block.kind === "li") {
      list.push({ tag: "li", children: inlineNodes(block.text, platform, topicKey) });
      continue;
    }
    flush();
    out.push({ tag: block.kind === "h" ? "h3" : "p", children: inlineNodes(block.text, platform, topicKey) });
  }
  flush();
  return out;
}

/**
 * Пост для Postiz. Он принимает HTML и сам переводит его в то, что берёт
 * площадка: Telegram оставляет ссылки и жирный, ВКонтакте — только текст,
 * поэтому ВКонтакте ссылка пишется адресом в скобках, как в Tenchat.
 * Заголовок — первой строкой поста (у постов заголовка нет).
 */
export function postizContent(title: string, body: string, platform: Platform, topicKey: string): string {
  const head = `<p><strong>${escHtml(title)}</strong></p>`;
  if (platform === "telegram") return `${head}\n${toHtml(body, platform, topicKey)}`;
  const paragraphs = toPlain(body, platform, topicKey)
    .split(/\n\n+/)
    .map((p) => `<p>${escHtml(p)}</p>`);
  return [head, ...paragraphs].join("\n");
}

/** Тело запроса Postiz «опубликовать сейчас» (POST /public/v1/posts). */
export function postizRequest(platform: Platform, channelId: string, content: string, now: Date) {
  const type = PLATFORM[platform].postiz;
  if (!type) throw new Error(`${platform} не идёт через Postiz`);
  return {
    type: "now",
    date: now.toISOString(),
    shortLink: false,
    tags: [],
    posts: [{ integration: { id: channelId }, value: [{ content, image: [] }], settings: { __type: type } }],
  };
}

/* ── Неделя ────────────────────────────────────────────────────────────── */

/** Черновики готовятся с 11:00 до 19:59 по Ташкенту: карточка приходит днём. */
export const OUTSIDE_FROM_HOUR = 11;
export const OUTSIDE_TO_HOUR = 20;

export function tashkentHour(now: Date): number {
  return new Date(now.getTime() + TASHKENT_OFFSET_MS).getUTCHours();
}

/** Понедельник недели по Ташкенту, ГГГГ-ММ-ДД: одна неделя — один заход. */
export function weekOf(now: Date): string {
  const local = new Date(now.getTime() + TASHKENT_OFFSET_MS);
  const back = (local.getUTCDay() + 6) % 7;
  return new Date(local.getTime() - back * 86_400_000).toISOString().slice(0, 10);
}

export function generationHour(now: Date): boolean {
  const hour = tashkentHour(now);
  return hour >= OUTSIDE_FROM_HOUR && hour < OUTSIDE_TO_HOUR;
}

export type Written = { platform: Platform; topic_key: string };

/**
 * Темы недели: каждой площадке — первая тема по списку, которой у неё ещё
 * не было и которую не взяла соседняя площадка в эту же неделю. Площадка с
 * неопубликованным черновиком новую не получает: черновики не копятся.
 */
export function pickTopics(
  written: readonly Written[],
  waiting: readonly Platform[],
  topics: readonly OutsideTopic[] = OUTSIDE_TOPICS,
  /** Кому писать на этой неделе: площадка, которая публикуется сама, — только когда подключена. */
  platforms: readonly Platform[] = PLATFORMS,
): Partial<Record<Platform, OutsideTopic>> {
  const taken = new Set<string>();
  const out: Partial<Record<Platform, OutsideTopic>> = {};
  for (const platform of platforms) {
    if (waiting.includes(platform)) continue;
    const done = new Set(written.filter((w) => w.platform === platform).map((w) => w.topic_key));
    const topic = topics.find((t) => !done.has(t.key) && !taken.has(t.key));
    if (!topic) continue;
    taken.add(topic.key);
    out[platform] = topic;
  }
  return out;
}

/* ── Опубликованная статья ─────────────────────────────────────────────── */

/** Ссылку на статью принимаем только с адреса этой площадки, по https. */
export function publishedUrl(platform: Platform, raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (!PLATFORM[platform].hosts.some((h) => host === h || host.endsWith(`.${h}`))) return null;
  if (url.pathname.length < 2) return null;
  url.hash = "";
  return url.href;
}

export const LINK_STATES = ["follow", "nofollow", "missing", "unreachable"] as const;
export type LinkState = (typeof LINK_STATES)[number];

/**
 * Есть ли на странице статьи ссылка на нас и передаёт ли она вес. Ссылку
 * площадка может завернуть в свой переход (`/redirect?url=…`) — поэтому
 * адрес раскодируется. `nofollow`, `ugc` и `sponsored` поисковики считают
 * просьбой не передавать вес.
 */
export function ourLinkOn(html: string): { state: "follow" | "nofollow" | "missing"; rel: string | null } {
  let rel: string | null = null;
  let found = false;
  for (const m of html.matchAll(/<a\b[^>]*>/gi)) {
    const tag = m[0];
    const href = /\bhref\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1] ?? "";
    let decoded = href;
    try {
      decoded = decodeURIComponent(href.replace(/&amp;/g, "&"));
    } catch {}
    if (!/devuz\.studio/i.test(decoded)) continue;
    found = true;
    const r = /\brel\s*=\s*["']([^"']*)["']/i.exec(tag)?.[1]?.toLowerCase() ?? "";
    if (!/nofollow|ugc|sponsored/.test(r)) return { state: "follow", rel: r || null };
    rel = r;
  }
  return found ? { state: "nofollow", rel } : { state: "missing", rel: null };
}

/** Повторная проверка опубликованной статьи — раз в неделю. */
export const RECHECK_MS = 7 * 86_400_000;
/** Первая — не раньше, чем через 10 минут после «Опубликовал»: площадка не сразу отдаёт страницу. */
export const FIRST_CHECK_MS = 10 * 60_000;

export function checkDue(row: { published_at: string | null; link_checked_at: string | null }, now: Date): boolean {
  if (!row.published_at) return false;
  const published = Date.parse(row.published_at);
  if (now.getTime() - published < FIRST_CHECK_MS) return false;
  if (!row.link_checked_at) return true;
  return now.getTime() - Date.parse(row.link_checked_at) >= RECHECK_MS;
}

/* ── Карточка недели ───────────────────────────────────────────────────── */

export type CardLine = { platform: Platform; title: string };

/** Текст карточки в бот (HTML Telegram): что готово, что ждёт с прошлых недель. */
export function weekCardText(
  made: readonly CardLine[],
  waiting: readonly CardLine[],
  esc: (s: string) => string,
  /** Ушли сами: Telegraph, ВКонтакте, Telegram-канал. */
  auto: readonly CardLine[] = [],
): string {
  const line = (l: CardLine) => `• ${esc(PLATFORM[l.platform].name)}: «${esc(l.title)}»`;
  const parts = ["📝 <b>Статьи на площадки</b>"];
  if (auto.length) parts.push("", "Ушли сами, делать ничего не нужно:", ...auto.map(line));
  if (made.length) parts.push("", "Готовы на эту неделю:", ...made.map(line));
  if (waiting.length) parts.push("", "Ещё не опубликованы:", ...waiting.map(line));
  if (made.length || waiting.length) {
    parts.push(
      "",
      "В «Статьях на площадках»: «Скопировать», вставить в редактор площадки, опубликовать и вставить ссылку на статью. Новый черновик площадке — когда опубликован или пропущен прошлый.",
    );
  }
  return parts.join("\n");
}
