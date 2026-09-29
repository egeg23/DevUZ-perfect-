import type { Metadata } from "next";

import { Chooser } from "@/components/clients/maximova/Chooser";

export const metadata: Metadata = { title: "Дарья Максимова — выбор варианта сайта" };

export default function Page() {
  return <Chooser />;
}
