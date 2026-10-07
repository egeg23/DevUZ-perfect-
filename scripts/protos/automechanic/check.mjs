import { chromium } from "playwright-core";
// Проверка в Chromium: горизонтальная прокрутка, ошибки скрипта, сцены по
// прокрутке, снимки. node check.mjs <каталог для снимков>  (сначала node serve.mjs)
const S=process.argv[2]||"/tmp/am-shots", T="A".repeat(43), B=`http://localhost:4790/proto/${T}`;
import { mkdirSync } from "node:fs"; mkdirSync(S+"/shots",{recursive:true});
const pages=["","uslugi","zapis","kontakty","plan","offline","uz","uz/uslugi","uz/zapis","uz/kontakty","uz/plan","uz/offline"];
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome"});
let bad=0;
for (const [name,vp] of [["m",{width:390,height:844}],["d",{width:1440,height:900}]]) {
  const ctx=await b.newContext({viewport:vp,deviceScaleFactor:name==="m"?2:1,isMobile:name==="m",hasTouch:name==="m"});
  // Заставка DevUz — отдельным снимком, сцены снимаются уже без неё.
  {const sp=await ctx.newPage();await sp.goto(`${B}/`,{waitUntil:"commit"});await sp.waitForTimeout(500);await sp.screenshot({path:`${S}/shots/${name}-splash.png`});await sp.waitForTimeout(2400);const left=await sp.evaluate(()=>!!document.getElementById("dz"));if(left){bad++;console.log("FAIL",name,"заставка не ушла сама")}await sp.close()}
  await ctx.addInitScript(()=>{try{sessionStorage.setItem("dz","1")}catch(e){}});
  for (const p of pages) {
    const pg=await ctx.newPage(); const errs=[];
    pg.on("console",m=>{if(m.type()==="error")errs.push(m.text())}); pg.on("pageerror",e=>errs.push(String(e)));
    await pg.goto(`${B}/${p}`,{waitUntil:"load"}); await pg.waitForTimeout(800);
    const H=await pg.evaluate(()=>document.documentElement.scrollHeight);
    // Пролистать всю страницу шагами: так срабатывают и сцены, и появление блоков.
    for (let y=0;y<H;y+=vp.height*0.5){await pg.mouse.wheel(0,vp.height*0.5);await pg.waitForTimeout(60)}
    await pg.waitForTimeout(400);
    const ov=await pg.evaluate(()=>{const w=document.documentElement.clientWidth;const wide=[...document.querySelectorAll("body *")].filter(e=>{const r=e.getBoundingClientRect();const cs=getComputedStyle(e);return r.width>0&&r.right>w+1&&cs.position!=="fixed"&&!e.closest(".stage,.par")}).slice(0,5).map(e=>e.tagName+"."+e.className);return {sw:document.documentElement.scrollWidth,w,wide}});
    const small=await pg.evaluate(()=>[...document.querySelectorAll("main p, main li, main a, main dd")].filter(e=>e.offsetParent&&parseFloat(getComputedStyle(e).fontSize)<12).length);
    const fail=ov.sw>ov.w||errs.length||ov.wide.length;
    if(fail)bad++;
    console.log(fail?"FAIL":"ok  ",name,(p||"(main)").padEnd(12),JSON.stringify(ov),"small<12:",small,errs.slice(0,3).join(" ; "));
    await pg.close();
  }
  // Снимки сцены по шагам прокрутки.
  const pg=await ctx.newPage(); await pg.goto(`${B}/`,{waitUntil:"load"}); await pg.waitForTimeout(900);
  await pg.screenshot({path:`${S}/shots/${name}-0.png`});
  const sc=await pg.evaluate(()=>{const s=document.querySelector('[data-scene="hero"]');return s.offsetHeight-innerHeight});
  for (const f of [0.15,0.3,0.45,0.6,0.75,0.85,0.97]) {await pg.evaluate(y=>window.scrollTo(0,y),Math.round(sc*f));await pg.waitForTimeout(350);await pg.screenshot({path:`${S}/shots/${name}-h${Math.round(f*100)}.png`})}
  const oy=await pg.evaluate(()=>{const s=document.querySelector('[data-scene="oil"]');return {top:s.getBoundingClientRect().top+scrollY,len:s.offsetHeight-innerHeight}});
  for (const f of [0,0.3,0.6,0.95]) {await pg.evaluate(y=>window.scrollTo(0,y),Math.round(oy.top+oy.len*f));await pg.waitForTimeout(350);await pg.screenshot({path:`${S}/shots/${name}-oil${Math.round(f*100)}.png`})}
  await pg.evaluate(()=>window.scrollTo(0,document.querySelector('[data-scene="oil"]').getBoundingClientRect().bottom+scrollY));await pg.waitForTimeout(900);
  await pg.screenshot({path:`${S}/shots/${name}-after.png`,fullPage:false});
  for (const p of ["uslugi","zapis","kontakty","plan"]) {const q=await ctx.newPage();await q.goto(`${B}/${p}`,{waitUntil:"load"});await q.waitForTimeout(700);await q.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=400){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,40))}window.scrollTo(0,0)});await q.waitForTimeout(500);await q.screenshot({path:`${S}/shots/${name}-${p}.png`,fullPage:true});await q.close()}
  await ctx.close();
}
await b.close();
console.log(bad?`${bad} страниц с ошибками`:"всё чисто");
process.exit(bad?1:0);
