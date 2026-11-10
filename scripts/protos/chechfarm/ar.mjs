/*
 * Арабская версия боевого сайта CZECHFARM (подарок к договору DU-2026-01,
 * владелец DevUz, 09.11.2026). Только при CF_PROD=1: макет остаётся на трёх
 * языках. Перевод — от английского текста: T(l) и данные отдают для «ar»
 * строку из AR по английской. Нет перевода — сборка падает и пишет, каких
 * строк не хватает (ar-missing.json), чтобы на сайте не осталось английского.
 */
import { readFileSync, existsSync } from "node:fs";

export const ON = process.env.CF_PROD === "1";
const FILE = new URL("./ar.json", import.meta.url);
export const AR = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : {};
const missing = new Set();

/* Строка без букв (числа, знаки) и имена собственные — как есть. */
const KEEP = /^[^A-Za-z]*$|^(CZECHFARM|CZECHFARM alliance|Health\. Trust\. Value\.)$/;

export function tr(en) {
  if (typeof en === "string") {
    if (Object.prototype.hasOwnProperty.call(AR, en)) return AR[en];
    if (KEEP.test(en.trim())) return en;
    missing.add(en);
    return en;
  }
  if (Array.isArray(en)) return en.map(tr);
  if (en && typeof en === "object") return Object.fromEntries(Object.entries(en).map(([k, v]) => [k, tr(v)]));
  return en;
}

/* Добавить «ar» каждому объекту с «en» внутри данных (на месте). */
export function withAr(o) {
  if (!ON || !o || typeof o !== "object") return o;
  if (Array.isArray(o)) { o.forEach(withAr); return o; }
  if ("en" in o && !("ar" in o)) o.ar = tr(o.en);
  for (const [k, v] of Object.entries(o)) if (k !== "ar" && k !== "en" && v && typeof v === "object") withAr(v);
  return o;
}

export const arMissing = () => [...missing];
