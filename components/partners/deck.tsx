import type { ReactNode } from "react";

import { PrintButton } from "@/components/partners/print-button";
import { Container } from "@/components/ui/container";

/**
 * Каркас презентации: слайды одной колонкой на экране и по листу на слайд
 * при печати (стили — #deck в globals.css). Кнопка PDF и подсказка к ней в
 * печать не попадают.
 *
 * Лист — А4 альбомом без полей. Правило стоит здесь, а не в globals.css:
 * именованная страница (`page: deck`) к блоку с position: absolute Chrome не
 * применяет и печатает Letter книжкой, а общее @page досталось бы счёту.
 */
const PAGE = "@page { size: A4 landscape; margin: 0; }";

export function Deck({
  kicker,
  pdf,
  pdfHint,
  children,
}: {
  kicker: string;
  pdf: string;
  pdfHint: string;
  children: ReactNode;
}) {
  return (
    <Container className="pb-16 pt-28 sm:pb-24 sm:pt-32">
      <style>{PAGE}</style>
      <div id="deck" className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="deck-noprint flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-green">{kicker}</p>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-faint sm:inline">{pdfHint}</span>
            <PrintButton label={pdf} />
          </div>
        </div>
        {children}
      </div>
    </Container>
  );
}

export function Slide({ children, accent = false }: { children: ReactNode; accent?: boolean }) {
  return (
    <section
      className={`deck-slide flex flex-col justify-center rounded-2xl border px-6 py-10 sm:px-12 sm:py-14 ${
        accent ? "border-green/30 bg-[#0b1512]" : "border-white/12 bg-[#0d1117]"
      }`}
    >
      {children}
    </section>
  );
}

export function SlideTitle({ children }: { children: ReactNode }) {
  return <h2 className="font-display text-2xl font-semibold sm:text-4xl">{children}</h2>;
}

/** «2 500 $» по-русски и по-узбекски, «$2,500» — по-английски и по-китайски. */
export function usd(locale: string, amount: number): string {
  return locale === "en" || locale === "zh" ? `$${amount.toLocaleString("en-US")}` : `${amount.toLocaleString("ru-RU")} $`;
}
