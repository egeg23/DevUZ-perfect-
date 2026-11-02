import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BoxCutaway } from "@/components/box/cutaway";
import { BoxRoadmap } from "@/components/box/roadmap";
import { BoxWaitlist } from "@/components/box/waitlist";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { BOX_IMG, BOX_NAME, BOX_OS, BOX_OS_SCREENS, BOX_PATH, BOX_SHOTS, named } from "@/content/box";
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

/**
 * Иконки направлений: по одной на карточку, тем же порядком, что
 * `box.scenarios.items` в словаре (14 штук; владелец, 02.11.2026: «Почему
 * задач 6?) Там же и видео генерировать можно… пишет код и тд»).
 */
const ICONS = [
  <path key="chat" d="M4 5h16v10H9l-5 4z" />,
  <path key="crm" d="M4 6h16v12H4zM4 10h16M9 14h3" />,
  <path key="call" d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />,
  <path key="mic" d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM6 11a6 6 0 0 0 12 0M12 17v4M9 21h6" />,
  <path key="doc" d="M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6" />,
  <path key="photo" d="M4 6h16v12H4zM8 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM4 16l5-4 3 2.5 3-3.5 5 5" />,
  <path key="video" d="M4 7h11v10H4zM15 10l5-3v10l-5-3" />,
  <path key="music" d="M9 18V6l10-2v12M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM19 16a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />,
  <path key="cube" d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5" />,
  <path key="code" d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14" />,
  <path key="agent" d="M12 3v3M8 6h8a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3zM9 12h.01M15 12h.01M4 11v4M20 11v4" />,
  <path key="camera" d="M3 8l12-3v14L3 16zM15 10l6-2v8l-6-2M7 12h.01" />,
  <path key="pack" d="M4 7l8-4 8 4v10l-8 4-8-4zM4 7l8 4 8-4M12 11v10" />,
  <path key="shield" d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4" />,
];

const MODEL_KEYS = ["lite", "pro", "premium", "jarvis"] as const;
const MODEL_ROWS = ["memory", "core", "speed", "seats", "calls", "media", "code", "voice"] as const;

/** Экран системы: кадр 1344×752, `-s` 800 px. Режет scripts/box/assets.py. */
const OS_SHOT = { w: 1344, h: 752 } as const;

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
            <p className="mt-5 max-w-xl text-[0.98rem] leading-relaxed text-white/80 md:text-[1.05rem]">{named(copy.promo.lead)}</p>
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

      {/* Система внутри: четыре дела и экраны-концепты. */}
      <section id="how" aria-labelledby="box-os-title" className="border-b border-line py-20 md:py-28">
        <Container>
          <SectionHeading kicker={named(copy.os.kicker)} title={copy.os.title} description={named(copy.os.lead)} />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {copy.os.pillars.map((item, i) => (
              <Reveal key={item.t} delay={i * 80}>
                <article className="box-glass box-card h-full rounded-2xl p-6">
                  <span className="font-mono text-[0.7rem] text-green">0{i + 1}</span>
                  <h3 id={i === 0 ? "box-os-title" : undefined} className="mt-3 text-[1.05rem] font-semibold leading-snug text-white">
                    {item.t}
                  </h3>
                  <p className="mt-2 text-[0.92rem] leading-relaxed text-muted">{item.d}</p>
                </article>
              </Reveal>
            ))}
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-6">
            {BOX_OS_SCREENS.map((key, i) => {
              const screen = copy.os.screens[i];
              const wide = i === 0;
              return (
                <Reveal key={key} delay={100 + i * 90} className={wide ? "md:col-span-6" : "md:col-span-2"}>
                  <figure className="box-glass box-card overflow-hidden rounded-2xl p-2 md:p-3">
                    <div className="relative overflow-hidden rounded-xl bg-ink/70" style={{ aspectRatio: `${OS_SHOT.w} / ${OS_SHOT.h}` }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`${BOX_IMG}/os-${key}-s.webp`}
                        srcSet={`${BOX_IMG}/os-${key}-s.webp 800w, ${BOX_IMG}/os-${key}.webp ${OS_SHOT.w}w`}
                        sizes={wide ? "(max-width: 767px) 92vw, 1200px" : "(max-width: 767px) 92vw, 400px"}
                        alt={`${BOX_OS}: ${screen.t}`}
                        width={OS_SHOT.w}
                        height={OS_SHOT.h}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </div>
                    <figcaption className="px-2 pb-2 pt-4 md:px-3">
                      <span className="block text-[0.98rem] font-semibold text-white">{screen.t}</span>
                      <span className="mt-1 block text-[0.86rem] leading-snug text-muted">{screen.d}</span>
                    </figcaption>
                  </figure>
                </Reveal>
              );
            })}
          </div>

          <Reveal delay={200}>
            <p className="mt-8 max-w-2xl text-[0.92rem] leading-relaxed text-white/75">{named(copy.os.core)}</p>
            <p className="mt-3 text-[0.78rem] leading-snug text-faint">{copy.os.concept}</p>
          </Reveal>
        </Container>
      </section>

      {/* Четырнадцать направлений. */}
      <section id="features" className="box-dark border-b border-line py-20 md:py-28">
        <Container>
          <SectionHeading kicker={copy.scenarios.kicker} title={copy.scenarios.title} description={copy.scenarios.lead} />
          <p className="mt-6 font-mono text-[0.72rem] uppercase tracking-[0.2em] text-muted">
            <span className="text-green">{copy.scenarios.items.length}</span> {copy.scenarios.count}
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {copy.scenarios.items.map((item, i) => (
              <Reveal key={item.t} delay={(i % 4) * 70}>
                <article className="box-glass box-card h-full rounded-2xl p-5 md:p-6">
                  <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-xl border border-green/30 bg-green/10 text-green">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      {ICONS[i] ?? ICONS[0]}
                    </svg>
                  </span>
                  <h3 className="mt-4 text-[1.02rem] font-semibold leading-snug text-white">{item.t}</h3>
                  <p className="mt-2 text-[0.9rem] leading-relaxed text-muted">{item.d}</p>
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
      <section id="models" className="border-b border-line py-20 md:py-28">
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
                        <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(ellipse_at_center,rgb(59_130_246_/_0.25),transparent_70%)] font-display text-[1.4rem] font-extrabold tracking-tight text-white/70">
                          {item.name}
                        </div>
                      )}
                      {pilot ? (
                        <span className="absolute left-3 top-3 rounded-full bg-green px-2.5 py-1 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-ink">{copy.models.pilot}</span>
                      ) : null}
                    </div>
                    <h3 className="mt-5 font-display text-[1.5rem] font-extrabold tracking-tight text-white">{item.name}</h3>
                    <p className="mt-1 text-[0.9rem] text-muted">{item.who}</p>
                    <dl className="mt-5 space-y-3 border-t border-white/10 pt-5 text-[0.88rem]">
                      {MODEL_ROWS.map((row) => (
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
      <section id="safety" className="box-dark border-b border-line py-20 md:py-28">
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
      <section id="roadmap" className="border-b border-line py-20 md:py-28">
        <Container>
          <SectionHeading kicker={copy.roadmap.kicker} title={copy.roadmap.title} description={copy.roadmap.lead} />
          <BoxRoadmap dict={dict} />
        </Container>
      </section>

      {/* Вопросы и ответы. */}
      <section id="faq" className="box-dark border-b border-line py-20 md:py-28">
        <Container>
          <SectionHeading kicker={copy.faq.kicker} title={copy.faq.title} />
          <div className="mt-10 max-w-3xl">
            {copy.faq.items.map((item, i) => (
              <Reveal key={item.q} delay={i * 50}>
                <details className="group border-b border-line py-5">
                  <summary className="flex cursor-pointer list-none items-center gap-4 text-[1.02rem] font-medium marker:hidden">
                    <span className="flex-1">{named(item.q)}</span>
                    <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line text-green transition-transform duration-300 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-4 max-w-2xl text-[0.94rem] leading-relaxed text-muted">{named(item.a)}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Лист ожидания. */}
      <section id="waitlist" className="py-20 md:py-28">
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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdGraph(faqSchema(copy.faq.items.map((item) => ({ q: named(item.q), a: named(item.a) })))) }}
      />
    </div>
  );
}
