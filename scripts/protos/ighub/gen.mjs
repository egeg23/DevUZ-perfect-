import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import * as D from "./data.mjs";
import * as P from "./plan.mjs";
import { dzIntroSolo } from "../../../lib/proto/dz-video.mjs";

/*
 * Прототип хаба Instagram → Telegram. На ПК рядом два телефона: слева
 * Instagram клиента, справа Telegram менеджера, между ними путь заявки. На
 * телефоне один телефон и переключатель «Клиент / Менеджер». Ниже: чего нет в
 * обычном хабе, три схемы, подключение, стоимость.
 *
 * Две страницы: русская (главная) и узбекская (`uz`, латиница). В каждую
 * кладутся тексты только её языка. Стили и скрипт общие, в странице вместо
 * них @@S@@ и @@J@@. Ссылки через __PROTO_BASE__, отпечаток ставится при
 * показе зерном из protos.stamp (lib/proto/bundles).
 */

const DIR = new URL(".", import.meta.url).pathname;
const CSS = readFileSync(DIR + "style.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\n\s*/g, "");
const JS = readFileSync(DIR + "app.js", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const BASE = "__PROTO_BASE__";
const TERMS = (l) => `https://devuz.studio/${l}/mockup-terms`;
const TG = "https://t.me/Devuz_studio_bot?start=ighub";

/* Пара T(ru, uz) → строка нужного языка, рекурсивно. */
function pick(v, l) {
  if (Array.isArray(v)) return v.map((x) => pick(x, l));
  if (v && typeof v === "object") {
    if (v.__l) return v[l];
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, pick(x, l)]));
  }
  return v;
}
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const usd = (n) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} $`;

/* Линейные иконки 24×24, штрих цветом текста. */
const S = 'fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"';
const I = {
  heart: `<path d="M12 20s-7.5-4.5-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.5-7.5 10-7.5 10z" ${S}/>`,
  chat: `<path d="M20 11.5a8 8 0 0 1-11.6 7.2L4 20l1.3-4.2A8 8 0 1 1 20 11.5z" ${S}/>`,
  send: `<path d="M21 3 10 14M21 3l-6.5 18-4.5-7-7-4.5z" ${S}/>`,
  save: `<path d="M6.5 4h11v16.5L12 16.8l-5.5 3.7z" ${S}/>`,
  back: `<path d="m15 5-7 7 7 7" ${S}/>`,
  chev: `<path d="m9 5 7 7-7 7" ${S}/>`,
  search: `<circle cx="11" cy="11" r="6.5" ${S}/><path d="m20 20-4.2-4.2" ${S}/>`,
  cam: `<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6L16.5 7h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" ${S}/><circle cx="12" cy="12.5" r="3.3" ${S}/>`,
  mic: `<rect x="9" y="3.5" width="6" height="11" rx="3" ${S}/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" ${S}/>`,
  clip: `<path d="m20 11.5-8.2 8.2a5 5 0 0 1-7.1-7.1l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4L15 7" ${S}/>`,
  img: `<rect x="3.5" y="4.5" width="17" height="15" rx="2.5" ${S}/><circle cx="9" cy="10" r="1.8" ${S}/><path d="m4 18 5-5 4 4 2.5-2.5L20 19" ${S}/>`,
  bolt: `<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z" ${S}/>`,
  menu: `<path d="M4 7h16M4 12h16M4 17h16" ${S}/>`,
  dots: `<circle cx="12" cy="5.5" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="18.5" r="1.3" fill="currentColor"/>`,
  play: `<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>`,
  pause: `<path d="M8 5.5h3v13H8zM13 5.5h3v13h-3z" fill="currentColor"/>`,
  reset: `<path d="M4.5 12A7.5 7.5 0 1 0 7 6.4M4.5 4v4.5H9" ${S}/>`,
  clock: `<circle cx="12" cy="12" r="8" ${S}/><path d="M12 7.5V12l3 2" ${S}/>`,
  check: `<path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  ig: `<rect x="3.5" y="3.5" width="17" height="17" rx="5" ${S}/><circle cx="12" cy="12" r="4" ${S}/><circle cx="17" cy="7" r=".6" fill="currentColor"/>`,
  tg: `<path d="M21 4 2.8 11.2c-.9.4-.9 1.6.1 1.9l4.6 1.4 1.8 5.5c.2.7 1.1.9 1.6.4l2.6-2.4 4.6 3.4c.6.4 1.4.1 1.6-.6L22.2 5.3c.2-.9-.6-1.6-1.2-1.3zM8 14.3l9.5-6.2-7.2 7.4" ${S}/>`,
  meta: `<path d="M3 15c0-4 2-8 4.5-8 3.5 0 5.5 10 9 10 2 0 3.5-2 3.5-5s-1.5-5-3.5-5c-3.5 0-5.5 10-9 10C5 17 3 16.5 3 15z" ${S}/>`,
  users: `<circle cx="9" cy="8.5" r="3.3" ${S}/><path d="M3 19.5c1-3.2 3.3-5 6-5s5 1.8 6 5M15.5 5.3a3.3 3.3 0 0 1 0 6.4M17.5 14.6c1.8.6 3 2.3 3.5 4.9" ${S}/>`,
  chart: `<path d="M5 20V11M10 20V5M15 20v-6M20 20V9" ${S}/>`,
  globe: `<circle cx="12" cy="12" r="8.5" ${S}/><path d="M3.5 12h17M12 3.5c2.3 2.4 3.5 5.2 3.5 8.5s-1.2 6.1-3.5 8.5c-2.3-2.4-3.5-5.2-3.5-8.5s1.2-6.1 3.5-8.5z" ${S}/>`,
  bell: `<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0" ${S}/>`,
  pin: `<path d="M9 4h6l-1 5 3 3v2H7v-2l3-3zM12 14v6" ${S}/>`,
  home: `<path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" ${S}/>`,
  reel: `<rect x="3.5" y="3.5" width="17" height="17" rx="4" ${S}/><path d="M3.5 8.5h17M8 3.5l2.5 5M13.5 3.5l2.5 5M10.5 12v5l4-2.5z" ${S}/>`,
  plus: `<path d="M12 5v14M5 12h14" ${S}/>`,
  user: `<circle cx="12" cy="8.5" r="3.8" ${S}/><path d="M4.5 20c1.4-3.6 4.2-5.5 7.5-5.5s6.1 1.9 7.5 5.5" ${S}/>`,
  smile: `<circle cx="12" cy="12" r="8.5" ${S}/><path d="M8.5 14c.8 1.3 2 2 3.5 2s2.7-.7 3.5-2M9 9.5h.01M15 9.5h.01" ${S}/>`,
};
const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="g-ig" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#f9a23b"/><stop offset=".5" stop-color="#e23b6d"/><stop offset="1" stop-color="#7a3cf0"/></linearGradient>${Object.entries(I)
  .map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24">${v}</symbol>`)
  .join("")}</defs></svg>`;
const ic = (k, c = "ic") => `<svg class="${c}" aria-hidden="true"><use href="#i-${k}"/></svg>`;

const STATUS = (c) => `<div class="status ${c}" aria-hidden="true"><span>9:41</span><span><svg viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg><svg viewBox="0 0 27 13"><rect x=".5" y=".5" width="23" height="12" rx="3.6" fill="none" stroke="currentColor" stroke-opacity=".4"/><rect x="2" y="2" width="18" height="9" rx="2.2" fill="currentColor"/><path d="M25 4.4v4.2c.8-.3 1.4-1.1 1.4-2.1s-.6-1.8-1.4-2.1Z" fill="currentColor" fill-opacity=".45"/></svg></span></div>`;

function page(l) {
  const t = (ru, uz) => (l === "ru" ? ru : uz);
  const ui = pick(D.UI, l);
  const missing = [...new Set([...JS.matchAll(/\bU\.(\w+)/g)].map((m) => m[1]))].filter((k) => !(k in ui));
  if (missing.length) throw new Error(`нет подписей: ${missing.join(", ")}`);
  const langs = D.CLIENT_LANGS[l];
  const data = {
    lang: l, ui, company: pick(D.COMPANY, l), client: D.CLIENT, langs,
    langName: Object.fromEntries(langs.map((k) => [k, pick(D.LANG_NAME[k], l)])),
    ask: Object.fromEntries(langs.map((k) => [k, D.ASK[k]])),
    creply: Object.fromEntries(langs.map((k) => [k, D.CLIENT_REPLY[k]])),
    manual: Object.fromEntries(langs.map((k) => [k, D.MANUAL[k]])),
    quick: D.QUICK.map((q) => ({ id: q.id, title: pick(q.title, l), ...Object.fromEntries(langs.map((k) => [k, q[k]])) })),
    managers: pick(D.MANAGERS, l), head: pick(D.HEAD, l), ads: pick(D.ADS, l), noAd: D.NO_AD, others: pick(D.OTHERS, l), crms: D.CRMS,
    plan: { base: { price: P.BASE.price, promo: P.BASE.promo }, hours: P.OFFER_HOURS },
  };

  const steps = [1, 2, 3, 4, 5].map((n) => `<li data-step="${n}"><i>${n}</i><div><b>${ui["s" + n]}</b><span>${ui["s" + n + "d"]}</span></div></li>`).join("");
  const feats = [
    ["f1", "img", "ad"], ["f2", "bell", "ff10"], ["f3", "clock", "ff22"], ["f4", "chart", "head"], ["f5", "globe", "lang"], ["f6", "search", "search"],
  ].map(([k, i, a]) => `<article class="feat rv"><span class="feat-i">${ic(i)}</span><h3>${ui[k]}</h3><p>${ui[k + "d"]}</p><button class="lnk" data-act="feat" data-a="${a}">${ui.show} ${ic("chev", "ic s")}</button></article>`).join("");
  const scheme = (k, best) => `<article class="sch rv${best ? " best" : ""}">${best ? `<span class="tag">${ui.advise}</span>` : ""}<h3><i>${t({ A: "А", B: "Б", C: "В" }[k], { A: "A", B: "B", C: "V" }[k])}</i>${ui[k.toLowerCase() + "T"]}</h3><p>${ui[k.toLowerCase() + "D"]}</p><div class="pc"><div><b>${ui.pros}</b><ul>${ui[k.toLowerCase() + "P"].map((x) => `<li class="p">${x}</li>`).join("")}</ul></div><div><b>${ui.cons}</b><ul>${ui[k.toLowerCase() + "C"].map((x) => `<li class="c">${x}</li>`).join("")}</ul></div></div><button class="btn ghost" data-act="scheme" data-a="${k}">${ui.showScheme}</button></article>`;
  const con = [["c1", "ig"], ["c2", "meta"], ["c3", "tg"], ["c4", "check"]].map(([k, i], n) => `<li data-con="${n}"><button data-act="con" data-a="${n}"><span class="con-i">${ic(i)}</span><b>${ui[k]}</b></button><p>${ui[k + "d"]}</p></li>`).join("");
  const addons = P.ADDONS.map((a) => `<label class="add"><input type="checkbox" data-add="${a.id}" data-price="${a.price}"><span class="sw" aria-hidden="true"></span><span class="add-t"><b>${a[l].t}${a.star ? ` <em>${ui.popular}</em>` : ""}</b><small>${a[l].e}</small></span><span class="add-p">+${usd(a.price)}</span></label>`).join("");

  return `<!doctype html><html lang="${l}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#f3f1ec"><title>${t("Хаб Instagram → Telegram · прототип", "Instagram → Telegram xabi · prototip")}</title><meta name="description" content="${esc(ui.lead)}"><link rel="preload" href="/protos/intalim/onest-${l === "ru" ? "cyr" : "latx"}.woff2" as="font" type="font/woff2" crossorigin>@@S@@</head><body>
${dzIntroSolo(l)}
<header class="top" id="top"><a class="brand" href="${l === "ru" ? BASE : BASE + "/uz"}"><span class="logo" aria-hidden="true">${ic("ig", "ic a")}${ic("tg", "ic b")}</span><span><b>${t("Хаб Instagram → Telegram", "Instagram → Telegram xabi")}</b><small>${ui.brandSub}</small></span></a>
<nav class="nav"><a href="#path">${ui.navPath}</a><a href="#schemes">${ui.navSchemes}</a><a href="#connect">${ui.navConnect}</a><a href="#price">${ui.navPrice}</a></nav>
<div class="langs"><a href="${BASE}"${l === "ru" ? ' aria-current="page"' : ""}>RU</a><a href="${BASE}/uz"${l === "uz" ? ' aria-current="page"' : ""}>UZ</a></div></header>
<main>
<section class="hero" id="path">
<div class="hero-t"><p class="eyebrow">${esc(D.COMPANY.name)} · ${pick(D.COMPANY.niche, l)} · ${t("демо", "demo")}</p><h1>${ui.h1}</h1><p class="lead">${ui.lead}</p></div>
<div class="ctrl">
<div class="seg" role="group" aria-label="${ui.scheme}"><span class="seg-l">${ui.scheme}</span><button data-act="scheme" data-a="A">${ui.schA}</button><button data-act="scheme" data-a="B">${ui.schB} <em>${ui.advise}</em></button><button data-act="scheme" data-a="C">${ui.schC}</button></div>
<div class="seg" role="group" aria-label="${ui.role}"><span class="seg-l">${ui.role}</span><button data-act="role" data-a="mgr">${ui.roleMgr}</button><button data-act="role" data-a="head">${ui.roleHead}</button></div>
</div>
<div class="side-sw" role="tablist"><button data-act="side" data-a="ig" role="tab">${ic("ig")}${ui.sideClient}<span class="dot"></span></button><button data-act="side" data-a="tg" role="tab">${ic("tg")}${ui.sideMgr}<span class="dot"></span></button></div>
<p class="now-m" id="nowm" aria-hidden="true"></p>
<div class="stage" id="stage" data-side="ig">
<figure class="ph ph-ig"><figcaption>${ic("ig")}${ui.phoneIg}</figcaption><div class="dev"><div class="iphone"><div class="bezel"><div class="screen"><div class="app ig" id="ig"></div>${STATUS("dark")}<span class="island" aria-hidden="true"></span><span class="home-bar" aria-hidden="true"></span></div></div></div></div></figure>
<div class="path"><div class="path-h"><b>${ui.pathTitle}</b><button class="btn sm" data-act="play" id="play">${ic("play")}<span>${ui.play}</span></button><button class="btn sm ghost" data-act="reset" title="${ui.again}">${ic("reset")}<span>${ui.again}</span></button></div>
<ol class="steps" id="steps">${steps}</ol>
<p class="now" id="now" aria-live="polite"></p>
<div class="ff"><b>${ui.ctl}</b><div><button class="chip" data-act="ff10">${ic("clock")}${ui.ff10}</button><button class="chip" data-act="ff22">${ic("clock")}${ui.ff22}</button><button class="chip" data-act="igManual">${ic("ig")}${ui.igManual}</button></div></div></div>
<figure class="ph ph-tg"><figcaption>${ic("tg")}<span id="tgcap">${ui.phoneTg}</span></figcaption><div class="dev"><div class="android"><div class="screen"><div class="app tg" id="tg"></div>${STATUS("light")}<span class="cam" aria-hidden="true"></span></div></div></div></figure>
</div>
</section>
<section class="sec" id="our"><h2 class="rv">${ui.ourT}</h2><p class="sec-p rv">${ui.ourP}</p><div class="feats">${feats}</div></section>
<section class="sec" id="schemes"><h2 class="rv">${ui.schT}</h2><p class="sec-p rv">${ui.schP}</p><div class="schs">${scheme("A")}${scheme("B", true)}${scheme("C")}</div><p class="why rv">${ui.whyB}</p></section>
<section class="sec" id="connect"><h2 class="rv">${ui.conT}</h2><p class="sec-p rv">${ui.conP}</p><ol class="con" id="con">${con}</ol><div class="con-ok" id="conok" hidden>${ic("check")}<b>${ui.conOk}</b></div>
<aside class="need rv"><h3>${ui.needT}</h3><ul>${ui.need.map((x) => `<li>${x}</li>`).join("")}</ul></aside></section>
<section class="sec" id="price"><h2 class="rv">${ui.priceT}</h2><p class="sec-p rv">${ui.priceP}</p>
<div class="price"><div class="pbase"><p class="offer" id="offer">${ic("clock")}<span>${ui.offer}</span> <b id="offt">48:00:00</b></p><h3>${P.BASE[l].t}</h3><p>${P.BASE[l].d}</p><p class="pp"><s id="preg">${usd(P.BASE.price)}</s><b id="pbase">${usd(P.BASE.promo)}</b><small>${ui.oneTime} · ${P.BASE.weeks.join("-")} ${ui.weeks}</small></p></div>
<div class="padds"><b>${ui.addons}</b>${addons}</div>
<div class="ptotal"><span>${ui.total}</span><b id="ptot">${usd(P.BASE.promo)}</b><a class="btn" href="${TG}">${ic("tg")}<span>${ui.discuss}</span></a></div></div></section>
</main>
<footer class="foot"><p>${ui.legalOwn} <a href="${TERMS(l)}" target="_blank" rel="noopener">${ui.terms}</a></p><p><a href="https://devuz.studio">devuz.studio</a> · <a href="${TG}">Telegram</a></p></footer>
${SPRITE}
<script>window.HB=${JSON.stringify(data).replace(/</g, "\\u003c")};</script>
@@J@@
</body></html>`;
}

const out = { "": page("ru"), uz: page("uz") };
const parts = { S: `<style>${CSS}</style>`, J: `<script>\n${JS}\n</script>` };

mkdirSync(DIR + "out", { recursive: true });
const fill = (v) => Object.entries(parts).reduce((p, [n, part]) => p.split(`@@${n}@@`).join(part), v);
writeFileSync(DIR + "out/pages.json", JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, fill(v)]))));
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
writeFileSync(bundleDir + "ighub.json", JSON.stringify({ parts, pages: out }));
for (const [k, v] of Object.entries(out)) console.log((k || "(ru)").padEnd(6), fill(v).length);
