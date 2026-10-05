/**
 * Темы статей о маркетинге — то, о чём пишет модель два раза в день.
 *
 * Четыре вида, по очереди: объяснение под поисковый запрос, известный кейс,
 * частая ошибка, продвижение ниши в канале. Кейс — единственный вид, где в тексте бывают факты и числа, и
 * берутся они только отсюда: модель пересказывает `facts` своими словами и
 * ничего к ним не добавляет, а проверка в `lib/marketing/articles-run.ts`
 * не пропустит число, которого здесь нет. Источник каждого кейса —
 * открытая статья Википедии, ссылка на неё стоит под текстом.
 *
 * Ошибки и ниши — без фактов: опыт и здравый смысл, без процентов, сумм и
 * «исследования показали». Придуманная статистика в статье студии хуже,
 * чем никакой.
 *
 * Темы кончатся примерно через два месяца — тогда смена напишет владельцу
 * в Telegram, и сюда добавляются новые. Ключ темы (`key`) после публикации
 * не меняется: по нему смена помнит, что статья уже есть.
 */

export type MarketingTopicKind = "explainer" | "case" | "mistake" | "niche";

/** Поисковый запрос, под который пишется статья, — свой на каждом языке. */
export type TopicQuery = { ru?: string; uz?: string };

export type MarketingTopic = {
  key: string;
  kind: MarketingTopicKind;
  /** Адрес статьи: /{ru|uz}/marketing/articles/{slug}. */
  slug: string;
  /** О чём статья — по-русски, для модели. Заголовок она пишет сама. */
  brief: string;
  facts?: string[];
  lesson?: string;
  source?: string;
  /** Запрос стоит в заголовке, описании и первом абзаце — проверяет код. */
  query?: TopicQuery;
};

type CaseSeed = { key: string; title: string; facts: string[]; lesson: string; source: string };

const CASES: CaseSeed[] = [
  {
    key: "dollar-shave-club",
    title: "Dollar Shave Club: ролик за $4 500, который продал бритвы",
    facts: [
      "В 2012 году компания выпустила рекламный ролик с основателем Майклом Дубиным; по данным СМИ, съёмка обошлась примерно в $4 500.",
      "По сообщениям прессы, за первые двое суток после выхода ролика пришло около 12 000 заказов.",
      "В 2016 году Unilever купил компанию — по данным СМИ, примерно за $1 млрд.",
    ],
    lesson: "Ясное предложение и характер бренда важнее бюджета съёмки; ролик вёл на понятную подписку.",
    source: "https://en.wikipedia.org/wiki/Dollar_Shave_Club",
  },
  {
    key: "old-spice",
    title: "Old Spice: как ответы в соцсетях сделали рекламу разговором",
    facts: [
      "В 2010 году вышла кампания «The Man Your Man Could Smell Like» с актёром Исайей Мустафой.",
      "После ТВ-ролика команда за несколько дней записала около 180 коротких видеоответов на комментарии пользователей в соцсетях.",
    ],
    lesson: "Реакция на аудиторию в реальном времени превращает рекламу в повод для разговора.",
    source: "https://en.wikipedia.org/wiki/The_Man_Your_Man_Could_Smell_Like",
  },
  {
    key: "ice-bucket-challenge",
    title: "Ice Bucket Challenge: механика, которую хотелось повторить",
    facts: [
      "Летом 2014 года в соцсетях распространился челлендж: облиться ледяной водой, пожертвовать на исследования БАС и передать эстафету троим друзьям.",
      "По данным ALS Association, за лето 2014 года она получила около $115 млн пожертвований.",
    ],
    lesson: "Простое действие, которое легко снять на телефон, плюс номинация друзей — и механика распространяется сама.",
    source: "https://en.wikipedia.org/wiki/Ice_Bucket_Challenge",
  },
  {
    key: "share-a-coke",
    title: "Share a Coke: имя на бутылке как повод купить и сфотографировать",
    facts: [
      "Кампания стартовала в Австралии в 2011 году: вместо логотипа на бутылках печатали популярные имена.",
      "Затем кампанию повторили во многих странах мира.",
    ],
    lesson: "Персонализация упаковки создаёт повод купить и поделиться фото — реклама, которую делают сами покупатели.",
    source: "https://en.wikipedia.org/wiki/Share_a_Coke",
  },
  {
    key: "red-bull-stratos",
    title: "Red Bull Stratos: бренд как медиа",
    facts: [
      "В 2012 году Феликс Баумгартнер прыгнул из стратосферы с высоты около 39 км в проекте Red Bull Stratos.",
      "Прямую трансляцию на YouTube одновременно смотрели около 8 млн человек.",
    ],
    lesson: "Бренд может сам создавать событие, о котором хотят рассказать, — а не только покупать рекламу вокруг чужих.",
    source: "https://en.wikipedia.org/wiki/Red_Bull_Stratos",
  },
  {
    key: "dove-real-beauty",
    title: "Dove Real Beauty: ставка на реальных людей",
    facts: [
      "Кампания Dove «Campaign for Real Beauty» началась в 2004 году и показывала в рекламе обычных женщин вместо моделей.",
      "Ролик «Real Beauty Sketches» 2013 года стал одним из самых просматриваемых рекламных видео своего времени.",
    ],
    lesson: "Позиция бренда, с которой аудитория согласна, работает дольше одного сезона.",
    source: "https://en.wikipedia.org/wiki/Dove_Campaign_for_Real_Beauty",
  },
  {
    key: "spotify-wrapped",
    title: "Spotify Wrapped: итоги года, которыми делятся сами",
    facts: [
      "Каждый декабрь Spotify показывает пользователям персональные итоги года: любимых исполнителей, треки и минуты прослушивания.",
      "Итоги оформлены как карточки для сторис, и пользователи массово публикуют их в соцсетях.",
    ],
    lesson: "Данные о клиенте, поданные как подарок ему самому, становятся бесплатным охватом.",
    source: "https://en.wikipedia.org/wiki/Spotify_Wrapped",
  },
  {
    key: "dropbox-referral",
    title: "Dropbox: реферальная программа, где выигрывают оба",
    facts: [
      "Dropbox давал дополнительное место в облаке и тому, кто пригласил друга, и самому приглашённому.",
      "Реферальную программу часто приводят как один из главных источников роста сервиса в первые годы.",
    ],
    lesson: "Бонус обеим сторонам и встроенная в продукт кнопка «пригласить» дешевле любой рекламы.",
    source: "https://en.wikipedia.org/wiki/Dropbox",
  },
  {
    key: "hotmail-signature",
    title: "Hotmail: одна строка в подписи письма",
    facts: [
      "В 1996 году в конец каждого письма из Hotmail добавлялась строка с приглашением завести бесплатную почту.",
      "Этот приём считают одним из первых примеров вирусного маркетинга в интернете.",
    ],
    lesson: "Каждый контакт клиента с вашим продуктом может приводить нового клиента — если дать ему эту возможность.",
    source: "https://en.wikipedia.org/wiki/Outlook.com",
  },
  {
    key: "will-it-blend",
    title: "Will It Blend?: показать продукт в деле",
    facts: [
      "С 2006 года компания Blendtec выпускала ролики, где основатель перемалывал в блендере неожиданные предметы — вплоть до смартфонов.",
      "Серия стала одной из известных вирусных видеокампаний YouTube.",
    ],
    lesson: "Демонстрация главного свойства продукта в зрелищной форме убеждает лучше перечня характеристик.",
    source: "https://en.wikipedia.org/wiki/Will_It_Blend%3F",
  },
  {
    key: "think-small",
    title: "Volkswagen Think Small: честность как преимущество",
    facts: [
      "В 1959 году агентство DDB выпустило для Volkswagen рекламу «Think Small»: маленький «Жук» на большом белом поле.",
      "Кампания превратила недостаток — маленький размер машины — в аргумент за неё.",
    ],
    lesson: "Не прятать особенность продукта, а объяснить, почему она выгодна клиенту.",
    source: "https://en.wikipedia.org/wiki/Think_Small",
  },
  {
    key: "got-milk",
    title: "Got Milk?: реклама категории, а не бренда",
    facts: [
      "Кампания «Got Milk?» запущена в 1993 году в Калифорнии по заказу молочной отрасли.",
      "Она продвигала не конкретную марку, а саму привычку пить молоко.",
    ],
    lesson: "Если рынок маленький, иногда выгоднее растить спрос на всю категорию.",
    source: "https://en.wikipedia.org/wiki/Got_Milk%3F",
  },
  {
    key: "duolingo-owl",
    title: "Duolingo: маскот, который ведёт соцсети",
    facts: [
      "Duolingo ведёт соцсети от лица своего маскота — зелёной совы Duo.",
      "Короткие юмористические ролики с совой в TikTok принесли бренду большую аудиторию.",
    ],
    lesson: "Узнаваемый персонаж и регулярный юмор делают аккаунт бренда тем, на что подписываются добровольно.",
    source: "https://en.wikipedia.org/wiki/Duolingo",
  },
  {
    key: "think-different",
    title: "Apple Think Different: продавать идею, а не характеристики",
    facts: [
      "Кампания «Think Different» вышла в 1997 году.",
      "В рекламе не было компьютеров — только портреты известных людей, изменивших мир.",
    ],
    lesson: "Когда продукты похожи, покупают ценности бренда.",
    source: "https://en.wikipedia.org/wiki/Think_different",
  },
];

/**
 * Запросы ошибок сверены в Google Trends по Узбекистану за 12 месяцев
 * (05.10.2026). Данные есть у «лендинг», «landing page», «UTM» (рядом —
 * «utm метки»), «накрутка подписчиков», «nakrutka», «Яндекс Карты» (рядом —
 * «яндекс карты ташкент»), «Google Maps» («google maps tashkent»),
 * «перевод на узбекский», «скидки», «chegirma», «giveaway» («instagram
 * giveaway»), «CRM система», «таргет» и «instagram target» (04.10).
 * Остальные Trends называет редкими: в Узбекистане по ним ищут мало, и
 * Google цифр не даёт. Для них взята самая обычная формулировка, а сколько
 * их ищут на самом деле, смена спрашивает у Вордстата перед статьёй.
 */
const MISTAKES: Array<{ key: string; brief: string; query: Required<TopicQuery> }> = [
  { key: "target-bez-pikselya", brief: "Таргет без пикселя на сайте: почему реклама в Instagram не учится и дорожает", query: { ru: "таргет в Instagram", uz: "Instagram target" } },
  { key: "reklama-na-glavnuyu", brief: "Реклама ведёт на главную страницу сайта вместо отдельной страницы под предложение", query: { ru: "лендинг", uz: "landing page" } },
  { key: "otvet-v-direkt", brief: "Ответ в директ через час и позже: как заявки уходят к конкурентам", query: { ru: "продажи в Instagram", uz: "Instagram orqali sotish" } },
  { key: "utm-metki", brief: "UTM-метки: как понять, какая реклама приносит деньги, а какая нет", query: { ru: "UTM метки", uz: "UTM" } },
  { key: "otchet-po-ohvatam", brief: "Отчёт по охватам вместо отчёта по заявкам и продажам", query: { ru: "отчёт по рекламе", uz: "reklama hisoboti" } },
  { key: "pokupka-podpischikov", brief: "Покупка подписчиков: почему это вредит охватам и доверию", query: { ru: "накрутка подписчиков", uz: "nakrutka" } },
  { key: "net-retargetinga", brief: "Нет ретаргетинга: посетители сайта уходят, и реклама их больше не догоняет", query: { ru: "ретаргетинг", uz: "retargeting" } },
  { key: "medlennyy-sayt", brief: "Медленный сайт на телефоне: реклама приводит людей, а страница не успевает открыться", query: { ru: "скорость сайта", uz: "sayt tezligi" } },
  { key: "kartochka-v-kartah", brief: "Карточка компании в Google и Яндекс Картах: бесплатный канал, о котором забывают", query: { ru: "Яндекс Карты", uz: "Google Maps" } },
  { key: "uzbekskiy-yazyk", brief: "Узбекский язык на сайте и в соцсетях как формальность: что теряет бизнес", query: { ru: "перевод на узбекский", uz: "o‘zbek tilida sayt" } },
  { key: "skidki-vmesto-cennosti", brief: "Скидки вместо ценности: как приучить клиентов ждать акций", query: { ru: "скидки", uz: "chegirma" } },
  { key: "konkursy-radi-podpischikov", brief: "Конкурсы ради подписчиков: приходит аудитория, которая не покупает", query: { ru: "розыгрыш в Instagram", uz: "Instagram giveaway" } },
  { key: "blogery-bez-proverki", brief: "Реклама у блогеров без проверки аудитории и статистики", query: { ru: "реклама у блогеров", uz: "blogerlarda reklama" } },
  { key: "odna-reklama-na-vseh", brief: "Одна реклама на всех: почему аудитории нужно делить", query: { ru: "целевая аудитория", uz: "maqsadli auditoriya" } },
  { key: "telegram-ads-bez-offera", brief: "Telegram Ads без понятного предложения: показы есть, заявок нет", query: { ru: "Telegram Ads", uz: "Telegram Ads" } },
  { key: "kontent-bez-plana", brief: "Контент без контент-плана: публикации ради публикаций", query: { ru: "контент план", uz: "kontent reja" } },
  { key: "seo-bez-tehniki", brief: "SEO без технической оптимизации сайта: тексты есть, позиций нет", query: { ru: "SEO оптимизация", uz: "SEO optimizatsiya" } },
  { key: "stoimost-zayavki-i-klienta", brief: "Стоимость заявки и стоимость клиента: в чём разница и что считать", query: { ru: "стоимость лида", uz: "lid narxi" } },
  { key: "net-crm", brief: "Нет CRM: заявки теряются между мессенджерами и звонками", query: { ru: "CRM система", uz: "CRM tizimi" } },
  { key: "ab-test", brief: "A/B-тест рекламы: как проверять гипотезы без большого бюджета", query: { ru: "A/B тест", uz: "A/B test" } },
];

/**
 * Ниша: адрес латиницей, как её назвать в теме «продвижение … в …» и
 * как по-узбекски — для запроса «… uchun Instagram reklama».
 */
const NICHES: Array<{ key: string; of: string; uz: string }> = [
  { key: "stomatologii", of: "стоматологии", uz: "stomatologiya" },
  { key: "medcentra", of: "медицинского центра", uz: "tibbiyot markazi" },
  { key: "internet-magazina", of: "интернет-магазина", uz: "internet-do‘kon" },
  { key: "restorana", of: "ресторана", uz: "restoran" },
  { key: "dostavki-edy", of: "доставки еды", uz: "ovqat yetkazib berish" },
  { key: "avtoservisa", of: "автосервиса", uz: "avtoservis" },
  { key: "stroitelnoy-kompanii", of: "строительной компании", uz: "qurilish kompaniyasi" },
  { key: "mebelnoy-fabriki", of: "мебельной фабрики", uz: "mebel fabrikasi" },
  { key: "uchebnogo-centra", of: "учебного центра", uz: "o‘quv markazi" },
  { key: "turagentstva", of: "турагентства", uz: "turagentlik" },
  { key: "yuridicheskoy-firmy", of: "юридической фирмы", uz: "yuridik firma" },
  { key: "salona-krasoty", of: "салона красоты", uz: "go‘zallik saloni" },
  { key: "logisticheskoy-kompanii", of: "логистической компании", uz: "logistika kompaniyasi" },
  { key: "agentstva-nedvizhimosti", of: "агентства недвижимости", uz: "ko‘chmas mulk agentligi" },
  { key: "fitnes-kluba", of: "фитнес-клуба", uz: "fitnes klub" },
  { key: "magazina-odezhdy", of: "магазина одежды", uz: "kiyim do‘koni" },
  { key: "kofeyni", of: "кофейни", uz: "qahvaxona" },
  { key: "chastnoy-shkoly", of: "частной школы", uz: "xususiy maktab" },
  { key: "detskogo-sada", of: "частного детского сада", uz: "xususiy bog‘cha" },
  { key: "otelya", of: "отеля", uz: "mehmonxona" },
];

/** Канал: как назвать по-русски и что ищут по-узбекски («stomatologiya uchun sayt»). */
const CHANNELS: Array<{ key: string; in: string; uz: string }> = [
  { key: "instagram", in: "в Instagram", uz: "Instagram reklama" },
  { key: "telegram", in: "в Telegram", uz: "Telegram reklama" },
  { key: "google", in: "в Google", uz: "Google reklama" },
  { key: "yandex", in: "в Яндексе", uz: "Yandex reklama" },
  { key: "sayt", in: "через сайт", uz: "sayt" },
];

/**
 * Объяснения — под то, что в Узбекистане ищут на самом деле.
 *
 * Запросы сняты в Google Trends по Узбекистану за 12 месяцев (04.10.2026):
 * «smm panel», «smm nima», «что такое smm», «smm это», «seo продвижение»
 * (растёт, +800%), «seo nima», «таргет это», «instagram target»,
 * «маркетинг это», «marketing nima», «digital marketing», «google ads»,
 * «яндекс реклама», «гугл реклама», «реклама в ташкенте», «tashqi reklama»,
 * «mahsulotni reklama qilish» (+120%), «reklama agentligi», «smm manager».
 * Люди ищут, что это такое и как это работает, — и такая статья приводит
 * их на страницу, где это можно заказать.
 *
 * Вордстат по Узбекистану без входа в аккаунт Яндекса цифр не показывает —
 * когда доступ появится, запросы сверяются и с ним.
 */
const EXPLAINERS: Array<{ key: string; slug: string; query: Required<TopicQuery>; brief: string }> = [
  {
    key: "smm",
    slug: "chto-takoe-smm",
    query: { ru: "что такое SMM", uz: "SMM nima" },
    brief: "Что такое SMM и что он даёт бизнесу в Узбекистане: из чего состоит работа, когда ждать результата и как понять, что SMM работает, а не просто публикует посты",
  },
  {
    key: "smm-panel",
    slug: "smm-panel-nakrutka",
    query: { ru: "SMM панель", uz: "SMM panel" },
    brief: "SMM-панели и накрутка подписчиков: почему купленные подписчики и лайки вредят аккаунту бизнеса и что делать вместо этого",
  },
  {
    key: "target",
    slug: "chto-takoe-target",
    query: { ru: "что такое таргет", uz: "target nima" },
    brief: "Что такое таргетированная реклама в Instagram и Facebook, чем она отличается от SMM и когда она нужна бизнесу",
  },
  {
    key: "seo",
    slug: "seo-prodvizhenie",
    query: { ru: "SEO продвижение", uz: "SEO nima" },
    brief: "SEO-продвижение сайта: что это, из чего состоит, сколько ждать результата и почему без технически исправного сайта оно не работает",
  },
  {
    key: "product-ads",
    slug: "kak-reklamirovat-tovar",
    query: { ru: "как рекламировать товар", uz: "mahsulotni reklama qilish" },
    brief: "Как рекламировать товар: с чего начать, какие каналы выбрать и как понять, что реклама окупается",
  },
  {
    key: "marketing",
    slug: "chto-takoe-marketing",
    query: { ru: "что такое маркетинг", uz: "marketing nima" },
    brief: "Что такое маркетинг для малого бизнеса: не только реклама, а система — продукт, цена, каналы и продажи",
  },
  {
    key: "tashkent-ads",
    slug: "reklama-v-tashkente",
    query: { ru: "реклама в Ташкенте", uz: "Toshkentda reklama" },
    brief: "Реклама в Ташкенте: какие каналы работают для малого бизнеса — Instagram, Telegram, Google, Яндекс, наружная реклама — и как их сочетать",
  },
  {
    key: "google-ads",
    slug: "google-ads-uzbekistan",
    query: { ru: "реклама в Google", uz: "Google reklama" },
    brief: "Реклама в Google (Google Ads) в Узбекистане: как работает поисковая реклама, кому она подходит и как не потратить бюджет впустую на старте",
  },
  {
    key: "yandex-ads",
    slug: "yandex-reklama",
    query: { ru: "реклама в Яндексе", uz: "Yandex reklama" },
    brief: "Реклама в Яндексе для бизнеса в Узбекистане: Яндекс Директ и Яндекс Карты, когда они нужны в дополнение к Google",
  },
  {
    key: "digital",
    slug: "digital-marketing",
    query: { ru: "digital маркетинг", uz: "digital marketing" },
    brief: "Digital-маркетинг: какие каналы в него входят и с чего начать бизнесу в Узбекистане",
  },
  {
    key: "outdoor",
    slug: "naruzhnaya-reklama-ili-internet",
    query: { ru: "наружная реклама", uz: "tashqi reklama" },
    brief: "Наружная реклама или реклама в интернете: что выбрать бизнесу в Ташкенте и как их сочетать, чтобы видеть результат",
  },
  {
    key: "agency",
    slug: "kak-vybrat-reklamnoe-agentstvo",
    query: { ru: "рекламное агентство", uz: "reklama agentligi" },
    brief: "Как выбрать рекламное агентство: что спросить до договора, какие отчёты требовать и какие обещания должны насторожить",
  },
  {
    key: "smm-manager",
    slug: "smm-menedzher",
    query: { ru: "SMM менеджер", uz: "SMM menejer" },
    brief: "SMM-менеджер: чем он занимается, что должен делать каждую неделю и когда бизнесу нужна команда вместо одного человека",
  },
];

const explainerTopics: MarketingTopic[] = EXPLAINERS.map((e) => ({
  key: `explainer:${e.key}`,
  kind: "explainer",
  slug: e.slug,
  brief: e.brief,
  query: e.query,
}));

/**
 * Запрос кейса — само название, как его и ищут: «Old Spice», «Red Bull»,
 * «Duolingo», «Spotify Wrapped» в Trends по Узбекистану есть (05.10.2026),
 * у части кейсов данных нет. Название в заголовке стоит и так, на обоих
 * языках одно.
 */
const caseTopics: MarketingTopic[] = CASES.map((c) => {
  const name = c.title.split(":")[0].replace(/\?$/, "").trim();
  return {
    key: `case:${c.key}`,
    kind: "case",
    slug: `keys-${c.key}`,
    brief: c.title,
    facts: c.facts,
    lesson: c.lesson,
    source: c.source,
    query: { ru: name, uz: name },
  };
});

const mistakeTopics: MarketingTopic[] = MISTAKES.map((m) => ({
  key: `mistake:${m.key}`,
  kind: "mistake",
  slug: `oshibka-${m.key}`,
  brief: m.brief,
  query: m.query,
}));

// Ниши по кругу со сдвигом канала: подряд не выходят пять статей про одну
// стоматологию и не идут двадцать подряд про Instagram.
const nicheTopics: MarketingTopic[] = CHANNELS.flatMap((_, round) =>
  NICHES.map((niche, i) => {
    const channel = CHANNELS[(i + round) % CHANNELS.length];
    return {
      key: `niche:${niche.key}:${channel.key}`,
      kind: "niche" as const,
      slug: `prodvizhenie-${niche.key}-${channel.key}`,
      brief: `Продвижение ${niche.of} ${channel.in} в Узбекистане: с чего начать и что работает`,
      query: { ru: `продвижение ${niche.of} ${channel.in}`, uz: `${niche.uz} uchun ${channel.uz}` },
    };
  }),
);

/**
 * Все темы в порядке выхода: объяснение, кейс, ошибка, ниша — и снова по
 * кругу. Объяснения первыми: у них самый большой спрос в поиске.
 */
export const MARKETING_TOPICS: MarketingTopic[] = (() => {
  const lists = [explainerTopics, caseTopics, mistakeTopics, nicheTopics];
  const out: MarketingTopic[] = [];
  for (let i = 0; out.length < lists.reduce((n, l) => n + l.length, 0); i += 1) {
    for (const list of lists) if (list[i]) out.push(list[i]);
  }
  return out;
})();

/** Следующая ненаписанная тема или null, если темы кончились. */
export function nextMarketingTopic(done: ReadonlySet<string>): MarketingTopic | null {
  return MARKETING_TOPICS.find((topic) => !done.has(topic.key)) ?? null;
}
