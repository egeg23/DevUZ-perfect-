import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Deck, Slide, SlideTitle, usd } from "@/components/partners/deck";
import { casesByDate } from "@/content/cases";
import { company, proof } from "@/content/company";
import { deckCopy } from "@/content/partner-decks";
import { services } from "@/content/services";
import { isLocale, localeHref } from "@/lib/i18n";
import { botLink, codeFromQuery } from "@/lib/partners/rules";
import { buildMetadata } from "@/lib/seo";

/**
 * Презентация студии для партнёра — отправить клиенту ссылкой или PDF.
 *
 * Все числа — из тех же мест, что и сайт: штат, проекты и страны из
 * `proof`, цены «от» и сроки из услуг, проекты из кейсов. Ссылка из кабинета
 * несёт `?ref=КОД` — middleware ставит куку партнёра, а кнопка «Написать в
 * Telegram» ведёт в бота с тем же кодом.
 */

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildMetadata({
    locale,
    path: "partners/deck/studio",
    title: `${company.name} — ${deckCopy(locale).studio.kicker}`,
    description: company.description[locale],
    noIndex: true,
  });
}

export default async function StudioDeck({
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
  const t = d.studio;
  const shown = casesByDate.filter((c) => c.slug !== "devuz").slice(0, 6);
  const bot = ref ? botLink(company.telegram, ref) : company.telegramUrl;

  return (
    <Deck kicker={t.kicker} pdf={d.pdf} pdfHint={d.pdfHint}>
      <Slide accent>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-green">{company.name}</p>
        <h1 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-6xl">{company.tagline[locale]}</h1>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted">{company.description[locale]}</p>
      </Slide>

      <Slide>
        <SlideTitle>{t.numbersTitle}</SlideTitle>
        <dl className="mt-8 grid grid-cols-2 gap-6 lg:grid-cols-5">
          {[
            [String(proof.staff), t.numbers.staff],
            [`${proof.projects}+`, t.numbers.projects],
            [String(proof.countries), t.numbers.countries],
            [String(company.foundedYear), t.numbers.since],
            [`×${proof.lift[0]}–${proof.lift[1]}`, t.numbers.lift],
          ].map(([value, label]) => (
            <div key={label}>
              <dt className="font-display text-4xl font-semibold text-green sm:text-5xl">{value}</dt>
              <dd className="mt-2 text-sm leading-snug text-muted">{label}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 max-w-3xl text-xs leading-relaxed text-faint">{t.liftNote}</p>
      </Slide>

      <Slide>
        <SlideTitle>{t.servicesTitle}</SlideTitle>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <li key={s.slug} className="rounded-xl border border-white/12 px-5 py-4">
              <p className="font-display text-lg font-semibold">{s.title[locale]}</p>
              <p className="mt-1 text-sm leading-snug text-muted">{s.tagline[locale]}</p>
              <p className="mt-3 text-sm">
                <span className="text-green">{t.from(usd(locale, s.priceFromUsd))}</span>
                <span className="text-faint"> · {t.weeks(s.weeksFrom, s.weeksTo)}</span>
              </p>
            </li>
          ))}
        </ul>
      </Slide>

      <Slide>
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SlideTitle>{t.languagesTitle}</SlideTitle>
            <ul className="mt-6 flex flex-col gap-3">
              {t.languages.map((line) => (
                <li key={line} className="flex gap-3 text-sm leading-relaxed">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-green" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SlideTitle>{t.howTitle}</SlideTitle>
            <ol className="mt-6 flex flex-col gap-3">
              {t.how.map((line, i) => (
                <li key={line} className="flex gap-3 text-sm leading-relaxed">
                  <span className="font-mono text-green">0{i + 1}</span>
                  <span>{line}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Slide>

      <Slide>
        <SlideTitle>{t.casesTitle}</SlideTitle>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((c) => (
            <li key={c.slug}>
              <a
                href={localeHref(locale, `cases/${c.slug}`)}
                className="block h-full rounded-xl border border-white/12 px-5 py-4 transition-colors hover:border-green/50"
              >
                <p className="font-display text-lg font-semibold">{c.name}</p>
                <p className="mt-1 text-sm leading-snug text-muted">{c.category[locale]}</p>
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-faint">{t.casesMore(proof.projects)}</p>
      </Slide>

      <Slide accent>
        <SlideTitle>{t.ctaTitle}</SlideTitle>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{t.ctaText}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={localeHref(locale, "contact")}
            className="rounded-xl bg-green px-7 py-4 font-semibold text-ink transition-colors hover:bg-white"
          >
            {t.ctaSite}
          </a>
          <a
            href={bot}
            className="rounded-xl border border-white/20 px-7 py-4 font-semibold transition-colors hover:border-green/60 hover:text-green"
          >
            {t.ctaBot}
          </a>
        </div>
        <p className="mt-8 text-sm text-faint">
          devuz.studio · t.me/{company.telegram} · {company.phones[0].display}
        </p>
      </Slide>
    </Deck>
  );
}
