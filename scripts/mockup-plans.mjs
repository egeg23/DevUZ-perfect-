// Состав макетов для договора: scripts/protos/*/plan.mjs → content/mockup-plans.json.
//
// Владелец, 29.10.2026: «У нас сложный раздел проектов, очень много всего
// заполнять надо. Давай проще сделаем как-то, чтобы сразу выбрали какие допы
// взяли из макета, сделай это скриптом, а не нейронкой».
//
// Цены макета живут в его plan.mjs, и только там. Этот скрипт ничего не
// придумывает: берёт основу (BASE) и допы (ADDONS) как есть. План другой
// формы (TIERS, EXTRAS без BASE+ADDONS) или не в долларах пропускается со
// строкой в выводе — договор считается в долларах, а курс сюда не зашит.
//
// Запуск: node scripts/mockup-plans.mjs
// Тест tests/mockup-plans.test.ts сверяет JSON с plan.mjs: правка цены в
// макете без перезапуска скрипта — красный npm test.

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PROTOS = join(ROOT, "scripts/protos");
export const OUT = join(ROOT, "content/mockup-plans.json");

const text = (v) => (typeof v === "string" ? v.trim() : "");
const priceOf = (v) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null);

/** Название и описание: русские поля, у части планов — без `ru`, сразу `t`/`d`. */
function words(item) {
  const ru = item.ru && typeof item.ru === "object" ? item.ru : item;
  return { title: text(ru.t), text: text(ru.e) || text(ru.d) };
}

/**
 * Один план → запись или причина пропуска. Без исключений: всё, что не
 * сводится к BASE + ADDONS честно, не попадает в договор.
 */
export function planOf(name, mod, source) {
  const base = mod.BASE;
  const addons = mod.ADDONS;
  if (!base || typeof base !== "object") return { skip: `${name}: нет BASE (другая форма плана)` };
  if (!Array.isArray(addons)) return { skip: `${name}: нет ADDONS (другая форма плана)` };
  if (mod.CUR !== undefined || source.includes("₽")) return { skip: `${name}: цены не в долларах` };

  const basePrice = priceOf(base.promo) ?? priceOf(base.price);
  const head = words(base);
  if (basePrice === null || !head.title) return { skip: `${name}: у основы нет цены или названия` };

  const out = [];
  for (const a of addons) {
    const w = words(a);
    const price = priceOf(a.price);
    if (!a.id || !w.title || price === null) return { skip: `${name}: доп ${a.id ?? "?"} без цены или названия` };
    out.push({ id: String(a.id), title: w.title, text: w.text, price, star: a.star === true });
  }

  const weeks = Array.isArray(base.weeks) && base.weeks.every((n) => Number.isInteger(n) && n > 0)
    ? base.weeks.map(Number)
    : null;
  return {
    plan: {
      id: name,
      base: { title: head.title, text: head.text, price: basePrice, weeks },
      addons: out,
    },
  };
}

/** Все планы по алфавиту и строки про пропущенные. */
export async function collectPlans(dir = PROTOS) {
  const plans = [];
  const skipped = [];
  for (const name of readdirSync(dir).sort()) {
    const file = join(dir, name, "plan.mjs");
    if (!existsSync(file)) continue;
    const mod = await import(pathToFileURL(file).href);
    const got = planOf(name, mod, readFileSync(file, "utf8"));
    if (got.plan) plans.push(got.plan);
    else skipped.push(got.skip);
  }
  return { plans, skipped };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const { plans, skipped } = await collectPlans();
  writeFileSync(OUT, JSON.stringify(plans, null, 2) + "\n");
  console.log(`content/mockup-plans.json: ${plans.length} макетов`);
  for (const line of skipped) console.log(`пропущен — ${line}`);
}
