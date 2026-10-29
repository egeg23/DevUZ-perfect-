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
   Кадры роликов (компьютеру 16:9, телефону 9:16) зашифрованы, ключ по
   ссылке макета; около 16 кадров на секунду ролика, соседние смешиваются.
   Ход: подлёт к подиуму → нырок сквозь облака на склад → пролёт по проходу
   склада (наезд к точке схода) → подъём над страной. Поверх — облака в три
   слоя с параллаксом, зерно, затемнение краёв. В конце страна темнеет, и
   поверх неё поднимаются стеклянные папки брендов (#brands внутри сцены).
   Прокрутку только читаем. Распакованных кадров не больше MAXB. */
if(sc){
  var cv=$('.sc-cv',sc),cx=cv.getContext('2d'),poster=$('.sc-poster',sc),caps=$$('.sc-cap',sc),steps=$$('.sc-steps i',sc),load=$('.sc-load',sc),nEl=$('b',load),bar=$('u',load);
  var run=$('.sc-run',sc),brd=$('.brd',sc),dark=$('.sc-dark',sc),clouds=$$('.cl',sc),capW=caps.map(function(c){return $$('.w>span',c)});
  var DESK=false;try{DESK=matchMedia('(min-width: 900px) and (orientation: landscape)').matches}catch(e){}
  var F=DESK?K.scene.d:K.scene.p,raw=[],bm={},bmN=[],MAXB=14,ready=false,want=0,cur=-1,drawn=-1,raf=0,vis=true,dpr=Math.min(W.devicePixelRatio||1,2);
  var L=F-1,Q=Math.round(L/3),Q2=Math.round(2*L/3),ZD=DESK?1.6:1.8,FY=DESK?.42:.38;
  var PLAN=[[0,.24,'c',0,Q],[.24,.46,'c',Q,Q2],[.46,.62,'z',Q2,ZD,.5,FY],[.62,1,'c',Q2,L,ZD]];
  function ease(t){return .5*t+.5*sm(t)}
  function at(p){for(var i=0;i<PLAN.length;i++){var g=PLAN[i];if(p<=g[1]||i===PLAN.length-1)return {g:g,t:ease(cl((p-g[0])/(g[1]-g[0])))}}}
  function prog(){var r=run.getBoundingClientRect();return r.height>0?cl((innerHeight-r.top)/r.height):0}
  function darkness(){if(!brd)return 0;return cl((innerHeight-brd.getBoundingClientRect().top)/(innerHeight*.85))}
  function size(){cv.width=Math.round(cv.clientWidth*dpr);cv.height=Math.round(cv.clientHeight*dpr);drawn=-1}
  function want4(i){if(bm[i]||bm[i]===0||!raw[i]||!W.createImageBitmap)return;bm[i]=0;
    createImageBitmap(new Blob([raw[i]],{type:'image/webp'})).then(function(im){bm[i]=im;bmN.push(i);
      var f=frameOf(cur);while(bmN.length>MAXB){var o=bmN.shift();if(Math.abs(o-f)>4&&bm[o]&&bm[o].close){bm[o].close();delete bm[o]}else{bmN.push(o);break}}
      drawn=-1},function(){delete bm[i]})}
  /* Кадр во весь экран с наездом z к точке (fx, fy) кадра. */
  function cover(im,a,z,fx,fy){var cw=cv.width,ch=cv.height,s0=Math.max(cw/im.width,ch/im.height),w0=im.width*s0,h0=im.height*s0,ox=(cw-w0)*.6,oy=(ch-h0)*.5;
    z=z||1;fx=fx==null?.5:fx;fy=fy==null?.5:fy;var px=ox+fx*w0,py=oy+fy*h0,w=w0*z,h=h0*z;cx.globalAlpha=a;cx.drawImage(im,px-fx*w,py-fy*h,w,h)}
  function nearest(i){for(var k=0;k<F;k++){if(bm[i-k])return bm[i-k];if(bm[i+k])return bm[i+k]}return null}
  function frameOf(p){var r=at(Math.max(0,p)),g=r.g;return g[2]==='z'?g[3]:g[3]+(g[4]-g[3])*r.t}
  function draw(){var r=at(cur),g=r.g,t=r.t,f=frameOf(cur),i=Math.floor(f),k=f-i,z=1,fx=.5,fy=FY;
    for(var j=-2;j<=4;j++)want4(Math.max(0,Math.min(F-1,i+j)));
    if(g[2]==='z')z=1+(g[4]-1)*t;else if(g[5])z=g[5]-(g[5]-1)*sm(cl(t/.45));
    /* Нужный кадр не пришёл — ближайший пришедший, а не первый. */
    if(!raw[i]){for(var q=1;q<F;q++){if(raw[i-q]){i=i-q;k=0;break}if(raw[i+q]){i=i+q;k=0;break}}want4(i)}
    var A=bm[i]||nearest(i);if(!A)return;cx.globalAlpha=1;cover(A,1,z,fx,fy);var B=bm[i+1];if(B&&k>.02)cover(B,k,z,fx,fy);cx.globalAlpha=1}
  function capA(p,c,w){var x=Math.abs(p-c);return 1-sm((x-w)/.06)}
  /* Облака: видны над облаками и в нырке, уходят на складе, снова
     пролетают при подъёме. Каждый слой со своей скоростью. */
  function cloudA(p){return Math.max(1-sm((p-.36)/.12),sm((p-.74)/.06)*(1-sm((p-.9)/.06)))}
  function paint(p,now){
    var dk=darkness(),ca=cloudA(p),H=innerHeight,Wd=innerWidth;
    var C=[[0,.07],[.24,.07],[.54,.07],[1,.07]];
    caps.forEach(function(el,i){var a=i===0?1-sm((p-.06)/.06):i===3?sm((p-.9)/.06):capA(p,C[i][0],C[i][1]);a*=1-cl(dk*2);
      el.style.opacity=a.toFixed(3);el.classList.toggle('on',a>.5);
      capW[i].forEach(function(w,j){var v=cl(a*1.7-j*.12);w.style.transform='translateY('+((1-sm(v))*112).toFixed(1)+'%)'})});
    steps.forEach(function(s,i){s.classList.toggle('on',p>=[0,.2,.46,.86][i])});
    clouds.forEach(function(c,i){var sp=[.55,1,1.7][i],y=(p<.6?-p:(.84-p)*1.6)*H*sp*.8,x=Math.sin(now/9000*sp+i*2.1)*Wd*.05,sc2=1+p*.35*sp;
      c.style.opacity=(ca*[.75,.6,.9][i]).toFixed(3);c.style.transform='translate3d('+x.toFixed(1)+'px,'+y.toFixed(1)+'px,0) scale('+sc2.toFixed(3)+')'});
    dark.style.opacity=(dk*.66).toFixed(3);load.style.opacity=dk>0?'0':'';
    if(!ready)poster.style.transform='scale('+(1+p*.08).toFixed(4)+')';
    sc.classList.toggle('moved',p>.02)}
  function loop(now){raf=0;var dl=want-cur;cur=cur<0||Math.abs(dl)<.0004?want:cur+dl*.12;
    if(ready&&cur!==drawn){draw();drawn=cur}paint(cur,now||0);if(vis)raf=requestAnimationFrame(loop)}
  function poke(){want=prog();if(!raf&&vis)raf=requestAnimationFrame(loop)}
  function done(){load.classList.add('ok')}
  if(REDUCED){done();want=cur=0;paint(0,0)}
  else{
    addEventListener('scroll',poke,{passive:true});addEventListener('resize',function(){if(ready)size();poke()});
    if('IntersectionObserver' in W)new IntersectionObserver(function(es){vis=es[0].isIntersecting;if(vis)poke()}).observe(sc);
    poke();
    var c=navigator.connection;
    if(!W.crypto||!crypto.subtle||!W.createImageBitmap||(c&&c.saveData))done();
    else if(d.readyState==='complete')setTimeout(loadScene,300);else addEventListener('load',function(){setTimeout(loadScene,300)});
  }
  /* Кадры пачками по K.scene.pack (12 байт nonce + AES-GCM; внутри: число
     кадров, длины, WebP подряд); ключ — app/proto/[token]/promo/scene.
     Сцена стартует с первой пачкой; вторая — конец сцены (ночная страна),
     дальше качается пачка ближе всего к месту прокрутки, по две сразу; молчащая 25 с — заново, потом пропуск.
     Счёт до 100% в углу, прокрутку не держит. */
  function loadScene(){
    var PK=K.scene.pack,NP=Math.ceil(F/PK),left=[],tries={},got=0,busy=0,key=null,i;
    for(i=0;i<NP;i++)left.push(i);
    function show(){nEl.textContent=Math.floor(got/NP*100);bar.style.transform='scaleX('+(got/NP).toFixed(3)+')';if(got>=NP)done()}
    function start(){if(ready)return;ready=true;size();sc.classList.add('cv');drawn=-1;poke()}
    var first=0;
    function pick(){if(first){first--;return left.shift()}var f=frameOf(Math.max(0,cur))/PK,bi=0,bd=1e9;left.forEach(function(k,j){var dd=k+.5-f;dd=dd<0?-dd*1.6:dd;if(dd<bd){bd=dd;bi=j}});return left.splice(bi,1)[0]}
    function unpack(k,buf){var v=new DataView(buf),n=v.getUint32(0,true),o=4+4*n;for(var j=0;j<n;j++){var len=v.getUint32(4+4*j,true);raw[k*PK+j]=buf.slice(o,o+len);o+=len}}
    function next(){if(!left.length)return;var k=pick();busy++;
      var ac=W.AbortController?new AbortController():null,tm=setTimeout(function(){if(ac)ac.abort()},25000);
      fetch(K.img+'/seq/'+(DESK?'d':'p')+pad(k,2)+'.bin',ac?{signal:ac.signal}:{}).then(function(r){if(!r.ok)throw 0;return r.arrayBuffer()})
      .then(function(buf){return crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(buf,0,12)},key,new Uint8Array(buf,12))})
      .then(function(x){clearTimeout(tm);unpack(k,x);got++;busy--;show();start();drawn=-1;poke();next()},
        function(){clearTimeout(tm);busy--;tries[k]=(tries[k]||0)+1;if(tries[k]<3)left.push(k);else{got++;show()}next()})}
    fetch(K.base+'/promo/scene',{credentials:'same-origin'}).then(function(r){if(!r.ok)throw 0;return r.arrayBuffer()})
    .then(function(b){return crypto.subtle.importKey('raw',b,'AES-GCM',false,['decrypt'])})
    .then(function(k){key=k;left.splice(left.indexOf(NP-1),1);left.unshift(0);left.splice(1,0,NP-1);left=left.filter(function(v,j,a){return a.indexOf(v)===j});first=2;next();next()})
    .catch(done)}
  /* Папки над ночной страной плывут с разной скоростью (параллакс). */
  if(brd&&!REDUCED){var cells=$$('.gf-cell',brd),pr=0;
    function par(){pr=0;var H=innerHeight;cells.forEach(function(c,i){var r=c.getBoundingClientRect();if(r.bottom<-200||r.top>H+200)return;var k=[.05,.13,.21][i%3],y=(r.top+r.height/2-H/2)*k;c.style.transform='translate3d(0,'+(-y).toFixed(1)+'px,0)'})}
    addEventListener('scroll',function(){if(!pr)pr=requestAnimationFrame(par)},{passive:true});par()}
}

/* ── Лента фактов: едет сама, прокрутка разгоняет и разворачивает ───── */
var vt=$('.velo-t');
if(vt&&!REDUCED){var vx=0,vv=0,dir=-1,ly=scrollY,lt=0,vOn=false;
  function vstep(now){if(!vOn)return;var dt=lt?Math.min(50,now-lt):16;lt=now;var dy=scrollY-ly;ly=scrollY;if(dy)dir=dy>0?-1:1;vv+=(Math.abs(dy)*.9-vv)*.1;
    vx+=dir*(.6+vv*.25)*dt/16;var w=vt.scrollWidth/3;if(vx<=-w)vx+=w;if(vx>0)vx-=w;vt.style.transform='translate3d('+vx.toFixed(1)+'px,0,0)';requestAnimationFrame(vstep)}
  inView(vt,function(v){vOn=v;lt=0;if(v)requestAnimationFrame(vstep)},0)}

/* ── Заголовки разделов — словами из-под маски ─────────────────────── */
$$('.sec-h .h2').forEach(function(h){var n=0;
  (function walk(el){Array.prototype.slice.call(el.childNodes).forEach(function(nd){
    if(nd.nodeType===3){var parts=nd.textContent.split(/(\s+)/),fr=d.createDocumentFragment();parts.forEach(function(w){if(!w)return;if(/^\s+$/.test(w)){fr.appendChild(d.createTextNode(w));return}var o=d.createElement('span');o.className='sw';var i=d.createElement('span');i.textContent=w;i.style.setProperty('--i',n++);o.appendChild(i);fr.appendChild(o)});nd.parentNode.replaceChild(fr,nd)}
    else if(nd.nodeType===1)walk(nd)})})(h)});

/* ── Текст о компании загорается словами по прокрутке ──────────────── */
$$('[data-reveal]').forEach(function(p){var ws=p.textContent.split(/\s+/).filter(Boolean);p.textContent='';
  var sp=ws.map(function(w,i){var s=d.createElement('span');s.className='rv-w';s.textContent=w;p.appendChild(s);if(i<ws.length-1)p.appendChild(d.createTextNode(' '));return s});
  if(REDUCED)return;var rr=0;
  function upd(){rr=0;var r=p.getBoundingClientRect(),k=cl((innerHeight*.85-r.top)/(r.height+innerHeight*.35));var n=Math.round(k*sp.length);sp.forEach(function(s,i){s.classList.toggle('on',i<n)})}
  addEventListener('scroll',function(){if(!rr)rr=requestAnimationFrame(upd)},{passive:true});upd()});

/* ── Фон склада плывёт медленнее страницы ──────────────────────────── */
var whi=$('.wh-bg img');
if(whi&&!REDUCED){var wr=0;function wpar(){wr=0;var r=whi.parentNode.parentNode.getBoundingClientRect(),k=(r.top+r.height/2-innerHeight/2)/innerHeight;whi.style.transform='translate3d(0,'+(k*-12).toFixed(2)+'%,0) scale(1.2)'}
  addEventListener('scroll',function(){if(!wr)wr=requestAnimationFrame(wpar)},{passive:true});wpar()}

/* ── Главная кнопка тянется за курсором ────────────────────────────── */
try{if(!REDUCED&&matchMedia('(hover: hover) and (pointer: fine)').matches)$$('.btn-a').forEach(function(b){
  b.addEventListener('pointermove',function(e){var r=b.getBoundingClientRect();b.style.transform='translate('+((e.clientX-r.left-r.width/2)*.25).toFixed(1)+'px,'+((e.clientY-r.top-r.height/2)*.35).toFixed(1)+'px)'});
  b.addEventListener('pointerleave',function(){b.style.transform=''})})}catch(e){}

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
