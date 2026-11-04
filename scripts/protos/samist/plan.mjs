// Конструктор цены макета SAMIST AUTO: сайт и десять допов тумблерами.
//
// Задание владельца DevUz, 04.11.2026: «Сайт 1000$, с допами +2500$, допов
// сделай 10 штук». Тумблер включает и выключает настоящий блок на сайте
// (data-addon="<id>"), итог считается сразу.
//
// Обычная цена — 3 900 $: каталог техники на двух языках с карточками
// моделей, сценой по прокрутке, фильтрами и формами заявок у студий Ташкента
// — 40-50 млн сум (как у Optimal Prime, docs/research/samist.md, «Цены»).
// Допы — то, что у дилера грузовиков просят покупатели и чего на их витрине
// autoline нет: подбор под задачу, сравнение, кредит с расчётом, трейд-ин,
// тест-драйв, сервис и запчасти, панель заявок и наличия, бот, КП для
// автопарков, страницы моделей под поиск. Все вместе — 2 500 $, сайт с
// допами — 3 500 $.

export const BASE = {
  price: 3900,
  promo: 1000,
  weeks: [3, 4],
  ru: {
    t: "Сайт SAMIST AUTO",
    d: "Новый сайт на русском и узбекском, сначала под телефон: залёт в ваш знак, сцена по прокрутке из ваших фото, вся техника с площадки с ценами в сумах и долларах, фильтр по вашим разделам, карточка модели с фото и характеристиками, бренды, о компании, контакты, звонок и сообщение с готовым текстом.",
  },
  uz: {
    t: "SAMIST AUTO sayti",
    d: "Rus va o‘zbek tilida yangi sayt, avvalo telefon uchun: belgingizga uchib kirish, suratlaringizdan aylantirishdagi sahna, maydondagi barcha texnika so‘m va dollardagi narxlari bilan, bo‘limlaringiz bo‘yicha filtr, surat va xususiyatlar bilan model kartochkasi, brendlar, kompaniya haqida, aloqa, tayyor matn bilan qo‘ng‘iroq va xabar.",
  },
};

/** Акция: 48 часов с первого открытия макета на этом устройстве. */
export const OFFER_HOURS = 48;

/* who — у кого на рынке это уже есть или чего нет (docs/research/samist.md). */
export const ADDONS = [
  { id: "admin", price: 550, star: true,
    ru: { t: "Панель заявок и наличия", e: "Заявки с сайта первой строкой, статус виден покупателю, наличие и цены правятся в панели и сразу меняются на сайте, роли: менеджер не видит выручку, история действий, выгрузки", who: "как в эталонах Greenwell и Cargo Pro" },
    uz: { t: "Arizalar va mavjudlik paneli", e: "Saytdan arizalar birinchi qatorda, holati xaridorga ko‘rinadi, mavjudlik va narxlar panelda o‘zgartiriladi va saytda darhol yangilanadi, rollar: menejer tushumni ko‘rmaydi, harakatlar tarixi, yuklab olish", who: "Greenwell va Cargo Pro namunalaridagidek" } },
  { id: "credit", price: 300, star: true,
    ru: { t: "Калькулятор кредита и лизинга", e: "Покупатель выбирает модель, взнос и срок, вписывает ставку банка и видит платёж в месяц; расчёт уходит вам заявкой", who: "у дилеров Ташкента чаще «есть кредит» без расчёта" },
    uz: { t: "Kredit va lizing kalkulyatori", e: "Xaridor modelni, boshlang‘ich to‘lovni va muddatni tanlaydi, bank stavkasini yozadi va oylik to‘lovni ko‘radi; hisob sizga ariza bo‘lib keladi", who: "Toshkent dilerlarida ko‘pincha hisobsiz «kredit bor»" } },
  { id: "tgbot", price: 350, star: true,
    ru: { t: "Telegram-бот: наличие, цены, заявка", e: "Покупатель пишет «фургон до 5 тонн», бот показывает модели с площадки с ценой и фото и передаёт заявку менеджеру в панель", who: "у дилеров грузовиков Ташкента бота с наличием не нашли" },
    uz: { t: "Telegram-bot: mavjudlik, narxlar, ariza", e: "Xaridor «5 tonnagacha furgon» deb yozadi, bot maydondagi modellarni narxi va surati bilan ko‘rsatadi va arizani paneldagi menejerga uzatadi", who: "Toshkentdagi yuk mashinasi dilerlarida mavjudlikni ko‘rsatadigan bot topilmadi" } },
  { id: "pick", price: 200,
    ru: { t: "Подбор техники под задачу", e: "Четыре вопроса: что возите, сколько тонн, где ездите, бюджет. В ответ три модели с вашей площадки и почему они", who: "у SamAuto есть подбор, у дилерских витрин нет" },
    uz: { t: "Vazifaga qarab texnika tanlash", e: "To‘rt savol: nima tashiysiz, necha tonna, qayerda yurasiz, byudjet. Javobda maydoningizdan uchta model va nima uchun aynan ular", who: "SamAuto’da tanlash bor, diler vitrinalarida yo‘q" } },
  { id: "compare", price: 150,
    ru: { t: "Сравнение до трёх моделей", e: "Покупатель ставит рядом две-три машины: цена, мощность, грузоподъёмность, объём кузова, строки с разницей подсвечены", who: "на autoline сравнения нет" },
    uz: { t: "Uchtagacha modelni taqqoslash", e: "Xaridor ikki-uchta mashinani yonma-yon qo‘yadi: narx, quvvat, yuk ko‘tarish, kuzov hajmi, farqli qatorlar ajratilgan", who: "autoline’da taqqoslash yo‘q" } },
  { id: "trade", price: 200,
    ru: { t: "Трейд-ин: оценка вашей техники", e: "Марка, год, пробег и фото старой машины в одной форме; заявка падает менеджеру, сумма доплаты считается в панели", who: "у дилеров Ташкента обмен «по звонку»" },
    uz: { t: "Treyd-in: texnikangizni baholash", e: "Eski mashinaning markasi, yili, yurgani va surati bitta formada; ariza menejerga tushadi, qo‘shimcha to‘lov panelda hisoblanadi", who: "Toshkent dilerlarida almashtirish «qo‘ng‘iroq bo‘yicha»" } },
  { id: "drive", price: 150,
    ru: { t: "Тест-драйв и показ на площадке", e: "Покупатель выбирает модель, день и время приезда на кольцевую, 120А; менеджер подтверждает в панели, покупатель видит статус", who: "запись на тест-драйв есть у легковых дилеров, у грузовых редко" },
    uz: { t: "Test-drayv va maydonda ko‘rish", e: "Xaridor modelni, aylanma yo‘l, 120A ga kelish kuni va vaqtini tanlaydi; menejer panelda tasdiqlaydi, xaridor holatni ko‘radi", who: "test-drayvga yozilish yengil avtomobil dilerlarida bor, yuk dilerlarida kam" } },
  { id: "service", price: 250,
    ru: { t: "Запись в сервис и запчасти по VIN", e: "Вы пишете, что даёте оригинальные запчасти ISUZU и сервис: на сайте запись на обслуживание и запрос детали по VIN, всё в панель", who: "у SamAuto сервис и запчасти отдельным разделом" },
    uz: { t: "Servisga yozilish va VIN bo‘yicha ehtiyot qismlar", e: "ISUZU original ehtiyot qismlari va servisini berishingizni yozasiz: saytda xizmatga yozilish va VIN bo‘yicha qism so‘rovi, hammasi panelga", who: "SamAuto’da servis va ehtiyot qismlar alohida bo‘lim" } },
  { id: "fleet", price: 200,
    ru: { t: "КП для автопарков файлом", e: "Компания набирает несколько машин, сайт собирает коммерческое предложение на вашем бланке и отдаёт файлом для печати или PDF, заявка в панель", who: "КП у дилеров отправляют вручную, с задержкой" },
    uz: { t: "Avtoparklar uchun tijorat taklifi fayl bilan", e: "Kompaniya bir nechta mashinani tanlaydi, sayt blankingizda tijorat taklifini yig‘ib chop etish yoki PDF uchun fayl qilib beradi, ariza panelga", who: "dilerlarda tijorat taklifini qo‘lda, kechikib yuborishadi" } },
  { id: "seo", price: 150,
    ru: { t: "Страницы моделей под поиск", e: "Своя страница у каждой модели и раздела на двух языках: «Isuzu NPR 75K цена Ташкент», «бетономешалка FAW купить», чтобы вас находили в поиске, а не витрину площадки", who: "сейчас ваш сайт закрыт от поиска (noindex на autoline)" },
    uz: { t: "Qidiruv uchun model sahifalari", e: "Har bir model va bo‘limning ikki tilda o‘z sahifasi: «Isuzu NPR 75K narxi Toshkent», «FAW betonaralashtirgich sotib olish», sizni maydon vitrinasini emas, sizni qidiruvda topishlari uchun", who: "hozir saytingiz qidiruvdan yopiq (autoline’da noindex)" } },
];

export const ALL = BASE.promo + ADDONS.reduce((s, a) => s + a.price, 0);
