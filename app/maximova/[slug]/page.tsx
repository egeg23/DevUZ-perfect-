import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Landing } from "@/components/clients/maximova/lab/Landing";
import { LANDINGS, landingBySlug } from "@/content/clients/maximova/pages";
import { pageMetadata } from "@/lib/clients/maximova/seo";

/** Посадочные страницы под запросы по Москве — список в content/clients/maximova/pages.ts. */
export const dynamicParams = false;

export function generateStaticParams() {
  return LANDINGS.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const page = landingBySlug((await params).slug);
  if (!page) return {};
  return pageMetadata({ path: `/${page.slug}`, title: page.title, description: page.description });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const page = landingBySlug((await params).slug);
  if (!page) notFound();
  return <Landing page={page} />;
}
