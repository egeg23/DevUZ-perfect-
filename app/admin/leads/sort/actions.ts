"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { currentStaff, requestIp } from "@/lib/admin/guard";
import { SKIP_MAX, parseSkip, sortHref } from "@/lib/admin/lead-sort";
import { parseTidyCallback } from "@/lib/admin/lead-tidy";
import { decideTidy } from "@/lib/admin/lead-tidy-store";
import { trashLead } from "@/lib/admin/lead-trash-store";
import { myHref } from "@/lib/admin/hq-my";
import { takeLead } from "@/lib/admin/ownership";
import { opens } from "@/lib/admin/roles";
import { handledLabel, markLeadCards } from "@/lib/qualify/telegram";

/**
 * Решения «Разобрать лиды» (lib/admin/lead-sort.ts). Каждое — тем же путём,
 * что в карточке лида и в боте: takeLead, decideTidy, trashLead. Права
 * проверяют они же. Ответ — следующий лид с результатом плашкой (`?done=`).
 */

const leadOf = (formData: FormData) => {
  const id = String(formData.get("lead") ?? "");
  return /^[0-9a-f-]{36}$/i.test(id) ? id : null;
};

async function who() {
  const staff = await currentStaff();
  if (!staff || !opens(staff, "/admin")) redirect("/admin/login");
  return staff;
}

export async function sortTakeAction(formData: FormData): Promise<void> {
  const staff = await who();
  const leadId = leadOf(formData);
  const skip = parseSkip(String(formData.get("skip") ?? ""));
  if (!leadId) redirect(sortHref("fail", skip));
  const result = await takeLead(leadId, staff, await requestIp());
  if (result.ok) await markLeadCards(leadId, handledLabel("take", staff)).catch(() => {});
  revalidatePath("/admin");
  redirect(sortHref(result.ok ? "taken" : result.reason === "taken" ? "no_yours" : result.reason === "gone" ? "no_gone" : result.reason === "queued" ? "no_queued" : result.reason === "share" ? "no_share" : "fail", skip));
}

export async function sortTrashAction(formData: FormData): Promise<void> {
  const staff = await who();
  const leadId = leadOf(formData);
  const skip = parseSkip(String(formData.get("skip") ?? ""));
  if (!leadId) redirect(sortHref("fail", skip));
  const result = await trashLead(leadId, staff, undefined, "panel");
  revalidatePath("/admin");
  redirect(sortHref(result.ok ? "trashed" : result.reason === "not_yours" || result.reason === "role" ? "no_yours" : result.reason === "gone" ? "no_gone" : "fail", skip));
}

export async function sortTidyAction(formData: FormData): Promise<void> {
  const staff = await who();
  const skip = parseSkip(String(formData.get("skip") ?? ""));
  const parsed = parseTidyCallback(["lt", String(formData.get("answer") ?? ""), String(formData.get("lead") ?? "")]);
  // «⏳» без срока экран не присылает: срок — кнопками рядом.
  if (!parsed || parsed.answer === "wait") redirect(sortHref("fail", skip));
  const decision = await decideTidy(staff, parsed.answer, parsed.leadId, "panel", new Date(), await requestIp());
  revalidatePath("/admin");
  if (decision.result !== "ok") {
    redirect(sortHref(decision.result === "forbidden" ? "no_yours" : decision.result === "gone" ? "no_gone" : decision.result === "nowait" ? "no_wait" : "fail", skip));
  }
  // «Выиграли» — сразу «Завести проект», как на «Главной» и в боте.
  if (decision.answer === "won") redirect(myHref.project(parsed.leadId));
  redirect(sortHref(decision.answer === "term" ? "term" : decision.answer, skip));
}

export async function sortSkipAction(formData: FormData): Promise<void> {
  await who();
  const leadId = leadOf(formData);
  const skip = parseSkip(String(formData.get("skip") ?? ""));
  redirect(sortHref("skipped", leadId ? [...skip, leadId].slice(-SKIP_MAX) : skip));
}
