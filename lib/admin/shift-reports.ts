import { esc, sendMessage } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

/**
 * Отчёты плановых смен — владельцу в Telegram.
 *
 * Смена (разборы, эксперимент) пишет строку в `shift_reports`; бот на
 * сервере доносит её. Так у смены появляется голос, которого у неё не было:
 * токена бота в плановой сессии нет, а правило «напиши владельцу» стояло.
 *
 * Отправляется всё неотправленное, старое первым; после доставки строка
 * помечается временем. Не доставилось — останется до следующего прохода,
 * свип ходит каждые пять минут.
 */

const BATCH = 10;

export type ShiftReport = { id: string; shift: string; body: string; created_at: string };

export const SHIFT_TITLE: Record<string, string> = {
  razbor: "Смена разборов",
  experiment: "Эксперимент 300→2000",
};

export function renderShiftReport(report: ShiftReport): string {
  const title = SHIFT_TITLE[report.shift] ?? report.shift;
  return `<b>${esc(title)}</b>\n${esc(report.body)}`;
}

async function ownerChatId(): Promise<number | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("staff").select("telegram_user_id").eq("role", "admin").eq("is_active", true).limit(1).maybeSingle();
  const id = Number(data?.telegram_user_id);
  return Number.isFinite(id) && id !== 0 ? id : null;
}

export async function sendShiftReports(): Promise<{ sent: number; failed: number }> {
  const db = serviceClient();
  if (!db) return { sent: 0, failed: 0 };

  const { data } = await db
    .from("shift_reports")
    .select("id, shift, body, created_at")
    .is("notified_at", null)
    .order("created_at", { ascending: true })
    .limit(BATCH);
  const pending = (data ?? []) as ShiftReport[];
  if (!pending.length) return { sent: 0, failed: 0 };

  const chat = await ownerChatId();
  if (!chat) return { sent: 0, failed: pending.length };

  let sent = 0;
  let failed = 0;
  for (const report of pending) {
    const ok = await sendMessage(chat, renderShiftReport(report));
    if (!ok) {
      failed += 1;
      continue;
    }
    await db.from("shift_reports").update({ notified_at: new Date().toISOString() }).eq("id", report.id);
    sent += 1;
  }
  return { sent, failed };
}
