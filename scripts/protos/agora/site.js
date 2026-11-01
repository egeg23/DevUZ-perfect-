/* Сайт Agora: меню из их rezvo, витрина «Вечер в Agora», бронь стола, предзаказ,
   демо-бот в окне Telegram. Состояние — память браузера: сайт пишет ag-book-1,
   ag-ord-1, ag-bot-1; панель пишет статусы и стоп-лист (ag-stop-1); событие
   storage приносит их обратно. Модель макет не вызывает: бот — готовые сценарии.
   Прокрутку только читаем. */
(function(){
var d=document,w=window,$=function(s,r){return(r||d).querySelector(s)},$$=function(s,r){return[].slice.call((r||d).querySelectorAll(s))};
var D=JSON.parse($('#ag-data').textContent),T=D.t,L=D.l;
var RM=w.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function get(k,def){try{var v=localStorage.getItem(k);return v?JSON.parse(v):def}catch(e){return def}}
function put(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function sum(n){return fmt(n)+' '+T.sum}
function cl(x){return x<0?0:x>1?1:x}
function ease(x){return 1-Math.pow(1-x,3)}
function now(){var t=new Date();return(t.getHours()<10?'0':'')+t.getHours()+':'+(t.getMinutes()<10?'0':'')+t.getMinutes()}
var toastT=0;function toast(m){var t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('on')},2600)}
var IC={plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  dish:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true"><path d="M3 15h18M5 15a7 7 0 0 1 14 0M12 8V6M9 19h6"/></svg>',
  glass:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true"><path d="M7 3h10l-1 9a4 4 0 0 1-8 0ZM12 16v5M8 21h8M7.5 8h9"/></svg>'};

/* Шапка: прячется при любой прокрутке, возвращается через 3 с после последнего события. */
var top=$('.top'),IDLE=3000,idleT=0;
function headIdle(){if(!top)return;clearTimeout(idleT);
  if(!top.contains(d.activeElement))top.classList.add('hide');
  idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}
addEventListener('scroll',headIdle,{passive:true});
var io='IntersectionObserver'in w?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'}):null;
function reveal(r){$$('.rise,.tilt,.pop,.slide',r).forEach(function(e){if(io&&!RM)io.observe(e);else e.classList.add('on')})}
reveal();
setTimeout(function(){var h=$('.hero');if(h)h.classList.add('on')},120);
d.addEventListener('pointermove',function(e){var g=e.target.closest&&e.target.closest('.glass');if(!g)return;var r=g.getBoundingClientRect();g.style.setProperty('--gx',((e.clientX-r.left)/r.width*100)+'%');g.style.setProperty('--gy',((e.clientY-r.top)/r.height*100)+'%')},{passive:true});

/* Допы из конструктора первой страницы: выключенный доп — блок пропадает. */
var cfg=get('ag-cfg-1',{});
function addonOn(id){return cfg[id]!==false}
function applyCfg(){cfg=get('ag-cfg-1',{});$$('[data-addon]').forEach(function(e){e.hidden=!addonOn(e.getAttribute('data-addon'))});$$('[data-off]').forEach(function(e){e.hidden=addonOn(e.getAttribute('data-off'))})}
applyCfg();

/* ── Прокрутка: параллакс, бегущие строки, сцены витрины, зал ───── */
var heroImg=$('.hero-bg img'),velo=$$('.velo .row'),vx=0,vs=0,lastY=scrollY,scenes=$$('.sc'),rows=$$('.hl-row');
function onScroll(){var y=scrollY;vs+=Math.min(60,Math.abs(y-lastY))*.04;lastY=y;
  if(heroImg&&y<innerHeight*1.4)heroImg.style.transform='translate3d(0,'+(y*.22).toFixed(1)+'px,0) scale(1.06)';
  scenes.forEach(function(s){var r=s.getBoundingClientRect(),span=r.height-innerHeight;if(r.bottom<0||r.top>innerHeight)return;var p=span>0?cl(-r.top/span):0;scene(s,p)});
  rows.forEach(function(row,i){var r=row.parentNode.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;var p=(innerHeight-r.top)/(innerHeight+r.height),m=row.scrollWidth-innerWidth;row.style.transform='translate3d('+(-(i%2?1-p:p)*Math.max(0,m)).toFixed(1)+'px,0,0)'})}
function scene(s,p){var dsh=$('.sc-dish',s),bg=$('.sc-bg img',s),k=ease(cl(p/ /*~*/.42)),dir=s.classList.contains('r')?-1:1;
  dsh.style.transform='translate3d('+((1-k)*90*dir).toFixed(1)+'px,'+((1-k)*120-p*30).toFixed(1)+'px,0) rotate('+((1-k)*-14*dir+p*4).toFixed(2)+'deg) scale('+(.82+k*.18).toFixed(3)+')';
  dsh.style.opacity=cl(p*4).toFixed(3);
  if(bg)bg.style.transform='translate3d(0,'+(p*-40).toFixed(1)+'px,0) scale(1.12)';
  s.style.setProperty('--o',cl((p-.18)/.22).toFixed(3));s._p=p}
if(!RM){addEventListener('scroll',onScroll,{passive:true});onScroll();
  (function tick(){vx+=1+vs;vs*=.92;velo.forEach(function(r,i){var wd=r.scrollWidth/3||1,x=-(vx%wd);r.style.transform='translate3d('+(i%2?(x+wd*.5)-wd*.5:x).toFixed(1)+'px,0,0)'});requestAnimationFrame(tick)})()}
else scenes.forEach(function(s){scene(s,.6)});

/* Пар над горячим и пузырьки в напитке — кодом, только пока сцена на экране. */
function particles(cv,kind){var cx=cv.getContext('2d'),P=[],vis=false,raf=0;
  function size(){var r=cv.getBoundingClientRect(),k=Math.min(devicePixelRatio||1,2);cv.width=r.width*k;cv.height=r.height*k}
  function spawn(){var W=cv.width,H=cv.height;return kind==='ice'?{x:W*(.3+Math.random()*.4),y:H*(.95+Math.random()*.1),r:(1+Math.random()*2.4)*(W/400),v:.4+Math.random()*.8,a:0}:{x:W*(.35+Math.random()*.3),y:H*(.98),r:(18+Math.random()*30)*(W/400),v:.3+Math.random()*.5,a:0,s:Math.random()*6}}
  function step(){raf=0;if(!vis)return;var W=cv.width,H=cv.height,boost=1+vs*.6;cx.clearRect(0,0,W,H);
    while(P.length<(kind==='ice'?36:14))P.push(spawn());
    P.forEach(function(q,i){q.y-=q.v*boost*(W/400);q.a=Math.min(1,q.a+.02);
      if(kind==='ice'){cx.beginPath();cx.arc(q.x+Math.sin((q.y+i*40)/30)*3,q.y,q.r,0,7);cx.fillStyle='rgba(255,255,255,'+(.35*q.a*cl(q.y/H*1.4))+')';cx.fill()}
      else{q.s+=.01;var g=cx.createRadialGradient(q.x,q.y,0,q.x,q.y,q.r);var al=.1*q.a*cl(q.y/H*1.3);g.addColorStop(0,'rgba(255,255,255,'+al+')');g.addColorStop(1,'rgba(255,255,255,0)');cx.fillStyle=g;cx.beginPath();cx.arc(q.x+Math.sin(q.s)*12,q.y,q.r,0,7);cx.fill();q.r+=.08}
      if(q.y<-q.r)P[i]=spawn()});
    raf=requestAnimationFrame(step)}
  if(RM)return;
  new IntersectionObserver(function(es){vis=es[0].isIntersecting;if(vis){size();if(!raf)raf=requestAnimationFrame(step)}}).observe(cv);addEventListener('resize',size)}
$$('.sc canvas').forEach(function(c){particles(c,c.getAttribute('data-k'))});

/* ── Меню ───────────────────────────────────────────────────────── */
var BASE_M=D.menu.map(function(a){return{id:a[0],cat:a[1],n:a[2],dsc:a[3],p:a[4],w:a[5],ph:a[6],alias:!!(a[7]&1),stock:!!(a[7]&2),alc:!!(a[7]&4),ex:!!(a[7]&8),g:a[8]}});
var CAT={};D.cats.forEach(function(c){CAT[c.id]=c});
/* Правки из панели (ag-menu-1): цена, название, скрыто, «Хит/Новинка», новые позиции. */
var M=[],byId={};
function buildM(){var MO=get('ag-menu-1',{e:{},a:[]}),E=MO.e||{};byId={};
  var all=BASE_M.map(function(m){var e=E[m.id]||{},o=Object.assign({},m);if(e.n)o.n=e.n;if(e.p!=null)o.p=e.p;o.h=!!e.h;o.tg=e.t||'';return o}).concat((MO.a||[]).filter(function(a){return CAT[a.cat]}).map(function(a){var e=E[a.id]||{};return{id:a.id,cat:a.cat,n:a.n,dsc:a.d||'',p:a.p,w:a.w,ph:null,img:a.img,g:CAT[a.cat].g,h:!!e.h,tg:e.t||'',fresh:1}}));
  all.forEach(function(m){byId[m.id]=m});M=all.filter(function(m){return!m.h})}
buildM();
/* Настройки из панели (ag-set-1): доставка, пауза кухни, баннер, часы, бронь. */
var SET;function loadSet(){SET=Object.assign({},D.set0,get('ag-set-1',{}));SET.dlv=Object.assign({},D.set0.dlv,SET.dlv||{});SET.book=Object.assign({},D.set0.book,SET.book||{})}
loadSet();
function applySet(){var pr=$('#promo');if(pr){pr.hidden=!(SET.bannerOn&&SET.banner);pr.textContent=SET.banner||''}$$('[data-hours]').forEach(function(e){e.textContent=SET.hours})}
applySet();
var st={g:'k',cat:'all',q:'',f:{}},grid=$('#mn-grid'),stop=get('ag-stop-1',{});
function norm(s){return String(s).toLowerCase().replace(/ё/g,'е').replace(/[‘’ʻ`']/g,'')}
function card(m,i){var off=!!stop[m.id];return'<button type="button" class="mi'+(off?' off':'')+'" data-dish="'+m.id+'" style="animation-delay:'+Math.min(i,12)*30+'ms">'+
  (m.img?'<span class="mi-ph"><img src="'+m.img+'" alt="'+esc(m.n)+'" width="560" height="420">':m.ph?'<span class="mi-ph"><img src="'+D.img+'/d-'+m.ph+'-s.webp" alt="'+esc(m.n)+'" loading="lazy" width="560" height="420">':'<span class="mi-ph no">'+(m.g==='b'?IC.glass:IC.dish)+'<em>'+esc(CAT[m.cat].n)+'</em>')+
  (off?'<span class="tag stop">'+T.stop+'</span>':m.tg?'<span class="tag hot">'+T['tag_'+m.tg]+'</span>':m.alc?'<span class="tag">18+</span>':'')+'</span>'+
  '<span class="mi-b"><b>'+esc(m.n)+'</b>'+(m.w?'<small>'+m.w+' '+T.g+'</small>':'')+'<span class="mi-f"><span>'+sum(m.p)+'</span>'+(addonOn('order')&&!off?'<i aria-hidden="true">'+IC.plus+'</i>':'')+'</span></span></button>'}
function pass(m){if(m.g!==st.g)return false;if(st.cat!=='all'&&m.cat!==st.cat)return false;
  if(st.q&&norm(m.n+' '+m.dsc).indexOf(norm(st.q))<0)return false;
  if(st.f.ph&&!m.ph&&!m.img)return false;if(st.f.cheap&&m.p>50000)return false;if(st.f.big&&!(m.w>=500))return false;if(st.f.soft&&m.alc)return false;return true}
function render(){var list=M.filter(pass).map(function(m,i){return[m,i]}).sort(function(a,b){var x=a[0],y=b[0];return(!!y.fresh-!!x.fresh)||((!y.tg)-(!x.tg))*-1||(!(x.ph||x.img)-!(y.ph||y.img))||a[1]-b[1]}).map(function(x){return x[0]}),h='';
  if(!list.length)h='<p class="empty">'+T.none+'</p>';
  else if(st.cat==='all'&&!st.q){D.cats.filter(function(c){return c.g===st.g}).forEach(function(c){var x=list.filter(function(m){return m.cat===c.id});if(!x.length)return;h+='<h3 class="mn-cat">'+esc(c.n)+' <small>'+x.length+'</small></h3><div class="grid">'+x.slice(0,6).map(card).join('')+'</div>'+(x.length>6?'<button type="button" class="btn btn-g btn-s mn-all" data-all="'+c.id+'">'+T.all.replace('{n}',x.length)+'</button>':'')})}
  else h='<div class="grid">'+list.map(card).join('')+'</div>';
  grid.innerHTML=h;$('#mn-alc').hidden=st.g!=='b';
  $$('#mn-chips .chip').forEach(function(c){c.hidden=c.getAttribute('data-g')!==st.g&&c.getAttribute('data-cat')!=='all';c.setAttribute('aria-pressed',String(c.getAttribute('data-cat')===st.cat))});
  $$('[data-f]').forEach(function(b){var k=b.getAttribute('data-f');b.hidden=(k==='big'&&st.g!=='k')||(k==='soft'&&st.g!=='b');b.setAttribute('aria-pressed',String(!!st.f[k]))})}
function tab(g){st.g=g;st.cat='all';$$('#mn-tabs button').forEach(function(b,i){var on=b.getAttribute('data-g')===g;b.setAttribute('aria-selected',String(on));if(on){var r=b.getBoundingClientRect(),p=b.parentNode.getBoundingClientRect(),pill=$('#mn-tabs i');pill.style.width=r.width+'px';pill.style.transform='translateX('+(r.left-p.left)+'px)'}});render()}
if(grid){
  $$('#mn-tabs button').forEach(function(b){b.addEventListener('click',function(){tab(b.getAttribute('data-g'))})});
  $('#mn-chips').addEventListener('click',function(e){var c=e.target.closest('.chip');if(!c)return;st.cat=c.getAttribute('data-cat');render()});
  $$('[data-f]').forEach(function(b){b.addEventListener('click',function(){var k=b.getAttribute('data-f');st.f[k]=!st.f[k];render()})});
  grid.addEventListener('click',function(e){var a=e.target.closest('[data-all]');if(!a)return;st.cat=a.getAttribute('data-all');render();var top=$('#mn-chips').getBoundingClientRect().top+scrollY-90;scrollTo(0,top)});
  $('#mn-q').addEventListener('input',function(e){st.q=e.target.value.trim();render()});
  tab('k');addEventListener('resize',function(){tab(st.g)});
}
d.addEventListener('click',function(e){var b=e.target.closest('[data-dish]');if(b){e.preventDefault();dish(b.getAttribute('data-dish'))}});

/* Шторка */
var sheet=$('#sheet'),shb=$('#shb'),shh=$('#shh'),lastFocus=null;
function open(title,html){lastFocus=d.activeElement;shh.textContent=title;shb.innerHTML=html;sheet.classList.add('on');d.body.style.overflow='hidden';setTimeout(function(){var x=$('.x',sheet);if(x)x.focus()},60)}
function close(){sheet.classList.remove('on');d.body.style.overflow='';if(lastFocus&&lastFocus.focus)lastFocus.focus()}
sheet.addEventListener('click',function(e){if(e.target.closest('[data-close]'))close()});
d.addEventListener('keydown',function(e){if(e.key==='Escape'&&sheet.classList.contains('on'))close()});

/* Карточка блюда */
var cart=get('ag-cart-1',{});
function dish(id){var m=byId[id];if(!m)return;var off=!!stop[id],q=1;
  var src=m.ph?'<p class="note">'+(m.alias?T.alias:'')+(m.stock?(m.alias?' · ':'')+(m.ex?T.like:T.stock):'')+'</p>':'';
  open(m.n,(m.img?'<div class="dish-ph"><img src="'+m.img+'" alt="'+esc(m.n)+'" width="800" height="600"></div>':m.ph?'<div class="dish-ph"><img src="'+D.img+'/d-'+m.ph+'.webp" alt="'+esc(m.n)+'" width="1280" height="960"></div>':'')+
    '<p class="note">'+esc(CAT[m.cat].n)+(m.w?' · '+m.w+' '+T.g:'')+(m.alc?' · 18+':'')+'</p>'+(m.dsc?'<p style="margin-top:8px">'+esc(m.dsc)+'</p>':'')+src+
    '<div class="dish-p"><b>'+sum(m.p)+'</b>'+(off?'<span class="tag stop" style="position:static">'+T.stop+'</span>':addonOn('order')?'<span class="qty"><button type="button" data-q="-1" aria-label="−">−</button><span id="dq">1</span><button type="button" data-q="1" aria-label="+">+</button></span>':'')+'</div>'+
    (off?'':addonOn('order')?'<button type="button" class="btn btn-a" id="dadd" style="width:100%">'+T.add+'</button>':'<a class="btn btn-a" href="'+D.telHref+'" style="width:100%">'+T.call+'</a>'));
  $$('[data-q]',shb).forEach(function(b){b.addEventListener('click',function(){q=Math.max(1,Math.min(20,q+ +b.getAttribute('data-q')));$('#dq').textContent=q})});
  var a=$('#dadd');if(a)a.addEventListener('click',function(){cart[id]=(cart[id]||0)+q;put('ag-cart-1',cart);cartUi();close();toast(T.added+': '+m.n)})}

/* Корзина: предзаказ к брони или навынос */
var cartBtn=$('#cart');
function cartSum(){var s=0,n=0;Object.keys(cart).forEach(function(k){if(byId[k]){s+=byId[k].p*cart[k];n+=cart[k]}});return{s:s,n:n}}
function cartUi(){var c=cartSum();$('#cart-n').textContent=c.n;$('#cart-s').textContent=sum(c.s);cartBtn.classList.toggle('on',c.n>0&&addonOn('order'))}
if(cartBtn){cartUi();cartBtn.addEventListener('click',cartOpen)}
function cartOpen(){var c=cartSum(),DL=SET.dlv,modes=[];if(SET.book.pre)modes.push(['book',T.toBook]);if(DL.pick)modes.push(['go',T.toGo]);if(DL.on)modes.push(['dlv',T.toDlv]);
  var mode=modes.length?modes[0][0]:'',zone=0;
  open(T.cart,Object.keys(cart).filter(function(k){return byId[k]}).map(function(k){var m=byId[k];return'<div class="ln"><span>'+esc(m.n)+' × '+cart[k]+'</span><b>'+sum(m.p*cart[k])+'</b></div>'}).join('')+
    '<div class="ln"><span>'+T.dishes+'</span><b>'+sum(c.s)+'</b></div><div class="ln" id="o-fee" hidden></div><div class="ln" style="border:0"><span>'+T.total+'</span><b id="o-tot">'+sum(c.s)+'</b></div>'+
    (SET.pause?'<p class="pause-n">'+T.paused+'</p>':'')+
    (modes.length?'<div class="fld"><span>'+T.how+'</span><div class="seg" id="om">'+modes.map(function(x,k){return'<button type="button" data-m="'+x[0]+'" aria-pressed="'+(k===0)+'">'+x[1]+'</button>'}).join('')+'</div></div>':'<p class="pause-n">'+T.noModes+'</p>')+
    '<div id="o-dlv" hidden><label class="fld"><span>'+T.zone+'</span><select id="oz">'+DL.zones.map(function(z,k){return'<option value="'+k+'">'+esc(z.n)+' · '+(z.p?sum(z.p):T.free)+' · ~'+z.m+' '+T.min+'</option>'}).join('')+'</select></label>'+
    '<label class="fld"><span>'+T.addr+'</span><input id="oa" autocomplete="street-address" placeholder="'+T.addrPh+'"></label><p class="note" id="o-min"></p><p class="note">'+T.zonesDemo+'</p></div>'+
    '<label class="fld"><span>'+T.name+'</span><input id="on" autocomplete="name"></label><label class="fld"><span>'+T.phone+'</span><input id="op" type="tel" inputmode="tel" autocomplete="tel" value="+998 "></label>'+
    '<p class="note" style="margin-bottom:12px">'+T.ordNote+'</p><button type="button" class="btn btn-a" id="osend" style="width:100%"'+(SET.pause||!modes.length?' disabled':'')+'>'+T.order+'</button> <button type="button" class="btn btn-g" id="oclr" style="width:100%;margin-top:8px">'+T.clear+'</button>');
  function fee(){if(mode!=='dlv')return null;var z=DL.zones[zone];return!z?0:DL.free&&c.s>=DL.free?0:z.p}
  function upd(){var f=fee(),box=$('#o-fee');$('#o-dlv').hidden=mode!=='dlv';box.hidden=f==null;if(f!=null)box.innerHTML='<span>'+T.dlvFee+(DL.free?' <small>('+T.freeFrom+' '+sum(DL.free)+')</small>':'')+'</span><b>'+(f?sum(f):T.free)+'</b>';
    $('#o-tot').textContent=sum(c.s+(f||0));var mn=$('#o-min');if(mn)mn.textContent=mode==='dlv'&&c.s<DL.min?T.minOrder.replace('{n}',sum(DL.min)):''}
  var om=$('#om');if(om)om.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;mode=b.getAttribute('data-m');$$('#om button').forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});upd()});
  var oz=$('#oz');if(oz)oz.addEventListener('change',function(){zone=+oz.value;upd()});upd();
  $('#oclr').addEventListener('click',function(){cart={};put('ag-cart-1',cart);cartUi();close()});
  $('#osend').addEventListener('click',function(){var n=$('#on').value.trim(),p=$('#op').value.trim();if(!n||p.replace(/\D/g,'').length<12){toast(T.need);return}
    if(mode==='dlv'){if(!$('#oa').value.trim()){toast(T.needAddr);return}if(c.s<DL.min){toast(T.minOrder.replace('{n}',sum(DL.min)));return}}
    var list=get('ag-ord-1',[]),id=1040+list.length+1,z=DL.zones[zone],o={id:id,at:Date.now(),items:Object.keys(cart).map(function(k){return[k,cart[k]]}),sum:cartSum().s,mode:mode,name:n,ph:p,st:0,src:'site'};
    if(mode==='dlv'){o.addr=$('#oa').value.trim();o.zone=z?z.n:'';o.fee=fee()}
    list.unshift(o);put('ag-ord-1',list);
    var mine=get('ag-mine-1',{});mine.ord=id;put('ag-mine-1',mine);cart={};put('ag-cart-1',cart);cartUi();mineUi();showMine('ord')})}

/* ── Бронь стола ───────────────────────────────────────────────── */
var bk={day:0,time:'',ppl:2};
var bkf=$('#bk-form');
if(bkf){
  var days=$('#bk-days'),times=$('#bk-times'),td=new Date(),h='';
  for(var i=0;i<7;i++){var x=new Date(td.getTime()+i*864e5);h+='<button type="button" data-day="'+i+'" aria-pressed="'+(i===0)+'">'+(i===0?T.today:i===1?T.tomorrow:T.wd[x.getDay()])+'<b>'+x.getDate()+'</b>'+T.mon[x.getMonth()]+'</button>'}
  days.innerHTML=h;
  function slots(){var a=D.times.indexOf(SET.book.from),b=D.times.indexOf(SET.book.to);if(a<0)a=0;if(b<0||b<a)b=D.times.length-1;bk.time='';times.innerHTML=D.times.slice(a,b+1).map(function(t){return'<button type="button" data-time="'+t+'" aria-pressed="false">'+t+'</button>'}).join('')}
  slots();
  days.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;bk.day=+b.getAttribute('data-day');$$('button',days).forEach(function(x){x.setAttribute('aria-pressed',String(x===b))})});
  times.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;bk.time=b.getAttribute('data-time');$$('button',times).forEach(function(x){x.setAttribute('aria-pressed',String(x===b))})});
  function ppl(){$('#bk-n').textContent=bk.ppl;$('#bk-q').textContent=bk.ppl>=10?T.bigTable:''}
  $('#bk-m').addEventListener('click',function(){bk.ppl=Math.max(1,bk.ppl-1);ppl()});$('#bk-p').addEventListener('click',function(){bk.ppl=Math.min(SET.book.max,bk.ppl+1);ppl()});ppl();
  bkf.addEventListener('submit',function(e){e.preventDefault();var n=$('#bk-name').value.trim(),p=$('#bk-ph').value.trim();
    if(!bk.time){toast(T.pickTime);return}if(!n||p.replace(/\D/g,'').length<12){toast(T.need);return}
    var x=new Date(td.getTime()+bk.day*864e5),list=get('ag-book-1',[]),id=2200+list.length+1;
    list.unshift({id:id,at:Date.now(),date:x.getDate()+' '+T.mon[x.getMonth()],time:bk.time,ppl:bk.ppl,name:n,ph:p,note:$('#bk-note').value.trim(),st:SET.book.auto?1:0,src:'site'});put('ag-book-1',list);
    var mine=get('ag-mine-1',{});mine.book=id;put('ag-mine-1',mine);mineUi();showMine('book')})}

/* «Моя бронь» и «Мой заказ»: статус ставит панель. */
var mineBtn=$('#mine');
function mineGet(){var m=get('ag-mine-1',{}),b=get('ag-book-1',[]).filter(function(x){return x.id===m.book})[0],o=get('ag-ord-1',[]).filter(function(x){return x.id===m.ord})[0];return{b:b,o:o}}
function mineUi(){if(!mineBtn)return;var x=mineGet();mineBtn.hidden=!x.b&&!x.o;var dot=$('.dot',mineBtn);if(dot)dot.classList.toggle('ok',!!((x.b&&x.b.st>=1&&x.b.st<3)||(x.o&&x.o.st>=3)))}
function showMine(which){var x=mineGet(),h='';
  if(x.b){var bs=x.b.st;h+='<p class="note">'+T.bookNo+' №'+x.b.id+' · '+x.b.date+', '+x.b.time+' · '+x.b.ppl+' '+T.guests+'</p><p class="st-now">'+T.bst[bs]+'</p><div class="steps">'+[0,1,2].map(function(k){return'<i class="'+(bs===3?'no':bs>=k?'on':'')+'"></i>'}).join('')+'</div>'+
    '<p class="note" style="margin-bottom:12px">'+T.mineHint+'</p><a class="btn btn-g" style="width:100%" href="'+D.smsHref(x.b)+'">'+T.sms+'</a>'}
  if(x.o){var os=x.o.st;h+='<p class="note" style="margin-top:22px">'+T.ordNo+' №'+x.o.id+' · '+(x.o.mode==='go'?T.toGo:T.toBook)+' · '+sum(x.o.sum)+'</p><p class="st-now">'+T.ost[os]+'</p><div class="steps">'+[0,1,2,3,4].map(function(k){return'<i class="'+(os>=k?'on':'')+'"></i>'}).join('')+'</div>'}
  h+='<a class="btn btn-a" style="width:100%;margin-top:16px" href="'+D.panel+'">'+T.openPanel+'</a>';
  open(which==='ord'&&!x.b?T.mineOrd:T.mine,h)}
D.smsHref=function(b){return'sms:'+D.tel+'?body='+encodeURIComponent(T.smsText.replace('{d}',b.date).replace('{t}',b.time).replace('{n}',b.ppl).replace('{name}',b.name))};
if(mineBtn){mineUi();mineBtn.addEventListener('click',function(){showMine()})}
/* Изменения из панели: статус, стоп-лист, допы. */
var seen={};function snap(){var x=mineGet();seen.b=x.b&&x.b.st;seen.o=x.o&&x.o.st}snap();
addEventListener('storage',function(e){
  if(e.key==='ag-stop-1'){stop=get('ag-stop-1',{});if(grid)render()}
  if(e.key==='ag-menu-1'){buildM();if(grid)render();if(cartBtn)cartUi()}
  if(e.key==='ag-set-1'){loadSet();applySet();if(typeof slots==='function'&&bkf)slots()}
  if(e.key==='ag-cfg-1'){applyCfg();cartUi&&cartBtn&&cartUi()}
  if(e.key==='ag-book-1'||e.key==='ag-ord-1'){var x=mineGet();if(x.b&&x.b.st!==seen.b)toast(T.bookNo+': '+T.bst[x.b.st]);if(x.o&&x.o.st!==seen.o)toast(T.ordNo+': '+T.ost[x.o.st]);snap();mineUi()}});

/* ── Демо-бот: готовые сценарии, модель не вызывается ─────────── */
var chat=$('#tg-b'),playing=0;
function bubble(cls,html){var e=d.createElement('div');e.className=cls;e.innerHTML=html;chat.appendChild(e);chat.scrollTop=chat.scrollHeight;return e}
function play(id){var S=D.bot[id];if(!S||!chat)return;var my=++playing;chat.innerHTML='';$$('#scn .chip').forEach(function(c){c.setAttribute('aria-pressed',String(c.getAttribute('data-s')===id))});
  var k=0;(function next(){if(my!==playing||k>=S.length)return;var s=S[k++],dl=RM?0:s[0]==='u'?700:s[0]==='sys'?500:900+Math.min(1400,String(s[1]||'').length*12);
    if(s[0]==='b'&&!RM){var t=bubble('typ','<i></i><i></i><i></i>');setTimeout(function(){t.remove();step(s);next()},dl)}
    else setTimeout(function(){step(s);next()},RM?0:dl*.6)})()}
function step(s){var t=s[0];
  if(t==='u')bubble('mg u',esc(s[1])+'<time>'+now()+'</time>');
  else if(t==='b')bubble('mg b',esc(fill(s[1]))+'<time>'+now()+'</time>');
  else if(t==='sys')bubble('mg sys',esc(s[1]));
  else if(t==='kb')bubble('kb',s[1].map(function(x){return'<span>'+esc(x)+'</span>'}).join(''));
  else if(t==='dish'){var m=byId[s[1]];if(m)bubble('mg b',(m.ph?'<img src="'+D.img+'/d-'+m.ph+'-s.webp" alt="'+esc(m.n)+'" width="560" height="420" loading="lazy">':'')+esc(m.n)+(m.w?' · '+m.w+' '+T.g:'')+'\n'+sum(m.p)+'<time>'+now()+'</time>')}
  else if(t==='act'){
    if(s[1]==='hand'){var l=get('ag-bot-1',[]);l.unshift({id:3300+l.length+1,at:Date.now(),who:s[2],text:s[3],st:0});put('ag-bot-1',l)}
    if(s[1]==='book'){var b=get('ag-book-1',[]),x=new Date();b.unshift({id:2200+b.length+1,at:Date.now(),date:s[2],time:s[3],ppl:s[4],name:s[5],ph:'+998 90 *** ** 14',note:'',st:0,src:'bot'});put('ag-book-1',b)}
    if(s[1]==='ord'){var o=get('ag-ord-1',[]);o.unshift({id:1040+o.length+1,at:Date.now(),items:s[2],sum:s[2].reduce(function(a,it){return a+(byId[it[0]]?byId[it[0]].p*it[1]:0)},0),mode:'go',name:s[3],ph:'+998 93 *** ** 07',st:0,src:'bot'});put('ag-ord-1',o)}}}
/* {ord} и {st} — номер и статус последнего заказа из панели. */
function fill(x){var o=get('ag-ord-1',[])[0];return String(x).replace('{ord}',o?o.id:1041).replace('{st}',o?T.ost[o.st]:T.ost[2])}
if(chat){$('#scn').addEventListener('click',function(e){var c=e.target.closest('.chip');if(c)play(c.getAttribute('data-s'))});
  var started=false;new IntersectionObserver(function(es){if(es[0].isIntersecting&&!started){started=true;play('menu')}},{threshold:.3}).observe(chat)}

/* QR-меню и отзывы: показ, что происходит по нажатию. */
$$('[data-qr]').forEach(function(b){b.addEventListener('click',function(){var l=get('ag-bot-1',[]);l.unshift({id:3300+l.length+1,at:Date.now(),who:T.table7,text:b.getAttribute('data-qr')==='w'?T.callWaiter:T.callBill,st:0,qr:1});put('ag-bot-1',l);toast(T.qrSent)})});
$$('.stars button').forEach(function(b,i,all){b.addEventListener('click',function(){all.forEach(function(x,k){x.classList.toggle('on',k<=i)});$('#rv-out').textContent=i>=3?T.rvGood:T.rvBad})});
})();
