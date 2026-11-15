import type { Locale } from "@/lib/i18n";

export type LegalSection = { heading: string; body: string[] };
export type LegalDoc = { title: string; updated: string; intro: string; sections: LegalSection[] };

/**
 * Политика конфиденциальности.
 *
 * Отдельный пункт про AI-ассистента здесь не формальность: диалог посетителя
 * действительно уходит во внешний сервис, и умолчать об этом значило бы
 * собирать персональные данные, не сказав, куда они попадают.
 *
 * Поставщик по имени не назван (владелец, 15.11.2026: «модель Антропик мы
 * не прописываем вообще», «на всех языках убираем»). Политика говорит, что
 * сообщение обрабатывает поставщик технологии ИИ и в какой стране, США:
 * куда уходят данные, клиент знает. Ни имени компании, ни марки модели в
 * текстах сайта нет, это держит tests/legal.test.ts.
 *
 * Раздел про доступ сотрудников появился вместе с панелью. Пока заявки
 * жили только в Telegram, писать было не о чем; теперь у них есть внутреннее
 * хранилище с именным входом — и клиент вправе знать, что именно происходит
 * с его данными после отправки формы.
 *
 * TODO(владелец): перед публикацией вписать реквизиты юрлица и адрес — без
 * них документ не является офертой и не защищает студию.
 */
const ru: LegalDoc = {
  title: "Политика конфиденциальности",
  updated: "Действует с 15 ноября 2026 года",
  intro:
    "Здесь описано, какие данные собирает сайт DevUz Studio, зачем они нужны, кому передаются и как их удалить. Документ написан обычным языком: если что-то осталось непонятным, напишите нам, и мы объясним.",
  sections: [
    {
      heading: "Какие данные мы собираем",
      body: [
        "Контактные данные, которые вы оставляете сами: имя, телефон, адрес электронной почты, имя пользователя в Telegram, название компании.",
        "Содержание переписки с AI-ассистентом и текст заявки из формы обратной связи.",
        "Технические данные: IP-адрес, тип браузера и устройства, язык интерфейса, страницы, которые вы открывали. Они нужны для защиты от автоматических запросов и для статистики посещаемости.",
      ],
    },
    {
      heading: "Зачем они нужны",
      body: [
        "Чтобы ответить на ваш запрос, подготовить коммерческое предложение и связаться с вами.",
        "Чтобы понять, какая услуга вам подходит, и передать менеджеру контекст разговора — без этого вам пришлось бы пересказывать задачу заново.",
        "Чтобы улучшать сайт и защищать его от злоупотреблений.",
        "Мы не продаём данные, не передаём их рекламным сетям и не рассылаем писем, на которые вы не подписывались.",
      ],
    },
    {
      heading: "AI-ассистент в чате",
      body: [
        "Первую линию общения ведёт AI-ассистент студии. Чтобы сформировать ответ, текст вашего сообщения обрабатывается на инфраструктуре нашего поставщика технологии ИИ в США.",
        "Не отправляйте в чат пароли, реквизиты карт, доступы к системам и другие сведения, которые не должны покидать вашу компанию. Ассистент никогда не запрашивает их сам.",
        "Итог разговора и его расшифровка передаются менеджеру отдела продаж в Telegram, чтобы он продолжил разговор с того места, где вы остановились.",
      ],
    },
    {
      heading: "Кому передаются данные",
      body: [
        "Поставщик технологии ИИ (США) — обработка сообщений AI-ассистентом.",
        "Telegram — доставка заявок менеджерам отдела продаж.",
        "Supabase — хранение заявок и истории обращений.",
        "Сервисы веб-аналитики Google и Яндекс — обезличенная статистика посещаемости.",
        "Каждый из них обрабатывает данные по собственным правилам, с которыми можно ознакомиться на их сайтах.",
      ],
    },
    {
      heading: "Кто из студии видит ваши данные",
      body: [
        "Заявки лежат в служебной панели, вход в которую есть только у сотрудников студии. Доступ именной и привязан к личному аккаунту сотрудника в Telegram — общего пароля не существует.",
        "Каждое открытие карточки заявки записывается: кто открыл и когда. Эти записи нельзя ни изменить, ни удалить.",
        "Сотрудник, покинувший студию, теряет доступ немедленно.",
      ],
    },
    {
      heading: "Сколько мы храним данные",
      body: [
        "Заявки и переписку — до пяти лет с момента последнего обращения. Этот срок нужен, чтобы вернуться к вашему проекту, если вы обратитесь повторно, и чтобы у обеих сторон оставались подтверждения договорённостей.",
        "Журнал доступа сотрудников — до пяти лет. По нему видно, кто из студии работал с вашей заявкой.",
        "Технические логи — до 90 дней.",
        "По вашему запросу удалим раньше.",
      ],
    },
    {
      heading: "Данные из аккаунтов Google",
      body: [
        "Сотрудники студии могут подключить свой аккаунт Google во внутренней панели. Тогда панель с их разрешения читает статистику сайта в Google Analytics (только просмотр) и данные рекламных кабинетов студии в Google Ads, включая планировщик ключевых слов: сколько раз в месяц ищут фразу.",
        "Эти данные нужны только для работы самой панели: показать сотрудникам статистику сайта, подобрать запросы для статей на сайте и вести рекламу студии. Изменения в рекламе вносятся только после того, как сотрудник нажмёт кнопку.",
        "Доступ к Google хранится в зашифрованном хранилище и никому не показывается. Данные из Google мы не продаём, не передаём третьим лицам, не используем для рекламы и для обучения моделей ИИ. Обобщённые цифры поисковых запросов, без личных данных, могут уходить нашему поставщику ИИ только для того, чтобы написать статью для сайта.",
        "Использование и передача сведений, полученных через API Google, соответствуют Политике в отношении пользовательских данных сервисов Google API (Google API Services User Data Policy), включая требования об ограниченном использовании (Limited Use).",
        "Отозвать доступ можно в любой момент на странице myaccount.google.com/permissions или кнопкой в панели. После отзыва полученные данные удаляются в течение 30 дней, по запросу — раньше.",
      ],
    },
    {
      heading: "Ваши права",
      body: [
        "Вы можете запросить копию своих данных, попросить их исправить или удалить, а также отозвать согласие на обработку.",
        "Для этого напишите на нашу почту с адреса или номера, который вы оставляли. Мы ответим в течение десяти рабочих дней.",
      ],
    },
    {
      heading: "Файлы cookie",
      body: [
        "Сайт сохраняет один служебный файл cookie с выбранным языком интерфейса, чтобы при следующем заходе открыть сайт на нём же.",
        "Сотрудники студии, входящие в служебную панель, получают ещё один — сессионный, только для неё. Посетителям сайта он не выдаётся.",
        "Если подключена веб-аналитика, она устанавливает свои файлы cookie. Их можно отключить в настройках браузера — на работу сайта это не повлияет.",
      ],
    },
    {
      heading: "Изменения",
      body: [
        "Если политика изменится, мы обновим дату в начале документа. Существенные изменения обычно означают появление нового сервиса-обработчика — они всегда будут перечислены в разделе «Кому передаются данные».",
      ],
    },
  ],
};

const en: LegalDoc = {
  title: "Privacy policy",
  updated: "In effect from 15 November 2026",
  intro:
    "This page explains what data the DevUz Studio site collects, why it is needed, who it is shared with and how to have it deleted. It is written in plain language — if anything remains unclear, write to us and we will explain.",
  sections: [
    {
      heading: "What we collect",
      body: [
        "Contact details you provide yourself: name, phone number, email address, Telegram username, company name.",
        "The content of your conversation with the AI assistant and the text of any contact-form request.",
        "Technical data: IP address, browser and device type, interface language, pages you opened. This is used to protect against automated requests and to measure traffic.",
      ],
    },
    {
      heading: "Why we need it",
      body: [
        "To answer your request, prepare a proposal and get in touch with you.",
        "To work out which service fits you and to hand the manager the context of the conversation — otherwise you would have to explain everything again.",
        "To improve the site and protect it from abuse.",
        "We do not sell data, do not pass it to advertising networks and do not send emails you did not subscribe to.",
      ],
    },
    {
      heading: "The AI assistant in the chat",
      body: [
        "The first line of contact is the studio's own AI assistant. To produce a reply, the text of your message is processed on the infrastructure of our AI technology provider in the USA.",
        "Do not send passwords, card details, system credentials or anything else that must not leave your company. The assistant never asks for them.",
        "The outcome of the conversation and its transcript are passed to a sales manager over Telegram so they can continue from where you stopped.",
      ],
    },
    {
      heading: "Who the data is shared with",
      body: [
        "Our AI technology provider (USA) — processing of messages by the AI assistant.",
        "Telegram — delivery of requests to sales managers.",
        "Supabase — storage of requests and conversation history.",
        "Google and Yandex web analytics — anonymised traffic statistics.",
        "Each of them processes data under its own terms, available on their websites.",
      ],
    },
    {
      heading: "Who inside the studio can see your data",
      body: [
        "Requests live in an internal panel that only studio staff can enter. Access is personal and tied to the employee's own Telegram account — there is no shared password.",
        "Every time a request is opened, we record who opened it and when. Those records cannot be edited or deleted.",
        "An employee who leaves the studio loses access immediately.",
      ],
    },
    {
      heading: "How long we keep it",
      body: [
        "Requests and conversations — up to five years from your last contact, so we can pick your project back up if you return and so both sides keep a record of what was agreed.",
        "The staff access log — up to five years. It shows who at the studio worked with your request.",
        "Technical logs — up to 90 days.",
        "We will delete anything earlier at your request.",
      ],
    },
    {
      heading: "Data from Google accounts",
      body: [
        "Studio staff can connect their Google account in the internal panel. With their permission the panel then reads the site's statistics in Google Analytics (read-only) and the data of the studio's own Google Ads accounts, including Keyword Planner: how many times a month a phrase is searched for.",
        "This data is used only for the panel itself: to show staff the site's statistics, to choose search queries for articles on the site and to manage the studio's own advertising. Changes to ads are made only after a staff member presses the button.",
        "Access to Google is kept in an encrypted vault and is shown to no one. We do not sell Google data, do not transfer it to third parties and do not use it for advertising or to train AI models. Aggregated search-volume figures, with no personal data, may be passed to our AI provider solely to write an article for the site.",
        "DevUz Studio's use and transfer of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements.",
        "Access can be revoked at any time at myaccount.google.com/permissions or with the button in the panel. After revocation the data received is deleted within 30 days, or sooner on request.",
      ],
    },
    {
      heading: "Your rights",
      body: [
        "You may request a copy of your data, ask for it to be corrected or deleted, and withdraw your consent to processing.",
        "Write to our email from the address or number you provided. We reply within ten working days.",
      ],
    },
    {
      heading: "Cookies",
      body: [
        "The site stores one functional cookie holding your chosen interface language, so your next visit opens in the same one.",
        "Studio staff signing in to the internal panel receive a second, session-only cookie scoped to that panel. Site visitors are never issued it.",
        "If web analytics is connected, it sets its own cookies. You can disable them in your browser settings — the site will keep working.",
      ],
    },
    {
      heading: "Changes",
      body: [
        "If this policy changes we will update the date at the top. Substantive changes usually mean a new processor has been added — those are always listed under «Who the data is shared with».",
      ],
    },
  ],
};

const uz: LegalDoc = {
  title: "Maxfiylik siyosati",
  updated: "2026-yil 15-noyabrdan kuchga kiradi",
  intro:
    "Bu sahifada DevUz Studio sayti qanday ma’lumotlarni to‘plashi, ular nima uchun kerakligi, kimga uzatilishi va qanday o‘chirilishi tushuntirilgan. Hujjat oddiy tilda yozilgan: agar biror narsa tushunarsiz qolsa, bizga yozing.",
  sections: [
    {
      heading: "Qanday ma’lumotlarni to‘playmiz",
      body: [
        "O‘zingiz qoldiradigan aloqa ma’lumotlari: ism, telefon, elektron pochta, Telegramdagi foydalanuvchi nomi, kompaniya nomi.",
        "AI-yordamchi bilan yozishmangiz mazmuni va aloqa formasidagi ariza matni.",
        "Texnik ma’lumotlar: IP-manzil, brauzer va qurilma turi, interfeys tili, ochgan sahifalaringiz. Ular avtomatik so‘rovlardan himoya va tashriflar statistikasi uchun kerak.",
      ],
    },
    {
      heading: "Ular nima uchun kerak",
      body: [
        "So‘rovingizga javob berish, tijorat taklifini tayyorlash va siz bilan bog‘lanish uchun.",
        "Qaysi xizmat sizga mos kelishini aniqlash va menejerga suhbat kontekstini uzatish uchun — busiz vazifani qaytadan aytib berishingizga to‘g‘ri kelardi.",
        "Saytni yaxshilash va suiiste’moldan himoya qilish uchun.",
        "Biz ma’lumotlarni sotmaymiz, reklama tarmoqlariga bermaymiz va siz obuna bo‘lmagan xatlarni yubormaymiz.",
      ],
    },
    {
      heading: "Chatdagi AI-yordamchi",
      body: [
        "Muloqotning birinchi liniyasini studiyaning AI-yordamchisi olib boradi. Javobni shakllantirish uchun xabaringiz matni AI texnologiyasi yetkazib beruvchimizning AQShdagi infratuzilmasida qayta ishlanadi.",
        "Chatga parollar, karta rekvizitlari, tizimlarga kirish ma’lumotlari va kompaniyangizdan chiqmasligi kerak bo‘lgan boshqa ma’lumotlarni yubormang. Yordamchi ularni hech qachon o‘zi so‘ramaydi.",
        "Suhbat natijasi va uning matni menejerga Telegram orqali uzatiladi.",
      ],
    },
    {
      heading: "Ma’lumotlar kimga uzatiladi",
      body: [
        "AI texnologiyasi yetkazib beruvchisi (AQSh) — xabarlarni AI-yordamchi tomonidan qayta ishlash.",
        "Telegram — arizalarni sotuv bo‘limi menejerlariga yetkazish.",
        "Supabase — arizalar va murojaatlar tarixini saqlash.",
        "Google va Yandeks veb-tahlil xizmatlari — shaxssizlantirilgan tashrif statistikasi.",
        "Ularning har biri ma’lumotlarni o‘z qoidalari asosida qayta ishlaydi; qoidalar bilan ularning saytlarida tanishish mumkin.",
      ],
    },
    {
      heading: "Studiyada ma’lumotlaringizni kim ko‘radi",
      body: [
        "Arizalar faqat studiya xodimlari kiradigan xizmat panelida saqlanadi. Kirish shaxsiy va xodimning Telegramdagi shaxsiy akkauntiga bog‘langan — umumiy parol yo‘q.",
        "Ariza kartochkasi har ochilganda kim va qachon ochgani yozib qo‘yiladi. Bu yozuvlarni o‘zgartirib ham, o‘chirib ham bo‘lmaydi.",
        "Studiyani tark etgan xodim kirish huquqini darhol yo‘qotadi.",
      ],
    },
    {
      heading: "Ma’lumotlarni qancha saqlaymiz",
      body: [
        "Arizalar va yozishmalar — oxirgi murojaatdan boshlab besh yilgacha: qaytib kelsangiz loyihangizga qaytish va kelishuvlar tasdig‘i ikkala tomonda qolishi uchun.",
        "Xodimlar kirish jurnali — besh yilgacha. Undan studiyada arizangiz bilan kim ishlagani ko‘rinadi.",
        "Texnik jurnallar — 90 kungacha.",
        "So‘rovingiz bo‘yicha oldinroq o‘chiramiz.",
      ],
    },
    {
      heading: "Google akkauntlaridan olingan ma’lumotlar",
      body: [
        "Studiya xodimlari ichki panelda o‘z Google akkauntini ulashi mumkin. Shunda panel ularning ruxsati bilan saytning Google Analytics’dagi statistikasini (faqat ko‘rish) va studiyaning Google Ads reklama kabinetlari ma’lumotlarini, jumladan kalit so‘zlar rejalashtiruvchisini o‘qiydi: ibora oyiga necha marta qidirilishini.",
        "Bu ma’lumotlar faqat panelning o‘zi uchun kerak: xodimlarga sayt statistikasini ko‘rsatish, saytdagi maqolalar uchun so‘rovlarni tanlash va studiya reklamasini yuritish. Reklamaga o‘zgartirishlar faqat xodim tugmani bosgandan keyin kiritiladi.",
        "Google’ga kirish shifrlangan omborda saqlanadi va hech kimga ko‘rsatilmaydi. Google ma’lumotlarini sotmaymiz, uchinchi shaxslarga bermaymiz, reklama va sun’iy intellekt modellarini o‘qitish uchun ishlatmaymiz. Shaxsiy ma’lumotlarsiz umumlashtirilgan qidiruv raqamlari faqat sayt uchun maqola yozish maqsadida sun’iy intellekt yetkazib beruvchimizga yuborilishi mumkin.",
        "Google API orqali olingan ma’lumotlardan foydalanish va ularni uzatish Google API Services User Data Policy talablariga, jumladan cheklangan foydalanish (Limited Use) talablariga mos keladi.",
        "Ruxsatni istalgan vaqtda myaccount.google.com/permissions sahifasida yoki paneldagi tugma bilan bekor qilish mumkin. Bekor qilingandan keyin olingan ma’lumotlar 30 kun ichida, so‘rov bo‘yicha esa ertaroq o‘chiriladi.",
      ],
    },
    {
      heading: "Sizning huquqlaringiz",
      body: [
        "Ma’lumotlaringiz nusxasini so‘rashingiz, ularni tuzatish yoki o‘chirishni talab qilishingiz, roziligingizni qaytarib olishingiz mumkin.",
        "Buning uchun qoldirgan manzilingiz yoki raqamingizdan bizning pochtamizga yozing. O‘n ish kuni ichida javob beramiz.",
      ],
    },
    {
      heading: "Cookie fayllari",
      body: [
        "Sayt tanlangan interfeys tili bilan bitta xizmat cookie faylini saqlaydi.",
        "Xizmat paneliga kiradigan studiya xodimlari faqat o‘sha panel uchun ikkinchi, sessiya cookie faylini oladi. Sayt tashrifchilariga u berilmaydi.",
        "Veb-tahlil ulangan bo‘lsa, u o‘z cookie fayllarini o‘rnatadi. Ularni brauzer sozlamalarida o‘chirish mumkin.",
      ],
    },
    {
      heading: "O‘zgarishlar",
      body: [
        "Siyosat o‘zgarsa, hujjat boshidagi sanani yangilaymiz. Muhim o‘zgarishlar odatda yangi qayta ishlovchi xizmat paydo bo‘lganini bildiradi.",
      ],
    },
  ],
};

const zh: LegalDoc = {
  title: "隐私政策",
  updated: "自 2026 年 11 月 15 日起生效",
  intro:
    "本页说明 DevUz Studio 网站会收集哪些数据、为何需要这些数据、会与谁共享，以及如何要求删除。内容以平实语言写成；若仍有不清楚之处，欢迎来信询问。",
  sections: [
    {
      heading: "我们收集哪些数据",
      body: [
        "您主动提供的联系方式：姓名、电话、电子邮箱、Telegram 用户名、公司名称。",
        "您与 AI 助手的对话内容，以及联系表单中填写的需求文字。",
        "技术数据：IP 地址、浏览器与设备类型、界面语言、您访问过的页面。这些用于防范自动化请求与统计访问量。",
      ],
    },
    {
      heading: "为何需要这些数据",
      body: [
        "用于回复您的咨询、准备报价方案并与您取得联系。",
        "用于判断哪项服务适合您，并把对话背景交给客户经理 —— 否则您需要把需求重新讲一遍。",
        "用于改进网站并防止滥用。",
        "我们不出售数据，不提供给广告网络，也不会发送您未订阅的邮件。",
      ],
    },
    {
      heading: "聊天中的 AI 助手",
      body: [
        "第一线接待由工作室自有的 AI 助手完成。为生成回复，您的消息文本会在我们位于美国的 AI 技术供应商的基础设施上处理。",
        "请勿在聊天中发送密码、银行卡信息、系统凭据，或其他不应离开贵公司的资料。助手绝不会主动索取这些内容。",
        "对话结论及记录会通过 Telegram 转交销售经理，以便其从您停下的地方继续。",
      ],
    },
    {
      heading: "数据会与谁共享",
      body: [
        "AI 技术供应商（美国）—— 由 AI 助手处理消息。",
        "Telegram —— 将咨询送达销售经理。",
        "Supabase —— 存储咨询记录与历史。",
        "Google 与 Yandex 网站分析服务 —— 匿名化的访问统计。",
        "上述各方均按其自身规则处理数据，具体条款可在其网站上查阅。",
      ],
    },
    {
      heading: "工作室内谁能看到您的数据",
      body: [
        "咨询记录保存在仅限本工作室员工进入的内部面板中。访问权限实名，与员工本人的 Telegram 账号绑定 —— 不存在共用密码。",
        "每次打开咨询卡片都会记录是谁在何时打开的。这些记录无法修改，也无法删除。",
        "离职员工的访问权限立即失效。",
      ],
    },
    {
      heading: "保存多久",
      body: [
        "咨询与对话记录 —— 自您最后一次联系起最长五年：便于您再次联系时继续原项目，也让双方保留约定的凭证。",
        "员工访问日志 —— 最长五年。据此可查明工作室中是谁处理了您的咨询。",
        "技术日志 —— 最长 90 天。",
        "您可随时要求我们提前删除。",
      ],
    },
    {
      heading: "来自 Google 账户的数据",
      body: [
        "工作室员工可以在内部面板中连接自己的 Google 账户。经其授权后，面板会读取网站在 Google Analytics 中的统计数据（仅查看）以及工作室自有 Google Ads 账户的数据，包括关键字规划师：某个词组每月的搜索次数。",
        "这些数据仅用于面板本身：向员工展示网站统计、为网站文章挑选搜索词，以及管理工作室自己的广告。只有在员工按下按钮后，才会对广告做出更改。",
        "Google 访问凭据保存在加密存储中，不向任何人展示。我们不出售 Google 数据，不转交第三方，也不将其用于广告或训练 AI 模型。不含个人信息的汇总搜索量数据，仅为撰写网站文章之目的，可能会传给我们的 AI 服务提供商。",
        "DevUz Studio 对通过 Google API 获取的信息的使用和传输，遵守 Google API Services User Data Policy，包括其中的“有限使用”（Limited Use）要求。",
        "您可以随时在 myaccount.google.com/permissions 页面或通过面板中的按钮撤销访问权限。撤销后，已获取的数据将在 30 天内删除，如有要求可更早删除。",
      ],
    },
    {
      heading: "您的权利",
      body: [
        "您可以索取自己数据的副本，要求更正或删除，并撤回处理授权。",
        "请使用您留下的邮箱或号码来信联系我们，我们将在十个工作日内答复。",
      ],
    },
    {
      heading: "Cookie",
      body: [
        "网站会保存一个功能性 Cookie，记录您选择的界面语言。",
        "登录内部面板的工作室员工会获得第二个仅限该面板的会话 Cookie。网站访客不会收到它。",
        "若已接入网站分析服务，它会设置各自的 Cookie。您可在浏览器设置中关闭，不影响网站正常使用。",
      ],
    },
    {
      heading: "政策变更",
      body: [
        "如政策发生变更，我们会更新文首日期。实质性变更通常意味着新增了数据处理方，并会列入「数据会与谁共享」一节。",
      ],
    },
  ],
};

const uk: LegalDoc = {
  title: "Політика конфіденційності",
  updated: "Діє з 15 листопада 2026 року",
  intro:
    "Тут описано, які дані збирає сайт DevUz Studio, навіщо вони потрібні, кому передаються і як їх видалити. Документ написано звичайною мовою: якщо щось залишилося незрозумілим, напишіть нам, і ми пояснимо. Це переклад, підготовлений для зручності. Юридичну силу має російська редакція, опублікована на devuz.studio/ru/privacy; у разі розбіжностей між редакціями застосовується російська.",
  sections: [
    {
      heading: "Які дані ми збираємо",
      body: [
        "Контактні дані, які ви залишаєте самі: ім'я, телефон, адресу електронної пошти, ім'я користувача в Telegram, назву компанії.",
        "Зміст листування з AI-асистентом і текст заявки з форми зворотного зв'язку.",
        "Технічні дані: IP-адресу, тип браузера й пристрою, мову інтерфейсу, сторінки, які ви відкривали. Вони потрібні для захисту від автоматичних запитів і для статистики відвідуваності.",
      ],
    },
    {
      heading: "Навіщо вони потрібні",
      body: [
        "Щоб відповісти на ваш запит, підготувати комерційну пропозицію і зв'язатися з вами.",
        "Щоб зрозуміти, яка послуга вам підходить, і передати менеджеру контекст розмови — без цього вам довелося б переказувати задачу заново.",
        "Щоб покращувати сайт і захищати його від зловживань.",
        "Ми не продаємо дані, не передаємо їх рекламним мережам і не надсилаємо листів, на які ви не підписувалися.",
      ],
    },
    {
      heading: "AI-асистент у чаті",
      body: [
        "Першу лінію спілкування веде AI-асистент студії. Щоб сформувати відповідь, текст вашого повідомлення обробляється на інфраструктурі нашого постачальника технології ШІ у США.",
        "Не надсилайте в чат паролі, реквізити карток, доступи до систем та інші відомості, які не повинні залишати межі вашої компанії. Асистент ніколи не запитує їх сам.",
        "Підсумок розмови та її розшифровка передаються менеджеру відділу продажів у Telegram, щоб він продовжив розмову з того місця, де ви зупинилися.",
      ],
    },
    {
      heading: "Кому передаються дані",
      body: [
        "Постачальник технології ШІ (США) — обробка повідомлень AI-асистентом.",
        "Telegram — доставка заявок менеджерам відділу продажів.",
        "Supabase — зберігання заявок та історії звернень.",
        "Сервіси вебаналітики Google і Яндекс — знеособлена статистика відвідуваності.",
        "Кожен із них обробляє дані за власними правилами, з якими можна ознайомитися на їхніх сайтах.",
      ],
    },
    {
      heading: "Хто зі студії бачить ваші дані",
      body: [
        "Заявки зберігаються в службовій панелі, доступ до якої мають лише співробітники студії. Доступ іменний і прив'язаний до особистого акаунта співробітника в Telegram — спільного пароля не існує.",
        "Кожне відкриття картки заявки фіксується: хто відкрив і коли. Ці записи неможливо ні змінити, ні видалити.",
        "Співробітник, який залишив студію, негайно втрачає доступ.",
      ],
    },
    {
      heading: "Скільки ми зберігаємо дані",
      body: [
        "Заявки та листування — до п'яти років з моменту останнього звернення. Цей строк потрібен, щоб повернутися до вашого проєкту, якщо ви звернетеся повторно, і щоб в обох сторін залишалися підтвердження домовленостей.",
        "Журнал доступу співробітників — до п'яти років. З нього видно, хто зі студії працював із вашою заявкою.",
        "Технічні логи — до 90 днів.",
        "На ваш запит видалимо раніше.",
      ],
    },
    {
      heading: "Дані з акаунтів Google",
      body: [
        "Співробітники студії можуть підключити свій акаунт Google у внутрішній панелі. Тоді панель з їхнього дозволу читає статистику сайту в Google Analytics (лише перегляд) і дані рекламних кабінетів студії в Google Ads, зокрема планувальник ключових слів: скільки разів на місяць шукають фразу.",
        "Ці дані потрібні лише для роботи самої панелі: показати співробітникам статистику сайту, дібрати запити для статей на сайті й вести рекламу студії. Зміни в рекламі вносяться лише після того, як співробітник натисне кнопку.",
        "Доступ до Google зберігається в зашифрованому сховищі й нікому не показується. Дані з Google ми не продаємо, не передаємо третім особам, не використовуємо для реклами й для навчання моделей ШІ. Узагальнені цифри пошукових запитів, без особистих даних, можуть надходити нашому постачальнику ШІ лише для того, щоб написати статтю для сайту.",
        "Використання й передавання відомостей, отриманих через API Google, відповідають Політиці щодо даних користувачів сервісів Google API (Google API Services User Data Policy), зокрема вимогам щодо обмеженого використання (Limited Use).",
        "Відкликати доступ можна будь-коли на сторінці myaccount.google.com/permissions або кнопкою в панелі. Після відкликання отримані дані видаляються протягом 30 днів, на запит — раніше.",
      ],
    },
    {
      heading: "Ваші права",
      body: [
        "Ви можете запросити копію своїх даних, попросити їх виправити чи видалити, а також відкликати згоду на обробку.",
        "Для цього напишіть на нашу пошту з адреси або номера, які ви залишали. Ми відповімо протягом десяти робочих днів.",
      ],
    },
    {
      heading: "Файли cookie",
      body: [
        "Сайт зберігає один службовий файл cookie з обраною мовою інтерфейсу, щоб наступного разу відкрити сайт тією ж мовою.",
        "Співробітники студії, які входять до службової панелі, отримують ще один — сесійний, лише для неї. Відвідувачам сайту він не видається.",
        "Якщо підключено вебаналітику, вона встановлює власні файли cookie. Їх можна вимкнути в налаштуваннях браузера — на роботу сайту це не вплине.",
      ],
    },
    {
      heading: "Зміни",
      body: [
        "Якщо політика зміниться, ми оновимо дату на початку документа. Суттєві зміни зазвичай означають появу нового сервісу-обробника — їх завжди буде перелічено в розділі «Кому передаються дані».",
      ],
    },
  ],
};

const pl: LegalDoc = {
  title: "Polityka prywatności",
  updated: "Obowiązuje od 15 listopada 2026 r.",
  intro:
    "Tutaj opisujemy, jakie dane zbiera strona DevUz Studio, do czego są potrzebne, komu są przekazywane i jak je usunąć. Dokument jest napisany prostym językiem: jeśli coś pozostanie niejasne, napisz do nas, a wyjaśnimy. To tłumaczenie przygotowane dla wygody. Moc prawną ma rosyjska wersja opublikowana pod adresem devuz.studio/ru/privacy; w razie rozbieżności między wersjami rozstrzyga wersja rosyjska.",
  sections: [
    {
      heading: "Jakie dane zbieramy",
      body: [
        "Dane kontaktowe, które podajesz sam: imię, numer telefonu, adres e-mail, nazwę użytkownika w Telegramie, nazwę firmy.",
        "Treść rozmowy z asystentem AI oraz tekst zapytania wysłanego przez formularz kontaktowy.",
        "Dane techniczne: adres IP, typ przeglądarki i urządzenia, język interfejsu, odwiedzone strony. Są potrzebne do ochrony przed automatycznymi zapytaniami i do statystyk odwiedzin.",
      ],
    },
    {
      heading: "Do czego są potrzebne",
      body: [
        "Aby odpowiedzieć na Twoje zapytanie, przygotować ofertę handlową i skontaktować się z Tobą.",
        "Aby ustalić, która usługa Ci odpowiada, i przekazać menedżerowi kontekst rozmowy — bez tego musiałbyś opisywać swoje zadanie od nowa.",
        "Aby ulepszać stronę i chronić ją przed nadużyciami.",
        "Nie sprzedajemy danych, nie przekazujemy ich sieciom reklamowym i nie wysyłamy wiadomości, których nie zamawiałeś.",
      ],
    },
    {
      heading: "Asystent AI na czacie",
      body: [
        "Pierwszy kontakt prowadzi asystent AI studia. Aby przygotować odpowiedź, treść Twojej wiadomości jest przetwarzana w infrastrukturze naszego dostawcy technologii AI w USA.",
        "Nie wysyłaj na czacie haseł, danych kart płatniczych, danych dostępowych do systemów ani innych informacji, które nie powinny opuszczać Twojej firmy. Asystent nigdy sam o nie nie prosi.",
        "Podsumowanie rozmowy i jej zapis są przekazywane menedżerowi działu sprzedaży w Telegramie, aby mógł kontynuować rozmowę od miejsca, w którym ją przerwałeś.",
      ],
    },
    {
      heading: "Komu przekazujemy dane",
      body: [
        "Dostawca technologii AI (USA) — przetwarzanie wiadomości przez asystenta AI.",
        "Telegram — dostarczanie zapytań menedżerom działu sprzedaży.",
        "Supabase — przechowywanie zapytań i historii kontaktów.",
        "Usługi analityki internetowej Google i Yandex — zanonimizowane statystyki odwiedzin.",
        "Każdy z tych podmiotów przetwarza dane według własnych zasad, z którymi można zapoznać się na jego stronie internetowej.",
      ],
    },
    {
      heading: "Kto w studiu widzi Twoje dane",
      body: [
        "Zapytania są przechowywane w wewnętrznym panelu, do którego dostęp mają wyłącznie pracownicy studia. Dostęp jest imienny i powiązany z osobistym kontem pracownika w Telegramie — nie istnieje wspólne hasło.",
        "Każde otwarcie karty zapytania jest rejestrowane: kto je otworzył i kiedy. Tych zapisów nie można ani zmienić, ani usunąć.",
        "Pracownik, który odchodzi ze studia, natychmiast traci dostęp.",
      ],
    },
    {
      heading: "Jak długo przechowujemy dane",
      body: [
        "Zapytania i korespondencję — do pięciu lat od ostatniego kontaktu. Ten okres jest potrzebny, abyśmy mogli wrócić do Twojego projektu, jeśli zwrócisz się do nas ponownie, oraz aby obie strony zachowały potwierdzenie ustaleń.",
        "Rejestr dostępu pracowników — do pięciu lat. Widać w nim, kto ze studia pracował z Twoim zapytaniem.",
        "Logi techniczne — do 90 dni.",
        "Na Twoją prośbę usuniemy je wcześniej.",
      ],
    },
    {
      heading: "Dane z kont Google",
      body: [
        "Pracownicy studia mogą podłączyć swoje konto Google w panelu wewnętrznym. Wtedy panel za ich zgodą odczytuje statystyki strony w Google Analytics (tylko podgląd) oraz dane kont reklamowych studia w Google Ads, w tym planer słów kluczowych: ile razy w miesiącu wyszukiwana jest fraza.",
        "Te dane służą wyłącznie działaniu samego panelu: pokazaniu pracownikom statystyk strony, doborowi zapytań do artykułów na stronie i prowadzeniu reklamy studia. Zmiany w reklamach wprowadzane są dopiero po naciśnięciu przycisku przez pracownika.",
        "Dostęp do Google jest przechowywany w zaszyfrowanym sejfie i nikomu nie jest pokazywany. Danych z Google nie sprzedajemy, nie przekazujemy osobom trzecim, nie wykorzystujemy do reklamy ani do trenowania modeli AI. Zbiorcze liczby wyszukiwań, bez danych osobowych, mogą trafiać do naszego dostawcy AI wyłącznie w celu napisania artykułu na stronę.",
        "Korzystanie z informacji uzyskanych przez API Google i ich przekazywanie jest zgodne z Zasadami dotyczącymi danych użytkownika usług Google API (Google API Services User Data Policy), w tym z wymogami ograniczonego wykorzystania (Limited Use).",
        "Dostęp można cofnąć w dowolnym momencie na stronie myaccount.google.com/permissions lub przyciskiem w panelu. Po cofnięciu uzyskane dane są usuwane w ciągu 30 dni, na żądanie — wcześniej.",
      ],
    },
    {
      heading: "Twoje prawa",
      body: [
        "Możesz zażądać kopii swoich danych, ich sprostowania lub usunięcia, a także wycofać zgodę na ich przetwarzanie.",
        "W tym celu napisz na nasz adres e-mail z adresu lub numeru, który nam podałeś. Odpowiemy w ciągu dziesięciu dni roboczych.",
      ],
    },
    {
      heading: "Pliki cookie",
      body: [
        "Strona zapisuje jeden techniczny plik cookie z wybranym językiem interfejsu, aby przy następnej wizycie otworzyć się w tym samym języku.",
        "Pracownicy studia logujący się do wewnętrznego panelu otrzymują jeszcze jeden — sesyjny, wyłącznie dla tego panelu. Odwiedzającym stronę nie jest on przydzielany.",
        "Jeśli podłączona jest analityka internetowa, instaluje ona własne pliki cookie. Można je wyłączyć w ustawieniach przeglądarki — nie wpłynie to na działanie strony.",
      ],
    },
    {
      heading: "Zmiany",
      body: [
        "Jeśli polityka się zmieni, zaktualizujemy datę na początku dokumentu. Istotne zmiany oznaczają zwykle pojawienie się nowego podmiotu przetwarzającego dane — zawsze będą one wymienione w sekcji „Komu przekazujemy dane”.",
      ],
    },
  ],
};

export const privacy: Record<Locale, LegalDoc> = { ru, en, uz, zh, uk, pl };
