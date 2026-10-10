import { notFound, redirect } from "next/navigation";

import { AdsBoard } from "@/components/ads/board";
import { canUseAccount } from "@/lib/ads/access";
import { adsEnabled } from "@/lib/ads/store";

export const dynamic = "force-dynamic";

/** Один рекламный кабинет агентства. Студия смотрит его из панели. */
export default async function AdsAccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ account: string }>;
  searchParams: Promise<{ r?: string; d?: string }>;
}) {
  const { account: id } = await params;
  const { r, d } = await searchParams;
  const access = await canUseAccount(id);
  if (!access) redirect("/ads");
  if (access.actor.kind === "staff") redirect(`/admin/ads/${id}${r ? `?r=${encodeURIComponent(r)}` : ""}`);
  if (!access.account) notFound();
  return (
    <AdsBoard
      account={access.account}
      locale={access.actor.locale}
      staff={false}
      r={r}
      d={d}
      backHref="/ads"
      flagOn={await adsEnabled()}
    />
  );
}
