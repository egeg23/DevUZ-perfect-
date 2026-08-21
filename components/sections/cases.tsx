import Link from "next/link";

import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { cases, type Case } from "@/content/cases";
import type { Dictionary } from "@/content/dictionaries";
import { cn } from "@/lib/cn";
import { localeHref, t, type Locale } from "@/lib/i18n";

const ACCENTS: Record<Case["accent"], { from: string; ring: string; text: string }> = {
  green: { from: "from-[#132a20]", ring: "border-green/25", text: "text-green" },
  blue: { from: "from-[#141f33]", ring: "border-blue/25", text: "text-blue-soft" },
  gold: { from: "from-[#2a2418]", ring: "border-gold/25", text: "text-gold" },
  violet: { from: "from-[#221b33]", ring: "border-violet/25", text: "text-violet" },
};

export function CaseCard({
  item,
  locale,
  dict,
  featured = false,
}: {
  item: Case;
  locale: Locale;
  dict: Dictionary;
  featured?: boolean;
}) {
  const accent = ACCENTS[item.accent];

  return (
    <Link
      href={localeHref(locale, `cases/${item.slug}`)}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-all duration-500 hover:-translate-y-1 hover:border-green/35",
        featured && "sm:col-span-2",
      )}
    >
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden bg-gradient-to-br to-ink",
          accent.from,
          featured ? "h-56" : "h-44",
        )}
      >
        {/* Абстрактное превью вместо скриншота: реальных скриншотов у нас
            пока нет, а заглушка-стоковая картинка выглядела бы хуже, чем
            честная геометрия. */}
        <div aria-hidden="true" className="flex items-end gap-3">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={cn("rounded-xl border bg-white/[0.03]", accent.ring)}
              style={{
                width: featured ? 74 : 58,
                height: (featured ? 140 : 108) - i * 22,
                opacity: 1 - i * 0.28,
              }}
            />
          ))}
        </div>
        <span className="absolute right-4 top-4 font-mono text-[0.62rem] text-faint">
          {item.year}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <span
          className={cn(
            "self-start rounded-md border px-2 py-1 font-mono text-[0.6rem] uppercase tracking-[0.12em]",
            accent.ring,
            accent.text,
          )}
        >
          {t(item.category, locale)}
        </span>

        <h3 className="mt-4 text-[1.3rem] font-semibold">{item.name}</h3>
        <p className="mt-2.5 flex-1 text-[0.92rem] leading-relaxed text-muted">
          {t(item.summary, locale)}
        </p>

        <div className="mt-6 flex flex-wrap gap-x-7 gap-y-3 border-t border-line pt-5">
          {item.metrics.slice(0, featured ? 3 : 2).map((metric) => (
            <div key={metric.value + t(metric.label, locale)}>
              <p className={cn("font-display text-lg font-bold leading-none", accent.text)}>
                {metric.value}
              </p>
              <p className="mt-1.5 max-w-[11rem] text-[0.68rem] leading-snug text-faint">
                {t(metric.label, locale)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
}

export function CasesSection({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const featured = cases.slice(0, 5);

  return (
    <section id="cases" className="border-t border-line py-24 md:py-32">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            kicker={dict.cases.kicker}
            title={dict.cases.title}
            description={dict.cases.description}
          />
          <Reveal>
            <Link
              href={localeHref(locale, "cases")}
              className="link-underline whitespace-nowrap text-[0.92rem] text-green"
            >
              {dict.cta.allCases} →
            </Link>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((item, i) => (
            <Reveal key={item.slug} delay={i * 70} className="h-full">
              <CaseCard item={item} locale={locale} dict={dict} featured={i === 0} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
