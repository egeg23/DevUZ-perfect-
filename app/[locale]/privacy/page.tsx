import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/ui/container";
import { privacy } from "@/content/legal";
import { isLocale, type Locale } from "@/lib/i18n";
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
  const doc = privacy[raw as Locale];

  return (
    <Container className="max-w-3xl pb-28 pt-36">
      <h1 className="text-[clamp(2rem,4.4vw,3rem)] font-extrabold leading-[1.08]">
        {doc.title}
      </h1>
      <p className="mt-4 font-mono text-[0.75rem] text-faint">{doc.updated}</p>
      <p className="mt-7 text-[1.02rem] leading-relaxed text-muted">{doc.intro}</p>

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
