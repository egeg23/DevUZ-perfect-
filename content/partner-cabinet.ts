import type { Locale } from "@/lib/i18n";
import type { ReferralStage } from "@/lib/partners/store";

/**
 * Тексты кабинета партнёра — на четырёх языках сайта.
 *
 * Отдельно от словаря сайта: кабинет — не страница-витрина, а рабочее место,
 * у него свои слова, и держать их рядом с героем главной незачем. Суммы и
 * проценты сюда не зашиты — их подставляет страница из правил
 * (lib/partners/rules.ts), чтобы обещание и расчёт не разъехались.
 */

export type CabinetCopy = {
  title: string;
  signedOutTitle: string;
  signedOutLead: string;
  signIn: string;
  signInHint: string;
  errors: Record<"expired" | "offline", string>;
  hello: (name: string) => string;
  logout: string;
  /** Ставка без персональной: «от 10 до 30 % от суммы проекта». */
  rate: (from: number, to: number) => string;
  personalRate: (percent: number) => string;
  tiersTitle: string;
  tierUpTo: (amount: string) => string;
  tierOver: (amount: string) => string;
  tiersNote: string;

  statClicks: string;
  statLeads: string;
  statSigned: string;
  statPaid: string;
  statEarned: string;
  statFrozen: string;
  statAvailable: string;
  statPaidOut: string;

  chartTitle: string;
  chartLead: string;
  chartLeadMark: string;
  chartTip: (day: string, clicks: number, leads: number) => string;

  linksTitle: string;
  linksLead: string;
  colChannel: string;
  colLink: string;
  colTarget: string;
  colClicks: string;
  colLeads: string;
  mainLink: string;
  botLinkTitle: string;
  copy: string;
  copied: string;
  newLink: string;
  fieldLabel: string;
  fieldLabelHint: string;
  fieldTarget: string;
  fieldPerk: string;
  fieldCode: string;
  fieldCodeHint: string;
  createLink: string;
  targets: Record<string, string>;
  perks: Record<"none" | "disc_5" | "disc_10" | "disc_15", string>;
  linkResult: Record<"ok" | "offline" | "invalid" | "reserved" | "taken" | "limit" | "failed", string>;

  clientsTitle: string;
  clientsLead: string;
  clientsEmpty: string;
  colDate: string;
  colClient: string;
  colFrom: string;
  colStage: string;
  colShare: string;
  unnamed: string;
  stages: Record<ReferralStage, string>;
  shareFrozen: (amount: string) => string;
  shareEarned: (amount: string) => string;
  notCounted: (reason: string) => string;
  voidReasons: Record<"self" | "existing_client" | "blocked", string>;

  payoutTitle: string;
  payoutRules: (min: string) => string;
  payoutOpens: (date: string) => string;
  requisites: string;
  requisitesHint: string;
  saveRequisites: string;
  requestPayout: (amount: string) => string;
  payoutResult: Record<
    "ok" | "saved" | "bad_requisites" | "offline" | "window" | "requisites" | "pending" | "min" | "failed",
    string
  >;
  historyTitle: string;
  payoutStatus: Record<"requested" | "paid" | "rejected", string>;

  promoTitle: string;
  promoLead: string;
  promo: { title: string; text: (link: string) => string }[];

  howTitle: string;
  how: string[];
  botNote: (bot: string) => string;
};

const ru: CabinetCopy = {
  title: "Кабинет партнёра",
  signedOutTitle: "Вход для партнёров",
  signedOutLead:
    "Войдите через Telegram: бот пришлёт кнопку, которая откроет кабинет. Если вы ещё не партнёр — бот заведёт вас сразу, это бесплатно и ни к чему не обязывает.",
  signIn: "Войти через Telegram",
  signInHint: "Откроется наш бот. Нажмите «Старт» — придёт кнопка входа, она работает 15 минут.",
  errors: {
    expired: "Ссылка входа устарела или уже использована. Нажмите «Войти через Telegram» ещё раз — бот пришлёт новую.",
    offline: "Сервис сейчас недоступен. Попробуйте через минуту.",
  },
  hello: (name) => `Здравствуйте, ${name}`,
  logout: "Выйти",
  rate: (from, to) => `Ваша ставка — от ${from} до ${to} % от суммы проекта клиента: чем крупнее проект, тем выше процент`,
  personalRate: (percent) => `Ваша персональная ставка — ${percent} % от суммы каждого проекта клиента`,
  tiersTitle: "Ставки",
  tierUpTo: (amount) => `до ${amount}`,
  tierOver: (amount) => `дороже ${amount}`,
  tiersNote: "Ставка — по сумме каждого проекта отдельно, с каждого проекта клиента, включая следующие.",

  statClicks: "Переходов за 30 дней",
  statLeads: "Заявок всего",
  statSigned: "Договоров подписано",
  statPaid: "Проектов оплачено",
  statEarned: "Заработано",
  statFrozen: "Ждёт оплаты клиентом",
  statAvailable: "К выводу",
  statPaidOut: "Выплачено",

  chartTitle: "Переходы за 30 дней",
  chartLead: "Каждый столбик — люди, открывшие ваши ссылки за день. Роботы превью и повторные открытия одним человеком не считаются.",
  chartLeadMark: "точка — в этот день была заявка",
  chartTip: (day, clicks, leads) => `${day}: переходов ${clicks}${leads ? `, заявок ${leads}` : ""}`,

  linksTitle: "Мои ссылки",
  linksLead:
    "Под каждый канал — своя короткая ссылка. Так видно, откуда приходят клиенты, а одинаковую ссылку в десяти чатах не режет антиспам.",
  colChannel: "Канал",
  colLink: "Ссылка",
  colTarget: "Куда ведёт",
  colClicks: "Переходы",
  colLeads: "Заявки",
  mainLink: "Основная",
  botLinkTitle: "Ссылка сразу в Telegram-бота",
  copy: "Скопировать",
  copied: "Скопировано",
  newLink: "Новая ссылка",
  fieldLabel: "Название канала",
  fieldLabelHint: "Например: Telegram-канал, Instagram, рассылка",
  fieldTarget: "Куда ведёт",
  fieldPerk: "Бонус вашей аудитории",
  fieldCode: "Свой код",
  fieldCodeHint: "Необязательно. Латиница и цифры, 3–24 знака",
  createLink: "Создать ссылку",
  targets: {
    "/": "Главная",
    "/services": "Услуги",
    "/calculator": "Калькулятор",
    "/audit": "Проверка сайта",
    "/cases": "Кейсы",
    "/products": "Продукты",
    "/partners": "Партнёрская программа",
    bot: "Telegram-бот",
  },
  perks: {
    none: "Без бонуса",
    disc_5: "Скидка 5 % на первый проект",
    disc_10: "Скидка 10 % на первый проект",
    disc_15: "Скидка 15 % на первый проект",
  },
  linkResult: {
    ok: "Ссылка создана — скопируйте её в таблице.",
    offline: "Сервис сейчас недоступен. Попробуйте через минуту.",
    invalid: "Код: латиница, цифры, дефис или подчёркивание, 3–24 знака.",
    reserved: "Этот код зарезервирован — выберите другой.",
    taken: "Такой код уже занят — придумайте другой или оставьте поле пустым.",
    limit: "Ссылок уже максимум. Напишите нам — уберём неиспользуемые.",
    failed: "Не получилось создать ссылку. Попробуйте ещё раз.",
  },

  clientsTitle: "Мои клиенты",
  clientsLead:
    "Все, кто оставил заявку по вашим ссылкам. Контакты клиента мы не показываем — только этап и ваши деньги. Доля — процент от суммы проекта по ставке его ступени.",
  clientsEmpty: "Пока никого. Поделитесь ссылкой — первый клиент появится здесь сразу после заявки.",
  colDate: "Дата",
  colClient: "Клиент",
  colFrom: "Откуда",
  colStage: "Этап",
  colShare: "Ваша доля",
  unnamed: "Клиент",
  stages: {
    lead: "Заявка",
    work: "В работе",
    contract: "Готовим договор",
    signed: "Договор подписан",
    paid: "Оплачен",
    lost: "Не сложилось",
  },
  shareFrozen: (amount) => `${amount} · после полной оплаты`,
  shareEarned: (amount) => `${amount} · начислено`,
  notCounted: (reason) => `не засчитан: ${reason}`,
  voidReasons: {
    self: "заявка от вас самих",
    existing_client: "клиент уже работал со студией",
    blocked: "партнёрство приостановлено",
  },

  payoutTitle: "Выплата",
  payoutRules: (min) =>
    `Вывод — от ${min}, с первого рабочего дня месяца. Деньги переводит владелец студии: USDT (TRC-20) или по реквизитам. Одна заявка за раз.`,
  payoutOpens: (date) => `Вывод откроется ${date}.`,
  requisites: "Куда платить",
  requisitesHint: "Адрес USDT TRC-20 или реквизиты словами",
  saveRequisites: "Сохранить",
  requestPayout: (amount) => `Запросить выплату ${amount}`,
  payoutResult: {
    ok: "Заявка принята. Когда деньги уйдут, бот напишет вам.",
    saved: "Реквизиты сохранены.",
    bad_requisites: "Не похоже на адрес USDT TRC-20 или реквизиты. Проверьте и сохраните ещё раз.",
    offline: "Сервис сейчас недоступен. Попробуйте через минуту.",
    window: "Вывод открывается с первого рабочего дня месяца — после сверки платежей.",
    requisites: "Сначала укажите, куда платить.",
    pending: "Одна заявка уже ждёт решения — вторую поверх неё не подать.",
    min: "Доступно меньше минимальной выплаты. Подождите следующей оплаты клиента.",
    failed: "Не получилось подать заявку. Попробуйте ещё раз.",
  },
  historyTitle: "История выплат",
  payoutStatus: { requested: "На рассмотрении", paid: "Выплачено", rejected: "Отклонено" },

  promoTitle: "Готовые тексты",
  promoLead:
    "Скопируйте и вставьте — ссылка уже внутри. Лучше всего работает личное: допишите одну фразу о том, почему вы нам доверяете.",
  promo: [
    {
      title: "Пост в канал",
      text: (link) =>
        `Если нужен сайт, интернет-магазин или Telegram-бот — рекомендую DevUz Studio. Делают под ключ, показывают, сколько заявок сайт теряет сейчас и что с этим сделать. Проверить свой сайт и обсудить задачу: ${link}`,
    },
    {
      title: "Личное сообщение",
      text: (link) =>
        `Ты говорил, что нужен сайт. Посмотри DevUz Studio — сначала бесплатно разберут, что не так сейчас, и только потом предложат цену: ${link}`,
    },
    {
      title: "Коротко — для сторис",
      text: (link) => `Сайты и боты, которые приносят заявки. Разбор бесплатно: ${link}`,
    },
  ],

  howTitle: "Как это работает",
  how: [
    "Делитесь короткой ссылкой — своей под каждый канал.",
    "Человек открывает ссылку — сайт запоминает вас на 30 дней. Если за это время он оставит заявку на сайте или напишет боту, клиент ваш, даже если зашёл снова уже без ссылки.",
    "Этапы видны здесь: заявка, работа, договор, оплата. О подписанном договоре и об оплате бот пишет вам сам.",
    "Когда клиент оплатил проект целиком, доля становится доступной к выводу — с первого рабочего дня месяца.",
  ],
  botNote: (bot) => `Уведомления о заявках, договорах и выплатах приходят в Telegram-бот @${bot}.`,
};

const en: CabinetCopy = {
  title: "Partner dashboard",
  signedOutTitle: "Partner sign-in",
  signedOutLead:
    "Sign in with Telegram: our bot will send you a button that opens the dashboard. Not a partner yet? The bot signs you up right away — it's free and commits you to nothing.",
  signIn: "Sign in with Telegram",
  signInHint: "Our bot will open. Tap “Start” — you'll get a sign-in button that works for 15 minutes.",
  errors: {
    expired: "The sign-in link has expired or was already used. Tap “Sign in with Telegram” again — the bot will send a new one.",
    offline: "The service is unavailable right now. Try again in a minute.",
  },
  hello: (name) => `Hello, ${name}`,
  logout: "Sign out",
  rate: (from, to) => `Your rate is ${from}–${to}% of the client's project amount: the bigger the project, the higher the rate`,
  personalRate: (percent) => `Your personal rate is ${percent}% of every client project`,
  tiersTitle: "Rates",
  tierUpTo: (amount) => `up to ${amount}`,
  tierOver: (amount) => `over ${amount}`,
  tiersNote: "The rate depends on the amount of each project separately, for every project of the client, including the next ones.",

  statClicks: "Clicks, 30 days",
  statLeads: "Requests in total",
  statSigned: "Contracts signed",
  statPaid: "Projects paid",
  statEarned: "Earned",
  statFrozen: "Waiting for client payment",
  statAvailable: "Available",
  statPaidOut: "Paid out",

  chartTitle: "Clicks over 30 days",
  chartLead: "Each bar is the people who opened your links that day. Link-preview robots and repeat visits by the same person are not counted.",
  chartLeadMark: "dot — a request came in that day",
  chartTip: (day, clicks, leads) => `${day}: ${clicks} clicks${leads ? `, ${leads} requests` : ""}`,

  linksTitle: "My links",
  linksLead:
    "A short link for every channel. That way you see where clients come from, and anti-spam filters don't block the same link posted in ten chats.",
  colChannel: "Channel",
  colLink: "Link",
  colTarget: "Leads to",
  colClicks: "Clicks",
  colLeads: "Requests",
  mainLink: "Main",
  botLinkTitle: "Link straight to the Telegram bot",
  copy: "Copy",
  copied: "Copied",
  newLink: "New link",
  fieldLabel: "Channel name",
  fieldLabelHint: "E.g. Telegram channel, Instagram, newsletter",
  fieldTarget: "Leads to",
  fieldPerk: "Bonus for your audience",
  fieldCode: "Custom code",
  fieldCodeHint: "Optional. Latin letters and digits, 3–24 characters",
  createLink: "Create link",
  targets: {
    "/": "Home",
    "/services": "Services",
    "/calculator": "Calculator",
    "/audit": "Website check",
    "/cases": "Cases",
    "/products": "Products",
    "/partners": "Partner program",
    bot: "Telegram bot",
  },
  perks: {
    none: "No bonus",
    disc_5: "5% off the first project",
    disc_10: "10% off the first project",
    disc_15: "15% off the first project",
  },
  linkResult: {
    ok: "Link created — copy it from the table.",
    offline: "The service is unavailable right now. Try again in a minute.",
    invalid: "Code: Latin letters, digits, dash or underscore, 3–24 characters.",
    reserved: "This code is reserved — pick another one.",
    taken: "This code is taken — pick another one or leave the field empty.",
    limit: "You've reached the link limit. Write to us and we'll remove unused ones.",
    failed: "Couldn't create the link. Try again.",
  },

  clientsTitle: "My clients",
  clientsLead:
    "Everyone who left a request through your links. We don't show client contacts — only the stage and your money. Your share is a percentage of the project amount at its tier's rate.",
  clientsEmpty: "Nobody yet. Share your link — your first client will appear here right after their request.",
  colDate: "Date",
  colClient: "Client",
  colFrom: "Source",
  colStage: "Stage",
  colShare: "Your share",
  unnamed: "Client",
  stages: {
    lead: "Request",
    work: "In progress",
    contract: "Contract being prepared",
    signed: "Contract signed",
    paid: "Paid",
    lost: "Didn't work out",
  },
  shareFrozen: (amount) => `${amount} · after full payment`,
  shareEarned: (amount) => `${amount} · credited`,
  notCounted: (reason) => `not counted: ${reason}`,
  voidReasons: {
    self: "the request came from you",
    existing_client: "the client already worked with the studio",
    blocked: "partnership suspended",
  },

  payoutTitle: "Payout",
  payoutRules: (min) =>
    `Withdrawals from ${min}, starting on the first business day of the month. The studio owner sends the money: USDT (TRC-20) or bank details. One request at a time.`,
  payoutOpens: (date) => `Withdrawals open on ${date}.`,
  requisites: "Where to pay",
  requisitesHint: "USDT TRC-20 address or bank details in words",
  saveRequisites: "Save",
  requestPayout: (amount) => `Request payout of ${amount}`,
  payoutResult: {
    ok: "Request accepted. The bot will message you when the money is sent.",
    saved: "Payment details saved.",
    bad_requisites: "That doesn't look like a USDT TRC-20 address or bank details. Check and save again.",
    offline: "The service is unavailable right now. Try again in a minute.",
    window: "Withdrawals open on the first business day of the month, after payments are reconciled.",
    requisites: "First tell us where to pay.",
    pending: "One request is already waiting for a decision — a second one can't be filed on top of it.",
    min: "Your available balance is below the minimum payout. Wait for the next client payment.",
    failed: "Couldn't file the request. Try again.",
  },
  historyTitle: "Payout history",
  payoutStatus: { requested: "Under review", paid: "Paid", rejected: "Declined" },

  promoTitle: "Ready-made texts",
  promoLead:
    "Copy and paste — the link is already inside. Personal works best: add one sentence about why you trust us.",
  promo: [
    {
      title: "Channel post",
      text: (link) =>
        `If you need a website, an online store or a Telegram bot, I recommend DevUz Studio. They build turnkey and show how many requests your site is losing now and what to do about it. Check your site and discuss your project: ${link}`,
    },
    {
      title: "Personal message",
      text: (link) =>
        `You mentioned you need a website. Take a look at DevUz Studio — they first review what's wrong for free, and only then quote a price: ${link}`,
    },
    {
      title: "Short — for stories",
      text: (link) => `Websites and bots that bring in requests. Free review: ${link}`,
    },
  ],

  howTitle: "How it works",
  how: [
    "Share a short link — a separate one for each channel.",
    "A person opens your link — the site remembers you for 30 days. If they leave a request on the site or write to the bot within that time, the client is yours, even if they came back without the link.",
    "You see the stages here: request, work, contract, payment. The bot messages you itself when a contract is signed and when the client pays.",
    "Once the client has paid the project in full, your share becomes available to withdraw — from the first business day of the month.",
  ],
  botNote: (bot) => `Notifications about requests, contracts and payouts arrive in the Telegram bot @${bot}.`,
};

const uz: CabinetCopy = {
  title: "Hamkor kabineti",
  signedOutTitle: "Hamkorlar uchun kirish",
  signedOutLead:
    "Telegram orqali kiring: bot kabinetni ochadigan tugma yuboradi. Hali hamkor bo'lmasangiz — bot sizni darhol ro'yxatdan o'tkazadi, bu bepul va hech narsaga majburlamaydi.",
  signIn: "Telegram orqali kirish",
  signInHint: "Botimiz ochiladi. «Start» ni bosing — kirish tugmasi keladi, u 15 daqiqa ishlaydi.",
  errors: {
    expired: "Kirish havolasi eskirgan yoki allaqachon ishlatilgan. «Telegram orqali kirish» ni yana bosing — bot yangisini yuboradi.",
    offline: "Xizmat hozir ishlamayapti. Bir daqiqadan keyin urinib ko'ring.",
  },
  hello: (name) => `Assalomu alaykum, ${name}`,
  logout: "Chiqish",
  rate: (from, to) => `Sizning stavkangiz — mijoz loyihasi summasining ${from} dan ${to} % gacha: loyiha qanchalik yirik bo'lsa, foiz shunchalik yuqori`,
  personalRate: (percent) => `Sizning shaxsiy stavkangiz — mijozning har bir loyihasi summasining ${percent} %`,
  tiersTitle: "Stavkalar",
  tierUpTo: (amount) => `${amount} gacha`,
  tierOver: (amount) => `${amount} dan yuqori`,
  tiersNote: "Stavka har bir loyihaning summasiga qarab alohida, mijozning har bir loyihasidan, keyingilarini ham qo'shib.",

  statClicks: "30 kunda o'tishlar",
  statLeads: "Jami so'rovlar",
  statSigned: "Imzolangan shartnomalar",
  statPaid: "To'langan loyihalar",
  statEarned: "Ishlab topildi",
  statFrozen: "Mijoz to'lovini kutmoqda",
  statAvailable: "Yechib olish mumkin",
  statPaidOut: "To'landi",

  chartTitle: "30 kundagi o'tishlar",
  chartLead: "Har bir ustun — o'sha kuni havolalaringizni ochgan odamlar. Oldindan ko'rish robotlari va bir odamning qayta ochishlari hisoblanmaydi.",
  chartLeadMark: "nuqta — shu kuni so'rov kelgan",
  chartTip: (day, clicks, leads) => `${day}: o'tishlar ${clicks}${leads ? `, so'rovlar ${leads}` : ""}`,

  linksTitle: "Mening havolalarim",
  linksLead:
    "Har bir kanal uchun — alohida qisqa havola. Shunda mijozlar qayerdan kelayotgani ko'rinadi, o'nta chatdagi bir xil havolani esa antispam kesmaydi.",
  colChannel: "Kanal",
  colLink: "Havola",
  colTarget: "Qayerga olib boradi",
  colClicks: "O'tishlar",
  colLeads: "So'rovlar",
  mainLink: "Asosiy",
  botLinkTitle: "To'g'ridan-to'g'ri Telegram-botga havola",
  copy: "Nusxa olish",
  copied: "Nusxa olindi",
  newLink: "Yangi havola",
  fieldLabel: "Kanal nomi",
  fieldLabelHint: "Masalan: Telegram-kanal, Instagram, xabarnoma",
  fieldTarget: "Qayerga olib boradi",
  fieldPerk: "Auditoriyangiz uchun bonus",
  fieldCode: "O'z kodingiz",
  fieldCodeHint: "Majburiy emas. Lotin harflari va raqamlar, 3–24 belgi",
  createLink: "Havola yaratish",
  targets: {
    "/": "Bosh sahifa",
    "/services": "Xizmatlar",
    "/calculator": "Kalkulyator",
    "/audit": "Saytni tekshirish",
    "/cases": "Keyslar",
    "/products": "Mahsulotlar",
    "/partners": "Hamkorlik dasturi",
    bot: "Telegram-bot",
  },
  perks: {
    none: "Bonussiz",
    disc_5: "Birinchi loyihaga 5 % chegirma",
    disc_10: "Birinchi loyihaga 10 % chegirma",
    disc_15: "Birinchi loyihaga 15 % chegirma",
  },
  linkResult: {
    ok: "Havola yaratildi — jadvaldan nusxa oling.",
    offline: "Xizmat hozir ishlamayapti. Bir daqiqadan keyin urinib ko'ring.",
    invalid: "Kod: lotin harflari, raqamlar, chiziqcha yoki pastki chiziq, 3–24 belgi.",
    reserved: "Bu kod band qilingan — boshqasini tanlang.",
    taken: "Bu kod allaqachon band — boshqasini o'ylab toping yoki maydonni bo'sh qoldiring.",
    limit: "Havolalar soni maksimal. Bizga yozing — ishlatilmaganlarini olib tashlaymiz.",
    failed: "Havola yaratib bo'lmadi. Yana urinib ko'ring.",
  },

  clientsTitle: "Mening mijozlarim",
  clientsLead:
    "Havolalaringiz orqali so'rov qoldirgan barcha. Mijoz kontaktlarini ko'rsatmaymiz — faqat bosqich va sizning pulingiz. Ulush — loyiha summasidan uning pog'onasi stavkasi bo'yicha foiz.",
  clientsEmpty: "Hozircha hech kim yo'q. Havolani ulashing — birinchi mijoz so'rovdan keyin darhol shu yerda paydo bo'ladi.",
  colDate: "Sana",
  colClient: "Mijoz",
  colFrom: "Qayerdan",
  colStage: "Bosqich",
  colShare: "Sizning ulushingiz",
  unnamed: "Mijoz",
  stages: {
    lead: "So'rov",
    work: "Ishda",
    contract: "Shartnoma tayyorlanmoqda",
    signed: "Shartnoma imzolandi",
    paid: "To'landi",
    lost: "Bo'lmadi",
  },
  shareFrozen: (amount) => `${amount} · to'liq to'lovdan keyin`,
  shareEarned: (amount) => `${amount} · hisoblandi`,
  notCounted: (reason) => `hisobga olinmadi: ${reason}`,
  voidReasons: {
    self: "so'rov sizning o'zingizdan",
    existing_client: "mijoz studiya bilan avval ishlagan",
    blocked: "hamkorlik to'xtatilgan",
  },

  payoutTitle: "To'lov",
  payoutRules: (min) =>
    `Yechib olish — ${min} dan, oyning birinchi ish kunidan. Pulni studiya egasi o'tkazadi: USDT (TRC-20) yoki rekvizitlar bo'yicha. Bir vaqtda bitta so'rov.`,
  payoutOpens: (date) => `Yechib olish ${date} dan ochiladi.`,
  requisites: "Qayerga to'lash",
  requisitesHint: "USDT TRC-20 manzili yoki rekvizitlar so'z bilan",
  saveRequisites: "Saqlash",
  requestPayout: (amount) => `${amount} to'lovni so'rash`,
  payoutResult: {
    ok: "So'rov qabul qilindi. Pul yuborilganda bot sizga yozadi.",
    saved: "Rekvizitlar saqlandi.",
    bad_requisites: "USDT TRC-20 manzili yoki rekvizitlarga o'xshamaydi. Tekshirib, yana saqlang.",
    offline: "Xizmat hozir ishlamayapti. Bir daqiqadan keyin urinib ko'ring.",
    window: "Yechib olish oyning birinchi ish kunidan ochiladi — to'lovlar solishtirilgandan keyin.",
    requisites: "Avval qayerga to'lashni ko'rsating.",
    pending: "Bitta so'rov allaqachon qarorni kutmoqda — uning ustidan ikkinchisini berib bo'lmaydi.",
    min: "Mavjud summa minimal to'lovdan kam. Mijozning keyingi to'lovini kuting.",
    failed: "So'rovni berib bo'lmadi. Yana urinib ko'ring.",
  },
  historyTitle: "To'lovlar tarixi",
  payoutStatus: { requested: "Ko'rib chiqilmoqda", paid: "To'landi", rejected: "Rad etildi" },

  promoTitle: "Tayyor matnlar",
  promoLead:
    "Nusxa olib, joylashtiring — havola ichida. Eng yaxshisi shaxsiy tavsiya: nega bizga ishonishingiz haqida bitta gap qo'shing.",
  promo: [
    {
      title: "Kanal uchun post",
      text: (link) =>
        `Sayt, internet-do'kon yoki Telegram-bot kerak bo'lsa — DevUz Studio ni tavsiya qilaman. Kalit topshirish asosida qilishadi, sayt hozir qancha so'rovni yo'qotayotganini va nima qilish kerakligini ko'rsatishadi. Saytingizni tekshirish va vazifani muhokama qilish: ${link}`,
    },
    {
      title: "Shaxsiy xabar",
      text: (link) =>
        `Sayt kerakligini aytgan edingiz. DevUz Studio ni ko'ring — avval nima noto'g'riligini bepul tahlil qilishadi, keyingina narx aytishadi: ${link}`,
    },
    {
      title: "Qisqa — storis uchun",
      text: (link) => `So'rov olib keladigan saytlar va botlar. Tahlil bepul: ${link}`,
    },
  ],

  howTitle: "Bu qanday ishlaydi",
  how: [
    "Qisqa havolani ulashing — har bir kanal uchun alohida.",
    "Odam havolani ochadi — sayt sizni 30 kun eslab qoladi. Shu vaqt ichida u saytda so'rov qoldirsa yoki botga yozsa, mijoz sizniki, hatto keyin havolasiz qaytib kelgan bo'lsa ham.",
    "Bosqichlar shu yerda ko'rinadi: so'rov, ish, shartnoma, to'lov. Shartnoma imzolanganda va mijoz to'laganda bot o'zi sizga yozadi.",
    "Mijoz loyihani to'liq to'lagach, ulush yechib olish uchun ochiladi — oyning birinchi ish kunidan.",
  ],
  botNote: (bot) => `So'rovlar, shartnomalar va to'lovlar haqidagi xabarlar @${bot} Telegram-botiga keladi.`,
};

const zh: CabinetCopy = {
  title: "合作伙伴后台",
  signedOutTitle: "合作伙伴登录",
  signedOutLead: "通过 Telegram 登录：机器人会发给您一个打开后台的按钮。还不是合作伙伴？机器人会立即为您注册——免费，且没有任何义务。",
  signIn: "通过 Telegram 登录",
  signInHint: "将打开我们的机器人。点击 “Start”——您会收到一个登录按钮，15 分钟内有效。",
  errors: {
    expired: "登录链接已过期或已被使用。请再次点击 “通过 Telegram 登录”——机器人会发送新的链接。",
    offline: "服务暂时不可用，请一分钟后再试。",
  },
  hello: (name) => `您好，${name}`,
  logout: "退出",
  rate: (from, to) => `您的提成：客户项目金额的 ${from}–${to}%——项目越大，比例越高`,
  personalRate: (percent) => `您的专属提成：每个客户项目金额的 ${percent}%`,
  tiersTitle: "提成比例",
  tierUpTo: (amount) => `${amount} 以内`,
  tierOver: (amount) => `超过 ${amount}`,
  tiersNote: "按每个项目的金额分别计算，客户的每个项目都算，包括后续项目。",

  statClicks: "30 天点击",
  statLeads: "申请总数",
  statSigned: "已签合同",
  statPaid: "已付款项目",
  statEarned: "已赚取",
  statFrozen: "等待客户付款",
  statAvailable: "可提现",
  statPaidOut: "已支付",

  chartTitle: "30 天点击",
  chartLead: "每根柱子代表当天打开您链接的人数。链接预览机器人和同一个人的重复打开不计入。",
  chartLeadMark: "圆点——当天有申请",
  chartTip: (day, clicks, leads) => `${day}：点击 ${clicks}${leads ? `，申请 ${leads}` : ""}`,

  linksTitle: "我的链接",
  linksLead: "每个渠道一个短链接。这样可以看到客户来自哪里，同一链接发到十个群也不会被反垃圾过滤。",
  colChannel: "渠道",
  colLink: "链接",
  colTarget: "目标页面",
  colClicks: "点击",
  colLeads: "申请",
  mainLink: "主链接",
  botLinkTitle: "直达 Telegram 机器人的链接",
  copy: "复制",
  copied: "已复制",
  newLink: "新链接",
  fieldLabel: "渠道名称",
  fieldLabelHint: "例如：Telegram 频道、Instagram、邮件列表",
  fieldTarget: "目标页面",
  fieldPerk: "给您受众的优惠",
  fieldCode: "自定义代码",
  fieldCodeHint: "可选。拉丁字母和数字，3–24 个字符",
  createLink: "创建链接",
  targets: {
    "/": "首页",
    "/services": "服务",
    "/calculator": "计算器",
    "/audit": "网站检测",
    "/cases": "案例",
    "/products": "产品",
    "/partners": "合作伙伴计划",
    bot: "Telegram 机器人",
  },
  perks: {
    none: "无优惠",
    disc_5: "首个项目 5% 折扣",
    disc_10: "首个项目 10% 折扣",
    disc_15: "首个项目 15% 折扣",
  },
  linkResult: {
    ok: "链接已创建——请在表格中复制。",
    offline: "服务暂时不可用，请一分钟后再试。",
    invalid: "代码：拉丁字母、数字、连字符或下划线，3–24 个字符。",
    reserved: "该代码已被保留——请换一个。",
    taken: "该代码已被占用——请换一个或留空。",
    limit: "链接数量已达上限。请联系我们删除不用的链接。",
    failed: "无法创建链接，请重试。",
  },

  clientsTitle: "我的客户",
  clientsLead: "所有通过您的链接提交申请的人。我们不显示客户的联系方式——只显示阶段和您的收入。分成 = 项目金额 × 该档位的比例。",
  clientsEmpty: "暂无客户。分享您的链接——第一个客户提交申请后会立即出现在这里。",
  colDate: "日期",
  colClient: "客户",
  colFrom: "来源",
  colStage: "阶段",
  colShare: "您的分成",
  unnamed: "客户",
  stages: {
    lead: "申请",
    work: "进行中",
    contract: "准备合同",
    signed: "合同已签",
    paid: "已付款",
    lost: "未成交",
  },
  shareFrozen: (amount) => `${amount} · 全额付款后`,
  shareEarned: (amount) => `${amount} · 已入账`,
  notCounted: (reason) => `不计入：${reason}`,
  voidReasons: {
    self: "申请来自您本人",
    existing_client: "客户此前已与工作室合作",
    blocked: "合作已暂停",
  },

  payoutTitle: "提现",
  payoutRules: (min) => `最低提现 ${min}，每月第一个工作日起可申请。由工作室负责人转账：USDT (TRC-20) 或银行信息。每次只能有一个申请。`,
  payoutOpens: (date) => `提现将于 ${date} 开放。`,
  requisites: "收款方式",
  requisitesHint: "USDT TRC-20 地址或文字形式的银行信息",
  saveRequisites: "保存",
  requestPayout: (amount) => `申请提现 ${amount}`,
  payoutResult: {
    ok: "申请已受理。款项发出后，机器人会通知您。",
    saved: "收款信息已保存。",
    bad_requisites: "这看起来不像 USDT TRC-20 地址或银行信息。请检查后重新保存。",
    offline: "服务暂时不可用，请一分钟后再试。",
    window: "提现在每月第一个工作日开放——在核对付款之后。",
    requisites: "请先填写收款方式。",
    pending: "已有一个申请在等待处理——不能再提交第二个。",
    min: "可提现金额低于最低提现额。请等待客户的下一笔付款。",
    failed: "无法提交申请，请重试。",
  },
  historyTitle: "提现记录",
  payoutStatus: { requested: "审核中", paid: "已支付", rejected: "已拒绝" },

  promoTitle: "现成文案",
  promoLead: "复制粘贴即可——链接已包含在内。个人推荐效果最好：加一句您为什么信任我们。",
  promo: [
    {
      title: "频道帖子",
      text: (link) =>
        `如果您需要网站、网店或 Telegram 机器人，我推荐 DevUz Studio。他们提供一站式开发，并会告诉您网站目前流失了多少询盘以及如何改进。检测您的网站并讨论需求：${link}`,
    },
    {
      title: "私信",
      text: (link) => `你之前说需要做网站。看看 DevUz Studio——他们先免费分析现在的问题，然后才报价：${link}`,
    },
    {
      title: "简短版——用于快拍",
      text: (link) => `能带来询盘的网站和机器人。免费分析：${link}`,
    },
  ],

  howTitle: "运作方式",
  how: [
    "分享短链接——每个渠道单独一个。",
    "有人打开您的链接——网站会记住您 30 天。在此期间他在网站上提交申请或给机器人发消息，客户就是您的，即使他之后没通过链接再次访问。",
    "在这里可以看到各个阶段：申请、进行中、合同、付款。合同签订和客户付款时，机器人会主动通知您。",
    "客户全额支付项目后，您的分成即可提现——从每月第一个工作日开始。",
  ],
  botNote: (bot) => `申请、合同和提现的通知会发送到 Telegram 机器人 @${bot}。`,
};

const copies: Record<Locale, CabinetCopy> = { ru, en, uz, zh };

export function cabinetCopy(locale: Locale): CabinetCopy {
  return copies[locale];
}
