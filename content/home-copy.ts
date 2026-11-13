import type { Locale } from "@/lib/i18n";

/**
 * Тексты новой главной («Стекло», владелец, 06.11.2026: «Давай начнем с
 * главной»). Макет утверждён PDF-ом: первый экран с перепиской
 * ИИ-сотрудника, «Работы студии», «Продукты студии», «Прототип за 12 часов»
 * с заявкой.
 *
 * Числа студии и цены здесь не пишутся: {staff}, {projects}, {countries}
 * подставляет `proof` из content/company.ts, {landing}/{corp} и старые цены
 * — PROMO из lib/admin/mockup-offer.ts (компонент главной). Одно место — одно
 * число: акцию на макет меняют там, и главная не разъедется с письмами.
 *
 * Правила текста — как у макетов: без длинных тире, без штампов ИИ, без
 * фактов, которых нет в коде. ИИ-сотрудник отвечает в Telegram и на сайте
 * (content/ai-staff/landing.ts), а не «везде»; переписка на первом экране
 * подписана как пример.
 */

type Step = { when: string; title: string; text: string };
type Msg = { from: "in" | "out"; text: string; time: string };

export type HomeCopy = {
  hero: {
    /** Строки заголовка: на компьютере каждая с новой строки, на телефоне подряд. */
    title: readonly string[];
    lead: string;
    /** Выделенная часть: штат и проекты. */
    proof: string;
    proofTail: string;
    order: string;
    works: string;
    chat: {
      label: string;
      name: string;
      status: string;
      channel: string;
      messages: readonly Msg[];
      handoff: string;
    };
    ready: { title: string; text: string; open: string };
  };
  works: { title: string; lead: string; all: string };
  products: {
    title: string;
    lead: string;
    ai: {
      title: string;
      text: string;
      price: string;
      trial: string;
      button: string;
      chat: readonly [string, string];
    };
    audit: {
      title: string;
      text: string;
      free: string;
      tail: string;
      button: string;
      example: string;
      outOf: string;
      rows: readonly { k: string; v: string; ok: boolean }[];
    };
  };
  proto: {
    title: string;
    lead: string;
    steps: readonly [Step, Step, Step];
    form: {
      title: string;
      text: string;
      name: string;
      contact: string;
      site: string;
      send: string;
      sending: string;
      sent: string;
      failed: string;
      terms: string;
      termsLink: string;
      alt: string;
    };
    phoneAlt: string;
  };
};

const ru: HomeCopy = {
  hero: {
    title: ["Сайты, приложения", "и ИИ‑сотрудники", "для бизнеса"],
    lead: "Делаем сайт и ведём рекламу, а ИИ‑сотрудник отвечает вашим покупателям в Telegram и на сайте.",
    proof: "{staff} разработчиков, {projects}+ проектов",
    proofTail: "в {countries} странах.",
    order: "Заказать макет",
    works: "Смотреть работы",
    chat: {
      label: "Пример переписки ИИ‑сотрудника с клиникой",
      name: "ИИ‑сотрудник DevUz",
      status: "пример переписки",
      channel: "Telegram",
      messages: [
        { from: "in", text: "Здравствуйте! Сколько стоит сайт для нашей клиники?", time: "10:14" },
        { from: "out", text: "Сайт для клиники от {corp}. Могу бесплатно собрать макет с вашими услугами за 12 часов. Пришлёте ссылку на нынешний сайт?", time: "10:14" },
        { from: "in", text: "Да, ссылка у нас в профиле.", time: "10:16" },
        { from: "out", text: "Принял. Макет пришлю сюда сегодня, менеджер Александр позвонит, если будут вопросы.", time: "10:16" },
      ],
      handoff: "Заявка у менеджера · 10:17",
    },
    ready: { title: "Макет клиники готов", text: "Открывается по ссылке, на телефоне тоже", open: "Открыть" },
  },
  works: {
    title: "Работы студии",
    lead: "Сайты и макеты этого года. Каждый открывается по ссылке и работает на телефоне.",
    all: "Все работы",
  },
  products: {
    title: "Продукты студии",
    lead: "Кроме сайтов на заказ, у нас есть свои продукты: ими пользуемся сами и подключаем клиентам.",
    ai: {
      title: "ИИ‑сотрудник",
      text: "Отвечает покупателям в Telegram и на сайте по вашему прайсу, заявку передаёт менеджеру.",
      price: "От 490 000 сум в месяц,",
      trial: "14 дней бесплатно",
      button: "Написать нашему боту",
      chat: ["Доставка в Чирчик есть?", "Да, на следующий день. Оформить?"],
    },
    audit: {
      title: "Проверка сайта",
      text: "Введите адрес: за 60 секунд покажем, что видит покупатель и что видит поисковик.",
      free: "Бесплатно",
      tail: ", без регистрации",
      button: "Проверить сайт",
      example: "пример",
      outOf: "из 100",
      rows: [
        { k: "Телефон", v: "медленно", ok: false },
        { k: "Кнопка заявки", v: "есть", ok: true },
        { k: "Видимость в Google", v: "слабая", ok: false },
      ],
    },
  },
  proto: {
    title: "Макет вашего сайта за 12 часов",
    lead: "Бесплатно и без предоплаты. Пришлите ссылку на сайт или расскажите о бизнесе, и в тот же день у вас будет макет с вашими услугами и ценами.",
    steps: [
      { when: "Утром", title: "Вы пишете нам", text: "В Telegram или заявкой на сайте: ссылка и пара слов о бизнесе." },
      { when: "До 12 часов", title: "Присылаем ссылку на макет", text: "Он открывается на телефоне, его можно показать партнёрам." },
      { when: "48 часов", title: "Действует спеццена", text: "Лендинг {landing} вместо {landingOld}.\nКорпоративный сайт {corp} вместо {corpOld}." },
    ],
    form: {
      title: "Заказать макет",
      text: "Оставьте контакт: менеджер напишет в Telegram и уточнит, что показать в макете.",
      name: "Как вас зовут",
      contact: "Телефон или @ник в Telegram",
      site: "Сайт, если есть",
      send: "Заказать макет",
      sending: "Отправляем…",
      sent: "Заявка у менеджера. Он напишет вам в течение рабочего дня.",
      failed: "Не отправилось. Напишите нам в Telegram, ссылка ниже.",
      terms: "Макет показываем на",
      termsLink: "условиях макета",
      alt: "или напишите {bot} в Telegram",
    },
    phoneAlt: "Макет Cargo Pro Group на телефоне",
  },
};

const en: HomeCopy = {
  hero: {
    title: ["Websites, apps", "and AI employees", "for business"],
    lead: "We build your site and run your ads, and an AI employee answers your customers in Telegram and on the site.",
    proof: "{staff} developers, {projects}+ projects",
    proofTail: "in {countries} countries.",
    order: "Order a mockup",
    works: "See our work",
    chat: {
      label: "Example of an AI employee chatting with a clinic",
      name: "DevUz AI employee",
      status: "example chat",
      channel: "Telegram",
      messages: [
        { from: "in", text: "Hello! How much is a website for our clinic?", time: "10:14" },
        { from: "out", text: "A clinic site starts at {corp}. I can build a free mockup with your services in 12 hours. Could you send a link to your current site?", time: "10:14" },
        { from: "in", text: "Sure, the link is in our profile.", time: "10:16" },
        { from: "out", text: "Got it. I'll send the mockup here today, and Alexander, our manager, will call if you have questions.", time: "10:16" },
      ],
      handoff: "Request passed to a manager · 10:17",
    },
    ready: { title: "Clinic mockup is ready", text: "Opens from a link, on a phone too", open: "Open" },
  },
  works: {
    title: "Studio work",
    lead: "Sites and mockups from this year. Each one opens from a link and works on a phone.",
    all: "All work",
  },
  products: {
    title: "Studio products",
    lead: "Besides custom sites, we have our own products: we use them ourselves and set them up for clients.",
    ai: {
      title: "AI employee",
      text: "Answers customers in Telegram and on your site using your price list, and hands requests to a manager.",
      price: "From 490,000 sum a month,",
      trial: "14 days free",
      button: "Message our bot",
      chat: ["Do you deliver to Chirchiq?", "Yes, next day. Shall I place the order?"],
    },
    audit: {
      title: "Website check",
      text: "Enter an address: in 60 seconds we show what a customer sees and what a search engine sees.",
      free: "Free",
      tail: ", no sign-up",
      button: "Check a site",
      example: "example",
      outOf: "of 100",
      rows: [
        { k: "Phone", v: "slow", ok: false },
        { k: "Request button", v: "present", ok: true },
        { k: "Google visibility", v: "weak", ok: false },
      ],
    },
  },
  proto: {
    title: "A mockup of your site in 12 hours",
    lead: "Free and with no prepayment. Send a link to your site or tell us about your business, and the same day you get a mockup with your services and prices.",
    steps: [
      { when: "Morning", title: "You write to us", text: "In Telegram or with the form on this site: a link and a few words about the business." },
      { when: "Within 12 hours", title: "We send the mockup link", text: "It opens on a phone, and you can show it to your partners." },
      { when: "48 hours", title: "A special price applies", text: "Landing page {landing} instead of {landingOld}.\nCorporate site {corp} instead of {corpOld}." },
    ],
    form: {
      title: "Order a mockup",
      text: "Leave a contact: a manager will message you in Telegram and ask what to show in the mockup.",
      name: "Your name",
      contact: "Phone or Telegram @username",
      site: "Website, if you have one",
      send: "Order a mockup",
      sending: "Sending…",
      sent: "Your request is with a manager. They will message you within a working day.",
      failed: "It didn't go through. Message us in Telegram, the link is below.",
      terms: "We show mockups under our",
      termsLink: "mock-up terms",
      alt: "or message {bot} in Telegram",
    },
    phoneAlt: "Cargo Pro Group mockup on a phone",
  },
};

const uz: HomeCopy = {
  hero: {
    title: ["Biznes uchun saytlar,", "ilovalar va", "sun’iy intellekt xodimlari"],
    lead: "Sayt qilamiz va reklamani yuritamiz, sun’iy intellekt xodimi esa xaridorlaringizga Telegram va saytda javob beradi.",
    proof: "{staff} dasturchi, {projects}+ loyiha",
    proofTail: "{countries} mamlakatda.",
    order: "Maket buyurtma qilish",
    works: "Ishlarni ko‘rish",
    chat: {
      label: "Sun’iy intellekt xodimining klinika bilan yozishmasi namunasi",
      name: "DevUz sun’iy intellekt xodimi",
      status: "yozishma namunasi",
      channel: "Telegram",
      messages: [
        { from: "in", text: "Assalomu alaykum! Klinikamiz uchun sayt qancha turadi?", time: "10:14" },
        { from: "out", text: "Klinika sayti {corp} dan. Xizmatlaringiz bilan maketni 12 soatda bepul yig‘ib beraman. Hozirgi saytingiz havolasini yuborasizmi?", time: "10:14" },
        { from: "in", text: "Ha, havola profilimizda bor.", time: "10:16" },
        { from: "out", text: "Qabul qildim. Maketni bugun shu yerga yuboraman, savollar bo‘lsa, menejer Aleksandr qo‘ng‘iroq qiladi.", time: "10:16" },
      ],
      handoff: "Ariza menejerda · 10:17",
    },
    ready: { title: "Klinika maketi tayyor", text: "Havola orqali ochiladi, telefonda ham", open: "Ochish" },
  },
  works: {
    title: "Studiya ishlari",
    lead: "Shu yilgi saytlar va maketlar. Har biri havola orqali ochiladi va telefonda ishlaydi.",
    all: "Barcha ishlar",
  },
  products: {
    title: "Studiya mahsulotlari",
    lead: "Buyurtma saytlardan tashqari o‘z mahsulotlarimiz bor: ulardan o‘zimiz foydalanamiz va mijozlarga ulab beramiz.",
    ai: {
      title: "Sun’iy intellekt xodimi",
      text: "Xaridorlarga Telegram va saytda narxlaringiz bo‘yicha javob beradi, arizani menejerga topshiradi.",
      price: "Oyiga 490 000 so‘mdan,",
      trial: "14 kun bepul",
      button: "Bizning botga yozish",
      chat: ["Chirchiqqa yetkazib berasizmi?", "Ha, ertasi kuni. Rasmiylashtiraymi?"],
    },
    audit: {
      title: "Saytni tekshirish",
      text: "Manzilni kiriting: 60 soniyada xaridor nimani va qidiruv tizimi nimani ko‘rishini ko‘rsatamiz.",
      free: "Bepul",
      tail: ", ro‘yxatdan o‘tmasdan",
      button: "Saytni tekshirish",
      example: "namuna",
      outOf: "/ 100",
      rows: [
        { k: "Telefon", v: "sekin", ok: false },
        { k: "Ariza tugmasi", v: "bor", ok: true },
        { k: "Google’da ko‘rinish", v: "zaif", ok: false },
      ],
    },
  },
  proto: {
    title: "Saytingiz maketi 12 soatda",
    lead: "Bepul va oldindan to‘lovsiz. Sayt havolasini yuboring yoki biznesingiz haqida aytib bering, o‘sha kuniyoq xizmatlaringiz va narxlaringiz bilan maket tayyor bo‘ladi.",
    steps: [
      { when: "Ertalab", title: "Bizga yozasiz", text: "Telegramda yoki saytdagi ariza orqali: havola va biznes haqida bir-ikki so‘z." },
      { when: "12 soatgacha", title: "Maket havolasini yuboramiz", text: "U telefonda ochiladi, uni hamkorlaringizga ko‘rsatish mumkin." },
      { when: "48 soat", title: "Maxsus narx amal qiladi", text: "Lending {landingOld} o‘rniga {landing}.\nKorporativ sayt {corpOld} o‘rniga {corp}." },
    ],
    form: {
      title: "Maket buyurtma qilish",
      text: "Kontaktingizni qoldiring: menejer Telegramda yozadi va maketda nimani ko‘rsatishni aniqlaydi.",
      name: "Ismingiz",
      contact: "Telefon yoki Telegramdagi @nik",
      site: "Sayt, agar bo‘lsa",
      send: "Maket buyurtma qilish",
      sending: "Yuborilmoqda…",
      sent: "Ariza menejerda. U ish kuni davomida sizga yozadi.",
      failed: "Yuborilmadi. Bizga Telegramda yozing, havola pastda.",
      terms: "Maketni",
      termsLink: "maket shartlari asosida ko‘rsatamiz",
      alt: "yoki Telegramda {bot} ga yozing",
    },
    phoneAlt: "Telefondagi Cargo Pro Group maketi",
  },
};

const zh: HomeCopy = {
  hero: {
    title: ["网站、应用", "和 AI 员工", "服务企业"],
    lead: "我们做网站、投放广告，AI 员工在 Telegram 和网站上回复您的客户。",
    proof: "{staff} 名开发者，{projects}+ 个项目",
    proofTail: "覆盖 {countries} 个国家。",
    order: "预约样稿",
    works: "查看作品",
    chat: {
      label: "AI 员工与诊所对话示例",
      name: "DevUz AI 员工",
      status: "对话示例",
      channel: "Telegram",
      messages: [
        { from: "in", text: "您好！给我们诊所做个网站多少钱？", time: "10:14" },
        { from: "out", text: "诊所网站 {corp} 起。我可以在 12 小时内免费做一个包含您服务项目的样稿。能发一下现在网站的链接吗？", time: "10:14" },
        { from: "in", text: "可以，链接在我们的主页里。", time: "10:16" },
        { from: "out", text: "收到。今天就把样稿发到这里，如有问题，经理亚历山大会给您打电话。", time: "10:16" },
      ],
      handoff: "咨询已转给经理 · 10:17",
    },
    ready: { title: "诊所样稿已完成", text: "通过链接打开，手机上也可以", open: "打开" },
  },
  works: {
    title: "工作室作品",
    lead: "今年的网站和样稿。每一个都能通过链接打开，并在手机上正常使用。",
    all: "全部作品",
  },
  products: {
    title: "工作室产品",
    lead: "除了定制网站，我们还有自己的产品：自己在用，也为客户接入。",
    ai: {
      title: "AI 员工",
      text: "按您的价目表在 Telegram 和网站上回复客户，并把咨询转给经理。",
      price: "每月 490 000 苏姆起，",
      trial: "免费试用 14 天",
      button: "联系我们的机器人",
      chat: ["能送到奇尔奇克吗？", "可以，第二天送达。现在下单吗？"],
    },
    audit: {
      title: "网站检测",
      text: "输入网址：60 秒内告诉您客户看到什么、搜索引擎看到什么。",
      free: "免费",
      tail: "，无需注册",
      button: "检测网站",
      example: "示例",
      outOf: "/ 100",
      rows: [
        { k: "手机端", v: "慢", ok: false },
        { k: "咨询按钮", v: "有", ok: true },
        { k: "Google 可见度", v: "弱", ok: false },
      ],
    },
  },
  proto: {
    title: "12 小时拿到网站样稿",
    lead: "免费，无需预付。发来网站链接或介绍一下您的业务，当天就能看到带有您的服务和价格的样稿。",
    steps: [
      { when: "上午", title: "您联系我们", text: "通过 Telegram 或网站表单：一个链接，再加几句业务介绍。" },
      { when: "12 小时内", title: "我们发来样稿链接", text: "手机上就能打开，也可以给合作伙伴看。" },
      { when: "48 小时", title: "享受特价", text: "落地页 {landing}，原价 {landingOld}。\n企业网站 {corp}，原价 {corpOld}。" },
    ],
    form: {
      title: "预约样稿",
      text: "留下联系方式：经理会在 Telegram 上联系您，确认样稿里要展示什么。",
      name: "您的称呼",
      contact: "电话或 Telegram @用户名",
      site: "网站（如有）",
      send: "预约样稿",
      sending: "正在发送…",
      sent: "申请已交给经理，他会在一个工作日内联系您。",
      failed: "发送失败。请在 Telegram 上联系我们，链接在下方。",
      terms: "样稿按照",
      termsLink: "样稿条款展示",
      alt: "或在 Telegram 上联系 {bot}",
    },
    phoneAlt: "手机上的 Cargo Pro Group 样稿",
  },
};

const uk: HomeCopy = {
  hero: {
    title: ["Сайти, застосунки", "та ШІ‑співробітники", "для бізнесу"],
    lead: "Робимо сайт і ведемо рекламу, а ШІ‑співробітник відповідає вашим покупцям у Telegram і на сайті.",
    proof: "{staff} розробників, {projects}+ проєктів",
    proofTail: "у {countries} країнах.",
    order: "Замовити макет",
    works: "Дивитися роботи",
    chat: {
      label: "Приклад листування ШІ‑співробітника з клінікою",
      name: "ШІ‑співробітник DevUz",
      status: "приклад листування",
      channel: "Telegram",
      messages: [
        { from: "in", text: "Добрий день! Скільки коштує сайт для нашої клініки?", time: "10:14" },
        { from: "out", text: "Сайт для клініки від {corp}. Можу безкоштовно зібрати макет з вашими послугами за 12 годин. Надішлете посилання на нинішній сайт?", time: "10:14" },
        { from: "in", text: "Так, посилання є в нашому профілі.", time: "10:16" },
        { from: "out", text: "Прийняв. Макет надішлю сюди сьогодні, менеджер Олександр зателефонує, якщо будуть питання.", time: "10:16" },
      ],
      handoff: "Заявка в менеджера · 10:17",
    },
    ready: { title: "Макет клініки готовий", text: "Відкривається за посиланням, на телефоні теж", open: "Відкрити" },
  },
  works: {
    title: "Роботи студії",
    lead: "Сайти й макети цього року. Кожен відкривається за посиланням і працює на телефоні.",
    all: "Усі роботи",
  },
  products: {
    title: "Продукти студії",
    lead: "Крім сайтів на замовлення, у нас є власні продукти: ними користуємося самі й підключаємо клієнтам.",
    ai: {
      title: "ШІ‑співробітник",
      text: "Відповідає покупцям у Telegram і на сайті за вашим прайсом, заявку передає менеджеру.",
      price: "Від 490 000 сумів на місяць,",
      trial: "14 днів безкоштовно",
      button: "Написати нашому боту",
      chat: ["Доставка в Чирчик є?", "Так, наступного дня. Оформити?"],
    },
    audit: {
      title: "Перевірка сайту",
      text: "Введіть адресу: за 60 секунд покажемо, що бачить покупець і що бачить пошуковик.",
      free: "Безкоштовно",
      tail: ", без реєстрації",
      button: "Перевірити сайт",
      example: "приклад",
      outOf: "зі 100",
      rows: [
        { k: "Телефон", v: "повільно", ok: false },
        { k: "Кнопка заявки", v: "є", ok: true },
        { k: "Видимість у Google", v: "слабка", ok: false },
      ],
    },
  },
  proto: {
    title: "Макет вашого сайту за 12 годин",
    lead: "Безкоштовно й без передоплати. Надішліть посилання на сайт або розкажіть про бізнес, і того ж дня у вас буде макет з вашими послугами й цінами.",
    steps: [
      { when: "Зранку", title: "Ви пишете нам", text: "У Telegram або заявкою на сайті: посилання й кілька слів про бізнес." },
      { when: "До 12 годин", title: "Надсилаємо посилання на макет", text: "Він відкривається на телефоні, його можна показати партнерам." },
      { when: "48 годин", title: "Діє спецціна", text: "Лендинг {landing} замість {landingOld}.\nКорпоративний сайт {corp} замість {corpOld}." },
    ],
    form: {
      title: "Замовити макет",
      text: "Залиште контакт: менеджер напише в Telegram і уточнить, що показати в макеті.",
      name: "Як вас звати",
      contact: "Телефон або @нік у Telegram",
      site: "Сайт, якщо є",
      send: "Замовити макет",
      sending: "Надсилаємо…",
      sent: "Заявка в менеджера. Він напише вам протягом робочого дня.",
      failed: "Не надіслалося. Напишіть нам у Telegram, посилання нижче.",
      terms: "Макет показуємо на",
      termsLink: "умовах макета",
      alt: "або напишіть {bot} у Telegram",
    },
    phoneAlt: "Макет Cargo Pro Group на телефоні",
  },
};

const pl: HomeCopy = {
  hero: {
    title: ["Strony, aplikacje", "i pracownicy AI", "dla firm"],
    lead: "Robimy stronę i prowadzimy reklamę, a pracownik AI odpowiada Twoim klientom w Telegramie i na stronie.",
    proof: "{staff} programistów, {projects}+ projektów",
    proofTail: "w {countries} krajach.",
    order: "Zamów makietę",
    works: "Zobacz realizacje",
    chat: {
      label: "Przykład rozmowy pracownika AI z kliniką",
      name: "Pracownik AI DevUz",
      status: "przykład rozmowy",
      channel: "Telegram",
      messages: [
        { from: "in", text: "Dzień dobry! Ile kosztuje strona dla naszej kliniki?", time: "10:14" },
        { from: "out", text: "Strona dla kliniki od {corp}. Mogę za darmo zrobić makietę z Waszymi usługami w 12 godzin. Prześlecie link do obecnej strony?", time: "10:14" },
        { from: "in", text: "Tak, link jest w naszym profilu.", time: "10:16" },
        { from: "out", text: "Przyjąłem. Makietę wyślę tutaj dziś, a menedżer Aleksander zadzwoni, jeśli będą pytania.", time: "10:16" },
      ],
      handoff: "Zgłoszenie u menedżera · 10:17",
    },
    ready: { title: "Makieta kliniki gotowa", text: "Otwiera się z linku, także na telefonie", open: "Otwórz" },
  },
  works: {
    title: "Realizacje studia",
    lead: "Strony i makiety z tego roku. Każda otwiera się z linku i działa na telefonie.",
    all: "Wszystkie realizacje",
  },
  products: {
    title: "Produkty studia",
    lead: "Poza stronami na zamówienie mamy własne produkty: sami z nich korzystamy i wdrażamy je klientom.",
    ai: {
      title: "Pracownik AI",
      text: "Odpowiada klientom w Telegramie i na stronie według Twojego cennika, a zgłoszenia przekazuje menedżerowi.",
      price: "Od 490 000 sum miesięcznie,",
      trial: "14 dni za darmo",
      button: "Napisz do naszego bota",
      chat: ["Dowozicie do Czirczyku?", "Tak, następnego dnia. Złożyć zamówienie?"],
    },
    audit: {
      title: "Sprawdzenie strony",
      text: "Wpisz adres: w 60 sekund pokażemy, co widzi klient, a co wyszukiwarka.",
      free: "Za darmo",
      tail: ", bez rejestracji",
      button: "Sprawdź stronę",
      example: "przykład",
      outOf: "na 100",
      rows: [
        { k: "Telefon", v: "wolno", ok: false },
        { k: "Przycisk zgłoszenia", v: "jest", ok: true },
        { k: "Widoczność w Google", v: "słaba", ok: false },
      ],
    },
  },
  proto: {
    title: "Makieta Twojej strony w 12 godzin",
    lead: "Za darmo i bez przedpłaty. Wyślij link do strony albo opowiedz o firmie, a jeszcze tego samego dnia dostaniesz makietę z Twoimi usługami i cenami.",
    steps: [
      { when: "Rano", title: "Piszesz do nas", text: "W Telegramie albo przez formularz na stronie: link i kilka słów o firmie." },
      { when: "Do 12 godzin", title: "Wysyłamy link do makiety", text: "Otwiera się na telefonie, można go pokazać wspólnikom." },
      { when: "48 godzin", title: "Obowiązuje cena specjalna", text: "Landing {landing} zamiast {landingOld}.\nStrona firmowa {corp} zamiast {corpOld}." },
    ],
    form: {
      title: "Zamów makietę",
      text: "Zostaw kontakt: menedżer napisze na Telegramie i dopyta, co pokazać w makiecie.",
      name: "Jak masz na imię",
      contact: "Telefon albo @nick na Telegramie",
      site: "Strona, jeśli jest",
      send: "Zamów makietę",
      sending: "Wysyłamy…",
      sent: "Zgłoszenie jest u menedżera. Napisze do Ciebie w ciągu dnia roboczego.",
      failed: "Nie udało się wysłać. Napisz do nas na Telegramie, link poniżej.",
      terms: "Makietę pokazujemy na",
      termsLink: "warunkach makiety",
      alt: "albo napisz do {bot} na Telegramie",
    },
    phoneAlt: "Makieta Cargo Pro Group na telefonie",
  },
};

export const homeCopy: Record<Locale, HomeCopy> = { ru, en, uz, zh, uk, pl };
