import { connectOwnBot, disconnectChannel, enableWidget } from "@/app/cabinet/actions";
import { CopyBox } from "@/components/cabinet/copy-box";
import { CabinetShell, Card, Notice, button, ghost, input } from "@/components/cabinet/shell";
import type { CabKey } from "@/content/ai-staff/cabinet";
import { serviceBotUsername } from "@/lib/ai-staff/channels";
import { cabinetPage } from "@/lib/ai-staff/page";
import * as store from "@/lib/ai-staff/store";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

const ERRORS = ["bad_token", "limit", "taken", "webhook", "no_key"] as const;

export default async function CabinetChannels({ searchParams }: { searchParams: Promise<{ n?: string }> }) {
  const cab = await cabinetPage({ owner: true });
  const { tenant, t, locale } = cab;
  const { n } = await searchParams;
  const [list, bot] = await Promise.all([store.channels(tenant.id), serviceBotUsername()]);
  const business = list.filter((c) => c.kind === "tg_business");
  const bots = list.filter((c) => c.kind === "tg_bot");
  const widget = list.find((c) => c.kind === "widget");
  const status = (c: store.Channel) =>
    c.status === "active" ? (c.can_reply ? t("chActive") : t("chNoReply")) : c.status === "off" ? t("chOff") : t("chError");

  return (
    <CabinetShell t={t} locale={locale} company={tenant.name} current="/cabinet/channels" configure={cab.configure} support={cab.role === "support"}>
      {n === "bot_ok" ? <Notice text={t("saved")} /> : null}
      {ERRORS.includes(n as (typeof ERRORS)[number]) ? <Notice tone="warn" text={t(`ch_${n}` as CabKey)} /> : null}

      <Card title={t("chBusiness")} hint={t("chBusinessHint")}>
        <p className="mb-3 whitespace-pre-line text-sm">{t("chBusinessSteps").replace("{bot}", bot ?? "…")}</p>
        {business.length ? (
          <ul className="space-y-2 text-sm">
            {business.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2">
                <span>
                  {c.title} · <span className="text-muted">{status(c)}</span>
                </span>
                {c.status === "active" ? (
                  <form action={disconnectChannel}>
                    <input type="hidden" name="id" value={c.id} />
                    <button className={ghost}>{t("chDisconnect")}</button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">{t("chNone")}</p>
        )}
      </Card>

      <Card title={t("chOwnBot")} hint={t("chOwnBotHint")}>
        {bots.map((c) => (
          <div key={c.id} className="mb-3 flex items-center justify-between gap-2 text-sm">
            <span>
              {c.title} · <span className="text-muted">{status(c)}</span>
            </span>
            {c.status === "active" ? (
              <form action={disconnectChannel}>
                <input type="hidden" name="id" value={c.id} />
                <button className={ghost}>{t("chDisconnect")}</button>
              </form>
            ) : null}
          </div>
        ))}
        <form action={connectOwnBot} className="flex flex-col gap-2 sm:flex-row">
          <input name="token" placeholder="123456789:AA…" autoComplete="off" required className={input} aria-label={t("chToken")} />
          <button className={button}>{t("chConnect")}</button>
        </form>
      </Card>

      <div id="widget">
        <Card title={t("chWidget")} hint={t("chWidgetHint")}>
          {widget && widget.status === "active" ? (
            <div className="space-y-3">
              <CopyBox value={`<script src="${siteUrl}/api/ai-staff/widget.js?k=${widget.widget_key}" async></script>`} label={t("copy")} />
              <form action={disconnectChannel}>
                <input type="hidden" name="id" value={widget.id} />
                <button className={ghost}>{t("chDisconnect")}</button>
              </form>
            </div>
          ) : (
            <form action={enableWidget}>
              <button className={button}>{t("chConnect")}</button>
            </form>
          )}
        </Card>
      </div>
    </CabinetShell>
  );
}
