/**
 * Снимки пролётов ниш (ресторан, мебель, турагентство) — как их увидит клиент.
 *
 * KEYS=<папка с <ниша>.key> node --import ./tests/alias-hook.mjs --import ./tests/tsx-hook.mjs scripts/protos/instant/fly-preview.mjs
 *
 * Ключи кадров — из хранилища секретов (app.SCENE_KEY_INSTANT_<НИША>), сюда их
 * кладёт человек файлами на время снимков: в репозиторий и в вывод они не идут.
 * Страница собирается тем же buildInstant, ключ отдаёт местный /promo/scene.
 */
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildInstant } from "@/lib/proto/instant/build";
import { EXAMPLE_MEBEL, EXAMPLE_REST, EXAMPLE_TUR } from "./preview-data.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const keys = process.env.KEYS;
if (!keys) throw new Error("KEYS — папка с файлами <ниша>.key");
const SITES = { restoran: EXAMPLE_REST, mebel: EXAMPLE_MEBEL, turagentstvo: EXAMPLE_TUR };
const pages = Object.fromEntries(Object.entries(SITES).map(([n, s]) => [n, buildInstant(s, "0".repeat(32)).html.replaceAll("__PROTO_BASE__", `/${n}`)]));

const TYPES = { ".webp": "image/webp", ".mp4": "video/mp4" };
const server = createServer((req, res) => {
  const path = decodeURIComponent((req.url ?? "/").split("?")[0]);
  const [, n, ...rest] = path.split("/");
  if (pages[n] && !rest.length) return res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(pages[n]);
  if (pages[n] && rest.join("/") === "promo/scene") return res.writeHead(200).end(Buffer.from(readFileSync(join(keys, `${n}.key`), "utf8").trim(), "hex"));
  const file = join(root, "public", path);
  if (!file.startsWith(root) || !existsSync(file)) return res.writeHead(404).end();
  res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" }).end(readFileSync(file));
}).listen(0);
const port = server.address().port;

const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");
const shots = join(root, "docs/screens/instant");
mkdirSync(shots, { recursive: true });
const browser = await chromium.launch();
for (const n of Object.keys(SITES)) {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    // REFUSE=1 — телефон не даёт видео запуститься (режим энергосбережения,
    // встроенный браузер): сцена должна пойти кадрами, а не встать.
    if (process.env.REFUSE) await page.addInitScript(() => { HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException("NotAllowedError")); });
    await page.goto(`http://127.0.0.1:${port}/${n}`);
    await page.evaluate(() => document.querySelectorAll("#dzi,.dz-intro,[data-dz]").forEach((e) => e.remove()));
    await page.waitForSelector(".fz.live", { timeout: 60000 });
    await page.waitForFunction(() => document.querySelector("#hs-load")?.classList.contains("ok"), null, { timeout: 120000 }).catch(() => {});
    const wide = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    for (const [tag, at] of [["a", 0], ["b", 0.3], ["c", 0.52], ["d", 0.74], ["e", 0.985]]) {
      await page.evaluate((k) => {
        const f = document.querySelector(".fz");
        scrollTo(0, f.offsetTop + (f.offsetHeight - innerHeight) * k);
      }, at);
      await page.waitForTimeout(2600);
      await page.screenshot({ path: join(shots, `${process.env.REFUSE ? "refuse" : "fly"}-${n}-${w}-${tag}.png`) });
    }
    const cls = await page.evaluate(() => document.querySelector(".fz").className);
    console.log(n, w, "прокрутка вбок:", wide, "ошибок:", errors.length, errors.slice(0, 2).join(" | "), "· сцена:", cls);
    await page.close();
  }
}
await browser.close();
server.close();
