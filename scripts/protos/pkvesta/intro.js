(function(){
'use strict';
/* intro — заставка главной: промо DevUz Studio, затем логотип ПК Веста.
   Домик с логотипа собирается, PK и Vesta въезжают по бокам, жёлтые ворота
   (подъёмно-поворотные, первый патент завода, 1994) поднимаются, и камера
   влетает в проём, на чертёж каркаса с первого экрана. Один
   requestAnimationFrame раскладывает время по переменным узла: только
   transform и opacity, прокрутку не трогает. */
var d=document,root=d.documentElement,box=d.getElementById('intro');
function heroOn(){var h=d.getElementById('hero');if(h)h.classList.add('hero-on')}
if(!box){heroOn();return}
if(root.classList.contains('intro-off')){box.parentNode.removeChild(box);heroOn();return}
try{sessionStorage.setItem('pv-intro','1')}catch(e){}

var span=function(t,a,b){return Math.min(Math.max((t-a)/(b-a),0),1)};
var ease=function(x){return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2};
var accel=function(x){return x*x};
var set=function(n,v){box.style.setProperty(n,typeof v==='number'?v.toFixed(4):v)};

/* ── Промо DevUz Studio: хронометраж как на devuz.studio ── */
var BURST=2500,OPEN=3050;
/* ── Ворота: от конца промо ── */
var V_IN=0,V_LIFT=1050,V_FLY=1850,V_END=3300;

var cv=box.querySelector('.dz-code'),cx=cv&&cv.getContext('2d'),dpr=1,bits=[];
function resize(){if(!cx)return;dpr=Math.min(devicePixelRatio||1,2);cv.width=Math.round(innerWidth*dpr);cv.height=Math.round(innerHeight*dpr);cx.setTransform(dpr,0,0,dpr,0,0)}
resize();addEventListener('resize',resize);
var GL=['</>','{ }','=>','( )','[ ]','&&','::','/*','*/','<>','01','10','#',';','|','$','~','!=','++','·'],SPARK=['#22f0a0','#5b9bff','#e8b14c'],INK=['#eaf0f7','#22f0a0','#5b9bff','#8b97a8','#e8b14c'];
function makeBits(x,y){
  var n=Math.round(Math.min(190,Math.max(84,innerWidth/8))),reach=Math.hypot(innerWidth,innerHeight)/2,out=[];
  for(var i=0;i<n;i++){var g=i%5!==0,a=i/n*Math.PI*2+(Math.random()-.5)*.9,s=reach*(.8+Math.pow(Math.random(),1.4)*1.9);
    out.push({x:x,y:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s*.86,t:g?GL[i%GL.length]:null,size:g?13+Math.random()*16:1.8+Math.random()*2.6,c:g?INK[i%INK.length]:SPARK[i%SPARK.length],rot:(Math.random()-.5)*.8,spin:(Math.random()-.5)*2.4,grow:g?Math.random()*.6:0,life:1100+Math.random()*1300,age:0})}
  return out;
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

/* ── Влёт в ворота: масштаб вокруг центра проёма ── */
var vx=box.querySelector('.vx'),hole=box.querySelector('.vx-hole'),lay=null;
function layout(){
  set('--vx-s',1);set('--vx-tx','0px');set('--vx-ty','0px');
  var r=vx.getBoundingClientRect(),h=hole.getBoundingClientRect();
  var ox=h.left+h.width/2-r.left,oy=h.top+h.height/2-r.top;
  set('--vx-ox',ox.toFixed(1)+'px');set('--vx-oy',oy.toFixed(1)+'px');
  /* Проём должен закрыть весь экран: по большей из сторон, с запасом. */
  var s1=Math.max(innerWidth/h.width,innerHeight/h.height)*1.25;
  /* И центр проёма уезжает в центр экрана. */
  var dx=innerWidth/2-(h.left+h.width/2),dy=innerHeight/2-(h.top+h.height/2);
  return {s1:s1,dx:dx,dy:dy};
}

/* ── Время ── */
var raf=0,ended=false,vStart=-1;
var start=performance.now()-Math.min(Math.max(performance.now()-900,0),1800);
function finish(){
  if(ended)return;ended=true;cancelAnimationFrame(raf);
  root.style.overflow='';heroOn();
  box.classList.add('done');setTimeout(function(){if(box.parentNode)box.parentNode.removeChild(box)},460);
  removeEventListener('wheel',finish);removeEventListener('touchmove',finish);removeEventListener('keydown',onKey);
}
function toGate(){var now=performance.now();if(now-start<OPEN)start=now-OPEN}
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
  /* Логотип и ворота */
  if(t>=OPEN-200){
    if(vStart<0)vStart=OPEN-200;
    var g=t-vStart;
    set('--vx-on',span(g,0,380));
    set('--vx-house',ease(span(g,60,700)));
    set('--vx-word',ease(span(g,260,900)));
    set('--vx-cap',span(g,520,900)*(1-span(g,V_FLY,V_FLY+300)));
    /* Ворота: закрыты, потом поднимаются и уходят под крышу. */
    set('--vx-lift',ease(span(g,V_LIFT,V_FLY+150)));
    /* Полёт: проём растёт до экрана, центр проёма уходит в центр. */
    /* Центр проёма меряем, когда домик уже в полный рост: до полёта он ещё растёт. */
    if(g>=V_FLY-60&&!lay){try{lay=layout()}catch(e){lay=null}if(!lay){finish();return}}
    if(lay){var f=ease(span(g,V_FLY,V_END));
    var sc=Math.exp(Math.log(lay.s1)*f);
    set('--vx-s',sc);set('--vx-tx',(lay.dx*f).toFixed(1)+'px');set('--vx-ty',(lay.dy*f).toFixed(1)+'px');}
    if(g>=V_END-120)heroOn();
    if(g>=V_END+60){finish();return}
  }
  raf=requestAnimationFrame(frame);
}
/* Тап: во время промо — сразу к логотипу, во время логотипа — на первый экран. */
box.addEventListener('click',function(e){if(e.target&&e.target.id==='in-skip'){finish();return}var t=performance.now()-start;if(t<OPEN-250)toGate();else finish()});
addEventListener('wheel',finish,{passive:true});addEventListener('touchmove',finish,{passive:true});addEventListener('keydown',onKey);

/* Страховка: что бы ни случилось, через 12 секунд страница открыта. */
setTimeout(finish,12000);
raf=requestAnimationFrame(frame);
})();
