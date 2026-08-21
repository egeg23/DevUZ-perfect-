import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/ui/container";
import { company } from "@/content/company";
import { privacy } from "@/content/legal";
import { isLocale, t, type Locale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const doc = privacy[locale];

  return buildMetadata({
    locale,
    path: "privacy",
    title: doc.title,
    description: doc.intro.slice(0, 160),
  });
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const doc = privacy[locale];

  return (
    <Container className="max-w-3xl pb-28 pt-36">
      <h1 className="text-[clamp(2rem,4.4vw,3rem)] font-extrabold leading-[1.08]">
        {doc.title}
      </h1>
      <p className="mt-4 font-mono text-[0.75rem] text-faint">{doc.updated}</p>
      <p className="mt-7 text-[1.02rem] leading-relaxed text-muted">{doc.intro}</p>

      {/* Реквизиты держим здесь, а не в подвале каждой страницы: ПИНФЛ —
          персональный идентификатор, и выносить его на всякую страницу сайта
          нет причин, тогда как на юридической он уместен. */}
      <dl className="mt-10 grid gap-x-10 gap-y-5 rounded-2xl border border-line bg-surface px-7 py-6 sm:grid-cols-2">
        <div>
          <dt className="font-mono text-[0.64rem] uppercase tracking-[0.16em] text-faint">
            {locale === "ru" ? "Наименование" : locale === "uz" ? "Nomi" : locale === "zh" ? "名称" : "Legal name"}
          </dt>
          <dd className="mt-1.5 text-[0.95rem]">
            {locale === "ru" ? company.legal.name : company.legal.nameLatin}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[0.64rem] uppercase tracking-[0.16em] text-faint">
            {locale === "ru" ? "Правовая форма" : locale === "uz" ? "Huquqiy shakl" : locale === "zh" ? "组织形式" : "Legal form"}
          </dt>
          <dd className="mt-1.5 text-[0.95rem]">{t(company.legal.form, locale)}</dd>
        </div>
        <div>
          <dt className="font-mono text-[0.64rem] uppercase tracking-[0.16em] text-faint">
            {locale === "zh" ? "自然人识别码（PINFL）" : "ПИНФЛ / PINFL"}
          </dt>
          <dd className="mt-1.5 font-mono text-[0.95rem]">{company.legal.pinfl}</dd>
        </div>
        <div>
          <dt className="font-mono text-[0.64rem] uppercase tracking-[0.16em] text-faint">
            {locale === "ru" ? "Связь" : locale === "uz" ? "Aloqa" : locale === "zh" ? "联系方式" : "Contact"}
          </dt>
          <dd className="mt-1.5 text-[0.95rem]">
            <a
              href={company.telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green hover:text-white"
            >
              Telegram @{company.telegram}
            </a>
          </dd>
        </div>
      </dl>

      <div className="mt-14 space-y-11">
        {doc.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-[1.28rem] font-semibold">{section.heading}</h2>
            <div className="mt-4 space-y-3">
              {section.body.map((paragraph) => (
                <p key={paragraph} className="text-[0.96rem] leading-relaxed text-muted">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Container>
  );
}
