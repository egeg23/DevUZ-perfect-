import { ChatPanel } from "@/components/chat/chat-panel";
import { LeadForm } from "@/components/chat/lead-form";
import { CodeBoot } from "@/components/ui/code-boot";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { company } from "@/content/company";
import type { Dictionary } from "@/content/dictionaries";
import type { Locale } from "@/lib/i18n";

export function ContactSection({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <section id="contact" className="border-t border-line py-24 md:py-32">
      <CodeBoot code={"await telegram.send(SALES_CHAT, brief(lead))"}>
      <Container>
        <SectionHeading
          kicker={dict.contact.kicker}
          title={dict.contact.title}
          description={dict.contact.description}
        />

        <div className="mt-14 grid gap-8 lg:grid-cols-[1.15fr_1fr]">
          <Reveal>
            <ChatPanel locale={locale} dict={dict} />
          </Reveal>

          <Reveal delay={120}>
            <div className="rounded-2xl border border-line bg-surface p-7">
              <h3 className="text-[1.1rem] font-semibold">{dict.contact.formTitle}</h3>
              <div className="mt-5">
                <LeadForm locale={locale} dict={dict} />
              </div>

              <div className="mt-7 space-y-2.5 border-t border-line pt-6 text-[0.9rem]">
                <a
                  href={company.telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-green transition-colors hover:text-white"
                >
                  <span aria-hidden="true">✈</span>
                  Telegram @{company.telegram}
                </a>
                <p className="text-[0.82rem] leading-relaxed text-faint">
                  {dict.contact.noPhone}
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
  </CodeBoot>
    </section>
  );
}
