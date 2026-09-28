/**
 * Какую услугу студии продаёт конкретный разбор.
 *
 * Правило SEO-инструкции: изнутри статьи идёт одна ссылка на профильную
 * услугу — она и продаёт, — и несколько на соседние разборы, которые держат
 * человека на сайте. Соседи уже есть на странице; ссылки на услугу не было
 * вовсе, и разбор заканчивался предложением проверить свой сайт, а не
 * заказать новый.
 *
 * Сопоставление живёт здесь, а не в каталоге ниш: каталог описывает чужой
 * бизнес, а это — наш прайс. Услуги переименуются, ниши останутся.
 */

/** Слаг услуги из content/services.ts. */
export type ServiceSlug =
  | "web-development"
  | "marketplace-delivery"
  | "integrations-automation"
  | "it-tenders";

/**
 * Ниши, которым нужен не сайт-визитка, а торговля: каталог, корзина,
 * оплата, доставка. Отправлять их на «разработку сайтов» — продавать не то,
 * за чем они пришли.
 */
const COMMERCE: Record<string, ServiceSlug> = {
  "internet-magazin": "marketplace-delivery",
  "dostavka-edy": "marketplace-delivery",
  restoran: "marketplace-delivery",
};

/** Ниши, где боль обычно не в сайте, а в учёте и заявках. */
const AUTOMATION: Record<string, ServiceSlug> = {
  logistika: "integrations-automation",
};

/**
 * Тендерные разборы (раз в неделю, lib/razbor/tender-run.ts) продают не
 * сайт, а ТЗ и субподряд. Ключ повторяет TENDER_NICHE из lib/razbor/tender.ts
 * строкой: тот модуль тянет за собой базу, а это сопоставление читает
 * публичная страница.
 */
const TENDERS: Record<string, ServiceSlug> = {
  "it-tendery": "it-tenders",
};

export function serviceFor(niche: string): ServiceSlug {
  return COMMERCE[niche] ?? AUTOMATION[niche] ?? TENDERS[niche] ?? "web-development";
}
