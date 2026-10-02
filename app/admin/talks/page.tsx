import Link from "next/link";

import { AdminShell } from "@/components/admin/shell";
import { when } from "@/components/admin/lead-table";
import { leadLocaleDict } from "@/content/admin-panel/stats";
import { talkOutcomeDict, talksDict } from "@/content/admin-panel/talks";
import { requireStaff } from "@/lib/admin/guard";
import { pick } from "@/lib/admin/i18n";
import type { TalkOutcome } from "@/lib/talk/review";
import { listReviews } from "@/lib/talk/review-store";

export const dynamic = "force-dynamic";

/**
 * Надзор: что показали разговоры с клиентами.
 *
 * Владелец: «можно чтобы чаты в скауте мониторились арбитром или
 * надзирателем, на основании ответов клиентов строились разные подходы к
 * общению… в идеале самообучающаяся модель».
 *
 * Эта страница — первая половина. После каждой успокоившейся переписки
 * вторая модель читает её целиком и отвечает на четыре вопроса: что
 * зацепило, какое возражение прозвучало, где сломалось и какой отсюда урок.
 * Уроки копятся и лежат здесь.
 *
 * Вторая половина — подмешивать их в промпт следующего письма — намеренно не
 * включена. На день, когда это писалось, настоящих ответов от клиентов было
 * два. Вывод из двух разговоров — не статистика, а выдумка с уверенным лицом;
 * система, обученная на ней, будет уверенно повторять случайность. Поэтому
 * сперва объём, и только потом обучение.
 */

const OUTCOME_TONE: Record<TalkOutcome, string> = {
  refused: "text-red-300",
  asked_human: "text-green",
  qualified: "text-green",
  stalled: "text-muted",
  talking: "text-gold",
};

function Tile({ value, label, hint }: { value: string | number; label: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-5 py-4">
      <p className="font-mono text-2xl">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wider text-faint">{label}</p>
      {hint ? <p className="mt-1.5 text-xs leading-relaxed text-faint">{hint}</p> : null}
    </div>
  );
}

function Line({ title, text }: { title: string; text: string | null }) {
  if (!text) return null;
  return (
    <p className="mt-2 text-sm leading-relaxed text-muted">
      <span className="text-xs uppercase tracking-wider text-faint">{title}: </span>
      {text}
    </p>
  );
}

export default async function TalksPage() {
  const staff = await requireStaff();
  const rows = await listReviews();
  const locale = staff.panel_locale;
  const t = pick(talksDict, locale);
  const outcomeLabel = pick(talkOutcomeDict, locale);
  const langLabel = pick(leadLocaleDict, locale);

  const lessons = rows.filter((r) => r.lesson && r.confidence === "high");
  const refused = rows.filter((r) => r.outcome === "refused").length;
  const uz = rows.filter((r) => r.lang === "uz").length;

  return (
    <AdminShell staff={staff}>
      <h1 className="text-lg font-semibold">{t.title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        {t.intro}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile value={rows.length} label={t.tileReviewed} />
        <Tile
          value={lessons.length}
          label={t.tileLessons}
          hint={t.tileLessonsHint}
        />
        <Tile value={refused} label={t.tileRefused} />
        <Tile value={uz} label={t.tileUzbek} />
      </div>

      {/* Пока уроков мало — так и сказано. Пустая страница с бодрым
          заголовком врёт не меньше, чем выдуманный вывод. */}
      <p className="mt-6 max-w-2xl rounded-xl border border-gold/30 bg-gold/5 px-5 py-4 text-sm leading-relaxed text-gold">
        {t.notYet}
      </p>

      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-faint">
          {t.empty}
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((row) => (
            <li key={row.id} className="rounded-xl border border-line bg-surface px-5 py-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-mono text-xs text-blue-soft">{row.host}</span>
                <span className={`text-xs ${OUTCOME_TONE[row.outcome]}`}>
                  {outcomeLabel[row.outcome]}
                </span>
                <span className="text-xs text-faint">
                  {row.lang in langLabel ? langLabel[row.lang as keyof typeof langLabel] : row.lang} · {t.turns(row.turns)} · {when(row.createdAt, locale)}
                </span>
                {row.confidence === "low" ? (
                  <span className="text-xs text-faint">{t.weak}</span>
                ) : null}
                {row.leadId ? (
                  <Link href={`/admin/leads/${row.leadId}`} className="ml-auto text-xs text-green hover:underline">
                    {t.lead}
                  </Link>
                ) : null}
              </div>

              {row.lesson ? (
                <p className="mt-3 rounded-lg border border-green/25 bg-green/5 px-4 py-2.5 text-sm leading-relaxed text-green">
                  {row.lesson}
                </p>
              ) : null}

              <Line title={t.hook} text={row.hook} />
              <Line title={t.objection} text={row.objection} />
              <Line title={t.failed} text={row.failed} />
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
