import type { LocalizedList, LocalizedText } from "@/lib/i18n";

/**
 * Готовые продукты, которые студия продаёт как есть.
 *
 * Это не услуги из content/services.ts: там мы беремся сделать, здесь —
 * отдаём то, что уже написано и работает. Отсюда и другой набор полей.
 * Главное из них — `readiness`: продавать «готовый проект», умалчивая, что
 * до публичного запуска ему нужны договоры с банком и аккаунт в сторе, —
 * это возврат и испорченная репутация, а не сделка.
 *
 * Цены здесь — итоговые, в долларах, без НДС (ИП на обороте налоге).
 */
export type ProductBlock = {
  title: LocalizedText;
  items: LocalizedList;
};

export type Product = {
  slug: string;
  seoTitle: LocalizedText;
  seoDescription: LocalizedText;
  title: LocalizedText;
  tagline: LocalizedText;
  /** Цена или нижняя граница вилки, доллары. */
  priceUsd: number;
  /** Верхняя граница — только там, где цена зависит от объёма. */
  priceToUsd?: number;
  description: LocalizedText;
  /** Что входит, по блокам. */
  blocks: ProductBlock[];
  /** Языки и технологии — не переводятся, это имена собственные. */
  tech: string[];
  /** Как продукт зарабатывает. Есть не у всех: лендинг ничего не зарабатывает сам. */
  monetization?: LocalizedList;
  /** Подо что переделывается без переписывания ядра. */
  rebuild?: LocalizedList;
  /**
   * Честная готовность.
   *
   * Показывается на карточке рядом с ценой. Умолчание здесь — самый быстрый
   * способ получить спор о возврате: покупатель считает, что купил готовый к
   * запуску бизнес, а купил кодовую базу, которой нужны его собственные
   * договоры с платёжной системой.
   */
  readiness: LocalizedText;
  /** Что покупатель докупает или оформляет сам. */
  buyerProvides: LocalizedList;
  /**
   * Сравнение с разработкой с нуля.
   *
   * Это оценка студии, а не замер: точная цифра зависит от того, сколько
   * придётся переделывать под конкретного заказчика. Поэтому в тексте стоит
   * «в среднем», а вилка широкая — сужать её значило бы обещать точность,
   * которой нет.
   */
  savings: LocalizedText;
};

export const products: Product[] = [
  {
    slug: "delivery-service",
    seoTitle: {
      ru: "Готовый маркетплейс доставки под ключ — исходный код",
      en: "Ready-Made Delivery Marketplace — Full Source Code",
      uz: "Tayyor yetkazib berish marketpleysi — to'liq manba kodi",
      zh: "成品配送市场平台 — 完整源代码",
    },
    seoDescription: {
      ru: "Исходный код маркетплейса доставки: приложение на Flutter для iOS, Android и веба, бэкенд на Node, три роли и интеграции с POS-системами. 16 000 $.",
      en: "Source code for a delivery marketplace: Flutter app for iOS, Android and web, Node backend, three user roles and POS integrations. $16,000.",
      uz: "Yetkazib berish marketpleysi manba kodi: iOS, Android va veb uchun Flutter ilova, Node backend, uchta rol va POS integratsiyalari. 30 000 $.",
      zh: "配送市场平台源代码：适用于 iOS、Android 和网页的 Flutter 应用、Node 后端、三种角色及 POS 集成。16,000 美元。",
    },
    title: {
      ru: "Маркетплейс доставки",
      en: "Delivery Marketplace",
      uz: "Yetkazib berish marketpleysi",
      zh: "配送市场平台",
    },
    tagline: {
      ru: "Одно приложение, три роли, готовые B2B-интеграции",
      en: "One app, three roles, B2B integrations included",
      uz: "Bitta ilova, uchta rol, tayyor B2B integratsiyalar",
      zh: "一个应用，三种角色，内置 B2B 集成",
    },
    priceUsd: 16000,
    description: {
      ru: "Полный исходный код маркетплейса доставки еды и продуктов. Покупатель, курьер и ресторан живут в одном приложении и переключаются ролью, а не отдельными сборками. Вход — через Telegram, без SMS и паролей. Рестораны подключают свою кассовую систему сами через интерфейс, и меню синхронизируется автоматически.",
      en: "The complete source code of a food and grocery delivery marketplace. Buyer, courier and restaurant live in one app and switch by role rather than by separate builds. Sign-in is through Telegram, with no SMS and no passwords. Restaurants connect their own POS through the interface and the menu syncs automatically.",
      uz: "Oziq-ovqat yetkazib berish marketpleysining to'liq manba kodi. Xaridor, kuryer va restoran bitta ilovada yashaydi va alohida yig'malar emas, rol orqali almashadi. Kirish — Telegram orqali, SMS va parolsiz. Restoranlar o'z kassa tizimini interfeys orqali ulaydi, menyu avtomatik sinxronlanadi.",
      zh: "餐饮与生鲜配送市场平台的完整源代码。买家、骑手和商家共处一个应用，通过切换角色而非分别打包。使用 Telegram 登录，无需短信与密码。商家可自行在界面中接入自己的收银系统，菜单自动同步。",
    },
    blocks: [
      {
        title: {
          ru: "Мобильное приложение",
          en: "Mobile app",
          uz: "Mobil ilova",
          zh: "移动应用",
        },
        items: {
          ru: [
            "Flutter: iOS, Android и веб из одного кода, около 14 000 строк",
            "Три полноценных роли: покупатель, курьер, менеджер ресторана",
            "Покупатель: главная, каталог, корзина, отслеживание заказа, профиль",
            "Курьер: свободные заказы, активная доставка, заработок, верификация",
            "Ресторан: сводка, очередь заказов, товары, интеграции, настройки",
            "Карта с курьером в реальном времени, вход через Telegram",
          ],
          en: [
            "Flutter: iOS, Android and web from one codebase, around 14,000 lines",
            "Three complete roles: buyer, courier, restaurant manager",
            "Buyer: home, catalogue, cart, order tracking, profile",
            "Courier: available orders, active delivery, earnings, verification",
            "Restaurant: dashboard, order queue, products, integrations, settings",
            "Live courier map, Telegram sign-in",
          ],
          uz: [
            "Flutter: bitta koddan iOS, Android va veb, taxminan 14 000 qator",
            "Uchta to'liq rol: xaridor, kuryer, restoran menejeri",
            "Xaridor: bosh sahifa, katalog, savat, buyurtmani kuzatish, profil",
            "Kuryer: bo'sh buyurtmalar, faol yetkazib berish, daromad, tekshiruv",
            "Restoran: hisobot, buyurtmalar navbati, tovarlar, integratsiyalar, sozlamalar",
            "Kuryer joylashuvi jonli xaritada, Telegram orqali kirish",
          ],
          zh: [
            "Flutter：一套代码支持 iOS、Android 与网页，约 14,000 行",
            "三种完整角色：买家、骑手、商家管理员",
            "买家：首页、商品目录、购物车、订单追踪、个人中心",
            "骑手：可接订单、进行中配送、收入、身份核验",
            "商家：概览、订单队列、商品、集成、设置",
            "骑手位置实时地图，Telegram 登录",
          ],
        },
      },
      {
        title: {
          ru: "Бэкенд и данные",
          en: "Backend and data",
          uz: "Backend va ma'lumotlar",
          zh: "后端与数据",
        },
        items: {
          ru: [
            "Node 20 и Express, более тридцати моделей данных в Prisma",
            "Заказы, магазины, товары, платежи, геокодирование адресов",
            "Обновления заказа и курьера по веб-сокету, без опроса сервера",
            "Очередь фоновых задач: уведомления, синхронизация, отложенное",
            "PostgreSQL 16 и Redis 7",
          ],
          en: [
            "Node 20 and Express, over thirty data models in Prisma",
            "Orders, shops, products, payments, address geocoding",
            "Order and courier updates over a websocket, no polling",
            "Background job queue: notifications, syncing, deferred work",
            "PostgreSQL 16 and Redis 7",
          ],
          uz: [
            "Node 20 va Express, Prisma'da o'ttizdan ortiq ma'lumot modeli",
            "Buyurtmalar, do'konlar, tovarlar, to'lovlar, manzil geokodlash",
            "Buyurtma va kuryer yangilanishlari veb-soket orqali, so'rovsiz",
            "Fon vazifalar navbati: bildirishnomalar, sinxronizatsiya, kechiktirilgan ishlar",
            "PostgreSQL 16 va Redis 7",
          ],
          zh: [
            "Node 20 与 Express，Prisma 中三十余个数据模型",
            "订单、门店、商品、支付、地址地理编码",
            "订单与骑手状态经 WebSocket 推送，无需轮询",
            "后台任务队列：通知、同步、延时任务",
            "PostgreSQL 16 与 Redis 7",
          ],
        },
      },
      {
        title: {
          ru: "B2B: подключение сетей",
          en: "B2B: connecting chains",
          uz: "B2B: tarmoqlarni ulash",
          zh: "B2B：连锁接入",
        },
        items: {
          ru: [
            "Ресторан подключает iiko, Poster или 1С сам, через интерфейс",
            "Меню и остатки синхронизируются автоматически",
            "Заказы возвращаются партнёру по webhook с подписью HMAC",
            "Документация с примерами прямо в кабинете, с живым логом запросов",
            "Рассчитано на сеть из сотни точек, а не на одну кофейню",
          ],
          en: [
            "The restaurant connects iiko, Poster or 1C itself, through the UI",
            "Menu and stock sync automatically",
            "Orders are returned to the partner over an HMAC-signed webhook",
            "Documentation with examples inside the cabinet, with a live request log",
            "Built for a hundred-location chain, not for a single coffee shop",
          ],
          uz: [
            "Restoran iiko, Poster yoki 1C ni interfeys orqali o'zi ulaydi",
            "Menyu va qoldiqlar avtomatik sinxronlanadi",
            "Buyurtmalar hamkorga HMAC imzoli webhook orqali qaytadi",
            "Kabinetda misollar bilan hujjatlar va so'rovlarning jonli jurnali",
            "Bitta qahvaxona uchun emas, yuzta nuqtali tarmoq uchun mo'ljallangan",
          ],
          zh: [
            "商家可在界面中自行接入 iiko、Poster 或 1C",
            "菜单与库存自动同步",
            "订单通过带 HMAC 签名的 webhook 回传给合作方",
            "后台内置带示例的文档与实时请求日志",
            "面向百家门店的连锁而非单店设计",
          ],
        },
      },
      {
        title: {
          ru: "Развёртывание",
          en: "Deployment",
          uz: "Joylashtirish",
          zh: "部署",
        },
        items: {
          ru: [
            "Один скрипт поднимает четыре контейнера на чистой Ubuntu",
            "Сертификат HTTPS выпускается автоматически",
            "От пустого сервера до работающего стенда — 10–15 минут",
            "Демо-данные для первого запуска в комплекте",
          ],
          en: [
            "One script brings up four containers on a clean Ubuntu",
            "The HTTPS certificate is issued automatically",
            "From an empty server to a working staging site: 10–15 minutes",
            "Seed data for the first run is included",
          ],
          uz: [
            "Bitta skript toza Ubuntu'da to'rtta konteynerni ko'taradi",
            "HTTPS sertifikati avtomatik chiqariladi",
            "Bo'sh serverdan ishlaydigan stendgacha — 10–15 daqiqa",
            "Birinchi ishga tushirish uchun demo ma'lumotlar birga keladi",
          ],
          zh: [
            "一条脚本在纯净 Ubuntu 上启动四个容器",
            "HTTPS 证书自动签发",
            "从空服务器到可用环境：10–15 分钟",
            "附带首次启动所需的示例数据",
          ],
        },
      },
    ],
    tech: [
      "Dart / Flutter", "Node.js 20", "Express", "Prisma", "PostgreSQL 16",
      "Redis 7", "Socket.IO", "BullMQ", "Caddy", "Docker",
    ],
    monetization: {
      ru: [
        "Комиссия с каждого заказа — основная модель",
        "Платное размещение и продвижение ресторанов в выдаче",
        "Абонентская плата за B2B-подключение кассовой системы сети",
        "Платная доставка и наценка за срочность",
      ],
      en: [
        "A commission on every order — the primary model",
        "Paid placement and promotion of restaurants in listings",
        "A subscription for connecting a chain's POS over B2B",
        "Paid delivery and an express surcharge",
      ],
      uz: [
        "Har bir buyurtmadan komissiya — asosiy model",
        "Restoranlarni ro'yxatda pullik joylashtirish va reklama",
        "Tarmoq kassa tizimini B2B ulash uchun abonent to'lovi",
        "Pullik yetkazib berish va shoshilinchlik uchun ustama",
      ],
      zh: [
        "按订单抽取佣金 —— 主要模式",
        "商家在列表中的付费展示与推广",
        "连锁收银系统 B2B 接入的订阅费",
        "配送收费与加急附加费",
      ],
    },
    readiness: {
      ru: "Готов к закрытой бете (пять ресторанов, оплата наличными) — примерно на 80%. До публичного запуска с реальными деньгами и приложением в сторах — около 48%: недостающее не в коде, а в договорах и аккаунтах, см. ниже.",
      en: "Ready for a closed beta (five restaurants, cash only) at roughly 80%. For a public launch with real money and store apps, roughly 48% — what is missing is not code but contracts and accounts, see below.",
      uz: "Yopiq betaga (beshta restoran, naqd to'lov) taxminan 80% tayyor. Haqiqiy pul va do'kondagi ilova bilan ommaviy ishga tushirishgacha — taxminan 48%: yetishmayotgani kod emas, shartnomalar va hisoblar, quyiga qarang.",
      zh: "封闭测试（五家商户、仅现金）就绪度约 80%。面向真实资金与应用商店上架的公开发布约 48% —— 欠缺的不是代码，而是合同与账号，详见下文。",
    },
    buyerProvides: {
      ru: [
        "Договоры с платёжной системой: Click, Payme или аналог",
        "Аккаунты разработчика в App Store и Google Play",
        "Юридическое оформление: оферта, обработка данных, договоры с ресторанами",
        "Продакшн-сервер и домен",
      ],
      en: [
        "Contracts with a payment provider: Click, Payme or equivalent",
        "Developer accounts in the App Store and Google Play",
        "Legal paperwork: public offer, data processing, restaurant contracts",
        "A production server and a domain",
      ],
      uz: [
        "To'lov tizimi bilan shartnomalar: Click, Payme yoki shunga o'xshash",
        "App Store va Google Play'da dasturchi hisoblari",
        "Yuridik rasmiylashtirish: oferta, ma'lumotlarni qayta ishlash, restoranlar bilan shartnomalar",
        "Ishlab chiqarish serveri va domen",
      ],
      zh: [
        "与支付服务商的合同：Click、Payme 或同类",
        "App Store 与 Google Play 开发者账号",
        "法律文件：公开要约、数据处理、商家合同",
        "生产服务器与域名",
      ],
    },
    savings: {
      ru: "Разработка такого же с нуля обходится в среднем на 40–70% дороже — это 22 400–27 200 $. И даже с учётом стоимости покупки доработка готового под вашу задачу выходит дешевле: платите только за отличия, а не за то, что уже написано и проверено в работе. Оценка студии, а не замер: точная цифра зависит от объёма переделок.",
      en: "Building the same from scratch costs on average 40–70% more — that is $22,400–27,200. And even counting the purchase price, adapting a ready product to your task comes out cheaper: you pay for the differences only, not for what is already written and proven in use. This is the studio's estimate, not a measurement: the exact figure depends on how much has to be reworked.",
      uz: "Xuddi shunday narsani noldan ishlab chiqish o'rtacha 40–70% qimmatga tushadi — bu 22 400–27 200 $. Sotib olish narxini hisobga olganda ham tayyorni sizning vazifangizga moslashtirish arzonroq: siz faqat farqlar uchun to'laysiz, allaqachon yozilgan va ishda sinalgan narsa uchun emas. Bu studiyaning bahosi, o'lchov emas: aniq raqam qayta ishlash hajmiga bog'liq.",
      zh: "从零开发同样的产品平均要贵 40–70% —— 约合22,400–27,200 美元。即便计入购买价格，将现成产品改造成您所需的方案依然更便宜：您只为差异付费，而不为已经写好并在实际使用中验证过的部分付费。这是本工作室的估算而非实测：具体数字取决于改造工作量。",
    },
  },
  {
    slug: "seller-ai",
    seoTitle: {
      ru: "Сервис ИИ-агентов для продавцов маркетплейсов — исходный код",
      en: "AI Agent Service for Marketplace Sellers — Source Code",
      uz: "Marketpleys sotuvchilari uchun AI-agentlar xizmati — manba kodi",
      zh: "面向电商卖家的 AI 代理服务 — 源代码",
    },
    seoDescription: {
      ru: "Готовый SaaS: шесть ИИ-агентов ведут карточки, цены, отзывы и рекламу продавца на семи площадках. С биллингом, тарифами и админкой. 15 000 $.",
      en: "A ready SaaS: six AI agents run a seller's listings, pricing, reviews and ads across seven marketplaces. Billing, tariffs and an admin panel included. $15,000.",
      uz: "Tayyor SaaS: oltita AI-agent sotuvchining kartochkalari, narxlari, sharhlari va reklamasini yettita maydonchada boshqaradi. Billing, tariflar va admin panel bilan. 15 000 $.",
      zh: "成品 SaaS：六个 AI 代理在七个平台上管理卖家的商品页、定价、评价与广告。含计费、套餐与管理后台。15,000 美元。",
    },
    title: {
      ru: "Сервис ИИ-агентов для продавцов",
      en: "AI Agent Service for Sellers",
      uz: "Sotuvchilar uchun AI-agentlar xizmati",
      zh: "面向卖家的 AI 代理服务",
    },
    tagline: {
      ru: "Агент предлагает, человек подтверждает, система учится на исходе",
      en: "The agent proposes, a human approves, the system learns from the outcome",
      uz: "Agent taklif qiladi, inson tasdiqlaydi, tizim natijadan o'rganadi",
      zh: "代理提出建议，人工确认，系统从结果中学习",
    },
    priceUsd: 15000,
    description: {
      ru: "Работающий SaaS целиком: шесть агентов на кастомной LLM ведут отзывы, карточки, цены, конкурентов, рекламу и логистику продавца. Каждый агент работает в одном из трёх режимов — выключен, предлагает и ждёт подтверждения, действует сам в рамках заданных правил. Ключевое здесь не генерация текста, а цикл обратной связи: система запоминает, что человек подтвердил, что отредактировал и что отклонил, и подстраивается под конкретного продавца.",
      en: "A working SaaS in full: six agents on a custom LLM handle a seller's reviews, listings, pricing, competitors, ads and logistics. Each agent runs in one of three modes — off, propose and wait for approval, or act within set guardrails. The point is not text generation but the feedback loop: the system records what the human approved, edited or rejected, and adapts to that particular seller.",
      uz: "To'liq ishlaydigan SaaS: maxsus LLM asosidagi oltita agent sotuvchining sharhlari, kartochkalari, narxlari, raqobatchilari, reklamasi va logistikasini boshqaradi. Har bir agent uchta rejimdan birida ishlaydi — o'chirilgan, taklif qilib tasdiq kutadi yoki belgilangan qoidalar doirasida o'zi harakat qiladi. Asosiysi matn yaratish emas, teskari aloqa halqasi: tizim inson nimani tasdiqlagani, tahrirlagani va rad etganini eslab qoladi.",
      zh: "一套完整可用的 SaaS：六个基于定制 LLM 的代理负责卖家的评价、商品页、定价、竞品、广告与物流。每个代理运行在三种模式之一 —— 关闭、提出建议并等待确认、或在既定护栏内自行执行。关键不在于文本生成，而在于反馈闭环：系统记录人工确认、修改或拒绝了什么，并针对该卖家进行调整。",
    },
    blocks: [
      {
        title: { ru: "Шесть агентов", en: "Six agents", uz: "Oltita agent", zh: "六个代理" },
        items: {
          ru: [
            "Отзывы: разбирает на претензии и обычные, пишет ответ, публикует",
            "Контент: карточки товара — заголовки, описания, характеристики",
            "Цены: следит за спросом и маржой, предлагает переоценку",
            "Конкуренты: отслеживает чужие карточки и цены в категории",
            "Реклама: ставки и бюджеты кампаний",
            "Логистика: остатки, поставки, распределение по складам",
          ],
          en: [
            "Reviews: sorts claims from ordinary feedback, drafts a reply, publishes it",
            "Content: product listings — titles, descriptions, attributes",
            "Pricing: watches demand and margin, proposes repricing",
            "Competitors: tracks rival listings and prices in the category",
            "Ads: campaign bids and budgets",
            "Logistics: stock, resupply, distribution across warehouses",
          ],
          uz: [
            "Sharhlar: da'volarni oddiylaridan ajratadi, javob yozadi, chop etadi",
            "Kontent: tovar kartochkalari — sarlavhalar, tavsiflar, xususiyatlar",
            "Narxlar: talab va marjani kuzatadi, qayta baholashni taklif qiladi",
            "Raqobatchilar: kategoriyadagi begona kartochka va narxlarni kuzatadi",
            "Reklama: kampaniya stavkalari va byudjetlari",
            "Logistika: qoldiqlar, yetkazib berishlar, omborlar bo'yicha taqsimlash",
          ],
          zh: [
            "评价：区分投诉与普通反馈，撰写回复并发布",
            "内容：商品页 —— 标题、描述、属性",
            "定价：跟踪需求与毛利，提出调价建议",
            "竞品：监控同类目对手的商品页与价格",
            "广告：投放出价与预算",
            "物流：库存、补货、仓间分配",
          ],
        },
      },
      {
        title: { ru: "Площадки", en: "Marketplaces", uz: "Maydonchalar", zh: "平台" },
        items: {
          ru: [
            "Wildberries, Ozon, Яндекс Маркет — основной контур",
            "Авито — отдельным подключением, с кабинетами",
            "Uzum (Узбекистан) и Kaspi (Казахстан) — региональные",
            "Amazon — подключение для выхода за пределы СНГ",
          ],
          en: [
            "Wildberries, Ozon, Yandex Market — the core set",
            "Avito — a separate add-on, with cabinets",
            "Uzum (Uzbekistan) and Kaspi (Kazakhstan) — regional",
            "Amazon — an add-on for going beyond the CIS",
          ],
          uz: [
            "Wildberries, Ozon, Yandex Market — asosiy kontur",
            "Avito — alohida ulanish, kabinetlar bilan",
            "Uzum (O'zbekiston) va Kaspi (Qozog'iston) — mintaqaviy",
            "Amazon — MDH tashqarisiga chiqish uchun ulanish",
          ],
          zh: [
            "Wildberries、Ozon、Yandex Market —— 核心组",
            "Avito —— 独立插件，支持多账户",
            "Uzum（乌兹别克斯坦）与 Kaspi（哈萨克斯坦）—— 区域平台",
            "Amazon —— 面向独联体以外市场的插件",
          ],
        },
      },
      {
        title: {
          ru: "Самообучение",
          en: "Self-learning",
          uz: "O'z-o'zidan o'rganish",
          zh: "自学习",
        },
        items: {
          ru: [
            "Каждое решение агента сохраняется с исходом",
            "Различаются подтверждение, правка, отказ и «человек сделал сам раньше»",
            "Правка ценнее подтверждения: она показывает, что именно не так",
            "По накопленной истории агент подстраивается под конкретного продавца",
            "Пробный режим: агент считает, но ничего не делает — видно качество до денег",
          ],
          en: [
            "Every agent decision is stored together with its outcome",
            "Approved, edited, rejected and «the human acted first» are distinguished",
            "An edit is worth more than an approval: it shows what exactly was off",
            "From that history the agent adapts to the particular seller",
            "Shadow mode: the agent computes but acts on nothing — quality is visible before any spend",
          ],
          uz: [
            "Agentning har bir qarori natijasi bilan saqlanadi",
            "Tasdiq, tahrir, rad etish va «inson avval o'zi qildi» farqlanadi",
            "Tahrir tasdiqdan qimmatroq: u aynan nima noto'g'ri ekanini ko'rsatadi",
            "To'plangan tarix bo'yicha agent aniq sotuvchiga moslashadi",
            "Sinov rejimi: agent hisoblaydi, lekin hech nima qilmaydi — sifat puldan oldin ko'rinadi",
          ],
          zh: [
            "代理的每个决策都连同结果一并留存",
            "区分确认、修改、拒绝与「人工先行处理」",
            "修改比确认更有价值：它指出了具体哪里不对",
            "依据累积历史，代理逐步适配该卖家",
            "影子模式：代理只计算不执行 —— 花钱之前就能看到质量",
          ],
        },
      },
      {
        title: {
          ru: "Биллинг и админка",
          en: "Billing and admin",
          uz: "Billing va admin panel",
          zh: "计费与管理后台",
        },
        items: {
          ru: [
            "Тарифы с разным набором возможностей и лимитами",
            "Оплата через платёжного провайдера, история платежей, возвраты",
            "Промокоды: процент, фиксированная скидка, бесплатные дни",
            "Реферальная программа с заявками на выплату",
            "Админка: клиенты, менеджеры с ролями, платежи, тикеты, метрики",
            "Учёт расхода на модель по каждому клиенту",
          ],
          en: [
            "Tariffs with different capability sets and limits",
            "Payment through a provider, payment history, refunds",
            "Promo codes: percentage, fixed discount, free days",
            "A referral programme with payout requests",
            "Admin: clients, managers with roles, payments, tickets, metrics",
            "Per-client accounting of model spend",
          ],
          uz: [
            "Turli imkoniyat va limitlarga ega tariflar",
            "To'lov provayder orqali, to'lovlar tarixi, qaytarishlar",
            "Promokodlar: foiz, qat'iy chegirma, bepul kunlar",
            "To'lov so'rovlari bilan referal dastur",
            "Admin panel: mijozlar, rolli menejerlar, to'lovlar, tiketlar, ko'rsatkichlar",
            "Har bir mijoz bo'yicha model sarfini hisobga olish",
          ],
          zh: [
            "具备不同功能组合与额度的套餐",
            "经支付服务商付款、支付历史、退款",
            "优惠码：百分比、固定折扣、免费天数",
            "带提现申请的推荐返佣计划",
            "后台：客户、带角色的管理员、支付、工单、指标",
            "按客户核算模型开销",
          ],
        },
      },
    ],
    tech: [
      "Python 3.12", "FastAPI", "SQLAlchemy", "Alembic", "Celery",
      "PostgreSQL", "Redis", "React", "Vite", "TypeScript", "Docker",
    ],
    monetization: {
      ru: [
        "Подписка по тарифам — основной доход, от пробного до бизнес-уровня",
        "Докупка кредитов на генерации сверх включённого в тариф",
        "Платные подключения: отдельные площадки и дополнительные кабинеты",
        "Реферальная программа: партнёр приводит продавца и получает долю",
        "Тариф без генераций — только аналитика и рекомендации, дешёвый вход",
      ],
      en: [
        "Tariff subscriptions — the main revenue, from trial to business tier",
        "Top-ups of generation credits beyond what the tariff includes",
        "Paid add-ons: individual marketplaces and extra cabinets",
        "A referral programme: a partner brings a seller and takes a share",
        "A generation-free tier — analytics and recommendations only, a cheap entry point",
      ],
      uz: [
        "Tarif obunasi — asosiy daromad, sinovdan biznes darajasigacha",
        "Tarifga kiritilganidan ortiq generatsiya kreditlarini sotib olish",
        "Pullik ulanishlar: alohida maydonchalar va qo'shimcha kabinetlar",
        "Referal dastur: hamkor sotuvchini olib keladi va ulush oladi",
        "Generatsiyasiz tarif — faqat tahlil va tavsiyalar, arzon kirish",
      ],
      zh: [
        "套餐订阅 —— 主要收入，从试用到企业级",
        "超出套餐额度后加购生成额度",
        "付费插件：单独平台与额外账户",
        "推荐返佣：合作伙伴带来卖家并分成",
        "无生成额度的套餐 —— 仅分析与建议，低价入门",
      ],
    },
    rebuild: {
      ru: [
        "Ядро не про маркетплейсы. Это связка: коннектор к внешней системе → агент предлагает действие → человек подтверждает или правит → исход записывается → агент учится. Плюс биллинг, тарифы и админка. Отрасль здесь — сменная часть.",
        "Аптеки и дистрибуция: агент следит за остатками и сроками годности, предлагает заказ поставщику, закупщик подтверждает",
        "Недвижимость: агент ведёт объявления на площадках, отвечает на заявки, подсказывает цену по рынку, риелтор правит",
        "Общепит: агент правит меню и цены по продажам и себестоимости, управляющий подтверждает",
        "Клиники: агент обрабатывает записи, напоминает пациентам, дозаполняет карту, администратор проверяет",
        "Логистика: агент подбирает перевозчика и торгуется по ставке, логист утверждает",
        "Меняются коннекторы и промпты агентов. Циклы подтверждения, самообучение, тарифы, платежи и админка переносятся как есть.",
      ],
      en: [
        "The core is not about marketplaces. It is a chain: a connector to an external system → the agent proposes an action → a human approves or edits → the outcome is recorded → the agent learns. Plus billing, tariffs and an admin panel. The industry is the swappable part.",
        "Pharmacies and distribution: the agent watches stock and expiry dates, proposes a supplier order, the buyer approves",
        "Real estate: the agent runs listings on portals, answers enquiries, suggests a market price, the agent-of-record edits",
        "Restaurants: the agent adjusts the menu and prices from sales and cost, the manager approves",
        "Clinics: the agent handles bookings, reminds patients, fills in the record, the administrator checks",
        "Logistics: the agent picks a carrier and negotiates the rate, the logistician signs off",
        "The connectors and the agent prompts change. The approval loops, self-learning, tariffs, payments and admin carry over as they are.",
      ],
      uz: [
        "Yadro marketpleyslar haqida emas. Bu zanjir: tashqi tizimga konnektor → agent harakat taklif qiladi → inson tasdiqlaydi yoki tahrirlaydi → natija yoziladi → agent o'rganadi. Ustiga billing, tariflar va admin panel. Soha — almashtiriladigan qism.",
        "Dorixonalar va distribyutsiya: agent qoldiq va yaroqlilik muddatini kuzatadi, yetkazib beruvchiga buyurtma taklif qiladi",
        "Ko'chmas mulk: agent e'lonlarni yuritadi, so'rovlarga javob beradi, bozor narxini taklif qiladi",
        "Umumiy ovqatlanish: agent sotuv va tannarxdan kelib chiqib menyu va narxlarni tuzatadi",
        "Klinikalar: agent yozuvlarni qayta ishlaydi, bemorlarga eslatadi, kartani to'ldiradi",
        "Logistika: agent tashuvchi tanlaydi va stavka bo'yicha savdolashadi",
        "Konnektorlar va agent promptlari o'zgaradi. Tasdiqlash halqalari, o'z-o'zidan o'rganish, tariflar, to'lovlar va admin panel o'zgarishsiz ko'chadi.",
      ],
      zh: [
        "内核与电商平台无关。它是一条链路：连接外部系统 → 代理提出动作 → 人工确认或修改 → 结果被记录 → 代理学习。外加计费、套餐与后台。行业是可替换的部分。",
        "药房与分销：代理监控库存与效期，向供应商提出订货建议，采购确认",
        "房地产：代理维护平台房源、回复咨询、给出市场价建议，经纪人修改",
        "餐饮：代理依据销量与成本调整菜单与价格，店长确认",
        "诊所：代理处理预约、提醒患者、补全病历，前台核对",
        "物流：代理挑选承运商并就运价议价，物流员批准",
        "改变的是连接器与代理提示词。确认闭环、自学习、套餐、支付与后台原样沿用。",
      ],
    },
    readiness: {
      ru: "Работающий сервис с платящими клиентами: биллинг, тарифы, админка и агенты — в проде. Покупателю нужны свои ключи площадок, свой договор с платёжным провайдером и свой ключ доступа к модели.",
      en: "A live service with paying customers: billing, tariffs, admin and agents are in production. The buyer needs their own marketplace keys, their own payment provider contract and their own model access key.",
      uz: "To'lovchi mijozlari bor ishlaydigan xizmat: billing, tariflar, admin panel va agentlar prodda. Xaridorga o'z maydoncha kalitlari, to'lov provayderi bilan shartnomasi va modelga kirish kaliti kerak.",
      zh: "已有付费客户的在运服务：计费、套餐、后台与代理均在生产环境。买方需自备平台密钥、支付服务商合同与模型访问密钥。",
    },
    buyerProvides: {
      ru: [
        "Ключи API площадок, на которых будет работать",
        "Договор с платёжным провайдером для приёма оплаты от своих клиентов",
        "Ключ доступа к языковой модели",
        "Сервер и домен",
      ],
      en: [
        "API keys for the marketplaces it will work on",
        "A payment provider contract for collecting money from their own customers",
        "A language model access key",
        "A server and a domain",
      ],
      uz: [
        "Ishlaydigan maydonchalarning API kalitlari",
        "O'z mijozlaridan to'lov qabul qilish uchun to'lov provayderi bilan shartnoma",
        "Til modeliga kirish kaliti",
        "Server va domen",
      ],
      zh: [
        "所要接入平台的 API 密钥",
        "用于向自有客户收款的支付服务商合同",
        "语言模型访问密钥",
        "服务器与域名",
      ],
    },
    savings: {
      ru: "Разработка такого же с нуля обходится в среднем на 40–70% дороже — это 21 000–25 500 $. И даже с учётом стоимости покупки доработка готового под вашу задачу выходит дешевле: платите только за отличия, а не за то, что уже написано и проверено в работе. Оценка студии, а не замер: точная цифра зависит от объёма переделок.",
      en: "Building the same from scratch costs on average 40–70% more — that is $21,000–25,500. And even counting the purchase price, adapting a ready product to your task comes out cheaper: you pay for the differences only, not for what is already written and proven in use. This is the studio's estimate, not a measurement: the exact figure depends on how much has to be reworked.",
      uz: "Xuddi shunday narsani noldan ishlab chiqish o'rtacha 40–70% qimmatga tushadi — bu 21 000–25 500 $. Sotib olish narxini hisobga olganda ham tayyorni sizning vazifangizga moslashtirish arzonroq: siz faqat farqlar uchun to'laysiz, allaqachon yozilgan va ishda sinalgan narsa uchun emas. Bu studiyaning bahosi, o'lchov emas: aniq raqam qayta ishlash hajmiga bog'liq.",
      zh: "从零开发同样的产品平均要贵 40–70% —— 约合21,000–25,500 美元。即便计入购买价格，将现成产品改造成您所需的方案依然更便宜：您只为差异付费，而不为已经写好并在实际使用中验证过的部分付费。这是本工作室的估算而非实测：具体数字取决于改造工作量。",
    },
  },
  {
    slug: "legal-ai",
    seoTitle: {
      ru: "ИИ-сервис юридического анализа документов — исходный код",
      en: "AI Legal Document Analysis Service — Source Code",
      uz: "Hujjatlarni yuridik tahlil qiluvchi AI-xizmat — manba kodi",
      zh: "AI 法律文书分析服务 — 源代码",
    },
    seoDescription: {
      ru: "Готовый сервис: клиент загружает документы по делу, получает разбор и готовый документ в Word. Вход по коду из SMS, оплата пакетами запросов. 3 500 $.",
      en: "A ready service: the client uploads case documents and gets an analysis plus a finished Word document. SMS-code sign-in, payment by request packages. $3,500.",
      uz: "Tayyor xizmat: mijoz ish hujjatlarini yuklaydi, tahlil va tayyor Word hujjatini oladi. SMS kodi bilan kirish, so'rov paketlari bilan to'lov. 3 500 $.",
      zh: "成品服务：客户上传案件文书，获得分析与生成的 Word 文档。短信验证码登录，按请求包付费。3,500 美元。",
    },
    title: {
      ru: "ИИ-юрист: анализ документов",
      en: "AI Lawyer: Document Analysis",
      uz: "AI-yurist: hujjatlar tahlili",
      zh: "AI 律师：文书分析",
    },
    tagline: {
      ru: "Загрузил дело — получил разбор и готовый документ",
      en: "Upload the case, get the analysis and a finished document",
      uz: "Ishni yukladingiz — tahlil va tayyor hujjat oldingiz",
      zh: "上传案件，获得分析与成稿文书",
    },
    priceUsd: 3500,
    description: {
      ru: "Сервис, в котором клиент загружает документы по своему делу и получает разбор, а следом — готовый юридический документ в формате Word с оформлением. Оплата не подпиской, а пакетами запросов: человек платит за конкретное дело, а не за месяц, в котором может ничего не понадобиться.",
      en: "A service where the client uploads the documents of their case, receives an analysis and then a finished, properly formatted legal document in Word. Payment is by request packages rather than subscription: a person pays for a specific case, not for a month in which they may need nothing.",
      uz: "Mijoz o'z ishi bo'yicha hujjatlarni yuklaydi va tahlil, keyin esa rasmiylashtirilgan tayyor yuridik hujjatni Word formatida oladi. To'lov obuna emas, so'rov paketlari bilan: inson aniq ish uchun to'laydi, hech nima kerak bo'lmasligi mumkin bo'lgan oy uchun emas.",
      zh: "客户上传自己案件的文书，先获得分析，随后得到排版规范的 Word 法律文书。付费方式为请求包而非订阅：为具体案件付费，而不是为可能什么都用不上的一个月付费。",
    },
    blocks: [
      {
        title: { ru: "Работа с делом", en: "Working a case", uz: "Ish bilan ishlash", zh: "案件处理" },
        items: {
          ru: [
            "Загрузка документов по делу, несколько файлов за раз",
            "Разбор с показом стадии: клиент видит, что происходит, а не крутилку",
            "История дел в кабинете, возврат к любому и удаление",
            "Предпросмотр результата до скачивания",
          ],
          en: [
            "Uploading case documents, several files at a time",
            "Analysis with a visible stage: the client sees progress, not a spinner",
            "Case history in the cabinet, return to any of them, deletion",
            "A preview of the result before downloading",
          ],
          uz: [
            "Ish hujjatlarini yuklash, bir vaqtda bir nechta fayl",
            "Bosqichi ko'rinadigan tahlil: mijoz aylanuvchi belgini emas, jarayonni ko'radi",
            "Kabinetda ishlar tarixi, istalganiga qaytish va o'chirish",
            "Yuklab olishdan oldin natijani ko'rib chiqish",
          ],
          zh: [
            "上传案件文书，可一次多份",
            "分析过程展示阶段：客户看到的是进度而非转圈",
            "后台保存案件历史，可回看任意一件并删除",
            "下载前可预览结果",
          ],
        },
      },
      {
        title: {
          ru: "Готовый документ",
          en: "The finished document",
          uz: "Tayyor hujjat",
          zh: "成稿文书",
        },
        items: {
          ru: [
            "Генерация в Word с заданными шрифтами, отступами и заголовками",
            "Оформление по структуре юридического документа, а не сплошной текст",
            "Отчёт по делу отдельным файлом",
            "Скачивание из кабинета в любой момент",
          ],
          en: [
            "Generation into Word with set fonts, spacing and headings",
            "Formatted as a legal document, not as a wall of text",
            "A case report as a separate file",
            "Download from the cabinet at any time",
          ],
          uz: [
            "Belgilangan shrift, chekinish va sarlavhalar bilan Word'ga yaratish",
            "Yaxlit matn emas, yuridik hujjat tuzilishi bo'yicha rasmiylashtirish",
            "Ish bo'yicha hisobot alohida fayl sifatida",
            "Kabinetdan istalgan vaqtda yuklab olish",
          ],
          zh: [
            "生成 Word 文档，字体、间距与标题均已设定",
            "按法律文书结构排版，而非整段文字",
            "案件报告作为独立文件",
            "可随时从后台下载",
          ],
        },
      },
      {
        title: { ru: "Вход и оплата", en: "Sign-in and payment", uz: "Kirish va to'lov", zh: "登录与付费" },
        items: {
          ru: [
            "Вход по номеру телефона с кодом, без пароля",
            "Обычная регистрация с почтой тоже доступна",
            "Пакеты запросов: от разового до пакета на юридическую фирму",
            "Баланс и история платежей в кабинете",
            "Уведомление, когда запросы заканчиваются",
          ],
          en: [
            "Sign-in by phone number with a code, no password",
            "Ordinary email registration is available too",
            "Request packages: from a single one to a package for a law firm",
            "Balance and payment history in the cabinet",
            "A notification when requests are running out",
          ],
          uz: [
            "Telefon raqami va kod bilan kirish, parolsiz",
            "Pochta bilan oddiy ro'yxatdan o'tish ham mavjud",
            "So'rov paketlari: bir martalikdan yuridik firma paketigacha",
            "Kabinetda balans va to'lovlar tarixi",
            "So'rovlar tugayotganda bildirishnoma",
          ],
          zh: [
            "手机号加验证码登录，无需密码",
            "同时支持常规邮箱注册",
            "请求包：从单次到律所套餐",
            "后台显示余额与支付历史",
            "请求额度将尽时发出提醒",
          ],
        },
      },
    ],
    tech: ["Python", "Flask", "JWT", "python-docx", "PostgreSQL", "Docker", "nginx"],
    monetization: {
      ru: [
        "Пакеты запросов вместо подписки — платят за дело, а не за месяц",
        "Разовый запрос как дешёвый вход для физлица",
        "Крупные пакеты для юридических фирм и палат",
        "Скидка первым клиентам как инструмент запуска",
      ],
      en: [
        "Request packages instead of a subscription — they pay per case, not per month",
        "A single request as a cheap entry point for an individual",
        "Large packages for law firms and chambers",
        "A first-customer discount as a launch tool",
      ],
      uz: [
        "Obuna o'rniga so'rov paketlari — oy uchun emas, ish uchun to'laydilar",
        "Jismoniy shaxs uchun arzon kirish sifatida bir martalik so'rov",
        "Yuridik firmalar va palatalar uchun yirik paketlar",
        "Ishga tushirish vositasi sifatida birinchi mijozlarga chegirma",
      ],
      zh: [
        "以请求包替代订阅 —— 按案件付费而非按月付费",
        "单次请求作为个人用户的低价入口",
        "面向律所与协会的大额套餐",
        "首批客户折扣作为启动手段",
      ],
    },
    readiness: {
      ru: "Сервис собран и работает: кабинет, загрузка, анализ, генерация документа и оплата. Тарифная сетка задана и требует подстройки под рынок покупателя.",
      en: "The service is assembled and working: cabinet, upload, analysis, document generation and payment. The tariff grid is defined and needs tuning to the buyer's market.",
      uz: "Xizmat yig'ilgan va ishlaydi: kabinet, yuklash, tahlil, hujjat yaratish va to'lov. Tarif to'ri belgilangan va xaridor bozoriga moslashtirishni talab qiladi.",
      zh: "服务已搭建并可运行：后台、上传、分析、文书生成与支付。套餐体系已定义，需按买方市场调整。",
    },
    buyerProvides: {
      ru: [
        "Ключ доступа к языковой модели",
        "Шлюз для отправки SMS с кодом входа",
        "Договор с платёжной системой",
        "Проверка шаблонов документов юристом своей юрисдикции",
      ],
      en: [
        "A language model access key",
        "A gateway for sending sign-in code SMS",
        "A payment system contract",
        "Review of the document templates by a lawyer in their own jurisdiction",
      ],
      uz: [
        "Til modeliga kirish kaliti",
        "Kirish kodi SMS'ini yuborish uchun shlyuz",
        "To'lov tizimi bilan shartnoma",
        "Hujjat shablonlarini o'z yurisdiktsiyasi yuristi tekshirishi",
      ],
      zh: [
        "语言模型访问密钥",
        "发送登录验证码短信的网关",
        "支付系统合同",
        "由所在法域的律师审核文书模板",
      ],
    },
    savings: {
      ru: "Разработка такого же с нуля обходится в среднем на 40–70% дороже — это 4 900–5 950 $. И даже с учётом стоимости покупки доработка готового под вашу задачу выходит дешевле: платите только за отличия, а не за то, что уже написано и проверено в работе. Оценка студии, а не замер: точная цифра зависит от объёма переделок.",
      en: "Building the same from scratch costs on average 40–70% more — that is $4,900–5,950. And even counting the purchase price, adapting a ready product to your task comes out cheaper: you pay for the differences only, not for what is already written and proven in use. This is the studio's estimate, not a measurement: the exact figure depends on how much has to be reworked.",
      uz: "Xuddi shunday narsani noldan ishlab chiqish o'rtacha 40–70% qimmatga tushadi — bu 4 900–5 950 $. Sotib olish narxini hisobga olganda ham tayyorni sizning vazifangizga moslashtirish arzonroq: siz faqat farqlar uchun to'laysiz, allaqachon yozilgan va ishda sinalgan narsa uchun emas. Bu studiyaning bahosi, o'lchov emas: aniq raqam qayta ishlash hajmiga bog'liq.",
      zh: "从零开发同样的产品平均要贵 40–70% —— 约合4,900–5,950 美元。即便计入购买价格，将现成产品改造成您所需的方案依然更便宜：您只为差异付费，而不为已经写好并在实际使用中验证过的部分付费。这是本工作室的估算而非实测：具体数字取决于改造工作量。",
    },
  },
  {
    slug: "landing",
    seoTitle: {
      ru: "Лендинг под ключ в Ташкенте: цена от 800 $ — DevUz",
      en: "Turnkey Landing Page in Tashkent from $800 — DevUz",
      uz: "Toshkentda kalit topshirish landing sahifasi 800 $ dan — DevUz",
      zh: "塔什干交钥匙落地页，800 美元起 — DevUz",
    },
    seoDescription: {
      ru: "Лендинг на Next.js: статическая генерация, до четырёх языков, форма заявки в Telegram, две готовые концепции дизайна. От 800 до 2 500 $ в зависимости от сложности.",
      en: "A Next.js landing page: static generation, up to four languages, a Telegram lead form, two ready design concepts. From $800 to $2,500 depending on complexity.",
      uz: "Next.js'da landing: statik generatsiya, to'rttagacha til, Telegram'ga ariza shakli, ikkita tayyor dizayn konsepsiyasi. Murakkabligiga qarab 800 dan 2 500 $ gacha.",
      zh: "基于 Next.js 的落地页：静态生成、最多四种语言、Telegram 表单、两套现成设计方案。依复杂度 800 至 2,500 美元。",
    },
    title: { ru: "Лендинг", en: "Landing Page", uz: "Landing sahifa", zh: "落地页" },
    tagline: {
      ru: "Две готовые концепции дизайна, четыре языка, заявки в Telegram",
      en: "Two ready design concepts, four languages, leads into Telegram",
      uz: "Ikkita tayyor dizayn konsepsiyasi, to'rt til, Telegram'ga arizalar",
      zh: "两套现成设计方案、四种语言、线索直达 Telegram",
    },
    priceUsd: 800,
    priceToUsd: 2500,
    description: {
      ru: "Одностраничник на том же движке, что и этот сайт: страницы собираются заранее и отдаются статикой, поэтому открываются мгновенно и хорошо индексируются. Две концепции дизайна уже нарисованы и написаны — кинематографичная тёмная и светлая каталожная; можно взять любую и перекрасить под свой бренд, а можно заказать свою. Анимации сделаны на CSS, без библиотек, поэтому не утяжеляют загрузку.",
      en: "A single-page site on the same engine as this one: pages are built ahead of time and served as static files, so they open instantly and index well. Two design concepts are already drawn and written — a cinematic dark one and a light catalogue one; take either and recolour it for your brand, or commission your own. Animations are pure CSS with no libraries, so they add nothing to load time.",
      uz: "Shu saytdagi kabi dvigatelda bir sahifali sayt: sahifalar oldindan yig'iladi va statik tarzda beriladi, shuning uchun bir zumda ochiladi va yaxshi indekslanadi. Ikkita dizayn konsepsiyasi allaqachon chizilgan — kinematografik qorong'i va yorug' katalog; istalganini olib brendingizga bo'yash yoki o'zingiznikini buyurtma qilish mumkin. Animatsiyalar CSS'da, kutubxonasiz.",
      zh: "与本站同引擎的单页站点：页面预先构建并以静态文件提供，因此打开迅速、易于收录。两套设计方案已完成 —— 电影感深色版与明亮目录版；可任选其一改配品牌色，也可定制专属方案。动画纯用 CSS 实现，不引入任何库，因而不增加加载负担。",
    },
    blocks: [
      {
        title: {
          ru: "800 $ — базовый",
          en: "$800 — basic",
          uz: "800 $ — asosiy",
          zh: "800 美元 —— 基础版",
        },
        items: {
          ru: [
            "Одна страница на одном языке",
            "Готовая концепция дизайна, перекрашенная под ваш бренд",
            "Форма заявки с отправкой в Telegram",
            "Метаданные, карта сайта, разметка для поиска",
            "Развёртывание на вашем домене",
          ],
          en: [
            "One page in one language",
            "A ready design concept recoloured for your brand",
            "A lead form delivering into Telegram",
            "Metadata, sitemap, search markup",
            "Deployment on your domain",
          ],
          uz: [
            "Bitta tilda bitta sahifa",
            "Brendingizga bo'yalgan tayyor dizayn konsepsiyasi",
            "Telegram'ga yuboriladigan ariza shakli",
            "Metama'lumotlar, sayt xaritasi, qidiruv uchun razmetka",
            "Sizning domeningizda joylashtirish",
          ],
          zh: [
            "单语言单页面",
            "现成设计方案，按您的品牌配色",
            "线索表单直达 Telegram",
            "元数据、站点地图、搜索结构化标记",
            "部署到您的域名",
          ],
        },
      },
      {
        title: {
          ru: "1 500 $ — многоязычный",
          en: "$1,500 — multilingual",
          uz: "1 500 $ — ko'p tilli",
          zh: "1,500 美元 —— 多语言版",
        },
        items: {
          ru: [
            "До четырёх языков с автоопределением и переключателем",
            "Своя структура секций под ваш продукт, а не готовая рыба",
            "Расширенная форма и передача заявки в вашу CRM",
            "Настройка hreflang, чтобы языки не конкурировали в выдаче",
            "Аналитика и цели",
          ],
          en: [
            "Up to four languages with auto-detection and a switcher",
            "A section structure built for your product, not a template filler",
            "An extended form and lead delivery into your CRM",
            "hreflang setup so the languages do not compete in search",
            "Analytics and goals",
          ],
          uz: [
            "Avtoaniqlash va almashtirgich bilan to'rttagacha til",
            "Tayyor andoza emas, mahsulotingizga mos bo'lim tuzilishi",
            "Kengaytirilgan shakl va arizani CRM'ingizga uzatish",
            "Tillar qidiruvda raqobatlashmasligi uchun hreflang sozlash",
            "Analitika va maqsadlar",
          ],
          zh: [
            "最多四种语言，自动识别并可手动切换",
            "依据您的产品定制版块结构，而非套用模板",
            "扩展表单，线索接入您的 CRM",
            "配置 hreflang，避免多语言页面在搜索中相互竞争",
            "分析统计与转化目标",
          ],
        },
      },
      {
        title: {
          ru: "2 500 $ — со своим дизайном и админкой",
          en: "$2,500 — custom design with an admin panel",
          uz: "2 500 $ — o'z dizayni va admin paneli bilan",
          zh: "2,500 美元 —— 定制设计并带后台",
        },
        items: {
          ru: [
            "Своя концепция дизайна, нарисованная под вас, а не перекрашенная",
            "Внутренние страницы: каталог, новости, о компании",
            "Админка: вы сами добавляете товары, новости и фотографии",
            "Сложные анимации и сцены прокрутки",
            "Перенос контента с действующего сайта",
          ],
          en: [
            "A design concept drawn for you, not a recolour",
            "Inner pages: catalogue, news, about",
            "An admin panel: you add products, news and photos yourself",
            "Complex animations and scroll scenes",
            "Migration of content from your current site",
          ],
          uz: [
            "Bo'yalgan emas, siz uchun chizilgan o'z dizayn konsepsiyasi",
            "Ichki sahifalar: katalog, yangiliklar, kompaniya haqida",
            "Admin panel: tovar, yangilik va suratlarni o'zingiz qo'shasiz",
            "Murakkab animatsiyalar va aylantirish sahnalari",
            "Amaldagi saytdan kontentni ko'chirish",
          ],
          zh: [
            "为您专门设计的方案，而非改色复用",
            "内页：商品目录、新闻、公司介绍",
            "管理后台：商品、新闻与图片由您自行维护",
            "复杂动画与滚动场景",
            "从现有网站迁移内容",
          ],
        },
      },
    ],
    tech: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS v4", "Supabase"],
    readiness: {
      ru: "Обе концепции дизайна написаны и работают, их можно посмотреть до заказа. Срок от согласования до запуска — от недели для базового варианта.",
      en: "Both design concepts are written and working; you can see them before ordering. From sign-off to launch: a week and up for the basic option.",
      uz: "Ikkala dizayn konsepsiyasi yozilgan va ishlaydi, buyurtmadan oldin ko'rish mumkin. Kelishuvdan ishga tushirishgacha — asosiy variant uchun bir haftadan.",
      zh: "两套设计方案均已实现并可运行，下单前即可查看。从确认到上线：基础版一周起。",
    },
    buyerProvides: {
      ru: [
        "Домен и доступ к его настройкам",
        "Тексты и фотографии либо задание на их подготовку",
        "Логотип и фирменные цвета, если они есть",
        "Чат в Telegram или доступ к CRM для приёма заявок",
      ],
      en: [
        "A domain and access to its settings",
        "Texts and photos, or a brief for producing them",
        "A logo and brand colours, if they exist",
        "A Telegram chat or CRM access for receiving leads",
      ],
      uz: [
        "Domen va uning sozlamalariga kirish",
        "Matnlar va suratlar yoki ularni tayyorlash uchun topshiriq",
        "Logotip va firma ranglari, agar mavjud bo'lsa",
        "Arizalarni qabul qilish uchun Telegram chat yoki CRM'ga kirish",
      ],
      zh: [
        "域名及其设置权限",
        "文案与图片，或委托我们制作的需求说明",
        "标志与品牌色（若已有）",
        "用于接收线索的 Telegram 群或 CRM 权限",
      ],
    },
    savings: {
      ru: "Разработка такого же с нуля обходится в среднем на 40–70% дороже — это 1 120–4 250 $. И даже с учётом стоимости покупки доработка готового под вашу задачу выходит дешевле: платите только за отличия, а не за то, что уже написано и проверено в работе. Оценка студии, а не замер: точная цифра зависит от объёма переделок.",
      en: "Building the same from scratch costs on average 40–70% more — that is $1,120–4,250. And even counting the purchase price, adapting a ready product to your task comes out cheaper: you pay for the differences only, not for what is already written and proven in use. This is the studio's estimate, not a measurement: the exact figure depends on how much has to be reworked.",
      uz: "Xuddi shunday narsani noldan ishlab chiqish o'rtacha 40–70% qimmatga tushadi — bu 1 120–4 250 $. Sotib olish narxini hisobga olganda ham tayyorni sizning vazifangizga moslashtirish arzonroq: siz faqat farqlar uchun to'laysiz, allaqachon yozilgan va ishda sinalgan narsa uchun emas. Bu studiyaning bahosi, o'lchov emas: aniq raqam qayta ishlash hajmiga bog'liq.",
      zh: "从零开发同样的产品平均要贵 40–70% —— 约合1,120–4,250 美元。即便计入购买价格，将现成产品改造成您所需的方案依然更便宜：您只为差异付费，而不为已经写好并在实际使用中验证过的部分付费。这是本工作室的估算而非实测：具体数字取决于改造工作量。",
    },
  },
  {
    slug: "marketplace",
    seoTitle: {
      ru: "Готовый маркетплейс на микросервисах — исходный код",
      en: "Ready-Made Microservice Marketplace — Source Code",
      uz: "Mikroservislarda tayyor marketpleys — manba kodi",
      zh: "成品微服务电商平台 — 源代码",
    },
    seoDescription: {
      ru: "Исходный код маркетплейса: 36 сервисов на Java и Spring, каталог с поиском, платежи, склад, логистика, ОФД и интеграции для Узбекистана. 30 000 $.",
      en: "Marketplace source code: 36 services on Java and Spring, catalogue with search, payments, warehouse, logistics, fiscal receipts and Uzbek integrations. $30,000.",
      uz: "Marketpleys manba kodi: Java va Spring'da 36 servis, qidiruvli katalog, to'lovlar, ombor, logistika, OFD va O'zbekiston integratsiyalari. 30 000 $.",
      zh: "电商平台源代码：基于 Java 与 Spring 的 36 个服务，含搜索目录、支付、仓储、物流、财政票据及乌兹别克本地集成。30,000 美元。",
    },
    title: {
      ru: "Маркетплейс на микросервисах",
      en: "Microservice Marketplace",
      uz: "Mikroservislarda marketpleys",
      zh: "微服务电商平台",
    },
    tagline: {
      ru: "36 сервисов, шлюз, шина сообщений, оркестрация процессов",
      en: "36 services, a gateway, a message bus, process orchestration",
      uz: "36 servis, shlyuz, xabarlar shinasi, jarayonlar orkestratsiyasi",
      zh: "36 个服务、网关、消息总线、流程编排",
    },
    priceUsd: 30000,
    description: {
      ru: "Исходный код полноценного маркетплейса корпоративного масштаба: тридцать шесть сервисов за единым шлюзом, у каждого своя база, между ними — асинхронная шина, а бизнес-процессы описаны и исполняются движком оркестрации, а не расставлены по коду условиями. Это не витрина с корзиной: здесь склад, логистика, биллинг, фискальные чеки, кэшбэк и три отдельных фронтенда — покупателю, продавцу и складу.",
      en: "The source code of a full enterprise-scale marketplace: thirty-six services behind a single gateway, each with its own database, an asynchronous bus between them, and business processes described and executed by an orchestration engine rather than scattered through the code as conditionals. This is not a storefront with a cart: it has warehousing, logistics, billing, fiscal receipts, cashback and three separate frontends — for the buyer, the seller and the warehouse.",
      uz: "To'laqonli korporativ miqyosdagi marketpleysning manba kodi: yagona shlyuz ortida o'ttiz oltita servis, har birida o'z bazasi, ular orasida asinxron shina, biznes-jarayonlar esa kodga shartlar bilan sochilgan emas, orkestratsiya dvigateli tomonidan bajariladi. Bu savatli vitrina emas: bu yerda ombor, logistika, billing, fiskal cheklar, keshbek va uchta alohida frontend bor.",
      zh: "一套企业级电商平台的完整源代码：单一网关之后有三十六个服务，各自独立数据库，服务间通过异步消息总线通信，业务流程由编排引擎描述并执行，而非以条件语句散落在代码中。这不是带购物车的展示页：其中包含仓储、物流、计费、财政票据、返现，以及面向买家、卖家与仓库的三套独立前端。",
    },
    blocks: [
      {
        title: {
          ru: "Сервисы: торговля",
          en: "Services: commerce",
          uz: "Servislar: savdo",
          zh: "服务：交易",
        },
        items: {
          ru: [
            "Каталог: товары, категории, атрибуты, модерация карточек",
            "Поиск на Elasticsearch: фасеты, синонимы, ранжирование",
            "Продажи: заказы, отмены, возвраты, статусы",
            "Оформление заказа отдельным сервисом и фронтендом",
            "Контент продавцов: отзывы, вопросы, медиа",
            "CMS: баннеры, подборки, статические страницы",
          ],
          en: [
            "Catalogue: products, categories, attributes, listing moderation",
            "Search on Elasticsearch: facets, synonyms, ranking",
            "Sales: orders, cancellations, returns, statuses",
            "Checkout as a separate service and frontend",
            "Seller content: reviews, questions, media",
            "CMS: banners, collections, static pages",
          ],
          uz: [
            "Katalog: tovarlar, kategoriyalar, atributlar, kartochkalar moderatsiyasi",
            "Elasticsearch'da qidiruv: fasetlar, sinonimlar, reyting",
            "Sotuvlar: buyurtmalar, bekor qilishlar, qaytarishlar, statuslar",
            "Buyurtma rasmiylashtirish alohida servis va frontend sifatida",
            "Sotuvchilar kontenti: sharhlar, savollar, media",
            "CMS: bannerlar, to'plamlar, statik sahifalar",
          ],
          zh: [
            "目录：商品、类目、属性、商品页审核",
            "基于 Elasticsearch 的搜索：分面、同义词、排序",
            "销售：订单、取消、退货、状态流转",
            "结算作为独立服务与前端",
            "卖家内容：评价、问答、媒体",
            "CMS：横幅、专题、静态页",
          ],
        },
      },
      {
        title: {
          ru: "Сервисы: деньги и склад",
          en: "Services: money and warehouse",
          uz: "Servislar: pul va ombor",
          zh: "服务：资金与仓储",
        },
        items: {
          ru: [
            "Платёжный шлюз: приём оплаты, холдирование, возвраты",
            "Биллинг: расчёты с продавцами, комиссии, взаиморасчёты",
            "ОФД: фискальные чеки и передача в налоговую",
            "Генератор чеков на NestJS с отрисовкой в PDF",
            "Склад: остатки, приёмка, отгрузка, инвентаризация",
            "Логистика: доставка, маршруты, статусы отправлений",
            "Бонусы и кэшбэк отдельным сервисом",
          ],
          en: [
            "Payment gateway: collecting payment, holds, refunds",
            "Billing: settlements with sellers, commissions, reconciliation",
            "Fiscal service: receipts and reporting to the tax authority",
            "A receipt generator on NestJS rendering to PDF",
            "Warehouse: stock, receiving, shipping, stocktaking",
            "Logistics: delivery, routes, shipment statuses",
            "Bonuses and cashback as a separate service",
          ],
          uz: [
            "To'lov shlyuzi: to'lov qabul qilish, ushlab turish, qaytarish",
            "Billing: sotuvchilar bilan hisob-kitob, komissiyalar",
            "OFD: fiskal cheklar va soliqqa uzatish",
            "NestJS'da PDF'ga chizuvchi chek generatori",
            "Ombor: qoldiqlar, qabul, jo'natish, inventarizatsiya",
            "Logistika: yetkazib berish, marshrutlar, jo'natma statuslari",
            "Bonuslar va keshbek alohida servis sifatida",
          ],
          zh: [
            "支付网关：收款、预授权、退款",
            "计费：与卖家结算、佣金、对账",
            "财政服务：票据开具与税务上报",
            "基于 NestJS 的票据生成器，输出 PDF",
            "仓储：库存、入库、出库、盘点",
            "物流：配送、路线、运单状态",
            "积分与返现独立服务",
          ],
        },
      },
      {
        title: {
          ru: "Фронтенды и боты",
          en: "Frontends and bots",
          uz: "Frontendlar va botlar",
          zh: "前端与机器人",
        },
        items: {
          ru: [
            "Витрина и сайт покупателя на Next.js",
            "Кабинет продавца и админка платформы на React",
            "Интерфейс склада (WMS) отдельным приложением",
            "Собственный UI-кит и набор иконок — общий на все фронтенды",
            "Бот продавца и бот транспортной службы в Telegram",
          ],
          en: [
            "Buyer storefront and site on Next.js",
            "Seller cabinet and platform admin on React",
            "A warehouse interface (WMS) as a separate application",
            "An in-house UI kit and icon set shared across all frontends",
            "A seller bot and a transport-service bot in Telegram",
          ],
          uz: [
            "Xaridor vitrinasi va sayti Next.js'da",
            "Sotuvchi kabineti va platforma admin paneli React'da",
            "Ombor interfeysi (WMS) alohida ilova sifatida",
            "Barcha frontendlar uchun umumiy o'z UI-kiti va ikonkalar to'plami",
            "Telegram'da sotuvchi boti va transport xizmati boti",
          ],
          zh: [
            "基于 Next.js 的买家商城与站点",
            "基于 React 的卖家后台与平台管理端",
            "仓库作业界面（WMS）作为独立应用",
            "自研 UI 组件库与图标集，各前端共用",
            "Telegram 中的卖家机器人与运输服务机器人",
          ],
        },
      },
      {
        title: {
          ru: "Инфраструктура и интеграции",
          en: "Infrastructure and integrations",
          uz: "Infratuzilma va integratsiyalar",
          zh: "基础设施与集成",
        },
        items: {
          ru: [
            "Единый шлюз на Spring Cloud Gateway перед всеми сервисами",
            "Асинхронная шина на RabbitMQ между сервисами",
            "Бизнес-процессы в движке оркестрации Camunda, а не в коде",
            "Своя база PostgreSQL на каждый сервис, общий Redis для сессий и прав",
            "Интеграции под рынок Узбекистана: Click, Uzum, Didox, ОФД, НСИ",
            "Секреты вынесены в переменные окружения, в коде их нет",
          ],
          en: [
            "A single Spring Cloud Gateway in front of every service",
            "An asynchronous RabbitMQ bus between services",
            "Business processes in the Camunda orchestration engine, not in code",
            "A PostgreSQL database per service, a shared Redis for sessions and permissions",
            "Integrations for the Uzbek market: Click, Uzum, Didox, fiscal, reference registries",
            "Secrets moved out into environment variables, none left in the code",
          ],
          uz: [
            "Barcha servislar oldida Spring Cloud Gateway yagona shlyuzi",
            "Servislar orasida RabbitMQ asinxron shinasi",
            "Biznes-jarayonlar kodda emas, Camunda orkestratsiya dvigatelida",
            "Har bir servisga o'z PostgreSQL bazasi, sessiya va huquqlar uchun umumiy Redis",
            "O'zbekiston bozori uchun integratsiyalar: Click, Uzum, Didox, OFD, NSI",
            "Maxfiy kalitlar muhit o'zgaruvchilariga chiqarilgan, kodda yo'q",
          ],
          zh: [
            "所有服务前置统一的 Spring Cloud Gateway 网关",
            "服务间采用 RabbitMQ 异步消息总线",
            "业务流程置于 Camunda 编排引擎，而非写死在代码里",
            "每个服务独立 PostgreSQL 数据库，会话与权限共用 Redis",
            "面向乌兹别克市场的集成：Click、Uzum、Didox、财政系统、参考登记",
            "机密信息已移至环境变量，代码中不再保留",
          ],
        },
      },
    ],
    tech: [
      "Java 17", "Spring Boot", "Spring Cloud Gateway", "Camunda BPM", "RabbitMQ",
      "PostgreSQL", "Elasticsearch", "Redis", "React", "Next.js", "NestJS", "Docker",
    ],
    monetization: {
      ru: [
        "Комиссия с продаж продавцов — основная модель площадки",
        "Платное продвижение товаров в поиске и подборках",
        "Абонентская плата за расширенный кабинет продавца",
        "Складские и логистические услуги площадки за отдельную плату",
        "Реклама и баннеры на витрине",
      ],
      en: [
        "A commission on seller sales — the platform's primary model",
        "Paid promotion of products in search and collections",
        "A subscription for an extended seller cabinet",
        "Warehousing and logistics services charged separately",
        "Advertising and banners on the storefront",
      ],
      uz: [
        "Sotuvchilar savdosidan komissiya — maydonchaning asosiy modeli",
        "Tovarlarni qidiruv va to'plamlarda pullik reklama qilish",
        "Kengaytirilgan sotuvchi kabineti uchun abonent to'lovi",
        "Maydonchaning ombor va logistika xizmatlari alohida to'lov evaziga",
        "Vitrinada reklama va bannerlar",
      ],
      zh: [
        "按卖家销售额抽佣 —— 平台的主要模式",
        "商品在搜索与专题中的付费推广",
        "卖家高级后台的订阅费",
        "平台仓储与物流服务单独收费",
        "商城内的广告与横幅位",
      ],
    },
    readiness: {
      ru: "Код работавшего маркетплейса, а не заготовка: все тридцать шесть сервисов написаны и связаны между собой. Но это корпоративная система, и развернуть её — не «поднять контейнер»: нужен кластер, отдельные базы, брокер сообщений, поисковый кластер и человек, который это обслуживает. Оценивайте не только цену покупки, но и стоимость эксплуатации.",
      en: "The code of a marketplace that ran, not a skeleton: all thirty-six services are written and wired together. But it is an enterprise system, and deploying it is not «bring up a container»: it needs a cluster, separate databases, a message broker, a search cluster and someone to operate all of it. Budget for running costs, not just the purchase price.",
      uz: "Bu andoza emas, ishlagan marketpleys kodi: o'ttiz oltita servisning barchasi yozilgan va o'zaro bog'langan. Lekin bu korporativ tizim va uni joylashtirish «konteyner ko'tarish» emas: klaster, alohida bazalar, xabar brokeri, qidiruv klasteri va buni qo'llab-quvvatlaydigan odam kerak. Faqat sotib olish narxini emas, ekspluatatsiya xarajatini ham baholang.",
      zh: "这是曾实际运行过的电商平台代码，而非骨架：三十六个服务均已实现并相互打通。但它是企业级系统，部署并非「起一个容器」：需要集群、独立数据库、消息代理、搜索集群，以及负责运维的人。请把运行成本也纳入预算，而不仅是购买价格。",
    },
    buyerProvides: {
      ru: [
        "Инфраструктура: кластер, базы, брокер сообщений, поисковый кластер",
        "Инженер эксплуатации — система микросервисная, сама себя не обслужит",
        "Договоры с платёжными системами и оператором фискальных данных",
        "Собственные ключи ко всем внешним интеграциям",
        "Юридическое оформление площадки и договоры с продавцами",
      ],
      en: [
        "Infrastructure: a cluster, databases, a message broker, a search cluster",
        "An operations engineer — a microservice system does not run itself",
        "Contracts with payment systems and a fiscal data operator",
        "Their own keys for every external integration",
        "Legal setup of the platform and contracts with sellers",
      ],
      uz: [
        "Infratuzilma: klaster, bazalar, xabar brokeri, qidiruv klasteri",
        "Ekspluatatsiya muhandisi — mikroservis tizimi o'zini o'zi qo'llab-quvvatlamaydi",
        "To'lov tizimlari va fiskal ma'lumotlar operatori bilan shartnomalar",
        "Barcha tashqi integratsiyalar uchun o'z kalitlari",
        "Maydonchani yuridik rasmiylashtirish va sotuvchilar bilan shartnomalar",
      ],
      zh: [
        "基础设施：集群、数据库、消息代理、搜索集群",
        "运维工程师 —— 微服务系统无法自我运行",
        "与支付系统及财政数据运营商的合同",
        "所有外部集成的自有密钥",
        "平台的法律设立与卖家合同",
      ],
    },
    savings: {
      ru: "Разработка такого же с нуля обходится в среднем на 40–70% дороже — это 42 000–51 000 $. И даже с учётом стоимости покупки доработка готового под вашу задачу выходит дешевле: платите только за отличия, а не за то, что уже написано и проверено в работе. Оценка студии, а не замер: точная цифра зависит от объёма переделок.",
      en: "Building the same from scratch costs on average 40–70% more — that is $42,000–51,000. And even counting the purchase price, adapting a ready product to your task comes out cheaper: you pay for the differences only, not for what is already written and proven in use. This is the studio's estimate, not a measurement: the exact figure depends on how much has to be reworked.",
      uz: "Xuddi shunday narsani noldan ishlab chiqish o'rtacha 40–70% qimmatga tushadi — bu 42 000–51 000 $. Sotib olish narxini hisobga olganda ham tayyorni sizning vazifangizga moslashtirish arzonroq: siz faqat farqlar uchun to'laysiz, allaqachon yozilgan va ishda sinalgan narsa uchun emas. Bu studiyaning bahosi, o'lchov emas: aniq raqam qayta ishlash hajmiga bog'liq.",
      zh: "从零开发同样的产品平均要贵 40–70% —— 约合 42,000–51,000 美元。即便计入购买价格，将现成产品改造成您所需的方案依然更便宜：您只为差异付费，而不为已经写好并在实际使用中验证过的部分付费。这是本工作室的估算而非实测：具体数字取决于改造工作量。",
    },
  },
];
