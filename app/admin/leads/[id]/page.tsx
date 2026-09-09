import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/shell";
import { BUDGET_LABEL, PRIORITY_LABEL, STATUS_LABEL, when } from "@/components/admin/lead-table";
import { record } from "@/lib/admin/audit";
import { requestIp, requireStaff } from "@/lib/admin/guard";
import { leadById } from "@/lib/admin/leads";

export const dynamic = "force-dynamic";

const EXPERTISE_LABEL: Record<string, string> = {
  high: "разбирается",
  medium: "средне",
  low: "не разбирается",
};

const AUTHORITY_LABEL: Record<string, string> = {
  A1: "решает сам",
  A2: "влияет на решение",
  A3: "передаёт дальше",
};

const NEED_LABEL: Record<string, string> = {
  N1: "болит сейчас",
  N2: "понимает задачу",
  N3: "присматривается",
};

const TIMING_LABEL: Record<string, string> = {
  T1: "сейчас",
  T2: "в этом квартале",
  T3: "когда-нибудь",
};

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-faint">{label}</dt>
      <dd className="mt-1 text-sm">{value || "—"}</dd>
    </div>
  );
}

/** Сводка приходит из модели свободным объектом — печатаем как есть. */
function summaryLines(summary: Record<string, unknown>): [string, string][] {
  return Object.entries(summary)
    .filter(([, value]) => typeof value === "string" && value.trim())
    .map(([key, value]) => [key, String(value)]);
}

export default async function LeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const staff = await requireStaff();
  const { id } = await params;

  const lead = await leadById(id);
  if (!lead) notFound();

  // Открытие карточки — уже действие: именно по этой строке потом видно,
  // кто читал лида до того, как он ушёл к конкуренту.
  await record("lead.viewed", {
    actorStaffId: staff.id,
    targetType: "lead",
    targetId: lead.id,
    ip: await requestIp(),
  });

  return (
    <AdminShell staff={staff}>
      <Link href="/admin" className="text-sm text-muted hover:text-text">
        ← к списку
      </Link>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="font-mono text-xl">{lead.request_no ?? lead.id.slice(0, 8)}</h1>
        <span className="text-sm text-muted">{when(lead.created_at)}</span>
        <span className="rounded bg-surface-2 px-2 py-0.5 font-mono text-xs text-faint">
          {lead.grade} · {lead.score}
        </span>
        {lead.discount_granted ? (
          <span className="rounded bg-gold/15 px-2 py-0.5 text-xs text-gold">
            выдана скидка 30%
          </span>
        ) : null}
      </div>

      {lead.opening_line ? (
        <p className="mt-5 max-w-3xl rounded-xl border border-line bg-surface px-5 py-4 text-sm leading-relaxed">
          {lead.opening_line}
        </p>
      ) : null}

      <dl className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Кто" value={lead.contact_name} />
        <Field label="Компания" value={lead.company} />
        <Field label="Ниша" value={lead.niche} />
        <Field
          label="Услуги"
          value={lead.services?.length ? lead.services.join(", ") : null}
        />
        <Field
          label="Бюджет"
          value={lead.budget ? BUDGET_LABEL[lead.budget] ?? lead.budget : null}
        />
        <Field
          label="Сроки"
          value={lead.timing ? TIMING_LABEL[lead.timing] ?? lead.timing : null}
        />
        <Field
          label="Решение"
          value={lead.authority ? AUTHORITY_LABEL[lead.authority] ?? lead.authority : null}
        />
        <Field
          label="Потребность"
          value={lead.need ? NEED_LABEL[lead.need] ?? lead.need : null}
        />
        <Field
          label="Экспертиза"
          value={lead.expertise ? EXPERTISE_LABEL[lead.expertise] ?? lead.expertise : null}
        />
        <Field label="Приоритет" value={PRIORITY_LABEL[lead.priority] ?? lead.priority} />
        <Field label="Статус" value={STATUS_LABEL[lead.status] ?? lead.status} />
        <Field label="Источник" value={`${lead.source} · ${lead.locale}`} />
      </dl>

      {summaryLines(lead.summary).length ? (
        <section className="mt-10">
          <h2 className="text-xs uppercase tracking-wider text-faint">Бриф</h2>
          <dl className="mt-3 max-w-3xl space-y-3">
            {summaryLines(lead.summary).map(([key, value]) => (
              <div key={key} className="rounded-xl border border-line bg-surface px-5 py-3">
                <dt className="font-mono text-xs text-faint">{key}</dt>
                <dd className="mt-1 text-sm leading-relaxed">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {lead.notes ? (
        <section className="mt-8 max-w-3xl">
          <h2 className="text-xs uppercase tracking-wider text-faint">Заметки</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{lead.notes}</p>
        </section>
      ) : null}

      <p className="mt-10 max-w-2xl text-xs leading-relaxed text-faint">
        Контакт клиента и полная переписка здесь не показываются: панель пока
        только читает, а закрепления лида за менеджером ещё нет. До этого
        момента контакт берётся из брифа в Telegram — там видно, кто его
        забрал. Открытие этой карточки записано в журнал.
      </p>
    </AdminShell>
  );
}
