"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { record } from "@/lib/admin/audit";
import { requestIp, requireRole, requireStaff } from "@/lib/admin/guard";
import { textProblems } from "@/lib/admin/letter-texts";
import { liveTexts, makeCommon, removeText, saveText } from "@/lib/admin/letter-texts-store";

/**
 * Тексты писем и A/B (lib/admin/letter-texts.ts).
 *
 * Свой текст правит каждый — это его касания. Общие тексты команды и «сделать
 * общим» — руководитель и владелец: общими пишут все, у кого своих нет.
 */

const PAGE = "/admin/prospect/texts";

const slotOf = (value: FormDataEntryValue | null): "a" | "b" => (value === "b" ? "b" : "a");

/** Чей текст: «common» — общий; иначе свой у того, кто нажал. */
async function ownerFor(formData: FormData): Promise<{ owner: string | null; by: string }> {
  if (formData.get("owner") === "common") {
    const staff = await requireRole("admin", "head");
    return { owner: null, by: staff.id };
  }
  const staff = await requireStaff();
  return { owner: staff.id, by: staff.id };
}

export async function saveTextAction(formData: FormData) {
  const staff = await requireStaff();
  const { owner, by } = await ownerFor(formData);
  const slot = slotOf(formData.get("slot"));
  const body = String(formData.get("body") ?? "").trim().slice(0, 1500);
  const uz = String(formData.get("body_uz") ?? "").trim().slice(0, 1500);

  // Проверка — та же, что перед отправкой, на образце: плохой текст не
  // доходит до клиента ни разу, а не отбивается на сотом касании.
  const problems = [...textProblems(body, staff.display_name), ...(uz ? textProblems(uz, staff.display_name) : [])];
  if (problems.length) {
    const codes = JSON.stringify(problems.map((p) => [p.code, ...(p.args ?? [])]));
    redirect(`${PAGE}?e=${encodeURIComponent(codes)}#${owner ? "mine" : "common"}`);
  }

  const ok = await saveText({ owner, slot, body, body_uz: uz || null, by });
  await record("letter_text.saved", { actorStaffId: by, targetType: "letter_text", targetId: slot, ip: await requestIp(), meta: { common: owner === null } });
  revalidatePath(PAGE);
  redirect(`${PAGE}?${ok ? "saved=1" : "failed=1"}#${owner ? "mine" : "common"}`);
}

export async function removeTextAction(formData: FormData) {
  const { owner, by } = await ownerFor(formData);
  const slot = slotOf(formData.get("slot"));
  await removeText(owner, slot);
  await record("letter_text.removed", { actorStaffId: by, targetType: "letter_text", targetId: slot, ip: await requestIp(), meta: { common: owner === null } });
  revalidatePath(PAGE);
  redirect(`${PAGE}?removed=1#${owner ? "mine" : "common"}`);
}

/** Победитель остаётся, второй уходит: дальше все касания — лучшим текстом. */
export async function keepTextAction(formData: FormData) {
  const { owner, by } = await ownerFor(formData);
  const keep = slotOf(formData.get("slot"));
  await removeText(owner, keep === "a" ? "b" : "a");
  await record("letter_text.kept", { actorStaffId: by, targetType: "letter_text", targetId: keep, ip: await requestIp(), meta: { common: owner === null } });
  revalidatePath(PAGE);
  redirect(`${PAGE}?removed=1#${owner ? "mine" : "common"}`);
}

/** Текст менеджера — в общие. Только руководитель и владелец. */
export async function makeCommonAction(formData: FormData) {
  const staff = await requireRole("admin", "head");
  const id = String(formData.get("text") ?? "");
  const slot = slotOf(formData.get("slot"));
  // Только живой текст: архивный уже никто не пишет, и «общим» он стал бы по ошибке.
  const live = (await liveTexts()).some((t) => t.id === id);
  const ok = live ? await makeCommon(id, slot, staff.id) : false;
  await record("letter_text.made_common", { actorStaffId: staff.id, targetType: "letter_text", targetId: id, ip: await requestIp(), meta: { slot } });
  revalidatePath(PAGE);
  redirect(`${PAGE}?${ok ? "saved=1" : "failed=1"}#common`);
}
