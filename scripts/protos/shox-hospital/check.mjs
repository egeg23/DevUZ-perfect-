import { chromium } from "playwright-core";
// Проверка в Chromium: горизонтальная прокрутка, ошибки скрипта, пролёт, запись, снимки.
// node check.mjs <каталог для снимков>  (сначала node serve.mjs)
const S=process.argv[2], T="A".repeat(43), B=`http://localhost:4790/proto/${T}`;
const pages=["","plan","uz","uz/plan","en","en/plan"];
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
let bad=0;
for (const [name,vp] of [["m",{width:390,height:844}],["d",{width:1440,height:900}]]) {
  const ctx=await b.newContext({viewport:vp,deviceScaleFactor:name==="m"?2:1,isMobile:name==="m",hasTouch:name==="m"});
  for (const p of pages) {
    const pg=await ctx.newPage(); const errs=[];
    pg.on("console",m=>{if(m.type()==="error")errs.push(m.text())}); pg.on("pageerror",e=>errs.push(String(e)));pg.on("response",r=>{if(r.status()>=400)errs.push(r.status()+" "+r.url())});
    await pg.goto(`${B}/${p}`,{waitUntil:"load"}); await pg.waitForTimeout(1800);
    const ov=await pg.evaluate(()=>{const w=document.documentElement.clientWidth;const out=[...document.querySelectorAll("body *")].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.right>w+1&&getComputedStyle(e).position!=="fixed"&&!e.closest(".deco,.fly-world,.chips,.days,.rv-wrap,.kd,.dsc,.dock")}).slice(0,5).map(e=>e.className+"|"+e.tagName);return {sw:document.documentElement.scrollWidth,w,out}});
    if(ov.sw>ov.w||ov.out.length||errs.length)bad++;
    console.log(name,(p||"(main)").padEnd(8),JSON.stringify(ov),errs.slice(0,3).join(" ; "));
    const fn=(p||"main").replace(/\//g,"-");
    await pg.screenshot({path:`${S}/${name}-${fn}-0.png`});
    if(p===""||p==="uz"){
      const H=await pg.evaluate(()=>innerHeight);
      for (const f of [0.6,1.6,2.8,4.2]) {await pg.mouse.wheel(0,0);await pg.evaluate(y=>window.scroll(0,y),H*f);await pg.waitForTimeout(450);await pg.screenshot({path:`${S}/${name}-${fn}-fly${f}.png`});}
    }
    if(p===""){
      // Запись: направление → врач → время → форма.
      await pg.goto(`${B}/#zapis`);await pg.waitForTimeout(900);
      await pg.click('#bk-dirs [data-dir="cardio"]');await pg.waitForTimeout(300);
      await pg.click('#bk-docs [data-doc="ibragimova"]');await pg.waitForTimeout(300);
      await pg.click('#bk-slots .slot:not([disabled])');await pg.waitForTimeout(400);
      await pg.screenshot({path:`${S}/${name}-book.png`});
      await pg.goto(`${B}/#ceny`);await pg.waitForTimeout(600);await pg.fill('#pq','мрт');await pg.waitForTimeout(200);
      console.log("  прейскурант «мрт»:",await pg.textContent('#pcount'));
      await pg.screenshot({path:`${S}/${name}-prices.png`});
      await pg.screenshot({path:`${S}/${name}-full.png`,fullPage:true});
    }
    await pg.close();
  }
  await ctx.close();
}
// Скидка: успели нажать — код виден в форме.
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}); const pg=await ctx.newPage();
await pg.goto(`${B}/`);await pg.waitForTimeout(2400);
await pg.screenshot({path:`${S}/m-discount.png`});
await pg.click('#dsc .dsc-go');await pg.waitForTimeout(300);
await pg.screenshot({path:`${S}/m-discount-won.png`});
console.log("скидка:",await pg.evaluate(()=>localStorage.getItem('shox_discount')), "в форме:", await pg.evaluate(()=>document.querySelector('.disc.on [data-code]')?.textContent));
await pg.click('#kd-pill');await pg.waitForTimeout(500);await pg.screenshot({path:`${S}/m-kit.png`});
await b.close();
console.log(bad?`ПРОБЛЕМ: ${bad}`:"ok");
process.exitCode=bad?1:0;
