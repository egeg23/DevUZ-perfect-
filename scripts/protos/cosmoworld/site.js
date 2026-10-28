(function(){
'use strict';
/* Cosmo World. Прокрутку только читаем: ни scrollTo, ни preventDefault на
   колесе (proto-master §2). Двигаем transform и opacity. Модели нет. */
var d=document,W=window,root=d.documentElement,K=JSON.parse(d.getElementById('cw-data').textContent);
var $=function(s,r){return (r||d).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))};
var REDUCED=false;try{REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
function cl(x){return x<0?0:x>1?1:x}
function sm(x){x=cl(x);return x*x*(3-2*x)}
function pad(n,w){n=String(n);while(n.length<(w||2))n='0'+n;return n}
function inView(el,cb,th){if(!('IntersectionObserver' in W)){cb(true);return}new IntersectionObserver(function(es){es.forEach(function(e){cb(e.isIntersecting,e)})},{threshold:th||.2}).observe(el)}

/* ── Шапка: прячется при любой прокрутке, возвращается через 3 с ────── */
var top=$('.top'),dock=$('.dock'),sc=$('.sc'),IDLE=3000,idleT=0;
function headIdle(){if(!top)return;clearTimeout(idleT);
  if(!top.contains(d.activeElement))top.classList.add('hide');
  idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}
function headTone(){if(!top||!sc)return;var r=sc.getBoundingClientRect(),inScene=r.bottom>72;
  top.classList.toggle('lt',!inScene);top.classList.toggle('dk',inScene&&r.top<-40)}
addEventListener('scroll',function(){headIdle();headTone()},{passive:true});headTone();
var ptSec=$('#partner');
if(dock&&ptSec)inView(ptSec,function(v){dock.classList.toggle('off',v)},.05);

/* ── Сцена: пролёт камеры по прокрутке ─────────────────────────────────
   Компьютер: кадры трёх переходов (зашифрованы, ключ по ссылке макета).
   Телефон: четыре ключевых кадра 9:16 сменяют друг друга с наездом.
   Кадры качаются сжатыми; распакованных в памяти не больше MAXB. */
if(sc){
  var cv=$('.sc-cv',sc),cx=cv.getContext('2d'),poster=$('.sc-poster',sc),caps=$$('.sc-cap',sc),steps=$$('.sc-steps i',sc),load=$('.sc-load',sc),nEl=$('b',load),bar=$('u',load);
  var DESK=false;try{DESK=matchMedia('(min-width: 900px) and (orientation: landscape)').matches}catch(e){}
  var F=DESK?K.scene.d:K.scene.m,raw=[],bm={},bmN=[],MAXB=12,ready=false,want=0,cur=0,raf=0,dpr=Math.min(W.devicePixelRatio||1,2);
  var SEG=(K.scene.d-1)/3,HOLD=.045;
  /* Ключевые кадры — на 0, 1/3, 2/3 и 1: около них камера стоит, подписи читаются. */
  function frameAt(p){if(!DESK)return p*3;var k=Math.min(2,Math.floor(p*3)),a=k/3+(k?HOLD:0),b=(k+1)/3-(k<2?HOLD:0);return (k+cl((p-a)/(b-a)))*SEG}
  function prog(){var r=sc.getBoundingClientRect(),span=r.height-innerHeight;return span>0?cl(-r.top/span):0}
  function size(){cv.width=Math.round(cv.clientWidth*dpr);cv.height=Math.round(cv.clientHeight*dpr)}
  function want4(i){if(bm[i]||bm[i]===0||!raw[i]||!W.createImageBitmap)return;bm[i]=0;
    createImageBitmap(new Blob([raw[i]],{type:'image/webp'})).then(function(im){bm[i]=im;bmN.push(i);
      while(bmN.length>MAXB){var o=bmN.shift();if(Math.abs(o-cur)>3&&bm[o]&&bm[o].close){bm[o].close();delete bm[o]}else bmN.push(o)}
      if(!raf)raf=requestAnimationFrame(loop)},function(){delete bm[i]})}
  function cover(im,a,z){var cw=cv.width,ch=cv.height,s=Math.max(cw/im.width,ch/im.height)*(z||1),w=im.width*s,h=im.height*s;cx.globalAlpha=a;cx.drawImage(im,(cw-w)*.6,(ch-h)*.5,w,h)}
  function nearest(i){for(var k=0;k<F;k++){if(bm[i-k])return bm[i-k];if(bm[i+k])return bm[i+k]}return null}
  function draw(){var f=frameAt(cur),i=Math.floor(f),t=f-i;
    for(var k=-2;k<=3;k++)want4(Math.max(0,Math.min(F-1,i+k)));
    cx.globalAlpha=1;
    if(DESK){var a=bm[i]||nearest(i);if(!a)return;cover(a,1);var b=bm[i+1];if(b&&t>.02)cover(b,t)}
    else{var A=bm[i]||nearest(i);if(!A)return;cover(A,1,1+.06*t);var B=bm[Math.min(F-1,i+1)];if(B&&i+1<F){var k2=sm((t-.5)/.5);if(k2>0)cover(B,k2,1)}}
    cx.globalAlpha=1}
  function capA(p,c,w){var x=Math.abs(p-c);return 1-sm((x-w)/.06)}
  function paint(p){
    var C=[[0,.07],[1/3,.06],[2/3,.06],[1,.07]];
    caps.forEach(function(el,i){var a=i===0?1-sm((p-.07)/.06):i===3?sm((p-.88)/.06):capA(p,C[i][0],C[i][1]);
      el.style.opacity=a.toFixed(3);el.style.transform='translateY('+((1-a)*24).toFixed(1)+'px)';el.classList.toggle('on',a>.5)});
    steps.forEach(function(s,i){s.classList.toggle('on',p>=i/3-.05)});
    if(!ready)poster.style.transform='scale('+(1+p*.08).toFixed(4)+')';
    sc.classList.toggle('moved',p>.02)}
  function loop(){raf=0;var dl=want-cur;cur=Math.abs(dl)<.0005?want:cur+dl*.18;if(ready)draw();paint(cur);if(cur!==want)raf=requestAnimationFrame(loop)}
  function poke(){want=prog();if(!raf)raf=requestAnimationFrame(loop)}
  function done(){load.classList.add('ok')}
  if(REDUCED){done();paint(0)}
  else{
    addEventListener('scroll',poke,{passive:true});addEventListener('resize',function(){if(ready)size();poke()});poke();
    var c=navigator.connection;
    if(!W.crypto||!crypto.subtle||!W.createImageBitmap||(c&&c.saveData))done();
    else if(d.readyState==='complete')setTimeout(loadScene,300);else addEventListener('load',function(){setTimeout(loadScene,300)});
  }
  /* Кадры: 12 байт nonce + AES-GCM; ключ — app/proto/[token]/promo/scene. */
  function loadScene(){
    var got=0,ok=0;
    function step(){got++;var k=got/F;nEl.textContent=Math.floor(k*100);bar.style.transform='scaleX('+k.toFixed(3)+')';
      if(got===F){done();if(ok>=F*.9){ready=true;size();sc.classList.add('cv');cur=want=prog();draw();paint(cur)}}}
    fetch(K.base+'/promo/scene',{credentials:'same-origin'}).then(function(r){if(!r.ok)throw 0;return r.arrayBuffer()})
    .then(function(b){return crypto.subtle.importKey('raw',b,'AES-GCM',false,['decrypt'])})
    .then(function(key){
      var q=[],i;for(i=0;i<F;i++)q.push(i);
      function next(){var j=q.shift();if(j==null)return;
        var name=DESK?'d'+pad(j,3):'m'+(j+1);
        fetch(K.img+'/seq/'+name+'.bin').then(function(r){if(!r.ok)throw 0;return r.arrayBuffer()})
        .then(function(buf){return crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(buf,0,12)},key,new Uint8Array(buf,12))})
        .then(function(x){raw[j]=x;ok++;step();next()},function(){step();next()})}
      for(i=0;i<4;i++)next()})
    .catch(done)}
}

/* ── Появление блоков ───────────────────────────────────────────────── */
$$('.mv').forEach(function(el){if(REDUCED){el.classList.add('in');return}inView(el,function(v){if(v)el.classList.add('in')},.15)});

/* ── Цифры отсчитываются, когда видны ───────────────────────────────── */
$$('[data-n]').forEach(function(el){var to=+el.getAttribute('data-n'),suf=el.getAttribute('data-s')||'',sep=K.sep,fired=false;
  function fmt(v){var s=String(Math.round(v));return (v>=1000?s.replace(/\B(?=(\d{3})+(?!\d))/g,sep):s)+suf}
  if(REDUCED){el.textContent=fmt(to);return}el.textContent=fmt(0);
  inView(el,function(v){if(!v||fired)return;fired=true;var t0=0;function f(now){if(!t0)t0=now;var k=cl((now-t0)/1400);el.textContent=fmt(to*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(f)}requestAnimationFrame(f)},.5)});

/* ── Лёд под пальцем: блик идёт за курсором ─────────────────────────── */
$$('.ice').forEach(function(el){el.addEventListener('pointermove',function(e){var r=el.getBoundingClientRect();el.style.setProperty('--mx',(e.clientX-r.left)+'px');el.style.setProperty('--my',(e.clientY-r.top)+'px');el.style.setProperty('--glow','1')});el.addEventListener('pointerleave',function(){el.style.setProperty('--glow','0')})});

/* ── Мессенджер компании: готовый текст ─────────────────────────────── */
var toastT=0;
function toast(t){var el=$('#toast');if(!el)return;el.textContent=t;el.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){el.classList.remove('on')},2600)}
function wa(text){return 'https://wa.me/'+K.wa+'?text='+encodeURIComponent(text)}
function copy(t){try{navigator.clipboard.writeText(t)}catch(e){}}
$$('[data-tg]').forEach(function(a){a.addEventListener('click',function(){var t=a.getAttribute('data-tg');if(t){copy(t);toast(K.t.copied)}})});

/* ── Бренды: фильтр, поиск, окно бренда ─────────────────────────────── */
var grid=$('.br-grid');
if(grid){
  var items=$$('li',grid),chips=$$('.chip'),q=$('#br-q'),empty=$('.br-empty'),cat='all',dlg=$('#br-dlg'),last=null;
  function apply(){var s=(q.value||'').trim().toLowerCase(),n=0;
    items.forEach(function(li){var ok=(cat==='all'||li.getAttribute('data-cat').indexOf(cat)>=0)&&(!s||li.getAttribute('data-q').indexOf(s)>=0);li.hidden=!ok;if(ok)n++});
    empty.hidden=n>0}
  chips.forEach(function(c){c.addEventListener('click',function(){cat=c.getAttribute('data-c');chips.forEach(function(x){x.setAttribute('aria-pressed',String(x===c))});apply()})});
  q.addEventListener('input',apply);
  function openB(i){var b=K.brands[i];last=d.activeElement;
    $('h3',dlg).textContent=b.name;var ph=$('.dlg-ph',dlg);ph.src=b.img;ph.alt=b.name;$('.or',dlg).textContent=b.origin;$('.ds',dlg).textContent=b.text;
    $('[data-pdf]',dlg).href=b.pdf;$('[data-price]',dlg).href=wa(b.ask);
    dlg.hidden=false;requestAnimationFrame(function(){dlg.classList.add('open')});$('.dlg-x',dlg).focus()}
  function closeB(){dlg.classList.remove('open');setTimeout(function(){dlg.hidden=true},300);if(last)last.focus()}
  $$('.br',grid).forEach(function(b){b.addEventListener('click',function(){openB(+b.getAttribute('data-i'))})});
  $('.dlg-x',dlg).addEventListener('click',closeB);
  dlg.addEventListener('click',function(e){if(e.target===dlg)closeB()});
  d.addEventListener('keydown',function(e){if(e.key==='Escape'&&!dlg.hidden)closeB()});
}

/* ── Склад: точка бежит по пути заказа ─────────────────────────────── */
var pl=$('.pulse i');
if(pl&&!REDUCED){var pv=false,pr=0,p0=0;var path=$('.path');
  function pLoop(now){pr=0;if(!pv)return;if(!p0)p0=now;var k=((now-p0)/3600)%1,wide=innerWidth>=900,L=wide?path.clientWidth:path.clientHeight;
    pl.style.transform=wide?'translateX('+(k*L).toFixed(1)+'px)':'translateY('+(k*L).toFixed(1)+'px)';pr=requestAnimationFrame(pLoop)}
  inView(path,function(v){pv=v;if(v&&!pr)pr=requestAnimationFrame(pLoop)})}

/* ── Карта: регионы загораются по очереди, дуги из Ташкента ────────── */
var map=$('.map');
if(map){
  var gs=$$('.rg-g',map),arcs=$$('.arc',map),dots=$$('.dot',map),card=$('.cov-card'),btns=$$('.rg-list button'),mVis=false,mr=0,m0=0,auto=!REDUCED,lit=0,litT=0;
  function setR(i){gs.forEach(function(g,j){g.classList.toggle('cur',j===i)});btns.forEach(function(b,j){b.setAttribute('aria-pressed',String(j===i))});
    var r=K.regions[i];$('.no',card).textContent=pad(i+1)+' / '+pad(gs.length);$('h3',card).textContent=r.name;$('a',card).href=wa(r.ask)}
  function pick(i){auto=false;setR(i)}
  gs.forEach(function(g,i){g.addEventListener('click',function(){pick(i)});g.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();pick(i)}})});
  btns.forEach(function(b,i){b.addEventListener('click',function(){pick(i)})});
  function light(){if(lit>=gs.length){clearInterval(litT);return}gs[lit].classList.add('on');if(arcs[lit])arcs[lit].classList.add('on');lit++}
  function mLoop(now){mr=0;if(!mVis)return;if(!m0)m0=now;
    dots.forEach(function(dt,i){var a=arcs[i];if(!a||!a.classList.contains('on'))return;var L=a.getTotalLength(),k=((now-m0)/2800+i*.137)%1,pt=a.getPointAtLength(L*k);dt.setAttribute('transform','translate('+pt.x.toFixed(1)+' '+pt.y.toFixed(1)+')');dt.style.opacity=String((Math.sin(k*Math.PI)).toFixed(2))});
    mr=requestAnimationFrame(mLoop)}
  setR(13);
  if(REDUCED){gs.forEach(function(g){g.classList.add('on')});arcs.forEach(function(a){a.classList.add('on')})}
  else inView(map,function(v){mVis=v;if(v){if(!litT&&lit<gs.length)litT=setInterval(light,180);if(!mr)mr=requestAnimationFrame(mLoop)}},.3);
  var tick=0;setInterval(function(){if(!auto||!mVis||d.hidden||lit<gs.length)return;tick=(tick+1)%gs.length;setR(tick)},2600);
}

/* ── Стать партнёром: вкладки и заявка готовым текстом ─────────────── */
var form=$('#pt-form');
if(form){
  var tabs=$$('.tabs button'),kind=tabs[0].getAttribute('data-k');
  function setK(k){kind=k;tabs.forEach(function(t){var on=t.getAttribute('data-k')===k;t.setAttribute('aria-selected',String(on));t.tabIndex=on?0:-1});
    $$('[data-for]',form).forEach(function(f){f.hidden=f.getAttribute('data-for').split(' ').indexOf(k)<0})}
  tabs.forEach(function(t,i){t.addEventListener('click',function(){setK(t.getAttribute('data-k'))});
    t.addEventListener('keydown',function(e){var j=e.key==='ArrowRight'?i+1:e.key==='ArrowLeft'?i-1:-1;if(j<0&&e.key!=='ArrowLeft')return;j=(j+tabs.length)%tabs.length;tabs[j].focus();setK(tabs[j].getAttribute('data-k'))})});
  setK(kind);
  function text(){var L=[K.t.hello,K.t.kinds[kind]];
    $$('[data-for]',form).forEach(function(f){if(f.hidden)return;var el=$('input,select,textarea',f),v=(el.value||'').trim();if(v)L.push($('span',f).textContent+': '+v)});
    return L.join('\n')}
  form.addEventListener('submit',function(e){e.preventDefault();var n=$('[name="name"]',form),ph=$('[name="phone"]',form);
    if(!n.value.trim()){n.focus();toast(K.t.needName);return}if(!ph.value.trim()){ph.focus();toast(K.t.needPhone);return}
    W.open(wa(text()),'_blank','noopener')});
  $('[data-tgform]',form).addEventListener('click',function(){copy(text());toast(K.t.copied)});
}
})();
