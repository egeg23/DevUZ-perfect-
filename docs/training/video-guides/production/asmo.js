const {chromium,devices}=require('playwright');const fs=require('fs');const {execSync}=require('child_process');
const OUT='../assets/';const T='A'.repeat(43);const w=ms=>new Promise(r=>setTimeout(r,ms));
const U=(n,pg='')=>`http://localhost:4811/${n}/proto/${T}/${pg}`;
async function settle(p){try{await p.waitForLoadState('networkidle',{timeout:15000})}catch{};await p.mouse.wheel(0,600);await w(600);await p.evaluate(()=>scrollTo(0,0));await w(5000)}
async function cons(p,file){const s=p.locator('section#konstruktor');await s.scrollIntoViewIfNeeded();await w(800);
 const h=await s.evaluate(e=>e.getBoundingClientRect().height);
 for(let y=0;y<h;y+=500){await p.evaluate(y=>{const e=document.querySelector('section#konstruktor');scrollTo(0,e.getBoundingClientRect().top+scrollY+y)},y);await w(250)}
 await s.evaluate(e=>e.scrollIntoView());await w(1500);await s.screenshot({path:file});console.log('cons',file,h)}
(async()=>{const b=await chromium.launch();
 // asmo main
 let c=await b.newContext({viewport:{width:1920,height:1080}});let p=await c.newPage();await p.goto(U('asmo'),{waitUntil:'domcontentloaded'});await settle(p);
 await p.screenshot({path:OUT+'asmo-desk.png'});
 let H=await p.evaluate(()=>document.documentElement.scrollHeight);for(let y=0;y<Math.min(H,12000);y+=700){await p.evaluate(y=>scrollTo(0,y),y);await w(200)}
 await p.evaluate(()=>scrollTo(0,0));await w(1500);H=await p.evaluate(()=>document.documentElement.scrollHeight);
 await p.screenshot({path:OUT+'asmo-full.png',fullPage:true,clip:{x:0,y:0,width:1920,height:Math.min(H,12000)}});console.log('asmo H',H);
 await p.goto(U('asmo','plan'),{waitUntil:'networkidle'});await w(2500);await cons(p,OUT+'asmo-constructor.png');
 await p.goto(U('pkvesta','plan'),{waitUntil:'networkidle'});await w(2500);await cons(p,OUT+'pkvesta-constructor.png');await c.close();
 c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,userAgent:devices['iPhone 13'].userAgent});p=await c.newPage();
 await p.goto(U('asmo'),{waitUntil:'domcontentloaded'});await settle(p);await p.screenshot({path:OUT+'asmo-mob.png'});await c.close();
 // recording
 const dir=__dirname+'/vid/asmo';fs.rmSync(dir,{recursive:true,force:true});
 c=await b.newContext({viewport:{width:1920,height:1080},recordVideo:{dir,size:{width:1920,height:1080}}});p=await c.newPage();
 await p.goto(U('asmo','plan'),{waitUntil:'networkidle'});await w(1000);
 const s=p.locator('section#konstruktor');await s.scrollIntoViewIfNeeded();
 const first=p.locator('section#konstruktor label').first();
 await first.evaluate(e=>window.scrollBy(0,e.getBoundingClientRect().top-330));await w(2000);
 const st=await p.evaluate(()=>[...document.querySelectorAll('section#konstruktor *')].filter(e=>/\$\s?[\d\s]{3,}/.test(e.innerText||'')&&e.childElementCount===0).map(e=>{const r=e.getBoundingClientRect();return Math.round(r.top)+':'+e.innerText.trim()}).slice(-6));console.log('price els',st);
 for(const i of [0,1,2]){const l=p.locator('section#konstruktor label').nth(i);await l.hover();await w(400);await l.click();await w(1500)}
 await w(2000);const vid=p.video();await c.close();const webm=await vid.path();
 execSync(`ffmpeg -y -loglevel error -i "${webm}" -c:v libx264 -crf 23 -r 30 -pix_fmt yuv420p -movflags +faststart ${OUT}asmo-constructor-toggle.mp4`);fs.unlinkSync(webm);
 await b.close()})();
