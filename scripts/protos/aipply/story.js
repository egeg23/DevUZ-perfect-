(function(){
'use strict';
/* story — «Kompyuter noldan»: одна липкая сцена на главной, по мотивам
   истории Engelberg (наш макет на globalex: components/engelberg/engine.ts).
   Время истории — в экранах прокрутки: t = 6.5 значит «пролистано шесть с
   половиной высот окна». Каждый кадр — функция от t, поэтому сцену можно
   листать вперёд и назад, и при любой скорости она выглядит одинаково.
   Прокрутка своя, браузерная: мы её только читаем (без библиотек плавной прокрутки и без
   перехвата колеса), пишем transform и opacity в один requestAnimationFrame
   и только пока сцена на экране.

   Мир — ноутбук размером 1600 × 1000 условных точек, нарисованный кодом.
   Камера не «двигает картинку», а вписывает в экран нужный прямоугольник
   мира: на широком экране справа от подписи, на телефоне — над подписью.
   Так одна и та же история идёт на 1440 и на 390 точках. */
var d=document,root=d.documentElement,el=d.getElementById('story');
if(!el)return;
var reduce=false;try{reduce=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
if(reduce)return;
root.classList.add('st-live');

var clamp=function(v,a,b){a=a==null?0:a;b=b==null?1:b;return Math.min(b,Math.max(a,v))};
var seg=function(t,a,b){return clamp((t-a)/(b-a))};
var lerp=function(a,b,x){return a+(b-a)*x};
var inOut=function(x){return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2};
var out=function(x){return 1-Math.pow(1-x,3)};
var sine=function(x){return -(Math.cos(Math.PI*x)-1)/2};
var win=function(t,a,b,f){f=f||.5;return Math.min(seg(t,a,a+f),1-seg(t,b-f,b))};
/* Значение по опорным точкам [t, v] с плавным ходом между ними. */
function keys(t,p){if(t<=p[0][0])return p[0][1];for(var i=1;i<p.length;i++){if(t<=p[i][0]){var a=p[i-1],b=p[i];return lerp(a[1],b[1],sine((t-a[0])/(b[0]-a[0])))}}return p[p.length-1][1]}

var END=+el.dataset.end||18;
var track=el.querySelector('.st-track'),stage=el.querySelector('.st-stage'),world=el.querySelector('.st-world');
var nodes={};[].forEach.call(el.querySelectorAll('[data-k]'),function(n){nodes[n.dataset.k]=n});
var beats=[].map.call(el.querySelectorAll('[data-beat]'),function(n){var ab=n.dataset.beat.split(' ').map(Number);return {el:n,a:ab[0],b:ab[1],lines:[].slice.call(n.querySelectorAll('[data-line]'))}});
/* Набор текста: каждая буква — свой узел, проявляется прозрачностью. */
var types=[].map.call(el.querySelectorAll('[data-type]'),function(n){
  var txt=n.textContent;n.textContent='';n.setAttribute('aria-hidden','true');
  var ch=[].map.call(txt,function(c){var s=d.createElement('i');s.textContent=c;n.appendChild(s);return s});
  var ab=n.dataset.type.split(' ').map(Number);return {el:n,a:ab[0],b:ab[1],ch:ch,n:-1};
});
var chapters=JSON.parse(el.dataset.chapters||'[]');
var hud=el.querySelector('[data-hud]'),bar=el.querySelector('[data-bar]');

var W=1,H=1,mobile=false,lastT=-1,chapter=-1;
var last=new Map();
function write(n,tf,o){
  if(!n)return;var prev=last.get(n)||{};
  if(tf!=null&&prev.tf!==tf){n.style.transform=tf;prev.tf=tf}
  if(o!=null){o=clamp(o);if(prev.o===undefined||Math.abs(prev.o-o)>.001||(o===0)!==(prev.o===0)){n.style.opacity=o.toFixed(3);n.style.visibility=o<=.001?'hidden':'visible';prev.o=o}}
  last.set(n,prev);
}
function pose(k,p){var n=nodes[k];if(!n)return;var tf='translate3d('+((p.x||0)).toFixed(1)+'px,'+((p.y||0)).toFixed(1)+'px,0)';if(p.s!=null&&p.s!==1)tf+=' scale('+p.s.toFixed(4)+')';if(p.r)tf+=' rotate('+p.r.toFixed(2)+'deg)';write(n,tf,p.o==null?1:p.o)}
function fade(k,o){write(nodes[k],null,o)}
var vcache={};
function vars(o){for(var k in o){var v=o[k].toFixed(4);if(vcache[k]!==v){stage.style.setProperty('--'+k,v);vcache[k]=v}}}

/* ── Камера: вписать прямоугольник мира [x, y, w, h] в рамку экрана ── */
function frameBox(full){
  if(full)return [0,0,W,H];
  return mobile?[W*.04,H*.1,W*.92,H*.46]:[W*.42,H*.1,W*.54,H*.8];
}
function fit(r,full){var f=frameBox(full),s=Math.min(f[2]/r[2],f[3]/r[3]);return {s:s,x:f[0]+f[2]/2-(r[0]+r[2]/2)*s,y:f[1]+f[3]/2-(r[1]+r[3]/2)*s}}
/* Плавно между двумя положениями камеры: масштаб — по логарифму, чтобы
   подлёт не «прыгал» в конце. */
function mix(a,b,k){var s=Math.exp(lerp(Math.log(a.s),Math.log(b.s),k));
  /* Точка мира в центре рамки движется линейно, масштаб — по логарифму. */
  var ca=[(W/2-a.x)/a.s,(H/2-a.y)/a.s],cb=[(W/2-b.x)/b.s,(H/2-b.y)/b.s],c=[lerp(ca[0],cb[0],k),lerp(ca[1],cb[1],k)];
  return {s:s,x:W/2-c[0]*s,y:H/2-c[1]*s}}
/* Экран ноутбука в мире и окна на нём (в точках экрана). */
var SX=380,SY=150,SW=840,SH=510;
var R={
  far:[-80,-160,1760,1300], lap:[300,90,1000,700], scr:[SX-10,SY-10,SW+20,SH+20],
  doc:[SX+40,SY+34,470,316], xls:[SX+330,SY+90,470,360], web:[SX+60,SY+40,720,410],
  ai:[SX+410,SY+30,400,440], safe:[SX+250,SY+90,340,300], cert:[SX+150,SY+60,540,380]
};
function cam(t){
  var shots=[[0,'far',1],[1.2,'far',1],[2.6,'lap',0],[3.6,'scr',0],[4.3,'doc',0],[5.9,'doc',0],[6.5,'xls',0],[8,'xls',0],[8.6,'web',0],[10.2,'web',0],[10.8,'ai',0],[12.9,'ai',0],[13.3,'safe',0],[14.5,'safe',0],[15,'cert',0],[16.1,'cert',0],[17.3,'far',1]];
  var i=0;while(i+1<shots.length&&t>=shots[i+1][0])i++;
  var a=shots[i],b=shots[Math.min(i+1,shots.length-1)];
  var A=fit(R[a[1]],a[2]),B=fit(R[b[1]],b[2]);
  var k=a===b?0:inOut(seg(t,a[0],b[0]));
  return mix(A,B,k);
}

function render(){
  var tr=track.getBoundingClientRect(),start=tr.top+scrollY;
  root.classList.toggle('st-in',tr.top<=0&&tr.bottom>=H);
  var t=clamp((scrollY-start)/H,0,END);
  if(Math.abs(t-lastT)<.0005)return;lastT=t;
  var c=cam(t);
  write(world,'translate3d('+c.x.toFixed(1)+'px,'+c.y.toFixed(1)+'px,0) scale('+c.s.toFixed(4)+')',null);

  /* 0 · Заголовок и закрытый ноутбук */
  var ti=seg(t,.7,1.6);
  pose('title',{y:-40*inOut(ti),o:1-ti});
  fade('hint',1-seg(t,0,.4));

  /* 1 · Крышка открывается, экран загорается */
  vars({lid:inOut(seg(t,1.1,2.5)),boot:seg(t,2.2,2.8),desk:seg(t,2.9,3.5)});
  var dockOn=seg(t,3.1,3.6);

  /* Окна: открываются от своего значка в доке, сворачиваются обратно. */
  function wnd(k,a,b){var o=out(seg(t,a,a+.5)),c=seg(t,b-.4,b);var s=lerp(.2,1,o)*lerp(1,.2,c);pose(k,{s:s,y:(1-o)*180+c*180,o:Math.min(o,1-c)});return Math.min(o,1-c)}
  var on={doc:wnd('w-doc',4,6.4),xls:wnd('w-xls',6.2,8.5),web:wnd('w-web',8.2,10.7),ai:wnd('w-ai',10.4,13.3),safe:wnd('w-safe',13,14.9)};
  /* Значок в доке приподнимается, пока его окно открыто — по мотивам «Dock» (Magic UI). */
  ['doc','xls','web','ai','safe'].forEach(function(k){pose('i-'+k,{y:-14*on[k],s:1+.35*on[k]})});
  fade('dock',dockOn);

  vars({
    sum:seg(t,7.1,7.6),bars:out(seg(t,7.3,8)),
    tiles:seg(t,9.2,10),
    ans:seg(t,11.8,12.9),glow:win(t,11.4,13.2,.6),
    files:seg(t,13.5,14.2),lock:out(seg(t,14.1,14.45)),
    cert:out(seg(t,14.7,15.5)),seal:seg(t,15.3,16)
  });
  pose('cert',{y:(1-out(seg(t,14.7,15.5)))*420,o:Math.min(seg(t,14.7,15.2),1-seg(t,16.4,17))});

  /* 8 · Камера отъезжает, считаются выпускники */
  var cn=seg(t,16.3,17.3);
  fade('count',seg(t,16.2,16.8));
  var cv=nodes['count-n'];if(cv){var n=Math.round(3000*out(cn));var s=String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ')+'+';if(cv.textContent!==s)cv.textContent=s}
  fade('dots',seg(t,16.2,17));
  vars({dots:out(cn)});

  /* Набор текста по буквам */
  types.forEach(function(ty){var k=Math.round(seg(t,ty.a,ty.b)*ty.ch.length);if(k===ty.n)return;
    for(var i=0;i<ty.ch.length;i++){var v=i<k;if((i<ty.n)!==v||ty.n<0)ty.ch[i].style.opacity=v?'1':'0'}ty.n=k;
    ty.el.classList.toggle('typing',k>0&&k<ty.ch.length)});

  /* Подписи: выплывают снизу, строки догоняют друг друга, уходят вверх */
  beats.forEach(function(b){
    var inn=seg(t,b.a,b.a+.6),op=seg(t,b.b-.5,b.b),o=Math.min(inn,1-op);
    write(b.el,'translate3d(0,'+((1-out(inn))*28-out(op)*28).toFixed(1)+'px,0)',o);
    b.el.classList.toggle('live',o>.5);
    if(o<=0)return;
    b.lines.forEach(function(l,i){var li=seg(t,b.a+.1*i,b.a+.1*i+.7);write(l,'translate3d(0,'+((1-out(li))*22).toFixed(1)+'px,0)',out(li))});
  });

  /* Глава и прогресс */
  var ci=0;while(ci+1<chapters.length&&t>=chapters[ci+1][0])ci++;
  if(ci!==chapter&&hud){chapter=ci;hud.textContent=('0'+(ci+1)).slice(-2)+' · '+chapters[ci][1]}
  if(bar)bar.style.transform='scaleX('+(t/END).toFixed(4)+')';
}

function measure(){
  var w=innerWidth,h=innerHeight;
  /* На телефоне высота прыгает с адресной строкой: мелкие изменения не считаем. */
  if(w===W&&Math.abs(h-H)<140)return;
  W=w;H=h;mobile=W<820||W<H;
  track.style.height=Math.round((END+1)*H)+'px';
  last.clear();vcache={};lastT=-1;
}
measure();render();

var act=false,raf=0;
function loop(){raf=0;if(!act)return;render();raf=requestAnimationFrame(loop)}
/* Пока идёт история, нижняя кнопка и плашка конструктора прячутся: у сцены своя кнопка в конце. */
new IntersectionObserver(function(es){act=es[0].isIntersecting;if(!act)root.classList.remove('st-in');if(act&&!raf)raf=requestAnimationFrame(loop)}).observe(el);
addEventListener('resize',function(){measure();lastT=-1;render()});
})();
