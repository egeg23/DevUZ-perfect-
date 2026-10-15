// Анимированный снимок сцены «Сетап» для PR: node anim.mjs → docs/screens/invis/setup-live.webp
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
const TMP = "/tmp/iv-anim"; mkdirSync(TMP, { recursive: true });
const OUT = new URL("../../../docs/screens/invis/setup-live.webp", import.meta.url).pathname;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.addInitScript(() => { try { sessionStorage.setItem("iv-intro", "1"); } catch (e) {} });
await p.goto(`http://localhost:4811/proto/${"a".repeat(43)}/`, { waitUntil: "networkidle" });
await p.evaluate(() => scrollTo(0, document.getElementById("setup").offsetTop + innerHeight * 1.4));
await p.waitForTimeout(600);
const st = await p.$(".su-stage");
const N = 48;
for (let i = 0; i < N; i++) { await st.screenshot({ path: `${TMP}/f${String(i).padStart(2, "0")}.png` }); await p.waitForTimeout(60); }
await b.close();
execFileSync("python3", ["-I", "-c", `
import glob
from PIL import Image
fs=sorted(glob.glob('${TMP}/f*.png'))
ims=[Image.open(f).convert('RGB') for f in fs]
w=640;ims=[im.resize((w,round(im.height*w/im.width)),Image.LANCZOS) for im in ims]
ims[0].save('${OUT}',save_all=True,append_images=ims[1:],duration=90,loop=0,quality=72,method=4)
`]);
console.log("ok");
