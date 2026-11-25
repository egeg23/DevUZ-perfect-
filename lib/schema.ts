import { company, proof } from "@/content/company";
import type { Case } from "@/content/cases";
import type { Product } from "@/content/products";
import { LANDING_AREA } from "@/content/service-landings";
import { services, type Service } from "@/content/services";
import { absoluteUrl } from "@/lib/seo";
import { hreflang, locales, t, type Locale } from "@/lib/i18n";

/**
 * Сборщики JSON-LD.
 *
 * Разметка — это не украшение выдачи, а способ объяснить поисковику и ИИ,
 * который собирает подборки, кто такая DevUz и где она работает.
 *
 * До 25.11.2026 разметка говорила «местная компания в Ташкенте»: три
 * страны в `areaServed`. Владелец, 25.11.2026: «чтобы в рекомендациях по
 * запросу Гугла или Яндекса мы выдавались в топ подборке от Ии. Не только
 * по Ташкенту, мы работаем по всему миру». Теперь организация — с офисом в
 * Ташкенте (адрес остаётся: это факт и локальный поиск Узбекистана) и
 * работой по всему миру (`WORLD`, страны — те, где у страниц услуг свой
 * язык и регион, `LANDING_AREA`).
 */

type Json = Record<string, unknown>;

const ORG_ID = absoluteUrl("#organization");

/** Работаем удалённо с любой страной: так это читают Google и ИИ-подборки. */
const WORLD = { "@type": "Place", name: "Worldwide" } as const;

/** Страны, где у страниц услуг свой язык и регион, без повторов. */
const SERVED_COUNTRIES = [...new Set(Object.values(LANDING_AREA).flatMap((area) => area.countries))];

/** Страна номера — по коду: «+48» раньше попадал в «US». */
function phoneCountry(e164: string): string {
  if (e164.startsWith("+998")) return "UZ";
  if (e164.startsWith("+7")) return "RU";
  if (e164.startsWith("+48")) return "PL";
  if (e164.startsWith("+1")) return "US";
  return "UZ";
}
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
    areaServed: [WORLD, ...SERVED_COUNTRIES.map((name) => ({ "@type": "Country", name }))],
    knowsLanguage: [...locales],
    slogan: t(company.tagline, locale),
    numberOfEmployees: { "@type": "QuantitativeValue", value: proof.staff },
    knowsAbout: services.map((service) => t(service.title, locale)),
    sameAs: [company.social.telegram, company.social.github, ...company.profiles],
    telephone: company.phones[0].e164,
    // Каждый номер — своей точкой контакта: поисковику так видно, какой
    // номер для какой страны, и в карточке организации он покажет нужный.
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "sales",
        url: company.telegramUrl,
        availableLanguage: [...locales],
        areaServed: WORLD,
      },
      ...company.phones.map((phone) => ({
        "@type": "ContactPoint",
        contactType: "sales",
        telephone: phone.e164,
        areaServed: phoneCountry(phone.e164),
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
    areaServed: [WORLD, ...LANDING_AREA[locale].countries.map((name) => ({ "@type": "Country", name }))],
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
 * Услуга на странице под запрос (content/service-landings): цена «от» в
 * сумах — та же, что на странице и в калькуляторе, город — Ташкент.
 */
/**
 * Страница услуги под запрос. Регион и валюта — по языку страницы
 * (`LANDING_AREA`, `LANDING_MONEY` в content/service-landings): русская —
 * страны СНГ в долларах, узбекская — Ташкент и Узбекистан в сумах.
 */
export function landingSchema(input: {
  locale: Locale;
  slug: string;
  name: string;
  serviceType: string;
  description: string;
  /** Страны (английские имена); город — `city`. */
  areaServed: readonly string[];
  city?: string;
  currency: "USD" | "UZS";
  minPrice: number;
}): Json {
  return {
    "@type": "Service",
    name: input.name,
    description: input.description,
    serviceType: input.serviceType,
    provider: { "@id": ORG_ID },
    areaServed: [
      ...(input.city ? [{ "@type": "City", name: input.city }] : []),
      ...input.areaServed.map((name) => ({ "@type": "Country", name })),
    ],
    url: absoluteUrl(`${input.locale}/services/${input.slug}`),
    offers: {
      "@type": "Offer",
      priceCurrency: input.currency,
      priceSpecification: {
        "@type": "PriceSpecification",
        minPrice: input.minPrice,
        priceCurrency: input.currency,
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
/**
 * Обложки продукта без снимков — `public/products/<slug>/cover-<пропорция>.webp`,
 * их пишет `scripts/product-covers.mjs` (перезапуск — при смене названия,
 * состава, стека или цены продукта). 16:9, 4:3, 1:1 — как просит Google.
 */
export function productCovers(slug: string): { src: string; width: number; height: number }[] {
  return [
    { src: `/products/${slug}/cover-16x9.webp`, width: 1200, height: 675 },
    { src: `/products/${slug}/cover-4x3.webp`, width: 1200, height: 900 },
    { src: `/products/${slug}/cover-1x1.webp`, width: 1200, height: 1200 },
  ];
}

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
  //
  // Продукту без живого экземпляра — его обложка-«коробка» в трёх пропорциях
  // (`productCovers`): название, состав, стек и цена, без нарисованных
  // экранов. Search Console, 13.11.2026: «Отсутствует поле "image"» у
  // /zh/products/legal-ai — без картинки карточка товара в выдачу не идёт.
  // Обложка показана и на странице продукта.
  const images = product.shots?.length
    ? product.shots.map((shot) => absoluteUrl(shot.src.replace(/^\//, "")))
    : productCovers(product.slug).map((c) => absoluteUrl(c.src.replace(/^\//, "")));

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
    dateCreated: item.date,
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
  return jsonLdText({ "@context": "https://schema.org", "@graph": nodes });
}

/**
 * JSON для <script type="application/ld+json">. JSON.stringify оставляет
 * «</script>» как есть, а заголовки разборов и статей пишет модель по чужим
 * сайтам: такая строка закрыла бы тег и дальше шла бы как разметка.
 * «<» в \u003c — тот же JSON для поисковика, но тег им не закрыть.
 */
export function jsonLdText(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
