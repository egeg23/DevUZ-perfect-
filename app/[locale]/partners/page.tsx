import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/ui/container";
import { company } from "@/content/company";
import { getDictionary } from "@/content/dictionaries";
import { isLocale, localeHref, type Locale } from "@/lib/i18n";
import { PARTNER_TIERS } from "@/lib/partners/rules";
import { buildMetadata } from "@/lib/seo";

/**
 * «Зарабатывай с нами» — публичная страница партнёрской программы.
 *
 * Владелец, 28.09: «Сделай новым пунктом меню — зарабатывай с нами. Там
 * информация про нашу реферальную систему и отдельный вход для партнёров».
 * Две кнопки: «Стать партнёром» ведёт в бота, который заводит партнёра и
 * сразу присылает вход в кабинет; «Войти в кабинет» — на страницу кабинета,
 * где та же кнопка входа через Telegram. Регистрация и вход — одно и то же
 * действие, отдельной формы нет.
 *
 * Цифры берутся из словаря, а не из констант кода намеренно: это обещание
 * людям на четырёх языках, и менять его надо осознанно, вместе с текстом, а
 * не случайно вместе с константой.
 */

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
    path: "partners",
    title: dict.partners.title,
    description: dict.partners.lead,
  });
}

export default async function PartnersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale).partners;
  const botUrl = `https://t.me/${company.telegram}?start=cabinet`;

  return (
    <Container className="pb-16 pt-28 sm:pb-24 sm:pt-32">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-green">{t.title}</p>
        <h1 className="mt-3 font-display text-3xl font-semibold sm:text-5xl">{t.heading}</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">{t.lead}</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href={botUrl}
            className="inline-block rounded-xl bg-green px-7 py-4 font-semibold text-ink transition-colors hover:bg-white"
          >
            {t.cta}
          </a>
          <a
            href={localeHref(locale, "partners/cabinet")}
            className="inline-block rounded-xl border border-white/20 px-7 py-4 font-semibold transition-colors hover:border-green/60 hover:text-green"
          >
            {t.cabinetCta}
          </a>
        </div>
        <p className="mt-3 text-sm text-faint">{t.ctaNote}</p>

        <section className="mt-16">
          <h2 className="font-display text-xl font-semibold sm:text-2xl">{t.howTitle}</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-3">
            {[t.step1, t.step2, t.step3].map((step, index) => (
              <li key={index} className="rounded-xl border border-white/12 bg-white/[0.03] px-5 py-5">
                <span className="font-mono text-sm text-green">0{index + 1}</span>
                <p className="mt-2 text-sm leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-green/30 bg-green/5 px-5 py-5">
            <h2 className="font-display text-xl font-semibold">{t.ratesTitle}</h2>
            {/* Ступени — из той же таблицы, по которой считаются деньги
                (lib/partners/rules.ts): обещание и расчёт не разъедутся. */}
            <ul className="mt-4 flex flex-col divide-y divide-white/10 text-sm">
              {PARTNER_TIERS.map((tier, i) => (
                <li key={tier.percent} className="flex items-baseline justify-between gap-4 py-2">
                  <span className="text-muted">
                    {(tier.upTo === null ? t.tierOver : t.tierUpTo).replace(
                      "{amount}",
                      usd(locale, tier.upTo ?? PARTNER_TIERS[i - 1]?.upTo ?? 0),
                    )}
                  </span>
                  <span className="font-display text-lg font-semibold text-green">{tier.percent} %</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-muted">{t.rateNote}</p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-white/12 bg-white/[0.03] px-5 py-5">
              <h2 className="font-display text-xl font-semibold">{t.perkTitle}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">{t.perk}</p>
            </div>
            <div className="rounded-xl border border-white/12 bg-white/[0.03] px-5 py-5">
              <h2 className="font-display text-xl font-semibold">{t.payoutTitle}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">{t.payout}</p>
            </div>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="font-display text-xl font-semibold sm:text-2xl">{t.cabinetTitle}</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {t.cabinetPoints.map((point) => (
              <li key={point} className="flex gap-3 rounded-xl border border-white/12 bg-white/[0.03] px-5 py-4 text-sm leading-relaxed">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-green" aria-hidden />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-10 text-sm text-muted">{t.fair}</p>

        <section className="mt-14">
          <h2 className="font-display text-xl font-semibold sm:text-2xl">{t.faqTitle}</h2>
          <div className="mt-5 flex flex-col divide-y divide-white/10 rounded-xl border border-white/12">
            {t.faq.map((item) => (
              <details key={item.q} className="group px-5 py-4">
                <summary className="cursor-pointer list-none font-medium marker:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {item.q}
                    <span className="text-green transition-transform group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="mt-12 rounded-xl border border-white/12 px-5 py-5">
          <p className="text-sm leading-relaxed">{t.bloggers}</p>
          <a href={company.telegramUrl} className="mt-3 inline-block text-sm text-green hover:underline">
            {company.telegramUrl.replace("https://", "")}
          </a>
        </div>
      </div>
    </Container>
  );
}

/** «2 500 $» по-русски и по-узбекски, «$2,500» — по-английски и по-китайски. */
function usd(locale: Locale, amount: number): string {
  return locale === "en" || locale === "zh" ? `$${amount.toLocaleString("en-US")}` : `${amount.toLocaleString("ru-RU")} $`;
}
