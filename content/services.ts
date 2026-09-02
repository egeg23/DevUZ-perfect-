import type { LocalizedList, LocalizedText } from "@/lib/i18n";

export type Service = {
  slug: string;
  /**
   * Заголовок и описание для поиска.
   *
   * Отдельно от title и tagline: на странице «Сайты и порталы» звучит нормально,
   * а в выдаче должно стоять то, что человек набирает, — «разработка сайтов в
   * Ташкенте». Формулировки взяты из реальных автодополнений Google по
   * Узбекистану, а не придуманы.
   */
  seoTitle: LocalizedText;
  seoDescription: LocalizedText;
  /** Ключ иконки — сама отрисовка живёт в components/ui/icon.tsx. */
  icon: string;
  title: LocalizedText;
  tagline: LocalizedText;
  description: LocalizedText;
  bullets: LocalizedList;
  tech: string[];
  /**
   * Нижняя граница вилки в долларах и типичный срок.
   *
   * Это не прайс-лист, а якорь: он показан на сайте и передан AI-менеджеру,
   * чтобы тот мог квалифицировать бюджет (BANT-B), не называя финальную цену.
   *
   * TODO(владелец): выставить реальные цифры — от них напрямую зависит,
   * кого бот отнесёт к B1, а кого к B3.
   */
  priceFromUsd: number;
  weeksFrom: number;
  weeksTo: number;
};

export const services: Service[] = [
  {
    slug: "web-development",
    seoTitle: {
      ru: "Разработка сайтов в Ташкенте: цены и сроки — DevUz",
      en: "Website Development in Tashkent: Pricing — DevUz",
      uz: "Toshkentda sayt yaratish xizmati va narxi — DevUz",
      zh: "塔什干网站开发：价格与周期 — DevUz",
    },
    seoDescription: {
      ru: "Корпоративные сайты, лендинги и каталоги под ключ. Четыре языка, своя админка, техническое SEO. Вилка от $2500, срок 3–8 недель — точную цену считаем по задаче.",
      en: "Corporate sites, landing pages and catalogues, turnkey. Four languages, a custom admin panel, technical SEO. From $2,500, 3–8 weeks — exact quote after scoping.",
      uz: "Korporativ saytlar, lendinglar va kataloglar — kalit topshirish sharti bilan. To‘rt til, o‘z admin paneli, texnik SEO. $2500 dan, 3–8 hafta.",
      zh: "企业官网、落地页与产品目录，交钥匙交付。四种语言、自有后台、技术 SEO。起价 2500 美元，周期 3–8 周。",
    },
    icon: "globe",
    title: {
      ru: "Сайты и порталы",
      en: "Websites & portals",
      uz: "Saytlar va portallar",
      zh: "网站与门户",
    },
    tagline: {
      ru: "Корпоративные сайты, лендинги, каталоги",
      en: "Corporate sites, landing pages, catalogues",
      uz: "Korporativ saytlar, lendinglar, kataloglar",
      zh: "企业官网、落地页、产品目录",
    },
    description: {
      ru: "Собираем сайты, которые находятся в поиске и продают. Мультиязычность с первого дня, своя админка, серверный рендеринг и техническое SEO — не «потом допилим», а часть архитектуры.",
      en: "We build sites that get found and sell. Multilingual from day one, a custom admin panel, server-side rendering and technical SEO — part of the architecture, not an afterthought.",
      uz: "Qidiruvda topiladigan va sotadigan saytlar quramiz. Birinchi kundan ko‘p tillilik, o‘z admin paneli, server tomonida render va texnik SEO — keyin qo‘shiladigan narsa emas, arxitekturaning bir qismi.",
      zh: "我们打造能被搜索到、能带来订单的网站。从第一天起支持多语言，配备自有后台管理、服务端渲染与技术 SEO —— 它们是架构的一部分，而非事后补丁。",
    },
    bullets: {
      ru: [
        "Четыре языка и hreflang-разметка из коробки",
        "Админка, где контент правит менеджер, а не разработчик",
        "Core Web Vitals в зелёной зоне на реальных телефонах",
        "Разметка Schema.org, sitemap, IndexNow для Google и Яндекса",
      ],
      en: [
        "Four languages and hreflang markup out of the box",
        "An admin panel where content is edited by a manager, not a developer",
        "Core Web Vitals in the green on real phones",
        "Schema.org markup, sitemap, IndexNow for Google and Yandex",
      ],
      uz: [
        "To‘rt til va hreflang belgilash — qutidan chiqqanidek",
        "Kontentni dasturchi emas, menejer tahrirlaydigan admin panel",
        "Haqiqiy telefonlarda yashil zonadagi Core Web Vitals",
        "Schema.org belgilash, sitemap, Google va Yandex uchun IndexNow",
      ],
      zh: [
        "开箱即用的四种语言与 hreflang 标注",
        "由运营而非开发人员维护内容的后台",
        "真机实测 Core Web Vitals 全绿",
        "Schema.org 结构化数据、站点地图、面向 Google 与 Yandex 的 IndexNow",
      ],
    },
    tech: ["Next.js", "TypeScript", "Tailwind CSS", "Supabase", "PostgreSQL"],
    priceFromUsd: 2500,
    weeksFrom: 3,
    weeksTo: 8,
  },
  {
    slug: "mobile-apps",
    seoTitle: {
      ru: "Разработка мобильных приложений в Ташкенте — DevUz",
      en: "Mobile App Development in Tashkent — DevUz",
      uz: "Mobil ilova yaratish narxlari — Toshkent | DevUz",
      zh: "塔什干移动应用开发 — DevUz Studio",
    },
    seoDescription: {
      ru: "Приложения для iOS и Android на одной кодовой базе: Flutter, пуши, карты, онлайн-оплата. Публикуем в App Store и Google Play. Срок 6–14 недель.",
      en: "iOS and Android apps from a single codebase: Flutter, push, maps, online payments. We ship to the App Store and Google Play. 6–14 weeks.",
      uz: "iOS va Android uchun bitta kod bazasidan ilovalar: Flutter, push, xaritalar, onlayn to‘lov. App Store va Google Play’ga chiqaramiz. 6–14 hafta.",
      zh: "一套代码同时覆盖 iOS 与 Android：Flutter、推送、地图、在线支付。我们负责上架 App Store 与 Google Play，周期 6–14 周。",
    },
    icon: "phone",
    title: {
      ru: "Мобильные приложения",
      en: "Mobile apps",
      uz: "Mobil ilovalar",
      zh: "移动应用",
    },
    tagline: {
      ru: "iOS и Android из одной кодовой базы",
      en: "iOS and Android from a single codebase",
      uz: "Bitta kod bazasidan iOS va Android",
      zh: "一套代码同时覆盖 iOS 与 Android",
    },
    description: {
      ru: "Flutter там, где нужна скорость и одинаковый интерфейс на обеих платформах. Пуши, карты, платежи, офлайн-режим и вход через Telegram — без SMS и паролей, как привыкли пользователи в Узбекистане.",
      en: "Flutter where you need speed and a consistent interface on both platforms. Push, maps, payments, offline mode and Telegram sign-in — no SMS, no passwords, the way users in Uzbekistan expect.",
      uz: "Tezlik va ikkala platformada bir xil interfeys kerak bo‘lganda — Flutter. Push, xaritalar, to‘lovlar, oflayn rejim va Telegram orqali kirish — SMS va parolsiz, O‘zbekistondagi foydalanuvchilar odatlanganidek.",
      zh: "在需要快速交付、双端界面一致时选用 Flutter。推送、地图、支付、离线模式，以及通过 Telegram 登录 —— 无需短信与密码，符合乌兹别克斯坦用户的使用习惯。",
    },
    bullets: {
      ru: [
        "Одно приложение — несколько ролей: клиент, курьер, партнёр",
        "Вход через Telegram-бот вместо SMS-кодов",
        "Онлайн-трекинг на карте и push-уведомления",
        "Публикация в App Store и Google Play под ключ",
      ],
      en: [
        "One app, several roles: customer, courier, partner",
        "Telegram-bot sign-in instead of SMS codes",
        "Live map tracking and push notifications",
        "Turnkey publishing to the App Store and Google Play",
      ],
      uz: [
        "Bitta ilova — bir nechta rol: mijoz, kuryer, hamkor",
        "SMS kodlar o‘rniga Telegram-bot orqali kirish",
        "Xaritada onlayn kuzatuv va push-bildirishnomalar",
        "App Store va Google Play’da nashr qilish — kalit topshirish shartlarida",
      ],
      zh: [
        "一个应用承载多种角色：顾客、骑手、合作商家",
        "以 Telegram 机器人登录替代短信验证码",
        "地图实时追踪与推送通知",
        "App Store 与 Google Play 全流程上架代办",
      ],
    },
    tech: ["Flutter", "Dart", "Node.js", "PostgreSQL", "Firebase"],
    priceFromUsd: 8000,
    weeksFrom: 8,
    weeksTo: 20,
  },
  {
    slug: "ai-llm-rag",
    seoTitle: {
      ru: "Внедрение ИИ в бизнес под ключ — Ташкент | DevUz",
      en: "AI for Business: LLM and RAG in Tashkent — DevUz",
      uz: "Biznesga AI joriy etish — Toshkent | DevUz",
      zh: "企业 AI 落地：LLM 与 RAG — DevUz",
    },
    seoDescription: {
      ru: "AI-ассистенты, поиск по базе знаний на RAG, квалификация лидов и автоответы. Считаем стоимость и окупаемость до старта, а не после.",
      en: "AI assistants, RAG search over your knowledge base, lead qualification and auto-replies. We size cost and payback before the start, not after.",
      uz: "AI-yordamchilar, RAG asosida bilimlar bazasi bo‘yicha qidiruv, lidlarni saralash va avtojavoblar. Narx va qoplanishni boshlashdan oldin hisoblaymiz.",
      zh: "AI 助手、基于 RAG 的知识库检索、线索甄别与自动回复。成本与回报在启动前算清，而不是事后。",
    },
    icon: "brain",
    title: {
      ru: "LLM, RAG и AI-агенты",
      en: "LLM, RAG & AI agents",
      uz: "LLM, RAG va AI agentlar",
      zh: "LLM、RAG 与 AI 智能体",
    },
    tagline: {
      ru: "Ассистенты, которые отвечают по вашим данным",
      en: "Assistants that answer from your own data",
      uz: "Sizning ma’lumotlaringiz asosida javob beradigan yordamchilar",
      zh: "基于你自己数据作答的智能助手",
    },
    description: {
      ru: "Поиск по внутренним документам с ссылкой на конкретный пункт, автоматизация первой линии продаж и поддержки, агенты, которые сами выполняют рутину. Строим на кастомной LLM-сборке и открытых моделях, с векторным индексом в вашей же базе.",
      en: "Search across internal documents with a citation to the exact clause, automation of first-line sales and support, agents that handle routine work on their own. Built on a custom LLM setup and open models, with the vector index inside your own database.",
      uz: "Ichki hujjatlar bo‘ylab aniq bandga havola bilan qidiruv, sotuv va qo‘llab-quvvatlashning birinchi liniyasini avtomatlashtirish, rutinani o‘zi bajaradigan agentlar. Maxsus LLM yig‘masi va ochiq modellar asosida, vektor indeks sizning bazangizda.",
      zh: "在内部文档中检索并给出确切条款出处，自动化销售与客服的第一道防线，让智能体自主处理日常事务。基于定制 LLM 方案与开源模型构建，向量索引就存放在你自己的数据库中。",
    },
    bullets: {
      ru: [
        "RAG-поиск со ссылкой на источник — без выдуманных ответов",
        "Квалификация лидов по ICP и BANT прямо в чате на сайте",
        "Автономные агенты для отзывов, цен и контента",
        "Ваши данные остаются в вашем контуре",
      ],
      en: [
        "RAG search with a source citation — no invented answers",
        "Lead qualification by ICP and BANT right in the site chat",
        "Autonomous agents for reviews, pricing and content",
        "Your data stays inside your own perimeter",
      ],
      uz: [
        "Manbaga havola bilan RAG-qidiruv — o‘ylab topilgan javoblarsiz",
        "Saytdagi chatda ICP va BANT bo‘yicha lidlarni saralash",
        "Sharhlar, narxlar va kontent uchun avtonom agentlar",
        "Ma’lumotlaringiz o‘z konturingizda qoladi",
      ],
      zh: [
        "带来源引用的 RAG 检索 —— 不编造答案",
        "在网站聊天中直接完成 ICP 与 BANT 线索评分",
        "面向评价、定价与内容的自主智能体",
        "数据始终留在你自己的环境内",
      ],
    },
    tech: ["LLM API", "pgvector", "Python", "FastAPI", "Celery"],
    priceFromUsd: 5000,
    weeksFrom: 4,
    weeksTo: 16,
  },
  {
    slug: "marketplace-delivery",
    seoTitle: {
      ru: "Разработка маркетплейса под ключ в Ташкенте — DevUz",
      en: "Marketplace Development in Tashkent — DevUz",
      uz: "Marketpleys yaratish — Toshkent | DevUz Studio",
      zh: "塔什干电商平台开发 — DevUz Studio",
    },
    seoDescription: {
      ru: "Маркетплейсы, интернет-магазины и сервисы доставки: кабинет продавца, приложение курьера, трекинг на карте, интеграция с кассами и платежами.",
      en: "Marketplaces, online stores and delivery services: a seller dashboard, a courier app, live map tracking, POS and payment integrations.",
      uz: "Marketpleyslar, internet-do‘konlar va yetkazib berish servislari: sotuvchi kabineti, kuryer ilovasi, xaritada kuzatuv, kassa va to‘lov integratsiyasi.",
      zh: "电商平台、网店与配送服务：商家后台、骑手 App、地图实时追踪、收银与支付系统对接。",
    },
    icon: "cart",
    title: {
      ru: "Маркетплейсы и доставка",
      en: "Marketplaces & delivery",
      uz: "Marketpleyslar va yetkazib berish",
      zh: "电商平台与配送",
    },
    tagline: {
      ru: "Мультиролевые платформы с реальной логистикой",
      en: "Multi-role platforms with real logistics",
      uz: "Haqiqiy logistikaga ega ko‘p rolli platformalar",
      zh: "具备真实物流能力的多角色平台",
    },
    description: {
      ru: "Самый тяжёлый класс задач, который мы берём: каталог, корзина, оплата, склад, курьеры и партнёрские интеграции в одном продукте. Синхронизация меню с iiko, Poster и 1С, возврат заказов партнёру по webhook с подписью.",
      en: "The heaviest class of work we take on: catalogue, cart, payments, warehouse, couriers and partner integrations in a single product. Menu sync with iiko, Poster and 1C, orders returned to the partner over a signed webhook.",
      uz: "Biz oladigan eng og‘ir sinf vazifalar: katalog, savat, to‘lov, ombor, kuryerlar va hamkor integratsiyalari bitta mahsulotda. iiko, Poster va 1C bilan menyu sinxronizatsiyasi, buyurtmalar imzolangan webhook orqali hamkorga qaytariladi.",
      zh: "我们承接的最复杂一类项目：商品目录、购物车、支付、仓储、骑手与合作方对接集成于一个产品之中。与 iiko、Poster、1C 同步菜单，通过带签名的 webhook 将订单回传给合作方。",
    },
    bullets: {
      ru: [
        "Роли покупателя, курьера и партнёра в одном приложении",
        "Интеграции с POS: iiko, Poster, 1С, произвольный REST",
        "Онлайн-статусы заказов и очереди задач на BullMQ",
        "Готовность к сети из сотни точек, а не к одной кофейне",
      ],
      en: [
        "Customer, courier and partner roles in a single app",
        "POS integrations: iiko, Poster, 1C, custom REST",
        "Live order statuses and job queues on BullMQ",
        "Built for a hundred-location chain, not a single coffee shop",
      ],
      uz: [
        "Xaridor, kuryer va hamkor rollari bitta ilovada",
        "POS integratsiyalari: iiko, Poster, 1C, ixtiyoriy REST",
        "Buyurtmalarning onlayn holati va BullMQ’dagi vazifalar navbati",
        "Bitta qahvaxona emas, yuzta nuqtali tarmoq uchun tayyor",
      ],
      zh: [
        "顾客、骑手、合作商家三种角色集成于同一应用",
        "POS 系统对接：iiko、Poster、1C 及自定义 REST",
        "订单状态实时更新，基于 BullMQ 的任务队列",
        "面向上百家门店的连锁体量，而非单店场景",
      ],
    },
    tech: ["Node.js", "PostgreSQL", "Redis", "BullMQ", "Flutter", "Docker"],
    priceFromUsd: 15000,
    weeksFrom: 12,
    weeksTo: 32,
  },
  {
    slug: "integrations-automation",
    seoTitle: {
      ru: "Автоматизация бизнес-процессов в Ташкенте — DevUz",
      en: "Business Process Automation in Tashkent — DevUz",
      uz: "Biznes jarayonlarini avtomatlashtirish — DevUz",
      zh: "塔什干业务流程自动化 — DevUz",
    },
    seoDescription: {
      ru: "Связываем 1С, CRM, кассы, платёжные шлюзы и Telegram в один рабочий контур. Убираем ручной перенос данных между системами.",
      en: "We wire 1C, CRM, POS, payment gateways and Telegram into one working loop, removing manual data transfer between systems.",
      uz: "1C, CRM, kassalar, to‘lov shlyuzlari va Telegram’ni yagona ish konturiga bog‘laymiz. Tizimlar orasida qo‘lda ma’lumot ko‘chirishni yo‘q qilamiz.",
      zh: "把 1C、CRM、收银、支付网关与 Telegram 接入同一条工作链路，取消系统间的手工搬运数据。",
    },
    icon: "plug",
    title: {
      ru: "Интеграции и автоматизация",
      en: "Integrations & automation",
      uz: "Integratsiyalar va avtomatlashtirish",
      zh: "系统集成与自动化",
    },
    tagline: {
      ru: "Связываем то, что у вас уже работает",
      en: "Connecting what you already run",
      uz: "Sizda allaqachon ishlayotgan narsalarni bog‘laymiz",
      zh: "把你已有的系统连接起来",
    },
    description: {
      ru: "Платёжные шлюзы, SMS и Telegram-рассылки, CRM, 1С, умные замки, фискализация. Мы часто заходим этим сервисом, а остаёмся на большом проекте — потому что после интеграций видно, где у бизнеса действительно болит.",
      en: "Payment gateways, SMS and Telegram messaging, CRM, 1C, smart locks, fiscalisation. We often start here and stay for the bigger project — once the integrations are in, it becomes obvious where the business actually hurts.",
      uz: "To‘lov shlyuzlari, SMS va Telegram tarqatmalari, CRM, 1C, aqlli qulflar, fiskalizatsiya. Ko‘pincha shu xizmat bilan kiramiz va katta loyihada qolamiz — integratsiyalardan keyin biznesning qayeri chinakam og‘rishi ko‘rinadi.",
      zh: "支付网关、短信与 Telegram 通知、CRM、1C、智能门锁、税务开票。我们常以此切入，随后承接更大的项目 —— 因为集成完成后，业务真正的痛点就一目了然了。",
    },
    bullets: {
      ru: [
        "Платежи: Octobank, Atmos, Payme, Click",
        "Уведомления: Telegram Gateway, Eskiz SMS",
        "Учёт: 1С, iiko, Poster, произвольный REST",
        "Оборудование: умные замки TTLock, фискальные регистраторы",
      ],
      en: [
        "Payments: Octobank, Atmos, Payme, Click",
        "Notifications: Telegram Gateway, Eskiz SMS",
        "Back office: 1C, iiko, Poster, custom REST",
        "Hardware: TTLock smart locks, fiscal registers",
      ],
      uz: [
        "To‘lovlar: Octobank, Atmos, Payme, Click",
        "Bildirishnomalar: Telegram Gateway, Eskiz SMS",
        "Hisob: 1C, iiko, Poster, ixtiyoriy REST",
        "Uskunalar: TTLock aqlli qulflari, fiskal registratorlar",
      ],
      zh: [
        "支付：Octobank、Atmos、Payme、Click",
        "通知：Telegram Gateway、Eskiz 短信",
        "后台系统：1C、iiko、Poster 及自定义 REST",
        "硬件：TTLock 智能门锁、税控收款机",
      ],
    },
    tech: ["Node.js", "Python", "REST", "Webhooks", "HMAC"],
    priceFromUsd: 1500,
    weeksFrom: 1,
    weeksTo: 6,
  },
];

export function serviceBySlug(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}
