import Link from "next/link";
import { notFound } from "next/navigation";

import { saveAction } from "@/app/admin/razbor/actions";
import { AdminShell } from "@/components/admin/shell";
import { requireStaff } from "@/lib/admin/guard";
import { evidenceFor, shootableCodes } from "@/lib/razbor/evidence";
import { razborById, type RazborArticle } from "@/lib/razbor/store";

export const dynamic = "force-dynamic";

const FIELD =
  "mt-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-faint";

/** Сколько пустых находок дописывается в конец: столько можно добавить за раз. */
const SPARE = 2;

/**
 * Правка разбора руками.
 *
 * Ночная смена пишет хорошо, но не всегда точно: где-то формулировка режет
 * ухо, где-то находка не про то. Раньше единственным ответом на это было
 * «не публикуем» — то есть выбросить восемь абзацев из-за одной строки.
 *
 * Чего здесь нельзя менять — и это не забывчивость. Адрес страницы, запрос,
 * ниша, город и цена собираются кодом из каталога. Адрес опубликованного
 * разбора уже стоит в поиске и в карте сайта; переименовать его тихо —
 * значит потерять позицию и получить битую ссылку у всех, кто успел
 * сослаться. Цену студия называет одну и ту же везде, и расходиться ей с
 * прайсом нельзя.
 */
export default async function RazborEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ r?: string }>;
}) {
  const staff = await requireStaff();
  if (staff.role !== "admin") notFound();

  const { id } = await params;
  const { r } = await searchParams;
  const row = await razborById(id);
  if (!row || !row.ru || !row.uz) notFound();

  // Выбирать код можно только из тех, что аудит вынес по этому сайту, и
  // только из тех, которые вообще можно показать. Разрешить любой значило бы
  // разрешить поставить под находкой снимок места, о котором аудит ничего не
  // говорил, — а подпись под картинкой пришла бы из правил и звучала бы
  // уверенно.
  const shootable = new Set(shootableCodes());
  const codes = row.auditCodes.filter((code) => shootable.has(code));

  return (
    <AdminShell staff={staff}>
      <Link href="/admin/razbor" className="text-xs text-faint transition hover:text-green">
        ← к разборам
      </Link>
      <h1 className="mt-2 text-lg font-semibold">{row.ru.title}</h1>
      <p className="mt-1 text-xs text-faint">
        {row.category} · {row.city} · {row.status === "published" ? "опубликован" : "на проверке"} ·{" "}
        {row.sourceUrl}
      </p>

      {r ? (
        <p className="mt-4 rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold">{r}</p>
      ) : null}

      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
        Меняется только текст. Адрес страницы, запрос и цена собираются кодом:
        адрес опубликованного разбора уже стоит в поиске, и переименовать его
        тихо — значит потерять позицию и оставить битую ссылку.
      </p>

      <form action={saveAction} className="mt-8 space-y-10">
        <input type="hidden" name="razbor" value={row.id} />

        {(["ru", "uz"] as const).map((locale) => (
          <Side
            key={locale}
            locale={locale}
            slug={locale === "ru" ? row.slugRu : row.slugUz}
            article={locale === "ru" ? (row.ru as RazborArticle) : (row.uz as RazborArticle)}
            codes={codes}
          />
        ))}

        <div className="flex items-center gap-4 border-t border-line pt-5">
          <button
            type="submit"
            className="rounded-lg border border-green/40 bg-green/10 px-4 py-2 text-sm text-green transition hover:bg-green/20"
          >
            Сохранить
          </button>
          <span className="text-xs text-faint">
            {row.status === "published"
              ? "Страница на сайте обновится сразу после сохранения."
              : "Разбор останется на проверке — опубликовать можно будет со списка."}
          </span>
        </div>
      </form>
    </AdminShell>
  );
}

function Side({
  locale,
  slug,
  article,
  codes,
}: {
  locale: "ru" | "uz";
  slug: string;
  article: RazborArticle;
  codes: string[];
}) {
  // Пустые поля в конце — способ добавить находку без единой строки на
  // клиенте: форма отправляется целиком, а находка без заголовка просто не
  // сохраняется. Тем же способом находка и удаляется — заголовок стирается.
  const findings = [
    ...article.findings,
    ...Array.from({ length: SPARE }, () => ({ code: "", title: "", impact: "", fix: "" })),
  ];

  return (
    <section className="rounded-xl border border-line bg-surface px-5 py-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-faint">
        {locale === "ru" ? "По-русски" : "По-узбекски"}
      </h2>
      <p className="mt-1 font-mono text-[0.7rem] text-faint">
        /{locale}/razbor/{slug} · запрос: {article.query}
      </p>

      <label className="mt-5 block text-xs text-faint">
        Заголовок страницы
        <input name={`${locale}.title`} defaultValue={article.title} className={FIELD} />
      </label>

      <label className="mt-4 block text-xs text-faint">
        Описание для выдачи
        <input name={`${locale}.description`} defaultValue={article.description} className={FIELD} />
      </label>

      <label className="mt-4 block text-xs text-faint">
        Преамбула — абзацы через пустую строку
        <textarea
          name={`${locale}.intro`}
          defaultValue={article.intro.join("\n\n")}
          rows={6}
          className={FIELD}
        />
      </label>

      <p className="mt-6 text-xs text-faint">
        Находки. Пустой заголовок — находка удаляется; в пустых полях внизу
        добавляется новая.
      </p>
      <div className="mt-2 space-y-3">
        {findings.map((finding, i) => {
          const rule = evidenceFor(finding.code);
          return (
            <div key={i} className="rounded-lg border border-line-soft bg-surface-2 px-4 py-3">
              <input
                name={`${locale}.finding.${i}.title`}
                defaultValue={finding.title}
                placeholder="Что видит посетитель"
                className={FIELD}
              />
              <input
                name={`${locale}.finding.${i}.impact`}
                defaultValue={finding.impact}
                placeholder="Чем оборачивается"
                className={FIELD}
              />
              <input
                name={`${locale}.finding.${i}.fix`}
                defaultValue={finding.fix}
                placeholder="Что делаем"
                className={FIELD}
              />
              {/* Какой снимок привязан к находке.
                  Списком, а не скрытым полем: разборы, написанные до
                  появления снимков, кода не несут вовсе, и без выбора
                  руками они остались бы без картинок навсегда. */}
              <label className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[0.65rem] text-faint">
                снимок:
                <select
                  name={`${locale}.finding.${i}.code`}
                  defaultValue={finding.code ?? ""}
                  className="rounded-lg border border-line bg-surface px-2 py-1 text-[0.7rem] text-text"
                >
                  <option value="">без снимка</option>
                  {/* Прежний код остаётся в списке, даже если аудит его
                      больше не выносит: иначе открытие страницы правки
                      молча отвязало бы уже снятую картинку. */}
                  {Array.from(new Set([...(finding.code ? [finding.code] : []), ...codes])).map((code) => {
                    const option = evidenceFor(code);
                    return (
                      <option key={code} value={code}>
                        {option ? option.caption[locale] : code}
                      </option>
                    );
                  })}
                </select>
                {rule ? null : finding.code ? "такой снимок не снимается" : null}
              </label>
            </div>
          );
        })}
      </div>

      <label className="mt-6 block text-xs text-faint">
        Что это даёт — абзацы через пустую строку
        <textarea
          name={`${locale}.outcome`}
          defaultValue={article.outcome.join("\n\n")}
          rows={5}
          className={FIELD}
        />
      </label>

      <p className="mt-4 text-xs text-faint">Цена: {article.price} — из прайса, руками не меняется.</p>
    </section>
  );
}
