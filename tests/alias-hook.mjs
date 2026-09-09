// Резолвер для «@/...» — тем же алиасом, что в tsconfig.json (`"@/*": ["./*"]`).
//
// Нужен потому, что node исполняет TypeScript напрямую (type stripping), но
// про алиасы сборщика ничего не знает, а исходники импортируют без расширения:
// «@/lib/promise-terms». ESM без расширения не резолвит, поэтому подбираем его
// сами — ровно так же, как это делает сборщик.
// Ограничение режима strip-only, о которое легко споткнуться: node исполняет
// только тот TypeScript, который стирается без остатка. Синтаксис, порождающий
// код, — parameter properties (`constructor(readonly x: T)`), `enum`,
// пространства имён — падает с ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX, хотя tsc и
// сборка его принимают. Модули, которые импортируются из тестов, должны его
// избегать.
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = new URL("../", import.meta.url);
const EXTENSIONS = [".ts", ".tsx", ".mjs", ".js"];

function withExtension(url) {
  const path = fileURLToPath(url);
  if (existsSync(path) && !path.endsWith("/")) return url;
  for (const ext of EXTENSIONS) {
    if (existsSync(path + ext)) return pathToFileURL(path + ext);
    if (existsSync(`${path}/index${ext}`)) return pathToFileURL(`${path}/index${ext}`);
  }
  return url;
}

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("@/")) {
      const target = withExtension(new URL(specifier.slice(2), ROOT));
      return next(target.href, context);
    }
    return next(specifier, context);
  },
});
