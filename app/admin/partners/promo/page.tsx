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
import { cabinetCopy } from "@/content/partner-cabinet";
import { helpAnchor } from "@/lib/admin/help";
import { requireAdmin } from "@/lib/admin/guard";
import { listPromo, promoStats } from "@/lib/partners/promo";
import {
  PROMO_LOCALES,
  PROMO_LOCALE_TITLE,
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

const RESULT: Record<string, { text: string; tone: "ok" | "warn" }> = {
  saved: { text: "Сохранено. Партнёры видят новое название и подпись.", tone: "ok" },
  hidden: { text: "Скрыто: партнёры материал больше не видят и не скачают. Вернуть — «Показать партнёрам».", tone: "ok" },
  shown: { text: "Материал снова в кабинете партнёров.", tone: "ok" },
  deleted: { text: "Удалено вместе с файлом. Уже скачанные партнёрами копии остаются у них.", tone: "ok" },
  invalid: { text: "Название — от двух знаков.", tone: "warn" },
  gone: { text: "Такого материала уже нет.", tone: "warn" },
  offline: { text: "База недоступна.", tone: "warn" },
  failed: { text: "Не получилось. Попробуйте ещё раз.", tone: "warn" },
};

const SHAPE: Record<string, string> = { vertical: "вертикальное 9:16", square: "квадрат", horizontal: "горизонтальное 16:9" };

const SMALL =
  "rounded-lg border border-line bg-ink px-2 py-1 text-xs text-text outline-none focus:border-green/50";
const BUTTON =
  "rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs transition hover:border-green/40 hover:text-green";

export default async function PromoPage({ searchParams }: { searchParams: Promise<{ r?: string }> }) {
  const admin = await requireAdmin();
  const { r } = await searchParams;
  const notice = r ? RESULT[r] : null;

  const [materials, stats] = await Promise.all([listPromo({ withHidden: true }), promoStats()]);
  const example = cabinetCopy("ru").mediaCaption("devuz.studio/r/…");

  return (
    <AdminShell staff={admin}>
      <p className="text-xs text-faint">
        <Link href="/admin/partners" className="hover:text-green">
          ← Партнёры
        </Link>
      </p>
      <h1 className="mt-2 text-lg font-semibold">Промо-материалы</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Ролики и картинки студии, которые партнёры берут в кабинете и выкладывают у себя: в Reels,
        Shorts, TikTok, сторис, каналы. Под каждым материалом у партнёра — «Скачать» и подпись к посту,
        в которую уже вставлена его короткая ссылка. Клиенты, пришедшие по ней, засчитываются
        партнёру, как по любой его ссылке. Файлы лежат на нашем сервере, до 500 МБ каждый.
      </p>

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
        Загрузить
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
        В кабинете партнёров · {materials.filter((m) => !m.hidden).length}
        {materials.some((m) => m.hidden) ? ` · скрыто ${materials.filter((m) => m.hidden).length}` : ""}
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
                    shape ? SHAPE[shape] : null,
                    m.width && m.height ? `${m.width}×${m.height}` : null,
                    m.duration_s ? `${Math.round(m.duration_s)} с` : null,
                    promoSize(m.bytes, "МБ") || null,
                    PROMO_LOCALE_TITLE[m.locale],
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p className="mt-1 text-xs">
                  {m.hidden ? <span className="text-gold">скрыто от партнёров · </span> : null}
                  {stat ? (
                    <span className="text-green">
                      скачали {stat.downloads} раз · партнёров: {stat.partners}
                    </span>
                  ) : (
                    <span className="text-faint">ещё не скачивали</span>
                  )}
                  <span className="text-faint"> · выложено {when(m.created_at)}</span>
                </p>

                <form action={promoUpdateAction} className="mt-3 flex flex-1 flex-col gap-2">
                  <input type="hidden" name="promo" value={m.id} />
                  <input name="title" required minLength={2} maxLength={120} defaultValue={m.title} aria-label="Название" className={SMALL} />
                  <select name="locale" defaultValue={m.locale} aria-label="Язык" className={SMALL}>
                    {PROMO_LOCALES.map((locale) => (
                      <option key={locale} value={locale}>
                        {PROMO_LOCALE_TITLE[locale]}
                      </option>
                    ))}
                  </select>
                  <textarea
                    name="caption"
                    rows={3}
                    maxLength={1000}
                    defaultValue={m.caption ?? ""}
                    placeholder={`Пусто — подпись по умолчанию: ${example}`}
                    aria-label="Подпись к посту"
                    className={`${SMALL} flex-1`}
                  />
                  <button type="submit" className="self-start text-xs text-faint hover:text-green">
                    сохранить
                  </button>
                </form>

                <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line-soft pt-3">
                  <form action={promoVisibilityAction}>
                    <input type="hidden" name="promo" value={m.id} />
                    <input type="hidden" name="hidden" value={m.hidden ? "0" : "1"} />
                    <button type="submit" className={BUTTON}>
                      {m.hidden ? "Показать партнёрам" : "Скрыть от партнёров"}
                    </button>
                  </form>
                  {/* Удаление — через раскрытие: одно случайное нажатие не должно уносить файл. */}
                  <details className="text-xs">
                    <summary className="cursor-pointer text-faint hover:text-gold">удалить</summary>
                    <form action={promoDeleteAction} className="mt-2">
                      <input type="hidden" name="promo" value={m.id} />
                      <button type="submit" className="rounded-lg border border-gold/40 px-3 py-1.5 text-gold hover:bg-gold/10">
                        Удалить насовсем
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
          Материалов пока нет — партнёры не видят этот блок в кабинете вовсе. Загрузите первый ролик выше.
        </p>
      )}
    </AdminShell>
  );
}
