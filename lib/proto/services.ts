/**
 * Услуги для автосборки — с сайта компании и только дословно.
 *
 * В панели список услуг пишет менеджер после первички: под `<h2>` на живом
 * сайте лежит и «Наши услуги», и «Оставьте заявку», и поисковый мусор, и
 * разобрать это мог только человек (см. lib/proto/collect). Для прототипа,
 * собранного заранее, человека нет — первички ещё не было.
 *
 * Читает страницу модель, но последнее слово не за ней. Каждое название,
 * которое она вернула, обязано стоять в тексте страницы дословно (с
 * точностью до регистра, пробелов и «ё»), цена — тоже. Не нашлось — услуги
 * нет в прототипе. Правило proto-master «прототип называет только то, что
 * клиент сказал о себе сам» держится не на честности модели, а на сверке:
 * модель, которая «улучшила» название или дописала популярную услугу ниши,
 * проиграет проверке, а не владельцу.
 */
import type { ProtoService } from "@/lib/proto/facts";

/** Сколько услуг берём: сцена — шесть, плюс короткий список под ней. */
export const AUTO_SERVICES_MAX = 9;
/** Меньше трёх — прототип не собирается (missingParts), как и из панели. */
export const AUTO_SERVICES_MIN = 3;

/** Строка для сравнения: регистр, «ё», кавычки, тире и пробелы не различаем. */
export function flat(text: string): string {
  return text
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[«»"“”„'’‘ʻ`]/g, "")
    .replace(/[‐-―−]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Название, которое услугой не является: призыв, раздел сайта, сама ниша.
 * Модель такие возвращает редко, но «Записаться» в карточке услуги — брак,
 * который виден с первого взгляда.
 */
const NOT_A_SERVICE =
  /^(?:главная|о нас|о компании|контакты|услуги|наши услуги|все услуги|цены|прайс|записаться|запись|оставить заявку|оставьте заявку|подробнее|узнать цену|позвонить|отзывы|акции|blog|блог|bosh sahifa|biz haqimizda|aloqa|xizmatlar|narxlar|yozilish|home|about|contacts?|services|prices|book now)$/i;

export function verifiedServices(
  candidates: readonly { name?: unknown; price?: unknown }[],
  page: string,
): ProtoService[] {
  const text = flat(page);
  const seen = new Set<string>();
  const out: ProtoService[] = [];
  for (const candidate of candidates) {
    const name = typeof candidate.name === "string" ? candidate.name.replace(/\s+/g, " ").trim() : "";
    if (name.length < 3 || name.length > 60) continue;
    if (NOT_A_SERVICE.test(name)) continue;
    const key = flat(name);
    if (!text.includes(key) || seen.has(key)) continue;
    seen.add(key);
    // Цена — только та, что стоит на его сайте дословно. Число, которое
    // модель «прикинула», в прототипе — утверждение о его прайсе от его имени.
    const price = typeof candidate.price === "string" ? candidate.price.replace(/\s+/g, " ").trim() : "";
    out.push({ name, price: price && /\d/.test(price) && text.includes(flat(price)) ? price : null });
    if (out.length >= AUTO_SERVICES_MAX) break;
  }
  return out;
}

/**
 * Название компании для автосборки.
 *
 * Из заголовка вкладки сборщик берёт первую часть — и у половины сайтов это
 * «Главная». Название с карт (label касания) надёжнее: его компания вписала
 * сама. Дальше — то, что вернула модель, если оно стоит на странице, и уже
 * потом заголовок вкладки, если это не раздел сайта.
 */
const NOT_A_NAME = /^(?:главная|главная страница|home|homepage|bosh sahifa|asosiy|asosiy sahifa|index|welcome|добро пожаловать)$/i;

export function autoName(input: { label: string | null; model: string | null; title: string | null; page: string }): string | null {
  const ok = (value: string | null | undefined): string | null => {
    const name = (value ?? "").replace(/\s+/g, " ").trim();
    return name.length >= 2 && name.length <= 60 && !NOT_A_NAME.test(name) ? name : null;
  };
  const label = ok(input.label);
  if (label) return label;
  const model = ok(input.model);
  if (model && flat(`${input.title ?? ""} ${input.page}`).includes(flat(model))) return model;
  return ok((input.title ?? "").split(/[|—–-]/)[0]);
}

/** Инструмент, которым модель возвращает разбор страницы. */
export const SERVICES_TOOL = {
  name: "site_services",
  description: "Услуги и название компании — дословно так, как они написаны на её сайте.",
  input_schema: {
    type: "object",
    properties: {
      name: {
        type: ["string", "null"],
        description: "Как компания называет себя на сайте, дословно. Не нашёл — null.",
      },
      services: {
        type: "array",
        maxItems: 12,
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Название услуги дословно со страницы, без пересказа и без добавлений." },
            price: {
              type: ["string", "null"],
              description: "Цена этой услуги дословно со страницы, например «от 150 000 сум». Нет рядом с услугой — null.",
            },
          },
          required: ["name", "price"],
        },
      },
    },
    required: ["name", "services"],
  },
} as const;

export const SERVICES_SYSTEM = `Ты читаешь текст сайта компании и выписываешь её услуги — для прототипа нового сайта, который увидит её владелец.

Правила, которые проверяет машина:
— Название услуги — дословная строка со страницы. Не переводи, не сокращай, не исправляй опечатки, не объединяй две услуги в одну. Строку, которой на странице нет, проверка выбросит.
— Только то, что компания делает для клиента: «Лечение кариеса», «Курсы английского для детей», «УЗИ брюшной полости». Не разделы сайта, не призывы («Записаться», «Подробнее»), не преимущества («Опытные врачи»), не адреса и не SEO-фразы вроде «стоматология недорого ташкент».
— Не добавляй услуг, которых нет на странице, даже если они есть у всех в этой нише.
— Цена — только если она стоит у этой услуги на странице, дословно. Иначе null.
— Порядок — как на сайте, сначала главные. До двенадцати услуг.
— Название компании — как она называет себя на сайте. Не уверен — null.`;

export function servicesPrompt(input: { host: string; niche: string; text: string; locale: "ru" | "uz" }): string {
  return [
    `Сайт: ${input.host}`,
    `Ниша: ${input.niche}`,
    // Сайты в Ташкенте часто на двух-трёх языках сразу, и услуга стоит
    // трижды. Прототип на одном — берём его строки, не смешивая.
    `Язык прототипа: ${input.locale === "uz" ? "узбекский (латиница)" : "русский"}. Если услуги на сайте написаны на нескольких языках, выписывай строки на этом языке; нет на нём — на том, что есть.`,
    "",
    "Текст сайта (главная и страница услуг, если она есть):",
    input.text,
  ].join("\n");
}
