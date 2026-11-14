import Link from "next/link";

import { CaseCard } from "@/components/sections/cases";
import { ClientsSection } from "@/components/sections/clients";
import { ContactSection } from "@/components/sections/contact";
import { Container } from "@/components/ui/container";
import { Icon } from "@/components/ui/icon";
import { Reveal } from "@/components/ui/reveal";
import { caseBySlug } from "@/content/cases";
import { proof } from "@/content/company";
import type { Dictionary } from "@/content/dictionaries";
import { LANDING_TEXT, landingBySlug, type LandingMeta } from "@/content/service-landings";
import { calcPrice, landingText, weeksRange } from "@/content/service-landings/fill";
import { formatUsd, formatUzs } from "@/lib/calculator";
import { localeHref, type Locale } from "@/lib/i18n";

/**
 * Страница под поисковый запрос (content/service-landings): цена и срок из
 * калькулятора, виды работ с ценами, состав, этапы с днями, таблица цен,
 * местное, сравнение, кейсы, вопросы, соседние страницы, офис, заявка.
 * Разметку Schema.org кладёт сама страница маршрута.
 */
export function ServiceLanding({ meta, locale, dict }: { meta: LandingMeta; locale: Locale; dict: Dictionary }) {
  const ui = LANDING_TEXT[locale].ui;
  const text = landingText(meta, locale);
  const price = calcPrice(meta.calc);
  const caseItems = meta.cases.map(caseBySlug).filter((c) => c !== undefined);
  const mockupHref = `${localeHref(locale, "")}#maket`;

  return (
    <>
      <Container className="pt-36">
        <nav aria-label="breadcrumb" className="font-mono text-[0.72rem] text-faint">
          <Link href={localeHref(locale, "services")} className="hover:text-green">
            {ui.breadcrumb}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-muted">{text.title}</span>
        </nav>

        <div className="mt-8 flex items-start gap-5">
          <span className="mt-1 hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-green/25 bg-green/10 text-green sm:flex">
            <Icon name={meta.icon} className="h-6 w-6" />
          </span>
          <h1 className="text-[clamp(1.9rem,4.6vw,3.3rem)] font-extrabold leading-[1.08]">{text.h1}</h1>
        </div>

        <p className="mt-7 max-w-3xl text-[1.04rem] leading-relaxed text-muted">{text.lead}</p>

        <div className="mt-9 grid gap-4 rounded-2xl border border-line bg-surface px-6 py-6 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-faint">{ui.from}</p>
            <p className="mt-1.5 font-display text-2xl font-bold text-green">{formatUzs(price.uzs, locale)}</p>
            <p className="text-[0.85rem] text-faint">≈ {formatUsd(price.uzs)}</p>
          </div>
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-faint">{ui.weeks}</p>
            <p className="mt-1.5 font-display text-2xl font-bold">
              {weeksRange(price)} <span className="text-base font-normal text-muted">{ui.weeksUnit}</span>
            </p>
          </div>
          <div>
            <p className="font-display text-2xl font-bold">{proof.projects}+</p>
            <p className="text-[0.85rem] text-faint">{ui.facts.projects}</p>
          </div>
          <div>
            <p className="font-display text-2xl font-bold">{proof.staff}</p>
            <p className="text-[0.85rem] text-faint">{ui.facts.staff}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={mockupHref}
            className="rounded-xl bg-green px-6 py-3.5 font-semibold text-bg transition-opacity hover:opacity-90"
          >
            {ui.mockupCta}
          </Link>
          <Link
            href="#contact"
            data-goal="cta_contact"
            className="rounded-xl border border-line px-6 py-3.5 font-semibold transition-colors hover:border-green/40"
          >
            {ui.talkCta}
          </Link>
        </div>
      </Container>

      <ClientsSection dict={dict} />

      <Container>
        <section className="mt-16">
          <h2 className="text-[clamp(1.5rem,3vw,2.1rem)] font-bold">{ui.kindsTitle}</h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {text.kinds.map((kind, i) => {
              const p = calcPrice(meta.kinds[i]?.calc ?? meta.calc);
              return (
                <Reveal key={kind.title} delay={i * 60} className="h-full">
                  <article className="flex h-full flex-col rounded-2xl border border-line bg-surface px-6 py-6">
                    <h3 className="text-lg font-bold">{kind.title}</h3>
                    <p className="mt-2 flex-1 text-[0.94rem] leading-relaxed text-muted">{kind.text}</p>
                    <p className="mt-5 font-display text-xl font-bold text-green">
                      {ui.from.toLowerCase()} {formatUzs(p.uzs, locale)}
                    </p>
                    <p className="text-[0.82rem] text-faint">
                      ≈ {formatUsd(p.uzs)} · {weeksRange(p)} {ui.weeksUnit}
                    </p>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </section>

        <section className="mt-16 rounded-3xl border border-green/25 bg-green/[0.06] px-6 py-8 sm:px-10">
          <h2 className="text-[clamp(1.4rem,2.8vw,1.9rem)] font-bold">{ui.mockupTitle}</h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted">{ui.mockupText}</p>
          <Link
            href={mockupHref}
            className="mt-6 inline-block rounded-xl bg-green px-6 py-3.5 font-semibold text-bg transition-opacity hover:opacity-90"
          >
            {ui.mockupCta}
          </Link>
        </section>

        <section className="mt-16">
          <h2 className="text-[clamp(1.5rem,3vw,2.1rem)] font-bold">{ui.includedTitle}</h2>
          <ul className="mt-7 grid gap-3 sm:grid-cols-2">
            {text.included.map((item) => (
              <li key={item} className="flex gap-3 rounded-xl border border-line bg-surface px-5 py-4">
                <span aria-hidden="true" className="mt-0.5 text-green">
                  ✓
                </span>
                <span className="text-[0.94rem] leading-relaxed text-muted">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16">
          <h2 className="text-[clamp(1.5rem,3vw,2.1rem)] font-bold">{ui.stepsTitle}</h2>
          <ol className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {text.steps.map((step, i) => (
              <li key={step.title} className="rounded-2xl border border-line bg-surface px-6 py-6">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-[0.72rem] text-green">0{i + 1}</span>
                  <span className="font-mono text-[0.72rem] text-faint">{step.days}</span>
                </div>
                <h3 className="mt-3 text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-[0.92rem] leading-relaxed text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-16">
          <h2 className="text-[clamp(1.5rem,3vw,2.1rem)] font-bold">{ui.pricesTitle}</h2>
          <div className="mt-7 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-[520px] text-left text-[0.92rem]">
              <thead className="bg-surface font-mono text-[0.68rem] uppercase tracking-[0.12em] text-faint">
                <tr>
                  <th className="px-5 py-3.5 font-normal">{ui.colType}</th>
                  <th className="px-5 py-3.5 font-normal">{ui.colPrice}</th>
                  <th className="px-5 py-3.5 font-normal">{ui.colTerm}</th>
                </tr>
              </thead>
              <tbody>
                {text.kinds.map((kind, i) => {
                  const p = calcPrice(meta.kinds[i]?.calc ?? meta.calc);
                  return (
                    <tr key={kind.title} className="border-t border-line">
                      <td className="px-5 py-3.5 font-semibold">{kind.title}</td>
                      <td className="px-5 py-3.5 text-green">
                        {formatUzs(p.uzs, locale)} <span className="text-faint">≈ {formatUsd(p.uzs)}</span>
                      </td>
                      <td className="px-5 py-3.5 text-muted">
                        {weeksRange(p)} {ui.weeksUnit}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-4 max-w-3xl text-[0.88rem] leading-relaxed text-faint">{ui.pricesNote}</p>
        </section>

        <section className="mt-16">
          <h2 className="text-[clamp(1.5rem,3vw,2.1rem)] font-bold">{ui.localTitle}</h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {text.local.map((item) => (
              <div key={item.title} className="rounded-2xl border border-line bg-surface px-6 py-5">
                <h3 className="font-bold">{item.title}</h3>
                <p className="mt-2 text-[0.92rem] leading-relaxed text-muted">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-[clamp(1.5rem,3vw,2.1rem)] font-bold">{ui.compareTitle}</h2>
          <div className="mt-7 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-[680px] text-left text-[0.88rem]">
              <thead className="bg-surface text-[0.8rem]">
                <tr>
                  {ui.compareCols.map((col, i) => (
                    <th key={i} className={i === 1 ? "px-4 py-3.5 text-green" : "px-4 py-3.5 font-normal text-faint"}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ui.compareRows.map((row) => (
                  <tr key={row[0]} className="border-t border-line align-top">
                    {row.map((cell, i) => (
                      <td
                        key={i}
                        className={
                          i === 0 ? "px-4 py-3.5 font-semibold" : i === 1 ? "px-4 py-3.5 text-text" : "px-4 py-3.5 text-muted"
                        }
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {caseItems.length ? (
          <section className="mt-16">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-[clamp(1.5rem,3vw,2.1rem)] font-bold">{ui.casesTitle}</h2>
              <Link href={localeHref(locale, "cases")} className="text-[0.92rem] text-green hover:underline">
                {ui.casesAll} →
              </Link>
            </div>
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {caseItems.map((item, i) => (
                <Reveal key={item.slug} delay={i * 60} className="h-full">
                  <CaseCard item={item} locale={locale} dict={dict} />
                </Reveal>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-16">
          <h2 className="text-[clamp(1.5rem,3vw,2.1rem)] font-bold">{ui.faqTitle}</h2>
          <div className="mt-7 divide-y divide-line rounded-2xl border border-line">
            {text.faq.map((item) => (
              <details key={item.q} className="group px-6 py-5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-semibold">
                  <h3 className="text-[1rem]">{item.q}</h3>
                  <span aria-hidden="true" className="text-green transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-[0.94rem] leading-relaxed text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-surface px-6 py-6">
            <h2 className="text-xl font-bold">{ui.relatedTitle}</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {meta.related.map((slug) => {
                const other = landingBySlug(slug);
                if (!other) return null;
                return (
                  <li key={slug}>
                    <Link
                      href={localeHref(locale, `services/${slug}`)}
                      className="inline-block rounded-xl border border-line px-4 py-2.5 text-[0.88rem] text-muted transition-colors hover:border-green/40 hover:text-text"
                    >
                      {LANDING_TEXT[locale].pages[slug].title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="rounded-2xl border border-line bg-surface px-6 py-6">
            <h2 className="text-xl font-bold">{ui.officeTitle}</h2>
            <p className="mt-3 leading-relaxed text-muted">{ui.officeText}</p>
            <p className="mt-3 text-[0.88rem] text-faint">
              {proof.countries} {ui.facts.countries}
            </p>
          </div>
        </section>
      </Container>

      <ContactSection locale={locale} dict={dict} />
    </>
  );
}
