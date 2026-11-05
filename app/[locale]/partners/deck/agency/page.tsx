import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Deck, Slide, SlideTitle, usd } from "@/components/partners/deck";
import { agencyDeckCopy } from "@/content/agency-deck";
import { company } from "@/content/company";
import { deckCopy } from "@/content/partner-decks";
import { services } from "@/content/services";
import { isLocale, localeHref } from "@/lib/i18n";
import { AGENCY_PERCENT, LIFETIME_BONUS, LIFETIME_FROM_USD, botLink, codeFromQuery } from "@/lib/partners/rules";
import { buildMetadata } from "@/lib/seo";

/**
 * Презентация для агентств — «чтобы понял даже ребёнок» (владелец,
 * 05.11.2026): одна большая цифра, три шага, пример с полосками, четыре
 * правила, что можно приводить, и куда писать.
 *
 * Только то, что получает агентство. Процент того, кто из команды привёл
 * агентство, на клиентском сайте не пишем («На клиентском сайте % менеджера
 * не пишем, а на дашборде пишем все») — он во вкладке «Агентства» панели.
 *
 * Ставка и суммы примера — из AGENCY_PERCENT, по которому считаются деньги;
 * «с 50 000 $ — 20% навсегда» — из LIFETIME_FROM_USD и LIFETIME_BONUS (владелец,
 * 05.11.2026), итоговой ставкой: «+5%» на сайте не пишем.
 * Ссылка с `?ref=КОД` ставит куку агентства (middleware), и кнопка Telegram
 * ведёт в бота с тем же кодом.
 */

export const dynamic = "force-dynamic";

/** Три проекта примера: небольшой сайт, магазин, крупный проект. */
const EXAMPLE = [1_000, 3_000, 10_000];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = agencyDeckCopy(locale);
  return buildMetadata({
    locale,
    path: "partners/deck/agency",
    title: `${t.title} — ${company.name}`,
    description: t.lead,
    noIndex: true,
  });
}

export default async function AgencyDeck({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ref = codeFromQuery((await searchParams).ref);
  const d = deckCopy(locale);
  const t = agencyDeckCopy(locale);
  const bot = ref ? botLink(company.telegram, ref) : company.telegramUrl;
  const max = Math.max(...EXAMPLE);
  const example = EXAMPLE.map((amount) => ({ amount, share: Math.round((amount * AGENCY_PERCENT) / 100) }));

  return (
    <Deck kicker={t.kicker} pdf={d.pdf} pdfHint={d.pdfHint}>
      <Slide accent>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-green">{company.name}</p>
        <div className="mt-4 grid items-center gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">{t.title}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">{t.lead}</p>
          </div>
          <div className="text-center lg:text-right">
            <p className="font-display text-8xl font-semibold leading-none text-green sm:text-9xl">{AGENCY_PERCENT}%</p>
            <p className="mt-3 max-w-[16rem] text-sm leading-snug text-muted lg:ml-auto">{t.bigLabel}</p>
            <p className="mt-4 inline-block max-w-[18rem] rounded-xl border border-green/40 bg-green/[0.08] px-4 py-2 text-sm font-medium leading-snug text-green lg:ml-auto">
              {t.lifetime(usd(locale, LIFETIME_FROM_USD), AGENCY_PERCENT + LIFETIME_BONUS)}
            </p>
          </div>
        </div>
      </Slide>

      <Slide>
        <SlideTitle>{t.stepsTitle}</SlideTitle>
        <ol className="mt-8 grid gap-4 lg:grid-cols-3">
          {t.steps.map((step, i) => (
            <li
              key={step.title}
              className={`relative rounded-2xl border px-6 py-6 ${i === 2 ? "border-green/40 bg-green/[0.06]" : "border-white/12"}`}
            >
              <span
                className={`flex size-12 items-center justify-center rounded-full font-display text-2xl font-semibold ${
                  i === 2 ? "bg-green text-ink" : "bg-white/10 text-text"
                }`}
                aria-hidden
              >
                {i + 1}
              </span>
              <p className="mt-4 font-display text-xl font-semibold">{step.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </Slide>

      <Slide>
        <SlideTitle>{t.exampleTitle}</SlideTitle>
        <p className="mt-3 text-muted">{t.exampleLead}</p>
        <ul className="mt-8 flex flex-col gap-6">
          {example.map((e) => (
            <li key={e.amount}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm text-muted">
                  {t.project} <span className="font-display text-lg font-semibold text-text">{usd(locale, e.amount)}</span>
                </span>
                <span className="text-sm text-muted">
                  {t.you} <span className="font-display text-3xl font-semibold text-green">{usd(locale, e.share)}</span>
                </span>
              </div>
              {/* Полоска — сумма проекта, зелёная часть — ваши 15%. */}
              <div className="mt-2 h-4 overflow-hidden rounded-full bg-white/10" style={{ width: `${Math.max(18, (e.amount / max) * 100)}%` }}>
                <div className="h-full rounded-full bg-green" style={{ width: `${AGENCY_PERCENT}%` }} />
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-8 max-w-3xl text-sm leading-relaxed text-faint">{t.exampleNote}</p>
      </Slide>

      <Slide>
        <SlideTitle>{t.rulesTitle}</SlideTitle>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {t.rules.map((line, i) => (
            <li key={line} className="flex gap-4 rounded-xl border border-white/12 px-5 py-4 text-base leading-relaxed">
              <span className="font-display text-xl font-semibold text-green" aria-hidden>
                {i + 1}
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex gap-4 rounded-xl border border-green/40 bg-green/[0.06] px-5 py-4 text-base font-medium leading-relaxed text-green">
          <span className="font-display text-xl font-semibold" aria-hidden>
            {AGENCY_PERCENT + LIFETIME_BONUS}%
          </span>
          <span>{t.lifetime(usd(locale, LIFETIME_FROM_USD), AGENCY_PERCENT + LIFETIME_BONUS)}</span>
        </p>
      </Slide>

      <Slide>
        <SlideTitle>{t.servicesTitle}</SlideTitle>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <li key={s.slug} className="rounded-xl border border-white/12 px-5 py-4">
              <p className="font-display text-lg font-semibold">{s.title[locale]}</p>
              <p className="mt-1 text-sm leading-snug text-muted">{s.tagline[locale]}</p>
              <p className="mt-3 text-sm text-green">{t.from(usd(locale, s.priceFromUsd))}</p>
            </li>
          ))}
        </ul>
      </Slide>

      <Slide accent>
        <SlideTitle>{t.ctaTitle}</SlideTitle>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{t.ctaText}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={bot} className="rounded-xl bg-green px-7 py-4 font-semibold text-ink transition-colors hover:bg-white">
            {t.ctaBot}
          </a>
          <a
            href={localeHref(locale, ref ? `partners/deck/studio?ref=${ref}` : "partners/deck/studio")}
            className="rounded-xl border border-white/20 px-7 py-4 font-semibold transition-colors hover:border-green/60 hover:text-green"
          >
            {t.ctaStudio}
          </a>
        </div>
        <p className="mt-8 text-sm text-faint">devuz.studio · t.me/{company.telegram}</p>
      </Slide>
    </Deck>
  );
}
