import { AdminShell } from "@/components/admin/shell";
import { HelpHint } from "@/components/admin/help-link";
import { friendsDict } from "@/content/admin-panel/friends";
import { FRIEND_BROADCAST } from "@/content/friend-bot";
import { requireSection } from "@/lib/admin/guard";
import { helpAnchor } from "@/lib/admin/help";
import { pick } from "@/lib/admin/i18n";
import { FRIEND_GIFT_USD } from "@/lib/partners/friend";
import { friendProgress, listFriends } from "@/lib/partners/friend-store";
import { promoOf } from "@/lib/partners/rules";

export const dynamic = "force-dynamic";

/**
 * «Друзья» — вкладка «Партнёров»: программа «Приведи друга — сайт бесплатно»
 * (lib/partners/friend.ts). Только просмотр: участники заводятся сами в боте,
 * подарок раздаёт свип (lib/partners/friend-store, deliverFriendGifts) —
 * строкой владельцу и руководителю и задачей «Подарочный сайт для …».
 */
const TH = "px-4 py-3 font-normal";
const TD = "px-4 py-3";

export default async function FriendsPage() {
  const staff = await requireSection("/admin/friends");
  const t = pick(friendsDict, staff.panel_locale);
  const friends = await listFriends();
  const progress = await friendProgress(friends);
  const rows = friends
    .map((f) => ({ friend: f, stats: progress.get(f.id) ?? { came: 0, ordered: 0, paid: 0, earned: [] } }))
    .sort((a, b) => b.stats.paid - a.stats.paid || b.stats.came - a.stats.came);
  const total = (key: "came" | "ordered" | "paid") => rows.reduce((s, r) => s + r.stats[key], 0);

  return (
    <AdminShell staff={staff}>
      <h1 className="flex items-center gap-2 text-lg font-semibold">
        {t.title} <HelpHint topic={helpAnchor("/admin/friends", "terms")} />
      </h1>
      <p className="mt-1 max-w-3xl text-sm text-muted">{t.intro(FRIEND_GIFT_USD)}</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [t.cardPeople, friends.length],
          [t.cardCame, total("came")],
          [t.cardOrdered, total("ordered")],
          [t.cardSites, total("paid")],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border border-line bg-surface px-5 py-4">
            <p className="text-xs text-muted">{label}</p>
            <p className="mt-1 font-mono text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-surface">
        {rows.length ? (
          <table className="w-full sm:min-w-[640px] text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className={TH}>{t.thWho}</th>
                <th className={TH}>{t.thWord}</th>
                <th className={TH}>{t.thCame}</th>
                <th className={TH}>{t.thOrdered}</th>
                <th className={TH}>{t.thPaid}</th>
                <th className={TH}>{t.thSince}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ friend, stats }) => (
                <tr key={friend.id} className="border-t border-line-soft">
                  <td className={TD}>
                    {friend.name}
                    {friend.username ? <span className="ml-1 text-faint">@{friend.username}</span> : null}
                    {friend.status === "blocked" ? <span className="ml-2 text-xs text-gold">{t.blocked}</span> : null}
                  </td>
                  <td className={`${TD} font-mono`}>{promoOf(friend)}</td>
                  <td className={`${TD} font-mono`}>{stats.came}</td>
                  <td className={`${TD} font-mono`}>{stats.ordered}</td>
                  <td className={`${TD} font-mono ${stats.paid ? "font-semibold text-green" : ""}`}>{stats.paid}</td>
                  <td className={`${TD} text-muted`}>{friend.created_at.slice(0, 10).split("-").reverse().join(".")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-5 py-4 text-sm text-muted">{t.empty}</p>
        )}
      </div>

      <section className="mt-6 rounded-xl border border-line bg-surface px-5 py-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          {t.broadcastTitle} <HelpHint topic={helpAnchor("/admin/friends", "broadcast")} />
        </h2>
        <p className="mt-1 text-xs text-gold">{t.broadcastNote}</p>
        <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-ink px-4 py-3 text-sm text-text">{FRIEND_BROADCAST(FRIEND_GIFT_USD)}</pre>
      </section>
    </AdminShell>
  );
}
