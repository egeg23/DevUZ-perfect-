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
  /* Ход сцены по прокрутке: подлёт к подиуму, нырок сквозь облака на
     склад, короткий пролёт по проходу склада (наезд к точке схода), подъём
     над страной. Без остановок: внутри отрезка камера разгоняется и
     тормозит плавно. Компьютер берёт кадры роликов, телефон — четыре кадра
     9:16 с пролётом насквозь (камера влетает в кадр, из него выплывает
     следующий). fx, fy — куда летит камера в кадре. */
  var L=K.scene.d-1,Q=Math.round(L/3),Q2=Math.round(2*L/3);
  var PLAN=DESK?[[0,.26,'c',0,Q],[.26,.5,'c',Q,Q2],[.5,.68,'z',Q2,1.6,.5,.42],[.68,1,'c',Q2,L,1.6]]
    :[[0,.26,'x',0,1,.5,.62],[.26,.5,'x',1,2,.5,.92],[.5,.68,'z',2,1.9,.5,.37],[.68,1,'x',2,3,.5,.37,1.9]];
  function ease(t){return .5*t+.5*sm(t)}
  function at(p){for(var i=0;i<PLAN.length;i++){var g=PLAN[i];if(p<=g[1]||i===PLAN.length-1)return {g:g,t:ease(cl((p-g[0])/(g[1]-g[0])))}}}
  function prog(){var r=sc.getBoundingClientRect(),span=r.height-innerHeight;return span>0?cl(-r.top/span):0}
  function size(){cv.width=Math.round(cv.clientWidth*dpr);cv.height=Math.round(cv.clientHeight*dpr)}
  function want4(i){if(bm[i]||bm[i]===0||!raw[i]||!W.createImageBitmap)return;bm[i]=0;
    createImageBitmap(new Blob([raw[i]],{type:'image/webp'})).then(function(im){bm[i]=im;bmN.push(i);
      while(bmN.length>MAXB){var o=bmN.shift();if(Math.abs(o-cur)>3&&bm[o]&&bm[o].close){bm[o].close();delete bm[o]}else bmN.push(o)}
      if(!raf)raf=requestAnimationFrame(loop)},function(){delete bm[i]})}
  /* Кадр во весь экран с наездом z к точке (fx, fy) кадра. */
  function cover(im,a,z,fx,fy){var cw=cv.width,ch=cv.height,s0=Math.max(cw/im.width,ch/im.height),w0=im.width*s0,h0=im.height*s0,ox=(cw-w0)*.6,oy=(ch-h0)*.5;
    z=z||1;fx=fx==null?.5:fx;fy=fy==null?.5:fy;var px=ox+fx*w0,py=oy+fy*h0,w=w0*z,h=h0*z;cx.globalAlpha=a;cx.drawImage(im,px-fx*w,py-fy*h,w,h)}
  function nearest(i){for(var k=0;k<F;k++){if(bm[i-k])return bm[i-k];if(bm[i+k])return bm[i+k]}return null}
  function frame(f,a,z,fx,fy){var i=Math.floor(f),t=f-i,A=bm[i]||nearest(i);if(!A)return;cover(A,a,z,fx,fy);var B=bm[i+1];if(B&&t>.02)cover(B,a*t,z,fx,fy)}
  function draw(){var r=at(cur),g=r.g,t=r.t;cx.globalAlpha=1;
    if(DESK){var f=g[2]==='z'?g[3]:g[3]+(g[4]-g[3])*t;
      for(var k=-2;k<=3;k++)want4(Math.max(0,Math.min(F-1,Math.floor(f)+k)));
      if(g[2]==='z')frame(f,1,1+(g[4]-1)*t,g[5],g[6]);
      else if(g[5])frame(f,1,g[5]-(g[5]-1)*sm(cl(t/.45)),.5,.42);
      else frame(f,1,1)}
    else{for(var j=0;j<F;j++)want4(j);
      if(g[2]==='z'){var M=bm[g[3]];if(M)cover(M,1,1+(g[4]-1)*t,g[5],g[6])}
      else{var A=bm[g[3]],B=bm[g[4]],z0=g[7]||1;
        if(A)cover(A,1,z0+(z0*.55)*t*t,g[5],g[6]);
        var k2=sm((t-.32)/.55);if(B&&k2>0)cover(B,k2,1.28-.28*sm(t),.5,.5);
        /* Нырок в облака и подъём из склада — сквозь облачную дымку. */
        if(g[3]>=1){var fg=Math.sin(Math.PI*cl((t-.12)/.76));if(fg>0){cx.globalAlpha=fg*.5;cx.fillStyle='#aeb9c7';cx.fillRect(0,0,cv.width,cv.height)}}}}
    cx.globalAlpha=1}
  function capA(p,c,w){var x=Math.abs(p-c);return 1-sm((x-w)/.06)}
  function paint(p){
    var C=[[0,.07],[.26,.07],[.59,.08],[1,.07]];
    caps.forEach(function(el,i){var a=i===0?1-sm((p-.07)/.06):i===3?sm((p-.88)/.06):capA(p,C[i][0],C[i][1]);
      el.style.opacity=a.toFixed(3);el.style.transform='translateY('+((1-a)*24).toFixed(1)+'px)';el.classList.toggle('on',a>.5)});
    steps.forEach(function(s,i){s.classList.toggle('on',p>=[0,.22,.5,.84][i])});
    if(!ready)poster.style.transform='scale('+(1+p*.08).toFixed(4)+')';
    sc.classList.toggle('moved',p>.02)}
  function loop(){raf=0;var dl=want-cur;cur=Math.abs(dl)<.0005?want:cur+dl*.12;if(ready)draw();paint(cur);if(cur!==want)raf=requestAnimationFrame(loop)}
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
  var items=$$('li.gf-cell',grid),chips=$$('.chip'),q=$('#br-q'),empty=$('.br-empty'),cat='all',dlg=$('#br-dlg'),last=null;
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
  /* Стеклянные папки: размер по ячейке; наведение мышью роняет товары
     (CSS), на телефоне первое нажатие роняет, второе открывает окно. */
  var gfs=$$('[data-gf]',grid),FINE=false;try{FINE=matchMedia('(hover: hover) and (pointer: fine)').matches}catch(e){}
  function gfSize(){gfs.forEach(function(g){g.style.setProperty('--k',Math.min(1,g.parentNode.clientWidth/340).toFixed(4))})}
  function gfOpen(g,on){if(on)gfs.forEach(function(o){if(o!==g)o.removeAttribute('data-open')});if(on)g.setAttribute('data-open','');else g.removeAttribute('data-open')}
  gfSize();addEventListener('resize',gfSize);
  gfs.forEach(function(g){var hit=$('.gf-hit',g);
    hit.addEventListener('click',function(){if(FINE||g.hasAttribute('data-open'))openB(+hit.getAttribute('data-i'));else gfOpen(g,true)});
    var raf=0,px=0,py=0;function write(){raf=0;g.style.setProperty('--px',px.toFixed(3));g.style.setProperty('--py',py.toFixed(3))}
    g.addEventListener('pointermove',function(e){if(e.pointerType==='touch'||REDUCED)return;var r=g.getBoundingClientRect();px=(e.clientX-r.left)/r.width*2-1;py=(e.clientY-r.top)/r.height*2-1;if(!raf)raf=requestAnimationFrame(write)});
    g.addEventListener('pointerleave',function(){px=0;py=0;if(!raf)raf=requestAnimationFrame(write)})});
  d.addEventListener('pointerdown',function(e){gfs.forEach(function(g){if(g.hasAttribute('data-open')&&!g.contains(e.target))gfOpen(g,false)})});
  if('IntersectionObserver' in W&&!REDUCED){var gio=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.setAttribute('data-in','');gio.unobserve(e.target)}})},{threshold:.25});gfs.forEach(function(g){gio.observe(g)})}
  else gfs.forEach(function(g){g.setAttribute('data-in','')});
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

/* ── Карта: когда видна, из Ташкента вылетают линии и летят во все
   концы страны; светящаяся голова на конце, область загорается, когда
   линия долетела; последняя — пунктир в Бишкек. Потом по дугам бегут
   точки. Линия растёт пересчётом пути (часть кривой Безье), без CSS. ── */
var map=$('.map');
if(map){
  var gs=$$('.rg-g',map),arcs=$$('.arc',map),dots=$$('.dot',map),card=$('.cov-card'),btns=$$('.rg-list button'),mVis=false,mr=0,m0=0,auto=!REDUCED,flown=false,landed=0;
  var P=arcs.map(function(a){var n=a.getAttribute('d').match(/-?[\d.]+/g).map(Number);return n});
  function part(n,t){var u=1-t,x=u*u*n[0]+2*u*t*n[2]+t*t*n[4],y=u*u*n[1]+2*u*t*n[3]+t*t*n[5];
    return {d:'M'+n[0]+' '+n[1]+'Q'+(n[0]+(n[2]-n[0])*t).toFixed(1)+' '+(n[1]+(n[3]-n[1])*t).toFixed(1)+' '+x.toFixed(1)+' '+y.toFixed(1),x:x,y:y}}
  function setR(i){gs.forEach(function(g,j){g.classList.toggle('cur',j===i)});btns.forEach(function(b,j){b.setAttribute('aria-pressed',String(j===i))});
    var r=K.regions[i];$('.no',card).textContent=pad(i+1)+' / '+pad(gs.length);$('h3',card).textContent=r.name;$('a',card).href=wa(r.ask)}
  function pick(i){auto=false;setR(i)}
  gs.forEach(function(g,i){g.addEventListener('click',function(){pick(i)});g.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();pick(i)}})});
  btns.forEach(function(b,i){b.addEventListener('click',function(){pick(i)})});
  /* Порядок вылета — от ближних к дальним, Бишкек последним. */
  var order=arcs.map(function(a,i){return i}).sort(function(a,b){if(arcs[a].classList.contains('kg'))return 1;if(arcs[b].classList.contains('kg'))return -1;var A=P[a],B=P[b];return Math.hypot(A[4]-A[0],A[5]-A[1])-Math.hypot(B[4]-B[0],B[5]-B[1])});
  var start={};order.forEach(function(i,k){start[i]=k*140});
  var FLY=900;
  function fly(now){if(!m0)m0=now;var all=true;
    arcs.forEach(function(a,i){var t=cl((now-m0-start[i])/FLY);if(t<1)all=false;if(t<=0)return;var e=1-Math.pow(1-t,3),q=part(P[i],e);a.setAttribute('d',q.d);a.classList.add('on');
      var dt=dots[i];if(dt){dt.setAttribute('transform','translate('+q.x.toFixed(1)+' '+q.y.toFixed(1)+')');dt.style.opacity=t<1?'1':'0'}
      if(t>=1&&!a.dataset.land){a.dataset.land='1';if(gs[i]&&!a.classList.contains('kg'))gs[i].classList.add('on');landed++}});
    if(all){flown=true;m0=0;return run(now)}mr=requestAnimationFrame(fly)}
  function run(now){mr=0;if(!mVis)return;if(!m0)m0=now;
    dots.forEach(function(dt,i){var a=arcs[i];if(!a)return;var n=P[i],k=((now-m0)/2800+i*.137)%1,q=part(n,k);dt.setAttribute('transform','translate('+q.x.toFixed(1)+' '+q.y.toFixed(1)+')');dt.style.opacity=String((Math.sin(k*Math.PI)).toFixed(2))});
    mr=requestAnimationFrame(run)}
  setR(13);
  if(REDUCED){gs.forEach(function(g){g.classList.add('on')});arcs.forEach(function(a){a.classList.add('on')})}
  else{arcs.forEach(function(a){a.setAttribute('d','M'+P[0][0]+' '+P[0][1])});gs[13].classList.add('on');
    inView(map,function(v){mVis=v;if(v&&!mr)mr=requestAnimationFrame(flown?run:fly)},.35)}
  var tick=13;setInterval(function(){if(!auto||!mVis||d.hidden||!flown)return;tick=(tick+1)%gs.length;setR(tick)},2600);
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
