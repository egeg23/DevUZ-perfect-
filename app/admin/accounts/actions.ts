"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/admin/guard";
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
