import { t, type Locale } from "@/lib/i18n";
import type { Case } from "@/content/cases";

/**
 * Заголовок страницы кейса под поиск.
 *
 * Сверка по Вордстату 26.11.2026 (Россия и СНГ, набор «site»): «сайт для
 * ресторана» — 2 112 в месяц, «сайт для стоматологии» — 917, «сайт для
 * турагентства» — 749, «сайт для салона красоты» — 677, «сайт для
 * медицинского центра» — 316. Владелец, 26.11.2026: «предлагаю индексировать
 * наши проекты, чтобы выдавались при поиске». Поэтому у русской страницы
 * сайта ниши запрос стоит в заголовке: «Nek Dental Studio: сайт для
 * стоматологии — кейс DevUz».
 *
 * Только у сайтов (в подписи кейса есть «сайт»): приложение турагентства —
 * не «сайт для турагентства». Ниша — первая из `forNiches`, их ставят руками.
 * Остальные языки и кейсы — прежний заголовок «Имя — подпись».
 */
const NICHE_QUERY: Record<string, string> = {
  stomatologiya: "сайт для стоматологии",
  medcentr: "сайт для медицинского центра",
  restoran: "сайт для ресторана",
  turagentstvo: "сайт для турагентства",
  mebel: "сайт для мебельной компании",
  avtoservis: "сайт для автосервиса",
  "uchebnyy-centr": "сайт для учебного центра",
};

export function caseQuery(item: Pick<Case, "forNiches" | "category">, locale: Locale): string | null {
  if (locale !== "ru") return null;
  const query = NICHE_QUERY[item.forNiches[0] ?? ""];
  if (!query) return null;
  return /сайт/i.test(t(item.category, "ru")) ? query : null;
}

export function caseTitle(item: Pick<Case, "name" | "forNiches" | "category">, locale: Locale): string {
  const query = caseQuery(item, locale);
  return query ? `${item.name}: ${query} — кейс DevUz` : `${item.name} — ${t(item.category, locale)}`;
}
