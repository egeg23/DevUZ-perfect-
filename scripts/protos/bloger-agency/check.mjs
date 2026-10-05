import { chromium } from "playwright-core";
// Проверка в Chromium: горизонтальная прокрутка, ошибки скрипта, снимки.
// node check.mjs <каталог для снимков>  (сначала node serve.mjs)
const S=process.argv[2], T="A".repeat(43), B=`http://localhost:4789/proto/${T}`;
const pages=["","blogery","ugc","brendam","blogeram","keysy","uz","uz/blogery","uz/ugc","uz/brendam","uz/blogeram","uz/keysy"];
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
for (const [name,vp] of [["m",{width:390,height:844}],["d",{width:1440,height:900}]]) {
  const ctx=await b.newContext({viewport:vp,deviceScaleFactor:name==="m"?2:1});
  for (const p of pages) {
    const pg=await ctx.newPage(); const errs=[];
    pg.on("console",m=>{if(m.type()==="error")errs.push(m.text())}); pg.on("pageerror",e=>errs.push(String(e)));
    await pg.goto(`${B}/${p}`,{waitUntil:"load"}); await pg.waitForTimeout(2600);
    const ov=await pg.evaluate(()=>{const w=document.documentElement.clientWidth;const bad=[...document.querySelectorAll("body *")].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.right>w+1)&&getComputedStyle(e).position!=="fixed"&&!e.closest(".ticker,.gp,.reel,.cart,.dock")}).slice(0,5).map(e=>e.className+"|"+e.tagName);return {sw:document.documentElement.scrollWidth,w,bad,gp:document.getElementById('gp')?.className}});
    console.log(name,p||"(main)",JSON.stringify(ov),errs.slice(0,3).join(" ; "));
    const fn=(p||"main").replace(/\//g,"-");
    if(p===""||p==="uz"){await pg.screenshot({path:`${S}/shots/${name}-${fn}-gp0.png`});
      const H=await pg.evaluate(()=>innerHeight);
      for (const f of [0.5,0.9,1.3]) {await pg.evaluate(y=>window.scrollTo(0,y),H*f);await pg.waitForTimeout(400);await pg.screenshot({path:`${S}/shots/${name}-${fn}-gp${f}.png`});}
      await pg.evaluate(()=>document.getElementById('hero').scrollIntoView());await pg.waitForTimeout(800);
      await pg.screenshot({path:`${S}/shots/${name}-${fn}-hero.png`});
    } else await pg.screenshot({path:`${S}/shots/${name}-${fn}.png`});
    if(p===""&&name==="d") await pg.screenshot({path:`${S}/shots/${name}-${fn}-full.png`,fullPage:true});
    if(p==="blogery"&&name==="m") await pg.screenshot({path:`${S}/shots/${name}-${fn}-full.png`,fullPage:true});
    await pg.close();
  }
  await ctx.close();
}
const ctx=await b.newContext({viewport:{width:390,height:844}}); const pg=await ctx.newPage();
await pg.goto(`${B}/`,{waitUntil:"load"});await pg.waitForTimeout(500);
await pg.screenshot({path:`${S}/shots/m-splash.png`});
await b.close();
