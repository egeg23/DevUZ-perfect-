import Link from "next/link";

import { AdminShell } from "@/components/admin/shell";
import { HelpHint } from "@/components/admin/help-link";
import { helpAnchor } from "@/lib/admin/help";
import { OutreachList } from "@/components/admin/outreach-list";
import { ProspectRunner } from "@/components/admin/prospect-runner";
import { TouchPlanLine } from "@/components/admin/touch-plan-line";
import { requireStaff } from "@/lib/admin/guard";
import { touchProgressOf } from "@/lib/admin/touch-store";
import { BOT_BUTTON, outcomeOf, replaceLimit, tallyPortion } from "@/lib/admin/portion";
import { portionOf, type PortionItem } from "@/lib/admin/portion-store";
import { inQueue } from "@/lib/admin/lead-queue";
import { STREAM_BUFFER, STREAM_OFF, STREAM_ON } from "@/lib/admin/stream";
import { streamState } from "@/lib/admin/stream-store";
import { pick } from "@/lib/admin/i18n";
import { closeLabelDict, prospectPageDict } from "@/content/admin-panel/prospect";
import { todayInTashkent } from "@/lib/admin/pulse";
import { MapsCampaigns } from "@/components/admin/maps-campaigns";
import { TouchLegend } from "@/components/admin/touch-legend";
import { dailyCap, placesConfigured } from "@/lib/maps/places";
import { listCampaigns, pendingPlaces, usageToday } from "@/lib/maps/store";
import { queueOwners, sentLastHour } from "@/lib/admin/outreach-queue";
import { hourlyCapacity } from "@/lib/admin/work-accounts";
import { listAccounts } from "@/lib/admin/work-accounts-store";
import { listProspects, manualReplies } from "@/lib/admin/outreach-store";
import { parseMore, REST_PAGE, visibleProspects } from "@/lib/admin/outreach-view";
import { BATCH_CAP } from "@/lib/audit/batch";
import { AutopilotPanel } from "@/components/admin/autopilot-panel";
import { dayStats, peekWeek } from "@/lib/admin/autopilot-store";

export const dynamic = "force-dynamic";

export default async function ProspectPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string; e?: string; sent?: string; maps?: string; more?: string }>;
}) {
  const staff = await requireStaff();
  const { open, e, sent, maps, more: moreRaw } = await searchParams;
  // Язык панели — сотрудника, а не браузера (lib/admin/i18n.ts).
  const locale = staff.panel_locale;
  const t = pick(prospectPageDict, locale);
  const closeLabel = pick(closeLabelDict, locale);
  // Автопоиск ведут владелец и руководитель; менеджеру он приходит порцией.
  const seesMaps = staff.role === "admin" || staff.role === "head";
  const [campaigns, mapsUsage, mapsPending, mapsReady] = seesMaps
    ? await Promise.all([listCampaigns(), usageToday(), pendingPlaces(), placesConfigured()])
    : [[], 0, 0, false];
  // Автопрогон касаний видят те же, кто ведёт автопоиск: он из него и
  // берёт компании. Менеджеру его касания приходят лидами в очередь.
  const [autoStats, autoWeek] = seesMaps ? await Promise.all([dayStats(), peekWeek()]) : [null, null];
  const [rows, hour, replies, plan, portion, owners, stream, accounts] = await Promise.all([
    listProspects(),
    sentLastHour(),
    manualReplies(),
    touchProgressOf(staff.id),
    portionOf(staff.id),
    queueOwners(),
    streamState(staff.id),
    // Рабочих аккаунтов может быть несколько — у каждого свои «два в час».
    listAccounts(),
  ]);
  const today = todayInTashkent(new Date());
  // Порция и поток «Получать лиды» приходят одним списком: поток — сверх
  // порции, и в её счёт не идёт.
  const mine = portion.filter((p) => !p.stream);
  const streamed = portion.filter((p) => p.stream);
  // В счёт — только касания: «Не подходит» не делает порцию сделанной, за
  // неё выдаётся замена (lib/admin/portion-store → topUpPortion).
  const tally = tallyPortion(
    mine.map((p) => ({ replaces: p.replacement ? p.id : null, outcome: outcomeOf(p, staff.id, today) })),
  );
  const streamDone = streamed.filter((p) => {
    const outcome = outcomeOf(p, staff.id, today);
    return outcome === "sent" || outcome === "self";
  }).length;
  // Что с компанией из порции или потока — словами, как в Telegram.
  const stateOf = (p: PortionItem): string => {
    const outcome = outcomeOf(p, staff.id, today);
    if (outcome === "skipped") return t.stateSkipped;
    if (outcome) return p.closed_reason ? `${t.stateDone} · ${closeLabel[p.closed_reason]}` : t.stateDone;
    return p.message ? t.stateReady : t.statePreparing;
  };
  // Сразу — только карточки в работе, порция и открытая; остальные по
  // двадцать. Все 200 сразу весили 2 МБ и вешали слабые компьютеры.
  const more = parseMore(moreRaw);
  const view = visibleProspects(rows, {
    keep: new Set([...portion.map((p) => p.id), ...(open ? [open] : [])]),
    more,
    now: new Date(),
  });

  return (
    <AdminShell staff={staff}>
      <h1 className="text-lg font-semibold">{t.title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{t.intro}</p>

      <TouchPlanLine progress={plan} />

      {/* Порция дня — выше всего остального: это то, с чего сегодня
          начинать. Те же компании пришли утром в Telegram с кнопками. */}
      {mine.length ? (
        <section className="mb-6 rounded-xl border border-green/30 bg-green/5 px-5 py-4">
          <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-green">
            {t.portionHead(tally.done, tally.target)}
            <HelpHint topic={helpAnchor("/admin/prospect", "portion")} label={t.portionHelp} />
          </p>
          <ul className="mt-3 flex flex-col gap-1.5 text-sm">
            {mine.map((p) => {
              const outcome = outcomeOf(p, staff.id, today);
              const state = stateOf(p);
              return (
                <li key={p.id} className="flex flex-wrap items-baseline gap-x-2">
                  <Link href={`/admin/prospect?open=${p.id}#p-${p.id}`} className="hover:text-green">
                    {p.label || p.host || t.noSiteCompany}
                  </Link>
                  <span className={`text-xs ${outcome ? "text-faint" : "text-muted"}`}>{state}</span>
                  {p.replacement ? <span className="text-xs text-green">{t.replacement}</span> : null}
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-faint">
            {t.portionRules(replaceLimit(tally.target), BOT_BUTTON.skip)}
            {tally.short ? t.portionShort(tally.short) : ""} {t.portionReturn}
          </p>
        </section>
      ) : null}

      {/* Поток «Получать лиды»: включается кнопкой в Telegram, здесь —
          что пришло сегодня и чем кончилось. */}
      {inQueue(staff.role) && (stream.on || streamed.length) ? (
        <section className="mb-6 rounded-xl border border-blue-soft/30 bg-blue-soft/5 px-5 py-4">
          <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-blue-soft">
            {t.streamHead(stream.on ? t.streamOn : t.streamOff, streamDone)}
            <HelpHint topic={helpAnchor("/admin/prospect", "stream")} label={t.streamHelp} />
          </p>
          {streamed.length ? (
            <ul className="mt-3 flex flex-col gap-1.5 text-sm">
              {streamed.map((p) => (
                <li key={p.id} className="flex flex-wrap items-baseline gap-x-2">
                  <Link href={`/admin/prospect?open=${p.id}#p-${p.id}`} className="hover:text-green">
                    {p.label || p.host || t.noSiteCompany}
                  </Link>
                  <span className={`text-xs ${outcomeOf(p, staff.id, today) ? "text-faint" : "text-muted"}`}>{stateOf(p)}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-3 text-xs text-faint">
            {t.streamNote(STREAM_ON, STREAM_OFF, STREAM_BUFFER)}
          </p>
        </section>
      ) : null}

      {autoStats && autoWeek ? (
        <AutopilotPanel
          stats={autoStats}
          niche={autoWeek.niche}
          next={autoWeek.next}
          nextFrom={nextMonday(autoWeek.week)}
          canToggle={staff.role === "admin"}
          locale={locale}
        />
      ) : null}

      <ProspectRunner />

      {seesMaps ? (
        <MapsCampaigns
          campaigns={campaigns}
          configured={mapsReady}
          usage={mapsUsage}
          cap={dailyCap()}
          pending={mapsPending}
          canEdit
          notice={maps}
          locale={locale}
        />
      ) : null}

      <TouchLegend locale={locale} />

      <OutreachList
        rows={view.shown}
        viewer={staff}
        more={{
          hidden: view.hidden,
          href: `/admin/prospect?more=${more + REST_PAGE}${view.nextId ? `#p-${view.nextId}` : ""}`,
        }}
        hour={hour}
        cap={hourlyCapacity(accounts)}
        owners={owners}
        open={open}
        error={e}
        sent={sent === "1"}
        replies={replies}
        locale={locale}
      />

      <div className="mt-10 max-w-2xl space-y-3 border-t border-line pt-6 text-xs leading-relaxed text-faint">
        <p>
          <span className="text-muted">{t.footListTitle}</span> {t.footList}
        </p>
        <p>
          <span className="text-muted">{t.footEmptyTitle}</span> {t.footEmpty}
        </p>
        <p>
          <span className="text-muted">{t.footFewerTitle}</span> {t.footFewer}
        </p>
        <p>
          <span className="text-muted">{t.footDraftTitle}</span> {t.footDraft(BATCH_CAP)}
        </p>
      </div>
    </AdminShell>
  );
}

/** «12.10» — понедельник после недели, начавшейся `week`. */
function nextMonday(week: string): string {
  const d = new Date(Date.parse(`${week}T00:00:00Z`) + 7 * 86_400_000);
  return `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
