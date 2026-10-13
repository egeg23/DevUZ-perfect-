// Рисунки кодом: машина в разрезе с газовой системой, баллон на испытании,
// фургон Labo по слоям сэндвич-панели. Вектор, поэтому чёткие на любом
// экране; чужих снимков нет. Детали названы так, как их называет
// europegas.uz: баллон, редуктор, инжекторы (форсунки), контроллер.

/* ── Машина в разрезе: viewBox 1600 × 900, нос слева ─────────────────── */
export const CAR = { w: 1600, h: 900 };
/** Точки меток на рисунке машины (единицы рисунка). */
export const CAR_SPOTS = {
  cyl: [1350, 523], fill: [1478, 596], line: [860, 655], red: [497, 606], rail: [340, 527], ecu: [522, 541], sw: [722, 498],
};
/** Газовая магистраль: от баллона к редуктору; по ней бегут капли газа. */
export const GAS_LINE = "M1234 523L1182 523Q1162 523 1162 543L1162 637Q1162 655 1142 655L560 655Q540 655 540 637L540 624Q540 606 522 606";
const WHEEL = (cx) => `<g transform="translate(${cx} 662)"><circle r="90" fill="#0d0b29" stroke="#3e8bd6" stroke-opacity=".5" stroke-width="3"/><circle r="56" fill="none" stroke="#7fdcff" stroke-opacity=".55" stroke-width="3"/>${Array.from({ length: 5 }, (_, k) => `<path d="M0 -12L0 -52" stroke="#7fdcff" stroke-opacity=".4" stroke-width="6" stroke-linecap="round" transform="rotate(${k * 72})"/>`).join("")}<circle r="12" fill="#7fdcff" fill-opacity=".6"/></g>`;
export function carSvg() {
  const body = "M140 640L150 560Q160 520 220 505L520 470Q600 400 720 330Q760 315 840 312L1080 312Q1160 314 1220 360L1330 450Q1440 462 1470 480Q1500 500 1500 560L1505 640Q1500 660 1480 662L1292 662A92 92 0 0 0 1108 662L472 662A92 92 0 0 0 288 662L160 662Q140 660 140 640Z";
  const inj = [262, 304, 346, 388].map((x) => `<g><rect x="${x - 11}" y="512" width="22" height="30" rx="5" fill="#d9e4f0"/><rect x="${x - 6}" y="542" width="12" height="12" rx="3" fill="#8aa0b8"/></g>`).join("");
  return `<svg class="car-svg" viewBox="0 0 ${CAR.w} ${CAR.h}" aria-hidden="true" focusable="false">
<defs>
<linearGradient id="cb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fdcff" stop-opacity=".16"/><stop offset="1" stop-color="#352e71" stop-opacity=".22"/></linearGradient>
<linearGradient id="cy" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a7a"/><stop offset=".45" stop-color="#e8452c"/><stop offset="1" stop-color="#9c2416"/></linearGradient>
<linearGradient id="gl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#00b1f1"/><stop offset="1" stop-color="#7fdcff"/></linearGradient>
<pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#7fdcff" stroke-opacity=".06"/></pattern>
</defs>
<rect width="1600" height="900" fill="url(#grid)"/>
<path d="M60 752H1540" stroke="#7fdcff" stroke-opacity=".18" stroke-width="2" stroke-dasharray="2 10"/>
<path d="${body}" fill="url(#cb)" stroke="#7fdcff" stroke-opacity=".7" stroke-width="3" stroke-linejoin="round"/>
<path d="M560 470L735 345Q760 333 800 332L940 332L940 470ZM960 332L1075 332Q1140 335 1190 375L1290 470L960 470Z" fill="#7fdcff" fill-opacity=".07" stroke="#7fdcff" stroke-opacity=".45" stroke-width="2"/>
<path d="M950 332V640M560 470H1300M520 470V640" stroke="#7fdcff" stroke-opacity=".22" stroke-width="2"/>
<g><rect x="208" y="548" width="262" height="96" rx="16" fill="#1b1750" stroke="#7fdcff" stroke-opacity=".45" stroke-width="2"/>${[0, 1, 2, 3].map((k) => `<rect x="${234 + k * 56}" y="562" width="40" height="66" rx="8" fill="#26206a"/>`).join("")}<path d="M240 548V530H420V548" fill="none" stroke="#8aa0b8" stroke-width="5"/></g>
<rect x="236" y="506" width="180" height="12" rx="6" fill="#00b1f1"/>${inj}
<path d="M470 600Q450 572 418 512" fill="none" stroke="url(#gl)" stroke-width="5" stroke-linecap="round"/>
<g><circle cx="497" cy="606" r="30" fill="#2a2470" stroke="#7fdcff" stroke-width="3"/><circle cx="497" cy="606" r="12" fill="#00b1f1"/></g>
<g><rect x="488" y="516" width="70" height="50" rx="8" fill="#0d0b29" stroke="#00b1f1" stroke-width="3"/><path d="M500 532H546M500 544H530" stroke="#7fdcff" stroke-width="3" stroke-linecap="round"/><path d="M488 540Q440 520 420 512" fill="none" stroke="#7fdcff" stroke-opacity=".5" stroke-width="2" stroke-dasharray="4 6"/></g>
<g><rect x="706" y="486" width="34" height="24" rx="6" fill="#0d0b29" stroke="#7fdcff" stroke-width="2"/><circle cx="723" cy="498" r="5" fill="#3df29b"/><path d="M706 498Q620 520 558 540" fill="none" stroke="#7fdcff" stroke-opacity=".4" stroke-width="2" stroke-dasharray="4 6"/></g>
<path class="gas-line" d="${GAS_LINE}" fill="none" stroke="url(#gl)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
<g><rect x="1236" y="480" width="232" height="86" rx="43" fill="url(#cy)"/><path d="M1270 486Q1350 480 1440 486" stroke="#fff" stroke-opacity=".45" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M1300 480V566M1404 480V566" stroke="#7a1a10" stroke-opacity=".5" stroke-width="5"/><rect x="1222" y="510" width="16" height="26" rx="4" fill="#d9e4f0"/></g>
<g><circle cx="1478" cy="596" r="12" fill="#d9e4f0"/><path d="M1466 596Q1450 560 1468 540" fill="none" stroke="#d9e4f0" stroke-width="4"/></g>
${WHEEL(380)}${WHEEL(1200)}
<g class="gas-dots">${Array.from({ length: 9 }, (_, k) => `<circle r="7" fill="#e9fbff" data-gd="${k}"/>`).join("")}</g>
</svg>`;
}

/* ── Баллон на испытании: viewBox 1600 × 900 ─────────────────────────── */
export function cylSvg() {
  return `<svg class="cyl-svg" viewBox="0 0 1600 900" aria-hidden="true" focusable="false">
<defs>
<linearGradient id="cz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb199"/><stop offset=".3" stop-color="#ef5a3c"/><stop offset=".75" stop-color="#b52e1b"/><stop offset="1" stop-color="#6e170c"/></linearGradient>
<linearGradient id="cv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f8fc"/><stop offset="1" stop-color="#8aa0b8"/></linearGradient>
<radialGradient id="cs" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
</defs>
<ellipse cx="800" cy="690" rx="560" ry="34" fill="url(#cs)"/>
<g data-k="cylBody">
<rect x="250" y="300" width="1080" height="320" rx="160" fill="url(#cz)"/>
<path d="M360 330Q800 300 1240 330" stroke="#fff" stroke-opacity=".5" stroke-width="16" stroke-linecap="round" fill="none"/>
<path d="M420 300V620M1160 300V620" stroke="#5a1309" stroke-opacity=".35" stroke-width="10"/>
<rect x="560" y="400" width="460" height="120" rx="16" fill="#fff" fill-opacity=".92"/>
<text x="790" y="478" text-anchor="middle" font-family="Unbounded,Onest,sans-serif" font-weight="700" font-size="56" fill="#b52e1b" letter-spacing="6">CNG</text>
<g data-k="valve"><rect x="1322" y="420" width="60" height="80" rx="10" fill="url(#cv)"/><rect x="1380" y="398" width="70" height="124" rx="14" fill="url(#cv)"/><circle cx="1415" cy="380" r="26" fill="#d9e4f0" stroke="#8aa0b8" stroke-width="6"/></g>
<g data-k="okTag" opacity="0"><circle cx="1010" cy="352" r="74" fill="#0d0b29"/><circle cx="1010" cy="352" r="62" fill="none" stroke="#3df29b" stroke-width="6" stroke-dasharray="10 8"/><path d="M982 352l20 20 36-40" fill="none" stroke="#3df29b" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/></g>
</g>
<g data-k="scan" opacity="0"><ellipse cx="0" cy="460" rx="34" ry="190" fill="none" stroke="#7fdcff" stroke-width="6"/><ellipse cx="0" cy="460" rx="14" ry="170" fill="#7fdcff" fill-opacity=".18"/></g>
<g class="puffs">${Array.from({ length: 10 }, (_, k) => `<circle cx="1450" cy="360" r="${16 + (k % 4) * 8}" fill="#e9fbff" fill-opacity=".55" data-pf="${k}"/>`).join("")}</g>
<g class="drops">${Array.from({ length: 6 }, (_, k) => `<path d="M0 -14C6 -4 10 2 10 8A10 10 0 0 1 -10 8C-10 2 -6 -4 0 -14Z" fill="#c9a24a" transform="translate(${1350 + k * 4} 530)" data-dp="${k}"/>`).join("")}</g>
<g data-k="scale" opacity="0"><rect x="560" y="690" width="460" height="40" rx="12" fill="#1b1750" stroke="#7fdcff" stroke-opacity=".5" stroke-width="3"/><circle cx="790" cy="780" r="56" fill="#0d0b29" stroke="#7fdcff" stroke-width="4"/><path d="M745 780A45 45 0 0 1 835 780" fill="none" stroke="#7fdcff" stroke-opacity=".4" stroke-width="6"/><path data-k="needle" d="M790 780L790 736" stroke="#3df29b" stroke-width="6" stroke-linecap="round" style="transform-origin:790px 780px"/></g>
</svg>`;
}

/* ── Фургон Labo: viewBox 1600 × 900, кабина слева ────────────────────── */
export const VAN_LAYERS = ["outer", "foam", "inner", "floor"];
export function vanSvg() {
  const W2 = (cx) => `<g transform="translate(${cx} 708)"><circle r="68" fill="#1a1a2e"/><circle r="40" fill="#c8d2de"/><circle r="14" fill="#8aa0b8"/></g>`;
  const box = (k, fill, extra = "") => `<g data-k="ly${k}"><rect x="560" y="250" width="860" height="390" rx="14" fill="${fill}" stroke="#352e71" stroke-opacity=".25" stroke-width="3"/>${extra}</g>`;
  const seams = [775, 990, 1205].map((x) => `<path d="M${x} 262V628" stroke="#352e71" stroke-opacity=".12" stroke-width="3"/>`).join("");
  const hatch = Array.from({ length: 22 }, (_, k) => `<path d="M${580 + k * 40} 630L${640 + k * 40} 262" stroke="#c9a24a" stroke-opacity=".35" stroke-width="3"/>`).join("");
  return `<svg class="van-svg" viewBox="0 0 1600 900" aria-hidden="true" focusable="false">
<defs><linearGradient id="vc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dfe7f0"/></linearGradient><clipPath id="vclip"><rect x="560" y="250" width="860" height="390" rx="14"/></clipPath></defs>
<ellipse cx="800" cy="776" rx="680" ry="26" fill="#352e71" fill-opacity=".12"/>
<path d="M150 648L170 470Q180 420 230 410L420 400Q470 400 500 440L540 520L540 648Z" fill="url(#vc)" stroke="#352e71" stroke-opacity=".35" stroke-width="3"/>
<path d="M200 470L230 425Q240 418 260 418L420 414Q450 414 470 444L500 500L200 500Z" fill="#7fdcff" fill-opacity=".35" stroke="#352e71" stroke-opacity=".3" stroke-width="2"/>
<rect x="140" y="640" width="1300" height="26" rx="8" fill="#2a2a40"/>
${box(3, "#b98f5a", `<path d="M560 620H1420" stroke="#8a6436" stroke-width="6"/>`)}
${box(2, "#eef3f7", seams)}
${box(1, "#f3dfa2", `<g clip-path="url(#vclip)">${hatch}</g>`)}
${box(0, "url(#vc)", `${seams}<rect x="1300" y="300" width="90" height="300" rx="8" fill="none" stroke="#352e71" stroke-opacity=".25" stroke-width="3"/><path d="M1312 450H1336" stroke="#352e71" stroke-opacity=".5" stroke-width="8" stroke-linecap="round"/>`)}
<g data-k="fridge" opacity="0"><rect x="590" y="172" width="230" height="82" rx="14" fill="#f4f8fc" stroke="#352e71" stroke-opacity=".35" stroke-width="3"/>${[0, 1, 2, 3, 4, 5, 6].map((k) => `<path d="M${616 + k * 26} 190V236" stroke="#352e71" stroke-opacity=".3" stroke-width="5" stroke-linecap="round"/>`).join("")}<circle cx="790" cy="213" r="6" fill="#00b1f1"/></g>
${W2(330)}${W2(1180)}
<g class="flakes">${Array.from({ length: 14 }, (_, k) => `<path d="M0 -12V12M-10 -6L10 6M-10 6L10 -6" stroke="#00b1f1" stroke-width="3" stroke-linecap="round" transform="translate(${640 + (k * 53) % 740} ${300 + (k * 37) % 280})" data-fl="${k}"/>`).join("")}</g>
</svg>`;
}
