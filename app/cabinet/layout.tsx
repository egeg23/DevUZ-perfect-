import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { sans, mono } from "@/app/fonts";
import { CAB_LANG_COOKIE, cab, isCabLocale } from "@/content/ai-staff/cabinet";

import "../globals.css";

/**
 * Кабинет клиента ИИ-сотрудников — свои html и body, как у панели студии:
 * шапка сайта с чатом студии здесь ни к чему. Закрыт от индексации.
 */
export async function generateMetadata(): Promise<Metadata> {
  const raw = (await cookies()).get(CAB_LANG_COOKIE)?.value;
  const locale = isCabLocale(raw) ? raw : "ru";
  return { title: cab.title[locale], robots: { index: false, follow: false, nocache: true } };
}

export default async function CabinetLayout({ children }: { children: ReactNode }) {
  const raw = (await cookies()).get(CAB_LANG_COOKIE)?.value;
  const locale = isCabLocale(raw) ? raw : "ru";
  return (
    <html lang={locale === "uz" ? "uz-Latn" : "ru"} className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-ink text-text antialiased">{children}</body>
    </html>
  );
}
