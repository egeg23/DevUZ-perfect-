import { BASE } from "./plan.mjs";

// Строки для скрипта страницы прототипа bloger.agency (#i18n) — ru и uz.
const NICHE_C = { life: "#5395E9", family: "#f472b6", vine: "#a855f7", humor: "#c084fc", travel: "#4ade80", food: "#fb923c", auto: "#22d3ee", sport: "#f87171", fashion: "#fbbf24", beauty: "#fb7185", model: "#fb7185", magic: "#fcd34d", estate: "#e2e8f0" };
const NAMES = {
  ru: { life: "Lifestyle", family: "Семья", vine: "Вайн", humor: "Юмор", travel: "Travel", food: "Food", auto: "Авто", sport: "Спорт", fashion: "Fashion", beauty: "Beauty", model: "Модель", magic: "Фокусы", estate: "Недвижимость" },
  uz: { life: "Lifestyle", family: "Oila", vine: "Vayn", humor: "Yumor", travel: "Travel", food: "Food", auto: "Avto", sport: "Sport", fashion: "Fashion", beauty: "Beauty", model: "Model", magic: "Fokuslar", estate: "Ko‘chmas mulk" },
};
// Слова брифа → ниша каталога (запасной подбор без модели).
const KW = {
  food: ["кофе", "кафе", "ресторан", "еда", "доставк", "пицц", "бургер", "кухн", "food", "qahva", "kafe", "restoran", "taom", "ovqat", "yetkaz"],
  auto: ["авто", "машин", "шин", "сервис", "водител", "avto", "mashina", "haydovch", "servis", "byd", "chevrolet"],
  beauty: ["космет", "салон", "красот", "уход", "beauty", "kosmet", "go‘zal", "gozal", "parvarish", "makiyaj", "макияж"],
  family: ["дет", "мам", "семь", "игрушк", "bola", "ona", "oila", "o‘yinchoq"],
  fashion: ["одежд", "обув", "мод", "fashion", "kiyim", "poyabzal", "brend kiyim"],
  sport: ["спорт", "фитнес", "зал", "sport", "fitnes", "trenaj"],
  travel: ["путешеств", "тур", "отел", "гостиниц", "авиа", "sayohat", "tur", "mehmonxona", "avia"],
  humor: ["юмор", "смешн", "весел", "hazil", "kulgili", "yumor"],
  vine: ["вайн", "скетч", "молодеж", "подрост", "tiktok", "yoshlar", "vayn"],
  estate: ["недвиж", "квартир", "жк", "застрой", "kvartira", "uy-joy", "ko‘chmas", "qurilish"],
  life: ["lifestyle", "жизн", "бренд", "магазин", "uzum", "маркетплейс", "do‘kon", "dokon", "hayot"],
};
const niches = (l) => Object.fromEntries(Object.keys(NICHE_C).map((k) => [k, { name: NAMES[l][k], c: NICHE_C[k] }]));

export const nicheNames = NAMES;
export const nicheKeys = Object.keys(NICHE_C);

export const I18N = {
  ru: {
    niches: niches("ru"), kw: KW,
    followers: "подписчиков", exclusive: "★ TOP", na: "нет", next: "Следующий блогер",
    subs: "Подписчики", per1k: "{v} за 1000", add: "+ В подборку", added: "✓ В подборке",
    cartN: "В подборке: {n}", cartS: "{f} подписчиков · сторис на {m}",
    cartTg: "Здравствуйте! Собрал подборку блогеров на вашем сайте, хочу обсудить кампанию:",
    copied: "Скопировано", copy: "Копировать", live: "Ответ ИИ · вживую", demo: "Демо-ответ: ИИ сейчас недоступен",
    whyNiche: "ниша {n}", whyEr: "ER {v}%: аудитория живая", whyReach: "охват {v}", whyMicro: "у микроблогера доверие выше",
    matchSum: "Ищем в нишах: {n}", picked: "Блогеров", reach: "Подписчиков", views: "Прогноз просмотров",
    matchNote: "Прогноз просмотров считаем по вашим же тарифам Silver, Gold и Platinum: от $1,75 до $6 за 1000 просмотров. Цены блогеров взяты с вашего сайта.",
    matchTg: "Здравствуйте! ИИ на сайте подобрал блогеров под мой бриф. Бриф:", matchCta: "Обсудить подборку в Telegram",
    none: "Под такие фильтры никого нет. Ослабьте один из них.", found: "Найдено: {n}", any: "любая",
    bloggersN: "{n} блогеров", tooSmall: "бюджета мало, начните с бартера", from: "от",
    tariff: { silver: "Silver · $700", gold: "Gold · $1200", platinum: "Platinum · $2000" },
    allN: "любая",
    calcTg: "Здравствуйте! Посчитал кампанию на сайте: бюджет {b}, формат {f}, ниша: {n}. Хочу обсудить.",
    reels: [
      { t: "НИША", items: ["Кофейня", "Автосервис", "Салон красоты", "Детская одежда", "Фитнес-клуб", "Магазин на Uzum", "ЖК", "Доставка еды"] },
      { t: "ФОРМАТ", items: ["Бартер", "Развоз подарков", "Амбассадор", "Сторис-серия", "UGC-ролик", "Ивент с блогерами", "Розыгрыш"] },
      { t: "ФИШКА", items: ["Промокод", "Челлендж", "Распаковка", "День из жизни", "Коллаб двух блогеров", "До и после", "Опрос в сторис"] },
    ],
    ideaLbl: "Идея кампании", idea: "{a}: {b} + {c}", ideaTg: "Здравствуйте! Крутанул слот-машину на сайте, выпало:",
    noCoins: "Токены кончились. Пополните демо-кошелёк кнопкой выше. В рабочей версии здесь покупают пакет токенов.",
    uHooks: "5 хуков для первых двух секунд", uScript: "Сценарий по секундам", uBoard: "Раскадровка", uCaption: "Подпись и хэштеги",
    onScreen: "на экране", copyScript: "Скопировать сценарий",
    ugcTg: "Здравствуйте! Сгенерировал на сайте сценарий UGC-ролика, хочу снять его у блогеров. Продукт: {p}", ugcCta: "Снять ролик у блогеров",
    demoUgc: {
      hooks: ["Я три недели не верил(а), что {p} того стоит. Зря.", "Стоп. Покажу то, о чём молчат все, кто продаёт {p}.", "Если у вас ещё нет {p}, посмотрите до конца.", "Мой честный обзор: {p} за 15 секунд.", "Ташкент, это надо видеть: {p}."],
      script: [["0-2 с", "Крупный план лица, телефон в руке", "Я три недели не верил(а), что {p} того стоит.", "Честный отзыв"], ["2-6 с", "Распаковка или вход в место", "Вот что я получил(а). Без фильтров.", ""], ["6-14 с", "Продукт в деле, 2-3 быстрых кадра", "Главное, что зацепило: …", "Главная фишка"], ["14-20 с", "Реакция, улыбка", "Теперь советую всем знакомым.", ""], ["20-25 с", "Промокод на экране", "Ссылка и промокод в описании.", "Промокод"]],
      board: [["Кадр 1 · хук", "Лицо крупно, взгляд в камеру, {p} в руке"], ["Кадр 2", "Распаковка сверху, руки, дневной свет"], ["Кадр 3", "Продукт в деле: главная фишка"], ["Кадр 4", "Реакция: улыбка, «вау»"], ["Кадр 5 · CTA", "Промокод крупно, стрелка вниз"]],
      caption: "Честно: не ждал(а) такого от {p}. Рассказываю, что понравилось и кому подойдёт. Промокод в шапке профиля.",
      tags: ["#ташкент", "#обзор", "#узбекистан", "#реклама", "#ugc"],
      cta: "Промокод в шапке профиля",
    },
    bf: { title: "Бриф кампании", product: "Продукт", goal: "Цель", audience: "Аудитория", message: "Главная мысль", formats: "Форматы", mechanics: "Механика", kpi: "Что считаем", dos: "Блогеру можно", donts: "Блогеру нельзя", questions: "Что уточним у вас" },
    demoBrief: {
      title: "Бриф кампании у блогеров", goal: "Узнаваемость и первые продажи по промокоду", audience: "Жители Ташкента 20-35 лет, которые следят за блогерами о городе и образе жизни",
      message: "Попробуйте и расскажите друзьям", formats: ["Сторис-серия из 3-5 сторис", "Пост или Reels с отметкой"], mechanics: ["Личный промокод у каждого блогера", "Розыгрыш среди подписчиков"],
      kpi: ["Переходы по ссылке", "Использования промокода", "Охват сторис по статистике блогера"], dos: ["Говорить своими словами", "Показывать продукт в деле"], donts: ["Читать текст с листа", "Сравнивать с конкурентами по имени"],
      questions: ["Какой бюджет на первую волну?", "Нужен ли узбекоязычный или русскоязычный блогер?", "Есть ли ограничения по срокам?"],
    },
    briefTg: "Здравствуйте! Собрал бриф на вашем сайте:", briefCta: "Отправить бриф в Telegram",
    rank: "выше, чем у {a} из {b} блогеров каталога",
    rateTg: "Здравствуйте! Хочу стать резидентом Bloger Agency. Подписчиков: {f}, ER по калькулятору: {er}%.",
    kitBase: BASE.price, kitBaseName: BASE.ru.t, kitN: "блоков включено: {n}", kitTotal: "Итого", kitTg: "Состав проекта Bloger Agency из прототипа DevUz Studio:",
  },
  uz: {
    niches: niches("uz"), kw: KW,
    followers: "obunachi", exclusive: "★ TOP", na: "yo‘q", next: "Keyingi bloger",
    subs: "Obunachilar", per1k: "1000 tasi {v}", add: "+ Tanlovga", added: "✓ Tanlovda",
    cartN: "Tanlovda: {n}", cartS: "{f} obunachi · storis {m}",
    cartTg: "Assalomu alaykum! Saytingizda blogerlar tanlovini yig‘dim, kampaniyani muhokama qilmoqchiman:",
    copied: "Nusxalandi", copy: "Nusxalash", live: "AI javobi · jonli", demo: "Demo-javob: AI hozir mavjud emas",
    whyNiche: "{n} nishasi", whyEr: "ER {v}%: auditoriya faol", whyReach: "qamrov {v}", whyMicro: "mikroblogerga ishonch yuqori",
    matchSum: "Qidiramiz: {n}", picked: "Blogerlar", reach: "Obunachilar", views: "Ko‘rishlar prognozi",
    matchNote: "Ko‘rishlar prognozini o‘zingizning Silver, Gold va Platinum tariflaringiz bo‘yicha hisoblaymiz: 1000 ko‘rish uchun $1,75 dan $6 gacha. Blogerlar narxlari saytingizdan olingan.",
    matchTg: "Assalomu alaykum! Saytdagi AI brifimga blogerlarni tanladi. Brif:", matchCta: "Tanlovni Telegramda muhokama qilish",
    none: "Bunday filtrlar bo‘yicha hech kim yo‘q. Bittasini yumshating.", found: "Topildi: {n}", any: "istalgan",
    bloggersN: "{n} ta bloger", tooSmall: "byudjet kam, barterdan boshlang", from: "kamida",
    tariff: { silver: "Silver · $700", gold: "Gold · $1200", platinum: "Platinum · $2000" },
    allN: "istalgan",
    calcTg: "Assalomu alaykum! Saytda kampaniyani hisobladim: byudjet {b}, format {f}, nisha: {n}. Muhokama qilmoqchiman.",
    reels: [
      { t: "NISHA", items: ["Qahvaxona", "Avtoservis", "Go‘zallik saloni", "Bolalar kiyimi", "Fitnes-klub", "Uzum’dagi do‘kon", "Turar-joy majmuasi", "Ovqat yetkazish"] },
      { t: "FORMAT", items: ["Barter", "Sovg‘a yetkazish", "Ambassador", "Storis-seriya", "UGC-rolik", "Blogerlar bilan tadbir", "Konkurs"] },
      { t: "FISHKA", items: ["Promokod", "Chellenj", "Raspakovka", "Bir kunim", "Ikki bloger kollabi", "Oldin va keyin", "Storisda so‘rovnoma"] },
    ],
    ideaLbl: "Kampaniya g‘oyasi", idea: "{a}: {b} + {c}", ideaTg: "Assalomu alaykum! Saytdagi slot-mashinani aylantirdim, chiqdi:",
    noCoins: "Tokenlar tugadi. Demo-hamyonni yuqoridagi tugma bilan to‘ldiring. Ishchi versiyada bu yerda token paketi sotib olinadi.",
    uHooks: "Birinchi ikki soniya uchun 5 ta xuk", uScript: "Soniyalar bo‘yicha ssenariy", uBoard: "Raskadrovka", uCaption: "Izoh va heshteglar",
    onScreen: "ekranda", copyScript: "Ssenariyni nusxalash",
    ugcTg: "Assalomu alaykum! Saytda UGC-rolik ssenariysini yaratdim, uni blogerlarda suratga olmoqchiman. Mahsulot: {p}", ugcCta: "Rolikni blogerlarda suratga olish",
    demoUgc: {
      hooks: ["Uch hafta {p} bunga arziydi deb ishonmadim. Bekor ekan.", "To‘xtang. {p} sotayotganlar aytmaydigan narsani ko‘rsataman.", "Sizda hali {p} bo‘lmasa, oxirigacha ko‘ring.", "Halol sharhim: {p} 15 soniyada.", "Toshkent, buni ko‘rish kerak: {p}."],
      script: [["0-2 s", "Yuz yaqindan, qo‘lda telefon", "Uch hafta {p} bunga arziydi deb ishonmadim.", "Halol sharh"], ["2-6 s", "Raspakovka yoki joyga kirish", "Mana nima oldim. Filtrsiz.", ""], ["6-14 s", "Mahsulot ishda, 2-3 tez kadr", "Eng yoqqani: …", "Asosiy fishka"], ["14-20 s", "Reaksiya, tabassum", "Endi hamma tanishlarimga maslahat beraman.", ""], ["20-25 s", "Ekranda promokod", "Havola va promokod tavsifda.", "Promokod"]],
      board: [["1-kadr · xuk", "Yuz yaqindan, kameraga qarash, qo‘lda {p}"], ["2-kadr", "Yuqoridan raspakovka, qo‘llar, kunduzgi yorug‘lik"], ["3-kadr", "Mahsulot ishda: asosiy fishka"], ["4-kadr", "Reaksiya: tabassum, «vau»"], ["5-kadr · CTA", "Promokod yirik, pastga strelka"]],
      caption: "Rostini aytsam, {p}dan bunday kutmagandim. Nima yoqqanini va kimga mos kelishini aytib beraman. Promokod profil shapkasida.",
      tags: ["#toshkent", "#sharh", "#ozbekiston", "#reklama", "#ugc"],
      cta: "Promokod profil shapkasida",
    },
    bf: { title: "Kampaniya brifi", product: "Mahsulot", goal: "Maqsad", audience: "Auditoriya", message: "Asosiy fikr", formats: "Formatlar", mechanics: "Mexanika", kpi: "Nimani hisoblaymiz", dos: "Blogerga mumkin", donts: "Blogerga mumkin emas", questions: "Sizdan aniqlashtiramiz" },
    demoBrief: {
      title: "Blogerlardagi kampaniya brifi", goal: "Taniqlilik va promokod orqali birinchi sotuvlar", audience: "Shahar va turmush tarzi haqidagi blogerlarni kuzatadigan 20-35 yoshli toshkentliklar",
      message: "Sinab ko‘ring va do‘stlaringizga ayting", formats: ["3-5 ta storisdan iborat seriya", "Belgi bilan post yoki Reels"], mechanics: ["Har bir blogerda shaxsiy promokod", "Obunachilar orasida konkurs"],
      kpi: ["Havola bo‘yicha o‘tishlar", "Promokoddan foydalanishlar", "Bloger statistikasi bo‘yicha storis qamrovi"], dos: ["O‘z so‘zlari bilan gapirish", "Mahsulotni ishda ko‘rsatish"], donts: ["Matnni qog‘ozdan o‘qish", "Raqobatchilar bilan nomma-nom solishtirish"],
      questions: ["Birinchi to‘lqin uchun byudjet qancha?", "O‘zbek tilidagi yoki rus tilidagi bloger kerakmi?", "Muddatlar bo‘yicha cheklovlar bormi?"],
    },
    briefTg: "Assalomu alaykum! Saytingizda brif yig‘dim:", briefCta: "Brifni Telegramga yuborish",
    rank: "katalogdagi {b} ta blogerdan {a} tasinikidan yuqori",
    rateTg: "Assalomu alaykum! Bloger Agency rezidenti bo‘lmoqchiman. Obunachilar: {f}, kalkulyator bo‘yicha ER: {er}%.",
    kitBase: BASE.price, kitBaseName: BASE.uz.t, kitN: "yoqilgan bloklar: {n}", kitTotal: "Jami", kitTg: "DevUz Studio prototipidan Bloger Agency loyihasi tarkibi:",
  },
};
