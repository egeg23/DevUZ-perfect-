import Anthropic from "@anthropic-ai/sdk";

import { record } from "@/lib/admin/audit";
import type { Staff } from "@/lib/admin/session";
import { pdfText, tooThin } from "@/lib/hiring/pdf";
import {
  RESUME_TOOL,
  cleanReport,
  forbiddenGrounds,
  reportProblems,
  resumePrompt,
  resumeSystem,
  type ResumeReport,
  type Verdict,
} from "@/lib/hiring/resume";
import { serviceClient } from "@/lib/supabase";
import { anthropic } from "@/lib/model-road";

/**
 * Разбор резюме: файл, модель, база.
 *
 * Порядок здесь такой же, как у первого касания, и по той же причине:
 * сначала измеряем, потом просим модель, потом проверяем её машиной и только
 * потом показываем человеку.
 */

/** Разбор резюме — Соннет: задача та же, что у письма, и цена вчетверо ниже. */
const MODEL = process.env.HIRING_MODEL || "claude-sonnet-5";

export type ReviewResult = { ok: true; id: string } | { ok: false; why: string };

export async function reviewResume(input: {
  bytes: ArrayBuffer;
  role: string;
  staff: Staff;
  ip: string;
}): Promise<ReviewResult> {
  const db = serviceClient();
  if (!db) return { ok: false, why: "База недоступна." };
  if (!process.env.ANTHROPIC_API_KEY) return { ok: false, why: "Нет ключа модели — разбирать некому." };

  let text: string;
  let pages: number;
  try {
    const read = await pdfText(input.bytes);
    text = read.text;
    pages = read.pages;
  } catch (error) {
    return { ok: false, why: `Файл не прочитался: ${error instanceof Error ? error.message : String(error)}` };
  }

  // Скан без текстового слоя отдаёт пустоту. Сказать об этом надо прямо:
  // модель, получив пустой текст, напишет «опыт не указан» — то есть соврёт
  // о живом человеке.
  if (tooThin(text)) {
    return {
      ok: false,
      why: "В файле почти нет текста — похоже, это скан или картинки. Нужен PDF, из которого текст копируется.",
    };
  }

  /**
   * Один ход модели.
   *
   * `notes` — её же промахи с прошлой попытки. Возвращать их обратно дешевле,
   * чем показывать нанимающему разбор с пустыми списками: он открывает его
   * ради них, а не ради вступления.
   */
  const ask = async (notes: string | null): Promise<ResumeReport | null> => {
    const response = await anthropic().beta.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: [{ type: "text" as const, text: resumeSystem(), cache_control: { type: "ephemeral" as const } }],
      messages: [
        {
          role: "user" as const,
          content: notes
            ? `${resumePrompt({ role: input.role, text })}\n\nПредыдущая попытка вышла неполной: ${notes}. Напиши разбор заново и заполни все списки.`
            : resumePrompt({ role: input.role, text }),
        },
      ],
      tools: [RESUME_TOOL as unknown as Anthropic.Beta.BetaToolUnion],
      tool_choice: { type: "tool", name: RESUME_TOOL.name },
      output_config: { effort: "medium" as const },
    });
    const block = response.content.find((b) => b.type === "tool_use");
    return cleanReport(block && block.type === "tool_use" ? block.input : null);
  };

  let report: ResumeReport | null;
  try {
    report = await ask(null);
    const missing = report ? reportProblems(report) : [{ code: "empty", text: "разбор не собрался" }];
    if (missing.length) report = (await ask(missing.map((m) => m.text).join(", "))) ?? report;
  } catch (error) {
    return { ok: false, why: `Модель не ответила: ${error instanceof Error ? error.message : String(error)}` };
  }
  if (!report) return { ok: false, why: "Модель вернула разбор, который нечего показать." };

  /**
   * Проверка оснований — машиной, а не доверием.
   *
   * Запрет на возраст, пол и семейное положение стоит в системном промпте
   * первой строкой, и в девяти разборах из десяти этого хватает. Десятый —
   * как раз тот, где вывод построен на возрасте, и именно он превращает
   * инструмент найма в инструмент дискриминации. Такой разбор не
   * сохраняется вовсе: показать его нанимающему — значит уже повлиять на
   * решение.
   */
  const grounds = forbiddenGrounds(report);
  if (grounds.length) {
    return {
      ok: false,
      why: `Разбор опёрся на то, что к работе не относится (${grounds.join(", ")}). Он не сохранён — попробуйте ещё раз.`,
    };
  }

  const { data, error } = await db
    .from("candidate_reviews")
    .insert({
      created_by: input.staff.id,
      name: report.name,
      role: input.role,
      wants: report.wants || null,
      verdict: report.verdict,
      headline: report.headline,
      report,
      pages,
    })
    .select("id")
    .maybeSingle();
  if (error || !data) return { ok: false, why: "Разбор не сохранился." };

  await record("candidate.reviewed", {
    actorStaffId: input.staff.id,
    targetType: "candidate",
    targetId: String(data.id),
    ip: input.ip,
    meta: { name: report.name, role: input.role, verdict: report.verdict },
  });

  return { ok: true, id: String(data.id) };
}

export type CandidateRow = {
  id: string;
  createdAt: string;
  name: string;
  role: string;
  wants: string | null;
  verdict: Verdict;
  headline: string;
  report: ResumeReport;
  author: string | null;
};

export async function listCandidates(limit = 50): Promise<CandidateRow[]> {
  const db = serviceClient();
  if (!db) return [];

  const { data, error } = await db
    .from("candidate_reviews")
    .select("id, created_at, name, role, wants, verdict, headline, report, staff:created_by (display_name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`разборы не прочитались: ${error.message}`);

  return (data ?? []).map((row) => {
    const joined = row.staff as unknown;
    const person = (Array.isArray(joined) ? joined[0] : joined) as { display_name?: string } | null;
    return {
      id: String(row.id),
      createdAt: String(row.created_at),
      name: String(row.name),
      role: String(row.role),
      wants: (row.wants as string | null) ?? null,
      verdict: row.verdict as Verdict,
      headline: String(row.headline),
      report: row.report as ResumeReport,
      author: person?.display_name ?? null,
    };
  });
}

/**
 * Убрать разбор.
 *
 * Нужен не для порядка, а потому что это чужие данные: человек не нанялся —
 * держать его разбор незачем, и удалить его должно быть так же легко, как
 * завести.
 */
export async function dropCandidate(id: string, staff: Staff, ip: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db.from("candidate_reviews").delete().eq("id", id);
  await record("candidate.dropped", {
    actorStaffId: staff.id,
    targetType: "candidate",
    targetId: id,
    ip,
  });
}
