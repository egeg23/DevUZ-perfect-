import type { Metadata } from "next";
import { cookies } from "next/headers";
import { sans, mono } from "@/app/fonts";
import type { ReactNode } from "react";

import { shellDict } from "@/content/admin-panel/shell";
import { PANEL_HTML_LANG, PANEL_LANG_COOKIE, panelLocale } from "@/lib/admin/i18n";

import "../globals.css";

/**
 * Панель закрыта от индексации на уровне метаданных, а не только robots.txt:
 * ссылка на неё может утечь откуда угодно, и полагаться на то, что робот
 * сначала спросит robots.txt, — значит полагаться на его вежливость.
 */
export async function generateMetadata(): Promise<Metadata> {
  const locale = panelLocale((await cookies()).get(PANEL_LANG_COOKIE)?.value);
  return {
    title: shellDict.pageTitle[locale],
    robots: { index: false, follow: false, nocache: true },
  };
}

/**
 * Свои html и body: корневой layout только пробрасывает children, а
 * app/[locale]/layout.tsx с его шапкой, футером и виджетом чата панели не
 * подходит — клиентский чат в админке выглядел бы как минимум странно.
 *
 * Шрифт display здесь не грузится: в панели нет ни одного заголовка, ради
 * которого стоило бы тянуть третье семейство.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Язык — из куки-зеркала: layout не ходит в базу за сотрудником (см.
  // requireStaff), а для атрибута lang подсказки браузеру достаточно.
  const locale = panelLocale((await cookies()).get(PANEL_LANG_COOKIE)?.value);
  return (
    <html lang={PANEL_HTML_LANG[locale]} className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-ink text-text antialiased">{children}</body>
    </html>
  );
}
