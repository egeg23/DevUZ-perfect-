"use client";

import { useEffect, useRef } from "react";

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
}: {
  progress: number;
  reduced: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Прогресс кладём в ref, чтобы менять поведение отрисовки, не перезапуская
  // цикл анимации на каждом кадре скролла.
  const progressRef = useRef(progress);
  progressRef.current = progress;

  useEffect(() => {
    if (reduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let drops: Drop[] = [];
    let raf = 0;
    let running = true;

    const fontSize = () => (width < 720 ? 11 : 13);

    const resize = () => {
      // Ограничиваем плотность двойкой: на телефонах с DPR 3–4 холст такого
      // размера съедает больше, чем даёт глазу.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${fontSize()}px ui-monospace, "JetBrains Mono", monospace`;
      ctx.textBaseline = "top";

      // Плотность капель по ширине, но не больше разумного: слабый телефон
      // не должен рисовать столько же, сколько десктоп.
      const cores = navigator.hardwareConcurrency ?? 4;
      const budget = cores <= 4 ? 26 : 46;
      const count = Math.max(10, Math.min(budget, Math.round(width / 34)));

      drops = Array.from({ length: count }, (_, i) => ({
        x: (width / count) * i + Math.random() * 40,
        y: Math.random() * height * 1.6 - height * 0.4,
        speed: 0.35 + Math.random() * 1.05,
        alpha: 0.12 + Math.random() * 0.55,
        index: Math.floor(Math.random() * SNIPPETS.length),
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
          const [kind, text] = SNIPPETS[drop.index];
          ctx.globalAlpha = drop.alpha * fade;
          ctx.fillStyle = COLORS[kind] ?? "#82aaff";
          ctx.fillText(text, drop.x, drop.y);

          drop.y += drop.speed * speedFactor * 1.9;
          if (drop.y > height + 40) {
            drop.y = -30 - Math.random() * 220;
            drop.x = Math.random() * width;
            drop.index = Math.floor(Math.random() * SNIPPETS.length);
            drop.alpha = 0.12 + Math.random() * 0.55;
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
  }, [reduced]);

  if (reduced) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
