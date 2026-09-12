import { publishReleaseAction } from "./actions";
import { AdminShell } from "@/components/admin/shell";
import { when } from "@/components/admin/lead-table";
import { products, productBySlug } from "@/content/products";
import { requireAdmin } from "@/lib/admin/guard";
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

  const releases = await listReleases();
  const configured = deliveryConfigured();

  return (
    <AdminShell staff={staff}>
      <h1 className="text-lg font-semibold">Релизы продуктов</h1>

      {/* Без секрета подписи ссылку выдачи нечем подписать, и покупатель,
          оплативший заказ, увидит «файл готовим» вместо кнопки. Сказать об
          этом надо здесь, а не оставить выяснять на первой сделке. */}
      {!configured ? (
        <p className="mt-4 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
          Выдача выключена: не задан <code>DOWNLOAD_SIGNING_SECRET</code> (нужно
          не меньше 32 знаков, <code>openssl rand -hex 32</code>). Релизы
          зарегистрируются, но скачать их покупатель не сможет.
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
          {r === "ok" ? "Релиз выложен." : (e ?? "Не получилось.")}
        </p>
      ) : null}

      <form
        action={publishReleaseAction}
        className="mt-6 rounded-xl border border-line bg-surface px-5 py-5"
      >
        <h2 className="font-medium">Выложить релиз</h2>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-faint">
          Файл заливается в приватный бакет Supabase напрямую с вашего
          компьютера — через сайт загрузки нет и не будет: nginx режет тело
          запроса на 128 килобайтах. Здесь регистрируется путь; панель сходит в
          хранилище и проверит, что объект по нему действительно есть.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-faint">Продукт</span>
            <select name="product" required className={FIELD}>
              {products.map((product) => (
                <option key={product.slug} value={product.slug}>
                  {product.title.ru}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-wider text-faint">Версия</span>
            <input name="version" required maxLength={60} placeholder="1.4.0" className={FIELD} />
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-wider text-faint">Бакет</span>
            <input name="bucket" required maxLength={100} placeholder="products" className={FIELD} />
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-wider text-faint">Путь в бакете</span>
            <input
              name="path"
              required
              maxLength={500}
              placeholder="delivery-service/1.4.0.zip"
              className={FIELD}
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-xs uppercase tracking-wider text-faint">
              sha256 архива — необязательно, но покупателю нечем иначе проверить, что скачал то же самое
            </span>
            <input
              name="sha256"
              maxLength={64}
              placeholder="shasum -a 256 архив.zip"
              className={`${FIELD} font-mono`}
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-xs uppercase tracking-wider text-faint">Заметка для своих</span>
            <input name="notes" maxLength={1000} className={FIELD} />
          </label>
        </div>

        <button
          type="submit"
          className="mt-4 rounded-lg border border-green/40 bg-green/10 px-4 py-2 text-sm text-green transition hover:bg-green/20"
        >
          Выложить
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
                    {product ? product.title.ru : release.product_slug}
                  </span>
                  <span className="font-mono text-sm text-blue-soft">{release.version}</span>
                  {release.is_current ? (
                    <span className="rounded-full border border-green/40 bg-green/10 px-2 py-0.5 text-xs text-green">
                      актуальный
                    </span>
                  ) : null}
                  <span className="ml-auto text-sm text-muted">{when(release.released_at)}</span>
                </div>

                <p className="mt-2 break-all font-mono text-xs text-faint">
                  {release.storage_bucket}/{release.storage_path}
                  {release.bytes !== null ? ` · ${(release.bytes / 1048576).toFixed(1)} МБ` : ""}
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
          Релизов пока нет. Пока их нет, оплативший покупатель видит «файл готовим».
        </p>
      )}

      <p className="mt-8 max-w-2xl text-xs leading-relaxed text-faint">
        Покупателю не отдаётся ссылка Supabase: её нельзя отозвать ничем, кроме
        обращения в поддержку, и она может пережить собственный срок годности в
        кэше CDN. Покупатель держит наш токен, права проверяются на каждый клик,
        подписанная ссылка на минуту выпускается заново. Лимиты: {TOTAL_LIMIT} выдач
        всего и {DAILY_LIMIT} в сутки на заказ; повтор по тому же файлу в течение
        десяти минут не считается. Отзыв доступа — кнопка на карточке заявки.
      </p>
    </AdminShell>
  );
}
