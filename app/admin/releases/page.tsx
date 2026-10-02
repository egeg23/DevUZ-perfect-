import { publishReleaseAction } from "./actions";
import { AdminShell } from "@/components/admin/shell";
import { when } from "@/components/admin/lead-table";
import { releaseResultDict, releasesDict } from "@/content/admin-panel/releases";
import { products, productBySlug } from "@/content/products";
import { requireAdmin } from "@/lib/admin/guard";
import { PANEL_INTL, pick } from "@/lib/admin/i18n";
import { deliveryConfigured } from "@/lib/store/delivery-token";
import { DAILY_LIMIT, TOTAL_LIMIT } from "@/lib/store/delivery";
import { listReleases } from "@/lib/store/releases";

export const dynamic = "force-dynamic";

const FIELD =
  "mt-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-faint focus:border-green/50 focus:outline-none";

export default async function ReleasesPage({
  searchParams,
}: {
  searchParams: Promise<{ r?: string; e?: string }>;
}) {
  const staff = await requireAdmin();
  const { r, e } = await searchParams;

  const locale = staff.panel_locale;
  const t = pick(releasesDict, locale);
  const results = pick(releaseResultDict, locale);
  const notice = r ? (Object.hasOwn(results, r) ? results[r as keyof typeof results] : results.failed)(e ?? "") : null;

  const releases = await listReleases();
  const configured = deliveryConfigured();

  return (
    <AdminShell staff={staff}>
      <h1 className="text-lg font-semibold">{t.title}</h1>

      {/* Без секрета подписи ссылку выдачи нечем подписать, и покупатель,
          оплативший заказ, увидит «файл готовим» вместо кнопки. Сказать об
          этом надо здесь, а не оставить выяснять на первой сделке. */}
      {!configured ? (
        <p className="mt-4 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
          {t.offBefore} <code>DOWNLOAD_SIGNING_SECRET</code> {t.offMiddle} <code>openssl rand -hex 32</code>
          {t.offAfter}
        </p>
      ) : null}

      {r ? (
        <p
          className={`mt-4 rounded-xl border px-4 py-2.5 text-sm ${
            r === "ok"
              ? "border-green/30 bg-green/10 text-green"
              : "border-gold/30 bg-gold/10 text-gold"
          }`}
        >
          {notice}
        </p>
      ) : null}

      <form
        action={publishReleaseAction}
        className="mt-6 rounded-xl border border-line bg-surface px-5 py-5"
      >
        <h2 className="font-medium">{t.publishTitle}</h2>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-faint">{t.publishAbout}</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-faint">{t.product}</span>
            <select name="product" required className={FIELD}>
              {products.map((product) => (
                <option key={product.slug} value={product.slug}>
                  {product.title[locale]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-wider text-faint">{t.version}</span>
            <input name="version" required maxLength={60} placeholder="1.4.0" className={FIELD} />
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-wider text-faint">{t.bucket}</span>
            <input name="bucket" required maxLength={100} placeholder="products" className={FIELD} />
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-wider text-faint">{t.path}</span>
            <input
              name="path"
              required
              maxLength={500}
              placeholder="delivery-service/1.4.0.zip"
              className={FIELD}
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-xs uppercase tracking-wider text-faint">{t.sha}</span>
            <input
              name="sha256"
              maxLength={64}
              placeholder={t.shaPh}
              className={`${FIELD} font-mono`}
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-xs uppercase tracking-wider text-faint">{t.notes}</span>
            <input name="notes" maxLength={1000} className={FIELD} />
          </label>
        </div>

        <button
          type="submit"
          className="mt-4 rounded-lg border border-green/40 bg-green/10 px-4 py-2 text-sm text-green transition hover:bg-green/20"
        >
          {t.publish}
        </button>
      </form>

      {releases.length ? (
        <ul className="mt-6 space-y-3">
          {releases.map((release) => {
            const product = productBySlug(release.product_slug);
            return (
              <li
                key={release.id}
                className={`rounded-xl border px-5 py-4 ${
                  release.is_current ? "border-green/30 bg-green/5" : "border-line bg-surface"
                }`}
              >
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="font-medium">
                    {product ? product.title[locale] : release.product_slug}
                  </span>
                  <span className="font-mono text-sm text-blue-soft">{release.version}</span>
                  {release.is_current ? (
                    <span className="rounded-full border border-green/40 bg-green/10 px-2 py-0.5 text-xs text-green">
                      {t.current}
                    </span>
                  ) : null}
                  <span className="ml-auto text-sm text-muted">{when(release.released_at, locale)}</span>
                </div>

                <p className="mt-2 break-all font-mono text-xs text-faint">
                  {release.storage_bucket}/{release.storage_path}
                  {release.bytes !== null
                    ? ` · ${(release.bytes / 1048576).toLocaleString(PANEL_INTL[locale], { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ${t.mb}`
                    : ""}
                </p>
                {release.sha256 ? (
                  <p className="mt-1 break-all font-mono text-xs text-faint">{release.sha256}</p>
                ) : null}
                {release.notes ? (
                  <p className="mt-2 text-sm text-muted">{release.notes}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-6 rounded-xl border border-line bg-surface px-5 py-8 text-center text-sm text-muted">
          {t.empty}
        </p>
      )}

      <p className="mt-8 max-w-2xl text-xs leading-relaxed text-faint">{t.footer(TOTAL_LIMIT, DAILY_LIMIT)}</p>
    </AdminShell>
  );
}
