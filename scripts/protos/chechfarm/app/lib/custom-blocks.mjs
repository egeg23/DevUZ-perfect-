/* Свои блоки страницы из панели (владелец DevUz, 19.11.2026: «такой же
   раздел управления сайтом как у стоматологии… полное управление сайтом
   внутри»): как «Добавить свой блок» у «Сияния Севера». Подзаголовок,
   заголовок, текст (строка — абзац, «- » — список), до 8 фото с подписью
   (только загруженные через панель), фото рядом, сеткой или без, кнопка
   «Связаться», тёмный фон, пункт меню. Тексты — на каждый язык, пустое поле
   берёт русский. Блок встаёт в конец страницы, двигается и прячется теми же
   «↑ ↓» и «Показывать», что встроенные (site-text.mjs). Всё экранируется. */
import { randomBytes } from "node:crypto";
import { UPLOADED } from "./site-text.mjs";

export const CB_MAX = 12, CB_PHOTOS = 8;
export const CB_LANGS = ["ru", "uz", "en", "ar"];
export const LAYOUTS = ["side", "grid", "none"];
const FIELDS = { sub: 80, title: 160, text: 4000, btn: 40 };
const cut = (s, n) => String(s ?? "").replace(/\r/g, "").trim().slice(0, n);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const isId = (x) => /^cb-[0-9a-f]{6}$/.test(String(x || ""));

/* Приводит присланное панелью к виду, который можно хранить и рисовать. */
export function cleanBlocks(list) {
  if (!Array.isArray(list)) throw new Error("Нет списка блоков");
  if (list.length > CB_MAX) throw new Error(`Своих блоков на странице — не больше ${CB_MAX}`);
  const seen = new Set();
  return list.map((b) => {
    let id = isId(b?.id) ? b.id : "";
    if (!id || seen.has(id)) do id = "cb-" + randomBytes(3).toString("hex"); while (seen.has(id));
    seen.add(id);
    const t = {};
    for (const l of CB_LANGS) {
      const src = b?.t?.[l] || {}, one = {};
      for (const [k, n] of Object.entries(FIELDS)) { const v = k === "text" ? cut(src[k], n) : cut(src[k], n).replace(/\s+/g, " "); if (v) one[k] = v; }
      if (Object.keys(one).length) t[l] = one;
    }
    const photos = (Array.isArray(b?.photos) ? b.photos : []).filter((p) => UPLOADED.test(String(p?.src || ""))).slice(0, CB_PHOTOS).map((p) => {
      const cap = {}; for (const l of CB_LANGS) { const v = cut(p?.cap?.[l], 140).replace(/\s+/g, " "); if (v) cap[l] = v; }
      return { src: p.src, cap };
    });
    if (!t.ru?.title && !t.ru?.text && !photos.length) throw new Error("У своего блока нужен заголовок или текст на русском, или фото");
    /* Какие языки переведены автоматически (translate.mjs): true — перевод, false — поправили руками. */
    const auto = Object.fromEntries(CB_LANGS.filter((l) => typeof b?.auto?.[l] === "boolean").map((l) => [l, b.auto[l]]));
    return { id, t, photos, layout: LAYOUTS.includes(b?.layout) ? b.layout : "side", btn: !!b?.btn, dark: !!b?.dark, menu: !!b?.menu, ...(Object.keys(auto).length ? { auto } : {}) };
  });
}

const pick = (b, lang, k) => b.t?.[lang]?.[k] || b.t?.ru?.[k] || "";
const BTN = { ru: "Связаться", uz: "Bog‘lanish", en: "Get in touch", ar: "تواصل معنا" };
export const titleOf = (b, lang = "ru") => pick(b, lang, "title") || pick(b, lang, "sub") || "Свой блок";

function textHtml(s) {
  const out = []; let list = [];
  const flush = () => { if (list.length) out.push(`<ul>${list.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`); list = []; };
  for (const line of String(s).split("\n").map((x) => x.trim())) {
    if (/^[-–•]\s+/.test(line)) { list.push(line.replace(/^[-–•]\s+/, "")); continue; }
    flush(); if (line) out.push(`<p>${esc(line)}</p>`);
  }
  flush(); return out.join("");
}

export function renderBlock(b, lang) {
  const sub = pick(b, lang, "sub"), title = pick(b, lang, "title"), text = pick(b, lang, "text");
  const photos = b.layout === "none" ? [] : b.photos;
  const home = lang === "ru" ? "" : "/" + lang;
  const tx = `<div class="cfx-tx">${sub || title ? `<div class="sec-h">${sub ? `<p class="kicker">${esc(sub)}</p>` : ""}${title ? `<h2 class="h2">${esc(title)}</h2>` : ""}</div>` : ""}${text ? textHtml(text) : ""}${b.btn ? `<p><a class="btn btn-pri" href="${home}/contacts#form"><span>${esc(pick(b, lang, "btn") || BTN[lang] || BTN.ru)}</span></a></p>` : ""}</div>`;
  const ph = photos.length ? `<div class="cfx-ph">${photos.map((p) => { const cap = p.cap?.[lang] || p.cap?.ru || ""; return `<figure><img src="${esc(p.src)}" alt="${esc(cap || title)}" loading="lazy" decoding="async">${cap ? `<figcaption>${esc(cap)}</figcaption>` : ""}</figure>`; }).join("")}</div>` : "";
  const lay = photos.length ? b.layout : "none";
  return `<section class="sec cfx ${lay}${b.dark ? " dark" : ""}" id="${b.id}"><div class="wrap cfx-in">${tx}${ph}</div></section>`;
}

const CSS = `<style id="cfx-css">.cfx-in{display:grid;gap:clamp(24px,4vw,56px);align-items:center}.cfx.side .cfx-in{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.cfx .sec-h{margin-bottom:20px}.cfx-tx p,.cfx-tx li{color:var(--ink2);font-size:17px;max-width:62ch}.cfx.dark .cfx-tx p,.cfx.dark .cfx-tx li{color:rgb(229 244 240 / .8)}.cfx-tx ul{padding-inline-start:20px;display:grid;gap:6px}.cfx-tx .btn{margin-top:12px}.cfx-ph{display:grid;gap:14px}.cfx.side .cfx-ph{grid-template-columns:repeat(auto-fit,minmax(160px,1fr))}.cfx.grid .cfx-ph{grid-template-columns:repeat(auto-fill,minmax(240px,1fr))}.cfx-ph figure{margin:0;display:grid;gap:8px}.cfx-ph img{display:block;width:100%;height:auto;aspect-ratio:4/3;object-fit:cover;border-radius:var(--r);box-shadow:var(--sh1)}.cfx-ph figcaption{font-size:14px;color:var(--ink3)}.cfx.dark .cfx-ph figcaption{color:rgb(229 244 240 / .6)}@media (max-width:860px){.cfx.side .cfx-in{grid-template-columns:1fr}}</style>`;

/* Кладёт свои блоки в конец <main>, стили — в <head>, пункты меню — в меню. */
export function addCustom(html, blocks, lang) {
  if (!blocks?.length) return html;
  const end = html.lastIndexOf("</main>");
  if (end < 0) return html;
  html = html.slice(0, end) + blocks.map((b) => renderBlock(b, lang)).join("\n") + html.slice(end);
  const menu = blocks.filter((b) => b.menu).map((b) => `<a href="#${b.id}">${esc(titleOf(b, lang))}</a>`).join("");
  if (menu) html = html.replace(/(<nav class="nav"[^>]*>[\s\S]*?)(<\/nav>)/, `$1${menu}$2`).replace(/(<nav class="mn-list"[^>]*>[\s\S]*?)(<\/nav>)/, `$1${menu}$2`);
  return html.replace("</head>", CSS + "</head>");
}
