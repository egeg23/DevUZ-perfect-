import type { Locale } from "@/lib/i18n";
import type { ClientFailure } from "@/lib/partners/rules";
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
  /** Ставка без персональной: модель и вилка процентов. */
  rate: (model: "profit" | "turnover", from: number, to: number) => string;
  personalRate: (percent: number) => string;
  tiersTitle: string;
  tierUpTo: (amount: string) => string;
  tierOver: (amount: string) => string;
  tiersNote: string;
  colRange: string;
  modelNames: Record<"profit" | "turnover", string>;
  modelHints: Record<"profit" | "turnover", string>;
  modelCurrent: string;
  modelChoose: (name: string) => string;
  modelNext: (date: string) => string;
  modelFixed: string;
  modelResult: Record<"ok" | "same" | "too_soon" | "invalid" | "offline" | "failed", string>;

  agenciesTitle: string;
  agenciesLead: string;
  agencyName: string;
  agencyContact: string;
  agencyContactHint: string;
  agencyWebsite: string;
  agencyNote: string;
  agencyAdd: string;
  agenciesEmpty: string;
  agencyStatus: Record<"pending" | "active" | "rejected", string>;
  /** Срок агентства: 12 месяцев с подтверждения (AGENCY_TERM_MONTHS). */
  agencyUntil: (date: string) => string;
  agencyExpired: (date: string) => string;
  agencyResult: Record<"ok" | "offline" | "invalid" | "limit" | "duplicate" | "failed", string>;
  viaAgency: (name: string) => string;
  /** Клиенты, закреплённые вручную по ИНН — без ссылки. */
  claimsTitle: string;
  claimsLead: string;
  clientName: string;
  clientInn: string;
  clientInnHint: string;
  clientContactName: string;
  clientPhone: string;
  clientTelegram: string;
  clientWebsite: string;
  clientNote: string;
  clientNoteHint: string;
  clientAdd: string;
  claimsEmpty: string;
  claimsLimit: (used: number, max: number) => string;
  clientWaiting: (date: string) => string;
  clientActive: (date: string) => string;
  clientExpired: string;
  clientCancelled: (note: string | null) => string;
  clientResult: Record<"ok" | ClientFailure, string>;
  viaClient: (name: string) => string;

  decksTitle: string;
  decksLead: string;
  decks: Record<"studio" | "program", { title: string; text: string }>;
  deckOpen: string;
  deckCopy: string;

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

  /** Копилка: тумблер «не забирать автоматически» и ступень по общей сумме. */
  poolTitle: string;
  poolToggle: string;
  poolLead: string;
  poolOffNote: string;
  poolState: (amount: string, percent: number) => string;
  poolNext: (left: string, percent: number) => string;
  poolTop: string;
  poolEmpty: string;
  poolMark: string;
  poolResult: Record<"on" | "off" | "failed", string>;
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

  mediaTitle: string;
  mediaLead: string;
  mediaDownload: string;
  mediaCopyCaption: string;
  mediaCaptionTitle: string;
  /** Подпись к посту, если владелец не написал свою. */
  mediaCaption: (link: string) => string;
  mediaShape: Record<"vertical" | "square" | "horizontal", string>;
  mediaLang: Record<"all" | "ru" | "uz" | "en" | "zh", string>;
  mediaSeconds: string;
  mediaMb: string;
  mediaGone: string;

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
  rate: (model, from, to) =>
    model === "turnover"
      ? `Ваша модель — с оборота: от ${from} до ${to} % от суммы договора, чем крупнее проект, тем выше процент`
      : `Ваша модель — от чистой прибыли: от ${from} до ${to} % от прибыли проекта, чем крупнее проект, тем выше процент`,
  personalRate: (percent) => `Ваша персональная ставка — ${percent} % с каждого проекта клиента`,
  tiersTitle: "Модель дохода",
  tierUpTo: (amount) => `до ${amount}`,
  tierOver: (amount) => `дороже ${amount}`,
  tiersNote: "Ступень — по сумме каждого проекта отдельно. Процент — с каждого проекта клиента, включая следующие.",
  colRange: "Сумма проекта",
  modelNames: { profit: "От чистой прибыли", turnover: "С оборота" },
  modelHints: {
    profit: "Процент выше, но считается от прибыли: сумма договора минус налог и себестоимость. Точная сумма доли появится, когда студия внесёт себестоимость.",
    turnover: "Процент ниже, но от всей суммы договора: доля известна сразу, как только подписан договор.",
  },
  modelCurrent: "сейчас",
  modelChoose: (name) => `Перейти на «${name}»`,
  modelNext: (date) => `Сменить модель снова можно с ${date}.`,
  modelFixed: "Менять модель можно раз в неделю. За клиентом закрепляется модель, которая действовала в день его заявки: смена действует на новых клиентов, а уже пришедших не пересчитывает.",
  modelResult: {
    ok: "Модель сменена. Она действует на клиентов, которые придут с этого момента.",
    same: "Эта модель у вас уже выбрана.",
    too_soon: "Модель можно менять раз в неделю — дата следующей смены указана ниже.",
    invalid: "Такой модели нет.",
    offline: "Сервис сейчас недоступен. Попробуйте через минуту.",
    failed: "Не получилось сменить модель. Попробуйте ещё раз.",
  },

  agenciesTitle: "Агентства и компании",
  agenciesLead:
    "Подключите агентство или компанию, откуда регулярно идут заказы на разработку: IT-компанию, веб-студию, маркетинговое или дизайн-агентство, интегратора, генподрядчика IT-тендеров. Она отдаёт нам заказы на субподряд, и после нашего подтверждения все её заказы — ваши в течение 12 месяцев, без ограничения в 30 дней: и первый, и каждый следующий. Ссылка ей не нужна — мы узнаём её заказы по контакту и названию.",
  agencyName: "Название компании",
  agencyContact: "Контакт компании",
  agencyContactHint: "@telegram, телефон или почта — откуда оно будет нам писать",
  agencyWebsite: "Сайт",
  agencyNote: "Комментарий",
  agencyAdd: "Подключить компанию",
  agenciesEmpty: "Агентств пока нет. Презентация программы для агентств — ниже, её можно отправить им ссылкой.",
  agencyStatus: { pending: "ждёт подтверждения", active: "подключено — заказы ваши", rejected: "не подключено" },
  agencyUntil: (date) => `до ${date}`,
  agencyExpired: (date) => `срок вышел ${date} — новые заказы не засчитываются`,
  agencyResult: {
    ok: "Агентство отправлено на подтверждение. Как только подтвердим — бот напишет вам.",
    offline: "Сервис сейчас недоступен. Попробуйте через минуту.",
    invalid: "Нужны название и контакт агентства.",
    limit: "Агентств уже максимум. Напишите нам — обсудим.",
    duplicate: "Это агентство уже подключено — вами или другим партнёром.",
    failed: "Не получилось подключить агентство. Попробуйте ещё раз.",
  },
  viaAgency: (name) => `агентство «${name}»`,

  claimsTitle: "Мои клиенты",
  claimsLead:
    "Приводите компанию сами, без ссылки? Закрепите её здесь: название, как с ней связаться и ИНН, если знаете. Проверяем по названию; если такое название уже встречалось — по ИНН. Закрепление действует сразу — если с этой компанией студия ещё не работала и не связывалась и её не закрепил другой партнёр. Закрепили — клиент сразу уходит нашим менеджерам приоритетной заявкой, и с ним свяжутся. Все заказы этой компании ваши 12 месяцев, как по ссылке. В месяц можно закрепить до 20 компаний.",
  clientName: "Название компании",
  clientInn: "ИНН (СТИР), если знаете",
  clientInnHint: "9 цифр; для других стран — до 12. Не знаете — оставьте пустым",
  clientContactName: "Контактное лицо",
  clientPhone: "Телефон",
  clientTelegram: "Telegram",
  clientWebsite: "Сайт",
  clientNote: "Что нужно клиенту",
  clientNoteHint: "сайт, бот, CRM… — коротко",
  clientAdd: "Закрепить клиента",
  claimsEmpty: "Закреплённых клиентов пока нет.",
  claimsLimit: (used, max) => `В этом месяце закреплено ${used} из ${max}.`,
  clientWaiting: (date) => `закреплён · ждём первую заявку до ${date}`,
  clientActive: (date) => `заявка пришла · заказы ваши до ${date}`,
  clientExpired: "срок вышел — новые заказы не засчитываются",
  clientCancelled: (note) => `закрепление отменено${note ? ` · ${note}` : ""}`,
  clientResult: {
    ok: "Клиент закреплён за вами и передан менеджерам — с ним свяжутся. Этапы — в таблице клиентов ниже, бот напишет о договоре и оплате.",
    offline: "Сервис сейчас недоступен. Попробуйте через минуту.",
    blocked: "Партнёрство приостановлено — закреплять клиентов нельзя. Напишите нам.",
    name: "Укажите название компании.",
    inn: "ИНН — только цифры: 9 для Узбекистана, до 12 для других стран.",
    need_inn: "Компания с таким названием у нас уже есть. Укажите ИНН — по нему отличим, та же это компания или другая.",
    contact: "Укажите телефон или Telegram клиента — хотя бы одно.",
    limit: "В этом месяце уже закреплено 20 компаний. Следующие — с начала месяца.",
    studio: "Эта компания уже есть у студии: с ней работаем или уже связывались. Закрепить её нельзя.",
    taken: "Эту компанию уже закрепил другой партнёр.",
    mine: "Эта компания уже закреплена за вами.",
    failed: "Не получилось закрепить. Попробуйте ещё раз.",
  },
  viaClient: (name) => `закреплён: «${name}»`,

  decksTitle: "Презентации",
  decksLead: "Отправьте ссылкой или сохраните в PDF (кнопка на странице). В ссылке уже ваш код: кто откроет её и оставит заявку в течение 30 дней, будет вашим клиентом.",
  decks: {
    studio: { title: "DevUz Studio", text: "Кто мы, что делаем, штат, языки, сроки, цены «от» и проекты — для клиента, которому вы нас рекомендуете." },
    program: { title: "Программа для агентств и компаний", text: "Как агентству, IT-компании или генподрядчику тендеров отдавать нам заказы на субподряд и как это считается." },
  },
  deckOpen: "Открыть",
  deckCopy: "Скопировать ссылку",

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

  poolTitle: "Копилка",
  poolToggle: "Не забирать в автоматическом режиме",
  poolLead:
    "Чем больше скопили — тем больше выплата по итогу. Пока тумблер включён, деньги за оплаченные проекты не уходят вам сразу, а копятся, и ставка по ним считается по общей сумме проектов в копилке — по той же таблице «до … — %», что выше. Например, три проекта по 2 000 $ вместе — это 6 000 $, и по всем трём ставка третьей ступени вместо первой. Забираете, когда решите, — кнопкой «Запросить выплату»; после выплаты копилка начинается с нуля, а выплаченное остаётся по повышенной ставке.",
  poolOffNote:
    "Если выключить, повышение пропадёт: невыплаченное посчитается по обычной ставке каждого проекта, а выплаты с оборота снова будут приходить сами.",
  poolState: (amount, percent) => `В копилке проекты на ${amount} — ставка ${percent} %.`,
  poolNext: (left, percent) => `Ещё проектов на ${left} — и ставка станет ${percent} %.`,
  poolTop: "Это верхняя ступень таблицы.",
  poolEmpty: "Копилка пока пуста — сюда лягут проекты, когда клиенты оплатят их целиком.",
  poolMark: "ставка копилки",
  poolResult: {
    on: "Копилка включена: оплаченные проекты копятся, ставка растёт с общей суммой.",
    off: "Копилка выключена: выплаты снова приходят как обычно.",
    failed: "Не получилось переключить. Попробуйте ещё раз.",
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

  mediaTitle: "Промо-материалы",
  mediaLead:
    "Ролики и картинки студии для ваших соцсетей. Скачайте, выложите в Reels, Shorts, TikTok, сторис или канал и вставьте подпись — ваша короткая ссылка в ней уже стоит. Клиенты, пришедшие по ней, засчитываются вам, как по любой вашей ссылке.",
  mediaDownload: "Скачать",
  mediaCopyCaption: "Скопировать подпись",
  mediaCaptionTitle: "Подпись к посту",
  mediaCaption: (link) =>
    `DevUz Studio делает сайты, интернет-магазины и Telegram-ботов, которые приносят заявки. Бесплатно разберут ваш сайт и покажут, что исправить: ${link}`,
  mediaShape: { vertical: "вертикальное 9:16", square: "квадрат", horizontal: "горизонтальное 16:9" },
  mediaLang: { all: "без слов", ru: "на русском", uz: "на узбекском", en: "на английском", zh: "на китайском" },
  mediaSeconds: "с",
  mediaMb: "МБ",
  mediaGone: "Этот материал убрали из кабинета — возьмите другой.",

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
  rate: (model, from, to) =>
    model === "turnover"
      ? `Your model is turnover: ${from}–${to}% of the contract amount, the bigger the project, the higher the rate`
      : `Your model is net profit: ${from}–${to}% of the project's profit, the bigger the project, the higher the rate`,
  personalRate: (percent) => `Your personal rate is ${percent}% of every client project`,
  tiersTitle: "Income model",
  tierUpTo: (amount) => `up to ${amount}`,
  tierOver: (amount) => `over ${amount}`,
  tiersNote: "The tier depends on each project's amount separately. The percentage applies to every project of the client, including the next ones.",
  colRange: "Project amount",
  modelNames: { profit: "Of net profit", turnover: "Of turnover" },
  modelHints: {
    profit: "A higher percentage, but of profit: the contract amount minus tax and costs. The exact share appears once the studio enters its costs.",
    turnover: "A lower percentage, but of the whole contract amount: your share is known as soon as the contract is signed.",
  },
  modelCurrent: "current",
  modelChoose: (name) => `Switch to “${name}”`,
  modelNext: (date) => `You can change the model again from ${date}.`,
  modelFixed: "You can change the model once a week. A client keeps the model that was active on the day of their request: a change applies to new clients and doesn't recalculate existing ones.",
  modelResult: {
    ok: "Model changed. It applies to clients who come from now on.",
    same: "This model is already selected.",
    too_soon: "The model can be changed once a week — the next date is shown below.",
    invalid: "No such model.",
    offline: "The service is unavailable right now. Try again in a minute.",
    failed: "Couldn't change the model. Try again.",
  },

  agenciesTitle: "Agencies & companies",
  agenciesLead:
    "Connect an agency or company that regularly has development orders: an IT company, web studio, marketing or design agency, integrator, or a prime contractor in IT tenders. It passes orders to us on a subcontract basis, and once we confirm it, all its orders are yours for 12 months, with no 30-day limit: the first one and every next one. It doesn't need a link — we recognise its orders by contact and name.",
  agencyName: "Company name",
  agencyContact: "Company contact",
  agencyContactHint: "@telegram, phone or email — where it will write to us from",
  agencyWebsite: "Website",
  agencyNote: "Comment",
  agencyAdd: "Connect company",
  agenciesEmpty: "No agencies yet. The program deck for agencies is below — you can send it to them as a link.",
  agencyStatus: { pending: "awaiting confirmation", active: "connected — orders are yours", rejected: "not connected" },
  agencyUntil: (date) => `until ${date}`,
  agencyExpired: (date) => `term ended ${date} — new orders no longer count`,
  agencyResult: {
    ok: "The agency has been sent for confirmation. Once we confirm it, the bot will message you.",
    offline: "The service is unavailable right now. Try again in a minute.",
    invalid: "The agency's name and contact are required.",
    limit: "You've reached the agency limit. Write to us to discuss.",
    duplicate: "This agency is already connected — by you or another partner.",
    failed: "Couldn't connect the agency. Try again.",
  },
  viaAgency: (name) => `agency “${name}”`,

  claimsTitle: "My clients",
  claimsLead:
    "Bringing a company yourself, without a link? Register it here: the name, how to reach it and the tax ID if you know it. We check by name; if that name has come up before — by tax ID. It's yours immediately — as long as the studio hasn't worked with or contacted this company before and no other partner has registered it. Once registered, the client goes straight to our managers as a priority request, and they will contact them. All orders from this company are yours for 12 months, just like via a link. Up to 20 companies a month.",
  clientName: "Company name",
  clientInn: "Tax ID (INN / STIR), if you know it",
  clientInnHint: "9 digits; up to 12 for other countries. Don't know it — leave blank",
  clientContactName: "Contact person",
  clientPhone: "Phone",
  clientTelegram: "Telegram",
  clientWebsite: "Website",
  clientNote: "What the client needs",
  clientNoteHint: "website, bot, CRM… — briefly",
  clientAdd: "Register client",
  claimsEmpty: "No registered clients yet.",
  claimsLimit: (used, max) => `Registered this month: ${used} of ${max}.`,
  clientWaiting: (date) => `registered · waiting for the first request until ${date}`,
  clientActive: (date) => `request received · orders are yours until ${date}`,
  clientExpired: "term ended — new orders no longer count",
  clientCancelled: (note) => `registration cancelled${note ? ` · ${note}` : ""}`,
  clientResult: {
    ok: "The client is registered to you and handed to our managers — they will get in touch. Stages are in the clients table below; the bot will message you about the contract and payment.",
    offline: "The service is unavailable right now. Try again in a minute.",
    blocked: "Your partnership is paused — you can't register clients. Write to us.",
    name: "Enter the company name.",
    inn: "Tax ID — digits only: 9 for Uzbekistan, up to 12 for other countries.",
    need_inn: "We already have a company with this name. Enter the tax ID — it tells us whether it's the same company or another one.",
    contact: "Enter the client's phone or Telegram — at least one.",
    limit: "You've already registered 20 companies this month. More from the start of next month.",
    studio: "The studio already knows this company: we work with it or have contacted it. It can't be registered.",
    taken: "Another partner has already registered this company.",
    mine: "This company is already registered to you.",
    failed: "Couldn't register the client. Try again.",
  },
  viaClient: (name) => `registered: “${name}”`,

  decksTitle: "Presentations",
  decksLead: "Send as a link or save as PDF (button on the page). Your code is already in the link: whoever opens it and leaves a request within 30 days becomes your client.",
  decks: {
    studio: { title: "DevUz Studio", text: "Who we are, what we do, team, languages, timelines, starting prices and projects — for a client you recommend us to." },
    program: { title: "Program for agencies & companies", text: "How an agency, IT company or tender prime contractor passes orders to us on a subcontract basis and how it's counted." },
  },
  deckOpen: "Open",
  deckCopy: "Copy link",

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

  poolTitle: "Savings",
  poolToggle: "Don't withdraw automatically",
  poolLead:
    "The more you save, the bigger the final payout. While the switch is on, money for paid projects isn't sent to you right away — it accumulates, and the rate is based on the total of the projects in your savings, using the same “up to … — %” table above. For example, three $2,000 projects together are $6,000, so all three get the third-tier rate instead of the first. Withdraw whenever you decide with “Request payout”; after a payout the savings start from zero, and what was paid stays at the higher rate.",
  poolOffNote:
    "If you turn it off, the boost is lost: unpaid amounts are counted at each project's regular rate, and turnover payouts start arriving automatically again.",
  poolState: (amount, percent) => `Projects worth ${amount} in your savings — rate ${percent}%.`,
  poolNext: (left, percent) => `Another ${left} in projects — and the rate becomes ${percent}%.`,
  poolTop: "This is the top tier of the table.",
  poolEmpty: "Your savings are empty for now — projects land here once clients pay them in full.",
  poolMark: "savings rate",
  poolResult: {
    on: "Savings on: paid projects accumulate, and the rate grows with the total.",
    off: "Savings off: payouts arrive as usual again.",
    failed: "Couldn't switch. Try again.",
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

  mediaTitle: "Promo materials",
  mediaLead:
    "Studio videos and images for your social media. Download, post to Reels, Shorts, TikTok, stories or your channel and paste the caption — your short link is already in it. Clients who come through it count as yours, like with any of your links.",
  mediaDownload: "Download",
  mediaCopyCaption: "Copy caption",
  mediaCaptionTitle: "Post caption",
  mediaCaption: (link) =>
    `DevUz Studio builds websites, online stores and Telegram bots that bring in requests. They'll review your website for free and show what to fix: ${link}`,
  mediaShape: { vertical: "vertical 9:16", square: "square", horizontal: "horizontal 16:9" },
  mediaLang: { all: "no words", ru: "in Russian", uz: "in Uzbek", en: "in English", zh: "in Chinese" },
  mediaSeconds: "s",
  mediaMb: "MB",
  mediaGone: "This material was removed from the cabinet — take another one.",

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
  rate: (model, from, to) =>
    model === "turnover"
      ? `Sizning modelingiz — aylanmadan: shartnoma summasining ${from} dan ${to} % gacha, loyiha qanchalik yirik bo'lsa, foiz shunchalik yuqori`
      : `Sizning modelingiz — sof foydadan: loyiha foydasining ${from} dan ${to} % gacha, loyiha qanchalik yirik bo'lsa, foiz shunchalik yuqori`,
  personalRate: (percent) => `Sizning shaxsiy stavkangiz — mijozning har bir loyihasidan ${percent} %`,
  tiersTitle: "Daromad modeli",
  tierUpTo: (amount) => `${amount} gacha`,
  tierOver: (amount) => `${amount} dan yuqori`,
  tiersNote: "Pog'ona har bir loyiha summasiga qarab alohida. Foiz mijozning har bir loyihasidan, keyingilarini ham qo'shib.",
  colRange: "Loyiha summasi",
  modelNames: { profit: "Sof foydadan", turnover: "Aylanmadan" },
  modelHints: {
    profit: "Foiz yuqoriroq, lekin foydadan hisoblanadi: shartnoma summasi minus soliq va tannarx. Aniq ulush studiya tannarxni kiritganda paydo bo'ladi.",
    turnover: "Foiz pastroq, lekin butun shartnoma summasidan: ulush shartnoma imzolanishi bilanoq ma'lum.",
  },
  modelCurrent: "hozir",
  modelChoose: (name) => `«${name}» ga o'tish`,
  modelNext: (date) => `Modelni yana ${date} dan o'zgartirish mumkin.`,
  modelFixed: "Modelni haftasiga bir marta o'zgartirish mumkin. Mijozga uning so'rovi kunidagi model biriktiriladi: o'zgartirish yangi mijozlarga ta'sir qiladi, kelganlarini qayta hisoblamaydi.",
  modelResult: {
    ok: "Model o'zgartirildi. U shu paytdan keladigan mijozlarga ta'sir qiladi.",
    same: "Bu model allaqachon tanlangan.",
    too_soon: "Modelni haftasiga bir marta o'zgartirish mumkin — keyingi sana quyida.",
    invalid: "Bunday model yo'q.",
    offline: "Xizmat hozir ishlamayapti. Bir daqiqadan keyin urinib ko'ring.",
    failed: "Modelni o'zgartirib bo'lmadi. Yana urinib ko'ring.",
  },

  agenciesTitle: "Agentliklar va kompaniyalar",
  agenciesLead:
    "Ishlab chiqish bo'yicha buyurtmalari muntazam bo'ladigan agentlik yoki kompaniyani ulang: IT-kompaniya, veb-studiya, marketing yoki dizayn agentligi, integrator, IT-tenderlardagi bosh pudratchi. U bizga buyurtmalarni subpudratga beradi va biz tasdiqlaganimizdan keyin 12 oy davomida uning barcha buyurtmalari sizniki, 30 kunlik cheklovsiz: birinchisi ham, har bir keyingisi ham. Unga havola kerak emas — buyurtmalarini kontakt va nomi bo'yicha taniymiz.",
  agencyName: "Kompaniya nomi",
  agencyContact: "Kompaniya kontakti",
  agencyContactHint: "@telegram, telefon yoki pochta — bizga qayerdan yozadi",
  agencyWebsite: "Sayt",
  agencyNote: "Izoh",
  agencyAdd: "Kompaniyani ulash",
  agenciesEmpty: "Hozircha agentliklar yo'q. Agentliklar uchun dastur taqdimoti quyida — uni havola bilan yuborish mumkin.",
  agencyStatus: { pending: "tasdiq kutmoqda", active: "ulangan — buyurtmalar sizniki", rejected: "ulanmagan" },
  agencyUntil: (date) => `${date} gacha`,
  agencyExpired: (date) => `muddat ${date} da tugadi — yangi buyurtmalar hisoblanmaydi`,
  agencyResult: {
    ok: "Agentlik tasdiqlashga yuborildi. Tasdiqlashimiz bilan bot sizga yozadi.",
    offline: "Xizmat hozir ishlamayapti. Bir daqiqadan keyin urinib ko'ring.",
    invalid: "Agentlik nomi va kontakti kerak.",
    limit: "Agentliklar soni maksimal. Bizga yozing — muhokama qilamiz.",
    duplicate: "Bu agentlik allaqachon ulangan — siz yoki boshqa hamkor tomonidan.",
    failed: "Agentlikni ulab bo'lmadi. Yana urinib ko'ring.",
  },
  viaAgency: (name) => `«${name}» agentligi`,

  claimsTitle: "Mening mijozlarim",
  claimsLead:
    "Kompaniyani havolasiz, o'zingiz olib kelyapsizmi? Uni shu yerda biriktiring: nomi, u bilan qanday bog'lanish va bilsangiz — STIR. Nomi bo'yicha tekshiramiz; bunday nom avval uchragan bo'lsa — STIR bo'yicha. Biriktirish darhol kuchga kiradi — agar studiya bu kompaniya bilan hali ishlamagan va bog'lanmagan bo'lsa, uni boshqa hamkor biriktirmagan bo'lsa. Biriktirdingiz — mijoz darhol menejerlarimizga ustuvor so'rov sifatida ketadi va u bilan bog'lanishadi. Bu kompaniyaning barcha buyurtmalari 12 oy sizniki, havola orqali kelgandek. Oyiga 20 tagacha kompaniya biriktirish mumkin.",
  clientName: "Kompaniya nomi",
  clientInn: "STIR (INN), bilsangiz",
  clientInnHint: "9 raqam; boshqa davlatlar uchun — 12 tagacha. Bilmasangiz — bo'sh qoldiring",
  clientContactName: "Mas'ul shaxs",
  clientPhone: "Telefon",
  clientTelegram: "Telegram",
  clientWebsite: "Sayt",
  clientNote: "Mijozga nima kerak",
  clientNoteHint: "sayt, bot, CRM… — qisqacha",
  clientAdd: "Mijozni biriktirish",
  claimsEmpty: "Hozircha biriktirilgan mijozlar yo'q.",
  claimsLimit: (used, max) => `Bu oy ${max} tadan ${used} tasi biriktirildi.`,
  clientWaiting: (date) => `biriktirilgan · birinchi so'rovni ${date} gacha kutamiz`,
  clientActive: (date) => `so'rov keldi · buyurtmalar ${date} gacha sizniki`,
  clientExpired: "muddat tugadi — yangi buyurtmalar hisoblanmaydi",
  clientCancelled: (note) => `biriktirish bekor qilindi${note ? ` · ${note}` : ""}`,
  clientResult: {
    ok: "Mijoz sizga biriktirildi va menejerlarga berildi — u bilan bog'lanishadi. Bosqichlar — quyidagi mijozlar jadvalida, bot shartnoma va to'lov haqida yozadi.",
    offline: "Xizmat hozir ishlamayapti. Bir daqiqadan keyin urinib ko'ring.",
    blocked: "Hamkorlik to'xtatilgan — mijoz biriktirib bo'lmaydi. Bizga yozing.",
    name: "Kompaniya nomini kiriting.",
    inn: "STIR — faqat raqamlar: O'zbekiston uchun 9 ta, boshqa davlatlar uchun 12 tagacha.",
    need_inn: "Bunday nomli kompaniya bizda allaqachon bor. STIRni kiriting — u bo'yicha bu o'sha kompaniyami yoki boshqasimi, ajratamiz.",
    contact: "Mijozning telefoni yoki Telegramini kiriting — kamida bittasini.",
    limit: "Bu oy 20 ta kompaniya allaqachon biriktirilgan. Keyingilari — oy boshidan.",
    studio: "Bu kompaniya studiyada allaqachon bor: u bilan ishlaymiz yoki bog'langanmiz. Uni biriktirib bo'lmaydi.",
    taken: "Bu kompaniyani boshqa hamkor allaqachon biriktirgan.",
    mine: "Bu kompaniya allaqachon sizga biriktirilgan.",
    failed: "Biriktirib bo'lmadi. Yana urinib ko'ring.",
  },
  viaClient: (name) => `biriktirilgan: «${name}»`,

  decksTitle: "Taqdimotlar",
  decksLead: "Havola bilan yuboring yoki PDF ga saqlang (sahifadagi tugma). Havolada kodingiz bor: uni ochib, 30 kun ichida so'rov qoldirgan kishi sizning mijozingiz bo'ladi.",
  decks: {
    studio: { title: "DevUz Studio", text: "Biz kimmiz, nima qilamiz, jamoa, tillar, muddatlar, boshlang'ich narxlar va loyihalar — bizni tavsiya qilgan mijozingiz uchun." },
    program: { title: "Agentliklar va kompaniyalar uchun dastur", text: "Agentlik, IT-kompaniya yoki tender bosh pudratchisi bizga buyurtmalarni subpudratga qanday beradi va bu qanday hisoblanadi." },
  },
  deckOpen: "Ochish",
  deckCopy: "Havoladan nusxa olish",

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

  poolTitle: "Jamg'arma",
  poolToggle: "Avtomatik rejimda olmaslik",
  poolLead:
    "Qancha ko'p jamg'arsangiz — yakuniy to'lov shuncha katta. Tugma yoqilgan paytda to'langan loyihalar uchun pul sizga darhol ketmaydi, balki jamlanadi va ular bo'yicha stavka jamg'armadagi loyihalarning umumiy summasi bo'yicha — yuqoridagi o'sha «… gacha — %» jadvali bo'yicha hisoblanadi. Masalan, 2 000 $ lik uchta loyiha birgalikda 6 000 $, va uchalasi bo'yicha birinchi emas, uchinchi pog'ona stavkasi. Xohlagan paytingizda «To'lovni so'rash» tugmasi bilan olasiz; to'lovdan keyin jamg'arma noldan boshlanadi, to'langani esa oshirilgan stavkada qoladi.",
  poolOffNote:
    "O'chirsangiz, oshirish yo'qoladi: to'lanmagan pul har bir loyihaning oddiy stavkasi bo'yicha hisoblanadi, aylanmadan to'lovlar esa yana o'zi keladi.",
  poolState: (amount, percent) => `Jamg'armada ${amount} lik loyihalar — stavka ${percent} %.`,
  poolNext: (left, percent) => `Yana ${left} lik loyiha — va stavka ${percent} % bo'ladi.`,
  poolTop: "Bu jadvalning eng yuqori pog'onasi.",
  poolEmpty: "Jamg'arma hozircha bo'sh — mijozlar loyihani to'liq to'lagach, ular shu yerga tushadi.",
  poolMark: "jamg'arma stavkasi",
  poolResult: {
    on: "Jamg'arma yoqildi: to'langan loyihalar jamlanadi, stavka umumiy summa bilan o'sadi.",
    off: "Jamg'arma o'chirildi: to'lovlar yana odatdagidek keladi.",
    failed: "Almashtirib bo'lmadi. Yana urinib ko'ring.",
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

  mediaTitle: "Promo materiallar",
  mediaLead:
    "Ijtimoiy tarmoqlaringiz uchun studiya roliklari va rasmlari. Yuklab oling, Reels, Shorts, TikTok, stories yoki kanalga joylang va izohni qo'ying — qisqa havolangiz unda allaqachon bor. U orqali kelgan mijozlar, har qanday havolangizdagi kabi, sizga yoziladi.",
  mediaDownload: "Yuklab olish",
  mediaCopyCaption: "Izohni nusxalash",
  mediaCaptionTitle: "Post izohi",
  mediaCaption: (link) =>
    `DevUz Studio so'rov olib keladigan saytlar, internet-do'konlar va Telegram-botlar yaratadi. Saytingizni bepul tahlil qilib, nimani tuzatish kerakligini ko'rsatishadi: ${link}`,
  mediaShape: { vertical: "vertikal 9:16", square: "kvadrat", horizontal: "gorizontal 16:9" },
  mediaLang: { all: "so'zsiz", ru: "rus tilida", uz: "o'zbek tilida", en: "ingliz tilida", zh: "xitoy tilida" },
  mediaSeconds: "s",
  mediaMb: "MB",
  mediaGone: "Bu material kabinetdan olib tashlangan — boshqasini oling.",

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
  rate: (model, from, to) =>
    model === "turnover"
      ? `您的模式：按营业额——合同金额的 ${from}–${to}%，项目越大，比例越高`
      : `您的模式：按净利润——项目利润的 ${from}–${to}%，项目越大，比例越高`,
  personalRate: (percent) => `您的专属提成：每个客户项目的 ${percent}%`,
  tiersTitle: "收益模式",
  tierUpTo: (amount) => `${amount} 以内`,
  tierOver: (amount) => `超过 ${amount}`,
  tiersNote: "档位按每个项目的金额分别确定。客户的每个项目都计算，包括后续项目。",
  colRange: "项目金额",
  modelNames: { profit: "按净利润", turnover: "按营业额" },
  modelHints: {
    profit: "比例更高，但按利润计算：合同金额减去税费和成本。工作室录入成本后才会显示确切金额。",
    turnover: "比例较低，但按整个合同金额计算：合同一签署，分成即可知。",
  },
  modelCurrent: "当前",
  modelChoose: (name) => `切换为“${name}”`,
  modelNext: (date) => `可于 ${date} 起再次更改模式。`,
  modelFixed: "模式每周可更改一次。客户按其提交申请当天生效的模式计算：更改只影响新客户，不会重新计算已有客户。",
  modelResult: {
    ok: "模式已更改，对此后到来的客户生效。",
    same: "您已选择该模式。",
    too_soon: "模式每周只能更改一次——下次日期见下方。",
    invalid: "没有这种模式。",
    offline: "服务暂时不可用，请一分钟后再试。",
    failed: "无法更改模式，请重试。",
  },

  agenciesTitle: "代理机构与公司",
  agenciesLead:
    "添加经常有开发订单的代理机构或公司：IT 公司、网站工作室、营销或设计代理机构、系统集成商、IT 招标的总包方。它把订单以分包形式交给我们，经我们确认后 12 个月内，它的所有订单都算您的，不受 30 天限制：第一个和之后的每一个都算。它不需要链接——我们通过联系方式和名称识别其订单。",
  agencyName: "公司名称",
  agencyContact: "公司联系方式",
  agencyContactHint: "@telegram、电话或邮箱——它将通过这里联系我们",
  agencyWebsite: "网站",
  agencyNote: "备注",
  agencyAdd: "添加公司",
  agenciesEmpty: "暂无代理机构。下方有面向代理机构的计划介绍，可以链接形式发送给他们。",
  agencyStatus: { pending: "等待确认", active: "已接入——订单归您", rejected: "未接入" },
  agencyUntil: (date) => `至 ${date}`,
  agencyExpired: (date) => `期限已于 ${date} 结束——新订单不再计入`,
  agencyResult: {
    ok: "代理机构已提交确认。确认后机器人会通知您。",
    offline: "服务暂时不可用，请一分钟后再试。",
    invalid: "需要填写代理机构名称和联系方式。",
    limit: "代理机构数量已达上限。请联系我们商议。",
    duplicate: "该代理机构已被接入——由您或其他合作伙伴。",
    failed: "无法添加代理机构，请重试。",
  },
  viaAgency: (name) => `代理机构“${name}”`,

  claimsTitle: "我的客户",
  claimsLead:
    "不通过链接、亲自带来公司？在这里登记：名称、联系方式，以及您知道的话——税号。我们按名称核对；如果该名称已出现过——按税号核对。登记立即生效——前提是工作室此前未与该公司合作或联系过，且没有其他合作伙伴登记过它。登记后，客户会立即作为优先询价转给我们的经理，由他们联系客户。该公司的所有订单 12 个月内都归您，与通过链接相同。每月最多可登记 20 家公司。",
  clientName: "公司名称",
  clientInn: "税号（INN / STIR），如果知道",
  clientInnHint: "9 位数字；其他国家最多 12 位。不知道可留空",
  clientContactName: "联系人",
  clientPhone: "电话",
  clientTelegram: "Telegram",
  clientWebsite: "网站",
  clientNote: "客户需要什么",
  clientNoteHint: "网站、机器人、CRM……简述即可",
  clientAdd: "登记客户",
  claimsEmpty: "暂无已登记的客户。",
  claimsLimit: (used, max) => `本月已登记 ${used} / ${max}。`,
  clientWaiting: (date) => `已登记 · 等待首个询价至 ${date}`,
  clientActive: (date) => `询价已到 · 订单归您至 ${date}`,
  clientExpired: "期限已过——新订单不再计入",
  clientCancelled: (note) => `登记已取消${note ? ` · ${note}` : ""}`,
  clientResult: {
    ok: "客户已登记在您名下并已转给经理——他们会联系客户。进度见下方客户表，签约和付款时机器人会通知您。",
    offline: "服务暂时不可用，请一分钟后再试。",
    blocked: "合作已暂停——无法登记客户。请联系我们。",
    name: "请填写公司名称。",
    inn: "税号只能是数字：乌兹别克斯坦 9 位，其他国家最多 12 位。",
    need_inn: "我们已有同名公司。请填写税号——据此区分是同一家公司还是另一家。",
    contact: "请填写客户的电话或 Telegram——至少一项。",
    limit: "本月已登记 20 家公司。更多请于下月初再登记。",
    studio: "工作室已知道这家公司：正在合作或已联系过。无法登记。",
    taken: "这家公司已被其他合作伙伴登记。",
    mine: "这家公司已登记在您名下。",
    failed: "登记失败，请重试。",
  },
  viaClient: (name) => `已登记：“${name}”`,

  decksTitle: "演示资料",
  decksLead: "以链接发送或保存为 PDF（页面上的按钮）。链接中已包含您的代码：打开链接并在 30 天内提交申请的人将成为您的客户。",
  decks: {
    studio: { title: "DevUz Studio", text: "我们是谁、做什么、团队、语言、周期、起步价格和项目——给您推荐我们的客户。" },
    program: { title: "代理机构与公司合作计划", text: "代理机构、IT 公司或招标总包方如何以分包形式把订单交给我们，以及如何计算。" },
  },
  deckOpen: "打开",
  deckCopy: "复制链接",

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

  poolTitle: "存钱罐",
  poolToggle: "不自动提取",
  poolLead:
    "攒得越多，最终到手越多。开关开启期间，已付清项目的佣金不会立即发给您，而是累积起来，费率按存钱罐中项目的总金额计算——使用上方同一张“至……——%”表格。例如，三个 2,000 美元的项目合计 6,000 美元，三个项目都按第三档费率而不是第一档计算。您可随时点击“申请提现”提取；提现后存钱罐从零开始，已发放部分保持提高后的费率。",
  poolOffNote: "如果关闭，提升将失效：未发放的金额按各项目的普通费率计算，营业额模式的付款也会重新自动发放。",
  poolState: (amount, percent) => `存钱罐中项目总额 ${amount}——费率 ${percent}%。`,
  poolNext: (left, percent) => `再有 ${left} 的项目——费率将升至 ${percent}%。`,
  poolTop: "这是表格的最高档。",
  poolEmpty: "存钱罐暂时是空的——客户付清项目后，项目会进入这里。",
  poolMark: "存钱罐费率",
  poolResult: {
    on: "存钱罐已开启：已付清的项目会累积，费率随总额提高。",
    off: "存钱罐已关闭：付款恢复正常发放。",
    failed: "切换失败，请重试。",
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

  mediaTitle: "推广素材",
  mediaLead:
    "用于您社交媒体的工作室视频和图片。下载后发布到 Reels、Shorts、TikTok、快拍或频道，并粘贴配文——您的短链接已经在里面。通过它来的客户算作您的，与您的任何链接一样。",
  mediaDownload: "下载",
  mediaCopyCaption: "复制配文",
  mediaCaptionTitle: "帖子配文",
  mediaCaption: (link) =>
    `DevUz Studio 开发能带来询盘的网站、网店和 Telegram 机器人。免费分析您的网站并指出需要改进的地方：${link}`,
  mediaShape: { vertical: "竖版 9:16", square: "方形", horizontal: "横版 16:9" },
  mediaLang: { all: "无文字", ru: "俄语", uz: "乌兹别克语", en: "英语", zh: "中文" },
  mediaSeconds: "秒",
  mediaMb: "MB",
  mediaGone: "该素材已从后台移除——请选择其他素材。",

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

const uk: CabinetCopy = {
  title: "Кабінет партнера",
  signedOutTitle: "Вхід для партнерів",
  signedOutLead:
    "Увійдіть через Telegram: бот надішле кнопку, яка відкриє кабінет. Якщо ви ще не партнер — бот зареєструє вас одразу, це безкоштовно й ні до чого не зобов'язує.",
  signIn: "Увійти через Telegram",
  signInHint: "Відкриється наш бот. Натисніть «Старт» — прийде кнопка входу, вона діє 15 хвилин.",
  errors: {
    expired: "Посилання для входу застаріло або вже використане. Натисніть «Увійти через Telegram» ще раз — бот надішле нове.",
    offline: "Сервіс зараз недоступний. Спробуйте за хвилину.",
  },
  hello: (name) => `Вітаємо, ${name}`,
  logout: "Вийти",
  rate: (model, from, to) =>
    model === "turnover"
      ? `Ваша модель — з обороту: від ${from} до ${to} % від суми договору, що більший проєкт, то вищий відсоток`
      : `Ваша модель — від чистого прибутку: від ${from} до ${to} % від прибутку проєкту, що більший проєкт, то вищий відсоток`,
  personalRate: (percent) => `Ваша персональна ставка — ${percent} % з кожного проєкту клієнта`,
  tiersTitle: "Модель доходу",
  tierUpTo: (amount) => `до ${amount}`,
  tierOver: (amount) => `понад ${amount}`,
  tiersNote: "Щабель визначається за сумою кожного проєкту окремо. Відсоток — з кожного проєкту клієнта, зокрема й наступних.",
  colRange: "Сума проєкту",
  modelNames: { profit: "Від чистого прибутку", turnover: "З обороту" },
  modelHints: {
    profit: "Відсоток вищий, але рахується від прибутку: сума договору мінус податок і собівартість. Точна сума частки з'явиться, коли студія внесе собівартість.",
    turnover: "Відсоток нижчий, але від усієї суми договору: частку відомо одразу, щойно договір підписано.",
  },
  modelCurrent: "зараз",
  modelChoose: (name) => `Перейти на «${name}»`,
  modelNext: (date) => `Змінити модель знову можна з ${date}.`,
  modelFixed: "Змінювати модель можна раз на тиждень. За клієнтом закріплюється модель, що діяла в день його заявки: зміна стосується нових клієнтів, а тих, хто вже прийшов, не перераховує.",
  modelResult: {
    ok: "Модель змінено. Вона діє для клієнтів, які прийдуть із цього моменту.",
    same: "Цю модель у вас уже обрано.",
    too_soon: "Модель можна змінювати раз на тиждень — дату наступної зміни вказано нижче.",
    invalid: "Такої моделі немає.",
    offline: "Сервіс зараз недоступний. Спробуйте за хвилину.",
    failed: "Не вдалося змінити модель. Спробуйте ще раз.",
  },

  agenciesTitle: "Агенції та компанії",
  agenciesLead:
    "Підключіть агенцію або компанію, від якої регулярно надходять замовлення на розробку: IT-компанію, вебстудію, маркетингову чи дизайн-агенцію, інтегратора, генпідрядника IT-тендерів. Вона передає нам замовлення на субпідряд, і після нашого підтвердження всі її замовлення — ваші протягом 12 місяців, без обмеження в 30 днів: і перше, і кожне наступне. Посилання їй не потрібне — ми впізнаємо її замовлення за контактом і назвою.",
  agencyName: "Назва компанії",
  agencyContact: "Контакт компанії",
  agencyContactHint: "@telegram, телефон або пошта — звідки вона нам писатиме",
  agencyWebsite: "Сайт",
  agencyNote: "Коментар",
  agencyAdd: "Підключити компанію",
  agenciesEmpty: "Агенцій поки немає. Презентація програми для агенцій — нижче, її можна надіслати їм посиланням.",
  agencyStatus: { pending: "чекає на підтвердження", active: "підключено — замовлення ваші", rejected: "не підключено" },
  agencyUntil: (date) => `до ${date}`,
  agencyExpired: (date) => `термін минув ${date} — нові замовлення не зараховуються`,
  agencyResult: {
    ok: "Агенцію надіслано на підтвердження. Щойно підтвердимо — бот вам напише.",
    offline: "Сервіс зараз недоступний. Спробуйте за хвилину.",
    invalid: "Потрібні назва й контакт агенції.",
    limit: "Агенцій уже максимум. Напишіть нам — обговоримо.",
    duplicate: "Цю агенцію вже підключено — вами або іншим партнером.",
    failed: "Не вдалося підключити агенцію. Спробуйте ще раз.",
  },
  viaAgency: (name) => `агенція «${name}»`,

  claimsTitle: "Мої клієнти",
  claimsLead:
    "Приводите компанію самі, без посилання? Закріпіть її тут: назва, як з нею зв'язатися та ІНН, якщо знаєте. Перевіряємо за назвою; якщо така назва вже траплялася — за ІНН. Закріплення діє одразу — якщо студія з цією компанією ще не працювала й не зв'язувалася і її не закріпив інший партнер. Закріпили — клієнт одразу йде нашим менеджерам пріоритетною заявкою, і з ним зв'яжуться. Усі замовлення цієї компанії ваші 12 місяців, як за посиланням. На місяць можна закріпити до 20 компаній.",
  clientName: "Назва компанії",
  clientInn: "ІНН (СТИР), якщо знаєте",
  clientInnHint: "9 цифр; для інших країн — до 12. Не знаєте — залиште порожнім",
  clientContactName: "Контактна особа",
  clientPhone: "Телефон",
  clientTelegram: "Telegram",
  clientWebsite: "Сайт",
  clientNote: "Що потрібно клієнту",
  clientNoteHint: "сайт, бот, CRM… — коротко",
  clientAdd: "Закріпити клієнта",
  claimsEmpty: "Закріплених клієнтів поки немає.",
  claimsLimit: (used, max) => `Цього місяця закріплено ${used} з ${max}.`,
  clientWaiting: (date) => `закріплено · чекаємо першу заявку до ${date}`,
  clientActive: (date) => `заявка прийшла · замовлення ваші до ${date}`,
  clientExpired: "термін минув — нові замовлення не зараховуються",
  clientCancelled: (note) => `закріплення скасовано${note ? ` · ${note}` : ""}`,
  clientResult: {
    ok: "Клієнта закріплено за вами й передано менеджерам — з ним зв'яжуться. Етапи — у таблиці клієнтів нижче, бот напише про договір і оплату.",
    offline: "Сервіс зараз недоступний. Спробуйте за хвилину.",
    blocked: "Партнерство призупинено — закріплювати клієнтів не можна. Напишіть нам.",
    name: "Вкажіть назву компанії.",
    inn: "ІНН — лише цифри: 9 для Узбекистану, до 12 для інших країн.",
    need_inn: "Компанія з такою назвою у нас уже є. Вкажіть ІНН — за ним відрізнимо, та сама це компанія чи інша.",
    contact: "Вкажіть телефон або Telegram клієнта — хоча б одне.",
    limit: "Цього місяця вже закріплено 20 компаній. Наступні — з початку місяця.",
    studio: "Ця компанія вже є у студії: з нею працюємо або вже зв'язувалися. Закріпити її не можна.",
    taken: "Цю компанію вже закріпив інший партнер.",
    mine: "Ця компанія вже закріплена за вами.",
    failed: "Не вдалося закріпити. Спробуйте ще раз.",
  },
  viaClient: (name) => `закріплено: «${name}»`,

  decksTitle: "Презентації",
  decksLead: "Надішліть посиланням або збережіть у PDF (кнопка на сторінці). У посиланні вже ваш код: хто відкриє його й залишить заявку протягом 30 днів, стане вашим клієнтом.",
  decks: {
    studio: { title: "DevUz Studio", text: "Хто ми, що робимо, штат, мови, терміни, ціни «від» і проєкти — для клієнта, якому ви нас рекомендуєте." },
    program: { title: "Програма для агенцій і компаній", text: "Як агенції, IT-компанії чи генпідряднику тендерів передавати нам замовлення на субпідряд і як це рахується." },
  },
  deckOpen: "Відкрити",
  deckCopy: "Скопіювати посилання",

  statClicks: "Переходів за 30 днів",
  statLeads: "Заявок усього",
  statSigned: "Договорів підписано",
  statPaid: "Проєктів оплачено",
  statEarned: "Зароблено",
  statFrozen: "Чекає на оплату клієнтом",
  statAvailable: "До виведення",
  statPaidOut: "Виплачено",

  chartTitle: "Переходи за 30 днів",
  chartLead: "Кожен стовпчик — люди, які відкрили ваші посилання за день. Роботи прев'ю й повторні відкриття однією людиною не рахуються.",
  chartLeadMark: "крапка — цього дня була заявка",
  chartTip: (day, clicks, leads) => `${day}: переходів ${clicks}${leads ? `, заявок ${leads}` : ""}`,

  linksTitle: "Мої посилання",
  linksLead:
    "Під кожен канал — окреме коротке посилання. Так видно, звідки приходять клієнти, а однакове посилання в десяти чатах не ріже антиспам.",
  colChannel: "Канал",
  colLink: "Посилання",
  colTarget: "Куди веде",
  colClicks: "Переходи",
  colLeads: "Заявки",
  mainLink: "Основне",
  botLinkTitle: "Посилання одразу на Telegram-бота",
  copy: "Скопіювати",
  copied: "Скопійовано",
  newLink: "Нове посилання",
  fieldLabel: "Назва каналу",
  fieldLabelHint: "Наприклад: Telegram-канал, Instagram, розсилка",
  fieldTarget: "Куди веде",
  fieldPerk: "Бонус вашій аудиторії",
  fieldCode: "Свій код",
  fieldCodeHint: "Необов'язково. Латиниця й цифри, 3–24 знаки",
  createLink: "Створити посилання",
  targets: {
    "/": "Головна",
    "/services": "Послуги",
    "/calculator": "Калькулятор",
    "/audit": "Перевірка сайту",
    "/cases": "Кейси",
    "/products": "Продукти",
    "/partners": "Партнерська програма",
    bot: "Telegram-бот",
  },
  perks: {
    none: "Без бонусу",
    disc_5: "Знижка 5 % на перший проєкт",
    disc_10: "Знижка 10 % на перший проєкт",
    disc_15: "Знижка 15 % на перший проєкт",
  },
  linkResult: {
    ok: "Посилання створено — скопіюйте його в таблиці.",
    offline: "Сервіс зараз недоступний. Спробуйте за хвилину.",
    invalid: "Код: латиниця, цифри, дефіс або підкреслення, 3–24 знаки.",
    reserved: "Цей код зарезервовано — оберіть інший.",
    taken: "Такий код уже зайнятий — придумайте інший або залиште поле порожнім.",
    limit: "Посилань уже максимум. Напишіть нам — приберемо невикористовувані.",
    failed: "Не вдалося створити посилання. Спробуйте ще раз.",
  },

  clientsTitle: "Мої клієнти",
  clientsLead:
    "Усі, хто залишив заявку за вашими посиланнями. Контактів клієнта ми не показуємо — лише етап і ваші гроші. Частка — відсоток від суми проєкту за ставкою його щабля.",
  clientsEmpty: "Поки нікого. Поділіться посиланням — перший клієнт з'явиться тут одразу після заявки.",
  colDate: "Дата",
  colClient: "Клієнт",
  colFrom: "Звідки",
  colStage: "Етап",
  colShare: "Ваша частка",
  unnamed: "Клієнт",
  stages: {
    lead: "Заявка",
    work: "У роботі",
    contract: "Готуємо договір",
    signed: "Договір підписано",
    paid: "Оплачено",
    lost: "Не склалося",
  },
  shareFrozen: (amount) => `${amount} · після повної оплати`,
  shareEarned: (amount) => `${amount} · нараховано`,
  notCounted: (reason) => `не зараховано: ${reason}`,
  voidReasons: {
    self: "заявка від вас самих",
    existing_client: "клієнт уже працював зі студією",
    blocked: "партнерство призупинено",
  },

  poolTitle: "Скарбничка",
  poolToggle: "Не забирати в автоматичному режимі",
  poolLead:
    "Що більше накопичили — то більша виплата в результаті. Поки перемикач увімкнено, гроші за оплачені проєкти не йдуть вам одразу, а накопичуються, і ставка за ними рахується за загальною сумою проєктів у скарбничці — за тією ж таблицею «до … — %», що вище. Наприклад, три проєкти по 2 000 $ разом — це 6 000 $, і за всіма трьома ставка третього щабля замість першого. Забираєте, коли вирішите, — кнопкою «Запросити виплату»; після виплати скарбничка починається з нуля, а виплачене лишається за підвищеною ставкою.",
  poolOffNote:
    "Якщо вимкнути, підвищення зникне: невиплачене порахується за звичайною ставкою кожного проєкту, а виплати з обороту знову надходитимуть самі.",
  poolState: (amount, percent) => `У скарбничці проєкти на ${amount} — ставка ${percent} %.`,
  poolNext: (left, percent) => `Ще проєктів на ${left} — і ставка стане ${percent} %.`,
  poolTop: "Це найвищий щабель таблиці.",
  poolEmpty: "Скарбничка поки порожня — сюди потраплять проєкти, коли клієнти оплатять їх повністю.",
  poolMark: "ставка скарбнички",
  poolResult: {
    on: "Скарбничку ввімкнено: оплачені проєкти накопичуються, ставка зростає із загальною сумою.",
    off: "Скарбничку вимкнено: виплати знову надходять як звичайно.",
    failed: "Не вдалося перемкнути. Спробуйте ще раз.",
  },
  payoutTitle: "Виплата",
  payoutRules: (min) =>
    `Виведення — від ${min}, з першого робочого дня місяця. Гроші переказує власник студії: USDT (TRC-20) або за реквізитами. Одна заявка за раз.`,
  payoutOpens: (date) => `Виведення відкриється ${date}.`,
  requisites: "Куди платити",
  requisitesHint: "Адреса USDT TRC-20 або реквізити словами",
  saveRequisites: "Зберегти",
  requestPayout: (amount) => `Запросити виплату ${amount}`,
  payoutResult: {
    ok: "Заявку прийнято. Коли гроші буде надіслано, бот вам напише.",
    saved: "Реквізити збережено.",
    bad_requisites: "Не схоже на адресу USDT TRC-20 чи реквізити. Перевірте й збережіть ще раз.",
    offline: "Сервіс зараз недоступний. Спробуйте за хвилину.",
    window: "Виведення відкривається з першого робочого дня місяця — після звірки платежів.",
    requisites: "Спочатку вкажіть, куди платити.",
    pending: "Одна заявка вже чекає на рішення — другу поверх неї подати не можна.",
    min: "Доступно менше за мінімальну виплату. Зачекайте на наступну оплату клієнта.",
    failed: "Не вдалося подати заявку. Спробуйте ще раз.",
  },
  historyTitle: "Історія виплат",
  payoutStatus: { requested: "На розгляді", paid: "Виплачено", rejected: "Відхилено" },

  mediaTitle: "Промоматеріали",
  mediaLead:
    "Ролики й картинки студії для ваших соцмереж. Завантажте, викладіть у Reels, Shorts, TikTok, сторіс або канал і вставте підпис — ваше коротке посилання в ньому вже є. Клієнти, які прийшли за ним, зараховуються вам, як за будь-яким вашим посиланням.",
  mediaDownload: "Завантажити",
  mediaCopyCaption: "Скопіювати підпис",
  mediaCaptionTitle: "Підпис до допису",
  mediaCaption: (link) =>
    `DevUz Studio робить сайти, інтернет-магазини й Telegram-ботів, які приносять заявки. Безкоштовно розберуть ваш сайт і покажуть, що виправити: ${link}`,
  mediaShape: { vertical: "вертикальне 9:16", square: "квадрат", horizontal: "горизонтальне 16:9" },
  mediaLang: { all: "без слів", ru: "російською", uz: "узбецькою", en: "англійською", zh: "китайською" },
  mediaSeconds: "с",
  mediaMb: "МБ",
  mediaGone: "Цей матеріал прибрали з кабінету — візьміть інший.",

  promoTitle: "Готові тексти",
  promoLead:
    "Скопіюйте й вставте — посилання вже всередині. Найкраще працює особисте: допишіть одну фразу про те, чому ви нам довіряєте.",
  promo: [
    {
      title: "Допис у канал",
      text: (link) =>
        `Якщо потрібен сайт, інтернет-магазин чи Telegram-бот — рекомендую DevUz Studio. Роблять під ключ, показують, скільки заявок сайт втрачає зараз і що з цим робити. Перевірити свій сайт і обговорити завдання: ${link}`,
    },
    {
      title: "Особисте повідомлення",
      text: (link) =>
        `Ти казав, що потрібен сайт. Подивись DevUz Studio — спершу безкоштовно розберуть, що не так зараз, і лише потім запропонують ціну: ${link}`,
    },
    {
      title: "Коротко — для сторіс",
      text: (link) => `Сайти й боти, які приносять заявки. Розбір безкоштовно: ${link}`,
    },
  ],

  howTitle: "Як це працює",
  how: [
    "Діліться коротким посиланням — окремим під кожен канал.",
    "Людина відкриває посилання — сайт запам'ятовує вас на 30 днів. Якщо за цей час вона залишить заявку на сайті або напише боту, клієнт ваш, навіть якщо зайшов знову вже без посилання.",
    "Етапи видно тут: заявка, робота, договір, оплата. Про підписаний договір і про оплату бот пише вам сам.",
    "Коли клієнт оплатив проєкт повністю, частка стає доступною до виведення — з першого робочого дня місяця.",
  ],
  botNote: (bot) => `Сповіщення про заявки, договори й виплати надходять у Telegram-бот @${bot}.`,
};

const pl: CabinetCopy = {
  title: "Panel partnera",
  signedOutTitle: "Logowanie dla partnerów",
  signedOutLead:
    "Zaloguj się przez Telegram: bot wyśle przycisk, który otworzy panel. Jeśli nie jesteś jeszcze partnerem, bot od razu Cię zarejestruje — to bezpłatne i do niczego nie zobowiązuje.",
  signIn: "Zaloguj przez Telegram",
  signInHint: "Otworzy się nasz bot. Naciśnij „Start” — dostaniesz przycisk logowania, ważny przez 15 minut.",
  errors: {
    expired: "Link logowania wygasł lub został już użyty. Kliknij „Zaloguj przez Telegram” jeszcze raz — bot wyśle nowy.",
    offline: "Serwis jest chwilowo niedostępny. Spróbuj za minutę.",
  },
  hello: (name) => `Cześć, ${name}`,
  logout: "Wyloguj",
  rate: (model, from, to) =>
    model === "turnover"
      ? `Twój model — od obrotu: od ${from} do ${to} % wartości umowy; im większy projekt, tym wyższy procent`
      : `Twój model — od zysku netto: od ${from} do ${to} % zysku z projektu; im większy projekt, tym wyższy procent`,
  personalRate: (percent) => `Twoja indywidualna stawka — ${percent} % od każdego projektu klienta`,
  tiersTitle: "Model wynagrodzenia",
  tierUpTo: (amount) => `do ${amount}`,
  tierOver: (amount) => `powyżej ${amount}`,
  tiersNote: "Próg liczy się osobno dla wartości każdego projektu. Procent — od każdego projektu klienta, także kolejnych.",
  colRange: "Wartość projektu",
  modelNames: { profit: "Od zysku netto", turnover: "Od obrotu" },
  modelHints: {
    profit: "Wyższy procent, ale liczony od zysku: wartość umowy minus podatek i koszty własne. Dokładna kwota Twojego udziału pojawi się, gdy studio wprowadzi koszty własne.",
    turnover: "Niższy procent, ale od całej wartości umowy: udział jest znany od razu po podpisaniu umowy.",
  },
  modelCurrent: "obecnie",
  modelChoose: (name) => `Przejdź na „${name}”`,
  modelNext: (date) => `Model możesz ponownie zmienić od ${date}.`,
  modelFixed: "Model można zmieniać raz w tygodniu. Do klienta przypisany jest model obowiązujący w dniu jego zapytania: zmiana dotyczy nowych klientów, a tych, którzy już przyszli, nie przelicza.",
  modelResult: {
    ok: "Model zmieniony. Obowiązuje dla klientów, którzy przyjdą od teraz.",
    same: "Ten model masz już wybrany.",
    too_soon: "Model można zmieniać raz w tygodniu — data następnej zmiany jest podana niżej.",
    invalid: "Nie ma takiego modelu.",
    offline: "Serwis jest chwilowo niedostępny. Spróbuj za minutę.",
    failed: "Nie udało się zmienić modelu. Spróbuj jeszcze raz.",
  },

  agenciesTitle: "Agencje i firmy",
  agenciesLead:
    "Podłącz agencję lub firmę, od której regularnie płyną zlecenia na development: firmę IT, studio webowe, agencję marketingową lub projektową, integratora, generalnego wykonawcę przetargów IT. Przekazuje nam zlecenia w podwykonawstwie, a po naszym potwierdzeniu wszystkie jej zlecenia są Twoje przez 12 miesięcy, bez limitu 30 dni: pierwsze i każde kolejne. Link nie jest jej potrzebny — rozpoznajemy jej zlecenia po kontakcie i nazwie.",
  agencyName: "Nazwa firmy",
  agencyContact: "Kontakt do firmy",
  agencyContactHint: "@telegram, telefon lub e-mail — skąd będzie do nas pisać",
  agencyWebsite: "Strona",
  agencyNote: "Komentarz",
  agencyAdd: "Podłącz firmę",
  agenciesEmpty: "Nie masz jeszcze agencji. Prezentacja programu dla agencji jest niżej — możesz ją wysłać linkiem.",
  agencyStatus: { pending: "czeka na potwierdzenie", active: "podłączona — zlecenia są Twoje", rejected: "niepodłączona" },
  agencyUntil: (date) => `do ${date}`,
  agencyExpired: (date) => `okres minął ${date} — nowe zlecenia nie są zaliczane`,
  agencyResult: {
    ok: "Agencja wysłana do potwierdzenia. Gdy tylko potwierdzimy, bot do Ciebie napisze.",
    offline: "Serwis jest chwilowo niedostępny. Spróbuj za minutę.",
    invalid: "Podaj nazwę i kontakt do agencji.",
    limit: "Osiągnięto limit agencji. Napisz do nas — omówimy to.",
    duplicate: "Ta agencja jest już podłączona — przez Ciebie lub innego partnera.",
    failed: "Nie udało się podłączyć agencji. Spróbuj jeszcze raz.",
  },
  viaAgency: (name) => `agencja „${name}”`,

  claimsTitle: "Moi klienci",
  claimsLead:
    "Przyprowadzasz firmę sam, bez linku? Przypisz ją tutaj: nazwa, jak się z nią skontaktować i NIP/INN, jeśli go znasz. Sprawdzamy po nazwie; jeśli taka nazwa już się pojawiła — po NIP/INN. Przypisanie działa od razu — jeśli studio nie współpracowało jeszcze z tą firmą ani się z nią nie kontaktowało i nie przypisał jej inny partner. Po przypisaniu klient od razu trafia do naszych menedżerów jako priorytetowe zapytanie i skontaktują się z nim. Wszystkie zamówienia tej firmy są Twoje przez 12 miesięcy, jak z linku. Miesięcznie można przypisać do 20 firm.",
  clientName: "Nazwa firmy",
  clientInn: "NIP (INN / STIR), jeśli znasz",
  clientInnHint: "9 cyfr; dla innych krajów — do 12. Nie znasz — zostaw puste",
  clientContactName: "Osoba kontaktowa",
  clientPhone: "Telefon",
  clientTelegram: "Telegram",
  clientWebsite: "Strona",
  clientNote: "Czego potrzebuje klient",
  clientNoteHint: "strona, bot, CRM… — krótko",
  clientAdd: "Przypisz klienta",
  claimsEmpty: "Nie masz jeszcze przypisanych klientów.",
  claimsLimit: (used, max) => `W tym miesiącu przypisano ${used} z ${max}.`,
  clientWaiting: (date) => `przypisany · czekamy na pierwsze zapytanie do ${date}`,
  clientActive: (date) => `zapytanie przyszło · zamówienia Twoje do ${date}`,
  clientExpired: "termin minął — nowe zamówienia nie są zaliczane",
  clientCancelled: (note) => `przypisanie anulowane${note ? ` · ${note}` : ""}`,
  clientResult: {
    ok: "Klient jest przypisany do Ciebie i przekazany menedżerom — skontaktują się z nim. Etapy — w tabeli klientów poniżej, bot napisze o umowie i płatności.",
    offline: "Serwis jest teraz niedostępny. Spróbuj za minutę.",
    blocked: "Partnerstwo jest wstrzymane — nie można przypisywać klientów. Napisz do nas.",
    name: "Podaj nazwę firmy.",
    inn: "NIP/INN — tylko cyfry: 9 dla Uzbekistanu, do 12 dla innych krajów.",
    need_inn: "Mamy już firmę o tej nazwie. Podaj NIP/INN — po nim odróżnimy, czy to ta sama firma, czy inna.",
    contact: "Podaj telefon lub Telegram klienta — przynajmniej jedno.",
    limit: "W tym miesiącu przypisano już 20 firm. Kolejne — od początku miesiąca.",
    studio: "Studio zna już tę firmę: współpracujemy z nią albo już się kontaktowaliśmy. Nie można jej przypisać.",
    taken: "Tę firmę przypisał już inny partner.",
    mine: "Ta firma jest już przypisana do Ciebie.",
    failed: "Nie udało się przypisać. Spróbuj ponownie.",
  },
  viaClient: (name) => `przypisany: „${name}”`,

  decksTitle: "Prezentacje",
  decksLead: "Wyślij linkiem lub zapisz jako PDF (przycisk na stronie). Link zawiera już Twój kod: kto go otworzy i zostawi zapytanie w ciągu 30 dni, zostanie Twoim klientem.",
  decks: {
    studio: { title: "DevUz Studio", text: "Kim jesteśmy, co robimy, zespół, języki, terminy, ceny „od” i realizacje — dla klienta, któremu nas polecasz." },
    program: { title: "Program dla agencji i firm", text: "Jak agencja, firma IT lub generalny wykonawca przetargów może przekazywać nam zlecenia w podwykonawstwie i jak to się rozlicza." },
  },
  deckOpen: "Otwórz",
  deckCopy: "Kopiuj link",

  statClicks: "Wejścia w 30 dni",
  statLeads: "Zapytania łącznie",
  statSigned: "Podpisane umowy",
  statPaid: "Opłacone projekty",
  statEarned: "Zarobiono",
  statFrozen: "Czeka na płatność klienta",
  statAvailable: "Do wypłaty",
  statPaidOut: "Wypłacono",

  chartTitle: "Wejścia w ciągu 30 dni",
  chartLead: "Każdy słupek to osoby, które danego dnia otworzyły Twoje linki. Boty podglądu i ponowne otwarcia przez tę samą osobę nie są liczone.",
  chartLeadMark: "kropka — tego dnia było zapytanie",
  chartTip: (day, clicks, leads) => `${day}: wejścia ${clicks}${leads ? `, zapytania ${leads}` : ""}`,

  linksTitle: "Moje linki",
  linksLead:
    "Dla każdego kanału — osobny krótki link. Widać wtedy, skąd przychodzą klienci, a filtr antyspamowy nie blokuje tego samego linku w dziesięciu czatach.",
  colChannel: "Kanał",
  colLink: "Link",
  colTarget: "Dokąd prowadzi",
  colClicks: "Wejścia",
  colLeads: "Zapytania",
  mainLink: "Główny",
  botLinkTitle: "Link prosto do bota w Telegramie",
  copy: "Kopiuj",
  copied: "Skopiowano",
  newLink: "Nowy link",
  fieldLabel: "Nazwa kanału",
  fieldLabelHint: "Np.: kanał na Telegramie, Instagram, newsletter",
  fieldTarget: "Dokąd prowadzi",
  fieldPerk: "Bonus dla Twoich odbiorców",
  fieldCode: "Własny kod",
  fieldCodeHint: "Opcjonalnie. Litery łacińskie i cyfry, 3–24 znaki",
  createLink: "Utwórz link",
  targets: {
    "/": "Strona główna",
    "/services": "Usługi",
    "/calculator": "Kalkulator",
    "/audit": "Audyt strony",
    "/cases": "Realizacje",
    "/products": "Produkty",
    "/partners": "Program partnerski",
    bot: "Bot w Telegramie",
  },
  perks: {
    none: "Bez bonusu",
    disc_5: "Rabat 5 % na pierwszy projekt",
    disc_10: "Rabat 10 % na pierwszy projekt",
    disc_15: "Rabat 15 % na pierwszy projekt",
  },
  linkResult: {
    ok: "Link utworzony — skopiuj go z tabeli.",
    offline: "Serwis jest chwilowo niedostępny. Spróbuj za minutę.",
    invalid: "Kod: litery łacińskie, cyfry, myślnik lub podkreślnik, 3–24 znaki.",
    reserved: "Ten kod jest zarezerwowany — wybierz inny.",
    taken: "Ten kod jest już zajęty — wymyśl inny lub zostaw pole puste.",
    limit: "Osiągnięto limit linków. Napisz do nas — usuniemy nieużywane.",
    failed: "Nie udało się utworzyć linku. Spróbuj jeszcze raz.",
  },

  clientsTitle: "Moi klienci",
  clientsLead:
    "Wszyscy, którzy zostawili zapytanie z Twoich linków. Nie pokazujemy danych kontaktowych klienta — tylko etap i Twoje pieniądze. Udział to procent od wartości projektu według stawki jego progu.",
  clientsEmpty: "Na razie nikogo. Udostępnij link — pierwszy klient pojawi się tu zaraz po zapytaniu.",
  colDate: "Data",
  colClient: "Klient",
  colFrom: "Źródło",
  colStage: "Etap",
  colShare: "Twój udział",
  unnamed: "Klient",
  stages: {
    lead: "Zapytanie",
    work: "W realizacji",
    contract: "Przygotowujemy umowę",
    signed: "Umowa podpisana",
    paid: "Opłacony",
    lost: "Nie doszło do skutku",
  },
  shareFrozen: (amount) => `${amount} · po pełnej płatności`,
  shareEarned: (amount) => `${amount} · naliczono`,
  notCounted: (reason) => `niezaliczony: ${reason}`,
  voidReasons: {
    self: "zapytanie od Ciebie samego",
    existing_client: "klient już współpracował ze studiem",
    blocked: "partnerstwo zawieszone",
  },

  poolTitle: "Skarbonka",
  poolToggle: "Nie wypłacaj automatycznie",
  poolLead:
    "Im więcej uzbierasz, tym większa wypłata na koniec. Gdy przełącznik jest włączony, pieniądze za opłacone projekty nie trafiają do Ciebie od razu, tylko się zbierają, a stawka liczy się od łącznej kwoty projektów w skarbonce — według tej samej tabeli „do … — %” powyżej. Na przykład trzy projekty po 2 000 $ to razem 6 000 $, więc wszystkie trzy dostają stawkę trzeciego progu zamiast pierwszego. Wypłacasz, kiedy zechcesz, przyciskiem „Zleć wypłatę”; po wypłacie skarbonka zaczyna od zera, a wypłacone zostaje według podwyższonej stawki.",
  poolOffNote:
    "Jeśli wyłączysz, podwyżka przepadnie: niewypłacone policzy się według zwykłej stawki każdego projektu, a wypłaty od obrotu znów będą przychodzić same.",
  poolState: (amount, percent) => `W skarbonce projekty na ${amount} — stawka ${percent}%.`,
  poolNext: (left, percent) => `Jeszcze projekty na ${left} — i stawka wyniesie ${percent}%.`,
  poolTop: "To najwyższy próg tabeli.",
  poolEmpty: "Skarbonka jest na razie pusta — trafią tu projekty, gdy klienci opłacą je w całości.",
  poolMark: "stawka skarbonki",
  poolResult: {
    on: "Skarbonka włączona: opłacone projekty się zbierają, a stawka rośnie z łączną kwotą.",
    off: "Skarbonka wyłączona: wypłaty znów przychodzą jak zwykle.",
    failed: "Nie udało się przełączyć. Spróbuj ponownie.",
  },
  payoutTitle: "Wypłata",
  payoutRules: (min) =>
    `Wypłata — od ${min}, od pierwszego dnia roboczego miesiąca. Pieniądze przelewa właściciel studia: USDT (TRC-20) lub na podane dane. Jedno zlecenie naraz.`,
  payoutOpens: (date) => `Wypłata będzie dostępna ${date}.`,
  requisites: "Dane do wypłaty",
  requisitesHint: "Adres USDT TRC-20 lub dane do przelewu słowami",
  saveRequisites: "Zapisz",
  requestPayout: (amount) => `Zleć wypłatę ${amount}`,
  payoutResult: {
    ok: "Zlecenie przyjęte. Gdy pieniądze zostaną wysłane, bot do Ciebie napisze.",
    saved: "Dane do wypłaty zapisane.",
    bad_requisites: "To nie wygląda na adres USDT TRC-20 ani dane do przelewu. Sprawdź i zapisz ponownie.",
    offline: "Serwis jest chwilowo niedostępny. Spróbuj za minutę.",
    window: "Wypłaty są dostępne od pierwszego dnia roboczego miesiąca — po uzgodnieniu płatności.",
    requisites: "Najpierw podaj dane do wypłaty.",
    pending: "Jedno zlecenie już czeka na decyzję — drugiego nie można złożyć, dopóki ono trwa.",
    min: "Dostępna kwota jest niższa niż minimalna wypłata. Poczekaj na kolejną płatność klienta.",
    failed: "Nie udało się złożyć zlecenia. Spróbuj jeszcze raz.",
  },
  historyTitle: "Historia wypłat",
  payoutStatus: { requested: "W trakcie weryfikacji", paid: "Wypłacono", rejected: "Odrzucono" },

  mediaTitle: "Materiały promocyjne",
  mediaLead:
    "Filmy i grafiki studia do Twoich social mediów. Pobierz, opublikuj w Reels, Shorts, TikToku, relacjach lub na kanale i wklej opis — Twój krótki link już w nim jest. Klienci, którzy przez niego przyjdą, są zaliczani Tobie, jak przy każdym Twoim linku.",
  mediaDownload: "Pobierz",
  mediaCopyCaption: "Kopiuj opis",
  mediaCaptionTitle: "Opis do posta",
  mediaCaption: (link) =>
    `DevUz Studio tworzy strony, sklepy internetowe i boty w Telegramie, które przynoszą zapytania. Bezpłatnie przeanalizują Twoją stronę i pokażą, co poprawić: ${link}`,
  mediaShape: { vertical: "pionowy 9:16", square: "kwadrat", horizontal: "poziomy 16:9" },
  mediaLang: { all: "bez słów", ru: "po rosyjsku", uz: "po uzbecku", en: "po angielsku", zh: "po chińsku" },
  mediaSeconds: "s",
  mediaMb: "MB",
  mediaGone: "Ten materiał został usunięty z panelu — wybierz inny.",

  promoTitle: "Gotowe teksty",
  promoLead:
    "Skopiuj i wklej — link jest już w środku. Najlepiej działa osobisty ton: dopisz jedno zdanie o tym, dlaczego nam ufasz.",
  promo: [
    {
      title: "Post na kanał",
      text: (link) =>
        `Jeśli potrzebujesz strony, sklepu internetowego albo bota w Telegramie — polecam DevUz Studio. Robią wszystko od A do Z, pokazują, ile zapytań strona traci teraz i co z tym zrobić. Sprawdź swoją stronę i omów zadanie: ${link}`,
    },
    {
      title: "Wiadomość prywatna",
      text: (link) =>
        `Podobno potrzebujesz strony. Zajrzyj do DevUz Studio — najpierw bezpłatnie przeanalizują, co jest nie tak teraz, a dopiero potem podadzą cenę: ${link}`,
    },
    {
      title: "Krótko — do relacji",
      text: (link) => `Strony i boty, które przynoszą zapytania. Analiza gratis: ${link}`,
    },
  ],

  howTitle: "Jak to działa",
  how: [
    "Udostępniaj krótki link — osobny dla każdego kanału.",
    "Ktoś otwiera link — strona zapamiętuje Cię na 30 dni. Jeśli w tym czasie zostawi zapytanie na stronie lub napisze do bota, klient jest Twój, nawet jeśli wróci już bez linku.",
    "Etapy widać tutaj: zapytanie, realizacja, umowa, płatność. O podpisanej umowie i płatności bot poinformuje Cię sam.",
    "Gdy klient opłaci cały projekt, udział staje się dostępny do wypłaty — od pierwszego dnia roboczego miesiąca.",
  ],
  botNote: (bot) => `Powiadomienia o zapytaniach, umowach i wypłatach przychodzą do bota w Telegramie @${bot}.`,
};

const copies: Record<Locale, CabinetCopy> = { ru, en, uz, zh, uk, pl };

export function cabinetCopy(locale: Locale): CabinetCopy {
  return copies[locale];
}
