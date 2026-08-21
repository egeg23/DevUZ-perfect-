import { company } from "@/content/company";
import type { Case } from "@/content/cases";
import type { Service } from "@/content/services";
import { absoluteUrl } from "@/lib/seo";
import { hreflang, t, type Locale } from "@/lib/i18n";

/**
 * Сборщики JSON-LD.
 *
 * Разметка — это не украшение выдачи, а способ объяснить поисковику, что
 * DevUz — местная компания в Ташкенте с конкретным набором услуг. Для
 * локального поиска (а он в Узбекистане даёт заметную часть трафика) это
 * работает сильнее, чем любые ключевые слова в тексте.
 */

type Json = Record<string, unknown>;

const ORG_ID = absoluteUrl("#organization");
const SITE_ID = absoluteUrl("#website");

export function organizationSchema(locale: Locale): Json {
  return {
    "@type": ["Organization", "ProfessionalService"],
    "@id": ORG_ID,
    name: company.name,
    legalName: company.legalName,
    url: absoluteUrl(locale),
    logo: absoluteUrl("icon.svg"),
    image: absoluteUrl(`og-${locale}.png`),
    description: t(company.description, locale),
    email: company.email,
    telephone: company.phoneHref,
    foundingDate: String(company.foundedYear),
    address: {
      "@type": "PostalAddress",
      addressLocality: t(company.address.city, locale),
      addressCountry: company.address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: company.address.lat,
      longitude: company.address.lon,
    },
    areaServed: [
      { "@type": "Country", name: "Uzbekistan" },
      { "@type": "Country", name: "Kazakhstan" },
      { "@type": "Country", name: "Russia" },
    ],
    knowsLanguage: ["ru", "uz", "en", "zh"],
    sameAs: [company.social.telegram, company.social.github],
    priceRange: "$$",
  };
}

export function websiteSchema(locale: Locale): Json {
  return {
    "@type": "WebSite",
    "@id": SITE_ID,
    url: absoluteUrl(locale),
    name: company.name,
    inLanguage: hreflang[locale],
    publisher: { "@id": ORG_ID },
  };
}

export function serviceSchema(service: Service, locale: Locale): Json {
  return {
    "@type": "Service",
    name: t(service.title, locale),
    description: t(service.description, locale),
    serviceType: t(service.title, locale),
    provider: { "@id": ORG_ID },
    areaServed: { "@type": "Country", name: "Uzbekistan" },
    url: absoluteUrl(`${locale}/services/${service.slug}`),
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "PriceSpecification",
        minPrice: service.priceFromUsd,
        priceCurrency: "USD",
      },
    },
  };
}

export function caseSchema(item: Case, locale: Locale): Json {
  return {
    "@type": "CreativeWork",
    name: item.name,
    description: t(item.summary, locale),
    dateCreated: String(item.year),
    inLanguage: hreflang[locale],
    creator: { "@id": ORG_ID },
    url: absoluteUrl(`${locale}/cases/${item.slug}`),
    keywords: item.tech.join(", "),
  };
}

export function faqSchema(items: Array<{ q: string; a: string }>): Json {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function breadcrumbSchema(
  trail: Array<{ name: string; path: string }>,
): Json {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

/**
 * Собирает несколько сущностей в один граф.
 *
 * Один тег с @graph вместо пяти отдельных: так сущности могут ссылаться друг
 * на друга по @id, и поисковик видит связную картину, а не набор обрывков.
 */
export function jsonLdGraph(...nodes: Json[]): string {
  return JSON.stringify({ "@context": "https://schema.org", "@graph": nodes });
}
