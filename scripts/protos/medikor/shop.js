(function(){
'use strict';
/* shop: магазин Medikor. Сначала телефон, потом ПК. Экраны по адресу после
   #: главная, каталог, товар, корзина (частное лицо или организация),
   оформление с расчётом доставки, оплата картой, по QR через СБП или по
   счёту, счёт по ИНН, запрос КП, заказ со статусом и документами, кабинет.
   Состояние демо — в браузере (mk-demo-1): заказ и КП отсюда видит панель
   менеджеров. Прокрутку не перехватывает; анимации только transform и
   opacity. */
var d=document,root=d.documentElement,W=window,G=JSON.parse(d.getElementById('mk-data').textContent);
var IMG=G.img,P={},C={},KEY='mk-demo-1',EMBED=/[?&]embed=1/.test(location.search);
G.products.forEach(function(p){P[p.id]=p});G.cats.forEach(function(c){C[c.id]=c});
var REDUCED=false;try{REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
if(EMBED)root.classList.add('embed');
var $=function(s,r){return (r||d).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))};
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function rub(n){return fmt(n)+' ₽'}
function ic(k,c){return '<svg class="ic'+(c?' '+c:'')+'" aria-hidden="true"><use href="#i-'+k+'"/></svg>'}
function plural(n,f){var a=n%10,b=n%100;return a===1&&b!==11?f[0]:a>=2&&a<=4&&(b<12||b>14)?f[1]:f[2]}
function off(p){return p.old&&p.price&&p.old>p.price?Math.round((1-p.price/p.old)*100):0}
function avTxt(p){return p.av==='many'?'В наличии':p.av>0?'В наличии '+p.av+' шт.':'Под заказ'}
function avCls(p){return p.av==='many'||p.av>0?'in':'ord'}
function today(k){var x=new Date(Date.now()+(k||0)*864e5);return ('0'+x.getDate()).slice(-2)+'.'+('0'+(x.getMonth()+1)).slice(-2)+'.'+x.getFullYear()}

/* ── Состояние ─────────────────────────────────────────────────────────── */
var S;
function load(){try{S=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){S=null}
  if(!S||typeof S!=='object')S={};
  S.cart=S.cart||[];S.fav=S.fav||[];S.orders=S.orders||[];S.kps=S.kps||[];S.recent=S.recent||[];S.kpDraft=S.kpDraft||[];S.who=S.who||'person';S.city=S.city||'Москва';S.ship=S.ship||'cdek';S.me=S.me||{}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
load();
addEventListener('storage',function(e){if(e.key===KEY){load();badge();if(/^(order|kpview|kps|orders|me)$/.test(route.name))render()}});

function cartN(){return S.cart.reduce(function(s,c){return s+c.q},0)}
function badge(){var n=cartN();$$('[data-badge="cart"]').forEach(function(b){b.textContent=n;b.hidden=!n});var k=S.kpDraft.length;$$('[data-badge="kp"]').forEach(function(b){b.textContent=k;b.hidden=!k})}

/* ── Тост, шторка ─────────────────────────────────────────────────────── */
var toastT=0;
function toast(msg,act,fn){var el=$('#toast');el.innerHTML='<span>'+msg+'</span>'+(act?'<button type="button">'+act+'</button>':'');el.classList.add('on');
  if(act)$('button',el).onclick=function(){el.classList.remove('on');fn()};clearTimeout(toastT);toastT=setTimeout(function(){el.classList.remove('on')},act?5000:2600)}
var sheetLast=null;
function sheet(title,body,opts){opts=opts||{};sheetLast=d.activeElement;var s=$('#sheet');
  s.innerHTML='<div class="sh-back" data-close></div><div class="sh-box'+(opts.tall?' tall':'')+'" role="dialog" aria-modal="true" aria-label="'+h(title)+'"><div class="sh-grab" aria-hidden="true"></div><div class="sh-head"><b>'+title+'</b><button type="button" class="ib" data-close aria-label="Закрыть">'+ic('x')+'</button></div><div class="sh-body">'+body+'</div>'+(opts.foot?'<div class="sh-foot">'+opts.foot+'</div>':'')+'</div>';
  s.hidden=false;void s.offsetWidth;s.classList.add('on');root.classList.add('locked');
  $$('[data-close]',s).forEach(function(b){b.onclick=closeSheet});
  var box=$('.sh-box',s),y0=null,dy=0;
  box.addEventListener('touchstart',function(e){if($('.sh-body',s).scrollTop>0)return;y0=e.touches[0].clientY},{passive:true});
  box.addEventListener('touchmove',function(e){if(y0==null)return;dy=Math.max(0,e.touches[0].clientY-y0);box.style.transform='translateY('+dy+'px)'},{passive:true});
  box.addEventListener('touchend',function(){if(y0==null)return;box.style.transform='';if(dy>90)closeSheet();y0=null;dy=0});
  setTimeout(function(){var f=$('.sh-body input,.sh-body button,.sh-head button',s);if(f)f.focus({preventScroll:true})},60);
  if(opts.on)opts.on(s);return s}
function closeSheet(){var s=$('#sheet');if(!s||s.hidden)return;s.classList.remove('on');root.classList.remove('locked');setTimeout(function(){s.hidden=true;s.innerHTML=''},REDUCED?0:260);if(sheetLast&&sheetLast.focus)sheetLast.focus({preventScroll:true})}
addEventListener('keydown',function(e){if(e.key==='Escape'){closeSheet();closeSearch()}});

/* ── Корзина и КП ─────────────────────────────────────────────────────── */
function inCart(id){var c=S.cart.filter(function(x){return x.id===id})[0];return c?c.q:0}
function setQ(id,q){var c=S.cart.filter(function(x){return x.id===id})[0];if(q<=0)S.cart=S.cart.filter(function(x){return x.id!==id});else if(c)c.q=Math.min(q,99);else S.cart.push({id:id,q:Math.min(q,99)});save();badge()}
function addCart(id,from){if(!P[id].price){addKp(id);return}setQ(id,inCart(id)+1);fly(from);pulse('.cart-ic');refreshBuy(id)}
function inKp(id){return S.kpDraft.some(function(x){return x.id===id})}
function addKp(id,q){if(!inKp(id))S.kpDraft.push({id:id,q:q||1});save();badge();pulse('.kp-ic');refreshBuy(id);toast('Добавлено в запрос КП','Открыть',function(){go('#/kp')})}
function pulse(sel){$$(sel).forEach(function(el){el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump')})}
/* Фото летит в корзину: только transform и opacity. */
function fly(from){if(REDUCED||!from)return;var src=from.closest('[data-card]')||from.closest('.pd')||from;var im=$('img',src);var to=$$('.cart-ic').filter(function(e){return e.offsetParent})[0];if(!im||!to)return;
  var a=im.getBoundingClientRect(),b=to.getBoundingClientRect(),c=im.cloneNode();c.className='flyer';c.style.left=a.left+'px';c.style.top=a.top+'px';c.style.width=a.width+'px';c.style.height=a.height+'px';d.body.appendChild(c);
  var dx=b.left+b.width/2-(a.left+a.width/2),dy=b.top+b.height/2-(a.top+a.height/2);
  var an=c.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:'translate('+dx*.5+'px,'+(dy*.5-60)+'px) scale(.5)',opacity:.9},{transform:'translate('+dx+'px,'+dy+'px) scale(.1)',opacity:.2}],{duration:620,easing:'cubic-bezier(.5,0,.3,1)'});an.onfinish=function(){c.remove()}}
function toggleFav(id){var i=S.fav.indexOf(id);if(i<0){S.fav.push(id);toast('В избранном')}else S.fav.splice(i,1);save();$$('[data-fav="'+id+'"]').forEach(function(b){var on=S.fav.indexOf(id)>=0;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)})}

/* ── Карточка товара в списке ─────────────────────────────────────────── */
function priceHtml(p,big){var o=off(p);if(!p.price)return '<p class="pc-price ask"><b>Цена по запросу</b></p>';return '<p class="pc-price'+(big?' big':'')+'"><b>'+rub(p.price)+'</b>'+(o?'<s>'+fmt(p.old)+'</s>':'')+'</p>'}
function card(p,cls){var o=off(p),fav=S.fav.indexOf(p.id)>=0;
  return '<article class="pc '+(cls||'')+'" data-card="'+p.id+'"><a class="pc-a" href="#/p/'+p.id+'" aria-label="'+h(p.n)+'"></a>'+
  '<div class="pc-im"><img src="'+IMG+'/p-'+p.id+'-s.webp" alt="'+h(p.n)+'" loading="lazy" width="400" height="400">'+(o?'<span class="tag-off">−'+o+'%</span>':'')+(p.ru?'<span class="tag-ru">РУ</span>':'')+
  '<button type="button" class="fav'+(fav?' on':'')+'" data-fav="'+p.id+'" aria-pressed="'+fav+'" aria-label="В избранное">'+ic('heart')+'</button></div>'+
  '<div class="pc-b">'+priceHtml(p)+'<h3 class="pc-n">'+h(p.n)+'</h3><p class="pc-av '+avCls(p)+'">'+avTxt(p)+'</p></div>'+
  '<div class="pc-buy" data-buy="'+p.id+'">'+buyBtn(p)+'</div></article>'}
function buyBtn(p){var q=inCart(p.id);if(!p.price)return inKp(p.id)?'<a class="btn btn-soft" href="#/kp">'+ic('check')+'<span>В запросе КП</span></a>':'<button type="button" class="btn btn-line2" data-kp="'+p.id+'">'+ic('doc')+'<span>Запросить КП</span></button>';
  return q?'<div class="step"><button type="button" data-minus="'+p.id+'" aria-label="Меньше">'+ic('minus')+'</button><b>'+q+'</b><button type="button" data-plus="'+p.id+'" aria-label="Больше">'+ic('plus')+'</button></div>':'<button type="button" class="btn btn-add" data-add="'+p.id+'">'+ic('cart')+'<span>В корзину</span></button>'}
function refreshBuy(id){$$('[data-buy="'+id+'"]').forEach(function(b){b.innerHTML=buyBtn(P[id])});var pb=$('#pd-buy');if(pb&&pb.getAttribute('data-id')===id)pb.innerHTML=pdBuy(P[id]);var bar=$('#pd-bar');if(bar&&bar.getAttribute('data-id')===id)bar.innerHTML=pdBar(P[id]);if(route.name==='cart')render()}

/* ── Экраны ───────────────────────────────────────────────────────────── */
var V={},view=$('#view'),route={name:'home'};
function go(hh){if(location.hash===hh)render();else location.hash=hh}
function parse(){var hs=location.hash.replace(/^#\/?/,''),q='',i=hs.indexOf('?');if(i>=0){q=hs.slice(i+1);hs=hs.slice(0,i)}var a=hs.split('/');
  var params={};q.split('&').forEach(function(kv){if(!kv)return;var p=kv.split('=');params[decodeURIComponent(p[0])]=decodeURIComponent(p[1]||'')});
  var map={'':'home',c:'catalog',p:'product',cart:'cart',checkout:'checkout',invoice:'invoice',order:'order',orders:'orders',me:'me',fav:'fav',kp:'kp',kps:'kps',k:'kpview',search:'catalog',docs:'docs'};
  return {name:map[a[0]]||'home',arg:a[1]||'',q:params}}
function render(){route=parse();closeSheet();closeSearch();var fn=V[route.name]||V.home;view.classList.remove('in');view.innerHTML=fn(route.arg,route.q)||'';
  $$('.tabbar a,.hd-nav a').forEach(function(a){a.classList.toggle('on',a.getAttribute('data-tab')===tabOf(route.name))});
  scrollTo(0,0);requestAnimationFrame(function(){view.classList.add('in')});if(V[route.name+'_on'])V[route.name+'_on'](route.arg,route.q);badge();
  d.title=(V.title?V.title+' · ':'')+'Medikor';V.title='';showTop()}
function tabOf(n){return {home:'home',catalog:'catalog',product:'catalog',cart:'cart',checkout:'cart',invoice:'me',kp:'kp',kps:'kp',kpview:'kp',fav:'me',me:'me',orders:'me',order:'me',docs:'me'}[n]||'home'}
addEventListener('hashchange',render);
function sec(title,more,body,cls){return '<section class="sec '+(cls||'')+'"><div class="sec-h"><h2>'+title+'</h2>'+(more||'')+'</div>'+body+'</section>'}
function legal(){return '<footer class="sfoot"><div class="sf-brand"><svg class="logo-w" viewBox="'+G.logoBox+'" aria-label="Medikor"><use href="#mk-logo"/></svg><p>'+h(G.brand.about)+'</p></div>'+
  '<ul class="sf-c"><li><a href="tel:'+G.brand.tel+'">'+ic('phone')+'<span>'+G.brand.phone+'</span></a></li><li><a href="mailto:'+G.brand.email+'">'+ic('mail')+'<span>'+G.brand.email+'</span></a></li><li>'+ic('pin')+'<span>'+h(G.brand.addr)+', '+h(G.brand.addrNote)+'</span></li><li>'+ic('clock')+'<span>'+h(G.brand.hours)+'</span></li></ul>'+
  '<p class="sf-l">'+h(G.brand.maker)+'</p><p class="sf-l demo">Макет DevUz Studio: заказы, организации и счета демо, деньги не списываются. <a href="'+G.terms+'">Условия использования</a></p></footer>'}

V.home=function(){V.title='Медицинское оборудование из Кореи';
  var hr=P.hr501,sale=G.products.filter(function(p){return off(p)>=10}).sort(function(a,b){return off(b)-off(a)}),low=G.elsewhere.reduce(function(m,x){return Math.min(m,x[1])},1e9);
  return '<div class="home">'+
  '<button type="button" class="srch" data-search>'+ic('search')+'<span>Дефибриллятор, манекен СЛР, тейпы</span></button>'+
  '<a class="hero" href="#/p/hr501"><div class="hero-t"><p class="kick">'+ic('heart')+'Дефибриллятор с голосом на русском</p><h1>Heart Guardian HR-501</h1><p class="hp"><b>'+rub(hr.price)+'</b><s>'+rub(hr.old)+'</s></p><p class="hs">У других продавцов этот же аппарат от '+rub(low)+'</p><span class="btn btn-w">Смотреть'+ic('arrow')+'</span></div><img src="'+IMG+'/p-hr501.webp" alt="Дефибриллятор Heart Guardian HR-501" width="800" height="800"></a>'+
  '<nav class="who" aria-label="Кому">'+G.who.map(function(w){return '<a href="#/c/all?who='+w.id+'"><b>'+h(w.n)+'</b><small>'+h(w.s)+'</small>'+ic('chev')+'</a>'}).join('')+'</nav>'+
  sec('Каталог','<a class="more" href="#/c/all">Все товары'+ic('arrow')+'</a>','<div class="cats">'+G.cats.map(function(c){return '<a href="#/c/'+c.id+'" class="cat-t">'+ic(c.i)+'<span>'+h(c.n)+'</span><small>'+c.total+'</small></a>'}).join('')+'</div>')+
  '<section class="b2b"><div><p class="kick">'+ic('doc')+'Для клиник, школ и колледжей</p><h2>Счёт на организацию за минуту</h2><p>Введите ИНН: реквизиты подставятся сами, счёт придёт сразу. Нужна цена для закупки, запросите КП на несколько позиций.</p></div><div class="b2b-a"><a class="btn btn-w" href="#/cart">'+ic('cart')+'Счёт из корзины</a><a class="btn btn-line" href="#/kp">'+ic('doc')+'Запросить КП</a></div></section>'+
  sec('Со скидкой','<a class="more" href="#/c/all?sale=1">Все'+ic('arrow')+'</a>','<div class="rail">'+sale.slice(0,8).map(function(p){return card(p,'rl')}).join('')+'</div>')+
  '<section class="trust">'+[['truck','Доставка по России','СДЭК, ПЭК, Деловые линии: цена и срок в корзине'],['doc','Документы в карточке','регистрационное удостоверение, инструкция'],['card','Картой, по QR или по счёту','частным лицам и организациям'],['pin','Самовывоз в Москве',G.brand.addr+', '+G.brand.hours]].map(function(x){return '<div class="tr">'+ic(x[0])+'<b>'+x[1]+'</b><small>'+h(x[2])+'</small></div>'}).join('')+'</section>'+
  sec('Тренажёры СЛР','<a class="more" href="#/c/slr">Все'+ic('arrow')+'</a>','<div class="grid">'+G.products.filter(function(p){return p.cat==='slr'}).map(function(p){return card(p)}).join('')+'</div>')+
  sec('Для клиники','<a class="more" href="#/c/all?who=clinic">Все'+ic('arrow')+'</a>','<div class="grid">'+['dcs103','qv500','med03','vt5','lb05','st511d','l2012','dcs102'].map(function(id){return card(P[id])}).join('')+'</div>')+
  legal()+'</div>'};

/* Каталог: раздел, фильтры в шторке, сортировка. */
var F={cat:[],min:'',max:'',sale:false,stock:false,priced:'',maker:[],sort:'pop',q:'',who:''};
var SYN=G.syn;
function syn(q){q=q.toLowerCase();for(var k in SYN)if(q.indexOf(k)>=0)return SYN[k];return null}
function match(p,q){if(!q)return true;var s=(p.n+' '+p.a+' '+p.s+' '+(p.m||'')+' '+C[p.cat].n).toLowerCase(),w=q.toLowerCase().trim();if(s.indexOf(w)>=0)return true;var c=syn(w);return c?c.indexOf(p.cat)>=0:false}
function filtered(){var who=F.who&&G.who.filter(function(w){return w.id===F.who})[0];
  var r=G.products.filter(function(p){if(F.cat.length&&F.cat.indexOf(p.cat)<0)return false;if(who&&who.cats.indexOf(p.cat)<0)return false;
    if(F.min&&(!p.price||p.price<+F.min))return false;if(F.max&&(!p.price||p.price>+F.max))return false;if(F.sale&&!off(p))return false;
    if(F.stock&&avCls(p)!=='in')return false;if(F.priced==='yes'&&!p.price)return false;if(F.priced==='ask'&&p.price)return false;if(F.maker.length&&F.maker.indexOf(p.m||'')<0)return false;return match(p,F.q)});
  var order=G.products.map(function(p){return p.id});
  var s={pop:function(a,b){return order.indexOf(a.id)-order.indexOf(b.id)},cheap:function(a,b){return (a.price||1e12)-(b.price||1e12)},dear:function(a,b){return (b.price||0)-(a.price||0)},off:function(a,b){return off(b)-off(a)}}[F.sort];
  return r.sort(s)}
var SORTS={pop:'Сначала популярные',cheap:'Сначала дешевле',dear:'Сначала дороже',off:'По размеру скидки'};
V.catalog=function(arg,q){var cat=arg&&arg!=='all'?arg:'',c=C[cat];F.cat=cat?[cat]:[];F.who=q.who||'';if(q.sale)F.sale=true;F.q=q.q||'';
  var who=F.who&&G.who.filter(function(w){return w.id===F.who})[0];V.title=c?c.n:'Каталог';
  return '<div class="cat"><div class="cat-h"><h1>'+(F.q?'Найдено: «'+h(F.q)+'»':c?h(c.n):who?h(who.n):'Каталог')+'</h1><p class="muted" id="cat-n"></p>'+(c&&c.total>G.products.filter(function(p){return p.cat===cat}).length?'<p class="muted small">На medikor.ru в разделе '+c.total+' '+plural(c.total,['товар','товара','товаров'])+', в макете показаны первые.</p>':'')+'</div>'+
  '<div class="chips"><a href="#/c/all" class="chip'+(!cat&&!who?' on':'')+'">Все</a>'+G.cats.map(function(x){return '<a href="#/c/'+x.id+'" class="chip'+(x.id===cat?' on':'')+'">'+ic(x.i)+h(x.n)+'</a>'}).join('')+'</div>'+
  '<div class="tools"><button type="button" class="tool" id="f-open">'+ic('filter')+'<span>Фильтры</span><i id="f-n" hidden></i></button><button type="button" class="tool" id="s-open">'+ic('sort')+'<span id="s-cur">'+SORTS[F.sort]+'</span></button></div>'+
  '<div class="grid" id="cat-grid"></div></div>'};
function fCount(){return (F.min||F.max?1:0)+(F.sale?1:0)+(F.stock?1:0)+(F.priced?1:0)+F.maker.length}
function drawGrid(){var g=$('#cat-grid');if(!g)return;var r=filtered(),n=$('#cat-n');if(n)n.textContent=r.length+' '+plural(r.length,['товар','товара','товаров']);
  var fn=$('#f-n'),c=fCount();if(fn){fn.hidden=!c;fn.textContent=c}$('#s-cur').textContent=SORTS[F.sort];
  g.innerHTML=r.length?r.map(function(p){return card(p)}).join(''):'<div class="empty">'+ic('search','big')+'<b>Ничего не нашлось</b><p>Сбросьте фильтры или напишите, что ищете: подберём.</p><button type="button" class="btn btn-b" id="f-reset">Сбросить фильтры</button></div>';
  var rs=$('#f-reset');if(rs)rs.onclick=function(){resetF();drawGrid()}}
function resetF(){F.min='';F.max='';F.sale=false;F.stock=false;F.priced='';F.maker=[];F.q=''}
V.catalog_on=function(){drawGrid();
  $('#f-open').onclick=filterSheet;
  $('#s-open').onclick=function(){sheet('Сортировка',Object.keys(SORTS).map(function(k){return '<label class="opt"><input type="radio" name="srt" value="'+k+'"'+(F.sort===k?' checked':'')+'><span>'+SORTS[k]+'</span>'+ic('check','ok')+'</label>'}).join(''),{on:function(s){$$('input',s).forEach(function(i){i.onchange=function(){F.sort=i.value;closeSheet();drawGrid()}})}})}};
function filterSheet(){var makers=['Medikor','Sometech','RADIAN Qbio'];
  var body='<fieldset><legend>Цена, ₽</legend><div class="range"><label><small>от</small><input type="number" inputmode="numeric" id="f-min" placeholder="500" value="'+h(F.min)+'"></label><label><small>до</small><input type="number" inputmode="numeric" id="f-max" placeholder="500 000" value="'+h(F.max)+'"></label></div>'+
  '<div class="fchips">'+[[0,20000],[20000,150000],[150000,0]].map(function(r){return '<button type="button" class="fchip pr" data-r="'+r[0]+','+r[1]+'">'+(r[0]?(r[1]?fmt(r[0]/1000)+'-'+fmt(r[1]/1000)+' тыс.':'от '+fmt(r[0]/1000)+' тыс.'):'до '+fmt(r[1]/1000)+' тыс.')+'</button>'}).join('')+'</div></fieldset>'+
  '<fieldset><legend>Производитель</legend><div class="fchips">'+makers.map(function(m){return '<label class="fchip"><input type="checkbox" name="fm" value="'+m+'"'+(F.maker.indexOf(m)>=0?' checked':'')+'><span>'+m+'</span></label>'}).join('')+'</div></fieldset>'+
  '<fieldset><legend>Цена на сайте</legend><div class="fchips">'+[['','Любая'],['yes','С ценой'],['ask','По запросу']].map(function(x){return '<label class="fchip"><input type="radio" name="fp" value="'+x[0]+'"'+(F.priced===x[0]?' checked':'')+'><span>'+x[1]+'</span></label>'}).join('')+'</div></fieldset>'+
  '<label class="sw-row"><span>Только в наличии</span><input type="checkbox" id="f-stock" class="sw"'+(F.stock?' checked':'')+'></label>'+
  '<label class="sw-row"><span>Только со скидкой</span><input type="checkbox" id="f-sale" class="sw"'+(F.sale?' checked':'')+'></label>';
  sheet('Фильтры',body,{tall:true,foot:'<button type="button" class="btn btn-ghost" id="f-clear">Сбросить</button><button type="button" class="btn btn-b" id="f-go"></button>',on:function(s){
    function read(){F.maker=$$('input[name=fm]:checked',s).map(function(i){return i.value});F.priced=($('input[name=fp]:checked',s)||{}).value||'';F.min=$('#f-min',s).value;F.max=$('#f-max',s).value;F.sale=$('#f-sale',s).checked;F.stock=$('#f-stock',s).checked;
      var n=filtered().length;$('#f-go',s).textContent=n?'Показать '+n:'Ничего не нашлось';$('#f-go',s).disabled=!n}
    $$('input',s).forEach(function(i){i.addEventListener('input',read);i.addEventListener('change',read)});
    $$('.pr',s).forEach(function(b){b.onclick=function(){var r=b.getAttribute('data-r').split(',');$('#f-min',s).value=+r[0]||'';$('#f-max',s).value=+r[1]||'';read()}});
    $('#f-clear',s).onclick=function(){resetF();closeSheet();drawGrid()};$('#f-go',s).onclick=function(){closeSheet();drawGrid()};read()}})}

/* Товар: галерея, цена, наличие, документы, характеристики, доставка. */
V.product=function(id){var p=P[id];if(!p)return V.home();V.title=p.n;S.recent=[id].concat(S.recent.filter(function(x){return x!==id})).slice(0,8);save();
  var o=off(p),imgs=['p-'+p.id+'.webp'];for(var i=0;i<p.g;i++)imgs.push('g-'+p.id+'-'+i+'.webp');var c=C[p.cat];
  var specs=[['Артикул',p.a]].concat(p.c?[['Страна',p.c]]:[]).concat(p.m?[['Производитель',p.m]]:[]).concat(p.sp);
  return '<div class="pd" data-id="'+id+'"><nav class="crumbs" aria-label="Путь"><a href="#/">Главная</a>'+ic('chev')+'<a href="#/c/'+p.cat+'">'+h(c.n)+'</a></nav>'+
  '<div class="pd-grid"><div class="pd-gal"><div class="gal" id="gal" tabindex="0" aria-label="Фото">'+imgs.map(function(s,i){return '<figure class="gal-i"><img src="'+IMG+'/'+s+'" alt="'+h(p.n)+' · '+(i+1)+'"'+(i?' loading="lazy"':'')+' width="800" height="800"></figure>'}).join('')+'</div>'+
  (imgs.length>1?'<div class="gal-dots" aria-hidden="true">'+imgs.map(function(s,i){return '<i'+(i?'':' class="on"')+'></i>'}).join('')+'</div><div class="gal-th">'+imgs.map(function(s,i){return '<button type="button" data-g="'+i+'"'+(i?'':' class="on"')+' aria-label="Фото '+(i+1)+'"><img src="'+IMG+'/'+s+'" alt="" loading="lazy"></button>'}).join('')+'</div>':'')+
  (o?'<span class="tag-off big">−'+o+'%</span>':'')+'<button type="button" class="fav big'+(S.fav.indexOf(id)>=0?' on':'')+'" data-fav="'+id+'" aria-pressed="'+(S.fav.indexOf(id)>=0)+'" aria-label="В избранное">'+ic('heart')+'</button></div>'+
  '<div class="pd-info"><p class="pd-a">Артикул '+h(p.a)+(p.m?' · '+h(p.m):'')+'</p><h1>'+h(p.n)+'</h1>'+
  '<div class="pd-price">'+(p.price?'<b>'+rub(p.price)+'</b>'+(o?'<s>'+rub(p.old)+'</s><span class="tag-off">−'+o+'%</span>':''):'<b class="ask">Цена по запросу</b>')+'</div>'+
  (id==='hr501'?'<div class="cmpx"><p><b>Этот же HR-501 у других продавцов</b></p><ul>'+G.elsewhere.map(function(x){return '<li><span>'+h(x[0])+'</span><b>'+rub(x[1])+'</b></li>'}).join('')+'</ul><small>Цены на 15.10.2026</small></div>':'')+
  '<p class="pc-av '+avCls(p)+'">'+ic(avCls(p)==='in'?'check':'clock')+avTxt(p)+'</p>'+
  '<div id="pd-buy" class="pd-buy" data-id="'+id+'">'+pdBuy(p)+'</div>'+
  '<ul class="pd-del"><li>'+ic('truck')+'<span><b>Доставка по России</b><small>Цена и срок до вашего города считаются в корзине</small></span></li><li>'+ic('pin')+'<span><b>Самовывоз</b><small>'+h(G.brand.addr)+', '+h(G.brand.hours)+'</small></span></li><li>'+ic('doc')+'<span><b>Для организаций</b><small>Счёт по ИНН, закрывающие документы в кабинете</small></span></li></ul>'+
  (p.s?'<p class="pd-s">'+h(p.s)+'</p>':'')+
  '<h2 class="pd-h">Характеристики</h2><div class="tw"><table class="spec"><tbody>'+specs.map(function(r){return '<tr><th scope="row">'+h(r[0])+'</th><td>'+h(r[1])+'</td></tr>'}).join('')+'</tbody></table></div>'+
  '<h2 class="pd-h">Документы</h2><ul class="docs">'+(p.ru?'<li><button type="button" data-doc="ru:'+id+'">'+ic('shield')+'<span><b>Регистрационное удостоверение</b><small>'+(p.ru==='есть'?'есть, номер и файл добавит менеджер':'№ '+h(p.ru))+'</small></span>'+ic('chev')+'</button></li>':'<li><button type="button" data-doc="ru:'+id+'">'+ic('shield')+'<span><b>Регистрационное удостоверение</b><small>файл добавит менеджер из панели</small></span>'+ic('chev')+'</button></li>')+
  '<li><button type="button" data-doc="man:'+id+'">'+ic('doc')+'<span><b>Инструкция по эксплуатации</b><small>PDF, на русском</small></span>'+ic('chev')+'</button></li></ul>'+
  '</div></div>'+
  ((G.pairs[id]||[]).length?sec('С этим берут','','<div class="rail">'+G.pairs[id].map(function(x){return card(P[x],'rl')}).join('')+'</div>'):'')+
  '<div class="pd-bar" id="pd-bar" data-id="'+id+'">'+pdBar(p)+'</div></div>'};
function pdBuy(p){if(!p.price)return (inKp(p.id)?'<a class="btn btn-b big" href="#/kp">'+ic('check')+'В запросе КП, открыть</a>':'<button type="button" class="btn btn-b big" data-kp="'+p.id+'">'+ic('doc')+'Запросить КП</button>')+'<p class="muted small">Цену и срок поставки пришлёт менеджер, ответ виден в кабинете.</p>';
  var q=inCart(p.id);return (q?'<div class="step big"><button type="button" data-minus="'+p.id+'" aria-label="Меньше">'+ic('minus')+'</button><b>'+q+'</b><button type="button" data-plus="'+p.id+'" aria-label="Больше">'+ic('plus')+'</button></div><a class="btn btn-b" href="#/cart">В корзине'+ic('arrow')+'</a>':'<button type="button" class="btn btn-b big" data-add="'+p.id+'">'+ic('cart')+'В корзину</button>')+
  '<div class="pd-b2"><button type="button" class="btn btn-ghost" data-inv="'+p.id+'">'+ic('doc')+'Счёт на организацию</button><button type="button" class="btn btn-ghost" data-kp="'+p.id+'">'+(inKp(p.id)?ic('check')+'В КП':ic('plus')+'В запрос КП')+'</button></div>'}
function pdBar(p){if(!p.price)return '<div class="pb-p"><b>Цена по запросу</b><small>'+avTxt(p)+'</small></div>'+(inKp(p.id)?'<a class="btn btn-b" href="#/kp">Запрос КП'+ic('arrow')+'</a>':'<button type="button" class="btn btn-b" data-kp="'+p.id+'">'+ic('doc')+'Запросить КП</button>');
  var q=inCart(p.id);return '<div class="pb-p"><b>'+rub(p.price)+'</b><small>'+avTxt(p)+'</small></div>'+(q?'<a class="btn btn-b" href="#/cart">В корзине: '+q+ic('arrow')+'</a>':'<button type="button" class="btn btn-b" data-add="'+p.id+'">'+ic('cart')+'В корзину</button>')}
V.product_on=function(id){var g=$('#gal');if(!g)return;var dots=$$('.gal-dots i'),th=$$('.gal-th button');
  function cur(){var i=Math.round(g.scrollLeft/g.clientWidth);dots.forEach(function(x,k){x.classList.toggle('on',k===i)});th.forEach(function(x,k){x.classList.toggle('on',k===i)})}
  g.addEventListener('scroll',function(){requestAnimationFrame(cur)},{passive:true});
  th.forEach(function(b){b.onclick=function(){g.scrollTo({left:+b.getAttribute('data-g')*g.clientWidth,behavior:REDUCED?'auto':'smooth'})}});
  /* Липкая кнопка появляется, когда своя кнопка «В корзину» ушла с экрана. */
  var bar=$('#pd-bar'),buy=$('#pd-buy');if('IntersectionObserver' in W&&bar&&buy)new IntersectionObserver(function(es){bar.classList.toggle('on',!es[0].isIntersecting&&es[0].boundingClientRect.top<0)}).observe(buy)};
function docSheet(kind,id){var p=P[id];
  if(kind==='ru')sheet('Регистрационное удостоверение','<div class="paper"><p class="pp-k">Росздравнадзор</p><h3>'+(p.ru&&p.ru!=='есть'?'РУ № '+h(p.ru):'Регистрационное удостоверение')+'</h3><p>Медицинское изделие: '+h(p.n)+'</p>'+(p.ru&&p.ru!=='есть'?'<p class="ok">'+ic('check')+'Номер из карточки на medikor.ru</p>':'<p class="muted">Менеджер прикрепляет файл в панели, и он появляется здесь у каждого товара.</p>')+'<p class="muted small">Демо: в рабочем магазине здесь открывается PDF удостоверения.</p></div>');
  else sheet('Инструкция','<div class="paper"><h3>'+h(p.n)+'</h3><p>Инструкция по эксплуатации, PDF.</p><p class="muted small">Демо: в рабочем магазине здесь открывается файл производителя.</p></div>')}

/* Корзина: частное лицо или организация, доставка до города. */
function lines(items){return items.map(function(c){var p=P[c.id];return {id:c.id,q:c.q,p:p,sum:(p.price||0)*c.q}})}
function total(items){return lines(items).reduce(function(s,l){return s+l.sum},0)}
function weight(items){return items.reduce(function(s,c){return s+P[c.id].w*c.q},0)}
function shipCost(id,city,items){var sh=G.ship.filter(function(x){return x.id===id})[0],k=(G.cities.filter(function(c){return c[0]===city})[0]||[0,1.5])[1];if(!sh||!sh.base&&!sh.kg)return 0;return Math.round((sh.base+sh.kg*weight(items))*(1+k*.6)/10)*10}
function shipOk(id,city){return !(id==='msk'&&city!=='Москва')}
V.cart=function(){V.title='Корзина';var L=lines(S.cart);
  if(!L.length)return '<div class="cartp"><h1>Корзина</h1><div class="empty">'+ic('cart','big')+'<b>В корзине пусто</b><p>Откройте каталог или запросите КП, если нужна цена для закупки.</p><a class="btn btn-b" href="#/c/all">В каталог</a></div>'+(S.kpDraft.length?'<a class="btn btn-ghost wide" href="#/kp">'+ic('doc')+'Запрос КП: '+S.kpDraft.length+'</a>':'')+'</div>';
  var sum=total(S.cart);
  return '<div class="cartp"><h1>Корзина <small>'+cartN()+' '+plural(cartN(),['товар','товара','товаров'])+'</small></h1><div class="cart-grid"><div>'+
  '<div class="seg" role="radiogroup" aria-label="Кто покупает"><button type="button" role="radio" aria-checked="'+(S.who==='person')+'" data-who="person">'+ic('user')+'Частное лицо</button><button type="button" role="radio" aria-checked="'+(S.who==='org')+'" data-who="org">'+ic('build')+'Организация</button></div>'+
  (S.who==='org'?'<p class="note">'+ic('doc')+'<span>Для организации: счёт по ИНН, оплата с расчётного счёта, УПД и гарантийный талон в кабинете.</span></p>':'')+
  '<ul class="cl">'+L.map(function(l){return '<li class="ci" data-card="'+l.id+'"><a href="#/p/'+l.id+'"><img src="'+IMG+'/p-'+l.id+'-s.webp" alt="" width="96" height="96"></a><div class="ci-b"><a href="#/p/'+l.id+'" class="ci-n">'+h(l.p.n)+'</a><p class="ci-p"><b>'+rub(l.p.price)+'</b>'+(off(l.p)?'<s>'+fmt(l.p.old)+'</s>':'')+'</p><p class="pc-av '+avCls(l.p)+'">'+avTxt(l.p)+'</p><div class="ci-r"><div class="step" data-buy="'+l.id+'"><button type="button" data-minus="'+l.id+'" aria-label="Меньше">'+ic('minus')+'</button><b>'+l.q+'</b><button type="button" data-plus="'+l.id+'" aria-label="Больше">'+ic('plus')+'</button></div><button type="button" class="lnk" data-del="'+l.id+'">Удалить</button></div></div></li>'}).join('')+'</ul>'+
  '<div class="box"><h2>Доставка</h2><label class="fld"><span>Город</span><select id="city">'+G.cities.map(function(c){return '<option'+(c[0]===S.city?' selected':'')+'>'+c[0]+'</option>'}).join('')+'</select></label><div class="ships">'+G.ship.filter(function(s){return shipOk(s.id,S.city)}).map(function(s){var c=shipCost(s.id,S.city,S.cart);return '<label class="opt2"><input type="radio" name="ship" value="'+s.id+'"'+(S.ship===s.id?' checked':'')+'><span><b>'+h(s.n)+'</b><small>'+h(s.days)+'</small></span><em>'+(c?rub(c):'бесплатно')+'</em></label>'}).join('')+'</div><p class="muted small">Вес заказа '+String(Math.round(weight(S.cart)*10)/10).replace('.',',')+' кг. Цены перевозчиков в макете демо: в рабочем магазине их считает СДЭК, ПЭК и Деловые линии.</p></div></div>'+
  '<aside class="sum"><div class="sm-l"><span>Товары</span><b>'+rub(sum)+'</b></div><div class="sm-l"><span>Доставка</span><b id="sm-sh">'+rub(shipCost(S.ship,S.city,S.cart))+'</b></div><div class="sm-t"><span>Итого</span><b id="sm-t">'+rub(sum+shipCost(S.ship,S.city,S.cart))+'</b></div>'+
  '<a class="btn btn-b wide" href="#/checkout" id="to-co">'+(S.who==='org'?'Получить счёт':'Оформить заказ')+ic('arrow')+'</a><button type="button" class="btn btn-ghost wide" id="cart-kp">'+ic('doc')+'Запросить КП на корзину</button></aside></div></div>'};
V.cart_on=function(){if(!S.cart.length)return;
  if(!shipOk(S.ship,S.city)){S.ship='cdek';save()}
  $$('[data-who]').forEach(function(b){b.onclick=function(){S.who=b.getAttribute('data-who');save();render()}});
  $$('[data-del]').forEach(function(b){b.onclick=function(){var id=b.getAttribute('data-del');setQ(id,0);render();toast('Удалено','Вернуть',function(){setQ(id,1);render()})}});
  $('#city').onchange=function(){S.city=this.value;if(!shipOk(S.ship,S.city))S.ship='cdek';save();render()};
  $$('input[name=ship]').forEach(function(i){i.onchange=function(){S.ship=i.value;save();var sh=shipCost(S.ship,S.city,S.cart);$('#sm-sh').textContent=rub(sh);$('#sm-t').textContent=rub(total(S.cart)+sh)}});
  $('#cart-kp').onclick=function(){S.cart.forEach(function(c){if(!inKp(c.id))S.kpDraft.push({id:c.id,q:c.q})});save();go('#/kp')}};

/* Оформление: контакты, организация по ИНН, оплата. */
function orgBy(inn){var o=G.orgs.filter(function(x){return x.inn===inn})[0];if(o)return o;if(inn.length===10||inn.length===12)return {inn:inn,n:'Организация по ИНН '+inn+' (демо)',kpp:inn.length===10?inn.slice(0,4)+'01001':'',a:'адрес подставится из ЕГРЮЛ'};return null}
function orgCard(o){return '<div class="org"><b>'+h(o.n)+'</b><small>ИНН '+o.inn+(o.kpp?' · КПП '+o.kpp:'')+'</small><small>'+h(o.a)+'</small><span class="ok">'+ic('check')+'Реквизиты подставлены</span></div>'}
V.checkout=function(){V.title='Оформление';if(!S.cart.length)return V.cart();var org=S.who==='org',sum=total(S.cart),sh=shipCost(S.ship,S.city,S.cart),me=S.me;
  var pays=org?[['invoice','По счёту','с расчётного счёта организации','doc'],['card','Картой организации','корпоративная карта, чек на почту','card']]:[['card','Картой онлайн','Мир, Visa, Mastercard','card'],['sbp','По QR через СБП','в приложении своего банка','qr'],['cash','При получении','наличными или картой в офисе','cash']];
  var pay=pays.some(function(x){return x[0]===S.pay})?S.pay:pays[0][0];
  return '<div class="co"><h1>Оформление</h1><div class="cart-grid"><form id="co-f" novalidate>'+
  '<div class="box"><h2>'+(org?'Организация':'Покупатель')+'</h2>'+
  (org?'<label class="fld"><span>ИНН</span><input id="inn" inputmode="numeric" autocomplete="off" maxlength="12" placeholder="10 или 12 цифр" value="'+h((me.org&&me.org.inn)||'')+'"></label><div class="fchips">'+G.orgs.map(function(o){return '<button type="button" class="fchip" data-inn="'+o.inn+'">'+h(o.short)+'</button>'}).join('')+'</div><div id="org">'+(me.org?orgCard(me.org):'')+'</div>':'')+
  '<label class="fld"><span>'+(org?'Контактное лицо':'Имя')+'</span><input id="nm" autocomplete="name" value="'+h(me.name||'')+'"></label>'+
  '<label class="fld"><span>Телефон</span><span class="ph"><i>+7</i><input id="ph" inputmode="tel" autocomplete="tel-national" placeholder="900 000-00-00" value="'+h(me.phone||'')+'"></span></label>'+
  '<label class="fld"><span>Почта для счёта и документов</span><input id="em" type="email" inputmode="email" autocomplete="email" placeholder="zakupki@clinic.ru" value="'+h(me.email||'')+'"></label>'+
  (org?'<label class="fld"><span>Комментарий для менеджера</span><textarea id="cm" rows="2" placeholder="Например: поставка по договору, нужен гарантийный талон"></textarea></label>':'')+'</div>'+
  '<div class="box"><h2>Доставка</h2><p class="row2"><span>'+h(G.ship.filter(function(x){return x.id===S.ship})[0].n)+', '+h(S.city)+'</span><a href="#/cart" class="lnk">Изменить</a></p>'+(S.ship!=='pickup'?'<label class="fld"><span>Адрес</span><input id="ad" autocomplete="street-address" placeholder="улица, дом, подъезд, этаж" value="'+h(me.addr||'')+'"></label>':'<p class="muted small">'+h(G.brand.addr)+', '+h(G.brand.hours)+'. Выдаём после оплаты.</p>')+'</div>'+
  '<div class="box"><h2>Оплата</h2>'+pays.map(function(x){return '<label class="opt2 pay"><input type="radio" name="pay" value="'+x[0]+'"'+(x[0]===pay?' checked':'')+'>'+ic(x[3])+'<span><b>'+x[1]+'</b><small>'+x[2]+'</small></span></label>'}).join('')+'</div>'+
  '<p class="err" id="co-err" hidden></p></form>'+
  '<aside class="sum"><ul class="sm-items">'+lines(S.cart).map(function(l){return '<li><img src="'+IMG+'/p-'+l.id+'-s.webp" alt="" width="44" height="44"><span>'+h(l.p.n)+'</span><b>'+l.q+' × '+fmt(l.p.price)+'</b></li>'}).join('')+'</ul>'+
  '<div class="sm-l"><span>Товары</span><b>'+rub(sum)+'</b></div><div class="sm-l"><span>Доставка</span><b>'+rub(sh)+'</b></div><div class="sm-t"><span>Итого</span><b>'+rub(sum+sh)+'</b></div>'+
  '<button type="button" class="btn btn-b wide" id="co-go">'+(org?'Получить счёт':'Перейти к оплате')+ic('arrow')+'</button><p class="muted small">Нажимая кнопку, вы соглашаетесь с обработкой персональных данных. Макет: деньги не списываются.</p></aside></div>'+
  '<div class="co-bar"><div class="pb-p"><b>'+rub(sum+sh)+'</b><small>с доставкой</small></div><button type="button" class="btn btn-b" id="co-go2">'+(org?'Получить счёт':'К оплате')+'</button></div></div>'};
V.checkout_on=function(){if(!S.cart.length)return;var inn=$('#inn');
  function innRun(){var v=inn.value.replace(/\D/g,'').slice(0,12);if(inn.value!==v)inn.value=v;var o=orgBy(v);S.me.org=o;save();$('#org').innerHTML=o?orgCard(o):(v?'<p class="muted small">Ещё '+Math.max(0,10-v.length)+' '+plural(Math.max(0,10-v.length),['цифра','цифры','цифр'])+'</p>':'')}
  if(inn){inn.addEventListener('input',innRun);$$('[data-inn]').forEach(function(b){b.onclick=function(){inn.value=b.getAttribute('data-inn');innRun()}})}
  $$('input[name=pay]').forEach(function(i){i.onchange=function(){S.pay=i.value;save()}});
  function submit(){var org=S.who==='org',err=[],nm=$('#nm').value.trim(),ph=$('#ph').value.replace(/\D/g,''),em=$('#em').value.trim(),ad=$('#ad');
    if(org&&!S.me.org)err.push('ИНН организации');if(!nm)err.push(org?'контактное лицо':'имя');if(ph.length<10)err.push('телефон');if(!/.+@.+\..+/.test(em))err.push('почта');if(ad&&ad.value.trim().length<5)err.push('адрес');
    var e=$('#co-err');if(err.length){e.hidden=false;e.textContent='Заполните: '+err.join(', ');e.scrollIntoView({block:'center',behavior:REDUCED?'auto':'smooth'});return}
    S.me.name=nm;S.me.phone=ph;S.me.email=em;if(ad)S.me.addr=ad.value.trim();
    var pay=($('input[name=pay]:checked')||{}).value||'card',sh=shipCost(S.ship,S.city,S.cart);
    var o={no:'MK-'+(10480+S.orders.length*7+Math.floor(Math.random()*5)),date:today(),items:S.cart.map(function(c){return {id:c.id,q:c.q,price:P[c.id].price}}),sum:total(S.cart),ship:S.ship,shipSum:sh,city:S.city,addr:S.me.addr||'',pay:pay,who:S.who,org:org?S.me.org:null,name:nm,phone:ph,email:em,comment:($('#cm')||{}).value||'',st:0,paid:false,site:1,log:[]};
    S.orders.unshift(o);S.cart=[];save();badge();
    if(pay==='invoice'){o.inv='СЧ-'+o.no.slice(3);save();go('#/invoice/'+o.no)}else if(pay==='cash'){go('#/order/'+o.no)}else payFlow(o)}
  $('#co-go').onclick=submit;$('#co-go2').onclick=submit};
function payFlow(o){var all=o.sum+o.shipSum;
  if(o.pay==='sbp'){sheet('Оплата по QR','<div class="qr">'+qr(o.no)+'</div><p class="center"><b>'+rub(all)+'</b></p><p class="muted center small">Наведите камеру телефона или откройте приложение банка. Макет: деньги не списываются.</p>',{foot:'<button type="button" class="btn btn-b wide" id="sbp-ok">Оплатил в приложении банка</button>',on:function(s){$('#sbp-ok',s).onclick=function(){paid(o)}}});return}
  sheet('Оплата картой','<p class="center"><b class="big">'+rub(all)+'</b></p><label class="fld"><span>Номер карты</span><input id="cn" inputmode="numeric" autocomplete="cc-number" placeholder="2200 0000 0000 0000" maxlength="19"></label><div class="two"><label class="fld"><span>Срок</span><input id="ce" inputmode="numeric" autocomplete="cc-exp" placeholder="ММ/ГГ" maxlength="5"></label><label class="fld"><span>CVC</span><input id="cv" inputmode="numeric" autocomplete="cc-csc" placeholder="000" maxlength="3"></label></div><div id="c3" hidden><p class="muted small">Код из SMS банка (в макете подойдёт любой)</p><div class="code" id="code"><input inputmode="numeric" maxlength="1" aria-label="Цифра 1"><input inputmode="numeric" maxlength="1" aria-label="Цифра 2"><input inputmode="numeric" maxlength="1" aria-label="Цифра 3"><input inputmode="numeric" maxlength="1" aria-label="Цифра 4"></div></div><p class="err" id="ps-err" hidden></p>',{foot:'<button type="button" class="btn btn-b wide" id="ps-go">Оплатить '+rub(all)+'</button>',on:function(s){
    codeInputs($('#code',s));var stage=0;
    $('#ps-go',s).onclick=function(){var cn=$('#cn',s).value.replace(/\D/g,''),ce=$('#ce',s).value.replace(/\D/g,''),e=$('#ps-err',s);
      if(stage===0){if(cn.length<16||ce.length<4){e.hidden=false;e.textContent='Проверьте номер и срок карты';return}e.hidden=true;stage=1;$('#c3',s).hidden=false;$('#ps-go',s).textContent='Подтвердить';$('#code input',s).focus();return}
      var c=$$('#code input',s).map(function(i){return i.value}).join('');if(c.length<4){e.hidden=false;e.textContent='Введите 4 цифры кода';return}paid(o)}}})}
function paid(o){var x=S.orders.filter(function(z){return z.no===o.no})[0];x.paid=true;x.st=Math.max(x.st,1);x.paidAt=today();save();closeSheet();go('#/order/'+o.no);toast('Оплата прошла, чек на '+h(x.email))}
function codeInputs(box){if(!box)return;var ins=$$('input',box);ins.forEach(function(i,k){i.addEventListener('input',function(){i.value=i.value.replace(/\D/g,'').slice(0,1);if(i.value&&ins[k+1])ins[k+1].focus()});i.addEventListener('keydown',function(e){if(e.key==='Backspace'&&!i.value&&ins[k-1])ins[k-1].focus()})})}
/* QR рисуем кодом из номера заказа: картинка, а не настоящий платёж. */
function qr(txt){var n=25,c=4,s='',hsh=0;for(var i=0;i<txt.length;i++)hsh=(hsh*31+txt.charCodeAt(i))>>>0;
  function rnd(){hsh^=hsh<<13;hsh>>>=0;hsh^=hsh>>>17;hsh^=hsh<<5;hsh>>>=0;return hsh/4294967296}
  function eye(x,y){return '<rect x="'+x*c+'" y="'+y*c+'" width="'+7*c+'" height="'+7*c+'" fill="#0d1530"/><rect x="'+(x+1)*c+'" y="'+(y+1)*c+'" width="'+5*c+'" height="'+5*c+'" fill="#fff"/><rect x="'+(x+2)*c+'" y="'+(y+2)*c+'" width="'+3*c+'" height="'+3*c+'" fill="#0d1530"/>'}
  for(var y=0;y<n;y++)for(var x=0;x<n;x++){if((x<8&&y<8)||(x>n-9&&y<8)||(x<8&&y>n-9))continue;if(rnd()<.48)s+='<rect x="'+x*c+'" y="'+y*c+'" width="'+c+'" height="'+c+'"/>'}
  return '<svg viewBox="-8 -8 '+(n*c+16)+' '+(n*c+16)+'" role="img" aria-label="QR-код для оплаты"><rect x="-8" y="-8" width="'+(n*c+16)+'" height="'+(n*c+16)+'" fill="#fff"/><g fill="#0d1530">'+s+'</g>'+eye(0,0)+eye(n-7,0)+eye(0,n-7)+'</svg>'}

/* Счёт организации: собран из корзины и реквизитов по ИНН. */
function invHtml(o){var all=o.sum+o.shipSum;
  return '<div class="paper inv"><div class="inv-h"><svg class="logo-w" viewBox="'+G.logoBox+'" aria-label="Medikor"><use href="#mk-logo"/></svg><span><b>Счёт № '+h(o.inv)+'</b><small>от '+h(o.date)+'</small></span></div>'+
  '<div class="inv-p"><p><small>Поставщик</small><b>Medikor</b><span>реквизиты подставит 1С (демо)</span></p><p><small>Покупатель</small><b>'+h(o.org?o.org.n:o.name)+'</b><span>'+(o.org?'ИНН '+o.org.inn+(o.org.kpp?', КПП '+o.org.kpp:''):'')+'</span></p></div>'+
  '<div class="tw"><table class="inv-t"><thead><tr><th>№</th><th>Товар</th><th class="c2">Кол.</th><th class="c2">Цена</th><th>Сумма</th></tr></thead><tbody>'+o.items.map(function(it,i){return '<tr><td>'+(i+1)+'</td><td>'+h(P[it.id].n)+'<small class="m-only"> · '+it.q+' × '+fmt(it.price)+'</small></td><td class="c2">'+it.q+'</td><td class="c2">'+fmt(it.price)+'</td><td>'+fmt(it.price*it.q)+'</td></tr>'}).join('')+(o.shipSum?'<tr><td>'+(o.items.length+1)+'</td><td>Доставка: '+h(G.ship.filter(function(x){return x.id===o.ship})[0].n)+'</td><td class="c2">1</td><td class="c2">'+fmt(o.shipSum)+'</td><td>'+fmt(o.shipSum)+'</td></tr>':'')+'</tbody></table></div>'+
  '<p class="inv-s"><span>Итого к оплате</span><b>'+rub(all)+'</b></p><p class="muted small">Счёт действителен 5 рабочих дней. Товар резервируется после оплаты.</p></div>'}
V.invoice=function(no){var o=S.orders.filter(function(x){return x.no===no})[0];if(!o)return V.orders();V.title='Счёт '+o.inv;
  return '<div class="ord"><p class="kick ok">'+ic('check')+'Счёт готов и отправлен на '+h(o.email)+'</p><h1>Счёт для '+h(o.org?o.org.n:o.name)+'</h1>'+invHtml(o)+
  '<div class="ord-a"><button type="button" class="btn btn-b" id="inv-dl">'+ic('down')+'Скачать PDF</button><a class="btn btn-ghost" href="#/order/'+o.no+'">Статус заказа'+ic('arrow')+'</a></div>'+
  '<p class="note">'+ic('clock')+'<span>Оплату по счёту видит менеджер в панели, и заказ сам переходит в «Оплачен». В макете отметьте оплату в <a href="'+G.panel+'#invoices">панели</a> или кнопкой в заказе.</span></p></div>'};
V.invoice_on=function(no){var b=$('#inv-dl');if(b)b.onclick=function(){toast('PDF счёта сохранён (для показа)')}};

/* Заказ: статус, документы, следующий шаг для показа. */
var STEPS_PAY=['Принят','Оплачен','Собран','Передан в доставку','Получен'],STEPS_INV=['Счёт выставлен','Оплачен','Собран','Передан в доставку','Получен'];
function stName(o,st){return (o.pay==='invoice'?STEPS_INV:STEPS_PAY)[st]}
V.order=function(no){var o=S.orders.filter(function(x){return x.no===no})[0];if(!o)return V.orders();V.title='Заказ '+o.no;var steps=o.pay==='invoice'?STEPS_INV:STEPS_PAY,all=o.sum+o.shipSum;
  var docs=[];if(o.inv)docs.push(['inv','Счёт № '+o.inv,'doc']);if(o.paid&&o.pay!=='invoice')docs.push(['chk','Кассовый чек','card']);if(o.st>=3)docs.push(['upd','УПД, отгрузочный документ','doc']);if(o.st>=2)docs.push(['war','Гарантийный талон','shield']);
  o.items.forEach(function(it){if(P[it.id].ru)docs.push(['ru:'+it.id,'РУ: '+P[it.id].n,'shield'])});
  return '<div class="ord"><nav class="crumbs"><a href="#/orders">Заказы</a>'+ic('chev')+'<span>'+o.no+'</span></nav><h1>Заказ '+o.no+'</h1><p class="muted">от '+o.date+' · '+rub(all)+' · '+(o.org?h(o.org.n):h(o.name))+'</p>'+
  '<ol class="track">'+steps.map(function(s,i){return '<li class="'+(i<o.st?'done':i===o.st?'now':'')+'"><i>'+(i<o.st?ic('check'):i+1)+'</i><span><b>'+s+'</b>'+(i===3&&o.st>=3&&o.track?'<small>'+h(o.track)+'</small>':'')+(i===0?'<small>'+o.date+'</small>':'')+'</span></li>'}).join('')+'</ol>'+
  (o.st<4?'<button type="button" class="btn btn-ghost wide" id="nx">'+(o.st===0&&o.pay==='invoice'?'Отметить оплату по счёту':'Следующий шаг')+' (для показа)</button>':'<p class="note ok">'+ic('check')+'<span>Заказ получен. Документы ниже, они же в кабинете.</span></p>')+
  (o.st===0&&(o.pay==='card'||o.pay==='sbp')&&!o.paid?'<button type="button" class="btn btn-b wide" id="repay">Оплатить '+rub(all)+'</button>':'')+
  '<div class="box"><h2>Документы</h2><ul class="docs">'+docs.map(function(x){return '<li><button type="button" data-odoc="'+x[0]+'">'+ic(x[2])+'<span><b>'+h(x[1])+'</b><small>PDF</small></span>'+ic('chev')+'</button></li>'}).join('')+'</ul>'+(o.st<3?'<p class="muted small">УПД появится, когда заказ передадут в доставку.</p>':'')+'</div>'+
  '<div class="box"><h2>Состав</h2><ul class="sm-items">'+o.items.map(function(it){return '<li><img src="'+IMG+'/p-'+it.id+'-s.webp" alt="" width="44" height="44"><span>'+h(P[it.id].n)+'</span><b>'+it.q+' × '+fmt(it.price)+'</b></li>'}).join('')+'</ul><div class="sm-l"><span>Доставка: '+h(G.ship.filter(function(x){return x.id===o.ship})[0].n)+', '+h(o.city)+'</span><b>'+rub(o.shipSum)+'</b></div><div class="sm-t"><span>Итого</span><b>'+rub(all)+'</b></div></div>'+
  '<a class="btn btn-ghost wide" href="tel:'+G.brand.tel+'">'+ic('phone')+'Позвонить менеджеру</a></div>'};
V.order_on=function(no){var o=S.orders.filter(function(x){return x.no===no})[0];if(!o)return;
  var nx=$('#nx');if(nx)nx.onclick=function(){o.st++;if(o.st>=1)o.paid=true;if(o.st===3&&!o.track)o.track=(o.ship==='pickup'?'Готов к выдаче на Обручева 52с1':o.ship==='msk'?'Курьер: сегодня 12:00-16:00':'Трек-номер '+(o.ship==='cdek'?'1':'4')+String(1e9+Math.floor(Math.random()*8e9)).slice(0,10));
    o.log=o.log||[];o.log.push({st:o.st,at:today(),by:'buyer'});save();render()};
  var rp=$('#repay');if(rp)rp.onclick=function(){payFlow(o)};
  $$('[data-odoc]').forEach(function(b){b.onclick=function(){var k=b.getAttribute('data-odoc');if(k.indexOf('ru:')===0){docSheet('ru',k.slice(3));return}
    if(k==='inv'){sheet('Счёт',invHtml(o));return}
    sheet({chk:'Кассовый чек',upd:'УПД',war:'Гарантийный талон'}[k],'<div class="paper"><h3>'+{chk:'Кассовый чек',upd:'Универсальный передаточный документ',war:'Гарантийный талон'}[k]+'</h3><p>Заказ '+o.no+' от '+o.date+', '+rub(o.sum+o.shipSum)+'</p><ul class="pp-l">'+o.items.map(function(it){return '<li>'+h(P[it.id].n)+' × '+it.q+'</li>'}).join('')+'</ul><p class="muted small">Демо: в рабочем магазине документ приходит из 1С и открывается PDF.</p></div>')}})};
V.orders=function(){V.title='Заказы';return '<div class="me"><h1>Заказы</h1>'+(S.orders.length?'<ul class="olist">'+S.orders.map(function(o){return '<li><a href="#/order/'+o.no+'"><span><b>'+o.no+'</b><small>'+o.date+' · '+o.items.length+' '+plural(o.items.length,['позиция','позиции','позиций'])+'</small></span><span><b>'+rub(o.sum+o.shipSum)+'</b><em class="st st'+o.st+'">'+stName(o,o.st)+'</em></span></a></li>'}).join('')+'</ul>':'<div class="empty">'+ic('box','big')+'<b>Заказов пока нет</b><a class="btn btn-b" href="#/c/all">В каталог</a></div>')+'</div>'};

/* Запрос КП: позиции, организация, срок, комментарий. */
V.kp=function(){V.title='Запрос КП';var L=S.kpDraft;
  return '<div class="kpp"><h1>Запрос коммерческого предложения</h1><p class="muted">Для закупки, тендера или согласования с главным врачом. Менеджер пришлёт КП с ценами и сроком поставки, оно появится в кабинете.</p>'+
  (L.length?'<ul class="cl">'+L.map(function(x){var p=P[x.id];return '<li class="ci"><img src="'+IMG+'/p-'+x.id+'-s.webp" alt="" width="96" height="96"><div class="ci-b"><a href="#/p/'+x.id+'" class="ci-n">'+h(p.n)+'</a><p class="ci-p">'+(p.price?'<b>'+rub(p.price)+'</b> на сайте':'<b>Цена по запросу</b>')+'</p><div class="ci-r"><div class="step"><button type="button" data-kq="'+x.id+'" data-d="-1" aria-label="Меньше">'+ic('minus')+'</button><b>'+x.q+'</b><button type="button" data-kq="'+x.id+'" data-d="1" aria-label="Больше">'+ic('plus')+'</button></div><button type="button" class="lnk" data-kdel="'+x.id+'">Убрать</button></div></div></li>'}).join('')+'</ul>':'<div class="empty">'+ic('doc','big')+'<b>Добавьте позиции</b><p>Кнопка «Запросить КП» есть у каждого товара.</p><a class="btn btn-b" href="#/c/all">В каталог</a></div>')+
  (L.length?'<form class="box" id="kp-f" novalidate><h2>Для кого</h2><label class="fld"><span>ИНН организации</span><input id="kinn" inputmode="numeric" maxlength="12" placeholder="10 или 12 цифр" value="'+h((S.me.org&&S.me.org.inn)||'')+'"></label><div class="fchips">'+G.orgs.map(function(o){return '<button type="button" class="fchip" data-kinn="'+o.inn+'">'+h(o.short)+'</button>'}).join('')+'</div><div id="korg">'+(S.me.org?orgCard(S.me.org):'')+'</div>'+
  '<label class="fld"><span>Почта</span><input id="kem" type="email" inputmode="email" placeholder="zakupki@clinic.ru" value="'+h(S.me.email||'')+'"></label>'+
  '<fieldset><legend>Для чего</legend><div class="fchips">'+['Закупка 44-ФЗ','Закупка 223-ФЗ','Коммерческая закупка','Согласование'].map(function(x,i){return '<label class="fchip"><input type="radio" name="kfor" value="'+x+'"'+(i===2?' checked':'')+'><span>'+x+'</span></label>'}).join('')+'</div></fieldset>'+
  '<label class="fld"><span>Нужно к</span><select id="kby">'+[3,7,14,30].map(function(k){return '<option value="'+k+'">'+today(k)+'</option>'}).join('')+'</select></label>'+
  '<label class="fld"><span>Комментарий</span><textarea id="kcm" rows="3" placeholder="Например: нужен класс СЛР на 12 человек, доставка в Казань"></textarea></label><p class="err" id="k-err" hidden></p>'+
  '<button type="button" class="btn btn-b wide" id="k-go">'+ic('send')+'Отправить запрос</button></form>':'')+
  (S.kps.length?'<a class="btn btn-ghost wide" href="#/kps">Мои запросы КП: '+S.kps.length+ic('arrow')+'</a>':'')+'</div>'};
V.kp_on=function(){$$('[data-kq]').forEach(function(b){b.onclick=function(){var x=S.kpDraft.filter(function(z){return z.id===b.getAttribute('data-kq')})[0];x.q=Math.max(1,Math.min(99,x.q+ +b.getAttribute('data-d')));save();render()}});
  $$('[data-kdel]').forEach(function(b){b.onclick=function(){S.kpDraft=S.kpDraft.filter(function(z){return z.id!==b.getAttribute('data-kdel')});save();render()}});
  var ki=$('#kinn');if(!ki)return;
  function run(){var v=ki.value.replace(/\D/g,'').slice(0,12);if(ki.value!==v)ki.value=v;var o=orgBy(v);S.me.org=o;save();$('#korg').innerHTML=o?orgCard(o):''}
  ki.addEventListener('input',run);$$('[data-kinn]').forEach(function(b){b.onclick=function(){ki.value=b.getAttribute('data-kinn');run()}});
  $('#k-go').onclick=function(){var em=$('#kem').value.trim(),e=$('#k-err');if(!S.me.org||!/.+@.+\..+/.test(em)){e.hidden=false;e.textContent='Заполните ИНН организации и почту';return}
    S.me.email=em;var k={no:'КП-'+(2210+S.kps.length*3+Math.floor(Math.random()*3)),date:today(),items:S.kpDraft.slice(),org:S.me.org,email:em,for:($('input[name=kfor]:checked')||{}).value,by:today(+$('#kby').value),comment:$('#kcm').value.trim(),st:'new'};
    S.kps.unshift(k);S.kpDraft=[];save();badge();go('#/k/'+k.no);toast('Запрос отправлен менеджеру')}};
V.kps=function(){V.title='Запросы КП';return '<div class="me"><h1>Запросы КП</h1>'+(S.kps.length?'<ul class="olist">'+S.kps.map(function(k){return '<li><a href="#/k/'+encodeURIComponent(k.no)+'"><span><b>'+k.no+'</b><small>'+k.date+' · '+k.items.length+' '+plural(k.items.length,['позиция','позиции','позиций'])+'</small></span><span><em class="st kst-'+k.st+'">'+{new:'Ждёт ответа',sent:'КП готово',accepted:'Принято, счёт выставлен'}[k.st]+'</em></span></a></li>'}).join('')+'</ul>':'<div class="empty">'+ic('doc','big')+'<b>Запросов пока нет</b><a class="btn btn-b" href="#/kp">Новый запрос</a></div>')+'<a class="btn btn-ghost wide" href="#/kp">'+ic('plus')+'Новый запрос КП</a></div>'};
V.kpview=function(no){no=decodeURIComponent(no);var k=S.kps.filter(function(x){return x.no===no})[0];if(!k)return V.kps();V.title=k.no;var ans=k.st!=='new';
  var sum=k.items.reduce(function(s,x){return s+(x.price||0)*x.q},0);
  return '<div class="ord"><nav class="crumbs"><a href="#/kps">Запросы КП</a>'+ic('chev')+'<span>'+h(k.no)+'</span></nav><h1>'+h(k.no)+'</h1><p class="muted">'+h(k.org.n)+' · '+h(k.for||'')+' · нужно к '+h(k.by)+'</p>'+
  (ans?'<p class="note ok">'+ic('check')+'<span>'+(k.mgr?'Менеджер '+h(k.mgr):'Менеджер')+' прислал КП, действует до '+h(k.valid)+'.</span></p>':'<p class="note">'+ic('clock')+'<span>Запрос у менеджера. Ответ придёт на '+h(k.email)+' и сюда. В макете ответьте из <a href="'+G.panel+'#kp">панели</a>.</span></p>')+
  '<div class="paper"><div class="tw"><table class="inv-t"><thead><tr><th>Позиция</th><th>Кол.</th><th>'+(ans?'Цена':'На сайте')+'</th>'+(ans?'<th>Срок</th>':'')+'</tr></thead><tbody>'+k.items.map(function(x){var p=P[x.id];return '<tr><td>'+h(p.n)+'</td><td>'+x.q+'</td><td class="nw">'+(ans?fmt(x.price):p.price?fmt(p.price):'по запросу')+'</td>'+(ans?'<td class="nw">'+h(x.eta||'')+'</td>':'')+'</tr>'}).join('')+'</tbody></table></div>'+(ans?'<p class="inv-s"><span>Итого по КП'+(k.disc?', скидка '+k.disc+' %':'')+'</span><b>'+rub(sum)+'</b></p>':'')+(k.comment?'<p class="muted small">Ваш комментарий: '+h(k.comment)+'</p>':'')+'</div>'+
  (k.st==='sent'?'<div class="ord-a"><button type="button" class="btn btn-b" id="k-acc">'+ic('check')+'Принять и получить счёт</button><button type="button" class="btn btn-ghost" id="k-pdf">'+ic('down')+'КП в PDF</button></div>':k.st==='accepted'?'<a class="btn btn-b wide" href="#/order/'+k.order+'">Заказ и счёт'+ic('arrow')+'</a>':'')+'</div>'};
V.kpview_on=function(no){no=decodeURIComponent(no);var k=S.kps.filter(function(x){return x.no===no})[0];if(!k)return;
  var a=$('#k-acc');if(a)a.onclick=function(){var o={no:'MK-'+(10480+S.orders.length*7+3),date:today(),items:k.items.map(function(x){return {id:x.id,q:x.q,price:x.price}}),sum:k.items.reduce(function(s,x){return s+x.price*x.q},0),ship:'cdek',shipSum:0,city:S.city,pay:'invoice',who:'org',org:k.org,name:k.org.n,email:k.email,st:0,paid:false,site:1,kp:k.no,log:[]};o.inv='СЧ-'+o.no.slice(3);
    S.orders.unshift(o);k.st='accepted';k.order=o.no;save();go('#/invoice/'+o.no)};
  var pf=$('#k-pdf');if(pf)pf.onclick=function(){toast('PDF коммерческого предложения сохранён (для показа)')}};

/* Кабинет: организация, заказы, КП, документы, избранное. */
V.me=function(){V.title='Кабинет';var o=S.me.org,docs=S.orders.reduce(function(n,x){return n+(x.inv?1:0)+(x.st>=3?1:0)+(x.st>=2?1:0)},0);
  return '<div class="me"><div class="me-h"><span class="av">'+ic(o?'build':'user')+'</span><span><b>'+h(o?o.n:S.me.name||'Гость')+'</b><small>'+(o?'ИНН '+o.inn:S.me.phone?'+7 '+h(S.me.phone):'войдите при первом заказе')+'</small></span></div>'+
  '<nav class="me-n">'+[['#/orders','box','Заказы',S.orders.length],['#/kps','doc','Запросы КП',S.kps.length],['#/docs','shield','Документы',docs],['#/fav','heart','Избранное',S.fav.length],['#/kp','plus','Новый запрос КП','']].map(function(x){return '<a href="'+x[0]+'">'+ic(x[1])+'<span>'+x[2]+'</span>'+(x[3]!==''?'<em>'+x[3]+'</em>':'')+ic('chev')+'</a>'}).join('')+'</nav>'+
  (o?'<div class="box"><h2>Реквизиты</h2>'+orgCard(o)+'<p class="muted small">Подставляются в каждый счёт. Сотрудники организации заходят по своему телефону и видят общие заказы.</p></div>':'')+
  '<div class="box"><h2>Менеджер</h2><p>Пн-Пт 9:00-18:00</p><p class="row2"><a href="tel:'+G.brand.tel+'">'+G.brand.phone+'</a><a href="mailto:'+G.brand.email+'">'+G.brand.email+'</a></p></div>'+legal()+'</div>'};
V.docs=function(){V.title='Документы';var L=[];S.orders.forEach(function(o){if(o.inv)L.push([o.no,'Счёт № '+o.inv,o.date]);if(o.st>=2)L.push([o.no,'Гарантийный талон',o.date]);if(o.st>=3)L.push([o.no,'УПД',o.date])});
  return '<div class="me"><h1>Документы</h1>'+(L.length?'<ul class="olist">'+L.map(function(x){return '<li><a href="#/order/'+x[0]+'"><span><b>'+h(x[1])+'</b><small>заказ '+x[0]+' · '+x[2]+'</small></span>'+ic('chev')+'</a></li>'}).join('')+'</ul>':'<div class="empty">'+ic('shield','big')+'<b>Документов пока нет</b><p>Счета, УПД и гарантийные талоны появятся после первого заказа.</p></div>')+'</div>'};
V.fav=function(){V.title='Избранное';var L=S.fav.map(function(id){return P[id]}).filter(Boolean);return '<div class="me"><h1>Избранное</h1>'+(L.length?'<div class="grid">'+L.map(function(p){return card(p)}).join('')+'</div>':'<div class="empty">'+ic('heart','big')+'<b>Пока пусто</b><p>Нажмите сердце у товара, чтобы вернуться к нему или отправить ссылку главному врачу.</p></div>')+'</div>'};

/* Поиск с подсказками. */
var srch=null;
function openSearch(){srch=$('#search');srch.hidden=false;void srch.offsetWidth;srch.classList.add('on');root.classList.add('locked');var i=$('#sq');i.value='';sugg('');i.focus()}
function closeSearch(){if(!srch||srch.hidden)return;srch.classList.remove('on');root.classList.remove('locked');var s=srch;setTimeout(function(){s.hidden=true},REDUCED?0:200)}
function sugg(q){var box=$('#sq-res');q=(q||'').trim();
  if(!q){box.innerHTML='<p class="sq-k">Часто ищут</p><div class="fchips">'+G.popular.map(function(x){return '<a class="fchip" href="#/search?q='+encodeURIComponent(x)+'">'+h(x)+'</a>'}).join('')+'</div>'+(S.recent.length?'<p class="sq-k">Вы смотрели</p>'+S.recent.slice(0,4).map(function(id){return srow(P[id])}).join(''):'');return}
  var r=G.products.filter(function(p){return match(p,q)}).slice(0,6),c=syn(q);
  box.innerHTML=(c?'<p class="sq-k">Разделы</p><div class="fchips">'+c.map(function(id){return '<a class="fchip" href="#/c/'+id+'">'+ic(C[id].i)+h(C[id].n)+'</a>'}).join('')+'</div>':'')+(r.length?'<p class="sq-k">Товары</p>'+r.map(srow).join('')+'<a class="sq-all" href="#/search?q='+encodeURIComponent(q)+'">Все результаты'+ic('arrow')+'</a>':'<p class="muted">Ничего не нашлось. Попробуйте «манекен» или «вены».</p>')}
function srow(p){return '<a class="sq-p" href="#/p/'+p.id+'"><img src="'+IMG+'/p-'+p.id+'-s.webp" alt="" width="48" height="48"><span><b>'+h(p.n)+'</b><small>'+(p.price?rub(p.price):'Цена по запросу')+'</small></span></a>'}

/* Шапка (правило владельца, 15.10.2026): при любой прокрутке прячется и
   возвращается только через 3 секунды после полной остановки. */
var top=$('#top');
var IDLE=3000,idleT=0;
function headIdle(){if(!top)return;clearTimeout(idleT);
  if(!top.contains(d.activeElement))top.classList.add('hide');
  idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}
function showTop(){clearTimeout(idleT);if(top)top.classList.remove('hide')}
function onScroll(){headIdle()}
addEventListener('scroll',onScroll,{passive:true});

/* ── Делегирование нажатий ─────────────────────────────────────────────── */
d.addEventListener('click',function(e){var b=e.target.closest('button,a');if(!b)return;
  var id;if((id=b.getAttribute('data-add'))){e.preventDefault();addCart(id,b);return}
  if((id=b.getAttribute('data-plus'))){setQ(id,inCart(id)+1);refreshBuy(id);pulse('.cart-ic');return}
  if((id=b.getAttribute('data-minus'))){var q=inCart(id)-1;setQ(id,q);refreshBuy(id);return}
  if((id=b.getAttribute('data-fav'))){e.preventDefault();toggleFav(id);return}
  if((id=b.getAttribute('data-kp'))){e.preventDefault();addKp(id);return}
  if((id=b.getAttribute('data-inv'))){if(!inCart(id))setQ(id,1);S.who='org';save();go('#/checkout');return}
  if((id=b.getAttribute('data-doc'))){var x=id.split(':');docSheet(x[0],x[1]);return}
  if(b.hasAttribute('data-search')){e.preventDefault();openSearch();return}});
$('#sq').addEventListener('input',function(){sugg(this.value)});
$('#sq-form').addEventListener('submit',function(e){e.preventDefault();var q=$('#sq').value.trim();if(q)go('#/search?q='+encodeURIComponent(q))});
$('#sq-x').onclick=closeSearch;
$('#search').addEventListener('click',function(e){if(e.target.closest('a'))closeSearch()});
if(!location.hash&&EMBED)location.hash='#/';
render();
})();
