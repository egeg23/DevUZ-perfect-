import { AdminShell } from "@/components/admin/shell";
import { CallHelperDesk } from "@/components/admin/callhelper-desk";
import { requireSection } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

/**
 * DevUz CallHelper — суфлёр для операторов колл-центра.
 *
 * Владелец, 25.11.2026: «Давай сделаем ИИ суфлёра для колл-центров…», на
 * план — «Делаем, название: DevUz CallHelper». Первый шаг: суфлёр по тексту
 * разговора и сценарий звонка; голос, кабинет колл-центра и подписка —
 * следующими шагами (CLAUDE.md, «DevUz CallHelper»).
 */
export default async function CallHelperPage() {
  const staff = await requireSection("/admin/callhelper");
  return (
    <AdminShell staff={staff}>
      <CallHelperDesk />
    </AdminShell>
  );
}
