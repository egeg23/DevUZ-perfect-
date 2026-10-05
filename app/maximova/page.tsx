import type { Metadata } from "next";

import { Site } from "@/components/clients/maximova/lab/Site";
import { HOME_SEO } from "@/content/clients/maximova/pages";
import { pageMetadata } from "@/lib/clients/maximova/seo";

/**
 * Сайт Дарьи — «Лаборатория», по эталону владельца (MedAcademy, вариант B).
 * Прежний основной вариант «Две страны» — в /maximova/c, все варианты — в
 * /maximova/variants.
 */
export const metadata: Metadata = pageMetadata({ path: "", title: HOME_SEO.title, description: HOME_SEO.description });

export default function Page() {
  return <Site />;
}
