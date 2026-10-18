(function(){
'use strict';
/* intro: заставка главной. Сначала промо DevUz Studio (как на devuz.studio),
   затем их тёмно-синее поле как экран монитора: по нему бежит линия пульса,
   на последнем ударе пик уходит в шар знака Medikor, шар обводится и
   встаёт полосами, по бокам встают буквы. Затем «разряд»: из шара идёт
   кольцо, просвет растёт и открывает первый экран.
   Один requestAnimationFrame, прокрутку не трогает. Раз за визит, тап ведёт
   дальше, «Пропустить» сразу на сайт. */
var d=document,root=d.documentElement,box=d.getElementById('intro');
function heroOn(){var h=d.getElementById('hero');if(h)h.classList.add('hero-on')}
if(!box){heroOn();return}
if(root.classList.contains('intro-off')){box.parentNode.removeChild(box);heroOn();return}
try{sessionStorage.setItem('mk-intro','1')}catch(e){}
var span=function(t,a,b){return Math.min(Math.max((t-a)/(b-a),0),1)};
var ease=function(x){return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2};
var out3=function(x){return 1-Math.pow(1-x,3)};
var accel=function(x){return x*x};
var set=function(n,v){box.style.setProperty(n,typeof v==='number'?v.toFixed(4):v)};

/* Промо DevUz Studio: хронометраж как на devuz.studio. */
var BURST=2500,OPEN=3050;

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

/* Знак Medikor: буквы — пути (logo.json), «O» — их полосатый шар. Рисует
   canvas: чёткий на любом увеличении. Линия пульса идёт слева к шару, пик
   последнего удара приходится ровно на его середину. */
var cvs=box.querySelector('.mk-cv'),ctx=cvs&&cvs.getContext('2d'),LG=null,cw=0,ch=0,cd=1;
var FIELD='#00082d',PULSE='#35e39b',NAME=(cvs&&cvs.getAttribute('data-name'))||'',FONT='"Onest","Inter",system-ui,sans-serif';
if(cvs&&ctx&&typeof Path2D==='function'){try{LG=JSON.parse(cvs.getAttribute('data-logo'));LG.p=new Path2D(LG.d)}catch(e){LG=null}}
function sizeCv(){if(!cvs)return;cd=Math.min(devicePixelRatio||1,2);cw=innerWidth;ch=innerHeight;cvs.width=Math.round(cw*cd);cvs.height=Math.round(ch*cd)}
sizeCv();addEventListener('resize',sizeCv);
var M_DRAW=1500,M_BALL=1900,M_WORD=2500,M_SHOCK=2900,M_END=3900;
function geo(){var s=Math.min(cw*.8,520)/LG.w,x0=cw/2-LG.w*s/2,y0=ch*.46-LG.h*s/2;return {s:s,x0:x0,y0:y0,bx:x0+LG.ball.cx*s,by:y0+LG.ball.cy*s,br:LG.ball.r*s}}
/* Удар: P, QRS, T. Возвращает смещение вверх в долях высоты. */
function beat(u){if(u<.1||u>.86)return 0;
  if(u<.24)return Math.sin((u-.1)/.14*Math.PI)*.1;
  if(u<.34)return 0;
  if(u<.38)return -(u-.34)/.04*.12;
  if(u<.44)return -.12+(u-.38)/.06*1.12;
  if(u<.5)return 1-(u-.44)/.06*1.35;
  if(u<.55)return -.35+(u-.5)/.05*.35;
  if(u<.66)return 0;
  return Math.sin((u-.66)/.2*Math.PI)*.18}
function ecgY(x,g,amp,per){var off=g.bx-x+per*.44;var u=((off%per)+per)%per/per;return g.by-beat(1-u)*amp}
function stripes(g,col){ctx.save();ctx.beginPath();ctx.arc(g.bx,g.by,g.br,0,Math.PI*2);ctx.clip();
  var r=g.br,ox=g.bx-r*1.9,oy=g.by+r*1.6;ctx.strokeStyle=col;
  for(var i=0;i<6;i++){ctx.lineWidth=r*(.13-i*.012);ctx.beginPath();ctx.arc(ox,oy,r*(1.55+i*.3),0,Math.PI*2);ctx.stroke()}ctx.restore()}
function drawSign(m,hole){
  if(!ctx||!LG)return;var g=geo();
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cvs.width,cvs.height);ctx.setTransform(cd,0,0,cd,0,0);
  var r=new Path2D();r.rect(-2,-2,cw+4,ch+4);if(hole>0){var c=new Path2D();c.arc(g.bx,g.by,hole,0,Math.PI*2);r.addPath(c)}
  ctx.fillStyle=FIELD;ctx.fill(r,'evenodd');
  /* Кольцо разряда по краю просвета. */
  if(hole>0){var ring=1-Math.min(1,hole/(Math.hypot(cw,ch)*.9));ctx.save();ctx.globalAlpha=ring;ctx.strokeStyle=PULSE;ctx.lineWidth=2+ring*10;ctx.beginPath();ctx.arc(g.bx,g.by,hole,0,Math.PI*2);ctx.stroke();ctx.restore()}
  var fade=1-Math.min(1,hole/(Math.min(cw,ch)*.4));if(fade<=0)return;
  /* Сетка монитора. */
  ctx.save();ctx.globalAlpha=.08*fade*span(m,0,400);ctx.strokeStyle=PULSE;ctx.lineWidth=1;ctx.beginPath();
  for(var gx=(g.bx%32);gx<cw;gx+=32){ctx.moveTo(gx,0);ctx.lineTo(gx,ch)}for(var gy=(g.by%32);gy<ch;gy+=32){ctx.moveTo(0,gy);ctx.lineTo(cw,gy)}ctx.stroke();ctx.restore();
  /* Линия пульса: голова бежит от левого края к шару. */
  var amp=Math.min(ch*.22,g.br*3.2),per=Math.max(150,Math.min(260,cw*.34));
  var head=ease(span(m,0,M_DRAW))*(g.bx+per*.06),tail=span(m,M_BALL,M_WORD);
  ctx.save();ctx.globalAlpha=fade*(1-tail*.85);ctx.strokeStyle=PULSE;ctx.lineWidth=2.4;ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();
  var stop=Math.min(head,g.bx-g.br*.15);
  for(var x=0;x<=stop;x+=2){var y=x>g.bx-g.br?g.by:ecgY(x,g,amp,per);if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.stroke();
  if(head>2&&m<M_DRAW){var hy=ecgY(Math.min(head,stop),g,amp,per);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(Math.min(head,stop),hy,4,0,Math.PI*2);ctx.fill()}
  ctx.restore();
  /* Шар: обводка по кругу, затем заливка и полосы. */
  var o=span(m,M_DRAW-200,M_BALL),f=out3(span(m,M_BALL-100,M_BALL+300));
  if(o>0){ctx.save();ctx.globalAlpha=fade;ctx.strokeStyle=PULSE;ctx.lineWidth=2.4;ctx.beginPath();ctx.arc(g.bx,g.by,g.br,Math.PI,Math.PI+o*Math.PI*2);ctx.stroke();ctx.restore()}
  if(f>0){ctx.save();ctx.globalAlpha=f*fade;ctx.translate(g.bx,g.by);var k=.7+.3*f;ctx.scale(k,k);ctx.translate(-g.bx,-g.by);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(g.bx,g.by,g.br,0,Math.PI*2);ctx.fill();stripes(g,FIELD);ctx.restore()}
  /* Буквы встают от шара наружу. */
  var w=out3(span(m,M_BALL,M_WORD));
  if(w>0){ctx.save();ctx.globalAlpha=w*fade;ctx.beginPath();ctx.rect(0,0,cw,ch);ctx.translate(g.x0,g.y0);ctx.scale(g.s,g.s);ctx.translate(0,(1-w)*8);ctx.fillStyle='#fff';ctx.fill(LG.p);ctx.restore()}
  var n=span(m,M_BALL+300,M_WORD+200);
  if(n>0&&NAME){ctx.save();ctx.globalAlpha=n*fade*.85;ctx.fillStyle='#c9d4f2';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='400 '+Math.round(Math.min(cw*.042,20))+'px '+FONT;ctx.fillText(NAME,cw/2,g.y0+LG.h*g.s+36);ctx.restore()}
  /* Вспышка разряда. */
  var fl=span(m,M_SHOCK-80,M_SHOCK)*(1-span(m,M_SHOCK,M_SHOCK+320));
  if(fl>0){ctx.save();ctx.globalAlpha=fl*.55;var gr=ctx.createRadialGradient(g.bx,g.by,0,g.bx,g.by,Math.max(cw,ch)*.6);gr.addColorStop(0,'#ffffff');gr.addColorStop(.25,'rgba(53,227,155,.5)');gr.addColorStop(1,'rgba(53,227,155,0)');ctx.fillStyle=gr;ctx.fillRect(0,0,cw,ch);ctx.restore()}
}
try{if(d.fonts&&d.fonts.load)d.fonts.load('400 18px Onest')}catch(e){}
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
  if(bits.length&&!bitsDone){paint(dt);bitsDone=bits.every(function(b){return b.age>b.life});if(bitsDone&&cx)cx.clearRect(0,0,cv.width/dpr,cv.height/dpr)}
  /* Знак Medikor */
  if(t>=OPEN-200&&cvs&&LG){
    if(mStart<0)mStart=OPEN-200;
    var m=t-mStart;
    set('--en-on',span(m,0,300));set('--en-slit',span(m,M_DRAW,M_DRAW+300));
    var hole=Math.pow(ease(span(m,M_SHOCK,M_END)),1.5)*Math.hypot(cw,ch)*1.05;
    drawSign(m,hole);
    if(m>=M_END-300)heroOn();
    if(m>=M_END+60){finish();return}
  }
  raf=requestAnimationFrame(frame);
}
/* Тап: во время промо сразу к знаку, во время знака на первый экран. */
box.addEventListener('click',function(e){if(e.target&&e.target.id==='in-skip'){finish();return}if(dzv&&dzv.on()){dzv.end();return}var t=performance.now()-start;if(t<OPEN-250)toSign();else finish()});
addEventListener('wheel',finish,{passive:true});addEventListener('touchmove',finish,{passive:true});addEventListener('keydown',onKey);

/* Страховка: что бы ни случилось, через 12 секунд страница открыта. */
setTimeout(finish,12000);
/* Промо DevUz: сначала видео (dz-video.mjs), после него знак с OPEN-300.
   Видео не заиграло: промо кодом выше, с нуля. */
var dzv=null;
function go(video){if(ended)return;start=performance.now()-(video?OPEN-300:0);last=performance.now();raf=requestAnimationFrame(frame)}
if(typeof dzVideo==='function')dzv=dzVideo(box,go);else go(false);
})();
