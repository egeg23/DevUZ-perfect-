/**
 * Чего не умеет выбранная модель.
 *
 * Появилось при замере, когда переключение скаута на Хайку упало с
 * `400 This model does not support the effort parameter`. То есть выбрать
 * модель подешевле через .env было нельзя: параметр стоял в коде жёстко, и
 * узнать об этом можно было только попробовав.
 *
 * Здесь ровно одна разница между семействами и ни одной попытки собрать
 * «таблицу возможностей»: остальное у нас одинаково, а таблица, которую
 * некому обновлять, врёт через полгода.
 */

export type Effort = "low" | "medium" | "high";

/** Хайку не знает output_config.effort — остальные модели знают. */
export function supportsEffort(model: string): boolean {
  return !/haiku/i.test(model);
}

/**
 * Кусок запроса с усилием — или пустой, если модель про него не знает.
 *
 * Разворачивается в вызов через spread, поэтому на стороне вызова не
 * появляется ни одного `if`: строка либо есть, либо её нет.
 */
export function effortFor(model: string, effort: Effort): { output_config?: { effort: Effort } } {
  return supportsEffort(model) ? { output_config: { effort } } : {};
}
