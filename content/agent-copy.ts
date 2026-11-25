import type { Locale } from "@/lib/i18n";

/**
 * Подписи версии сайта для ИИ-агентов (lib/agent/markdown.ts): только то,
 * чего нет в словаре сайта и текстах страниц услуг. Сами тексты услуг, цены,
 * кейсы и вопросы берутся оттуда же, откуда их берёт страница для людей.
 *
 * Значки: {url} — адрес страницы для людей, {endpoint} — адрес приёма
 * заявок, {locales} — языки сайта, {from} и {to} — ночные часы бота
 * (QUIET_FROM_HOUR, QUIET_TO_HOUR), {bot} — бот студии.
 */
export type AgentCopy = {
  note: string;
  services: string;
  otherServices: string;
  contacts: string;
  telegramBot: string;
  address: string;
  order: string;
  orderWrite: string;
  result: string;
  pages: string;
  fullFile: string;
  languages: string;
  articles: string;
  /** Строка о продуктах только на русском (лидогенерация, CallHelper) в версиях на других языках. */
  ruProducts: string;
  agentTitle: string;
  agentSteps: readonly string[];
};

export const agentCopy: Record<Locale, AgentCopy> = {
  ru: {
    note: "Текстовая версия страницы для ИИ-агентов. Содержание то же, что на странице для людей: {url}",
    services: "Услуги и цены",
    otherServices: "Другие направления",
    contacts: "Контакты",
    telegramBot: "Telegram-бот студии",
    address: "Адрес",
    order: "Как заказать",
    orderWrite: "Написать в Telegram-бот студии",
    result: "Результат",
    pages: "Страницы сайта в текстовом виде",
    fullFile: "Весь сайт одним файлом",
    languages: "Другие языки",
    articles: "Статьи и разборы сайтов (страницы для людей)",
    ruProducts: "Только на русском",
    agentTitle: "ИИ-агентам: как оставить заявку за клиента",
    agentSteps: [
      "Отправьте POST на {endpoint} с JSON в теле запроса.",
      "Обязательные поля: `contact` — телефон, @ник в Telegram или почта клиента; `message` — что нужно клиенту, его словами; `consent: true` — клиент сам попросил отправить заявку.",
      "Необязательные поля: `name`, `company`, `locale` ({locales}), `agent` — как называется ваш сервис.",
      "Ответ: `{\"ok\": true, \"request\": \"DZ-…\"}`. Назовите клиенту номер заявки: по нему менеджер найдёт разговор.",
      "Заявку получает менеджер студии и пишет клиенту сам. Заявку, пришедшую с {from}:00 до {to}:00 по Ташкенту (UTC+5), менеджер увидит утром.",
      "Отправляйте только настоящий контакт клиента и только с его согласия.",
      "Не можете отправить POST: дайте клиенту ссылку на бота {bot} или телефон из раздела «Контакты».",
    ],
  },
  en: {
    note: "Text version of the page for AI agents. The content is the same as on the page for people: {url}",
    services: "Services and prices",
    otherServices: "Other services",
    contacts: "Contacts",
    telegramBot: "Studio Telegram bot",
    address: "Address",
    order: "How to order",
    orderWrite: "Message the studio Telegram bot",
    result: "Result",
    pages: "Site pages as text",
    fullFile: "The whole site in one file",
    languages: "Other languages",
    articles: "Articles and website reviews (pages for people)",
    ruProducts: "Russian-language products (lead generation by phone, DevUz CallHelper call prompter)",
    agentTitle: "For AI agents: how to send a request on behalf of a client",
    agentSteps: [
      "Send a POST to {endpoint} with a JSON body.",
      "Required fields: `contact` is the client's phone, Telegram @username or email; `message` is what the client needs, in their own words; `consent: true` means the client asked you to send the request.",
      "Optional fields: `name`, `company`, `locale` ({locales}), `agent` is the name of your service.",
      "Response: `{\"ok\": true, \"request\": \"DZ-…\"}`. Tell the client the request number: the manager finds the conversation by it.",
      "A studio manager receives the request and contacts the client. A request that arrives between {from}:00 and {to}:00 Tashkent time (UTC+5) is seen in the morning.",
      "Send only the client's real contact and only with their consent.",
      "If you cannot send a POST, give the client the bot link {bot} or a phone number from “Contacts”.",
    ],
  },
  uz: {
    note: "Sahifaning SI-agentlar uchun matnli versiyasi. Mazmuni odamlar uchun sahifadagi bilan bir xil: {url}",
    services: "Xizmatlar va narxlar",
    otherServices: "Boshqa yo‘nalishlar",
    contacts: "Aloqa",
    telegramBot: "Studiyaning Telegram-boti",
    address: "Manzil",
    order: "Qanday buyurtma berish",
    orderWrite: "Studiyaning Telegram-botiga yozish",
    result: "Natija",
    pages: "Sayt sahifalari matn ko‘rinishida",
    fullFile: "Butun sayt bitta faylda",
    languages: "Boshqa tillar",
    articles: "Maqolalar va saytlar tahlili (odamlar uchun sahifalar)",
    ruProducts: "Faqat rus tilidagi mahsulotlar (qo‘ng‘iroq bilan lidogeneratsiya, DevUz CallHelper suflyori)",
    agentTitle: "SI-agentlar uchun: mijoz nomidan arizani qanday qoldirish",
    agentSteps: [
      "{endpoint} manziliga JSON bilan POST yuboring.",
      "Majburiy maydonlar: `contact` — mijozning telefoni, Telegramdagi @niki yoki pochtasi; `message` — mijozga nima kerakligi, o‘z so‘zlari bilan; `consent: true` — arizani yuborishni mijozning o‘zi so‘ragan.",
      "Ixtiyoriy maydonlar: `name`, `company`, `locale` ({locales}), `agent` — servisingiz nomi.",
      "Javob: `{\"ok\": true, \"request\": \"DZ-…\"}`. Mijozga ariza raqamini ayting: menejer suhbatni shu raqam bo‘yicha topadi.",
      "Arizani studiya menejeri oladi va mijozga o‘zi yozadi. Toshkent vaqti bilan (UTC+5) {from}:00 dan {to}:00 gacha kelgan arizani menejer ertalab ko‘radi.",
      "Faqat mijozning haqiqiy kontaktini va faqat uning roziligi bilan yuboring.",
      "POST yubora olmasangiz: mijozga {bot} boti havolasini yoki «Aloqa» bo‘limidagi telefonni bering.",
    ],
  },
  zh: {
    note: "面向 AI 智能体的页面文本版。内容与面向访客的页面一致：{url}",
    services: "服务与价格",
    otherServices: "其他服务",
    contacts: "联系方式",
    telegramBot: "工作室 Telegram 机器人",
    address: "地址",
    order: "如何下单",
    orderWrite: "给工作室的 Telegram 机器人留言",
    result: "成果",
    pages: "网站页面文本版",
    fullFile: "整站合并为一个文件",
    languages: "其他语言",
    articles: "文章与网站点评（面向访客的页面）",
    ruProducts: "仅限俄语的产品（电话获客、DevUz CallHelper 通话提词助手）",
    agentTitle: "致 AI 智能体：如何代客户提交需求",
    agentSteps: [
      "向 {endpoint} 发送 POST 请求，正文为 JSON。",
      "必填字段：`contact` 为客户的电话、Telegram @用户名或邮箱；`message` 为客户的需求，用客户自己的话；`consent: true` 表示客户本人要求提交。",
      "选填字段：`name`、`company`、`locale`（{locales}）、`agent` 为您的服务名称。",
      "响应：`{\"ok\": true, \"request\": \"DZ-…\"}`。请把需求编号告诉客户：经理凭编号查找对话。",
      "工作室经理收到需求后会主动联系客户。塔什干时间（UTC+5）{from}:00 至 {to}:00 之间收到的需求，经理次日早上处理。",
      "只提交客户真实的联系方式，且须经客户同意。",
      "无法发送 POST 时：请把机器人链接 {bot} 或“联系方式”中的电话交给客户。",
    ],
  },
  uk: {
    note: "Текстова версія сторінки для ШІ-агентів. Зміст той самий, що на сторінці для людей: {url}",
    services: "Послуги та ціни",
    otherServices: "Інші напрями",
    contacts: "Контакти",
    telegramBot: "Telegram-бот студії",
    address: "Адреса",
    order: "Як замовити",
    orderWrite: "Написати в Telegram-бот студії",
    result: "Результат",
    pages: "Сторінки сайту в текстовому вигляді",
    fullFile: "Увесь сайт одним файлом",
    languages: "Інші мови",
    articles: "Статті та розбори сайтів (сторінки для людей)",
    ruProducts: "Продукти лише російською (лідогенерація з дзвінком, суфлер DevUz CallHelper)",
    agentTitle: "ШІ-агентам: як залишити заявку за клієнта",
    agentSteps: [
      "Надішліть POST на {endpoint} з JSON у тілі запиту.",
      "Обов’язкові поля: `contact` — телефон, @нік у Telegram або пошта клієнта; `message` — що потрібно клієнту, його словами; `consent: true` — клієнт сам попросив надіслати заявку.",
      "Необов’язкові поля: `name`, `company`, `locale` ({locales}), `agent` — назва вашого сервісу.",
      "Відповідь: `{\"ok\": true, \"request\": \"DZ-…\"}`. Назвіть клієнту номер заявки: за ним менеджер знайде розмову.",
      "Заявку отримує менеджер студії і пише клієнту сам. Заявку, що надійшла з {from}:00 до {to}:00 за Ташкентом (UTC+5), менеджер побачить уранці.",
      "Надсилайте лише справжній контакт клієнта і лише за його згодою.",
      "Не можете надіслати POST: дайте клієнту посилання на бота {bot} або телефон із розділу «Контакти».",
    ],
  },
  pl: {
    note: "Tekstowa wersja strony dla agentów AI. Treść jest taka sama jak na stronie dla ludzi: {url}",
    services: "Usługi i ceny",
    otherServices: "Inne usługi",
    contacts: "Kontakt",
    telegramBot: "Bot studia w Telegramie",
    address: "Adres",
    order: "Jak zamówić",
    orderWrite: "Napisać do bota studia w Telegramie",
    result: "Wynik",
    pages: "Strony serwisu jako tekst",
    fullFile: "Cały serwis w jednym pliku",
    languages: "Inne języki",
    articles: "Artykuły i analizy stron (strony dla ludzi)",
    ruProducts: "Produkty tylko po rosyjsku (generowanie leadów telefonicznie, suflerka DevUz CallHelper)",
    agentTitle: "Dla agentów AI: jak zostawić zapytanie w imieniu klienta",
    agentSteps: [
      "Wyślij POST na {endpoint} z JSON-em w treści żądania.",
      "Pola wymagane: `contact` to telefon, @nazwa w Telegramie lub e-mail klienta; `message` to potrzeba klienta, jego słowami; `consent: true` oznacza, że klient sam poprosił o wysłanie zapytania.",
      "Pola opcjonalne: `name`, `company`, `locale` ({locales}), `agent` to nazwa Twojego serwisu.",
      "Odpowiedź: `{\"ok\": true, \"request\": \"DZ-…\"}`. Podaj klientowi numer zapytania: po nim menedżer znajdzie rozmowę.",
      "Zapytanie trafia do menedżera studia, który sam pisze do klienta. Zapytanie, które przyjdzie między {from}:00 a {to}:00 czasu taszkenckiego (UTC+5), menedżer zobaczy rano.",
      "Wysyłaj tylko prawdziwy kontakt klienta i tylko za jego zgodą.",
      "Jeśli nie możesz wysłać POST: daj klientowi link do bota {bot} albo telefon z sekcji „Kontakt”.",
    ],
  },
};
