"use client";

import { useEffect, useRef, useState } from "react";

/** Строки, из которых складывается дождь. Подсветка — по типу токена. */
const SNIPPETS: Array<[string, string]> = [
  ["key", "export async function qualifyLead(msg) {"],
  ["fn", "const icp = scoreIcp(msg.niche)"],
  ["str", 'hreflang("uz-UZ", "zh-Hans")'],
  ["fn", "await telegram.send(SALES_CHAT, card)"],
  ["com", "// ICP · Tier 1 → 30 pts"],
  ["key", "class OrderTracker extends State {"],
  ["punc", "SELECT * FROM orders WHERE status"],
  ["fn", "const hits = await rag.search(query)"],
  ["num", "if (score >= 75) notifySales()"],
  ["key", "return { tier, bant, score }"],
  ["com", "// build · step 2 of 4",],
  ["fn", "docker compose up -d --build"],
  ["str", 'lang: ["ru", "uz", "en", "zh"]'],
  ["punc", "CREATE INDEX ON leads USING hnsw"],
  ["fn", "await db.insert(leads).values(lead)"],
  ["key", "const [state, setState] = useState()"],
];

/**
 * Тот же дождь для телефона.
 *
 * Длинные строки на ширине 390 px не помещаются: капля стартует в случайной
 * точке, хвост уходит за экран, и вместо кода видны обрывки вроде «await
 * telegram.se». Здесь фрагменты короткие — каждый виден целиком, и по экрану
 * идёт несколько колонок, а не две с половиной обрезанные.
 */
const SNIPPETS_SHORT: Array<[string, string]> = [
  ["fn", "scoreIcp()"],
  ["com", "// Tier 1"],
  ["key", "await"],
  ["str", '"uz-UZ"'],
  ["num", "score 82"],
  ["fn", "rag.search"],
  ["punc", "{ ...bant }"],
  ["key", "return lead"],
  ["str", '"zh-Hans"'],
  ["fn", "telegram"],
  ["com", "// B·A·N·T"],
  ["punc", "SELECT *"],
  ["num", ">= 75"],
  ["fn", "card(lead)"],
  ["key", "const icp"],
  ["str", '"ru","uz"'],
  ["punc", "hnsw"],
  ["fn", "docker up"],
];

const COLORS: Record<string, string> = {
  key: "#c792ea",
  fn: "#82aaff",
  str: "#c3e88d",
  num: "#f78c6c",
  com: "#3f4c5e",
  punc: "#89ddff",
};

type Drop = {
  x: number;
  y: number;
  speed: number;
  alpha: number;
  index: number;
};

/**
 * Дождь кода на фоне героя.
 *
 * Canvas, а не DOM: полторы сотни строк текста, каждая со своей скоростью,
 * в разметке заставили бы браузер пересчитывать лейаут на каждом кадре.
 * Здесь же — один элемент и одна отрисовка.
 *
 * Слой полностью декоративный, поэтому `aria-hidden`: скринридеру незачем
 * зачитывать падающие обрывки кода, а весь смысловой текст героя лежит рядом
 * обычной разметкой и индексируется как есть.
 */
export function CodeRain({
  /** Прогресс сцены: по нему дождь сначала замедляется, потом гаснет. */
  progress,
  reduced,
  narrow,
}: {
  progress: number;
  reduced: boolean;
  /** Телефон: короткие фрагменты, меньше капель, запуск с задержкой. */
  narrow: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Прогресс кладём в ref, чтобы менять поведение отрисовки, не перезапуская
  // цикл анимации на каждом кадре скролла.
  const progressRef = useRef(progress);
  progressRef.current = progress;

  /**
   * Пока false, холста в разметке нет.
   *
   * Первый экран телефона должен нарисоваться как можно раньше: заголовок —
   * это LCP страницы, и соревноваться с ним за главный поток декоративному
   * слою незачем. Поэтому дождь появляется после того, как браузер разобрался
   * с версткой героя, — задержка в четверть секунды глазом не ловится, а
   * ощущение «грузится долго» уходит.
   */
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (reduced) return;
    if (!narrow) {
      setArmed(true);
      return;
    }
    // Вызываем через window, а не через сохранённую ссылку: методы окна
    // требуют его же в качестве receiver и на голом вызове бросают
    // «Illegal invocation».
    if (typeof window.requestIdleCallback === "function") {
      const handle = window.requestIdleCallback(() => setArmed(true), { timeout: 800 });
      return () => window.cancelIdleCallback?.(handle);
    }
    const timer = window.setTimeout(() => setArmed(true), 250);
    return () => window.clearTimeout(timer);
  }, [reduced, narrow]);

  useEffect(() => {
    if (reduced || !armed) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const lines = narrow ? SNIPPETS_SHORT : SNIPPETS;

    let width = 0;
    let height = 0;
    let drops: Drop[] = [];
    let raf = 0;
    let running = true;

    const resize = () => {
      // Ограничиваем плотность: на телефонах с DPR 3–4 холст такого размера
      // съедает больше, чем даёт глазу. На узком экране режем ещё вдвое —
      // текстуру дождя это не портит, а закрашиваемых точек вчетверо меньше.
      const dpr = Math.min(window.devicePixelRatio || 1, narrow ? 1.5 : 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${narrow ? 10 : 13}px ui-monospace, "JetBrains Mono", monospace`;
      ctx.textBaseline = "top";

      // Плотность капель по ширине, но не больше разумного: слабый телефон
      // не должен рисовать столько же, сколько десктоп.
      const cores = navigator.hardwareConcurrency ?? 4;
      const budget = narrow ? 14 : cores <= 4 ? 26 : 46;
      const step = narrow ? 46 : 34;
      const count = Math.max(6, Math.min(budget, Math.round(width / step)));

      drops = Array.from({ length: count }, (_, i) => ({
        x: (width / count) * i + Math.random() * (narrow ? 14 : 40),
        y: Math.random() * height * 1.6 - height * 0.4,
        speed: 0.35 + Math.random() * 1.05,
        alpha: 0.12 + Math.random() * (narrow ? 0.4 : 0.55),
        index: Math.floor(Math.random() * lines.length),
      }));
    };

    const draw = () => {
      raf = 0;
      if (!running) return;

      const p = progressRef.current;
      // 0 → 0.45 полный ход, дальше торможение, после 0.62 слой не нужен.
      const speedFactor = p < 0.45 ? 1 : Math.max(0, 1 - (p - 0.45) / 0.17);
      const fade = p < 0.45 ? 1 : Math.max(0, 1 - (p - 0.45) / 0.17);

      ctx.clearRect(0, 0, width, height);

      if (fade > 0.01) {
        for (const drop of drops) {
          const [kind, text] = lines[drop.index];
          ctx.globalAlpha = drop.alpha * fade;
          ctx.fillStyle = COLORS[kind] ?? "#82aaff";
          ctx.fillText(text, drop.x, drop.y);

          drop.y += drop.speed * speedFactor * 1.9;
          if (drop.y > height + 40) {
            drop.y = -30 - Math.random() * 220;
            // На телефоне колонки держим на месте: если пускать капли в
            // случайную точку по ширине, короткие фрагменты сбиваются в кучу
            // и половина экрана остаётся пустой.
            if (!narrow) drop.x = Math.random() * width;
            drop.index = Math.floor(Math.random() * lines.length);
            drop.alpha = 0.12 + Math.random() * (narrow ? 0.4 : 0.55);
          }
        }
        ctx.globalAlpha = 1;
      }

      raf = requestAnimationFrame(draw);
    };

    // Во вкладке в фоне рисовать нечего — браузер всё равно душит rAF, но так
    // мы ещё и не тратим батарею на пересчёт координат.
    const onVisibility = () => {
      running = !document.hidden;
      if (running && !raf) raf = requestAnimationFrame(draw);
    };

    resize();
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduced, narrow, armed]);

  if (reduced || !armed) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
