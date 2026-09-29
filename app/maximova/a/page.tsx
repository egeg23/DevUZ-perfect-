import type { Metadata } from "next";

import { Cinema } from "@/components/clients/maximova/a/Cinema";

// Архив вариантов — в поиск не пускаем никогда: главная копия — /maximova.
export const metadata: Metadata = { title: "Дарья Максимова — английский и французский для детей · Кино", robots: { index: false, follow: false } };

export default function Page() {
  return <Cinema />;
}
