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
import pkvesta from "@/content/proto-bundles/pkvesta.json" with { type: "json" };
import aipply from "@/content/proto-bundles/aipply.json" with { type: "json" };
import hop from "@/content/proto-bundles/hop.json" with { type: "json" };
import enotmebel from "@/content/proto-bundles/enotmebel.json" with { type: "json" };
import giftora from "@/content/proto-bundles/giftora.json" with { type: "json" };
import liderProf from "@/content/proto-bundles/lider-prof.json" with { type: "json" };
import intalim from "@/content/proto-bundles/intalim.json" with { type: "json" };
import asmo from "@/content/proto-bundles/asmo.json" with { type: "json" };
import europegas from "@/content/proto-bundles/europegas.json" with { type: "json" };
import domtut from "@/content/proto-bundles/domtut.json" with { type: "json" };
import inapp from "@/content/proto-bundles/inapp.json" with { type: "json" };
import invis from "@/content/proto-bundles/invis.json" with { type: "json" };
import arhbyuro from "@/content/proto-bundles/arhbyuro.json" with { type: "json" };
import greenwell from "@/content/proto-bundles/greenwell.json" with { type: "json" };
import medikor from "@/content/proto-bundles/medikor.json" with { type: "json" };
import sia from "@/content/proto-bundles/sia.json" with { type: "json" };
import amani from "@/content/proto-bundles/amani.json" with { type: "json" };
import vtashkente from "@/content/proto-bundles/vtashkente.json" with { type: "json" };
import dilrabo from "@/content/proto-bundles/dilrabo.json" with { type: "json" };
import karomat from "@/content/proto-bundles/karomat.json" with { type: "json" };
import tovar from "@/content/proto-bundles/tovar.json" with { type: "json" };
import soffice from "@/content/proto-bundles/soffice.json" with { type: "json" };
import baldinini from "@/content/proto-bundles/baldinini.json" with { type: "json" };
import ighub from "@/content/proto-bundles/ighub.json" with { type: "json" };
import { stampPages } from "@/lib/proto/stamp";

type Bundle = { parts: Record<string, string>; pages: Record<string, string> };

const BUNDLES: Record<string, Bundle> = {
  "bloger-agency": blogerAgency as Bundle,
  automechanic: automechanic as Bundle,
  "shox-hospital": shoxHospital as Bundle,
  shahar: shahar as Bundle,
  pkvesta: pkvesta as Bundle,
  aipply: aipply as Bundle,
  hop: hop as Bundle,
  enotmebel: enotmebel as Bundle,
  giftora: giftora as Bundle,
  "lider-prof": liderProf as Bundle,
  intalim: intalim as Bundle,
  asmo: asmo as Bundle,
  europegas: europegas as Bundle,
  domtut: domtut as Bundle,
  inapp: inapp as Bundle,
  invis: invis as Bundle,
  arhbyuro: arhbyuro as Bundle,
  greenwell: greenwell as Bundle,
  medikor: medikor as Bundle,
  sia: sia as Bundle,
  amani: amani as Bundle,
  vtashkente: vtashkente as Bundle,
  dilrabo: dilrabo as Bundle,
  karomat: karomat as Bundle,
  tovar: tovar as Bundle,
  soffice: soffice as Bundle,
  baldinini: baldinini as Bundle,
  ighub: ighub as Bundle,
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
