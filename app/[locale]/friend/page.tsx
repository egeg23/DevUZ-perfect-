import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/ui/container";
import { company } from "@/content/company";
import { FRIEND_PATH, friendSite } from "@/content/friend-site";
import { isLocale } from "@/lib/i18n";
import { FRIEND_GIFT_USD, FRIEND_START } from "@/lib/partners/friend";
import { buildMetadata } from "@/lib/seo";

/**
 * «Приведи друга — сайт бесплатно» (владелец, 22.11.2026): условия коротко и
 * кнопка в бота, где человек одной кнопкой получает ссылку и слово
 * (lib/partners/friend-bot). Цена — FRIEND_GIFT_USD, та же, что считает код.
 */

function price(locale: string): string {
  return locale === "ru" || locale === "uz" || locale === "uk" ? `${FRIEND_GIFT_USD} $` : `$${FRIEND_GIFT_USD}`;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = friendSite[locale];
  return buildMetadata({ locale, path: FRIEND_PATH, title: t.title, description: t.lead(price(locale)).slice(0, 160) });
}

export default async function FriendPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = friendSite[locale];
  const p = price(locale);
  const bot = `${company.telegramUrl}?start=${FRIEND_START}`;

  return (
    <Container className="max-w-3xl pb-28 pt-36">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-green">🎁 {company.name}</p>
      <h1 className="mt-4 text-[clamp(2rem,4.4vw,3rem)] font-extrabold leading-[1.08]">{t.title}</h1>
      <p className="mt-6 text-[1.05rem] leading-relaxed text-muted">{t.lead(p)}</p>

      <h2 className="mt-12 text-xl font-semibold">{t.stepsTitle}</h2>
      <ol className="mt-5 grid gap-3">
        {t.steps(p).map((step, i) => (
          <li key={step} className="flex gap-4 rounded-2xl border border-line bg-surface px-5 py-4">
            <span className="font-mono text-lg font-semibold text-green">{i + 1}</span>
            <span className="leading-relaxed text-muted">{step}</span>
          </li>
        ))}
      </ol>

      <h2 className="mt-12 text-xl font-semibold">{t.rulesTitle}</h2>
      <ul className="mt-5 grid gap-2 text-muted">
        {t.rules(p).map((rule) => (
          <li key={rule} className="flex gap-3 leading-relaxed">
            <span className="text-green">✓</span>
            <span>{rule}</span>
          </li>
        ))}
      </ul>

      <div className="mt-12 flex flex-wrap items-center gap-4">
        <a
          href={bot}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl bg-green px-6 py-3 font-semibold text-ink transition hover:opacity-90"
        >
          {t.cta}
        </a>
        <span className="text-sm text-faint">{t.ctaNote}</span>
      </div>
    </Container>
  );
}
