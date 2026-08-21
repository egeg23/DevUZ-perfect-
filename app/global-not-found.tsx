import { Inter, JetBrains_Mono, Unbounded } from "next/font/google";
import { headers } from "next/headers";
import Link from "next/link";

import { getDictionary } from "@/content/dictionaries";
import { defaultLocale, hreflang, isLocale, localeHref, matchLocale, type Locale } from "@/lib/i18n";

import "./globals.css";

const display = Unbounded({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600", "800"],
  variable: "--font-unbounded",
  display: "swap",
});

const sans = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter", display: "swap" });

const mono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata = { title: "404", robots: { index: false, follow: false } };

/**
 * Страница 404 для всего сайта.
 *
 * Корневой layout у нас сквозной: html и body рисует layout внутри [locale],
 * потому что только там известен язык. Обычный not-found.tsx в такой схеме
 * отрисоваться не может — Next подставляет вместо него собственную заглушку,
 * и человек, независимо от языка сайта, видел голое английское «This page
 * could not be found» без шапки, стилей и атрибута lang. global-not-found
 * рисует свои html и body сам, поэтому работает и здесь.
 *
 * Язык берём из заголовка, который проставляет middleware, а если запрос до
 * него не дошёл — из Accept-Language. Русский остаётся последним запасным
 * вариантом, а не первым, как было раньше.
 */
export default async function GlobalNotFound() {
  const head = await headers();
  const fromPath = head.get("x-devuz-locale") ?? undefined;
  const locale: Locale = isLocale(fromPath)
    ? fromPath
    : matchLocale(head.get("accept-language")) || defaultLocale;

  const dict = getDictionary(locale);

  return (
    <html lang={hreflang[locale]} className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <main className="mx-auto flex min-h-svh w-full max-w-[1320px] flex-col items-center justify-center px-5 py-24 text-center sm:px-8">
          <p className="font-mono text-[clamp(3.5rem,14vw,5rem)] font-bold leading-none text-green">
            404
          </p>
          <h1 className="mt-6 text-[clamp(1.5rem,5vw,2rem)] font-bold">{dict.notFound.title}</h1>
          <p className="mt-4 max-w-md text-muted">{dict.notFound.text}</p>
          <Link
            href={localeHref(locale)}
            className="mt-9 rounded-xl bg-green px-6 py-3.5 font-semibold text-ink transition-colors hover:bg-white"
          >
            {dict.cta.backHome}
          </Link>
        </main>
      </body>
    </html>
  );
}
