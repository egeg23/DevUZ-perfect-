import Link from "next/link";

import { addScoutChatAction } from "@/app/admin/scout/actions";
import { PRIORITY_TONE } from "@/components/admin/market-tone";
import { AdminShell } from "@/components/admin/shell";
import { SubmitButton } from "@/components/admin/submit-button";
import { marketsDict } from "@/content/admin-panel/markets";
import { MARKETS, marketOf, resourcesByKind, type ResourceCost } from "@/content/markets";
import { requireSection } from "@/lib/admin/guard";
import { pick } from "@/lib/admin/i18n";
import { parseChatInput } from "@/lib/scout/extra-chats";

export const dynamic = "force-dynamic";

const COST_TONE: Record<ResourceCost, string> = {
  free: "border-green/40 bg-green/10 text-green",
  freemium: "border-line bg-surface-2 text-muted",
  paid: "border-gold/30 bg-gold/10 text-gold",
};

/** Ответ «Скауту» (app/admin/scout/actions.ts → ?g=). */
const SCOUT_RESULT = { added: "scoutAdded", exists: "scoutExists", bad: "scoutFailed", failed: "scoutFailed" } as const;

/**
 * Страница страны в «Рынках»: как там ищут разработчика, с чего начать и
 * площадки по видам — со ссылками. У Telegram-чата — «Скауту»: группа
 * уходит в «Группы для скаута», он вступит сам (лимит и паузы — его).
 */
export default async function MarketPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ g?: string }>;
}) {
  const staff = await requireSection("/admin/markets");
  const locale = staff.panel_locale;
  const t = pick(marketsDict, locale);
  const [{ slug }, { g }] = await Promise.all([params, searchParams]);
  const market = marketOf(slug);
  const back = `/admin/markets/${slug}`;
  const result = g && g in SCOUT_RESULT ? SCOUT_RESULT[g as keyof typeof SCOUT_RESULT] : null;

  return (
    <AdminShell staff={staff}>
      <Link href="/admin/markets" className="text-xs text-blue-soft hover:underline">
        {t.back}
      </Link>

      {/* Переключатель стран — не возвращаться к списку ради соседней. */}
      <nav className="mt-3 flex flex-wrap gap-2">
        {MARKETS.map((item) => (
          <Link
            key={item.slug}
            href={`/admin/markets/${item.slug}`}
            aria-current={item.slug === slug ? "page" : undefined}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              item.slug === slug ? "border-green/40 bg-green/10 text-green" : "border-line bg-surface text-muted hover:text-text"
            }`}
          >
            <span aria-hidden>{item.flag}</span> {item.name[locale]}
          </Link>
        ))}
      </nav>

      {!market ? (
        <p className="mt-6 rounded-xl border border-line bg-surface px-5 py-8 text-center text-sm text-muted">{t.lead}</p>
      ) : (
        <>
          <h1 className="mt-5 flex flex-wrap items-center gap-3 text-lg font-semibold">
            <span className="text-3xl leading-none" aria-hidden>
              {market.flag}
            </span>
            {market.name[locale]}
            <span className={`rounded-full border px-2 py-0.5 text-xs font-normal ${PRIORITY_TONE[market.priority]}`}>
              {t[`priority_${market.priority}`]}
            </span>
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{market.why[locale]}</p>

          {result ? (
            <p
              data-result={result === "scoutAdded" ? "ok" : "warn"}
              className={`mt-4 rounded-xl border px-4 py-2.5 text-sm ${
                result === "scoutAdded" ? "border-green/30 bg-green/10 text-green" : "border-gold/30 bg-gold/10 text-gold"
              }`}
            >
              {t[result]}
            </p>
          ) : null}

          <section className="mt-5 rounded-xl border border-line bg-surface px-5 py-4">
            <h2 className="text-sm font-semibold">{t.start}</h2>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
              {market.tips.map((tip, index) => (
                <li key={index}>{tip[locale]}</li>
              ))}
            </ol>
          </section>

          {resourcesByKind(market).map((group) => (
            <section key={group.kind} className="mt-6">
              <h2 className="text-sm font-semibold">
                {t[`kind_${group.kind}`]} <span className="font-mono text-xs font-normal text-faint">{group.items.length}</span>
              </h2>
              <ul className="mt-2 grid gap-3 lg:grid-cols-2">
                {group.items.map((item) => {
                  const chat = group.kind === "telegram" ? parseChatInput(item.url) : null;
                  return (
                    <li key={item.url} className="flex flex-col rounded-xl border border-line bg-surface px-4 py-3">
                      <span className="flex flex-wrap items-center gap-2">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-blue-soft hover:underline"
                        >
                          {item.name} ↗
                        </a>
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] ${COST_TONE[item.cost]}`}>
                          {t[`cost_${item.cost}`]}
                        </span>
                      </span>
                      <span className="mt-1 break-all font-mono text-[11px] text-faint">{item.url.replace(/^https?:\/\/(www\.)?/, "")}</span>
                      <span className="mt-2 text-sm leading-relaxed">{item.what[locale]}</span>
                      <span className="mt-1 text-sm leading-relaxed text-muted">
                        <span className="text-faint">{t.how}</span> {item.how[locale]}
                      </span>
                      {chat ? (
                        <form action={addScoutChatAction} className="mt-3" title={t.toScoutHint}>
                          <input type="hidden" name="chat" value={item.url} />
                          <input type="hidden" name="note" value={`${market.name.ru}: ${item.name}`.slice(0, 200)} />
                          <input type="hidden" name="back" value={back} />
                          <SubmitButton base="rounded-lg px-3 py-1 text-xs" tone="quiet">
                            {t.toScout}
                          </SubmitButton>
                        </form>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          <p className="mt-8 max-w-2xl text-xs leading-relaxed text-faint">{t.checked}</p>
        </>
      )}
    </AdminShell>
  );
}
