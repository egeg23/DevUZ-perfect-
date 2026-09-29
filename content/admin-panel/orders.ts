import { defineDict, plural } from "@/lib/admin/i18n";

/**
 * Раздел «Заявки» (/admin/orders): заявки на покупку из витрины.
 *
 * Термины — по GLOSSARY.md: заявка — buyurtma / zamówienie, счёт —
 * hisob-faktura / faktura. Письма и сообщения бота покупателю здесь не
 * переводятся: они на языке покупателя и живут в lib/store.
 */
export const ordersDict = defineDict({
  title: { ru: "Заявки на покупку", uz: "Xarid buyurtmalari", pl: "Zamówienia" },
  bankMissing: {
    ru: (vars: string) =>
      `Банковские реквизиты не настроены: ${vars}. Счёт выставится, но покупатель не увидит, куда платить. Переменные задаются в окружении на сервере.`,
    uz: (vars: string) =>
      `Bank rekvizitlari sozlanmagan: ${vars}. Hisob-faktura chiqadi, lekin xaridor qayerga to‘lashni ko‘rmaydi. O‘zgaruvchilar serverdagi muhitda beriladi.`,
    pl: (vars: string) =>
      `Dane bankowe nie są skonfigurowane: ${vars}. Faktura zostanie wystawiona, ale kupujący nie zobaczy, dokąd zapłacić. Zmienne ustawia się w środowisku na serwerze.`,
  },
  linkReissued: {
    ru: "Ссылка перевыпущена. Старая больше не работает — отправьте покупателю эту:",
    uz: "Havola qayta chiqarildi. Eskisi endi ishlamaydi — xaridorga shuni yuboring:",
    pl: "Link wygenerowany ponownie. Stary już nie działa — wyślij kupującemu ten:",
  },
  done: { ru: "Готово.", uz: "Tayyor.", pl: "Gotowe." },
  failed: { ru: "Не получилось.", uz: "Bo‘lmadi.", pl: "Nie udało się." },
  all: { ru: "все", uz: "barchasi", pl: "wszystkie" },
  empty: { ru: "Заявок нет.", uz: "Buyurtmalar yo‘q.", pl: "Brak zamówień." },
  foot: {
    ru: "Контакт покупателя показан сразу, в отличие от лида: он прислал реквизиты сам, чтобы ему выставили счёт. Каждое действие закрепляет заявку за вами и попадает в журнал. Подтверждение оплаты требует ссылки на выписку — без неё «оплачено» нечем подтвердить.",
    uz: "Liddan farqli o‘laroq, xaridor kontakti darhol ko‘rinadi: u hisob-faktura chiqarilishi uchun rekvizitlarini o‘zi yuborgan. Har bir amal buyurtmani sizga biriktiradi va jurnalga yoziladi. To‘lovni tasdiqlash uchun bank ko‘chirmasiga havola kerak — busiz «to‘langan»ni hech narsa bilan tasdiqlab bo‘lmaydi.",
    pl: "Dane kontaktowe kupującego widać od razu, inaczej niż przy leadzie: sam przysłał dane, żeby wystawić mu fakturę. Każda akcja przypisuje zamówienie do Ciebie i trafia do dziennika. Potwierdzenie płatności wymaga odwołania do wyciągu — bez niego «opłacone» nie ma czym potwierdzić.",
  },

  // Карточка заявки
  noAmount: { ru: "сумма не проставлена", uz: "summa kiritilmagan", pl: "kwota nieustalona" },
  company: { ru: "Компания", uz: "Kompaniya", pl: "Firma" },
  contact: { ru: "Контакт", uz: "Kontakt", pl: "Kontakt" },
  botLinked: { ru: "бот привязан", uz: "bot ulangan", pl: "bot połączony" },
  payment: { ru: "Оплата", uz: "To‘lov", pl: "Płatność" },
  invoice: { ru: "Счёт", uz: "Hisob-faktura", pl: "Faktura" },
  paid: { ru: "Оплачено", uz: "To‘langan", pl: "Opłacono" },
  delivered: { ru: "Передан", uz: "Topshirildi", pl: "Przekazano" },
  access: { ru: "Доступ", uz: "Kirish", pl: "Dostęp" },
  accessClosed: {
    ru: (date: string) => `закрыт с ${date}`,
    uz: (date: string) => `${date} dan yopiq`,
    pl: (date: string) => `zamknięty od ${date}`,
  },
  accessRevoked: {
    ru: (n: number) => `отзывался ${n} ${plural("ru", n, "раз", "раза", "раз")}, сейчас открыт`,
    uz: (n: number) => `${n} marta bekor qilingan, hozir ochiq`,
    pl: (n: number) => `cofany ${n} ${plural("pl", n, "raz", "razy", "razy")}, teraz otwarty`,
  },

  // Кнопки
  reopen: { ru: "вернуть в работу", uz: "ishga qaytarish", pl: "przywróć do realizacji" },
  amountPlaceholder: { ru: "сумма, $", uz: "summa, $", pl: "kwota, $" },
  setAmount: { ru: "проставить", uz: "kiritish", pl: "ustaw" },
  issueInvoice: { ru: "выставить счёт", uz: "hisob-faktura chiqarish", pl: "wystaw fakturę" },
  refPlaceholder: { ru: "строка выписки", uz: "ko‘chirmadagi qator", pl: "pozycja z wyciągu" },
  markPaid: { ru: "оплата получена", uz: "to‘lov olindi", pl: "płatność otrzymana" },
  markDelivered: { ru: "код передан", uz: "kod topshirildi", pl: "kod przekazany" },
  reissueLink: { ru: "перевыпустить ссылку", uz: "havolani qayta chiqarish", pl: "wygeneruj link ponownie" },
  restoreAccess: { ru: "вернуть доступ к файлам", uz: "fayllarga kirishni qaytarish", pl: "przywróć dostęp do plików" },
  revokeAccess: { ru: "отозвать доступ к файлам", uz: "fayllarga kirishni bekor qilish", pl: "cofnij dostęp do plików" },
  cancel: { ru: "отменить", uz: "bekor qilish", pl: "anuluj" },
  ownedBy: {
    ru: (name: string) => `ведёт ${name}`,
    uz: (name: string) => `mas’ul: ${name}`,
    pl: (name: string) => `prowadzi: ${name}`,
  },
});

/** Статус заявки на панели. Ключ — `orders.status`. */
export const orderStatusDict = defineDict({
  new: { ru: "новая", uz: "yangi", pl: "nowe" },
  invoiced: { ru: "счёт выставлен", uz: "hisob-faktura chiqarilgan", pl: "faktura wystawiona" },
  paid: { ru: "оплачена", uz: "to‘langan", pl: "opłacone" },
  delivered: { ru: "передан", uz: "topshirilgan", pl: "przekazane" },
  cancelled: { ru: "отменена", uz: "bekor qilingan", pl: "anulowane" },
});

/** Как покупатель хочет платить. Ключ — `orders.payment`. */
export const orderPaymentDict = defineDict({
  bank: { ru: "безнал по счёту", uz: "hisob-faktura bo‘yicha naqd pulsiz", pl: "przelew na podstawie faktury" },
  manager: { ru: "хочет обсудить оплату", uz: "to‘lovni muhokama qilmoqchi", pl: "chce omówić płatność" },
});

/**
 * Почему действие с заявкой не прошло. Ключ — код из lib/admin/orders.ts,
 * он же параметр `e` в адресе. Ответ базы (`d`) показывается как есть: это
 * технический текст, по нему ищут причину.
 */
export const orderErrorDict = defineDict({
  bad_amount: { ru: "Сумма вне разумных границ.", uz: "Summa oqilona chegaradan tashqarida.", pl: "Kwota poza rozsądnym zakresem." },
  no_db: { ru: "Нет базы.", uz: "Baza yo‘q.", pl: "Brak bazy danych." },
  not_found: { ru: "Заявка не найдена.", uz: "Buyurtma topilmadi.", pl: "Nie znaleziono zamówienia." },
  invoice_issued: {
    ru: "Счёт уже выставлен — сумму менять поздно.",
    uz: "Hisob-faktura allaqachon chiqarilgan — summani o‘zgartirishga kech.",
    pl: "Faktura jest już wystawiona — na zmianę kwoty za późno.",
  },
  cancelled: { ru: "Заявка отменена.", uz: "Buyurtma bekor qilingan.", pl: "Zamówienie jest anulowane." },
  no_amount: {
    ru: "Сначала проставьте сумму сделки.",
    uz: "Avval bitim summasini kiriting.",
    pl: "Najpierw ustaw kwotę transakcji.",
  },
  invoice_no_failed: {
    ru: "Не выдался номер счёта.",
    uz: "Hisob-faktura raqami berilmadi.",
    pl: "Nie udało się nadać numeru faktury.",
  },
  no_ref: {
    ru: "Укажите, чем платёж опознаётся в выписке.",
    uz: "To‘lov ko‘chirmada nima bo‘yicha aniqlanishini ko‘rsating.",
    pl: "Podaj, po czym płatność rozpoznać na wyciągu.",
  },
  no_invoice: {
    ru: "Счёт не выставлен — оплачивать нечего.",
    uz: "Hisob-faktura chiqarilmagan — to‘lanadigan narsa yo‘q.",
    pl: "Faktura nie jest wystawiona — nie ma czego opłacać.",
  },
  not_paid: {
    ru: "Оплата не подтверждена — передавать код рано.",
    uz: "To‘lov tasdiqlanmagan — kodni topshirishga hali erta.",
    pl: "Płatność nie jest potwierdzona — na przekazanie kodu za wcześnie.",
  },
  not_cancelled: { ru: "Заявка и так в работе.", uz: "Buyurtma baribir ishda.", pl: "Zamówienie i tak jest w realizacji." },
  access_open: { ru: "Доступ и так открыт.", uz: "Kirish baribir ochiq.", pl: "Dostęp i tak jest otwarty." },
  db_error: { ru: "База ответила ошибкой.", uz: "Baza xato bilan javob berdi.", pl: "Baza danych zwróciła błąd." },
});
