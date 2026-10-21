import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dzIntroSolo } from "../../../lib/proto/dz-video.mjs";

/*
 * Макет SamAuto (samauto.uz): первый экран — шоурум из презентации. По
 * прокрутке с оранжевого ISUZU D-MAX IRBIS LSE слетает покрывало, машина
 * разлетается на детали и собирается, камера подходит к фаре, обходит борт,
 * ворота зала открываются, и D-MAX уезжает в рассвет. Владелец DevUz,
 * 21.10.2026: «фотореализм как в пдф… прогрузку сайта до загрузки до 100%…
 * через нано банана отрисуем полностью в топ качестве… цвета точь в точь как
 * в презентации», и затем «всю первоначальную схему с появлением машины из
 * под ткани, фары, проезд… только первой хиро секцией… всё в 4К». Весь текст —
 * на узбекском (решение владельца для SamAuto, docs/research/samauto.md).
 *
 * Кадры — фото, а не 3D: ключевые кадры nano banana 4K, переходы между ними —
 * Kling 3.0 4K, из роликов seq.py берёт кадры (seq.json — сколько). Сцена
 * листает их по прокрутке; пока не загрузились все, на экране счёт до 100%.
 * Reduced motion и экономия трафика — два кадра (posters) и подписи списком.
 * Модель макет не вызывает. Отпечаток ставится при показе (lib/proto/bundles).
 */

const DIR = new URL(".", import.meta.url).pathname;
const PUB = new URL("../../../public", import.meta.url).pathname;
const IMG = "/protos/samauto";
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const min = (s) => strip(s).replace(/\n\s*/g, "");
const read = (f) => readFileSync(DIR + f, "utf8");
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

/* Кадры сцены (seq.py): ролик → число кадров, 16:9 (d) и 9:16 (m). */
const SEQ = JSON.parse(read("seq.json"));
const HOLD = 14; // столько кадров разлёт стоит на месте, пока читают подписи

/* Порядок кадров: покрывало, разлёт, пауза, сборка (разлёт задом наперёд),
   фара, борт, проезд. Индекс — номер ролика и кадра в нём. */
function order(set) {
  const clip = (name) => set.findIndex(([c]) => c === name);
  const run = (name, rev) => { const k = clip(name), n = set[k][1]; return Array.from({ length: n }, (_, i) => [k, rev ? n - 1 - i : i]); };
  const ex = [...run("t3"), ...run("t4")];
  return [...run("t1"), ...ex, ...Array(HOLD).fill(ex[ex.length - 1]), ...ex.slice().reverse(), ...run("t5"), ...run("t6"), ...run("t7")];
}
if (JSON.stringify(SEQ.d) !== JSON.stringify(SEQ.m)) throw new Error("у телефона и компьютера разный счёт кадров");
const ORDER = order(SEQ.d);
const N = ORDER.length;
/* Где в прокрутке что: доля = номер кадра / число кадров. */
const at = (name, end) => { const k = SEQ.d.findIndex(([c]) => c === name); let i = 0; for (const f of ORDER) { if (f[0] === k && f[1] === (end ? SEQ.d[k][1] - 1 : 0)) break; i++; } return i / (N - 1); };
const T = {
  hold: (SEQ.d[0][1] + SEQ.d[1][1] + SEQ.d[2][1]) / (N - 1),
  light: at("t5", true),
  side: at("t6", true),
};
/* Окно текста: [появляется, виден, гаснет, исчез], доли прокрутки. */
const win = (c, w = 0.035) => [c - w, c - w / 3, c + w / 3, c + w].map((x) => Math.max(0, Math.min(1, x)).toFixed(4)).join(",");

const EXPLODE = [
  ["Dvigatel ISUZU 4JJ3", "190 ot kuchi"],
  ["Dizel, hajmi", "2 999 sm³"],
  ["Yuritma", "4x4"],
];
const SIDE = [
  ["Uzunligi", "5 285 mm"],
  ["Yuk ko‘tarish", "670 kg"],
  ["To‘liq massa", "2 800 kg"],
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

const chips = (list) => `<ul class="chips">${list.map(([k, v]) => `<li><small>${k}</small><b>${v}</b></li>`).join("")}</ul>`;

function sceneBlock() {
  return `<section class="scene" id="sahna" aria-labelledby="c0-h">
<div class="track" id="track">
<div class="stage" id="stage">
<picture class="poster" id="poster"><source media="(orientation: portrait)" srcset="${IMG}/seq/m/t1-00.webp"><img src="${IMG}/seq/d/t1-00.webp" alt="${B.model} kulrang parda ostida, podiumda" fetchpriority="high"></picture>
<canvas id="cv" aria-hidden="true"></canvas>
<div class="boot" id="boot" aria-hidden="true"><p class="boot-n"><b id="boot-n">0</b>%</p><i><b id="boot-b"></b></i><span>Sahna yuklanmoqda</span></div>
<div class="copy c0" id="c0" data-w="0,0,0.0300,0.0800"><p class="kick">${B.model}</p><h1 id="c0-h">Yangi D-MAX bilan tanishing</h1><p class="lead">Pastga aylantiring: parda ochiladi, mashina detallarga ajraladi va yo‘lga chiqadi.</p><a class="hint" href="#raqamlar">${ic("down")}<span>Pastga aylantiring</span></a></div>
<div class="copy c1" data-w="${win(T.hold, 0.05)}" aria-hidden="true"><p class="kick">Ichidan</p><p class="h2">D-MAX qanday yig‘ilgan</p>${chips(EXPLODE)}</div>
<div class="copy c2" data-w="${win(T.light)}" aria-hidden="true"><p class="kick">Old tomondan</p><p class="h2">Yaqinroq qarang</p></div>
<div class="copy c3" data-w="${win(T.side)}" aria-hidden="true"><p class="kick">Yon tomondan</p><p class="h2">D-MAX IRBIS LSE</p>${chips(SIDE)}</div>
<div class="copy c4" id="c4" data-w="0.9600,0.9900,2,2"><p class="kick">${B.model}</p><p class="h2">Test-drayvga yoziling</p><a class="btn btn-red" href="${tel}">${ic("phone")}<span>Qo‘ng‘iroq qilish</span></a><p class="ph">${B.phone}</p></div>
<div class="bar" aria-hidden="true"><i id="bar"></i></div>
</div>
</div>
<div class="still" id="still"><div class="wrap">
<picture><source media="(orientation: portrait)" srcset="${IMG}/poster-a-9.webp"><img src="${IMG}/poster-a-16.webp" alt="${B.model} podiumda, qizil halqa yonida" loading="lazy"></picture>
<picture><source media="(orientation: portrait)" srcset="${IMG}/poster-e-9.webp"><img src="${IMG}/poster-e-16.webp" alt="${B.model} detallarga ajratilgan: kapot, eshiklar, dvigatel, rama, g‘ildiraklar" loading="lazy"></picture>
<ul class="still-l">${[...EXPLODE, ...SIDE].map(([k, v]) => `<li><small>${k}</small><b>${v}</b></li>`).join("")}</ul>
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
<p>Bu SamAuto sayti uchun namuna: prezentatsiyadagi zal, o‘sha ranglar. Aylantirganda parda ochiladi, D-MAX detallarga ajraladi, qayta yig‘iladi va zaldan yo‘lga chiqadi. Ilova ham, plagin ham kerak emas.</p></div>
<ul class="mk">
<li class="rv">${ic("cube")}<b>4K</b><span>har bir kadr 4K sifatda yaratilgan, telefon va kompyuter uchun alohida</span></li>
<li class="rv">${ic("phone")}<b>66 MB</b><span>hozirgi bosh sahifa telefonda, banner 5,6 soniyada chiqadi (21.10.2026 o‘lchovi)</span></li>
</ul>
<p class="note">Kadrlar samauto.uz’dagi fotosurat va prezentatsiya asosida sun’iy intellekt bilan chizilgan, mashinaning ichki qismlari taxminiy. Tayyor saytda studiya suratlari yoki zavod ma’lumotlari asosida xuddi shunday sahna har bir modelga qo‘yiladi.</p>
<a class="btn btn-line" href="https://t.me/Devuz_studio_bot?start=samauto">DevUz Studio bilan muhokama</a>
</div></section>`;
}

function page() {
  return `<!doctype html>
<html lang="uz">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${B.model}: sahna · SamAuto · DevUz Studio maketi</title>
<meta name="description" content="${B.model}: aylantirganda parda ochiladi, mashina detallarga ajraladi, yig‘iladi va yo‘lga chiqadi. ISUZU 4JJ3 dizel, 2 999 sm³, 190 ot kuchi, 4x4, 670 kg yuk.">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#07080a">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="preload" as="image" href="${IMG}/seq/m/t1-00.webp" media="(orientation: portrait)">
<link rel="preload" as="image" href="${IMG}/seq/d/t1-00.webp" media="(orientation: landscape)">
<script>(function(){var r=document.documentElement;r.classList.add('js');var calm=false;try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)calm=true}catch(e){}try{var c=navigator.connection;if(c&&c.saveData)calm=true}catch(e){}if(navigator.deviceMemory&&navigator.deviceMemory<2)calm=true;if(calm)r.classList.add('calm')})()</script>
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
<div><b>Maket ma’lumotlari</b><ul><li>Texnik ma’lumotlar va telefon: samauto.uz, 21.10.2026</li><li>Sahna: samauto.uz’dagi fotosurat va prezentatsiya asosida, DevUz Studio</li></ul></div>
<div><b>DevUz Studio</b><ul><li><a href="https://devuz.studio">devuz.studio</a></li><li><a href="https://t.me/Devuz_studio_bot?start=samauto">Telegram</a></li></ul></div>
</div>
<div class="rights"><span>Bu maket: SamAuto sayti shunday ko‘rinishi mumkin. Sayt ma’lumot uchun va ommaviy oferta emas.</span><a href="https://devuz.studio/uz/mockup-terms">Maketdan foydalanish shartlari</a></div>
</div></footer>
<div class="dock" id="dock"><a class="btn btn-red" href="${tel}">${ic("phone")}<span>Test-drayvga yozilish</span></a></div>
<script type="application/json" id="sa-site">${JSON.stringify({ img: IMG, frames: ORDER.map(([k, i]) => `${SEQ.d[k][0]}-${String(i).padStart(2, "0")}`) })}</script>
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

for (const v of Object.values(out)) for (const m of fill(v).matchAll(/\/protos\/samauto\/[\w./-]+\.(?:webp|png|js)/g)) if (!existsSync(PUB + m[0])) console.warn("нет файла", m[0]);
mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, fill(v)]))));
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
writeFileSync(bundleDir + "samauto.json", JSON.stringify({ parts, pages: out }));
for (const [k, v] of Object.entries(out)) console.log((k || "(uz)").padEnd(8), fill(v).length);
