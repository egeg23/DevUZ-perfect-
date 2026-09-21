import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/ui/container";
import { razborCopy } from "@/content/razbor/page-copy";
import type { RazborFinding, RazborShot } from "@/content/razbor/items";
import { evidenceFor } from "@/lib/razbor/evidence";
import { listRazbors, razborBySlug, siblings } from "@/lib/razbor/store";
import { isLocale } from "@/lib/i18n";
import { buildMetadata, siteUrl } from "@/lib/seo";
import { RAZBOR_LOCALES, isRazborLocale, localeHref } from "@/lib/razbor/routing";
import type { RazborLocale } from "@/lib/razbor/model";
import { serviceFor } from "@/lib/razbor/service-link";

/**
 * Разборы приходят из базы, а не только из репозитория.
 *
 * Раньше здесь стояло `dynamicParams = false`, а список адресов строился из
 * `content/razbor/items.ts` — файла, который пуст с самого начала. Это и был
 * ответ на «нажал опубликовать, а на странице ничего не появилось»: кнопка
 * честно писала в базу, а маршрут знал ровно те адреса, что были известны на
 * сборке, и всем остальным отвечал 404. Опубликовать что-либо без выкатки
 * было нельзя в принципе.
 *
 * Теперь известные на сборке адреса по-прежнему собираются заранее — ради
 * скорости, — а новый открывается по первому запросу. Плюс `revalidate`:
 * даже если сброс кэша из панели не дойдёт, страница обновится сама в
 * пределах минуты, а не будет ждать следующей выкатки.
 */
export const revalidate = 60;

export async function generateStaticParams() {
  const lists = await Promise.all(
    RAZBOR_LOCALES.map(async (locale) =>
      (await listRazbors(locale)).map((item) => ({ locale: locale as string, slug: item.slug })),
    ),
  );
  return lists.flat();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !isRazborLocale(locale)) return {};
  const item = await razborBySlug(locale, slug);
  if (!item) return {};

  return buildMetadata({
    locale,
    path: `razbor/${slug}`,
    title: item.title,
    description: item.description,
  });
}

function day(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}.${m}.${y}`;
}

export default async function RazborPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw) || !isRazborLocale(raw)) notFound();
  const locale = raw;
  const item = await razborBySlug(locale, slug);
  if (!item) notFound();

  const copy = razborCopy[locale];
  const near = await siblings(item);
  const service = serviceFor(item.niche);
  const images = [item.shots.beforeDesktop, item.shots.afterDesktop]
    .filter(Boolean)
    .map((src) => (src.startsWith("/") ? `${siteUrl}${src}` : src));

  return (
    <Container className="pb-24 pt-36">
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.3em] text-green">
        {"// "}{item.label}
      </p>
      <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
        {item.title}
      </h1>

      <div className="mt-10 max-w-3xl space-y-4 text-lg leading-relaxed text-muted">
        {item.intro.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      {/* ── Как есть ─────────────────────────────────────────────────── */}
      {item.shots.beforeDesktop || item.shots.beforeMobile ? (
        <section className="mt-14">
          <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.25em] text-faint">
            {copy.before}
          </h2>
          <Shot
            desktop={item.shots.beforeDesktop}
            mobile={item.shots.beforeMobile}
            alt={`${copy.before}: ${item.label}`}
          />
          <p className="mt-3 text-xs text-faint">
            {copy.shotOn} {day(item.shotTakenAt)}
          </p>
        </section>
      ) : null}

      {/* ── Находки ──────────────────────────────────────────────────── */}
      <section className="mt-14">
        <h2 className="text-2xl font-semibold tracking-tight">{copy.whatBreaks}</h2>
        <div className="mt-6 flex flex-col gap-6">
          {item.findings.map((finding) => (
            <article key={finding.title} className="rounded-2xl border border-line bg-surface p-6">
              <h3 className="text-lg font-semibold leading-snug">{finding.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                <span className="text-faint">{copy.whatItCosts}. </span>
                {finding.impact}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                <span className="text-green">{copy.howWeFix}. </span>
                {finding.fix}
              </p>
              <Evidence finding={finding} shots={item.shots.findings} locale={locale} />
            </article>
          ))}
        </div>
      </section>

      {/* ── Как сделали бы мы ────────────────────────────────────────── */}
      {item.shots.afterDesktop || item.shots.afterMobile ? (
        <section className="mt-14">
          <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.25em] text-green">
            {copy.after}
          </h2>
          <Shot
            desktop={item.shots.afterDesktop}
            mobile={item.shots.afterMobile}
            alt={`${copy.after}: ${item.label}`}
          />
        </section>
      ) : null}

      <section className="mt-14 max-w-3xl">
        <h2 className="text-2xl font-semibold tracking-tight">{copy.outcome}</h2>
        <div className="mt-4 space-y-4 text-lg leading-relaxed text-muted">
          {item.outcome.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      {/* Во что это обходится — между находками и ценой.
          Порядок не случайный: сначала человек видит, что не так, потом
          сколько это стоит ему, и только потом сколько стоит починить. В
          обратном порядке цена читается как запрос денег ни за что.

          Числа — на сто посетителей. Посещаемость чужого сайта мы не
          знаем, и подставить туда «обычно столько-то» значило бы выдумать
          ровно ту цифру, за которую разбор и ругает. */}
      {item.lostPer100 && item.lostPer100[1] > 0 ? (
        <section className="mt-10 max-w-3xl rounded-2xl border border-amber-500/40 bg-amber-500/5 px-6 py-5">
          <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.25em] text-faint">
            {copy.lossTitle}
          </h2>
          <p className="mt-2 text-lg leading-relaxed">
            {copy.lossBody
              .replace("{lo}", String(item.lostPer100[0]))
              .replace("{hi}", String(item.lostPer100[1]))}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-faint">{copy.lossHow}</p>
        </section>
      ) : null}

      <section className="mt-10 max-w-3xl rounded-2xl border border-line bg-surface px-6 py-5">
        <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.25em] text-faint">
          {copy.price}
        </h2>
        <p className="mt-2 text-lg leading-relaxed">{item.price}</p>
        {/* Ссылка на профильную услугу — единственная продающая ссылка
            внутри статьи. Стоит у цены, а не в конце: человек, дочитавший
            до суммы, уже прикидывает бюджет, и именно здесь ему нужен
            переход, а не ещё один призыв проверить свой сайт. */}
        <Link
          href={`/${locale}/services/${service}`}
          className="mt-4 inline-block text-sm text-green underline underline-offset-4 transition-colors hover:text-white"
        >
          {copy.serviceLink}
        </Link>
      </section>

      <p className="mt-8 max-w-3xl text-xs leading-relaxed text-faint">{copy.anonymous}</p>

      <section className="mt-12 flex flex-wrap items-center gap-4 rounded-2xl border border-green/30 bg-green/5 px-6 py-5">
        <p className="flex-1 text-lg font-semibold">{copy.cta}</p>
        <Link
          href={`/${locale}/audit`}
          className="rounded-xl bg-green px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-white"
        >
          {copy.ctaButton}
        </Link>
      </section>

      {near.length ? (
        <section className="mt-14">
          <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.25em] text-faint">
            {copy.more}
          </h2>
          <ul className="mt-4 flex flex-col gap-2">
            {near.map((other) => (
              <li key={other.slug}>
                <Link
                  href={localeHref(locale, other.slug)}
                  className="text-sm text-muted transition-colors hover:text-green"
                >
                  {other.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Хлебные крошки отдельным блоком, а не полем внутри Article:
          Google читает BreadcrumbList как самостоятельную сущность и
          показывает путь вместо голого адреса в строке результата. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: copy.title,
                item: `${siteUrl}${localeHref(locale)}`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: item.title,
                item: `${siteUrl}${localeHref(locale, item.slug)}`,
              },
            ],
          }),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: item.title,
            description: item.description,
            datePublished: item.publishedAt,
            inLanguage: locale,
            author: { "@type": "Organization", name: "DevUz Studio", url: siteUrl },
            publisher: { "@type": "Organization", name: "DevUz Studio", url: siteUrl },
            // Только те снимки, которые есть. Ссылка на несуществующую
            // картинку в разметке — это ошибка в панели вебмастера и повод
            // для Google не доверять остальной разметке страницы.
            ...(images.length ? { image: images } : {}),
            mainEntityOfPage: `${siteUrl}${localeHref(locale, item.slug)}`,
          }),
        }}
      />
    </Container>
  );
}

/**
 * Пара снимков: широкий и телефонный.
 *
 * Размеры проставлены явно — без них страница дёргается при загрузке, и
 * это видит Google в метрике сдвига макета. Телефонный снимок не
 * декоративный: почти в каждом разборе есть находка про телефон, и без
 * него сравнение «было — стало» её не показывает.
 *
 * Отсутствующий снимок не рисуется вовсе. Пустая строка в `src` у next/image
 * — это исключение при отрисовке, то есть пятисотая на странице, которая
 * пришла из поиска; а рамка-заглушка на её месте означала бы, что студия,
 * разбирающая чужие сайты, показывает битую картинку на своём.
 */
function Shot({ desktop, mobile, alt }: { desktop: string; mobile: string; alt: string }) {
  if (!desktop && !mobile) return null;

  return (
    <div className={`mt-5 grid gap-4 ${desktop && mobile ? "sm:grid-cols-[1fr_auto]" : ""}`}>
      {desktop ? (
        <Image
          src={desktop}
          alt={alt}
          width={1440}
          height={900}
          className="w-full rounded-xl border border-line"
        />
      ) : null}
      {mobile ? (
        <Image
          src={mobile}
          alt={`${alt} — ${"390"}px`}
          width={390}
          height={844}
          className="mx-auto w-40 rounded-xl border border-line sm:w-32"
        />
      ) : null}
    </div>
  );
}

/**
 * Снимок того места, о котором находка.
 *
 * Это и есть разница между разбором и списком придирок. «Телефон на сайте
 * нельзя нажать с телефона» — утверждение; тот же текст со снимком шапки, на
 * котором номер обведён и видно, что он не ссылка, — доказательство. Читатель
 * приходит из поиска к незнакомой студии, и верить ей на слово у него причин
 * нет.
 *
 * Снимка может не быть по двум честным причинам: находка не про то, что
 * видно глазами (карта сайта, время ответа сервера), или съёмка ещё не
 * дошла до этого разбора. В обоих случаях блок просто не рисуется.
 */
function Evidence({
  finding,
  shots,
  locale,
}: {
  finding: RazborFinding;
  shots: Readonly<Record<string, RazborShot>>;
  locale: RazborLocale;
}) {
  const shot = finding.code ? shots[finding.code] : undefined;
  const rule = evidenceFor(finding.code);
  if (!shot || !rule) return null;

  return (
    <figure className="mt-4">
      <Image
        src={shot.src}
        alt={`${rule.caption[locale]}: ${finding.title}`}
        width={shot.width}
        height={shot.height}
        // Телефонный снимок не растягиваем на всю ширину карточки: в
        // натуральную величину видно ровно то, что видит посетитель.
        className={`rounded-xl border border-line ${rule.screen === "mobile" ? "w-48" : "w-full"}`}
      />
      <figcaption className="mt-2 text-xs text-faint">{rule.caption[locale]}</figcaption>
    </figure>
  );
}
