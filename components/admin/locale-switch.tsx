"use client";

import { setPanelLocale } from "@/app/admin/actions";
import { usePanelDict, usePanelLocale } from "@/components/admin/panel-locale";
import { shellDict } from "@/content/admin-panel/shell";
import { PANEL_LOCALES, PANEL_LOCALE_NAME, PANEL_LOCALE_SHORT } from "@/lib/admin/i18n";

/**
 * RU / UZ / PL в шапке.
 *
 * Каждый меняет язык себе сам, и только себе: запись идёт в его строку
 * staff, поэтому язык едет с ним на телефон и в другой браузер. Страница
 * перерисовывается на месте — адрес и прокрутка остаются.
 */
export function LocaleSwitch() {
  const current = usePanelLocale();
  const t = usePanelDict(shellDict);
  return (
    <form action={setPanelLocale} className="flex items-center gap-0.5 font-mono text-[11px]" aria-label={t.language}>
      {PANEL_LOCALES.map((locale) =>
        locale === current ? (
          <span
            key={locale}
            aria-current="true"
            title={PANEL_LOCALE_NAME[locale]}
            className="rounded bg-surface-2 px-1.5 py-0.5 text-text"
          >
            {PANEL_LOCALE_SHORT[locale]}
          </span>
        ) : (
          <button
            key={locale}
            type="submit"
            name="locale"
            value={locale}
            title={PANEL_LOCALE_NAME[locale]}
            lang={locale}
            className="rounded px-1.5 py-0.5 text-faint transition hover:text-text"
          >
            {PANEL_LOCALE_SHORT[locale]}
          </button>
        ),
      )}
    </form>
  );
}
