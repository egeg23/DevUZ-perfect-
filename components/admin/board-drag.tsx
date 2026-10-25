"use client";

import { useRef, type DragEvent, type ReactNode } from "react";

/**
 * Перенос карточки доски в колонку (components/admin/lead-board.tsx).
 *
 * Своих правил здесь нет: перенос только нажимает за человека кнопку той
 * ступени, что уже стоит на карточке. «Есть интерес» уходит сразу, у
 * «Показал макет» и «Назвал цену» открывается выбор (как показали, сумма) —
 * угадывать их за человека нельзя. Нет на карточке кнопки этой ступени —
 * колонка краснеет и ничего не происходит: «макет» и «оплату» база ставит
 * сама. На телефоне переноса нет — там те же кнопки на карточке.
 */
export function BoardDrag({
  markable,
  hint,
  no,
  children,
}: {
  markable: readonly string[];
  hint: string;
  no: string;
  children: ReactNode;
}) {
  const dragged = useRef<HTMLElement | null>(null);

  const columnOf = (e: DragEvent) => (e.target as HTMLElement).closest<HTMLElement>("[data-board-column]");
  const markOn = (card: HTMLElement | null, stage: string) =>
    card?.querySelector<HTMLElement>(`[data-board-mark="${stage}"]`) ?? null;
  const clear = () => {
    for (const el of document.querySelectorAll<HTMLElement>("[data-board-column][data-drop]")) {
      el.removeAttribute("data-drop");
      el.removeAttribute("title");
    }
  };

  return (
    <div
      onDragStart={(e) => {
        const card = (e.target as HTMLElement).closest<HTMLElement>("[data-board-card]");
        if (!card) return;
        dragged.current = card;
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", card.dataset.boardCard ?? "");
      }}
      onDragOver={(e) => {
        const column = columnOf(e);
        if (!column || !dragged.current) return;
        const stage = column.dataset.boardColumn ?? "";
        const ok = markable.includes(stage) && markOn(dragged.current, stage) !== null;
        clear();
        column.setAttribute("data-drop", ok ? "yes" : "no");
        column.setAttribute("title", ok ? hint : no);
        if (ok) e.preventDefault();
      }}
      onDragLeave={(e) => {
        const column = columnOf(e);
        if (column && !column.contains(e.relatedTarget as Node | null)) column.removeAttribute("data-drop");
      }}
      onDrop={(e) => {
        e.preventDefault();
        const column = columnOf(e);
        const card = dragged.current;
        clear();
        dragged.current = null;
        if (!column || !card) return;
        const mark = markOn(card, column.dataset.boardColumn ?? "");
        if (!mark) return;
        const details = mark.querySelector("details");
        if (details) {
          details.open = true;
          mark.scrollIntoView({ block: "nearest" });
          mark.querySelector<HTMLElement>("input:not([type=hidden]), button[type=submit]")?.focus();
          return;
        }
        mark.querySelector("form")?.requestSubmit();
      }}
      onDragEnd={() => {
        clear();
        dragged.current = null;
      }}
      // Карточки становятся переносимыми только со скриптом: без него —
      // обычные кнопки, и ничего не делает вид, что тянется.
      ref={(el) => {
        if (!el) return;
        for (const card of el.querySelectorAll<HTMLElement>("[data-board-card]")) {
          card.draggable = true;
          card.classList.add("cursor-grab");
        }
      }}
    >
      {children}
    </div>
  );
}
