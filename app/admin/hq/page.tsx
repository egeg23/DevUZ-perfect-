import { AppPush } from "@/components/admin/app-push";
import { HqRefresh } from "@/components/admin/hq-refresh";
import { HqSide } from "@/components/admin/hq-side";
import { HqView } from "@/components/admin/hq";
import { MyHqView } from "@/components/admin/hq-my";
import { AdminShell } from "@/components/admin/shell";
import { repeatOf, sendsBroadcasts } from "@/lib/admin/broadcast";
import { giveLeadAction } from "@/app/admin/hq/actions";
import { broadcastById, broadcastHistory, broadcastPeople } from "@/lib/admin/broadcast-store";
import { segmentCounts } from "@/lib/admin/bot-users";
import { loadBotAudience } from "@/lib/admin/bot-users-store";
import { requireSection } from "@/lib/admin/guard";
import { seesEveryone } from "@/lib/admin/roles";
import { HQ_REFRESH_MS } from "@/lib/admin/hq";
import { loadHq } from "@/lib/admin/hq-store";
import { loadMyHq } from "@/lib/admin/hq-my-store";
import { SLOW_MS, memo } from "@/lib/memo";

/** История рассылок: «дошло N» обновляется не реже, чем раз в две минуты. */
const HISTORY_MS = 2 * 60_000;

// Пульс — состояние базы прямо сейчас: кэш здесь показал бы вчерашний пожар.
export const dynamic = "force-dynamic";

/**
 * «Главная» — командный центр владельца и руководителя (CLAUDE.md, «Главная»).
 * Доступ — роль и галочки владельца (requireSection), деньги — только
 * владельцу: их отбирает loadHq по роли. Рассылка — владельцу и
 * руководителю по роли (sendsBroadcasts), а не по галочке.
 *
 * Менеджер видит не компанию, а свой день: только свои лиды, касания,
 * макеты и задачи (loadMyHq, lib/admin/hq-my-store.ts), без денег студии.
 */
export default async function HqPage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string; repeat?: string; st?: string; due?: string; mk?: string }>;
}) {
  const staff = await requireSection("/admin/hq");
  const { to, repeat, st, due, mk } = await searchParams;
  const now = new Date();
  if (!seesEveryone(staff.role)) {
    const my = await loadMyHq(staff, now);
    return (
      <AdminShell staff={staff}>
        <HqRefresh everyMs={HQ_REFRESH_MS} />
        {/* Приложение на телефоне и пуш: карточка, пока не поставлено или не включено. */}
        <AppPush variant="card" />
        <MyHqView
          my={my}
          locale={staff.panel_locale}
          name={staff.display_name}
          now={now}
          result={st ? { st, due: due && !Number.isNaN(Date.parse(due)) ? due : null } : null}
          mark={mk}
        />
      </AdminShell>
    );
  }
  const broadcasts = sendsBroadcasts(staff.role);
  // Состав команды, история рассылок и аудитория бота меняются редко, а
  // страница обновляется раз в 90 секунд: из памяти (lib/memo.ts). Новая
  // рассылка и «число изменилось» снимают запомненное сразу.
  const [hq, people, history, usersHistory, audience, again] = await Promise.all([
    loadHq(staff, now),
    memo("hq:people", SLOW_MS, () => broadcastPeople()),
    broadcasts ? memo("hq:broadcast:staff", HISTORY_MS, () => broadcastHistory("staff", 10)) : Promise.resolve([]),
    broadcasts ? memo("hq:broadcast:users", HISTORY_MS, () => broadcastHistory("users", 10)) : Promise.resolve([]),
    broadcasts ? memo("hq:audience", SLOW_MS, () => loadBotAudience()) : Promise.resolve(null),
    broadcasts && repeat ? broadcastById(repeat) : Promise.resolve(null),
  ]);
  // Себе тоже можно — последним: обычно задачу ставят другим.
  const taskPeople = [
    ...people.filter((p) => p.id !== staff.id),
    ...people.filter((p) => p.id === staff.id),
  ].map((p) => ({ id: p.id, name: p.display_name }));
  return (
    <AdminShell staff={staff}>
      <HqRefresh everyMs={HQ_REFRESH_MS} />
      <AppPush variant="card" />
      <HqView
        hq={hq}
        locale={staff.panel_locale}
        name={staff.display_name}
        now={now}
        personTaskHref={(id) => `/admin/hq?to=${id}#task`}
        giveAction={seesEveryone(staff.role) ? giveLeadAction : undefined}
        side={
          <HqSide
            locale={staff.panel_locale}
            viewer={staff}
            taskPeople={taskPeople}
            preselect={to && /^[0-9a-f-]{36}$/.test(to) ? to : null}
            broadcast={
              broadcasts && audience
                ? {
                    people,
                    history,
                    usersHistory,
                    userCounts: segmentCounts(audience.users, audience.marks),
                    repeat: again ? repeatOf(again) : null,
                  }
                : null
            }
            now={now}
          />
        }
      />
    </AdminShell>
  );
}
