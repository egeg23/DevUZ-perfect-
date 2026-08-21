import Link from "next/link";

import { Container } from "@/components/ui/container";
import { getDictionary } from "@/content/dictionaries";
import { defaultLocale, localeHref } from "@/lib/i18n";

/**
 * not-found внутри [locale] рендерится вне контекста параметров маршрута,
 * поэтому локаль здесь недоступна — берём язык по умолчанию.
 */
export default function NotFound() {
  const dict = getDictionary(defaultLocale);

  return (
    <Container className="flex min-h-[70svh] flex-col items-center justify-center py-32 text-center">
      <p className="font-mono text-[5rem] font-bold leading-none text-green">404</p>
      <h1 className="mt-6 text-3xl font-bold">{dict.notFound.title}</h1>
      <p className="mt-4 max-w-md text-muted">{dict.notFound.text}</p>
      <Link
        href={localeHref(defaultLocale)}
        className="mt-9 rounded-xl bg-green px-6 py-3.5 font-semibold text-ink transition-colors hover:bg-white"
      >
        {dict.cta.backHome}
      </Link>
    </Container>
  );
}
