// Снимки для PR в docs/screens/invis: node serve.mjs, затем node screens.mjs
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
const OUT = new URL("../../../docs/screens/invis/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const B = `http://localhost:4811/proto/${"a".repeat(43)}`;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
async function shot(name, path, w, h, prep, el, wait = 1600) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: w < 800 ? 2 : 1, isMobile: w < 800, hasTouch: w < 800 });
  await p.addInitScript(() => { try { sessionStorage.setItem("iv-intro", "1"); } catch (e) {} });
  await p.goto(`${B}/${path}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);
  if (prep) { await p.evaluate(prep); await p.waitForTimeout(wait); }
  const png = `/tmp/iv-${name}.png`;
  if (el) await (await p.$(el)).screenshot({ path: png }); else await p.screenshot({ path: png });
  execFileSync("python3", ["-I", "-c", `from PIL import Image;Image.open('${png}').convert('RGB').save('${OUT}${name}.webp','WEBP',quality=82,method=6)`]);
  await p.close();
  console.log(name);
}
const to = (id) => `(function(){var e=document.getElementById('${id}');scrollTo(0,e.offsetTop-80);})()`;
await shot("site-1440-hero", "", 1440, 900);
await shot("site-390-hero", "", 390, 844);
await shot("site-1440-setup", "", 1440, 900, "scrollTo(0,document.getElementById('setup').offsetTop+innerHeight*1.1)");
await shot("site-390-setup", "", 390, 844, "scrollTo(0,document.getElementById('setup').offsetTop+innerHeight*1.2)");
await shot("site-1440-zony", "", 1440, 900, to("zony") + ";document.querySelectorAll('.rv').forEach(function(e){e.classList.add('in')})");
await shot("site-1440-bron", "", 1440, 900, to("bron") + ";document.querySelectorAll('.rv').forEach(function(e){e.classList.add('in')});setTimeout(function(){var s=document.querySelector('#hall .seat.f:nth-child(4)')||document.querySelector('#hall .seat.f');s.click()},300)");
await shot("site-390-bron", "", 390, 844, to("bron") + ";document.querySelectorAll('.rv').forEach(function(e){e.classList.add('in')});setTimeout(function(){document.querySelector('.hl-vip .seat.f').click();document.querySelector('#hall .hl-go').click();var e=document.querySelector('.hl-sum');scrollTo(0,e.getBoundingClientRect().top+scrollY-500)},300)");
await shot("site-1440-koleso", "", 1440, 900, to("koleso") + ";document.querySelectorAll('.rv').forEach(function(e){e.classList.add('in')});var s=IV.state();s.spins=[];IV.save();document.querySelector('#wheel .wh-go').click()", null, 6200);
await shot("site-1440-kabinety", "", 1440, 900, to("kabinety") + ";document.querySelectorAll('.rv').forEach(function(e){e.classList.add('in')})");
await shot("site-1440-konstruktor", "", 1440, 900, to("predlozhenie") + ";document.querySelectorAll('.rv').forEach(function(e){e.classList.add('in')});['booking','cabinet','pay','wheel'].forEach(function(k){var b=document.querySelector('[data-k='+k+']');b.checked=true;b.dispatchEvent(new Event('change'))})");
await shot("site-390-konstruktor-uz", "uz", 390, 844, to("predlozhenie") + ";document.querySelectorAll('.rv').forEach(function(e){e.classList.add('in')})");
await shot("kabinet-390-home", "kabinet", 390, 844);
await shot("kabinet-390-wallet", "kabinet#wallet", 390, 844);
await shot("kabinet-390-bonus", "kabinet#bonus", 390, 844, "document.querySelector('.wh-go')&&!document.querySelector('.wh-go').disabled&&document.querySelector('.wh-go').click()", null, 6200);
await shot("kabinet-390-friends-uz", "uz/kabinet#friends", 390, 844);
await shot("kabinet-1440-book", "kabinet#book", 1440, 900);
await shot("admin-1440-hall", "admin", 1440, 900);
await shot("admin-1440-bookings", "admin#bookings", 1440, 900);
await shot("admin-1440-wheel", "admin#wheel", 1440, 900);
await shot("admin-1440-tariffs-uz", "uz/admin#tariffs", 1440, 900);
await shot("admin-390-shifts", "admin#shifts", 390, 844);
await b.close();
