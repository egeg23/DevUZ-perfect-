import { HelpHint } from "@/components/admin/help-link";
import { toggleAutopilotAction } from "@/app/admin/prospect/actions";
import { autopilotDict } from "@/content/admin-panel/prospect";
import { REPLY_MARK, type AutopilotNiche, type DayStats } from "@/lib/admin/autopilot";
import { helpAnchor } from "@/lib/admin/help";
import { pick, type PanelLocale } from "@/lib/admin/i18n";

/**
 * Автопрогон касаний — блок вверху «Касаний» для владельца и руководителя
 * (lib/admin/autopilot.ts). Цифры за сегодня и неделю — те же, что в
 * вечернем отчёте бота. Остановить и запустить — только владелец.
 */
export function AutopilotPanel({
  stats,
  niche,
  next,
  nextFrom,
  canToggle,
  locale,
}: {
  stats: DayStats;
  niche: AutopilotNiche;
  next: AutopilotNiche;
  /** «12.10» — с какого дня следующая ниша. */
  nextFrom: string;
  canToggle: boolean;
  locale: PanelLocale;
}) {
  const t = pick(autopilotDict, locale);
  const name = (n: AutopilotNiche) => (locale === "ru" ? n.label : n[locale]);
  const accounts = stats.byAccount.map(({ name: account, n }) => `${account ?? t.mainAccount} — ${n}`).join(", ");

  return (
    <section
      id="autopilot"
      className={`mb-6 rounded-xl border px-5 py-4 ${stats.enabled ? "border-blue-soft/30 bg-blue-soft/5" : "border-line bg-surface-2/40"}`}
    >
      <p className={`flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider ${stats.enabled ? "text-blue-soft" : "text-muted"}`}>
        {t.head(name(niche))} · {stats.enabled ? t.on : t.off}
        <HelpHint topic={helpAnchor("/admin/prospect", "autopilot")} label={t.help} />
      </p>
      <ul className="mt-3 flex flex-col gap-1 text-sm">
        <li className={stats.sent >= stats.target ? "text-green" : "text-text"}>{t.today(stats.sent, stats.target, stats.inFlight)}</li>
        {accounts ? <li className="text-xs text-muted">{t.byAccount(accounts)}</li> : null}
        <li>{t.replies(stats.replies, stats.taken)}</li>
        {stats.manual || stats.dropped ? <li className="text-xs text-muted">{t.dropped(stats.manual, stats.dropped)}</li> : null}
        <li className="text-xs text-muted">{t.week(stats.weekSent, stats.weekReplies)}</li>
        <li className="text-xs text-muted">{t.next(name(next), nextFrom)}</li>
      </ul>
      <p className="mt-3 text-xs text-faint">{t.note(REPLY_MARK)}</p>
      {canToggle ? (
        <form action={toggleAutopilotAction} className="mt-3">
          <input type="hidden" name="enabled" value={stats.enabled ? "0" : "1"} />
          <button
            type="submit"
            className={`rounded-lg border px-3 py-1.5 text-xs ${
              stats.enabled ? "border-line text-muted hover:text-text" : "border-green/40 text-green hover:bg-green/10"
            }`}
          >
            {stats.enabled ? t.stop : t.start}
          </button>
        </form>
      ) : (
        <p className="mt-2 text-xs text-faint">{t.ownerOnly}</p>
      )}
    </section>
  );
}
