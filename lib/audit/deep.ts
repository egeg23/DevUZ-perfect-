import type { Finding } from "@/lib/audit/checks";
import { whatWeSee, visibleText, type Seen } from "@/lib/audit/visible";

/**
 * Разбор нескольких страниц вместо одной главной.
 *
 * Владелец: «чтобы сообщение на первое касание показывало, что мы углубились
 * в изучение сайта… прям как у топовых студий, которые работают с большим
 * штатом».
 *
 * Разница между разбором за секунду и разбором, который выглядит как работа
 * человека, — не в длине письма. Она в том, что можно утверждать. С одной
 * главной честно звучит только «на главной не нашли цен»; адресат пожимает
 * плечами — цены у него на отдельной странице. С шести страниц звучит «цен
 * нет ни на одной из шести, включая «Услуги» и «Прайс»», и возразить на это
 * нечего: он сам знает, что их там нет.
 *
 * Поэтому здесь нет ни одной новой проверки разметки. Есть проверки, которые
 * на одной странице невозможны в принципе: одинаковый заголовок на всём
 * сайте, пустые страницы, дата последнего обновления карты сайта, вес
 * главной. Это те находки, которые в отчётах агентств стоят первыми, и
 * получить их можно только обойдя сайт.
 *
 * Чек-листы, по которым набран список: `.claude/skills/seo-audit` (техника,
 * MIT, AgriciDaniel) и `.claude/skills/marketing-cro` (конверсия, MIT, Corey
 * Haines). Оттуда взята рамка — что вообще смотрят, — а пороги и формулировки
 * наши: чужие пороги на узбекский рынок не переносятся, а чужие формулировки
 * написаны для отчёта, который читает маркетолог, а не владелец мебельного
 * цеха.
 *
 * Стоит это тридцать-шестьдесят секунд. Владелец на это согласился прямо:
 * «не обязательно чтобы аудит был моментальным».
 */

/** Что удалось снять с одной страницы. */
export type PageSnap = {
  url: string;
  /** Путь без домена — им и называем страницу в письме. */
  path: string;
  status: number;
  title: string | null;
  description: string | null;
  h1: string | null;
  words: number;
  hasPrice: boolean;
  hasTel: boolean;
  hasForm: boolean;
  seen: Seen;
};

export type DeepFacts = {
  /** Главная идёт первой. */
  pages: PageSnap[];
  /** Сколько адресов в карте сайта; null — карты нет или не разобрали. */
  sitemapUrls: number | null;
  /** Самая свежая дата в карте сайта, YYYY-MM-DD. */
  sitemapFresh: string | null;
  /** Вес главной вместе с картинками и стилями, байты. */
  homeBytes: number | null;
  /** Из них картинки. */
  imageBytes: number | null;
  /** Чем компания доказывает, что ей можно верить. */
  trust: { reviews: boolean; cases: boolean; guarantee: boolean };
};

const PRICE =
  /\d[\d\s .,]*\s*(сум|so['‘ʻ]?m|сўм|UZS|у\.\s?е\.)|\$\s?\d|\d[\d\s .,]*\s*(долл|USD)/i;

function textBetween(html: string, tag: string): string | null {
  const m = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  if (!m) return null;
  const text = m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text || null;
}

function metaContent(html: string, name: string): string | null {
  const m = html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*>`, "i"));
  const c = m?.[0].match(/content=["']([^"']*)["']/i);
  return c?.[1].trim() || null;
}

/** Разбор одной загруженной страницы. Чистая функция — проверяется тестом. */
export function snap(url: string, status: number, html: string): PageSnap {
  const text = visibleText(html);
  let path = "/";
  try {
    path = new URL(url).pathname || "/";
  } catch {
    /* адрес уже проверен загрузчиком; здесь он только для показа */
  }
  return {
    url,
    path,
    status,
    title: textBetween(html, "title"),
    description: metaContent(html, "description"),
    h1: textBetween(html, "h1"),
    words: text.split(/\s+/).filter(Boolean).length,
    hasPrice: PRICE.test(text),
    hasTel: /href=["']tel:/i.test(html),
    hasForm: /<form\b/i.test(html),
    seen: whatWeSee(html),
  };
}

/**
 * Какие страницы смотреть после главной.
 *
 * Порядок не случайный: сначала то, где живут деньги. Страница цен и страница
 * услуг решают, обратится человек или нет; «о компании» и «контакты» нужны
 * для другого — по ним видно, чем компания доказывает, что ей можно верить.
 * Блог и новости не берём вовсе: они длинные, грузятся долго и о продаже не
 * говорят ничего.
 */
const WANTED: [RegExp, string][] = [
  [/price|tarif|тариф|цен|narx|прайс/i, "цены"],
  [/service|uslug|услуг|catalog|katalog|каталог|product|tovar/i, "услуги"],
  [/contact|kontakt|контакт|aloqa/i, "контакты"],
  [/about|o-nas|о-нас|kompani|компани|haqida/i, "о компании"],
  [/portfolio|case|кейс|работы|ishlar/i, "работы"],
];

const SKIP = /blog|news|novost|yangilik|article|stat|policy|politika|oferta|privacy|cart|korzina|login|search/i;

export function pagesToVisit(links: readonly string[], limit = 5): string[] {
  const picked: string[] = [];
  for (const [re] of WANTED) {
    const hit = links.find((u) => re.test(u) && !SKIP.test(u) && !picked.includes(u));
    if (hit) picked.push(hit);
    if (picked.length >= limit) break;
  }
  // Места остались — добираем чем есть, кроме заведомо бесполезного.
  for (const url of links) {
    if (picked.length >= limit) break;
    if (!SKIP.test(url) && !picked.includes(url)) picked.push(url);
  }
  return picked;
}

/**
 * Чем компания доказывает, что ей можно верить.
 *
 * Ищем по всему обходу, а не по главной: отзывы обычно лежат отдельной
 * страницей, и claim «нет отзывов» по одной главной был бы ложным.
 */
export function trustFrom(pages: readonly { html: string }[]): DeepFacts["trust"] {
  const text = pages.map((p) => visibleText(p.html)).join(" ");
  return {
    reviews: /отзыв|sharh|fikr|review|testimonial/i.test(text),
    cases: /кейс|портфолио|наши работы|выполненн|portfolio|ishlarimiz|loyiha/i.test(text),
    guarantee: /гарант|kafolat|garantiya|warranty/i.test(text),
  };
}

/**
 * «на 6 страницах» и «из 6 страниц» — разные падежи одного слова.
 *
 * Живой прогон выдал «Цен нет ни на одной из 6 страницах». Одна такая
 * строка в письме стоит дороже, чем кажется: адресат читает её как машинную
 * и дальше уже не верит, что сайт кто-то смотрел.
 */
function pagesWord(n: number): string {
  const tens = n % 100;
  const ones = n % 10;
  if (tens >= 11 && tens <= 14) return "страницах";
  return ones === 1 ? "странице" : "страницах";
}

/** Родительный: «из 6 страниц», «из 21 страницы». */
function pagesOf(n: number): string {
  const tens = n % 100;
  const ones = n % 10;
  return tens !== 11 && ones === 1 ? "страницы" : "страниц";
}

const mb = (bytes: number) => (bytes / 1024 / 1024).toFixed(1).replace(".", ",");

/**
 * Находки, которые видно только с нескольких страниц.
 *
 * Каждая называет число и страницы поимённо. Это и есть разница между
 * «у вас проблемы с SEO» и разбором: первое адресат читает как шаблон,
 * второе — как то, что кто-то действительно открыл его сайт.
 */
export function deepFindings(facts: DeepFacts): Finding[] {
  const out: Finding[] = [];
  const pages = facts.pages.filter((p) => p.status < 400);
  // Меньше трёх страниц — это не обход, а та же главная. Утверждать «ни на
  // одной странице» по двум значило бы завышать цену собственной работы.
  if (pages.length < 3) return out;

  const named = (list: PageSnap[]) => list.slice(0, 3).map((p) => (p.path === "/" ? "главная" : p.path)).join(", ");

  /* ── Цены: сильнее всего именно на обходе ─────────────────────────────── */
  const withPrice = pages.filter((p) => p.hasPrice);
  if (!withPrice.length) {
    out.push({
      code: "no_price_anywhere",
      severity: "major",
      title: `Цен нет ни на одной из ${pages.length} ${pagesOf(pages.length)}`,
      impact: `Мы прошли по сайту как посетитель — ${named(pages)} и остальные — и нигде не нашли, сколько это стоит. «Сколько стоит» — первый вопрос почти каждого, и тот, кто на него не отвечает, соревнуется уже не качеством, а тем, у кого хватило терпения написать и спросить. Терпения хватает у меньшинства: остальные уходят туда, где цена названа, и вы об этих людях никогда не узнаете.`,
      fix: "Ставим вилку «от и до» по основным услугам и объясняем, от чего зависит итог. День-два вместе с текстами.",
    });
  }

  /* ── Заголовок страницы: то, что видно в выдаче ───────────────────────── */
  const titles = pages.map((p) => (p.title ?? "").trim()).filter(Boolean);
  const sameTitle = titles.length >= 3 && new Set(titles).size === 1;
  if (sameTitle) {
    out.push({
      code: "same_title",
      severity: "major",
      title: `Все ${pages.length} просмотренных ${pagesOf(pages.length)} представлены в Google одной и той же строкой`,
      impact: `У страниц один заголовок на всех: «${titles[0].slice(0, 70)}». В выдаче они выглядят одинаково, и человек, ищущий конкретную услугу, не понимает, куда ведёт ссылка. Google тоже не понимает, какую из них показывать, и часто не показывает ни одну.`,
      fix: "Пишем заголовок под каждую страницу: что на ней, для кого и в каком городе. Несколько часов на весь сайт.",
    });
  }

  const noDescription = pages.filter((p) => !p.description);
  if (!sameTitle && noDescription.length >= 3) {
    out.push({
      code: "no_description_pages",
      severity: "minor",
      title: `На ${noDescription.length} ${pagesWord(noDescription.length)} нет описания для поисковика`,
      impact: `Под ссылкой в Google показывается случайный кусок текста вместо короткого объяснения, чем вы занимаетесь. Проверили ${named(noDescription)} и другие — описания нет ни у одной. Эти две строки человек читает до того, как решит нажать.`,
      fix: "Пишем описания по два предложения на страницу, по-человечески. Час-два.",
    });
  }

  /* ── Пустые страницы ──────────────────────────────────────────────────── */
  const thin = pages.filter((p) => !p.seen.clientRendered && p.words < 120);
  if (thin.length >= 2) {
    out.push({
      code: "thin_pages",
      severity: "major",
      title: `${thin.length} ${pagesWord(thin.length)} почти без текста`,
      impact: `На ${named(thin)} меньше сотни слов. Поисковику нечего показать по запросам этой услуги, а посетителю нечего прочитать: он пришёл узнать, что вы делаете и чем отличаетесь, и не нашёл ответа. Такие страницы Google обычно вовсе не держит в индексе.`,
      fix: "Дописываем каждую до полноценной страницы услуги: что входит, как проходит, сколько стоит, кому подойдёт. День на страницу.",
    });
  }

  /* ── Чем доказываете, что вам можно верить ────────────────────────────── */
  const { reviews, cases, guarantee } = facts.trust;
  if (!reviews && !cases && !guarantee) {
    out.push({
      code: "no_trust",
      severity: "major",
      title: "На сайте нечем подтвердить, что вам можно доверить деньги",
      impact:
        "Мы искали по всему сайту отзывы, примеры работ и хоть какие-то гарантии — не нашли ничего. Человек, который выбирает подрядчика впервые, ищет ровно это: кто-то уже платил им и остался доволен. Без этого решают по цене, а по цене всегда находится кто-то дешевле.",
      fix: "Собираем отзывы с фотографиями и именами, выкладываем пять-семь работ «было / стало» и формулируем гарантию словами. Несколько дней вместе со сбором материала.",
    });
  }

  /* ── Куда нажимать ────────────────────────────────────────────────────── */
  const noAction = pages.filter((p) => !p.hasTel && !p.hasForm && !p.seen.clientRendered);
  if (noAction.length >= 3) {
    out.push({
      code: "dead_end_pages",
      severity: "major",
      title: `На ${noAction.length} ${pagesWord(noAction.length)} нечего нажать`,
      impact: `${named(noAction)} и другие заканчиваются ничем: ни формы, ни нажимаемого телефона. Человек дочитал, решил обратиться — и должен сам пойти искать, куда. Часть на этом шаге и отваливается, причём это самая тёплая часть: те, кто уже дочитал.`,
      fix: "Ставим в конце каждой страницы одно понятное действие — форму или звонок в одно касание. День на весь сайт.",
    });
  }

  /* ── Карта сайта: возраст виден только из неё ─────────────────────────── */
  if (facts.sitemapFresh) {
    const days = Math.round((Date.now() - Date.parse(facts.sitemapFresh)) / 86_400_000);
    if (days > 180) {
      out.push({
        code: "stale_sitemap",
        severity: "minor",
        title: `Сайт не обновлялся ${Math.round(days / 30)} мес. — по карте сайта`,
        impact: `Самая свежая дата в вашей карте сайта — ${facts.sitemapFresh}. Google смотрит на неё, решая, как часто заходить: на сайт, который не меняется, робот приходит всё реже, и новая страница ждёт своей очереди неделями. Живому бизнесу это стоит позиций на ровном месте.`,
        fix: "Настраиваем карту так, чтобы она обновлялась сама, и добавляем повод обновляться — раздел работ или ответов на вопросы. Несколько часов.",
      });
    }
  }

  /* ── Вес ──────────────────────────────────────────────────────────────── */
  if (facts.homeBytes && facts.homeBytes > 3 * 1024 * 1024) {
    const share = facts.imageBytes ? ` из них ${mb(facts.imageBytes)} МБ — картинки` : "";
    out.push({
      code: "heavy_home",
      severity: "major",
      title: `Главная весит ${mb(facts.homeBytes)} МБ`,
      impact: `Посчитали всё, что тянет страница${share}. На мобильном интернете это секунды белого экрана, а платит за них посетитель — своим трафиком и своим терпением. Google замеряет то же самое и учитывает, решая, кого показать выше.`,
      fix: "Пережимаем картинки в современный формат и грузим их по мере прокрутки. Обычно вес падает в несколько раз за день работы.",
    });
  }

  return out;
}
