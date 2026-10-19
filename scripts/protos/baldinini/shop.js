(function(){
'use strict';
/* shop: магазин Baldinini Tashkent для покупателя. Сначала телефон 390,
   на ПК — спокойная сетка с воздухом. Экраны по адресу после #: главная,
   каталог, товар, корзина, оформление, заказ, кабинет, избранное, закрытая
   распродажа, бутик. Состояние демо — в браузере (bd-demo-1): заказ, бронь
   примерки и «сообщить о размере» отсюда видит панель, статус из панели
   виден здесь. Прокрутку не перехватывает; движение только transform и
   opacity, при «меньше движения» стоит. */
var d=document,root=d.documentElement,G=JSON.parse(d.getElementById('bd-data').textContent);
var L=G.lang,U=G.ui,IMG=G.img,P={},KEY='bd-demo-1',EMBED=/[?&]embed=1/.test(location.search);
G.products.forEach(function(p){P[p.id]=p});
var REDUCED=false;try{REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
if(EMBED)root.classList.add('embed');
var $=function(s,r){return (r||d).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))};
function t(k,v){var s=U[k];if(s==null)return k;if(v)for(var x in v)s=s.split('{'+x+'}').join(v[x]);return s}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function sum(n){return fmt(n)+' '+t('sum')}
function ic(k,c){return '<svg class="ic'+(c?' '+c:'')+'" aria-hidden="true"><use href="#i-'+k+'"/></svg>'}
function pad(n){return (n<10?'0':'')+n}
function plural(n,f){if(L!=='ru')return n===1?f[0]:f[2]||f[0];var a=n%10,b=n%100;return a===1&&b!==11?f[0]:a>=2&&a<=4&&(b<12||b>14)?f[1]:f[2]}
function src(p,i,w){return IMG+'/p-'+p.id+'-'+i+'-'+w+'.webp'}
function pic(p,i,sizes,eager){return '<img src="'+src(p,i,600)+'" srcset="'+src(p,i,600)+' 600w, '+src(p,i,1000)+' 1000w" sizes="'+sizes+'" alt="'+h(p.n+(i?', '+t('view')+' '+(i+1):''))+'" width="600" height="600"'+(eager?' fetchpriority="high"':' loading="lazy"')+' decoding="async">'}
function ru(sz,p){var c=G.conv[p.cat==='m'?'m':'w'];return c&&c[sz]!=null?c[sz]:''}
function monthly(price,m){return Math.ceil(price/m/1000)*1000}

/* ── Состояние ─────────────────────────────────────────────────────────── */
var S;
function load(){try{S=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){S=null}
  if(!S||typeof S!=='object')S={};
  S.cart=S.cart||[];S.fav=S.fav||[];S.orders=S.orders||[];S.bookings=S.bookings||[];S.alerts=S.alerts||[];S.sizes=S.sizes||{};S.gift=S.gift||{on:false,card:''};S.stock=S.stock||{}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
load();
addEventListener('storage',function(e){if(e.key===KEY){load();badge();if(route.name==='order'||route.name==='me'||route.name==='product')render()}});
/* Остатки: из данных бутика, панель правит их в S.stock (общая память браузера). */
function stock(p,sz){var k=p.id+':'+sz;return S.stock[k]!=null?S.stock[k]:(p.stock&&p.stock[sz]!=null?p.stock[sz]:0)}
function anyStock(p){if(!p.sizes)return stock(p,'one')>0;return p.sizes.some(function(z){return stock(p,z)>0})}
function spent(){return S.orders.filter(function(o){return o.st!==-1}).reduce(function(s,o){return s+o.T.total},0)}
function level(){var n=S.orders.filter(function(o){return o.st!==-1}).length;return spent()>=G.levels[2].from?2:(n||S.invited)?1:0}

function cartN(){return S.cart.reduce(function(s,c){return s+c.q},0)}
function badge(){var n=cartN();$$('[data-badge="cart"]').forEach(function(b){b.textContent=n;b.hidden=!n});var f=S.fav.length;$$('[data-badge="fav"]').forEach(function(b){b.textContent=f;b.hidden=!f})}

/* ── Тост и шторка ─────────────────────────────────────────────────────── */
var toastT=0;
function toast(msg,act,fn){var el=$('#toast');el.innerHTML='<span>'+msg+'</span>'+(act?'<button type="button">'+act+'</button>':'');el.classList.add('on');
  if(act)$('button',el).onclick=function(){el.classList.remove('on');fn()};clearTimeout(toastT);toastT=setTimeout(function(){el.classList.remove('on')},act?5000:2800)}
var sheetLast=null,sheetT=0;
function sheet(title,body,opts){opts=opts||{};clearTimeout(sheetT);if($('#sheet').hidden)sheetLast=d.activeElement;var s=$('#sheet');
  s.innerHTML='<div class="sh-back" data-close></div><div class="sh-box'+(opts.wide?' wide':'')+'" role="dialog" aria-modal="true" aria-label="'+h(title)+'"><div class="sh-grab" aria-hidden="true"></div><div class="sh-head"><b>'+title+'</b><button type="button" class="ib" data-close aria-label="'+t('close')+'">'+ic('x')+'</button></div><div class="sh-body">'+body+'</div>'+(opts.foot?'<div class="sh-foot">'+opts.foot+'</div>':'')+'</div>';
  s.hidden=false;void s.offsetWidth;s.classList.add('on');root.classList.add('locked');
  $$('[data-close]',s).forEach(function(b){b.onclick=closeSheet});
  var box=$('.sh-box',s),y0=null,dy=0;
  box.addEventListener('touchstart',function(e){if($('.sh-body',s).scrollTop>0||e.target.closest('input,textarea,select'))return;y0=e.touches[0].clientY},{passive:true});
  box.addEventListener('touchmove',function(e){if(y0==null)return;dy=Math.max(0,e.touches[0].clientY-y0);box.style.transform='translateY('+dy+'px)'},{passive:true});
  box.addEventListener('touchend',function(){if(y0==null)return;box.style.transform='';if(dy>90)closeSheet();y0=null;dy=0});
  setTimeout(function(){var f=$('.sh-head button',s);if(f)f.focus({preventScroll:true})},60);
  if(opts.on)opts.on(s);return s}
function closeSheet(){var s=$('#sheet');if(s.hidden)return;s.classList.remove('on');root.classList.remove('locked');sheetT=setTimeout(function(){s.hidden=true;s.innerHTML=''},REDUCED?0:280);if(sheetLast&&sheetLast.focus)sheetLast.focus({preventScroll:true})}
addEventListener('keydown',function(e){if(e.key==='Escape'){closeSheet();closeZoom();closeMenu()}});

/* ── Меню ──────────────────────────────────────────────────────────────── */
function closeMenu(){var m=$('#menu');if(!m||m.hidden)return;m.classList.remove('on');root.classList.remove('locked');setTimeout(function(){m.hidden=true},REDUCED?0:280)}
$('#menu-b').onclick=function(){var m=$('#menu');m.hidden=false;void m.offsetWidth;m.classList.add('on');root.classList.add('locked');var f=$('a',m);if(f)f.focus({preventScroll:true})};
$$('#menu [data-close],#menu a').forEach(function(a){a.addEventListener('click',closeMenu)});

/* ── Корзина и избранное ───────────────────────────────────────────────── */
function line(id,sz){return S.cart.filter(function(x){return x.id===id&&x.sz===sz})[0]}
function addCart(id,sz){var c=line(id,sz);if(c)c.q=Math.min(c.q+1,3);else S.cart.push({id:id,sz:sz,q:1});save();badge();pulse();toast(t('added'),t('toCart'),function(){go('#/cart')})}
function pulse(){if(REDUCED)return;$$('.cart-ic').forEach(function(el){el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump')})}
function toggleFav(id){var i=S.fav.indexOf(id);if(i<0){S.fav.push(id);toast(t('favAdded'))}else S.fav.splice(i,1);save();badge();$$('[data-fav="'+id+'"]').forEach(function(b){var on=S.fav.indexOf(id)>=0;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)})}

/* ── Карточка в сетке ──────────────────────────────────────────────────── */
function card(p,priv){var fav=S.fav.indexOf(p.id)>=0,price=priv?Math.round(p.price*(1-G.priv.off/100)/10000)*10000:p.price;
  return '<article class="pc" data-card="'+p.id+'"><a class="pc-a" href="#/p/'+p.id+'" aria-label="'+h(p.n)+'"></a>'+
  '<div class="pc-im">'+pic(p,0,'(min-width:1100px) 25vw,(min-width:700px) 33vw,50vw')+(p.im>1?'<span class="pc-alt" aria-hidden="true" style="background-image:url('+src(p,1,600)+')"></span>':'')+
  (p.isNew?'<span class="pc-tag">'+t('new')+'</span>':'')+
  '<button type="button" class="fav'+(fav?' on':'')+'" data-fav="'+p.id+'" aria-pressed="'+fav+'" aria-label="'+t('toFav')+'">'+ic('heart')+'</button></div>'+
  '<div class="pc-b"><h3 class="pc-n">'+h(p.n)+'</h3><p class="pc-c">'+h(p.color)+'</p><p class="pc-p">'+(priv?'<s>'+sum(p.price)+'</s> ':'')+'<b>'+sum(price)+'</b></p></div></article>'}

/* ── Экраны ────────────────────────────────────────────────────────────── */
var V={},view=$('#view'),route={name:'home'};
function go(hsh){if(location.hash===hsh)render();else location.hash=hsh}
function parse(){var x=(location.hash||'#/').slice(1).split('?')[0].split('/').filter(Boolean);
  if(!x.length)return {name:'home'};
  if(x[0]==='c')return {name:'catalog',cat:x[1]||'all'};
  if(x[0]==='p')return {name:'product',id:x[1]};
  if(x[0]==='o')return {name:'order',no:x[1]};
  return {name:x[0]}}
function render(){route=parse();var fn=V[route.name]||V.home;if(route.name==='product'&&!P[route.id])fn=V.catalog;
  view.innerHTML=fn(route)||'';view.setAttribute('data-v',route.name);
  $$('[data-nav]').forEach(function(a){if(a.getAttribute('data-nav')===(route.cat||route.name))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
  wire(view);if(V[route.name+'_on'])V[route.name+'_on'](route);reveal();d.title=G.title}
var lastHash=location.hash;
addEventListener('hashchange',function(){var keep=lastHash.split('?')[0]===location.hash.split('?')[0];lastHash=location.hash;closeSheet();render();if(!keep)scrollTo(0,0);try{view.focus({preventScroll:true})}catch(e){}});
function wire(r){$$('[data-fav]',r).forEach(function(b){b.onclick=function(e){e.preventDefault();e.stopPropagation();toggleFav(b.getAttribute('data-fav'))}})}

/* Тихое появление: только opacity и небольшой сдвиг. */
var io=null;
function reveal(){var els=$$('.rv:not(.in)',view);if(REDUCED||!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in')});return}
  if(!io)io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -6% 0px'});
  els.forEach(function(e){io.observe(e)})}

/* Главная: сезон, разделы, новое, «сделано в Италии», бутик. */
V.home=function(){var b=G.boutique,newP=G.products.filter(function(p){return p.isNew}).slice(0,8);
  return '<section class="sh-hero"><picture><source media="(orientation: portrait)" srcset="'+IMG+'/'+G.hero.tall+'"><img src="'+IMG+'/'+G.hero.wide+'" alt="'+h(G.hero.alt)+'" fetchpriority="high" width="1600" height="900"></picture>'+
  '<div class="sh-hero-t"><p class="eyebrow">'+h(G.season)+'</p><h1>'+t('heroH')+'</h1><a class="btn btn-l" href="#/c/new">'+t('heroCta')+'</a></div></section>'+
  '<section class="cats wrap">'+G.cats.filter(function(c){return c.tile}).map(function(c){return '<a class="cat rv" href="#/c/'+c.id+'"><span class="cat-im"><img src="'+IMG+'/'+c.tile+'" alt="'+h(c.n)+'" loading="lazy" width="600" height="750"></span><span class="cat-n">'+h(c.n)+'</span></a>'}).join('')+'</section>'+
  '<section class="rail-s wrap"><div class="row-h rv"><h2>'+t('newIn')+'</h2><a class="lnk" href="#/c/new">'+t('seeAll')+'</a></div><div class="rail">'+newP.map(function(p){return card(p)}).join('')+'</div></section>'+
  '<section class="italy wrap"><div class="it-im rv"><img src="'+IMG+'/'+G.story.img+'" alt="'+h(G.story.alt)+'" loading="lazy" width="900" height="1100"></div><div class="it-t rv"><p class="eyebrow">'+t('storyK')+'</p><h2>'+h(G.story.h)+'</h2>'+G.story.p.map(function(x){return '<p>'+h(x)+'</p>'}).join('')+
  '<ul class="facts">'+G.story.facts.map(function(f){return '<li><b>'+h(f[0])+'</b><span>'+h(f[1])+'</span></li>'}).join('')+'</ul></div></section>'+
  '<div class="wrap"><section class="serv">'+[['hanger',t('s1h'),t('s1p')],['gift',t('s2h'),t('s2p')],['chat',t('s3h'),t('s3p')],['truck',t('s4h'),t('s4p')]].map(function(s){return '<div class="sv rv">'+ic(s[0])+'<b>'+s[1]+'</b><p>'+s[2]+'</p></div>'}).join('')+'</section></div>'+
  boutique(true)};
function boutique(short){var b=G.boutique,open=isOpen();
  return '<section class="btq wrap'+(short?'':' full')+'"><div class="btq-t rv"><p class="eyebrow">'+t('btqK')+'</p><h2>'+h(b.name)+'</h2><p>'+h(b.addr)+'</p>'+
  '<p class="hrs"><span class="dot'+(open?' on':'')+'"></span>'+(open?t('openNow'):t('closedNow'))+'</p><dl><dt>'+t('weekdays')+'</dt><dd>'+b.hours[0]+'</dd><dt>'+t('weekend')+'</dt><dd>'+b.hours[1]+'</dd></dl>'+
  '<div class="btq-b"><button type="button" class="btn" data-book="">'+ic('hanger')+'<span>'+t('bookVisit')+'</span></button><a class="btn btn-o" href="'+b.ig+'" rel="noopener">'+ic('ig')+'<span>@'+h(b.igName)+'</span></a></div></div>'+
  '<div class="btq-im rv"><img src="'+IMG+'/'+G.boutique.img+'" alt="'+h(G.boutique.alt)+'" loading="lazy" width="900" height="700"></div></section>'}
V.home_on=function(){wireBook(view)};
function isOpen(){var x=new Date(),h=x.getHours(),wd=x.getDay();var end=(wd===0||wd===6)?24:23;return h>=10&&h<end}
V.boutique=function(){return '<div class="pg-h wrap"><h1>'+t('btqK')+'</h1></div>'+boutique(false)};
V.boutique_on=V.home_on;

/* Каталог: разделы, фильтры в шторке, сортировка. */
var F={sz:[],col:[],mat:[],heel:[],pr:'',sort:'new'};
function heelOf(p){return p.heel==null?null:p.heel<=3?'flat':p.heel<=7?'mid':'high'}
function list(cat){return G.products.filter(function(p){
  if(cat==='new'&&!p.isNew)return false;if(cat!=='all'&&cat!=='new'&&p.cat!==cat)return false;
  if(F.sz.length&&!(p.sizes&&p.sizes.some(function(z){return F.sz.indexOf(z)>=0&&stock(p,z)>0})))return false;
  if(F.col.length&&F.col.indexOf(p.ck)<0)return false;if(F.mat.length&&F.mat.indexOf(p.mk)<0)return false;
  if(F.heel.length&&F.heel.indexOf(heelOf(p))<0)return false;
  if(F.pr){var r=G.prices[+F.pr];if(p.price<r[0]||p.price>r[1])return false}
  return true}).sort(function(a,b){return F.sort==='up'?a.price-b.price:F.sort==='down'?b.price-a.price:(b.isNew?1:0)-(a.isNew?1:0)||a.ord-b.ord})}
function nF(){return F.sz.length+F.col.length+F.mat.length+F.heel.length+(F.pr?1:0)}
V.catalog=function(r){var c=G.cats.filter(function(x){return x.id===r.cat})[0]||G.cats[0],items=list(c.id);
  return '<div class="pg-h wrap"><p class="crumb"><a href="#/">'+t('home')+'</a></p><h1>'+h(c.n)+'</h1></div>'+
  '<nav class="chips wrap" aria-label="'+t('sections')+'">'+G.cats.map(function(x){return '<a href="#/c/'+x.id+'"'+(x.id===c.id?' aria-current="page"':'')+'>'+h(x.n)+'</a>'}).join('')+'</nav>'+
  '<div class="tools wrap"><button type="button" class="tool" id="f-open">'+ic('filter')+'<span>'+t('filters')+'</span>'+(nF()?'<b>'+nF()+'</b>':'')+'</button><span class="cnt" id="cat-n">'+items.length+' '+plural(items.length,[t('mod1'),t('mod2'),t('mod5')])+'</span>'+
  '<label class="tool sort">'+ic('sort')+'<select id="sort" aria-label="'+t('sort')+'"><option value="new">'+t('sortNew')+'</option><option value="up">'+t('sortUp')+'</option><option value="down">'+t('sortDown')+'</option></select></label></div>'+
  '<div class="grid wrap" id="cat-grid">'+(items.length?items.map(function(p){return card(p)}).join(''):'<p class="empty">'+t('noMatch')+' <button type="button" class="lnk" id="f-reset">'+t('reset')+'</button></p>')+'</div>'}
V.catalog_on=function(r){var s=$('#sort');s.value=F.sort;s.onchange=function(){F.sort=s.value;render()};$('#f-open').onclick=function(){filters(r.cat)};var fr=$('#f-reset');if(fr)fr.onclick=function(){F={sz:[],col:[],mat:[],heel:[],pr:'',sort:F.sort};render()}};
function filters(cat){var sizes=cat==='m'?G.sizes.m:cat==='w'?G.sizes.w:cat==='bag'||cat==='acc'?[]:G.sizes.w.concat(G.sizes.m.filter(function(z){return G.sizes.w.indexOf(z)<0}));
  function chip(g,v,n,sw){var on=F[g].indexOf(v)>=0;return '<button type="button" class="fc'+(sw?' sw':'')+'" data-g="'+g+'" data-v="'+v+'" aria-pressed="'+on+'">'+(sw?'<i style="background:'+sw+'"></i>':'')+'<span>'+h(n)+'</span></button>'}
  var body=(sizes.length?'<fieldset><legend>'+t('fSize')+' <small>EU</small></legend><div class="fcs">'+sizes.map(function(z){return chip('sz',z,z)}).join('')+'</div></fieldset>':'')+
  '<fieldset><legend>'+t('fColor')+'</legend><div class="fcs">'+G.colors.map(function(c){return chip('col',c.id,c.n,c.hex)}).join('')+'</div></fieldset>'+
  '<fieldset><legend>'+t('fMat')+'</legend><div class="fcs">'+G.mats.map(function(m){return chip('mat',m.id,m.n)}).join('')+'</div></fieldset>'+
  (cat==='bag'||cat==='acc'?'':'<fieldset><legend>'+t('fHeel')+'</legend><div class="fcs">'+[['flat',t('hFlat')],['mid',t('hMid')],['high',t('hHigh')]].map(function(x){return chip('heel',x[0],x[1])}).join('')+'</div></fieldset>')+
  '<fieldset><legend>'+t('fPrice')+'</legend><div class="fcs">'+G.prices.map(function(r,i){return '<button type="button" class="fc" data-pr="'+i+'" aria-pressed="'+(F.pr===String(i))+'"><span>'+h(r[2])+'</span></button>'}).join('')+'</div></fieldset>';
  sheet(t('filters'),body,{foot:'<button type="button" class="lnk" id="f-clear">'+t('reset')+'</button><button type="button" class="btn" id="f-go"></button>',on:function(s){
    function cnt(){$('#f-go',s).textContent=t('show')+' '+list(cat).length}cnt();
    $$('[data-g]',s).forEach(function(b){b.onclick=function(){var g=b.getAttribute('data-g'),v=b.getAttribute('data-v'),i=F[g].indexOf(v);if(i<0)F[g].push(v);else F[g].splice(i,1);b.setAttribute('aria-pressed',i<0);cnt()}});
    $$('[data-pr]',s).forEach(function(b){b.onclick=function(){var v=b.getAttribute('data-pr');F.pr=F.pr===v?'':v;$$('[data-pr]',s).forEach(function(x){x.setAttribute('aria-pressed',x.getAttribute('data-pr')===F.pr)});cnt()}});
    $('#f-clear',s).onclick=function(){F={sz:[],col:[],mat:[],heel:[],pr:'',sort:F.sort};$$('[aria-pressed]',s).forEach(function(x){x.setAttribute('aria-pressed','false')});cnt()};
    $('#f-go',s).onclick=function(){closeSheet();render()}}})}

/* Карточка товара. */
var PD={sz:null,unit:'eu'};
V.product=function(r){var p=P[r.id],fav=S.fav.indexOf(p.id)>=0;if(PD.id!==p.id){PD={id:p.id,sz:mySize(p),unit:PD.unit}}
  var gal='';for(var i=0;i<p.im;i++)gal+='<button type="button" class="gi" data-zoom="'+i+'" aria-label="'+t('zoom')+'">'+pic(p,i,'(min-width:1000px) 50vw,100vw',i===0)+'</button>';
  var dots='';for(var j=0;j<p.im;j++)dots+='<i'+(j?'':' class="on"')+'></i>';
  var look=(p.look||[]).map(function(id){return P[id]}).filter(Boolean);
  return '<div class="pd wrap" data-id="'+p.id+'"><p class="crumb"><a href="#/c/'+p.cat+'">'+h(catName(p.cat))+'</a></p>'+
  '<div class="pd-g"><div class="gal" id="gal">'+gal+'</div>'+(p.im>1?'<div class="gal-dots" aria-hidden="true">'+dots+'</div>':'')+'</div>'+
  '<div class="pd-i"><p class="eyebrow">'+h(p.line)+'</p><h1>'+h(p.n)+'</h1><p class="pd-c">'+h(p.color)+(p.art?' · <span class="art">'+h(p.art)+'</span>':'')+'</p>'+
  '<p class="pd-p"><b>'+sum(p.price)+'</b><button type="button" class="fav'+(fav?' on':'')+'" data-fav="'+p.id+'" aria-pressed="'+fav+'" aria-label="'+t('toFav')+'">'+ic('heart')+'</button></p>'+
  '<p class="pd-nas">'+t('nasLine',{n:fmt(monthly(p.price,12))})+'</p>'+
  (p.sizes?'<div class="sz-h"><b>'+t('size')+'</b><div class="unit" role="radiogroup" aria-label="'+t('sizeUnit')+'"><button type="button" role="radio" data-unit="eu" aria-checked="'+(PD.unit==='eu')+'">EU</button><button type="button" role="radio" data-unit="ru" aria-checked="'+(PD.unit==='ru')+'">RU</button></div><button type="button" class="lnk" id="sz-guide">'+t('sizeGuide')+'</button></div>'+
    '<div class="szs" id="szs" role="radiogroup" aria-label="'+t('size')+'">'+p.sizes.map(function(z){var n=stock(p,z);return '<button type="button" role="radio" data-size="'+z+'" aria-checked="'+(PD.sz===z)+'" class="'+(n?'':'out')+'"><span>'+(PD.unit==='ru'?ru(z,p):z)+'</span></button>'}).join('')+'</div>'+
    '<p class="stk" id="stk">'+stockLine(p)+'</p>':'<p class="stk" id="stk">'+stockLine(p)+'</p>')+
  '<div class="pd-buy" id="pd-buy"><button type="button" class="btn btn-l" id="pd-add">'+ic('bag')+'<span>'+t('toCart')+'</span></button>'+
  '<button type="button" class="btn btn-o btn-l" id="bk-open" data-book="'+p.id+'">'+ic('hanger')+'<span>'+t('bookTry')+'</span></button></div>'+
  '<button type="button" class="ask" id="ask">'+ic('chat')+'<span><b>'+t('askH')+'</b><small>'+t('askP')+'</small></span>'+ic('chev')+'</button>'+
  '<ul class="dlv">'+[['truck',t('dl1h'),t('dl1p')],['hanger',t('dl2h'),t('dl2p')],['pin',t('dl3h'),t('dl3p',{h:G.boutique.short})],['gift',t('dl4h'),t('dl4p')]].map(function(x){return '<li>'+ic(x[0])+'<span><b>'+x[1]+'</b><small>'+x[2]+'</small></span></li>'}).join('')+'</ul>'+
  '<details class="acc" open><summary>'+t('details')+'</summary><p>'+h(p.desc)+'</p><dl class="spec">'+p.spec.map(function(x){return '<dt>'+h(x[0])+'</dt><dd>'+h(x[1])+'</dd>'}).join('')+'</dl></details>'+
  '<details class="acc"><summary>'+t('care')+'</summary><p>'+h(G.care[p.mk]||G.care.leather)+'</p></details>'+
  '</div></div>'+
  (look.length?'<section class="look wrap"><div class="row-h"><h2>'+t('lookH')+'</h2><button type="button" class="lnk" id="look-add">'+t('lookAdd')+'</button></div><div class="rail">'+look.map(function(x){return card(x)}).join('')+'</div></section>':'')+
  '<div class="pd-bar" id="pd-bar"><span><small>'+h(p.n)+'</small><b>'+sum(p.price)+'</b></span><button type="button" class="btn" id="pd-add2">'+t('toCart')+'</button></div>'}
function catName(id){var c=G.cats.filter(function(x){return x.id===id})[0];return c?c.n:''}
function mySize(p){if(!p.sizes)return null;var my=S.sizes[p.cat==='m'?'m':'w'];return my&&p.sizes.indexOf(my)>=0&&stock(p,my)>0?my:null}
function stockLine(p){var sz=p.sizes?PD.sz:'one';if(p.sizes&&!sz)return '<span class="muted">'+t('pickSize')+'</span>';var n=stock(p,sz);
  return n?'<span class="ok">'+ic('check')+t('inBtq',{n:n})+'</span>':'<span class="no">'+t('noSize')+' <button type="button" class="lnk" id="notify">'+t('notify')+'</button></span>'}
V.product_on=function(r){var p=P[r.id];
  var g=$('#gal'),dots=$$('.gal-dots i');if(g&&dots.length)g.addEventListener('scroll',function(){var k=Math.round(g.scrollLeft/g.clientWidth);dots.forEach(function(x,i){x.classList.toggle('on',i===k)})},{passive:true});
  $$('[data-zoom]').forEach(function(b){b.onclick=function(){zoom(p,+b.getAttribute('data-zoom'))}});
  /* Приближение на ПК: точка под курсором, только transform. */
  if(matchMedia('(hover:hover) and (pointer:fine)').matches)$$('.gi').forEach(function(b){var im=$('img',b);b.addEventListener('mousemove',function(e){var r=b.getBoundingClientRect();im.style.transformOrigin=((e.clientX-r.left)/r.width*100).toFixed(1)+'% '+((e.clientY-r.top)/r.height*100).toFixed(1)+'%';b.classList.add('lens')});b.addEventListener('mouseleave',function(){b.classList.remove('lens')})});
  $$('[data-size]').forEach(function(b){b.onclick=function(){var z=b.getAttribute('data-size');if(!stock(p,z)){PD.sz=z;notify(p,z);syncSize(p);return}PD.sz=z;S.sizes[p.cat==='m'?'m':'w']=z;save();syncSize(p)}});
  $$('[data-unit]').forEach(function(b){b.onclick=function(){PD.unit=b.getAttribute('data-unit');render()}});
  var sg=$('#sz-guide');if(sg)sg.onclick=function(){guide(p)};
  function add(){if(p.sizes&&!PD.sz){toast(t('pickSize'));var z=$('#szs');if(z){z.classList.remove('shake');void z.offsetWidth;z.classList.add('shake')}return}if(!stock(p,p.sizes?PD.sz:'one')){notify(p,PD.sz);return}addCart(p.id,p.sizes?PD.sz:'one')}
  $('#pd-add').onclick=add;$('#pd-add2').onclick=add;
  $('#ask').onclick=function(){ask(p)};
  wireBook(view);wireNotify(p);
  var la=$('#look-add');if(la)la.onclick=function(){(p.look||[]).forEach(function(id){var x=P[id];if(!x)return;var z=x.sizes?mySize(x):'one';if(x.sizes&&!z){return}if(stock(x,z||'one'))addCart(id,z||'one')});toast(t('lookAdded'),t('toCart'),function(){go('#/cart')})};
  var bar=$('#pd-bar'),buy=$('#pd-buy');if(bar&&buy&&'IntersectionObserver' in window){new IntersectionObserver(function(es){bar.classList.toggle('on',!es[0].isIntersecting&&es[0].boundingClientRect.top<0)}).observe(buy)}};
function syncSize(p){$$('[data-size]').forEach(function(b){b.setAttribute('aria-checked',b.getAttribute('data-size')===PD.sz)});$('#stk').innerHTML=stockLine(p);wireNotify(p)}
function wireNotify(p){var n=$('#notify');if(n)n.onclick=function(){notify(p,PD.sz)}}
function guide(p){var conv=G.conv[p.cat==='m'?'m':'w'],g=G.guide[p.cat==='m'?'m':'w'],rows=p.sizes.map(function(z){var r=g[z];return '<tr><td>'+z+'</td><td>'+r[0]+'</td><td>'+r[1]+'</td><td>'+conv[z]+'</td><td>'+String(G.foot[p.cat==='m'?'m':'w'][z]).replace('.',L==='en'?'.':',')+'</td></tr>'}).join('');
  sheet(t('sizeGuide'),'<p class="muted">'+t('guideP')+'</p><div class="szt-w"><table class="szt"><thead><tr><th>EU</th><th>US</th><th>UK</th><th>RU*</th><th>'+t('footCm')+'*</th></tr></thead><tbody>'+rows+'</tbody></table></div><p class="muted sm">'+t('guideN')+'</p>'+
  '<div class="calc"><label for="foot">'+t('footAsk')+'</label><div class="calc-r"><input id="foot" type="number" inputmode="decimal" step="0.1" min="20" max="32" placeholder="24,5"><span>'+t('cm')+'</span></div><p id="foot-r" class="muted" aria-live="polite"></p></div>',{on:function(s){
    var f=$('#foot',s);f.oninput=function(){var v=parseFloat(String(f.value).replace(',','.')),tb=G.foot[p.cat==='m'?'m':'w'],best=null;for(var z in tb){if(tb[z]>=v-0.15){best=z;break}}
      $('#foot-r',s).innerHTML=v>=20&&best&&p.sizes.indexOf(best)>=0?t('footRes',{eu:best,ru:conv[best]})+' <button type="button" class="lnk" id="foot-pick">'+t('pick')+'</button>':v?t('footNone'):'';
      var fp=$('#foot-pick',s);if(fp)fp.onclick=function(){PD.sz=best;S.sizes[p.cat==='m'?'m':'w']=best;save();closeSheet();syncSize(p)}}}})}
function notify(p,sz){sheet(t('notifyH'),'<p>'+t('notifyP',{n:h(p.n),s:sz&&sz!=='one'?'EU '+sz:''})+'</p><label class="fld"><span>'+t('phone')+'</span><input id="nt-ph" type="tel" inputmode="tel" autocomplete="tel" placeholder="+998 90 123 45 67" value="'+h(S.phone||'')+'"></label>',{foot:'<button type="button" class="btn btn-l" id="nt-go">'+t('notifyGo')+'</button>',on:function(s){
  $('#nt-go',s).onclick=function(){var ph=$('#nt-ph',s).value.trim();if(ph.replace(/\D/g,'').length<9){$('#nt-ph',s).focus();toast(t('phoneAsk'));return}
    S.phone=ph;S.alerts.unshift({id:'AL-'+Date.now().toString(36).toUpperCase(),pid:p.id,sz:sz||'one',ph:ph,ts:Date.now()});save();closeSheet();toast(t('notifyOk'))}}})}
function ask(p){var qs=t('askQs').split('|');
  sheet(t('askH'),'<p class="muted">'+t('askLead')+'</p><ul class="qs">'+qs.map(function(q){return '<li>'+h(q.replace('{n}',p.n))+'</li>'}).join('')+'</ul><p class="muted sm">'+t('askNote')+'</p>',{foot:'<a class="btn btn-l" href="'+G.boutique.dm+'" rel="noopener">'+ic('ig')+'<span>'+t('askGo')+'</span></a>'})}

/* Приближение: на весь экран, нажатие приближает в точке, второе отдаляет. */
function zoom(p,i){var z=$('#zoom');z.innerHTML='<button type="button" class="ib zx" aria-label="'+t('close')+'">'+ic('x')+'</button><div class="zs">'+Array.apply(null,Array(p.im)).map(function(_,k){return '<div class="zi"><img src="'+src(p,k,1000)+'" alt="'+h(p.n)+'" loading="lazy" width="1000" height="1000"></div>'}).join('')+'</div><p class="zh">'+t('zoomHint')+'</p>';
  z.hidden=false;void z.offsetWidth;z.classList.add('on');root.classList.add('locked');var sc=$('.zs',z);sc.scrollLeft=sc.clientWidth*i;
  $('.zx',z).onclick=closeZoom;$('.zx',z).focus({preventScroll:true});
  $$('.zi',z).forEach(function(box){var im=$('img',box);box.onclick=function(e){var r=box.getBoundingClientRect();if(box.classList.contains('in')){box.classList.remove('in');im.style.transform=''}else{im.style.transformOrigin=((e.clientX-r.left)/r.width*100)+'% '+((e.clientY-r.top)/r.height*100)+'%';box.classList.add('in');im.style.transform='scale(2.4)'}}})}
function closeZoom(){var z=$('#zoom');if(!z||z.hidden)return;z.classList.remove('on');root.classList.remove('locked');setTimeout(function(){z.hidden=true;z.innerHTML=''},REDUCED?0:260)}

/* Бронь примерки в бутике. */
function wireBook(r){$$('[data-book]',r).forEach(function(b){b.onclick=function(){book(b.getAttribute('data-book'))}})}
function days(n){var out=[],x=new Date();x.setHours(0,0,0,0);for(var i=0;i<n;i++){var y=new Date(x.getTime()+i*864e5);out.push(y)}return out}
function dlabel(x,i){return i===0?t('today'):i===1?t('tomorrow'):G.wd[x.getDay()]+' '+x.getDate()}
function slots(x,i){var we=x.getDay()===0||x.getDay()===6,end=we?23:22,out=[],now=new Date();for(var hh=10;hh<=end;hh++){if(i===0&&hh<=now.getHours()+1)continue;out.push(pad(hh)+':00')}return out}
function book(pid){var p=pid?P[pid]:null,sz=p&&p.sizes?(PD.id===pid&&PD.sz?PD.sz:mySize(p)):null,ds=days(7),di=0,tm=null;
  var body=(p?'<div class="bk-p">'+pic(p,0,'80px')+'<span><b>'+h(p.n)+'</b><small>'+h(p.color)+(p.sizes?' · <span id="bk-sz">'+(sz?'EU '+sz:t('pickSize'))+'</span>':'')+'</small></span></div>'+
    (p.sizes?'<div class="szs mini" id="bk-szs">'+p.sizes.map(function(z){return '<button type="button" data-bsz="'+z+'" aria-pressed="'+(z===sz)+'" class="'+(stock(p,z)?'':'out')+'"'+(stock(p,z)?'':' disabled')+'>'+z+'</button>'}).join('')+'</div>':''):'<p class="muted">'+t('bookAny')+'</p>')+
    '<p class="lbl">'+t('day')+'</p><div class="days" id="bk-days">'+ds.map(function(x,i){return '<button type="button" data-di="'+i+'" aria-pressed="'+(i===0)+'">'+dlabel(x,i)+'</button>'}).join('')+'</div>'+
    '<p class="lbl">'+t('time')+'</p><div class="times" id="bk-times"></div>'+
    '<label class="fld"><span>'+t('name')+'</span><input id="bk-nm" autocomplete="name" value="'+h(S.name||'')+'"></label><label class="fld"><span>'+t('phone')+'</span><input id="bk-ph" type="tel" inputmode="tel" autocomplete="tel" placeholder="+998 90 123 45 67" value="'+h(S.phone||'')+'"></label>'+
    '<p class="muted sm">'+t('bookNote',{b:G.boutique.short})+'</p>';
  sheet(t('bookH'),body,{foot:'<button type="button" class="btn btn-l" id="bk-go">'+t('bookGo')+'</button>',on:function(s){
    function times(){var x=ds[di],sl=slots(x,di);if(sl.indexOf(tm)<0)tm=null;$('#bk-times',s).innerHTML=sl.length?sl.map(function(v){return '<button type="button" data-tm="'+v+'" aria-pressed="'+(v===tm)+'">'+v+'</button>'}).join(''):'<p class="muted">'+t('noSlots')+'</p>';
      $$('[data-tm]',s).forEach(function(b){b.onclick=function(){tm=b.getAttribute('data-tm');$$('[data-tm]',s).forEach(function(x){x.setAttribute('aria-pressed',x===b)})}})}
    if(!slots(ds[0],0).length)di=1;$$('[data-di]',s).forEach(function(b){b.setAttribute('aria-pressed',+b.getAttribute('data-di')===di);b.onclick=function(){di=+b.getAttribute('data-di');$$('[data-di]',s).forEach(function(x){x.setAttribute('aria-pressed',x===b)});times()}});times();
    $$('[data-bsz]',s).forEach(function(b){b.onclick=function(){sz=b.getAttribute('data-bsz');$$('[data-bsz]',s).forEach(function(x){x.setAttribute('aria-pressed',x===b)});$('#bk-sz',s).textContent='EU '+sz}});
    $('#bk-go',s).onclick=function(){var nm=$('#bk-nm',s).value.trim(),ph=$('#bk-ph',s).value.trim();
      if(p&&p.sizes&&!sz){toast(t('pickSize'));return}if(!tm){toast(t('pickTime'));return}if(!nm){$('#bk-nm',s).focus();toast(t('nameAsk'));return}if(ph.replace(/\D/g,'').length<9){$('#bk-ph',s).focus();toast(t('phoneAsk'));return}
      S.name=nm;S.phone=ph;var x=ds[di],bk={id:'TR-'+(1000+S.bookings.length+Math.floor(Math.random()*90)),ts:Date.now(),pid:p?p.id:null,sz:sz,day:x.getFullYear()+'-'+pad(x.getMonth()+1)+'-'+pad(x.getDate()),tm:tm,nm:nm,ph:ph,st:'new'};
      S.bookings.unshift(bk);save();closeSheet();
      sheet(t('bookedH'),'<div class="done-i">'+ic('check')+'</div><p class="ctr"><b>'+dlabel(x,di)+', '+tm+'</b><br>'+h(G.boutique.name)+'</p><p class="ctr muted">'+t('bookedP')+'</p>',{foot:'<a class="btn btn-l" href="#/me?bk">'+t('myBookings')+'</a>'})}}})}

/* Корзина: подарочная упаковка и открытка. */
function totals(){var goods=0;S.cart.forEach(function(c){goods+=P[c.id].price*c.q});var deliv=0;return {goods:goods,wrap:0,deliv:deliv,total:goods+deliv}}
V.cart=function(){if(!S.cart.length)return '<div class="pg-h wrap"><h1>'+t('cart')+'</h1></div><div class="empty-s wrap">'+ic('bag','big')+'<p>'+t('cartEmpty')+'</p><a class="btn" href="#/c/new">'+t('heroCta')+'</a></div>';
  var T=totals();
  return '<div class="pg-h wrap"><h1>'+t('cart')+'</h1></div><div class="cart wrap"><div class="cl">'+S.cart.map(function(c,i){var p=P[c.id];return '<div class="ci"><a href="#/p/'+p.id+'" class="ci-im">'+pic(p,0,'120px')+'</a><div class="ci-b"><a href="#/p/'+p.id+'"><b>'+h(p.n)+'</b></a><small>'+h(p.color)+(c.sz!=='one'?' · EU '+c.sz+' / RU '+ru(c.sz,p):'')+'</small><div class="ci-r"><div class="qty"><button type="button" data-qm="'+i+'" aria-label="'+t('less')+'">'+ic('minus')+'</button><b>'+c.q+'</b><button type="button" data-qp="'+i+'" aria-label="'+t('more')+'">'+ic('plus')+'</button></div><b>'+sum(p.price*c.q)+'</b></div><button type="button" class="lnk sm" data-rm="'+i+'">'+t('remove')+'</button></div></div>'}).join('')+
  '<div class="gift" id="gift"><label class="tg"><input type="checkbox" id="gift-on"'+(S.gift.on?' checked':'')+'><span class="sw" aria-hidden="true"></span><span><b>'+ic('gift')+t('giftH')+'</b><small>'+t('giftP')+'</small></span></label>'+
  '<div class="gift-c" id="gift-c"'+(S.gift.on?'':' hidden')+'><label class="fld"><span>'+t('cardText')+'</span><textarea id="gift-t" maxlength="200" rows="3" placeholder="'+t('cardPh')+'">'+h(S.gift.card)+'</textarea></label><small class="muted" id="gift-n">'+(200-S.gift.card.length)+' / 200</small></div></div></div>'+
  '<aside class="sum"><div class="sm-l"><span>'+t('goods')+'</span><span>'+sum(T.goods)+'</span></div><div class="sm-l"><span>'+t('giftWrap')+'</span><span>'+(S.gift.on?t('free'):t('notAdded'))+'</span></div><div class="sm-l"><span>'+t('delivery')+'</span><span>'+t('free')+'</span></div><div class="sm-t"><span>'+t('total')+'</span><b>'+sum(T.total)+'</b></div>'+
  '<a class="btn btn-l" id="co-go" href="#/checkout">'+t('checkout')+'</a><p class="muted sm">'+t('cartNote')+'</p></aside></div>'};
V.cart_on=function(){$$('[data-qm]').forEach(function(b){b.onclick=function(){var c=S.cart[+b.getAttribute('data-qm')];c.q--;if(c.q<=0)S.cart.splice(S.cart.indexOf(c),1);save();badge();render()}});
  $$('[data-qp]').forEach(function(b){b.onclick=function(){var c=S.cart[+b.getAttribute('data-qp')];c.q=Math.min(3,c.q+1);save();badge();render()}});
  $$('[data-rm]').forEach(function(b){b.onclick=function(){var c=S.cart.splice(+b.getAttribute('data-rm'),1)[0];save();badge();render();toast(t('removed'),t('undo'),function(){S.cart.push(c);save();badge();render()})}});
  var g=$('#gift-on');if(g)g.onchange=function(){S.gift.on=g.checked;save();render()};var gt=$('#gift-t');if(gt)gt.oninput=function(){S.gift.card=gt.value.slice(0,200);save();$('#gift-n').textContent=(200-S.gift.card.length)+' / 200'}};

/* Оформление в один экран. */
var CO={step:S.verified?2:0,recv:'courier',day:0,slot:null,tryon:true,pay:'click',nas:12};
V.checkout=function(){if(!S.cart.length)return V.cart();var T=totals(),ds=days(2);
  var slotsH=['10:00-14:00','14:00-18:00','18:00-22:00'];
  return '<div class="pg-h wrap"><h1>'+t('checkout')+'</h1></div><div class="co wrap"><div class="co-m">'+
  '<section class="co-s"><h2><i>1</i>'+t('coContact')+'</h2>'+(S.verified?'<p class="ok-l">'+ic('check')+'<span>'+h(S.phone)+'</span><button type="button" class="lnk" id="ph-chg">'+t('change')+'</button></p><label class="fld"><span>'+t('name')+'</span><input id="nm" autocomplete="name" value="'+h(S.name||'')+'"></label>':
    '<label class="fld"><span>'+t('phone')+'</span><span class="ph-in"><b>+998</b><input id="ph" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="90 123 45 67" value="'+h((S.phone||'').replace(/^\+?998\s?/,''))+'"></span></label><button type="button" class="btn btn-o" id="ph-go">'+t('getCode')+'</button>'+
    '<div class="code-w" id="code-w" hidden><p class="muted sm">'+t('codeSent')+'</p><div class="code" id="code">'+[0,1,2,3].map(function(){return '<input inputmode="numeric" maxlength="1" aria-label="'+t('code')+'">'}).join('')+'</div></div>')+'</section>'+
  '<section class="co-s"><h2><i>2</i>'+t('coRecv')+'</h2><div class="opts">'+
    opt('recv','courier',CO.recv==='courier','truck',t('rCourier'),t('rCourierP'))+opt('recv','pickup',CO.recv==='pickup','pin',t('rPickup'),t('rPickupP',{b:G.boutique.short}))+'</div>'+
    (CO.recv==='courier'?'<div class="sub-o"><p class="lbl">'+t('day')+'</p><div class="days">'+ds.map(function(x,i){return '<button type="button" data-cday="'+i+'" aria-pressed="'+(CO.day===i)+'">'+dlabel(x,i)+'</button>'}).join('')+'</div><p class="lbl">'+t('time')+'</p><div class="times">'+slotsH.map(function(v,i){var off=CO.day===0&&new Date().getHours()>=[11,15,19][i];return '<button type="button" data-cslot="'+v+'" aria-pressed="'+(CO.slot===v)+'"'+(off?' disabled':'')+'>'+v+'</button>'}).join('')+'</div>'+
      '<label class="fld"><span>'+t('addr')+'</span><input id="ad" autocomplete="street-address" placeholder="'+t('addrPh')+'" value="'+h(S.addr||'')+'"></label><label class="fld"><span>'+t('dist')+'</span><select id="dist">'+G.districts.map(function(x){return '<option'+(S.dist===x?' selected':'')+'>'+h(x)+'</option>'}).join('')+'</select></label>'+
      '<label class="tg"><input type="checkbox" id="tryon"'+(CO.tryon?' checked':'')+'><span class="sw" aria-hidden="true"></span><span><b>'+t('tryDoor')+'</b><small>'+t('tryDoorP')+'</small></span></label></div>':'<div class="sub-o"><p class="muted">'+h(G.boutique.name)+', '+h(G.boutique.addr)+'</p></div>')+'</section>'+
  '<section class="co-s"><h2><i>3</i>'+t('coPay')+'</h2><div class="opts pays">'+G.pays.map(function(x){return opt('pay',x.id,CO.pay===x.id,x.i,x.n,x.p)}).join('')+'</div>'+
    '<div class="nas-l"><label class="tg"><input type="radio" name="pay" value="nasiya"'+(CO.pay==='nasiya'?' checked':'')+'><span class="rd" aria-hidden="true"></span><span><b>'+t('nasH')+'</b><small>'+t('nasP')+'</small></span></label>'+
    (CO.pay==='nasiya'?'<div class="nas-m">'+[3,6,12].map(function(m){return '<button type="button" data-nm="'+m+'" aria-pressed="'+(CO.nas===m)+'"><b>'+fmt(monthly(T.total,m))+'</b><small>'+m+' '+t('mo')+'</small></button>'}).join('')+'</div><p class="muted sm">'+t('nasNote')+'</p>':'')+'</div></section>'+
  '</div><aside class="sum co-sum"><h2>'+t('yourOrder')+'</h2>'+S.cart.map(function(c){var p=P[c.id];return '<div class="cs-i">'+pic(p,0,'56px')+'<span><b>'+h(p.n)+'</b><small>'+(c.sz!=='one'?'EU '+c.sz+' · ':'')+c.q+' '+t('pcs')+'</small></span><span>'+sum(p.price*c.q)+'</span></div>'}).join('')+
  (S.gift.on?'<p class="cs-g">'+ic('gift')+t('giftH')+'</p>':'')+'<div class="sm-l"><span>'+t('delivery')+'</span><span>'+t('free')+'</span></div><div class="sm-t"><span>'+t('total')+'</span><b>'+sum(T.total)+'</b></div>'+
  '<button type="button" class="btn btn-l" id="co-pay">'+(CO.pay==='cash'?t('placeCash'):CO.pay==='nasiya'?t('placeNas'):t('payN',{n:sum(T.total)}))+'</button><p class="muted sm">'+t('agree')+' <a href="'+G.terms+'">'+t('terms')+'</a></p></aside></div>'};
function opt(name,val,on,i,n,p){return '<label class="op"><input type="radio" name="'+name+'" value="'+val+'"'+(on?' checked':'')+'><span class="rd" aria-hidden="true"></span>'+(i?ic(i):'')+'<span><b>'+h(n)+'</b>'+(p?'<small>'+h(p)+'</small>':'')+'</span></label>'}
V.checkout_on=function(){if(!S.cart.length){V.cart_on();return}
  var pg=$('#ph-go');if(pg)pg.onclick=function(){var v=$('#ph').value.replace(/\D/g,'');if(v.length<9){$('#ph').focus();toast(t('phoneAsk'));return}S.phone='+998 '+v.slice(-9,-7)+' '+v.slice(-7,-4)+' '+v.slice(-4,-2)+' '+v.slice(-2);save();$('#code-w').hidden=false;pg.hidden=true;var f=$('#code input');f.focus()};
  var ins=$$('#code input');ins.forEach(function(inp,i){inp.oninput=function(){inp.value=inp.value.replace(/\D/g,'').slice(0,1);if(inp.value&&ins[i+1])ins[i+1].focus();var v=ins.map(function(x){return x.value}).join('');if(v.length===4){if(v===G.code){S.verified=true;save();CO.step=2;render()}else{toast(t('codeBad'));ins.forEach(function(x){x.value=''});ins[0].focus()}}}});
  var pc=$('#ph-chg');if(pc)pc.onclick=function(){S.verified=false;save();render()};
  var nm=$('#nm');if(nm)nm.oninput=function(){S.name=nm.value;save()};
  $$('input[name=recv]').forEach(function(r){r.onchange=function(){CO.recv=r.value;render()}});
  $$('[data-cday]').forEach(function(b){b.onclick=function(){CO.day=+b.getAttribute('data-cday');CO.slot=null;render()}});
  $$('[data-cslot]').forEach(function(b){b.onclick=function(){CO.slot=b.getAttribute('data-cslot');$$('[data-cslot]').forEach(function(x){x.setAttribute('aria-pressed',x===b)})}});
  var ad=$('#ad');if(ad)ad.oninput=function(){S.addr=ad.value;save()};var ds=$('#dist');if(ds)ds.onchange=function(){S.dist=ds.value;save()};
  var tr=$('#tryon');if(tr)tr.onchange=function(){CO.tryon=tr.checked};
  $$('input[name=pay]').forEach(function(r){r.onchange=function(){CO.pay=r.value;render()}});
  $$('[data-nm]').forEach(function(b){b.onclick=function(){CO.nas=+b.getAttribute('data-nm');render()}});
  $('#co-pay').onclick=function(){
    if(!S.verified){toast(t('verifyAsk'));var f=$('#ph')||$('#code input');if(f)f.focus();return}
    if(!(S.name||'').trim()){toast(t('nameAsk'));$('#nm').focus();return}
    if(CO.recv==='courier'){if(!CO.slot){toast(t('pickTime'));return}if(!(S.addr||'').trim()){toast(t('addrAsk'));$('#ad').focus();return}if(!S.dist&&$('#dist'))S.dist=$('#dist').value}
    if(CO.pay==='cash')place();else if(CO.pay==='nasiya')nasiya();else payCard()}};
function payCard(){var T=totals(),pay=G.pays.filter(function(x){return x.id===CO.pay})[0];
  sheet(pay.n,'<p class="pay-sum">'+sum(T.total)+'</p><label class="fld"><span>'+t('cardNo')+'</span><input id="cn" inputmode="numeric" autocomplete="cc-number" placeholder="8600 0000 0000 0000"></label><label class="fld"><span>'+t('cardExp')+'</span><input id="ce" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/YY"></label>'+
  '<div class="code-w" id="pc-w" hidden><p class="muted sm">'+t('smsSent')+'</p><div class="code" id="code2">'+[0,1,2,3,4,5].map(function(){return '<input inputmode="numeric" maxlength="1" aria-label="'+t('code')+'">'}).join('')+'</div></div><p class="muted sm">'+t('demoPay')+'</p>',{foot:'<button type="button" class="btn btn-l" id="ps-go">'+t('getSms')+'</button>',on:function(s){
    var st=0;$('#ps-go',s).onclick=function(){if(!st){if($('#cn',s).value.replace(/\D/g,'').length<16){toast(t('cardAsk'));$('#cn',s).focus();return}st=1;$('#pc-w',s).hidden=false;this.textContent=t('confirm');$('#code2 input',s).focus();return}
      var v=$$('#code2 input',s).map(function(x){return x.value}).join('');if(v.length<6){toast(t('codeAsk'));return}var b=this;b.disabled=true;b.textContent=t('paying');setTimeout(function(){closeSheet();place()},REDUCED?0:700)};
    var ins=$$('#code2 input',s);ins.forEach(function(inp,i){inp.oninput=function(){inp.value=inp.value.replace(/\D/g,'').slice(0,1);if(inp.value&&ins[i+1])ins[i+1].focus()}})}})}
function nasiya(){var T=totals();
  sheet(t('nasH'),'<div class="nas-ps">'+G.nasiya.map(function(n,i){return '<label class="op"><input type="radio" name="nsp" value="'+n.id+'"'+(i?'':' checked')+'><span class="rd" aria-hidden="true"></span><span><b>'+h(n.n)+'</b><small>'+fmt(monthly(T.total,CO.nas))+' '+t('sum')+' × '+CO.nas+'</small></span></label>'}).join('')+'</div>'+
  '<label class="fld"><span>'+t('pinfl')+'</span><input id="pf" inputmode="numeric" maxlength="14" placeholder="31234567890123"></label><p class="muted sm">'+t('nasDemo')+'</p>',{foot:'<button type="button" class="btn btn-l" id="ns-go">'+t('nasGo')+'</button>',on:function(s){
    $('#ns-go',s).onclick=function(){if($('#pf',s).value.replace(/\D/g,'').length<14){toast(t('pinflAsk'));$('#pf',s).focus();return}var b=this;b.disabled=true;b.textContent=t('checking');
      setTimeout(function(){var p=$('input[name=nsp]:checked',s).value;CO.nasP=p;closeSheet();place()},REDUCED?0:900)}}})}
function place(){var T=totals(),no='BT-'+(24180+S.orders.length*7+Math.floor(Math.random()*6));
  var o={no:no,ts:Date.now(),items:S.cart.map(function(c){return {id:c.id,sz:c.sz,q:c.q,p:P[c.id].price}}),T:T,gift:S.gift.on?{card:S.gift.card}:null,
    recv:CO.recv==='courier'?{type:'courier',day:CO.day,slot:CO.slot,tryon:CO.tryon,addr:S.addr,dist:S.dist}:{type:'pickup'},pay:CO.pay,nas:CO.pay==='nasiya'?{p:CO.nasP||'uzum',m:CO.nas}:null,user:{name:S.name,phone:S.phone},st:0,hist:[{st:0,ts:Date.now()}]};
  S.orders.unshift(o);S.cart=[];S.gift={on:false,card:''};save();badge();go('#/o/'+no)}

/* Заказ по шагам: статус меняет панель (та же память браузера). */
function steps(o){return o.recv.type==='pickup'?[t('st0'),t('st1'),t('st2p'),t('st3p')]:[t('st0'),t('st1'),t('st2'),t('st3')]}
V.order=function(r){var o=S.orders.filter(function(x){return x.no===r.no})[0];if(!o)return V.me({});var st=steps(o),hist={};(o.hist||[]).forEach(function(x){hist[x.st]=x.ts});
  var fresh=Date.now()-o.ts<6e4&&o.st===0;
  return '<div class="ord wrap">'+(fresh?'<div class="thanks rv">'+ic('check','big')+'<h1>'+t('thanks',{n:h((o.user.name||'').split(' ')[0])})+'</h1><p>'+t('thanksP')+'</p></div>':'<div class="pg-h"><p class="crumb"><a href="#/me">'+t('account')+'</a></p><h1>'+t('order')+' '+o.no+'</h1></div>')+
  (o.st===-1?'<p class="cancel">'+t('cancelled')+'</p>':'<ol class="steps" id="steps">'+st.map(function(n,i){return '<li class="'+(o.st>i?'done':o.st===i?'now':'')+'"><i>'+(o.st>i?ic('check'):'')+'</i><span><b>'+n+'</b>'+(hist[i]?'<small>'+new Date(hist[i]).toLocaleString(G.locale,{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})+'</small>':'')+'</span></li>'}).join('')+'</ol>')+
  (o.st>=0&&o.st<3?'<button type="button" class="lnk sm demo-nx" id="nx">'+t('nextDemo')+'</button>':'')+
  '<div class="ord-d"><div><p class="lbl">'+t('order')+' '+o.no+'</p>'+o.items.map(function(i){var p=P[i.id];return '<div class="cs-i">'+pic(p,0,'56px')+'<span><b>'+h(p.n)+'</b><small>'+(i.sz!=='one'?'EU '+i.sz+' · ':'')+i.q+' '+t('pcs')+'</small></span><span>'+sum(i.p*i.q)+'</span></div>'}).join('')+'</div>'+
  '<dl class="ord-k"><dt>'+t('coRecv')+'</dt><dd>'+(o.recv.type==='pickup'?t('rPickup')+', '+h(G.boutique.short):t('rCourier')+', '+dlabel(new Date(o.ts+o.recv.day*864e5),o.recv.day)+' '+o.recv.slot+(o.recv.tryon?', '+t('tryDoor').toLowerCase():''))+'</dd>'+
  '<dt>'+t('coPay')+'</dt><dd>'+h(payName(o.pay))+(o.nas?' · '+o.nas.m+' '+t('mo'):'')+'</dd>'+(o.gift?'<dt>'+t('giftH')+'</dt><dd>'+(o.gift.card?'«'+h(o.gift.card)+'»':t('giftNoCard'))+'</dd>':'')+'<dt>'+t('total')+'</dt><dd><b>'+sum(o.T.total)+'</b></dd></dl></div>'+
  '<div class="ord-a"><a class="btn btn-o" href="'+G.boutique.dm+'" rel="noopener">'+ic('chat')+'<span>'+t('askH')+'</span></a><a class="btn" href="#/c/new">'+t('backShop')+'</a></div></div>'};
function payName(id){var x=G.pays.filter(function(p){return p.id===id})[0];return x?x.n:id==='nasiya'?t('nasH'):id}
V.order_on=function(r){var nx=$('#nx');if(nx)nx.onclick=function(){var o=S.orders.filter(function(x){return x.no===r.no})[0];if(!o||o.st>=3)return;o.st++;o.hist=o.hist||[];o.hist.push({st:o.st,ts:Date.now()});save();render()}};

/* Кабинет: заказы, брони, мои размеры, избранное, уровень и закрытые распродажи. */
V.me=function(){var lv=level(),lvl=G.levels[lv],nx=G.levels[lv+1],sp=spent(),tab=(location.hash.split('?')[1]||'or');
  var prog=nx?Math.min(1,sp/nx.from):1;
  var tabs=[['or',t('myOrders')],['bk',t('myBookings')],['sz',t('mySizes')],['fv',t('fav')]];
  return '<div class="pg-h wrap"><h1>'+t('account')+'</h1>'+(S.name?'<p class="muted">'+h(S.name)+(S.phone?' · '+h(S.phone):'')+'</p>':'')+'</div>'+
  '<div class="me wrap"><section class="lvl"><p class="eyebrow">'+t('level')+'</p><h2>'+h(lvl.n)+'</h2><p>'+h(lvl.p)+'</p>'+(nx?'<div class="bar"><i style="transform:scaleX('+prog.toFixed(3)+')"></i></div><p class="muted sm">'+t('toNext',{n:h(nx.n),s:sum(Math.max(0,nx.from-sp))})+'</p>':'')+
  '<a class="priv-l" href="#/private">'+ic(lv?'key':'lock')+'<span><b>'+t('privH')+'</b><small>'+(lv?t('privOpen'):t('privLocked'))+'</small></span>'+ic('chev')+'</a></section>'+
  '<div class="me-t" role="tablist">'+tabs.map(function(x){return '<a role="tab" href="#/me?'+x[0]+'" aria-selected="'+(tab===x[0])+'">'+x[1]+'</a>'}).join('')+'</div><div class="me-b">'+
  (tab==='or'?(S.orders.length?S.orders.map(function(o){var st=steps(o);return '<a class="mo" href="#/o/'+o.no+'"><span><b>'+o.no+'</b><small>'+new Date(o.ts).toLocaleDateString(G.locale)+' · '+o.items.length+' '+t('pcs')+'</small></span><span class="pill s'+o.st+'">'+(o.st===-1?t('cancelled'):st[o.st])+'</span><b>'+sum(o.T.total)+'</b></a>'}).join(''):'<p class="muted">'+t('noOrders')+'</p>'):'')+
  (tab==='bk'?(S.bookings.length?S.bookings.map(function(b){var p=b.pid?P[b.pid]:null;return '<div class="mo"><span><b>'+(p?h(p.n):t('bookAnyShort'))+'</b><small>'+b.day.split('-').reverse().join('.')+' · '+b.tm+(b.sz?' · EU '+b.sz:'')+'</small></span><span class="pill b-'+b.st+'">'+t('bk_'+b.st)+'</span></div>'}).join(''):'<p class="muted">'+t('noBookings')+'</p>')+'<button type="button" class="btn btn-o" data-book="">'+t('bookVisit')+'</button>':'')+
  (tab==='sz'?'<p class="muted">'+t('sizesP')+'</p>'+[['w',t('szW'),G.sizes.w],['m',t('szM'),G.sizes.m]].map(function(x){return '<p class="lbl">'+x[1]+'</p><div class="szs">'+x[2].map(function(z){return '<button type="button" data-my="'+x[0]+':'+z+'" aria-checked="'+(S.sizes[x[0]]===z)+'" role="radio"><span>'+z+'</span></button>'}).join('')+'</div>'}).join(''):'')+
  (tab==='fv'?(S.fav.length?'<div class="grid">'+S.fav.map(function(id){return P[id]?card(P[id]):''}).join('')+'</div>':'<p class="muted">'+t('noFav')+'</p>'):'')+'</div></div>'};
V.me_on=function(){wireBook(view);$$('[data-my]').forEach(function(b){b.onclick=function(){var x=b.getAttribute('data-my').split(':');S.sizes[x[0]]=S.sizes[x[0]]===x[1]?null:x[1];save();render()}})};
V.fav=function(){location.replace('#/me?fv');return ''};

/* Закрытая распродажа: только для клиентов бутика. */
V.private=function(){var lv=level();
  if(!lv)return '<div class="priv wrap"><div class="priv-lock">'+ic('lock','big')+'<p class="eyebrow">'+t('privK')+'</p><h1>'+t('privH')+'</h1><p>'+t('privWhy')+'</p><button type="button" class="btn btn-l" id="inv">'+t('privInvite')+'</button><p class="muted sm">'+t('privDemo')+'</p></div></div>';
  var items=G.priv.ids.map(function(id){return P[id]}).filter(Boolean);
  return '<div class="priv wrap"><div class="pg-h"><p class="eyebrow">'+t('privK')+'</p><h1>'+t('privH')+'</h1><p>'+t('privP',{n:G.priv.off,d:G.priv.until})+'</p></div><div class="grid">'+items.map(function(p){return card(p,true)}).join('')+'</div><p class="muted sm">'+t('privNote')+'</p></div>'};
V.private_on=function(){var b=$('#inv');if(b)b.onclick=function(){S.invited=true;save();render();toast(t('privWelcome'))}};

/* ── Старт ─────────────────────────────────────────────────────────────── */
badge();render();
/* Шапка (правило владельца, 15.10.2026): при любой прокрутке прячется и
   возвращается только через 3 секунды после полной остановки. Пока фокус с
   клавиатуры внутри шапки, она не прячется. */
var top=$('#top'),IDLE=3000,idleT=0;
function headIdle(){if(!top||EMBED)return;clearTimeout(idleT);if(scrollY<8){top.classList.remove('hide');return}if(!top.contains(d.activeElement))top.classList.add('hide');idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}
function onScroll(){headIdle()}
addEventListener('scroll',onScroll,{passive:true});
})();
