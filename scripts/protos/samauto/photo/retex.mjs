// Подмена текстуры цвета в GLB: node retex.mjs <in.glb> <png> <out.glb>
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { readFileSync } from "node:fs";
const [,, inp, png, out] = process.argv;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(inp);
const img = readFileSync(png);
for (const m of doc.getRoot().listMaterials()) { const t = m.getBaseColorTexture(); if (t) { t.setImage(new Uint8Array(img)); t.setMimeType("image/png"); } }
await io.write(out, doc);
