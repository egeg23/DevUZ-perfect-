// Кадры для запасного пути: node posters.mjs (сервер: node serve.mjs).
// Собранная машина (начало сцены) и полный разлёт, 16:9 и 9:16, в WebP.
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");
const OUT = new URL("../../../public/protos/samauto/", import.meta.url).pathname;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
for (const [name, p] of [["a", 0], ["e", 0.52]]) for (const [fmt, w, h] of [["16", 1920, 1080], ["9", 1080, 1920]]) {
  const page = await b.newPage({ viewport: { width: w / 1.5, height: h / 1.5 }, deviceScaleFactor: 1.5 });
  page.on("pageerror", (e) => console.log("err", e.message));
  await page.goto(`http://localhost:4831/still?p=${p}`);
  await page.waitForFunction(() => window.done, null, { timeout: 300000 });
  await page.screenshot({ path: `${OUT}poster-${name}-${fmt}.png` });
  await page.close();
  console.log(name, fmt);
}
await b.close();
execSync(`cd ${OUT} && for f in poster-*.png; do python3 -I -c "import sys;from PIL import Image;im=Image.open(sys.argv[1]).convert('RGB');im.save(sys.argv[1][:-4]+'.webp','WEBP',quality=78,method=6)" "$f" && rm "$f"; done`);
