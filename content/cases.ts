import type { LocalizedText } from "@/lib/i18n";

/**
 * Библиотека проектов.
 *
 * У файла две роли. Первая — витрина кейсов на сайте. Вторая, менее очевидная:
 * это база, по которой AI-менеджер оценивает нашу экспертность в нише клиента
 * при ICP-скоринге. Поэтому у каждого кейса есть `niches` — список ниш, к
 * которым он относится, в терминах, которыми говорит клиент.
 *
 * Порядок в массиве — редакторский, не по году: все проекты 2026-го, сортировать
 * нечем. Первым идёт то, чем студия представляется сейчас, и этот же порядок
 * определяет шесть карточек на главной — она берёт начало списка.
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
  /**
   * Ниши классификатора, для которых этот проект — честный пример.
   *
   * Список ключей из content/razbor/catalog.ts, проставленный руками. Без
   * него подбор шёл по общим словам из `niches` — и ловил не то: у MAVERA
   * в нишах стоит «quruvchi kompaniya», у логистики в приметах —
   * «logistika kompaniya», общее слово «kompaniya», и застройщик уезжал в
   * письмо логистической компании как пример её ниши. Такую ошибку
   * адресат видит первым же переходом по ссылке.
   *
   * Пусто — значит этот проект не показываем как пример ниши вовсе.
   */
  forNiches: readonly string[];
  category: LocalizedText;
  summary: LocalizedText;
  description: LocalizedText;
  tech: string[];
  metrics: Array<{ value: string; label: LocalizedText }>;
  /** Оттенок карточки — задаёт градиент превью. */
  accent: "green" | "blue" | "gold" | "violet";
  /**
   * Монограмма для превью — две-три буквы, которыми проект узнаётся.
   *
   * Задаётся руками, а не выводится из названия. Автоматика ошибается там,
   * где ошибаться нельзя: «USTA» — уже аббревиатура, и резать её до «US»
   * бессмысленно, а «Harvest in Motion» по первым буквам слов даёт «HiM».
   * Правило выбирает человек, глядя на конкретное имя.
   */
  monogram: string;
  /**
   * Сайт заказчика до нас — для шторки «было / стало» на странице кейса.
   *
   * Снимки первого экрана лежат в public/cases/<slug>/: before-desktop,
   * before-mobile, after-desktop, after-mobile (.webp; компьютер 1440×900,
   * телефон 390×844 в двойной плотности). `site` — адрес старого сайта, как
   * он подписан под шторкой; `taken` — когда снято, ГГГГ-ММ: старый сайт
   * живёт своей жизнью, и снимок честно говорит, от какого он числа.
   */
  compare?: { site: string; taken: string; parts: readonly ComparePart[] };
};

/**
 * Разделы, которые сравниваются шторками «было / стало». Ключ — часть имени
 * снимка (`<part>-before-desktop.webp`), подпись — в словаре, `cases.compareParts`.
 * Раздел берётся, только если он есть на обоих сайтах: сравнение «в тех же
 * пунктах», а не «наш лучший блок против их худшего».
 */
export const COMPARE_PARTS = [
  "hero",
  "calculator",
  "picker",
  "showcase",
  "catalog",
  "product",
  "themes",
  "projects",
  "works",
  "commerce",
  "mortgage",
  "quality",
  "production",
  "steps",
  "materials",
  "clients",
  "about",
  "team",
  "news",
  "faq",
  "contacts",
] as const;
export type ComparePart = (typeof COMPARE_PARTS)[number];

export const cases: Case[] = [
  {
    slug: "devuz",
    name: "DevUz Studio",
    monogram: "DU",
    year: 2026,
    url: "https://devuz.studio",
    tier: 2,
    niches: ["сайт компании", "корпоративный сайт", "лендинг", "мультиязычный сайт", "AI-менеджер", "чат-бот на сайт", "услуги", "corporate website", "veb-sayt", "企业官网"],
    forNiches: [],
    accent: "green",
    category: {
      ru: "Сайт студии + AI-менеджер",
      en: "Studio site + AI manager",
      uz: "Studiya sayti + AI menejer",
      zh: "工作室官网 + AI 客户经理",
    },
    summary: {
      ru: "Сайт, который вы сейчас открыли: четыре языка, сцена сборки кода на прокрутке и менеджер на LLM, который разбирается в задаче до разговора с человеком.",
      en: "The site you are reading right now: four languages, a scroll-driven code-assembly scene and an LLM manager that works out the task before a human joins.",
      uz: "Siz hozir ochib turgan sayt: to‘rt til, skroll bilan boshqariladigan kod yig‘ilish sahnasi va odam qo‘shilishidan oldin vazifani tushunib oladigan LLM menejer.",
      zh: "您此刻正在浏览的网站：四种语言、随滚动推进的代码编译场景，以及在真人介入之前就厘清需求的 LLM 客户经理。",
    },
    description: {
      ru: "Собственный сайт студии и одновременно её первая линия продаж. Герой здесь не картинка: пока человек листает, на экране собирается та самая функция, которая квалифицирует лида и уходит в Telegram. Дальше калькулятор, считающий вилку по тем же правилам, что и менеджер, и чат: отвечает AI-менеджер, разбирает задачу по ICP и BANT и отдаёт живому менеджеру готовое резюме — клиенту не приходится рассказывать всё заново. Четыре языка с hreflang и своей обложкой на каждый, страницы генерируются статически, деплой — Docker за хостовым nginx. Ни одной анимационной библиотеки на клиенте: сцена сборки, дождь кода и появление блоков сделаны на CSS и одном IntersectionObserver.",
      en: "The studio's own site, and at the same time its first line of sales. The hero is not a picture: as the visitor scrolls, the screen assembles the very function that qualifies a lead and sends it to Telegram. Then a calculator that estimates the range by the same rules a manager uses, and a chat: the AI manager answers, scores the task on ICP and BANT, and hands a finished summary to the human manager — the client never has to tell the story twice. Four languages with hreflang and a cover image of its own for each, statically generated pages, deployment in Docker behind the host nginx. Not a single animation library ships to the client: the assembly scene, the code rain and the block reveals run on CSS and one IntersectionObserver.",
      uz: "Studiyaning o‘z sayti va ayni paytda uning birinchi savdo liniyasi. Bu yerdagi hero rasm emas: odam varaqlagani sari ekranda lidni baholaydigan va Telegramga yuboradigan aynan o‘sha funksiya yig‘iladi. Keyin menejer bilan bir xil qoidalar bo‘yicha narx oralig‘ini hisoblaydigan kalkulyator va chat: AI menejer javob beradi, vazifani ICP va BANT bo‘yicha baholaydi va tirik menejerga tayyor xulosani uzatadi — mijoz hammasini qaytadan aytib berishi shart emas. hreflang bilan to‘rt til va har biriga alohida muqova, sahifalar statik generatsiya qilinadi, deploy — host nginx ortidagi Docker. Mijozga birorta ham animatsiya kutubxonasi yuborilmaydi: yig‘ilish sahnasi, kod yomg‘iri va bloklarning paydo bo‘lishi CSS va bitta IntersectionObserver’da ishlaydi.",
      zh: "工作室自己的网站，同时也是它的销售第一线。首屏并非一张图片：访客向下滚动时，屏幕上逐行组装出的，正是那个为线索打分并推送到 Telegram 的函数。往下是按客户经理同一套规则给出价格区间的计算器，以及在线沟通：AI 客户经理负责应答，按 ICP 与 BANT 对需求评分，并把整理好的摘要交给真人经理 —— 客户无需把同样的话再讲一遍。四种语言均配有 hreflang 与各自的分享封面，页面静态生成，部署在宿主 nginx 之后的 Docker 中。客户端不加载任何动画库：编译场景、代码雨与区块出场全部依靠 CSS 与一个 IntersectionObserver 实现。",
    },
    tech: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS v4", "LLM API", "Supabase", "Docker"],
    metrics: [
      { value: "4", label: { ru: "языка с hreflang-разметкой", en: "languages with hreflang markup", uz: "hreflang belgilangan til", zh: "带 hreflang 标注的语言" } },
      { value: "20s", label: { ru: "гарантия первого ответа в чате", en: "guaranteed first reply in chat", uz: "chatdagi birinchi javob kafolati", zh: "在线沟通首次回复承诺" } },
      { value: "0", label: { ru: "КБ анимационных библиотек", en: "KB of animation libraries", uz: "KB animatsiya kutubxonasi", zh: "动画库体积（KB）" } },
    ],
  },
  {
    slug: "mavera",
    name: "MAVERA",
    monogram: "MV",
    year: 2026,
    url: "https://globalex.maximov-tech.ru/mavera",
    tier: 1,
    niches: ["застройщик", "недвижимость", "жилой комплекс", "продажа квартир", "подбор квартиры", "ипотечный калькулятор", "real estate", "property developer", "ko‘chmas mulk", "quruvchi kompaniya", "房地产", "开发商"],
    forNiches: ["nedvizhimost", "stroitelnaya-kompaniya"],
    accent: "blue",
    category: {
      ru: "Три сайта застройщика + конструктор допников",
      en: "Three developer sites + add-on configurator",
      uz: "Quruvchi uchun uchta sayt + qo‘shimchalar konstruktori",
      zh: "三套开发商网站 + 增值功能配置器",
    },
    summary: {
      ru: "Три рабочих сайта для застройщика — строгий каталог, журнальный разворот и кинематографичный премиум — с карточкой ЖК, подбором квартиры, ипотечным калькулятором и конструктором, где допники включаются тумблером и сразу меняют страницу.",
      en: "Three working sites for a property developer — a strict catalogue, a magazine spread and a cinematic premium — with project pages, a flat picker, a mortgage calculator and a configurator where add-ons switch on with a toggle and change the page at once.",
      uz: "Quruvchi kompaniya uchun uchta ishlaydigan sayt — qat’iy katalog, jurnal sahifasi va kinematografik premium — turar-joy majmuasi kartochkasi, kvartira tanlash, ipoteka kalkulyatori va qo‘shimchalar tumbler bilan yoqilib, sahifani darhol o‘zgartiradigan konstruktor bilan.",
      zh: "为房地产开发商打造的三套可运行网站 —— 严谨目录版、杂志跨页版与电影感高端版 —— 含楼盘页、选房器、房贷计算器，以及一个配置器：拨动开关即可启用增值功能，页面随即变化。",
    },
    description: {
      ru: "Бриф с вилкой бюджета и три референса превратились в три полных сайта, различающихся не палитрой, а школой оформления: швейцарская сетка, журнальный разворот с буквицей и параллаксом, тёмный кинозал со сценами во весь экран, генпланом и шахматкой. В каждом можно провалиться в жилой комплекс, отфильтровать квартиры, увидеть одну из семи планировок под метраж и посчитать платёж по условиям банков-партнёров. Отдельно — панель управления: ЖК, корпуса, квартиры, заявки, роли, Метрика. Главная механика показа — конструктор: двадцать допников включаются тумблером, блок появляется на странице без перезагрузки, страница подъезжает к нему, у свежего блока есть «было / стало». Квартиры и чертежи считаются на сервере, в браузер уходит только интерфейс. Витрина открыта по ссылке и скрыта из поиска.",
      en: "A brief with a budget range and three references became three complete sites that differ not in palette but in design school: a Swiss grid, a magazine spread with a drop cap and parallax, and a dark cinema with full-screen scenes, a master plan and a floor chessboard. Each lets you open a residential project, filter flats, see one of seven floor plans matched to the area and calculate a payment on partner banks' terms. Alongside them, an admin panel: projects, buildings, flats, leads, roles, analytics. The centrepiece of the pitch is the configurator: twenty add-ons switch on with a toggle, the block appears on the page without a reload, the page scrolls to it, and a fresh block gets a «before / after» switch. Flats and drawings are computed on the server; only the interface ships to the browser. The showcase is open by link and hidden from search.",
      uz: "Byudjet oralig‘i va uchta referensli brif palitra bilan emas, dizayn maktabi bilan farq qiladigan uchta to‘liq saytga aylandi: shveytsariya to‘ri, harfboshi va parallaksli jurnal sahifasi, butun ekranli sahnalar, bosh reja va shaxmat taxtali qorong‘i kinozal. Har birida turar-joy majmuasiga kirish, kvartiralarni filtrlash, maydonga mos yettita rejadan birini ko‘rish va hamkor banklar shartlari bo‘yicha to‘lovni hisoblash mumkin. Alohida — boshqaruv paneli: majmualar, korpuslar, kvartiralar, so‘rovlar, rollar, analitika. Ko‘rsatuvning asosiy mexanikasi — konstruktor: yigirmata qo‘shimcha tumbler bilan yoqiladi, blok sahifada qayta yuklashsiz paydo bo‘ladi, sahifa unga yaqinlashadi, yangi blokda «avval / keyin» tugmasi bor. Kvartiralar va chizmalar serverda hisoblanadi, brauzerga faqat interfeys boradi. Vitrina havola orqali ochiq va qidiruvdan yashirilgan.",
      zh: "一份带预算区间的需求书和三个参考案例，变成了三套完整网站 —— 差别不在配色，而在设计流派：瑞士网格、带首字下沉与视差的杂志跨页、以及带全屏场景、总平面图和楼层棋盘的深色影院风格。每套都可以进入楼盘、筛选房源、查看按面积匹配的七种户型之一，并按合作银行条件计算月供。另配管理后台：楼盘、楼栋、房源、询单、角色、统计。展示的核心机制是配置器：二十项增值功能通过开关启用，区块无需刷新即出现在页面上，页面自动滚动到位，新启用的区块带有「之前 / 之后」对比。房源与户型图在服务端计算，浏览器只接收界面。展示站凭链接开放访问，并对搜索引擎隐藏。",
    },
    tech: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS v4", "Playwright"],
    metrics: [
      { value: "3", label: { ru: "сайта в разных школах оформления", en: "sites in different design schools", uz: "turli dizayn maktabidagi sayt", zh: "不同设计流派的网站" } },
      { value: "20", label: { ru: "допников в конструкторе", en: "add-ons in the configurator", uz: "konstruktordagi qo‘shimcha", zh: "配置器中的增值功能" } },
      { value: "7", label: { ru: "планировок под метраж", en: "floor plans matched to area", uz: "maydonga mos reja", zh: "按面积匹配的户型" } },
    ],
  },
  {
    slug: "global-export",
    name: "Global Export",
    monogram: "GE",
    compare: {
      site: "globalex.uz",
      taken: "2026-09",
      parts: ["hero", "about", "catalog", "product", "production", "news", "team", "contacts"],
    },
    year: 2026,
    url: "https://globalex.maximov-tech.ru/ru",
    tier: 1,
    niches: ["экспорт", "производство", "сельское хозяйство", "B2B", "FMCG", "export", "eksport", "出口"],
    forNiches: [],
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
    slug: "adar",
    name: "ADAR",
    monogram: "AD",
    compare: {
      site: "adar.uz",
      taken: "2026-09",
      parts: ["hero", "showcase", "catalog", "product", "themes", "clients", "about", "contacts"],
    },
    year: 2026,
    url: "https://globalex.maximov-tech.ru/adar",
    tier: 2,
    niches: ["подарочные наборы", "корпоративные подарки", "новогодние подарки", "кондитерские изделия", "интернет-магазин", "каталог", "e-commerce", "gift sets", "corporate gifts", "sovg‘a to‘plamlari", "礼品套装", "企业礼品"],
    forNiches: ["internet-magazin"],
    accent: "gold",
    category: {
      ru: "Три концепции сайта",
      en: "Three site concepts",
      uz: "Uchta sayt konsepsiyasi",
      zh: "三套网站方案",
    },
    summary: {
      ru: "Поставщик подарочных наборов с 2011 года: три рабочих варианта новой главной — витрина, каталог с поиском по составу и премиум с барабаном архива.",
      en: "A gift-set supplier since 2011: three working versions of the new home page — a showcase, a catalogue searchable by contents and a premium edition with an archive drum.",
      uz: "2011-yildan beri sovg‘a to‘plamlari yetkazib beruvchi kompaniya: yangi bosh sahifaning uchta ishlaydigan varianti — vitrina, tarkib bo‘yicha qidiruvli katalog va arxiv barabanli premium.",
      zh: "自 2011 年起经营礼品套装的供应商：三个可运行的新首页版本 —— 展示型、可按成分搜索的目录型、带档案转盘的高端型。",
    },
    description: {
      ru: "Заказчик пришёл с сайтом-визиткой и сотней детских новогодних наборов. Вместо макетов собрали три полноценных варианта главной на одной витрине с переключателем. «Витрина» — быстрый сайт, где заявку оставляют с телефона за пятнадцать секунд. «Каталог» — восемьдесят наборов с поиском по составу, весу и цене. «Премиум» — тёмная кинематографичная версия с барабаном архива за девятнадцать сезонов, знаками восточного календаря на обложках, корзиной и формой заказа. От заказчика после осмотра нужно одно решение — выбрать направление.",
      en: "The client arrived with a one-page site and a hundred children's New Year gift sets. Instead of mockups we built three complete versions of the home page on one showcase with a switcher. «Showcase» — a fast site where an enquiry takes fifteen seconds from a phone. «Catalogue» — eighty sets searchable by contents, weight and price. «Premium» — a dark, cinematic edition with an archive drum spanning nineteen seasons, Eastern-calendar signs on the covers, a cart and an order form. After the walkthrough the client owes exactly one decision — which direction to take.",
      uz: "Buyurtmachi bir sahifali sayt va yuzga yaqin bolalar yangi yil sovg‘a to‘plamlari bilan keldi. Maketlar o‘rniga bitta vitrinada, almashtirgich bilan, bosh sahifaning uchta to‘liq variantini yig‘dik. «Vitrina» — telefondan o‘n besh soniyada buyurtma qoldiriladigan tez sayt. «Katalog» — tarkibi, og‘irligi va narxi bo‘yicha qidiriladigan sakson to‘plam. «Premium» — o‘n to‘qqiz mavsumlik arxiv barabani, muqovalarda sharq taqvimi belgilari, savat va buyurtma shakli bilan qorong‘i kinematografik versiya. Ko‘rib chiqqandan keyin buyurtmachidan bitta qaror kutiladi — yo‘nalishni tanlash.",
      zh: "客户带着一个名片式网站和上百款儿童新年礼品套装找到我们。我们没有画设计稿，而是在同一个展示页上做出三个完整可切换的首页版本。「展示型」—— 快速网站，用手机十五秒即可提交询单；「目录型」—— 八十款套装，可按成分、重量和价格搜索；「高端型」—— 深色电影感版本，配有跨越十九个季度的档案转盘、封面上的东方历法生肖标记、购物车与订单表单。客户看完只需做一个决定 —— 选择方向。",
    },
    tech: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS v4"],
    metrics: [
      { value: "3", label: { ru: "варианта главной на одной витрине", en: "home-page versions on one showcase", uz: "bitta vitrinadagi bosh sahifa varianti", zh: "同一展示页上的首页版本" } },
      { value: "80", label: { ru: "наборов с поиском по составу", en: "sets searchable by contents", uz: "tarkib bo‘yicha qidiriladigan to‘plam", zh: "可按成分搜索的套装" } },
      { value: "19", label: { ru: "сезонов в барабане архива", en: "seasons in the archive drum", uz: "arxiv baranidagi mavsum", zh: "档案转盘中的季度" } },
    ],
  },
  {
    slug: "tezketkaz",
    name: "TezKetKaz",
    monogram: "TKK",
    year: 2026,
    tier: 1,
    niches: ["доставка еды", "ресторанный бизнес", "HoReCa", "маркетплейс", "логистика", "食品配送", "food delivery"],
    forNiches: ["dostavka-edy", "restoran", "logistika"],
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
    slug: "harvest-motion",
    name: "Harvest in Motion",
    monogram: "HM",
    year: 2026,
    url: "https://globalex.maximov-tech.ru/motion.html",
    tier: 1,
    niches: ["экспорт", "производство", "сельское хозяйство", "промо-сайт", "презентация", "анимация", "прототип", "animation", "prototype", "animatsiya", "动效"],
    forNiches: [],
    accent: "gold",
    category: {
      ru: "Анимационный прототип",
      en: "Animated prototype",
      uz: "Animatsion prototip",
      zh: "动效原型",
    },
    summary: {
      ru: "Прототип сайта с прокруточной анимацией: заказчик открывает ссылку и листает работающий сайт, а не разглядывает макеты.",
      en: "A prototype site with a scroll-driven animation: the client opens one link and scrolls a working site instead of studying mockups.",
      uz: "Skroll animatsiyali sayt prototipi: buyurtmachi havolani ochadi va maketlarni ko‘rish o‘rniga ishlaydigan saytni varaqlaydi.",
      zh: "带滚动动效的网站原型：客户打开一个链接即可浏览可运行的网站，而不是对着设计稿揣摩。",
    },
    description: {
      ru: "Заказчик показал сайт европейского конкурента и спросил, реальны ли такие анимации. Отвечать словами в смете мы не стали — собрали работающий прототип на отдельном поддомене. Прокруточная сцена «Полёт урожая»: сухофрукты выходят в кадр, к ним подхватываются орехи, урожай раскладывается по корзинам, коробки уходят на погрузку, дальше — маршруты экспорта, и тут же разбор, сколько строк кода стоит каждый приём. Рядом две полные концепции оформления — кинематографичная тёмная и светлый каталог — и сам сайт на трёх языках с настоящим контентом и админкой. Всё собрано на одной странице-витрине с честной сводкой, какие данные подтверждены, а какие проставлены отраслевыми. Ноль анимационных библиотек: position: sticky, transform и один обработчик прокрутки; при включённом prefers-reduced-motion сцена показывает финальные кадры без движения. От заказчика после осмотра нужно единственное решение — выбрать направление.",
      en: "The client showed us a European competitor's site and asked whether animation like that was realistic. Rather than answer in words on an estimate, we built a working prototype on a separate subdomain. A scroll-driven scene, «Harvest in Motion»: dried fruit enters the frame, nuts join it, the harvest sorts itself into baskets, boxes move to loading, then the export routes — with a breakdown, right there, of how many lines of code each effect costs. Alongside it are two complete design concepts — a cinematic dark one and a light catalogue — plus the site itself in three languages with real content and an admin panel. Everything sits on one showcase page with an honest note on which figures are confirmed and which are industry defaults. Zero animation libraries: position: sticky, transform and a single scroll handler; with prefers-reduced-motion on, the scene shows its final frames without movement. After the walkthrough the client owes us exactly one decision — which direction to take.",
      uz: "Buyurtmachi Yevropa raqobatchisining saytini ko‘rsatib, shunday animatsiyalar realmi deb so‘radi. Biz smetada so‘z bilan javob bermadik — alohida subdomenda ishlaydigan prototip yig‘dik. «Hosil parvozi» skroll sahnasi: quritilgan mevalar kadrga chiqadi, ularga yong‘oqlar qo‘shiladi, hosil savatlarga taqsimlanadi, qutilar yuklashga ketadi, keyin eksport marshrutlari — va shu yerda har bir usul necha qator kod turishi tahlil qilinadi. Yonida ikkita to‘liq dizayn konsepsiyasi — kinematografik qorong‘i va yorug‘ katalog — hamda saytning o‘zi uch tilda, haqiqiy kontent va admin panel bilan. Hammasi bitta vitrina sahifasida, qaysi ma’lumot tasdiqlangani va qaysi biri soha bo‘yicha qo‘yilgani halol ko‘rsatilgan holda. Nol animatsiya kutubxonasi: position: sticky, transform va bitta skroll ishlovchisi; prefers-reduced-motion yoqilganda sahna yakuniy kadrlarni harakatsiz ko‘rsatadi.",
      zh: "客户拿出一家欧洲同行的网站，问这样的动效是否现实。我们没有在报价单上用文字作答，而是在独立子域名上做出了可运行的原型。随滚动推进的场景《丰收之旅》：干果进入画面，坚果随之汇入，收成分装入筐，纸箱送往装车，再到出口路线 —— 每一处效果各需多少行代码，就在旁边逐条讲明。与之并列的还有两套完整的设计概念 —— 电影感暗色版与明亮目录版 —— 以及三种语言、内容真实并配有后台的网站本身。所有内容集中在一个展示页上，并如实标注哪些数据已获确认、哪些取自行业惯例。零动画库：position: sticky、transform 与一个滚动监听；当用户开启 prefers-reduced-motion 时，场景直接呈现静止的最终画面。看完之后，客户只需做一个决定：选定方向。",
    },
    tech: ["HTML", "CSS", "JavaScript", "Next.js", "Tailwind CSS"],
    metrics: [
      { value: "2", label: { ru: "концепции оформления на выбор", en: "design concepts to choose from", uz: "tanlash uchun dizayn konsepsiyasi", zh: "可选的设计概念" } },
      { value: "0", label: { ru: "КБ анимационных библиотек", en: "KB of animation libraries", uz: "KB animatsiya kutubxonasi", zh: "动画库体积（KB）" } },
      { value: "3", label: { ru: "языка в прототипе", en: "languages in the prototype", uz: "prototipdagi tillar", zh: "原型中的语言版本" } },
    ],
  },
  {
    slug: "golden-house",
    name: "Golden House",
    monogram: "GH",
    compare: {
      site: "gh.uz",
      taken: "2026-09",
      parts: ["hero", "picker", "projects", "commerce", "mortgage", "news", "contacts"],
    },
    year: 2026,
    url: "https://globalex.maximov-tech.ru/gh",
    tier: 1,
    niches: ["застройщик", "недвижимость", "жилой комплекс", "продажа квартир", "подбор квартиры", "ипотечный калькулятор", "редизайн", "real estate", "property developer", "ko‘chmas mulk", "房地产"],
    // Макет для конкретной компании: примером ниши в письмах другим
    // застройщикам его не показываем — это был бы чужой бренд в чужой переписке.
    forNiches: [],
    accent: "gold",
    category: {
      ru: "Макет главной для застройщика",
      en: "Home-page mock-up for a developer",
      uz: "Quruvchi uchun bosh sahifa maketi",
      zh: "开发商首页样稿",
    },
    summary: {
      ru: "Застройщик с семью жилыми комплексами в Ташкенте и уже приличным сайтом. Один макет главной, доведённый до конца, — с тем, чего старому сайту не хватало: движение, подбор квартиры и расчёт ипотеки на их собственных данных.",
      en: "A developer with seven residential complexes in Tashkent and an already decent site. One home-page mock-up taken all the way — with what the old site lacked: motion, a flat picker and a mortgage calculation on the company's own data.",
      uz: "Toshkentda yettita turar-joy majmuasi va allaqachon yaxshi sayti bor quruvchi kompaniya. Oxirigacha yetkazilgan bitta bosh sahifa maketi — eski saytda yetishmagan narsalar bilan: harakat, kvartira tanlash va kompaniyaning o‘z ma’lumotlari asosida ipoteka hisobi.",
      zh: "一家在塔什干拥有七个住宅项目、网站本已不错的开发商。一版完整打磨的首页样稿 —— 补上旧站缺少的三样东西：动效、选房器，以及基于公司自有数据的房贷测算。",
    },
    description: {
      ru: "Не «три варианта на выбор», как у MAVERA, а один: у заказчика уже был приличный сайт, и разговор шёл не о том, каким он будет, а о том, чего ему не хватает. Порядок разделов повторяет их сайт — жилые комплексы, подбор квартиры, коммерция на первых этажах, ход строительства, пять шагов покупки, новости, контакты, — чтобы сравнивать было легко. Карточка комплекса меняется целиком, вместе с фотографией и тем, что есть рядом. Под выбранной квартирой сразу открывается расчёт ипотеки по условиям покупателя. Отдельно — панель управления, в которой всё это правится без разработчика.",
      en: "Not «three versions to choose from», as with MAVERA, but one: the client already had a decent site, so the conversation was not about what it should become but about what it was missing. The order of sections repeats their site — residential complexes, flat picker, ground-floor commercial space, construction progress, five steps to buying, news, contacts — so the two are easy to compare. The complex card changes as a whole, together with its photo and what is nearby. Under the chosen flat a mortgage calculation on the buyer's terms opens at once. Alongside it is an admin panel where all of this is edited without a developer.",
      uz: "MAVERA’dagidek «tanlash uchun uchta variant» emas, bitta: buyurtmachida allaqachon yaxshi sayt bor edi, shuning uchun gap sayt qanday bo‘lishi haqida emas, unga nima yetishmasligi haqida bordi. Bo‘limlar tartibi ularning saytini takrorlaydi — turar-joy majmualari, kvartira tanlash, birinchi qavatlardagi tijorat binolari, qurilish jarayoni, xaridning besh qadami, yangiliklar, kontaktlar — taqqoslash oson bo‘lishi uchun. Majmua kartochkasi to‘liq almashadi, surati va yaqin atrofdagi narsalar bilan birga. Tanlangan kvartira ostida darhol xaridor shartlari bo‘yicha ipoteka hisobi ochiladi. Alohida — bularning barchasini dasturchisiz tahrirlash mumkin bo‘lgan boshqaruv paneli.",
      zh: "不像 MAVERA 那样给出「三个版本任选」，而是只做一个：客户已经有一个不错的网站，要讨论的不是它该变成什么样，而是它还缺什么。版块顺序沿用其现有网站 —— 住宅项目、选房、首层商业、工程进度、购房五步、新闻、联系方式 —— 方便逐项对比。项目卡片整体切换，照片和周边配套随之更新。选中房源后，下方立即展开按购房者条件计算的房贷方案。另配管理后台，所有内容无需开发者即可修改。",
    },
    tech: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS v4"],
    metrics: [
      { value: "7", label: { ru: "жилых комплексов на их собственных данных", en: "residential complexes on the company's own data", uz: "kompaniyaning o‘z ma’lumotlaridagi turar-joy majmuasi", zh: "基于公司自有数据的住宅项目" } },
      { value: "3", label: { ru: "вещи, которых не хватало сайту: движение, подбор, ипотека", en: "things the site lacked: motion, picker, mortgage", uz: "saytga yetishmagan narsa: harakat, tanlash, ipoteka", zh: "旧站所缺：动效、选房、房贷" } },
      { value: "5", label: { ru: "шагов покупки от звонка до ключей", en: "steps from the first call to the keys", uz: "qo‘ng‘iroqdan kalitgacha xarid qadami", zh: "从来电到交钥匙的购房步骤" } },
    ],
  },
  {
    slug: "namuna",
    name: "Namuna",
    monogram: "NM",
    compare: {
      site: "namuna.uz",
      taken: "2026-09",
      parts: ["hero", "calculator", "works", "production", "steps", "materials", "faq", "contacts"],
    },
    year: 2026,
    url: "https://globalex.maximov-tech.ru/namuna",
    tier: 2,
    niches: ["мебель", "мебель на заказ", "кухни на заказ", "мебельная фабрика", "калькулятор", "редизайн", "furniture", "mebel", "家具"],
    forNiches: [],
    accent: "green",
    category: {
      ru: "Макет главной для мебельной фабрики",
      en: "Home-page mock-up for a furniture factory",
      uz: "Mebel fabrikasi uchun bosh sahifa maketi",
      zh: "家具工厂首页样稿",
    },
    summary: {
      ru: "Фабрика корпусной мебели с быстрым сайтом и хорошими фотографиями, но без цен и без единой формы заявки. Макет главной, собранный главами, с калькулятором на восемь типов мебели и заявкой прямо из него.",
      en: "A cabinet-furniture factory with a fast site and good photos, but no prices and not a single enquiry form. A home-page mock-up told in chapters, with a calculator for eight furniture types and an enquiry sent straight from it.",
      uz: "Tez sayti va yaxshi suratlari bor, lekin narxlari ham, birorta buyurtma shakli ham bo‘lmagan korpus mebel fabrikasi. Boblardan tuzilgan bosh sahifa maketi: sakkiz turdagi mebel uchun kalkulyator va to‘g‘ridan-to‘g‘ri undan buyurtma.",
      zh: "一家板式家具工厂：网站速度快、照片出色，却没有价格，也没有任何询单表单。一版按章节讲述的首页样稿，配有覆盖八类家具的计算器，并可直接从中提交询单。",
    },
    description: {
      ru: "Перед макетом разобрали живой сайт и начали с сильного: он быстрый, картинки грузятся лениво, фотографии свои. Мешали продавать две вещи. Порядок цены узнать было нельзя — квиз собирал ответы, но ничего не считал. И оставить заявку было негде: на главной шесть телефонов и ни одной формы, а вечером звонить не готов почти никто. В макете калькулятор: кухня, гардеробная, гостиная или квартира целиком — объём, материалы и фурнитура, вилка и срок пересчитываются на каждом нажатии, и заявка уходит со всем составом. Есть и обратный ход — «назовите бюджет, подберём состав». Страница построена главами с индикатором прочитанного; две главы, производство и финал, тёмные. Рядом — чат и панель управления.",
      en: "Before the mock-up we reviewed the live site and began with its strengths: it is fast, images load lazily, the photos are their own. Two things got in the way of selling. There was no way to learn even the order of prices — the quiz collected answers but calculated nothing. And there was nowhere to leave an enquiry: six phone numbers on the home page and not a single form, while almost nobody is ready to call in the evening. The mock-up has a calculator: a kitchen, a walk-in wardrobe, a living room or a whole flat — volume, materials and fittings, with the range and lead time recalculated on every tap, and the enquiry goes out with the full list. There is also the reverse route — «name your budget and we'll suggest a set». The page is told in chapters with a reading-progress indicator; two chapters, production and the finale, are dark. Alongside are a chat and an admin panel.",
      uz: "Maketdan oldin jonli saytni tahlil qildik va kuchli tomonlaridan boshladik: u tez, rasmlar kerak bo‘lganda yuklanadi, suratlar o‘ziniki. Sotishga ikki narsa xalaqit berardi. Narx tartibini bilishning iloji yo‘q edi — kviz javoblarni yig‘ardi, lekin hech narsa hisoblamasdi. Buyurtma qoldirishga ham joy yo‘q edi: bosh sahifada oltita telefon va birorta shakl yo‘q, kechqurun esa deyarli hech kim qo‘ng‘iroq qilishga tayyor emas. Maketda kalkulyator bor: oshxona, kiyim xonasi, mehmonxona yoki butun kvartira — hajm, materiallar va furnitura, oraliq va muddat har bosishda qayta hisoblanadi, buyurtma esa butun tarkibi bilan yuboriladi. Teskari yo‘l ham bor — «byudjetni ayting, tarkibni tanlaymiz». Sahifa o‘qilganlik ko‘rsatkichi bilan boblardan tuzilgan; ikki bob — ishlab chiqarish va yakun — qorong‘i. Yonida — chat va boshqaruv paneli.",
      zh: "做样稿之前，我们先分析了现有网站，并从优点说起：速度快、图片按需加载、照片都是自己拍的。妨碍成交的有两点：连价格的大致区间都无从得知 —— 问卷只收集答案，什么也不计算；也没有地方留下询单 —— 首页有六个电话，却没有一个表单，而晚上几乎没人愿意打电话。样稿里有一个计算器：厨房、衣帽间、客厅或整套住宅 —— 体量、材料与五金，每点一下都会重新计算价格区间和工期，询单连同完整清单一起发出。还有反向入口 ——「说出预算，我们来配方案」。页面按章节展开，顶部有阅读进度；生产和结尾两章为深色。另配在线沟通和管理后台。",
    },
    tech: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS v4"],
    metrics: [
      { value: "8", label: { ru: "типов мебели в калькуляторе", en: "furniture types in the calculator", uz: "kalkulyatordagi mebel turi", zh: "计算器覆盖的家具类别" } },
      { value: "0", label: { ru: "форм заявки было на старой главной", en: "enquiry forms on the old home page", uz: "eski bosh sahifadagi buyurtma shakli", zh: "旧首页上的询单表单数" } },
      { value: "2", label: { ru: "тёмные главы: производство и финал", en: "dark chapters: production and the finale", uz: "qorong‘i bob: ishlab chiqarish va yakun", zh: "深色章节：生产与结尾" } },
    ],
  },
  {
    slug: "foodmaxx",
    name: "FOODMAXX",
    monogram: "FM",
    compare: {
      site: "foodmaxx.uz",
      taken: "2026-09",
      parts: ["hero", "quality", "catalog", "production", "clients", "about", "contacts"],
    },
    year: 2026,
    url: "https://globalex.maximov-tech.ru/foodmaxx",
    tier: 2,
    niches: ["производство", "консервы", "пищевое производство", "FMCG", "B2B", "дистрибуция", "food production", "oziq-ovqat", "食品"],
    forNiches: [],
    accent: "violet",
    category: {
      ru: "Два варианта сайта производителя консервов",
      en: "Two site versions for a canned-food producer",
      uz: "Konserva ishlab chiqaruvchi uchun saytning ikki varianti",
      zh: "罐头生产商的两版网站",
    },
    summary: {
      ru: "Производитель мясных и овощных консервов, который продаёт сетям и оптовикам. Два варианта сайта на одних данных: кинематографичный, где банка раскрывается на глазах, и «Полка» — светлая инфографика в духе карточки маркетплейса.",
      en: "A producer of canned meat and vegetables that sells to retail chains and wholesalers. Two site versions on the same data: a cinematic one where the can opens up before your eyes, and «Shelf» — light infographics in the spirit of a marketplace product card.",
      uz: "Tarmoqlar va ulgurji xaridorlarga sotadigan go‘sht va sabzavot konservalari ishlab chiqaruvchisi. Bir xil ma’lumotlardagi saytning ikki varianti: banka ko‘z oldida ochiladigan kinematografik va «Polka» — marketpleys kartochkasi uslubidagi yorug‘ infografika.",
      zh: "一家面向连锁零售和批发商的肉类与蔬菜罐头生产商。基于同一套数据的两版网站：一版电影感，罐头在眼前层层打开；另一版「货架」，是电商商品卡风格的明亮信息图。",
    },
    description: {
      ru: "Первый вариант — одна страница со сквозным сценарием: от первого экрана к банке, которая раскрывается, дальше к производству, каталогу и заявке; смотреть его надо медленно. Второй, «Полка», — те же данные в другом жанре: товар с выносками на пунктирных линиях, четыре плашки «что в банке», чек-лист из шести пунктов, восемь нумерованных шагов производства, три полки со счётчиками позиций, логотипы шести сетей и заявка на прайс — суть читается за три секунды. Чек-лист сознательно не сделан таблицей «мы против обычных консервов»: утверждать, что у других есть консерванты, мы не можем — это была бы уже не реклама, а клевета. Поэтому это список того, по чему выбирают поставщика, и по каждому пункту ответ «да».",
      en: "The first version is a single page with a continuous storyline: from the first screen to a can that opens up, then on to production, the catalogue and the enquiry; it is meant to be watched slowly. The second, «Shelf», is the same data in another genre: the product with callouts on dotted lines, four «what's in the can» badges, a six-point checklist, eight numbered production steps, three shelves with item counters, the logos of six retail chains and a price-list request — the point reads in three seconds. The checklist is deliberately not a «us versus ordinary canned food» table: we cannot claim that others use preservatives — that would no longer be advertising but defamation. So it is a list of what buyers choose a supplier by, and every item is answered «yes».",
      uz: "Birinchi variant — yaxlit ssenariyli bitta sahifa: birinchi ekrandan ochiladigan bankagacha, keyin ishlab chiqarish, katalog va buyurtmaga; uni sekin ko‘rish kerak. Ikkinchisi, «Polka», — o‘sha ma’lumotlar boshqa janrda: punktir chiziqlardagi izohli mahsulot, «bankada nima bor» degan to‘rtta plashka, olti bandli chek-list, raqamlangan sakkizta ishlab chiqarish qadami, pozitsiyalar hisoblagichli uchta javon, oltita tarmoq logotipi va prays so‘rovi — mohiyat uch soniyada o‘qiladi. Chek-list ataylab «biz oddiy konservalarga qarshi» jadvali qilinmagan: boshqalarda konservantlar bor deb da’vo qila olmaymiz — bu endi reklama emas, tuhmat bo‘lardi. Shuning uchun bu yetkazib beruvchi qaysi mezonlar bo‘yicha tanlanishi ro‘yxati va har bir band bo‘yicha javob «ha».",
      zh: "第一版是一条贯穿到底的单页叙事：从首屏到一罐被打开的罐头，再到生产、产品目录与询单；它适合慢慢看。第二版「货架」用另一种体裁呈现同一套数据：带虚线标注的产品、四块「罐里有什么」标签、六项核对清单、八个编号的生产步骤、三排带数量统计的货架、六家连锁的标志以及索取价目表 —— 三秒即可读懂要点。核对清单刻意没有做成「我们对比普通罐头」的表格：我们不能声称别家使用防腐剂 —— 那就不是广告而是诽谤了。因此它是一份采购方挑选供应商的标准清单，每一项的回答都是「是」。",
    },
    tech: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS v4"],
    metrics: [
      { value: "2", label: { ru: "варианта сайта на одних данных", en: "site versions on the same data", uz: "bir xil ma’lumotlardagi sayt varianti", zh: "基于同一数据的网站版本" } },
      { value: "8", label: { ru: "шагов производства по номерам", en: "numbered production steps", uz: "raqamlangan ishlab chiqarish qadami", zh: "编号的生产步骤" } },
      { value: "6", label: { ru: "торговых сетей на полке", en: "retail chains on the shelf", uz: "javondagi savdo tarmog‘i", zh: "上架的连锁零售商" } },
    ],
  },
  {
    slug: "usta",
    name: "USTA",
    monogram: "USTA",
    year: 2026,
    url: "https://usta.maximov-tech.ru",
    tier: 2,
    niches: ["сфера услуг", "маркетплейс услуг", "ремонт", "бытовые услуги", "services", "xizmatlar"],
    forNiches: ["stroitelnaya-kompaniya", "mebel"],
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
    monogram: "SAI",
    year: 2026,
    tier: 1,
    niches: ["e-commerce", "маркетплейс", "ритейл", "SaaS", "аналитика", "电商", "savdo"],
    forNiches: ["internet-magazin"],
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
    monogram: "LBM",
    year: 2026,
    tier: 2,
    niches: ["недвижимость", "аренда", "туризм", "гостиничный бизнес", "HoReCa", "real estate", "ko‘chmas mulk"],
    forNiches: ["nedvizhimost", "turagentstvo"],
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
    slug: "legal-ai",
    name: "Legal AI",
    monogram: "LAI",
    year: 2026,
    tier: 1,
    niches: ["юридические услуги", "финансы", "консалтинг", "документооборот", "legal", "yuridik", "法律"],
    forNiches: ["yurfirma"],
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
    monogram: "MA",
    year: 2026,
    tier: 1,
    niches: ["маркетплейс", "e-commerce", "ритейл", "логистика", "финтех", "enterprise"],
    forNiches: ["internet-magazin"],
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

/**
 * Кейс, который на главной показан не карточкой, а отдельным большим блоком
 * с анимацией: собственный сайт студии — единственный проект, который
 * посетитель может потрогать прямо сейчас, и в общей сетке он терялся бы
 * среди остальных. Из самой библиотеки он при этом не исчезает: страница
 * /cases, sitemap и промпт AI-менеджера видят его наравне с остальными.
 */
export const showcaseSlug = "devuz";

export function caseBySlug(slug: string): Case | undefined {
  return cases.find((c) => c.slug === slug);
}
