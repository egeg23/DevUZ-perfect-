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
 * Оплаты в самом боте нет (владелец, 17.11.2026: «Телеграм ругается и будет
 * блокировать ботов, которые принимают оплаты в обход stars… убрать кнопку
 * "оплатить" в боте, вынести контур оплаты на девуз… чтобы оплата
 * происходила с веб версии»): бот принимает заявку и даёт ссылку на её
 * страницу на сайте (`deps.order`), счёт Platega выставляется там.
 *
 * Здесь только решения; Telegram, база и Platega — в зависимостях
 * (lib/claudery/store.ts), чтобы ход бота проверялся тестом без сети.
 */
import { payText, repeatAmount, scenarioOf, stepOf, supportLinks, type Scenario, type Setup, type Step } from "@/lib/claudery/scenario";

export type Row = { text: string; data?: string; url?: string }[];

export type Flow = {
  step: string;
  problem?: string;
  photo?: string;
  leadId?: string | null;
  requestNo?: string;
  /** Страница заявки на сайте: там цена и оплата. */
  order?: { token: string; url: string; amount: number };
  /** Подписка, выбранная кнопкой «Купить» на витрине (`/start buy<номер>`). */
  pick?: { index: number; price: number };
  /** Ставит сервер, когда Platega подтвердила оплату на сайте. */
  pay?: { status: "pending" | "paid" | "failed" };
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
  /** Страница заявки на сайте (цена и оплата — там, не в боте). */
  order: (who: Who, flow: Flow, price: { amount: number; full: number; discount: number }) => Promise<{ token: string; url: string } | null>;
  /** Клиент уже хоть раз оплатил (Platega подтвердила) — ему скидка. */
  paidBefore: (who: Who) => Promise<boolean>;
};

export const T = {
  open: "📋 Открыть заказ",
  offer: "📄 Оферта",
  agreement: "📜 Пользовательское соглашение",
  privacy: "🔒 Политика конфиденциальности",
  support: "💬 Поддержка",
  noOrder: "Заказ мы записали. Напишем вам здесь, в Telegram.",
  needText: "Напишите, пожалуйста, текстом, какая нейросеть нужна (можно со скриншотом).",
} as const;

/** `check` — кнопка прежних сообщений («Я оплатил»): теперь просто показывает заявку. */
export const CB = { step: "s:", check: "p:check" } as const;

/** Параметр ссылки кнопки «Купить» на витрине: номер подписки в списке. */
export const BUY_START = /^\/start\s+buy(\d)$/;
export const buyStart = (index: number) => `buy${index}`;

function rows(step: Step): Row[] {
  return step.buttons.map((b) => [b.url ? { text: b.label, url: b.url } : { text: b.label, data: CB.step + b.to }]);
}

/**
 * Документы и поддержка — кнопками в боте всегда под рукой (Platega,
 * 19.11.2026: «документация должна быть постоянно доступна пользователю,
 * поэтому добавьте ее отдельными кнопками в бот или на сайт»). Адреса — рядом
 * с офертой: /claudery/terms, /claudery/privacy; поддержка — контакт из
 * конструктора, а e-mail (в кнопке Telegram mailto нельзя) — на витрине.
 */
export function docRows(s: Scenario, offerUrl: string): Row[] {
  const base = offerUrl.replace(/\/offer$/, "");
  const links = supportLinks(s.support);
  return [
    [
      { text: T.agreement, url: `${base}/terms` },
      { text: T.privacy, url: `${base}/privacy` },
    ],
    // Один контакт — «Поддержка», несколько — кнопка на каждого с его именем.
    ...links.map((l) => [{ text: links.length > 1 ? `${T.support} ${l.text}` : T.support, url: l.web ?? `${base}#support` }]),
  ];
}

/** Показать шаг. Шаг «pay» заводит заявку и выставляет счёт здесь же. */
export async function show(who: Who, flow: Flow, s: Scenario, deps: Deps, offerUrl: string, depth = 0): Promise<void> {
  const step = stepOf(s, flow.step) ?? stepOf(s, s.start)!;
  flow.step = step.id;

  if (step.kind === "pay") {
    const full = flow.pick?.price ?? step.amount ?? 5000;
    const discount = step.discount ?? 0;
    const amount = discount > 0 && (await deps.paidBefore(who)) ? repeatAmount(full, discount) : full;
    if (flow.pay?.status === "paid" && step.next && depth < 3) {
      // Уже оплачено — сразу дальше, второго счёта нет.
      flow.step = step.next;
      return show(who, flow, s, deps, offerUrl, depth + 1);
    }
    const lead = await deps.lead(who, flow, amount);
    flow.leadId = lead.leadId;
    flow.requestNo = lead.requestNo;
    if (!flow.order || flow.order.amount !== amount) {
      const made = await deps.order(who, flow, { amount, full, discount });
      flow.order = made ? { ...made, amount } : undefined;
    }
    await deps.saveFlow(who.chatId, flow);
    if (!flow.order) {
      await deps.send(who.chatId, T.noOrder);
      return;
    }
    await deps.send(who.chatId, payText(step.text, amount), [
      [{ text: T.open, url: flow.order.url }],
      [{ text: T.offer, url: offerUrl }],
      ...docRows(s, offerUrl),
    ]);
    return;
  }

  await deps.saveFlow(who.chatId, flow);
  await deps.send(who.chatId, step.text, step.id === s.start ? [...rows(step), ...docRows(s, offerUrl)] : rows(step));
}

export type Incoming =
  | { type: "text"; text: string }
  | { type: "photo"; fileId: string; caption: string }
  | { type: "button"; data: string; callbackId: string };

/** Один шаг разговора. */
export async function handle(who: Who, input: Incoming, deps: Deps, offerUrl: string): Promise<void> {
  const s = scenarioOf(await deps.setup());
  const flow: Flow = (await deps.flowOf(who.chatId)) ?? { step: s.start };

  // «Купить» на витрине: t.me/<бот>?start=buy<номер> — сразу заказ на эту подписку.
  const buy = input.type === "text" ? BUY_START.exec(input.text.trim()) : null;
  if (buy) {
    const setup = await deps.setup();
    const index = Number(buy[1]);
    const product = setup.products[index];
    const pay = s.steps.find((x) => x.kind === "pay");
    if (product && pay) return show(who, { step: pay.id, pick: { index, price: product.price }, problem: `Выбрано на сайте: ${product.title}` }, s, deps, offerUrl);
  }

  if (input.type === "text" && /^\/start\b/.test(input.text.trim())) {
    // Новый круг: оплаченный счёт и заявка остаются в базе, разговор — заново.
    return show(who, { step: s.start }, s, deps, offerUrl);
  }

  if (input.type === "button") {
    await deps.answer(input.callbackId);
    if (input.data === CB.check) return show(who, flow, s, deps, offerUrl);
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
