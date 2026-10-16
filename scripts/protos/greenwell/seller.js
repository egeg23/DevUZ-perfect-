/* AI Seller: агенты Seller AI ведут магазины Greenwell на маркетплейсах.
   Шесть агентов, как в нашем Seller AI: конкуренты, цены, отзывы,
   поставки, карточки, реклама. У каждого три режима: выключен,
   «предлагает» (ждёт решения человека) и «сам» (действует в рамках
   правил). Сцена идёт по сценарию, по кругу, отдельно для каждой
   площадки: видно, что агент заметил, что посчитал и что сделал.
   Цифры демо. Анимации только transform и opacity. */
var AI=G.seller,AIT=null,AIrun=0,AImk=PS.aiMk||AI.markets[0].id;
PS.aiMode=PS.aiMode||{};PS.aiCnt=PS.aiCnt||{};
function aiMode(a){return PS.aiMode[AImk+':'+a]||AI.agents.filter(function(x){return x.id===a})[0].def}
function aiSleep(ms,run){return new Promise(function(r){setTimeout(function(){r(run===AIrun)},REDUCED?Math.min(ms,120):ms)})}
function aiMoney(n,mk){return mk.usd?'$'+(n/mk.rate).toFixed(2):fmt(n)+' '+t('sum')}
function aiCount(k,d){var key=AImk+':'+k;PS.aiCnt[key]=(PS.aiCnt[key]||AI.start[k])+(d||0);saveP();var el=$('[data-aik="'+k+'"]');if(el){el.textContent=fmt(PS.aiCnt[key]);if(d){el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump')}}return PS.aiCnt[key]}
function aiLog(agent,text,kind){var ol=$('#ai-log');if(!ol)return;var a=AI.agents.filter(function(x){return x.id===agent})[0];var li=d.createElement('li');li.className='in '+(kind||'');li.innerHTML='<span class="lt">'+tstr(Date.now())+'</span><span><b>'+ic(a.i)+h(a.n)+'</b> '+text+'</span>';ol.insertBefore(li,ol.firstChild);while(ol.children.length>14)ol.removeChild(ol.lastChild)}
function aiFocus(agent){$$('.ai-ag').forEach(function(x){x.classList.toggle('on',x.getAttribute('data-ag')===agent)})}

V.seller=function(){var mk=AI.markets.filter(function(m){return m.id===AImk})[0]||AI.markets[0];AImk=mk.id;
  var k=function(id){return fmt(PS.aiCnt[AImk+':'+id]||AI.start[id])};
  return '<div class="ph"><div><h1>AI Seller</h1><p class="muted">'+t('aiS')+'</p></div></div>'+
  '<div class="ai-mk" role="tablist">'+AI.markets.map(function(m){return '<button type="button" role="tab" aria-selected="'+(m.id===AImk)+'" data-mk="'+m.id+'" style="--c:'+m.c+'"><i></i>'+h(m.n)+'<small>'+h(m.status)+'</small></button>'}).join('')+'</div>'+
  '<div class="kpis k4">'+kpi(t('aiK1'),'<span data-aik="price">'+k('price')+'</span>','',t('aiK1s'))+kpi(t('aiK2'),'<span data-aik="reviews">'+k('reviews')+'</span>','',t('aiK2s'))+kpi(t('aiK3'),'<span data-aik="supply">'+k('supply')+'</span>','',t('aiK3s'))+kpi(t('aiK4'),'<span data-aik="hours">'+k('hours')+'</span>','',t('aiK4s'))+'</div>'+
  '<div class="ai-stage" style="--c:'+mk.c+'"><ul class="ai-ags">'+AI.agents.map(function(a){var m=aiMode(a.id);return '<li class="ai-ag" data-ag="'+a.id+'"><span class="ai-ic">'+ic(a.i)+'<i class="ai-pulse" aria-hidden="true"></i></span><span class="ai-n"><b>'+h(a.n)+'</b><small>'+h(a.w)+'</small></span><span class="ai-md" role="radiogroup" aria-label="'+t('aiMode')+'">'+['off','ask','auto'].map(function(x){return '<button type="button" role="radio" aria-checked="'+(m===x)+'" data-md="'+x+'" data-for="'+a.id+'">'+t('aiM_'+x)+'</button>'}).join('')+'</span></li>'}).join('')+'</ul>'+
  '<div class="ai-main"><div class="ai-scene" id="ai-scene" aria-live="polite"></div><div class="ai-q" id="ai-q"></div></div>'+
  '<div class="ai-side"><h3>'+t('aiLog')+'</h3><ol class="ai-log" id="ai-log"></ol></div></div>'+
  '<div class="cols">'+card(t('aiHow'),'<ol class="ai-how">'+AI.how.map(function(x){return '<li>'+h(x)+'</li>'}).join('')+'</ol>','w2')+card(t('aiFmt'),'<ul class="ai-fmt">'+AI.formats.map(function(f){return '<li><b>'+h(f.p)+'</b><span>'+h(f.t)+'</span><small>'+h(f.e)+'</small></li>'}).join('')+'</ul>')+'</div>'+
  '<p class="demo">'+t('aiDemo')+'</p>'};
V.seller_on=function(){$$('[data-mk]').forEach(function(b){b.onclick=function(){AImk=b.getAttribute('data-mk');PS.aiMk=AImk;saveP();redraw()}});
  $$('[data-md]').forEach(function(b){b.onclick=function(){var a=b.getAttribute('data-for'),m=b.getAttribute('data-md');PS.aiMode[AImk+':'+a]=m;saveP();$$('[data-for="'+a+'"]').forEach(function(x){x.setAttribute('aria-checked',x===b)});aiLog(a,t('aiModeSet',{m:t('aiM_'+m)}),'sys')}});
  aiPlay()};

/* Сценарий: шаги по кругу. Новый показ (смена вкладки, площадки) обрывает прежний. */
function aiPlay(){var run=++AIrun,mk=AI.markets.filter(function(m){return m.id===AImk})[0],i=0;
  (async function(){while(run===AIrun&&d.body.contains($('#ai-scene')||d.createElement('i'))){var st=AI.steps[i%AI.steps.length];i++;
    if(!$('#ai-scene'))return;aiFocus(st.a);var mode=aiMode(st.a);
    if(mode==='off'){aiLog(st.a,t('aiOffSkip'),'sys');if(!await aiSleep(900,run))return;continue}
    if(!await aiStep(st,mk,mode,run))return;if(!await aiSleep(1600,run))return}})()}
function scene(html){var s=$('#ai-scene');if(!s)return null;s.innerHTML='<div class="sc">'+html+'</div>';var sc=s.firstChild;requestAnimationFrame(function(){sc.classList.add('on')});return sc}
function step(sc,sel){var el=$(sel,sc);if(el)el.classList.add('on');return el}
async function ask(sc,st,run,mk){var bar=d.createElement('div');bar.className='ai-ask';bar.innerHTML='<span>'+ic('alert')+t('aiAsk')+'</span><button type="button" class="btn btn-g sm" data-y>'+t('aiYes')+'</button><button type="button" class="btn btn-ghost sm" data-n>'+t('aiNo')+'</button>';sc.appendChild(bar);
  return new Promise(function(res){var done=false,to=setTimeout(function(){fin('wait')},REDUCED?400:9000);
    function fin(r){if(done)return;done=true;clearTimeout(to);bar.remove();res(r)}
    $('[data-y]',bar).onclick=function(){fin('yes')};$('[data-n]',bar).onclick=function(){fin('no')}})}
function queue(st,text){var q=$('#ai-q');if(!q)return;var b=d.createElement('div');b.className='ai-qi';b.innerHTML='<span>'+ic('alert')+'<b>'+t('aiWaits')+'</b> '+text+'</span><button type="button" class="btn btn-g sm">'+t('aiYes')+'</button>';q.appendChild(b);$('button',b).onclick=function(){b.remove();aiLog(st.a,t('aiApprovedLater'),'ok')}}

async function aiStep(st,mk,mode,run){var p=P[st.p]||P.mgc,base=Math.round(p.price*mk.k/100/100)*100,img='<img src="'+IMG+'/p-'+p.id+'-s.webp" alt="" width="40" height="76">';
  var w=function(ms){return aiSleep(ms,run)};
  if(st.a==='rivals'){var rv=Math.round(base*0.985/100)*100,rv2=Math.round(rv*0.96/100)*100;
    var sc=scene('<p class="sc-k">'+ic('search')+t('aiRivK')+'</p><div class="tags"><div class="tag me">'+img+'<span><b>'+h(p.n)+'</b><small>Greenwell</small></span><em>'+aiMoney(base,mk)+'</em></div><div class="tag rv"><span class="ph-b">'+ic('box')+'</span><span><b>'+h(st.rival)+'</b><small>'+t('aiRival')+'</small></span><em><s class="old">'+aiMoney(rv,mk)+'</s><b class="new">'+aiMoney(rv2,mk)+'</b></em></div></div><p class="sc-r">'+t('aiRivR',{n:'4%'})+'</p>');
    if(!await w(1300))return false;step(sc,'.tag.rv');if(!await w(900))return false;step(sc,'.sc-r');aiLog(st.a,t('aiRivL',{r:h(st.rival),n:'4%'}));return w(1400)}
  if(st.a==='price'){var np=Math.round(base*0.981/100)*100,m0=mk.margin,m1=m0-1.4;
    var sc=scene('<p class="sc-k">'+ic('tag')+t('aiPriceK')+'</p><div class="pr-card">'+img+'<div><b>'+h(p.n)+'</b><p class="pr-n"><s>'+aiMoney(base,mk)+'</s><span class="pr-v">'+aiMoney(base,mk)+'</span></p></div></div><div class="mg-bar"><i class="mg-f" style="--k:'+(m0/100).toFixed(3)+'"></i><i class="mg-floor" style="--x:'+(mk.floor/100).toFixed(3)+'"></i><span>'+t('aiMargin')+' <b class="mg-v">'+m0.toFixed(1).replace('.',',')+'%</b> · '+t('aiFloor')+' '+mk.floor+'%</span></div><p class="sc-r">'+t('aiPriceR',{f:mk.floor})+'</p>');
    if(!await w(900))return false;var v=$('.pr-v',sc),mv=$('.mg-v',sc),f=$('.mg-f',sc),t0=performance.now();
    await new Promise(function(res){(function an(now){var k=Math.min(1,(now-t0)/(REDUCED?1:900)),e=1-Math.pow(1-k,3);if(v)v.textContent=aiMoney(Math.round((base+(np-base)*e)/100)*100,mk);if(mv)mv.textContent=(m0+(m1-m0)*e).toFixed(1).replace('.',',')+'%';if(f)f.style.setProperty('--k',((m0+(m1-m0)*e)/100).toFixed(3));if(k<1)requestAnimationFrame(an);else res()})(t0)});
    step(sc,'.pr-n');step(sc,'.sc-r');
    if(mode==='ask'){var r=await ask(sc,st,run,mk);if(run!==AIrun)return false;
      if(r==='no'){aiLog(st.a,t('aiPriceNo'),'no');return w(900)}
      if(r==='wait'){queue(st,h(p.n)+': '+aiMoney(np,mk));aiLog(st.a,t('aiQueued'),'sys');return w(600)}}
    aiCount('price',1);aiCount('hours',0.2);aiLog(st.a,t('aiPriceL',{p:h(p.n),a:aiMoney(base,mk),b:aiMoney(np,mk)}),'ok');return w(1200)}
  if(st.a==='reviews'){var sc=scene('<p class="sc-k">'+ic('star')+t('aiRevK')+'</p><div class="rv-b"><p class="rs">★★<i>★★★</i></p><p>'+h(st.text)+'</p><small>'+h(st.who)+' · '+h(p.n)+'</small></div><p class="rv-tag">'+ic('alert')+t('aiClaim')+'</p><div class="rv-r"><b>Greenwell</b><p class="ty"></p></div>');
    if(!await w(900))return false;step(sc,'.rv-tag');if(!await w(800))return false;step(sc,'.rv-r');var ty=$('.ty',sc),txt=st.reply;
    for(var c=0;c<=txt.length;c+=3){if(run!==AIrun)return false;if(ty)ty.textContent=txt.slice(0,c);await aiSleep(26,run)}if(ty)ty.textContent=txt;
    if(mode==='ask'){var r=await ask(sc,st,run,mk);if(run!==AIrun)return false;if(r==='no'){aiLog(st.a,t('aiRevNo'),'no');return w(900)}if(r==='wait'){queue(st,t('aiRevQ'));aiLog(st.a,t('aiQueued'),'sys');return w(600)}}
    var ok=d.createElement('p');ok.className='sc-ok';ok.innerHTML=ic('check')+t('aiRevDone');sc.appendChild(ok);aiCount('reviews',1);aiCount('hours',0.1);aiLog(st.a,t('aiRevL'),'ok');return w(1500)}
  if(st.a==='supply'){var left=G.stock[p.id]||22,days=Math.max(4,Math.round(left/2.4)),qty=st.qty;
    var sc=scene('<p class="sc-k">'+ic('truck')+t('aiSupK')+'</p><div class="sp-row"><div class="pr-card">'+img+'<div><b>'+h(p.n)+'</b><p>'+t('aiLeft',{n:left})+' · <b class="warn">'+t('aiDays',{n:days})+'</b></p></div></div><div class="wh"><span class="wh-ic">'+ic('home')+'</span><small>'+h(mk.wh)+'</small></div></div><div class="boxes" aria-hidden="true">'+[0,1,2,3,4,5].map(function(i){return '<i style="--i:'+i+'">'+ic('box')+'</i>'}).join('')+'</div><p class="sc-r">'+t('aiSupR',{n:qty,d:st.slot})+'</p>');
    if(!await w(1100))return false;
    if(mode==='ask'){var r=await ask(sc,st,run,mk);if(run!==AIrun)return false;if(r==='no'){aiLog(st.a,t('aiSupNo'),'no');return w(900)}if(r==='wait'){queue(st,t('aiSupQ',{n:qty,p:h(p.n)}));aiLog(st.a,t('aiQueued'),'sys');return w(600)}}
    step(sc,'.boxes');if(!await w(1500))return false;step(sc,'.sc-r');aiCount('supply',1);aiCount('hours',0.5);aiLog(st.a,t('aiSupL',{n:qty,p:h(p.n),w:h(mk.wh),d:st.slot}),'ok');return w(1400)}
  if(st.a==='content'){var sc=scene('<p class="sc-k">'+ic('pen')+t('aiConK')+'</p><div class="ct"><p class="ct-b"><small>'+t('aiWas')+'</small>'+h(st.before)+'</p><p class="ct-a"><small>'+t('aiNow')+'</small>'+st.after.split('|').map(function(s,i){return i%2?'<mark>'+h(s)+'</mark>':h(s)}).join('')+'</p></div><p class="sc-r">'+t('aiConR')+'</p>');
    if(!await w(1200))return false;step(sc,'.ct-a');if(!await w(900))return false;step(sc,'.sc-r');
    if(mode==='ask'){var r=await ask(sc,st,run,mk);if(run!==AIrun)return false;if(r==='no'){aiLog(st.a,t('aiConNo'),'no');return w(900)}if(r==='wait'){queue(st,t('aiConQ'));aiLog(st.a,t('aiQueued'),'sys');return w(600)}}
    aiCount('hours',0.3);aiLog(st.a,t('aiConL',{p:h(p.n)}),'ok');return w(1400)}
  if(st.a==='ads'){var sc=scene('<p class="sc-k">'+ic('chart')+t('aiAdsK')+'</p><div class="ads"><div><small>'+t('aiBid')+'</small><b class="ad-v">'+aiMoney(st.bid0,mk)+'</b></div><div><small>'+t('aiDrr')+'</small><b class="ad-d">'+st.drr0+'%</b></div></div><div class="ad-bar"><i style="--k:'+(st.drr0/30).toFixed(3)+'" class="ad-f"></i></div><p class="sc-r">'+t('aiAdsR',{a:st.drr0,b:st.drr1})+'</p>');
    if(!await w(1100))return false;
    if(mode==='ask'){var r=await ask(sc,st,run,mk);if(run!==AIrun)return false;if(r==='no'){aiLog(st.a,t('aiAdsNo'),'no');return w(900)}if(r==='wait'){queue(st,t('aiAdsQ'));aiLog(st.a,t('aiQueued'),'sys');return w(600)}}
    var a=$('.ad-v',sc),dd=$('.ad-d',sc),fb=$('.ad-f',sc);if(a)a.textContent=aiMoney(st.bid1,mk);if(dd)dd.textContent=st.drr1+'%';if(fb)fb.style.setProperty('--k',(st.drr1/30).toFixed(3));sc.classList.add('done');step(sc,'.sc-r');aiCount('hours',0.2);aiLog(st.a,t('aiAdsL',{a:st.drr0,b:st.drr1}),'ok');return w(1500)}
  return w(500)}
