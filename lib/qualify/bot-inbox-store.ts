import { record } from "@/lib/admin/audit";
import { wants } from "@/lib/admin/notify-prefs";
import { badOurLinks } from "@/lib/admin/our-links";
import { TASHKENT_OFFSET_MS, todayInTashkent } from "@/lib/admin/pulse";
import { dayStartUtc } from "@/lib/admin/portion";
import { staffByTelegramId } from "@/lib/admin/session";
import { QUIET_FROM_HOUR, QUIET_TO_HOUR, messageWindow } from "@/lib/admin/tasks";
import { saveSession, sessionFor } from "@/lib/qualify/handoff";
import { copyMessage, copyMessageForId, esc, sendForId, sendMessage } from "@/lib/qualify/telegram";
import { tellLeadOwner } from "@/lib/qualify/lead-owner-notify";
import { siteUrl } from "@/lib/seo";
import { serviceClient } from "@/lib/supabase";

/**
 * Обращения в бота — владельцу и руководителю сразу, ответ прямо в Telegram.
 *
 * Владелец, 23.10.2026, после лида FloraEdu Global, который нашёлся только
 * потому, что он сам начал копать: «как нам сделать так, чтобы и я и
 * руководитель могли видеть и отвечать на такие заявки, которые приходят в
 * бота?… При обращениях сразу мне или руководителю приходят уведомления, с
 * возможностью общаться прямо в боте… С личного писать аккаунта мы не
 * будем».
 *
 * - Каждое сообщение клиента в личке бота — владельцу и руководителю
 *   (галочка «Обращения в бота»): кто, что написал, что ответил бот, ссылка
 *   на заявку, если она есть. Ночью (21:00–08:00) — не сразу, а утром одной
 *   пачкой: кто писал ночью и что последнее.
 * - Ответ сотрудника на это уведомление (Telegram «Ответить») уходит клиенту
 *   от бота копией — текст, фото, файл, голосовое — и с этой минуты разговор
 *   ведёт человек: модель клиенту не отвечает HUMAN_HOLD_DAYS дней.
 *   Остальным читателям — строка, кто ответил, чтобы не отвечали вдвоём.
 *
 * Номер уведомления → чат клиента — таблица bot_inbox_notices (миграция
 * 0171). Пока миграция не применена, запросы к ней молча не проходят: бот
 * работает как раньше.
 */

/** Сколько дней после ответа человека модель клиенту не отвечает. */
export const HUMAN_HOLD_DAYS = 7;

/** До какого часа утра шлём тех, кто писал ночью. */
export const NIGHT_INBOX_LATEST_HOUR = 12;

export type InboxClient = { chatId: number; name: string; username: string | null };
export type InboxLead = { id: string; requestNo: string | null; label: string } | null;

function who(c: InboxClient): string {
  return `${esc(c.name || "Клиент")}${c.username ? ` (@${esc(c.username)})` : ""}`;
}

function quote(text: string, max: number): string {
  return esc(text.replace(/\s+/g, " ").trim().slice(0, max));
}

const REPLY_HINT = "↩️ Ответьте на это сообщение — ответ уйдёт клиенту от бота студии, модель замолчит.";

export function inboxNotice(input: {
  client: InboxClient;
  text: string;
  botReply: string | null;
  lead: InboxLead;
  human: string | null;
}): string {
  const lead = input.lead
    ? `🧾 ${esc(input.lead.requestNo ?? input.lead.label)} · ${siteUrl}/admin/leads/${input.lead.id}`
    : null;
  const bot = input.human
    ? `🤐 Модель молчит: разговор ведёт ${esc(input.human)}.`
    : input.botReply?.trim()
      ? `🤖 Бот ответил: «${quote(input.botReply, 400)}»`
      : null;
  return [`📩 <b>Обращение в бота</b> · ${who(input.client)}`, `«${quote(input.text, 900)}»`, bot, lead, "", REPLY_HINT]
    .filter((line) => line !== null)
    .join("\n");
}

export function nightNotice(input: { client: InboxClient; text: string; at: string; lead: InboxLead }): string {
  const t = new Date(Date.parse(input.at) + TASHKENT_OFFSET_MS);
  const hhmm = `${String(t.getUTCHours()).padStart(2, "0")}:${String(t.getUTCMinutes()).padStart(2, "0")}`;
  const lead = input.lead ? `🧾 ${esc(input.lead.requestNo ?? input.lead.label)} · ${siteUrl}/admin/leads/${input.lead.id}` : null;
  return [`🌙 <b>Писал боту ночью</b>, ${hhmm} · ${who(input.client)}`, `Последнее: «${quote(input.text, 900)}»`, lead, "", REPLY_HINT]
    .filter((line) => line !== null)
    .join("\n");
}

export function humanHolds(humanAt: string | null | undefined, now: Date): boolean {
  if (!humanAt) return false;
  const at = Date.parse(humanAt);
  return Number.isFinite(at) && now.getTime() - at < HUMAN_HOLD_DAYS * 24 * 3600_000;
}

type Reader = { id: string; chat: number; name: string };

async function readers(): Promise<Reader[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db
    .from("staff")
    .select("id, display_name, telegram_user_id, notify_off")
    .eq("is_active", true)
    .in("role", ["admin", "head"]);
  return (data ?? [])
    .filter((r) => Number(r.telegram_user_id) && wants((r.notify_off as string[] | null) ?? [], "bot"))
    .map((r) => ({ id: String(r.id), chat: Number(r.telegram_user_id), name: String(r.display_name ?? "") }));
}

async function leadOf(username: string | null): Promise<InboxLead> {
  const db = serviceClient();
  if (!db || !username) return null;
  const { data } = await db
    .from("leads")
    .select("id, request_no, company, contact_name")
    .ilike("tg_username", username.replace(/^@/, ""))
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data
    ? { id: String(data.id), requestNo: (data.request_no as string | null) ?? null, label: String(data.company || data.contact_name || "заявка") }
    : null;
}

/** Последнее слово клиента — для утренней пачки тех, кто писал ночью. */
export async function noteClientText(chatId: number, text: string): Promise<void> {
  const db = serviceClient();
  if (!db || !text.trim()) return;
  await db.from("bot_users").update({ last_text: text.slice(0, 2000), last_text_at: new Date().toISOString() }).eq("chat_id", chatId);
}

/** Разговор ведёт человек — кто (имя), или null: отвечает модель. */
export async function humanOf(chatId: number, now: Date = new Date()): Promise<string | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data, error } = await db.from("bot_users").select("human_at, human_by").eq("chat_id", chatId).maybeSingle();
  if (error || !data || !humanHolds(data.human_at as string | null, now)) return null;
  if (!data.human_by) return "сотрудник";
  const { data: s } = await db.from("staff").select("display_name").eq("id", data.human_by).maybeSingle();
  return String(s?.display_name || "сотрудник");
}

async function sendNotice(reader: Reader, clientChat: number, text: string): Promise<boolean> {
  const id = await sendForId(reader.chat, text);
  if (!id) return false;
  const db = serviceClient();
  if (db) await db.from("bot_inbox_notices").insert({ staff_chat: reader.chat, message_id: id, client_chat: clientChat });
  return true;
}

/**
 * Сообщение клиента — владельцу и руководителю. Ночью — ничего (придёт утром
 * пачкой). Возвращает чаты, куда ушло: хозяину лида второй раз то же не
 * шлём (lead-owner-notify).
 */
export async function notifyInbox(
  input: { client: InboxClient; text: string; botReply: string | null; human: string | null },
  now: Date = new Date(),
): Promise<Set<number>> {
  const sent = new Set<number>();
  if (!messageWindow(now) || !input.text.trim()) return sent;
  const list = await readers();
  if (!list.length) return sent;
  const text = inboxNotice({ ...input, lead: await leadOf(input.client.username) });
  for (const reader of list) {
    if (reader.chat === input.client.chatId) continue;
    if (await sendNotice(reader, input.client.chatId, text)) sent.add(reader.chat);
  }
  return sent;
}

/**
 * Не текст от клиента — голосовое, фото, файл, видео, кружок, стикер.
 *
 * 23.10.2026 клиент FloraEdu в 14:09 прислал боту что-то не текстом, и бот
 * выбросил это молча: первичка отвечает только на текст, а обращение в бота
 * приходило только по тексту. Теперь такое сообщение уходит владельцу и
 * руководителю копией (без «переслано»), с той же строкой «📩 Обращение в
 * бота» и тем же «Ответить» — и на строку, и на саму копию.
 */
export type ClientMedia = "voice" | "audio" | "photo" | "video" | "video_note" | "document" | "sticker";

const MEDIA_WORD: Record<ClientMedia, string> = {
  voice: "голосовое",
  audio: "аудио",
  photo: "фото",
  video: "видео",
  video_note: "кружок",
  document: "файл",
  sticker: "стикер",
};

export function mediaOf(message: Partial<Record<ClientMedia, unknown>>): ClientMedia | null {
  for (const kind of Object.keys(MEDIA_WORD) as ClientMedia[]) if (message[kind]) return kind;
  return null;
}

export function mediaLine(media: ClientMedia, caption?: string | null): string {
  const words = (caption ?? "").trim();
  return `[${MEDIA_WORD[media]}]${words ? ` ${words}` : ""}`;
}

export async function relayClientMedia(
  input: { client: InboxClient; messageId: number; media: ClientMedia; caption?: string | null },
  now: Date = new Date(),
): Promise<number> {
  const line = mediaLine(input.media, input.caption);
  // Последнее слово клиента — и для утренней сводки тех, кто писал ночью.
  await noteClientText(input.client.chatId, line).catch(() => undefined);
  if (!messageWindow(now)) return 0;
  const db = serviceClient();
  const human = await humanOf(input.client.chatId, now).catch(() => null);
  const text = inboxNotice({ client: input.client, text: `Клиент прислал ${line}`, botReply: null, lead: await leadOf(input.client.username), human });
  let sent = 0;
  const notified = new Set<number>();
  for (const reader of await readers()) {
    if (reader.chat === input.client.chatId) continue;
    if (!(await sendNotice(reader, input.client.chatId, text))) continue;
    notified.add(reader.chat);
    sent += 1;
    const copy = await copyMessageForId(reader.chat, input.client.chatId, input.messageId);
    if (copy && db) await db.from("bot_inbox_notices").insert({ staff_chat: reader.chat, message_id: copy, client_chat: input.client.chatId });
  }
  // Лид взят менеджером — ему та же строка, переписка — в карточку.
  void tellLeadOwner({ username: input.client.username, text: line, turns: [{ role: "user", content: line }], skipChats: notified }).catch(
    () => undefined,
  );
  return sent;
}

/**
 * Ответ сотрудника на уведомление — клиенту от бота. true — это был ответ на
 * наше уведомление и он разобран здесь; false — ответ на другое, сообщение
 * идёт дальше обычным путём.
 */
export async function relayInboxReply(message: {
  chat: { id: number };
  message_id: number;
  from?: { id?: number };
  reply_to_message?: { message_id: number };
  text?: string;
  caption?: string;
}): Promise<boolean> {
  const replyTo = message.reply_to_message?.message_id;
  if (!replyTo) return false;
  const db = serviceClient();
  if (!db) return false;
  const { data: notice, error } = await db
    .from("bot_inbox_notices")
    .select("client_chat")
    .eq("staff_chat", message.chat.id)
    .eq("message_id", replyTo)
    .maybeSingle();
  if (error || !notice) return false;

  const staff = message.from?.id ? await staffByTelegramId(message.from.id) : null;
  if (!staff) return false;
  const clientChat = Number(notice.client_chat);

  if (!(await copyMessage(clientChat, message.chat.id, message.message_id))) {
    await sendMessage(message.chat.id, "⚠️ Не ушло: клиент закрыл чат с ботом или Telegram не ответил. Попробуйте ещё раз.");
    return true;
  }

  const words = (message.text ?? message.caption ?? "").trim();
  await afterHuman({ clientChat, staff, words, kind: message.text ? "text" : "file", via: "bot", fromChat: message.chat.id });
  await sendMessage(message.chat.id, "✅ Ушло клиенту от бота студии. Модель в этом разговоре молчит, дальше отвечаете вы.");
  return true;
}

/**
 * Человек написал клиенту от бота — что после этого всегда: модель молчит
 * HUMAN_HOLD_DAYS, слова — в разговор бота и в карточку заявки, журнал,
 * остальным читателям строка, чтобы не отвечали вдвоём.
 */
async function afterHuman(input: {
  clientChat: number;
  staff: { id: string; display_name: string };
  words: string;
  kind: "text" | "file";
  via: "bot" | "panel";
  /** Чат, откуда написали (в боте), — ему строки «✍️ …» не нужно. */
  fromChat: number | null;
}): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  const { clientChat, staff, words } = input;
  await db.from("bot_users").update({ human_at: new Date().toISOString(), human_by: staff.id }).eq("chat_id", clientChat);
  // Слова человека — в разговор бота: когда модель снова заговорит, она их видит.
  const session = sessionFor(clientChat);
  if (session) {
    session.transcript = [...session.transcript, { role: "assistant", content: words || "(файл)" }];
    saveSession(clientChat, session);
  }
  await record("bot.replied", {
    actorStaffId: staff.id,
    targetType: "bot_user",
    targetId: String(clientChat),
    meta: { text: words.slice(0, 200), kind: input.kind, via: input.via },
  });

  // Переписка — в карточку заявки, если она есть.
  const { data: user } = await db.from("bot_users").select("username, first_name").eq("chat_id", clientChat).maybeSingle();
  const lead = await leadOf((user?.username as string | null) ?? null);
  if (lead) {
    const { data: row } = await db.from("leads").select("transcript").eq("id", lead.id).maybeSingle();
    const transcript = Array.isArray(row?.transcript) ? (row?.transcript as unknown[]) : [];
    await db
      .from("leads")
      .update({ transcript: [...transcript, { role: "assistant", content: `[${staff.display_name}] ${words || "(файл)"}` }] })
      .eq("id", lead.id);
  }

  const name = `${esc(String(user?.first_name || "клиент"))}${user?.username ? ` (@${esc(String(user.username))})` : ""}`;
  for (const reader of await readers()) {
    if (reader.chat === input.fromChat || reader.id === staff.id) continue;
    await sendMessage(reader.chat, `✍️ ${esc(staff.display_name)} ответил в боте ${name}: «${quote(words || "файл", 300)}»`);
  }
}

/** Самое длинное, что уходит клиенту из панели: Telegram берёт до 4096 знаков. */
export const BOT_WRITE_MAX = 3500;

/** Чат клиента в боте по нику заявки — только если он сам писал боту и не заблокировал его. */
export async function botChatOf(username: string | null | undefined): Promise<number | null> {
  const nick = (username ?? "").replace(/^@/, "").trim();
  const db = serviceClient();
  if (!db || !nick) return null;
  const { data, error } = await db
    .from("bot_users")
    .select("chat_id")
    .ilike("username", nick)
    .is("blocked_at", null)
    .order("last_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return error || !data ? null : Number(data.chat_id);
}

export type BotWriteResult = "bot_sent" | "bot_empty" | "bot_bad_link" | "bot_no_chat" | "bot_failed";

/**
 * «Написать клиенту в бот» из карточки лида (владелец, 23.10.2026): первым,
 * без сообщения клиента, на которое отвечают. Уходит от бота студии, не с
 * личного аккаунта; дальше — как ответ из «📩 Обращение в бота».
 * Кто вправе — решает действие (canReveal): тот, за кем лид, руководитель и
 * владелец.
 */
export async function writeToClient(input: {
  tgUsername: string | null;
  staff: { id: string; display_name: string };
  text: string;
}): Promise<BotWriteResult> {
  const words = input.text.replace(/\r\n/g, "\n").trim().slice(0, BOT_WRITE_MAX);
  if (!words) return "bot_empty";
  if (badOurLinks(words).length) return "bot_bad_link";
  const chat = await botChatOf(input.tgUsername);
  if (!chat) return "bot_no_chat";
  return writeToChat({ chat, staff: input.staff, words });
}

/**
 * Ответ клиенту бота по его чату — из «Входящих» (lib/admin/inbox-store.ts):
 * там клиент известен по чату, а не по нику лида. Проверки и всё, что после
 * ответа, — те же, что у writeToClient. Кто вправе — решает действие.
 */
export async function writeToBotChat(input: {
  chat: number;
  staff: { id: string; display_name: string };
  text: string;
}): Promise<BotWriteResult> {
  const words = input.text.replace(/\r\n/g, "\n").trim().slice(0, BOT_WRITE_MAX);
  if (!words) return "bot_empty";
  if (badOurLinks(words).length) return "bot_bad_link";
  if (!Number.isSafeInteger(input.chat) || input.chat <= 0) return "bot_no_chat";
  return writeToChat({ chat: input.chat, staff: input.staff, words });
}

async function writeToChat(input: { chat: number; staff: { id: string; display_name: string }; words: string }): Promise<BotWriteResult> {
  if (!(await sendMessage(input.chat, esc(input.words)))) return "bot_failed";
  await afterHuman({ clientChat: input.chat, staff: input.staff, words: input.words, kind: "text", via: "panel", fromChat: null });
  return "bot_sent";
}

/**
 * Утром — кто писал боту ночью (21:00–08:00) и что последнее, каждому
 * читателю по сообщению на клиента, с тем же «Ответить». Раз в день на
 * читателя (team_news_sent «bot-night:<день>»).
 */
export async function sendNightInbox(now: Date = new Date()): Promise<number> {
  const hour = new Date(now.getTime() + TASHKENT_OFFSET_MS).getUTCHours();
  if (!messageWindow(now) || hour >= NIGHT_INBOX_LATEST_HOUR) return 0;
  const db = serviceClient();
  if (!db) return 0;
  const day = todayInTashkent(now);
  const midnight = dayStartUtc(day).getTime();
  const from = new Date(midnight - (24 - QUIET_FROM_HOUR) * 3600_000).toISOString();
  const to = new Date(midnight + QUIET_TO_HOUR * 3600_000).toISOString();

  const { data: users, error } = await db
    .from("bot_users")
    .select("chat_id, username, first_name, last_text, last_text_at")
    .gte("last_text_at", from)
    .lt("last_text_at", to)
    .order("last_text_at", { ascending: true })
    .limit(15);
  if (error || !users?.length) return 0;
  const { data: staffChats } = await db.from("staff").select("telegram_user_id").not("telegram_user_id", "is", null);
  const staff = new Set((staffChats ?? []).map((s) => Number(s.telegram_user_id)));
  const clients = users.filter((u) => !staff.has(Number(u.chat_id)) && String(u.last_text ?? "").trim());
  if (!clients.length) return 0;

  const key = `bot-night:${day}`;
  let sent = 0;
  for (const reader of await readers()) {
    const { data: claimed } = await db
      .from("team_news_sent")
      .upsert({ news_id: key, staff_id: reader.id }, { onConflict: "news_id,staff_id", ignoreDuplicates: true })
      .select("staff_id");
    if (!claimed?.length) continue;
    for (const u of clients) {
      const client = { chatId: Number(u.chat_id), name: String(u.first_name ?? ""), username: (u.username as string | null) ?? null };
      const text = nightNotice({ client, text: String(u.last_text), at: String(u.last_text_at), lead: await leadOf(client.username) });
      if (await sendNotice(reader, client.chatId, text)) sent += 1;
    }
  }
  return sent;
}
