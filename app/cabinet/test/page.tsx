import { TestChat } from "@/components/cabinet/test-chat";
import { CabinetShell } from "@/components/cabinet/shell";
import { randomKey } from "@/lib/ai-staff/crypto";
import { cabinetPage } from "@/lib/ai-staff/page";

export const dynamic = "force-dynamic";

export default async function CabinetTest() {
  const cab = await cabinetPage();
  const { tenant, t, locale } = cab;
  return (
    <CabinetShell t={t} locale={locale} company={tenant.name} current="/cabinet/test" configure={cab.configure} support={cab.role === "support"}>
      <p className="text-sm text-muted">{t("testIntro")}</p>
      <TestChat
        initialKey={randomKey(12)}
        labels={{ ph: t("testPh"), send: t("send"), reset: t("reset"), thinking: t("thinking"), failed: t("failed") }}
      />
    </CabinetShell>
  );
}
