import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { LeadgenCalc } from "@/components/leadgen/calc";
import { LeadFlow } from "@/components/leadgen/flow";
import { LeadgenForm } from "@/components/leadgen/form";
import {
  LEADGEN_COUNTRIES,
  LEADGEN_FAQ,
  LEADGEN_LOCALES,
  LEADGEN_NICHES,
  LEADGEN_PATH,
  LEADGEN_PROOF,
  LEADGEN_QUALIFIED,
  LEADGEN_SOURCES,
  LEADGEN_STEPS,
  LEADGEN_TARIFFS,
  perLead,
  rub,
} from "@/content/leadgen";
import { isLocale } from "@/lib/i18n";
import { faqSchema, jsonLdGraph } from "@/lib/schema";
import { buildMetadata } from "@/lib/seo";

/**
 * Лидогенерация — отдельное направление DevUz (content/leadgen.ts).
 * Только по-русски: клиенты в России, Беларуси и Казахстане.
 */
const TITLE = "Лидогенерация для бизнеса со звонком: квалифицированные лиды";
const DESCRIPTION =
  "Услуги лидогенерации: находим клиентов и прозваниваем каждого, отдаём запись разговора или переводим звонок вашему менеджеру. Россия, Беларусь, Казахстан.";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "ru") return {};
  return buildMetadata({
    locale,
    path: LEADGEN_PATH,
    title: TITLE,
    description: DESCRIPTION,
    alternates: { ru: LEADGEN_PATH },
  });
}

export default async function LeadgenPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (!(LEADGEN_LOCALES as readonly string[]).includes(locale)) redirect(`/ru/${LEADGEN_PATH}`);

  const test = LEADGEN_TARIFFS[0];
  const testPer = perLead(test);

  return (
    <div className="box-page">
      {/* Первый экран. */}
      <section aria-labelledby="leadgen-title" className="relative overflow-hidden border-b border-line">
        <span aria-hidden="true" className="leadgen-glow absolute inset-0" />
        <Container className="relative pb-16 pt-32 md:pb-24 md:pt-40">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-green">{"// "}Новое направление DevUz</p>
              <h1 id="leadgen-title" className="mt-4 font-display text-[clamp(2rem,4.8vw,3.6rem)] font-extrabold leading-[1.03] tracking-tight text-white">
                Лидогенерация со звонком
              </h1>
              <p className="mt-5 max-w-xl text-[1.02rem] leading-relaxed text-white/80 md:text-[1.1rem]">
                Находим людей, которые ищут вашу услугу, и прозваниваем каждого. Вам передаём только тех, кто готов
                покупать: с записью разговора или переводим звонок сразу на вашего менеджера.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {LEADGEN_COUNTRIES.map((c) => (
                  <span key={c} className="rounded-full border border-white/15 px-3 py-1 text-[0.82rem] text-white/80">
                    {c}
                  </span>
                ))}
                <span className="rounded-full border border-green/35 bg-green/10 px-3 py-1 text-[0.82rem] text-green">по договору</span>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a href="#start" className="box-cta inline-flex items-center rounded-full px-6 py-3 text-[0.95rem] font-semibold text-ink transition active:scale-[0.98]">
                  Тестовый прогон за {rub(test.price ?? 0)}
                </a>
                <a href="#tariffs" className="inline-flex items-center rounded-full border border-white/20 px-6 py-3 text-[0.95rem] font-semibold text-white transition hover:border-white/50">
                  Тарифы ↓
                </a>
              </div>
            </div>
            <div className="box-glass rounded-3xl p-6 sm:p-8">
              <p className="text-[0.8rem] uppercase tracking-[0.2em] text-white/55">Тестовый прогон</p>
              <p className="mt-2 font-display text-[clamp(2.4rem,6vw,3.6rem)] font-extrabold leading-none text-white">
                {test.leads?.[0]}–{test.leads?.[1]}
              </p>
              <p className="mt-2 text-white/75">квалифицированных лидов за {test.term}</p>
              {testPer ? (
                <p className="mt-4 text-[0.9rem] text-green">
                  {rub(testPer[0])}–{rub(testPer[1])} за лида
                </p>
              ) : null}
              <LeadFlow className="mt-6 text-white" />
            </div>
          </div>
        </Container>
      </section>

      {/* Цифры направления (владелец, 23.11.2026). */}
      <section aria-label="С кем работаем" className="border-b border-line py-12 md:py-16">
        <Container>
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { n: `${LEADGEN_PROOF.dental}`, t: "стоматологии на постоянной работе с нами" },
              { n: `${LEADGEN_PROOF.auto}`, t: "автосалонов" },
              { n: `${LEADGEN_PROOF.modular}`, t: "компании строят модульные дома" },
              { n: `${LEADGEN_PROOF.monthlyLeads.toLocaleString("ru-RU").replace(/ /g, "\u00a0")}+`, t: "лидов приводим им каждый месяц" },
            ].map((x) => (
              <li key={x.t} className="box-glass rounded-2xl p-5 sm:p-6">
                <p className="font-display text-[clamp(2rem,5vw,3rem)] font-extrabold leading-none text-white">{x.n}</p>
                <p className="mt-2 text-[0.9rem] leading-snug text-white/70">{x.t}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Ниши. */}
      <section aria-labelledby="leadgen-niches" className="border-b border-line py-20 md:py-28">
        <Container>
          <SectionHeading kicker="Ниши" title={<span id="leadgen-niches">Где мы сильнее всего</span>} description="Направления с высоким чеком: там каждый клиент окупает поток, и проверка звонком особенно выгодна." />
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {LEADGEN_NICHES.map((n, i) => (
              <Reveal key={n.key} delay={i * 80}>
                <article className="box-glass box-card h-full rounded-2xl p-6">
                  <span className="font-mono text-[0.7rem] text-green">0{i + 1}</span>
                  <h3 className="mt-3 text-[1.15rem] font-semibold text-white">{n.title}</h3>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-white/70">{n.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Как работаем. */}
      <section aria-labelledby="leadgen-how" className="border-b border-line py-20 md:py-28">
        <Container>
          <SectionHeading kicker="Как работаем" title={<span id="leadgen-how">От рекламы до вашего менеджера</span>} />
          <ol className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {LEADGEN_STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 80}>
                <li className="box-glass h-full rounded-2xl p-6">
                  <span className="font-mono text-[0.7rem] text-green">Шаг {i + 1}</span>
                  <h3 className="mt-3 text-[1.05rem] font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-[0.92rem] leading-relaxed text-white/70">{step.text}</p>
                </li>
              </Reveal>
            ))}
          </ol>
          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            <div className="box-glass rounded-2xl p-6">
              <h3 className="text-[1.05rem] font-semibold text-white">Откуда лиды</h3>
              <ul className="mt-4 space-y-2.5">
                {LEADGEN_SOURCES.map((x) => (
                  <li key={x} className="flex gap-2.5 text-[0.95rem] text-white/75">
                    <span aria-hidden="true" className="text-green">→</span>
                    {x}
                  </li>
                ))}
              </ul>
            </div>
            <div className="box-glass rounded-2xl p-6">
              <h3 className="text-[1.05rem] font-semibold text-white">Квалифицированный лид — это</h3>
              <ul className="mt-4 space-y-2.5">
                {LEADGEN_QUALIFIED.map((x) => (
                  <li key={x} className="flex gap-2.5 text-[0.95rem] text-white/75">
                    <span aria-hidden="true" className="text-green">✓</span>
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* Тарифы. */}
      <section id="tariffs" aria-labelledby="leadgen-tariffs" className="border-b border-line py-20 md:py-28">
        <Container>
          <SectionHeading kicker="Тарифы" title={<span id="leadgen-tariffs">Начните с теста, дальше по цифрам</span>} description="Количество лидов «от и до» фиксируем в договоре. Обработку лида после нашего звонка берёт на себя ваш отдел продаж." />
          <div className="mt-12">
            <LeadgenCalc />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {LEADGEN_TARIFFS.map((t, i) => {
              const per = perLead(t);
              return (
                <Reveal key={t.key} delay={i * 80}>
                  <article className={`box-glass box-card flex h-full flex-col rounded-2xl p-6 ${t.featured ? "border-green/40" : ""}`}>
                    <h3 className="text-[1.1rem] font-semibold text-white">{t.name}</h3>
                    <p className="mt-3 font-display text-[1.9rem] font-extrabold leading-none text-white">
                      {t.price === null ? "Договорная" : rub(t.price)}
                    </p>
                    <p className="mt-3 text-[0.95rem] text-green">
                      {t.leads ? `${t.leads[0]}–${t.leads[1]} лидов` : "скидки на объёме"}
                    </p>
                    {per ? <p className="mt-1 text-[0.82rem] text-white/55">{rub(per[0])}–{rub(per[1])} за лида</p> : null}
                    <p className="mt-1 text-[0.82rem] text-white/55">Срок: {t.term}</p>
                    <p className="mt-4 flex-1 text-[0.9rem] leading-relaxed text-white/70">{t.note}</p>
                    <a href="#start" className="mt-5 inline-flex justify-center rounded-full border border-white/20 px-5 py-2.5 text-[0.9rem] font-semibold text-white transition hover:border-white/50">
                      {t.price === null ? "Обсудить объём" : "Выбрать"}
                    </a>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Вопросы. */}
      <section aria-labelledby="leadgen-faq" className="border-b border-line py-20 md:py-28">
        <Container>
          <SectionHeading kicker="Вопросы" title={<span id="leadgen-faq">Коротко о главном</span>} />
          <div className="mt-10 max-w-3xl divide-y divide-white/10">
            {LEADGEN_FAQ.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="cursor-pointer list-none text-[1.02rem] font-semibold text-white">{f.q}</summary>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-white/70">{f.a}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      {/* Заявка. */}
      <section id="start" aria-labelledby="leadgen-start" className="py-20 md:py-28">
        <Container>
          <div className="box-glass mx-auto max-w-3xl rounded-3xl p-6 sm:p-10">
            <h2 id="leadgen-start" className="font-display text-[clamp(1.6rem,3.6vw,2.4rem)] font-extrabold leading-tight text-white">
              Обсудим тестовый прогон
            </h2>
            <p className="mt-3 text-white/70">Напишите нишу и город. Менеджер расскажет, сколько лидов реально получить у вас и с какого офера начать.</p>
            <div className="mt-6">
              <LeadgenForm />
            </div>
          </div>
        </Container>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdGraph(faqSchema(LEADGEN_FAQ.map((f) => ({ q: f.q, a: f.a })))) }} />
    </div>
  );
}
