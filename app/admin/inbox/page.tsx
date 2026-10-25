import Link from "next/link";

import { AdminShell } from "@/components/admin/shell";
import { InboxReply } from "@/components/admin/inbox-reply";
import { inboxDict } from "@/content/admin-panel/inbox";
import { requireSection } from "@/lib/admin/guard";
import { pick } from "@/lib/admin/i18n";
import { waitedMinutes } from "@/lib/admin/inbox";
import { loadInbox } from "@/lib/admin/inbox-store";
import { STAFF_REPLY_MAX } from "@/lib/admin/outreach-talk-store";
import { activeStaff } from "@/lib/admin/team";
import { BOT_WRITE_MAX } from "@/lib/qualify/bot-inbox-store";

export const dynamic = "force-dynamic";

/**
 * «Входящие» — всё, что ждёт ответа человека, одной очередью
 * (lib/admin/inbox.ts). Владелец, 25.10.2026: «Погнали по порядку».
 * Менеджер видит свои касания, руководитель и владелец — все и обращения
 * в бота. Ответ — в строке, теми же действиями, что в карточке лида.
 */
export default async function InboxPage() {
  const staff = await requireSection("/admin/inbox");
  const locale = staff.panel_locale;
  const t = pick(inboxDict, locale);
  const now = Date.now();
  const [inbox, people] = await Promise.all([loadInbox(staff), activeStaff().catch(() => [])]);
  const name = (id: string | null) => (id ? (people.find((p) => p.id === id)?.display_name ?? "—") : t.nobody);
  const everyone = staff.role !== "manager";

  return (
    <AdminShell staff={staff}>
      <h1 className="text-lg font-semibold">{t.title}</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">{t.lead}</p>
      {inbox.offline ? <p className="mt-4 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">{t.offline}</p> : null}
      {inbox.freeLeads ? (
        <p className="mt-4 text-sm">
          <Link href="/admin?owner=free&status=new" className="text-green hover:underline">
            {t.freeLeads(inbox.freeLeads)}
          </Link>
        </p>
      ) : null}

      {inbox.items.length ? (
        <ul className="mt-5 flex flex-col gap-3">
          {inbox.items.map((item) => {
            const minutes = waitedMinutes(item.since, now);
            return (
              <li
                key={item.kind === "touch" ? `t:${item.prospectId}` : `b:${item.chatId}`}
                className={`rounded-xl border px-4 py-3 ${minutes >= 60 ? "border-gold/40 bg-gold/5" : "border-line bg-surface"}`}
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                  <span className="font-medium text-text">{item.label}</span>
                  <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px] text-faint">
                    {item.kind === "touch" ? t.kindTouch : t.kindBot}
                  </span>
                  <span className={`text-xs ${minutes >= 60 ? "text-gold" : "text-faint"}`}>{t.waited(minutes)}</span>
                  {everyone ? <span className="text-xs text-faint">{t.owner(name(item.ownerId))}</span> : null}
                </div>
                {item.text ? <p className="mt-1.5 line-clamp-3 whitespace-pre-line text-sm text-muted">{item.text}</p> : null}
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  {item.kind === "touch" && item.leadId ? (
                    <>
                      <InboxReply kind="touch" leadId={item.leadId} prospectId={item.prospectId} limit={STAFF_REPLY_MAX} />
                      <Link href={`/admin/leads/${item.leadId}#talk`} className="text-xs text-muted hover:text-text">
                        {t.open}
                      </Link>
                    </>
                  ) : item.kind === "touch" ? (
                    <Link href={`/admin/prospect?open=${item.prospectId}#p-${item.prospectId}`} className="text-xs text-muted hover:text-text">
                      {t.openTouch}
                    </Link>
                  ) : (
                    <InboxReply kind="bot" chatId={item.chatId} limit={BOT_WRITE_MAX} />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : !inbox.offline ? (
        <p className="mt-6 rounded-xl border border-line bg-surface px-5 py-8 text-center text-sm text-muted">{t.empty}</p>
      ) : null}
    </AdminShell>
  );
}
