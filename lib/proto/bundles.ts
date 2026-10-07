/**
 * Прототипы, собранные руками, — в репозитории, а не в базе.
 *
 * Многостраничный макет (bloger.agency: 12 страниц на двух языках) весит
 * около мегабайта готового html. Класть его в protos.html и protos.pages
 * значит гонять этот мегабайт через SQL при каждой правке. Поэтому такой
 * макет живёт в content/proto-bundles/<имя>.json (его пишет сборка в
 * scripts/protos/<имя>/gen.mjs), а в базе — обычная запись protos: токен,
 * статус, факты с `bundle: "<имя>"`, зерно отпечатка и журнал показа.
 *
 * Отпечаток ставится при показе тем же stampPages и тем же зерном из
 * protos.stamp: одно зерно — одни и те же сдвиги, так что страница по
 * ссылке совпадает с признаками, по которым «Проверить сайт» её узнаёт.
 * Правило «Макеты и прототипы — всегда под защитой» соблюдается так же,
 * как у макета из базы.
 */
import automechanic from "@/content/proto-bundles/automechanic.json" with { type: "json" };
import blogerAgency from "@/content/proto-bundles/bloger-agency.json" with { type: "json" };
import shoxHospital from "@/content/proto-bundles/shox-hospital.json" with { type: "json" };
import shahar from "@/content/proto-bundles/shahar.json" with { type: "json" };
import { stampPages } from "@/lib/proto/stamp";

type Bundle = { parts: Record<string, string>; pages: Record<string, string> };

const BUNDLES: Record<string, Bundle> = {
  "bloger-agency": blogerAgency as Bundle,
  automechanic: automechanic as Bundle,
  "shox-hospital": shoxHospital as Bundle,
  shahar: shahar as Bundle,
};

/** Имена всех сборок — для проверок, которые идут по каждой (tests/proto-plain-text). */
export const BUNDLE_NAMES = Object.keys(BUNDLES);

/** Страницы сборки без отпечатка: главная — `html`, остальные — `pages`. */
export function bundlePages(name: string): { html: string; pages: Record<string, string> } | null {
  const bundle = BUNDLES[name];
  if (!bundle) return null;
  const fill = (page: string) =>
    Object.entries(bundle.parts).reduce((out, [key, part]) => out.split(`@@${key}@@`).join(part), page);
  const pages: Record<string, string> = {};
  for (const [path, page] of Object.entries(bundle.pages)) if (path) pages[path] = fill(page);
  return { html: fill(bundle.pages[""] ?? ""), pages };
}

const stamped = new Map<string, { html: string; pages: Record<string, string> }>();

/**
 * Страницы сборки с отпечатком этого прототипа. Считается один раз на зерно:
 * stampPages по мегабайту — десятки миллисекунд, а открывают одну ссылку
 * подряд по многу раз.
 */
export function stampedBundle(name: string, seed: string): { html: string; pages: Record<string, string> } | null {
  const key = `${name}:${seed}`;
  const hit = stamped.get(key);
  if (hit) return hit;
  const raw = bundlePages(name);
  if (!raw) return null;
  const { html, pages } = stampPages(raw.html, raw.pages, seed);
  stamped.set(key, { html, pages });
  return { html, pages };
}
