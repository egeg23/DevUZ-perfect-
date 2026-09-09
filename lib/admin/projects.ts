import { record } from "@/lib/admin/audit";
import type { Staff } from "@/lib/admin/session";
import { serviceClient } from "@/lib/supabase";

/**
 * Стадии в том порядке, в каком проект их проходит.
 *
 * Порядок здесь не оформление, а смысл: по нему считается, насколько
 * проект продвинулся, и рисуется полоса в карточке. Обычный массив, не
 * enum — Node запускает наши .ts без компиляции, только срезая типы, и
 * enum единственный из конструкций TypeScript после среза оставил бы код.
 */
export const STAGES = [
  "brief",
  "contract",
  "design",
  "build",
  "review",
  "launch",
  "support",
] as const;

/** Стадии вне линии: проект в них не «продвинулся», а вышел из потока. */
export const TERMINAL_STAGES = ["paused", "done", "cancelled"] as const;

// Строковый тип намеренно: значение приходит из формы, то есть из рук
// кого угодно, и сверяется с этим списком. Узкий литеральный тип заставлял
// бы приводить его до проверки — то есть ровно там, где проверка и нужна.
export const ALL_STAGES: readonly string[] = [...STAGES, ...TERMINAL_STAGES];

export const STAGE_LABEL: Record<string, string> = {
  brief: "бриф",
  contract: "договор",
  design: "дизайн",
  build: "разработка",
  review: "приёмка",
  launch: "запуск",
  support: "поддержка",
  paused: "на паузе",
  done: "закрыт",
  cancelled: "отменён",
};

export type Project = {
  id: string;
  created_at: string;
  title: string;
  client: string | null;
  lead_id: string | null;
  owner_staff_id: string | null;
  owner_name: string | null;
  stage: string;
  stage_since: string;
  started_at: string | null;
  deadline: string | null;
  amount_usd: number | null;
  notes: string | null;
};

const COLUMNS =
  "id, created_at, title, client, lead_id, owner_staff_id, stage, stage_since, started_at, deadline, amount_usd, notes, staff(display_name)";

function shape(row: Record<string, unknown>): Project {
  // Связанная запись приходит объектом или массивом — PostgREST выводит
  // кардинальность сам. Разбираем оба вида: иначе имя ответственного молча
  // превращается в прочерк при первом же изменении схемы.
  const joined = row.staff as unknown;
  const owner = (Array.isArray(joined) ? joined[0] : joined) as
    | { display_name?: string }
    | null
    | undefined;

  return {
    id: row.id as string,
    created_at: row.created_at as string,
    title: row.title as string,
    client: (row.client as string | null) ?? null,
    lead_id: (row.lead_id as string | null) ?? null,
    owner_staff_id: (row.owner_staff_id as string | null) ?? null,
    owner_name: owner?.display_name ?? null,
    stage: row.stage as string,
    stage_since: row.stage_since as string,
    started_at: (row.started_at as string | null) ?? null,
    deadline: (row.deadline as string | null) ?? null,
    amount_usd: (row.amount_usd as number | null) ?? null,
    notes: (row.notes as string | null) ?? null,
  };
}

/**
 * Насколько проект прошёл линию стадий, в долях.
 *
 * Стадии вне линии дают null, а не ноль и не сто: «на паузе» — это не
 * начало и не конец, и рисовать по нему полосу значит сказать неправду в
 * обе стороны сразу.
 */
export function stageProgress(stage: string): number | null {
  const index = (STAGES as readonly string[]).indexOf(stage);
  if (index === -1) return null;
  return Math.round(((index + 1) / STAGES.length) * 100);
}

/** Сколько дней проект стоит на текущей стадии. */
export function daysOnStage(stageSince: string, now = Date.now()): number {
  return Math.max(0, Math.floor((now - new Date(stageSince).getTime()) / 86_400_000));
}

export async function listProjects(includeClosed = false): Promise<Project[]> {
  const db = serviceClient();
  if (!db) return [];

  let query = db.from("projects").select(COLUMNS).order("created_at", { ascending: false });
  if (!includeClosed) {
    query = query.not("stage", "in", "(done,cancelled)");
  }

  const { data, error } = await query.limit(300);
  if (error) {
    console.error("admin: не прочитал проекты", error.message);
    return [];
  }
  return (data ?? []).map((row) => shape(row as Record<string, unknown>));
}

export async function projectById(id: string): Promise<Project | null> {
  const db = serviceClient();
  if (!db) return null;

  const { data, error } = await db.from("projects").select(COLUMNS).eq("id", id).maybeSingle();
  if (error || !data) return null;
  return shape(data as Record<string, unknown>);
}

export async function createProject(
  staff: Staff,
  fields: {
    title: string;
    client?: string | null;
    leadId?: string | null;
    ownerStaffId?: string | null;
    amountUsd?: number | null;
    deadline?: string | null;
  },
  ip: string,
): Promise<string | null> {
  const db = serviceClient();
  if (!db) return null;

  const title = fields.title.trim().slice(0, 200);
  if (!title) return null;

  const { data, error } = await db
    .from("projects")
    .insert({
      title,
      client: fields.client?.trim() || null,
      lead_id: fields.leadId || null,
      owner_staff_id: fields.ownerStaffId || staff.id,
      amount_usd: fields.amountUsd ?? null,
      deadline: fields.deadline || null,
      started_at: new Date().toISOString().slice(0, 10),
    })
    .select("id")
    .maybeSingle();

  if (error || !data) {
    console.error("admin: не создал проект", error?.message);
    return null;
  }

  await record("project.created", {
    actorStaffId: staff.id,
    targetType: "project",
    targetId: data.id as string,
    ip,
    meta: { title },
  });

  return data.id as string;
}

/**
 * Передвинуть стадию.
 *
 * Только админ — так и просили. Стадия это обещание клиенту, а не отметка
 * о самочувствии исполнителя, и переставлять её себе исполнитель не должен.
 *
 * Переход попадает в журнал вместе с тем, откуда и куда: по этим строкам
 * потом видно, где проекты стоят дольше всего, а это самый полезный
 * вопрос про производство.
 */
export async function setStage(
  projectId: string,
  stage: string,
  staff: Staff,
  ip: string,
): Promise<boolean> {
  if (!ALL_STAGES.includes(stage)) return false;
  if (staff.role !== "admin") return false;

  const db = serviceClient();
  if (!db) return false;

  const { data: before } = await db
    .from("projects")
    .select("stage, stage_since")
    .eq("id", projectId)
    .maybeSingle();

  if (!before) return false;
  if (before.stage === stage) return true;

  const { error } = await db
    .from("projects")
    .update({ stage, stage_since: new Date().toISOString() })
    .eq("id", projectId);

  if (error) return false;

  await record("project.stage_changed", {
    actorStaffId: staff.id,
    targetType: "project",
    targetId: projectId,
    ip,
    meta: {
      from: before.stage,
      to: stage,
      days_on_previous: daysOnStage(before.stage_since as string),
    },
  });

  return true;
}

export async function updateProject(
  projectId: string,
  fields: {
    title?: string;
    client?: string | null;
    ownerStaffId?: string | null;
    amountUsd?: number | null;
    deadline?: string | null;
    notes?: string | null;
  },
  staff: Staff,
  ip: string,
): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;

  const patch: Record<string, unknown> = {};
  if (fields.title !== undefined) {
    const title = fields.title.trim().slice(0, 200);
    if (!title) return false;
    patch.title = title;
  }
  if (fields.client !== undefined) patch.client = fields.client?.trim() || null;
  if (fields.ownerStaffId !== undefined) patch.owner_staff_id = fields.ownerStaffId || null;
  if (fields.amountUsd !== undefined) patch.amount_usd = fields.amountUsd;
  if (fields.deadline !== undefined) patch.deadline = fields.deadline || null;
  if (fields.notes !== undefined) patch.notes = fields.notes?.slice(0, 4000) || null;

  if (!Object.keys(patch).length) return true;

  const { error } = await db.from("projects").update(patch).eq("id", projectId);
  if (error) return false;

  await record("project.updated", {
    actorStaffId: staff.id,
    targetType: "project",
    targetId: projectId,
    ip,
    meta: { fields: Object.keys(patch) },
  });

  return true;
}
