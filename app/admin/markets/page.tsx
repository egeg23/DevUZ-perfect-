import { AdminShell } from "@/components/admin/shell";
import { MarketsIndex } from "@/components/admin/markets-view";
import { requireSection } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

/**
 * «Рынки» — страны, где искать клиентов, и площадки в каждой.
 *
 * Владелец, 06.11.2026: «Мы планируем уменьшить усилия на Узбекистан из-за
 * сложности менталитета и пойти по снг / сша. Нужно вывести в панели новый
 * раздел для всех: страны… Все со ссылками. В общем сводка для менеджеров,
 * где и как искать клиентов». Всем ролям; данные — content/markets.ts.
 */
export default async function MarketsPage() {
  const staff = await requireSection("/admin/markets");
  return (
    <AdminShell staff={staff}>
      <MarketsIndex locale={staff.panel_locale} />
    </AdminShell>
  );
}
