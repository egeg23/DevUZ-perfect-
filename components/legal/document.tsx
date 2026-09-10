import { Container } from "@/components/ui/container";
import { company } from "@/content/company";
import type { LegalDoc } from "@/content/legal";
import { t, type Locale } from "@/lib/i18n";

/**
 * Вёрстка юридического документа. Одна на политику, оферту и лицензию.
 *
 * Раньше это была разметка внутри страницы политики. С появлением оферты и
 * лицензии её пришлось бы скопировать дважды — а вместе с ней и блок
 * реквизитов, который в оферте не украшение: договор без реквизитов
 * стороны не является договором, и разъехавшиеся копии этого блока — это
 * ровно тот случай, когда ошибка обнаруживается в суде.
 */

const LABEL: Record<string, Record<Locale, string>> = {
  name: { ru: "Наименование", en: "Legal name", uz: "Nomi", zh: "名称" },
  form: { ru: "Правовая форма", en: "Legal form", uz: "Huquqiy shakl", zh: "组织形式" },
  pinfl: { ru: "ПИНФЛ", en: "PINFL", uz: "PINFL", zh: "自然人识别码（PINFL）" },
  contact: { ru: "Связь", en: "Contact", uz: "Aloqa", zh: "联系方式" },
};

export function LegalDocument({ doc, locale }: { doc: LegalDoc; locale: Locale }) {
  return (
    <Container className="max-w-3xl pb-28 pt-36">
      <h1 className="text-[clamp(2rem,4.4vw,3rem)] font-extrabold leading-[1.08]">{doc.title}</h1>
      <p className="mt-4 font-mono text-[0.75rem] text-faint">{doc.updated}</p>
      <p className="mt-7 text-[1.02rem] leading-relaxed text-muted">{doc.intro}</p>

      {/* Реквизиты держим здесь, а не в подвале каждой страницы: ПИНФЛ —
          персональный идентификатор, и выносить его на всякую страницу сайта
          нет причин, тогда как на юридической он уместен. */}
      <dl className="mt-10 grid gap-x-10 gap-y-5 rounded-2xl border border-line bg-surface px-7 py-6 sm:grid-cols-2">
        <Requisite label={LABEL.name[locale]}>
          {locale === "ru" ? company.legal.name : company.legal.nameLatin}
        </Requisite>
        <Requisite label={LABEL.form[locale]}>{t(company.legal.form, locale)}</Requisite>
        <Requisite label={LABEL.pinfl[locale]} mono>
          {company.legal.pinfl}
        </Requisite>
        <Requisite label={LABEL.contact[locale]}>
          <a
            href={company.telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green hover:text-white"
          >
            Telegram @{company.telegram}
          </a>
        </Requisite>
      </dl>

      <div className="mt-14 space-y-11">
        {doc.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-[1.28rem] font-semibold">{section.heading}</h2>
            <div className="mt-4 space-y-3">
              {section.body.map((paragraph) => (
                <p key={paragraph} className="text-[0.96rem] leading-relaxed text-muted">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Container>
  );
}

function Requisite({
  label,
  mono,
  children,
}: {
  label: string;
  mono?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="font-mono text-[0.64rem] uppercase tracking-[0.16em] text-faint">{label}</dt>
      <dd className={`mt-1.5 text-[0.95rem]${mono ? " font-mono" : ""}`}>{children}</dd>
    </div>
  );
}
