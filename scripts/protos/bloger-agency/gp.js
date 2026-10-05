/* Glyph Portal © 2026 Christian Katzmann. MIT. https://ktzm.dk */
(function(){
var d=document,s=d.getElementById('gp');if(!s)return;
var pin=s.querySelector('.gp-pin'),field=s.querySelector('.gp-field'),art=s.querySelector('.gp-art'),clip=d.getElementById('gp-clip'),probe=s.querySelector('.gp-probe');
var texts=[].slice.call(clip.querySelectorAll('text'));
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
var FAM='"Unbounded"',WGT='700 ',LEN=1.4,AIM='O';
var W=1,H=1,startScale=1,endScale=1,center={x:0,y:0},target=null,bounds=null,raf=0,active=true,last=-1,mode='';
function clamp(n,a,b){a=a||0;b=b==null?1:b;return Math.min(b,Math.max(a,n))}
function smooth(a,b,n){var t=clamp((n-a)/(b-a));return t*t*(3-2*t)}
var cv=d.createElement('canvas'),cx=cv.getContext('2d',{willReadFrequently:true});
function still(){s.classList.add('gp-static');s.classList.remove('on')}
if(reduce||!cx||!d.fonts){still();return}
/* Самый большой сплошной квадрат внутри буквы — туда и летит камера. */
var memo={};function interior(ch,size){if(memo[ch]===undefined)memo[ch]=scanChar(ch);var m0=memo[ch];if(!m0)return null;var k=size/150;return {x:m0.x*k,y:m0.y*k,r:m0.r*k}}
function scanChar(ch){
  var scan=150;cx.font=WGT+scan+'px '+FAM;var m=cx.measureText(ch),pad=8;
  var left=Math.ceil(m.actualBoundingBoxLeft),asc=Math.ceil(m.actualBoundingBoxAscent);
  cv.width=Math.max(1,Math.ceil(m.actualBoundingBoxLeft+m.actualBoundingBoxRight)+pad*2);
  cv.height=Math.max(1,Math.ceil(m.actualBoundingBoxAscent+m.actualBoundingBoxDescent)+pad*2);
  cx.font=WGT+scan+'px '+FAM;cx.fillText(ch,pad+left,pad+asc);
  var w=cv.width,h=cv.height,px=cx.getImageData(0,0,w,h).data,rows=new Uint16Array(w+1),best=0,bx=0,by=0;
  for(var y=0;y<h;y++){var diag=0;for(var x=0;x<w;x++){var above=rows[x+1];rows[x+1]=px[(y*w+x)*4+3]>245?Math.min(above,rows[x],diag)+1:0;diag=above;if(rows[x+1]>best){best=rows[x+1];bx=x;by=y}}}
  if(best<3)return null;
  return {x:bx+1-best/2-pad-left,y:by+1-best/2-pad-asc,r:best/2-1};
}
function build(){
  var portrait=W/H<1.1,parts=portrait?['BLOGER','AGENCY']:['BLOGER AGENCY'],key=parts.join('|');
  if(key===mode&&bounds)return;mode=key;
  var m=parts.map(function(p){cx.font=WGT+'100px '+FAM;var q=cx.measureText(p);return {p:p,w:q.actualBoundingBoxLeft+q.actualBoundingBoxRight}});
  var widest=Math.max.apply(null,m.map(function(o){return o.w}));
  var y=0,lines=[],cands=[],minF=1e9;
  m.forEach(function(o){var f=100*(portrait?widest/o.w:1);minF=Math.min(minF,f)});
  m.forEach(function(o,i){
    var f=100*(portrait?widest/o.w:1);cx.font=WGT+f+'px '+FAM;
    var q=cx.measureText(o.p),L=q.actualBoundingBoxLeft,R=q.actualBoundingBoxRight,A=q.actualBoundingBoxAscent,D=q.actualBoundingBoxDescent;
    if(i)y+=minF*.14;y+=A;var ox=(L-R)/2;lines.push({p:o.p,f:f,x:ox,y:y});
    for(var c=0;c<o.p.length;c++){if(o.p[c]===' ')continue;cx.font=WGT+f+'px '+FAM;var adv=cx.measureText(o.p.slice(0,c)).width,k=interior(o.p[c],f);if(k)cands.push({ch:o.p[c],line:i,x:ox+adv+k.x,y:y+k.y,r:k.r})}
    y+=D;
  });
  bounds={x:-widest/2,y:0,w:widest,h:y};center={x:0,y:y/2};
  texts.forEach(function(t,i){var l=lines[i];if(!l){t.textContent='';return}t.textContent=l.p;t.setAttribute('x',l.x);t.setAttribute('y',l.y);t.setAttribute('font-size',l.f)});
  /* Летим в «O» из BLOGER — первую строку; нет её — в самую толстую букву. */
  var aim=cands.filter(function(c){return c.ch===AIM&&c.line===0});
  (aim.length?aim:cands).sort(function(a,b){return b.r-a.r||Math.abs(a.x)-Math.abs(b.x)});target=(aim.length?aim:cands)[0]||null;
}
function layout(){
  W=pin.clientWidth;H=Math.max(1,probe.offsetHeight);
  art.setAttribute('viewBox','0 0 '+W+' '+H);
  build();if(!target){still();return false}
  var portrait=W/H<1.1;
  startScale=Math.min(W*(portrait?.9:.86)/bounds.w,H*(portrait?.46:.4)/bounds.h);
  endScale=Math.max(startScale,Math.hypot(W,H)/(target.r*1.35));
  last=-1;return true;
}
function paint(p){
  var t=clamp(p/.78),e=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
  var sc=Math.exp(Math.log(startScale)+Math.log(endScale/startScale)*e);
  var bl=endScale===startScale?0:(1/sc-1/startScale)/(1/endScale-1/startScale);
  var cX=center.x+(target.x-center.x)*bl,cY=center.y+(target.y-center.y)*bl;
  var roll=-4*smooth(.06,.5,t)*(1-smooth(.62,.92,t)),rad=roll*Math.PI/180;
  var dx=W/2/sc,dy=(H*.46+H*.04*e)/sc;
  clip.setAttribute('transform','scale('+sc+') rotate('+roll+')');
  var tr='translate('+(Math.cos(rad)*dx+Math.sin(rad)*dy-cX)+' '+(-Math.sin(rad)*dx+Math.cos(rad)*dy-cY)+')';
  texts.forEach(function(x){x.setAttribute('transform',tr)});
  field.style.clipPath=t>=1?'none':'url(#gp-clip)';
  s.style.setProperty('--gp-cap',String(1-smooth(.01,.16,p)));
  s.style.setProperty('--gp-hit',p<.08?'auto':'none');
  s.style.setProperty('--gp-in',String(smooth(.6,.78,p)));
}
function frame(){
  raf=0;if(!active)return;
  var p=clamp(-s.getBoundingClientRect().top/(H*LEN));
  if(p!==last){last=p;paint(p)}
  raf=requestAnimationFrame(frame);
}
function loaded(){var ok=false;d.fonts.forEach(function(f){if(/Unbounded/.test(f.family)&&f.status==='loaded')ok=true});return ok}
function start(){
  if(!loaded()){still();return}
  if(!layout())return;
  s.classList.add('on');
  new ResizeObserver(function(){if(layout())paint(last<0?0:last)}).observe(s);
  new IntersectionObserver(function(es){active=es[0].isIntersecting;if(active&&!raf)raf=requestAnimationFrame(frame)}).observe(s);
  raf=requestAnimationFrame(frame);
}
/* Шрифт подключается отложенно: ждём, пока он правда загрузится, иначе буквы измерятся чужим шрифтом. */
var t0=Date.now();(function wait(){
  if(loaded())return start();
  if(Date.now()-t0>4000)return still();
  d.fonts.load(WGT+'100px '+FAM,'BLOGER AGENCY').then(function(){setTimeout(wait,80)},function(){setTimeout(wait,80)});
})();
})();
