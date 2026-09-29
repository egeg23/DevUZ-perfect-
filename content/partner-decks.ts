import type { Locale } from "@/lib/i18n";

/**
 * Тексты двух презентаций из кабинета партнёра.
 *
 * Владелец, 28.09: «Подгрузи в реферальный кабинет партнёра: презентация
 * Devuz — что можем, штат, языки и т. д.; презентация реферальной программы,
 * к примеру если партнёр подключит маркетинговое агентство к нам на лидов».
 * Затем: «может быть не только маркетинговое агентство, а любое (IT,
 * маркетинг и т. д.), откуда регулярные заказы идут» и «укажи, что мы можем
 * работать субподрядчиком на тендерных заказах в сфере IT».
 *
 * Здесь только слова. Цифры — штат, проекты, страны, цены «от», сроки,
 * ставки — страница берёт из тех же мест, что и сайт (content/company.ts,
 * content/services.ts, lib/partners/rules.ts): презентацию отправляют
 * клиентам, и расхождение с сайтом ловит первый же, кто перейдёт по ссылке.
 */

export type DeckCopy = {
  pdf: string;
  pdfHint: string;
  studio: {
    kicker: string;
    numbersTitle: string;
    numbers: { staff: string; projects: string; countries: string; since: string; lift: string };
    liftNote: string;
    servicesTitle: string;
    from: (price: string) => string;
    weeks: (from: number, to: number) => string;
    languagesTitle: string;
    languages: string[];
    howTitle: string;
    how: string[];
    casesTitle: string;
    casesMore: (count: number) => string;
    ctaTitle: string;
    ctaText: string;
    ctaSite: string;
    ctaBot: string;
  };
  program: {
    kicker: string;
    title: string;
    lead: string;
    modelsTitle: string;
    colRange: string;
    colProfit: string;
    colTurnover: string;
    upTo: (amount: string) => string;
    over: (amount: string) => string;
    modelsNote: string;
    waysTitle: string;
    ways: { title: string; text: string }[];
    agencyTitle: string;
    agencyText: string;
    tenderTitle: string;
    tenderText: string;
    tenderPoints: string[];
    exampleTitle: string;
    exampleLead: string;
    exampleOrder: (name: string, amount: string) => string;
    exampleTotal: string;
    exampleNote: string;
    exampleOrders: string[];
    cabinetTitle: string;
    cabinet: string[];
    rulesTitle: string;
    rules: string[];
    ctaTitle: string;
    ctaJoin: string;
    ctaCabinet: string;
  };
};

const ru: DeckCopy = {
  pdf: "Скачать PDF",
  pdfHint: "Откроется печать: выберите «Сохранить как PDF».",
  studio: {
    kicker: "Презентация студии",
    numbersTitle: "В цифрах",
    numbers: {
      staff: "разработчиков в штате",
      projects: "завершённых проектов",
      countries: "стран, где работают наши проекты",
      since: "год основания, Ташкент",
      lift: "рост заявок после аудита и работ",
    },
    liftNote: "Рост заявок — среднее по нашим проектам, а не обещание: до и после работ снимаем статистику и показываем её рядом.",
    servicesTitle: "Что делаем",
    from: (price) => `от ${price}`,
    weeks: (from, to) => `${from}–${to} недель`,
    languagesTitle: "Языки и география",
    languages: [
      "Общаемся на русском, узбекском и английском; сайты делаем на любых языках — наш собственный — на шести, включая китайский.",
      "Клиенты — Узбекистан, Казахстан, Россия и компании, которые продают на экспорт.",
      "Работаем удалённо: созвоны, переписка в удобном мессенджере, оплата на счёт ИП в Узбекистане или по договору с юрлицом.",
    ],
    howTitle: "Как работаем",
    how: [
      "Сначала разбираем задачу: что уже есть, что мешает заявкам, что даст результат быстрее всего. Цену называем после разбора, а не до.",
      "Договор с этапами и счёт на каждый этап — платите за сделанное, а не авансом за всё.",
      "Недельные итерации: каждую пятницу — работающая сборка на тестовом домене, а не отчёт о проделанной работе.",
      "Первая линия в чате — AI-менеджер, круглосуточно и на вашем языке; дальше — живой менеджер с готовым резюме задачи.",
    ],
    casesTitle: "Проекты",
    casesMore: (count) => `И ещё ${count}+ проектов — на devuz.studio/cases`,
    ctaTitle: "Обсудим ваш проект",
    ctaText: "Напишите в Telegram или оставьте заявку на сайте — ответим в тот же день и начнём с разбора задачи.",
    ctaSite: "Оставить заявку",
    ctaBot: "Написать в Telegram",
  },
  program: {
    kicker: "Партнёрская программа",
    title: "Зарабатывайте с DevUz Studio",
    lead: "Приводите клиентов на разработку — сайты, приложения, AI-продукты, боты — и получайте процент с каждого их проекта. Без ограничений по числу клиентов и по числу проектов одного клиента.",
    modelsTitle: "Две модели на выбор",
    colRange: "Сумма проекта",
    colProfit: "От чистой прибыли",
    colTurnover: "С оборота",
    upTo: (amount) => `до ${amount}`,
    over: (amount) => `дороже ${amount}`,
    modelsNote: "«От прибыли» — выше процент, считается от суммы договора минус налог и себестоимость. «С оборота» — ниже процент, но от всей суммы договора и известен сразу. Модель меняется раз в неделю; за клиентом закрепляется та, что действовала в день его заявки.",
    waysTitle: "Как приводить клиентов",
    ways: [
      { title: "Короткая ссылка", text: "devuz.studio/r/… — своя под каждый канал. Человек перешёл и в течение 30 дней оставил заявку — он ваш, даже если вернулся уже без ссылки." },
      { title: "Ссылка в Telegram-бота", text: "Для тех, кому удобнее написать, чем заполнять форму: переход в бота с вашим кодом засчитывается так же." },
      { title: "Подключить агентство или компанию", text: "IT-компания, веб-студия, маркетинговое или дизайн-агентство, интегратор — любая компания, у которой регулярно бывают заказы на разработку, отдаёт их нам на субподряд. Все её заказы ваши 12 месяцев с подтверждения." },
    ],
    agencyTitle: "Пример: вы подключили агентство",
    agencyText: "Агентствам и IT-компаниям разработка нужна постоянно: маркетинговому агентству — сайты и лендинги под рекламу клиентов, интегратору — боты и интеграции, веб-студии — команда, когда своей не хватает. Вы знакомите компанию с нами и подключаете её в кабинете; мы подтверждаем — и 12 месяцев с этого дня каждый заказ, который она передаёт нам, засчитывается вам. Ссылка ей не нужна: она пишет нам напрямую, а мы узнаём её заказы по контакту и названию.",
    tenderTitle: "Тендеры и госзаказы: мы — субподрядчик",
    tenderText: "IT-тендеры — госзакупки и конкурсы крупных компаний — часто выигрывает генподрядчик, у которого нет своей команды разработки нужного профиля. Мы работаем у такого генподрядчика техническим субподрядчиком. Знаете компанию, которая участвует в тендерах, — подключите её так же, как агентство: 12 месяцев все её заказы засчитываются вам.",
    tenderPoints: [
      "До подачи заявки: разбираем ТЗ, оцениваем сроки и себестоимость, готовим техническую часть заявки.",
      "После победы: разработка по ТЗ, документация, сдача по этапам контракта и гарантийный срок.",
      "Договор субподряда и NDA: с заказчиком общается генподрядчик, мы — его команда разработки.",
      "Суммы тендерных контрактов обычно выше разовых заказов — это верхние ступени ставок.",
    ],
    exampleTitle: "Сколько это может быть",
    exampleLead: "Агентство передало за месяц три заказа. По модели «с оборота»:",
    exampleOrder: (name, amount) => `${name} на ${amount}`,
    exampleTotal: "Итого вам за месяц",
    exampleNote: "Пример для наглядности, а не обещание: суммы проектов бывают любыми. По модели «от прибыли» процент выше, а итог зависит от себестоимости проекта.",
    exampleOrders: ["Сайт", "Мобильное приложение", "Маркетплейс"],
    cabinetTitle: "Всё видно в кабинете",
    cabinet: [
      "Короткие ссылки, переходы по дням и заявки — видно, какой канал работает.",
      "Каждый клиент по этапам: заявка → договор подписан → оплачен, и ваша доля по нему.",
      "Бот пишет сам: о заявке, о подписанном договоре, об оплате и о выплате.",
      "Выплата раз в месяц, от 50 $ — на USDT (TRC-20) или по реквизитам.",
    ],
    rulesTitle: "Честные правила",
    rules: [
      "Доля начисляется, когда клиент оплатил проект целиком.",
      "Не засчитываются заявки от вас самих и клиенты, которые работали с нами до вашей ссылки.",
      "Агентство или компания засчитывается после нашего подтверждения, на 12 месяцев; одна компания — один партнёр, кто подключил первым.",
    ],
    ctaTitle: "Начните сегодня",
    ctaJoin: "Стать партнёром",
    ctaCabinet: "Войти в кабинет",
  },
};

const en: DeckCopy = {
  pdf: "Download PDF",
  pdfHint: "The print dialog opens: choose “Save as PDF”.",
  studio: {
    kicker: "Studio presentation",
    numbersTitle: "In numbers",
    numbers: {
      staff: "developers on staff",
      projects: "completed projects",
      countries: "countries where our projects run",
      since: "founded, Tashkent",
      lift: "growth in requests after audit and work",
    },
    liftNote: "Request growth is the average across our projects, not a promise: we measure before and after and show the numbers side by side.",
    servicesTitle: "What we do",
    from: (price) => `from ${price}`,
    weeks: (from, to) => `${from}–${to} weeks`,
    languagesTitle: "Languages and reach",
    languages: [
      "We communicate in Russian, Uzbek and English and build sites in any language — our own is in six, including Chinese.",
      "Clients in Uzbekistan, Kazakhstan, Russia and companies selling for export.",
      "We work remotely: calls, chat in your preferred messenger, payment to a sole-proprietor account in Uzbekistan or under a contract with a legal entity.",
    ],
    howTitle: "How we work",
    how: [
      "First we review the task: what exists, what blocks requests, what brings results fastest. We quote after the review, not before.",
      "A contract with stages and an invoice per stage — you pay for work done, not everything upfront.",
      "Weekly iterations: every Friday a working build on a test domain, not a progress report.",
      "The first line in chat is an AI manager, 24/7 and in your language; then a human manager with a ready summary of your task.",
    ],
    casesTitle: "Projects",
    casesMore: (count) => `And ${count}+ more projects at devuz.studio/cases`,
    ctaTitle: "Let's discuss your project",
    ctaText: "Write to us on Telegram or leave a request on the site — we reply the same day and start with a review of your task.",
    ctaSite: "Leave a request",
    ctaBot: "Write on Telegram",
  },
  program: {
    kicker: "Partner program",
    title: "Earn with DevUz Studio",
    lead: "Bring clients for development — websites, apps, AI products, bots — and earn a percentage of every project they order. No limit on the number of clients or projects per client.",
    modelsTitle: "Two models to choose from",
    colRange: "Project amount",
    colProfit: "Of net profit",
    colTurnover: "Of turnover",
    upTo: (amount) => `up to ${amount}`,
    over: (amount) => `over ${amount}`,
    modelsNote: "“Of profit” — a higher percentage of the contract amount minus tax and costs. “Of turnover” — a lower percentage of the whole contract amount, known right away. The model can be changed once a week; a client keeps the model active on the day of their request.",
    waysTitle: "How to bring clients",
    ways: [
      { title: "Short link", text: "devuz.studio/r/… — one per channel. If a person follows it and leaves a request within 30 days, they're yours — even if they come back without the link." },
      { title: "Telegram bot link", text: "For people who'd rather write than fill a form: opening the bot with your code counts the same way." },
      { title: "Connect an agency or company", text: "An IT company, web studio, marketing or design agency, integrator — any company that regularly has development orders passes them to us on a subcontract basis. All its orders are yours for 12 months after confirmation." },
    ],
    agencyTitle: "Example: you connect an agency",
    agencyText: "Agencies and IT companies need development all the time: a marketing agency needs sites and landing pages for its clients' ads, an integrator needs bots and integrations, a web studio needs a team when its own is not enough. You introduce the company to us and connect it in your dashboard; we confirm — and for 12 months from that day every order it passes to us counts as yours. It doesn't need a link: it writes to us directly, and we recognise its orders by contact and name.",
    tenderTitle: "Tenders and public contracts: we subcontract",
    tenderText: "IT tenders — public procurement and large companies' competitions — are often won by a prime contractor without its own development team of the right profile. We work for such a prime contractor as the technical subcontractor. If you know a company that bids in tenders, connect it just like an agency: for 12 months all its orders count as yours.",
    tenderPoints: [
      "Before the bid: we review the technical specification, estimate timing and cost, and prepare the technical part of the bid.",
      "After winning: development to spec, documentation, delivery by contract stages and the warranty period.",
      "Subcontract and NDA: the prime contractor talks to the client, we are its development team.",
      "Tender contracts are usually larger than one-off orders — that means the top rate tiers.",
    ],
    exampleTitle: "What it can add up to",
    exampleLead: "The agency passed three orders in a month. With the turnover model:",
    exampleOrder: (name, amount) => `${name} for ${amount}`,
    exampleTotal: "Your total for the month",
    exampleNote: "An illustration, not a promise: project amounts vary. With the profit model the percentage is higher and the total depends on the project's costs.",
    exampleOrders: ["Website", "Mobile app", "Marketplace"],
    cabinetTitle: "Everything is in your dashboard",
    cabinet: [
      "Short links, clicks by day and requests — see which channel works.",
      "Every client by stage: request → contract signed → paid, with your share.",
      "The bot messages you: about a request, a signed contract, a payment and a payout.",
      "Payouts monthly, from $50 — to USDT (TRC-20) or bank details.",
    ],
    rulesTitle: "Fair rules",
    rules: [
      "Your share is credited once the client has paid the project in full.",
      "Requests from yourself and clients who worked with us before your link don't count.",
      "An agency or company counts after our confirmation, for 12 months; one company — one partner, whoever connected it first.",
    ],
    ctaTitle: "Start today",
    ctaJoin: "Become a partner",
    ctaCabinet: "Sign in to the dashboard",
  },
};

const uz: DeckCopy = {
  pdf: "PDF yuklab olish",
  pdfHint: "Chop etish oynasi ochiladi: «PDF sifatida saqlash» ni tanlang.",
  studio: {
    kicker: "Studiya taqdimoti",
    numbersTitle: "Raqamlarda",
    numbers: {
      staff: "shtatdagi dasturchilar",
      projects: "yakunlangan loyihalar",
      countries: "loyihalarimiz ishlaydigan davlatlar",
      since: "tashkil etilgan yil, Toshkent",
      lift: "audit va ishlardan keyin so'rovlar o'sishi",
    },
    liftNote: "So'rovlar o'sishi — loyihalarimiz bo'yicha o'rtacha, va'da emas: ishdan oldin va keyin statistikani olib, yonma-yon ko'rsatamiz.",
    servicesTitle: "Nima qilamiz",
    from: (price) => `${price} dan`,
    weeks: (from, to) => `${from}–${to} hafta`,
    languagesTitle: "Tillar va geografiya",
    languages: [
      "Rus, o'zbek va ingliz tillarida muloqot qilamiz; saytlarni istalgan tilda qilamiz — o'zimizniki olti tilda, jumladan xitoy tilida.",
      "Mijozlar — O'zbekiston, Qozog'iston, Rossiya va eksportga sotadigan kompaniyalar.",
      "Masofadan ishlaymiz: qo'ng'iroqlar, qulay messenjerda yozishma, O'zbekistondagi YaTT hisobiga yoki yuridik shaxs bilan shartnoma bo'yicha to'lov.",
    ],
    howTitle: "Qanday ishlaymiz",
    how: [
      "Avval vazifani tahlil qilamiz: nima bor, so'rovlarga nima xalaqit beradi, nima tezroq natija beradi. Narxni tahlildan keyin aytamiz, oldin emas.",
      "Bosqichli shartnoma va har bir bosqichga hisob — hammasi uchun oldindan emas, bajarilgan ish uchun to'laysiz.",
      "Haftalik iteratsiyalar: har juma — hisobot emas, test domenidagi ishlaydigan versiya.",
      "Chatdagi birinchi liniya — AI-menejer, kechayu kunduz va sizning tilingizda; keyin — vazifangiz xulosasi tayyor bo'lgan jonli menejer.",
    ],
    casesTitle: "Loyihalar",
    casesMore: (count) => `Yana ${count}+ loyiha — devuz.studio/cases da`,
    ctaTitle: "Loyihangizni muhokama qilamiz",
    ctaText: "Telegramda yozing yoki saytda so'rov qoldiring — o'sha kuni javob beramiz va vazifani tahlil qilishdan boshlaymiz.",
    ctaSite: "So'rov qoldirish",
    ctaBot: "Telegramda yozish",
  },
  program: {
    kicker: "Hamkorlik dasturi",
    title: "DevUz Studio bilan daromad qiling",
    lead: "Ishlab chiqishga mijozlar olib keling — saytlar, ilovalar, AI-mahsulotlar, botlar — va ularning har bir loyihasidan foiz oling. Mijozlar soni va bitta mijozning loyihalari soni cheklanmagan.",
    modelsTitle: "Ikki model tanlovga",
    colRange: "Loyiha summasi",
    colProfit: "Sof foydadan",
    colTurnover: "Aylanmadan",
    upTo: (amount) => `${amount} gacha`,
    over: (amount) => `${amount} dan yuqori`,
    modelsNote: "«Foydadan» — foiz yuqoriroq, shartnoma summasidan soliq va tannarx ayirilganidan hisoblanadi. «Aylanmadan» — foiz pastroq, lekin butun shartnoma summasidan va darhol ma'lum. Model haftasiga bir marta o'zgaradi; mijozga uning so'rovi kunidagi model biriktiriladi.",
    waysTitle: "Mijozlarni qanday olib kelish",
    ways: [
      { title: "Qisqa havola", text: "devuz.studio/r/… — har bir kanal uchun alohida. Odam o'tib, 30 kun ichida so'rov qoldirsa — u sizniki, hatto keyin havolasiz qaytgan bo'lsa ham." },
      { title: "Telegram-botga havola", text: "Forma to'ldirishdan ko'ra yozishni afzal ko'radiganlar uchun: kodingiz bilan botga o'tish ham xuddi shunday hisoblanadi." },
      { title: "Agentlik yoki kompaniyani ulash", text: "IT-kompaniya, veb-studiya, marketing yoki dizayn agentligi, integrator — ishlab chiqish bo'yicha buyurtmalari muntazam bo'ladigan har qanday kompaniya ularni bizga subpudratga beradi. Tasdiqlangandan keyin 12 oy davomida uning barcha buyurtmalari sizniki." },
    ],
    agencyTitle: "Misol: siz agentlikni uladingiz",
    agencyText: "Agentliklar va IT-kompaniyalarga ishlab chiqish doim kerak: marketing agentligiga — mijozlari reklamasi uchun saytlar va lendinglar, integratorga — botlar va integratsiyalar, veb-studiyaga — o'z jamoasi yetmaganda qo'shimcha jamoa. Siz kompaniyani biz bilan tanishtirasiz va kabinetda ulaysiz; biz tasdiqlaymiz — va shu kundan boshlab 12 oy davomida u bizga beradigan har bir buyurtma sizga hisoblanadi. Unga havola kerak emas: u bizga to'g'ridan-to'g'ri yozadi, biz esa buyurtmalarini kontakt va nomi bo'yicha taniymiz.",
    tenderTitle: "Tenderlar va davlat buyurtmalari: biz — subpudratchi",
    tenderText: "IT-tenderlarni — davlat xaridlari va yirik kompaniyalar tanlovlarini — ko'pincha kerakli yo'nalishdagi o'z ishlab chiqish jamoasi bo'lmagan bosh pudratchi yutadi. Biz shunday bosh pudratchida texnik subpudratchi sifatida ishlaymiz. Tenderlarda qatnashadigan kompaniyani bilsangiz, uni agentlik kabi ulang: 12 oy davomida uning barcha buyurtmalari sizga hisoblanadi.",
    tenderPoints: [
      "Ariza topshirishdan oldin: texnik topshiriqni tahlil qilamiz, muddat va tannarxni baholaymiz, arizaning texnik qismini tayyorlaymiz.",
      "G'alabadan keyin: texnik topshiriq bo'yicha ishlab chiqish, hujjatlar, shartnoma bosqichlari bo'yicha topshirish va kafolat muddati.",
      "Subpudrat shartnomasi va NDA: buyurtmachi bilan bosh pudratchi gaplashadi, biz — uning ishlab chiqish jamoasi.",
      "Tender shartnomalari summalari odatda bir martalik buyurtmalardan yuqori — bu stavkalarning yuqori pog'onalari.",
    ],
    exampleTitle: "Bu qancha bo'lishi mumkin",
    exampleLead: "Agentlik bir oyda uchta buyurtma berdi. «Aylanmadan» modeli bo'yicha:",
    exampleOrder: (name, amount) => `${name} — ${amount}`,
    exampleTotal: "Oy uchun sizga jami",
    exampleNote: "Tushunarlilik uchun misol, va'da emas: loyiha summalari har xil bo'ladi. «Foydadan» modelida foiz yuqoriroq, natija esa loyiha tannarxiga bog'liq.",
    exampleOrders: ["Sayt", "Mobil ilova", "Marketpleys"],
    cabinetTitle: "Hammasi kabinetda ko'rinadi",
    cabinet: [
      "Qisqa havolalar, kunlar bo'yicha o'tishlar va so'rovlar — qaysi kanal ishlayotgani ko'rinadi.",
      "Har bir mijoz bosqichlar bo'yicha: so'rov → shartnoma imzolandi → to'landi, va u bo'yicha ulushingiz.",
      "Bot o'zi yozadi: so'rov, imzolangan shartnoma, to'lov va pul o'tkazilgani haqida.",
      "To'lov oyiga bir marta, 50 $ dan — USDT (TRC-20) ga yoki rekvizitlar bo'yicha.",
    ],
    rulesTitle: "Adolatli qoidalar",
    rules: [
      "Ulush mijoz loyihani to'liq to'lagach hisoblanadi.",
      "O'zingizdan kelgan so'rovlar va havolangizdan oldin biz bilan ishlagan mijozlar hisobga olinmaydi.",
      "Agentlik yoki kompaniya biz tasdiqlaganimizdan keyin 12 oyga hisoblanadi; bitta kompaniya — bitta hamkor, kim birinchi ulagan bo'lsa.",
    ],
    ctaTitle: "Bugun boshlang",
    ctaJoin: "Hamkor bo'lish",
    ctaCabinet: "Kabinetga kirish",
  },
};

const zh: DeckCopy = {
  pdf: "下载 PDF",
  pdfHint: "将打开打印对话框：选择“另存为 PDF”。",
  studio: {
    kicker: "工作室介绍",
    numbersTitle: "数据一览",
    numbers: {
      staff: "名全职开发人员",
      projects: "个已完成项目",
      countries: "个国家有我们的项目在运行",
      since: "成立年份，塔什干",
      lift: "审计与改造后的询盘增长",
    },
    liftNote: "询盘增长是我们项目的平均值，而非承诺：我们在工作前后统计数据并并排展示。",
    servicesTitle: "我们做什么",
    from: (price) => `${price} 起`,
    weeks: (from, to) => `${from}–${to} 周`,
    languagesTitle: "语言与覆盖范围",
    languages: [
      "我们使用俄语、乌兹别克语和英语沟通；网站可做任何语言——我们自己的网站有六种语言，包括中文。",
      "客户来自乌兹别克斯坦、哈萨克斯坦、俄罗斯以及做出口的企业。",
      "远程协作：通话、在您方便的通讯工具中沟通，付款至乌兹别克斯坦个体户账户或与法人签订合同。",
    ],
    howTitle: "工作方式",
    how: [
      "先分析需求：现有什么、什么阻碍了询盘、什么能最快见效。分析之后才报价，而不是之前。",
      "分阶段合同，每个阶段单独开票——为已完成的工作付款，而不是全部预付。",
      "按周迭代：每周五在测试域名上交付可运行的版本，而不是进度报告。",
      "聊天的第一线是 AI 客服，全天候使用您的语言；之后由真人经理接手，并附上您需求的完整摘要。",
    ],
    casesTitle: "项目",
    casesMore: (count) => `更多 ${count}+ 个项目见 devuz.studio/cases`,
    ctaTitle: "来聊聊您的项目",
    ctaText: "在 Telegram 上联系我们或在网站提交需求——我们当天回复，并从需求分析开始。",
    ctaSite: "提交需求",
    ctaBot: "在 Telegram 联系",
  },
  program: {
    kicker: "合作伙伴计划",
    title: "与 DevUz Studio 一起赚钱",
    lead: "介绍开发需求的客户——网站、应用、AI 产品、机器人——即可从其每个项目获得分成。客户数量和单个客户的项目数量均不限。",
    modelsTitle: "两种模式可选",
    colRange: "项目金额",
    colProfit: "按净利润",
    colTurnover: "按营业额",
    upTo: (amount) => `${amount} 以内`,
    over: (amount) => `超过 ${amount}`,
    modelsNote: "“按利润”——比例更高，按合同金额减去税费和成本计算。“按营业额”——比例较低，但按整个合同金额计算并立即可知。模式每周可更改一次；客户按其提交申请当天生效的模式计算。",
    waysTitle: "如何带来客户",
    ways: [
      { title: "短链接", text: "devuz.studio/r/……——每个渠道一个。对方点击后 30 天内提交申请即归您，即使之后不通过链接再来。" },
      { title: "Telegram 机器人链接", text: "适合更愿意发消息而非填表的人：带您代码进入机器人同样计入。" },
      { title: "接入代理机构或公司", text: "IT 公司、网站工作室、营销或设计代理机构、系统集成商——任何经常有开发订单的公司，都可以把订单以分包形式交给我们。确认后 12 个月内，它的所有订单都归您。" },
    ],
    agencyTitle: "示例：您接入了一家代理机构",
    agencyText: "代理机构和 IT 公司一直需要开发：营销代理机构需要为客户广告做网站和落地页，集成商需要机器人和系统对接，网站工作室在人手不够时需要团队。您把公司介绍给我们并在后台添加；我们确认后，从那天起 12 个月内它交给我们的每个订单都算您的。它不需要链接：它直接联系我们，我们通过联系方式和名称识别其订单。",
    tenderTitle: "招标与政府合同：我们做分包",
    tenderText: "IT 招标——政府采购和大公司的竞标——常由总包方中标，而总包方往往没有对口的自有开发团队。我们为这样的总包方担任技术分包。如果您认识参与投标的公司，就像代理机构一样把它接入：12 个月内它的所有订单都算您的。",
    tenderPoints: [
      "投标前：分析技术规格书，评估工期和成本，准备投标文件的技术部分。",
      "中标后：按技术规格书开发、编写文档、按合同阶段交付并提供质保期服务。",
      "分包合同与保密协议：由总包方与客户沟通，我们是它的开发团队。",
      "招标合同金额通常高于一次性订单——对应较高的佣金档位。",
    ],
    exampleTitle: "能有多少",
    exampleLead: "代理机构一个月内交来三个订单。按“营业额”模式：",
    exampleOrder: (name, amount) => `${name}，${amount}`,
    exampleTotal: "您当月合计",
    exampleNote: "仅为示意，并非承诺：项目金额各不相同。按“利润”模式比例更高，最终金额取决于项目成本。",
    exampleOrders: ["网站", "移动应用", "电商平台"],
    cabinetTitle: "一切都在后台可见",
    cabinet: [
      "短链接、按天统计的点击和申请——看出哪个渠道有效。",
      "每位客户的阶段：申请 → 合同已签 → 已付款，以及您的分成。",
      "机器人主动通知：申请、合同签署、付款和提现。",
      "每月结算，50 美元起——支付到 USDT（TRC-20）或银行信息。",
    ],
    rulesTitle: "公平规则",
    rules: [
      "客户全额支付项目后才计入您的分成。",
      "您本人的申请以及在您的链接之前已与我们合作的客户不计入。",
      "代理机构或公司经我们确认后计入，为期 12 个月；一家公司只归一位合作伙伴，以先接入者为准。",
    ],
    ctaTitle: "今天就开始",
    ctaJoin: "成为合作伙伴",
    ctaCabinet: "登录后台",
  },
};

const uk: DeckCopy = {
  pdf: "Завантажити PDF",
  pdfHint: "Відкриється друк: оберіть «Зберегти як PDF».",
  studio: {
    kicker: "Презентація студії",
    numbersTitle: "У цифрах",
    numbers: {
      staff: "розробників у штаті",
      projects: "завершених проєктів",
      countries: "країн, де працюють наші проєкти",
      since: "рік заснування, Ташкент",
      lift: "зростання заявок після аудиту й робіт",
    },
    liftNote: "Зростання заявок — середнє за нашими проєктами, а не обіцянка: до і після робіт знімаємо статистику й показуємо її поруч.",
    servicesTitle: "Що робимо",
    from: (price) => `від ${price}`,
    weeks: (from, to) => `${from}–${to} тижнів`,
    languagesTitle: "Мови й географія",
    languages: [
      "Спілкуємося російською, узбецькою та англійською; сайти робимо будь-якими мовами — наш власний шістьма, зокрема китайською.",
      "Клієнти — Узбекистан, Казахстан, Росія та компанії, що продають на експорт.",
      "Працюємо віддалено: дзвінки, листування в зручному месенджері, оплата на рахунок індивідуального підприємця в Узбекистані або за договором з юрособою.",
    ],
    howTitle: "Як працюємо",
    how: [
      "Спочатку розбираємо завдання: що вже є, що заважає заявкам, що дасть результат найшвидше. Ціну називаємо після розбору, а не до.",
      "Договір з етапами й рахунок на кожен етап — платите за зроблене, а не авансом за все.",
      "Тижневі ітерації: щоп'ятниці — робоча збірка на тестовому домені, а не звіт про виконану роботу.",
      "Перша лінія в чаті — AI-менеджер, цілодобово й вашою мовою; далі — живий менеджер із готовим резюме завдання.",
    ],
    casesTitle: "Проєкти",
    casesMore: (count) => `І ще ${count}+ проєктів — на devuz.studio/cases`,
    ctaTitle: "Обговоримо ваш проєкт",
    ctaText: "Напишіть у Telegram або залиште заявку на сайті — відповімо того ж дня й почнемо з розбору завдання.",
    ctaSite: "Залишити заявку",
    ctaBot: "Написати в Telegram",
  },
  program: {
    kicker: "Партнерська програма",
    title: "Заробляйте з DevUz Studio",
    lead: "Приводьте клієнтів на розробку — сайти, застосунки, AI-продукти, боти — і отримуйте відсоток із кожного їхнього проєкту. Без обмежень за кількістю клієнтів і кількістю проєктів одного клієнта.",
    modelsTitle: "Дві моделі на вибір",
    colRange: "Сума проєкту",
    colProfit: "Від чистого прибутку",
    colTurnover: "З обороту",
    upTo: (amount) => `до ${amount}`,
    over: (amount) => `понад ${amount}`,
    modelsNote: "«Від прибутку» — вищий відсоток, рахується від суми договору мінус податок і собівартість. «З обороту» — нижчий відсоток, але від усієї суми договору, і його відомо одразу. Модель можна змінити раз на тиждень; за клієнтом закріплюється та, що діяла в день його заявки.",
    waysTitle: "Як приводити клієнтів",
    ways: [
      { title: "Коротке посилання", text: "devuz.studio/r/… — окреме під кожен канал. Людина перейшла й протягом 30 днів залишила заявку — вона ваша, навіть якщо повернулася вже без посилання." },
      { title: "Посилання на Telegram-бота", text: "Для тих, кому зручніше написати, ніж заповнювати форму: перехід у бота з вашим кодом зараховується так само." },
      { title: "Підключити агенцію або компанію", text: "IT-компанія, вебстудія, маркетингова чи дизайн-агенція, інтегратор — будь-яка компанія, у якої регулярно бувають замовлення на розробку, передає їх нам на субпідряд. Усі її замовлення ваші 12 місяців від підтвердження." },
    ],
    agencyTitle: "Приклад: ви підключили агенцію",
    agencyText: "Агенціям та IT-компаніям розробка потрібна постійно: маркетинговій агенції — сайти й лендинги під рекламу клієнтів, інтеграторові — боти й інтеграції, вебстудії — команда, коли власної не вистачає. Ви знайомите компанію з нами й підключаєте її в кабінеті; ми підтверджуємо — і 12 місяців від цього дня кожне замовлення, яке вона передає нам, зараховується вам. Посилання їй не потрібне: вона пише нам напряму, а ми впізнаємо її замовлення за контактом і назвою.",
    tenderTitle: "Тендери й держзамовлення: ми — субпідрядник",
    tenderText: "IT-тендери — держзакупівлі та конкурси великих компаній — часто виграє генпідрядник, у якого немає власної команди розробки потрібного профілю. Ми працюємо в такого генпідрядника технічним субпідрядником. Знаєте компанію, яка бере участь у тендерах, — підключіть її так само, як агенцію: 12 місяців усі її замовлення зараховуються вам.",
    tenderPoints: [
      "До подання заявки: розбираємо ТЗ, оцінюємо терміни й собівартість, готуємо технічну частину заявки.",
      "Після перемоги: розробка за ТЗ, документація, здача за етапами контракту та гарантійний термін.",
      "Договір субпідряду та NDA: із замовником спілкується генпідрядник, ми — його команда розробки.",
      "Суми тендерних контрактів зазвичай вищі за разові замовлення — це верхні щаблі ставок.",
    ],
    exampleTitle: "Скільки це може бути",
    exampleLead: "Агенція передала за місяць три замовлення. За моделлю «з обороту»:",
    exampleOrder: (name, amount) => `${name} на ${amount}`,
    exampleTotal: "Разом вам за місяць",
    exampleNote: "Приклад для наочності, а не обіцянка: суми проєктів бувають будь-якими. За моделлю «від прибутку» відсоток вищий, а підсумок залежить від собівартості проєкту.",
    exampleOrders: ["Сайт", "Мобільний застосунок", "Маркетплейс"],
    cabinetTitle: "Усе видно в кабінеті",
    cabinet: [
      "Короткі посилання, переходи за днями й заявки — видно, який канал працює.",
      "Кожен клієнт за етапами: заявка → договір підписано → оплачено, і ваша частка за ним.",
      "Бот пише сам: про заявку, про підписаний договір, про оплату й про виплату.",
      "Виплата раз на місяць, від 50 $ — на USDT (TRC-20) або за реквізитами.",
    ],
    rulesTitle: "Чесні правила",
    rules: [
      "Частку нараховують, коли клієнт оплатив проєкт повністю.",
      "Не зараховуються заявки від вас самих і клієнти, які працювали з нами до вашого посилання.",
      "Агенцію чи компанію зараховують після нашого підтвердження, на 12 місяців; одна компанія — один партнер, той, хто підключив першим.",
    ],
    ctaTitle: "Почніть сьогодні",
    ctaJoin: "Стати партнером",
    ctaCabinet: "Увійти в кабінет",
  },
};

const pl: DeckCopy = {
  pdf: "Pobierz PDF",
  pdfHint: "Otworzy się okno drukowania: wybierz „Zapisz jako PDF”.",
  studio: {
    kicker: "Prezentacja studia",
    numbersTitle: "W liczbach",
    numbers: {
      staff: "programistów w zespole",
      projects: "zrealizowanych projektów",
      countries: "krajów, w których działają nasze projekty",
      since: "rok założenia, Taszkent",
      lift: "wzrost liczby zapytań po audycie i wdrożeniu",
    },
    liftNote: "Wzrost liczby zapytań to średnia z naszych projektów, a nie obietnica: przed pracami i po nich zbieramy statystyki i pokazujemy je obok siebie.",
    servicesTitle: "Co robimy",
    from: (price) => `od ${price}`,
    weeks: (from, to) => `${from}–${to} tygodni`,
    languagesTitle: "Języki i geografia",
    languages: [
      "Rozmawiamy po rosyjsku, uzbecku i angielsku; strony tworzymy w dowolnych językach — nasza własna jest dostępna w sześciu, w tym po chińsku.",
      "Klienci — Uzbekistan, Kazachstan, Rosja oraz firmy sprzedające na eksport.",
      "Pracujemy zdalnie: rozmowy wideo, korespondencja w wygodnym komunikatorze, płatność na konto jednoosobowej działalności w Uzbekistanie lub na podstawie umowy z osobą prawną.",
    ],
    howTitle: "Jak pracujemy",
    how: [
      "Najpierw analizujemy zadanie: co już jest, co blokuje zapytania, co najszybciej przyniesie efekt. Cenę podajemy po analizie, a nie przed nią.",
      "Umowa z etapami i faktura za każdy etap — płacisz za to, co zrobione, a nie z góry za całość.",
      "Tygodniowe iteracje: w każdy piątek — działająca wersja na domenie testowej, a nie raport z wykonanych prac.",
      "Pierwsza linia na czacie to menedżer AI, całą dobę i w Twoim języku; dalej — menedżer-człowiek z gotowym podsumowaniem zadania.",
    ],
    casesTitle: "Realizacje",
    casesMore: (count) => `I jeszcze ${count}+ projektów — na devuz.studio/cases`,
    ctaTitle: "Omówmy Twój projekt",
    ctaText: "Napisz na Telegramie lub zostaw zapytanie na stronie — odpowiemy tego samego dnia i zaczniemy od analizy zadania.",
    ctaSite: "Zostaw zapytanie",
    ctaBot: "Napisz na Telegramie",
  },
  program: {
    kicker: "Program partnerski",
    title: "Zarabiaj z DevUz Studio",
    lead: "Polecaj klientów na development — strony, aplikacje, produkty AI, boty — i otrzymuj procent od każdego ich projektu. Bez limitu liczby klientów ani liczby projektów jednego klienta.",
    modelsTitle: "Dwa modele do wyboru",
    colRange: "Wartość projektu",
    colProfit: "Od zysku netto",
    colTurnover: "Od obrotu",
    upTo: (amount) => `do ${amount}`,
    over: (amount) => `powyżej ${amount}`,
    modelsNote: "„Od zysku” — wyższy procent, liczony od wartości umowy pomniejszonej o podatek i koszty własne. „Od obrotu” — niższy procent, ale od całej wartości umowy i znany od razu. Model można zmieniać raz w tygodniu; do klienta przypisany jest ten, który obowiązywał w dniu jego zapytania.",
    waysTitle: "Jak polecać klientów",
    ways: [
      { title: "Krótki link", text: "devuz.studio/r/… — osobny dla każdego kanału. Ktoś kliknął i w ciągu 30 dni zostawił zapytanie — jest Twój, nawet jeśli wrócił już bez linku." },
      { title: "Link do bota w Telegramie", text: "Dla tych, którym wygodniej napisać niż wypełniać formularz: wejście do bota z Twoim kodem liczy się tak samo." },
      { title: "Podłącz agencję lub firmę", text: "Firma IT, studio webowe, agencja marketingowa lub projektowa, integrator — każda firma, która regularnie ma zlecenia na development, przekazuje je nam w podwykonawstwie. Wszystkie jej zlecenia są Twoje przez 12 miesięcy od potwierdzenia." },
    ],
    agencyTitle: "Przykład: podłączasz agencję",
    agencyText: "Agencje i firmy IT stale potrzebują developmentu: agencja marketingowa — stron i landing page'y pod kampanie klientów, integrator — botów i integracji, studio webowe — zespołu, gdy własnego brakuje. Przedstawiasz nam firmę i podłączasz ją w panelu; my potwierdzamy — i przez 12 miesięcy od tego dnia każde zlecenie, które nam przekaże, jest zaliczane Tobie. Link nie jest jej potrzebny: pisze do nas bezpośrednio, a my rozpoznajemy jej zlecenia po kontakcie i nazwie.",
    tenderTitle: "Przetargi i zamówienia publiczne: jesteśmy podwykonawcą",
    tenderText: "Przetargi IT — zamówienia publiczne i konkursy dużych firm — często wygrywa generalny wykonawca, który nie ma własnego zespołu developerskiego o potrzebnym profilu. U takiego wykonawcy pracujemy jako podwykonawca techniczny. Znasz firmę, która startuje w przetargach? Podłącz ją tak samo jak agencję: przez 12 miesięcy wszystkie jej zlecenia są zaliczane Tobie.",
    tenderPoints: [
      "Przed złożeniem oferty: analizujemy specyfikację, szacujemy terminy i koszty własne, przygotowujemy część techniczną oferty.",
      "Po wygranej: development zgodnie ze specyfikacją, dokumentacja, odbiory według etapów kontraktu i okres gwarancyjny.",
      "Umowa podwykonawcza i NDA: z zamawiającym kontaktuje się generalny wykonawca, my jesteśmy jego zespołem developerskim.",
      "Wartość kontraktów przetargowych jest zwykle wyższa niż jednorazowych zleceń — to najwyższe progi stawek.",
    ],
    exampleTitle: "Ile to może być",
    exampleLead: "Agencja przekazała w ciągu miesiąca trzy zlecenia. W modelu „od obrotu”:",
    exampleOrder: (name, amount) => `${name} za ${amount}`,
    exampleTotal: "Razem dla Ciebie za miesiąc",
    exampleNote: "Przykład poglądowy, a nie obietnica: wartości projektów mogą być dowolne. W modelu „od zysku” procent jest wyższy, a wynik zależy od kosztów własnych projektu.",
    exampleOrders: ["Strona internetowa", "Aplikacja mobilna", "Marketplace"],
    cabinetTitle: "Wszystko widać w panelu",
    cabinet: [
      "Krótkie linki, wejścia dzień po dniu i zapytania — widać, który kanał działa.",
      "Każdy klient według etapów: zapytanie → umowa podpisana → opłacony, oraz Twój udział w nim.",
      "Bot sam informuje: o zapytaniu, podpisanej umowie, płatności i wypłacie.",
      "Wypłata raz w miesiącu, od 50 $ — w USDT (TRC-20) lub na podane dane.",
    ],
    rulesTitle: "Uczciwe zasady",
    rules: [
      "Udział jest naliczany, gdy klient opłaci cały projekt.",
      "Nie są zaliczane zapytania od Ciebie samego ani klienci, którzy współpracowali z nami przed Twoim linkiem.",
      "Agencja lub firma jest zaliczana po naszym potwierdzeniu, na 12 miesięcy; jedna firma — jeden partner, ten, kto podłączył ją pierwszy.",
    ],
    ctaTitle: "Zacznij już dziś",
    ctaJoin: "Zostań partnerem",
    ctaCabinet: "Zaloguj się do panelu",
  },
};

const copies: Record<Locale, DeckCopy> = { ru, en, uz, zh, uk, pl };

export function deckCopy(locale: Locale): DeckCopy {
  return copies[locale];
}
