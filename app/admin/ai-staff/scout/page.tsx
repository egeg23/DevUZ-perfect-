import Link from "next/link";

import { saveScoutSettingsAction } from "@/app/admin/ai-staff/scout/actions";
import { AiStaffTabs } from "@/app/admin/ai-staff/tabs";
import { HelpHint } from "@/components/admin/help-link";
import { ScoutGroups } from "@/components/admin/scout-groups";
import { AdminShell } from "@/components/admin/shell";
import { SubmitButton } from "@/components/admin/submit-button";
import { aiStaffDict } from "@/content/admin-panel/ai-staff";
import { scoutTabDict } from "@/content/admin-panel/ai-staff-scout";
import { mainLimitUntil } from "@/lib/admin/account-ban-store";
import { requireSection } from "@/lib/admin/guard";
import { helpAnchor } from "@/lib/admin/help";
import { pick } from "@/lib/admin/i18n";
import { joinState, listScoutChats, loadJoinPause, staffNames } from "@/lib/scout/extra-chats-store";
import { mayTuneScout, loadScoutSettings } from "@/lib/scout/settings-store";

export const dynamic = "force-dynamic";

const CARD = "rounded-xl border border-line bg-surface px-5 py-4";
const H2 = "text-xs uppercase tracking-wider text-faint";
const BTN = "rounded-md border border-line px-2.5 py-1 text-xs text-muted hover:text-text";
const RESULTS = ["ok", "empty", "forbidden", "failed"] as const;
type Result = (typeof RESULTS)[number];

/**
 * «Скаут» в «ИИ-сотрудниках»: группы для скаута (тот же блок, что в
 * «Сигналах скаута») и режим отбора — «автоматически» или «по словам».
 * Владелец, 08.11.2026: «Выведи настройки скаута в ИИ сотрудника. Чтобы
 * можно было добавлять, убирать прям там. Поставь отслеживание в
 * автоматическом режиме или по заданным словам».
 */
export default async function AiStaffScoutPage({ searchParams }: { searchParams: Promise<{ s?: string; g?: string }> }) {
  const staff = await requireSection("/admin/ai-staff");
  const locale = staff.panel_locale;
  const t = pick(scoutTabDict, locale);
  const title = pick(aiStaffDict, locale).title;
  const q = await searchParams;
  const shown = RESULTS.includes(q.s as Result) ? (q.s as Result) : null;
  const tune = mayTuneScout(staff);

  const [settings, groups, joinPause, mainLimit] = await Promise.all([
    loadScoutSettings(true),
    listScoutChats().catch(() => null),
    loadJoinPause().catch(() => null),
    mainLimitUntil().catch(() => null),
  ]);
  const pause = Math.max(joinPause ?? 0, mainLimit ?? 0) || null;
  const [joins, names] = await Promise.all([
    groups ? joinState(new Date(), pause).catch(() => null) : Promise.resolve(null),
    staffNames((groups ?? []).map((chat) => chat.added_by).filter((id): id is string => Boolean(id))),
  ]);

  return (
    <AdminShell staff={staff}>
      <div className="space-y-5">
        <div className="space-y-3">
          <h1 className="text-xl font-semibold">{title}</h1>
          <AiStaffTabs role={staff.role} locale={locale} current="scout" />
          <p className="text-sm text-muted">{t.intro}</p>
          <Link href="/admin/scout" className={BTN}>
            {t.signals}
          </Link>
        </div>

        {shown ? (
          <p data-result={shown === "ok" ? "ok" : "warn"} className={`text-sm ${shown === "ok" ? "text-green" : "text-gold"}`}>
            {t[`r_${shown}`]}
          </p>
        ) : null}

        <section className={CARD}>
          <div className="flex items-baseline justify-between gap-2">
            <p className={H2}>{t.modeTitle}</p>
            <HelpHint topic={helpAnchor("/admin/ai-staff", "scout")} />
          </div>
          <p className="mt-2 text-sm">
            <span className="text-muted">{t.current}</span> {settings.mode === "words" ? t.modeWords : t.modeAuto}
            {settings.mode === "words" ? <span className="text-muted"> · {t.wordsCount(settings.words.length)}</span> : null}
          </p>
          <form action={saveScoutSettingsAction} className="mt-3 space-y-3">
            <fieldset disabled={!tune} className="space-y-2">
              <label className="flex items-start gap-2 text-sm">
                <input type="radio" name="mode" value="auto" defaultChecked={settings.mode === "auto"} className="mt-1" />
                <span>
                  <span className="font-medium">{t.modeAuto}</span>
                  <span className="block text-xs text-muted">{t.modeAutoHint}</span>
                </span>
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input type="radio" name="mode" value="words" defaultChecked={settings.mode === "words"} className="mt-1" />
                <span>
                  <span className="font-medium">{t.modeWords}</span>
                  <span className="block text-xs text-muted">{t.modeWordsHint}</span>
                </span>
              </label>
              <label className="block text-xs text-muted">
                {t.words}
                <textarea
                  name="words"
                  rows={5}
                  defaultValue={settings.words.join("\n")}
                  className="mt-1 w-full rounded-md border border-line bg-ink px-2 py-1 text-sm text-text"
                />
              </label>
            </fieldset>
            {tune ? <SubmitButton base={`${BTN} font-semibold`}>{t.save}</SubmitButton> : <p className="text-xs text-muted">{t.onlyHeads}</p>}
          </form>
        </section>

        <ScoutGroups staff={staff} locale={locale} chats={groups} state={joins} names={names} result={q.g} back="/admin/ai-staff/scout" />
      </div>
    </AdminShell>
  );
}
