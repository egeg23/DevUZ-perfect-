import Link from "next/link";

import { addScoutChatAction } from "@/app/admin/scout/actions";
import { PRIORITY_TONE } from "@/components/admin/market-tone";
import { SubmitButton } from "@/components/admin/submit-button";
import { marketsDict } from "@/content/admin-panel/markets";
import { MARKETS, marketOf, resourcesByKind, type MarketPriority, type ResourceCost } from "@/content/markets";
import { pick, type PanelLocale } from "@/lib/admin/i18n";
import { parseChatInput } from "@/lib/scout/extra-chats";

const ORDER: readonly MarketPriority[] = ["high", "mid", "low"];

const COST_TONE: Record<ResourceCost, string> = {
  free: "border-green/40 bg-green/10 text-green",
  freemium: "border-line bg-surface-2 text-muted",
  paid: "border-gold/30 bg-gold/10 text-gold",
};

/** Ответ «Скауту» (app/admin/scout/actions.ts → ?g=). */
const SCOUT_RESULT = { added: "scoutAdded", exists: "scoutExists", bad: "scoutFailed", failed: "scoutFailed" } as const;

/** Список стран: главные рынки первыми. */
export function MarketsIndex({ locale }: { locale: PanelLocale }) {
  const t = pick(marketsDict, locale);
  const markets = [...MARKETS].sort((a, b) => ORDER.indexOf(a.priority) - ORDER.indexOf(b.priority));
  return (
    <>

      <h1 className="text-lg font-semibold">{t.title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{t.lead}</p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {markets.map((market) => (
          <li key={market.slug}>
            <Link
              href={`/admin/markets/${market.slug}`}
              className="flex h-full flex-col rounded-xl border border-line bg-surface px-5 py-4 transition hover:border-green/40"
            >
              <span className="flex items-center gap-3">
                <span className="text-3xl leading-none" aria-hidden>
                  {market.flag}
                </span>
                <span className="text-base font-semibold">{market.name[locale]}</span>
                <span className={`ml-auto rounded-full border px-2 py-0.5 text-xs ${PRIORITY_TONE[market.priority]}`}>
                  {t[`priority_${market.priority}`]}
                </span>
              </span>
              <span className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{market.why[locale]}</span>
              <span className="mt-auto flex items-center justify-between pt-3 text-xs">
                <span className="text-faint">{t.places(market.resources.length)}</span>
                <span className="text-green">{t.open}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-8 max-w-2xl text-xs leading-relaxed text-faint">{t.checked}</p>
    </>
  );
}

/**
 * Страница страны: как там ищут разработчика, с чего начать и площадки по
 * видам. У Telegram-чата — «Скауту»: группа уходит в «Группы для скаута».
 */
export function MarketView({ slug, locale, result: g }: { slug: string; locale: PanelLocale; result?: string }) {
  const t = pick(marketsDict, locale);
  const market = marketOf(slug);
  const back = `/admin/markets/${slug}`;
  const result = g && g in SCOUT_RESULT ? SCOUT_RESULT[g as keyof typeof SCOUT_RESULT] : null;
  return (
    <>

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
    </>
  );
}
