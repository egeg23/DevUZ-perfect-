import { record } from "@/lib/admin/audit";
import { contractById, ownerChatId } from "@/lib/admin/contract-store";
import {
  BLOCK_TEXT,
  canIssue,
  dueDate,
  invoiceNumber,
  invoicePaymentNote,
  invoicePurpose,
  stageAmountUsd,
  type Invoice,
} from "@/lib/admin/invoices";
import { addPayment, removePayment } from "@/lib/admin/ledger";
import { TASHKENT_OFFSET_MS } from "@/lib/admin/pulse";
import type { Staff } from "@/lib/admin/session";
import { sendMessage } from "@/lib/qualify/telegram";
import { siteUrl } from "@/lib/seo";
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

const COLUMNS = "id, contract_id, stage_index, number, amount_usd, issued_at, due_at, paid_at, paid_by, payment_id";

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
    paid_by: (row.paid_by as string | null) ?? null,
    payment_id: (row.payment_id as string | null) ?? null,
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

export type PaidResult =
  | { ok: true; confirmed: boolean }
  | { ok: false; why: string };

/** Сегодня по Ташкенту — дата платежа в проекте. */
function tashkentToday(now = Date.now()): string {
  return new Date(now + TASHKENT_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * «Оплачен»: отметку ставит тот, кто увидел деньги в банке.
 *
 * Отметил владелец — это сразу и платёж в проекте: деньги появляются в
 * «Деньгах», начисления команде размораживаются, второй раз записывать
 * платёж в карточке проекта не нужно. Отметил сотрудник — платёж ждёт
 * владельца: подтверждённый платёж открывает начисления, а это решение
 * одного человека (см. addPayment). Владельцу сразу приходит сообщение со
 * ссылкой на договор, где подтверждение — одна кнопка.
 */
export async function markPaid(id: string, staff: Staff, ip: string): Promise<PaidResult> {
  const db = serviceClient();
  if (!db) return { ok: false, why: "База недоступна." };
  const { data } = await db
    .from("contract_invoices")
    .update({ paid_at: new Date().toISOString(), paid_by: staff.id })
    .eq("id", id)
    .is("paid_at", null)
    .select("contract_id, number, amount_usd")
    .maybeSingle();
  if (!data) return { ok: false, why: "Счёт уже отмечен оплаченным или его нет." };

  const contractId = String(data.contract_id);
  await record("invoice.paid", {
    actorStaffId: staff.id,
    targetType: "contract",
    targetId: contractId,
    meta: { number: String(data.number) },
  });

  if (staff.role === "admin") {
    const confirmed = await confirmInvoicePayment(id, staff, ip);
    return confirmed.ok ? { ok: true, confirmed: true } : confirmed;
  }

  // Сообщение владельцу не должно ронять саму отметку.
  try {
    await tellOwnerAboutPayment(contractId, String(data.number), Number(data.amount_usd), staff);
  } catch (error) {
    console.error("invoices: сообщение владельцу об оплате", error);
  }
  return { ok: true, confirmed: false };
}

async function tellOwnerAboutPayment(contractId: string, number: string, amountUsd: number, staff: Staff) {
  const chat = await ownerChatId();
  if (!chat) return;
  const contract = await contractById(contractId);
  const lines = [
    `💰 ${staff.display_name} отметил оплату`,
    ``,
    `Счёт № ${number} — $${amountUsd.toLocaleString("ru-RU")}`,
    contract ? `Заказчик: ${contract.client_name}` : null,
    ``,
    `Подтвердите в договоре — платёж попадёт в «Деньги» и откроет начисления команде.`,
    `${siteUrl}/admin/contracts/${contractId}`,
  ].filter((line): line is string => line !== null);
  await sendMessage(chat, lines.join("\n"));
}

/**
 * Подтвердить оплату счёта — записать платёж в проект. Только владелец.
 *
 * Сначала платёж, потом ссылка на него у счёта, причём ссылка ставится
 * только туда, где её ещё нет. Два нажатия подряд (или два окна) без этого
 * записали бы два платежа; с этим второй платёж находит счёт уже занятым и
 * удаляется сам.
 */
export async function confirmInvoicePayment(invoiceId: string, staff: Staff, ip: string): Promise<PaidResult> {
  if (staff.role !== "admin") return { ok: false, why: "Платёж подтверждает владелец." };
  const db = serviceClient();
  if (!db) return { ok: false, why: "База недоступна." };

  const invoice = await invoiceById(invoiceId);
  if (!invoice) return { ok: false, why: "Счёта уже нет." };
  if (!invoice.paid_at) return { ok: false, why: "Счёт не отмечен оплаченным." };
  if (invoice.payment_id) return { ok: true, confirmed: true };

  const contract = await contractById(invoice.contract_id);
  if (!contract) return { ok: false, why: "Договора уже нет." };

  const payment = await addPayment(
    contract.project_id,
    {
      amountUsd: Math.round(invoice.amount_usd),
      paidOn: tashkentToday(),
      purpose: invoicePurpose(invoice.stage_index, contract.stages.length),
      note: invoicePaymentNote(invoice.number, contract.number),
    },
    staff,
    ip,
  );
  if (!payment.ok || !payment.paymentId) return { ok: false, why: "Платёж в проект не записался. Попробуйте ещё раз." };

  const { data: linked } = await db
    .from("contract_invoices")
    .update({ payment_id: payment.paymentId })
    .eq("id", invoiceId)
    .is("payment_id", null)
    .select("id")
    .maybeSingle();
  if (!linked) {
    // Кто-то успел раньше — наш платёж лишний.
    await removePayment(payment.paymentId, staff, ip);
    return { ok: true, confirmed: true };
  }

  await record("invoice.payment_confirmed", {
    actorStaffId: staff.id,
    targetType: "contract",
    targetId: invoice.contract_id,
    ip,
    meta: { number: invoice.number, payment_id: payment.paymentId, amount_usd: Math.round(invoice.amount_usd) },
  });
  return { ok: true, confirmed: true };
}

/**
 * «Оплаты не было» — снять ошибочную отметку. Только владелец и только пока
 * платёж не подтверждён: подтверждённый сначала удаляется в карточке
 * проекта, как любой другой платёж.
 */
export async function unmarkPaid(invoiceId: string, staff: Staff, ip: string): Promise<PaidResult> {
  if (staff.role !== "admin") return { ok: false, why: "Снять отметку может владелец." };
  const db = serviceClient();
  if (!db) return { ok: false, why: "База недоступна." };
  const { data } = await db
    .from("contract_invoices")
    .update({ paid_at: null, paid_by: null })
    .eq("id", invoiceId)
    .is("payment_id", null)
    .select("contract_id, number")
    .maybeSingle();
  if (!data) return { ok: false, why: "Платёж по счёту уже подтверждён — удалите его в карточке проекта." };

  await record("invoice.unpaid", {
    actorStaffId: staff.id,
    targetType: "contract",
    targetId: String(data.contract_id),
    ip,
    meta: { number: String(data.number) },
  });
  return { ok: true, confirmed: false };
}

export type AwaitingInvoice = Invoice & { contract_number: string; paid_by_name: string | null };

/** Оплаченные, но не подтверждённые счета проекта — для карточки проекта. */
export async function awaitingInvoicesFor(projectId: string): Promise<AwaitingInvoice[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db
    .from("contract_invoices")
    .select(`${COLUMNS}, contract:contract_id!inner (number, project_id), payer:paid_by (display_name)`)
    .eq("contract.project_id", projectId)
    .not("paid_at", "is", null)
    .is("payment_id", null)
    .order("paid_at", { ascending: true });
  return (data ?? []).map((row) => {
    const r = row as unknown as Record<string, unknown> & {
      contract: { number: string } | null;
      payer: { display_name: string } | null;
    };
    return { ...shape(r), contract_number: r.contract?.number ?? "", paid_by_name: r.payer?.display_name ?? null };
  });
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
