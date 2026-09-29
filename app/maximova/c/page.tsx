import type { Metadata } from "next";

import { TwoCountries } from "@/components/clients/maximova/c/TwoCountries";

// Архив вариантов — в поиск не пускаем никогда: главная копия — /maximova.
export const metadata: Metadata = { title: "Дарья Максимова — английский и французский для детей · Две страны", robots: { index: false, follow: false } };

export default function Page() {
  return <TwoCountries />;
}
