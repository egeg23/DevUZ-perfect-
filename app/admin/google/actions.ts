"use server";

import { randomBytes } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { record } from "@/lib/admin/audit";
import { requestIp, requireAdmin } from "@/lib/admin/guard";
import {
  GOOGLE_SECRETS,
  STATE_COOKIE,
  STATE_MAX_AGE,
  STATE_PATH,
  authUrl,
  googleClient,
  isClientId,
} from "@/lib/analytics/google-oauth";
import { saveAppSecret } from "@/lib/secrets";

/**
 * Вход через Google для статистики GA — только владелец.
 *
 * Одна кнопка на всё: если в форме есть Client ID и секрет, они сначала
 * сохраняются, и сразу — переход на экран Google. Владелец создал клиент в
 * Google Cloud, вставил две строки, нажал — и через минуту видит цифры, без
 * пересылки ключей в чат и без захода на сервер.
 */

const TRAFFIC = "/admin?tab=traffic";
const back = (code: string): never => redirect(`${TRAFFIC}&ga=${code}`);

export async function startGoogleSignIn(formData: FormData) {
  const staff = await requireAdmin();

  const id = String(formData.get("client_id") ?? "").trim();
  const secret = String(formData.get("client_secret") ?? "").trim();
  if (id || secret) {
    if (!isClientId(id) || secret.length < 10 || /\s/.test(secret)) back("client_bad");
    const saved =
      (await saveAppSecret(GOOGLE_SECRETS.clientId, id)) && (await saveAppSecret(GOOGLE_SECRETS.clientSecret, secret));
    if (!saved) back("save_failed");
    await record("google.client_saved", { actorStaffId: staff.id, ip: await requestIp() });
  }

  const client = await googleClient();
  if (!client) back("client");

  // Проверочное значение: Google вернёт его в адресе, а кука подтвердит, что
  // вход начат здесь, в этом браузере, — а не подсунут по чужой ссылке.
  const state = randomBytes(24).toString("base64url");
  (await cookies()).set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: STATE_PATH,
    maxAge: STATE_MAX_AGE,
  });

  redirect(authUrl({ clientId: client!.id, state }));
}

/**
 * Номер ресурса вручную — на случай, когда найти его сам вход не смог
 * (не включён Admin API или ресурс в другом аккаунте).
 */
export async function saveGaProperty(formData: FormData) {
  const staff = await requireAdmin();
  const raw = String(formData.get("property") ?? "")
    .trim()
    .replace(/^properties\//, "");
  if (!/^\d{6,15}$/.test(raw)) back("property_bad");
  if (!(await saveAppSecret(GOOGLE_SECRETS.property, raw))) back("save_failed");
  await record("google.property_set", { actorStaffId: staff.id, meta: { property: raw }, ip: await requestIp() });
  back("property_saved");
}
