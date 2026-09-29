import type { Metadata } from "next";

import { TwoCountries } from "@/components/clients/maximova/c/TwoCountries";

/** Сайт Дарьи — выбранный вариант «Две страны». Прежние варианты — в /maximova/variants. */
export const metadata: Metadata = { title: "Дарья Максимова — английский и французский для детей" };

export default function Page() {
  return <TwoCountries />;
}
