"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ContractStage } from "@/content/contract";
import { requireAdmin, requireStaff } from "@/lib/admin/guard";
import {
  approveContract,
  createContract,
  updateDraft,
  voidContract,
} from "@/lib/admin/contract-store";
import {
  attachEstimate,
  attachSignedScan,
  returnForRevision,
  sendForSignature,
  setDeadline,
} from "@/lib/admin/contract-store";
import { saveSignature } from "@/lib/admin/signature";
import { siteUrl } from "@/lib/seo";

/**
 * Этапы приходят из формы тремя параллельными списками полей.
 *
 * Разбираются в объекты здесь и с отбраковкой пустых строк: человек
 * добавляет строки кнопкой и часть оставляет незаполненной. Пустая строка,
 * доехавшая до базы, ломает сумму долей и выясняется это при подтверждении.
 */
function stagesFrom(formData: FormData): ContractStage[] {
  const titles = formData.getAll("stage_title").map(String);
  const percents = formData.getAll("stage_percent").map(String);
  const days = formData.getAll("stage_days").map(String);

  const out: ContractStage[] = [];
  for (let i = 0; i < titles.length; i++) {
    const title = titles[i]?.trim() ?? "";
    const percent = Number(percents[i]);
    const workdays = Number.parseInt(days[i] ?? "", 10);
    if (!title && !Number.isFinite(percent)) continue;
    out.push({
      title,
      percent: Number.isFinite(percent) ? percent : 0,
      workdays: Number.isFinite(workdays) ? workdays : 0,
    });
  }
  return out;
}

function amountFrom(value: FormDataEntryValue | null): number {
  const parsed = Number(String(value ?? "").replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function prepareContract(formData: FormData) {
  const staff = await requireStaff();
  const projectId = String(formData.get("project_id") ?? "");

  const result = await createContract(
    {
      projectId,
      signedDate: String(formData.get("signed_date") ?? "").slice(0, 10),
      clientName: String(formData.get("client_name") ?? ""),
      clientDetails: String(formData.get("client_details") ?? ""),
      subject: String(formData.get("subject") ?? ""),
      amountUsd: amountFrom(formData.get("amount")),
      stages: stagesFrom(formData),
    },
    staff,
  );

  revalidatePath(`/admin/projects/${projectId}`);
  if (result.ok) redirect(`/admin/contracts/${result.id}`);
  redirect(`/admin/projects/${projectId}?contract=${result.why}`);
}

export async function editContract(formData: FormData) {
  const staff = await requireStaff();
  const id = String(formData.get("id") ?? "");

  const result = await updateDraft(
    id,
    {
      signedDate: String(formData.get("signed_date") ?? "").slice(0, 10) || undefined,
      clientName: String(formData.get("client_name") ?? ""),
      clientDetails: String(formData.get("client_details") ?? ""),
      subject: String(formData.get("subject") ?? ""),
      amountUsd: amountFrom(formData.get("amount")),
      stages: stagesFrom(formData),
    },
    staff,
  );

  revalidatePath(`/admin/contracts/${id}`);
  redirect(result.ok ? `/admin/contracts/${id}` : `/admin/contracts/${id}?error=${result.why}`);
}

/**
 * Подтверждение владельцем.
 *
 * `requireAdmin` здесь дублирует проверку внутри `approveContract`, и это
 * намеренно: одна проверка отвечает за «кто вообще вошёл», вторая — за
 * «кому можно это действие». Убрать любую из них можно только вместе с
 * пониманием, зачем она стояла.
 */
export async function confirmContract(formData: FormData) {
  const staff = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const result = await approveContract(id, staff);

  revalidatePath(`/admin/contracts/${id}`);
  if (result.ok) redirect(`/admin/contracts/${id}`);
  // Список незаполненного уезжает в адрес, чтобы владелец увидел всё сразу,
  // а не выяснял по одному.
  const detail = result.problems?.length ? `&detail=${encodeURIComponent(result.problems.join(" · "))}` : "";
  redirect(`/admin/contracts/${id}?error=${result.why}${detail}`);
}

export async function cancelContract(formData: FormData) {
  const staff = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const result = await voidContract(id, String(formData.get("reason") ?? ""), staff);
  revalidatePath(`/admin/contracts/${id}`);
  redirect(result.ok ? `/admin/contracts/${id}` : `/admin/contracts/${id}?error=${result.why}`);
}

/** Загрузка подписи. Только владелец: это его подпись. */
export async function uploadSignature(formData: FormData) {
  await requireAdmin();
  const file = formData.get("signature");
  if (!(file instanceof File) || file.size === 0) redirect("/admin/contracts?error=nofile");

  const result = await saveSignature(await file.arrayBuffer());
  revalidatePath("/admin/contracts");
  redirect(result.ok ? "/admin/contracts?saved=1" : `/admin/contracts?error=${encodeURIComponent(result.why ?? "")}`);
}

/* ── Смета, срок, отправка на подпись, скан ─────────────────────────────── */


async function fileFrom(formData: FormData, field: string) {
  const file = formData.get(field);
  if (!(file instanceof File) || file.size === 0) return null;
  // Два мегабайта на смету и двадцать на скан: скан это фотографии страниц,
  // и они тяжелее. Больше — почти всегда снято без сжатия, и такое проще
  // переснять, чем хранить.
  const limit = field === "signed" ? 20 * 1024 * 1024 : 5 * 1024 * 1024;
  if (file.size > limit) return null;
  return { name: file.name, bytes: await file.arrayBuffer() };
}

export async function uploadEstimate(formData: FormData) {
  const staff = await requireStaff();
  const id = String(formData.get("id") ?? "");
  const file = await fileFrom(formData, "estimate");
  if (!file) redirect(`/admin/contracts/${id}?error=nofile`);

  const result = await attachEstimate(id, file, staff);
  revalidatePath(`/admin/contracts/${id}`);
  // Подсказка разбора уезжает в адрес: менеджер должен увидеть, почему
  // строки не подтянулись, а не гадать, почему смета «пустая».
  const hint = "hint" in result && result.hint ? `?hint=${encodeURIComponent(result.hint)}` : "";
  redirect(result.ok ? `/admin/contracts/${id}${hint}` : `/admin/contracts/${id}?error=${result.why}`);
}

export async function saveDeadline(formData: FormData) {
  const staff = await requireStaff();
  const id = String(formData.get("id") ?? "");
  const result = await setDeadline(id, String(formData.get("deadline") ?? ""), staff);
  revalidatePath(`/admin/contracts/${id}`);
  redirect(result.ok ? `/admin/contracts/${id}` : `/admin/contracts/${id}?error=${result.why}`);
}

/** Отправить владельцу на подпись — с уведомлением в Telegram. */
export async function sendToOwner(formData: FormData) {
  const staff = await requireStaff();
  const id = String(formData.get("id") ?? "");
  const result = await sendForSignature(id, siteUrl, staff);

  revalidatePath(`/admin/contracts/${id}`);
  if (!result.ok) {
    const detail = result.problems?.length
      ? `&detail=${encodeURIComponent(result.problems.join(" · "))}`
      : "";
    redirect(`/admin/contracts/${id}?error=${result.why}${detail}`);
  }
  // Неушедшее уведомление — не повод молчать: владелец не узнает о договоре,
  // а менеджер будет думать, что отправил.
  redirect(`/admin/contracts/${id}?sent=${result.notified ? "1" : "silent"}`);
}

export async function returnContract(formData: FormData) {
  const staff = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const result = await returnForRevision(id, staff);
  revalidatePath(`/admin/contracts/${id}`);
  redirect(result.ok ? `/admin/contracts/${id}` : `/admin/contracts/${id}?error=${result.why}`);
}

export async function uploadSignedScan(formData: FormData) {
  const staff = await requireStaff();
  const id = String(formData.get("id") ?? "");
  const file = await fileFrom(formData, "signed");
  if (!file) redirect(`/admin/contracts/${id}?error=nofile`);

  const result = await attachSignedScan(id, file, staff);
  revalidatePath(`/admin/contracts/${id}`);
  redirect(result.ok ? `/admin/contracts/${id}?signed=1` : `/admin/contracts/${id}?error=${result.why}`);
}
