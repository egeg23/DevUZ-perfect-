import { defineDict } from "@/lib/admin/i18n";

/**
 * Раздел «ИИ-сотрудники» (/admin/ai-staff) — только владельцу: клиенты
 * сервиса по подписке, их расход и оплаты (docs/ai-staff/design.md).
 *
 * Названия тарифов — Tr-таблица PLAN_TITLE в lib/ai-staff/plans.ts: «Старт»
 * в этом словаре столкнулся бы с кнопкой бота «Старт» в инструкции.
 */
export const aiStaffDict = defineDict({
  title: { ru: "ИИ-сотрудники", uz: "SI xodimlar", pl: "Pracownicy AI" },
  intro: {
    ru: "Клиенты сервиса по подписке: тариф, срок, диалоги, заявки и себестоимость по расходу модели. Оплату отмечаете здесь вы.",
    uz: "Obuna xizmati mijozlari: tarif, muddat, suhbatlar, arizalar va model sarfi bo‘yicha tannarx. To‘lovni shu yerda siz belgilaysiz.",
    pl: "Klienci usługi w abonamencie: plan, termin, dialogi, zgłoszenia i koszt według zużycia modelu. Płatności zaznaczasz tutaj.",
  },
  service: { ru: "Сервис", uz: "Xizmat", pl: "Usługa" },
  on: { ru: "Включён", uz: "Yoqilgan", pl: "Włączona" },
  off: { ru: "Выключен", uz: "O‘chirilgan", pl: "Wyłączona" },
  turnOn: { ru: "Включить сервис", uz: "Xizmatni yoqish", pl: "Włącz usługę" },
  turnOff: { ru: "Выключить сервис", uz: "Xizmatni o‘chirish", pl: "Wyłącz usługę" },
  bot: { ru: "Бот сервиса", uz: "Xizmat boti", pl: "Bot usługi" },
  setupBot: { ru: "Подключить бота сервиса", uz: "Xizmat botini ulash", pl: "Podłącz bota usługi" },
  botOk: { ru: "Вебхук бота поставлен", uz: "Bot vebxuki o‘rnatildi", pl: "Webhook bota ustawiony" },
  botNoBusiness: {
    ru: "Business Mode у бота выключен: включите в @BotFather → Bot Settings → Business Mode.",
    uz: "Botda Business Mode o‘chiq: @BotFather → Bot Settings → Business Mode da yoqing.",
    pl: "Business Mode bota jest wyłączony: włącz w @BotFather → Bot Settings → Business Mode.",
  },
  botFail: { ru: "Бот не подключён", uz: "Bot ulanmadi", pl: "Bot niepodłączony" },
  clients: { ru: "Клиенты", uz: "Mijozlar", pl: "Klienci" },
  none: { ru: "Клиентов пока нет.", uz: "Hozircha mijozlar yo‘q.", pl: "Na razie brak klientów." },
  plan: { ru: "Тариф", uz: "Tarif", pl: "Plan" },
  until: { ru: "Срок", uz: "Muddat", pl: "Termin" },
  dialogs: { ru: "Диалоги", uz: "Suhbatlar", pl: "Dialogi" },
  leads: { ru: "Заявки", uz: "Arizalar", pl: "Zgłoszenia" },
  cost: { ru: "Себестоимость", uz: "Tannarx", pl: "Koszt" },
  perDialog: { ru: "за диалог", uz: "bir suhbat uchun", pl: "na dialog" },
  margin: { ru: "Маржа", uz: "Marja", pl: "Marża" },
  channels: { ru: "Каналы", uz: "Kanallar", pl: "Kanały" },
  status: { ru: "Статус", uz: "Holat", pl: "Status" },
  active: { ru: "работает", uz: "ishlayapti", pl: "działa" },
  paused: { ru: "пауза", uz: "pauza", pl: "pauza" },
  blocked: { ru: "заблокирован", uz: "bloklangan", pl: "zablokowany" },
  markPaid: { ru: "Отметить оплату", uz: "To‘lovni belgilash", pl: "Zaznacz płatność" },
  months: { ru: "Месяцев", uz: "Oylar", pl: "Miesięcy" },
  amount: { ru: "Сумма, сум", uz: "Summa, so‘m", pl: "Kwota, UZS" },
  method: { ru: "Способ", uz: "Usul", pl: "Sposób" },
  invoice: { ru: "счёт", uz: "hisob", pl: "faktura" },
  cash: { ru: "наличные", uz: "naqd", pl: "gotówka" },
  card: { ru: "перевод на карту", uz: "kartaga o‘tkazma", pl: "przelew na kartę" },
  save: { ru: "Сохранить", uz: "Saqlash", pl: "Zapisz" },
  setStatus: { ru: "Сменить статус", uz: "Holatni o‘zgartirish", pl: "Zmień status" },
  openCabinet: { ru: "Открыть кабинет", uz: "Kabinetni ochish", pl: "Otwórz panel klienta" },
  showcase: { ru: "Демо на странице сервиса", uz: "Xizmat sahifasidagi demo", pl: "Demo na stronie usługi" },
  makeShowcase: { ru: "Показывать как демо", uz: "Demo sifatida ko‘rsatish", pl: "Pokazuj jako demo" },
  isShowcase: { ru: "демо", uz: "demo", pl: "demo" },
  extendTrial: { ru: "Продлить пробный на 7 дней", uz: "Sinovni 7 kunga uzaytirish", pl: "Przedłuż okres próbny o 7 dni" },
  month: { ru: "За этот месяц", uz: "Shu oy uchun", pl: "W tym miesiącu" },
  totalCost: { ru: "Расход модели всего", uz: "Jami model sarfi", pl: "Łączne zużycie modelu" },
  revenue: { ru: "Выручка по тарифам", uz: "Tariflar bo‘yicha tushum", pl: "Przychód z planów" },
});
