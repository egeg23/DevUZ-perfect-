import { record } from "@/lib/admin/audit";
import { EDIT_TTL_MS, REFUSAL, askFresh, editErrorReply, editStage, mayEditFromBot } from "@/lib/admin/bot-text-edit";
import type { MessageProblem } from "@/lib/admin/outreach";
import { letterEditProblems, requestEdit } from "@/lib/admin/outreach-edit-request";
import { prospectById, sendProblems, type Prospect } from "@/lib/admin/outreach-store";
import { portionSource } from "@/lib/admin/portion-store";
import type { Staff } from "@/lib/admin/session";
import { serviceClient } from "@/lib/supabase";

/**
 * Хранилище «✏️ Изменить текст» в боте: просьба → карточка и правка тем же
 * путём, что в панели. Правила и слова — lib/admin/bot-text-edit.ts.
 */

export type Ask = { chat_id: number; prompt_message_id: number; prospect_id: string; staff_id: string; created_at: string };

/** Может ли этот человек начать правку: карточка есть, текст есть, право есть. */
export async function editAllowed(
  prospectId: string,
  staff: Staff,
): Promise<{ ok: true; prospect: Prospect } | { ok: false; why: string }> {
  const prospect = await prospectById(prospectId);
  if (!prospect || editStage(prospect) === "closed") return { ok: false, why: REFUSAL.gone };
  const owns = editStage(prospect) === "card" ? (await portionSource(staff.id, prospectId)) !== null : false;
  if (!mayEditFromBot(prospect, staff, owns)) return { ok: false, why: REFUSAL.forbidden };
  return { ok: true, prospect };
}

/** Запомнить просьбу. Заодно — убрать просроченные: они живут сутки. */
export async function rememberAsk(chatId: number, messageId: number, prospectId: string, staffId: string): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  await db.from("bot_text_edits").delete().lt("created_at", new Date(Date.now() - EDIT_TTL_MS).toISOString());
  const { error } = await db
    .from("bot_text_edits")
    .upsert({ chat_id: chatId, prompt_message_id: messageId, prospect_id: prospectId, staff_id: staffId });
  if (error) console.error("правка в боте: просьба не записалась", error.message);
  return !error;
}

/** Просьба, на которую ответили, — или null: ответ не на нашу просьбу. */
export async function askFor(chatId: number, messageId: number): Promise<Ask | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db
    .from("bot_text_edits")
    .select("chat_id, prompt_message_id, prospect_id, staff_id, created_at")
    .eq("chat_id", chatId)
    .eq("prompt_message_id", messageId)
    .maybeSingle();
  return (data as Ask | null) ?? null;
}

export type BotEditResult =
  | { ok: true; stage: "card" | "queued" | "sent"; prospect: Prospect; waiting: boolean }
  | { ok: false; why: string; problems?: MessageProblem[] };

/**
 * Принять исправленный текст. Проверки и запись — те же, что у панели:
 * до отправки — sendProblems (как «Отправить»), в очереди — как
 * «Исправить» у письма, которое ждёт ответа, ушло — requestEdit.
 */
export async function applyBotEdit(ask: Ask, staff: Staff, text: string, now = Date.now()): Promise<BotEditResult> {
  if (ask.staff_id !== staff.id) return { ok: false, why: REFUSAL.notYours };
  if (!askFresh(ask.created_at, now)) return { ok: false, why: REFUSAL.stale };
  const db = serviceClient();
  if (!db) return { ok: false, why: REFUSAL.offline };

  const body = text.trim();
  if (!body) return { ok: false, why: REFUSAL.empty };
  const allowed = await editAllowed(ask.prospect_id, staff);
  if (!allowed.ok) return allowed;
  const prospect = allowed.prospect;
  const stage = editStage(prospect);
  if (stage === "closed") return { ok: false, why: REFUSAL.gone };

  if (stage === "sent") {
    const result = await requestEdit({ prospectId: prospect.id, lineId: null, body, staff, ip: "" });
    if (!result.ok) return { ok: false, why: editErrorReply(result.reason), problems: result.problems };
    return { ok: true, stage, prospect: { ...prospect, message: body }, waiting: result.state === "waiting" };
  }

  const previous = (prospect.message ?? "").trim();
  if (body === previous) return { ok: false, why: REFUSAL.same };
  const problems =
    stage === "card"
      ? sendProblems({ ...prospect, message: body }, staff.display_name)
      : letterEditProblems(prospect, body, staff.display_name);
  if (problems.length) return { ok: false, why: "problems", problems };

  // Только пока карточка в том же состоянии: пока человек правил, письмо
  // могли отправить или снять с очереди.
  const { data: changed } = await db
    .from("prospects")
    .update({ message: body })
    .eq("id", prospect.id)
    .in("status", stage === "card" ? ["new", "contacting"] : ["sending"])
    .select("id");
  if (!changed?.length) return { ok: false, why: REFUSAL.gone };

  await db.from("outreach_edits").insert({
    prospect_id: prospect.id,
    body,
    previous,
    reason: stage === "card" ? "бот: карточка до отправки" : "бот: письмо в очереди",
    staff_id: staff.id,
    done_at: new Date(now).toISOString(),
  });
  await record("prospect.edit_requested", {
    actorStaffId: staff.id,
    targetType: "prospect",
    targetId: prospect.id,
    ip: "",
    meta: { host: prospect.host, chars: body.length, target: stage === "card" ? "card" : "queued_letter", via: "telegram" },
  });
  return { ok: true, stage, prospect: { ...prospect, message: body }, waiting: false };
}
