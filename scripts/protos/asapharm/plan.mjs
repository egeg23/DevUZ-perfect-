// Конструктор цены макета ASAPHARM Academy: лендинг и допы тумблерами.
//
// Задание владельца DevUz, 20.11.2026: «Можешь использовать наши эталонные
// решения, лендинг 500$; допы не дороже 1500$». Обычная цена лендинга —
// 1 700 $, как у Karomat и Greenwell на акции (цена лендинга по середине
// рынка студий Ташкента, docs/research/asapharm.md). Тумблер включает и
// выключает настоящий блок на странице (data-addon="<id>"), итог сразу.
// Все допы вместе — ровно 1 500 $ (держит tests/proto-bundles.test.ts).

export const BASE = {
  price: 1700,
  promo: 500,
  weeks: 3,
  ru: {
    t: "Лендинг ASAPHARM Academy",
    d: "Одна продающая страница на русском и узбекском, сначала под телефон: первый экран с преимуществами и записью на ближайший поток, «Кому полезно», курсы, команда, почему это важно, FAQ и заявка.",
  },
  uz: {
    t: "ASAPHARM Academy lendingi",
    d: "Rus va o‘zbek tilida bitta sotuvchi sahifa, avvalo telefon uchun: afzalliklar va eng yaqin oqimga yozilish bilan birinchi ekran, «Kimga foydali», kurslar, jamoa, nega bu muhim, savollar va ariza.",
  },
};

/** Акция: 48 часов с первого открытия макета на этом устройстве. */
export const OFFER_HOURS = 48;

/* who — у кого на рынке это уже есть (docs/research/asapharm.md). */
export const ADDONS = [
  { id: "zapis", price: 120, star: true,
    ru: { t: "Запись на поток: курс, формат, дата", e: "Форма знает ближайшие старты, заявка уходит администратору одним сообщением, слушатель видит статус своей заявки на сайте", who: "так записывают Bettr Academy и Future London Academy" },
    uz: { t: "Oqimga yozilish: kurs, format, sana", e: "Forma eng yaqin startlarni biladi, ariza administratorga bitta xabar bo‘lib ketadi, tinglovchi arizasi holatini saytda ko‘radi", who: "Bettr Academy va Future London Academy shunday yozadi" } },
  { id: "podbor", price: 150, star: true,
    ru: { t: "Подбор курса за три вопроса", e: "Кто вы, какой опыт, какой формат: страница сама советует базовый или продвинутый курс, ответы уходят вместе с заявкой", who: "Course Finder у Bettr Academy" },
    uz: { t: "Uch savolda kurs tanlash", e: "Kimsiz, tajribangiz qanday, qaysi format: sahifa o‘zi boshlang‘ich yoki professional kursni tavsiya qiladi, javoblar ariza bilan ketadi", who: "Bettr Academy’dagi Course Finder" } },
  { id: "dossier", price: 200,
    ru: { t: "«Путь досье» при прокрутке", e: "Листы досье складываются в папку, экспертиза ставит печать, выходит регистрационное удостоверение. На каждом шаге: чему научат на курсе", who: "у академий Узбекистана такого нет" },
    uz: { t: "Pastga surganda «Dosye yo‘li»", e: "Dosye varaqlari papkaga yig‘iladi, ekspertiza muhr bosadi, ro‘yxatdan o‘tish guvohnomasi chiqadi. Har qadamda kursda nimani o‘rgatishadi", who: "O‘zbekiston akademiyalarida bunday yo‘q" } },
  { id: "webinar", price: 120,
    ru: { t: "Вебинары: расписание и регистрация", e: "Даты и темы с отсчётом, прошедшие гаснут сами, регистрация в одно касание", who: "у вас сейчас карточками без расписания" },
    uz: { t: "Vebinarlar: jadval va ro‘yxatdan o‘tish", e: "Sana va mavzular sanoq bilan, o‘tganlari o‘zi o‘chadi, bir bosishda ro‘yxatdan o‘tish", who: "hozir sizda jadvalsiz kartochkalar" } },
  { id: "cert", price: 150,
    ru: { t: "Сертификат и проверка по номеру", e: "Образец документа на сайте и поле «Проверить сертификат»: работодатель вводит номер и видит, что выпускник учился у вас", who: "проверку по номеру дают крупные школы" },
    uz: { t: "Sertifikat va raqam bo‘yicha tekshirish", e: "Saytda hujjat namunasi va «Sertifikatni tekshirish» maydoni: ish beruvchi raqamni kiritadi va bitiruvchi sizda o‘qiganini ko‘radi", who: "raqam bo‘yicha tekshiruvni yirik maktablar beradi" } },
  { id: "otzyv", price: 90,
    ru: { t: "Отзывы выпускников с проверкой", e: "Лента отзывов, новый отзыв сначала видит администратор и решает, показывать ли", who: "лента отзывов у Bettr Academy" },
    uz: { t: "Tekshiriladigan bitiruvchilar fikrlari", e: "Fikrlar tasmasi, yangi fikrni avval administrator ko‘radi va ko‘rsatish yoki yo‘qligini hal qiladi", who: "Bettr Academy’dagi fikrlar tasmasi" } },
  { id: "admin", price: 350, star: true,
    ru: { t: "Панель: заявки, потоки, вебинары", e: "Заявки с сайта первой строкой, статус виден слушателю, места в потоках, регистрации на вебинары, роли и история действий", who: "по нашему эталону панели Greenwell" },
    uz: { t: "Panel: arizalar, oqimlar, vebinarlar", e: "Saytdan arizalar birinchi qatorda, holati tinglovchiga ko‘rinadi, oqimlardagi joylar, vebinarga yozilganlar, rollar va harakatlar tarixi", who: "Greenwell paneli namunamiz bo‘yicha" } },
  { id: "kabinet", price: 200,
    ru: { t: "Кабинет слушателя", e: "Расписание занятий, материалы курса, записи вебинаров и прогресс по модулям в одном месте", who: "у онлайн-школ СНГ это стандарт" },
    uz: { t: "Tinglovchi kabineti", e: "Dars jadvali, kurs materiallari, vebinar yozuvlari va modullar bo‘yicha natija bir joyda", who: "MDH onlayn maktablarida bu standart" } },
  { id: "pay", price: 120,
    ru: { t: "Оплата Payme и Click, частями", e: "Оплатить курс сразу после записи или двумя частями: при старте и в середине обучения", who: "Payme и Click у учебных центров Ташкента" },
    uz: { t: "Payme va Click orqali, bo‘lib to‘lash", e: "Kursni yozilgandan keyin darhol yoki ikki qismda to‘lash: boshlanishida va o‘qish o‘rtasida", who: "Toshkent o‘quv markazlarida Payme va Click" } },
];

export const ADDONS_MAX = 1500;
export const ALL = BASE.promo + ADDONS.reduce((s, a) => s + a.price, 0);
