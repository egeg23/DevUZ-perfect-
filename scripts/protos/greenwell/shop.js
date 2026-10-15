(function(){
'use strict';
/* shop: магазин Greenwell для покупателя. Сначала телефон, потом ПК.
   Экраны по адресу после #: главная, каталог, товар, поиск, корзина,
   оформление, оплата, рассрочка, заказ, отзыв, кабинет. Состояние демо — в
   браузере (gw-demo-1): заказ и отзыв отсюда видит панель магазина.
   Прокрутку не перехватывает; анимации только transform и opacity. */
var d=document,root=d.documentElement,W=window,G=JSON.parse(d.getElementById('gw-data').textContent);
var L=G.lang,U=G.ui,IMG=G.img,P={},KEY='gw-demo-1',EMBED=/[?&]embed=1/.test(location.search);
G.products.forEach(function(p){P[p.id]=p});
var REDUCED=false;try{REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
if(EMBED)root.classList.add('embed');
var $=function(s,r){return (r||d).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))};
function t(k,v){var s=U[k];if(s==null)return k;if(v)for(var x in v)s=s.split('{'+x+'}').join(v[x]);return s}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function sum(n){return fmt(n)+' '+t('sum')}
function ic(k,c){return '<svg class="ic'+(c?' '+c:'')+'" aria-hidden="true"><use href="#i-'+k+'"/></svg>'}
function plural(n,f){var a=n%10,b=n%100;if(L!=='ru')return f[0];return a===1&&b!==11?f[0]:a>=2&&a<=4&&(b<12||b>14)?f[1]:f[2]}
function off(p){return p.old>p.price?Math.round((1-p.price/p.old)*100):0}
function monthly(price,m,partner){var pr=G.nasiya.filter(function(x){return x.id===(partner||'uzum')})[0];return Math.ceil(price*(1+pr.terms[m]/100)/m/100)*100}
function stars(r,cls){var s='';for(var i=1;i<=5;i++)s+='<i class="'+(r>=i-.25?'on':'')+'"></i>';return '<span class="stars'+(cls?' '+cls:'')+'" aria-label="'+t('rating')+' '+r+'">'+s+'</span>'}

/* ── Состояние ─────────────────────────────────────────────────────────── */
var S;
function load(){try{S=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){S=null}
  if(!S||typeof S!=='object')S={};
  S.cart=S.cart||[];S.fav=S.fav||[];S.orders=S.orders||[];S.addrs=S.addrs||[];S.reviews=S.reviews||[];S.recent=S.recent||[];S.points=S.points||0;S.pts=S.pts||[];S.spent=S.spent||0;}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
load();
addEventListener('storage',function(e){if(e.key===KEY){load();badge();}});

/* ── Иконки корзины и избранного в шапке и нижней панели ──────────────── */
function cartN(){return S.cart.reduce(function(s,c){return s+c.q},0)}
function badge(){var n=cartN();$$('[data-badge="cart"]').forEach(function(b){b.textContent=n;b.hidden=!n});var f=S.fav.length;$$('[data-badge="fav"]').forEach(function(b){b.textContent=f;b.hidden=!f})}

/* ── Тост, шторка ─────────────────────────────────────────────────────── */
var toastT=0;
function toast(msg,act,fn){var el=$('#toast');el.innerHTML='<span>'+msg+'</span>'+(act?'<button type="button">'+act+'</button>':'');el.classList.add('on');
  if(act)$('button',el).onclick=function(){el.classList.remove('on');fn()};clearTimeout(toastT);toastT=setTimeout(function(){el.classList.remove('on')},act?5000:2600)}
var sheetEl,sheetLast=null;
function sheet(title,body,opts){opts=opts||{};sheetLast=d.activeElement;var s=$('#sheet');
  s.innerHTML='<div class="sh-back" data-close></div><div class="sh-box'+(opts.tall?' tall':'')+'" role="dialog" aria-modal="true" aria-label="'+h(title)+'"><div class="sh-grab" aria-hidden="true"></div><div class="sh-head"><b>'+title+'</b><button type="button" class="ib" data-close aria-label="'+t('close')+'">'+ic('x')+'</button></div><div class="sh-body">'+body+'</div>'+(opts.foot?'<div class="sh-foot">'+opts.foot+'</div>':'')+'</div>';
  s.hidden=false;void s.offsetWidth;s.classList.add('on');root.classList.add('locked');
  $$('[data-close]',s).forEach(function(b){b.onclick=closeSheet});
  var grab=$('.sh-box',s),y0=null,dy=0;
  grab.addEventListener('touchstart',function(e){if($('.sh-body',s).scrollTop>0)return;y0=e.touches[0].clientY},{passive:true});
  grab.addEventListener('touchmove',function(e){if(y0==null)return;dy=Math.max(0,e.touches[0].clientY-y0);grab.style.transform='translateY('+dy+'px)'},{passive:true});
  grab.addEventListener('touchend',function(){if(y0==null)return;grab.style.transform='';if(dy>90)closeSheet();y0=null;dy=0});
  setTimeout(function(){var f=$('.sh-body input,.sh-body button,.sh-head button',s);if(f)f.focus({preventScroll:true})},60);
  if(opts.on)opts.on(s);return s}
function closeSheet(){var s=$('#sheet');if(s.hidden)return;s.classList.remove('on');root.classList.remove('locked');setTimeout(function(){s.hidden=true;s.innerHTML=''},REDUCED?0:260);if(sheetLast&&sheetLast.focus)sheetLast.focus({preventScroll:true})}
addEventListener('keydown',function(e){if(e.key==='Escape'){closeSheet();closeSearch()}});

/* ── Корзина ──────────────────────────────────────────────────────────── */
function inCart(id){var c=S.cart.filter(function(x){return x.id===id})[0];return c?c.q:0}
function setQ(id,q){var c=S.cart.filter(function(x){return x.id===id})[0];if(q<=0){S.cart=S.cart.filter(function(x){return x.id!==id})}else if(c)c.q=Math.min(q,10);else S.cart.push({id:id,q:Math.min(q,10)});save();badge();}
function addCart(id,from){setQ(id,inCart(id)+1);fly(from,id);pulse();refreshBuy(id)}
function pulse(){$$('.cart-ic').forEach(function(el){el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump')})}
/* Банка летит в корзину: только transform и opacity. */
function fly(from,id){if(REDUCED||!from)return;var src=from.closest('[data-card]')||from.closest('.pd')||from;var im=$('img',src);var to=$$('.cart-ic').filter(function(e){return e.offsetParent})[0];if(!im||!to)return;
  var a=im.getBoundingClientRect(),b=to.getBoundingClientRect(),c=im.cloneNode();c.className='flyer';c.style.left=a.left+'px';c.style.top=a.top+'px';c.style.width=a.width+'px';c.style.height=a.height+'px';d.body.appendChild(c);
  var dx=b.left+b.width/2-(a.left+a.width/2),dy=b.top+b.height/2-(a.top+a.height/2);
  var an=c.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:'translate('+dx*.5+'px,'+(dy*.5-60)+'px) scale(.55)',opacity:.9},{transform:'translate('+dx+'px,'+dy+'px) scale(.12)',opacity:.2}],{duration:620,easing:'cubic-bezier(.5,0,.3,1)'});an.onfinish=function(){c.remove()}}
function toggleFav(id,btn){var i=S.fav.indexOf(id);if(i<0){S.fav.push(id);toast(t('favAdded'))}else S.fav.splice(i,1);save();badge();$$('[data-fav="'+id+'"]').forEach(function(b){b.classList.toggle('on',S.fav.indexOf(id)>=0);b.setAttribute('aria-pressed',S.fav.indexOf(id)>=0)})}

/* ── Карточка товара ──────────────────────────────────────────────────── */
function card(p,cls){var o=off(p),q=inCart(p.id),fav=S.fav.indexOf(p.id)>=0;
  return '<article class="pc '+(cls||'')+'" data-card="'+p.id+'"><a class="pc-a" href="#/p/'+p.id+'" aria-label="'+h(p.n)+'"></a>'+
  '<div class="pc-im"><img src="'+IMG+'/p-'+p.id+'-s.webp" alt="'+h(p.n)+'" loading="lazy" width="220" height="420">'+(o?'<span class="tag-off">−'+o+'%</span>':'')+
  '<button type="button" class="fav'+(fav?' on':'')+'" data-fav="'+p.id+'" aria-pressed="'+fav+'" aria-label="'+t('toFav')+'">'+ic('heart')+'</button></div>'+
  '<div class="pc-b"><p class="pc-price"><b>'+sum(p.price)+'</b>'+(o?'<s>'+fmt(p.old)+'</s>':'')+'</p><p class="pc-mo">'+t('fromMo',{n:fmt(monthly(p.price,12))})+'</p>'+
  '<h3 class="pc-n">'+h(p.n)+'</h3><p class="pc-s">'+h(p.s)+'</p><p class="pc-r">'+ic('star','st')+'<b>'+String(p.rating).replace('.',',')+'</b><span>'+fmt(p.reviews)+' '+plural(p.reviews,[t('rev1'),t('rev2'),t('rev5')])+'</span></p></div>'+
  '<div class="pc-buy" data-buy="'+p.id+'">'+buyBtn(p.id,q)+'</div></article>'}
function buyBtn(id,q){return q?'<div class="step"><button type="button" data-minus="'+id+'" aria-label="'+t('less')+'">'+ic('minus')+'</button><b>'+q+'</b><button type="button" data-plus="'+id+'" aria-label="'+t('more')+'">'+ic('plus')+'</button></div>':'<button type="button" class="btn btn-add" data-add="'+id+'">'+ic('bag')+'<span>'+t('toCart')+'</span></button>'}
function refreshBuy(id){$$('[data-buy="'+id+'"]').forEach(function(b){b.innerHTML=buyBtn(id,inCart(id))});var bar=$('#pd-bar');if(bar&&bar.getAttribute('data-id')===id)bar.innerHTML=pdBar(P[id]);var pb=$('#pd-buy');if(pb)pb.innerHTML=pdBuy(P[id]);if(route.name==='cart')render()}
function skel(n){var s='';for(var i=0;i<n;i++)s+='<div class="pc sk" aria-hidden="true"><div class="pc-im"></div><div class="pc-b"><i></i><i></i><i class="w6"></i></div></div>';return s}

/* ── Экраны ───────────────────────────────────────────────────────────── */
var V={},view=$('#view'),route={name:'home'};
function go(h){if(location.hash===h)render();else location.hash=h}
function parse(){var hs=location.hash.replace(/^#\/?/,''),q='',i=hs.indexOf('?');if(i>=0){q=hs.slice(i+1);hs=hs.slice(0,i)}var a=hs.split('/');
  var params={};q.split('&').forEach(function(kv){if(!kv)return;var p=kv.split('=');params[decodeURIComponent(p[0])]=decodeURIComponent(p[1]||'')});
  var map={'':'home',c:'catalog',p:'product',cart:'cart',checkout:'checkout',pay:'pay',nasiya:'nasiya',order:'order',orders:'orders',me:'me',fav:'fav',review:'review',plans:'plans',addr:'addrs',search:'catalog',points:'points'};
  return {name:map[a[0]]||'home',arg:a[1]||'',q:params}}
function render(){route=parse();closeSheet();closeSearch();var fn=V[route.name]||V.home;view.classList.remove('in');view.innerHTML=fn(route.arg,route.q)||'';
  $$('.tabbar a,.hd-nav a').forEach(function(a){a.classList.toggle('on',a.getAttribute('data-tab')===tabOf(route.name))});
  scrollTo(0,0);requestAnimationFrame(function(){view.classList.add('in')});if(V[route.name+'_on'])V[route.name+'_on'](route.arg,route.q);badge();
  d.title=(V.title||t('brand'))+' · '+t('brand');V.title='';showTop()}
function tabOf(n){return {home:'home',catalog:'catalog',product:'catalog',cart:'cart',checkout:'cart',pay:'cart',nasiya:'cart',fav:'fav',me:'me',orders:'me',order:'me',review:'me',plans:'me',addrs:'me',points:'me'}[n]||'home'}
addEventListener('hashchange',render);
function sec(title,more,body,cls){return '<section class="sec '+(cls||'')+'"><div class="sec-h"><h2>'+title+'</h2>'+(more||'')+'</div>'+body+'</section>'}
function legal(){return '<footer class="sfoot"><div class="sf-brand"><svg class="logo-w" viewBox="0 0 131 16" aria-label="Greenwell"><use href="#gw-logo"/></svg><p>'+t('tagline')+'</p></div>'+
  '<ul class="sf-c"><li><a href="https://t.me/'+G.brand.tg+'">'+ic('tg')+'<span>@'+G.brand.tg+'</span></a></li><li><a href="https://instagram.com/'+G.brand.ig+'">'+ic('ig')+'<span>@'+G.brand.ig+'</span></a></li><li><a href="'+G.brand.uzum+'">'+ic('bag')+'<span>'+t('onUzum')+'</span></a></li></ul>'+
  '<p class="sf-l">'+h(G.brand.legalNote)+'</p><p class="sf-l">'+h(G.brand.dist)+'</p><p class="sf-l demo">'+t('demoFoot')+' <a href="'+G.terms+'">'+t('terms')+'</a></p></footer>'}

V.home=function(){V.title=t('tagline');
  var hits=G.products.slice().sort(function(a,b){return parseInt(b.orders)-parseInt(a.orders)}).slice(0,8);
  var sale=G.products.filter(function(p){return off(p)>=8}).sort(function(a,b){return off(b)-off(a)});
  var total=G.products.reduce(function(s,p){return s+p.reviews},0);
  var jars=['mgc','om','vc'];
  return '<div class="home">'+
  '<section class="hero"><div class="hero-t"><p class="kick">'+ic('leaf')+t('heroKick')+'</p><h1>'+t('heroH')+'</h1><p>'+h(G.brand.made)+'</p><div class="hero-cta"><a class="btn btn-w" href="#/c/all">'+t('toCatalog')+ic('arrow')+'</a></div></div>'+
  '<div class="hero-j" aria-hidden="true">'+jars.map(function(id,i){return '<img class="j j'+i+'" src="'+IMG+'/p-'+id+'-s.webp" alt="" width="220" height="420">'}).join('')+'</div></section>'+
  '<nav class="goals" aria-label="'+t('cats')+'">'+G.cats.map(function(c){return '<a href="#/c/'+c.id+'" class="goal">'+ic(c.i)+'<span>'+h(c.n)+'</span></a>'}).join('')+'</nav>'+
  '<a class="nas-ban" href="#/c/all?sort=pop"><span class="nb-ic">'+ic('cal')+'</span><span><b>'+t('nasBanH')+'</b><small>'+t('nasBanS')+'</small></span><span class="nb-logos">'+G.nasiya.map(function(n){return '<i style="--c:'+n.c+'">'+h(n.n.split(' ')[0])+'</i>'}).join('')+'</span></a>'+
  sec(t('hits'),'<a class="more" href="#/c/all?sort=pop">'+t('all')+ic('arrow')+'</a>','<div class="rail">'+hits.map(function(p){return card(p,'rl')}).join('')+'</div>')+
  '<section class="trust">'+[['globe',t('tr1h'),t('tr1s')],['star',t('tr2h',{n:'4,9'}),t('tr2s',{n:fmt(total)})],['shield',t('tr3h'),t('tr3s')],['gift',t('tr4h'),t('tr4s',{n:fmt(G.shop.reviewPhotoPts)})]].map(function(x){return '<div class="tr">'+ic(x[0])+'<b>'+x[1]+'</b><small>'+x[2]+'</small></div>'}).join('')+'</section>'+
  sec(t('sale'),'<a class="more" href="#/c/all?sale=1">'+t('all')+ic('arrow')+'</a>','<div class="grid">'+sale.slice(0,4).map(function(p){return card(p)}).join('')+'</div>')+
  '<a class="rev-ban" href="#/me"><span><b>'+t('revBanH',{n:fmt(G.shop.reviewPhotoPts)})+'</b><small>'+t('revBanS')+'</small></span>'+ic('camera')+'</a>'+
  sec(t('allGoods'),'','<div class="grid">'+G.products.map(function(p){return card(p)}).join('')+'</div>')+
  legal()+'</div>'};

V.catalog=function(arg,q){var cat=arg&&arg!=='all'?arg:'',c=G.cats.filter(function(x){return x.id===cat})[0];V.title=c?c.n:t('catalog');
  F.cat=cat?[cat]:F.cat.filter(function(){return false});if(q.sale)F.sale=true;if(q.sort)F.sort=q.sort;F.q=q.q||'';
  return '<div class="cat"><div class="cat-h"><h1>'+(F.q?t('found',{q:h(F.q)}):c?h(c.n):t('catalog'))+'</h1><p class="muted" id="cat-n"></p></div>'+
  '<div class="chips" role="tablist">'+'<a href="#/c/all" class="chip'+(!cat?' on':'')+'">'+t('allCats')+'</a>'+G.cats.map(function(x){return '<a href="#/c/'+x.id+'" class="chip'+(x.id===cat?' on':'')+'">'+ic(x.i)+h(x.n)+'</a>'}).join('')+'</div>'+
  '<div class="tools"><button type="button" class="tool" id="f-open">'+ic('filter')+'<span>'+t('filters')+'</span><i id="f-n" hidden></i></button><button type="button" class="tool" id="s-open">'+ic('sort')+'<span id="s-cur">'+t('sort_'+F.sort)+'</span></button></div>'+
  '<div class="grid" id="cat-grid">'+skel(6)+'</div></div>'};
var F={cat:[],min:'',max:'',sale:false,top:false,form:[],sort:'pop',q:''};
function syn(q){q=q.toLowerCase();var m=G.syn;for(var k in m)if(q.indexOf(k)>=0)return m[k];return null}
function match(p,q){if(!q)return true;var s=(p.n+' '+p.s+' '+p.alt+' '+p.b.join(' ')).toLowerCase();var w=q.toLowerCase().trim();if(s.indexOf(w)>=0)return true;var c=syn(w);return c?c.indexOf(p.cat)>=0||c.indexOf(p.id)>=0:false}
function filtered(){var r=G.products.filter(function(p){
    if(F.cat.length&&F.cat.indexOf(p.cat)<0)return false;if(F.min&&p.price<+F.min)return false;if(F.max&&p.price>+F.max)return false;
    if(F.sale&&!off(p))return false;if(F.top&&p.rating<4.9)return false;if(F.form.length&&F.form.indexOf(p.form)<0)return false;return match(p,F.q)});
  var s={pop:function(a,b){return parseInt(b.orders)-parseInt(a.orders)},cheap:function(a,b){return a.price-b.price},dear:function(a,b){return b.price-a.price},off:function(a,b){return off(b)-off(a)},rate:function(a,b){return b.rating-a.rating||b.reviews-a.reviews}}[F.sort];
  return r.sort(s)}
function fCount(){return (F.min||F.max?1:0)+(F.sale?1:0)+(F.top?1:0)+F.form.length+(route.arg&&route.arg!=='all'?0:F.cat.length)}
function drawGrid(){var g=$('#cat-grid');if(!g)return;var r=filtered();var n=$('#cat-n');if(n)n.textContent=r.length+' '+plural(r.length,[t('good1'),t('good2'),t('good5')]);
  var fn=$('#f-n');if(fn){var c=fCount();fn.hidden=!c;fn.textContent=c}var sc=$('#s-cur');if(sc)sc.textContent=t('sort_'+F.sort);
  g.innerHTML=r.length?r.map(function(p){return card(p)}).join(''):'<div class="empty">'+ic('search','big')+'<b>'+t('noneH')+'</b><p>'+t('noneS')+'</p><button type="button" class="btn btn-g" id="f-reset">'+t('reset')+'</button></div>';
  var rs=$('#f-reset');if(rs)rs.onclick=function(){resetF();drawGrid()}}
function resetF(){F.min='';F.max='';F.sale=false;F.top=false;F.form=[];F.q='';if(!(route.arg&&route.arg!=='all'))F.cat=[]}
V.catalog_on=function(){setTimeout(drawGrid,REDUCED?0:380);
  $('#f-open').onclick=filterSheet;$('#s-open').onclick=function(){sheet(t('sortBy'),['pop','cheap','dear','off','rate'].map(function(k){return '<label class="opt"><input type="radio" name="srt" value="'+k+'"'+(F.sort===k?' checked':'')+'><span>'+t('sort_'+k)+'</span>'+ic('check','ok')+'</label>'}).join(''),{on:function(s){$$('input',s).forEach(function(i){i.onchange=function(){F.sort=i.value;closeSheet();drawGrid()}})}})}};
function filterSheet(){var locked=route.arg&&route.arg!=='all';
  var body=(locked?'':'<fieldset><legend>'+t('cats')+'</legend><div class="fchips">'+G.cats.map(function(c){return '<label class="fchip"><input type="checkbox" name="fc" value="'+c.id+'"'+(F.cat.indexOf(c.id)>=0?' checked':'')+'><span>'+h(c.n)+'</span></label>'}).join('')+'</div></fieldset>')+
  '<fieldset><legend>'+t('price')+'</legend><div class="range"><label><small>'+t('from')+'</small><input type="number" inputmode="numeric" id="f-min" placeholder="150 000" value="'+h(F.min)+'"></label><label><small>'+t('to')+'</small><input type="number" inputmode="numeric" id="f-max" placeholder="350 000" value="'+h(F.max)+'"></label></div>'+
  '<div class="fchips">'+[[0,200000],[200000,280000],[280000,0]].map(function(r){return '<button type="button" class="fchip pr" data-r="'+r[0]+','+r[1]+'">'+(r[0]?(r[1]?fmt(r[0]/1000)+'-'+fmt(r[1]/1000)+t('k'):t('fromK',{n:fmt(r[0]/1000)})):t('toK',{n:fmt(r[1]/1000)}))+'</button>'}).join('')+'</div></fieldset>'+
  '<fieldset><legend>'+t('form')+'</legend><div class="fchips">'+['caps','tab','soft'].map(function(f){return '<label class="fchip"><input type="checkbox" name="ff" value="'+f+'"'+(F.form.indexOf(f)>=0?' checked':'')+'><span>'+t('form_'+f)+'</span></label>'}).join('')+'</div></fieldset>'+
  '<label class="sw-row"><span>'+t('onlySale')+'</span><input type="checkbox" id="f-sale" class="sw"'+(F.sale?' checked':'')+'></label>'+
  '<label class="sw-row"><span>'+t('topRated')+'</span><input type="checkbox" id="f-top" class="sw"'+(F.top?' checked':'')+'></label>';
  sheet(t('filters'),body,{tall:true,foot:'<button type="button" class="btn btn-ghost" id="f-clear">'+t('reset')+'</button><button type="button" class="btn btn-g" id="f-go"></button>',on:function(s){
    function read(){F.cat=locked?F.cat:$$('input[name=fc]:checked',s).map(function(i){return i.value});F.form=$$('input[name=ff]:checked',s).map(function(i){return i.value});F.min=$('#f-min',s).value;F.max=$('#f-max',s).value;F.sale=$('#f-sale',s).checked;F.top=$('#f-top',s).checked;
      var n=filtered().length;$('#f-go',s).textContent=n?t('showN',{n:n}):t('noneH');$('#f-go',s).disabled=!n}
    $$('input',s).forEach(function(i){i.addEventListener('input',read);i.addEventListener('change',read)});
    $$('.pr',s).forEach(function(b){b.onclick=function(){var r=b.getAttribute('data-r').split(',');$('#f-min',s).value=+r[0]||'';$('#f-max',s).value=+r[1]||'';read()}});
    $('#f-clear',s).onclick=function(){resetF();closeSheet();drawGrid()};$('#f-go',s).onclick=function(){closeSheet();drawGrid()};read()}})}

/* Товар: свайп-галерея, цена и рассрочка, состав, отзывы, «с этим покупают». */
V.product=function(id){var p=P[id];if(!p)return V.home();V.title=p.n;S.recent=[id].concat(S.recent.filter(function(x){return x!==id})).slice(0,8);save();
  var o=off(p),imgs=['p-'+p.id+'.webp'];for(var i=0;i<p.g;i++)imgs.push('g-'+p.id+'-'+i+'.webp');
  var mine=S.reviews.filter(function(r){return r.id===id});
  var cat=G.cats.filter(function(c){return c.id===p.cat})[0];
  return '<div class="pd" data-id="'+id+'"><nav class="crumbs" aria-label="'+t('path')+'"><a href="#/">'+t('home')+'</a>'+ic('chev')+'<a href="#/c/'+p.cat+'">'+h(cat.n)+'</a></nav>'+
  '<div class="pd-grid"><div class="pd-gal"><div class="gal" id="gal" tabindex="0" aria-label="'+t('photos')+'">'+imgs.map(function(s,i){return '<figure class="gal-i'+(i===0?' front':'')+'"><img src="'+IMG+'/'+s+'" alt="'+h(p.n)+' · '+(i+1)+'"'+(i?' loading="lazy"':'')+'></figure>'}).join('')+'</div>'+
  '<div class="gal-dots" aria-hidden="true">'+imgs.map(function(s,i){return '<i'+(i?'':' class="on"')+'></i>'}).join('')+'</div>'+
  '<div class="gal-th">'+imgs.map(function(s,i){return '<button type="button" data-g="'+i+'"'+(i?'':' class="on"')+' aria-label="'+t('photo')+' '+(i+1)+'"><img src="'+IMG+'/'+s+'" alt="" loading="lazy"></button>'}).join('')+'</div>'+
  (o?'<span class="tag-off big">−'+o+'%</span>':'')+'<button type="button" class="fav big'+(S.fav.indexOf(id)>=0?' on':'')+'" data-fav="'+id+'" aria-pressed="'+(S.fav.indexOf(id)>=0)+'" aria-label="'+t('toFav')+'">'+ic('heart')+'</button></div>'+
  '<div class="pd-info"><h1>'+h(p.n)+'</h1><p class="pd-s">'+h(p.s)+', '+p.count+' '+t('unit_'+p.form)+'</p>'+
  '<a class="pd-r" href="#pd-rev">'+stars(p.rating)+'<b>'+String(p.rating).replace('.',',')+'</b><span>'+fmt(p.reviews)+' '+plural(p.reviews,[t('rev1'),t('rev2'),t('rev5')])+'</span><span class="dotsep">'+p.orders+' '+t('ordersW')+'</span></a>'+
  '<div class="pd-price"><b>'+sum(p.price)+'</b>'+(o?'<s>'+sum(p.old)+'</s><span class="tag-off">−'+o+'%</span>':'')+'</div>'+
  '<button type="button" class="pd-mo" id="pd-mo">'+ic('cal')+'<span><b>'+t('fromMo',{n:fmt(monthly(p.price,12))})+'</b><small>'+t('nasLine')+'</small></span>'+ic('chev')+'</button>'+
  '<div id="pd-buy" class="pd-buy">'+pdBuy(p)+'</div>'+
  '<ul class="pd-del"><li>'+ic('truck')+'<span><b>'+t('delTomorrow')+'</b><small>'+t('delTerms',{n:fmt(G.shop.freeFrom)})+'</small></span></li><li>'+ic('box')+'<span><b>'+t('inStock')+'</b><small>'+t('course',{n:p.count})+'</small></span></li><li>'+ic('gift')+'<span><b>'+t('ptsFor',{n:fmt(Math.round(p.price*G.shop.pointsRate))})+'</b><small>'+t('ptsForS')+'</small></span></li></ul>'+
  '<h2 class="pd-h">'+t('helps')+'</h2><ul class="pd-b">'+p.b.map(function(b){return '<li>'+ic('check')+'<span>'+h(b)+'</span></li>'}).join('')+'</ul>'+
  (p.tags&&p.tags.length?'<p class="pd-tags">'+p.tags.map(function(x){return '<span>'+t('tag_'+x)+'</span>'}).join('')+'</p>':'')+
  '<div class="tabs" role="tablist"><button type="button" role="tab" aria-selected="true" data-t="comp">'+t('compH')+'</button>'+(p.c?'<button type="button" role="tab" aria-selected="false" data-t="cert">'+t('certH')+'</button>':'')+'<button type="button" role="tab" aria-selected="false" data-t="made">'+t('madeH')+'</button></div>'+
  '<div class="tab-p" data-p="comp">'+(p.comp?'<p>'+h(p.comp)+'</p>'+(p.how?'<h3>'+t('howH')+'</h3><p>'+h(p.how)+'</p>':''):'<p>'+t('compLabel')+'</p>')+'<figure class="label"><img src="'+IMG+'/g-'+p.id+'-'+p.back+'.webp" alt="'+t('labelAlt')+'" loading="lazy"></figure></div>'+
  (p.c?'<div class="tab-p" data-p="cert" hidden><p>'+t('certS')+'</p><figure class="label"><img src="'+IMG+'/c-'+p.id+'.webp" alt="'+t('certH')+'" loading="lazy"></figure></div>':'')+
  '<div class="tab-p" data-p="made" hidden><p>'+h(G.brand.made)+'.</p><p>'+h(G.brand.dist)+'.</p><p class="muted">'+h(G.brand.legalNote)+'</p></div>'+
  '</div></div>'+
  '<section class="sec" id="pd-rev"><div class="sec-h"><h2>'+t('reviews')+'</h2></div><div class="rv-top"><div class="rv-avg"><b>'+String(p.rating).replace('.',',')+'</b>'+stars(p.rating)+'<small>'+t('revOnUzum',{n:fmt(p.reviews)})+'</small></div><button type="button" class="btn btn-ghost" id="rv-write">'+ic('pen')+t('writeRev')+'</button></div>'+
  '<div class="rv-list">'+mine.map(function(r){return revItem({a:r.name||t('you'),d:r.date,r:r.stars,t:r.text,photo:r.photo,mod:r.status!=='ok',reply:r.reply})}).join('')+p.rev.map(revItem).join('')+'</div></section>'+
  sec(t('withThis'),'','<div class="rail">'+(G.pairs[id]||[]).map(function(x){return card(P[x],'rl')}).join('')+'</div><button type="button" class="btn btn-ghost wide" id="pair-all">'+ic('bag')+t('pairAll',{n:sum([id].concat(G.pairs[id]).reduce(function(s,x){return s+P[x].price},0))})+'</button>')+
  '<div class="pd-bar" id="pd-bar" data-id="'+id+'">'+pdBar(p)+'</div></div>'};
function pdBuy(p){var q=inCart(p.id);return q?'<div class="step big"><button type="button" data-minus="'+p.id+'" aria-label="'+t('less')+'">'+ic('minus')+'</button><b>'+q+'</b><button type="button" data-plus="'+p.id+'" aria-label="'+t('more')+'">'+ic('plus')+'</button></div><a class="btn btn-g" href="#/cart">'+t('goCart')+ic('arrow')+'</a>':'<button type="button" class="btn btn-g big" data-add="'+p.id+'">'+ic('bag')+t('toCart')+'</button><button type="button" class="btn btn-ghost" data-one="'+p.id+'">'+t('buyNow')+'</button>'}
function pdBar(p){var q=inCart(p.id);return '<div class="pb-p"><b>'+sum(p.price)+'</b><small>'+t('fromMo',{n:fmt(monthly(p.price,12))})+'</small></div>'+(q?'<a class="btn btn-g" href="#/cart">'+t('inCartN',{n:q})+ic('arrow')+'</a>':'<button type="button" class="btn btn-g" data-add="'+p.id+'">'+ic('bag')+t('toCart')+'</button>')}
function revItem(r){return '<article class="rv'+(r.mod?' mod':'')+'"><header><span class="av" aria-hidden="true">'+h((r.a||'?').replace(/[^A-Za-zА-Яа-яЁё]/g,'').charAt(0).toUpperCase()||'G')+'</span><span><b>'+h(r.a)+'</b><small>'+h(r.d)+(r.mod?' · '+t('onMod'):'')+'</small></span>'+stars(r.r,'sm')+'</header><p>'+h(r.t)+'</p>'+(r.photo?'<img class="rv-ph" src="'+r.photo+'" alt="'+t('revPhoto')+'">':'')+(r.reply?'<p class="rv-reply"><b>Greenwell</b>'+h(r.reply)+'</p>':'')+'</article>'}
V.product_on=function(id){var p=P[id];if(!p)return;var g=$('#gal'),dots=$$('.gal-dots i'),th=$$('.gal-th button');
  function cur(){var i=Math.round(g.scrollLeft/g.clientWidth);dots.forEach(function(x,k){x.classList.toggle('on',k===i)});th.forEach(function(x,k){x.classList.toggle('on',k===i)})}
  g.addEventListener('scroll',function(){requestAnimationFrame(cur)},{passive:true});
  th.forEach(function(b){b.onclick=function(){g.scrollTo({left:+b.getAttribute('data-g')*g.clientWidth,behavior:REDUCED?'auto':'smooth'})}});
  g.addEventListener('keydown',function(e){if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();g.scrollBy({left:(e.key==='ArrowRight'?1:-1)*g.clientWidth,behavior:'smooth'})}});
  $$('.tabs button').forEach(function(b){b.onclick=function(){$$('.tabs button').forEach(function(x){x.setAttribute('aria-selected',x===b)});$$('.tab-p').forEach(function(x){x.hidden=x.getAttribute('data-p')!==b.getAttribute('data-t')})}});
  $('#pd-mo').onclick=function(){nasCalc(p.price)};
  $('#rv-write').onclick=function(){var o=S.orders.filter(function(o){return o.st>=3&&o.items.some(function(i){return i.id===id})})[0];if(o)go('#/review/'+o.no);else toast(t('revAfter',{n:fmt(G.shop.reviewPhotoPts)}))};
  $('#pair-all').onclick=function(e){[id].concat(G.pairs[id]).forEach(function(x){if(!inCart(x))setQ(x,1);refreshBuy(x)});pulse();toast(t('pairAdded'),t('goCart'),function(){go('#/cart')})};
  /* Липкая кнопка появляется, когда своя кнопка «В корзину» ушла с экрана. */
  var bar=$('#pd-bar'),buy=$('#pd-buy');if('IntersectionObserver' in W&&bar&&buy)new IntersectionObserver(function(es){bar.classList.toggle('on',!es[0].isIntersecting&&es[0].boundingClientRect.top<0)}).observe(buy);
};
function nasCalc(price){var m=12,pr='uzum';
  function body(){return '<p class="muted">'+t('nasCalcS')+'</p><div class="seg" role="radiogroup">'+[3,6,12].map(function(k){return '<button type="button" role="radio" aria-checked="'+(k===m)+'" data-m="'+k+'">'+k+' '+t('mo')+'</button>'}).join('')+'</div>'+
    G.nasiya.map(function(n){var mo=monthly(price,m,n.id),tot=mo*m;return '<label class="nas-o"><input type="radio" name="np" value="'+n.id+'"'+(n.id===pr?' checked':'')+'><span class="nl" style="--c:'+n.c+'">'+h(n.n)+'</span><span class="nm"><b>'+sum(mo)+'</b><small>'+t('perMo')+'</small></span><span class="nt"><small>'+(n.terms[m]?t('overpay',{n:fmt(tot-price)}):t('noOver'))+'</small></span></label>'}).join('')+'<p class="fine">'+t('nasFine')+'</p>'}
  sheet(t('nasH'),'<div id="nc">'+body()+'</div>',{on:function(s){function bind(){$$('[data-m]',s).forEach(function(b){b.onclick=function(){m=+b.getAttribute('data-m');$('#nc',s).innerHTML=body();bind()}});$$('input[name=np]',s).forEach(function(i){i.onchange=function(){pr=i.value}})}bind()}})}

/* Поиск с подсказками: шторка сверху, сразу с клавиатурой. */
var srch=null;
function openSearch(){srch=$('#search');srch.hidden=false;void srch.offsetWidth;srch.classList.add('on');root.classList.add('locked');var i=$('#sq');i.value='';sugg('');i.focus()}
function closeSearch(){if(!srch||srch.hidden)return;srch.classList.remove('on');root.classList.remove('locked');var s=srch;setTimeout(function(){s.hidden=true},REDUCED?0:200)}
function sugg(q){var box=$('#sq-res');q=q.trim();
  if(!q){box.innerHTML=(S.recent.length?'<p class="sq-k">'+t('recent')+'</p><div class="sq-recent">'+S.recent.slice(0,6).map(function(id){return '<a href="#/p/'+id+'"><img src="'+IMG+'/p-'+id+'-s.webp" alt="" width="48" height="92"><span>'+h(P[id].n)+'</span></a>'}).join('')+'</div>':'')+'<p class="sq-k">'+t('popular')+'</p><div class="fchips">'+G.popular.map(function(w){return '<button type="button" class="fchip" data-q="'+h(w)+'">'+h(w)+'</button>'}).join('')+'</div>';}
  else{var r=G.products.filter(function(p){return match(p,q)}).slice(0,6),cs=G.cats.filter(function(c){return c.n.toLowerCase().indexOf(q.toLowerCase())>=0||(syn(q)||[]).indexOf(c.id)>=0});
    box.innerHTML=(cs.length?cs.map(function(c){return '<a class="sq-cat" href="#/c/'+c.id+'">'+ic(c.i)+'<span>'+hl(c.n,q)+'</span><small>'+t('category')+'</small></a>'}).join(''):'')+
    (r.length?r.map(function(p){return '<a class="sq-p" href="#/p/'+p.id+'"><img src="'+IMG+'/p-'+p.id+'-s.webp" alt="" width="40" height="76"><span><b>'+hl(p.n,q)+'</b><small>'+h(p.s)+'</small></span><em>'+sum(p.price)+'</em></a>'}).join('')+'<a class="sq-all" href="#/search?q='+encodeURIComponent(q)+'">'+t('allResults',{q:h(q)})+ic('arrow')+'</a>':'<div class="empty sm">'+ic('search','big')+'<b>'+t('noneH')+'</b><p>'+t('trySyn')+'</p></div>')}
  $$('[data-q]',box).forEach(function(b){b.onclick=function(){$('#sq').value=b.getAttribute('data-q');sugg(b.getAttribute('data-q'))}})}
function hl(s,q){var i=s.toLowerCase().indexOf(q.toLowerCase());return i<0?h(s):h(s.slice(0,i))+'<mark>'+h(s.slice(i,i+q.length))+'</mark>'+h(s.slice(i+q.length))}

/* Корзина: промокод, баллы, итог. */
var C={promo:'',usePts:false};
function totals(){var goods=0,old=0;S.cart.forEach(function(c){var p=P[c.id];goods+=p.price*c.q;old+=p.old*c.q});var promo=C.promo?Math.round(goods*G.shop.promo[C.promo]/100):0;
  var after=goods-promo,ptsMax=S.user?Math.min(S.points,Math.floor(after*G.shop.pointsMaxShare/1000)*1000):0,pts=C.usePts?ptsMax:0;var deliv=C.pickup||after>=G.shop.freeFrom||!goods?0:G.shop.delivery;
  return {goods:goods,disc:old-goods,promo:promo,pts:pts,ptsMax:ptsMax,deliv:deliv,total:Math.max(0,after-pts+deliv),earn:Math.round((after-pts)*levelOf().k/100)}}
function levelOf(){var lv=G.shop.levels,x=lv[0];lv.forEach(function(l){if(S.spent>=l.from)x=l});return x}
V.cart=function(){V.title=t('cart');if(!S.cart.length)return '<div class="pg"><h1>'+t('cart')+'</h1><div class="empty">'+ic('bag','big')+'<b>'+t('cartEmpty')+'</b><p>'+t('cartEmptyS')+'</p><a class="btn btn-g" href="#/c/all">'+t('toCatalog')+'</a></div>'+(S.fav.length?sec(t('fromFav'),'','<div class="rail">'+S.fav.map(function(id){return card(P[id],'rl')}).join('')+'</div>'):'')+'</div>';
  var T=totals(),need=G.shop.freeFrom-(T.goods-T.promo);
  var also=[];S.cart.forEach(function(c){(G.pairs[c.id]||[]).forEach(function(x){if(!inCart(x)&&also.indexOf(x)<0)also.push(x)})});
  return '<div class="pg two"><div class="pg-main"><h1>'+t('cart')+' <small>'+cartN()+'</small></h1>'+
  '<div class="ship-bar'+(need<=0?' done':'')+'"><p>'+(need>0?t('toFree',{n:sum(need)}):t('freeOk'))+'</p><i style="--k:'+Math.min(1,(T.goods-T.promo)/G.shop.freeFrom).toFixed(3)+'"></i></div>'+
  '<ul class="cl">'+S.cart.map(function(c){var p=P[c.id];return '<li class="ci" data-card="'+p.id+'"><a href="#/p/'+p.id+'" class="ci-im"><img src="'+IMG+'/p-'+p.id+'-s.webp" alt="" width="64" height="122"></a><div class="ci-b"><a href="#/p/'+p.id+'"><b>'+h(p.n)+'</b></a><small>'+p.count+' '+t('unit_'+p.form)+'</small><p class="ci-p"><b>'+sum(p.price*c.q)+'</b>'+(off(p)?'<s>'+sum(p.old*c.q)+'</s>':'')+'</p></div><div class="ci-a"><div data-buy="'+p.id+'">'+buyBtn(p.id,c.q)+'</div><button type="button" class="lnk" data-del="'+p.id+'">'+t('remove')+'</button></div></li>'}).join('')+'</ul>'+
  (also.length?sec(t('withThis'),'','<div class="rail">'+also.slice(0,6).map(function(x){return card(P[x],'rl')}).join('')+'</div>'):'')+'</div>'+
  '<aside class="pg-side"><div class="box"><form class="promo" id="promo"><label for="pc-in">'+t('promo')+'</label><div class="row"><input id="pc-in" autocomplete="off" placeholder="GREEN10" value="'+h(C.promo)+'"'+(C.promo?' disabled':'')+'>'+(C.promo?'<button type="button" class="btn btn-ghost" id="pc-x">'+t('cancel')+'</button>':'<button class="btn btn-ghost">'+t('apply')+'</button>')+'</div><p class="err" id="pc-err" hidden></p><p class="hint">'+(C.promo?'<span class="ok">'+t('promoOk',{c:h(C.promo),n:G.shop.promo[C.promo]})+'</span>':t('promoHint'))+'</p></form>'+
  (S.user?'<label class="sw-row pts"><span>'+ic('gift')+'<span><b>'+t('usePts',{n:fmt(T.ptsMax)})+'</b><small>'+t('ptsBal',{n:fmt(S.points)})+'</small></span></span><input type="checkbox" class="sw" id="use-pts"'+(C.usePts?' checked':'')+(T.ptsMax?'':' disabled')+'></label>':'<a class="sw-row pts" href="#/me">'+ic('gift')+'<span><b>'+t('ptsLogin')+'</b><small>'+t('ptsLoginS',{n:fmt(G.shop.welcome)})+'</small></span>'+ic('chev')+'</a>')+
  sumBox(T)+'<a class="btn btn-g big wide" href="#/checkout">'+t('checkout')+ic('arrow')+'</a><p class="hint c">'+t('orMo',{n:fmt(monthly(T.total,12))})+'</p></div></aside>'+
  '<div class="pd-bar on cart-bar"><div class="pb-p"><b>'+sum(T.total)+'</b><small>'+cartN()+' '+plural(cartN(),[t('good1'),t('good2'),t('good5')])+'</small></div><a class="btn btn-g" href="#/checkout">'+t('checkout')+'</a></div></div>'};
function sumBox(T){return '<dl class="sum"><div><dt>'+t('goods')+'</dt><dd>'+sum(T.goods+T.disc)+'</dd></div>'+(T.disc?'<div class="g"><dt>'+t('discount')+'</dt><dd>−'+sum(T.disc)+'</dd></div>':'')+(T.promo?'<div class="g"><dt>'+t('promoW')+' '+h(C.promo)+'</dt><dd>−'+sum(T.promo)+'</dd></div>':'')+(T.pts?'<div class="g"><dt>'+t('ptsW')+'</dt><dd>−'+sum(T.pts)+'</dd></div>':'')+'<div><dt>'+t('delivery')+'</dt><dd>'+(T.deliv?sum(T.deliv):'<span class="g">'+t('free')+'</span>')+'</dd></div><div class="tot"><dt>'+t('total')+'</dt><dd>'+sum(T.total)+'</dd></div></dl><p class="earn">'+ic('gift')+t('earn',{n:fmt(T.earn)})+'</p>'}
V.cart_on=function(){var f=$('#promo');if(!f)return;
  f.onsubmit=function(e){e.preventDefault();var v=$('#pc-in').value.trim().toUpperCase(),er=$('#pc-err');if(!v){er.hidden=false;er.textContent=t('promoEmpty');return}if(!G.shop.promo[v]){er.hidden=false;er.textContent=t('promoBad');$('#pc-in').classList.add('bad');return}C.promo=v;render();toast(t('promoOk',{c:v,n:G.shop.promo[v]}))};
  var x=$('#pc-x');if(x)x.onclick=function(){C.promo='';render()};
  var u=$('#use-pts');if(u)u.onchange=function(){C.usePts=u.checked;render()};
  $$('[data-del]').forEach(function(b){b.onclick=function(){var id=b.getAttribute('data-del'),q=inCart(id);setQ(id,0);render();toast(t('removed',{n:h(P[id].n)}),t('undo'),function(){setQ(id,q);render()})}})};

/* Вход по номеру телефона с кодом из SMS (демо: код 1234). */
function phoneMask(v){var x=v.replace(/\D/g,'').replace(/^998/,'').slice(0,9);var p=[x.slice(0,2),x.slice(2,5),x.slice(5,7),x.slice(7,9)].filter(Boolean);return p.length?'('+p[0]+(p[0].length===2?') ':'')+p.slice(1).join(' '):''}
function login(box,done){
  box.innerHTML='<div class="otp"><label for="ph">'+t('phone')+'</label><div class="ph-row"><span>+998</span><input id="ph" inputmode="tel" autocomplete="tel-national" placeholder="(90) 123 45 67"></div><p class="err" id="ph-err" hidden></p><button type="button" class="btn btn-g wide" id="ph-go">'+t('getCode')+'</button><p class="hint">'+t('codeHint')+'</p></div>';
  var ph=$('#ph',box);ph.oninput=function(){ph.value=phoneMask(ph.value)};
  $('#ph-go',box).onclick=function(){var n=ph.value.replace(/\D/g,'');if(n.length!==9){$('#ph-err',box).hidden=false;$('#ph-err',box).textContent=t('phoneBad');ph.classList.add('bad');ph.focus();return}
    box.innerHTML='<div class="otp"><p>'+t('codeSent',{n:'+998 '+phoneMask(n)})+'</p><div class="code" id="code">'+[0,1,2,3].map(function(i){return '<input inputmode="numeric" maxlength="1" aria-label="'+t('digit')+' '+(i+1)+'" autocomplete="'+(i?'off':'one-time-code')+'">'}).join('')+'</div><p class="err" id="cd-err" hidden></p><p class="hint">'+t('demoCode')+'</p><button type="button" class="lnk" id="cd-back">'+t('otherPhone')+'</button></div>';
    toast(t('smsToast'));var ins=$$('#code input',box);ins[0].focus();
    ins.forEach(function(inp,i){inp.oninput=function(){inp.value=inp.value.replace(/\D/g,'').slice(-1);if(inp.value&&ins[i+1])ins[i+1].focus();var v=ins.map(function(x){return x.value}).join('');if(v.length===4){if(v==='1234'){var fresh=!S.user;S.user={phone:'+998 '+phoneMask(n),name:S.user&&S.user.name||''};if(fresh&&!S.welcomed){S.points+=G.shop.welcome;S.pts.unshift({d:today(),n:G.shop.welcome,w:'welcome'});S.welcomed=1}save();done()}else{$('#cd-err',box).hidden=false;$('#cd-err',box).textContent=t('codeBad');ins.forEach(function(x){x.value='';x.classList.add('bad')});ins[0].focus()}}};
      inp.onkeydown=function(e){if(e.key==='Backspace'&&!inp.value&&ins[i-1])ins[i-1].focus()}});
    $('#cd-back',box).onclick=function(){login(box,done)}}}
function today(){var x=new Date();return pad(x.getDate())+'.'+pad(x.getMonth()+1)}
function pad(n){return (n<10?'0':'')+n}

/* Карта: рисунок города кодом, город двигается под булавкой, как в такси. */
var STREETS=G.streets;
function mapSvg(cls,route){return '<div class="map '+(cls||'')+'"><div class="map-in"><svg viewBox="0 0 900 900" aria-hidden="true"><use href="#gw-city"/>'+(route?'<path class="route" d="M160 720 L160 520 L420 520 L420 330 L640 330"/><circle class="cour" r="12" cx="0" cy="0"/>':'')+'</svg></div>'+(route?'':'<span class="pin" aria-hidden="true">'+ic('pin')+'<i></i></span>')+'</div>'}
function mapPick(box,cb){var m=$('.map',box),inner=$('.map-in',m),x=-200,y=-200,sx,sy,ox,oy,drag=false;
  function place(){inner.style.transform='translate('+x+'px,'+y+'px)'}
  function addr(){var cx=-x+m.clientWidth/2,cy=-y+m.clientHeight/2;var k=Math.min(STREETS.length-1,Math.max(0,Math.floor((cx/900)*3)+3*Math.min(2,Math.max(0,Math.floor((cy/900)*3)))));var s=STREETS[k];cb(s.n+', '+(10+Math.round((cx+cy)%60)),s.d)}
  place();addr();
  m.addEventListener('pointerdown',function(e){drag=true;sx=e.clientX;sy=e.clientY;ox=x;oy=y;m.setPointerCapture(e.pointerId);m.classList.add('drag')});
  m.addEventListener('pointermove',function(e){if(!drag)return;x=Math.min(0,Math.max(m.clientWidth-900,ox+e.clientX-sx));y=Math.min(0,Math.max(m.clientHeight-900,oy+e.clientY-sy));place()});
  m.addEventListener('pointerup',function(){if(!drag)return;drag=false;m.classList.remove('drag');addr()});
  return function(nx,ny){x=nx;y=ny;place();addr()}}

/* Оформление в один экран. */
var O={step:0};
V.checkout=function(){V.title=t('checkoutH');if(!S.cart.length){return V.cart()}
  var T=totals(),slots=[['10:00-14:00',0],['14:00-18:00',1],['18:00-22:00',0]],days=[t('today'),t('tomorrow'),t('after2')];
  if(O.day==null){O.day=1;O.slot=0;O.recv=O.recv||'courier';O.pay=O.pay||'click'}
  return '<div class="pg two co"><div class="pg-main"><h1>'+t('checkoutH')+'</h1>'+
  '<section class="co-s" id="co-who"><h2><i>1</i>'+t('coWho')+'</h2><div id="who"></div></section>'+
  '<section class="co-s" id="co-recv"><h2><i>2</i>'+t('coRecv')+'</h2><div class="seg" role="radiogroup"><button type="button" role="radio" aria-checked="'+(O.recv==='courier')+'" data-recv="courier">'+ic('truck')+t('courier')+'</button><button type="button" role="radio" aria-checked="'+(O.recv==='pickup')+'" data-recv="pickup">'+ic('box')+t('pickup')+'</button></div><div id="recv"></div></section>'+
  '<section class="co-s" id="co-when"><h2><i>3</i>'+t('coWhen')+'</h2><div class="days">'+days.map(function(x,i){var dt=new Date(Date.now()+i*864e5);return '<button type="button" data-day="'+i+'" class="day'+(O.day===i?' on':'')+'"><b>'+x+'</b><small>'+pad(dt.getDate())+'.'+pad(dt.getMonth()+1)+'</small></button>'}).join('')+'</div><div class="slots">'+slots.map(function(s,i){var busy=O.day===0&&i<2;return '<button type="button" data-slot="'+i+'" class="slot'+(O.slot===i&&!busy?' on':'')+'"'+(busy?' disabled':'')+'>'+s[0]+(busy?'<small>'+t('busy')+'</small>':'')+'</button>'}).join('')+'</div></section>'+
  '<section class="co-s" id="co-pay"><h2><i>4</i>'+t('coPay')+'</h2><div class="pays">'+G.pays.map(function(p){return '<label class="pay'+(O.pay===p.id?' on':'')+'"><input type="radio" name="pay" value="'+p.id+'"'+(O.pay===p.id?' checked':'')+'><span class="pl pl-'+p.id+'">'+payLogo(p.id)+'</span><span class="pn"><b>'+h(p.n)+'</b><small>'+(p.id==='nasiya'?t('fromMo',{n:fmt(monthly(T.total,12))}):p.id==='cash'?t('cashS'):t('cardS'))+'</small></span>'+ic('check','ok')+'</label>'}).join('')+'</div></section>'+
  '</div><aside class="pg-side"><div class="box"><h2>'+t('yourOrder')+'</h2><ul class="mini">'+S.cart.map(function(c){var p=P[c.id];return '<li><img src="'+IMG+'/p-'+p.id+'-s.webp" alt="" width="32" height="61"><span>'+h(p.n)+' <small>× '+c.q+'</small></span><b>'+sum(p.price*c.q)+'</b></li>'}).join('')+'</ul>'+sumBox(T)+
  '<p class="err" id="co-err" hidden></p><button type="button" class="btn btn-g big wide" id="co-go">'+payLabel(T)+'</button><p class="fine">'+t('agree')+' <a href="'+G.terms+'">'+t('rules')+'</a></p></div></aside>'+
  '<div class="pd-bar on cart-bar"><div class="pb-p"><b>'+sum(T.total)+'</b><small>'+t('total')+'</small></div><button type="button" class="btn btn-g" id="co-go2">'+payLabel(T)+'</button></div></div>'};
function payLogo(id){return {click:'<b>click</b>',payme:'<b>pay<i>me</i></b>',uzumbank:'<b>uzum</b>',card:ic('card'),cash:ic('cash'),nasiya:ic('cal')}[id]}
function payLabel(T){return O.pay==='nasiya'?t('goNasiya'):O.pay==='cash'?t('placeOrder'):t('payN',{n:sum(T.total)})}
V.checkout_on=function(){if(!S.cart.length)return V.cart_on();
  var who=$('#who');function drawWho(){if(S.user){who.innerHTML='<div class="who-ok">'+ic('check')+'<span><b>'+h(S.user.phone)+'</b><small>'+t('verified')+'</small></span><button type="button" class="lnk" id="who-x">'+t('change')+'</button></div><label class="fld"><span>'+t('name')+'</span><input id="nm" autocomplete="name" value="'+h(S.user.name||'')+'" placeholder="'+t('namePh')+'"></label>';$('#who-x').onclick=function(){S.user=null;save();drawWho()};$('#nm').oninput=function(){S.user.name=this.value;save()}}else login(who,function(){drawWho();render()})}
  drawWho();
  var rv=$('#recv');function drawRecv(){if(O.recv==='pickup'){C.pickup=true;rv.innerHTML='<div class="pts-list">'+G.pickups.map(function(p,i){return '<label class="pay'+((O.pk||0)===i?' on':'')+'"><input type="radio" name="pk" value="'+i+'"'+((O.pk||0)===i?' checked':'')+'>'+ic('pin')+'<span class="pn"><b>'+h(p.n)+'</b><small>'+h(p.a)+' · '+h(p.h)+'</small></span>'+ic('check','ok')+'</label>'}).join('')+'</div><p class="hint">'+t('pickupDemo')+'</p>';$$('input[name=pk]',rv).forEach(function(i){i.onchange=function(){O.pk=+i.value;drawRecv()}});return}
    C.pickup=false;var a=O.addr||S.addrs[0]||{};
    rv.innerHTML=(S.addrs.length?'<div class="fchips saved">'+S.addrs.map(function(x,i){return '<button type="button" class="fchip'+(O.addr&&O.addr.s===x.s?' on':'')+'" data-sa="'+i+'">'+ic(x.k==='work'?'work':'home')+h(x.label)+'</button>'}).join('')+'</div>':'')+
    mapSvg()+'<div class="addr-line">'+ic('pin')+'<span><b id="ad-s">'+h(a.s||'')+'</b><small id="ad-d">'+h(a.dist||'')+'</small></span><button type="button" class="lnk" id="ad-me">'+ic('gps')+t('myPlace')+'</button></div>'+
    '<div class="fg"><label class="fld w2"><span>'+t('landmark')+'</span><input id="ad-lm" value="'+h(a.lm||'')+'" placeholder="'+t('landmarkPh')+'"></label><label class="fld"><span>'+t('entrance')+'</span><input id="ad-en" inputmode="numeric" value="'+h(a.en||'')+'"></label><label class="fld"><span>'+t('floor')+'</span><input id="ad-fl" inputmode="numeric" value="'+h(a.fl||'')+'"></label><label class="fld"><span>'+t('flat')+'</span><input id="ad-ap" inputmode="numeric" value="'+h(a.ap||'')+'"></label><label class="fld w2"><span>'+t('courierNote')+'</span><input id="ad-nt" value="'+h(a.nt||'')+'" placeholder="'+t('courierNotePh')+'"></label></div>'+
    '<label class="chk"><input type="checkbox" id="ad-save" checked><span>'+t('saveAddr')+'</span></label>';
    var setTo=mapPick(rv,function(s,dist){$('#ad-s').textContent=s;$('#ad-d').textContent=dist;O.addr=O.addr||{};O.addr.s=s;O.addr.dist=dist});
    $('#ad-me').onclick=function(){setTo(-330,-260);toast(t('gpsToast'))};
    $$('[data-sa]').forEach(function(b){b.onclick=function(){O.addr=JSON.parse(JSON.stringify(S.addrs[+b.getAttribute('data-sa')]));drawRecv()}});
    if(O.addr&&O.addr.s){$('#ad-s').textContent=O.addr.s;$('#ad-d').textContent=O.addr.dist||''}
    ['lm','en','fl','ap','nt'].forEach(function(k){$('#ad-'+k).oninput=function(){O.addr=O.addr||{};O.addr[k]=this.value}})}
  drawRecv();
  $$('[data-recv]').forEach(function(b){b.onclick=function(){O.recv=b.getAttribute('data-recv');$$('[data-recv]').forEach(function(x){x.setAttribute('aria-checked',x===b)});drawRecv();refreshSum()}});
  $$('[data-day]').forEach(function(b){b.onclick=function(){O.day=+b.getAttribute('data-day');if(O.day===0)O.slot=2;render()}});
  $$('[data-slot]').forEach(function(b){b.onclick=function(){O.slot=+b.getAttribute('data-slot');$$('[data-slot]').forEach(function(x){x.classList.toggle('on',x===b)})}});
  $$('input[name=pay]').forEach(function(i){i.onchange=function(){O.pay=i.value;$$('.pays .pay').forEach(function(l){l.classList.toggle('on',$('input',l).checked)});refreshSum()}});
  function refreshSum(){var T=totals();$('#co-go').textContent=payLabel(T);$('#co-go2').textContent=payLabel(T);var sb=$('.pg-side .sum');if(sb){var w=d.createElement('div');w.innerHTML=sumBox(T);sb.replaceWith(w.firstChild);var e=$('.pg-side .earn');if(e&&w.lastChild)e.replaceWith(w.lastChild)}$('.cart-bar .pb-p b').textContent=sum(T.total)}
  refreshSum();
  $('#co-go').onclick=$('#co-go2').onclick=submit};
function submit(){var err=$('#co-err'),bad=null;$$('.co-s').forEach(function(s){s.classList.remove('bad')});
  if(!S.user)bad=['co-who',t('needPhone')];else if(O.recv==='courier'&&!(O.addr&&O.addr.s))bad=['co-recv',t('needAddr')];
  if(bad){err.hidden=false;err.textContent=bad[1];var s=$('#'+bad[0]);s.classList.add('bad');s.scrollIntoView({behavior:REDUCED?'auto':'smooth',block:'center'});toast(bad[1]);return}
  err.hidden=true;
  if(O.recv==='courier'&&$('#ad-save')&&$('#ad-save').checked&&!S.addrs.some(function(a){return a.s===O.addr.s})){S.addrs.push({s:O.addr.s,dist:O.addr.dist,lm:O.addr.lm,en:O.addr.en,fl:O.addr.fl,ap:O.addr.ap,label:S.addrs.length?t('work'):t('homeA'),k:S.addrs.length?'work':'home'});save()}
  if(O.pay==='nasiya'){go('#/nasiya');return}
  if(O.pay==='cash'){place(null);return}
  paySheet()}
function paySheet(){var T=totals(),name=G.pays.filter(function(p){return p.id===O.pay})[0].n;
  sheet(t('payVia',{n:h(name)}),'<div class="psim"><p class="ps-sum">'+sum(T.total)+'</p><label class="fld"><span>'+t('cardNo')+'</span><input id="cn" inputmode="numeric" autocomplete="cc-number" placeholder="8600 1234 5678 9012"></label><label class="fld"><span>'+t('cardExp')+'</span><input id="ce" inputmode="numeric" autocomplete="cc-exp" placeholder="12/28"></label><p class="err" id="cn-err" hidden></p><p class="hint">'+t('payDemo')+'</p></div>',{foot:'<button type="button" class="btn btn-g big wide" id="ps-go">'+t('payN',{n:sum(T.total)})+'</button>',on:function(s){
    var cn=$('#cn',s),ce=$('#ce',s);cn.oninput=function(){cn.value=cn.value.replace(/\D/g,'').slice(0,16).replace(/(\d{4})(?=\d)/g,'$1 ')};ce.oninput=function(){ce.value=ce.value.replace(/\D/g,'').slice(0,4).replace(/^(\d{2})(\d)/,'$1/$2')};
    $('#ps-go',s).onclick=function(){if(cn.value.replace(/\D/g,'').length<16||ce.value.length<5){var e=$('#cn-err',s);e.hidden=false;e.textContent=t('cardBad');return}
      $('.sh-body',s).innerHTML='<div class="otp"><p>'+t('codeSent',{n:S.user.phone})+'</p><div class="code" id="code2">'+[0,1,2,3,4,5].map(function(i){return '<input inputmode="numeric" maxlength="1" aria-label="'+t('digit')+' '+(i+1)+'">'}).join('')+'</div><p class="hint">'+t('demoAny')+'</p></div>';$('.sh-foot',s).innerHTML='<button type="button" class="btn btn-g big wide" id="ps-ok">'+t('confirm')+'</button>';
      var ins=$$('#code2 input',s);ins[0].focus();ins.forEach(function(inp,i){inp.oninput=function(){inp.value=inp.value.replace(/\D/g,'').slice(-1);if(inp.value&&ins[i+1])ins[i+1].focus()}});
      $('#ps-ok',s).onclick=function(){$('.sh-body',s).innerHTML='<div class="proc"><span class="spin" aria-hidden="true"></span><p>'+t('paying')+'</p></div>';$('.sh-foot',s).innerHTML='';setTimeout(function(){closeSheet();place(null)},REDUCED?200:1400)}}}})}

/* Рассрочка: партнёр и срок → данные → SMS → проверка → одобрено и график. */
var N={p:'uzum',m:6,step:0};
V.nasiya=function(){V.title=t('nasH');if(!S.cart.length)return V.cart();var T=totals();
  var steps=[t('ns1'),t('ns2'),t('ns3'),t('ns4')];
  return '<div class="pg narrow"><a class="back" href="#/checkout">'+ic('chev','l')+t('back')+'</a><h1>'+t('nasH')+'</h1><ol class="ns-steps">'+steps.map(function(s,i){return '<li class="'+(i<N.step?'done':i===N.step?'on':'')+'"><i>'+(i<N.step?ic('check'):i+1)+'</i><span>'+s+'</span></li>'}).join('')+'</ol><div class="box" id="ns">'+nasStep(T)+'</div></div>'};
function sched(total,m,pr){var mo=monthly(total,m,pr),out=[],dt=new Date();for(var i=1;i<=m;i++){var x=new Date(dt.getFullYear(),dt.getMonth()+i,Math.min(dt.getDate(),28));out.push({d:pad(x.getDate())+'.'+pad(x.getMonth()+1)+'.'+x.getFullYear(),s:mo})}return out}
function nasStep(T){var pr=G.nasiya.filter(function(x){return x.id===N.p})[0];
  if(N.step===0)return '<p class="ns-sum">'+t('nasFor',{n:sum(T.total)})+'</p><p class="lbl">'+t('term')+'</p><div class="seg">'+[3,6,12].map(function(k){return '<button type="button" role="radio" aria-checked="'+(k===N.m)+'" data-m="'+k+'">'+k+' '+t('mo')+'</button>'}).join('')+'</div><p class="lbl">'+t('partner')+'</p>'+
    G.nasiya.map(function(n){var mo=monthly(T.total,N.m,n.id);return '<label class="nas-o"><input type="radio" name="np" value="'+n.id+'"'+(n.id===N.p?' checked':'')+'><span class="nl" style="--c:'+n.c+'">'+h(n.n)+'</span><span class="nm"><b>'+sum(mo)+'</b><small>'+t('perMo')+'</small></span><span class="nt"><small>'+(n.terms[N.m]?t('overpay',{n:fmt(mo*N.m-T.total)}):t('noOver'))+'</small></span></label>'}).join('')+
    '<p class="fine">'+t('nasFine')+'</p><button type="button" class="btn btn-g big wide" id="ns-next">'+t('next')+'</button>';
  if(N.step===1)return '<p class="muted">'+t('nasData',{p:h(pr.n)})+'</p><label class="fld"><span>'+t('pinfl')+'</span><input id="pf" inputmode="numeric" maxlength="14" placeholder="31234567890123"></label><label class="fld"><span>'+t('passport')+'</span><input id="pp" autocapitalize="characters" maxlength="9" placeholder="AD1234567"></label><label class="fld"><span>'+t('cardNoN')+'</span><input id="nc2" inputmode="numeric" placeholder="9860 1234 5678 9012"></label><label class="chk"><input type="checkbox" id="ns-ag"><span>'+t('nasAgree',{p:h(pr.n)})+'</span></label><p class="err" id="ns-err" hidden></p><button type="button" class="btn btn-g big wide" id="ns-next">'+t('sendApp')+'</button>';
  if(N.step===2)return '<div class="otp"><p>'+t('codeSent',{n:S.user?S.user.phone:''})+'</p><div class="code" id="code3">'+[0,1,2,3].map(function(i){return '<input inputmode="numeric" maxlength="1" aria-label="'+t('digit')+' '+(i+1)+'">'}).join('')+'</div><p class="hint">'+t('demoAny')+'</p></div><div class="scor" id="scor" hidden>'+[t('sc1'),t('sc2'),t('sc3')].map(function(s){return '<p>'+ic('check')+'<span>'+s+'</span></p>'}).join('')+'</div>';
  var mo=monthly(T.total,N.m,N.p),lim=Math.max(3000000,Math.ceil(T.total*2.5/500000)*500000);
  return '<div class="appr"><span class="appr-ic">'+ic('check')+'</span><h2>'+t('approved')+'</h2><p>'+t('limit',{p:h(pr.n),n:sum(lim)})+'</p></div><dl class="sum"><div><dt>'+t('term')+'</dt><dd>'+N.m+' '+t('mo')+'</dd></div><div><dt>'+t('monthlyPay')+'</dt><dd>'+sum(mo)+'</dd></div><div><dt>'+t('firstPay')+'</dt><dd>'+sched(T.total,N.m,N.p)[0].d+'</dd></div><div class="tot"><dt>'+t('nasTotal')+'</dt><dd>'+sum(mo*N.m)+'</dd></div></dl>'+
    '<details class="sched"><summary>'+t('schedule')+'</summary><ol>'+sched(T.total,N.m,N.p).map(function(r,i){return '<li><span>'+(i+1)+'. '+r.d+'</span><b>'+sum(r.s)+'</b></li>'}).join('')+'</ol></details><button type="button" class="btn btn-g big wide" id="ns-next">'+t('nasConfirm')+'</button>'}
V.nasiya_on=function(){var box=$('#ns');if(!box)return;var T=totals();
  $$('[data-m]',box).forEach(function(b){b.onclick=function(){N.m=+b.getAttribute('data-m');render()}});
  $$('input[name=np]',box).forEach(function(i){i.onchange=function(){N.p=i.value;render()}});
  if(N.step===1){var pf=$('#pf'),nc=$('#nc2');pf.oninput=function(){pf.value=pf.value.replace(/\D/g,'').slice(0,14)};nc.oninput=function(){nc.value=nc.value.replace(/\D/g,'').slice(0,16).replace(/(\d{4})(?=\d)/g,'$1 ')}}
  if(N.step===2){var ins=$$('#code3 input');ins[0].focus();ins.forEach(function(inp,i){inp.oninput=function(){inp.value=inp.value.replace(/\D/g,'').slice(-1);if(inp.value&&ins[i+1])ins[i+1].focus();if(ins.every(function(x){return x.value})){$('.otp',box).hidden=true;var sc=$('#scor');sc.hidden=false;$$('p',sc).forEach(function(p,k){setTimeout(function(){p.classList.add('on')},REDUCED?0:500*(k+1))});setTimeout(function(){N.step=3;render()},REDUCED?300:2100)}}})}
  var nx=$('#ns-next');if(nx)nx.onclick=function(){
    if(N.step===1){var e=$('#ns-err'),pf=$('#pf').value,pp=$('#pp').value.trim(),nc=$('#nc2').value.replace(/\D/g,'');
      var msg=pf.length!==14&&!/^[A-Za-z]{2}\d{7}$/.test(pp)?t('needId'):nc.length!==16?t('cardBad'):!$('#ns-ag').checked?t('needAgree'):'';if(msg){e.hidden=false;e.textContent=msg;return}}
    if(N.step===3){var tot=T.total;place({p:N.p,pn:G.nasiya.filter(function(x){return x.id===N.p})[0].n,m:N.m,mo:monthly(tot,N.m,N.p),sched:sched(tot,N.m,N.p),paid:0});N.step=0;return}
    if(N.step===0&&!S.user){toast(t('needPhone'));go('#/checkout');return}
    N.step++;render()}};

/* Заказ: номер, шаги, курьер на карте, чек. */
function place(nas){var T=totals(),no='GW-'+(10480+S.orders.length+1);
  var o={no:no,ts:Date.now(),items:S.cart.map(function(c){return {id:c.id,q:c.q,p:P[c.id].price}}),T:T,pay:nas?'nasiya':O.pay,nas:nas,promo:C.promo,recv:O.recv==='pickup'?{t:'pickup',p:G.pickups[O.pk||0].n}:{t:'courier',a:O.addr.s,dist:O.addr.dist,lm:O.addr.lm,en:O.addr.en,fl:O.addr.fl,ap:O.addr.ap,nt:O.addr.nt},day:O.day,slot:['10:00-14:00','14:00-18:00','18:00-22:00'][O.slot||0],st:0,times:[Date.now()],user:S.user,lang:L};
  if(T.pts){S.points-=T.pts;S.pts.unshift({d:today(),n:-T.pts,w:'spent',o:no})}
  S.orders.unshift(o);S.cart=[];C.promo='';C.usePts=false;save();badge();go('#/order/'+no+'?new=1')}
function findO(no){return S.orders.filter(function(o){return o.no===no})[0]}
var ST=['st0','st1','st2','st3'];
V.order=function(no,q){var o=findO(no);if(!o)return V.orders();V.title=t('orderN',{n:no});
  var dt=new Date(o.ts),when=[t('today'),t('tomorrow'),t('after2')][o.day||0]+', '+o.slot;
  return '<div class="pg narrow ord">'+(q.new?'<div class="done-h"><span class="appr-ic">'+ic('check')+'</span><h1>'+t('thanks')+'</h1><p>'+t('placed',{n:no})+'</p></div>':'<a class="back" href="#/orders">'+ic('chev','l')+t('myOrders')+'</a><h1>'+t('orderN',{n:no})+'</h1>')+
  '<ol class="track" style="--k:'+(o.st/3).toFixed(3)+'">'+ST.map(function(s,i){var tm=o.times[i];return '<li class="'+(i<o.st?'done':i===o.st?'on':'')+'"><i>'+(i<=o.st?ic(i===3?'home':i===2?'truck':i===1?'box':'check'):'')+'</i><span><b>'+t(s)+'</b><small>'+(tm?clock(tm):i===3?when:'')+'</small></span></li>'}).join('')+'</ol>'+
  (o.st===2&&o.recv.t==='courier'?'<div class="cour-box">'+mapSvg('track-map',true)+'<div class="cour-i"><span class="av">'+ic('truck')+'</span><span><b>'+t('courierName')+'</b><small>'+t('eta')+'</small></span><button type="button" class="ib" id="call" aria-label="'+t('call')+'">'+ic('phone')+'</button></div></div>':'')+
  (o.st===3&&!o.reviewed?'<div class="rate-ask"><span class="ra-ic">'+ic('gift')+'</span><div><h2>'+t('rateAsk')+'</h2><p>'+t('rateAskS',{a:fmt(G.shop.reviewPts),b:fmt(G.shop.reviewPhotoPts)})+'</p><a class="btn btn-g" href="#/review/'+no+'">'+ic('star')+t('rateGo')+'</a></div></div>':'')+
  (o.st===3&&o.reviewed?'<div class="rate-ask done"><span class="ra-ic">'+ic('check')+'</span><div><h2>'+t('ratedH')+'</h2><p>'+t('ratedS',{n:fmt(o.earned||0)})+'</p></div></div>':'')+
  (o.st<3?'<button type="button" class="demo-next" id="nx">'+ic('play')+'<span>'+t('nextStep')+'</span></button>':'')+
  '<div class="box"><ul class="mini">'+o.items.map(function(i){var p=P[i.id];return '<li><img src="'+IMG+'/p-'+p.id+'-s.webp" alt="" width="32" height="61"><span>'+h(p.n)+' <small>× '+i.q+'</small></span><b>'+sum(i.p*i.q)+'</b></li>'}).join('')+'</ul>'+
  '<dl class="sum"><div><dt>'+t('recvW')+'</dt><dd>'+(o.recv.t==='pickup'?h(o.recv.p):h(o.recv.a))+'</dd></div><div><dt>'+t('whenW')+'</dt><dd>'+when+'</dd></div><div><dt>'+t('payW')+'</dt><dd>'+payName(o)+'</dd></div><div class="tot"><dt>'+t('total')+'</dt><dd>'+sum(o.T.total)+'</dd></div></dl>'+
  '<div class="row2"><button type="button" class="btn btn-ghost" id="rcpt">'+ic('doc')+t('receipt')+'</button>'+(o.nas?'<a class="btn btn-ghost" href="#/plans">'+ic('cal')+t('schedule')+'</a>':'<a class="btn btn-ghost" href="https://t.me/'+G.brand.tg+'">'+ic('tg')+t('support')+'</a>')+'</div></div>'+
  '<p class="earn c">'+ic('gift')+t('willEarn',{n:fmt(o.T.earn)})+'</p></div>'};
function clock(ts){var x=new Date(ts);return pad(x.getDate())+'.'+pad(x.getMonth()+1)+', '+pad(x.getHours())+':'+pad(x.getMinutes())}
function payName(o){if(o.nas)return h(o.nas.pn)+', '+o.nas.m+' '+t('mo');var p=G.pays.filter(function(x){return x.id===o.pay})[0];return p?h(p.n):''}
V.order_on=function(no){var o=findO(no);if(!o)return;
  var nx=$('#nx');if(nx)nx.onclick=function(){o.st=Math.min(3,o.st+1);o.times[o.st]=Date.now();if(o.st===3&&!o.earnedBuy){S.points+=o.T.earn;S.spent+=o.T.total;S.pts.unshift({d:today(),n:o.T.earn,w:'buy',o:o.no});o.earnedBuy=1;toast(t('ptsPlus',{n:fmt(o.T.earn)}))}save();render()};
  var c=$('#call');if(c)c.onclick=function(){toast(t('callDemo'))};
  $('#rcpt').onclick=function(){sheet(t('receipt'),'<div class="rcpt"><svg class="logo-w dk" viewBox="0 0 131 16" aria-label="Greenwell"><use href="#gw-logo"/></svg><p>'+h(G.brand.dist)+'</p><p>'+t('orderN',{n:o.no})+' · '+clock(o.ts)+'</p><ul>'+o.items.map(function(i){return '<li><span>'+h(P[i.id].n)+' × '+i.q+'</span><b>'+fmt(i.p*i.q)+'</b></li>'}).join('')+'</ul>'+
    (o.T.promo?'<p class="r"><span>'+t('promoW')+'</span><b>−'+fmt(o.T.promo)+'</b></p>':'')+(o.T.pts?'<p class="r"><span>'+t('ptsW')+'</span><b>−'+fmt(o.T.pts)+'</b></p>':'')+'<p class="r"><span>'+t('delivery')+'</span><b>'+fmt(o.T.deliv)+'</b></p><p class="r tot"><span>'+t('total')+'</span><b>'+sum(o.T.total)+'</b></p><p class="r"><span>'+t('payW')+'</span><b>'+payName(o)+'</b></p><p class="fine">'+t('rcptDemo')+'</p></div>')};
  var tm=$('.track-map');if(tm&&!REDUCED){var path=$('.route',tm),dot=$('.cour',tm);if(path&&dot&&path.getTotalLength){var L0=path.getTotalLength(),t0=performance.now();(function step(now){if(!d.body.contains(dot))return;var k=((now-t0)/14000)%1;var pt=path.getPointAtLength(L0*k);dot.setAttribute('transform','translate('+pt.x.toFixed(1)+' '+pt.y.toFixed(1)+')');requestAnimationFrame(step)})(t0)}}
  else if(tm){var dt2=$('.cour',tm);if(dt2)dt2.setAttribute('transform','translate(420 400)')}};

/* Отзыв после получения: звёзды, текст, фото → баллы. */
V.review=function(no){var o=findO(no);if(!o)return V.orders();V.title=t('rateGo');
  return '<div class="pg narrow"><a class="back" href="#/order/'+no+'">'+ic('chev','l')+t('orderN',{n:no})+'</a><h1>'+t('rateGo')+'</h1><p class="muted">'+t('rateAskS',{a:fmt(G.shop.reviewPts),b:fmt(G.shop.reviewPhotoPts)})+'</p>'+
  o.items.map(function(i,k){var p=P[i.id];return '<form class="box rvf" data-id="'+p.id+'"><div class="rvf-h"><img src="'+IMG+'/p-'+p.id+'-s.webp" alt="" width="40" height="76"><b>'+h(p.n)+'</b></div><div class="rate" role="radiogroup" aria-label="'+t('rating')+'">'+[1,2,3,4,5].map(function(n){return '<button type="button" role="radio" aria-checked="false" data-s="'+n+'" aria-label="'+n+'">'+ic('star')+'</button>'}).join('')+'</div>'+
  '<div class="fchips qt">'+G.quick.map(function(q){return '<button type="button" class="fchip" data-qt="'+h(q)+'">'+h(q)+'</button>'}).join('')+'</div><label class="fld"><span>'+t('revText')+'</span><textarea rows="3" placeholder="'+t('revPh')+'"></textarea></label>'+
  '<label class="upl"><input type="file" accept="image/jpeg,image/png,image/webp,image/heic" hidden><span class="up-in">'+ic('camera')+'<span><b>'+t('addPhoto')+'</b><small>'+t('addPhotoS',{n:fmt(G.shop.reviewPhotoPts-G.shop.reviewPts)})+'</small></span></span><img class="up-prev" alt="" hidden></label><p class="err" hidden></p></form>'}).join('')+
  '<button type="button" class="btn btn-g big wide" id="rv-send">'+t('sendRev')+'</button><p class="fine">'+t('revRules')+'</p></div>'};
V.review_on=function(no){var o=findO(no);if(!o)return;
  $$('.rvf').forEach(function(f){var s=0;$$('[data-s]',f).forEach(function(b){b.onclick=function(){s=+b.getAttribute('data-s');f.setAttribute('data-stars',s);$$('[data-s]',f).forEach(function(x){var on=+x.getAttribute('data-s')<=s;x.classList.toggle('on',on);x.setAttribute('aria-checked',+x.getAttribute('data-s')===s)})}});
    $$('[data-qt]',f).forEach(function(b){b.onclick=function(){var ta=$('textarea',f);b.classList.toggle('on');if(b.classList.contains('on'))ta.value=(ta.value?ta.value.replace(/\s+$/,'')+' ':'')+b.getAttribute('data-qt')+'.'}});
    var fi=$('input[type=file]',f);fi.onchange=function(){var file=fi.files[0];if(!file)return;var r=new FileReader();r.onload=function(){var im=new Image();im.onload=function(){var c=d.createElement('canvas'),k=Math.min(1,480/Math.max(im.width,im.height));c.width=im.width*k;c.height=im.height*k;c.getContext('2d').drawImage(im,0,0,c.width,c.height);var u=c.toDataURL('image/jpeg',.7);f.setAttribute('data-photo',u);var pv=$('.up-prev',f);pv.src=u;pv.hidden=false;$('.up-in',f).classList.add('has')};im.src=r.result};r.readAsDataURL(file)}});
  $('#rv-send').onclick=function(){var total=0,ok=true;
    $$('.rvf').forEach(function(f){var e=$('.err',f),s=+f.getAttribute('data-stars')||0,tx=$('textarea',f).value.trim();e.hidden=true;if(!s){e.hidden=false;e.textContent=t('needStars');ok=false}else if(tx.length<10){e.hidden=false;e.textContent=t('needText');ok=false}});
    if(!ok){toast(t('fixRev'));return}
    $$('.rvf').forEach(function(f){var photo=f.getAttribute('data-photo')||'',pts=photo?G.shop.reviewPhotoPts:G.shop.reviewPts;total+=pts;
      S.reviews.unshift({id:f.getAttribute('data-id'),order:no,stars:+f.getAttribute('data-stars'),text:$('textarea',f).value.trim(),photo:photo,date:today(),ts:Date.now(),name:S.user&&S.user.name||'',phone:S.user&&S.user.phone||'',pts:pts,status:'new'})});
    o.reviewed=1;o.earned=total;S.points+=total;S.pts.unshift({d:today(),n:total,w:'review',o:no});save();
    var b=d.createElement('div');b.className='burst';b.innerHTML='<div class="bu-in"><span class="appr-ic">'+ic('gift')+'</span><b>+'+fmt(total)+'</b><p>'+t('ptsBurst')+'</p></div>'+Array.apply(null,Array(18)).map(function(_,i){return '<i style="--a:'+(i*20)+'deg;--d:'+(80+i%3*30)+'px"></i>'}).join('');d.body.appendChild(b);
    setTimeout(function(){b.classList.add('out')},REDUCED?600:1900);setTimeout(function(){b.remove();go('#/points')},REDUCED?800:2300)}};

/* Кабинет. */
V.me=function(){V.title=t('profile');if(!S.user)return '<div class="pg narrow"><h1>'+t('profile')+'</h1><div class="box"><h2>'+t('loginH')+'</h2><p class="muted">'+t('loginS',{n:fmt(G.shop.welcome)})+'</p><div id="lg"></div></div>'+menu(false)+'</div>';
  var lv=levelOf(),lvs=G.shop.levels,nx=lvs[lvs.indexOf(lv)+1];
  return '<div class="pg narrow"><div class="me-card"><span class="av big">'+h((S.user.name||'G').charAt(0).toUpperCase())+'</span><div><b>'+h(S.user.name||t('buyer'))+'</b><small>'+h(S.user.phone)+'</small></div><span class="lvl lvl-'+lv.id+'">'+h(lv.n)+'</span></div>'+
  '<a class="pts-card" href="#/points"><span><small>'+t('ptsBalance')+'</small><b>'+fmt(S.points)+'</b><small>'+t('ptsEq',{n:sum(S.points)})+'</small></span>'+(nx?'<span class="lv-next"><small>'+t('toLevel',{l:h(nx.n),n:sum(Math.max(0,nx.from-S.spent))})+'</small><i style="--k:'+Math.min(1,S.spent/nx.from).toFixed(3)+'"></i></span>':'')+'</a>'+
  menu(true)+'</div>'};
function menu(on){var it=on?[['#/orders','box',t('myOrders'),S.orders.length],['#/plans','cal',t('myPlans'),S.orders.filter(function(o){return o.nas}).length],['#/addr','pin',t('myAddrs'),S.addrs.length],['#/fav','heart',t('fav'),S.fav.length],['#/points','gift',t('ptsHist'),'']]:[['#/fav','heart',t('fav'),S.fav.length]];
  return '<ul class="menu">'+it.map(function(x){return '<li><a href="'+x[0]+'">'+ic(x[1])+'<span>'+x[2]+'</span>'+(x[3]?'<em>'+x[3]+'</em>':'')+ic('chev')+'</a></li>'}).join('')+
  '<li><div class="lang-row">'+ic('globe')+'<span>'+t('language')+'</span><a href="'+G.other+location.hash+'" class="chip on">'+(L==='ru'?'RU':'UZ')+'</a><a href="'+G.other+location.hash+'" class="chip">'+(L==='ru'?'UZ':'RU')+'</a></div></li>'+
  (on?'<li><label class="sw-row">'+ic('bell')+'<span>'+t('notif')+'</span><input type="checkbox" class="sw" checked></label></li><li><button type="button" class="lnk out" id="logout">'+ic('out')+t('logout')+'</button></li>':'')+
  '<li><a href="'+G.panel+'" class="staff">'+ic('chart')+'<span><b>'+t('staff')+'</b><small>'+t('staffS')+'</small></span>'+ic('chev')+'</a></li></ul>'}
V.me_on=function(){var lg=$('#lg');if(lg)login(lg,render);var lo=$('#logout');if(lo)lo.onclick=function(){S.user=null;save();render()}};
V.orders=function(){V.title=t('myOrders');return '<div class="pg narrow"><a class="back" href="#/me">'+ic('chev','l')+t('profile')+'</a><h1>'+t('myOrders')+'</h1>'+(S.orders.length?'<ul class="olist">'+S.orders.map(function(o){return '<li><a href="#/order/'+o.no+'"><span class="ol-im">'+o.items.slice(0,3).map(function(i){return '<img src="'+IMG+'/p-'+i.id+'-s.webp" alt="" width="28" height="53">'}).join('')+'</span><span><b>'+o.no+'</b><small>'+clock(o.ts)+' · '+sum(o.T.total)+'</small></span><em class="ost ost'+o.st+'">'+t(ST[o.st])+'</em></a></li>'}).join('')+'</ul>':'<div class="empty">'+ic('box','big')+'<b>'+t('noOrders')+'</b><a class="btn btn-g" href="#/c/all">'+t('toCatalog')+'</a></div>')+'</div>'};
V.plans=function(){V.title=t('myPlans');var list=S.orders.filter(function(o){return o.nas});
  return '<div class="pg narrow"><a class="back" href="#/me">'+ic('chev','l')+t('profile')+'</a><h1>'+t('myPlans')+'</h1>'+(list.length?list.map(function(o){var n=o.nas,left=n.sched.length-n.paid;return '<div class="box plan"><div class="pl-h"><span class="nl" style="--c:'+(G.nasiya.filter(function(x){return x.id===n.p})[0]||{}).c+'">'+h(n.pn)+'</span><a href="#/order/'+o.no+'">'+o.no+'</a></div><div class="pl-k"><div><small>'+t('nextPay')+'</small><b>'+(left?sum(n.mo):t('paidAll'))+'</b><small>'+(left?n.sched[n.paid].d:'')+'</small></div><div><small>'+t('leftPay')+'</small><b>'+sum(n.mo*left)+'</b><small>'+left+' '+t('of')+' '+n.sched.length+'</small></div></div><i class="pl-bar" style="--k:'+(n.paid/n.sched.length).toFixed(3)+'"></i><ol class="sch">'+n.sched.map(function(r,i){return '<li class="'+(i<n.paid?'paid':i===n.paid?'next':'')+'"><span>'+r.d+'</span><b>'+sum(r.s)+'</b><em>'+(i<n.paid?t('paid'):i===n.paid?t('next2'):'')+'</em></li>'}).join('')+'</ol>'+(left?'<button type="button" class="btn btn-g wide" data-pay="'+o.no+'">'+t('payNow',{n:sum(n.mo)})+'</button>':'')+'</div>'}).join(''):'<div class="empty">'+ic('cal','big')+'<b>'+t('noPlans')+'</b><p>'+t('noPlansS')+'</p></div>')+'</div>'};
V.plans_on=function(){$$('[data-pay]').forEach(function(b){b.onclick=function(){var o=findO(b.getAttribute('data-pay'));o.nas.paid=Math.min(o.nas.sched.length,o.nas.paid+1);save();render();toast(t('payDone'))}})};
V.addrs=function(){V.title=t('myAddrs');return '<div class="pg narrow"><a class="back" href="#/me">'+ic('chev','l')+t('profile')+'</a><h1>'+t('myAddrs')+'</h1>'+(S.addrs.length?'<ul class="menu">'+S.addrs.map(function(a,i){return '<li><div class="ad-i">'+ic(a.k==='work'?'work':'home')+'<span><b>'+h(a.label)+'</b><small>'+h(a.s)+(a.en?', '+t('entrance').toLowerCase()+' '+h(a.en):'')+(a.fl?', '+t('floor').toLowerCase()+' '+h(a.fl):'')+'</small></span><button type="button" class="ib" data-rm="'+i+'" aria-label="'+t('remove')+'">'+ic('x')+'</button></div></li>'}).join('')+'</ul>':'<div class="empty">'+ic('pin','big')+'<b>'+t('noAddr')+'</b><p>'+t('noAddrS')+'</p></div>')+'</div>'};
V.addrs_on=function(){$$('[data-rm]').forEach(function(b){b.onclick=function(){S.addrs.splice(+b.getAttribute('data-rm'),1);save();render()}})};
V.fav=function(){V.title=t('fav');return '<div class="pg"><h1>'+t('fav')+'</h1>'+(S.fav.length?'<div class="grid">'+S.fav.map(function(id){return card(P[id])}).join('')+'</div>':'<div class="empty">'+ic('heart','big')+'<b>'+t('favEmpty')+'</b><p>'+t('favEmptyS')+'</p><a class="btn btn-g" href="#/c/all">'+t('toCatalog')+'</a></div>')+'</div>'};
V.points=function(){V.title=t('ptsHist');var lv=levelOf();return '<div class="pg narrow"><a class="back" href="#/me">'+ic('chev','l')+t('profile')+'</a><h1>'+t('ptsHist')+'</h1><div class="pts-card"><span><small>'+t('ptsBalance')+'</small><b>'+fmt(S.points)+'</b><small>'+t('ptsEq',{n:sum(S.points)})+'</small></span></div>'+
  '<div class="box how"><h2>'+t('howPts')+'</h2><ul>'+[['bag',t('hp1',{n:lv.k})],['star',t('hp2',{n:fmt(G.shop.reviewPts)})],['camera',t('hp3',{n:fmt(G.shop.reviewPhotoPts)})],['gift',t('hp4',{n:Math.round(G.shop.pointsMaxShare*100)})]].map(function(x){return '<li>'+ic(x[0])+'<span>'+x[1]+'</span></li>'}).join('')+'</ul></div>'+
  (S.pts.length?'<ul class="ph">'+S.pts.map(function(p){return '<li><span><b>'+t('pw_'+p.w)+'</b><small>'+p.d+(p.o?' · '+p.o:'')+'</small></span><em class="'+(p.n>0?'g':'')+'">'+(p.n>0?'+':'')+fmt(p.n)+'</em></li>'}).join('')+'</ul>':'')+'</div>'};

/* ── Шапка: прячется при прокрутке, возвращается через 3 секунды ─────────
   Правило владельца DevUz, 15.10.2026: при любой прокрутке шапка уходит и
   возвращается только через 3 секунды после полной остановки (инерция на
   телефоне тоже шлёт scroll). Пока фокус с клавиатуры в шапке, не прячется. */
var top=$('#top');
var IDLE=3000,idleT=0;
function headIdle(){if(!top)return;clearTimeout(idleT);
  if(scrollY>60&&!top.contains(d.activeElement))top.classList.add('hide');
  idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}
function showTop(){clearTimeout(idleT);if(top)top.classList.remove('hide')}
function onScroll(){headIdle()}
addEventListener('scroll',onScroll,{passive:true});

/* ── Делегирование нажатий ─────────────────────────────────────────────── */
d.addEventListener('click',function(e){var b=e.target.closest('button,a');if(!b)return;
  var id;if((id=b.getAttribute('data-add'))){e.preventDefault();addCart(id,b);return}
  if((id=b.getAttribute('data-plus'))){setQ(id,inCart(id)+1);refreshBuy(id);pulse();return}
  if((id=b.getAttribute('data-minus'))){var q=inCart(id)-1;setQ(id,q);refreshBuy(id);if(!q&&route.name==='cart')render();return}
  if((id=b.getAttribute('data-fav'))){e.preventDefault();toggleFav(id,b);return}
  if((id=b.getAttribute('data-one'))){if(!inCart(id))setQ(id,1);go('#/checkout');return}
  if(b.hasAttribute('data-search')){e.preventDefault();openSearch();return}});
$('#sq').addEventListener('input',function(){sugg(this.value)});
$('#sq-form').addEventListener('submit',function(e){e.preventDefault();var q=$('#sq').value.trim();if(q)go('#/search?q='+encodeURIComponent(q))});
$('#sq-x').onclick=closeSearch;
$('#search').addEventListener('click',function(e){if(e.target.closest('a'))closeSearch()});
if(!location.hash&&EMBED)location.hash='#/';
render();
})();
