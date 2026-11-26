"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { record } from "@/lib/admin/audit";
import { requestIp, requireRole } from "@/lib/admin/guard";
import { createOrg, parseOrgPatch, reissueKey, updateOrg } from "@/lib/callhelper/orgs-admin";
import { STT_FOLDER, STT_KEY, checkStt, parseSttForm } from "@/lib/callhelper/stt-keys";
import { appSecret, saveAppSecret } from "@/lib/secrets";

const PAGE = "/admin/callhelper";
const str = (form: FormData, name: string, max: number) => String(form.get(name) ?? "").trim().slice(0, max);

/**
 * «Сохранить и проверить» ключ распознавания речи. Только владелец
 * (владелец, 25.11.2026: «доступ к этим раздел пока только у меня»).
 * Пишется в хранилище, только если Яндекс ключ принял.
 */
export async function saveSttKey(form: FormData): Promise<void> {
  const staff = await requireRole("admin");
  const parsed = parseSttForm({ key: str(form, "key", 300), folder: str(form, "folder", 60) });
  if (!parsed.ok) redirect(`${PAGE}?k=bad-${parsed.field}#stt`);
  const check = await checkStt(parsed.key, parsed.folder);
  if (check !== "ok") redirect(`${PAGE}?k=${check}#stt`);
  const saved = (await saveAppSecret(STT_KEY, parsed.key)) && (await saveAppSecret(STT_FOLDER, parsed.folder));
  if (!saved) redirect(`${PAGE}?k=failed#stt`);
  await record("callhelper.stt_key_saved", { actorStaffId: staff.id, ip: await requestIp(), meta: { keys: [STT_KEY, STT_FOLDER] } });
  redirect(`${PAGE}?k=ok#stt`);
}

/** «Проверить ещё раз» — то, что уже лежит в хранилище. */
export async function recheckSttKey(): Promise<void> {
  await requireRole("admin");
  const [key, folder] = await Promise.all([appSecret(STT_KEY), appSecret(STT_FOLDER)]);
  if (!key || !folder) redirect(`${PAGE}?k=empty#stt`);
  redirect(`${PAGE}?k=${await checkStt(key, folder)}#stt`);
}

export type OrgKeyState = { ok: true; key: string; name: string } | { ok: false; error: "name" | "plan" | "failed" } | null;

const UUID = /^[0-9a-f-]{36}$/i;

/**
 * «Выдать ключ» колл-центру. Только владелец. Ключ возвращается один раз —
 * в ответе этой формы; в базе и журнале его нет.
 */
export async function createOrgAction(_prev: OrgKeyState, form: FormData): Promise<OrgKeyState> {
  const staff = await requireRole("admin");
  const name = str(form, "name", 160);
  if (name.length < 2) return { ok: false, error: "name" };
  const patch = parseOrgPatch({ plan: str(form, "plan", 10), operators: str(form, "operators", 6) || "1", paidUntil: "", active: "1" });
  if (!patch) return { ok: false, error: "plan" };
  const made = await createOrg({ name, contact: str(form, "contact", 200), plan: patch.plan, operators: patch.operators, staffId: staff.id });
  if (!made) return { ok: false, error: "failed" };
  await record("callhelper.org_created", { actorStaffId: staff.id, ip: await requestIp(), meta: { org: made.id, name, plan: patch.plan } });
  revalidatePath(PAGE);
  return { ok: true, key: made.key, name };
}

/** «Новый ключ»: прежний перестаёт работать сразу. */
export async function reissueOrgKeyAction(_prev: OrgKeyState, form: FormData): Promise<OrgKeyState> {
  const staff = await requireRole("admin");
  const id = str(form, "org", 40);
  if (!UUID.test(id)) return { ok: false, error: "failed" };
  const key = await reissueKey(id);
  if (!key) return { ok: false, error: "failed" };
  await record("callhelper.org_key_reissued", { actorStaffId: staff.id, ip: await requestIp(), meta: { org: id } });
  revalidatePath(PAGE);
  return { ok: true, key, name: str(form, "name", 160) };
}

/** Тариф, места, «оплачено до» и «включён» у колл-центра. */
export async function updateOrgAction(form: FormData): Promise<void> {
  const staff = await requireRole("admin");
  const id = str(form, "org", 40);
  const patch = parseOrgPatch({
    plan: str(form, "plan", 10),
    operators: str(form, "operators", 6),
    paidUntil: str(form, "paid_until", 10),
    active: form.get("active") ? "1" : "0",
  });
  if (!UUID.test(id) || !patch) redirect(`${PAGE}?o=bad#orgs`);
  const saved = await updateOrg(id, patch);
  if (saved) await record("callhelper.org_updated", { actorStaffId: staff.id, ip: await requestIp(), meta: { org: id, ...patch } });
  redirect(`${PAGE}?o=${saved ? "saved" : "failed"}#orgs`);
}
