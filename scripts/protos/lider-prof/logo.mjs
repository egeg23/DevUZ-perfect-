// Логотип LIDER PROF PROEKT геометрией: широкие буквы одной толщины, как в
// их logo.png (186 × 48), «O» — скруглённый прямоугольник с косой чертой
// справа сверху. Единицы: высота буквы 100, толщина штриха 18. Вторая строка
// «PROEKT» — на 130 ниже. Каждая буква — свой путь (заставка выращивает их по
// очереди), заливка evenodd: внутренние просветы — вырезы в том же пути.
const S = 18;
const r = (x, y, w, h) => `M${x} ${y}h${w}v${h}h${-w}z`;

/** Скруглённый прямоугольник одним контуром. */
const rr = (x, y, w, h, q) => `M${x + q} ${y}H${x + w - q}A${q} ${q} 0 0 1 ${x + w} ${y + q}V${y + h - q}A${q} ${q} 0 0 1 ${x + w - q} ${y + h}H${x + q}A${q} ${q} 0 0 1 ${x} ${y + h - q}V${y + q}A${q} ${q} 0 0 1 ${x + q} ${y}Z`;

const G = {
  L: { w: 70, d: (x, y) => r(x, y, S, 100) + r(x + S, y + 82, 70 - S, S) },
  I: { w: S, d: (x, y) => r(x, y, S, 100) },
  D: {
    w: 88,
    d: (x, y) => {
      const W = 88, q = 44, k = q - S;
      return `M${x} ${y}H${x + W - q}A${q} ${q} 0 0 1 ${x + W} ${y + q}V${y + 100 - q}A${q} ${q} 0 0 1 ${x + W - q} ${y + 100}H${x}Z` +
        `M${x + S} ${y + S}H${x + W - q}A${k} ${k} 0 0 1 ${x + W - S} ${y + q}V${y + 100 - q}A${k} ${k} 0 0 1 ${x + W - q} ${y + 100 - S}H${x + S}Z`;
    },
  },
  E: { w: 72, d: (x, y) => r(x, y, S, 100) + r(x + S, y, 72 - S, S) + r(x + S, y + 41, 64 - S, S) + r(x + S, y + 82, 72 - S, S) },
  F: { w: 70, d: (x, y) => r(x, y, S, 100) + r(x + S, y, 70 - S, S) + r(x + S, y + 41, 62 - S, S) },
  T: { w: 80, d: (x, y) => r(x, y, 80, S) + r(x + 40 - S / 2, y + S, S, 100 - S) },
  P: {
    w: 78,
    d: (x, y) => {
      const W = 78, q = 30, k = q - S;
      return `M${x} ${y}H${x + W - q}A${q} ${q} 0 0 1 ${x + W} ${y + q}V${y + 32}A${q} ${q} 0 0 1 ${x + W - q} ${y + 62}H${x + S}V${y + 100}H${x}Z` +
        `M${x + S} ${y + S}H${x + W - q}A${k} ${k} 0 0 1 ${x + W - S} ${y + q}V${y + 32}A${k} ${k} 0 0 1 ${x + W - q} ${y + 44}H${x + S}Z`;
    },
  },
  R: {
    w: 82,
    d: (x, y) => {
      const W = 82, q = 30, k = q - S;
      return `M${x} ${y}H${x + W - q}A${q} ${q} 0 0 1 ${x + W} ${y + q}V${y + 32}A${q} ${q} 0 0 1 ${x + W - q} ${y + 62}H${x + S}V${y + 100}H${x}Z` +
        `M${x + S} ${y + S}H${x + W - q}A${k} ${k} 0 0 1 ${x + W - S} ${y + q}V${y + 32}A${k} ${k} 0 0 1 ${x + W - q} ${y + 44}H${x + S}Z` +
        `M${x + W - 50} ${y + 62}H${x + W - 29}L${x + W} ${y + 100}H${x + W - 21}Z`;
    },
  },
  K: {
    w: 82,
    d: (x, y) => `M${x} ${y}H${x + S}V${y + 41}L${x + 54} ${y}H${x + 80}L${x + 38} ${y + 46}L${x + 82} ${y + 100}H${x + 56}L${x + 26} ${y + 62}L${x + S} ${y + 70}V${y + 100}H${x}Z`,
  },
  O: {
    w: 100,
    d: (x, y) => rr(x, y, 100, 100, 38) + rr(x + S, y + S, 100 - 2 * S, 100 - 2 * S, 20),
    /** Просвет «O»: в него влетает камера заставки. */
    hole: (x, y) => rr(x + S, y + S, 100 - 2 * S, 100 - 2 * S, 20),
  },
  /** Косая черта «Ø», как у них: только по кольцу, в просвет не заходит. */
  slash: { w: 0, d: (x, y) => `M${x + 74} ${y - 14}H${x + 94}L${x + 72} ${y + 22}H${x + 52}Z` },
};

const GAP = 14, SPACE = 34, LINE2 = 130;

function line(text, y) {
  const parts = [];
  let x = 0;
  for (const ch of text) {
    if (ch === " ") { x += SPACE - GAP; continue; }
    const g = G[ch];
    parts.push({ ch, x, y, d: g.d(x, y), hole: g.hole ? g.hole(x, y) : null });
    if (ch === "O") parts.push({ ch: "/", x, y, d: G.slash.d(x, y), hole: null });
    x += g.w + GAP;
  }
  return { parts, width: x - GAP };
}

const l1 = line("LIDER PROF", 0);
const l2 = line("PROEKT", LINE2);
/** Вторая строка по левому краю, как у них. */
export const LOGO = {
  width: Math.max(l1.width, l2.width),
  height: LINE2 + 100,
  parts: [...l1.parts, ...l2.parts],
};
const o2 = l2.parts.find((p) => p.ch === "O");
/** Центр просвета «O» во второй строке и его полуразмер (меньший). */
export const EYE = [o2.x + 50, o2.y + 50];
export const HOLE = 50 - S;
export const HOLE_PATH = o2.hole;

/** Логотип для шапки и подвала: один путь, цвет текущий. */
export function logoSvg(cls = "", label = "") {
  const pad = 16;
  return `<svg class="${cls}" viewBox="0 ${-pad} ${LOGO.width} ${LOGO.height + pad}" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'} focusable="false"><path fill="currentColor" fill-rule="evenodd" d="${LOGO.parts.filter((p) => p.ch !== "/").map((p) => p.d).join("")}"/><path fill="currentColor" d="${LOGO.parts.filter((p) => p.ch === "/").map((p) => p.d).join("")}"/></svg>`;
}
