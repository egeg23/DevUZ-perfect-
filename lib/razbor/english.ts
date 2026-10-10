import { services } from "@/content/services";
import { CITIES, type City } from "@/content/razbor/catalog";
import { missingStems } from "@/lib/marketing/article-check";
import { slugify } from "@/lib/razbor/model";
import { serviceFor } from "@/lib/razbor/service-link";
import { numbersIn, pricePool, unsupportedNumbers, type ArticleProblem } from "@/lib/razbor/shift";
import { TENDER_SERVICE, isTender } from "@/lib/razbor/tender";
import type { RazborArticle } from "@/lib/razbor/store";

/**
 * Английская версия разбора — то, что считается без базы и без модели.
 *
 * Владелец, 10.10.2026: «На английском давай тоже делать, там 404». Ночная
 * смена пишет разбор по-русски и по-узбекски, человек его проверяет и
 * публикует. Английскую версию сервер делает сам — из опубликованной
 * русской, уже проверенной человеком: те же находки, те же числа, тот же
 * снимок к каждой находке (lib/razbor/english-run.ts).
 *
 * Это не перевод слово в слово. Читатель другой: иностранная компания или
 * человек, который ищет подрядчика в Узбекистане по-английски, и запрос у
 * него свой — «restaurant website in Tashkent», а не переведённое «сайт для
 * ресторана в Ташкенте». Запрос сверяется с Google Trends и Вордстатом, как
 * у любой статьи сайта.
 */

/**
 * Род занятий по-английски — для ниш каталога.
 *
 * Словарь, а не модель: ниши каталога повторяются от разбора к разбору, и
 * запрос у всех разборов одной ниши должен звучать одинаково. Ниши вне
 * каталога (их смена называет сама) и тендерные разборы называет дешёвая
 * модель, один раз на разбор.
 */
export const NICHE_EN: Readonly<Record<string, string>> = {
  stomatologiya: "dental clinic",
  medcentr: "medical center",
  "internet-magazin": "online store",
  restoran: "restaurant",
  "dostavka-edy": "food delivery",
  avtoservis: "car service",
  "stroitelnaya-kompaniya": "construction company",
  mebel: "furniture store",
  "uchebnyy-centr": "training center",
  turagentstvo: "travel agency",
  yurfirma: "law firm",
  "salon-krasoty": "beauty salon",
  logistika: "logistics company",
  nedvizhimost: "residential complex",
  svyaz: "internet provider",
  "agentstvo-nedvizhimosti": "real estate agency",
  fitnes: "fitness club",
};

/** Род занятий от модели: латиница, два-сорок знаков, без имени компании. */
export function validSubject(raw: string): string | null {
  const subject = raw.trim().toLowerCase().replace(/\s+/g, " ");
  return /^[a-z][a-z -]{2,40}$/.test(subject) && !/\bwebsite\b/.test(subject) ? subject : null;
}

/** Запрос тендерного разбора от модели: латиница и цифры, до восьми слов. */
export function validTenderQuery(raw: string): string | null {
  const query = raw.trim().toLowerCase().replace(/\s+/g, " ");
  return /^[a-z][a-z0-9 -]{8,80}$/.test(query) && query.split(" ").length <= 8 ? query : null;
}

export const cityByKey = (key: string): City | null => CITIES.find((c) => c.key === key) ?? null;

/**
 * Запрос английского разбора сайта: «restaurant website in Tashkent».
 *
 * Так ищут по-английски — род занятий, «website», город. «Website for
 * restaurant in Tashkent» — дословный перевод русского запроса, а не то,
 * что набирают.
 */
export function englishQuery(subject: string, city: City): string {
  return `${subject} website in ${city.en}`;
}

/** Служебные слова английского запроса: в заголовке их может и не быть. */
const EN_STOP = new Set(["a", "an", "the", "in", "for", "of", "on", "to", "and", "with"]);

const meaningful = (query: string) =>
  query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !EN_STOP.has(w));

/** Адрес английской версии: «restaurant-website-tashkent». */
export function englishSlug(query: string): string {
  return slugify(meaningful(query).join(" "));
}

/**
 * Цена — из той же услуги, что и в русской версии, по-английски.
 *
 * Числа те же самые: проверка пропускает в английском тексте только
 * числа русской статьи и прайса студии.
 */
export function englishPrice(niche: string): string {
  if (isTender(niche)) {
    const tender = services.find((s) => s.slug === TENDER_SERVICE);
    if (!tender) return "";
    const { priceFromUsd: p, weeksFrom: a, weeksTo: b } = tender;
    return `Technical specification: from $${p}, ${a}-${b} weeks; the price depends on the system's complexity, architecture, stack and integrations. Subcontracted development: priced by contract scope, estimated before the bid is filed.`;
  }
  const slug = serviceFor(niche);
  const service = services.find((s) => s.slug === slug) ?? services[0];
  return `from $${service.priceFromUsd}, ${service.weeksFrom}-${service.weeksTo} weeks`;
}

const CYRILLIC = /[Ѐ-ӿ]/;

const textOf = (a: RazborArticle) =>
  [a.title, a.description, a.label, ...a.intro, ...a.findings.flatMap((f) => [f.title, f.impact, f.fix]), ...a.outcome].join(
    "\n",
  );

/**
 * Проверка английской версии машиной.
 *
 * Русская версия уже прошла проверку кодом и человеком, поэтому мерило —
 * она сама: тех же находок столько же и в том же порядке (к каждой
 * подставляется снимок по коду), чисел — только тех, что есть в русской
 * статье и в прайсе, процентов — только если они были в русской. Плюс
 * правило всех статей сайта: запрос стоит в заголовке, описании и первом
 * абзаце.
 */
export function englishProblems(en: RazborArticle, ru: RazborArticle): ArticleProblem[] {
  const out: ArticleProblem[] = [];
  const text = textOf(en);

  if (!en.title.trim() || !en.description.trim() || !en.label.trim() || !en.intro.length || !en.outcome.length) {
    out.push({ code: "empty", text: "Пустое поле: заголовок, описание, подпись, вступление или итог." });
  }
  if (en.findings.some((f) => !f.title.trim() || !f.impact.trim() || !f.fix.trim())) {
    out.push({ code: "empty", text: "У находки пустой заголовок, следствие или решение." });
  }

  if (en.findings.length !== ru.findings.length) {
    out.push({
      code: "findings",
      text: `Находок ${en.findings.length}, а в русской версии ${ru.findings.length}: перенеси все, по одной, в том же порядке.`,
    });
  } else {
    const moved = ru.findings.filter((f, i) => (f.code ?? "") !== (en.findings[i].code ?? ""));
    if (moved.length) {
      out.push({ code: "codes", text: "Коды находок не совпадают с русской версией: перенеси код каждой находки как есть." });
    }
  }

  if (CYRILLIC.test(`${text}\n${en.price}`)) {
    out.push({ code: "cyrillic", text: "В английском тексте осталась кириллица." });
  }

  const invented = unsupportedNumbers(text, textOf(ru), `${pricePool()} ${numbersIn(ru.price).join(" ")}`);
  if (invented.length) {
    out.push({ code: "invented", text: `Числа, которых нет в русской версии: ${invented.join(", ")}.` });
  }

  const percent = /\d+\s*%/;
  if (percent.test(text) && !percent.test(textOf(ru))) {
    out.push({ code: "percent", text: "В тексте есть процент, которого не было в русской версии." });
  }

  const core = meaningful(en.query).join(" ");
  for (const [where, value] of [
    ["заголовке", en.title],
    ["описании", en.description],
    ["первом абзаце", en.intro[0] ?? ""],
  ] as const) {
    const missing = missingStems(core, value);
    if (missing.length) {
      out.push({ code: "query", text: `Запроса «${en.query}» нет в ${where}: не хватает слов на «${missing.join("», «")}».` });
    }
  }

  return out;
}

/** Строка базы → статья: то же, что читает страница, без лишних полей. */
export function articleOf(value: unknown): RazborArticle | null {
  if (!value || typeof value !== "object") return null;
  const a = value as Record<string, unknown>;
  const list = (v: unknown) => (Array.isArray(v) ? v.map(String).filter(Boolean) : []);
  const findings = Array.isArray(a.findings)
    ? a.findings.map((f) => {
        const x = (f ?? {}) as Record<string, unknown>;
        return {
          ...(x.code ? { code: String(x.code) } : {}),
          title: String(x.title ?? ""),
          impact: String(x.impact ?? ""),
          fix: String(x.fix ?? ""),
        };
      })
    : [];
  const article: RazborArticle = {
    title: String(a.title ?? ""),
    description: String(a.description ?? ""),
    label: String(a.label ?? ""),
    query: String(a.query ?? ""),
    intro: list(a.intro),
    findings,
    outcome: list(a.outcome),
    price: String(a.price ?? ""),
  };
  return article.title && article.findings.length ? article : null;
}
