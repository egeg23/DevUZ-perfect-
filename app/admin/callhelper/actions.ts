"use server";

import { redirect } from "next/navigation";

import { record } from "@/lib/admin/audit";
import { requestIp, requireRole } from "@/lib/admin/guard";
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
