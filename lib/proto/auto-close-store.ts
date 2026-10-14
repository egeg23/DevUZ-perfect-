import { record } from "@/lib/admin/audit";
import { offerReaders } from "@/lib/admin/mockup-offer-bot";
import { LATE_MS, autoCloseAt, closeDue, closedDigest, closedText, CODE_CALLBACK } from "@/lib/proto/auto-close";
import { firstSends, inputOf, type FirstSend, type ProtoRow } from "@/lib/proto/auto-close-read";
import { esc, sendMessage, sendWithRows } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

/**
 * Макет открыт 24 часа, потом — по паролю (lib/proto/auto-close.ts). Из
 * свипа раз в пять минут, без модели.
 *
 * Закрытие — условное (closed_at is null): второй проход свипа тот же
 * макет второй раз не закроет и строку второй раз не пришлёт.
 */

/** Кто отправлял: хозяин лида, потом автор касания. Не знаем — null. */
async function senderChat(sent: FirstSend | undefined, protoProspect: string | null): Promise<number | null> {
  const db = serviceClient();
  if (!db) return null;
  let staffId: string | null = null;
  if (sent?.lead_id) {
    const { data } = await db.from("leads").select("assigned_staff_id").eq("id", sent.lead_id).maybeSingle();
    staffId = (data?.assigned_staff_id as string | null) ?? null;
  }
  const prospect = sent?.prospect_id ?? protoProspect;
  if (!staffId && prospect) {
    const { data } = await db.from("prospects").select("touched_by").eq("id", prospect).maybeSingle();
    staffId = (data?.touched_by as string | null) ?? null;
  }
  if (!staffId) return null;
  const { data: s } = await db.from("staff").select("telegram_user_id, is_active").eq("id", staffId).maybeSingle();
  const chat = Number(s?.telegram_user_id);
  return s?.is_active && Number.isFinite(chat) && chat !== 0 ? chat : null;
}

export type AutoCloseRun = { closed: number; told: number };

export async function runProtoAutoClose(now: Date = new Date()): Promise<AutoCloseRun> {
  const run: AutoCloseRun = { closed: 0, told: 0 };
  const db = serviceClient();
  if (!db) return run;
  const { data, error } = await db
    .from("protos")
    .select("id, name, prospect_id, auto, closed_at, opened_at, created_at, lock:facts->>lock, lockAt:facts->>lockAt")
    .neq("status", "draft")
    .is("closed_at", null)
    .or("auto.is.null,auto.eq.false")
    .limit(1000);
  if (error) {
    console.error("макеты, 24 часа: не прочитал прототипы", error.message);
    return run;
  }
  const rows = (data ?? []) as ProtoRow[];
  if (!rows.length) return run;
  const sends = await firstSends(rows.map((p) => `p:${p.id}`));

  const late: string[] = [];
  for (const p of rows) {
    const sent = sends.get(`p:${p.id}`);
    const input = inputOf(p, sent);
    if (!closeDue(input, now)) continue;
    const { data: claimed } = await db
      .from("protos")
      .update({ closed_at: now.toISOString(), auto_closed_at: now.toISOString() })
      .eq("id", p.id)
      .is("closed_at", null)
      .select("id");
    if (!claimed?.length) continue;
    run.closed += 1;
    await record("mockup.auto_closed", {
      actorStaffId: null,
      targetType: "proto",
      targetId: p.id,
      meta: { name: p.name, from: sent ? "sent" : p.opened_at ? "opened" : "published" },
      ip: null,
    }).catch(() => {});

    // Старый хвост (первый проход правила) — одной сводкой ниже.
    const due = autoCloseAt(input) ?? now.getTime();
    if (now.getTime() - due > LATE_MS) {
      late.push(esc(p.name));
      continue;
    }
    const rowsBtn = [[{ text: "🔑 Сгенерировать пароль", callback_data: `${CODE_CALLBACK}:${p.id}` }]];
    const chat = await senderChat(sent, p.prospect_id);
    const chats = chat ? [chat] : (await offerReaders()).map((r) => r.chat);
    for (const c of chats) await sendWithRows(c, closedText(esc(p.name)), rowsBtn);
    run.told += chats.length;
  }

  const digest = closedDigest(late);
  if (digest) for (const reader of await offerReaders()) await sendMessage(reader.chat, digest);
  return run;
}
