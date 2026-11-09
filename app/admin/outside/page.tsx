import { AdminShell } from "@/components/admin/shell";
import { OutsideView } from "@/components/admin/outside-view";
import { requireSection } from "@/lib/admin/guard";
import { readAuto } from "@/lib/outside/auto-store";
import { listPosts, mayChoosePublisher, outsidePeople, readPublisher } from "@/lib/outside/store";

export const dynamic = "force-dynamic";

/**
 * «Статьи на площадках» — черновики для vc.ru, Дзена и Tenchat, и то, что
 * выходит само: Telegraph, ВКонтакте и Telegram-канал (lib/outside/).
 *
 * Владелец, 07.11.2026: «Хочу автоматизировать статьи на тех площадках, где
 * ты написал», на план — «Делаем по твоей рекомендации». Владельцу и
 * руководителю; менеджеру — галочкой в «Команде».
 */
export default async function OutsidePage({ searchParams }: { searchParams: Promise<{ r?: string }> }) {
  const staff = await requireSection("/admin/outside");
  const canChoose = mayChoosePublisher(staff);
  const [{ r }, posts, people, publisher, auto] = await Promise.all([
    searchParams,
    listPosts(),
    outsidePeople(),
    readPublisher(),
    // Ключи и каналы Postiz — только тем, кто их вставляет.
    canChoose ? readAuto() : Promise.resolve(null),
  ]);
  return (
    <AdminShell staff={staff}>
      <OutsideView
        locale={staff.panel_locale}
        posts={posts}
        people={people}
        publisher={publisher}
        canChoose={canChoose}
        auto={auto}
        result={r}
        now={Date.now()}
      />
    </AdminShell>
  );
}
