import { HelpHint } from "@/components/admin/help-link";
import { MockupList, type MockupView } from "@/components/admin/mockup-list";
import { AdminShell } from "@/components/admin/shell";
import { mockupsDict } from "@/content/admin-panel/mockups";
import { requireStaff } from "@/lib/admin/guard";
import { helpAnchor } from "@/lib/admin/help";
import { pick } from "@/lib/admin/i18n";
import { tashkentTime } from "@/lib/admin/mockups";
import { mockupList } from "@/lib/admin/mockups-store";

export const dynamic = "force-dynamic";

/** «08.10.2026» — у витрины дата без часов, у прототипа — по Ташкенту. */
function made(value: string): string {
  const day = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent" }).format(new Date(value));
  const [y, m, d] = day.split("-");
  return `${d}.${m}.${y}`;
}

/**
 * Макеты: все макеты студии и пароль на сутки для клиента.
 *
 * Владелец, 08.10.2026: «Ссылка > название для кого был макет > Ниша >
 * кнопка сгенерировать пароль доступа… А то макетов много, теряться начинаем
 * в них». Откуда список и как живёт пароль — lib/admin/mockups.ts и
 * lib/proto/codes.ts.
 */
export default async function MockupsPage() {
  const staff = await requireStaff();
  const locale = staff.panel_locale;
  const t = pick(mockupsDict, locale);
  const rows: MockupView[] = (await mockupList(locale)).map((row) => ({
    ...row,
    createdText: made(row.created),
    liveUntilText: row.liveUntil ? tashkentTime(row.liveUntil) : null,
  }));

  return (
    <AdminShell staff={staff}>
      <h1 className="flex items-center gap-2 text-lg font-semibold">
        {t.title}
        <HelpHint topic={helpAnchor("/admin/mockups", "password")} />
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{t.intro}</p>
      <p className="mt-2 text-xs text-faint">{t.total(rows.length)}</p>
      <MockupList rows={rows} />
    </AdminShell>
  );
}
