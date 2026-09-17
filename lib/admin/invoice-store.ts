import { record } from "@/lib/admin/audit";
import { contractById } from "@/lib/admin/contract-store";
import {
  BLOCK_TEXT,
  canIssue,
  dueDate,
  invoiceNumber,
  stageAmountUsd,
  type Invoice,
} from "@/lib/admin/invoices";
import type { Staff } from "@/lib/admin/session";
import { hashAccessToken, newAccessToken } from "@/lib/store/access";
import { sellerBank } from "@/lib/store/requisites";
import { serviceClient } from "@/lib/supabase";

/**
 * Счета по договору: то, что ходит в базу.
 *
 * Первый счёт выставляется не кнопкой, а подтверждением договора. Владелец
 * просил, чтобы счёт «шёл вместе с подписанным договором», и отдельная
 * кнопка «а теперь выставьте счёт» — это ровно тот шаг, который забывают, а
 * потом выясняют, почему клиент не платит.
 */

const COLUMNS = "id, contract_id, stage_index, number, amount_usd, issued_at, due_at, paid_at";

function shape(row: Record<string, unknown>): Invoice {
  return {
    id: String(row.id),
    contract_id: String(row.contract_id),
    stage_index: Number(row.stage_index),
    number: String(row.number),
    amount_usd: Number(row.amount_usd),
    issued_at: String(row.issued_at),
    due_at: String(row.due_at),
    paid_at: (row.paid_at as string | null) ?? null,
  };
}

export async function invoicesFor(contractId: string): Promise<Invoice[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db
    .from("contract_invoices")
    .select(COLUMNS)
    .eq("contract_id", contractId)
    .order("stage_index", { ascending: true });
  return (data ?? []).map((row) => shape(row as unknown as Record<string, unknown>));
}

export async function invoiceById(id: string): Promise<Invoice | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("contract_invoices").select(COLUMNS).eq("id", id).maybeSingle();
  return data ? shape(data as unknown as Record<string, unknown>) : null;
}

export type IssueResult = { ok: true; id: string } | { ok: false; why: string };

/**
 * Выставить счёт на этап.
 *
 * `staff` может быть null: первый счёт рождается вместе с подтверждением
 * договора, и у этого действия есть автор — владелец, — но вызывается оно
 * из хранилища договоров, а не из формы.
 */
export async function issueInvoice(
  contractId: string,
  stageIndex: number,
  staff: Staff | null,
  today = new Date().toISOString().slice(0, 10),
): Promise<IssueResult> {
  const db = serviceClient();
  if (!db) return { ok: false, why: "База недоступна." };

  const contract = await contractById(contractId);
  if (!contract) return { ok: false, why: "Договора уже нет." };

  const bank = sellerBank();
  const issued = (await invoicesFor(contractId)).map((invoice) => invoice.stage_index);

  const block = canIssue({
    status: contract.status,
    stages: contract.stages,
    stageIndex,
    issuedStages: issued,
    hasBank: Boolean(bank),
  });
  if (block !== "ok") return { ok: false, why: BLOCK_TEXT[block] };

  const amount = stageAmountUsd(contract.amount_usd, contract.stages, stageIndex);
  if (!(amount > 0)) return { ok: false, why: "Сумма этапа вышла нулевой — проверьте доли." };

  const { data, error } = await db
    .from("contract_invoices")
    .insert({
      contract_id: contractId,
      stage_index: stageIndex,
      number: invoiceNumber(contract.number, stageIndex),
      amount_usd: amount,
      issued_at: today,
      due_at: dueDate(today, bank!.paymentDays),
      issued_by: staff?.id ?? null,
    })
    .select("id")
    .maybeSingle();

  // Уникальный индекс по этапу: два счёта на одну работу — это два платежа,
  // и лишний выяснится при сверке, а не при выставлении.
  if (error || !data) return { ok: false, why: "Счёт не записался — возможно, он уже есть." };

  if (staff) {
    await record("invoice.issued", {
      actorStaffId: staff.id,
      targetType: "contract",
      targetId: contractId,
      meta: { stage: stageIndex, amount },
    });
  }
  return { ok: true, id: String(data.id) };
}

export async function markPaid(id: string, staff: Staff): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  const { data } = await db
    .from("contract_invoices")
    .update({ paid_at: new Date().toISOString() })
    .eq("id", id)
    .is("paid_at", null)
    .select("contract_id, number")
    .maybeSingle();

  if (data) {
    await record("invoice.paid", {
      actorStaffId: staff.id,
      targetType: "contract",
      targetId: String(data.contract_id),
      meta: { number: String(data.number) },
    });
  }
}

/**
 * Ссылка для заказчика — одна на договор.
 *
 * В базе хеш, а не токен: дамп не должен открывать чужие договоры. Отсюда
 * следствие, которое видно менеджеру: показать ссылку второй раз нельзя,
 * можно только выпустить новую — и старая тут же перестаёт работать.
 */
export async function issueAccessLink(contractId: string, staff: Staff): Promise<string | null> {
  const db = serviceClient();
  if (!db) return null;

  const token = newAccessToken();
  const { error } = await db
    .from("contracts")
    .update({ access_hash: hashAccessToken(token) })
    .eq("id", contractId);
  if (error) return null;

  await record("contract.link_issued", {
    actorStaffId: staff.id,
    targetType: "contract",
    targetId: contractId,
  });
  return token;
}

/** Договор по ссылке заказчика. Ищем по хешу — самого токена в базе нет. */
export async function contractByToken(token: string) {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db
    .from("contracts")
    .select("id")
    .eq("access_hash", hashAccessToken(token))
    .maybeSingle();
  if (!data) return null;
  return contractById(String(data.id));
}
