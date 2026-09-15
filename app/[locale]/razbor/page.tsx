import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/ui/container";
import { razborCopy } from "@/content/razbor/page-copy";
import { razborsFor } from "@/content/razbor/items";
import { isLocale } from "@/lib/i18n";
import { buildMetadata, siteUrl } from "@/lib/seo";
import { isRazborLocale, localeHref } from "@/lib/razbor/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale) || !isRazborLocale(locale)) return {};
  const copy = razborCopy[locale];

  return buildMetadata({
    locale,
    path: "razbor",
    title: `${copy.title} — DevUz Studio`,
    description: copy.lead,
  });
}

export default async function RazborIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  // Разборы существуют только на русском и узбекском: это разные запросы,
  // а не перевод одного. На остальных языках раздела просто нет — пустая
  // страница под hreflang хуже её отсутствия.
  if (!isLocale(raw) || !isRazborLocale(raw)) notFound();
  const locale = raw;
  const copy = razborCopy[locale];
  const items = razborsFor(locale);

  return (
    <Container className="pb-24 pt-36">
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.3em] text-green">
        {"// "}{copy.kicker}
      </p>
      <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
        {copy.title}
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{copy.lead}</p>

      {items.length === 0 ? (
        <section className="mt-12 max-w-2xl rounded-2xl border border-line bg-surface px-6 py-8">
          <p className="text-lg font-semibold">{copy.empty}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{copy.emptyNote}</p>
        </section>
      ) : (
        <ul className="mt-12 grid gap-5 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.slug}>
              <Link
                href={localeHref(locale, item.slug)}
                className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-6 transition-colors hover:border-green/40"
              >
                <span className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-faint">
                  {item.label}
                </span>
                <span className="mt-3 text-xl font-semibold leading-snug transition-colors group-hover:text-green">
                  {item.title}
                </span>
                <span className="mt-3 text-sm leading-relaxed text-muted">{item.description}</span>
                <span className="mt-auto pt-4 font-mono text-xs text-faint">
                  {item.findings.length}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-10 max-w-2xl text-xs leading-relaxed text-faint">{copy.anonymous}</p>

      <script
        type="application/ld+json"
        // Список разборов для поиска. Пустой раздел разметку не отдаёт:
        // ItemList без элементов — обещание, которого страница не держит.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            items.length
              ? {
                  "@context": "https://schema.org",
                  "@type": "ItemList",
                  itemListElement: items.map((item, i) => ({
                    "@type": "ListItem",
                    position: i + 1,
                    url: `${siteUrl}${localeHref(locale, item.slug)}`,
                    name: item.title,
                  })),
                }
              : {},
          ),
        }}
      />
    </Container>
  );
}
