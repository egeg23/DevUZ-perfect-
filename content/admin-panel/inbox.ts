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
  // Три колонки по эталону «DevUz Офис» (03.11.2026): список, переписка, карточка клиента.
  conversations: { ru: "Переписки", uz: "Yozishmalar", pl: "Rozmowy" },
  count: {
    ru: (n: number) => `Ждут ответа: ${n}`,
    uz: (n: number) => `Javob kutmoqda: ${n}`,
    pl: (n: number) => `Czeka na odpowiedź: ${n}`,
  },
  waitingNow: { ru: "Сейчас", uz: "Hozir", pl: "Teraz" },
  back: { ru: "← Все переписки", uz: "← Barcha yozishmalar", pl: "← Wszystkie rozmowy" },
  pick: {
    ru: "Выберите переписку слева — здесь будет разговор и поле ответа.",
    uz: "Chapdan yozishmani tanlang — bu yerda suhbat va javob maydoni chiqadi.",
    pl: "Wybierz rozmowę po lewej — tu pojawi się wątek i pole odpowiedzi.",
  },
  botOnlyLast: {
    ru: "Вся переписка с ботом — в Telegram, в «📩 Обращение в бота». Здесь — последнее сообщение клиента.",
    uz: "Bot bilan butun yozishma — Telegramda, bot xabarlarida. Bu yerda — mijozning oxirgi xabari.",
    pl: "Cała rozmowa z botem jest w Telegramie, w wiadomościach bota. Tu — ostatnia wiadomość klienta.",
  },
  noLines: {
    ru: "Реплик не нашлось — откройте касание, там вся история.",
    uz: "Replikalar topilmadi — aloqani oching, butun tarix o‘sha yerda.",
    pl: "Nie znaleziono wiadomości — otwórz kontakt, tam jest cała historia.",
  },
  fromClient: { ru: "Клиент", uz: "Mijoz", pl: "Klient" },
  fromUs: { ru: "Мы", uz: "Biz", pl: "My" },
  fromAi: { ru: "ИИ-сотрудник", uz: "SI xodim", pl: "Pracownik AI" },
  queued: { ru: "ждёт отправки", uz: "yuborilishini kutmoqda", pl: "czeka na wysłanie" },
  failedLine: { ru: "не ушло", uz: "ketmadi", pl: "nie wysłano" },
  suggestTitle: { ru: "Подсказка ответа", uz: "Javob maslahati", pl: "Podpowiedź odpowiedzi" },
  suggestWhy: {
    ru: "Готовый ответ на это возражение — из «Ответов на возражения». Поправьте под клиента и отправьте.",
    uz: "Bu e’tirozga tayyor javob — «E’tirozlarga javoblar»dan. Mijozga moslab, yuboring.",
    pl: "Gotowa odpowiedź na ten zarzut — z «Odpowiedzi na zastrzeżenia». Popraw pod klienta i wyślij.",
  },
  insert: { ru: "Вставить в ответ", uz: "Javobga qo‘yish", pl: "Wstaw do odpowiedzi" },
  client: { ru: "Клиент", uz: "Mijoz", pl: "Klient" },
  deal: { ru: "Ход сделки", uz: "Bitim bosqichlari", pl: "Przebieg transakcji" },
  dealNone: {
    ru: "Ступеней пока нет — появятся, когда клиент ответит или получит макет.",
    uz: "Hozircha bosqichlar yo‘q — mijoz javob berganda yoki maket olganda chiqadi.",
    pl: "Etapów jeszcze nie ma — pojawią się, gdy klient odpisze albo dostanie makietę.",
  },
  site: { ru: "Сайт", uz: "Sayt", pl: "Strona" },
  account: { ru: "Пишем с", uz: "Qayerdan yozamiz", pl: "Piszemy z" },
});
