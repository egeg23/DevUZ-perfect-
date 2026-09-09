import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";

import "../globals.css";

const sans = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

/**
 * Панель закрыта от индексации на уровне метаданных, а не только robots.txt:
 * ссылка на неё может утечь откуда угодно, и полагаться на то, что робот
 * сначала спросит robots.txt, — значит полагаться на его вежливость.
 */
export const metadata: Metadata = {
  title: "Панель — DevUz Studio",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Свои html и body: корневой layout только пробрасывает children, а
 * app/[locale]/layout.tsx с его шапкой, футером и виджетом чата панели не
 * подходит — клиентский чат в админке выглядел бы как минимум странно.
 *
 * Шрифт display здесь не грузится: в панели нет ни одного заголовка, ради
 * которого стоило бы тянуть третье семейство.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-ink text-text antialiased">{children}</body>
    </html>
  );
}
