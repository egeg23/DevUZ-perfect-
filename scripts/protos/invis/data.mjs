/*
 * Данные макета Invis. Факты о клубе — только с его карточек и страниц
 * (docs/research/invis.md); цены зон — середина рынка Ташкента оттуда же;
 * места, брони, клиенты, смены и статистика — демо, так и подписаны.
 * Подписи — пары [ru, uz].
 */

export const BRAND = {
  name: "Invis",
  addr: ["Ташкент, ул. Фидокор, 32/1", "Toshkent, Fidokor ko‘chasi, 32/1"],
  hours: ["Круглосуточно, цокольный этаж, 430 м от метро «Айбек»", "Kecha-kunduz, yerto‘la qavat, «Oybek» metrosidan 430 m"],
  phone: "+998 90 017 14 00",
  tg: "invis_fidokor",
  ig: "invis_uz",
  /* Их слова из карточки 2ГИС. */
  slogan: ["Твоя кибер-зона комфорта", "Sening kiber-qulaylik zonang"],
};

/* Системы управления клубом, с которыми можно синхронизировать зал и брони
   (docs/research/invis.md, раздел 5). Первая — та, что показана по умолчанию. */
export const SYSTEMS = [{ name: "SmartShell" }, { name: "iCafeCloud" }, { name: "Langame" }, { name: "SENET" }, { name: "ggLeap" }];

const seats = (p, n, w = 2) => Array.from({ length: n }, (_, i) => p + String(i + 1).padStart(w, "0"));

/* Зоны и цены, сум. Середина рынка Ташкента (исследование, раздел 2). */
export const ZONES = [
  {
    id: "std", c: "#c8ff2e", hour: 15000, pack: { p3: 35000, p5: 60000, morning: 35000, night: 100000 }, seats: seats("S", 20), photo: "z-std", i: "pc",
    n: ["Общий зал", "Umumiy zal"], unit: ["ПК", "ta kompyuter"],
    e: ["Игровые ПК в общем зале: зашёл с друзьями, сели рядом.", "Umumiy zaldagi o‘yin kompyuterlari: do‘stlar bilan kelib, yonma-yon o‘tirasiz."],
    alt: ["Ряд игровых компьютеров с подсветкой", "Yoritilgan o‘yin kompyuterlari qatori"],
  },
  {
    id: "vip", c: "#ff3d72", hour: 25000, pack: { p3: 60000, p5: 100000, morning: 55000, night: 150000 }, seats: seats("V", 10), photo: "z-vip", i: "crown",
    n: ["VIP", "VIP"], unit: ["ПК", "ta kompyuter"],
    e: ["Отдельный зал: тише, кресла мягче, мощнее железо.", "Alohida zal: tinchroq, kreslolar yumshoqroq, temir kuchliroq."],
    alt: ["VIP-зона компьютерного клуба", "Kompyuter klubining VIP zonasi"],
  },
  {
    id: "boot", c: "#2ee6ff", hour: 35000, pack: { p3: 90000, p5: 140000, morning: 75000, night: 200000 }, seats: seats("B", 5, 1), photo: "z-boot", i: "target",
    n: ["Буткемп", "Butkemp"], unit: ["ПК", "ta kompyuter"],
    e: ["Комната на пятерых: команда, тренировка, свой голосовой без соседей.", "Beshtalik xona: jamoa, mashg‘ulot, qo‘shnilarsiz o‘z ovozli chatingiz."],
    alt: ["Команда игроков за компьютерами", "Kompyuterlar ortidagi o‘yinchilar jamoasi"],
  },
  {
    id: "ps", c: "#ffd23f", hour: 42000, pack: { p3: 110000, p5: 175000, morning: 90000, night: 220000 }, seats: ["P1", "P2", "P3"], photo: "z-ps", i: "pad",
    n: ["PlayStation 5", "PlayStation 5"], unit: ["комнаты", "ta xona"],
    e: ["Диван, большой экран и два джойстика: FIFA, Mortal Kombat, UFC.", "Divan, katta ekran va ikki joystik: FIFA, Mortal Kombat, UFC."],
    alt: ["Игровая приставка и джойстики", "O‘yin pristavkasi va joystiklar"],
  },
];

/* Пакеты брони. «Утро» и «Ночь» начинаются в фиксированный час. */
export const PACKS = [
  { id: "p1", n: ["1 час", "1 soat"], dur: 1 },
  { id: "p2", n: ["2 часа", "2 soat"], dur: 2 },
  { id: "p3", n: ["3 часа", "3 soat"], dur: 3 },
  { id: "p5", n: ["5 часов", "5 soat"], dur: 5 },
  { id: "morning", n: ["Утро", "Tong"], dur: 4, at: 8, note: ["08:00-12:00", "08:00-12:00"] },
  { id: "night", n: ["Ночь", "Tun"], dur: 10, at: 22, note: ["22:00-08:00", "22:00-08:00"] },
];

/* Абонементов у клубов Ташкента не нашли: это предложение, 20 часов со
   скидкой 20% от часа зоны (300 000 и 500 000 сум без скидки). */
export const ABON = [
  { n: ["20 часов в общем зале на месяц", "Umumiy zalda oyiga 20 soat"], price: 240000 },
  { n: ["20 часов VIP на месяц", "VIP’da oyiga 20 soat"], price: 400000 },
];

/* Бегущая строка: что получит игрок (сайт и клуб). */
export const HOOKS = [
  { i: "pc", t: ["Бронь ПК с телефона", "Telefondan kompyuter broni"] },
  { i: "shield", t: ["Бронь с гарантией: место не отдадут", "Kafolatli bron: joy boshqaga berilmaydi"] },
  { i: "clock", t: ["Круглосуточно", "Kecha-kunduz"] },
  { i: "bolt", t: ["Сломался ПК: время вернём", "Kompyuter buzilsa: vaqtni qaytaramiz"] },
  { i: "card", t: ["x2 к пополнению по будням", "Ish kunlari to‘ldirishga x2"] },
  { i: "gift", t: ["Колесо бонусов раз в день", "Kuniga bir marta bonus g‘ildiragi"] },
  { i: "moon", t: ["Ночной пакет", "Tungi paket"] },
  { i: "sun", t: ["Утренний пакет", "Ertalabki paket"] },
  { i: "users", t: ["Приведи друга: по часу обоим", "Do‘stingni olib kel: ikkalangizga bir soatdan"] },
  { i: "cup", t: ["Турнир по CS2 каждый месяц", "Har oy CS2 turniri"] },
  { i: "card", t: ["Пополнение Click и Payme", "Click va Payme orqali to‘ldirish"] },
  { i: "pad", t: ["PlayStation 5", "PlayStation 5"] },
  { i: "target", t: ["Буткемп на пятерых", "Beshtalik butkemp"] },
];

/* Сетап: что собирается по прокрутке. Характеристики — после списка от клуба. */
export const GEAR = [
  { i: "pc", t: ["Монитор", "Monitor"], e: ["Высокая частота: картинка плавная, прицел не дёргается.", "Yuqori chastota: tasvir silliq, nishon titramaydi."] },
  { i: "bolt", t: ["Видеокарта", "Videokarta"], e: ["Тянет новые игры на высоких настройках.", "Yangi o‘yinlarni yuqori sozlamalarda tortadi."] },
  { i: "pc", t: ["Клавиатура", "Klaviatura"], e: ["Механика с подсветкой.", "Yoritilgan mexanik klaviatura."] },
  { i: "target", t: ["Мышь", "Sichqoncha"], e: ["Лёгкая игровая мышь и большой коврик.", "Yengil o‘yin sichqonchasi va katta gilamcha."] },
  { i: "head", t: ["Наушники", "Quloqchinlar"], e: ["Слышно шаги, микрофон для команды.", "Qadam tovushlari eshitiladi, jamoa uchun mikrofon."] },
];

/* Колесо: шансы строго 65 / 25 / 10. Сектора по площади равны шансам. */
export const WHEEL = [
  { id: "none", p: 65, hours: 0, c: "#2a2158", tc: "#cdc8ef", short: ["ПУСТО", "BO‘SH"], win: ["Сегодня пусто", "Bugun bo‘sh"] },
  { id: "h1", p: 25, hours: 1, c: "#c8ff2e", tc: "#090616", short: ["1 ЧАС", "1 SOAT"], win: ["Час игры в подарок", "Bir soat o‘yin sovg‘a"] },
  { id: "h2", p: 10, hours: 2, c: "#ff064d", tc: "#ffffff", short: ["2 ЧАСА", "2 SOAT"], win: ["Два часа игры в подарок", "Ikki soat o‘yin sovg‘a"] },
];
export const SECTORS = [
  { id: "h2", deg: 36 }, { id: "none", deg: 78 }, { id: "h1", deg: 45 },
  { id: "none", deg: 78 }, { id: "h1", deg: 45 }, { id: "none", deg: 78 },
];

/* ── Кабинеты: всё демо ── */
export const ME = { nick: "Shadow", balance: 85000, bonus: 1, points: 1240, invited: 3 };
export const PAYS = [
  { id: "click", n: "Click", c: "#00b2ff" },
  { id: "payme", n: "Payme", c: "#33cccc" },
  { id: "uzum", n: "Uzum Bank", c: "#7b2fff" },
  { id: "card", n: "Uzcard / Humo", c: "#c8ff2e" },
];
export const TOPUPS = [50000, 100000, 200000, 500000];
export const TOP_BONUS = [{ from: 200000, hours: 1 }, { from: 500000, hours: 3 }];
export const HISTORY = [
  { zone: ["VIP", "VIP"], seat: "V04", date: ["12 окт, 19:00", "12-okt, 19:00"], hours: 3, paid: 50000 },
  { zone: ["Буткемп", "Butkemp"], seat: "B2", date: ["10 окт, 21:00", "10-okt, 21:00"], hours: 5, paid: 95000 },
  { zone: ["Общий зал", "Umumiy zal"], seat: "S11", date: ["7 окт, 16:00", "7-okt, 16:00"], hours: 2, paid: 24000 },
  { zone: ["Ночь, общий зал", "Tun, umumiy zal"], seat: "S03", date: ["4 окт, 22:00", "4-okt, 22:00"], hours: 10, paid: 60000 },
];
export const FRIENDS = [
  { nick: "Jasur_07", state: ["пришёл и пополнил", "keldi va to‘ldirdi"], done: true, c: "#c8ff2e" },
  { nick: "Mira", state: ["пришла и пополнила", "keldi va to‘ldirdi"], done: true, c: "#ff3fa4" },
  { nick: "Bek", state: ["зарегистрировался, ждём первого визита", "ro‘yxatdan o‘tdi, birinchi tashrifni kutyapmiz"], done: false, c: "#2ee6ff" },
];
export const LEVELS = [
  { n: ["Новичок", "Yangi"], from: 0, c: "#cdc8ef", perk: ["колесо раз в день", "kuniga bir g‘ildirak"] },
  { n: ["Игрок", "O‘yinchi"], from: 1000, c: "#c8ff2e", perk: ["+5% к пополнению", "to‘ldirishga +5%"] },
  { n: ["Про", "Pro"], from: 3000, c: "#2ee6ff", perk: ["+10% и бронь VIP за сутки", "+10% va VIP’ni bir kun oldin bron"] },
  { n: ["Легенда", "Afsona"], from: 8000, c: "#ff3fa4", perk: ["+15% и ночь в подарок раз в месяц", "+15% va oyiga bir tun sovg‘a"] },
];
export const INVITE = "SHADOW7Q";
export const CLIENTS = [
  ["Shadow", "+998 90 *** ** 41", 85000, 64, 22, 1240], ["Jasur_07", "+998 93 *** ** 12", 120000, 140, 41, 3400], ["Mira", "+998 99 *** ** 70", 40000, 38, 15, 760],
  ["Bek", "+998 97 *** ** 05", 0, 0, 0, 0], ["Kibo", "+998 91 *** ** 88", 230000, 260, 73, 8600], ["Sanjar", "+998 94 *** ** 33", 15000, 21, 9, 420],
  ["NoScope", "+998 90 *** ** 19", 60000, 97, 30, 2100], ["Diyor", "+998 88 *** ** 56", 5000, 12, 6, 240], ["Lola", "+998 95 *** ** 27", 78000, 55, 19, 1100],
  ["Azizbek", "+998 33 *** ** 64", 300000, 188, 52, 5200], ["Timur", "+998 99 *** ** 02", 9000, 30, 12, 600], ["Zarina", "+998 97 *** ** 81", 45000, 44, 17, 880],
].map(([nick, phone, balance, hours, visits, points]) => ({ nick, phone, balance, hours, visits, points }));
export const ADMINS = ["Aziz"];
/* Ники за ПК в живом зале пульта: демо. */
export const NICKS = ["Jasur_07", "Mira", "Kibo", "Sanjar", "NoScope", "Diyor", "Lola", "Azizbek", "Timur", "Zarina", "Raptor", "Bekzod", "s1mple_uz", "Nodir", "Akmal", "Frost", "Umid", "Dildora", "Rustam", "Ghost", "Sherzod", "Komil", "Viper", "Otabek", "Malika", "Doniyor", "Sardor", "Ninja_TSH", "Islom", "Eldor", "Hype", "Laziz", "Javohir", "Nigora", "Ulugbek", "Zed", "Abbos", "Kamron"];
export const SHIFTS = [
  { admin: "Aziz", time: ["сегодня с 10:00", "bugun 10:00 dan"], cash: 640000, card: 410000, online: 1180000, bonus: 9 },
  { admin: "Dilshod", time: ["вчера, 22:00-10:00", "kecha, 22:00-10:00"], cash: 520000, card: 230000, online: 1460000, bonus: 6 },
  { admin: "Aziz", time: ["вчера, 10:00-22:00", "kecha, 10:00-22:00"], cash: 890000, card: 540000, online: 1720000, bonus: 11 },
  { admin: "Kamola", time: ["13 окт, 22:00-10:00", "13-okt, 22:00-10:00"], cash: 410000, card: 180000, online: 1310000, bonus: 4 },
  { admin: "Dilshod", time: ["13 окт, 10:00-22:00", "13-okt, 10:00-22:00"], cash: 760000, card: 495000, online: 1650000, bonus: 8 },
];
export const STATS = {
  revToday: 2230000,
  wheel: { spins: 412, none: 268, h1: 103, h2: 41, used: 139 },
  lastSpins: [["Kibo", "14:12", 1], ["Lola", "13:40", 0], ["NoScope", "12:05", 0], ["Azizbek", "11:31", 2], ["Mira", "10:58", 0]],
};
export const PHOTO_CREDIT = ["Unsplash (ELLA DON, Stem List, Martin Katler)", "Unsplash (ELLA DON, Stem List, Martin Katler)"];

/* Подписи кабинетов. */
export const CAB_UI = {
  player: ["кабинет игрока", "o‘yinchi kabineti"], admin: ["пульт администратора", "administrator pulti"], sections: ["Разделы", "Bo‘limlar"],
  toAdmin: ["Пульт администратора", "Administrator pulti"], toPlayer: ["Кабинет игрока", "O‘yinchi kabineti"], onShift: ["на смене:", "smenada:"],
  tHome: ["Главная", "Asosiy"], tBook: ["Бронь", "Bron"], tWallet: ["Кошелёк", "Hamyon"], tBonus: ["Бонусы", "Bonuslar"], tFriends: ["Друзья", "Do‘stlar"],
  aHall: ["Зал", "Zal"], aBookings: ["Брони", "Bronlar"], aClients: ["Клиенты", "Mijozlar"], aTariffs: ["Тарифы", "Tariflar"], aWheel: ["Колесо", "G‘ildirak"], aShifts: ["Смены", "Smenalar"],
  hi: ["Привет, {nick}", "Salom, {nick}"], balance: ["Баланс", "Balans"], bonusHours: ["бонусных часов", "bonus soat"], topup: ["Пополнить", "To‘ldirish"],
  nextBook: ["Ближайшая бронь", "Eng yaqin bron"], noBook: ["Броней пока нет.", "Hozircha bron yo‘q."], bookNow: ["Забронировать место", "Joy bron qilish"],
  wheelDay: ["Колесо дня", "Kun g‘ildiragi"], wheelReady: ["Попытка ждёт", "Urinish kutmoqda"], noWin: ["пусто", "bo‘sh"], toBonus: ["К бонусам", "Bonuslarga"], h: ["ч", "soat"],
  level: ["Уровень", "Daraja"], points: ["очков", "ochko"], zonesNow: ["Зоны", "Zonalar"], myBooks: ["Мои брони", "Bronlarim"],
  inSys: ["записано в {sys}", "{sys} tizimiga yozildi"], cancel: ["Отменить", "Bekor qilish"], cancelled: ["Бронь отменена, место свободно", "Bron bekor qilindi, joy bo‘sh"],
  walletNote: ["Деньги списываются за игру по тарифу зоны. Бонусные часы тратятся первыми.", "Pul zona tarifi bo‘yicha o‘yin uchun yechiladi. Avval bonus soatlar sarflanadi."],
  topBonus: ["К этому пополнению: +{h} ч в подарок", "Bu to‘ldirishga: +{h} soat sovg‘a"], topBonusFrom: ["От {s} сум: час в подарок", "{s} so‘mdan: bir soat sovg‘a"],
  pay: ["Оплатить", "To‘lash"], paying: ["Оплата…", "To‘lov…"], paid: ["Зачислено {s} через {via}", "{via} orqali {s} tushdi"], topped: ["Пополнение", "To‘ldirish"], justNow: ["только что", "hozirgina"],
  payNote: ["Демо: деньги не списываются. В работе оплата идёт через Click, Payme или Uzum, баланс сразу в системе клуба. Бонусы за пополнение настраиваются в пульте.", "Demo: pul yechilmaydi. Ishda to‘lov Click, Payme yoki Uzum orqali o‘tadi, balans darhol klub tizimida. To‘ldirish bonuslari pultda sozlanadi."],
  visits: ["История посещений и пополнений", "Tashriflar va to‘ldirishlar tarixi"],
  bonusAcc: ["Бонусный счёт", "Bonus hisob"], bonusUse: ["Тратятся при следующей игре, раньше денег.", "Keyingi o‘yinda pul’dan oldin sarflanadi."],
  levelNote: ["Очки идут за часы игры. Уровни и подарки клуб настраивает сам.", "Ochkolar o‘yin soatlari uchun beriladi. Darajalar va sovg‘alarni klub o‘zi sozlaydi."],
  myWins: ["Мои попытки", "Urinishlarim"], noSpins: ["Ещё не крутили", "Hali aylantirilmagan"],
  invite: ["Пригласи друга", "Do‘stingni taklif qil"], inviteDeal: ["Друг пришёл и пополнил: вам обоим по часу", "Do‘sting kelib to‘ldirdimi: ikkalangizga bir soatdan"],
  copy: ["Скопировать ссылку", "Havolani nusxalash"], share: ["Отправить", "Yuborish"], copied: ["Ссылка скопирована", "Havola nusxalandi"],
  shareText: ["Го в Invis, по моей ссылке час в подарок", "Invis’ga yur, mening havolam bilan bir soat sovg‘a"],
  inviteNote: ["Подарок за друга клуб настраивает в пульте. Бот приглашений в макете не настоящий.", "Do‘st uchun sovg‘ani klub pultda sozlaydi. Maketdagi taklif boti haqiqiy emas."],
  friendsList: ["Друзья", "Do‘stlar"], wait: ["ждём", "kutyapmiz"],
  kLoad: ["Загрузка зала", "Zal bandligi"], kFree: ["Свободно", "Bo‘sh"], kFreeS: ["можно садить", "o‘tqazish mumkin"], kBook: ["Брони", "Bronlar"], kBookS: ["ближайшие 2 часа", "yaqin 2 soat"], kRev: ["Выручка", "Tushum"], kRevS: ["за сегодня", "bugun"],
  syncAdm: ["Синхронизировано с {sys}: сеансы, брони и баланс гостей", "{sys} bilan sinxronlangan: seanslar, bronlar va mehmonlar balansi"],
  fromSite: ["бронь с сайта", "saytdan bron"], off: ["выключен", "o‘chiq"], free: ["свободен", "bo‘sh"], in: ["через", "keyin"],
  lOn: ["играет", "o‘ynayapti"], lBk: ["бронь", "bron"], lFree: ["свободен", "bo‘sh"], lOff: ["выключен", "o‘chiq"], seat: ["Место", "Joy"],
  extend: ["Продлить на час", "Bir soatga uzaytirish"], extended: ["Сеанс продлён на час", "Seans bir soatga uzaytirildi"], end: ["Завершить", "Tugatish"], ended: ["Сеанс завершён", "Seans tugatildi"],
  msg: ["Написать на ПК", "Kompyuterga yozish"], msgSent: ["Сообщение ушло на экран", "Xabar ekranga yuborildi"], start: ["Гость пришёл, запустить", "Mehmon keldi, ishga tushirish"], started: ["Сеанс запущен", "Seans boshlandi"],
  move: ["Перенести", "Ko‘chirish"], moved: ["Бронь перенесена", "Bron ko‘chirildi"], startGuest: ["Посадить гостя", "Mehmonni o‘tqazish"], block: ["Закрыть на обслуживание", "Xizmat uchun yopish"], blocked: ["Место закрыто на обслуживание", "Joy xizmat uchun yopildi"], close: ["Закрыть", "Yopish"],
  client: ["Клиент", "Mijoz"], when: ["Когда", "Qachon"], source: ["Откуда", "Qayerdan"], sumT: ["Сумма", "Summa"], confirm: ["Подтвердить", "Tasdiqlash"], confirmed: ["Бронь подтверждена, клиенту ушло напоминание", "Bron tasdiqlandi, mijozga eslatma ketdi"],
  srcSite: ["сайт", "sayt"], srcDesk: ["стойка", "peshtaxta"], bookHint: ["Забронируйте место на странице клуба: бронь появится здесь первой строкой.", "Klub sahifasida joy bron qiling: bron bu yerda birinchi qator bo‘lib chiqadi."],
  search: ["Ник или телефон", "Nik yoki telefon"], phone: ["Телефон", "Telefon"], hoursT: ["Часов", "Soat"], visitsT: ["Визитов", "Tashrif"],
  clientsNote: ["Клиенты, баланс и часы приходят из системы клуба. Номера скрыты: полностью их видит только админ.", "Mijozlar, balans va soatlar klub tizimidan keladi. Raqamlar yashirilgan: to‘liq faqat admin ko‘radi."],
  tariffNote: ["Цены меняются здесь и сразу уходят в {sys} и на сайт: в двух местах править не нужно.", "Narxlar shu yerda o‘zgaradi va darhol {sys} va saytga ketadi: ikki joyda tuzatish shart emas."],
  pack: ["Пакет", "Paket"], saveSync: ["Сохранить и отправить в {sys}", "Saqlash va {sys} ga yuborish"], synced: ["Сохранено, на сайте новые цены", "Saqlandi, saytda yangi narxlar"], savedT: ["Тарифы обновлены", "Tariflar yangilandi"], unsaved: ["Есть несохранённые изменения", "Saqlanmagan o‘zgarishlar bor"],
  wSpins: ["Попыток", "Urinishlar"], w30: ["за 30 дней", "30 kunda"], wGiven: ["Роздано", "Berildi"], wGivenS: ["часов в подарок", "sovg‘a soat"], wUsed: ["Отыграно", "O‘ynaldi"], wUsedS: ["подаренных часов", "sovg‘a soatlardan"], wLeft: ["Ещё на счетах", "Hisoblarda qoldi"], wLeftS: ["ждут игроков", "o‘yinchilarni kutmoqda"],
  wDist: ["Что выпадало и что должно", "Nima tushdi va nima tushishi kerak"], wExp: ["по правилу", "qoida bo‘yicha"],
  wMath: ["В среднем одна попытка дарит {x} ч: в общем зале это около {s} сум. Шансы заданы в коде, админ их не крутит: так честно и для игрока, и для клуба.", "O‘rtacha bitta urinish {x} soat beradi: umumiy zalda bu taxminan {s} so‘m. Imkoniyatlar kodda belgilangan, admin ularni o‘zgartirmaydi: bu o‘yinchi uchun ham, klub uchun ham halol."],
  wLast: ["Последние попытки", "Oxirgi urinishlar"],
  curShift: ["Текущая смена", "Joriy smena"], cash: ["Наличные", "Naqd"], cards: ["Карты", "Kartalar"], bonusSpent: ["Бонусных часов", "Bonus soatlar"], closeShift: ["Закрыть смену", "Smenani yopish"],
  closeNote: ["Итог смены уйдёт владельцу в Telegram, касса сверится с системой клуба.", "Smena yakuni egasiga Telegramga ketadi, kassa klub tizimi bilan solishtiriladi."], closeOk: ["Закрыть и отправить отчёт", "Yopish va hisobot yuborish"], closed: ["Смена закрыта, отчёт ушёл владельцу", "Smena yopildi, hisobot egasiga ketdi"],
  pastShifts: ["Прошлые смены", "Oldingi smenalar"], adminT: ["Админ", "Admin"],
};
