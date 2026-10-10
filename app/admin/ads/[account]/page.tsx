import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/shell";
import { AdsBoard } from "@/components/ads/board";
import { requireRole } from "@/lib/admin/guard";
import { accountById, adsEnabled } from "@/lib/ads/store";

export const dynamic = "force-dynamic";

/** Рекламный кабинет из панели: то же, что видит агентство, плюс «Прокрутить 7 дней» у заглушки. */
export default async function AdsAccountAdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ account: string }>;
  searchParams: Promise<{ r?: string; d?: string }>;
}) {
  const staff = await requireRole("admin", "head");
  const { account: id } = await params;
  const { r, d } = await searchParams;
  const account = await accountById(id);
  if (!account) notFound();
  return (
    <AdminShell staff={staff}>
      <AdsBoard
        account={account}
        locale={staff.panel_locale}
        staff
        r={r}
        d={d}
        backHref={`/admin/ads?w=${account.workspace_id}`}
        flagOn={await adsEnabled()}
      />
    </AdminShell>
  );
}
