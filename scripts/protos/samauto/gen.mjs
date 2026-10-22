import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dzIntroSolo } from "../../../lib/proto/dz-video.mjs";
import { CAT, KINDS, PAINT, RIMS, catalogJson, lineupBlock, pickerBlock, fvrBlock, dmaxBlock, payBlock, bizBlock, cityBlock, dealerBlock, worldBlock, factoryBlock, arizaView } from "./sections.mjs";

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
/* Гарнитура презентации: Inter Tight в заголовках, Inter в тексте (OFL, латиница и кириллица). */
const FONTS = "https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;700&family=Inter:wght@400;700&display=swap";

/* Факты — только с samauto.uz, 21.10.2026 (docs/research/samauto.md). */
const B = {
  name: "SamAuto",
  site: "https://samauto.uz",
  phone: "+998 (78) 140-80-00",
  tel: "tel:+998781408000",
  model: "ISUZU D-MAX IRBIS LSE",
  bot: "https://t.me/samautobot",
  tg: "https://t.me/samauto_uz",
};
const tel = B.tel;

/* Кадры сцены (seq.py): ролик → число кадров, 16:9 (d) и 9:16 (m), и
   порядок сцены — покрывало, разлёт, пауза, сборка (разлёт задом наперёд),
   фара, борт, проезд. Телефону тот же порядок одним видео m.mp4. */
const SEQ = JSON.parse(read("seq.json"));
if (JSON.stringify(SEQ.d) !== JSON.stringify(SEQ.m)) throw new Error("у телефона и компьютера разный счёт кадров");
const ORDER = SEQ.order;
const N = ORDER.length;
const last = (c) => `${c}-${String(SEQ.d.find(([n]) => n === c)[1] - 1).padStart(2, "0")}`;
/* Где в прокрутке что: доля = номер кадра / число кадров. */
const T = {
  hold: (ORDER.indexOf(last("t4")) + SEQ.hold / 2) / (N - 1),
  light: ORDER.indexOf(last("t5b")) / (N - 1),
  side: ORDER.indexOf(last("t6")) / (N - 1),
  /* финальный текст — когда D-MAX ушёл к горизонту (последняя четверть t8) */
  away: (ORDER.indexOf(last("t8")) - SEQ.d.find(([n]) => n === "t8")[1] / 4) / (N - 1),
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


const ic = (n, cls = "") => `<svg class="i${cls ? " " + cls : ""}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const sprite = () => `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
<symbol id="i-phone" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></symbol>
<symbol id="i-down" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M6 13l6 6 6-6"/></symbol>
<symbol id="i-x" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M6 6l12 12M18 6 6 18"/></symbol>
<symbol id="i-arrow" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 6l6 6-6 6"/></symbol>
<symbol id="i-left" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M15 5l-7 7 7 7"/></symbol>
<symbol id="i-right" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></symbol>
<symbol id="i-pin" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/></symbol>
<symbol id="i-tg" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M21 4 3 11l6 2 2 6 3-4 5 4z"/><path fill="none" stroke="currentColor" stroke-width="1.8" d="m9 13 8-6"/></symbol>
<symbol id="i-swipe" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M4 8h16M7 5 4 8l3 3M17 5l3 3-3 3M9 21v-6.5a1.5 1.5 0 0 1 3 0V17l3.5.6a2 2 0 0 1 1.6 2.3L16.8 21"/></symbol>
<symbol id="i-hand" viewBox="0 0 48 48"><path fill="currentColor" d="M19 6a3 3 0 0 1 3 3v12.2l1.1-.2a3 3 0 0 1 3.4 2.2l.1.5 1-.2a3 3 0 0 1 3.4 2.3l.1.5.6-.1a3 3 0 0 1 3.5 2.6l1 8.6c.4 3.4-1.2 6.7-4.1 8.5L31 47H20.5l-7.7-9.6a3.4 3.4 0 0 1 4.8-4.7L16 30.9V9a3 3 0 0 1 3-3z"/></symbol>
<symbol id="i-cube" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M12 3 4 7.5v9L12 21l8-4.5v-9zM4 7.5 12 12l8-4.5M12 12v9"/></symbol>
</svg>`;

const logo = (cls = "logo-i") => `<img class="${cls}" src="${IMG}/logo.webp" width="600" height="64" alt="SamAuto">`;

const chips = (list) => `<ul class="chips">${list.map(([k, v]) => `<li><small>${k}</small><b>${v}</b></li>`).join("")}</ul>`;

function sceneBlock() {
  return `<section class="scene" id="sahna" aria-labelledby="c0-h">
<div class="track" id="track">
<div class="stage" id="stage">
<picture class="poster" id="poster"><source media="(orientation: portrait)" srcset="${IMG}/seq/m/t1-00.webp"><img src="${IMG}/seq/d/t1-00.webp" alt="${B.model} kulrang parda ostida, podiumda" fetchpriority="high"></picture>
<video id="vd" muted playsinline preload="none" disablepictureinpicture aria-hidden="true"></video>
<canvas id="cv" aria-hidden="true"></canvas>
<div class="boot" id="boot" aria-hidden="true"><p class="boot-n"><b id="boot-n">0</b>%</p><i><b id="boot-b"></b></i><span>Sahna yuklanmoqda</span></div>
<div class="copy c0" id="c0" data-w="0,0,0.0300,0.0800"><p class="kick">${B.model}</p><h1 id="c0-h">Yangi D-MAX bilan tanishing</h1><p class="lead">Pastga aylantiring: parda ochiladi, mashina detallarga ajraladi va yo‘lga chiqadi.</p><a class="hint" href="#qator">${ic("down")}<span>Pastga aylantiring</span></a></div>
<div class="copy c1" data-w="${win(T.hold, 0.05)}" aria-hidden="true"><p class="kick">Ichidan</p><p class="h2">D-MAX qanday yig‘ilgan</p>${chips(EXPLODE)}</div>
<div class="copy c2" data-w="${win(T.light)}" aria-hidden="true"><p class="kick">Old tomondan</p><p class="h2">Yaqinroq qarang</p></div>
<div class="copy c3" data-w="${win(T.side)}" aria-hidden="true"><p class="kick">Yon tomondan</p><p class="h2">D-MAX IRBIS LSE</p>${chips(SIDE)}</div>
<div class="copy c4" id="c4" data-w="${(T.away - 0.006).toFixed(4)},${(T.away + 0.012).toFixed(4)},2,2"><p class="kick">SamAuto</p><p class="h2 draw" id="c4-h">${"Har bir ish uchun o‘z texnikasi".split(" ").map((w, i) => `<span style="--i:${i}">${w}</span>`).join(" ")}</p><p class="lead">Pikaplar, yuk avtomobillari, avtobuslar va maxsus texnika: Samarqandda yig‘iladi, butun mamlakat bo‘ylab dilerlar.</p>
<div class="c4-b"><a class="btn btn-red" href="#qator">Model qatori</a><a class="btn btn-line" href="#tanlash">Texnika tanlash</a></div>
<a class="ph-l" href="${tel}">${ic("phone")}<span>${B.phone}</span></a></div>
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

function mockBlock() {
  return `<section class="mock" id="maket"><div class="wrap mock-g">
<div class="sh"><p class="kick ours">DevUz Studio maketi</p><h2>Saytingizda shunday bo‘ladi</h2>
<p>Bu SamAuto sayti uchun namuna, prezentatsiya bo‘yicha: aylantirganda ochiladigan shourum, bitta podiumdagi model qatori, vazifaga qarab tanlash, 360 daraja aylanadigan D-MAX, o‘z yengil xaritamizdagi dilerlar. Modellar, raqamlar va dilerlar ularning saytidan olingan.</p></div>
<ul class="mk">
<li class="rv">${ic("cube")}<b>4K</b><span>har bir kadr 4K sifatda yaratilgan, telefon va kompyuter uchun alohida</span></li>
<li class="rv">${ic("phone")}<b>66 MB</b><span>hozirgi bosh sahifa telefonda, banner 5,6 soniyada chiqadi (21.10.2026 o‘lchovi)</span></li>
</ul>
<p class="note">Kadrlar samauto.uz’dagi fotosurat va prezentatsiya asosida sun’iy intellekt bilan chizilgan, mashinaning ichki qismlari taxminiy. Tayyor saytda studiya suratlari yoki zavod ma’lumotlari asosida xuddi shunday sahna har bir modelga qo‘yiladi.</p>
<a class="btn btn-line" href="https://t.me/Devuz_studio_bot?start=samauto">DevUz Studio bilan muhokama</a>
</div></section>`;
}

/* Окно техники: живая сцена на весь экран, машина из карточки, цифры. */
function fleetView() {
  return `<div class="fv" id="fv" role="dialog" aria-modal="true" aria-labelledby="fv-h" hidden>
<video class="fv-v" id="fv-v" muted playsinline loop preload="none" disablepictureinpicture aria-hidden="true"></video>
<img class="fv-car" id="fv-car" alt="" aria-hidden="true">
<div class="fv-p"><p class="kick" id="fv-k"></p><p class="h2" id="fv-h"></p><p class="fv-w" id="fv-w"></p><ul class="nfs" id="fv-b"></ul><ul class="fv-t" id="fv-t"></ul>
<p class="fv-mh"><b>Modellar</b><span id="fv-mh"></span></p><ul class="fv-ml" id="fv-ml"></ul>
<div class="fv-cta"><a class="btn btn-red" href="${tel}">${ic("phone")}<span>Narxini bilish</span></a><a class="btn btn-line" href="#tanlash" data-close>Vazifaga qarab tanlash</a></div></div>
<button type="button" class="fv-x" id="fv-x" aria-label="Yopish">${ic("x")}</button>
</div>
`;
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
<a class="skip" href="#qator">Mazmunga o‘tish</a>
<header class="top" id="top"><div class="wrap">
<a class="logo" href="__PROTO_BASE__" aria-label="SamAuto, bosh sahifaga">${logo()}</a>
<nav class="nav" aria-label="Bo‘limlar"><a href="#qator">Mahsulotlar</a><a href="#tanlash">Tanlash</a><a href="#dmax">D-MAX 360°</a><a href="#dilerlar">Dilerlar</a><a href="#tolov">Muddatli to‘lov</a></nav>
<a class="top-ph" href="${tel}">${ic("phone")}<span>${B.phone}</span></a><button type="button" class="btn btn-red btn-s top-cta" data-ariza="umumiy">Ariza qoldirish</button>
</div></header>
<main id="main">
${sceneBlock()}
${lineupBlock(IMG, ic)}
${pickerBlock(ic)}
${fvrBlock(IMG)}
${dmaxBlock(IMG, ic)}
${payBlock()}
${bizBlock(IMG)}
${cityBlock(IMG)}
${dealerBlock(IMG, ic)}
${worldBlock(IMG)}
${factoryBlock(IMG)}
${mockBlock()}
</main>
${fleetView()}
<footer class="foot"><div class="wrap">
<div class="cols">
<div>${logo("f-logo")}<p><a href="${tel}">${B.phone}</a></p><p><a href="${B.site}">samauto.uz</a></p><p><a href="${B.tg}" target="_blank" rel="noopener">Telegram</a></p></div>
<div><b>Modellar qatori</b><ul>${KINDS.map((k) => `<li><a href="#qator">${k.title}</a></li>`).join("")}</ul></div>
<div><b>Xizmat</b><ul><li><a href="#dilerlar">Diler topish</a></li><li><a href="#dilerlar">Servisga yozilish</a></li><li><a href="#tolov">Muddatli to‘lov</a></li><li><a href="#zavod">Mahalliylashtirish</a></li></ul></div>
<div><b>Maket ma’lumotlari</b><ul><li>Modellar, raqamlar, dilerlar va telefon: samauto.uz, 21.10.2026</li><li>Sahna: samauto.uz’dagi fotosurat va prezentatsiya asosida, DevUz Studio</li></ul></div>
<div><b>DevUz Studio</b><ul><li><a href="https://devuz.studio">devuz.studio</a></li><li><a href="https://t.me/Devuz_studio_bot?start=samauto">Telegram</a></li></ul></div>
</div>
<div class="rights"><span>Bu maket: SamAuto sayti shunday ko‘rinishi mumkin. Sayt ma’lumot uchun va ommaviy oferta emas.</span><a href="https://devuz.studio/uz/mockup-terms">Maketdan foydalanish shartlari</a></div>
</div></footer>
<nav class="dock" id="dock" aria-label="Tezkor aloqa"><a href="${tel}">${ic("phone")}<span>Qo‘ng‘iroq</span></a><a href="${B.tg}" target="_blank" rel="noopener">${ic("tg")}<span>Telegram</span></a><a href="#dilerlar">${ic("pin")}<span>Diler</span></a></nav>
${arizaView(B, ic)}
<script type="application/json" id="sa-cat">${catalogJson()}</script>
<script type="application/json" id="sa-tt">${JSON.stringify({ ...JSON.parse(read("tt.json")), paint: PAINT, rims: RIMS })}</script>
<script type="application/json" id="sa-site">${JSON.stringify({ img: IMG, base: "__PROTO_BASE__", frames: ORDER, fps: SEQ.fps })}</script>
@@J@@
</body>
</html>`;
}

const out = { "": page() };
const parts = {
  S: `<style>${min(read("site.css") + read("page.css"))}</style>`,
  /* page.js — внутри той же функции, что и site.js: общие $, unseal, site. */
  J: `<script>\n${strip(read("site.js")).replace(/\}\)\(\);\s*$/, () => strip(read("page.js")) + "\n})();\n")}</script>`,
};
const fill = (p) => Object.entries(parts).reduce((s, [n, part]) => s.split(`@@${n}@@`).join(part), p);

for (const v of Object.values(out)) for (const m of fill(v).matchAll(/\/protos\/samauto\/[\w./-]+\.(?:webp|png|js|bin)/g)) if (!existsSync(PUB + m[0])) console.warn("нет файла", m[0]);
mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, fill(v)]))));
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
writeFileSync(bundleDir + "samauto.json", JSON.stringify({ parts, pages: out }));
for (const [k, v] of Object.entries(out)) console.log((k || "(uz)").padEnd(8), fill(v).length);
