"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requestIp, requireAdmin, requireRole } from "@/lib/admin/guard";
import { isGrade, parsePercent } from "@/lib/admin/finance";
import { hiredRoles, isAssignable } from "@/lib/admin/roles";
import { syncBotMenu } from "@/lib/qualify/menu";
import {
  claimManager,
  disableStaff,
  inviteStaff,
  resendInvite,
  setStaffGrade,
  setStaffHead,
  setStaffRole,
  setTouchPlan,
  type TeamResult,
} from "@/lib/admin/team";
import { parseTouchPlan } from "@/lib/admin/touch-plan";

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
  // Итог отключения — числами в адресе: страница соберёт из них строку.
  const o = result.ok && result.offboarding;
  const offboarded = o
    ? `&o=${[o.leads, o.talks, o.pool, o.team, o.reminders, o.transfers, o.cards].join("-")}`
    : "";
  const detached = result.ok && result.detached ? `&t=${result.detached}` : "";
  redirect(`/admin/team?r=${code}${invite}${offboarded}${detached}`);
}

export async function addStaff(formData: FormData) {
  // Заводить людей вправе и руководитель проектов — но только менеджеров.
  const actor = await requireRole("admin", "head");

  // Telegram присылает id числом, но из формы приходит строка, которую
  // печатал человек. Number() на "12 345" молча даёт NaN, а на "1e9" —
  // число, которое в bigint не влезет по смыслу, хотя влезет по типу.
  const raw = String(formData.get("telegram_id") ?? "").trim();
  const telegramId = /^\d{1,19}$/.test(raw) ? Number(raw) : Number.NaN;

  // Админом через форму не стать: всё, что не head, — менеджер. А
  // руководителю и head недоступен: разрешённый список приносит hiredRoles,
  // и проверяется он здесь, а не только в разметке формы — форму отправляют
  // и мимо страницы.
  const roleRaw = String(formData.get("role") ?? "manager");
  const wanted = isAssignable(roleRaw) ? roleRaw : "manager";
  const allowed = hiredRoles(actor.role);
  if (!allowed.includes(wanted)) back({ ok: false, reason: "forbidden" });
  const role = wanted;

  const result = await inviteStaff(
    {
      telegramId,
      displayName: String(formData.get("display_name") ?? ""),
      username: String(formData.get("username") ?? ""),
      role,
    },
    actor,
    await requestIp(),
  );
  // Новому сотруднику /login должен появиться в меню сразу, а не после
  // следующей выкатки. Меню — не повод ронять заведение.
  if (result.ok) await syncBotMenu().catch(() => undefined);
  back(result);
}

export async function disable(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("staff") ?? "");

  const result = await disableStaff(id, admin, await requestIp());
  // Отключённому /login в меню больше не нужен.
  if (result.ok) await syncBotMenu().catch(() => undefined);
  revalidatePath("/admin/team");
  back(result);
}

export async function changeRole(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("staff") ?? "");
  const roleRaw = String(formData.get("role") ?? "");
  const role = isAssignable(roleRaw) ? roleRaw : "manager";

  const result = await setStaffRole(id, role, admin, await requestIp());
  revalidatePath("/admin/team");
  back(result);
}

export async function resend(formData: FormData) {
  // Переслать приглашение — то же право, что и завести: руководитель
  // проектов набирает менеджеров, значит и ссылку им перевыдаёт сам.
  const actor = await requireRole("admin", "head");
  const id = String(formData.get("staff") ?? "");

  const result = await resendInvite(id, actor, await requestIp());
  revalidatePath("/admin/team");
  back(result);
}

export async function assignHead(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("staff") ?? "");
  // Пустое значение — «без руководителя».
  const headRaw = String(formData.get("head") ?? "").trim();
  const headId = headRaw ? headRaw : null;

  const result = await setStaffHead(id, headId, admin, await requestIp());
  revalidatePath("/admin/team");
  back(result);
}

/**
 * Руководитель берёт менеджера к себе.
 *
 * Только руководитель: владелец закрепляет через `assignHead`, где можно и
 * открепить. Здесь открепить нельзя ничем — кого можно взять, решает
 * `claimManager`: только ничьего менеджера и только себе.
 */
export async function claim(formData: FormData) {
  const head = await requireRole("head");
  const id = String(formData.get("staff") ?? "");

  const result = await claimManager(id, head, await requestIp());
  revalidatePath("/admin/team");
  revalidatePath("/admin");
  revalidatePath("/admin/stats");
  back(result);
}

export async function setGrade(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("staff") ?? "");
  const gradeRaw = String(formData.get("grade") ?? "");
  const grade = isGrade(gradeRaw) ? gradeRaw : "manager";
  // Пустое поле — «по грейду»; всё остальное должно быть целым процентом.
  const rateRaw = String(formData.get("rate") ?? "").trim();
  const rate = rateRaw ? parsePercent(rateRaw) : null;
  if (rateRaw && rate === null) back({ ok: false, reason: "invalid" });

  const result = await setStaffGrade(id, grade, rate, admin, await requestIp());
  revalidatePath("/admin/team");
  back(result);
}

/**
 * Недельный план касаний.
 *
 * `requireRole`, а не `requireAdmin`: план своим людям ставит и руководитель.
 * Кому именно можно — решает `setTouchPlan`: страница закрывает кнопку, а
 * действие закрывает само себя.
 */
export async function setPlan(formData: FormData) {
  const actor = await requireRole("admin", "head");
  const id = String(formData.get("staff") ?? "");
  const parsed = parseTouchPlan(String(formData.get("plan") ?? ""));
  if (!parsed.ok) back({ ok: false, reason: "invalid" });

  const result = await setTouchPlan(id, parsed.plan, actor, await requestIp());
  revalidatePath("/admin/team");
  revalidatePath("/admin/prospect");
  revalidatePath("/admin");
  back(result);
}

/**
 * Обновить меню команд бота руками. Обычно оно обновляется само — при
 * выкатке и при заведении или отключении сотрудника, — но если Telegram в
 * тот момент не ответил, кнопка дешевле, чем ждать следующей выкатки.
 */
export async function refreshMenu() {
  await requireAdmin();
  const result = await syncBotMenu();
  back({ ok: true, note: result.ok ? "menu_ok" : "menu_failed" });
}
