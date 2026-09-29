// Рендер компонентов панели в тестах: .tsx через компилятор TypeScript, а
// модули Next — заглушками. Сам Next в голом node не загружается (его
// клиентские модули ждут сборщика), а тесту рендера нужно одно: какой текст
// окажется на экране на каждом языке.
import { registerHooks } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const STUBS = {
  "next/link": "next-link.mjs",
  "next/navigation": "next-navigation.mjs",
  "next/headers": "next-server.mjs",
  "next/cache": "next-server.mjs",
  "next/server": "next-server.mjs",
};

registerHooks({
  resolve(specifier, context, next) {
    const stub = STUBS[specifier];
    if (stub) return { url: new URL(`./stubs/${stub}`, import.meta.url).href, shortCircuit: true };
    return next(specifier, context);
  },
  load(url, context, next) {
    if (!url.endsWith(".tsx")) return next(url, context);
    const file = fileURLToPath(url);
    const out = ts.transpileModule(readFileSync(file, "utf8"), {
      fileName: file,
      compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    });
    return { format: "module", source: out.outputText, shortCircuit: true };
  },
});
