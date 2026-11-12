// Пролёт телефона «Сияния Севера»: видео, отказ play() и кадры, которые не
// пришли с первого раза. Сервер: node serve.mjs (порт 4821).
//   node scripts/protos/syanie/video-check.mjs
// В Chromium из Playwright нет H.264, поэтому скрипт сам делает VP9-копию
// s9.mp4 во временной папке (ключевой каждый третий кадр, как в исходнике)
// и отдаёт её странице вместо s9.mp4. Три прохода на 390×844:
//   video  — видео играет, прокрутка его перематывает;
//   refuse — play() отказывает (энергосбережение, встроенный браузер):
//            видео выключено, сцена идёт кадрами и меняется с прокруткой;
//   nofile — видео не пришло (502), и каждый кадр с первого раза тоже 502:
//            кадры спрашиваются снова, сцена не пустая.
// Плавность это не мерит: эмуляция телефона не замедляет распаковку кадров.
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");
const SRC = new URL("../../../public/protos/syanie/s9.mp4", import.meta.url).pathname;
const WEBM = join(tmpdir(), "syanie-s9-check.webm");
if (!existsSync(WEBM)) execSync(`ffmpeg -v error -y -i "${SRC}" -c:v libvpx-vp9 -deadline realtime -cpu-used 8 -row-mt 1 -g 3 -b:v 2M -an "${WEBM}"`, { stdio: "inherit" });
const BODY = readFileSync(WEBM);
const B = `http://localhost:${process.env.PORT || 4821}/proto/${"a".repeat(43)}/`;
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
let bad = 0;
for (const mode of ["video", "refuse", "nofile"]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(String(e)));
  await p.addInitScript((mode) => {
    try { sessionStorage.setItem("dz-intro", "1"); } catch {}
    const can = HTMLMediaElement.prototype.canPlayType;
    HTMLMediaElement.prototype.canPlayType = function (t) { return this.id === "sv" && /avc1/.test(t) ? "probably" : can.call(this, t); };
    if (mode === "refuse") HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException("play() refused", "NotAllowedError"));
  }, mode);
  await p.route("**/s9.mp4", (r) => (mode === "nofile" ? r.fulfill({ status: 502, body: "" }) : r.fulfill({ status: 200, contentType: "video/mp4", body: BODY })));
  const asked = new Map();
  let refused = 0;
  if (mode === "nofile") await p.route("**/protos/syanie/s9/*.webp", (r) => {
    const u = r.request().url(), n = (asked.get(u) || 0) + 1;
    asked.set(u, n);
    if (n === 1) { refused++; return r.fulfill({ status: 502, body: "" }); }
    return r.continue();
  });
  await p.goto(B, { waitUntil: "load" });
  await p.waitForTimeout(1200);
  await p.evaluate(() => document.getElementById("skipf")?.click());
  await p.waitForTimeout(6000);
  const total = await p.evaluate(() => document.getElementById("story").offsetHeight - innerHeight);
  const marks = [];
  for (const k of [0.1, 0.25, 0.4, 0.55, 0.7, 0.85]) {
    await p.evaluate((y) => scrollTo(0, y), Math.round(total * k));
    await p.waitForTimeout(1500);
    marks.push(await p.evaluate(() => {
      const sv = document.getElementById("sv"), c = document.getElementById("cv"), x = c.getContext("2d");
      const d = x.getImageData(c.width / 2 - 20, c.height / 2 - 20, 40, 40).data;
      let s = 0;
      for (let i = 0; i < d.length; i += 4) s += d[i] + d[i + 1] + d[i + 2];
      return { vid: document.getElementById("stage").classList.contains("vid"), t: +sv.currentTime.toFixed(2), s };
    }));
  }
  const moved = (k) => new Set(marks.map((m) => m[k])).size >= 5;
  const good = mode === "video" ? marks.every((m) => m.vid) && moved("t") : marks.every((m) => !m.vid && m.s > 1000) && moved("s");
  const say = { video: "видео играет и перематывается прокруткой", refuse: "play() отказал — сцена идёт кадрами", nofile: `видео и кадры не пришли с первого раза (${refused}) — кадры спрошены снова, сцена не пустая` }[mode];
  if (good && !errs.length) console.log("✓", say);
  else { bad++; console.log("✗", mode, JSON.stringify(marks), errs.join(" | ")); }
  await ctx.close();
}
await browser.close();
console.log(bad ? `\nОшибок: ${bad}` : "\nВсё прошло");
process.exit(bad ? 1 : 0);
