import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { siteUrl } from "@/lib/seo";
import { checkSitemap, missingIn, sitemapLine, sitemapLocs } from "@/lib/seo/sitemap-check";

/**
 * После публикации — всегда проверка живой карты сайта (владелец,
 * 19.10.2026: «После публикации надо всегда убеждаться, что в сайтмап
 * обновление сделано»).
 */

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>${siteUrl}/ru/razbor/sayt-dlya-kafe-tashkent</loc></url>
<url><loc>
  ${siteUrl}/uz/razbor/kafe-uchun-sayt-toshkent
</loc></url>
</urlset>`;

test("адреса берутся из <loc>, пробелы вокруг не мешают", () => {
  const locs = sitemapLocs(xml);
  assert.ok(locs.has(`${siteUrl}/ru/razbor/sayt-dlya-kafe-tashkent`));
  assert.ok(locs.has(`${siteUrl}/uz/razbor/kafe-uchun-sayt-toshkent`));
  assert.equal(locs.size, 2);
});

test("находит, каких путей нет в карте, — по полному адресу, а не по куску", () => {
  assert.deepEqual(missingIn(xml, ["/ru/razbor/sayt-dlya-kafe-tashkent", "/uz/razbor/kafe-uchun-sayt-toshkent"]), []);
  assert.deepEqual(missingIn(xml, ["/ru/razbor/sayt-dlya-kafe"]), ["/ru/razbor/sayt-dlya-kafe"]);
  assert.deepEqual(missingIn(xml, ["/en/razbor/cafe-website-tashkent"]), ["/en/razbor/cafe-website-tashkent"]);
});

test("нечего проверять — проверка не ходит в сеть", async () => {
  assert.deepEqual(await checkSitemap([]), { ok: true, checked: 0 });
});

test("строка отчёта говорит прямо: на месте, нет или не проверили", () => {
  assert.equal(sitemapLine({ ok: true, checked: 2 }), "Карта сайта: все 2 адресов на месте.");
  assert.match(sitemapLine({ ok: false, missing: ["/ru/razbor/x"] }), new RegExp(`В карте сайта нет: ${siteUrl}/ru/razbor/x`));
  assert.match(sitemapLine({ ok: null, why: "timeout" }), /Карту сайта проверить не удалось: timeout/);
});

test("проверка смотрит живой /sitemap.xml, как поисковик, и с повтором", () => {
  const src = read("lib/seo/sitemap-check.ts");
  assert.match(src, /fetch\(`\$\{siteUrl\}\/sitemap\.xml`/);
  // Без обходных параметров: закэшированную карту проверка должна увидеть.
  assert.doesNotMatch(src, /sitemap\.xml\?/);
  assert.match(src, /export const SITEMAP_TRIES = 3;/);
});

test("каждый путь публикации проверяет карту сайта", () => {
  const shift = read("lib/razbor/shift-run.ts");
  assert.match(shift, /run\.sitemap = await checkSitemap\(run\.paths\);/);
  assert.match(shift, /run\.paths\.push\(drafted\.ru, drafted\.uz\);/);
  assert.match(shift, /sitemapLine\(run\.sitemap\)/);
  assert.ok(shift.indexOf("checkSitemap(run.paths)") < shift.indexOf("await report(run);"), "отчёт уходит раньше проверки");

  const tender = read("lib/razbor/tender-run.ts");
  assert.match(tender, /sitemap = await checkSitemap\(\[`\/ru\/razbor\/\$\{topic\.ru\.slug\}`, `\/uz\/razbor\/\$\{topic\.uz\.slug\}`\]\);/);
  assert.match(tender, /sitemapLine\(sitemap\)/);

  const foreign = read("lib/razbor/foreign-run.ts");
  assert.match(foreign, /const map = await checkSitemap\(run\.translated\);\s*if \(map\.ok !== true\) run\.errors\.push\(sitemapLine\(map\)\);/);

  const articles = read("lib/marketing/articles-run.ts");
  assert.match(articles, /await checkSitemap\(ARTICLE_LOCALES\.map\(\(locale\) => articleHref\(locale, topic\.slug\)\)\)/);
  assert.match(articles, /if \(map\.ok !== true\) await report\(run,/);

  const action = read("app/admin/razbor/actions.ts");
  assert.match(action, /const map = await checkSitemap\(\[result\.paths\.ru, result\.paths\.uz\], 2, 3000\);/);
  assert.match(action, /if \(map\.ok === true\) redirect\("\/admin\/razbor\?r=ok"\);/);
  assert.match(action, /"nomap" : "nomapcheck"/);

  const dict = read("content/admin-panel/razbor.ts");
  assert.match(dict, /nomap: \{/);
  assert.match(dict, /nomapcheck: \{/);
});
