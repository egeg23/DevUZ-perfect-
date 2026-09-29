/**
 * Язык панели.
 *
 * Владелец: «Админ панель на узбекском тоже должна быть», затем — «также
 * добавь польский». Язык — настройка сотрудника (staff.panel_locale), а не
 * браузера: выбирает его сам человек переключателем в шапке, и по нему же
 * бот потом будет писать ему в Telegram.
 *
 * Словарь панели отдельный от словаря сайта (content/dictionaries.ts): у
 * сайта свои языки и свои правила, у панели — языки команды. Узбекский —
 * латиницей, как везде на сайте.
 *
 * Перевод только по ключу, никогда по готовому русскому тексту: «перевести
 * в браузере то, что уже отрисовано» ломается на первой же запятой и
 * склонении.
 */

export const PANEL_LOCALES = ["ru", "uz", "pl"] as const;
export type PanelLocale = (typeof PANEL_LOCALES)[number];

export const DEFAULT_PANEL_LOCALE: PanelLocale = "ru";

export function isPanelLocale(value: unknown): value is PanelLocale {
  return typeof value === "string" && (PANEL_LOCALES as readonly string[]).includes(value);
}

/** Что пришло из базы или формы — в язык панели; мусор — в русский. */
export function panelLocale(value: unknown): PanelLocale {
  return isPanelLocale(value) ? value : DEFAULT_PANEL_LOCALE;
}

/** Подпись в переключателе — короткая и одинаковая на всех языках. */
export const PANEL_LOCALE_SHORT: Record<PanelLocale, string> = { ru: "RU", uz: "UZ", pl: "PL" };

/** Название языка на нём самом — для подсказки у переключателя. */
export const PANEL_LOCALE_NAME: Record<PanelLocale, string> = {
  ru: "Русский",
  uz: "O‘zbekcha",
  pl: "Polski",
};

/** Атрибут `<html lang>`. */
export const PANEL_HTML_LANG: Record<PanelLocale, string> = { ru: "ru", uz: "uz-Latn", pl: "pl" };

/**
 * Кука-зеркало языка: только для `<html lang>` в общем layout и страницы
 * входа, где сотрудника ещё нет. Решает всегда колонка в staff — кука ничего
 * не открывает и ничего не значит, кроме подсказки браузеру.
 */
export const PANEL_LANG_COOKIE = "devuz_admin_lang";

/** Строка или строка с подстановками. */
export type Msg = string | ((...args: never[]) => string);

/** Одна запись словаря: все языки обязательны. */
export type Tr<T = string> = { readonly [L in PanelLocale]: T };

/**
 * Словарь панели.
 *
 * Вид записи задаёт `ru`, а `uz` и `pl` обязаны ему соответствовать:
 * забытый язык или функция с другими аргументами — ошибка сборки, а не
 * пустое место на экране у узбекоязычного менеджера.
 */
export function defineDict<T extends Record<string, Msg>>(entries: {
  [K in keyof T]: { readonly ru: T[K]; readonly uz: NoInfer<Widen<T[K]>>; readonly pl: NoInfer<Widen<T[K]>> };
}): { [K in keyof T]: Tr<Widen<T[K]>> } {
  return entries as { [K in keyof T]: Tr<Widen<T[K]>> };
}

/** «Выйти» — это string, а не литерал: иначе `uz` обязан был бы совпасть с `ru`. */
type Widen<T> = T extends string ? string : T;

/** Словарь на одном языке: `t.signOut`, `t.leadsLeft(3)`. */
export type Picked<D> = { [K in keyof D]: D[K] extends Tr<infer T> ? T : never };

export function pick<D extends Record<string, Tr<Msg>>>(dict: D, locale: PanelLocale): Picked<D> {
  const out: Record<string, Msg> = {};
  for (const key of Object.keys(dict)) out[key] = dict[key][locale];
  return out as Picked<D>;
}

/** Одна строка на нужном языке — для таблиц вида `Record<ключ, Tr>`. */
export function tr<T>(value: Tr<T>, locale: PanelLocale): T {
  return value[locale];
}
