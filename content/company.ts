import type { LocalizedText } from "@/lib/i18n";

/**
 * Единственный источник правды по контактам и реквизитам студии.
 * Отсюда данные попадают и в футер, и в JSON-LD, и в системный промпт
 * AI-менеджера — чтобы телефон нигде не разъехался.
 */
export const company = {
  name: "DevUz Studio",
  legalName: "DevUz Studio",
  foundedYear: 2024,

  tagline: {
    ru: "Мы пишем код, который приносит деньги",
    en: "We write code that makes money",
    uz: "Biz pul keltiradigan kod yozamiz",
    zh: "我们编写创造收益的代码",
  } satisfies LocalizedText,

  description: {
    ru: "Студия полного цикла из Ташкента: сайты, мобильные приложения, AI-продукты на LLM и RAG, маркетплейсы и сервисы доставки.",
    en: "A full-cycle studio in Tashkent: websites, mobile apps, AI products built on LLM and RAG, marketplaces and delivery services.",
    uz: "Toshkentdagi to‘liq siklli studiya: veb-saytlar, mobil ilovalar, LLM va RAG asosidagi AI mahsulotlar, marketpleyslar va yetkazib berish xizmatlari.",
    zh: "位于塔什干的全流程开发工作室：网站、移动应用、基于 LLM 与 RAG 的 AI 产品、电商平台与配送服务。",
  } satisfies LocalizedText,

  // ─── Контакты ──────────────────────────────────────────────────────────────
  // Телефон не публикуем сознательно: единственные точки входа — Telegram и
  // форма на сайте. Так каждое обращение попадает в одну воронку и проходит
  // через квалификацию, а не теряется в чьих-то входящих звонках.
  telegram: "Devuz_studio_bot",
  telegramUrl: "https://t.me/Devuz_studio_bot",

  address: {
    street: {
      ru: "Ташкент",
      en: "Tashkent",
      uz: "Toshkent",
      zh: "塔什干",
    } satisfies LocalizedText,
    city: {
      ru: "Ташкент",
      en: "Tashkent",
      uz: "Toshkent",
      zh: "塔什干",
    } satisfies LocalizedText,
    country: "UZ",
    countryName: {
      ru: "Узбекистан",
      en: "Uzbekistan",
      uz: "O‘zbekiston",
      zh: "乌兹别克斯坦",
    } satisfies LocalizedText,
    // Координаты центра Ташкента — уточнить на адрес офиса.
    lat: 41.2995,
    lon: 69.2401,
  },

  social: {
    telegram: "https://t.me/Devuz_studio_bot",
    github: "https://github.com/egeg23",
  },

  /**
   * Реквизиты.
   *
   * ПИНФЛ — персональный идентификатор физического лица. Для ИП в Узбекистане
   * его публикация в реквизитах обычное дело, но это всё же личные данные,
   * поэтому он показан только на юридической странице, а не в подвале каждой
   * страницы сайта.
   */
  legal: {
    name: "ИП MAKSIMOV EGOR ANDREEVICH",
    nameLatin: "IP MAKSIMOV EGOR ANDREEVICH",
    form: {
      ru: "Индивидуальный предприниматель",
      en: "Individual entrepreneur",
      uz: "Yakka tartibdagi tadbirkor",
      zh: "个体工商户",
    } satisfies LocalizedText,
    pinfl: "32303946570039",
  },
} as const;

/**
 * Официальный курс ЦБ Узбекистана на 21.08.2026.
 *
 * Калькулятор считает в сумах — это валюта, в которой думает местный
 * заказчик, — и пересчитывает в доллары для англоязычной и китайской версий.
 * Курс держится константой намеренно: живой курс в оценке «от» создавал бы
 * впечатление, что цена скачет каждый день. Обновляется вручную.
 */
export const USD_RATE = 11850;

export const stats = [
  {
    value: "12",
    suffix: "+",
    label: {
      ru: "проектов в продакшене",
      en: "projects in production",
      uz: "ishlab chiqarishdagi loyihalar",
      zh: "个已上线项目",
    } satisfies LocalizedText,
  },
  {
    value: "4",
    suffix: "",
    label: {
      ru: "языка на наших сайтах",
      en: "languages on our sites",
      uz: "saytlarimizdagi tillar",
      zh: "个网站语言版本",
    } satisfies LocalizedText,
  },
  {
    value: "35",
    suffix: "",
    label: {
      ru: "микросервисов в крупнейшем проекте",
      en: "microservices in our largest project",
      uz: "eng yirik loyihadagi mikroservislar",
      zh: "最大项目的微服务数量",
    } satisfies LocalizedText,
  },
  {
    value: "60",
    suffix: " сек",
    suffixByLocale: {
      ru: " сек",
      en: " sec",
      uz: " son.",
      zh: " 秒",
    } satisfies LocalizedText,
    label: {
      ru: "первый ответ клиенту, круглосуточно",
      en: "first reply to a client, around the clock",
      uz: "mijozga birinchi javob, kunu tun",
      zh: "全天候首次回复时间",
    } satisfies LocalizedText,
  },
] as const;
