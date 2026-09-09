import { record } from "@/lib/admin/audit";
import { esc, sendMessage } from "@/lib/qualify/telegram";
import { siteUrl } from "@/lib/seo";
import { serviceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Отправка созревших напоминаний.
 *
 * Дёргается таймером systemd с самого сервера, поэтому защищено не кукой, а
 * общим секретом в заголовке. Секрет не задан — endpoint отвечает отказом
 * всем подряд, включая таймер. Обратный порядок («нет секрета — пускаем
 * всех») выглядит удобнее ровно до того дня, когда переменная не доедет до
 * контейнера, и адрес окажется открыт наружу.
 *
 * За один проход отправляется не больше пачки: если база накопила тысячу
 * просроченных напоминаний, вывалить их разом в личку менеджеру — верный
 * способ добиться, чтобы он выключил уведомления от бота совсем.
 */
const BATCH = 25;

export async function POST(request: Request) {
  const expected = process.env.REMINDER_SWEEP_SECRET;
  const provided = request.headers.get("x-devuz-sweep");

  if (!expected || provided !== expected) {
    return new Response("forbidden", { status: 403 });
  }

  const db = serviceClient();
  if (!db) return Response.json({ ok: false, error: "no-db" }, { status: 503 });

  const now = new Date().toISOString();
  const { data, error } = await db
    .from("lead_reminders")
    .select("id, lead_id, staff_id, due_at, note, kind")
    .lte("due_at", now)
    .is("sent_at", null)
    .is("done_at", null)
    .is("cancelled_at", null)
    .order("due_at", { ascending: true })
    .limit(BATCH);

  if (error) {
    console.error("reminders: не прочитал очередь", error.message);
    return Response.json({ ok: false, error: "read" }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;

  for (const reminder of data ?? []) {
    const [staff, lead] = await Promise.all([
      db
        .from("staff")
        .select("telegram_user_id, is_active")
        .eq("id", reminder.staff_id as string)
        .maybeSingle(),
      db
        .from("leads")
        .select("request_no, company, contact_name, status")
        .eq("id", reminder.lead_id as string)
        .maybeSingle(),
    ]);

    // Сотрудник отключён — напоминание гасим, а не копим: слать в личку
    // человеку, у которого уже нет доступа к панели, незачем.
    if (!staff.data?.is_active) {
      await db
        .from("lead_reminders")
        .update({ cancelled_at: now })
        .eq("id", reminder.id as string);
      skipped += 1;
      continue;
    }

    const who =
      (lead.data?.company as string | null) ||
      (lead.data?.contact_name as string | null) ||
      "без названия";
    const number = (lead.data?.request_no as string | null) ?? String(reminder.lead_id).slice(0, 8);

    const ok = await sendMessage(
      staff.data.telegram_user_id as number,
      [
        "<b>Напоминание по лиду</b>",
        "",
        `<b>${esc(number)}</b> — ${esc(who)}`,
        reminder.note ? esc(String(reminder.note)) : "",
        "",
        `${siteUrl}/admin/leads/${reminder.lead_id}`,
      ]
        .filter(Boolean)
        .join("\n"),
    );

    // Пометка «отправлено» ставится только после успеха. Иначе первый же
    // сбой Telegram молча съедал бы напоминание навсегда.
    if (!ok) continue;

    await db
      .from("lead_reminders")
      .update({ sent_at: new Date().toISOString() })
      .eq("id", reminder.id as string);

    await record("reminder.sent", {
      actorStaffId: reminder.staff_id as string,
      targetType: "lead",
      targetId: reminder.lead_id as string,
      meta: { kind: reminder.kind, due_at: reminder.due_at },
    });

    sent += 1;
  }

  return Response.json({ ok: true, sent, skipped, queued: (data ?? []).length });
}
