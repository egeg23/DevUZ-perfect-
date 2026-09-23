import { ChatPanel } from "@/components/chat/chat-panel";
import { LeadForm } from "@/components/chat/lead-form";
import { CodeBoot } from "@/components/ui/code-boot";
import { Container } from "@/components/ui/container";
import { PhoneList } from "@/components/ui/phone-links";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { company } from "@/content/company";
import type { Dictionary } from "@/content/dictionaries";
import type { Locale } from "@/lib/i18n";

export function ContactSection({
  locale,
  dict,
  standalone = false,
}: {
  locale: Locale;
  dict: Dictionary;
  /** Своя страница «Контакты»: номера сразу под шапкой, без отступа главной. */
  standalone?: boolean;
}) {
  return (
    <section
      id="contact"
      className={standalone ? "pb-24 pt-6 md:pb-32 md:pt-10" : "border-t border-line py-24 md:py-32"}
    >
      <CodeBoot code={"await telegram.send(SALES_CHAT, brief(lead))"}>
      <Container>
        {/* Живые номера — первыми, до заголовка про чат. Владелец: «чтобы при
            переходе туда не возникало ощущения, что тебя снова ждёт только
            наш ИИ-бот». Чат и форма остаются ниже — для тех, кому удобнее
            написать. */}
        <Reveal className="mb-14">
          <PhoneList locale={locale} dict={dict} />
        </Reveal>

        <SectionHeading
          kicker={dict.contact.kicker}
          title={dict.contact.title}
          description={dict.contact.description}
        />

        {/* min-w-0 на колонках — не украшение.
            Элемент грида по умолчанию получает min-width: auto, то есть не
            даёт себя сжать уже собственного содержимого. Панель чата внутри
            требует около 375 px, и на телефоне колонка распирала страницу
            за край экрана: на 360 px документ уезжал вбок на 35 px, на
            320 px — на 75. Заметно это только реальной прокруткой вбок:
            body { overflow-x: hidden } тут не спасает, потому что прокрутку
            в этом случае ведёт html, а не body. */}
        <div className="mt-14 grid gap-8 lg:grid-cols-[1.15fr_1fr]">
          <Reveal className="min-w-0">
            <ChatPanel locale={locale} dict={dict} />
          </Reveal>

          <Reveal delay={120} className="min-w-0">
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
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
  </CodeBoot>
    </section>
  );
}
