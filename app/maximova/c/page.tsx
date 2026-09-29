import type { Metadata } from "next";

import { TwoCountries } from "@/components/clients/maximova/c/TwoCountries";

export const metadata: Metadata = { title: "Дарья Максимова — английский и французский для детей · Две страны" };

export default function Page() {
  return <TwoCountries />;
}
