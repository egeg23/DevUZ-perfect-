import {
  createMapsCampaignAction,
  runMapsCampaignAction,
  toggleMapsCampaignAction,
} from "@/app/admin/prospect/actions";
import type { Campaign } from "@/lib/maps/store";
import { SubmitButton } from "@/components/admin/submit-button";
import { HelpHint } from "@/components/admin/help-link";
import { helpAnchor } from "@/lib/admin/help";
import { pick, type PanelLocale } from "@/lib/admin/i18n";
import { mapsDict } from "@/content/admin-panel/prospect-tools";

const CARD = "rounded-xl border border-line bg-surface px-5 py-4";
const INPUT =
  "w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-text outline-none focus:border-green/50";

/**
 * Автопоиск компаний по картам — блок в «Касаниях».
 *
 * Ниша и город → Google Maps → проверка сайта → пул, откуда утром берётся
 * порция дня. Раньше сайты сюда вбивали руками, и на этом всё стояло.
 */
export function MapsCampaigns({
  campaigns,
  configured,
  usage,
  cap,
  pending,
  canEdit,
  notice,
  locale = "ru",
}: {
  campaigns: Campaign[];
  configured: boolean;
  usage: number;
  cap: number;
  pending: number;
  canEdit: boolean;
  notice?: string;
  locale?: PanelLocale;
}) {
  const t = pick(mapsDict, locale);
  // Ответ действий автопоиска: `?maps=<код>` (app/admin/prospect/actions.ts).
  const notices: Record<string, { text: string; tone: "ok" | "warn" } | undefined> = {
    created: { text: t.created, tone: "ok" },
    ran: { text: t.ran, tone: "ok" },
    cap: { text: t.cap, tone: "warn" },
    failed: { text: t.failed, tone: "warn" },
    invalid: { text: t.invalid, tone: "warn" },
    gone: { text: t.gone, tone: "warn" },
    exists: { text: t.exists(t.resume), tone: "warn" },
  };
  const message = notice ? notices[notice] : null;
  return (
    <section id="maps" className={`mt-6 scroll-mt-24 ${CARD}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-faint">
          {t.title}
          <HelpHint topic={helpAnchor("/admin/prospect", "maps")} label={t.help} />
        </p>
        {configured ? (
          <p className="text-xs text-faint">
            {t.usage(usage, cap)}
            {pending ? t.pending(pending) : ""}
          </p>
        ) : null}
      </div>
      <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted">
        {t.intro}
      </p>

      {message ? (
        <p
          className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
            message.tone === "ok" ? "border-green/30 bg-green/10 text-green" : "border-gold/30 bg-gold/10 text-gold"
          }`}
        >
          {message.text}
        </p>
      ) : null}

      {!configured ? (
        <div className="mt-3 text-sm text-muted">
          <p>{t.notConnected}</p>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-xs leading-relaxed">
            <li>
              {t.step1Before}
              <code className="font-mono text-text">console.cloud.google.com</code>
              {t.step1After}
            </li>
            <li>
              {t.step2}
            </li>
            <li>
              {t.step3Before}
              <code className="font-mono text-text">/opt/devuz/.env</code>:{" "}
              <code className="font-mono text-text">{t.step3Key}</code>
              {t.step3Middle}
              <code className="font-mono text-text">docker compose up -d</code>
              {t.step3After}
            </li>
          </ol>
          <p className="mt-2 text-xs text-faint">
            {t.capNote(cap, cap * 30)}
          </p>
        </div>
      ) : null}

      {campaigns.length ? (
        <ul className="mt-4 divide-y divide-line-soft text-sm">
          {campaigns.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2">
              <span className={c.active ? "" : "text-faint"}>
                {c.niche} · {c.city}
              </span>
              <span className="text-xs text-muted">
                {t.found(c.found, c.added)}
                {c.exhausted ? t.exhausted : c.active ? "" : t.paused}
              </span>
              {canEdit ? (
                <span className="ml-auto flex gap-3">
                  {configured && c.active && !c.exhausted ? (
                    <form action={runMapsCampaignAction}>
                      <input type="hidden" name="campaign" value={c.id} />
                      <button type="submit" className="text-xs text-faint hover:text-green">
                        {t.searchNow}
                      </button>
                    </form>
                  ) : null}
                  <form action={toggleMapsCampaignAction}>
                    <input type="hidden" name="campaign" value={c.id} />
                    <input type="hidden" name="active" value={c.active ? "0" : "1"} />
                    <button type="submit" className="text-xs text-faint hover:text-green">
                      {c.active ? t.pause : t.resume}
                    </button>
                  </form>
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {canEdit ? (
        <form action={createMapsCampaignAction} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input name="niche" required placeholder={t.nichePlaceholder} className={INPUT} aria-label={t.niche} />
          <input name="city" required defaultValue={t.cityDefault} className={INPUT} aria-label={t.city} />
          {/* Пока идёт первый поиск, кнопка неактивна: иначе второе нажатие
              заводило вторую такую же кампанию. */}
          <SubmitButton pendingLabel={t.searching} base="rounded-lg px-3 py-2 text-xs" tone="quiet">
            {t.search}
          </SubmitButton>
        </form>
      ) : null}
    </section>
  );
}
