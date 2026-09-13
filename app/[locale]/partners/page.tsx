import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/ui/container";
import { company } from "@/content/company";
import { getDictionary } from "@/content/dictionaries";
import { isLocale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";

/**
 * Публичная страница партнёрской программы.
 *
 * Одна кнопка — в бота: регистрация партнёра и есть первая команда /ref,
 * отдельной формы не нужно. Цифры на странице берутся из словаря, а не из
 * констант кода намеренно: это обещание людям на четырёх языках, и менять
 * его надо осознанно, вместе с текстом, а не случайно вместе с константой.
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
  const botUrl = `https://t.me/${company.telegram}?start=partner`;

  return (
    <Container className="py-16 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-3xl font-semibold sm:text-5xl">{t.title}</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">{t.lead}</p>
        <a
          href={botUrl}
          className="mt-8 inline-block rounded-xl bg-green px-7 py-4 font-semibold text-ink transition-colors hover:bg-white"
        >
          {t.cta}
        </a>

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
            <p className="mt-3 text-sm leading-relaxed">{t.rateBase}</p>
            <p className="mt-2 text-sm leading-relaxed">{t.rateProven}</p>
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

        <p className="mt-10 text-sm text-muted">{t.fair}</p>

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
