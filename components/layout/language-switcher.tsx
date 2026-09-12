"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { localeLabel, localeShort, locales, type Locale } from "@/lib/i18n";

/** Год: столько живёт осознанный выбор языка. */
const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Переключатель языка.
 *
 * Меняет только первый сегмент пути, поэтому пользователь остаётся на той же
 * странице, а не улетает на главную — а это, помимо удобства, ещё и сигнал
 * связности для поисковика: каждая языковая версия ссылается на свою пару.
 *
 * Здесь же — единственное место, где записывается кука языка. Middleware её
 * не пишет намеренно: со стороны сервера нажатие на этот переключатель и
 * переход по чужой ссылке на /ru/… выглядят одинаково, и раньше достаточно
 * было один раз открыть русскую страницу из поиска, чтобы англоязычный
 * посетитель навсегда остался на русском. Выбор языка человек делает вот
 * этим кликом — значит и запоминать его нужно ровно здесь.
 *
 * Две формы. Развёрнутая — все четыре языка в строку, для мобильного меню,
 * где места вдоволь. Свёрнутая — текущий язык и список по нажатию, для
 * шапки: четыре кода занимали там 159 px, из-за которых не помещалось само
 * меню. Язык и так определяется сам (middleware.ts: кука, иначе
 * accept-language), поэтому переключатель — редкое действие, и держать его
 * всё время развёрнутым незачем.
 *
 * В свёрнутой форме ссылки остаются в разметке всегда и прячутся стилями, а
 * не условным рендером. Поисковику этого хватило бы и без них — полный
 * набор hreflang стоит в head, — но ссылка, которой нет в DOM, недоступна и
 * тем, кто ходит по странице не мышью.
 */
export function LanguageSwitcher({
  current,
  compact = false,
}: {
  current: Locale;
  compact?: boolean;
}) {
  const pathname = usePathname() || `/${current}`;
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onAway = (event: MouseEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onAway);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onAway);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const remember = (locale: Locale) => {
    // Пишем синхронно в обработчике клика, до того как Next начнёт переход:
    // следующий заход на «/» должен увидеть уже новую куку.
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
  };

  const hrefFor = (locale: Locale) => {
    const segments = pathname.split("/");
    // segments[0] всегда пустая строка, segments[1] — текущая локаль.
    segments[1] = locale;
    return segments.join("/") || `/${locale}`;
  };

  const item = (locale: Locale, active: boolean) => (
    <Link
      key={locale}
      href={hrefFor(locale)}
      hrefLang={locale}
      onClick={() => {
        remember(locale);
        setOpen(false);
      }}
      aria-current={active ? "true" : undefined}
      title={localeLabel[locale]}
      className={cn(
        // whitespace-nowrap: «中文» — два иероглифа, и в сжатой строке они
        // разъезжались на две строки, делая всю шапку выше.
        "whitespace-nowrap rounded-lg px-2.5 py-1.5 font-mono text-[0.7rem] font-medium transition-colors",
        active ? "bg-green text-ink" : "text-faint hover:text-text",
      )}
    >
      {localeShort[locale]}
    </Link>
  );

  if (!compact) {
    return (
      <nav
        aria-label={localeLabel[current]}
        className="flex items-center gap-0.5 rounded-xl border border-line p-1"
      >
        {locales.map((locale) => item(locale, locale === current))}
      </nav>
    );
  }

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={localeLabel[current]}
        className="flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-line px-2.5 py-1.5 font-mono text-[0.7rem] font-medium text-muted transition-colors hover:text-text"
      >
        {localeShort[current]}
        <span
          aria-hidden="true"
          className={cn("text-[0.6rem] transition-transform", open && "rotate-180")}
        >
          ▾
        </span>
      </button>

      {/* Ссылки в разметке всегда, скрыты стилями: так они остаются доступны
          навигации с клавиатуры и не исчезают из страницы целиком. */}
      <nav
        aria-label={localeLabel[current]}
        className={cn(
          "absolute right-0 top-full z-50 mt-2 flex flex-col gap-0.5 rounded-xl border border-line bg-surface p-1 shadow-[0_16px_40px_rgba(0,0,0,.5)]",
          open ? "flex" : "hidden",
        )}
      >
        {locales.map((locale) => item(locale, locale === current))}
      </nav>
    </div>
  );
}
