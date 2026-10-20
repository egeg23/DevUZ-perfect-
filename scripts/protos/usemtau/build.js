(function(){
'use strict';
/* Сцена «склад из вашего каталога»: здание собирается, пока листаете.
   Рисунок кодом на canvas: фундаменты, колонны из двутавра, рамы из
   гофробалок (стенка волной прорисовывается), прогоны, ригели и связи,
   потом сэндвич-панели стен въезжают вдоль здания, кровельные поднимаются
   по скату. В узлах при посадке детали летят искры сварки. Положение каждой
   детали — функция от прокрутки, кадр липкий, страница листается ровно
   настолько, насколько двинули палец. Справа считается металл: длины из
   геометрии, вес по ГОСТ, деньги по их цене за тонну (um-data → bld). */
var d=document,root=d.documentElement,asm=d.getElementById('stroyka');if(!asm)return;
var cv=d.getElementById('asm-cv');if(!cv||!cv.getContext)return;
var cx=cv.getContext('2d'),data=JSON.parse(d.getElementById('um-data').textContent),B=data.bld;
var reduce=false;try{reduce=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
var clamp=function(x,a,b){return x<a?a:x>b?b:x};
var Z=.8,WN=7,WD=WN*Math.sqrt(1-Z*Z);
var spring=function(t){if(t<=0)return 0;if(t>=1)return 1;var e=Math.exp(-Z*WN*t);return 1-e*(Math.cos(WD*t)+Z*WN/WD*Math.sin(WD*t))};
var out3=function(t){return 1-Math.pow(1-t,3)},io=function(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2};

/* ── Геометрия, метры ── */
var W=B.W,L=B.L,H=B.H,RISE=B.RISE,BAY=B.BAY,NF=L/BAY+1,HALF=W/2,HR=H+RISE,DEP=.55;
var roofY=function(x){return x<=HALF?H+RISE*x/HALF:H+RISE*(W-x)/HALF};
/* Свой ракурс: длинная сторона уходит вправо полого, торец к зрителю слева. */
var A1=Math.PI/180*16,A2=Math.PI/180*38;
var P=function(x,y,z){return [z*Math.cos(A1)-x*Math.cos(A2)*.95,z*Math.sin(A1)+x*Math.sin(A2)*.95-y]};
var parts=[];
function part(o){o.dep=o.dep||0;parts.push(o);return o}
function spread(list,t0,t1,dur){var n=list.length;list.forEach(function(p,i){var a=n>1?t0+(t1-t0-dur)*i/(n-1):t0;p.t0=a;p.t1=a+dur})}
/* Глубина: дальше от зрителя — раньше рисуем. Зритель со стороны x=W, z=L. */
var dz=function(x,z){return x*1.2+z*.6};

var pads=[],cols=[],rafs=[],purl=[],girts=[],brace=[],wallP=[],gabP=[],roofP=[],sparks=[];
for(var f=0;f<NF;f++){var z=f*BAY;[0,W].forEach(function(x){pads.push(part({k:'pad',x:x,z:z,dep:dz(x,z)-50}))})}
spread(pads,.01,.14,.05);
for(f=0;f<NF;f++){z=f*BAY;[0,W].forEach(function(x){cols.push(part({k:'col',a:[x,0,z],b:[x,H,z],dep:dz(x,z),joint:[x,0,z]}))})}
spread(cols,.12,.31,.06);
for(f=0;f<NF;f++){z=f*BAY;
  rafs.push(part({k:'gofro',a:[0,H,z],b:[HALF,HR,z],dep:dz(HALF/2,z)+.5,joint:[0,H,z]}));
  rafs.push(part({k:'gofro',a:[W,H,z],b:[HALF,HR,z],dep:dz(HALF*1.5,z)+.5,joint:[HALF,HR,z]}))}
spread(rafs,.3,.51,.08);
var nP=Math.ceil(Math.hypot(HALF,RISE)/1.5);
for(var i=0;i<=nP;i++){[0,1].forEach(function(s){var x=s?W-HALF*i/nP:HALF*i/nP;purl.push(part({k:'bar',a:[x,roofY(x)+DEP*.2,0],b:[x,roofY(x)+DEP*.2,L],w:.7,col:'#8FA0B3',slide:'z',dep:dz(x,L/2)+1}))})}
spread(purl,.5,.62,.05);
[1.8,3.9,6].forEach(function(y){[0,W].forEach(function(x){girts.push(part({k:'bar',a:[x,y,0],b:[x,y,L],w:.6,col:'#7D8C9E',slide:'z',dep:dz(x,L/2)+1}))});[0,L].forEach(function(z){girts.push(part({k:'bar',a:[0,y,z],b:[W,y,z],w:.6,col:'#7D8C9E',slide:'x',dep:dz(W/2,z)+1}))})});
spread(girts,.53,.65,.05);
[0,NF-2].forEach(function(b){var z0=b*BAY,z1=z0+BAY;[0,W].forEach(function(x){brace.push(part({k:'x',q:[[x,0,z0],[x,H,z1],[x,H,z0],[x,0,z1]],dep:dz(x,z0+3)+2}))})});
spread(brace,.6,.67,.04);
/* Сэндвич-панели стен: горизонтальные полосы 1 м по пролёту, въезжают вдоль здания. */
var ROWS=Math.round(H);
for(f=0;f<NF-1;f++){for(var r=0;r<ROWS;r++){var z0=f*BAY,z1=z0+BAY,y0=r,y1=r+1;
  wallP.push(part({k:'panel',q:[[W,y0,z0],[W,y1,z0],[W,y1,z1],[W,y0,z1]],from:[0,0,-9],dep:dz(W,z0)+20+r*.01,ord:f*ROWS+r,c:['#2F80E8','#1E66CC'],face:'x'}))}}
wallP.sort(function(a,b){return a.ord-b.ord});spread(wallP,.66,.82,.05);
/* Торец: вертикальные панели по 1,5 м до линии кровли. */
for(var gx=0;gx<W;gx+=1.5){var xa=gx,xb=Math.min(W,gx+1.5);gabP.push(part({k:'panel',q:[[xa,0,L],[xa,roofY(xa),L],[xb,roofY(xb),L],[xb,0,L]],from:[0,9,0],dep:dz((xa+xb)/2,L)+30,c:['#3A8CF0','#2672D6'],face:'z'}))}
spread(gabP,.72,.86,.05);
/* Кровля: полосы 1 м от карниза к коньку, поднимаются по скату. */
for(var zz=0;zz<L;zz+=1.2){var za=zz,zb=Math.min(L,zz+1.2);
  roofP.push(part({k:'roof',side:0,q:[[0,H,za],[HALF,HR,za],[HALF,HR,zb],[0,H,zb]],from:[-4,-1.2,0],dep:900+za}));
  roofP.push(part({k:'roof',side:1,q:[[W,H,za],[HALF,HR,za],[HALF,HR,zb],[W,H,zb]],from:[4,-1.2,0],dep:950+za}))}
spread(roofP.filter(function(p){return !p.side}),.82,.95,.05);spread(roofP.filter(function(p){return p.side}),.84,.975,.05);
var gate=part({k:'gate',t0:.95,t1:1,dep:2000}),dims=part({k:'dims',t0:.96,t1:1,dep:2100});
parts.sort(function(a,b){return a.dep-b.dep});

/* ── Камера ── */
var dpr=1,Wc=0,Hc=0,sc=1,ox=0,oy=0,last=-1;
function fit(){var r=cv.getBoundingClientRect();dpr=Math.min(devicePixelRatio||1,2);Wc=Math.max(1,r.width);Hc=Math.max(1,r.height);cv.width=Math.round(Wc*dpr);cv.height=Math.round(Hc*dpr);
  var xs=[],ys=[];[[0,0,0],[W,0,0],[0,0,L],[W,0,L],[HALF,HR,0],[HALF,HR,L],[0,H,0],[W,H,L]].forEach(function(p){var q=P(p[0],p[1],p[2]);xs.push(q[0]);ys.push(q[1])});
  var mnx=Math.min.apply(0,xs),mxx=Math.max.apply(0,xs),mny=Math.min.apply(0,ys),mxy=Math.max.apply(0,ys),wide=Wc>=900;
  sc=Math.min(Wc*(wide?.5:.92)/(mxx-mnx),Hc*(wide?.5:.42)/(mxy-mny));
  ox=(wide?Wc*.42:Wc/2)-(mnx+mxx)/2*sc;oy=Hc*(wide?.6:.5)-(mny+mxy)/2*sc;last=-1}
var V=function(p){var q=P(p[0],p[1],p[2]);return [ox+q[0]*sc,oy+q[1]*sc]};

/* ── Рисование ── */
function loc(p,t){return clamp((t-p.t0)/Math.max(1e-4,p.t1-p.t0),0,1)}
function line(A,B,w,col){cx.strokeStyle=col;cx.lineWidth=w;cx.beginPath();cx.moveTo(A[0],A[1]);cx.lineTo(B[0],B[1]);cx.stroke()}
function poly(q,dx,dy){cx.beginPath();q.forEach(function(p,i){var v=V(p);if(i)cx.lineTo(v[0]+dx,v[1]+dy);else cx.moveTo(v[0]+dx,v[1]+dy)});cx.closePath()}
function grid(t){var a=.35+.65*out3(clamp(t/.08,0,1));cx.globalAlpha=a;cx.fillStyle='rgba(169,180,193,.22)';
  for(var x=-6;x<=W+6;x+=2)for(var z=-6;z<=L+6;z+=2){var v=V([x,0,z]);cx.fillRect(v[0]-1,v[1]-1,2,2)}
  var sh=clamp((t-.66)/.3,0,1);if(sh>0){cx.globalAlpha=sh*.55;cx.fillStyle='rgba(0,0,0,.5)';poly([[W,0,0],[W+4,0,2],[W+4,0,L+2],[W,0,L]],0,0);cx.fill()}cx.globalAlpha=1}
function draw(t){
  cx.setTransform(dpr,0,0,dpr,0,0);cx.clearRect(0,0,Wc,Hc);grid(t);
  for(var n=0;n<parts.length;n++){var p=parts[n],k=loc(p,t);if(k<=0)continue;var al=out3(clamp(k*2.5,0,1));cx.globalAlpha=al;
    if(p.k==='pad'){var s=.6,h=.6*out3(k),x=p.x,z=p.z;cx.fillStyle='#5B6573';poly([[x-s,0,z-s],[x-s,0,z+s],[x-s,-h,z+s],[x-s,-h,z-s]],0,0);cx.fill();cx.fillStyle='#6E7987';poly([[x-s,0,z+s],[x+s,0,z+s],[x+s,-h,z+s],[x-s,-h,z+s]],0,0);cx.fill();cx.fillStyle='#8D98A6';poly([[x-s,0,z-s],[x+s,0,z-s],[x+s,0,z+s],[x-s,0,z+s]],0,0);cx.fill();continue}
    if(p.k==='col'){var dy=-(1-spring(k))*9*sc,A=V(p.a),Bv=V(p.b);A[1]+=dy;Bv[1]+=dy;cx.lineCap='butt';line(A,Bv,Math.max(3,sc*.42),'#6F7D8E');line([A[0]-sc*.12,A[1]],[Bv[0]-sc*.12,Bv[1]],Math.max(1,sc*.08),'#C9D3DE');continue}
    if(p.k==='gofro'){gofro(p,k);continue}
    if(p.k==='bar'){var m=io(k),A2=V(p.a),B2=V(p.b),dd=p.slide==='z'?P(0,0,-12):P(-12,0,0),d0=P(0,0,0),ex=(dd[0]-d0[0])*sc*(1-m),ey=(dd[1]-d0[1])*sc*(1-m);line([A2[0]+ex,A2[1]+ey],[B2[0]+ex,B2[1]+ey],Math.max(1.2,sc*.1*p.w),p.col);continue}
    if(p.k==='x'){var q=p.q,v0=V(q[0]),v1=V(q[1]),v2=V(q[2]),v3=V(q[3]),e=out3(k);cx.lineWidth=Math.max(1,sc*.06);cx.strokeStyle='#9AA8B8';cx.beginPath();cx.moveTo(v0[0],v0[1]);cx.lineTo(v0[0]+(v1[0]-v0[0])*e,v0[1]+(v1[1]-v0[1])*e);cx.moveTo(v2[0],v2[1]);cx.lineTo(v2[0]+(v3[0]-v2[0])*e,v2[1]+(v3[1]-v2[1])*e);cx.stroke();continue}
    if(p.k==='panel'){var mv=io(k),f0=P(0,0,0),f1=P(p.from[0],p.from[1],p.from[2]),px=(f1[0]-f0[0])*sc*(1-mv),py=(f1[1]-f0[1])*sc*(1-mv);
      var g0=V(p.q[0]),g2=V(p.q[2]),gr=cx.createLinearGradient(g0[0],g0[1],g2[0],g2[1]);gr.addColorStop(0,p.c[0]);gr.addColorStop(1,p.c[1]);cx.fillStyle=gr;poly(p.q,px,py);cx.fill();
      cx.strokeStyle='rgba(8,24,52,.55)';cx.lineWidth=1;poly(p.q,px,py);cx.stroke();
      /* кромка утеплителя видна, пока панель едет */
      if(mv<1){cx.globalAlpha=al*(1-mv);cx.strokeStyle='#E6C35A';cx.lineWidth=Math.max(1.5,sc*.12);var e0=V(p.q[0]),e1=V(p.q[1]);cx.beginPath();cx.moveTo(e0[0]+px,e0[1]+py);cx.lineTo(e1[0]+px,e1[1]+py);cx.stroke()}continue}
    if(p.k==='roof'){var mr=io(k),r0=P(0,0,0),r1=P(p.from[0],p.from[1],p.from[2]),rx=(r1[0]-r0[0])*sc*(1-mr),ry=(r1[1]-r0[1])*sc*(1-mr);
      cx.fillStyle=p.side?'#E3E8EE':'#B9C3CE';poly(p.q,rx,ry);cx.fill();cx.strokeStyle=p.side?'rgba(80,96,116,.45)':'rgba(60,74,92,.5)';cx.lineWidth=1;poly(p.q,rx,ry);cx.stroke();continue}
    if(p.k==='gate'){var gk=out3(k),gw=4,gh=4.5*gk,x0=HALF-gw/2;cx.fillStyle='#F26A1F';poly([[x0,0,L+.02],[x0,gh,L+.02],[x0+gw,gh,L+.02],[x0+gw,0,L+.02]],0,0);cx.fill();
      cx.strokeStyle='rgba(0,0,0,.35)';cx.lineWidth=1;for(var gy=.5;gy<gh;gy+=.5){var a1=V([x0,gy,L+.02]),b1=V([x0+gw,gy,L+.02]);line(a1,b1,1,'rgba(0,0,0,.25)')}continue}
    if(p.k==='dims'){dimsDraw(out3(k))}
  }
  cx.globalAlpha=1}
/* Гофробалка: две полки и стенка волной, которая прорисовывается. */
function gofro(p,k){var m=spring(k),side=p.a[0]>HALF?1:-1,off=P(side*5,3,0),o0=P(0,0,0),dx=(off[0]-o0[0])*sc*(1-m),dy=(off[1]-o0[1])*sc*(1-m);
  var A=V(p.a),Bv=V(p.b),a2=V([p.a[0],p.a[1]-DEP,p.a[2]]),b2=V([p.b[0],p.b[1]-DEP,p.b[2]]);
  [A,Bv,a2,b2].forEach(function(v){v[0]+=dx;v[1]+=dy});
  cx.lineCap='round';line(A,Bv,Math.max(2,sc*.16),'#AEB9C6');line(a2,b2,Math.max(2,sc*.16),'#8693A3');
  var draw=clamp((k-.25)/.75,0,1),N=Math.round(Math.hypot(HALF,RISE)/.45),steps=N*6;if(draw<=0)return;
  cx.strokeStyle='#3BA2F2';cx.lineWidth=Math.max(1,sc*.07);cx.beginPath();
  for(var i=0;i<=steps*draw;i++){var s=i/steps,u=.5+.42*Math.sin(s*N*Math.PI*2),tx=A[0]+(Bv[0]-A[0])*s,ty=A[1]+(Bv[1]-A[1])*s,bx=a2[0]+(b2[0]-a2[0])*s,by=a2[1]+(b2[1]-a2[1])*s,x=tx+(bx-tx)*u,y=ty+(by-ty)*u;if(i)cx.lineTo(x,y);else cx.moveTo(x,y)}cx.stroke()}
function dimsDraw(a){cx.globalAlpha=a;cx.strokeStyle='#A9B4C1';cx.fillStyle='#A9B4C1';cx.lineWidth=1;cx.font='700 '+Math.round(clamp(sc*.75,12,16))+'px "Inter Tight",sans-serif';cx.textAlign='center';cx.textBaseline='middle';
  [[[W+2.4,0,0],[W+2.4,0,L],L+' м'],[[0,0,L+2.4],[W,0,L+2.4],W+' м']].forEach(function(s){var A=V(s[0]),Bv=V(s[1]);line(A,Bv,1,'#A9B4C1');[A,Bv].forEach(function(T){cx.beginPath();cx.arc(T[0],T[1],2.2,0,Math.PI*2);cx.fill()});
    var m=[(A[0]+Bv[0])/2,(A[1]+Bv[1])/2];cx.save();cx.translate(m[0],m[1]);cx.rotate(Math.atan2(Bv[1]-A[1],Bv[0]-A[0]));cx.fillStyle='#0D1014';cx.fillRect(-24,-10,48,20);cx.fillStyle='#EEF2F6';cx.fillText(s[2],0,0);cx.restore()});cx.globalAlpha=1}

/* ── Искры сварки: в узле, когда деталь садится, только при прокрутке вперёд. ── */
var landed={},rafS=0;
function spark(at){if(reduce)return;var v=V(at);for(var i=0;i<12;i++){var a=-Math.PI/2+(Math.random()-.5)*2.4,s=1.5+Math.random()*3.5;sparks.push({x:v[0],y:v[1],vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1})}if(!rafS)rafS=requestAnimationFrame(sparkLoop)}
function sparkLoop(){rafS=0;draw(last<0?0:last);cx.globalCompositeOperation='lighter';
  for(var i=sparks.length-1;i>=0;i--){var s=sparks[i];s.x+=s.vx;s.y+=s.vy;s.vy+=.25;s.life-=.045;if(s.life<=0){sparks.splice(i,1);continue}cx.globalAlpha=s.life;cx.strokeStyle=s.life>.5?'#FFD27A':'#F26A1F';cx.lineWidth=1.6;cx.beginPath();cx.moveTo(s.x,s.y);cx.lineTo(s.x-s.vx*2,s.y-s.vy*2);cx.stroke()}
  cx.globalAlpha=1;cx.globalCompositeOperation='source-over';if(sparks.length)rafS=requestAnimationFrame(sparkLoop)}

/* ── Смета справа ── */
var rowsEl=d.getElementById('asm-rows'),totT=d.getElementById('asm-t'),totS=d.getElementById('asm-s'),pan=d.getElementById('asm-pan'),mt=d.getElementById('asm-mt'),ms=d.getElementById('asm-ms');
var NB=' ',grp=function(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,NB)};
var fmtT=function(t){return (Math.round(t*100)/100).toFixed(2).replace('.',',')+NB+'т'};
rowsEl.innerHTML=B.rows.map(function(r){return '<li><span>'+r.n+'</span><b>'+(r.t!=null?fmtT(r.t):grp(r.m)+NB+'м')+'</b><small>'+r.what+(r.sum?' · '+grp(r.sum)+NB+'₸':'')+'</small></li>'}).join('');
var lis=[].slice.call(rowsEl.children);
var CUTS=[.12,.3,.5,.66,.82],steps=[].slice.call(asm.querySelectorAll('.asm-steps li')),bar=asm.querySelector('.asm-bar'),lastK=-1;
function stepOf(t){for(var i=CUTS.length-1;i>=0;i--)if(t>=CUTS[i])return i;return 0}
function ledger(t){var T=0,S=0;B.rows.forEach(function(r,i){var a=CUTS[r.step],b=CUTS[r.step+1]||1,k=clamp((t-a)/(b-a),0,1);lis[i].classList.toggle('on',k>0);if(r.t){T+=r.t*k;S+=r.sum*k}});
  totT.textContent=fmtT(T);totS.textContent=grp(S)+NB+'₸';if(mt){mt.textContent=fmtT(T);ms.textContent=grp(S)+NB+'₸'}pan.classList.toggle('on',t>=.66)}
function paint(t){if(Math.abs(t-last)<.0004)return;var prev=last;last=t;draw(t);if(bar)bar.style.setProperty('--p',t.toFixed(4));ledger(t);
  var k=stepOf(t);if(k!==lastK){lastK=k;steps.forEach(function(li,i){li.classList.toggle('on',i===k);li.classList.toggle('past',i<k)})}
  if(prev>=0&&t>prev){for(var i=0;i<parts.length;i++){var p=parts[i];if(p.joint&&!landed[i]&&loc(p,t)>=.98&&loc(p,prev)<.98){landed[i]=1;spark(p.joint)}}}}
function progress(){var r=asm.getBoundingClientRect();return clamp(-r.top/Math.max(1,r.height-innerHeight),0,1)}
var active=false,raf=0,pinned=false;
function loop(){raf=0;if(!active)return;var r=asm.getBoundingClientRect(),pin=r.top<=1&&r.bottom>=innerHeight-1;if(pin!==pinned){pinned=pin;root.classList.toggle('asm-in',pin)}paint(progress());raf=requestAnimationFrame(loop)}
fit();
if(reduce){asm.classList.add('seen');paint(1);addEventListener('resize',function(){fit();paint(1)});return}
paint(progress());
new IntersectionObserver(function(es){active=es[0].isIntersecting;if(!active&&pinned){pinned=false;root.classList.remove('asm-in')}if(active&&!raf)raf=requestAnimationFrame(loop)}).observe(asm);
addEventListener('resize',function(){fit();paint(progress())});
if(d.fonts&&d.fonts.ready)d.fonts.ready.then(function(){last=-1;paint(progress())});
})();
