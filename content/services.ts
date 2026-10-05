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
  /**
   * Коротко, что входит, — на карточке главной вместо стека. Для услуг, где
   * стек ничего не говорит: у тендеров «ГОСТ 34» на карточке объяснил бы
   * меньше, чем «составим ТЗ и требования к подрядчикам».
   */
  highlights?: LocalizedList;
  /**
   * От чего зависит цена — на странице услуги под вилкой «от». Для услуг, где
   * «от» одной цифрой вводит в заблуждение: ТЗ на сайт госоргана и на систему
   * документооборота с десятком интеграций стоят по-разному.
   */
  priceFactors?: LocalizedList;
};

export const services: Service[] = [
  {
    slug: "web-development",
    seoTitle: {
      ru: "Разработка сайтов в Ташкенте: цены и сроки — DevUz",
      en: "Website Development in Tashkent: Pricing — DevUz",
      uz: "Toshkentda sayt yaratish xizmati va narxi — DevUz",
      zh: "塔什干网站开发：价格与周期 — DevUz",
      uk: "Розробка сайтів у Ташкенті: ціни та терміни — DevUz",
      pl: "Tworzenie stron w Taszkencie: ceny i terminy — DevUz",
    },
    seoDescription: {
      ru: "Корпоративные сайты, лендинги и каталоги под ключ. Четыре языка, своя админка, техническое SEO. Лендинг от $500, корпоративный сайт от $2500, срок 1–8 недель — точную цену считаем по задаче.",
      en: "Corporate sites, landing pages and catalogues, turnkey. Four languages, a custom admin panel, technical SEO. Landing pages from $500, corporate sites from $2,500, 1–8 weeks — exact quote after scoping.",
      uz: "Korporativ saytlar, lendinglar va kataloglar — kalit topshirish sharti bilan. To‘rt til, o‘z admin paneli, texnik SEO. Lending $500 dan, korporativ sayt $2500 dan, 1–8 hafta.",
      zh: "企业官网、落地页与产品目录，交钥匙交付。四种语言、自有后台、技术 SEO。落地页 500 美元起，企业官网 2500 美元起，周期 1–8 周。",
      uk: "Корпоративні сайти, лендинги й каталоги під ключ. Чотири мови, власна адмінка, технічне SEO. Лендинг від $500, корпоративний сайт від $2500, 1–8 тижнів — точну ціну рахуємо під задачу.",
      pl: "Strony firmowe, landing page i katalogi pod klucz. Cztery języki, własny panel, techniczne SEO. Landing page od $500, strona firmowa od $2500, 1–8 tygodni — dokładną cenę liczymy pod zadanie.",
    },
    icon: "globe",
    title: {
      ru: "Сайты и порталы",
      en: "Websites & portals",
      uz: "Saytlar va portallar",
      zh: "网站与门户",
      uk: "Сайти та портали",
      pl: "Strony i portale",
    },
    tagline: {
      ru: "Корпоративные сайты, лендинги, каталоги",
      en: "Corporate sites, landing pages, catalogues",
      uz: "Korporativ saytlar, lendinglar, kataloglar",
      zh: "企业官网、落地页、产品目录",
      uk: "Корпоративні сайти, лендинги, каталоги",
      pl: "Strony firmowe, landing page, katalogi",
    },
    description: {
      ru: "Собираем сайты, которые находятся в поиске и продают. Мультиязычность с первого дня, своя админка, серверный рендеринг и техническое SEO — не «потом допилим», а часть архитектуры.",
      en: "We build sites that get found and sell. Multilingual from day one, a custom admin panel, server-side rendering and technical SEO — part of the architecture, not an afterthought.",
      uz: "Qidiruvda topiladigan va sotadigan saytlar quramiz. Birinchi kundan ko‘p tillilik, o‘z admin paneli, server tomonida render va texnik SEO — keyin qo‘shiladigan narsa emas, arxitekturaning bir qismi.",
      zh: "我们打造能被搜索到、能带来订单的网站。从第一天起支持多语言，配备自有后台管理、服务端渲染与技术 SEO —— 它们是架构的一部分，而非事后补丁。",
      uk: "Робимо сайти, які знаходять у пошуку і які продають. Мультимовність із першого дня, власна адмінка, серверний рендеринг і технічне SEO — не «потім доробимо», а частина архітектури.",
      pl: "Budujemy strony, które widać w wyszukiwarce i które sprzedają. Wielojęzyczność od pierwszego dnia, własny panel administracyjny, renderowanie po stronie serwera i techniczne SEO — nie „dopracujemy później”, tylko część architektury.",
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
      uk: [
        "Чотири мови та hreflang-розмітка з коробки",
        "Адмінка, де контент редагує менеджер, а не розробник",
        "Core Web Vitals у зеленій зоні на реальних телефонах",
        "Розмітка Schema.org, sitemap, IndexNow для Google і Яндекса",
      ],
      pl: [
        "Cztery języki i znaczniki hreflang od razu w standardzie",
        "Panel, w którym treści edytuje menedżer, a nie programista",
        "Core Web Vitals w zielonej strefie na prawdziwych telefonach",
        "Znaczniki Schema.org, sitemap, IndexNow dla Google i Yandex",
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
      uk: "Розробка мобільних застосунків у Ташкенті — DevUz",
      pl: "Tworzenie aplikacji mobilnych w Taszkencie — DevUz",
    },
    seoDescription: {
      ru: "Приложения для iOS и Android на одной кодовой базе: Flutter, пуши, карты, онлайн-оплата. Публикуем в App Store и Google Play. Срок 6–14 недель.",
      en: "iOS and Android apps from a single codebase: Flutter, push, maps, online payments. We ship to the App Store and Google Play. 6–14 weeks.",
      uz: "iOS va Android uchun bitta kod bazasidan ilovalar: Flutter, push, xaritalar, onlayn to‘lov. App Store va Google Play’ga chiqaramiz. 6–14 hafta.",
      zh: "一套代码同时覆盖 iOS 与 Android：Flutter、推送、地图、在线支付。我们负责上架 App Store 与 Google Play，周期 6–14 周。",
      uk: "Застосунки для iOS і Android на одній кодовій базі: Flutter, пуші, карти, онлайн-оплата. Публікуємо в App Store і Google Play. Термін 6–14 тижнів.",
      pl: "Aplikacje na iOS i Androida z jednej bazy kodu: Flutter, powiadomienia push, mapy, płatności online. Publikujemy w App Store i Google Play. Termin 6–14 tygodni.",
    },
    icon: "phone",
    title: {
      ru: "Мобильные приложения",
      en: "Mobile apps",
      uz: "Mobil ilovalar",
      zh: "移动应用",
      uk: "Мобільні застосунки",
      pl: "Aplikacje mobilne",
    },
    tagline: {
      ru: "iOS и Android из одной кодовой базы",
      en: "iOS and Android from a single codebase",
      uz: "Bitta kod bazasidan iOS va Android",
      zh: "一套代码同时覆盖 iOS 与 Android",
      uk: "iOS і Android з однієї кодової бази",
      pl: "iOS i Android z jednej bazy kodu",
    },
    description: {
      ru: "Flutter там, где нужна скорость и одинаковый интерфейс на обеих платформах. Пуши, карты, платежи, офлайн-режим и вход через Telegram — без SMS и паролей, как привыкли пользователи в Узбекистане.",
      en: "Flutter where you need speed and a consistent interface on both platforms. Push, maps, payments, offline mode and Telegram sign-in — no SMS, no passwords, the way users in Uzbekistan expect.",
      uz: "Tezlik va ikkala platformada bir xil interfeys kerak bo‘lganda — Flutter. Push, xaritalar, to‘lovlar, oflayn rejim va Telegram orqali kirish — SMS va parolsiz, O‘zbekistondagi foydalanuvchilar odatlanganidek.",
      zh: "在需要快速交付、双端界面一致时选用 Flutter。推送、地图、支付、离线模式，以及通过 Telegram 登录 —— 无需短信与密码，符合乌兹别克斯坦用户的使用习惯。",
      uk: "Flutter там, де потрібні швидкість і однаковий інтерфейс на обох платформах. Пуші, карти, платежі, офлайн-режим і вхід через Telegram — без SMS і паролів, як звикли користувачі в Узбекистані.",
      pl: "Flutter tam, gdzie liczy się szybkość i identyczny interfejs na obu platformach. Push, mapy, płatności, tryb offline i logowanie przez Telegram — bez SMS-ów i haseł, tak jak przywykli użytkownicy w Uzbekistanie.",
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
      uk: [
        "Один застосунок — кілька ролей: клієнт, кур'єр, партнер",
        "Вхід через Telegram-бот замість SMS-кодів",
        "Онлайн-трекінг на карті та push-сповіщення",
        "Публікація в App Store і Google Play під ключ",
      ],
      pl: [
        "Jedna aplikacja — kilka ról: klient, kurier, partner",
        "Logowanie przez bota Telegram zamiast kodów SMS",
        "Śledzenie na mapie na żywo i powiadomienia push",
        "Publikacja w App Store i Google Play pod klucz",
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
      uk: "Впровадження ШІ в бізнес під ключ — Ташкент | DevUz",
      pl: "Wdrożenie AI w firmie pod klucz — Taszkent | DevUz",
    },
    seoDescription: {
      ru: "AI-ассистенты, поиск по базе знаний на RAG, квалификация лидов и автоответы. Считаем стоимость и окупаемость до старта, а не после.",
      en: "AI assistants, RAG search over your knowledge base, lead qualification and auto-replies. We size cost and payback before the start, not after.",
      uz: "AI-yordamchilar, RAG asosida bilimlar bazasi bo‘yicha qidiruv, lidlarni saralash va avtojavoblar. Narx va qoplanishni boshlashdan oldin hisoblaymiz.",
      zh: "AI 助手、基于 RAG 的知识库检索、线索甄别与自动回复。成本与回报在启动前算清，而不是事后。",
      uk: "AI-асистенти, пошук по базі знань на RAG, кваліфікація лідів і автовідповіді. Рахуємо вартість і окупність до старту, а не після.",
      pl: "Asystenci AI, wyszukiwanie w bazie wiedzy oparte na RAG, ocena leadów i automatyczne odpowiedzi. Koszt i zwrot z inwestycji liczymy przed startem, nie po nim.",
    },
    icon: "brain",
    title: {
      ru: "LLM, RAG и AI-агенты",
      en: "LLM, RAG & AI agents",
      uz: "LLM, RAG va AI agentlar",
      zh: "LLM、RAG 与 AI 智能体",
      uk: "LLM, RAG і AI-агенти",
      pl: "LLM, RAG i agenci AI",
    },
    tagline: {
      ru: "Ассистенты, которые отвечают по вашим данным",
      en: "Assistants that answer from your own data",
      uz: "Sizning ma’lumotlaringiz asosida javob beradigan yordamchilar",
      zh: "基于你自己数据作答的智能助手",
      uk: "Асистенти, які відповідають за вашими даними",
      pl: "Asystenci, którzy odpowiadają na podstawie Twoich danych",
    },
    description: {
      ru: "Поиск по внутренним документам с ссылкой на конкретный пункт, автоматизация первой линии продаж и поддержки, агенты, которые сами выполняют рутину. Строим на кастомной LLM-сборке и открытых моделях, с векторным индексом в вашей же базе.",
      en: "Search across internal documents with a citation to the exact clause, automation of first-line sales and support, agents that handle routine work on their own. Built on a custom LLM setup and open models, with the vector index inside your own database.",
      uz: "Ichki hujjatlar bo‘ylab aniq bandga havola bilan qidiruv, sotuv va qo‘llab-quvvatlashning birinchi liniyasini avtomatlashtirish, rutinani o‘zi bajaradigan agentlar. Maxsus LLM yig‘masi va ochiq modellar asosida, vektor indeks sizning bazangizda.",
      zh: "在内部文档中检索并给出确切条款出处，自动化销售与客服的第一道防线，让智能体自主处理日常事务。基于定制 LLM 方案与开源模型构建，向量索引就存放在你自己的数据库中。",
      uk: "Пошук у внутрішніх документах із посиланням на конкретний пункт, автоматизація першої лінії продажів і підтримки, агенти, які самі виконують рутину. Будуємо на кастомній LLM-збірці та відкритих моделях, з векторним індексом у вашій же базі.",
      pl: "Wyszukiwanie w wewnętrznych dokumentach z odwołaniem do konkretnego punktu, automatyzacja pierwszej linii sprzedaży i wsparcia, agenci, którzy sami wykonują rutynowe zadania. Budujemy na własnej konfiguracji LLM i modelach otwartych, z indeksem wektorowym w Twojej własnej bazie danych.",
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
      uk: [
        "RAG-пошук із посиланням на джерело — без вигаданих відповідей",
        "Кваліфікація лідів за ICP і BANT просто в чаті на сайті",
        "Автономні агенти для відгуків, цін і контенту",
        "Ваші дані залишаються у вашому контурі",
      ],
      pl: [
        "Wyszukiwanie RAG ze wskazaniem źródła — bez zmyślonych odpowiedzi",
        "Ocena leadów według ICP i BANT bezpośrednio w czacie na stronie",
        "Autonomiczni agenci do opinii, cen i treści",
        "Twoje dane zostają w Twojej infrastrukturze",
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
      uk: "Розробка маркетплейсу під ключ у Ташкенті — DevUz",
      pl: "Tworzenie marketplace’u pod klucz w Taszkencie — DevUz",
    },
    seoDescription: {
      ru: "Маркетплейсы, интернет-магазины и сервисы доставки: кабинет продавца, приложение курьера, трекинг на карте, интеграция с кассами и платежами.",
      en: "Marketplaces, online stores and delivery services: a seller dashboard, a courier app, live map tracking, POS and payment integrations.",
      uz: "Marketpleyslar, internet-do‘konlar va yetkazib berish servislari: sotuvchi kabineti, kuryer ilovasi, xaritada kuzatuv, kassa va to‘lov integratsiyasi.",
      zh: "电商平台、网店与配送服务：商家后台、骑手 App、地图实时追踪、收银与支付系统对接。",
      uk: "Маркетплейси, інтернет-магазини й сервіси доставки: кабінет продавця, застосунок кур'єра, трекінг на карті, інтеграція з касами та платежами.",
      pl: "Marketplace’y, sklepy internetowe i serwisy dostaw: panel sprzedawcy, aplikacja kuriera, śledzenie na mapie, integracja z kasami i płatnościami.",
    },
    icon: "cart",
    title: {
      ru: "Маркетплейсы и доставка",
      en: "Marketplaces & delivery",
      uz: "Marketpleyslar va yetkazib berish",
      zh: "电商平台与配送",
      uk: "Маркетплейси та доставка",
      pl: "Marketplace’y i dostawy",
    },
    tagline: {
      ru: "Мультиролевые платформы с реальной логистикой",
      en: "Multi-role platforms with real logistics",
      uz: "Haqiqiy logistikaga ega ko‘p rolli platformalar",
      zh: "具备真实物流能力的多角色平台",
      uk: "Багаторольові платформи з реальною логістикою",
      pl: "Platformy wielorolowe z prawdziwą logistyką",
    },
    description: {
      ru: "Самый тяжёлый класс задач, который мы берём: каталог, корзина, оплата, склад, курьеры и партнёрские интеграции в одном продукте. Синхронизация меню с iiko, Poster и 1С, возврат заказов партнёру по webhook с подписью.",
      en: "The heaviest class of work we take on: catalogue, cart, payments, warehouse, couriers and partner integrations in a single product. Menu sync with iiko, Poster and 1C, orders returned to the partner over a signed webhook.",
      uz: "Biz oladigan eng og‘ir sinf vazifalar: katalog, savat, to‘lov, ombor, kuryerlar va hamkor integratsiyalari bitta mahsulotda. iiko, Poster va 1C bilan menyu sinxronizatsiyasi, buyurtmalar imzolangan webhook orqali hamkorga qaytariladi.",
      zh: "我们承接的最复杂一类项目：商品目录、购物车、支付、仓储、骑手与合作方对接集成于一个产品之中。与 iiko、Poster、1C 同步菜单，通过带签名的 webhook 将订单回传给合作方。",
      uk: "Найважчий клас задач, за який ми беремося: каталог, кошик, оплата, склад, кур'єри та партнерські інтеграції в одному продукті. Синхронізація меню з iiko, Poster і 1С, повернення замовлень партнеру через webhook із підписом.",
      pl: "Najcięższa klasa zadań, jakich się podejmujemy: katalog, koszyk, płatność, magazyn, kurierzy i integracje partnerskie w jednym produkcie. Synchronizacja menu z iiko, Poster i 1C, zwrot zamówień do partnera przez podpisany webhook.",
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
      uk: [
        "Ролі покупця, кур'єра й партнера в одному застосунку",
        "Інтеграції з POS: iiko, Poster, 1С, довільний REST",
        "Онлайн-статуси замовлень і черги задач на BullMQ",
        "Готовність до мережі із сотні точок, а не до однієї кав'ярні",
      ],
      pl: [
        "Role kupującego, kuriera i partnera w jednej aplikacji",
        "Integracje z POS: iiko, Poster, 1C, dowolne REST API",
        "Statusy zamówień na żywo i kolejki zadań w BullMQ",
        "Gotowość na sieć stu punktów, a nie na jedną kawiarnię",
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
      uk: "Автоматизація бізнес-процесів у Ташкенті — DevUz",
      pl: "Automatyzacja procesów biznesowych w Taszkencie — DevUz",
    },
    seoDescription: {
      ru: "Связываем 1С, CRM, кассы, платёжные шлюзы и Telegram в один рабочий контур. Убираем ручной перенос данных между системами.",
      en: "We wire 1C, CRM, POS, payment gateways and Telegram into one working loop, removing manual data transfer between systems.",
      uz: "1C, CRM, kassalar, to‘lov shlyuzlari va Telegram’ni yagona ish konturiga bog‘laymiz. Tizimlar orasida qo‘lda ma’lumot ko‘chirishni yo‘q qilamiz.",
      zh: "把 1C、CRM、收银、支付网关与 Telegram 接入同一条工作链路，取消系统间的手工搬运数据。",
      uk: "Поєднуємо 1С, CRM, каси, платіжні шлюзи й Telegram в один робочий контур. Прибираємо ручне перенесення даних між системами.",
      pl: "Łączymy 1C, CRM, kasy, bramki płatności i Telegram w jeden spójny obieg pracy. Koniec z ręcznym przepisywaniem danych między systemami.",
    },
    icon: "plug",
    title: {
      ru: "Интеграции и автоматизация",
      en: "Integrations & automation",
      uz: "Integratsiyalar va avtomatlashtirish",
      zh: "系统集成与自动化",
      uk: "Інтеграції та автоматизація",
      pl: "Integracje i automatyzacja",
    },
    tagline: {
      ru: "Связываем то, что у вас уже работает",
      en: "Connecting what you already run",
      uz: "Sizda allaqachon ishlayotgan narsalarni bog‘laymiz",
      zh: "把你已有的系统连接起来",
      uk: "Поєднуємо те, що у вас уже працює",
      pl: "Łączymy to, co już u Ciebie działa",
    },
    description: {
      ru: "Платёжные шлюзы, SMS и Telegram-рассылки, CRM, 1С, умные замки, фискализация. Мы часто заходим этим сервисом, а остаёмся на большом проекте — потому что после интеграций видно, где у бизнеса действительно болит.",
      en: "Payment gateways, SMS and Telegram messaging, CRM, 1C, smart locks, fiscalisation. We often start here and stay for the bigger project — once the integrations are in, it becomes obvious where the business actually hurts.",
      uz: "To‘lov shlyuzlari, SMS va Telegram tarqatmalari, CRM, 1C, aqlli qulflar, fiskalizatsiya. Ko‘pincha shu xizmat bilan kiramiz va katta loyihada qolamiz — integratsiyalardan keyin biznesning qayeri chinakam og‘rishi ko‘rinadi.",
      zh: "支付网关、短信与 Telegram 通知、CRM、1C、智能门锁、税务开票。我们常以此切入，随后承接更大的项目 —— 因为集成完成后，业务真正的痛点就一目了然了。",
      uk: "Платіжні шлюзи, SMS- і Telegram-розсилки, CRM, 1С, розумні замки, фіскалізація. Ми часто приходимо з цією послугою, а залишаємося на великому проєкті — бо після інтеграцій видно, де в бізнесу справді болить.",
      pl: "Bramki płatności, wysyłki SMS i w Telegramie, CRM, 1C, inteligentne zamki, fiskalizacja. Często zaczynamy współpracę od tej usługi, a zostajemy przy dużym projekcie — bo po integracjach widać, gdzie firmę naprawdę boli.",
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
      uk: [
        "Платежі: Octobank, Atmos, Payme, Click",
        "Сповіщення: Telegram Gateway, Eskiz SMS",
        "Облік: 1С, iiko, Poster, довільний REST",
        "Обладнання: розумні замки TTLock, фіскальні реєстратори",
      ],
      pl: [
        "Płatności: Octobank, Atmos, Payme, Click",
        "Powiadomienia: Telegram Gateway, Eskiz SMS",
        "Księgowość: 1C, iiko, Poster, dowolne REST API",
        "Sprzęt: inteligentne zamki TTLock, kasy fiskalne",
      ],
    },
    tech: ["Node.js", "Python", "REST", "Webhooks", "HMAC"],
    priceFromUsd: 1500,
    weeksFrom: 1,
    weeksTo: 6,
  },
  {
    slug: "it-tenders",
    seoTitle: {
      ru: "IT-тендеры и госзакупки: ТЗ и субподряд — DevUz",
      en: "IT Tenders & Public Procurement: Specs and Subcontracting — DevUz",
      uz: "IT-tenderlar va davlat xaridlari: texnik topshiriq va subpudrat — DevUz",
      zh: "IT 招标与政府采购：技术规格书与分包 — DevUz",
      uk: "IT-тендери та держзакупівлі: ТЗ і субпідряд — DevUz",
      pl: "Przetargi IT: specyfikacja i podwykonawstwo — DevUz",
    },
    seoDescription: {
      ru: "Составим техническое задание и требования к подрядчикам для IT-тендера, проверим ТЗ перед подачей заявки, выполним разработку на субподряде. Госзакупки и корпоративные тендеры в Узбекистане.",
      en: "We write technical specifications and contractor requirements for IT tenders, review specs before you bid, and deliver development as a subcontractor. Public procurement and corporate tenders in Uzbekistan.",
      uz: "IT-tender uchun texnik topshiriq va pudratchilarga talablarni tuzamiz, ariza topshirishdan oldin texnik topshiriqni tekshiramiz, ishlab chiqishni subpudratda bajaramiz. O‘zbekistonda davlat xaridlari va korporativ tenderlar.",
      zh: "为 IT 招标编写技术规格书和承包商要求，投标前审查规格书，并以分包形式完成开发。覆盖乌兹别克斯坦的政府采购与企业招标。",
      uk: "Складемо технічне завдання й вимоги до підрядників для IT-тендеру, перевіримо ТЗ перед поданням заявки, виконаємо розробку на субпідряді. Держзакупівлі та корпоративні тендери в Узбекистані.",
      pl: "Przygotujemy specyfikację i wymagania wobec wykonawców do przetargu IT, sprawdzimy ją przed złożeniem oferty, wykonamy prace jako podwykonawca. Zamówienia publiczne i przetargi firmowe w Uzbekistanie.",
    },
    icon: "clipboard",
    title: {
      ru: "Тендеры и госконтракты",
      en: "Tenders & public contracts",
      uz: "Tenderlar va davlat shartnomalari",
      zh: "招标与政府合同",
      uk: "Тендери та держконтракти",
      pl: "Przetargi i zamówienia publiczne",
    },
    tagline: {
      ru: "ТЗ и требования к подрядчикам, субподряд на IT-тендерах",
      en: "Specs and contractor requirements, subcontracting on IT tenders",
      uz: "Texnik topshiriq va pudratchilarga talablar, IT-tenderlarda subpudrat",
      zh: "技术规格书与承包商要求，IT 招标分包",
      uk: "ТЗ і вимоги до підрядників, субпідряд на IT-тендерах",
      pl: "Specyfikacja i wymagania wobec wykonawców, podwykonawstwo w przetargach IT",
    },
    description: {
      ru: "Работаем с тендерами с двух сторон. Заказчику — госоргану или крупной компании — составляем техническое задание и требования к подрядчикам, считаем реальную стоимость и помогаем принять работу. Генподрядчику, который выиграл IT-тендер, становимся технической командой на субподряде: от разбора ТЗ до сдачи по этапам контракта.",
      en: "We work with tenders from both sides. For the client — a public body or a large company — we write the technical specification and contractor requirements, estimate the real cost and help accept the work. For a prime contractor that has won an IT tender, we become the technical team on a subcontract: from reviewing the spec to delivery by contract stages.",
      uz: "Tenderlar bilan ikki tomondan ishlaymiz. Buyurtmachiga — davlat tashkiloti yoki yirik kompaniyaga — texnik topshiriq va pudratchilarga talablarni tuzamiz, haqiqiy qiymatni hisoblaymiz va ishni qabul qilishga yordam beramiz. IT-tenderni yutgan bosh pudratchiga esa subpudratdagi texnik jamoa bo‘lamiz: texnik topshiriqni tahlil qilishdan shartnoma bosqichlari bo‘yicha topshirishgacha.",
      zh: "我们从两端参与招标。对招标方——政府机构或大型企业——我们编写技术规格书和承包商要求，测算真实成本并协助验收。对中标 IT 项目的总包方，我们作为分包技术团队，从分析规格书到按合同阶段交付。",
      uk: "Працюємо з тендерами з обох боків. Замовнику — держоргану чи великій компанії — складаємо технічне завдання й вимоги до підрядників, рахуємо реальну вартість і допомагаємо прийняти роботу. Генпідрядникові, який виграв IT-тендер, стаємо технічною командою на субпідряді: від розбору ТЗ до здачі за етапами контракту.",
      pl: "Pracujemy przy przetargach po obu stronach. Zamawiającemu — instytucji publicznej lub dużej firmie — przygotowujemy specyfikację techniczną i wymagania wobec wykonawców, wyceniamy realny koszt i pomagamy odebrać prace. Generalnemu wykonawcy, który wygrał przetarg IT, służymy jako zespół techniczny w ramach podwykonawstwa: od analizy specyfikacji po odbiór kolejnych etapów kontraktu.",
    },
    bullets: {
      ru: [
        "Техническое задание по ГОСТ 34 или по форме заказчика и требования к подрядчикам — без размытых формулировок, о которых потом спорят на приёмке",
        "Оценка стоимости и сроков для начальной цены контракта — на реальных трудозатратах, а не на глаз",
        "Экспертиза чужого ТЗ до подачи заявки: риски, дыры, то, что не уложится в срок",
        "Субподряд для генподрядчика: сайты, порталы, приложения и интеграции по ТЗ",
        "Документация к сдаче: руководства пользователя и администратора, программа и методика испытаний",
        "Технадзор и приёмка работ подрядчика по этапам — на стороне заказчика",
      ],
      en: [
        "Technical specification to GOST 34 or the client's template, plus contractor requirements — no vague wording to argue over at acceptance",
        "Cost and timeline estimate for the contract's starting price — based on real effort, not guesswork",
        "Review of someone else's spec before the bid: risks, gaps, what won't fit the deadline",
        "Subcontracting for the prime contractor: websites, portals, apps and integrations built to spec",
        "Handover documentation: user and admin guides, test programme and methodology",
        "Supervision and stage-by-stage acceptance of the contractor's work — on the client's side",
      ],
      uz: [
        "GOST 34 yoki buyurtmachi shakli bo‘yicha texnik topshiriq va pudratchilarga talablar — qabulda bahsga sabab bo‘ladigan noaniq so‘zlarsiz",
        "Shartnoma boshlang‘ich narxi uchun qiymat va muddat bahosi — taxminan emas, haqiqiy mehnat sarfi asosida",
        "Ariza topshirishdan oldin boshqa birovning texnik topshirig‘i ekspertizasi: xavflar, bo‘shliqlar, muddatga sig‘maydigan narsalar",
        "Bosh pudratchi uchun subpudrat: texnik topshiriq bo‘yicha saytlar, portallar, ilovalar va integratsiyalar",
        "Topshirish uchun hujjatlar: foydalanuvchi va administrator qo‘llanmalari, sinov dasturi va metodikasi",
        "Buyurtmachi tomonida pudratchi ishini bosqichma-bosqich texnik nazorat qilish va qabul qilish",
      ],
      zh: [
        "按 GOST 34 或招标方模板编写技术规格书和承包商要求——避免验收时引发争议的模糊表述",
        "为合同起始价估算成本和工期——基于真实工作量，而非拍脑袋",
        "投标前审查他人的技术规格书：风险、漏洞、无法按期完成的部分",
        "为总包方做分包：按规格书开发网站、门户、应用和系统对接",
        "交付文档：用户和管理员手册、测试大纲与方法",
        "代表招标方对承包商的工作进行技术监督和分阶段验收",
      ],
      uk: [
        "Технічне завдання за ГОСТ 34 або за формою замовника та вимоги до підрядників — без розмитих формулювань, про які потім сперечаються під час приймання",
        "Оцінка вартості й термінів для початкової ціни контракту — на реальних трудовитратах, а не на око",
        "Експертиза чужого ТЗ до подання заявки: ризики, прогалини, те, що не вкладеться в термін",
        "Субпідряд для генпідрядника: сайти, портали, застосунки та інтеграції за ТЗ",
        "Документація до здачі: посібники користувача й адміністратора, програма та методика випробувань",
        "Технагляд і приймання робіт підрядника за етапами — на боці замовника",
      ],
      pl: [
        "Specyfikacja techniczna według GOST 34 lub wzoru zamawiającego oraz wymagania wobec wykonawców — bez mglistych sformułowań, o które potem spiera się przy odbiorze",
        "Szacowanie kosztów i terminów na potrzeby ceny wyjściowej kontraktu — na podstawie realnej pracochłonności, a nie na oko",
        "Ekspertyza cudzej specyfikacji przed złożeniem oferty: ryzyka, luki i to, czego nie da się zrobić w terminie",
        "Podwykonawstwo dla generalnego wykonawcy: strony, portale, aplikacje i integracje według specyfikacji",
        "Dokumentacja do odbioru: instrukcje użytkownika i administratora, program i metodyka testów",
        "Nadzór techniczny i odbiór prac wykonawcy etapami — po stronie zamawiającego",
      ],
    },
    highlights: {
      ru: [
        "Составление ТЗ и требований к подрядчикам",
        "Экспертиза ТЗ и оценка до подачи заявки",
        "Субподряд на IT-тендерах",
        "Приёмка и технадзор за подрядчиком",
      ],
      en: [
        "Technical specs and contractor requirements",
        "Spec review and estimate before the bid",
        "Subcontracting on IT tenders",
        "Acceptance and supervision of contractors",
      ],
      uz: [
        "Texnik topshiriq va pudratchilarga talablar",
        "Ariza oldidan ekspertiza va baho",
        "IT-tenderlarda subpudrat",
        "Pudratchi ishini qabul qilish va nazorat",
      ],
      zh: [
        "技术规格书与承包商要求",
        "投标前规格书审查与估算",
        "IT 招标分包",
        "承包商工作验收与监督",
      ],
      uk: [
        "Складання ТЗ і вимог до підрядників",
        "Експертиза ТЗ та оцінка до подання заявки",
        "Субпідряд на IT-тендерах",
        "Приймання й технагляд за підрядником",
      ],
      pl: [
        "Przygotowanie specyfikacji i wymagań wobec wykonawców",
        "Ekspertyza specyfikacji i wycena przed złożeniem oferty",
        "Podwykonawstwo w przetargach IT",
        "Odbiór prac i nadzór techniczny nad wykonawcą",
      ],
    },
    tech: ["ГОСТ 34", "BPMN 2.0", "UML", "OpenAPI"],
    // Владелец, 28.09: «составление ТЗ от 400 $, в зависимости от сложности
    // проекта, архитектуры, языков программирования и т. д.». Субподряд
    // считается по объёму тендера, как обычный проект.
    priceFromUsd: 400,
    weeksFrom: 1,
    weeksTo: 4,
    priceFactors: {
      ru: [
        "Сложность и объём системы: сколько ролей, экранов и бизнес-процессов нужно описать",
        "Архитектура: одно приложение или несколько сервисов, облако или сервер заказчика, требования к нагрузке и отказоустойчивости",
        "Языки программирования и стек — если заказчик их задаёт или система должна жить рядом с тем, что уже работает",
        "Интеграции с внешними системами: госсервисы, 1С, банки, платёжные шлюзы — сколько их и насколько они описаны",
        "Требования к безопасности и персональным данным",
        "Языки интерфейса и документации: узбекский, русский, английский",
        "Оформление и состав документов: ГОСТ 34 или форма заказчика, нужны ли программа и методика испытаний, руководства",
        "Срок: срочное ТЗ стоит дороже",
      ],
      en: [
        "Complexity and scope of the system: how many roles, screens and business processes need describing",
        "Architecture: one application or several services, cloud or the client's server, load and fault-tolerance requirements",
        "Programming languages and stack — if the client sets them or the system must live alongside what already runs",
        "Integrations with external systems: government services, 1C, banks, payment gateways — how many and how well documented",
        "Security and personal data requirements",
        "Interface and documentation languages: Uzbek, Russian, English",
        "Format and set of documents: GOST 34 or the client's template, whether a test programme and guides are needed",
        "Deadline: an urgent spec costs more",
      ],
      uz: [
        "Tizimning murakkabligi va hajmi: nechta rol, ekran va biznes-jarayonni tavsiflash kerak",
        "Arxitektura: bitta ilova yoki bir nechta servis, bulut yoki buyurtmachi serveri, yuklama va barqarorlik talablari",
        "Dasturlash tillari va stek — agar buyurtmachi ularni belgilasa yoki tizim allaqachon ishlayotgan narsalar bilan birga ishlashi kerak bo‘lsa",
        "Tashqi tizimlar bilan integratsiyalar: davlat xizmatlari, 1C, banklar, to‘lov shlyuzlari — nechta va qanchalik tavsiflangan",
        "Xavfsizlik va shaxsiy ma’lumotlar bo‘yicha talablar",
        "Interfeys va hujjatlar tillari: o‘zbek, rus, ingliz",
        "Rasmiylashtirish va hujjatlar tarkibi: GOST 34 yoki buyurtmachi shakli, sinov dasturi va qo‘llanmalar kerakmi",
        "Muddat: shoshilinch texnik topshiriq qimmatroq",
      ],
      zh: [
        "系统的复杂度和规模：需要描述多少角色、页面和业务流程",
        "架构：单一应用还是多个服务，云端还是招标方服务器，负载与容错要求",
        "编程语言和技术栈——如果招标方指定，或系统需要与现有系统并行运行",
        "与外部系统的对接：政府服务、1C、银行、支付网关——数量多少、文档是否完善",
        "安全与个人数据方面的要求",
        "界面和文档语言：乌兹别克语、俄语、英语",
        "格式与文档组成：GOST 34 或招标方模板，是否需要测试大纲和使用手册",
        "工期：加急的技术规格书价格更高",
      ],
      uk: [
        "Складність і обсяг системи: скільки ролей, екранів і бізнес-процесів треба описати",
        "Архітектура: один застосунок чи кілька сервісів, хмара чи сервер замовника, вимоги до навантаження й відмовостійкості",
        "Мови програмування та стек — якщо замовник їх задає або система має працювати поруч із тим, що вже є",
        "Інтеграції із зовнішніми системами: держсервіси, 1С, банки, платіжні шлюзи — скільки їх і наскільки вони описані",
        "Вимоги до безпеки та персональних даних",
        "Мови інтерфейсу й документації: узбецька, російська, англійська",
        "Оформлення та склад документів: ГОСТ 34 або форма замовника, чи потрібні програма й методика випробувань, посібники",
        "Термін: термінове ТЗ коштує дорожче",
      ],
      pl: [
        "Złożoność i skala systemu: ile ról, ekranów i procesów biznesowych trzeba opisać",
        "Architektura: jedna aplikacja czy kilka usług, chmura czy serwer zamawiającego, wymagania dotyczące obciążenia i odporności na awarie",
        "Języki programowania i stack — jeśli zamawiający je narzuca albo system ma działać obok tego, co już funkcjonuje",
        "Integracje z systemami zewnętrznymi: e-usługi państwowe, 1C, banki, bramki płatności — ile ich jest i jak dobrze są opisane",
        "Wymagania dotyczące bezpieczeństwa i danych osobowych",
        "Języki interfejsu i dokumentacji: uzbecki, rosyjski, angielski",
        "Forma i skład dokumentów: GOST 34 czy wzór zamawiającego, czy potrzebne są program i metodyka testów oraz instrukcje",
        "Termin: pilna specyfikacja kosztuje więcej",
      ],
    },
  },
];

export function serviceBySlug(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}
