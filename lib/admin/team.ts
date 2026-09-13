import type { AssignableRole, Role } from "@/lib/admin/roles";
import { record } from "@/lib/admin/audit";
import {
  notifyInvitedStaff,
  notifyRoleChange,
  type InviteOutcome,
} from "@/lib/admin/staff-notice";
import type { Staff } from "@/lib/admin/session";
import { serviceClient } from "@/lib/supabase";

/**
 * Сотрудники студии: кого пускают в панель и с какими правами.
 *
 * До этого модуля людей заводили запросом в SQL-редакторе. Это работало
 * ровно до первого увольнения: отключить человека умеет тот, кто помнит
 * нужный update, а помнит его один. Здесь то же самое, но с журналом и
 * без доступа к базе.
 */

export type TeamMember = {
  id: string;
  created_at: string;
  telegram_user_id: number;
  username: string | null;
  display_name: string;
  role: Role;
  is_active: boolean;
  disabled_at: string | null;
  /** Руководитель сотрудника, если назначен. */
  head_staff_id: string | null;
};

const COLUMNS =
  "id, created_at, telegram_user_id, username, display_name, role, is_active, disabled_at, head_staff_id";

export type TeamResult =
  | {
      ok: true;
      note?: "reactivated";
      /**
       * Дошло ли до человека приглашение.
       *
       * Отдельно от `ok` намеренно: сотрудник заведён независимо от того,
       * доехало ли сообщение, но «завели» и «завели, а он об этом не знает»
       * — разные состояния, и второе требует действия от того, кто заводил.
       */
      invite?: InviteOutcome;
    }
  | {
      ok: false;
      reason:
        | "offline"
        | "exists"
        | "gone"
        | "failed"
        | "self"
        | "last_admin"
        | "invalid"
        // Роль владельца через панель не меняется ни в какую сторону.
        | "owner"
        // Назначаемый руководитель — не руководитель или отключён.
        | "not_head";
    };

/**
 * Весь список, включая отключённых.
 *
 * Отключённые не прячутся намеренно: у них остаются лиды, сообщения и
 * строки в журнале, и на разборе полугодовой давности нужно понимать,
 * кто такой «Иван», от которого осталась запись. Плюс это единственное
 * место, где видно, что человека вообще отключили.
 */
export async function listTeam(): Promise<TeamMember[]> {
  const db = serviceClient();
  if (!db) return [];

  const { data, error } = await db
    .from("staff")
    .select(COLUMNS)
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("admin: не прочитал команду", error.message);
    return [];
  }
  return (data as TeamMember[] | null) ?? [];
}

/** Сколько админов сейчас работает. Нужно, чтобы не остаться без единого. */
async function activeAdmins(): Promise<number> {
  const db = serviceClient();
  if (!db) return 0;

  const { count } = await db
    .from("staff")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin")
    .eq("is_active", true);

  return count ?? 0;
}

/**
 * Завести сотрудника по его числовому id в Telegram.
 *
 * Id, а не username: username человек меняет в настройках за секунду, и
 * запись «@ivan» после такой смены указывает уже на другого человека —
 * возможно, на постороннего, который этот освободившийся ник занял.
 *
 * Вернувшегося сотрудника не заводим заново, а включаем обратно: у него
 * та же строка, те же лиды и та же история в журнале. Новая строка на том
 * же Telegram id всё равно не создастся — на колонке unique, — но человек
 * увидел бы «уже есть» вместо понятного «включён обратно».
 */
export async function inviteStaff(
  input: { telegramId: number; displayName: string; username: string; role: AssignableRole },
  admin: Staff,
  ip: string,
): Promise<TeamResult> {
  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };

  const displayName = input.displayName.trim().slice(0, 80);
  // Ведущая собака в базе не хранится: сравнивать «@ivan» и «ivan» пришлось
  // бы в каждом запросе, а один раз забыв — получить дубль.
  const username = input.username.trim().replace(/^@/, "").slice(0, 32) || null;

  if (!Number.isSafeInteger(input.telegramId) || input.telegramId <= 0 || !displayName) {
    return { ok: false, reason: "invalid" };
  }

  const { data: existing } = await db
    .from("staff")
    .select("id, is_active")
    .eq("telegram_user_id", input.telegramId)
    .maybeSingle();

  if (existing) {
    if (existing.is_active) return { ok: false, reason: "exists" };

    const { error } = await db
      .from("staff")
      .update({
        is_active: true,
        disabled_at: null,
        display_name: displayName,
        username,
        role: input.role,
      })
      .eq("id", existing.id as string);

    if (error) return { ok: false, reason: "failed" };

    const invite = await notifyInvitedStaff({
      telegramId: input.telegramId,
      role: input.role,
      invitedBy: admin.display_name,
      returning: true,
    });

    await record("staff.invited", {
      actorStaffId: admin.id,
      targetType: "staff",
      targetId: existing.id as string,
      ip,
      meta: { reactivated: true, role: input.role, invite },
    });
    return { ok: true, note: "reactivated", invite };
  }

  const { data, error } = await db
    .from("staff")
    .insert({
      telegram_user_id: input.telegramId,
      display_name: displayName,
      username,
      role: input.role,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("admin: не завёл сотрудника", error?.message);
    return { ok: false, reason: "failed" };
  }

  const invite = await notifyInvitedStaff({
    telegramId: input.telegramId,
    role: input.role,
    invitedBy: admin.display_name,
    returning: false,
  });

  await record("staff.invited", {
    actorStaffId: admin.id,
    targetType: "staff",
    targetId: data.id as string,
    ip,
    // Судьба приглашения в журнале: через месяц вопрос «почему Иван так и
    // не зашёл» иначе не с чем сопоставить.
    meta: { role: input.role, invite },
  });
  return { ok: true, invite };
}

/**
 * Отключить сотрудника.
 *
 * Не удалить: у человека остаются лиды, сообщения и строки журнала, и
 * обнулять ссылку на него значило бы стереть авторство задним числом.
 *
 * Сессии сносятся тем же действием. Без этого отключение начинает
 * работать только когда протухнет кука — до двенадцати часов, а при
 * активной работе и все семь дней абсолютного срока. Ровно те часы, в
 * которые уволенный человек и заходит.
 */
export async function disableStaff(
  staffId: string,
  admin: Staff,
  ip: string,
): Promise<TeamResult> {
  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };

  // Отключить себя — это выйти из панели без возможности вернуться:
  // ссылку входа выдаёт бот, а бот проверяет is_active.
  if (staffId === admin.id) return { ok: false, reason: "self" };

  const { data: target } = await db
    .from("staff")
    .select("id, role, is_active, telegram_user_id")
    .eq("id", staffId)
    .maybeSingle();

  if (!target) return { ok: false, reason: "gone" };
  if (!target.is_active) return { ok: true };

  // Последнего админа отключить нельзя: панель осталась бы без того, кто
  // может завести нового, и чинилось бы это снова запросом в SQL-редакторе.
  if (target.role === "admin" && (await activeAdmins()) <= 1) {
    return { ok: false, reason: "last_admin" };
  }

  const { error } = await db
    .from("staff")
    .update({ is_active: false, disabled_at: new Date().toISOString() })
    .eq("id", staffId);

  if (error) return { ok: false, reason: "failed" };

  await db.from("staff_sessions").delete().eq("staff_id", staffId);
  // Невыбранные ссылки входа тоже: выданная минуту назад сработала бы уже
  // после отключения.
  await db.from("login_tokens").delete().eq("staff_id", staffId).is("used_at", null);

  await record("staff.disabled", {
    actorStaffId: admin.id,
    targetType: "staff",
    targetId: staffId,
    ip,
  });
  return { ok: true };
}

/**
 * Сменить роль.
 *
 * Снять с себя админство нельзя по той же причине, по которой нельзя себя
 * отключить, и снять последнего админа — тоже: и то и другое оставляет
 * панель без хозяина.
 */
export async function setStaffRole(
  staffId: string,
  role: AssignableRole,
  admin: Staff,
  ip: string,
): Promise<TeamResult> {
  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };

  const { data: target } = await db
    .from("staff")
    .select("id, role, is_active, telegram_user_id")
    .eq("id", staffId)
    .maybeSingle();

  if (!target) return { ok: false, reason: "gone" };
  if (target.role === role) return { ok: true };

  // Назначить администратора нельзя — тип роли здесь не допускает admin.
  // Разжаловать — можно, но не себя и не последнего: администратор должен
  // остаться один, а не ноль. Это и есть путь к правилу «админ только у
  // владельца»: лишних админов владелец переводит в руководители сам.
  if (target.role === "admin") {
    const verdict = demotionVerdict({
      targetId: staffId,
      actorId: admin.id,
      activeAdmins: await activeAdmins(),
    });
    if (verdict !== "ok") return { ok: false, reason: verdict };
  }

  const { error } = await db.from("staff").update({ role }).eq("id", staffId);
  if (error) return { ok: false, reason: "failed" };

  // Отключённому не пишем: у него нет доступа, и сообщение о новых правах
  // было бы неправдой.
  const invite = target.is_active
    ? await notifyRoleChange({
        telegramId: target.telegram_user_id as number,
        role,
        changedBy: admin.display_name,
      })
    : undefined;

  await record("staff.role_changed", {
    actorStaffId: admin.id,
    targetType: "staff",
    targetId: staffId,
    ip,
    meta: { from: target.role, to: role, invite },
  });
  return { ok: true, invite };
}

/**
 * Отправить приглашение ещё раз.
 *
 * Нужна ровно из-за одного правила Telegram: бот не может написать первым
 * тому, кто ему ни разу не писал. Значит первая попытка при заведении
 * сотрудника часто не доходит — не из-за сбоя, а потому что человек ещё не
 * открывал бота. Порядок действий получается такой: завели, сказали ему
 * любым способом «напиши боту», он написал, здесь нажали ещё раз.
 *
 * Ничего не меняет в базе — только шлёт. Поэтому доступна и тогда, когда
 * первая попытка прошла: продублировать приглашение человеку, который его
 * потерял, дешевле, чем объяснять по телефону, куда заходить.
 */
export async function resendInvite(
  staffId: string,
  admin: Staff,
  ip: string,
): Promise<TeamResult> {
  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };

  const { data: target } = await db
    .from("staff")
    .select("telegram_user_id, role, is_active")
    .eq("id", staffId)
    .maybeSingle();

  if (!target) return { ok: false, reason: "gone" };
  // Отключённому приглашение не шлём: доступа у него нет, и звать его в
  // панель значило бы соврать.
  if (!target.is_active) return { ok: false, reason: "gone" };

  const invite = await notifyInvitedStaff({
    telegramId: target.telegram_user_id as number,
    role: target.role as Role,
    invitedBy: admin.display_name,
    returning: false,
  });

  await record("staff.invited", {
    actorStaffId: admin.id,
    targetType: "staff",
    targetId: staffId,
    ip,
    meta: { resent: true, invite },
  });

  return { ok: true, invite };
}

/**
 * Назначить сотруднику руководителя.
 *
 * Руководителем может быть только активный сотрудник с ролью head: иначе
 * «руководитель видит своих» указывало бы на человека, у которого нет
 * доступа к тому, что он якобы видит. Владельцу руководитель не
 * назначается — над ним никого нет.
 */
export async function setStaffHead(
  staffId: string,
  headId: string | null,
  admin: Staff,
  ip: string,
): Promise<TeamResult> {
  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };

  const { data: target } = await db
    .from("staff")
    .select("id, role, head_staff_id")
    .eq("id", staffId)
    .maybeSingle();

  if (!target) return { ok: false, reason: "gone" };
  if (target.role === "admin") return { ok: false, reason: "owner" };
  if (headId === staffId) return { ok: false, reason: "invalid" };

  if (headId) {
    const { data: head } = await db
      .from("staff")
      .select("id, role, is_active")
      .eq("id", headId)
      .maybeSingle();
    if (!head || head.role !== "head" || !head.is_active) {
      return { ok: false, reason: "not_head" };
    }
  }

  const before = (target.head_staff_id as string | null) ?? null;
  if (before === headId) return { ok: true };

  const { error } = await db.from("staff").update({ head_staff_id: headId }).eq("id", staffId);
  if (error) return { ok: false, reason: "failed" };

  await record("staff.head_changed", {
    actorStaffId: admin.id,
    targetType: "staff",
    targetId: staffId,
    ip,
    meta: { from: before, to: headId },
  });
  return { ok: true };
}

/** Активные сотрудники, у которых этот человек — руководитель. */
export async function teamOf(headId: string): Promise<string[]> {
  const db = serviceClient();
  if (!db) return [];

  const { data } = await db
    .from("staff")
    .select("id")
    .eq("head_staff_id", headId)
    .eq("is_active", true);

  return (data ?? []).map((row) => row.id as string);
}

/** Можно ли снять с человека роль администратора. Чистая часть setStaffRole. */
export function demotionVerdict(input: {
  targetId: string;
  actorId: string;
  activeAdmins: number;
}): "ok" | "self" | "last_admin" {
  if (input.targetId === input.actorId) return "self";
  if (input.activeAdmins <= 1) return "last_admin";
  return "ok";
}
