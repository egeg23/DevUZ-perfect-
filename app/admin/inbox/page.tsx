import { AdminShell } from "@/components/admin/shell";
import { InboxView, inboxKey } from "@/components/admin/inbox-view";
import { requireSection } from "@/lib/admin/guard";
import { loadInbox } from "@/lib/admin/inbox-store";
import { STAFF_REPLY_MAX, talkForProspect } from "@/lib/admin/outreach-talk-store";
import { dealForLead } from "@/lib/admin/sales-stages-store";
import { activeStaff } from "@/lib/admin/team";
import { BOT_WRITE_MAX } from "@/lib/qualify/bot-inbox-store";

export const dynamic = "force-dynamic";

/**
 * «Входящие» — всё, что ждёт ответа человека, одной очередью
 * (lib/admin/inbox.ts). Владелец, 25.10.2026: «Погнали по порядку».
 * Менеджер видит свои касания, руководитель и владелец — все и обращения
 * в бота. Ответ — теми же действиями, что в карточке лида. Вид — три
 * колонки (components/admin/inbox-view.tsx): разговор и ход сделки грузятся
 * только для открытой переписки.
 */
export default async function InboxPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const staff = await requireSection("/admin/inbox");
  const { c } = await searchParams;
  const [inbox, people] = await Promise.all([loadInbox(staff), activeStaff().catch(() => [])]);
  const picked = c ? (inbox.items.find((i) => inboxKey(i) === c) ?? null) : null;
  const current = picked ?? inbox.items[0] ?? null;
  const [talk, deal] =
    current?.kind === "touch"
      ? await Promise.all([
          talkForProspect(current.prospectId).catch(() => null),
          current.leadId ? dealForLead(current.leadId).catch(() => null) : Promise.resolve(null),
        ])
      : [null, null];
  return (
    <AdminShell staff={staff}>
      <InboxView
        locale={staff.panel_locale}
        role={staff.role}
        inbox={inbox}
        picked={picked}
        talk={talk}
        deal={deal}
        names={Object.fromEntries(people.map((p) => [p.id, p.display_name]))}
        now={Date.now()}
        limits={{ touch: STAFF_REPLY_MAX, bot: BOT_WRITE_MAX }}
      />
    </AdminShell>
  );
}
