import type { MetadataRoute } from "next";

import { cases } from "@/content/cases";
import { listRazbors } from "@/lib/razbor/store";
import { RAZBOR_LOCALES } from "@/lib/razbor/routing";
import { products } from "@/content/products";
import { services } from "@/content/services";
import { hreflang, locales } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/seo";

/**
 * Карта сайта со ссылками на языковые версии.
 *
 * Каждая запись несёт полный набор альтернатив — Google рекомендует
 * дублировать hreflang и в sitemap, а не только в <head>: так связка языковых
 * версий доходит до индекса даже если робот не дошёл до самой страницы.
 */
/**
 * Карта пересобирается раз в час, а не раз в сборку.
 *
 * Разборы публикуются кнопкой в панели; карта, замороженная на сборке,
 * узнала бы о новом разборе только со следующей выкаткой — то есть позже
 * поисковика, которому мы о нём в тот же момент сообщаем через IndexNow.
 * Сброс из панели приходит сразу, этот срок — страховка.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Разборы теперь живут в базе: ночная смена публикует их без выкатки, и
  // sitemap, собранный из файла, не узнал бы о них до следующего деплоя —
  // то есть ровно та страница, ради которой раздел и существует, осталась
  // бы невидимой для поиска.
  const razbors = (
    await Promise.all(RAZBOR_LOCALES.map((locale) => listRazbors(locale)))
  ).flat();

  const paths = [
    { path: "", priority: 1, changeFrequency: "weekly" as const },
    { path: "services", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "calculator", priority: 0.9, changeFrequency: "monthly" as const },
    // Аудитор — вход для холодного трафика: по запросам вида «проверить
    // сайт» приходят те, у кого уже что-то не так, а это готовый разговор.
    { path: "audit", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "products", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "cases", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "about", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "partners", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "contact", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "privacy", priority: 0.3, changeFrequency: "yearly" as const },
    // Оферта и лицензия индексируются намеренно: покупатель ищет их до
    // покупки, и находить он должен наш документ, а не чужой пересказ.
    { path: "offer", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "licence", priority: 0.3, changeFrequency: "yearly" as const },
    ...services.map((s) => ({
      path: `services/${s.slug}`,
      priority: 0.8,
      changeFrequency: "monthly" as const,
    })),
    ...products.map((p) => ({
      path: `products/${p.slug}`,
      priority: 0.8,
      changeFrequency: "monthly" as const,
    })),
    ...cases.map((c) => ({
      path: `cases/${c.slug}`,
      priority: 0.7,
      changeFrequency: "yearly" as const,
    })),
  ];

  const lastModified = new Date();

  /**
   * Разборы идут отдельным списком, а не через общий цикл по языкам.
   *
   * Они существуют только на русском и узбекском: это разные запросы, а не
   * перевод одного. Пустить их через общий цикл значит пообещать Google
   * английскую и китайскую версии, которых нет, — и получить четыре
   * страницы 404 на каждый разбор.
   */
  const razborEntries: MetadataRoute.Sitemap = [
    // Сам раздел — на двух языках.
    ...RAZBOR_LOCALES.map((locale) => ({
      url: absoluteUrl(`${locale}/razbor`),
      lastModified,
      changeFrequency: "daily" as const,
      priority: 0.9,
      alternates: { languages: razborLanguages() },
    })),
    ...razbors.map((item) => ({
      url: absoluteUrl(`${item.locale}/razbor/${item.slug}`),
      // Разбор описывает состояние сайта на дату снимка и потом не
      // меняется: звать робота перечитывать его каждый день незачем.
      lastModified: new Date(item.publishedAt),
      changeFrequency: "yearly" as const,
      priority: 0.8,
      alternates: {
        languages: item.alt
          ? {
              [hreflang[item.locale]]: absoluteUrl(`${item.locale}/razbor/${item.slug}`),
              [hreflang[item.alt.locale]]: absoluteUrl(
                `${item.alt.locale}/razbor/${item.alt.slug}`,
              ),
              "x-default": absoluteUrl(
                item.locale === "ru"
                  ? `ru/razbor/${item.slug}`
                  : `ru/razbor/${item.alt.slug}`,
              ),
            }
          : undefined,
      },
    })),
  ];

  return [...razborEntries, ...paths.flatMap((entry) =>
    locales.map((locale) => {
      const languages: Record<string, string> = {};
      for (const alt of locales) {
        languages[hreflang[alt]] = absoluteUrl(
          entry.path ? `${alt}/${entry.path}` : alt,
        );
      }
      // x-default стоит и в <head>, но в sitemap его не было — а Google
      // сверяет оба источника и неполную связку молча игнорирует. Ведёт на
      // русскую версию: это язык основного потока клиентов из Узбекистана.
      languages["x-default"] = absoluteUrl(entry.path ? `ru/${entry.path}` : "ru");

      return {
        url: absoluteUrl(entry.path ? `${locale}/${entry.path}` : locale),
        lastModified,
        changeFrequency: entry.changeFrequency,
        priority: entry.priority,
        alternates: { languages },
      };
    }),
  )];
}

/** Языковые альтернативы самого раздела: только те, где он есть. */
function razborLanguages(): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of RAZBOR_LOCALES) {
    languages[hreflang[locale]] = absoluteUrl(`${locale}/razbor`);
  }
  languages["x-default"] = absoluteUrl("ru/razbor");
  return languages;
}
