import { AdminShell } from "@/components/admin/shell";
import { MarketView } from "@/components/admin/markets-view";
import { requireSection } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

/**
 * Страница страны в «Рынках» (components/admin/markets-view.tsx). У
 * Telegram-чата — «Скауту»: тот же addScoutChatAction, что «Добавить группу»
 * в «Сигналах скаута»; скаут вступит сам, в свою очередь.
 */
export default async function MarketPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ g?: string }>;
}) {
  const staff = await requireSection("/admin/markets");
  const [{ slug }, { g }] = await Promise.all([params, searchParams]);
  return (
    <AdminShell staff={staff}>
      <MarketView slug={slug} locale={staff.panel_locale} result={g} />
    </AdminShell>
  );
}
