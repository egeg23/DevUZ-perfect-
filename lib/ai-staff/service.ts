import { ASK_MANAGER, HUMAN_WILL_ANSWER, TEXT_PLEASE, TOO_LONG, disclosure, handedOff } from "@/lib/ai-staff/copy";
import { newRequestNo } from "@/lib/ai-staff/crypto";
import { runSalesTurn, type ModelCall, type Turn } from "@/lib/ai-staff/engine";
import { isWorkTime } from "@/lib/ai-staff/hours";
import { talkLang, type Lang } from "@/lib/ai-staff/lang";
import { sendHtml } from "@/lib/ai-staff/telegram";
import { sendLeadCard, stopNotice } from "@/lib/ai-staff/notify";
import { MAX_AI_REPLIES_PER_TALK, PLANS, modelFor, monthKey, stopReason, usageSite, type Stop } from "@/lib/ai-staff/plans";
import * as store from "@/lib/ai-staff/store";
import { appSecret } from "@/lib/secrets";

/**
 * Входящее сообщение покупателя → ответ ИИ. Один путь на все каналы:
 * Telegram Business, бот клиента, виджет и проверка в кабинете.
 *
 * Канал знает только, как принять сообщение и как отправить ответ. Всё
 * остальное здесь: работает ли клиент (тариф, срок, лимит), не ведёт ли
 * разговор человек, нерабочее ли время, ход движка, заявка и уведомление.
 *
 * ИИ первым не пишет никогда: сюда приходят только входящие.
 */

/** Сколько ИИ молчит в чате Business после того, как владелец написал сам. */
export const HUMAN_HOLD_MS = 12 * 60 * 60 * 1000;

export type Incoming = {
  tenantId: string;
  channel: store.Channel | null;
  kind: store.ConversationKind;
  chatKey: string;
  text: string;
  /** Голосовое, фото, файл без подписи — модели не отдаём. */
  media?: boolean;
  customer: { name: string; handle: string | null };
  /** Когда покупатель отправил — для скорости первого ответа. */
  sentAt?: Date;
};

export type Outcome =
  | { kind: "reply"; text: string; lead?: store.Lead }
  | { kind: "silent"; why: "human" | "work_hours" | "disabled" | "duplicate" }
  | { kind: "stopped"; why: Stop; text: string | null };

/** Разговоры одного чата идут по очереди: два сообщения подряд не перезапишут друг друга. */
const locks = new Map<string, Promise<unknown>>();

function serial<T>(key: string, job: () => Promise<T>): Promise<T> {
  const before = locks.get(key) ?? Promise.resolve();
  const run = before.catch(() => undefined).then(job);
  locks.set(key, run);
  run.finally(() => {
    if (locks.get(key) === run) locks.delete(key);
  }).catch(() => undefined);
  return run;
}

export type Deps = { call?: ModelCall; now?: () => Date; botToken?: () => Promise<string | null> };

export function handleIncoming(input: Incoming, deps: Deps = {}): Promise<Outcome> {
  return serial(`${input.tenantId}:${input.kind}:${input.chatKey}`, () => handle(input, deps));
}

export const botToken = () => appSecret("AI_STAFF_BOT_TOKEN");

async function handle(input: Incoming, deps: Deps): Promise<Outcome> {
  const now = deps.now?.() ?? new Date();
  const tenant = await store.tenantById(input.tenantId);
  const employee = await store.salesEmployee(input.tenantId);
  if (!tenant || !employee || !employee.enabled) return { kind: "silent", why: "disabled" };

  const conv = await store.openConversation(tenant.id, {
    kind: input.kind,
    chatKey: input.chatKey,
    channelId: input.channel?.id ?? null,
    customerName: input.customer.name,
    customerHandle: input.customer.handle,
    lang: tenant.locale,
  });

  const customerTurn: Turn = { role: "customer", text: input.media && !input.text ? "[голосовое, фото или файл]" : input.text.slice(0, 2000), at: now.toISOString() };
  const messages: Turn[] = [...(conv.messages ?? []), customerTurn];
  const lang: Lang = talkLang(messages.filter((t) => t.role === "customer").map((t) => t.text), tenant.locale);
  const month = monthKey(now);
  const base: store.ConversationPatch = { messages, last_at: now.toISOString(), lang };

  // Человек ведёт разговор сам — ИИ молчит, пока не выйдет срок перехвата.
  if (conv.mode === "human") {
    const until = conv.human_until ? Date.parse(conv.human_until) : Infinity;
    if (until > now.getTime()) {
      await store.saveConversation(tenant.id, conv.id, base);
      return { kind: "silent", why: "human" };
    }
    Object.assign(base, { mode: "ai", human_until: null });
  }

  // Днём в Business и Instagram отвечают люди клиента — если клиент так
  // выбрал. В боте и виджете человеку ответить неоткуда, там ИИ работает всегда.
  const workTime = isWorkTime(tenant.work_hours, now);
  if ((input.kind === "tg_business" || input.kind === "instagram") && tenant.answer_mode === "off_hours" && workTime) {
    await store.saveConversation(tenant.id, conv.id, base);
    return { kind: "silent", why: "work_hours" };
  }

  // Тариф, срок, лимит. Проверка в кабинете работает всегда: настроить ИИ
  // до оплаты — нормальный порядок. Уже посчитанный в этом месяце диалог
  // доводится до конца, даже если он был последним по лимиту.
  if (input.kind !== "test") {
    const counted = conv.counted_month === month;
    const dialogs = await store.dialogsInMonth(tenant.id, month);
    const stop = stopReason(tenant, counted ? Math.min(dialogs, PLANS[tenant.plan].dialogs - 1) : dialogs, now);
    if (stop) return stopped(tenant, conv, base, messages, lang, stop, now, deps);
  }

  const aiTurns = messages.filter((t) => t.role === "ai");
  if (conv.ai_replies >= MAX_AI_REPLIES_PER_TALK) {
    const text = TOO_LONG[lang];
    const said = aiTurns.at(-1)?.text === text;
    await store.saveConversation(tenant.id, conv.id, {
      ...base,
      messages: said ? messages : [...messages, { role: "ai", text, at: now.toISOString() }],
      mode: "human",
      human_until: null,
    });
    return said ? { kind: "silent", why: "human" } : { kind: "reply", text };
  }

  const firstReply = aiTurns.length === 0;
  const intro = firstReply ? disclosure(lang, tenant.name || "", employee.name) : "";

  let text: string;
  let fallback = false;
  let lead: store.Lead | undefined;

  if (input.media && !input.text.trim()) {
    text = TEXT_PLEASE[lang];
  } else {
    const knowledge = await store.knowledge(tenant.id);
    const tier = employee.model_tier === "premium" || PLANS[tenant.plan].tier === "premium" ? "premium" : "standard";
    let result;
    try {
      result = await runSalesTurn({
        prompt: {
          company: tenant.name || "компания",
          niche: tenant.niche,
          assistantName: employee.name,
          tone: employee.tone,
          channel: input.kind,
          knowledge,
        },
        history: messages,
        lang,
        model: modelFor(tier),
        site: usageSite(tenant.id),
        call: deps.call,
      });
    } catch (error) {
      // Модель недоступна — покупатель не должен уйти в тишину.
      console.error("ai-staff: модель", (error as Error).message);
      result = { text: ASK_MANAGER[lang], handoff: null, fallback: true, problems: ["модель недоступна"] };
    }
    if (result.problems.length) console.error("ai-staff: проверка ответа", tenant.id, result.problems);
    text = result.text;
    fallback = result.fallback;

    if (result.handoff) {
      const existing = conv.lead_id ? await store.leadById(tenant.id, conv.lead_id) : null;
      if (existing) {
        if (!text) text = handedOff(lang, existing.request_no, existing.delivered);
      } else {
        const created = await store.createLead(tenant.id, {
          conversation_id: conv.id,
          request_no: newRequestNo(now),
          name: result.handoff.name || conv.customer_name,
          contact: result.handoff.contact || conv.customer_handle || "",
          need: result.handoff.need,
          budget: result.handoff.budget,
          urgency: result.handoff.urgency,
          summary: result.handoff.summary,
          reason: result.handoff.reason,
          channel: input.kind,
          test: input.kind === "test",
        });
        const offHours = !workTime;
        const delivered = await deliver(tenant, created, { ...conv, off_hours: offHours }, deps);
        if (delivered) await store.markLeadDelivered(tenant.id, created.id);
        lead = { ...created, delivered };
        base.lead_id = created.id;
        text = [text, handedOff(lang, created.request_no, delivered)].filter(Boolean).join("\n\n");
      }
    }
  }

  const full = [intro, text].filter(Boolean).join("\n\n");
  const sentAt = input.sentAt ?? now;
  await store.saveConversation(tenant.id, conv.id, {
    ...base,
    messages: [...messages, { role: "ai", text: full, at: now.toISOString(), ...(fallback ? { fallback: true } : {}) }],
    ai_replies: conv.ai_replies + 1,
    counted_month: input.kind === "test" ? conv.counted_month : month,
    unanswered: conv.unanswered + (fallback ? 1 : 0),
    ...(firstReply ? { first_reply_ms: Math.max(0, Date.now() - sentAt.getTime()), off_hours: !workTime } : {}),
  });
  return { kind: "reply", text: full, ...(lead ? { lead } : {}) };
}

async function deliver(tenant: store.Tenant, lead: store.Lead, conv: store.Conversation, deps: Deps): Promise<boolean> {
  try {
    const token = await (deps.botToken ?? botToken)();
    if (!token) return false;
    return await sendLeadCard(token, await store.members(tenant.id), lead, conv, tenant.locale);
  } catch (error) {
    console.error("ai-staff: заявка не ушла в Telegram", (error as Error).message);
    return false;
  }
}

async function stopped(
  tenant: store.Tenant,
  conv: store.Conversation,
  base: store.ConversationPatch,
  messages: Turn[],
  lang: Lang,
  why: Stop,
  now: Date,
  deps: Deps,
): Promise<Outcome> {
  // Покупателю — одно «менеджер ответит» на разговор, а не на каждое сообщение.
  const text = HUMAN_WILL_ANSWER[lang];
  const said = messages.some((t) => t.role === "ai" && t.text === text);
  await store.saveConversation(tenant.id, conv.id, {
    ...base,
    messages: said ? messages : [...messages, { role: "ai", text, at: now.toISOString() }],
  });

  // Людям клиента — раз в месяц: иначе каждое сообщение покупателя будило бы их.
  const noticed = tenant.limit_noticed_at && monthKey(new Date(tenant.limit_noticed_at)) === monthKey(now);
  if (!noticed) {
    await store.updateTenant(tenant.id, { limit_noticed_at: now.toISOString() });
    const token = await (deps.botToken ?? botToken)().catch(() => null);
    if (token) {
      for (const member of await store.members(tenant.id)) {
        if (member.role === "owner" || member.notify) await sendHtml(token, member.telegram_user_id, stopNotice(tenant, why));
      }
    }
  }
  return { kind: "stopped", why, text: said ? null : text };
}

/** Человек клиента ответил сам (Business, Instagram) — ИИ молчит в этом чате HUMAN_HOLD_MS. */
export async function humanReplied(
  input: { tenantId: string; chatKey: string; channel: store.Channel; text: string; kind?: "tg_business" | "instagram" },
  now = new Date(),
): Promise<void> {
  const kind = input.kind ?? "tg_business";
  await serial(`${input.tenantId}:${kind}:${input.chatKey}`, async () => {
    const conv = await store.openConversation(input.tenantId, {
      kind,
      chatKey: input.chatKey,
      channelId: input.channel.id,
      customerName: "",
      customerHandle: null,
      lang: "ru",
    });
    await store.saveConversation(input.tenantId, conv.id, {
      messages: [...(conv.messages ?? []), { role: "human", text: input.text.slice(0, 2000), at: now.toISOString() }],
      mode: "human",
      human_until: new Date(now.getTime() + HUMAN_HOLD_MS).toISOString(),
      last_at: now.toISOString(),
    });
  });
}
