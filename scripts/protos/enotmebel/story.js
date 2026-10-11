(function(){
'use strict';
/* story: история кресла на главной, по движку нашего Engelberg v2
   (globalex/engelberg/v2). Одна липкая сцена, слои во весь экран: у каждого
   свой вход, выход и своя камера; подписи выплывают снизу слева, глава и
   полоса прогресса внизу.
   Время истории в экранах прокрутки: t = 6.5 значит «пролистано шесть с
   половиной высот окна». Каждый кадр функция от t, поэтому сцену можно
   листать вперёд и назад, и при любой скорости она выглядит одинаково.
   Прокрутка браузерная: мы её только читаем, пишем transform и opacity в
   один requestAnimationFrame и только пока сцена на экране. Шарики
   наполнителя рисует canvas с учётом плотности пикселей экрана. */
var d=document,root=d.documentElement,el=d.getElementById('story');
if(!el)return;
var reduce=false;try{reduce=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
if(reduce){root.classList.add('st-calm');return}
root.classList.add('st-live');

var clamp=function(v,a,b){a=a==null?0:a;b=b==null?1:b;return Math.min(b,Math.max(a,v))};
var seg=function(t,a,b){return clamp((t-a)/(b-a))};
var lerp=function(a,b,x){return a+(b-a)*x};
var inOut=function(x){return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2};
var out=function(x){return 1-Math.pow(1-x,3)};
var win=function(t,a,b,f){f=f||.5;return Math.min(seg(t,a,a+f),1-seg(t,b-f,b))};

var END=+el.dataset.end||26;
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

/* ── Камера первого экрана: вписать прямоугольник кадра [x, y, w, h]
   (пиксели снимка 2560 × 1512) во весь экран с обрезкой по краям. На
   телефоне увеличение не больше одного пикселя снимка на точку экрана,
   чтобы кадр не терял резкость. ── */
var IW=2560,IH=1512;
function cover(r){var s=Math.max(W/r[2],H/r[3]);s=Math.max(s,Math.max(W/IW,H/IH));if(mobile)s=Math.min(s,Math.max(1,Math.max(W/IW,H/IH)));
  var cx=r[0]+r[2]/2,cy=r[1]+r[3]/2,x=W/2-cx*s,y=H/2-cy*s;
  x=Math.min(0,Math.max(W-IW*s,x));y=Math.min(0,Math.max(H-IH*s,y));return {s:s,x:x,y:y}}
function mixCam(a,b,k){return {s:Math.exp(lerp(Math.log(a.s),Math.log(b.s),k)),x:lerp(a.x,b.x,k),y:lerp(a.y,b.y,k)}}
var RECT={far:[0,0,2560,1512],farM:[880,40,1100,1472],bag:[980,700,1180,800],bagM:[1150,620,760,880]};

/* ── Шарики наполнителя: точки внутри внутреннего чехла, снизу вверх.
   Координаты — единицы рисунка груши (viewBox 40 40 520 580). ── */
var bc=N.beads,bx=bc&&bc.getContext('2d'),beads=[],bdpr=1,BW=0,BH=0;
var PEAR_IN='M300 98C250 98 216 146 199 210C177 292 135 362 125 444C117 506 175 552 300 552C425 552 483 506 475 444C465 362 423 292 401 210C384 146 350 98 300 98Z';
function makeBeads(){
  if(!bx||beads.length)return;
  var p=typeof Path2D==='function'?new Path2D(PEAR_IN):null;if(!p)return;
  var probe=d.createElement('canvas').getContext('2d'),R=7.2,dy=R*1.72,row=0;
  for(var y=548;y>100;y-=dy,row++){for(var x=110+(row%2)*R;x<490;x+=R*2){var jx=x+(Math.random()-.5)*2.4,jy=y+(Math.random()-.5)*2.4;if(probe.isPointInPath(p,jx,jy))beads.push({x:jx,y:jy,r:R*(.82+Math.random()*.22),s:Math.random()})}}
  /* Сыплются снизу вверх: порядок — по высоте, с разбросом. */
  beads.forEach(function(b){b.o=(552-b.y)/454*.82+b.s*.18});
}
function sizeBeads(){if(!bc)return;var r=bc.getBoundingClientRect();bdpr=Math.min(devicePixelRatio||1,3);BW=r.width;BH=r.height;bc.width=Math.max(1,Math.round(BW*bdpr));bc.height=Math.max(1,Math.round(BH*bdpr))}
var beadKey='';
function drawBeads(t){
  if(!bx||!BW)return;var k=seg(t,5.1,6.7),key=k.toFixed(3);if(key===beadKey)return;beadKey=key;
  var s=Math.min(BW/520,BH/580);bx.setTransform(bdpr*s,0,0,bdpr*s,(-40*s+(BW-520*s)/2)*bdpr,(-40*s+(BH-580*s)/2)*bdpr);
  bx.clearRect(0,0,600,700);
  for(var i=0;i<beads.length;i++){var b=beads[i],q=out(seg(k,b.o*.78,b.o*.78+.22));if(q<=0)continue;
    var y=b.y-(1-q)*(b.y+40);
    var gr=bx.createRadialGradient(b.x-b.r*.35,y-b.r*.4,b.r*.1,b.x,y,b.r);gr.addColorStop(0,'#ffffff');gr.addColorStop(1,'#c9cfdb');
    bx.globalAlpha=Math.min(1,q*2);bx.fillStyle=gr;bx.beginPath();bx.arc(b.x,y,b.r,0,6.2832);bx.fill()}
  bx.globalAlpha=1;
}

/* ── Пролёт сквозь модели: у каждой карточки своя глубина, камера едет
   вперёд, карточка растёт по перспективе и уходит за край. ── */
var FX=[.62,.12,.78,.3,.7,.05,.55,.22,.82,.4],FY=[.02,-.12,.1,-.06,.12,-.1,.04,-.12,.08,-.04],MX=[-.5,.5,-.4,.45,-.5,.4,-.45,.5,-.4,.45];
function fly(t){
  var n=flys.length,cz=lerp(-.2,n*.82+.9,seg(t,9.1,14.9));
  for(var i=0;i<n;i++){var z=1+i*.82-cz;
    if(z<=.16||z>6){write(flys[i],null,0);continue}
    var s=(mobile?.5:.62)/z,x=(mobile?MX[i]*.7:FX[i])*W*.5/z*.9,y=FY[i]*H/z*(mobile?.35:.6);
    var o=Math.min(seg(z,6,4.2),1-seg(z,.62,.3));
    write(flys[i],'translate3d('+x.toFixed(1)+'px,'+y.toFixed(1)+'px,0) scale('+s.toFixed(4)+')',o);
    flys[i].style.zIndex=String(100-Math.round(z*10));
  }
}

function render(){
  var tr=track.getBoundingClientRect(),start=tr.top+scrollY;
  root.classList.toggle('st-in',tr.top<=0&&tr.bottom>=H);
  var t=clamp((scrollY-start)/H,0,END);
  if(Math.abs(t-lastT)<.0005)return;lastT=t;

  /* 0-1 · Первый экран и «Садитесь как удобно»: кадр приближается к груше. */
  var A=cover(mobile?RECT.farM:RECT.far),B=cover(mobile?RECT.bagM:RECT.bag);
  var c=mixCam(A,B,inOut(seg(t,1.9,4.2)));
  if(N.heroCam)write(N.heroCam,'translate3d('+c.x.toFixed(1)+'px,'+c.y.toFixed(1)+'px,0) scale('+c.s.toFixed(4)+')',null);
  fade('hero',1-seg(t,4.3,4.9));
  if(N.hsBag){var hx=c.x+1500*c.s,hy=c.y+1090*c.s;write(N.hsBag,'translate3d('+hx.toFixed(1)+'px,'+hy.toFixed(1)+'px,0)',win(t,2.7,4.4,.4))}
  fade('hint',1-seg(t,0,.5));

  /* 2 · Внутри: контур, внутренний чехол, шарики, подписи, наполнители. */
  fade('inside',Math.min(seg(t,4.4,5),1-seg(t,8.9,9.4)));
  if(t>4.2&&t<9.6){
    dash('inOut',seg(t,4.6,5.3));dash('inIn',seg(t,4.9,5.6));
    drawBeads(t);
    fade('mk1',win(t,5.4,8.7,.35));fade('mk2',win(t,5.8,8.7,.35));fade('mk3',win(t,6.2,8.7,.35));
    var press=win(t,7.2,8.4,.45);
    write(N.inBox,'translate3d(0,0,0) scale('+(1+press*.05).toFixed(4)+','+(1-press*.09).toFixed(4)+')',null);
    var sp=win(t,7,9.1,.5);write(N.spec,'translate3d(0,'+((1-sp)*24).toFixed(1)+'px,0)',sp);
  }

  /* 3 · Модели */
  fade('fly',Math.min(seg(t,9,9.5),1-seg(t,14.6,15.2)));
  if(t>8.8&&t<15.4)fly(t);

  /* 4 · Ткани: образцы растут снизу по очереди. */
  fade('fab',Math.min(seg(t,14.9,15.4),1-seg(t,17.9,18.4)));
  if(t>14.7&&t<18.6)for(var i=0;i<5;i++){var g=out(seg(t,15.2+i*.18,15.9+i*.18)),dr=(t-16.5)*(i%2?-10:10);write(N['fab'+i],'translate3d(0,'+((1-g)*30+dr).toFixed(1)+'px,0) scaleY('+(.08+g*.92).toFixed(4)+')',Math.min(1,g*1.6))}

  /* 5 · Для офиса: снимки сменяют друг друга, логотипы на стекле. */
  fade('off',Math.min(seg(t,18.1,18.6),1-seg(t,21.9,22.4)));
  if(t>17.9&&t<22.6){for(var j=0;j<4;j++){var a=18.3+j*.9,o=j===0?1-seg(t,a+.9,a+1.2):Math.min(seg(t,a-.3,a),j===3?1:1-seg(t,a+.9,a+1.2));write(N['op'+j],'scale('+(1.08-.08*seg(t,a-.3,a+1.4)).toFixed(4)+')',o)}
    var lg=win(t,19.4,22,.5);write(N.logos,'translate3d(0,'+((1-lg)*24).toFixed(1)+'px,0)',lg)}

  /* 6 · Доставка: контур страны, маршруты из Ташкента, гарантия. */
  fade('map',Math.min(seg(t,22,22.5),1-seg(t,25,25.5)));
  if(t>21.8&&t<25.7){dash('uz',seg(t,22.2,23.1));fade('ct0',seg(t,22.8,23.1));
    for(var r=0;r<11;r++){var ra=23+r*.11;dash('rt'+r,inOut(seg(t,ra,ra+.55)));fade('ct'+(r+1),seg(t,ra+.4,ra+.6))}
    var w=win(t,23.8,25.3,.45);write(N.warr,'translate3d(0,'+((1-w)*24).toFixed(1)+'px,0)',w)}

  /* 7 · Финал */
  var e=seg(t,25.1,25.7);write(N.end,null,e);

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
  if(heroImg){heroImg.style.width=IW+'px';heroImg.style.height=IH+'px'}
  sizeBeads();beadKey='';
  last.clear();lastT=-1;
}
makeBeads();measure();render();

var act=false,raf=0;
function loop(){raf=0;if(!act)return;render();raf=requestAnimationFrame(loop)}
new IntersectionObserver(function(es){act=es[0].isIntersecting;if(!act)root.classList.remove('st-in');if(act&&!raf)raf=requestAnimationFrame(loop)}).observe(el);
addEventListener('resize',function(){measure();lastT=-1;render()});
})();
