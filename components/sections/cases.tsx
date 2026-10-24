import Link from "next/link";
import type { ReactNode } from "react";

import { LogoMark } from "@/components/brand/logo";
import { CaseTeaser } from "@/components/sections/case-teaser";
import { CodeBoot } from "@/components/ui/code-boot";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { casesTitle } from "@/content/company";
import { caseDate, casesOnSite, showcaseSlug, type Case } from "@/content/cases";
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
  const proto = item.prototype;
  // Ролик — у прототипа или у витрины под паролем; без ролика — первый
  // снимок экрана макета, если он есть, а не одна типографика.
  const teaser = proto?.teaser ?? item.teaser;
  const cover = !teaser && item.shots ? `/cases/${item.slug}/shot-1-desktop.webp` : null;
  const media = Boolean(teaser || cover);

  const card = (
    <Shell
      item={item}
      locale={locale}
      className={cn(
        // sm:col-span-2 здесь стоял и не работал: элемент сетки — обёртка
        // Reveal, а класс висел на ссылке внутри неё. Убран, а не перенесён
        // выше: шесть карточек это ровно два полных ряда по три, и растянутая
        // первая оставила бы в последнем ряду дыру. featured по-прежнему
        // значим — он делает превью выше.
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-all duration-500 hover:-translate-y-1 hover:border-green/35",
        proto && "border-transparent hover:translate-y-0 hover:border-transparent",
      )}
    >
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden bg-gradient-to-br to-ink",
          accent.from,
          featured || media ? "h-56" : "h-44",
        )}
      >
        {/* Кейс с живым прототипом: вместо типографики — ролик сцены 60 к/с.
            Без звука и по кругу; при «меньше движения» — только постер. */}
        {teaser ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${teaser.replace(/teaser$/, "poster")}-16.webp`} alt="" aria-hidden="true" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
            <CaseTeaser
              src={`${teaser}-16.mp4`}
              poster={`${teaser.replace(/teaser$/, "poster")}-16.webp`}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04] motion-reduce:hidden"
            />
            <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
          </>
        ) : null}
        {cover ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt="" aria-hidden="true" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]" />
            <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/40" />
          </>
        ) : null}
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
            media && "hidden",
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
          {caseDate(item, locale)}
        </span>

        {/* У кейса есть шторка «было / стало» — сказать это на карточке:
            сравнить со старым сайтом хотят раньше, чем читать описание. */}
        {item.compare ? (
          <span className="absolute left-4 top-4 rounded-md border border-line bg-ink/50 px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-text backdrop-blur-sm">
            ↔ {dict.cases.compareTitle}
          </span>
        ) : null}

        {proto ? (
          <span className={cn("proto-badge absolute left-4 top-4 rounded-md border bg-ink/60 px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.14em] backdrop-blur-sm", accent.ring, accent.text)}>
            ▶ {dict.cases.protoTag}
          </span>
        ) : null}

        {/* В кейс с игрой заходят, чтобы сыграть, — это и сказать. */}
        {item.playable ? (
          <span className={cn("absolute left-4 top-4 rounded-md border bg-ink/50 px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.14em] backdrop-blur-sm", accent.ring, accent.text)}>
            ▶ {dict.cases.playBadge}
          </span>
        ) : null}
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
    </Shell>
  );

  // Прототип выделен рамкой, по которой бежит свет (.proto-glow).
  return proto ? <div className="proto-glow h-full rounded-2xl p-[1.5px]">{card}</div> : card;
}

/**
 * Карточка всегда ведёт на страницу кейса, и кейс с прототипом тоже: там
 * «Войти по паролю» и «Получить пароль у менеджера» (владелец, 24.10.2026:
 * «Разве я не должен сначала провалиться внутрь карточки в кейсах, а уже
 * там кнопкой перейти в макет по паролю»).
 */
function Shell({ item, locale, className, children }: { item: Case; locale: Locale; className: string; children: ReactNode }) {
  return (
    <Link href={localeHref(locale, `cases/${item.slug}`)} className={className}>
      {children}
    </Link>
  );
}

export function CasesSection({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  // Сайт студии на главной показан отдельным блоком выше — в сетке он был бы
  // вторым рассказом об одном и том же. Шесть карточек — ровно два полных
  // ряда по три на широком экране, седьмая оставила бы дыру. Полный список,
  // вместе с сайтом студии, живёт на странице /cases. Шесть — первые в
  // порядке сайта: сначала с роликом, внутри — свежие (casesOnSite;
  // владелец, 24.10.2026). Демо студии (игры для рекламы) сюда не идут: на
  // главной — проекты клиентов.
  const featured = casesOnSite.filter((item) => item.slug !== showcaseSlug && !item.demo).slice(0, 6);

  return (
    <section id="cases" className="border-t border-line py-24 md:py-32">
      <CodeBoot code={"SELECT * FROM cases ORDER BY date DESC"}>
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            kicker={dict.cases.kicker}
            title={casesTitle(dict.cases.title)}
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
