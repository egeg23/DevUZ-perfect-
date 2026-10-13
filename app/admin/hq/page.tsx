import { HqRefresh } from "@/components/admin/hq-refresh";
import { HqView } from "@/components/admin/hq";
import { AdminShell } from "@/components/admin/shell";
import { requireSection } from "@/lib/admin/guard";
import { HQ_REFRESH_MS } from "@/lib/admin/hq";
import { loadHq } from "@/lib/admin/hq-store";

// Пульс — состояние базы прямо сейчас: кэш здесь показал бы вчерашний пожар.
export const dynamic = "force-dynamic";

/**
 * «Главная» — командный центр владельца и руководителя (CLAUDE.md, «Главная»).
 * Доступ — роль и галочки владельца (requireSection), деньги — только
 * владельцу: их отбирает loadHq по роли.
 */
export default async function HqPage() {
  const staff = await requireSection("/admin/hq");
  const now = new Date();
  const hq = await loadHq(staff, now);
  return (
    <AdminShell staff={staff}>
      <HqRefresh everyMs={HQ_REFRESH_MS} />
      <HqView hq={hq} locale={staff.panel_locale} name={staff.display_name} now={now} />
    </AdminShell>
  );
}
