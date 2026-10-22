/*
 * Разделы сайта SamAuto после сцены — по презентации (21 слайд, 21.10.2026):
 * линейка на одном подиуме, подбор по задаче, FVR «одна шасси — три работы»,
 * D-MAX 360° с цветом и дисками, рассрочка, кабинет компании, автобусы и
 * спецтехника, дилеры и сервис, SamAuto dunyosi, завод. Владелец DevUz,
 * 21.10.2026: «собери сайт… когда машина уехала, возьми кадр где все их машины
 * стоят в ряд… после нажатия уже открывается инфа о них. Информацию вытащи с
 * их сайта». Модели, цифры и дилеры — catalog.json (открытый API samauto.uz),
 * цен нет: на их сайте цены скрыты.
 */
import { readFileSync } from "node:fs";

const DIR = new URL(".", import.meta.url).pathname;
export const CAT = JSON.parse(readFileSync(DIR + "catalog.json", "utf8"));

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const num = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const hp = (p) => (String(p || "").match(/(\d+)\s*o\.?\s?k/) || [])[1];
const kg = (v) => Number(String(v || "").replace(/\s/g, "")) || 0;

/* Разделы их сайта; ключ — для живой сцены (fleet/<ключ>-16|9.bin). */
export const KINDS = [
  { cat: "pikap", short: "Pikap", key: "pikap", title: "Pikaplar", line: "D-MAX IRBIS LSE, OKSUS, SAHAR, tez yordam", lead: "ISUZU D-MAX IRBIS LSE", where: "Tog‘ va dala yo‘llari",
    bars: [["Quvvat", 190, 300, "190 o.k."], ["Dvigatel hajmi", 2999, 8000, "2 999 sm³"], ["Yuk ko‘tarish", 670, 10000, "670 kg"]], tags: ["4x4", "ISUZU 4JJ3, dizel", "5 o‘rin"], pin: [17, 47], box: [6, 28] },
  { cat: "yuk", short: "Yuk", key: "yuk", title: "Yuk avtomobillari", line: "NMR, NPR, NQR, FVR, CYZ shassilari: furgon, refrijerator, samosval, bortli, kran", lead: "ISUZU FVR34K", where: "Qurilish maydoni, samosval",
    bars: [["Quvvat", 240, 400, "240 o.k."], ["Dvigatel hajmi", 7790, 15000, "7 790 sm³"], ["Yuk ko‘tarish", 9300, 16000, "9 300 kg"]], tags: ["To‘liq massa 18 t", "6HK1"], pin: [40, 36], box: [28.5, 50.5] },
  { cat: "avtobus", short: "Avtobus", key: "avtobus", title: "Avtobuslar", line: "SAZ LE60, gazda yuradigan HC45, HD50", lead: "SAZ LE60", where: "Shahar yo‘nalishlari",
    bars: [["Yo‘lovchilar", 56, 60, "56 o‘rin"], ["Quvvat", 190, 300, "190 o.k."]], tags: ["Past pol", "Evro-5", "2012-yildan konveyerda"], pin: [62, 36], box: [50.5, 74.5] },
  { cat: "maxsus", short: "Maxsus", key: "vishka", title: "Maxsus texnika", line: "suv tashuvchilar, benzovozlar, sug‘orish-yuvish, avtominoralar, qutqaruvchilar", lead: "ISUZU NQR90L-K", where: "Shahar xo‘jaligi",
    bars: [["Yuk ko‘tarish", 5000, 10000, "5 000 kg"], ["Quvvat", 155, 300, "155 o.k."]], tags: ["Avtominora 18 va 22 m", "Avariya-qutqaruv"], pin: [84, 41], box: [74.5, 94] },
];

export function catalogJson() {
  return JSON.stringify({ items: CAT.items.map((i) => ({ ...i, hp: hp(i.power) ? +hp(i.power) : undefined, kg: kg(i.load) || undefined })), kinds: KINDS, dealers: CAT.dealers });
}

const count = (cat) => CAT.items.filter((i) => i.cat === cat).length;

export function lineupBlock(IMG, ic) {
  return `<section class="ln" id="qator" aria-labelledby="ln-h">
<div class="wrap"><div class="sh rv"><p class="kick">Model qatori</p><h2 id="ln-h">SamAuto’ning barcha texnikasi bitta podiumda</h2><p class="sub">Mashinaga bosing: qayerda ishlashi, raqamlari va barcha modellari.</p></div></div>
<div class="ln-st" id="ln-st"><div class="ln-in" id="ln-in">
<picture><source media="(max-width: 767px)" srcset="${IMG}/s/lineup-1400.webp"><img src="${IMG}/s/lineup-2400.webp" width="2400" height="1018" alt="SamAuto texnikasi bitta podiumda: to‘q sariq ISUZU D-MAX, ISUZU FVR samosval, SAZ avtobusi va ISUZU suv tashuvchi" loading="lazy" decoding="async"></picture>
<span class="ln-sp" aria-hidden="true"></span>
<i class="rl ghost ln-floor" aria-hidden="true"></i>
${KINDS.map((k) => `<button type="button" class="ln-hs${k.pin[0] > 70 ? " flip" : ""}" data-k="${k.cat}" style="--x:${k.pin[0]}%;--y:${k.pin[1]}%;--l:${k.box[0]}%;--r:${k.box[1]}%" aria-haspopup="dialog"><span class="ln-pin"><i></i><small>${k.title}</small><b>${esc(k.lead)}</b></span></button>`).join("")}
</div>
<button type="button" class="ln-ar ln-prev" data-d="-1" aria-label="Oldingi texnika">${ic("left")}</button><button type="button" class="ln-ar ln-next" data-d="1" aria-label="Keyingi texnika">${ic("right")}</button>
</div>
<div class="wrap ln-m" id="ln-m">
<div class="ln-tabs" role="tablist" aria-label="Texnika turi">${KINDS.map((k, i) => `<button type="button" role="tab" aria-selected="${i ? "false" : "true"}" data-i="${i}">${k.short}</button>`).join("")}<i class="rl" aria-hidden="true"></i></div>
<div class="ln-card" aria-live="polite"><small id="ln-mk">${KINDS[0].title}</small><b id="ln-mh">${esc(KINDS[0].lead)}</b><span id="ln-ml">${esc(KINDS[0].line)}</span>
<button type="button" class="btn btn-red" id="ln-mb" aria-haspopup="dialog"><span>Batafsil · <em id="ln-mn">${count(KINDS[0].cat)}</em> ta model</span>${ic("arrow")}</button></div>
</div>
<ul class="wrap ln-cats">${KINDS.map((k, i) => `<li class="rv" style="--d:${i * 0.45}s"><i class="rl" aria-hidden="true"></i><button type="button" class="ln-cat" data-k="${k.cat}" aria-haspopup="dialog"><b>${k.title}</b><span>${esc(k.line)}</span><em>${count(k.cat)} ta model ${ic("arrow")}</em></button></li>`).join("")}</ul>
</section>`;
}

/* Подбор: пять вопросов, как на 9-м слайде. Ответы — правила в page.js. */
const Q = [
  ["what", "Nima tashiysiz?", [["yuk", "Yuk"], ["odam", "Yo‘lovchi"], ["suv", "Suv / yoqilg‘i"], ["qurilish", "Qurilish materiali"], ["shahar", "Shahar xizmati"]]],
  ["kg", "Yuk og‘irligi", [["1", "1 t gacha"], ["5", "1-5 t"], ["10", "5-10 t"], ["99", "10 t dan ko‘p"]]],
  ["road", "Qayerda ishlaydi?", [["city", "Shahar ichida"], ["inter", "Shaharlararo"], ["off", "Tog‘ va yo‘lsiz joy"]]],
  ["pay", "Qanday sotib olasiz?", [["cash", "Naqd"], ["credit", "Muddatli to‘lov"], ["tender", "Tender orqali"]]],
  ["qty", "Nechta mashina kerak?", [["1", "1"], ["5", "2-5"], ["20", "6-20"], ["99", "20 dan ko‘p"]]],
];
const PRE = { what: "yuk", kg: "10", road: "inter", pay: "credit", qty: "5" };

export function pickerBlock(ic) {
  return `<section class="pk" id="tanlash" aria-labelledby="pk-h"><div class="wrap">
<div class="sh rv"><p class="kick">Vazifaga qarab tanlash</p><h2 id="pk-h">Beshta savol, sayt modelni o‘zi tanlaydi</h2></div>
<div class="pk-g">
<form class="pk-q rv" id="pk-q" aria-label="Savollar">${Q.map(([n, t, opts]) => `<fieldset><legend>${t}</legend><div class="opt">${opts.map(([v, l]) => `<label><input type="radio" name="${n}" value="${v}"${PRE[n] === v ? " checked" : ""}><span>${l}</span></label>`).join("")}</div></fieldset>`).join("")}</form>
<div class="pk-r rv"><p class="pk-t">Sizga mos <b id="pk-n">3</b> ta model</p><ol class="pk-l" id="pk-l" aria-live="polite"></ol>
<div class="pk-bar"><p><small>Tanlandi</small><b id="pk-sel">…</b><span id="pk-pay"></span></p><button type="button" class="btn btn-red" data-ariza="tanlash">Ariza qoldirish</button></div></div>
</div></div></section>`;
}

/* FVR: одна шасси — три кузова. Цифры — их карточки моделей. */
const fvrOf = (t) => CAT.items.find((i) => i.title === t) || {};
export const FVR = [
  ["samosval", "Samosval", fvrOf("ISUZU FVR34K shassisi negizidagi o‘zi ag‘dargich"), "Qum, shag‘al, qurilish chiqindisi"],
  ["tent", "Tentli bort", fvrOf("ISUZU FVR34Q shassisi negizidagi tentli bortli avtomobil"), "Shaharlararo yuk, paletlar"],
  ["van", "Furgon", fvrOf("ISUZU FVR34Q shassisi negizidagi furgon"), "Yopiq kuzov, quruq yuk"],
].map(([k, l, it, use]) => ({ k, l, use, hp: hp(it.power), load: kg(it.load), weight: it.weight, title: it.title }));

export function fvrBlock(IMG) {
  const f = FVR[0];
  return `<section class="fv2" id="fvr" aria-labelledby="fvr-h">
<div class="fv2-st" aria-hidden="true">${FVR.map((x, i) => `<picture class="fv2-im${i ? "" : " on"}" data-k="${x.k}"><source media="(max-width: 767px)" srcset="${IMG}/s/fvr-${x.k}-900.webp"><img src="${IMG}/s/fvr-${x.k}-1600.webp" alt="" loading="lazy" decoding="async"></picture>`).join("")}<i class="fv2-sw"></i><i class="rl ghost fv2-floor"></i></div>
<div class="wrap fv2-t">
<p class="kick">Yuk avtomobillari · ISUZU FVR</p><h2 id="fvr-h">Bitta shassi, uch xil ish</h2>
<p class="sub">Bitta FVR shassisida samosval, tentli bort va furgon yig‘iladi. Kuzovni tanlang, podiumdagi mashina ko‘z oldingizda o‘zgaradi.</p>
<dl class="fv2-n"><div><dt>o.k., ISUZU 6HK1</dt><dd data-n="hp">${f.hp}</dd></div><div><dt>kg yuk ko‘tarish</dt><dd data-n="load">${num(f.load)}</dd></div><div><dt>kg to‘liq massa</dt><dd data-n="weight">${num(f.weight)}</dd></div></dl>
<div class="seg" role="radiogroup" aria-label="Kuzov">${FVR.map((x, i) => `<button type="button" role="radio" aria-checked="${i ? "false" : "true"}" data-k="${x.k}">${x.l}</button>`).join("")}</div>
<p class="fv2-u" id="fv2-u">${f.use}</p>
<script type="application/json" id="sa-fvr">${JSON.stringify(FVR)}</script>
</div></section>`;
}

/* D-MAX 360°: кадры стенда (turn.py), цвет и диски перекрашивает шейдер. */
export const PAINT = [
  ["orange", "To‘q sariq", "#c4521c"],
  ["white", "Oq", "#e9eaec"],
  ["silver", "Kumush", "#9aa0a6"],
  ["grey", "To‘q kulrang", "#3b3f45"],
  ["blue", "Ko‘k", "#1f4f9c"],
  ["red", "Qizil", "#9e1b1f"],
];
export const RIMS = [
  ["black", "Qora yaltiroq", "#1d1f22"],
  ["silver", "Kumush", "#b9bdc2"],
  ["bronze", "Bronza", "#8a6a3e"],
];

export function dmaxBlock(IMG, ic) {
  const d = CAT.items.filter((i) => i.cat === "pikap" && i.body !== "Tez tibbiy yordam");
  const row = (k, v) => `<div><dt>${k}</dt><dd>${v}</dd></div>`;
  return `<section class="dm" id="dmax" aria-labelledby="dm-h"><div class="wrap">
<div class="sh rv"><p class="kick">Model sahifasi</p><h2 id="dm-h">D-MAX’ni aylantiring, rangini va diskini tanlang</h2></div>
<div class="dm-g">
<div class="dm-view">
<div class="dm-st" id="dm-st">
<canvas id="dm-cv" aria-label="ISUZU D-MAX IRBIS LSE podiumda, 360 daraja aylantirish mumkin" role="img"></canvas>
<picture><source media="(max-width: 767px)" srcset="${IMG}/tt/poster-9.webp"><img class="dm-po" id="dm-po" src="${IMG}/tt/poster-16.webp" alt="" aria-hidden="true"></picture>
<div class="dm-load" id="dm-load" aria-hidden="true"><i><b id="dm-lb"></b></i></div>
<div class="dm-hint" id="dm-hint" aria-hidden="true"><svg class="dm-arc" viewBox="0 0 120 40"><path d="M10 26c18 10 82 10 100 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 6"/><path d="M104 20l6 6-8 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>${ic("hand", "dm-hand")}<span>Aylantirish uchun suring</span></div>

<div class="dm-ctl"><button type="button" class="dm-ar" data-step="-1" aria-label="Chapga burish">${ic("left")}</button><input type="range" id="dm-rg" min="0" max="71" value="0" step="1" aria-label="Burchak, 360 daraja"><button type="button" class="dm-ar" data-step="1" aria-label="O‘ngga burish">${ic("right")}</button></div>
</div>
<div class="dm-sw" role="radiogroup" aria-label="Rang">${PAINT.map(([k, l, c], i) => `<button type="button" role="radio" aria-checked="${i ? "false" : "true"}" data-paint="${k}" style="--c:${c}" title="${l}"><span class="sr">${l}</span></button>`).join("")}<b id="dm-pn">${PAINT[0][1]}</b></div>
</div>
<div class="dm-p">
<p class="kick">ISUZU D-MAX IRBIS LSE</p>
<div class="dm-o"><p class="dm-ol">Disklar</p><div class="dm-rims" role="radiogroup" aria-label="Disklar">${RIMS.map(([k, l, c], i) => `<button type="button" role="radio" aria-checked="${i ? "false" : "true"}" data-rim="${k}" style="--c:${c}"><i></i><span>${l}</span></button>`).join("")}</div></div>
<dl class="dm-t">${row("Dvigatel", "ISUZU 4JJ3, 2 999 sm³")}${row("Quvvat", "140 kVt / 190 o.k.")}${row("Yuritma", "4x4")}${row("Yuk ko‘tarish", "670 kg")}${row("To‘liq massa", "2 800 kg")}${row("Uzunlik × kenglik × balandlik", "5 285 × 1 870 × 1 790 mm")}</dl>
<p class="dm-ol">Boshqa versiyalar</p>
<ul class="dm-v">${d.filter((i) => !/IRBIS LSE$/.test(i.title)).map((i) => `<li><b>${esc(i.title.replace("ISUZU ", ""))}</b><span>${hp(i.power)} o.k.${i.load ? ` · ${num(kg(i.load))} kg` : ""}${i.seats ? ` · ${i.seats} o‘rin` : ""}</span></li>`).join("")}</ul>
<div class="dm-b"><button type="button" class="btn btn-red" data-ariza="narx">Narxni bilish</button><button type="button" class="btn btn-line" data-ariza="testdrayv">Test-drayvga yozilish</button></div>
<p class="note">Rang va disk tanlovi namoyish uchun: mavjud ranglarni rasmiy dilerdan aniqlang.</p>
</div></div></div></section>`;
}

export function payBlock() {
  return `<section class="py" id="tolov" aria-labelledby="py-h"><div class="wrap py-g">
<div class="rv"><p class="kick">Muddatli to‘lov</p><h2 id="py-h">ISUZU foizsiz kreditga</h2><p class="sub">Mikrokreditbank bilan: ustama yo‘q, to‘lov 24 oygacha bo‘linadi. Ariza tanlangan model va muddat bilan darhol dilerga boradi.</p>
<button type="button" class="btn btn-red" data-ariza="kredit">Muddatli to‘lovga ariza</button></div>
<ul class="py-n">${[["0%", "ustama"], ["24", "oygacha"], ["MKBANK", "hamkor bank"]].map(([n, l], i) => `<li class="rv"><i class="rl" aria-hidden="true" style="--d:${i * 0.6}s"></i><b>${n}</b><span>${l}</span></li>`).join("")}</ul>
</div></section>`;
}

export function bizBlock(IMG) {
  return `<section class="bz" id="biznes" aria-labelledby="bz-h">
<picture class="bz-bg" aria-hidden="true"><source media="(max-width: 767px)" srcset="${IMG}/s/road-900.webp"><img src="${IMG}/s/road-1600.webp" alt="" loading="lazy" decoding="async"></picture>
<div class="wrap bz-g"><div class="rv"><p class="kick">Biznes uchun</p><h2 id="bz-h">Kompaniya kabineti: avtopark, tenderlar, muddatli to‘lov</h2>
<p class="sub">Logistlar, quruvchilar va hokimliklar uchun: o‘z avtoparki, hujjatlar, servis muddatlari, tender va auksionda ishtirok, muddatli to‘lov arizalari bir joyda.</p></div>
<div class="bz-c rv"><p class="bz-h"><b>Korporativ kabinet</b><span>Avtopark · Tenderlar · Auksion · Muddatli to‘lov</span></p>
<ul>${[["ISUZU FVR34K · samosval", "Servis: 12 kun", "ok"], ["ISUZU NPR82L · refrijerator", "Servis: 3 kun", "warn"], ["SAZ LE60 · avtobus", "Kafolatda", "ok"], ["Tender: 20 ta avtobus", "Ariza yuborildi", ""]].map(([a, b, c]) => `<li><span>${a}</span><em class="${c}">${b}</em></li>`).join("")}</ul>
<p class="demo">Namoyish uchun demo ma’lumotlar.</p></div></div></section>`;
}

export function cityBlock(IMG) {
  const bus = CAT.items.filter((i) => i.cat === "avtobus");
  const card = (img, alt, h, p, list) => `<article class="ct rv"><picture><source media="(max-width: 767px)" srcset="${IMG}/s/${img}-900.webp"><img src="${IMG}/s/${img}-1600.webp" alt="${alt}" loading="lazy" decoding="async"></picture><h3>${h}</h3><p>${p}</p>${list}</article>`;
  return `<section class="cy" id="shahar" aria-labelledby="cy-h"><div class="wrap">
<div class="sh rv"><p class="kick">Avtobuslar va maxsus texnika</p><h2 id="cy-h">Har kuni shahringizda ko‘rinadigan texnika</h2></div>
<div class="cy-g">
${card("bus", "SAZ LE60 avtobusi kechqurun Registon yonida, ho‘l asfalt", "SAZ avtobuslari", "Birinchi mahalliy past polli avtobus LE60 2012-yildan beri konveyerda: bekatda kuzov pastga tushadi, pandus, Evro-5.", `<ul class="ct-l">${bus.map((b) => `<li><b>${esc(b.title.replace(/^Avtobus /, ""))}</b><span>${b.seats} yo‘lovchi · ${hp(b.power)} o.k.${/CNG/.test(b.title) ? " · gaz" : ""}</span></li>`).join("")}</ul>`)}
${card("water", "ISUZU suv tashuvchi Toshkent ko‘chasini sug‘ormoqda", "Maxsus texnika", "Suv tashuvchilar, yoqilg‘i tashuvchilar, sug‘orish-yuvish mashinalari, 18 va 22 metrli avtominoralar, avariya-qutqaruv mashinalari. Hokimliklar va kommunal xizmatlar uchun.", `<ul class="ct-l">${[...new Set(CAT.items.filter((i) => i.cat === "maxsus").map((i) => i.body))].filter(Boolean).map((b) => `<li><b>${b}</b><span>${CAT.items.filter((i) => i.cat === "maxsus" && i.body === b).length} ta model</span></li>`).join("")}</ul>`)}
</div></div></section>`;
}

export function dealerBlock(IMG, ic) {
  const uz = CAT.dealers.filter((d) => d.country === "O‘zbekiston");
  const regions = [...new Set(uz.map((d) => d.region))];
  const abroad = CAT.dealers.filter((d) => d.country !== "O‘zbekiston");
  return `<section class="dl" id="dilerlar" aria-labelledby="dl-h"><div class="wrap">
<div class="sh rv"><p class="kick">Dilerlar va servis</p><h2 id="dl-h">Eng yaqin diler va servisga yozilish bir daqiqada</h2></div>
<div class="dl-g">
<div class="dl-m rv"><div class="dl-mh"><b>${uz.length} ta diler O‘zbekistonda</b><button type="button" class="btn btn-line btn-s" id="dl-geo">${ic("pin")}<span>Eng yaqinini topish</span></button></div>
<div class="dl-map" id="dl-map" role="list" aria-label="Dilerlar xaritasi"></div>
<p class="dl-ab">Xorijda ham ${abroad.length} ta diler: ${[...new Set(abroad.map((d) => d.country))].join(", ")}.</p>
<p class="note">Yandex xaritalari (3 MB) o‘rniga yengil o‘z xaritamiz: manzil, telefon va yo‘nalish.</p></div>
<div class="dl-r rv"><label class="dl-f"><span>Viloyat</span><select id="dl-reg"><option value="">Barcha viloyatlar</option>${regions.map((r) => `<option>${r}</option>`).join("")}</select></label>
<ul class="dl-l" id="dl-l"></ul></div>
</div>
<div class="sv rv"><picture><source media="(max-width: 767px)" srcset="${IMG}/s/service-900.webp"><img src="${IMG}/s/service-1600.webp" alt="ISUZU yuk mashinasi servisda, kabina ko‘tarilgan, usta diagnostika qilmoqda" loading="lazy" decoding="async"></picture>
<form class="sv-f" id="sv-f"><p class="h3">Servisga yozilish</p>
<label><span>Model</span><select name="model">${[...new Set(CAT.items.map((i) => i.chassis).filter(Boolean))].map((c) => `<option>${/^(LE60|HD50|HC45)$/.test(c) ? "SAZ" : "ISUZU"} ${c}</option>`).join("")}</select></label>
<label><span>Xizmat</span><select name="xizmat"><option>Rejali texnik xizmat</option><option>Ta’mirlash</option><option>Kafolat bo‘yicha</option><option>Ehtiyot jihozlar</option></select></label>
<label><span>Diler</span><select name="diler" id="sv-d">${uz.map((d) => `<option>${esc(d.name)}, ${d.region}</option>`).join("")}</select></label>
<label><span>Sana</span><input type="date" name="sana" required></label>
<button type="submit" class="btn btn-red">Yozilish</button></form></div>
</div></section>`;
}

export function worldBlock(IMG) {
  const W = [["D-MAX klubi", "egalarining sayohatlari, 2025-yilda Qirg‘izistonga"], ["D-MAX quest", "televizor va YouTube’dagi sayohat-kvest va shou"], ["Automechanic CV", "mexaniklar musobaqasi, 13 yildan beri"], ["Aral Tour", "Orol dengiziga ekspeditsiya"]];
  return `<section class="wd" id="dunyo" aria-labelledby="wd-h">
<picture class="wd-bg" aria-hidden="true"><source media="(max-width: 767px)" srcset="${IMG}/s/club-900.webp"><img src="${IMG}/s/club-1600.webp" alt="" loading="lazy" decoding="async"></picture>
<div class="wrap wd-t"><p class="kick">SamAuto dunyosi</p><h2 id="wd-h">Mashina atrofidagi odamlar har qanday reklamadan kuchli</h2>
<ul class="wd-l">${W.map(([h, p], i) => `<li class="rv"><i class="rl" aria-hidden="true" style="--d:${i * 0.5}s"></i><b>${h}</b><span>${p}</span></li>`).join("")}</ul></div></section>`;
}

export function factoryBlock(IMG) {
  return `<section class="fc" id="zavod" aria-labelledby="fc-h">
<picture class="fc-bg" aria-hidden="true"><source media="(max-width: 767px)" srcset="${IMG}/s/factory-900.webp"><img src="${IMG}/s/factory-1600.webp" alt="" loading="lazy" decoding="async"></picture>
<div class="wrap fc-t rv"><p class="kick">Mahalliylashtirish va zavod</p><h2 id="fc-h">Samarqandda ishlab chiqarilgan</h2>
<p class="sub">Avtobus va yuk mashinalari qanday yig‘iladi, joyida nima ishlab chiqariladi, qanday qilib yetkazib beruvchi bo‘lish mumkin: mahalliylashtirish, hamkorlik, karyera. SamAuto endi Anadolu ISUZU tarkibida.</p>
<ul class="fc-l">${["Mahalliylashtirish", "Kafolat", "Ehtiyot jihozlar", "Karyera"].map((t) => `<li>${t}</li>`).join("")}</ul></div></section>`;
}

/* Окно «ариза»: прототип не отправляет форму ни им, ни нам — собирает текст
   и открывает их телефон или Telegram-бота (proto-master, §4). */
export function arizaView(B, ic) {
  return `<div class="az" id="az" role="dialog" aria-modal="true" aria-labelledby="az-h" hidden><div class="az-c">
<button type="button" class="fv-x az-x" id="az-x" aria-label="Yopish">${ic("x")}</button>
<p class="kick">Ariza</p><p class="h2" id="az-h">Arizangiz tayyor</p>
<pre class="az-m" id="az-m"></pre>
<div class="az-b"><a class="btn btn-red" href="${B.tel}">${ic("phone")}<span>Qo‘ng‘iroq qilish</span></a><a class="btn btn-line" href="${B.bot}" target="_blank" rel="noopener">${ic("tg")}<span>Telegram’da yozish</span></a><button type="button" class="btn btn-line" id="az-cp">Matnni nusxalash</button></div>
<p class="note">Maket: tayyor saytda ariza tanlangan model va diler bilan darhol dilerning CRM tizimiga tushadi.</p>
</div></div>`;
}
