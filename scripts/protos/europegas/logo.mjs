// Логотип GAZMETPROD SERVIS — по их файлу europegas.uz/…/img/logo.png
// (300 × 88, снят 13.10.2026). Знак — ромб со скруглёнными углами и пламя:
// голубое снаружи, белое внутри. Ромб и пламя мы нарисовали геометрией по
// файлу, буквы — контуры Montserrat 700 и 400, выставленные по их надписи
// (сам файл крошечный и расплылся бы). logo.json пишет подготовка
// (/tmp/…/logo.py, см. SOURCES.md). Вектор: чёткий на любом увеличении.
import { readFileSync } from "node:fs";

export const LOGO = JSON.parse(readFileSync(new URL("./logo.json", import.meta.url), "utf8"));
export const W = LOGO.w, H = LOGO.h;
const letters = () => LOGO.letters.map((l) => `<path d="${l.d}"/>`).join("");
const sign = () => `<path d="${LOGO.rh}" fill="var(--la)"/><path d="${LOGO.flame}" fill="var(--lb)"/><path d="${LOGO.inner}" fill="var(--lc,#fff)"/>`;

/** Логотип целиком. Цвета — переменные CSS: --la ромб, --lb пламя, --lc сердце пламени, --lt буквы. */
export function logoSvg(cls = "", label = "GAZMETPROD SERVIS") {
  return `<svg class="${cls}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}"><use href="#eg-logo"/></svg>`;
}
/** Символ логотипа: в страницу один раз, logoSvg ссылается на него. */
export function logoSprite() {
  return `<svg class="lq-defs" aria-hidden="true" focusable="false"><symbol id="eg-logo" viewBox="0 0 ${W} ${H}">${sign()}<g fill="var(--lt)">${letters()}</g></symbol><symbol id="eg-sign" viewBox="0 0 352 352">${sign()}</symbol></svg>`;
}
/** Только знак: ромб и пламя. */
export function signSvg(cls = "") {
  return `<svg class="${cls}" viewBox="0 0 352 352" aria-hidden="true" focusable="false"><use href="#eg-sign"/></svg>`;
}
