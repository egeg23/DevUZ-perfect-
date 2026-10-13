import { HqRefresh } from "@/components/admin/hq-refresh";
import { HqSide } from "@/components/admin/hq-side";
import { HqView } from "@/components/admin/hq";
import { AdminShell } from "@/components/admin/shell";
import { sendsBroadcasts } from "@/lib/admin/broadcast";
import { broadcastHistory, broadcastPeople } from "@/lib/admin/broadcast-store";
import { requireSection } from "@/lib/admin/guard";
import { HQ_REFRESH_MS } from "@/lib/admin/hq";
import { loadHq } from "@/lib/admin/hq-store";

// Пульс — состояние базы прямо сейчас: кэш здесь показал бы вчерашний пожар.
export const dynamic = "force-dynamic";

/**
 * «Главная» — командный центр владельца и руководителя (CLAUDE.md, «Главная»).
 * Доступ — роль и галочки владельца (requireSection), деньги — только
 * владельцу: их отбирает loadHq по роли. Рассылка — владельцу и
 * руководителю по роли (sendsBroadcasts), а не по галочке.
 */
export default async function HqPage({ searchParams }: { searchParams: Promise<{ to?: string }> }) {
  const staff = await requireSection("/admin/hq");
  const { to } = await searchParams;
  const now = new Date();
  const broadcasts = sendsBroadcasts(staff.role);
  const [hq, people, history] = await Promise.all([
    loadHq(staff, now),
    broadcastPeople(),
    broadcasts ? broadcastHistory(10) : Promise.resolve([]),
  ]);
  // Себе тоже можно — последним: обычно задачу ставят другим.
  const taskPeople = [
    ...people.filter((p) => p.id !== staff.id),
    ...people.filter((p) => p.id === staff.id),
  ].map((p) => ({ id: p.id, name: p.display_name }));
  return (
    <AdminShell staff={staff}>
      <HqRefresh everyMs={HQ_REFRESH_MS} />
      <HqView
        hq={hq}
        locale={staff.panel_locale}
        name={staff.display_name}
        now={now}
        personTaskHref={(id) => `/admin/hq?to=${id}#task`}
        side={
          <HqSide
            locale={staff.panel_locale}
            viewer={staff}
            taskPeople={taskPeople}
            preselect={to && /^[0-9a-f-]{36}$/.test(to) ? to : null}
            broadcast={broadcasts ? { people, history } : null}
            now={now}
          />
        }
      />
    </AdminShell>
  );
}
