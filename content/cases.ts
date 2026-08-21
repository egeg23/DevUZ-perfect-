import type { LocalizedText } from "@/lib/i18n";

/**
 * Библиотека проектов.
 *
 * У файла две роли. Первая — витрина кейсов на сайте. Вторая, менее очевидная:
 * это база, по которой AI-менеджер оценивает нашу экспертность в нише клиента
 * при ICP-скоринге. Поэтому у каждого кейса есть `niches` — список ниш, к
 * которым он относится, в терминах, которыми говорит клиент.
 */
export type Case = {
  slug: string;
  /** Название проекта — не переводится. */
  name: string;
  year: number;
  /** Живой адрес, если проект публичный. */
  url?: string;
  /** Грейд ниши по ICP: 1 — высший приоритет, 3 — низший. */
  tier: 1 | 2 | 3;
  /** Ниши для сопоставления с запросом клиента при ICP-скоринге. */
  niches: string[];
  category: LocalizedText;
  summary: LocalizedText;
  description: LocalizedText;
  tech: string[];
  metrics: Array<{ value: string; label: LocalizedText }>;
  /** Оттенок карточки — задаёт градиент превью. */
  accent: "green" | "blue" | "gold" | "violet";
};

export const cases: Case[] = [
  {
    slug: "tezketkaz",
    name: "TezKetKaz",
    year: 2026,
    tier: 1,
    niches: ["доставка еды", "ресторанный бизнес", "HoReCa", "маркетплейс", "логистика", "食品配送", "food delivery"],
    accent: "green",
    category: {
      ru: "Маркетплейс доставки",
      en: "Delivery marketplace",
      uz: "Yetkazib berish marketpleysi",
      zh: "配送平台",
    },
    summary: {
      ru: "Одно Flutter-приложение, три роли и синхронизация меню с кассами ресторанных сетей.",
      en: "One Flutter app, three roles and menu sync with restaurant-chain POS systems.",
      uz: "Bitta Flutter ilova, uch rol va restoran tarmoqlari kassalari bilan menyu sinxronizatsiyasi.",
      zh: "一个 Flutter 应用、三种角色，并与连锁餐厅收银系统同步菜单。",
    },
    description: {
      ru: "Маркетплейс доставки еды и продуктов для Узбекистана. Пользователь входит через Telegram — без SMS и паролей — и сам выбирает, в каком режиме открыть приложение: покупатель, курьер или менеджер ресторана. У каждой роли свой полноценный интерфейс. Для сетей сделан B2B-уровень: ресторан подключает свою iiko, Poster или 1С прямо из интерфейса, меню синхронизируется автоматически, а заказы возвращаются партнёру по webhook с HMAC-подписью. Инфраструктура — четыре контейнера с автоматическим SSL, Postgres, Redis и очередями BullMQ.",
      en: "A food and grocery delivery marketplace for Uzbekistan. Users sign in through Telegram — no SMS, no passwords — and choose which mode to open the app in: customer, courier or restaurant manager. Each role gets a full interface of its own. A B2B layer serves chains: a restaurant connects its iiko, Poster or 1C straight from the UI, the menu syncs automatically, and orders are returned to the partner over an HMAC-signed webhook. Infrastructure is four containers with automatic SSL, Postgres, Redis and BullMQ queues.",
      uz: "O‘zbekiston uchun oziq-ovqat va mahsulotlar yetkazib berish marketpleysi. Foydalanuvchi Telegram orqali kiradi — SMS va parolsiz — va ilovani qaysi rejimda ochishni o‘zi tanlaydi: xaridor, kuryer yoki restoran menejeri. Har bir rolning o‘z to‘liq interfeysi bor. Tarmoqlar uchun B2B daraja qilingan: restoran o‘z iiko, Poster yoki 1C tizimini interfeysdan ulaydi, menyu avtomatik sinxronlanadi, buyurtmalar esa HMAC imzosi bilan webhook orqali hamkorga qaytariladi.",
      zh: "面向乌兹别克斯坦的餐饮与生鲜配送平台。用户通过 Telegram 登录 —— 无需短信与密码 —— 并自行选择以哪种身份进入应用：顾客、骑手或餐厅管理员，每种角色都有各自完整的界面。平台为连锁品牌提供 B2B 能力：餐厅可直接在界面中接入自有的 iiko、Poster 或 1C，菜单自动同步，订单则通过带 HMAC 签名的 webhook 回传给合作方。基础设施由四个容器组成，具备自动 SSL、Postgres、Redis 与 BullMQ 队列。",
    },
    tech: ["Flutter", "Node.js", "PostgreSQL", "Redis", "BullMQ", "Docker"],
    metrics: [
      {
        value: "3",
        label: { ru: "роли в одном приложении", en: "roles in one app", uz: "bitta ilovadagi rollar", zh: "同一应用中的角色数" },
      },
      {
        value: "100+",
        label: { ru: "точек сети на одной интеграции", en: "chain locations on one integration", uz: "bitta integratsiyadagi tarmoq nuqtalari", zh: "单次对接可覆盖门店数" },
      },
      {
        value: "0",
        label: { ru: "SMS для входа", en: "SMS needed to sign in", uz: "kirish uchun SMS", zh: "登录所需短信数" },
      },
    ],
  },
  {
    slug: "usta",
    name: "USTA",
    year: 2026,
    url: "https://usta.maximov-tech.ru",
    tier: 2,
    niches: ["сфера услуг", "маркетплейс услуг", "ремонт", "бытовые услуги", "services", "xizmatlar"],
    accent: "blue",
    category: {
      ru: "Маркетплейс мастеров",
      en: "Marketplace of professionals",
      uz: "Ustalar marketpleysi",
      zh: "工匠服务平台",
    },
    summary: {
      ru: "Аналог Profi.ru для Узбекистана: 99 услуг в 12 категориях, реалтайм-чат, вход через Telegram.",
      en: "A Profi.ru analogue for Uzbekistan: 99 services across 12 categories, realtime chat, Telegram sign-in.",
      uz: "O‘zbekiston uchun Profi.ru analogi: 12 toifada 99 xizmat, real vaqtdagi chat, Telegram orqali kirish.",
      zh: "面向乌兹别克斯坦的 Profi.ru 式平台：12 个类目下 99 项服务、实时聊天、Telegram 登录。",
    },
    description: {
      ru: "Клиент публикует задачу, подходящие мастера откликаются со своей ценой, клиент выбирает одного — открывается чат и раскрываются телефоны. Дальше договариваются напрямую: сервис бесплатный, комиссий нет. Каталог с фильтрами по городу, районам Ташкента, рейтингу и статусу «проверенный», профили мастеров с портфолио и отзывами, отдельные кабинеты для клиента и мастера. Интерфейс на трёх языках, вход по коду из Telegram-бота вместо SMS.",
      en: "A client posts a task, matching professionals respond with their own price, the client picks one — a chat opens and phone numbers are revealed. From there they arrange things directly: the service is free, there is no commission. A catalogue with filters by city, Tashkent districts, rating and verified status; professional profiles with portfolios and reviews; separate dashboards for clients and professionals. The interface runs in three languages, with sign-in by a code from a Telegram bot instead of SMS.",
      uz: "Mijoz vazifa e’lon qiladi, mos ustalar o‘z narxi bilan javob beradi, mijoz bittasini tanlaydi — chat ochiladi va telefonlar oshkor bo‘ladi. Keyin to‘g‘ridan-to‘g‘ri kelishadi: xizmat bepul, komissiya yo‘q. Shahar, Toshkent tumanlari, reyting va «tekshirilgan» maqomi bo‘yicha filtrli katalog, portfolio va sharhlar bilan usta profillari, mijoz va usta uchun alohida kabinetlar.",
      zh: "客户发布需求，匹配的师傅报出自己的价格，客户从中选定一位 —— 随即开启聊天并互相显示电话。之后双方直接沟通：平台完全免费，不收佣金。目录支持按城市、塔什干各区、评分与「已认证」状态筛选；师傅主页含作品集与评价；客户端与师傅端各有独立后台。界面支持三种语言，以 Telegram 机器人验证码替代短信登录。",
    },
    tech: ["React 19", "TypeScript", "Vite", "Tailwind CSS", "shadcn/ui", "Supabase"],
    metrics: [
      { value: "99", label: { ru: "услуг в 12 категориях", en: "services across 12 categories", uz: "12 toifadagi xizmat", zh: "12 个类目下的服务数" } },
      { value: "3", label: { ru: "языка интерфейса", en: "interface languages", uz: "interfeys tili", zh: "界面语言数" } },
      { value: "0%", label: { ru: "комиссия сервиса", en: "platform commission", uz: "xizmat komissiyasi", zh: "平台抽成" } },
    ],
  },
  {
    slug: "seller-ai",
    name: "Seller AI",
    year: 2026,
    tier: 1,
    niches: ["e-commerce", "маркетплейс", "ритейл", "SaaS", "аналитика", "电商", "savdo"],
    accent: "violet",
    category: {
      ru: "AI-продукт · SaaS",
      en: "AI product · SaaS",
      uz: "AI mahsulot · SaaS",
      zh: "AI 产品 · SaaS",
    },
    summary: {
      ru: "Шесть автономных AI-агентов, которые ведут карточки продавца на маркетплейсах вместо человека.",
      en: "Six autonomous AI agents running a seller's marketplace listings instead of a human.",
      uz: "Marketpleyslarda sotuvchi kartalarini inson o‘rniga yurituvchi oltita avtonom AI agent.",
      zh: "六个自主 AI 智能体，代替人工打理卖家在电商平台上的商品。",
    },
    description: {
      ru: "Коммерческий SaaS для продавцов на маркетплейсах. Шесть агентов закрывают разные участки: отзывы, контент карточек, ценообразование, конкуренты, реклама и логистика. Поверх них — движок юнит-экономики и аналитика MPstats. Продуманный онбординг: две недели триала, затем месяц ручного обучения агентов на реальных данных продавца, и только потом включается автопилот по каждому SKU. Архитектура — FastAPI, Celery с расписанием, Postgres и Redis в контейнерах.",
      en: "A commercial SaaS for marketplace sellers. Six agents cover distinct areas: reviews, listing content, pricing, competitors, ads and logistics. On top sits a unit-economics engine and MPstats analytics. Onboarding is deliberate: a two-week trial, then a month of training the agents by hand on the seller's real data, and only then per-SKU autopilot unlocks. The architecture is FastAPI, Celery with a beat schedule, Postgres and Redis in containers.",
      uz: "Marketpleys sotuvchilari uchun tijoriy SaaS. Oltita agent turli yo‘nalishlarni qamrab oladi: sharhlar, karta kontenti, narx belgilash, raqobatchilar, reklama va logistika. Ular ustida birlik iqtisodiyoti dvigateli va MPstats tahlili. Onboarding puxta o‘ylangan: ikki hafta sinov, so‘ng bir oy agentlarni sotuvchining haqiqiy ma’lumotlarida qo‘lda o‘qitish, faqat shundan keyin har bir SKU bo‘yicha avtopilot yoqiladi.",
      zh: "面向电商卖家的商业化 SaaS。六个智能体分别负责评价、商品文案、定价、竞品、广告与物流，其上叠加单品经济模型引擎与 MPstats 数据分析。上手流程经过精心设计：先两周试用，再用一个月在卖家真实数据上人工训练智能体，之后才逐个 SKU 解锁自动驾驶模式。技术架构为 FastAPI、带定时调度的 Celery，以及容器化的 Postgres 与 Redis。",
    },
    tech: ["Python", "FastAPI", "Celery", "PostgreSQL", "Redis", "LLM"],
    metrics: [
      { value: "6", label: { ru: "автономных агентов", en: "autonomous agents", uz: "avtonom agent", zh: "自主智能体数" } },
      { value: "14", label: { ru: "дней триала до оплаты", en: "trial days before payment", uz: "to‘lovgacha sinov kunlari", zh: "付费前试用天数" } },
      { value: "SKU", label: { ru: "автопилот включается поштучно", en: "autopilot unlocks per item", uz: "avtopilot donalab yoqiladi", zh: "按单品逐个启用自动化" } },
    ],
  },
  {
    slug: "lbm-rentals",
    name: "LBM Rentals",
    year: 2026,
    tier: 2,
    niches: ["недвижимость", "аренда", "туризм", "гостиничный бизнес", "HoReCa", "real estate", "ko‘chmas mulk"],
    accent: "gold",
    category: {
      ru: "Автоматизация аренды",
      en: "Rental automation",
      uz: "Ijarani avtomatlashtirish",
      zh: "租赁业务自动化",
    },
    summary: {
      ru: "Посуточная аренда в Ташкенте без участия хозяина: умные замки, платежи, турсбор и листок прибытия.",
      en: "Daily rentals in Tashkent with the owner out of the loop: smart locks, payments, tourist tax and arrival forms.",
      uz: "Toshkentda egasi ishtirokisiz sutkalik ijara: aqlli qulflar, to‘lovlar, turizm yig‘imi va kelish varaqasi.",
      zh: "塔什干的日租业务无需房东参与：智能门锁、支付、旅游税与入住登记表。",
    },
    description: {
      ru: "Сервис закрывает весь цикл посуточной аренды. Бронь, оплата через Octobank и Atmos, код от умного замка TTLock приходит гостю в Telegram — с запасным каналом на SMS через Eskiz, если мессенджера нет. Отдельно закрыта узбекская специфика: данные гостя и листок прибытия для E-mehmon, автоматический расчёт туристического сбора по БРВ за каждую ночь, учёт коммуналки и чистая прибыль в аналитике. Площадки подключаются самостоятельно по iCal-ссылке.",
      en: "The service covers the full daily-rental cycle. Booking, payment through Octobank and Atmos, and the TTLock smart-lock code delivered to the guest over Telegram — with an SMS fallback through Eskiz when there is no messenger. Uzbek specifics are handled separately: guest data and the arrival form for E-mehmon, automatic tourist-tax calculation from the base rate per night, utility-bill tracking and net profit in the analytics. Listing platforms connect self-service over an iCal link.",
      uz: "Xizmat sutkalik ijaraning to‘liq siklini qamrab oladi. Bron, Octobank va Atmos orqali to‘lov, TTLock aqlli qulfining kodi mehmonga Telegram orqali yetadi — messenjer bo‘lmasa, Eskiz orqali SMS zaxira kanali bilan. O‘zbek xususiyatlari alohida ishlangan: E-mehmon uchun mehmon ma’lumotlari va kelish varaqasi, har kecha uchun BHM bo‘yicha turizm yig‘imining avtomatik hisobi, kommunal to‘lovlar hisobi va tahlilda sof foyda.",
      zh: "该服务覆盖日租业务的完整链路。预订、通过 Octobank 与 Atmos 支付，TTLock 智能门锁的开锁码经 Telegram 发送给房客 —— 若对方未使用该通讯软件，则通过 Eskiz 短信作为备用通道。乌兹别克斯坦本地合规单独处理：面向 E-mehmon 的房客信息与入住登记表、按基准计量单位逐夜自动计算旅游税、水电物业费记账，以及分析面板中的净利润。房源平台可通过 iCal 链接自助接入。",
    },
    tech: ["FastAPI", "Next.js", "PostgreSQL", "Redis", "TTLock", "Telegram Gateway"],
    metrics: [
      { value: "24/7", label: { ru: "заселение без хозяина", en: "check-in without the owner", uz: "egasisiz joylashish", zh: "无需房东的入住" } },
      { value: "2", label: { ru: "платёжных шлюза", en: "payment gateways", uz: "to‘lov shlyuzi", zh: "接入的支付网关" } },
      { value: "E-mehmon", label: { ru: "отчётность закрыта автоматически", en: "reporting handled automatically", uz: "hisobot avtomatik yopiladi", zh: "申报流程自动完成" } },
    ],
  },
  {
    slug: "global-export",
    name: "Global Export",
    year: 2026,
    tier: 1,
    niches: ["экспорт", "производство", "сельское хозяйство", "B2B", "FMCG", "export", "eksport", "出口"],
    accent: "gold",
    category: {
      ru: "Корпоративный сайт",
      en: "Corporate website",
      uz: "Korporativ sayt",
      zh: "企业官网",
    },
    summary: {
      ru: "Мультиязычный сайт экспортёра сухофруктов и бобовых с собственной админкой.",
      en: "A multilingual site for an exporter of dried fruit and pulses, with a custom admin panel.",
      uz: "Quritilgan mevalar va dukkaklilar eksportchisi uchun o‘z admin paneliga ega ko‘p tilli sayt.",
      zh: "为干果与豆类出口商打造的多语言网站，配备自有后台。",
    },
    description: {
      ru: "Сайт для выхода на международных закупщиков: каталог продукции, новости с выставок, сертификаты и аудиты, география поставок. Весь контент правится менеджером через собственную админку на Supabase — от карточек товара до новостей и переводов. Никаких анимационных библиотек на клиенте: появление блоков сделано на IntersectionObserver и CSS, поэтому страницы остаются лёгкими даже на медленных соединениях.",
      en: "A site built to reach international buyers: a product catalogue, trade-show news, certificates and audits, delivery geography. All content is edited by a manager through a custom Supabase-backed admin panel — from product cards to news and translations. No animation libraries ship to the client: block reveals run on IntersectionObserver and CSS, so pages stay light even on slow connections.",
      uz: "Xalqaro xaridorlarga chiqish uchun sayt: mahsulot katalogi, ko‘rgazmalardan yangiliklar, sertifikatlar va auditlar, yetkazib berish geografiyasi. Butun kontentni menejer Supabase asosidagi o‘z admin paneli orqali tahrirlaydi. Mijozga hech qanday animatsiya kutubxonasi yuborilmaydi: bloklarning paydo bo‘lishi IntersectionObserver va CSS’da ishlaydi.",
      zh: "面向国际采购商的网站：产品目录、展会资讯、认证与审核记录、供货区域覆盖。全部内容由运营人员通过基于 Supabase 的自有后台维护 —— 从产品卡片到新闻与翻译。客户端不加载任何动画库：区块的出场效果基于 IntersectionObserver 与 CSS 实现，因此即使在慢速网络下页面依然轻量。",
    },
    tech: ["Next.js", "React", "Tailwind CSS", "Supabase", "TypeScript"],
    metrics: [
      { value: "4", label: { ru: "языка с hreflang-разметкой", en: "languages with hreflang markup", uz: "hreflang belgilangan til", zh: "带 hreflang 标注的语言" } },
      { value: "0", label: { ru: "КБ анимационных библиотек", en: "KB of animation libraries", uz: "KB animatsiya kutubxonasi", zh: "动画库体积（KB）" } },
    ],
  },
  {
    slug: "legal-ai",
    name: "Legal AI",
    year: 2026,
    tier: 1,
    niches: ["юридические услуги", "финансы", "консалтинг", "документооборот", "legal", "yuridik", "法律"],
    accent: "blue",
    category: {
      ru: "LLM + RAG",
      en: "LLM + RAG",
      uz: "LLM + RAG",
      zh: "LLM + RAG",
    },
    summary: {
      ru: "Поиск и разбор юридических документов, который отвечает со ссылкой на конкретный пункт договора.",
      en: "Legal document search and analysis that answers with a citation to the exact contract clause.",
      uz: "Shartnomaning aniq bandiga havola bilan javob beradigan yuridik hujjatlarni qidirish va tahlil qilish.",
      zh: "法律文书检索与解析，作答时直接引用合同中的具体条款。",
    },
    description: {
      ru: "Векторный индекс по корпусу договоров и нормативки поверх языковой модели. Ключевое требование заказчика было не «умно отвечать», а «никогда не выдумывать»: каждый ответ содержит ссылку на исходный фрагмент, и если релевантного фрагмента нет — система прямо говорит, что не нашла, вместо правдоподобного вымысла.",
      en: "A vector index over a corpus of contracts and regulations on top of a language model. The client's key requirement was not «answer cleverly» but «never invent»: every answer carries a citation to the source fragment, and when no relevant fragment exists the system says so plainly instead of producing a plausible fabrication.",
      uz: "Til modeli ustida shartnomalar va me’yoriy hujjatlar korpusi bo‘yicha vektor indeks. Buyurtmachining asosiy talabi «aqlli javob berish» emas, «hech qachon o‘ylab topmaslik» edi: har bir javobda manba parchasiga havola bor, mos parcha bo‘lmasa, tizim ishonarli uydirma o‘rniga topmaganini ochiq aytadi.",
      zh: "在语言模型之上，为合同与法规语料构建向量索引。客户的核心要求不是「回答得聪明」，而是「绝不编造」：每个答案都附带原文片段出处；若不存在相关片段，系统会明确说明未找到，而不是给出貌似合理的臆造内容。",
    },
    tech: ["Python", "pgvector", "PostgreSQL", "LLM", "RAG"],
    metrics: [
      { value: "0", label: { ru: "ответов без ссылки на источник", en: "answers without a source citation", uz: "manbasiz javoblar", zh: "无出处的答案数" } },
      { value: "~2s", label: { ru: "время ответа по корпусу", en: "response time over the corpus", uz: "korpus bo‘yicha javob vaqti", zh: "语料检索响应时间" } },
    ],
  },
  {
    slug: "marketplace-audit",
    name: "Marketplace Audit",
    year: 2026,
    tier: 1,
    niches: ["маркетплейс", "e-commerce", "ритейл", "логистика", "финтех", "enterprise"],
    accent: "violet",
    category: {
      ru: "Аудит и доработка",
      en: "Audit & remediation",
      uz: "Audit va takomillashtirish",
      zh: "系统审计与改造",
    },
    summary: {
      ru: "Архитектурный аудит маркетплейса из 35 микросервисов и план работ для команды из восьми человек.",
      en: "An architectural audit of a 35-microservice marketplace and a work plan for a team of eight.",
      uz: "35 mikroservisdan iborat marketpleysning arxitektura auditi va sakkiz kishilik jamoa uchun ish rejasi.",
      zh: "对包含 35 个微服务的电商平台进行架构审计，并为八人团队制定工作计划。",
    },
    description: {
      ru: "Заказчик пришёл с работающей, но тяжёлой платформой: тридцать пять сервисов на Java и Spring Boot с оркестрацией процессов на Camunda, несколько фронтендов, боты, генератор чеков, интеграции с фискализацией и банком. Мы провели архитектурный аудит, оценили качество кода по каждому сервису, составили построчные сводки и план работ на месяц для команды доработки из восьми человек. Отдельным пунктом — план ротации секретов, захардкоженных в коде.",
      en: "The client arrived with a working but heavy platform: thirty-five Java and Spring Boot services with process orchestration on Camunda, several frontends, bots, a receipt generator, and integrations with fiscalisation and a bank. We ran an architectural audit, assessed code quality service by service, produced line-level summaries and a one-month work plan for the eight-person remediation team. A separate item covered rotating the secrets hardcoded in the codebase.",
      uz: "Buyurtmachi ishlayotgan, ammo og‘ir platforma bilan keldi: Camunda’da jarayon orkestratsiyasi bilan Java va Spring Boot’dagi o‘ttiz beshta servis, bir nechta frontend, botlar, chek generatori, fiskalizatsiya va bank bilan integratsiyalar. Biz arxitektura auditini o‘tkazdik, har bir servis bo‘yicha kod sifatini baholadik, sakkiz kishilik jamoa uchun bir oylik ish rejasini tuzdik.",
      zh: "客户带着一套能跑但沉重的平台前来：三十五个基于 Java 与 Spring Boot 的服务、以 Camunda 编排业务流程，另有多个前端、机器人、票据生成器，以及与税控系统和银行的对接。我们完成了架构审计，逐个服务评估代码质量，输出了细化到行的总结报告，并为八人改造团队制定了为期一个月的工作计划。其中单列一项，是对硬编码在代码中的密钥进行轮换的方案。",
    },
    tech: ["Java 17", "Spring Boot", "Camunda BPM", "NestJS", "React", "PostgreSQL"],
    metrics: [
      { value: "35", label: { ru: "сервисов в аудите", en: "services audited", uz: "auditdagi servislar", zh: "受审计的服务数" } },
      { value: "8", label: { ru: "человек в команде доработки", en: "people on the remediation team", uz: "takomillashtirish jamoasidagi odamlar", zh: "改造团队人数" } },
    ],
  },
];

export function caseBySlug(slug: string): Case | undefined {
  return cases.find((c) => c.slug === slug);
}
