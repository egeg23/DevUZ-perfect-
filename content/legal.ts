import type { Locale } from "@/lib/i18n";

export type LegalSection = { heading: string; body: string[] };
export type LegalDoc = { title: string; updated: string; intro: string; sections: LegalSection[] };

/**
 * Политика конфиденциальности.
 *
 * Отдельный пункт про AI-ассистента здесь не формальность: диалог посетителя
 * действительно уходит во внешний сервис (Anthropic), и умолчать об этом
 * значило бы собирать персональные данные, не сказав, куда они попадают.
 *
 * TODO(владелец): перед публикацией вписать реквизиты юрлица и адрес — без
 * них документ не является офертой и не защищает студию.
 */
const ru: LegalDoc = {
  title: "Политика конфиденциальности",
  updated: "Действует с 21 августа 2026 года",
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
        "Первую линию общения ведёт ассистент на базе модели Claude компании Anthropic. Текст вашего сообщения передаётся в Anthropic для формирования ответа.",
        "Не отправляйте в чат пароли, реквизиты карт, доступы к системам и другие сведения, которые не должны покидать вашу компанию. Ассистент никогда не запрашивает их сам.",
        "Итог разговора и его расшифровка передаются менеджеру отдела продаж в Telegram, чтобы он продолжил разговор с того места, где вы остановились.",
      ],
    },
    {
      heading: "Кому передаются данные",
      body: [
        "Anthropic (США) — обработка сообщений AI-ассистентом.",
        "Telegram — доставка заявок менеджерам отдела продаж.",
        "Supabase — хранение заявок и истории обращений.",
        "Сервисы веб-аналитики Google и Яндекс — обезличенная статистика посещаемости.",
        "Каждый из них обрабатывает данные по собственным правилам, с которыми можно ознакомиться на их сайтах.",
      ],
    },
    {
      heading: "Сколько мы храним данные",
      body: [
        "Заявки и переписку — до трёх лет с момента последнего обращения. Этот срок нужен, чтобы вернуться к вашему проекту, если вы обратитесь повторно.",
        "Технические логи — до 90 дней.",
        "По вашему запросу удалим раньше.",
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
  updated: "In effect from 21 August 2026",
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
        "The first line of contact is an assistant built on Anthropic's Claude model. The text of your message is sent to Anthropic in order to produce a reply.",
        "Do not send passwords, card details, system credentials or anything else that must not leave your company. The assistant never asks for them.",
        "The outcome of the conversation and its transcript are passed to a sales manager over Telegram so they can continue from where you stopped.",
      ],
    },
    {
      heading: "Who the data is shared with",
      body: [
        "Anthropic (USA) — processing of messages by the AI assistant.",
        "Telegram — delivery of requests to sales managers.",
        "Supabase — storage of requests and conversation history.",
        "Google and Yandex web analytics — anonymised traffic statistics.",
        "Each of them processes data under its own terms, available on their websites.",
      ],
    },
    {
      heading: "How long we keep it",
      body: [
        "Requests and conversations — up to three years from your last contact, so we can pick your project back up if you return.",
        "Technical logs — up to 90 days.",
        "We will delete anything earlier at your request.",
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
  updated: "2026-yil 21-avgustdan kuchga kiradi",
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
        "Muloqotning birinchi liniyasini Anthropic kompaniyasining Claude modeli asosidagi yordamchi olib boradi. Xabaringiz matni javob shakllantirish uchun Anthropic’ga uzatiladi.",
        "Chatga parollar, karta rekvizitlari, tizimlarga kirish ma’lumotlari va kompaniyangizdan chiqmasligi kerak bo‘lgan boshqa ma’lumotlarni yubormang. Yordamchi ularni hech qachon o‘zi so‘ramaydi.",
        "Suhbat natijasi va uning matni menejerga Telegram orqali uzatiladi.",
      ],
    },
    {
      heading: "Ma’lumotlar kimga uzatiladi",
      body: [
        "Anthropic (AQSh) — xabarlarni AI-yordamchi tomonidan qayta ishlash.",
        "Telegram — arizalarni sotuv bo‘limi menejerlariga yetkazish.",
        "Supabase — arizalar va murojaatlar tarixini saqlash.",
        "Google va Yandeks veb-tahlil xizmatlari — shaxssizlantirilgan tashrif statistikasi.",
      ],
    },
    {
      heading: "Ma’lumotlarni qancha saqlaymiz",
      body: [
        "Arizalar va yozishmalar — oxirgi murojaatdan boshlab uch yilgacha.",
        "Texnik jurnallar — 90 kungacha.",
        "So‘rovingiz bo‘yicha oldinroq o‘chiramiz.",
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
  updated: "自 2026 年 8 月 21 日起生效",
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
        "第一线接待由基于 Anthropic 公司 Claude 模型的助手完成。您的消息文本会发送至 Anthropic 以生成回复。",
        "请勿在聊天中发送密码、银行卡信息、系统凭据，或其他不应离开贵公司的资料。助手绝不会主动索取这些内容。",
        "对话结论及记录会通过 Telegram 转交销售经理，以便其从您停下的地方继续。",
      ],
    },
    {
      heading: "数据会与谁共享",
      body: [
        "Anthropic（美国）—— 由 AI 助手处理消息。",
        "Telegram —— 将咨询送达销售经理。",
        "Supabase —— 存储咨询记录与历史。",
        "Google 与 Yandex 网站分析服务 —— 匿名化的访问统计。",
      ],
    },
    {
      heading: "保存多久",
      body: [
        "咨询与对话记录 —— 自您最后一次联系起最长三年。",
        "技术日志 —— 最长 90 天。",
        "您可随时要求我们提前删除。",
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

export const privacy: Record<Locale, LegalDoc> = { ru, en, uz, zh };
