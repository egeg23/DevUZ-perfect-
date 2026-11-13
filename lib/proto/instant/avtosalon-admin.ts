/**
 * Админка автосалона — панель нашего макета SAMIST AUTO как есть
 * (scripts/protos/samist/panel.js и panel.css в content/proto-instant/
 * samist-assets.json): вход кодом, «Смотреть как: Владелец / Менеджер»,
 * сводка, заявки (покупка, кредит, тест-драйв, трейд-ин, звонок), наличие и
 * цены, история, выгрузки CSV. Данные — машины клиента; заявки и числа сводки
 * — демо с пометкой. Ключи памяти браузера те же, что у сайта шаблона
 * (as-): заявка с макета приходит сюда первой строкой, статус и «продано» из
 * панели видны на сайте.
 *
 * Машина без цены в сумах получает в панели демо-цену (на сайте её нет):
 * сводке денег нужны числа, а придумать цену на сайте мы не можем.
 */
import assets from "@/content/proto-instant/samist-assets.json" with { type: "json" };
import { mockupTermsUrl } from "@/lib/proto/booking";
import { AVTOSALON_PHOTOS, avtosalonModels, avtosalonPalette } from "@/lib/proto/instant/avtosalon";
import { esc, imageUrl } from "@/lib/proto/instant/safe";
import type { InstantLocale, InstantSite, BaseSite, BaseLocale } from "@/lib/proto/instant/types";
import { PROTO_BASE } from "@/lib/proto/pages";

const json = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c");

const NAMES: Record<BaseLocale, string[]> = {
  ru: ["Азиз", "Мадина", "Тимур", "Камола", "Сардор", "Нигора", "Рустам", "Дилноза", "Бобур", "Лола", "Жасур", "Севара"],
  uz: ["Aziz", "Madina", "Timur", "Kamola", "Sardor", "Nigora", "Rustam", "Dilnoza", "Bobur", "Lola", "Jasur", "Sevara"],
};

function markOf(site: BaseSite): string {
  const logo = imageUrl(site.logo);
  return logo
    ? `<img src="${esc(logo)}" alt="" referrerpolicy="no-referrer" style="height:40px;width:auto;max-width:140px;object-fit:contain" onerror="this.remove()">`
    : `<span style="display:inline-grid;place-items:center;width:48px;height:48px;border-radius:14px;background:var(--a);color:#fff;font:700 20px/1 var(--hd)">${esc(site.name.slice(0, 1).toUpperCase())}</span>`;
}

export function avtosalonAdmin(site: BaseSite): string {
  const l = site.locale;
  const i = l === "uz" ? 1 : 0;
  const ui = Object.fromEntries(Object.entries(assets.panel.ui as Record<string, string[]>).map(([k, v]) => [k, v[i]]));
  const cars = avtosalonModels(site);
  const own = site.photos.map(imageUrl).filter((u): u is string => Boolean(u));
  const kind = l === "uz" ? "Avtomobil" : "Автомобиль";
  const pd = {
    l, ui, name: site.name, mark: markOf(site), sum: l === "uz" ? "so‘m" : "сум",
    site: PROTO_BASE, home: PROTO_BASE, img: "", logo: [0, 0], addr: site.address ?? site.city ?? "",
    // Те же id, что в данных сайта шаблона (avtosalon.ts): заявки и наличие с сайта сходятся.
    models: (cars.length ? cars : [{ id: "c0", name: kind, uzs: 0, img: [AVTOSALON_PHOTOS[0]] }]).map((c, k) => [c.id, c.name, kind, c.uzs || 240_000_000 + ((k * 37) % 9) * 35_000_000, c.img[0]]),
    names: NAMES[l],
    corp: l === "uz" ? ["«[[t:0]] Logistic» MChJ", "«[[t:1]] Qurilish» MChJ"] : ["ООО «[[t:0]] Logistic»", "ООО «[[t:1]] Qurilish»"],
  };
  const nm = esc(site.name);
  const terms = l === "uz" ? ["DevUz Studio maketi, demo ma’lumotlar. Maketdan foydalanib, siz", "maket shartlarini qabul qilasiz"] : ["Макет DevUz Studio, демо-данные. Пользуясь макетом, вы принимаете", "условия макета"];
  const title = `${nm} · ${l === "uz" ? "avtosalon paneli · demo" : "панель автосалона · демо"}`;
  const desc = esc(l === "uz" ? "Avtosalon paneli: saytdan arizalar, mavjudlik va narxlar, rollar, tarix, yuklab olish. Demo ma’lumotlar." : "Панель автосалона: заявки с сайта, наличие и цены, роли, история, выгрузки. Демо-данные.");
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="robots" content="noindex, nofollow, noarchive">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700&family=Manrope:wght@400;700&display=swap">
<style>${assets.base}:root{${avtosalonPalette(site.color)}}${assets.panel.css}html,body{overflow-x:clip}</style>
</head>
<body class="pn">
<div class="pn-bg" aria-hidden="true"><img src="${esc(own[0] ?? AVTOSALON_PHOTOS[0].replace("-1200", "-900"))}" alt="" width="480" height="320" referrerpolicy="no-referrer"></div>
<div id="app"></div>
<footer class="pn-foot">${terms[0]} <a href="${esc(mockupTermsUrl(l))}" target="_blank" rel="noopener">${terms[1]}</a>.</footer>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="pn-data">${json(pd)}</script>
<script>
${assets.panel.js}</script>
</body>
</html>`;
}
