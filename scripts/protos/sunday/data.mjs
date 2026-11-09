// Данные макета Sunday Event Agency. Факты — только из их каналов
// (SOURCES.md): знак в Telegram, описания Instagram и Facebook, карточка на
// Яндекс Картах, старая страница sunday.uz в веб-архиве. Чего у них нет
// (цены, имена, отзывы, число гостей), того на сайте нет; демо подписано.

export const LANGS = ["ru", "uz"];

export const COMPANY = {
  name: "Sunday Event Agency",
  since: 2009,
  years: 17,
  tel: "+998909868400",
  phone: "+998 90 986 84 00",
  mail: "info@sunday.uz",
  tg: "sundayeventagency",
  ig: "sundayeventagency",
  ig2: "sunday.eventagency",
  fb: "sundayuzb",
  reel: "https://www.instagram.com/reel/DdA5LobIf8f/",
  map: "https://yandex.com/maps/org/sunday/73215440007/",
  addr: { ru: "Ташкент, улица Тойтепа, 1 · метро «Амир Темур хиёбони»", uz: "Toshkent, To‘ytepa ko‘chasi, 1 · «Amir Temur xiyoboni» metrosi" },
  slogan: { ru: "17 лет создаём события, о которых говорят годами.", uz: "17 yildan beri yillar davomida gapiriladigan tadbirlarni yaratamiz." },
  motto: { ru: "Авторские концепции, своя команда на площадке", uz: "Mualliflik konsepsiyalari, maydonda o‘z jamoasi" },
};

/* Четыре направления — подпись их второго Instagram: «Оформление, Кейтеринг,
   Мероприятия, Шоу». Описания — что входит в направление, без цифр. */
export const DIRS = [
  { id: "decor", img: "table", ru: ["Оформление", "Цвет, цветы, свет и детали стола под вашу концепцию. Зал узнают по фото."], uz: ["Bezatish", "Konsepsiyangizga mos rang, gullar, yorug‘lik va dasturxon tafsilotlari. Zalni suratdan tanishadi."] },
  { id: "catering", img: "catering", ru: ["Кейтеринг", "Банкет, фуршет или кофе-брейк: меню под формат и гостей, подача, обслуживание."], uz: ["Keytering", "Banket, furshet yoki kofe-breyk: format va mehmonlarga mos menyu, taqdim etish, xizmat."] },
  { id: "events", img: "wedding", ru: ["Мероприятия", "Свадьбы, торжества, праздники и деловые события под ключ: от идеи до последнего гостя."], uz: ["Tadbirlar", "To‘ylar, tantanalar, bayramlar va ishbilarmonlik tadbirlari kalit topshirish asosida: g‘oyadan oxirgi mehmongacha."] },
  { id: "show", img: "show", ru: ["Шоу", "Программа вечера, ведущий, артисты и номера, свет и звук. Режиссура, а не набор выступлений."], uz: ["Shou", "Kecha dasturi, boshlovchi, artistlar va raqamlar, yorug‘lik va ovoz. Chiqishlar to‘plami emas, rejissura."] },
];

/* Поводы — со старой страницы («Организация торжеств», «Организация
   праздников»), Facebook («Wedding day») и их ролика о культурной программе
   туристической конференции. */
export const FORMATS = [
  { id: "wedding", img: "wedding", ru: ["Свадьбы", "Wedding day целиком: церемония, банкет, оформление и программа."], uz: ["To‘ylar", "Wedding day to‘liq: marosim, banket, bezatish va dastur."] },
  { id: "fest", img: "hall", ru: ["Торжества", "Юбилеи, помолвки, семейные даты, на которые собирается вся родня."], uz: ["Tantanalar", "Yubileylar, unashtiruvlar, butun qarindoshlar yig‘iladigan oilaviy sanalar."] },
  { id: "party", img: "party", ru: ["Праздники", "Дни рождения и детские праздники с оформлением, сладким столом и программой."], uz: ["Bayramlar", "Bezatish, shirinlik stoli va dastur bilan tug‘ilgan kunlar va bolalar bayramlari."] },
  { id: "corp", img: "corp", ru: ["Деловые события", "Корпоративы, презентации, культурная программа конференций и гостей города."], uz: ["Ishbilarmonlik tadbirlari", "Korporativlar, taqdimotlar, konferensiyalar va shahar mehmonlari uchun madaniy dastur."] },
];

/* Шаги — устройство работы, без сроков и чисел. */
export const STEPS = [
  { ru: ["Разговор о событии", "Повод, дата, гости и как вы хотите, чтобы его запомнили."], uz: ["Tadbir haqida suhbat", "Sabab, sana, mehmonlar va uni qanday eslab qolishlarini xohlashingiz."] },
  { ru: ["Авторская концепция", "Идея, палитра, сценарий вечера. Показываем до того, как вы платите за площадку."], uz: ["Mualliflik konsepsiyasi", "G‘oya, ranglar, kecha ssenariysi. Maydon uchun to‘lashingizdan oldin ko‘rsatamiz."] },
  { ru: ["Смета по строкам", "Оформление, кейтеринг, шоу, техника: видно, за что каждая сумма."], uz: ["Qatorma-qator smeta", "Bezatish, keytering, shou, texnika: har bir summa nima uchun ekani ko‘rinadi."] },
  { ru: ["Подготовка", "Подрядчики, репетиции, тайминг. Вы видите, что готово."], uz: ["Tayyorgarlik", "Pudratchilar, mashqlar, vaqt rejasi. Nima tayyorligini ko‘rasiz."] },
  { ru: ["День события", "Команда Sunday на площадке с первой минуты до последнего гостя."], uz: ["Tadbir kuni", "Sunday jamoasi birinchi daqiqadan oxirgi mehmongacha maydonda."] },
];

/* Конструктор сметы: ориентиры по открытым данным рынка Ташкента (SOURCES.md,
   «Цены рынка»). Это не цены Sunday: на странице так и написано. */
export const CALC = {
  kinds: [
    { id: "wedding", g: 150, ru: "Свадьба", uz: "To‘y" },
    { id: "fest", g: 80, ru: "Торжество, юбилей", uz: "Tantana, yubiley" },
    { id: "party", g: 30, ru: "День рождения, детский", uz: "Tug‘ilgan kun, bolalar" },
    { id: "corp", g: 100, ru: "Корпоратив, презентация", uz: "Korporativ, taqdimot" },
  ],
  food: [
    { id: "buffet", p: 15, ru: "Фуршет", uz: "Furshet" },
    { id: "banquet", p: 28, ru: "Банкет", uz: "Banket" },
    { id: "premium", p: 45, ru: "Банкет премиум", uz: "Premium banket" },
  ],
  decor: [
    { id: "base", p: 600, ru: "Базовое", uz: "Asosiy" },
    { id: "author", p: 1800, ru: "Авторская концепция", uz: "Mualliflik konsepsiyasi" },
    { id: "lux", p: 4000, ru: "Премиум с инсталляцией", uz: "Installyatsiyali premium" },
  ],
  show: [
    { id: "host", p: 400, ru: "Ведущий и диджей", uz: "Boshlovchi va dijey" },
    { id: "artists", p: 1200, ru: "Ведущий и артисты", uz: "Boshlovchi va artistlar" },
    { id: "big", p: 2500, ru: "Шоу-программа с номерами", uz: "Raqamli shou-dastur" },
  ],
  extra: [
    { id: "photo", p: 700, ru: "Фото и видео", uz: "Foto va video" },
    { id: "light", p: 900, ru: "Свет и звук", uz: "Yorug‘lik va ovoz" },
    { id: "cake", p: 250, ru: "Торт и сладкий стол", uz: "Tort va shirinlik stoli" },
    { id: "car", p: 350, ru: "Кортеж и трансфер гостей", uz: "Kortej va mehmonlar transferi" },
  ],
  fee: 0.1,
  spread: 0.15,
};

/* Работы: иллюстрации, пока нет их фото. Подписано на странице. */
export const WORKS = [
  { img: "wedding", f: "wedding", ru: "Выездная церемония в саду", uz: "Bog‘dagi sayyor marosim" },
  { img: "hall", f: "fest", ru: "Вечерний банкет при свечах", uz: "Shamlar yorug‘idagi kechki banket" },
  { img: "corp", f: "corp", ru: "Сцена деловой программы", uz: "Ishbilarmonlik dasturi sahnasi" },
  { img: "party", f: "party", ru: "Сладкий стол и шары", uz: "Shirinlik stoli va sharlar" },
  { img: "show", f: "corp", ru: "Шоу гала-вечера", uz: "Gala-kecha shousi" },
  { img: "catering", f: "fest", ru: "Фуршет с восточной кухней", uz: "Sharq taomlari bilan furshet" },
];

/* Демо панели и кабинета: выдуманные имена, подписано «демо». */
export const NAMES = { ru: ["Мадина", "Сардор", "Камила", "Жасур", "Нигора", "Дильшод", "Лола", "Азиз"], uz: ["Madina", "Sardor", "Kamila", "Jasur", "Nigora", "Dilshod", "Lola", "Aziz"] };
export const CORP = { ru: ["ООО «[[t:0]] Group»", "АО «[[t:1]] Bank»"], uz: ["«[[t:0]] Group» MChJ", "«[[t:1]] Bank» AJ"] };
