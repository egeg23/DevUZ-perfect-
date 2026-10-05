import type { CSSProperties } from "react";

import s from "./lab.module.css";

/** Цвета полос сайта — те же, что в lab.module.css. */
export const BAND = {
  ink: "#191337",
  plum: "#2a1f63",
  light: "#f5f4ff",
  lime: "#cff846",
} as const;
export type Band = keyof typeof BAND;

/** Псевдослучайное, но одинаковое на сервере и в браузере: без сдвига при гидратации. */
function rand(seed: number) {
  let x = seed;
  return () => {
    x = (x * 16807) % 2147483647;
    return (x - 1) / 2147483646;
  };
}

const W = 1440;
const H = 160;

/**
 * Стык секций: краска верхней секции стекает каплями в следующую.
 *
 * Сверху — волнистая кромка цвета `from`, из неё свисают подтёки разной
 * длины с круглыми каплями на концах, под некоторыми — отдельные капли.
 * Фон блока — цвет `to`, так что краска «впитывается» в следующую секцию.
 *
 * Движение — только transform: когда стык показался на экране, подтёки
 * вытягиваются вниз (scaleY от верхнего края), капли падают и тают.
 * При «уменьшить движение» всё сразу на месте. Слой декоративный: нажатий
 * не ловит и вслух не читается.
 */
export function Drip({ from, to, seed = 1 }: { from: Band; to: Band; seed?: number }) {
  const r = rand(seed * 7919 + 13);
  const drips: { x: number; w: number; h: number; drop: boolean; i: number }[] = [];
  let x = 20 + r() * 60;
  let i = 0;
  while (x < W - 20) {
    const w = 14 + r() * 34;
    drips.push({ x, w, h: 30 + r() * (H - 60), drop: r() > 0.55, i: i++ });
    x += w + 40 + r() * 110;
  }

  // Волнистая кромка: несколько мягких горбов поперёк ширины.
  const humps = 6;
  let edge = `M0 0 H${W} V18`;
  for (let k = humps; k > 0; k -= 1) {
    const x1 = (W / humps) * k;
    const x0 = (W / humps) * (k - 1);
    const depth = 18 + r() * 22;
    edge += ` Q${(x0 + x1) / 2} ${depth + 14} ${x0} 18`;
  }
  edge += " Z";

  return (
    <div
      className={s.drip}
      style={{ "--from": BAND[from], "--to": BAND[to] } as CSSProperties}
      aria-hidden="true"
      data-reveal=""
    >
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMin slice" className={s.dripSvg}>
        <path d={edge} className={s.dripEdge} />
        {drips.map((d) => (
          <g key={d.i} className={s.dripRun} style={{ "--i": d.i % 7 } as CSSProperties}>
            <rect x={d.x} y={10} width={d.w} height={d.h} rx={d.w / 2} />
            <circle cx={d.x + d.w / 2} cy={10 + d.h - d.w / 2} r={d.w / 2 + 3} />
          </g>
        ))}
        {drips
          .filter((d) => d.drop)
          .map((d) => (
            <circle
              key={`drop-${d.i}`}
              className={s.dripDrop}
              style={{ "--i": d.i % 7 } as CSSProperties}
              cx={d.x + d.w / 2}
              cy={Math.min(H - 10, 10 + d.h + 18 + d.w / 3)}
              r={Math.max(4, d.w / 4)}
            />
          ))}
      </svg>
    </div>
  );
}
