import type { Metadata } from "next";

import { Glass } from "@/components/clients/maximova/b/Glass";

// Архив вариантов — в поиск не пускаем никогда: главная копия — /maximova.
export const metadata: Metadata = { title: "Дарья Максимова — английский и французский для детей · Стекло", robots: { index: false, follow: false } };

export default function Page() {
  return <Glass />;
}
