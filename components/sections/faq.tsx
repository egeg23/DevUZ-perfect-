import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Dictionary } from "@/content/dictionaries";

export function FaqSection({ dict }: { dict: Dictionary }) {
  return (
    <section id="faq" className="border-t border-line py-24 md:py-32">
      <Container>
        <SectionHeading kicker={dict.faq.kicker} title={dict.faq.title} />

        <div className="mt-12 max-w-3xl">
          {dict.faq.items.map((item, i) => (
            <Reveal key={item.q} delay={i * 50}>
              {/* Нативный details вместо самописного аккордеона: он доступен
                  с клавиатуры, работает без JavaScript и его содержимое
                  индексируется даже в свёрнутом виде. */}
              <details className="group border-b border-line py-5">
                <summary className="flex cursor-pointer list-none items-center gap-4 text-[1.02rem] font-medium marker:hidden">
                  <span className="flex-1">{item.q}</span>
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line text-green transition-transform duration-300 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-4 max-w-2xl text-[0.94rem] leading-relaxed text-muted">
                  {item.a}
                </p>
              </details>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
