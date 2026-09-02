import type { Locale } from "@/lib/i18n";

/**
 * Строки интерфейса. Русская версия — эталон формы: тип `Dictionary`
 * выводится из неё, поэтому пропущенный ключ в любой другой локали
 * не соберётся.
 */
const ru = {
  nav: {
    services: "Услуги",
    calculator: "Калькулятор",
    cases: "Кейсы",
    process: "Процесс",
    about: "О студии",
    contacts: "Контакты",
  },
  cta: {
    discuss: "Обсудить проект",
    calculate: "Рассчитать проект",
    seeCases: "Смотреть кейсы",
    allCases: "Все кейсы",
    readMore: "Подробнее",
    backHome: "На главную",
    writeUs: "Написать нам",
  },
  hero: {
    eyebrow: "Разработка полного цикла · Ташкент",
    titleLead: "Мы пишем код,",
    titleAccent: "который приносит деньги",
    lead: "Сайты, мобильные приложения, AI-продукты на LLM и RAG, маркетплейсы и сервисы доставки. Для бизнеса Узбекистана — на русском, узбекском, английском и китайском.",
    scroll: "Листайте вниз",
  },
  build: {
    file: "devuz-studio · build",
    compiling: "сборка…",
    passed: "сборка прошла",
    success: "Compiled successfully",
    successNote: "все блоки встали на места",
    errors: "0 ошибок · 0 предупреждений",
  },
  services: {
    kicker: "что мы делаем",
    title: "Пять направлений",
    description:
      "От сайта, который собирается за три недели, до маркетплейса с интеграциями в кассовые системы и трекингом курьеров на карте.",
    from: "от",
    weeks: "недель",
    stack: "Стек",
    included: "Что входит",
  },
  cases: {
    kicker: "кейсы",
    title: "Проекты в продакшене",
    description:
      "Это не рендеры и не концепты. Каждый проект ниже — работающий код, который мы писали и поддерживаем.",
    liveSite: "Открыть сайт",
    challenge: "Задача",
    tech: "Технологии",
    year: "Год",
  },
  /**
   * Блок «этот сайт» на главной. Сайт студии — единственный наш проект,
   * который посетитель может потрогать прямо сейчас, поэтому на главной он
   * показан не карточкой в общей сетке, а отдельным блоком с живым
   * предпросмотром.
   */
  devuz: {
    kicker: "этот сайт",
    title: "Один наш проект вы уже открыли",
    description:
      "Сайт, на котором вы сейчас, мы сделали себе сами — и по нему проще всего проверить, как мы работаем: четыре языка, сцена сборки кода в герое, калькулятор и AI-менеджер, который разбирается в задаче до того, как за неё возьмётся человек.",
    previewLabel: "живой предпросмотр",
    previewNote:
      "Язык в предпросмотре переключается сам. Посетителю он подбирается по браузеру и запоминается до следующего визита.",
    demoAsk: "Нужен сайт для экспорта сухофруктов. Сколько это будет стоить?",
    demoReply: "Покажу похожий проект и посчитаю вилку — минуту.",
    points: [
      { title: "Четыре языка", text: "ru · en · uz · zh с hreflang и своей обложкой для каждого языка." },
      { title: "AI-менеджер первой линии", text: "Отвечает за 20 секунд, разбирает задачу по ICP и BANT и передаёт менеджеру готовое резюме." },
      { title: "Анимация без библиотек", text: "Сцена сборки, дождь кода и появление блоков — CSS и один IntersectionObserver." },
    ],
    openCase: "Как устроен этот сайт",
  },
  process: {
    kicker: "как мы работаем",
    title: "Шесть шагов до релиза",
    description:
      "Прозрачный процесс без сюрпризов в конце: вы видите результат каждую неделю, а не один раз на приёмке.",
    steps: [
      { title: "Разговор", text: "Первым отвечает AI-менеджер — круглосуточно и на вашем языке. Он выясняет задачу, бюджет и сроки, и передаёт живому менеджеру уже готовое резюме." },
      { title: "Оценка", text: "Разбираем задачу на части, показываем вилку по срокам и стоимости и объясняем, из чего она складывается." },
      { title: "Прототип", text: "Кликабельный прототип ключевых экранов до того, как написана первая строка боевого кода." },
      { title: "Разработка", text: "Спринты по неделе. В конце каждого — работающий стенд, который можно открыть и потрогать." },
      { title: "Запуск", text: "Деплой, домен, SSL, аналитика, индексация в Google и Яндексе, обучение вашей команды." },
      { title: "Поддержка", text: "Остаёмся на связи: правки, мониторинг, новые фичи. Код и доступы — ваши с первого дня." },
    ],
  },
  stack: {
    kicker: "технологии",
    title: "На чём собираем",
  },
  faq: {
    kicker: "вопросы",
    title: "Отвечаем заранее",
    items: [
      { q: "Сколько стоит разработка сайта в Ташкенте?", a: "Разработка сайта в Ташкенте у DevUz Studio начинается от 2 500 $ за корпоративный сайт или лендинг, от 8 000 $ за мобильное приложение и от 15 000 $ за маркетплейс. Цена зависит от четырёх вещей: количества языков, числа ролей пользователей, глубины интеграций со сторонними системами и того, нужен ли отдельный дизайн или подойдёт адаптация готовой сетки. Сайт на четырёх языках с админкой обойдётся дороже одноязычного лендинга примерно в полтора раза. Точную цифру мы называем после разбора задачи: до него любая цена будет выдумкой, а выдуманная смета всегда заканчивается доплатами. Посчитать вилку самостоятельно можно калькулятором на сайте — он покажет диапазон в сумах и срок в неделях за минуту, без разговора с менеджером." },
      { q: "Сколько времени занимает разработка сайта или приложения?", a: "Корпоративный сайт или лендинг DevUz Studio собирает за 3–8 недель, мобильное приложение на Flutter — за 6–14 недель, маркетплейс или сервис доставки — за 10–20 недель. Отсчёт идёт с момента, когда согласован объём работ и получены доступы, а не с первого письма. На срок сильнее всего влияют три фактора: готовность контента со стороны заказчика, количество внешних интеграций и скорость согласований внутри компании. Проект на четыре языка добавляет к сроку примерно 15% — переводы и проверка вёрстки на каждом языке занимают время. Мы работаем недельными итерациями: каждую пятницу заказчик видит работающую сборку на тестовом домене, а не отчёт о проделанной работе." },
      { q: "Что входит в разработку сайта под ключ?", a: "Под ключ у DevUz Studio означает, что заказчик получает работающий сайт, а не набор файлов. В объём входят: дизайн под ваш бренд, вёрстка и программирование, админка, где контент правит менеджер без разработчика, мультиязычность с hreflang-разметкой, техническое SEO — sitemap, Schema.org, скорость в зелёной зоне Core Web Vitals, подключение домена и SSL, настройка аналитики и перенос существующего контента. Отдельно оплачиваются только хостинг и покупка домена — обычно 5–15 $ в месяц. После запуска действует месяц бесплатной поддержки: правим то, что всплыло на боевом трафике. Исходный код передаётся заказчику полностью, включая репозиторий и историю коммитов." },
      { q: "Сколько стоит внедрение ИИ в бизнес?", a: "Внедрение ИИ в бизнес в DevUz Studio начинается от 4 000 $ и занимает 4–10 недель. За эти деньги получается работающий продукт, а не эксперимент: чаще всего это ассистент первой линии, который отвечает клиентам круглосуточно, разбирается в задаче и передаёт менеджеру готовую сводку, либо поиск по базе знаний компании на технологии RAG. Стоимость складывается из объёма данных, которые нужно подготовить, количества интеграций с вашими системами и того, нужна ли дообученная модель или достаточно готовой. Отдельная статья — расходы на сами запросы к модели: для среднего потока обращений это 30–150 $ в месяц. Окупаемость мы считаем до старта: если по цифрам не сходится, честно об этом говорим." },
      { q: "Сколько стоит разработка маркетплейса под ключ?", a: "Разработка маркетплейса под ключ в DevUz Studio стоит от 15 000 $ и занимает 10–20 недель. В базовый объём входят витрина с поиском и фильтрами, кабинет продавца с загрузкой товаров и статистикой, корзина и оформление заказа, приём онлайн-платежей через местные шлюзы, админка модерации и базовая аналитика. Сервис доставки добавляет приложение курьера, распределение заказов и трекинг на карте — это ещё 4 000–8 000 $. Интеграция с кассовыми системами и 1С считается отдельно, обычно от 2 000 $. Самый частый способ сэкономить — запустить первую версию только с ключевым сценарием и добавлять остальное на живом трафике: так первые продажи приходят на два-три месяца раньше." },
      { q: "Кому принадлежит код после разработки?", a: "Весь исходный код проекта принадлежит заказчику с момента полной оплаты — это зафиксировано в договоре. DevUz Studio передаёт репозиторий с полной историей коммитов, документацию по развёртыванию и все доступы: к серверу, домену, базе данных и сторонним сервисам. Никаких закрытых частей, лицензионных отчислений или зависимости от нашей инфраструктуры в проектах нет. Мы пишем на открытом стеке — Next.js, PostgreSQL, Flutter, — поэтому поддерживать проект дальше может любая команда, а не только мы. Это осознанная позиция: подрядчик, который держит клиента технической зависимостью, зарабатывает на несвободе, а не на качестве работы." },
      { q: "Работаете ли вы с клиентами за пределами Узбекистана?", a: "Да. DevUz Studio базируется в Ташкенте, но работает с клиентами из Узбекистана, Казахстана и России, а также с компаниями, которые продают на экспорт. Сайт и общение идут на четырёх языках — русском, узбекском, английском и китайском, — поэтому языкового барьера не возникает ни с местным бизнесом, ни с международными покупателями. Несколько проектов в портфолио сделаны именно под экспорт и внешние рынки. Работаем удалённо: созвоны, недельные демонстрации на тестовом домене, переписка в удобном для заказчика мессенджере. Оплата возможна переводом на счёт ИП в Узбекистане или по договору с юридическим лицом." },
      { q: "Кто отвечает в чате на сайте?", a: "В чате на сайте DevUz Studio первым отвечает AI-менеджер — первая линия общения на кастомной LLM-сборке студии. Он работает круглосуточно и на языке посетителя: русском, узбекском, английском или китайском. Его задача не продать, а разобраться в задаче: он задаёт уточняющие вопросы, подсказывает, с чего начать, и передаёт живому менеджеру всё, что вы рассказали, вместе с номером заявки. Повторять свою историю человеку не придётся. Финальные цены и скидки называет только человек — это принципиально, потому что цена зависит от деталей, которые видит специалист. Если хотите продолжить разговор в Telegram, чат перенесёт переписку туда: диалог продолжится с того же места." },
      { q: "Как работает гарантия ответа за 20 секунд?", a: "Первый ответ в чате на сайте DevUz Studio приходит за 20 секунд, в любое время суток. Если ответа за это время нет, чат сам показывает, что скидка 30% на проект уже за вами — просить и доказывать ничего не нужно, счётчик виден прямо в окне чата. Скидка действует на первый проект и учитывается менеджером при расчёте сметы. Отсчёт идёт с момента, когда вы нажали «Отправить», то есть меряется то ожидание, которое видите вы, а не время работы сервера. Смысл гарантии простой: в разработке принято отвечать на заявку через день, и мы считаем это главной причиной, по которой клиенты уходят к тем, кто ответил первым." },
      { q: "Можно ли доработать проект, который писали не вы?", a: "Да, это отдельная услуга DevUz Studio. Начинаем всегда с аудита: разбираем архитектуру, читаем код, оцениваем качество и риски, проверяем безопасность и составляем план работ с оценкой каждого пункта. Аудит стоит от 500 $ и занимает 3–7 дней — по его итогам становится понятно, что дешевле: доработать существующее или переписать заново. Иногда честный ответ именно второй, и мы его говорим. Самый крупный аудит в нашей практике охватывал 35 микросервисов. Берём проекты на любом стеке, но за поддержку кода без документации и тестов беремся только после аудита: чинить вслепую то, что писали другие, — способ потратить бюджет заказчика впустую." },
    ],
  },
  contact: {
    kicker: "ответим за 20 секунд",
    title: "Менеджер уже здесь и ждёт ваше сообщение",
    description:
      "Напишите в чат, что нужно сделать. Первый ответ приходит за 20 секунд, круглосуточно — не уложимся, дадим скидку 30% на проект. Разберёмся в задаче прямо в переписке и подскажем, с чего начать.",
    formTitle: "Или оставьте контакты",
    name: "Как вас зовут",
    contactField: "Телефон, Telegram или почта",
    message: "Коротко о задаче",
    submit: "Отправить",
    sending: "Отправляем…",
    sent: "Готово! Менеджер свяжется с вами в ближайшее время.",
    failed: "Не удалось отправить. Напишите нам в Telegram — так быстрее.",
    consent: "Отправляя форму, вы соглашаетесь на обработку персональных данных",
    consentLink: "политика конфиденциальности",
    noPhone: "Телефона у студии нет — пишите в Telegram или оставьте контакт в форме, ответим в том же канале.",
  },
  chat: {
    title: "Менеджер DevUz",
    subtitle: "уже здесь и ждёт ваше сообщение",
    online: "на связи",
    placeholder: "Напишите, что нужно сделать…",
    send: "Отправить",
    open: "Написать менеджеру",
    close: "Свернуть",
    greeting:
      "Здравствуйте! Расскажите своими словами, что нужно сделать — сайт, приложение, маркетплейс, AI-продукт. Отвечу сразу и подскажу, с чего начать.",
    thinking: "печатает…",
    error: "Что-то пошло не так. Попробуйте ещё раз или напишите нам в Telegram.",
    handoff: "Менеджер уже видит ваш запрос и напишет вам в ближайшее время.",
    undelivered:
      "Заявку принял, но уведомление менеджеру сейчас не проходит. Чтобы точно не потерялось — напишите нам напрямую в Telegram.",
    disabled: "Чат временно недоступен. Оставьте контакты в форме ниже — мы ответим.",
    consent: "Продолжая диалог, вы соглашаетесь на обработку персональных данных.",
    restart: "Начать заново",
    promise: "Ответ за 20 секунд · 24/7",
    promiseNote: "Не успеем — скидка 30% на проект",
    counting: "осталось {n} сек",
    discountWon:
      "Мы не уложились в 20 секунд — скидка 30% на проект ваша. Менеджер учтёт её в расчёте.",
    requestLabel: "Заявка",
    toTelegram: "Продолжить в Telegram",
    toTelegramNote: "Разговор продолжится с этого же места — заново рассказывать не придётся.",
  },
  /**
   * Заголовки и описания для поиска.
   *
   * Держатся отдельно от видимого текста намеренно. На странице заголовок
   * должен звучать по-человечески — «Пять направлений», «Посчитайте проект за
   * минуту»; в выдаче он должен совпадать с тем, что человек набрал в строке
   * поиска. Совмещать эти две работы в одной строке — значит сделать плохо обе.
   *
   * Формулировки взяты не из головы: это реальные автодополнения Google по
   * Узбекистану. Главный коммерческий модификатор там — «цены»/«narxi»,
   * поэтому он стоит в заголовках услуг и калькулятора, а не в подвале.
   */
  seo: {
    home: {
      title: "Разработка сайтов и приложений в Ташкенте — DevUz",
      description:
        "Студия полного цикла в Ташкенте: сайты, мобильные приложения, маркетплейсы, AI-продукты на LLM и RAG. Считаем стоимость онлайн, отвечаем за 20 секунд.",
    },
    services: {
      title: "Услуги: сайты, приложения, AI — Ташкент | DevUz",
      description:
        "Пять направлений: корпоративные сайты, мобильные приложения, AI-продукты, маркетплейсы и доставка, интеграции. Вилка цен и срок по каждому направлению.",
    },
    cases: {
      title: "Портфолио: сайты, приложения, маркетплейсы — DevUz",
      description:
        "Проекты в продакшене: сервис доставки, маркетплейс, AI-квалификация лидов, аренда техники. По каждому — задача, стек и результат.",
    },
    calculator: {
      title: "Стоимость разработки сайта в Ташкенте — калькулятор",
      description:
        "Посчитайте цену сайта, приложения или маркетплейса за минуту. Отметьте нужные опции — калькулятор покажет вилку «от» в сумах и срок в неделях.",
    },
    contact: {
      title: "Заказать разработку сайта в Ташкенте — DevUz",
      description:
        "Напишите в чат — ответим за 20 секунд, круглосуточно. Не успеем — скидка 30% на проект. Обсудим задачу, сроки и стоимость разработки.",
    },
    about: {
      title: "О студии DevUz — разработка в Ташкенте",
      description:
        "Кто мы, как работаем и на чём пишем. Команда из Ташкента: сайты, мобильные приложения, маркетплейсы и AI-продукты для бизнеса Узбекистана.",
    },
  },
  footer: {
    tagline: "Студия разработки полного цикла в Ташкенте",
    services: "Услуги",
    company: "Студия",
    contacts: "Контакты",
    rights: "Все права защищены",
    privacy: "Политика конфиденциальности",
    madeIn: "Сделано в Ташкенте",
  },
  about: {
    kicker: "о студии",
    title: "Небольшая команда, крупные проекты",
    lead: "DevUz Studio — студия полного цикла из Ташкента. Мы делаем продукты, а не макеты: от первого разговора до работающего сервиса с пользователями, платежами и поддержкой.",
    principlesTitle: "Как мы работаем",
    principles: [
      { title: "Код принадлежит вам", text: "Репозиторий и серверы оформляются на заказчика с первого дня. Мы не держим клиентов на замке." },
      { title: "Локальная специфика — не «потом»", text: "Payme, Click, Octobank, Eskiz, E-mehmon, узбекская латиница. Мы уже проходили это и знаем, где подводные камни." },
      { title: "Скорость важнее красоты", text: "Анимации не должны стоить вам позиций в поиске. Core Web Vitals проверяем на реальных телефонах, а не на макбуке разработчика." },
      { title: "Говорим прямо", text: "Если задача не решается в заявленный бюджет — скажем сразу, а не на третьем месяце разработки." },
    ],
  },
  notFound: {
    title: "Страница не найдена",
    text: "Кажется, такой страницы у нас нет. Возможно, ссылка устарела.",
  },
  calculator: {
    kicker: "калькулятор",
    title: "Посчитайте проект за минуту",
    description:
      "Выберите тип проекта и отметьте, что нужно. Калькулятор покажет вилку «от» и состав работ — тот же расчёт, который делает менеджер, только без ожидания.",
    chooseType: "Что делаем",
    configure: "Настройте под себя",
    result: "Предварительная оценка",
    from: "от",
    weeksLabel: "недель работы",
    techTitle: "Что получите технически",
    workTitle: "Какие работы входят",
    reset: "Сбросить",
    discuss: "Обсудить расчёт",
    handoff: "Расчёт подставлен в чат. Опишите детали — менеджер получит его вместе с вашим запросом.",
    disclaimer:
      "Это ориентир, а не коммерческое предложение. Точную цифру называем после разбора задачи: на реальном проекте всплывают требования, которых нет ни в одном калькуляторе.",
    none: "не нужно",
    included: "уже входит",
    prefill:
      "Здравствуйте! Посчитал проект в калькуляторе на сайте:",
  },
  language: "Язык",
  skipToContent: "Перейти к содержимому",
};

export type Dictionary = typeof ru;

const en: Dictionary = {
  nav: { services: "Services", calculator: "Calculator", cases: "Work", process: "Process", about: "Studio", contacts: "Contacts" },
  cta: {
    discuss: "Discuss a project",
    calculate: "Get an estimate",
    seeCases: "See our work",
    allCases: "All projects",
    readMore: "Read more",
    backHome: "Back home",
    writeUs: "Write to us",
  },
  hero: {
    eyebrow: "Full-cycle development · Tashkent",
    titleLead: "We write code",
    titleAccent: "that makes money",
    lead: "Websites, mobile apps, AI products built on LLM and RAG, marketplaces and delivery services. For businesses in Uzbekistan — in Russian, Uzbek, English and Chinese.",
    scroll: "Scroll down",
  },
  build: {
    file: "devuz-studio · build",
    compiling: "compiling…",
    passed: "build passed",
    success: "Compiled successfully",
    successNote: "every block fell into place",
    errors: "0 errors · 0 warnings",
  },
  services: {
    kicker: "what we do",
    title: "Five directions",
    description:
      "From a site that ships in three weeks to a marketplace with POS integrations and couriers tracked on a live map.",
    from: "from",
    weeks: "weeks",
    stack: "Stack",
    included: "What's included",
  },
  cases: {
    kicker: "work",
    title: "Projects in production",
    description:
      "Not renders, not concepts. Every project below is working code we wrote and still maintain.",
    liveSite: "Open the site",
    challenge: "The brief",
    tech: "Technology",
    year: "Year",
  },
  devuz: {
    kicker: "this site",
    title: "You already have one of our projects open",
    description:
      "The site you are on we built for ourselves — and it is the easiest way to check how we work: four languages, a code-assembly scene in the hero, a calculator, and an AI manager that works out the task before a human picks it up.",
    previewLabel: "live preview",
    previewNote:
      "The language in the preview switches on its own. A visitor gets theirs from the browser, and the choice is remembered until the next visit.",
    demoAsk: "We need a site for our dried-fruit export. What would it cost?",
    demoReply: "I'll show a similar project and give you a range — one minute.",
    points: [
      { title: "Four languages", text: "ru · en · uz · zh with hreflang and a cover image of its own for each." },
      { title: "AI manager on the first line", text: "Replies in 20 seconds, scores the task on ICP and BANT and hands the manager a finished summary." },
      { title: "Animation without libraries", text: "The assembly scene, the code rain and the block reveals — CSS and one IntersectionObserver." },
    ],
    openCase: "How this site is built",
  },
  process: {
    kicker: "how we work",
    title: "Six steps to release",
    description:
      "A transparent process with no surprises at the end: you see results every week, not once at handover.",
    steps: [
      { title: "The conversation", text: "An AI manager answers first — around the clock, in your language. It works out the task, the budget and the timeline, and hands a finished summary to a human manager." },
      { title: "The estimate", text: "We break the task into parts, show a range for time and cost, and explain what that range is made of." },
      { title: "The prototype", text: "A clickable prototype of the key screens before a single line of production code is written." },
      { title: "Development", text: "Weekly sprints. Each one ends with a working environment you can open and click through." },
      { title: "Launch", text: "Deployment, domain, SSL, analytics, indexing in Google and Yandex, and training for your team." },
      { title: "Support", text: "We stay reachable: fixes, monitoring, new features. The code and the access are yours from day one." },
    ],
  },
  stack: { kicker: "technology", title: "What we build with" },
  faq: {
    kicker: "questions",
    title: "Answered upfront",
    items: [
      { q: "How much does website development in Tashkent cost?", a: "Website development at DevUz Studio in Tashkent starts at $2,500 for a corporate site or landing page, $8,000 for a mobile app and $15,000 for a marketplace. The price depends on four things: how many languages you need, how many user roles the system has, how deep the integrations with third-party systems go, and whether you want original design or an adaptation of an existing grid. A four-language site with an admin panel costs roughly one and a half times more than a single-language landing page. We quote the exact figure after scoping the task — before that any number is a guess, and a guessed estimate always ends in surcharges. You can get a range yourself with the calculator on the site: it shows a starting price and a timeline in weeks in about a minute." },
      { q: "How long does it take to build a website or an app?", a: "DevUz Studio builds a corporate site or landing page in 3–8 weeks, a Flutter mobile app in 6–14 weeks, and a marketplace or delivery service in 10–20 weeks. The clock starts when scope is agreed and access is granted, not at the first email. Three things drive the timeline most: how ready your content is, how many external integrations are involved, and how fast approvals move inside your company. A four-language project adds roughly 15% — translation and layout checks in every language take time. We work in weekly iterations: every Friday you see a working build on a staging domain, not a progress report." },
      { q: "What is included in turnkey website development?", a: "Turnkey at DevUz Studio means you get a working website, not a folder of files. The scope includes design for your brand, front-end and back-end development, an admin panel where a manager edits content without a developer, multilingual support with hreflang markup, technical SEO — sitemap, Schema.org, Core Web Vitals in the green zone — domain and SSL setup, analytics, and migration of existing content. Only hosting and the domain are billed separately, typically $5–15 a month. After launch you get a month of free support for whatever surfaces under real traffic. The source code is handed over in full, including the repository and its commit history." },
      { q: "How much does AI implementation for business cost?", a: "AI implementation at DevUz Studio starts at $4,000 and takes 4–10 weeks. That budget buys a working product, not an experiment: most often a first-line assistant that answers customers around the clock, works out the task and hands a finished summary to a human manager, or a RAG-based search across the company knowledge base. The cost depends on how much data needs preparing, how many integrations with your systems are required, and whether a fine-tuned model is needed or an off-the-shelf one will do. Model usage is a separate line: for an average flow of enquiries that is $30–150 a month. We size the payback before the start — if the numbers do not work, we say so." },
      { q: "How much does turnkey marketplace development cost?", a: "Turnkey marketplace development at DevUz Studio costs from $15,000 and takes 10–20 weeks. The base scope covers a storefront with search and filters, a seller dashboard with product upload and statistics, cart and checkout, online payments through local gateways, a moderation panel and basic analytics. A delivery service adds a courier app, order dispatch and live map tracking — another $4,000–8,000. POS and 1C integrations are quoted separately, usually from $2,000. The most common way to save is to launch a first version with the core scenario only and add the rest on live traffic: first sales then arrive two or three months earlier." },
      { q: "Who owns the code after development?", a: "All source code belongs to the client from the moment of full payment — it is written into the contract. DevUz Studio hands over the repository with its full commit history, deployment documentation and every access credential: server, domain, database and third-party services. There are no closed parts, no licence fees and no dependency on our infrastructure. We build on an open stack — Next.js, PostgreSQL, Flutter — so any team can maintain the project afterwards, not only us. This is a deliberate position: a contractor who holds a client through technical dependency earns from that dependency rather than from the quality of the work." },
      { q: "Do you work with clients outside Uzbekistan?", a: "Yes. DevUz Studio is based in Tashkent and works with clients from Uzbekistan, Kazakhstan and Russia, as well as companies selling for export. The site and our communication run in four languages — Russian, Uzbek, English and Chinese — so there is no language barrier with local business or with international buyers. Several projects in the portfolio were built specifically for export and foreign markets. We work remotely: calls, weekly demos on a staging domain, and messaging in whatever channel suits you. Payment can be made to a sole-proprietor account in Uzbekistan or under a contract with a legal entity." },
      { q: "Who replies in the chat on the website?", a: "The first reply in the DevUz Studio chat comes from an AI manager — a first line of contact running on the studio's own custom LLM setup. It works around the clock and in the visitor's language: Russian, Uzbek, English or Chinese. Its job is not to sell but to understand the task: it asks follow-up questions, suggests where to start, and passes everything you said to a human manager along with a request number, so you never repeat yourself. Final prices and discounts are quoted by a person only — deliberately, because price depends on details a specialist sees. If you would rather continue on Telegram, the chat carries the conversation over and it picks up where it left off." },
      { q: "How does the 20-second reply guarantee work?", a: "The first reply in the DevUz Studio chat arrives within 20 seconds, at any hour. If it does not, the chat itself shows that a 30% discount on your project is already yours — nothing to ask for or prove, and the countdown is visible right in the chat window. The discount applies to your first project and the manager factors it into the quote. The clock starts when you press Send, so what is measured is the wait you actually experience, not server time. The reasoning is simple: in this industry a reply the next day is normal, and we think that is the main reason clients go to whoever answered first." },
      { q: "Can you take over a project someone else built?", a: "Yes, that is a separate DevUz Studio service. We always start with an audit: we go through the architecture, read the code, assess quality and risk, check security and produce a work plan with an estimate for each item. The audit costs from $500 and takes 3–7 days; by the end it is clear which is cheaper — extending what exists or rewriting it. Sometimes the honest answer is the second one, and we say so. The largest audit we have run covered 35 microservices. We take projects on any stack, but we only support undocumented, untested code after an audit: fixing someone else's work blind is a way to spend a client's budget for nothing." },
    ],
  },
  contact: {
    kicker: "we reply within 20 seconds",
    title: "A manager is already here, waiting for your message",
    description:
      "Write in the chat and tell us what you need built. The first reply arrives within 20 seconds, around the clock — if we miss it, you get 30% off your project. We'll work the task out right there and suggest where to start.",
    formTitle: "Or leave your contacts",
    name: "Your name",
    contactField: "Phone, Telegram or email",
    message: "A few words about the project",
    submit: "Send",
    sending: "Sending…",
    sent: "Done. A manager will get back to you shortly.",
    failed: "Sending failed. Message us on Telegram — that is faster.",
    consent: "By submitting the form you agree to the processing of personal data",
    consentLink: "privacy policy",
    noPhone: "The studio has no phone line — write on Telegram or leave a contact in the form, and we reply in the same channel.",
  },
  chat: {
    title: "DevUz manager",
    subtitle: "already here, waiting for your message",
    online: "online",
    placeholder: "Tell us what you need built…",
    send: "Send",
    open: "Message a manager",
    close: "Minimise",
    greeting:
      "Hello. Tell me in your own words what you need built — a website, an app, a marketplace, an AI product. I'll reply right away and suggest where to start.",
    thinking: "typing…",
    error: "Something went wrong. Try again, or message us on Telegram.",
    handoff: "A manager can already see your request and will write to you shortly.",
    undelivered:
      "I have your request, but the notification to the manager is not going through right now. To be safe, message us directly on Telegram.",
    disabled: "The chat is temporarily unavailable. Leave your contacts in the form below and we'll reply.",
    consent: "By continuing this conversation you agree to the processing of personal data.",
    restart: "Start over",
    promise: "Reply within 20 seconds · 24/7",
    promiseNote: "If we miss it — 30% off your project",
    counting: "{n} s left",
    discountWon:
      "We missed the 20 seconds — the 30% discount on your project is yours. The manager will apply it.",
    requestLabel: "Request",
    toTelegram: "Continue on Telegram",
    toTelegramNote: "The conversation picks up right where it left off — no need to explain again.",
  },
  seo: {
    home: {
      title: "Web & Mobile Development in Tashkent — DevUz",
      description:
        "Full-cycle development studio in Tashkent, Uzbekistan: websites, mobile apps, marketplaces, AI products on LLM and RAG. Online cost estimate, replies in 20 seconds.",
    },
    services: {
      title: "Services: Websites, Apps, AI — Tashkent | DevUz",
      description:
        "Five directions: corporate websites, mobile apps, AI products, marketplaces and delivery, integrations. Price range and timeline for each.",
    },
    cases: {
      title: "Portfolio: Websites, Apps, Marketplaces — DevUz",
      description:
        "Projects in production: a delivery service, a marketplace, AI lead qualification, equipment rental. Task, stack and outcome for each.",
    },
    calculator: {
      title: "Development Cost Calculator — Tashkent | DevUz",
      description:
        "Estimate the price of a website, app or marketplace in a minute. Pick the options you need and get a starting range and a timeline in weeks.",
    },
    contact: {
      title: "Hire a Development Studio in Tashkent — DevUz",
      description:
        "Write in the chat — we reply within 20 seconds, around the clock. If we miss it, you get 30% off. Let's discuss scope, timeline and cost.",
    },
    about: {
      title: "About DevUz — Development Studio in Tashkent",
      description:
        "Who we are, how we work and what we build with. A Tashkent team: websites, mobile apps, marketplaces and AI products for business in Uzbekistan.",
    },
  },
  footer: {
    tagline: "A full-cycle development studio in Tashkent",
    services: "Services",
    company: "Studio",
    contacts: "Contacts",
    rights: "All rights reserved",
    privacy: "Privacy policy",
    madeIn: "Made in Tashkent",
  },
  about: {
    kicker: "the studio",
    title: "A small team, large projects",
    lead: "DevUz Studio is a full-cycle studio based in Tashkent. We build products, not mockups: from the first conversation to a running service with real users, payments and support.",
    principlesTitle: "How we work",
    principles: [
      { title: "The code is yours", text: "The repository and the servers are registered to the client from day one. We don't keep clients locked in." },
      { title: "Local specifics aren't an afterthought", text: "Payme, Click, Octobank, Eskiz, E-mehmon, Uzbek Latin script. We've been through it and know where it bites." },
      { title: "Speed beats decoration", text: "Animation should never cost you search rankings. We check Core Web Vitals on real phones, not on a developer's laptop." },
      { title: "We say it straight", text: "If the brief doesn't fit the budget, you hear it immediately — not in the third month of development." },
    ],
  },
  notFound: { title: "Page not found", text: "We don't seem to have this page. The link may be out of date." },
  calculator: {
    kicker: "calculator",
    title: "Price your project in a minute",
    description:
      "Pick a project type and tick what you need. The calculator shows a «from» range and the scope of work — the same estimate a manager would make, without the wait.",
    chooseType: "What we build",
    configure: "Tailor it",
    result: "Preliminary estimate",
    from: "from",
    weeksLabel: "weeks of work",
    techTitle: "What you get technically",
    workTitle: "What the work covers",
    reset: "Reset",
    discuss: "Discuss this estimate",
    handoff: "The estimate is loaded into the chat. Add the details and the manager will receive it with your request.",
    disclaimer:
      "This is a guide, not a quote. We give an exact figure after going through the brief: real projects surface requirements no calculator has.",
    none: "not needed",
    included: "already included",
    prefill: "Hello. I priced a project with the calculator on your site:",
  },
  language: "Language",
  skipToContent: "Skip to content",
};

const uz: Dictionary = {
  nav: { services: "Xizmatlar", calculator: "Kalkulyator", cases: "Loyihalar", process: "Jarayon", about: "Studiya", contacts: "Aloqa" },
  cta: {
    discuss: "Loyihani muhokama qilish",
    calculate: "Loyihani hisoblash",
    seeCases: "Loyihalarni ko‘rish",
    allCases: "Barcha loyihalar",
    readMore: "Batafsil",
    backHome: "Bosh sahifaga",
    writeUs: "Bizga yozing",
  },
  hero: {
    eyebrow: "To‘liq siklli ishlab chiqish · Toshkent",
    titleLead: "Biz kod yozamiz,",
    titleAccent: "u pul keltiradi",
    lead: "Saytlar, mobil ilovalar, LLM va RAG asosidagi AI mahsulotlar, marketpleyslar va yetkazib berish xizmatlari. O‘zbekiston biznesi uchun — rus, o‘zbek, ingliz va xitoy tillarida.",
    scroll: "Pastga suring",
  },
  build: {
    file: "devuz-studio · build",
    compiling: "yig‘ilmoqda…",
    passed: "yig‘ish o‘tdi",
    success: "Compiled successfully",
    successNote: "barcha bloklar o‘z o‘rniga tushdi",
    errors: "0 xato · 0 ogohlantirish",
  },
  services: {
    kicker: "biz nima qilamiz",
    title: "Beshta yo‘nalish",
    description:
      "Uch haftada yig‘iladigan saytdan tortib, kassa tizimlariga integratsiya va xaritada kuryer kuzatuvi bilan marketpleysgacha.",
    from: "dan",
    weeks: "hafta",
    stack: "Stek",
    included: "Nimalar kiradi",
  },
  cases: {
    kicker: "loyihalar",
    title: "Ishlab turgan loyihalar",
    description:
      "Bu render ham, konsept ham emas. Quyidagi har bir loyiha — biz yozgan va qo‘llab-quvvatlayotgan ishlaydigan kod.",
    liveSite: "Saytni ochish",
    challenge: "Vazifa",
    tech: "Texnologiyalar",
    year: "Yil",
  },
  devuz: {
    kicker: "shu sayt",
    title: "Bitta loyihamizni siz allaqachon ochgansiz",
    description:
      "Siz turgan saytni biz o‘zimiz uchun qildik — va u qanday ishlashimizni tekshirishning eng oson yo‘li: to‘rt til, hero’dagi kod yig‘ilish sahnasi, kalkulyator va vazifani odam qo‘lga olishidan oldin tushunib oladigan AI menejer.",
    previewLabel: "jonli ko‘rinish",
    previewNote:
      "Ko‘rinishdagi til o‘zi almashadi. Tashrifchiga u brauzer bo‘yicha tanlanadi va keyingi tashrifgacha eslab qolinadi.",
    demoAsk: "Quritilgan meva eksporti uchun sayt kerak. Bu qancha turadi?",
    demoReply: "O‘xshash loyihani ko‘rsatib, narx oralig‘ini aytaman — bir daqiqa.",
    points: [
      { title: "To‘rt til", text: "ru · en · uz · zh — hreflang bilan va har biriga alohida muqova." },
      { title: "Birinchi liniyadagi AI menejer", text: "20 soniyada javob beradi, vazifani ICP va BANT bo‘yicha baholaydi va menejerga tayyor xulosani uzatadi." },
      { title: "Kutubxonasiz animatsiya", text: "Yig‘ilish sahnasi, kod yomg‘iri va bloklarning paydo bo‘lishi — CSS va bitta IntersectionObserver." },
    ],
    openCase: "Bu sayt qanday qurilgan",
  },
  process: {
    kicker: "qanday ishlaymiz",
    title: "Relizgacha olti qadam",
    description:
      "Oxirida kutilmagan hodisalarsiz shaffof jarayon: natijani qabul qilishda bir marta emas, har hafta ko‘rasiz.",
    steps: [
      { title: "Suhbat", text: "Birinchi bo‘lib AI-menejer javob beradi — kunu tun va sizning tilingizda. U vazifa, byudjet va muddatlarni aniqlaydi va tirik menejerga tayyor xulosani uzatadi." },
      { title: "Baholash", text: "Vazifani qismlarga ajratamiz, muddat va narx bo‘yicha oraliqni ko‘rsatamiz va u nimalardan tashkil topganini tushuntiramiz." },
      { title: "Prototip", text: "Jangovar kodning birinchi qatori yozilishidan oldin asosiy ekranlarning bosiladigan prototipi." },
      { title: "Ishlab chiqish", text: "Haftalik sprintlar. Har birining oxirida ochib ko‘rish mumkin bo‘lgan ishlaydigan stend." },
      { title: "Ishga tushirish", text: "Deploy, domen, SSL, tahlil, Google va Yandeks’da indekslash, jamoangizni o‘qitish." },
      { title: "Qo‘llab-quvvatlash", text: "Aloqada qolamiz: tuzatishlar, monitoring, yangi imkoniyatlar. Kod va kirish huquqlari birinchi kundan siznikidir." },
    ],
  },
  stack: { kicker: "texnologiyalar", title: "Nima asosida quramiz" },
  faq: {
    kicker: "savollar",
    title: "Oldindan javob beramiz",
    items: [
      { q: "Toshkentda sayt yaratish qancha turadi?", a: "DevUz Studio’da Toshkentda sayt yaratish korporativ sayt yoki lending uchun 2 500 $ dan, mobil ilova uchun 8 000 $ dan, marketpleys uchun 15 000 $ dan boshlanadi. Narx to‘rt narsaga bog‘liq: tillar soni, foydalanuvchi rollari soni, tashqi tizimlar bilan integratsiya chuqurligi va alohida dizayn kerakmi yoki tayyor setkani moslash yetarlimi. To‘rt tilli, admin paneli bo‘lgan sayt bir tilli lendingdan taxminan bir yarim baravar qimmatroq chiqadi. Aniq raqamni vazifani tahlil qilgandan keyin aytamiz: undan oldin har qanday narx taxmin bo‘ladi, taxminiy smeta esa doim qo‘shimcha to‘lovlar bilan tugaydi. Vilkani o‘zingiz saytdagi kalkulyator orqali hisoblashingiz mumkin — u bir daqiqada so‘mdagi diapazonni va haftadagi muddatni ko‘rsatadi." },
      { q: "Sayt yoki ilova yaratish qancha vaqt oladi?", a: "DevUz Studio korporativ sayt yoki lendingni 3–8 haftada, Flutter’dagi mobil ilovani 6–14 haftada, marketpleys yoki yetkazib berish servisini 10–20 haftada yig‘adi. Hisob birinchi xatdan emas, ish hajmi kelishilgan va kirish huquqlari olingan paytdan boshlanadi. Muddatga eng ko‘p uch narsa ta’sir qiladi: buyurtmachi tomonidagi kontent tayyorligi, tashqi integratsiyalar soni va kompaniya ichidagi kelishuvlar tezligi. To‘rt tilli loyiha muddatga taxminan 15% qo‘shadi — tarjima va har bir tilda verstkani tekshirish vaqt oladi. Biz haftalik iteratsiyalarda ishlaymiz: har juma buyurtmachi test domenida ishlayotgan yig‘mani ko‘radi, bajarilgan ish haqidagi hisobotni emas." },
      { q: "Kalit topshirish sharti bilan sayt yaratishga nima kiradi?", a: "DevUz Studio’da kalit topshirish sharti buyurtmachi fayllar to‘plamini emas, ishlayotgan saytni olishini bildiradi. Hajmga quyidagilar kiradi: brendingiz uchun dizayn, verstka va dasturlash, menejer dasturchisiz kontent tahrirlaydigan admin panel, hreflang bilan ko‘p tillilik, texnik SEO — sitemap, Schema.org, Core Web Vitals yashil zonada, domen va SSL ulash, analitika sozlash va mavjud kontentni ko‘chirish. Alohida faqat hosting va domen to‘lanadi — odatda oyiga 5–15 $. Ishga tushgandan keyin bir oy bepul qo‘llab-quvvatlash amal qiladi. Manba kodi to‘liq, repozitoriy va kommitlar tarixi bilan topshiriladi." },
      { q: "Biznesga AI joriy etish qancha turadi?", a: "DevUz Studio’da biznesga AI joriy etish 4 000 $ dan boshlanadi va 4–10 hafta oladi. Bu pulga tajriba emas, ishlaydigan mahsulot chiqadi: ko‘pincha bu mijozlarga kunu tun javob beradigan, vazifani tushunadigan va menejerga tayyor xulosani uzatadigan birinchi liniya yordamchisi yoki RAG texnologiyasida kompaniya bilimlar bazasi bo‘yicha qidiruv. Narx tayyorlanishi kerak bo‘lgan ma’lumot hajmiga, tizimlaringiz bilan integratsiyalar soniga va tayyor model yetarlimi yoki qo‘shimcha o‘qitilgani kerakmi — shunga bog‘liq. Modelga so‘rovlar alohida xarajat: o‘rtacha oqim uchun bu oyiga 30–150 $. Qoplanishni boshlashdan oldin hisoblaymiz." },
      { q: "Marketpleys yaratish kalit topshirish bilan qancha turadi?", a: "DevUz Studio’da marketpleysni kalit topshirish sharti bilan yaratish 15 000 $ dan turadi va 10–20 hafta oladi. Asosiy hajmga qidiruv va filtrlar bilan vitrina, tovar yuklash va statistikasi bo‘lgan sotuvchi kabineti, savat va buyurtma rasmiylashtirish, mahalliy shlyuzlar orqali onlayn to‘lov, moderatsiya paneli va bazaviy analitika kiradi. Yetkazib berish servisi kuryer ilovasi, buyurtmalarni taqsimlash va xaritada kuzatuvni qo‘shadi — bu yana 4 000–8 000 $. Kassa tizimlari va 1C bilan integratsiya alohida, odatda 2 000 $ dan hisoblanadi. Tejashning eng keng tarqalgan usuli — birinchi versiyani faqat asosiy stsenariy bilan ishga tushirish." },
      { q: "Ishlab chiqilgandan keyin kod kimga tegishli?", a: "Loyihaning butun manba kodi to‘liq to‘lov qilingan paytdan buyurtmachiga tegishli — bu shartnomada qayd etilgan. DevUz Studio kommitlar tarixi bilan repozitoriyni, joylashtirish bo‘yicha hujjatlarni va barcha kirish huquqlarini topshiradi: server, domen, ma’lumotlar bazasi va tashqi servislar. Yopiq qismlar, litsenziya to‘lovlari yoki bizning infratuzilmamizga bog‘liqlik yo‘q. Biz ochiq stekda yozamiz — Next.js, PostgreSQL, Flutter — shuning uchun loyihani keyin faqat biz emas, istalgan jamoa qo‘llab-quvvatlashi mumkin. Bu ongli pozitsiya: mijozni texnik bog‘liqlik bilan ushlab turadigan pudratchi ish sifatidan emas, erksizlikdan daromad qiladi." },
      { q: "O‘zbekistondan tashqaridagi mijozlar bilan ishlaysizmi?", a: "Ha. DevUz Studio Toshkentda joylashgan, lekin O‘zbekiston, Qozog‘iston va Rossiya mijozlari bilan, shuningdek eksportga sotadigan kompaniyalar bilan ishlaydi. Sayt va muloqot to‘rt tilda boradi — rus, o‘zbek, ingliz va xitoy — shuning uchun na mahalliy biznes bilan, na xalqaro xaridorlar bilan til to‘sig‘i yuzaga kelmaydi. Portfoliodagi bir nechta loyiha aynan eksport va tashqi bozorlar uchun qilingan. Masofadan ishlaymiz: qo‘ng‘iroqlar, test domenida haftalik namoyishlar, buyurtmachiga qulay messenjerdagi yozishmalar. To‘lov O‘zbekistondagi YaTT hisobiga o‘tkazma yoki yuridik shaxs bilan shartnoma orqali mumkin." },
      { q: "Saytdagi chatda kim javob beradi?", a: "DevUz Studio saytidagi chatda birinchi bo‘lib AI-menejer javob beradi — studiyaning maxsus LLM yig‘masidagi muloqotning birinchi liniyasi. U kunu tun va tashrif buyuruvchining tilida ishlaydi: rus, o‘zbek, ingliz yoki xitoy. Uning vazifasi sotish emas, vazifani tushunish: aniqlashtiruvchi savollar beradi, nimadan boshlashni maslahat beradi va aytganlaringizni ariza raqami bilan tirik menejerga uzatadi. O‘z hikoyangizni qaytadan aytishga to‘g‘ri kelmaydi. Yakuniy narxlar va chegirmalarni faqat inson aytadi. Telegramda davom etishni istasangiz, chat yozishmani o‘sha joydan davom ettiradi." },
      { q: "20 soniya kafolati qanday ishlaydi?", a: "DevUz Studio saytidagi chatda birinchi javob 20 soniyada keladi, kunning istalgan vaqtida. Agar javob bo‘lmasa, chatning o‘zi loyihaga 30% chegirma sizniki ekanini ko‘rsatadi — so‘rash va isbotlash shart emas, sanoq chat oynasida ko‘rinib turadi. Chegirma birinchi loyihaga amal qiladi va menejer uni smetada hisobga oladi. Sanoq siz «Yuborish» tugmasini bosgan paytdan boshlanadi, ya’ni server vaqti emas, siz ko‘rgan kutish o‘lchanadi. Kafolatning ma’nosi oddiy: bu sohada arizaga ertasi kuni javob berish odat, va biz mijozlar birinchi javob berganga ketishining asosiy sababi shu deb hisoblaymiz." },
      { q: "Boshqalar yozgan loyihani takomillashtirsa bo‘ladimi?", a: "Ha, bu DevUz Studio’ning alohida xizmati. Har doim auditdan boshlaymiz: arxitekturani tahlil qilamiz, kodni o‘qiymiz, sifat va risklarni baholaymiz, xavfsizlikni tekshiramiz va har bir band bo‘yicha baho bilan ish rejasini tuzamiz. Audit 500 $ dan turadi va 3–7 kun oladi — natijasida nima arzonroq ekani ayon bo‘ladi: mavjudini takomillashtirishmi yoki qaytadan yozishmi. Ba’zan halol javob ikkinchisi bo‘ladi va biz buni aytamiz. Amaliyotimizdagi eng yirik audit 35 ta mikroservisni qamragan. Istalgan stekdagi loyihalarni olamiz, lekin hujjatsiz va testsiz kodni faqat auditdan keyin qo‘llab-quvvatlaymiz." },
    ],
  },
  contact: {
    kicker: "20 soniyada javob beramiz",
    title: "Menejer shu yerda va xabaringizni kutmoqda",
    description:
      "Chatga nima kerakligini yozing. Birinchi javob 20 soniyada keladi, kunu tun — ulgurmasak, loyihaga 30% chegirma beramiz. Vazifani shu yozishmada tushunib olamiz va nimadan boshlashni maslahat beramiz.",
    formTitle: "Yoki kontaktlaringizni qoldiring",
    name: "Ismingiz",
    contactField: "Telefon, Telegram yoki pochta",
    message: "Vazifa haqida qisqacha",
    submit: "Yuborish",
    sending: "Yuborilmoqda…",
    sent: "Tayyor! Menejer yaqin orada siz bilan bog‘lanadi.",
    failed: "Yuborib bo‘lmadi. Bizga Telegram’da yozing — bu tezroq.",
    consent: "Formani yuborish orqali shaxsiy ma’lumotlarni qayta ishlashga rozilik bildirasiz",
    consentLink: "maxfiylik siyosati",
    noPhone: "Studiyaning telefoni yo‘q — Telegramga yozing yoki formada kontakt qoldiring, o‘sha kanalda javob beramiz.",
  },
  chat: {
    title: "DevUz menejeri",
    subtitle: "shu yerda, xabaringizni kutmoqda",
    online: "aloqada",
    placeholder: "Nima kerakligini yozing…",
    send: "Yuborish",
    open: "Menejerga yozish",
    close: "Yig‘ish",
    greeting:
      "Assalomu alaykum! O‘z so‘zlaringiz bilan nima kerakligini ayting — sayt, ilova, marketpleys, AI-mahsulot. Darrov javob beraman va nimadan boshlashni maslahat beraman.",
    thinking: "yozmoqda…",
    error: "Nimadir noto‘g‘ri ketdi. Qaytadan urinib ko‘ring yoki bizga Telegram’da yozing.",
    handoff: "Menejer so‘rovingizni ko‘rib turibdi va yaqin orada sizga yozadi.",
    undelivered:
      "Arizani qabul qildim, lekin menejerga bildirishnoma hozir o‘tmayapti. Yo‘qolib qolmasligi uchun bizga to‘g‘ridan-to‘g‘ri Telegramda yozing.",
    disabled: "Chat vaqtincha ishlamayapti. Quyidagi formada kontaktlaringizni qoldiring — javob beramiz.",
    consent: "Suhbatni davom ettirish orqali shaxsiy ma’lumotlarni qayta ishlashga rozilik bildirasiz.",
    restart: "Qaytadan boshlash",
    promise: "20 soniyada javob · 24/7",
    promiseNote: "Ulgurmasak — loyihaga 30% chegirma",
    counting: "{n} soniya qoldi",
    discountWon:
      "20 soniyaga ulgurmadik — loyihaga 30% chegirma sizniki. Menejer buni hisobga oladi.",
    requestLabel: "Ariza",
    toTelegram: "Telegramda davom etish",
    toTelegramNote: "Suhbat aynan shu joydan davom etadi — qaytadan tushuntirish shart emas.",
  },
  seo: {
    home: {
      title: "Toshkentda sayt va ilova yaratish — DevUz",
      description:
        "Toshkentdagi to‘liq tsiklli studiya: saytlar, mobil ilovalar, marketpleyslar, LLM va RAG asosidagi AI-mahsulotlar. Narxni onlayn hisoblaymiz, 20 soniyada javob beramiz.",
    },
    services: {
      title: "Xizmatlar: sayt, ilova, AI — Toshkent | DevUz",
      description:
        "Besh yo‘nalish: korporativ saytlar, mobil ilovalar, AI-mahsulotlar, marketpleys va yetkazib berish, integratsiyalar. Har biri uchun narx va muddat.",
    },
    cases: {
      title: "Portfolio: saytlar va ilovalar — DevUz Studio",
      description:
        "Ishlayotgan loyihalar: yetkazib berish servisi, marketpleys, AI-kvalifikatsiya, texnika ijarasi. Har biri bo‘yicha vazifa, stek va natija.",
    },
    calculator: {
      title: "Sayt yaratish narxi — onlayn kalkulyator | DevUz",
      description:
        "Sayt, ilova yoki marketpleys narxini bir daqiqada hisoblang. Kerakli variantlarni belgilang — kalkulyator so‘mdagi «dan» narxini va muddatni ko‘rsatadi.",
    },
    contact: {
      title: "Toshkentda saytga buyurtma berish — DevUz",
      description:
        "Chatga yozing — 20 soniyada javob beramiz, kunu tun. Ulgurmasak — 30% chegirma. Vazifa, muddat va narxni muhokama qilamiz.",
    },
    about: {
      title: "DevUz studiyasi haqida — Toshkent | DevUz",
      description:
        "Biz kimmiz, qanday ishlaymiz va nimada yozamiz. Toshkent jamoasi: saytlar, mobil ilovalar, marketpleyslar va O‘zbekiston biznesi uchun AI-mahsulotlar.",
    },
  },
  footer: {
    tagline: "Toshkentdagi to‘liq siklli ishlab chiqish studiyasi",
    services: "Xizmatlar",
    company: "Studiya",
    contacts: "Aloqa",
    rights: "Barcha huquqlar himoyalangan",
    privacy: "Maxfiylik siyosati",
    madeIn: "Toshkentda yaratilgan",
  },
  about: {
    kicker: "studiya haqida",
    title: "Kichik jamoa, yirik loyihalar",
    lead: "DevUz Studio — Toshkentdagi to‘liq siklli studiya. Biz maket emas, mahsulot yaratamiz: birinchi suhbatdan foydalanuvchilari, to‘lovlari va qo‘llab-quvvatlashi bor ishlaydigan xizmatgacha.",
    principlesTitle: "Qanday ishlaymiz",
    principles: [
      { title: "Kod sizniki", text: "Repozitoriy va serverlar birinchi kundan buyurtmachi nomiga rasmiylashtiriladi. Biz mijozlarni qulf ostida ushlamaymiz." },
      { title: "Mahalliy xususiyatlar — «keyin» emas", text: "Payme, Click, Octobank, Eskiz, E-mehmon, o‘zbek lotin yozuvi. Biz buni bosib o‘tganmiz va qayerda tuzoq borligini bilamiz." },
      { title: "Tezlik go‘zallikdan muhim", text: "Animatsiya sizga qidiruvdagi o‘rin evaziga tushmasligi kerak. Core Web Vitals’ni dasturchining noutbukida emas, haqiqiy telefonlarda tekshiramiz." },
      { title: "Ochiq gapiramiz", text: "Agar vazifa e’lon qilingan byudjetga sig‘masa — buni uchinchi oyda emas, darrov aytamiz." },
    ],
  },
  notFound: { title: "Sahifa topilmadi", text: "Bunday sahifa bizda yo‘q shekilli. Havola eskirgan bo‘lishi mumkin." },
  calculator: {
    kicker: "kalkulyator",
    title: "Loyihani bir daqiqada hisoblang",
    description:
      "Loyiha turini tanlang va kerakli narsalarni belgilang. Kalkulyator «dan» oralig‘ini va ish tarkibini ko‘rsatadi — menejer qiladigan hisobning aynan o‘zi, faqat kutishsiz.",
    chooseType: "Nima qilamiz",
    configure: "O‘zingizga moslang",
    result: "Dastlabki baholash",
    from: "dan",
    weeksLabel: "hafta ish",
    techTitle: "Texnik jihatdan nima olasiz",
    workTitle: "Qanday ishlar kiradi",
    reset: "Tozalash",
    discuss: "Hisobni muhokama qilish",
    handoff: "Hisob chatga qo‘yildi. Tafsilotlarni yozing — menejer uni so‘rovingiz bilan birga oladi.",
    disclaimer:
      "Bu mo‘ljal, tijorat taklifi emas. Aniq raqamni vazifani tahlil qilgandan keyin aytamiz: haqiqiy loyihada hech bir kalkulyatorda yo‘q talablar chiqadi.",
    none: "kerak emas",
    included: "allaqachon kiradi",
    prefill: "Assalomu alaykum! Saytdagi kalkulyatorda loyihani hisobladim:",
  },
  language: "Til",
  skipToContent: "Mazmunga o‘tish",
};

const zh: Dictionary = {
  nav: { services: "服务", calculator: "报价", cases: "案例", process: "流程", about: "关于我们", contacts: "联系方式" },
  cta: {
    discuss: "洽谈项目",
    calculate: "获取报价",
    seeCases: "查看案例",
    allCases: "全部案例",
    readMore: "了解详情",
    backHome: "返回首页",
    writeUs: "联系我们",
  },
  hero: {
    eyebrow: "全流程开发 · 塔什干",
    titleLead: "我们编写的代码，",
    titleAccent: "为你创造收益",
    lead: "网站、移动应用、基于 LLM 与 RAG 的 AI 产品、电商平台与配送服务。服务乌兹别克斯坦企业 —— 提供俄语、乌兹别克语、英语与中文四种语言。",
    scroll: "向下滚动",
  },
  build: {
    file: "devuz-studio · build",
    compiling: "编译中…",
    passed: "构建通过",
    success: "Compiled successfully",
    successNote: "所有模块各就各位",
    errors: "0 个错误 · 0 条警告",
  },
  services: {
    kicker: "我们做什么",
    title: "五大方向",
    description:
      "小到三周即可上线的网站，大到对接收银系统、在地图上实时追踪骑手的电商配送平台。",
    from: "起价",
    weeks: "周",
    stack: "技术栈",
    included: "服务内容",
  },
  cases: {
    kicker: "案例",
    title: "已上线的项目",
    description:
      "不是效果图，也不是概念稿。以下每个项目都是我们亲手编写并持续维护的真实代码。",
    liveSite: "访问网站",
    challenge: "项目需求",
    tech: "技术方案",
    year: "年份",
  },
  devuz: {
    kicker: "本站",
    title: "我们的一个项目，您已经打开了",
    description:
      "您正在浏览的网站，是我们为自己做的 —— 这也是了解我们做事方式最直接的途径：四种语言、首屏的代码编译场景、报价计算器，以及在真人接手之前就厘清需求的 AI 客户经理。",
    previewLabel: "实时预览",
    previewNote:
      "预览中的语言会自动切换。访客看到的语言按浏览器判定，并会保留到下一次访问。",
    demoAsk: "我们做干果出口，想要一个网站。大概需要多少钱？",
    demoReply: "我给您看一个类似项目，并给出价格区间 —— 一分钟。",
    points: [
      { title: "四种语言", text: "ru · en · uz · zh，均配有 hreflang 与各自的分享封面。" },
      { title: "第一线的 AI 客户经理", text: "20 秒内回复，按 ICP 与 BANT 为需求评分，并把整理好的摘要交给客户经理。" },
      { title: "不依赖库的动效", text: "编译场景、代码雨与区块出场 —— 只用 CSS 与一个 IntersectionObserver。" },
    ],
    openCase: "这个网站是怎么做的",
  },
  process: {
    kicker: "合作方式",
    title: "从启动到发布的六个步骤",
    description:
      "流程透明，结尾没有意外：你每周都能看到进展，而不是等到验收时才见到成果。",
    steps: [
      { title: "沟通", text: "先由 AI 客户经理接待 —— 全天候，并使用你的母语。它会厘清需求、预算与时间要求，并把整理好的摘要交给真人经理。" },
      { title: "评估", text: "我们把需求拆解开来，给出工期与费用区间，并说明这个区间由哪些部分构成。" },
      { title: "原型", text: "在写下第一行正式代码之前，先交付关键页面的可点击原型。" },
      { title: "开发", text: "以周为单位的迭代。每个迭代结束时都会交付一个可以打开试用的可运行环境。" },
      { title: "上线", text: "部署、域名、SSL 证书、数据分析、Google 与 Yandex 收录，以及对你团队的使用培训。" },
      { title: "维护", text: "我们持续在线：修复、监控、迭代新功能。代码与各项账号权限从第一天起就归你所有。" },
    ],
  },
  stack: { kicker: "技术", title: "我们的技术选型" },
  faq: {
    kicker: "常见问题",
    title: "先把话说清楚",
    items: [
      { q: "在塔什干做一个网站要多少钱？", a: "DevUz Studio 在塔什干的网站开发起价为：企业官网或落地页 2500 美元，移动应用 8000 美元，电商平台 15000 美元。价格取决于四个因素：需要多少种语言、系统有多少种用户角色、与第三方系统的对接有多深，以及需要原创设计还是沿用现成栅格进行适配。一个带后台、支持四种语言的网站，价格约为单语言落地页的一点五倍。确切数字我们会在梳理清楚需求之后给出——在那之前的任何报价都是猜测，而猜出来的预算最后总会变成追加费用。你也可以用网站上的计算器自己估算：一分钟即可得到以苏姆计的价格区间和以周计的周期。" },
      { q: "做一个网站或应用需要多长时间？", a: "DevUz Studio 完成企业官网或落地页需要 3–8 周，Flutter 移动应用 6–14 周，电商平台或配送服务 10–20 周。计时从需求范围确认、账号权限到位那一刻开始，而不是从第一封邮件开始。影响周期最大的有三点：客户方内容的准备程度、外部对接的数量，以及公司内部审批的速度。四语言项目会让周期增加约 15%——翻译和逐语言的版面检查都需要时间。我们按周迭代：每周五客户都能在测试域名上看到可运行的版本，而不是一份工作汇报。" },
      { q: "交钥匙的网站开发包含哪些内容？", a: "在 DevUz Studio，交钥匙意味着客户拿到的是一个可运行的网站，而不是一堆文件。范围包括：契合品牌的设计、前后端开发、让运营人员无需开发者即可修改内容的后台、带 hreflang 标注的多语言支持、技术 SEO（sitemap、Schema.org、Core Web Vitals 保持绿色区间）、域名与 SSL 配置、统计分析接入，以及既有内容的迁移。单独计费的只有主机和域名，通常每月 5–15 美元。上线后享有一个月的免费维护，用于修复真实流量下暴露的问题。源代码全部交付，包含代码仓库及其提交历史。" },
      { q: "企业落地 AI 需要多少预算？", a: "DevUz Studio 的 AI 落地起价 4000 美元，周期 4–10 周。这笔预算买到的是可用的产品，而不是一次实验：最常见的是全天候接待客户、厘清需求并把整理好的摘要交给真人经理的第一线助手，或者基于 RAG 技术的企业知识库检索。成本取决于需要整理的数据量、与贵方系统对接的数量，以及是需要微调模型还是现成模型即可。模型调用是另一项开支：按平均咨询量计算，每月约 30–150 美元。投入产出我们在启动前就算清楚——如果账算不过来，我们会直说。" },
      { q: "交钥匙的电商平台开发要多少钱？", a: "DevUz Studio 的交钥匙电商平台开发起价 15000 美元，周期 10–20 周。基础范围包括带搜索与筛选的商品前台、含上架与统计的商家后台、购物车与下单流程、通过本地网关的在线支付、审核后台与基础数据分析。若需配送服务，还要加上骑手 App、订单派发与地图实时追踪，另计 4000–8000 美元。与收银系统及 1C 的对接单独报价，通常 2000 美元起。最常见的省钱方式，是先只带核心场景上线第一版，其余在真实流量中逐步补齐：这样首批成交会提前两到三个月到来。" },
      { q: "开发完成后代码归谁所有？", a: "项目的全部源代码自付清尾款之日起归客户所有，这一点写入合同。DevUz Studio 会交付包含完整提交历史的代码仓库、部署文档，以及全部账号权限：服务器、域名、数据库与第三方服务。没有闭源部分，没有授权费，也不存在对我们基础设施的依赖。我们采用开放技术栈——Next.js、PostgreSQL、Flutter——因此日后任何团队都能接手维护，而不只是我们。这是有意的立场：靠技术依赖捆住客户的承包方，赚的是不自由的钱，而不是工作质量的钱。" },
      { q: "你们接乌兹别克斯坦以外的客户吗？", a: "接。DevUz Studio 位于塔什干，同时服务来自乌兹别克斯坦、哈萨克斯坦和俄罗斯的客户，以及面向出口销售的公司。网站与沟通均支持四种语言——俄语、乌兹别克语、英语和中文——因此无论对本地企业还是国际买家都不存在语言障碍。作品集中有数个项目正是为出口与海外市场打造的。我们远程协作：视频会议、每周在测试域名上的演示，以及在客户习惯的通讯工具中沟通。付款可汇入乌兹别克斯坦的个体经营者账户，或按与法人主体签订的合同进行。" },
      { q: "网站聊天里是谁在回复？", a: "DevUz Studio 网站聊天中第一个回复你的是 AI 客户经理——运行在工作室自有定制 LLM 之上的第一线接待。它全天候工作，并使用访客的语言：俄语、乌兹别克语、英语或中文。它的任务不是推销，而是厘清需求：提出补充问题、建议从哪里入手，并把你说过的一切连同申请编号一起转交真人经理，你不必重复第二遍。最终报价与折扣只由真人给出——这是刻意的，因为价格取决于专业人员才能看见的细节。若你想转到 Telegram 继续，聊天会把对话一并带过去，从中断处接着聊。" },
      { q: "20 秒回复保证是怎么运作的？", a: "DevUz Studio 网站聊天的第一条回复会在 20 秒内到达，任何时段都是如此。若超时未回，聊天本身会显示项目 30% 的折扣已经归你——无需索取，也无需证明，倒计时就显示在聊天窗口里。折扣适用于首个项目，客户经理会在报价中计入。计时从你按下「发送」那一刻开始，也就是说，衡量的是你实际经历的等待，而不是服务器耗时。这项保证的逻辑很简单：在这个行业里，隔天回复咨询被视为常态，而我们认为这正是客户转向先回复者的首要原因。" },
      { q: "你们能接手别人开发的项目吗？", a: "可以，这是 DevUz Studio 的一项独立服务。我们总是从审计开始：梳理架构、通读代码、评估质量与风险、检查安全性，并给出逐项估算的工作计划。审计起价 500 美元，历时 3–7 天；结束时就能看清哪种更划算——在现有基础上继续，还是推倒重写。有时诚实的答案是后者，我们会直说。我们做过的最大一次审计覆盖了 35 个微服务。任何技术栈的项目我们都接，但对于没有文档和测试的代码，只有在审计之后才承接维护：盲修别人写的东西，是把客户预算白白花掉的方式。" },
    ],
  },
  contact: {
    kicker: "20 秒内回复",
    title: "客户经理已在线，等待您的消息",
    description:
      "在聊天中写下您需要做什么。第一条回复会在 20 秒内到达，全天候 —— 超时未回，项目立减 30%。我们会在对话中厘清需求，并告诉您从哪里入手。",
    formTitle: "或者留下联系方式",
    name: "您的称呼",
    contactField: "电话、Telegram 或邮箱",
    message: "简单说说项目",
    submit: "提交",
    sending: "提交中…",
    sent: "已收到，客户经理会尽快与您联系。",
    failed: "提交失败。请通过 Telegram 联系我们，那样更快。",
    consent: "提交表单即表示您同意我们处理相关个人信息",
    consentLink: "隐私政策",
    noPhone: "工作室不设电话 —— 请通过 Telegram 联系，或在表单中留下联系方式，我们会在同一渠道回复。",
  },
  chat: {
    title: "DevUz 客户经理",
    subtitle: "已在线，等待您的消息",
    online: "在线",
    placeholder: "写下您需要做什么…",
    send: "发送",
    open: "联系客户经理",
    close: "收起",
    greeting:
      "您好！请用您自己的话说说需要做什么 —— 网站、应用、电商平台还是 AI 产品。我会立刻回复，并告诉您从哪里入手。",
    thinking: "正在输入…",
    error: "出了点问题。请重试，或通过 Telegram 联系我们。",
    handoff: "客户经理已经看到您的需求，很快会与您联系。",
    undelivered:
      "需求我已记下，但目前发送给客户经理的通知没能送达。为稳妥起见，请通过 Telegram 直接联系我们。",
    disabled: "聊天暂时不可用。请在下方表单留下联系方式，我们会回复您。",
    consent: "继续对话即表示您同意我们处理相关个人信息。",
    restart: "重新开始",
    promise: "20 秒内回复 · 全天候",
    promiseNote: "超时未回 —— 项目立减 30%",
    counting: "还剩 {n} 秒",
    discountWon: "我们没能在 20 秒内回复 —— 项目 30% 的折扣归您，客户经理会为您计入。",
    requestLabel: "申请编号",
    toTelegram: "在 Telegram 继续",
    toTelegramNote: "对话会从这里继续 —— 无需重新说明。",
  },
  seo: {
    home: {
      title: "塔什干网站与应用开发 — DevUz Studio",
      description:
        "位于乌兹别克斯坦塔什干的全流程开发工作室：网站、移动应用、电商平台，以及基于 LLM 与 RAG 的 AI 产品。在线估价，20 秒内回复。",
    },
    services: {
      title: "服务：网站、应用、AI — 塔什干 | DevUz",
      description: "五大方向：企业网站、移动应用、AI 产品、电商平台与配送、系统集成。每个方向均标注价格区间与周期。",
    },
    cases: {
      title: "案例：网站、应用与电商平台 — DevUz",
      description: "已上线的项目：配送服务、电商平台、AI 线索甄别、设备租赁。每个项目均含需求、技术栈与结果。",
    },
    calculator: {
      title: "开发报价计算器 — 塔什干 | DevUz",
      description: "一分钟估算网站、应用或电商平台的价格。勾选所需选项，即可得到起步价区间与以周计的周期。",
    },
    contact: {
      title: "在塔什干委托开发 — DevUz Studio",
      description: "在聊天中留言 —— 我们 20 秒内回复，全天候。超时未回，项目立减 30%。一起聊聊范围、周期与费用。",
    },
    about: {
      title: "关于 DevUz — 塔什干开发工作室",
      description: "我们是谁、怎么工作、用什么技术。一支塔什干团队：为乌兹别克斯坦企业打造网站、移动应用、电商平台与 AI 产品。",
    },
  },
  footer: {
    tagline: "位于塔什干的全流程开发工作室",
    services: "服务",
    company: "工作室",
    contacts: "联系方式",
    rights: "保留所有权利",
    privacy: "隐私政策",
    madeIn: "塔什干出品",
  },
  about: {
    kicker: "关于工作室",
    title: "小团队，大项目",
    lead: "DevUz Studio 是一家位于塔什干的全流程开发工作室。我们交付的是产品而非设计稿：从第一次沟通，一直做到拥有真实用户、支付与运维支持的线上服务。",
    principlesTitle: "我们的做事方式",
    principles: [
      { title: "代码归你所有", text: "代码仓库与服务器从第一天起就登记在客户名下。我们不会把客户锁在自己手里。" },
      { title: "本地化不是「以后再说」", text: "Payme、Click、Octobank、Eskiz、E-mehmon、乌兹别克拉丁文字。这些我们都趟过，知道坑在哪里。" },
      { title: "速度重于装饰", text: "动画不该让你损失搜索排名。我们在真机上而不是开发者的笔记本上检测 Core Web Vitals。" },
      { title: "有话直说", text: "如果需求装不进你给的预算，我们当场就说 —— 而不是拖到开发的第三个月。" },
    ],
  },
  notFound: { title: "页面未找到", text: "我们似乎没有这个页面，链接可能已经失效。" },
  calculator: {
    kicker: "报价计算器",
    title: "一分钟估算项目费用",
    description:
      "选择项目类型并勾选所需功能。计算器会给出「起价」区间与工作范围 —— 与客户经理所做的估算一致，只是无需等待。",
    chooseType: "做什么",
    configure: "按需配置",
    result: "初步估算",
    from: "起价",
    weeksLabel: "周工期",
    techTitle: "技术上你将获得",
    workTitle: "工作内容包含",
    reset: "重置",
    discuss: "就此估算沟通",
    handoff: "估算结果已填入聊天。补充细节后，客户经理会连同您的需求一并收到。",
    disclaimer:
      "此为参考区间，并非正式报价。我们会在梳理清楚需求后给出准确数字：真实项目总会冒出任何计算器都涵盖不了的要求。",
    none: "不需要",
    included: "已包含",
    prefill: "您好！我用贵司网站的计算器估算了一个项目：",
  },
  language: "语言",
  skipToContent: "跳到主要内容",
};

const dictionaries: Record<Locale, Dictionary> = { ru, en, uz, zh };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? ru;
}
