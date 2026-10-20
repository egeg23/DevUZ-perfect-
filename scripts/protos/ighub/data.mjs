/*
 * Содержание прототипа хаба Instagram → Telegram на двух языках: ru и uz
 * (латиница). Каждый текст пишется парой T(ru, uz); gen.mjs оставляет в
 * странице только её язык.
 *
 * Чей хаб, владелец не назвал: демо-компания — один факт, COMPANY. Клиенты,
 * менеджеры и объявления выдуманы; имён и названий из присланного видео нет.
 *
 * Язык клиента. На русской странице клиент пишет по-русски или по-узбекски, на
 * узбекской — по-узбекски или по-английски: узбекская страница целиком без
 * кириллицы, а ответ на языке клиента виден и так.
 */
const T = (ru, uz) => ({ __l: true, ru, uz });

/** Демо-компания. Сменить клиента хаба — только здесь. */
export const COMPANY = {
  name: "Usta Mebel",
  ig: "usta.mebel",
  niche: T("корпусная мебель на заказ, Ташкент", "buyurtma asosida korpus mebel, Toshkent"),
};

/** Языки клиента на странице: первый — язык страницы. */
export const CLIENT_LANGS = { ru: ["ru", "uz"], uz: ["uz", "en"] };
export const LANG_NAME = { ru: T("русский", "rus tili"), uz: T("узбекский", "o‘zbek tili"), en: T("английский", "ingliz tili") };

export const CLIENT = { name: "Madina Karimova", user: "madina.karimova_", igsid: "17841400 0000 2026", ini: "MK" };

export const MANAGERS = [
  { id: "me", name: T("Дилноза", "Dilnoza"), ini: "D", took: 6, first: 95 },
  { id: "t", name: T("Тимур", "Timur"), ini: "T", took: 5, first: 250 },
  { id: "s", name: T("Шахзод", "Shahzod"), ini: "Sh", took: 3, first: 1020 },
];
export const HEAD = T("Рустам", "Rustam");

/** Объявления: первое — с которого пишет клиент в демо. n — заявок сегодня до него. */
export const ADS = [
  { id: "ad1", kind: "Reels", n: 9, title: T("Шкаф-купе под ваш размер", "O‘lchamingizga shkaf-kupe"), camp: T("Шкафы-купе · октябрь", "Shkaf-kupelar · oktyabr") },
  { id: "ad2", kind: T("Сторис", "Stories"), n: 5, title: T("Кухня за 3 недели", "3 haftada oshxona"), camp: T("Кухни · октябрь", "Oshxonalar · oktyabr") },
  { id: "ad3", kind: T("Пост", "Post"), n: 2, title: T("Прихожая в узкий коридор", "Tor yo‘lak uchun dahliz"), camp: T("Прихожие", "Dahlizlar") },
];
export const NO_AD = 3;

/** Другие клиенты: для списков, тем и поиска. by — кто взял. */
export const OTHERS = [
  { name: "Javlon Rashidov", user: "javlon.r", by: "t", ad: "ad2", last: T("Кухня угловая, 3 метра", "Burchakli oshxona, 3 metr"), ago: "11:42" },
  { name: "Aziza", user: "aziza_home", by: "me", ad: "ad1", last: T("Спасибо, жду замерщика", "Rahmat, o‘lchovchini kutaman"), ago: "11:05" },
  { name: "Bekzod T.", user: "bekzod.tm", by: "s", ad: null, last: T("Есть рассрочка?", "Bo‘lib to‘lash bormi?"), ago: "10:31" },
  { name: "Nilufar", user: "nilu.decor", by: "me", ad: "ad3", last: T("Фото прихожей отправила", "Dahliz rasmini yubordim"), ago: "09:58" },
  { name: "Sardor", user: "sardor_88", by: "t", ad: "ad1", last: T("Белый глянец или матовый?", "Oq yaltiroq yoki matmi?"), ago: "09:12" },
  { name: "Kamola", user: "kamola.uy", by: "me", ad: null, last: T("Адрес шоурума?", "Shou-rum manzili?"), ago: "08:47" },
];

/** Первое сообщение клиента с рекламы — на каждом языке. */
export const ASK = {
  ru: ["Какова стоимость?", "Можно замер на этой неделе?"],
  uz: ["Narxi qancha?", "Shu hafta o‘lchovga kela olasizmi?"],
  en: ["How much does it cost?", "Can you measure this week?"],
};
/** Ответ клиента после ответа компании. */
export const CLIENT_REPLY = {
  ru: ["Шкаф 2,4 метра, белый. Когда сможете приехать?", "Хорошо, завтра утром удобно"],
  uz: ["Shkaf 2,4 metr, oq rang. Qachon kela olasiz?", "Yaxshi, ertaga ertalab qulay"],
  en: ["Wardrobe 2.4 m, white. When can you come?", "Good, tomorrow morning works"],
};

/** Готовые ответы менеджера: на каждом языке клиента. */
export const QUICK = [
  { id: "price", title: T("Цена", "Narx"),
    ru: "Здравствуйте! Цена зависит от размера и материала. Пришлите размеры или фото комнаты, посчитаем за 15 минут.",
    uz: "Assalomu alaykum! Narx o‘lcham va materialga bog‘liq. O‘lcham yoki xona rasmini yuboring, 15 daqiqada hisoblaymiz.",
    en: "Hello! The price depends on size and material. Send the sizes or a photo of the room and we will count it in 15 minutes." },
  { id: "zamer", title: T("Замер", "O‘lchov"),
    ru: "Замерщик приедет бесплатно. Когда удобно: сегодня после 18:00 или завтра утром?",
    uz: "O‘lchovchi bepul keladi. Qachon qulay: bugun 18:00 dan keyin yoki ertaga ertalab?",
    en: "Our measurer comes for free. What suits you: today after 18:00 or tomorrow morning?" },
  { id: "works", title: T("Наши работы", "Ishlarimiz"),
    ru: "Отправляю наши шкафы-купе последних месяцев.",
    uz: "So‘nggi oylardagi shkaf-kupelarimizni yuboryapman.",
    en: "Sending our recent wardrobes." },
  { id: "addr", title: T("Адрес", "Manzil"),
    ru: "Шоурум открыт каждый день с 10:00 до 19:00. Отправить точку на карте?",
    uz: "Shou-rum har kuni 10:00 dan 19:00 gacha ochiq. Xaritadagi nuqtani yuboraymi?",
    en: "Our showroom is open daily 10:00 to 19:00. Shall I send the map pin?" },
];
/** Ответ, который кто-то отправил прямо из приложения Instagram. */
export const MANUAL = {
  ru: "Мадина, это Рустам, руководитель. Завтра в 10:00 подойдёт?",
  uz: "Madina, bu Rustam, rahbar. Ertaga soat 10:00 da qulaymi?",
  en: "Madina, this is Rustam, the manager. Does tomorrow at 10:00 work?",
};

export const CRMS = [
  { id: "amo", name: "amoCRM", no: 1042 },
  { id: "bitrix", name: "Bitrix24", no: 3318 },
  { id: "odoo", name: "Odoo", no: 207 },
];

export const UI = {
  /* шапка и подача */
  brandSub: T("прототип хаба · DevUz Studio", "xabmarkaz prototipi · DevUz Studio"),
  navPath: T("Путь", "Yo‘l"), navSchemes: T("Схемы", "Sxemalar"), navConnect: T("Подключение", "Ulash"), navPrice: T("Стоимость", "Narx"),
  h1: T("Заявки из Instagram сразу в Telegram, ответ из одного окна", "Instagram arizalari darhol Telegramda, javob bitta oynadan"),
  lead: T("Клиент пишет с рекламы в Instagram. Менеджер видит заявку в Telegram, берёт её и отвечает там же. Ответ приходит клиенту в Instagram от имени компании. Всё нажимается, данные демо.", "Mijoz Instagramdagi reklamadan yozadi. Menejer arizani Telegramda ko‘radi, oladi va o‘sha yerda javob beradi. Javob mijozga Instagramda kompaniya nomidan keladi. Hammasi bosiladi, ma’lumotlar namunaviy."),
  scheme: T("Схема", "Sxema"), role: T("Кто смотрит", "Kim ko‘radi"), roleMgr: T("Менеджер", "Menejer"), roleHead: T("Руководитель", "Rahbar"),
  schA: T("А · Группа с темами", "A · Mavzuli guruh"), schB: T("Б · «Взять» и личная тема", "B · «Olish» va shaxsiy mavzu"), schC: T("В · Лента ответов", "V · Javoblar lentasi"),
  sideClient: T("Клиент", "Mijoz"), sideMgr: T("Менеджер", "Menejer"),
  phoneIg: T("Instagram клиента", "Mijozning Instagrami"), phoneTg: T("Telegram менеджера", "Menejerning Telegrami"), phoneTgHead: T("Telegram руководителя", "Rahbarning Telegrami"),
  /* путь */
  pathTitle: T("Путь заявки", "Ariza yo‘li"), play: T("Проиграть", "Ko‘rsatish"), stop: T("Стоп", "To‘xtatish"), again: T("Сначала", "Boshidan"),
  s1: T("Клиент пишет с рекламы", "Mijoz reklamadan yozadi"), s1d: T("В Instagram: рилс → «Написать сообщение» → вопрос.", "Instagramda: rils → «Xabar yuborish» → savol."),
  s2: T("Заявка в Telegram, «Взять»", "Ariza Telegramda, «Olish»"), s2d: T("Кто нажал первым, тот ведёт клиента. Остальные видят, кто взял.", "Birinchi bosgan mijozni olib boradi. Qolganlar kim olganini ko‘radi."),
  s3: T("Менеджер отвечает", "Menejer javob beradi"), s3d: T("Текст, готовый ответ, фото или голос. В Instagram уходит от компании.", "Matn, tayyor javob, rasm yoki ovoz. Instagramga kompaniya nomidan ketadi."),
  s4: T("Клиент отвечает", "Mijoz javob beradi"), s4d: T("Ответ снова в той же теме. Ответили прямо из Instagram, тоже видно.", "Javob yana o‘sha mavzuda. To‘g‘ridan to‘g‘ri Instagramdan javob berilsa ham ko‘rinadi."),
  s5: T("Лид в CRM и закрытие", "CRMga lid va yopish"), s5d: T("«Создать лид» в amoCRM, Bitrix24 или Odoo, потом «Закрыть диалог».", "amoCRM, Bitrix24 yoki Odoo’da «Lid yaratish», keyin «Suhbatni yopish»."),
  doNow: T("Сейчас:", "Hozir:"), done: T("Путь пройден. Переключите схему или роль и посмотрите тот же путь иначе.", "Yo‘l o‘tildi. Sxema yoki rolni almashtirib, o‘sha yo‘lni boshqacha ko‘ring."),
  ctl: T("Демо-время и случаи", "Demo vaqt va holatlar"), ff10: T("+10 мин без ответа", "+10 daq javobsiz"), ff22: T("+22 часа", "+22 soat"), igManual: T("Ответ из приложения Instagram", "Instagram ilovasidan javob"),
  hintCta: T("Нажмите «Написать сообщение» под рекламой", "Reklama ostidagi «Xabar yuborish»ni bosing"),
  hintAsk: T("Выберите вопрос клиента: он задаёт и язык", "Mijoz savolini tanlang: u tilni ham belgilaydi"),
  hintOpen: T("Откройте чат с заявкой в Telegram", "Telegramda ariza chatini oching"),
  hintTake: T("Нажмите «Взять»", "«Olish»ni bosing"),
  hintTopic: T("Откройте тему клиента", "Mijoz mavzusini oching"),
  hintReply: T("Ответьте: «Готовые ответы», фото, голос или текст", "Javob bering: «Tayyor javoblar», rasm, ovoz yoki matn"),
  hintClient: T("Ответьте за клиента в Instagram", "Instagramda mijoz nomidan javob bering"),
  hintCrm: T("Нажмите «Создать лид», потом «Закрыть диалог»", "«Lid yaratish»ni, keyin «Suhbatni yopish»ni bosing"),
  hintClose: T("Нажмите «Закрыть диалог»", "«Suhbatni yopish»ni bosing"),
  /* Instagram */
  sponsored: T("Реклама", "Reklama"), sendMsg: T("Написать сообщение", "Xabar yuborish"), likes: T("Нравится: 1 284", "1 284 ta yoqdi"),
  adCaption: T("Шкаф-купе под ваш размер: замер бесплатно, фасады на выбор.", "O‘lchamingizga shkaf-kupe: o‘lchov bepul, fasadlarni tanlaysiz."),
  post2: T("Белая кухня для небольшой квартиры", "Kichik kvartira uchun oq oshxona"),
  replyAd: T("Вы отвечаете на рекламу", "Siz reklamaga javob beryapsiz"), replies: T("Обычно отвечает в течение часа", "Odatda bir soat ichida javob beradi"),
  msgPh: T("Сообщение…", "Xabar…"), igQuick: T("Частые вопросы", "Ko‘p beriladigan savollar"),
  photoRoom: T("Фото комнаты", "Xona rasmi"), seen: T("Просмотрено", "Ko‘rildi"), voiceMsg: T("Голосовое", "Ovozli xabar"),
  /* Telegram */
  search: T("Поиск по клиентам", "Mijozlar bo‘yicha qidiruv"), searchNone: T("Никого не нашли", "Hech kim topilmadi"), clients: T("Клиенты", "Mijozlar"),
  grpNew: T("Новые заявки", "Yangi arizalar"), grpHub: T("Хаб · все заявки", "Xab · barcha arizalar"), botHub: T("Хаб", "Xab"),
  members: T("участников: 4", "a’zolar: 4"), bot: T("бот", "bot"), topicsN: T("тем", "mavzu"),
  team: T("Команда", "Jamoa"), teamLast: T("Тимур: замер на Юнусабаде в 15:00", "Timur: Yunusobodda o‘lchov 15:00 da"),
  shop: T("Цех", "Sex"), shopLast: T("Фасады для Азизы готовы", "Aziza uchun fasadlar tayyor"),
  summary: T("Сводка руководителя", "Rahbar hisoboti"), summaryLast: T("Сегодня: заявок 19, ждут 0", "Bugun: 19 ariza, kutayotganlar 0"),
  newLead: T("Новая заявка из Instagram", "Instagramdan yangi ariza"), fromAd: T("с рекламы", "reklamadan"), noAd: T("без рекламы", "reklamasiz"),
  take: T("✋ Взять", "✋ Olish"), takeWork: T("✋ Взять в работу", "✋ Ishga olish"), took: T("взяла", "oldi"), tookM: T("взял", "oldi"), in: T("через", "keyin"),
  openTopic: T("Открыть тему", "Mavzuni ochish"), createLead: T("📋 Создать лид", "📋 Lid yaratish"), closeDlg: T("✅ Закрыть диалог", "✅ Suhbatni yopish"), reopen: T("Открыть снова", "Qayta ochish"),
  status: T("Статус", "Holat"), stNew: T("🆕 новый", "🆕 yangi"), stWork: T("🟢 в работе", "🟢 ishda"), stClosed: T("✅ закрыт", "✅ yopildi"),
  win: T("Окно ответа", "Javob oynasi"), winLeft: T("осталось", "qoldi"), winShut: T("закрыто: писать можно только после нового сообщения клиента", "yopildi: faqat mijozning yangi xabaridan keyin yozish mumkin"),
  manager: T("Менеджер", "Menejer"), nobody: T("никто", "hech kim"), crm: T("Лид CRM", "CRM lid"), crmNone: T("не создан", "yaratilmagan"), lang: T("Язык клиента", "Mijoz tili"),
  ad: T("Реклама", "Reklama"), first: T("Первое сообщение", "Birinchi xabar"),
  h: T("ч", "soat"), m: T("мин", "daq"), s: T("с", "s"),
  quick: T("Готовые ответы", "Tayyor javoblar"), quickLang: T("язык клиента", "mijoz tili"), photo: T("Фото", "Rasm"), voice: T("Голос", "Ovoz"),
  composer: T("Ответ клиенту…", "Mijozga javob…"), composerOff: T("Сначала нажмите «Взять»", "Avval «Olish»ni bosing"), replyTo: T("Ответ", "Javob"), pickReply: T("Нажмите «Ответить» под сообщением клиента", "Mijoz xabari ostidagi «Javob berish»ni bosing"),
  answer: T("↩ Ответить", "↩ Javob berish"), delivered: T("✓ ушло в Instagram", "✓ Instagramga ketdi"),
  manualNote: T("отправлено вручную из Instagram", "Instagramdan qo‘lda yuborildi"),
  renamed: T("Хаб назвал тему", "Xab mavzuni nomladi"), topicNew: T("Тема создана, клиент закреплён за вами", "Mavzu yaratildi, mijoz sizga biriktirildi"),
  remindNew: T("⏰ Заявка ждёт 10 минут, её никто не взял", "⏰ Ariza 10 daqiqadan beri kutyapti, hech kim olmadi"),
  remindReply: T("⏰ Клиент ждёт ответа 10 минут", "⏰ Mijoz 10 daqiqadan beri javob kutyapti"),
  remindHead: T("Руководителю ушла строка", "Rahbarga xabar ketdi"),
  warn2h: T("⚠️ Окно ответа закроется через 2 часа. Ответьте сейчас: потом Instagram не пропустит сообщение.", "⚠️ Javob oynasi 2 soatdan keyin yopiladi. Hozir javob bering: keyin Instagram xabarni o‘tkazmaydi."),
  crmPick: T("Куда создать лид?", "Lid qayerda yaratilsin?"), crmMade: T("Лид создан", "Lid yaratildi"), crmWhat: T("имя, Instagram, объявление и переписка", "ism, Instagram, e’lon va yozishma"),
  closed: T("Диалог закрыт", "Suhbat yopildi"), reopened: T("Клиент написал снова, тема открыта", "Mijoz yana yozdi, mavzu ochildi"),
  cancel: T("Отмена", "Bekor qilish"), push: T("сейчас", "hozir"),
  online: T("в сети", "tarmoqda"), you: T("Вы", "Siz"), today: T("Сегодня", "Bugun"),
  /* руководитель */
  hdToday: T("Сегодня", "Bugun"), hdLeads: T("заявок", "ariza"), hdWait: T("ждут сейчас", "hozir kutmoqda"), hdFirst: T("первый ответ в среднем", "o‘rtacha birinchi javob"),
  hdWho: T("Кто сколько взял", "Kim qancha oldi"), hdTook: T("взял", "oldi"), hdResp: T("ответ", "javob"), hdSlow: T("медленно", "sekin"),
  hdAds: T("Заявки по рекламе", "Reklama bo‘yicha arizalar"), hdNoAd: T("Без рекламы", "Reklamasiz"), hdWaitNow: T("Ждёт ответа", "Javob kutmoqda"), hdNone: T("Все клиенты получили ответ", "Barcha mijozlar javob oldi"),
  hdAll: T("Все темы в группе «Хаб · все заявки»: руководитель видит каждую переписку и может ответить сам.", "Barcha mavzular «Xab · barcha arizalar» guruhida: rahbar har bir yozishmani ko‘radi va o‘zi javob bera oladi."),
  hdOpen: T("Открыть все заявки", "Barcha arizalarni ochish"),
  /* Что у нас есть сверх готовых */
  ourT: T("Чего нет в обычном хабе", "Oddiy xabda yo‘q narsalar"),
  ourP: T("Мы смотрели, как такие хабы работают у мебельщиков в Ташкенте. Реклама там видна длинной ссылкой на файл, а кто ждёт ответа, никто не следит. У нас так:", "Toshkentdagi mebelchilarda bunday xablar qanday ishlashini ko‘rdik. U yerda reklama faylga uzun havola bo‘lib ko‘rinadi, kim javob kutayotganini hech kim kuzatmaydi. Bizda bunday:"),
  show: T("Показать", "Ko‘rsatish"),
  f1: T("Превью рекламы", "Reklama ko‘rinishi"), f1d: T("Картинка и название объявления прямо в карточке, а не ссылка на файл в облаке.", "E’lon rasmi va nomi kartochkaning o‘zida, bulutdagi faylga havola emas."),
  f2: T("Клиент ждёт: напоминание", "Mijoz kutyapti: eslatma"), f2d: T("Никто не взял за 10 минут или клиент ждёт ответа: бот пишет в чат, руководителю строка.", "10 daqiqada hech kim olmadi yoki mijoz javob kutyapti: bot chatga yozadi, rahbarga xabar."),
  f3: T("Окно закрывается через 2 часа", "Oyna 2 soatdan keyin yopiladi"), f3d: T("Instagram даёт ответить 24 часа после сообщения клиента. За 2 часа до конца бот предупреждает.", "Instagram mijoz xabaridan keyin 24 soat javob berishga imkon beradi. Tugashiga 2 soat qolganda bot ogohlantiradi."),
  f4: T("Вид руководителя", "Rahbar ko‘rinishi"), f4d: T("Кто сколько взял, время первого ответа, сколько заявок с какой рекламы.", "Kim qancha oldi, birinchi javob vaqti, qaysi reklamadan nechta ariza."),
  f5: T("Ответ на языке клиента", "Mijoz tilida javob"), f5d: T("Хаб видит язык сообщения, готовые ответы сразу на нём.", "Xab xabar tilini aniqlaydi, tayyor javoblar darhol o‘sha tilda."),
  f6: T("Поиск по клиентам", "Mijozlar bo‘yicha qidiruv"), f6d: T("Имя или @ник: тема клиента находится за секунду.", "Ism yoki @nik: mijoz mavzusi bir soniyada topiladi."),
  /* схемы */
  schT: T("Три схемы ответа из одного окна", "Bitta oynadan javobning uchta sxemasi"),
  schP: T("Путь один и тот же, отличается то, где менеджер видит клиента. Переключите схему над телефонами.", "Yo‘l bitta, menejer mijozni qayerda ko‘rishi farq qiladi. Telefonlar ustida sxemani almashtiring."),
  pros: T("Плюсы", "Afzalliklari"), cons: T("Минусы", "Kamchiliklari"), advise: T("Советуем", "Tavsiya qilamiz"), showScheme: T("Показать на телефоне", "Telefonda ko‘rsatish"),
  aT: T("Группа с темами", "Mavzuli guruh"), aD: T("Одна группа на всю команду, у каждого клиента своя тема. Так работает большинство хабов.", "Butun jamoa uchun bitta guruh, har bir mijozning o‘z mavzusi. Ko‘pchilik xablar shunday ishlaydi."),
  aP: [T("Видит вся команда и руководитель", "Butun jamoa va rahbar ko‘radi"), T("Работает в любом Telegram", "Har qanday Telegramda ishlaydi"), T("Просто запустить", "Ishga tushirish oson")],
  aC: [T("Сотни тем, своих клиентов не найти", "Yuzlab mavzu, o‘z mijozlaringni topib bo‘lmaydi"), T("Двое отвечают одному клиенту", "Ikki kishi bitta mijozga javob beradi"), T("Бот пишет в группу не больше 20 сообщений в минуту", "Bot guruhga daqiqasiga 20 tadan ko‘p xabar yoza olmaydi")],
  bT: T("«Взять» и личная тема", "«Olish» va shaxsiy mavzu"), bD: T("Новая заявка карточкой в «Новые заявки», кто нажал «Взять», у того клиент темой в личке с ботом. Руководителю группа со всеми.", "Yangi ariza «Yangi arizalar»da kartochka bo‘lib, «Olish»ni bosganda mijoz bot bilan shaxsiy chatda mavzu bo‘ladi. Rahbarga hammasi bor guruh."),
  bP: [T("Менеджер видит только своих", "Menejer faqat o‘zinikini ko‘radi"), T("Клиент не теряется: кто взял, тот и ведёт", "Mijoz yo‘qolmaydi: kim olgan bo‘lsa, o‘sha olib boradi"), T("Видно, кто и как быстро берёт", "Kim va qanchalik tez olishi ko‘rinadi")],
  bC: [T("Темы в личке с ботом есть в Telegram с 2026 года: нужен свежий Telegram", "Bot bilan shaxsiy chatdagi mavzular Telegramda 2026 yildan bor: yangi Telegram kerak"), T("Чуть сложнее собрать", "Yig‘ish biroz murakkabroq")],
  cT: T("Лента ответов", "Javoblar lentasi"), cD: T("Без тем: каждое сообщение клиента приходит новым сообщением бота, менеджер отвечает «Ответить» на него.", "Mavzusiz: mijozning har bir xabari botning yangi xabari bo‘lib keladi, menejer unga «Javob berish» bilan javob beradi."),
  cP: [T("Работает на любом телефоне", "Har qanday telefonda ishlaydi"), T("Ничего настраивать", "Hech narsa sozlash kerak emas")],
  cC: [T("Переписка клиентов перемешана", "Mijozlar yozishmasi aralashib ketadi"), T("Забыл нажать «Ответить», ответ не уйдёт", "«Javob berish»ni bosish unutilsa, javob ketmaydi"), T("Истории клиента подряд не видно", "Mijoz tarixini ketma-ket ko‘rib bo‘lmaydi")],
  whyB: T("Почему Б: менеджер видит только своих клиентов и не путается, никто не отвечает дважды, а руководитель видит всех в группе с темами, как в схеме А. Если у менеджера старый Telegram без тем в личке, ему включается лента В.", "Nega B: menejer faqat o‘z mijozlarini ko‘radi va adashmaydi, hech kim ikki marta javob bermaydi, rahbar esa A sxemasidagidek mavzuli guruhda hammani ko‘radi. Menejerda shaxsiy chatda mavzular bo‘lmagan eski Telegram bo‘lsa, unga V lentasi yoqiladi."),
  /* подключение */
  conT: T("Подключение за один день", "Bir kunda ulash"), conP: T("Четыре шага, нажимайте по очереди.", "To‘rt qadam, navbat bilan bosing."),
  c1: T("Instagram", "Instagram"), c1d: T("Профессиональный аккаунт компании: «Бизнес» или «Автор». В настройках сообщений включён доступ для подключённых приложений.", "Kompaniyaning professional akkaunti: «Biznes» yoki «Muallif». Xabar sozlamalarida ulangan ilovalar uchun ruxsat yoqilgan."),
  c2: T("Meta", "Meta"), c2d: T("Владелец входит через Instagram и разрешает хабу читать и отправлять сообщения. Facebook-страница не нужна.", "Egasi Instagram orqali kiradi va xabga xabarlarni o‘qish va yuborishga ruxsat beradi. Facebook sahifasi kerak emas."),
  c3: T("Telegram", "Telegram"), c3d: T("Бот хаба в группу «Новые заявки», руководителю группа со всеми темами. Каждый менеджер один раз нажимает «Старт» у бота.", "Xab boti «Yangi arizalar» guruhiga, rahbarga barcha mavzular bor guruh. Har bir menejer botda bir marta «Start»ni bosadi."),
  c4: T("Готово", "Tayyor"), c4d: T("Пишем тестовое сообщение с вашего телефона: через секунду заявка в Telegram.", "Telefoningizdan sinov xabarini yozamiz: bir soniyada ariza Telegramda."),
  conOk: T("Подключено", "Ulandi"), conNext: T("Дальше", "Keyingi"),
  needT: T("Что нужно от вас, честно", "Sizdan nima kerak, ochig‘i"),
  need: [
    T("Профессиональный аккаунт Instagram (бизнес или автор) и доступ владельца к нему.", "Instagram professional akkaunti (biznes yoki muallif) va egasining unga kirishi."),
    T("Аккаунт в Meta для разработчиков. Хаб на вашем аккаунте Meta запускается без проверки. Если хаб на нашем аккаунте обслуживает ваш, Meta проверяет приложение: обычно 1-4 недели, мы ведём её сами.", "Meta dasturchilar akkaunti. Sizning Meta akkauntingizdagi xab tekshiruvsiz ishga tushadi. Agar bizning akkauntimizdagi xab sizniki bilan ishlasa, Meta ilovani tekshiradi: odatda 1-4 hafta, uni o‘zimiz olib boramiz."),
    T("Telegram у всех менеджеров; для тем в личке с ботом нужно приложение, обновлённое в 2026 году.", "Barcha menejerlarda Telegram; bot bilan shaxsiy chatdagi mavzular uchun 2026 yilda yangilangan ilova kerak."),
    T("Сервер для хаба: от 10 $ в месяц, оплачиваете напрямую.", "Xab uchun server: oyiga 10 $ dan, to‘g‘ridan to‘g‘ri to‘laysiz."),
    T("Ответить можно в течение 24 часов после последнего сообщения клиента. Это правило Instagram, его не обойти.", "Mijozning oxirgi xabaridan keyin 24 soat ichida javob berish mumkin. Bu Instagram qoidasi, uni chetlab bo‘lmaydi."),
  ],
  /* стоимость */
  priceT: T("Стоимость", "Narx"), priceP: T("Основа по акции и допы тумблерами. Сумма считается сразу.", "Aksiya bo‘yicha asos va tugmali qo‘shimchalar. Summa darhol hisoblanadi."),
  offer: T("Цена по акции ещё", "Aksiya narxi yana"), offerEnd: T("Акция закончилась, цена обычная", "Aksiya tugadi, narx odatiy"),
  weeks: T("недели", "hafta"), total: T("Итого", "Jami"), addons: T("Допы", "Qo‘shimchalar"), popular: T("берут первым", "birinchi olishadi"),
  discuss: T("Обсудить с DevUz Studio", "DevUz Studio bilan muhokama qilish"), oneTime: T("разово, без подписки", "bir martalik, obunasiz"),
  /* подвал */
  legalOwn: T("Прототип принадлежит DevUz Studio. Компания, клиенты и цифры демо.", "Prototip DevUz Studio’ga tegishli. Kompaniya, mijozlar va raqamlar namunaviy."),
  terms: T("Условия использования макета", "Maketdan foydalanish shartlari"),
};
