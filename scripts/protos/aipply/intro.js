(function(){
'use strict';
/* intro — заставка главной: промо DevUz Studio, затем знак Aipply.
   Три полосы знака слетаются с разных сторон, рядом встаёт имя, потом
   камера доворачивает знак, чтобы просвет между верхней и средней полосой
   лёг горизонтально, и влетает в этот просвет. Просвет — настоящая дыра в
   заставке: сквозь неё с самого начала виден первый экран, и на подлёте он
   просто заполняет весь экран. Один requestAnimationFrame раскладывает время
   по переменным узла и по атрибуту transform группы знака: только transform
   и opacity, прокрутку не трогает. */
var d=document,root=d.documentElement,box=d.getElementById('intro');
function heroOn(){var h=d.getElementById('hero');if(h)h.classList.add('hero-on')}
if(!box){heroOn();return}
if(root.classList.contains('intro-off')){box.parentNode.removeChild(box);heroOn();return}
try{sessionStorage.setItem('ap-intro','1')}catch(e){}

var span=function(t,a,b){return Math.min(Math.max((t-a)/(b-a),0),1)};
var ease=function(x){return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2};
var out3=function(x){return 1-Math.pow(1-x,3)};
var accel=function(x){return x*x};
var set=function(n,v){box.style.setProperty(n,typeof v==='number'?v.toFixed(4):v)};

/* ── Промо DevUz Studio: хронометраж как на devuz.studio ── */
var BURST=2500,OPEN=3050;
/* ── Знак: от конца промо ── */
var M_IN=0,M_TURN=1500,M_FLY=2050,M_END=3350;

var cv=box.querySelector('.dz-code'),cx=cv&&cv.getContext('2d'),dpr=1,bits=[];
function resize(){if(!cx)return;dpr=Math.min(devicePixelRatio||1,2);cv.width=Math.round(innerWidth*dpr);cv.height=Math.round(innerHeight*dpr);cx.setTransform(dpr,0,0,dpr,0,0)}
resize();addEventListener('resize',resize);
var GL=['</>','{ }','=>','( )','[ ]','&&','::','/*','*/','<>','01','10','#',';','|','$','~','!=','++','·'],SPARK=['#22f0a0','#5b9bff','#e8b14c'],INK=['#eaf0f7','#22f0a0','#5b9bff','#8b97a8','#e8b14c'];
function makeBits(x,y){
  var n=Math.round(Math.min(190,Math.max(84,innerWidth/8))),reach=Math.hypot(innerWidth,innerHeight)/2,o=[];
  for(var i=0;i<n;i++){var g=i%5!==0,a=i/n*Math.PI*2+(Math.random()-.5)*.9,s=reach*(.8+Math.pow(Math.random(),1.4)*1.9);
    o.push({x:x,y:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s*.86,t:g?GL[i%GL.length]:null,size:g?13+Math.random()*16:1.8+Math.random()*2.6,c:g?INK[i%INK.length]:SPARK[i%SPARK.length],rot:(Math.random()-.5)*.8,spin:(Math.random()-.5)*2.4,grow:g?Math.random()*.6:0,life:1100+Math.random()*1300,age:0})}
  return o;
}
function paint(dt){
  if(!cx)return;cx.clearRect(0,0,cv.width/dpr,cv.height/dpr);
  for(var i=0;i<bits.length;i++){var b=bits[i];b.age+=dt;if(b.age>b.life)continue;
    var drag=Math.pow(.992,dt/16.67);b.vx*=drag;b.vy*=drag;b.x+=b.vx*dt/1000;b.y+=b.vy*dt/1000;b.rot+=b.spin*dt/1000;
    var k=b.age/b.life,al=Math.min(1,b.age/70)*(k<.5?1:1-(k-.5)/.5);if(al<=.01)continue;
    cx.save();cx.globalAlpha=al;cx.translate(b.x,b.y);cx.rotate(b.rot);
    if(b.t){cx.font='600 '+(b.size*(1+b.grow*k))+'px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace';cx.textAlign='center';cx.textBaseline='middle';cx.fillStyle=b.c;cx.fillText(b.t,0,0)}
    else{cx.globalCompositeOperation='lighter';cx.fillStyle=b.c;cx.beginPath();cx.arc(0,0,b.size,0,Math.PI*2);cx.fill()}
    cx.restore()}
}

/* ── Знак: группа в координатах экрана. Центр знака — (0,0) его рисунка,
   просвет между полосами A и B — около точки SLIT. ── */
var svg=box.querySelector('.mk-svg'),g=svg&&svg.querySelector('.mk-cam'),pcs=svg?[].slice.call(svg.querySelectorAll('.mk-p')):[];
var SLIT=[20,-37],TILT=-9.2;
/* Откуда прилетает каждая полоса: сдвиг в единицах рисунка и поворот. */
var FROM=[[260,-320,-24],[-420,40,10],[-200,360,18]];
function base(){var u=Math.min(innerWidth,innerHeight);return {s:Math.max(.42,Math.min(1.25,u/820)),cx:innerWidth/2,cy:innerHeight*.44}}

/* ── Время ── */
var raf=0,ended=false,mStart=-1;
var start=performance.now()-Math.min(Math.max(performance.now()-900,0),1800);
function finish(){
  if(ended)return;ended=true;cancelAnimationFrame(raf);
  root.style.overflow='';heroOn();
  box.classList.add('done');setTimeout(function(){if(box.parentNode)box.parentNode.removeChild(box)},460);
  removeEventListener('wheel',finish);removeEventListener('touchmove',finish);removeEventListener('keydown',onKey);
}
function toMark(){var now=performance.now();if(now-start<OPEN)start=now-OPEN}
function onKey(e){if(e.key==='Escape')finish()}
var last=performance.now();
function frame(now){
  var t=now-start,dt=Math.min(now-last,48);last=now;
  /* Промо */
  set('--dz-grid',span(t,80,900)*(1-span(t,BURST,BURST+420)));
  set('--dz-grid-s',1.34-ease(span(t,80,2000))*.3-span(t,2050,BURST)*.05);
  var born=ease(span(t,140,980)),charge=span(t,1900,BURST),blast=span(t,BURST,BURST+380);
  set('--dz-draw',born);set('--dz-fill',span(t,620,1180));
  set('--dz-mark',Math.min(span(t,100,420),1)*(1-blast));
  set('--dz-mark-s',.88+born*.12-ease(charge)*.09+accel(blast)*.9);
  set('--dz-caret',span(t,760,1060)*(1-blast));
  set('--dz-glow',Math.max(0,span(t,700,1200)*.42+accel(charge)*.5-span(t,BURST+120,BURST+900)*.92));
  set('--dz-glow-s',.5+ease(span(t,700,1400))*.3+accel(blast)*1.4);
  set('--dz-type',span(t,980,1720)*5.4);
  set('--dz-domain',span(t,1720,2060)*(1-span(t,BURST,BURST+300)));
  set('--dz-name',1-span(t,BURST+40,BURST+420));
  set('--dz-bar',span(t,520,OPEN));
  set('--dz-ring-on',t>=BURST?1:0);set('--dz-ring',ease(span(t,BURST,BURST+900)));
  set('--dz-flash',span(t,BURST-50,BURST+20)*(1-span(t,BURST+20,BURST+300)));
  set('--in-skip',span(t,620,1000));
  if(t>=BURST&&!bits.length){var mk=box.querySelector('.dz-mark').getBoundingClientRect();bits=makeBits(mk.left+mk.width/2,mk.top+mk.height/2)}
  if(bits.length&&t<OPEN+2600)paint(dt);
  /* Знак Aipply */
  if(t>=OPEN-200&&g){
    if(mStart<0)mStart=OPEN-200;
    var m=t-mStart,B=base();
    set('--mk-on',span(m,0,360));
    pcs.forEach(function(p,i){var k=out3(span(m,80+i*120,760+i*120)),f=FROM[i];
      p.setAttribute('transform','translate('+(f[0]*(1-k)).toFixed(1)+' '+(f[1]*(1-k)).toFixed(1)+') rotate('+(f[2]*(1-k)).toFixed(2)+')');
      p.style.opacity=k.toFixed(3)});
    set('--mk-word',ease(span(m,520,1100))*(1-span(m,M_TURN,M_TURN+380)));
    set('--mk-cap',span(m,700,1050)*(1-span(m,M_TURN,M_TURN+300)));
    /* Просвет загорается: сквозь него виден первый экран. */
    set('--mk-slit',span(m,M_TURN-200,M_TURN+300));
    /* Камера: знак уезжает из-под имени в центр, доворачивается, просвет
       растёт до экрана и уходит в его центр. */
    var turn=ease(span(m,M_TURN,M_FLY+200)),fly=ease(span(m,M_FLY,M_END));
    var sc=B.s*Math.exp(Math.log(Math.max(innerWidth,innerHeight)/(16*B.s))*fly);
    var shift=(1-turn)*(innerWidth>=720?-170:0);
    var px=SLIT[0]*turn,py=SLIT[1]*turn;
    var x=B.cx+shift+(innerWidth/2-B.cx)*fly,y=B.cy+(innerHeight/2-B.cy)*turn;
    g.setAttribute('transform','translate('+x.toFixed(1)+' '+y.toFixed(1)+') scale('+sc.toFixed(4)+') rotate('+(TILT*turn).toFixed(3)+') translate('+(-px).toFixed(2)+' '+(-py).toFixed(2)+')');
    if(m>=M_END-140)heroOn();
    if(m>=M_END+60){finish();return}
  }
  raf=requestAnimationFrame(frame);
}
/* Тап: во время промо — сразу к знаку, во время знака — на первый экран. */
box.addEventListener('click',function(e){if(e.target&&e.target.id==='in-skip'){finish();return}var t=performance.now()-start;if(t<OPEN-250)toMark();else finish()});
addEventListener('wheel',finish,{passive:true});addEventListener('touchmove',finish,{passive:true});addEventListener('keydown',onKey);

/* Страховка: что бы ни случилось, через 12 секунд страница открыта. */
setTimeout(finish,12000);
raf=requestAnimationFrame(frame);
})();
