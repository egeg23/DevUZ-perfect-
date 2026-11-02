import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BoxCutaway } from "@/components/box/cutaway";
import { BoxRoadmap } from "@/components/box/roadmap";
import { BoxWaitlist } from "@/components/box/waitlist";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { BOX_IMG, BOX_NAME, BOX_PATH, BOX_SHOTS, named } from "@/content/box";
import { getDictionary } from "@/content/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n";
import { faqSchema, jsonLdGraph } from "@/lib/schema";
import { absoluteUrl, buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return buildMetadata({
    locale,
    path: BOX_PATH,
    title: named(dict.box.seo.title),
    description: named(dict.box.seo.description),
    ogImage: absoluteUrl(`${BOX_IMG}/og.jpg`),
  });
}

/** Иконки сценариев: по одной на карточку, тем же порядком, что в словаре. */
const ICONS = [
  <path key="chat" d="M4 5h16v10H9l-5 4z" />,
  <path key="doc" d="M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6" />,
  <path key="search" d="M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM20 20l-4.6-4.6" />,
  <path key="team" d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM3 20a5 5 0 0 1 10 0M13.5 20a4 4 0 0 1 7.5-2" />,
  <path key="mic" d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM6 11a6 6 0 0 0 12 0M12 17v4M9 21h6" />,
  <path key="chart" d="M4 20h16M7 16v-5M12 16V7M17 16v-8" />,
];

const MODEL_KEYS = ["lite", "pro", "premium", "jarvis"] as const;

export default async function BoxPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dict = getDictionary(locale);
  const copy = dict.box;

  return (
    <div className="box-page">
      {/* Первый экран: коробки на всю ширину, текст на стекле. */}
      <section aria-labelledby="box-promo-title" className="relative flex min-h-svh items-end overflow-hidden border-b border-line">
        <picture>
          <source media="(max-width: 767px)" srcSet={`${BOX_IMG}/trio-s.webp`} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${BOX_IMG}/trio.webp`}
            alt={named(copy.promo.alt)}
            width={2400}
            height={1355}
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-[62%_center] md:object-center"
          />
        </picture>
        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/10" />
        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/20 to-transparent" />
        <Container className="relative pb-14 pt-32 md:pb-24 md:pt-40">
          <div className="box-glass max-w-2xl rounded-3xl p-6 sm:p-8 md:p-10">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-green">
              {"// "}
              {copy.promo.kicker}
            </p>
            <p className="mt-3 font-display text-[1.1rem] font-bold tracking-tight text-white/85">{BOX_NAME}</p>
            <h1 id="box-promo-title" className="mt-2 font-display text-[clamp(1.9rem,4.6vw,3.4rem)] font-extrabold leading-[1.02] tracking-tight text-white">
              {copy.promo.title}
            </h1>
            <p className="mt-5 max-w-xl text-[0.98rem] leading-relaxed text-white/80 md:text-[1.05rem]">{copy.promo.lead}</p>
            <p className="mt-5 inline-flex items-center gap-2.5 rounded-full border border-green/35 bg-green/10 px-3.5 py-1.5 text-[0.84rem] font-medium text-green">
              <span aria-hidden="true" className="box-badge-dot inline-block h-2 w-2 rounded-full bg-green" />
              {copy.promo.launch}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a href="#waitlist" className="box-cta inline-flex items-center gap-2 rounded-full px-6 py-3 text-[0.95rem] font-semibold text-ink transition active:scale-[0.98]">
                {copy.promo.wait}
              </a>
              <a href="#how" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-[0.95rem] font-semibold text-white transition hover:border-white/50">
                {copy.promo.how} ↓
              </a>
            </div>
            <p className="mt-6 text-[0.78rem] leading-snug text-white/55">{copy.promo.honest}</p>
          </div>
        </Container>
      </section>

      {/* В разрезе. */}
      <div className="box-dark border-b border-line pt-20 md:pt-28">
        <Container>
          <SectionHeading kicker={copy.cut.kicker} title={copy.cut.title} description={copy.cut.lead} />
        </Container>
        <BoxCutaway dict={dict} />
      </div>

      {/* Что внутри и что умеет. */}
      <section id="how" className="border-b border-line py-20 md:py-28">
        <Container>
          <SectionHeading kicker={copy.scenarios.kicker} title={copy.scenarios.title} description={copy.scenarios.lead} />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {copy.scenarios.items.map((item, i) => (
              <Reveal key={item.t} delay={i * 70}>
                <article className="box-glass box-card h-full rounded-2xl p-6">
                  <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-xl border border-green/30 bg-green/10 text-green">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      {ICONS[i]}
                    </svg>
                  </span>
                  <h3 className="mt-4 text-[1.05rem] font-semibold leading-snug text-white">{item.t}</h3>
                  <p className="mt-2 text-[0.92rem] leading-relaxed text-muted">{item.d}</p>
                </article>
              </Reveal>
            ))}
          </div>
          <Reveal delay={200}>
            <p className="mt-8 max-w-2xl text-[0.9rem] leading-relaxed text-faint">{copy.scenarios.note}</p>
          </Reveal>
        </Container>
      </section>

      {/* Четыре модели. */}
      <section id="models" className="box-dark border-b border-line py-20 md:py-28">
        <Container>
          <SectionHeading kicker={copy.models.kicker} title={copy.models.title} description={copy.models.lead} />
          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {copy.models.items.map((item, i) => {
              const key = MODEL_KEYS[i];
              const shot = key === "premium" ? null : BOX_SHOTS[key];
              const pilot = key === "pro";
              return (
                <Reveal key={item.name} delay={i * 90}>
                  <article className={`box-glass box-card flex h-full flex-col rounded-2xl p-5 ${pilot ? "box-pilot" : ""}`}>
                    <div className="relative overflow-hidden rounded-xl bg-ink/60" style={{ aspectRatio: "3 / 2" }}>
                      {shot ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`${BOX_IMG}/${key}-s.webp`}
                          srcSet={`${BOX_IMG}/${key}-s.webp 660w, ${BOX_IMG}/${key}.webp ${shot.w}w`}
                          sizes="(max-width: 767px) 92vw, 320px"
                          alt={`${BOX_NAME} ${item.name}`}
                          width={shot.w}
                          height={shot.h}
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(ellipse_at_center,rgb(59_130_246_/_0.25),transparent_70%)] font-mono text-[0.78rem] uppercase tracking-[0.25em] text-white/60">
                          NVIDIA GB10
                        </div>
                      )}
                      {pilot ? (
                        <span className="absolute left-3 top-3 rounded-full bg-green px-2.5 py-1 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-ink">{copy.models.pilot}</span>
                      ) : null}
                    </div>
                    <h3 className="mt-5 font-display text-[1.5rem] font-extrabold tracking-tight text-white">{item.name}</h3>
                    <p className="mt-1 text-[0.9rem] text-muted">{item.who}</p>
                    <dl className="mt-5 space-y-3 border-t border-white/10 pt-5 text-[0.88rem]">
                      {(["cpu", "memory", "runs", "speed", "bandwidth"] as const).map((row) => (
                        <div key={row}>
                          <dt className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-faint">{copy.models.rows[row]}</dt>
                          <dd className="mt-0.5 leading-snug text-white/85">{item[row]}</dd>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-auto pt-6 text-[0.84rem] font-medium text-gold">{copy.models.price}</p>
                  </article>
                </Reveal>
              );
            })}
          </div>
          <Reveal delay={200}>
            <p className="mt-8 max-w-3xl text-[0.84rem] leading-relaxed text-faint">{copy.models.source}</p>
          </Reveal>
        </Container>
      </section>

      {/* Данные не уходят из офиса. */}
      <section id="safety" className="border-b border-line py-20 md:py-28">
        <Container>
          <SectionHeading kicker={copy.safety.kicker} title={copy.safety.title} />
          <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-5">
            {copy.safety.items.map((item, i) => (
              <Reveal as="li" key={item.t} delay={i * 80} className="bg-surface p-6">
                <span className="font-mono text-[0.7rem] text-green">0{i + 1}</span>
                <h3 className="mt-3 text-[1rem] font-semibold leading-snug text-white">{item.t}</h3>
                <p className="mt-2 text-[0.88rem] leading-relaxed text-muted">{item.d}</p>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      {/* Роадмап. */}
      <section id="roadmap" className="box-dark border-b border-line py-20 md:py-28">
        <Container>
          <SectionHeading kicker={copy.roadmap.kicker} title={copy.roadmap.title} description={copy.roadmap.lead} />
          <BoxRoadmap dict={dict} />
        </Container>
      </section>

      {/* Вопросы и ответы. */}
      <section id="faq" className="border-b border-line py-20 md:py-28">
        <Container>
          <SectionHeading kicker={copy.faq.kicker} title={copy.faq.title} />
          <div className="mt-10 max-w-3xl">
            {copy.faq.items.map((item, i) => (
              <Reveal key={item.q} delay={i * 50}>
                <details className="group border-b border-line py-5">
                  <summary className="flex cursor-pointer list-none items-center gap-4 text-[1.02rem] font-medium marker:hidden">
                    <span className="flex-1">{item.q}</span>
                    <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line text-green transition-transform duration-300 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-4 max-w-2xl text-[0.94rem] leading-relaxed text-muted">{item.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Лист ожидания. */}
      <section id="waitlist" className="box-dark py-20 md:py-28">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
            <SectionHeading kicker={copy.waitlist.kicker} title={copy.waitlist.title} description={copy.waitlist.lead} />
            <Reveal delay={120}>
              <div className="box-glass rounded-3xl p-6 sm:p-8">
                <BoxWaitlist locale={locale} dict={dict} />
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdGraph(faqSchema(copy.faq.items)) }} />
    </div>
  );
}
