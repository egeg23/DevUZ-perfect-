import { serviceClient } from "@/lib/supabase";
import type { Staff } from "@/lib/admin/session";
import {
  approvesContract,
  contractNumber,
  editable,
  preparesContract,
  problemsBeforeApproval,
  type Contract,
  type ContractStatus,
} from "@/lib/admin/contracts";
import type { ContractStage } from "@/content/contract";

/**
 * Хранение договоров.
 *
 * Права проверяются здесь, а не только в интерфейсе: кнопку можно не
 * нарисовать, а действие всё равно вызвать. Для подтверждения договора это
 * не абстрактная осторожность — там подпись владельца.
 */

export type Result =
  | { ok: true; id: string }
  | { ok: false; why: "forbidden" | "offline" | "invalid" | "notfound" | "locked"; problems?: string[] };

const fail = (why: Exclude<Result, { ok: true }>["why"], problems?: string[]): Result => ({
  ok: false, why, ...(problems ? { problems } : {}),
});

const COLUMNS =
  "id, created_at, project_id, number, signed_date, client_name, client_details, subject, amount_usd, stages, status, prepared_by, prepared_at, approved_by, approved_at, void_reason";

function shape(row: Record<string, unknown>): Contract {
  return {
    id: String(row.id),
    created_at: String(row.created_at),
    project_id: String(row.project_id),
    number: String(row.number),
    signed_date: String(row.signed_date),
    client_name: String(row.client_name),
    client_details: String(row.client_details ?? ""),
    subject: String(row.subject),
    amount_usd: Number(row.amount_usd),
    stages: Array.isArray(row.stages) ? (row.stages as ContractStage[]) : [],
    status: String(row.status) as ContractStatus,
    prepared_by: (row.prepared_by as string | null) ?? null,
    prepared_at: (row.prepared_at as string | null) ?? null,
    approved_by: (row.approved_by as string | null) ?? null,
    approved_at: (row.approved_at as string | null) ?? null,
    void_reason: (row.void_reason as string | null) ?? null,
  };
}

export async function contractById(id: string): Promise<Contract | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("contracts").select(COLUMNS).eq("id", id).maybeSingle();
  return data ? shape(data as Record<string, unknown>) : null;
}

export async function contractsForProject(projectId: string): Promise<Contract[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db
    .from("contracts")
    .select(COLUMNS)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((row) => shape(row as Record<string, unknown>));
}

/**
 * Следующий номер в году — из базы, а не из счётчика в памяти.
 *
 * Два менеджера, готовящие договоры одновременно, иначе получат один номер,
 * и выяснится это тогда, когда оба документа уже у заказчиков.
 */
async function nextNumber(year: number): Promise<string> {
  const db = serviceClient();
  if (!db) return contractNumber(year, 1);
  const { data } = await db
    .from("contracts")
    .select("number")
    .like("number", `DU-${year}-%`)
    .order("number", { ascending: false })
    .limit(1);
  const last = data?.[0]?.number as string | undefined;
  const seq = last ? Number(last.split("-")[2]) : 0;
  return contractNumber(year, (Number.isFinite(seq) ? seq : 0) + 1);
}

export async function createContract(
  fields: {
    projectId: string;
    signedDate: string;
    clientName: string;
    clientDetails: string;
    subject: string;
    amountUsd: number;
    stages: ContractStage[];
  },
  staff: Staff,
): Promise<Result> {
  if (!preparesContract(staff.role)) return fail("forbidden");
  const db = serviceClient();
  if (!db) return fail("offline");

  const number = await nextNumber(Number(fields.signedDate.slice(0, 4)) || new Date().getFullYear());

  const { data, error } = await db
    .from("contracts")
    .insert({
      project_id: fields.projectId,
      number,
      signed_date: fields.signedDate,
      client_name: fields.clientName.trim(),
      client_details: fields.clientDetails.trim(),
      subject: fields.subject.trim(),
      amount_usd: fields.amountUsd,
      stages: fields.stages,
      status: "draft",
      prepared_by: staff.id,
      prepared_at: new Date().toISOString(),
    })
    .select("id")
    .maybeSingle();

  if (error || !data) return fail("invalid");
  return { ok: true, id: String(data.id) };
}

export async function updateDraft(
  id: string,
  fields: Partial<{
    signedDate: string;
    clientName: string;
    clientDetails: string;
    subject: string;
    amountUsd: number;
    stages: ContractStage[];
  }>,
  staff: Staff,
): Promise<Result> {
  if (!preparesContract(staff.role)) return fail("forbidden");
  const current = await contractById(id);
  if (!current) return fail("notfound");
  // Подтверждённый договор не правится: правка — это новый договор, иначе
  // у заказчика на руках окажется не тот текст, который подписывал владелец.
  if (!editable(current)) return fail("locked");

  const db = serviceClient();
  if (!db) return fail("offline");

  const patch: Record<string, unknown> = {};
  if (fields.signedDate) patch.signed_date = fields.signedDate;
  if (fields.clientName !== undefined) patch.client_name = fields.clientName.trim();
  if (fields.clientDetails !== undefined) patch.client_details = fields.clientDetails.trim();
  if (fields.subject !== undefined) patch.subject = fields.subject.trim();
  if (fields.amountUsd !== undefined) patch.amount_usd = fields.amountUsd;
  if (fields.stages !== undefined) patch.stages = fields.stages;

  const { error } = await db.from("contracts").update(patch).eq("id", id);
  return error ? fail("invalid") : { ok: true, id };
}

/**
 * Подтверждение владельцем — момент появления подписи.
 *
 * Три проверки, и ни одну нельзя убрать:
 * роль (подписаться за владельца не может никто другой),
 * состояние (подтвердить дважды — значит потерять, какое подтверждение
 * настоящее), и полнота (подписать документ с несходящимися этапами
 * означает подарить заказчику основание для спора).
 */
export async function approveContract(id: string, staff: Staff): Promise<Result> {
  if (!approvesContract(staff.role)) return fail("forbidden");

  const current = await contractById(id);
  if (!current) return fail("notfound");
  if (current.status !== "draft") return fail("locked");

  const problems = problemsBeforeApproval(current);
  if (problems.length > 0) return fail("invalid", problems.map((p) => p.text));

  const db = serviceClient();
  if (!db) return fail("offline");

  const { error } = await db
    .from("contracts")
    .update({ status: "approved", approved_by: staff.id, approved_at: new Date().toISOString() })
    .eq("id", id)
    // Повторное подтверждение отсекается и на уровне запроса: между чтением
    // и записью мог успеть пройти чужой клик.
    .eq("status", "draft");

  return error ? fail("invalid") : { ok: true, id };
}

/** Отменить договор. Удалять документы нельзя — только помечать. */
export async function voidContract(id: string, reason: string, staff: Staff): Promise<Result> {
  if (!approvesContract(staff.role)) return fail("forbidden");
  if (!reason.trim()) return fail("invalid");
  const db = serviceClient();
  if (!db) return fail("offline");
  const { error } = await db
    .from("contracts")
    .update({ status: "void", void_reason: reason.trim().slice(0, 500) })
    .eq("id", id);
  return error ? fail("invalid") : { ok: true, id };
}
