/**
 * Макет из бота клиент открывает во встроенном браузере Telegram (владелец,
 * 13.11.2026: «Для макетов которые делаются через тг бот примени эти новые 2
 * правила»; CLAUDE.md, «Макет открывают в браузере Telegram»).
 *
 * Там при смене направления прокрутки выезжает панель, и `vh` (в WebView и
 * `svh`/`dvh`) пересчитывается: длинные сцены (`420vh`, `1000vh`), первые
 * экраны во весь экран и отступы в `vh` меняли высоту, и страница прыгала,
 * даже где анимаций нет. Поэтому при сборке все единицы высоты окна в
 * стилях макета становятся долей переменной `--tgvh`, а она ставится в
 * пикселях один раз при загрузке и заново только при смене ширины (поворот).
 * Пока скрипт не сработал, переменной нет и действует обычный `vh`.
 * Пролёт ниши (движок Nek) кроме того красит фон страницы под цвет пролёта —
 * scripts/protos/instant/nek-assets.mjs.
 */
/* Только значение свойства: в селекторах Tailwind (`.min-h-\[100svh\]`) единица
   стоит в имени класса, и её трогать нельзя. */
const UNIT = /(?<![\w[\\.-])(-?\d*\.?\d+)(?:s|l|d)?vh\b(?!\\\])/g;

/** `100vh` → `calc(var(--tgvh,1vh)*100)`; только внутри `<style>`. */
export function pinViewportUnits(html: string): string {
  return html.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi, (_m, open: string, css: string, close: string) =>
    open + css.replace(UNIT, (_u, n: string) => `calc(var(--tgvh,1vh)*${n})`) + close,
  );
}

/* Ставится после `<meta name="viewport">`: до неё браузер считает страницу
   шириной 980 точек, и высота окна выходит завышенной. Ещё раз — когда
   страница разобрана: к этому времени ширина окончательная. */
export const TELEGRAM_FIX = `<script>(function(){var r=document.documentElement,W=0;function pin(){if(innerWidth===W)return;W=innerWidth;r.style.setProperty('--tgvh',innerHeight/100+'px')}pin();addEventListener('resize',pin);document.addEventListener('DOMContentLoaded',function(){W=0;pin()})})();</script>`;

/** Стили — на переменную, скрипт — сразу за `<meta name="viewport">`, до первой отрисовки. */
export function withTelegramFix(html: string): string {
  const out = pinViewportUnits(html);
  const vp = out.search(/<meta\s+name="viewport"[^>]*>/i);
  const at = vp >= 0 ? out.indexOf(">", vp) + 1 : out.search(/<head\b[^>]*>/i) >= 0 ? out.indexOf(">", out.search(/<head\b[^>]*>/i)) + 1 : 0;
  return out.slice(0, at) + TELEGRAM_FIX + out.slice(at);
}
