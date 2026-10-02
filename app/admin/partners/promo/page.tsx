import Link from "next/link";

import {
  promoChunkAction,
  promoDeleteAction,
  promoDiscardAction,
  promoRegisterAction,
  promoStartAction,
  promoUpdateAction,
  promoVisibilityAction,
} from "./actions";
import { HelpHint } from "@/components/admin/help-link";
import { when } from "@/components/admin/lead-table";
import { PromoUpload } from "@/components/admin/promo-upload";
import { AdminShell } from "@/components/admin/shell";
import { partnersDict, promoDict, promoLocaleDict, promoResultDict } from "@/content/admin-panel/partners";
import { cabinetCopy } from "@/content/partner-cabinet";
import { helpAnchor } from "@/lib/admin/help";
import { requireAdmin } from "@/lib/admin/guard";
import { pick } from "@/lib/admin/i18n";
import { listPromo, promoStats } from "@/lib/partners/promo";
import {
  PROMO_LOCALES,
  promoAdminFileUrl,
  promoKind,
  promoShape,
  promoSize,
} from "@/lib/partners/promo-rules";

export const dynamic = "force-dynamic";

/**
 * Промо-материалы партнёров: ролики и картинки, которые партнёр берёт из
 * кабинета и выкладывает у себя со своей ссылкой.
 *
 * Владелец: «сделаем что-то вроде хранилища внутри, пусть распространяют».
 * Здесь — загрузить, подписать, скрыть, удалить и увидеть, что скачивают.
 */

/** Тон ответа: зелёный — сделано, жёлтый — не вышло. Текст — из словаря по коду. */
const OK_CODES = new Set(["saved", "hidden", "shown", "deleted"]);

const SMALL =
  "rounded-lg border border-line bg-ink px-2 py-1 text-xs text-text outline-none focus:border-green/50";
const BUTTON =
  "rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs transition hover:border-green/40 hover:text-green";

export default async function PromoPage({ searchParams }: { searchParams: Promise<{ r?: string }> }) {
  const admin = await requireAdmin();
  const { r } = await searchParams;
  const locale = admin.panel_locale;
  const t = pick(promoDict, locale);
  const results = pick(promoResultDict, locale);
  const notice =
    r && Object.hasOwn(results, r)
      ? { text: results[r as keyof typeof results], tone: OK_CODES.has(r) ? "ok" : "warn" }
      : null;

  const [materials, stats] = await Promise.all([listPromo({ withHidden: true }), promoStats()]);
  // Подпись по умолчанию — та, что увидит партнёр, на языке панели читающего:
  // у кабинета партнёра все три языка панели есть.
  const example = cabinetCopy(locale).mediaCaption("devuz.studio/r/…");

  return (
    <AdminShell staff={admin}>
      <p className="text-xs text-faint">
        <Link href="/admin/partners" className="hover:text-green">
          {t.back}
        </Link>
      </p>
      <h1 className="mt-2 text-lg font-semibold">{partnersDict.promoTitle[locale]}</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">{t.intro}</p>

      {notice ? (
        <p
          className={`mt-4 rounded-xl border px-4 py-2.5 text-sm ${
            notice.tone === "ok" ? "border-green/30 bg-green/10 text-green" : "border-gold/30 bg-gold/10 text-gold"
          }`}
        >
          {notice.text}
        </p>
      ) : null}

      <h2 className="mt-8 flex items-center gap-2 text-xs uppercase tracking-wider text-faint">
        {t.upload}
        <HelpHint topic={helpAnchor("/admin/partners", "promo")} />
      </h2>
      <PromoUpload
        start={promoStartAction}
        chunk={promoChunkAction}
        discard={promoDiscardAction}
        register={promoRegisterAction}
        captionHint={example}
      />

      <h2 className="mt-8 text-xs uppercase tracking-wider text-faint">
        {t.inCabinet(materials.filter((m) => !m.hidden).length)}
        {materials.some((m) => m.hidden) ? t.hiddenCount(materials.filter((m) => m.hidden).length) : ""}
      </h2>
      {materials.length ? (
        <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {materials.map((m) => {
            const preview = promoAdminFileUrl(m.id);
            const shape = promoShape(m.width, m.height);
            const stat = stats.get(m.id);
            return (
              <div
                key={m.id}
                className={`flex flex-col rounded-xl border bg-surface px-4 py-4 ${m.hidden ? "border-line opacity-60" : "border-line"}`}
              >
                <div className="flex h-64 items-center justify-center overflow-hidden rounded-lg border border-line bg-black">
                  {promoKind(m.mime) === "video" ? (
                    <video src={`${preview}#t=0.1`} controls playsInline preload="metadata" className="h-full w-full object-contain" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt={m.title} loading="lazy" className="h-full w-full object-contain" />
                  )}
                </div>
                <p className="mt-3 text-xs text-faint">
                  {[
                    shape ? t[shape] : null,
                    m.width && m.height ? `${m.width}×${m.height}` : null,
                    m.duration_s ? t.seconds(Math.round(m.duration_s)) : null,
                    promoSize(m.bytes, t.mb) || null,
                    promoLocaleDict[m.locale][locale],
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p className="mt-1 text-xs">
                  {m.hidden ? <span className="text-gold">{t.hiddenFromPartners}</span> : null}
                  {stat ? (
                    <span className="text-green">{t.downloaded(stat.downloads, stat.partners)}</span>
                  ) : (
                    <span className="text-faint">{t.notDownloaded}</span>
                  )}
                  <span className="text-faint">{t.posted(when(m.created_at, locale))}</span>
                </p>

                <form action={promoUpdateAction} className="mt-3 flex flex-1 flex-col gap-2">
                  <input type="hidden" name="promo" value={m.id} />
                  <input name="title" required minLength={2} maxLength={120} defaultValue={m.title} aria-label={t.titleLabel} className={SMALL} />
                  <select name="locale" defaultValue={m.locale} aria-label={t.langLabel} className={SMALL}>
                    {PROMO_LOCALES.map((lang) => (
                      <option key={lang} value={lang}>
                        {promoLocaleDict[lang][locale]}
                      </option>
                    ))}
                  </select>
                  <textarea
                    name="caption"
                    rows={3}
                    maxLength={1000}
                    defaultValue={m.caption ?? ""}
                    placeholder={t.captionPh(example)}
                    aria-label={t.captionLabel}
                    className={`${SMALL} flex-1`}
                  />
                  <button type="submit" className="self-start text-xs text-faint hover:text-green">
                    {t.save}
                  </button>
                </form>

                <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line-soft pt-3">
                  <form action={promoVisibilityAction}>
                    <input type="hidden" name="promo" value={m.id} />
                    <input type="hidden" name="hidden" value={m.hidden ? "0" : "1"} />
                    <button type="submit" className={BUTTON}>
                      {m.hidden ? t.show : t.hide}
                    </button>
                  </form>
                  {/* Удаление — через раскрытие: одно случайное нажатие не должно уносить файл. */}
                  <details className="text-xs">
                    <summary className="cursor-pointer text-faint hover:text-gold">{t.remove}</summary>
                    <form action={promoDeleteAction} className="mt-2">
                      <input type="hidden" name="promo" value={m.id} />
                      <button type="submit" className="rounded-lg border border-gold/40 px-3 py-1.5 text-gold hover:bg-gold/10">
                        {t.removeForever}
                      </button>
                    </form>
                  </details>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-2 rounded-xl border border-line bg-surface px-5 py-6 text-sm text-muted">
          {t.empty}
        </p>
      )}
    </AdminShell>
  );
}
