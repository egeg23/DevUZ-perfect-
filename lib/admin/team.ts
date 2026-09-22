import type { AssignableRole, Role } from "@/lib/admin/roles";
import { record } from "@/lib/admin/audit";
import {
  notifyHeadChange,
  notifyInvitedStaff,
  notifyOwnersOfClaim,
  notifyRoleChange,
  type InviteOutcome,
} from "@/lib/admin/staff-notice";
import { HEAD_TEAM_PERCENT, isGrade, type Grade } from "@/lib/admin/finance";
import { TOUCH_PLAN_MAX } from "@/lib/admin/touch-plan";
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
  /** Грейд для ставки и персональная ставка, если договорились отдельно. */
  grade: Grade;
  rate_percent: number | null;
  /** Сколько касаний в неделю ожидается. null — план не ставили. */
  touch_plan: number | null;
};

const COLUMNS =
  "id, created_at, telegram_user_id, username, display_name, role, is_active, disabled_at, head_staff_id, grade, rate_percent, touch_plan";

export type TeamResult =
  | {
      ok: true;
      note?: "reactivated" | "menu_ok" | "menu_failed" | "claimed";
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
        | "not_head"
        // У менеджера уже есть руководитель: забрать его к себе значило бы
        // открепить от того, а открепляет только владелец.
        | "has_head"
        // Роль, которую этот человек заводить не вправе: руководитель
        // проектов набирает менеджеров, но не вторых руководителей.
        | "forbidden";
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

  // Руководитель заводит менеджера себе: набрал — значит и отвечает за него.
  // Владелец заводит без руководителя и закрепляет сам, когда решит, чей.
  const ownHead = admin.role === "head" && input.role === "manager" ? admin.id : null;

  const { data: existing } = await db
    .from("staff")
    .select("id, is_active, head_staff_id")
    .eq("telegram_user_id", input.telegramId)
    .maybeSingle();

  if (existing) {
    if (existing.is_active) return { ok: false, reason: "exists" };

    // Вернувшегося — к тому, кто вернул, только если он ничей. Прежний
    // руководитель у него остаётся: снять его — решение владельца.
    const claimed = ownHead && !existing.head_staff_id ? ownHead : null;
    const { error } = await db
      .from("staff")
      .update({
        is_active: true,
        disabled_at: null,
        display_name: displayName,
        username,
        role: input.role,
        ...(claimed ? { head_staff_id: claimed } : {}),
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
      meta: { reactivated: true, role: input.role, invite, head: claimed },
    });
    if (claimed) await tellOwnersOfClaim(admin, displayName);
    return { ok: true, note: "reactivated", invite };
  }

  const { data, error } = await db
    .from("staff")
    .insert({
      telegram_user_id: input.telegramId,
      display_name: displayName,
      username,
      role: input.role,
      head_staff_id: ownHead,
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
    meta: { role: input.role, invite, head: ownHead },
  });
  if (ownHead) await tellOwnersOfClaim(admin, displayName);
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

  // Грейд идёт за ролью: руководитель получает 30 % на своём клиенте и 5 % с
  // команды, бывший руководитель — снова ставку менеджера.
  const { error } = await db
    .from("staff")
    .update({ role, grade: role === "head" ? "head" : "manager" })
    .eq("id", staffId);
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
    .select("id, role, head_staff_id, is_active, telegram_user_id")
    .eq("id", staffId)
    .maybeSingle();

  if (!target) return { ok: false, reason: "gone" };
  if (target.role === "admin") return { ok: false, reason: "owner" };
  if (headId === staffId) return { ok: false, reason: "invalid" };

  let headName: string | null = null;
  if (headId) {
    const { data: head } = await db
      .from("staff")
      .select("id, role, is_active, display_name")
      .eq("id", headId)
      .maybeSingle();
    if (!head || head.role !== "head" || !head.is_active) {
      return { ok: false, reason: "not_head" };
    }
    headName = head.display_name as string;
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

  if (target.is_active) {
    await notifyHeadChange({
      telegramId: target.telegram_user_id as number,
      headName,
      changedBy: admin.display_name,
    });
  }
  return { ok: true };
}

/**
 * Можно ли руководителю взять сотрудника к себе. Чистая часть claimManager.
 *
 * Только свободного менеджера. У кого руководитель уже есть — тот чужой, и
 * забрать его значило бы открепить от прежнего; открепляет только владелец.
 * Руководителя руководитель к себе не берёт: над руководителем — владелец.
 */
export function claimVerdict(input: {
  actorId: string;
  actorRole: Role;
  target: { id: string; role: Role; is_active: boolean; head_staff_id: string | null };
}): "ok" | "already" | "has_head" | "forbidden" | "gone" {
  if (input.actorRole !== "head") return "forbidden";
  if (!input.target.is_active) return "gone";
  if (input.target.id === input.actorId || input.target.role !== "manager") return "forbidden";
  if (input.target.head_staff_id === input.actorId) return "already";
  if (input.target.head_staff_id) return "has_head";
  return "ok";
}

/**
 * Руководитель берёт менеджера к себе.
 *
 * Дальше он отвечает за его показатели: видит его статистику и план/факт на
 * главной, ставит ему недельный план касаний. Обратного действия у
 * руководителя нет — отказаться от менеджера может только владелец, через
 * `setStaffHead`. Иначе «взял, пока цифры хорошие, и отдал, когда просели».
 */
export async function claimManager(staffId: string, actor: Staff, ip: string): Promise<TeamResult> {
  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };

  const { data: target } = await db
    .from("staff")
    .select("id, role, is_active, head_staff_id, telegram_user_id, display_name")
    .eq("id", staffId)
    .maybeSingle();
  if (!target) return { ok: false, reason: "gone" };

  const verdict = claimVerdict({
    actorId: actor.id,
    actorRole: actor.role,
    target: {
      id: target.id as string,
      role: target.role as Role,
      is_active: target.is_active === true,
      head_staff_id: (target.head_staff_id as string | null) ?? null,
    },
  });
  if (verdict === "already") return { ok: true, note: "claimed" };
  if (verdict !== "ok") return { ok: false, reason: verdict };

  // Условие «ничей» — в самом запросе, а не только в проверке выше: два
  // руководителя, нажавшие одновременно, оба увидели бы «свободен», и второй
  // молча переписал бы первого — то есть открепил бы чужого менеджера.
  const { data: updated, error } = await db
    .from("staff")
    .update({ head_staff_id: actor.id })
    .eq("id", staffId)
    .eq("role", "manager")
    .is("head_staff_id", null)
    .select("id");
  if (error) return { ok: false, reason: "failed" };
  if (!updated?.length) return { ok: false, reason: "has_head" };

  await record("staff.head_changed", {
    actorStaffId: actor.id,
    targetType: "staff",
    targetId: staffId,
    ip,
    meta: { from: null, to: actor.id, claimed: true },
  });

  await Promise.all([
    notifyHeadChange({
      telegramId: target.telegram_user_id as number,
      headName: actor.display_name,
      changedBy: actor.display_name,
    }),
    tellOwnersOfClaim(actor, target.display_name as string),
  ]);
  return { ok: true, note: "claimed" };
}

/**
 * Владельцу — что руководитель закрепил менеджера за собой: кнопкой или тем,
 * что сам его завёл. Открепляет только владелец, и узнавать об этом он
 * должен сразу, а не при следующем заходе в «Команду».
 */
async function tellOwnersOfClaim(head: Staff, managerName: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  const [{ data: owners }, { data: me }] = await Promise.all([
    db.from("staff").select("telegram_user_id").eq("role", "admin").eq("is_active", true),
    db.from("staff").select("founder_percent").eq("id", head.id).maybeSingle(),
  ]);
  await notifyOwnersOfClaim({
    ownerIds: (owners ?? []).map((o) => o.telegram_user_id as number),
    headName: head.display_name,
    managerName,
    // Соучредителю ставка с команды не идёт — см. accrualsOf.
    teamPercent: me?.founder_percent ? 0 : HEAD_TEAM_PERCENT,
  });
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

/**
 * Грейд и персональная ставка.
 *
 * Грейд задаёт процент от прибыли (младший 10, менеджер 15, руководитель
 * 30 на своём клиенте); персональная ставка, если договорились отдельно,
 * заменяет грейдовую на новых клиентах. Владельцу ни то ни другое не
 * нужно: ему остаётся то, что остаётся, и грейд у него не меняется.
 */
export async function setStaffGrade(
  staffId: string,
  grade: Grade,
  ratePercent: number | null,
  admin: Staff,
  ip: string,
): Promise<TeamResult> {
  if (!isGrade(grade)) return { ok: false, reason: "invalid" };
  if (ratePercent !== null && (ratePercent < 0 || ratePercent > 100)) {
    return { ok: false, reason: "invalid" };
  }

  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };

  const { data: target } = await db
    .from("staff")
    .select("id, role, grade, rate_percent")
    .eq("id", staffId)
    .maybeSingle();

  if (!target) return { ok: false, reason: "gone" };
  if (target.role === "admin") return { ok: false, reason: "owner" };

  const before = { grade: target.grade as Grade, rate_percent: (target.rate_percent as number | null) ?? null };
  if (before.grade === grade && before.rate_percent === ratePercent) return { ok: true };

  const { error } = await db
    .from("staff")
    .update({ grade, rate_percent: ratePercent })
    .eq("id", staffId);
  if (error) return { ok: false, reason: "failed" };

  await record("staff.grade_changed", {
    actorStaffId: admin.id,
    targetType: "staff",
    targetId: staffId,
    ip,
    meta: { from: before, to: { grade, rate_percent: ratePercent } },
  });
  return { ok: true };
}

/**
 * Недельный план касаний.
 *
 * Ставит владелец — любому, руководитель — своим. Третий вариант, «каждый
 * себе», не заводим: план, который человек ставит сам, это не план.
 *
 * Пусто — плана нет, и панель ничего не требует. Ноль и «не задан» разные
 * вещи: «осталось 0 из 0» тому, кому план не ставили, это неправда.
 */
export async function setTouchPlan(
  staffId: string,
  plan: number | null,
  actor: Staff,
  ip: string,
): Promise<TeamResult> {
  if (plan !== null && (!Number.isInteger(plan) || plan < 0 || plan > TOUCH_PLAN_MAX)) {
    return { ok: false, reason: "invalid" };
  }

  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };

  const { data: target } = await db
    .from("staff")
    .select("id, head_staff_id, touch_plan")
    .eq("id", staffId)
    .maybeSingle();
  if (!target) return { ok: false, reason: "gone" };

  // Руководитель — только своим. Без этой проверки план ставился бы любому,
  // и «руководитель» превратился бы во второго владельца.
  if (actor.role !== "admin" && target.head_staff_id !== actor.id) {
    return { ok: false, reason: "invalid" };
  }

  const before = (target.touch_plan as number | null) ?? null;
  if (before === plan) return { ok: true };

  const { error } = await db.from("staff").update({ touch_plan: plan }).eq("id", staffId);
  if (error) return { ok: false, reason: "failed" };

  await record("staff.touch_plan_set", {
    actorStaffId: actor.id,
    targetType: "staff",
    targetId: staffId,
    ip,
    meta: { from: before, to: plan },
  });
  return { ok: true };
}

/** Активные сотрудники — для выпадающего списка «кому передать». */
export async function activeStaff(): Promise<{ id: string; display_name: string }[]> {
  const db = serviceClient();
  if (!db) return [];

  const { data } = await db
    .from("staff")
    .select("id, display_name")
    .eq("is_active", true)
    .order("display_name");

  return (data ?? []).map((row) => ({
    id: row.id as string,
    display_name: row.display_name as string,
  }));
}
