import { serviceClient } from "@/lib/supabase";
import type { Role } from "@/lib/admin/roles";

/**
 * «Обучение» — база: попытки и материалы (миграция 0154_learn.sql).
 * Кто что вправе — проверяют действия панели и бот, здесь только запросы.
 */

export type Attempt = {
  staffId: string;
  course: string;
  score: number;
  total: number;
  passed: boolean;
  source: "panel" | "bot";
  createdAt: string;
};

export type Material = { id: string; course: string; title: string; url: string };

/** Лучшее по курсу: сдан ли хоть раз, лучший счёт и сколько было попыток. */
export type Best = { passed: boolean; score: number; total: number; tries: number; lastAt: string };

export async function saveAttempt(input: {
  staffId: string;
  course: string;
  score: number;
  total: number;
  passed: boolean;
  answers: Record<string, number>;
  source: "panel" | "bot";
}): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { error } = await db.from("learn_attempts").insert({
    staff_id: input.staffId,
    course: input.course,
    score: input.score,
    total: input.total,
    passed: input.passed,
    answers: input.answers,
    source: input.source,
  });
  if (error) console.error("learn: не сохранил попытку", error.message);
  return !error;
}

/** Попытки одного человека или всей команды (staffId = null), новые сверху. */
export async function listAttempts(staffId: string | null, limit = 2000): Promise<Attempt[]> {
  const db = serviceClient();
  if (!db) return [];
  let query = db
    .from("learn_attempts")
    .select("staff_id, course, score, total, passed, source, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (staffId) query = query.eq("staff_id", staffId);
  const { data, error } = await query;
  if (error) {
    console.error("learn: не прочитал попытки", error.message);
    return [];
  }
  return (data ?? []).map((row) => ({
    staffId: String(row.staff_id),
    course: String(row.course),
    score: Number(row.score),
    total: Number(row.total),
    passed: Boolean(row.passed),
    source: row.source === "bot" ? "bot" : "panel",
    createdAt: String(row.created_at),
  }));
}

/** Попытки → лучшее по человеку и курсу. Чистая функция — её проверяет тест. */
export function bestOf(attempts: readonly Attempt[]): Map<string, Map<string, Best>> {
  const out = new Map<string, Map<string, Best>>();
  for (const a of attempts) {
    const mine = out.get(a.staffId) ?? new Map<string, Best>();
    out.set(a.staffId, mine);
    const was = mine.get(a.course);
    if (!was) {
      mine.set(a.course, { passed: a.passed, score: a.score, total: a.total, tries: 1, lastAt: a.createdAt });
      continue;
    }
    const better = a.score / a.total > was.score / was.total;
    mine.set(a.course, {
      passed: was.passed || a.passed,
      score: better ? a.score : was.score,
      total: better ? a.total : was.total,
      tries: was.tries + 1,
      lastAt: a.createdAt > was.lastAt ? a.createdAt : was.lastAt,
    });
  }
  return out;
}

export type Member = { id: string; name: string; role: Role; createdAt: string };

/** Активная команда — для таблицы результатов. */
export async function activeTeam(): Promise<Member[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db
    .from("staff")
    .select("id, display_name, role, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.display_name),
    role: row.role as Role,
    createdAt: String(row.created_at),
  }));
}

export async function listMaterials(course?: string): Promise<Material[]> {
  const db = serviceClient();
  if (!db) return [];
  let query = db.from("learn_materials").select("id, course, title, url").order("created_at", { ascending: true });
  if (course) query = query.eq("course", course);
  const { data, error } = await query;
  if (error) return [];
  return (data ?? []).map((row) => ({ id: String(row.id), course: String(row.course), title: String(row.title), url: String(row.url) }));
}

/** Ссылка материала: только http(s), без пробелов, до 2000 знаков. */
export function materialUrl(raw: unknown): string | null {
  const text = String(raw ?? "").trim();
  if (!text || text.length > 2000 || /\s/.test(text)) return null;
  try {
    const url = new URL(text);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function addMaterial(course: string, title: string, url: string, by: string): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { error } = await db.from("learn_materials").insert({ course, title, url, created_by: by });
  return !error;
}

export async function removeMaterial(id: string): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { error } = await db.from("learn_materials").delete().eq("id", id);
  return !error;
}
