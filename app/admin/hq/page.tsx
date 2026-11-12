import { AppPush } from "@/components/admin/app-push";
import { DashboardHome } from "@/components/admin/dashboard-home";
import { HqRefresh } from "@/components/admin/hq-refresh";
import { HqSide } from "@/components/admin/hq-side";
import { HqView } from "@/components/admin/hq";
import { HqDesk } from "@/components/admin/hq-desk";
import { hqDeskDict } from "@/content/admin-panel/hq-desk";
import { pick } from "@/lib/admin/i18n";
import { loadInbox } from "@/lib/admin/inbox-store";
import { MyHqView } from "@/components/admin/hq-my";
import { AdminShell } from "@/components/admin/shell";
import { SweepBanner } from "@/components/admin/sweep-banner";
import { TouchPlanLine } from "@/components/admin/touch-plan-line";
import { touchProgressOf } from "@/lib/admin/touch-store";
import { repeatOf, sendsBroadcasts } from "@/lib/admin/broadcast";
import { giveLeadAction } from "@/app/admin/hq/actions";
import { broadcastById, broadcastHistory, broadcastPeople } from "@/lib/admin/broadcast-store";
import { botSubs, segmentCounts } from "@/lib/admin/bot-users";
import { loadBotAudience, loadBotMockups } from "@/lib/admin/bot-users-store";
import { makesMockups } from "@/lib/admin/mockup-order";
import { requireSection } from "@/lib/admin/guard";
import { seesEveryone } from "@/lib/admin/roles";
import { HQ_REFRESH_MS, deltaOf } from "@/lib/admin/hq";
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
  searchParams: Promise<{ to?: string; repeat?: string; st?: string; due?: string; mk?: string; p?: string }>;
}) {
  const staff = await requireSection("/admin/hq");
  const { to, repeat, st, due, mk, p } = await searchParams;
  const now = new Date();
  if (!seesEveryone(staff.role)) {
    // «Входящие» — первым рядом, как в эталоне «DevUz Офис»: только свои.
    const [my, plan, inbox] = await Promise.all([loadMyHq(staff, now), touchProgressOf(staff.id), loadInbox(staff, now)]);
    return (
      <AdminShell staff={staff}>
        <HqRefresh everyMs={HQ_REFRESH_MS} />
        {/* Напоминания по лидам встали — первым: иначе узнают по остывшему лиду. */}
        <SweepBanner locale={staff.panel_locale} />
        {/* План касаний на неделю — строкой, если его поставили (раньше — на «Лидах»). */}
        <TouchPlanLine progress={plan} />
        {/* Приложение на телефоне и пуш: карточка, пока не поставлено или не включено. */}
        <AppPush variant="card" />
        <HqDesk locale={staff.panel_locale} items={inbox.items} now={now} />
        <MyHqView
          my={my}
          locale={staff.panel_locale}
          name={staff.display_name}
          now={now}
          result={st ? { st, due: due && !Number.isNaN(Date.parse(due)) ? due : null } : null}
          mark={mk}
        />
        {/* Неделя — ниже дня: рекомендации и «План и факт», раньше жили на «Лидах». */}
        <DashboardHome staff={staff} planNotice={p} where="hq" />
      </AdminShell>
    );
  }
  const broadcasts = sendsBroadcasts(staff.role);
  // Состав команды, история рассылок и аудитория бота меняются редко, а
  // страница обновляется раз в 90 секунд: из памяти (lib/memo.ts). Новая
  // рассылка и «число изменилось» снимают запомненное сразу.
  const [hq, people, history, usersHistory, audience, again, plan, inbox, mockups] = await Promise.all([
    loadHq(staff, now),
    memo("hq:people", SLOW_MS, () => broadcastPeople()),
    broadcasts ? memo("hq:broadcast:staff", HISTORY_MS, () => broadcastHistory("staff", 10)) : Promise.resolve([]),
    broadcasts ? memo("hq:broadcast:users", HISTORY_MS, () => broadcastHistory("users", 10)) : Promise.resolve([]),
    broadcasts ? memo("hq:audience", SLOW_MS, () => loadBotAudience()) : Promise.resolve(null),
    broadcasts && repeat ? broadcastById(repeat) : Promise.resolve(null),
    touchProgressOf(staff.id),
    loadInbox(staff, now),
    // Макеты подписчиков — рядом с подписчиками, тем же шагом: раз в 5 минут.
    broadcasts ? memo("hq:bot-mockups", SLOW_MS, () => loadBotMockups().catch(() => null)) : Promise.resolve(null),
  ]);
  // «Сегодня» верхнего ряда — те же числа пульса, что ниже, коротко (hq-desk.tsx).
  const desk = pick(hqDeskDict, staff.panel_locale);
  const tiles = [
    { label: desk.newLeads, value: hq.leads.new7.now, delta: deltaOf(hq.leads.new7) },
    { label: desk.replies, value: hq.touches.replies7.now, delta: deltaOf(hq.touches.replies7) },
    { label: desk.touchesToday, value: hq.touches.today, sub: hq.touches.norm ? desk.ofNorm(hq.touches.norm) : undefined },
  ];
  const days = hq.people.reduce<number[]>((sum, p) => p.touchDays.map((v, i) => (sum[i] ?? 0) + v), []);
  // Себе тоже можно — последним: обычно задачу ставят другим.
  const taskPeople = [
    ...people.filter((p) => p.id !== staff.id),
    ...people.filter((p) => p.id === staff.id),
  ].map((p) => ({ id: p.id, name: p.display_name }));
  const makerIds = people.filter((p) => makesMockups(p.role)).map((p) => p.id);
  return (
    <AdminShell staff={staff}>
      <HqRefresh everyMs={HQ_REFRESH_MS} />
      <AppPush variant="card" />
      <TouchPlanLine progress={plan} />
      <HqDesk locale={staff.panel_locale} items={inbox.items} now={now} tiles={tiles} days={days.length ? days : undefined} />
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
            makerIds={makerIds}
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
            subs={audience ? botSubs(audience.users, audience.marks, now) : null}
            mockups={mockups}
            now={now}
          />
        }
      />
      {/* Неделя — ниже пульса: команда, рекомендации, «План и факт» (раньше — «Лиды»). */}
      <DashboardHome staff={staff} planNotice={p} where="hq" />
    </AdminShell>
  );
}
