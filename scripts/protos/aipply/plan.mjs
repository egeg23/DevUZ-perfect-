// Конструктор цены, как у ПК Весты и ShahaR.Uz: плашка «Конструктор» на
// каждой странице прототипа, тумблер включает и выключает настоящий блок на
// странице, итог «сайт + допы» считается сразу. То, чего на макете нет
// (админка, бот, оплата, русская версия для поиска, CRM, страницы под
// поиск), — группа «Сверх сайта» на странице «Что дальше».
//
// Цены — по заданию владельца DevUz Studio, 08.10.2026: сайт без допов
// 1 300 $, все допы вместе не больше 1 700 $, итого не больше 3 000 $. Цены
// допов — середина рынка Узбекистана, обоснование в docs/research/aipply.md.
// Держит tests/proto-bundles.test.ts.

/** Сайт: главная, курс, запись на открытый урок, узбекский и русский. */
export const BASE = {
  price: 1300,
  uz: {
    t: "Sayt: bosh sahifa, kurs dasturi, ochiq darsga yozilish",
    d: "Kurs haqida, nimani o‘rganasiz, afzalliklar, joylashuv va ochiq darsga yozilish Telegramga. Avvalo telefon uchun qilamiz. O‘zbek va rus tilida.",
  },
  ru: {
    t: "Сайт: главная, программа курса, запись на открытый урок",
    d: "О курсе, что изучите, преимущества, как добраться и запись на открытый урок в Telegram. Делаем в первую очередь под телефон. На узбекском и русском.",
  },
};

/**
 * Блоки, которые видно на макете. `where` — ключ страницы ("" — главная) или
 * "all". На странице блок помечен data-addon="<id>"; выключили — его нет.
 */
export const ADDONS = [
  {
    id: "tg", where: "ochiq-dars", price: 90, star: true,
    uz: { t: "Ariza Telegramga: kun, vaqt, daraja", e: "Qaysi kun va vaqt qulay, kompyuter bormi, ism va telefon bitta xabar bo‘lib Telegramingizga tushadi" },
    ru: { t: "Заявка в Telegram: день, время, уровень", e: "Удобный день и время, есть ли компьютер, имя и телефон приходят вам в Telegram одним сообщением" },
  },
  {
    id: "intro", where: "", price: 80,
    uz: { t: "Logotip ichiga kirish", e: "Belgining uch chizig‘i yig‘iladi, kamera chiziqlar orasidagi tirqishdan birinchi ekranga uchib kiradi" },
    ru: { t: "Влёт в логотип", e: "Три полосы знака собираются, камера влетает в просвет между ними, на первый экран" },
  },
  {
    id: "story", where: "", price: 260,
    uz: { t: "«Kompyuter noldan»: kurs pastga surganda o‘ynaydi", e: "Noutbuk ochiladi, hujjat, jadval, brauzer, sun’iy intellekt va sertifikat birin-ketin chiqadi. Kod bilan chizilgan, rasmsiz" },
    ru: { t: "«Компьютер с нуля»: курс оживает при прокрутке", e: "Ноутбук открывается, по очереди выходят документ, таблица, браузер, ИИ и сертификат. Нарисовано кодом, без фото" },
  },
  {
    id: "test", where: "kurs", price: 130,
    uz: { t: "Darajangizni bilish testi", e: "Olti savol, natija va tavsiya. Javoblar ariza bilan Telegramga ketadi: administrator nimadan boshlashni biladi" },
    ru: { t: "Тест «Какой у вас уровень»", e: "Шесть вопросов, итог и совет. Ответы уходят в Telegram вместе с заявкой: администратор знает, с чего начать" },
  },
  {
    id: "glass", where: "all", price: 70,
    uz: { t: "Suyuq shisha va parallaks", e: "Kartochkalar orqasi xira va sinadi, chetida yaltiraydi, qatlamlar har xil tezlikda suriladi" },
    ru: { t: "Жидкое стекло и параллакс", e: "За карточками размытие и преломление, блик по краю, слои уходят с разной скоростью" },
  },
  {
    id: "motion", where: "all", price: 50,
    uz: { t: "Har bir blokning o‘z harakati", e: "Ikonkalar orbitada, nur ramka bo‘ylab yuguradi, raqamlar sanaladi, oyna panel ichidan ochiladi" },
    ru: { t: "Своё движение у каждого блока", e: "Значки на орбитах, луч по рамке, числа катятся, окно разворачивается из панели" },
  },
];

export const GROUPS = {
  team: { uz: "Sizga", ru: "Вам" },
  site: { uz: "Qidiruv va to‘lov", ru: "Поиск и оплата" },
};

/**
 * Сверх сайта: блока на макете нет, на странице «Что дальше» — превью.
 * `needs` — без чего не работает: включается вместе с ним.
 */
export const BLOCKS = [
  {
    id: "admin", group: "team", price: 240, pv: "admin", needs: [], star: true,
    uz: { t: "Admin panel: guruhlar, jadval, arizalar", why: "Yangi guruh, dars vaqti va chegirmani telefondan o‘zingiz qo‘shasiz, dasturchisiz. Saytdan va Telegramdan kelgan arizalar bitta ro‘yxatda.", li: ["Guruhlar va dars jadvali", "Chegirma va aksiyalar", "Arizalar va kim javob berdi"] },
    ru: { t: "Админ-панель: группы, расписание, заявки", why: "Новую группу, время занятий и скидку добавляете с телефона сами, без программиста. Заявки с сайта и из Telegram в одном списке.", li: ["Группы и расписание", "Скидки и акции", "Заявки и кто ответил"] },
  },
  {
    id: "bot", group: "team", price: 210, pv: "bot", needs: ["tg"],
    uz: { t: "Telegram-bot: yozilish va eslatma", why: "Bot ochiq darsga yozadi, kun va vaqtni so‘raydi, dars oldidan eslatadi. Administrator faqat kelganlar bilan gaplashadi.", li: ["Ochiq darsga yozilish", "Dars oldidan eslatma", "Guruh boshlanishi haqida xabar"] },
    ru: { t: "Telegram-бот: запись и напоминание", why: "Бот записывает на открытый урок, спрашивает день и время, напоминает перед уроком. Администратор говорит уже с теми, кто пришёл.", li: ["Запись на открытый урок", "Напоминание перед уроком", "Сообщение о старте группы"] },
  },
  {
    id: "pay", group: "site", price: 170, pv: "pay", needs: [],
    uz: { t: "Click va Payme orqali to‘lov", why: "Kurs yoki birinchi oyni saytdan to‘lash mumkin. 20% chegirma ochiq darsdan keyin o‘zi hisoblanadi.", li: ["Click va Payme", "Chegirma o‘zi hisoblanadi", "To‘lov haqida xabar sizga"] },
    ru: { t: "Оплата через Click и Payme", why: "Курс или первый месяц можно оплатить на сайте. Скидка 20% после открытого урока считается сама.", li: ["Click и Payme", "Скидка считается сама", "Сообщение об оплате вам"] },
  },
  {
    id: "crm", group: "team", price: 130, pv: "crm", needs: ["tg"],
    uz: { t: "Arizalar AmoCRM’ga", why: "Har bir ariza kun, vaqt va daraja bilan bitim bo‘lib tushadi. Menejer kim qaysi sahifadan kelganini ko‘radi.", li: ["Bitim: kun, vaqt, daraja", "Manba: sahifa va reklama", "Menejerga eslatma"] },
    ru: { t: "Заявки в AmoCRM", why: "Каждая заявка падает сделкой с днём, временем и уровнем. Менеджер видит, с какой страницы пришёл человек.", li: ["Сделка: день, время, уровень", "Источник: страница и реклама", "Напоминание менеджеру"] },
  },
  {
    id: "seo", group: "site", price: 140, pv: "seo", needs: [],
    uz: { t: "Qidiruv uchun sahifalar", why: "Odam «kompyuter kursi Shayxontohur» yoki «Excel kursi Toshkent» deb qidiradi va qo‘shni markazga emas, sizning sahifangizga tushadi.", li: ["Kurs × tuman", "O‘zbek va rus tilida", "Google’dagi kompaniya kartochkasi"] },
    ru: { t: "Страницы под поиск", why: "Человек ищет «компьютерные курсы Шайхантахур» или «курсы Excel Ташкент» и попадает к вам, а не к соседнему центру.", li: ["Курс × район", "На узбекском и русском", "Карточка компании в Google"] },
  },
  {
    id: "blog", group: "site", price: 130, pv: "blog", needs: [],
    uz: { t: "Foydali maslahatlar bo‘limi", why: "Qisqa maqolalar va videolar: «sun’iy intellektga qanday savol berish», «faylni qanday saqlash». Qidiruvdan odam keltiradi va ochiq darsga olib boradi.", li: ["Maqola va video", "Har birida ochiq darsga tugma", "Admin paneldan qo‘shiladi"] },
    ru: { t: "Раздел полезных советов", why: "Короткие статьи и видео: «как задать вопрос ИИ», «как сохранить файл». Приводят людей из поиска и ведут на открытый урок.", li: ["Статьи и видео", "В каждой кнопка на открытый урок", "Добавляются из админки"] },
  },
];
