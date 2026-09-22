import { record } from "@/lib/admin/audit";
import { advanceQueues, requeueLead } from "@/lib/admin/lead-queue-store";
import type { Staff } from "@/lib/admin/session";
import { esc, sendMessage, withdrawCards } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

/**
 * Что отключение сотрудника разорвало — по пунктам, для владельца.
 *
 * Владелец: «убедись, что при удалении сотрудника ему перестают падать
 * лиды, убирается доступ к панели и теряются все взаимосвязи».
 *
 * Доступ закрывается и без этого модуля: сессии и ссылки входа сносит
 * disableStaff, а каждая проверка сессии и каждая кнопка бота ищет только
 * активных. Этот модуль — про то, что остаётся висеть после: лиды в работе,
 * переписки, в которых модель подписывается его именем, очередь, где лид
 * ждёт полчаса человека, которого нет, и карточки лидов в его личке.
 */
export type Offboarding = {
  /** Лидов в работе вернули в очередь. */
  leads: number;
  /** Переписок из касаний передали наследнику. */
  talks: number;
  /** Подготовленных, но не отправленных касаний вернули в общий пул. */
  pool: number;
  /** Менеджеров открепили — отключили их руководителя. */
  team: number;
  /** Напоминаний сняли. */
  reminders: number;
  /** Просьб о передаче лида закрыли. */
  transfers: number;
  /** Карточек лидов убрали из его лички. */
  cards: number;
};

const NONE: Offboarding = { leads: 0, talks: 0, pool: 0, team: 0, reminders: 0, transfers: 0, cards: 0 };

/**
 * Кому достаются переписки ушедшего: его руководителю, если тот работает,
 * иначе тому, кто отключает, — это владелец.
 *
 * Не в общий пул, как лиды: разговор уже идёт, клиент ждёт ответа, и модель
 * подписывает письма именем того, за кем касание. «Ничьё» касание модель
 * подписала бы «менеджер студии», а о следующем ответе клиента не узнал бы
 * никто.
 */
async function heirOf(target: { head_staff_id: string | null }, actor: Staff): Promise<{ id: string; chat: number | null; name: string }> {
  const db = serviceClient();
  if (db && target.head_staff_id) {
    const { data: head } = await db
      .from("staff")
      .select("id, display_name, telegram_user_id, role, is_active")
      .eq("id", target.head_staff_id)
      .maybeSingle();
    if (head?.is_active && head.role === "head") {
      return { id: head.id as string, chat: Number(head.telegram_user_id) || null, name: head.display_name as string };
    }
  }
  return { id: actor.id, chat: null, name: actor.display_name };
}

/** Открепить команду руководителя: при отключении и при снятии с должности. */
export async function detachTeam(headId: string): Promise<number> {
  const db = serviceClient();
  if (!db) return 0;
  const { data } = await db.from("staff").update({ head_staff_id: null }).eq("head_staff_id", headId).select("id");
  return data?.length ?? 0;
}

/**
 * Разорвать всё, что держится за сотрудника. Зовётся после того, как он
 * отключён: рассылки, собранные здесь, уже не включают его самого.
 *
 * Каждый шаг сам по себе: сбой одного не оставляет несделанными остальные.
 * История остаётся — взятые и закрытые лиды, проекты, касания, журнал:
 * авторство задним числом не стирается.
 */
export async function offboardStaff(staffId: string, actor: Staff, ip: string): Promise<Offboarding> {
  const db = serviceClient();
  if (!db) return NONE;

  const { data: target } = await db
    .from("staff")
    .select("id, display_name, telegram_user_id, role, head_staff_id")
    .eq("id", staffId)
    .maybeSingle();
  if (!target) return NONE;

  const out: Offboarding = { ...NONE };
  const name = String(target.display_name);
  const now = new Date().toISOString();

  // 1. Очередь: полчаса, выданные ему, истекают сейчас. Проход ниже передаст
  //    лид следующему сразу, не дожидаясь пяти минут свипа.
  await db
    .from("lead_offers")
    .update({ expires_at: now })
    .eq("staff_id", staffId)
    .is("outcome", null);

  // 2. Лиды в работе — обратно в очередь, по тем же правилам, что новый лид.
  //    Выигранные, проигранные и отказы остаются за ним: это история и деньги.
  const { data: taken } = await db
    .from("leads")
    .select("id")
    .eq("assigned_staff_id", staffId)
    .eq("status", "taken");
  for (const row of taken ?? []) {
    const leadId = row.id as string;
    const { data: released } = await db
      .from("leads")
      .update({ assigned_staff_id: null, assigned_to: null, assigned_at: null, status: "new" })
      .eq("id", leadId)
      .eq("assigned_staff_id", staffId)
      .select("id");
    if (!released?.length) continue;

    await record("lead.released", {
      actorStaffId: actor.id,
      targetType: "lead",
      targetId: leadId,
      ip,
      meta: { previous_owner: staffId, reason: "staff_disabled" },
    });
    await requeueLead(leadId, `↩️ <b>Лид вернулся в очередь</b> — его вёл ${esc(name)}, сотрудник отключён.`);
    out.leads += 1;
  }

  // 3. Напоминания — все его, не только по отпущенным лидам: слать их некому.
  const { data: reminders } = await db
    .from("lead_reminders")
    .update({ cancelled_at: now })
    .eq("staff_id", staffId)
    .is("done_at", null)
    .is("cancelled_at", null)
    .select("id");
  out.reminders = reminders?.length ?? 0;

  // 4. Просьбы о передаче, где он с любой стороны, — закрыты отказом: лид от
  //    него уже ушёл в очередь, а к нему передавать нельзя.
  const { data: transfers } = await db
    .from("lead_transfers")
    .update({ status: "declined", decided_by: actor.id, decided_at: now })
    .eq("status", "requested")
    .or(`from_staff_id.eq.${staffId},to_staff_id.eq.${staffId},requested_by.eq.${staffId}`)
    .select("id");
  out.transfers = transfers?.length ?? 0;

  // 5. Касания. Подготовленные, но не отправленные — в общий пул: письмо
  //    готово, отправить его может любой. Идущие переписки — наследнику.
  const { data: pool } = await db
    .from("prospects")
    .update({ status: "new", claimed_by: null, claimed_at: null })
    .eq("claimed_by", staffId)
    .eq("status", "contacting")
    .select("id");
  out.pool = pool?.length ?? 0;

  const heir = await heirOf({ head_staff_id: (target.head_staff_id as string | null) ?? null }, actor);
  const { data: talks } = await db
    .from("prospects")
    .update({ claimed_by: heir.id })
    .eq("claimed_by", staffId)
    .in("status", ["sending", "sent", "manual"])
    .select("host");
  out.talks = talks?.length ?? 0;
  if (out.talks && heir.chat) {
    const hosts = (talks ?? []).map((t) => String(t.host)).slice(0, 10);
    const lines = [`<b>Вам переданы переписки ${esc(name)}</b> — сотрудник отключён.`, ""];
    lines.push(...hosts.map((h) => `• ${esc(h)}`));
    if (out.talks > hosts.length) lines.push(`…и ещё ${out.talks - hosts.length}`);
    lines.push("", "Ответы клиентов теперь приходят вам, модель подписывает письма вашим именем.");
    await sendMessage(heir.chat, lines.join("\n"));
  }

  // 5б. Порция дня: несделанное сегодня закрывается. Компании при этом уже
  //     вернулись в пул выше (contacting → new), а в вечернем отчёте
  //     отключённого не будет.
  await db
    .from("touch_portions")
    .update({ outcome: "expired", closed_at: now })
    .eq("staff_id", staffId)
    .is("outcome", null);

  // 6. Команда руководителя — открепляется: менеджеры становятся ничьими, их
  //    берёт другой руководитель или закрепляет владелец.
  if (target.role === "head") out.team = await detachTeam(staffId);

  // 7. Карточки лидов в его личке: свежие удаляются, у старых гаснут кнопки.
  const chat = String(target.telegram_user_id ?? "");
  if (chat) {
    const { data: notices } = await db
      .from("lead_notices")
      .select("chat_id, message_id")
      .eq("chat_id", chat)
      .order("message_id", { ascending: false })
      .limit(300);
    const list = (notices ?? []).map((n) => ({ chatId: String(n.chat_id), messageId: Number(n.message_id) }));
    // Сначала очередь: проход ниже правит кнопки у его копий, и после
    // удаления ему было бы нечего править.
    await advanceQueues(new Date());
    if (list.length) {
      await withdrawCards(list);
      await db.from("lead_notices").delete().eq("chat_id", chat);
    }
    out.cards = list.length;
  } else {
    await advanceQueues(new Date());
  }

  return out;
}

/**
 * Итог словами — для строки на странице «Команда» после отключения.
 *
 * Только то, что было: «вернули 0 лидов» — не новость, а шум.
 */
export function offboardingSummary(o: Offboarding): string {
  const parts = [
    o.leads ? `лидов в работе вернулось в очередь — ${o.leads}` : "",
    o.talks ? `переписок из касаний передано — ${o.talks}` : "",
    o.pool ? `неотправленных касаний вернулось в общий пул — ${o.pool}` : "",
    o.team ? `менеджеров откреплено от него как от руководителя — ${o.team}` : "",
    o.reminders ? `напоминаний снято — ${o.reminders}` : "",
    o.transfers ? `просьб о передаче лида закрыто — ${o.transfers}` : "",
    o.cards ? `карточек лидов убрано из его Telegram — ${o.cards}` : "",
  ].filter(Boolean);
  return parts.length ? `${parts.join("; ")}.` : "Незакрытых дел за ним не было.";
}
