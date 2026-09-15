/**
 * Опубликованные разборы.
 *
 * Лежат в репозитории, а не в базе, и это осознанно. Страница разбора —
 * то, ради чего человек приходит из поиска: она должна открываться быстро,
 * кэшироваться целиком и работать, даже когда база недоступна. Плюс её
 * видно в диффе: ночная задача открывает PR, и владелец глазами смотрит,
 * что именно выйдет под именем студии.
 *
 * В базе (таблица razbors) остаётся служебное: какие сайты уже смотрели и
 * какой вердикт вынесли. Это данные работы, а не содержание, и в git им
 * делать нечего — отклонённых сайтов будет в разы больше опубликованных.
 *
 * Имени разобранной компании здесь нет нигде. Ни ссылки, ни домена.
 */
import type { RazborLocale } from "@/lib/razbor/model";

export type RazborFinding = {
  /** Заголовок следствием, а не причиной: не «нет meta viewport», а
   *  «на телефоне сайт открывается в масштабе большого экрана». */
  title: string;
  /** Чем оборачивается для клиентов и денег. */
  impact: string;
  /** Что делаем и сколько это обычно занимает. */
  fix: string;
};

export type RazborShots = {
  beforeDesktop: string;
  beforeMobile: string;
  afterDesktop: string;
  afterMobile: string;
};

export type RazborItem = {
  slug: string;
  locale: RazborLocale;
  /** Тот же разбор на другом языке — для hreflang. Пусто, если пары нет. */
  alt: { locale: RazborLocale; slug: string } | null;

  /** Ключи из content/razbor/catalog.ts. */
  niche: string;
  city: string;

  /** Дата публикации и дата снимка — разные. Сайт могли починить. */
  publishedAt: string;
  shotTakenAt: string;

  title: string;
  description: string;
  /** Анонимная подпись: «интернет-магазин в Ташкенте на WordPress». */
  label: string;
  /** Главный запрос страницы. Один. */
  query: string;

  shots: RazborShots;

  /** Преамбула: какой бизнес, какая задача, почему смотрим это. */
  intro: readonly string[];
  findings: readonly RazborFinding[];
  /** Что даёт переделка — в клиентах, не в пикселях. */
  outcome: readonly string[];
  /** Честный диапазон цены и срока. */
  price: string;
};

/**
 * Пока пусто: первый разбор кладёт сюда ночная задача.
 *
 * Пустой раздел показывает честную заглушку, а не выдуманный пример.
 * Поддельный разбор на витрине студии, которая разбирает чужие сайты, —
 * ровно та ошибка, за которую мы в этих разборах и ругаем.
 */
export const razbors: readonly RazborItem[] = [];

export function razborsFor(locale: RazborLocale): RazborItem[] {
  return razbors
    .filter((item) => item.locale === locale)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function razborBySlug(locale: RazborLocale, slug: string): RazborItem | null {
  return razbors.find((item) => item.locale === locale && item.slug === slug) ?? null;
}

/** Соседние разборы той же ниши — для перелинковки внизу страницы. */
export function siblings(item: RazborItem, limit = 3): RazborItem[] {
  return razborsFor(item.locale)
    .filter((other) => other.slug !== item.slug && other.niche === item.niche)
    .slice(0, limit);
}
