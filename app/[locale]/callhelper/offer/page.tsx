import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Container } from "@/components/ui/container";
import { company } from "@/content/company";
import { CALLHELPER_OFFER as O, CALLHELPER_OFFER_DATE } from "@/content/callhelper-offer";
import { CALLHELPER_OFFER_PATH, CALLHELPER_PAGE_PATH } from "@/content/callhelper-page";
import { isLocale } from "@/lib/i18n";
import { appSecret } from "@/lib/secrets";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

/**
 * Оферта DevUz CallHelper (content/callhelper-offer.ts). Исполнитель — ИП
 * для расчётов в России: наименование и ИНН берутся из хранилища при
 * показе, в репозитории их нет.
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "ru") return {};
  return buildMetadata({ locale, path: CALLHELPER_OFFER_PATH, title: O.title, description: O.lead, alternates: { ru: CALLHELPER_OFFER_PATH } });
}

export default async function CallHelperOfferPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (locale !== "ru") redirect(`/ru/${CALLHELPER_OFFER_PATH}`);
  const [payee, taxId] = await Promise.all([appSecret("INVOICE_RU_PAYEE"), appSecret("INVOICE_RU_TAX_ID")]);
  const seller = `${payee ?? "индивидуальный предприниматель"}${taxId ? `, ИНН ${taxId}` : ""}`;

  return (
    <div className="box-page">
      <Container className="max-w-3xl pb-16 pt-32 md:pt-40">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-green">{"// "}DevUz CallHelper</p>
        <h1 className="mt-4 font-display text-[clamp(1.7rem,3.6vw,2.5rem)] font-extrabold leading-[1.08] tracking-tight text-white">{O.title}</h1>
        <p className="mt-2 text-[0.88rem] text-white/50">Редакция от {CALLHELPER_OFFER_DATE}</p>
        <p className="mt-5 text-[1rem] leading-relaxed text-white/80">{O.lead}</p>
        <p className="mt-3 text-[1rem] leading-relaxed text-white/80">Исполнитель: {seller}.</p>

        {O.sections.map((s) => (
          <section key={s.title} className="mt-9">
            <h2 className="font-display text-[1.25rem] font-bold text-white">{s.title}</h2>
            <ul className="mt-3 grid gap-2.5">
              {s.items.map((item) => (
                <li key={item} className="text-[0.96rem] leading-relaxed text-white/78">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section className="mt-9">
          <h2 className="font-display text-[1.25rem] font-bold text-white">8. Связь</h2>
          <p className="mt-3 text-[0.96rem] leading-relaxed text-white/78">
            Вопросы по Сервису, замена ключа и удаление данных:{" "}
            <a href={company.telegramUrl} className="text-green underline-offset-4 hover:underline">
              Telegram студии
            </a>
            .{" "}
            <Link href={`/ru/${CALLHELPER_PAGE_PATH}`} className="text-green underline-offset-4 hover:underline">
              О сервисе
            </Link>
            .{" "}
            <Link href="/ru/privacy" className="text-green underline-offset-4 hover:underline">
              Политика конфиденциальности сайта
            </Link>
            .
          </p>
        </section>
      </Container>
    </div>
  );
}
