/**
 * Тендеры: наш ли это лот.
 *
 * Владелец, 10.11.2026: «Делаем Парсинг тендеров. Это еще одна функция
 * скаута». Площадки отдают тысячи лотов в день — бумага, бензин, ремонт
 * крыши. Наши — разработка: сайт, приложение, бот, информационная система,
 * автоматизация, сопровождение ПО. Решает код, без модели: лотов много, а
 * слова в названиях закупок казённые и повторяются.
 *
 * Главная развилка — «сделать» против «купить». «Разработка сайта» —
 * наше, «Ноутбук для бухгалтерии» и «Лицензия Microsoft Office» — нет,
 * хотя слова «компьютер» и «программное обеспечение» встречаются в обоих.
 * Поэтому тема одна не решает: нужна тема и работа (разработка, создание,
 * доработка, сопровождение) или тема, которая сама и есть работа
 * («веб-сайт», «мобильное приложение», «Telegram-бот»). Покупка железа,
 * расходников и готовых лицензий отсекается раньше всего.
 *
 * Языки — как пишут в названиях лотов Узбекистана: русский, узбекский
 * латиницей и кириллицей, местами английский.
 */

const LEFT = "(?<![\\p{L}\\p{N}])";

/** Слово с начала: «разработк» ловит «разработка», «разработку», «разработки». */
function stem(body: string): RegExp {
  return new RegExp(`${LEFT}(?:${body})`, "iu");
}

/** Слово целиком: короткие («бот», «API», «CRM») иначе ловят «ботинки» и «apiece». */
function whole(body: string): RegExp {
  return new RegExp(`${LEFT}(?:${body})(?![\\p{L}\\p{N}])`, "iu");
}

/** Тема — то, что мы делаем. */
const TOPICS: Record<string, RegExp[]> = {
  сайт: [
    stem("сайт\\p{L}*|веб-?сайт\\p{L}*|web-?site|website|веб-?портал\\p{L}*|интернет-?портал\\p{L}*|лендинг\\p{L}*|landing page"),
    stem("sayt\\p{L}*|veb-?sayt\\p{L}*|vebsayt\\p{L}*|veb-?portal\\p{L}*|internet-?portal\\p{L}*"),
  ],
  приложение: [
    stem("мобильн\\p{L}* приложени\\p{L}*|веб-?приложени\\p{L}*|mobil\\p{L}* ilova\\p{L}*|мобил\\p{L}* илова\\p{L}*|mobile app\\p{L}*|web app\\p{L}*|mobile application"),
  ],
  бот: [
    stem("telegram-?бот\\p{L}*|телеграм-?бот\\p{L}*|чат-?бот\\p{L}*|telegram-?bot\\p{L}*|chat-?bot\\p{L}*|chatbot\\p{L}*"),
    whole("бот(?:а|у|ом|ов|ы)?|bot(?:lar|ni|ga|i)?"),
  ],
  система: [
    stem(
      "информационн\\p{L}* систем\\p{L}*|автоматизированн\\p{L}* систем\\p{L}*|программн\\p{L}* обеспечени\\p{L}*|" +
        "программн\\p{L}* продукт\\p{L}*|программн\\p{L}* комплекс\\p{L}*|программн\\p{L}* модул\\p{L}*|личн\\p{L}* кабинет\\p{L}*|" +
        "электронн\\p{L}* (?:сервис|услуг|журнал|очеред|запис|платформ)\\p{L}*|axborot tizim\\p{L}*|ахборот тизим\\p{L}*|" +
        "dasturiy ta[’'ʼ`]?minot\\p{L}*|дастурий таъминот\\p{L}*|dasturiy mahsulot\\p{L}*|elektron xizmat\\p{L}*|" +
        "веб-?платформ\\p{L}*|онлайн-?платформ\\p{L}*|software",
    ),
    // «ПО» словом не ловим: в названиях лотов это почти всегда предлог «услуги по …».
    whole("crm|erp|1с|1c"),
  ],
  платформа: [
    stem("raqamli platforma\\p{L}*|tahliliy platforma\\p{L}*|veb-?platforma\\p{L}*|onlayn platforma\\p{L}*|цифров\\p{L}* платформ\\p{L}*|аналитическ\\p{L}* платформ\\p{L}*"),
  ],
  ии: [stem("sun[’'ʼ`]?iy intellekt\\p{L}*|сунъий интеллект\\p{L}*|искусственн\\p{L}* интеллект\\p{L}*|artificial intelligence|machine learning|машинн\\p{L}* обучени\\p{L}*")],
  автоматизация: [stem("автоматизац\\p{L}*|цифровизац\\p{L}*|avtomatlashtir\\p{L}*|raqamlashtir\\p{L}*|интеграци\\p{L}* (?:систем|сервис|с )\\p{L}*"), whole("api")],
};

/** Работа — что сделать с темой. */
const WORK = stem(
  "разработ\\p{L}*|создани\\p{L}*|созда\\p{L}*|доработ\\p{L}*|модернизац\\p{L}*|внедрени\\p{L}*|сопровождени\\p{L}*|поддержк\\p{L}*|" +
    "обслуживани\\p{L}*|техническ\\p{L}* поддержк\\p{L}*|редизайн\\p{L}*|обновлени\\p{L}*|изготовлени\\p{L}*|" +
    "ishlab chiq\\p{L}*|yarat\\p{L}*|yaratish\\p{L}*|takomillashtir\\p{L}*|joriy et\\p{L}*|qo[‘'ʻ`]?llab-?quvvatla\\p{L}*|xizmat ko[‘'ʻ`]?rsat\\p{L}*|" +
    "ишлаб чиқ\\p{L}*|яратиш\\p{L}*|такомиллаштир\\p{L}*|жорий эт\\p{L}*|development|develop\\p{L}*|услуг\\p{L}*|xizmat\\p{L}*|хизмат\\p{L}*",
);

/** Разработка в узком смысле — без «услуг» и «обслуживания». */
const DEV = stem(
  "разработ\\p{L}*|создани\\p{L}*|доработ\\p{L}*|модернизац\\p{L}*|внедрени\\p{L}*|сопровождени\\p{L}*|техническ\\p{L}* поддержк\\p{L}*|" +
    "ishlab chiq\\p{L}*|yarat\\p{L}*|takomillashtir\\p{L}*|joriy et\\p{L}*|qo[‘'ʻ`]?llab-?quvvatla\\p{L}*|ишлаб чиқ\\p{L}*|яратиш\\p{L}*|" +
    "такомиллаштир\\p{L}*|жорий эт\\p{L}*|қўллаб-?қувватла\\p{L}*|development|develop\\p{L}*|техник\\p{L}* қўллаб\\p{L}*",
);

/** Темы, которые сами по себе работа: веб-сайт не покупают коробкой. */
const SELF_WORK = new Set(["сайт", "бот", "приложение", "платформа", "ии"]);

/**
 * Не наше: железо, расходники, готовые лицензии, связь, видеонаблюдение.
 * «Лицензия» — это перепродажа чужого ПО, а не разработка.
 */
const NOT_OURS = stem(
  "компьютер\\p{L}*|ноутбук\\p{L}*|моноблок\\p{L}*|принтер\\p{L}*|мфу|картридж\\p{L}*|тонер\\p{L}*|сервер\\p{L}* оборудовани\\p{L}*|" +
    "монитор\\p{L}*|клавиатур\\p{L}*|мыш\\p{L}*|кабел\\p{L}*|коммутатор\\p{L}*|маршрутизатор\\p{L}*|роутер\\p{L}*|видеонаблюдени\\p{L}*|" +
    "камер\\p{L}*|лицензи\\p{L}*|антивирус\\p{L}*|kompyuter\\p{L}*|noutbuk\\p{L}*|printer\\p{L}*|kartrij\\p{L}*|litsenziya\\p{L}*|" +
    "компютер\\p{L}*|ноутбук\\p{L}*|бумаг\\p{L}*|канцеляр\\p{L}*|мебел\\p{L}*|ремонт\\p{L}* (?:здани|помещени|кровл)\\p{L}*|" +
    "интернет-?(?:услуг|канал|трафик)\\p{L}*|internet xizmat\\p{L}*|связ\\p{L}* (?:услуг)\\p{L}*|" +
    "videokuzatuv\\p{L}*|видеокузатув\\p{L}*|yong[‘'ʻ`]?in\\p{L}*|ёнғин\\p{L}*|пожарн\\p{L}*|konditsioner\\p{L}*|кондиционер\\p{L}*|" +
    "sug[‘'ʻ`]?urta\\p{L}*|страхован\\p{L}*|planshet\\p{L}*|планшет\\p{L}*|server qurilma\\p{L}*|ehtiyot qism\\p{L}*|" +
    "lisenziya\\p{L}*|litsenziya\\p{L}*|лицензия\\p{L}*|virtual server\\p{L}*|виртуальн\\p{L}* сервер\\p{L}*|iaas|" +
    "bulutli infratuzilma\\p{L}*|облачн\\p{L}* инфраструктур\\p{L}*|хостинг\\p{L}*|hosting\\p{L}*|rfid",
);

export type TenderVerdict = {
  /** Наш ли лот. */
  ours: boolean;
  /** Совпавшие темы — бейджи в ленте и в сообщении. */
  topics: string[];
  /** Почему нет — для журнала прохода. */
  reason: "ours" | "no_topic" | "no_work" | "not_ours";
};

/** Поставка готового: «yetkazib berish», «поставка», «приобретение». */
const SUPPLY = stem("yetkazib berish\\p{L}*|етказиб бериш\\p{L}*|поставк\\p{L}*|приобретени\\p{L}*|xarid qilish\\p{L}*|sotib olish\\p{L}*");

/**
 * Решение по названию лота (и описанию, если площадка его отдаёт).
 *
 * `itCategory` — площадка сама отнесла лот к ПО и IT-услугам (etender):
 * тема тогда не нужна, но перепродажа (лицензии, серверы, облако) и
 * поставка готового без работы отсекаются так же.
 */
export function tenderVerdict(title: string, extra = "", itCategory = false): TenderVerdict {
  const text = `${title} ${extra}`.replace(/\s+/g, " ").trim();
  const topics = Object.entries(TOPICS)
    .filter(([, list]) => list.some((re) => re.test(text)))
    .map(([name]) => name);
  if (itCategory) {
    // Здесь «услуга» работой не считается: «услуга по предоставлению
    // виртуальных серверов» — аренда, а не разработка. Нужна именно разработка.
    const dev = DEV.test(text);
    if (NOT_OURS.test(text) && !dev) return { ours: false, topics, reason: "not_ours" };
    if (SUPPLY.test(text) && !dev && !topics.some((topic) => SELF_WORK.has(topic))) return { ours: false, topics, reason: "not_ours" };
    return { ours: true, topics: topics.length ? topics : ["IT"], reason: "ours" };
  }
  if (!topics.length) return { ours: false, topics, reason: "no_topic" };
  // Железо и лицензии отсекаются, только если в названии нет работы:
  // «Разработка сайта и поставка сервера» — всё равно наше.
  const work = WORK.test(text);
  if (NOT_OURS.test(text) && !work) return { ours: false, topics, reason: "not_ours" };
  if (!work && !topics.some((topic) => SELF_WORK.has(topic))) return { ours: false, topics, reason: "no_work" };
  return { ours: true, topics, reason: "ours" };
}
