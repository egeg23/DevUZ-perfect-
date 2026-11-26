import { casesByDate } from "@/content/cases";
import { LEADGEN_LOCALES } from "@/content/leadgen";
import { LANDING_SLUGS } from "@/content/service-landings";
import { locales } from "@/lib/i18n";

/**
 * Главные страницы сайта и свежие проекты — для IndexNow после выкатки.
 *
 * Владелец, 26.11.2026: «предлагаю индексировать наши проекты, чтобы
 * выдавались при поиске, почему бы и нет? Делаем». Кейсы и так в карте сайта
 * (все 71 на шести языках), но Яндекс узнавал после выкатки только о свежих
 * разборах. Теперь раз в сутки — и о главных, услугах, страницах под
 * запросы, разделах кейсов, продуктах и последних кейсах.
 *
 * Без базы и сети: список проверяет тест.
 */

/** Сколько последних кейсов на каждом языке уходит в пинг. */
export const FRESH_CASES = 8;

export function siteUrls(base: string): string[] {
  const root = base.replace(/\/+$/, "");
  const fresh = casesByDate.slice(0, FRESH_CASES).map((c) => c.slug);
  const urls: string[] = [];
  for (const l of locales) {
    urls.push(`${root}/${l}`, `${root}/${l}/services`, `${root}/${l}/cases`, `${root}/${l}/box`, `${root}/${l}/calculator`);
    for (const slug of LANDING_SLUGS) urls.push(`${root}/${l}/services/${slug}`);
    for (const slug of fresh) urls.push(`${root}/${l}/cases/${slug}`);
  }
  for (const l of LEADGEN_LOCALES) urls.push(`${root}/${l}/leadgen`);
  return [...new Set(urls)];
}
