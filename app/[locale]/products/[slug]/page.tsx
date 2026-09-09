import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ProductInquiry } from "@/components/products/product-inquiry";
import { ContactSection } from "@/components/sections/contact";
import { OrderForm } from "@/components/products/order-form";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { getDictionary } from "@/content/dictionaries";
import { productBySlug, products } from "@/content/products";
import { isLocale, locales, localeHref, t, tList, type Locale } from "@/lib/i18n";
import { breadcrumbSchema, jsonLdGraph, productSchema } from "@/lib/schema";
import { buildMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    products.map((product) => ({ locale, slug: product.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = productBySlug(slug);
  if (!isLocale(locale) || !product) return {};

  return buildMetadata({
    locale,
    path: `products/${slug}`,
    title: t(product.seoTitle, locale),
    description: t(product.seoDescription, locale),
  });
}

function money(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const product = productBySlug(slug);
  if (!isLocale(raw)) notFound();
  // Несуществующий slug при живой локали — почти всегда устаревшая ссылка.
  // Ведём в раздел на языке посетителя, как это сделано у услуг и кейсов.
  if (!product) redirect(localeHref(raw as Locale, "products"));

  const locale = raw as Locale;
  const dict = getDictionary(locale);
  const p = dict.products;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdGraph(
            productSchema(product, locale),
            breadcrumbSchema([
              { name: p.title, path: `${locale}/products` },
              { name: t(product.title, locale), path: `${locale}/products/${slug}` },
            ]),
          ),
        }}
      />

      <Container className="pb-24 pt-36">
        <Link
          href={localeHref(locale, "products")}
          className="font-mono text-sm text-muted transition-colors hover:text-white"
        >
          ← {p.back}
        </Link>

        <h1 className="mt-8 max-w-3xl text-[clamp(2rem,6vw,3.25rem)] font-bold leading-[1.1]">
          {t(product.title, locale)}
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted">{t(product.tagline, locale)}</p>

        <div className="mt-10 flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <span className="font-mono text-4xl font-bold text-green">
            {product.priceToUsd
              ? `${money(product.priceUsd)} – ${money(product.priceToUsd)}`
              : money(product.priceUsd)}
          </span>
          <span className="text-muted">{p.price}</span>
        </div>

        <p className="mt-10 max-w-3xl text-lg">{t(product.description, locale)}</p>

        {/* Сравнение с разработкой с нуля — главный довод покупки, поэтому
            стоит выше подробностей, а не в подвале страницы. */}
        <Reveal>
          <p className="mt-10 max-w-3xl rounded-2xl border border-green/25 bg-green/5 px-6 py-5">
            {t(product.savings, locale)}
          </p>
        </Reveal>

        <Section title={p.included}>
          <div className="grid gap-6 md:grid-cols-2">
            {product.blocks.map((block, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                  <h3 className="font-bold">{t(block.title, locale)}</h3>
                  <ul className="mt-4 flex flex-col gap-2 text-sm text-muted">
                    {tList(block.items, locale).map((item, j) => (
                      <li key={j} className="flex gap-2.5">
                        <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-green" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </Section>

        <Section title={p.tech}>
          <ul className="flex flex-wrap gap-2">
            {product.tech.map((tech) => (
              <li
                key={tech}
                className="rounded-lg border border-white/12 px-3 py-1.5 font-mono text-sm text-muted"
              >
                {tech}
              </li>
            ))}
          </ul>
        </Section>

        {product.monetization && (
          <Section title={p.monetization}>
            <Bullets items={tList(product.monetization, locale)} />
          </Section>
        )}

        {product.rebuild && (
          <Section title={p.rebuild}>
            <Bullets items={tList(product.rebuild, locale)} />
          </Section>
        )}

        <Section title={p.readiness}>
          <p className="max-w-3xl text-muted">{t(product.readiness, locale)}</p>
        </Section>

        <Section title={p.buyerProvides}>
          <Bullets items={tList(product.buyerProvides, locale)} />
        </Section>

        <div className="mt-14">
          <ProductInquiry
            label={p.buy}
            product={t(product.title, locale)}
            price={
              product.priceToUsd
                ? `${money(product.priceUsd)} – ${money(product.priceToUsd)}`
                : money(product.priceUsd)
            }
          />
        </div>

        <p className="mt-8 max-w-2xl text-sm text-muted">{p.note}</p>

        <OrderForm productSlug={product.slug} locale={locale} />
      </Container>

      <ContactSection dict={dict} locale={locale} />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="flex max-w-3xl flex-col gap-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-muted">
          <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-green" />
          {item}
        </li>
      ))}
    </ul>
  );
}
