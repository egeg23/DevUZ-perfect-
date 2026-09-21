import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContactSection } from "@/components/sections/contact";
import { HeadlineStats } from "@/components/sections/scale";
import { StackSection } from "@/components/sections/stack";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { stats } from "@/content/company";
import { getDictionary } from "@/content/dictionaries";
import { isLocale, t, type Locale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);

  return buildMetadata({
    locale,
    path: "about",
    title: dict.seo.about.title,
    description: dict.seo.about.description,
  });
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dict = getDictionary(locale);

  return (
    <>
      <Container className="pt-36">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.3em] text-green">
          {"// "}{dict.about.kicker}
        </p>
        <h1 className="mt-4 max-w-3xl text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold leading-[1.06]">
          {dict.about.title}
        </h1>
        <p className="mt-6 max-w-2xl text-[1.08rem] leading-relaxed text-muted">
          {dict.about.lead}
        </p>

        <HeadlineStats locale={locale} className="mt-14" />

        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat, i) => (
            <Reveal key={t(stat.label, locale)} delay={i * 60}>
              {/* Термин перед определением — как и в HeadlineStats.
                  Показ переворачивается стилем, разметка остаётся правильной. */}
              <div className="flex flex-col-reverse gap-3 rounded-2xl border border-line bg-surface px-6 py-6">
                <dt className="text-[0.82rem] leading-snug text-muted">{t(stat.label, locale)}</dt>
                <dd className="font-display text-3xl font-extrabold leading-none text-green">
                  {stat.value}
                  <span className="text-lg text-gold">{stat.suffix}</span>
                </dd>
              </div>
            </Reveal>
          ))}
        </dl>

        <h2 className="mt-20 text-2xl font-bold">{dict.about.principlesTitle}</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {dict.about.principles.map((principle, i) => (
            <Reveal key={principle.title} delay={i * 70}>
              <div className="h-full rounded-2xl border border-line bg-surface p-7">
                <h3 className="text-[1.1rem] font-semibold">{principle.title}</h3>
                <p className="mt-3 text-[0.94rem] leading-relaxed text-muted">
                  {principle.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>

      <StackSection dict={dict} />
      <ContactSection locale={locale} dict={dict} />
    </>
  );
}
