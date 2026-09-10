import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ContactSection } from "@/components/sections/contact";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { getDictionary } from "@/content/dictionaries";
import { products } from "@/content/products";
import { isLocale, localeHref, t, type Locale } from "@/lib/i18n";
import { breadcrumbSchema, jsonLdGraph, productSchema } from "@/lib/schema";
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
    path: "products",
    title: dict.seo.products.title,
    description: dict.seo.products.description,
  });
}

/** Цена одной строкой: точная или вилка, если она есть. */
function priceLabel(from: number, to: number | undefined, fromWord: string): string {
  const money = (n: number) => `$${n.toLocaleString("en-US")}`;
  return to ? `${money(from)} – ${money(to)}` : `${fromWord} ${money(from)}`;
}

export default async function ProductsPage({
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdGraph(
            ...products.map((p) => productSchema(p, locale)),
            breadcrumbSchema([{ name: dict.products.title, path: `${locale}/products` }]),
          ),
        }}
      />

      <Container className="pb-24 pt-36">
        <h1 className="max-w-3xl text-[clamp(2rem,6vw,3.25rem)] font-bold leading-[1.1]">
          {dict.products.title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">{dict.products.lead}</p>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {products.map((product, i) => (
            <Reveal key={product.slug} delay={i * 60} className="min-w-0">
              <Link
                href={localeHref(locale, `products/${product.slug}`)}
                className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-7 transition-colors hover:border-green/40"
              >
                {/* min-w-0 на заголовке: без него он не даёт себя сжать
                    уже собственного содержимого, а цена рядом стоит
                    shrink-0 — и на 320 px строка распирала карточку за край
                    экрана вместе со всей страницей. */}
                <div className="flex items-start justify-between gap-4">
                  <h2 className="min-w-0 text-xl font-bold">{t(product.title, locale)}</h2>
                  <span className="shrink-0 font-mono text-lg font-bold text-green">
                    {priceLabel(product.priceUsd, product.priceToUsd, dict.products.priceFrom)}
                  </span>
                </div>
                <p className="mt-3 text-muted">{t(product.tagline, locale)}</p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {product.tech.slice(0, 5).map((tech) => (
                    <li
                      key={tech}
                      className="rounded-lg border border-white/10 px-2.5 py-1 font-mono text-xs text-muted"
                    >
                      {tech}
                    </li>
                  ))}
                </ul>
              </Link>
            </Reveal>
          ))}
        </div>

        <p className="mt-10 max-w-2xl text-sm text-muted">{dict.products.note}</p>
      </Container>

      <ContactSection dict={dict} locale={locale} />
    </>
  );
}
