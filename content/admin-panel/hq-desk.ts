import { defineDict } from "@/lib/admin/i18n";

/** Верхний ряд «Главной» по эталону «DevUz Офис» (components/admin/hq-desk.tsx). */
export const hqDeskDict = defineDict({
  inbox: { ru: "Входящие", uz: "Kiruvchi", pl: "Skrzynka" },
  live: { ru: "Сейчас", uz: "Hozir", pl: "Teraz" },
  allInbox: { ru: "Все входящие", uz: "Barcha kiruvchilar", pl: "Cała skrzynka" },
  inboxEmpty: {
    ru: "Никто не ждёт ответа: модель ведёт разговоры сама. Ответ клиента, которому нужен человек, появится здесь.",
    uz: "Hech kim javob kutmayapti: model suhbatlarni o‘zi olib boradi. Odam kerak bo‘lgan mijoz javobi shu yerda chiqadi.",
    pl: "Nikt nie czeka na odpowiedź: AI prowadzi rozmowy sama. Odpowiedź klienta, która wymaga człowieka, pojawi się tutaj.",
  },
  today: { ru: "Сегодня", uz: "Bugun", pl: "Dziś" },
  newLeads: { ru: "Новые лиды за 7 дней", uz: "7 kunda yangi lidlar", pl: "Nowe leady w 7 dni" },
  replies: { ru: "Ответили за 7 дней", uz: "7 kunda javob berdi", pl: "Odpisali w 7 dni" },
  touchesToday: { ru: "Касаний сегодня", uz: "Bugungi aloqalar", pl: "Kontakty dziś" },
  activity: { ru: "Касания по дням", uz: "Kunlar bo‘yicha aloqalar", pl: "Kontakty według dni" },
  days7: { ru: "7 дней", uz: "7 kun", pl: "7 dni" },
  vsPrev: {
    ru: "к 7 дням до этого",
    uz: "oldingi 7 kunga nisbatan",
    pl: "wobec 7 dni wcześniej",
  },
  ofNorm: {
    ru: (n: number) => `из ${n}`,
    uz: (n: number) => `${n} dan`,
    pl: (n: number) => `z ${n}`,
  },
});
