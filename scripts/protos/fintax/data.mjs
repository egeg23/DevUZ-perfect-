/*
 * Факты FinTax Consulting — только с их сайта fintax.uz (ru, uz, en,
 * снято 26.10.2026) и из описания Telegram @fintax_admin. Тексты сайта
 * переписаны без длинных тире; смысл их, слова по возможности их же.
 * Год основания на сайте расходится (ru «с 2019 года», en «since 2016») —
 * на макете года нет, это вопрос клиенту.
 */
export const LANGS = ["ru", "uz", "en"];

export const CONTACT = {
  phone: "+998978900770",
  phoneTxt: "+998 97 890-07-70",
  tg: "fintax_admin",
  email: "fintax.tashkent@gmail.com",
  map: "https://maps.app.goo.gl/RvYFdtc2pzzY8nBU9",
  youtube: "https://www.youtube.com/@fintaxcompany",
  address: {
    ru: "Ташкент, Яккасарайский район, ул. Кушбеги, 31B",
    uz: "Toshkent, Yakkasaroy tumani, Qushbegi ko‘chasi, 31B",
    en: "31B Qushbegi St, Yakkasaray district, Tashkent",
  },
  hours: { ru: "Ежедневно, 9:00-19:00", uz: "Har kuni, 9:00-19:00", en: "Daily, 9:00-19:00" },
};

/* Первый экран: заголовок и четыре пункта — с их главной. */
export const HERO = {
  kicker: { ru: "Бухгалтерское и кадровое сопровождение", uz: "Buxgalteriya va kadrlar hisobini yuritish", en: "Accounting and HR support" },
  h1: {
    ru: ["Аутсорсинг бухгалтерии в Ташкенте.", "Сэкономьте время и деньги"],
    uz: ["Toshkentda buxgalteriya autsorsingi.", "Vaqt va pulingizni tejang"],
    en: ["Outsourced accounting in Tashkent.", "Save time and money"],
  },
  points: {
    ru: ["Сократим налоговую нагрузку до 30% законным путём", "Несём материальную ответственность за ошибки: всё прописано в договоре", "Ведение бухгалтерии и сдача отчётности от 1 500 000 сум в месяц", "Внимательное, человечное отношение к каждому клиенту"],
    uz: ["Soliq yukini qonuniy yo‘l bilan 30% gacha kamaytiramiz", "Xatolar uchun moddiy javobgarlikni o‘z zimmamizga olamiz: barchasi shartnomada ko‘rsatilgan", "Buxgalteriya hisobini yuritish va hisobot topshirish oyiga 1 500 000 so‘mdan", "Har bir mijozga e’tiborli va samimiy munosabat"],
    en: ["We legally reduce your tax burden by up to 30%", "We bear financial liability for errors: it is all in the contract", "Bookkeeping and tax reporting from 1,500,000 UZS a month", "An attentive, personal approach to every client"],
  },
  served: { ru: "Обслуживаем больше 100 компаний", uz: "100 dan ortiq kompaniyaga xizmat ko‘rsatamiz", en: "We serve more than 100 companies" },
};

/* Услуги: десять, как на сайте. g — группа на схеме «что берём на себя». */
export const SERVICES = [
  { id: "uchet", g: "book", ic: "book",
    ru: ["Бухгалтерский и налоговый учёт", "Подбираем сопровождение под потребности бизнеса: объём документов, сотрудники, налоговый режим."],
    uz: ["Buxgalteriya va soliq hisobi", "Biznesni qo‘llab-quvvatlashni mijoz ehtiyojiga qarab tanlaymiz: hujjatlar hajmi, xodimlar, soliq tizimi."],
    en: ["Accounting and tax accounting", "We shape the support around your needs: document volume, staff and tax regime."] },
  { id: "report", g: "report", ic: "send",
    ru: ["Сдача любой отчётности", "Сдаём отчётность за клиента через электронный документооборот с госорганами."],
    uz: ["Har qanday hisobotni topshirish", "Hisobotni mijoz o‘rniga davlat organlari bilan elektron hujjat aylanishi orqali topshiramiz."],
    en: ["Submission of any reports", "We submit reports on the client’s behalf through electronic document exchange with government agencies."] },
  { id: "restore", g: "book", ic: "restore",
    ru: ["Восстановление бухучёта", "Не везде учёт ведётся по требованиям закона. У нас богатый опыт восстановления."],
    uz: ["Buxgalteriya hisobini tiklash", "Korxonada hisob har doim ham qonun talablari asosida yuritilmaydi. Biz tiklash bo‘yicha katta tajribaga egamiz."],
    en: ["Restoring accounting records", "Records are not always kept as the law requires. We have extensive experience in restoring them."] },
  { id: "consult", g: "advice", ic: "chat",
    ru: ["Консультации по бухгалтерии", "Даже если вы не наш клиент, можно получить быструю квалифицированную консультацию по налоговому законодательству."],
    uz: ["Buxgalteriya bo‘yicha maslahatlar", "Mijozimiz bo‘lmasangiz ham, soliq qonunchiligi bo‘yicha tezkor va malakali maslahat olishingiz mumkin."],
    en: ["Accounting consultations", "Even if you are not our client, you can get prompt, qualified advice on tax legislation."] },
  { id: "ved", g: "book", ic: "globe",
    ru: ["Бухгалтерский учёт ВЭД", "У учёта внешнеэкономической деятельности свои особенности. Поможем в них разобраться."],
    uz: ["Tashqi iqtisodiy faoliyat buxgalteriyasi", "Tashqi iqtisodiy faoliyat hisobining o‘ziga xos xususiyatlari bor. Biz bu borada yordam beramiz."],
    en: ["Foreign trade accounting", "Accounting for foreign economic activity has its own rules. We will help you with them."] },
  { id: "hire", g: "people", ic: "user",
    ru: ["Поиск персонала для клиента", "Помогаем подобрать бухгалтера: собеседуем и тестируем кандидатов, чтобы его уровень подходил задачам фирмы."],
    uz: ["Mijoz uchun xodim qidirish", "Buxgalter tanlashda yordam beramiz: nomzodlarni suhbat va sinovdan o‘tkazamiz, malakasi kompaniya vazifalariga mos bo‘lishi uchun."],
    en: ["Recruiting for the client", "We help you hire an accountant: we interview and test candidates so their skills match the company’s tasks."] },
  { id: "urgent", g: "report", ic: "clock",
    ru: ["Срочная сдача отчётности", "Решим срочный вопрос, если ваша бухгалтерия не может сдать отчётность или отчёты за несколько периодов не сдавались."],
    uz: ["Shoshilinch hisobot topshirish", "Buxgalteriyangiz hisobotni topshira olmasa yoki bir necha davr uchun hisobot topshirilmagan bo‘lsa, muammoni hal qilamiz."],
    en: ["Urgent report submission", "We solve it fast if your accounting team cannot file reports or several periods were never filed."] },
  { id: "train", g: "people", ic: "cap",
    ru: ["Обучение персонала клиента", "Учим сотрудников работать правильно: регламенты внесения документов, схемы взаимодействия, зоны ответственности отделов."],
    uz: ["Mijoz xodimlarini o‘qitish", "Xodimlarni to‘g‘ri ishlashga o‘rgatamiz: hujjat kiritish qoidalari, o‘zaro aloqa sxemalari, bo‘limlarning javobgarlik zonalari."],
    en: ["Training the client’s staff", "We teach your team to work correctly: document entry rules, interaction schemes and each department’s responsibilities."] },
  { id: "sysaudit", g: "check", ic: "search",
    ru: ["Аудит системы бухучёта", "Смотрим, как устроен учёт в компании, в каких программах работает бухгалтер, и даём рекомендации, как работать эффективнее."],
    uz: ["Buxgalteriya hisob tizimi auditi", "Kompaniyada hisob qanday tashkil etilgani, buxgalter qaysi dasturlarda ishlashini ko‘rib chiqamiz va samaradorlik bo‘yicha tavsiyalar beramiz."],
    en: ["Accounting system review", "We look at how accounting is organised, which programs your accountant uses, and recommend how to work more efficiently."] },
  { id: "audit", g: "check", ic: "shield",
    ru: ["Аудит", "Сравниваем порядок ведения учёта и правильность налоговой отчётности и даём заключение."],
    uz: ["Audit", "Buxgalteriya hisobi yuritilishi tartibi va soliq hisobotining to‘g‘riligini solishtiramiz va xulosa beramiz."],
    en: ["Audit", "We compare how accounting is kept with the accuracy of tax reporting and give a conclusion."] },
];

export const GROUPS = {
  book: { ru: "Учёт", uz: "Hisob", en: "Accounting" },
  report: { ru: "Отчётность", uz: "Hisobotlar", en: "Reporting" },
  advice: { ru: "Советы", uz: "Maslahat", en: "Advice" },
  people: { ru: "Люди", uz: "Xodimlar", en: "People" },
  check: { ru: "Проверка", uz: "Tekshiruv", en: "Review" },
};

/* Тарифы — ровно как на сайте. lim — пределы тарифа для подбора. */
export const TARIFFS = [
  { id: "ip", lim: { docs: 30, staff: 4, turn: 0 }, vat: false, ved: false,
    ru: ["Предприниматель", "Для предпринимателей, которые не хотят возиться с бухгалтерией", ["до 30 документов", "менее 4 сотрудников", "налоги УСН (4%)", "оборот до 100 млн сум"], "от 1,5 до 4 млн сум/мес"],
    uz: ["Tadbirkor", "Buxgalteriya bilan shug‘ullanishni istamaydigan tadbirkorlar uchun", ["30 tagacha hujjat", "4 nafardan kam xodim", "soddalashtirilgan soliq tizimi (4%)", "aylanma 100 mln so‘mgacha"], "oyiga 1,5 dan 4 mln so‘mgacha"],
    en: ["Entrepreneur", "For entrepreneurs who don’t want to deal with accounting", ["up to 30 documents", "fewer than 4 employees", "simplified tax system (4%)", "turnover up to 100 million UZS"], "1.5 to 4 million UZS/month"] },
  { id: "small", lim: { docs: 50, staff: 10, turn: 1 }, vat: true, ved: false,
    ru: ["Малый бизнес", "Для владельцев небольшого бизнеса, оптовка или услуги", ["до 50 документов", "менее 10 сотрудников", "налоги ОСН (НДС)", "оборот до 300 млн сум"], "от 4 до 6 млн сум/мес"],
    uz: ["Kichik biznes", "Kichik biznes egalari, ulgurji savdo yoki xizmat ko‘rsatish uchun", ["50 tagacha hujjat", "10 nafardan kam xodim", "umumiy soliq tizimi (QQS)", "aylanma 300 mln so‘mgacha"], "oyiga 4 dan 6 mln so‘mgacha"],
    en: ["Small business", "For small business owners, wholesale or services", ["up to 50 documents", "fewer than 10 employees", "general tax system (VAT)", "turnover up to 300 million UZS"], "4 to 6 million UZS/month"] },
  { id: "mid", lim: { docs: 90, staff: 18, turn: 2 }, vat: true, ved: true,
    ru: ["Средний бизнес", "Для владельцев среднего бизнеса, малое производство, оптовка или розница", ["до 90 документов", "менее 18 сотрудников", "налоги ОСН (НДС)", "сопровождение ВЭД", "оборот до 1 млрд сум"], "от 6 до 10 млн сум/мес"],
    uz: ["O‘rta biznes", "O‘rta biznes egalari, kichik ishlab chiqarish, ulgurji yoki chakana savdo uchun", ["90 tagacha hujjat", "18 nafardan kam xodim", "umumiy soliq tizimi (QQS)", "tashqi iqtisodiy faoliyatni yuritish", "aylanma 1 mlrd so‘mgacha"], "oyiga 6 dan 10 mln so‘mgacha"],
    en: ["Medium business", "For medium-sized businesses, small production, wholesale or retail", ["up to 90 documents", "fewer than 18 employees", "general tax system (VAT)", "foreign trade support", "turnover up to 1 billion UZS"], "6 to 10 million UZS/month"] },
  { id: "big", lim: { docs: 120, staff: 25, turn: 3 }, vat: true, ved: true,
    ru: ["Крупный бизнес", "Для крупных компаний, которые твёрдо стоят на рынке", ["до 120 документов", "менее 25 сотрудников", "налоги ОСН (НДС)", "сопровождение ВЭД", "оборот от 1 млрд сум"], "от 10 млн сум/мес"],
    uz: ["Yirik biznes", "Bozorda mustahkam o‘rin egallagan yirik kompaniyalar uchun", ["120 tagacha hujjat", "25 nafardan kam xodim", "umumiy soliq tizimi (QQS)", "tashqi iqtisodiy faoliyatni yuritish", "aylanma 1 mlrd so‘mdan"], "oyiga 10 mln so‘mdan"],
    en: ["Large business", "For large companies firmly established in the market", ["up to 120 documents", "fewer than 25 employees", "general tax system (VAT)", "foreign trade support", "turnover from 1 billion UZS"], "from 10 million UZS/month"] },
];

/* Подбор: обороты — ступени тарифов сайта. */
export const TURNOVER = {
  ru: ["до 100 млн сум", "до 300 млн сум", "до 1 млрд сум", "от 1 млрд сум"],
  uz: ["100 mln so‘mgacha", "300 mln so‘mgacha", "1 mlrd so‘mgacha", "1 mlrd so‘mdan"],
  en: ["up to 100 million UZS", "up to 300 million UZS", "up to 1 billion UZS", "from 1 billion UZS"],
};
/* Тип бизнеса — из описаний тарифов на их сайте: опт, розница, услуги, производство. */
export const KINDS = [
  { id: "ip", ru: "Предприниматель", uz: "Tadbirkor", en: "Sole trader" },
  { id: "opt", ru: "Опт", uz: "Ulgurji savdo", en: "Wholesale" },
  { id: "retail", ru: "Розница", uz: "Chakana savdo", en: "Retail" },
  { id: "serv", ru: "Услуги", uz: "Xizmatlar", en: "Services" },
  { id: "prod", ru: "Производство", uz: "Ishlab chiqarish", en: "Production" },
];

/* «Почему мы, а не штатный бухгалтер» — семь пунктов сайта. worry — как
   это звучит у владельца, пока бухгалтер в штате. */
export const WHY = [
  { ic: "user",
    ru: ["Бухгалтер может заболеть или уйти в декрет", "Ваш бухгалтер внезапно не заболеет и не уйдёт в декрет", "За вами закреплена рабочая группа из нескольких взаимозаменяемых людей."],
    uz: ["Buxgalter kasal bo‘lishi yoki dekretga chiqishi mumkin", "Buxgalteringiz to‘satdan kasal bo‘lib qolmaydi va dekretga chiqmaydi", "Sizga bir nechta o‘zaro almashtiriladigan mutaxassislar jamoasi biriktirilgan."],
    en: ["Your accountant may fall ill or go on maternity leave", "Your accountant won’t suddenly fall ill or go on leave", "A working group of several interchangeable specialists is assigned to you."] },
  { ic: "book",
    ru: ["Нужно следить за изменениями в законах", "Вам не нужно следить за законодательством", "Наши бухгалтеры постоянно учатся и имеют сертификаты бухобслуживания 1С."],
    uz: ["Qonunchilikdagi o‘zgarishlarni kuzatish kerak", "Qonunchilikni kuzatib borish sizga kerak emas", "Buxgalterlarimiz doimiy o‘qitiladi va 1C buxgalteriya xizmatlari bo‘yicha sertifikatlarga ega."],
    en: ["You have to track changes in the law", "You don’t need to track the legislation", "Our accountants train constantly and hold 1C accounting service certificates."] },
  { ic: "db",
    ru: ["База учёта может пропасть", "Ваша база не пропадёт ни при каких условиях", "База хранится на защищённых серверах, её обслуживает компания 1С, у вас круглосуточный доступ."],
    uz: ["Hisob bazasi yo‘qolishi mumkin", "Ma’lumotlar bazangiz hech qanday sharoitda yo‘qolmaydi", "U xavfsiz serverlarda saqlanadi, 1C kompaniyasi qo‘llab-quvvatlaydi, sizda 24 soatlik kirish bor."],
    en: ["The accounting database could be lost", "Your database won’t be lost under any circumstances", "It is stored on secure servers maintained by 1C, and you have 24/7 access."] },
  { ic: "shield",
    ru: ["Штрафы за ошибки в отчётах", "Вы защищены от штрафов налоговой", "Наша организация берёт на себя финансовые гарантии отсутствия ошибок в отчётности, допущенных по нашей вине."],
    uz: ["Hisobotdagi xatolar uchun jarimalar", "Siz soliq jarimalaridan himoyalangansiz", "Tashkilotimiz o‘z aybimiz bilan yo‘l qo‘yilgan hisobot xatolari uchun moliyaviy javobgarlikni o‘z zimmasiga oladi."],
    en: ["Fines for mistakes in reports", "You are protected from tax penalties", "Our company takes financial responsibility for errors in reports made through our fault."] },
  { ic: "key",
    ru: ["Ключи, программа, сдача отчётов", "ИТ-сопровождение бухгалтера берём на себя", "Выпуск электронных ключей, бухгалтерская программа и сдача отчётности уже включены в тарифы."],
    uz: ["Kalitlar, dastur, hisobot topshirish", "Buxgalterning IT ta’minotini o‘z zimmamizga olamiz", "Elektron kalitlar, buxgalteriya dasturi va hisobot topshirish tariflarga kiritilgan."],
    en: ["Keys, software, report filing", "We take care of the accountant’s IT", "Electronic keys, accounting software and report filing are already included in the tariffs."] },
  { ic: "coins",
    ru: ["Налоги и взносы с зарплаты бухгалтера", "Вы не платите налоги и взносы с зарплаты бухгалтера", "Бухгалтеры не состоят у вас в штате, поэтому платить ничего не надо."],
    uz: ["Buxgalter ish haqidan soliq va badallar", "Buxgalter ish haqidan soliq va badal to‘lamaysiz", "Buxgalterlar shtatingizda emas, shuning uchun hech narsa to‘lash shart emas."],
    en: ["Taxes and contributions on the accountant’s salary", "You pay no taxes or contributions on an accountant’s salary", "The accountants are not on your staff, so there is nothing to pay."] },
  { ic: "desk",
    ru: ["Рабочее место: аренда, мебель, техника", "Вы не тратитесь на рабочее место бухгалтера", "Аренду офиса, мебель, оргтехнику и канцелярию мы берём на себя."],
    uz: ["Ish joyi: ijara, mebel, texnika", "Buxgalterning ish joyiga pul sarflamaysiz", "Ofis ijarasi, mebel, texnika va kantselyariya xarajatlarini o‘z zimmamizga olamiz."],
    en: ["Workplace: rent, furniture, equipment", "You don’t pay for an accountant’s workplace", "Office rent, furniture, equipment and stationery are on us."] },
];

/* «Наши преимущества» с сайта — для схемы «что берём на себя». */
export const ADV = [
  { ru: ["Вникаем", "в ваши задачи и можем предложить стратегию развития"], uz: ["Chuqur o‘rganamiz", "muammolaringizni va rivojlanish strategiyasini taklif qilamiz"], en: ["We dig in", "to your problems and can suggest a development strategy"] },
  { ru: ["Консультируем", "по возникающим вопросам"], uz: ["Maslahat beramiz", "yuzaga kelgan savollar bo‘yicha"], en: ["We advise", "on any questions that come up"] },
  { ru: ["Предупреждаем", "об изменениях в законодательстве и помогаем подготовиться"], uz: ["Ogohlantiramiz", "qonunchilikdagi o‘zgarishlar haqida va tayyorlanishga yordam beramiz"], en: ["We warn you", "about changes in legislation and help you prepare"] },
  { ru: ["Помогаем", "настроить регламент своевременного документооборота"], uz: ["Yordam beramiz", "hujjat aylanishi reglamentini yo‘lga qo‘yishga"], en: ["We help", "set up rules for timely document flow"] },
  { ru: ["Отстаиваем", "финансовые интересы клиентов в расчётах с бюджетом и контрагентами"], uz: ["Himoya qilamiz", "byudjet va kontragentlar bilan hisob-kitobda moliyaviy manfaatlaringizni"], en: ["We defend", "your financial interests with the budget and counterparties"] },
  { ru: ["Держим под контролем", "сроки уплаты налогов и сдачи отчётности"], uz: ["Nazorat qilamiz", "soliq to‘lash va hisobot topshirish muddatlarini"], en: ["We keep control", "of tax payment and reporting deadlines"] },
  { ru: ["Систематизируем", "информацию по документам, она легко доступна"], uz: ["Tizimlashtiramiz", "hujjatlar bo‘yicha ma’lumotni, u oson topiladi"], en: ["We organise", "all document information so it is easy to find"] },
];

/* Документы для сцены «хаос → порядок»: обычные бумаги любой бухгалтерии. */
export const DOCS = [
  { g: 0, ru: "Счёт-фактура", uz: "Hisob-faktura", en: "Invoice" },
  { g: 0, ru: "Накладная", uz: "Yuk xati", en: "Waybill" },
  { g: 0, ru: "Акт сверки", uz: "Solishtirma dalolatnoma", en: "Reconciliation" },
  { g: 0, ru: "Договор", uz: "Shartnoma", en: "Contract" },
  { g: 1, ru: "Отчёт по НДС", uz: "QQS hisoboti", en: "VAT report" },
  { g: 1, ru: "Декларация", uz: "Deklaratsiya", en: "Tax return" },
  { g: 1, ru: "Платёжка", uz: "To‘lov topshiriqnomasi", en: "Payment order" },
  { g: 1, ru: "Ключ ЭЦП", uz: "ERI kaliti", en: "E-signature key" },
  { g: 2, ru: "Зарплата", uz: "Ish haqi", en: "Payroll" },
  { g: 2, ru: "Табель", uz: "Tabel", en: "Timesheet" },
  { g: 2, ru: "Приказ о приёме", uz: "Ishga qabul buyrug‘i", en: "Hiring order" },
  { g: 2, ru: "Отпуск", uz: "Ta’til", en: "Leave" },
];
export const PILES = {
  ru: ["Учёт", "Отчётность", "Зарплата и кадры"],
  uz: ["Hisob", "Hisobotlar", "Ish haqi va kadrlar"],
  en: ["Accounting", "Reporting", "Payroll and HR"],
};

/* Команда — с их сайта. Имена в uz и en латиницей. */
export const TEAM = [
  { ru: ["Рахматуллаев Хамид", "Генеральный директор"], uz: ["Rahmatullayev Hamid", "Bosh direktor"], en: ["Khamid Rakhmatullaev", "General Director"] },
  { ru: ["Исакулов Бехзод", "Финансовый директор"], uz: ["Isakulov Behzod", "Moliya direktori"], en: ["Bekhzod Isakulov", "Finance Director"] },
  { ru: ["Тураев Иброхимжон", "Главный бухгалтер и налоговый специалист"], uz: ["Turayev Ibrohimjon", "Bosh buxgalter va soliq mutaxassisi"], en: ["Ibrokhimjon Turaev", "Chief Accountant and Tax Specialist"] },
  { ru: ["Каримов Санжарбек", "Помощник главного бухгалтера"], uz: ["Karimov Sanjarbek", "Bosh buxgalter yordamchisi"], en: ["Sanjarbek Karimov", "Assistant Chief Accountant"] },
  { ru: ["Ахматов Нодир", "Бухгалтер"], uz: ["Axmatov Nodir", "Buxgalter"], en: ["Nodir Akhmatov", "Accountant"] },
  { ru: ["Мўминова Сайёра", "Бухгалтер"], uz: ["Mo‘minova Sayyora", "Buxgalter"], en: ["Sayyora Muminova", "Accountant"] },
  { ru: ["Курбанова Нигорахон", "Менеджер по кадрам"], uz: ["Qurbonova Nigoraxon", "Kadrlar menejeri"], en: ["Nigorakhon Kurbanova", "HR Manager"] },
  { ru: ["Абдурайимов Беруний", "Экономист"], uz: ["Abdurayimov Beruniy", "Iqtisodchi"], en: ["Beruniy Abdurayimov", "Economist"] },
  { ru: ["Тожиев Оллаёр", "Проект-менеджер"], uz: ["Tojiyev Ollayor", "Loyiha menejeri"], en: ["Ollayor Tojiev", "Project Manager"] },
];

/* Видеоотзывы клиентов — их YouTube, «Mijozlar fikri». */
export const REVIEWS = [
  { n: 1, url: "https://www.youtube.com/shorts/j_DAVvtCDzY" },
  { n: 2, url: "https://www.youtube.com/watch?v=c1qWL0VLlqs" },
  { n: 3, url: "https://www.youtube.com/shorts/BGl4_bodbuc" },
  { n: 4, url: "https://www.youtube.com/shorts/MqCD-VSGMEM" },
  { n: 5, url: "https://www.youtube.com/watch?v=NATeaqwxwnY" },
  { n: 6, url: "https://www.youtube.com/watch?v=v-6Ll0grtrc" },
];
