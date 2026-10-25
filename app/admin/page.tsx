import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/shell";
import { SweepBanner } from "@/components/admin/sweep-banner";
import { LeadAdd } from "@/components/admin/lead-add";
import { LeadTable } from "@/components/admin/lead-table";
import { LeadBoard } from "@/components/admin/lead-board";
import { homeDict, priorityFilterDict, statusFilterDict } from "@/content/admin-panel/home";
import { requireStaff } from "@/lib/admin/guard";
import { pick } from "@/lib/admin/i18n";
import { LEAD_SEARCH_MAX, PRIORITIES, STATUSES, leadCounts, listLeads, scopeFor } from "@/lib/admin/leads";
import { opens } from "@/lib/admin/roles";
import { activeStaff } from "@/lib/admin/team";
import { approves, pendingTransfers } from "@/lib/admin/transfers";
import { boardOf } from "@/lib/admin/lead-board";
import { loadDeals } from "@/lib/admin/sales-stages-store";
import { nextStepsFor } from "@/lib/admin/next-step-store";

// Панель показывает состояние базы прямо сейчас. Любое кэширование здесь
// означает менеджера, который звонит по лиду, взятому полчаса назад другим.
export const dynamic = "force-dynamic";

// Подписи фильтров — priorityFilterDict и statusFilterDict
// (content/admin-panel/home.ts), на языке сотрудника.

function Chip({
  href,
  active,
  count,
  children,
}: {
  href: string;
  active: boolean;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition ${
        active
          ? "border-green/40 bg-green/10 text-green"
          : "border-line bg-surface text-muted hover:text-text"
      }`}
    >
      {children}
      {count !== undefined ? <span className="font-mono text-[11px] opacity-80">{count}</span> : null}
    </Link>
  );
}

/**
 * Старые вкладки владельца на «Лидах» → где это теперь. Владелец, 23.10.2026,
 * на разбор удобства: «Делаем все сразу». «Сегодня» повторяло «Главную»,
 * «Деньги» — «Финансы», «Команда» — недельные блоки внизу «Главной».
 */
const OLD_TABS: Record<string, string> = {
  today: "/admin/hq",
  team: "/admin/hq#week",
  money: "/admin/finance",
};

/**
 * «Лиды» — только список: поиск, фильтры, таблица. Владелец, 23.10.2026:
 * на «Лидах» перед списком стояло до шестнадцати блоков — плитки денег,
 * рекомендации, «План и факт», команда за неделю, у владельца ещё и вкладки.
 * Это вторая «Главная», а сам список был в самом низу. Недельные блоки
 * переехали вниз «Главной» (components/admin/dashboard-home.tsx), касса и
 * налоги — в «Финансы».
 */
export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    /** «board» — доской по ступеням продажи (components/admin/lead-board.tsx). */
    view?: string;
    priority?: string;
    status?: string;
    owner?: string;
    page?: string;
    tab?: string;
    d?: string;
    ga?: string;
    gd?: string;
    gp?: string;
    t?: string;
    tg?: string;
    tf?: string;
    tp?: string;
    /** Почему лид вручную не добавился (components/admin/lead-add.tsx). */
    add?: string;
  }>;
}) {
  const staff = await requireStaff();
  const params = await searchParams;
  const locale = staff.panel_locale;
  const t = pick(homeDict, locale);

  // Трафик был вкладкой владельца, теперь это раздел для владельца и
  // руководителей. Старые закладки и адреса возврата из Google ведут сюда —
  // переводим их туда же, с периодом и пометкой входа.
  if (params.tab === "traffic" && opens(staff, "/admin/traffic")) {
    const keep = new URLSearchParams();
    for (const key of ["d", "ga", "gd", "gp"] as const) {
      const value = params[key];
      if (value) keep.set(key, value);
    }
    const query = keep.toString();
    redirect(query ? `/admin/traffic?${query}` : "/admin/traffic");
  }
  if (params.tab && OLD_TABS[params.tab]) redirect(OLD_TABS[params.tab]);
  // Старые адреса блока задач (?t=, ?tg=, ?tf=, ?tp= — итог нажатия,
  // фильтр, «Поставить задачу» из проекта) — в раздел «Задачи» с теми же
  // параметрами.
  if (params.t || params.tg || params.tf || params.tp) {
    const keep = new URLSearchParams();
    for (const key of ["t", "tg", "tf", "tp"] as const) {
      const value = params[key];
      if (value) keep.set(key, value);
    }
    redirect(`/admin/tasks?${keep.toString()}`);
  }

  const page = Math.max(Number.parseInt(params.page ?? "1", 10) || 1, 1);
  const limit = 50;
  const q = (params.q ?? "").slice(0, LEAD_SEARCH_MAX);

  // Менеджер видит свободных и своих, руководитель и владелец — всех.
  const scope = scopeFor(staff);
  const everyone = scope === "all";
  const board = params.view === "board";
  const [counts, leads, pending, people, deals] = await Promise.all([
    leadCounts(staff.id, scope),
    listLeads(
      {
        q,
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
    // «Чьи» — тем, кто видит всех; им же — кому отдать лид, добавленный вручную
    // (lib/admin/lead-add.ts): менеджер добавляет себе.
    everyone || approves(staff.role) ? activeStaff() : Promise.resolve([]),
    // Доска — те же сделки, что «Ступени продажи» и «Главная» (10 минут в памяти).
    board ? loadDeals().catch(() => []) : Promise.resolve([]),
  ]);
  const assignees = approves(staff.role) ? people : [];
  // Следующий шаг лидов этой страницы — одним запросом (lib/admin/next-step-store.ts).
  const steps = board ? {} : await nextStepsFor(leads.rows.map((l) => l.id)).catch(() => ({}));
  const person = everyone && /^[0-9a-f-]{36}$/.test(params.owner ?? "") ? params.owner! : "";

  const base = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { q: q || undefined, view: board ? "board" : undefined, priority: params.priority, status: params.status, owner: params.owner, ...patch };
    for (const [key, value] of Object.entries(merged)) {
      if (value) next.set(key, value);
    }
    const query = next.toString();
    return query ? `/admin?${query}` : "/admin";
  };
  const pageHref = (n: number) => {
    const href = base({});
    return `${href}${href.includes("?") ? "&" : "?"}page=${n}`;
  };

  const pages = Math.max(Math.ceil(leads.total / limit), 1);

  return (
    <AdminShell staff={staff}>
      {/* Стоит выше всего остального намеренно: человек, у которого молча
          перестали приходить напоминания, ничего об этом не знает, а
          узнаёт по остывшему лиду через неделю. */}
      <SweepBanner locale={locale} />

      {leads.offline ? (
        <p className="mb-6 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">{t.offline}</p>
      ) : null}

      {/* Просьбы передать лида: решать их должен тот, кто их видит, а не тот,
          кто вспомнил. Поэтому очередь стоит первой, а не спрятана в лиде. */}
      {pending.length ? (
        <section className="mb-6 rounded-xl border border-gold/30 bg-gold/5 px-5 py-4">
          <p className="text-xs uppercase tracking-wider text-gold">{t.pendingTitle(pending.length)}</p>
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

      {/* Задачи переехали в свой раздел (владелец, 23.10.2026: «вынесем CRM
          нашу отдельной кнопкой в наше меню, чтобы она не была в лидах»).
          Здесь — одна строка-указатель без запросов. */}
      <p className="mb-4 text-xs text-muted">
        <Link href="/admin/tasks" className="text-green hover:underline">
          {t.tasksMoved}
        </Link>
      </p>

      {/* Поиск — первым: компанию помнят по названию, а не по странице списка. */}
      <form action="/admin" className="flex flex-wrap items-end gap-2">
        <label className="grid min-w-0 flex-1 basis-64 gap-1 text-xs text-muted">
          {t.searchLabel}
          <input
            type="search"
            name="q"
            defaultValue={q}
            maxLength={LEAD_SEARCH_MAX}
            placeholder={t.searchPlaceholder}
            className="w-full min-w-0 rounded-lg border border-line bg-ink px-3 py-2.5 text-sm text-text placeholder:text-faint"
          />
        </label>
        {everyone ? (
          <label className="grid min-w-0 gap-1 text-xs text-muted">
            {t.ownerLabel}
            <select
              name="owner"
              defaultValue={person || (params.owner === "free" || params.owner === "mine" ? params.owner : "")}
              className="w-full min-w-0 max-w-[14rem] rounded-lg border border-line bg-ink px-3 py-2.5 text-sm text-text"
            >
              <option value="">{t.ownerAnyone}</option>
              <option value="free">{t.freeLeads}</option>
              <option value="mine">{t.myLeads}</option>
              {people
                .filter((p) => p.id !== staff.id)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.display_name}
                  </option>
                ))}
            </select>
          </label>
        ) : params.owner ? (
          <input type="hidden" name="owner" value={params.owner} />
        ) : null}
        {board ? <input type="hidden" name="view" value="board" /> : null}
        {params.priority ? <input type="hidden" name="priority" value={params.priority} /> : null}
        {params.status ? <input type="hidden" name="status" value={params.status} /> : null}
        <button type="submit" className="rounded-lg bg-green/90 px-4 py-2.5 text-sm font-medium text-ink hover:bg-green">
          {t.searchGo}
        </button>
        {q || person ? (
          <Link href={base({ q: undefined, owner: undefined })} className="px-2 py-2.5 text-sm text-muted hover:text-text">
            {t.searchReset}
          </Link>
        ) : null}
      </form>

      {/* Список или доска по ступеням продажи (владелец, 25.10.2026). */}
      <div role="group" aria-label={t.viewLabel} className="mt-4 inline-flex rounded-full border border-line p-0.5 text-xs">
        {[
          { on: !board, href: base({ view: undefined }), label: t.viewList },
          { on: board, href: base({ view: "board", priority: undefined, status: undefined }), label: t.viewBoard },
        ].map((v) => (
          <Link
            key={v.label}
            href={v.href}
            aria-current={v.on ? "page" : undefined}
            className={`rounded-full px-3 py-1.5 transition ${v.on ? "bg-green/15 font-medium text-green" : "text-muted hover:text-text"}`}
          >
            {v.label}
          </Link>
        ))}
      </div>

      {/* Чей лид — чипами с числом: «все / свободные / мои» — то, что раньше
          было тремя большими плитками над списком. */}
      {/* Числа чипов — про лиды; на доске «чьи» решает поле выше (менеджеру — свои). */}
      <div className={`mt-4 flex-wrap items-center gap-2 ${board ? "hidden" : "flex"}`}>
        <Chip href={base({ owner: undefined })} active={!params.owner} count={counts.total}>
          {t.allLeads}
        </Chip>
        <Chip href={base({ owner: "free" })} active={params.owner === "free"} count={counts.free}>
          {t.freeLeads}
        </Chip>
        <Chip href={base({ owner: "mine" })} active={params.owner === "mine"} count={counts.mine}>
          {t.myLeads}
        </Chip>
      </div>

      {board ? (
        <LeadBoard
          board={boardOf(deals, { id: staff.id, everyone }, { owner: params.owner, q })}
          locale={locale}
          names={Object.fromEntries(people.map((p) => [p.id, p.display_name]))}
          showOwner={everyone}
          autopilotLink={staff.role === "admin"}
          now={Date.now()}
        />
      ) : (
        <>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Chip href={base({ priority: undefined })} active={!params.priority}>
          {t.allPriorities}
        </Chip>
        {PRIORITIES.map((value) => (
          <Chip key={value} href={base({ priority: value })} active={params.priority === value}>
            {priorityFilterDict[value][locale]}
          </Chip>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Chip href={base({ status: undefined })} active={!params.status}>
          {t.allStatuses}
        </Chip>
        {STATUSES.map((value) => (
          <Chip key={value} href={base({ status: value })} active={params.status === value}>
            {statusFilterDict[value][locale]}
          </Chip>
        ))}
      </div>

      <div className="mt-6">
        <LeadTable rows={leads.rows} locale={locale} steps={steps} />
      </div>

      {pages > 1 ? (
        <div className="mt-5 flex items-center gap-3 text-sm text-muted">
          {page > 1 ? <Link href={pageHref(page - 1)}>{t.pagePrev}</Link> : null}
          <span className="font-mono text-xs text-faint">
            {page} / {pages}
          </span>
          {page < pages ? <Link href={pageHref(page + 1)}>{t.pageNext}</Link> : null}
        </div>
      ) : null}
        </>
      )}

      {/* Добавить лид руками — ниже списка и свёрнуто: это редкое действие. */}
      <div className="mt-8">
        <LeadAdd locale={locale} selfId={staff.id} assignees={assignees} notice={params.add} />
      </div>

      <p className="mt-8 max-w-2xl text-xs leading-relaxed text-faint">{t.listNote}</p>
    </AdminShell>
  );
}
