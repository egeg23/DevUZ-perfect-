// Конструктор цены — как у MAVERA и bloger.agency: плашка «Конструктор» на
// каждой странице прототипа, тумблер включает и выключает настоящий блок на
// странице, итог «сайт + допы» считается сразу. То, чего на макете нет
// (админка, напоминания, съёмка), — группа «Сверх сайта» на странице «Что
// дальше».
//
// Сайт — 1 000 $ (решение владельца, 07.10.2026). «Сайт как приложение» —
// 150 $ (он же). Остальное — от ставок калькулятора студии
// (content/calculator.ts) по 12 650 сум за доллар, сдвинутых вниз, к
// середине вилки Ташкента для небольшого сервиса — денег у клиента немного:
//   уведомления 4,5 млн (356 $) → «Заказы в Telegram» 120 $: одна заявка в
//     один чат, без кабинета. Внедрение CRM в Ташкенте — от 500 $ плюс
//     подписка; бот-уведомление у фрилансеров — 100–200 $;
//   базовая админка 5,5 млн (435 $) → 300 $: цены, услуги и фото, без ролей;
//   SEO 4,5 млн (356 $) → 250 $: страницы под восемь услуг;
//   язык — 150 $ на сайт из пяти страниц (у bloger.agency, где страниц
//     вдвое больше, — 300 $);
//   эффекты витрины — по ставкам bloger.agency, сдвинутым вниз.

/** Сайт: главная, услуги, запись, контакты, русский язык. */
export const BASE = {
  price: 1000,
  ru: {
    t: "Сайт: главная, услуги, запись, контакты",
    d: "Восемь ваших услуг, запись с выбором дня и времени, телефоны в одно касание, адрес с ориентиром. Сначала — под телефон.",
  },
  uz: {
    t: "Sayt: bosh sahifa, xizmatlar, yozilish, kontaktlar",
    d: "Sakkizta xizmatingiz, kun va vaqtni tanlab yozilish, bir bosishda telefon, mo‘ljali bilan manzil. Avvalo — telefon uchun.",
  },
};

/**
 * Блоки, которые видно на макете. `where` — ключ страницы (как в адресе:
 * "" — главная) или "all". На странице блок помечен data-addon="<id>";
 * выключили — его нет.
 */
export const ADDONS = [
  { id: "tg", where: "zapis", price: 120, star: true, ru: { t: "Заказы в Telegram", e: "Заявка с сайта сразу приходит мастеру-приёмщику в Telegram — дешёвый вход вместо CRM" }, uz: { t: "Buyurtmalar Telegramga", e: "Saytdagi ariza darhol usta-qabulchiga Telegramga keladi — CRM o‘rniga arzon yo‘l" } },
  { id: "pwa", where: "all", price: 150, star: true, ru: { t: "Сайт как приложение", e: "Иконка на экране телефона, открывается без строки браузера, нижнее меню, адрес и телефоны без интернета" }, uz: { t: "Sayt ilova kabi", e: "Telefon ekranida belgi, brauzer satrisiz ochiladi, pastki menyu, internetsiz manzil va telefonlar" } },
  { id: "hero", where: "", price: 250, ru: { t: "Пролёт по цеху: BMW съезжает с подъёмника", e: "Фото по слоям: камера заходит в цех, подъёмник опускается, машина уезжает" }, uz: { t: "Sex bo‘ylab parvoz: BMW ko‘targichdan tushadi", e: "Qatlamli foto: kamera sexga kiradi, ko‘targich tushadi, mashina chiqib ketadi" } },
  { id: "oil", where: "", price: 80, ru: { t: "Масло льётся по прокрутке", e: "Струя из фото наполняет горловину, пока листаете" }, uz: { t: "Moy aylantirganda quyiladi", e: "Fotodagi oqim sahifani surganingizda bo‘yinni to‘ldiradi" } },
  { id: "prices", where: "", price: 50, ru: { t: "Место под прайс «от …»", e: "Цены по группам работ — вписываете свои" }, uz: { t: "«…dan» narxlar uchun joy", e: "Ish turlari bo‘yicha narxlar — o‘zingiznikini yozasiz" } },
  { id: "route", where: "kontakty", price: 30, ru: { t: "Маршрут в Яндекс и Google Картах", e: "Кнопки «Как доехать» и «Открыто сейчас» по вашим часам" }, uz: { t: "Yandex va Google Xaritalarda yo‘nalish", e: "«Qanday borish» tugmalari va ish vaqtingiz bo‘yicha «Hozir ochiq»" } },
  { id: "motion", where: "all", price: 70, ru: { t: "Своё движение у каждой услуги", e: "Двигатель опускается, шов вспыхивает, колесо наезжает" }, uz: { t: "Har bir xizmatning o‘z harakati", e: "Dvigatel tushadi, chok chaqnaydi, g‘ildirak yaqinlashadi" } },
  { id: "uz", where: "all", price: 150, ru: { t: "Узбекская версия", e: "Переключатель RU / UZ, все страницы на двух языках" }, uz: { t: "O‘zbekcha versiya", e: "RU / UZ almashtirgich, barcha sahifalar ikki tilda" } },
];

export const GROUPS = {
  clients: { ru: "Клиентам", uz: "Mijozlarga" },
  team: { ru: "Вам", uz: "Sizga" },
};

/**
 * Сверх сайта: блока на макете нет, на странице «Что дальше» — превью.
 * `needs` — без чего не работает: включается вместе с ним.
 */
export const BLOCKS = [
  {
    id: "status", group: "clients", price: 200, pv: "status", needs: ["tg"],
    ru: { t: "«Машина готова» — клиенту в Telegram", why: "Мастер-приёмщик нажимает одну кнопку — клиенту приходит, что машину можно забирать. Не нужно обзванивать каждого вечером.", li: ["Принята · в работе · ждём деталь · готова", "Одна кнопка у мастера", "Клиент видит, что о нём помнят"] },
    uz: { t: "«Mashina tayyor» — mijozga Telegramda", why: "Usta-qabulchi bitta tugmani bosadi — mijozga mashinani olib ketish mumkinligi haqida xabar keladi. Kechqurun har kimga qo‘ng‘iroq qilish shart emas.", li: ["Qabul qilindi · ishda · detal kutilmoqda · tayyor", "Ustada bitta tugma", "Mijoz o‘zini eslab qolishlarini ko‘radi"] },
  },
  {
    id: "remind", group: "clients", price: 250, pv: "remind", needs: ["tg"],
    ru: { t: "Напоминание о ТО через полгода", why: "Клиент записывался — через срок, который вы зададите, бот сам напоминает о следующем визите. Постоянные клиенты возвращаются без рекламы.", li: ["Срок задаёте сами", "Запись из напоминания — в одно касание", "Без рассылок всем подряд"] },
    uz: { t: "Yarim yildan keyin TXK eslatmasi", why: "Mijoz yozilgan edi — siz belgilagan muddatdan keyin bot keyingi tashrifni o‘zi eslatadi. Doimiy mijozlar reklamasiz qaytadi.", li: ["Muddatni o‘zingiz belgilaysiz", "Eslatmadan yozilish — bir bosishda", "Hammaga ommaviy xabarlarsiz"] },
  },
  {
    id: "reviews", group: "clients", price: 100, pv: "reviews", needs: [],
    ru: { t: "Отзывы с карт на сайте", why: "На прежнем сайте отзывов не было. Отзывы ваших клиентов с Яндекс и Google Карт показываются на главной — сами, без копирования.", li: ["Оценка и последние отзывы", "Ссылка «оставить отзыв»", "Обновляются сами"] },
    uz: { t: "Xaritalardagi sharhlar saytda", why: "Avvalgi saytda sharhlar yo‘q edi. Mijozlaringizning Yandex va Google Xaritalardagi sharhlari bosh sahifada o‘zi ko‘rinadi, nusxalashsiz.", li: ["Baho va so‘nggi sharhlar", "«Sharh qoldirish» havolasi", "O‘zi yangilanadi"] },
  },
  {
    id: "admin", group: "team", price: 300, pv: "admin", needs: [],
    ru: { t: "Админка: цены, услуги, фото", why: "Цены и услуги меняете сами с телефона — без программиста и без звонка нам. Прайс на сайте всегда тот, что у мастера-приёмщика.", li: ["Цены «от …» по группам", "Услуги и фото работ", "Часы работы и выходные"] },
    uz: { t: "Admin panel: narxlar, xizmatlar, foto", why: "Narx va xizmatlarni telefondan o‘zingiz o‘zgartirasiz — dasturchisiz va bizga qo‘ng‘iroqsiz. Saytdagi narxlar doim usta-qabulchidagidek.", li: ["Guruhlar bo‘yicha «…dan» narxlar", "Xizmatlar va ish fotolari", "Ish vaqti va dam olish kunlari"] },
  },
  {
    id: "seo", group: "team", price: 250, pv: "seo", needs: [],
    ru: { t: "Страницы услуг под поиск", why: "Человек ищет «аргонная сварка Ташкент» или «ремонт двигателя Чиланзар» — у каждой из восьми услуг своя страница, которую находят Google и Яндекс.", li: ["Восемь страниц услуг", "Заголовки под живые запросы", "Карточка компании в поиске"] },
    uz: { t: "Qidiruv uchun xizmat sahifalari", why: "Odam «argon payvandlash Toshkent» yoki «dvigatel ta’miri Chilonzor» deb qidiradi — sakkizta xizmatning har birida Google va Yandex topadigan o‘z sahifasi bor.", li: ["Sakkizta xizmat sahifasi", "Jonli so‘rovlarga mos sarlavhalar", "Qidiruvdagi kompaniya kartochkasi"] },
  },
  {
    id: "photos", group: "team", price: 150, pv: "photos", needs: [],
    ru: { t: "Съёмка ваших работ и цеха", why: "Сейчас на сайте — открытые снимки чужих цехов: своих фото у вас не было. Фотограф снимает ваш цех, мастеров и машины — и они встают на место этих.", li: ["Цех и подъёмники", "Работы до и после", "Мастер-приёмщик и вход"] },
    uz: { t: "Ishlaringiz va sexingizni suratga olish", why: "Hozir saytda — boshqa sexlarning ochiq suratlari: sizda o‘z fotolaringiz yo‘q edi. Fotograf sexingizni, ustalarni va mashinalarni suratga oladi — ular shu suratlar o‘rniga qo‘yiladi.", li: ["Sex va ko‘targichlar", "Ishlar oldin va keyin", "Usta-qabulchi va kirish"] },
  },
];
