import Link from "next/link";

import { CodeBoot } from "@/components/ui/code-boot";
import { Container } from "@/components/ui/container";
import { Icon } from "@/components/ui/icon";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Dictionary } from "@/content/dictionaries";
import { services } from "@/content/services";
import { localeHref, t, type Locale } from "@/lib/i18n";

export function ServicesSection({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <section id="services" className="border-t border-line py-24 md:py-32">
      <CodeBoot code={"const services = await catalog.list({ locale })"}>
      <Container>
        <SectionHeading
          kicker={dict.services.kicker}
          title={dict.services.title}
          description={dict.services.description}
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => (
            <Reveal key={service.slug} delay={i * 70}>
              <Link
                href={localeHref(locale, `services/${service.slug}`)}
                className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-7 transition-all duration-500 hover:-translate-y-1 hover:border-green/40 hover:bg-surface-2"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-green/25 bg-green/10 text-green">
                  <Icon name={service.icon} className="h-5 w-5" />
                </span>

                <h3 className="mt-6 text-[1.22rem] font-semibold leading-snug">
                  {t(service.title, locale)}
                </h3>
                <p className="mt-3 flex-1 text-[0.92rem] leading-relaxed text-muted">
                  {t(service.tagline, locale)}
                </p>

                <div className="mt-6 flex flex-wrap gap-1.5">
                  {service.tech.slice(0, 3).map((tech) => (
                    <span
                      key={tech}
                      className="rounded-md border border-line px-2 py-1 font-mono text-[0.63rem] text-faint"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                <p className="mt-5 border-t border-line pt-4 font-mono text-[0.72rem] text-faint">
                  {dict.services.from} ${service.priceFromUsd.toLocaleString("en-US")}
                  <span className="mx-2 text-line">·</span>
                  {service.weeksFrom}–{service.weeksTo} {dict.services.weeks}
                  <span className="ml-3 inline-block text-green transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </p>
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>
      </CodeBoot>
    </section>
  );
}
