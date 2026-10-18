(function(){
'use strict';
/* intro: заставка главной. Сначала промо DevUz Studio (как на devuz.studio),
   затем знак бюро: стальные буквы SIA проявляются слева направо, под ними адрес, и камера
   влетает в букву: сквозь неё открывается первый экран.
   Один requestAnimationFrame, прокрутку не трогает. Раз за визит, тап ведёт
   дальше, «Пропустить» сразу на сайт, без движения заставки нет. */
var d=document,root=d.documentElement,box=d.getElementById('intro');
function heroOn(){if(d.body.classList.contains('hero-on'))return;[].forEach.call(d.querySelectorAll('.hero .wipe,.hero .wipe-in'),function(w){void getComputedStyle(w).transform});requestAnimationFrame(function(){d.body.classList.add('hero-on')})}
if(!box){heroOn();return}
if(root.classList.contains('intro-off')){box.parentNode.removeChild(box);heroOn();return}
try{sessionStorage.setItem('sia-intro','1')}catch(e){}

var span=function(t,a,b){return Math.min(Math.max((t-a)/(b-a),0),1)};
var ease=function(x){return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2};
var accel=function(x){return x*x};
var set=function(n,v){box.style.setProperty(n,typeof v==='number'?v.toFixed(4):v)};

/* Промо DevUz Studio: хронометраж как на devuz.studio. */
var BURST=2500,OPEN=3050;
/* Знак бюро: от конца промо. Буквы проявляются, затем каждая ферма букв
   летит на своё место в каркасе виллы APx180.2606 с первого экрана, лист
   светлеет до бумаги, каркас дорисовывается, и сквозь него проступает
   чертёж того же дома: заставка кончается ровно на первом экране. */
var B_DRAW=1100,B_WORD=700,B_LINES=1400,B_MOVE=1500,B_FLY=1500,B_LAG=700,B_PAPER=1900,B_GROW=2900,B_SEE=3800,B_END=4600;
var LN=window.SIA_LINES,bcv=box.querySelector('.br-cv'),bcx=bcv&&bcv.getContext('2d'),pairs=null,extra=null;
function bResize(){if(!bcx)return;bcv.width=Math.round(innerWidth*dpr);bcv.height=Math.round(innerHeight*dpr);bcx.setTransform(dpr,0,0,dpr,0,0)}
function build(){
  bResize();
  var lg=box.querySelector('.br-wipe img').getBoundingClientRect(),hd=d.querySelector('.hero-d');if(!LN||!hd)return false;
  var hb=hd.getBoundingClientRect(),hs=LN.houseSize,k=Math.max(hb.width/hs[0],hb.height/hs[1]),ox=hb.left+(hb.width-hs[0]*k)/2,oy=hb.top+(hb.height-hs[1]*k)/2;
  var lk=lg.width/(LN.logoSize[0]*2),L=[],H=[],i;
  for(i=0;i<LN.logo.length;i+=4)L.push([lg.left+LN.logo[i]*lk,lg.top+LN.logo[i+1]*lk,lg.left+LN.logo[i+2]*lk,lg.top+LN.logo[i+3]*lk]);
  for(i=0;i<LN.house.length;i+=4){var h=[ox+LN.house[i]*k,oy+LN.house[i+1]*k,ox+LN.house[i+2]*k,oy+LN.house[i+3]*k],mx=(h[0]+h[2])/2,my=(h[1]+h[3])/2;if(mx>-10&&mx<innerWidth+10&&my>-10&&my<innerHeight+10)H.push(h)}
  if(!H.length)return false;
  var mid=function(a){return(a[0]+a[2])/2},take=H.slice(0,Math.min(L.length,H.length));
  L.sort(function(a,b){return mid(a)-mid(b)});take.sort(function(a,b){return mid(a)-mid(b)});
  pairs=L.map(function(a,j){var b=take[Math.floor(j*take.length/L.length)];return{a:a,b:b,lag:j/L.length*B_LAG+Math.random()*160,up:40+Math.random()*120,dx:(Math.random()-.5)*80}});
  extra=H.slice(take.length,take.length+520);return true;
}
function mix(a,b,t){return Math.round(a+(b-a)*t)}
function lines(m){
  if(!bcx)return;bcx.clearRect(0,0,bcv.width/dpr,bcv.height/dpr);
  if(m<B_LINES)return;if(!pairs&&!build()){bcx=null;return}
  var paper=span(m,B_PAPER,B_PAPER+1200),fade=1-span(m,B_SEE+200,B_END-100);if(fade<=0)return;
  bcx.strokeStyle='rgb('+mix(236,58,paper)+','+mix(231,50,paper)+','+mix(222,42,paper)+')';bcx.lineWidth=1;bcx.globalAlpha=fade*(.55+.45*span(m,B_LINES,B_LINES+200));
  bcx.beginPath();
  for(var i=0;i<pairs.length;i++){var p=pairs[i],t=ease(span(m,B_MOVE+p.lag,B_MOVE+p.lag+B_FLY)),arc=Math.sin(Math.PI*t),a=p.a,b=p.b;
    var lx=arc*p.dx,ly=-arc*p.up;
    bcx.moveTo(a[0]+(b[0]-a[0])*t+lx,a[1]+(b[1]-a[1])*t+ly);bcx.lineTo(a[2]+(b[2]-a[2])*t+lx,a[3]+(b[3]-a[3])*t+ly)}
  for(var j=0;j<extra.length;j++){var g=ease(span(m,B_GROW+j*1.6,B_GROW+j*1.6+500));if(g<=0)break;var e=extra[j],cx=(e[0]+e[2])/2,cy=(e[1]+e[3])/2,hx=(e[2]-e[0])/2*g,hy=(e[3]-e[1])/2*g;bcx.moveTo(cx-hx,cy-hy);bcx.lineTo(cx+hx,cy+hy)}
  bcx.stroke();
}

var cv=box.querySelector('.dz-code'),cx=cv&&cv.getContext('2d'),dpr=1,bits=[],bitsDone=false;
function resize(){if(!cx)return;dpr=Math.min(devicePixelRatio||1,2);cv.width=Math.round(innerWidth*dpr);cv.height=Math.round(innerHeight*dpr);cx.setTransform(dpr,0,0,dpr,0,0)}
resize();addEventListener('resize',function(){resize();if(pairs){pairs=null;extra=null;bResize()}});
var GL=['</>','{ }','=>','( )','[ ]','&&','::','01','10','#',';','|','$','~','!=','++','·'],SPARK=['#22f0a0','#5b9bff','#e8b14c'],INK=['#eaf0f7','#22f0a0','#5b9bff','#8b97a8','#e8b14c'];
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

var raf=0,ended=false;
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
  /* Знак бюро: линии, слово, влёт в проём. */
  var m=t-(OPEN-200);
  if(m>=0){
    set('--en-on',span(m,260,420));set('--br-on',span(m,0,240));
    set('--br-draw',ease(span(m,100,B_DRAW)));
    set('--br-word',ease(span(m,B_WORD,B_WORD+500))*(1-span(m,B_LINES,B_LINES+300)));
    set('--br-png',1-span(m,B_LINES,B_LINES+220));
    set('--br-paper',ease(span(m,B_PAPER,B_PAPER+1200)));
    set('--br-see',ease(span(m,B_SEE,B_END-200)));
    lines(m);
    if(m>=B_END-300)heroOn();
    if(m>=B_END+60){finish();return}
  }
  raf=requestAnimationFrame(frame);
}
/* Тап: во время промо сразу к знаку, во время знака на первый экран. */
box.addEventListener('click',function(e){if(e.target&&e.target.id==='in-skip'){finish();return}if(dzv&&dzv.on()){dzv.end();return}var t=performance.now()-start;if(t<OPEN-250)toSign();else finish()});
addEventListener('wheel',finish,{passive:true});addEventListener('touchmove',finish,{passive:true});addEventListener('keydown',onKey);

/* Страховка: что бы ни случилось, через 12 секунд страница открыта. */
setTimeout(finish,14000);
/* Промо DevUz: сначала видео (dz-video.mjs), после него знак с OPEN-300.
   Видео не заиграло: промо кодом выше, с нуля. */
var dzv=null;
function go(video){if(ended)return;start=performance.now()-(video?OPEN-300:0);last=performance.now();raf=requestAnimationFrame(frame)}
if(typeof dzVideo==='function')dzv=dzVideo(box,go);else go(false);
})();
