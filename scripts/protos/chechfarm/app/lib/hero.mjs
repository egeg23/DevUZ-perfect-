/* Упаковки на стеклянных подиумах шапки «Продуктов». Места (x, y на кадре)
   — в site.css (.pk-d*, .pk-m*), здесь — какой препарат стоит по умолчанию и
   рамка места: ширина W и высота H в долях кадра. Упаковка вписывается в
   рамку по своим пропорциям, низом на подиум: высокий флакон не вылезет
   над подиумом, широкая коробка не свесится с края. Рамка по высоте взята
   по упаковке, которая стоит там сейчас (up: во сколько раз выше можно,
   если над подиумом свободно), без выбора в панели стоит она сама. d —
   компьютер (кадр 2400×1340), m — телефон (893×1600); d: 0 — на компьютере места нет. Выбор панели — settings
   «hero.slots» (core.mjs), подстановка — server.mjs. */
export const SCENE_K = { d: 1340 / 2400, m: 1600 / 893 };
export const HERO_SLOTS = [
  { key: "elstar", d: { n: 1, w: 11.4, a: 0.73, W: 12, up: 1.5 }, m: { n: 3, w: 21, a: 0.73, W: 22 }, where: "компьютер: левый подиум · телефон: нижний справа" },
  { key: "dilargo-caps", d: { n: 2, w: 6.9, a: 1.5452, W: 11 }, m: { n: 1, w: 11, a: 1.5452, W: 15 }, where: "компьютер: верхний справа · телефон: верхний справа" },
  { key: "mozeks", d: { n: 3, w: 11, a: 1.0054, W: 12.5 }, m: { n: 4, w: 18, a: 1.0054, W: 19 }, where: "компьютер: нижний справа · телефон: нижний слева" },
  { key: "kardon-o2", d: { n: 0 }, m: { n: 2, w: 18, a: 0.9948, W: 18 }, where: "только телефон: верхний слева" },
];

const r1 = (x) => Math.round(x * 10) / 10;
/* Ширина упаковки с пропорцией a (высота / ширина) в рамке места. */
export function slotWidth(place, k, a) {
  if (!place?.w) return 0;
  if (!(a > 0)) return place.w;
  const H = ((place.w * place.a) / k) * (place.up || 1);
  return r1(Math.min(place.W, (H * k) / (a > 0 ? a : place.a)));
}
export function heroStyle(slot, a) {
  const wd = slotWidth(slot.d, SCENE_K.d, a), wm = slotWidth(slot.m, SCENE_K.m, a);
  return (wd ? `--wd:${wd}%;` : "") + `--wm:${wm}%`;
}

/* Размер картинки без пакетов: WebP (VP8, VP8L, VP8X), PNG, JPEG. */
export function imageSize(b) {
  if (!b || b.length < 30) return null;
  if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
    const t = b.toString("ascii", 12, 16);
    if (t === "VP8X") return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
    if (t === "VP8L") { const v = b.readUInt32LE(21); return { w: 1 + (v & 0x3fff), h: 1 + ((v >> 14) & 0x3fff) }; }
    if (t === "VP8 ") return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    return null;
  }
  if (b.readUInt32BE(0) === 0x89504e47) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1], len = b.readUInt16BE(i + 2);
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
      i += 2 + len;
    }
  }
  return null;
}
