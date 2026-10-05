"use client";

import { useEffect, useRef } from "react";

const GLYPHS = ["A", "B", "C", "É", "Ç", "è", "W", "ô", "Q", "à", "K", "œ", "Y", "ê", "Z", "?"];
const COLORS = ["#cff846", "#8d66ff", "#e995be", "#7dc2e3"];

/**
 * Буквы за первым экраном — то, что у эталона было молекулами: английские
 * и французские буквы медленно плывут, близкие соединяются линией, как
 * слова из букв. Canvas 2D, двигается только пока виден; при «уменьшить
 * движение» рисуется один раз и стоит. Нажатий не ловит, вслух не читается.
 */
export function Letters({ className }: { className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const node = canvas.current;
    const ctx = node?.getContext("2d");
    if (!node || !ctx) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const small = window.innerWidth < 768;
    const count = small ? 14 : 26;
    const reach = small ? 120 : 170;
    let w = 0;
    let h = 0;
    const resize = () => {
      w = node.clientWidth;
      h = node.clientHeight;
      node.width = Math.round(w * dpr);
      node.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const dots = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: i % 4 === 0 ? 28 : 18,
      glyph: GLYPHS[i % GLYPHS.length],
      color: COLORS[i % COLORS.length],
    }));
    const font = getComputedStyle(node).fontFamily || "sans-serif";

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < dots.length; i += 1) {
        for (let j = i + 1; j < dots.length; j += 1) {
          const d = Math.hypot(dots[i].x - dots[j].x, dots[i].y - dots[j].y);
          if (d < reach) {
            ctx.strokeStyle = `rgba(229,228,238,${(0.2 * (1 - d / reach)).toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.stroke();
          }
        }
      }
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const dot of dots) {
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = dot.color;
        ctx.font = `${dot.size}px ${font}`;
        ctx.fillText(dot.glyph, dot.x, dot.y);
      }
      ctx.globalAlpha = 1;
    };

    if (still) {
      draw();
      return;
    }

    let frame = 0;
    let visible = true;
    const step = () => {
      for (const dot of dots) {
        dot.x += dot.vx;
        dot.y += dot.vy;
        if (dot.x < 0 || dot.x > w) dot.vx *= -1;
        if (dot.y < 0 || dot.y > h) dot.vy *= -1;
      }
      draw();
      frame = visible ? requestAnimationFrame(step) : 0;
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !frame) frame = requestAnimationFrame(step);
    });
    io.observe(node);
    window.addEventListener("resize", resize);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvas} className={className} aria-hidden="true" />;
}
