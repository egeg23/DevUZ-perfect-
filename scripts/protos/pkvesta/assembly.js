(function(){
'use strict';
/* assembly — здание собирается из деталей, пока листаете. Рисунок кодом на
   canvas, без фото: фундаменты, колонны, фермы на болтах, прогоны и ригели,
   связи, болты, потом профлист стен и кровли плавно ложится сверху.
   Положение каждой детали — чистая функция от прокрутки (как в навыке
   hyperframes-animation: плавное затухание, без отскока; у каркаса лёгкая
   оседка пружиной ζ≈0.85, профлист — мягкая синусоида). Прокрутка своя:
   кадр липкий, страница листается ровно настолько, насколько двинули палец.
   Сцена разворачивается из карточки во весь экран — по мотивам «Scroll
   media expansion hero» (@arunachalam, 21st.dev, MIT). */
var d=document,asm=d.getElementById('asm');if(!asm)return;
var cv=asm.querySelector('.asm-cv');if(!cv||!cv.getContext)return;
var cx=cv.getContext('2d'),root=d.documentElement;
var reduce=false;try{reduce=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
var clamp=function(x,a,b){return x<a?a:x>b?b:x};
/* Пружина ζ=0.85 в замкнутом виде: быстрый старт, долгая оседка, перелёт ~1%. */
var Z=.85,WN=7.4,WD=WN*Math.sqrt(1-Z*Z);
var spring=function(t){if(t<=0)return 0;if(t>=1)return 1;var e=Math.exp(-Z*WN*t);return 1-e*(Math.cos(WD*t)+Z*WN/WD*Math.sin(WD*t))};
var out3=function(t){return 1-Math.pow(1-t,3)};
var sine=function(t){return -(Math.cos(Math.PI*t)-1)/2};

/* ── Геометрия, метры: склад 24 × 48 × 6, шаг колонн 6, уклон кровли ── */
var W=24,L=48,H=6,BAY=6,NB=L/BAY,RISE=2.6,HR=H+RISE,HALF=W/2;
var roofY=function(x){return x<=HALF?H+RISE*x/HALF:H+RISE*(W-x)/HALF};
var C=Math.cos(Math.PI/6),S=.5;
var P=function(x,y,z){return [(x-z)*C,(x+z)*S-y]};
var parts=[];
/* Деталь: что рисуем, где в общей шкале, откуда прилетает. */
function part(o){o.depth=o.depth!=null?o.depth:0;parts.push(o);return o}
function windowed(list,t0,t1,dur){var n=list.length;list.forEach(function(p,i){var a=n>1?t0+(t1-t0-dur)*i/(n-1):t0;p.t0=a;p.t1=a+dur})}

/* Земля и разметка. */
var ground=part({kind:'ground',t0:0,t1:.06,fly:[0,0],depth:-999});
/* Фундаменты под колоннами. */
var pads=[],cols=[],rafs=[],purl=[],girts=[],posts=[],brace=[],bolts=[],wall=[],gable=[],roofF=[],roofN=[],trims=[];
for(var b=0;b<=NB;b++){var z=b*BAY;[0,W].forEach(function(x){pads.push(part({kind:'pad',x:x,z:z,fly:[0,1.6],depth:x+z}))})}
pads.sort(function(a,c){return a.depth-c.depth});windowed(pads,.02,.16,.05);
/* Колонны: опускаются краном сверху. */
for(b=0;b<=NB;b++){z=b*BAY;[0,W].forEach(function(x){cols.push(part({kind:'mem',a:[x,0,z],b:[x,H,z],w:1.15,fly:[0,-9],depth:x+z+.1}))})}
windowed(cols,.12,.34,.07);
/* Фермы: две половины на кадр, сходятся у конька. */
for(b=0;b<=NB;b++){z=b*BAY;
  rafs.push(part({kind:'mem',a:[0,H,z],b:[HALF,HR,z],w:1.05,fly:[-2.5,-11],rot:-.12,depth:HALF/2+z+.2}));
  rafs.push(part({kind:'mem',a:[HALF,HR,z],b:[W,H,z],w:1.05,fly:[2.5,-11],rot:.12,depth:HALF*1.5+z+.2}));}
windowed(rafs,.3,.52,.07);
/* Прогоны кровли и ригели стен: по пролёту, въезжают вдоль здания. */
var px=[0,2.4,4.8,7.2,9.6,HALF,14.4,16.8,19.2,21.6,W];
for(b=0;b<NB;b++){var z0=b*BAY,z1=z0+BAY;
  px.forEach(function(x){var y=roofY(x);purl.push(part({kind:'mem',a:[x,y,z0],b:[x,y,z1],w:.55,fly:[0,0],dz:7,depth:x+z0+3}))});
  [2,4].forEach(function(y){[0,W].forEach(function(x){girts.push(part({kind:'mem',a:[x,y,z0],b:[x,y,z1],w:.5,dz:7,fly:[0,0],depth:x+z0+3}))})});}
purl.sort(function(a,c){return a.a[2]-c.a[2]||a.a[0]-c.a[0]});windowed(purl,.5,.68,.05);
girts.sort(function(a,c){return a.a[2]-c.a[2]});windowed(girts,.54,.7,.05);
/* Фахверк торцов: стойки и ригели. */
[0,L].forEach(function(z){[6,12,18].forEach(function(x){posts.push(part({kind:'mem',a:[x,0,z],b:[x,roofY(x),z],w:.7,fly:[0,-7],depth:x+z+.15}))})});
windowed(posts,.46,.6,.06);
[0,L].forEach(function(z){[2,4].forEach(function(y){for(var i=0;i<4;i++)girts.push(part({kind:'mem',a:[i*6,y,z],b:[i*6+6,y,z],w:.5,fly:[0,0],dz:0,dx:-6,depth:i*6+z+3,t0:.6+i*.01,t1:.68+i*.01}))})});
/* Связи жёсткости в крайних пролётах: крест. */
[0,NB-1].forEach(function(bb){var z0=bb*BAY,z1=z0+BAY;
  [0,W].forEach(function(x){brace.push(part({kind:'x',q:[[x,0,z0],[x,H,z1],[x,H,z0],[x,0,z1]],depth:x+z0+2.5}))});
  brace.push(part({kind:'x',q:[[0,H,z0],[HALF,HR,z1],[HALF,HR,z0],[0,H,z1]],depth:HALF/2+z0+2.5}));
  brace.push(part({kind:'x',q:[[HALF,HR,z0],[W,H,z1],[W,H,z0],[HALF,HR,z1]],depth:HALF*1.5+z0+2.5}));});
windowed(brace,.66,.74,.04);
/* Болты в узлах: колонна + ферма, конёк. */
for(b=0;b<=NB;b++){z=b*BAY;[[0,H],[W,H],[HALF,HR]].forEach(function(q){bolts.push(part({kind:'bolt',at:[q[0],q[1],z],depth:q[0]+z+4}))})}
windowed(bolts,.68,.78,.03);
/* Профлист стен: листы по 3 м, опускаются сверху вдоль ближней стены. */
for(var i=0;i<L/3;i++){wall.push(part({kind:'sheet',face:'x',q:[[W,0,i*3],[W,H,i*3],[W,H,i*3+3],[W,0,i*3+3]],fly:[0,-14],depth:W+i*3+20}))}
windowed(wall,.74,.86,.05);
/* Торец: полосы по 3 м до линии кровли. */
for(i=0;i<W/3;i++){var xa=i*3,xb=xa+3;gable.push(part({kind:'sheet',face:'z',q:[[xa,0,L],[xa,roofY(xa),L],[xb,roofY(xb),L],[xb,0,L]],fly:[0,-14],depth:xa+L+20}))}
windowed(gable,.78,.88,.05);
/* Кровля: дальний скат, потом ближний; лист от карниза до конька. */
for(i=0;i<L/3;i++){var za=i*3,zb=za+3;
  roofF.push(part({kind:'roof',side:0,q:[[0,H,za],[HALF,HR,za],[HALF,HR,zb],[0,H,zb]],fly:[-3,-26],rot:-.06,depth:900+za}));
  roofN.push(part({kind:'roof',side:1,q:[[HALF,HR,za],[W,H,za],[W,H,zb],[HALF,HR,zb]],fly:[3,-26],rot:.06,depth:950+za}));}
windowed(roofF,.84,.95,.06);windowed(roofN,.87,.985,.06);
/* Доборные элементы и размеры. */
var fin=part({kind:'trim',t0:.95,t1:1,depth:2000});
var dimP=part({kind:'dims',t0:.96,t1:1,depth:2100});
parts.sort(function(a,c){return a.depth-c.depth});

/* ── Камера: вписать здание в холст ── */
var dpr=1,Wc=0,Hc=0,sc=1,ox=0,oy=0;
function fit(){
  var r=cv.getBoundingClientRect();dpr=Math.min(devicePixelRatio||1,2);
  Wc=Math.max(1,r.width);Hc=Math.max(1,r.height);cv.width=Math.round(Wc*dpr);cv.height=Math.round(Hc*dpr);
  var xs=[],ys=[];[[0,0,0],[W,0,0],[0,0,L],[W,0,L],[HALF,HR,0],[HALF,HR,L],[0,H,0],[W,H,L]].forEach(function(p){var q=P(p[0],p[1],p[2]);xs.push(q[0]);ys.push(q[1])});
  var mnx=Math.min.apply(0,xs),mxx=Math.max.apply(0,xs),mny=Math.min.apply(0,ys),mxy=Math.max.apply(0,ys);
  sc=Math.min(Wc*.9/(mxx-mnx),Hc*.8/(mxy-mny));
  ox=Wc/2-(mnx+mxx)/2*sc;oy=Hc*.5-(mny+mxy)/2*sc;
  last=-1;
}
var V=function(p){var q=P(p[0],p[1],p[2]);return [ox+q[0]*sc,oy+q[1]*sc]};

/* ── Рисование ── */
var COL={steel:'#8fa7d6',steelHi:'#e2eaf8',edge:'#0b1630',pad:['#a4afc0','#7c889c','#8e9ab0'],wall:['#e9eef5','#c9d3e0'],rib:'rgba(80,100,135,.35)',ribHi:'rgba(255,255,255,.55)',roof:['#2f4f9c','#22397a'],roofN:['#3a5cb0','#2a4690'],roofRib:'rgba(150,180,240,.45)',lime:'#d6e01c',grid:'rgba(143,167,214,.16)',dim:'#b9c4d8'};
function local(p,t){return clamp((t-p.t0)/Math.max(.0001,p.t1-p.t0),0,1)}
function seg(a,b,w,dx,dy){var A=V(a),B=V(b);
  cx.lineCap='round';cx.strokeStyle=COL.steel;cx.lineWidth=Math.max(1.4,w*sc*.2);cx.beginPath();cx.moveTo(A[0]+dx,A[1]+dy);cx.lineTo(B[0]+dx,B[1]+dy);cx.stroke();
  cx.strokeStyle=COL.steelHi;cx.lineWidth=Math.max(.6,w*sc*.06);cx.beginPath();cx.moveTo(A[0]+dx-.5,A[1]+dy-.5);cx.lineTo(B[0]+dx-.5,B[1]+dy-.5);cx.stroke()}
function poly(q,dx,dy){cx.beginPath();q.forEach(function(p,i){var v=V(p);if(i)cx.lineTo(v[0]+dx,v[1]+dy);else cx.moveTo(v[0]+dx,v[1]+dy)});cx.closePath()}
function withRot(p,k,dx,dy,fn){if(!p.rot||k>=1){fn(dx,dy);return}
  var c=V(p.a?[(p.a[0]+p.b[0])/2,(p.a[1]+p.b[1])/2,(p.a[2]+p.b[2])/2]:p.q[0]);cx.save();cx.translate(c[0]+dx,c[1]+dy);cx.rotate(p.rot*(1-k));cx.translate(-c[0]-dx,-c[1]-dy);fn(dx,dy);cx.restore()}
function draw(t){
  cx.setTransform(dpr,0,0,dpr,0,0);cx.clearRect(0,0,Wc,Hc);
  for(var n=0;n<parts.length;n++){var p=parts[n],k=local(p,t);if(k<=0&&p.kind!=='ground')continue;
    var a=out3(clamp(k*2.2,0,1)),mv,dx=0,dy=0,u=sc;
    if(p.kind==='roof'||p.kind==='sheet'){mv=sine(k)}else{mv=spring(k)}
    if(p.fly){dx=p.fly[0]*u*(1-mv);dy=p.fly[1]*u*(1-mv)}
    if(p.dz){var dd=P(0,0,p.dz),ee=P(0,0,0);dx+=(dd[0]-ee[0])*u*(1-mv);dy+=(dd[1]-ee[1])*u*(1-mv)}
    if(p.dx){var gg=P(p.dx,0,0),hh=P(0,0,0);dx+=(gg[0]-hh[0])*u*(1-mv);dy+=(gg[1]-hh[1])*u*(1-mv)}
    cx.globalAlpha=a;
    if(p.kind==='ground'){cx.globalAlpha=.25+.75*out3(clamp(t/.06,0,1));cx.strokeStyle=COL.grid;cx.lineWidth=1;
      for(var gx=-6;gx<=W+6;gx+=3){var A=V([gx,0,-6]),B=V([gx,0,L+6]);cx.beginPath();cx.moveTo(A[0],A[1]);cx.lineTo(B[0],B[1]);cx.stroke()}
      for(var gz=-6;gz<=L+6;gz+=3){A=V([-6,0,gz]);B=V([W+6,0,gz]);cx.beginPath();cx.moveTo(A[0],A[1]);cx.lineTo(B[0],B[1]);cx.stroke()}
      /* тень здания растёт вместе с кровлей */
      var sh=clamp((t-.7)/.3,0,1);if(sh>0){cx.globalAlpha=sh*.5;cx.fillStyle='rgba(0,6,20,.55)';poly([[0,0,0],[W+3,0,0],[W+3,0,L+3],[0,0,L+3]],0,0);cx.fill()}
      continue}
    if(p.kind==='pad'){var s=.5,h=.5,x=p.x,z=p.z;
      cx.fillStyle=COL.pad[1];poly([[x+s,0,z-s],[x+s,0,z+s],[x+s,-h,z+s],[x+s,-h,z-s]],dx,dy);cx.fill();
      cx.fillStyle=COL.pad[2];poly([[x-s,0,z+s],[x+s,0,z+s],[x+s,-h,z+s],[x-s,-h,z+s]],dx,dy);cx.fill();
      cx.fillStyle=COL.pad[0];poly([[x-s,0,z-s],[x+s,0,z-s],[x+s,0,z+s],[x-s,0,z+s]],dx,dy);cx.fill();continue}
    if(p.kind==='mem'){withRot(p,k,dx,dy,function(ddx,ddy){seg(p.a,p.b,p.w,ddx,ddy)});continue}
    if(p.kind==='x'){cx.globalAlpha=a*.9;cx.strokeStyle=COL.steel;cx.lineWidth=Math.max(.8,sc*.07);var q=p.q,sx=.6+.4*mv;
      var c0=V([(q[0][0]+q[1][0])/2,(q[0][1]+q[1][1])/2,(q[0][2]+q[1][2])/2]);cx.save();cx.translate(c0[0],c0[1]);cx.scale(sx,sx);cx.translate(-c0[0],-c0[1]);
      cx.beginPath();var v0=V(q[0]),v1=V(q[1]),v2=V(q[2]),v3=V(q[3]);cx.moveTo(v0[0],v0[1]);cx.lineTo(v1[0],v1[1]);cx.moveTo(v2[0],v2[1]);cx.lineTo(v3[0],v3[1]);cx.stroke();cx.restore();continue}
    if(p.kind==='bolt'){var bv=V(p.at),r=Math.max(2,sc*.32)*(1+.6*(1-spring(k)));cx.fillStyle=COL.lime;cx.beginPath();cx.arc(bv[0],bv[1],r,0,Math.PI*2);cx.fill();
      if(k<1){cx.globalAlpha=(1-k)*.6;cx.strokeStyle=COL.lime;cx.lineWidth=1.2;cx.beginPath();cx.arc(bv[0],bv[1],r+6*k*sc*.2+4,0,Math.PI*2);cx.stroke()}continue}
    if(p.kind==='sheet'){withRot(p,k,dx,dy,function(ddx,ddy){
      var g0=V(p.q[0]),g2=V(p.q[2]),gr=cx.createLinearGradient(g0[0],g0[1],g2[0],g2[1]);gr.addColorStop(0,COL.wall[0]);gr.addColorStop(1,COL.wall[1]);
      cx.fillStyle=gr;poly(p.q,ddx,ddy);cx.fill();
      /* рёбра профлиста: вертикальные, через 0,5 м */
      cx.save();poly(p.q,ddx,ddy);cx.clip();
      for(var e=0;e<=6;e++){var f=e/6,A,B;if(p.face==='x'){var zz=p.q[0][2]+3*f;A=V([W,0,zz]);B=V([W,H,zz])}else{var xx=p.q[0][0]+3*f;A=V([xx,0,L]);B=V([xx,roofY(xx),L])}
        cx.strokeStyle=COL.rib;cx.lineWidth=Math.max(1,sc*.09);cx.beginPath();cx.moveTo(A[0]+ddx,A[1]+ddy);cx.lineTo(B[0]+ddx,B[1]+ddy);cx.stroke();
        cx.strokeStyle=COL.ribHi;cx.lineWidth=.8;cx.beginPath();cx.moveTo(A[0]+ddx+1.2,A[1]+ddy);cx.lineTo(B[0]+ddx+1.2,B[1]+ddy);cx.stroke()}
      cx.restore();cx.strokeStyle='rgba(60,80,115,.5)';cx.lineWidth=.8;poly(p.q,ddx,ddy);cx.stroke()});continue}
    if(p.kind==='roof'){withRot(p,k,dx,dy,function(ddx,ddy){
      var col=p.side?COL.roofN:COL.roof,g0=V(p.q[0]),g1=V(p.q[1]),gr=cx.createLinearGradient(g0[0],g0[1],g1[0],g1[1]);gr.addColorStop(0,col[0]);gr.addColorStop(1,col[1]);
      cx.fillStyle=gr;poly(p.q,ddx,ddy);cx.fill();
      cx.save();poly(p.q,ddx,ddy);cx.clip();cx.strokeStyle=COL.roofRib;cx.lineWidth=Math.max(1,sc*.08);
      for(var e=0;e<=6;e++){var zz=p.q[0][2]+3*e/6,A=V([p.side?HALF:0,p.side?HR:H,zz]),B=V([p.side?W:HALF,p.side?H:HR,zz]);cx.beginPath();cx.moveTo(A[0]+ddx,A[1]+ddy);cx.lineTo(B[0]+ddx,B[1]+ddy);cx.stroke()}
      cx.restore();cx.strokeStyle='rgba(10,20,50,.5)';cx.lineWidth=.8;poly(p.q,ddx,ddy);cx.stroke()});continue}
    if(p.kind==='trim'){cx.strokeStyle=COL.lime;cx.lineWidth=Math.max(1.6,sc*.14);cx.lineCap='round';
      [[[HALF,HR,0],[HALF,HR,L]],[[W,H,0],[W,H,L]],[[W,0,L],[W,H,L]],[[0,H,L],[HALF,HR,L]],[[HALF,HR,L],[W,H,L]],[[W,0,0],[W,H,0]]].forEach(function(s){var A=V(s[0]),B=V(s[1]);cx.beginPath();cx.moveTo(A[0],A[1]);cx.lineTo(B[0],B[1]);cx.stroke()});continue}
    if(p.kind==='dims'){cx.strokeStyle=COL.dim;cx.fillStyle=COL.dim;cx.lineWidth=1;cx.font='700 '+Math.round(clamp(sc*.9,12,18))+'px Oswald, "Arial Narrow", sans-serif';cx.textAlign='center';cx.textBaseline='middle';
      var off=2.2;[[[W+off,0,0],[W+off,0,L],L+' м'],[[0,0,L+off],[W,0,L+off],W+' м']].forEach(function(s){var A=V(s[0]),B=V(s[1]);cx.beginPath();cx.moveTo(A[0],A[1]);cx.lineTo(B[0],B[1]);cx.stroke();
        [A,B].forEach(function(T){cx.beginPath();cx.arc(T[0],T[1],2,0,Math.PI*2);cx.fill()});var m=[(A[0]+B[0])/2,(A[1]+B[1])/2];cx.save();cx.translate(m[0],m[1]);cx.rotate(Math.atan2(B[1]-A[1],B[0]-A[0]));cx.fillStyle='#0b1630';cx.fillRect(-26,-11,52,22);cx.fillStyle=COL.dim;cx.fillText(s[2],0,0);cx.restore()});
      var A=V([W+off,0,L]),B=V([W+off,H,L]);cx.beginPath();cx.moveTo(A[0],A[1]);cx.lineTo(B[0],B[1]);cx.stroke();cx.fillStyle='#0b1630';cx.fillRect((A[0]+B[0])/2+6,(A[1]+B[1])/2-11,40,22);cx.fillStyle=COL.dim;cx.textAlign='left';cx.fillText(H+' м',(A[0]+B[0])/2+10,(A[1]+B[1])/2);continue}
  }
  cx.globalAlpha=1;
}

/* ── Прокрутка → шкала сборки ── */
var steps=[].slice.call(asm.querySelectorAll('.asm-steps li')),bar=asm.querySelector('.asm-bar'),now=asm.querySelector('.asm-now'),frame=asm.querySelector('.asm-frame');
var CUTS=[.3,.5,.74],lastK=-1,last=-1,active=false,raf=0,pinned=false;
function stepOf(t){return t<CUTS[0]?0:t<CUTS[1]?1:t<CUTS[2]?2:3}
function paint(t){
  if(Math.abs(t-last)<.0004)return;last=t;draw(t);
  if(bar)bar.style.setProperty('--p',t.toFixed(4));
  var k=stepOf(t);if(k!==lastK){lastK=k;steps.forEach(function(li,i){li.classList.toggle('on',i===k);li.classList.toggle('past',i<k)});if(now)now.textContent=steps[k].querySelector('p').textContent}
}
function progress(){var r=asm.getBoundingClientRect();return clamp(-r.top/Math.max(1,r.height-innerHeight),0,1)}
function loop(){raf=0;if(!active)return;var r=asm.getBoundingClientRect();
  /* Карточка разворачивается во весь экран на входе в сцену. */
  if(frame){var e=clamp(1-(r.top/innerHeight),0,1),s=.9+.1*out3(e);frame.style.transform='scale('+s.toFixed(4)+')'}
  /* Пока кадр закреплён, нижние кнопки не закрывают шаги. */
  var pin=r.top<=1&&r.bottom>=innerHeight-1;if(pin!==pinned){pinned=pin;root.classList.toggle('asm-in',pin)}
  paint(progress());raf=requestAnimationFrame(loop)}
fit();
if(reduce||root.classList.contains('k-no-assembly')){asm.classList.add('seen');paint(1);addEventListener('resize',function(){fit();last=-1;paint(1)});return}
paint(progress());
new IntersectionObserver(function(es){active=es[0].isIntersecting;if(active)asm.classList.add('seen');if(!active&&pinned){pinned=false;root.classList.remove('asm-in')}if(active&&!raf)raf=requestAnimationFrame(loop)}).observe(asm);
addEventListener('resize',function(){fit();last=-1;paint(progress())});
if(d.fonts&&d.fonts.ready)d.fonts.ready.then(function(){last=-1;paint(progress())});
})();
