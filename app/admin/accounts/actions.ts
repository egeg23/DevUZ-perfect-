"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { circleDiscard, circleStart, saveCircle } from "@/lib/admin/circle-upload";
import { requestIp, requireRole } from "@/lib/admin/guard";
import { promoChunk, type PromoFail, type StartResult } from "@/lib/partners/promo";
import { loginCode, loginPhone } from "@/lib/admin/work-accounts";
import {
  addAccount,
  removeAccount,
  setAccountCap,
  setAccountPaused,
  setAccountStaff,
  submitCode,
  submitPassword,
} from "@/lib/admin/work-accounts-store";

/**
 * Подключать и вести аккаунты могут владелец и руководитель (владелец,
 * 04.10.2026: «дай доступ к разделу „Аккаунты“ Александру, чтобы он мог
 * добавлять аккаунты для работы сам»).
 */
const manage = () => requireRole("admin", "head");

/**
 * Рабочие аккаунты: панель только кладёт ввод, с Telegram говорит скаут
 * (scout/accounts.mjs). Поэтому каждое действие здесь — одна запись в базу
 * и возврат на страницу, а итог шага страница показывает, когда скаут его
 * запишет.
 */

function back(code: string): never {
  revalidatePath("/admin/accounts");
  redirect(`/admin/accounts?r=${code}`);
}

const text = (form: FormData, name: string) => String(form.get(name) ?? "").trim();

export async function addAccountAction(form: FormData) {
  const staff = await manage();
  const phone = loginPhone(text(form, "phone"));
  if (!phone) back("bad_phone");
  const label = text(form, "label").slice(0, 60) || phone;
  back((await addAccount({ label, phone, by: staff })) ? "added" : "failed");
}

export async function codeAction(form: FormData) {
  await manage();
  const code = loginCode(text(form, "code"));
  if (!code) back("bad_code");
  back((await submitCode(text(form, "account"), code)) ? "ok" : "stale");
}

export async function passwordAction(form: FormData) {
  await manage();
  // Пароль не обрезаем: пробел по краям может быть его частью.
  const password = String(form.get("password") ?? "");
  if (!password) back("failed");
  back((await submitPassword(text(form, "account"), password)) ? "ok" : "stale");
}

export async function capAction(form: FormData) {
  await manage();
  await setAccountCap(text(form, "account"), Number(text(form, "cap")) || 1);
  back("ok");
}

export async function pauseAction(form: FormData) {
  const staff = await manage();
  await setAccountPaused(text(form, "account"), text(form, "paused") === "1", staff);
  back("ok");
}

export async function removeAction(form: FormData) {
  const staff = await manage();
  await removeAccount(text(form, "account"), staff);
  back("ok");
}

/** Кто работает на аккаунте — галочками, списком целиком. */
export async function staffAction(form: FormData) {
  const staff = await manage();
  const ids = form.getAll("staff").map((v) => String(v));
  back((await setAccountStaff(text(form, "account"), ids, staff)) ? "ok" : "failed");
}

/**
 * Кружок для касаний (lib/admin/circle-upload.ts): загружают владелец и
 * руководитель, скаут сам кладёт его в «Избранное» каждого аккаунта. Файл
 * едет кусками, по одному действию на кусок — как видео к инструкциям.
 */
const num = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : null);

export async function circleStartAction(input: { mime: string; bytes: number }): Promise<StartResult> {
  await manage();
  return circleStart({ mime: String(input?.mime ?? ""), bytes: Number(input?.bytes) });
}

export async function circleChunkAction(formData: FormData): Promise<{ ok: true; received: number } | PromoFail> {
  await manage();
  const chunk = formData.get("chunk");
  if (!(chunk instanceof Blob)) return { ok: false, reason: "chunk_missing" };
  return promoChunk(String(formData.get("upload") ?? ""), Number(formData.get("offset")), new Uint8Array(await chunk.arrayBuffer()));
}

export async function circleDiscardAction(uploadId: string): Promise<void> {
  await manage();
  await circleDiscard(String(uploadId ?? ""));
}

export async function circleSaveAction(input: {
  uploadId: string;
  width: number | null;
  height: number | null;
  duration: number | null;
}): Promise<{ ok: true } | PromoFail> {
  const staff = await manage();
  const result = await saveCircle(
    { uploadId: String(input?.uploadId ?? ""), width: num(input?.width), height: num(input?.height), duration: num(input?.duration) },
    staff,
    await requestIp(),
  );
  if (result.ok) revalidatePath("/admin/accounts");
  return result;
}
