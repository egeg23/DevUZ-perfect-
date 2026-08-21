import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Dictionary } from "@/content/dictionaries";

export function ProcessSection({ dict }: { dict: Dictionary }) {
  return (
    <section id="process" className="border-t border-line py-24 md:py-32">
      <Container>
        <SectionHeading
          kicker={dict.process.kicker}
          title={dict.process.title}
          description={dict.process.description}
        />

        <ol className="mt-14 grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          {dict.process.steps.map((step, i) => (
            <Reveal as="li" key={step.title} delay={i * 60} className="relative pl-14">
              <span
                aria-hidden="true"
                className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface font-mono text-[0.8rem] text-green"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="text-[1.1rem] font-semibold">{step.title}</h3>
              <p className="mt-2.5 text-[0.92rem] leading-relaxed text-muted">{step.text}</p>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}
