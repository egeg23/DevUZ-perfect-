/**
 * Профиль бота @Devuz_studio_bot: имя, короткое описание и описание.
 *
 * Владелец, 02.10.2026: «Давай упакуем нашего тг бота: логотип, название,
 * описание». До этого у бота было только имя из BotFather — «DevUZ Studio»,
 * без аватара и без единого слова о том, зачем ему писать.
 *
 * Где это видно:
 *  - `name` — в списке чатов и в шапке переписки. Одно на все языки: это
 *    марка, её не переводят;
 *  - `short` — на странице профиля и под ссылкой, когда бота пересылают
 *    (до 120 знаков);
 *  - `description` — в пустом чате до первого «Старт», то есть всё, что
 *    человек прочтёт, прежде чем решит написать (до 512 знаков). Telegram
 *    показывает его как обычный текст, без разметки.
 *
 * Обещания — те же, что в приветствии бота (content/bot.ts): ответ за
 * 20 секунд круглосуточно, иначе скидка 30%, и /ref для партнёров. Новое
 * обещание сюда не дописывать, пока его не держит сам бот.
 *
 * Язык: русский — по умолчанию (`lang: null`), он же у узбекоязычных без
 * своего текста; остальные — по языку Telegram у человека, как и меню
 * команд (lib/qualify/menu.ts).
 */

export const BOT_NAME = "DevUz Studio";

export type BotProfileText = { short: string; description: string };

export const BOT_PROFILE: { lang: string | null; text: BotProfileText }[] = [
  {
    lang: null,
    text: {
      short: "Сайты, приложения, CRM и ИИ-агенты под ключ. Отвечаем за 20 секунд — или скидка 30% на проект.",
      description: [
        "DevUz Studio — разработка полного цикла в Ташкенте: сайты и интернет-магазины, мобильные приложения, маркетплейсы и сервисы доставки, CRM, Telegram-боты и ИИ-агенты на ваших данных.",
        "",
        "Здесь на связи менеджер:",
        "• расскажите своими словами, что нужно, — уточним детали и оформим заявку с номером;",
        "• отвечаем за 20 секунд, круглосуточно. Не уложимся — скидка 30% на проект;",
        "• /ref — партнёрская программа: приводите клиентов и зарабатывайте.",
        "",
        "Нажмите кнопку внизу, чтобы начать разговор.",
      ].join("\n"),
    },
  },
  {
    lang: "uz",
    text: {
      short: "Saytlar, ilovalar, CRM va AI-agentlar. 20 soniyada javob beramiz — ulgurmasak, loyihaga 30% chegirma.",
      description: [
        "DevUz Studio — Toshkentdagi to‘liq tsiklli ishlab chiqish studiyasi: saytlar va internet-do‘konlar, mobil ilovalar, marketpleyslar, yetkazib berish servislari, CRM, Telegram-botlar va AI-agentlar.",
        "",
        "Bu yerda menejer aloqada:",
        "• nima kerakligini o‘z so‘zlaringiz bilan yozing — tafsilotlarni aniqlab, raqamli ariza ochamiz;",
        "• 20 soniyada javob beramiz, kunu tun. Ulgurmasak — loyihaga 30% chegirma;",
        "• /ref — hamkorlik dasturi: mijoz olib keling, daromad qiling.",
        "",
        "Boshlash uchun pastdagi tugmani bosing.",
      ].join("\n"),
    },
  },
  {
    lang: "en",
    text: {
      short: "Websites, apps, CRM and AI agents, built end to end. We reply in 20 seconds — or 30% off your project.",
      description: [
        "DevUz Studio is a full-cycle development studio in Tashkent: websites and online stores, mobile apps, marketplaces and delivery services, CRM, Telegram bots and AI agents on your own data.",
        "",
        "A manager is here for you:",
        "• tell us in your own words what you need — we'll clarify the details and log a numbered request;",
        "• we reply within 20 seconds, around the clock. If we miss it — 30% off your project;",
        "• /ref — partner program: bring clients and earn.",
        "",
        "Press the button below to start the conversation.",
      ].join("\n"),
    },
  },
  {
    lang: "uk",
    text: {
      short: "Сайти, застосунки, CRM та AI-агенти під ключ. Відповідаємо за 20 секунд — або знижка 30% на проєкт.",
      description: [
        "DevUz Studio — розробка повного циклу в Ташкенті: сайти та інтернет-магазини, мобільні застосунки, маркетплейси й сервіси доставки, CRM, Telegram-боти та AI-агенти на ваших даних.",
        "",
        "Тут на зв'язку менеджер:",
        "• розкажіть своїми словами, що потрібно, — уточнимо деталі й оформимо заявку з номером;",
        "• відповідаємо за 20 секунд, цілодобово. Не встигнемо — знижка 30% на проєкт;",
        "• /ref — партнерська програма: приводьте клієнтів і заробляйте.",
        "",
        "Натисніть кнопку внизу, щоб почати розмову.",
      ].join("\n"),
    },
  },
  {
    lang: "pl",
    text: {
      short: "Strony, aplikacje, CRM i agenci AI pod klucz. Odpowiadamy w 20 sekund — albo 30% rabatu na projekt.",
      description: [
        "DevUz Studio — software house z Taszkentu, pełen cykl: strony i sklepy internetowe, aplikacje mobilne, marketplace'y i serwisy dostaw, CRM, boty Telegram i agenci AI na Twoich danych.",
        "",
        "Tu czeka na Ciebie menedżer:",
        "• opisz własnymi słowami, czego potrzebujesz — doprecyzujemy szczegóły i założymy zgłoszenie z numerem;",
        "• odpowiadamy w 20 sekund, całą dobę. Jeśli się spóźnimy — 30% rabatu na projekt;",
        "• /ref — program partnerski: polecaj klientów i zarabiaj.",
        "",
        "Naciśnij przycisk poniżej, aby zacząć rozmowę.",
      ].join("\n"),
    },
  },
  {
    lang: "zh",
    text: {
      short: "网站、移动应用、CRM 与 AI 智能体，全流程开发。20 秒内回复 — 超时项目立减 30%。",
      description: [
        "DevUz Studio — 塔什干的全流程开发工作室：网站与网店、移动应用、电商平台与配送服务、CRM、Telegram 机器人，以及基于您自有数据的 AI 智能体。",
        "",
        "客户经理在线为您服务：",
        "• 用您自己的话说说需求 — 我们确认细节，并生成带编号的需求单；",
        "• 20 秒内回复，全天候。超时未回 — 项目立减 30%；",
        "• /ref — 合作伙伴计划：推荐客户，获得收益。",
        "",
        "点击下方按钮，开始对话。",
      ].join("\n"),
    },
  },
];

/**
 * Аватар — тот же знак, что на сайте (public/brand/telegram-avatar.svg), в
 * JPG: другого Telegram не берёт. Новая картинка — новая версия: по ней
 * синхронизация понимает, что фото надо загрузить ещё раз.
 */
export const BOT_AVATAR = { file: "public/brand/telegram-avatar.jpg", version: "2026-10-02" };
