(function(){
'use strict';
/* app: приложение гостя Karomat. Сначала телефон: нижняя панель, шторки
   снизу, «В корзину» под пальцем; на компьютере шапка с разделами и сводка
   сбоку. Меню — их блюда и цены; заказ (доставка, самовывоз, на стол по
   QR), оплата Click / Payme / Uzum, статус; бронь стола на схеме; банкет с
   расчётом; кабинет с баллами. Всё демо живёт в браузере (km-demo-1): то же
   хранилище читают главная и панель, поэтому заказ отсюда виден в панели, а
   статус из панели виден здесь. Модель не вызывается. */
var d=document,W=window,root=d.documentElement,G=JSON.parse(d.getElementById('km-data').textContent),U=G.ui,L=G.lang;
var $=function(s,r){return (r||d).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))};
var REDUCED=false;try{REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
var EMBED=/[?&]embed=1/.test(location.search);if(EMBED)root.classList.add('embed');
function t(k,v){var s=U[k];if(s==null)return k;if(v)for(var x in v)s=s.split('{'+x+'}').join(v[x]);return s}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function sum(n){return fmt(n)+' '+t('sum')}
function ic(k,c){return '<svg class="ic'+(c?' '+c:'')+'" aria-hidden="true"><use href="#i-'+k+'"/></svg>'}
function pad(n){return (n<10?'0':'')+n}
var P={};G.menu.forEach(function(m){P[m.id]=m});
var CAT={};G.cats.forEach(function(c){CAT[c.id]=c});

/* ── Состояние ─────────────────────────────────────────────────────────── */
var KEY='km-demo-1',S;
function load(){try{S=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){S=null}S=S||{};['cart','orders','books','banq','calls'].forEach(function(k){if(!Array.isArray(S[k]))S[k]=[]});if(typeof S.pts!=='number')S.pts=0;if(!S.mode)S.mode='deliv';if(!S.stop)S.stop=[]}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
load();
var TABLE=0;try{TABLE=+sessionStorage.getItem('km-table')||0}catch(e){}
addEventListener('storage',function(e){if(e.key===KEY){load();badge();if(route.name==='order'||route.name==='me'||route.name==='booking')render()}});

/* ── Мелочи ────────────────────────────────────────────────────────────── */
function cartN(){return S.cart.reduce(function(s,c){return s+c.q},0)}
function badge(){var n=cartN();$$('[data-badge="cart"]').forEach(function(b){b.textContent=n;b.hidden=!n})}
var toastT=0;
function toast(msg){var el=$('#toast');el.innerHTML='<span>'+msg+'</span>';el.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){el.classList.remove('on')},2600)}
var sheetLast=null;
function sheet(title,body){sheetLast=d.activeElement;var s=$('#sheet');s.innerHTML='<div class="sh-back" data-close></div><div class="sh" role="dialog" aria-modal="true" aria-label="'+h(title)+'"><div class="sh-h"><b>'+h(title)+'</b><button type="button" class="ib" data-close aria-label="'+t('close')+'">'+ic('x')+'</button></div><div class="sh-b">'+body+'</div></div>';s.hidden=false;void s.offsetWidth;s.classList.add('on');root.classList.add('locked');$$('[data-close]',s).forEach(function(b){b.onclick=closeSheet});var f=$('.sh button,.sh input',s);if(f)f.focus({preventScroll:true});return $('.sh-b',s)}
function closeSheet(){var s=$('#sheet');if(s.hidden)return;s.classList.remove('on');root.classList.remove('locked');setTimeout(function(){s.hidden=true;s.innerHTML=''},REDUCED?0:240);if(sheetLast&&sheetLast.focus)sheetLast.focus({preventScroll:true})}
addEventListener('keydown',function(e){if(e.key==='Escape'){closeSheet();closeSearch()}});
function price(id,v){var p=P[id];return v>=0&&p.v[v]?p.v[v].p:p.p}
function vname(id,v){var p=P[id];return v>=0&&p.v[v]?p.v[v].n:''}
function line(c){return price(c.id,c.v)*c.q}
function inCart(id,v){var c=S.cart.filter(function(x){return x.id===id&&x.v===v})[0];return c?c.q:0}
function setQ(id,v,q){var c=S.cart.filter(function(x){return x.id===id&&x.v===v})[0];if(q<=0)S.cart=S.cart.filter(function(x){return !(x.id===id&&x.v===v)});else if(c)c.q=Math.min(q,30);else S.cart.push({id:id,v:v,q:Math.min(q,30)});save();badge()}
function defV(id){return P[id].v.length?0:-1}
function stopped(id){return S.stop.indexOf(id)>=0}
function add(id,v,from){if(stopped(id)){toast(t('stopped'));return}setQ(id,v,inCart(id,v)+1);fly(from);pulse();toast(t('added',{n:h(P[id].n)}))}
function pulse(){$$('.cart-ic').forEach(function(el){el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump')})}
function fly(from){if(REDUCED||!from)return;var im=$('img',from.closest('[data-card]')||from.closest('.pd')||from);var to=$$('.cart-ic').filter(function(e){return e.offsetParent})[0];if(!im||!to)return;
  var a=im.getBoundingClientRect(),b=to.getBoundingClientRect(),c=im.cloneNode();c.className='flyer';c.style.left=a.left+'px';c.style.top=a.top+'px';c.style.width=a.width+'px';c.style.height=a.height+'px';d.body.appendChild(c);
  requestAnimationFrame(function(){c.style.transform='translate('+(b.left+b.width/2-a.left-a.width/2)+'px,'+(b.top+b.height/2-a.top-a.height/2)+'px) scale(.12)';c.style.opacity='.4'});setTimeout(function(){c.remove()},700)}
function norm(s){return String(s).toLowerCase().replace(/[‘’ʻʼ`']/g,'').replace(/ё/g,'е')}
function openNow(){var n=new Date(),m=n.getHours()*60+n.getMinutes(),o=G.brand.open[0]*60+G.brand.open[1],c=G.brand.close[0]*60+G.brand.close[1];return m>=o&&m<c}
function hhmm(a){return pad(a[0])+':'+pad(a[1])}
function clock(ts){var x=new Date(ts);return pad(x.getDate())+'.'+pad(x.getMonth()+1)+', '+pad(x.getHours())+':'+pad(x.getMinutes())}

/* ── Роутер ────────────────────────────────────────────────────────────── */
var V={},view=$('#view'),route={name:'home'};
function go(hh){if(location.hash===hh)render();else location.hash=hh}
function parse(){var a=location.hash.replace(/^#\/?/,'').split('/');var n=a[0]||'home';
  var map={c:'cat',p:'dish',o:'order',b:'booking',t:'table'};return {name:map[n]||n,arg:a[1]}}
function render(){route=parse();closeSheet();closeSearch();
  if(route.name==='table'){TABLE=+route.arg||7;try{sessionStorage.setItem('km-table',TABLE)}catch(e){}S.mode='table';save();location.replace('#/');return}
  var fn=V[route.name]||V.home;view.classList.remove('in');view.innerHTML=fn(route.arg)||'';
  $$('.tabbar a,.hd-nav a').forEach(function(a){a.classList.toggle('on',a.getAttribute('data-tab')===tabOf(route.name))});
  tblBar();scrollTo(0,0);requestAnimationFrame(function(){view.classList.add('in')});if(V[route.name+'_on'])V[route.name+'_on'](route.arg);badge()}
function tabOf(n){return {home:'home',cat:'home',dish:'home',cart:'cart',checkout:'cart',order:'me',book:'book',booking:'book',banket:'banket',me:'me'}[n]||'home'}
addEventListener('hashchange',render);

/* Стол по QR: полоса под шапкой с официантом и счётом. */
function tblBar(){var b=$('#tbl-bar');if(!b)return;if(!TABLE){b.hidden=true;return}b.hidden=false;
  b.innerHTML='<span>'+ic('qr')+'<b>'+t('tableN',{n:TABLE})+'</b><small>'+t('tableNote')+'</small></span><button type="button" class="tb-b" id="call-w">'+ic('bell')+t('callWaiter')+'</button><button type="button" class="tb-b" id="call-b">'+ic('receipt')+t('askBill')+'</button>';
  $('#call-w').onclick=function(){S.calls.unshift({t:TABLE,type:'waiter',ts:Date.now()});save();toast(t('waiterCalled'))};
  $('#call-b').onclick=billSheet}
function billSheet(){var mine=S.orders.filter(function(o){return o.mode==='table'&&o.table===TABLE&&o.st<4}),food=mine.reduce(function(s,o){return s+o.food},0),svc=Math.round(food*G.brand.service/100);
  var b=sheet(t('bill'),mine.length?'<ul class="bill">'+mine.map(function(o){return o.items.map(function(c){return '<li><span>'+h(P[c.id].n)+(c.v>=0?', '+h(vname(c.id,c.v)).toLowerCase():'')+' × '+c.q+'</span><b>'+sum(price(c.id,c.v)*c.q)+'</b></li>'}).join('')}).join('')+'</ul><dl class="sum"><div><dt>'+t('food')+'</dt><dd>'+sum(food)+'</dd></div><div><dt>'+t('service')+' '+G.brand.service+'%</dt><dd>'+sum(svc)+'</dd></div><div class="tot"><dt>'+t('total')+'</dt><dd>'+sum(food+svc)+'</dd></div></dl><div class="pays">'+['click','payme','uzum'].map(function(p){return '<button type="button" class="pay-b" data-p="'+p+'">'+payLogo(p)+'</button>'}).join('')+'</div><button type="button" class="btn btn-line wide" id="bill-cash">'+ic('cash')+t('payCashWaiter')+'</button>':'<p class="muted">'+t('billEmpty')+'</p>');
  $$('[data-p]',b).concat($$('#bill-cash',b)).forEach(function(x){x.onclick=function(){S.calls.unshift({t:TABLE,type:'bill',ts:Date.now(),sum:food+svc,pay:x.getAttribute('data-p')||'cash'});save();closeSheet();toast(t('billAsked'))}})}

/* ── Карточки ──────────────────────────────────────────────────────────── */
function tagChips(p){return p.tags.filter(function(x){return x!=='hit'}).map(function(x){return '<i class="tg tg-'+x+'">'+t('tag_'+x)+'</i>'}).join('')}
function buyBtn(id){var v=defV(id),q=inCart(id,v);if(stopped(id))return '<span class="stop-l">'+t('stopShort')+'</span>';if(P[id].v.length)return '<a class="btn-add" href="#/p/'+id+'" aria-label="'+t('choose')+'">'+ic('plus')+'</a>';
  return q?'<span class="step"><button type="button" data-minus="'+id+'" aria-label="'+t('less')+'">'+ic('minus')+'</button><b>'+q+'</b><button type="button" data-plus="'+id+'" aria-label="'+t('more')+'">'+ic('plus')+'</button></span>':'<button type="button" class="btn-add" data-add="'+id+'" aria-label="'+t('toCart')+'">'+ic('plus')+'</button>'}
function row(p){return '<article class="dr'+(stopped(p.id)?' off':'')+'" data-card><a class="dr-im" href="#/p/'+p.id+'"><img src="'+G.img+'/d-'+p.id+'.webp" alt="" loading="lazy" decoding="async" width="600" height="491"></a><div class="dr-b"><a class="dr-n" href="#/p/'+p.id+'">'+h(p.n)+'</a><span class="tgs">'+tagChips(p)+'</span><span class="dr-p">'+(p.v.length?t('from')+' ':'')+sum(p.p)+'</span></div><span class="dr-buy" data-buy="'+p.id+'">'+buyBtn(p.id)+'</span></article>'}
function tile(p){return '<a class="tl" href="#/p/'+p.id+'" data-card><span class="tl-im"><img src="'+G.img+'/d-'+p.id+'.webp" alt="" loading="lazy" decoding="async" width="600" height="491"></span><b>'+h(p.n)+'</b><span>'+(p.v.length?t('from')+' ':'')+sum(p.p)+'</span></a>'}
function refreshBuy(id){$$('[data-buy="'+id+'"]').forEach(function(b){b.innerHTML=buyBtn(id)})}
function legal(){return '<footer class="afoot"><p><b>'+h(G.brand.name)+'</b> · '+h(G.brand.addr)+' · '+h(G.brand.hours)+'</p><p><a href="tel:'+G.brand.phoneRaw+'">'+h(G.brand.phone)+'</a> · <a href="'+G.site+'">'+t('aboutSite')+'</a> · <a href="'+G.terms+'">'+t('terms')+'</a></p><p class="muted">'+t('demoNote')+'</p></footer>'}

/* ── Главная ───────────────────────────────────────────────────────────── */
V.home=function(){var on=openNow();
  var modes=[['deliv','truck',t('mDeliv')],['pick','walk',t('mPick')]].concat(TABLE?[['table','qr',t('tableN',{n:TABLE})]]:[]);
  return '<section class="hm"><div class="hm-top"><p class="hm-st'+(on?' on':'')+'"><i></i>'+(on?t('openNow',{c:hhmm(G.brand.close)}):t('closedNow',{o:hhmm(G.brand.open)}))+'</p><h1>'+t('homeH')+'</h1>'+
    '<div class="seg" role="radiogroup" aria-label="'+t('howGet')+'">'+modes.map(function(m){return '<button type="button" role="radio" aria-checked="'+(S.mode===m[0])+'" data-mode="'+m[0]+'">'+ic(m[1])+m[2]+'</button>'}).join('')+'</div></div>'+
    '<button type="button" class="srch" data-search>'+ic('search')+'<span>'+t('searchPh')+'</span></button>'+
    '<div class="cats">'+G.cats.map(function(c){var first=G.menu.filter(function(m){return m.cat===c.id})[0];return '<a class="ct" href="#/c/'+c.id+'"><img src="'+G.img+'/d-'+first.id+'.webp" alt="" loading="lazy" width="600" height="491"><span>'+h(c.n)+'</span></a>'}).join('')+'</div>'+
    '<div class="sec-h"><h2>'+t('hits')+'</h2><a href="#/c/all">'+t('allMenu')+ic('chev')+'</a></div><div class="rail">'+G.hits.map(function(id){return tile(P[id])}).join('')+'</div>'+
    '<div class="promo2"><a class="pr-c" href="#/book">'+ic('table')+'<b>'+t('bookH')+'</b><small>'+t('bookS')+'</small></a><a class="pr-c" href="#/banket">'+ic('users')+'<b>'+t('banqH')+'</b><small>'+t('banqS')+'</small></a></div>'+
    legal()+'</section>'};
V.home_on=function(){$$('[data-mode]').forEach(function(b){b.onclick=function(){S.mode=b.getAttribute('data-mode');save();$$('[data-mode]').forEach(function(x){x.setAttribute('aria-checked',x===b)})}})};

/* ── Меню ──────────────────────────────────────────────────────────────── */
var F={};
V.cat=function(arg){var c=arg&&CAT[arg]?arg:'all';
  var list=G.menu.filter(function(m){if(c!=='all'&&m.cat!==c)return false;for(var f in F)if(F[f]&&m.tags.indexOf(f)<0)return false;return true});
  var body='';if(c==='all'){G.cats.forEach(function(k){var l=list.filter(function(m){return m.cat===k.id});if(l.length)body+='<h2 class="grp" id="g-'+k.id+'">'+h(k.n)+'</h2><div class="dl">'+l.map(row).join('')+'</div>'})}else body='<div class="dl">'+list.map(row).join('')+'</div>';
  if(!list.length)body='<p class="empty">'+t('noMatch')+'</p>';
  return '<section class="mnu"><div class="mnu-h"><a class="ib" href="#/" aria-label="'+t('back')+'">'+ic('back')+'</a><h1>'+(c==='all'?t('menu'):h(CAT[c].n))+'</h1><button type="button" class="ib" data-search aria-label="'+t('search')+'">'+ic('search')+'</button></div>'+
    '<div class="chips" id="cchips"><a href="#/c/all"'+(c==='all'?' class="on"':'')+'>'+t('all')+'</a>'+G.cats.map(function(k){return '<a href="#/c/'+k.id+'"'+(k.id===c?' class="on"':'')+'>'+ic(k.ic)+h(k.n)+'</a>'}).join('')+'</div>'+
    '<div class="chips flt">'+['veg','kids','share','hit'].map(function(f){return '<button type="button" data-f="'+f+'" aria-pressed="'+!!F[f]+'">'+t('tag_'+f)+'</button>'}).join('')+'</div>'+
    '<p class="cnt">'+t('dishesN',{n:list.length})+'</p>'+body+'<p class="fine">'+t('tagNote')+'</p></section>'};
V.cat_on=function(){var on=$('#cchips .on');if(on&&on.scrollIntoView)$('#cchips').scrollLeft=on.offsetLeft-16;$$('[data-f]').forEach(function(b){b.onclick=function(){var f=b.getAttribute('data-f');F[f]=!F[f];render()}})};

/* ── Карточка блюда ────────────────────────────────────────────────────── */
var PV={};
function pairs(p){var o=[];if(p.cat!=='non')o.push(3749);if(p.cat!=='bar')o.push(3833);var sal=p.cat==='salat'?3745:3718;o.push(sal);if(p.cat!=='desert')o.push(3818);return o.filter(function(id){return id!==p.id}).slice(0,4)}
V.dish=function(arg){var p=P[+arg];if(!p)return V.cat('all');var v=PV[p.id]!=null?PV[p.id]:defV(p.id);PV[p.id]=v;
  return '<section class="pd" data-id="'+p.id+'"><div class="pd-g"><div class="pd-im"><img src="'+G.img+'/d-'+p.id+'.webp" alt="'+h(p.n)+'" width="600" height="491"><a class="ib pd-back" href="#/c/'+p.cat+'" aria-label="'+t('back')+'">'+ic('back')+'</a></div>'+
    '<div class="pd-b"><p class="pd-cat"><a href="#/c/'+p.cat+'">'+h(CAT[p.cat].n)+'</a></p><h1>'+h(p.n)+'</h1><p class="pd-alt">'+h(p.alt)+'</p><span class="tgs">'+tagChips(p)+'</span>'+
    (p.d?'<p class="pd-d">'+h(p.d)+'</p>':'')+
    (p.v.length?'<div class="vars" role="radiogroup" aria-label="'+t('portion')+'">'+p.v.map(function(x,i){return '<button type="button" role="radio" aria-checked="'+(i===v)+'" data-v="'+i+'"><b>'+h(x.n)+'</b><span>'+sum(x.p)+'</span></button>'}).join('')+'</div>':'')+
    '<p class="pd-p" id="pd-p">'+sum(price(p.id,v))+'</p>'+(stopped(p.id)?'<p class="stop-l big">'+t('stopLong')+'</p>':'')+
    '<div class="pd-buy" id="pd-buy">'+pdBuy(p,v)+'</div><p class="fine">'+t('photoNote')+'</p></div></div>'+
    '<div class="sec-h"><h2>'+t('pairs')+'</h2></div><div class="rail">'+pairs(p).map(function(id){return tile(P[id])}).join('')+'</div></section>'};
function pdBuy(p,v){var q=inCart(p.id,v);if(stopped(p.id))return '';return q?'<span class="step big"><button type="button" data-pm="-1" aria-label="'+t('less')+'">'+ic('minus')+'</button><b>'+q+'</b><button type="button" data-pm="1" aria-label="'+t('more')+'">'+ic('plus')+'</button></span><a class="btn btn-gold" href="#/cart">'+t('toCartGo')+ic('arrow')+'</a>':'<button type="button" class="btn btn-gold big" data-padd>'+ic('bag')+t('toCartP',{p:sum(price(p.id,v))})+'</button>'}
V.dish_on=function(arg){var p=P[+arg];if(!p)return;function redraw(){var v=PV[p.id];$('#pd-p').textContent=sum(price(p.id,v));$('#pd-buy').innerHTML=pdBuy(p,v);bind()}
  function bind(){var a=$('[data-padd]');if(a)a.onclick=function(){add(p.id,PV[p.id],a);redraw()};$$('[data-pm]').forEach(function(b){b.onclick=function(){setQ(p.id,PV[p.id],inCart(p.id,PV[p.id])+ +b.getAttribute('data-pm'));redraw()}})}
  $$('[data-v]').forEach(function(b){b.onclick=function(){PV[p.id]=+b.getAttribute('data-v');$$('[data-v]').forEach(function(x){x.setAttribute('aria-checked',x===b)});redraw()}});bind()};

/* ── Корзина ───────────────────────────────────────────────────────────── */
function totals(){var food=S.cart.reduce(function(s,c){return s+line(c)},0),deliv=S.mode==='deliv'&&food?(food>=300000?0:15000):0,svc=S.mode==='table'?Math.round(food*G.brand.service/100):0;
  return {food:food,deliv:deliv,svc:svc,total:food+deliv+svc,earn:Math.round(food*.05/100)*100}}
function sumBox(T){return '<dl class="sum"><div><dt>'+t('food')+'</dt><dd>'+sum(T.food)+'</dd></div>'+(S.mode==='deliv'?'<div><dt>'+t('delivery')+'</dt><dd>'+(T.deliv?sum(T.deliv):'<span class="g">'+t('free')+'</span>')+'</dd></div>':'')+(T.svc?'<div><dt>'+t('service')+' '+G.brand.service+'%</dt><dd>'+sum(T.svc)+'</dd></div>':'')+'<div class="tot"><dt>'+t('total')+'</dt><dd>'+sum(T.total)+'</dd></div></dl><p class="earn">'+ic('gift')+t('earn',{n:fmt(T.earn)})+'</p>'}
V.cart=function(){if(!S.cart.length)return '<section class="pg"><div class="empty-b">'+ic('bag')+'<h1>'+t('cartEmpty')+'</h1><p>'+t('cartEmptyS')+'</p><a class="btn btn-gold" href="#/c/all">'+t('toMenu')+'</a></div></section>';
  var T=totals(),have={};S.cart.forEach(function(c){have[c.id]=1});var sug=[3749,3750,3833,3718,3818].filter(function(id){return !have[id]}).slice(0,3);
  return '<section class="pg"><h1 class="pg-h">'+t('cart')+'</h1><div class="pg-g"><div><ul class="cl">'+S.cart.map(function(c,i){var p=P[c.id];return '<li data-card><img src="'+G.img+'/d-'+c.id+'.webp" alt="" width="600" height="491"><span class="cl-t"><a href="#/p/'+c.id+'">'+h(p.n)+'</a>'+(c.v>=0?'<small>'+h(vname(c.id,c.v))+'</small>':'')+'<b>'+sum(line(c))+'</b></span><span class="step"><button type="button" data-ci="'+i+'" data-cd="-1" aria-label="'+t('less')+'">'+ic('minus')+'</button><b>'+c.q+'</b><button type="button" data-ci="'+i+'" data-cd="1" aria-label="'+t('more')+'">'+ic('plus')+'</button></span></li>'}).join('')+'</ul>'+
    (sug.length?'<div class="sec-h"><h2>'+t('addTo')+'</h2></div><div class="sug">'+sug.map(function(id){return '<button type="button" data-sug="'+id+'"><img src="'+G.img+'/d-'+id+'.webp" alt="" loading="lazy"><span>'+h(P[id].n)+'<b>'+sum(P[id].p)+'</b></span>'+ic('plus')+'</button>'}).join('')+'</div>':'')+
    (S.mode==='deliv'&&T.food<300000?'<p class="fine">'+t('freeFrom',{n:fmt(300000-T.food)})+'</p>':'')+'</div>'+
    '<aside class="pg-side">'+sumBox(T)+'<a class="btn btn-gold wide to-co" href="#/checkout">'+t('checkout')+ic('arrow')+'</a></aside></div>'+
    '<div class="cart-bar"><span><small>'+t('total')+'</small><b>'+sum(T.total)+'</b></span><a class="btn btn-gold" href="#/checkout">'+t('checkout')+'</a></div></section>'};
V.cart_on=function(){$$('[data-ci]').forEach(function(b){b.onclick=function(){var c=S.cart[+b.getAttribute('data-ci')];setQ(c.id,c.v,c.q+ +b.getAttribute('data-cd'));render()}});
  $$('[data-sug]').forEach(function(b){b.onclick=function(){var id=+b.getAttribute('data-sug');setQ(id,defV(id),inCart(id,defV(id))+1);render()}})};

/* ── Оформление в один экран ───────────────────────────────────────────── */
var O={pay:'click',when:'asap',street:0,house:'',note:'',phone:'',code:'',ok:false};
function slotsToday(){var n=new Date(),o=[],m=Math.max(n.getHours()*60+n.getMinutes()+60,G.brand.open[0]*60+60),c=G.brand.close[0]*60;m=Math.ceil(m/30)*30;for(;m<=c&&o.length<8;m+=30)o.push(pad(Math.floor(m/60))+':'+pad(m%60));return o}
function payLogo(id){return {click:'<b class="pl-click">click</b>',payme:'<b class="pl-payme">pay<i>me</i></b>',uzum:'<b class="pl-uzum">uzum</b>',cash:ic('cash')}[id]}
V.checkout=function(){if(!S.cart.length){location.replace('#/cart');return ''}var T=totals();
  var modes=[['deliv','truck',t('mDeliv')],['pick','walk',t('mPick')]].concat(TABLE?[['table','qr',t('tableN',{n:TABLE})]]:[]);
  var where=S.mode==='deliv'?'<div class="co-s"><h2>'+ic('pin')+t('addr')+'</h2><div class="chips wrapc">'+G.streets.map(function(s,i){return '<button type="button" data-st="'+i+'" aria-pressed="'+(O.street===i)+'">'+h(s)+'</button>'}).join('')+'</div><div class="two"><label class="fld"><span>'+t('house')+'</span><input id="co-house" value="'+h(O.house||'10')+'" inputmode="numeric"></label><label class="fld"><span>'+t('flat')+'</span><input id="co-flat" placeholder="12"></label></div><label class="fld"><span>'+t('landmark')+'</span><input id="co-note" placeholder="'+t('landmarkPh')+'"></label></div>':
    S.mode==='pick'?'<div class="co-s"><h2>'+ic('pin')+t('pickWhere')+'</h2><p>'+h(G.brand.addr)+'<br><span class="muted">'+h(G.brand.hours)+'</span></p></div>':'<div class="co-s"><h2>'+ic('qr')+t('tableN',{n:TABLE})+'</h2><p class="muted">'+t('toTableS')+'</p></div>';
  var when=S.mode==='table'?'':'<div class="co-s"><h2>'+ic('clock')+t('when')+'</h2><div class="chips wrapc"><button type="button" data-when="asap" aria-pressed="'+(O.when==='asap')+'">'+(S.mode==='deliv'?t('asapD'):t('asapP'))+'</button>'+slotsToday().map(function(s){return '<button type="button" data-when="'+s+'" aria-pressed="'+(O.when===s)+'">'+s+'</button>'}).join('')+'</div></div>';
  var pays=G.pays.filter(function(p){return S.mode!=='table'||p.id!=='cash'});
  return '<section class="pg"><div class="mnu-h"><a class="ib" href="#/cart" aria-label="'+t('back')+'">'+ic('back')+'</a><h1>'+t('checkout')+'</h1><span></span></div><div class="pg-g"><div class="co">'+
    '<div class="co-s"><h2>'+ic('bag')+t('howGet')+'</h2><div class="seg" role="radiogroup">'+modes.map(function(m){return '<button type="button" role="radio" aria-checked="'+(S.mode===m[0])+'" data-cm="'+m[0]+'">'+ic(m[1])+m[2]+'</button>'}).join('')+'</div></div>'+
    '<div class="co-s" id="co-login"><h2>'+ic('phone')+t('phone')+'</h2>'+loginHtml()+'</div>'+where+when+
    '<div class="co-s"><h2>'+ic('card')+t('payH')+'</h2><div class="pays">'+pays.map(function(p){return '<button type="button" class="pay-b" data-pay="'+p.id+'" aria-pressed="'+(O.pay===p.id)+'">'+payLogo(p.id)+'<small>'+h(p.id==='cash'&&S.mode==='pick'?t('cashPick'):p.n)+'</small></button>'}).join('')+'</div></div>'+
    '<p class="err" id="co-err" role="alert"></p></div><aside class="pg-side">'+sumBox(T)+'<button type="button" class="btn btn-gold wide" id="co-go">'+payLabel(T)+'</button></aside></div>'+
    '<div class="cart-bar"><span><small>'+t('total')+'</small><b>'+sum(T.total)+'</b></span><button type="button" class="btn btn-gold" id="co-go2">'+payLabel(T)+'</button></div></section>'};
function payLabel(T){return O.pay==='cash'?t('placeOrder'):t('payN',{n:sum(T.total)})}
function loginHtml(){return O.ok?'<p class="ok-l">'+ic('check')+h(O.phone)+' <button type="button" class="lnk" id="re-login">'+t('change')+'</button></p>':
  '<div class="two"><label class="fld"><span>'+t('phone')+'</span><input id="co-ph" type="tel" inputmode="tel" autocomplete="tel" value="'+h(O.phone||'+998 90 123 45 67')+'"></label><button type="button" class="btn btn-line" id="co-code">'+t('sendCode')+'</button></div>'+(O.code==='sent'?'<label class="fld"><span>'+t('codeL')+'</span><input id="co-cv" inputmode="numeric" maxlength="4" placeholder="1234" autocomplete="one-time-code"></label><p class="fine">'+t('codeHint')+'</p>':'')}
V.checkout_on=function(){
  $$('[data-cm]').forEach(function(b){b.onclick=function(){S.mode=b.getAttribute('data-cm');save();render()}});
  $$('[data-st]').forEach(function(b){b.onclick=function(){O.street=+b.getAttribute('data-st');$$('[data-st]').forEach(function(x){x.setAttribute('aria-pressed',x===b)})}});
  $$('[data-when]').forEach(function(b){b.onclick=function(){O.when=b.getAttribute('data-when');$$('[data-when]').forEach(function(x){x.setAttribute('aria-pressed',x===b)})}});
  $$('[data-pay]').forEach(function(b){b.onclick=function(){O.pay=b.getAttribute('data-pay');$$('[data-pay]').forEach(function(x){x.setAttribute('aria-pressed',x===b)});var T=totals();$('#co-go').textContent=payLabel(T);$('#co-go2').textContent=payLabel(T)}});
  bindLogin();$('#co-go').onclick=submit;$('#co-go2').onclick=submit};
function bindLogin(){var box=$('#co-login');if(!box)return;var c=$('#co-code',box),cv=$('#co-cv',box),re=$('#re-login',box);
  if(c)c.onclick=function(){O.phone=$('#co-ph').value.trim();O.code='sent';box.innerHTML='<h2>'+ic('phone')+t('phone')+'</h2>'+loginHtml();bindLogin();var f=$('#co-cv');if(f)f.focus()};
  if(cv)cv.oninput=function(){if(cv.value.trim()==='1234'){O.ok=true;S.phone=O.phone;save();box.innerHTML='<h2>'+ic('phone')+t('phone')+'</h2>'+loginHtml();bindLogin()}};
  if(re)re.onclick=function(){O.ok=false;O.code='';box.innerHTML='<h2>'+ic('phone')+t('phone')+'</h2>'+loginHtml();bindLogin()}}
function submit(){var err=$('#co-err');if(!O.ok){err.textContent=t('needLogin');$('#co-login').scrollIntoView({behavior:REDUCED?'auto':'smooth',block:'center'});return}
  if(S.mode==='deliv'){var hs=$('#co-house');if(!hs.value.trim()){err.textContent=t('needHouse');hs.focus();return}O.house=hs.value.trim();O.note=($('#co-note').value||'').trim()}
  err.textContent='';if(O.pay==='cash')place();else paySheet()}
function paySheet(){var T=totals(),name=G.pays.filter(function(p){return p.id===O.pay})[0].n;
  var b=sheet(name,'<div class="pay-top">'+payLogo(O.pay)+'<b>'+sum(T.total)+'</b></div><label class="fld"><span>'+t('cardNo')+'</span><input id="pc-n" inputmode="numeric" value="8600 12** **** 4417"></label><div class="two"><label class="fld"><span>'+t('cardExp')+'</span><input value="09/28" inputmode="numeric"></label><label class="fld"><span>'+t('smsCode')+'</span><input id="pc-c" inputmode="numeric" maxlength="4" placeholder="1234"></label></div><p class="fine">'+t('payDemo')+'</p><button type="button" class="btn btn-gold wide" id="pc-go">'+t('payN',{n:sum(T.total)})+'</button><p class="err" id="pc-err" role="alert"></p>');
  $('#pc-go',b).onclick=function(){var c=$('#pc-c',b).value.trim();if(c&&c!=='1234'){$('#pc-err',b).textContent=t('badCode');return}var btn=$('#pc-go',b);btn.disabled=true;btn.innerHTML='<i class="spin"></i>';setTimeout(function(){closeSheet();place(true)},REDUCED?0:900)}}
function place(paid){var T=totals(),no='KR-'+(4120+S.orders.length+1);
  var o={no:no,ts:Date.now(),items:S.cart.map(function(c){return {id:c.id,v:c.v,q:c.q}}),food:T.food,deliv:T.deliv,svc:T.svc,total:T.total,mode:S.mode,table:S.mode==='table'?TABLE:0,pay:O.pay,paid:!!paid,
    addr:S.mode==='deliv'?G.streets[O.street]+', '+O.house:'',note:O.note,when:S.mode==='table'?'':O.when,phone:O.phone,st:0,hist:[{st:0,ts:Date.now()}],earn:T.earn,src:'app'};
  S.orders.unshift(o);S.pts+=T.earn;S.cart=[];save();badge();go('#/o/'+no)}

/* ── Статус заказа ─────────────────────────────────────────────────────── */
function stName(o,i){var k=['st0','st1',o.mode==='deliv'?'st2d':o.mode==='pick'?'st2p':'st2t',o.mode==='deliv'?'st3d':'st3p'][i];return t(k)}
function findO(no){return S.orders.filter(function(o){return o.no===no})[0]}
V.order=function(no){var o=findO(no);if(!o)return V.me();
  return '<section class="pg"><div class="mnu-h"><a class="ib" href="#/me" aria-label="'+t('back')+'">'+ic('back')+'</a><h1>'+t('orderN',{n:h(o.no)})+'</h1><span></span></div>'+
    '<div class="trk" style="--k:'+(o.st/3)+'"><ol>'+[0,1,2,3].map(function(i){return '<li class="'+(i<o.st?'done':i===o.st?'now':'')+'"><i>'+(i<o.st?ic('check'):i+1)+'</i><span>'+stName(o,i)+'</span></li>'}).join('')+'</ol><span class="trk-bar"><i></i></span></div>'+
    (o.st===0?'<p class="ok-l big">'+ic('check')+t('placed')+'</p>':'')+
    '<div class="pg-g"><div><ul class="cl ro">'+o.items.map(function(c){return '<li><img src="'+G.img+'/d-'+c.id+'.webp" alt="" width="600" height="491"><span class="cl-t"><a href="#/p/'+c.id+'">'+h(P[c.id].n)+'</a>'+(c.v>=0?'<small>'+h(vname(c.id,c.v))+'</small>':'')+'<b>'+c.q+' × '+sum(price(c.id,c.v))+'</b></span></li>'}).join('')+'</ul>'+
    '<dl class="meta"><div><dt>'+t('howGet')+'</dt><dd>'+(o.mode==='deliv'?t('mDeliv')+': '+h(o.addr):o.mode==='pick'?t('mPick')+': '+h(G.brand.addr):t('tableN',{n:o.table}))+'</dd></div>'+(o.when?'<div><dt>'+t('when')+'</dt><dd>'+(o.when==='asap'?t('asapShort'):o.when)+'</dd></div>':'')+'<div><dt>'+t('payH')+'</dt><dd>'+h((G.pays.filter(function(p){return p.id===o.pay})[0]||{}).n||'')+(o.paid?' · '+t('paid'):'')+'</dd></div><div><dt>'+t('time')+'</dt><dd>'+clock(o.ts)+'</dd></div></dl></div>'+
    '<aside class="pg-side"><dl class="sum"><div class="tot"><dt>'+t('total')+'</dt><dd>'+sum(o.total)+'</dd></div></dl><p class="earn">'+ic('gift')+t('earned',{n:fmt(o.earn)})+'</p>'+(o.st<3?'<button type="button" class="btn btn-line wide" id="o-next">'+t('nextStep')+'</button>':'')+'<a class="btn btn-gold wide" href="'+G.panel+'#orders">'+t('seePanel')+'</a></aside></div></section>'};
V.order_on=function(no){var b=$('#o-next');if(b)b.onclick=function(){var o=findO(no);o.st=Math.min(3,o.st+1);o.hist.push({st:o.st,ts:Date.now()});save();render()}};

/* ── Бронь стола ───────────────────────────────────────────────────────── */
var BK={day:0,time:'',g:2,t:0,name:'',phone:''};
function dayDate(i){var x=new Date();x.setHours(12,0,0,0);x.setDate(x.getDate()+i);return x}
function iso(x){return x.getFullYear()+'-'+pad(x.getMonth()+1)+'-'+pad(x.getDate())}
function dayLabel(i){return i===0?t('today'):i===1?t('tomorrow'):t('wd'+dayDate(i).getDay())}
function dayLong(i){var x=dayDate(i);return x.getDate()+' '+t('mo'+x.getMonth())}
function toMin(s){var p=s.split(':');return +p[0]*60+ +p[1]}
function slots(){var o=[],a=G.brand.open[0]+1,b=G.brand.close[0]-1;for(var hh=a;hh<=b;hh++){o.push(pad(hh)+':00');if(hh<b)o.push(pad(hh)+':30')}return o}
function past(s){if(BK.day!==0)return false;var n=new Date();return toMin(s)<=n.getHours()*60+n.getMinutes()+30}
function hash(s){var x=0;for(var i=0;i<s.length;i++)x=(x*31+s.charCodeAt(i))|0;return Math.abs(x)}
function busyOf(date,time){var o={},hh=+time.split(':')[0],peak=hh>=18&&hh<=20?.5:hh>=13&&hh<=14?.35:.2;G.hall.forEach(function(tb){if((hash(date+'|'+tb.id+'|'+Math.floor(hh/2))%100)/100<peak)o[tb.id]=1});S.books.forEach(function(b){if(b.st<2&&b.date===date&&Math.abs(toMin(b.time)-toMin(time))<120)o[b.t]=1});return o}
function hallSvg(busy){return '<svg viewBox="0 -4 100 70" class="hall" role="group" aria-label="'+t('hall')+'"><rect class="fl" x="1" y="-3" width="98" height="68" rx="3"/><text class="lb" x="97" y="64" text-anchor="end">'+t('entry')+'</text>'+G.hall.map(function(x){var cx=x.x+x.w/2,cy=x.y+x.h/2,cls='tb'+(busy[x.id]?' busy':'')+(x.s<BK.g?' small':'')+(x.id===BK.t?' sel':'');
  return '<g class="'+cls+'" data-t="'+x.id+'" data-s="'+x.s+'" tabindex="0" role="button" aria-label="'+t('tableN',{n:x.id})+', '+x.s+'">'+(x.r?'<circle class="tt" cx="'+cx+'" cy="'+cy+'" r="'+x.w/2+'"/>':'<rect class="tt" x="'+x.x+'" y="'+x.y+'" width="'+x.w+'" height="'+x.h+'" rx="2"/>')+'<text x="'+cx+'" y="'+(cy+1.6)+'" text-anchor="middle">'+x.id+'</text></g>'}).join('')+'</svg>'}
V.book=function(){var list=slots();if(!BK.time||past(BK.time))BK.time=list.filter(function(s){return !past(s)&&s>='19:00'})[0]||list.filter(function(s){return !past(s)})[0]||list[list.length-1];
  var busy=busyOf(iso(dayDate(BK.day)),BK.time);if(BK.t&&busy[BK.t])BK.t=0;
  var days='';for(var i=0;i<7;i++)days+='<button type="button" data-day="'+i+'" aria-pressed="'+(i===BK.day)+'"><span>'+dayLabel(i)+'</span><small>'+dayLong(i)+'</small></button>';
  var tb=BK.t?G.hall.filter(function(x){return x.id===BK.t})[0]:null;
  return '<section class="pg bkp"><h1 class="pg-h">'+t('bookH')+'</h1><div class="pg-g"><div>'+
    '<div class="co-s"><h2>'+ic('cal')+t('date')+'</h2><div class="chips days">'+days+'</div></div>'+
    '<div class="co-s"><h2>'+ic('clock')+t('time')+'</h2><div class="chips times" id="bk-times">'+list.map(function(s){return '<button type="button" data-tm="'+s+'" aria-pressed="'+(s===BK.time)+'"'+(past(s)?' disabled':'')+'>'+s+'</button>'}).join('')+'</div></div>'+
    '<div class="co-s"><h2>'+ic('users')+t('guests')+'</h2><span class="step big"><button type="button" data-g="-1" aria-label="'+t('less')+'">'+ic('minus')+'</button><b>'+BK.g+'</b><button type="button" data-g="1" aria-label="'+t('more')+'">'+ic('plus')+'</button></span></div>'+
    '<div class="co-s"><h2>'+ic('table')+t('pickTable')+'</h2>'+hallSvg(busy)+'<p class="leg"><span><i class="f"></i>'+t('free2')+'</span><span><i class="b"></i>'+t('busy')+'</span><span><i class="s"></i>'+t('yours')+'</span></p><p class="fine">'+t('hallNote')+'</p></div></div>'+
    '<aside class="pg-side"><div class="bk-card">'+(tb?'<b class="bk-t">'+t('tableN',{n:tb.id})+'</b><small>'+tb.s+' '+t('seats')+'</small>':'<p class="muted">'+t('pickHint')+'</p>')+
    '<p>'+ic('cal')+dayLabel(BK.day)+', '+dayLong(BK.day)+'</p><p>'+ic('clock')+BK.time+'</p><p>'+ic('users')+BK.g+' '+t('guestsS')+'</p>'+
    '<label class="fld"><span>'+t('name')+'</span><input id="bk-n" autocomplete="name" value="'+h(BK.name||'Aziz')+'"></label><label class="fld"><span>'+t('phone')+'</span><input id="bk-ph" type="tel" inputmode="tel" value="'+h(BK.phone||S.phone||'+998 90 123 45 67')+'"></label>'+
    '<button type="button" class="btn btn-gold wide" id="bk-go"'+(tb?'':' disabled')+'>'+t('confirmBook')+'</button><p class="err" id="bk-err" role="alert"></p></div></aside></div></section>'};
V.book_on=function(){
  $$('[data-day]').forEach(function(b){b.onclick=function(){BK.day=+b.getAttribute('data-day');BK.time='';keep();render()}});
  $$('[data-tm]').forEach(function(b){b.onclick=function(){BK.time=b.getAttribute('data-tm');keep();render()}});
  $$('[data-g]').forEach(function(b){b.onclick=function(){BK.g=Math.max(1,Math.min(12,BK.g+ +b.getAttribute('data-g')));if(BK.t&&G.hall.filter(function(x){return x.id===BK.t})[0].s<BK.g)BK.t=0;keep();render()}});
  $$('.hall .tb').forEach(function(g){function pk(){var err=$('#bk-err');if(g.classList.contains('busy')){err.textContent=t('busyAt',{h:BK.time});return}if(+g.getAttribute('data-s')<BK.g){err.textContent=t('tooSmall',{s:g.getAttribute('data-s'),g:BK.g});return}BK.t=+g.getAttribute('data-t');keep();render()}
    g.onclick=pk;g.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();pk()}}});
  var tm=$('#bk-times [aria-pressed="true"]');if(tm)$('#bk-times').scrollLeft=tm.offsetLeft-60;
  $('#bk-go').onclick=function(){keep();var no='B-'+(1040+S.books.length+1);S.books.unshift({no:no,ts:Date.now(),date:iso(dayDate(BK.day)),time:BK.time,g:BK.g,t:BK.t,name:BK.name||'Aziz',phone:BK.phone,src:'app',st:0});save();BK.t=0;go('#/b/'+no)}};
function keep(){var n=$('#bk-n'),p=$('#bk-ph');if(n)BK.name=n.value.trim();if(p)BK.phone=p.value.trim()}
function findB(no){return S.books.filter(function(b){return b.no===no})[0]}
function bDate(s){var p=s.split('-');return +p[2]+' '+t('mo'+(+p[1]-1))}
V.booking=function(no){var b=findB(no);if(!b)return V.book();var cancel=b.st===2;
  return '<section class="pg"><div class="bk-done'+(cancel?' x':'')+'">'+ic(cancel?'x':'check')+'<h1>'+(cancel?t('bookCancelled'):t('bookOk'))+'</h1><p class="muted">'+t('bookNo',{n:h(b.no)})+'</p>'+
    '<div class="bk-tk"><div><small>'+t('table')+'</small><b>'+b.t+'</b></div><div><small>'+t('date')+'</small><b>'+bDate(b.date)+'</b></div><div><small>'+t('time')+'</small><b>'+b.time+'</b></div><div><small>'+t('guests')+'</small><b>'+b.g+'</b></div></div>'+
    (cancel?'':'<p>'+t('bookSms')+'</p><div class="row-b"><a class="btn btn-gold" href="#/c/all">'+t('preorder')+'</a><button type="button" class="btn btn-line" id="bk-x">'+t('cancelBook')+'</button></div>')+
    '<p><a class="lnk" href="'+G.panel+'#books">'+t('seePanel')+'</a></p></div></section>'};
V.booking_on=function(no){var x=$('#bk-x');if(x)x.onclick=function(){var b=findB(no);b.st=2;save();render()}};

/* ── Банкет ────────────────────────────────────────────────────────────── */
var BQ={kind:G.banq.kinds[0].id,g:30,items:G.banq.items.map(function(x){return {id:x.id,q:x.q,v:x.v==null?-1:x.v}})};
function bqCalc(){var per=BQ.items.reduce(function(s,it){return s+price(it.id,it.v)*it.q},0),tables=Math.ceil(BQ.g/G.banq.per),food=per*tables,svc=Math.round(food*G.brand.service/100);return {per:per,tables:tables,food:food,svc:svc,tot:food+svc}}
V.banket=function(){var c=bqCalc();
  return '<section class="pg"><h1 class="pg-h">'+t('banqH')+'</h1><div class="pg-g"><div>'+
    '<div class="co-s"><h2>'+ic('spark')+t('occasion')+'</h2><div class="chips wrapc">'+G.banq.kinds.map(function(k){return '<button type="button" data-k="'+k.id+'" aria-pressed="'+(k.id===BQ.kind)+'">'+h(k.n)+'</button>'}).join('')+'</div></div>'+
    '<div class="co-s"><h2>'+ic('users')+t('guests')+': <b id="bq-v">'+BQ.g+'</b></h2><input type="range" id="bq-r" min="10" max="300" step="10" value="'+BQ.g+'" aria-label="'+t('guests')+'"></div>'+
    '<div class="co-s"><h2>'+ic('table')+t('tableFor10')+'</h2><ul class="cl">'+BQ.items.map(function(it,i){return '<li><img src="'+G.img+'/d-'+it.id+'.webp" alt="" loading="lazy" width="600" height="491"><span class="cl-t"><a href="#/p/'+it.id+'">'+h(P[it.id].n)+'</a>'+(it.v>=0?'<small>'+h(vname(it.id,it.v))+'</small>':'')+'<b>'+sum(price(it.id,it.v))+'</b></span><span class="step"><button type="button" data-bi="'+i+'" data-bd="-1" aria-label="'+t('less')+'">'+ic('minus')+'</button><b>'+it.q+'</b><button type="button" data-bi="'+i+'" data-bd="1" aria-label="'+t('more')+'">'+ic('plus')+'</button></span></li>'}).join('')+'</ul></div><p class="fine">'+t('banqNote')+'</p></div>'+
    '<aside class="pg-side"><div class="bq-sum"><small>'+BQ.g+' '+t('guestsS')+' · '+c.tables+' '+t('tablesS')+'</small><b>'+sum(c.tot)+'</b><small>≈ '+sum(Math.round(c.tot/BQ.g/1000)*1000)+' '+t('perGuest')+'</small></div><dl class="sum"><div><dt>'+t('food')+'</dt><dd>'+sum(c.food)+'</dd></div><div><dt>'+t('service')+' '+G.brand.service+'%</dt><dd>'+sum(c.svc)+'</dd></div></dl>'+
    '<label class="fld"><span>'+t('name')+'</span><input id="bq-n" value="Nodira"></label><label class="fld"><span>'+t('phone')+'</span><input id="bq-ph" type="tel" inputmode="tel" value="'+h(S.phone||'+998 93 555 12 34')+'"></label><button type="button" class="btn btn-gold wide" id="bq-go">'+t('sendReq')+'</button></aside></div></section>'};
V.banket_on=function(){$$('[data-k]').forEach(function(b){b.onclick=function(){BQ.kind=b.getAttribute('data-k');render()}});
  var r=$('#bq-r');r.onchange=function(){BQ.g=+r.value;render()};r.oninput=function(){$('#bq-v').textContent=r.value};
  $$('[data-bi]').forEach(function(b){b.onclick=function(){var it=BQ.items[+b.getAttribute('data-bi')];it.q=Math.max(0,it.q+ +b.getAttribute('data-bd'));if(!it.q)BQ.items.splice(BQ.items.indexOf(it),1);render()}});
  $('#bq-go').onclick=function(){var c=bqCalc(),no='K-'+(210+S.banq.length+1),dt=dayDate(14);S.banq.unshift({no:no,ts:Date.now(),kind:BQ.kind,g:BQ.g,items:BQ.items.map(function(x){return {id:x.id,q:x.q,v:x.v}}),food:c.food,svc:c.svc,tot:c.tot,name:$('#bq-n').value.trim()||'Nodira',phone:$('#bq-ph').value.trim(),date:iso(dt),src:'app',st:0});save();toast(t('reqSent',{n:no}));go('#/me')}};

/* ── Кабинет ───────────────────────────────────────────────────────────── */
V.me=function(){var lv=S.pts>=60000?t('lv3'):S.pts>=20000?t('lv2'):t('lv1');
  var bk=S.books,bq=S.banq,ord=S.orders.filter(function(o){return o.src==='app'});
  return '<section class="pg"><h1 class="pg-h">'+t('me')+'</h1><div class="me-card"><span class="av">'+ic('user')+'</span><span><b>'+h(S.phone||t('guest'))+'</b><small>'+t('level')+': '+lv+'</small></span><span class="pts"><b>'+fmt(S.pts)+'</b><small>'+t('points')+'</small></span></div><p class="fine">'+t('ptsNote')+'</p>'+
    '<div class="sec-h"><h2>'+t('myOrders')+'</h2></div>'+(ord.length?'<ul class="ol">'+ord.map(function(o){return '<li><a href="#/o/'+o.no+'"><span><b>'+h(o.no)+'</b><small>'+clock(o.ts)+' · '+o.items.length+' '+t('pos')+'</small></span><span class="st st'+o.st+'">'+stName(o,o.st)+'</span><b>'+sum(o.total)+'</b></a></li>'}).join('')+'</ul>':'<p class="muted">'+t('noOrders')+' <a href="#/c/all">'+t('toMenu')+'</a></p>')+
    '<div class="sec-h"><h2>'+t('myBooks')+'</h2></div>'+(bk.length?'<ul class="ol">'+bk.map(function(b){return '<li><a href="#/b/'+b.no+'"><span><b>'+t('tableN',{n:b.t})+'</b><small>'+bDate(b.date)+', '+b.time+' · '+b.g+' '+t('guestsS')+'</small></span><span class="st'+(b.st===2?' st9':' st1')+'">'+(b.st===2?t('cancelled'):b.st===1?t('arrived'):t('confirmed'))+'</span></a></li>'}).join('')+'</ul>':'<p class="muted"><a href="#/book">'+t('bookH')+'</a></p>')+
    '<div class="sec-h"><h2>'+t('myBanq')+'</h2></div>'+(bq.length?'<ul class="ol">'+bq.map(function(b){return '<li><span class="li-w"><span><b>'+h(b.no)+'</b><small>'+b.g+' '+t('guestsS')+'</small></span><span class="st st1">'+t('bq_st'+b.st)+'</span><b>'+sum(b.tot)+'</b></span></li>'}).join('')+'</ul>':'<p class="muted"><a href="#/banket">'+t('banqS')+'</a></p>')+
    legal()+'</section>'};

/* ── Поиск ─────────────────────────────────────────────────────────────── */
var srch=null;
function openSearch(){srch=$('#search');srch.hidden=false;void srch.offsetWidth;srch.classList.add('on');root.classList.add('locked');var i=$('#sq');i.value='';sugg('');i.focus()}
function closeSearch(){if(!srch||srch.hidden)return;srch.classList.remove('on');root.classList.remove('locked');var s=srch;setTimeout(function(){s.hidden=true},REDUCED?0:200)}
function sugg(q){var box=$('#sq-res'),w=norm(q.trim());
  if(!w){box.innerHTML='<p class="muted">'+t('popular')+'</p><div class="chips wrapc">'+t('popularList').split('|').map(function(x){return '<button type="button" data-q="'+h(x)+'">'+h(x)+'</button>'}).join('')+'</div>';$$('[data-q]',box).forEach(function(b){b.onclick=function(){$('#sq').value=b.getAttribute('data-q');sugg(b.getAttribute('data-q'))}});return}
  var r=G.menu.filter(function(m){return norm(m.n+' '+m.alt).indexOf(w)>=0});
  box.innerHTML=r.length?'<div class="dl">'+r.slice(0,20).map(row).join('')+'</div>':'<p class="empty">'+t('noMatch')+'</p>'}
$('#sq').addEventListener('input',function(e){sugg(e.target.value)});
$('#sq-form').addEventListener('submit',function(e){e.preventDefault()});
$('#sq-x').onclick=closeSearch;

/* ── Нажатия по всей странице ──────────────────────────────────────────── */
d.addEventListener('click',function(e){var b=e.target.closest('button,a');if(!b)return;var id;
  if(b.hasAttribute('data-search')){openSearch();return}
  if((id=b.getAttribute('data-add'))){add(+id,-1,b);refreshBuy(+id);return}
  if((id=b.getAttribute('data-plus'))){setQ(+id,-1,inCart(+id,-1)+1);refreshBuy(+id);return}
  if((id=b.getAttribute('data-minus'))){setQ(+id,-1,inCart(+id,-1)-1);refreshBuy(+id);return}
  if(b.tagName==='A'&&srch&&!srch.hidden&&b.getAttribute('href').charAt(0)==='#')closeSearch()});

/* ── Шапка (правило владельца, 15.10.2026): при любой прокрутке прячется и
   возвращается только через 3 секунды после полной остановки. Пока фокус с
   клавиатуры внутри шапки, она не прячется. */
var top=$('#top'),IDLE=3000,idleT=0;
function headIdle(){if(!top)return;clearTimeout(idleT);
  if(!top.contains(d.activeElement))top.classList.add('hide');
  idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}
addEventListener('scroll',headIdle,{passive:true});

badge();render();
})();
