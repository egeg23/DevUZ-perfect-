import Link from "next/link";

import { DevuzPreview, type PreviewSnippet } from "@/components/sections/devuz-preview";
import { CodeBoot } from "@/components/ui/code-boot";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { caseBySlug, showcaseSlug } from "@/content/cases";
import { getDictionary, type Dictionary } from "@/content/dictionaries";
import { localeHref, localeShort, locales, t, type Locale } from "@/lib/i18n";

/**
 * Блок «этот сайт» на главной.
 *
 * Собственный сайт студии — единственный проект из библиотеки кейсов,
 * который посетитель может потрогать прямо сейчас, поэтому на главной он
 * показан не карточкой в общей сетке, а отдельным крупным блоком с живым
 * предпросмотром: слева — из чего он собран, справа — он сам, переключающий
 * языки и отвечающий в чате.
 *
 * Цифры и ссылка ведут в тот же кейс `devuz` из `content/cases.ts`: второй
 * копии текстов про этот сайт в проекте не заводится.
 */
export function DevuzShowcase({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const item = caseBySlug(showcaseSlug);
  // Кейс убрали из библиотеки — блок просто не рисуется, а не роняет главную.
  if (!item) return null;

  // Кадры начинаются с языка посетителя: первым он должен увидеть
  // читаемую страницу, а уже потом — как она переключается на остальные.
  const order = [locale, ...locales.filter((item) => item !== locale)];

  const snippets: PreviewSnippet[] = order.map((preview) => {
    const previewDict = getDictionary(preview);

    return {
      locale: preview,
      short: localeShort[preview],
      eyebrow: previewDict.hero.eyebrow,
      titleLead: previewDict.hero.titleLead,
      titleAccent: previewDict.hero.titleAccent,
      manager: previewDict.chat.title,
      online: previewDict.chat.online,
      thinking: previewDict.chat.thinking,
      promise: previewDict.chat.promise,
      ask: previewDict.devuz.demoAsk,
      reply: previewDict.devuz.demoReply,
    };
  });

  return (
    <section id="devuz" className="relative border-t border-line py-24 md:py-32">
      <CodeBoot code={"render(<DevUzStudio locale={locale} />)"}>
      <Container>
        <div className="grid items-center gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          <div>
            <SectionHeading
              kicker={dict.devuz.kicker}
              title={dict.devuz.title}
              description={dict.devuz.description}
            />

            <div className="mt-10 grid gap-5 sm:grid-cols-3 lg:grid-cols-1 lg:gap-5">
              {dict.devuz.points.map((point, i) => (
                <Reveal key={point.title} delay={i * 80}>
                  <div className="lg:flex lg:gap-4">
                    <span className="font-mono text-[0.68rem] text-green lg:pt-0.5">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="mt-2 lg:mt-0">
                      <h3 className="text-[1.02rem] font-semibold leading-snug">
                        {point.title}
                      </h3>
                      <p className="mt-1.5 text-[0.88rem] leading-relaxed text-muted">
                        {point.text}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={120}>
              <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4 border-t border-line pt-7">
                {item.metrics.map((metric) => (
                  <div key={metric.value + t(metric.label, locale)}>
                    <p className="font-display text-2xl font-bold leading-none text-green">
                      {metric.value}
                    </p>
                    <p className="mt-1.5 max-w-[11rem] text-[0.7rem] leading-snug text-faint">
                      {t(metric.label, locale)}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={180}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href={localeHref(locale, `cases/${item.slug}`)}
                  className="inline-flex items-center gap-2.5 rounded-xl bg-green px-6 py-3.5 text-[0.95rem] font-semibold text-ink transition-all duration-300 hover:bg-white hover:shadow-[0_0_40px_-8px_var(--color-green)]"
                >
                  {dict.devuz.openCase}
                  <span aria-hidden="true">→</span>
                </Link>
                <Link
                  href={localeHref(locale, "calculator")}
                  className="rounded-xl border border-line px-6 py-3.5 text-[0.95rem] font-medium text-text transition-colors hover:border-green hover:text-green"
                >
                  {dict.cta.calculate}
                </Link>
              </div>
            </Reveal>
          </div>

          <Reveal delay={100}>
            <p className="mb-3 font-mono text-[0.64rem] uppercase tracking-[0.24em] text-faint">
              {"// "}
              {dict.devuz.previewLabel}
            </p>

            <DevuzPreview snippets={snippets} />

            <p className="mt-4 max-w-md text-[0.8rem] leading-relaxed text-faint">
              {dict.devuz.previewNote}
            </p>
          </Reveal>
        </div>
      </Container>
      </CodeBoot>
    </section>
  );
}
