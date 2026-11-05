"use client";

import type { ReactNode } from "react";

import { undoStageAction } from "@/app/admin/hq/actions";

/**
 * Пройденная ступень сделки — кнопкой: нажатие спрашивает «точно?» и
 * снимает её и всё, что после (владелец, 05.11.2026: «Сделай возможность
 * откатывать менеджерам статусы, просто нажимая на статус»). Права решает
 * сервер (undoStage → canMark); ничего не удаляется, в журнале остаётся,
 * кто и когда снял (lib/admin/sales-stages-store.ts).
 */
export function StageUndo({
  stage,
  leadId,
  prospectId,
  back,
  confirm,
  title,
  className,
  children,
}: {
  stage: string;
  leadId: string | null;
  prospectId: string | null;
  back: string;
  confirm: string;
  title: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <form
      action={undoStageAction}
      className="contents"
      onSubmit={(e) => {
        if (!window.confirm(confirm)) e.preventDefault();
      }}
    >
      <input type="hidden" name="stage" value={stage} />
      {leadId ? <input type="hidden" name="lead" value={leadId} /> : null}
      {prospectId ? <input type="hidden" name="prospect" value={prospectId} /> : null}
      <input type="hidden" name="back" value={back} />
      <button type="submit" title={title} className={className}>
        {children}
      </button>
    </form>
  );
}
