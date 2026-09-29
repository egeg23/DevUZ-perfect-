/**
 * Подписи раздела «Разборы».
 *
 * Только русский и узбекский: разборы пишутся под запросы этих двух
 * рынков, и переводить их на английский незачем — по-английски такие
 * запросы в Ташкенте не набирают.
 */
import type { RazborLocale } from "@/lib/razbor/model";

type Copy = {
  kicker: string;
  title: string;
  lead: string;
  empty: string;
  emptyNote: string;
  before: string;
  after: string;
  shotOn: string;
  whatBreaks: string;
  whatItCosts: string;
  howWeFix: string;
  outcome: string;
  price: string;
  more: string;
  anonymous: string;
  /** Единственная продающая ссылка внутри статьи — на профильную услугу. */
  /** Заголовок блока про потерянные обращения. */
  lossTitle: string;
  /** Тело с местами под {lo} и {hi}. */
  lossBody: string;
  /** Оговорка о том, что это допущение, а не замер. */
  lossHow: string;
  serviceLink: string;
  cta: string;
  ctaButton: string;
};

export const razborCopy: Record<RazborLocale, Copy> = {
  ru: {
    kicker: "разборы",
    title: "Разборы сайтов",
    lead: "Каждый день берём один живой сайт, смотрим на него глазами клиента и показываем, что мешает ему продавать. Компанию не называем: разговор про ошибки, а не про людей. Раз в неделю — тендерный разбор: что обычно упускают в техническом задании IT-закупки.",
    empty: "Первый разбор выйдет завтра",
    emptyNote:
      "Раздел только открылся. Придумывать примеры мы не стали: студия, которая разбирает чужие сайты, не может показывать поддельный разбор.",
    before: "Как есть",
    after: "Как сделали бы мы",
    shotOn: "Снимок сделан",
    whatBreaks: "Что мешает продавать",
    whatItCosts: "Чем оборачивается",
    howWeFix: "Что делаем",
    outcome: "Что это даёт",
    price: "Сколько стоит и сколько занимает",
    more: "Ещё разборы этой ниши",
    anonymous:
      "Компанию не называем и ссылку не даём. Речь о типовых ошибках, а не о конкретных людях; на снимке имя и логотип закрыты.",
    lossTitle: "Во что это обходится",
    lossBody: "Из каждых ста человек, дошедших до сайта и готовых обратиться, на этих местах теряются примерно {lo}–{hi}.",
    lossHow: "Это расчёт по нашим допущениям, а не замер чужой статистики: посещаемости этого сайта мы не знаем и не подставляем. Считаем на сто посетителей — доли по каждому пункту открыты и лежат в коде.",
    serviceLink: "Заказать сайт для такого бизнеса →",
    cta: "Хотите такой же разбор своего сайта?",
    ctaButton: "Проверить сайт",
  },
  uz: {
    kicker: "tahlillar",
    title: "Saytlar tahlili",
    lead: "Har kuni bitta tirik saytni olamiz, unga mijoz ko‘zi bilan qaraymiz va nima sotuvga xalaqit berayotganini ko‘rsatamiz. Kompaniyani nomlamaymiz: gap xatolar haqida, odamlar haqida emas. Haftada bir marta — tender tahlili: IT-xarid texnik topshirig‘ida odatda nima e’tibordan chetda qoladi.",
    empty: "Birinchi tahlil ertaga chiqadi",
    emptyNote:
      "Bo‘lim endi ochildi. Namuna o‘ylab topmadik: boshqalarning saytini tahlil qiladigan studiya soxta tahlil ko‘rsata olmaydi.",
    before: "Qanday",
    after: "Biz qanday qilardik",
    shotOn: "Suratga olingan",
    whatBreaks: "Sotuvga nima xalaqit beradi",
    whatItCosts: "Oqibati",
    howWeFix: "Nima qilamiz",
    outcome: "Bu nima beradi",
    price: "Narxi va muddati",
    more: "Shu yo‘nalishdagi boshqa tahlillar",
    anonymous:
      "Kompaniyani nomlamaymiz va havola bermaymiz. Gap odatiy xatolar haqida, aniq odamlar haqida emas; suratda nom va logotip yopilgan.",
    lossTitle: "Bu nimaga tushadi",
    lossBody: "Saytga kirgan va murojaat qilishga tayyor har yuz kishidan bu joylarda taxminan {lo}–{hi} tasi yo‘qoladi.",
    lossHow: "Bu — ochiq aytilgan taxminlarimiz asosidagi hisob, begona statistikaning o‘lchovi emas: bu saytning tashriflarini bilmaymiz va o‘ylab topmaymiz. Hisob yuz tashrifga, har bir band ulushi kodda ochiq turadi.",
    serviceLink: "Shunday biznes uchun sayt buyurtma qilish →",
    cta: "O‘z saytingizga ham shunday tahlil kerakmi?",
    ctaButton: "Saytni tekshirish",
  },
};

/**
 * Подписи тендерного разбора недели (lib/razbor/tender.ts) — поверх общих.
 *
 * Статья та же по устройству, но разбирает не сайт, а типовое ТЗ: «что
 * мешает продавать» и «проверить сайт» к ней не подходят, а вместо снимков —
 * оговорка, что закупку мы не называем.
 */
export const tenderCopy: Record<RazborLocale, Partial<Copy>> = {
  ru: {
    whatBreaks: "Что обычно упускают в ТЗ",
    whatItCosts: "Чем оборачивается",
    howWeFix: "Как написать правильно",
    outcome: "Что даёт хорошее ТЗ",
    more: "Ещё тендерные разборы",
    anonymous: "Заказчиков и закупки не называем: разбираем типовое ТЗ, а не чей-то тендер.",
    serviceLink: "ТЗ для тендера или субподряд — подробнее →",
    cta: "Готовите закупку или уже выиграли тендер?",
    ctaButton: "Обсудить тендер",
  },
  uz: {
    whatBreaks: "Texnik topshiriqda odatda nima e’tibordan chetda qoladi",
    whatItCosts: "Oqibati",
    howWeFix: "Qanday to‘g‘ri yozish kerak",
    outcome: "Yaxshi texnik topshiriq nima beradi",
    more: "Boshqa tender tahlillari",
    anonymous: "Buyurtmachilar va xaridlarni nomlamaymiz: kimningdir tenderini emas, odatiy texnik topshiriqni tahlil qilamiz.",
    serviceLink: "Tender uchun texnik topshiriq yoki subpudrat — batafsil →",
    cta: "Xaridga tayyorlanyapsizmi yoki tenderni allaqachon yutdingizmi?",
    ctaButton: "Tenderni muhokama qilish",
  },
};

/**
 * Раздел на украинском и польском — без своих статей.
 *
 * Отдельный набор, а не ещё два ключа в `razborCopy`: у этих языков нет
 * статьи, и подписи вроде «Как есть» / «Что делаем» им не нужны. Здесь
 * только то, что видит человек на странице списка.
 */
export type RazborBorrowedCopy = {
  kicker: string;
  title: string;
  lead: string;
  /** Честная строка о том, на каких языках выходят статьи. */
  languageNote: string;
  /** Метка языка на карточке: «RU». */
  badge: string;
  /** Подпись ссылки на карточке. */
  readIn: string;
  empty: string;
  anonymous: string;
};

export const razborBorrowedCopy: Record<"uk" | "pl", RazborBorrowedCopy> = {
  uk: {
    kicker: "розбори",
    title: "Розбори сайтів",
    lead: "Щодня беремо один живий сайт, дивимося на нього очима клієнта й показуємо, що заважає йому продавати. Компанію не називаємо: розмова про помилки, а не про людей.",
    languageNote:
      "Статті поки що виходять російською та узбецькою: кожен розбір пишеться під пошукові запити бізнесу в Узбекистані. Нижче — російські версії.",
    badge: "RU",
    readIn: "Читати російською →",
    empty: "Перший розбір вийде найближчим часом — російською та узбецькою.",
    anonymous:
      "Компанію не називаємо й посилання не даємо. Мова про типові помилки, а не про конкретних людей; на знімку назву й логотип закрито.",
  },
  pl: {
    kicker: "analizy",
    title: "Analizy stron",
    lead: "Codziennie bierzemy jedną działającą stronę, patrzymy na nią oczami klienta i pokazujemy, co przeszkadza jej sprzedawać. Nie podajemy nazwy firmy: rozmawiamy o błędach, nie o ludziach.",
    languageNote:
      "Artykuły ukazują się na razie po rosyjsku i po uzbecku: każda analiza powstaje pod zapytania, które wpisują firmy w Uzbekistanie. Poniżej — wersje rosyjskie.",
    badge: "RU",
    readIn: "Czytaj po rosyjsku →",
    empty: "Pierwsza analiza ukaże się wkrótce — po rosyjsku i po uzbecku.",
    anonymous:
      "Nie podajemy nazwy firmy ani linku. Chodzi o typowe błędy, a nie o konkretnych ludzi; nazwa i logo na zrzucie są zasłonięte.",
  },
};
