// Логотип Asmo Clinic — из их файла asmoclinic.uz/images/logo-dark.svg
// (3675 × 878, снят 13.10.2026). Знак — двенадцать кругов: полукольцо белых
// и голубых точек и большой голубой круг справа. Круги мы пересчитали в
// центр и радиус (в файле они обведены кривыми), буквы «Asmo Clinic» — их
// контуры как есть. Вектор, поэтому логотип чёткий на любом увеличении.
// logo.json пишет подготовка (см. SOURCES.md).
import { readFileSync } from "node:fs";

const RAW = JSON.parse(readFileSync(new URL("./logo.json", import.meta.url), "utf8"));

/** Круги знака: x, y, r и цвет (a — голубой, иначе белый). */
export const DOTS = RAW.dots;
/** Буквы: контур и сдвиг. */
export const LETTERS = RAW.letters.map((l) => ({ d: l.d, x: l.x, y: l.y }));
/** Центральный голубой круг — цель влёта камеры. */
export const EYE = DOTS.reduce((a, b) => (Math.hypot(b.x - 439, b.y - 439) < Math.hypot(a.x - 439, a.y - 439) ? b : a));
export const W = 3675, H = 878;

const dots = (k = "") => DOTS.map((d) => `<circle cx="${d.x}" cy="${d.y}" r="${d.r}" fill="var(--l${d.a ? "b" : "a"}${k})"/>`).join("");
const letters = () => LETTERS.map((l) => `<path transform="translate(${l.x} ${l.y})" d="${l.d}"/>`).join("");

/** Логотип целиком. Цвета — переменные CSS: --la точки, --lb голубые, --lt буквы. */
export function logoSvg(cls = "", label = "Asmo Clinic") {
  return `<svg class="${cls}" viewBox="-4 -4 ${W + 8} ${H + 8}" role="img" aria-label="${label}"><use href="#am-logo"/></svg>`;
}

/** Символ логотипа: кладётся в страницу один раз, logoSvg ссылается на него. */
export function logoSprite() {
  return `<svg class="lq-defs" aria-hidden="true" focusable="false"><symbol id="am-logo" viewBox="-4 -4 ${W + 8} ${H + 8}"><g>${dots()}</g><g fill="var(--lt)">${letters()}</g></symbol></svg>`;
}

/** Только знак: круги. */
export function markSvg(cls = "") {
  return `<svg class="${cls}" viewBox="-4 -4 852 892" aria-hidden="true" focusable="false">${dots()}</svg>`;
}
