import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DemoChat } from "@/components/ai-staff/demo-chat";
import { Container } from "@/components/ui/container";
import { LANDING_LOCALES, LANDING_PATH, landing, type LandingLocale } from "@/content/ai-staff/landing";
import { serviceBotUsername } from "@/lib/ai-staff/channels";
import { serviceEnabled, setting } from "@/lib/ai-staff/store";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

const isLandingLocale = (value: string): value is LandingLocale => (LANDING_LOCALES as readonly string[]).includes(value);
const ALTERNATES = { ru: LANDING_PATH, uz: LANDING_PATH };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLandingLocale(locale)) return {};
  const copy = landing[locale];
  return buildMetadata({ locale, path: LANDING_PATH, title: copy.seoTitle, description: copy.seoDescription, alternates: ALTERNATES });
}

/** Страница сервиса ИИ-сотрудников. Пока сервис выключен — её нет. */
export default async function AiStaffLanding({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLandingLocale(locale) || !(await serviceEnabled())) notFound();
  const copy = landing[locale];
  const [bot, demoKey] = await Promise.all([serviceBotUsername(), setting<string>("demo_widget_key")]);
  const start = bot ? `https://t.me/${bot}?start=login` : "/cabinet/login";

  return (
    <Container className="space-y-20 pb-24 pt-36">
      <section className="grid items-start gap-10 lg:grid-cols-2">
        <div>
          <h1 className="text-[clamp(2rem,5.5vw,3.25rem)] font-bold leading-[1.1]">{copy.title}</h1>
          <p className="mt-6 text-lg text-muted">{copy.lead}</p>
          <a href={start} className="mt-8 inline-block rounded-xl bg-green-dim px-6 py-3 font-semibold text-ink hover:bg-green">
            {copy.cta}
          </a>
          <p className="mt-3 text-sm text-faint">{copy.ctaNote}</p>
        </div>
        <div>
          <h2 className="mb-2 text-lg font-semibold">{copy.demoTitle}</h2>
          <p className="mb-4 text-sm text-muted">{copy.demoNote}</p>
          {demoKey ? (
            <DemoChat
              widgetKey={demoKey}
              labels={{ ph: copy.demoPh, send: copy.demoSend, fail: copy.demoFail, hello: locale === "uz" ? "Assalomu alaykum! Nima bilan yordam beray?" : "Здравствуйте! Чем помочь?" }}
            />
          ) : (
            <p className="rounded-2xl border border-line p-6 text-sm text-muted">{copy.demoOff}</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-6 text-2xl font-semibold">{copy.howTitle}</h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {copy.how.map((step, i) => (
            <li key={step.title} className="rounded-2xl border border-line bg-surface p-5">
              <div className="text-sm text-green">{i + 1}</div>
              <div className="mt-1 font-semibold">{step.title}</div>
              <p className="mt-2 text-sm text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="mb-6 text-2xl font-semibold">{copy.whatTitle}</h2>
        <ul className="space-y-3">
          {copy.what.map((line) => (
            <li key={line} className="flex gap-3 text-muted">
              <span className="text-green">✓</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-2xl font-semibold">{copy.pricesTitle}</h2>
        <p className="mb-6 text-sm text-muted">{copy.pricesNote}</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {copy.plans.map((plan) => (
            <div key={plan.name} className="rounded-2xl border border-line bg-surface p-5">
              <div className="font-semibold">{plan.name}</div>
              <div className="mt-1 text-xl">{plan.price}</div>
              <ul className="mt-3 space-y-1 text-sm text-muted">
                {plan.lines.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-6 text-2xl font-semibold">{copy.faqTitle}</h2>
        <dl className="space-y-5">
          {copy.faq.map((item) => (
            <div key={item.q}>
              <dt className="font-semibold">{item.q}</dt>
              <dd className="mt-1 text-muted">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </Container>
  );
}
