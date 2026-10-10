import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/ui/container";
import { razborBorrowedCopy, razborCopy } from "@/content/razbor/page-copy";
import { listRazbors } from "@/lib/razbor/store";
import { isLocale, type Locale } from "@/lib/i18n";
import { buildMetadata, siteUrl } from "@/lib/seo";
import {
  isRazborBorrowing,
  isRazborLocale,
  localeHref,
  type RazborBorrowing,
} from "@/lib/razbor/routing";

/**
 * Список приходит из базы — и собирается на каждый запрос.
 *
 * Раньше здесь стоял `revalidate = 60`. С 07.10.2026 сайт собирается в
 * GitHub, где базы нет, и копия со сборки выходила с пустым списком; после
 * каждой выкатки первый посетитель получал её, и только следующий — полную.
 * 10.10.2026 владелец так и увидел раздел: «с ПК разборов не вижу, пусто».
 * Чтение из базы короткое, страница лёгкая — кэш здесь не нужен.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (isLocale(locale) && isRazborBorrowing(locale)) {
    const copy = razborBorrowedCopy[locale];
    return buildMetadata({
      locale,
      path: "razbor",
      title: `${copy.title} — DevUz Studio`,
      description: copy.lead,
      // Список статей на чужом для страницы языке: в индексе ему не место,
      // поиску он дал бы только дубль русского списка. Сами русские статьи
      // робот находит по карте сайта, так что закрыть страницу целиком
      // (noindex, nofollow — так buildMetadata закрывает всё) ничего не теряет.
      noIndex: true,
      alternates: { ru: "razbor", uz: "razbor" },
    });
  }
  if (!isLocale(locale) || !isRazborLocale(locale)) return {};
  const copy = razborCopy[locale];

  return buildMetadata({
    locale,
    path: "razbor",
    title: `${copy.title} — DevUz Studio`,
    description: copy.lead,
    // Только русский и узбекский: на остальных языках раздела нет, и общее
    // правило обещало бы Google две несуществующие страницы.
    alternates: { ru: "razbor", uz: "razbor" },
  });
}

export default async function RazborIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (isLocale(raw) && isRazborBorrowing(raw)) return <BorrowedIndex locale={raw} />;
  // Разборы существуют только на русском и узбекском: это разные запросы,
  // а не перевод одного. На остальных языках раздела просто нет — пустая
  // страница под hreflang хуже её отсутствия.
  if (!isLocale(raw) || !isRazborLocale(raw)) notFound();
  const locale = raw;
  const copy = razborCopy[locale];
  const items = await listRazbors(locale);

  return (
    <Container className="pb-24 pt-36">
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.3em] text-green">
        {"// "}{copy.kicker}
      </p>
      <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
        {copy.title}
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{copy.lead}</p>

      {items.length === 0 ? (
        <section className="mt-12 max-w-2xl rounded-2xl border border-line bg-surface px-6 py-8">
          <p className="text-lg font-semibold">{copy.empty}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{copy.emptyNote}</p>
        </section>
      ) : (
        <ul className="mt-12 grid gap-5 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.slug}>
              <Link
                href={localeHref(locale, item.slug)}
                className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-6 transition-colors hover:border-green/40"
              >
                <span className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-faint">
                  {item.label}
                </span>
                <span className="mt-3 text-xl font-semibold leading-snug transition-colors group-hover:text-green">
                  {item.title}
                </span>
                <span className="mt-3 text-sm leading-relaxed text-muted">{item.description}</span>
                <span className="mt-auto pt-4 font-mono text-xs text-faint">
                  {item.findings.length}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-10 max-w-2xl text-xs leading-relaxed text-faint">{copy.anonymous}</p>

      <script
        type="application/ld+json"
        // Список разборов для поиска. Пустой раздел разметку не отдаёт:
        // ItemList без элементов — обещание, которого страница не держит.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            items.length
              ? {
                  "@context": "https://schema.org",
                  "@type": "ItemList",
                  itemListElement: items.map((item, i) => ({
                    "@type": "ListItem",
                    position: i + 1,
                    url: `${siteUrl}${localeHref(locale, item.slug)}`,
                    name: item.title,
                  })),
                }
              : {},
          ),
        }}
      />
    </Container>
  );
}

/**
 * Раздел на языке, для которого своих статей нет (украинский, польский).
 *
 * Подписи — на языке посетителя, статьи — русские, с меткой «RU» и
 * ссылкой на русский адрес. Выдавать русскую статью под украинским адресом
 * нельзя: это была бы та же страница под двумя языками, а разметка
 * пообещала бы перевод, которого нет.
 */
async function BorrowedIndex({ locale }: { locale: RazborBorrowing & Locale }) {
  const copy = razborBorrowedCopy[locale];
  const items = await listRazbors("ru");

  return (
    <Container className="pb-24 pt-36">
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.3em] text-green">
        {"// "}{copy.kicker}
      </p>
      <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
        {copy.title}
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{copy.lead}</p>
      <p className="mt-6 max-w-2xl rounded-2xl border border-line bg-surface px-5 py-4 text-sm leading-relaxed text-muted">
        {copy.languageNote}
      </p>

      {items.length === 0 ? (
        <section className="mt-12 max-w-2xl rounded-2xl border border-line bg-surface px-6 py-8">
          <p className="text-lg font-semibold">{copy.empty}</p>
        </section>
      ) : (
        <ul className="mt-12 grid gap-5 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.slug}>
              <Link
                href={localeHref("ru", item.slug)}
                hrefLang="ru"
                lang="ru"
                className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-6 transition-colors hover:border-green/40"
              >
                <span className="flex items-center gap-3 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-faint">
                  <span className="rounded border border-line px-1.5 py-0.5 text-green">{copy.badge}</span>
                  <span className="min-w-0 break-words">{item.label}</span>
                </span>
                <span className="mt-3 text-xl font-semibold leading-snug transition-colors group-hover:text-green">
                  {item.title}
                </span>
                <span className="mt-3 text-sm leading-relaxed text-muted">{item.description}</span>
                <span lang={locale} className="mt-auto pt-4 text-sm font-medium text-green">
                  {copy.readIn}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-10 max-w-2xl text-xs leading-relaxed text-faint">{copy.anonymous}</p>
    </Container>
  );
}
