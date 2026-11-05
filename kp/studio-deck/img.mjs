// Картинки презентации студии: из снимков репозитория в kp/studio-deck/img/.
//
//   node --import ./tests/alias-hook.mjs --import ./tests/tsx-hook.mjs kp/studio-deck/img.mjs
//
// Только то, что уже лежит в репозитории: снимки макетов (docs/screens),
// кадры кейсов (public/cases), рендеры DevUz Box (public/box), заставка DevUz
// (public/protos/_dz) и логотипы «Делали для» (public/clients/logos). Живые
// чужие сайты не снимаем: «было» — только снимки до макета (BEFORE.md) и
// снимки сравнения кейсов.
//
// Фото и экраны — JPEG: Chromium кладёт JPEG в PDF как есть, а WebP
// перекодирует без потерь, и PDF раздувается в разы. Логотипы — PNG с
// прозрачным фоном, перекрашенные в цвет текста маской, как на сайте
// (components/sections/clients.tsx).
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { clientRows, logoBox } from "../../content/clients.ts";

const DIR = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.resolve(DIR, "../..");
const OUT = path.join(DIR, "img");
mkdirSync(OUT, { recursive: true });

const S = (p) => path.join(ROOT, p);
const im = (args) => execFileSync("convert", args, { stdio: "inherit" });
const JPG = ["-strip", "-interlace", "Plane", "-sampling-factor", "4:2:0"];

/** Кадр: исходник, ширина, качество, обрезка до ресайза (WxH+X+Y). */
function shot(out, src, width, { q = 82, crop, pre = [] } = {}) {
  const args = [S(src), ...pre];
  if (crop) args.push("-crop", crop, "+repage");
  args.push("-resize", `${width}x>`, ...JPG, "-quality", String(q), path.join(OUT, out));
  im(args);
}

const L = (n) => `docs/screens/${n}`;

/* Обложка и SamAuto */
shot("cover.jpg", L("samauto/kf/3-polnyj-razlet.jpg"), 1600, { q: 86 });
shot("sam-hero.jpg", L("samauto/1440-1-pokryvalo.webp"), 1440, { q: 84 });
for (const [n, f] of [
  ["1", "1440-1-pokryvalo"],
  ["2", "1440-2-sobrana"],
  ["3", "1440-3-razlet"],
  ["4", "1440-4b-fara-gorit"],
  ["5", "1440-6-proezd"],
  ["6", "1440-7-final"],
])
  shot(`sam-f${n}.jpg`, L(`samauto/${f}.webp`), 760);
shot("sam-m.jpg", L("samauto/390-3-razlet.webp"), 390, { q: 84 });

/* Baldinini */
shot("bald-hero.jpg", "public/cases/baldinini/shot-1-desktop.webp", 1200);
shot("bald-panel.jpg", L("baldinini/panel-dash-1440.jpg"), 1100);
shot("bald-m.jpg", L("baldinini/shop-product-390.jpg"), 390, { q: 84, crop: "390x844+0+0" });

/* Oson Apteka */
for (const f of ["0", "40", "75", "100"]) shot(`oson-fly-${f}.jpg`, L(`osonapteka/fly-${f}-1440.webp`), 760);
shot("oson-drug.jpg", L("osonapteka/drug-1440.webp"), 1100);
shot("oson-bot-m.jpg", L("osonapteka/bot-390.webp"), 520, { q: 84 });
shot("oson-mine-m.jpg", L("osonapteka/mine-390.webp"), 520, { q: 84 });

/* SIA */
shot("sia-bfl.jpg", L("sia/1440-bfl-62.webp"), 1440, { q: 84 });
shot("sia-pp.jpg", L("sia/1440-pp-50.webp"), 900);

/* Сияние Севера */
shot("sy-chat.jpg", L("syanie/chat-tg-1440.jpg"), 1100);
shot("sy-panel.jpg", L("syanie/panel-zayavki-1440.jpg"), 1100);

/* Админки */
shot("gw-panel.jpg", L("greenwell/panel-1440-dash.webp"), 1200);
// Логистика — обезличенный кадр из презентации для карго (kp/cargo-deck/img/ru):
// «YOUR CARGO» вместо знака клиента, как решено для наших продающих материалов.
shot("cargo-plan.jpg", "kp/cargo-deck/img/ru/dispatch-plan.jpg", 1000);
shot("soffice-panel.jpg", L("soffice/panel-dash-1440.png"), 1000);

/* Было / стало: снимки до макета (BEFORE.md) — первый экран длинной страницы */
shot("op-before.jpg", L("optimalprime/before/ru-1440.webp"), 1000, { crop: "1440x900+0+0" });
shot("op-after.jpg", L("optimalprime/hero-1440.webp"), 1000);
shot("samist-before.jpg", L("samist/before/home-1440.webp"), 1000, { crop: "1440x900+0+0" });
shot("samist-after.jpg", L("samist/hero-1440.webp"), 1000);
for (const s of ["golden-house", "namuna", "foodmaxx", "global-export"]) {
  shot(`cmp-${s}-b.jpg`, `public/cases/${s}/hero-before-desktop.webp`, 720);
  shot(`cmp-${s}-a.jpg`, `public/cases/${s}/hero-after-desktop.webp`, 720);
}

/* 3D и движение */
shot("m-sam.jpg", L("samauto/kf/2-razlet.jpg"), 1000);
shot("m-oson.jpg", L("osonapteka/fly-40-1440.webp"), 760);
shot("m-sia.jpg", L("sia/1440-bfl-35.webp"), 760);
shot("m-czech.jpg", L("chechfarm/intro-3-pullback-1440.webp"), 760);
shot("m-op.jpg", L("optimalprime/fly-40-1440.webp"), 760);
shot("m-sy.jpg", L("syanie/scene-1440-62.jpg"), 760);
shot("m-vt.jpg", L("vtashkente/ru-1440-sborka-100.webp"), 760);

/* Заставка DevUz: кадры из ролика */
const tmp = mkdtempSync(path.join(tmpdir(), "studio-deck-"));
for (const [name, t] of [
  ["dz-glass", "1.5"],
  ["dz-sill", "3.3"],
]) {
  const f = path.join(tmp, `${name}.png`);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", t, "-i", S("public/protos/_dz/dz-intro-16.mp4"), "-frames:v", "1", f]);
  im([f, ...JPG, "-quality", "84", path.join(OUT, `${name}.jpg`)]);
}

/* Наша панель «DevUz Офис». На снимке «Входящих» имена и адреса скрыты
   размытием: экран показывает, как устроено, а не чьи переписки. */
const blur = [
  // список слева: первая строка каждой переписки (имя или адрес)
  ...[266, 387, 510, 632, 753, 873].map((y) => `292x46+356+${y}`),
  "215x46+1000+180", // имя в шапке разговора
  "214x46+2362+187", // имя в карточке клиента
  "200x40+2308+336", // адрес сайта в карточке
];
im([
  S(L("os-panel/inbox-1440.png")),
  ...blur.flatMap((r) => ["-region", r, "-blur", "0x14"]),
  "+region",
  "-resize",
  "1440x>",
  ...JPG,
  "-quality",
  "86",
  path.join(OUT, "crm-inbox.jpg"),
]);
im([
  S(L("os-panel/inbox-phone-thread.png")),
  "-region",
  "320x68+595+258",
  "-blur",
  "0x14",
  "+region",
  "-resize",
  "520x>",
  ...JPG,
  "-quality",
  "84",
  path.join(OUT, "crm-m.jpg"),
]);

/* DevUz Box и DevUz OS: разрез «Про» — семь слоёв кадра (BOX_CUTS) одной картинкой */
im([...[1, 2, 3, 4, 5, 6, 7].map((i) => S(`public/box/pro-l${i}.webp`)), "-append", ...JPG, "-quality", "86", path.join(OUT, "box-cut.jpg")]);
for (const k of ["desktop", "studio", "inbox", "code"]) shot(`os-${k}.jpg`, `public/box/os-${k}.webp`, 900);

/* Логотипы «Делали для»: маска цветом текста, как на сайте */
const require = createRequire(execFileSync("npm", ["root", "-g"]).toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");
const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 3 });
for (const c of clientRows.flat()) {
  const { width, height } = logoBox(c.ratio);
  // Маска грузится в режиме CORS: file:// из about:blank не отдаётся, data: — да.
  const type = c.logo.endsWith(".svg") ? "image/svg+xml" : "image/webp";
  const url = `data:${type};base64,${readFileSync(S("public" + c.logo)).toString("base64")}`;
  await page.setContent(
    `<html><body style="margin:0;background:transparent"><div id="l" style="width:${width}px;height:${height}px;background:#eaf0f7;` +
      `-webkit-mask:url('${url}') center/contain no-repeat;mask:url('${url}') center/contain no-repeat"></div></body></html>`,
  );
  await page.waitForTimeout(60);
  await page.locator("#l").screenshot({ path: path.join(OUT, `logo-${c.slug}.png`), omitBackground: true });
}
await browser.close();
rmSync(tmp, { recursive: true, force: true });
console.log("ok: kp/studio-deck/img");
