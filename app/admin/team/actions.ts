"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requestIp, requireAdmin } from "@/lib/admin/guard";
import {
  disableStaff,
  inviteStaff,
  resendInvite,
  setStaffRole,
  type TeamResult,
} from "@/lib/admin/team";

/**
 * Каждое действие само проверяет права.
 *
 * Не «страница уже под requireAdmin, значит и так не вызовут»: server action
 * — это обычный POST на адрес страницы, и отправить его можно откуда угодно,
 * минуя всякий интерфейс. Проверка на странице закрывает кнопку, а не
 * действие.
 */

function back(result: TeamResult): never {
  const code = result.ok ? (result.note ?? "ok") : result.reason;
  const invite = result.ok && result.invite ? `&i=${result.invite}` : "";
  redirect(`/admin/team?r=${code}${invite}`);
}

export async function addStaff(formData: FormData) {
  const admin = await requireAdmin();

  // Telegram присылает id числом, но из формы приходит строка, которую
  // печатал человек. Number() на "12 345" молча даёт NaN, а на "1e9" —
  // число, которое в bigint не влезет по смыслу, хотя влезет по типу.
  const raw = String(formData.get("telegram_id") ?? "").trim();
  const telegramId = /^\d{1,19}$/.test(raw) ? Number(raw) : Number.NaN;

  const roleRaw = String(formData.get("role") ?? "manager");
  const role = roleRaw === "admin" ? "admin" : "manager";

  back(
    await inviteStaff(
      {
        telegramId,
        displayName: String(formData.get("display_name") ?? ""),
        username: String(formData.get("username") ?? ""),
        role,
      },
      admin,
      await requestIp(),
    ),
  );
}

export async function disable(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("staff") ?? "");

  const result = await disableStaff(id, admin, await requestIp());
  revalidatePath("/admin/team");
  back(result);
}

export async function changeRole(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("staff") ?? "");
  const role = String(formData.get("role") ?? "") === "admin" ? "admin" : "manager";

  const result = await setStaffRole(id, role, admin, await requestIp());
  revalidatePath("/admin/team");
  back(result);
}

export async function resend(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("staff") ?? "");

  const result = await resendInvite(id, admin, await requestIp());
  revalidatePath("/admin/team");
  back(result);
}
