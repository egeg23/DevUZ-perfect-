import { AdminShell } from "@/components/admin/shell";
import { TrafficPanel, trafficPeriodOf } from "@/components/admin/traffic-panel";
import { requireRole } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

/**
 * Трафик сайта: Метрика и Google Analytics.
 *
 * Раньше это была вкладка на главной владельца. Владелец попросил открыть
 * её Александру и руководителям — у них вкладок главной нет, поэтому трафик
 * стал своим разделом.
 *
 * Руководитель видит те же цифры, но не кнопки подключения: вход в Google
 * делается аккаунтом владельца, и сменить его чужими руками значит увести
 * статистику в другой аккаунт. Действия подключения и так проверяют, что
 * нажал владелец, — кнопки прячутся, чтобы не обещать то, что ответит
 * отказом.
 */
export default async function TrafficPage({
  searchParams,
}: {
  searchParams: Promise<{
    d?: string;
    /** Что вернул вход через Google (app/admin/google). */
    ga?: string;
    gd?: string;
    gp?: string;
  }>;
}) {
  const staff = await requireRole("admin", "head");
  const params = await searchParams;
  const owner = staff.role === "admin";

  return (
    <AdminShell staff={staff}>
      <h1 className="mb-4 text-lg font-semibold">Трафик сайта</h1>
      <TrafficPanel
        days={trafficPeriodOf(params.d)}
        canConnect={owner}
        notice={owner ? { code: params.ga, detail: params.gd, property: params.gp } : {}}
      />
    </AdminShell>
  );
}
