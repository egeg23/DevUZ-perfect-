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
    lead: "Каждый день берём один живой сайт, смотрим на него глазами клиента и показываем, что мешает ему продавать. Компанию не называем: разговор про ошибки, а не про людей.",
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
    lead: "Har kuni bitta tirik saytni olamiz, unga mijoz ko‘zi bilan qaraymiz va nima sotuvga xalaqit berayotganini ko‘rsatamiz. Kompaniyani nomlamaymiz: gap xatolar haqida, odamlar haqida emas.",
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
