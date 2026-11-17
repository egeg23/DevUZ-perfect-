/**
 * Бот Claudery: ведёт клиента по пути из настроек (lib/claudery/scenario.ts).
 *
 * Владелец, 17.11.2026: «Телеграм бот по помощи пользователям удаленно.
 * Название — Claudery… бот для приема заявок на помощь пользователям одной
 * кнопкой»; «заявки будут падать в общий пул лидов к нам, просто другой
 * посыл у самого бота». Оплата — «через Platega, как у AI-юриста»:
 * оплату подтверждает Platega, а не слова клиента; неоплаченная заявка —
 * тоже лид («цена названа»), чтобы менеджер мог дожать. Бот только
 * по-русски: «бот только на рф аудиторию будет работать».
 *
 * Здесь только решения; Telegram, база и Platega — в зависимостях
 * (lib/claudery/store.ts), чтобы ход бота проверялся тестом без сети.
 */
import { PAY_PURPOSE, rub, scenarioOf, stepOf, type Scenario, type Setup, type Step } from "@/lib/claudery/scenario";

export type Row = { text: string; data?: string; url?: string }[];

export type Flow = {
  step: string;
  problem?: string;
  photo?: string;
  leadId?: string | null;
  requestNo?: string;
  pay?: { txn: string; url: string; amount: number; status: "pending" | "paid" | "failed" };
};

export type Who = { chatId: number; username?: string | null; name: string };

export type Deps = {
  setup: () => Promise<Setup>;
  flowOf: (chatId: number) => Promise<Flow | null>;
  saveFlow: (chatId: number, flow: Flow) => Promise<void>;
  send: (chatId: number, text: string, rows?: Row[]) => Promise<void>;
  answer: (callbackId: string, text?: string) => Promise<void>;
  /** Заявка в общий пул: saveLead + routeNewLead. Повторно не заводит. */
  lead: (who: Who, flow: Flow, amount: number) => Promise<{ leadId: string | null; requestNo: string }>;
  invoice: (flow: Flow, amount: number, purpose: string) => Promise<{ txn: string; url: string } | null>;
  /** Статус у Platega; «paid» — оплачено (и лид отмечен). */
  paid: (who: Who, flow: Flow) => Promise<"paid" | "pending" | "failed">;
};

export const T = {
  payBtn: (a: string) => `💳 Оплатить ${a}`,
  check: "✅ Я оплатил — проверить",
  offer: "📄 Оферта",
  notYet: "Оплата пока не пришла. Если вы уже оплатили, подождите минуту и нажмите ещё раз: подтверждение приходит от платёжной системы.",
  failed: "Платёж не прошёл. Попробуйте ещё раз по новой ссылке.",
  noPay: "Сейчас не получается выставить счёт. Заявку мы записали, специалист напишет вам и пришлёт ссылку на оплату.",
  needText: "Напишите, пожалуйста, текстом, что случилось (можно со скриншотом).",
} as const;

export const CB = { step: "s:", check: "p:check" } as const;

function rows(step: Step): Row[] {
  return step.buttons.map((b) => [b.url ? { text: b.label, url: b.url } : { text: b.label, data: CB.step + b.to }]);
}

/** Показать шаг. Шаг «pay» заводит заявку и выставляет счёт здесь же. */
export async function show(who: Who, flow: Flow, s: Scenario, deps: Deps, offerUrl: string, depth = 0): Promise<void> {
  const step = stepOf(s, flow.step) ?? stepOf(s, s.start)!;
  flow.step = step.id;

  if (step.kind === "pay") {
    const amount = step.amount ?? 5000;
    if (flow.pay?.status === "paid" && step.next && depth < 3) {
      // Уже оплачено — сразу дальше, второго счёта нет.
      flow.step = step.next;
      return show(who, flow, s, deps, offerUrl, depth + 1);
    }
    const lead = await deps.lead(who, flow, amount);
    flow.leadId = lead.leadId;
    flow.requestNo = lead.requestNo;
    if (!flow.pay || flow.pay.status === "failed" || flow.pay.amount !== amount) {
      const inv = await deps.invoice(flow, amount, PAY_PURPOSE);
      flow.pay = inv ? { ...inv, amount, status: "pending" } : undefined;
    }
    await deps.saveFlow(who.chatId, flow);
    if (!flow.pay) {
      await deps.send(who.chatId, T.noPay);
      return;
    }
    await deps.send(who.chatId, step.text, [
      [{ text: T.payBtn(rub(amount)), url: flow.pay.url }],
      [{ text: T.check, data: CB.check }],
      [{ text: T.offer, url: offerUrl }],
    ]);
    return;
  }

  await deps.saveFlow(who.chatId, flow);
  await deps.send(who.chatId, step.text, rows(step));
}

export type Incoming =
  | { type: "text"; text: string }
  | { type: "photo"; fileId: string; caption: string }
  | { type: "button"; data: string; callbackId: string };

/** Один шаг разговора. */
export async function handle(who: Who, input: Incoming, deps: Deps, offerUrl: string): Promise<void> {
  const s = scenarioOf(await deps.setup());
  const flow: Flow = (await deps.flowOf(who.chatId)) ?? { step: s.start };

  if (input.type === "text" && /^\/start\b/.test(input.text.trim())) {
    // Новый круг: оплаченный счёт и заявка остаются в базе, разговор — заново.
    return show(who, { step: s.start }, s, deps, offerUrl);
  }

  if (input.type === "button") {
    await deps.answer(input.callbackId);
    if (input.data === CB.check) {
      if (!flow.pay) return show(who, flow, s, deps, offerUrl);
      const state = await deps.paid(who, flow);
      if (state === "paid") {
        flow.pay.status = "paid";
        const step = stepOf(s, flow.step);
        if (step?.kind === "pay" && step.next) flow.step = step.next;
        return show(who, flow, s, deps, offerUrl);
      }
      if (state === "failed") {
        flow.pay.status = "failed";
        await deps.send(who.chatId, T.failed);
        return show(who, flow, s, deps, offerUrl);
      }
      await deps.send(who.chatId, T.notYet);
      return;
    }
    if (input.data.startsWith(CB.step)) {
      const to = input.data.slice(CB.step.length);
      if (stepOf(s, to)) flow.step = to;
      return show(who, flow, s, deps, offerUrl);
    }
    return;
  }

  // Текст или фото ждём только на шаге «что случилось».
  const step = stepOf(s, flow.step);
  if (step?.kind === "ask") {
    const text = (input.type === "text" ? input.text : input.caption).trim().slice(0, 2000);
    if (input.type === "photo") flow.photo = input.fileId;
    if (!text && !flow.problem) {
      await deps.saveFlow(who.chatId, flow);
      await deps.send(who.chatId, T.needText);
      return;
    }
    if (text) flow.problem = flow.problem ? `${flow.problem}\n${text}`.slice(0, 2000) : text;
    flow.step = step.next ?? s.start;
    return show(who, flow, s, deps, offerUrl);
  }
  // Вне вопроса — показать, где человек сейчас.
  return show(who, flow, s, deps, offerUrl);
}
