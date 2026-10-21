import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { dzIntroSolo } from "../../../lib/proto/dz-video.mjs";

/*
 * Макет SamAuto (samauto.uz): оранжевый ISUZU D-MAX IRBIS LSE в тёмном зале
 * на подиуме с красной подсветкой. По прокрутке машина разлетается на
 * детали с подписями (только цифры с их сайта) и собирается обратно, камера
 * идёт вдоль правого борта. Владелец DevUz, 21.10.2026: «Давай попробуем
 * сделать это в офигенном качестве… для одной машины, как пример того, что
 * будет у клиента… в виде макета без пароля». Весь текст — на узбекском
 * (решение владельца для SamAuto, docs/research/samauto.md).
 *
 * 3D-модель — Higgsfield (Tripo H3.1) по фото с их сайта, детали — segment.py,
 * сцена — scene.src.js (three, собирается build-scene.mjs). Без WebGL, на
 * слабом устройстве, при reduced motion и экономии трафика — два кадра той
 * же сцены (posters.mjs) и подписи списком, белого экрана нет.
 * Модель макет не вызывает. Отпечаток ставится при показе (lib/proto/bundles).
 */

const DIR = new URL(".", import.meta.url).pathname;
const PUB = new URL("../../../public", import.meta.url).pathname;
const IMG = "/protos/samauto";
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const min = (s) => strip(s).replace(/\n\s*/g, "");
const read = (f) => readFileSync(DIR + f, "utf8");
const mb = (f) => (statSync(PUB + IMG + "/" + f).size / 1048576).toFixed(1).replace(".", ",");
const FONTS = "https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700&family=Onest:wght@400;700&display=swap";

/* Факты — только с samauto.uz, 21.10.2026 (docs/research/samauto.md). */
const B = {
  name: "SamAuto",
  site: "https://samauto.uz",
  phone: "+998 (78) 140-80-00",
  tel: "tel:+998781408000",
  model: "ISUZU D-MAX IRBIS LSE",
};
const tel = B.tel;

/* Подписи деталей при разлёте: деталь → [что, цифра]. */
const LABELS = [
  ["kapot", "Dvigatel ISUZU 4JJ3", "190 ot kuchi"],
  ["gildirak_old_ong", "Yuritma", "4x4"],
  ["yuk_kuzov", "Yuk ko‘tarish", "670 kg"],
  ["old_bamper", "Dizel, hajmi", "2 999 sm³"],
  ["tom", "Uzunligi", "5 285 mm"],
  ["kuzov", "To‘liq massa", "2 800 kg"],
];

const SPECS = [
  ["190", "ot kuchi", "140 kVt, dvigatel ISUZU 4JJ3"],
  ["2 999", "sm³", "dizel"],
  ["4x4", "", "yuritma"],
  ["670", "kg", "yuk ko‘tarish"],
  ["2 800", "kg", "to‘liq massa"],
];

const ic = (n) => `<svg class="i" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const sprite = () => `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
<symbol id="i-phone" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></symbol>
<symbol id="i-down" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M6 13l6 6 6-6"/></symbol>
<symbol id="i-cube" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M12 3 4 7.5v9L12 21l8-4.5v-9zM4 7.5 12 12l8-4.5M12 12v9"/></symbol>
</svg>`;

const logo = (cls = "logo-i") => `<img class="${cls}" src="${IMG}/logo.webp" width="600" height="64" alt="SamAuto">`;

function sceneBlock() {
  return `<section class="scene" id="sahna" aria-labelledby="c0-h">
<div class="track" id="track">
<div class="stage" id="stage">
<picture class="poster" id="poster"><source media="(orientation: portrait)" srcset="${IMG}/poster-a-9.webp"><img src="${IMG}/poster-a-16.webp" alt="${B.model} podiumda, o‘ng tomondan" fetchpriority="high"></picture>
<canvas id="gl" aria-hidden="true"></canvas>
<div class="tags" id="tags" aria-hidden="true">${LABELS.map(([part, k, v]) => `<div class="tag" data-part="${part}"><i></i><span><small>${k}</small><b>${v}</b></span></div>`).join("")}</div>
<ul class="chips" id="chips" aria-hidden="true">${LABELS.filter(([part]) => !["tom", "kuzov"].includes(part)).map(([, k, v]) => `<li><small>${k}</small><b>${v}</b></li>`).join("")}</ul>
<div class="load" id="load" aria-hidden="true"><span>3D model yuklanmoqda</span><i><b id="load-b"></b></i></div>
<div class="copy c0" id="c0"><p class="kick">${B.model}</p><h1 id="c0-h">Yangi D-MAX bilan tanishing</h1><p class="lead">Pastga aylantiring: mashina detallarga ajraladi va yana yig‘iladi.</p><a class="hint" href="#raqamlar">${ic("down")}<span>Pastga aylantiring</span></a></div>
<div class="copy c1" id="c1" aria-hidden="true"><p class="kick">Ichidan</p><p class="h2" id="c1-h">Mashinani detallarga ajratdik</p><p class="lead">Aylantirishda davom eting, D-MAX qayta yig‘iladi.</p></div>
<div class="copy c2" id="c2"><p class="kick">${B.model}</p><p class="h2">Test-drayvga yoziling</p><a class="btn btn-red" href="${tel}">${ic("phone")}<span>Qo‘ng‘iroq qilish</span></a><p class="ph">${B.phone}</p></div>
<div class="bar" aria-hidden="true"><i id="bar"></i></div>
</div>
</div>
<div class="still" id="still"><div class="wrap">
<picture><source media="(orientation: portrait)" srcset="${IMG}/poster-e-9.webp"><img src="${IMG}/poster-e-16.webp" alt="${B.model} detallarga ajratilgan: kapot, eshiklar, g‘ildiraklar, yuk kuzovi" loading="lazy"></picture>
<ul class="still-l">${LABELS.map(([, k, v]) => `<li><small>${k}</small><b>${v}</b></li>`).join("")}</ul>
</div></div>
</section>`;
}

function specsBlock() {
  return `<section class="specs" id="raqamlar"><div class="wrap">
<div class="sh"><p class="kick">Texnik ma’lumotlar</p><h2>D-MAX IRBIS LSE raqamlarda</h2></div>
<ul class="sp">${SPECS.map(([n, u, d]) => `<li class="rv"><b>${n}${u ? ` <span>${u}</span>` : ""}</b><small>${d}</small></li>`).join("")}</ul>
<div class="dims rv"><p class="kick">O‘lchamlari, mm</p><p class="dim-n"><b>5 285</b><span>×</span><b>1 870</b><span>×</span><b>1 790</b></p><p class="dim-t"><span>uzunligi</span><span>kengligi</span><span>balandligi</span></p></div>
<p class="src">Ma’lumotlar: samauto.uz, 21.10.2026</p>
</div></section>`;
}

function mockBlock() {
  return `<section class="mock" id="maket"><div class="wrap mock-g">
<div class="sh"><p class="kick ours">DevUz Studio maketi</p><h2>Saytingizda shunday bo‘ladi</h2>
<p>Bu SamAuto sayti uchun namuna: D-MAX 3D modeli brauzerning o‘zida, aylantirganda detallarga ajraladi va qayta yig‘iladi. Ilova ham, plagin ham kerak emas.</p></div>
<ul class="mk">
<li class="rv">${ic("cube")}<b>${mb("dmax-m.glb")} MB</b><span>telefon uchun 3D model, kompyuterga ${mb("dmax.glb")} MB</span></li>
<li class="rv">${ic("phone")}<b>66 MB</b><span>hozirgi bosh sahifa telefonda, banner 5,6 soniyada chiqadi (21.10.2026 o‘lchovi)</span></li>
</ul>
<p class="note">Model fotosuratdan yaratilgan, zavod chizmasi emas. Tayyor saytda modelni zavod ma’lumotlari bilan aniqlashtiramiz, xuddi shunday sahna har bir modelga qo‘yiladi.</p>
<a class="btn btn-line" href="https://t.me/Devuz_studio_bot?start=samauto">DevUz Studio bilan muhokama</a>
</div></section>`;
}

function page() {
  return `<!doctype html>
<html lang="uz">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${B.model}: 3D sahna · SamAuto · DevUz Studio maketi</title>
<meta name="description" content="${B.model}: 3D modeli aylantirganda detallarga ajraladi va yig‘iladi. ISUZU 4JJ3 dizel, 2 999 sm³, 190 ot kuchi, 4x4, 670 kg yuk.">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#07080a">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="preload" as="image" href="${IMG}/poster-a-9.webp" media="(orientation: portrait)">
<link rel="preload" as="image" href="${IMG}/poster-a-16.webp" media="(orientation: landscape)">
<script>(function(){var r=document.documentElement;r.classList.add('js');var calm=false;try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)calm=true}catch(e){}try{var c=navigator.connection;if(c&&c.saveData)calm=true}catch(e){}try{var t=document.createElement('canvas');if(!(t.getContext('webgl2')||t.getContext('webgl')))calm=true}catch(e){calm=true}if(navigator.deviceMemory&&navigator.deviceMemory<2)calm=true;if(calm)r.classList.add('calm')})()</script>
@@S@@
</head>
<body class="site">
${dzIntroSolo("uz")}
${sprite()}
<a class="skip" href="#raqamlar">Mazmunga o‘tish</a>
<header class="top" id="top"><div class="wrap">
<a class="logo" href="__PROTO_BASE__" aria-label="SamAuto, bosh sahifaga">${logo()}</a>
<nav class="nav" aria-label="Bo‘limlar"><a href="#sahna">Mahsulotlar</a><a href="#raqamlar">Texnik ma’lumotlar</a><a href="#maket">Maket haqida</a></nav>
<a class="top-ph" href="${tel}">${ic("phone")}<span>${B.phone}</span></a>
</div></header>
<main id="main">
${sceneBlock()}
${specsBlock()}
${mockBlock()}
</main>
<footer class="foot"><div class="wrap">
<div class="cols">
<div>${logo("f-logo")}<p><a href="${tel}">${B.phone}</a></p><p><a href="${B.site}">samauto.uz</a></p></div>
<div><b>Maket ma’lumotlari</b><ul><li>Texnik ma’lumotlar va telefon: samauto.uz, 21.10.2026</li><li>3D model: samauto.uz’dagi fotosurat asosida, DevUz Studio</li></ul></div>
<div><b>DevUz Studio</b><ul><li><a href="https://devuz.studio">devuz.studio</a></li><li><a href="https://t.me/Devuz_studio_bot?start=samauto">Telegram</a></li></ul></div>
</div>
<div class="rights"><span>Bu maket: SamAuto sayti shunday ko‘rinishi mumkin. Sayt ma’lumot uchun va ommaviy oferta emas.</span><a href="https://devuz.studio/uz/mockup-terms">Maketdan foydalanish shartlari</a></div>
</div></footer>
<div class="dock" id="dock"><a class="btn btn-red" href="${tel}">${ic("phone")}<span>Test-drayvga yozilish</span></a></div>
<script type="application/json" id="sa-site">${JSON.stringify({ img: IMG })}</script>
<script src="${IMG}/scene.js" defer></script>
@@J@@
</body>
</html>`;
}

const out = { "": page() };
const parts = {
  S: `<style>${min(read("site.css"))}</style>`,
  J: `<script>\n${strip(read("site.js"))}</script>`,
};
const fill = (p) => Object.entries(parts).reduce((s, [n, part]) => s.split(`@@${n}@@`).join(part), p);

for (const v of Object.values(out)) for (const m of fill(v).matchAll(/\/protos\/samauto\/[\w./-]+\.(?:webp|png|js|glb)/g)) if (!existsSync(PUB + m[0])) console.warn("нет файла", m[0]);
mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, fill(v)]))));
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
writeFileSync(bundleDir + "samauto.json", JSON.stringify({ parts, pages: out }));
for (const [k, v] of Object.entries(out)) console.log((k || "(uz)").padEnd(8), fill(v).length);
