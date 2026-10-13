(function(){
'use strict';
/* intro: заставка главной. Сначала промо DevUz Studio (как на devuz.studio),
   затем знак GAZMETPROD SERVIS: прочерчивается ромб, загорается пламя,
   проявляются буквы. Камера влетает в пламя: оно
   становится просветом, и сквозь него открывается первый экран. Один
   requestAnimationFrame, прокрутку не трогает. Раз за визит, тап ведёт
   дальше, кнопка «Пропустить» сразу открывает сайт. */
var d=document,root=d.documentElement,box=d.getElementById('intro');
function heroOn(){var h=d.getElementById('hero');if(h)h.classList.add('hero-on')}
if(!box){heroOn();return}
if(root.classList.contains('intro-off')){box.parentNode.removeChild(box);heroOn();return}
try{sessionStorage.setItem('eg-intro','1')}catch(e){}

var span=function(t,a,b){return Math.min(Math.max((t-a)/(b-a),0),1)};
var ease=function(x){return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2};
var out3=function(x){return 1-Math.pow(1-x,3)};
var accel=function(x){return x*x};
var set=function(n,v){box.style.setProperty(n,typeof v==='number'?v.toFixed(4):v)};

/* Промо DevUz Studio: хронометраж как на devuz.studio. */
var BURST=2500,OPEN=3050;
/* Логотип: от конца промо. */
var M_TURN=2500,M_FLY=2850,M_END=4100;

var cv=box.querySelector('.dz-code'),cx=cv&&cv.getContext('2d'),dpr=1,bits=[],bitsDone=false;
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

/* Знак GAZMETPROD: ромб, голубое пламя и белое сердце пламени в единицах
   их логотипа (1200 x 352). Рисует canvas вектором: чёткий на любом
   увеличении. Пламя потом становится просветом на первый экран. */
var cvs=box.querySelector('.eg-cv'),ctx=cvs&&cvs.getContext('2d'),LG=null,RH=null,FL=null,IN=null,LP=[],HOLE=null,cw=0,ch=0,cd=1;
if(cvs&&ctx&&typeof Path2D==='function'){
  try{LG=JSON.parse(cvs.dataset.logo);RH=new Path2D(LG.rh);FL=new Path2D(LG.flame);IN=new Path2D(LG.inner);LP=LG.letters.map(function(d){return new Path2D(d)});HOLE=new Path2D();HOLE.addPath(RH);HOLE.addPath(FL)}catch(e){LG=null}
}
function sizeCv(){if(!cvs)return;cd=Math.min(devicePixelRatio||1,2);cw=innerWidth;ch=innerHeight;cvs.width=Math.round(cw*cd);cvs.height=Math.round(ch*cd)}
sizeCv();addEventListener('resize',sizeCv);
/* На телефоне логотип не влезает в ширину целиком: знак крупно, буквы под ним. */
function base(){var w=innerWidth,h=innerHeight,narrow=w<640,s=narrow?Math.min(w*.62,300)/352:Math.min(w*.8,1000)/LG.w;return {s:s,cx:w/2,cy:h*(narrow?.42:.46),narrow:narrow}}
function drawLogo(cam,draw,fill,flame,heart,letters,slit,narrow){
  if(!ctx||!LG)return;
  ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.clearRect(0,0,cvs.width,cvs.height);
  var T=function(){ctx.setTransform(cd,0,0,cd,0,0);ctx.translate(cam[0],cam[1]);ctx.scale(cam[2],cam[2]);ctx.translate(-cam[3],-cam[4])};
  T();
  /* Тёмное поле вокруг пламени: пламя — просвет, закрытый, пока slit меньше 1. */
  var r=new Path2D();r.rect(cam[3]-cam[0]/cam[2]-2,cam[4]-cam[1]/cam[2]-2,cw/cam[2]+4,ch/cam[2]+4);r.addPath(FL);
  ctx.fillStyle='#110e33';ctx.fill(r,'evenodd');
  if(slit<1){ctx.globalAlpha=1-slit;ctx.fill(FL);ctx.globalAlpha=1}
  /* Ромб: контур прочерчивается, потом заливается. */
  if(fill>0){ctx.globalAlpha=fill;ctx.fillStyle='#352e71';ctx.fill(HOLE,'evenodd');ctx.globalAlpha=1}
  if(draw>0&&draw<1.4){ctx.save();ctx.lineWidth=4;ctx.strokeStyle='rgba(127,220,255,'+(1-Math.max(0,draw-1)*2.5).toFixed(3)+')';ctx.setLineDash([1100*Math.min(draw,1),1200]);ctx.stroke(RH);ctx.restore()}
  /* Пламя растёт от основания и чуть дрожит. */
  var now=performance.now()/1000;
  if(flame>0){ctx.save();ctx.globalAlpha=1-slit;ctx.translate(176,304);ctx.scale(.94+.06*flame+Math.sin(now*9)*.012,flame*(1+Math.sin(now*7.3)*.02));ctx.translate(-176,-304);
    var g=ctx.createLinearGradient(0,58,0,304);g.addColorStop(0,'#7fdcff');g.addColorStop(1,'#00b1f1');ctx.fillStyle=g;ctx.fill(FL);
    if(heart>0){ctx.globalAlpha=(1-slit)*heart;ctx.fillStyle='#ffffff';ctx.fill(IN)}ctx.restore()}
  /* Буквы: на компьютере справа от знака, на телефоне под ним. */
  ctx.fillStyle='#ffffff';
  for(var j=0;j<LP.length;j++){var a=letters[j];if(a<=0)continue;ctx.save();ctx.globalAlpha=a*(1-slit*.6);
    if(narrow){if(j<10){ctx.translate(176,392);ctx.scale(.6,.6);ctx.translate(-803,-50)}else{ctx.translate(176,472);ctx.scale(.6,.6);ctx.translate(-659,-200)}}
    ctx.translate(0,(1-a)*60);ctx.fill(LP[j]);ctx.restore()}
  ctx.globalAlpha=1;
}
var raf=0,ended=false,mStart=-1;
var start=performance.now()-Math.min(Math.max(performance.now()-900,0),1800);
function finish(){
  if(ended)return;ended=true;cancelAnimationFrame(raf);
  root.style.overflow='';heroOn();
  box.classList.add('done');setTimeout(function(){if(box.parentNode)box.parentNode.removeChild(box)},460);
  removeEventListener('wheel',finish);removeEventListener('touchmove',finish);removeEventListener('keydown',onKey);
}
function toSign(){var now=performance.now();if(now-start<OPEN)start=now-OPEN}
function onKey(e){if(e.key==='Escape')finish()}
var last=performance.now();
function frame(now){
  var t=now-start,dt=Math.min(now-last,48);last=now;
  /* Промо */
  set('--dz-grid',span(t,80,900)*(1-span(t,BURST,BURST+420)));
  set('--dz-grid-s',1.34-ease(span(t,80,2000))*.3-span(t,2050,BURST)*.05);
  var born=ease(span(t,140,980)),charge=span(t,1900,BURST),blast=span(t,BURST,BURST+380);
  set('--dz-draw',born);set('--dz-fill',span(t,620,1180));
  set('--dz-sg',Math.min(span(t,100,420),1)*(1-blast));
  set('--dz-sg-s',.88+born*.12-ease(charge)*.09+accel(blast)*.9);
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
  if(t>=BURST&&!bits.length){var mk=box.querySelector('.dz-sign').getBoundingClientRect();bits=makeBits(mk.left+mk.width/2,mk.top+mk.height/2)}
  /* Символы промо гаснут сами; когда погасли все, холст больше не трогаем. */
  if(bits.length&&!bitsDone){paint(dt);bitsDone=bits.every(function(b){return b.age>b.life});if(bitsDone&&cx)cx.clearRect(0,0,cv.width/dpr,cv.height/dpr)}
  /* Знак GAZMETPROD */
  if(t>=OPEN-200&&cvs&&LG){
    if(mStart<0)mStart=OPEN-200;
    var m=t-mStart,B=base(),lt=[];
    set('--en-on',span(m,0,300));
    var draw=span(m,0,800)*1.4,fill=ease(span(m,450,950)),flame=out3(span(m,700,1300)),heart=span(m,1000,1400);
    for(var j=0;j<LP.length;j++){var b2=1000+j*45;lt.push(out3(span(m,b2,b2+420)))}
    set('--en-cap',span(m,1400,1700)*(1-span(m,M_TURN,M_TURN+300)));
    var slit=span(m,M_TURN-100,M_TURN+400);set('--en-slit',slit);
    /* Камера: пламя уходит в центр экрана и растёт, пока просвет не накроет экран. */
    var E=LG.eye,MX=B.narrow?176:LG.w/2,MY=B.narrow?240:LG.h/2;
    var turn=ease(span(m,M_TURN,M_FLY+200)),fly=ease(span(m,M_FLY,M_END));
    var cover=Math.hypot(innerWidth,innerHeight)/(2*E[2])*1.25;
    var sc=B.s*Math.exp(Math.log(cover/B.s)*fly);
    var px=MX+(E[0]-MX)*turn,py=MY+(E[1]-MY)*turn;
    var x=B.cx,y=B.cy+(innerHeight/2-B.cy)*turn;
    drawLogo([x,y,sc,px,py],draw,fill,flame,heart,lt,slit,B.narrow);
    if(m>=M_END-140)heroOn();
    if(m>=M_END+60){finish();return}
  }
  raf=requestAnimationFrame(frame);
}
/* Тап: во время промо сразу к логотипу, во время логотипа на первый экран. */
box.addEventListener('click',function(e){if(e.target&&e.target.id==='in-skip'){finish();return}var t=performance.now()-start;if(t<OPEN-250)toSign();else finish()});
addEventListener('wheel',finish,{passive:true});addEventListener('touchmove',finish,{passive:true});addEventListener('keydown',onKey);

/* Страховка: что бы ни случилось, через 12 секунд страница открыта. */
setTimeout(finish,12000);
raf=requestAnimationFrame(frame);
})();
