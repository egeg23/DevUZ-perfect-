/**
 * Макет из репозитория (lib/proto/bundles): страницы целиком, с условиями,
 * без чужих слов в разметке и с отпечатком своего зерна.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { bundlePages, stampedBundle } from "@/lib/proto/bundles";
import { stampPages } from "@/lib/proto/stamp";

const SEED = "b1".repeat(16);

test("bloger.agency: 14 страниц, метки сборки заменены, у каждой условия и noindex", () => {
  const site = bundlePages("bloger-agency");
  assert.ok(site);
  const all = { "": site.html, ...site.pages };
  assert.equal(Object.keys(all).length, 14);
  for (const [path, html] of Object.entries(all)) {
    assert.doesNotMatch(html, /@@[A-Z]+@@/, `${path}: метка сборки осталась в странице`);
    const lang = path.startsWith("uz") ? "uz" : "ru";
    assert.ok(html.includes(`https://devuz.studio/${lang}/mockup-terms`), `${path}: нет условий на языке страницы`);
    assert.match(html, /<meta name="robots" content="noindex/, `${path}: нет noindex`);
    assert.match(html, /prefers-reduced-motion/, `${path}: анимацию нечем выключить`);
    assert.doesNotMatch(html, /stamp|watermark|fingerprint|отпечат|seed|data-mark/i, `${path}: слово, по которому находят отпечаток`);
  }
  assert.match(site.html, /Glyph Portal © 2026 Christian Katzmann\. MIT\./, "пропала строка лицензии влёта в букву");
  assert.match(site.html, /id="dz"/, "нет заставки DevUz");
});

test("отпечаток — тем же зерном, что лежит в базе: признаки совпадают со stampPages", () => {
  const raw = bundlePages("bloger-agency")!;
  const expected = stampPages(raw.html, raw.pages, SEED);
  const site = stampedBundle("bloger-agency", SEED)!;
  assert.equal(site.html, expected.html);
  assert.equal(site.pages["uz/ugc"], expected.pages["uz/ugc"]);
  assert.notEqual(site.html, raw.html, "отпечаток не поставился");
  assert.equal(stampedBundle("нет-такого", SEED), null);
});

test("AUTOMECHANIC: страницы на двух языках, условия, noindex, сайт как приложение", () => {
  const site = bundlePages("automechanic");
  assert.ok(site);
  const all: Record<string, string> = { "": site.html, ...site.pages };
  const html = ["", "uslugi", "zapis", "kontakty", "plan", "offline"].flatMap((p) => [p, p ? `uz/${p}` : "uz"]);
  for (const path of html) {
    const page = all[path];
    assert.ok(page, `${path}: нет страницы`);
    assert.doesNotMatch(page, /@@[A-Z]+@@/, `${path}: метка сборки осталась в странице`);
    const lang = path.startsWith("uz") ? "uz" : "ru";
    assert.ok(page.includes(`https://devuz.studio/${lang}/mockup-terms`), `${path}: нет условий на языке страницы`);
    assert.match(page, /<meta name="robots" content="noindex/, `${path}: нет noindex`);
    assert.match(page, /prefers-reduced-motion/, `${path}: анимацию нечем выключить`);
    assert.match(page, /<link rel="manifest" href="__PROTO_BASE__(\/uz)?\/manifest"/, `${path}: нет манифеста`);
    assert.doesNotMatch(page, /stamp|watermark|fingerprint|отпечат|seed|data-mark/i, `${path}: слово, по которому находят отпечаток`);
    assert.doesNotMatch(page, /proto-ai|proxyapi/i, `${path}: прототип не зовёт модель`);
    assert.ok(page.includes("AUTOMECHANIC"), `${path}: нет названия компании`);
  }
  const manifest = JSON.parse(all.manifest);
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.scope, "__PROTO_BASE__/");
  assert.ok(manifest.icons.some((i: { purpose?: string }) => i.purpose === "maskable"));
  assert.equal(JSON.parse(all["uz/manifest"]).start_url, "__PROTO_BASE__/uz/?app=1");
  assert.match(all.sw, /addEventListener\('fetch'/);
  assert.match(all.sw, /\/offline'/);
});

test("AUTOMECHANIC: цены владельца в конструкторе — сайт 1 000 $, приложение 150 $", async () => {
  const plan = await import("../scripts/protos/automechanic/plan.mjs");
  assert.equal(plan.BASE.price, 1000);
  assert.equal(plan.ADDONS.find((a: { id: string }) => a.id === "pwa")?.price, 150);
  const tg = plan.ADDONS.find((a: { id: string }) => a.id === "tg");
  assert.ok(tg && tg.price < 500, "заказы в Telegram дешевле внедрения CRM");
});

test("AUTOMECHANIC: отпечаток ставится, манифест и service worker не меняются", () => {
  const raw = bundlePages("automechanic")!;
  const site = stampedBundle("automechanic", SEED)!;
  assert.notEqual(site.html, raw.html, "отпечаток не поставился");
  assert.equal(site.pages.manifest, raw.pages.manifest);
  assert.equal(site.pages.sw, raw.pages.sw);
});
