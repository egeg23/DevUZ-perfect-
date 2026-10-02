import type { LegalDoc } from "@/content/legal";
import type { Locale } from "@/lib/i18n";

/**
 * Условия использования макетов, прототипов и концепций.
 *
 * Владелец, 03.10.2026, после того как adar.uz запустил сайт по мотивам
 * нашего макета у другого исполнителя: «Перепиши жёстко пункт про макет — в
 * случае использования или выявления оплата 200% от заявленной стоимости
 * клиенту. Переписка с клиентом в мессенджере с указанием сайта заказчика
 * является акцептом к принятию условий использования».
 *
 * Зачем отдельный документ, а не пункт оферты. Оферта заключается оплатой
 * счёта, а макет клиент видит раньше — бесплатно и до любого договора. Ровно
 * в этот промежуток макет и уходит другому исполнителю «как образец».
 * Авторское право охраняет форму (код, дизайн, тексты), но не идею и не
 * композицию — их закрывает только договор, и этот документ — он.
 *
 * Чтобы акцепт был доказуемым, условия должны быть известны клиенту до того,
 * как он воспользовался макетом. Поэтому ссылка на них стоит на каждом
 * прототипе (lib/proto/booking.ts) и на каждой витрине проекта, а скрытые
 * отпечатки (раздел 6) показывают, чей именно макет оказался у клиента.
 *
 * Юрист текст не читал — как и оферту. Решение владельца; суд вправе снизить
 * неустойку, явно несоразмерную нарушению, это стоит помнить в претензии.
 *
 * Меняя текст по существу — меняйте MOCKUP_TERMS_VERSION и `updated`.
 */
export const MOCKUP_TERMS_VERSION = "2026-10-03";

/** Путь страницы на сайте — без языка: `/{locale}/mockup-terms`. */
export const MOCKUP_TERMS_PATH = "mockup-terms";

const ru: LegalDoc = {
  title: "Условия использования макетов, прототипов и концепций",
  updated: "Редакция от 3 октября 2026 года",
  intro:
    "Это публичная оферта индивидуального предпринимателя MAKSIMOV EGOR ANDREEVICH (DevUz Studio). Она обязательна для каждого, кому студия показала, передала или прислала ссылку на макет, прототип, концепцию или витрину проекта — в том числе бесплатно и до заключения договора. Если вы не согласны с условиями, не открывайте макет и сообщите об этом студии.",
  sections: [
    {
      heading: "1. Термины",
      body: [
        "Исполнитель — индивидуальный предприниматель MAKSIMOV EGOR ANDREEVICH (DevUz Studio), Республика Узбекистан, город Ташкент. Реквизиты указаны в Публичной оферте на сайте devuz.studio.",
        "Клиент — компания, индивидуальный предприниматель или физическое лицо, которому Исполнитель показал, передал или прислал Макет, а также любое лицо, действующее в интересах Клиента: его сотрудник, подрядчик или другой исполнитель.",
        "Макет — любой результат работы Исполнителя, показанный или переданный Клиенту в любой форме: прототип, концепция, дизайн-макет, витрина проекта, страница по ссылке, вёрстка, программный код, стили, тексты, иллюстрации, анимации, структура и композиция страниц, состав и порядок блоков, а также любые их части.",
        "Заявленная стоимость — стоимость работ, которую Исполнитель назвал Клиенту в переписке, коммерческом предложении, смете или счёте по проекту, к которому относится Макет. Если названо несколько сумм, применяется наибольшая.",
      ],
    },
    {
      heading: "2. Права на Макет",
      body: [
        "Все исключительные права на Макет принадлежат Исполнителю. Показ Макета, передача ссылки, бесплатная подготовка Макета и переписка о нём не передают Клиенту никаких прав.",
        "Права на Макет переходят к Клиенту только по письменному договору с Исполнителем и только после полной оплаты по этому договору.",
      ],
    },
    {
      heading: "3. Что запрещено",
      body: [
        "Без договора с Исполнителем и полной оплаты Клиенту запрещается: использовать Макет или его части на своём сайте, в приложении, рекламе и любых других материалах; воспроизводить и копировать Макет, в том числе через инструменты разработчика браузера, сохранение страницы и снимки экрана; перерабатывать, адаптировать и переписывать Макет, в том числе с помощью нейросетей и других программ; передавать Макет третьим лицам, в том числе другому исполнителю, как образец, техническое задание или референс.",
        "Запрет действует независимо от того, использован Макет целиком или частично, буквально или в изменённом виде, силами самого Клиента или руками третьих лиц.",
      ],
    },
    {
      heading: "4. Ответственность: 200% от Заявленной стоимости",
      body: [
        "За каждый случай использования Макета или его частей в нарушение раздела 3 Клиент выплачивает Исполнителю штраф в размере 200% (двухсот процентов) от Заявленной стоимости.",
        "Если Заявленная стоимость Клиенту не называлась, штраф составляет 200% (двести процентов) от стоимости аналогичных работ по ценам Исполнителя на дату выявления нарушения.",
        "Нарушение считается выявленным с момента, когда Исполнитель обнаружил признаки Макета в материалах Клиента или лиц, действующих в его интересах.",
        "Штраф выплачивается в течение 10 банковских дней с момента направления Исполнителем требования — в мессенджере, по электронной почте или почтой. Уплата штрафа не даёт права пользоваться Макетом, не освобождает от обязанности немедленно прекратить его использование и от возмещения убытков в части, не покрытой штрафом.",
      ],
    },
    {
      heading: "5. Как принимаются условия",
      body: [
        "Клиент принимает эти условия полностью и без оговорок (акцепт) с момента первого из действий: переписки с Исполнителем в любом мессенджере (Telegram, WhatsApp и других), в которой указан сайт или домен Клиента; открытия Макета по ссылке, полученной от Исполнителя; запроса или получения Макета в любой форме.",
        "Отдельного подписания не требуется. Переписка, журнал открытия ссылок и иные записи Исполнителя подтверждают акцепт и его дату.",
      ],
    },
    {
      heading: "6. Доказательства",
      body: [
        "Исполнитель вправе встраивать в Макеты скрытые технические метки (цифровые отпечатки), уникальные для каждого Клиента и не влияющие на внешний вид. Клиент соглашается, что обнаружение таких меток в его материалах или в материалах лиц, действующих в его интересах, является достаточным доказательством того, что эти материалы созданы на основе Макета Исполнителя.",
        "Исполнитель хранит историю разработки Макетов и журнал их показа: кому, когда и по какой ссылке был показан Макет.",
      ],
    },
    {
      heading: "7. Срок действия",
      body: [
        "Условия действуют бессрочно с момента акцепта и сохраняют силу, если договор между Клиентом и Исполнителем так и не был заключён.",
        "Исполнитель вправе изменить условия, опубликовав новую редакцию на сайте. К Макету, показанному до изменения, применяется редакция, действовавшая на дату акцепта.",
      ],
    },
    {
      heading: "8. Споры",
      body: [
        "Претензионный порядок обязателен. Срок ответа на претензию — 10 календарных дней с момента её получения.",
        "Если договориться не удалось, спор рассматривается в компетентном суде Республики Узбекистан по месту нахождения Исполнителя. Применяется право Республики Узбекистан.",
        "При расхождении переводов действует редакция на русском языке.",
      ],
    },
  ],
};

const en: LegalDoc = {
  title: "Terms of use for mock-ups, prototypes and concepts",
  updated: "Version of 3 October 2026",
  intro:
    "This is a public offer by the individual entrepreneur MAKSIMOV EGOR ANDREEVICH (DevUz Studio). It binds everyone to whom the studio has shown, handed over or sent a link to a mock-up, prototype, concept or project showcase — including free of charge and before any contract. If you do not agree with these terms, do not open the mock-up and let the studio know.",
  sections: [
    {
      heading: "1. Definitions",
      body: [
        "Contractor — the individual entrepreneur MAKSIMOV EGOR ANDREEVICH (DevUz Studio), Tashkent, Republic of Uzbekistan. Company details are given in the Public offer on devuz.studio.",
        "Client — a company, individual entrepreneur or private person to whom the Contractor has shown, handed over or sent a Mock-up, and anyone acting in the Client's interests: its employee, subcontractor or another developer.",
        "Mock-up — any result of the Contractor's work shown or handed over to the Client in any form: prototype, concept, design layout, project showcase, page behind a link, markup, program code, styles, texts, illustrations, animations, page structure and composition, set and order of blocks, and any parts of them.",
        "Quoted price — the price of the work that the Contractor named to the Client in correspondence, a commercial proposal, an estimate or an invoice for the project the Mock-up belongs to. If several amounts were named, the highest applies.",
      ],
    },
    {
      heading: "2. Rights in the Mock-up",
      body: [
        "All exclusive rights in the Mock-up belong to the Contractor. Showing the Mock-up, sending a link, preparing it free of charge and corresponding about it do not transfer any rights to the Client.",
        "Rights in the Mock-up pass to the Client only under a written contract with the Contractor and only after full payment under that contract.",
      ],
    },
    {
      heading: "3. What is prohibited",
      body: [
        "Without a contract with the Contractor and full payment, the Client may not: use the Mock-up or its parts on its website, in an app, in advertising or any other materials; reproduce or copy the Mock-up, including through browser developer tools, saving the page or screenshots; rework, adapt or rewrite the Mock-up, including with neural networks and other software; hand the Mock-up to third parties, including another developer, as a sample, specification or reference.",
        "The prohibition applies whether the Mock-up is used in whole or in part, literally or in modified form, by the Client itself or by third parties.",
      ],
    },
    {
      heading: "4. Liability: 200% of the Quoted price",
      body: [
        "For each case of using the Mock-up or its parts in breach of section 3, the Client pays the Contractor a penalty of 200% (two hundred per cent) of the Quoted price.",
        "If no Quoted price was named to the Client, the penalty is 200% (two hundred per cent) of the price of comparable work at the Contractor's rates on the date the breach is detected.",
        "A breach is deemed detected from the moment the Contractor finds signs of the Mock-up in the materials of the Client or of persons acting in its interests.",
        "The penalty is paid within 10 banking days of the Contractor's demand sent by messenger, e-mail or post. Paying the penalty does not grant the right to use the Mock-up and does not release the Client from the duty to stop using it immediately or from compensating losses not covered by the penalty.",
      ],
    },
    {
      heading: "5. How the terms are accepted",
      body: [
        "The Client accepts these terms in full and without reservation from the first of the following: correspondence with the Contractor in any messenger (Telegram, WhatsApp and others) in which the Client's website or domain is mentioned; opening the Mock-up through a link received from the Contractor; requesting or receiving the Mock-up in any form.",
        "No separate signature is required. Correspondence, link-opening logs and other records of the Contractor confirm acceptance and its date.",
      ],
    },
    {
      heading: "6. Evidence",
      body: [
        "The Contractor may embed hidden technical marks (digital fingerprints) in Mock-ups, unique for each Client and not affecting appearance. The Client agrees that finding such marks in its materials, or in the materials of persons acting in its interests, is sufficient proof that those materials were created on the basis of the Contractor's Mock-up.",
        "The Contractor keeps the development history of Mock-ups and a log of showing them: to whom, when and through which link a Mock-up was shown.",
      ],
    },
    {
      heading: "7. Term",
      body: [
        "These terms are valid indefinitely from acceptance and remain in force if no contract between the Client and the Contractor was ever concluded.",
        "The Contractor may change these terms by publishing a new version on the website. A Mock-up shown before the change is governed by the version in force on the date of acceptance.",
      ],
    },
    {
      heading: "8. Disputes",
      body: [
        "A pre-trial claim is mandatory. The deadline for answering a claim is 10 calendar days from its receipt.",
        "If no agreement is reached, the dispute is heard by the competent court of the Republic of Uzbekistan at the Contractor's location. The law of the Republic of Uzbekistan applies.",
        "If translations differ, the Russian version prevails.",
      ],
    },
  ],
};

const uz: LegalDoc = {
  title: "Maketlar, prototiplar va konsepsiyalardan foydalanish shartlari",
  updated: "2026-yil 3-oktabr tahriri",
  intro:
    "Bu yakka tartibdagi tadbirkor MAKSIMOV EGOR ANDREEVICH (DevUz Studio) ning ommaviy ofertasi. U studiya maket, prototip, konsepsiya yoki loyiha vitrinasini ko‘rsatgan, topshirgan yoki havolasini yuborgan har bir kishi uchun majburiy — shu jumladan bepul va shartnoma tuzilgunga qadar. Shartlarga rozi bo‘lmasangiz, maketni ochmang va bu haqda studiyaga xabar bering.",
  sections: [
    {
      heading: "1. Atamalar",
      body: [
        "Ijrochi — yakka tartibdagi tadbirkor MAKSIMOV EGOR ANDREEVICH (DevUz Studio), O‘zbekiston Respublikasi, Toshkent shahri. Rekvizitlar devuz.studio saytidagi Ommaviy ofertada ko‘rsatilgan.",
        "Mijoz — Ijrochi Maketni ko‘rsatgan, topshirgan yoki yuborgan kompaniya, yakka tartibdagi tadbirkor yoki jismoniy shaxs, shuningdek Mijoz manfaatlarida harakat qiluvchi har qanday shaxs: uning xodimi, pudratchisi yoki boshqa ijrochi.",
        "Maket — Ijrochi ishining Mijozga istalgan shaklda ko‘rsatilgan yoki topshirilgan har qanday natijasi: prototip, konsepsiya, dizayn-maket, loyiha vitrinasi, havola orqali sahifa, sahifa kodi, dastur kodi, uslublar, matnlar, illyustratsiyalar, animatsiyalar, sahifalar tuzilishi va kompozitsiyasi, bloklar tarkibi va tartibi, shuningdek ularning har qanday qismlari.",
        "E’lon qilingan narx — Ijrochi Maket tegishli bo‘lgan loyiha bo‘yicha Mijozga yozishmada, tijoriy taklifda, smetada yoki hisob-fakturada aytgan ishlar narxi. Bir nechta summa aytilgan bo‘lsa, eng kattasi qo‘llaniladi.",
      ],
    },
    {
      heading: "2. Maketga bo‘lgan huquqlar",
      body: [
        "Maketga bo‘lgan barcha mutlaq huquqlar Ijrochiga tegishli. Maketni ko‘rsatish, havolani yuborish, Maketni bepul tayyorlash va u haqida yozishma Mijozga hech qanday huquq bermaydi.",
        "Maketga bo‘lgan huquqlar Mijozga faqat Ijrochi bilan yozma shartnoma asosida va faqat shu shartnoma bo‘yicha to‘liq to‘lovdan keyin o‘tadi.",
      ],
    },
    {
      heading: "3. Nima taqiqlanadi",
      body: [
        "Ijrochi bilan shartnoma va to‘liq to‘lovsiz Mijozga quyidagilar taqiqlanadi: Maketdan yoki uning qismlaridan o‘z saytida, ilovada, reklamada va boshqa har qanday materiallarda foydalanish; Maketni takrorlash va nusxalash, shu jumladan brauzerning ishlab chiquvchi vositalari, sahifani saqlash va ekran tasvirlari orqali; Maketni qayta ishlash, moslashtirish va qayta yozish, shu jumladan neyrotarmoqlar va boshqa dasturlar yordamida; Maketni uchinchi shaxslarga, shu jumladan boshqa ijrochiga namuna, texnik topshiriq yoki referens sifatida berish.",
        "Taqiq Maketdan to‘liq yoki qisman, aynan yoki o‘zgartirilgan holda, Mijozning o‘zi yoki uchinchi shaxslar qo‘li bilan foydalanilganidan qat’i nazar amal qiladi.",
      ],
    },
    {
      heading: "4. Javobgarlik: E’lon qilingan narxning 200%",
      body: [
        "3-bo‘limni buzgan holda Maketdan yoki uning qismlaridan har bir foydalanish holati uchun Mijoz Ijrochiga E’lon qilingan narxning 200% (ikki yuz foiz) miqdorida jarima to‘laydi.",
        "Agar Mijozga E’lon qilingan narx aytilmagan bo‘lsa, jarima buzilish aniqlangan sanadagi Ijrochi narxlari bo‘yicha o‘xshash ishlar narxining 200% (ikki yuz foiz)ini tashkil qiladi.",
        "Buzilish Ijrochi Mijoz yoki uning manfaatlarida harakat qiluvchi shaxslar materiallarida Maket belgilarini aniqlagan paytdan boshlab aniqlangan hisoblanadi.",
        "Jarima Ijrochi talabni messenjer, elektron pochta yoki pochta orqali yuborgan paytdan boshlab 10 bank kuni ichida to‘lanadi. Jarimani to‘lash Maketdan foydalanish huquqini bermaydi, undan foydalanishni darhol to‘xtatish majburiyatidan va jarima qoplamagan zararlarni qoplashdan ozod qilmaydi.",
      ],
    },
    {
      heading: "5. Shartlar qanday qabul qilinadi",
      body: [
        "Mijoz ushbu shartlarni to‘liq va izohsiz (aksept) quyidagi harakatlardan birinchisi sodir bo‘lgan paytdan qabul qiladi: Ijrochi bilan istalgan messenjerda (Telegram, WhatsApp va boshqalar) Mijozning sayti yoki domeni ko‘rsatilgan yozishma; Ijrochidan olingan havola orqali Maketni ochish; Maketni istalgan shaklda so‘rash yoki olish.",
        "Alohida imzolash talab qilinmaydi. Yozishma, havolalarni ochish jurnali va Ijrochining boshqa yozuvlari akseptni va uning sanasini tasdiqlaydi.",
      ],
    },
    {
      heading: "6. Dalillar",
      body: [
        "Ijrochi Maketlarga har bir Mijoz uchun noyob va tashqi ko‘rinishga ta’sir qilmaydigan yashirin texnik belgilarni (raqamli izlarni) joylashtirishga haqli. Mijoz bunday belgilarning uning materiallarida yoki uning manfaatlarida harakat qiluvchi shaxslar materiallarida topilishi ushbu materiallar Ijrochi Maketi asosida yaratilganining yetarli dalili ekanligiga rozi bo‘ladi.",
        "Ijrochi Maketlarni ishlab chiqish tarixini va ularni ko‘rsatish jurnalini saqlaydi: Maket kimga, qachon va qaysi havola orqali ko‘rsatilgan.",
      ],
    },
    {
      heading: "7. Amal qilish muddati",
      body: [
        "Shartlar aksept paytidan boshlab muddatsiz amal qiladi va Mijoz bilan Ijrochi o‘rtasida shartnoma tuzilmagan bo‘lsa ham kuchini saqlaydi.",
        "Ijrochi saytda yangi tahrirni e’lon qilib, shartlarni o‘zgartirishga haqli. O‘zgarishdan oldin ko‘rsatilgan Maketga aksept sanasida amalda bo‘lgan tahrir qo‘llaniladi.",
      ],
    },
    {
      heading: "8. Nizolar",
      body: [
        "Da’vogacha talab tartibi majburiy. Talabga javob berish muddati — u olingan paytdan boshlab 10 kalendar kuni.",
        "Kelishib bo‘lmasa, nizo Ijrochi joylashgan joydagi O‘zbekiston Respublikasining vakolatli sudida ko‘rib chiqiladi. O‘zbekiston Respublikasi qonunchiligi qo‘llaniladi.",
        "Tarjimalar o‘rtasida farq bo‘lsa, rus tilidagi tahrir amal qiladi.",
      ],
    },
  ],
};

const zh: LegalDoc = {
  title: "样稿、原型和概念的使用条款",
  updated: "2026年10月3日版",
  intro:
    "本文件是个体经营者 MAKSIMOV EGOR ANDREEVICH（DevUz Studio）的公开要约。凡工作室向其展示、交付或发送样稿、原型、概念或项目展示页链接的任何人，均受本条款约束——包括免费提供以及在签订合同之前。如您不同意本条款，请勿打开样稿并告知工作室。",
  sections: [
    {
      heading: "1. 术语",
      body: [
        "执行方——个体经营者 MAKSIMOV EGOR ANDREEVICH（DevUz Studio），乌兹别克斯坦共和国塔什干市。详细信息见 devuz.studio 网站上的公开要约。",
        "客户——执行方向其展示、交付或发送样稿的公司、个体经营者或自然人，以及为客户利益行事的任何人：其员工、承包商或其他执行方。",
        "样稿——执行方以任何形式向客户展示或交付的任何工作成果：原型、概念、设计稿、项目展示页、链接页面、页面代码、程序代码、样式、文字、插图、动画、页面结构与构图、版块的组成与顺序，以及上述内容的任何部分。",
        "报价——执行方就样稿所属项目在通信、商业建议书、预算或发票中向客户告知的工作价格。如告知多个金额，以最高者为准。",
      ],
    },
    {
      heading: "2. 样稿的权利",
      body: [
        "样稿的全部专有权利归执行方所有。展示样稿、发送链接、免费制作样稿以及与之相关的通信，均不向客户转让任何权利。",
        "样稿的权利仅在与执行方签订书面合同并按该合同全额付款后方转移给客户。",
      ],
    },
    {
      heading: "3. 禁止事项",
      body: [
        "未与执行方签订合同并全额付款，客户不得：在其网站、应用、广告及任何其他材料中使用样稿或其部分；复制样稿，包括通过浏览器开发者工具、保存页面或截图；改编、修改或重写样稿，包括借助神经网络及其他程序；将样稿作为样板、技术任务书或参考提供给第三方，包括其他执行方。",
        "无论样稿是全部还是部分、原样还是经修改后使用，无论由客户本人还是由第三方使用，本禁令均适用。",
      ],
    },
    {
      heading: "4. 责任：报价的200%",
      body: [
        "每发生一次违反第3条使用样稿或其部分的情况，客户应向执行方支付相当于报价200%（百分之二百）的罚金。",
        "如未向客户告知报价，罚金为发现违约之日按执行方价格计算的同类工作价格的200%（百分之二百）。",
        "自执行方在客户或为其利益行事之人的材料中发现样稿迹象之时起，即视为发现违约。",
        "罚金应在执行方通过即时通讯工具、电子邮件或邮寄发出要求之日起10个银行工作日内支付。支付罚金并不授予使用样稿的权利，也不免除立即停止使用的义务以及赔偿罚金未覆盖之损失的义务。",
      ],
    },
    {
      heading: "5. 条款的接受方式",
      body: [
        "客户自下列行为中最先发生者之时起，完全且无保留地接受本条款（承诺）：在任何即时通讯工具（Telegram、WhatsApp 等）中与执行方进行提及客户网站或域名的通信；通过从执行方获得的链接打开样稿；以任何形式索取或接收样稿。",
        "无需另行签字。执行方的通信记录、链接打开日志及其他记录可证明承诺及其日期。",
      ],
    },
    {
      heading: "6. 证据",
      body: [
        "执行方有权在样稿中嵌入隐藏的技术标记（数字指纹），该标记对每位客户唯一且不影响外观。客户同意，在其材料或为其利益行事之人的材料中发现此类标记，即足以证明该材料系基于执行方的样稿制作。",
        "执行方保存样稿的开发历史及展示日志：样稿于何时、通过何链接向何人展示。",
      ],
    },
    {
      heading: "7. 有效期",
      body: [
        "本条款自承诺之时起无限期有效，即使客户与执行方之间从未签订合同，仍然有效。",
        "执行方有权通过在网站上发布新版本修改本条款。修改前展示的样稿适用承诺之日有效的版本。",
      ],
    },
    {
      heading: "8. 争议",
      body: [
        "诉前索赔程序为必经程序。答复索赔的期限为收到之日起10个日历日。",
        "如无法协商解决，争议由执行方所在地的乌兹别克斯坦共和国主管法院审理，适用乌兹别克斯坦共和国法律。",
        "各译本如有歧义，以俄文版本为准。",
      ],
    },
  ],
};

const uk: LegalDoc = {
  title: "Умови використання макетів, прототипів і концепцій",
  updated: "Редакція від 3 жовтня 2026 року",
  intro:
    "Це публічна оферта фізичної особи-підприємця MAKSIMOV EGOR ANDREEVICH (DevUz Studio). Вона обов’язкова для кожного, кому студія показала, передала або надіслала посилання на макет, прототип, концепцію чи вітрину проєкту — зокрема безкоштовно і до укладення договору. Якщо ви не згодні з умовами, не відкривайте макет і повідомте про це студію.",
  sections: [
    {
      heading: "1. Терміни",
      body: [
        "Виконавець — фізична особа-підприємець MAKSIMOV EGOR ANDREEVICH (DevUz Studio), Республіка Узбекистан, місто Ташкент. Реквізити зазначені в Публічній оферті на сайті devuz.studio.",
        "Клієнт — компанія, підприємець або фізична особа, якій Виконавець показав, передав або надіслав Макет, а також будь-яка особа, що діє в інтересах Клієнта: його працівник, підрядник або інший виконавець.",
        "Макет — будь-який результат роботи Виконавця, показаний або переданий Клієнту в будь-якій формі: прототип, концепція, дизайн-макет, вітрина проєкту, сторінка за посиланням, верстка, програмний код, стилі, тексти, ілюстрації, анімації, структура й композиція сторінок, склад і порядок блоків, а також будь-які їх частини.",
        "Заявлена вартість — вартість робіт, яку Виконавець назвав Клієнту в листуванні, комерційній пропозиції, кошторисі або рахунку за проєктом, до якого належить Макет. Якщо названо кілька сум, застосовується найбільша.",
      ],
    },
    {
      heading: "2. Права на Макет",
      body: [
        "Усі виключні права на Макет належать Виконавцю. Показ Макета, передача посилання, безкоштовна підготовка Макета та листування про нього не передають Клієнту жодних прав.",
        "Права на Макет переходять до Клієнта лише за письмовим договором з Виконавцем і лише після повної оплати за цим договором.",
      ],
    },
    {
      heading: "3. Що заборонено",
      body: [
        "Без договору з Виконавцем і повної оплати Клієнту забороняється: використовувати Макет або його частини на своєму сайті, у застосунку, рекламі та будь-яких інших матеріалах; відтворювати й копіювати Макет, зокрема через інструменти розробника браузера, збереження сторінки та знімки екрана; переробляти, адаптувати й переписувати Макет, зокрема за допомогою нейромереж та інших програм; передавати Макет третім особам, зокрема іншому виконавцю, як зразок, технічне завдання або референс.",
        "Заборона діє незалежно від того, чи використано Макет повністю чи частково, дослівно чи в зміненому вигляді, силами самого Клієнта чи руками третіх осіб.",
      ],
    },
    {
      heading: "4. Відповідальність: 200% від Заявленої вартості",
      body: [
        "За кожен випадок використання Макета або його частин з порушенням розділу 3 Клієнт сплачує Виконавцю штраф у розмірі 200% (двохсот відсотків) від Заявленої вартості.",
        "Якщо Заявлену вартість Клієнту не називали, штраф становить 200% (двісті відсотків) від вартості аналогічних робіт за цінами Виконавця на дату виявлення порушення.",
        "Порушення вважається виявленим з моменту, коли Виконавець виявив ознаки Макета в матеріалах Клієнта або осіб, що діють в його інтересах.",
        "Штраф сплачується протягом 10 банківських днів з моменту надсилання Виконавцем вимоги — у месенджері, електронною поштою або поштою. Сплата штрафу не дає права користуватися Макетом, не звільняє від обов’язку негайно припинити його використання та від відшкодування збитків у частині, не покритій штрафом.",
      ],
    },
    {
      heading: "5. Як приймаються умови",
      body: [
        "Клієнт приймає ці умови повністю і без застережень (акцепт) з моменту першої з дій: листування з Виконавцем у будь-якому месенджері (Telegram, WhatsApp та інших), у якому зазначено сайт або домен Клієнта; відкриття Макета за посиланням, отриманим від Виконавця; запиту або отримання Макета в будь-якій формі.",
        "Окремого підписання не потрібно. Листування, журнал відкриття посилань та інші записи Виконавця підтверджують акцепт і його дату.",
      ],
    },
    {
      heading: "6. Докази",
      body: [
        "Виконавець має право вбудовувати в Макети приховані технічні мітки (цифрові відбитки), унікальні для кожного Клієнта, які не впливають на зовнішній вигляд. Клієнт погоджується, що виявлення таких міток у його матеріалах або в матеріалах осіб, що діють в його інтересах, є достатнім доказом того, що ці матеріали створено на основі Макета Виконавця.",
        "Виконавець зберігає історію розробки Макетів і журнал їх показу: кому, коли і за яким посиланням було показано Макет.",
      ],
    },
    {
      heading: "7. Строк дії",
      body: [
        "Умови діють безстроково з моменту акцепту і зберігають силу, навіть якщо договір між Клієнтом і Виконавцем так і не було укладено.",
        "Виконавець має право змінити умови, опублікувавши нову редакцію на сайті. До Макета, показаного до зміни, застосовується редакція, чинна на дату акцепту.",
      ],
    },
    {
      heading: "8. Спори",
      body: [
        "Досудовий претензійний порядок обов’язковий. Строк відповіді на претензію — 10 календарних днів з моменту її отримання.",
        "Якщо домовитися не вдалося, спір розглядає компетентний суд Республіки Узбекистан за місцезнаходженням Виконавця. Застосовується право Республіки Узбекистан.",
        "У разі розбіжностей між перекладами діє редакція російською мовою.",
      ],
    },
  ],
};

const pl: LegalDoc = {
  title: "Warunki korzystania z makiet, prototypów i koncepcji",
  updated: "Wersja z 3 października 2026 r.",
  intro:
    "To oferta publiczna przedsiębiorcy MAKSIMOV EGOR ANDREEVICH (DevUz Studio). Wiąże każdego, komu studio pokazało, przekazało lub wysłało link do makiety, prototypu, koncepcji lub wizytówki projektu — także bezpłatnie i przed zawarciem umowy. Jeśli nie zgadzasz się z warunkami, nie otwieraj makiety i poinformuj o tym studio.",
  sections: [
    {
      heading: "1. Definicje",
      body: [
        "Wykonawca — przedsiębiorca MAKSIMOV EGOR ANDREEVICH (DevUz Studio), Taszkent, Republika Uzbekistanu. Dane rejestrowe podano w Ofercie publicznej na stronie devuz.studio.",
        "Klient — firma, przedsiębiorca lub osoba fizyczna, której Wykonawca pokazał, przekazał lub wysłał Makietę, a także każda osoba działająca w interesie Klienta: jego pracownik, podwykonawca lub inny wykonawca.",
        "Makieta — każdy rezultat pracy Wykonawcy pokazany lub przekazany Klientowi w dowolnej formie: prototyp, koncepcja, projekt graficzny, wizytówka projektu, strona pod linkiem, kod strony, kod programu, style, teksty, ilustracje, animacje, struktura i kompozycja stron, skład i kolejność bloków, a także dowolne ich części.",
        "Cena zadeklarowana — cena prac, którą Wykonawca podał Klientowi w korespondencji, ofercie handlowej, kosztorysie lub fakturze dotyczącej projektu, do którego należy Makieta. Jeśli podano kilka kwot, stosuje się najwyższą.",
      ],
    },
    {
      heading: "2. Prawa do Makiety",
      body: [
        "Wszystkie prawa wyłączne do Makiety należą do Wykonawcy. Pokazanie Makiety, przesłanie linku, bezpłatne przygotowanie Makiety i korespondencja na jej temat nie przenoszą na Klienta żadnych praw.",
        "Prawa do Makiety przechodzą na Klienta wyłącznie na podstawie pisemnej umowy z Wykonawcą i dopiero po pełnej zapłacie zgodnie z tą umową.",
      ],
    },
    {
      heading: "3. Czego nie wolno",
      body: [
        "Bez umowy z Wykonawcą i pełnej zapłaty Klientowi zabrania się: używania Makiety lub jej części na swojej stronie, w aplikacji, reklamie i jakichkolwiek innych materiałach; zwielokrotniania i kopiowania Makiety, w tym przez narzędzia deweloperskie przeglądarki, zapisanie strony i zrzuty ekranu; przerabiania, adaptowania i przepisywania Makiety, w tym przy pomocy sieci neuronowych i innych programów; przekazywania Makiety osobom trzecim, w tym innemu wykonawcy, jako wzoru, specyfikacji technicznej lub referencji.",
        "Zakaz obowiązuje niezależnie od tego, czy Makietę wykorzystano w całości czy w części, dosłownie czy w zmienionej postaci, siłami samego Klienta czy rękami osób trzecich.",
      ],
    },
    {
      heading: "4. Odpowiedzialność: 200% Ceny zadeklarowanej",
      body: [
        "Za każdy przypadek wykorzystania Makiety lub jej części z naruszeniem punktu 3 Klient płaci Wykonawcy karę w wysokości 200% (dwustu procent) Ceny zadeklarowanej.",
        "Jeśli Klientowi nie podano Ceny zadeklarowanej, kara wynosi 200% (dwieście procent) ceny analogicznych prac według cennika Wykonawcy z dnia wykrycia naruszenia.",
        "Naruszenie uważa się za wykryte z chwilą, gdy Wykonawca stwierdził ślady Makiety w materiałach Klienta lub osób działających w jego interesie.",
        "Kara jest płatna w ciągu 10 dni bankowych od wysłania przez Wykonawcę wezwania — komunikatorem, pocztą elektroniczną lub pocztą. Zapłata kary nie daje prawa do korzystania z Makiety i nie zwalnia z obowiązku natychmiastowego zaprzestania jej używania ani z naprawienia szkody w części nieobjętej karą.",
      ],
    },
    {
      heading: "5. Jak przyjmuje się warunki",
      body: [
        "Klient przyjmuje te warunki w całości i bez zastrzeżeń (akceptacja) z chwilą pierwszego z działań: korespondencji z Wykonawcą w dowolnym komunikatorze (Telegram, WhatsApp i inne), w której wskazano stronę lub domenę Klienta; otwarcia Makiety przez link otrzymany od Wykonawcy; zapytania o Makietę lub jej otrzymania w dowolnej formie.",
        "Odrębny podpis nie jest wymagany. Korespondencja, dziennik otwarć linków i inne zapisy Wykonawcy potwierdzają akceptację i jej datę.",
      ],
    },
    {
      heading: "6. Dowody",
      body: [
        "Wykonawca może osadzać w Makietach ukryte znaczniki techniczne (cyfrowe odciski), unikalne dla każdego Klienta i niewpływające na wygląd. Klient zgadza się, że wykrycie takich znaczników w jego materiałach lub w materiałach osób działających w jego interesie jest wystarczającym dowodem, że materiały te powstały na podstawie Makiety Wykonawcy.",
        "Wykonawca przechowuje historię tworzenia Makiet i dziennik ich pokazów: komu, kiedy i przez jaki link pokazano Makietę.",
      ],
    },
    {
      heading: "7. Okres obowiązywania",
      body: [
        "Warunki obowiązują bezterminowo od chwili akceptacji i pozostają w mocy również wtedy, gdy umowa między Klientem a Wykonawcą nie została zawarta.",
        "Wykonawca może zmienić warunki, publikując nową wersję na stronie. Do Makiety pokazanej przed zmianą stosuje się wersję obowiązującą w dniu akceptacji.",
      ],
    },
    {
      heading: "8. Spory",
      body: [
        "Postępowanie reklamacyjne jest obowiązkowe. Termin odpowiedzi na wezwanie wynosi 10 dni kalendarzowych od jego otrzymania.",
        "Jeśli nie uda się dojść do porozumienia, spór rozpatruje właściwy sąd Republiki Uzbekistanu według siedziby Wykonawcy. Stosuje się prawo Republiki Uzbekistanu.",
        "W razie rozbieżności między tłumaczeniami obowiązuje wersja rosyjska.",
      ],
    },
  ],
};

export const mockupTerms: Record<Locale, LegalDoc> = { ru, en, uz, zh, uk, pl };
