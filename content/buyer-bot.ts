import type { LocalizedText } from "@/lib/i18n";

/**
 * Что бот пишет покупателю о его заказе.
 *
 * Отдельно от botCopy: там реплики AI-менеджера, который разговаривает с
 * посетителем, здесь — короткие уведомления о сделке. Смешивать их значило
 * бы однажды ответить человеку, ждущему подтверждения оплаты, приветствием
 * квалификатора.
 *
 * Ссылки на страницу заказа в этих сообщениях нет, и это не упущение.
 * Собрать её неоткуда: в базе лежит только sha256 токена, и восстановить
 * из него адрес нельзя — ровно в этом и был смысл хеширования. Поставить
 * ссылку сюда значило бы хранить токен в открытом виде и отменить защиту,
 * которая уже работает.
 *
 * Покупателю она и не нужна: он держит её с момента оформления, а если
 * потерял — теперь у него есть этот самый чат, чтобы попросить новую.
 * Поэтому сообщения заканчиваются приглашением написать, а не адресом.
 *
 * Маркеры в фигурных скобках подставляются: {no} — номер заявки,
 * {product} — название продукта. Тест следит, что ни один не потерялся при
 * переводе: без {no} покупатель с двумя заказами не поймёт, о каком речь.
 */
export type BuyerNotice = {
  bound: LocalizedText;
  invoiced: LocalizedText;
  paid: LocalizedText;
  delivered: LocalizedText;
  cancelled: LocalizedText;
  unknownCode: LocalizedText;
};

export const buyerBot: BuyerNotice = {
  bound: {
    ru: "Готово — буду писать сюда о заказе {no} ({product}).\n\nСообщу, когда счёт будет выставлен и когда придёт оплата. Страница заказа — по той ссылке, которую вы сохранили при оформлении; потеряли — напишите сюда, пришлём новую.",
    en: "Done — I will write here about order {no} ({product}).\n\nI will let you know when the invoice is issued and when the payment arrives. Your order page is at the link you saved when ordering; if you lost it, write here and we will send a new one.",
    uz: "Tayyor — {no} buyurtmasi ({product}) haqida shu yerga yozaman.\n\nHisob chiqarilganda va to‘lov kelganda xabar beraman. Buyurtma sahifasi — rasmiylashtirishda saqlagan havolangizda; yo‘qotgan bo‘lsangiz, shu yerga yozing, yangisini yuboramiz.",
    zh: "已完成 — 我会在这里通知您订单 {no}（{product}）的进展。\n\n开具发票和收到付款时都会告知您。订单页面就在您下单时保存的链接；如已丢失，请在此留言，我们会发送新链接。",
  },
  invoiced: {
    ru: "Счёт по заказу {no} выставлен — откройте страницу заказа, чтобы посмотреть и распечатать его.",
    en: "The invoice for order {no} has been issued — open your order page to view and print it.",
    uz: "{no} buyurtmasi bo‘yicha hisob chiqarildi — ko‘rish va chop etish uchun buyurtma sahifasini oching.",
    zh: "订单 {no} 的发票已开具 —— 请打开订单页面查看并打印。",
  },
  paid: {
    ru: "Оплата по заказу {no} получена, спасибо. Файлы уже доступны на странице заказа.",
    en: "Payment for order {no} has been received, thank you. The files are now available on your order page.",
    uz: "{no} buyurtmasi bo‘yicha to‘lov qabul qilindi, rahmat. Fayllar buyurtma sahifasida allaqachon mavjud.",
    zh: "订单 {no} 的款项已收到，谢谢。文件现已在订单页面提供。",
  },
  delivered: {
    ru: "Код по заказу {no} передан. Ссылки на файлы остаются на странице заказа.",
    en: "The code for order {no} has been handed over. The file links remain on your order page.",
    uz: "{no} buyurtmasi bo‘yicha kod topshirildi. Fayl havolalari buyurtma sahifasida qoladi.",
    zh: "订单 {no} 的代码已交付。文件链接保留在订单页面。",
  },
  cancelled: {
    ru: "Заказ {no} отменён. Если это ошибка — напишите сюда, восстановим.",
    en: "Order {no} has been cancelled. If this is a mistake, write here and we will restore it.",
    uz: "{no} buyurtmasi bekor qilindi. Agar bu xato bo‘lsa, shu yerga yozing — tiklaymiz.",
    zh: "订单 {no} 已取消。如有误，请在此留言，我们会恢复。",
  },
  unknownCode: {
    ru: "Эта ссылка привязки уже использована или устарела. Откройте страницу заказа и нажмите кнопку Telegram заново.",
    en: "This link has already been used or has expired. Open your order page and tap the Telegram button again.",
    uz: "Bu bog‘lash havolasi allaqachon ishlatilgan yoki eskirgan. Buyurtma sahifasini oching va Telegram tugmasini qaytadan bosing.",
    zh: "此关联链接已被使用或已过期。请打开订单页面并重新点击 Telegram 按钮。",
  },
};
