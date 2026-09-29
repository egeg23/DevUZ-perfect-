import type { Metadata } from "next";

import { Chooser } from "@/components/clients/maximova/Chooser";

// Архив вариантов — в поиск не пускаем никогда: главная копия — /maximova.
export const metadata: Metadata = { title: "Дарья Максимова — выбор варианта сайта", robots: { index: false, follow: false } };

export default function Page() {
  return <Chooser />;
}
