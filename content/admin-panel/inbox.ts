import { defineDict } from "@/lib/admin/i18n";

/** «Входящие» (app/admin/inbox, lib/admin/inbox.ts) — на языке сотрудника. */
export const inboxDict = defineDict({
  title: { ru: "Входящие", uz: "Kiruvchi", pl: "Skrzynka" },
  lead: {
    ru: "Всё, что ждёт ответа человека: дольше ждёт — выше. Ответ уходит прямо отсюда, тем же путём, что из карточки.",
    uz: "Odam javobini kutayotgan hammasi: ko‘proq kutgani — tepada. Javob shu yerdan, kartochkadagi yo‘l bilan ketadi.",
    pl: "Wszystko, co czeka na odpowiedź człowieka: kto dłużej czeka — wyżej. Odpowiedź idzie stąd, tą samą drogą co z karty.",
  },
  empty: {
    ru: "Никто не ждёт ответа. Модель ведёт свои разговоры сама, новые ответы появятся здесь.",
    uz: "Hech kim javob kutmayapti. Model o‘z suhbatlarini o‘zi olib boradi, yangi javoblar shu yerda chiqadi.",
    pl: "Nikt nie czeka na odpowiedź. AI prowadzi swoje rozmowy sama, nowe odpowiedzi pojawią się tutaj.",
  },
  offline: {
    ru: "База не отвечает — список может быть неполным.",
    uz: "Baza javob bermayapti — ro‘yxat to‘liq bo‘lmasligi mumkin.",
    pl: "Baza nie odpowiada — lista może być niepełna.",
  },
  kindTouch: { ru: "касание", uz: "aloqa", pl: "kontakt" },
  kindBot: { ru: "бот студии", uz: "studiya boti", pl: "bot studia" },
  waited: {
    ru: (m: number) => (m < 60 ? `ждёт ${m} мин` : m < 1440 ? `ждёт ${Math.floor(m / 60)} ч` : `ждёт ${Math.floor(m / 1440)} дн.`),
    uz: (m: number) => (m < 60 ? `${m} daqiqa kutmoqda` : m < 1440 ? `${Math.floor(m / 60)} soat kutmoqda` : `${Math.floor(m / 1440)} kun kutmoqda`),
    pl: (m: number) => (m < 60 ? `czeka ${m} min` : m < 1440 ? `czeka ${Math.floor(m / 60)} godz.` : `czeka ${Math.floor(m / 1440)} dn.`),
  },
  owner: {
    ru: (name: string) => `ведёт: ${name}`,
    uz: (name: string) => `olib bormoqda: ${name}`,
    pl: (name: string) => `prowadzi: ${name}`,
  },
  nobody: { ru: "ничей", uz: "hech kimniki", pl: "niczyj" },
  open: { ru: "Открыть карточку", uz: "Kartochkani ochish", pl: "Otwórz kartę" },
  openTouch: { ru: "Открыть касание", uz: "Aloqani ochish", pl: "Otwórz kontakt" },
  reply: { ru: "Ответить клиенту", uz: "Mijozga javob berish", pl: "Odpowiedz klientowi" },
  placeholder: { ru: "Ответ клиенту…", uz: "Mijozga javob…", pl: "Odpowiedź dla klienta…" },
  send: { ru: "Отправить", uz: "Yuborish", pl: "Wyślij" },
  sending: { ru: "Отправляю…", uz: "Yuborilmoqda…", pl: "Wysyłam…" },
  sent: { ru: "Ушло. Строка пропадёт, когда клиент получит ответ.", uz: "Ketdi. Mijoz javobni olganda qator yo‘qoladi.", pl: "Wysłano. Wiersz zniknie, gdy klient dostanie odpowiedź." },
  hintTouch: {
    ru: "Уйдёт с рабочего аккаунта касания; модель после этого молчит.",
    uz: "Aloqaning ish akkauntidan ketadi; shundan keyin model jim turadi.",
    pl: "Pójdzie z konta firmowego kontaktu; potem AI milczy.",
  },
  hintBot: {
    ru: "Уйдёт от бота студии; модель молчит ещё 7 дней.",
    uz: "Studiya botidan ketadi; model yana 7 kun jim turadi.",
    pl: "Pójdzie od bota studia; AI milczy jeszcze 7 dni.",
  },
  failed: { ru: "Не ушло — попробуйте ещё раз или откройте карточку.", uz: "Ketmadi — yana urinib ko‘ring yoki kartochkani oching.", pl: "Nie wysłano — spróbuj ponownie albo otwórz kartę." },
  freeLeads: {
    ru: (n: number) => `Новых заявок ждут, кто возьмёт: ${n}`,
    uz: (n: number) => `Yangi arizalar kim olishini kutmoqda: ${n}`,
    pl: (n: number) => `Nowe zgłoszenia czekają, aż ktoś je weźmie: ${n}`,
  },
});
