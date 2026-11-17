/**
 * Настоящие зависимости бота Claudery (lib/claudery/flow.ts): Telegram со
 * своим токеном, сценарий и разговоры в stats_snapshots, оплата Platega,
 * заявка — тем же путём, что «Макет в боте»: saveLead + routeNewLead
 * (очередь тёплых лидов, ночное правило — там).
 *
 * Ключи — в хранилище секретов, не в .env и не в git:
 *  - `app.CLAUDERY_BOT_TOKEN` — токен бота из @BotFather (вставляют в панели);
 *  - `app.CLAUDERY_WEBHOOK_SECRET` — секрет между поллером и сайтом, заводится
 *    сам при «Проверить и настроить»;
 *  - `app.PLATEGA_MERCHANT_ID`, `app.PLATEGA_API_KEY` — те же, что у AI-юриста
 *    (egeg23/seller-ai, api/integrations/platega.py), вставляют в панели.
 *
 * Оплата. У магазина Platega один адрес уведомлений, и он смотрит на
 * AI-юриста; в самом платеже адреса уведомлений нет (POST
 * /transaction/process). Поэтому оплату мы не ждём уведомлением, а спрашиваем
 * у Platega сами: GET /transaction/{id} — по кнопке «Я оплатил» и свипом
 * (`checkClauderyPayments`). AI-юрист чужой номер платежа пропускает
 * («unknown_payment», ответ 200), так что наши оплаты ему не мешают.
 */
import { randomBytes } from "node:crypto";

import { record } from "@/lib/admin/audit";
import { routeNewLead } from "@/lib/admin/lead-queue-store";
import { wants } from "@/lib/admin/notify-prefs";
import { messageWindow } from "@/lib/admin/tasks";
import { FALLBACK_RUB_PER_USD, projectNote, usdOf, usdRateFromCbr } from "@/lib/claudery/money";
import { handle, show, type Deps, type Flow, type Incoming, type Who } from "@/lib/claudery/flow";
import { SETUP_KEY, parseSetup, rub, scenarioOf, stepOf, type Setup } from "@/lib/claudery/scenario";
import { roadFetch } from "@/lib/egress.mjs";
import { salesRecipients } from "@/lib/qualify/brief";
import { newRequestNo } from "@/lib/qualify/engine";
import { scoreLead } from "@/lib/qualify/scoring";
import { saveLead } from "@/lib/qualify/store";
import { esc, sendMessage, sendPhotoFile } from "@/lib/qualify/telegram";
import type { QualifyToolInput } from "@/lib/qualify/types";
import { appSecret, saveAppSecret } from "@/lib/secrets";
import { siteUrl } from "@/lib/seo";
import { serviceClient } from "@/lib/supabase";

export const CLAUDERY_SOURCE = "claudery";
export const TOKEN_KEY = "CLAUDERY_BOT_TOKEN";
export const SECRET_KEY = "CLAUDERY_WEBHOOK_SECRET";
export const PLATEGA_KEYS = ["PLATEGA_MERCHANT_ID", "PLATEGA_API_KEY"] as const;
export const OFFER_PATH = "/claudery/offer";
const PLATEGA = "https://app.platega.io";
/** СБП — так платят у AI-юриста (seller-ai, PAYMENT_METHODS.sbp). */
const METHOD_SBP = 2;
/** Сколько свип спрашивает Platega о неоплаченном счёте. */
export const PAY_WATCH_MS = 48 * 3600_000;
const PAY_PREFIX = "claudery-pay:";
const FLOW_PREFIX = "claudery-flow:";
const BOT_KEY = "claudery-bot";
const RATE_KEY = "claudery-usd-rate";
const CBR_DAILY = "https://www.cbr.ru/scripts/XML_daily.asp";

const offerUrl = () => `${siteUrl}${OFFER_PATH}`;

// ---------- Telegram со своим токеном ----------

async function tg<T = unknown>(method: string, payload: unknown, token?: string | null): Promise<T | null> {
  const key = token ?? (await appSecret(TOKEN_KEY));
  if (!key) return null;
  try {
    const res = await roadFetch(`https://api.telegram.org/bot${key}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20_000),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; result?: T };
    return data.ok ? (data.result ?? null) : null;
  } catch (error) {
    console.error(`claudery: ${method} не ушёл —`, error instanceof Error ? error.message : error);
    return null;
  }
}

async function sendToClient(chatId: number, text: string, rows?: { text: string; data?: string; url?: string }[][]) {
  await tg("sendMessage", {
    chat_id: chatId,
    text,
    link_preview_options: { is_disabled: true },
    ...(rows?.length
      ? { reply_markup: { inline_keyboard: rows.map((r) => r.map((b) => (b.url ? { text: b.text, url: b.url } : { text: b.text, callback_data: b.data }))) } }
      : {}),
  });
}

/** Скриншот клиента: скачать у бота Claudery (до 5 МБ). */
async function fileBytes(fileId: string): Promise<Uint8Array<ArrayBuffer> | null> {
  const token = await appSecret(TOKEN_KEY);
  const file = await tg<{ file_path?: string; file_size?: number }>("getFile", { file_id: fileId }, token);
  if (!token || !file?.file_path || (file.file_size ?? 0) > 5_000_000) return null;
  try {
    const res = await roadFetch(`https://api.telegram.org/file/bot${token}/${file.file_path}`, { signal: AbortSignal.timeout(30_000) });
    return res.ok ? new Uint8Array(await res.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

// ---------- База ----------

async function snapshot<T>(key: string): Promise<T | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("stats_snapshots").select("payload").eq("key", key).maybeSingle();
  return (data?.payload as T) ?? null;
}

async function putSnapshot(key: string, payload: unknown): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db.from("stats_snapshots").upsert({ key, payload, computed_at: new Date().toISOString() }, { onConflict: "key" });
}

export async function loadSetup(): Promise<Setup> {
  return parseSetup(await snapshot(SETUP_KEY).catch(() => null));
}

export async function saveSetup(s: Setup, staffId: string, ip: string | null): Promise<void> {
  await putSnapshot(SETUP_KEY, s);
  await record("claudery.scenario_saved", { actorStaffId: staffId, meta: { amount: s.amount, extras: s.extras.length }, ip });
}

type Pay = { chatId: number; leadId: string | null; requestNo: string; amount: number; status: "pending" | "paid" | "failed"; at: string; paidAt?: string; told?: boolean };

// ---------- Platega ----------

async function platega(): Promise<{ id: string; key: string } | null> {
  const [id, key] = await Promise.all(PLATEGA_KEYS.map((k) => appSecret(k)));
  return id && key ? { id, key } : null;
}

async function plategaCall(path: string, init: RequestInit = {}): Promise<Record<string, unknown> | null> {
  const keys = await platega();
  if (!keys) return null;
  try {
    const res = await roadFetch(`${PLATEGA}${path}`, {
      ...init,
      headers: { "X-MerchantId": keys.id, "X-Secret": keys.key, "content-type": "application/json", accept: "application/json" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      // Текст ошибки Platega в журнал не идёт: в нём бывают данные платежа.
      console.error(`claudery: Platega ${path.split("/")[1]} ответила ${res.status}`);
      return null;
    }
    return (await res.json().catch(() => null)) as Record<string, unknown> | null;
  } catch (error) {
    console.error("claudery: Platega не ответила —", error instanceof Error ? error.name : error);
    return null;
  }
}

/** Платёжная ссылка на сумму (СБП), назначение — «Claudery: удалённая помощь». */
async function invoice(flow: Flow, amount: number, purpose: string, chatId: number): Promise<{ txn: string; url: string } | null> {
  const txn = crypto.randomUUID();
  const bot = await snapshot<{ username?: string }>(BOT_KEY);
  const back = bot?.username ? `https://t.me/${bot.username}` : offerUrl();
  const data = await plategaCall("/transaction/process", {
    method: "POST",
    body: JSON.stringify({
      paymentMethod: METHOD_SBP,
      id: txn,
      paymentDetails: { amount, currency: "RUB" },
      description: flow.requestNo ? `${purpose}, заявка ${flow.requestNo}` : purpose,
      return: back,
      failedUrl: back,
      payload: JSON.stringify({ claudery: flow.requestNo ?? "" }),
    }),
  });
  const url = typeof data?.redirect === "string" ? data.redirect : null;
  if (!url) return null;
  const pay: Pay = { chatId, leadId: flow.leadId ?? null, requestNo: flow.requestNo ?? "", amount, status: "pending", at: new Date().toISOString() };
  await putSnapshot(PAY_PREFIX + txn, pay);
  return { txn, url };
}

/** Статус у Platega — единственный источник «оплачено». */
async function remoteStatus(txn: string): Promise<"paid" | "pending" | "failed" | null> {
  const data = await plategaCall(`/transaction/${encodeURIComponent(txn)}`);
  const s = String(data?.status ?? "").toUpperCase();
  if (!s) return null;
  if (s === "CONFIRMED") return "paid";
  if (s === "CANCELED" || s === "CHARGEBACKED") return "failed";
  return "pending";
}

// ---------- Лид ----------

export function clauderyLeadInput(who: Who, flow: Flow, amount: number): QualifyToolInput {
  const contact = who.username ? `@${who.username}` : `tg:${who.chatId}`;
  const request = [
    "Клиент Claudery (удалённая помощь с ИИ).",
    flow.problem ? `Что случилось: ${flow.problem}` : "Что случилось — не написал.",
    flow.photo ? "Приложил скриншот." : "",
    `Счёт Platega на ${rub(amount)} выставлен, оплаты пока нет.`,
  ]
    .filter(Boolean)
    .join(" ");
  const unknown = "не выяснено: заявка из бота Claudery, без диалога";
  return {
    contact_name: who.name,
    company: "",
    contact_handle: contact,
    contact_kind: "telegram",
    niche: "удалённая помощь с ИИ",
    niche_tier: 3,
    expertise: "low",
    services: ["consulting"],
    budget: "B3",
    authority: "A2",
    need: "N2",
    timing: "T1",
    intent: "needs_human",
    summary: { client: who.name || contact, request, niche: "удалённая помощь с ИИ", expertise: unknown, budget: unknown, authority: unknown, need: unknown, timing: unknown },
    notes: `${request} Написать клиенту в Telegram: ${contact}.`,
    opening_line: "Здравствуйте! Я специалист Claudery, вижу вашу заявку. Расскажите чуть подробнее, что именно не получается?",
    already_told: [],
    avoid_asking: [],
  };
}

async function lead(who: Who, flow: Flow, amount: number) {
  if (flow.leadId || flow.requestNo) return { leadId: flow.leadId ?? null, requestNo: flow.requestNo ?? "" };
  const scored = scoreLead(clauderyLeadInput(who, flow, amount), "ru");
  const requestNo = newRequestNo();
  const origin = { tgUsername: who.username ?? undefined, entryPath: "bot:claudery", entryRef: null };
  let leadId: string | null = null;
  try {
    leadId = await saveLead(scored, [], CLAUDERY_SOURCE, { requestNo, origin });
  } catch (error) {
    console.error("claudery: лид не записался", error);
  }
  const db = serviceClient();
  // «Цена названа» — ступень продажи: счёт выставлен (lib/admin/sales-stages.ts).
  if (db && leadId) await db.from("sales_marks").insert({ kind: "priced", lead_id: leadId });
  const heading = `🆘 <b>Claudery · помощь с ИИ</b> · счёт ${esc(rub(amount))} выставлен, оплаты пока нет. Оплатит — придёт строка «✅ оплачено».`;
  await routeNewLead({ leadId: leadId ?? "unsaved", lead: scored, requestNo, origin: { ...origin, source: CLAUDERY_SOURCE }, heading, fallback: await salesRecipients("claudery") }).catch((error) =>
    console.error("claudery: лид не разослан", error),
  );
  // Скриншот — тем, кто берёт заявки Claudery, днём (ночью бот молчит).
  if (flow.photo && messageWindow(new Date())) {
    const bytes = await fileBytes(flow.photo);
    if (bytes) for (const chat of await salesRecipients("claudery")) await sendPhotoFile(chat, bytes, "claudery.jpg", `📎 Скриншот к заявке Claudery ${requestNo}`);
  }
  return { leadId, requestNo };
}

/** Оплачено: лид помечается, команде строка (днём; ночью — утром свипом). */
async function markPaid(txn: string, pay: Pay): Promise<void> {
  if (pay.status === "paid") return;
  const db = serviceClient();
  const now = new Date();
  const next: Pay = { ...pay, status: "paid", paidAt: now.toISOString(), told: false };
  await putSnapshot(PAY_PREFIX + txn, next);
  if (db && pay.leadId) {
    const { data } = await db.from("leads").select("notes").eq("id", pay.leadId).maybeSingle();
    const mark = `✅ ОПЛАЧЕНО ${rub(pay.amount)} через Platega, ${now.toISOString().slice(0, 10)}.`;
    await db.from("leads").update({ notes: `${mark} ${String(data?.notes ?? "")}`.trim(), priority: "hot" }).eq("id", pay.leadId);
  }
  await record("claudery.paid", { targetType: "lead", targetId: pay.leadId, meta: { amount: pay.amount, requestNo: pay.requestNo } });
  await paidProject(pay, now).catch((error) => console.error("claudery: проект не заведён", error));
  await tellPaid(txn, next, now);
}

/** Курс доллара ЦБ РФ; не ответил — последний сохранённый, потом запасной. */
async function usdRate(): Promise<{ rate: number; source: "cbr" | "last" | "fallback" }> {
  try {
    const res = await roadFetch(CBR_DAILY, { signal: AbortSignal.timeout(10_000) });
    if (res.ok) {
      const rate = usdRateFromCbr(new TextDecoder("windows-1251").decode(await res.arrayBuffer()));
      if (rate) {
        await putSnapshot(RATE_KEY, { rate, at: new Date().toISOString() });
        return { rate, source: "cbr" };
      }
    }
  } catch (error) {
    console.error("claudery: ЦБ не ответил", error instanceof Error ? error.message : error);
  }
  const last = await snapshot<{ rate?: number }>(RATE_KEY);
  if (last?.rate && last.rate > 1) return { rate: last.rate, source: "last" };
  return { rate: FALLBACK_RUB_PER_USD, source: "fallback" };
}

/**
 * Оплата — проект с платежом (владелец, 17.11.2026: «Клиенты оплатившие сразу
 * должны учитываться в доходе и зарплате менеджера и в нашей статистике»):
 * доход, «Финансы», ступень «оплата». Ведущий — кто взял лид; лид ещё ничей —
 * проект без ведущего, и его получит тот, кто возьмёт лид (триггер в
 * 0189_claudery_projects.sql). Ведущему 40% с суммы (CLAUDERY_MANAGER_PERCENT).
 * Один лид — один проект (уникальный индекс).
 */
async function paidProject(pay: Pay, now: Date): Promise<void> {
  const db = serviceClient();
  if (!db || !pay.leadId) return;
  const { data: existing } = await db.from("projects").select("id").eq("lead_id", pay.leadId).eq("product", "claudery").maybeSingle();
  if (existing) return;
  const { data: lead } = await db.from("leads").select("contact_name, contact_handle, assigned_staff_id").eq("id", pay.leadId).maybeSingle();
  const { rate, source } = await usdRate();
  const usd = usdOf(pay.amount, rate);
  const day = now.toISOString().slice(0, 10);
  const client = String(lead?.contact_name || lead?.contact_handle || "клиент Claudery").slice(0, 120);
  const { data: project, error } = await db
    .from("projects")
    .insert({
      title: `Claudery · помощь с ИИ · ${pay.requestNo}`.slice(0, 200),
      client,
      lead_id: pay.leadId,
      owner_staff_id: (lead?.assigned_staff_id as string | null) ?? null,
      product: "claudery",
      kind: "new",
      stage: "build",
      amount_usd: usd,
      tax_percent: 0,
      dev_cost_usd: 0,
      started_at: day,
      notes: projectNote(rub(pay.amount), rate, source, day, pay.requestNo),
    })
    .select("id")
    .maybeSingle();
  if (error || !project) {
    console.error("claudery: проект не записался", error?.message);
    return;
  }
  await db.from("project_payments").insert({ project_id: project.id, amount_usd: usd, paid_on: day, purpose: "other", note: `Platega, ${rub(pay.amount)}` });
  await record("project.created", { targetType: "project", targetId: project.id as string, meta: { title: "Claudery", via: "claudery", amount_usd: usd } });
}

async function tellPaid(txn: string, pay: Pay, now: Date): Promise<void> {
  if (pay.told || !messageWindow(now)) return;
  const db = serviceClient();
  if (!db) return;
  const chats = new Set<number>();
  if (pay.leadId) {
    const { data } = await db.from("leads").select("assigned_staff_id").eq("id", pay.leadId).maybeSingle();
    if (data?.assigned_staff_id) {
      const { data: s } = await db.from("staff").select("telegram_user_id").eq("id", data.assigned_staff_id).maybeSingle();
      if (Number(s?.telegram_user_id)) chats.add(Number(s!.telegram_user_id));
    }
  }
  const { data: heads } = await db.from("staff").select("telegram_user_id, notify_off").eq("is_active", true).in("role", ["admin", "head"]);
  for (const h of heads ?? []) if (Number(h.telegram_user_id) && wants(h.notify_off as string[] | null, "reports")) chats.add(Number(h.telegram_user_id));
  const link = pay.leadId ? `\n${siteUrl}/admin/leads/${pay.leadId}` : "";
  for (const chat of chats) await sendMessage(chat, `✅ <b>Claudery: оплачено ${esc(rub(pay.amount))}</b> · заявка ${esc(pay.requestNo)}. Напишите клиенту в Telegram.${link}`);
  await putSnapshot(PAY_PREFIX + txn, { ...pay, told: true });
}

async function paid(who: Who, flow: Flow): Promise<"paid" | "pending" | "failed"> {
  if (!flow.pay) return "pending";
  const pay = await snapshot<Pay>(PAY_PREFIX + flow.pay.txn);
  if (pay?.status === "paid") return "paid";
  const state = await remoteStatus(flow.pay.txn);
  if (state === "paid" && pay) await markPaid(flow.pay.txn, pay);
  if (state === "failed" && pay) await putSnapshot(PAY_PREFIX + flow.pay.txn, { ...pay, status: "failed" });
  return state ?? "pending";
}

export function realDeps(chatId: number): Deps {
  return {
    setup: loadSetup,
    flowOf: (chatId) => snapshot<Flow>(FLOW_PREFIX + chatId),
    saveFlow: (chatId, flow) => putSnapshot(FLOW_PREFIX + chatId, flow),
    send: sendToClient,
    answer: async (id, text) => void (await tg("answerCallbackQuery", { callback_query_id: id, ...(text ? { text } : {}) })),
    lead,
    invoice: (flow, amount, purpose) => invoice(flow, amount, purpose, chatId),
    paid,
    paidBefore,
  };
}

/** Был ли у этого чата хоть один платёж, который Platega подтвердила. */
async function paidBefore(who: Who): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { data } = await db
    .from("stats_snapshots")
    .select("key")
    .like("key", `${PAY_PREFIX}%`)
    .eq("payload->>chatId", String(who.chatId))
    .eq("payload->>status", "paid")
    .limit(1);
  return (data?.length ?? 0) > 0;
}

// ---------- Вход из вебхука ----------

type TgUser = { id: number; username?: string; first_name?: string; last_name?: string; language_code?: string; is_bot?: boolean };
export type ClauderyUpdate = {
  update_id: number;
  message?: { chat: { id: number; type: string }; from?: TgUser; text?: string; caption?: string; photo?: { file_id: string }[]; document?: { file_id: string; mime_type?: string } };
  callback_query?: { id: string; from: TgUser; data?: string; message?: { chat: { id: number; type: string } } };
};

export async function handleClauderyUpdate(update: ClauderyUpdate): Promise<void> {
  const from = update.message?.from ?? update.callback_query?.from;
  const chat = update.message?.chat ?? update.callback_query?.message?.chat;
  // Только личка с человеком: группы и боты — мимо.
  if (!from || from.is_bot || !chat || chat.type !== "private") return;
  const who: Who = {
    chatId: chat.id,
    username: from.username ?? null,
    name: [from.first_name, from.last_name].filter(Boolean).join(" ").slice(0, 120),
  };
  let input: Incoming | null = null;
  const m = update.message;
  if (update.callback_query?.data) input = { type: "button", data: update.callback_query.data.slice(0, 64), callbackId: update.callback_query.id };
  else if (m?.photo?.length) input = { type: "photo", fileId: m.photo[m.photo.length - 1].file_id, caption: m.caption ?? "" };
  else if (m?.document?.mime_type?.startsWith("image/")) input = { type: "photo", fileId: m.document.file_id, caption: m.caption ?? "" };
  else if (m?.text) input = { type: "text", text: m.text.slice(0, 4000) };
  if (!input) return;
  await handle(who, input, realDeps(who.chatId), offerUrl());
}

// ---------- Свип: неоплаченные счета ----------

/**
 * Раз в проход: до 10 счетов не старше 48 часов спрашиваем у Platega. Оплачен —
 * лид помечается, клиенту — шаг «после оплаты». Строки команде, отложенные
 * ночью, уходят утром.
 */
export async function checkClauderyPayments(now: Date = new Date()): Promise<void> {
  const db = serviceClient();
  if (!db || !(await platega())) return;
  const since = new Date(now.getTime() - PAY_WATCH_MS).toISOString();
  const { data } = await db.from("stats_snapshots").select("key, payload").like("key", `${PAY_PREFIX}%`).gte("computed_at", since).limit(200);
  let asked = 0;
  for (const row of data ?? []) {
    const txn = String(row.key).slice(PAY_PREFIX.length);
    const pay = row.payload as Pay;
    if (pay.status === "paid") {
      if (!pay.told) await tellPaid(txn, pay, now);
      continue;
    }
    if (pay.status !== "pending" || asked >= 10) continue;
    asked += 1;
    const state = await remoteStatus(txn);
    if (state === "failed") await putSnapshot(PAY_PREFIX + txn, { ...pay, status: "failed" });
    if (state !== "paid") continue;
    await markPaid(txn, pay);
    // Клиенту — шаг после оплаты, как если бы он нажал «Я оплатил».
    const flow = await snapshot<Flow>(FLOW_PREFIX + pay.chatId);
    if (flow?.pay?.txn === txn) {
      const s = scenarioOf(await loadSetup());
      const step = stepOf(s, flow.step);
      flow.pay.status = "paid";
      if (step?.kind === "pay" && step.next) flow.step = step.next;
      await show({ chatId: pay.chatId, name: "" }, flow, s, realDeps(pay.chatId), offerUrl());
    }
  }
}

// ---------- Панель: ключи и проверка ----------

export type BotState = { token: boolean; secret: boolean; platega: boolean; username: string | null };

export async function botState(): Promise<BotState> {
  const [token, secret, pg, bot] = await Promise.all([appSecret(TOKEN_KEY), appSecret(SECRET_KEY), platega(), snapshot<{ username?: string }>(BOT_KEY).catch(() => null)]);
  return { token: Boolean(token), secret: Boolean(secret), platega: Boolean(pg), username: bot?.username ?? null };
}

/**
 * Сохранить вставленные ключи (пустое поле — не трогать) и проверить бота:
 * getMe, команда /start, секрет поллера — заводится сам, если его нет.
 * Значения ключей не уходят ни в журнал, ни в ответ.
 */
export async function saveKeysAndCheck(
  input: { token?: string; merchantId?: string; apiKey?: string },
  staffId: string,
  ip: string | null,
): Promise<"ok" | "bad_token" | "no_token" | "failed"> {
  const saved: string[] = [];
  const token = input.token?.trim();
  if (token) {
    if (!/^\d{5,15}:[A-Za-z0-9_-]{30,}$/.test(token)) return "bad_token";
    const me = await tg<{ username?: string }>("getMe", {}, token);
    if (!me?.username) return "bad_token";
    if (!(await saveAppSecret(TOKEN_KEY, token))) return "failed";
    saved.push(TOKEN_KEY);
  }
  if (input.merchantId?.trim() && (await saveAppSecret("PLATEGA_MERCHANT_ID", input.merchantId.trim().slice(0, 200)))) saved.push("PLATEGA_MERCHANT_ID");
  if (input.apiKey?.trim() && (await saveAppSecret("PLATEGA_API_KEY", input.apiKey.trim().slice(0, 500)))) saved.push("PLATEGA_API_KEY");
  if (!(await appSecret(SECRET_KEY))) {
    if (await saveAppSecret(SECRET_KEY, randomBytes(24).toString("hex"))) saved.push(SECRET_KEY);
  }
  if (saved.length) await record("claudery.key_saved", { actorStaffId: staffId, meta: { keys: saved }, ip });
  const current = await appSecret(TOKEN_KEY);
  if (!current) return "no_token";
  const me = await tg<{ username?: string }>("getMe", {}, current);
  if (!me?.username) return "bad_token";
  await putSnapshot(BOT_KEY, { username: me.username });
  await tg("setMyCommands", { commands: [{ command: "start", description: "Нужна помощь" }] }, current);
  return "ok";
}

/** Заявки и оплаты Claudery за 7 дней — строкой в панели. */
export async function clauderyWeek(now: Date = new Date()): Promise<{ leads: number; paid: number } | null> {
  const db = serviceClient();
  if (!db) return null;
  const since = new Date(now.getTime() - 7 * 86_400_000).toISOString();
  const [{ count }, { data }] = await Promise.all([
    db.from("leads").select("id", { count: "exact", head: true }).eq("source", CLAUDERY_SOURCE).gte("created_at", since),
    db.from("stats_snapshots").select("payload").like("key", `${PAY_PREFIX}%`).gte("computed_at", since).limit(500),
  ]);
  return { leads: count ?? 0, paid: (data ?? []).filter((r) => (r.payload as Pay).status === "paid").length };
}

