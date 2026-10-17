import Link from "next/link";

import { markStageAction } from "@/app/admin/hq/actions";
import { HelpHint } from "@/components/admin/help-link";
import { LinkPending } from "@/components/admin/link-pending";
import { SubmitButton } from "@/components/admin/submit-button";
import { hqDict } from "@/content/admin-panel/hq";
import { salesStagesDict } from "@/content/admin-panel/sales-stages";
import { helpAnchor } from "@/lib/admin/help";
import { deltaOf, type Trend } from "@/lib/admin/hq";
import { PANEL_INTL, pick, type PanelLocale, type Picked } from "@/lib/admin/i18n";
import { STAGES, dropOf, stageHref, type MyStages, type Stage, type StageStep, type StagesPulse } from "@/lib/admin/sales-stages";

/**
 * Ступени продажи — вёрстка (lib/admin/sales-stages.ts): блок на «Главной»
 * владельца и руководителя, «Мои ступени» менеджера, кнопки отметок.
 * Только отрисовка готовых чисел — её же рисуют тест и скриншоты.
 */

type S = Picked<typeof salesStagesDict>;
type H = Picked<typeof hqDict>;

const CARD = "rounded-3xl border border-line/70 bg-surface shadow-[0_10px_24px_rgba(0,0,0,0.28)]";
const BTN = "min-h-11 min-w-11 justify-center rounded-xl px-3.5 text-sm font-medium";

/** Разница с прошлыми 7 днями — коротко, полная фраза — в подсказке: колонка узкая. */
function Delta({ trend, h }: { trend: Trend; h: H }) {
  const d = deltaOf(trend);
  if (d === 0) return <span className="block text-[11px] text-faint" title={h.same}>=</span>;
  const text = `${d > 0 ? "▲ +" : "▼ −"}${Math.abs(d)}`;
  return (
    <span className={`block text-[11px] font-medium ${d > 0 ? "text-green" : "text-gold"}`} title={h.vsPrev(text)}>
      {text}
    </span>
  );
}

function stepText(step: StageStep, s: S): string {
  const say = s[`step_${step.from}` as `step_${Exclude<Stage, "paid">}`];
  return say(step.base, step.reached);
}

const usd = (n: number, locale: PanelLocale) => `$${new Intl.NumberFormat(PANEL_INTL[locale], { maximumFractionDigits: 0 }).format(n)}`;

/** Блок «Ступени продажи» на «Главной» владельца и руководителя. */
export function StagesCard({ stages, locale }: { stages: StagesPulse; locale: PanelLocale }) {
  const s = pick(salesStagesDict, locale);
  const h = pick(hqDict, locale);
  const max = Math.max(1, ...STAGES.map((st) => stages.month[st]));
  return (
    <section id="stages" className={`${CARD} scroll-mt-24 p-4 sm:col-span-2 sm:p-5`} aria-labelledby="hq-stages" data-block="stages">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-green/10 text-lg text-green" aria-hidden="true">
          🎯
        </span>
        <div className="min-w-0">
          <h2 id="hq-stages" className="flex items-center gap-2 text-sm font-semibold text-text">
            {s.title}
            <HelpHint topic={helpAnchor("/admin/hq", "stages")} />
          </h2>
          <p className="text-xs text-faint">{s.lead}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-1 text-sm">
        <span className="text-[11px] uppercase tracking-wider text-faint">{s.stageCol}</span>
        <span className="w-20 text-right text-[11px] uppercase tracking-wider text-faint" title={h.vsPrev("±")}>{s.col7}</span>
        <span className="w-16 text-right text-[11px] uppercase tracking-wider text-faint">{s.col30}</span>
        {STAGES.map((st) => (
          <div key={st} className="contents">
            <span className="min-w-0 py-1.5">
              <span className="block truncate text-muted">{s[st]}</span>
              <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
                <span className="block h-full rounded-full bg-green-dim" style={{ width: `${Math.round((stages.month[st] / max) * 100)}%` }} />
              </span>
            </span>
            <Link href={stageHref(st, "7")} className="flex min-h-11 w-20 flex-col items-end justify-center rounded-xl px-1 text-right transition hover:bg-surface-2">
              <span className="font-mono text-base tabular-nums text-text">
                {stages.trend[st].now}
                <LinkPending />
              </span>
              <Delta trend={stages.trend[st]} h={h} />
            </Link>
            <Link href={stageHref(st, "30")} className="flex min-h-11 w-16 items-center justify-end rounded-xl px-1 font-mono text-base tabular-nums text-text transition hover:bg-surface-2">
              {stages.month[st]}
            </Link>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[11px] uppercase tracking-wider text-faint">{s.stepsTitle}</p>
      <ol className="mt-1.5 flex flex-col gap-1">
        {stages.steps30.map((step) => (
          <li key={step.from}>
            <Link href={stageHref(step.from, "30")} className="-mx-2 flex min-h-11 items-center gap-3 rounded-2xl px-2 py-1.5 text-sm transition hover:bg-surface-2">
              <span className="min-w-0 flex-1 leading-snug text-muted">{step.base ? stepText(step, s) : `${s[step.from]}: ${s.noBase}`}</span>
              {step.base ? <span className={`shrink-0 text-xs ${dropOf(step) ? "text-gold" : "text-green"}`}>{s.dropped(dropOf(step))}</span> : null}
            </Link>
          </li>
        ))}
      </ol>
      {stages.paidUsd30 !== null ? <p className="mt-2 text-xs text-green">{s.paidMoney(usd(stages.paidUsd30, locale))}</p> : null}
    </section>
  );
}

/** «Мои ступени за неделю» и норма «2 показа» — на «Главной» менеджера. */
export function MyStagesCard({ stages, locale }: { stages: MyStages; locale: PanelLocale }) {
  const s = pick(salesStagesDict, locale);
  const { norm } = stages;
  const pct = Math.min(100, Math.round((norm.done / norm.target) * 100));
  return (
    <section className={`${CARD} p-4 sm:p-5`} aria-labelledby="my-stages" data-block="stages">
      <h2 id="my-stages" className="flex items-center gap-2 text-base font-semibold text-text">
        {s.myTitle}
        <HelpHint topic={helpAnchor("/admin/hq", "my-stages")} />
      </h2>
      <p className="text-xs text-faint">{s.myLead}</p>
      <Link
        href={stageHref("shown", "week")}
        className={`mt-3 block rounded-2xl border px-3 py-2.5 transition ${norm.hot ? "hq-hot border-gold/30 bg-gold/[0.05]" : "border-transparent bg-surface-2/70 hover:bg-line"}`}
        data-red={norm.hot ? "" : undefined}
        data-norm={norm.hot ? "hot" : norm.done >= norm.target ? "done" : "open"}
      >
        <span className="flex items-baseline justify-between gap-2">
          <span className="text-sm text-text">{s.norm(norm.done, norm.target)}</span>
          <span className="shrink-0 text-xs text-faint">{norm.done >= norm.target ? "✓" : s.normLeft(norm.target - norm.done)}</span>
        </span>
        <span className="mt-2 block h-2 overflow-hidden rounded-full bg-surface" role="progressbar" aria-valuemin={0} aria-valuemax={norm.target} aria-valuenow={norm.done}>
          <span className={`block h-full rounded-full ${pct >= 100 ? "bg-green" : "bg-green-dim"}`} style={{ width: `${pct}%` }} />
        </span>
        {norm.hot ? <span className="mt-2 block text-xs text-red-300">🔥 {s.normHot}</span> : null}
        {norm.done >= norm.target ? <span className="mt-2 block text-xs text-green">{s.normDone}</span> : null}
      </Link>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {STAGES.map((st) => (
          <Link key={st} href={stageHref(st, "week")} className="flex min-h-11 flex-col rounded-2xl bg-surface-2/70 px-3 py-2.5 transition hover:bg-line">
            <span className="font-mono text-2xl leading-none tabular-nums text-text">{stages.week[st]}</span>
            <span className="mt-1 text-xs text-muted">
              {s[st]}
              <LinkPending />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** Скрытые поля отметки: по лиду или по касанию, и куда вернуться. */
function Target({ leadId, prospectId, back }: { leadId: string | null; prospectId: string | null; back: string }) {
  return (
    <>
      {leadId ? <input type="hidden" name="lead" value={leadId} /> : null}
      {prospectId ? <input type="hidden" name="prospect" value={prospectId} /> : null}
      <input type="hidden" name="back" value={back} />
    </>
  );
}

/** «Показал макет»: сначала — как показали, по видео или вживую; без скрипта. */
export function ShownButton({
  leadId,
  prospectId,
  back,
  s,
}: {
  leadId: string | null;
  prospectId: string | null;
  back: string;
  s: S;
}) {
  return (
    <details className="group/shown">
      <summary className={`${BTN} inline-flex cursor-pointer list-none items-center gap-1.5 border border-green/40 text-green transition hover:bg-green/10 [&::-webkit-details-marker]:hidden`}>
        🎬 {s.markShown}
      </summary>
      <div className="mt-2 grid grid-cols-2 gap-2 rounded-2xl bg-surface-2/70 p-3">
        {(["video", "live"] as const).map((via) => (
          <form key={via} action={markStageAction}>
            <Target leadId={leadId} prospectId={prospectId} back={back} />
            <input type="hidden" name="kind" value="shown" />
            <input type="hidden" name="via" value={via} />
            <SubmitButton base={`${BTN} w-full px-2`} tone="quiet" pendingLabel={s.saving}>
              {via === "video" ? s.viaVideo : s.viaLive}
            </SubmitButton>
          </form>
        ))}
      </div>
    </details>
  );
}

/** «Назвал цену» с суммой в долларах. */
export function PricedButton({ leadId, prospectId, back, s }: { leadId: string | null; prospectId: string | null; back: string; s: S }) {
  return (
    <details className="group/priced">
      <summary className={`${BTN} inline-flex cursor-pointer list-none items-center gap-1.5 border border-gold/40 text-gold transition hover:bg-gold/10 [&::-webkit-details-marker]:hidden`}>
        💵 {s.markPriced}
      </summary>
      <form action={markStageAction} className="mt-2 flex flex-wrap items-end gap-2 rounded-2xl bg-surface-2/70 p-3">
        <Target leadId={leadId} prospectId={prospectId} back={back} />
        <input type="hidden" name="kind" value="priced" />
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-muted">
          {s.amount}
          <input
            name="amount"
            inputMode="numeric"
            pattern="[0-9 ]{1,9}"
            required
            className="min-h-11 rounded-xl border border-line bg-surface px-3 font-mono text-text"
          />
        </label>
        <SubmitButton base={BTN} pendingLabel={s.saving}>
          {s.markPriced}
        </SubmitButton>
      </form>
    </details>
  );
}

/** «Есть интерес» — одной кнопкой. */
export function InterestButton({ leadId, prospectId, back, s }: { leadId: string | null; prospectId: string | null; back: string; s: S }) {
  return (
    <form action={markStageAction}>
      <Target leadId={leadId} prospectId={prospectId} back={back} />
      <input type="hidden" name="kind" value="interest" />
      <SubmitButton base={BTN} tone="quiet" pendingLabel={s.saving}>
        ✋ {s.markInterest}
      </SubmitButton>
    </form>
  );
}

/** Чем кончилась отметка: из адреса после действия (?mk=…). */
export function markResultText(mk: string | undefined, s: S): { ok: boolean; text: string } | null {
  switch (mk) {
    case "ok":
      return { ok: true, text: s.rOk };
    case "forbidden":
      return { ok: false, text: s.rForbidden };
    case "bad":
      return { ok: false, text: s.rBad };
    case "gone":
      return { ok: false, text: s.rGone };
    case "failed":
      return { ok: false, text: s.rFailed };
    default:
      return null;
  }
}
