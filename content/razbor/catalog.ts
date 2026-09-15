/**
 * Ниши и города, по которым идут разборы.
 *
 * Список не про то, «какие бывают сайты», а про то, где сходятся три вещи:
 * плохих сайтов много, деньги на переделку есть, и по запросу почти никто
 * не пишет. По «заказать сайт Ташкент» мы агентствам с десятилетним доменом
 * не конкуренты; по «сайт для автосервиса в Ташкенте» — конкуренты, потому
 * что таких страниц нет вовсе.
 *
 * Формы слов лежат здесь готовыми, а не собираются правилами. Русский
 * предложный и узбекский местный падеж исключений имеют больше, чем правил,
 * и ошибка в заголовке страницы стоит дороже, чем десять строк словаря.
 */

export type Country = "UZ" | "KZ" | "KG";

export type City = {
  key: string;
  country: Country;
  /** Именительный: «Ташкент». */
  ru: string;
  /** Предложный, для «в …»: «Ташкенте». */
  ruIn: string;
  uz: string;
  /** Местный, для «где»: «Toshkentda». */
  uzIn: string;
};

export type Niche = {
  key: string;
  /** Родительный, для «сайт для …»: «стоматологии». */
  ruGen: string;
  /** Как называем сам бизнес в подписи: «стоматологическая клиника». */
  ruLabel: string;
  /** Узбекский корень для запроса: «stomatologiya». */
  uz: string;
  uzLabel: string;
};

/**
 * Города. Узбекистан первым и шире остальных: это домашний рынок, и
 * разборов по нему должно быть больше, чем по соседним.
 */
export const CITIES: readonly City[] = [
  { key: "tashkent", country: "UZ", ru: "Ташкент", ruIn: "Ташкенте", uz: "Toshkent", uzIn: "Toshkentda" },
  { key: "samarkand", country: "UZ", ru: "Самарканд", ruIn: "Самарканде", uz: "Samarqand", uzIn: "Samarqandda" },
  { key: "bukhara", country: "UZ", ru: "Бухара", ruIn: "Бухаре", uz: "Buxoro", uzIn: "Buxoroda" },
  { key: "namangan", country: "UZ", ru: "Наманган", ruIn: "Намангане", uz: "Namangan", uzIn: "Namanganda" },
  { key: "andijan", country: "UZ", ru: "Андижан", ruIn: "Андижане", uz: "Andijon", uzIn: "Andijonda" },
  { key: "fergana", country: "UZ", ru: "Фергана", ruIn: "Фергане", uz: "Farg'ona", uzIn: "Farg'onada" },
  { key: "nukus", country: "UZ", ru: "Нукус", ruIn: "Нукусе", uz: "Nukus", uzIn: "Nukusda" },
  { key: "almaty", country: "KZ", ru: "Алматы", ruIn: "Алматы", uz: "Olmaota", uzIn: "Olmaotada" },
  { key: "astana", country: "KZ", ru: "Астана", ruIn: "Астане", uz: "Ostona", uzIn: "Ostonada" },
  { key: "shymkent", country: "KZ", ru: "Шымкент", ruIn: "Шымкенте", uz: "Chimkent", uzIn: "Chimkentda" },
  { key: "bishkek", country: "KG", ru: "Бишкек", ruIn: "Бишкеке", uz: "Bishkek", uzIn: "Bishkekda" },
  { key: "osh", country: "KG", ru: "Ош", ruIn: "Оше", uz: "O'sh", uzIn: "O'shda" },
];

/**
 * Ниши.
 *
 * Отбирались по тому же принципу, что и города: малый и средний бизнес,
 * который живёт с потока клиентов и у которого сайт — не витрина, а вход.
 * Салон красоты и автосервис здесь не для полноты списка, а потому что у
 * них сайт чаще всего либо старый, либо один экран без формы записи.
 */
export const NICHES: readonly Niche[] = [
  { key: "stomatologiya", ruGen: "стоматологии", ruLabel: "стоматологическая клиника", uz: "stomatologiya", uzLabel: "stomatologiya klinikasi" },
  { key: "medcentr", ruGen: "медицинского центра", ruLabel: "медицинский центр", uz: "tibbiyot markazi", uzLabel: "tibbiyot markazi" },
  { key: "internet-magazin", ruGen: "интернет-магазина", ruLabel: "интернет-магазин", uz: "internet do'kon", uzLabel: "internet do'kon" },
  { key: "restoran", ruGen: "ресторана", ruLabel: "ресторан", uz: "restoran", uzLabel: "restoran" },
  { key: "dostavka-edy", ruGen: "доставки еды", ruLabel: "служба доставки еды", uz: "ovqat yetkazib berish", uzLabel: "ovqat yetkazib berish xizmati" },
  { key: "avtoservis", ruGen: "автосервиса", ruLabel: "автосервис", uz: "avtoservis", uzLabel: "avtoservis" },
  { key: "stroitelnaya-kompaniya", ruGen: "строительной компании", ruLabel: "строительная компания", uz: "qurilish kompaniyasi", uzLabel: "qurilish kompaniyasi" },
  { key: "mebel", ruGen: "мебельного салона", ruLabel: "мебельный салон", uz: "mebel saloni", uzLabel: "mebel saloni" },
  { key: "uchebnyy-centr", ruGen: "учебного центра", ruLabel: "учебный центр", uz: "o'quv markazi", uzLabel: "o'quv markazi" },
  { key: "turagentstvo", ruGen: "турагентства", ruLabel: "турагентство", uz: "turizm agentligi", uzLabel: "turizm agentligi" },
  { key: "yurfirma", ruGen: "юридической фирмы", ruLabel: "юридическая фирма", uz: "yuridik firma", uzLabel: "yuridik firma" },
  { key: "salon-krasoty", ruGen: "салона красоты", ruLabel: "салон красоты", uz: "go'zallik saloni", uzLabel: "go'zallik saloni" },
  { key: "logistika", ruGen: "логистической компании", ruLabel: "логистическая компания", uz: "logistika kompaniyasi", uzLabel: "logistika kompaniyasi" },
  { key: "fitnes", ruGen: "фитнес-клуба", ruLabel: "фитнес-клуб", uz: "fitnes klubi", uzLabel: "fitnes klubi" },
];

export function cityByKey(key: string): City | null {
  return CITIES.find((c) => c.key === key) ?? null;
}

export function nicheByKey(key: string): Niche | null {
  return NICHES.find((n) => n.key === key) ?? null;
}
