import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/ui/container";
import { company } from "@/content/company";
import type { Dictionary } from "@/content/dictionaries";
import { services } from "@/content/services";
import { localeHref, t, type Locale } from "@/lib/i18n";

export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-surface/40">
      <Container className="py-16">
        <div className="grid gap-12 md:grid-cols-[1.6fr_1fr_1fr_1.2fr]">
          <div>
            <Logo size={34} />
            <p className="mt-5 max-w-xs text-[0.92rem] leading-relaxed text-muted">
              {dict.footer.tagline}
            </p>
          </div>

          <div>
            <h3 className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-faint">
              {dict.footer.services}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {services.map((service) => (
                <li key={service.slug}>
                  <Link
                    href={localeHref(locale, `services/${service.slug}`)}
                    className="text-[0.9rem] text-muted transition-colors hover:text-text"
                  >
                    {t(service.title, locale)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-faint">
              {dict.footer.company}
            </h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href={localeHref(locale, "cases")} className="text-[0.9rem] text-muted transition-colors hover:text-text">
                  {dict.nav.cases}
                </Link>
              </li>
              <li>
                <Link href={localeHref(locale, "about")} className="text-[0.9rem] text-muted transition-colors hover:text-text">
                  {dict.nav.about}
                </Link>
              </li>
              <li>
                <Link href={localeHref(locale, "contact")} className="text-[0.9rem] text-muted transition-colors hover:text-text">
                  {dict.nav.contacts}
                </Link>
              </li>
              <li>
                <Link href={localeHref(locale, "privacy")} className="text-[0.9rem] text-muted transition-colors hover:text-text">
                  {dict.footer.privacy}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-faint">
              {dict.footer.contacts}
            </h3>
            <ul className="mt-4 space-y-2.5 text-[0.9rem]">
              <li>
                <a
                  href={company.telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green transition-colors hover:text-white"
                >
                  Telegram @{company.telegram}
                </a>
              </li>
              <li>
                <Link href={localeHref(locale, "contact")} className="text-muted transition-colors hover:text-text">
                  {dict.cta.writeUs}
                </Link>
              </li>
              <li className="text-faint">{t(company.address.city, locale)}, {t(company.address.countryName, locale)}</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-line pt-7 text-[0.8rem] text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {company.name}. {dict.footer.rights}.
          </p>
          <p className="font-mono">{dict.footer.madeIn} 🇺🇿</p>
        </div>
      </Container>
    </footer>
  );
}
