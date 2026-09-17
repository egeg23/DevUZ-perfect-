import { publishAction, rejectAction } from "@/app/admin/razbor/actions";
import { AdminShell } from "@/components/admin/shell";
import { requireStaff } from "@/lib/admin/guard";
import { forReview } from "@/lib/razbor/store";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const BUTTON =
  "rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs transition hover:border-green/40 hover:text-green";

/**
 * Проверка разборов перед публикацией.
 *
 * Разбор пишет ночная смена, а под именем студии он выходит навсегда: чужой
 * сайт назван плохим публично, и отозвать это нельзя. Поэтому между «смена
 * написала» и «страница в поиске» стоит человек — и это владелец, а не
 * менеджер.
 *
 * Показываются обе статьи целиком, а не заголовки со ссылкой «открыть».
 * Проверка, ради которой нужно кликать, превращается в проверку, которую
 * пролистывают.
 */
export default async function RazborReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ r?: string }>;
}) {
  const staff = await requireStaff();
  if (staff.role !== "admin") notFound();

  const { r } = await searchParams;
  const rows = await forReview();

  return (
    <AdminShell staff={staff}>
      <h1 className="text-lg font-semibold">Разборы на проверке</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        Ночная смена разбирает сайты из касаний, до которых не дошли руки, и
        кладёт статьи сюда. Опубликованное уходит в раздел на сайте и в карту
        сайта сразу, без выкатки. Компания в тексте не называется — ни именем,
        ни адресом.
      </p>

      {r && r !== "ok" ? (
        <p className="mt-4 rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold">{r}</p>
      ) : null}
      {r === "ok" ? (
        <p className="mt-4 rounded-lg border border-green/40 bg-green/10 px-4 py-3 text-sm text-green">
          Опубликовано. Страница уже открывается на сайте.
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p className="mt-8 rounded-xl border border-line bg-surface px-5 py-4 text-sm text-muted">
          Пусто. Смена ещё не приносила разборов — или все уже разобраны.
        </p>
      ) : (
        <ul className="mt-8 space-y-6">
          {rows.map((row) => (
            <li key={row.id} className="rounded-xl border border-line bg-surface px-5 py-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-medium">{row.ru?.title ?? "без заголовка"}</span>
                <span className="text-xs text-faint">
                  {row.category} · {row.city}
                </span>
                {row.lostPer100 ? (
                  <span className="ml-auto font-mono text-xs text-gold">
                    теряет {row.lostPer100[0]}–{row.lostPer100[1]} из 100
                  </span>
                ) : null}
              </div>

              {/* Адрес разобранного сайта — служебный: наружу он не уходит
                  никогда, но проверяющему без него не перепроверить разбор. */}
              <p className="mt-1 font-mono text-[0.7rem] text-faint">
                {row.sourceUrl} · только для проверки, на сайте адреса нет
              </p>

              {(["ru", "uz"] as const).map((locale) => {
                const article = row[locale];
                if (!article) {
                  return (
                    <p key={locale} className="mt-3 text-sm text-gold">
                      Нет статьи на «{locale}» — публиковать половину нельзя.
                    </p>
                  );
                }
                return (
                  <div key={locale} className="mt-4 border-t border-line-soft pt-3">
                    <p className="text-[0.7rem] uppercase tracking-wider text-faint">
                      {locale === "ru" ? "по-русски" : "по-узбекски"} · запрос: {article.query} ·{" "}
                      /{locale}/razbor/{locale === "ru" ? row.slugRu : row.slugUz}
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
                          <p className="mt-1 text-sm text-faint">Что делаем: {f.fix}</p>
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

              {row.notes ? <p className="mt-3 text-xs text-faint">Смена пишет: {row.notes}</p> : null}

              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-3">
                <form action={publishAction}>
                  <input type="hidden" name="razbor" value={row.id} />
                  <button type="submit" className={BUTTON}>
                    Опубликовать
                  </button>
                </form>
                <form action={rejectAction} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="razbor" value={row.id} />
                  <input
                    name="reason"
                    placeholder="почему не публикуем"
                    className="rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs text-text placeholder:text-faint"
                  />
                  <button type="submit" className={BUTTON}>
                    Не публикуем
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
