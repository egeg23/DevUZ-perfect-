import Link from "next/link";

import { MarketingCalculator } from "@/components/marketing/marketing-calculator";
import { CodeBoot } from "@/components/ui/code-boot";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { MARKETING_PATH, marketingCopy } from "@/content/marketing";
import { localeHref, type Locale } from "@/lib/i18n";

/**
 * Маркетинг на главной: сразу после калькулятора сайта.
 *
 * Стоит именно там: человек только что посчитал сайт, и следующий вопрос у
 * него — кто приведёт на этот сайт людей. Здесь же предложение «сайт +
 * маркетинг»: исправления и SEO-доработки бесплатно.
 */
export function MarketingSection({ locale }: { locale: Locale }) {
  const copy = marketingCopy[locale];
  return (
    <section id="marketing" className="border-t border-line py-24 md:py-32">
      <CodeBoot code={"promote({ site, channels, budget }) → leads"}>
        <Container>
          <SectionHeading kicker={copy.homeKicker} title={copy.homeTitle} description={copy.homeLead} />
          <Reveal className="mt-8">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-green/40 bg-green/[0.07] px-5 py-4">
              <span className="rounded-full border border-green/40 px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-green">
                {copy.utp.badge}
              </span>
              <p className="flex-1 text-[0.95rem] font-medium leading-snug">{copy.utp.title}</p>
            </div>
          </Reveal>
          <Reveal className="mt-12">
            <MarketingCalculator locale={locale} copy={copy} />
          </Reveal>
          <Link
            href={localeHref(locale, MARKETING_PATH)}
            className="mt-10 inline-block text-[0.95rem] text-green underline underline-offset-4 transition-colors hover:text-white"
          >
            {copy.homeMore} →
          </Link>
        </Container>
      </CodeBoot>
    </section>
  );
}
