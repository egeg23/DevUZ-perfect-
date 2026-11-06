import Link from "next/link";

import { PRIORITY_TONE } from "@/components/admin/market-tone";
import { AdminShell } from "@/components/admin/shell";
import { marketsDict } from "@/content/admin-panel/markets";
import { MARKETS, type MarketPriority } from "@/content/markets";
import { requireSection } from "@/lib/admin/guard";
import { pick } from "@/lib/admin/i18n";

export const dynamic = "force-dynamic";

const ORDER: readonly MarketPriority[] = ["high", "mid", "low"];

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
  const locale = staff.panel_locale;
  const t = pick(marketsDict, locale);
  const markets = [...MARKETS].sort((a, b) => ORDER.indexOf(a.priority) - ORDER.indexOf(b.priority));

  return (
    <AdminShell staff={staff}>
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
    </AdminShell>
  );
}
