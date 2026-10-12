"use server";

import { revalidatePath } from "next/cache";

import { record } from "@/lib/admin/audit";
import { currentStaff, requestIp } from "@/lib/admin/guard";
import { opens } from "@/lib/admin/roles";
import { setSectionOn } from "@/lib/admin/section-switch";
import { syncBotMenu } from "@/lib/qualify/menu";
import { grade, learnKey, questionsFor } from "@/lib/learn/quiz";
import { addMaterial, materialUrl, removeMaterial, saveAttempt } from "@/lib/learn/store";

/**
 * Действия раздела «Обучение». Каждое проверяет права само, на сервере:
 * форму можно отправить и мимо кнопки.
 *
 * - сдать тест — любой, кому раздел открыт (`opens`, с выключателем);
 * - включить или выключить обучение для команды и вести материалы — только
 *   владелец.
 */

const HREF = "/admin/learn";

export type SubmitResult =
  | { ok: true; score: number; total: number; passed: boolean; saved: boolean }
  | { ok: false };

/** Тест сдан: ответы пересчитывает сервер, браузер присылает только выбор. */
export async function submitQuiz(key: string, answers: Record<string, number>): Promise<SubmitResult> {
  const staff = await currentStaff();
  const course = learnKey(key);
  if (!staff || !course || !opens(staff, HREF)) return { ok: false };
  const questions = questionsFor(course, staff, staff.panel_locale);
  if (!questions.length) return { ok: false };
  const result = grade(questions, answers);
  const saved = await saveAttempt({
    staffId: staff.id,
    course,
    score: result.score,
    total: result.total,
    passed: result.passed,
    answers: result.answers,
    source: "panel",
  });
  revalidatePath(HREF);
  return { ok: true, score: result.score, total: result.total, passed: result.passed, saved };
}

/** «Включить обучение для команды» / «Выключить обучение» — только владелец. */
export async function switchLearn(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  if (!staff || staff.role !== "admin") return;
  const on = formData.get("on") === "1";
  if (!(await setSectionOn(HREF, on, staff.id))) return;
  await record("learn.switched", { actorStaffId: staff.id, targetType: "section", targetId: HREF, meta: { on }, ip: await requestIp() });
  // /learn в меню бота — у команды только при включённом обучении.
  await syncBotMenu().catch(() => null);
  revalidatePath("/admin", "layout");
}

/** «Добавить материал»: название и ссылка к курсу — только владелец. */
export async function addMaterialAction(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  if (!staff || staff.role !== "admin") return;
  const course = learnKey(formData.get("course"));
  const title = String(formData.get("title") ?? "").trim().slice(0, 200);
  const url = materialUrl(formData.get("url"));
  if (!course || !title || !url) return;
  if (!(await addMaterial(course, title, url, staff.id))) return;
  await record("learn.material_added", { actorStaffId: staff.id, targetType: "learn_course", targetId: course, meta: { title, url }, ip: await requestIp() });
  revalidatePath(`${HREF}/${course}`);
}

/** «Убрать материал» — только владелец. */
export async function removeMaterialAction(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  if (!staff || staff.role !== "admin") return;
  const id = String(formData.get("id") ?? "");
  const course = learnKey(formData.get("course"));
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  if (!(await removeMaterial(id))) return;
  await record("learn.material_removed", { actorStaffId: staff.id, targetType: "learn_material", targetId: id, ip: await requestIp() });
  revalidatePath(course ? `${HREF}/${course}` : HREF);
}
