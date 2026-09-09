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
};
