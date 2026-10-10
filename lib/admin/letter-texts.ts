import { withoutGreeting } from "@/lib/admin/hello-first";
import {
  PROTOTYPE_HOURS,
  bannedPhrase,
  foreignScript,
  greetsSender,
  inventedNumbers,
  jargonWords,
  leadFindings,
  outageFinding,
  outreachFindings,
  outreachHooks,
  type MessageProblem,
} from "@/lib/admin/outreach";
import type { Finding } from "@/lib/audit/checks";
import type { Reference } from "@/lib/audit/proof";
import { cases } from "@/content/cases";

/**
 * Тексты писем касания: свои у менеджера, общие у команды, заходы у
 * автопрогона — и A/B между ними.
 *
 * Владелец, 10.10.2026: «менеджеры жалуются что текст сильно большой и им
 * приходится его прогонять через нейронку чтобы сократить и очеловечить, а то
 * там одни цифры и много текста». И: «Находку сократи до тезисов где клиенты
 * увидят что они теряют прибыль, а для их конкурентов мы уже реализовали
 * этот функционал. А/б тест может дать ручным и автоматическим, в
 * автоматическом ты сам придумываешь заходы из курсов по продажам, в ручных —
 * вписывает менеджер».
 *
 * Письмо больше не пишет модель: текст — человека (или заход из курса
 * продаж), а факты о сайте — тезисы, собранные кодом из находок, которые
 * повторились при проверке по факту (lib/audit/verify.ts). Модель остаётся
 * только переводчиком на язык сайта и ответа (lib/admin/letter-translate.ts).
 */

/** Выключатель: false — письмо снова пишет модель (composeLetter), как до 10.10.2026. */
export const LETTER_TEXTS = true;

/* ── Подстановки ─────────────────────────────────────────────────────────── */

export type Slot = "theses" | "site" | "company" | "name" | "who" | "prototype";

/**
 * Подстановки — по-русски для русской панели и латиницей для узбекской и
 * польской: менеджер пишет ту, что видит у себя в подсказке, работают обе.
 */
export const PLACEHOLDERS: Readonly<Record<Slot, readonly string[]>> = {
  theses: ["тезисы", "tezislar"],
  site: ["сайт", "sayt"],
  company: ["компания", "kompaniya"],
  name: ["имя", "ism"],
  who: ["кто", "kim"],
  prototype: ["прототип", "prototip"],
};

const SLOT_OF = new Map<string, Slot>(
  (Object.entries(PLACEHOLDERS) as [Slot, readonly string[]][]).flatMap(([slot, names]) =>
    names.map((n) => [n, slot] as const),
  ),
);

const TOKEN = /\{([^{}\n]{1,24})\}/g;

/** Какие подстановки в тексте неизвестны — опечатка уйдёт клиенту фигурными скобками. */
export function unknownPlaceholders(template: string): string[] {
  return [...new Set([...template.matchAll(TOKEN)].map((m) => m[1].trim().toLowerCase()).filter((n) => !SLOT_OF.has(n)))];
}

export function hasSlot(template: string, slot: Slot): boolean {
  return [...template.matchAll(TOKEN)].some((m) => SLOT_OF.get(m[1].trim().toLowerCase()) === slot);
}

export type LetterContext = {
  host: string;
  label: string | null;
  sender: string;
  /** Тезисы — уже готовыми строками (theses). */
  theses: readonly string[];
};

/** Прототип — единственный срок в письме (PROTOTYPE_HOURS), как и раньше. */
/**
 * Кто пишет — одной фразой. У автопрогона «имя» — это сама студия, и
 * «{имя} из DevUz Studio» превратилось бы в «DevUz Studio из DevUz Studio».
 */
export function whoLine(sender: string): string {
  return /devuz/i.test(sender) || !sender.trim()
    ? "Это студия DevUz (devuz.studio)"
    : `Это ${sender.trim()} из студии DevUz (devuz.studio)`;
}

export const PROTOTYPE_LINE = `За ${PROTOTYPE_HOURS} часов бесплатно соберём прототип вашего нового сайта: откроете с телефона и посмотрите вживую.`;

export function renderLetter(template: string, ctx: LetterContext): string {
  const values: Record<Slot, string> = {
    theses: ctx.theses.join("\n"),
    site: ctx.host,
    company: ctx.label?.trim() || ctx.host,
    name: ctx.sender,
    who: whoLine(ctx.sender),
    prototype: PROTOTYPE_LINE,
  };
  return template
    .replace(TOKEN, (whole, name: string) => {
      const slot = SLOT_OF.get(name.trim().toLowerCase());
      return slot ? values[slot] : whole;
    })
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/* ── Тезисы ──────────────────────────────────────────────────────────────── */

/**
 * Чем находка оборачивается — коротко и словами покупателя.
 *
 * В отчёте аудита у находки «чем оборачивается» в два предложения с цифрами
 * («уходит примерно каждый второй»): для отчёта это хорошо, для реплики в
 * Telegram — то самое «много текста и одни цифры». Здесь — полфразы про его
 * клиентов. Нет строки — первое предложение из отчёта.
 */
const LOSS: Readonly<Record<string, string>> = {
  unreachable: "клиенты попадают в никуда и уходят к тем, у кого открылось",
  http_error: "клиенты видят ошибку вместо страницы и уходят к конкурентам",
  under_construction: "клиент видит заглушку и ищет другую компанию",
  no_viewport: "покупатели с телефона уходят, не дочитав",
  no_responsive_css: "покупатели с телефона уходят, не дочитав",
  horizontal_scroll: "с телефона страница уезжает вбок, и покупатель закрывает её",
  tiny_text: "с телефона текст не прочитать, и покупатель уходит",
  zoom_locked: "с телефона нельзя увеличить текст, и покупатель уходит",
  no_phone: "кто хотел позвонить, не находит номер и звонит конкурентам",
  phone_not_clickable: "часть звонков просто не случается",
  no_messenger: "кто хотел написать, не пишет вам вовсе",
  noindex: "Google не показывает сайт, и клиенты находят конкурентов",
  robots_blocked: "Google не показывает сайт, и клиенты находят конкурентов",
  slow: "посетители не дожидаются и уходят",
  heavy_home: "с мобильного интернета страница грузится долго, и посетитель уходит",
  broken_links: "часть страниц ведёт в тупик, и клиент уходит",
  dead_end_pages: "со страницы некуда нажать, и клиент уходит",
  placeholder_text: "заготовленный текст на сайте отпугивает покупателя",
  no_https: "браузер пишет «небезопасно», и клиент не оставляет заявку",
  cert_expiring: "скоро браузер начнёт пугать клиентов предупреждением",
  mixed_content: "браузер пишет «небезопасно», и клиент не оставляет заявку",
  popup_onload: "всплывающее окно выгоняет посетителя с первой секунды",
  autoplay_sound: "звук при открытии выгоняет посетителя",
  broken_images: "вместо фото пустые места, и товар не продаёт",
  one_language: "часть клиентов не читает на этом языке и уходит",
  no_trust: "клиент сомневается и уходит к тем, кому верит",
  client_rendered: "в поиске сайт показывают ниже конкурентов",
  no_sitemap: "часть услуг клиенты в поиске просто не видят",
  no_schema: "конкуренты с картинкой и ценой в выдаче забирают клик",
  no_og: "клиенты реже пересылают ссылку знакомым",
  no_canonical: "в поиске сайт показывают ниже, чем мог бы",
  no_description: "клиент выбирает в поиске тех, у кого оно есть",
  no_description_pages: "клиент выбирает в поиске тех, у кого оно есть",
  no_title: "клиент выбирает в поиске тех, у кого оно есть",
  no_h1: "клиент не сразу понимает, туда ли попал",
  no_robots: "в поиске сайт показывают хуже, чем мог бы",
  dated_layout: "клиент выбирает тех, кто выглядит свежее",
  wall_of_text: "клиент не дочитывает и уходит",
  ancient_scripts: "он медленнее и ломается на новых телефонах",
  ancient_layout: "он медленнее и ломается на новых телефонах",
  no_favicon: "сайт теряется среди открытых вкладок",
  font_zoo: "сайт выглядит неаккуратно, и доверия меньше",
  thin_pages: "клиент не находит ответа и уходит",
  same_title: "клиент не находит в поиске нужную услугу",
  stale_copyright: "кажется, что компания уже не работает",
  visitor_counter: "сайт выглядит заброшенным",
  img_no_alt: "Google не показывает их в поиске по картинкам",
  stale_sitemap: "кажется, что компания уже не работает",
};

/** Потери меньше — не тезис: «теряете 1–3 из ста» не убеждает, а отвлекает. */
const LOSS_WORTH = 5;

/**
 * Как назвать находку в письме — если её заголовок в отчёте технический.
 *
 * Отчёт аудита пишет «Сайт отвечает ошибкой 404», «robots.txt запрещает
 * поисковикам весь сайт», «размером 10 пикселей»: для отчёта точно, для
 * владельца бизнеса — жаргон, и проверка такое письмо не пропустит. Здесь —
 * то же самое словами покупателя. Нет строки — заголовок из отчёта.
 */
const TITLE: Readonly<Record<string, string>> = {
  unreachable: "Сайт не открывается",
  http_error: "Вместо сайта открывается страница с ошибкой",
  horizontal_scroll: "С телефона страница уезжает вбок",
  tiny_text: "Текст на сайте слишком мелкий",
  noindex: "Сайт закрыт от Google",
  robots_blocked: "Сайт закрыт от Google",
  broken_links: "Часть ссылок ведёт на несуществующие страницы",
  broken_images: "Часть картинок на сайте не открывается",
  dead_end_pages: "На части страниц нечего нажать",
  no_https: "Браузер помечает сайт как небезопасный",
  mixed_content: "Браузер помечает сайт как небезопасный",
  cert_expiring: "У сайта скоро кончится защита соединения",
  one_language: "Сайт только на одном языке",
  heavy_home: "Главная страница слишком тяжёлая для мобильного интернета",
  // Находки не «про деньги» — письмо открывается ими, только если других нет.
  client_rendered: "Google почти не видит текста на главной",
  no_sitemap: "Google находит не все ваши страницы",
  no_canonical: "Google путается, какую из ваших страниц показывать",
  no_description: "В поиске у сайта нет понятного описания",
  no_description_pages: "В поиске у страниц нет понятного описания",
  no_title: "В поиске у страницы нет понятного названия",
  no_h1: "На главной нет понятного заголовка",
  no_robots: "Google не получает от сайта подсказок, что показывать",
  ancient_scripts: "Сайт собран на устаревших деталях",
  ancient_layout: "Сайт сделан по правилам двадцатилетней давности",
  font_zoo: "На сайте слишком много разных шрифтов",
  thin_pages: "Часть страниц почти пустые",
  same_title: "Все страницы в Google называются одинаково",
  img_no_alt: "Картинки на сайте ничем не подписаны",
  stale_sitemap: "Сайт давно не обновлялся",
};

const firstSentence = (text: string) => (text.split(/(?<=[.!?])\s+/)[0] ?? text).replace(/[.!?]+$/, "").slice(0, 140);
const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);
const plain = (text: string) => text.trim().replace(/[.!?]+$/, "");

/**
 * Два-три тезиса вместо разбора: что не так и что он теряет, и — если такой
 * проект у нас правда есть — что компании из его ниши мы это уже сделали.
 *
 * Второго тезиса без проекта нет: «делали вашим конкурентам» без имени и
 * ссылки адресат читает как пустую угрозу, а выдуманный — проверит одним
 * переходом (то же правило, что было в OUTREACH_SYSTEM).
 */
export function theses(findings: readonly Finding[], reference: Reference | null): string[] {
  const shown = outreachFindings(findings);
  const outage = outageFinding(shown);
  const main = outage ?? leadFindings(shown, 1)[0] ?? shown[0];
  if (!main) return [];

  const loss = LOSS[main.code] ?? lowerFirst(firstSentence(main.impact));
  const out = [`• ${plain(TITLE[main.code] ?? main.title)}: ${plain(loss)}.`];

  const lost = outage ? null : outreachHooks(shown).lost;
  if (outage) out.push("• Пока это так, вы теряете каждого, кто зашёл на сайт.");
  else if (lost && lost[1] >= LOSS_WORTH) {
    out.push(
      lost[0] === lost[1]
        ? `• По нашей оценке, так вы теряете около ${lost[1]} обращений из каждых 100.`
        : `• По нашей оценке, так вы теряете от ${lost[0]} до ${lost[1]} обращений из каждых 100.`,
    );
  }

  if (reference) out.push(`• Для «${reference.name}» (${plain(reference.niche)}) мы это уже сделали, посмотрите: ${reference.url}`);
  return out;
}

/* ── Заходы автопрогона ──────────────────────────────────────────────────── */

/**
 * Заходы из курсов продаж — для автопрогона и для менеджера, у которого нет
 * своих текстов и нет общих.
 *
 * - «Боль и решение» — PAS (Problem → Agitate → Solve): факт, чем грозит,
 *   решение и один лёгкий вопрос.
 * - «Вопрос» — из SPIN: открываем извлекающим вопросом о его потерях, потом
 *   факты, потом предложение. Вопрос о его деньгах держит внимание дольше,
 *   чем рассказ о нас.
 * - «Свои в нише» — социальное доказательство первой строкой: мы работаем в
 *   его нише. Только если такой проект у нас правда есть (needsReference).
 *
 * Ключи не меняются: по ним считается статистика (prospects.letter_variant).
 */
export type Arm = { key: string; needsReference: boolean; body: string };

export const AUTO_ARMS: readonly Arm[] = [
  {
    key: "pain",
    needsReference: false,
    body: "{кто}. Посмотрели ваш сайт {сайт}:\n\n{тезисы}\n\n{прототип} Собрать для вас?",
  },
  {
    key: "question",
    needsReference: false,
    body: "{кто}. Вы знаете, сколько обращений теряет {сайт}? Мы проверили:\n\n{тезисы}\n\n{прототип} Показать, как это будет выглядеть у вас?",
  },
  {
    key: "rival",
    needsReference: true,
    body: "{кто}. Мы делаем сайты в вашей нише и посмотрели {сайт}:\n\n{тезисы}\n\n{прототип} Собрать?",
  },
];

/* ── Какой текст достаётся касанию ───────────────────────────────────────── */

/** Текст из базы: свой у менеджера (owner) или общий (owner = null). */
export type StoredText = { id: string; owner: string | null; slot: "a" | "b"; body: string; body_uz: string | null };

/** Что записывается в prospects.letter_variant. */
export type Variant = { id: string; body: string; body_uz: string | null };

export const variantOfText = (t: StoredText): Variant => ({ id: `text:${t.id}`, body: t.body, body_uz: t.body_uz });
export const variantOfArm = (a: Arm): Variant => ({ id: `auto:${a.key}`, body: a.body, body_uz: null });

/**
 * Из чего выбирать: свои тексты менеджера → общие тексты команды → заходы
 * автопрогона. У автопрогона — только его заходы (owner = null у writer).
 * «Свои в нише» — только при проекте в его нише.
 */
export function candidates(input: {
  autopilot: boolean;
  own: readonly StoredText[];
  common: readonly StoredText[];
  hasReference: boolean;
}): Variant[] {
  if (!input.autopilot && input.own.length) return input.own.map(variantOfText);
  if (!input.autopilot && input.common.length) return input.common.map(variantOfText);
  return AUTO_ARMS.filter((a) => !a.needsReference || input.hasReference).map(variantOfArm);
}

/** Поровну и случайно: так A/B честный, а не «кто первый в списке». */
export function pickVariant(list: readonly Variant[], random: () => number = Math.random): Variant | null {
  if (!list.length) return null;
  return list[Math.min(list.length - 1, Math.floor(random() * list.length))];
}

/* ── Проверки ────────────────────────────────────────────────────────────── */

/** Реплика в переписке, а не письмо: на телефоне длинное не дочитывают. */
export const MAX_WORDS = 100;
export const MIN_WORDS = 12;

const caseNames = () => cases.filter((c) => c.slug !== "devuz").map((c) => c.name);

/**
 * Что не даёт отправить письмо по тексту. Проверки те же, что держали письмо
 * модели (lib/admin/outreach.ts → messageProblems), минус «назови балл и
 * потери» — их больше нет в письме, по просьбе владельца.
 *
 * Числа — только из тезисов, домена и срока прототипа: «соберём за 3 дня» в
 * тексте менеджера — обещание, которого студия не давала.
 */
export function letterProblems(
  message: string,
  ctx: Pick<LetterContext, "host" | "label" | "sender" | "theses"> & { reference: string | null },
): MessageProblem[] {
  const problems: MessageProblem[] = [];
  const words = message.trim().split(/\s+/).filter(Boolean).length;
  if (words < MIN_WORDS) problems.push({ code: "short", text: `Сообщение короче ${MIN_WORDS} слов.`, args: [MIN_WORDS] });
  if (words > MAX_WORDS) {
    problems.push({ code: "long", text: `Сообщение длиннее ${MAX_WORDS} слов — на телефоне такое не дочитывают.`, args: [MAX_WORDS] });
  }
  if (withoutGreeting(message) !== message.trim()) {
    problems.push({ code: "greeting", text: "Письмо начинается с приветствия, а «Здравствуйте» уже ушло отдельным сообщением." });
  }
  const allowed = [ctx.theses.join(" "), ctx.host, ctx.label ?? "", String(PROTOTYPE_HOURS)].join(" ");
  const invented = inventedNumbers(message, allowed);
  if (invented.length) {
    problems.push({ code: "invented", text: `Числа, которых нет в проверке сайта: ${invented.join(", ")}.`, args: [invented.join(", ")] });
  }
  const alien = foreignScript(message);
  if (alien.length) problems.push({ code: "foreign_script", text: `Знаки чужого письма: ${alien.join(" ")}.`, args: [alien.join(" ")] });
  const jargon = jargonWords(message, [ctx.host]);
  if (jargon.length) {
    problems.push({ code: "jargon", text: `Технические слова: ${jargon.join(", ")}.`, args: [jargon.join(", ")] });
  }
  const greeted = greetsSender(message, ctx.sender);
  if (greeted) problems.push({ code: "greets_sender", text: `Письмо здоровается именем «${greeted}».`, args: [greeted] });
  if (bannedPhrase(message)) problems.push({ code: "banned", text: "Запрещённое обещание или знак: «в топ», «гарантируем», проценты, эмодзи." });
  const foreign = caseNames().filter((n) => n !== ctx.reference && message.includes(n));
  if (foreign.length) {
    problems.push({ code: "foreign_reference", text: `Наш проект не из его ниши: ${foreign.join(", ")}.`, args: [foreign.join(", ")] });
  }
  return problems;
}

/** Образец для предпросмотра и проверки текста при сохранении — без базы. */
export const SAMPLE: LetterContext & { reference: string | null } = {
  host: "example.uz",
  label: "Пример",
  sender: "Имя",
  theses: [
    "• Телефон на сайте нельзя нажать с телефона: часть звонков просто не случается.",
    "• По нашей оценке, так теряется 20–35 обращений из каждых 100.",
    "• Для «Пример» (та же ниша) мы это уже сделали, посмотрите: https://devuz.studio/cases",
  ],
  reference: null,
};

/**
 * Что не так с самим текстом — при сохранении, до первого касания.
 * `no_theses` — без тезисов письмо перестаёт быть письмом о его сайте, а это
 * то, ради чего человек вообще отвечает (и правило проверки по факту).
 */
export function textProblems(template: string, sender: string): MessageProblem[] {
  const problems: MessageProblem[] = [];
  const unknown = unknownPlaceholders(template);
  if (unknown.length) {
    problems.push({ code: "unknown_placeholder", text: `Неизвестные подстановки: ${unknown.map((u) => `{${u}}`).join(", ")}.`, args: [unknown.join(", ")] });
  }
  if (!hasSlot(template, "theses")) problems.push({ code: "no_theses", text: "В тексте нет {тезисы} — без них письмо не о его сайте." });
  const rendered = renderLetter(template, { ...SAMPLE, sender });
  return [...problems, ...letterProblems(rendered, { ...SAMPLE, sender })];
}

/* ── A/B: кто лучше ──────────────────────────────────────────────────────── */

export type ArmStats = { id: string; sent: number; replied: number; wanted: number; deals: number };

/** Меньше — «рано судить»: на десяти письмах любой текст может выиграть случайно. */
export const MIN_SENT = 20;
/** С какой уверенностью называем победителя. */
export const CONFIDENT = 0.9;

/** Φ(x) — нормальное распределение, без библиотек (Абрамовиц и Стиган, 26.2.17). */
function normalCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}

/**
 * Вероятность, что у `b` доля ответов выше, чем у `a` — по байесовской
 * оценке с равномерным началом (Beta(1,1)) и нормальным приближением.
 * На малых числах честнее, чем «у кого больше ответов».
 */
export function chanceBetter(a: ArmStats, b: ArmStats): number {
  const post = (s: ArmStats) => {
    const alpha = s.replied + 1;
    const beta = Math.max(0, s.sent - s.replied) + 1;
    const n = alpha + beta;
    return { mean: alpha / n, variance: (alpha * beta) / (n * n * (n + 1)) };
  };
  const pa = post(a);
  const pb = post(b);
  return normalCdf((pb.mean - pa.mean) / Math.sqrt(pa.variance + pb.variance));
}

export type Verdict = { kind: "early" } | { kind: "even" } | { kind: "leader"; id: string; chance: number };

/** Кто лучше по ответам: «рано», «пока поровну» или лидер с уверенностью. */
export function verdict(arms: readonly ArmStats[]): Verdict {
  if (arms.length < 2 || arms.some((a) => a.sent < MIN_SENT)) return { kind: "early" };
  const ranked = [...arms].sort((x, y) => (y.replied + 1) / (y.sent + 2) - (x.replied + 1) / (x.sent + 2));
  const chance = chanceBetter(ranked[1], ranked[0]);
  return chance >= CONFIDENT ? { kind: "leader", id: ranked[0].id, chance } : { kind: "even" };
}
