import { services } from "@/content/services";
import { CITIES, type City } from "@/content/razbor/catalog";
import { missingStems } from "@/lib/marketing/article-check";
import { slugify, type ForeignLocale } from "@/lib/razbor/model";
import { serviceFor } from "@/lib/razbor/service-link";
import { numbersIn, pricePool, unsupportedNumbers, type ArticleProblem } from "@/lib/razbor/shift";
import { TENDER_SERVICE, isTender } from "@/lib/razbor/tender";
import type { RazborArticle } from "@/lib/razbor/store";

/**
 * Английская и польская версии разбора — то, что считается без базы и без
 * модели.
 *
 * Владелец, 10.10.2026: «На английском давай тоже делать, там 404» и «А в
 * польской версии статей вообще, русские показываются». Ночная смена пишет
 * разбор по-русски и по-узбекски, человек его проверяет и публикует.
 * Английскую и польскую версии сервер делает сам — из опубликованной
 * русской, уже проверенной человеком: те же находки, те же числа, тот же
 * снимок к каждой находке (lib/razbor/foreign-run.ts).
 *
 * Это не перевод слово в слово. Читатель другой — компания, которая ищет
 * подрядчика в Узбекистане на своём языке, — и запрос у него свой:
 * «restaurant website in Tashkent», «strona internetowa dla restauracji w
 * Taszkencie», а не переведённое «сайт для ресторана в Ташкенте». Запрос
 * сверяется с Google Trends и Вордстатом, как у любой статьи сайта.
 */

export const FOREIGN_LOCALES: readonly ForeignLocale[] = ["en", "pl"];

/**
 * Род занятий на языке версии — для ниш каталога.
 *
 * Словарь, а не модель: ниши каталога повторяются от разбора к разбору, и
 * запрос у всех разборов одной ниши должен звучать одинаково. Ниши вне
 * каталога (их смена называет сама) и тендерные разборы называет дешёвая
 * модель, один раз на разбор.
 *
 * По-польски — родительный падеж: он встаёт в «strona internetowa dla …».
 */
export const NICHE_NAMES: Readonly<Record<ForeignLocale, Readonly<Record<string, string>>>> = {
  en: {
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
  },
  pl: {
    stomatologiya: "kliniki stomatologicznej",
    medcentr: "centrum medycznego",
    "internet-magazin": "sklepu internetowego",
    restoran: "restauracji",
    "dostavka-edy": "dostawy jedzenia",
    avtoservis: "warsztatu samochodowego",
    "stroitelnaya-kompaniya": "firmy budowlanej",
    mebel: "sklepu meblowego",
    "uchebnyy-centr": "centrum szkoleniowego",
    turagentstvo: "biura podróży",
    yurfirma: "kancelarii prawnej",
    "salon-krasoty": "salonu kosmetycznego",
    logistika: "firmy logistycznej",
    nedvizhimost: "osiedla mieszkaniowego",
    svyaz: "dostawcy internetu",
    "agentstvo-nedvizhimosti": "agencji nieruchomości",
    fitnes: "klubu fitness",
  },
};

const LETTERS: Record<ForeignLocale, string> = { en: "a-z", pl: "a-ząćęłńóśźż" };

/** Слова, которые запрос добавляет сам: модель их в названии не повторяет. */
// «Internetowy» сам по себе можно: «sklepu internetowego» — интернет-магазин.
const OWN_WORDS: Record<ForeignLocale, RegExp> = { en: /\bwebsite\b/, pl: /(^|\s)stron/ };

/**
 * Ответ модели о названии — без обёртки.
 *
 * Дешёвая модель отвечает не всегда голым словом: «"neurology center".»,
 * «garbarni / zakładu garbarskiego», «hotel (small)». Строгая проверка
 * формы такой ответ выбрасывала целиком, и 10.10.2026 из-за этого не вышли
 * версии всех разборов ниш вне каталога. Берём первую строку и первый
 * вариант, без кавычек, скобок и точки в конце, — а форму проверяем как
 * прежде.
 */
export function cleanName(raw: string): string {
  return (raw.split("\n")[0] ?? "")
    .split(/[/;|(]| или | or | lub /)[0]
    .replace(/["'`«»“”„]/g, "")
    .replace(/[.,:!?]+\s*$/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/** Род занятий от модели: буквы языка, без имени компании, города и «сайта». */
export function validSubject(locale: ForeignLocale, raw: string): string | null {
  const subject = cleanName(raw);
  const shape = new RegExp(`^[${LETTERS[locale]}][${LETTERS[locale]} -]{2,50}$`);
  // Город запрос ставит сам; в названии рода занятий он — признак того, что
  // модель назвала компанию, а не категорию.
  const words = subject.split(/[ -]/);
  const city = CITIES.some((c) =>
    [c.en, c.pl].some((name) => words.some((w) => w.startsWith(name.toLowerCase().slice(0, 5)))),
  );
  return shape.test(subject) && !OWN_WORDS[locale].test(subject) && !city ? subject : null;
}

/** Запрос тендерного разбора от модели: буквы языка и цифры, до десяти слов. */
export function validTenderQuery(locale: ForeignLocale, raw: string): string | null {
  const query = cleanName(raw);
  const shape = new RegExp(`^[${LETTERS[locale]}][${LETTERS[locale]}0-9 -]{8,90}$`);
  return shape.test(query) && query.split(" ").length <= 10 ? query : null;
}

export const cityByKey = (key: string): City | null => CITIES.find((c) => c.key === key) ?? null;

/**
 * Запрос версии разбора сайта: так ищут на этом языке.
 *
 * По-английски — род занятий, «website», город: «restaurant website in
 * Tashkent». По-польски — «strona internetowa dla restauracji w
 * Taszkencie». Дословный перевод русского запроса набирают редко.
 */
export function foreignQuery(locale: ForeignLocale, subject: string, city: City): string {
  return locale === "en" ? `${subject} website in ${city.en}` : `strona internetowa dla ${subject} w ${city.plIn}`;
}

/** Служебные слова запроса: в заголовке их может и не быть. */
const STOP: Record<ForeignLocale, ReadonlySet<string>> = {
  en: new Set(["a", "an", "the", "in", "for", "of", "on", "to", "and", "with"]),
  pl: new Set(["dla", "w", "we", "i", "na", "z", "ze", "do", "o", "od", "po", "za", "a"]),
};

const meaningful = (locale: ForeignLocale, query: string) =>
  query
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w && !STOP[locale].has(w));

/**
 * Адрес версии: «restaurant-website-tashkent»,
 * «strona-internetowa-restauracji-taszkencie». Польские буквы — латиницей
 * без знаков: «ż» в адресе превращается в «%C5%BC», и адрес перестаёт
 * выглядеть адресом.
 */
export function foreignSlug(locale: ForeignLocale, query: string): string {
  const plain = meaningful(locale, query)
    .join(" ")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l");
  return slugify(plain);
}

/** «tydzień», «tygodnie», «tygodni» — по последнему числу промежутка. */
export function plWeeks(n: number): string {
  if (n === 1) return "tydzień";
  const last = n % 10;
  const tens = n % 100;
  return last >= 2 && last <= 4 && (tens < 12 || tens > 14) ? "tygodnie" : "tygodni";
}

/**
 * Цена — из той же услуги, что и в русской версии, на языке версии.
 *
 * Числа те же самые: проверка пропускает в тексте версии только числа
 * русской статьи и прайса студии.
 */
export function foreignPrice(locale: ForeignLocale, niche: string): string {
  if (isTender(niche)) {
    const tender = services.find((s) => s.slug === TENDER_SERVICE);
    if (!tender) return "";
    const { priceFromUsd: p, weeksFrom: a, weeksTo: b } = tender;
    return locale === "en"
      ? `Technical specification: from $${p}, ${a}-${b} weeks; the price depends on the system's complexity, architecture, stack and integrations. Subcontracted development: priced by contract scope, estimated before the bid is filed.`
      : `Specyfikacja techniczna: od $${p}, ${a}-${b} ${plWeeks(b)}; cena zależy od złożoności systemu, architektury, stosu technologicznego i integracji. Realizacja w podwykonawstwie: wycena według zakresu kontraktu, przed złożeniem oferty.`;
  }
  const slug = serviceFor(niche);
  const service = services.find((s) => s.slug === slug) ?? services[0];
  const { priceFromUsd: p, weeksFrom: a, weeksTo: b } = service;
  return locale === "en" ? `from $${p}, ${a}-${b} weeks` : `od $${p}, ${a}-${b} ${plWeeks(b)}`;
}

const CYRILLIC = /[Ѐ-ӿ]/;

/**
 * Числа, которые русская статья пишет словами: «шесть страниц», «четыре
 * шрифта». По-английски их пишут цифрами — «6 pages», — и без этого списка
 * проверка считала такую цифру выдуманной: так 10.10.2026 не вышла
 * английская версия разбора гостиницы.
 */
const RU_NUMBER_WORDS: ReadonlyArray<readonly [number, readonly string[]]> = [
  [1, ["один", "одна", "одно", "одного", "одной", "одну", "одним", "одном"]],
  [2, ["два", "две", "двух", "двум", "двумя"]],
  [3, ["три", "трёх", "трех", "трём", "трем", "тремя"]],
  [4, ["четыре", "четырёх", "четырех", "четырём", "четырем", "четырьмя"]],
  [5, ["пять", "пяти", "пятью"]],
  [6, ["шесть", "шести", "шестью"]],
  [7, ["семь", "семи", "семью"]],
  [8, ["восемь", "восьми", "восемью"]],
  [9, ["девять", "девяти", "девятью"]],
  [10, ["десять", "десяти", "десятью"]],
  [11, ["одиннадцать", "одиннадцати"]],
  [12, ["двенадцать", "двенадцати"]],
];

/** «шесть страниц, четыре шрифта» → «6 4». */
export function ruNumberWords(text: string): string {
  const words = new Set(text.toLowerCase().split(/[^\p{L}]+/u));
  return RU_NUMBER_WORDS.filter(([, forms]) => forms.some((f) => words.has(f)))
    .map(([n]) => String(n))
    .join(" ");
}

const textOf = (a: RazborArticle) =>
  [a.title, a.description, a.label, ...a.intro, ...a.findings.flatMap((f) => [f.title, f.impact, f.fix]), ...a.outcome].join(
    "\n",
  );

/**
 * Проверка версии машиной.
 *
 * Русская версия уже прошла проверку кодом и человеком, поэтому мерило —
 * она сама: тех же находок столько же и в том же порядке (к каждой
 * подставляется снимок по коду), чисел — только тех, что есть в русской
 * статье и в прайсе, процентов — только если они были в русской. Плюс
 * правило всех статей сайта: запрос стоит в заголовке, описании и первом
 * абзаце.
 */
export function foreignProblems(locale: ForeignLocale, version: RazborArticle, ru: RazborArticle): ArticleProblem[] {
  const out: ArticleProblem[] = [];
  const text = textOf(version);

  if (
    !version.title.trim() ||
    !version.description.trim() ||
    !version.label.trim() ||
    !version.intro.length ||
    !version.outcome.length
  ) {
    out.push({ code: "empty", text: "Пустое поле: заголовок, описание, подпись, вступление или итог." });
  }
  if (version.findings.some((f) => !f.title.trim() || !f.impact.trim() || !f.fix.trim())) {
    out.push({ code: "empty", text: "У находки пустой заголовок, следствие или решение." });
  }

  if (version.findings.length !== ru.findings.length) {
    out.push({
      code: "findings",
      text: `Находок ${version.findings.length}, а в русской версии ${ru.findings.length}: перенеси все, по одной, в том же порядке.`,
    });
  } else if (ru.findings.some((f, i) => (f.code ?? "") !== (version.findings[i].code ?? ""))) {
    out.push({ code: "codes", text: "Коды находок не совпадают с русской версией: перенеси код каждой находки как есть." });
  }

  if (CYRILLIC.test(`${text}\n${version.price}`)) {
    out.push({ code: "cyrillic", text: "В тексте осталась кириллица." });
  }

  const source = textOf(ru);
  const invented = unsupportedNumbers(text, `${source} ${ruNumberWords(source)}`, `${pricePool()} ${numbersIn(ru.price).join(" ")}`);
  if (invented.length) {
    out.push({ code: "invented", text: `Числа, которых нет в русской версии: ${invented.join(", ")}.` });
  }

  // Польский без «ą, ę, ł, ś, ż» читается как текст, набранный с телефона
  // без раскладки, — так 10.10.2026 вышли первые две польские версии. В
  // обычном польском тексте такая буква — примерно каждая тридцатая.
  if (locale === "pl") {
    const letters = text.match(/\p{L}/gu)?.length ?? 0;
    const marks = text.match(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g)?.length ?? 0;
    if (letters > 300 && marks * 80 < letters) {
      out.push({ code: "diacritics", text: "Польский текст без диакритики: пиши ą, ć, ę, ł, ń, ó, ś, ź, ż там, где они нужны." });
    }
  }

  const percent = /\d+\s*%/;
  if (percent.test(text) && !percent.test(source)) {
    out.push({ code: "percent", text: "В тексте есть процент, которого не было в русской версии." });
  }

  const core = meaningful(locale, version.query).join(" ");
  for (const [where, value] of [
    ["заголовке", version.title],
    ["описании", version.description],
    ["первом абзаце", version.intro[0] ?? ""],
  ] as const) {
    const missing = missingStems(core, value);
    if (missing.length) {
      out.push({ code: "query", text: `Запроса «${version.query}» нет в ${where}: не хватает слов на «${missing.join("», «")}».` });
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
