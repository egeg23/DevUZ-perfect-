import { HelpHint } from "@/components/admin/help-link";
import { levelsDict } from "@/content/admin-panel/levels";
import { DEALS_FOR_BOOST } from "@/lib/admin/grade-month";
import { helpAnchor } from "@/lib/admin/help";
import { pick, type PanelLocale, type Picked } from "@/lib/admin/i18n";
import { XP, XP_KINDS, type Growth } from "@/lib/admin/levels";

/**
 * «Мой рост» — уровень (lib/admin/levels.ts) и грейд по сделкам месяца
 * (lib/admin/grade-month.ts) на «Главной» менеджера; бейдж уровня — в
 * карточках людей у владельца и руководителя. Только отрисовка готового.
 */

type L = Picked<typeof levelsDict>;

const CARD = "rounded-3xl border border-line/70 bg-surface shadow-[0_10px_24px_rgba(0,0,0,0.28)]";

export function titleText(g: Growth, l: L): string {
  return l[`t_${g.title}`];
}

/** Бейдж «ур. 4 · Охотник» с полосой до следующего уровня. */
export function LevelBadge({ g, locale }: { g: Growth; locale: PanelLocale }) {
  const l = pick(levelsDict, locale);
  const pct = Math.round((g.level.into / g.level.span) * 100);
  return (
    <span className="block min-w-0" data-level={g.level.level}>
      <span className="flex items-baseline gap-1.5 text-xs">
        <span className="rounded-full bg-violet/15 px-2 py-0.5 font-semibold text-violet">{l.levelShort(g.level.level)}</span>
        <span className="truncate text-muted">{titleText(g, l)}</span>
      </span>
      <span className="mt-1 block h-1 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
        <span className="block h-full rounded-full bg-violet" style={{ width: `${pct}%` }} />
      </span>
    </span>
  );
}

export function GrowthCard({ g, locale }: { g: Growth; locale: PanelLocale }) {
  const l = pick(levelsDict, locale);
  const pct = Math.round((g.level.into / g.level.span) * 100);
  const grade = g.grade;
  return (
    <section className={`${CARD} p-4 sm:p-5`} aria-labelledby="my-growth" data-block="growth">
      <h2 id="my-growth" className="flex items-center gap-2 text-base font-semibold text-text">
        {l.myTitle}
        <HelpHint topic={helpAnchor("/admin/hq", "my-growth")} />
      </h2>

      <div className="mt-3 flex items-center gap-3">
        <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-violet/15 text-violet" aria-hidden="true">
          <span className="font-mono text-2xl font-semibold leading-none">{g.level.level}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-text">
            {l.level(g.level.level)} · {titleText(g, l)}
          </span>
          <span className="block text-xs text-faint">
            {l.total(g.level.xp)} · <span className="text-green">{l.week(g.week)}</span>
          </span>
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuemin={0} aria-valuemax={g.level.span} aria-valuenow={g.level.into}>
        <div className="h-full rounded-full bg-violet" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted">{l.toNext(g.level.toNext, g.level.level + 1)}</p>
      {g.pending ? <p className="mt-2 text-xs text-faint">{l.pending}</p> : null}

      <details className="group/xp mt-3 rounded-2xl bg-surface-2/60 px-3 py-2">
        <summary className="flex min-h-11 cursor-pointer list-none items-center text-sm text-muted [&::-webkit-details-marker]:hidden">
          {l.howTitle} <span className="ml-auto text-faint transition group-open/xp:rotate-90">›</span>
        </summary>
        <ul className="mb-1 flex flex-col gap-1 text-xs text-muted">
          {XP_KINDS.map((k) => (
            <li key={k}>{l.xpLine(l[`xp_${k}`], XP[k], g.parts[k])}</li>
          ))}
        </ul>
      </details>

      {grade ? (
        <div className="mt-4 rounded-2xl border border-gold/30 bg-gold/[0.05] p-3" data-grade={grade.deals >= DEALS_FOR_BOOST ? "boost" : "base"}>
          <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-faint">
            {l.gradeTitle}
            <HelpHint topic={helpAnchor("/admin/hq", "grade")} />
          </p>
          <p className="mt-1.5 text-sm text-text">{l.deals(grade.deals, grade.target)}</p>
          <div className="mt-2 flex gap-1" aria-hidden="true">
            {Array.from({ length: grade.target }, (_, i) => (
              <span key={i} className={`h-2 flex-1 rounded-full ${i < grade.deals ? "bg-gold" : "bg-surface-2"}`} />
            ))}
          </div>
          <ul className="mt-2 flex flex-col gap-1 text-xs">
            <li className="text-muted">{grade.rateNow === null ? l.rateOld : l.rateNow(grade.rateNow)}</li>
            <li className={grade.deals >= DEALS_FOR_BOOST ? "text-green" : "text-gold"}>
              {grade.deals >= DEALS_FOR_BOOST ? l.rateNext(grade.rateNext) : l.toBoost(DEALS_FOR_BOOST - grade.deals)}
            </li>
            {grade.active ? (
              <li className={grade.bonusNow ? "text-green" : "text-muted"}>
                {grade.bonusNow ? `${l.bonusNow(grade.bonusNow)} · ` : ""}
                {l.bonusNext(grade.toNextBonus)}
              </li>
            ) : (
              <li className="text-muted">{l.bonusFrom}</li>
            )}
            <li className="text-faint">{l.dealHint}</li>
          </ul>
        </div>
      ) : null}
    </section>
  );
}
