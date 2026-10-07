import type { Locale, LocalizedText } from "@/lib/i18n";

/**
 * Библиотека проектов.
 *
 * У файла две роли. Первая — витрина кейсов на сайте. Вторая, менее очевидная:
 * это база, по которой AI-менеджер оценивает нашу экспертность в нише клиента
 * при ICP-скоринге. Поэтому у каждого кейса есть `niches` — список ниш, к
 * которым он относится, в терминах, которыми говорит клиент.
 *
 * На сайте кейсы идут по дате, новые сверху (casesByDate) — владелец,
 * 03.10.2026: «Свежие проекты с датами ставь наверх». Шесть карточек на
 * главной — шесть самых свежих.
 *
 * Порядок в самом массиве — редакторский, и его читают письма: пример для
 * ниши берётся первым подходящим (lib/audit/proof.ts). Поэтому показ
 * отсортирован отдельно, а пример в письме от новой даты не меняется.
 */
export type Case = {
  slug: string;
  /** Название проекта — не переводится. */
  name: string;
  /**
   * Когда сделан: `ГГГГ-ММ-ДД`, если день известен точно (макеты витрины —
   * день, когда проект появился на ней), иначе `ГГГГ-ММ` — для долгих
   * проектов это месяц, когда шла основная работа. По дате кейсы идут на
   * сайте, новые сверху (casesByDate), и она же стоит на карточке.
   */
  date: string;
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
    date: "2026-08",
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
      uk: "Сайт студії + AI-менеджер",
      pl: "Strona studia + menedżer AI",
    },
    summary: {
      ru: "Сайт, который вы сейчас открыли: шесть языков, сцена сборки кода на прокрутке и менеджер на LLM, который разбирается в задаче до разговора с человеком.",
      en: "The site you are reading right now: six languages, a scroll-driven code-assembly scene and an LLM manager that works out the task before a human joins.",
      uz: "Siz hozir ochib turgan sayt: olti til, skroll bilan boshqariladigan kod yig‘ilish sahnasi va odam qo‘shilishidan oldin vazifani tushunib oladigan LLM menejer.",
      zh: "您此刻正在浏览的网站：六种语言、随滚动推进的代码编译场景，以及在真人介入之前就厘清需求的 LLM 客户经理。",
      uk: "Сайт, який ви зараз відкрили: шість мов, сцена збирання коду під час прокручування і менеджер на LLM, який розбирається в задачі ще до розмови з людиною.",
      pl: "Strona, którą właśnie masz przed sobą: sześć języków, scena składania kodu przy przewijaniu i menedżer oparty na LLM, który rozumie zadanie, zanim dojdzie do rozmowy z człowiekiem.",
    },
    description: {
      ru: "Собственный сайт студии и одновременно её первая линия продаж. Герой здесь не картинка: пока человек листает, на экране собирается та самая функция, которая квалифицирует лида и уходит в Telegram. Дальше калькулятор, считающий вилку по тем же правилам, что и менеджер, и чат: отвечает AI-менеджер, разбирает задачу по ICP и BANT и отдаёт живому менеджеру готовое резюме — клиенту не приходится рассказывать всё заново. Шесть языков с hreflang и своей обложкой на каждый, страницы генерируются статически, деплой — Docker за хостовым nginx. Ни одной анимационной библиотеки на клиенте: сцена сборки, дождь кода и появление блоков сделаны на CSS и одном IntersectionObserver.",
      en: "The studio's own site, and at the same time its first line of sales. The hero is not a picture: as the visitor scrolls, the screen assembles the very function that qualifies a lead and sends it to Telegram. Then a calculator that estimates the range by the same rules a manager uses, and a chat: the AI manager answers, scores the task on ICP and BANT, and hands a finished summary to the human manager — the client never has to tell the story twice. Six languages with hreflang and a cover image of its own for each, statically generated pages, deployment in Docker behind the host nginx. Not a single animation library ships to the client: the assembly scene, the code rain and the block reveals run on CSS and one IntersectionObserver.",
      uz: "Studiyaning o‘z sayti va ayni paytda uning birinchi savdo liniyasi. Bu yerdagi hero rasm emas: odam varaqlagani sari ekranda lidni baholaydigan va Telegramga yuboradigan aynan o‘sha funksiya yig‘iladi. Keyin menejer bilan bir xil qoidalar bo‘yicha narx oralig‘ini hisoblaydigan kalkulyator va chat: AI menejer javob beradi, vazifani ICP va BANT bo‘yicha baholaydi va tirik menejerga tayyor xulosani uzatadi — mijoz hammasini qaytadan aytib berishi shart emas. hreflang bilan olti til va har biriga alohida muqova, sahifalar statik generatsiya qilinadi, deploy — host nginx ortidagi Docker. Mijozga birorta ham animatsiya kutubxonasi yuborilmaydi: yig‘ilish sahnasi, kod yomg‘iri va bloklarning paydo bo‘lishi CSS va bitta IntersectionObserver’da ishlaydi.",
      zh: "工作室自己的网站，同时也是它的销售第一线。首屏并非一张图片：访客向下滚动时，屏幕上逐行组装出的，正是那个为线索打分并推送到 Telegram 的函数。往下是按客户经理同一套规则给出价格区间的计算器，以及在线沟通：AI 客户经理负责应答，按 ICP 与 BANT 对需求评分，并把整理好的摘要交给真人经理 —— 客户无需把同样的话再讲一遍。六种语言均配有 hreflang 与各自的分享封面，页面静态生成，部署在宿主 nginx 之后的 Docker 中。客户端不加载任何动画库：编译场景、代码雨与区块出场全部依靠 CSS 与一个 IntersectionObserver 实现。",
      uk: "Власний сайт студії і водночас її перша лінія продажів. Головний герой тут не картинка: поки людина гортає сторінку, на екрані збирається та сама функція, яка оцінює заявку й надсилає її в Telegram. Далі — калькулятор, що рахує вилку за тими самими правилами, що й менеджер, і чат: відповідає AI-менеджер, розбирає задачу за ICP і BANT та передає живому менеджерові готове резюме — клієнтові не доводиться розповідати все заново. Шість мов із hreflang і власною обкладинкою для кожної, сторінки генеруються статично, деплой — Docker за хостовим nginx. Жодної анімаційної бібліотеки на клієнті: сцену збирання, дощ коду й появу блоків зроблено на CSS і одному IntersectionObserver.",
      pl: "Własna strona studia, a zarazem jego pierwsza linia sprzedaży. Bohaterem nie jest tu obrazek: gdy odwiedzający przewija stronę, na ekranie składa się dokładnie ta funkcja, która ocenia leada i wysyła go do Telegrama. Dalej kalkulator, który wylicza widełki według tych samych zasad co menedżer, oraz czat: odpowiada menedżer AI, analizuje zadanie według ICP i BANT i przekazuje żywemu menedżerowi gotowe podsumowanie — klient nie musi opowiadać wszystkiego od nowa. Sześć języków z hreflang i osobną okładką dla każdego, strony generowane statycznie, wdrożenie — Docker za nginx na hoście. Żadnej biblioteki animacji po stronie klienta: scena składania, deszcz kodu i pojawianie się bloków działają na CSS i jednym IntersectionObserver.",
    },
    tech: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS v4", "LLM API", "Supabase", "Docker"],
    metrics: [
      { value: "6", label: { ru: "языков с hreflang-разметкой", en: "languages with hreflang markup", uz: "hreflang belgilangan til", zh: "带 hreflang 标注的语言", uk: "мов із hreflang-розміткою", pl: "języków z oznaczeniem hreflang" } },
      { value: "20s", label: { ru: "гарантия первого ответа в чате", en: "guaranteed first reply in chat", uz: "chatdagi birinchi javob kafolati", zh: "在线沟通首次回复承诺", uk: "гарантія першої відповіді в чаті", pl: "gwarantowany czas pierwszej odpowiedzi na czacie" } },
      { value: "0", label: { ru: "КБ анимационных библиотек", en: "KB of animation libraries", uz: "KB animatsiya kutubxonasi", zh: "动画库体积（KB）", uk: "КБ анімаційних бібліотек", pl: "KB bibliotek animacji" } },
    ],
  },
  {
    slug: "mavera",
    name: "MAVERA",
    monogram: "MV",
    date: "2026-09-15",
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
      uk: "Три сайти забудовника + конструктор доповнень",
      pl: "Trzy strony dewelopera + konfigurator dodatków",
    },
    summary: {
      ru: "Три рабочих сайта для застройщика — строгий каталог, журнальный разворот и кинематографичный премиум — с карточкой ЖК, подбором квартиры, ипотечным калькулятором и конструктором, где допники включаются тумблером и сразу меняют страницу.",
      en: "Three working sites for a property developer — a strict catalogue, a magazine spread and a cinematic premium — with project pages, a flat picker, a mortgage calculator and a configurator where add-ons switch on with a toggle and change the page at once.",
      uz: "Quruvchi kompaniya uchun uchta ishlaydigan sayt — qat’iy katalog, jurnal sahifasi va kinematografik premium — turar-joy majmuasi kartochkasi, kvartira tanlash, ipoteka kalkulyatori va qo‘shimchalar tumbler bilan yoqilib, sahifani darhol o‘zgartiradigan konstruktor bilan.",
      zh: "为房地产开发商打造的三套可运行网站 —— 严谨目录版、杂志跨页版与电影感高端版 —— 含楼盘页、选房器、房贷计算器，以及一个配置器：拨动开关即可启用增值功能，页面随即变化。",
      uk: "Три робочі сайти для забудовника — строгий каталог, журнальний розворот і кінематографічний преміум — із карткою ЖК, підбором квартири, іпотечним калькулятором і конструктором, де доповнення вмикаються перемикачем і одразу змінюють сторінку.",
      pl: "Trzy działające strony dla dewelopera — surowy katalog, magazynowa rozkładówka i kinowa wersja premium — z kartą osiedla, wyszukiwarką mieszkań, kalkulatorem kredytu hipotecznego i konfiguratorem, w którym dodatki włącza się przełącznikiem, a strona od razu się zmienia.",
    },
    description: {
      ru: "Бриф с вилкой бюджета и три референса превратились в три полных сайта, различающихся не палитрой, а школой оформления: швейцарская сетка, журнальный разворот с буквицей и параллаксом, тёмный кинозал со сценами во весь экран, генпланом и шахматкой. В каждом можно провалиться в жилой комплекс, отфильтровать квартиры, увидеть одну из семи планировок под метраж и посчитать платёж по условиям банков-партнёров. Отдельно — панель управления: ЖК, корпуса, квартиры, заявки, роли, Метрика. Главная механика показа — конструктор: двадцать допников включаются тумблером, блок появляется на странице без перезагрузки, страница подъезжает к нему, у свежего блока есть «было / стало». Квартиры и чертежи считаются на сервере, в браузер уходит только интерфейс. Витрина закрыта кодом доступа — код даёт менеджер студии.",
      en: "A brief with a budget range and three references became three complete sites that differ not in palette but in design school: a Swiss grid, a magazine spread with a drop cap and parallax, and a dark cinema with full-screen scenes, a master plan and a floor chessboard. Each lets you open a residential project, filter flats, see one of seven floor plans matched to the area and calculate a payment on partner banks' terms. Alongside them, an admin panel: projects, buildings, flats, leads, roles, analytics. The centrepiece of the pitch is the configurator: twenty add-ons switch on with a toggle, the block appears on the page without a reload, the page scrolls to it, and a fresh block gets a «before / after» switch. Flats and drawings are computed on the server; only the interface ships to the browser. The showcase is protected by an access code — the studio's manager provides it.",
      uz: "Byudjet oralig‘i va uchta referensli brif palitra bilan emas, dizayn maktabi bilan farq qiladigan uchta to‘liq saytga aylandi: shveytsariya to‘ri, harfboshi va parallaksli jurnal sahifasi, butun ekranli sahnalar, bosh reja va shaxmat taxtali qorong‘i kinozal. Har birida turar-joy majmuasiga kirish, kvartiralarni filtrlash, maydonga mos yettita rejadan birini ko‘rish va hamkor banklar shartlari bo‘yicha to‘lovni hisoblash mumkin. Alohida — boshqaruv paneli: majmualar, korpuslar, kvartiralar, so‘rovlar, rollar, analitika. Ko‘rsatuvning asosiy mexanikasi — konstruktor: yigirmata qo‘shimcha tumbler bilan yoqiladi, blok sahifada qayta yuklashsiz paydo bo‘ladi, sahifa unga yaqinlashadi, yangi blokda «avval / keyin» tugmasi bor. Kvartiralar va chizmalar serverda hisoblanadi, brauzerga faqat interfeys boradi. Vitrina kirish kodi bilan yopilgan — kodni studiya menejeri beradi.",
      zh: "一份带预算区间的需求书和三个参考案例，变成了三套完整网站 —— 差别不在配色，而在设计流派：瑞士网格、带首字下沉与视差的杂志跨页、以及带全屏场景、总平面图和楼层棋盘的深色影院风格。每套都可以进入楼盘、筛选房源、查看按面积匹配的七种户型之一，并按合作银行条件计算月供。另配管理后台：楼盘、楼栋、房源、询单、角色、统计。展示的核心机制是配置器：二十项增值功能通过开关启用，区块无需刷新即出现在页面上，页面自动滚动到位，新启用的区块带有「之前 / 之后」对比。房源与户型图在服务端计算，浏览器只接收界面。展示站需凭访问码进入 —— 访问码由工作室经理提供。",
      uk: "Бриф із вилкою бюджету й три референси перетворилися на три повноцінні сайти, які відрізняються не палітрою, а школою оформлення: швейцарська сітка, журнальний розворот із буквицею та паралаксом, темний кінозал зі сценами на весь екран, генпланом і шахівкою. У кожному можна зануритися в житловий комплекс, відфільтрувати квартири, побачити одне із семи планувань під метраж і порахувати платіж за умовами банків-партнерів. Окремо — панель керування: ЖК, корпуси, квартири, заявки, ролі, Метрика. Головна механіка показу — конструктор: двадцять доповнень вмикаються перемикачем, блок з'являється на сторінці без перезавантаження, сторінка сама прокручується до нього, а в нового блока є «було / стало». Квартири й креслення рахуються на сервері, у браузер потрапляє лише інтерфейс. Вітрина закрита кодом доступу — код надає менеджер студії.",
      pl: "Brief z widełkami budżetu i trzy referencje zamieniły się w trzy pełne strony, które różnią się nie paletą, lecz szkołą projektowania: szwajcarska siatka, magazynowa rozkładówka z inicjałem i paralaksą, ciemna sala kinowa ze scenami na cały ekran, planem zagospodarowania i szachownicą mieszkań. W każdej można wejść w głąb osiedla, przefiltrować mieszkania, zobaczyć jeden z siedmiu układów dopasowanych do metrażu i policzyć ratę według warunków banków partnerskich. Osobno — panel administracyjny: osiedla, budynki, mieszkania, zapytania, role, Yandex Metrica. Główna mechanika prezentacji to konfigurator: dwadzieścia dodatków włącza się przełącznikiem, blok pojawia się na stronie bez przeładowania, strona sama do niego przewija, a świeży blok ma porównanie „przed / po”. Mieszkania i rzuty są liczone na serwerze, do przeglądarki trafia tylko interfejs. Witryna jest zamknięta kodem dostępu — kod przekazuje menedżer studia.",
    },
    tech: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS v4", "Playwright"],
    metrics: [
      { value: "3", label: { ru: "сайта в разных школах оформления", en: "sites in different design schools", uz: "turli dizayn maktabidagi sayt", zh: "不同设计流派的网站", uk: "сайти в різних школах оформлення", pl: "strony w różnych szkołach projektowania" } },
      { value: "20", label: { ru: "допников в конструкторе", en: "add-ons in the configurator", uz: "konstruktordagi qo‘shimcha", zh: "配置器中的增值功能", uk: "доповнень у конструкторі", pl: "dodatków w konfiguratorze" } },
      { value: "7", label: { ru: "планировок под метраж", en: "floor plans matched to area", uz: "maydonga mos reja", zh: "按面积匹配的户型", uk: "планувань під метраж", pl: "układów mieszkań dopasowanych do metrażu" } },
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
    date: "2026-08-20",
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
      uk: "Корпоративний сайт",
      pl: "Strona korporacyjna",
    },
    summary: {
      ru: "Мультиязычный сайт экспортёра сухофруктов и бобовых с собственной админкой.",
      en: "A multilingual site for an exporter of dried fruit and pulses, with a custom admin panel.",
      uz: "Quritilgan mevalar va dukkaklilar eksportchisi uchun o‘z admin paneliga ega ko‘p tilli sayt.",
      zh: "为干果与豆类出口商打造的多语言网站，配备自有后台。",
      uk: "Багатомовний сайт експортера сухофруктів і бобових із власною адмінкою.",
      pl: "Wielojęzyczna strona eksportera suszonych owoców i roślin strączkowych z własnym panelem administracyjnym.",
    },
    description: {
      ru: "Сайт для выхода на международных закупщиков: каталог продукции, новости с выставок, сертификаты и аудиты, география поставок. Весь контент правится менеджером через собственную админку на Supabase — от карточек товара до новостей и переводов. Никаких анимационных библиотек на клиенте: появление блоков сделано на IntersectionObserver и CSS, поэтому страницы остаются лёгкими даже на медленных соединениях.",
      en: "A site built to reach international buyers: a product catalogue, trade-show news, certificates and audits, delivery geography. All content is edited by a manager through a custom Supabase-backed admin panel — from product cards to news and translations. No animation libraries ship to the client: block reveals run on IntersectionObserver and CSS, so pages stay light even on slow connections.",
      uz: "Xalqaro xaridorlarga chiqish uchun sayt: mahsulot katalogi, ko‘rgazmalardan yangiliklar, sertifikatlar va auditlar, yetkazib berish geografiyasi. Butun kontentni menejer Supabase asosidagi o‘z admin paneli orqali tahrirlaydi. Mijozga hech qanday animatsiya kutubxonasi yuborilmaydi: bloklarning paydo bo‘lishi IntersectionObserver va CSS’da ishlaydi.",
      zh: "面向国际采购商的网站：产品目录、展会资讯、认证与审核记录、供货区域覆盖。全部内容由运营人员通过基于 Supabase 的自有后台维护 —— 从产品卡片到新闻与翻译。客户端不加载任何动画库：区块的出场效果基于 IntersectionObserver 与 CSS 实现，因此即使在慢速网络下页面依然轻量。",
      uk: "Сайт для виходу на міжнародних закупівельників: каталог продукції, новини з виставок, сертифікати й аудити, географія постачань. Увесь контент менеджер редагує через власну адмінку на Supabase — від карток товару до новин і перекладів. Жодних анімаційних бібліотек на клієнті: появу блоків зроблено на IntersectionObserver і CSS, тому сторінки залишаються легкими навіть на повільному з'єднанні.",
      pl: "Strona, która ma otworzyć drogę do zagranicznych kupców: katalog produktów, relacje z targów, certyfikaty i audyty, geografia dostaw. Całą treść menedżer edytuje we własnym panelu administracyjnym na Supabase — od kart produktów po aktualności i tłumaczenia. Żadnych bibliotek animacji po stronie klienta: pojawianie się bloków działa na IntersectionObserver i CSS, dzięki czemu strony pozostają lekkie nawet przy wolnym łączu.",
    },
    tech: ["Next.js", "React", "Tailwind CSS", "Supabase", "TypeScript"],
    metrics: [
      { value: "4", label: { ru: "языка с hreflang-разметкой", en: "languages with hreflang markup", uz: "hreflang belgilangan til", zh: "带 hreflang 标注的语言", uk: "мови з hreflang-розміткою", pl: "języki z oznaczeniem hreflang" } },
      { value: "0", label: { ru: "КБ анимационных библиотек", en: "KB of animation libraries", uz: "KB animatsiya kutubxonasi", zh: "动画库体积（KB）", uk: "КБ анімаційних бібліотек", pl: "KB bibliotek animacji" } },
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
    date: "2026-09-08",
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
      uk: "Три концепції сайту",
      pl: "Trzy koncepcje strony",
    },
    summary: {
      ru: "Поставщик подарочных наборов с 2011 года: три рабочих варианта новой главной — витрина, каталог с поиском по составу и премиум с барабаном архива.",
      en: "A gift-set supplier since 2011: three working versions of the new home page — a showcase, a catalogue searchable by contents and a premium edition with an archive drum.",
      uz: "2011-yildan beri sovg‘a to‘plamlari yetkazib beruvchi kompaniya: yangi bosh sahifaning uchta ishlaydigan varianti — vitrina, tarkib bo‘yicha qidiruvli katalog va arxiv barabanli premium.",
      zh: "自 2011 年起经营礼品套装的供应商：三个可运行的新首页版本 —— 展示型、可按成分搜索的目录型、带档案转盘的高端型。",
      uk: "Постачальник подарункових наборів із 2011 року: три робочі варіанти нової головної — вітрина, каталог із пошуком за складом і преміум із барабаном архіву.",
      pl: "Dostawca zestawów prezentowych od 2011 roku: trzy działające warianty nowej strony głównej — witryna, katalog z wyszukiwaniem po składzie i premium z bębnem archiwum.",
    },
    description: {
      ru: "Заказчик пришёл с сайтом-визиткой и сотней детских новогодних наборов. Вместо макетов собрали три полноценных варианта главной на одной витрине с переключателем. «Витрина» — быстрый сайт, где заявку оставляют с телефона за пятнадцать секунд. «Каталог» — восемьдесят наборов с поиском по составу, весу и цене. «Премиум» — тёмная кинематографичная версия с барабаном архива за девятнадцать сезонов, знаками восточного календаря на обложках, корзиной и формой заказа. От заказчика после осмотра нужно одно решение — выбрать направление.",
      en: "The client arrived with a one-page site and a hundred children's New Year gift sets. Instead of mockups we built three complete versions of the home page on one showcase with a switcher. «Showcase» — a fast site where an enquiry takes fifteen seconds from a phone. «Catalogue» — eighty sets searchable by contents, weight and price. «Premium» — a dark, cinematic edition with an archive drum spanning nineteen seasons, Eastern-calendar signs on the covers, a cart and an order form. After the walkthrough the client owes exactly one decision — which direction to take.",
      uz: "Buyurtmachi bir sahifali sayt va yuzga yaqin bolalar yangi yil sovg‘a to‘plamlari bilan keldi. Maketlar o‘rniga bitta vitrinada, almashtirgich bilan, bosh sahifaning uchta to‘liq variantini yig‘dik. «Vitrina» — telefondan o‘n besh soniyada buyurtma qoldiriladigan tez sayt. «Katalog» — tarkibi, og‘irligi va narxi bo‘yicha qidiriladigan sakson to‘plam. «Premium» — o‘n to‘qqiz mavsumlik arxiv barabani, muqovalarda sharq taqvimi belgilari, savat va buyurtma shakli bilan qorong‘i kinematografik versiya. Ko‘rib chiqqandan keyin buyurtmachidan bitta qaror kutiladi — yo‘nalishni tanlash.",
      zh: "客户带着一个名片式网站和上百款儿童新年礼品套装找到我们。我们没有画设计稿，而是在同一个展示页上做出三个完整可切换的首页版本。「展示型」—— 快速网站，用手机十五秒即可提交询单；「目录型」—— 八十款套装，可按成分、重量和价格搜索；「高端型」—— 深色电影感版本，配有跨越十九个季度的档案转盘、封面上的东方历法生肖标记、购物车与订单表单。客户看完只需做一个决定 —— 选择方向。",
      uk: "Замовник прийшов із сайтом-візиткою та сотнею дитячих новорічних наборів. Замість макетів ми зібрали три повноцінні варіанти головної на одній вітрині з перемикачем. «Вітрина» — швидкий сайт, де заявку залишають із телефона за п'ятнадцять секунд. «Каталог» — вісімдесят наборів із пошуком за складом, вагою та ціною. «Преміум» — темна кінематографічна версія з барабаном архіву за дев'ятнадцять сезонів, знаками східного календаря на обкладинках, кошиком і формою замовлення. Від замовника після перегляду потрібне одне рішення — обрати напрям.",
      pl: "Klient przyszedł ze stroną-wizytówką i setką noworocznych zestawów dla dzieci. Zamiast makiet zbudowaliśmy trzy pełnoprawne warianty strony głównej w jednej witrynie z przełącznikiem. „Witryna” — szybka strona, na której zapytanie z telefonu zostawia się w piętnaście sekund. „Katalog” — osiemdziesiąt zestawów z wyszukiwaniem po składzie, wadze i cenie. „Premium” — ciemna, kinowa wersja z bębnem archiwum z dziewiętnastu sezonów, znakami wschodniego kalendarza na okładkach, koszykiem i formularzem zamówienia. Po obejrzeniu klient musi podjąć tylko jedną decyzję — wybrać kierunek.",
    },
    tech: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS v4"],
    metrics: [
      { value: "3", label: { ru: "варианта главной на одной витрине", en: "home-page versions on one showcase", uz: "bitta vitrinadagi bosh sahifa varianti", zh: "同一展示页上的首页版本", uk: "варіанти головної на одній вітрині", pl: "warianty strony głównej w jednej witrynie" } },
      { value: "80", label: { ru: "наборов с поиском по составу", en: "sets searchable by contents", uz: "tarkib bo‘yicha qidiriladigan to‘plam", zh: "可按成分搜索的套装", uk: "наборів із пошуком за складом", pl: "zestawów z wyszukiwaniem po składzie" } },
      { value: "19", label: { ru: "сезонов в барабане архива", en: "seasons in the archive drum", uz: "arxiv baranidagi mavsum", zh: "档案转盘中的季度", uk: "сезонів у барабані архіву", pl: "sezonów w bębnie archiwum" } },
    ],
  },
  {
    slug: "tezketkaz",
    name: "TezKetKaz",
    monogram: "TKK",
    date: "2026-05",
    tier: 1,
    niches: ["доставка еды", "ресторанный бизнес", "HoReCa", "маркетплейс", "логистика", "食品配送", "food delivery"],
    forNiches: ["dostavka-edy", "restoran", "logistika"],
    accent: "green",
    category: {
      ru: "Маркетплейс доставки",
      en: "Delivery marketplace",
      uz: "Yetkazib berish marketpleysi",
      zh: "配送平台",
      uk: "Маркетплейс доставки",
      pl: "Marketplace dostaw",
    },
    summary: {
      ru: "Одно Flutter-приложение, три роли и синхронизация меню с кассами ресторанных сетей.",
      en: "One Flutter app, three roles and menu sync with restaurant-chain POS systems.",
      uz: "Bitta Flutter ilova, uch rol va restoran tarmoqlari kassalari bilan menyu sinxronizatsiyasi.",
      zh: "一个 Flutter 应用、三种角色，并与连锁餐厅收银系统同步菜单。",
      uk: "Один Flutter-застосунок, три ролі й синхронізація меню з касами ресторанних мереж.",
      pl: "Jedna aplikacja we Flutterze, trzy role i synchronizacja menu z systemami kasowymi sieci restauracji.",
    },
    description: {
      ru: "Маркетплейс доставки еды и продуктов для Узбекистана. Пользователь входит через Telegram — без SMS и паролей — и сам выбирает, в каком режиме открыть приложение: покупатель, курьер или менеджер ресторана. У каждой роли свой полноценный интерфейс. Для сетей сделан B2B-уровень: ресторан подключает свою iiko, Poster или 1С прямо из интерфейса, меню синхронизируется автоматически, а заказы возвращаются партнёру по webhook с HMAC-подписью. Инфраструктура — четыре контейнера с автоматическим SSL, Postgres, Redis и очередями BullMQ.",
      en: "A food and grocery delivery marketplace for Uzbekistan. Users sign in through Telegram — no SMS, no passwords — and choose which mode to open the app in: customer, courier or restaurant manager. Each role gets a full interface of its own. A B2B layer serves chains: a restaurant connects its iiko, Poster or 1C straight from the UI, the menu syncs automatically, and orders are returned to the partner over an HMAC-signed webhook. Infrastructure is four containers with automatic SSL, Postgres, Redis and BullMQ queues.",
      uz: "O‘zbekiston uchun oziq-ovqat va mahsulotlar yetkazib berish marketpleysi. Foydalanuvchi Telegram orqali kiradi — SMS va parolsiz — va ilovani qaysi rejimda ochishni o‘zi tanlaydi: xaridor, kuryer yoki restoran menejeri. Har bir rolning o‘z to‘liq interfeysi bor. Tarmoqlar uchun B2B daraja qilingan: restoran o‘z iiko, Poster yoki 1C tizimini interfeysdan ulaydi, menyu avtomatik sinxronlanadi, buyurtmalar esa HMAC imzosi bilan webhook orqali hamkorga qaytariladi.",
      zh: "面向乌兹别克斯坦的餐饮与生鲜配送平台。用户通过 Telegram 登录 —— 无需短信与密码 —— 并自行选择以哪种身份进入应用：顾客、骑手或餐厅管理员，每种角色都有各自完整的界面。平台为连锁品牌提供 B2B 能力：餐厅可直接在界面中接入自有的 iiko、Poster 或 1C，菜单自动同步，订单则通过带 HMAC 签名的 webhook 回传给合作方。基础设施由四个容器组成，具备自动 SSL、Postgres、Redis 与 BullMQ 队列。",
      uk: "Маркетплейс доставки їжі та продуктів для Узбекистану. Користувач входить через Telegram — без SMS і паролів — і сам обирає, у якому режимі відкрити застосунок: покупець, кур'єр чи менеджер ресторану. Кожна роль має свій повноцінний інтерфейс. Для мереж зроблено B2B-рівень: ресторан підключає свою iiko, Poster або 1С просто з інтерфейсу, меню синхронізується автоматично, а замовлення повертаються партнерові через webhook із HMAC-підписом. Інфраструктура — чотири контейнери з автоматичним SSL, Postgres, Redis і черги BullMQ.",
      pl: "Marketplace dostaw jedzenia i zakupów spożywczych dla Uzbekistanu. Użytkownik loguje się przez Telegram — bez SMS-ów i haseł — i sam wybiera, w jakim trybie otworzyć aplikację: kupującego, kuriera czy menedżera restauracji. Każda rola ma własny, pełnoprawny interfejs. Dla sieci przygotowaliśmy poziom B2B: restauracja podłącza swoje iiko, Poster lub 1C prosto z interfejsu, menu synchronizuje się automatycznie, a zamówienia wracają do partnera przez webhook z podpisem HMAC. Infrastruktura — cztery kontenery z automatycznym SSL, Postgres, Redis i kolejki BullMQ.",
    },
    tech: ["Flutter", "Node.js", "PostgreSQL", "Redis", "BullMQ", "Docker"],
    metrics: [
      {
        value: "3",
        label: { ru: "роли в одном приложении", en: "roles in one app", uz: "bitta ilovadagi rollar", zh: "同一应用中的角色数", uk: "ролі в одному застосунку", pl: "role w jednej aplikacji" },
      },
      {
        value: "100+",
        label: { ru: "точек сети на одной интеграции", en: "chain locations on one integration", uz: "bitta integratsiyadagi tarmoq nuqtalari", zh: "单次对接可覆盖门店数", uk: "точок мережі на одній інтеграції", pl: "punktów sieci na jednej integracji" },
      },
      {
        value: "0",
        label: { ru: "SMS для входа", en: "SMS needed to sign in", uz: "kirish uchun SMS", zh: "登录所需短信数", uk: "SMS для входу", pl: "SMS-ów przy logowaniu" },
      },
    ],
  },
  {
    slug: "harvest-motion",
    name: "Harvest in Motion",
    monogram: "HM",
    date: "2026-08-21",
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
      uk: "Анімаційний прототип",
      pl: "Prototyp z animacją",
    },
    summary: {
      ru: "Прототип сайта с прокруточной анимацией: заказчик открывает ссылку и листает работающий сайт, а не разглядывает макеты.",
      en: "A prototype site with a scroll-driven animation: the client opens one link and scrolls a working site instead of studying mockups.",
      uz: "Skroll animatsiyali sayt prototipi: buyurtmachi havolani ochadi va maketlarni ko‘rish o‘rniga ishlaydigan saytni varaqlaydi.",
      zh: "带滚动动效的网站原型：客户打开一个链接即可浏览可运行的网站，而不是对着设计稿揣摩。",
      uk: "Прототип сайту з анімацією під час прокручування: замовник відкриває посилання й гортає робочий сайт, а не розглядає макети.",
      pl: "Prototyp strony z animacją sterowaną przewijaniem: klient otwiera link i przewija działającą stronę, zamiast oglądać makiety.",
    },
    description: {
      ru: "Заказчик показал сайт европейского конкурента и спросил, реальны ли такие анимации. Отвечать словами в смете мы не стали — собрали работающий прототип на отдельном поддомене. Прокруточная сцена «Полёт урожая»: сухофрукты выходят в кадр, к ним подхватываются орехи, урожай раскладывается по корзинам, коробки уходят на погрузку, дальше — маршруты экспорта, и тут же разбор, сколько строк кода стоит каждый приём. Рядом две полные концепции оформления — кинематографичная тёмная и светлый каталог — и сам сайт на трёх языках с настоящим контентом и админкой. Всё собрано на одной странице-витрине с честной сводкой, какие данные подтверждены, а какие проставлены отраслевыми. Ноль анимационных библиотек: position: sticky, transform и один обработчик прокрутки; при включённом prefers-reduced-motion сцена показывает финальные кадры без движения. От заказчика после осмотра нужно единственное решение — выбрать направление.",
      en: "The client showed us a European competitor's site and asked whether animation like that was realistic. Rather than answer in words on an estimate, we built a working prototype on a separate subdomain. A scroll-driven scene, «Harvest in Motion»: dried fruit enters the frame, nuts join it, the harvest sorts itself into baskets, boxes move to loading, then the export routes — with a breakdown, right there, of how many lines of code each effect costs. Alongside it are two complete design concepts — a cinematic dark one and a light catalogue — plus the site itself in three languages with real content and an admin panel. Everything sits on one showcase page with an honest note on which figures are confirmed and which are industry defaults. Zero animation libraries: position: sticky, transform and a single scroll handler; with prefers-reduced-motion on, the scene shows its final frames without movement. After the walkthrough the client owes us exactly one decision — which direction to take.",
      uz: "Buyurtmachi Yevropa raqobatchisining saytini ko‘rsatib, shunday animatsiyalar realmi deb so‘radi. Biz smetada so‘z bilan javob bermadik — alohida subdomenda ishlaydigan prototip yig‘dik. «Hosil parvozi» skroll sahnasi: quritilgan mevalar kadrga chiqadi, ularga yong‘oqlar qo‘shiladi, hosil savatlarga taqsimlanadi, qutilar yuklashga ketadi, keyin eksport marshrutlari — va shu yerda har bir usul necha qator kod turishi tahlil qilinadi. Yonida ikkita to‘liq dizayn konsepsiyasi — kinematografik qorong‘i va yorug‘ katalog — hamda saytning o‘zi uch tilda, haqiqiy kontent va admin panel bilan. Hammasi bitta vitrina sahifasida, qaysi ma’lumot tasdiqlangani va qaysi biri soha bo‘yicha qo‘yilgani halol ko‘rsatilgan holda. Nol animatsiya kutubxonasi: position: sticky, transform va bitta skroll ishlovchisi; prefers-reduced-motion yoqilganda sahna yakuniy kadrlarni harakatsiz ko‘rsatadi.",
      zh: "客户拿出一家欧洲同行的网站，问这样的动效是否现实。我们没有在报价单上用文字作答，而是在独立子域名上做出了可运行的原型。随滚动推进的场景《丰收之旅》：干果进入画面，坚果随之汇入，收成分装入筐，纸箱送往装车，再到出口路线 —— 每一处效果各需多少行代码，就在旁边逐条讲明。与之并列的还有两套完整的设计概念 —— 电影感暗色版与明亮目录版 —— 以及三种语言、内容真实并配有后台的网站本身。所有内容集中在一个展示页上，并如实标注哪些数据已获确认、哪些取自行业惯例。零动画库：position: sticky、transform 与一个滚动监听；当用户开启 prefers-reduced-motion 时，场景直接呈现静止的最终画面。看完之后，客户只需做一个决定：选定方向。",
      uk: "Замовник показав сайт європейського конкурента й запитав, чи реальні такі анімації. Відповідати словами в кошторисі ми не стали — зібрали робочий прототип на окремому піддомені. Сцена під час прокручування «Політ урожаю»: у кадр виходять сухофрукти, до них підхоплюються горіхи, урожай розкладається по кошиках, коробки вирушають на завантаження, далі — маршрути експорту, і тут же розбір, скільки рядків коду коштує кожен прийом. Поруч — дві повні концепції оформлення, кінематографічна темна і світлий каталог, — і сам сайт трьома мовами зі справжнім контентом та адмінкою. Усе зібрано на одній сторінці-вітрині з чесним зведенням, які дані підтверджені, а які взято із середніх показників галузі. Нуль анімаційних бібліотек: position: sticky, transform і один обробник прокручування; якщо ввімкнено prefers-reduced-motion, сцена показує фінальні кадри без руху. Від замовника після перегляду потрібне єдине рішення — обрати напрям.",
      pl: "Klient pokazał stronę europejskiego konkurenta i zapytał, czy takie animacje są w ogóle realne. Nie odpowiadaliśmy słowami w kosztorysie — zbudowaliśmy działający prototyp na osobnej subdomenie. Scena przewijania „Lot plonów”: suszone owoce wchodzą w kadr, dołączają do nich orzechy, plony trafiają do koszy, kartony jadą do załadunku, dalej — trasy eksportowe, a przy tym od razu wyliczenie, ile linii kodu kosztuje każdy efekt. Obok dwie pełne koncepcje wizualne — ciemna, kinowa i jasny katalog — oraz sama strona w trzech językach z prawdziwą treścią i panelem administracyjnym. Wszystko zebrane na jednej stronie prezentacyjnej z uczciwym podsumowaniem, które dane są potwierdzone, a które uzupełniono wartościami branżowymi. Zero bibliotek animacji: position: sticky, transform i jedna obsługa przewijania; przy włączonym prefers-reduced-motion scena pokazuje końcowe kadry bez ruchu. Po obejrzeniu klient musi podjąć tylko jedną decyzję — wybrać kierunek.",
    },
    tech: ["HTML", "CSS", "JavaScript", "Next.js", "Tailwind CSS"],
    metrics: [
      { value: "2", label: { ru: "концепции оформления на выбор", en: "design concepts to choose from", uz: "tanlash uchun dizayn konsepsiyasi", zh: "可选的设计概念", uk: "концепції оформлення на вибір", pl: "koncepcje wizualne do wyboru" } },
      { value: "0", label: { ru: "КБ анимационных библиотек", en: "KB of animation libraries", uz: "KB animatsiya kutubxonasi", zh: "动画库体积（KB）", uk: "КБ анімаційних бібліотек", pl: "KB bibliotek animacji" } },
      { value: "3", label: { ru: "языка в прототипе", en: "languages in the prototype", uz: "prototipdagi tillar", zh: "原型中的语言版本", uk: "мови в прототипі", pl: "języki w prototypie" } },
    ],
  },
  {
    slug: "apollo-travel",
    name: "Apollo Travel",
    monogram: "AT",
    date: "2026-10-07",
    url: "https://globalex.maximov-tech.ru/apollo",
    tier: 2,
    niches: ["турагентство", "туризм", "туроператор", "туры", "горящие туры", "подбор тура", "авиабилеты", "путешествия", "travel agency", "tours", "tour operator", "sayohat", "turagentlik", "turizm agentligi", "旅行社"],
    // Владелец, 07.10.2026: на этот кейс можно ссылаться, если ниша — туризм.
    forNiches: ["turagentstvo"],
    accent: "green",
    category: {
      ru: "Сайт турагентства с поиском туров",
      en: "Travel agency site with tour search",
      uz: "Turlarni qidirish imkoniyatiga ega turagentlik sayti",
      zh: "带旅游线路搜索的旅行社网站",
      uk: "Сайт турагенції з пошуком турів",
      pl: "Strona biura podróży z wyszukiwarką wycieczek",
    },
    summary: {
      ru: "Турагентство в Ташкенте с поиском туров от 70+ туроператоров. Тот же движок поиска, но сайт вокруг него — как у крупных агрегаторов: форма одной строкой, самолёт летит по дуге, пока опрашиваются туроператоры, горящие туры — посадочными талонами, глобус с рейсами из Ташкента.",
      en: "A Tashkent travel agency with search across 70+ tour operators. The same search engine, but the site around it now looks like the big aggregators: a one-line search form, a plane flying an arc while the operators are queried, hot deals as boarding passes, a globe with flights from Tashkent.",
      uz: "Toshkentdagi turagentlik, 70 dan ortiq turoperator bo‘yicha turlarni qidiradi. Qidiruv mexanizmi o‘sha, lekin uning atrofidagi sayt yirik agregatorlardagidek: bir qatorli qidiruv shakli, turoperatorlar so‘ralayotganda yoy bo‘ylab uchayotgan samolyot, bort taloni ko‘rinishidagi «qaynoq» turlar, Toshkentdan reyslar ko‘rsatilgan globus.",
      zh: "塔什干的一家旅行社，可搜索 70 多家旅游批发商的线路。搜索引擎不变，但外围网站换成了大型聚合平台的水准：一行式搜索表单、查询批发商时沿弧线飞行的飞机、登机牌样式的特价线路，以及标出塔什干航线的地球仪。",
      uk: "Турагенція в Ташкенті з пошуком турів від 70+ туроператорів. Той самий рушій пошуку, але сайт навколо нього — як у великих агрегаторів: форма в один рядок, літак летить дугою, поки опитуються туроператори, гарячі тури — посадковими талонами, глобус із рейсами з Ташкента.",
      pl: "Biuro podróży w Taszkencie z wyszukiwarką wycieczek ponad 70 touroperatorów. Ten sam silnik wyszukiwania, ale strona wokół niego wygląda jak u dużych agregatorów: formularz w jednej linii, samolot lecący po łuku, gdy odpytywani są touroperatorzy, okazje last minute jako karty pokładowe i globus z lotami z Taszkentu.",
    },
    description: {
      ru: "Как у многих агентств, поиск туров на их сайте — готовый движок, поставленный на страницу: он ищет у туроператоров и ведёт клиента к выдаче. Менять движок незачем — мы переодели всё вокруг него. Форма с вкладками «Туры / Авиабилеты / Отели» передаёт поиск движку ссылкой, ожидание превращено в сцену: самолёт летит по дуге из Ташкента к курорту, логотипы туроператоров отмечаются по мере опроса, растёт счётчик найденных туров. Горящие туры — карточки-талоны с обратным отсчётом, страны — с временем полёта, визой и сезоном, тарифы авиакомпаний — их собственные, в виде посадочных талонов. В конструкторе — подбор «куда полететь на мой бюджет» на глобусе, календарь низких цен, визовый помощник, рассрочка, оплата Payme и Click и автопостинг горящих туров в Telegram-канал.",
      en: "As at many agencies, the tour search on their site is a ready-made engine placed on the page: it queries the tour operators and takes the client to the results. There is no reason to change the engine — we re-dressed everything around it. A form with «Tours / Flights / Hotels» tabs hands the search to the engine by link, and the wait becomes a scene: a plane flies an arc from Tashkent to the resort, operator logos tick off as they are queried, and a counter of found tours climbs. Hot deals are boarding-pass cards with a countdown, destinations show flight time, visa and season, and the airline fares are their own, laid out as boarding passes. The configurator adds «where can I fly on my budget» on a globe, a low-price calendar, a visa helper, instalments, Payme and Click payments and auto-posting of hot deals to their Telegram channel.",
      uz: "Ko‘plab agentliklardagi kabi, ularning saytidagi turlarni qidirish — sahifaga qo‘yilgan tayyor mexanizm: u turoperatorlardan qidiradi va mijozni natijalarga olib boradi. Mexanizmni almashtirishga hojat yo‘q — biz uning atrofidagi hamma narsani yangiladik. «Turlar / Aviachiptalar / Mehmonxonalar» yorliqli shakl qidiruvni mexanizmga havola orqali uzatadi, kutish esa sahnaga aylangan: samolyot Toshkentdan kurortgacha yoy bo‘ylab uchadi, turoperatorlar logotiplari so‘ralgan sari belgilanadi, topilgan turlar hisoblagichi o‘sib boradi. «Qaynoq» turlar — teskari sanoqli talon-kartochkalar, mamlakatlar — parvoz vaqti, viza va mavsum bilan, aviakompaniyalar tariflari — o‘zlariniki, bort taloni ko‘rinishida. Konstruktorda — globusda «byudjetimga qayerga uchsam bo‘ladi» tanlovi, arzon narxlar taqvimi, viza yordamchisi, muddatli to‘lov, Payme va Click orqali to‘lov hamda «qaynoq» turlarni Telegram-kanalga avtomatik joylash.",
      zh: "和许多旅行社一样，他们网站上的线路搜索是一个嵌入页面的现成引擎：它向批发商查询，并把客户带到结果页。引擎没有必要更换 —— 我们重做的是它周围的一切。带「旅游线路 / 机票 / 酒店」标签的表单通过链接把搜索交给引擎，等待过程变成一段动画：飞机从塔什干沿弧线飞向度假地，批发商的标志随着查询逐一打勾，找到的线路数量不断增长。特价线路是带倒计时的登机牌卡片，目的地标出飞行时间、签证和季节，航空公司票价来自他们自己的数据，以登机牌形式呈现。配置器里还有：在地球仪上按预算挑选目的地、低价日历、签证助手、分期付款、Payme 与 Click 支付，以及把特价线路自动发布到 Telegram 频道。",
      uk: "Як і в багатьох агенцій, пошук турів на їхньому сайті — готовий рушій, поставлений на сторінку: він шукає в туроператорів і веде клієнта до видачі. Міняти рушій нема чого — ми переодягли все навколо нього. Форма з вкладками «Тури / Авіаквитки / Готелі» передає пошук рушію посиланням, а очікування перетворене на сцену: літак летить дугою з Ташкента до курорту, логотипи туроператорів позначаються в міру опитування, росте лічильник знайдених турів. Гарячі тури — картки-талони зі зворотним відліком, країни — з часом польоту, візою й сезоном, тарифи авіакомпаній — їхні власні, у вигляді посадкових талонів. У конструкторі — добір «куди полетіти на мій бюджет» на глобусі, календар низьких цін, візовий помічник, розстрочка, оплата Payme і Click та автопостинг гарячих турів у Telegram-канал.",
      pl: "Jak w wielu biurach, wyszukiwarka wycieczek na ich stronie to gotowy silnik osadzony na stronie: odpytuje touroperatorów i prowadzi klienta do wyników. Nie ma powodu go zmieniać — przebraliśmy wszystko wokół niego. Formularz z zakładkami „Wycieczki / Bilety lotnicze / Hotele” przekazuje wyszukiwanie silnikowi linkiem, a oczekiwanie zamienia się w scenę: samolot leci po łuku z Taszkentu do kurortu, logotypy touroperatorów odhaczają się w miarę odpytywania, a licznik znalezionych wycieczek rośnie. Okazje last minute to karty pokładowe z odliczaniem, kierunki pokazują czas lotu, wizę i sezon, a taryfy linii lotniczych są ich własne, w formie kart pokładowych. W konfiguratorze: wybór „dokąd polecę za mój budżet” na globusie, kalendarz niskich cen, pomocnik wizowy, raty, płatności Payme i Click oraz automatyczne publikowanie okazji last minute na kanale w Telegramie.",
    },
    tech: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS v4", "Motion", "cobe", "GPT Image"],
    metrics: [
      { value: "70+", label: { ru: "туроператоров в одном поиске", en: "tour operators in one search", uz: "bitta qidiruvdagi turoperator", zh: "一次搜索覆盖的批发商", uk: "туроператорів в одному пошуку", pl: "touroperatorów w jednym wyszukiwaniu" } },
      { value: "4", label: { ru: "авиакомпании с их собственными тарифами", en: "airlines with their own fares", uz: "o‘z tariflari bilan aviakompaniya", zh: "家航空公司的自有票价", uk: "авіакомпанії з їхніми власними тарифами", pl: "linie lotnicze z ich własnymi taryfami" } },
      { value: "15", label: { ru: "блоков в конструкторе сайта", en: "blocks in the site configurator", uz: "sayt konstruktoridagi blok", zh: "网站配置器中的模块", uk: "блоків у конструкторі сайту", pl: "bloków w konfiguratorze strony" } },
    ],
  },
  {
    slug: "engelberg",
    name: "Engelberg",
    monogram: "EB",
    date: "2026-10-06",
    // Вторая, фотореалистичная версия — её владелец выбрал кейсом (07.10.2026).
    // Макет закрыт паролем: ссылка ведёт на страницу ввода, пароль даёт менеджер.
    url: "https://globalex.maximov-tech.ru/engelberg/v2",
    tier: 1,
    niches: ["окна", "окна и двери", "оконные системы", "алюминиевые окна", "раздвижные системы", "фасадное остекление", "фурнитура", "производитель окон", "windows", "window systems", "aluminium windows", "deraza", "derazalar", "门窗"],
    // Макет для конкретной компании: в письмах другим не показываем.
    forNiches: [],
    accent: "gold",
    category: {
      ru: "Сайт-история на прокрутке для производителя окон",
      en: "Scroll-story site for a window manufacturer",
      uz: "Deraza ishlab chiqaruvchisi uchun aylantirishdagi hikoya-sayt",
      zh: "门窗品牌的滚动叙事网站",
      uk: "Сайт-історія на прокрутці для виробника вікон",
      pl: "Strona-opowieść przy przewijaniu dla producenta okien",
    },
    summary: {
      ru: "Премиальные окна, раздвижные и фасадные системы. Одна непрерывная история на прокрутке: камера спускается с Альп к дому, где встают окна в пол, пролетает сквозь разрез профиля и выходит в комнату к ручке. Каждый кадр — фотореалистичный рендер вокруг их настоящих товаров.",
      en: "Premium windows, sliding and facade systems. One continuous scroll story: the camera descends from the Alps to a house where floor-to-ceiling windows go in, flies through a cut of the profile and comes out in a room at the handle. Every frame is a photorealistic render built around their real products.",
      uz: "Premium derazalar, surma va fasad tizimlari. Aylantirishdagi bitta uzluksiz hikoya: kamera Alp tog‘laridan uyga tushadi, u yerda poldan shiftgacha derazalar o‘rnatiladi, profil kesimi orqali uchib o‘tadi va xonada tutqichga yetib keladi. Har bir kadr — ularning haqiqiy mahsulotlari atrofidagi fotorealistik render.",
      zh: "高端门窗、推拉与幕墙系统。一段连续的滚动叙事：镜头从阿尔卑斯山降到一栋房子前，落地窗逐一装上，再穿过型材剖面，最后进入室内停在把手上。每一帧都是围绕其真实产品的照片级渲染。",
      uk: "Преміальні вікна, розсувні та фасадні системи. Одна безперервна історія на прокрутці: камера спускається з Альп до будинку, де стають вікна в підлогу, пролітає крізь розріз профілю й виходить у кімнату до ручки. Кожен кадр — фотореалістичний рендер навколо їхніх справжніх товарів.",
      pl: "Okna premium, systemy przesuwne i fasadowe. Jedna ciągła opowieść przy przewijaniu: kamera zjeżdża z Alp do domu, w którym pojawiają się okna od podłogi do sufitu, przelatuje przez przekrój profilu i wychodzi w pokoju przy klamce. Każde ujęcie to fotorealistyczny render wokół ich prawdziwych produktów.",
    },
    description: {
      ru: "Заказчик хотел «вау со скроллом и непрерывной веткой повествования», как у mont-fort.com и Bentley. Сцена одна и приколота к экрану, камерой ведёт прокрутка. Переходы — без склеек: пары кадров сделаны правкой одного снимка и совпадают попиксельно, поэтому меняется сам мир в кадре — пустой дом получает окна, за стеклом той же комнаты начинается метель, створки раздвижной BKH 65 уезжают, на каркасе фасада FS 50 по этажам встаёт стекло. Разрез профиля и ручка — по их фото из каталога, с тремя контурами, потоками холодного и тёплого воздуха и гербом на рычаге. Характеристики — только с их сайта. Первая версия того же макета собрана на стоке и вектором.",
      en: "The client wanted «wow scrolling with a continuous storyline», like mont-fort.com and Bentley. There is one scene pinned to the screen, and scrolling drives the camera. Transitions have no cuts: pairs of frames were made by editing a single shot and match pixel for pixel, so the world inside the frame changes instead — an empty house gets its windows, a snowstorm starts behind the glass of the same room, the BKH 65 sliding panels glide away, and glass goes onto the FS 50 facade frame floor by floor. The profile cut and the handle follow their catalogue photos, with three thermal zones, cold and warm air flows and the crest on the lever. Specifications come only from their site. The first version of the same mock-up is built from stock photos and vector art.",
      uz: "Buyurtmachi mont-fort.com va Bentley’dagidek «aylantirishda vau va uzluksiz hikoya» xohladi. Sahna bitta va ekranga mahkamlangan, kamerani aylantirish boshqaradi. O‘tishlar kesimsiz: kadr juftliklari bitta suratni tahrirlash orqali qilingan va piksel-pikselgacha mos keladi, shuning uchun kadrdagi dunyoning o‘zi o‘zgaradi — bo‘sh uyga derazalar o‘rnatiladi, o‘sha xonaning oynasi ortida bo‘ron boshlanadi, BKH 65 surma tabaqalari siljiydi, FS 50 fasad karkasiga qavatma-qavat shisha o‘rnatiladi. Profil kesimi va tutqich — ularning katalogidagi suratlar bo‘yicha: uch kontur, sovuq va iliq havo oqimlari, richagdagi gerb bilan. Tavsiflar faqat ularning saytidan. Xuddi shu maketning birinchi versiyasi stok suratlar va vektorda yig‘ilgan.",
      zh: "客户想要像 mont-fort.com 和 Bentley 那样「滚动带来惊艳、叙事一气呵成」。整个页面只有一个固定在屏幕上的场景，由滚动驱动镜头。转场没有剪接：成对的画面由同一张图修改而来、逐像素对齐，因此变化的是画面里的世界本身 —— 空房子装上窗户，同一个房间的玻璃外下起暴风雪，BKH 65 推拉扇缓缓滑开，FS 50 幕墙骨架上玻璃逐层装好。型材剖面和把手依据其产品目录照片制作，展示三道隔热层、冷暖气流和把手上的徽章。技术参数全部取自其官网。同一样稿的第一版用图库照片和矢量图完成。",
      uk: "Замовник хотів «вау на прокрутці й безперервну лінію оповіді», як у mont-fort.com і Bentley. Сцена одна й закріплена на екрані, камерою керує прокрутка. Переходи — без склейок: пари кадрів зроблено правкою одного знімка, і вони збігаються піксель у піксель, тож змінюється сам світ у кадрі — порожній будинок отримує вікна, за склом тієї ж кімнати починається хуртовина, стулки розсувної BKH 65 від'їжджають, на каркасі фасаду FS 50 поверх за поверхом стає скло. Розріз профілю й ручка — за їхніми фото з каталогу, з трьома контурами, потоками холодного й теплого повітря та гербом на важелі. Характеристики — лише з їхнього сайту. Перша версія того ж макета зібрана на стоку й векторі.",
      pl: "Klient chciał „efektu wow przy przewijaniu i ciągłej narracji”, jak mont-fort.com i Bentley. Scena jest jedna i przypięta do ekranu, kamerą steruje przewijanie. Przejścia są bez cięć: pary ujęć powstały przez edycję jednego zdjęcia i pokrywają się co do piksela, więc zmienia się sam świat w kadrze — pusty dom dostaje okna, za szybą tego samego pokoju zaczyna się zamieć, skrzydła przesuwnego BKH 65 odjeżdżają, a na szkielecie fasady FS 50 piętro po piętrze pojawia się szkło. Przekrój profilu i klamka powstały na podstawie zdjęć z ich katalogu, z trzema strefami, przepływem zimnego i ciepłego powietrza oraz herbem na dźwigni. Parametry pochodzą wyłącznie z ich strony. Pierwsza wersja tej samej makiety powstała ze zdjęć stockowych i grafiki wektorowej.",
    },
    tech: ["Next.js 16", "React 19", "TypeScript", "Lenis", "Canvas", "GPT Image"],
    metrics: [
      { value: "11", label: { ru: "сцен в одном непрерывном кадре", en: "scenes in one continuous shot", uz: "bitta uzluksiz kadrdagi sahna", zh: "一镜到底的场景", uk: "сцен в одному безперервному кадрі", pl: "scen w jednym ciągłym ujęciu" } },
      { value: "17", label: { ru: "фотореалистичных кадров вокруг их товаров", en: "photorealistic frames around their products", uz: "ularning mahsulotlari atrofidagi fotorealistik kadr", zh: "围绕其产品的照片级画面", uk: "фотореалістичних кадрів навколо їхніх товарів", pl: "fotorealistycznych ujęć wokół ich produktów" } },
      { value: "60", label: { ru: "кадров в секунду на телефоне", en: "frames per second on a phone", uz: "telefonda soniyasiga kadr", zh: "手机端每秒帧数", uk: "кадрів на секунду на телефоні", pl: "klatek na sekundę na telefonie" } },
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
    date: "2026-09-18",
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
      uk: "Макет головної для забудовника",
      pl: "Makieta strony głównej dla dewelopera",
    },
    summary: {
      ru: "Застройщик с семью жилыми комплексами в Ташкенте и уже приличным сайтом. Один макет главной, доведённый до конца, — с тем, чего старому сайту не хватало: движение, подбор квартиры и расчёт ипотеки на их собственных данных.",
      en: "A developer with seven residential complexes in Tashkent and an already decent site. One home-page mock-up taken all the way — with what the old site lacked: motion, a flat picker and a mortgage calculation on the company's own data.",
      uz: "Toshkentda yettita turar-joy majmuasi va allaqachon yaxshi sayti bor quruvchi kompaniya. Oxirigacha yetkazilgan bitta bosh sahifa maketi — eski saytda yetishmagan narsalar bilan: harakat, kvartira tanlash va kompaniyaning o‘z ma’lumotlari asosida ipoteka hisobi.",
      zh: "一家在塔什干拥有七个住宅项目、网站本已不错的开发商。一版完整打磨的首页样稿 —— 补上旧站缺少的三样东西：动效、选房器，以及基于公司自有数据的房贷测算。",
      uk: "Забудовник із сімома житловими комплексами в Ташкенті й уже пристойним сайтом. Один макет головної, доведений до кінця, — з тим, чого бракувало старому сайту: рух, підбір квартири й розрахунок іпотеки на їхніх власних даних.",
      pl: "Deweloper z siedmioma osiedlami w Taszkencie i całkiem przyzwoitą stroną. Jedna makieta strony głównej dopracowana do końca — z tym, czego brakowało starej stronie: ruchem, wyborem mieszkania i kalkulatorem kredytu hipotecznego na ich własnych danych.",
    },
    description: {
      ru: "Не «три варианта на выбор», как у MAVERA, а один: у заказчика уже был приличный сайт, и разговор шёл не о том, каким он будет, а о том, чего ему не хватает. Порядок разделов повторяет их сайт — жилые комплексы, подбор квартиры, коммерция на первых этажах, ход строительства, пять шагов покупки, новости, контакты, — чтобы сравнивать было легко. Карточка комплекса меняется целиком, вместе с фотографией и тем, что есть рядом. Под выбранной квартирой сразу открывается расчёт ипотеки по условиям покупателя. Отдельно — панель управления, в которой всё это правится без разработчика.",
      en: "Not «three versions to choose from», as with MAVERA, but one: the client already had a decent site, so the conversation was not about what it should become but about what it was missing. The order of sections repeats their site — residential complexes, flat picker, ground-floor commercial space, construction progress, five steps to buying, news, contacts — so the two are easy to compare. The complex card changes as a whole, together with its photo and what is nearby. Under the chosen flat a mortgage calculation on the buyer's terms opens at once. Alongside it is an admin panel where all of this is edited without a developer.",
      uz: "MAVERA’dagidek «tanlash uchun uchta variant» emas, bitta: buyurtmachida allaqachon yaxshi sayt bor edi, shuning uchun gap sayt qanday bo‘lishi haqida emas, unga nima yetishmasligi haqida bordi. Bo‘limlar tartibi ularning saytini takrorlaydi — turar-joy majmualari, kvartira tanlash, birinchi qavatlardagi tijorat binolari, qurilish jarayoni, xaridning besh qadami, yangiliklar, kontaktlar — taqqoslash oson bo‘lishi uchun. Majmua kartochkasi to‘liq almashadi, surati va yaqin atrofdagi narsalar bilan birga. Tanlangan kvartira ostida darhol xaridor shartlari bo‘yicha ipoteka hisobi ochiladi. Alohida — bularning barchasini dasturchisiz tahrirlash mumkin bo‘lgan boshqaruv paneli.",
      zh: "不像 MAVERA 那样给出「三个版本任选」，而是只做一个：客户已经有一个不错的网站，要讨论的不是它该变成什么样，而是它还缺什么。版块顺序沿用其现有网站 —— 住宅项目、选房、首层商业、工程进度、购房五步、新闻、联系方式 —— 方便逐项对比。项目卡片整体切换，照片和周边配套随之更新。选中房源后，下方立即展开按购房者条件计算的房贷方案。另配管理后台，所有内容无需开发者即可修改。",
      uk: "Не «три варіанти на вибір», як у MAVERA, а один: у замовника вже був пристойний сайт, і йшлося не про те, яким він буде, а про те, чого йому бракує. Порядок розділів повторює їхній сайт — житлові комплекси, підбір квартири, комерційні приміщення на перших поверхах, хід будівництва, п'ять кроків купівлі, новини, контакти, — щоб порівнювати було легко. Картка комплексу змінюється повністю, разом із фотографією і тим, що є поруч. Під обраною квартирою одразу відкривається розрахунок іпотеки за умовами покупця. Окремо — панель керування, у якій усе це редагується без розробника.",
      pl: "Nie „trzy warianty do wyboru”, jak w przypadku MAVERA, lecz jeden: klient miał już przyzwoitą stronę, więc rozmowa nie dotyczyła tego, jaka ma być, tylko tego, czego jej brakuje. Kolejność sekcji powtarza ich stronę — osiedla, wybór mieszkania, lokale usługowe na parterach, postęp budowy, pięć kroków zakupu, aktualności, kontakt — żeby łatwo było porównać. Karta osiedla zmienia się w całości, razem ze zdjęciem i tym, co jest w okolicy. Pod wybranym mieszkaniem od razu otwiera się kalkulator kredytu według warunków kupującego. Osobno — panel administracyjny, w którym wszystko to edytuje się bez programisty.",
    },
    tech: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS v4"],
    metrics: [
      { value: "7", label: { ru: "жилых комплексов на их собственных данных", en: "residential complexes on the company's own data", uz: "kompaniyaning o‘z ma’lumotlaridagi turar-joy majmuasi", zh: "基于公司自有数据的住宅项目", uk: "житлових комплексів на їхніх власних даних", pl: "osiedli na ich własnych danych" } },
      { value: "3", label: { ru: "вещи, которых не хватало сайту: движение, подбор, ипотека", en: "things the site lacked: motion, picker, mortgage", uz: "saytga yetishmagan narsa: harakat, tanlash, ipoteka", zh: "旧站所缺：动效、选房、房贷", uk: "речі, яких бракувало сайту: рух, підбір, іпотека", pl: "rzeczy, których brakowało stronie: ruch, wybór, kredyt" } },
      { value: "5", label: { ru: "шагов покупки от звонка до ключей", en: "steps from the first call to the keys", uz: "qo‘ng‘iroqdan kalitgacha xarid qadami", zh: "从来电到交钥匙的购房步骤", uk: "кроків купівлі від дзвінка до ключів", pl: "kroków zakupu od telefonu do kluczy" } },
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
    date: "2026-09-22",
    url: "https://globalex.maximov-tech.ru/namuna",
    tier: 2,
    niches: ["мебель", "мебель на заказ", "кухни на заказ", "мебельная фабрика", "калькулятор", "редизайн", "furniture", "mebel", "家具"],
    // Пример для мебельщиков в письмах. Раньше макеты под конкретную
    // компанию в письма не ставились; владелец, 28.09: «пусть ссылается на
    // релевантные проекты» — мебельной компании показываем мебель, а не
    // маркетплейс мастеров.
    forNiches: ["mebel"],
    accent: "green",
    category: {
      ru: "Макет главной для мебельной фабрики",
      en: "Home-page mock-up for a furniture factory",
      uz: "Mebel fabrikasi uchun bosh sahifa maketi",
      zh: "家具工厂首页样稿",
      uk: "Макет головної для меблевої фабрики",
      pl: "Makieta strony głównej dla fabryki mebli",
    },
    summary: {
      ru: "Фабрика корпусной мебели с быстрым сайтом и хорошими фотографиями, но без цен и без единой формы заявки. Макет главной, собранный главами, с калькулятором на восемь типов мебели и заявкой прямо из него.",
      en: "A cabinet-furniture factory with a fast site and good photos, but no prices and not a single enquiry form. A home-page mock-up told in chapters, with a calculator for eight furniture types and an enquiry sent straight from it.",
      uz: "Tez sayti va yaxshi suratlari bor, lekin narxlari ham, birorta buyurtma shakli ham bo‘lmagan korpus mebel fabrikasi. Boblardan tuzilgan bosh sahifa maketi: sakkiz turdagi mebel uchun kalkulyator va to‘g‘ridan-to‘g‘ri undan buyurtma.",
      zh: "一家板式家具工厂：网站速度快、照片出色，却没有价格，也没有任何询单表单。一版按章节讲述的首页样稿，配有覆盖八类家具的计算器，并可直接从中提交询单。",
      uk: "Фабрика корпусних меблів зі швидким сайтом і гарними фотографіями, але без цін і без жодної форми заявки. Макет головної, зібраний із розділів, із калькулятором на вісім типів меблів і заявкою просто з нього.",
      pl: "Fabryka mebli skrzyniowych z szybką stroną i dobrymi zdjęciami, ale bez cen i bez ani jednego formularza zapytania. Makieta strony głównej zbudowana z rozdziałów, z kalkulatorem dla ośmiu typów mebli i zapytaniem wysyłanym prosto z niego.",
    },
    description: {
      ru: "Перед макетом разобрали живой сайт и начали с сильного: он быстрый, картинки грузятся лениво, фотографии свои. Мешали продавать две вещи. Порядок цены узнать было нельзя — квиз собирал ответы, но ничего не считал. И оставить заявку было негде: на главной шесть телефонов и ни одной формы, а вечером звонить не готов почти никто. В макете калькулятор: кухня, гардеробная, гостиная или квартира целиком — объём, материалы и фурнитура, вилка и срок пересчитываются на каждом нажатии, и заявка уходит со всем составом. Есть и обратный ход — «назовите бюджет, подберём состав». Страница построена главами с индикатором прочитанного; две главы, производство и финал, тёмные. Рядом — чат и панель управления.",
      en: "Before the mock-up we reviewed the live site and began with its strengths: it is fast, images load lazily, the photos are their own. Two things got in the way of selling. There was no way to learn even the order of prices — the quiz collected answers but calculated nothing. And there was nowhere to leave an enquiry: six phone numbers on the home page and not a single form, while almost nobody is ready to call in the evening. The mock-up has a calculator: a kitchen, a walk-in wardrobe, a living room or a whole flat — volume, materials and fittings, with the range and lead time recalculated on every tap, and the enquiry goes out with the full list. There is also the reverse route — «name your budget and we'll suggest a set». The page is told in chapters with a reading-progress indicator; two chapters, production and the finale, are dark. Alongside are a chat and an admin panel.",
      uz: "Maketdan oldin jonli saytni tahlil qildik va kuchli tomonlaridan boshladik: u tez, rasmlar kerak bo‘lganda yuklanadi, suratlar o‘ziniki. Sotishga ikki narsa xalaqit berardi. Narx tartibini bilishning iloji yo‘q edi — kviz javoblarni yig‘ardi, lekin hech narsa hisoblamasdi. Buyurtma qoldirishga ham joy yo‘q edi: bosh sahifada oltita telefon va birorta shakl yo‘q, kechqurun esa deyarli hech kim qo‘ng‘iroq qilishga tayyor emas. Maketda kalkulyator bor: oshxona, kiyim xonasi, mehmonxona yoki butun kvartira — hajm, materiallar va furnitura, oraliq va muddat har bosishda qayta hisoblanadi, buyurtma esa butun tarkibi bilan yuboriladi. Teskari yo‘l ham bor — «byudjetni ayting, tarkibni tanlaymiz». Sahifa o‘qilganlik ko‘rsatkichi bilan boblardan tuzilgan; ikki bob — ishlab chiqarish va yakun — qorong‘i. Yonida — chat va boshqaruv paneli.",
      zh: "做样稿之前，我们先分析了现有网站，并从优点说起：速度快、图片按需加载、照片都是自己拍的。妨碍成交的有两点：连价格的大致区间都无从得知 —— 问卷只收集答案，什么也不计算；也没有地方留下询单 —— 首页有六个电话，却没有一个表单，而晚上几乎没人愿意打电话。样稿里有一个计算器：厨房、衣帽间、客厅或整套住宅 —— 体量、材料与五金，每点一下都会重新计算价格区间和工期，询单连同完整清单一起发出。还有反向入口 ——「说出预算，我们来配方案」。页面按章节展开，顶部有阅读进度；生产和结尾两章为深色。另配在线沟通和管理后台。",
      uk: "Перед макетом ми розібрали живий сайт і почали з сильних сторін: він швидкий, картинки вантажаться ліниво, фотографії власні. Продавати заважали дві речі. Дізнатися бодай порядок ціни було неможливо — квіз збирав відповіді, але нічого не рахував. І залишити заявку не було де: на головній шість телефонів і жодної форми, а ввечері телефонувати готові мало хто. У макеті — калькулятор: кухня, гардеробна, вітальня чи квартира повністю — обсяг, матеріали та фурнітура, вилка й строк перераховуються після кожного натискання, і заявка надходить з усім складом. Є і зворотний шлях — «назвіть бюджет, підберемо склад». Сторінку побудовано розділами з індикатором прочитаного; два розділи, виробництво й фінал, темні. Поруч — чат і панель керування.",
      pl: "Przed makietą przeanalizowaliśmy działającą stronę i zaczęliśmy od mocnych stron: jest szybka, obrazy ładują się leniwie, zdjęcia są własne. Sprzedawać przeszkadzały dwie rzeczy. Nie dało się poznać choćby rzędu wielkości ceny — quiz zbierał odpowiedzi, ale niczego nie liczył. I nie było gdzie zostawić zapytania: na stronie głównej sześć numerów telefonu i ani jednego formularza, a wieczorem mało kto chce dzwonić. W makiecie jest kalkulator: kuchnia, garderoba, salon albo całe mieszkanie — wielkość, materiały i okucia, widełki i termin przeliczają się przy każdym kliknięciu, a zapytanie trafia do firmy z całym zestawieniem. Działa to też w drugą stronę — „podaj budżet, dobierzemy zestaw”. Strona składa się z rozdziałów ze wskaźnikiem postępu czytania; dwa rozdziały, produkcja i finał, są ciemne. Obok — czat i panel administracyjny.",
    },
    tech: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS v4"],
    metrics: [
      { value: "8", label: { ru: "типов мебели в калькуляторе", en: "furniture types in the calculator", uz: "kalkulyatordagi mebel turi", zh: "计算器覆盖的家具类别", uk: "типів меблів у калькуляторі", pl: "typów mebli w kalkulatorze" } },
      { value: "0", label: { ru: "форм заявки было на старой главной", en: "enquiry forms on the old home page", uz: "eski bosh sahifadagi buyurtma shakli", zh: "旧首页上的询单表单数", uk: "форм заявки було на старій головній", pl: "formularzy zapytania na starej stronie głównej" } },
      { value: "2", label: { ru: "тёмные главы: производство и финал", en: "dark chapters: production and the finale", uz: "qorong‘i bob: ishlab chiqarish va yakun", zh: "深色章节：生产与结尾", uk: "темні розділи: виробництво та фінал", pl: "ciemne rozdziały: produkcja i finał" } },
    ],
  },
  {
    slug: "comfort-mebel",
    name: "Comfort Mebel",
    monogram: "CM",
    date: "2026-09-29",
    url: "https://globalex.maximov-tech.ru/comfort",
    tier: 2,
    niches: ["мебель", "мебельная фабрика", "мебельный магазин", "мягкая мебель", "диваны", "спальные гарнитуры", "шкафы", "мебель в рассрочку", "furniture", "furniture store", "mebel", "mebel do‘koni", "家具"],
    // Второй пример для мебели — фабрика с сетью магазинов. Первым в письма
    // по-прежнему идёт Namuna: подбор берёт первый подходящий кейс.
    forNiches: ["mebel"],
    accent: "violet",
    category: {
      ru: "Макет сайта мебельной фабрики",
      en: "Website mock-up for a furniture factory",
      uz: "Mebel fabrikasi uchun sayt maketi",
      zh: "家具工厂网站样稿",
      uk: "Макет сайту меблевої фабрики",
      pl: "Makieta strony fabryki mebli",
    },
    summary: {
      ru: "Фабрика и сеть мебельных магазинов в Ташкенте с 2007 года: около 300 моделей — диваны, обеденные группы, спальни, шкафы. Рабочий сайт в двух палитрах, где мебель видно на ощупь: макро их ткани на первом экране, проверка «влезет ли» по размерам комнаты и сумма в месяц прямо в карточке.",
      en: "A furniture factory and store chain in Tashkent since 2007: about 300 models — sofas, dining sets, bedrooms, wardrobes. A working site in two palettes where you can almost touch the furniture: a macro shot of their fabric on the first screen, a «will it fit» check against the room's dimensions and the monthly instalment right in the product card.",
      uz: "2007-yildan beri Toshkentda ishlayotgan mebel fabrikasi va do‘konlar tarmog‘i: 300 ga yaqin model — divanlar, ovqatlanish to‘plamlari, yotoqxona to‘plamlari, shkaflar. Ikki palitradagi ishlaydigan sayt, unda mebelni go‘yo qo‘l bilan his qilish mumkin: birinchi ekranda ularning matosi makro suratda, xona o‘lchamlari bo‘yicha «sig‘adimi» tekshiruvi va kartochkaning o‘zida oylik to‘lov.",
      zh: "一家自 2007 年起扎根塔什干的家具工厂及门店网络：约 300 款产品 —— 沙发、餐桌椅组合、卧室套装、衣柜。一个有两套配色的可用网站，让家具仿佛触手可及：首屏是他们面料的微距画面，按房间尺寸检查「放得下吗」，月供金额直接显示在商品卡片上。",
      uk: "Фабрика й мережа меблевих магазинів у Ташкенті з 2007 року: близько 300 моделей — дивани, обідні групи, спальні, шафи. Робочий сайт у двох палітрах, де меблі видно на дотик: макро їхньої тканини на першому екрані, перевірка «чи влізе» за розмірами кімнати та сума на місяць просто в картці.",
      pl: "Fabryka i sieć salonów meblowych w Taszkencie od 2007 roku: około 300 modeli — sofy, zestawy jadalniane, sypialnie, szafy. Działająca strona w dwóch paletach, na której meble widać niemal w dotyku: makro ich tkaniny na pierwszym ekranie, sprawdzenie „czy się zmieści” według wymiarów pokoju i miesięczna rata od razu w karcie produktu.",
    },
    description: {
      ru: "Мебель покупают руками: трогают ткань, садятся, прикидывают, встанет ли диван у стены. Сайт отвечает на это без шоурума. Первый экран — макро их ткани во весь экран, а стеклянная линза под курсором или пальцем показывает ту же модель целиком. Сцена прокрутки начинается с подлокотника с зарядкой и отъезжает до модульного дивана — не перехватывая прокрутку. «Влезет ли» сверяет стену, глубину, дверной проём и потолок с настоящими габаритами модели и рисует план комнаты в масштабе, а у шкафа проверяет даже подъём при сборке. В карточке — сумма в месяц по их рассрочке Uzum и Anor. Каталог с фильтрами и сравнением, цвета по настоящим фото, запись в шоурум и узбекская версия. Нынешний сайт фабрики грузит 108 файлов стилей и 83 скрипта, первый байт приходит через 2,5–3 секунды.",
      en: "Furniture is bought by hand: people touch the fabric, sit down, work out whether the sofa will fit by the wall. The site answers that without a showroom. The first screen is a full-screen macro of their fabric, and a glass lens under the cursor or finger shows the same model in full. A scroll scene starts at an armrest with a built-in charger and pulls back to a modular sofa — without hijacking the scroll. «Will it fit» checks the wall, depth, doorway and ceiling against the model's real dimensions and draws a to-scale room plan; for a wardrobe it even checks whether it can be tilted up during assembly. Each card shows the monthly amount under their Uzum and Anor instalment plans. A catalogue with filters and comparison, colours from real photos, showroom booking and an Uzbek version. The factory's current site loads 108 stylesheets and 83 scripts, and the first byte arrives after 2.5–3 seconds.",
      uz: "Mebelni qo‘l bilan sotib olishadi: matoni ushlab ko‘rishadi, o‘tirib ko‘rishadi, divan devor yoniga sig‘adimi — chamalashadi. Sayt bunga shourumsiz javob beradi. Birinchi ekran — ularning matosi butun ekran bo‘ylab makro suratda, kursor yoki barmoq ostidagi shisha linza esa o‘sha modelni to‘liq ko‘rsatadi. Aylantirish sahnasi zaryadlovchili qo‘ltiqtayanchdan boshlanib, modulli divangacha uzoqlashadi — aylantirishni tortib olmasdan. «Sig‘adimi» devor, chuqurlik, eshik o‘rni va shiftni modelning haqiqiy o‘lchamlari bilan solishtiradi va xona rejasini masshtabda chizadi, shkafda esa yig‘ishda ko‘tarib bo‘ladimi — buni ham tekshiradi. Kartochkada — Uzum va Anor muddatli to‘lovi bo‘yicha oylik summa. Filtrlar va solishtirishga ega katalog, haqiqiy suratlar bo‘yicha ranglar, shourumga yozilish va o‘zbekcha versiya. Fabrikaning hozirgi sayti 108 ta uslub fayli va 83 ta skript yuklaydi, birinchi bayt 2,5–3 soniyadan keyin keladi.",
      zh: "家具是用手买的：摸面料、坐上去、估算沙发能否靠墙放下。这个网站无需展厅就能回答这些问题。首屏是他们面料的全屏微距画面，光标或手指下的玻璃透镜则显示同一款产品的全貌。滚动场景从带充电口的扶手开始，一路拉远到模块化沙发 —— 且不劫持滚动。「放得下吗」将墙面、进深、门洞和层高与产品真实尺寸比对，并按比例绘出房间平面图；对衣柜还会检查组装时能否竖起。卡片上显示按其 Uzum 与 Anor 分期计算的月供。带筛选与对比的目录、按真实照片呈现的颜色、展厅预约以及乌兹别克语版本。工厂现有网站需加载 108 个样式文件和 83 个脚本，首字节要 2.5–3 秒才到达。",
      uk: "Меблі купують руками: торкаються тканини, сідають, прикидають, чи стане диван біля стіни. Сайт відповідає на це без шоуруму. Перший екран — макро їхньої тканини на весь екран, а скляна лінза під курсором чи пальцем показує ту саму модель повністю. Сцена прокручування починається з підлокітника із зарядкою й від'їжджає до модульного дивана — не перехоплюючи прокручування. «Чи влізе» звіряє стіну, глибину, дверний проріз і стелю зі справжніми габаритами моделі та малює план кімнати в масштабі, а для шафи перевіряє навіть підйом під час складання. У картці — сума на місяць за їхньою розстрочкою Uzum та Anor. Каталог із фільтрами й порівнянням, кольори за справжніми фото, запис до шоуруму та узбецька версія. Нинішній сайт фабрики вантажить 108 файлів стилів і 83 скрипти, перший байт приходить через 2,5–3 секунди.",
      pl: "Meble kupuje się rękami: dotyka się tkaniny, siada, ocenia, czy sofa zmieści się pod ścianą. Strona odpowiada na to bez salonu. Pierwszy ekran to pełnoekranowe makro ich tkaniny, a szklana soczewka pod kursorem lub palcem pokazuje ten sam model w całości. Scena przewijania zaczyna się od podłokietnika z ładowarką i oddala się do sofy modułowej — bez przejmowania przewijania. „Czy się zmieści” porównuje ścianę, głębokość, otwór drzwiowy i sufit z rzeczywistymi wymiarami modelu i rysuje plan pokoju w skali, a przy szafie sprawdza nawet, czy da się ją podnieść podczas montażu. W karcie — miesięczna kwota według ich rat Uzum i Anor. Katalog z filtrami i porównaniem, kolory według prawdziwych zdjęć, zapis do salonu i wersja uzbecka. Obecna strona fabryki ładuje 108 plików stylów i 83 skrypty, a pierwszy bajt przychodzi po 2,5–3 sekundach.",
    },
    tech: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS v4"],
    metrics: [
      { value: "300", label: { ru: "моделей в каталоге фабрики", en: "models in the factory catalogue", uz: "fabrika katalogidagi model", zh: "工厂目录中的产品", uk: "моделей у каталозі фабрики", pl: "modeli w katalogu fabryki" } },
      { value: "4", label: { ru: "размера сверяет «Влезет ли»: стена, глубина, дверь, потолок", en: "measurements checked by «Will it fit»: wall, depth, door, ceiling", uz: "o‘lchamni «Sig‘adimi» tekshiradi: devor, chuqurlik, eshik, shift", zh: "项尺寸由「放得下吗」核对：墙面、进深、门、层高", uk: "розміри звіряє «Чи влізе»: стіна, глибина, двері, стеля", pl: "wymiary sprawdza „Czy się zmieści”: ściana, głębokość, drzwi, sufit" } },
      { value: "2", label: { ru: "палитры у одного рабочего сайта", en: "palettes for one working site", uz: "bitta ishlaydigan sayt uchun palitra", zh: "套配色，同一个可用网站", uk: "палітри в одного робочого сайту", pl: "palety jednej działającej strony" } },
    ],
  },
  {
    slug: "medacademy",
    name: "MedAcademy",
    monogram: "MA",
    date: "2026-10-01",
    url: "https://globalex.maximov-tech.ru/medacademy",
    tier: 2,
    niches: ["учебный центр", "подготовка к поступлению", "курсы химии", "курсы биологии", "медвуз", "DTM", "o'quv markazi", "education", "培训中心"],
    // Пример для учебных центров в письмах: калькулятор балла и подбор курса
    // — то, что учебному центру показать честнее, чем мебель или стройку.
    forNiches: ["uchebnyy-centr"],
    accent: "violet",
    category: {
      ru: "Макет сайта центра подготовки в медвузы",
      en: "Website mock-up for a medical-school prep centre",
      uz: "Tibbiyot oliygohlariga tayyorlov markazi sayti maketi",
      zh: "医学院升学辅导中心网站样稿",
      uk: "Макет сайту центру підготовки до медвишів",
      pl: "Makieta strony ośrodka przygotowującego na studia medyczne",
    },
    summary: {
      ru: "Курсы биологии и химии в Ташкенте, чьи преподаватели сами поступили в ТМА со 180,5 и 179,2 балла из 189 — а на сайте об этом не было ни слова. Два совершенно разных варианта с калькулятором балла DTM и записью в Telegram в одно касание.",
      en: "Biology and chemistry courses in Tashkent whose teachers themselves got into the Tashkent Medical Academy with 180.5 and 179.2 points out of 189 — and the site said nothing about it. Two completely different versions with a DTM score calculator and one-tap sign-up via Telegram.",
      uz: "Toshkentdagi biologiya va kimyo kurslari: o‘qituvchilarning o‘zi TTAga 189 dan 180,5 va 179,2 ball bilan kirgan — saytda esa bu haqda bir og‘iz ham yo‘q edi. DTM bali kalkulyatori va Telegram orqali bir bosishda yozilish bilan ikki xil variant.",
      zh: "塔什干的生物与化学课程：老师们自己以 189 分制中的 180.5 分和 179.2 分考入塔什干医学院，网站却只字未提。两版截然不同的方案，配有 DTM 分数计算器，一键通过 Telegram 报名。",
      uk: "Курси біології та хімії в Ташкенті, чиї викладачі самі вступили до ТМА зі 180,5 і 179,2 бала зі 189 — а на сайті про це не було ані слова. Два цілком різні варіанти з калькулятором бала DTM і записом у Telegram одним дотиком.",
      pl: "Kursy biologii i chemii w Taszkencie, których wykładowcy sami dostali się na Taszkencką Akademię Medyczną z wynikiem 180,5 i 179,2 punktu na 189 — a strona nie wspominała o tym ani słowem. Dwie zupełnie różne wersje z kalkulatorem wyniku DTM i zapisem przez Telegram jednym dotknięciem.",
    },
    description: {
      ru: "Старый сайт измерили, а не оценили на глаз: главная весит 9,7 МБ и догружается 8 секунд, шрифт заголовков без кириллицы, страница преподавателей уезжает вбок на телефоне, а самое сильное — баллы, USMLE и IELTS преподавателей — спрятано в карточках. Сделали два разных сайта. «Клиника» — тёплая бумага, книжная антиква и красная линия ЭКГ из их логотипа, которая ведёт по странице. «Лаборатория» — ультрафиолет и лайм, таблица элементов и живые молекулы на первом экране, экспресс-тест и карточки-перевёртыши. В обоих — калькулятор балла DTM по официальной формуле: ученик видит свой балл из 189 рядом с баллами будущих преподавателей. Каждая кнопка открывает чат администратора с готовым текстом. Внизу — конструктор: подбор курса, запись, проверка сертификата, кабинет ученика, оплата и языки включаются прямо на странице.",
      en: "We measured the old site rather than eyeballing it: the home page weighs 9.7 MB and takes 8 seconds to finish loading, the heading font has no Cyrillic, the teachers page scrolls sideways on a phone, and the strongest argument — the teachers' scores, USMLE and IELTS — is hidden inside cards. We built two different sites. «Clinic» — warm paper, a book serif and the red ECG line from their logo running down the page. «Laboratory» — ultraviolet and lime, a periodic-table hero with living molecules, a quick test and flip cards. Both have a DTM score calculator built on the official formula: a student sees their score out of 189 next to the scores of their future teachers. Every button opens the administrator's chat with a ready-made message. At the bottom is a configurator: course finder, sign-up, certificate check, student account, payment and languages switch on right on the page.",
      uz: "Eski saytni ko‘z bilan emas, o‘lchab baholadik: bosh sahifa 9,7 MB va 8 soniyada to‘liq yuklanadi, sarlavha shriftida kirill yo‘q, o‘qituvchilar sahifasi telefonda yon tomonga siljiydi, eng kuchli dalil — o‘qituvchilarning ballari, USMLE va IELTS — kartochkalar ichida yashiringan. Ikki xil sayt qildik. «Klinika» — iliq qog‘oz, kitob antiqvasi va ularning logotipidagi qizil EKG chizig‘i sahifa bo‘ylab yo‘l ko‘rsatadi. «Laboratoriya» — ultrabinafsha va laym, birinchi ekranda elementlar jadvali va jonli molekulalar, ekspress-test va aylanadigan kartochkalar. Ikkalasida ham rasmiy formula bo‘yicha DTM bali kalkulyatori: o‘quvchi 189 dan o‘z balini bo‘lajak o‘qituvchilarining ballari yonida ko‘radi. Har bir tugma administrator chatini tayyor matn bilan ochadi. Pastda — konstruktor: kurs tanlash, yozilish, sertifikatni tekshirish, o‘quvchi kabineti, to‘lov va tillar sahifaning o‘zida yoqiladi.",
      zh: "我们没有凭感觉评判旧网站，而是实测：首页 9.7 MB，要 8 秒才加载完；标题字体不含西里尔字母；教师页在手机上会横向溢出；最有力的卖点 —— 老师们的分数、USMLE 和 IELTS —— 却藏在卡片里。我们做了两个不同的网站。「诊所」：暖白纸色、书卷气衬线体，以及取自其标志的红色心电图线贯穿页面。「实验室」：紫外与酸性青柠配色，首屏是元素周期表与流动的分子，还有快速测验和可翻转的教师卡片。两版都配有按官方公式计算的 DTM 分数计算器：学生能看到自己的分数（满分 189）与未来老师当年分数的对比。每个按钮都会打开管理员聊天并附上预填好的消息。页面底部是配置器：选课、报名、证书查验、学员个人中心、在线支付和多语言可直接在页面上开启。",
      uk: "Старий сайт ми виміряли, а не оцінили на око: головна важить 9,7 МБ і довантажується 8 секунд, шрифт заголовків без кирилиці, сторінка викладачів на телефоні з'їжджає вбік, а найсильніше — бали, USMLE та IELTS викладачів — сховано в картках. Зробили два різні сайти. «Клініка» — тепле паперове тло, книжкова антиква і червона лінія ЕКГ з їхнього логотипа, що веде сторінкою. «Лабораторія» — ультрафіолет і лайм, таблиця елементів і живі молекули на першому екрані, експрес-тест і картки-перевертні. В обох — калькулятор бала DTM за офіційною формулою: учень бачить свій бал зі 189 поруч із балами майбутніх викладачів. Кожна кнопка відкриває чат адміністратора з готовим текстом. Унизу — конструктор: підбір курсу, запис, перевірка сертифіката, кабінет учня, оплата і мови вмикаються просто на сторінці.",
      pl: "Starą stronę zmierzyliśmy, a nie oceniliśmy na oko: strona główna waży 9,7 MB i ładuje się do końca 8 sekund, czcionka nagłówków nie ma cyrylicy, strona wykładowców na telefonie przewija się w bok, a najmocniejszy argument — wyniki, USMLE i IELTS wykładowców — był schowany w kartach. Zrobiliśmy dwie różne strony. «Klinika» — ciepły papier, książkowy szeryf i czerwona linia EKG z ich logo prowadząca przez stronę. «Laboratorium» — ultrafiolet i limonka, układ okresowy i żywe cząsteczki na pierwszym ekranie, szybki test i odwracane karty. W obu jest kalkulator wyniku DTM według oficjalnego wzoru: uczeń widzi swój wynik na 189 obok wyników przyszłych wykładowców. Każdy przycisk otwiera czat z administratorem z gotową wiadomością. Na dole jest konfigurator: dobór kursu, zapis, weryfikacja certyfikatu, konto ucznia, płatność i języki włączają się od razu na stronie.",
    },
    tech: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS v4", "Canvas 2D"],
    metrics: [
      { value: "2", label: { ru: "совершенно разных варианта сайта", en: "completely different site versions", uz: "butunlay boshqa sayt varianti", zh: "两版截然不同的网站", uk: "цілком різні варіанти сайту", pl: "zupełnie różne wersje strony" } },
      { value: "189", label: { ru: "баллов DTM — калькулятор по официальной формуле", en: "DTM points — a calculator on the official formula", uz: "DTM bali — rasmiy formula bo‘yicha kalkulyator", zh: "DTM 满分 —— 按官方公式计算", uk: "балів DTM — калькулятор за офіційною формулою", pl: "punktów DTM — kalkulator według oficjalnego wzoru" } },
      { value: "9,7", label: { ru: "МБ весила старая главная", en: "MB — the weight of the old home page", uz: "MB — eski bosh sahifa og‘irligi", zh: "MB —— 旧首页的体积", uk: "МБ важила стара головна", pl: "MB ważyła stara strona główna" } },
    ],
  },
  {
    slug: "delta",
    name: "Delta IT-School",
    monogram: "DIT",
    date: "2026-09-23",
    url: "https://globalex.maximov-tech.ru/delta",
    tier: 2,
    niches: ["IT-школа", "детская IT-школа", "программирование для детей", "курсы программирования", "школа программирования", "учебный центр", "образование для детей", "kids coding", "coding school", "IT maktab", "dasturlash kurslari", "少儿编程"],
    // Второй пример для учебных центров. Первым в письма по-прежнему идёт
    // MedAcademy: подбор берёт первый подходящий кейс.
    forNiches: ["uchebnyy-centr"],
    accent: "blue",
    category: {
      ru: "Макет сайта детской IT-школы",
      en: "Website mock-up for a children's IT school",
      uz: "Bolalar IT-maktabi uchun sayt maketi",
      zh: "少儿 IT 学校网站样稿",
      uk: "Макет сайту дитячої IT-школи",
      pl: "Makieta strony szkoły IT dla dzieci",
    },
    summary: {
      ru: "Школа программирования для детей 6–17 лет в Узбекистане: код, логика и IT-английский. Своего сайта у школы не было — только Telegram-канал и Instagram. Макет отвечает на вопросы родителя в том порядке, в каком он их задаёт, и начинается с песочницы, где ребёнок пишет первую программу прямо на первом экране.",
      en: "A programming school for children aged 6–17 in Uzbekistan: code, logic and IT English. The school had no website of its own — only a Telegram channel and Instagram. The mock-up answers a parent's questions in the order they ask them, starting with a sandbox where the child writes a first program right on the first screen.",
      uz: "O‘zbekistondagi 6–17 yoshli bolalar uchun dasturlash maktabi: kod, mantiq va IT-ingliz tili. Maktabning o‘z sayti yo‘q edi — faqat Telegram-kanal va Instagram. Maket ota-onaning savollariga u ularni qanday tartibda bersa, xuddi shu tartibda javob beradi va bola birinchi ekranning o‘zida ilk dasturini yozadigan qumdon bilan boshlanadi.",
      zh: "一所面向 6–17 岁孩子的乌兹别克斯坦编程学校：代码、逻辑与 IT 英语。学校此前没有自己的网站 —— 只有 Telegram 频道和 Instagram。样稿按家长提问的顺序逐一作答，开篇是一个沙盒，孩子在首屏就能写出第一个程序。",
      uk: "Школа програмування для дітей 6–17 років в Узбекистані: код, логіка та IT-англійська. Власного сайту школа не мала — лише Telegram-канал та Instagram. Макет відповідає на запитання батьків у тому порядку, в якому вони їх ставлять, і починається з пісочниці, де дитина пише першу програму просто на першому екрані.",
      pl: "Szkoła programowania dla dzieci w wieku 6–17 lat w Uzbekistanie: kod, logika i angielski dla IT. Szkoła nie miała własnej strony — tylko kanał na Telegramie i Instagram. Makieta odpowiada na pytania rodzica w kolejności, w jakiej je zadaje, i zaczyna się od piaskownicy, w której dziecko pisze pierwszy program od razu na pierwszym ekranie.",
    },
    description: {
      ru: "Сначала — разбор: все 36 постов канала школы, какие из них смотрят в десять раз чаще остальных, и как родителей привлекают Skillbox Kids, Алгоритмика, KIBERone и другие. По нему и выстроена страница. «Ему будет интересно?» — песочница из трёх уровней: последовательность, повороты, цикл; ракета в форме их знака летит к звезде, рядом та же программа текстом. «С чего начать?» — ступени по возрасту: их треугольник-дельта наполняется при прокрутке, а подбор за три вопроса сам заполняет форму записи. Дальше — первый урок, основатель школы с их фотографиями и словами, истории учеников со ссылками на посты в канале, Deltcoin — копилка баллов и настоящие призы школы, кабинет родителя и открытый экзамен. Заявка уходит менеджеру в Telegram. Ничего не придумано: чего школа не публикует — цен, адреса, расписания, — то на странице отсылает к менеджеру.",
      en: "It starts with research: all 36 posts of the school's channel, which of them get ten times more views than the rest, and how Skillbox Kids, Algorithmics, KIBERone and others attract parents. The page is built on it. «Will my child enjoy it?» — a three-level sandbox: sequence, turns, loop; a rocket shaped like their logo flies to a star, with the same program as text beside it. «Where do we start?» — steps by age: their delta triangle fills up as you scroll, and a three-question picker fills in the sign-up form by itself. Then the first lesson, the school's founder with their own photos and words, student stories linked to posts in the channel, Deltcoin — a points piggy bank and the school's real prizes, a parent's dashboard and an open exam. A request goes to the manager in Telegram. Nothing is made up: whatever the school does not publish — prices, address, timetable — the page refers to the manager.",
      uz: "Avval — tahlil: maktab kanalidagi barcha 36 ta post, ulardan qaysilari boshqalaridan o‘n barobar ko‘p ko‘riladi va Skillbox Kids, Algoritmika, KIBERone va boshqalar ota-onalarni qanday jalb qiladi. Sahifa shunga asoslanib qurilgan. «Unga qiziq bo‘ladimi?» — uch darajali qumdon: ketma-ketlik, burilishlar, sikl; ularning belgisi shaklidagi raketa yulduz tomon uchadi, yonida esa o‘sha dastur matn ko‘rinishida. «Nimadan boshlash kerak?» — yoshga qarab bosqichlar: ularning delta-uchburchagi aylantirilganda to‘lib boradi, uch savollik tanlov esa yozilish formasini o‘zi to‘ldiradi. Keyin — birinchi dars, maktab asoschisi ularning suratlari va so‘zlari bilan, kanaldagi postlarga havolali o‘quvchilar hikoyalari, Deltcoin — ballar jamg‘armasi va maktabning haqiqiy sovg‘alari, ota-ona kabineti va ochiq imtihon. Ariza Telegramda menejerga ketadi. Hech narsa o‘ylab topilmagan: maktab nimani e’lon qilmasa — narxlar, manzil, jadval — sahifada o‘sha joylar menejerga yo‘naltiradi.",
      zh: "先做调研：学校频道的全部 36 篇帖子、哪些帖子的浏览量是其他帖子的十倍，以及 Skillbox Kids、Algoritmika、KIBERone 等如何吸引家长。页面正是据此搭建。「孩子会感兴趣吗？」—— 一个三关卡沙盒：顺序、转向、循环；一枚他们标志形状的火箭飞向星星，旁边是同一段程序的文字版。「从哪里开始？」—— 按年龄划分的阶梯：他们的三角形 Delta 标志随滚动逐渐填满，三道题的选课测试会自动填好报名表。接着是第一节课、带有他们自己照片和话语的学校创始人、附频道帖子链接的学员故事、Deltcoin —— 积分存钱罐与学校真实的奖品、家长后台以及公开考试。报名申请会发送到经理的 Telegram。没有任何虚构：学校未公开的内容 —— 价格、地址、课表 —— 页面上都引导联系经理。",
      uk: "Спершу — аналіз: усі 36 дописів каналу школи, які з них переглядають удесятеро частіше за інші, і як батьків залучають Skillbox Kids, Алгоритміка, KIBERone та інші. На ньому й побудовано сторінку. «Йому буде цікаво?» — пісочниця з трьох рівнів: послідовність, повороти, цикл; ракета у формі їхнього знака летить до зірки, поруч та сама програма текстом. «З чого почати?» — сходинки за віком: їхній трикутник-дельта наповнюється під час прокручування, а підбір за три запитання сам заповнює форму запису. Далі — перший урок, засновник школи з їхніми фото й словами, історії учнів із посиланнями на дописи в каналі, Deltcoin — скарбничка балів і справжні призи школи, кабінет батьків і відкритий іспит. Заявка надходить менеджеру в Telegram. Нічого не вигадано: чого школа не публікує — цін, адреси, розкладу, — те на сторінці відсилає до менеджера.",
      pl: "Najpierw analiza: wszystkie 36 postów kanału szkoły, które z nich mają dziesięć razy więcej wyświetleń niż reszta i jak rodziców przyciągają Skillbox Kids, Algorithmics, KIBERone i inni. Na tej podstawie zbudowano stronę. „Czy to go zainteresuje?” — piaskownica z trzech poziomów: sekwencja, skręty, pętla; rakieta w kształcie ich znaku leci do gwiazdy, obok ten sam program w formie tekstu. „Od czego zacząć?” — stopnie według wieku: ich trójkąt-delta wypełnia się podczas przewijania, a dobór w trzech pytaniach sam wypełnia formularz zapisu. Dalej — pierwsza lekcja, założyciel szkoły z ich zdjęciami i słowami, historie uczniów z linkami do postów na kanale, Deltcoin — skarbonka punktów i prawdziwe nagrody szkoły, panel rodzica i otwarty egzamin. Zgłoszenie trafia do menedżera na Telegramie. Nic nie jest zmyślone: tego, czego szkoła nie publikuje — cen, adresu, planu zajęć — strona odsyła do menedżera.",
    },
    tech: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS v4"],
    metrics: [
      { value: "36", label: { ru: "постов канала школы разобрано", en: "posts from the school's channel analysed", uz: "maktab kanalidagi post tahlil qilindi", zh: "篇学校频道帖子经过分析", uk: "дописів каналу школи розібрано", pl: "postów z kanału szkoły przeanalizowano" } },
      { value: "3", label: { ru: "уровня песочницы на первом экране", en: "sandbox levels on the first screen", uz: "birinchi ekrandagi qumdon darajasi", zh: "个首屏沙盒关卡", uk: "рівні пісочниці на першому екрані", pl: "poziomy piaskownicy na pierwszym ekranie" } },
      { value: "6–17", label: { ru: "лет — возраст учеников, ступени под каждый", en: "years — the students' ages, with a step for each", uz: "yosh — o‘quvchilar yoshi, har biriga bosqich", zh: "岁 —— 学员年龄，每个年龄段都有对应阶梯", uk: "років — вік учнів, сходинки під кожен", pl: "lat — wiek uczniów, stopnie dla każdego" } },
    ],
  },
  {
    slug: "arsenal-d",
    name: "Arsenal D",
    monogram: "AD",
    date: "2026-10-02",
    url: "https://globalex.maximov-tech.ru/webname",
    tier: 2,
    niches: ["регистратор доменов", "домены .uz", "хостинг", "VPS", "SSL", "веб-студия", "domain registrar", "web hosting", "domen ro'yxatdan o'tkazish", "hosting", "域名注册"],
    // Ниши «хостинг и домены» в классификаторе нет — пример находится по
    // словам из `niches`, а не по ключу.
    forNiches: [],
    accent: "blue",
    category: {
      ru: "Макет сайта регистратора .UZ и хостинга",
      en: "Website mock-up for a .UZ registrar and host",
      uz: ".UZ registratori va hosting sayti maketi",
      zh: ".UZ 域名注册商与主机服务商网站样稿",
      uk: "Макет сайту реєстратора .UZ і хостингу",
      pl: "Makieta strony rejestratora .UZ i hostingu",
    },
    summary: {
      ru: "Аккредитованный регистратор зоны .UZ, у которого первый экран занимала форма входа, а поисковик видел пустую страницу. Макет, где имя печатается в адресной строке, а на свидетельство падает печать «Свободен».",
      en: "An accredited .UZ registrar whose first screen was a login form and whose pages looked empty to search engines. A mock-up where the name types itself into the address bar and a «Free» stamp lands on the certificate.",
      uz: "Birinchi ekranini kirish shakli egallagan, qidiruv tizimi esa bo‘sh sahifani ko‘rgan .UZ zonasining akkreditatsiyalangan registratori. Nom manzil satriga o‘zi yoziladigan, guvohnomaga esa «Bo‘sh» muhri tushadigan maket.",
      zh: "一家 .UZ 域名的授权注册商：首屏被登录表单占据，搜索引擎看到的是空白页面。样稿里，名字会自己在地址栏中打出，「可注册」的印章随即盖在证书上。",
      uk: "Акредитований реєстратор зони .UZ, у якого перший екран займала форма входу, а пошуковик бачив порожню сторінку. Макет, де ім'я друкується в адресному рядку, а на свідоцтво падає печатка «Вільний».",
      pl: "Akredytowany rejestrator strefy .UZ, którego pierwszy ekran zajmował formularz logowania, a wyszukiwarka widziała pustą stronę. Makieta, w której nazwa sama wpisuje się w pasek adresu, a na świadectwo spada pieczęć «Wolna».",
    },
    description: {
      ru: "Старый сайт измерили: поисковик получает 2,9 КБ без единого слова — всё рисует скрипт, первая отрисовка — больше 6 секунд, на телефоне при входе экран закрывают две шторки, а поиск домена стоит под формой входа с капчей. Мы собрали мир «реестра»: защищённая бумага с гильошем, кобальтовые чернила и красная печать — цвет буквы «D» из их логотипа. На первом экране имя само печатается в адресной строке, марки зон показывают, где оно свободно и сколько стоит год в сумах, а на свидетельство падает печать. Дальше — табло освободившихся доменов, как в аэропорту, все тарифы хостинга в сумах, глобус зон и жизненный цикл домена. Конструктор включает калькулятор «домен + хостинг + сайт», перенос в три шага, DNS-панель, статус серверов, кабинет и оплату Payme, Click и Uzum прямо на странице.",
      en: "We measured the old site: a search engine receives 2.9 KB without a single word — everything is drawn by a script — the first paint takes over 6 seconds, on a phone two bottom sheets cover the screen on arrival, and domain search sits under a login form with a captcha. We built a «registry» world: security paper with guilloche, cobalt ink and a red stamp — the colour of the «D» in their logo. On the first screen the name types itself into the address bar, zone stamps show where it is free and what a year costs in sum, and a stamp lands on the certificate. Further down: an airport-style board of freshly released domains, every hosting plan in sum, a globe of zones and the life cycle of a domain. The configurator switches on a «domain + hosting + website» calculator, a three-step transfer, a DNS panel, server status, a client account and Payme, Click and Uzum payments right on the page.",
      uz: "Eski saytni o‘lchadik: qidiruv tizimi bitta so‘zsiz 2,9 KB oladi — hammasini skript chizadi, birinchi chizilish 6 soniyadan ortiq, telefonda kirishda ekranni ikki parda yopadi, domen qidiruvi esa kapchali kirish shakli ostida turadi. Biz «reestr» olamini yaratdik: gilosh naqshli himoyalangan qog‘oz, kobalt siyoh va qizil muhr — ularning logotipidagi «D» harfi rangi. Birinchi ekranda nom manzil satriga o‘zi yoziladi, zona markalari u qayerda bo‘shligini va bir yili necha so‘m turishini ko‘rsatadi, guvohnomaga esa muhr tushadi. Keyin — aeroportdagidek bo‘shagan domenlar tablosi, so‘mdagi barcha hosting tariflari, zonalar globusi va domenning hayot sikli. Konstruktor «domen + hosting + sayt» kalkulyatorini, uch qadamda ko‘chirishni, DNS panelni, serverlar holatini, kabinetni va Payme, Click va Uzum orqali to‘lovni sahifaning o‘zida yoqadi.",
      zh: "我们先实测了旧网站：搜索引擎拿到的是 2.9 KB、一个字都没有的页面 —— 全部内容由脚本绘制；首次绘制超过 6 秒；手机打开时两层底部弹窗遮住屏幕；域名搜索被放在带验证码的登录表单下面。我们打造了一个「注册登记处」的世界：带扭索纹的防伪纸、钴蓝墨水，以及取自其标志中字母「D」的红色印章。首屏上，名字会自己在地址栏中打出，各后缀的「邮票」显示哪里可注册、一年多少苏姆，印章随即盖在证书上。往下是机场航班牌式的新释放域名看板、全部以苏姆标价的主机套餐、域名后缀地球仪和域名生命周期。配置器可在页面上直接开启「域名 + 主机 + 网站」计算器、三步转移、DNS 面板、服务器状态、个人中心，以及 Payme、Click、Uzum 在线支付。",
      uk: "Старий сайт ми виміряли: пошуковик отримує 2,9 КБ без жодного слова — усе малює скрипт, перше відмальовування — понад 6 секунд, на телефоні під час входу екран закривають дві шторки, а пошук домену стоїть під формою входу з капчею. Ми зібрали світ «реєстру»: захищений папір із гільйошем, кобальтове чорнило і червона печатка — колір літери «D» з їхнього логотипа. На першому екрані ім'я саме друкується в адресному рядку, марки зон показують, де воно вільне і скільки коштує рік у сумах, а на свідоцтво падає печатка. Далі — табло доменів, що звільнилися, як в аеропорту, усі тарифи хостингу в сумах, глобус зон і життєвий цикл домену. Конструктор вмикає калькулятор «домен + хостинг + сайт», перенесення у три кроки, DNS-панель, статус серверів, кабінет і оплату Payme, Click та Uzum просто на сторінці.",
      pl: "Zmierzyliśmy starą stronę: wyszukiwarka dostaje 2,9 KB bez ani jednego słowa — wszystko rysuje skrypt, pierwsze wyrenderowanie trwa ponad 6 sekund, na telefonie przy wejściu ekran zasłaniają dwie dolne szuflady, a wyszukiwarka domen stoi pod formularzem logowania z captchą. Zbudowaliśmy świat «rejestru»: papier zabezpieczony gilloszem, kobaltowy atrament i czerwona pieczęć — kolor litery «D» z ich logo. Na pierwszym ekranie nazwa sama wpisuje się w pasek adresu, znaczki stref pokazują, gdzie jest wolna i ile kosztuje rok w sumach, a na świadectwo spada pieczęć. Dalej — tablica świeżo zwolnionych domen jak na lotnisku, wszystkie plany hostingu w sumach, globus stref i cykl życia domeny. Konfigurator włącza kalkulator «domena + hosting + strona», przeniesienie w trzech krokach, panel DNS, status serwerów, konto klienta i płatności Payme, Click i Uzum od razu na stronie.",
    },
    tech: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS v4", "WebGL"],
    metrics: [
      { value: "2,9", label: { ru: "КБ без текста получал поисковик со старого сайта", en: "KB without any text — what search engines got from the old site", uz: "KB matnsiz — qidiruv tizimi eski saytdan olgan", zh: "KB 无文字 —— 搜索引擎从旧网站拿到的内容", uk: "КБ без тексту отримував пошуковик зі старого сайту", pl: "KB bez tekstu — tyle wyszukiwarka dostawała ze starej strony" } },
      { value: "23", label: { ru: "тарифа хостинга — в сумах, с калькулятором", en: "hosting plans — in sum, with a calculator", uz: "hosting tarifi — so‘mda, kalkulyator bilan", zh: "个主机套餐 —— 苏姆标价，附计算器", uk: "тарифи хостингу — у сумах, з калькулятором", pl: "plany hostingu — w sumach, z kalkulatorem" } },
      { value: "3", label: { ru: "шага — перенос домена от другого регистратора", en: "steps — transferring a domain from another registrar", uz: "qadam — domenni boshqa registratordan ko‘chirish", zh: "步 —— 从其他注册商转移域名", uk: "кроки — перенесення домену від іншого реєстратора", pl: "kroki — przeniesienie domeny od innego rejestratora" } },
    ],
  },
  {
    slug: "akbar-rich",
    name: "Akbar Rich",
    monogram: "AR",
    date: "2026-09-24",
    url: "https://globalex.maximov-tech.ru/akbar",
    tier: 2,
    niches: ["двери", "межкомнатные двери", "межкомнатных дверей", "двери на заказ", "фабрика дверей", "стеновые панели", "погонаж", "конструктор двери", "interior doors", "doors", "eshiklar", "eshik", "门"],
    // Классификатор отдельной ниши для дверей не знает: пример находится по
    // словам — «межкомнатные двери» в заголовке сайта или в нише кампании.
    forNiches: [],
    accent: "gold",
    category: {
      ru: "Макет главной для фабрики дверей",
      en: "Home-page mock-up for a door factory",
      uz: "Eshik fabrikasi uchun bosh sahifa maketi",
      zh: "门厂首页样稿",
      uk: "Макет головної для фабрики дверей",
      pl: "Makieta strony głównej dla fabryki drzwi",
    },
    summary: {
      ru: "Фабрика межкомнатных дверей в Ташкенте с 2008 года: 275 моделей, свой завод на четырёх гектарах, полотна высотой до трёх метров. Макет главной с конструктором двери — модель, покрытие, цвет и высота — и заявкой на расчёт прямо из него.",
      en: "An interior-door factory in Tashkent since 2008: 275 models, its own four-hectare plant, door leaves up to three metres tall. A home-page mock-up with a door configurator — model, finish, colour and height — and a request for a quote sent straight from it.",
      uz: "2008-yildan beri Toshkentda ishlayotgan ichki eshiklar fabrikasi: 275 ta model, to‘rt gektarlik o‘z zavodi, balandligi uch metrgacha bo‘lgan eshiklar. Eshik konstruktori — model, qoplama, rang va balandlik — hamda to‘g‘ridan-to‘g‘ri undan hisob-kitobga ariza yuboriladigan bosh sahifa maketi.",
      zh: "一家自 2008 年起扎根塔什干的室内门工厂：275 款型号、占地四公顷的自有工厂、门扇高度可达三米。一版首页样稿，配有门的配置器 —— 型号、饰面、颜色与高度 —— 并可直接从中提交报价申请。",
      uk: "Фабрика міжкімнатних дверей у Ташкенті з 2008 року: 275 моделей, власний завод на чотирьох гектарах, полотна заввишки до трьох метрів. Макет головної з конструктором дверей — модель, покриття, колір і висота — та заявкою на розрахунок просто з нього.",
      pl: "Fabryka drzwi wewnętrznych w Taszkencie od 2008 roku: 275 modeli, własny zakład na czterech hektarach, skrzydła o wysokości do trzech metrów. Makieta strony głównej z konfiguratorem drzwi — model, wykończenie, kolor i wysokość — i zapytaniem o wycenę wysyłanym prosto z niego.",
    },
    description: {
      ru: "Каталог в 275 моделей тяжело листать списком, поэтому на главной он разложен на девять разделов — от эконома до трёхметровых и скрытых полотен, у каждого своя обложка. В центре — конструктор: покупатель собирает дверь только из тех сочетаний модели, покрытия, цвета и высоты, которые фабрика действительно делает, и отправляет набор менеджеру на расчёт — первый звонок начинается уже с конкретной двери. Отдельные блоки рассказывают о дверях под высокие потолки, о скрытых полотнах вровень со стеной и об интерьере у одного производителя: стеновые панели, проёмы, погонаж. Для оптовиков — раздел дилерам и корпоративным заказам, для остальных — шоурум с адресом и часами работы.",
      en: "A catalogue of 275 models is hard to scroll as a list, so on the home page it is split into nine sections — from budget lines to three-metre and flush-mounted leaves, each with a cover of its own. At the centre is a configurator: the buyer assembles a door only from the combinations of model, finish, colour and height the factory really makes, and sends the set to a manager for a quote — so the first call starts with a specific door. Separate blocks cover doors for high ceilings, hidden leaves flush with the wall and a whole interior from one maker: wall panels, openings, mouldings. Wholesale buyers get a section for dealers and corporate orders; everyone else gets the showroom with its address and opening hours.",
      uz: "275 ta modeldan iborat katalogni ro‘yxat sifatida varaqlash qiyin, shuning uchun bosh sahifada u to‘qqiz bo‘limga ajratilgan — ekonom modellardan uch metrli va yashirin eshiklargacha, har birining o‘z muqovasi bor. Markazda — konstruktor: xaridor eshikni faqat fabrika haqiqatan ishlab chiqaradigan model, qoplama, rang va balandlik birikmalaridan yig‘adi va to‘plamni hisob-kitob uchun menejerga yuboradi — birinchi qo‘ng‘iroq aniq eshikdan boshlanadi. Alohida bloklar baland shiftlar uchun eshiklar, devor bilan bir tekis yashirin eshiklar va bitta ishlab chiqaruvchidan butun interyer haqida: devor panellari, o‘tish joylari, pogonaj. Ulgurji xaridorlar uchun — dilerlar va korporativ buyurtmalar bo‘limi, qolganlar uchun — manzili va ish vaqti ko‘rsatilgan shourum.",
      zh: "275 款型号的目录很难按列表翻看，因此首页将其分为九个系列 —— 从经济款到三米高门和隐形门，每个系列都有自己的封面。核心是配置器：买家只能用工厂真正生产的型号、饰面、颜色与高度组合来搭配一扇门，并把方案发给经理报价 —— 第一通电话便从一扇具体的门开始。另有版块介绍适合高层高的门、与墙面齐平的隐形门，以及由同一家厂商完成的整体室内：墙板、门洞、线条。批发客户有经销商与企业订单专区，其他访客则可查看展厅地址与营业时间。",
      uk: "Каталог із 275 моделей важко гортати списком, тому на головній його розкладено на дев'ять розділів — від економ-класу до триметрових і прихованих полотен, у кожного своя обкладинка. У центрі — конструктор: покупець збирає двері лише з тих поєднань моделі, покриття, кольору й висоти, які фабрика справді виготовляє, і надсилає набір менеджерові на розрахунок — перший дзвінок починається вже з конкретних дверей. Окремі блоки розповідають про двері під високі стелі, про приховані полотна врівень зі стіною та про інтер'єр від одного виробника: стінові панелі, прорізи, погонаж. Для оптовиків — розділ для дилерів і корпоративних замовлень, для решти — шоурум з адресою та годинами роботи.",
      pl: "Katalog 275 modeli trudno przeglądać jako listę, dlatego na stronie głównej podzielono go na dziewięć sekcji — od ekonomicznych po trzymetrowe i ukryte skrzydła, każda z własną okładką. W centrum jest konfigurator: kupujący składa drzwi wyłącznie z tych połączeń modelu, wykończenia, koloru i wysokości, które fabryka naprawdę produkuje, i wysyła zestaw menedżerowi do wyceny — pierwsza rozmowa zaczyna się już od konkretnych drzwi. Osobne bloki opowiadają o drzwiach do wysokich pomieszczeń, o ukrytych skrzydłach zlicowanych ze ścianą i o wnętrzu od jednego producenta: panele ścienne, ościeżnice, listwy. Dla hurtowników — sekcja dla dealerów i zamówień firmowych, dla pozostałych — showroom z adresem i godzinami otwarcia.",
    },
    tech: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS v4"],
    metrics: [
      { value: "275", label: { ru: "моделей в каталоге", en: "models in the catalogue", uz: "katalogdagi model", zh: "目录中的型号", uk: "моделей у каталозі", pl: "modeli w katalogu" } },
      { value: "9", label: { ru: "разделов каталога со своими обложками", en: "catalogue sections, each with its own cover", uz: "o‘z muqovasiga ega katalog bo‘limi", zh: "各有封面的目录系列", uk: "розділів каталогу з власними обкладинками", pl: "sekcji katalogu z własnymi okładkami" } },
      { value: "3", label: { ru: "метра — самая высокая дверь в конструкторе", en: "metres — the tallest door in the configurator", uz: "metr — konstruktordagi eng baland eshik", zh: "米 —— 配置器中最高的门", uk: "метри — найвищі двері в конструкторі", pl: "metry — najwyższe drzwi w konfiguratorze" } },
    ],
  },
  {
    slug: "transtelecom",
    name: "Transtelecom",
    monogram: "TTC",
    date: "2026-09-25",
    url: "https://globalex.maximov-tech.ru/ttc",
    tier: 2,
    niches: ["интернет-провайдер", "провайдер", "оператор связи", "телеком", "связь", "телефония", "дата-центр", "облако", "системный интегратор", "internet provider", "telecom", "provayder", "aloqa operatori", "电信"],
    // Пример для провайдеров и операторов связи в письмах. Владелец, 28.09:
    // «мы делали и для провайдера TTC — пусть ссылается на релевантные
    // проекты».
    forNiches: ["svyaz"],
    accent: "blue",
    category: {
      ru: "Макет главной для оператора связи",
      en: "Home-page mock-up for a telecom operator",
      uz: "Aloqa operatori uchun bosh sahifa maketi",
      zh: "电信运营商首页样稿",
      uk: "Макет головної для оператора зв'язку",
      pl: "Makieta strony głównej dla operatora telekomunikacyjnego",
    },
    summary: {
      ru: "Один из крупнейших операторов связи Казахстана: около 15 000 км оптоволокна вдоль железной дороги, дата-центры уровня Tier 3, филиалы по всей стране. Макет главной на русском и казахском с конструктором подключения: услуги собираются тумблерами, ориентир по сумме и сроку пересчитывается сразу.",
      en: "One of Kazakhstan's largest telecom operators: about 15,000 km of fibre along the railway, Tier 3 data centres, branches across the country. A home-page mock-up in Russian and Kazakh with a connection builder: services are switched on with toggles, and the monthly figure and lead time update at once.",
      uz: "Qozog‘istonning eng yirik aloqa operatorlaridan biri: temir yo‘l bo‘ylab qariyb 15 000 km optik tolali tarmoq, Tier 3 darajasidagi data-markazlar, butun mamlakat bo‘ylab filiallar. Rus va qozoq tillaridagi bosh sahifa maketi, ulanish konstruktori bilan: xizmatlar tumblerlar bilan yig‘iladi, oylik summa va muddat darhol qayta hisoblanadi.",
      zh: "哈萨克斯坦最大的电信运营商之一：沿铁路铺设约 15,000 公里光纤、Tier 3 级数据中心、分支机构遍布全国。一版俄语与哈萨克语首页样稿，配有接入配置器：用开关组合所需服务，月度金额与工期即时重算。",
      uk: "Один із найбільших операторів зв'язку Казахстану: близько 15 000 км оптоволокна вздовж залізниці, дата-центри рівня Tier 3, філії по всій країні. Макет головної російською та казахською з конструктором підключення: послуги додаються перемикачами, орієнтовна сума й строк перераховуються одразу.",
      pl: "Jeden z największych operatorów telekomunikacyjnych w Kazachstanie: około 15 000 km światłowodu wzdłuż linii kolejowych, centra danych klasy Tier 3, oddziały w całym kraju. Makieta strony głównej po rosyjsku i kazachsku z konfiguratorem podłączenia: usługi wybiera się przełącznikami, a orientacyjna kwota i termin przeliczają się od razu.",
    },
    description: {
      ru: "Корпоративный клиент приходит не за «IP VPN», а с задачей: открыть офис, перенести серверы, связать филиалы. Поэтому в центре главной — конструктор из восемнадцати услуг, от канала связи и телефонии до облака и кибербезопасности: сумма в месяц, разовое подключение и срок пересчитываются на каждом нажатии, а пять готовых сценариев сами отмечают нужное. Сеть показана картой — четырнадцать филиалов на настоящих координатах и магистрали между ними с настоящими расстояниями. «Tier 3» разобран по узлам — два ввода питания, дизель-генератор, резерв охлаждения и каналов, — потому что платят именно за это, а не за строчку в описании. Ниже — проекты компании: автоматизация железной дороги, мониторинг магистрали, центр кибербезопасности. Заявка из конструктора уходит вместе с выбранными услугами, рядом — панель заявок.",
      en: "A corporate client comes not for «IP VPN» but with a task: open an office, move servers, connect branches. So the centre of the home page is a builder of eighteen services, from data links and telephony to cloud and cybersecurity: the monthly amount, one-off connection and lead time are recalculated on every tap, and five ready-made scenarios tick what is needed on their own. The network is shown as a map — fourteen branches at their real coordinates and the trunk lines between them at their real distances. «Tier 3» is broken down node by node — two power feeds, a diesel generator, cooling and link redundancy — because that is what customers pay for, not a line in a brochure. Below are the company's projects: railway automation, trunk-line monitoring, a cybersecurity centre. A request from the builder goes out together with the chosen services, with a requests panel alongside.",
      uz: "Korporativ mijoz «IP VPN» uchun emas, vazifa bilan keladi: ofis ochish, serverlarni ko‘chirish, filiallarni bog‘lash. Shuning uchun bosh sahifa markazida — o‘n sakkiz xizmatdan iborat konstruktor, aloqa kanali va telefoniyadan bulut va kiberxavfsizlikkacha: oylik summa, bir martalik ulanish va muddat har bosishda qayta hisoblanadi, beshta tayyor ssenariy esa keraklisini o‘zi belgilaydi. Tarmoq xaritada ko‘rsatilgan — haqiqiy koordinatalardagi o‘n to‘rtta filial va ular orasidagi haqiqiy masofadagi magistrallar. «Tier 3» tugunma-tugun ochib berilgan — ikki mustaqil elektr kiritmasi, dizel-generator, sovutish va kanallar zaxirasi, — chunki pul aynan shu uchun to‘lanadi, tavsifdagi bir satr uchun emas. Pastda — kompaniya loyihalari: temir yo‘lni avtomatlashtirish, magistral monitoringi, kiberxavfsizlik markazi. Konstruktordan ariza tanlangan xizmatlar bilan birga yuboriladi, yonida — arizalar paneli.",
      zh: "企业客户来找的不是「IP VPN」，而是一个任务：开新办公室、迁移服务器、连通各分支。因此首页的核心是一个涵盖十八项服务的配置器，从专线和电话到云与网络安全：每点一下，月费、一次性接入费和工期都会重算，五个现成场景还会自动勾选所需服务。网络以地图呈现 —— 十四个分支位于真实坐标，其间干线标注真实距离。「Tier 3」按节点逐一拆解 —— 双路供电、柴油发电机、制冷与链路冗余 —— 因为客户付费买的正是这些，而不是简介里的一行字。下方是公司项目：铁路自动化、干线监控、网络安全中心。配置器提交的申请会连同所选服务一起发出，旁边配有申请管理面板。",
      uk: "Корпоративний клієнт приходить не по «IP VPN», а із задачею: відкрити офіс, перенести сервери, зв'язати філії. Тому в центрі головної — конструктор із вісімнадцяти послуг, від каналу зв'язку й телефонії до хмари та кібербезпеки: сума на місяць, разове підключення і строк перераховуються після кожного натискання, а п'ять готових сценаріїв самі позначають потрібне. Мережу показано картою — чотирнадцять філій на справжніх координатах і магістралі між ними зі справжніми відстанями. «Tier 3» розібрано по вузлах — два вводи живлення, дизель-генератор, резерв охолодження й каналів, — бо платять саме за це, а не за рядок в описі. Нижче — проєкти компанії: автоматизація залізниці, моніторинг магістралі, центр кібербезпеки. Заявка з конструктора надходить разом з обраними послугами, поруч — панель заявок.",
      pl: "Klient korporacyjny nie przychodzi po „IP VPN”, tylko z zadaniem: otworzyć biuro, przenieść serwery, połączyć oddziały. Dlatego w centrum strony głównej jest konfigurator osiemnastu usług, od łącza i telefonii po chmurę i cyberbezpieczeństwo: miesięczna kwota, jednorazowa opłata za podłączenie i termin przeliczają się przy każdym kliknięciu, a pięć gotowych scenariuszy samo zaznacza to, co potrzebne. Sieć pokazano na mapie — czternaście oddziałów w rzeczywistych współrzędnych i magistrale między nimi z rzeczywistymi odległościami. „Tier 3” rozłożono na elementy — dwa przyłącza zasilania, generator diesla, rezerwa chłodzenia i łączy — bo płaci się właśnie za to, a nie za linijkę w opisie. Niżej — projekty firmy: automatyzacja kolei, monitoring magistrali, centrum cyberbezpieczeństwa. Zapytanie z konfiguratora trafia do firmy razem z wybranymi usługami, obok — panel zapytań.",
    },
    tech: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS v4"],
    metrics: [
      { value: "18", label: { ru: "услуг в конструкторе подключения", en: "services in the connection builder", uz: "ulanish konstruktoridagi xizmat", zh: "接入配置器中的服务", uk: "послуг у конструкторі підключення", pl: "usług w konfiguratorze podłączenia" } },
      { value: "14", label: { ru: "филиалов на карте сети", en: "branches on the network map", uz: "tarmoq xaritasidagi filial", zh: "网络地图上的分支", uk: "філій на карті мережі", pl: "oddziałów na mapie sieci" } },
      { value: "2", label: { ru: "языка целиком: русский и казахский", en: "languages in full: Russian and Kazakh", uz: "to‘liq til: rus va qozoq", zh: "种完整语言：俄语与哈萨克语", uk: "мови повністю: російська та казахська", pl: "języki w pełni: rosyjski i kazachski" } },
    ],
  },
  {
    slug: "tranio",
    name: "Tranio",
    monogram: "TR",
    date: "2026-09-25",
    url: "https://globalex.maximov-tech.ru/tranio",
    tier: 1,
    niches: ["зарубежная недвижимость", "недвижимость за рубежом", "агентство недвижимости", "инвестиции в недвижимость", "ВНЖ за инвестиции", "риелтор", "overseas property", "real estate agency", "property investment", "xorijda ko‘chmas mulk", "ko‘chmas mulk agentligi", "海外房产"],
    // Пример для агентств недвижимости в письмах. Застройщикам по-прежнему
    // показываем MAVERA: у них другая работа — продают свои метры, а не
    // подбирают чужие.
    forNiches: ["agentstvo-nedvizhimosti"],
    accent: "violet",
    category: {
      ru: "Макет главной для агентства зарубежной недвижимости",
      en: "Home-page mock-up for an overseas property agency",
      uz: "Xorijiy ko‘chmas mulk agentligi uchun bosh sahifa maketi",
      zh: "海外房产中介首页样稿",
      uk: "Макет головної для агентства закордонної нерухомості",
      pl: "Makieta strony głównej dla agencji nieruchomości zagranicznych",
    },
    summary: {
      ru: "Агентство зарубежной недвижимости и инвестиций: двадцать одно направление, десять офисов в восьми странах, собственные инвестиционные стратегии. Макет главной, где цель и бюджет сразу оставляют только подходящие страны, стратегии считаются по капиталу и горизонту, а программы ВНЖ сортируются по сроку оформления.",
      en: "An overseas property and investment agency: twenty-one destinations, ten offices in eight countries, in-house investment strategies. A home-page mock-up where the goal and budget instantly leave only the countries that fit, strategies are calculated by capital and horizon, and residence programmes are sorted by processing time.",
      uz: "Xorijiy ko‘chmas mulk va investitsiyalar agentligi: yigirma bitta yo‘nalish, sakkiz mamlakatda o‘nta ofis, o‘z investitsiya strategiyalari. Bosh sahifa maketi: maqsad va byudjet darhol faqat mos mamlakatlarni qoldiradi, strategiyalar kapital va muddat bo‘yicha hisoblanadi, yashash ruxsatnomasi dasturlari esa rasmiylashtirish muddati bo‘yicha saralanadi.",
      zh: "一家海外房产与投资机构：二十一个目的地、八个国家的十个办公室、自有投资策略。一版首页样稿：选定目的与预算后只留下合适的国家，投资策略按本金与期限测算，居留项目按办理时长排序。",
      uk: "Агентство закордонної нерухомості та інвестицій: двадцять один напрямок, десять офісів у восьми країнах, власні інвестиційні стратегії. Макет головної, де мета й бюджет одразу залишають лише відповідні країни, стратегії розраховуються за капіталом і горизонтом, а програми посвідки на проживання сортуються за строком оформлення.",
      pl: "Agencja nieruchomości zagranicznych i inwestycji: dwadzieścia jeden kierunków, dziesięć biur w ośmiu krajach, własne strategie inwestycyjne. Makieta strony głównej, na której cel i budżet od razu zostawiają tylko pasujące kraje, strategie liczą się według kapitału i horyzontu, a programy rezydencji sortują się według czasu uzyskania.",
    },
    description: {
      ru: "Покупатель зарубежной недвижимости сначала спрашивает не «что у вас есть», а «куда смотреть с моими деньгами». Поэтому главная начинается с подбора: цель — жить, сдавать, строить или получить ВНЖ, — тип объекта и бюджет, и из двадцати одного направления остаются только те, где на эти деньги что-то действительно покупают. Дальше — калькулятор четырёх стратегий компании: строительство в Европе и в Дубае, реновация, аренда; капитал и горизонт дают вилку по деньгам и срокам, с оговоркой, что это прогноз, а не обещание. Карта с десятью офисами на настоящих координатах, десять программ ВНЖ и гражданства по сроку оформления, текущая подборка объектов с доходностью и база знаний по странам. Заявка уходит вместе с составом подбора — первый звонок начинается не с «расскажите, что вы хотите». Оформление — в нескольких палитрах на выбор.",
      en: "An overseas property buyer's first question is not «what do you have» but «where should I look with my money». So the home page opens with a picker: the goal — to live, to rent out, to build or to obtain residence — the property type and the budget, and of twenty-one destinations only those remain where that money really buys something. Next comes a calculator of the company's four strategies — construction in Europe and in Dubai, renovation, rental — where capital and horizon give a range in money and time, with the caveat that this is a forecast, not a promise. Then a map with ten offices at their real coordinates, ten residence and citizenship programmes sorted by processing time, the current selection of properties with their yields, and a knowledge base by country. A request goes out together with the picker's choices, so the first call does not begin with «tell us what you want». The design comes in several palettes to choose from.",
      uz: "Xorijdan ko‘chmas mulk oluvchining birinchi savoli «sizda nima bor» emas, «mening pulim bilan qayerga qarash kerak». Shuning uchun bosh sahifa tanlovdan boshlanadi: maqsad — yashash, ijaraga berish, qurish yoki yashash ruxsatnomasi olish, — obyekt turi va byudjet, va yigirma bitta yo‘nalishdan faqat shu pulga haqiqatan nimadir sotib olinadiganlari qoladi. So‘ng kompaniyaning to‘rt strategiyasi kalkulyatori: Yevropada va Dubayda qurilish, renovatsiya, ijara; kapital va muddat pul va vaqt bo‘yicha oraliqni beradi, bu va’da emas, prognoz ekani eslatiladi. Haqiqiy koordinatalardagi o‘nta ofis tushirilgan xarita, rasmiylashtirish muddati bo‘yicha saralangan o‘nta yashash ruxsatnomasi va fuqarolik dasturi, daromadliligi ko‘rsatilgan joriy obyektlar tanlovi va mamlakatlar bo‘yicha bilimlar bazasi. Ariza tanlov tarkibi bilan birga yuboriladi — birinchi qo‘ng‘iroq «nima xohlayotganingizni aytib bering» bilan boshlanmaydi. Bezak bir nechta palitrada, tanlash mumkin.",
      zh: "海外购房者的第一个问题不是「你们有什么」，而是「我这笔钱该往哪儿看」。因此首页从筛选开始：目的 —— 自住、出租、开发或获取居留 —— 物业类型与预算，二十一个目的地中只留下这笔钱真正买得到东西的地方。接着是公司四种策略的计算器 —— 欧洲建设、迪拜建设、翻新、租赁 —— 按本金与期限给出金额与时间区间，并注明这是预测而非承诺。再往下是十个办公室位于真实坐标的地图、按办理时长排序的十个居留与入籍项目、当前精选物业及其收益率，以及分国家的知识库。申请会连同筛选条件一起发出，第一通电话不必从「说说您想要什么」开始。设计提供多套配色可选。",
      uk: "Покупець закордонної нерухомості спершу питає не «що у вас є», а «куди дивитися з моїми грошима». Тому головна починається з підбору: мета — жити, здавати, будувати чи отримати посвідку на проживання, — тип об'єкта й бюджет, і з двадцяти одного напрямку залишаються лише ті, де за ці гроші справді щось купують. Далі — калькулятор чотирьох стратегій компанії: будівництво в Європі та в Дубаї, реновація, оренда; капітал і горизонт дають вилку за грошима й строками, із застереженням, що це прогноз, а не обіцянка. Карта з десятьма офісами на справжніх координатах, десять програм посвідки на проживання й громадянства за строком оформлення, актуальна добірка об'єктів із дохідністю та база знань по країнах. Заявка надходить разом зі складом підбору — перший дзвінок починається не з «розкажіть, чого ви хочете». Оформлення — у кількох палітрах на вибір.",
      pl: "Kupujący nieruchomość za granicą najpierw nie pyta „co macie”, tylko „gdzie szukać z moimi pieniędzmi”. Dlatego strona główna zaczyna się od doboru: cel — mieszkać, wynajmować, budować czy uzyskać rezydencję — typ nieruchomości i budżet, a z dwudziestu jeden kierunków zostają tylko te, w których za te pieniądze naprawdę coś się kupuje. Dalej — kalkulator czterech strategii firmy: budowa w Europie i w Dubaju, renowacja, najem; kapitał i horyzont dają widełki kwot i terminów, z zastrzeżeniem, że to prognoza, a nie obietnica. Mapa z dziesięcioma biurami w rzeczywistych współrzędnych, dziesięć programów rezydencji i obywatelstwa według czasu uzyskania, aktualny wybór ofert z rentownością i baza wiedzy o krajach. Zapytanie trafia do firmy razem z wynikami doboru — pierwsza rozmowa nie zaczyna się od „powiedz, czego szukasz”. Szata graficzna — w kilku paletach do wyboru.",
    },
    tech: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS v4"],
    metrics: [
      { value: "21", label: { ru: "направление в подборе по цели и бюджету", en: "destinations in the goal-and-budget picker", uz: "maqsad va byudjet bo‘yicha tanlovdagi yo‘nalish", zh: "按目的与预算筛选的目的地", uk: "напрямок у підборі за метою та бюджетом", pl: "kierunków w doborze według celu i budżetu" } },
      { value: "4", label: { ru: "инвестиционные стратегии в калькуляторе", en: "investment strategies in the calculator", uz: "kalkulyatordagi investitsiya strategiyasi", zh: "计算器中的投资策略", uk: "інвестиційні стратегії в калькуляторі", pl: "strategie inwestycyjne w kalkulatorze" } },
      { value: "10", label: { ru: "программ ВНЖ и гражданства по сроку оформления", en: "residence and citizenship programmes sorted by processing time", uz: "muddat bo‘yicha saralangan yashash va fuqarolik dasturi", zh: "按办理时长排序的居留与入籍项目", uk: "програм резидентства й громадянства за строком оформлення", pl: "programów rezydencji i obywatelstwa według czasu uzyskania" } },
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
    date: "2026-09-22",
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
      uk: "Два варіанти сайту виробника консервів",
      pl: "Dwa warianty strony producenta konserw",
    },
    summary: {
      ru: "Производитель мясных и овощных консервов, который продаёт сетям и оптовикам. Два варианта сайта на одних данных: кинематографичный, где банка раскрывается на глазах, и «Полка» — светлая инфографика в духе карточки маркетплейса.",
      en: "A producer of canned meat and vegetables that sells to retail chains and wholesalers. Two site versions on the same data: a cinematic one where the can opens up before your eyes, and «Shelf» — light infographics in the spirit of a marketplace product card.",
      uz: "Tarmoqlar va ulgurji xaridorlarga sotadigan go‘sht va sabzavot konservalari ishlab chiqaruvchisi. Bir xil ma’lumotlardagi saytning ikki varianti: banka ko‘z oldida ochiladigan kinematografik va «Polka» — marketpleys kartochkasi uslubidagi yorug‘ infografika.",
      zh: "一家面向连锁零售和批发商的肉类与蔬菜罐头生产商。基于同一套数据的两版网站：一版电影感，罐头在眼前层层打开；另一版「货架」，是电商商品卡风格的明亮信息图。",
      uk: "Виробник м'ясних і овочевих консервів, який продає мережам та оптовикам. Два варіанти сайту на одних даних: кінематографічний, де банка розкривається просто на очах, і «Полиця» — світла інфографіка в дусі картки маркетплейсу.",
      pl: "Producent konserw mięsnych i warzywnych, który sprzedaje sieciom handlowym i hurtownikom. Dwa warianty strony na tych samych danych: kinowy, w którym puszka otwiera się na oczach widza, i „Półka” — jasna infografika w stylu karty produktu na marketplace.",
    },
    description: {
      ru: "Первый вариант — одна страница со сквозным сценарием: от первого экрана к банке, которая раскрывается, дальше к производству, каталогу и заявке; смотреть его надо медленно. Второй, «Полка», — те же данные в другом жанре: товар с выносками на пунктирных линиях, четыре плашки «что в банке», чек-лист из шести пунктов, восемь нумерованных шагов производства, три полки со счётчиками позиций, логотипы шести сетей и заявка на прайс — суть читается за три секунды. Чек-лист сознательно не сделан таблицей «мы против обычных консервов»: утверждать, что у других есть консерванты, мы не можем — это была бы уже не реклама, а клевета. Поэтому это список того, по чему выбирают поставщика, и по каждому пункту ответ «да».",
      en: "The first version is a single page with a continuous storyline: from the first screen to a can that opens up, then on to production, the catalogue and the enquiry; it is meant to be watched slowly. The second, «Shelf», is the same data in another genre: the product with callouts on dotted lines, four «what's in the can» badges, a six-point checklist, eight numbered production steps, three shelves with item counters, the logos of six retail chains and a price-list request — the point reads in three seconds. The checklist is deliberately not a «us versus ordinary canned food» table: we cannot claim that others use preservatives — that would no longer be advertising but defamation. So it is a list of what buyers choose a supplier by, and every item is answered «yes».",
      uz: "Birinchi variant — yaxlit ssenariyli bitta sahifa: birinchi ekrandan ochiladigan bankagacha, keyin ishlab chiqarish, katalog va buyurtmaga; uni sekin ko‘rish kerak. Ikkinchisi, «Polka», — o‘sha ma’lumotlar boshqa janrda: punktir chiziqlardagi izohli mahsulot, «bankada nima bor» degan to‘rtta plashka, olti bandli chek-list, raqamlangan sakkizta ishlab chiqarish qadami, pozitsiyalar hisoblagichli uchta javon, oltita tarmoq logotipi va prays so‘rovi — mohiyat uch soniyada o‘qiladi. Chek-list ataylab «biz oddiy konservalarga qarshi» jadvali qilinmagan: boshqalarda konservantlar bor deb da’vo qila olmaymiz — bu endi reklama emas, tuhmat bo‘lardi. Shuning uchun bu yetkazib beruvchi qaysi mezonlar bo‘yicha tanlanishi ro‘yxati va har bir band bo‘yicha javob «ha».",
      zh: "第一版是一条贯穿到底的单页叙事：从首屏到一罐被打开的罐头，再到生产、产品目录与询单；它适合慢慢看。第二版「货架」用另一种体裁呈现同一套数据：带虚线标注的产品、四块「罐里有什么」标签、六项核对清单、八个编号的生产步骤、三排带数量统计的货架、六家连锁的标志以及索取价目表 —— 三秒即可读懂要点。核对清单刻意没有做成「我们对比普通罐头」的表格：我们不能声称别家使用防腐剂 —— 那就不是广告而是诽谤了。因此它是一份采购方挑选供应商的标准清单，每一项的回答都是「是」。",
      uk: "Перший варіант — одна сторінка з наскрізним сценарієм: від першого екрана до банки, яка розкривається, далі до виробництва, каталогу й заявки; дивитися його треба повільно. Другий, «Полиця», — ті самі дані в іншому жанрі: товар із виносками на пунктирних лініях, чотири плашки «що в банці», чек-лист із шести пунктів, вісім пронумерованих кроків виробництва, три полиці з лічильниками позицій, логотипи шести мереж і заявка на прайс — суть зчитується за три секунди. Чек-лист свідомо не зроблено таблицею «ми проти звичайних консервів»: стверджувати, що в інших є консерванти, ми не можемо — це була б уже не реклама, а наклеп. Тому це перелік того, за чим обирають постачальника, і на кожен пункт відповідь «так».",
      pl: "Pierwszy wariant to jedna strona z ciągłym scenariuszem: od pierwszego ekranu do puszki, która się otwiera, dalej do produkcji, katalogu i zapytania; trzeba go oglądać powoli. Drugi, „Półka”, to te same dane w innym gatunku: produkt z opisami na przerywanych liniach, cztery plakietki „co jest w puszce”, checklista z sześciu punktów, osiem ponumerowanych etapów produkcji, trzy półki z licznikami pozycji, logotypy sześciu sieci i zapytanie o cennik — sedno czyta się w trzy sekundy. Checklisty celowo nie zrobiliśmy w formie tabeli „my kontra zwykłe konserwy”: nie możemy twierdzić, że inni dodają konserwanty — to nie byłaby już reklama, tylko zniesławienie. Dlatego to lista kryteriów, po których wybiera się dostawcę, i przy każdym punkcie odpowiedź brzmi „tak”.",
    },
    tech: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS v4"],
    metrics: [
      { value: "2", label: { ru: "варианта сайта на одних данных", en: "site versions on the same data", uz: "bir xil ma’lumotlardagi sayt varianti", zh: "基于同一数据的网站版本", uk: "варіанти сайту на одних даних", pl: "warianty strony na tych samych danych" } },
      { value: "8", label: { ru: "шагов производства по номерам", en: "numbered production steps", uz: "raqamlangan ishlab chiqarish qadami", zh: "编号的生产步骤", uk: "пронумерованих кроків виробництва", pl: "ponumerowanych etapów produkcji" } },
      { value: "6", label: { ru: "торговых сетей на полке", en: "retail chains on the shelf", uz: "javondagi savdo tarmog‘i", zh: "上架的连锁零售商", uk: "торговельних мереж на полиці", pl: "sieci handlowych na półce" } },
    ],
  },
  {
    slug: "usta",
    name: "USTA",
    monogram: "USTA",
    date: "2026-07",
    url: "https://usta.maximov-tech.ru",
    tier: 2,
    niches: ["сфера услуг", "маркетплейс услуг", "ремонт", "бытовые услуги", "services", "xizmatlar"],
    // Мебели здесь больше нет. Владелец, 28.09: «скаут в мебельной нише
    // почему-то ссылается на usta — это ж не то». Маркетплейс мастеров
    // мебельщику не пример: для мебели есть Namuna.
    forNiches: ["stroitelnaya-kompaniya"],
    accent: "blue",
    category: {
      ru: "Маркетплейс мастеров",
      en: "Marketplace of professionals",
      uz: "Ustalar marketpleysi",
      zh: "工匠服务平台",
      uk: "Маркетплейс майстрів",
      pl: "Marketplace fachowców",
    },
    summary: {
      ru: "Аналог Profi.ru для Узбекистана: 99 услуг в 12 категориях, реалтайм-чат, вход через Telegram.",
      en: "A Profi.ru analogue for Uzbekistan: 99 services across 12 categories, realtime chat, Telegram sign-in.",
      uz: "O‘zbekiston uchun Profi.ru analogi: 12 toifada 99 xizmat, real vaqtdagi chat, Telegram orqali kirish.",
      zh: "面向乌兹别克斯坦的 Profi.ru 式平台：12 个类目下 99 项服务、实时聊天、Telegram 登录。",
      uk: "Аналог Profi.ru для Узбекистану: 99 послуг у 12 категоріях, чат у реальному часі, вхід через Telegram.",
      pl: "Odpowiednik Profi.ru dla Uzbekistanu: 99 usług w 12 kategoriach, czat w czasie rzeczywistym, logowanie przez Telegram.",
    },
    description: {
      ru: "Клиент публикует задачу, подходящие мастера откликаются со своей ценой, клиент выбирает одного — открывается чат и раскрываются телефоны. Дальше договариваются напрямую: сервис бесплатный, комиссий нет. Каталог с фильтрами по городу, районам Ташкента, рейтингу и статусу «проверенный», профили мастеров с портфолио и отзывами, отдельные кабинеты для клиента и мастера. Интерфейс на трёх языках, вход по коду из Telegram-бота вместо SMS.",
      en: "A client posts a task, matching professionals respond with their own price, the client picks one — a chat opens and phone numbers are revealed. From there they arrange things directly: the service is free, there is no commission. A catalogue with filters by city, Tashkent districts, rating and verified status; professional profiles with portfolios and reviews; separate dashboards for clients and professionals. The interface runs in three languages, with sign-in by a code from a Telegram bot instead of SMS.",
      uz: "Mijoz vazifa e’lon qiladi, mos ustalar o‘z narxi bilan javob beradi, mijoz bittasini tanlaydi — chat ochiladi va telefonlar oshkor bo‘ladi. Keyin to‘g‘ridan-to‘g‘ri kelishadi: xizmat bepul, komissiya yo‘q. Shahar, Toshkent tumanlari, reyting va «tekshirilgan» maqomi bo‘yicha filtrli katalog, portfolio va sharhlar bilan usta profillari, mijoz va usta uchun alohida kabinetlar.",
      zh: "客户发布需求，匹配的师傅报出自己的价格，客户从中选定一位 —— 随即开启聊天并互相显示电话。之后双方直接沟通：平台完全免费，不收佣金。目录支持按城市、塔什干各区、评分与「已认证」状态筛选；师傅主页含作品集与评价；客户端与师傅端各有独立后台。界面支持三种语言，以 Telegram 机器人验证码替代短信登录。",
      uk: "Клієнт публікує задачу, відповідні майстри відгукуються зі своєю ціною, клієнт обирає одного — відкривається чат і стають видимі телефони. Далі домовляються напряму: сервіс безкоштовний, комісій немає. Каталог із фільтрами за містом, районами Ташкента, рейтингом і статусом «перевірений», профілі майстрів із портфоліо та відгуками, окремі кабінети для клієнта й майстра. Інтерфейс трьома мовами, вхід за кодом із Telegram-бота замість SMS.",
      pl: "Klient publikuje zlecenie, pasujący fachowcy odpowiadają ze swoją ceną, klient wybiera jednego — otwiera się czat i odsłaniają się numery telefonów. Dalej strony dogadują się bezpośrednio: serwis jest bezpłatny, bez prowizji. Katalog z filtrami według miasta, dzielnic Taszkentu, oceny i statusu „zweryfikowany”, profile fachowców z portfolio i opiniami, osobne panele dla klienta i fachowca. Interfejs w trzech językach, logowanie kodem z bota w Telegramie zamiast SMS.",
    },
    tech: ["React 19", "TypeScript", "Vite", "Tailwind CSS", "shadcn/ui", "Supabase"],
    metrics: [
      { value: "99", label: { ru: "услуг в 12 категориях", en: "services across 12 categories", uz: "12 toifadagi xizmat", zh: "12 个类目下的服务数", uk: "послуг у 12 категоріях", pl: "usług w 12 kategoriach" } },
      { value: "3", label: { ru: "языка интерфейса", en: "interface languages", uz: "interfeys tili", zh: "界面语言数", uk: "мови інтерфейсу", pl: "języki interfejsu" } },
      { value: "0%", label: { ru: "комиссия сервиса", en: "platform commission", uz: "xizmat komissiyasi", zh: "平台抽成", uk: "комісія сервісу", pl: "prowizji serwisu" } },
    ],
  },
  {
    slug: "seller-ai",
    name: "Seller AI",
    monogram: "SAI",
    date: "2026-06",
    tier: 1,
    niches: ["e-commerce", "маркетплейс", "ритейл", "SaaS", "аналитика", "电商", "savdo"],
    forNiches: ["internet-magazin"],
    accent: "violet",
    category: {
      ru: "AI-продукт · SaaS",
      en: "AI product · SaaS",
      uz: "AI mahsulot · SaaS",
      zh: "AI 产品 · SaaS",
      uk: "AI-продукт · SaaS",
      pl: "Produkt AI · SaaS",
    },
    summary: {
      ru: "Шесть автономных AI-агентов, которые ведут карточки продавца на маркетплейсах вместо человека.",
      en: "Six autonomous AI agents running a seller's marketplace listings instead of a human.",
      uz: "Marketpleyslarda sotuvchi kartalarini inson o‘rniga yurituvchi oltita avtonom AI agent.",
      zh: "六个自主 AI 智能体，代替人工打理卖家在电商平台上的商品。",
      uk: "Шість автономних AI-агентів, які ведуть картки продавця на маркетплейсах замість людини.",
      pl: "Sześć autonomicznych agentów AI, które zamiast człowieka prowadzą karty produktów sprzedawcy na marketplace'ach.",
    },
    description: {
      ru: "Коммерческий SaaS для продавцов на маркетплейсах. Шесть агентов закрывают разные участки: отзывы, контент карточек, ценообразование, конкуренты, реклама и логистика. Поверх них — движок юнит-экономики и аналитика MPstats. Продуманный онбординг: две недели триала, затем месяц ручного обучения агентов на реальных данных продавца, и только потом включается автопилот по каждому SKU. Архитектура — FastAPI, Celery с расписанием, Postgres и Redis в контейнерах.",
      en: "A commercial SaaS for marketplace sellers. Six agents cover distinct areas: reviews, listing content, pricing, competitors, ads and logistics. On top sits a unit-economics engine and MPstats analytics. Onboarding is deliberate: a two-week trial, then a month of training the agents by hand on the seller's real data, and only then per-SKU autopilot unlocks. The architecture is FastAPI, Celery with a beat schedule, Postgres and Redis in containers.",
      uz: "Marketpleys sotuvchilari uchun tijoriy SaaS. Oltita agent turli yo‘nalishlarni qamrab oladi: sharhlar, karta kontenti, narx belgilash, raqobatchilar, reklama va logistika. Ular ustida birlik iqtisodiyoti dvigateli va MPstats tahlili. Onboarding puxta o‘ylangan: ikki hafta sinov, so‘ng bir oy agentlarni sotuvchining haqiqiy ma’lumotlarida qo‘lda o‘qitish, faqat shundan keyin har bir SKU bo‘yicha avtopilot yoqiladi.",
      zh: "面向电商卖家的商业化 SaaS。六个智能体分别负责评价、商品文案、定价、竞品、广告与物流，其上叠加单品经济模型引擎与 MPstats 数据分析。上手流程经过精心设计：先两周试用，再用一个月在卖家真实数据上人工训练智能体，之后才逐个 SKU 解锁自动驾驶模式。技术架构为 FastAPI、带定时调度的 Celery，以及容器化的 Postgres 与 Redis。",
      uk: "Комерційний SaaS для продавців на маркетплейсах. Шість агентів відповідають за різні ділянки: відгуки, контент карток, ціноутворення, конкуренти, реклама й логістика. Над ними — рушій юніт-економіки та аналітика MPstats. Продуманий онбординг: два тижні пробного періоду, потім місяць ручного навчання агентів на реальних даних продавця, і лише після цього вмикається автопілот для кожного SKU. Архітектура — FastAPI, Celery з розкладом, Postgres і Redis у контейнерах.",
      pl: "Komercyjny SaaS dla sprzedawców na marketplace'ach. Sześć agentów obsługuje różne obszary: opinie, treść kart produktów, ustalanie cen, konkurencję, reklamę i logistykę. Nad nimi — silnik ekonomiki jednostkowej i analityka MPstats. Przemyślany onboarding: dwa tygodnie okresu próbnego, potem miesiąc ręcznego szkolenia agentów na prawdziwych danych sprzedawcy i dopiero wtedy dla każdego SKU włącza się autopilot. Architektura — FastAPI, Celery z harmonogramem, Postgres i Redis w kontenerach.",
    },
    tech: ["Python", "FastAPI", "Celery", "PostgreSQL", "Redis", "LLM"],
    metrics: [
      { value: "6", label: { ru: "автономных агентов", en: "autonomous agents", uz: "avtonom agent", zh: "自主智能体数", uk: "автономних агентів", pl: "autonomicznych agentów" } },
      { value: "14", label: { ru: "дней триала до оплаты", en: "trial days before payment", uz: "to‘lovgacha sinov kunlari", zh: "付费前试用天数", uk: "днів пробного періоду до оплати", pl: "dni okresu próbnego przed płatnością" } },
      { value: "SKU", label: { ru: "автопилот включается поштучно", en: "autopilot unlocks per item", uz: "avtopilot donalab yoqiladi", zh: "按单品逐个启用自动化", uk: "автопілот вмикається поштучно", pl: "autopilot włączany dla każdego z osobna" } },
    ],
  },
  {
    slug: "lbm-rentals",
    name: "LBM Rentals",
    monogram: "LBM",
    date: "2026-08",
    tier: 2,
    niches: ["недвижимость", "аренда", "туризм", "гостиничный бизнес", "HoReCa", "real estate", "ko‘chmas mulk"],
    forNiches: ["nedvizhimost", "turagentstvo"],
    accent: "gold",
    category: {
      ru: "Автоматизация аренды",
      en: "Rental automation",
      uz: "Ijarani avtomatlashtirish",
      zh: "租赁业务自动化",
      uk: "Автоматизація оренди",
      pl: "Automatyzacja najmu",
    },
    summary: {
      ru: "Посуточная аренда в Ташкенте без участия хозяина: умные замки, платежи, турсбор и листок прибытия.",
      en: "Daily rentals in Tashkent with the owner out of the loop: smart locks, payments, tourist tax and arrival forms.",
      uz: "Toshkentda egasi ishtirokisiz sutkalik ijara: aqlli qulflar, to‘lovlar, turizm yig‘imi va kelish varaqasi.",
      zh: "塔什干的日租业务无需房东参与：智能门锁、支付、旅游税与入住登记表。",
      uk: "Подобова оренда в Ташкенті без участі власника: розумні замки, платежі, туристичний збір і листок прибуття.",
      pl: "Najem krótkoterminowy w Taszkencie bez udziału właściciela: inteligentne zamki, płatności, opłata turystyczna i karta meldunkowa.",
    },
    description: {
      ru: "Сервис закрывает весь цикл посуточной аренды. Бронь, оплата через Octobank и Atmos, код от умного замка TTLock приходит гостю в Telegram — с запасным каналом на SMS через Eskiz, если мессенджера нет. Отдельно закрыта узбекская специфика: данные гостя и листок прибытия для E-mehmon, автоматический расчёт туристического сбора по БРВ за каждую ночь, учёт коммуналки и чистая прибыль в аналитике. Площадки подключаются самостоятельно по iCal-ссылке.",
      en: "The service covers the full daily-rental cycle. Booking, payment through Octobank and Atmos, and the TTLock smart-lock code delivered to the guest over Telegram — with an SMS fallback through Eskiz when there is no messenger. Uzbek specifics are handled separately: guest data and the arrival form for E-mehmon, automatic tourist-tax calculation from the base rate per night, utility-bill tracking and net profit in the analytics. Listing platforms connect self-service over an iCal link.",
      uz: "Xizmat sutkalik ijaraning to‘liq siklini qamrab oladi. Bron, Octobank va Atmos orqali to‘lov, TTLock aqlli qulfining kodi mehmonga Telegram orqali yetadi — messenjer bo‘lmasa, Eskiz orqali SMS zaxira kanali bilan. O‘zbek xususiyatlari alohida ishlangan: E-mehmon uchun mehmon ma’lumotlari va kelish varaqasi, har kecha uchun BHM bo‘yicha turizm yig‘imining avtomatik hisobi, kommunal to‘lovlar hisobi va tahlilda sof foyda.",
      zh: "该服务覆盖日租业务的完整链路。预订、通过 Octobank 与 Atmos 支付，TTLock 智能门锁的开锁码经 Telegram 发送给房客 —— 若对方未使用该通讯软件，则通过 Eskiz 短信作为备用通道。乌兹别克斯坦本地合规单独处理：面向 E-mehmon 的房客信息与入住登记表、按基准计量单位逐夜自动计算旅游税、水电物业费记账，以及分析面板中的净利润。房源平台可通过 iCal 链接自助接入。",
      uk: "Сервіс закриває весь цикл подобової оренди. Бронювання, оплата через Octobank і Atmos, код від розумного замка TTLock надходить гостеві в Telegram — із запасним каналом SMS через Eskiz, якщо месенджера немає. Окремо враховано узбецьку специфіку: дані гостя й листок прибуття для E-mehmon, автоматичний розрахунок туристичного збору за БРВ за кожну ніч, облік комунальних платежів і чистий прибуток в аналітиці. Майданчики підключаються самостійно за iCal-посиланням.",
      pl: "Serwis obsługuje cały cykl najmu na doby. Rezerwacja, płatność przez Octobank i Atmos, kod do inteligentnego zamka TTLock przychodzi do gościa na Telegramie — z zapasowym kanałem SMS przez Eskiz, jeśli gość nie ma komunikatora. Osobno obsłużona jest uzbecka specyfika: dane gościa i karta meldunkowa dla E-mehmon, automatyczne naliczanie opłaty turystycznej od BRV (bazowej wartości rozliczeniowej) za każdą noc, rozliczanie mediów i zysk netto w analityce. Platformy rezerwacyjne podłącza się samodzielnie przez link iCal.",
    },
    tech: ["FastAPI", "Next.js", "PostgreSQL", "Redis", "TTLock", "Telegram Gateway"],
    metrics: [
      { value: "24/7", label: { ru: "заселение без хозяина", en: "check-in without the owner", uz: "egasisiz joylashish", zh: "无需房东的入住", uk: "заселення без власника", pl: "zameldowanie bez właściciela" } },
      { value: "2", label: { ru: "платёжных шлюза", en: "payment gateways", uz: "to‘lov shlyuzi", zh: "接入的支付网关", uk: "платіжні шлюзи", pl: "bramki płatności" } },
      { value: "E-mehmon", label: { ru: "отчётность закрыта автоматически", en: "reporting handled automatically", uz: "hisobot avtomatik yopiladi", zh: "申报流程自动完成", uk: "звітність закривається автоматично", pl: "sprawozdawczość w pełni zautomatyzowana" } },
    ],
  },
  {
    slug: "legal-ai",
    name: "Legal AI",
    monogram: "LAI",
    date: "2026-03",
    tier: 1,
    niches: ["юридические услуги", "финансы", "консалтинг", "документооборот", "legal", "yuridik", "法律"],
    forNiches: ["yurfirma"],
    accent: "blue",
    category: {
      ru: "LLM + RAG",
      en: "LLM + RAG",
      uz: "LLM + RAG",
      zh: "LLM + RAG",
      uk: "LLM + RAG",
      pl: "LLM + RAG",
    },
    summary: {
      ru: "Поиск и разбор юридических документов, который отвечает со ссылкой на конкретный пункт договора.",
      en: "Legal document search and analysis that answers with a citation to the exact contract clause.",
      uz: "Shartnomaning aniq bandiga havola bilan javob beradigan yuridik hujjatlarni qidirish va tahlil qilish.",
      zh: "法律文书检索与解析，作答时直接引用合同中的具体条款。",
      uk: "Пошук і розбір юридичних документів, який відповідає з посиланням на конкретний пункт договору.",
      pl: "Wyszukiwanie i analiza dokumentów prawnych z odpowiedziami, które odsyłają do konkretnego punktu umowy.",
    },
    description: {
      ru: "Векторный индекс по корпусу договоров и нормативки поверх языковой модели. Ключевое требование заказчика было не «умно отвечать», а «никогда не выдумывать»: каждый ответ содержит ссылку на исходный фрагмент, и если релевантного фрагмента нет — система прямо говорит, что не нашла, вместо правдоподобного вымысла.",
      en: "A vector index over a corpus of contracts and regulations on top of a language model. The client's key requirement was not «answer cleverly» but «never invent»: every answer carries a citation to the source fragment, and when no relevant fragment exists the system says so plainly instead of producing a plausible fabrication.",
      uz: "Til modeli ustida shartnomalar va me’yoriy hujjatlar korpusi bo‘yicha vektor indeks. Buyurtmachining asosiy talabi «aqlli javob berish» emas, «hech qachon o‘ylab topmaslik» edi: har bir javobda manba parchasiga havola bor, mos parcha bo‘lmasa, tizim ishonarli uydirma o‘rniga topmaganini ochiq aytadi.",
      zh: "在语言模型之上，为合同与法规语料构建向量索引。客户的核心要求不是「回答得聪明」，而是「绝不编造」：每个答案都附带原文片段出处；若不存在相关片段，系统会明确说明未找到，而不是给出貌似合理的臆造内容。",
      uk: "Векторний індекс за корпусом договорів і нормативних актів поверх мовної моделі. Ключова вимога замовника була не «розумно відповідати», а «ніколи не вигадувати»: кожна відповідь містить посилання на вихідний фрагмент, а якщо релевантного фрагмента немає — система прямо каже, що не знайшла, замість правдоподібної вигадки.",
      pl: "Indeks wektorowy korpusu umów i aktów prawnych nad modelem językowym. Kluczowym wymogiem klienta nie było „mądrze odpowiadać”, tylko „nigdy nie zmyślać”: każda odpowiedź zawiera odwołanie do fragmentu źródłowego, a jeśli pasującego fragmentu nie ma, system mówi wprost, że go nie znalazł, zamiast podawać wiarygodnie brzmiącą fikcję.",
    },
    tech: ["Python", "pgvector", "PostgreSQL", "LLM", "RAG"],
    metrics: [
      { value: "0", label: { ru: "ответов без ссылки на источник", en: "answers without a source citation", uz: "manbasiz javoblar", zh: "无出处的答案数", uk: "відповідей без посилання на джерело", pl: "odpowiedzi bez odwołania do źródła" } },
      { value: "~2s", label: { ru: "время ответа по корпусу", en: "response time over the corpus", uz: "korpus bo‘yicha javob vaqti", zh: "语料检索响应时间", uk: "час відповіді за корпусом документів", pl: "czas odpowiedzi w całym korpusie" } },
    ],
  },
  {
    slug: "marketplace-audit",
    name: "Marketplace Audit",
    monogram: "MA",
    date: "2026-06",
    tier: 1,
    niches: ["маркетплейс", "e-commerce", "ритейл", "логистика", "финтех", "enterprise"],
    forNiches: ["internet-magazin"],
    accent: "violet",
    category: {
      ru: "Аудит и доработка",
      en: "Audit & remediation",
      uz: "Audit va takomillashtirish",
      zh: "系统审计与改造",
      uk: "Аудит і доопрацювання",
      pl: "Audyt i rozwój",
    },
    summary: {
      ru: "Архитектурный аудит маркетплейса из 35 микросервисов и план работ для команды из восьми человек.",
      en: "An architectural audit of a 35-microservice marketplace and a work plan for a team of eight.",
      uz: "35 mikroservisdan iborat marketpleysning arxitektura auditi va sakkiz kishilik jamoa uchun ish rejasi.",
      zh: "对包含 35 个微服务的电商平台进行架构审计，并为八人团队制定工作计划。",
      uk: "Архітектурний аудит маркетплейсу з 35 мікросервісів і план робіт для команди з восьми людей.",
      pl: "Audyt architektury marketplace'u złożonego z 35 mikroserwisów i plan prac dla ośmioosobowego zespołu.",
    },
    description: {
      ru: "Заказчик пришёл с работающей, но тяжёлой платформой: тридцать пять сервисов на Java и Spring Boot с оркестрацией процессов на Camunda, несколько фронтендов, боты, генератор чеков, интеграции с фискализацией и банком. Мы провели архитектурный аудит, оценили качество кода по каждому сервису, составили построчные сводки и план работ на месяц для команды доработки из восьми человек. Отдельным пунктом — план ротации секретов, захардкоженных в коде.",
      en: "The client arrived with a working but heavy platform: thirty-five Java and Spring Boot services with process orchestration on Camunda, several frontends, bots, a receipt generator, and integrations with fiscalisation and a bank. We ran an architectural audit, assessed code quality service by service, produced line-level summaries and a one-month work plan for the eight-person remediation team. A separate item covered rotating the secrets hardcoded in the codebase.",
      uz: "Buyurtmachi ishlayotgan, ammo og‘ir platforma bilan keldi: Camunda’da jarayon orkestratsiyasi bilan Java va Spring Boot’dagi o‘ttiz beshta servis, bir nechta frontend, botlar, chek generatori, fiskalizatsiya va bank bilan integratsiyalar. Biz arxitektura auditini o‘tkazdik, har bir servis bo‘yicha kod sifatini baholadik, sakkiz kishilik jamoa uchun bir oylik ish rejasini tuzdik.",
      zh: "客户带着一套能跑但沉重的平台前来：三十五个基于 Java 与 Spring Boot 的服务、以 Camunda 编排业务流程，另有多个前端、机器人、票据生成器，以及与税控系统和银行的对接。我们完成了架构审计，逐个服务评估代码质量，输出了细化到行的总结报告，并为八人改造团队制定了为期一个月的工作计划。其中单列一项，是对硬编码在代码中的密钥进行轮换的方案。",
      uk: "Замовник прийшов із робочою, але важкою платформою: тридцять п'ять сервісів на Java і Spring Boot з оркестрацією процесів на Camunda, кілька фронтендів, боти, генератор чеків, інтеграції з фіскалізацією та банком. Ми провели архітектурний аудит, оцінили якість коду кожного сервісу, склали порядкові зведення й план робіт на місяць для команди доопрацювання з восьми людей. Окремим пунктом — план ротації секретів, захардкоджених у коді.",
      pl: "Klient przyszedł z działającą, ale ciężką platformą: trzydzieści pięć serwisów w Javie i Spring Boot z orkiestracją procesów w Camunda, kilka frontendów, boty, generator paragonów, integracje z fiskalizacją i bankiem. Przeprowadziliśmy audyt architektury, oceniliśmy jakość kodu każdego serwisu, przygotowaliśmy szczegółowe zestawienia linia po linii i miesięczny plan prac dla ośmioosobowego zespołu rozwijającego system. Osobny punkt — plan rotacji sekretów zahardkodowanych w kodzie.",
    },
    tech: ["Java 17", "Spring Boot", "Camunda BPM", "NestJS", "React", "PostgreSQL"],
    metrics: [
      { value: "35", label: { ru: "сервисов в аудите", en: "services audited", uz: "auditdagi servislar", zh: "受审计的服务数", uk: "сервісів в аудиті", pl: "serwisów objętych audytem" } },
      { value: "8", label: { ru: "человек в команде доработки", en: "people on the remediation team", uz: "takomillashtirish jamoasidagi odamlar", zh: "改造团队人数", uk: "людей у команді доопрацювання", pl: "osób w zespole rozwoju" } },
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

/** Для сайта: новые сверху. При одной дате — как в массиве. */
export const casesByDate: readonly Case[] = [...cases].sort((a, b) => b.date.localeCompare(a.date));

/**
 * Дата под языком сайта: «2 октября 2026» или «август 2026», если известен
 * только месяц. Хвост «г.» / «р.» срезается: в подписи карточки он лишний.
 */
export function caseDate(item: Pick<Case, "date">, locale: Locale): string {
  const [year, month, day] = item.date.split("-").map(Number);
  const at = new Date(Date.UTC(year, month - 1, day || 1, 12));
  const options: Intl.DateTimeFormatOptions = day
    ? { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }
    : { month: "long", year: "numeric", timeZone: "UTC" };
  return new Intl.DateTimeFormat(locale, options).format(at).replace(/\s?(г|р)\.$/, "");
}

export function caseBySlug(slug: string): Case | undefined {
  return cases.find((c) => c.slug === slug);
}
