import { notFound } from "next/navigation";

import { Card, button } from "@/components/cabinet/shell";
import { company } from "@/content/company";
import { cabinetT } from "@/lib/ai-staff/cabinet-locale";
import { serviceBotUsername } from "@/lib/ai-staff/channels";
import { serviceEnabled } from "@/lib/ai-staff/store";

export const dynamic = "force-dynamic";

export default async function CabinetLogin({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  if (!(await serviceEnabled())) notFound();
  const { e } = await searchParams;
  const { t, locale } = await cabinetT();
  const bot = await serviceBotUsername();
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="mb-4 flex justify-end gap-2 text-sm">
        {(["ru", "uz"] as const).map((l) => (
          <a key={l} href={`/cabinet/lang?to=${l}&back=/cabinet/login`} className={locale === l ? "text-text" : "text-muted"}>
            {l.toUpperCase()}
          </a>
        ))}
      </div>
      <Card title={t("loginTitle")} hint={t("loginBody")}>
        {e ? <p className="mb-4 text-sm text-gold">{t("loginExpired")}</p> : null}
        {bot ? (
          <a className={button} href={`https://t.me/${bot}?start=login`}>
            {t("loginButton")}
          </a>
        ) : (
          <p className="text-sm text-muted">
            {t("loginNoBot")}{" "}
            <a className="text-green" href={company.telegramUrl}>
              @{company.telegram}
            </a>
          </p>
        )}
      </Card>
    </div>
  );
}
