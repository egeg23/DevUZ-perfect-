import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CallHelperSignup } from "@/components/callhelper/signup";
import { Container } from "@/components/ui/container";
import { CALLHELPER_ANCHOR, CALLHELPER_COPY as C } from "@/content/callhelper";
import { CALLHELPER_API_PATH } from "@/content/callhelper-api";
import { CALLHELPER_EXT_PATH } from "@/content/callhelper-extension";
import { CALLHELPER_CABINET_PATH, CALLHELPER_OFFER_PATH, CALLHELPER_PAGE as P, CALLHELPER_PAGE_PATH } from "@/content/callhelper-page";
import { signupOpen } from "@/lib/callhelper/signup-store";
import { CALLHELPER_OVER_RUB, CALLHELPER_TARIFFS, CALLHELPER_TRIAL, launchText } from "@/lib/callhelper/tariffs";
import { isLocale } from "@/lib/i18n";
import { faqSchema, jsonLdGraph } from "@/lib/schema";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

/**
 * Страница продукта DevUz CallHelper (владелец, 26.11.2026: «Делай пока все
 * остальное»): что это, как работает, тарифы, данные, вопросы и
 * регистрация с пробным периодом. Регистрацию открывает владелец в разделе
 * CallHelper; пока закрыта, страница ведёт в лист ожидания на главной.
 * Только по-русски, как сам продукт.
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "ru") return {};
  return buildMetadata({ locale, path: CALLHELPER_PAGE_PATH, title: P.metaTitle, description: P.metaDescription, alternates: { ru: CALLHELPER_PAGE_PATH } });
}

const rub = (n: number) => `${n.toLocaleString("ru-RU")} ₽`;
const h2 = "font-display text-[clamp(1.4rem,2.6vw,1.9rem)] font-bold text-white";
const card = "rounded-2xl border border-line bg-surface/60 p-5";

export default async function CallHelperProductPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (locale !== "ru") redirect(`/ru/${CALLHELPER_PAGE_PATH}`);
  const open = await signupOpen();
  const offerHref = `/ru/${CALLHELPER_OFFER_PATH}`;

  return (
    <div className="box-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdGraph(faqSchema(P.faq.items.map((f) => ({ q: f.q, a: f.a })))) }} />
      <section className="border-b border-line">
        <Container className="pb-14 pt-32 md:pt-40">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-green">{"// "}DevUz CallHelper</p>
          <h1 className="mt-4 font-display text-[clamp(2rem,5vw,3.6rem)] font-extrabold leading-[1.03] tracking-tight text-white">{P.h1}</h1>
          <p className="mt-3 text-[clamp(1.05rem,2vw,1.35rem)] text-white/85">{P.sub}</p>
          <p className="mt-5 max-w-3xl text-[1.02rem] leading-relaxed text-white/75">{C.lead}</p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a href="#start" className="box-cta inline-flex items-center rounded-full px-6 py-3 text-[0.95rem] font-semibold text-ink">
              {open ? P.signup.title : "Лист ожидания"}
            </a>
            <Link href={`/ru/${CALLHELPER_EXT_PATH}`} className="inline-flex items-center rounded-full border border-white/20 px-6 py-3 text-[0.95rem] font-semibold text-white hover:border-white/50">
              Как поставить расширение
            </Link>
          </div>
          <p className="mt-4 text-[0.85rem] text-white/55">
            Пробный период: {CALLHELPER_TRIAL.days} дня и {CALLHELPER_TRIAL.minutes} минут разговора. {C.privacy}
          </p>
        </Container>
      </section>

      <Container className="grid gap-16 py-14">
        <section>
          <h2 className={h2}>{P.how.title}</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-2">
            {P.how.items.map((s, i) => (
              <li key={s.t} className={`${card} flex gap-4`}>
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-green/50 font-mono text-[0.85rem] text-green">{i + 1}</span>
                <span>
                  <b className="text-white">{s.t}</b>
                  <span className="mt-1 block text-[0.92rem] leading-relaxed text-white/75">{s.d}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className={h2}>{P.rules.title}</h2>
            <ul className="mt-5 grid gap-2.5">
              {P.rules.items.map((x) => (
                <li key={x} className="flex gap-3 text-[0.98rem] leading-relaxed text-white/80">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-green" />
                  {x}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[0.9rem] leading-relaxed text-white/60">{P.rules.note}</p>
          </div>
          <div>
            <h2 className={h2}>{P.fits.title}</h2>
            <p className="mt-5 text-[0.98rem] leading-relaxed text-white/80">{P.fits.lead}</p>
            <p className="mt-3 text-[0.98rem] leading-relaxed text-white/80">{P.fits.shift}</p>
            <p className="mt-5 text-[0.82rem] uppercase tracking-[0.18em] text-white/45">Кому подходит</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {C.who.map((w) => (
                <li key={w} className="rounded-full border border-line px-3 py-1.5 text-[0.85rem] text-white/75">
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section>
          <h2 className={h2}>{P.tariffs.title}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className={card}>
              <p className="text-[0.82rem] uppercase tracking-[0.18em] text-green">{P.tariffs.trial}</p>
              <p className="mt-3 font-display text-[1.9rem] font-extrabold text-white">0&nbsp;₽</p>
              <p className="mt-1 text-[0.92rem] text-white/75">
                {CALLHELPER_TRIAL.days} дня и {CALLHELPER_TRIAL.minutes} {C.minutes}
              </p>
              <p className="mt-3 text-[0.86rem] leading-relaxed text-white/55">{P.tariffs.trialNote}</p>
            </div>
            {CALLHELPER_TARIFFS.map((t) => (
              <div key={t.key} className={card}>
                <p className="text-[0.82rem] uppercase tracking-[0.18em] text-white/55">{t.name}</p>
                <p className="mt-3 font-display text-[1.9rem] font-extrabold text-white">{rub(t.rub)}</p>
                <p className="mt-1 text-[0.92rem] text-white/75">{C.per}</p>
                <p className="mt-3 text-[0.92rem] text-white/75">
                  {t.minutes.toLocaleString("ru-RU")} {C.minutes}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[0.9rem] text-white/60">
            Сверх пакета {CALLHELPER_OVER_RUB}&nbsp;₽ за минуту. Подключение тарифов с {launchText()}.
          </p>
        </section>

        <section>
          <h2 className={h2}>{P.data.title}</h2>
          <ul className="mt-5 grid gap-3 md:grid-cols-2">
            {P.data.items.map((x) => (
              <li key={x} className="box-glass rounded-2xl p-4 text-[0.92rem] leading-relaxed text-white/80">
                {x}
              </li>
            ))}
          </ul>
        </section>

        <section id="start" className="scroll-mt-28 rounded-3xl border border-green/30 bg-surface/70 p-6 md:p-9">
          {open ? (
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <h2 className={h2}>{P.signup.title}</h2>
                <p className="mt-4 text-[1rem] leading-relaxed text-white/80">{P.signup.lead}</p>
                <p className="mt-4 text-[0.9rem] text-white/60">{P.tariffs.trialNote}</p>
              </div>
              <CallHelperSignup offerHref={offerHref} />
            </div>
          ) : (
            <div>
              <h2 className={h2}>
                {P.signup.closedTitle} {launchText()}
              </h2>
              <p className="mt-4 max-w-2xl text-[1rem] leading-relaxed text-white/80">Оставьте контакт в листе ожидания: напишем первыми и дадим попробовать до запуска.</p>
              <a href={`/ru#${CALLHELPER_ANCHOR}`} className="box-cta mt-6 inline-flex items-center rounded-full px-6 py-3 text-[0.95rem] font-semibold text-ink">
                В лист ожидания
              </a>
            </div>
          )}
        </section>

        <section>
          <h2 className={h2}>{P.faq.title}</h2>
          <dl className="mt-5 grid gap-3">
            {P.faq.items.map((f) => (
              <div key={f.q} className={card}>
                <dt className="font-semibold text-white">{f.q}</dt>
                <dd className="mt-1.5 text-[0.94rem] leading-relaxed text-white/75">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <nav aria-label="Документы CallHelper" className="flex flex-wrap gap-x-6 gap-y-2 text-[0.92rem]">
          {[
            [`/ru/${CALLHELPER_EXT_PATH}`, "Установка расширения"],
            [`/ru/${CALLHELPER_CABINET_PATH}`, "Кабинет колл-центра"],
            [`/ru/${CALLHELPER_API_PATH}`, "Описание API"],
            [offerHref, "Оферта и обработка данных"],
          ].map(([href, text]) => (
            <Link key={href} href={href} className="text-green underline-offset-4 hover:underline">
              {text}
            </Link>
          ))}
        </nav>
      </Container>
    </div>
  );
}
