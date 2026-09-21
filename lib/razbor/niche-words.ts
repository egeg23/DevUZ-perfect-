/**
 * Ниша, которой нет в каталоге.
 *
 * Каталог `content/razbor/catalog.ts` описывает четырнадцать ниш готовыми
 * формами слов. Это не список тех, кого мы согласны разбирать: аудитор
 * работает по любому сайту. Это материал страницы — без родительного падежа
 * («сайт для логистической компании») нет ни заголовка, ни адреса, а без
 * узбекского корня нет второй языковой версии. Формы лежали словарём
 * потому, что русские падежи и узбекский местный имеют больше исключений,
 * чем правил, а ошибка попадает в <title> и в адрес страницы навсегда.
 *
 * Отсюда и цена ограничения: смена молча выбрасывала любой сайт, чья ниша в
 * каталог не попала, — включая застройщиков, которых классификатор узнавал,
 * а каталог не знал вовсе.
 *
 * Здесь только правила: что считается полной нишей и какую разбирать
 * нельзя. Сам вопрос модели — в `lib/razbor/niche-ask.ts`: этот файл
 * читают и публичные страницы, а тащить в их сборку SDK ради ночной
 * задачи незачем.
 *
 * Формы у модели спрашиваются. Это безопасно ровно потому, что
 * страница всё равно не выходит сама: разбор ложится на проверку, и человек
 * видит и запрос, и адрес, и подпись раньше, чем что-либо появится в поиске.
 * Выдуманная ниша не становится каталогом — она живёт в строке своего
 * разбора, а второй сайт в той же нише берёт уже проверенные формы.
 */
import type { Niche } from "@/content/razbor/catalog";
import { latin } from "@/lib/audit/pitch";

/**
 * Ниши, которые не разбираем, — по словам, а не по ключу.
 *
 * Список ключей в `OFF_LIMITS` защищал ровно от того, что было в каталоге:
 * «остальные запреты до этого места не доходят, их не распознаёт
 * классификатор». Как только нишу называет модель, это перестаёт быть
 * правдой — и первый же сайт банка или аптеки проходит насквозь.
 *
 * Проверяются все формы разом: ключ может оказаться безобидным
 * (`finansy`), а подпись — «микрокредитная организация».
 */
const FORBIDDEN =
  /банк|кредит|займ|ломбард|микрофинанс|страхов|аптек|фармац|клиник|больниц|медицин|врач|стоматолог|диспансер|лаборатор|казино|букмекер|ставк|лотере|табак|вейп|алкогол|оруж|госуд|министерств|хоким|политич|парти|bank|kredit|lombard|dorixona|klinika|shifoxona|tibbiy|kazino|qimor/i;

export function forbiddenNiche(niche: Niche): boolean {
  const words = [niche.key, niche.ruGen, niche.ruLabel, niche.uz, niche.uzLabel, niche.ruMock, niche.uzMock];
  return words.some((word) => FORBIDDEN.test(word));
}

const clean = (value: unknown, max = 80): string =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

const list = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((v) => clean(v, 40)).filter(Boolean).slice(0, 4) : [];

/**
 * Ответ модели → ниша, либо ничего.
 *
 * Неполная ниша не берётся: разбор с пустым узбекским корнем — это адрес
 * `/uz/razbor/uchun-sayt-toshkent`, то есть страница под запрос, которого
 * никто не набирает. Лучше пропустить сайт.
 */
export function parseNiche(raw: unknown): Niche | null {
  const input = (raw ?? {}) as Record<string, unknown>;

  // Ключ — наш, а не модели: он попадает в адрес страницы и в связку
  // разборов между собой, и кириллица или пробел в нём сломают и то, и
  // другое.
  const key = latin(clean(input.key, 40))
    .toLowerCase()
    .replace(/['’ʻ`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const niche: Niche = {
    key,
    ruGen: clean(input.ruGen),
    ruLabel: clean(input.ruLabel),
    uz: clean(input.uz),
    uzLabel: clean(input.uzLabel),
    ruMock: clean(input.ruMock, 30),
    uzMock: clean(input.uzMock, 30),
    ruServices: list(input.ruServices),
    uzServices: list(input.uzServices),
  };

  const filled =
    niche.key.length >= 3 &&
    [niche.ruGen, niche.ruLabel, niche.uz, niche.uzLabel, niche.ruMock, niche.uzMock].every(
      (word) => word.length >= 3,
    ) &&
    niche.ruServices.length >= 3 &&
    niche.uzServices.length >= 3;
  if (!filled) return null;

  // Узбекская версия пишется латиницей: кириллицей её не ищут, и страница
  // под такой запрос не найдётся ни по одному написанию.
  if (/[а-яё]/i.test(`${niche.uz} ${niche.uzLabel} ${niche.uzMock} ${niche.uzServices.join(" ")}`)) {
    return null;
  }

  return forbiddenNiche(niche) ? null : niche;
}
