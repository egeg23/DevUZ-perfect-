import type { Locale } from "@/lib/i18n";

/**
 * Презентация для агентств на сайте (/{язык}/partners/deck/agency) — на всех
 * шести языках сайта.
 *
 * Владелец, 05.11.2026: «Сделай понятную презентацию на сайте и в дашборде,
 * чтобы понял даже ребенок. На клиентском сайте % менеджера не пишем, а на
 * дашборде пишем все». Поэтому здесь только то, что получает агентство, —
 * 15% с суммы проекта. Процент того, кто из команды привёл агентство, — во
 * вкладке «Агентства» панели (content/admin-panel/agencies.ts), не здесь.
 *
 * Здесь только слова. Ставку и суммы примера страница берёт из правил денег
 * (lib/partners/rules.ts, AGENCY_PERCENT): презентация не может разойтись с
 * тем, что потом начислится.
 */

export type AgencyDeckCopy = {
  kicker: string;
  title: string;
  lead: string;
  /** Подпись под большим «15%». */
  bigLabel: string;
  stepsTitle: string;
  steps: { title: string; text: string }[];
  exampleTitle: string;
  exampleLead: string;
  project: string;
  you: string;
  exampleNote: string;
  rulesTitle: string;
  rules: string[];
  servicesTitle: string;
  from: (price: string) => string;
  ctaTitle: string;
  ctaText: string;
  ctaBot: string;
  ctaStudio: string;
  /** Плашка на странице «Зарабатывай с нами» — ведёт в эту презентацию. */
  teaser: string;
  teaserCta: string;
};

const ru: AgencyDeckCopy = {
  kicker: "Для агентств",
  title: "Приводите клиентов — получайте 15% с каждого проекта",
  lead: "Для маркетинговых агентств, веб-студий и IT-компаний. Ваш клиент заказывает у нас сайт, бот или приложение — вы получаете 15% от суммы договора. Просто и всегда одинаково.",
  bigLabel: "от суммы каждого проекта, который вы привели",
  stepsTitle: "Как это работает — 3 шага",
  steps: [
    { title: "Вы приводите клиента", text: "Даёте ему свою ссылку или пишете нам сами: «у нас клиент, ему нужен сайт»." },
    { title: "Мы делаем проект", text: "Разбор задачи, договор, разработка и запуск — всё на нас." },
    { title: "Вы получаете 15%", text: "Как только клиент оплатил проект целиком, ваши 15% уходят вам." },
  ],
  exampleTitle: "Пример на пальцах",
  exampleLead: "Клиент заказал проект — столько получаете вы:",
  project: "Проект",
  you: "Вам",
  exampleNote: "Чем дороже проект, тем больше ваши 15%. Сумма — та, что в договоре с клиентом.",
  rulesTitle: "Правила — коротко",
  rules: [
    "Всегда 15% от суммы договора. Не от прибыли, без ступеней и мелкого шрифта.",
    "Без лимита и срока: 15% с каждого проекта, сколько бы клиентов вы ни привели.",
    "Деньги — когда клиент оплатил проект целиком.",
    "Ваш клиент — ваш: заявку по вашей ссылке или от вас самих мы записываем на вас. Клиенты, которые уже работали с нами, не засчитываются.",
  ],
  servicesTitle: "Что можно приводить",
  from: (price) => `от ${price}`,
  ctaTitle: "Начнём?",
  ctaText: "Напишите нам в Telegram — заведём ваше агентство и пришлём вашу ссылку. Это займёт пять минут.",
  ctaBot: "Написать в Telegram",
  ctaStudio: "Презентация студии",
  teaser: "Вы агентство или IT-компания? Вам — 15% с каждого проекта клиента, всегда.",
  teaserCta: "Условия для агентств",
};

const en: AgencyDeckCopy = {
  kicker: "For agencies",
  title: "Bring clients, earn 15% of every project",
  lead: "For marketing agencies, web studios and IT companies. Your client orders a website, bot or app from us, and you get 15% of the contract amount. Simple, and always the same.",
  bigLabel: "of every project you bring",
  stepsTitle: "How it works: 3 steps",
  steps: [
    { title: "You bring a client", text: "Give them your link or message us yourself: “we have a client who needs a website”." },
    { title: "We build the project", text: "Brief, contract, development and launch: all on us." },
    { title: "You get 15%", text: "As soon as the client pays for the project in full, your 15% goes to you." },
  ],
  exampleTitle: "A simple example",
  exampleLead: "A client orders a project. Here is what you get:",
  project: "Project",
  you: "You get",
  exampleNote: "The bigger the project, the bigger your 15%. The amount is the one in the contract with the client.",
  rulesTitle: "The rules in short",
  rules: [
    "Always 15% of the contract amount. Not of profit, no tiers, no fine print.",
    "No limit and no end date: 15% of every project, however many clients you bring.",
    "You get paid once the client has paid for the project in full.",
    "Your client stays yours: a request via your link or from you is recorded as yours. Clients who already worked with us do not count.",
  ],
  servicesTitle: "What you can bring",
  from: (price) => `from ${price}`,
  ctaTitle: "Shall we start?",
  ctaText: "Message us on Telegram: we will add your agency and send you your link. It takes five minutes.",
  ctaBot: "Message us on Telegram",
  ctaStudio: "Studio presentation",
  teaser: "Are you an agency or an IT company? You get 15% of every client project, always.",
  teaserCta: "Terms for agencies",
};

const uz: AgencyDeckCopy = {
  kicker: "Agentliklar uchun",
  title: "Mijoz olib keling — har bir loyihadan 15% oling",
  lead: "Marketing agentliklari, veb-studiyalar va IT-kompaniyalar uchun. Mijozingiz bizdan sayt, bot yoki ilova buyurtma qiladi — siz shartnoma summasidan 15% olasiz. Oddiy va doim bir xil.",
  bigLabel: "siz olib kelgan har bir loyiha summasidan",
  stepsTitle: "Qanday ishlaydi — 3 qadam",
  steps: [
    { title: "Siz mijoz olib kelasiz", text: "Unga havolangizni berasiz yoki bizga o‘zingiz yozasiz: «mijozimiz bor, unga sayt kerak»." },
    { title: "Biz loyihani qilamiz", text: "Vazifani tahlil qilish, shartnoma, ishlab chiqish va ishga tushirish — hammasi bizda." },
    { title: "Siz 15% olasiz", text: "Mijoz loyihani to‘liq to‘lashi bilan 15% sizga o‘tkaziladi." },
  ],
  exampleTitle: "Oddiy misol",
  exampleLead: "Mijoz loyiha buyurtma qildi — siz shuncha olasiz:",
  project: "Loyiha",
  you: "Sizga",
  exampleNote: "Loyiha qanchalik qimmat bo‘lsa, sizning 15% shunchalik ko‘p. Summa — mijoz bilan shartnomadagi summa.",
  rulesTitle: "Qoidalar — qisqacha",
  rules: [
    "Doim shartnoma summasidan 15%. Foydadan emas, bosqichlarsiz va mayda shriftsiz.",
    "Cheklovsiz va muddatsiz: qancha mijoz olib kelsangiz ham, har bir loyihadan 15%.",
    "Pul — mijoz loyihani to‘liq to‘laganda.",
    "Mijozingiz — sizniki: havolangiz orqali yoki o‘zingizdan kelgan arizani sizga yozamiz. Avval biz bilan ishlagan mijozlar hisobga olinmaydi.",
  ],
  servicesTitle: "Nimalarni olib kelish mumkin",
  from: (price) => `${price} dan`,
  ctaTitle: "Boshlaymizmi?",
  ctaText: "Bizga Telegramda yozing — agentligingizni qo‘shamiz va havolangizni yuboramiz. Bu besh daqiqa vaqt oladi.",
  ctaBot: "Telegramda yozish",
  ctaStudio: "Studiya taqdimoti",
  teaser: "Siz agentlik yoki IT-kompaniyamisiz? Sizga — har bir mijoz loyihasidan doim 15%.",
  teaserCta: "Agentliklar uchun shartlar",
};

const zh: AgencyDeckCopy = {
  kicker: "面向代理机构",
  title: "推荐客户，每个项目赚取 15%",
  lead: "适用于营销代理、网页工作室和 IT 公司。您的客户向我们订购网站、机器人或应用，您即可获得合同金额的 15%。简单明了，始终如一。",
  bigLabel: "按您推荐的每个项目的合同金额计算",
  stepsTitle: "三步说明",
  steps: [
    { title: "您推荐客户", text: "把您的链接发给客户，或直接告诉我们：“我们有位客户需要网站”。" },
    { title: "我们完成项目", text: "需求分析、签约、开发和上线，全部由我们负责。" },
    { title: "您获得 15%", text: "客户全额付款后，您的 15% 即转给您。" },
  ],
  exampleTitle: "简单示例",
  exampleLead: "客户订购了项目，您将获得：",
  project: "项目",
  you: "您获得",
  exampleNote: "项目越大，您的 15% 越多。金额以与客户签订的合同为准。",
  rulesTitle: "规则一览",
  rules: [
    "始终按合同金额的 15% 计算。不按利润，不分档位，没有附加条款。",
    "不限数量，不限期限：无论推荐多少客户，每个项目都是 15%。",
    "客户全额付款后结算。",
    "您的客户归您：通过您的链接或由您直接提交的需求都记在您名下。此前已与我们合作的客户不计入。",
  ],
  servicesTitle: "可以推荐的项目",
  from: (price) => `${price} 起`,
  ctaTitle: "开始吧？",
  ctaText: "在 Telegram 上联系我们：我们为您的机构开通并发送您的专属链接，只需五分钟。",
  ctaBot: "在 Telegram 联系我们",
  ctaStudio: "工作室介绍",
  teaser: "您是代理机构或 IT 公司吗？每个客户项目您都获得 15%，始终如此。",
  teaserCta: "代理机构合作条件",
};

const uk: AgencyDeckCopy = {
  kicker: "Для агенцій",
  title: "Приводьте клієнтів — отримуйте 15% з кожного проєкту",
  lead: "Для маркетингових агенцій, вебстудій та IT-компаній. Ваш клієнт замовляє в нас сайт, бот або застосунок — ви отримуєте 15% від суми договору. Просто й завжди однаково.",
  bigLabel: "від суми кожного проєкту, який ви привели",
  stepsTitle: "Як це працює — 3 кроки",
  steps: [
    { title: "Ви приводите клієнта", text: "Даєте йому своє посилання або пишете нам самі: «у нас клієнт, йому потрібен сайт»." },
    { title: "Ми робимо проєкт", text: "Розбір задачі, договір, розробка й запуск — усе на нас." },
    { title: "Ви отримуєте 15%", text: "Щойно клієнт оплатив проєкт повністю, ваші 15% надходять вам." },
  ],
  exampleTitle: "Приклад на пальцях",
  exampleLead: "Клієнт замовив проєкт — стільки отримуєте ви:",
  project: "Проєкт",
  you: "Вам",
  exampleNote: "Що дорожчий проєкт, то більші ваші 15%. Сума — та, що в договорі з клієнтом.",
  rulesTitle: "Правила — коротко",
  rules: [
    "Завжди 15% від суми договору. Не від прибутку, без східців і дрібного шрифту.",
    "Без ліміту й терміну: 15% з кожного проєкту, скільки б клієнтів ви не привели.",
    "Гроші — коли клієнт оплатив проєкт повністю.",
    "Ваш клієнт — ваш: заявку за вашим посиланням або від вас самих ми записуємо на вас. Клієнти, які вже працювали з нами, не зараховуються.",
  ],
  servicesTitle: "Що можна приводити",
  from: (price) => `від ${price}`,
  ctaTitle: "Почнімо?",
  ctaText: "Напишіть нам у Telegram — заведемо вашу агенцію й надішлемо ваше посилання. Це займе п’ять хвилин.",
  ctaBot: "Написати в Telegram",
  ctaStudio: "Презентація студії",
  teaser: "Ви агенція чи IT-компанія? Вам — 15% з кожного проєкту клієнта, завжди.",
  teaserCta: "Умови для агенцій",
};

const pl: AgencyDeckCopy = {
  kicker: "Dla agencji",
  title: "Przyprowadzaj klientów — zarabiaj 15% z każdego projektu",
  lead: "Dla agencji marketingowych, studiów webowych i firm IT. Twój klient zamawia u nas stronę, bota lub aplikację — Ty dostajesz 15% od kwoty umowy. Prosto i zawsze tak samo.",
  bigLabel: "od kwoty każdego projektu, który przyprowadzisz",
  stepsTitle: "Jak to działa — 3 kroki",
  steps: [
    { title: "Przyprowadzasz klienta", text: "Dajesz mu swój link albo piszesz do nas sam: „mamy klienta, potrzebuje strony”." },
    { title: "My robimy projekt", text: "Analiza zadania, umowa, wykonanie i uruchomienie — wszystko po naszej stronie." },
    { title: "Dostajesz 15%", text: "Gdy tylko klient zapłaci za projekt w całości, Twoje 15% trafia do Ciebie." },
  ],
  exampleTitle: "Prosty przykład",
  exampleLead: "Klient zamówił projekt — tyle dostajesz Ty:",
  project: "Projekt",
  you: "Dla Ciebie",
  exampleNote: "Im droższy projekt, tym więcej Twoich 15%. Kwota to ta z umowy z klientem.",
  rulesTitle: "Zasady w skrócie",
  rules: [
    "Zawsze 15% od kwoty umowy. Nie od zysku, bez progów i drobnego druku.",
    "Bez limitu i terminu: 15% z każdego projektu, niezależnie od liczby klientów.",
    "Pieniądze — gdy klient zapłaci za projekt w całości.",
    "Twój klient jest Twój: zgłoszenie z Twojego linku lub od Ciebie zapisujemy na Ciebie. Klienci, którzy już z nami pracowali, się nie liczą.",
  ],
  servicesTitle: "Co możesz przyprowadzić",
  from: (price) => `od ${price}`,
  ctaTitle: "Zaczynamy?",
  ctaText: "Napisz do nas na Telegramie — dodamy Twoją agencję i wyślemy Twój link. To zajmie pięć minut.",
  ctaBot: "Napisz na Telegramie",
  ctaStudio: "Prezentacja studia",
  teaser: "Jesteś agencją lub firmą IT? Dostajesz 15% z każdego projektu klienta, zawsze.",
  teaserCta: "Warunki dla agencji",
};

const copies: Record<Locale, AgencyDeckCopy> = { ru, en, uz, zh, uk, pl };

export function agencyDeckCopy(locale: Locale): AgencyDeckCopy {
  return copies[locale];
}
