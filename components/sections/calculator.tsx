import { PriceCalculator } from "@/components/calculator/price-calculator";
import { CodeBoot } from "@/components/ui/code-boot";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Dictionary } from "@/content/dictionaries";
import type { Locale } from "@/lib/i18n";

export function CalculatorSection({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <section id="calculator" className="border-t border-line py-24 md:py-32">
      <CodeBoot code={"estimate({ scope, weeks }) → \"от 24 000 000 UZS\""}>
      <Container>
        <SectionHeading
          kicker={dict.calculator.kicker}
          title={dict.calculator.title}
          description={dict.calculator.description}
        />
        <Reveal className="mt-14">
          <PriceCalculator locale={locale} dict={dict} />
        </Reveal>
      </Container>
      </CodeBoot>
    </section>
  );
}
