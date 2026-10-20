// Факты «Жигули Рестобар» (Ташкент). Источники — SOURCES.md: их сайт
// jigulibar.uz (меню картинками, акции, телефон), Яндекс Карты (адрес, часы,
// Instagram, оценка), Telegram-канал @jiguli_bar. Ничего сверх этого.
//
// Сеть «Жигули» в СНГ: ни один источник не говорит о франшизе или связи с
// московским «Жигули» — общее только имя и советская тема. На странице о
// сети ни слова.

export const BRAND = {
  name: "Жигули Рестобар",
  nameUz: "Jiguli Restobar",
  site: "http://jigulibar.uz",
  phone: "99 827 10 03",
  phoneRaw: "+998998271003",
  delivery: "90 346 10 03",
  deliveryRaw: "+998903461003",
  ig: "https://instagram.com/jiguli.bar",
  igName: "@jiguli.bar",
  tg: "https://t.me/jiguli_bar",
  map: "https://yandex.uz/maps/org/zhiguli_bar/109263748981/",
  route: "https://yandex.uz/maps/?rtext=~41.311844%2C69.316949&rtt=auto",
  geo: [41.311844, 69.316949],
  /* Яндекс Карты, 20.10.2026. */
  rating: "5,0",
  votes: "10 006",
  ru: {
    street: "ул. Султанали Машхади, 74",
    district: "Яшнабадский район",
    near: "Рядом гостиница «Карат» и БЦ T-Tower, метро «Пушкинская»",
    hours: "Каждый день 12:00-02:00",
  },
  uz: {
    street: "Sultonali Mashhadiy ko‘chasi, 74",
    district: "Yashnobod tumani",
    near: "Yonida «Karat» mehmonxonasi va T-Tower BM, «Pushkin» metrosi",
    hours: "Har kuni 12:00-02:00",
  },
  /* С обложки их меню: «Обслуживание 0%, со своим алкоголем 30%». */
  service: 0,
  corkage: 30,
};

/* Две позиции напитков и две блюда — сцены «замороженного мгновения». Цены и
   объёмы — с их меню (menu-src.json, страницы jigulibar.uz/menu и /menubar). */
export const HEROES = [
  {
    id: "beer", fx: "drops", img: "m-beer",
    price: "34 000", unit: { ru: "0,5 л", uz: "0,5 l" }, more: { ru: "0,3 л · 26 000", uz: "0,3 l · 26 000" },
    ru: { kick: "Разливное", t: "Жатецкое живое", d: "Живое, прямо из крана. Фильтрованное или нет: выбираете вы, наливает бармен." },
    uz: { kick: "Quyma pivo", t: "Jatetskoe jivoe", d: "Tirik pivo, to‘g‘ri krandan. Filtrlangan yoki yo‘q: siz tanlaysiz, barmen quyadi." },
    alt: { ru: "Бокал разливного пива с застывшей в воздухе пеной и брызгами на деревянном столе", uz: "Yog‘och stoldagi bir qadah quyma pivo, havoda qotib qolgan ko‘pik va tomchilar" },
  },
  {
    id: "sour", fx: "ice", img: "m-sour",
    price: "100 000", unit: { ru: "коктейль", uz: "kokteyl" },
    ru: { kick: "Коктейль бара", t: "Sarti Sour", d: "Бархатная пена, цветок сверху, лёд. На фото он замер в воздухе, у вас в бокале будет на месте." },
    uz: { kick: "Bar kokteyli", t: "Sarti Sour", d: "Baxmal ko‘pik, ustida gul, muz. Rasmda u havoda qotib qolgan, sizning qadahingizda joyida bo‘ladi." },
    alt: { ru: "Коктейль Sarti Sour с застывшим всплеском и кубиками льда в воздухе на зелёном столе", uz: "Sarti Sour kokteyli, havoda qotgan to‘lqin va muz bo‘laklari, yashil stol ustida" },
  },
  {
    id: "raki", fx: "steam", img: "m-raki",
    price: "350 000", unit: { ru: "500 г", uz: "500 g" }, more: { ru: "1 кг · 650 000", uz: "1 kg · 650 000" },
    ru: { kick: "К пиву", t: "Раки к пиву", d: "Варёные в пиве, с укропом и лимоном. Горячие: пар идёт, пока вы фотографируете." },
    uz: { kick: "Pivoga", t: "Pivoga qisqichbaqa", d: "Pivoda qaynatilgan, ukrop va limon bilan. Issiq: siz suratga olguncha bug‘ chiqib turadi." },
    alt: { ru: "Красные раки в стеклянной чаше, один рак в воздухе, пар и брызги лимона", uz: "Shisha idishdagi qizil qisqichbaqalar, biri havoda, bug‘ va limon tomchilari" },
  },
  {
    id: "lamb", fx: "steam", img: "m-lamb",
    price: "675 000", unit: { ru: "900 г", uz: "900 g" },
    ru: { kick: "Горячее", t: "Баранья лопатка", d: "На чугуне, в глазури и кунжуте. Шипит так, что соседний стол оборачивается." },
    uz: { kick: "Issiq taom", t: "Qo‘y kuragi", d: "Cho‘yanda, glazur va kunjut bilan. Shunchalik vishillaydiki, qo‘shni stol ham qaraydi." },
    alt: { ru: "Баранья лопатка на чугунной сковороде, капли глазури и пар в воздухе", uz: "Cho‘yan tovadagi qo‘y kuragi, havoda glazur tomchilari va bug‘" },
  },
];

/* Акции — с их страницы jigulibar.uz/promotions, своими словами, без новых
   условий. Скидка на напитки для дам не вынесена: на макете бара мы не
   зовём пить больше. */
export const PROMOS = [
  { id: "bday", big: "−15%",
    ru: { t: "В день рождения", d: "Скидка на всё меню за день до праздника, в сам день и день после. Нужен документ. С другими акциями не складывается." },
    uz: { t: "Tug‘ilgan kuningizda", d: "Bayramdan bir kun oldin, o‘sha kuni va bir kun keyin butun menyuga chegirma. Hujjat kerak. Boshqa aksiyalar bilan qo‘shilmaydi." } },
  { id: "kop", big: "3",
    ru: { t: "Копейки по выходным", d: "Пятница, суббота, воскресенье: печать за счёт от 1 500 000 сум. Три печати: блюдо в будни, сет баранины на мангале или ассорти колбасок." },
    uz: { t: "Dam olish kunlari «kopeyka»", d: "Juma, shanba, yakshanba: 1 500 000 so‘mdan hisobga bitta muhr. Uchta muhr: ish kunida taom, mangalda qo‘y go‘shti seti yoki kolbasa assortisi." } },
  { id: "rub", big: "1 ₽",
    ru: { t: "Похмельные рубли", d: "Пн-Чт рубль за каждые 400 000 сум в счёте, тратите в воскресенье: рубль = бокал пива за 100 сум." },
    uz: { t: "«Pohmelnye rubli»", d: "Dush-Pay har 400 000 so‘m hisobga bitta rubl, yakshanba ishlatasiz: rubl = 100 so‘mga bir qadah pivo." } },
  { id: "lunch", big: "12-17",
    ru: { t: "Днём в будни", d: "С понедельника по субботу с 12:00 до 17:00 дневной набор, один на каждого гостя." },
    uz: { t: "Kunduzi", d: "Dushanbadan shanbagacha 12:00 dan 17:00 gacha kunduzgi to‘plam, har bir mehmonga bittadan." } },
];

/* «Сейчас и станет»: что видно на их сайте 20.10.2026, словами гостя. */
export const NOW = [
  { ru: ["Меню открывается альбомом картинок, закрыли: снова на главной", "Меню списком и крупными фото, цена видна сразу, ничего не сбрасывается"],
    uz: ["Menyu rasmlar albomi bo‘lib ochiladi, yopdingiz: yana bosh sahifada", "Menyu ro‘yxat va katta rasmlar bilan, narx darhol ko‘rinadi, hech narsa qaytib ketmaydi"] },
  { ru: ["Кнопка Telegram ведёт в никуда", "Telegram, Instagram и звонок нажимаются и открываются"],
    uz: ["Telegram tugmasi hech qayerga olib bormaydi", "Telegram, Instagram va qo‘ng‘iroq bosiladi va ochiladi"] },
  { ru: ["Бронь подписана «Book Your Tabels» и не работает", "Бронь в два нажатия: день, гости, и сообщение уже у администратора"],
    uz: ["Bron «Book Your Tabels» deb yozilgan va ishlamaydi", "Ikki bosishda bron: kun, mehmonlar, xabar administratorda"] },
  { ru: ["Нет адреса и часов работы", "Адрес, ориентиры, часы и маршрут в одно нажатие"],
    uz: ["Manzil va ish vaqti yo‘q", "Manzil, mo‘ljal, ish vaqti va bir bosishda yo‘nalish"] },
  { ru: ["Сайт на одном русском", "Русский и узбекский, переключатель вверху"],
    uz: ["Sayt faqat rus tilida", "Rus va o‘zbek tillari, tepada almashtirgich"] },
];
