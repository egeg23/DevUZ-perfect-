import { belowFloor, parseQuote, quoteFor } from "@/lib/admin/quote";
import { serviceClient } from "@/lib/supabase";
import type { Staff } from "@/lib/admin/session";
import {
  acceptsScan,
  approvesContract,
  contractNumber,
  editable,
  preparesContract,
  problemsBeforeApproval,
  returnable,
  sendable,
  type Contract,
  type ContractStatus,
} from "@/lib/admin/contracts";
import type { ContractStage } from "@/content/contract";
import { estimateTotal, parseEstimate, type EstimateItem } from "@/lib/admin/estimate";
import { sendMessage } from "@/lib/qualify/telegram";
import { sellerBank } from "@/lib/store/requisites";

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
  "id, created_at, project_id, number, signed_date, client_name, client_details, subject, amount_usd, stages, status, prepared_by, prepared_at, approved_by, approved_at, void_reason, estimate_path, estimate_name, estimate_items, deadline_text, client_tax_id, client_bank_name, client_account, client_mfo, access_hash, sent_at, sent_by, notified_at, signed_path, signed_at, signed_by";

function shape(row: Record<string, unknown>): Contract {
  return {
    id: String(row.id),
    created_at: String(row.created_at),
    project_id: String(row.project_id),
    number: String(row.number),
    signed_date: String(row.signed_date),
    client_name: String(row.client_name),
    client_details: String(row.client_details ?? ""),
    client_tax_id: (row.client_tax_id as string | null) ?? null,
    client_bank_name: (row.client_bank_name as string | null) ?? null,
    client_account: (row.client_account as string | null) ?? null,
    client_mfo: (row.client_mfo as string | null) ?? null,
    access_hash: (row.access_hash as string | null) ?? null,
    subject: String(row.subject),
    amount_usd: Number(row.amount_usd),
    stages: Array.isArray(row.stages) ? (row.stages as ContractStage[]) : [],
    status: String(row.status) as ContractStatus,
    prepared_by: (row.prepared_by as string | null) ?? null,
    prepared_at: (row.prepared_at as string | null) ?? null,
    approved_by: (row.approved_by as string | null) ?? null,
    approved_at: (row.approved_at as string | null) ?? null,
    void_reason: (row.void_reason as string | null) ?? null,
    estimate_path: (row.estimate_path as string | null) ?? null,
    estimate_name: (row.estimate_name as string | null) ?? null,
    estimate_items: Array.isArray(row.estimate_items) ? (row.estimate_items as EstimateItem[]) : [],
    deadline_text: (row.deadline_text as string | null) ?? null,
    sent_at: (row.sent_at as string | null) ?? null,
    sent_by: (row.sent_by as string | null) ?? null,
    notified_at: (row.notified_at as string | null) ?? null,
    signed_path: (row.signed_path as string | null) ?? null,
    signed_at: (row.signed_at as string | null) ?? null,
    signed_by: (row.signed_by as string | null) ?? null,
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
    clientTaxId: string;
    clientBankName: string;
    clientAccount: string;
    clientMfo: string;
    subject: string;
    amountUsd: number;
    stages: ContractStage[];
  },
  staff: Staff,
): Promise<Result> {
  if (!preparesContract(staff.role)) return fail("forbidden");
  const db = serviceClient();
  if (!db) return fail("offline");

  // Договор на сумму ниже порога сметы менеджер не готовит: порог — это
  // то, под чем проект не окупается, и договор — последнее место, где это
  // ещё можно остановить. Владельцу можно: его решение.
  if (staff.role !== "admin") {
    const { data: project } = await db
      .from("projects")
      .select("quote")
      .eq("id", fields.projectId)
      .maybeSingle();
    const stored = parseQuote(project?.quote);
    const quote = stored ? quoteFor(stored) : null;
    if (belowFloor(fields.amountUsd, quote)) {
      return fail("invalid", [`сумма ниже порога сметы — $${quote!.floorUsd.toLocaleString("en-US")}`]);
    }
  }

  const number = await nextNumber(Number(fields.signedDate.slice(0, 4)) || new Date().getFullYear());

  const { data, error } = await db
    .from("contracts")
    .insert({
      project_id: fields.projectId,
      number,
      signed_date: fields.signedDate,
      client_name: fields.clientName.trim(),
      client_details: fields.clientDetails.trim(),
      client_tax_id: fields.clientTaxId.trim() || null,
      client_bank_name: fields.clientBankName.trim() || null,
      // Пробелы из счёта и МФО убираем сразу: их ставят при наборе
      // группами по четыре, а в платёжку уходит сплошная строка.
      client_account: fields.clientAccount.replace(/\s/g, "") || null,
      client_mfo: fields.clientMfo.replace(/\s/g, "") || null,
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
    clientTaxId: string;
    clientBankName: string;
    clientAccount: string;
    clientMfo: string;
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
  if (fields.clientTaxId !== undefined) patch.client_tax_id = fields.clientTaxId.trim() || null;
  if (fields.clientBankName !== undefined) patch.client_bank_name = fields.clientBankName.trim() || null;
  if (fields.clientAccount !== undefined) patch.client_account = fields.clientAccount.replace(/\s/g, "") || null;
  if (fields.clientMfo !== undefined) patch.client_mfo = fields.clientMfo.replace(/\s/g, "") || null;
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
  // Подтверждается то, что прислали на подпись, а не черновик со стола
  // менеджера: иначе владелец подписывает документ, который никто не
  // объявлял готовым.
  if (current.status !== "pending") return fail("locked");

  const problems = problemsBeforeApproval({
    ...current,
    estimateItems: current.estimate_items,
    deadlineText: current.deadline_text,
    seller: sellerBank(),
  });
  if (problems.length > 0) return fail("invalid", problems.map((p) => p.text));

  const db = serviceClient();
  if (!db) return fail("offline");

  const { error } = await db
    .from("contracts")
    .update({ status: "approved", approved_by: staff.id, approved_at: new Date().toISOString() })
    .eq("id", id)
    // Повторное подтверждение отсекается и на уровне запроса: между чтением
    // и записью мог успеть пройти чужой клик.
    .eq("status", "pending");

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

/* ── Смета, отправка на подпись, скан ───────────────────────────────────── */


const BUCKET = "private";

/** Куда кладём файлы договора. Папка по id: договоров будет много. */
const filePath = (contractId: string, kind: "estimate" | "signed", name: string) =>
  `contracts/${contractId}/${kind}-${name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60)}`;

/**
 * Прикрепить смету.
 *
 * Файл кладётся всегда, строки разбираются когда умеем. Отказ разбора — не
 * ошибка: подсказка возвращается наверх, менеджер вносит строки руками, а
 * файл всё равно становится приложением к договору.
 */
export async function attachEstimate(
  id: string,
  file: { name: string; bytes: ArrayBuffer },
  staff: Staff,
): Promise<Result & { hint?: string; items?: EstimateItem[] }> {
  if (!preparesContract(staff.role)) return fail("forbidden");
  const current = await contractById(id);
  if (!current) return fail("notfound");
  if (!editable(current)) return fail("locked");

  const db = serviceClient();
  if (!db) return fail("offline");

  const path = filePath(id, "estimate", file.name);
  const up = await db.storage.from(BUCKET).upload(path, file.bytes, { upsert: true });
  if (up.error) return fail("invalid");

  const text = new TextDecoder("utf-8").decode(file.bytes);
  const parsed = parseEstimate(text, file.name);
  const items = parsed.ok ? parsed.items : [];

  const patch: Record<string, unknown> = {
    estimate_path: path,
    estimate_name: file.name,
  };
  // Сумма договора берётся из сметы: два числа, которые обязаны совпадать,
  // не должны вводиться дважды.
  if (parsed.ok) {
    patch.estimate_items = items;
    patch.amount_usd = estimateTotal(items);
  }

  const { error } = await db.from("contracts").update(patch).eq("id", id);
  if (error) return fail("invalid");

  return parsed.ok
    ? { ok: true, id, items }
    : { ok: true, id, hint: parsed.hint };
}

/** Строки сметы, внесённые руками, когда файл разобрать не удалось. */
export async function setEstimateItems(
  id: string,
  items: EstimateItem[],
  staff: Staff,
): Promise<Result> {
  if (!preparesContract(staff.role)) return fail("forbidden");
  const current = await contractById(id);
  if (!current) return fail("notfound");
  if (!editable(current)) return fail("locked");

  const db = serviceClient();
  if (!db) return fail("offline");
  const { error } = await db
    .from("contracts")
    .update({ estimate_items: items, amount_usd: estimateTotal(items) })
    .eq("id", id);
  return error ? fail("invalid") : { ok: true, id };
}

export async function setDeadline(id: string, text: string, staff: Staff): Promise<Result> {
  if (!preparesContract(staff.role)) return fail("forbidden");
  const db = serviceClient();
  if (!db) return fail("offline");
  const { error } = await db
    .from("contracts")
    .update({ deadline_text: text.trim().slice(0, 300) })
    .eq("id", id)
    .eq("status", "draft");
  return error ? fail("invalid") : { ok: true, id };
}

/** Личный чат владельца. Берётся из базы, а не из переменной окружения. */
async function ownerChatId(): Promise<number | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db
    .from("staff")
    .select("telegram_user_id")
    .eq("role", "admin")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  const id = Number(data?.telegram_user_id);
  return Number.isFinite(id) && id !== 0 ? id : null;
}

/**
 * Отправить на подпись.
 *
 * Владелец: «После нажатия кнопки „отправить на подпись" мне уже должен
 * придти полный вариант договора со сметой и сроками, уведомление в
 * телеграмм от бота обязательно!»
 *
 * Статус меняется ДО отправки уведомления, и порядок здесь важен. Если
 * сначала слать, а потом писать в базу, то упавшая запись оставит владельца
 * с уведомлением на договор, который остался черновиком и продолжает
 * меняться под ним. Обратный порядок в худшем случае даёт договор,
 * ожидающий подписи, без уведомления — это видно в панели и чинится
 * повторной отправкой.
 */
export async function sendForSignature(
  id: string,
  siteUrl: string,
  staff: Staff,
): Promise<Result & { notified?: boolean }> {
  if (!preparesContract(staff.role)) return fail("forbidden");

  const current = await contractById(id);
  if (!current) return fail("notfound");
  const seller = sellerBank();
  if (!sendable({ ...current, estimateItems: current.estimate_items, deadlineText: current.deadline_text, seller })) {
    const problems = problemsBeforeApproval({
      ...current,
      estimateItems: current.estimate_items,
      deadlineText: current.deadline_text,
      seller,
    });
    return fail(problems.length ? "invalid" : "locked", problems.map((p) => p.text));
  }

  const db = serviceClient();
  if (!db) return fail("offline");

  const { error } = await db
    .from("contracts")
    .update({ status: "pending", sent_at: new Date().toISOString(), sent_by: staff.id })
    .eq("id", id)
    .eq("status", "draft");
  if (error) return fail("invalid");

  const chat = await ownerChatId();
  if (!chat) return { ok: true, id, notified: false };

  const total = estimateTotal(current.estimate_items);
  const lines = [
    `Договор № ${current.number} — на подпись`,
    ``,
    `Заказчик: ${current.client_name}`,
    `Предмет: ${current.subject}`,
    `Сумма: $${total.toLocaleString("ru-RU")}`,
    `Срок: ${current.deadline_text ?? "не указан"}`,
    `Смета: ${current.estimate_items.length} позиций${current.estimate_name ? ` (${current.estimate_name})` : ""}`,
    ``,
    `Подготовил: ${staff.display_name}`,
    `${siteUrl}/admin/contracts/${id}`,
  ];

  const sent = await sendMessage(chat, lines.join("\n"));
  if (sent) await db.from("contracts").update({ notified_at: new Date().toISOString() }).eq("id", id);
  return { ok: true, id, notified: sent };
}

/** Вернуть на доработку. Нормальная часть работы, а не ошибка. */
export async function returnForRevision(id: string, staff: Staff): Promise<Result> {
  if (!approvesContract(staff.role)) return fail("forbidden");
  const current = await contractById(id);
  if (!current) return fail("notfound");
  if (!returnable(current)) return fail("locked");

  const db = serviceClient();
  if (!db) return fail("offline");
  const { error } = await db
    .from("contracts")
    .update({ status: "draft" })
    .eq("id", id)
    .eq("status", "pending");
  return error ? fail("invalid") : { ok: true, id };
}

/**
 * Скан с подписями обеих сторон.
 *
 * Владелец: «После подписания необходимо загрузить менеджеру договор
 * обратно, уже с подписями клиента и моей. Договор останется у нас в базе.»
 */
export async function attachSignedScan(
  id: string,
  file: { name: string; bytes: ArrayBuffer },
  staff: Staff,
): Promise<Result> {
  if (!preparesContract(staff.role)) return fail("forbidden");
  const current = await contractById(id);
  if (!current) return fail("notfound");
  if (!acceptsScan(current)) return fail("locked");

  const db = serviceClient();
  if (!db) return fail("offline");

  const path = filePath(id, "signed", file.name);
  const up = await db.storage.from(BUCKET).upload(path, file.bytes, { upsert: true });
  if (up.error) return fail("invalid");

  const { error } = await db
    .from("contracts")
    .update({
      status: "signed",
      signed_path: path,
      signed_at: new Date().toISOString(),
      signed_by: staff.id,
    })
    .eq("id", id)
    .eq("status", "approved");
  return error ? fail("invalid") : { ok: true, id };
}

/** Байты приложенного файла — для скачивания через защищённый маршрут. */
export async function contractFile(path: string): Promise<ArrayBuffer | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data, error } = await db.storage.from(BUCKET).download(path);
  if (error || !data) return null;
  return await data.arrayBuffer();
}
