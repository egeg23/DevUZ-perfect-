import { defineDict } from "@/lib/admin/i18n";

/**
 * «Какие лиды присылать» (lib/admin/lead-kinds.ts) — в «Настройках» и в
 * «Команде». Названия самих видов — в LEAD_KIND_TITLE.
 */
export const leadKindsDict = defineDict({
  title: { ru: "Какие лиды присылать", uz: "Qaysi lidlarni yuborish", pl: "Jakie leady wysyłać" },
  note: {
    ru: "Снимите галочку — бот не пришлёт такие лиды, и очередь не будет их вам предлагать: они уйдут тем, у кого галочка стоит. Если такой вид не выбрал никто, лид придёт всем, как раньше, чтобы клиент не потерялся.",
    uz: "Belgini olib tashlang — bot bunday lidlarni yubormaydi va navbat ularni sizga taklif qilmaydi: ular belgisi turganlarga ketadi. Bu turni hech kim tanlamagan bo‘lsa, lid mijoz yo‘qolmasligi uchun avvalgidek hammaga keladi.",
    pl: "Odznacz — bot nie przyśle takich leadów, a kolejka nie będzie ci ich proponować: trafią do tych, którzy mają zaznaczone. Jeśli tego rodzaju nie wybrał nikt, lead przyjdzie do wszystkich jak dotąd, żeby klient nie przepadł.",
  },
  summaryAll: { ru: "Лиды · все виды", uz: "Lidlar · barcha turlar", pl: "Leady · wszystkie rodzaje" },
  summarySome: {
    ru: (on: number, all: number) => `Лиды · ${on} из ${all} видов`,
    uz: (on: number, all: number) => `Lidlar · ${all} turdan ${on} ta`,
    pl: (on: number, all: number) => `Leady · ${on} z ${all} rodzajów`,
  },
  forWhom: {
    ru: (name: string) => `Какие лиды присылать: ${name}`,
    uz: (name: string) => `Qaysi lidlarni yuborish: ${name}`,
    pl: (name: string) => `Jakie leady wysyłać: ${name}`,
  },
  save: { ru: "Сохранить", uz: "Saqlash", pl: "Zapisz" },
  unknown: {
    ru: "База не ответила — галочки покажем, когда она вернётся.",
    uz: "Baza javob bermadi — belgilarni u qaytganda ko‘rsatamiz.",
    pl: "Baza nie odpowiedziała — zaznaczenia pokażemy, gdy wróci.",
  },
  saved: {
    ru: "Сохранено: бот и очередь будут присылать только отмеченные виды лидов.",
    uz: "Saqlandi: bot va navbat faqat belgilangan turdagi lidlarni yuboradi.",
    pl: "Zapisano: bot i kolejka będą wysyłać tylko zaznaczone rodzaje leadów.",
  },
});
