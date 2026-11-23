/**
 * Источники, которые форма на сайте вправе назвать сама.
 *
 * Обычная форма — «form»; лист ожидания DevUz Box присылает «box», чтобы в
 * панели и в брифе было видно, что человек пришёл с промо-страницы коробки,
 * а не с заявкой на сайт; заявка с /ru/leadgen — «leadgen» (направление
 * «Лидогенерация», content/leadgen.ts). Чужие значения не пускаем: источник попадает в
 * карточку лида и в счёт ступеней продажи (INBOUND_SOURCES).
 */
export const FORM_SOURCES = ["form", "box", "leadgen"] as const;
export type FormSource = (typeof FORM_SOURCES)[number];

export function formSource(value: unknown): FormSource {
  return (FORM_SOURCES as readonly string[]).includes(String(value)) ? (value as FormSource) : "form";
}
