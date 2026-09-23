import { company } from "@/content/company";
import type { Case } from "@/content/cases";
import type { Product } from "@/content/products";
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
    telephone: company.phones[0].e164,
    // Каждый номер — своей точкой контакта: поисковику так видно, какой
    // номер для какой страны, и в карточке организации он покажет нужный.
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "sales",
        url: company.telegramUrl,
        availableLanguage: ["ru", "uz", "en", "zh"],
      },
      ...company.phones.map((phone) => ({
        "@type": "ContactPoint",
        contactType: "sales",
        telephone: phone.e164,
        areaServed: phone.e164.startsWith("+998") ? "UZ" : phone.e164.startsWith("+7") ? "RU" : "US",
        availableLanguage: ["ru", "uz", "en"],
      })),
    ],
    priceRange: "$$",
    /**
     * Условия возврата — здесь, а не в каждом оффере.
     *
     * Так советует сам Google: общую политику магазина он ждёт у
     * организации, а у товара — только если у конкретного товара условия
     * свои. У нас они общие и записаны в оферте, разделе 6.
     *
     * Категория именно «возврат не предусмотрен», и это не жадность: после
     * передачи ссылки на исходный код вернуть его так, чтобы он перестал
     * быть у покупателя, невозможно. Оферта ссылается на статью 21 закона
     * «О защите прав потребителей» и ровно поэтому даёт посмотреть продукт
     * до покупки. Если мы сами не можем передать оплаченное — деньги
     * возвращаются полностью, но это не возврат товара, а несостоявшаяся
     * продажа.
     */
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: ["UZ", "KZ", "RU"],
      returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
      merchantReturnLink: absoluteUrl(`${locale}/offer`),
    },
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

/**
 * Готовый продукт с ценой.
 *
 * В отличие от услуги, здесь цена точная, а не «от»: покупатель видит её на
 * странице, и расхождение между разметкой и страницей поисковик считает
 * попыткой обмануть выдачу. Поэтому у продуктов с вилкой отдаётся диапазон,
 * а не нижняя граница, выданная за окончательную цену.
 */
export function productSchema(product: Product, locale: Locale): Json {
  const offer: Json = product.priceToUsd
    ? {
        "@type": "AggregateOffer",
        priceCurrency: "USD",
        lowPrice: product.priceUsd,
        highPrice: product.priceToUsd,
        offerCount: 3,
      }
    : {
        "@type": "Offer",
        priceCurrency: "USD",
        price: product.priceUsd,
        availability: "https://schema.org/InStock",
      };

  // Изображение Google считает обязательным для карточки товара, и это не
  // формальность: строка выдачи с картинкой и без — разные строки. Но
  // картинка должна показывать товар, поэтому у продукта без живого
  // экземпляра поля просто нет. Общая обложка студии на его месте была бы
  // разметкой, разошедшейся со страницей.
  const images = (product.shots ?? []).map((shot) => absoluteUrl(shot.src.replace(/^\//, "")));

  return {
    "@type": "Product",
    name: t(product.title, locale),
    description: t(product.description, locale),
    ...(images.length ? { image: images } : {}),
    // Бренд — объект с именем, а не ссылка на узел организации. Ссылка
    // синтаксически верна и человеком читается, но проверка Google отвечала
    // на неё «недопустимый тип объекта в поле brand»: она ждёт тип Brand с
    // текстовым name и по `@id` в соседний блок разметки не ходит.
    brand: { "@type": "Brand", name: company.name },
    category: "SoftwareSourceCode",
    url: absoluteUrl(`${locale}/products/${product.slug}`),
    offers: { ...offer, seller: { "@id": ORG_ID }, url: absoluteUrl(`${locale}/products/${product.slug}`) },
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
