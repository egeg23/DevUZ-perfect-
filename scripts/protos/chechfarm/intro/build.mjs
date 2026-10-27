// Сборка заставки: node build.mjs <папка с node_modules, где three@0.170.0 и esbuild>
// Пример: npm i --prefix /tmp/fx three@0.170.0 esbuild@0.24.0 && node build.mjs /tmp/fx
// Итог — public/protos/chechfarm/intro3d.js (three.js внутри, лицензия MIT в шапке файла).
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";
const dir = process.argv[2];
if (!dir) throw new Error("нужна папка с node_modules: node build.mjs <папка>");
const nm = path.resolve(dir, "node_modules");
const esbuild = createRequire(nm + "/")("esbuild");
const here = path.dirname(fileURLToPath(import.meta.url));
await esbuild.build({
  entryPoints: [path.join(here, "intro.js")],
  outfile: path.join(here, "../../../../public/protos/chechfarm/intro3d.js"),
  bundle: true, minify: true, format: "iife", target: "es2018", nodePaths: [nm], legalComments: "none",
  banner: { js: "/* CZECHFARM intro. three.js r170, (c) 2010-2024 three.js authors, MIT License */" },
});
console.log("собрано");
