/**
 * Наши ссылки в сообщении клиенту — проверка до отправки.
 *
 * Владелец, 25.10.2026, на cases.devuz.studio/enotmebel: «А почему 404?»
 * Руководитель набрал ссылки руками в ответе из карточки лида: Comfort Mebel
 * правда живёт на витрине (cases.devuz.studio/comfort), а Enotmebel там нет —
 * это прототип, и его кейс — devuz.studio/ru/cases/enotmebel. YANGI KUN mebel
 * получил пустую страницу. Витрина — отдельный сайт (egeg23/Global-Export):
 * всё, чего на ней нет, она отдаёт 404.
 *
 * Сверка — по тем же спискам, что у «Макетов» и страницы кейса, без запроса
 * в сеть: адрес витрины начинается с проекта витрины (url в content/cases.ts)
 * или с языка её главной; адрес кейса — slug из content/cases.ts. Прототипы
 * (devuz.studio/proto/…) копируют из «Макетов» целиком, их здесь не трогаем.
 */
import { cases, type Case } from "@/content/cases";
import { SHOWCASE_HOST, showcaseCases } from "@/lib/admin/mockups";

export type BadLink = {
  /** Как ссылка написана в сообщении: «cases.devuz.studio/enotmebel». */
  link: string;
  /** Куда она должна была вести, если проект узнаётся по адресу; иначе null. */
  fix: string | null;
};

/** Главная витрины на языке: «/ru», «/uz», «/en» — и всё, что за ними, её. */
const SHOWCASE_HOME = new Set(["ru", "uz", "en"]);

/** Первая часть пути каждого проекта витрины: «comfort», «engelberg», «motion.html». */
function showcaseRoots(): Set<string> {
  return new Set(showcaseCases().map((c) => c.url!.slice(SHOWCASE_HOST.length).split("/")[0].toLowerCase()));
}

const bare = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Проект по набранному слову: slug целиком, без дефисов или его начало
 * («comfort» — comfort-mebel, «enot» — enotmebel), если такой проект один.
 */
function caseByWord(word: string): Case | null {
  const w = bare(word);
  if (w.length < 3) return null;
  const exact = cases.find((c) => bare(c.slug) === w);
  if (exact) return exact;
  const starts = cases.filter((c) => bare(c.slug).startsWith(w));
  return w.length >= 4 && starts.length === 1 ? starts[0] : null;
}

/** Верный адрес проекта: на витрине — её адрес, остальным — страница кейса. */
function addressOf(item: Case): string {
  return item.url?.startsWith(SHOWCASE_HOST)
    ? item.url.replace(/^https:\/\//, "")
    : `devuz.studio/ru/cases/${item.slug}`;
}

/** Хвост, который пишут сразу за ссылкой: точка, запятая, скобка, слэш. */
const tidy = (path: string) => path.replace(/[/.,;:!?)»"'-]+$/, "");

export function badOurLinks(text: string): BadLink[] {
  const out: BadLink[] = [];
  const seen = new Set<string>();
  const add = (link: string, item: Case | null) => {
    if (seen.has(link)) return;
    seen.add(link);
    out.push({ link, fix: item ? addressOf(item) : null });
  };

  const roots = showcaseRoots();
  for (const m of text.matchAll(/(?<![A-Za-z0-9-])(?:www\.)?cases\.devuz\.studio\/([A-Za-z0-9._\/-]*)/gi)) {
    const path = tidy(m[1]);
    const first = path.split("/")[0].toLowerCase();
    if (!first || SHOWCASE_HOME.has(first) || roots.has(first)) continue;
    add(`cases.devuz.studio/${path}`, caseByWord(first));
  }

  const slugs = new Set(cases.map((c) => c.slug));
  for (const m of text.matchAll(/(?<![A-Za-z0-9.-])(?:www\.)?devuz\.studio\/(?:([a-z]{2})\/)?cases\/([A-Za-z0-9-]+)/gi)) {
    const slug = tidy(m[2]);
    if (!slug || slugs.has(slug.toLowerCase())) continue;
    add(`devuz.studio/${m[1] ? `${m[1]}/` : ""}cases/${slug}`, caseByWord(slug));
  }
  return out;
}
