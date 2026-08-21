"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";
import { localeLabel, localeShort, locales, type Locale } from "@/lib/i18n";

/**
 * Переключатель языка.
 *
 * Меняет только первый сегмент пути, поэтому пользователь остаётся на той же
 * странице, а не улетает на главную — а это, помимо удобства, ещё и сигнал
 * связности для поисковика: каждая языковая версия ссылается на свою пару.
 *
 * Куку ставит middleware, увидев переход на новый префикс. Дублировать запись
 * здесь незачем: одна точка ответственности вместо двух расходящихся.
 */
export function LanguageSwitcher({ current }: { current: Locale }) {
  const pathname = usePathname() || `/${current}`;

  const hrefFor = (locale: Locale) => {
    const segments = pathname.split("/");
    // segments[0] всегда пустая строка, segments[1] — текущая локаль.
    segments[1] = locale;
    return segments.join("/") || `/${locale}`;
  };

  return (
    <nav aria-label={localeLabel[current]} className="flex items-center gap-0.5 rounded-xl border border-line p-1">
      {locales.map((locale) => {
        const active = locale === current;
        return (
          <Link
            key={locale}
            href={hrefFor(locale)}
            hrefLang={locale}
            aria-current={active ? "true" : undefined}
            title={localeLabel[locale]}
            className={cn(
              "rounded-lg px-2.5 py-1.5 font-mono text-[0.7rem] font-medium transition-colors",
              active ? "bg-green text-ink" : "text-faint hover:text-text",
            )}
          >
            {localeShort[locale]}
          </Link>
        );
      })}
    </nav>
  );
}
