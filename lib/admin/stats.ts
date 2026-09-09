import { serviceClient } from "@/lib/supabase";

/**
 * Строка, на которой считается статистика.
 *
 * Ни контакта, ни переписки: сводка не должна становиться обходным путём к
 * тому, что закрыто в карточке. Здесь только то, из чего складываются числа.
 */
export type StatsRow = {
  created_at: string;
  source: string;
  locale: string;
  grade: string;
  score: number;
  priority: string;
  status: string;
  assigned_staff_id: string | null;
  assigned_at: string | null;
  services: string[] | null;
  discount_granted: boolean;
};

const STATS_COLUMNS =
  "created_at, source, locale, grade, score, priority, status, assigned_staff_id, assigned_at, services, discount_granted";

/**
 * Сколько строк берём в расчёт.
 *
 * Считаем в приложении, а не в базе: логика сводки должна быть покрыта
 * тестами, а не жить отдельной жизнью в SQL-функции, которую никто не
 * запускает локально. Цена решения — вот этот предел. Он честно показан в
 * интерфейсе: молчаливо обрезанная выборка выглядит как полная сводка и
 * врёт тем убедительнее, чем дольше её никто не проверяет.
 */
export const STATS_LIMIT = 5000;

export type Bucket = { key: string; count: number };

export type Stats = {
  total: number;
  /** Верхний предел выборки достигнут — числа неполные. */
  truncated: boolean;

  byGrade: Bucket[];
  byStatus: Bucket[];
  bySource: Bucket[];
  byLocale: Bucket[];
  topServices: Bucket[];

  averageScore: number;

  /** Воронка: сколько дошло до каждого шага. */
  taken: number;
  won: number;
  lost: number;

  /**
   * Доля выигранных среди закрытых. Считается от won + lost, а не от всех:
   * лид, который ещё в работе, не проигран, и включать его в знаменатель
   * значит занижать результат тем сильнее, чем больше лидов в работе.
   */
  winRate: number | null;

  /**
   * Медиана времени от появления лида до взятия, в минутах.
   *
   * Медиана, а не среднее: один лид, взятый через неделю, сдвигает среднее
   * так, что оно перестаёт описывать обычный день. По медиане видно, за
   * сколько разбирают типичный лид.
   */
  medianMinutesToTake: number | null;

  /** Взятые дольше часа — те, где горячий лид успевал остыть. */
  slowTakes: number;

  discounts: number;
  weekly: Bucket[];
};

function tally(values: string[]): Bucket[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

/** Понедельник недели, в которую попала дата, в виде YYYY-MM-DD. */
function weekKey(iso: string): string {
  const date = new Date(iso);
  const day = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - day);
  return date.toISOString().slice(0, 10);
}

/**
 * Вся арифметика сводки. Чистая функция: ни базы, ни времени изнутри —
 * поэтому её можно проверить тестом, а не глазами на боевых данных.
 */
export function summarize(rows: StatsRow[], truncated = false): Stats {
  const taken = rows.filter((row) => row.assigned_staff_id).length;
  const won = rows.filter((row) => row.status === "won").length;
  const lost = rows.filter((row) => row.status === "lost").length;
  const closed = won + lost;

  const minutesToTake = rows
    .filter((row) => row.assigned_at)
    .map(
      (row) =>
        (new Date(row.assigned_at as string).getTime() -
          new Date(row.created_at).getTime()) /
        60_000,
    )
    // Отрицательные значения возможны только при испорченных данных, но
    // одно такое значение утащило бы медиану вниз молча.
    .filter((minutes) => Number.isFinite(minutes) && minutes >= 0);

  return {
    total: rows.length,
    truncated,

    byGrade: tally(rows.map((row) => row.grade)),
    byStatus: tally(rows.map((row) => row.status)),
    bySource: tally(rows.map((row) => row.source)),
    byLocale: tally(rows.map((row) => row.locale)),
    topServices: tally(rows.flatMap((row) => row.services ?? [])).slice(0, 8),

    averageScore: rows.length
      ? Math.round(rows.reduce((sum, row) => sum + (row.score ?? 0), 0) / rows.length)
      : 0,

    taken,
    won,
    lost,
    winRate: closed ? Math.round((won / closed) * 100) : null,

    medianMinutesToTake: median(minutesToTake),
    slowTakes: minutesToTake.filter((minutes) => minutes > 60).length,

    discounts: rows.filter((row) => row.discount_granted).length,
    weekly: tally(rows.map((row) => weekKey(row.created_at)))
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-12),
  };
}

export async function loadStats(): Promise<Stats & { offline: boolean }> {
  const db = serviceClient();
  if (!db) return { ...summarize([]), offline: true };

  const { data, error } = await db
    .from("leads")
    .select(STATS_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(STATS_LIMIT);

  if (error) {
    console.error("admin: не собрал статистику", error.message);
    return { ...summarize([]), offline: true };
  }

  const rows = (data ?? []) as unknown as StatsRow[];
  return { ...summarize(rows, rows.length >= STATS_LIMIT), offline: false };
}

// ───────────────────────────────────────────────────────────────────────────
// По менеджерам — только для админа
// ───────────────────────────────────────────────────────────────────────────

export type StaffStat = {
  staffId: string;
  name: string;
  active: number;
  won: number;
  lost: number;
  total: number;
};

/**
 * Разрез по людям отделён от общей сводки намеренно.
 *
 * Общие числа видит вся команда — это про прозрачность, ради которой панель
 * и делалась. А «у кого сколько выиграно» рядом с именем коллеги — это уже
 * не прозрачность, а публичный рейтинг, и он меняет поведение раньше, чем
 * результат: лиды начинают брать по лёгкости, а не по важности.
 */
export async function loadStaffStats(): Promise<StaffStat[]> {
  const db = serviceClient();
  if (!db) return [];

  const [{ data: staff }, { data: leads }] = await Promise.all([
    db.from("staff").select("id, display_name").eq("is_active", true),
    db
      .from("leads")
      .select("assigned_staff_id, status")
      .not("assigned_staff_id", "is", null)
      .limit(STATS_LIMIT),
  ]);

  const byStaff = new Map<string, StaffStat>();
  for (const person of staff ?? []) {
    byStaff.set(person.id as string, {
      staffId: person.id as string,
      name: (person.display_name as string) ?? "—",
      active: 0,
      won: 0,
      lost: 0,
      total: 0,
    });
  }

  for (const lead of leads ?? []) {
    const stat = byStaff.get(lead.assigned_staff_id as string);
    if (!stat) continue;
    stat.total += 1;
    if (lead.status === "won") stat.won += 1;
    else if (lead.status === "lost") stat.lost += 1;
    else if (lead.status === "taken") stat.active += 1;
  }

  return [...byStaff.values()].sort((a, b) => b.total - a.total);
}
