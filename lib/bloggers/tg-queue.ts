import { tashkentMidnight, todayInTashkent } from "@/lib/admin/pulse";
import { MIN_GAP_MS, sendWindowOpen } from "@/lib/admin/outreach";
import { lastAccountSendAt, sentLastHour } from "@/lib/admin/outreach-queue";
import { bloggerSendsLastHour, lastBloggerSendAt } from "@/lib/bloggers/tg-sent";
import { replyLang } from "@/lib/admin/hello-first";
import { helloText, pitchLang, pitchText, settingsFrom, type PitchLang } from "@/lib/bloggers/rules";
import { notifyDesk } from "@/lib/bloggers/notify";
import { esc } from "@/lib/qualify/telegram";
import { siteUrl } from "@/lib/seo";
import { serviceClient } from "@/lib/supabase";

/**
 * ИИ-сотрудник «Блогеры» в Telegram — очередь, которую читает скаут
 * (scout/runner.mjs). Только база и пределы, как lib/admin/outreach-queue.ts.
 *
 * Правила те же, что у касаний компаний (CLAUDE.md, «Касание в два шага»):
 * первым уходит только «Здравствуйте», в окне отправки, не чаще предела в
 * час на аккаунт и не раньше паузы после его предыдущего сообщения — общих
 * с компаниями: Telegram ограничивает номер, а не очередь. Блогеры идут
 * после компаний (скаут спрашивает их, только когда компаний в очереди
 * нет) и по своей дневной квоте `tgDaily`, поэтому норму в 20 касаний
 * компаний не съедают. Ограниченный аккаунт скаут не спрашивает вовсе.
 *
 * Блогер ответил — следом уходит текст о партнёрской программе на языке
 * его ответа, с того же аккаунта, а команде — сообщение в бот.
 */

type Db = NonNullable<ReturnType<typeof serviceClient>>;

export type BloggerHello = { id: string; handle: string; target: string; hello: string };
export type BloggerReply = { id: string; target: string; fallback?: string; body: string; handle: string };

/** Можно ли сейчас этому аккаунту отправить «Здравствуйте» блогеру. Чистая функция — её держит тест. */
export function helloAllowed(input: {
  now: number;
  enabled: boolean;
  tgDaily: number;
  sentToday: number;
  /** Что этот аккаунт отправил за час — компаниям и блогерам вместе. */
  accountHour: number;
  cap: number;
  /** Последняя отправка этого аккаунта — кому угодно. */
  lastAt: number | null;
}): boolean {
  if (!input.enabled || !sendWindowOpen(input.now)) return false;
  if (input.sentToday >= input.tgDaily) return false;
  if (input.accountHour >= input.cap) return false;
  return !input.lastAt || input.now - input.lastAt >= MIN_GAP_MS;
}

async function settingsOf(db: Db) {
  const { data } = await db.from("blogger_settings").select("value").eq("key", "settings").maybeSingle();
  return settingsFrom(data?.value ?? null);
}

/**
 * Следующий блогер для «Здравствуйте» с этого аккаунта — или null.
 * Берётся условной отметкой ready → queued: два аккаунта одного блогера
 * не возьмут.
 */
export async function nextBloggerHello(
  now: number,
  account: string,
  cap: number,
): Promise<BloggerHello | null> {
  const db = serviceClient();
  if (!db) return null;
  const settings = await settingsOf(db);
  if (!settings.enabled || !sendWindowOpen(now)) return null;

  const dayStart = tashkentMidnight(todayInTashkent(new Date(now))).toISOString();
  const { count: sentToday } = await db
    .from("bloggers")
    .select("id", { count: "exact", head: true })
    .eq("channel", "telegram")
    .gte("contacted_at", dayStart);
  const [companies, bloggers, lastCompanyAt, lastBlogger] = await Promise.all([
    sentLastHour(now, account),
    bloggerSendsLastHour(now, account),
    lastAccountSendAt(account),
    lastBloggerSendAt(account),
  ]);
  const lastAt = Math.max(lastCompanyAt ?? 0, lastBlogger ?? 0) || null;
  if (
    !helloAllowed({
      now,
      enabled: settings.enabled,
      tgDaily: settings.tgDaily,
      sentToday: sentToday ?? 0,
      accountHour: companies.count + bloggers.count,
      cap,
      lastAt,
    })
  ) {
    return null;
  }

  const { data: top } = await db
    .from("bloggers")
    .select("id, handle, telegram, pitch_lang")
    .eq("status", "ready")
    .eq("channel", "telegram")
    .not("telegram", "is", null)
    .order("score", { ascending: false, nullsFirst: false })
    .limit(5);
  for (const row of top ?? []) {
    const { data: taken } = await db
      .from("bloggers")
      .update({ status: "queued", tg_account: account, updated_at: new Date(now).toISOString() })
      .eq("id", row.id)
      .eq("status", "ready")
      .select("id");
    if (!taken?.length) continue;
    return {
      id: String(row.id),
      handle: String(row.handle),
      target: `@${row.telegram}`,
      hello: helloText(pitchLang(row.pitch_lang as string | null)),
    };
  }
  return null;
}

export async function markBloggerHelloSent(id: string, userId: string, account: string, hello: string, now = new Date()): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  const { data } = await db.from("bloggers").select("messages").eq("id", id).maybeSingle();
  const messages = Array.isArray(data?.messages) ? data.messages : [];
  await db
    .from("bloggers")
    .update({
      status: "contacted",
      contacted_at: now.toISOString(),
      tg_account: account,
      tg_user_id: userId,
      messages: [...messages, { role: "agent", text: hello, at: now.toISOString(), via: "telegram" }],
      updated_at: now.toISOString(),
    })
    .eq("id", id);
}

/**
 * В Telegram не дотянуться (адреса нет, это канал или бот) — блогер не
 * пропадает: возвращается в «К отправке» через Direct, где его найдёт
 * менеджер.
 */
export async function markBloggerUnreachable(id: string, why: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db
    .from("bloggers")
    .update({ status: "ready", channel: "direct", telegram: null, tg_account: null, note: `Telegram: ${why}`.slice(0, 300), updated_at: new Date().toISOString() })
    .eq("id", id);
}

/** Не ушло по вине аккаунта (ограничение, сбой связи) — блогер ждёт следующего прохода. */
export async function markBloggerHelloFailed(id: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db.from("bloggers").update({ status: "ready", tg_account: null, updated_at: new Date().toISOString() }).eq("id", id).eq("status", "queued");
}

/** Что сказать команде, когда блогер ответил в Telegram. */
export function replyNotice(b: { handle: string; score: number | null }, body: string, pitched: boolean): string {
  return [
    `💬 <b>Блогер ответил в Telegram</b>: <a href="https://www.instagram.com/${esc(b.handle)}/">@${esc(b.handle)}</a>${b.score !== null ? `, оценка ${b.score}` : ""}`,
    `«${esc(body.slice(0, 500))}»`,
    pitched ? "Следом уходит текст о партнёрской программе." : `Разговор — в ${esc(siteUrl)}/admin/ai-staff/bloggers`,
  ].join("\n");
}

/**
 * Входящее в личку рабочего аккаунта — может быть ответ блогера. Ищем по id
 * пользователя, затем по @адресу. Ответ на «Здравствуйте» — следом уходит
 * текст о программе на языке ответа. Дальше — команде в бот, разговор ведёт
 * человек (или агент, когда подключена переписка, docs/ai-staff/bloggers.md).
 */
export async function bloggerInbound(input: { handle: string; userId: string; account: string; body: string }, now = new Date()): Promise<{ matched: boolean; handle?: string }> {
  const db = serviceClient();
  if (!db) return { matched: false };
  const columns = "id, handle, score, status, pitch_lang, name, messages, tg_user_id";
  let row: Record<string, unknown> | null = null;
  if (input.userId) {
    const { data } = await db.from("bloggers").select(columns).eq("tg_user_id", input.userId).maybeSingle();
    row = data;
  }
  if (!row && input.handle) {
    const { data } = await db.from("bloggers").select(columns).eq("telegram", input.handle.toLowerCase()).not("tg_account", "is", null).maybeSingle();
    row = data;
  }
  if (!row || !["contacted", "replied", "stats", "agreed", "partner"].includes(String(row.status))) return { matched: false };

  const messages = Array.isArray(row.messages) ? (row.messages as unknown[]) : [];
  const at = now.toISOString();
  const first = row.status === "contacted";
  const helloLang = pitchLang(row.pitch_lang as string | null);
  const lang: PitchLang = replyLang(input.body, helloLang) === "uz" ? "uz" : "ru";
  const handle = String(row.handle);
  await db
    .from("bloggers")
    .update({
      messages: [...messages, { role: "blogger", text: input.body.slice(0, 4000), at, via: "telegram" }],
      ...(first
        ? {
            status: "replied",
            replied_at: at,
            tg_user_id: input.userId || row.tg_user_id,
            tg_pending: pitchText({ name: String(row.name ?? ""), handle }, lang, siteUrl),
            tg_pending_at: at,
          }
        : {}),
      updated_at: at,
    })
    .eq("id", String(row.id));
  await notifyDesk(replyNotice({ handle, score: row.score === null ? null : Number(row.score) }, input.body, first)).catch(() => undefined);
  return { matched: true, handle };
}

/** Следующее сообщение блогеру с этого аккаунта: текст о программе после ответа. */
export async function nextBloggerReply(account: string, now = Date.now()): Promise<BloggerReply | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db
    .from("bloggers")
    .select("id, handle, telegram, tg_user_id, tg_pending")
    .eq("tg_account", account)
    .not("tg_pending", "is", null)
    .lte("tg_pending_at", new Date(now).toISOString())
    .order("tg_pending_at", { ascending: true })
    .limit(1);
  const row = data?.[0];
  if (!row?.tg_pending || (!row.tg_user_id && !row.telegram)) return null;
  return {
    id: String(row.id),
    handle: String(row.handle),
    target: row.tg_user_id ? String(row.tg_user_id) : `@${row.telegram}`,
    ...(row.tg_user_id && row.telegram ? { fallback: `@${row.telegram}` } : {}),
    body: String(row.tg_pending),
  };
}

export async function markBloggerReplySent(id: string, now = new Date()): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  const { data } = await db.from("bloggers").select("messages, tg_pending").eq("id", id).maybeSingle();
  if (!data?.tg_pending) return;
  const messages = Array.isArray(data.messages) ? data.messages : [];
  await db
    .from("bloggers")
    .update({
      messages: [...messages, { role: "agent", text: data.tg_pending, at: now.toISOString(), via: "telegram" }],
      tg_pending: null,
      tg_pending_at: null,
      updated_at: now.toISOString(),
    })
    .eq("id", id);
}

export async function markBloggerReplyFailed(id: string, why: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db
    .from("bloggers")
    .update({ tg_pending: null, tg_pending_at: null, note: `Telegram, ответ не ушёл: ${why}`.slice(0, 300), updated_at: new Date().toISOString() })
    .eq("id", id);
  await notifyDesk(`⚠️ Блогеру не ушёл ответ в Telegram: ${esc(why)}. Напишите ему сами — ${esc(siteUrl)}/admin/ai-staff/bloggers`).catch(() => undefined);
}
