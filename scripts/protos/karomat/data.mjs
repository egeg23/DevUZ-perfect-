import { readFileSync } from "node:fs";

/*
 * Факты Karomat для макета. Откуда что (16.10.2026):
 *  - название, адрес, телефон, часы, Instagram, YouTube, тексты отзывов —
 *    karomat-restaurant.uz (главная, /about, /contact);
 *  - меню: блюда, разделы, цены в сумах, варианты «большой / маленький»,
 *    фото — API, которое читает их страница /menu
 *    (karomat.felixits.uz/api/category/?filial=17&type=1, menu-src.json);
 *    там же у зала «RESTAURANT» стоит 15% — это обслуживание в их системе;
 *  - видео — их Shorts на youtube.com/@Karomat_restaurant.
 * Русские названия блюд — как в их меню, с исправленными опечатками
 * («Свежый» → «Свежий»); узбекские — наш перевод тех же названий.
 * Схема зала, заказы, брони, банкеты в панели — демо, так и подписано.
 */

const SRC = JSON.parse(readFileSync(new URL("./menu-src.json", import.meta.url), "utf8"));

export const BRAND = {
  name: "Karomat",
  full: "Karomat Restaurant",
  phone: "+998 (71) 271-50-52",
  phoneRaw: "+998712715052",
  ig: "karomatrestaurant",
  yt: "https://www.youtube.com/@Karomat_restaurant",
  site: "https://www.karomat-restaurant.uz",
  map: "https://yandex.uz/maps/org/223173940753/",
  addr: ["Ташкент, ул. Фозилтепа, 10А", "Toshkent, Foziltepa ko‘chasi, 10A"],
  hours: ["Каждый день 10:00-22:30", "Har kuni 10:00-22:30"],
  open: [10, 0], close: [22, 30],
  service: SRC.service,
};

/* Разделы приложения: из разделов их меню, «Европейская кухня» с одним
   блюдом без внятной цены не берём, бар разбит на чай, кофе и напитки. */
export const CATS = [
  { id: "salat", sub: [321], ic: "leaf", n: ["Салаты", "Salatlar"] },
  { id: "gazak", sub: [322], ic: "board", n: ["Закуски", "Gazaklar"] },
  { id: "shorva", sub: [323], ic: "bowl", n: ["Супы", "Sho‘rvalar"] },
  { id: "non", sub: [324], ic: "bread", n: ["Хлеб из тандыра", "Tandir nonlari"] },
  { id: "milliy", sub: [325], ic: "kazan", n: ["Узбекская кухня", "O‘zbek taomlari"] },
  { id: "uygur", sub: [326], ic: "noodle", n: ["Уйгурская кухня", "Uyg‘ur taomlari"] },
  { id: "turk", sub: [327], ic: "dome", n: ["Турецкая кухня", "Turk taomlari"] },
  { id: "shashlik", sub: [328], ic: "skewer", n: ["Шашлыки", "Shashliklar"] },
  { id: "pide", sub: [330], ic: "pizza", n: ["Пицца и пиде", "Pitsa va pide"] },
  { id: "desert", sub: [331], ic: "cake", n: ["Десерты", "Desertlar"] },
  { id: "bar", sub: [332, 333, 334, 335], ic: "cup", n: ["Чай, кофе, напитки", "Choy, qahva, ichimliklar"] },
];

/* id → [ru, uz]. Ru — их название, опечатки исправлены. */
const NAMES = {
  3708: ["Салат «Бодрум»", "«Bodrum» salati"], 3709: ["Салат «Рома»", "«Roma» salati"], 3710: ["Тулум с сыром", "Pishloqli tulum"],
  3711: ["Фирменный салат", "Firma salati"], 3712: ["Салат «Измир»", "«Izmir» salati"], 3713: ["Салат «Микс»", "«Miks» salati"],
  3714: ["Тайский салат", "Tay salati"], 3715: ["Салат «Сюрприз»", "«Syurpriz» salati"], 3716: ["Французский салат", "Fransuz salati"],
  3717: ["Салат «Корона»", "«Korona» salati"], 3718: ["Ачик-чучук", "Achchiq-chuchuk"], 3719: ["Грибы со сливками", "Qaymoqli qo‘ziqorin"],
  3720: ["Мимоза", "Mimoza"], 3722: ["Мужской каприз", "«Erkak kaprizi» salati"], 3723: ["Салат «Марсель»", "«Marsel» salati"],
  3724: ["Японский салат", "Yapon salati"], 3725: ["Цезарь с курицей", "Tovuqli Sezar"], 3726: ["Греческий салат", "Grek salati"],
  3727: ["Хрустящий баклажан", "Qarsildoq baqlajon"], 3728: ["Салат «Каромат»", "«Karomat» salati"], 3729: ["Сельдь под шубой", "Shuba ostidagi seld"],
  3730: ["Оливье", "Olivye"], 3731: ["Мясное ассорти", "Go‘shtli assorti"], 3732: ["Сельдь по-русски", "Ruscha seld"],
  3733: ["Овощное ассорти", "Sabzavotli assorti"], 3734: ["Зелень ассорти", "Ko‘katlar assortisi"], 3735: ["Свежее ассорти", "Yangi uzilgan assorti"],
  3736: ["Маринованное ассорти", "Marinadlangan assorti"], 3737: ["Сырное ассорти", "Pishloqli assorti"], 3738: ["Соленья ассорти", "Tuzlama assorti"],
  3739: ["Холодец", "Xolodets"], 3740: ["Сузьма", "Suzma"],
  3741: ["Чечевичный суп", "Yasmiq sho‘rva"], 3742: ["Мампар", "Mampar"], 3743: ["Окрошка", "Okroshka"], 3744: ["Куриный бульон", "Tovuq sho‘rva"],
  3745: ["Шурпа", "Sho‘rva"], 3746: ["Суп с фрикадельками", "Frikadelkali sho‘rva"], 3747: ["Пельмени", "Chuchvara"],
  3748: ["Афганский хлеб", "Afg‘on noni"], 3749: ["Пуф нон", "Puf non"], 3750: ["Тандыр ассорти", "Tandir assorti"], 3751: ["Турецкий хлеб", "Turk noni"],
  3752: ["Ассорти «Каромат» большое", "Katta «Karomat» assorti"], 3753: ["Шансу", "Shansu"], 3754: ["Вагури, 1 кг", "Vag‘uri, 1 kg"],
  3755: ["Каромат ассорти", "Karomat assorti"], 3756: ["Баранья шейка", "Qo‘y bo‘yni"], 3757: ["Шилпилдок", "Shilpildoq"],
  3758: ["Нохат шорак", "No‘xat sho‘rak"], 3759: ["Бифштекс", "Bifshteks"], 3760: ["Тушёнка", "Dimlama go‘sht"], 3761: ["Нарын, 1 кг", "Norin, 1 kg"],
  3762: ["Сазан, 1 кг", "Zog‘ora baliq, 1 kg"], 3763: ["Судак, 1 кг", "Sudak, 1 kg"], 3764: ["Табака, 1 кг", "Tabaka, 1 kg"],
  3765: ["Голень, 1 кг", "Tovuq boldiri, 1 kg"], 3766: ["Крылышки, 1 кг", "Qanotchalar, 1 kg"], 3767: ["Ток долма", "Tok do‘lma"],
  3768: ["Думгаза", "Dumg‘aza"], 3769: ["Олот самса, 8 штук", "Olot somsa, 8 dona"],
  3770: ["Сай", "Say"], 3771: ["Уйгурский лагман", "Uyg‘urcha lag‘mon"], 3772: ["Сумборо", "Sumboro"], 3773: ["Сокоро", "Sokoro"],
  3775: ["Баклажанные рулетики", "Baqlajon ruletlari"], 3776: ["Керамит дана", "Keramit dana"], 3777: ["Керамит кёфте", "Keramit kofte"],
  3778: ["Дёнер бейти", "Dyoner beyti"], 3779: ["Томбик эт дёнер", "Tombik et dyoner"], 3780: ["Тандыр лаваш", "Tandir lavash"],
  3781: ["Искандер", "Iskandar"], 3782: ["Дёнер сервис", "Dyoner servis"], 3783: ["Тандыр бейти", "Tandir beyti"], 3784: ["Баранья корейка", "Qo‘y koreykasi"],
  3785: ["Изгара кёфте", "Izgara kofte"], 3786: ["Куриный мангал", "Tovuq mangal"], 3787: ["Котлеты с сыром", "Pishloqli kotletlar"], 3788: ["Рулет", "Rulet"],
  3789: ["Ассорти от шефа", "Oshpazdan assorti"], 3790: ["Шохона", "Shohona"], 3791: ["Мангал ассорти", "Mangal assorti"], 3792: ["Шашлык из фарша", "Qiyma shashlik"],
  3793: ["Куриный шашлык", "Tovuq shashlik"], 3794: ["Ассорти шашлык", "Assorti shashlik"], 3795: ["Кусковой шашлык", "Bo‘lak go‘sht shashlik"],
  3796: ["Шашлык «Наполеон»", "«Napoleon» shashlik"], 3797: ["Люля ассорти", "Lyulya assorti"],
  3806: ["Лахмаджун", "Lahmajun"], 3807: ["Кушбашлы пиде", "Kushbashli pide"], 3808: ["Дёнер пиде", "Dyoner pide"], 3809: ["Карышык пиде", "Karishik pide"],
  3810: ["Пицца с курицей", "Tovuqli pitsa"], 3811: ["Пепперони", "Pepperoni"], 3812: ["Мясная пицца", "Go‘shtli pitsa"], 3813: ["Пицца «Фантазия»", "«Fantaziya» pitsa"],
  3814: ["Пицца «Хан»", "«Xon» pitsa"], 3815: ["Пицца «4 сеньора»", "«4 senyor» pitsa"], 3816: ["Картофель фри", "Kartoshka fri"],
  3817: ["Трилече", "Trilyeche"], 3818: ["Сан-Себастьян", "San-Sebastyan"], 3819: ["Катмер", "Katmer"], 3820: ["Пахлава", "Paxlava"],
  3821: ["Чизкейк Сан-Себастьян с брауни", "Braunili San-Sebastyan chizkeyk"], 3822: ["Чизкейк «Дубай»", "«Dubay» chizkeyk"], 3823: ["Чизкейк «Лотус»", "«Lotus» chizkeyk"],
  3824: ["Чизкейк «Орео»", "«Oreo» chizkeyk"], 3825: ["Фисташковый чизкейк", "Pistali chizkeyk"], 3826: ["Клубничный чизкейк", "Qulupnayli chizkeyk"],
  3827: ["Меренговый рулет", "Merengli rulet"], 3828: ["Торт «Фисташка и клубника»", "«Pista va qulupnay» torti"], 3829: ["Торт «Сникерс» с фундуком", "Funduqli «Snikers» torti"],
  3830: ["Пирожное «Маликабону»", "«Malikabonu» pirojniysi"], 3831: ["Фруктовое ассорти", "Mevali assorti"], 3832: ["Мороженое", "Muzqaymoq"],
  3833: ["Чай в бардаке", "Bardak choy"], 3834: ["Имбирный чай", "Zanjabilli choy"], 3835: ["Ягодный чай", "Rezavorli choy"], 3836: ["Чай «Микс»", "«Miks» choy"],
  3837: ["Чёрный чай", "Qora choy"], 3838: ["Зелёный чай", "Ko‘k choy"], 3839: ["Чай с лимоном", "Limonli choy"],
  3841: ["Эспрессо", "Espresso"], 3842: ["Латте", "Latte"], 3843: ["Капучино", "Kapuchino"], 3844: ["Лимонады", "Limonadlar"], 3845: ["Напитки", "Ichimliklar"],
};

/* Варианты порций: их слова → [ru, uz]. */
const VAR = {
  "Большой": ["Большая", "Katta"], "Маленький": ["Маленькая", "Kichik"], "Средный": ["Средняя", "O‘rtacha"], "Сыром": ["С сыром", "Pishloqli"],
  "1 шарик": ["1 шарик", "1 sharcha"], "Мохито": ["Мохито", "Moxito"], "/start": ["/start", "/start"], "Тархун": ["Тархун", "Tarxun"],
};
const vname = (s) => VAR[s] || [s, s.replace(/л$/, " l").replace("Кола, Фанта, Пепси", "Cola, Fanta, Pepsi").replace("Минеральная вода", "Mineral suv").replace("Сок Дена", "Dena sharbati").replace("Боржоми", "Borjomi").replace("Флеш", "Flash").replace("Редбул", "Red Bull").replace("Чорток", "Chortoq").replace(/,(\d)/, ".$1").replace(" l", " l")];

/* Метки для фильтров — по названию блюда, не по составу: состав знает
   только кухня, в панели метки ставит ресторан. Так и подписано. */
const VEG = [3710, 3718, 3719, 3726, 3727, 3733, 3734, 3735, 3736, 3737, 3738, 3740, 3741, 3748, 3749, 3750, 3751, 3816, 3767];
const KIDS = [3744, 3746, 3747, 3787, 3810, 3816, 3832, 3831, 3725, 3759];
const SHARE = [3731, 3737, 3750, 3752, 3753, 3754, 3755, 3762, 3763, 3764, 3768, 3769, 3770, 3789, 3790, 3791, 3794, 3797, 3831];
const HIT = [3745, 3771, 3790, 3755, 3758, 3781, 3818, 3833, 3789, 3767, 3794, 3749];

const subCat = Object.fromEntries(CATS.flatMap((c) => c.sub.map((s) => [s, c.id])));
export const MENU = SRC.items
  .filter((it) => subCat[it.sub] && NAMES[it.id] && (it.price > 1000 || it.v.length))
  .map((it) => {
    const v = it.v.map(([n, p]) => ({ n: vname(n), p })).sort((a, b) => a.p - b.p);
    return {
      id: it.id, cat: subCat[it.sub], n: NAMES[it.id], price: v.length ? v[0].p : it.price, v,
      tags: [VEG.includes(it.id) && "veg", KIDS.includes(it.id) && "kids", SHARE.includes(it.id) && "share", HIT.includes(it.id) && "hit"].filter(Boolean),
      /* Описание — их текст; длинное тире заменяем двоеточием (правило макетов), кириллицу в узбекском — латиницей. */
      d: it.d && it.d.length > 40 ? it.d.replace(/\s+[—–-]\s+/g, ": ").replace(/[“"]Бардак чай[”"]/g, "«Bardak choy»").replace(/“|”/g, "") : "",
    };
  });

/* Блюда сцены «дастархан» по порядку: какое ложится первым. */
export const TABLE = [3789, 3745, 3771, 3767, 3758, 3764, 3750, 3781, 3818];

/* Отзывы — с Яндекс Карт (yandex.uz/maps/org/223173940753/reviews, 16.10.2026):
   оценка 4,5, 863 оценки, 146 отзывов. Текст — как у автора, сокращён только
   многоточием; на втором языке — наш перевод, так и подписано. d — блюдо,
   о котором отзыв (0 — отзыв о зале). Отзывы с их сайта (Akmal Tursunov и
   др.) не берём: на настоящие отзывы они не похожи. */
export const RATING = { value: "4,5", count: 863, reviews: 146, url: "https://yandex.uz/maps/org/223173940753/reviews/" };
export const REVIEWS = [
  { a: "Fotima Igamberdiyeva", r: 5, d: 3781, o: "uz",
    uz: "Ovqatlari hammasi mazzali: iskandar kabeb, qarsillama baliq, Karomat spes salatligi 👍 Borganimizda bardak choy bn Turk pahlavasini bonusga berishgan.",
    ru: "Всё вкусно: искандер-кебаб, хрустящая рыба, фирменный салат «Каромат». Когда мы пришли, бардак-чай и турецкую пахлаву дали в подарок." },
  { a: "Замира Абдушукурова", r: 5, d: 3764, o: "ru",
    ru: "Очень вкусно готовят. Особенно табака очень вкусная. Салаты тоже очень вкусные на выбор. Цены доступны.",
    uz: "Juda mazali pishirishadi. Ayniqsa tabaka juda mazali. Salatlar ham tanlov uchun juda mazali. Narxlar hamyonbop." },
  { a: "Баходир Туляганов", r: 5, d: 0, o: "ru",
    ru: "Прекрасный банкетный зал, в котором можно проводить свадебные и иные торжества… Недавно в нём проведён капитальный ремонт, после которого там стало ещё более комфортно и уютно.",
    uz: "To‘y va boshqa tantanalarni o‘tkazish mumkin bo‘lgan ajoyib banket zali… Yaqinda kapital ta’mir qilindi, shundan keyin yanada qulay va shinam bo‘ldi." },
  { a: "Анастасия Шакарова", r: 5, d: 3766, o: "ru",
    ru: "Персонал отличный, вкусно готовят, безумно любят мои дети крылышки в этом заведении. Атмосфера уютная.",
    uz: "Xodimlar a’lo, mazali pishirishadi, bolalarim bu yerdagi qanotchalarni juda yaxshi ko‘rishadi. Muhit shinam." },
  { a: "Tadjiev Rustam", r: 5, d: 3732, o: "ru",
    ru: "Вкусные блюда, мясо жареное объедение, селёдка по-русски пальчики оближешь, ну а шашлык… Это длится на протяжении 6 лет.",
    uz: "Mazali taomlar, qovurilgan go‘sht a’lo, ruscha seld barmoq yalatadi, shashlik esa… Bu 6 yildan beri shunday." },
  { a: "Dilyora Muslimova", r: 5, d: 0, o: "uz",
    uz: "To‘yxonani juda chiroyli qilib ta’mirlashibdi. Hamma narsa yangi remontdan chiqqanligi bilinib turibdi. Personal xizmati yaxshi.",
    ru: "Свадебный зал очень красиво отремонтировали, всё видно, что после свежего ремонта. Персонал работает хорошо." },
];

/* Их Shorts на YouTube: название как в канале. */
export const SHORTS = [
  { id: "FRk4jQr8EPQ", t: "Shohona taom 😍😋 Birgalikda tayorlandi 🔥 Karomat❤️", dish: 3790 },
  { id: "wmBCzrHgQWQ", t: "Karomat❤️ Goooo 😍 San sebastyan", dish: 3818 },
  { id: "QwgbFC56oCA", t: "Restoranimizni noni kelilar ta’tib ko’rilar", dish: 3749 },
  { id: "ME9ktNqbSjE", t: "Shef ijod qildilar 🔥", dish: 3789 },
  { id: "1xF1EhZ8FfA", t: "Karomat bu eng togri tanlov", dish: 3808 },
];

/* Схема зала — пример: настоящую расстановку берём у ресторана.
   x, y, w, h в единицах сетки 100×64; s — мест; r — круглый. */
export const HALL = [
  { id: 1, x: 6, y: 8, w: 10, h: 10, s: 2, r: 1 }, { id: 2, x: 22, y: 8, w: 10, h: 10, s: 2, r: 1 }, { id: 3, x: 38, y: 7, w: 14, h: 12, s: 4 },
  { id: 4, x: 58, y: 7, w: 14, h: 12, s: 4 }, { id: 5, x: 78, y: 7, w: 16, h: 12, s: 6 },
  { id: 6, x: 6, y: 27, w: 14, h: 12, s: 4 }, { id: 7, x: 26, y: 26, w: 13, h: 13, s: 4, r: 1 }, { id: 8, x: 45, y: 26, w: 13, h: 13, s: 4, r: 1 },
  { id: 9, x: 64, y: 25, w: 30, h: 14, s: 10 },
  { id: 10, x: 6, y: 46, w: 14, h: 12, s: 4 }, { id: 11, x: 26, y: 46, w: 16, h: 12, s: 6 }, { id: 12, x: 48, y: 46, w: 16, h: 12, s: 6 },
  { id: 13, x: 70, y: 46, w: 24, h: 12, s: 8 },
];

/* Банкетный стол на 10 гостей: блюда и сколько — пример расчёта по их
   ценам; ресторан правит его в панели. */
export const BANQUET = {
  per: 10,
  items: [
    { id: 3718, q: 2 }, { id: 3728, q: 2 }, { id: 3725, q: 1 }, { id: 3733, q: 1 }, { id: 3734, q: 1 }, { id: 3738, q: 1 },
    { id: 3750, q: 2 }, { id: 3755, q: 1, v: 1 }, { id: 3794, q: 2 }, { id: 3831, q: 1, v: 0 }, { id: 3833, q: 10 },
  ],
  extra: [3745, 3767, 3790, 3818, 3820, 3844],
  kinds: [
    { id: "bday", n: ["День рождения", "Tug‘ilgan kun"] },
    { id: "toy", n: ["Свадьба, фотиха", "To‘y, fotiha"] },
    { id: "corp", n: ["Корпоратив", "Korporativ"] },
    { id: "family", n: ["Семейный вечер", "Oilaviy kecha"] },
  ],
};

/* Что увидели на их сайте сейчас и что станет. */
export const NOW = [
  { now: ["На странице «Меню» пусто, пока не выберешь раздел, а раздел нигде не назван", "«Menyu» sahifasi bo‘lim tanlanmaguncha bo‘sh, bo‘lim esa hech qayerda ko‘rsatilmagan"], next: ["Меню открыто сразу: 127 блюд с фото и ценой, разделы и фильтры", "Menyu darhol ochiq: rasm va narxli 127 taom, bo‘limlar va filtrlar"] },
  { now: ["На главной «Tez ovqat»: ресторан выглядит как фастфуд", "Bosh sahifada «Tez ovqat»: restoran fastfudga o‘xshab qoladi"], next: ["Дастархан из ваших блюд и «узбекская, турецкая и уйгурская кухня»", "Taomlaringizdan dasturxon va «o‘zbek, turk va uyg‘ur oshxonasi»"] },
  { now: ["Цифры с перепутанными подписями: «120+ Yillik tajriba»", "Yozuvlari adashgan raqamlar: «120+ Yillik tajriba»"], next: ["Только то, что гость проверит сам: меню, адрес, часы", "Faqat mehmon o‘zi tekshira oladigan narsa: menyu, manzil, soatlar"] },
  { now: ["Кнопка «Videoni ko‘rish» никуда не ведёт", "«Videoni ko‘rish» tugmasi hech qayerga olib bormaydi"], next: ["Ваши Shorts с кухни прямо на странице", "Oshxonadagi Shorts videolaringiz to‘g‘ridan-to‘g‘ri sahifada"] },
  { now: ["Ни заказа, ни брони, ни банкета: только номер телефона", "Na buyurtma, na bron, na banket: faqat telefon raqami"], next: ["Заказ, стол на схеме зала и расчёт банкета в два касания", "Buyurtma, zal sxemasida stol va banket hisobi ikki bosishda"] },
];
