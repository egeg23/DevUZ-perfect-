import Link from "next/link";

import { AdminShell } from "@/components/admin/shell";
import { LeadTable } from "@/components/admin/lead-table";
import { requireStaff } from "@/lib/admin/guard";
import { PRIORITIES, STATUSES, leadCounts, listLeads } from "@/lib/admin/leads";

// Панель показывает состояние базы прямо сейчас. Любое кэширование здесь
// означает менеджера, который звонит по лиду, взятому полчаса назад другим.
export const dynamic = "force-dynamic";

const PRIORITY_LABEL: Record<string, string> = {
  hot: "горячие",
  warm: "тёплые",
  nurture: "дозреют",
  archive: "архив",
};

const STATUS_LABEL: Record<string, string> = {
  new: "новые",
  taken: "в работе",
  dropped: "отложены",
  won: "выиграны",
  lost: "проиграны",
};

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 text-xs transition ${
        active
          ? "border-green/40 bg-green/10 text-green"
          : "border-line bg-surface text-muted hover:text-text"
      }`}
    >
      {children}
    </Link>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-5 py-4">
      <p className="font-mono text-2xl">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wider text-faint">{label}</p>
    </div>
  );
}

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{
    priority?: string;
    status?: string;
    owner?: string;
    page?: string;
  }>;
}) {
  const staff = await requireStaff();
  const params = await searchParams;

  const page = Math.max(Number.parseInt(params.page ?? "1", 10) || 1, 1);
  const limit = 50;

  const [counts, leads] = await Promise.all([
    leadCounts(staff.id),
    listLeads({
      priority: params.priority,
      status: params.status,
      owner: params.owner,
      ownerStaffId: staff.id,
      limit,
      offset: (page - 1) * limit,
    }),
  ]);

  const base = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { ...params, ...patch, page: undefined };
    for (const [key, value] of Object.entries(merged)) {
      if (value) next.set(key, value);
    }
    const query = next.toString();
    return query ? `/admin?${query}` : "/admin";
  };

  const pages = Math.max(Math.ceil(leads.total / limit), 1);

  return (
    <AdminShell staff={staff}>
      {leads.offline ? (
        <p className="mb-6 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
          База недоступна. Это не «лидов нет» — это значит, что панель сейчас
          ничего не видит; проверьте переменные Supabase на сервере.
        </p>
      ) : null}

      <div className="grid grid-cols-3 gap-3 sm:max-w-lg">
        <Stat value={counts.total} label="всего" />
        <Stat value={counts.free} label="свободных" />
        <Stat value={counts.mine} label="на мне" />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <Chip href={base({ owner: undefined })} active={!params.owner}>
          все лиды
        </Chip>
        <Chip href={base({ owner: "free" })} active={params.owner === "free"}>
          свободные
        </Chip>
        <Chip href={base({ owner: "mine" })} active={params.owner === "mine"}>
          мои
        </Chip>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Chip href={base({ priority: undefined })} active={!params.priority}>
          все приоритеты
        </Chip>
        {PRIORITIES.map((value) => (
          <Chip
            key={value}
            href={base({ priority: value })}
            active={params.priority === value}
          >
            {PRIORITY_LABEL[value]}
          </Chip>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Chip href={base({ status: undefined })} active={!params.status}>
          все статусы
        </Chip>
        {STATUSES.map((value) => (
          <Chip key={value} href={base({ status: value })} active={params.status === value}>
            {STATUS_LABEL[value]}
          </Chip>
        ))}
      </div>

      <div className="mt-6">
        <LeadTable rows={leads.rows} />
      </div>

      {pages > 1 ? (
        <div className="mt-5 flex items-center gap-3 text-sm text-muted">
          {page > 1 ? (
            <Link href={`${base({})}${base({}).includes("?") ? "&" : "?"}page=${page - 1}`}>
              ← назад
            </Link>
          ) : null}
          <span className="font-mono text-xs text-faint">
            {page} / {pages}
          </span>
          {page < pages ? (
            <Link href={`${base({})}${base({}).includes("?") ? "&" : "?"}page=${page + 1}`}>
              вперёд →
            </Link>
          ) : null}
        </div>
      ) : null}

      <p className="mt-8 max-w-2xl text-xs leading-relaxed text-faint">
        Контактов и переписки в списке нет: контакт открывается в карточке и
        только тому, за кем лид закреплён. Каждое открытие — строка в журнале
        с именем и временем. Свободного лида сначала нужно взять.
      </p>
    </AdminShell>
  );
}
