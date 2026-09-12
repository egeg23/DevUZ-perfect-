import type { LocalizedText } from "@/lib/i18n";

/**
 * Подписи формы заявки на покупку.
 *
 * Вынесены сюда, а не в компонент, ровно по той же причине, что и весь
 * остальной текст сайта: перевод, лежащий внутри JSX, забывают обновить
 * первым. Тест сверяет, что заполнены все четыре языка.
 */
export type OrderCopy = {
  heading: LocalizedText;
  intro: LocalizedText;
  company: LocalizedText;
  taxId: LocalizedText;
  country: LocalizedText;
  contactName: LocalizedText;
  contact: LocalizedText;
  contactHint: LocalizedText;
  comment: LocalizedText;
  payment: LocalizedText;
  paymentBank: LocalizedText;
  paymentManager: LocalizedText;
  submit: LocalizedText;
  sending: LocalizedText;
  done: LocalizedText;
  doneHint: LocalizedText;
  error: LocalizedText;
  required: LocalizedText;
  legal: LocalizedText;
  /**
   * Согласие с офертой — одной фразой с маркерами {offer} и {licence},
   * на месте которых подставляются ссылки.
   *
   * Разбивать фразу на куски («до ссылки», «между», «после») не вышло:
   * куски пришлось бы хранить с краевыми пробелами, а их запрещает
   * проверка в tests/products.test.ts — и запрещает правильно, потому что
   * невидимый пробел в конце строки не отличить от опечатки. К тому же
   * порядок слов и пробелы вокруг связки в четырёх языках разные: в
   * китайском между «与» и ссылкой пробел не нужен вовсе.
   *
   * Риск подстановки — потерянный при переводе маркер: он оставил бы
   * покупателя без ссылки на договор, который тот принимает. Поэтому
   * наличие обоих маркеров в каждом языке держит тест.
   */
  consent: LocalizedText;
  consentOffer: LocalizedText;
  consentLicence: LocalizedText;
  consentRequired: LocalizedText;
  /**
   * Ссылка на страницу заказа показывается один раз — здесь.
   *
   * Второй раз её взять неоткуда: в базе лежит только хеш токена, и
   * перевыпускает ссылку менеджер кнопкой в панели. Выдача по номеру заявки
   * была бы оракулом для подбора — удачная попытка одновременно открывала бы
   * заказ чужому и отбирала доступ у покупателя.
   */
  yourPage: LocalizedText;
  savePage: LocalizedText;
  copyLink: LocalizedText;
  copied: LocalizedText;
};

export const orderCopy: OrderCopy = {
  heading: {
    ru: "Заявка на счёт",
    en: "Request an invoice",
    uz: "Hisob-faktura uchun ariza",
    zh: "申请开具发票",
  },
  intro: {
    ru: "Оставьте реквизиты — выставим счёт и пришлём договор. Ничего не списывается: оплата по счёту, после подписания.",
    en: "Leave your company details and we will issue an invoice and send the contract. Nothing is charged here: payment is by bank transfer, after signing.",
    uz: "Rekvizitlarni qoldiring — hisob-faktura chiqaramiz va shartnomani yuboramiz. Bu yerda hech narsa yechilmaydi: to‘lov shartnoma imzolangach, hisob bo‘yicha amalga oshiriladi.",
    zh: "留下贵公司信息，我们将开具发票并发送合同。此处不会发生任何扣款：签署合同后通过银行转账付款。",
  },
  company: {
    ru: "Компания",
    en: "Company",
    uz: "Kompaniya",
    zh: "公司名称",
  },
  taxId: {
    ru: "ИНН или регистрационный номер",
    en: "Tax ID or registration number",
    uz: "STIR yoki ro‘yxatdan o‘tish raqami",
    zh: "税号或注册号",
  },
  country: {
    ru: "Страна",
    en: "Country",
    uz: "Davlat",
    zh: "国家",
  },
  contactName: {
    ru: "Ваше имя",
    en: "Your name",
    uz: "Ismingiz",
    zh: "您的姓名",
  },
  contact: {
    ru: "Как связаться",
    en: "How to reach you",
    uz: "Qanday bog‘lanamiz",
    zh: "联系方式",
  },
  contactHint: {
    ru: "Почта, телефон или Telegram",
    en: "Email, phone or Telegram",
    uz: "Pochta, telefon yoki Telegram",
    zh: "邮箱、电话或 Telegram",
  },
  comment: {
    ru: "Комментарий",
    en: "Comment",
    uz: "Izoh",
    zh: "备注",
  },
  payment: {
    ru: "Способ оплаты",
    en: "Payment method",
    uz: "To‘lov usuli",
    zh: "付款方式",
  },
  paymentBank: {
    ru: "Безналичный расчёт по счёту",
    en: "Bank transfer against an invoice",
    uz: "Hisob bo‘yicha pul o‘tkazmasi",
    zh: "凭发票银行转账",
  },
  paymentManager: {
    ru: "Обсудить другой способ с менеджером",
    en: "Discuss another method with a manager",
    uz: "Menejer bilan boshqa usulni muhokama qilish",
    zh: "与客户经理讨论其他方式",
  },
  submit: {
    ru: "Отправить заявку",
    en: "Send the request",
    uz: "Arizani yuborish",
    zh: "提交申请",
  },
  sending: {
    ru: "Отправляем…",
    en: "Sending…",
    uz: "Yuborilmoqda…",
    zh: "提交中…",
  },
  done: {
    ru: "Заявка принята",
    en: "Request received",
    uz: "Ariza qabul qilindi",
    zh: "申请已收到",
  },
  doneHint: {
    ru: "Номер заявки — назовите его, когда напишете. Менеджер свяжется в течение рабочего дня.",
    en: "Your request number — quote it when you write. A manager will get in touch within one business day.",
    uz: "Ariza raqami — yozganingizda shuni ayting. Menejer ish kuni davomida bog‘lanadi.",
    zh: "这是您的申请编号，联系我们时请提供。客户经理将在一个工作日内与您联系。",
  },
  error: {
    ru: "Не отправилось. Проверьте поля или напишите в чат.",
    en: "It did not go through. Check the fields or write to us in the chat.",
    uz: "Yuborilmadi. Maydonlarni tekshiring yoki chatga yozing.",
    zh: "提交未成功。请检查填写内容，或在聊天中联系我们。",
  },
  required: {
    ru: "Заполните компанию, имя и контакт.",
    en: "Fill in the company, your name and a contact.",
    uz: "Kompaniya, ism va kontaktni to‘ldiring.",
    zh: "请填写公司名称、姓名和联系方式。",
  },
  legal: {
    ru: "Принимаем безналичный расчёт на юридическое лицо. Криптовалюту как средство платежа не принимаем — это запрещено законодательством Узбекистана.",
    en: "We accept bank transfers from legal entities. We do not accept cryptocurrency as a means of payment — Uzbek law prohibits it.",
    uz: "Yuridik shaxslardan pul o‘tkazmasini qabul qilamiz. Kriptovalyutani to‘lov vositasi sifatida qabul qilmaymiz — buni O‘zbekiston qonunchiligi taqiqlaydi.",
    zh: "我们接受法人实体的银行转账。不接受加密货币作为支付方式 —— 乌兹别克斯坦法律禁止此类支付。",
  },
  consent: {
    ru: "Я прочитал и принимаю {offer} и {licence}. Договор считается заключённым с момента оплаты счёта.",
    en: "I have read and accept the {offer} and the {licence}. The contract is concluded when the invoice is paid.",
    uz: "Men {offer} va {licence} bilan tanishdim va ularni qabul qilaman. Shartnoma hisob to‘langan paytdan tuzilgan hisoblanadi.",
    zh: "我已阅读并接受{offer}与{licence}。合同自发票付款时成立。",
  },
  consentOffer: {
    ru: "публичную оферту",
    en: "public offer",
    uz: "ommaviy oferta",
    zh: "《公开要约》",
  },
  consentLicence: {
    ru: "лицензию на программный код",
    en: "source code licence",
    uz: "dasturiy kod litsenziyasi",
    zh: "《源代码许可》",
  },
  consentRequired: {
    ru: "Без согласия с офертой заявку принять нельзя.",
    en: "We cannot accept a request without acceptance of the offer.",
    uz: "Oferta bilan rozilik bo‘lmasa, arizani qabul qilib bo‘lmaydi.",
    zh: "未接受要约则无法受理申请。",
  },
  yourPage: {
    ru: "Страница вашего заказа",
    en: "Your order page",
    uz: "Buyurtmangiz sahifasi",
    zh: "您的订单页面",
  },
  savePage: {
    ru: "Сохраните ссылку: на ней видно статус, счёт и — после оплаты — файлы. Показываем её один раз.",
    en: "Save this link: it shows the status, the invoice and — once paid — the files. We show it only once.",
    uz: "Havolani saqlang: unda holat, hisob-faktura va to‘lovdan keyin fayllar ko‘rinadi. Uni bir marta ko‘rsatamiz.",
    zh: "请保存此链接：可查看订单状态、发票，付款后还可下载文件。此链接仅显示一次。",
  },
  copyLink: {
    ru: "Скопировать",
    en: "Copy",
    uz: "Nusxalash",
    zh: "复制",
  },
  copied: {
    ru: "Скопировано",
    en: "Copied",
    uz: "Nusxalandi",
    zh: "已复制",
  },
};
