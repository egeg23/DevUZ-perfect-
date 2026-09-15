/**
 * Что затирать на скриншоте.
 *
 * Компания в разборе не называется — решение владельца, и оно же снимает
 * юридический риск. Но «не называется» в тексте мало: имя и логотип стоят
 * на самом снимке, и без них снимок бесполезен, а с ними разбор перестаёт
 * быть анонимным.
 *
 * Здесь чистая часть: из адреса и заголовка страницы собирается список слов,
 * которые на снимке заменяются. Сам браузер и рисование плашек — в
 * scripts/razbor-shot.mjs; сюда они не лезут, чтобы правила можно было
 * закрыть тестами.
 *
 * Правило отбора простое: берём то, что почти наверняка имя компании, и не
 * берём то, что почти наверняка обычное слово. Ошибка в первую сторону
 * оставляет лишнюю плашку на снимке — некрасиво. Ошибка во вторую оставляет
 * имя компании в публичной статье — а это уже то, чего мы избегаем.
 */

/**
 * Слова, которые в имени домена ничего не говорят о компании.
 *
 * Без этого списка `dental-clinic.uz` дал бы токены «dental» и «clinic», и
 * на снимке затёрлось бы слово «клиника» везде, где оно встречается, — то
 * есть половина страницы стоматологии.
 */
const GENERIC = new Set([
  "www", "shop", "store", "market", "online", "site", "web", "group", "company",
  "clinic", "dental", "medical", "med", "auto", "service", "studio", "agency",
  "food", "delivery", "travel", "tour", "law", "legal", "build", "stroy",
  "mebel", "beauty", "salon", "fitness", "school", "center", "centre", "uz",
  "kz", "kg", "com", "net", "org", "ru", "info", "biz", "co",
]);

/** Отделяем имя второго уровня: `clinic.dentalux.uz` → `dentalux`. */
export function domainTokens(url: string): string[] {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return [];
  }

  return host
    .split(/[.\-_]/)
    .filter((part) => part.length >= 4 && !GENERIC.has(part) && !/^\d+$/.test(part));
}

/**
 * Имя компании из заголовка страницы.
 *
 * `<title>` почти всегда устроен как «Имя — что делаем» или «Что делаем |
 * Имя». Берём кусок до первого разделителя, если он короткий: длинный кусок
 * — это описание, а не имя, и затирать его целиком значит стереть пол-экрана.
 */
export function titleTokens(title: string | null): string[] {
  if (!title) return [];

  const head = title.split(/[|—–\-·:]/)[0]?.trim() ?? "";
  // Больше четырёх слов — это уже фраза. Имя компании в такой кусок не
  // помещается, а вот «Стоматология в Ташкенте, запись онлайн» помещается.
  const words = head.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 4) return [];

  return words.filter((w) => w.length >= 4 && !GENERIC.has(w.toLowerCase()));
}

/**
 * Полный список того, что закрывается на снимке.
 *
 * Дубли убираются без учёта регистра: «Dentalux» и «DENTALUX» — одно слово,
 * и вторая плашка поверх первой ничего не добавляет.
 */
export function redactions(url: string, title: string | null): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const token of [...domainTokens(url), ...titleTokens(title)]) {
    const key = token.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(token);
  }

  return out;
}
