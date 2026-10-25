import Link from "next/link";

import { BoardDrag } from "@/components/admin/board-drag";
import { InterestButton, PricedButton, ShownButton } from "@/components/admin/sales-stages";
import { homeDict } from "@/content/admin-panel/home";
import { salesStagesDict } from "@/content/admin-panel/sales-stages";
import { pick, type PanelLocale } from "@/lib/admin/i18n";
import { BOARD_STAGES, MARKABLE, daysIn, nextMarks, type Board, type BoardStage } from "@/lib/admin/lead-board";
import { dealHref } from "@/lib/admin/sales-stages";

/**
 * «Лиды» доской (lib/admin/lead-board.ts): колонки — ступени продажи, над
 * колонкой — что бот делает на ней сам, карточка — компания с отметками.
 *
 * Владелец, 25.10.2026: «Погнали по порядку» — на «Лиды доской, перетащил
 * — ступень отмечена» и «правила видны над колонками, как в Kommo».
 * Отметки — те же кнопки и то же действие, что в карточке лида и в
 * «Моих макетах» (markStageAction): кто что вправе отметить, решает
 * сервер. Перенос карточки в колонку (BoardDrag) только нажимает за
 * человека нужную кнопку на карточке: без скрипта доска работает так же.
 */
export const BOARD_BACK = "/admin?view=board";

export function LeadBoard({
  board,
  locale,
  names,
  showOwner,
  autopilotLink,
  now,
}: {
  board: Board;
  locale: PanelLocale;
  /** id → имя: кто ведёт компанию; видно тем, кто смотрит всех. */
  names: Readonly<Record<string, string>>;
  showOwner: boolean;
  /** Владельцу — где выключается автопрогон касаний. */
  autopilotLink: boolean;
  now: number;
}) {
  const t = pick(homeDict, locale);
  const s = pick(salesStagesDict, locale);
  return (
    <section aria-label={t.viewBoard} className="mt-6">
      <p className="max-w-3xl text-xs leading-relaxed text-faint">{t.boardLead}</p>
      {board.written ? (
        <p className="mt-1 text-xs text-faint">
          <Link href="/admin/prospect" className="hover:text-text">
            {t.boardWritten(board.written)}
          </Link>
        </p>
      ) : null}

      <BoardDrag markable={MARKABLE} hint={t.boardDropHint} no={t.boardDropNo}>
        <div className="no-scrollbar -mx-4 mt-4 flex snap-x gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
          {BOARD_STAGES.map((stage) => (
            <Column key={stage} stage={stage} board={board} locale={locale} names={names} showOwner={showOwner} now={now} />
          ))}
        </div>
      </BoardDrag>

      {autopilotLink ? (
        <p className="mt-2 text-xs text-faint">
          <Link href="/admin/prospect#autopilot" className="hover:text-text">
            {t.boardAutopilot}
          </Link>
        </p>
      ) : null}
      <p className="sr-only">{s.lead}</p>
    </section>
  );
}

function Column({
  stage,
  board,
  locale,
  names,
  showOwner,
  now,
}: {
  stage: BoardStage;
  board: Board;
  locale: PanelLocale;
  names: Readonly<Record<string, string>>;
  showOwner: boolean;
  now: number;
}) {
  const t = pick(homeDict, locale);
  const s = pick(salesStagesDict, locale);
  const cards = board.columns[stage];
  const manual = MARKABLE.includes(stage);
  return (
    <div
      data-board-column={stage}
      className="flex w-[17rem] shrink-0 snap-start flex-col rounded-2xl border border-line bg-surface p-3 transition-colors data-[drop=no]:border-red-300/40 data-[drop=yes]:border-green/60 data-[drop=yes]:bg-green/5"
    >
      <h2 className="flex items-baseline justify-between gap-2 text-sm font-semibold text-text">
        <span className="first-letter:uppercase">{s[stage]}</span>
        <span className="font-mono text-xs text-faint">{cards.length}</span>
      </h2>
      {/* Что на этой ступени делается само, а что — вами. */}
      <p className="mt-1 text-[11px] leading-snug text-faint">
        {manual ? null : <span className="mr-1 rounded bg-surface-2 px-1 py-0.5 text-[10px] uppercase tracking-wider">{t.boardAuto}</span>}
        {t[`rule_${stage}`]}
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {cards.length ? (
          cards.map(({ deal, since }) => (
            <li
              key={deal.key}
              data-board-card={deal.key}
              className="rounded-xl border border-line-soft bg-surface-2 px-3 py-2.5"
            >
              <Link href={dealHref(deal)} className="block truncate text-sm text-text hover:text-green">
                {deal.label}
              </Link>
              <p className="mt-0.5 text-[11px] text-faint">
                {t.boardDays(daysIn(since, now))}
                {showOwner ? ` · ${deal.ownerId ? (names[deal.ownerId] ?? "—") : t.freeLeads}` : null}
              </p>
              {nextMarks(stage).length ? (
                <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                  {nextMarks(stage).map((mark) => (
                    <div key={mark} data-board-mark={mark}>
                      {mark === "interest" ? (
                        <InterestButton leadId={deal.leadId} prospectId={deal.prospectId} back={BOARD_BACK} s={s} />
                      ) : mark === "shown" ? (
                        <ShownButton leadId={deal.leadId} prospectId={deal.prospectId} back={BOARD_BACK} s={s} />
                      ) : (
                        <PricedButton leadId={deal.leadId} prospectId={deal.prospectId} back={BOARD_BACK} s={s} />
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
            </li>
          ))
        ) : (
          <li className="px-1 text-xs text-faint">{t.boardEmpty}</li>
        )}
      </ul>
    </div>
  );
}
