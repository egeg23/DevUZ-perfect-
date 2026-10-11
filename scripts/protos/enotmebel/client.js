(function(){
'use strict';
/* main: появление блоков, шапка, фильтр каталога, корзина, подбор по росту,
   выбор ткани и цвета, корпоративная заявка, параллакс шоурума, «было /
   стало», конструктор. Всё, что уходит менеджеру, уходит в Telegram
   Enotmebel. Анимации только transform и opacity, прокрутку только читаем. */
var d=document,root=d.documentElement,$=function(id){return d.getElementById(id)};
var L={};try{L=JSON.parse($('i18n').textContent)}catch(e){}
var reduce=false;try{reduce=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
var hov=false;try{hov=matchMedia('(hover:hover) and (pointer:fine)').matches}catch(e){}
var store={get:function(k,f){try{var v=localStorage.getItem(k);return v?JSON.parse(v):f}catch(e){return f}},set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
var qa=function(s,el){return [].slice.call((el||d).querySelectorAll(s))};
var money=function(n){return '$'+String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ')};
var sums=function(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')+' '+L.sum};

if(root.classList.contains('intro-off')||!$('intro')){var h0=$('hero');if(h0)h0.classList.add('hero-on')}

/* ── Сообщение в Telegram Enotmebel. Готовый текст в чат не подставить,
   поэтому кладём его в буфер обмена и открываем чат: человеку остаётся
   вставить и отправить. ── */
function tgSend(text,note){
  try{navigator.clipboard.writeText(text)}catch(e){}
  if(note){note.textContent=L.sent;note.hidden=false}
  window.open(L.tg,'_blank','noopener');
}
d.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[data-tg]');if(!a)return;e.preventDefault();tgSend(a.dataset.tg||'')});

/* ── Появление блоков: у каждого своё движение ── */
var rv=qa('.rv');
if('IntersectionObserver' in window&&!reduce){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
  rv.forEach(function(el){io.observe(el)});
}else rv.forEach(function(el){el.classList.add('in')});

/* ── Шапка: над историей прозрачная, дальше стекло ── */
var story=$('story');
var hdr=d.querySelector('.top .wrap'),tq=0;
/* Тон шапки: что лежит под её серединой. В истории тёмное всё, кроме светлых
   глав (story.js ставит st-light), дальше — тёмные блоки и подвал. */
var tone=function(){tq=0;if(!hdr)return;var r=hdr.getBoundingClientRect(),x=innerWidth/2,y=r.top+r.height/2,dark=false;
  var under=(d.elementsFromPoint?d.elementsFromPoint(x,y):[]).filter(function(e){return !e.closest('.top')&&!e.closest('#intro')})[0];
  if(under){if(under.closest('#story'))dark=!root.classList.contains('st-light');else dark=!!under.closest('.dark,.foot')}
  d.body.classList.toggle('hd-dark',dark)};
var top=function(){var y=scrollY,past=story?story.getBoundingClientRect().bottom<80:y>40;d.body.classList.toggle('scrolled',y>40);d.body.classList.toggle('past',past);if(!tq)tq=requestAnimationFrame(tone)};
addEventListener('scroll',top,{passive:true});addEventListener('resize',top);top();
new MutationObserver(function(){if(!tq)tq=requestAnimationFrame(tone)}).observe(root,{attributes:true,attributeFilter:['class']});

/* ── Карточка наклоняется за курсором, пятно света за ним же ── */
if(hov&&!reduce)qa('.tilt').forEach(function(c){
  var sp=c.querySelector('.spot'),raf=0,px=0,py=0;
  c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect();px=(e.clientX-r.left)/r.width;py=(e.clientY-r.top)/r.height;
    if(!raf)raf=requestAnimationFrame(function(){raf=0;c.style.transform='perspective(900px) rotateX('+((.5-py)*6).toFixed(2)+'deg) rotateY('+((px-.5)*8).toFixed(2)+'deg)';if(sp)sp.style.transform='translate3d('+(px*r.width).toFixed(0)+'px,'+(py*r.height).toFixed(0)+'px,0)'})});
  c.addEventListener('pointerleave',function(){c.style.transform=''});
});

/* ── Каталог: фильтр по форме ── */
var grid=$('mgrid'),catN=$('cat-n');
if(grid){
  var cards=qa('.mc',grid);
  var apply=function(f){var n=0;cards.forEach(function(c){var on=!f||c.dataset.g===f;c.hidden=!on;if(on){n++;if(!reduce){c.classList.remove('k-fresh');void c.offsetWidth;c.classList.add('k-fresh')}}});if(catN)catN.textContent=L.found.replace('{n}',n)};
  qa('.chips .chip').forEach(function(b){b.addEventListener('click',function(){qa('.chips .chip').forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});apply(b.dataset.f)})});
  apply('');
}

/* ── Корзина: несколько моделей одним сообщением ── */
var CART='en-cart-v1',cart=store.get(CART,{}),cartBox=$('cart'),cartList=$('cart-list');
function cartDraw(){
  if(!cartList)return;var ids=Object.keys(cart).filter(function(k){return cart[k]>0&&L.models[k]}),n=0,s=0;
  cartList.innerHTML='';
  ids.forEach(function(k){var m=L.models[k],q=cart[k];n+=q;s+=m.min*q;
    var li=d.createElement('li');li.innerHTML='<b></b><span class="num"></span><div class="qty"><button type="button" data-q="-1">−</button><i class="num"></i><button type="button" data-q="1">+</button></div>';
    var qb=li.querySelectorAll('[data-q]');qb[0].setAttribute('aria-label',L.less);qb[1].setAttribute('aria-label',L.more);
    li.querySelector('b').textContent=m.n;li.querySelector('span').textContent=L.from.replace('{p}',sums(m.min));li.querySelector('i').textContent=q;
    qa('[data-q]',li).forEach(function(b){b.addEventListener('click',function(){cart[k]=Math.max(0,q+ +b.dataset.q);if(!cart[k])delete cart[k];store.set(CART,cart);cartDraw()})});
    cartList.appendChild(li)});
  var ce=$('cart-empty');if(ce)ce.hidden=ids.length>0;
  var cs=$('cart-sum');if(cs)cs.textContent=n?L.from.replace('{p}',sums(s)):'';
  var cn=$('cart-n');if(cn){cn.textContent=n;cn.hidden=!n}
  qa('[data-add]').forEach(function(b){var on=!!cart[b.dataset.add];b.classList.toggle('on',on);var sp=b.querySelector('span');if(sp)sp.textContent=on?L.added:L.add});
}
function cartOpen(v){if(!cartBox)return;cartBox.hidden=!v;if(v){var f=cartBox.querySelector('button');if(f)f.focus()}}
qa('[data-add]').forEach(function(b){b.addEventListener('click',function(){var k=b.dataset.add;cart[k]=(cart[k]||0)+1;store.set(CART,cart);cartDraw();var cb=$('cart-btn');if(cb&&!reduce){cb.classList.remove('bump');void cb.offsetWidth;cb.classList.add('bump')}})});
if($('cart-btn'))$('cart-btn').addEventListener('click',function(){cartOpen(true)});
if($('cart-x'))$('cart-x').addEventListener('click',function(){cartOpen(false)});
if($('cart-send'))$('cart-send').addEventListener('click',function(){
  var ph=($('cart-ph').value||'').trim(),done=$('cart-done');
  var ids=Object.keys(cart).filter(function(k){return cart[k]>0&&L.models[k]});
  if(!ph){done.textContent=L.need;done.hidden=false;return}
  var lines=ids.map(function(k){return L.models[k].n+' × '+cart[k]});
  tgSend(L.cartHead+'\n'+lines.join('\n')+'\n'+L.cartPh+': '+ph,done);
});
cartDraw();

/* ── Подбор размера по росту. Что известно с их сайта: MINI до 110 см,
   BIG до 180 см. Остальное честно отдаём менеджеру. ── */
var sz=$('sz');
if(sz){
  var out=$('sz-out'),val=$('sz-v'),man=$('sz-man'),bags=qa('.sz-bag'),btn=d.querySelector('#razmer a[data-tg]');
  var pick=function(){
    var h=+sz.value,id=h<=110?'mini':h<=180?'big':'gigant',msg=h<=110?L.sizeKid:h<=180?L.sizeAdult:L.sizeTall;
    if(h>124&&h<=150)msg=L.sizeMid;
    val.textContent=h;out.textContent=msg;
    if(man)man.style.transform='scaleY('+(h/200).toFixed(3)+')';
    bags.forEach(function(b){b.classList.toggle('on',b.dataset.sz===id)});
    if(btn)btn.dataset.tg=L.sizeHead+'\n'+L.height+': '+h+' '+L.cm+'\n'+msg;
  };
  sz.addEventListener('input',pick);pick();
}

/* ── Образцы тканей грузятся очередью: по четыре за раз и только те, что
   на виду. 11.10.2026 iPhone запрашивал всю сетку из 77 образцов разом,
   сервер отбивал пачку, и вместо тканей были знаки вопроса. Не ответил —
   ещё две попытки с паузой. ── */
var swQ=[],swBusy=0;
function swPump(){
  while(swBusy<4&&swQ.length){
    var im=swQ.shift();swBusy++;
    (function(im){var tries=0,src=im.getAttribute('data-src');
      var done=function(){swBusy--;im.classList.add('ok');swPump()};
      im.onload=done;
      im.onerror=function(){if(tries<2){tries++;setTimeout(function(){im.src=src+'?r='+tries},900*tries)}else done()};
      im.src=src})(im);
  }
}
function swWant(im){if(im.dataset.q)return;im.dataset.q='1';swQ.push(im);swPump()}
var swImgs=qa('img[data-src]');
if('IntersectionObserver' in window){
  var swIo=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){swIo.unobserve(e.target);swWant(e.target)}})},{rootMargin:'240px 0px'});
  swImgs.forEach(function(im){swIo.observe(im)});
}else swImgs.forEach(swWant);
/* «Ещё N цветов»: остальные цвета этой ткани — по нажатию. */
qa('.sw-more').forEach(function(b){b.addEventListener('click',function(){var g=b.closest('.sw-grid');if(g)g.classList.add('all');b.hidden=true})});

/* ── Ткань и цвет: крупное фото образца с их карты расцветок. Сменили
   ткань — показываем её цвета, первый становится выбранным. ── */
var swImg=$('sw-img');
if(swImg){
  var fb=$('try-fab'),fc=$('try-col'),tm=$('try-m'),swN=$('sw-n');
  var cur=function(n){return d.querySelector('input[name="'+n+'"]:checked')};
  var show=function(){
    var f=cur('fab'),c=cur('col');if(!f||!c)return;
    var src=L.img+'/f-'+f.value+'-'+c.value+'.webp';
    if(swImg.getAttribute('src')!==src){
      swImg.width=+c.dataset.w;swImg.height=+c.dataset.h;swImg.style.maxWidth=c.dataset.w+'px';swImg.src=src;
      swImg.alt=L.fabrics[f.value]+', '+L.cards[f.value]+' '+c.value;
      if(!reduce){swImg.classList.remove('swap');void swImg.offsetWidth;swImg.classList.add('swap')}
    }
    fb.textContent=L.fabrics[f.value];fc.textContent=L.cards[f.value]+' '+c.value;
  };
  qa('input[name="fab"]').forEach(function(x){x.addEventListener('change',function(){
    var n=0;qa('.sw-grid').forEach(function(g){var on=g.dataset.fab===x.value;g.hidden=!on;if(on){n=g.querySelectorAll('input').length;var first=g.querySelector('input');if(first)first.checked=true}});
    if(swN)swN.textContent=n;show()})});
  qa('input[name="col"]').forEach(function(x){x.addEventListener('change',show)});
  $('try-send').addEventListener('click',function(){var f=cur('fab'),c=cur('col');
    tgSend(L.fabHead+'\n'+L.model+': '+L.models[tm.value].n+'\n'+L.fabric+': '+L.fabrics[f.value]+'\n'+L.color+': '+L.cards[f.value]+' '+c.value,$('try-done'))});
}

/* ── Корпоративный заказ ── */
var b2b=$('b2b');
if(b2b)b2b.addEventListener('submit',function(e){
  e.preventDefault();var v=function(n){var x=b2b.querySelector('[name="'+n+'"]');return x?(x.type==='radio'?(b2b.querySelector('[name="'+n+'"]:checked')||{}).value:x.value||'').trim():''};
  var err=$('b2b-err'),done=$('b2b-done');
  if(!v('qty')||!v('phone')){err.textContent=L.b2bNeed;err.hidden=false;done.hidden=true;return}
  err.hidden=true;
  tgSend(L.b2bHead+'\n'+L.b2bWho+': '+v('who')+'\n'+L.b2bQty+': '+v('qty')+'\n'+L.b2bWhen+': '+(v('when')||L.empty)+'\n'+L.b2bWhere+': '+(v('city')||L.empty)+'\n'+L.b2bName+': '+(v('name')||L.empty)+'\n'+L.cartPh+': '+v('phone'),done);
});

/* ── Параллакс: фото шоурума уходит медленнее страницы ── */
var sh=d.querySelector('.show'),shImg=sh&&sh.querySelector('[data-depth]');
if(sh&&shImg&&!reduce){var on=false,raf=0,lk='';
  var f=function(){raf=0;if(!on)return;var r=sh.getBoundingClientRect(),k=Math.round(r.top);if(k!==lk){lk=k;var p=(innerHeight-r.top)/(innerHeight+r.height);shImg.style.transform='translate3d(0,'+((p-.5)*-120).toFixed(1)+'px,0) scale(1.18)'}raf=requestAnimationFrame(f)};
  new IntersectionObserver(function(es){on=es[0].isIntersecting;if(on&&!raf)raf=requestAnimationFrame(f)}).observe(sh)}

/* ── Было / стало ── */
qa('[data-ba]').forEach(function(box){var r=box.querySelector('input');var s=function(){box.style.setProperty('--x',r.value+'%')};r.addEventListener('input',s);s()});

/* ── Конструктор: тумблер — настоящий блок на странице ── */
var KEY='en-kit-v1',inputs=qa('input[data-k][data-p]');
if(inputs.length){
  var price={},needs={},def={},title={};
  inputs.forEach(function(x){var k=x.dataset.k;price[k]=+x.dataset.p;needs[k]=(x.dataset.needs||'').split(' ').filter(Boolean);if(x.hasAttribute('data-def'))def[k]=true;var r=x.closest('label'),tt=r&&r.querySelector('b');if(tt&&!title[k])title[k]=tt.textContent});
  var on=store.get(KEY,null)||{};Object.keys(price).forEach(function(k){if(!(k in on))on[k]=!!def[k]});
  var pill=$('kd-pill'),panel=$('kd'),kb=+(L.kitBase||0);
  var applyK=function(fresh){
    Object.keys(price).forEach(function(k){
      root.classList.toggle('k-no-'+k,!on[k]);
      qa('[data-addon="'+k+'"]').forEach(function(el){if(el.id==='cart'){if(!on[k])el.hidden=true;return}el.hidden=!on[k];if(fresh===k&&on[k]&&!reduce){el.classList.remove('k-fresh');void el.offsetWidth;el.classList.add('k-fresh')}});
    });
    inputs.forEach(function(x){x.checked=!!on[x.dataset.k]});
    var ids=Object.keys(price).filter(function(k){return on[k]}),add=ids.reduce(function(s,k){return s+price[k]},0),sum=kb+add;
    var set=function(id,v){var el=$(id);if(el)el.textContent=v};
    set('kd-pill-sum',money(sum));set('kd-sum',money(sum));set('kd-add','+'+money(add));set('kd-n',(L.kitN||'').replace('{n}',ids.length));
    set('kit-sum',money(sum));set('kit-n',(L.kitN||'').replace('{n}',ids.length));
    root.dataset.kit=L.kitTg+'\n'+L.kitBaseName+' · '+money(kb)+'\n'+ids.map(function(k){return title[k]+' · '+money(price[k])}).join('\n')+'\n'+L.kitTotal+': '+money(sum);
    store.set(KEY,on);
  };
  var setK=function(k,v){on[k]=v;if(v)needs[k].forEach(function(n){if((n in on)&&!on[n])setK(n,true)});else Object.keys(needs).forEach(function(o){if(on[o]&&needs[o].indexOf(k)>=0)setK(o,false)})};
  inputs.forEach(function(x){x.addEventListener('change',function(){setK(x.dataset.k,x.checked);applyK(x.checked?x.dataset.k:'')})});
  var open=function(v){if(!panel)return;panel.hidden=!v;pill.setAttribute('aria-expanded',String(v));pill.hidden=v};
  if(pill)pill.addEventListener('click',function(){open(true)});
  var xb=$('kd-x');if(xb)xb.addEventListener('click',function(){open(false)});
  addEventListener('keydown',function(e){if(e.key!=='Escape')return;if(panel&&!panel.hidden)open(false);if(cartBox&&!cartBox.hidden)cartOpen(false)});
  var rs=$('kd-reset');if(rs)rs.addEventListener('click',function(){Object.keys(price).forEach(function(k){on[k]=!!def[k]});applyK('')});
  var cp=$('kd-copy');if(cp)cp.addEventListener('click',function(){try{navigator.clipboard.writeText(root.dataset.kit).then(function(){var o=cp.textContent;cp.textContent=L.copied;setTimeout(function(){cp.textContent=o},1400)})}catch(e){}});
  applyK('');
}
})();
