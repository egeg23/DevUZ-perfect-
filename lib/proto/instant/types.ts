/**
 * Макет в боте — данные клиента для шаблона ниши.
 *
 * Владелец, 10.11.2026: «мы же просто используем уже те макеты, которые у
 * нас готовы, просто переодеваем логотип и тексты… категорию выбирают
 * сами, а мы тянем соответствующий макет». Дизайн и блоки — наш готовый
 * шаблон ниши (lib/proto/instant/<ниша>.ts); отсюда в него идёт только то,
 * что мы узнали о клиенте: с его сайта (lib/proto/instant/read.ts) или из
 * его ответов в боте, если сайта нет.
 *
 * Граница та же, что у прототипов из панели (lib/proto/facts): пустое поле —
 * блока нет, своих фактов и цен шаблон не дописывает.
 */
import { PHONE_DIGITS } from "@/lib/proto/instant/safe";

/**
 * Язык бота и макета. Владелец, 13.11.2026: «В тг боте добавляем при старте
 * еще языки (английский, арабский, польский)». Бот, виджет и КП говорят на
 * всех пяти; макет на en, ar, pl — только у сфер из MOCKUP_LANGS, остальные
 * сферы на этих языках собирает дизайнер вручную (ручной путь бота).
 */
export type InstantLocale = "ru" | "uz" | "en" | "ar" | "pl";
export const INSTANT_LOCALES = ["ru", "uz", "en", "ar", "pl"] as const satisfies readonly InstantLocale[];
/** Языки, на которых написаны шаблоны всех сфер. */
export type BaseLocale = "ru" | "uz";
/** Новые языки: у них словари переводов (lib/proto/instant/tr). */
export type ExtraLocale = Exclude<InstantLocale, BaseLocale>;
export const isBaseLocale = (l: InstantLocale): l is BaseLocale => l === "ru" || l === "uz";
/** Справа налево. */
export const isRtl = (l: InstantLocale) => l === "ar";
/** Сайт студии и страница условий макета на этих языках есть; арабского нет — английский. */
export const siteLocaleOf = (l: InstantLocale): "ru" | "uz" | "en" | "pl" => (l === "ar" ? "en" : l);

/** Данные клиента для шаблона, который знает только ru и uz. */
export type BaseSite = InstantSite & { locale: BaseLocale };

/**
 * На каких языках собирается макет сферы. ru и uz — у всех; en, ar, pl —
 * у сфер с переводом шаблона (stomatologiya, medcentr, restoran). Сфера без
 * языка клиента — ручной путь: «соберёт наш дизайнер», лид менеджеру.
 */
export const MOCKUP_EXTRA: readonly InstantNiche[] = ["stomatologiya", "medcentr", "restoran"];
export function mockupSpeaks(niche: InstantNiche, l: InstantLocale): boolean {
  return isBaseLocale(l) || MOCKUP_EXTRA.includes(niche);
}

/** Ниши, у которых есть шаблон. Остальные — «скоро» и лид менеджеру. */
export const INSTANT_NICHES = ["stomatologiya", "medcentr", "mebel", "restoran", "turagentstvo", "uchebnyy-centr", "nedvizhimost", "salon-krasoty", "magazin", "avtoservis", "logistika", "stroitelstvo", "uslugi", "avtosalon"] as const;
export type InstantNiche = (typeof INSTANT_NICHES)[number];

/**
 * Как сфера называется человеку: по-русски и по-узбекски — те же слова, что
 * на кнопках бота, по-польски — для инструкции и помощника. Новая сфера без
 * названия не соберётся: список сфер помощник сотруднику берёт отсюда, а не
 * из текста инструкции (12.11.2026 он ответил «для трёх ниш», когда их было
 * восемь: длинный абзац инструкции обрезался на третьей).
 */
export const INSTANT_NICHE_LABEL: Readonly<Record<InstantNiche, { ru: string; uz: string; pl: string }>> = {
  stomatologiya: { ru: "стоматология", uz: "stomatologiya", pl: "stomatologia" },
  medcentr: { ru: "медцентр", uz: "tibbiyot markazi", pl: "centrum medyczne" },
  mebel: { ru: "мебель-ремонт", uz: "mebel-ta’mir", pl: "meble-remont" },
  restoran: { ru: "ресторан", uz: "restoran", pl: "restauracja" },
  turagentstvo: { ru: "турагентство", uz: "turagentlik", pl: "biuro podróży" },
  "uchebnyy-centr": { ru: "учебный центр", uz: "o‘quv markazi", pl: "centrum szkoleniowe" },
  nedvizhimost: { ru: "недвижимость", uz: "ko‘chmas mulk", pl: "nieruchomości" },
  "salon-krasoty": { ru: "салон красоты", uz: "go‘zallik saloni", pl: "salon urody" },
  magazin: { ru: "интернет-магазин", uz: "internet-do‘kon", pl: "sklep internetowy" },
  avtoservis: { ru: "автосервис", uz: "avtoservis", pl: "warsztat samochodowy" },
  logistika: { ru: "логистика", uz: "logistika", pl: "logistyka" },
  stroitelstvo: { ru: "стройка и ремонт", uz: "qurilish va ta’mir", pl: "budowa i remont" },
  uslugi: { ru: "услуги для бизнеса", uz: "biznes xizmatlari", pl: "usługi dla firm" },
  avtosalon: { ru: "автосалон", uz: "avtosalon", pl: "salon samochodowy" },
};

export function instantReady(niche: string): niche is InstantNiche {
  return (INSTANT_NICHES as readonly string[]).includes(niche);
}

export type InstantService = { name: string; price: string | null };
export type InstantPerson = { name: string; role: string | null };

export type InstantSite = {
  niche: InstantNiche;
  locale: InstantLocale;
  /** Как клиника называет себя сама. */
  name: string;
  /** Короткая строка о себе с их сайта (слоган). */
  tagline: string | null;
  /** Абзац о клинике с их сайта. */
  about: string | null;
  city: string | null;
  /** Фирменный цвет #rrggbb — с их логотипа или сайта. Нет — цвет шаблона. */
  color: string | null;
  /** Логотип: https-адрес на их сайте или data:image. Нет — текстовый знак. */
  logo: string | null;
  services: InstantService[];
  /** Врачи — только если названы у клиники. */
  doctors: InstantPerson[];
  /** Почему к ним — их слова, до шести. */
  perks: string[];
  phone: string | null;
  telegram: string | null;
  whatsapp: string | null;
  instagram: string | null;
  address: string | null;
  hours: string | null;
  /** Их фото (https). Пусто — нейтральные фото ниши (public/protos/_niche). */
  photos: string[];
  /** Откуда данные: адрес сайта или «ответы в Telegram». Печатается в подвале. */
  source: string;
};

/** Сколько чего показывает шаблон: длинный список режется, короткий не добивается. */
export const LIMITS = { services: 12, doctors: 8, perks: 6, photos: 6 } as const;

export function emptySite(niche: InstantNiche, locale: InstantLocale, name: string, source: string): InstantSite {
  return {
    niche,
    locale,
    name,
    tagline: null,
    about: null,
    city: null,
    color: null,
    logo: null,
    services: [],
    doctors: [],
    perks: [],
    phone: null,
    telegram: null,
    whatsapp: null,
    instagram: null,
    address: null,
    hours: null,
    photos: [],
    source,
  };
}

/** Чего не хватает, чтобы собирать: без имени и без связи макет бессмыслен. */
export function instantMissing(site: InstantSite): ("name" | "contact")[] {
  const out: ("name" | "contact")[] = [];
  if (!site.name.trim()) out.push("name");
  const phone = (site.phone ?? "").replace(/\D/g, "");
  if (!(phone.length >= PHONE_DIGITS) && !site.telegram && !site.whatsapp) out.push("contact");
  return out;
}

/** Все факты клиента одной строкой — пул для проверки чисел и хвостов. */
export function sitePool(site: InstantSite): string {
  return [
    site.name,
    site.tagline ?? "",
    site.about ?? "",
    site.city ?? "",
    site.address ?? "",
    site.hours ?? "",
    site.phone ?? "",
    site.whatsapp ?? "",
    site.telegram ?? "",
    site.instagram ?? "",
    site.source,
    ...site.services.map((s) => `${s.name} ${s.price ?? ""}`),
    ...site.doctors.map((d) => `${d.name} ${d.role ?? ""}`),
    ...site.perks,
  ].join(" \n ");
}
