import type { ReactNode } from "react";

/**
 * Общие кирпичи панели по эталону «DevUz Офис» (владелец, 03.11.2026):
 * стеклянная карточка, число сводки, метка состояния, «подсказка ИИ» и
 * пустой экран с понятной подсказкой. Стили — `.os-*` в app/globals.css.
 *
 * Состояние — цветной меткой, а не только текстом: «новое» зелёным, «в
 * работе» синим, «ждём» жёлтым, «закрыто» серым, «просрочено» красным.
 * Подпись метки приходит со страницы, из её словаря на языке панели.
 */

export type OsTone = "new" | "work" | "wait" | "done" | "late";

export function OsCard({ title, aside, className = "", children }: { title?: ReactNode; aside?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={`os-glass os-card ${className}`}>
      {title || aside ? (
        <div className="mb-3 flex items-center gap-2.5">
          {title ? <h2 className="text-[15px] font-semibold text-text">{title}</h2> : null}
          {aside ? <div className="ml-auto flex items-center gap-2">{aside}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** Число сводки: подпись, значение и, если есть, сдвиг к прошлому периоду. */
export function OsStat({ label, value, delta, href }: { label: ReactNode; value: ReactNode; delta?: ReactNode; href?: string }) {
  const body = (
    <>
      <div className="flex items-baseline gap-2 font-display text-2xl font-bold tabular-nums text-text">
        {value}
        {delta ? <small className="font-mono text-[11px] font-semibold text-green">{delta}</small> : null}
      </div>
      <div className="mt-1 text-xs text-muted">{label}</div>
    </>
  );
  return href ? (
    <a href={href} className="os-stat block transition hover:border-white/20">
      {body}
    </a>
  ) : (
    <div className="os-stat">{body}</div>
  );
}

export function OsPill({ tone, children }: { tone: OsTone; children: ReactNode }) {
  return <span className={`os-pill os-pill-${tone}`}>{children}</span>;
}

/** Подсказка ИИ — зелёной рамкой, как в эталоне. */
export function OsHint({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section className="os-ai">
      <div className="flex items-center gap-2 text-[13px] font-semibold text-green">
        <svg aria-hidden viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
          <path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />
        </svg>
        {title}
      </div>
      <div className="mt-2 text-sm text-text">{children}</div>
    </section>
  );
}

/** Пустых экранов нет: что сюда попадёт и откуда. */
export function OsEmpty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-muted">{children}</p>;
}
