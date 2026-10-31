// Конструктор цены макета Optimal Prime: сайт и допы тумблерами.
//
// Задание владельца DevUz, 31.10.2026: «Стоимость для клиента без допников
// 1000$, с допами не более 3000$. Поставь в допы то, что клиенту реально
// нужно будет». Образец — osonapteka/plan.mjs: тумблер включает и
// выключает настоящий блок на сайте (data-addon="<id>"), итог — сразу.
//
// Обычная цена — 3 900 $: корпоративный сайт на двух языках с
// конструктором тарифов, залётом в бренд и страницами услуг у студий
// Ташкента — 40-50 млн сум (docs/research/optimalprime.md, «Цены»).
// Допы — то, чего у бухгалтерской фирмы нет и что у неё просят клиенты
// (разбор там же): кабинет с документами и сроками, налоговый календарь в
// Telegram, первичка с телефона, панель заявок и клиентов, бот с расчётом.
// Все допы вместе — 2 000 $, сайт с допами — 3 000 $.

export const BASE = {
  price: 3900,
  promo: 1000,
  ru: {
    t: "Сайт Optimal Prime",
    d: "Новый облик на русском и узбекском, сначала под телефон: залёт в ваш знак, четыре направления услуг, конструктор тарифа по вашим ценам с режимом налогов и ползунками, тайна зарплат, отрасли, шесть шагов работы, клиенты бегущей строкой, связь в Telegram с готовым текстом.",
  },
  uz: {
    t: "Optimal Prime sayti",
    d: "Rus va o‘zbek tilida yangi ko‘rinish, avvalo telefon uchun: belgingizga uchib kirish, to‘rt xizmat yo‘nalishi, soliq rejimi va slayderlar bilan narxlaringiz bo‘yicha tarif konstruktori, maosh siri, sohalar, ishning olti qadami, mijozlar yuguruvchi qatorda, tayyor matn bilan Telegramda aloqa.",
  },
};

/** Акция: 48 часов с первого открытия макета на этом устройстве. */
export const OFFER_HOURS = 48;

/* who — у кого на рынке это уже есть (docs/research/optimalprime.md). */
export const ADDONS = [
  { id: "cab", price: 450, star: true,
    ru: { t: "Кабинет клиента: документы и сроки", e: "Клиент видит, какие отчёты сданы и какие в работе, ближайшие сроки, акты и счета, а бухгалтер не отвечает на «а что с отчётом?»", who: "на сайтах фирм Ташкента не нашли, у сервисов России есть" },
    uz: { t: "Mijoz kabineti: hujjatlar va muddatlar", e: "Mijoz qaysi hisobotlar topshirilgani va qaysilari ishda ekanini, yaqin muddatlar, dalolatnoma va hisoblarni ko‘radi, buxgalter «hisobot nima bo‘ldi?» savoliga javob bermaydi", who: "Toshkent firmalari saytlarida topilmadi, Rossiya servislarida bor" } },
  { id: "upload", price: 200,
    ru: { t: "Первичка с телефона", e: "Счёт, накладную, чек можно сфотографировать и отправить из кабинета, документ ложится в папку месяца у бухгалтера", who: "у сайтов фирм Ташкента нет, только почта и Telegram" },
    uz: { t: "Telefondan birlamchi hujjatlar", e: "Hisob, yuk xati, chekni suratga olib kabinetdan yuborish mumkin, hujjat buxgalterda oy papkasiga tushadi", who: "Toshkent firmalari saytlarida yo‘q, faqat pochta va Telegram" } },
  { id: "remind", price: 250, star: true,
    ru: { t: "Налоговый календарь и напоминания в Telegram", e: "Сроки отчётов и платежей по режиму клиента: за три дня и в день срока приходит сообщение, что подготовить и что оплатить", who: "календарь сроков есть у налоговой, личных напоминаний нет ни у кого" },
    uz: { t: "Soliq kalendari va Telegramda eslatmalar", e: "Mijoz rejimi bo‘yicha hisobot va to‘lov muddatlari: uch kun oldin va muddat kuni nima tayyorlash va nima to‘lash haqida xabar keladi", who: "muddatlar kalendari soliq idorasida bor, shaxsiy eslatma hech kimda yo‘q" } },
  { id: "admin", price: 400, star: true,
    ru: { t: "Панель заявок и клиентов", e: "Заявки с сайта и расчёты конструктора первой строкой, статус виден клиенту, клиенты на обслуживании, сроки отчётов, история, роли: менеджер не видит выручку", who: "как в эталоне Greenwell" },
    uz: { t: "Arizalar va mijozlar paneli", e: "Saytdan arizalar va konstruktor hisoblari birinchi qatorda, holati mijozga ko‘rinadi, xizmatdagi mijozlar, hisobot muddatlari, tarix, rollar: menejer tushumni ko‘rmaydi", who: "Greenwell namunasidagidek" } },
  { id: "bot", price: 250,
    ru: { t: "Бот @optimal_prime_uz: расчёт и заявка", e: "Те же вопросы, что в конструкторе, прямо в Telegram: режим, операции, сотрудники, и сумма с заявкой менеджеру", who: "у фирм Ташкента бота с расчётом не нашли" },
    uz: { t: "@optimal_prime_uz boti: hisob va ariza", e: "Konstruktordagi savollar to‘g‘ridan-to‘g‘ri Telegramda: rejim, operatsiyalar, xodimlar, summa va menejerga ariza", who: "Toshkent firmalarida hisoblovchi bot topilmadi" } },
  { id: "staff", price: 150,
    ru: { t: "Сравнение: бухгалтер в штате или вы", e: "Клиент вписывает зарплату своего бухгалтера, сайт добавляет налог на фонд оплаты и рабочее место и ставит рядом ваш тариф", who: "у FinTax семь доводов против штатного бухгалтера, но без цифр клиента" },
    uz: { t: "Taqqoslash: shtatdagi buxgalter yoki siz", e: "Mijoz buxgalteri maoshini yozadi, sayt ish haqi fondiga soliq va ish joyini qo‘shadi va yoniga tarifingizni qo‘yadi", who: "FinTax’da shtat buxgalteriga qarshi yetti dalil, lekin mijoz raqamlarisiz" } },
  { id: "check", price: 150,
    ru: { t: "Проверка учёта за 2 минуты", e: "Семь вопросов о том, как ведётся учёт сейчас. В конце список рисков словами и запись на первичную оценку", who: "у AAA Fin «подозреваете ошибки?» без проверки" },
    uz: { t: "2 daqiqada hisobni tekshirish", e: "Hisob hozir qanday yuritilishi haqida yetti savol. Oxirida xavflar ro‘yxati so‘z bilan va dastlabki baholashga yozilish", who: "AAA Fin’da tekshiruvsiz «xato bormi?»" } },
  { id: "kb", price: 150,
    ru: { t: "Разделы под запросы и 6 статей", e: "Страницы «бухгалтерский аутсорсинг Ташкент», «ЕЭИСВО регистрация контракта», «расчёт зарплаты» на двух языках, чтобы клиент находил вас в поиске", who: "у AAA Fin страница под каждую услугу, у вас одна страница" },
    uz: { t: "So‘rovlar uchun bo‘limlar va 6 ta maqola", e: "«Toshkentda buxgalteriya autsorsing», «EEAXAT shartnoma ro‘yxati», «ish haqi hisobi» sahifalari ikki tilda, mijoz sizni qidiruvda topishi uchun", who: "AAA Fin’da har bir xizmatga sahifa, sizda bitta sahifa" } },
];

export const ALL = BASE.promo + ADDONS.reduce((s, a) => s + a.price, 0);
