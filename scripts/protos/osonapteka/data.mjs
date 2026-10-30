// Факты Oson Apteka — только с их сайта osonapteka.uz (главная, страницы
// лекарств, «Для аптек», продукт «Oson Apteka»), снято 30.10.2026.
// Лекарства и цены «от» — catalog.json (catalog.py), фото — photos.json
// (photos.py). Чего у них нет, здесь нет: цен по отдельным аптекам, имён
// аптек, сроков, которых они не называли. Источники — SOURCES.md.
import { readFileSync } from "node:fs";

const DIR = new URL(".", import.meta.url).pathname;
const RAW = JSON.parse(readFileSync(DIR + "catalog.json", "utf8"));
export const PHOTOS = JSON.parse(readFileSync(DIR + "photos.json", "utf8"));

export const LANGS = ["ru", "uz"];

export const COMPANY = {
  name: "Oson Apteka",
  phone: "+998 71 203 67 66",
  tel: "+998712036766",
  bot: "osonaptekabot",
  tg: "osonapteka_uz",
  ig: "osonapteka",
  fb: "osonaptekauz",
  site: "https://osonapteka.uz",
  ios: "https://osonapteka.uz/app?to=ios&d=site",
  android: "https://osonapteka.uz/app?to=play-market&d=site",
  business: "https://osonapteka.uz/business",
};

/* Кириллица → узбекская латиница: названия лекарств у них по-русски и на
   узбекской странице, а узбекская страница макета пишется латиницей. */
const TR = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "x", ц: "ts", ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "i", ь: "", э: "e", ю: "yu", я: "ya" };
export function latin(s) {
  return String(s).replace(/[А-Яа-яЁё]/g, (c) => {
    const l = c.toLowerCase(), r = TR[l] ?? "";
    return c === l ? r : r.charAt(0).toUpperCase() + r.slice(1);
  }).replace(/№/g, "N");
}

/* Действующее вещество — по их же коду АТХ (ВОЗ) и составу на их странице.
   Где код означает комбинацию, пишем то, что указано в их составе. */
const INN = {
  "D03AX03": { ru: "декспантенол", uz: "dekspantenol" },
  "R06AB03": { ru: "диметинден", uz: "dimetinden" },
  "C01BD01": { ru: "амиодарон", uz: "amiodaron" },
  "M01AX17": { ru: "нимесулид", uz: "nimesulid" },
  "N04BB01": { ru: "амантадин", uz: "amantadin" },
  "M03BX04": { ru: "толперизон + лидокаин", uz: "tolperizon + lidokain" },
  "B03AA07": { ru: "железа сульфат", uz: "temir sulfat" },
  "R03AL01": { ru: "фенотерол + ипратропия бромид", uz: "fenoterol + ipratropiy bromid" },
  "D10BA01": { ru: "изотретиноин", uz: "izotretinoin" },
  "M01AX05": { ru: "глюкозамин", uz: "glyukozamin" },
  "B05XB01": { ru: "аргинин", uz: "arginin" },
  "C05BA53": { ru: "гепарин + бензокаин + бензилникотинат", uz: "geparin + benzokain + benzilnikotinat" },
  "B02BC": { ru: "натрия альгинат", uz: "natriy alginat" },
};

/* Форма выпуска словом — по их названию (таб., капс., мазь…). */
const FORMS = [
  [/супп/i, { ru: "свечи", uz: "shamchalar" }, "supp"],
  [/р-р д\/(инф|ин)\.|пор\. д\/ин/i, { ru: "для инъекций", uz: "in’ektsiya uchun" }, "inj"],
  [/таб/i, { ru: "таблетки", uz: "tabletkalar" }, "tab"],
  [/капс/i, { ru: "капсулы", uz: "kapsulalar" }, "tab"],
  [/мазь/i, { ru: "мазь", uz: "malham" }, "ext"],
  [/капли/i, { ru: "капли", uz: "tomchilar" }, "liq"],
  [/гранулы|пор\./i, { ru: "порошок", uz: "kukun" }, "liq"],
  [/р-р/i, { ru: "раствор", uz: "eritma" }, "liq"],
];
export const FORM_KINDS = { tab: { ru: "Таблетки и капсулы", uz: "Tabletka va kapsulalar" }, liq: { ru: "Капли, растворы, порошки", uz: "Tomchi, eritma, kukun" }, ext: { ru: "Мази", uz: "Malhamlar" }, supp: { ru: "Свечи", uz: "Shamchalar" }, inj: { ru: "Для инъекций", uz: "In’ektsiya uchun" } };

/* Их тексты инструкций: длинные тире — по правилу макетов (двоеточие, запятая). */
const MARK = /уникальн|инновацион|идеальн/i; // штампы ИИ (lib/proto/plain-text.ts): такие фразы из инструкции не берём
const plain = (s) => s.replace(/^\s*[\u2014\u2013-]\s*/, "").replace(/\s+[\u2014\u2013-]\s+/g, ": ").replace(/\s*[\u2014\u2013]\s*/g, ", ").replace(/\s+/g, " ").trim()
  .split(/(?<=\.)\s+/).filter((x) => !MARK.test(x)).join(" ");

/* «Пенталгин-ICN» и пр.: короткое имя до первой формы выпуска. */
const short = (n) => /^Гепариновая мазь/.test(n) ? "Гепариновая мазь" : n.split(/ (?:супп|р-р|таб|гранулы|капли|мазь|пор|капс)\.?/)[0].trim();

export const CATALOG = RAW.items.map((it, i) => {
  const f = FORMS.find(([re]) => re.test(it.name)) ?? [null, { ru: "", uz: "" }, "liq"];
  const country = (s) => (s.match(/\(([^)]+)\)\s*$/) ?? [])[1] ?? "";
  return {
    id: i,
    slug: it.slug,
    url: it.url,
    name: { ru: it.name.replace(/\s+/g, " "), uz: latin(it.name.replace(/\s+/g, " ")) },
    short: { ru: short(it.name), uz: latin(short(it.name)) },
    brand: { ru: it.brand, uz: latin(it.brand) },
    maker: { ru: it.maker, uz: latin(it.maker) },
    country: { ru: country(it.brand), uz: latin(country(it.brand)) },
    atc: it.atc,
    atcName: it.atcName,
    inn: INN[it.atc] ?? null,
    form: f[1],
    kind: f[2],
    price: Math.round(it.price),
    /* Штук в упаковке — из их названия («№30»); у растворов №1 цены за штуку нет. */
    cnt: Number((it.name.match(/№\s*(\d+)/) ?? [])[1] ?? 1),
    rx: it.rx,
    sec: Object.fromEntries(Object.entries(it.sec).map(([k, v]) => [k, plain(v)])),
  };
});

/* Регионы, как в их выборе «По всему Узбекистану» (14), и районы Ташкента. */
export const REGIONS = {
  ru: ["Ташкент", "Ташкентская область", "Андижан", "Бухара", "Джизак", "Кашкадарья", "Навои", "Наманган", "Республика Каракалпакстан", "Самарканд", "Сурхандарья", "Сырдарья", "Фергана", "Хорезм"],
  uz: ["Toshkent", "Toshkent viloyati", "Andijon", "Buxoro", "Jizzax", "Qashqadaryo", "Navoiy", "Namangan", "Qoraqalpog‘iston Respublikasi", "Samarqand", "Surxondaryo", "Sirdaryo", "Farg‘ona", "Xorazm"],
};
export const DISTRICTS = {
  ru: ["Алмазар", "Бектемир", "Мирабад", "Мирзо-Улугбек", "Сергели", "Учтепа", "Чиланзар", "Шайхантахур", "Юнусабад", "Яккасарай", "Янгихаёт", "Яшнабад"],
  uz: ["Olmazor", "Bektemir", "Mirobod", "Mirzo Ulug‘bek", "Sergeli", "Uchtepa", "Chilonzor", "Shayxontohur", "Yunusobod", "Yakkasaroy", "Yangihayot", "Yashnobod"],
};

/* Их слова о себе: главная, «Для аптек», страница продукта Oson Apteka. */
export const FACTS = {
  ru: {
    tagline: "Найти лекарство в Oson Apteka просто!",
    free: "Справочник лекарств полностью бесплатный для пользователей.",
    pharmacies: "3500 аптек привлекают клиентов с помощью приложения Oson Apteka и увеличивают продажи.",
    itpark: "С 2020 года резидент IT Park Uzbekistan.",
    firstMonth: "Первый месяц пользования Oson Apteka абсолютно бесплатно.",
    install: "Программа для аптеки весит 5 МБ, установка займёт 5 минут, специалисты могут установить её сами дистанционно.",
    systems: "Интегрируется с программами аптек: FOM, ABU, 1С.",
    support: "Техническая поддержка 24/7.",
  },
  uz: {
    tagline: "Oson Apteka’da dori topish oson!",
    free: "Dorilar ma’lumotnomasi foydalanuvchilar uchun mutlaqo bepul.",
    pharmacies: "3500 dorixona Oson Apteka ilovasi orqali mijoz jalb qiladi va savdosini oshiradi.",
    itpark: "2020 yildan IT Park Uzbekistan rezidenti.",
    firstMonth: "Oson Apteka’dan foydalanishning birinchi oyi mutlaqo bepul.",
    install: "Dorixona uchun dastur 5 MB, o‘rnatish 5 daqiqa oladi, mutaxassislar uni masofadan o‘zlari o‘rnatib berishi mumkin.",
    systems: "Dorixona dasturlari bilan integratsiya: FOM, ABU, 1C.",
    support: "Texnik yordam 24/7.",
  },
};

/* Пять их шагов со страницы продукта Oson Apteka. */
export const STEPS = {
  ru: [
    ["Скачать", "Приложение Oson Apteka в Play Market или App Store, или бот @osonaptekabot."],
    ["Найти", "Ищите нужное лекарство по адресу: адрес аптеки и номер телефона."],
    ["Купить", "Сходите в аптеку по адресу и, сэкономив время, купите лекарство."],
    ["Сканировать чек", "Отсканируйте чек покупки в приложении и получите кэшбэк."],
    ["Перевести на карту", "Подключите карту в приложении и переведите кэшбэк на неё."],
  ],
  uz: [
    ["Yuklab olish", "Oson Apteka ilovasi Play Market yoki App Store’da, yoki @osonaptekabot."],
    ["Topish", "Kerakli dorini manzil bo‘yicha qidiring: dorixona manzili va telefon raqami."],
    ["Sotib olish", "Manzil bo‘yicha dorixonaga boring va vaqtni tejab, dorini xarid qiling."],
    ["Chekni skanerlash", "Xarid chekini ilovada skanerlang va keshbek oling."],
    ["Kartaga o‘tkazish", "Ilovaga kartangizni ulang va keshbekni unga o‘tkazing."],
  ],
};

/* Отзывы — с их страницы продукта Oson Apteka, дословно, с их датами. */
export const REVIEWS = [
  { n: "Anvar Dadaev", d: "20.06.2022", lang: "uz", t: "Dori-darmonlarni tez-tez sotib olaman, chunki qandli diabet, ba’zida butun shahar bo‘ylab yugurib, barcha dorixonalarni qidirishga to‘g‘ri keldi, endi bu masalada ajoyib yordamchi bor, ilova kerakli dori-darmon va dorixona manzilini topishda juda yordam beradi. Vaqt va mablag‘ni tejash mumkin." },
  { n: "Madina Khusainova", d: "05.01.2021", lang: "uz", t: "Men kutgan ilova. Juda tushunarli, chiroyli dizayn, hammasi oddiy va oson. Tez yuklanadi va juda ko‘p foydali funksiyalarga ega. Tavsiya qilaman!" },
  { n: "Nargiza Nasirkhodjaeva", d: "14.06.2022", lang: "uz", t: "Ajoyib ilova! Ishlab chiquvchilarga rahmat. Har qanday dori-darmonni muammosiz topishim mumkin, barcha ma’lumotlar bor, qayerda narxi, dorixonalarning kontaktlari va hatto geolokatsiyasi. Juda qulay." },
  { n: "Evgeniy Korz", d: "02.02.2024", lang: "ru", t: "Мне очень понравилось данное приложение. С помощью него я постоянно приобретаю лекарства. Всегда простой и удобный поиск лекарств, сортировка по ценам. Поиск аптек по наличию лекарств и рядом со мной. Супер!" },
];

/* Продукты для аптек — со страницы «Для аптек». */
export const PRODUCTS = [
  { n: "Oson Apteka", ru: "Справочник: покупатели находят вашу аптеку по наличию и цене", uz: "Ma’lumotnoma: xaridorlar dorixonangizni mavjudlik va narx bo‘yicha topadi" },
  { n: "Oson Price", ru: "Цены рынка: как ваши цены стоят рядом с соседями", uz: "Bozor narxlari: narxlaringiz qo‘shnilarnikiga nisbatan qanday" },
  { n: "Oson Kassa", ru: "Касса и учёт продаж аптеки", uz: "Dorixona kassasi va savdo hisobi" },
  { n: "Oson Report", ru: "Отчёты: продажи под контролем", uz: "Hisobotlar: savdo nazorat ostida" },
];

/* Хуки бегущей строки — их же преимущества (главная, «Для аптек»). */
export const HOOKS = {
  ru: ["Бесплатно для покупателей", "Поиск по действующему веществу", "Несколько лекарств за один поиск", "Сначала дешевле или ближе", "Маршрут до аптеки", "Кэшбэк за чек", "3500 аптек", "Поддержка 24/7", "Резидент IT Park", "Бот @osonaptekabot"],
  uz: ["Xaridorlar uchun bepul", "Ta’sir qiluvchi modda bo‘yicha qidiruv", "Bir qidiruvda bir nechta dori", "Avval arzonroq yoki yaqinroq", "Dorixonagacha yo‘nalish", "Chek uchun keshbek", "3500 dorixona", "24/7 yordam", "IT Park rezidenti", "@osonaptekabot boti"],
};
