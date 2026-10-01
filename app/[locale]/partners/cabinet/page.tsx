import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  createLinkAction,
  requestAgencyAction,
  requestClientAction,
  requestPayoutAction,
  saveRequisitesAction,
  setAccumulateAction,
  switchModelAction,
} from "./actions";
import { CabinetView, resultText } from "@/components/partners/cabinet-view";
import { Container } from "@/components/ui/container";
import { company } from "@/content/company";
import { cabinetCopy, type CabinetCopy } from "@/content/partner-cabinet";
import { isLocale } from "@/lib/i18n";
import { listPromo } from "@/lib/partners/promo";
import { promoFileUrl, promoForLocale } from "@/lib/partners/promo-rules";
import { currentPartner } from "@/lib/partners/session";
import { agenciesOf, clientsOf, dailyActivity, referralsOf, summarize } from "@/lib/partners/store";
import { buildMetadata } from "@/lib/seo";

/**
 * Кабинет партнёра.
 *
 * Владелец: «отдельный вход для партнёров, партнёрский кабинет.
 * Авторизация через телеграм. Механики возьми с seller ai… и допридумывай,
 * что ещё можно там сделать». Отсюда: ставка и прогресс до повышенной;
 * деньги по состояниям; график переходов; короткие ссылки под каждый канал
 * с направлением и бонусом аудитории; клиенты по этапам — от заявки до
 * оплаты, с долей по каждому; реквизиты и заявка на выплату; промо-ролики
 * и картинки с подписью, где уже стоит ссылка партнёра; готовые тексты для
 * постов со ссылкой внутри.
 *
 * Здесь — вход и сбор данных; разметка — components/partners/cabinet-view.
 * Страница не индексируется: это личное, а не витрина.
 */

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = cabinetCopy(locale);
  return buildMetadata({
    locale,
    path: "partners/cabinet",
    title: `${t.title} — ${company.name}`,
    description: t.signedOutLead,
    noIndex: true,
  });
}

export default async function CabinetPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ e?: string; r?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { e, r } = await searchParams;
  const t = cabinetCopy(locale);

  const partner = await currentPartner();
  if (!partner) return <SignedOut t={t} error={e === "expired" || e === "offline" ? t.errors[e] : null} />;

  const [summary] = await summarize([partner]);
  const [referrals, activity, agencies, clients, promo] = await Promise.all([
    referralsOf(summary),
    dailyActivity(partner.id, 30),
    agenciesOf([partner.id]),
    clientsOf([partner.id]),
    listPromo({ withHidden: false }),
  ]);
  const materials = promoForLocale(promo, locale);

  return (
    <CabinetView
      locale={locale}
      t={t}
      partner={partner}
      summary={summary}
      referrals={referrals}
      agencies={agencies}
      clients={clients}
      media={materials.map((material) => ({ material, preview: promoFileUrl(material.id) }))}
      activity={activity}
      result={r ? resultText(t, r) : null}
      now={new Date()}
      actions={{
        createLink: createLinkAction,
        saveRequisites: saveRequisitesAction,
        requestPayout: requestPayoutAction,
        switchModel: switchModelAction,
        requestAgency: requestAgencyAction,
        requestClient: requestClientAction,
        setAccumulate: setAccumulateAction,
      }}
    />
  );
}

function SignedOut({ t, error }: { t: CabinetCopy; error: string | null }) {
  return (
    <Container className="pb-16 pt-28 sm:pb-24 sm:pt-32">
      <div className="mx-auto max-w-xl text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-green">{t.title}</p>
        <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">{t.signedOutTitle}</h1>
        <p className="mt-5 leading-relaxed text-muted">{t.signedOutLead}</p>
        {error ? (
          <p className="mt-6 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">{error}</p>
        ) : null}
        <a
          href={`https://t.me/${company.telegram}?start=cabinet`}
          className="mt-8 inline-block rounded-xl bg-green px-7 py-4 font-semibold text-ink transition-colors hover:bg-white"
        >
          {t.signIn}
        </a>
        <p className="mt-4 text-sm text-faint">{t.signInHint}</p>
      </div>
    </Container>
  );
}

