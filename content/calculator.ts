import type { LocalizedList, LocalizedText } from "@/lib/i18n";

/**
 * Модель предварительной оценки проекта.
 *
 * Все базовые ставки — в сумах и опираются на реальную вилку ташкентского
 * рынка (лендинг 2–6 млн, корпоративный сайт 4–12 млн, магазин от 8 млн,
 * мобильное приложение от 20–30 млн). Мы стоим в верхней части этих вилок
 * осознанно: считаем не «сверстать», а сдать работающий продукт с
 * интеграциями, админкой и поддержкой.
 *
 * Калькулятор намеренно возвращает диапазон, а не одну цифру. Одна цифра
 * читается как обязательство, а на реальном проекте всегда всплывают
 * требования, которых нет ни в одном калькуляторе.
 */

/** Верхняя граница вилки относительно нижней. */
export const RANGE_FACTOR = 1.4;
/** Во столько же раз растягивается срок: неопределённость общая. */
export const WEEKS_FACTOR = 1.5;

export type ScopeLine = {
  /** Что появляется на техническом уровне. */
  tech?: LocalizedText;
  /** Какая работа при этом выполняется. */
  work?: LocalizedText;
};

export type Choice = {
  id: string;
  label: LocalizedText;
  addUzs?: number;
  mul?: number;
  weeks?: number;
  scope?: ScopeLine;
};

export type CalcOption = {
  id: string;
  label: LocalizedText;
  hint?: LocalizedText;
  /** Категории, в которых опция имеет смысл. */
  appliesTo: string[];
} & (
  | { kind: "toggle"; addUzs?: number; mul?: number; weeks?: number; scope?: ScopeLine }
  | { kind: "choice"; choices: Choice[] }
  | {
      kind: "counter";
      /** Фиксированная цена за единицу. */
      unitUzs: number;
      /**
       * Надбавка в долях от базы за единицу — для того, что дорожает
       * пропорционально проекту. Лишний язык на маркетплейсе стоит совсем
       * не столько же, сколько на лендинге, и плоская цена тут врала бы.
       */
      unitMul?: number;
      unitWeeks?: number;
      max: number;
      unitLabel: LocalizedText;
      scope?: ScopeLine;
    }
);

export type CalcCategory = {
  slug: string;
  icon: string;
  title: LocalizedText;
  tagline: LocalizedText;
  baseUzs: number;
  baseWeeks: number;
  /** Что входит в базовую конфигурацию — без единой галочки. */
  tech: LocalizedList;
  work: LocalizedList;
};

export const categories: CalcCategory[] = [
  {
    slug: "landing",
    icon: "globe",
    title: { ru: "Лендинг", en: "Landing page", uz: "Lending", zh: "落地页" },
    tagline: {
      ru: "Одна страница под один продукт или запуск",
      en: "One page for one product or launch",
      uz: "Bitta mahsulot yoki ishga tushirish uchun bitta sahifa",
      zh: "为单个产品或活动打造的单页",
    },
    baseUzs: 4_200_000,
    baseWeeks: 2,
    tech: {
      ru: ["Next.js, серверный рендеринг", "Адаптив от 320 px", "Форма заявки с защитой от ботов", "Метрика и GA4"],
      en: ["Next.js with server rendering", "Responsive from 320 px", "Lead form with bot protection", "Yandex Metrica and GA4"],
      uz: ["Next.js, server tomonida render", "320 px dan moslashuvchan", "Botlardan himoyalangan ariza formasi", "Metrika va GA4"],
      zh: ["Next.js 服务端渲染", "自 320px 起自适应", "带反机器人防护的表单", "Yandex Metrica 与 GA4"],
    },
    work: {
      ru: ["Прототип экрана", "Дизайн под ваш бренд", "Вёрстка и анимации", "Деплой, домен, SSL"],
      en: ["Screen prototype", "Design in your brand", "Build and animation", "Deployment, domain, SSL"],
      uz: ["Ekran prototipi", "Brendingiz uchun dizayn", "Verstka va animatsiyalar", "Deploy, domen, SSL"],
      zh: ["页面原型", "契合品牌的设计", "页面开发与动效", "部署、域名与 SSL"],
    },
  },
  {
    slug: "corporate",
    icon: "globe",
    title: {
      ru: "Корпоративный сайт",
      en: "Corporate website",
      uz: "Korporativ sayt",
      zh: "企业官网",
    },
    tagline: {
      ru: "Каталог, услуги, новости, кейсы",
      en: "Catalogue, services, news, case studies",
      uz: "Katalog, xizmatlar, yangiliklar, keyslar",
      zh: "产品目录、服务、资讯与案例",
    },
    baseUzs: 9_500_000,
    baseWeeks: 4,
    tech: {
      ru: ["До 8 типовых страниц", "Каталог или блог", "Схема Schema.org", "Карта сайта и robots.txt"],
      en: ["Up to 8 standard pages", "Catalogue or blog", "Schema.org markup", "Sitemap and robots.txt"],
      uz: ["8 tagacha tipik sahifa", "Katalog yoki blog", "Schema.org belgilash", "Sayt xaritasi va robots.txt"],
      zh: ["最多 8 个标准页面", "产品目录或博客", "Schema.org 结构化数据", "站点地图与 robots.txt"],
    },
    work: {
      ru: ["Структура и прототипы", "Индивидуальный дизайн", "Разработка и наполнение", "Обучение вашей команды"],
      en: ["Structure and prototypes", "Custom design", "Development and content", "Training for your team"],
      uz: ["Struktura va prototiplar", "Individual dizayn", "Ishlab chiqish va to‘ldirish", "Jamoangizni o‘qitish"],
      zh: ["结构规划与原型", "定制设计", "开发与内容录入", "团队使用培训"],
    },
  },
  {
    slug: "ecommerce",
    icon: "cart",
    title: {
      ru: "Интернет-магазин",
      en: "Online store",
      uz: "Internet-do‘kon",
      zh: "网上商城",
    },
    tagline: {
      ru: "Каталог, корзина, оплата, доставка",
      en: "Catalogue, cart, payment, delivery",
      uz: "Katalog, savat, to‘lov, yetkazib berish",
      zh: "商品目录、购物车、支付与配送",
    },
    baseUzs: 23_000_000,
    baseWeeks: 7,
    tech: {
      ru: ["Каталог с фильтрами и поиском", "Корзина и оформление заказа", "Личный кабинет покупателя", "Панель заказов для менеджера"],
      en: ["Catalogue with filters and search", "Cart and checkout", "Customer account", "Order panel for managers"],
      uz: ["Filtr va qidiruvli katalog", "Savat va buyurtma rasmiylashtirish", "Xaridor shaxsiy kabineti", "Menejer uchun buyurtmalar paneli"],
      zh: ["带筛选与搜索的商品目录", "购物车与结算", "买家个人中心", "面向运营的订单管理台"],
    },
    work: {
      ru: ["Проектирование сценариев покупки", "Дизайн всех состояний", "Разработка и нагрузочная проверка", "Запуск и передача доступов"],
      en: ["Designing the purchase flows", "Design for every state", "Development and load testing", "Launch and handover of access"],
      uz: ["Xarid stsenariylarini loyihalash", "Barcha holatlar uchun dizayn", "Ishlab chiqish va yuklama sinovi", "Ishga tushirish va kirish topshirish"],
      zh: ["购买流程设计", "全状态界面设计", "开发与压力测试", "上线与权限交接"],
    },
  },
  {
    slug: "platform",
    icon: "cart",
    title: {
      ru: "Маркетплейс или платформа",
      en: "Marketplace or platform",
      uz: "Marketpleys yoki platforma",
      zh: "电商平台或多角色系统",
    },
    tagline: {
      ru: "Несколько ролей, логистика, партнёры",
      en: "Multiple roles, logistics, partners",
      uz: "Bir nechta rol, logistika, hamkorlar",
      zh: "多角色、物流与合作方对接",
    },
    baseUzs: 95_000_000,
    baseWeeks: 14,
    tech: {
      ru: ["Две роли: покупатель и продавец", "Очереди задач и фоновые процессы", "Панель модерации", "Развёртывание в контейнерах"],
      en: ["Two roles: buyer and seller", "Job queues and background processing", "Moderation panel", "Container-based deployment"],
      uz: ["Ikki rol: xaridor va sotuvchi", "Vazifalar navbati va fon jarayonlar", "Moderatsiya paneli", "Konteynerlarda joylashtirish"],
      zh: ["买家与卖家两种角色", "任务队列与后台处理", "审核管理台", "容器化部署"],
    },
    work: {
      ru: ["Архитектура и модель данных", "Дизайн-система на все роли", "Разработка спринтами по неделе", "Нагрузочное тестирование и запуск"],
      en: ["Architecture and data model", "Design system for every role", "Development in weekly sprints", "Load testing and launch"],
      uz: ["Arxitektura va ma’lumotlar modeli", "Barcha rollar uchun dizayn tizimi", "Haftalik sprintlarda ishlab chiqish", "Yuklama sinovi va ishga tushirish"],
      zh: ["架构与数据模型设计", "覆盖各角色的设计系统", "按周迭代开发", "压力测试与上线"],
    },
  },
  {
    slug: "mobile",
    icon: "phone",
    title: {
      ru: "Мобильное приложение",
      en: "Mobile app",
      uz: "Mobil ilova",
      zh: "移动应用",
    },
    tagline: {
      ru: "iOS и Android из одной кодовой базы",
      en: "iOS and Android from one codebase",
      uz: "Bitta kod bazasidan iOS va Android",
      zh: "一套代码覆盖 iOS 与 Android",
    },
    baseUzs: 32_000_000,
    baseWeeks: 9,
    tech: {
      ru: ["Flutter, обе платформы сразу", "До 10 экранов", "Push-уведомления", "Бэкенд и API"],
      en: ["Flutter, both platforms at once", "Up to 10 screens", "Push notifications", "Backend and API"],
      uz: ["Flutter, ikkala platforma birdan", "10 tagacha ekran", "Push-bildirishnomalar", "Backend va API"],
      zh: ["Flutter 一次覆盖双端", "最多 10 个界面", "消息推送", "后端与 API"],
    },
    work: {
      ru: ["Сценарии и прототип", "Дизайн под гайдлайны платформ", "Разработка и тестирование на устройствах", "Публикация в App Store и Google Play"],
      en: ["Flows and prototype", "Design to platform guidelines", "Development and on-device testing", "Publishing to the App Store and Google Play"],
      uz: ["Stsenariylar va prototip", "Platforma qoidalariga mos dizayn", "Ishlab chiqish va qurilmalarda test", "App Store va Google Play’da nashr"],
      zh: ["流程梳理与原型", "遵循双端规范的设计", "开发与真机测试", "上架 App Store 与 Google Play"],
    },
  },
  {
    slug: "ai",
    icon: "brain",
    title: {
      ru: "AI-ассистент, LLM и RAG",
      en: "AI assistant, LLM and RAG",
      uz: "AI-yordamchi, LLM va RAG",
      zh: "AI 助手、LLM 与 RAG",
    },
    tagline: {
      ru: "Отвечает по вашим данным, а не выдумывает",
      en: "Answers from your data instead of inventing",
      uz: "O‘ylab topmaydi, ma’lumotlaringiz asosida javob beradi",
      zh: "基于你的数据作答，而非凭空编造",
    },
    baseUzs: 26_000_000,
    baseWeeks: 5,
    tech: {
      ru: ["Диалог на кастомной LLM", "Промпт под ваш процесс", "Защита от подмены инструкций", "Логи и метрики диалогов"],
      en: ["Conversation on a custom LLM", "Prompt tuned to your process", "Protection against prompt injection", "Conversation logs and metrics"],
      uz: ["Maxsus LLM asosidagi muloqot", "Jarayoningizga moslangan prompt", "Ko‘rsatmalarni almashtirishdan himoya", "Suhbat loglari va metrikalari"],
      zh: ["基于定制 LLM 的对话能力", "贴合你业务流程的提示词", "提示注入防护", "对话日志与指标"],
    },
    work: {
      ru: ["Разбор процесса и сценариев", "Сбор и разметка базы знаний", "Настройка и прогон на реальных диалогах", "Передача и обучение команды"],
      en: ["Mapping the process and scenarios", "Collecting and labelling the knowledge base", "Tuning and testing on real conversations", "Handover and team training"],
      uz: ["Jarayon va stsenariylarni tahlil qilish", "Bilimlar bazasini yig‘ish va belgilash", "Sozlash va haqiqiy suhbatlarda sinash", "Topshirish va jamoani o‘qitish"],
      zh: ["业务流程与场景梳理", "知识库整理与标注", "调优并在真实对话中验证", "交付与团队培训"],
    },
  },
  {
    slug: "design",
    icon: "globe",
    title: {
      ru: "Дизайн без разработки",
      en: "Design only",
      uz: "Dasturlashsiz dizayn",
      zh: "纯设计（不含开发）",
    },
    tagline: {
      ru: "UI/UX и макеты, которые вы отдадите своей команде",
      en: "UI/UX and layouts to hand to your own team",
      uz: "O‘z jamoangizga topshiradigan UI/UX va maketlar",
      zh: "可交由你自己团队实现的 UI/UX 设计稿",
    },
    baseUzs: 6_500_000,
    baseWeeks: 3,
    tech: {
      ru: ["Макеты в Figma", "Дизайн-система и компоненты", "Состояния: пустое, загрузка, ошибка", "Экспорт ассетов"],
      en: ["Figma layouts", "Design system and components", "Empty, loading and error states", "Asset export"],
      uz: ["Figma’dagi maketlar", "Dizayn tizimi va komponentlar", "Holatlar: bo‘sh, yuklanish, xato", "Assetlarni eksport qilish"],
      zh: ["Figma 设计稿", "设计系统与组件库", "空态、加载态与错误态", "素材导出"],
    },
    work: {
      ru: ["Исследование и структура", "Прототипы ключевых экранов", "Визуальный дизайн", "Передача разработчикам с описанием"],
      en: ["Research and structure", "Prototypes of key screens", "Visual design", "Handover to developers with specs"],
      uz: ["Tadqiqot va struktura", "Asosiy ekranlar prototipi", "Vizual dizayn", "Tavsif bilan dasturchilarga topshirish"],
      zh: ["调研与信息架构", "核心页面原型", "视觉设计", "附带说明交付给开发"],
    },
  },
  {
    slug: "integration",
    icon: "plug",
    title: {
      ru: "Интеграции и автоматизация",
      en: "Integrations and automation",
      uz: "Integratsiyalar va avtomatlashtirish",
      zh: "系统集成与自动化",
    },
    tagline: {
      ru: "Связать то, что у вас уже работает",
      en: "Connect what you already run",
      uz: "Allaqachon ishlayotgan narsalarni bog‘lash",
      zh: "把你已有的系统连接起来",
    },
    baseUzs: 5_500_000,
    baseWeeks: 2,
    tech: {
      ru: ["Одна интеграция под ключ", "Обработка ошибок и повторы", "Журнал обмена данными", "Документация по API"],
      en: ["One turnkey integration", "Error handling and retries", "Data exchange log", "API documentation"],
      uz: ["Bitta integratsiya kalit topshirish shartlarida", "Xatolarni qayta ishlash va takrorlar", "Ma’lumot almashinuvi jurnali", "API hujjatlari"],
      zh: ["一项交钥匙集成", "错误处理与自动重试", "数据交换日志", "API 文档"],
    },
    work: {
      ru: ["Разбор форматов обмена", "Разработка и тестовый контур", "Перевод на боевой контур", "Наблюдение первую неделю"],
      en: ["Reviewing the exchange formats", "Development and a staging loop", "Move to production", "Monitoring for the first week"],
      uz: ["Almashinuv formatlarini tahlil qilish", "Ishlab chiqish va sinov konturi", "Jangovar konturga o‘tkazish", "Birinchi hafta kuzatuv"],
      zh: ["对接数据格式梳理", "开发与测试环境验证", "切换至生产环境", "上线首周持续观察"],
    },
  },
  {
    slug: "support",
    icon: "plug",
    title: {
      ru: "Доработка чужого проекта",
      en: "Taking over an existing project",
      uz: "Boshqalarning loyihasini takomillashtirish",
      zh: "接手他人已有项目",
    },
    tagline: {
      ru: "Аудит, план работ и подхват разработки",
      en: "Audit, work plan and picking up development",
      uz: "Audit, ish rejasi va ishlab chiqishni davom ettirish",
      zh: "审计、工作计划与接续开发",
    },
    baseUzs: 3_800_000,
    baseWeeks: 1,
    tech: {
      ru: ["Разбор архитектуры", "Оценка качества кода", "Список рисков и уязвимостей", "Отчёт с приоритетами"],
      en: ["Architecture review", "Code quality assessment", "List of risks and vulnerabilities", "A prioritised report"],
      uz: ["Arxitekturani tahlil qilish", "Kod sifatini baholash", "Xavflar va zaifliklar ro‘yxati", "Ustuvorliklar bilan hisobot"],
      zh: ["架构梳理", "代码质量评估", "风险与漏洞清单", "带优先级的评估报告"],
    },
    work: {
      ru: ["Знакомство с репозиторием", "Построчные сводки по модулям", "План работ с оценкой", "Защита плана перед вашей командой"],
      en: ["Getting to know the repository", "Line-level summaries per module", "A work plan with estimates", "Presenting the plan to your team"],
      uz: ["Repozitoriy bilan tanishish", "Modullar bo‘yicha qatorma-qator sharhlar", "Baholash bilan ish rejasi", "Rejani jamoangiz oldida himoya qilish"],
      zh: ["熟悉代码仓库", "按模块逐行梳理总结", "含工作量估算的计划", "向你的团队讲解方案"],
    },
  },
];

export function categoryBySlug(slug: string): CalcCategory | undefined {
  return categories.find((c) => c.slug === slug);
}

// ─── Опции ──────────────────────────────────────────────────────────────────
// Порядок в массиве определяет порядок на экране: сначала то, что меняет
// проект сильнее всего (объём и уровень дизайна), в конце — срочность и
// поддержка, которые применяются множителем ко всему остальному.

const WEB = ["landing", "corporate", "ecommerce", "platform"];
const PRODUCT = ["corporate", "ecommerce", "platform", "mobile", "ai"];
const ALL = categories.map((c) => c.slug);

export const options: CalcOption[] = [
  {
    id: "pages",
    kind: "counter",
    appliesTo: ["landing", "corporate", "ecommerce", "design"],
    label: {
      ru: "Дополнительные страницы",
      en: "Extra pages",
      uz: "Qo‘shimcha sahifalar",
      zh: "额外页面",
    },
    hint: {
      ru: "Сверх тех, что уже входят в базу",
      en: "Beyond the ones already included",
      uz: "Bazaga kiradiganlardan tashqari",
      zh: "在基础包含页面之外",
    },
    max: 20,
    unitLabel: { ru: "страница", en: "page", uz: "sahifa", zh: "页" },
    unitUzs: 900_000,
    unitWeeks: 0.3,
    scope: {
      tech: {
        ru: "Дополнительные страницы с уникальной вёрсткой",
        en: "Extra pages with their own layout",
        uz: "O‘z verstkasiga ega qo‘shimcha sahifalar",
        zh: "拥有独立版式的额外页面",
      },
      work: {
        ru: "Дизайн и вёрстка каждой добавленной страницы",
        en: "Design and build for every added page",
        uz: "Har bir qo‘shilgan sahifa uchun dizayn va verstka",
        zh: "为每个新增页面完成设计与开发",
      },
    },
  },
  {
    id: "screens",
    kind: "counter",
    appliesTo: ["mobile"],
    label: {
      ru: "Дополнительные экраны",
      en: "Extra screens",
      uz: "Qo‘shimcha ekranlar",
      zh: "额外界面",
    },
    hint: {
      ru: "Сверх десяти, входящих в базу",
      en: "Beyond the ten included",
      uz: "Bazadagi o‘ntadan tashqari",
      zh: "在基础包含的十个界面之外",
    },
    max: 30,
    unitLabel: { ru: "экран", en: "screen", uz: "ekran", zh: "界面" },
    unitUzs: 1_700_000,
    unitWeeks: 0.4,
    scope: {
      tech: {
        ru: "Дополнительные экраны приложения",
        en: "Extra app screens",
        uz: "Ilovaning qo‘shimcha ekranlari",
        zh: "额外的应用界面",
      },
      work: {
        ru: "Дизайн, разработка и тестирование новых экранов",
        en: "Design, development and testing of the new screens",
        uz: "Yangi ekranlarni dizayn qilish, ishlab chiqish va sinash",
        zh: "新界面的设计、开发与测试",
      },
    },
  },
  {
    id: "design_level",
    kind: "choice",
    appliesTo: ["landing", "corporate", "ecommerce", "platform", "mobile", "design"],
    label: { ru: "Уровень дизайна", en: "Design level", uz: "Dizayn darajasi", zh: "设计层级" },
    choices: [
      {
        id: "template",
        label: {
          ru: "На готовой сетке",
          en: "On a ready grid",
          uz: "Tayyor to‘r asosida",
          zh: "基于现成栅格",
        },
        mul: 1,
      },
      {
        id: "custom",
        label: {
          ru: "Индивидуальный",
          en: "Custom",
          uz: "Individual",
          zh: "定制设计",
        },
        mul: 1.35,
        weeks: 1,
        scope: {
          work: {
            ru: "Индивидуальный дизайн под ваш бренд, без шаблонных сеток",
            en: "Custom design in your brand, no template grids",
            uz: "Brendingiz uchun individual dizayn, shablon to‘rlarsiz",
            zh: "契合品牌的定制设计，不使用模板栅格",
          },
        },
      },
      {
        id: "premium",
        label: {
          ru: "С анимациями и сценарием",
          en: "With animation and choreography",
          uz: "Animatsiya va stsenariy bilan",
          zh: "含动效与叙事编排",
        },
        mul: 1.75,
        weeks: 2,
        scope: {
          tech: {
            ru: "Анимации, привязанные к прокрутке, без просадки Core Web Vitals",
            en: "Scroll-driven animation that keeps Core Web Vitals green",
            uz: "Core Web Vitals’ni tushirmaydigan skrollga bog‘langan animatsiyalar",
            zh: "由滚动驱动、且不拖累 Core Web Vitals 的动效",
          },
          work: {
            ru: "Раскадровка сцен и покадровая настройка анимации",
            en: "Scene storyboarding and frame-level animation tuning",
            uz: "Sahnalar raskadrovkasi va animatsiyani kadrma-kadr sozlash",
            zh: "分镜设计与逐帧动效调校",
          },
        },
      },
    ],
  },
  {
    id: "admin",
    kind: "choice",
    appliesTo: PRODUCT,
    label: { ru: "Админ-панель", en: "Admin panel", uz: "Admin panel", zh: "后台管理" },
    choices: [
      { id: "none", label: { ru: "Не нужна", en: "Not needed", uz: "Kerak emas", zh: "不需要" }, mul: 1 },
      {
        id: "basic",
        label: { ru: "Базовая", en: "Basic", uz: "Bazaviy", zh: "基础版" },
        addUzs: 5_500_000,
        weeks: 1.5,
        scope: {
          tech: {
            ru: "Админка: правка контента без разработчика",
            en: "Admin panel: content edits without a developer",
            uz: "Admin panel: dasturchisiz kontent tahriri",
            zh: "后台：无需开发即可修改内容",
          },
        },
      },
      {
        id: "advanced",
        label: { ru: "Расширенная", en: "Advanced", uz: "Kengaytirilgan", zh: "进阶版" },
        addUzs: 13_000_000,
        weeks: 3,
        scope: {
          tech: {
            ru: "Админка с ролями, правами и историей изменений",
            en: "Admin panel with roles, permissions and an audit trail",
            uz: "Rollar, huquqlar va o‘zgarishlar tarixi bilan admin panel",
            zh: "含角色、权限与变更记录的后台",
          },
          work: {
            ru: "Проектирование прав доступа под вашу структуру",
            en: "Designing access rights around your org structure",
            uz: "Tuzilmangizga mos kirish huquqlarini loyihalash",
            zh: "按你的组织结构设计权限体系",
          },
        },
      },
    ],
  },
  {
    id: "auth",
    kind: "toggle",
    appliesTo: PRODUCT,
    label: {
      ru: "Личный кабинет и вход",
      en: "User accounts and sign-in",
      uz: "Shaxsiy kabinet va kirish",
      zh: "用户中心与登录",
    },
    hint: {
      ru: "Вход через Telegram-бот — привычнее SMS и дешевле в эксплуатации",
      en: "Telegram-bot sign-in — more familiar than SMS and cheaper to run",
      uz: "Telegram-bot orqali kirish — SMS’dan odatiyroq va arzonroq",
      zh: "通过 Telegram 机器人登录 —— 比短信更常见，运营成本更低",
    },
    addUzs: 7_500_000,
    weeks: 1.5,
    scope: {
      tech: {
        ru: "Регистрация и вход по коду из Telegram, без SMS и паролей",
        en: "Sign-up and sign-in by a Telegram code, no SMS or passwords",
        uz: "Telegram kodi orqali ro‘yxatdan o‘tish va kirish, SMS va parolsiz",
        zh: "通过 Telegram 验证码注册登录，无需短信与密码",
      },
    },
  },
  {
    id: "payments",
    kind: "toggle",
    appliesTo: ["ecommerce", "platform", "mobile"],
    label: {
      ru: "Онлайн-оплата",
      en: "Online payments",
      uz: "Onlayn to‘lov",
      zh: "在线支付",
    },
    hint: {
      ru: "Payme, Click, Uzum, Octobank",
      en: "Payme, Click, Uzum, Octobank",
      uz: "Payme, Click, Uzum, Octobank",
      zh: "Payme、Click、Uzum、Octobank",
    },
    addUzs: 7_000_000,
    weeks: 1.5,
    scope: {
      tech: {
        ru: "Платёжный шлюз с проверкой подписи и возвратами",
        en: "Payment gateway with signature checks and refunds",
        uz: "Imzo tekshiruvi va qaytarishlar bilan to‘lov shlyuzi",
        zh: "含签名校验与退款流程的支付网关",
      },
      work: {
        ru: "Подключение и проверка на боевых платежах",
        en: "Connecting and verifying with live payments",
        uz: "Ulash va jangovar to‘lovlarda tekshirish",
        zh: "接入并以真实交易验证",
      },
    },
  },
  {
    id: "integrations",
    kind: "counter",
    appliesTo: ["corporate", "ecommerce", "platform", "mobile", "integration"],
    label: {
      ru: "Интеграции с вашими системами",
      en: "Integrations with your systems",
      uz: "Tizimlaringiz bilan integratsiyalar",
      zh: "与你现有系统的对接",
    },
    hint: {
      ru: "1С, iiko, Poster, CRM, склад, произвольный REST",
      en: "1C, iiko, Poster, CRM, warehouse, custom REST",
      uz: "1C, iiko, Poster, CRM, ombor, ixtiyoriy REST",
      zh: "1C、iiko、Poster、CRM、仓储系统或自定义 REST",
    },
    max: 6,
    unitLabel: { ru: "система", en: "system", uz: "tizim", zh: "个系统" },
    unitUzs: 7_500_000,
    unitWeeks: 1.2,
    scope: {
      tech: {
        ru: "Двусторонний обмен по webhook с подписью HMAC",
        en: "Two-way exchange over HMAC-signed webhooks",
        uz: "HMAC imzosi bilan webhook orqali ikki tomonlama almashinuv",
        zh: "基于 HMAC 签名 webhook 的双向数据交换",
      },
      work: {
        ru: "Разбор форматов, тестовый контур, перевод на боевой",
        en: "Format review, a staging loop, then the move to production",
        uz: "Formatlarni tahlil qilish, sinov konturi, jangovarga o‘tkazish",
        zh: "格式梳理、测试环境验证、切换生产",
      },
    },
  },
  {
    id: "roles",
    kind: "counter",
    appliesTo: ["platform", "mobile"],
    label: {
      ru: "Дополнительные роли",
      en: "Extra roles",
      uz: "Qo‘shimcha rollar",
      zh: "额外角色",
    },
    hint: {
      ru: "Курьер, партнёр, оператор — у каждой свой интерфейс",
      en: "Courier, partner, operator — each with its own interface",
      uz: "Kuryer, hamkor, operator — har birining o‘z interfeysi",
      zh: "骑手、合作商家、客服 —— 各有独立界面",
    },
    max: 4,
    unitLabel: { ru: "роль", en: "role", uz: "rol", zh: "个角色" },
    unitUzs: 15_000_000,
    unitWeeks: 2.5,
    scope: {
      tech: {
        ru: "Отдельный интерфейс и права под каждую роль",
        en: "A separate interface and permissions per role",
        uz: "Har bir rol uchun alohida interfeys va huquqlar",
        zh: "为每种角色提供独立界面与权限",
      },
    },
  },
  {
    id: "native",
    kind: "toggle",
    appliesTo: ["mobile"],
    label: {
      ru: "Нативная разработка вместо Flutter",
      en: "Native development instead of Flutter",
      uz: "Flutter o‘rniga native ishlab chiqish",
      zh: "使用原生开发替代 Flutter",
    },
    hint: {
      ru: "Нужна, когда важны тяжёлая графика или редкие возможности устройства",
      en: "Worth it when heavy graphics or rare device features matter",
      uz: "Og‘ir grafika yoki kamdan-kam qurilma imkoniyatlari muhim bo‘lganda kerak",
      zh: "在重度图形或罕见设备能力需求下才值得",
    },
    mul: 1.55,
    weeks: 4,
    scope: {
      tech: {
        ru: "Две отдельные кодовые базы: Swift и Kotlin",
        en: "Two separate codebases: Swift and Kotlin",
        uz: "Ikkita alohida kod bazasi: Swift va Kotlin",
        zh: "Swift 与 Kotlin 两套独立代码库",
      },
    },
  },
  {
    id: "rag",
    kind: "toggle",
    appliesTo: ["ai"],
    label: {
      ru: "Поиск по вашим документам",
      en: "Search across your documents",
      uz: "Hujjatlaringiz bo‘ylab qidiruv",
      zh: "检索你的内部文档",
    },
    hint: {
      ru: "Ответ со ссылкой на конкретный пункт, а не пересказ по памяти",
      en: "Answers cite the exact clause instead of recalling from memory",
      uz: "Xotiradan takrorlash emas, aniq bandga havola bilan javob",
      zh: "答案引用具体条款，而非凭记忆复述",
    },
    addUzs: 14_000_000,
    weeks: 3,
    scope: {
      tech: {
        ru: "Векторный индекс на pgvector внутри вашей базы",
        en: "A pgvector index inside your own database",
        uz: "Sizning bazangiz ichida pgvector asosidagi vektor indeks",
        zh: "在你自己数据库中构建的 pgvector 向量索引",
      },
      work: {
        ru: "Сбор корпуса, нарезка, проверка ответов на контрольных вопросах",
        en: "Building the corpus, chunking it, checking answers against a control set",
        uz: "Korpus yig‘ish, bo‘laklash, nazorat savollarida javoblarni tekshirish",
        zh: "语料收集与切分，并用对照问题集校验答案",
      },
    },
  },
  {
    id: "agents",
    kind: "counter",
    appliesTo: ["ai"],
    label: {
      ru: "Автономные агенты",
      en: "Autonomous agents",
      uz: "Avtonom agentlar",
      zh: "自主智能体",
    },
    hint: {
      ru: "Каждый закрывает свой участок: отзывы, цены, контент, поддержка",
      en: "Each covers its own area: reviews, pricing, content, support",
      uz: "Har biri o‘z yo‘nalishini qamraydi: sharhlar, narxlar, kontent, qo‘llab-quvvatlash",
      zh: "各自负责一块：评价、定价、内容、客服",
    },
    max: 8,
    unitLabel: { ru: "агент", en: "agent", uz: "agent", zh: "个智能体" },
    unitUzs: 10_000_000,
    unitWeeks: 1.5,
    scope: {
      tech: {
        ru: "Агент с собственным набором инструментов и расписанием",
        en: "An agent with its own tool set and schedule",
        uz: "O‘z asboblar to‘plami va jadvaliga ega agent",
        zh: "拥有独立工具集与调度计划的智能体",
      },
    },
  },
  {
    id: "notifications",
    kind: "toggle",
    appliesTo: ["corporate", "ecommerce", "platform", "mobile", "ai", "integration"],
    label: {
      ru: "Уведомления клиентам",
      en: "Customer notifications",
      uz: "Mijozlarga bildirishnomalar",
      zh: "面向客户的通知",
    },
    hint: {
      ru: "Telegram Gateway с запасным каналом на SMS через Eskiz",
      en: "Telegram Gateway with an SMS fallback through Eskiz",
      uz: "Eskiz orqali SMS zaxira kanali bilan Telegram Gateway",
      zh: "Telegram Gateway，并以 Eskiz 短信作为备用通道",
    },
    addUzs: 4_500_000,
    weeks: 1,
    scope: {
      tech: {
        ru: "Шаблоны сообщений, очередь отправки, отчёты о доставке",
        en: "Message templates, a send queue, delivery reports",
        uz: "Xabar shablonlari, yuborish navbati, yetkazish hisobotlari",
        zh: "消息模板、发送队列与送达回执",
      },
    },
  },
  {
    id: "seo",
    kind: "toggle",
    appliesTo: WEB,
    label: {
      ru: "Техническое SEO",
      en: "Technical SEO",
      uz: "Texnik SEO",
      zh: "技术 SEO",
    },
    hint: {
      ru: "Google и Яндекс: разметка, карта сайта, IndexNow, Core Web Vitals",
      en: "Google and Yandex: markup, sitemap, IndexNow, Core Web Vitals",
      uz: "Google va Yandeks: belgilash, sayt xaritasi, IndexNow, Core Web Vitals",
      zh: "面向 Google 与 Yandex：结构化数据、站点地图、IndexNow、Core Web Vitals",
    },
    addUzs: 4_500_000,
    weeks: 1,
    scope: {
      tech: {
        ru: "Schema.org, hreflang, sitemap, robots, IndexNow",
        en: "Schema.org, hreflang, sitemap, robots, IndexNow",
        uz: "Schema.org, hreflang, sitemap, robots, IndexNow",
        zh: "Schema.org、hreflang、站点地图、robots、IndexNow",
      },
      work: {
        ru: "Подключение Search Console и Вебмастера, проверка Core Web Vitals на реальных телефонах",
        en: "Connecting Search Console and Yandex Webmaster, checking Core Web Vitals on real phones",
        uz: "Search Console va Vebmasterni ulash, Core Web Vitals’ni haqiqiy telefonlarda tekshirish",
        zh: "接入 Search Console 与 Yandex Webmaster，并在真机上核验 Core Web Vitals",
      },
    },
  },
  {
    id: "content_fill",
    kind: "toggle",
    appliesTo: ["landing", "corporate", "ecommerce"],
    label: {
      ru: "Тексты и наполнение",
      en: "Copy and content",
      uz: "Matnlar va to‘ldirish",
      zh: "文案与内容录入",
    },
    hint: {
      ru: "Если своих текстов нет — напишем и разложим по страницам",
      en: "If you have no copy of your own, we write it and lay it out",
      uz: "O‘z matnlaringiz bo‘lmasa — yozamiz va sahifalarga joylaymiz",
      zh: "若暂无现成文案，我们撰写并排布到各页面",
    },
    addUzs: 3_800_000,
    weeks: 1,
    scope: {
      work: {
        ru: "Копирайтинг и наполнение всех страниц",
        en: "Copywriting and filling in every page",
        uz: "Kopirayting va barcha sahifalarni to‘ldirish",
        zh: "文案撰写并完成全站内容录入",
      },
    },
  },
  {
    id: "languages",
    kind: "counter",
    appliesTo: ["landing", "corporate", "ecommerce", "platform", "mobile", "ai", "design"],
    label: {
      ru: "Дополнительные языки",
      en: "Extra languages",
      uz: "Qo‘shimcha tillar",
      zh: "额外语言版本",
    },
    hint: {
      ru: "Сверх основного. Перевод и вёрстка под каждый",
      en: "Beyond the primary one. Translation and layout for each",
      uz: "Asosiysidan tashqari. Har biri uchun tarjima va verstka",
      zh: "在主语言之外。每种语言均含翻译与排版",
    },
    max: 3,
    unitLabel: { ru: "язык", en: "language", uz: "til", zh: "种语言" },
    unitUzs: 0,
    unitMul: 0.12,
    unitWeeks: 0.6,
    scope: {
      tech: {
        ru: "Отдельный адрес и hreflang для каждой языковой версии",
        en: "A separate URL and hreflang for every language version",
        uz: "Har bir til versiyasi uchun alohida manzil va hreflang",
        zh: "每个语言版本拥有独立网址与 hreflang 标注",
      },
    },
  },
  {
    id: "audit_depth",
    kind: "choice",
    appliesTo: ["support"],
    label: { ru: "Глубина разбора", en: "Depth of review", uz: "Tahlil chuqurligi", zh: "审计深度" },
    choices: [
      {
        id: "express",
        label: { ru: "Экспресс", en: "Express", uz: "Ekspress", zh: "快速版" },
        mul: 1,
      },
      {
        id: "full",
        label: { ru: "Полный аудит", en: "Full audit", uz: "To‘liq audit", zh: "完整审计" },
        mul: 2.6,
        weeks: 2,
        scope: {
          work: {
            ru: "Построчные сводки по каждому модулю",
            en: "Line-level summaries for every module",
            uz: "Har bir modul bo‘yicha qatorma-qator sharhlar",
            zh: "逐个模块的细化到行的总结",
          },
        },
      },
      {
        id: "plan",
        label: {
          ru: "Аудит и план работ",
          en: "Audit and work plan",
          uz: "Audit va ish rejasi",
          zh: "审计并制定工作计划",
        },
        mul: 4,
        weeks: 3,
        scope: {
          work: {
            ru: "План работ с оценкой по часам и защита его перед вашей командой",
            en: "A work plan estimated in hours, presented to your team",
            uz: "Soatlar bo‘yicha baholangan ish rejasi va uni jamoangiz oldida himoya qilish",
            zh: "按工时估算的工作计划，并向你的团队讲解",
          },
        },
      },
    ],
  },
  {
    id: "hours",
    kind: "counter",
    appliesTo: ["support", "integration"],
    label: {
      ru: "Часы разработки после аудита",
      en: "Development hours after the review",
      uz: "Auditdan keyingi ishlab chiqish soatlari",
      zh: "审计后的开发工时",
    },
    hint: {
      ru: "Блоками по восемь часов. Неизрасходованные не сгорают",
      en: "In eight-hour blocks. Unused hours do not expire",
      uz: "Sakkiz soatlik bloklar bilan. Sarflanmaganlari yonmaydi",
      zh: "以八小时为单位。未使用的工时不作废",
    },
    max: 20,
    unitLabel: { ru: "блок 8 ч", en: "8 h block", uz: "8 soatlik blok", zh: "个 8 小时包" },
    unitUzs: 1_400_000,
    unitWeeks: 0.3,
    scope: {
      work: {
        ru: "Доработка по согласованному плану с отчётом по каждому блоку",
        en: "Development against the agreed plan, with a report per block",
        uz: "Kelishilgan reja bo‘yicha ishlash, har bir blok bo‘yicha hisobot bilan",
        zh: "按既定计划开发，每个工时包附交付报告",
      },
    },
  },
  {
    id: "urgency",
    kind: "choice",
    appliesTo: ALL,
    label: { ru: "Сроки", en: "Timeline", uz: "Muddatlar", zh: "交付节奏" },
    choices: [
      {
        id: "normal",
        label: { ru: "Обычные", en: "Standard", uz: "Odatiy", zh: "常规" },
        mul: 1,
      },
      {
        id: "rush",
        label: {
          ru: "Ускоренные",
          en: "Accelerated",
          uz: "Tezlashtirilgan",
          zh: "加急",
        },
        mul: 1.3,
        scope: {
          work: {
            ru: "Выделенная команда и параллельные спринты вместо последовательных",
            en: "A dedicated team and parallel sprints instead of sequential ones",
            uz: "Ketma-ket emas, parallel sprintlar va ajratilgan jamoa",
            zh: "专属团队并以并行迭代替代串行推进",
          },
        },
      },
    ],
  },
  {
    id: "support_plan",
    kind: "choice",
    appliesTo: ALL,
    label: {
      ru: "Поддержка после запуска",
      en: "Support after launch",
      uz: "Ishga tushirgandan keyin qo‘llab-quvvatlash",
      zh: "上线后的维护",
    },
    choices: [
      { id: "none", label: { ru: "Не нужна", en: "Not needed", uz: "Kerak emas", zh: "不需要" }, mul: 1 },
      {
        id: "m3",
        label: { ru: "Три месяца", en: "Three months", uz: "Uch oy", zh: "三个月" },
        mul: 1.12,
        scope: {
          work: {
            ru: "Три месяца правок, мониторинга и обновлений",
            en: "Three months of fixes, monitoring and updates",
            uz: "Uch oy tuzatishlar, monitoring va yangilanishlar",
            zh: "三个月的修复、监控与更新",
          },
        },
      },
      {
        id: "m12",
        label: { ru: "Год", en: "A year", uz: "Bir yil", zh: "一年" },
        mul: 1.28,
        scope: {
          work: {
            ru: "Год поддержки: правки, мониторинг, обновления зависимостей",
            en: "A year of support: fixes, monitoring, dependency updates",
            uz: "Bir yillik qo‘llab-quvvatlash: tuzatishlar, monitoring, bog‘liqliklarni yangilash",
            zh: "一年维护：修复、监控与依赖更新",
          },
        },
      },
    ],
  },
];

export function optionsFor(slug: string): CalcOption[] {
  return options.filter((option) => option.appliesTo.includes(slug));
}
