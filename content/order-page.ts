import type { LocalizedText } from "@/lib/i18n";

/**
 * Тексты страницы заказа и печатного счёта.
 *
 * Страницу открывает покупатель по ссылке из письма или из чата, и открыть
 * он может её на любом из четырёх языков — локаль зашита в саму ссылку,
 * потому что заявку он оставлял на конкретной версии сайта. Поэтому здесь,
 * как и везде, четыре языка без исключений: узбекская версия на этом сайте
 * не «когда дойдут руки», а требование к продаже в Узбекистане.
 *
 * Счёт — часть того же файла, а не отдельного: половина его подписей
 * (компания, ИНН, сумма) повторяет подписи страницы, и держать их в двух
 * местах значит однажды перевести только одно из них.
 */
export type OrderPageCopy = {
  title: LocalizedText;
  notFound: LocalizedText;
  notFoundHint: LocalizedText;

  /** Шаги сделки. Порядок — порядок жизни заказа. */
  stepNew: LocalizedText;
  stepInvoiced: LocalizedText;
  stepPaid: LocalizedText;
  stepDelivered: LocalizedText;
  cancelled: LocalizedText;
  cancelledHint: LocalizedText;

  waitingInvoice: LocalizedText;
  waitingPayment: LocalizedText;
  waitingDelivery: LocalizedText;
  deliveredHint: LocalizedText;

  orderNo: LocalizedText;
  orderedAt: LocalizedText;
  product: LocalizedText;
  amount: LocalizedText;
  amountByAgreement: LocalizedText;

  buyer: LocalizedText;
  seller: LocalizedText;
  taxId: LocalizedText;
  address: LocalizedText;
  bank: LocalizedText;
  account: LocalizedText;
  mfo: LocalizedText;
  swift: LocalizedText;

  invoice: LocalizedText;
  invoiceNo: LocalizedText;
  invoiceDate: LocalizedText;
  invoicePrint: LocalizedText;
  invoicePending: LocalizedText;
  invoiceDue: LocalizedText;
  invoiceLine: LocalizedText;
  invoiceQty: LocalizedText;
  invoicePrice: LocalizedText;
  invoiceSum: LocalizedText;
  invoiceTotal: LocalizedText;
  invoiceVat: LocalizedText;
  invoiceSignature: LocalizedText;

  telegram: LocalizedText;
  telegramHint: LocalizedText;
  keepLink: LocalizedText;
  lostLink: LocalizedText;
  download: LocalizedText;
  downloadFile: LocalizedText;
  downloadVersion: LocalizedText;
  downloadSize: LocalizedText;
  downloadChecksum: LocalizedText;
  downloadChecksumHint: LocalizedText;
  /** Остаток выдач. {total} и {today} подставляются числами. */
  downloadLeft: LocalizedText;
  downloadPreparing: LocalizedText;
  documents: LocalizedText;
  offer: LocalizedText;
  licence: LocalizedText;
  acceptedAt: LocalizedText;
};

export const orderPage: OrderPageCopy = {
  title: {
    ru: "Заказ",
    en: "Order",
    uz: "Buyurtma",
    zh: "订单",
  },
  notFound: {
    ru: "Заказ не найден",
    en: "Order not found",
    uz: "Buyurtma topilmadi",
    zh: "未找到订单",
  },
  notFoundHint: {
    ru: "Ссылка неверна или её перевыпустили. Напишите нам в Telegram, назовите номер заявки — пришлём новую.",
    en: "The link is wrong or has been reissued. Message us on Telegram with your order number and we will send a new one.",
    uz: "Havola noto‘g‘ri yoki qaytadan chiqarilgan. Telegramda yozing va buyurtma raqamini ayting — yangisini yuboramiz.",
    zh: "链接有误或已重新签发。请在 Telegram 上联系我们并提供订单号，我们会发送新链接。",
  },

  stepNew: {
    ru: "Заявка принята",
    en: "Order received",
    uz: "Ariza qabul qilindi",
    zh: "订单已收到",
  },
  stepInvoiced: {
    ru: "Счёт выставлен",
    en: "Invoice issued",
    uz: "Hisob-faktura chiqarildi",
    zh: "已开具发票",
  },
  stepPaid: {
    ru: "Оплата получена",
    en: "Payment received",
    uz: "To‘lov qabul qilindi",
    zh: "已收到付款",
  },
  stepDelivered: {
    ru: "Код передан",
    en: "Code delivered",
    uz: "Kod topshirildi",
    zh: "代码已交付",
  },
  cancelled: {
    ru: "Заказ отменён",
    en: "Order cancelled",
    uz: "Buyurtma bekor qilindi",
    zh: "订单已取消",
  },
  cancelledHint: {
    ru: "Если это ошибка — напишите нам, восстановим.",
    en: "If this is a mistake, message us and we will restore it.",
    uz: "Agar bu xato bo‘lsa, bizga yozing — tiklaymiz.",
    zh: "如有误，请联系我们，我们会恢复订单。",
  },

  waitingInvoice: {
    ru: "Менеджер готовит счёт. Обычно это занимает несколько часов в рабочее время.",
    en: "Your manager is preparing the invoice. This usually takes a few hours during business hours.",
    uz: "Menejer hisob-fakturani tayyorlamoqda. Bu odatda ish vaqtida bir necha soat oladi.",
    zh: "客户经理正在准备发票，工作时间内通常需要几小时。",
  },
  waitingPayment: {
    ru: "Счёт готов. После поступления денег доступ к коду откроется на этой же странице.",
    en: "The invoice is ready. Once the payment arrives, access to the code opens on this page.",
    uz: "Hisob-faktura tayyor. To‘lov kelgach, kodga kirish shu sahifada ochiladi.",
    zh: "发票已就绪。款项到账后，代码访问权限将在此页面开放。",
  },
  waitingDelivery: {
    ru: "Оплата получена. Готовим передачу — файлы появятся здесь.",
    en: "Payment received. We are preparing the handover — the files will appear here.",
    uz: "To‘lov qabul qilindi. Topshirishni tayyorlayapmiz — fayllar shu yerda paydo bo‘ladi.",
    zh: "已收到付款。我们正在准备交付，文件将显示在此处。",
  },
  deliveredHint: {
    ru: "Файлы доступны по ссылкам ниже. Ссылки действуют минуту с момента нажатия — этого хватает браузеру, чтобы начать скачивание.",
    en: "The files are available below. Each link is valid for one minute after you click it — enough for the browser to start the download.",
    uz: "Fayllar quyidagi havolalarda. Har bir havola bosilgandan keyin bir daqiqa amal qiladi — brauzer yuklashni boshlashiga yetadi.",
    zh: "文件可通过下方链接获取。每个链接在点击后一分钟内有效，足够浏览器开始下载。",
  },

  orderNo: { ru: "Номер заявки", en: "Order number", uz: "Buyurtma raqami", zh: "订单号" },
  orderedAt: { ru: "Дата заявки", en: "Order date", uz: "Buyurtma sanasi", zh: "下单日期" },
  product: { ru: "Продукт", en: "Product", uz: "Mahsulot", zh: "产品" },
  amount: { ru: "Сумма", en: "Amount", uz: "Summa", zh: "金额" },
  amountByAgreement: {
    ru: "по договорённости",
    en: "by agreement",
    uz: "kelishuv bo‘yicha",
    zh: "面议",
  },

  buyer: { ru: "Покупатель", en: "Buyer", uz: "Xaridor", zh: "买方" },
  seller: { ru: "Поставщик", en: "Supplier", uz: "Yetkazib beruvchi", zh: "供方" },
  taxId: { ru: "ИНН", en: "Tax ID", uz: "STIR", zh: "税号" },
  address: { ru: "Адрес", en: "Address", uz: "Manzil", zh: "地址" },
  bank: { ru: "Банк", en: "Bank", uz: "Bank", zh: "开户银行" },
  account: { ru: "Расчётный счёт", en: "Account", uz: "Hisob raqami", zh: "账号" },
  mfo: { ru: "МФО", en: "Bank code (MFO)", uz: "MFO", zh: "银行代码 (MFO)" },
  swift: { ru: "SWIFT", en: "SWIFT", uz: "SWIFT", zh: "SWIFT" },

  invoice: { ru: "Счёт на оплату", en: "Invoice", uz: "To‘lov uchun hisob", zh: "付款发票" },
  /** Только знак номера: название документа стоит рядом, в `invoice`. */
  invoiceNo: { ru: "№", en: "No.", uz: "№", zh: "编号" },
  invoiceDate: { ru: "от", en: "dated", uz: "sana", zh: "开具日期" },
  invoicePrint: { ru: "Распечатать счёт", en: "Print invoice", uz: "Hisobni chop etish", zh: "打印发票" },
  invoicePending: {
    ru: "Счёт ещё не выставлен.",
    en: "The invoice has not been issued yet.",
    uz: "Hisob-faktura hali chiqarilmagan.",
    zh: "发票尚未开具。",
  },
  invoiceDue: { ru: "Оплатить до", en: "Pay by", uz: "To‘lash muddati", zh: "付款截止日" },
  invoiceLine: { ru: "Наименование", en: "Description", uz: "Nomi", zh: "项目" },
  invoiceQty: { ru: "Кол-во", en: "Qty", uz: "Soni", zh: "数量" },
  invoicePrice: { ru: "Цена", en: "Price", uz: "Narxi", zh: "单价" },
  invoiceSum: { ru: "Сумма", en: "Sum", uz: "Summa", zh: "金额" },
  invoiceTotal: { ru: "Всего к оплате", en: "Total due", uz: "Jami to‘lovga", zh: "应付总额" },
  /**
   * Основание освобождения от НДС.
   *
   * Формулировка одна на все языки по смыслу и проверяется бухгалтером —
   * это не маркетинговый текст, а строка документа. Поставщик на налоге с
   * оборота плательщиком НДС не является; если режим налогообложения
   * изменится, менять надо здесь, и счёт перестроится сам.
   */
  invoiceVat: {
    ru: "НДС не облагается: поставщик является плательщиком налога с оборота и на учёте по НДС не состоит.",
    en: "VAT is not charged: the supplier pays turnover tax and is not registered for VAT.",
    uz: "QQS solinmaydi: yetkazib beruvchi aylanma solig‘i to‘lovchisi bo‘lib, QQS hisobida turmaydi.",
    zh: "不征收增值税：供方为营业额税纳税人，未登记为增值税纳税人。",
  },
  invoiceSignature: {
    ru: "Счёт действителен без печати и подписи.",
    en: "This invoice is valid without a stamp or signature.",
    uz: "Ushbu hisob muhr va imzosiz ham haqiqiy.",
    zh: "本发票无需盖章或签字即有效。",
  },

  telegram: {
    ru: "Получать статус в Telegram",
    en: "Get status updates on Telegram",
    uz: "Telegramda holatni kuzatish",
    zh: "在 Telegram 上接收状态更新",
  },
  telegramHint: {
    ru: "Нажмите — бот привяжет этот заказ и сам напишет, когда счёт выставлен и когда оплата дошла.",
    en: "Tap it — the bot links this order and messages you when the invoice is issued and when the payment arrives.",
    uz: "Bosing — bot bu buyurtmani bog‘laydi va hisob chiqarilganda hamda to‘lov kelganda o‘zi yozadi.",
    zh: "点击后，机器人会关联此订单，并在开具发票和收到付款时主动通知您。",
  },
  keepLink: {
    ru: "Сохраните эту ссылку — по ней вы возвращаетесь к заказу.",
    en: "Save this link — it is how you come back to this order.",
    uz: "Ushbu havolani saqlang — buyurtmaga shu orqali qaytasiz.",
    zh: "请保存此链接，您将通过它返回此订单。",
  },
  lostLink: {
    ru: "Потеряли ссылку — напишите в Telegram, назовите номер заявки. Ссылку перевыпустит менеджер: автоматической выдачи по номеру нет намеренно, иначе номер можно было бы подобрать.",
    en: "Lost the link? Message us on Telegram with your order number. A manager reissues it: there is deliberately no automatic lookup by number, otherwise the number could be guessed.",
    uz: "Havolani yo‘qotdingizmi — Telegramda yozing va buyurtma raqamini ayting. Havolani menejer qayta chiqaradi: raqam bo‘yicha avtomatik berish ataylab yo‘q, aks holda raqamni topib olish mumkin bo‘lardi.",
    zh: "链接丢失？请在 Telegram 上联系我们并提供订单号。由客户经理重新签发：我们有意不提供按订单号自动查询，否则订单号可能被猜到。",
  },
  download: { ru: "Скачать код", en: "Download the code", uz: "Kodni yuklab olish", zh: "下载代码" },
  downloadFile: { ru: "Скачать архив", en: "Download archive", uz: "Arxivni yuklash", zh: "下载压缩包" },
  downloadVersion: { ru: "Версия", en: "Version", uz: "Versiya", zh: "版本" },
  downloadSize: { ru: "Размер", en: "Size", uz: "Hajmi", zh: "大小" },
  downloadChecksum: { ru: "Контрольная сумма", en: "Checksum", uz: "Nazorat yig‘indisi", zh: "校验和" },
  downloadChecksumHint: {
    ru: "Сверьте её после скачивания: так вы убедитесь, что получили ровно тот архив, который мы отдали.",
    en: "Check it after downloading: that is how you confirm you got exactly the archive we handed over.",
    uz: "Yuklab olgandan keyin solishtiring: shunda biz bergan arxivning aynan o‘zini olganingizga ishonch hosil qilasiz.",
    zh: "下载后请核对：这样即可确认您收到的正是我们交付的压缩包。",
  },
  downloadLeft: {
    ru: "Осталось скачиваний: {total} всего, {today} сегодня. Повторный клик по тому же файлу в течение десяти минут не расходует лимит.",
    en: "Downloads left: {total} in total, {today} today. Clicking the same file again within ten minutes does not use up the limit.",
    uz: "Qolgan yuklab olishlar: jami {total}, bugun {today}. O‘sha faylni o‘n daqiqa ichida qayta bosish limitni sarflamaydi.",
    zh: "剩余下载次数：共 {total} 次，今日 {today} 次。十分钟内重复点击同一文件不消耗次数。",
  },
  downloadPreparing: {
    ru: "Файл готовим. Напишите нам, если ждёте дольше суток.",
    en: "We are preparing the file. Message us if you have been waiting more than a day.",
    uz: "Faylni tayyorlayapmiz. Bir kundan ko‘p kutayotgan bo‘lsangiz, bizga yozing.",
    zh: "文件正在准备中。如果等待超过一天，请联系我们。",
  },
  documents: { ru: "Документы", en: "Documents", uz: "Hujjatlar", zh: "文件" },
  offer: { ru: "Публичная оферта", en: "Public offer", uz: "Ommaviy oferta", zh: "公开要约" },
  licence: { ru: "Лицензия на код", en: "Source code licence", uz: "Kodga litsenziya", zh: "源代码许可" },
  acceptedAt: {
    ru: "принята",
    en: "accepted",
    uz: "qabul qilindi",
    zh: "已接受",
  },
};
