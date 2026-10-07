(function(){
'use strict';
/* intro — заставка главной: промо DevUz Studio, затем влёт в букву SHAHAR.
   Один requestAnimationFrame раскладывает время по переменным узла, как в
   заставке Golden House и в промо devuz.studio.
   Влёт в букву: Glyph Portal © 2026 Christian Katzmann, MIT. https://ktzm.dk
   (поиск самого большого квадрата внутри буквы); здесь он идёт по времени,
   а не по прокрутке. */
var d=document,root=d.documentElement,box=d.getElementById('intro');
function heroOn(){var h=d.getElementById('hero');if(h)h.classList.add('hero-on')}
if(!box){heroOn();return}
if(root.classList.contains('intro-off')){box.parentNode.removeChild(box);heroOn();return}
try{sessionStorage.setItem('sh-intro','1')}catch(e){}

var span=function(t,a,b){return Math.min(Math.max((t-a)/(b-a),0),1)};
var ease=function(x){return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2};
var accel=function(x){return x*x};
var set=function(n,v){box.style.setProperty(n,typeof v==='number'?v.toFixed(4):v)};

/* ── Промо DevUz Studio: хронометраж как на devuz.studio ── */
var BURST=2500,OPEN=3050;
/* ── Влёт в букву: от конца промо ── */
var G_IN=0,G_HOLD=900,G_FLY=1500,G_END=2900;

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

/* ── Буквы SHAHAR: раскладка и цель внутри буквы ── */
var FAM='"Unbounded"',WGT='700 ',WORD='SHAHAR',AIM=3;
var field=box.querySelector('.gp-field'),clipG=d.getElementById('gp-clip'),line=d.getElementById('gp-line');
var clipT=clipG?[].slice.call(clipG.querySelectorAll('text')):[],lineT=line?[].slice.call(line.querySelectorAll('text')):[];
var mc=d.createElement('canvas'),mx=mc.getContext('2d',{willReadFrequently:true});
var lay=null;
function fontReady(){var ok=false;try{d.fonts.forEach(function(f){if(/Unbounded/.test(f.family)&&f.status==='loaded')ok=true})}catch(e){}return ok}
/* Самый большой сплошной квадрат внутри буквы — туда и летит камера (Glyph Portal, MIT). */
function interior(ch){
  var S=150;mx.font=WGT+S+'px '+FAM;var m=mx.measureText(ch),pad=8,L=Math.ceil(m.actualBoundingBoxLeft),A=Math.ceil(m.actualBoundingBoxAscent);
  mc.width=Math.max(1,Math.ceil(m.actualBoundingBoxLeft+m.actualBoundingBoxRight)+pad*2);mc.height=Math.max(1,Math.ceil(m.actualBoundingBoxAscent+m.actualBoundingBoxDescent)+pad*2);
  mx.font=WGT+S+'px '+FAM;mx.fillText(ch,pad+L,pad+A);
  var w=mc.width,h=mc.height,px=mx.getImageData(0,0,w,h).data,rows=new Uint16Array(w+1),best=0,bx=0,by=0;
  for(var y=0;y<h;y++){var dg=0;for(var x=0;x<w;x++){var ab=rows[x+1];rows[x+1]=px[(y*w+x)*4+3]>245?Math.min(ab,rows[x],dg)+1:0;dg=ab;if(rows[x+1]>best){best=rows[x+1];bx=x;by=y}}}
  if(best<3)return null;var k=100/S;
  return {x:(bx+1-best/2-pad-L)*k,y:(by+1-best/2-pad-A)*k,r:(best/2-1)*k};
}
function layout(){
  var W=innerWidth,H=innerHeight,fr=field.getBoundingClientRect();
  mx.font=WGT+'100px '+FAM;
  var full=mx.measureText(WORD),wid=full.width,asc=full.actualBoundingBoxAscent,x0=-wid/2,xs=[];
  for(var i=0;i<WORD.length;i++)xs.push(x0+mx.measureText(WORD.slice(0,i)).width);
  var cy=asc/2,tg=interior(WORD[AIM]);if(!tg)return null;
  var target={x:xs[AIM]+tg.x,y:tg.y+cy,r:tg.r};
  var s0=Math.min(W*(W<H?.88:.8)/wid,H*.3/asc);
  var s1=Math.max(s0,Math.hypot(W,H)/(target.r*1.2));
  for(var j=0;j<WORD.length;j++){[clipT[j],lineT[j]].forEach(function(t){if(!t)return;t.textContent=WORD[j];t.setAttribute('x',xs[j]);t.setAttribute('y',cy)})}
  return {W:W,H:H,cy:-fr.top+H*.47,s0:s0,s1:s1,t:target,asc:asc};
}
function drawGlyph(g){
  /* g: 0..1 полёта; камера держит цель под собой, масштаб — по логарифму. */
  var e=ease(g),sc=Math.exp(Math.log(lay.s0)+Math.log(lay.s1/lay.s0)*e);
  var bl=lay.s1===lay.s0?0:(1/sc-1/lay.s0)/(1/lay.s1-1/lay.s0);
  var cX=lay.t.x*bl,cY=lay.t.y*bl;
  var roll=-3*Math.sin(Math.PI*Math.min(1,g*1.15));
  var tr='translate('+(lay.W/2)+' '+lay.cy+') scale('+sc+') rotate('+roll+') translate('+(-cX)+' '+(-cY)+')';
  for(var i=0;i<clipT.length;i++)clipT[i].setAttribute('transform',tr);line.setAttribute('transform',tr);
}

/* ── Время ── */
var raf=0,ended=false,glyphOK=null,gStart=-1;
var start=performance.now()-Math.min(Math.max(performance.now()-900,0),1800);
function finish(){
  if(ended)return;ended=true;cancelAnimationFrame(raf);
  root.style.overflow='';heroOn();
  box.classList.add('done');setTimeout(function(){if(box.parentNode)box.parentNode.removeChild(box)},460);
  removeEventListener('wheel',finish);removeEventListener('touchmove',finish);removeEventListener('keydown',onKey);
}
function toGlyph(){var now=performance.now();if(now-start<OPEN)start=now-OPEN}
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
  /* Влёт в букву: шрифт обязан быть загружен — иначе буквы измерятся чужим шрифтом */
  if(glyphOK===null&&t>=OPEN-150){
    if(fontReady()&&clipG){try{lay=layout()}catch(e){lay=null}glyphOK=!!lay;if(lay){field.style.clipPath='url(#gp-clip)';field.style.webkitClipPath='url(#gp-clip)';gStart=Math.max(OPEN,t)}}
    else if(t>OPEN+1400)glyphOK=false;
  }
  if(glyphOK===false&&t>=OPEN){finish();return}
  if(glyphOK){
    var g=t-gStart;
    set('--gp-on',span(g,G_IN+150,G_HOLD));
    /* Контуры букв проступают по одной, фото наливается внутрь, контур гаснет. */
    for(var j=0;j<lineT.length;j++){var o=ease(span(g,j*70,j*70+320));lineT[j].style.opacity=String(o);lineT[j].style.transform='translateY('+((1-o)*14)+'px)'}
    line.style.opacity=String(1-span(g,G_HOLD-150,G_FLY+100));
    set('--gp-cap',span(g,450,800)*(1-span(g,G_FLY,G_FLY+300)));
    drawGlyph(span(g,G_FLY,G_END));
    if(g>=G_END){field.style.clipPath='none';field.style.webkitClipPath='none';heroOn()}
    if(g>=G_END+80){finish();return}
  }
  raf=requestAnimationFrame(frame);
}
/* Тап: во время промо — сразу к букве, во время буквы — на первый экран. */
box.addEventListener('click',function(e){if(e.target&&e.target.id==='in-skip'){finish();return}var t=performance.now()-start;if(t<OPEN-150)toGlyph();else finish()});
addEventListener('wheel',finish,{passive:true});addEventListener('touchmove',finish,{passive:true});addEventListener('keydown',onKey);
/* Страховка: что бы ни случилось, через 12 секунд страница открыта. */
setTimeout(finish,12000);
if(d.fonts&&d.fonts.load){try{d.fonts.load(WGT+'100px '+FAM,WORD)}catch(e){}}
raf=requestAnimationFrame(frame);
})();
