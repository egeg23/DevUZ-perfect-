import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { CallHelperCabinet } from "@/components/callhelper/cabinet";
import { Container } from "@/components/ui/container";
import { CALLHELPER_CABINET as T, CALLHELPER_CABINET_PATH, CALLHELPER_PAGE_PATH } from "@/content/callhelper-page";
import { isLocale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";

/**
 * Кабинет колл-центра DevUz CallHelper: вход по ключу, сценарии, минуты и
 * итоги звонков (components/callhelper/cabinet.tsx). В поиск не идёт: это
 * рабочий экран клиента, а не страница для чтения.
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "ru") return {};
  return { ...buildMetadata({ locale, path: CALLHELPER_CABINET_PATH, title: T.metaTitle, description: T.lead, alternates: { ru: CALLHELPER_CABINET_PATH } }), robots: { index: false, follow: true } };
}

export default async function CallHelperCabinetPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (locale !== "ru") redirect(`/ru/${CALLHELPER_CABINET_PATH}`);
  return (
    <div className="box-page">
      <Container className="pb-16 pt-32 md:pt-40">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-green">{"// "}DevUz CallHelper</p>
        <h1 className="mt-4 font-display text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold leading-[1.05] tracking-tight text-white">{T.title}</h1>
        <p className="mb-8 mt-4 max-w-2xl text-[1rem] leading-relaxed text-white/75">{T.lead}</p>
        <CallHelperCabinet productHref={`/ru/${CALLHELPER_PAGE_PATH}`} />
      </Container>
    </div>
  );
}
