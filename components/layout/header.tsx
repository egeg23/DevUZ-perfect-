"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Logo } from "@/components/brand/logo";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Container } from "@/components/ui/container";
import type { Dictionary } from "@/content/dictionaries";
import { cn } from "@/lib/cn";
import { localeHref, type Locale } from "@/lib/i18n";

export function Header({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Шапка получает фон только после того, как герой уехал вверх — над
    // дождём кода сплошная плашка выглядела бы заплаткой.
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: localeHref(locale, "services"), label: dict.nav.services },
    { href: localeHref(locale, "calculator"), label: dict.nav.calculator },
    { href: localeHref(locale, "cases"), label: dict.nav.cases },
    { href: `${localeHref(locale)}#process`, label: dict.nav.process },
    { href: localeHref(locale, "about"), label: dict.nav.about },
    { href: localeHref(locale, "contact"), label: dict.nav.contacts },
  ];

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled
          ? "border-b border-line bg-ink/85 backdrop-blur-xl"
          : "border-b border-transparent",
      )}
    >
      <Container className="flex h-[4.5rem] items-center gap-8">
        <Link href={localeHref(locale)} className="shrink-0" aria-label="DevUz Studio">
          <Logo size={34} animated />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label={dict.nav.services}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="link-underline text-[0.92rem] text-muted transition-colors hover:text-text"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden sm:block">
            <LanguageSwitcher current={locale} />
          </div>
          <Link
            href={localeHref(locale, "contact")}
            className="hidden rounded-xl bg-green px-4 py-2.5 text-[0.88rem] font-semibold text-ink transition-colors hover:bg-white md:inline-flex"
          >
            {dict.cta.discuss}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={dict.nav.services}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line lg:hidden"
          >
            <span className="relative block h-3 w-4">
              <span
                className={cn(
                  "absolute left-0 h-[1.5px] w-4 bg-text transition-all duration-300",
                  open ? "top-1.5 rotate-45" : "top-0",
                )}
              />
              <span
                className={cn(
                  "absolute left-0 top-1.5 h-[1.5px] w-4 bg-text transition-all duration-300",
                  open && "opacity-0",
                )}
              />
              <span
                className={cn(
                  "absolute left-0 h-[1.5px] w-4 bg-text transition-all duration-300",
                  open ? "top-1.5 -rotate-45" : "top-3",
                )}
              />
            </span>
          </button>
        </div>
      </Container>

      {open ? (
        <div className="border-t border-line bg-ink/95 backdrop-blur-xl lg:hidden">
          <Container className="flex flex-col gap-1 py-5">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-3 text-[1.05rem] text-muted transition-colors hover:bg-surface hover:text-text"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 sm:hidden">
              <LanguageSwitcher current={locale} />
            </div>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
