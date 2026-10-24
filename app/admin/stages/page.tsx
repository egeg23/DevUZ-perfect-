import Link from "next/link";

import { HelpHint } from "@/components/admin/help-link";
import { LinkPending } from "@/components/admin/link-pending";
import { AdminShell } from "@/components/admin/shell";
import { salesStagesDict } from "@/content/admin-panel/sales-stages";
import { requireSection } from "@/lib/admin/guard";
import { helpAnchor } from "@/lib/admin/help";
import { PANEL_INTL, pick } from "@/lib/admin/i18n";
import { seesEveryone } from "@/lib/admin/roles";
import {
  STAGES,
  STAGES_PERIODS,
  dealHref,
  isStage,
  isStagesPeriod,
  myDeals,
  periodRange,
  stageHref,
  stageList,
  withoutMoney,
} from "@/lib/admin/sales-stages";
import { loadDeals } from "@/lib/admin/sales-stages-store";
import { serviceClient } from "@/lib/supabase";

// Состояние базы прямо сейчас, как и сама «Главная».
export const dynamic = "force-dynamic";

/** Сколько строк показываем: дальше — «сузьте период». */
const LIST_MAX = 200;

/**
 * Раздел «Ступени продажи» в «Отчётах»: список компаний и лидов одной
 * ступени за период. Сюда же ведёт каждое число блока «Ступени продажи» на
 * «Главной» (lib/admin/sales-stages.ts). До 23.10.2026 жил на
 * /admin/hq/stages и открывался только по числу (владелец: «Делаем все
 * сразу» на разбор удобства), старый адрес уводит сюда.
 * Менеджер видит только свои сделки; руководитель и владелец — все, и
 * могут сузить до человека (?owner=). Денег здесь нет ни у кого.
 */
export default async function StagesPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; period?: string; owner?: string }>;
}) {
  const staff = await requireSection("/admin/stages");
  const sp = await searchParams;
  const stage = isStage(sp.stage) ? sp.stage : "replied";
  const period = isStagesPeriod(sp.period) ? sp.period : "7";
  const everyone = seesEveryone(staff.role);
  const owner = everyone && sp.owner && /^[0-9a-f-]{36}$/.test(sp.owner) ? sp.owner : null;
  const s = pick(salesStagesDict, staff.panel_locale);
  const now = new Date();

  const db = serviceClient();
  const [all, staffRes] = await Promise.all([
    loadDeals(now),
    db ? db.from("staff").select("id, display_name").limit(500) : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ]);
  const names = new Map(((staffRes.data ?? []) as Record<string, unknown>[]).map((r) => [String(r.id), String(r.display_name ?? "—")]));
  const visible = withoutMoney(everyone ? (owner ? myDeals(all, owner) : all) : myDeals(all, staff.id), staff.role);
  const { from, to } = periodRange(period, now);
  const list = stageList(visible, stage, from, to);
  const next = STAGES[STAGES.indexOf(stage) + 1] ?? null;
  const fmt = new Intl.DateTimeFormat(PANEL_INTL[staff.panel_locale], {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tashkent",
  });
  const chip = (active: boolean) =>
    `inline-flex min-h-11 items-center rounded-full border px-3.5 text-sm transition ${
      active ? "border-green/50 bg-green/10 text-green" : "border-line text-muted hover:text-text"
    }`;

  return (
    <AdminShell staff={staff}>
      <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-text">
        {s.listTitle(s[stage])}
        <HelpHint topic={helpAnchor("/admin/stages", "list")} />
      </h1>
      <p className="mt-1 text-sm text-muted">
        {s[`p${period}` as "p7"]} · {list.length}
        {everyone ? (owner ? ` · ${names.get(owner) ?? "—"}` : "") : ` · ${s.listMine}`}
      </p>

      <nav className="mt-4 flex flex-wrap gap-2" aria-label={s.stageCol}>
        {STAGES.map((st) => (
          <Link key={st} href={stageHref(st, period, owner)} className={chip(st === stage)}>
            {s[st]}
          </Link>
        ))}
      </nav>
      <nav className="mt-2 flex flex-wrap gap-2">
        {STAGES_PERIODS.map((p) => (
          <Link key={p} href={stageHref(stage, p, owner)} className={chip(p === period)}>
            {s[`p${p}` as "p7"]}
          </Link>
        ))}
      </nav>

      {list.length ? (
        <ul className="mt-5 flex flex-col gap-2">
          {list.slice(0, LIST_MAX).map((d) => (
            <li key={d.key}>
              <Link
                href={dealHref(d)}
                className="flex min-h-11 flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border border-line/70 bg-surface px-4 py-3 transition hover:bg-surface-2"
              >
                <span className="min-w-0 flex-1 basis-full break-words text-sm font-medium text-text sm:basis-auto">
                  {d.label}
                  <LinkPending />
                </span>
                <span className="text-xs text-faint">
                  {s.colOwner}: {d.ownerId ? (names.get(d.ownerId) ?? "—") : s.nobody}
                </span>
                <span className="font-mono text-xs tabular-nums text-muted">{fmt.format(new Date(d.at[stage] as string))}</span>
                {next ? (
                  <span className={`text-xs ${d.at[next] ? "text-green" : "text-faint"}`}>
                    {s[next]}: {d.at[next] ? fmt.format(new Date(d.at[next] as string)) : s.notYet}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 rounded-2xl border border-line/70 bg-surface p-4 text-sm text-muted">{s.listNone}</p>
      )}
      {list.length > LIST_MAX ? <p className="mt-3 text-sm text-faint">{s.listMore(list.length - LIST_MAX)}</p> : null}
    </AdminShell>
  );
}
