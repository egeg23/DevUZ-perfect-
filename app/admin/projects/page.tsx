import Link from "next/link";

import { addProject } from "./actions";
import { AdminShell } from "@/components/admin/shell";
import { requireStaff } from "@/lib/admin/guard";
import {
  STAGE_LABEL,
  daysOnStage,
  listProjects,
  stageProgress,
} from "@/lib/admin/projects";

export const dynamic = "force-dynamic";

function money(amount: number | null): string {
  if (amount === null) return "—";
  return `${amount.toLocaleString("ru-RU")} $`;
}

function shortDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    timeZone: "Asia/Tashkent",
  }).format(new Date(value));
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ all?: string; r?: string }>;
}) {
  const staff = await requireStaff();
  const { all, r } = await searchParams;

  const includeClosed = all === "1";
  const projects = await listProjects(includeClosed);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <AdminShell staff={staff}>
      <div className="flex flex-wrap items-baseline gap-4">
        <h1 className="text-lg font-semibold">Проекты</h1>
        <Link
          href={includeClosed ? "/admin/projects" : "/admin/projects?all=1"}
          className="text-sm text-muted hover:text-text"
        >
          {includeClosed ? "только активные" : "показать закрытые"}
        </Link>
      </div>

      {r === "failed" ? (
        <p className="mt-4 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
          Не получилось — проверьте название.
        </p>
      ) : null}

      {projects.length ? (
        <ul className="mt-6 space-y-3">
          {projects.map((project) => {
            const progress = stageProgress(project.stage);
            const days = daysOnStage(project.stage_since);
            // Просрочка считается по календарю, а не по стадии: проект
            // может стоять в «разработке» и при этом уже опоздать.
            const overdue = project.deadline && project.deadline < today;

            return (
              <li key={project.id}>
                <Link
                  href={`/admin/projects/${project.id}`}
                  className="block rounded-xl border border-line bg-surface px-5 py-4 transition hover:border-green/30"
                >
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <span className="font-medium">{project.title}</span>
                    {project.client ? (
                      <span className="text-sm text-muted">{project.client}</span>
                    ) : null}
                    <span className="ml-auto font-mono text-sm text-muted">
                      {money(project.amount_usd)}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                    <span className="rounded bg-surface-2 px-2 py-0.5 text-text">
                      {STAGE_LABEL[project.stage] ?? project.stage}
                    </span>
                    <span className="text-faint">
                      {days === 0 ? "сегодня" : `${days} дн. на этой стадии`}
                    </span>
                    {project.owner_name ? (
                      <span className="text-faint">ведёт {project.owner_name}</span>
                    ) : null}
                    <span className={overdue ? "text-gold" : "text-faint"}>
                      срок {shortDate(project.deadline)}
                      {overdue ? " · просрочен" : ""}
                    </span>
                  </div>

                  {progress === null ? (
                    <p className="mt-3 text-xs text-faint">
                      Вне линии стадий — полосу не рисуем: «{STAGE_LABEL[project.stage]}»
                      это не начало и не конец.
                    </p>
                  ) : (
                    <span className="mt-3 block h-1.5 overflow-hidden rounded-r-[4px] bg-line-soft">
                      <span
                        className="block h-full rounded-r-[4px]"
                        style={{
                          width: `${progress}%`,
                          background: "var(--color-chart-bar)",
                        }}
                      />
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-6 rounded-xl border border-line bg-surface px-5 py-8 text-center text-sm text-muted">
          {includeClosed ? "Проектов пока нет." : "Активных проектов нет."}
        </p>
      )}

      <section className="mt-8 rounded-xl border border-line bg-surface px-5 py-4">
        <h2 className="text-xs uppercase tracking-wider text-faint">Новый проект</h2>
        <form action={addProject} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            name="title"
            required
            maxLength={200}
            placeholder="Название"
            className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm"
          />
          <input
            name="client"
            maxLength={200}
            placeholder="Клиент"
            className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm"
          />
          <input
            name="amount"
            type="number"
            min="0"
            step="100"
            placeholder="Сумма, $"
            className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <input
              name="deadline"
              type="date"
              className="min-w-0 flex-1 rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-green px-4 py-2 text-xs font-semibold text-ink transition hover:bg-green-dim"
            >
              Создать
            </button>
          </div>
        </form>
        <p className="mt-3 text-xs text-faint">
          Проект заводит любой сотрудник, стадию двигает админ.
        </p>
      </section>
    </AdminShell>
  );
}
