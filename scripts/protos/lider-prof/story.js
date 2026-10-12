(function(){
'use strict';
/* story: история студии на главной, по движку нашего Engelberg v2
   (globalex/engelberg/v2) и Enotmebel. Одна липкая сцена, слои во весь
   экран: у каждого свой вход, выход и своя камера; подписи выплывают снизу
   слева, глава и полоса прогресса внизу. Масштаб истории — как у работы
   студии: генплан с высоты → чертёж фасада становится зданием → внутрь, в
   спортзал и зал детского сада → махалля сверху → пролёт сквозь проекты →
   команда и заказчики → карта страны.
   Время истории в экранах прокрутки: t = 6.5 значит «пролистано шесть с
   половиной высот окна». Каждый кадр — функция от t, сцену можно листать
   вперёд и назад. Прокрутка браузерная: мы её только читаем, пишем
   transform и opacity в один requestAnimationFrame и только пока сцена на
   экране. Снимки глав грузятся очередью по два, по порядку глав. */
var d=document,root=d.documentElement,el=d.getElementById('story');
if(!el)return;
var reduce=false;try{reduce=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
if(reduce||root.classList.contains('k-no-story')){root.classList.add('st-calm');return}
root.classList.add('st-live');

var clamp=function(v,a,b){a=a==null?0:a;b=b==null?1:b;return Math.min(b,Math.max(a,v))};
var seg=function(t,a,b){return clamp((t-a)/(b-a))};
var lerp=function(a,b,x){return a+(b-a)*x};
var inOut=function(x){return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2};
var out=function(x){return 1-Math.pow(1-x,3)};
var win=function(t,a,b,f){f=f||.5;return Math.min(seg(t,a,a+f),1-seg(t,b-f,b))};

var END=+el.dataset.end||28;
var track=el.querySelector('.st-track');
var N={};[].forEach.call(el.querySelectorAll('[data-k]'),function(n){N[n.dataset.k]=n});
var beats=[].map.call(el.querySelectorAll('[data-beat]'),function(n){var ab=n.dataset.beat.split(' ').map(Number);return {el:n,a:ab[0],b:ab[1],lines:[].slice.call(n.querySelectorAll('[data-line]'))}});
var flys=[].slice.call(el.querySelectorAll('[data-fly]'));
var chapters=JSON.parse(el.dataset.chapters||'[]');
var hud=el.querySelector('[data-hud]'),bar=el.querySelector('[data-bar]');
var heroImg=N.heroCam&&N.heroCam.querySelector('img');

var W=1,H=1,mobile=false,lastT=-1,chapter=-1;
var last=new Map();
function write(n,tf,o){
  if(!n)return;var prev=last.get(n)||{};
  if(tf!=null&&prev.tf!==tf){n.style.transform=tf;prev.tf=tf}
  if(o!=null){o=clamp(o);if(prev.o===undefined||Math.abs(prev.o-o)>.001||(o===0)!==(prev.o===0)){n.style.opacity=o.toFixed(3);n.style.visibility=o<=.001?'hidden':'visible';prev.o=o}}
  last.set(n,prev);
}
function fade(k,o){write(N[k],null,o)}
function dash(k,v){var n=N[k];if(!n)return;var s=(1-clamp(v)).toFixed(4),p=last.get(n)||{};if(p.dash!==s){n.style.strokeDashoffset=s;p.dash=s;last.set(n,p)}}
function on(k,v){var n=N[k];if(n)n.classList.toggle('on',!!v)}

/* ── Снимки глав: очередью по два, по порядку глав. Не ответил сервер —
   ещё две попытки с паузой (урок enotmebel, 11.10.2026: залп картинок
   nginx отбивает с 429). На телефоне — лёгкий вариант data-src-m. ── */
var queue=[].slice.call(el.querySelectorAll('.st-stage img[data-src]')),busy=0;
function pump(){
  while(busy<2&&queue.length){
    var im=queue.shift();busy++;
    (function(im){var tries=0,src=(mobile&&im.dataset.srcM)||im.dataset.src;
      var done=function(){busy--;im.classList.add('ok');pump()};
      im.onload=done;
      im.onerror=function(){if(tries<2){tries++;setTimeout(function(){im.src=src+'?r='+tries},900*tries)}else done()};
      im.src=src})(im);
  }
}

/* ── Камера: вписать прямоугольник кадра [x, y, w, h] в пикселях снимка
   во весь экран с обрезкой по краям. На телефоне увеличение не больше
   одного пикселя снимка на точку, чтобы кадр не терял резкость. ── */
function cam(IW,IH,r){var s=Math.max(W/r[2],H/r[3]);s=Math.max(s,Math.max(W/IW,H/IH));if(mobile)s=Math.min(s,Math.max(1.4,Math.max(W/IW,H/IH)));
  var cx=r[0]+r[2]/2,cy=r[1]+r[3]/2,x=W/2-cx*s,y=H/2-cy*s;
  x=Math.min(0,Math.max(W-IW*s,x));y=Math.min(0,Math.max(H-IH*s,y));return {s:s,x:x,y:y}}
function mix(a,b,k){return {s:Math.exp(lerp(Math.log(a.s),Math.log(b.s),k)),x:lerp(a.x,b.x,k),y:lerp(a.y,b.y,k)}}
var tf=function(c){return 'translate3d('+c.x.toFixed(1)+'px,'+c.y.toFixed(1)+'px,0) scale('+c.s.toFixed(4)+')'};
/* Снимок генплана 2560 × 1440: издалека весь участок, потом ближе к центру. */
var HW=2560,HH=1440,RECT={far:[0,0,2560,1440],farM:[900,0,980,1440],near:[820,380,1040,640],nearM:[1060,300,560,900]};

/* ── Пролёт сквозь проекты: у каждой карточки своя глубина, камера едет
   вперёд, карточка растёт по перспективе и уходит за край. ── */
var FX=[.62,.12,.78,.3,.7,.05,.55,.22,.82,.4],FY=[.02,-.12,.1,-.06,.12,-.1,.04,-.12,.08,-.04],MX=[-.5,.5,-.4,.45,-.5,.4,-.45,.5,-.4,.45];
function fly(t){
  var n=flys.length,cz=lerp(-.2,n*.82+.9,seg(t,15.9,21));
  for(var i=0;i<n;i++){var z=1+i*.82-cz;
    if(z<=.16||z>6){write(flys[i],null,0);continue}
    var s=(mobile?.5:.62)/z,x=(mobile?MX[i]*.7:FX[i])*W*.5/z*.9,y=FY[i]*H/z*(mobile?.35:.6);
    var o=Math.min(seg(z,6,4.2),1-seg(z,.62,.3));
    write(flys[i],'translate3d('+x.toFixed(1)+'px,'+y.toFixed(1)+'px,0) scale('+s.toFixed(4)+')',o);
    flys[i].style.zIndex=String(100-Math.round(z*10));
  }
}

/* Числа студии набегают: только текст, без пересчёта вёрстки вокруг. */
var cnts=[0,1,2,3].map(function(i){var n=N['cnt'+i];return n?{el:n,to:+n.dataset.count,v:-1}:null}).filter(Boolean);
function count(k){cnts.forEach(function(c,i){var q=out(seg(k,i*.08,.6+i*.08)),v=Math.round(c.to*q);if(v!==c.v){c.v=v;c.el.textContent=v+'+'}})}

function render(){
  var tr=track.getBoundingClientRect(),start=tr.top+scrollY;
  root.classList.toggle('st-in',tr.top<=0&&tr.bottom>=H);
  var t=clamp((scrollY-start)/H,0,END);
  if(Math.abs(t-lastT)<.0005)return;lastT=t;

  /* 0-1 · Первый экран и генплан: камера опускается к центру участка. */
  var A=cam(HW,HH,mobile?RECT.farM:RECT.far),B=cam(HW,HH,mobile?RECT.nearM:RECT.near);
  var c=mix(A,B,inOut(seg(t,1.8,4.2)));
  if(t<5.2){
    write(N.heroCam,tf(c),null);
    if(N.hs1){write(N.hs1,'translate3d('+(c.x+1280*c.s).toFixed(1)+'px,'+(c.y+640*c.s).toFixed(1)+'px,0)',win(t,2.5,4.4,.4))}
    if(N.hs2){write(N.hs2,'translate3d('+(c.x+(mobile?1180:980)*c.s).toFixed(1)+'px,'+(c.y+900*c.s).toFixed(1)+'px,0)',win(t,2.8,4.4,.4))}
    var sp=win(t,2.6,4.5,.45);write(N.spec,'translate3d(0,'+((1-sp)*24).toFixed(1)+'px,0)',sp);
  }
  fade('hero',1-seg(t,4.4,5));
  fade('hint',1-seg(t,0,.5));

  /* 2 · Чертёж становится зданием: окно с рендером едет по чертежу,
     линия на краю, этапы на стекле загораются по очереди. Только transform. */
  fade('draft',Math.min(seg(t,4.6,5.1),1-seg(t,8.9,9.4)));
  if(t>4.4&&t<9.6){
    var p=inOut(seg(t,5.5,8.3));
    write(N.drCam,'scale('+(1.1-.1*seg(t,4.6,9.2)).toFixed(4)+')',null);
    write(N.wipe,'translate3d('+((p-1)*100).toFixed(3)+'%,0,0)',null);
    write(N.wipeIn,'translate3d('+((1-p)*100).toFixed(3)+'%,0,0)',null);
    write(N.wline,'translate3d('+(p*W).toFixed(1)+'px,0,0)',p>0&&p<1?1:0);
    var sg=win(t,5.1,9,.45);write(N.stages,'translate3d(0,'+((1-sg)*24).toFixed(1)+'px,0)',sg);
    for(var i=0;i<5;i++)on('sg'+i,p>=i*.22+.02);
  }

  /* 3 · Внутри: камера идёт вглубь спортзала, потом зал детского сада. */
  fade('inside',Math.min(seg(t,9.1,9.6),1-seg(t,12.3,12.8)));
  if(t>8.9&&t<13){
    var k1=seg(t,9.1,11.4),k2=seg(t,10.8,12.8);
    write(N.inCam1,'scale('+(1+inOut(k1)*.32).toFixed(4)+')',1-seg(t,10.8,11.3));
    write(N.inCam2,'scale('+(1.16-.16*out(k2)).toFixed(4)+')',seg(t,10.8,11.3));
  }

  /* 4 · Ландшафт: махалля сверху медленно поворачивается и отдаляется. */
  fade('land',Math.min(seg(t,12.5,13),1-seg(t,15.3,15.8)));
  if(t>12.3&&t<16){var q=seg(t,12.5,15.8);write(N.ldRot,'rotate('+lerp(-9,9,q).toFixed(3)+'deg) scale('+lerp(1.3,1.08,out(q)).toFixed(4)+')',null)}

  /* 5 · Проекты */
  fade('fly',Math.min(seg(t,15.6,16.1),1-seg(t,20.8,21.4)));
  if(t>15.4&&t<21.6)fly(t);

  /* 6 · Команда: фон приближается, числа набегают, заказчики на стекле. */
  fade('team',Math.min(seg(t,21,21.5),1-seg(t,24.1,24.6)));
  if(t>20.8&&t<24.8){
    write(N.tmBg,'scale('+(1.14-.14*seg(t,21,24.6)).toFixed(4)+')',null);
    var nm=win(t,21.4,24.3,.45);write(N.nums,'translate3d(0,'+((1-nm)*24).toFixed(1)+'px,0)',nm);
    count(seg(t,21.5,22.8));
    var lg=win(t,22.2,24.3,.45);write(N.logos,'translate3d(0,'+((1-lg)*24).toFixed(1)+'px,0)',lg);
  }

  /* 7 · География: контур страны, линии из Ташкента к городам проектов. */
  fade('map',Math.min(seg(t,24.3,24.8),1-seg(t,27,27.5)));
  if(t>24.1&&t<27.7){dash('uz',seg(t,24.5,25.4));fade('ct0',seg(t,25,25.3));
    for(var r=0;r<7;r++){var ra=25.2+r*.16;dash('rt'+r,inOut(seg(t,ra,ra+.55)));fade('ct'+(r+1),seg(t,ra+.4,ra+.6))}}

  /* 8 · Финал */
  var e=seg(t,27.1,27.7);write(N.end,null,e);

  /* Подписи: выплывают снизу, строки догоняют друг друга, уходят вверх. */
  beats.forEach(function(b){
    var inn=b.a<0?1:seg(t,b.a,b.a+.6),op=seg(t,b.b-.5,b.b),o=Math.min(inn,1-op);
    write(b.el,'translate3d(0,'+((1-out(inn))*28-out(op)*28).toFixed(1)+'px,0)',o);
    b.el.classList.toggle('live',o>.5);
    if(o<=0)return;
    b.lines.forEach(function(l,i){var li=b.a<0?1:seg(t,b.a+.1*i,b.a+.1*i+.7);write(l,'translate3d(0,'+((1-out(li))*22).toFixed(1)+'px,0)',out(li))});
  });

  /* Глава и прогресс */
  var ci=0;while(ci+1<chapters.length&&t>=chapters[ci+1][0])ci++;
  if(ci!==chapter&&hud){chapter=ci;hud.textContent=('0'+ci).slice(-2)+' · '+chapters[ci][1]}
  if(bar)bar.style.transform='scaleX('+(t/END).toFixed(4)+')';
}

function measure(){
  var w=innerWidth,h=innerHeight;
  /* На телефоне высота прыгает с адресной строкой: мелкие изменения не считаем. */
  if(w===W&&Math.abs(h-H)<140)return;
  W=w;H=h;mobile=W<820||W<H;
  track.style.height=Math.round((END+1)*H)+'px';
  if(heroImg){heroImg.style.width=HW+'px';heroImg.style.height=HH+'px'}
  last.clear();lastT=-1;
}
measure();render();
/* Снимки глав — после первого экрана, чтобы он открылся быстрее. */
if(d.readyState==='complete')setTimeout(pump,300);else addEventListener('load',function(){setTimeout(pump,300)});

var act=false,raf=0;
function loop(){raf=0;if(!act)return;render();raf=requestAnimationFrame(loop)}
new IntersectionObserver(function(es){act=es[0].isIntersecting;if(!act)root.classList.remove('st-in');if(act&&!raf)raf=requestAnimationFrame(loop)}).observe(el);
addEventListener('resize',function(){measure();lastT=-1;render()});
})();
