"use client";

import type { CSSProperties } from "react";

import { ease, phase } from "@/components/hero/use-scroll-progress";
import { BOX_CUTS, BOX_IMG, BOX_SHOTS } from "@/content/box";
import { cn } from "@/lib/cn";

export type CutModel = keyof typeof BOX_CUTS;

/**
 * Сцена коробки: детали, которые собираются или разлетаются по прокрутке.
 *
 * Рецепт из `.claude/skills/proto-master/exploded-view.md`, вариант «кадры
 * вместо 3D»: один кадр разреза из презентации (1920×1086) порезан на
 * горизонтальные слои (scripts/box/assets.py), и всё движение ведёт одно
 * число `progress` от 0 до 1. Каждый слой едет только `transform` и
 * `opacity`: раскладка не трогается, сцена не дёргает соседей.
 *
 * Два режима:
 *  - `assemble` (главная): слои слетаются из разброса в стопку разреза,
 *    стопка сжимается к центру, поверх проявляется собранная коробка, по
 *    корпусу пробегает свет. Разброс у каждого слоя свой, но одинаковый при
 *    каждом открытии: зерно по номеру слоя, как у разлёта деталей SamAuto.
 *  - `explode` (промо, «В разрезе»): наоборот, собранная коробка тает, слои
 *    расходятся по местам, и у каждого загорается номер подписи.
 *
 * При prefers-reduced-motion снаружи приходит progress = 1: статичный кадр,
 * без движения. Картинки грузятся лениво: секции стоят ниже первого экрана.
 */
export function BoxScene({
  model,
  mode,
  progress,
  alt,
  className,
  numbered = false,
  eager = false,
}: {
  model: CutModel;
  mode: "assemble" | "explode";
  progress: number;
  alt: string;
  className?: string;
  /** Номера слоёв у правого края стопки: для подписей «В разрезе». */
  numbered?: boolean;
  /**
   * Грузить сразу, а не лениво. «В разрезе» включает его, когда блок подходит
   * к экрану: ленивые картинки внутри липкого блока с движением iPhone
   * грузил не всегда, и вкладка переключалась на пустую сцену.
   */
  eager?: boolean;
}) {
  const cut = BOX_CUTS[model];
  const [sw, sh] = cut.stage;
  const top0 = cut.rows[0][0];
  const n = cut.rows.length;
  const shot = BOX_SHOTS[model];
  const p = progress;

  // Сжатие стопки: 1 — слои стянуты к центру под собранной коробкой, 0 — разрез.
  const squeeze = mode === "assemble" ? ease(phase(p, 0.58, 0.9)) : 1 - ease(phase(p, 0.05, 0.62));
  // Собранная коробка поверх стопки.
  const shotOn = mode === "assemble" ? ease(phase(p, 0.66, 0.92)) : 1 - ease(phase(p, 0, 0.34));
  // Свет по корпусу после сборки.
  const sweep = mode === "assemble" ? phase(p, 0.9, 1) : 0;

  return (
    <div
      className={cn("box-stage relative w-full select-none", className)}
      style={{ aspectRatio: `${sw} / ${sh}` }}
      role="img"
      aria-label={alt}
    >
      {cut.rows.map(([y0, y1], i) => {
        const top = ((y0 - top0) / sh) * 100;
        const height = ((y1 - y0) / sh) * 100;
        const cy = top + height / 2;
        const s = scatter(i, n);
        // Слёт в стопку: снизу вверх, с небольшим нахлёстом по времени.
        const start = mode === "assemble" ? ((n - 1 - i) / n) * 0.3 : 0;
        const land = mode === "assemble" ? ease(phase(p, start, start + 0.3)) : 1;
        const away = 1 - land;
        const tx = s.dx * away;
        const ty = s.dy * away - (cy - 50) * 0.8 * squeeze;
        const rot = s.rot * away;
        const scale = 0.9 + 0.1 * land - 0.06 * squeeze;
        const opacity = mode === "assemble" ? Math.min(land * 2, 1) * (1 - phase(squeeze, 0.55, 1)) : Math.min(1, 0.35 + (1 - shotOn));
        const style: CSSProperties = {
          transform: `translate3d(${tx}%, ${ty}%, 0) rotate(${rot}deg) scale(${scale})`,
          opacity,
          zIndex: n - i,
        };
        return (
          <div key={i} className="box-layer absolute inset-0" style={style}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${BOX_IMG}/${model}-l${i + 1}.webp`}
              srcSet={`${BOX_IMG}/${model}-l${i + 1}-s.webp 520w, ${BOX_IMG}/${model}-l${i + 1}.webp 980w`}
              sizes="(max-width: 767px) 92vw, 640px"
              alt=""
              loading={eager ? "eager" : "lazy"}
              decoding="async"
              draggable={false}
              className="box-strip absolute left-0 w-full"
              style={{ top: `${top}%`, height: `${height}%` }}
            />
            {numbered ? (
              <span
                className="box-num absolute right-[4%] flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-green/60 bg-ink/80 font-mono text-[0.72rem] text-green"
                style={{ top: `${cy}%`, opacity: 1 - squeeze }}
                aria-hidden="true"
              >
                {i + 1}
              </span>
            ) : null}
          </div>
        );
      })}

      {/* Собранная коробка: центр сцены, ширина сцены. */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ opacity: shotOn, transform: `scale(${0.9 + 0.1 * shotOn})`, zIndex: n + 1, pointerEvents: "none" }}
      >
        <div className="box-shot relative w-full overflow-hidden" style={{ aspectRatio: `${shot.w} / ${shot.h}` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${BOX_IMG}/${model}.webp`}
            srcSet={`${BOX_IMG}/${model}-s.webp 660w, ${BOX_IMG}/${model}.webp 1320w`}
            sizes="(max-width: 767px) 92vw, 640px"
            alt=""
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <span
            aria-hidden="true"
            className={cn("box-sweep", sweep >= 1 && "box-sweep-idle")}
            style={sweep < 1 ? { transform: `translate3d(${-90 + 220 * sweep}%, 0, 0) skewX(-18deg)`, opacity: sweep > 0 ? 1 : 0 } : undefined}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Разброс слоя в начале сборки, в процентах сцены.
 *
 * Зерно по номеру: раскладка одна и та же при каждом открытии, но не
 * идеальная, чтобы разлёт не выглядел линейкой. Чётные летят слева, нечётные
 * справа; дальние от середины уезжают дальше по вертикали.
 */
function scatter(i: number, n: number) {
  const seed = Math.sin((i + 1) * 12.9898) * 43758.5453;
  const r = seed - Math.floor(seed);
  const side = i % 2 ? 1 : -1;
  return {
    dx: side * (26 + r * 34),
    dy: (i - (n - 1) / 2) * 16 + (r - 0.5) * 24,
    rot: side * (5 + r * 9),
  };
}
