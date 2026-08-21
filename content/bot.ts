import type { Locale } from "@/lib/i18n";

/**
 * Тексты бота.
 *
 * Отдельно от словаря сайта: у бота другая аудитория первого касания. На
 * сайт человек приходит по ссылке и уже видел, чем мы занимаемся; в бота он
 * может попасть по чужой пересылке и не знать о студии ничего. Поэтому здесь
 * не «продолжение интерфейса», а самостоятельное первое сообщение.
 *
 * Внутренних сведений тут нет и быть не должно: команду `/start` может
 * нажать кто угодно.
 */
export type BotCopy = {
  /** Первое сообщение случайному человеку, нажавшему «Старт». */
  welcome: string;
  /** Разговор с сайта не поднялся: токен протух или уже использован. */
  resumeLost: string;
  /** Заявка по этому разговору уже у менеджера. */
  alreadySent: (requestNo: string) => string;
  /** Гарантия не сработала — скидка подтверждена. */
  discount: string;
  /** Ответ не получился. */
  error: string;
  /** Непонятная команда в личке. */
  unknown: string;
  /** Короткая публичная справка. */
  help: string;
  /** Разговор сброшен по просьбе клиента. */
  reset: string;
  /**
   * Пометка о переходе с сайта, которая уходит в историю модели.
   *
   * Раньше она была русской для всех. Для модели это последняя реплика в
   * переписке, и правило «пиши на языке собеседника» срабатывало по ней:
   * китаец, начавший разговор на /zh, получал в Telegram ответ по-русски.
   * Поэтому пометка на языке разговора, а в системном промпте отдельно
   * сказано, что это служебная строка, а не слова клиента.
   */
  resumeMarker: string;
};

const ru: BotCopy = {
  welcome: [
    "👋 <b>DevUz Studio</b> — разработка полного цикла в Ташкенте.",
    "",
    "Менеджер уже здесь и ждёт ваше сообщение. Сайты, мобильные приложения, маркетплейсы, сервисы доставки, AI-продукты на LLM и RAG.",
    "",
    "⚡️ Отвечаем за 20 секунд, круглосуточно. Не уложимся — скидка 30% на проект.",
    "",
    "Расскажите своими словами, что нужно сделать.",
  ].join("\n"),
  resumeLost: [
    "Здравствуйте! Разговор с сайта не подтянулся — видимо, прошло слишком много времени.",
    "",
    "Ничего страшного: напишите в двух словах, что нужно сделать, и продолжим отсюда.",
  ].join("\n"),
  alreadySent: (requestNo) =>
    [
      `Ваша заявка <b>${requestNo}</b> уже у менеджера — он напишет вам сюда.`,
      "",
      "Если хотите что-то добавить или уточнить, пишите прямо здесь: всё дойдёт вместе с заявкой.",
    ].join("\n"),
  discount: "Извините, в 20 секунд мы не уложились — скидка <b>30%</b> за вами. Менеджер её учтёт.",
  error:
    "Что-то пошло не так на нашей стороне. Напишите сообщение ещё раз — обычно со второго всё проходит.",
  unknown: "Такой команды у меня нет. Просто напишите, что нужно сделать, — я на связи.",
  help: [
    "<b>DevUz Studio</b>",
    "",
    "Опишите задачу обычным сообщением — я задам пару уточняющих вопросов и передам всё менеджеру вместе с номером заявки.",
    "",
    "/reset — начать разговор заново",
  ].join("\n"),
  reset: "Готово, начинаем с чистого листа. Расскажите, что нужно сделать.",
  resumeMarker: "[перешёл из чата на сайте в Telegram и нажал «Старт»]",
};

const en: BotCopy = {
  welcome: [
    "👋 <b>DevUz Studio</b> — full-cycle development studio in Tashkent.",
    "",
    "A manager is already here waiting for your message. Websites, mobile apps, marketplaces, delivery services, AI products on LLM and RAG.",
    "",
    "⚡️ We reply within 20 seconds, around the clock. If we miss it — 30% off your project.",
    "",
    "Tell us in your own words what you need built.",
  ].join("\n"),
  resumeLost: [
    "Hi! I couldn't pull up your conversation from the website — it's probably been a while.",
    "",
    "No problem: tell me briefly what you need, and we'll pick it up from here.",
  ].join("\n"),
  alreadySent: (requestNo) =>
    [
      `Your request <b>${requestNo}</b> is already with a manager — they'll write to you here.`,
      "",
      "If you'd like to add or clarify anything, just write here: it'll reach them with your request.",
    ].join("\n"),
  discount: "Sorry, we missed the 20 seconds — the <b>30%</b> discount is yours. The manager will apply it.",
  error: "Something broke on our side. Send the message again — it usually goes through the second time.",
  unknown: "I don't have that command. Just write what you need — I'm here.",
  help: [
    "<b>DevUz Studio</b>",
    "",
    "Describe your task in a normal message — I'll ask a couple of follow-up questions and pass everything to a manager along with a request number.",
    "",
    "/reset — start the conversation over",
  ].join("\n"),
  reset: "Done, clean slate. Tell me what you need built.",
  resumeMarker: "[moved from the website chat to Telegram and pressed Start]",
};

const uz: BotCopy = {
  welcome: [
    "👋 <b>DevUz Studio</b> — Toshkentdagi to‘liq tsiklli ishlab chiqish studiyasi.",
    "",
    "Menejer shu yerda, xabaringizni kutmoqda. Saytlar, mobil ilovalar, marketpleyslar, yetkazib berish servislari, LLM va RAG asosidagi AI-mahsulotlar.",
    "",
    "⚡️ 20 soniyada javob beramiz, kunu tun. Ulgurmasak — loyihaga 30% chegirma.",
    "",
    "O‘z so‘zlaringiz bilan nima kerakligini ayting.",
  ].join("\n"),
  resumeLost: [
    "Assalomu alaykum! Saytdagi suhbatni tiklay olmadim — ancha vaqt o‘tgan ko‘rinadi.",
    "",
    "Hechqisi yo‘q: qisqacha nima kerakligini yozing, shu yerdan davom etamiz.",
  ].join("\n"),
  alreadySent: (requestNo) =>
    [
      `Sizning <b>${requestNo}</b> raqamli arizangiz menejerda — u shu yerga yozadi.`,
      "",
      "Biror narsa qo‘shmoqchi yoki aniqlashtirmoqchi bo‘lsangiz, shu yerga yozing: hammasi ariza bilan birga yetib boradi.",
    ].join("\n"),
  discount: "Uzr, 20 soniyaga ulgurmadik — <b>30%</b> chegirma sizniki. Menejer buni hisobga oladi.",
  error: "Bizning tomonda nimadir ishlamadi. Xabarni yana yuboring — odatda ikkinchi marta o‘tib ketadi.",
  unknown: "Bunday buyruq yo‘q. Shunchaki nima kerakligini yozing — men shu yerdaman.",
  help: [
    "<b>DevUz Studio</b>",
    "",
    "Vazifangizni oddiy xabar bilan tasvirlab bering — bir-ikki aniqlashtiruvchi savol beraman va hammasini ariza raqami bilan menejerga uzataman.",
    "",
    "/reset — suhbatni boshidan boshlash",
  ].join("\n"),
  reset: "Tayyor, toza varaqdan boshlaymiz. Nima kerakligini ayting.",
  resumeMarker: "[saytdagi chatdan Telegramga o‘tdi va «Start» bosdi]",
};

const zh: BotCopy = {
  welcome: [
    "👋 <b>DevUz Studio</b> — 塔什干的全流程开发工作室。",
    "",
    "客户经理已在线，等待您的消息。网站、移动应用、电商平台、配送服务，以及基于 LLM 与 RAG 的 AI 产品。",
    "",
    "⚡️ 20 秒内回复，全天候。超时未回 — 项目立减 30%。",
    "",
    "请用您自己的话说说需要做什么。",
  ].join("\n"),
  resumeLost: ["您好！没能调出您在网站上的对话 — 大概是间隔太久了。", "", "没关系：简单说说您的需求，我们从这里继续。"].join("\n"),
  alreadySent: (requestNo) =>
    [`您的申请 <b>${requestNo}</b> 已交给客户经理，他会在这里联系您。`, "", "如果还想补充或说明什么，直接写在这里即可，会一并转达。"].join("\n"),
  discount: "抱歉，我们没能在 20 秒内回复 — <b>30%</b> 的折扣归您，客户经理会为您计入。",
  error: "我们这边出了点问题。请再发一次消息 — 通常第二次就能成功。",
  unknown: "我没有这个命令。直接写下您的需求就好 — 我在。",
  help: ["<b>DevUz Studio</b>", "", "用普通消息描述您的需求 — 我会问一两个补充问题，然后连同申请编号一起转交客户经理。", "", "/reset — 重新开始对话"].join("\n"),
  reset: "好的，重新开始。请说说需要做什么。",
  resumeMarker: "[从网站聊天转到 Telegram 并按下了「开始」]",
};

const copy: Record<Locale, BotCopy> = { ru, en, uz, zh };

export function botCopy(locale: Locale): BotCopy {
  return copy[locale] ?? ru;
}
