const {chromium}=require('playwright');const OUT='../assets/';const w=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch({proxy:{server:process.env.HTTPS_PROXY}});
// comfort fit-check
let p=await b.newPage({viewport:{width:1920,height:1080}});await p.goto('https://cases.devuz.studio/comfort/a',{waitUntil:'networkidle'});await w(2500);
await p.getByText(/Конструктор/).last().click();await w(800);
await p.locator('[role=switch][aria-label^="«Влезет ли»"]').click();await w(1200);await p.keyboard.press('Escape');await w(800);
const h=p.getByText(/Влезет ли\? Проверьте/).first();
const sec=h.locator('xpath=ancestor::section[1]');
const sh=await sec.count()?await sec.evaluate(e=>e.getBoundingClientRect().height):0;console.log('comfort sec',sh);
await h.scrollIntoViewIfNeeded();await w(1500);
if(sh>300&&sh<1800){await sec.scrollIntoViewIfNeeded();await w(1500);await sec.screenshot({path:OUT+'comfort-vlezet-li.png'})}
else{await h.evaluate(e=>window.scrollBy(0,e.getBoundingClientRect().top-140));await w(1500);await p.screenshot({path:OUT+'comfort-vlezet-li.png'})}
await p.close();
// namuna estimate
p=await b.newPage({viewport:{width:1920,height:1080}});await p.goto('https://cases.devuz.studio/namuna',{waitUntil:'networkidle'});await w(3000);
for(let y=0;y<6000;y+=600){await p.evaluate(y=>scrollTo(0,y),y);await w(150)}
const e2=p.getByText(/Настройте под себя/).first();await e2.evaluate(e=>window.scrollBy(0,e.getBoundingClientRect().top-80));await w(1500);
await p.screenshot({path:OUT+'namuna-calculator-options.png'});
const e3=p.getByText(/Предварительная оценка/).first();await e3.evaluate(e=>window.scrollBy(0,e.getBoundingClientRect().top-560));await w(1500);
await p.screenshot({path:OUT+'namuna-calculator-estimate.png'});await p.close();
// delta sandbox card
p=await b.newPage({viewport:{width:1920,height:1080}});await p.goto('https://cases.devuz.studio/delta',{waitUntil:'networkidle'});await w(3000);
const card=p.getByText('Первая программа').first().locator('xpath=ancestor::*[.//*[contains(text(),"Запустить")]][1]');
await card.screenshot({path:OUT+'delta-rocket-sandbox-card.png'});console.log('delta ok');
await b.close()})();
