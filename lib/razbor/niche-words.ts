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
/**
 * Медицина — не только «клиника» и «врач»: 10.10.2026 нашёлся опубликованный
 * разбор ниши «неврологический центр», которую список не узнал. Теперь в нём
 * и специальности, и «медцентр», «лечение», «реабилитация» — на русском,
 * узбекском и английском.
 *
 * Короткие корни — только с начала слова: «ставк» ловило «доСТАВКи», и
 * каталожная ниша «доставка еды» не разбиралась никогда; «оруж» —
 * «сооружения», «диагност» — «автодиагностику». «Кредит» — везде, кроме
 * «аккредитации»: «микрокредитная» запрещена.
 */
const FORBIDDEN =
  /банк|(?<!ак)кредит|займ|ломбард|микрофинанс|страхов|аптек|фармац|клиник|больниц|госпитал|поликлин|медицин|медцентр|медико|лечеб|лечени|реабилит|санатор|(?<![а-яё])диагност|врач|доктор|стоматолог|невролог|неврол|кардиолог|педиатр|гинеколог|уролог|офтальм|окулист|дерматолог|онколог|хирург|травматолог|терапевт|эндокринолог|психиатр|наркол|лор-|диспансер|лаборатор|анализ крови|казино|букмекер|(?<![а-яё])ставк|лотере|табак|вейп|алкогол|(?<![а-яё])оруж|госуд|министерств|хоким|политич|парти|bank|kredit|lombard|dorixona|klinika|shifoxona|kasalxona|poliklinika|tibbiy|tibbiyot|shifokor|nevrolog|kardiolog|pediatr|ginekolog|stomatolog|davolash|reabilitatsiya|sanatoriy|laboratoriya|kazino|qimor|medical|clinic|hospital|neurolog|cardiolog|dental|pharma/i;

export function forbiddenNiche(niche: Niche): boolean {
  const words = [niche.key, niche.ruGen, niche.ruLabel, niche.uz, niche.uzLabel, niche.ruMock, niche.uzMock, niche.en ?? ""];
  return words.some((word) => FORBIDDEN.test(word));
}

const clean = (value: unknown, max = 80): string =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

const list = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((v) => clean(v, 40)).filter(Boolean).slice(0, 4) : [];

const FOREIGN_LETTERS = { en: "a-z", pl: "a-ząćęłńóśźż" } as const;

/**
 * Название ниши для версии разбора — если оно похоже на название. Нет или
 * не похоже — поля нет, и версия спросит его отдельно, как раньше: ниша
 * из-за этого не пропадает. Строгая проверка — в validSubject при версии.
 */
function foreignName(locale: keyof typeof FOREIGN_LETTERS, value: unknown): { en?: string; pl?: string } {
  const name = clean(value, 60).toLowerCase();
  const letters = FOREIGN_LETTERS[locale];
  return new RegExp(`^[${letters}][${letters} -]{2,50}$`).test(name) ? { [locale]: name } : {};
}

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
    ...foreignName("en", input.en),
    ...foreignName("pl", input.pl),
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
