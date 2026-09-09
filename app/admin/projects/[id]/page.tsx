import Link from "next/link";
import { notFound } from "next/navigation";

import { editProject, moveStage } from "../actions";
import { AdminShell } from "@/components/admin/shell";
import { when } from "@/components/admin/lead-table";
import { requireStaff } from "@/lib/admin/guard";
import {
  ALL_STAGES,
  STAGES,
  STAGE_LABEL,
  daysOnStage,
  projectById,
  stageProgress,
} from "@/lib/admin/projects";

export const dynamic = "force-dynamic";

const FIELD =
  "w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm";

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ r?: string }>;
}) {
  const staff = await requireStaff();
  const { id } = await params;
  const { r } = await searchParams;

  const project = await projectById(id);
  if (!project) notFound();

  const progress = stageProgress(project.stage);
  const days = daysOnStage(project.stage_since);
  const isAdmin = staff.role === "admin";

  return (
    <AdminShell staff={staff}>
      <Link href="/admin/projects" className="text-sm text-muted hover:text-text">
        ← к проектам
      </Link>

      {r ? (
        <p
          className={`mt-4 rounded-xl border px-4 py-2.5 text-sm ${
            r === "ok"
              ? "border-green/30 bg-green/10 text-green"
              : "border-gold/30 bg-gold/10 text-gold"
          }`}
        >
          {r === "ok" ? "Готово." : "Не получилось."}
        </p>
      ) : null}

      <h1 className="mt-4 text-xl font-semibold">{project.title}</h1>
      <p className="mt-1 text-sm text-muted">
        {project.client || "клиент не указан"}
        {project.owner_name ? ` · ведёт ${project.owner_name}` : ""}
      </p>

      {/* ── Стадия ──────────────────────────────────────────────────── */}
      <section className="mt-6 rounded-xl border border-line bg-surface px-5 py-4">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="text-xs uppercase tracking-wider text-faint">Стадия</span>
          <span className="text-sm">{STAGE_LABEL[project.stage] ?? project.stage}</span>
          <span className="text-xs text-faint">
            {days === 0 ? "с сегодняшнего дня" : `${days} дн.`} · с {when(project.stage_since)}
          </span>
        </div>

        {progress === null ? (
          <p className="mt-3 text-xs text-faint">
            Стадия вне линии: полосу не рисуем — это не начало и не конец.
          </p>
        ) : (
          <>
            <span className="mt-3 block h-1.5 overflow-hidden rounded-r-[4px] bg-line-soft">
              <span
                className="block h-full rounded-r-[4px]"
                style={{ width: `${progress}%`, background: "var(--color-chart-bar)" }}
              />
            </span>
            <ol className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-faint">
              {STAGES.map((stage) => (
                <li key={stage} className={stage === project.stage ? "text-text" : undefined}>
                  {STAGE_LABEL[stage]}
                </li>
              ))}
            </ol>
          </>
        )}

        {isAdmin ? (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-line-soft pt-4">
            {ALL_STAGES.map((stage) => (
              <form key={stage} action={moveStage}>
                <input type="hidden" name="project" value={project.id} />
                <input type="hidden" name="stage" value={stage} />
                <button
                  type="submit"
                  disabled={stage === project.stage}
                  className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                    stage === project.stage
                      ? "border-green/40 bg-green/10 text-green"
                      : "border-line bg-surface-2 text-muted hover:text-text"
                  }`}
                >
                  {STAGE_LABEL[stage] ?? stage}
                </button>
              </form>
            ))}
          </div>
        ) : (
          <p className="mt-4 border-t border-line-soft pt-4 text-xs text-faint">
            Стадию двигает админ. Она — обещание клиенту, а не отметка о
            самочувствии исполнителя.
          </p>
        )}
      </section>

      {/* ── Правки ──────────────────────────────────────────────────── */}
      <section className="mt-4 rounded-xl border border-line bg-surface px-5 py-4">
        <h2 className="text-xs uppercase tracking-wider text-faint">Данные проекта</h2>
        <form action={editProject} className="mt-3 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="project" value={project.id} />

          <label className="block">
            <span className="text-xs text-faint">Название</span>
            <input name="title" required maxLength={200} defaultValue={project.title} className={`${FIELD} mt-1`} />
          </label>

          <label className="block">
            <span className="text-xs text-faint">Клиент</span>
            <input name="client" maxLength={200} defaultValue={project.client ?? ""} className={`${FIELD} mt-1`} />
          </label>

          <label className="block">
            <span className="text-xs text-faint">Сумма, $</span>
            <input
              name="amount"
              type="number"
              min="0"
              step="100"
              defaultValue={project.amount_usd ?? ""}
              className={`${FIELD} mt-1`}
            />
          </label>

          <label className="block">
            <span className="text-xs text-faint">Срок</span>
            <input name="deadline" type="date" defaultValue={project.deadline ?? ""} className={`${FIELD} mt-1`} />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-xs text-faint">Заметки</span>
            <textarea name="notes" rows={4} maxLength={4000} defaultValue={project.notes ?? ""} className={`${FIELD} mt-1 resize-y`} />
          </label>

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-lg border border-line bg-surface-2 px-4 py-1.5 text-xs transition hover:border-green/40 hover:text-green"
            >
              Сохранить
            </button>
          </div>
        </form>
      </section>

      {project.lead_id ? (
        <p className="mt-4 text-sm">
          <Link href={`/admin/leads/${project.lead_id}`} className="text-blue-soft hover:underline">
            Лид, из которого вырос проект →
          </Link>
        </p>
      ) : null}

      <p className="mt-8 max-w-2xl text-xs leading-relaxed text-faint">
        Каждый переход стадии записан в журнал вместе с тем, откуда и куда, и
        сколько дней проект простоял на предыдущей. По этим строкам потом видно,
        где производство встаёт, — а это самый полезный вопрос про сроки.
      </p>
    </AdminShell>
  );
}
