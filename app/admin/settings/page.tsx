import Link from "next/link";

import { AdminShell } from "@/components/admin/shell";
import { AppPush } from "@/components/admin/app-push";
import { LocaleSwitch } from "@/components/admin/locale-switch";
import { NavToggle } from "@/components/admin/nav-menu";
import { settingsDict } from "@/content/admin-panel/settings";
import { requireSection } from "@/lib/admin/guard";
import { pick } from "@/lib/admin/i18n";
import { notifyOffOf, offSummary } from "@/lib/admin/notify-prefs";
import { tunesNotices } from "@/lib/admin/roles";
import { settingsFor, type SettingLink } from "@/lib/admin/settings";

export const dynamic = "force-dynamic";

const BOX = "rounded-xl border border-line px-5 py-4";
const ROW = "flex flex-wrap items-start justify-between gap-x-6 gap-y-2 border-t border-line py-3 first:border-t-0 first:pt-0 last:pb-0";

/**
 * «Настройки» — всё, что настраивают, одной страницей (lib/admin/settings.ts).
 * Своё — переключатели прямо здесь, теми же действиями, что в шапке и на
 * «Главной». Касаний и команды — ссылками туда, где они живут, только то,
 * что человеку в руках и открыто галочками.
 */
export default async function SettingsPage() {
  const staff = await requireSection("/admin/settings");
  const locale = staff.panel_locale;
  const t = pick(settingsDict, locale);
  const off = await notifyOffOf(staff.id);
  const links = settingsFor(staff);
  const touch = links.filter((l) => l.group === "touch");
  const team = links.filter((l) => l.group === "team");

  const linkRow = (link: SettingLink) => (
    <li key={link.id} className={ROW}>
      <div className="min-w-0 max-w-xl">
        <p className="text-sm text-text">{t[`t_${link.id}`]}</p>
        <p className="mt-0.5 text-xs leading-snug text-faint">{t[`n_${link.id}`]}</p>
      </div>
      <Link href={link.href} className="shrink-0 text-sm text-green hover:underline">
        {t.open}
      </Link>
    </li>
  );

  return (
    <AdminShell staff={staff}>
      <h1 className="text-lg font-semibold">{t.title}</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">{t.lead}</p>

      <section id="mine" className={`mt-5 ${BOX}`}>
        <h2 className="text-sm font-semibold">{t.mine}</h2>
        <p className="mt-0.5 text-xs text-faint">{t.mineNote}</p>
        <ul className="mt-3">
          <li className={ROW}>
            <div className="min-w-0 max-w-xl">
              <p className="text-sm text-text">{t.langTitle}</p>
              <p className="mt-0.5 text-xs leading-snug text-faint">{t.langNote}</p>
            </div>
            <LocaleSwitch />
          </li>
          <li className={ROW}>
            <div className="min-w-0 max-w-xl">
              <p className="text-sm text-text">{t.menuTitle}</p>
              <p className="mt-0.5 text-xs leading-snug text-faint">{t.menuNote}</p>
            </div>
            <NavToggle classic={Boolean(staff.nav_classic)} />
          </li>
          <li className={ROW}>
            <div className="min-w-0 max-w-xl">
              <p className="text-sm text-text">{t.phoneTitle}</p>
              <p className="mt-0.5 text-xs leading-snug text-faint">{t.phoneNote}</p>
            </div>
            <AppPush variant="row" />
          </li>
          <li id="bot" className={ROW}>
            <div className="min-w-0 max-w-xl">
              <p className="text-sm text-text">{t.botTitle}</p>
              <p className="mt-0.5 text-xs leading-snug text-faint">
                {off === undefined ? t.botUnknown : t.botSummary(offSummary(off, staff.role, locale))}{" "}
                {tunesNotices(staff.role, staff.role, true) ? null : t.botByHead}
              </p>
            </div>
            {tunesNotices(staff.role, staff.role, true) ? (
              <Link href="/admin/team" className="shrink-0 text-sm text-green hover:underline">
                {t.botEdit}
              </Link>
            ) : null}
          </li>
        </ul>
      </section>

      {touch.length ? (
        <section id="touch" className={`mt-4 ${BOX}`}>
          <h2 className="text-sm font-semibold">{t.touch}</h2>
          <ul className="mt-3">{touch.map(linkRow)}</ul>
        </section>
      ) : null}

      {team.length ? (
        <section id="team" className={`mt-4 ${BOX}`}>
          <h2 className="text-sm font-semibold">{t.team}</h2>
          <ul className="mt-3">{team.map(linkRow)}</ul>
        </section>
      ) : null}
    </AdminShell>
  );
}
