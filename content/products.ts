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

/**
 * Снимок работающего экземпляра.
 *
 * Google требует у товара изображение, «ясно показывающее товар». Для
 * исходного кода это снимок запущенного продукта, а не обложка с названием:
 * обложку покупатель отличает от продукта с первого взгляда, и она не
 * отвечает на единственный вопрос, ради которого её открыли, — как это
 * выглядит.
 *
 * Размеры хранятся рядом с путём: без них страница дёргается при загрузке, а
 * это Google меряет отдельной метрикой. Проставляет их `scripts/product-shots.mjs`
 * из самого файла, чтобы они не разошлись с картинкой.
 */
export type ProductShot = {
  /** Путь внутри public. */
  src: string;
  width: number;
  height: number;
  /** Что на снимке. Идёт и подписью под картинкой, и в alt для поиска. */
  caption: LocalizedText;
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
  /**
   * Снимки работающего экземпляра. Пусто — товар выходит без картинок.
   *
   * Пусто это не «забыли»: снимать нечего, пока у продукта нет живого
   * экземпляра. Показать вместо него обложку значило бы поставить в
   * разметку изображение, которого на странице нет.
   */
  shots?: readonly ProductShot[];
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
      uk: "Готовий маркетплейс доставки під ключ — вихідний код",
      pl: "Gotowy marketplace dostaw pod klucz — kod źródłowy",
    },
    seoDescription: {
      ru: "Исходный код маркетплейса доставки: приложение на Flutter для iOS, Android и веба, бэкенд на Node, три роли и интеграции с POS-системами. 16 000 $.",
      en: "Source code for a delivery marketplace: Flutter app for iOS, Android and web, Node backend, three user roles and POS integrations. $16,000.",
      uz: "Yetkazib berish marketpleysi manba kodi: iOS, Android va veb uchun Flutter ilova, Node backend, uchta rol va POS integratsiyalari. 30 000 $.",
      zh: "配送市场平台源代码：适用于 iOS、Android 和网页的 Flutter 应用、Node 后端、三种角色及 POS 集成。16,000 美元。",
      uk: "Вихідний код маркетплейсу доставки: застосунок на Flutter для iOS, Android і вебу, бекенд на Node, три ролі та інтеграції з POS-системами. 16 000 $.",
      pl: "Kod źródłowy marketplace’u dostaw: aplikacja we Flutterze na iOS, Androida i web, backend w Node, trzy role i integracje z systemami POS. 16 000 $.",
    },
    title: {
      ru: "Маркетплейс доставки",
      en: "Delivery Marketplace",
      uz: "Yetkazib berish marketpleysi",
      zh: "配送市场平台",
      uk: "Маркетплейс доставки",
      pl: "Marketplace dostaw",
    },
    tagline: {
      ru: "Одно приложение, три роли, готовые B2B-интеграции",
      en: "One app, three roles, B2B integrations included",
      uz: "Bitta ilova, uchta rol, tayyor B2B integratsiyalar",
      zh: "一个应用，三种角色，内置 B2B 集成",
      uk: "Один застосунок, три ролі, готові B2B-інтеграції",
      pl: "Jedna aplikacja, trzy role, gotowe integracje B2B",
    },
    priceUsd: 16000,
    description: {
      ru: "Полный исходный код маркетплейса доставки еды и продуктов. Покупатель, курьер и ресторан живут в одном приложении и переключаются ролью, а не отдельными сборками. Вход — через Telegram, без SMS и паролей. Рестораны подключают свою кассовую систему сами через интерфейс, и меню синхронизируется автоматически.",
      en: "The complete source code of a food and grocery delivery marketplace. Buyer, courier and restaurant live in one app and switch by role rather than by separate builds. Sign-in is through Telegram, with no SMS and no passwords. Restaurants connect their own POS through the interface and the menu syncs automatically.",
      uz: "Oziq-ovqat yetkazib berish marketpleysining to'liq manba kodi. Xaridor, kuryer va restoran bitta ilovada yashaydi va alohida yig'malar emas, rol orqali almashadi. Kirish — Telegram orqali, SMS va parolsiz. Restoranlar o'z kassa tizimini interfeys orqali ulaydi, menyu avtomatik sinxronlanadi.",
      zh: "餐饮与生鲜配送市场平台的完整源代码。买家、骑手和商家共处一个应用，通过切换角色而非分别打包。使用 Telegram 登录，无需短信与密码。商家可自行在界面中接入自己的收银系统，菜单自动同步。",
      uk: "Повний вихідний код маркетплейсу доставки їжі та продуктів. Покупець, кур'єр і ресторан працюють в одному застосунку й перемикаються роллю, а не окремими збірками. Вхід — через Telegram, без SMS і паролів. Ресторани самі підключають свою касову систему через інтерфейс, і меню синхронізується автоматично.",
      pl: "Pełny kod źródłowy marketplace’u z dostawą jedzenia i zakupów. Klient, kurier i restauracja korzystają z jednej aplikacji i przełączają się rolą, a nie osobnymi buildami. Logowanie przez Telegram — bez SMS-ów i haseł. Restauracje same podłączają swój system kasowy w interfejsie, a menu synchronizuje się automatycznie.",
    },
    blocks: [
      {
        title: {
          ru: "Мобильное приложение",
          en: "Mobile app",
          uz: "Mobil ilova",
          zh: "移动应用",
          uk: "Мобільний застосунок",
          pl: "Aplikacja mobilna",
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
          uk: [
            "Flutter: iOS, Android і веб з одного коду, близько 14 000 рядків",
            "Три повноцінні ролі: покупець, кур'єр, менеджер ресторану",
            "Покупець: головна, каталог, кошик, відстеження замовлення, профіль",
            "Кур'єр: вільні замовлення, активна доставка, заробіток, верифікація",
            "Ресторан: зведення, черга замовлень, товари, інтеграції, налаштування",
            "Карта з кур'єром у реальному часі, вхід через Telegram",
          ],
          pl: [
            "Flutter: iOS, Android i web z jednego kodu, około 14 000 linii",
            "Trzy pełnoprawne role: klient, kurier, menedżer restauracji",
            "Klient: strona główna, katalog, koszyk, śledzenie zamówienia, profil",
            "Kurier: wolne zamówienia, aktywna dostawa, zarobki, weryfikacja",
            "Restauracja: podsumowanie, kolejka zamówień, produkty, integracje, ustawienia",
            "Mapa z kurierem w czasie rzeczywistym, logowanie przez Telegram",
          ],
        },
      },
      {
        title: {
          ru: "Бэкенд и данные",
          en: "Backend and data",
          uz: "Backend va ma'lumotlar",
          zh: "后端与数据",
          uk: "Бекенд і дані",
          pl: "Backend i dane",
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
          uk: [
            "Node 20 і Express, понад тридцять моделей даних у Prisma",
            "Замовлення, магазини, товари, платежі, геокодування адрес",
            "Оновлення замовлення й кур'єра через вебсокет, без опитування сервера",
            "Черга фонових задач: сповіщення, синхронізація, відкладені дії",
            "PostgreSQL 16 і Redis 7",
          ],
          pl: [
            "Node 20 i Express, ponad trzydzieści modeli danych w Prisma",
            "Zamówienia, sklepy, produkty, płatności, geokodowanie adresów",
            "Aktualizacje zamówienia i kuriera przez WebSocket, bez odpytywania serwera",
            "Kolejka zadań w tle: powiadomienia, synchronizacja, zadania odroczone",
            "PostgreSQL 16 i Redis 7",
          ],
        },
      },
      {
        title: {
          ru: "B2B: подключение сетей",
          en: "B2B: connecting chains",
          uz: "B2B: tarmoqlarni ulash",
          zh: "B2B：连锁接入",
          uk: "B2B: підключення мереж",
          pl: "B2B: podłączanie sieci",
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
          uk: [
            "Ресторан сам підключає iiko, Poster або 1С через інтерфейс",
            "Меню й залишки синхронізуються автоматично",
            "Замовлення повертаються партнерові через webhook з підписом HMAC",
            "Документація з прикладами просто в кабінеті, з живим логом запитів",
            "Розраховано на мережу із сотні точок, а не на одну кав'ярню",
          ],
          pl: [
            "Restauracja sama podłącza iiko, Poster lub 1C w interfejsie",
            "Menu i stany magazynowe synchronizują się automatycznie",
            "Zamówienia wracają do partnera przez webhook z podpisem HMAC",
            "Dokumentacja z przykładami bezpośrednio w panelu, z podglądem logu zapytań na żywo",
            "Zaprojektowane dla sieci liczącej sto lokali, a nie dla jednej kawiarni",
          ],
        },
      },
      {
        title: {
          ru: "Развёртывание",
          en: "Deployment",
          uz: "Joylashtirish",
          zh: "部署",
          uk: "Розгортання",
          pl: "Wdrożenie",
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
          uk: [
            "Один скрипт піднімає чотири контейнери на чистій Ubuntu",
            "Сертифікат HTTPS випускається автоматично",
            "Від порожнього сервера до робочого стенда — 10–15 хвилин",
            "Демодані для першого запуску в комплекті",
          ],
          pl: [
            "Jeden skrypt uruchamia cztery kontenery na czystym Ubuntu",
            "Certyfikat HTTPS wystawiany jest automatycznie",
            "Od pustego serwera do działającego środowiska — 10–15 minut",
            "Dane demo do pierwszego uruchomienia w zestawie",
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
      uk: [
        "Комісія з кожного замовлення — основна модель",
        "Платне розміщення й просування ресторанів у видачі",
        "Абонентська плата за B2B-підключення касової системи мережі",
        "Платна доставка й націнка за терміновість",
      ],
      pl: [
        "Prowizja od każdego zamówienia — główny model",
        "Płatne wyróżnienie i promowanie restauracji w wynikach",
        "Abonament za podłączenie B2B systemu kasowego sieci",
        "Płatna dostawa i dopłata za ekspres",
      ],
    },
    readiness: {
      ru: "Готов к закрытой бете (пять ресторанов, оплата наличными) — примерно на 80%. До публичного запуска с реальными деньгами и приложением в сторах — около 48%: недостающее не в коде, а в договорах и аккаунтах, см. ниже.",
      en: "Ready for a closed beta (five restaurants, cash only) at roughly 80%. For a public launch with real money and store apps, roughly 48% — what is missing is not code but contracts and accounts, see below.",
      uz: "Yopiq betaga (beshta restoran, naqd to'lov) taxminan 80% tayyor. Haqiqiy pul va do'kondagi ilova bilan ommaviy ishga tushirishgacha — taxminan 48%: yetishmayotgani kod emas, shartnomalar va hisoblar, quyiga qarang.",
      zh: "封闭测试（五家商户、仅现金）就绪度约 80%。面向真实资金与应用商店上架的公开发布约 48% —— 欠缺的不是代码，而是合同与账号，详见下文。",
      uk: "Готовий до закритої бети (п'ять ресторанів, оплата готівкою) — приблизно на 80%. До публічного запуску з реальними грошима й застосунком у сторах — близько 48%: бракує не коду, а договорів та акаунтів, див. нижче.",
      pl: "Gotowy do zamkniętej bety (pięć restauracji, płatność gotówką) — mniej więcej w 80%. Do publicznego startu z prawdziwymi pieniędzmi i aplikacją w sklepach — w około 48%: brakujące elementy nie leżą w kodzie, tylko w umowach i kontach, patrz niżej.",
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
      uk: [
        "Договори з платіжною системою: Click, Payme або аналог",
        "Акаунти розробника в App Store і Google Play",
        "Юридичне оформлення: оферта, обробка даних, договори з ресторанами",
        "Продакшн-сервер і домен",
      ],
      pl: [
        "Umowy z operatorem płatności: Click, Payme lub odpowiednik",
        "Konta deweloperskie w App Store i Google Play",
        "Formalności prawne: regulamin, przetwarzanie danych, umowy z restauracjami",
        "Serwer produkcyjny i domena",
      ],
    },
    savings: {
      ru: "Разработка такого же с нуля обходится в среднем на 40–70% дороже — это 22 400–27 200 $. И даже с учётом стоимости покупки доработка готового под вашу задачу выходит дешевле: платите только за отличия, а не за то, что уже написано и проверено в работе. Оценка студии, а не замер: точная цифра зависит от объёма переделок.",
      en: "Building the same from scratch costs on average 40–70% more — that is $22,400–27,200. And even counting the purchase price, adapting a ready product to your task comes out cheaper: you pay for the differences only, not for what is already written and proven in use. This is the studio's estimate, not a measurement: the exact figure depends on how much has to be reworked.",
      uz: "Xuddi shunday narsani noldan ishlab chiqish o'rtacha 40–70% qimmatga tushadi — bu 22 400–27 200 $. Sotib olish narxini hisobga olganda ham tayyorni sizning vazifangizga moslashtirish arzonroq: siz faqat farqlar uchun to'laysiz, allaqachon yozilgan va ishda sinalgan narsa uchun emas. Bu studiyaning bahosi, o'lchov emas: aniq raqam qayta ishlash hajmiga bog'liq.",
      zh: "从零开发同样的产品平均要贵 40–70% —— 约合22,400–27,200 美元。即便计入购买价格，将现成产品改造成您所需的方案依然更便宜：您只为差异付费，而不为已经写好并在实际使用中验证过的部分付费。这是本工作室的估算而非实测：具体数字取决于改造工作量。",
      uk: "Розробка такого самого з нуля коштує в середньому на 40–70% дорожче — це 22 400–27 200 $. І навіть з урахуванням ціни покупки доопрацювати готовий продукт під ваше завдання дешевше: ви платите лише за відмінності, а не за те, що вже написано й перевірено в роботі. Це оцінка студії, а не вимір: точна сума залежить від обсягу переробок.",
      pl: "Stworzenie takiego samego rozwiązania od zera kosztuje średnio o 40–70% więcej — to 22 400–27 200 $. Nawet po doliczeniu ceny zakupu dopracowanie gotowego produktu pod Twoje potrzeby wychodzi taniej: płacisz tylko za różnice, a nie za to, co już zostało napisane i sprawdzone w działaniu. To szacunek studia, a nie pomiar: dokładna kwota zależy od zakresu zmian.",
    },
  },
  {
    slug: "seller-ai",
    seoTitle: {
      ru: "Сервис ИИ-агентов для продавцов маркетплейсов — исходный код",
      en: "AI Agent Service for Marketplace Sellers — Source Code",
      uz: "Marketpleys sotuvchilari uchun AI-agentlar xizmati — manba kodi",
      zh: "面向电商卖家的 AI 代理服务 — 源代码",
      uk: "Сервіс ШІ-агентів для продавців маркетплейсів — вихідний код",
      pl: "Serwis agentów AI dla sprzedawców na marketplace’ach — kod",
    },
    seoDescription: {
      ru: "Готовый SaaS: шесть ИИ-агентов ведут карточки, цены, отзывы и рекламу продавца на семи площадках. С биллингом, тарифами и админкой. 15 000 $.",
      en: "A ready SaaS: six AI agents run a seller's listings, pricing, reviews and ads across seven marketplaces. Billing, tariffs and an admin panel included. $15,000.",
      uz: "Tayyor SaaS: oltita AI-agent sotuvchining kartochkalari, narxlari, sharhlari va reklamasini yettita maydonchada boshqaradi. Billing, tariflar va admin panel bilan. 15 000 $.",
      zh: "成品 SaaS：六个 AI 代理在七个平台上管理卖家的商品页、定价、评价与广告。含计费、套餐与管理后台。15,000 美元。",
      uk: "Готовий SaaS: шість ШІ-агентів ведуть картки, ціни, відгуки й рекламу продавця на семи майданчиках. З білінгом, тарифами й адмінкою. 15 000 $.",
      pl: "Gotowy SaaS: sześć agentów AI prowadzi karty produktów, ceny, opinie i reklamy sprzedawcy na siedmiu platformach. Z billingiem, planami i panelem. 15 000 $.",
    },
    title: {
      ru: "Сервис ИИ-агентов для продавцов",
      en: "AI Agent Service for Sellers",
      uz: "Sotuvchilar uchun AI-agentlar xizmati",
      zh: "面向卖家的 AI 代理服务",
      uk: "Сервіс ШІ-агентів для продавців",
      pl: "Serwis agentów AI dla sprzedawców",
    },
    tagline: {
      ru: "Агент предлагает, человек подтверждает, система учится на исходе",
      en: "The agent proposes, a human approves, the system learns from the outcome",
      uz: "Agent taklif qiladi, inson tasdiqlaydi, tizim natijadan o'rganadi",
      zh: "代理提出建议，人工确认，系统从结果中学习",
      uk: "Агент пропонує, людина підтверджує, система вчиться на результаті",
      pl: "Agent proponuje, człowiek zatwierdza, system uczy się na wynikach",
    },
    priceUsd: 15000,
    description: {
      ru: "Работающий SaaS целиком: шесть агентов на кастомной LLM ведут отзывы, карточки, цены, конкурентов, рекламу и логистику продавца. Каждый агент работает в одном из трёх режимов — выключен, предлагает и ждёт подтверждения, действует сам в рамках заданных правил. Ключевое здесь не генерация текста, а цикл обратной связи: система запоминает, что человек подтвердил, что отредактировал и что отклонил, и подстраивается под конкретного продавца.",
      en: "A working SaaS in full: six agents on a custom LLM handle a seller's reviews, listings, pricing, competitors, ads and logistics. Each agent runs in one of three modes — off, propose and wait for approval, or act within set guardrails. The point is not text generation but the feedback loop: the system records what the human approved, edited or rejected, and adapts to that particular seller.",
      uz: "To'liq ishlaydigan SaaS: maxsus LLM asosidagi oltita agent sotuvchining sharhlari, kartochkalari, narxlari, raqobatchilari, reklamasi va logistikasini boshqaradi. Har bir agent uchta rejimdan birida ishlaydi — o'chirilgan, taklif qilib tasdiq kutadi yoki belgilangan qoidalar doirasida o'zi harakat qiladi. Asosiysi matn yaratish emas, teskari aloqa halqasi: tizim inson nimani tasdiqlagani, tahrirlagani va rad etganini eslab qoladi.",
      zh: "一套完整可用的 SaaS：六个基于定制 LLM 的代理负责卖家的评价、商品页、定价、竞品、广告与物流。每个代理运行在三种模式之一 —— 关闭、提出建议并等待确认、或在既定护栏内自行执行。关键不在于文本生成，而在于反馈闭环：系统记录人工确认、修改或拒绝了什么，并针对该卖家进行调整。",
      uk: "Робочий SaaS повністю: шість агентів на кастомній LLM ведуть відгуки, картки, ціни, конкурентів, рекламу й логістику продавця. Кожен агент працює в одному з трьох режимів — вимкнений, пропонує й чекає на підтвердження, діє сам у межах заданих правил. Головне тут не генерація тексту, а цикл зворотного зв'язку: система запам'ятовує, що людина підтвердила, що відредагувала, а що відхилила, і підлаштовується під конкретного продавця.",
      pl: "Kompletny, działający SaaS: sześć agentów na własnym LLM obsługuje opinie, karty produktów, ceny, konkurencję, reklamę i logistykę sprzedawcy. Każdy agent działa w jednym z trzech trybów — wyłączony, proponuje i czeka na zatwierdzenie albo działa sam w granicach ustalonych reguł. Kluczowe nie jest tu generowanie tekstu, lecz pętla informacji zwrotnej: system zapamiętuje, co człowiek zatwierdził, co poprawił, a co odrzucił, i dopasowuje się do konkretnego sprzedawcy.",
    },
    blocks: [
      {
        title: { ru: "Шесть агентов", en: "Six agents", uz: "Oltita agent", zh: "六个代理", uk: "Шість агентів", pl: "Sześć agentów" },
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
          uk: [
            "Відгуки: відокремлює претензії від звичайних, пише відповідь, публікує",
            "Контент: картки товару — заголовки, описи, характеристики",
            "Ціни: стежить за попитом і маржею, пропонує переоцінку",
            "Конкуренти: відстежує чужі картки й ціни в категорії",
            "Реклама: ставки й бюджети кампаній",
            "Логістика: залишки, поставки, розподіл по складах",
          ],
          pl: [
            "Opinie: dzieli na reklamacje i zwykłe, pisze odpowiedź, publikuje",
            "Treści: karty produktów — tytuły, opisy, parametry",
            "Ceny: śledzi popyt i marżę, proponuje zmianę cen",
            "Konkurencja: monitoruje cudze karty i ceny w kategorii",
            "Reklama: stawki i budżety kampanii",
            "Logistyka: stany, dostawy, rozkład między magazynami",
          ],
        },
      },
      {
        title: { ru: "Площадки", en: "Marketplaces", uz: "Maydonchalar", zh: "平台", uk: "Майданчики", pl: "Platformy" },
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
          uk: [
            "Wildberries, Ozon, Яндекс Маркет — основний контур",
            "Авіто — окремим підключенням, з кабінетами",
            "Uzum (Узбекистан) і Kaspi (Казахстан) — регіональні",
            "Amazon — підключення для виходу за межі СНД",
          ],
          pl: [
            "Wildberries, Ozon, Yandex Market — główny zestaw",
            "Avito — osobne podłączenie, z kontami",
            "Uzum (Uzbekistan) i Kaspi (Kazachstan) — regionalne",
            "Amazon — podłączenie do wyjścia poza WNP",
          ],
        },
      },
      {
        title: {
          ru: "Самообучение",
          en: "Self-learning",
          uz: "O'z-o'zidan o'rganish",
          zh: "自学习",
          uk: "Самонавчання",
          pl: "Samouczenie",
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
          uk: [
            "Кожне рішення агента зберігається разом із результатом",
            "Розрізняються підтвердження, правка, відмова та «людина зробила сама раніше»",
            "Правка цінніша за підтвердження: вона показує, що саме не так",
            "За накопиченою історією агент підлаштовується під конкретного продавця",
            "Пробний режим: агент рахує, але нічого не робить — якість видно ще до грошей",
          ],
          pl: [
            "Każda decyzja agenta zapisywana jest razem z wynikiem",
            "System odróżnia zatwierdzenie, poprawkę, odrzucenie i „człowiek zrobił to sam wcześniej”",
            "Poprawka jest cenniejsza niż zatwierdzenie: pokazuje, co dokładnie jest nie tak",
            "Na podstawie zebranej historii agent dopasowuje się do konkretnego sprzedawcy",
            "Tryb próbny: agent liczy, ale niczego nie robi — jakość widać, zanim wydasz pieniądze",
          ],
        },
      },
      {
        title: {
          ru: "Биллинг и админка",
          en: "Billing and admin",
          uz: "Billing va admin panel",
          zh: "计费与管理后台",
          uk: "Білінг і адмінка",
          pl: "Billing i panel admina",
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
          uk: [
            "Тарифи з різним набором можливостей і лімітами",
            "Оплата через платіжного провайдера, історія платежів, повернення",
            "Промокоди: відсоток, фіксована знижка, безкоштовні дні",
            "Реферальна програма із заявками на виплату",
            "Адмінка: клієнти, менеджери з ролями, платежі, тікети, метрики",
            "Облік витрат на модель для кожного клієнта",
          ],
          pl: [
            "Plany z różnym zakresem funkcji i limitami",
            "Płatności przez operatora płatności, historia płatności, zwroty",
            "Kody promocyjne: procent, stały rabat, darmowe dni",
            "Program poleceń z wnioskami o wypłatę",
            "Panel admina: klienci, menedżerowie z rolami, płatności, zgłoszenia, metryki",
            "Rozliczanie kosztów modelu dla każdego klienta",
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
      uk: [
        "Підписка за тарифами — основний дохід, від пробного до бізнес-рівня",
        "Докупівля кредитів на генерації понад включене в тариф",
        "Платні підключення: окремі майданчики й додаткові кабінети",
        "Реферальна програма: партнер приводить продавця й отримує частку",
        "Тариф без генерацій — лише аналітика й рекомендації, дешевий вхід",
      ],
      pl: [
        "Subskrypcja w planach — główny przychód, od wersji próbnej po poziom biznesowy",
        "Dokupowanie kredytów na generowanie ponad limit z planu",
        "Płatne podłączenia: dodatkowe platformy i kolejne konta",
        "Program poleceń: partner przyprowadza sprzedawcę i dostaje udział",
        "Plan bez generowania — tylko analityka i rekomendacje, tani start",
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
      uk: [
        "Ядро не про маркетплейси. Це зв'язка: конектор до зовнішньої системи → агент пропонує дію → людина підтверджує або править → результат записується → агент навчається. Плюс білінг, тарифи й адмінка. Галузь тут — змінна частина.",
        "Аптеки й дистрибуція: агент стежить за залишками й термінами придатності, пропонує замовлення постачальнику, закупівельник підтверджує",
        "Нерухомість: агент веде оголошення на майданчиках, відповідає на заявки, підказує ринкову ціну, рієлтор править",
        "Громадське харчування: агент коригує меню й ціни за продажами та собівартістю, керуючий підтверджує",
        "Клініки: агент обробляє записи, нагадує пацієнтам, дозаповнює картку, адміністратор перевіряє",
        "Логістика: агент підбирає перевізника й торгується за ставку, логіст затверджує",
        "Змінюються конектори й промпти агентів. Цикли підтвердження, самонавчання, тарифи, платежі й адмінка переносяться як є.",
      ],
      pl: [
        "Rdzeń nie dotyczy marketplace’ów. To schemat: konektor do zewnętrznego systemu → agent proponuje działanie → człowiek zatwierdza lub poprawia → wynik jest zapisywany → agent się uczy. Do tego billing, plany i panel admina. Branża jest tu wymiennym elementem.",
        "Apteki i dystrybucja: agent pilnuje stanów i terminów ważności, proponuje zamówienie u dostawcy, zaopatrzeniowiec zatwierdza",
        "Nieruchomości: agent prowadzi ogłoszenia na portalach, odpowiada na zapytania, podpowiada cenę rynkową, pośrednik poprawia",
        "Gastronomia: agent poprawia menu i ceny na podstawie sprzedaży i kosztów, kierownik zatwierdza",
        "Kliniki: agent obsługuje wizyty, przypomina pacjentom, uzupełnia kartę, rejestracja sprawdza",
        "Logistyka: agent dobiera przewoźnika i negocjuje stawkę, logistyk zatwierdza",
        "Zmieniają się konektory i prompty agentów. Pętle zatwierdzania, samouczenie, plany, płatności i panel admina przenosisz bez zmian.",
      ],
    },
    readiness: {
      ru: "Работающий сервис с платящими клиентами: биллинг, тарифы, админка и агенты — в проде. Покупателю нужны свои ключи площадок, свой договор с платёжным провайдером и свой ключ доступа к модели.",
      en: "A live service with paying customers: billing, tariffs, admin and agents are in production. The buyer needs their own marketplace keys, their own payment provider contract and their own model access key.",
      uz: "To'lovchi mijozlari bor ishlaydigan xizmat: billing, tariflar, admin panel va agentlar prodda. Xaridorga o'z maydoncha kalitlari, to'lov provayderi bilan shartnomasi va modelga kirish kaliti kerak.",
      zh: "已有付费客户的在运服务：计费、套餐、后台与代理均在生产环境。买方需自备平台密钥、支付服务商合同与模型访问密钥。",
      uk: "Робочий сервіс із клієнтами, які платять: білінг, тарифи, адмінка й агенти — у продакшні. Покупцеві потрібні власні ключі майданчиків, власний договір із платіжним провайдером і власний ключ доступу до моделі.",
      pl: "Działający serwis z płacącymi klientami: billing, plany, panel admina i agenci — na produkcji. Kupujący potrzebuje własnych kluczy do platform, własnej umowy z operatorem płatności i własnego klucza dostępu do modelu.",
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
      uk: [
        "API-ключі майданчиків, на яких він працюватиме",
        "Договір із платіжним провайдером для приймання оплати від своїх клієнтів",
        "Ключ доступу до мовної моделі",
        "Сервер і домен",
      ],
      pl: [
        "Klucze API platform, na których serwis ma działać",
        "Umowa z operatorem płatności na przyjmowanie opłat od własnych klientów",
        "Klucz dostępu do modelu językowego",
        "Serwer i domena",
      ],
    },
    savings: {
      ru: "Разработка такого же с нуля обходится в среднем на 40–70% дороже — это 21 000–25 500 $. И даже с учётом стоимости покупки доработка готового под вашу задачу выходит дешевле: платите только за отличия, а не за то, что уже написано и проверено в работе. Оценка студии, а не замер: точная цифра зависит от объёма переделок.",
      en: "Building the same from scratch costs on average 40–70% more — that is $21,000–25,500. And even counting the purchase price, adapting a ready product to your task comes out cheaper: you pay for the differences only, not for what is already written and proven in use. This is the studio's estimate, not a measurement: the exact figure depends on how much has to be reworked.",
      uz: "Xuddi shunday narsani noldan ishlab chiqish o'rtacha 40–70% qimmatga tushadi — bu 21 000–25 500 $. Sotib olish narxini hisobga olganda ham tayyorni sizning vazifangizga moslashtirish arzonroq: siz faqat farqlar uchun to'laysiz, allaqachon yozilgan va ishda sinalgan narsa uchun emas. Bu studiyaning bahosi, o'lchov emas: aniq raqam qayta ishlash hajmiga bog'liq.",
      zh: "从零开发同样的产品平均要贵 40–70% —— 约合21,000–25,500 美元。即便计入购买价格，将现成产品改造成您所需的方案依然更便宜：您只为差异付费，而不为已经写好并在实际使用中验证过的部分付费。这是本工作室的估算而非实测：具体数字取决于改造工作量。",
      uk: "Розробка такого самого з нуля коштує в середньому на 40–70% дорожче — це 21 000–25 500 $. І навіть з урахуванням ціни покупки доопрацювати готовий продукт під ваше завдання дешевше: ви платите лише за відмінності, а не за те, що вже написано й перевірено в роботі. Це оцінка студії, а не вимір: точна сума залежить від обсягу переробок.",
      pl: "Stworzenie takiego samego rozwiązania od zera kosztuje średnio o 40–70% więcej — to 21 000–25 500 $. Nawet po doliczeniu ceny zakupu dopracowanie gotowego produktu pod Twoje potrzeby wychodzi taniej: płacisz tylko za różnice, a nie za to, co już zostało napisane i sprawdzone w działaniu. To szacunek studia, a nie pomiar: dokładna kwota zależy od zakresu zmian.",
    },
  },
  {
    slug: "legal-ai",
    seoTitle: {
      ru: "ИИ-сервис юридического анализа документов — исходный код",
      en: "AI Legal Document Analysis Service — Source Code",
      uz: "Hujjatlarni yuridik tahlil qiluvchi AI-xizmat — manba kodi",
      zh: "AI 法律文书分析服务 — 源代码",
      uk: "ШІ-сервіс юридичного аналізу документів — вихідний код",
      pl: "Serwis AI do prawnej analizy dokumentów — kod źródłowy",
    },
    seoDescription: {
      ru: "Готовый сервис: клиент загружает документы по делу, получает разбор и готовый документ в Word. Вход по коду из SMS, оплата пакетами запросов. 3 500 $.",
      en: "A ready service: the client uploads case documents and gets an analysis plus a finished Word document. SMS-code sign-in, payment by request packages. $3,500.",
      uz: "Tayyor xizmat: mijoz ish hujjatlarini yuklaydi, tahlil va tayyor Word hujjatini oladi. SMS kodi bilan kirish, so'rov paketlari bilan to'lov. 3 500 $.",
      zh: "成品服务：客户上传案件文书，获得分析与生成的 Word 文档。短信验证码登录，按请求包付费。3,500 美元。",
      uk: "Готовий сервіс: клієнт завантажує документи у справі, отримує розбір і готовий документ у Word. Вхід за кодом з SMS, оплата пакетами запитів. 3 500 $.",
      pl: "Gotowy serwis: klient wgrywa dokumenty sprawy, dostaje analizę i gotowy dokument Word. Logowanie kodem SMS, płatność pakietami zapytań. 3 500 $.",
    },
    title: {
      ru: "ИИ-юрист: анализ документов",
      en: "AI Lawyer: Document Analysis",
      uz: "AI-yurist: hujjatlar tahlili",
      zh: "AI 律师：文书分析",
      uk: "ШІ-юрист: аналіз документів",
      pl: "Prawnik AI: analiza dokumentów",
    },
    tagline: {
      ru: "Загрузил дело — получил разбор и готовый документ",
      en: "Upload the case, get the analysis and a finished document",
      uz: "Ishni yukladingiz — tahlil va tayyor hujjat oldingiz",
      zh: "上传案件，获得分析与成稿文书",
      uk: "Завантажили справу — отримали розбір і готовий документ",
      pl: "Wgrywasz sprawę — dostajesz analizę i gotowy dokument",
    },
    priceUsd: 3500,
    description: {
      ru: "Сервис, в котором клиент загружает документы по своему делу и получает разбор, а следом — готовый юридический документ в формате Word с оформлением. Оплата не подпиской, а пакетами запросов: человек платит за конкретное дело, а не за месяц, в котором может ничего не понадобиться.",
      en: "A service where the client uploads the documents of their case, receives an analysis and then a finished, properly formatted legal document in Word. Payment is by request packages rather than subscription: a person pays for a specific case, not for a month in which they may need nothing.",
      uz: "Mijoz o'z ishi bo'yicha hujjatlarni yuklaydi va tahlil, keyin esa rasmiylashtirilgan tayyor yuridik hujjatni Word formatida oladi. To'lov obuna emas, so'rov paketlari bilan: inson aniq ish uchun to'laydi, hech nima kerak bo'lmasligi mumkin bo'lgan oy uchun emas.",
      zh: "客户上传自己案件的文书，先获得分析，随后得到排版规范的 Word 法律文书。付费方式为请求包而非订阅：为具体案件付费，而不是为可能什么都用不上的一个月付费。",
      uk: "Сервіс, у якому клієнт завантажує документи у своїй справі й отримує розбір, а слідом — готовий юридичний документ у форматі Word з оформленням. Оплата не за підпискою, а пакетами запитів: людина платить за конкретну справу, а не за місяць, у якому їй може нічого не знадобитися.",
      pl: "Serwis, w którym klient wgrywa dokumenty swojej sprawy i otrzymuje ich analizę, a zaraz potem — gotowy, sformatowany dokument prawny w formacie Word. Płatność nie w subskrypcji, tylko pakietami zapytań: człowiek płaci za konkretną sprawę, a nie za miesiąc, w którym może niczego nie potrzebować.",
    },
    blocks: [
      {
        title: { ru: "Работа с делом", en: "Working a case", uz: "Ish bilan ishlash", zh: "案件处理", uk: "Робота зі справою", pl: "Praca ze sprawą" },
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
          uk: [
            "Завантаження документів у справі, кілька файлів за раз",
            "Розбір із показом етапу: клієнт бачить, що відбувається, а не крутилку",
            "Історія справ у кабінеті, повернення до будь-якої та видалення",
            "Попередній перегляд результату до завантаження",
          ],
          pl: [
            "Wgrywanie dokumentów sprawy, kilka plików naraz",
            "Analiza z widocznym etapem: klient widzi, co się dzieje, a nie kręcące się kółko",
            "Historia spraw w panelu, powrót do dowolnej i usuwanie",
            "Podgląd wyniku przed pobraniem",
          ],
        },
      },
      {
        title: {
          ru: "Готовый документ",
          en: "The finished document",
          uz: "Tayyor hujjat",
          zh: "成稿文书",
          uk: "Готовий документ",
          pl: "Gotowy dokument",
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
          uk: [
            "Генерація у Word із заданими шрифтами, відступами й заголовками",
            "Оформлення за структурою юридичного документа, а не суцільний текст",
            "Звіт у справі окремим файлом",
            "Завантаження з кабінету будь-коли",
          ],
          pl: [
            "Generowanie w Wordzie z ustalonymi czcionkami, wcięciami i nagłówkami",
            "Układ zgodny ze strukturą dokumentu prawnego, a nie ciągły tekst",
            "Raport ze sprawy w osobnym pliku",
            "Pobieranie z panelu w dowolnym momencie",
          ],
        },
      },
      {
        title: { ru: "Вход и оплата", en: "Sign-in and payment", uz: "Kirish va to'lov", zh: "登录与付费", uk: "Вхід і оплата", pl: "Logowanie i płatność" },
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
          uk: [
            "Вхід за номером телефону з кодом, без пароля",
            "Звичайна реєстрація з поштою теж доступна",
            "Пакети запитів: від разового до пакета для юридичної фірми",
            "Баланс та історія платежів у кабінеті",
            "Сповіщення, коли запити закінчуються",
          ],
          pl: [
            "Logowanie numerem telefonu z kodem, bez hasła",
            "Dostępna jest też zwykła rejestracja przez e-mail",
            "Pakiety zapytań: od jednorazowego po pakiet dla kancelarii",
            "Saldo i historia płatności w panelu",
            "Powiadomienie, gdy kończą się zapytania",
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
      uk: [
        "Пакети запитів замість підписки — платять за справу, а не за місяць",
        "Разовий запит як дешевий вхід для фізичної особи",
        "Великі пакети для юридичних фірм і колегій",
        "Знижка першим клієнтам як інструмент запуску",
      ],
      pl: [
        "Pakiety zapytań zamiast subskrypcji — płaci się za sprawę, a nie za miesiąc",
        "Jednorazowe zapytanie jako tani start dla osoby prywatnej",
        "Duże pakiety dla kancelarii i izb adwokackich",
        "Rabat dla pierwszych klientów jako narzędzie na start",
      ],
    },
    readiness: {
      ru: "Сервис собран и работает: кабинет, загрузка, анализ, генерация документа и оплата. Тарифная сетка задана и требует подстройки под рынок покупателя.",
      en: "The service is assembled and working: cabinet, upload, analysis, document generation and payment. The tariff grid is defined and needs tuning to the buyer's market.",
      uz: "Xizmat yig'ilgan va ishlaydi: kabinet, yuklash, tahlil, hujjat yaratish va to'lov. Tarif to'ri belgilangan va xaridor bozoriga moslashtirishni talab qiladi.",
      zh: "服务已搭建并可运行：后台、上传、分析、文书生成与支付。套餐体系已定义，需按买方市场调整。",
      uk: "Сервіс зібраний і працює: кабінет, завантаження, аналіз, генерація документа й оплата. Тарифну сітку задано, її треба підлаштувати під ринок покупця.",
      pl: "Serwis jest zbudowany i działa: panel, wgrywanie, analiza, generowanie dokumentu i płatności. Cennik jest ustawiony i wymaga dopasowania do rynku kupującego.",
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
      uk: [
        "Ключ доступу до мовної моделі",
        "Шлюз для надсилання SMS з кодом входу",
        "Договір із платіжною системою",
        "Перевірка шаблонів документів юристом своєї юрисдикції",
      ],
      pl: [
        "Klucz dostępu do modelu językowego",
        "Bramka SMS do wysyłki kodów logowania",
        "Umowa z operatorem płatności",
        "Weryfikacja szablonów dokumentów przez prawnika z Twojej jurysdykcji",
      ],
    },
    savings: {
      ru: "Разработка такого же с нуля обходится в среднем на 40–70% дороже — это 4 900–5 950 $. И даже с учётом стоимости покупки доработка готового под вашу задачу выходит дешевле: платите только за отличия, а не за то, что уже написано и проверено в работе. Оценка студии, а не замер: точная цифра зависит от объёма переделок.",
      en: "Building the same from scratch costs on average 40–70% more — that is $4,900–5,950. And even counting the purchase price, adapting a ready product to your task comes out cheaper: you pay for the differences only, not for what is already written and proven in use. This is the studio's estimate, not a measurement: the exact figure depends on how much has to be reworked.",
      uz: "Xuddi shunday narsani noldan ishlab chiqish o'rtacha 40–70% qimmatga tushadi — bu 4 900–5 950 $. Sotib olish narxini hisobga olganda ham tayyorni sizning vazifangizga moslashtirish arzonroq: siz faqat farqlar uchun to'laysiz, allaqachon yozilgan va ishda sinalgan narsa uchun emas. Bu studiyaning bahosi, o'lchov emas: aniq raqam qayta ishlash hajmiga bog'liq.",
      zh: "从零开发同样的产品平均要贵 40–70% —— 约合4,900–5,950 美元。即便计入购买价格，将现成产品改造成您所需的方案依然更便宜：您只为差异付费，而不为已经写好并在实际使用中验证过的部分付费。这是本工作室的估算而非实测：具体数字取决于改造工作量。",
      uk: "Розробка такого самого з нуля коштує в середньому на 40–70% дорожче — це 4 900–5 950 $. І навіть з урахуванням ціни покупки доопрацювати готовий продукт під ваше завдання дешевше: ви платите лише за відмінності, а не за те, що вже написано й перевірено в роботі. Це оцінка студії, а не вимір: точна сума залежить від обсягу переробок.",
      pl: "Stworzenie takiego samego rozwiązania od zera kosztuje średnio o 40–70% więcej — to 4 900–5 950 $. Nawet po doliczeniu ceny zakupu dopracowanie gotowego produktu pod Twoje potrzeby wychodzi taniej: płacisz tylko za różnice, a nie za to, co już zostało napisane i sprawdzone w działaniu. To szacunek studia, a nie pomiar: dokładna kwota zależy od zakresu zmian.",
    },
  },
  {
    slug: "landing",
    seoTitle: {
      ru: "Лендинг под ключ в Ташкенте: цена от 500 $ — DevUz",
      en: "Turnkey Landing Page in Tashkent from $500 — DevUz",
      uz: "Toshkentda kalit topshirish landing sahifasi 500 $ dan — DevUz",
      zh: "塔什干交钥匙落地页，500 美元起 — DevUz",
      uk: "Лендинг під ключ у Ташкенті: ціна від 500 $ — DevUz",
      pl: "Landing page w Taszkencie: cena od 500 $ — DevUz",
    },
    seoDescription: {
      ru: "Лендинг на Next.js: статическая генерация, до четырёх языков, форма заявки в Telegram, две готовые концепции дизайна. От 500 до 2 500 $ в зависимости от сложности.",
      en: "A Next.js landing page: static generation, up to four languages, a Telegram lead form, two ready design concepts. From $500 to $2,500 depending on complexity.",
      uz: "Next.js'da landing: statik generatsiya, to'rttagacha til, Telegram'ga ariza shakli, ikkita tayyor dizayn konsepsiyasi. Murakkabligiga qarab 500 dan 2 500 $ gacha.",
      zh: "基于 Next.js 的落地页：静态生成、最多四种语言、Telegram 表单、两套现成设计方案。依复杂度 500 至 2,500 美元。",
      uk: "Лендинг на Next.js: статична генерація, до чотирьох мов, форма заявки в Telegram, дві готові концепції дизайну. Від 500 до 2 500 $ залежно від складності.",
      pl: "Landing page w Next.js: statyczne generowanie, do 4 języków, formularz do Telegrama, dwie gotowe koncepcje designu. Od 500 do 2 500 $ zależnie od złożoności.",
    },
    title: { ru: "Лендинг", en: "Landing Page", uz: "Landing sahifa", zh: "落地页", uk: "Лендинг", pl: "Landing page" },
    tagline: {
      ru: "Две готовые концепции дизайна, четыре языка, заявки в Telegram",
      en: "Two ready design concepts, four languages, leads into Telegram",
      uz: "Ikkita tayyor dizayn konsepsiyasi, to'rt til, Telegram'ga arizalar",
      zh: "两套现成设计方案、四种语言、线索直达 Telegram",
      uk: "Дві готові концепції дизайну, чотири мови, заявки в Telegram",
      pl: "Dwie gotowe koncepcje designu, cztery języki, zapytania w Telegramie",
    },
    priceUsd: 500,
    priceToUsd: 2500,
    description: {
      ru: "Одностраничник на том же движке, что и этот сайт: страницы собираются заранее и отдаются статикой, поэтому открываются мгновенно и хорошо индексируются. Две концепции дизайна уже нарисованы и написаны — кинематографичная тёмная и светлая каталожная; можно взять любую и перекрасить под свой бренд, а можно заказать свою. Анимации сделаны на CSS, без библиотек, поэтому не утяжеляют загрузку.",
      en: "A single-page site on the same engine as this one: pages are built ahead of time and served as static files, so they open instantly and index well. Two design concepts are already drawn and written — a cinematic dark one and a light catalogue one; take either and recolour it for your brand, or commission your own. Animations are pure CSS with no libraries, so they add nothing to load time.",
      uz: "Shu saytdagi kabi dvigatelda bir sahifali sayt: sahifalar oldindan yig'iladi va statik tarzda beriladi, shuning uchun bir zumda ochiladi va yaxshi indekslanadi. Ikkita dizayn konsepsiyasi allaqachon chizilgan — kinematografik qorong'i va yorug' katalog; istalganini olib brendingizga bo'yash yoki o'zingiznikini buyurtma qilish mumkin. Animatsiyalar CSS'da, kutubxonasiz.",
      zh: "与本站同引擎的单页站点：页面预先构建并以静态文件提供，因此打开迅速、易于收录。两套设计方案已完成 —— 电影感深色版与明亮目录版；可任选其一改配品牌色，也可定制专属方案。动画纯用 CSS 实现，不引入任何库，因而不增加加载负担。",
      uk: "Односторінковий сайт на тому самому рушії, що й цей сайт: сторінки збираються заздалегідь і віддаються як статика, тож відкриваються миттєво й добре індексуються. Дві концепції дизайну вже намальовані й зверстані — кінематографічна темна та світла каталожна; можна взяти будь-яку й перефарбувати під свій бренд, а можна замовити власну. Анімації зроблено на CSS, без бібліотек, тому вони не обтяжують завантаження.",
      pl: "Strona typu one page na tym samym silniku co ta strona: podstrony są budowane z wyprzedzeniem i serwowane statycznie, dlatego otwierają się błyskawicznie i dobrze się indeksują. Dwie koncepcje designu są już zaprojektowane i zakodowane — filmowa ciemna i jasna katalogowa; możesz wziąć dowolną i przemalować ją w barwy swojej marki albo zamówić własną. Animacje są zrobione w CSS, bez bibliotek, więc nie spowalniają ładowania.",
    },
    blocks: [
      {
        title: {
          ru: "500 $ — базовый",
          en: "$500 — basic",
          uz: "500 $ — asosiy",
          zh: "500 美元 —— 基础版",
          uk: "500 $ — базовий",
          pl: "500 $ — podstawowy",
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
          uk: [
            "Одна сторінка однією мовою",
            "Готова концепція дизайну, перефарбована під ваш бренд",
            "Форма заявки з надсиланням у Telegram",
            "Метадані, карта сайту, розмітка для пошуку",
            "Розгортання на вашому домені",
          ],
          pl: [
            "Jedna strona w jednym języku",
            "Gotowa koncepcja designu w barwach Twojej marki",
            "Formularz zgłoszeń z wysyłką do Telegrama",
            "Metadane, mapa strony, znaczniki dla wyszukiwarek",
            "Wdrożenie na Twojej domenie",
          ],
        },
      },
      {
        title: {
          ru: "1 500 $ — многоязычный",
          en: "$1,500 — multilingual",
          uz: "1 500 $ — ko'p tilli",
          zh: "1,500 美元 —— 多语言版",
          uk: "1 500 $ — багатомовний",
          pl: "1 500 $ — wielojęzyczny",
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
          uk: [
            "До чотирьох мов з автовизначенням і перемикачем",
            "Власна структура секцій під ваш продукт, а не готова «риба»",
            "Розширена форма й передавання заявки у вашу CRM",
            "Налаштування hreflang, щоб мовні версії не конкурували у видачі",
            "Аналітика та цілі",
          ],
          pl: [
            "Do czterech języków z automatycznym wykrywaniem i przełącznikiem",
            "Własny układ sekcji pod Twój produkt, a nie gotowy szablon",
            "Rozbudowany formularz i przekazywanie zapytań do Twojego CRM",
            "Konfiguracja hreflang, aby wersje językowe nie konkurowały w wynikach",
            "Analityka i cele",
          ],
        },
      },
      {
        title: {
          ru: "2 500 $ — со своим дизайном и админкой",
          en: "$2,500 — custom design with an admin panel",
          uz: "2 500 $ — o'z dizayni va admin paneli bilan",
          zh: "2,500 美元 —— 定制设计并带后台",
          uk: "2 500 $ — з власним дизайном і адмінкою",
          pl: "2 500 $ — z własnym designem i panelem",
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
          uk: [
            "Власна концепція дизайну, намальована саме для вас, а не перефарбована",
            "Внутрішні сторінки: каталог, новини, про компанію",
            "Адмінка: ви самі додаєте товари, новини й фотографії",
            "Складні анімації та сцени прокручування",
            "Перенесення контенту з чинного сайту",
          ],
          pl: [
            "Własna koncepcja designu, zaprojektowana dla Ciebie, a nie przemalowana",
            "Podstrony: katalog, aktualności, o firmie",
            "Panel admina: sam dodajesz produkty, aktualności i zdjęcia",
            "Złożone animacje i sceny przewijania",
            "Przeniesienie treści z obecnej strony",
          ],
        },
      },
    ],
    tech: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS v4", "Supabase"],
    /**
     * Три концепции ADAR — живой экземпляр этого самого продукта.
     *
     * Снято `scripts/product-shots.mjs` с работающего сайта; полоса выбора
     * варианта и значок цены убраны при съёмке: это витрина демонстрации, а
     * не часть продукта.
     */
    shots: [
      {
        src: "/products/landing/vitrina.webp",
        width: 1920,
        height: 1200,
        caption: {
          ru: "Концепция «Витрина»: первый экран с крупным фото товара и двумя действиями — каталог и расчёт партии",
          en: "The “Showcase” concept: a hero screen with one large product photo and two actions — catalogue and bulk quote",
          uz: "«Vitrina» konsepsiyasi: yirik mahsulot surati va ikkita amal — katalog hamda partiya hisobi",
          zh: "「展示」方案：首屏为大幅商品照片，配两个操作——目录与批量报价",
          uk: "Концепція «Вітрина»: перший екран із великим фото товару та двома діями — каталог і розрахунок партії",
          pl: "Koncepcja „Witryna”: pierwszy ekran z dużym zdjęciem produktu i dwoma przyciskami — katalog i wycena partii",
        },
      },
      {
        src: "/products/landing/katalog.webp",
        width: 1920,
        height: 1200,
        caption: {
          ru: "Концепция «Каталог»: поиск по составу набора вынесен на первый экран",
          en: "The “Catalogue” concept: search by what is inside the set, right on the first screen",
          uz: "«Katalog» konsepsiyasi: to‘plam tarkibi bo‘yicha qidiruv birinchi ekranda",
          zh: "「目录」方案：按礼盒内容搜索，直接放在首屏",
          uk: "Концепція «Каталог»: пошук за складом набору винесено на перший екран",
          pl: "Koncepcja „Katalog”: wyszukiwanie po składzie zestawu na pierwszym ekranie",
        },
      },
      {
        src: "/products/landing/premium.webp",
        width: 1920,
        height: 1200,
        caption: {
          ru: "Концепция «Премиум»: тёмный первый экран с барабаном архива работ",
          en: "The “Premium” concept: a dark hero screen with a rotating archive of past work",
          uz: "«Premium» konsepsiyasi: ishlar arxivi aylanadigan to‘q rangli birinchi ekran",
          zh: "「高端」方案：深色首屏，带可旋转的作品档案",
          uk: "Концепція «Преміум»: темний перший екран із барабаном архіву робіт",
          pl: "Koncepcja „Premium”: ciemny pierwszy ekran z bębnem archiwum realizacji",
        },
      },
    ],
    readiness: {
      ru: "Обе концепции дизайна написаны и работают, их можно посмотреть до заказа. Срок от согласования до запуска — от недели для базового варианта.",
      en: "Both design concepts are written and working; you can see them before ordering. From sign-off to launch: a week and up for the basic option.",
      uz: "Ikkala dizayn konsepsiyasi yozilgan va ishlaydi, buyurtmadan oldin ko'rish mumkin. Kelishuvdan ishga tushirishgacha — asosiy variant uchun bir haftadan.",
      zh: "两套设计方案均已实现并可运行，下单前即可查看。从确认到上线：基础版一周起。",
      uk: "Обидві концепції дизайну зверстані й працюють, їх можна подивитися до замовлення. Термін від погодження до запуску — від тижня для базового варіанта.",
      pl: "Obie koncepcje designu są zakodowane i działają — możesz je obejrzeć przed zamówieniem. Czas od uzgodnień do startu — od tygodnia w wariancie podstawowym.",
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
      uk: [
        "Домен і доступ до його налаштувань",
        "Тексти й фотографії або завдання на їх підготовку",
        "Логотип і фірмові кольори, якщо вони є",
        "Чат у Telegram або доступ до CRM для приймання заявок",
      ],
      pl: [
        "Domena i dostęp do jej ustawień",
        "Teksty i zdjęcia albo brief do ich przygotowania",
        "Logo i kolory firmowe, jeśli je masz",
        "Czat w Telegramie lub dostęp do CRM do odbioru zapytań",
      ],
    },
    savings: {
      ru: "Разработка такого же с нуля обходится в среднем на 40–70% дороже — это 1 120–4 250 $. И даже с учётом стоимости покупки доработка готового под вашу задачу выходит дешевле: платите только за отличия, а не за то, что уже написано и проверено в работе. Оценка студии, а не замер: точная цифра зависит от объёма переделок.",
      en: "Building the same from scratch costs on average 40–70% more — that is $1,120–4,250. And even counting the purchase price, adapting a ready product to your task comes out cheaper: you pay for the differences only, not for what is already written and proven in use. This is the studio's estimate, not a measurement: the exact figure depends on how much has to be reworked.",
      uz: "Xuddi shunday narsani noldan ishlab chiqish o'rtacha 40–70% qimmatga tushadi — bu 1 120–4 250 $. Sotib olish narxini hisobga olganda ham tayyorni sizning vazifangizga moslashtirish arzonroq: siz faqat farqlar uchun to'laysiz, allaqachon yozilgan va ishda sinalgan narsa uchun emas. Bu studiyaning bahosi, o'lchov emas: aniq raqam qayta ishlash hajmiga bog'liq.",
      zh: "从零开发同样的产品平均要贵 40–70% —— 约合1,120–4,250 美元。即便计入购买价格，将现成产品改造成您所需的方案依然更便宜：您只为差异付费，而不为已经写好并在实际使用中验证过的部分付费。这是本工作室的估算而非实测：具体数字取决于改造工作量。",
      uk: "Розробка такого самого з нуля коштує в середньому на 40–70% дорожче — це 1 120–4 250 $. І навіть з урахуванням ціни покупки доопрацювати готовий продукт під ваше завдання дешевше: ви платите лише за відмінності, а не за те, що вже написано й перевірено в роботі. Це оцінка студії, а не вимір: точна сума залежить від обсягу переробок.",
      pl: "Stworzenie takiego samego rozwiązania od zera kosztuje średnio o 40–70% więcej — to 1 120–4 250 $. Nawet po doliczeniu ceny zakupu dopracowanie gotowego produktu pod Twoje potrzeby wychodzi taniej: płacisz tylko za różnice, a nie za to, co już zostało napisane i sprawdzone w działaniu. To szacunek studia, a nie pomiar: dokładna kwota zależy od zakresu zmian.",
    },
  },
  {
    slug: "marketplace",
    seoTitle: {
      ru: "Готовый маркетплейс на микросервисах — исходный код",
      en: "Ready-Made Microservice Marketplace — Source Code",
      uz: "Mikroservislarda tayyor marketpleys — manba kodi",
      zh: "成品微服务电商平台 — 源代码",
      uk: "Готовий маркетплейс на мікросервісах — вихідний код",
      pl: "Gotowy marketplace na mikroserwisach — kod źródłowy",
    },
    seoDescription: {
      ru: "Исходный код маркетплейса: 35 компонентов, 21 сервис на Java и Spring, каталог с поиском, платежи, склад, логистика, ОФД и интеграции для Узбекистана. 30 000 $.",
      en: "Marketplace source code: 35 components, 21 services on Java and Spring, catalogue with search, payments, warehouse, logistics, fiscal receipts and Uzbek integrations. $30,000.",
      uz: "Marketpleys manba kodi: 35 komponent, Java va Spring'da 21 servis, qidiruvli katalog, to'lovlar, ombor, logistika, OFD va O'zbekiston integratsiyalari. 30 000 $.",
      zh: "电商平台源代码：共 35 个组件，其中 21 个基于 Java 与 Spring 的服务，含搜索目录、支付、仓储、物流、财政票据及乌兹别克本地集成。30,000 美元。",
      uk: "Вихідний код маркетплейсу: 35 компонентів, 21 сервіс на Java і Spring, каталог і пошук, платежі, склад, логістика, ОФД й інтеграції для Узбекистану. 30 000 $.",
      pl: "Kod marketplace’u: 35 komponentów, 21 serwisów Java i Spring, katalog z wyszukiwarką, płatności, magazyn, logistyka, OFD i integracje dla Uzbekistanu. 30 000 $.",
    },
    title: {
      ru: "Маркетплейс на микросервисах",
      en: "Microservice Marketplace",
      uz: "Mikroservislarda marketpleys",
      zh: "微服务电商平台",
      uk: "Маркетплейс на мікросервісах",
      pl: "Marketplace na mikroserwisach",
    },
    tagline: {
      ru: "35 компонентов, шлюз, шина сообщений, оркестрация процессов",
      en: "35 components, a gateway, a message bus, process orchestration",
      uz: "35 komponent, shlyuz, xabarlar shinasi, jarayonlar orkestratsiyasi",
      zh: "35 个组件、网关、消息总线、流程编排",
      uk: "35 компонентів, шлюз, шина повідомлень, оркестрація процесів",
      pl: "35 komponentów, bramka, szyna komunikatów, orkiestracja procesów",
    },
    priceUsd: 30000,
    description: {
      ru: "Исходный код полноценного маркетплейса корпоративного масштаба: тридцать пять компонентов, из них двадцать один backend-сервис на Java и Spring за единым шлюзом, у каждого своя база, между ними — асинхронная шина, а бизнес-процессы описаны и исполняются движком оркестрации, а не расставлены по коду условиями. Это не витрина с корзиной: здесь склад, логистика, биллинг, фискальные чеки, кэшбэк и три отдельных фронтенда — покупателю, продавцу и складу.",
      en: "The source code of a full enterprise-scale marketplace: thirty-five components, twenty-one of them Java and Spring backend services behind a single gateway, each with its own database, an asynchronous bus between them, and business processes described and executed by an orchestration engine rather than scattered through the code as conditionals. This is not a storefront with a cart: it has warehousing, logistics, billing, fiscal receipts, cashback and three separate frontends — for the buyer, the seller and the warehouse.",
      uz: "To'laqonli korporativ miqyosdagi marketpleysning manba kodi: o'ttiz beshta komponent, ulardan yigirma bittasi yagona shlyuz ortidagi Java va Spring backend-servislari, har birida o'z bazasi, ular orasida asinxron shina, biznes-jarayonlar esa kodga shartlar bilan sochilgan emas, orkestratsiya dvigateli tomonidan bajariladi. Bu savatli vitrina emas: bu yerda ombor, logistika, billing, fiskal cheklar, keshbek va uchta alohida frontend bor.",
      zh: "一套企业级电商平台的完整源代码：共三十五个组件，其中二十一个是单一网关之后的 Java 与 Spring 后端服务，各自独立数据库，服务间通过异步消息总线通信，业务流程由编排引擎描述并执行，而非以条件语句散落在代码中。这不是带购物车的展示页：其中包含仓储、物流、计费、财政票据、返现，以及面向买家、卖家与仓库的三套独立前端。",
      uk: "Вихідний код повноцінного маркетплейсу корпоративного масштабу: тридцять п'ять компонентів, із них двадцять один backend-сервіс на Java і Spring за єдиним шлюзом, у кожного своя база, між ними — асинхронна шина, а бізнес-процеси описані й виконуються рушієм оркестрації, а не розкидані по коду умовами. Це не вітрина з кошиком: тут склад, логістика, білінг, фіскальні чеки, кешбек і три окремі фронтенди — для покупця, продавця та складу.",
      pl: "Kod źródłowy pełnoprawnego marketplace’u na skalę korporacyjną: trzydzieści pięć komponentów, w tym dwadzieścia jeden serwisów backendowych w Javie i Springu za wspólną bramką, każdy z własną bazą, między nimi — asynchroniczna szyna, a procesy biznesowe są opisane i wykonywane przez silnik orkiestracji, a nie rozsiane po kodzie w warunkach. To nie witryna z koszykiem: jest tu magazyn, logistyka, billing, paragony fiskalne, cashback i trzy osobne frontendy — dla kupującego, sprzedawcy i magazynu.",
    },
    blocks: [
      {
        title: {
          ru: "Сервисы: торговля",
          en: "Services: commerce",
          uz: "Servislar: savdo",
          zh: "服务：交易",
          uk: "Сервіси: торгівля",
          pl: "Serwisy: handel",
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
          uk: [
            "Каталог: товари, категорії, атрибути, модерація карток",
            "Пошук на Elasticsearch: фасети, синоніми, ранжування",
            "Продажі: замовлення, скасування, повернення, статуси",
            "Оформлення замовлення окремим сервісом і фронтендом",
            "Контент продавців: відгуки, запитання, медіа",
            "CMS: банери, добірки, статичні сторінки",
          ],
          pl: [
            "Katalog: produkty, kategorie, atrybuty, moderacja kart",
            "Wyszukiwanie na Elasticsearch: fasety, synonimy, ranking",
            "Sprzedaż: zamówienia, anulowania, zwroty, statusy",
            "Składanie zamówienia jako osobny serwis i frontend",
            "Treści sprzedawców: opinie, pytania, media",
            "CMS: banery, kolekcje, strony statyczne",
          ],
        },
      },
      {
        title: {
          ru: "Сервисы: деньги и склад",
          en: "Services: money and warehouse",
          uz: "Servislar: pul va ombor",
          zh: "服务：资金与仓储",
          uk: "Сервіси: гроші та склад",
          pl: "Serwisy: pieniądze i magazyn",
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
          uk: [
            "Платіжний шлюз: приймання оплати, холдування, повернення",
            "Білінг: розрахунки з продавцями, комісії, взаєморозрахунки",
            "ОФД: фіскальні чеки й передавання до податкової",
            "Генератор чеків на NestJS з рендерингом у PDF",
            "Склад: залишки, приймання, відвантаження, інвентаризація",
            "Логістика: доставка, маршрути, статуси відправлень",
            "Бонуси й кешбек окремим сервісом",
          ],
          pl: [
            "Bramka płatności: przyjmowanie płatności, blokada środków, zwroty",
            "Billing: rozliczenia ze sprzedawcami, prowizje, rozrachunki",
            "OFD: paragony fiskalne i przekazywanie do urzędu skarbowego",
            "Generator paragonów w NestJS z renderowaniem do PDF",
            "Magazyn: stany, przyjęcia, wydania, inwentaryzacja",
            "Logistyka: dostawy, trasy, statusy przesyłek",
            "Bonusy i cashback jako osobny serwis",
          ],
        },
      },
      {
        title: {
          ru: "Фронтенды и боты",
          en: "Frontends and bots",
          uz: "Frontendlar va botlar",
          zh: "前端与机器人",
          uk: "Фронтенди та боти",
          pl: "Frontendy i boty",
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
          uk: [
            "Вітрина й сайт покупця на Next.js",
            "Кабінет продавця й адмінка платформи на React",
            "Інтерфейс складу (WMS) окремим застосунком",
            "Власний UI-кит і набір іконок — спільні для всіх фронтендів",
            "Бот продавця й бот транспортної служби в Telegram",
          ],
          pl: [
            "Witryna i strona kupującego w Next.js",
            "Panel sprzedawcy i panel admina platformy w React",
            "Interfejs magazynu (WMS) jako osobna aplikacja",
            "Własny UI kit i zestaw ikon — wspólne dla wszystkich frontendów",
            "Bot sprzedawcy i bot firmy transportowej w Telegramie",
          ],
        },
      },
      {
        title: {
          ru: "Инфраструктура и интеграции",
          en: "Infrastructure and integrations",
          uz: "Infratuzilma va integratsiyalar",
          zh: "基础设施与集成",
          uk: "Інфраструктура та інтеграції",
          pl: "Infrastruktura i integracje",
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
          uk: [
            "Єдиний шлюз на Spring Cloud Gateway перед усіма сервісами",
            "Асинхронна шина на RabbitMQ між сервісами",
            "Бізнес-процеси в рушії оркестрації Camunda, а не в коді",
            "Окрема база PostgreSQL для кожного сервісу, спільний Redis для сесій і прав",
            "Інтеграції під ринок Узбекистану: Click, Uzum, Didox, ОФД, НСІ",
            "Секрети винесено в змінні оточення, у коді їх немає",
          ],
          pl: [
            "Wspólna bramka na Spring Cloud Gateway przed wszystkimi serwisami",
            "Asynchroniczna szyna na RabbitMQ między serwisami",
            "Procesy biznesowe w silniku orkiestracji Camunda, a nie w kodzie",
            "Osobna baza PostgreSQL dla każdego serwisu, wspólny Redis na sesje i uprawnienia",
            "Integracje pod rynek Uzbekistanu: Click, Uzum, Didox, OFD, NSI",
            "Sekrety wyniesione do zmiennych środowiskowych, w kodzie ich nie ma",
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
      uk: [
        "Комісія з продажів продавців — основна модель майданчика",
        "Платне просування товарів у пошуку й добірках",
        "Абонентська плата за розширений кабінет продавця",
        "Складські й логістичні послуги майданчика за окрему плату",
        "Реклама й банери на вітрині",
      ],
      pl: [
        "Prowizja od sprzedaży sprzedawców — główny model platformy",
        "Płatna promocja produktów w wyszukiwarce i kolekcjach",
        "Abonament za rozszerzony panel sprzedawcy",
        "Usługi magazynowe i logistyczne platformy za dodatkową opłatą",
        "Reklamy i banery w witrynie",
      ],
    },
    readiness: {
      ru: "Код работавшего маркетплейса, а не заготовка: все тридцать пять компонентов написаны и связаны между собой. Но это корпоративная система, и развернуть её — не «поднять контейнер»: нужен кластер, отдельные базы, брокер сообщений, поисковый кластер и человек, который это обслуживает. Оценивайте не только цену покупки, но и стоимость эксплуатации.",
      en: "The code of a marketplace that ran, not a skeleton: all thirty-five components are written and wired together. But it is an enterprise system, and deploying it is not «bring up a container»: it needs a cluster, separate databases, a message broker, a search cluster and someone to operate all of it. Budget for running costs, not just the purchase price.",
      uz: "Bu andoza emas, ishlagan marketpleys kodi: o'ttiz beshta komponentning barchasi yozilgan va o'zaro bog'langan. Lekin bu korporativ tizim va uni joylashtirish «konteyner ko'tarish» emas: klaster, alohida bazalar, xabar brokeri, qidiruv klasteri va buni qo'llab-quvvatlaydigan odam kerak. Faqat sotib olish narxini emas, ekspluatatsiya xarajatini ham baholang.",
      zh: "这是曾实际运行过的电商平台代码，而非骨架：三十五个组件均已实现并相互打通。但它是企业级系统，部署并非「起一个容器」：需要集群、独立数据库、消息代理、搜索集群，以及负责运维的人。请把运行成本也纳入预算，而不仅是购买价格。",
      uk: "Код маркетплейсу, що працював, а не заготовка: усі тридцять п'ять компонентів написані й пов'язані між собою. Але це корпоративна система, і розгорнути її — не «підняти контейнер»: потрібні кластер, окремі бази, брокер повідомлень, пошуковий кластер і людина, яка все це обслуговує. Оцінюйте не лише ціну покупки, а й вартість експлуатації.",
      pl: "Kod działającego marketplace’u, a nie szkielet: wszystkie trzydzieści pięć komponentów jest napisanych i połączonych ze sobą. Ale to system korporacyjny i jego wdrożenie to nie „postawienie kontenera”: potrzebny jest klaster, osobne bazy, broker komunikatów, klaster wyszukiwania i osoba, która to utrzymuje. Licz nie tylko cenę zakupu, ale też koszt utrzymania.",
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
      uk: [
        "Інфраструктура: кластер, бази, брокер повідомлень, пошуковий кластер",
        "Інженер з експлуатації — система мікросервісна, сама себе не обслуговуватиме",
        "Договори з платіжними системами та оператором фіскальних даних",
        "Власні ключі до всіх зовнішніх інтеграцій",
        "Юридичне оформлення майданчика й договори з продавцями",
      ],
      pl: [
        "Infrastruktura: klaster, bazy, broker komunikatów, klaster wyszukiwania",
        "Inżynier utrzymania — system jest mikroserwisowy i sam się nie obsłuży",
        "Umowy z operatorami płatności i operatorem danych fiskalnych",
        "Własne klucze do wszystkich zewnętrznych integracji",
        "Formalności prawne platformy i umowy ze sprzedawcami",
      ],
    },
    savings: {
      ru: "Разработка такого же с нуля обходится в среднем на 40–70% дороже — это 42 000–51 000 $. И даже с учётом стоимости покупки доработка готового под вашу задачу выходит дешевле: платите только за отличия, а не за то, что уже написано и проверено в работе. Оценка студии, а не замер: точная цифра зависит от объёма переделок.",
      en: "Building the same from scratch costs on average 40–70% more — that is $42,000–51,000. And even counting the purchase price, adapting a ready product to your task comes out cheaper: you pay for the differences only, not for what is already written and proven in use. This is the studio's estimate, not a measurement: the exact figure depends on how much has to be reworked.",
      uz: "Xuddi shunday narsani noldan ishlab chiqish o'rtacha 40–70% qimmatga tushadi — bu 42 000–51 000 $. Sotib olish narxini hisobga olganda ham tayyorni sizning vazifangizga moslashtirish arzonroq: siz faqat farqlar uchun to'laysiz, allaqachon yozilgan va ishda sinalgan narsa uchun emas. Bu studiyaning bahosi, o'lchov emas: aniq raqam qayta ishlash hajmiga bog'liq.",
      zh: "从零开发同样的产品平均要贵 40–70% —— 约合 42,000–51,000 美元。即便计入购买价格，将现成产品改造成您所需的方案依然更便宜：您只为差异付费，而不为已经写好并在实际使用中验证过的部分付费。这是本工作室的估算而非实测：具体数字取决于改造工作量。",
      uk: "Розробка такого самого з нуля коштує в середньому на 40–70% дорожче — це 42 000–51 000 $. І навіть з урахуванням ціни покупки доопрацювати готовий продукт під ваше завдання дешевше: ви платите лише за відмінності, а не за те, що вже написано й перевірено в роботі. Це оцінка студії, а не вимір: точна сума залежить від обсягу переробок.",
      pl: "Stworzenie takiego samego rozwiązania od zera kosztuje średnio o 40–70% więcej — to 42 000–51 000 $. Nawet po doliczeniu ceny zakupu dopracowanie gotowego produktu pod Twoje potrzeby wychodzi taniej: płacisz tylko za różnice, a nie za to, co już zostało napisane i sprawdzone w działaniu. To szacunek studia, a nie pomiar: dokładna kwota zależy od zakresu zmian.",
    },
  },
];

/** Продукт по slug — для страницы карточки и разметки. */
export function productBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
