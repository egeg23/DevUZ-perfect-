import { waitsForPitch } from "@/lib/admin/hello-first";
import type { MessageProblem } from "@/lib/admin/outreach";
import { EDIT_WINDOW_MS, isHelloLine, lineEditable, type EditState, type EditableLine } from "@/lib/admin/outreach-edit";
import { prospectById, sendProblems, type Prospect } from "@/lib/admin/outreach-store";
import { STAFF_REPLY_MAX } from "@/lib/admin/outreach-talk-store";
import { badOurLinks } from "@/lib/admin/our-links";
import type { Staff } from "@/lib/admin/session";
import { mayClose } from "@/lib/admin/touch-close";
import { record } from "@/lib/admin/audit";
import { serviceClient } from "@/lib/supabase";

/**
 * Кнопка «Исправить» у отправленного касания (владелец, 12.10.2026:
 * «Оптимизация скрипта, чтобы манагеры редачили касания»).
 *
 * Править можно:
 * - письмо, которое ещё ждёт ответа на «Здравствуйте» (prospects.message) —
 *   правится сразу, уйдёт уже исправленным;
 * - письмо или ответ, которые стоят в очереди скаута, — тоже сразу;
 * - письмо или ответ, ушедшие с рабочего аккаунта не больше 48 часов назад, —
 *   строкой в outreach_edits: править в Telegram может только отправивший
 *   аккаунт, это делает скаут (lib/admin/outreach-edit.ts → nextEdit).
 *
 * Само «Здравствуйте» не правится: до ответа клиента ему уходит только оно.
 *
 * Проверка — та же, что перед отправкой. Письмо о сайте — sendProblems
 * (тезисы, жаргон, числа, приветствие, 12–100 слов) без «проверка сайта
 * устарела»: письмо уже на руках у клиента или ждёт ответа, проверка
 * сайта перед ним была, а правка не добавляет новых фактов — числа
 * сверяются с теми же тезисами. Ответ в переписке — как ответ менеджера
 * из карточки лида (queueStaffReply): не пустой и влезает в сообщение.
 */

export type EditError =
  | "forbidden"
  | "gone"
  | "empty"
  | "too_long"
  | "bad_link"
  | "same"
  | "hello"
  | "not_editable"
  | "too_late"
  | "problems"
  | "offline";

export type EditResult = { ok: true; state: EditState } | { ok: false; reason: EditError; problems?: MessageProblem[] };

/** Кто может нажать «Исправить»: тот, кто касание ведёт, руководитель и владелец — как «Клиент отказался». */
export function mayEditTouch(
  p: { claimed_by: string | null; touched_by: string | null; handled_by?: string | null },
  staff: Pick<Staff, "id" | "role">,
): boolean {
  return mayClose(p, staff);
}

/** Проверка письма о сайте перед правкой — та же, что перед отправкой (см. шапку файла). */
export function letterEditProblems(prospect: Prospect, body: string, sender: string): MessageProblem[] {
  return sendProblems({ ...prospect, message: body }, sender).filter((p) => p.code !== "not_checked");
}

/** Проверка ответа в переписке — как у ответа менеджера из карточки лида. */
export function replyEditProblem(body: string): "empty" | "too_long" | "bad_link" | null {
  const text = body.trim();
  if (!text) return "empty";
  if (text.length > STAFF_REPLY_MAX) return "too_long";
  if (badOurLinks(text).length) return "bad_link";
  return null;
}

type Line = EditableLine & { id: string; body: string; prospect_id: string };

const LINE_COLUMNS = "id, prospect_id, direction, kind, status, sent_at, created_at, tg_message_id, body";

export async function requestEdit(input: {
  prospectId: string;
  /** Какая реплика ленты; null — письмо касания (ждёт ответа или уже ушло). */
  lineId: string | null;
  body: string;
  staff: Staff;
  /** Лид этой карточки закреплён за нажавшим (canEdit по лиду) — тоже право. */
  leadOwner?: boolean;
  ip: string;
}): Promise<EditResult> {
  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };
  const body = input.body.trim();

  const prospect = await prospectById(input.prospectId);
  if (!prospect || prospect.status !== "sent") return { ok: false, reason: "gone" };
  if (!input.leadOwner && !mayEditTouch(prospect, input.staff)) return { ok: false, reason: "forbidden" };

  const audit = async (meta: Record<string, unknown>) =>
    record("prospect.edit_requested", {
      actorStaffId: input.staff.id,
      targetType: "prospect",
      targetId: prospect.id,
      ip: input.ip,
      meta: { host: prospect.host, chars: body.length, ...meta },
    });

  const letterProblems = () => letterEditProblems(prospect, body, input.staff.display_name);

  // Письмо ждёт ответа на «Здравствуйте» — правим его прямо в карточке.
  if (input.lineId === null && waitsForPitch(prospect)) {
    if (!prospect.message) return { ok: false, reason: "not_editable" };
    if (!body) return { ok: false, reason: "empty" };
    if (body === prospect.message.trim()) return { ok: false, reason: "same" };
    const problems = letterProblems();
    if (problems.length) return { ok: false, reason: "problems", problems };
    // Только пока письмо не ушло: клиент мог ответить, пока менеджер правил.
    const { data: changed } = await db
      .from("prospects")
      .update({ message: body })
      .eq("id", prospect.id)
      .is("pitch_at", null)
      .select("id");
    if (!changed?.length) return { ok: false, reason: "gone" };
    const at = new Date().toISOString();
    await db.from("outreach_edits").insert({
      prospect_id: prospect.id,
      body,
      previous: prospect.message,
      reason: "письмо до ответа клиента",
      staff_id: input.staff.id,
      done_at: at,
    });
    await audit({ target: "pending_letter" });
    return { ok: true, state: "done" };
  }

  // Какая реплика: названная или письмо касания — первое текстовое после ответа.
  const letterLine = async (): Promise<Line | null> => {
    if (!prospect.pitch_at) return null;
    const { data } = await db
      .from("outreach_messages")
      .select(LINE_COLUMNS)
      .eq("prospect_id", prospect.id)
      .eq("direction", "out")
      .eq("kind", "text")
      .gte("created_at", prospect.pitch_at)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    return (data as Line | null) ?? null;
  };
  let line: Line | null;
  if (input.lineId) {
    const { data } = await db.from("outreach_messages").select(LINE_COLUMNS).eq("id", input.lineId).maybeSingle();
    line = (data as Line | null) ?? null;
    if (line && String(line.prospect_id) !== prospect.id) line = null;
  } else {
    line = await letterLine();
  }
  if (!line) return { ok: false, reason: "not_editable" };
  if (isHelloLine(line, prospect)) return { ok: false, reason: "hello" };
  if (!lineEditable(line, prospect)) {
    const late = line.status === "sent" && line.sent_at && Date.now() - Date.parse(line.sent_at) > EDIT_WINDOW_MS;
    return { ok: false, reason: late ? "too_late" : "not_editable" };
  }
  if (body === String(line.body).trim()) return { ok: false, reason: "same" };

  // Письмо о сайте проверяется как письмо, ответ — как ответ.
  const letter = await letterLine();
  if (letter && letter.id === line.id) {
    if (!body) return { ok: false, reason: "empty" };
    const problems = letterProblems();
    if (problems.length) return { ok: false, reason: "problems", problems };
  } else {
    const problem = replyEditProblem(body);
    if (problem) return { ok: false, reason: problem };
  }

  // Ещё в очереди — правим текст сразу, скаут отправит уже исправленный.
  if (line.status === "queued") {
    const { data: changed } = await db
      .from("outreach_messages")
      .update({ body })
      .eq("id", line.id)
      .eq("status", "queued")
      .select("id");
    if (changed?.length) {
      await db.from("outreach_edits").insert({
        prospect_id: prospect.id,
        message_id: line.id,
        body,
        previous: line.body,
        reason: "до отправки",
        staff_id: input.staff.id,
        done_at: new Date().toISOString(),
      });
      await audit({ target: "queued", line: line.id });
      return { ok: true, state: "done" };
    }
    // Скаут успел отправить, пока правили, — правим уже ушедшее.
    const { data: fresh } = await db.from("outreach_messages").select(LINE_COLUMNS).eq("id", line.id).maybeSingle();
    if (!fresh || !lineEditable(fresh as Line, prospect)) return { ok: false, reason: "gone" };
  }

  // Ушло — правка в очередь скаута. Несделанная правка той же реплики
  // заменяется: два исправления подряд — одна правка в Telegram.
  const { data: waiting } = await db
    .from("outreach_edits")
    .select("id")
    .eq("message_id", line.id)
    .is("done_at", null)
    .is("failure", null)
    .limit(1)
    .maybeSingle();
  const { error } = waiting
    ? await db.from("outreach_edits").update({ body, staff_id: input.staff.id }).eq("id", waiting.id)
    : await db.from("outreach_edits").insert({
        prospect_id: prospect.id,
        message_id: line.id,
        body,
        reason: "кнопка «Исправить»",
        staff_id: input.staff.id,
      });
  if (error) {
    console.error("правка: не встала в очередь", error.message);
    return { ok: false, reason: "offline" };
  }
  await audit({ target: "sent", line: line.id });
  return { ok: true, state: "waiting" };
}

/**
 * Что можно исправить в карточке «Касаний»: письмо ждёт ответа (pending)
 * или письмо уже ушло/стоит в очереди и править его ещё не поздно (line).
 * null — исправлять нечего.
 */
export async function letterTargets(
  rows: readonly Pick<Prospect, "id" | "status" | "message" | "hello_at" | "pitch_at" | "target_kind">[],
): Promise<Map<string, { kind: "pending" | "line"; body: string }>> {
  const out = new Map<string, { kind: "pending" | "line"; body: string }>();
  const sent = rows.filter((r) => r.status === "sent" && r.target_kind !== "manual");
  for (const r of sent) {
    if (waitsForPitch(r) && r.message) out.set(r.id, { kind: "pending", body: r.message });
  }
  const now = Date.now();
  const pitched = sent.filter((r) => r.pitch_at && now - Date.parse(r.pitch_at) <= EDIT_WINDOW_MS + 24 * 3600_000);
  const db = serviceClient();
  if (!db || !pitched.length) return out;
  const { data } = await db
    .from("outreach_messages")
    .select(LINE_COLUMNS)
    .in("prospect_id", pitched.map((r) => r.id))
    .eq("direction", "out")
    .eq("kind", "text")
    .order("created_at", { ascending: true })
    .limit(500);
  for (const r of pitched) {
    const letter = ((data ?? []) as Line[]).find(
      (l) => String(l.prospect_id) === r.id && Date.parse(l.created_at) >= Date.parse(r.pitch_at!),
    );
    if (letter && lineEditable(letter, r, now)) out.set(r.id, { kind: "line", body: letter.body });
  }
  return out;
}
