(function(){
var d=document, root=d.documentElement, reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
var L=JSON.parse(d.getElementById('i18n').textContent), LANG=root.lang==='uz'?'uz':'ru';
var C=JSON.parse(d.getElementById('cat').textContent).map(function(r){return {h:r[0],f:r[1],er:r[2],n:r[3],city:r[4],story:r[5],post:r[6],top:!!r[7],ig:r[8]}});
var TG='https://t.me/baluevgeorge?text=';
function tg(text){return TG+encodeURIComponent(text.slice(0,1800))}
function $(id){return d.getElementById(id)}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function fmtK(n){if(n>=1e6)return (Math.round(n/1e5)/10+'M').replace('.',',');if(n>=1e3){var k=n/1e3;return (k>=100?Math.round(k):Math.round(k*10)/10)+'K'}return String(n)}
function fmtK2(n){return fmtK(n).replace('.',',')}
function money(n){if(n==null)return '—';return '$'+String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function int(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function niche(k){return (L.niches[k]||{}).name||k}
function color(k){return (L.niches[k]||{}).c||'#5395E9'}
var store={get:function(k,def){try{var v=localStorage.getItem(k);return v==null?def:JSON.parse(v)}catch(e){return def}},set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};

/* Заставка: пока грузится страница, не дольше 2,2 с, тапом — сразу. */
var dz=$('dz');
if(dz&&!root.classList.contains('dz-off')){
  var t0=performance.now(), gone=false;
  var hide=function(){if(gone)return;gone=true;dz.classList.add('out');try{sessionStorage.setItem('dz','1')}catch(e){}setTimeout(function(){dz.remove()},450)};
  var ready=function(){var wait=Math.max(0,(reduce?300:1100)-(performance.now()-t0));setTimeout(hide,wait)};
  if(d.readyState==='complete')ready();else addEventListener('load',ready);
  setTimeout(hide,2200);
  dz.addEventListener('click',hide);
  addEventListener('keydown',hide,{once:true});
}else if(dz){dz.remove()}

/* Появление: у каждого блока своё движение (класс a-*). */
var rv=d.querySelectorAll('.rv');
if('IntersectionObserver' in window&&!reduce){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
  rv.forEach(function(el){io.observe(el)});
}else rv.forEach(function(el){el.classList.add('in')});

/* Кнопка под большим пальцем — когда первый экран ушёл вверх. */
var dock=$('dock'), hero=$('hero');
if(dock&&hero&&'IntersectionObserver' in window){
  new IntersectionObserver(function(es){var e=es[0];dock.classList.toggle('on',!e.isIntersecting&&e.boundingClientRect.top<0)}).observe(hero);
}else if(dock)dock.classList.add('on');

/* Копировать текст */
d.addEventListener('click',function(e){
  var b=e.target.closest&&e.target.closest('[data-copy]');if(!b)return;
  var src=b.getAttribute('data-copy'), el=src?$(src):null, text=el?el.innerText:b.parentNode.innerText.replace(b.innerText,'').trim();
  try{navigator.clipboard.writeText(text).then(function(){var o=b.textContent;b.textContent=L.copied;setTimeout(function(){b.textContent=o},1400)})}catch(err){}
});

/* ── Сторис-плеер на первом экране ───────────────────────────────────── */
var screen=$('screen');
if(screen){
  var picks=C.filter(function(b){return b.top&&b.story&&b.post}).sort(function(a,b){return b.f-a.f}).slice(0,6);
  var bars='<div class="bars" aria-hidden="true">'+picks.map(function(){return '<i><b></b></i>'}).join('')+'</div>';
  screen.innerHTML=bars+picks.map(function(b,i){
    return '<div class="st'+(i?'':' on')+'" style="--cc:'+color(b.n)+'" aria-hidden="'+(i?'true':'false')+'">'+
      '<div class="st-head"><span class="ava">'+esc(b.h[0].toUpperCase())+'</span><div><b>@'+esc(b.h)+'</b><span>'+esc(niche(b.n))+' · '+esc(b.city)+'</span></div></div>'+
      '<div class="st-mid"><span class="lbl">'+L.followers+'</span><span class="big">'+fmtK2(b.f)+'</span><div class="st-tags">'+(b.er!=null?'<span>ER '+String(b.er).replace('.',',')+'%</span>':'')+'<span>'+L.exclusive+'</span></div></div>'+
      '<div class="st-foot"><div><small>Story</small><b>'+money(b.story)+'</b></div><div><small>Post</small><b>'+money(b.post)+'</b></div></div></div>';
  }).join('')+'<button class="tapzone" type="button" aria-label="'+esc(L.next)+'"></button>';
  var sts=screen.querySelectorAll('.st'), bi=screen.querySelectorAll('.bars i'), cur=0, timer=0, visible=true;
  var live=$('st-live');
  function show(i){
    cur=(i+sts.length)%sts.length;
    sts.forEach(function(s,k){s.classList.toggle('on',k===cur);s.setAttribute('aria-hidden',String(k!==cur))});
    bi.forEach(function(b,k){b.className=k<cur?'done':k===cur?'now':''});
    if(live)live.textContent='@'+picks[cur].h;
    clearTimeout(timer);if(!reduce&&visible)timer=setTimeout(function(){show(cur+1)},3600);
  }
  screen.querySelector('.tapzone').addEventListener('click',function(){show(cur+1)});
  if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;if(visible)show(cur);else clearTimeout(timer)}).observe(screen);
  show(0);
}

/* ── Карточка блогера ─────────────────────────────────────────────────── */
var cart=store.get('ba-cart',[]);
function inCart(h){return cart.indexOf(h)>=0}
function card(b,why){
  var per=b.story&&b.f?b.story/b.f*1000:null;
  return '<article class="bc" style="--cc:'+color(b.n)+'">'+(b.top?'<span class="star">★ TOP</span>':'')+
    '<div class="bc-top"><span class="ava">'+esc(b.h[0].toUpperCase())+'</span><div><a href="https://www.instagram.com/'+esc(b.ig)+'/" rel="nofollow noopener" target="_blank">@'+esc(b.h)+'</a><span>'+esc(niche(b.n))+' · '+esc(b.city||'—')+'</span></div></div>'+
    '<div class="bc-nums"><div><small>'+L.subs+'</small><b>'+fmtK2(b.f)+'</b></div><div><small>ER</small><b>'+(b.er!=null?String(b.er).replace('.',',')+'%':'—')+'</b></div><div><small>Story</small><b>'+money(b.story)+'</b></div></div>'+
    (why?'<p class="why">'+esc(why)+'</p>':'')+
    '<div class="bc-foot"><span>Post '+money(b.post)+(per?' · '+L.per1k.replace('{v}',money(per).replace('$','$')):'')+'</span><button class="add" type="button" data-h="'+esc(b.h)+'" aria-pressed="'+inCart(b.h)+'">'+(inCart(b.h)?L.added:L.add)+'</button></div></article>';
}
var cartBar=$('cart');
function drawCart(){
  store.set('ba-cart',cart);
  d.querySelectorAll('.add[data-h]').forEach(function(b){var on=inCart(b.dataset.h);b.setAttribute('aria-pressed',String(on));b.textContent=on?L.added:L.add});
  if(!cartBar)return;
  var list=C.filter(function(b){return inCart(b.h)});
  cartBar.classList.toggle('on',list.length>0);d.body.classList.toggle('has-cart',list.length>0);
  var st=list.reduce(function(s,b){return s+(b.story||0)},0), fl=list.reduce(function(s,b){return s+b.f},0);
  $('cart-n').textContent=L.cartN.replace('{n}',list.length);
  $('cart-s').textContent=L.cartS.replace('{f}',fmtK2(fl)).replace('{m}',money(st));
  $('cart-go').href=tg(L.cartTg+'\n'+list.map(function(b){return '@'+b.h+' — Story '+money(b.story)+', Post '+money(b.post)}).join('\n'));
}
d.addEventListener('click',function(e){
  var b=e.target.closest&&e.target.closest('.add[data-h]');if(!b)return;
  var h=b.dataset.h,i=cart.indexOf(h);if(i>=0)cart.splice(i,1);else cart.push(h);drawCart();
});
var clear=$('cart-clear');if(clear)clear.addEventListener('click',function(){cart=[];drawCart()});
drawCart();

/* ── Обращение к модели через наш сервер ─────────────────────────────── */
function token(){var m=location.pathname.match(/\/proto\/([A-Za-z0-9_-]{43})/);return m?m[1]:''}
function ask(tool,payload){
  var tok=token();if(!tok||!window.fetch)return Promise.resolve(null);
  var ctl='AbortController' in window?new AbortController():null, t=setTimeout(function(){if(ctl)ctl.abort()},25000);
  return fetch('/api/proto-ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({token:tok,tool:tool,locale:LANG},payload)),signal:ctl?ctl.signal:undefined})
    .then(function(r){return r.json()}).then(function(j){clearTimeout(t);return j&&j.ok?j.result:null}).catch(function(){clearTimeout(t);return null});
}
function badge(el,live){el.className='badge '+(live?'live':'demo');el.textContent=live?L.live:L.demo;el.hidden=false}

/* ── Подбор по брифу ─────────────────────────────────────────────────── */
var KW=L.kw;
function guess(text){
  var t=text.toLowerCase(), ns=[];
  Object.keys(KW).forEach(function(k){if(KW[k].some(function(w){return t.indexOf(w)>=0}))ns.push(k)});
  var budget=null, m=t.match(/(\d[\d\s.,]*)\s*(\$|usd|долл|dollar|dol)/)||t.match(/\$\s*(\d[\d\s.,]*)/);
  if(m)budget=parseFloat(m[1].replace(/[\s,]/g,'').replace(/\.(?=\d{3})/g,''));
  else{var s=t.match(/(\d[\d\s.,]*)\s*(млн|mln|million)/);if(s)budget=parseFloat(s[1].replace(',','.'))*1e6/12650;else{var u=t.match(/(\d[\d\s]*)\s*(сум|so.m|sum)/);if(u)budget=parseFloat(u[1].replace(/\s/g,''))/12650}}
  var goal=/прода|заказ|sotuv|savdo|buyurtma|продаж/.test(t)?'sales':/откры|запуск|ochil|yangi/.test(t)?'launch':/отзыв|sharh|fikr/.test(t)?'reviews':'awareness';
  var formats=/пост|post|reels|рилс/.test(t)?['post']:/сторис|stor/.test(t)?['story']:[];
  return {niches:ns.length?ns.slice(0,3):['life'],budget_usd:budget&&budget>0?Math.round(budget):null,goal:goal,formats:formats,cities:/андижан|andijon/.test(t)?['Андижан']:[],summary:'',tips:[]};
}
function pick(p){
  var fmt=p.formats&&p.formats[0]==='post'?'post':'story', ns=p.niches||[];
  var scored=C.filter(function(b){return b[fmt]}).map(function(b){
    var s=0,why=[],i=ns.indexOf(b.n);
    if(i===0){s+=5;why.push(L.whyNiche.replace('{n}',niche(b.n)))}else if(i>0){s+=3;why.push(L.whyNiche.replace('{n}',niche(b.n)))}
    if(p.cities&&p.cities.some(function(c){return b.city.indexOf(c)>=0})){s+=1;why.push(b.city)}
    var er=b.er||0;
    if(p.goal==='sales'||p.goal==='reviews'){s+=Math.min(er,12)/4;if(er>=3)why.push(L.whyEr.replace('{v}',String(er).replace('.',',')))}
    else{s+=Math.log10(b.f)-4;if(b.f>=150000)why.push(L.whyReach.replace('{v}',fmtK2(b.f)))}
    if(p.goal==='reviews'&&b.f<60000){s+=1;why.push(L.whyMicro)}
    if(b.top)s+=.3;
    return {b:b,s:s,why:why.join(' · ')};
  }).sort(function(a,b){return b.s-a.s});
  var out=[],spent=0,budget=p.budget_usd;
  for(var i=0;i<scored.length&&out.length<6;i++){
    var price=scored[i].b[fmt];
    if(budget&&spent+price>budget)continue;
    out.push(scored[i]);spent+=price;
    if(!budget&&out.length>=5)break;
  }
  return {list:out,spent:spent,fmt:fmt};
}
function matcher(box){
  var ta=box.querySelector('textarea'), go=box.querySelector('[data-go]'), res=box.querySelector('.res'), th=box.querySelector('.thinking'), bd=box.querySelector('.badge');
  box.querySelectorAll('.ex button').forEach(function(b){b.addEventListener('click',function(){ta.value=b.textContent;ta.focus()})});
  go.addEventListener('click',function(){
    var text=ta.value.trim();if(text.length<3){ta.focus();return}
    go.disabled=true;th.classList.add('on');res.hidden=true;
    ask('match',{text:text,niches:Object.keys(L.niches)}).then(function(r){
      var live=!!(r&&r.niches&&r.niches.length), p=live?r:guess(text);
      if(live&&!p.budget_usd){var g=guess(text);p.budget_usd=g.budget_usd}
      var m=pick(p), fl=m.list.reduce(function(s,x){return s+x.b.f},0);
      var lo=m.spent/6*1000, hi=m.spent/1.75*1000;
      res.innerHTML='<div class="res-sum"><b>'+esc(p.summary||L.matchSum.replace('{n}',p.niches.map(niche).join(', ')))+'</b>'+
        '<ul class="chips"><li class="chip">'+L.picked+' <b>'+m.list.length+'</b></li><li class="chip">'+L.reach+' <b>'+fmtK2(fl)+'</b></li><li class="chip">'+(m.fmt==='post'?'Post':'Story')+' <b>'+money(m.spent)+'</b></li>'+(m.spent?'<li class="chip">'+L.views+' <b>'+fmtK2(lo)+'–'+fmtK2(hi)+'</b></li>':'')+'</ul>'+
        (p.tips&&p.tips.length?'<p>'+p.tips.map(esc).join(' · ')+'</p>':'')+'<p>'+L.matchNote+'</p></div>'+
        '<div class="cat-grid">'+m.list.map(function(x){return card(x.b,x.why)}).join('')+'</div>'+
        '<div class="ai-actions"><a class="btn btn-main" href="'+tg(L.matchTg+'\n'+text+'\n\n'+m.list.map(function(x){return '@'+x.b.h}).join(', '))+'">'+L.matchCta+'</a></div>';
      res.hidden=false;th.classList.remove('on');go.disabled=false;badge(bd,live);drawCart();
    });
  });
}
d.querySelectorAll('[data-matcher]').forEach(matcher);

/* ── Каталог ─────────────────────────────────────────────────────────── */
var grid=$('cat-grid');
if(grid){
  var state={n:'all',size:'all',sort:'er',max:2000};
  var tabs=d.querySelectorAll('#cat-tabs .tab');
  function draw(){
    var list=C.filter(function(b){
      if(state.n==='top'&&!b.top)return false;
      if(state.n!=='all'&&state.n!=='top'&&b.n!==state.n)return false;
      if(state.size==='s'&&b.f>=30000)return false;
      if(state.size==='m'&&(b.f<30000||b.f>=100000))return false;
      if(state.size==='l'&&(b.f<100000||b.f>=300000))return false;
      if(state.size==='xl'&&b.f<300000)return false;
      if(b.story&&b.story>state.max)return false;
      return true;
    });
    var key={er:function(b){return -(b.er||0)},f:function(b){return -b.f},p:function(b){return b.story||1e9},k:function(b){return b.story?b.story/b.f:1e9}}[state.sort];
    list.sort(function(a,b){return key(a)-key(b)});
    grid.innerHTML=list.map(function(b){return card(b)}).join('')||'<p class="src">'+L.none+'</p>';
    $('cat-found').textContent=L.found.replace('{n}',list.length);
  }
  tabs.forEach(function(t){t.addEventListener('click',function(){state.n=t.dataset.n;tabs.forEach(function(x){x.setAttribute('aria-pressed',String(x===t))});draw()})});
  $('cat-size').addEventListener('change',function(e){state.size=e.target.value;draw()});
  $('cat-sort').addEventListener('change',function(e){state.sort=e.target.value;draw()});
  var mx=$('cat-max');mx.addEventListener('input',function(){state.max=+mx.value;$('cat-max-v').textContent=state.max>=600?L.any:money(state.max);if(state.max>=600)state.max=1e9;draw()});
  draw();
}

/* ── Калькулятор кампании ─────────────────────────────────────────────── */
var calc=$('calc');
if(calc){
  var cs={fmt:'story',n:'all'}, bud=$('c-b');
  calc.querySelectorAll('[data-fmt]').forEach(function(t){t.addEventListener('click',function(){cs.fmt=t.dataset.fmt;calc.querySelectorAll('[data-fmt]').forEach(function(x){x.setAttribute('aria-pressed',String(x===t))});run()})});
  $('c-n').addEventListener('change',function(e){cs.n=e.target.value;run()});
  bud.addEventListener('input',run);
  function run(){
    var b=+bud.value;$('c-bv').textContent=money(b);
    var pool=C.filter(function(x){return x[cs.fmt]&&(cs.n==='all'||x.n===cs.n)}).sort(function(a,c){return a[cs.fmt]/a.f-c[cs.fmt]/c.f});
    var spent=0,n=0,fl=0;pool.forEach(function(x){if(spent+x[cs.fmt]<=b){spent+=x[cs.fmt];n++;fl+=x.f}});
    $('c-cnt').textContent=n?L.bloggersN.replace('{n}',n):L.tooSmall;
    $('c-fl').textContent=fmtK2(fl);
    $('c-v').textContent=fmtK2(b/6*1000)+' – '+fmtK2(b/1.75*1000);
    $('c-cl').textContent=L.from+' '+int(b*0.286);
    var t=b<950?'silver':b<1600?'gold':'platinum';
    d.querySelectorAll('.tariff').forEach(function(x){x.classList.toggle('pick',x.dataset.t===t)});
    $('c-t').textContent=L.tariff[t];
    $('c-go').href=tg(L.calcTg.replace('{b}',money(b)).replace('{f}',cs.fmt==='post'?'Post':'Story').replace('{n}',cs.n==='all'?L.allN:niche(cs.n)));
  }
  run();
}

/* ── Слот-машина идей ────────────────────────────────────────────────── */
var slot=$('slot');
if(slot){
  var R=L.reels, strips=slot.querySelectorAll('.strip'), idea=$('idea'), pos=[0,0,0];
  strips.forEach(function(s,i){var items=R[i].items,html='';for(var k=0;k<6;k++)items.forEach(function(it){html+='<span><b>'+esc(R[i].t)+'</b>'+esc(it)+'</span>'});s.innerHTML=html});
  $('spin').addEventListener('click',function(){
    var res=[];
    strips.forEach(function(s,i){
      var n=R[i].items.length, k=Math.floor(Math.random()*n), rounds=reduce?0:(3+i)*n, target=rounds+k;
      s.style.transition='none';s.style.transform='translateY(-'+(pos[i]%n)*120+'px)';s.getBoundingClientRect();
      s.style.transition=reduce?'none':'transform '+(1200+i*400)+'ms cubic-bezier(.2,.9,.25,1)';
      s.style.transform='translateY(-'+target*120+'px)';pos[i]=target;res.push(R[i].items[k]);
    });
    setTimeout(function(){
      idea.innerHTML='<small>'+L.ideaLbl+'</small>'+esc(L.idea.replace('{a}',res[0]).replace('{b}',res[1]).replace('{c}',res[2]));
      $('idea-go').href=tg(L.ideaTg+' '+res.join(' + '));$('idea-go').hidden=false;
    },reduce?0:2100);
  });
}

/* ── Кошелёк токенов ─────────────────────────────────────────────────── */
var coins=store.get('ba-tk',40);
function drawCoins(){d.querySelectorAll('[data-coins]').forEach(function(el){el.textContent=coins});store.set('ba-tk',coins)}
function spend(n){if(coins<n)return false;coins-=n;drawCoins();d.querySelectorAll('.coin').forEach(function(c){c.classList.remove('bump');void c.offsetWidth;c.classList.add('bump')});return true}
d.querySelectorAll('[data-refill]').forEach(function(b){b.addEventListener('click',function(){coins+=40;drawCoins()})});
drawCoins();

/* ── UGC-генератор ───────────────────────────────────────────────────── */
var studio=$('studio');
if(studio){
  var sp={platform:'reels',tone:'fun'};
  studio.querySelectorAll('[data-pl]').forEach(function(t){t.addEventListener('click',function(){sp.platform=t.dataset.pl;studio.querySelectorAll('[data-pl]').forEach(function(x){x.setAttribute('aria-pressed',String(x===t))})})});
  studio.querySelectorAll('[data-tone]').forEach(function(t){t.addEventListener('click',function(){sp.tone=t.dataset.tone;studio.querySelectorAll('[data-tone]').forEach(function(x){x.setAttribute('aria-pressed',String(x===t))})})});
  var uta=$('u-text'), ugo=$('u-go'), ures=$('u-res'), uth=$('u-think'), umsg=$('u-msg');
  studio.querySelectorAll('.ex button').forEach(function(b){b.addEventListener('click',function(){uta.value=b.textContent;uta.focus()})});
  function demoUgc(p){
    p=/^[A-ZА-ЯЁ][a-zа-яё]/.test(p)?p[0].toLowerCase()+p.slice(1):p;var D=L.demoUgc, f=function(s){return s.replace(/\{p\}/g,p)};
    return {hooks:D.hooks.map(f),script:D.script.map(function(r){return {time:r[0],shot:f(r[1]),voice:f(r[2]),overlay:f(r[3])}}),storyboard:D.board.map(function(r){return {frame:r[0],visual:f(r[1])}}),caption:f(D.caption),hashtags:D.tags,cta:f(D.cta)};
  }
  ugo.addEventListener('click',function(){
    var text=uta.value.trim();if(text.length<3){uta.focus();return}
    if(!spend(10)){umsg.textContent=L.noCoins;umsg.hidden=false;return}
    umsg.hidden=true;ugo.disabled=true;uth.classList.add('on');ures.hidden=true;
    ask('ugc',{text:text,platform:sp.platform,tone:sp.tone}).then(function(r){
      var live=!!(r&&r.hooks&&r.hooks.length), u=live?r:demoUgc(text.split(/[.,\n]/)[0].slice(0,60));
      var cols=['#5395E9','#a855f7','#f472b6','#fb923c','#fbbf24','#4ade80'];
      ures.innerHTML='<span class="badge" id="u-bd"></span>'+
        '<h3>'+L.uHooks+'</h3><ol class="hooks">'+u.hooks.map(function(h,i){return '<li><span id="hk'+i+'">'+esc(h)+'</span><button class="copy" type="button" data-copy="hk'+i+'">'+L.copy+'</button></li>'}).join('')+'</ol>'+
        '<h3>'+L.uScript+'</h3><div class="script" id="u-script">'+u.script.map(function(s){return '<div class="sc"><small>'+esc(s.time)+'</small><p>'+esc(s.shot)+'</p><q>'+esc(s.voice)+'</q>'+(s.overlay?'<em>'+L.onScreen+': '+esc(s.overlay)+'</em>':'')+'</div>'}).join('')+'</div>'+
        '<h3>'+L.uBoard+'</h3><div class="frames">'+u.storyboard.map(function(f,i){return '<div class="frame" style="--fc:'+cols[i%6]+'"><b>'+esc(f.frame)+'</b><p>'+esc(f.visual)+'</p></div>'}).join('')+'</div>'+
        '<h3>'+L.uCaption+'</h3><div class="caption" id="u-cap">'+esc(u.caption)+'</div><ul class="tags">'+u.hashtags.map(function(t){return '<li>'+esc(t)+'</li>'}).join('')+'</ul>'+
        '<div class="ai-actions"><button class="btn btn-ghost btn-sm" type="button" data-copy="u-script">'+L.copyScript+'</button><a class="btn btn-main" href="'+tg(L.ugcTg.replace('{p}',text)+'\n'+(u.hooks[0]||''))+'">'+L.ugcCta+'</a></div>';
      badge($('u-bd'),live);ures.hidden=false;if($('u-empty'))$('u-empty').hidden=true;uth.classList.remove('on');ugo.disabled=false;
    });
  });
}

/* ── Бриф-мастер ─────────────────────────────────────────────────────── */
var bm=$('briefm');
if(bm){
  var bta=bm.querySelector('textarea'), bgo=bm.querySelector('[data-go]'), bres=bm.querySelector('.res'), bth=bm.querySelector('.thinking'), bbd=bm.querySelector('.badge');
  bm.querySelectorAll('.ex button').forEach(function(b){b.addEventListener('click',function(){bta.value=b.textContent;bta.focus()})});
  function demoBrief(t){var D=L.demoBrief;return {title:D.title,product:t.slice(0,180),goal:D.goal,audience:D.audience,message:D.message,formats:D.formats,mechanics:D.mechanics,kpi:D.kpi,dos:D.dos,donts:D.donts,questions:D.questions}}
  bgo.addEventListener('click',function(){
    var text=bta.value.trim();if(text.length<3){bta.focus();return}
    if(!spend(5)){bres.innerHTML='<p>'+L.noCoins+'</p>';bres.hidden=false;return}
    bgo.disabled=true;bth.classList.add('on');bres.hidden=true;
    ask('brief',{text:text}).then(function(r){
      var live=!!(r&&r.goal), b=live?r:demoBrief(text), F=L.bf;
      var row=function(k,v){if(!v||(Array.isArray(v)&&!v.length))return '';return '<div><dt>'+F[k]+'</dt><dd>'+(Array.isArray(v)?'<ul>'+v.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul>':esc(v))+'</dd></div>'};
      bres.innerHTML='<h3>'+esc(b.title||F.title)+'</h3><dl id="brief-out">'+['product','goal','audience','message','formats','mechanics','kpi','dos','donts','questions'].map(function(k){return row(k,b[k])}).join('')+'</dl>'+
        '<div class="ai-actions"><button class="btn btn-ghost btn-sm" type="button" data-copy="brief-out" style="color:inherit">'+L.copy+'</button><a class="btn btn-main" href="'+tg(L.briefTg+'\n'+[b.title,b.product,b.goal,b.audience,b.message].filter(Boolean).join('\n')+'\n'+(b.formats||[]).join(', '))+'">'+L.briefCta+'</a></div>';
      badge(bbd,live);bres.hidden=false;bth.classList.remove('on');bgo.disabled=false;
    });
  });
}

/* ── Оценка блога для блогера ────────────────────────────────────────── */
var rate=$('rate');
if(rate){
  var rf=$('r-f'), rl=$('r-l'), rc=$('r-c');
  function rr(){
    var f=+rf.value||0, l=+rl.value||0, c=+rc.value||0;
    if(f<1000){$('r-out').hidden=true;return}
    var er=(l+c)/f*100, near=C.filter(function(b){return b.story&&b.f>=f/2&&b.f<=f*2});
    var med=function(a){a=a.slice().sort(function(x,y){return x-y});return a.length?a[Math.floor(a.length/2)]:null};
    $('r-er').textContent=er.toFixed(1).replace('.',',')+'%';
    var ers=C.filter(function(b){return b.er!=null}).map(function(b){return b.er}), better=ers.filter(function(x){return x<er}).length;
    $('r-rank').textContent=L.rank.replace('{a}',better).replace('{b}',ers.length);
    $('r-n').textContent=near.length;
    $('r-s').textContent=near.length?money(med(near.map(function(b){return b.story}))):'—';
    $('r-p').textContent=near.length?money(med(near.filter(function(b){return b.post}).map(function(b){return b.post}))):'—';
    $('r-go').href=tg(L.rateTg.replace('{f}',int(f)).replace('{er}',er.toFixed(1)));
    $('r-out').hidden=false;
  }
  [rf,rl,rc].forEach(function(i){i.addEventListener('input',rr)});rr();
}

/* ── Конструктор тарифа (как у MAVERA): тумблер — настоящий блок на странице ── */
var KEY='ba-kit-v2', inputs=[].slice.call(d.querySelectorAll('input[data-k]'));
if(inputs.length){
  var price={},needs={},def={},title={};
  inputs.forEach(function(x){var k=x.dataset.k;price[k]=+x.dataset.p;needs[k]=(x.dataset.needs||'').split(' ').filter(Boolean);if(x.hasAttribute('data-def'))def[k]=true;
    var r=x.closest('label'),tt=r&&r.querySelector('b');if(tt&&!title[k])title[k]=tt.textContent});
  var on=store.get(KEY,null)||{};Object.keys(price).forEach(function(k){if(!(k in on))on[k]=!!def[k]});
  var pill=$('kd-pill'),panel=$('kd'),base=+(L.kitBase||0);
  function apply(fresh){
    Object.keys(price).forEach(function(k){
      root.classList.toggle('k-no-'+k,!on[k]);
      d.querySelectorAll('[data-addon="'+k+'"]').forEach(function(el){el.hidden=!on[k];if(fresh===k&&on[k]&&!reduce){el.classList.remove('k-fresh');void el.offsetWidth;el.classList.add('k-fresh')}});
    });
    inputs.forEach(function(x){x.checked=!!on[x.dataset.k]});
    d.querySelectorAll('.kit-pv[data-pv]').forEach(function(p){p.hidden=!on[p.dataset.pv];p.classList.toggle('fresh',p.dataset.pv===fresh&&!reduce)});
    var ids=Object.keys(price).filter(function(k){return on[k]}),add=ids.reduce(function(s,k){return s+price[k]},0),site=ids.filter(function(k){return def[k]}).reduce(function(s,k){return s+price[k]},0),sum=base+add;
    var set=function(id,v){var el=$(id);if(el)el.textContent=v};
    set('kd-pill-sum',money(sum));set('kd-sum',money(sum));set('kd-add','+'+money(add));set('kd-n',L.kitN.replace('{n}',ids.length));
    set('kit-sum',money(sum));set('kit-sum2',money(sum));set('kit-site-sum','+'+money(site));set('kit-n',L.kitN.replace('{n}',ids.length));
    var sc=d.querySelector('.kit-screen');if(sc)sc.classList.toggle('none',!d.querySelector('.kit-pv:not([hidden])'));
    var text=L.kitTg+'\n'+L.kitBaseName+' — '+money(base)+'\n'+ids.map(function(k){return title[k]+' — '+money(price[k])}).join('\n')+'\n'+L.kitTotal+': '+money(sum);
    d.documentElement.dataset.kit=text;
    store.set(KEY,on);
  }
  function setK(k,v){
    on[k]=v;
    if(v)needs[k].forEach(function(n){if((n in on)&&!on[n])setK(n,true)});
    else Object.keys(needs).forEach(function(o){if(on[o]&&needs[o].indexOf(k)>=0)setK(o,false)});
  }
  inputs.forEach(function(x){x.addEventListener('change',function(){setK(x.dataset.k,x.checked);apply(x.checked?x.dataset.k:'')})});
  function open(v){if(!panel)return;panel.hidden=!v;pill.setAttribute('aria-expanded',String(v));pill.hidden=v}
  if(pill)pill.addEventListener('click',function(){open(true)});
  var xb=$('kd-x');if(xb)xb.addEventListener('click',function(){open(false)});
  d.querySelectorAll('[data-kit-open]').forEach(function(b){b.addEventListener('click',function(){open(true)})});
  addEventListener('keydown',function(e){if(e.key==='Escape'&&panel&&!panel.hidden)open(false)});
  var rs=$('kd-reset');if(rs)rs.addEventListener('click',function(){Object.keys(price).forEach(function(k){on[k]=!!def[k]});apply('')});
  var cp=$('kd-copy');if(cp)cp.addEventListener('click',function(){var t=d.documentElement.dataset.kit;try{navigator.clipboard.writeText(t).then(function(){var o=cp.textContent;cp.textContent=L.copied;setTimeout(function(){cp.textContent=o},1400)})}catch(e){}});
  apply('');
}
})();
