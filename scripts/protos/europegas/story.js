(function(){
'use strict';
/* story: история GAZMETPROD SERVIS на главной, по движку Engelberg v2 (как у
   Asmo Clinic). Одна липкая сцена, слои во весь экран, у каждого свой вход,
   выход и камера. Сюжет: первый экран со знаком и пламенем → камера идёт по
   газовой системе машины от баллона до форсунок, по магистрали бегут капли
   газа → баллон проходит испытание по шагам → фургон Labo разлетается на
   слои сэндвич-панели и собирается, на крышу встаёт холодильник →
   оборудование по орбите вокруг знака → запись.
   Время в экранах прокрутки: t = 6.5 значит «пролистано шесть с половиной
   высот окна». Каждый кадр зависит только от t: сцену можно листать вперёд
   и назад. Прокрутка браузерная, мы её только читаем и пишем transform и
   opacity в один requestAnimationFrame, пока сцена на экране. */
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

var END=+el.dataset.end||21;
var track=el.querySelector('.st-track');
var N={};[].forEach.call(el.querySelectorAll('[data-k]'),function(n){N[n.dataset.k]=n});
var LIGHT=13.4;
var beats=[].map.call(el.querySelectorAll('[data-beat]'),function(n){var ab=n.dataset.beat.split(' ').map(Number);if(ab[0]>=LIGHT)n.classList.add('lt');return {el:n,a:ab[0],b:ab[1],lines:[].slice.call(n.querySelectorAll('[data-line]'))}});
var chapters=JSON.parse(el.dataset.chapters||'[]');
var hud=el.querySelector('[data-hud]'),bar=el.querySelector('[data-bar]');
var CAR=el.dataset.car.split(' ').map(Number);
var spots=[].slice.call(el.querySelectorAll('.st-car .hs'));
var orbs=[].slice.call(el.querySelectorAll('[data-orb]'));
var gdots=[].slice.call(el.querySelectorAll('[data-gd]'));
var puffs=[].slice.call(el.querySelectorAll('[data-pf]'));
var drops=[].slice.call(el.querySelectorAll('[data-dp]'));
var flakes=[].map.call(el.querySelectorAll('.st-van [data-fl]'),function(n){var m=/translate\(([\d.]+) ([\d.]+)\)/.exec(n.getAttribute('transform'))||[0,0,0];return {el:n,x:+m[1],y:+m[2]}});
/* Точки магистрали: считаем один раз по самому пути в рисунке. */
var LINE=[];(function(){var p=el.querySelector('.gas-line');if(!p||!p.getTotalLength)return;var L=p.getTotalLength();for(var i=0;i<=120;i++){var q=p.getPointAtLength(L*i/120);LINE.push([q.x,q.y])}})();
function onLine(k){if(!LINE.length)return [0,0];k=((k%1)+1)%1;var f=k*(LINE.length-1),i=Math.floor(f),a=LINE[i],b=LINE[Math.min(i+1,LINE.length-1)],r=f-i;return [lerp(a[0],b[0],r),lerp(a[1],b[1],r)]}

var W=1,H=1,mobile=false,lastT=-1,chapter=-1,mx=0,my=0;
var last=new Map();
function write(n,tf,o){
  if(!n)return;var prev=last.get(n)||{};
  if(tf!=null&&prev.tf!==tf){n.style.transform=tf;prev.tf=tf}
  if(o!=null){o=clamp(o);if(prev.o===undefined||Math.abs(prev.o-o)>.001||(o===0)!==(prev.o===0)){n.style.opacity=o.toFixed(3);n.style.visibility=o<=.001?'hidden':'visible';prev.o=o}}
  last.set(n,prev);
}
function fade(k,o){write(N[k],null,o)}
function on(n,v){if(n)n.classList.toggle('on',!!v)}
var tr=function(x,y,s){return 'translate3d('+x.toFixed(1)+'px,'+y.toFixed(1)+'px,0)'+(s!=null?' scale('+s.toFixed(4)+')':'')};

/* Камера по рисунку: вписать прямоугольник [x, y, w, h] во весь экран. */
function cam(IW,IH,r){var s=Math.max(W/r[2],H/r[3]);var cx=r[0]+r[2]/2,cy=r[1]+r[3]/2,x=W/2-cx*s,y=H/2-cy*s;x=Math.min(0,Math.max(W-IW*s,x));y=Math.min(0,Math.max(H-IH*s,y));return {s:s,x:x,y:y}}
function mixR(a,b,k){return [lerp(a[0],b[0],k),lerp(a[1],b[1],k),lerp(a[2],b[2],k),lerp(a[3],b[3],k)]}
/* Машина: опорные кадры камеры [t, точка, ширина кадра на компьютере].
   На телефоне кадр высокий, точка в верхней трети: внизу подпись. */
var CK=[[1.9,[800,520],1700],[2.9,[1340,530],620],[3.7,[1350,540],560],[4.6,[860,600],820],[5.6,[520,590],520],[6.7,[460,560],480],[7.6,[420,540],520],[8.6,[700,520],900],[9.4,[800,520],1700]];
function carRect(t){var K=CK,i=0;while(i+1<K.length&&t>K[i+1][0])i++;var a=K[i],b=K[Math.min(i+1,K.length-1)],k=b===a?0:inOut(seg(t,a[0],b[0]));
  var p=[lerp(a[1][0],b[1][0],k),lerp(a[1][1],b[1][1],k)],w=lerp(a[2],b[2],k);
  if(!mobile){var h=w*H/W;return [p[0]-w*.62,p[1]-h*.45,w,h]}
  var mw=w*.62,mh=mw*H/W;return [p[0]-mw/2,p[1]-mh*.3,mw,mh]}
/* Рисунки 1600 x 900 во весь экран, обрезка по краям. */
/* Рисунок 1600 x 900: на телефоне во всю ширину (k — сколько рисунка в кадре), на компьютере вписан с запасом k2 и сдвинут вправо на dx экрана: слева подпись. */
function fit(fw,fh,k,yc,k2,dx){if(!mobile){var s=Math.min(W/fw,H/fh)*(k2||1)*Math.max(1,W/fw*fh/H);return {s:s,x:(W-fw*s)/2+W*(dx||0),y:(H-fh*s)/2}}var m=W/(fw*k);return {s:m,x:(W-fw*m)/2,y:H*yc-fh*m/2}}

var cnts=[].slice.call(el.querySelectorAll('.nums [data-count]')).map(function(n){return {el:n,to:+n.dataset.count,v:-1}});
var fmt=function(n){return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ')};
function count(k){cnts.forEach(function(c,i){var q=out(seg(k,i*.1,.7+i*.1)),v=Math.round(c.to*q);if(v!==c.v){c.v=v;c.el.textContent=fmt(v)}})}
var bornAt=performance.now();

function render(){
  var r=track.getBoundingClientRect(),start=r.top+scrollY;
  root.classList.toggle('st-in',r.top<=0&&r.bottom>=H);
  var t=clamp((scrollY-start)/H,0,END);
  if(Math.abs(t-lastT)<.0005&&!render.force)return;lastT=t;render.force=false;
  root.classList.toggle('st-lt',t>LIGHT&&t<END);

  /* 0 · Первый экран: знак уходит вглубь и поворачивается, пламя дышит. */
  if(t<2.4){
    write(N.heroSign,tr(mx*-22,-t*H*.12+my*-14)+' rotate('+(t*10).toFixed(2)+'deg) scale('+(1+t*.25).toFixed(3)+')',1-seg(t,1.2,2));
    write(N.heroGlow,tr(mx*30,my*24),1-seg(t,1,1.8));
    var nm=1-seg(t,1.3,1.8);write(N.nums,tr(0,(1-nm)*-20),nm);
    count(seg((performance.now()-bornAt)/1000,0,1.6));
  }
  fade('hero',1-seg(t,1.7,2.3));
  fade('hint',1-seg(t,0,.5));

  /* 1 · Машина в разрезе: камера идёт по системе, по магистрали бегут капли. */
  fade('car',Math.min(seg(t,1.8,2.3),1-seg(t,9.3,9.8)));
  if(t>1.6&&t<10){
    var c=cam(CAR[0],CAR[1],carRect(t));
    write(N.carCam,tr(c.x,c.y,c.s),null);
    spots.forEach(function(s){var w=s.dataset.w.split(' ').map(Number),x=c.x+(+s.dataset.x)*c.s,y=c.y+(+s.dataset.y)*c.s;if(mobile)x=Math.min(Math.max(x,16),W*.5);write(s,tr(x,y),win(t,w[0],w[1],.3))});
    var flow=seg(t,3.6,9.3);
    gdots.forEach(function(g,i){var p=onLine(t*.22+i/gdots.length);write(g,'translate('+p[0].toFixed(1)+'px,'+p[1].toFixed(1)+'px)',flow*(.4+.6*((i%3)/2)))});
  }

  /* 2 · Испытание баллона: газ выходит, конденсат стекает, кольцо осмотра
     идёт вдоль, стрелка весов, в конце зелёная отметка. Шаги загораются. */
  fade('cyl',Math.min(seg(t,9.3,9.8),1-seg(t,13.3,13.8)));
  if(t>9.1&&t<14){
    var f=fit(1600,900,.88,.52,.74,.16);
    write(N.cylCam,tr(f.x,f.y,f.s),null);write(N.cylBody,'rotate('+((t-11.3)*-1.2).toFixed(2)+'deg)',null);if(N.cylBody)N.cylBody.style.transformOrigin='800px 460px';
    var gas=win(t,10.2,11,.25);
    puffs.forEach(function(p,i){var q=((t-10.2)*1.6+i/puffs.length)%1;write(p,'translate('+(q*160).toFixed(1)+'px,'+(-q*140-Math.sin(q*6+i)*14).toFixed(1)+'px) scale('+(.6+q).toFixed(3)+')',gas*(1-q))});
    var dr=win(t,10.8,11.5,.2);
    drops.forEach(function(p,i){var q=((t-10.8)*1.8+i/drops.length)%1;write(p,'translate('+(1350+i*4)+'px,'+(530+q*150).toFixed(1)+'px)',dr*(1-q*.6))});
    var sc=seg(t,11.4,12.2);write(N.scan,'translate('+lerp(300,1290,inOut(sc)).toFixed(1)+'px,0)',win(t,11.4,12.2,.15));
    write(N.scale,null,win(t,12,12.8,.2));write(N.needle,'rotate('+(-60+120*out(seg(t,12.1,12.6))).toFixed(1)+'deg)',null);
    write(N.okTag,'scale('+(.6+.4*out(seg(t,12.6,12.9))).toFixed(3)+')',seg(t,12.6,12.8));
    if(N.okTag)N.okTag.style.transformOrigin='1010px 352px';
    var sp=win(t,9.8,13.3,.4);write(N.steps,tr(0,(1-sp)*24),sp);
    var at=[9.9,10.2,10.8,11.4,12,12.6];for(var i=0;i<6;i++)on(N['tp'+i],t>=at[i]);
  }

  /* 3 · Фургон: слои разлетаются веером и собираются, сверху холодильник. */
  fade('van',Math.min(seg(t,13.3,13.8),1-seg(t,17.3,17.8)));
  if(t>13.1&&t<18){
    var v=fit(1600,900,.9,.5,.84,.12);
    write(N.vanCam,tr(v.x,v.y,v.s),null);
    var ex=inOut(seg(t,13.9,14.8))*(1-inOut(seg(t,15.3,15.9)));
    for(var j=0;j<4;j++){var dx=(mobile?18:46)*j*ex,dy=-(mobile?70:96)*j*ex;write(N['ly'+j],'translate('+dx.toFixed(1)+'px,'+dy.toFixed(1)+'px)',null)}
    for(var k=0;k<4;k++){var xx=v.x+(560+(mobile?18:46)*k*ex+24)*v.s,yy=v.y+(250-(mobile?70:96)*k*ex+(k?40:90))*v.s;if(mobile){xx=16;yy=H*.1+k*62}write(N['lt'+k],tr(xx,yy),win(t,14.3+k*.1,15.4,.25))}
    var fr=out(seg(t,15.8,16.4));write(N.fridge,'translate(0px,'+((1-fr)*-120).toFixed(1)+'px)',fr);
    flakes.forEach(function(f,i){var q=((t-16.2)*.9+i/flakes.length)%1;write(f.el,'translate('+(f.x+Math.sin(q*6+i)*14).toFixed(1)+'px,'+(f.y+q*120).toFixed(1)+'px) rotate('+(q*180).toFixed(0)+'deg)',seg(t,16.2,16.6)*(1-q)*.8)});
  }

  /* 4 · Оборудование по орбите вокруг знака. */
  fade('team',Math.min(seg(t,17.3,17.8),1-seg(t,20.1,20.6)));
  if(t>17.1&&t<20.8){
    var o1=mobile?Math.min(W*.3,130):Math.min(H*.2,170),o2=o1*1.62;
    N.orbit.style.setProperty('--o1',o1.toFixed(0)+'px');N.orbit.style.setProperty('--o2',o2.toFixed(0)+'px');
    var rot=(t-17)*.55;
    orbs.forEach(function(n,k){var inner=k<4,rr=inner?o1:o2,cnt=inner?4:5,idx=inner?k:k-4,a=idx/cnt*Math.PI*2+(inner?rot:-rot*.7)-Math.PI/2;
      var ap=seg(t,17.6+k*.12,18+k*.12);write(n,tr(Math.cos(a)*rr*(.6+.4*out(ap)),Math.sin(a)*rr*(.6+.4*out(ap))),ap)});
    var tc=N.cl;if(tc){var cv=Math.round(12416*out(seg(t,17.6,18.8)));if(tc.dataset.v!=cv){tc.dataset.v=cv;tc.textContent=fmt(cv)}}
  }

  /* 5 · Финал */
  write(N.end,null,seg(t,20.1,20.6));

  /* Подписи: выплывают снизу, строки догоняют друг друга, уходят вверх. */
  beats.forEach(function(b){
    var inn=b.a<0?1:seg(t,b.a,b.a+.6),op=seg(t,b.b-.5,b.b),o=Math.min(inn,1-op);
    write(b.el,'translate3d(0,'+((1-out(inn))*28-out(op)*28).toFixed(1)+'px,0)',o);
    b.el.classList.toggle('live',o>.5);
    if(o<=0)return;
    b.lines.forEach(function(l,i){var li=b.a<0?1:seg(t,b.a+.1*i,b.a+.1*i+.7);write(l,'translate3d(0,'+((1-out(li))*22).toFixed(1)+'px,0)',out(li))});
  });

  var ci=0;while(ci+1<chapters.length&&t>=chapters[ci+1][0])ci++;
  if(ci!==chapter&&hud){chapter=ci;hud.textContent=('0'+ci).slice(-2)+' · '+chapters[ci][1]}
  if(bar)bar.style.transform='scaleX('+(t/END).toFixed(4)+')';
}

function measure(){
  var w=innerWidth,h=innerHeight;
  if(w===W&&Math.abs(h-H)<140)return;
  W=w;H=h;mobile=W<820||W<H;
  track.style.height=Math.round((END+1)*H)+'px';
  last.clear();lastT=-1;
}
measure();render();

/* Мышь сдвигает знак первого экрана: глубина без перехвата прокрутки. */
var fine=false;try{fine=matchMedia('(hover:hover) and (pointer:fine)').matches}catch(e){}
if(fine)addEventListener('pointermove',function(e){mx=e.clientX/W-.5;my=e.clientY/H-.5;if(lastT<2.4)render.force=true},{passive:true});

/* Пока сцена на экране, кадр каждый раз: капли газа, пар и снег живут и без прокрутки. */
var act=false,raf=0;
function loop(){raf=0;if(!act)return;render.force=lastT<2.4;render();raf=requestAnimationFrame(loop)}
new IntersectionObserver(function(es){act=es[0].isIntersecting;if(!act)root.classList.remove('st-in','st-lt');if(act&&!raf)raf=requestAnimationFrame(loop)}).observe(el);
addEventListener('resize',function(){measure();lastT=-1;render()});
})();
