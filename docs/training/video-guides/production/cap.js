const {chromium,devices}=require('playwright');const fs=require('fs');const {execSync}=require('child_process');
const OUT = (process.env.VG_WORK || '.') + '/assets/';
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const T=require('./targets.js');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const log=(...a)=>console.log(new Date().toISOString().slice(11,19),...a);
async function settle(p){
  try{await p.waitForLoadState('networkidle',{timeout:20000})}catch{}
  await p.mouse.wheel(0,600);await sleep(600);await p.evaluate(()=>window.scrollTo(0,0));
  await sleep(2500);
  // wait out fullscreen intro overlays up to 8s
  const t0=Date.now();
  while(Date.now()-t0<5500){
    const cover=await p.evaluate(()=>{const W=innerWidth,H=innerHeight;
      return [...document.querySelectorAll('body *')].some(e=>{const s=getComputedStyle(e);if(s.position!=='fixed'||s.visibility==='hidden'||s.display==='none'||+s.opacity<0.05)return false;const r=e.getBoundingClientRect();return r.width>=W*0.95&&r.height>=H*0.95&&+s.zIndex>=10&&!/nav|header|chat|modal|dialog/i.test(e.className+'')})});
    if(!cover)break;await sleep(500);
  }
  await dismiss(p);
}
async function dismiss(p){try{const btn=p.locator('[role=status] button[aria-label="Скрыть"]');if(await btn.count()){await btn.first().click({timeout:2000});await sleep(700)}}catch{}}
async function scrollAll(p){
  const h=await p.evaluate(()=>document.documentElement.scrollHeight);
  for(let y=0;y<Math.min(h,12000);y+=700){await p.evaluate(y=>window.scrollTo(0,y),y);await sleep(150)}
  await p.evaluate(()=>window.scrollTo(0,0));await sleep(1200);
}
async function findBlock(p,needles){
  for(const n of needles){
    const r=await p.evaluate(n=>{
      const re=new RegExp(n,'i');
      const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let el=null,node;
      const cands=[];while(node=w.nextNode()){if(re.test(node.textContent)){const e=node.parentElement;const r=e.getBoundingClientRect();if(r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden')cands.push(e)}}
      // prefer headings
      el=cands.find(e=>/^H[1-4]$/.test(e.tagName))||cands[0];if(!el)return null;
      document.querySelectorAll('[data-shot]').forEach(e=>e.removeAttribute('data-shot'));
      el.setAttribute('data-shot','h');
      let s=el.closest('section')||el.parentElement;
      // grow until reasonable height
      while(s&&s.getBoundingClientRect().height<350&&s.parentElement&&s.parentElement!==document.body)s=s.parentElement;
      if(s)s.setAttribute('data-shot','s');
      return {tag:el.tagName,txt:el.textContent.trim().slice(0,60),sh:s?s.getBoundingClientRect().height:0};
    },n);
    if(r)return r;
  }return null;
}
async function blockShot(p,b,file){
  const info=await findBlock(p,b.find);
  if(!info){log('BLOCK NOT FOUND',file);return 'not found: '+b.find.join(' | ')}
  const sec=p.locator('[data-shot="s"]').first();const h=p.locator('[data-shot="h"]').first();
  await h.evaluate(e=>e.scrollIntoView({block:'center'}));await sleep(800);
  await sec.evaluate(e=>e.scrollIntoView({block:'start'}));await sleep(1500);
  const sh=await sec.evaluate(e=>e.getBoundingClientRect().height);
  if(sh>=300&&sh<=(b.maxH||2000)&&!b.viewport){await sec.screenshot({path:file});}
  else{await h.evaluate((e,off)=>{const r=e.getBoundingClientRect();window.scrollBy(0,r.top-(off??120))},b.offset);await sleep(1500);await p.screenshot({path:file});}
  log('block',file,JSON.stringify(info),Math.round(sh));return 'ok';
}
async function run(t,b){
  const res={name:t.name,files:[],errs:[]};
  try{
    // desktop
    const ctx=await b.newContext({viewport:{width:1920,height:1080},locale:'ru-RU'});
    const p=await ctx.newPage();
    const r=await p.goto(t.url,{waitUntil:'domcontentloaded',timeout:60000});res.status=r&&r.status();
    await settle(p);
    if(t.pre)await t.pre(p);
    await p.screenshot({path:OUT+t.name+'-desk.png'});res.files.push('desk');
    await scrollAll(p);
    const H=await p.evaluate(()=>document.documentElement.scrollHeight);res.height=H;
    await dismiss(p);await p.screenshot({path:OUT+t.name+'-full.png',fullPage:true,clip:{x:0,y:0,width:1920,height:Math.min(H,12000)}});res.files.push('full');
    for(const bl of (t.blocks||[])){const s=await blockShot(p,bl,OUT+t.name+'-'+bl.slug+'.png');if(s==='ok')res.files.push(bl.slug);else res.errs.push(bl.slug+': '+s)}
    if(t.after)await t.after(p,res,b);
    await ctx.close();
    // mobile
    const m=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:'ru-RU',userAgent:devices['iPhone 13'].userAgent});
    const mp=await m.newPage();await mp.goto(t.url,{waitUntil:'domcontentloaded',timeout:60000});await settle(mp);
    await mp.screenshot({path:OUT+t.name+'-mob.png'});res.files.push('mob');await m.close();
    // rec
    if(t.rec){
      const dir=__dirname+'/vid/'+t.name;fs.rmSync(dir,{recursive:true,force:true});
      const v=await b.newContext({viewport:{width:1920,height:1080},recordVideo:{dir,size:{width:1920,height:1080}},locale:'ru-RU'});
      const vp=await v.newPage();await vp.goto(t.url,{waitUntil:'domcontentloaded',timeout:60000});
      try{await vp.waitForLoadState('networkidle',{timeout:15000})}catch{}
      await vp.mouse.move(960,540);await sleep(3000);
      const t0=Date.now();let n=0;
      while(Date.now()-t0<25000){await vp.mouse.wheel(0,120);await sleep(60);n++;if(n%45===0)await sleep(1100);
        if(await vp.evaluate(()=>innerHeight+scrollY>=document.documentElement.scrollHeight-2))break;}
      await sleep(1500);const vid=vp.video();await v.close();
      const webm=await vid.path();const mp4=OUT+t.name+'-scroll.mp4';
      execSync(`ffmpeg -y -loglevel error -i "${webm}" -c:v libx264 -crf 23 -r 30 -pix_fmt yuv420p -movflags +faststart "${mp4}"`);fs.unlinkSync(webm);
      res.files.push('scroll.mp4');
    }
  }catch(e){res.errs.push(e.message.split('\n')[0])}
  log('DONE',JSON.stringify(res));return res;
}
(async()=>{
  const names=process.argv.slice(2);const list=T.filter(t=>!names.length||names.includes(t.name));
  const b=await chromium.launch({executablePath:EXE,proxy:{server:process.env.HTTPS_PROXY,bypass:'localhost,127.0.0.1'}});
  const results=[];const q=[...list];
  await Promise.all([0,1,2].map(async()=>{while(q.length){const t=q.shift();results.push(await run(t,b))}}));
  fs.writeFileSync(__dirname+'/results-'+Date.now()+'.json',JSON.stringify(results,null,1));
  await b.close();
})();
