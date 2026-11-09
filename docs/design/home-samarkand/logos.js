// Логотипы «Делали для» — те же файлы и пропорции, что на сайте (content/clients.ts):
// одна площадь на всех, логотип — маска цвета текста.
window.LOGOS = {
  samauto: [9.375, "webp"], baldinini: [8.617, "svg"], transtelecom: [1.96, "svg"], tranio: [2.757, "svg"],
  shox: [3.932, "svg"], "optimal-prime": [4.959, "webp"], engelberg: [4.027, "webp"], "golden-house": [7.226, "svg"],
  greenwell: [7.145, "svg"], neoline: [5.134, "svg"], czechfarm: [2.737, "webp"], samist: [2.269, "webp"],
  tovar: [3.494, "webp"], soffice: [4.52, "webp"], foodmaxx: [4.762, "webp"], medikor: [2.675, "webp"],
  cosmoworld: [3.441, "svg"], karomat: [1.694, "webp"], "cargo-pro": [2.775, "webp"], fintax: [3.663, "webp"],
  sia: [2.25, "webp"], "oson-apteka": [2.384, "svg"], jiguli: [1.512, "webp"], domtut: [3.259, "svg"],
};
window.logoRow = function (el, slugs, area, maxH, maxW) {
  for (const s of slugs) {
    const [r, ext] = window.LOGOS[s];
    const h = Math.min(maxH, Math.max(16, Math.sqrt(area / r)));
    const w = Math.min(maxW, h * r);
    const span = document.createElement("span");
    span.className = "logo";
    span.style.width = Math.round(w) + "px";
    span.style.height = Math.round(Math.min(h, w / r)) + "px";
    span.style.setProperty("--src", `url(../../../public/clients/logos/${s}.${ext})`);
    el.appendChild(span);
  }
};
