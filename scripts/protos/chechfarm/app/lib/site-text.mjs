/* Тексты страниц сайта из панели (владелец DevUz, 12.11.2026: «управление
   через дашборд всеми разделами на их сайте»). Страница собрана заранее
   (gen.mjs), здесь она разбирается на блоки и тексты: панель показывает
   каждый текст блока, человек пишет свой, сервер подставляет его при отдаче.

   Ключ текста — отпечаток исходной строки: правка привязана к тому, что
   написано в сборке. Поменялся исходный текст в новой версии сайта — старая
   правка просто перестаёт применяться (панель покажет её как «устарела»).
   Правка всегда экранируется: разметку из панели на сайт не пропускаем. */
import { createHash } from "node:crypto";

export const hashOf = (s) => createHash("sha1").update(String(s)).digest("hex").slice(0, 12);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const unesc = (s) => String(s).replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");

/* Названия блоков в панели: по id секции. Нет в списке — первый заголовок блока. */
export const BLOCK_NAMES = {
  hero: "Первый экран и сцена", launch: "Путь вашего бренда", compare: "Сам или с CZECHFARM", mission: "Миссия", formula: "Формула бренда",
  model: "Как работает модель", audience: "Аудитории", portfolio: "Продукты (анонс)", contact: "Обращение", purpose: "Цель и миссия",
  role: "Роль компании", globe: "Маршрут партнёра", steps: "Шаги запуска", form: "Форма обращения", thesis: "Инвестиционное позиционирование",
  blocks: "Семь шагов в стекле", materials: "Материалы инвестору", "catalog-sec": "Каталог", acc: "Кабинет", chrome: "Шапка, меню и подвал", data: "Подписи, подсказки и сообщения",
};
/* Эти блоки скрыть нельзя: без них страница не работает. */
export const KEEP = new Set(["hero", "acc", "catalog-sec", "chrome", "data"]);

const RAW = /<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>|<title>[\s\S]*?<\/title>|<!--[\s\S]*?-->/g;
const worth = (t) => t.length >= 2 && t.length <= 1200 && /\p{L}{2}/u.test(t) && !/^[A-Z]{2,3}$/.test(t);

/* Проходит по тексту между тегами (вне скриптов, стилей и значков). */
function eachText(html, fn) {
  let out = "", last = 0;
  const walk = (chunk) => chunk.replace(/>([^<>]+)</g, (m, raw) => {
    const t = raw.trim();
    if (!worth(unesc(t))) return m;
    const next = fn(unesc(t).replace(/\s+/g, " "));
    if (next == null) return m;
    return ">" + raw.match(/^\s*/)[0] + esc(next) + raw.match(/\s*$/)[0] + "<";
  });
  for (const m of html.matchAll(RAW)) { out += walk(html.slice(last, m.index)) + m[0]; last = m.index + m[0].length; }
  return out + walk(html.slice(last));
}

/* Данные скрипта страницы (подписи, которые ставит JS): строки со словами. */
const DATA = /(<script type="application\/json" id="cf-data">)([\s\S]*?)(<\/script>)/;
const SKIP_KEYS = new Set(["lang", "page", "base", "img", "panel", "live", "scene", "id", "h", "to", "href", "k", "ic"]);
const dataWorth = (s) => worth(s) && !/^(\/|https?:|#|[a-z0-9_.-]+$)/i.test(s) && (/\s/.test(s) || /[^\u0000-\u007f]/.test(s));
function walkData(v, fn, key = "") {
  if (typeof v === "string") return !SKIP_KEYS.has(key) && dataWorth(v) ? (fn(v) ?? v) : v;
  if (Array.isArray(v)) return v.map((x) => walkData(x, fn, key));
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, SKIP_KEYS.has(k) ? x : walkData(x, fn, k)]));
  return v;
}

function split(html) {
  const a = html.indexOf("<main"), b = html.lastIndexOf("</main>");
  if (a < 0 || b < 0) return { chrome: html, parts: [] };
  const main = html.slice(a, b);
  const starts = [...main.matchAll(/<section\b[^>]*>/g)].map((m) => ({ at: m.index, id: (/\bid="([\w-]+)"/.exec(m[0]) || [])[1] || "" }));
  /* Секции бывают вложены: берём только те, что начинаются на верхнем уровне. */
  const parts = [];
  let depth = 0, cur = null;
  for (const m of main.matchAll(/<section\b[^>]*>|<\/section>/g)) {
    if (m[0] !== "</section>") { if (depth === 0) cur = { at: m.index, id: starts.find((s) => s.at === m.index).id }; depth++; }
    else { depth--; if (depth === 0 && cur) { parts.push({ id: cur.id || "s" + (parts.length + 1), named: !!cur.id, at: a + cur.at, end: a + m.index + 10, html: main.slice(cur.at, m.index + 10) }); cur = null; } }
  }
  return { chrome: html.slice(0, a) + html.slice(b), parts };
}

/* Картинки блока (владелец DevUz, 12.11.2026: замена картинок из панели —
   «Делаем»): свои файлы сайта, кроме кадров сцены. Ключ — отпечаток адреса с
   буквой i впереди, одна замена на все языки. Подставляется только файл,
   загруженный через панель. */
const IMG = /<img\b[^>]*>/g, SRC = /\ssrc="(\/protos\/chechfarm\/(?!seq\/|launch\/)[^"]+)"/;
export const imgKey = (src) => "i" + hashOf(src);
export const UPLOADED = /^\/uploads\/[0-9a-f]{32}\.(?:jpg|png|webp)$/;
function outside(html, fn) {
  let out = "", last = 0;
  for (const m of html.matchAll(RAW)) { out += fn(html.slice(last, m.index)) + m[0]; last = m.index + m[0].length; }
  return out + fn(html.slice(last));
}
export function applyImages(html, map) {
  if (!map || !Object.keys(map).some((k) => k[0] === "i")) return html;
  return outside(html, (chunk) => chunk.replace(IMG, (tag) => {
    const m = SRC.exec(tag), v = m && map[imgKey(m[1])];
    if (!v || !UPLOADED.test(v)) return tag;
    return tag.replace(SRC, ` src="${v}"`).replace(/\s(?:srcset|sizes|width|height)="[^"]*"/g, "");
  }));
}

/* Порядок блоков страницы (тот же день: «перестановка блоков»): первый блок
   остаётся первым, остальные встают в названном порядке, не названные — следом
   как в сборке. Разметка между блоками остаётся на месте. */
export function orderBlocks(html, order) {
  const want = (order || []).filter((x) => /^[\w-]+$/.test(x));
  if (!want.length) return html;
  const move = split(html).parts.slice(1);
  if (move.length < 2) return html;
  const by = new Map(move.map((p) => [p.id, p]));
  const seq = [...new Set(want)].filter((id) => by.has(id)).map((id) => by.get(id));
  for (const p of move) if (!seq.includes(p)) seq.push(p);
  if (seq.every((p, i) => p === move[i])) return html;
  let out = "", last = 0;
  move.forEach((slot, i) => { out += html.slice(last, slot.at) + seq[i].html; last = slot.end; });
  return out + html.slice(last);
}

/* Блоки страницы для панели: { id, name, canHide, canMove, texts: [{ h, def }], images: [{ h, src }] }. */
export function blocksOf(html) {
  const { chrome, parts } = split(html);
  const seen = new Set();
  const texts = (chunk) => { const list = []; eachText(chunk, (t) => { const h = hashOf(t); if (!seen.has(h)) { seen.add(h); list.push({ h, def: t }); } return null; }); return list; };
  const bar = texts(chrome.replace(DATA, ""));
  const images = (chunk) => { const list = []; outside(chunk, (c) => { for (const m of c.matchAll(IMG)) { const s = SRC.exec(m[0]); if (s && !seen.has(imgKey(s[1]))) { seen.add(imgKey(s[1])); list.push({ h: imgKey(s[1]), src: s[1] }); } } return c; }); return list; };
  const blocks = parts.map((p, i) => {
    const tx = texts(p.html), id = p.id;
    return { id, name: BLOCK_NAMES[id] || (tx[0] ? tx.slice(0, 2).map((x) => x.def).join(" ").slice(0, 60) : "Блок " + (i + 1)), canHide: p.named && !KEEP.has(id), canMove: i > 0 && parts.length > 2, texts: tx, images: images(p.html) };
  }).filter((b) => b.texts.length || b.images.length);
  const data = [];
  const m = DATA.exec(html);
  if (m) { try { walkData(JSON.parse(m[2]), (s) => { const h = hashOf(s); if (!seen.has(h)) { seen.add(h); data.push({ h, def: s }); } return null; }); } catch { /* данные не разобрались — без них */ } }
  if (data.length) blocks.push({ id: "data", name: BLOCK_NAMES.data, canHide: false, canMove: false, texts: data, images: [] });
  return { blocks, chrome: bar.length ? { id: "chrome", name: BLOCK_NAMES.chrome, canHide: false, canMove: false, texts: bar, images: [] } : null };
}

/* Подставляет правки: map — { отпечаток: текст }. */
export function applyTexts(html, map) {
  if (!map || !Object.keys(map).length) return html;
  const pick = (t) => { const v = map[hashOf(t)]; return v == null || v === "" ? null : v; };
  let out = eachText(html, pick);
  out = out.replace(DATA, (m, a, body, z) => {
    try { return a + JSON.stringify(walkData(JSON.parse(body), pick)).replace(/</g, "\\u003c") + z; } catch { return m; }
  });
  return out;
}

/* Скрытые блоки страницы: стилем в <head>, разметка остаётся. */
export function hideBlocks(html, ids) {
  const list = (ids || []).filter((x) => /^[\w-]+$/.test(x) && !KEEP.has(x));
  if (!list.length) return html;
  /* Ссылки меню на скрытый блок тоже прячем. */
  const css = list.map((x) => `#${x},a[href$="#${x}"]`).join(",") + "{display:none!important}";
  return html.replace("</head>", `<style>${css}</style></head>`);
}
