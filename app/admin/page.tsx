import Link from "next/link";
import { redirect } from "next/navigation";

import { DashboardHome } from "@/components/admin/dashboard-home";
import { AdminShell } from "@/components/admin/shell";
import { SweepBanner } from "@/components/admin/sweep-banner";
import { LeadTable } from "@/components/admin/lead-table";
import { TouchPlanLine } from "@/components/admin/touch-plan-line";
import { requireStaff } from "@/lib/admin/guard";
import { touchProgressOf } from "@/lib/admin/touch-store";
import { PRIORITIES, STATUSES, leadCounts, listLeads, scopeFor } from "@/lib/admin/leads";
import { canSee } from "@/lib/admin/roles";
import { approves, pendingTransfers } from "@/lib/admin/transfers";

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

/**
 * Вкладки главной у владельца. У остальных ролей экран короче, и вкладок
 * нет: менеджер открывает панель ради своих лидов, и прятать их за кликом
 * значило бы добавить шаг к каждому рабочему дню.
 */
const OWNER_TABS = [
  { key: "today", label: "Сегодня" },
  { key: "leads", label: "Лиды" },
  { key: "money", label: "Деньги" },
  { key: "team", label: "Команда" },
] as const;
type OwnerTab = (typeof OWNER_TABS)[number]["key"];

function ownerTabOf(raw: string | undefined): OwnerTab {
  return OWNER_TABS.some((t) => t.key === raw) ? (raw as OwnerTab) : "today";
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
    p?: string;
    tab?: string;
    d?: string;
    ga?: string;
    gd?: string;
    gp?: string;
  }>;
}) {
  const staff = await requireStaff();
  const params = await searchParams;

  // Трафик был вкладкой владельца, теперь это раздел для владельца и
  // руководителей. Старые закладки и адреса возврата из Google ведут сюда —
  // переводим их туда же, с периодом и пометкой входа.
  if (params.tab === "traffic" && canSee(staff.role, "/admin/traffic")) {
    const keep = new URLSearchParams();
    for (const key of ["d", "ga", "gd", "gp"] as const) {
      const value = params[key];
      if (value) keep.set(key, value);
    }
    const query = keep.toString();
    redirect(query ? `/admin/traffic?${query}` : "/admin/traffic");
  }
  const ownerTab = staff.role === "admin" ? ownerTabOf(params.tab) : null;

  const page = Math.max(Number.parseInt(params.page ?? "1", 10) || 1, 1);
  const limit = 50;

  // Менеджер видит свободных и своих, руководитель и владелец — всех.
  const scope = scopeFor(staff);
  const [counts, leads, pending, plan] = await Promise.all([
    leadCounts(staff.id, scope),
    listLeads(
      {
        priority: params.priority,
        status: params.status,
        owner: params.owner,
        ownerStaffId: staff.id,
        limit,
        offset: (page - 1) * limit,
      },
      scope,
    ),
    approves(staff.role) ? pendingTransfers() : Promise.resolve([]),
    touchProgressOf(staff.id),
  ]);

  const base = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { ...params, ...patch, page: undefined, p: undefined, d: undefined };
    for (const [key, value] of Object.entries(merged)) {
      if (value) next.set(key, value);
    }
    const query = next.toString();
    return query ? `/admin?${query}` : "/admin";
  };

  const pages = Math.max(Math.ceil(leads.total / limit), 1);

  const pendingBlock = (
    <>
      {/* Просьбы передать лида: решать их должен тот, кто их видит, а не тот,
          кто вспомнил. Поэтому очередь стоит первой, а не спрятана в лиде. */}
      {pending.length ? (
        <section className="mb-6 rounded-xl border border-gold/30 bg-gold/5 px-5 py-4">
          <p className="text-xs uppercase tracking-wider text-gold">
            Ждут вашего решения: {pending.length}
          </p>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {pending.map((item) => (
              <li key={item.id} className="flex flex-wrap items-baseline gap-x-2">
                <Link href={`/admin/leads/${item.lead_id}`} className="font-mono hover:text-green">
                  {item.request_no ?? item.company ?? item.lead_id.slice(0, 8)}
                </Link>
                <span className="text-muted">
                  {item.from_name ?? "—"} → {item.to_name ?? "—"}
                </span>
                {item.note ? <span className="text-xs text-faint">{item.note}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );

  const leadsBlock = (
    <>
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
    </>
  );

  return (
    <AdminShell staff={staff}>
      {/* Стоит выше всего остального намеренно: человек, у которого молча
          перестали приходить напоминания, ничего об этом не знает, а
          узнаёт по остывшему лиду через неделю. */}
      <SweepBanner />

      {/* План касаний на неделю — здесь, а не только в самих касаниях.
          Открывают панель с главной, и число, ради которого человек пойдёт
          в касания, должно встретить его до того, как он туда свернёт. */}
      <TouchPlanLine progress={plan} />

      {leads.offline ? (
        <p className="mb-6 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
          База недоступна. Это не «лидов нет» — это значит, что панель сейчас
          ничего не видит; проверьте переменные Supabase на сервере.
        </p>
      ) : null}

      {ownerTab ? (
        <>
          {/* Вкладки — ссылками, а не скриптом: страница серверная, вкладка
              живёт в адресе, и «Деньги» можно открыть закладкой. */}
          <nav className="no-scrollbar -mx-1 mb-5 flex gap-1 overflow-x-auto border-b border-line px-1">
            {OWNER_TABS.map((t) => {
              const badge = t.key === "today" ? pending.length : t.key === "leads" ? counts.free : 0;
              return (
                <Link
                  key={t.key}
                  href={t.key === "today" ? "/admin" : `/admin?tab=${t.key}`}
                  className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm transition ${
                    ownerTab === t.key
                      ? "border-green text-green"
                      : "border-transparent text-muted hover:text-text"
                  }`}
                >
                  {t.label}
                  {badge ? (
                    <span className="ml-1.5 rounded-full bg-gold/15 px-1.5 py-0.5 font-mono text-[10px] text-gold">
                      {badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
          {ownerTab === "today" ? (
            <>
              {pendingBlock}
              <DashboardHome staff={staff} planNotice={params.p} section="today" />
            </>
          ) : null}
          {ownerTab === "money" ? <DashboardHome staff={staff} planNotice={params.p} section="money" /> : null}
          {ownerTab === "team" ? <DashboardHome staff={staff} planNotice={params.p} section="team" /> : null}
          {ownerTab === "leads" ? leadsBlock : null}
        </>
      ) : (
        <>
          {pendingBlock}
          {/* Личный дашборд: у каждой роли свой. Стоит выше общего списка —
              сначала то, что требует действия сегодня, потом всё остальное. */}
          <DashboardHome staff={staff} planNotice={params.p} />
          {leadsBlock}
        </>
      )}
    </AdminShell>
  );
}
