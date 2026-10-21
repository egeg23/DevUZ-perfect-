import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import * as D from "./data.mjs";
import { BASE, ADDONS, ALL, OFFER_HOURS } from "./plan.mjs";
import { dzIntroSolo } from "../../../lib/proto/dz-video.mjs";

/*
 * Макет сайта SEM Travel (турагентство в Ташкенте с 2011 года), узбекский
 * (главная, "") и русский ("ru"), как у них на semtravel.uz:
 *  - видео DevUz (dzIntroSolo), за ним первый экран: море их цветов, маршрут
 *    из Ташкента (самолёт идёт по дуге к выбранной стране, цена катится) и
 *    поиск «куда, когда, сколько нас»; вкладка «не знаю куда»: бюджет, месяц
 *    и люди, три страны на экране сразу; звонок и Telegram в одно нажатие;
 *  - выдача: самолёт по дуге, пока «спрашиваем туроператоров», три тура с
 *    итогом на всех; карточка тура шторкой: дни поездки, образец ваучера
 *    (отель, номер, этаж), что входит и что нет, аванс 30%, шкала отмены;
 *    бронь: имя и телефон, их Telegram с готовым текстом, статус заявки;
 *  - «Куда сейчас дешевле»: карта перелётов из Ташкента (азимутальная, по
 *    настоящим направлениям и расстояниям), их цены на 21.10.2026, «за
 *    одного / на двоих / семья», график «где дешевле» и календарь по дням;
 *  - гарантии крупно, спецпредложение, услуги и визы, SEM Club с расчётом
 *    кэшбэка, отзывы с Яндекс Карт, два офиса, «Сейчас и станет», стоимость
 *    с отсчётом 48 часов.
 * Факты — data.mjs (их сайт); демо-расчёты подписаны на странице. Фото —
 * Unsplash и Wikimedia Commons (SOURCES.md), знак — их логотип с сайта.
 * Ссылки — через __PROTO_BASE__, отпечаток ставится при показе зерном из
 * protos.stamp (lib/proto/bundles). Модель макет не вызывает.
 */

const DIR = new URL(".", import.meta.url).pathname;
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const min = (s) => strip(s).replace(/\n\s*/g, "");
const IMG = "/protos/semtravel";
const PUB = new URL("../../../public", import.meta.url).pathname;
const BASEP = "__PROTO_BASE__";
const B = D.BRAND;
const FONTS = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Onest:wght@400;700&display=swap";
const read = (f) => readFileSync(DIR + f, "utf8");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const grp = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const usd = (n) => grp(n) + " $";
const json = (v) => JSON.stringify(v).replace(/</g, "\\u003c");
const href = (l, path = "") => BASEP + (l === "ru" ? "/ru" : "") + (path ? "/" + path : "");
const MON = {
  ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
  uz: ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"],
};
const day = (iso, l) => { const [, m, d] = iso.split("-").map(Number); return l === "uz" ? `${d}-${MON.uz[m - 1]}` : `${d} ${MON.ru[m - 1]}`; };

/* ── Тексты: uz и ru ─────────────────────────────────────────────────── */
const T = {
  uz: {
    title: "SEM Travel: Toshkentdan turlar, hamma uchun jami narx va bron · DevUz Studio maketi",
    desc: "SEM Travel, 2011 yildan Toshkentdagi sayohat agentligi: Turkiya, Dubai, Misr, Tailand va yana 6 davlatga turlar. Hamma uchun jami narx, bron qilishdan oldin voucher, 21 kun oldin bekor qilsangiz 100% qaytarish.",
    skip: "Mazmunga o‘tish", nav: [["#poisk", "Turlar"], ["#karta", "Qayerga arzon"], ["#garantii", "Kafolatlar"], ["#uslugi", "Vizalar"], ["#kontakty", "Aloqa"]],
    navL: "Bo‘limlar", lang: "RU", langName: "Ruscha", home: "bosh sahifaga",
    call: "Qo‘ng‘iroq", tg: "Telegram", pickBtn: "Tur tanlash",
    heroKick: "2011 yildan Toshkentdagi sayohat agentligi",
    heroH: ["Toshkentdan", "dengizgacha"],
    heroLead: "Barcha turoperatorlardan qidiramiz, hamma uchun jami narxni ko‘rsatamiz va to‘lovdan oldin voucherni beramiz.",
    route: "Toshkent", from: "dan", perOne: "bir kishiga",
    tabKnow: "Qayerga bilaman", tabPick: "Qayerga bilmayman",
    where: "Qayerga", when: "Qachon", who: "Necha kishi", budget: "Byudjet, hammaga",
    adults: "Kattalar", kids: "Bolalar", less: "kamaytirish", more: "ko‘paytirish",
    flex: "±3 kun, arzonini topamiz",
    months: [[11, "Noyabr"], [12, "Dekabr"], [1, "Yanvar"], [2, "Fevral"], [3, "Mart"], [4, "Aprel"]],
    find: "Turlarni ko‘rsatish", pickGo: "3 ta davlatni tanlash",
    trust: [`Yandex Xaritalarda ${B.rating}`, `${B.votes} baho`, `${B.since} yildan`, `${B.clients} sayohatchi`],
    rezKick: "Sizning sanalaringizga turlar", wait: "Turoperatorlardan so‘rayapmiz", waitDone: "Topildi",
    demo: "Namuna: tayyor saytda bu yerda Turvizor’ning jonli narxlari bo‘ladi. Mehmonxonalar shartli, nomlari bronda.",
    pickKick: "Qayerga bilmayman", total: "Jami", perP: "kishiga", nightsW: "kecha", see: "Batafsil", seeTours: "Turlarni ko‘rish",
    left: (n) => `ekskursiyalarga ${n} qoladi`, over: (n) => `byudjetdan ${n} ko‘p`,
    kartaKick: "Bugungi narxlar", kartaH: "Qayerga hozir arzon?",
    kartaP: "Toshkentdan xarita: yo‘nalish va masofa haqiqiy, narx 21-oktabr holatiga, turoperatorlar bazasidagi eng past narx, mehmonxona tanlanmagan.",
    forOne: "Bir kishi", forTwo: "Ikki kishi", forFam: "Oila 2+1",
    rank: "Bu sanalarda qayer arzon", cal: "Kunlar bo‘yicha narxlar", calNote: "Kalendar namuna: tayyor saytda kunlarni Turvizor to‘ldiradi.",
    cheapest: "eng arzon kun", km: "km", season: "Mavsum", flight: "Parvoz", visa: "Viza", nearest: (d, n) => `eng yaqin parvoz ${d}, ${n} kecha`,
    garKick: "Tinch sayohat kafolati", garH: "Uchta kafolat, yozma",
    gar: [
      { id: "vou", t: "Voucher to‘lovdan oldin", d: "Mehmonxona nomi, xona turi, qavat. Borgan joyingiz qog‘ozdagi bilan bir xil, mehmonxona almashtirilmaydi.", tag: "Mehmonxona almashtirilmaydi" },
      { id: "diff", t: "Arzonroq topsangiz, farqini qaytaramiz", d: "Xuddi shu turni boshqa agentlikda arzonroq topsangiz, farqini qaytaramiz. Yozma kafolat bilan.", tag: "Farqini qaytaramiz" },
      { id: "cancel", t: "21 kun oldin bekor qilish: 100%", d: "Rejangiz o‘zgardimi? Parvozdan 21 kun oldin bekor qilsangiz, pul to‘liq qaytadi. Hammasi shartnomada.", tag: "21 kun, 100% qaytarish" },
    ],
    cancelQ: "Parvozgacha necha kun qoldi?", cancelD: "kun",
    cancelOk: "100% qaytadi, shartnoma bo‘yicha", cancelNo: "21 kundan kam: shartnoma bo‘yicha, menejer summani oldindan aytadi",
    specKick: "Maxsus taklif", specT: "Turkiya · Antalya · 7 kecha · All Inclusive", specNote: "Cheklangan miqdorda, saytingizdagi taklif", specGo: "Bron qilish",
    uslKick: "Xizmatlar", uslH: "Tur, chipta, mehmonxona, viza: bitta agentlik",
    clubKick: "SEM Club", clubH: "Har bir turdan keshbek",
    clubP: `Birinchi turdan keyin $${D.CLUB_GIFT} sertifikat va do‘stingizga yana $${D.CLUB_GIFT}. Do‘st olib kelsangiz, uning turidan 1%. Ballar, bonuslar va sertifikatlar tur narxining 3% idan oshmaydi.`,
    clubSum: "Tur summasi", clubSt: "Status", clubCb: "Bu turdan keshbek", clubFive: "5 ta turdan keyin kartada", clubGift: `Birinchi turdan keyin sertifikat`,
    otzKick: "Sharhlar", otzH: "Yandex Xaritalarda nima deyishadi", otzP: `${B.rating} · ${B.votes} baho · ${B.reviews} sharh · Uchtepa filiali`, otzAll: "Barcha sharhlar Yandex’da",
    chan: "Telegram-kanal", sms: "Yoki SMS",
    ctKick: "Aloqa", ctH: "Ikki ofis, bitta raqam", ctPay: "To‘lov", ctAdv: `Bron uchun ${B.advance}% avans yetarli`, mapGo: "Xaritada ochish",
    nowKick: "DevUz Studio tahlili", nowH: "Hozir va bo‘ladi", nowA: "Hozir semtravel.uz’da, telefonda", nowB: "Bo‘ladi",
    offKick: "DevUz Studio taklifi", offH: "Narxi",
    offP: `Qo‘shimchalarsiz sayt: 48 soat ichida boshlasak, ${usd(BASE.price)} o‘rniga ${usd(BASE.promo)}. Qolganini tugmalar bilan yoqing, jami qayta hisoblanadi. Hammasi birga: ${usd(ALL)}.`,
    always: "Doim kiradi", term: (a, b) => `Muddat: ${a}-${b} hafta`, addG: "Qo‘shimchalar: agentligingizga keraklisini yoqing",
    star: "birinchi olinadi", nw: "Toshkent agentliklarida yo‘q", act: () => `${usd(BASE.promo)} narx amal qiladi`, actS: "maket birinchi ochilgandan 48 soat",
    site: "Sayt", adds: "Qo‘shimchalar", totalW: "Jami", withAll: `barcha qo‘shimchalar bilan ${usd(ALL)}`, allOn: "Hammasini yoqish", talk: "DevUz Studio bilan muhokama", copy: "Tarkibni nusxalash",
    src: "Turvizor, to‘lov va xosting tariflarini o‘zingiz to‘laysiz. Qo‘shimchalar narxi namuna bo‘yicha, tasdiqlang.",
    head: "SEM Travel sayti, tarkibi:", copied: "Nusxalandi", ended: "Aksiya tugadi, narx odatiy",
    hours: "soat",
    /* Карточка тура и бронь */
    close: "Yopish", tour: "Tur", hotel: (s) => `Mehmonxona ${s}★, namuna`, meal: ["Nonushta", "Hammasi kiritilgan", "Hammasi kiritilgan, premium"],
    days: "Sayohat kunlari", d1: "Toshkentdan parvoz, aeroportda kutib olish, mehmonxonaga transfer, joylashish", dMid: "Dengiz, hovuz, ekskursiyalar: o‘zingiz tanlaysiz", dLast: "Aeroportga transfer, uyga parvoz",
    vouH: "Voucher namunasi", vouSub: "Bron qilishdan oldin shunday hujjatni ko‘rasiz",
    vouF: ["Mehmonxona", "Xona", "Qavat", "Ovqat", "Kelish", "Ketish", "Turistlar"], vouRoom: "Standard, dengiz tomonga", vouHotel: "bronda nomi bilan", vouFloor: "3",
    inc: "Narxga kiradi", incL: ["Toshkentdan borish-qaytish parvozi", "Mehmonxona", "Aeroport-mehmonxona transferi", "Tanlangan ovqat"],
    exc: "Kirmaydi", excL: ["Viza, agar kerak bo‘lsa: yordam beramiz, $49 dan", "Ekskursiyalar", "Shaxsiy xarajatlar"],
    sumFor: "hamma uchun", adv: `${B.advance}% avans`, rest: "qolgani parvozdan oldin, shartnoma bo‘yicha",
    book: "Bron qilish", bronH: "Bron qilish", name: "Ismingiz", phone: "Telefon", note: "Izoh",
    send: "Telegram’da yuborish", sendNote: "Tayyor matnli xabar Telegram’da ularning @prosem_bot botida ochiladi, siz yuborasiz. Menejer 15 daqiqada javob beradi.",
    st: ["Ariza yuborildi", "Menejer 15 daqiqada javob beradi", "Voucher sizda", `${B.advance}% avans`, "Hujjatlar kabinetda"],
    stH: "Arizangiz holati", stNow: "hozir", mine: "Mening arizam",
    msg: (x) => `Assalomu alaykum! Turni bron qilmoqchiman: ${x.dest}, ${x.when}, ${x.who}. ${x.hotel}, ${x.nights} kecha, jami taxminan ${x.sum}. Ismim: ${x.name}, telefon: ${x.phone}. ${x.note}`,
    who2: (a, k) => `${a} katta${k ? `, ${k} bola` : ""}`,
    needName: "Ism va telefonni yozing",
    footD: "Maket ma’lumotlari", footL: ["Narxlar, kafolatlar, xizmatlar, SEM Club, sharhlar: semtravel.uz, 21.10.2026", "Reyting: Yandex Xaritalar, Uchtepa filiali", "Mehmonxonalar, kunlar bo‘yicha narx va jami: namuna"],
    photos: "Rasmlar: Unsplash; Wikimedia Commons, CC BY: Vyacheslav Argenberg (Tbilisi), Radosław Botev (Boku), Francisco Anzola (Doha)",
    mock: "Bu maket: SEM Travel sayti shunday ko‘rinishi mumkin. Sayt ma’lumot uchun va ommaviy oferta emas.",
    terms: "Maketdan foydalanish shartlari",
  },
  ru: {
    title: "SEM Travel: туры из Ташкента, итог на всех и бронь · макет DevUz Studio",
    desc: "SEM Travel, турагентство в Ташкенте с 2011 года: туры в Турцию, Дубай, Египет, Таиланд и ещё 6 стран. Итог на всех сразу, ваучер до брони, отмена за 21 день: 100% возврат.",
    skip: "К содержанию", nav: [["#poisk", "Туры"], ["#karta", "Куда дешевле"], ["#garantii", "Гарантии"], ["#uslugi", "Визы"], ["#kontakty", "Контакты"]],
    navL: "Разделы", lang: "UZ", langName: "O‘zbekcha", home: "на главную",
    call: "Позвонить", tg: "Telegram", pickBtn: "Подобрать тур",
    heroKick: "Турагентство в Ташкенте с 2011 года",
    heroH: ["Из Ташкента", "к морю"],
    heroLead: "Ищем у всех туроператоров, показываем итог на всех и даём ваучер до оплаты.",
    route: "Ташкент", from: "от", perOne: "за одного",
    tabKnow: "Знаю куда", tabPick: "Не знаю куда",
    where: "Куда", when: "Когда", who: "Сколько нас", budget: "Бюджет на всех",
    adults: "Взрослые", kids: "Дети", less: "меньше", more: "больше",
    flex: "±3 дня, найдём дешевле",
    months: [[11, "Ноябрь"], [12, "Декабрь"], [1, "Январь"], [2, "Февраль"], [3, "Март"], [4, "Апрель"]],
    find: "Показать туры", pickGo: "Подобрать 3 страны",
    trust: [`${B.rating} на Яндекс Картах`, `${B.votes} оценок`, `с ${B.since} года`, `${B.clients} путешественников`],
    rezKick: "Туры на ваши даты", wait: "Спрашиваем туроператоров", waitDone: "Нашли",
    demo: "Пример: в готовом сайте здесь живые цены Турвизора. Отели условные, названия будут в брони.",
    pickKick: "Не знаю куда", total: "Итого", perP: "за человека", nightsW: "ночей", see: "Подробнее", seeTours: "Смотреть туры",
    left: (n) => `останется ${n} на экскурсии`, over: (n) => `на ${n} больше бюджета`,
    kartaKick: "Цены на сегодня", kartaH: "Куда сейчас дешевле?",
    kartaP: "Карта из Ташкента: направления и расстояния настоящие, цены на 21 октября, минимальные в базе туроператоров, без выбора отеля.",
    forOne: "Один", forTwo: "Двое", forFam: "Семья 2+1",
    rank: "Где дешевле в эти даты", cal: "Цены по дням", calNote: "Календарь пример: в готовом сайте дни заполнит Турвизор.",
    cheapest: "самый дешёвый день", km: "км", season: "Сезон", flight: "Перелёт", visa: "Виза", nearest: (d, n) => `ближайший вылет ${d}, ${n} ночей`,
    garKick: "Гарантия спокойного отдыха", garH: "Три гарантии, письменно",
    gar: [
      { id: "vou", t: "Ваучер до оплаты", d: "Название отеля, тип номера, этаж. Куда приедете, то и в документе, без подмен.", tag: "Отель не меняем" },
      { id: "diff", t: "Найдёте дешевле, вернём разницу", d: "Найдёте этот же тур дешевле в другом агентстве, вернём разницу. С письменной гарантией.", tag: "Вернём разницу" },
      { id: "cancel", t: "Отмена за 21 день: 100%", d: "Планы изменились? Отмена за 21 день до вылета, и деньги вернутся полностью. Всё прописано в договоре.", tag: "21 день, 100% возврат" },
    ],
    cancelQ: "Сколько дней до вылета?", cancelD: "дн.",
    cancelOk: "Вернём 100%, по договору", cancelNo: "Меньше 21 дня: по договору, сумму менеджер скажет заранее",
    specKick: "Спецпредложение", specT: "Турция · Анталья · 7 ночей · All Inclusive", specNote: "Ограниченное количество, предложение с вашего сайта", specGo: "Забронировать",
    uslKick: "Услуги", uslH: "Тур, билет, отель, виза: одно агентство",
    clubKick: "SEM Club", clubH: "Кэшбэк с каждого тура",
    clubP: `После первого тура сертификат $${D.CLUB_GIFT} и ещё $${D.CLUB_GIFT} другу. Привели друга: 1% от его тура. Баллы, бонусы и сертификаты не больше 3% от стоимости тура.`,
    clubSum: "Стоимость тура", clubSt: "Статус", clubCb: "Кэшбэк с этого тура", clubFive: "На карте после 5 туров", clubGift: "Сертификат после первого тура",
    otzKick: "Отзывы", otzH: "Что говорят на Яндекс Картах", otzP: `${B.rating} · ${B.votes} оценок · ${B.reviews} отзывов · филиал Учтепа`, otzAll: "Все отзывы на Яндексе",
    chan: "Telegram-канал", sms: "Или SMS",
    ctKick: "Контакты", ctH: "Два офиса, один номер", ctPay: "Оплата", ctAdv: `Для брони достаточно аванса ${B.advance}%`, mapGo: "Открыть на карте",
    nowKick: "Разбор DevUz Studio", nowH: "Сейчас и станет", nowA: "Сейчас на semtravel.uz, с телефона", nowB: "Станет",
    offKick: "Предложение DevUz Studio", offH: "Стоимость",
    offP: `Сайт без допов: ${usd(BASE.promo)} вместо ${usd(BASE.price)}, если начинаем в течение 48 часов. Остальное включайте тумблерами, итог пересчитается. Всё вместе: ${usd(ALL)}.`,
    always: "Входит всегда", term: (a, b) => `Срок: ${a}-${b} недель`, addG: "Допы: включайте то, что нужно агентству",
    star: "берут первым", nw: "нет у агентств Ташкента", act: () => `Цена ${usd(BASE.promo)} действует`, actS: "48 часов с первого открытия макета",
    site: "Сайт", adds: "Допы", totalW: "Итого", withAll: `со всеми допами ${usd(ALL)}`, allOn: "Включить всё", talk: "Обсудить с DevUz Studio", copy: "Скопировать состав",
    src: "Тарифы Турвизора, оплаты и хостинга вы оплачиваете сами. Цены допов по образцу, подтвердите.",
    head: "Сайт SEM Travel, состав:", copied: "Скопировано", ended: "Акция закончилась, цена обычная",
    hours: "часов",
    close: "Закрыть", tour: "Тур", hotel: (s) => `Отель ${s}★, пример`, meal: ["Завтраки", "Всё включено", "Всё включено, премиум"],
    days: "Дни поездки", d1: "Вылет из Ташкента, встреча в аэропорту, трансфер в отель, заселение", dMid: "Море, бассейн, экскурсии: как захотите", dLast: "Трансфер в аэропорт, вылет домой",
    vouH: "Образец ваучера", vouSub: "Такой документ вы видите до брони",
    vouF: ["Отель", "Номер", "Этаж", "Питание", "Заезд", "Выезд", "Туристы"], vouRoom: "Standard, вид на море", vouHotel: "по названию в брони", vouFloor: "3",
    inc: "Входит в цену", incL: ["Перелёт из Ташкента туда и обратно", "Отель", "Трансфер аэропорт-отель", "Выбранное питание"],
    exc: "Не входит", excL: ["Виза, если нужна: поможем, от $49", "Экскурсии", "Личные расходы"],
    sumFor: "на всех", adv: `Аванс ${B.advance}%`, rest: "остальное до вылета, по договору",
    book: "Забронировать", bronH: "Забронировать", name: "Ваше имя", phone: "Телефон", note: "Пожелания",
    send: "Отправить в Telegram", sendNote: "Сообщение с готовым текстом откроется в Telegram, в их боте @prosem_bot, отправляете вы. Менеджер ответит за 15 минут.",
    st: ["Заявка отправлена", "Менеджер ответит за 15 минут", "Ваучер у вас", `Аванс ${B.advance}%`, "Документы в кабинете"],
    stH: "Статус заявки", stNow: "сейчас", mine: "Моя заявка",
    msg: (x) => `Здравствуйте! Хочу забронировать тур: ${x.dest}, ${x.when}, ${x.who}. ${x.hotel}, ${x.nights} ночей, итого примерно ${x.sum}. Меня зовут ${x.name}, телефон ${x.phone}. ${x.note}`,
    who2: (a, k) => `${a} взр.${k ? `, ${k} дет.` : ""}`,
    needName: "Напишите имя и телефон",
    footD: "Данные макета", footL: ["Цены, гарантии, услуги, SEM Club, отзывы: semtravel.uz, 21.10.2026", "Оценка: Яндекс Карты, филиал Учтепа", "Отели, цены по дням и итог: пример расчёта"],
    photos: "Фото: Unsplash; Wikimedia Commons, CC BY: Vyacheslav Argenberg (Тбилиси), Radosław Botev (Баку), Francisco Anzola (Доха)",
    mock: "Это макет: так может выглядеть сайт SEM Travel. Сайт носит информационный характер и не является публичной офертой.",
    terms: "Условия использования макета",
  },
};

/* ── Иконки: контуры 24×24 ───────────────────────────────────────────── */
const S = 'fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';
const I = {
  arrow: `<path d="M5 12h14M13 6l6 6-6 6" ${S}/>`,
  x: `<path d="M6 6l12 12M18 6 6 18" ${S}/>`,
  phone: `<path d="M5 4.5h3.5l1.5 4-2 1.3a10 10 0 0 0 6.2 6.2l1.3-2 4 1.5V19a1.5 1.5 0 0 1-1.6 1.5A15.5 15.5 0 0 1 3.5 6.1 1.5 1.5 0 0 1 5 4.5z" ${S}/>`,
  tg: `<path d="M21 4 3 11l6 2 2 6 3-4 5 4z" ${S}/><path d="m9 13 9-7" ${S}/>`,
  ig: `<rect x="4" y="4" width="16" height="16" rx="4.5" ${S}/><circle cx="12" cy="12" r="3.6" ${S}/><circle cx="16.8" cy="7.2" r=".6" ${S}/>`,
  pin: `<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" ${S}/><circle cx="12" cy="10" r="2.4" ${S}/>`,
  clock: `<circle cx="12" cy="12" r="8.5" ${S}/><path d="M12 7.5V12l3 2" ${S}/>`,
  star: `<path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" ${S}/>`,
  starf: `<path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" fill="currentColor" stroke="none"/>`,
  mail: `<rect x="3.5" y="5.5" width="17" height="13" rx="2" ${S}/><path d="m4 7 8 6 8-6" ${S}/>`,
  plane: `<path d="M10.5 13.5 4 11l1.5-1.5 7 1L17 6a2 2 0 0 1 3 3l-4.5 4.5 1 7L15 22l-2.5-6.5L9 19v2.5L7.5 23l-1-3.5L3 18.5 4.5 17H7l3.5-3.5z" ${S}/>`,
  search: `<circle cx="11" cy="11" r="6.5" ${S}/><path d="m20 20-4.2-4.2" ${S}/>`,
  spark: `<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" ${S}/>`,
  doc: `<path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20z" ${S}/><path d="M14 3.5V8h4M9.5 12h6M9.5 15.5h6" ${S}/>`,
  coin: `<circle cx="12" cy="12" r="8.5" ${S}/><path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1.2 0-2.2-.6-2.6-1.6M12 6.5v1.5M12 16v1.5" ${S}/>`,
  shield: `<path d="M12 3.5 5 6v5.5c0 4.5 3 7.7 7 9 4-1.3 7-4.5 7-9V6z" ${S}/><path d="m9 12 2 2 4-4" ${S}/>`,
  cal: `<rect x="4" y="5.5" width="16" height="14" rx="2" ${S}/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" ${S}/>`,
  hotel: `<path d="M4 20.5V5.5A1 1 0 0 1 5 4.5h9a1 1 0 0 1 1 1v15M15 10.5h4a1 1 0 0 1 1 1v9M3 20.5h18M7.5 8h1.5M10.5 8H12M7.5 11.5h1.5M10.5 11.5H12M7.5 15h1.5M10.5 15H12" ${S}/>`,
  car: `<path d="M5 16.5V12l2-5h10l2 5v4.5M5 16.5h14M5 16.5V19M19 16.5V19M4 12h16" ${S}/><circle cx="8" cy="14.5" r=".8" ${S}/><circle cx="16" cy="14.5" r=".8" ${S}/>`,
  passport: `<rect x="5.5" y="3.5" width="13" height="17" rx="1.5" ${S}/><circle cx="12" cy="10.5" r="3" ${S}/><path d="M9 16.5h6" ${S}/>`,
  copy: `<rect x="8" y="8" width="12" height="12" rx="2" ${S}/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" ${S}/>`,
  check: `<path d="m5 12.5 4.5 4.5L19 7.5" ${S}/>`,
  minus: `<path d="M6 12h12" ${S}/>`,
  plus: `<path d="M6 12h12M12 6v12" ${S}/>`,
};
const sprite = () => `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${Object.entries(I)
  .map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24" stroke="currentColor">${v}</symbol>`)
  .join("")}</defs></svg>`;
const ic = (k, c = "") => `<svg class="ic${c ? " " + c : ""}" aria-hidden="true"><use href="#i-${k}"/></svg>`;
const tel = `tel:${B.phoneRaw}`;
/* Их знак и подпись, как в логотипе: «SEM» жирно, «TRAVEL» тонко. */
const logo = (cls = "") => `<span class="logo-m ${cls}"><img src="${IMG}/mark.webp" alt="" width="253" height="240"><span class="logo-w"><b>SEM</b>TRAVEL</span></span>`;

function headTags(l) {
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${T[l].title}</title>
<meta name="description" content="${esc(T[l].desc)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#0c2236">
<link rel="icon" type="image/png" sizes="192x192" href="${IMG}/icon-192.png">
<link rel="apple-touch-icon" href="${IMG}/apple-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="preload" as="image" href="${IMG}/hero-9.webp" media="(max-width: 799px)">
<link rel="preload" as="image" href="${IMG}/hero.webp" media="(min-width: 800px)">`;
}

const head = (kick, h, p = "", cls = "") => `<div class="sh ${cls}"><span class="kick">${kick}</span><h2>${h}</h2>${p ? `<p>${p}</p>` : ""}</div>`;
const step = (id, label, val, minV, maxV, t) => `<div class="stp" data-step="${id}" data-min="${minV}" data-max="${maxV}"><span>${label}</span><div class="stp-c"><button type="button" data-d="-1" aria-label="${label}: ${t.less}">${ic("minus")}</button><output aria-live="polite">${val}</output><button type="button" data-d="1" aria-label="${label}: ${t.more}">${ic("plus")}</button></div></div>`;

/* ── Первый экран: море, маршрут из Ташкента, поиск ───────────────── */
function heroBlock(l) {
  const t = T[l], d0 = D.DEST[0];
  return `<section class="hero" id="hero" aria-labelledby="hero-h">
<div class="hero-bg" aria-hidden="true"><picture><source media="(min-width: 800px)" srcset="${IMG}/hero.webp"><img src="${IMG}/hero-9.webp" alt="" width="748" height="1330" fetchpriority="high"></picture></div>
<div class="hero-shade" aria-hidden="true"></div>
<div class="wrap hero-g">
<div class="hero-t">
<span class="kick">${t.heroKick}</span>
<h1 id="hero-h"><span>${t.heroH[0]}</span> <em>${t.heroH[1]}</em></h1>
<p class="lead">${t.heroLead}</p>
<div class="route" id="route" aria-live="polite">
<svg class="route-svg" viewBox="0 0 320 120" aria-hidden="true"><path id="route-p" class="route-p" d="M14 104 C 90 6, 230 6, 306 70"/><circle cx="14" cy="104" r="4" class="route-a"/><circle cx="306" cy="70" r="4" class="route-b"/><g id="route-pl" class="route-pl"><svg x="-11" y="-11" width="22" height="22" viewBox="0 0 24 24"><use href="#i-plane"/></svg></g></svg>
<div class="route-l"><b>TAS</b><span>${t.route}</span></div>
<div class="route-r"><b id="route-code">${d0.code}</b><span id="route-name">${d0[l].t}</span></div>
<p class="route-pr"><span>${t.from}</span> <b id="route-price">$${d0.price}</b> <small>${t.perOne}</small></p>
</div>
</div>
${searchCard(l)}
</div>
</section>`;
}

function searchCard(l) {
  const t = T[l];
  const dests = D.DEST.map((d, i) => `<button type="button" class="chip" data-dest="${d.id}" aria-pressed="${i === 0}">${d[l].t}<small>$${d.price}</small></button>`).join("");
  const months = (name) => t.months.map(([m, n], i) => `<button type="button" class="chip" data-m="${m}" data-g="${name}" aria-pressed="${i === 0}">${n}</button>`).join("");
  return `<div class="srch" id="poisk">
<div class="tabs" role="tablist" aria-label="${t.where}"><button type="button" role="tab" id="tb-know" aria-selected="true" aria-controls="pn-know">${ic("search")}<span>${t.tabKnow}</span></button><button type="button" role="tab" id="tb-pick" aria-selected="false" aria-controls="pn-pick">${ic("spark")}<span>${t.tabPick}</span></button></div>
<div class="pn" id="pn-know" role="tabpanel" aria-labelledby="tb-know">
<div class="fld"><span class="fl">${t.where}</span><div class="chips scroll-x" role="group" aria-label="${t.where}" data-g="dest">${dests}</div></div>
<div class="fld"><span class="fl">${t.when}</span><div class="chips" role="group" aria-label="${t.when}" data-g="mk">${months("mk")}</div><label class="flex"><input type="checkbox" id="flex" checked><span class="sw sm" aria-hidden="true"></span><span>${t.flex}</span></label></div>
<div class="fld"><span class="fl">${t.who}</span><div class="stps">${step("ad", t.adults, 2, 1, 6, t)}${step("ch", t.kids, 0, 0, 4, t)}</div></div>
<button type="button" class="btn btn-sun btn-go" id="go-know">${ic("search")}<span>${t.find}</span></button>
</div>
<div class="pn" id="pn-pick" role="tabpanel" aria-labelledby="tb-pick" hidden>
<div class="fld"><span class="fl">${t.budget} <output id="bud-o">$1 200</output></span><input type="range" id="bud" min="500" max="6000" step="100" value="1200" aria-label="${t.budget}"></div>
<div class="fld"><span class="fl">${t.when}</span><div class="chips" role="group" aria-label="${t.when}" data-g="mp">${months("mp")}</div></div>
<div class="fld"><span class="fl">${t.who}</span><div class="stps">${step("ad", t.adults, 2, 1, 6, t)}${step("ch", t.kids, 0, 0, 4, t)}</div></div>
<button type="button" class="btn btn-sun btn-go" id="go-pick">${ic("spark")}<span>${t.pickGo}</span></button>
</div>
<div class="quick"><a class="btn btn-line" href="${tel}">${ic("phone")}<span>${t.call}</span></a><a class="btn btn-line" href="${B.tg}">${ic("tg")}<span>${t.tg}</span></a></div>
<ul class="trust">${t.trust.map((x, i) => `<li>${i === 0 ? ic("starf") : ""}${x}</li>`).join("")}</ul>
</div>`;
}

/* ── Выдача: туры или три страны ──────────────────────────────────── */
function rezBlock(l) {
  const t = T[l];
  return `<section class="rez" id="rez" aria-live="polite" hidden><div class="wrap">
<div class="rez-h"><span class="kick" id="rez-k">${t.rezKick}</span><h2 id="rez-t"></h2></div>
<div class="fly" id="fly" aria-hidden="true"><svg viewBox="0 0 600 90"><path id="fly-p" d="M10 80 C 160 -10, 440 -10, 590 60"/><g id="fly-pl"><svg x="-12" y="-12" width="24" height="24" viewBox="0 0 24 24"><use href="#i-plane"/></svg></g></svg><p><span id="fly-t">${t.wait}</span> <b id="fly-n">0</b></p></div>
<div class="rez-g" id="rez-g"></div>
<p class="demo">${t.demo}</p>
</div></section>`;
}

/* ── Карта перелётов из Ташкента ──────────────────────────────────── */
/* Азимутальная равнопромежуточная проекция с центром в Ташкенте: угол —
   настоящее направление полёта, радиус — расстояние по дуге большого круга. */
const rad = (x) => (x * Math.PI) / 180;
function polar([la, lo]) {
  const [a, b] = [rad(D.TAS[0]), rad(D.TAS[1])], [c, e] = [rad(la), rad(lo)];
  const dist = 6371 * Math.acos(Math.sin(a) * Math.sin(c) + Math.cos(a) * Math.cos(c) * Math.cos(e - b));
  const brg = Math.atan2(Math.sin(e - b) * Math.cos(c), Math.cos(a) * Math.sin(c) - Math.sin(a) * Math.cos(c) * Math.cos(e - b));
  return { dist: Math.round(dist), brg };
}
/* Радиус — корень расстояния: соседи (Грузия, Азербайджан, Турция) не
   слипаются у Ташкента, дальние не уходят за край. Подписи разложены руками. */
const MAXKM = 6000, R = 230, rOf = (km) => R * Math.sqrt(km / MAXKM);
const LAB = { georgia: "t", azer: "bl", turkey: "l", egypt: "l", qatar: "l", dubai: "b", thai: "r", vietnam: "t", china: "t", lanka: "b" };
const PTS = D.DEST.map((d) => { const p = polar(d.geo); const r = rOf(p.dist); return { ...d, km: Math.round(p.dist / 10) * 10, x: Math.round(Math.sin(p.brg) * r), y: Math.round(-Math.cos(p.brg) * r) }; });
function mapBlock(l) {
  const t = T[l];
  const rings = [1000, 3000, 6000].map((k) => `<circle r="${rOf(k).toFixed(1)}"/><text y="${(-rOf(k) - 6).toFixed(1)}">${grp(k)} ${t.km}</text>`).join("");
  const arcs = PTS.map((p) => { const mx = p.x / 2 - p.y * 0.18, my = p.y / 2 + p.x * 0.18; return `<path class="arc" data-dest="${p.id}" d="M0 0 Q ${Math.round(mx)} ${Math.round(my)} ${p.x} ${p.y}"/>`; }).join("");
  const pos = { t: [0, -16, "middle"], b: [0, 28, "middle"], bl: [10, 28, "end"], l: [-14, 6, "end"], r: [14, 6, "start"] };
  const dots = PTS.map((p) => { const [x, y, a] = pos[LAB[p.id]]; return `<g class="dot" data-dest="${p.id}" transform="translate(${p.x} ${p.y})"><circle r="14" class="dot-h"/><circle r="6"/><text x="${x}" y="${y}" text-anchor="${a}"><tspan class="dn">${p[l].t}</tspan><tspan class="dp" data-p="${p.price}" dx="6">$${p.price}</tspan></text></g>`; }).join("");
  return `<section class="karta" id="karta" aria-labelledby="karta-h"><div class="wrap">
${head(t.kartaKick, `<span id="karta-h">${t.kartaH}</span>`, t.kartaP)}
<div class="seg" role="group" aria-label="${t.who}"><button type="button" data-n="1" aria-pressed="true">${t.forOne}</button><button type="button" data-n="2" aria-pressed="false">${t.forTwo}</button><button type="button" data-n="2.6" aria-pressed="false">${t.forFam}</button></div>
<div class="karta-g">
<div class="chart"><svg viewBox="-320 -250 640 460" role="img" aria-label="${t.kartaH}"><g class="rings">${rings}</g><g class="arcs">${arcs}</g><g class="tas"><circle r="7"/><text y="24" text-anchor="middle">TAS</text></g><g class="dots">${dots}</g><g id="map-pl" class="map-pl"><svg x="-11" y="-11" width="22" height="22" viewBox="0 0 24 24"><use href="#i-plane"/></svg></g></svg></div>
<div class="dside">
<div class="dcard" id="dcard">
<div class="dc-img"><img id="dc-img" src="${IMG}/d-dubai-s.webp" srcset="${IMG}/d-dubai-s.webp 640w, ${IMG}/d-dubai.webp 1200w" sizes="(min-width: 1000px) 520px, 100vw" alt="${D.DEST[0][l].t}" width="640" height="427" loading="lazy" decoding="async"></div>
<div class="dc-b"><h3 id="dc-t">${D.DEST[0][l].t}</h3><p class="dc-p"><span>${t.from}</span> <b id="dc-pr">$${D.DEST[0].price}</b> <small id="dc-for">${t.perOne}</small></p><p class="dc-n" id="dc-n">${t.nearest(day(D.DEST[0].date, l), D.DEST[0].nights)}</p><dl class="dc-f" id="dc-f"></dl>
<h4>${t.cal}</h4><div class="cal" id="cal" role="list"></div><p class="cal-k" id="cal-k"></p><p class="note">${t.calNote}</p>
<button type="button" class="btn btn-sun" id="dc-go">${ic("search")}<span>${t.seeTours}</span></button></div>
</div>
</div>
</div>
<h3 class="rank-h">${t.rank}</h3>
<ol class="rank" id="rank">${[...D.DEST].sort((a, b) => a.price - b.price).map((d) => `<li><button type="button" data-dest="${d.id}"><span class="rk-n">${d[l].t}</span><span class="rk-b" style="--w:${Math.round(((d.price - 380) / (730 - 380)) * 100)}%"><i></i></span><b class="rk-p" data-p="${d.price}">$${d.price}</b></button></li>`).join("")}</ol>
</div></section>`;
}

/* ── Гарантии ─────────────────────────────────────────────────────── */
function garBlock(l) {
  const t = T[l];
  const vou = `<div class="mini-vou" aria-hidden="true"><b>VOUCHER</b><span>${t.vouF[0]} ··· ${t.vouF[1]} ··· ${t.vouF[2]}</span><i></i></div>`;
  const cancel = `<div class="cx"><label for="cx-r">${t.cancelQ} <output id="cx-o">30 ${t.cancelD}</output></label><input type="range" id="cx-r" min="1" max="60" value="30"><div class="cx-scale" aria-hidden="true"><span style="--a:0%;--b:${(20 / 59) * 100}%"></span><span class="ok" style="--a:${(20 / 59) * 100}%;--b:100%"></span></div><p class="cx-t ok" id="cx-t">${t.cancelOk}</p></div>`;
  return `<section class="gar" id="garantii"><div class="wrap">
${head(t.garKick, t.garH)}
<div class="gar-g">${t.gar.map((g, i) => `<article class="gc rv gc-${g.id}" style="--d:${i * 90}ms"><span class="gc-s" aria-hidden="true">${ic(["doc", "coin", "shield"][i])}</span><h3>${g.t}</h3><p>${g.d}</p><span class="tag">${g.tag}</span>${i === 0 ? vou : i === 2 ? cancel : ""}</article>`).join("")}</div>
</div></section>`;
}

/* ── Спецпредложение с их главной ─────────────────────────────────── */
function specBlock(l) {
  const t = T[l], s = D.SPECIAL;
  return `<section class="spec"><div class="wrap"><article class="tagc rv">
<div class="tag-i"><img src="${IMG}/d-turkey-s.webp" srcset="${IMG}/d-turkey-s.webp 640w, ${IMG}/d-turkey.webp 1200w" sizes="(min-width: 640px) 50vw, 100vw" alt="${l === "uz" ? "Turkiya" : "Турция"}" width="640" height="427" loading="lazy" decoding="async"></div>
<div class="tag-b"><span class="kick">${t.specKick}</span><h3>${t.specT}</h3><p class="tag-p"><s>$${grp(s.old)}</s> <b>$${s.now}</b> <em>−$${s.old - s.now}</em></p><p class="note">${t.specNote}</p>
<button type="button" class="btn btn-sun" data-spec>${t.specGo}</button></div>
<span class="tag-hole" aria-hidden="true"></span>
</article></div></section>`;
}

/* ── Услуги и визы ────────────────────────────────────────────────── */
function uslBlock(l) {
  const t = T[l];
  const icon = { air: "plane", hotel: "hotel", transfer: "car", visa: "passport" };
  return `<section class="usl" id="uslugi"><div class="wrap">
${head(t.uslKick, t.uslH)}
<div class="usl-g">${D.SERVICES.map((s, i) => `<article class="uc rv" style="--d:${i * 80}ms">${ic(icon[s.id], "uc-i")}<h3>${s[l].t}</h3><b class="uc-f">${s.from[l]}</b><p>${s[l].d}</p></article>`).join("")}</div>
</div></section>`;
}

/* ── SEM Club ─────────────────────────────────────────────────────── */
function clubBlock(l) {
  const t = T[l];
  return `<section class="club" id="club"><div class="wrap club-g">
<div>${head(t.clubKick, t.clubH, t.clubP)}
<ol class="lv">${D.CLUB.map((c) => `<li class="lv-${c.id}"><b>${c[l].t}</b><span>${c.cb}%</span><small>${c[l].f}</small></li>`).join("")}</ol></div>
<div class="calc rv">
<label for="cl-sum">${t.clubSum} <output id="cl-so">$1 000</output></label><input type="range" id="cl-sum" min="300" max="5000" step="100" value="1000">
<div class="seg" role="group" aria-label="${t.clubSt}" id="cl-st">${D.CLUB.map((c, i) => `<button type="button" data-cb="${c.cb}" aria-pressed="${i === 0}">${c[l].t}</button>`).join("")}</div>
<div class="calc-r"><div><small>${t.clubCb}</small><b id="cl-cb">$5</b></div><div><small>${t.clubFive}</small><b id="cl-5">$25</b></div><div><small>${t.clubGift}</small><b>$${D.CLUB_GIFT}</b></div></div>
</div>
</div></section>`;
}

/* ── Отзывы с Яндекс Карт ─────────────────────────────────────────── */
function otzBlock(l) {
  const t = T[l];
  return `<section class="otz" id="otzyvy"><div class="wrap">
<div class="otz-h"><b class="otz-n">${B.rating}</b><div>${head(t.otzKick, t.otzH, t.otzP)}</div></div>
<div class="otz-g">${D.REVIEWS.map((r, i) => `<figure class="oc rv" style="--d:${i * 70}ms"><span class="stars" aria-hidden="true">${ic("starf").repeat(5)}</span><blockquote>${esc(r[l])}</blockquote><figcaption><b>${r.who}</b><span>${r.date[l]} · Yandex</span></figcaption></figure>`).join("")}</div>
<a class="btn btn-line" href="${B.yandex}">${ic("star")}<span>${t.otzAll}</span></a>
</div></section>`;
}

/* ── Контакты ─────────────────────────────────────────────────────── */
function ctBlock(l) {
  const t = T[l];
  return `<section class="ct" id="kontakty"><div class="wrap ct-g">
<div class="ct-t">${head(t.ctKick, t.ctH)}
<ul class="ct-l">
${B.offices.map((o) => `<li>${ic("pin")}<span><b>${o[l].t}</b>${o[l].a}. <a href="https://yandex.uz/maps/?pt=${o.geo[1]},${o.geo[0]}&amp;z=16">${t.mapGo}</a></span></li>`).join("")}
<li>${ic("clock")}<span><b>${B.hours[l]}</b></span></li>
<li>${ic("phone")}<span><b><a href="${tel}">${B.phone}</a></b><a href="tel:${B.phone2Raw}">${B.phone2}</a></span></li>
<li>${ic("mail")}<span><a href="mailto:${B.mail}">${B.mail}</a></span></li>
</ul>
<div class="ct-b"><a class="btn btn-sun" href="${B.tg}">${ic("tg")}<span>${B.tgName}</span></a><a class="btn btn-line" href="${B.channel}">${ic("tg")}<span>${t.chan}</span></a><a class="btn btn-line" href="${B.ig}">${ic("ig")}<span>${B.igName}</span></a></div>
<p class="pay"><b>${t.ctPay}:</b> ${B.pay.join(" · ")}. ${t.ctAdv}.</p>
</div>
<div class="ct-map" aria-hidden="true">${mapArt(l)}</div>
</div></section>`;
}
/* Схема города кодом: две точки офисов по их координатам, без чужих тайлов. */
function mapArt(l) {
  const [a, b] = B.offices; const sx = (lo) => Math.round(((lo - 69.14) / 0.14) * 400), sy = (la) => Math.round(((41.37 - la) / 0.1) * 300);
  return `<svg viewBox="0 0 400 300"><rect width="400" height="300" class="m-bg"/><path class="m-rd" d="M0 70 C 120 90, 260 40, 400 60M0 190 C 140 170, 250 220, 400 200M90 0 C 110 120, 70 200, 100 300M260 0 C 240 100, 300 200, 280 300"/><path class="m-river" d="M330 0 C 300 80, 360 160, 320 300"/>${[a, b].map((o) => `<g transform="translate(${sx(o.geo[1])} ${sy(o.geo[0])})"><circle r="16" class="m-h"/><circle r="6" class="m-p"/><text y="-22" text-anchor="middle">${o[l].t}</text></g>`).join("")}</svg>`;
}

/* ── Сейчас и станет ──────────────────────────────────────────────── */
function nowBlock(l) {
  const t = T[l];
  return `<section class="now" id="seychas"><div class="wrap">
${head(`<span class="ours">${t.nowKick}</span>`, t.nowH)}
<div class="now-g"><div class="now-h"><span>${t.nowA}</span><span>${t.nowB}</span></div>${D.NOW.map((r, i) => `<div class="now-r rv" style="--d:${i * 60}ms"><p class="now-a">${r[l][0]}</p>${ic("arrow", "now-ar")}<p class="now-b">${r[l][1]}</p></div>`).join("")}</div>
</div></section>`;
}

/* ── Стоимость (предложение DevUz) ───────────────────────────────── */
function offerBlock(l) {
  const t = T[l];
  const row = (a) => `<label class="kit-row"><input type="checkbox" data-k="${a.id}" data-p="${a.price}"><span class="sw" aria-hidden="true"></span><span class="kit-t2"><b>${a[l].t}${a.star ? `<em class="star">${t.star}</em>` : ""}${a.new ? `<em class="nw-t">${t.nw}</em>` : ""}</b><small>${a[l].e}</small></span><span class="kit-pr">+${usd(a.price)}</span></label>`;
  return `<section class="offer" id="stoimost"><div class="wrap">
${head(`<span class="ours">${t.offKick}</span>`, t.offH, t.offP)}
<div class="kit" id="konstruktor">
<div class="kit-l">
<div class="kit-base"><div><span class="kb-tag">${t.always}</span><b>${BASE[l].t}</b><p>${BASE[l].d}</p><p class="kb-w">${t.term(...BASE.weeks)}</p></div><div class="kb-p"><s>${usd(BASE.price)}</s><b>${usd(BASE.promo)}</b><small>48 ${t.hours}</small></div></div>
<h3 class="kit-g">${t.addG}</h3>
${ADDONS.map(row).join("")}
</div>
<div class="kit-side">
<div class="kit-total" id="kit-total">
<div class="timer" id="timer"><span>${t.act()}<small>${t.actS}</small></span><b id="tm">48:00:00</b></div>
<div class="kt-line"><span>${t.site}</span><span><s>${usd(BASE.price)}</s> ${usd(BASE.promo)}</span></div>
<div class="kt-line"><span>${t.adds} · <span id="kit-cnt">0</span></span><span id="kit-add">0 $</span></div>
<div class="kt-sum"><small>${t.totalW}</small><b id="kit-sum">${usd(BASE.promo)}</b><small>${t.withAll}</small></div>
<button type="button" class="btn btn-line" id="kit-all">${t.allOn}</button>
<a class="btn btn-sun" href="https://t.me/Devuz_studio_bot?start=semtravel">${ic("tg")}<span>${t.talk}</span></a>
<button type="button" class="copy" id="kit-copy">${ic("copy")}<span>${t.copy}</span></button>
</div>
<p class="src">${t.src}</p>
</div>
</div>
</div></section>`;
}

/* ── Шторки: карточка тура и бронь ────────────────────────────────── */
function tourSheet(l) {
  const t = T[l];
  return `<div class="sheet" id="tur" role="dialog" aria-modal="true" aria-labelledby="tu-h" hidden>
<div class="sh-in">
<button type="button" class="sh-x" data-close aria-label="${t.close}">${ic("x")}</button>
<div class="tu-gal" id="tu-gal"></div>
<p class="kick" id="tu-k"></p>
<h3 class="sh-h" id="tu-h"></h3>
<p class="tu-sum"><b id="tu-sum"></b> <span>${t.sumFor}</span> <small id="tu-pp"></small></p>
<div class="tu-adv"><span>${t.adv}: <b id="tu-adv"></b></span><small>${t.rest}</small></div>
<h4>${t.days}</h4><ol class="tl" id="tu-days"></ol>
<div class="vou" id="tu-vou"><div class="vou-h"><b>${t.vouH}</b><small>${t.vouSub}</small></div><dl id="tu-vf"></dl><span class="vou-st" aria-hidden="true">SEM TRAVEL</span></div>
<div class="inex"><div><h4>${t.inc}</h4><ul class="ok">${t.incL.map((x) => `<li>${ic("check")}${x}</li>`).join("")}</ul></div><div><h4>${t.exc}</h4><ul class="no">${t.excL.map((x) => `<li>${ic("minus")}${x}</li>`).join("")}</ul></div></div>
<div class="cx cx-in"><label for="cx-r2">${t.cancelQ} <output id="cx-o2">30 ${t.cancelD}</output></label><input type="range" id="cx-r2" min="1" max="60" value="30"><div class="cx-scale" aria-hidden="true"><span style="--a:0%;--b:${(20 / 59) * 100}%"></span><span class="ok" style="--a:${(20 / 59) * 100}%;--b:100%"></span></div><p class="cx-t ok" id="cx-t2">${t.cancelOk}</p></div>
<div class="sh-act"><button type="button" class="btn btn-sun" id="tu-book">${ic("check")}<span>${t.book}</span></button><a class="btn btn-line" href="${tel}">${ic("phone")}<span>${t.call}</span></a></div>
</div></div>`;
}
function bronSheet(l) {
  const t = T[l];
  return `<div class="sheet" id="bron" role="dialog" aria-modal="true" aria-labelledby="br-h" hidden>
<div class="sh-in">
<button type="button" class="sh-x" data-close aria-label="${t.close}">${ic("x")}</button>
<p class="sh-h" id="br-h">${t.bronH}</p>
<p class="br-sum" id="br-sum"></p>
<form class="bf" id="bf" novalidate>
<label><span>${t.name}</span><input id="bf-n" name="n" autocomplete="name" required></label>
<label><span>${t.phone}</span><input id="bf-p" name="p" type="tel" autocomplete="tel" inputmode="tel" value="+998 " required></label>
<label><span>${t.note}</span><input id="bf-c" name="c"></label>
<p class="bf-e" id="bf-e" hidden>${t.needName}</p>
<button type="submit" class="btn btn-sun">${ic("tg")}<span>${t.send}</span></button>
<a class="btn btn-line" id="bf-sms" href="sms:${B.phone2Raw}">${ic("phone")}<span>${t.sms}: ${B.phone2}</span></a>
<a class="btn btn-line" href="${tel}">${ic("phone")}<span>${t.call}: ${B.phone}</span></a>
<p class="note">${t.sendNote}</p>
</form>
<div class="stat" id="stat" hidden><p class="stat-h">${t.stH}</p><ol>${t.st.map((s, i) => `<li data-i="${i}"><i>${ic("check")}</i><span>${s}</span>${i === 1 ? '<b id="st-tm">15:00</b>' : ""}</li>`).join("")}</ol></div>
</div></div>`;
}

function ld(l) {
  return {
    "@context": "https://schema.org", "@type": "TravelAgency", name: B.name, url: B.site, telephone: [B.phoneRaw, B.phone2Raw], email: B.mail, foundingDate: String(B.since),
    address: { "@type": "PostalAddress", streetAddress: B.offices[0][l].a, addressLocality: l === "uz" ? "Toshkent" : "Ташкент", addressRegion: l === "uz" ? "Uchtepa" : "Учтепа", postalCode: "100152", addressCountry: "UZ" },
    geo: { "@type": "GeoCoordinates", latitude: B.offices[0].geo[0], longitude: B.offices[0].geo[1] },
    openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], opens: "09:00", closes: "19:00" }],
    aggregateRating: { "@type": "AggregateRating", ratingValue: B.rating, ratingCount: B.votes, bestRating: "5" },
    department: [{ "@type": "TravelAgency", name: `${B.name}, ${B.offices[1][l].t}`, address: { "@type": "PostalAddress", streetAddress: B.offices[1][l].a, addressLocality: l === "uz" ? "Toshkent" : "Ташкент", addressCountry: "UZ" }, geo: { "@type": "GeoCoordinates", latitude: B.offices[1].geo[0], longitude: B.offices[1].geo[1] } }],
    paymentAccepted: B.pay.join(", "), currenciesAccepted: "UZS, USD", sameAs: [B.channel, B.ig], knowsLanguage: ["uz", "ru"],
  };
}

function siteData(l) {
  const t = T[l];
  return {
    l, img: IMG, tg: B.tg, sms: B.phone2Raw, phone: B.phoneRaw, adv: B.advance,
    dest: PTS.map((d) => ({ id: d.id, code: d.code, price: d.price, nights: d.nights, date: d.date, img: d.img, km: d.km, t: d[l].t, g: d[l].g, season: d[l].season || "", hours: d[l].hours || "", visa: d[l].visa || "", m: d.m, beach: !!d.beach, near: t.nearest(day(d.date, l), d.nights) })),
    months: t.months, mon: MON[l],
    t: {
      from: t.from, perOne: t.perOne, perP: t.perP, total: t.total, nightsW: t.nightsW, see: t.see, seeTours: t.seeTours, wait: t.wait, waitDone: t.waitDone,
      rezKick: t.rezKick, pickKick: t.pickKick, pickT: l === "uz" ? "Byudjet @B, @P, @M: mana 3 ta davlat" : "На @B, @P, @M: вот 3 страны", left: t.left("@"), over: t.over("@"), hotel: t.hotel("@"), meal: t.meal, cheapest: t.cheapest,
      season: t.season, flight: t.flight, visa: t.visa, km: t.km, days: [t.d1, t.dMid, t.dLast], vouF: t.vouF, vouRoom: t.vouRoom, vouHotel: t.vouHotel, vouFloor: t.vouFloor,
      cancelD: t.cancelD, cancelOk: t.cancelOk, cancelNo: t.cancelNo, who2: t.who2("@A", 0), who2k: t.who2("@A", "@K"), msg: t.msg({ dest: "@D", when: "@W", who: "@P", hotel: "@H", nights: "@N", sum: "@S", name: "@NM", phone: "@PH", note: "@NT" }),
      day: l === "uz" ? "@D-@M" : "@D @M", forOne: t.perOne, forTwo: l === "uz" ? "ikki kishiga" : "на двоих", forFam: l === "uz" ? "oilaga 2+1" : "на семью 2+1", spec: t.specT, mine: t.mine, stNow: t.stNow,
    },
    spec: { dest: "turkey", total: D.SPECIAL.now, nights: D.SPECIAL.nights },
    offer: { items: ADDONS.map((a) => ({ id: a.id, t: a[l].t, p: a.price })), base: BASE.promo, baseName: BASE[l].t, hours: OFFER_HOURS, head: t.head, totalW: t.totalW, copied: t.copied, ended: t.ended },
  };
}

function page(l) {
  const t = T[l], other = l === "uz" ? "ru" : "uz";
  return `<!doctype html>
<html lang="${l}">
<head>
${headTags(l)}
<script>(function(){var r=document.documentElement;r.classList.add('js');var calm=false;try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)calm=true}catch(e){}try{var c=navigator.connection;if(c&&c.saveData)calm=true}catch(e){}if(calm)r.classList.add('calm')})()</script>
<script type="application/ld+json">${json(ld(l))}</script>
@@S@@
</head>
<body class="site">
${dzIntroSolo(l)}
${sprite()}
<a class="skip" href="#main">${t.skip}</a>
<header class="top" id="top"><div class="wrap">
<a class="logo" href="${href(l)}" aria-label="${B.name}, ${t.home}">${logo()}</a>
<nav class="nav" aria-label="${t.navL}">${t.nav.map(([u, n]) => `<a href="${u}">${n}</a>`).join("")}</nav>
<div class="top-r"><a class="lang" href="${href(other)}" hreflang="${other}" aria-label="${t.langName}">${t.lang}</a><a class="top-ph" href="${tel}" aria-label="${t.call}">${ic("phone")}<span>${B.phone}</span></a><a class="top-tg" href="${B.tg}" aria-label="Telegram">${ic("tg")}</a><button type="button" class="mine" id="mine" hidden>${t.mine}</button></div>
</div></header>
<main id="main">
${[heroBlock(l), rezBlock(l), mapBlock(l), garBlock(l), specBlock(l), uslBlock(l), clubBlock(l), otzBlock(l), ctBlock(l), nowBlock(l), offerBlock(l)].join("\n")}
</main>
<footer class="foot"><div class="wrap">
<div class="cols">
<div>${logo("f-logo")}<p class="f-d">${B.offices[0][l].a}, ${l === "uz" ? "Toshkent" : "Ташкент"}. ${B.hours[l]}.</p><ul class="f-c"><li>${ic("phone")}<a href="${tel}">${B.phone}</a></li><li>${ic("tg")}<a href="${B.tg}">${B.tgName}</a></li><li>${ic("tg")}<a href="${B.channel}">${B.channelName}</a></li><li>${ic("ig")}<a href="${B.ig}">${B.igName}</a></li></ul></div>
<div><b>DevUz Studio</b><ul><li><a href="https://devuz.studio">devuz.studio</a></li><li><a href="https://t.me/Devuz_studio_bot?start=semtravel">Telegram</a></li></ul></div>
<div><b>${t.footD}</b><ul>${t.footL.map((x) => `<li>${x}</li>`).join("")}<li>${t.photos}</li></ul></div>
</div>
<div class="rights"><span>${t.mock}</span><a href="https://devuz.studio/${l}/mockup-terms">${t.terms}</a></div>
</div></footer>
<div class="dock" id="dock"><a class="btn btn-sun" href="#poisk" data-to-search>${ic("search")}<span>${t.pickBtn}</span></a><a class="btn btn-call" href="${tel}" aria-label="${t.call}">${ic("phone")}</a><a class="btn btn-call" href="${B.tg}" aria-label="Telegram">${ic("tg")}</a></div>
${tourSheet(l)}
${bronSheet(l)}
<script type="application/json" id="st-site">${json(siteData(l))}</script>
<script src="${IMG}/gsap.min.js"></script>
<script src="${IMG}/ScrollTrigger.min.js"></script>
@@J@@
</body>
</html>`;
}

const out = { "": page("uz"), ru: page("ru") };
const parts = {
  S: `<style>${min(read("site.css"))}</style>`,
  J: `<script>\n${strip(read("site.js"))}</script>`,
};
const fill = (p) => Object.entries(parts).reduce((s, [n, part]) => s.split(`@@${n}@@`).join(part), p);

for (const v of Object.values(out)) for (const m of fill(v).matchAll(/\/protos\/semtravel\/[\w./-]+\.(?:webp|png|js)/g)) if (!existsSync(PUB + m[0])) console.warn("нет файла", m[0]);
mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, fill(v)]))));
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
writeFileSync(bundleDir + "semtravel.json", JSON.stringify({ parts, pages: out }));
for (const [k, v] of Object.entries(out)) console.log((k || "(uz)").padEnd(8), fill(v).length);
