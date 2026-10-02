import { HelpHint } from "@/components/admin/help-link";
import { homeDict } from "@/content/admin-panel/home";
import { helpAnchor } from "@/lib/admin/help";
import { pick, type PanelLocale } from "@/lib/admin/i18n";
import { readHealth } from "@/lib/admin/sweep-health";

/**
 * Плашка о том, что напоминания не доставляются.
 *
 * Свип умеет сообщить об аварии сам, в чат отдела продаж, — но только про
 * ту, которую он застал: код, который не выполняется, о себе не сообщает.
 * Если таймер не запустился, контейнер лежит или секрет не доехал, свип
 * просто молчит, и молчание неотличимо от «напоминать было нечего».
 *
 * Эту дыру закрывает last_ok_at. Протухшее значение видно глазом на
 * первой же странице панели — и видно тому, кто как раз ждёт напоминания.
 */

/** Свип ходит раз в пять минут; полчаса тишины — это шесть пропусков. */
const STALE_MINUTES = 30;

export async function SweepBanner({ locale }: { locale: PanelLocale }) {
  const health = await readHealth();
  // Записи нет вовсе — свип ещё ни разу не отработал после выката. Это не
  // авария: пугать ею в первые пять минут после релиза не за что.
  if (!health) return null;

  const last = health.last_ok_at ? Date.parse(health.last_ok_at) : NaN;
  const minutes = Number.isFinite(last) ? Math.round((Date.now() - last) / 60000) : null;
  const stale = minutes === null || minutes > STALE_MINUTES;

  if (!stale && !health.alerted) return null;

  const t = pick(homeDict, locale);
  return (
    <p className="mb-6 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
      <b>{t.sweepTitle}</b>{" "}
      {minutes === null ? t.sweepNever : t.sweepAgo(minutes)}
      {health.last_error ? (
        <>
          {" "}
          {t.sweepLastError} <code className="font-mono text-xs">{health.last_error}</code>
        </>
      ) : null}{" "}
      <span className="text-faint">{t.sweepCheck}</span>{" "}
      <HelpHint topic={helpAnchor("/admin", "banner")} label={t.sweepHint} />
    </p>
  );
}
