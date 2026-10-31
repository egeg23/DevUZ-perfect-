// Конструктор цены макета CARGO PRO GROUP: сайт и допы тумблерами.
//
// Задание владельца DevUz, 31.10.2026: «Стоимость для клиента без допников
// 1000$, с допами не более 3000$. Поставь в допы то, что клиенту реально
// нужно будет». Тумблер включает и выключает настоящий блок на сайте
// (data-addon="<id>"), итог считается сразу (образец — osonapteka/plan.mjs).
//
// Обычная цена — 4 900 $, как у Oson Apteka, Greenwell и Neoline: сайт на двух
// языках с калькулятором доставки и схемой маршрутов у студий Ташкента —
// 40-60 млн сум (docs/research/osonapteka.md, «Цены»). Допы — то, что у
// экспедиторов Узбекистана уже есть или чего клиенты просят первым
// (docs/research/cargopro.md): все вместе 2 000 $, сайт с допами 3 000 $.

export const BASE = {
  price: 4900,
  promo: 1000,
  ru: {
    t: "Сайт CARGO PRO GROUP",
    d: "Новый облик на русском и узбекском, сначала под телефон: залёт камерой в ваш знак, схема маршрутов по прокрутке, шесть услуг, конструктор тарифов с расчётом по весу и объёму в четырёх валютах, таможенный брокер, склады в ОАЭ, Узбекистане и Индии, партнёры, заявка с готовым текстом.",
  },
  uz: {
    t: "CARGO PRO GROUP sayti",
    d: "Rus va o‘zbek tilida yangi ko‘rinish, avvalo telefon uchun: belgingizga kamera bilan uchib kirish, aylantirganda yo‘nalishlar sxemasi, olti xizmat, og‘irlik va hajm bo‘yicha to‘rt valyutada hisoblaydigan tariflar konstruktori, bojxona brokeri, BAA, O‘zbekiston va Hindistondagi omborlar, hamkorlar, tayyor matnli ariza.",
  },
};

/** Акция: 48 часов с первого открытия макета на этом устройстве. */
export const OFFER_HOURS = 48;

/* who — у кого на рынке это уже есть (docs/research/cargopro.md). */
export const ADDONS = [
  { id: "admin", price: 450, star: true,
    ru: { t: "Панель заявок и грузов", e: "Заявка с сайта первой строкой, статус груза меняется в панели и сразу виден клиенту, клиенты и их грузы, история действий, роли: менеджер не видит маржу", who: "как в эталоне Greenwell" },
    uz: { t: "Arizalar va yuklar paneli", e: "Saytdan ariza birinchi qatorda, yuk holati panelda o‘zgaradi va mijozga darhol ko‘rinadi, mijozlar va ularning yuklari, harakatlar tarixi, rollar: menejer marjani ko‘rmaydi", who: "Greenwell namunasidagidek" } },
  { id: "track", price: 350, star: true,
    ru: { t: "Отслеживание груза по номеру", e: "Клиент вводит номер накладной и видит, где груз: склад, вылет, граница, таможня, выдача. Меньше звонков «где мой груз»", who: "есть у Meest, MK Express, iPost" },
    uz: { t: "Yukni raqam bo‘yicha kuzatish", e: "Mijoz yuk xati raqamini kiritadi va yuk qayerdaligini ko‘radi: ombor, uchish, chegara, bojxona, topshirish. «Yukim qayerda» qo‘ng‘iroqlari kamayadi", who: "Meest, MK Express, iPost’da bor" } },
  { id: "cab", price: 400, star: true,
    ru: { t: "Кабинет клиента: заявки, документы, счета", e: "Компания-клиент видит свои грузы, скачивает инвойсы, ГТД и акты, повторяет прошлую заявку в один шаг", who: "у экспедиторов Ташкента редкость" },
    uz: { t: "Mijoz kabineti: arizalar, hujjatlar, hisoblar", e: "Mijoz kompaniya o‘z yuklarini ko‘radi, invoys, BYuD va dalolatnomalarni yuklab oladi, oldingi arizani bir qadamda takrorlaydi", who: "Toshkent ekspeditorlarida kam uchraydi" } },
  { id: "bot", price: 300,
    ru: { t: "Telegram-бот: расчёт и статус груза", e: "Тот же калькулятор в Telegram, заявка в два касания и сообщение «груз прошёл таможню»", who: "боты есть у карго из Китая" },
    uz: { t: "Telegram-bot: hisob va yuk holati", e: "Telegramda xuddi shu kalkulyator, ikki bosishda ariza va «yuk bojxonadan o‘tdi» xabari", who: "Xitoydan kargolarda botlar bor" } },
  { id: "docs", price: 200,
    ru: { t: "Подсказка по документам для таможни", e: "Клиент выбирает, что везёт, и видит список документов: инвойс, упаковочный лист, сертификат происхождения, разрешения", who: "на сайтах экспедиторов не нашли" },
    uz: { t: "Bojxona hujjatlari bo‘yicha maslahat", e: "Mijoz nima olib kelishini tanlaydi va hujjatlar ro‘yxatini ko‘radi: invoys, qadoqlash varaqasi, kelib chiqish sertifikati, ruxsatnomalar", who: "ekspeditorlar saytlarida topilmadi" } },
  { id: "fx", price: 150,
    ru: { t: "Счёт в UZS, USD, EUR, AED по курсу ЦБ", e: "Ваши четыре валюты расчёта: калькулятор и счёт пересчитываются по курсу ЦБ на день, курс подтягивается сам", who: "расчёты в 4 валютах: ваше отличие" },
    uz: { t: "MB kursi bo‘yicha UZS, USD, EUR, AED’da hisob", e: "To‘rtta hisob-kitob valyutangiz: kalkulyator va hisob kunlik MB kursi bo‘yicha qayta hisoblanadi, kurs o‘zi olinadi", who: "4 valyutada hisob: sizning farqingiz" } },
  { id: "seo", price: 150,
    ru: { t: "Страницы направлений «Карго из Китая», «из Турции»", e: "Пять страниц под запросы клиентов на двух языках: сроки, виды транспорта, расчёт и заявка на каждой", who: "у Meest и MK Express страницы по направлениям" },
    uz: { t: "«Xitoydan kargo», «Turkiyadan» yo‘nalish sahifalari", e: "Mijozlar so‘rovlari uchun ikki tilda beshta sahifa: muddatlar, transport turlari, hisob va ariza har birida", who: "Meest va MK Express’da yo‘nalishlar sahifalari" } },
];

export const ALL = BASE.promo + ADDONS.reduce((s, a) => s + a.price, 0);

/* Отдельный модуль, вне правила «сайт 1 000 $, с допами до 3 000 $».
   Владелец DevUz, 31.10.2026: «еще 1 вид админки… распределение на машины в
   зависимости от типа, веса и объема товара, отслеживание водителей и тд. За
   такое укажи рыночную стоимость и скажи, что мы это уже делали для Cargo Go».
   Цена рыночная, середина вилки СНГ (SOURCES.md, «Диспетчерская»): система
   с GPS и водителями 8 000-20 000+ $, в Европе планирование, приложение
   водителя и кабинет клиента 40 000-70 000 €. Cargo GO: рабочее название
   грузового приложения LBM (бриф LBM от 08.06.2026). */
export const MODULES = [
  { id: "tms", price: 12000, star: true,
    market: { ru: "по рынку 8 000-20 000 $ в СНГ, 40 000-70 000 € в Европе", uz: "bozorda MDHda 8 000-20 000 $, Yevropada 40 000-70 000 €" },
    ru: { t: "Диспетчерская: распределение грузов по машинам и водители на карте", e: "Грузы сами раскладываются по машинам по типу кузова, весу и объёму, водители видны на карте с остановками и опозданиями, статус рейса сразу виден клиенту на сайте, выбор перевозчика по рейтингу и цене, документы водителей со сроками, роли и история", who: "Мы уже делали это для Cargo GO (LBM): отслеживание водителя на карте, выбор водителя по рейтингу и цене, приложение водителя в App Store и Google Play" },
    uz: { t: "Dispetcherlik: yuklarni mashinalarga taqsimlash va xaritada haydovchilar", e: "Yuklar kuzov turi, og‘irlik va hajm bo‘yicha mashinalarga o‘zi taqsimlanadi, haydovchilar xaritada to‘xtash va kechikishlar bilan ko‘rinadi, reys holati mijozga saytda darhol ko‘rinadi, tashuvchini reyting va narx bo‘yicha tanlash, haydovchi hujjatlari muddatlari bilan, rollar va tarix", who: "Biz buni Cargo GO (LBM) uchun allaqachon qilganmiz: haydovchini xaritada kuzatish, haydovchini reyting va narx bo‘yicha tanlash, App Store va Google Play’da haydovchi ilovasi" } },
];
export const ALL_MODULES = ALL + MODULES.reduce((s, m) => s + m.price, 0);
