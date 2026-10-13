// Рисунки истории кодом: вектор, поэтому на любом увеличении и на любом
// экране без единого пикселя. Ни одной чужой картинки: кожа, разрез кожи,
// свет и пузырьки — геометрия. Случайность с зерном: сборка всегда рисует
// одно и то же.

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const f = (n) => Math.round(n * 10) / 10;

/* ── Поверхность кожи сверху: 1600 × 1000. Борозды ромбами, поры, веснушки,
   родинка и папиллома. Ключевое — в середине (x 600-1050), чтобы на
   телефоне, где края срезаны, оно было в кадре. ── */
export const MOLE = [905, 420], PAPILLOMA = [700, 270];

function moleShape(cx, cy, r, R) {
  const pts = [];
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2, k = r * (0.86 + R() * 0.24);
    pts.push([cx + Math.cos(a) * k, cy + Math.sin(a) * k * 0.92]);
  }
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[(i + 1) % pts.length], q = pts[(i + 2) % pts.length];
    d += `Q${f(p[0])} ${f(p[1])} ${f((p[0] + q[0]) / 2)} ${f((p[1] + q[1]) / 2)}`;
  }
  return d + "Z";
}

export function surfaceSvg(detail = false, id = "sf") {
  const R = rng(7);
  let furrows = "";
  for (let i = -8; i < 26; i++) {
    const x0 = i * 80 + R() * 30;
    furrows += `<path d="M${f(x0)} -20 C${f(x0 + 160)} 280 ${f(x0 + 260)} 640 ${f(x0 + 420)} 1020"/>`;
    furrows += `<path d="M${f(x0 + 900)} -20 C${f(x0 + 740)} 300 ${f(x0 + 620)} 660 ${f(x0 + 480)} 1020"/>`;
  }
  let pores = "";
  for (let i = 0; i < 260; i++) {
    const x = R() * 1600, y = R() * 1000, r = 1.6 + R() * 2.6;
    pores += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r)}" ry="${f(r * 0.8)}"/>`;
  }
  let freck = "";
  for (let i = 0; i < 46; i++) {
    const x = 200 + R() * 1200, y = 80 + R() * 840, r = 3 + R() * 6;
    if (Math.hypot(x - MOLE[0], y - MOLE[1]) < 110 || Math.hypot(x - PAPILLOMA[0], y - PAPILLOMA[1]) < 80) continue;
    freck += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" opacity="${f(0.16 + R() * 0.22)}"/>`;
  }
  let hairs = "";
  for (let i = 0; i < 26; i++) {
    const x = R() * 1600, y = R() * 1000, a = R() * Math.PI * 2, l = 24 + R() * 30;
    hairs += `<path d="M${f(x)} ${f(y)}q${f(Math.cos(a) * l * 0.6)} ${f(Math.sin(a) * l * 0.2)} ${f(Math.cos(a) * l)} ${f(Math.sin(a) * l)}"/>`;
  }
  const mole = moleShape(MOLE[0], MOLE[1], 40, rng(11));
  /* Под линзой видно больше: пигментная сеть на родинке и сосочки на
     папилломе, как в дерматоскопе. */
  let net = "";
  if (detail) {
    const N = rng(5);
    for (let i = 0; i < 70; i++) {
      const a = N() * Math.PI * 2, rr = N() * 34, x = MOLE[0] + Math.cos(a) * rr, y = MOLE[1] + Math.sin(a) * rr * 0.92;
      net += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(2.4 + N() * 2.6)}"/>`;
    }
  }
  let papl = "";
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2, x = PAPILLOMA[0] + Math.cos(a) * 20, y = PAPILLOMA[1] + Math.sin(a) * 17;
    papl += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(detail ? 12 : 11)}"/>`;
  }
  return `<svg class="sf-svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
<defs><radialGradient id="${id}-b" cx="55%" cy="45%" r="75%"><stop offset="0" stop-color="#f6dccd"/><stop offset=".6" stop-color="#eec6b2"/><stop offset="1" stop-color="#d9a68f"/></radialGradient>
<radialGradient id="${id}-m" cx="40%" cy="38%" r="70%"><stop offset="0" stop-color="#8a5a45"/><stop offset=".7" stop-color="#5d3527"/><stop offset="1" stop-color="#4a2a20"/></radialGradient>
<radialGradient id="${id}-p" cx="38%" cy="34%" r="70%"><stop offset="0" stop-color="#f5d2c0"/><stop offset="1" stop-color="#c98f78"/></radialGradient></defs>
<rect width="1600" height="1000" fill="url(#${id}-b)"/>
<g fill="none" stroke="#c48a73" stroke-width="${detail ? 1.4 : 2}" opacity=".32">${furrows}</g>
<g fill="#b9806b" opacity=".5">${pores}</g>
<g fill="#a86a4f">${freck}</g>
<g fill="none" stroke="#7a5244" stroke-width="1.2" stroke-linecap="round" opacity=".45">${hairs}</g>
<path d="${mole}" fill="url(#${id}-m)"/>
${detail ? `<g fill="#3a1f17" opacity=".55">${net}</g><path d="${mole}" fill="none" stroke="#3a1f17" stroke-width="1.5" opacity=".5"/>` : ""}
<g fill="url(#${id}-p)" stroke="#b37a64" stroke-width="${detail ? 1.4 : 1}">${papl}</g>
<circle cx="${PAPILLOMA[0] - 4}" cy="${PAPILLOMA[1] - 5}" r="5" fill="#fff" opacity=".35"/>
</svg>`;
}

/* ── Разрез кожи: 1600 × 2200. Роговой слой, эпидермис клетками, дерма с
   волокнами, сосудами, волосом, сальной и потовой железой, жир. ── */
export const XS = { w: 1600, h: 2200, top: 300 };
export const XS_SPOTS = {
  epi: [560, 430],
  hair: [790, 900],
  derm: [1000, 1120],
  vessel: [620, 1330],
  fat: [900, 1900],
};

export function sectionSvg() {
  const R = rng(3);
  const top = XS.top;
  const wave = (y, amp, n, ph = 0) => {
    let d = `M-20 ${y}`;
    for (let i = 0; i <= n; i++) {
      const x = -20 + (i * 1640) / n, xm = x - 820 / n;
      d += `Q${f(xm)} ${f(y + (i % 2 ? amp : -amp) + ph)} ${f(x)} ${f(y)}`;
    }
    return d;
  };
  /* Граница эпидермиса и дермы — сосочки. */
  const basal = (() => {
    let d = "M-20 560";
    for (let i = 0; i < 16; i++) {
      const x = -20 + i * 105;
      d += `C${f(x + 20)} 560 ${f(x + 30)} 640 ${f(x + 52)} 640C${f(x + 75)} 640 ${f(x + 85)} 560 ${f(x + 105)} 560`;
    }
    return d;
  })();
  let cells = "";
  for (let row = 0; row < 7; row++) {
    const y = top + 70 + row * 34, n = 44, r = 15 - row * 0.6;
    for (let i = 0; i < n; i++) {
      const x = i * 38 + (row % 2) * 19 + R() * 6 - 10;
      const tone = row < 2 ? "#f3d6c7" : row < 5 ? "#ecc0ab" : "#e2a891";
      cells += `<ellipse cx="${f(x)}" cy="${f(y + R() * 6)}" rx="${f(r + R() * 3)}" ry="${f(r * 0.78)}" fill="${tone}"/><circle cx="${f(x + 2)}" cy="${f(y + 1)}" r="${f(r * 0.28)}" fill="#c98270" opacity=".55"/>`;
    }
  }
  let flakes = "";
  for (let i = 0; i < 40; i++) {
    const x = i * 42 + R() * 20;
    flakes += `<path d="M${f(x)} ${f(top + 6 + R() * 8)}h${f(26 + R() * 18)}" />`;
  }
  let fibers = "";
  for (let i = 0; i < 90; i++) {
    const y = 700 + R() * 780, x = -40 + R() * 1500, l = 140 + R() * 260, a = (R() - 0.5) * 50;
    fibers += `<path d="M${f(x)} ${f(y)}c${f(l * 0.3)} ${f(a)} ${f(l * 0.6)} ${f(-a)} ${f(l)} ${f(a * 0.4)}"/>`;
  }
  let fat = "";
  for (let i = 0; i < 70; i++) {
    const x = R() * 1600, y = 1560 + R() * 620, r = 46 + R() * 34;
    fat += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}"/>`;
  }
  /* Волос: стержень над кожей и в фолликуле, луковица внизу. */
  const hx = 790;
  const hair = `<path d="M${hx - 30} ${top - 260} C${hx - 10} ${top - 120} ${hx - 6} ${top} ${hx} ${top + 40} L${hx + 6} 1260" fill="none" stroke="#3b2a24" stroke-width="14" stroke-linecap="round"/>`;
  const follicle = `<path d="M${hx - 34} ${top + 20} C${hx - 40} 700 ${hx - 46} 1100 ${hx - 70} 1250 C${hx - 80} 1330 ${hx + 80} 1330 ${hx + 70} 1250 C${hx + 46} 1100 ${hx + 40} 700 ${hx + 34} ${top + 20}Z" fill="#e7b19d" stroke="#c98a74" stroke-width="3"/><ellipse cx="${hx}" cy="1280" rx="58" ry="46" fill="#c9806a"/><ellipse cx="${hx}" cy="1288" rx="26" ry="20" fill="#f0c9b6"/>`;
  const gland = `<path d="M${hx + 40} 760 c40 -30 110 -20 120 30 c40 0 60 60 20 90 c10 50 -60 80 -100 50 c-30 20 -60 -10 -40 -40 c-20 -40 -10 -110 0 -130z" fill="#f2d48c" stroke="#d9b264" stroke-width="3"/><g fill="#e8c26f">${[[hx + 100, 800], [hx + 140, 850], [hx + 90, 870], [hx + 120, 900]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="13"/>`).join("")}</g>`;
  const muscle = `<path d="M${hx + 60} 980 C${hx + 160} 900 ${hx + 260} 760 ${hx + 320} 640" fill="none" stroke="#d98a8a" stroke-width="18" stroke-linecap="round" opacity=".7"/>`;
  /* Второй волос поменьше. */
  const h2 = 470;
  const hair2 = `<path d="M${h2 + 30} ${top - 200} C${h2 + 14} ${top - 90} ${h2 + 4} ${top} ${h2} ${top + 30} L${h2 - 4} 1080" fill="none" stroke="#4a362e" stroke-width="10" stroke-linecap="round"/><path d="M${h2 - 24} ${top + 20} C${h2 - 28} 700 ${h2 - 32} 960 ${h2 - 48} 1060 C${h2 - 54} 1120 ${h2 + 54} 1120 ${h2 + 48} 1060 C${h2 + 32} 960 ${h2 + 28} 700 ${h2 + 24} ${top + 20}Z" fill="#e9b7a3" stroke="#c98a74" stroke-width="3"/><ellipse cx="${h2}" cy="1080" rx="40" ry="32" fill="#c9806a"/>`;
  /* Потовая железа: клубок внизу дермы, проток вверх. */
  let coil = "M1110 1410";
  for (let i = 1; i <= 60; i++) { const a = i * 0.42, r = 10 + i * 0.75; coil += `L${f(1110 + Math.cos(a) * r * 1.4)} ${f(1440 + Math.sin(a) * r * 0.7)}`; }
  coil = `<path d="${coil}"/>`;
  const sweat = `<path d="M1110 1410 C1090 1200 1150 1000 1110 800 C1080 640 1140 520 1120 ${top + 30}" fill="none" stroke="#9fb6c9" stroke-width="10" stroke-linecap="round"/><g fill="none" stroke="#9fb6c9" stroke-width="10">${coil}</g>`;
  /* Сосуды: артерия и вена петлями к сосочкам. */
  const loop = (y, c) => {
    let d = `M-20 ${y}`;
    for (let i = 0; i < 9; i++) {
      const x = -20 + i * 205;
      d += `C${x + 60} ${y} ${x + 70} ${y - 120} ${x + 100} ${y - 120}C${x + 130} ${y - 120} ${x + 140} ${y} ${x + 205} ${y}`;
    }
    return `<path d="${d}" fill="none" stroke="${c}" stroke-width="12" stroke-linecap="round"/>`;
  };
  const vessels = `${loop(780, "#c9495a")}${loop(800, "#5f74b5")}<path d="M-20 1360 C300 1320 500 1400 800 1350 S1300 1300 1640 1370" fill="none" stroke="#c9495a" stroke-width="22"/><path d="M-20 1395 C300 1360 520 1430 820 1385 S1300 1340 1640 1405" fill="none" stroke="#5f74b5" stroke-width="22"/>`;
  return `<svg class="xs-svg" viewBox="0 0 ${XS.w} ${XS.h}" aria-hidden="true" focusable="false">
<defs><linearGradient id="xs-d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6ddd2"/><stop offset="1" stop-color="#efcfc2"/></linearGradient>
<linearGradient id="xs-f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbe9c4"/><stop offset="1" stop-color="#f3d6a1"/></linearGradient>
<linearGradient id="xs-air" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b2530" stop-opacity="0"/><stop offset="1" stop-color="#0b2530" stop-opacity=".0"/></linearGradient></defs>
<rect y="${top}" width="1600" height="${XS.h - top}" fill="url(#xs-d)"/>
<rect y="1500" width="1600" height="${XS.h - 1500}" fill="url(#xs-f)"/>
<g fill="#fdf1d8" stroke="#e6c88e" stroke-width="3">${fat}</g>
<path d="M-20 1500 C400 1470 900 1540 1640 1490 V1530 C900 1580 400 1510 -20 1540Z" fill="#ead2bf"/>
<g fill="none" stroke="#e2ab97" stroke-width="5" stroke-linecap="round" opacity=".55">${fibers}</g>
${vessels}
<path d="${basal} V${top} H-20Z" fill="#e8b6a1"/>
<clipPath id="xs-epi"><path d="${basal} V${top} H-20Z"/></clipPath>
<g clip-path="url(#xs-epi)">${cells}</g>
<path d="${basal}" fill="none" stroke="#c98a74" stroke-width="4"/>
<path d="${wave(top, 8, 22)} V${top + 30} H-20Z" fill="#f5e0d3"/>
<g stroke="#e9cbbb" stroke-width="5" stroke-linecap="round">${flakes}</g>
${sweat}
${hair2}
${follicle}${gland}${muscle}${hair}
</svg>`;
}

/* ── Поле клеток для первого экрана: точки знака Asmo в три слоя. ── */
export function cellsHtml() {
  const R = rng(21);
  const layer = (n, min, max, cls) => {
    let s = "";
    for (let i = 0; i < n; i++) {
      const x = R() * 100, y = R() * 100, r = min + R() * (max - min), a = R() < 0.55;
      s += `<i style="left:${f(x)}%;top:${f(y)}%;width:${f(r)}px;height:${f(r)}px" class="${a ? "c" : "w"}"></i>`;
    }
    return `<div class="cl ${cls}" data-depth="${cls}">${s}</div>`;
  };
  return layer(28, 6, 16, "d1") + layer(14, 22, 48, "d2") + layer(6, 70, 140, "d3");
}

/* ── Пузырьки озона для главы «Свет»: координаты — доли экрана. ── */
export function bubblesHtml() {
  const R = rng(9);
  let s = "";
  for (let i = 0; i < 22; i++) s += `<i data-b="${i}" style="left:${f(8 + R() * 84)}%;width:${f(10 + R() * 30)}px;height:${f(10 + R() * 30)}px" data-s="${f(0.6 + R() * 0.9)}" data-o="${f(R())}"></i>`;
  return s;
}
