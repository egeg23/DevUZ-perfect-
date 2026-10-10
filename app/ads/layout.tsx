import type { Metadata } from "next";
import type { ReactNode } from "react";

import { mono, sans } from "@/app/fonts";

import "../globals.css";

/**
 * Кабинет автопилота рекламы для агентств — свои html и body, как у панели:
 * шапка и чат сайта здесь ни к чему. Не индексируется: это личное.
 */
export const metadata: Metadata = {
  title: "DevUz · Автопилот рекламы",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdsLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-ink text-text antialiased">
        <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">{children}</main>
      </body>
    </html>
  );
}
