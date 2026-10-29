/* Палитры сайта — те же пять, что в PDF «Цвета поярче» (28.10.2026), и
   прежний графит. Владелец, 29.10.2026: «Сделай прям на сайте переключения
   тумблерами по этим цветовым палитрам». Переключатель на сайте ставит
   <html data-pal="…">, CSS ниже меняет только переменные цвета: разметка,
   анимации и фото те же. Значения — из той же таблицы, что PDF (графит
   макета → цвет варианта). «4» — изумруд и золото, он и есть :root в
   site.css, здесь его нет. */

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(" ");

export const PALETTES = [
  { id: "1", name: "Белая клиника", note: "светлые блоки, бирюзовые кнопки",
    t: { ink: "#0b2b35", ink2: "#103642", ink3: "#164250", graphite: "#1d5060", ink0: "#092430",
      paper: "#f2f8f7", paper2: "#dcefeb", card: "#ffffff", paper3: "#bcd9d3",
      text: "#0b2b35", mute: "#4f6c72", "mute-d": "#9fc4c6",
      onyx: "#0a8f78", onyx2: "#46d6b1", "onyx-ink": "#ffffff", "acc-d": "#087a66", frost: "#9ad8ff", ours: "#0a8f78" } },
  { id: "2", name: "Северное сияние", note: "морской бирюзовый, зелёный свет",
    t: { ink: "#0b2b35", ink2: "#103642", ink3: "#164250", graphite: "#1d5060", ink0: "#092430",
      paper: "#f2f8f7", paper2: "#dcefeb", card: "#ffffff", paper3: "#bcd9d3",
      text: "#0b2b35", mute: "#4f6c72", "mute-d": "#9fc4c6",
      onyx: "#33d6a0", onyx2: "#8ff0cb", "onyx-ink": "#04261b", "acc-d": "#0a8a66", frost: "#9ad8ff", ours: "#0a8a66" } },
  { id: "3", name: "Морская свежесть", note: "тёмно-синий, коралловые кнопки",
    t: { ink: "#0f2547", ink2: "#163058", ink3: "#1d3c69", graphite: "#26497c", ink0: "#0c1f3d",
      paper: "#f4f7fc", paper2: "#e2ebf7", card: "#ffffff", paper3: "#c2d1e6",
      text: "#0f2547", mute: "#56667f", "mute-d": "#a9bad4",
      onyx: "#ff7a59", onyx2: "#ffb59f", "onyx-ink": "#2a0d04", "acc-d": "#d9482a", frost: "#7fd3ff", ours: "#1f6fb8" } },
  { id: "4", name: "Изумруд и золото", note: "так сейчас", t: null },
  { id: "5", name: "Тёплый янтарь", note: "графит с синевой, сочный янтарь",
    t: { ink: "#1e2b33", ink2: "#25343e", ink3: "#2d3e49", graphite: "#374a56", ink0: "#18232a",
      paper: "#fff8ec", paper2: "#fbecd3", card: "#ffffff", paper3: "#ecd6b2",
      text: "#1e2b33", mute: "#6b6358", "mute-d": "#b8c2c8",
      onyx: "#ffa928", onyx2: "#ffd08a", "onyx-ink": "#2a1600", "acc-d": "#c26a00", frost: "#9fe3d4", ours: "#1f8a73" } },
  { id: "6", name: "Графит и оникс", note: "как было вначале",
    t: { ink: "#0d0e0f", ink2: "#16181a", ink3: "#202326", graphite: "#2b2e31", ink0: "#0b0b0b",
      paper: "#efebe5", paper2: "#e5dfd6", card: "#f7f4ef", paper3: "#cfc8bd",
      text: "#141517", mute: "#67635d", "mute-d": "#a8a49d",
      onyx: "#c9965a", onyx2: "#e3bf86", "onyx-ink": "#1a1206", "acc-d": "#8a5a24", frost: "#a6d8ca", ours: "#2f7d6b" } },
];

/* Изумруд и золото — значения :root в site.css; нужны для образца в переключателе. */
export const BASE = { ink: "#0e3b33", paper: "#f7f4ea", onyx: "#e9b23c" };

function vars(t) {
  const v = Object.entries(t).map(([k, x]) => `--${k}:${x}`);
  v.push(`--ink-rgb:${hex(t.ink)}`, `--ink2-rgb:${hex(t.ink2)}`, `--paper-rgb:${hex(t.paper)}`, `--onyx-rgb:${hex(t.onyx)}`, `--frost-rgb:${hex(t.frost)}`,
    `--line:rgb(${hex(t.text)} / .12)`, `--line-d:rgb(${hex(t.paper)} / .14)`);
  return v.join(";");
}

/* Белая клиника: тёмные блоки становятся светлыми, как чистый кабинет; тёмным
   остаётся только пролёт по клинике и подвал. */
const LIGHT = (() => {
  const P = '[data-pal="1"]', T = '[data-tone="ink"]';
  const flip = `--paper:#0b2b35;--paper-rgb:11 43 53;--ink:#e6f4f1;--ink-rgb:230 244 241;--ink2:#ffffff;--ink2-rgb:255 255 255;--ink3:#f2f8f7;--graphite:#d3ebe6;--mute-d:#4f6c72;--onyx2:#0a8f78;--frost:#0a8f78;--line-d:rgb(11 43 53 / .12)`;
  return [
    `${P} ${T},${P} .price{${flip}}`,
    `${P} .price{background:#e6f4f1;color:#0b2b35}${P} .price-bg img{opacity:.1}`,
    `${P} .price .pr{background:rgb(255 255 255 / .85)}${P} .price .pr-star{background:#0b2b35;color:#f2f8f7}${P} .price .pr-star p{color:#9fc4c6}${P} .price .pr-star .kick{color:#46d6b1}`,
    `${P} .price .warn-in{background:#0b2b35;color:#f2f8f7;border-color:transparent}`,
    `${P} .ct,${P} .ct-plan{background:rgb(255 255 255 / .9)}${P} .cont-bg img{opacity:.14}`,
    `${P} ${T} .qz-p,${P} ${T} .bs p,${P} ${T} .ch-p{color:#36555c}${P} ${T} .vs-tg,${P} ${T} .qz-bar{background:rgb(11 43 53 / .07)}${P} ${T} .vs-bone{stroke:rgb(11 43 53 / .2)}`,
    `${P} ${T} .btn-ghost{background:#fff;border-color:rgb(11 43 53 / .22)}${P} .bs{background:#fff}`,
  ].join("\n");
})();

export function paletteCss() {
  return PALETTES.filter((p) => p.t).map((p) => `:root[data-pal="${p.id}"]{${vars(p.t)}}`).join("\n") + "\n" + LIGHT;
}

/* Образец палитры в переключателе: фон, светлый фон, кнопка. */
export const swatch = (p) => (p.t ? [p.t.ink, p.t.paper, p.t.onyx] : [BASE.ink, BASE.paper, BASE.onyx]);
