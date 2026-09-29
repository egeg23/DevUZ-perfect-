import type { Metadata } from "next";

import { TwoCountries } from "@/components/clients/maximova/c/TwoCountries";
import { HOME_SEO } from "@/content/clients/maximova/pages";
import { pageMetadata } from "@/lib/clients/maximova/seo";

/** Сайт Дарьи — выбранный вариант «Две страны». Прежние варианты — в /maximova/variants. */
export const metadata: Metadata = pageMetadata({ path: "", title: HOME_SEO.title, description: HOME_SEO.description });

export default function Page() {
  return <TwoCountries />;
}
