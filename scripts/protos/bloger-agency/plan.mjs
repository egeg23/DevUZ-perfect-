// Конструктор тарифа — как у MAVERA (egeg23/Global-Export:
// components/configurator): на каждой странице прототипа плашка
// «Конструктор», тумблер включает и выключает настоящий блок на странице,
// итог «сайт + допы» считается сразу. То, чего на макете нет (админка,
// кабинеты, оплата), — группа «Сверх сайта».
//
// Цены — средние по Ташкенту, в долларах. Сайт — 1 800 $ (решение владельца,
// 06.10.2026). Допы — от ставок нашего калькулятора (content/calculator.ts:
// базовая админка 5,5 млн сум, расширенная 13 млн, личный кабинет 7,5 млн,
// онлайн-оплата 7 млн, интеграция 7,5 млн, уведомления и SEO по 4,5 млн) по
// 12 650 сум за доллар, сдвинутых к середине рыночной вилки и округлённых до
// 50 $. Блоки витрины — по тем же ставкам, что у MAVERA, сдвинутым вниз.

/** Сайт: главная, каталог, «Брендам», «Блогерам», «Кейсы», русский язык. */
export const BASE = {
  price: 1800,
  ru: {
    t: "Сайт: главная, каталог блогеров, «Брендам», «Блогерам», «Кейсы»",
    d: "Тарифы и услуги с ценами, каталог с фильтрами, телефон в первую очередь, заявки в ваш Telegram.",
  },
  uz: {
    t: "Sayt: bosh sahifa, blogerlar katalogi, «Brendlarga», «Blogerlarga», «Keyslar»",
    d: "Narxlari bilan tariflar va xizmatlar, filtrli katalog, avvalo telefon uchun, arizalar Telegramingizga.",
  },
};

/**
 * Блоки, которые видно на макете. `where` — ключ страницы (как в адресе:
 * "" — главная) или "all" — на всех страницах. На странице блок помечен
 * data-addon="<id>"; выключили — его нет.
 */
export const ADDONS = [
  { id: "portal", where: "", price: 300, ru: { t: "Влёт в букву", e: "Название огромными буквами, на прокрутке камера влетает в «O»" }, uz: { t: "Harf ichiga kirish", e: "Nom katta harflarda, aylantirganda kamera «O» ichiga kiradi" } },
  { id: "stories", where: "", price: 250, ru: { t: "Сторис-плеер на первом экране", e: "Ваши топ-блогеры листаются, как сторис в Instagram" }, uz: { t: "Birinchi ekranda storis-pleer", e: "Top blogerlaringiz Instagram storislaridek almashadi" } },
  { id: "ticker", where: "", price: 50, ru: { t: "Бегущая строка клиентов", e: "Schwarzkopf, Uzum, BYD и другие — лентой" }, uz: { t: "Mijozlar yuguruvchi satri", e: "Schwarzkopf, Uzum, BYD va boshqalar — lenta bo‘lib" } },
  { id: "ai", where: "", price: 700, ru: { t: "ИИ-подбор блогеров по брифу", e: "Бриф своими словами — подборка из вашего каталога" }, uz: { t: "Brif bo‘yicha AI-tanlov", e: "O‘z so‘zlaringiz bilan brif — katalogingizdan tanlov" } },
  { id: "calc", where: "", price: 300, ru: { t: "Калькулятор кампании", e: "Бюджет → блогеры, охват, переходы и подходящий тариф" }, uz: { t: "Kampaniya kalkulyatori", e: "Byudjet → blogerlar, qamrov, o‘tishlar va mos tarif" } },
  { id: "slot", where: "", price: 150, ru: { t: "Слот-машина идей", e: "Ниша + формат + фишка — идея кампании за одно нажатие" }, uz: { t: "G‘oyalar slot-mashinasi", e: "Nisha + format + fishka — bir bosishda kampaniya g‘oyasi" } },
  { id: "reviews", where: "", price: 100, ru: { t: "Отзывы клиентов", e: "Sabano, Fix Price, Skillbox" }, uz: { t: "Mijozlar sharhlari", e: "Sabano, Fix Price, Skillbox" } },
  { id: "events", where: "", price: 100, ru: { t: "Блок ивентов", e: "PRO BLOGGERS и TAF" }, uz: { t: "Tadbirlar bloki", e: "PRO BLOGGERS va TAF" } },
  { id: "blogybox", where: "", price: 50, ru: { t: "Блок BLOGY", e: "Платформа в Telegram и ссылка на бота" }, uz: { t: "BLOGY bloki", e: "Telegramdagi platforma va botga havola" } },
  { id: "shortlist", where: "blogery", price: 250, ru: { t: "Подборка блогеров в Telegram", e: "«В подборку» на карточке, подборка уходит менеджеру одним сообщением" }, uz: { t: "Telegramga blogerlar tanlovi", e: "Kartochkada «Tanlovga», tanlov menejerga bitta xabar bo‘lib ketadi" } },
  { id: "ugc", where: "ugc", price: 900, ru: { t: "UGC-студия за токены", e: "ИИ пишет хуки, сценарий и раскадровку; кошелёк токенов" }, uz: { t: "Tokenlar evaziga UGC-studiya", e: "AI xuklar, ssenariy va raskadrovka yozadi; token hamyoni" } },
  { id: "brief", where: "brendam", price: 300, ru: { t: "ИИ-бриф-мастер", e: "Две фразы — и бриф разложен по полям" }, uz: { t: "AI brif-master", e: "Ikki jumla — va brif maydonlarga ajratilgan" } },
  { id: "rate", where: "blogeram", price: 200, ru: { t: "Оценка блога для блогеров", e: "ER и цены похожих блогеров из вашего каталога" }, uz: { t: "Blogerlar uchun blog bahosi", e: "ER va katalogingizdagi o‘xshash blogerlar narxlari" } },
  { id: "uz", where: "all", price: 300, ru: { t: "Узбекская версия", e: "Переключатель RU / UZ в шапке" }, uz: { t: "O‘zbekcha versiya", e: "Shapkada RU / UZ almashtirgich" } },
  { id: "motion", where: "all", price: 200, ru: { t: "Анимации появления", e: "У каждого блока своё движение" }, uz: { t: "Paydo bo‘lish animatsiyalari", e: "Har bir blokning o‘z harakati" } },
  { id: "tgbtn", where: "all", price: 50, ru: { t: "Кнопка Telegram под пальцем", e: "Плавающая кнопка внизу экрана на телефоне" }, uz: { t: "Barmoq ostidagi Telegram tugmasi", e: "Telefonda ekran pastidagi suzuvchi tugma" } },
];

/**
 * Сверх сайта: блока на макете нет, в разделе «Что дальше» — превью.
 * `needs` — без чего не работает: включается вместе с ним.
 */
export const BLOCKS = [
  {
    id: "admin", group: "team", price: 450, pv: "admin", needs: [],
    ru: { t: "Админка агентства", why: "Сейчас 65 карточек блогеров зашиты в код страницы, а на странице AI прямо написано: «Цены могут быть не актуальны». В админке менеджер меняет цену и охват за минуту — и каталог, калькулятор и ИИ-подбор сразу считают по новым.", li: ["Блогеры, ниши, цены Story и Post", "Тарифы Silver, Gold, Platinum и услуги", "Кейсы и отзывы", "Вход с телефона, роли"] },
    uz: { t: "Agentlik admin paneli", why: "Hozir 65 ta bloger kartochkasi sahifa kodiga tikilgan, AI sahifasida esa ochiq yozilgan: «Narxlar eskirgan bo‘lishi mumkin». Admin panelda menejer narx va qamrovni bir daqiqada o‘zgartiradi — katalog, kalkulyator va AI-tanlov darhol yangisi bo‘yicha hisoblaydi.", li: ["Blogerlar, nishalar, Story va Post narxlari", "Silver, Gold, Platinum tariflari va xizmatlar", "Keyslar va sharhlar", "Telefondan kirish, rollar"] },
  },
  {
    id: "crm", group: "team", price: 1000, pv: "crm", needs: ["admin"],
    ru: { t: "Кампании по вашим 8 этапам", why: "В КП у вас восемь этапов — от брифа до следующей волны — и оплата по этапам с актом перед каждым. Сейчас это переписка и таблицы. Здесь у каждой кампании статус, ответственный, акты и история.", li: ["Бриф → подборка → предоплата → ТЗ → выход → проверка → статистика", "Акт и счёт по этапу одной кнопкой", "Кто из менеджеров ведёт", "Напоминания, где кампания застряла"] },
    uz: { t: "8 bosqichingiz bo‘yicha kampaniyalar", why: "TTda sizda sakkiz bosqich — brifdan keyingi to‘lqingacha — va har biridan oldin dalolatnoma bilan bosqichma-bosqich to‘lov. Hozir bu yozishma va jadvallar. Bu yerda har bir kampaniyaning holati, mas’uli, dalolatnomalari va tarixi bor.", li: ["Brif → tanlov → oldindan to‘lov → TZ → chiqish → tekshiruv → statistika", "Bosqich dalolatnomasi va hisob bitta tugma bilan", "Qaysi menejer olib boradi", "Kampaniya qayerda to‘xtab qolgani haqida eslatma"] },
  },
  {
    id: "leads", group: "team", price: 250, pv: "leads", needs: [],
    ru: { t: "Заявки и брифы — в Telegram отдела", why: "Бриф сейчас — Google-форма: заявка лежит в таблице, пока её не откроют. Здесь каждая заявка с сайта, ИИ-подбор и собранная подборка падают в чат отдела за секунды.", li: ["Имя, контакт, бюджет, ниша", "Подборка блогеров из каталога — списком", "Откуда пришёл человек"] },
    uz: { t: "Arizalar va briflar — bo‘lim Telegramiga", why: "Hozir brif — Google-forma: ariza ochilmaguncha jadvalda yotadi. Bu yerda saytdan kelgan har bir ariza, AI-tanlov va yig‘ilgan tanlov bo‘lim chatiga soniyalarda tushadi.", li: ["Ism, kontakt, byudjet, nisha", "Katalogdan blogerlar tanlovi — ro‘yxat bilan", "Odam qayerdan kelgani"] },
  },
  {
    id: "report", group: "team", price: 400, pv: "report", needs: ["crm"],
    ru: { t: "Отчёт кампании ссылкой", why: "Вы обещаете бренду статистику — переходы и охваты. Отчёт собирается из кампании сам: страница по ссылке, которую бренд перешлёт руководителю, вместо пачки скриншотов.", li: ["Блогеры, выходы, охват, переходы", "Промокоды и заявки, если есть", "Выгрузка в PDF"] },
    uz: { t: "Havola orqali kampaniya hisoboti", why: "Siz brendga statistika va’da qilasiz — o‘tishlar va qamrov. Hisobot kampaniyadan o‘zi yig‘iladi: skrinshotlar to‘plami o‘rniga brend rahbariga yuboradigan havola.", li: ["Blogerlar, chiqishlar, qamrov, o‘tishlar", "Promokodlar va arizalar, bo‘lsa", "PDFga yuklash"] },
  },
  {
    id: "brand", group: "brands", price: 600, pv: "brand", needs: ["crm"],
    ru: { t: "Кабинет бренда", why: "Бренд видит, на каком этапе его кампания, согласует ролик кнопкой и скачивает акт — без «как там наша реклама?» в мессенджере. Отзыв Skillbox у вас как раз про это: «всегда была в курсе происходящего».", li: ["Этап кампании и сроки", "Согласовать ролик или вернуть с комментарием", "Акты, счета, отчёт", "Повторить кампанию в один клик"] },
    uz: { t: "Brend kabineti", why: "Brend kampaniyasi qaysi bosqichda ekanini ko‘radi, rolikni tugma bilan tasdiqlaydi va dalolatnomani yuklab oladi — messenjerda «reklamamiz nima bo‘ldi?» siz. Skillbox sharhingiz aynan shu haqida: «doim nima bo‘layotganidan xabardor edim».", li: ["Kampaniya bosqichi va muddatlar", "Rolikni tasdiqlash yoki izoh bilan qaytarish", "Dalolatnomalar, hisoblar, hisobot", "Kampaniyani bir bosishda takrorlash"] },
  },
  {
    id: "blogger", group: "bloggers", price: 900, pv: "blogger", needs: ["admin"],
    ru: { t: "Кабинет блогера-резидента", why: "Резидентам вы обещаете готовые заказы, ТЗ и ответ рекламодателю за 2 часа. Кабинет держит это обещание: заказ с таймером, ТЗ, загрузка ролика, выплаты — и свои цены блогер правит сам.", li: ["Входящие заказы с таймером 2 часа", "ТЗ, сроки, загрузка ролика", "Выплаты и документы", "Свои цены и статистика профиля"] },
    uz: { t: "Rezident bloger kabineti", why: "Rezidentlarga tayyor buyurtmalar, TZ va reklama beruvchiga 2 soatda javob va’da qilasiz. Kabinet shu va’dani ushlab turadi: taymerli buyurtma, TZ, rolikni yuklash, to‘lovlar — narxlarini bloger o‘zi tahrirlaydi.", li: ["2 soatlik taymerli kiruvchi buyurtmalar", "TZ, muddatlar, rolikni yuklash", "To‘lovlar va hujjatlar", "O‘z narxlari va profil statistikasi"] },
  },
  {
    id: "blogy", group: "bloggers", price: 600, pv: "blogy", needs: ["admin"],
    ru: { t: "Связка с ботом BLOGY", why: "Бот у вас уже есть. Сайт и BLOGY на одной базе: блогер из бота сразу в каталоге, заказ с сайта приходит блогеру в бот.", li: ["Одна анкета блогера на сайт и бот", "Заказы и уведомления в бот", "Вход на сайт через Telegram"] },
    uz: { t: "BLOGY boti bilan bog‘lash", why: "Botingiz allaqachon bor. Sayt va BLOGY bitta bazada: botdagi bloger darhol katalogda, saytdagi buyurtma blogerga botda keladi.", li: ["Sayt va bot uchun bitta bloger anketasi", "Buyurtmalar va bildirishnomalar botga", "Saytga Telegram orqali kirish"] },
  },
  {
    id: "pay", group: "money", price: 550, pv: "ugc", needs: ["ugc"],
    ru: { t: "Оплата токенов Click и Payme", why: "UGC-студия на макете считает токены в браузере. С оплатой это новый продукт: малый бизнес покупает пакет, пишет сценарии, а из сценария — заказ съёмки по вашему прайсу на видео (10 роликов — 650 $).", li: ["Пакеты токенов", "Оплата Click и Payme", "История генераций в кабинете"] },
    uz: { t: "Click va Payme orqali token to‘lovi", why: "Maketdagi UGC-studiya tokenlarni brauzerda hisoblaydi. To‘lov bilan bu yangi mahsulot: kichik biznes paket sotib oladi, ssenariy yozadi, ssenariydan esa video narxingiz bo‘yicha suratga olish buyurtmasi (10 rolik — 650 $).", li: ["Token paketlari", "Click va Payme orqali to‘lov", "Kabinetda generatsiyalar tarixi"] },
  },
  {
    id: "access", group: "money", price: 600, pv: "access", needs: ["admin"],
    ru: { t: "Платный доступ к базе блогеров", why: "Ваша страница AI уже продаёт контакты: 10 блогеров — 60 000 сум через Click, 3 поиска в час. Делаем это частью сайта: оплатил — контакты открылись в кабинете, без ручной выдачи.", li: ["Пакеты по числу блогеров", "Оплата Click, доступ сразу", "Контакты и цены — из админки"] },
    uz: { t: "Blogerlar bazasiga pullik kirish", why: "AI sahifangiz allaqachon kontakt sotadi: 10 bloger — Click orqali 60 000 so‘m, soatiga 3 qidiruv. Buni sayt qismiga aylantiramiz: to‘ladi — kontaktlar kabinetda ochildi, qo‘lda berishsiz.", li: ["Blogerlar soni bo‘yicha paketlar", "Click orqali to‘lov, darhol kirish", "Kontaktlar va narxlar — admin paneldan"] },
  },
  {
    id: "eventsreg", group: "grow", price: 400, pv: "events", needs: [],
    ru: { t: "Регистрация на ивенты", why: "PRO BLOGGERS — 500+ участников, TAF — 1000+. Регистрация и партнёрские пакеты прямо на сайте, список участников — в админке.", li: ["Страница события и регистрация", "Партнёрские пакеты для брендов", "Напоминания участникам в Telegram"] },
    uz: { t: "Tadbirlarga ro‘yxatdan o‘tish", why: "PRO BLOGGERS — 500+ ishtirokchi, TAF — 1000+. Ro‘yxatdan o‘tish va hamkorlik paketlari to‘g‘ridan-to‘g‘ri saytda, ishtirokchilar ro‘yxati — admin panelda.", li: ["Tadbir sahifasi va ro‘yxatdan o‘tish", "Brendlar uchun hamkorlik paketlari", "Ishtirokchilarga Telegramda eslatmalar"] },
  },
  {
    id: "en", group: "grow", price: 300, pv: "en", needs: [],
    ru: { t: "Английская версия", why: "У вас уже есть /en — для международных брендов из вашего списка: Samsung, LG, adidas, Yandex.", li: ["Третий язык всех страниц", "Переключатель RU / UZ / EN"] },
    uz: { t: "Inglizcha versiya", why: "Sizda allaqachon /en bor — ro‘yxatingizdagi xalqaro brendlar uchun: Samsung, LG, adidas, Yandex.", li: ["Barcha sahifalarning uchinchi tili", "RU / UZ / EN almashtirgich"] },
  },
  {
    id: "seo", group: "grow", price: 200, pv: "seo", needs: [],
    ru: { t: "SEO и карта сайта", why: "Чтобы бренд находил вас по «реклама у блогеров Ташкент»: заголовки, описания, разметка организации и услуг, sitemap, Search Console и Вебмастер.", li: ["Заголовки и описания всех страниц", "Разметка для поиска", "Подключение к Google и Яндексу"] },
    uz: { t: "SEO va sayt xaritasi", why: "Brend sizni «Toshkentda blogerlarda reklama» bo‘yicha topishi uchun: sarlavhalar, tavsiflar, tashkilot va xizmatlar belgisi, sitemap, Search Console va Vebmaster.", li: ["Barcha sahifalar sarlavha va tavsiflari", "Qidiruv uchun belgilash", "Google va Yandeksga ulash"] },
  },
];

export const GROUPS = {
  team: { ru: "Для команды агентства", uz: "Agentlik jamoasi uchun" },
  brands: { ru: "Для брендов", uz: "Brendlar uchun" },
  bloggers: { ru: "Для блогеров", uz: "Blogerlar uchun" },
  money: { ru: "Деньги", uz: "Daromad" },
  grow: { ru: "Рост", uz: "O‘sish" },
};
