(function(){
'use strict';
/* intro: заставка главной. Сначала промо DevUz Studio (как на devuz.studio),
   затем знак Karomat: золотой круг с их сайта, кольцо, буквы KAROMAT.
   Потом кольцо становится проёмом, и сквозь него открывается стол.
   Один requestAnimationFrame, прокрутку не трогает. Раз за визит, тап ведёт
   дальше, «Пропустить» сразу на сайт. */
var d=document,root=d.documentElement,box=d.getElementById('intro');
function heroOn(){var h=d.getElementById('hero');if(h)h.classList.add('hero-on')}
if(!box){heroOn();return}
if(root.classList.contains('intro-off')){box.parentNode.removeChild(box);heroOn();return}
try{sessionStorage.setItem('km-intro','1')}catch(e){}

var span=function(t,a,b){return Math.min(Math.max((t-a)/(b-a),0),1)};
var ease=function(x){return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2};
var out3=function(x){return 1-Math.pow(1-x,3)};
var accel=function(x){return x*x};
var set=function(n,v){box.style.setProperty(n,typeof v==='number'?v.toFixed(4):v)};

/* Промо DevUz Studio: хронометраж как на devuz.studio. */
var BURST=2500,OPEN=3050;
/* Знак: от конца промо. */
var M_TURN=2100,M_END=3300;

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

/* Знак Karomat на тёмном поле: золотой круг с их сайта вырастает, вокруг
   золотом прочерчивается кольцо, буквы KAROMAT встают по одной, под ними
   «ресторан · Фозилтепа 10А». Потом кольцо становится круглым проёмом,
   растёт, и сквозь него открывается стол первого экрана. Рисует canvas. */
var cvs=box.querySelector('.km-cv'),ctx=cvs&&cvs.getContext('2d'),LG=!!ctx,cw=0,ch=0,cd=1;
var FIELD='#121110',WORD='KAROMAT',NAME=(cvs&&cvs.getAttribute('data-name'))||'',FONT='"Prata",Georgia,serif',TXT='"Onest",system-ui,sans-serif';
var img=new Image();if(cvs)img.src=cvs.getAttribute('data-logo');
function sizeCv(){if(!cvs)return;cd=Math.min(devicePixelRatio||1,2);cw=innerWidth;ch=innerHeight;cvs.width=Math.round(cw*cd);cvs.height=Math.round(ch*cd)}
sizeCv();addEventListener('resize',sizeCv);
function drawLogo(m,hole){
  if(!ctx)return;var cx=cw/2,cy=ch*.42,r=Math.min(cw*.2,92);
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cvs.width,cvs.height);ctx.setTransform(cd,0,0,cd,0,0);
  var f=new Path2D();f.rect(-2,-2,cw+4,ch+4);
  if(hole>0)f.arc(cx,cy,r*1.3+hole*Math.hypot(cw,ch),0,Math.PI*2);
  ctx.fillStyle=FIELD;ctx.fill(f,'evenodd');
  var fade=1-Math.min(1,hole*3);if(fade<=0)return;
  /* Знак вырастает из точки. */
  var g=out3(span(m,100,900));
  if(img.complete&&img.naturalWidth&&g>0){ctx.save();ctx.globalAlpha=fade*Math.min(1,g*1.4);var s=r*2*(.6+.4*g);ctx.drawImage(img,cx-s/2,cy-s/2,s,s);ctx.restore()}
  /* Кольцо прочерчивается золотом. */
  var dr=out3(span(m,300,1400));ctx.save();ctx.globalAlpha=fade;ctx.strokeStyle='#d9b344';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(cx,cy,r*1.3,-Math.PI/2,-Math.PI/2+Math.PI*2*dr);ctx.stroke();ctx.restore();
  /* Буквы встают по одной. */
  var fs=Math.round(Math.min(cw*.09,44));ctx.save();ctx.font='400 '+fs+'px '+FONT;ctx.textAlign='center';ctx.textBaseline='middle';
  var sp=fs*.3,ws=WORD.split(''),tw=ws.reduce(function(s,c){return s+ctx.measureText(c).width},0)+sp*(ws.length-1),x=cx-tw/2,ty=cy+r*1.3+fs*1.3;
  ws.forEach(function(c,i){var k=out3(span(m,500+i*90,1100+i*90)),w=ctx.measureText(c).width;ctx.globalAlpha=k*fade;ctx.fillStyle='#d9b344';ctx.fillText(c,x+w/2,ty+(1-k)*14);x+=w+sp});
  ctx.restore();
  var w2=span(m,1150,1600);if(w2>0&&NAME){ctx.save();ctx.globalAlpha=w2*fade;ctx.fillStyle='#cbbfae';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='400 '+Math.round(Math.min(cw*.032,14))+'px '+TXT;ctx.fillText(NAME.toUpperCase().split('').join(String.fromCharCode(8202)),cx,ty+fs*1.1);ctx.restore()}
}
try{if(d.fonts&&d.fonts.load)d.fonts.load('400 48px "Prata"')}catch(e){}
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
  /* Знак Karomat */
  if(t>=OPEN-200&&cvs&&LG){
    if(mStart<0)mStart=OPEN-200;
    var m=t-mStart;
    set('--en-on',span(m,0,300));set('--en-slit',span(m,M_TURN,M_TURN+300));
    var hole=Math.pow(ease(span(m,M_TURN,M_END)),1.7)*1.4;
    drawLogo(m,hole);
    if(m>=M_END-260)heroOn();
    if(m>=M_END+60){finish();return}
  }
  raf=requestAnimationFrame(frame);
}
/* Тап: во время промо сразу к знаку, во время знака на первый экран. */
box.addEventListener('click',function(e){if(e.target&&e.target.id==='in-skip'){finish();return}var t=performance.now()-start;if(t<OPEN-250)toSign();else finish()});
addEventListener('wheel',finish,{passive:true});addEventListener('touchmove',finish,{passive:true});addEventListener('keydown',onKey);

/* Страховка: что бы ни случилось, через 12 секунд страница открыта. */
setTimeout(finish,12000);
raf=requestAnimationFrame(frame);
})();
