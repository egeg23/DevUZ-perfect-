import Link from "next/link";

import { LogoMark } from "@/components/brand/logo";
import { CodeBoot } from "@/components/ui/code-boot";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { cases, showcaseSlug, type Case } from "@/content/cases";
import type { Dictionary } from "@/content/dictionaries";
import { cn } from "@/lib/cn";
import { localeHref, t, type Locale } from "@/lib/i18n";

const ACCENTS: Record<
  Case["accent"],
  { from: string; ring: string; text: string; glow: string; ghost: string }
> = {
  green: { from: "from-[#132a20]", ring: "border-green/25", text: "text-green", glow: "bg-green/10", ghost: "text-green/[0.07]" },
  blue: { from: "from-[#141f33]", ring: "border-blue/25", text: "text-blue-soft", glow: "bg-blue/10", ghost: "text-blue-soft/[0.07]" },
  gold: { from: "from-[#2a2418]", ring: "border-gold/25", text: "text-gold", glow: "bg-gold/10", ghost: "text-gold/[0.07]" },
  violet: { from: "from-[#221b33]", ring: "border-violet/25", text: "text-violet", glow: "bg-violet/10", ghost: "text-violet/[0.07]" },
};

/**
 * Размер названия под его длину.
 *
 * Одного кегля на все девять имён не хватает: «MA» и «Marketplace Audit»
 * отличаются втрое. Ступеньками, а не clamp по vw: карточка живёт в сетке
 * и её ширина от ширины экрана почти не зависит — на вьюпорт здесь
 * опираться нечем.
 */
function nameSize(name: string): string {
  if (name.length <= 8) return "text-[1.6rem]";
  if (name.length <= 13) return "text-[1.3rem]";
  return "text-[1.05rem]";
}

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
        // sm:col-span-2 здесь стоял и не работал: элемент сетки — обёртка
        // Reveal, а класс висел на ссылке внутри неё. Убран, а не перенесён
        // выше: шесть карточек это ровно два полных ряда по три, и растянутая
        // первая оставила бы в последнем ряду дыру. featured по-прежнему
        // значим — он делает превью выше.
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-all duration-500 hover:-translate-y-1 hover:border-green/35",
      )}
    >
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden bg-gradient-to-br to-ink",
          accent.from,
          featured ? "h-56" : "h-44",
        )}
      >
        {/* Превью — типографика, а не скриншот и не чужой логотип.
            Скриншотов у нас нет, а рисовать клиенту фирменный знак, которого
            у него не существует, значит выдавать выдумку за его брендинг.
            Имя проекта — то единственное, что здесь и правда его. */}

        {/* Монограмма во всю карточку, почти прозрачная: даёт каждому кейсу
            свой силуэт, чтобы шесть карточек в сетке не выглядели одной
            повторённой шесть раз. Обрезается краями намеренно. */}
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -left-4 top-1/2 -translate-y-1/2 select-none font-display font-extrabold leading-none tracking-tighter",
            featured ? "text-[11rem]" : "text-[8.5rem]",
            accent.ghost,
          )}
        >
          {item.monogram}
        </span>

        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl",
            accent.glow,
          )}
        />

        <div className="relative flex items-center gap-4 px-6">
          {/* У собственного кейса студии знак настоящий — выдумывать нечего. */}
          {item.slug === showcaseSlug ? (
            <span
              className={cn(
                "flex shrink-0 items-center justify-center rounded-2xl border bg-ink/40 backdrop-blur-sm",
                featured ? "h-16 w-16" : "h-14 w-14",
                accent.ring,
              )}
            >
              <LogoMark size={featured ? 34 : 30} />
            </span>
          ) : (
            <span
              className={cn(
                "flex shrink-0 items-center justify-center rounded-2xl border bg-ink/40 font-display font-extrabold leading-none tracking-tight backdrop-blur-sm",
                featured ? "h-16 w-16 text-[1.15rem]" : "h-14 w-14 text-[1rem]",
                accent.ring,
                accent.text,
              )}
            >
              {item.monogram}
            </span>
          )}

          <span className="min-w-0">
            {/* Название здесь и есть заголовок карточки: повторять его ниже
                значило бы произнести дважды — и глазу, и скринридеру. */}
            <h3
              className={cn(
                "font-display font-extrabold leading-tight tracking-tight text-text",
                nameSize(item.name),
              )}
            >
              {item.name}
            </h3>
            <span className={cn("mt-1.5 block font-mono text-[0.6rem] uppercase tracking-[0.18em]", accent.text)}>
              {t(item.category, locale)}
            </span>
          </span>
        </div>

        <span className="absolute right-4 top-4 font-mono text-[0.62rem] text-faint">
          {item.year}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="flex-1 text-[0.92rem] leading-relaxed text-muted">
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
  // Сайт студии на главной показан отдельным блоком выше — в сетке он был бы
  // вторым рассказом об одном и том же. Шесть карточек — ровно два полных
  // ряда по три на широком экране, седьмая оставила бы дыру. Полный список,
  // вместе с сайтом студии, живёт на странице /cases.
  const featured = cases.filter((item) => item.slug !== showcaseSlug).slice(0, 6);

  return (
    <section id="cases" className="border-t border-line py-24 md:py-32">
      <CodeBoot code={"SELECT * FROM cases ORDER BY year DESC"}>
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
      </CodeBoot>
    </section>
  );
}
