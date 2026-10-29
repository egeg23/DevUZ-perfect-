// TTF → three.js typeface JSON, только нужные буквы (как chechfarm/intro/face.mjs).
// node face.mjs <Unbounded 700 .ttf> <папка node_modules с opentype.js>
import { createRequire } from "module";
import { writeFileSync } from "fs";
const [file, nm] = process.argv.slice(2);
const opentype = createRequire(nm + "/")("opentype.js");
const f = opentype.loadSync(file), s = 1000 / f.unitsPerEm, r = (v) => Math.round(v * s);
const glyphs = {};
for (const ch of new Set("NEOLIN")) {
  const g = f.charToGlyph(ch), o = [];
  for (const c of g.path.commands) {
    if (c.type === "M") o.push("m", r(c.x), r(c.y));
    else if (c.type === "L") o.push("l", r(c.x), r(c.y));
    else if (c.type === "Q") o.push("q", r(c.x), r(c.y), r(c.x1), r(c.y1));
    else if (c.type === "C") o.push("b", r(c.x), r(c.y), r(c.x1), r(c.y1), r(c.x2), r(c.y2));
  }
  glyphs[ch] = { ha: r(g.advanceWidth), x_min: r(g.xMin || 0), x_max: r(g.xMax || 0), o: o.join(" ") };
}
const j = { glyphs, familyName: "Unbounded", ascender: r(f.ascender), descender: r(f.descender), underlinePosition: 0, underlineThickness: 0,
  boundingBox: { yMin: r(f.tables.head.yMin), xMin: r(f.tables.head.xMin), yMax: r(f.tables.head.yMax), xMax: r(f.tables.head.xMax) }, resolution: 1000, original_font_information: {} };
writeFileSync(new URL("unb.json", import.meta.url), JSON.stringify(j));
console.log("unb.json", JSON.stringify(j).length);
