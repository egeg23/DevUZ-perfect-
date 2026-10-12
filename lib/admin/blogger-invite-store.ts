import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  ALREADY_ANSWERED,
  BLOGGER_INVITE,
  INVITE_MEMO,
  INVITE_ON,
  SUMMARY_HOUR,
  accessAfterYes,
  answerLine,
  inviteRows,
  inviteText,
  ownerCopy,
  statusLine,
  tallyText,
  type InviteAnswer,
  type Tally,
} from "@/lib/admin/blogger-invite";
import { tashkentHour } from "@/lib/admin/portion";
import type { Role } from "@/lib/admin/roles";
import { sectionAccess } from "@/lib/admin/roles";
import type { Staff } from "@/lib/admin/session";
import { messageWindow } from "@/lib/admin/tasks";
import { editMessage, esc, sendDocument, sendMessage, sendRowsForId } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

/**
 * Приглашение «Работа с блогерами» — база и рассылка
 * (lib/admin/blogger-invite.ts). Зовёт свип: каждый проход досылает тем,
 * кому ещё не ушло, а в 18:00 — итог владельцу. Нажатия разбирает вебхук.
 */

type Person = { id: string; role: Role; chat: number; name: string };

/** Имя для сообщений бота — уже экранированное: сообщения идут с HTML-разметкой. */
const nameOf = (r: { display_name?: unknown; username?: unknown }) =>
  esc(String(r.display_name || (r.username ? `@${r.username}` : "") || "Сотрудник"));

async function people(): Promise<Person[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db.from("staff").select("id, role, telegram_user_id, display_name, username").eq("is_active", true);
  return (data ?? [])
    .map((r) => ({ id: r.id as string, role: r.role as Role, chat: Number(r.telegram_user_id), name: nameOf(r) }))
    .filter((p) => Number.isFinite(p.chat) && p.chat !== 0);
}

function active(now: Date): boolean {
  const t = now.getTime();
  return t >= Date.parse(`${BLOGGER_INVITE.from}T00:00:00Z`) && t < Date.parse(`${BLOGGER_INVITE.until}T00:00:00Z`);
}

/** Отметка «копия владельцу ушла» и «итог ушёл» — в team_news_sent, как у объявлений. */
async function claimNote(key: string, staffId: string): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { data } = await db
    .from("team_news_sent")
    .upsert({ news_id: key, staff_id: staffId }, { onConflict: "news_id,staff_id", ignoreDuplicates: true })
    .select("staff_id");
  return Boolean(data?.length);
}

async function dropNote(key: string, staffId: string): Promise<void> {
  await serviceClient()?.from("team_news_sent").delete().eq("news_id", key).eq("staff_id", staffId);
}

/**
 * Разослать приглашение тем, кому ещё не ушло. Строка — до сообщения и
 * условно (первичный ключ): два прохода свипа не пришлют его дважды. Не
 * дошло — строка снимается, следующий проход попробует снова.
 */
export async function sendBloggerInvites(now: Date = new Date()): Promise<number> {
  if (!INVITE_ON || !active(now) || !messageWindow(now)) return 0;
  const db = serviceClient();
  if (!db) return 0;
  const everyone = await people();
  const { data: done } = await db.from("team_invites").select("staff_id").eq("invite_id", BLOGGER_INVITE.id);
  const already = new Set((done ?? []).map((r) => r.staff_id as string));

  let sent = 0;
  for (const p of everyone.filter((p) => BLOGGER_INVITE.roles.includes(p.role) && !already.has(p.id))) {
    const { data: claimed } = await db
      .from("team_invites")
      .upsert(
        { invite_id: BLOGGER_INVITE.id, staff_id: p.id, chat_id: p.chat },
        { onConflict: "invite_id,staff_id", ignoreDuplicates: true },
      )
      .select("staff_id");
    if (!claimed?.length) continue;
    const messageId = await sendRowsForId(p.chat, inviteText(p.role), inviteRows());
    if (messageId === null) {
      await db.from("team_invites").delete().eq("invite_id", BLOGGER_INVITE.id).eq("staff_id", p.id);
      continue;
    }
    await db.from("team_invites").update({ message_id: messageId || null }).eq("invite_id", BLOGGER_INVITE.id).eq("staff_id", p.id);
    sent += 1;
  }

  // Копия владельцу — когда приглашение ушло хоть кому-то.
  if (sent > 0 || already.size > 0) {
    for (const owner of everyone.filter((p) => p.role === "admin")) {
      const key = `${BLOGGER_INVITE.id}:copy`;
      if (!(await claimNote(key, owner.id))) continue;
      if (!(await sendMessage(owner.chat, ownerCopy()))) await dropNote(key, owner.id);
    }
  }
  return sent;
}

/** Кто принял, кто отказался, кто молчит — по тем, кому приглашение ушло. */
export async function inviteTally(): Promise<Tally> {
  const db = serviceClient();
  const tally: Tally = { yes: [], no: [], silent: [] };
  if (!db) return tally;
  const { data } = await db
    .from("team_invites")
    .select("answer, staff:staff_id (display_name, username)")
    .eq("invite_id", BLOGGER_INVITE.id)
    .order("sent_at", { ascending: true });
  for (const row of data ?? []) {
    const who = Array.isArray(row.staff) ? row.staff[0] : row.staff;
    const name = nameOf((who ?? {}) as { display_name?: unknown; username?: unknown });
    if (row.answer === "yes") tally.yes.push(name);
    else if (row.answer === "no") tally.no.push(name);
    else tally.silent.push(name);
  }
  return tally;
}

/** Итог владельцу — один раз, с 18:00 по Ташкенту, если приглашение уже кому-то ушло. */
export async function sendInviteSummary(now: Date = new Date()): Promise<boolean> {
  if (!INVITE_ON || !active(now) || tashkentHour(now) < SUMMARY_HOUR || !messageWindow(now)) return false;
  const tally = await inviteTally();
  if (!tally.yes.length && !tally.no.length && !tally.silent.length) return false;
  let ok = false;
  for (const owner of (await people()).filter((p) => p.role === "admin")) {
    const key = `${BLOGGER_INVITE.id}:summary`;
    if (!(await claimNote(key, owner.id))) continue;
    if (await sendMessage(owner.chat, tallyText(tally))) ok = true;
    else await dropNote(key, owner.id);
  }
  return ok;
}

export type InviteResult = "saved" | "already" | "not_invited";

/**
 * Нажатие «Принять» / «Отклонить». Ответ пишется только туда, где его ещё
 * нет, — второе нажатие (или нажатие на копии в другом окне) получает
 * «Ответ уже записан». Кнопки нажимает только адресат: строку ищем по нему
 * самому, а не по сообщению.
 */
export async function answerInvite(
  staff: Staff,
  answer: InviteAnswer,
  chatId: number,
  messageId: number | null,
  now: Date = new Date(),
): Promise<InviteResult> {
  const db = serviceClient();
  if (!db) return "not_invited";
  const { data: row } = await db
    .from("team_invites")
    .select("answer, chat_id")
    .eq("invite_id", BLOGGER_INVITE.id)
    .eq("staff_id", staff.id)
    .maybeSingle();
  if (!row || Number(row.chat_id) !== chatId) return "not_invited";
  if (row.answer) return "already";

  const { data: updated } = await db
    .from("team_invites")
    .update({ answer, answered_at: now.toISOString() })
    .eq("invite_id", BLOGGER_INVITE.id)
    .eq("staff_id", staff.id)
    .is("answer", null)
    .select("staff_id");
  if (!updated?.length) return "already";

  // Кнопки — строкой статуса: текст приглашения остаётся, ответ виден под ним.
  if (messageId) await editMessage(chatId, messageId, `${inviteText(staff.role)}\n\n${statusLine(answer, staff.role)}`, []);

  if (answer === "yes") {
    await openSection(staff);
    await sendMemo(chatId);
  }
  await tellDesk(staff, answer);
  return "saved";
}

export { ALREADY_ANSWERED };

/** Принял менеджер — раздел «ИИ-сотрудники» открыт, как галочкой владельца. */
async function openSection(staff: Staff): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  const { data } = await db.from("staff").select("section_access").eq("id", staff.id).maybeSingle();
  const next = accessAfterYes(staff.role, sectionAccess(data?.section_access));
  if (!next) return;
  const { error } = await db.from("staff").update({ section_access: next }).eq("id", staff.id);
  if (error) console.error("приглашение: раздел не открылся", error.message);
}

async function sendMemo(chatId: number): Promise<boolean> {
  try {
    const file = new Uint8Array(await readFile(path.join(process.cwd(), INVITE_MEMO.file)));
    return await sendDocument(chatId, file, INVITE_MEMO.name, "Памятка: где искать блогеров, первое сообщение, ответы на возражения.");
  } catch (error) {
    console.error("приглашение: памятка не ушла", error);
    return false;
  }
}

/** Владельцу и руководителю — строка на ответ; владельцу — с текущим итогом. */
async function tellDesk(staff: Staff, answer: InviteAnswer): Promise<void> {
  const line = answerLine(nameOf(staff), answer);
  const desk = (await people()).filter((p) => (p.role === "admin" || p.role === "head") && p.id !== staff.id);
  const tally = desk.some((p) => p.role === "admin") ? await inviteTally() : null;
  for (const p of desk) {
    const text = p.role === "admin" && tally ? `${line}\n\n${tallyText(tally, "<b>Сейчас:</b>")}` : line;
    await sendMessage(p.chat, text);
  }
}
