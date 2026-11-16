// Версия кадров врачей для адресов (?v=…): отпечаток всех tm-*.webp. Файлы лежат под теми же
// именами, а сайт отдаёт их с кэшем на неделю: без версии телефон, который уже был на сайте,
// показал бы прежнюю ленту с новой разметкой. Поменяли любой tm-*.webp:
//   node scripts/protos/syanie/figures/version.mjs        — печатает отпечаток
//   node scripts/protos/syanie/figures/version.mjs write  — вписывает его в FIG_V (catalog.mjs)
// Что FIG_V совпадает с файлами, держит tests/syanie-app.test.ts.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const PUB = new URL("../../../../public/protos/syanie/", import.meta.url);
export function figVersion() {
  const h = createHash("sha1");
  for (const f of readdirSync(PUB).filter((x) => /^tm-[a-z-]+\.webp$/.test(x)).sort()) { h.update(f); h.update(readFileSync(new URL(f, PUB))); }
  return h.digest("hex").slice(0, 8);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) {
  const v = figVersion();
  if (process.argv[2] === "write") {
    const file = new URL("../catalog.mjs", import.meta.url), src = readFileSync(file, "utf8");
    const next = src.replace(/export const FIG_V = "[0-9a-f]*";/, `export const FIG_V = "${v}";`);
    if (next === src && !src.includes(`FIG_V = "${v}"`)) throw new Error("в catalog.mjs нет FIG_V");
    writeFileSync(file, next);
  }
  console.log(v);
}
