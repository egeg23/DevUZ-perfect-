import type { Metadata } from "next";

import { Cinema } from "@/components/clients/maximova/a/Cinema";

export const metadata: Metadata = { title: "Дарья Максимова — английский и французский для детей · Кино" };

export default function Page() {
  return <Cinema />;
}
