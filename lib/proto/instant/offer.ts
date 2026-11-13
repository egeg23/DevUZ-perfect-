/**
 * Предложение после «Макета в боте»: база и допы ниши — одни и те же для
 * сообщения бота и страницы КП (lib/proto/instant/kp.ts).
 *
 * Владелец, 11.11.2026: «КП предлагаю собрать базовое 500 / 1000 $ + допы
 * если нужно, много допов совокупно на 1500$. То есть чтобы весь сайт стоил
 * не дороже 2000-2500… данные просто подставляются клиентские, ничего
 * заново не генерируем и не тратим на это токены… Для многих ниш мы их уже
 * делали — просто берем их».
 *
 * База — PROMO (lib/admin/mockup-offer): лендинг 500 $ и корпоративный
 * 1 000 $, как во всех спецусловиях после макета. Допы и цены — из планов
 * наших макетов этой ниши (scripts/protos/<макет>/plan.mjs →
 * content/mockup-plans.json, ассеты ниш), подобраны так, чтобы все вместе
 * давали до OFFER_ADDONS_MAX. Модели нет.
 */
import plans from "@/content/mockup-plans.json" with { type: "json" };
import shox from "@/content/proto-instant/shox-assets.json" with { type: "json" };
import { OFFER_HOURS, PROMO, untilText } from "@/lib/admin/mockup-offer";
import type { InstantLocale, InstantNiche } from "@/lib/proto/instant/types";

export type OfferAddon = { id: string; ru: string; uz: string; price: number };

/** Допы все вместе — не дороже этого: сайт целиком 2 000-2 500 $. */
export const OFFER_ADDONS_MAX = 1500;

type Plan = { id: string; addons: { id: string; title: string; price: number }[] };

/** Доп из плана нашего макета: цена оттуда, подписи — наши, на двух языках. */
function fromPlan(plan: string, id: string, ru: string | null, uz: string): OfferAddon {
  const p = (plans as Plan[]).find((x) => x.id === plan);
  const a = p?.addons.find((x) => x.id === id);
  if (!a) throw new Error(`Нет допа «${id}» в плане «${plan}» (content/mockup-plans.json)`);
  return { id: `${plan}-${id}`, ru: ru ?? a.title, uz, price: a.price };
}

const OFFERS: Record<InstantNiche, () => OfferAddon[]> = {
  logistika: () => LOGISTIKA_ADDONS(),
  // Nek Dental Studio.
  stomatologiya: () => [
    fromPlan("nek", "admin", null, "Klinika paneli: yozuv, messenjerlar, jadval"),
    fromPlan("nek", "chat", null, "Saytdagi chat: javoblar yoki administrator"),
    fromPlan("nek", "quiz", null, "4 qadamli «Tabassumingiz» kvizi"),
    fromPlan("nek", "remind", null, "Bemorga tashrif eslatmasi"),
    fromPlan("nek", "reviews", null, "Saytda Google sharhlari"),
    fromPlan("nek", "pages", "Отдельные страницы услуг", "Har bir xizmat uchun alohida sahifa"),
  ],
  // Shox International Hospital: план — EXTRAS (shox-assets.json).
  medcentr: () => shox.addons.map((a) => ({ id: `shox-${a.id}`, ru: a.ru, uz: a.uz, price: a.price })),
  // Мебель: допы Enotmebel и общие допы наших макетов (панель, CRM, бот).
  mebel: () => [
    fromPlan("usemtau", "panel", "Панель заявок и замеров: статусы, менеджеры", "Ariza va o‘lchovlar paneli: holatlar, menejerlar"),
    fromPlan("usemtau", "crm", "Заявки сразу в amoCRM или Bitrix24", "Arizalar darhol amoCRM yoki Bitrix24 ga"),
    fromPlan("karomat", "tgbot", "Telegram-бот: заявка на замер и статус заказа", "Telegram-bot: o‘lchov arizasi va buyurtma holati"),
    fromPlan("enotmebel", "pay", null, "Payme va Click orqali to‘lov"),
    fromPlan("enotmebel", "nasiya", "Рассрочка Uzum Nasiya и Alif", "Uzum Nasiya va Alif muddatli to‘lovi"),
    fromPlan("enotmebel", "uz", null, "O‘zbekcha versiya"),
  ],
  // Ресторан: допы нашего макета Karomat (бронь уже в лендинге).
  restoran: () => [
    fromPlan("karomat", "order", null, "Onlayn buyurtma: yetkazib berish va olib ketish"),
    fromPlan("karomat", "pay", null, "Click, Payme, Uzum orqali to‘lov"),
    fromPlan("karomat", "panel", "Панель владельца: брони, заказы, стоп-лист", "Ega paneli: bronlar, buyurtmalar, stop-list"),
    fromPlan("karomat", "tgbot", null, "Restoran Telegram-boti"),
    fromPlan("karomat", "qr", null, "Stoldagi QR-menyu"),
    fromPlan("karomat", "banket", null, "Banketlar va to‘y: kalkulyator va arizalar"),
    fromPlan("karomat", "reviews", null, "Yandex Xaritalar va Google sharhlari"),
  ],
  // Турагентство: допы нашего макета SEM Travel.
  turagentstvo: () => [
    fromPlan("semtravel", "tourvisor", "Поиск туров через Турвизор", "Turvizor orqali tur qidirish"),
    fromPlan("semtravel", "pick", null, "«Qayerga borishni bilmayman» tanlovi"),
    fromPlan("semtravel", "crm", null, "amoCRM yoki Bitrix24 bilan bog‘lash"),
    fromPlan("semtravel", "tgbot", null, "Arizalar uchun Telegram-bot"),
    fromPlan("semtravel", "pay", null, "Click, Payme, Uzum orqali onlayn to‘lov"),
  ],
  // Учебный центр: допы нашего макета Aipply и общие допы наших макетов (цены оттуда).
  "uchebnyy-centr": () => [
    fromPlan("aipply", "tg", "Заявка в Telegram: курс, день, время", "Telegramda ariza: kurs, kun, vaqt"),
    fromPlan("aipply", "test", "Тест «Какой у вас уровень»", "«Darajangiz qanday» testi"),
    fromPlan("aipply", "intro", "Влёт в логотип", "Logotipga uchib kirish"),
    fromPlan("semtravel", "cabinet", "Кабинет ученика: расписание и оплаты", "O‘quvchi kabineti: jadval va to‘lovlar"),
    fromPlan("semtravel", "crm", null, "amoCRM yoki Bitrix24 bilan bog‘lash"),
    fromPlan("semtravel", "pay", null, "Click, Payme, Uzum orqali onlayn to‘lov"),
    fromPlan("karomat", "tgbot", "Telegram-бот: запись и напоминание о занятии", "Telegram-bot: yozilish va dars eslatmasi"),
  ],
  // Недвижимость: допы наших макетов DomTut и ShahaR.
  nedvizhimost: () => [
    fromPlan("domtut", "booking", null, "Menejer taqvimi bilan ko‘rishga yozilish"),
    fromPlan("domtut", "crm", "Заявки в amoCRM или Bitrix24", "Arizalar amoCRM yoki Bitrix24 ga"),
    fromPlan("domtut", "bot", null, "Tanlovlar uchun Telegram-bot"),
    fromPlan("domtut", "estimate", "Оценка квартиры по району", "Kvartirani tuman bo‘yicha baholash"),
    fromPlan("shahar", "fav", null, "Sevimlilar va Telegramga tanlov"),
    fromPlan("shahar", "mort", "Калькулятор ипотеки", "Ipoteka kalkulyatori"),
    fromPlan("shahar", "uz", null, "O‘zbekcha versiya"),
  ],
  // Салон красоты: своего макета салона нет, допы — из планов Nek (запись, панель) и Karomat.
  "salon-krasoty": () => [
    fromPlan("nek", "admin", "Панель салона: запись, мессенджеры, расписание мастеров", "Salon paneli: yozuv, messenjerlar, ustalar jadvali"),
    fromPlan("nek", "remind", "Напоминание о визите клиенту", "Mijozga tashrif eslatmasi"),
    fromPlan("nek", "chat", null, "Saytdagi chat: javoblar yoki administrator"),
    fromPlan("nek", "reviews", null, "Saytda Google sharhlari"),
    fromPlan("karomat", "loyalty", "Кешбэк и уровни клиента", "Keshbek va mijoz darajalari"),
    fromPlan("karomat", "gift", null, "Sovg‘a sertifikatlari"),
    fromPlan("karomat", "pay", null, "Click, Payme, Uzum orqali to‘lov"),
  ],
  // Интернет-магазин: допы нашего макета Greenwell.
  magazin: () => [
    fromPlan("greenwell", "abandoned", null, "Tashlab ketilgan savat: Telegram yoki SMS eslatma"),
    fromPlan("greenwell", "tgbot", null, "Do‘konning Telegram-boti"),
    fromPlan("greenwell", "crm", null, "Buyurtmalar amoCRM yoki Bitrix24 ga"),
    fromPlan("greenwell", "promo", null, "Paneldan promokodlar va aksiyalar"),
  ],
  // Автосервис: допы нашего макета AUTOMECHANIC и панель, напоминания, отзывы из плана Nek (цены оттуда).
  avtoservis: () => [
    fromPlan("automechanic", "tg", null, "Telegramga buyurtmalar"),
    fromPlan("automechanic", "pwa", null, "Sayt ilova kabi"),
    fromPlan("automechanic", "route", null, "Yandex va Google Xaritalarda yo‘nalish"),
    fromPlan("automechanic", "uz", null, "O‘zbekcha versiya"),
    fromPlan("nek", "admin", "Панель сервиса: запись, мессенджеры, расписание мастеров", "Servis paneli: yozuv, messenjerlar, ustalar jadvali"),
    fromPlan("nek", "remind", "Напоминание клиенту о ТО", "Mijozga TXK eslatmasi"),
    fromPlan("nek", "reviews", null, "Saytda Google sharhlari"),
  ],
  // Стройка и ремонт: допы нашего макета Lider Prof (расчёт, просмотр 360°, заставка, отзывы, движение).
  stroitelstvo: () => [
    fromPlan("lider-prof", "calc", "Расчёт ремонта по площади, с заявкой и планом", "Maydon bo‘yicha ta’mir hisobi, ariza va reja bilan"),
    fromPlan("lider-prof", "pano", "Просмотр 360° ваших объектов", "Obyektlaringizni 360° ko‘rish"),
    fromPlan("lider-prof", "filters", "Работы с фильтром по видам ремонта", "Ta’mir turlari bo‘yicha saralangan ishlar"),
    fromPlan("lider-prof", "stats", "Цифры объекта на виду: площадь, сроки, этапы", "Obyekt raqamlari ko‘zga tashlanadi: maydon, muddat, bosqichlar"),
    fromPlan("lider-prof", "intro", "Влёт в логотип", "Logotipga uchib kirish"),
    fromPlan("lider-prof", "trust", "Отзывы заказчиков и карта объектов", "Buyurtmachilar sharhlari va obyektlar xaritasi"),
    fromPlan("lider-prof", "motion", "Своё движение у каждого блока", "Har bir blokda o‘z harakati"),
  ],
  // «Услуги для бизнеса» и всё, чью сферу не узнали: общие допы наших макетов, без слов одной сферы.
  uslugi: () => [
    fromPlan("semtravel", "crm", "Заявки сразу в amoCRM или Bitrix24", "Arizalar darhol amoCRM yoki Bitrix24 ga"),
    fromPlan("semtravel", "cabinet", "Кабинет клиента: статус заявки и документы", "Mijoz kabineti: ariza holati va hujjatlar"),
    fromPlan("nek", "chat", "Чат на сайте: ответы или менеджер", "Saytdagi chat: javoblar yoki menejer"),
    fromPlan("semtravel", "pay", null, "Click, Payme, Uzum orqali onlayn to‘lov"),
    fromPlan("karomat", "tgbot", "Telegram-бот: заявки и ответы клиентам", "Telegram-bot: arizalar va mijozlarga javoblar"),
    fromPlan("karomat", "reviews", "Отзывы с Яндекс Карт и Google на сайте", "Saytda Yandex Xaritalar va Google sharhlari"),
  ],
  // Автосалон: допы нашего макета SAMIST AUTO (кредит, трейд-ин и тест-драйв уже на макете).
  avtosalon: () => [
    fromPlan("samist", "admin", null, "Arizalar va mavjudlik paneli"),
    fromPlan("samist", "tgbot", null, "Telegram-bot: mavjudlik, narxlar, ariza"),
    fromPlan("samist", "pick", "Подбор машины под задачу", "Vazifaga qarab mashina tanlash"),
    fromPlan("samist", "compare", null, "Uchtagacha modelni taqqoslash"),
    fromPlan("samist", "seo", null, "Qidiruv uchun model sahifalari"),
  ],
};

/**
 * Владелец, 12.11.2026: «Цены в коммерческом, которые идут после макетов, на
 * допы снизь на 30% по каждому допу». Скидка — от цены плана нашего макета,
 * до 5 $; сами планы (договоры, макеты руками) не меняются.
 */
export const OFFER_ADDON_DISCOUNT = 0.3;

export function offerAddonPrice(planPrice: number): number {
  return Math.max(5, Math.round((planPrice * (1 - OFFER_ADDON_DISCOUNT)) / 5) * 5);
}

// Логистика: допы нашего макета CARGO PRO GROUP (кабинет клиента и курс ЦБ не входят: допы вместе до 1 500 $).
const LOGISTIKA_ADDONS = (): OfferAddon[] => [
  fromPlan("cargopro", "admin", null, "Arizalar va yuklar paneli"),
  fromPlan("cargopro", "track", null, "Yukni raqam bo‘yicha kuzatish"),
  fromPlan("cargopro", "bot", null, "Telegram-bot: hisob va yuk holati"),
  fromPlan("cargopro", "docs", null, "Bojxona hujjatlari bo‘yicha maslahat"),
  fromPlan("cargopro", "seo", "Страницы направлений под запросы клиентов", "Mijozlar so‘rovlari uchun yo‘nalish sahifalari"),
];

export function offerAddons(niche: InstantNiche): OfferAddon[] {
  return OFFERS[niche]().map((a) => ({ ...a, price: offerAddonPrice(a.price) }));
}

/**
 * Допы на en, ar, pl — у сфер, чей макет собирается на этих языках
 * (MOCKUP_EXTRA): ключ — id допа из offerAddons.
 */
const ADDON_TR: Record<string, { en: string; ar: string; pl: string }> = {
  "nek-admin": { en: "Clinic panel: bookings, messengers, schedule", ar: "لوحة العيادة: الحجوزات والمراسلات والجدول", pl: "Panel kliniki: zapisy, komunikatory, grafik" },
  "nek-chat": { en: "Website chat: answers or an administrator", ar: "دردشة على الموقع: إجابات جاهزة أو موظف الاستقبال", pl: "Czat na stronie: odpowiedzi albo administrator" },
  "nek-quiz": { en: "«Your smile» quiz in 4 steps", ar: "اختبار «ابتسامتك» في 4 خطوات", pl: "Quiz «Twój uśmiech» w 4 krokach" },
  "nek-remind": { en: "Visit reminders for patients", ar: "تذكير المريض بموعد الزيارة", pl: "Przypomnienie pacjentowi o wizycie" },
  "nek-reviews": { en: "Google reviews on the website", ar: "تقييمات Google على الموقع", pl: "Opinie Google na stronie" },
  "nek-pages": { en: "Separate pages for each service", ar: "صفحة مستقلة لكل خدمة", pl: "Osobne strony usług" },
  "shox-admin": { en: "Admin panel for bookings and patient work", ar: "لوحة إدارة للحجوزات والعمل مع المرضى", pl: "Panel administracyjny do zapisów i pracy z pacjentami" },
  "shox-bot": { en: "Telegram booking bot", ar: "بوت Telegram للحجز", pl: "Bot Telegram do zapisów" },
  "shox-sms": { en: "SMS reminders", ar: "تذكيرات عبر الرسائل القصيرة", pl: "Przypomnienia SMS" },
  "shox-cabinet": { en: "Patient account with test results", ar: "حساب شخصي للمريض مع نتائج التحاليل", pl: "Konto pacjenta z wynikami badań" },
  "shox-reviews": { en: "Patient reviews with moderation", ar: "تقييمات المرضى مع المراجعة", pl: "Opinie pacjentów z moderacją" },
  "karomat-order": { en: "Online ordering: delivery and pickup", ar: "طلب عبر الإنترنت: توصيل واستلام", pl: "Zamówienia online: dostawa i odbiór osobisty" },
  "karomat-pay": { en: "Online payment", ar: "الدفع عبر الإنترنت", pl: "Płatności online" },
  "karomat-panel": { en: "Owner panel: bookings, orders, stop list", ar: "لوحة المالك: الحجوزات والطلبات والأطباق غير المتوفرة", pl: "Panel właściciela: rezerwacje, zamówienia, stop-lista" },
  "karomat-tgbot": { en: "Restaurant Telegram bot", ar: "بوت Telegram للمطعم", pl: "Bot Telegram restauracji" },
  "karomat-qr": { en: "QR menu on the table", ar: "قائمة QR على الطاولة", pl: "Menu QR na stoliku" },
  "karomat-banket": { en: "Banquets and weddings: calculator and requests", ar: "الولائم والأعراس: حاسبة وطلبات", pl: "Bankiety i wesela: kalkulator i zgłoszenia" },
  "karomat-reviews": { en: "Google and Yandex Maps reviews", ar: "تقييمات Google وYandex Maps", pl: "Opinie z Google i Yandex Maps" },
};

/** Подпись допа на языке клиента; нет перевода — английская, затем русская. */
export function addonTitle(a: OfferAddon, l: InstantLocale): string {
  if (l === "ru" || l === "uz") return a[l];
  return ADDON_TR[a.id]?.[l] ?? a.ru;
}

/** Есть ли у допов сферы подписи на en, ar, pl. */
export const addonsTranslated = (niche: InstantNiche) => offerAddons(niche).every((a) => Boolean(ADDON_TR[a.id]));

const BASE_EXTRA = {
  en: {
    landing: ["Landing page based on this mockup", `with everything that works on it and ${PROMO.landing.addons} extras of your choice`],
    corporate: ["Full corporate website", "all sections, two languages, pages for search"],
  },
  ar: {
    landing: ["صفحة هبوط على أساس هذا النموذج", `مع كل ما يعمل فيه و${PROMO.landing.addons} إضافات من اختياركم`],
    corporate: ["موقع شركة متكامل", "كل الأقسام، لغتان، صفحات لمحركات البحث"],
  },
  pl: {
    landing: ["Landing na bazie tej makiety", `ze wszystkim, co na niej działa, i ${PROMO.landing.addons} dodatkami do wyboru`],
    corporate: ["Pełna strona firmowa", "wszystkie sekcje, dwa języki, strony pod wyszukiwarkę"],
  },
} as const;

/**
 * Спецусловия 48 часов на en, ar, pl — те же цены PROMO и тот же срок, что
 * announceText (lib/admin/mockup-offer) на русском и узбекском.
 */
export function announceExtra(l: "en" | "ar" | "pl", expiresAt: string): string {
  const until = untilText(expiresAt);
  const a = PROMO.landing;
  const c = PROMO.corporate;
  if (l === "en") {
    return [
      `Special terms for this mockup: ${OFFER_HOURS} hours, until ${until} Tashkent time:`,
      `• a landing page based on this mockup, fully working, with ${a.addons} extras of your choice: ${a.price} $ instead of ${a.regular} $;`,
      `• a full corporate website: ${c.price} $ instead of ${c.regular} $.`,
      "If we sign the contract before then, the price stays the same. After that, regular prices apply.",
    ].join("\n");
  }
  if (l === "ar") {
    return [
      `شروط خاصة لهذا النموذج: ${OFFER_HOURS} ساعة، حتى ${until} بتوقيت طشقند:`,
      `• صفحة هبوط على أساس هذا النموذج بكل وظائفه و${a.addons} إضافات من اختياركم: ${a.price} $ بدلًا من ${a.regular} $؛`,
      `• موقع شركة متكامل: ${c.price} $ بدلًا من ${c.regular} $.`,
      "إذا وقّعنا العقد قبل هذا الموعد يبقى السعر كما هو. بعده تُطبّق الأسعار العادية.",
    ].join("\n");
  }
  return [
    `Warunki specjalne dla tej makiety: ${OFFER_HOURS} godzin, do ${until} czasu Taszkentu:`,
    `• landing na bazie tej makiety, w pełni działający, z ${a.addons} dodatkami do wyboru: ${a.price} $ zamiast ${a.regular} $;`,
    `• pełna strona firmowa: ${c.price} $ zamiast ${c.regular} $.`,
    "Jeśli podpiszemy umowę do tego czasu, cena się nie zmieni. Potem obowiązują zwykłe ceny.",
  ].join("\n");
}

export function offerBase(locale: InstantLocale) {
  if (locale === "en" || locale === "ar" || locale === "pl") {
    const b = BASE_EXTRA[locale];
    return [
      { id: "landing", title: b.landing[0] as string, note: b.landing[1] as string, price: PROMO.landing.price, regular: PROMO.landing.regular },
      { id: "corporate", title: b.corporate[0] as string, note: b.corporate[1] as string, price: PROMO.corporate.price, regular: PROMO.corporate.regular },
    ];
  }
  return [
    {
      id: "landing",
      title: locale === "uz" ? "Shu maket bo‘yicha lending" : "Лендинг по этому макету",
      note: locale === "uz" ? `barcha funksiyalari va tanlovingizga ${PROMO.landing.addons} ta qo‘shimcha bilan` : `со всем, что на нём работает, и ${PROMO.landing.addons} допа на выбор`,
      price: PROMO.landing.price,
      regular: PROMO.landing.regular,
    },
    {
      id: "corporate",
      title: locale === "uz" ? "To‘liq korporativ sayt" : "Полноразмерный корпоративный сайт",
      note: locale === "uz" ? "barcha bo‘limlar, ikki til, qidiruv uchun sahifalar" : "все разделы, два языка, страницы под поиск",
      price: PROMO.corporate.price,
      regular: PROMO.corporate.regular,
    },
  ];
}
