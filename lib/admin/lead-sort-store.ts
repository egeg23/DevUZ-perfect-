import type { SortFree } from "@/lib/admin/lead-sort";
import type { IdleLead } from "@/lib/admin/lead-tidy";
import { loadIdle } from "@/lib/admin/lead-tidy-store";
import { serviceClient } from "@/lib/supabase";

/** Ничьих новых за заход — больше за раз не разбирают. */
const FREE_LIMIT = 300;

/**
 * Строки «Разобрать лиды» (lib/admin/lead-sort.ts): свои лиды «в работе» с
 * последним движением — тем же loadIdle, что бот «Порядок в лидах», — и
 * ничьи новые (общая очередь). Без модели.
 */
export async function loadSort(staffId: string): Promise<{ idle: IdleLead[]; free: SortFree[]; offline: boolean }> {
  const db = serviceClient();
  if (!db) return { idle: [], free: [], offline: true };
  const [idle, freeRes] = await Promise.all([
    loadIdle([staffId]).catch(() => [] as IdleLead[]),
    db
      .from("leads")
      .select("id, created_at, company, contact_name, request_no, summary, source, priority")
      .eq("status", "new")
      .is("assigned_staff_id", null)
      .order("created_at", { ascending: true })
      .limit(FREE_LIMIT),
  ]);
  if (freeRes.error) console.error("разобрать лиды: не прочитал ничьи", freeRes.error.message);
  const free = (freeRes.data ?? []).map((l) => {
    const request = (l.summary as { request?: unknown } | null)?.request;
    return {
      id: String(l.id),
      label: String(l.company || l.contact_name || (l.request_no ? `№${l.request_no}` : "—")),
      requestNo: (l.request_no as string | null) ?? null,
      createdAt: String(l.created_at),
      request: typeof request === "string" && request.trim() ? request.trim() : null,
      source: (l.source as string | null) ?? null,
      priority: (l.priority as string | null) ?? null,
    };
  });
  return { idle, free, offline: Boolean(freeRes.error) };
}
