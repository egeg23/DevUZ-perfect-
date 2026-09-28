import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Deck, Slide, SlideTitle, usd } from "@/components/partners/deck";
import { company } from "@/content/company";
import { deckCopy } from "@/content/partner-decks";
import { isLocale, localeHref } from "@/lib/i18n";
import { PARTNER_TIERS, tierPercent } from "@/lib/partners/rules";
import { buildMetadata } from "@/lib/seo";

/**
 * Презентация партнёрской программы — с примером про агентство.
 *
 * Владелец: «презентация реферальной программы, к примеру если партнёр
 * подключит маркетинговое агентство к нам на лидов». Ставки и пример
 * считаются из той же таблицы, по которой считаются деньги
 * (lib/partners/rules.ts): пример в презентации не может разойтись с тем,
 * что потом начислится.
 */

export const dynamic = "force-dynamic";

/** Три заказа агентства в примере — у нижних границ цен «от» по услугам. */
const EXAMPLE = [3_000, 8_000, 15_000];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = deckCopy(locale).program;
  return buildMetadata({
    locale,
    path: "partners/deck/program",
    title: `${t.title} — ${company.name}`,
    description: t.lead,
    noIndex: true,
  });
}

export default async function ProgramDeck({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  // Код партнёра в ссылке (`?ref=`) страницей не читается: куку ставит
  // middleware, и клиент, пришедший отсюда на сайт, засчитается партнёру.
  const d = deckCopy(locale);
  const t = d.program;
  const example = EXAMPLE.map((amount, i) => {
    const percent = tierPercent(amount, "turnover");
    return { name: t.exampleOrders[i] ?? "", amount, percent, share: Math.round((amount * percent) / 100) };
  });
  const total = example.reduce((s, e) => s + e.share, 0);

  return (
    <Deck kicker={t.kicker} pdf={d.pdf} pdfHint={d.pdfHint}>
      <Slide accent>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-green">{company.name}</p>
        <h1 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-6xl">{t.title}</h1>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted">{t.lead}</p>
      </Slide>

      <Slide>
        <SlideTitle>{t.modelsTitle}</SlideTitle>
        <table className="mt-8 w-full max-w-3xl text-base">
          <thead className="text-left text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className="py-2 font-normal">{t.colRange}</th>
              <th className="py-2 text-right font-normal">{t.colProfit}</th>
              <th className="py-2 text-right font-normal">{t.colTurnover}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {PARTNER_TIERS.map((tier, i) => (
              <tr key={tier.profit}>
                <td className="py-3 text-muted">
                  {tier.upTo === null ? t.over(usd(locale, PARTNER_TIERS[i - 1]?.upTo ?? 0)) : t.upTo(usd(locale, tier.upTo))}
                </td>
                <td className="py-3 text-right font-display text-2xl font-semibold text-green">{tier.profit} %</td>
                <td className="py-3 text-right font-display text-2xl font-semibold">{tier.turnover} %</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted">{t.modelsNote}</p>
      </Slide>

      <Slide>
        <SlideTitle>{t.waysTitle}</SlideTitle>
        <ul className="mt-8 grid gap-3 lg:grid-cols-3">
          {t.ways.map((way, i) => (
            <li
              key={way.title}
              className={`rounded-xl border px-5 py-5 ${i === 2 ? "border-green/40 bg-green/[0.06]" : "border-white/12"}`}
            >
              <p className="font-display text-lg font-semibold">{way.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{way.text}</p>
            </li>
          ))}
        </ul>
      </Slide>

      <Slide accent>
        <SlideTitle>{t.agencyTitle}</SlideTitle>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed">{t.agencyText}</p>
      </Slide>

      <Slide>
        <SlideTitle>{t.exampleTitle}</SlideTitle>
        <p className="mt-4 text-muted">{t.exampleLead}</p>
        <table className="mt-6 w-full max-w-3xl text-base">
          <tbody className="divide-y divide-white/10">
            {example.map((e) => (
              <tr key={e.amount}>
                <td className="py-3">{t.exampleOrder(e.name, usd(locale, e.amount))}</td>
                <td className="py-3 text-right text-muted">{e.percent} %</td>
                <td className="py-3 text-right font-display text-xl font-semibold">{usd(locale, e.share)}</td>
              </tr>
            ))}
            <tr>
              <td className="py-4 font-semibold" colSpan={2}>
                {t.exampleTotal}
              </td>
              <td className="py-4 text-right font-display text-3xl font-semibold text-green">{usd(locale, total)}</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-6 max-w-3xl text-xs leading-relaxed text-faint">{t.exampleNote}</p>
      </Slide>

      <Slide>
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SlideTitle>{t.cabinetTitle}</SlideTitle>
            <ul className="mt-6 flex flex-col gap-3">
              {t.cabinet.map((line) => (
                <li key={line} className="flex gap-3 text-sm leading-relaxed">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-green" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SlideTitle>{t.rulesTitle}</SlideTitle>
            <ul className="mt-6 flex flex-col gap-3">
              {t.rules.map((line) => (
                <li key={line} className="flex gap-3 text-sm leading-relaxed text-muted">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-white/40" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Slide>

      <Slide accent>
        <SlideTitle>{t.ctaTitle}</SlideTitle>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={`https://t.me/${company.telegram}?start=cabinet`}
            className="rounded-xl bg-green px-7 py-4 font-semibold text-ink transition-colors hover:bg-white"
          >
            {t.ctaJoin}
          </a>
          <a
            href={localeHref(locale, "partners/cabinet")}
            className="rounded-xl border border-white/20 px-7 py-4 font-semibold transition-colors hover:border-green/60 hover:text-green"
          >
            {t.ctaCabinet}
          </a>
        </div>
        <p className="mt-8 text-sm text-faint">devuz.studio/{locale}/partners · t.me/{company.telegram}</p>
      </Slide>
    </Deck>
  );
}
