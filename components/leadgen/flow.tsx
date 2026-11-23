import type { CSSProperties } from "react";

import s from "./flow.module.css";

/**
 * Путь лида четырьмя этапами — на странице «Лидогенерация» и в блоке на
 * главной. Только разметка и CSS: без скриптов, при «меньше движения» стоит.
 */
const STAGES = [
  { label: "Реклама и квиз", sub: "человек ищет услугу", icon: <path d="M4 10v4h3l5 4V6L7 10zM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12" /> },
  { label: "Заявка", sub: "имя, телефон, запрос", icon: <path d="M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h4" /> },
  { label: "Наш звонок", sub: "проверяем интерес", icon: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />, wave: true },
  { label: "Ваш менеджер", sub: "запись или перевод звонка", icon: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0M17 8l2 2 3-3" /> },
] as const;

export function LeadFlow({ className }: { className?: string }) {
  return (
    <div className={[s.flow, className].filter(Boolean).join(" ")} aria-label="Как проходит лид: реклама, заявка, наш звонок, ваш менеджер">
      <span aria-hidden="true" className={s.track}>
        <span className={s.runner} />
      </span>
      {STAGES.map((stage, i) => (
        <div key={stage.label} className={s.stage} style={{ "--i": i } as CSSProperties}>
          <span aria-hidden="true" className={s.icon}>
            <svg viewBox="0 0 24 24">{stage.icon}</svg>
          </span>
          <span className={s.label}>{stage.label}</span>
          {"wave" in stage ? (
            <span aria-hidden="true" className={s.wave}>
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>
          ) : null}
          <span className={s.sub}>{stage.sub}</span>
        </div>
      ))}
    </div>
  );
}
