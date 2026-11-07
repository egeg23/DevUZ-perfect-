import { AdminShell } from "@/components/admin/shell";
import { OutsideView } from "@/components/admin/outside-view";
import { requireSection } from "@/lib/admin/guard";
import { listPosts, mayChoosePublisher, outsidePeople, readPublisher } from "@/lib/outside/store";

export const dynamic = "force-dynamic";

/**
 * «Статьи на площадках» — черновики для vc.ru, Дзена и Tenchat (lib/outside/).
 *
 * Владелец, 07.11.2026: «Хочу автоматизировать статьи на тех площадках, где
 * ты написал», на план — «Делаем по твоей рекомендации». Владельцу и
 * руководителю; менеджеру — галочкой в «Команде».
 */
export default async function OutsidePage({ searchParams }: { searchParams: Promise<{ r?: string }> }) {
  const staff = await requireSection("/admin/outside");
  const [{ r }, posts, people, publisher] = await Promise.all([searchParams, listPosts(), outsidePeople(), readPublisher()]);
  return (
    <AdminShell staff={staff}>
      <OutsideView
        locale={staff.panel_locale}
        posts={posts}
        people={people}
        publisher={publisher}
        canChoose={mayChoosePublisher(staff)}
        result={r}
        now={Date.now()}
      />
    </AdminShell>
  );
}
