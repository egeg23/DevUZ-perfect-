import Link from "next/link";
import { notFound } from "next/navigation";

import {
  deleteAction,
  publishAction,
  rejectAction,
  unpublishAction,
} from "@/app/admin/razbor/actions";
import { AdminShell } from "@/components/admin/shell";
import { ShotState } from "@/components/admin/razbor-shots";
import { razborDict, razborResultDict } from "@/content/admin-panel/razbor";
import { isTender } from "@/lib/razbor/tender";
import { requireStaff } from "@/lib/admin/guard";
import { pick, type PanelLocale } from "@/lib/admin/i18n";
import { forReview, history, type ReviewRow } from "@/lib/razbor/store";

export const dynamic = "force-dynamic";

const BUTTON =
  "rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs transition hover:border-green/40 hover:text-green";

const INPUT =
  "rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs text-text placeholder:text-faint";

function day(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}.${m}.${y}`;
}

/**
 * Проверка разборов перед публикацией и история того, что уже вышло.
 *
 * Разбор пишет ночная смена, а под именем студии он выходит навсегда: чужой
 * сайт назван плохим публично, и отозвать это нельзя. Поэтому между «смена
 * написала» и «страница в поиске» стоит человек — и это владелец, а не
 * менеджер.
 *
 * Показываются обе статьи целиком, а не заголовки со ссылкой «открыть».
 * Проверка, ради которой нужно кликать, превращается в проверку, которую
 * пролистывают.
 *
 * Ниже — история. Без неё страница отвечала только на вопрос «что проверить
 * сейчас»; на вопрос «что вообще стоит у нас на сайте» ответа не было, а
 * снять вчерашний разбор или поправить в нём опечатку можно было только
 * руками в базе.
 */
export default async function RazborReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ r?: string; d?: string }>;
}) {
  const staff = await requireStaff();
  if (staff.role !== "admin") notFound();

  const { r, d } = await searchParams;
  const locale = staff.panel_locale;
  const t = pick(razborDict, locale);
  const results = pick(razborResultDict, locale);
  // У «confirm» в тексте — слово на языке панели; у остальных — данные из адреса.
  const notice = r
    ? Object.hasOwn(results, r)
      ? results[r as keyof typeof results](r === "confirm" ? t.deleteWord : (d ?? ""))
      : r
    : null;
  const [rows, past] = await Promise.all([forReview(), history()]);
  const published = past.filter((row) => row.status === "published");
  const rejected = past.filter((row) => row.status === "rejected");

  return (
    <AdminShell staff={staff}>
      <h1 className="text-lg font-semibold">{t.title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{t.intro}</p>

      {r && r !== "ok" ? (
        <p className="mt-4 rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold">{notice}</p>
      ) : null}
      {r === "ok" ? (
        <p className="mt-4 rounded-lg border border-green/40 bg-green/10 px-4 py-3 text-sm text-green">{notice}</p>
      ) : null}

      {/* ── На проверке ──────────────────────────────────────────────── */}
      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wider text-faint">
        {t.onReview(rows.length)}
      </h2>

      {rows.length === 0 ? (
        <p className="mt-4 rounded-xl border border-line bg-surface px-5 py-4 text-sm text-muted">
          {t.reviewEmpty}
        </p>
      ) : (
        <ul className="mt-4 space-y-6">
          {rows.map((row) => (
            <li key={row.id} className="rounded-xl border border-line bg-surface px-5 py-4">
              <Head row={row} locale={locale} />

              {/* Адрес разобранного сайта — служебный: наружу он не уходит
                  никогда, но проверяющему без него не перепроверить разбор.
                  У тендерного разбора сайта нет — вместо адреса тема. */}
              <p className="mt-1 font-mono text-[0.7rem] text-faint">
                {isTender(row.category) ? t.tenderNote : t.sourceNote(row.sourceUrl)}
              </p>

              {(["ru", "uz"] as const).map((lang) => {
                const article = row[lang];
                if (!article) {
                  return (
                    <p key={lang} className="mt-3 text-sm text-gold">
                      {t.noArticle(lang)}
                    </p>
                  );
                }
                return (
                  <div key={lang} className="mt-4 border-t border-line-soft pt-3">
                    <p className="text-[0.7rem] uppercase tracking-wider text-faint">
                      {lang === "ru" ? t.inRu : t.inUz} · {t.query} {article.query} ·{" "}
                      /{lang}/razbor/{lang === "ru" ? row.slugRu : row.slugUz}
                    </p>
                    <p className="mt-2 text-sm font-medium">{article.title}</p>
                    <p className="mt-1 text-sm text-muted">{article.description}</p>
                    {article.intro.map((para, i) => (
                      <p key={i} className="mt-2 whitespace-pre-line text-sm leading-relaxed">
                        {para}
                      </p>
                    ))}
                    <ul className="mt-3 space-y-2">
                      {article.findings.map((f, i) => (
                        <li key={i} className="rounded-lg border border-line-soft bg-surface-2 px-4 py-2.5">
                          <p className="text-sm font-medium">{f.title}</p>
                          <p className="mt-1 text-sm text-muted">{f.impact}</p>
                          <p className="mt-1 text-sm text-faint">{t.whatWeDo(f.fix)}</p>
                        </li>
                      ))}
                    </ul>
                    {article.outcome.length ? (
                      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
                        {article.outcome.map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    ) : null}
                    <p className="mt-2 text-sm text-text">{article.price}</p>
                  </div>
                );
              })}

              {row.notes ? <p className="mt-3 text-xs text-faint">{t.shiftSays(row.notes)}</p> : null}

              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-3">
                <form action={publishAction}>
                  <input type="hidden" name="razbor" value={row.id} />
                  <button type="submit" className={BUTTON}>
                    {t.publish}
                  </button>
                </form>
                <Link href={`/admin/razbor/${row.id}`} className={BUTTON}>
                  {t.edit}
                </Link>
                <form action={rejectAction} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="razbor" value={row.id} />
                  <input name="reason" placeholder={t.rejectPh} className={INPUT} />
                  <button type="submit" className={BUTTON}>
                    {t.reject}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* ── Опубликованные ───────────────────────────────────────────── */}
      <h2 className="mt-12 text-sm font-semibold uppercase tracking-wider text-faint">
        {t.published(published.length)}
      </h2>

      {published.length === 0 ? (
        <p className="mt-4 rounded-xl border border-line bg-surface px-5 py-4 text-sm text-muted">
          {t.publishedEmpty}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {published.map((row) => (
            <li key={row.id} className="rounded-xl border border-line bg-surface px-5 py-4">
              <Head row={row} locale={locale} />
              <p className="mt-1 text-xs text-faint">
                {row.publishedAt ? t.publishedOn(day(row.publishedAt)) : t.noDate}
              </p>

              {/* Ссылки на живые страницы, а не на предпросмотр: проверять
                  надо то, что видит читатель, вместе с картинками и
                  разметкой. */}
              <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[0.7rem]">
                <a
                  href={`/ru/razbor/${row.slugRu}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-green underline underline-offset-4"
                >
                  /ru/razbor/{row.slugRu}
                </a>
                <a
                  href={`/uz/razbor/${row.slugUz}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-green underline underline-offset-4"
                >
                  /uz/razbor/{row.slugUz}
                </a>
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line pt-3">
                <Link href={`/admin/razbor/${row.id}`} className={BUTTON}>
                  {t.edit}
                </Link>
                <form action={unpublishAction}>
                  <input type="hidden" name="razbor" value={row.id} />
                  <button type="submit" className={BUTTON}>
                    {t.unpublish}
                  </button>
                </form>
                <Remove id={row.id} locale={locale} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* ── Отклонённые ──────────────────────────────────────────────── */}
      {rejected.length ? (
        <>
          <h2 className="mt-12 text-sm font-semibold uppercase tracking-wider text-faint">
            {t.rejected(rejected.length)}
          </h2>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-faint">{t.rejectedAbout}</p>
          <ul className="mt-4 space-y-2">
            {rejected.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-2 rounded-xl border border-line bg-surface px-5 py-3"
              >
                <span className="text-sm">{row.ru?.title ?? row.sourceUrl}</span>
                <span className="text-xs text-faint">
                  {row.category} · {row.city} · {day(row.created_at)}
                </span>
                {row.notes ? <span className="text-xs text-gold">{row.notes}</span> : null}
                <span className="ml-auto">
                  <Remove id={row.id} locale={locale} />
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </AdminShell>
  );
}

function Head({ row, locale }: { row: ReviewRow; locale: PanelLocale }) {
  const t = pick(razborDict, locale);
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className="font-medium">{row.ru?.title ?? t.noTitle}</span>
      <span className="text-xs text-faint">
        {isTender(row.category) ? t.tenders : `${row.category} · ${row.city}`}
      </span>
      {isTender(row.category) ? null : <ShotState shots={row.shots} locale={locale} />}
      {row.lostPer100 ? (
        <span className="ml-auto font-mono text-xs text-gold">{t.loses(row.lostPer100[0], row.lostPer100[1])}</span>
      ) : null}
    </div>
  );
}

/** Удаление сносит и отпечаток адреса — отсюда слово в поле, а не одна кнопка. */
function Remove({ id, locale }: { id: string; locale: PanelLocale }) {
  const t = pick(razborDict, locale);
  return (
    <form action={deleteAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="razbor" value={id} />
      <input name="confirm" placeholder={t.deleteWord} className={`${INPUT} w-24`} />
      <button type="submit" className={BUTTON}>
        {t.delete}
      </button>
    </form>
  );
}
