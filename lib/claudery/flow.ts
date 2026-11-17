/**
 * Бот Claudery: ходит по шагам сценария (lib/claudery/scenario.ts).
 *
 * Владелец, 17.11.2026: «Телеграм бот по помощи пользователям удаленно.
 * Название — Claudery… бот для приема заявок на помощь пользователям одной
 * кнопкой»; «заявки будут падать в общий пул лидов к нам, просто другой
 * посыл у самого бота». Оплата — «через Platega, как у AI-юриста»:
 * оплату подтверждает Platega, а не слова клиента; неоплаченная заявка —
 * тоже лид («цена названа»), чтобы менеджер мог дожать.
 *
 * Здесь только решения; Telegram, база и Platega — в зависимостях
 * (lib/claudery/store.ts), чтобы ход бота проверялся тестом без сети.
 */
import { LANGS, PAY_PURPOSE, rub, stepOf, type Lang, type Scenario, type Step } from "@/lib/claudery/scenario";

export type Row = { text: string; data?: string; url?: string }[];

export type Flow = {
  step: string;
  lang: Lang;
  problem?: string;
  photo?: string;
  leadId?: string | null;
  requestNo?: string;
  pay?: { txn: string; url: string; amount: number; status: "pending" | "paid" | "failed" };
};

export type Who = { chatId: number; username?: string | null; name: string; languageCode?: string | null };

export type Deps = {
  scenario: () => Promise<Scenario>;
  flowOf: (chatId: number) => Promise<Flow | null>;
  saveFlow: (chatId: number, flow: Flow) => Promise<void>;
  send: (chatId: number, text: string, rows?: Row[]) => Promise<void>;
  answer: (callbackId: string, text?: string) => Promise<void>;
  /** Заявка в общий пул: saveLead + routeNewLead. Повторно не заводит. */
  lead: (who: Who, flow: Flow, why: "priced" | "manual", amount?: number) => Promise<{ leadId: string | null; requestNo: string }>;
  invoice: (flow: Flow, amount: number, purpose: string) => Promise<{ txn: string; url: string } | null>;
  /** Статус у Platega; true — оплачено (и лид отмечен). */
  paid: (who: Who, flow: Flow) => Promise<"paid" | "pending" | "failed">;
};

export const T = {
  lang: { ru: "🇺🇿 O‘zbekcha", uz: "🇷🇺 Русский" },
  payBtn: { ru: (a: string) => `💳 Оплатить ${a}`, uz: (a: string) => `💳 To‘lash ${a}` },
  check: { ru: "✅ Я оплатил — проверить", uz: "✅ To‘ladim — tekshirish" },
  offer: { ru: "📄 Оферта", uz: "📄 Oferta" },
  notYet: {
    ru: "Оплата пока не пришла. Если вы уже оплатили, подождите минуту и нажмите ещё раз: подтверждение приходит от платёжной системы.",
    uz: "To‘lov hali kelmadi. Agar to‘lagan bo‘lsangiz, bir daqiqa kutib, yana bosing: tasdiq to‘lov tizimidan keladi.",
  },
  failed: {
    ru: "Платёж не прошёл. Попробуйте ещё раз по новой ссылке.",
    uz: "To‘lov o‘tmadi. Yangi havola orqali qayta urinib ko‘ring.",
  },
  noPay: {
    ru: "Сейчас не получается выставить счёт. Заявку мы записали, специалист напишет вам и пришлёт ссылку на оплату.",
    uz: "Hozir hisob chiqarib bo‘lmayapti. Arizangiz yozib olindi, mutaxassis sizga yozib, to‘lov havolasini yuboradi.",
  },
  needText: {
    ru: "Напишите, пожалуйста, текстом, что случилось (можно со скриншотом).",
    uz: "Iltimos, nima bo‘lganini matn bilan yozing (skrinshot bilan ham bo‘ladi).",
  },
} as const;

export const CB = { step: "s:", lang: "l:", check: "p:check" } as const;

export function langOf(code?: string | null): Lang {
  return (code ?? "").toLowerCase().startsWith("uz") ? "uz" : "ru";
}

function rows(step: Step, lang: Lang, isStart: boolean): Row[] {
  const out: Row[] = step.buttons.map((b) => [b.url ? { text: b.label[lang], url: b.url } : { text: b.label[lang], data: CB.step + b.to }]);
  if (isStart) out.push([{ text: T.lang[lang], data: CB.lang + (lang === "ru" ? "uz" : "ru") }]);
  return out;
}

/** Показать шаг. Шаг «pay» и «lead» делают своё дело здесь же. */
export async function show(who: Who, flow: Flow, s: Scenario, deps: Deps, offerUrl: string, depth = 0): Promise<void> {
  const step = stepOf(s, flow.step) ?? stepOf(s, s.start)!;
  flow.step = step.id;
  const lang = flow.lang;

  if (step.kind === "pay") {
    const amount = step.amount ?? 5000;
    if (flow.pay?.status === "paid") {
      // Уже оплачено — сразу дальше, второго счёта нет.
      if (step.next && depth < 3) {
        flow.step = step.next;
        return show(who, flow, s, deps, offerUrl, depth + 1);
      }
    }
    const lead = await deps.lead(who, flow, "priced", amount);
    flow.leadId = lead.leadId;
    flow.requestNo = lead.requestNo;
    if (!flow.pay || flow.pay.status === "failed" || flow.pay.amount !== amount) {
      const inv = await deps.invoice(flow, amount, PAY_PURPOSE);
      flow.pay = inv ? { ...inv, amount, status: "pending" } : undefined;
    }
    await deps.saveFlow(who.chatId, flow);
    if (!flow.pay) {
      await deps.send(who.chatId, T.noPay[lang]);
      return;
    }
    await deps.send(who.chatId, step.text[lang], [
      [{ text: T.payBtn[lang](rub(amount)), url: flow.pay.url }],
      [{ text: T.check[lang], data: CB.check }],
      [{ text: T.offer[lang], url: offerUrl }],
      ...rows(step, lang, false),
    ]);
    return;
  }

  if (step.kind === "lead") {
    const lead = await deps.lead(who, flow, "manual");
    flow.leadId = lead.leadId;
    flow.requestNo = lead.requestNo;
  }
  await deps.saveFlow(who.chatId, flow);
  await deps.send(who.chatId, step.text[lang], rows(step, lang, step.id === s.start));
}

export type Incoming =
  | { type: "text"; text: string }
  | { type: "photo"; fileId: string; caption: string }
  | { type: "button"; data: string; callbackId: string };

/** Один шаг разговора. */
export async function handle(who: Who, input: Incoming, deps: Deps, offerUrl: string): Promise<void> {
  const s = await deps.scenario();
  const saved = await deps.flowOf(who.chatId);
  const flow: Flow = saved ?? { step: s.start, lang: langOf(who.languageCode) };
  if (!LANGS.includes(flow.lang)) flow.lang = "ru";

  if (input.type === "text" && /^\/start\b/.test(input.text.trim())) {
    // Новый круг: оплаченный счёт и заявка остаются в базе, разговор — заново.
    const fresh: Flow = { step: s.start, lang: saved?.lang ?? langOf(who.languageCode) };
    return show(who, fresh, s, deps, offerUrl);
  }

  if (input.type === "button") {
    await deps.answer(input.callbackId);
    if (input.data.startsWith(CB.lang)) {
      const lang = input.data.slice(CB.lang.length);
      if ((LANGS as readonly string[]).includes(lang)) flow.lang = lang as Lang;
      return show(who, flow, s, deps, offerUrl);
    }
    if (input.data === CB.check) {
      if (!flow.pay) return show(who, flow, s, deps, offerUrl);
      const state = await deps.paid(who, flow);
      if (state === "paid") {
        flow.pay.status = "paid";
        const step = stepOf(s, flow.step);
        flow.step = step?.kind === "pay" && step.next ? step.next : flow.step;
        return show(who, flow, s, deps, offerUrl);
      }
      if (state === "failed") {
        flow.pay.status = "failed";
        await deps.send(who.chatId, T.failed[flow.lang]);
        return show(who, flow, s, deps, offerUrl);
      }
      await deps.send(who.chatId, T.notYet[flow.lang]);
      return;
    }
    if (input.data.startsWith(CB.step)) {
      const to = input.data.slice(CB.step.length);
      if (stepOf(s, to)) flow.step = to;
      return show(who, flow, s, deps, offerUrl);
    }
    return;
  }

  // Текст или фото: ждём их только на шаге «ask».
  const step = stepOf(s, flow.step);
  if (step?.kind === "ask") {
    const text = (input.type === "text" ? input.text : input.caption).trim().slice(0, 2000);
    if (input.type === "photo") flow.photo = input.fileId;
    if (!text && !flow.problem) {
      await deps.saveFlow(who.chatId, flow);
      await deps.send(who.chatId, T.needText[flow.lang]);
      return;
    }
    if (text) flow.problem = flow.problem ? `${flow.problem}\n${text}`.slice(0, 2000) : text;
    flow.step = step.next ?? s.start;
    return show(who, flow, s, deps, offerUrl);
  }
  // Вне вопроса — показать, где человек сейчас.
  return show(who, flow, s, deps, offerUrl);
}
