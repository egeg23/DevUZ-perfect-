/* Золотые кнопки (владелец, 28.10.2026): внутри будто жидкое золото с
   блёстками; под курсором расходятся лёгкие волны и поднимают блёстки. На
   телефоне волна идёт от пальца, а без касания кнопка сама изредка
   колышется. Перелив самого золота — градиент в CSS, блёстки и волны —
   холст поверх, один цикл на все кнопки, только видимые. Без движения
   (prefers-reduced-motion) — просто золото. */
(function(){
'use strict';
var d=document;
if(d.documentElement.classList.contains('calm'))return;
try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return}catch(e){}
var B=[],raf=0,dpr=Math.min(window.devicePixelRatio||1,2),hover=false;
try{hover=matchMedia('(hover: hover)').matches}catch(e){}
function R(a,b){return a+Math.random()*(b-a)}
function setup(el){
  if(el.__gold)return;var cv=d.createElement('canvas');cv.className='gl';cv.setAttribute('aria-hidden','true');el.insertBefore(cv,el.firstChild);
  var b={el:el,cv:cv,x:cv.getContext('2d'),w:0,h:0,p:[],rp:[],vis:false,idle:R(1500,4000)};el.__gold=b;size(b);B.push(b);
  function at(e,f){var r=el.getBoundingClientRect();wave(b,e.clientX-r.left,e.clientY-r.top,f)}
  var last=0,lx=0,ly=0;
  el.addEventListener('pointermove',function(e){if(e.pointerType!=='mouse')return;var t=performance.now(),r=el.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
    if(t-last>70&&Math.hypot(x-lx,y-ly)>6){last=t;lx=x;ly=y;wave(b,x,y,.55)}});
  el.addEventListener('pointerenter',function(e){if(e.pointerType==='mouse')at(e,.8)});
  el.addEventListener('pointerdown',function(e){at(e,e.pointerType==='mouse'?1:1.25)});
  if(window.IntersectionObserver)new IntersectionObserver(function(es){b.vis=es[0].isIntersecting;if(b.vis)size(b),go()}).observe(el);else b.vis=true;
}
function size(b){var r=b.el.getBoundingClientRect(),w=Math.max(1,Math.round(r.width)),h=Math.max(1,Math.round(r.height));if(w===b.w&&h===b.h)return;
  b.w=w;b.h=h;b.cv.width=w*dpr;b.cv.height=h*dpr;var n=Math.max(16,Math.min(70,Math.round(w*h/170)));b.p=[];
  for(var i=0;i<n;i++){var y=R(h*.15,h*.95);b.p.push({x:R(0,w),y:y,y0:y,vx:R(-.04,.04),vy:0,r:R(.35,1.25),ph:R(0,6.28),sp:R(.6,1.6),lift:0})}}
/* Волна: кольцо расходится от точки, блёстки на кольце толкает наружу и вверх. */
function wave(b,x,y,f){b.rp.push({x:x,y:y,t:0,f:f});if(b.rp.length>6)b.rp.shift();go()}
function step(b,dt){
  var x=b.x,w=b.w,h=b.h,i,k,q;x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,w,h);
  if(!hover&&(b.idle-=dt)<0){b.idle=R(2600,5200);wave(b,R(w*.2,w*.8),R(h*.3,h*.8),.45)}
  for(k=b.rp.length-1;k>=0;k--){q=b.rp[k];q.t+=dt;var life=1100*q.f+300;if(q.t>life){b.rp.splice(k,1);continue}
    var e=q.t/life,rad=10+e*Math.max(w,h)*.55*q.f,a=(1-e)*(1-e)*.55*q.f;
    var g=x.createRadialGradient(q.x,q.y,Math.max(0,rad-9),q.x,q.y,rad+7);
    g.addColorStop(0,'rgba(255,240,190,0)');g.addColorStop(.45,'rgba(255,246,214,'+a+')');g.addColorStop(.62,'rgba(140,84,0,'+a*.45+')');g.addColorStop(1,'rgba(255,240,190,0)');
    x.fillStyle=g;x.fillRect(0,0,w,h);
    for(i=0;i<b.p.length;i++){var p=b.p[i],dx=p.x-q.x,dy=p.y-q.y,dd=Math.sqrt(dx*dx+dy*dy)||1,band=Math.abs(dd-rad);
      if(band<14){var s=(1-band/14)*.06*q.f*(1-e);p.vx+=dx/dd*s;p.vy+=dy/dd*s-s*1.6;p.lift=Math.min(1,p.lift+s*6)}}}
  for(i=0;i<b.p.length;i++){var p=b.p[i];
    p.vy+=(p.y0-p.y)*.00045*dt;p.vx*=.94;p.vy*=.94;p.x+=p.vx*dt*.06;p.y+=p.vy*dt*.06;p.lift*=.985;p.ph+=dt*.004*p.sp;
    if(p.x<-2)p.x=w+2;if(p.x>w+2)p.x=-2;
    var tw=.35+.65*Math.pow(Math.max(0,Math.sin(p.ph)),3),al=Math.min(1,tw*(.55+p.lift)),r=p.r*(1+p.lift*.8);
    x.globalAlpha=al;x.fillStyle='#fff8dc';x.beginPath();x.arc(p.x,p.y,r,0,6.283);x.fill();
    if(tw>.85||p.lift>.4){x.globalAlpha=al*.7;x.fillRect(p.x-r*3,p.y-.3,r*6,.6);x.fillRect(p.x-.3,p.y-r*3,.6,r*6)}}
  x.globalAlpha=1}
var lt=0;
function loop(t){raf=0;var dt=Math.min(48,lt?t-lt:16);lt=t;var any=false;
  if(d.hidden){lt=0;return}
  for(var i=0;i<B.length;i++){var b=B[i];if(!b.vis||!b.el.isConnected)continue;any=true;step(b,dt)}
  if(any)raf=requestAnimationFrame(loop);else lt=0}
function go(){if(!raf)raf=requestAnimationFrame(loop)}
function scan(){Array.prototype.forEach.call(d.querySelectorAll('.btn-onyx'),setup);go()}
d.addEventListener('visibilitychange',function(){if(!d.hidden)go()});
addEventListener('resize',function(){B.forEach(size)});
if(window.MutationObserver)new MutationObserver(function(){scan()}).observe(d.body,{childList:true,subtree:true});
scan();
})();
