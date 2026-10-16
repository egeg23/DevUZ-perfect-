(function(){
'use strict';
/* assembly: угловая кухня собирается из модулей, пока листаете. Рисунок
   кодом на canvas в изометрии (как сборка здания у pkvesta): сначала
   чертёж стен и размеры, потом цоколь и корпуса, фасады подъезжают
   спереди, столешница ложится сверху, встают мойка, варочная панель,
   духовка, микроволновка и вытяжка, и в конце в комнате темнеет и
   загорается подсветка под шкафами. Положение каждой детали: чистая
   функция от прокрутки, кадр липкий, страница листается ровно настолько,
   насколько двинули палец. */
var d=document,sec=d.getElementById('sborka');if(!sec)return;
var cv=sec.querySelector('.asm-cv');if(!cv||!cv.getContext)return;
var cx=cv.getContext('2d'),MM=cv.getAttribute('data-mm')||'мм';
var reduce=d.documentElement.classList.contains('rm');
var clamp=function(x,a,b){return x<a?a:x>b?b:x};
var out3=function(t){return 1-Math.pow(1-t,3)};
var Z=.8,WN=8,WD=WN*Math.sqrt(1-Z*Z);
var spring=function(t){if(t<=0)return 0;if(t>=1)return 1;var e=Math.exp(-Z*WN*t);return 1-e*(Math.cos(WD*t)+Z*WN/WD*Math.sin(WD*t))};

/* ── Геометрия, метры. Стены: задняя z=0, левая x=0; зритель в углу комнаты. ── */
var C=Math.cos(Math.PI/6),S=.5;
var P=function(x,y,z){return [(x-z)*C,(x+z)*S-y]};
var LOW=[.1,.82],TOPY=[.82,.86],UP=[1.4,2.1],DL=.58,DU=.34,LEN=3.6,SIDE=2.4,H=2.25;
var COL={
  wall:'#26231f',wall2:'#201d1a',floor:'#1a1815',grid:'rgba(244,239,231,.08)',blue:'rgba(159,195,164,.75)',
  body:['#e2ddd3','#c9c2b6','#b3ab9e'],edge:'rgba(20,18,15,.55)',
  low:['#43464c','#3a3d42','#2f3236'],oak:['#c49a6a','#b48a5b','#9d774c'],
  top:['#efe9df','#d9d1c4','#c7beb0'],metal:'#c9ccd1',dark:'#141416',glass:'#1d1f23',
  or:'#e34623',led:'255,214,160'
};
var parts=[];
function part(o){parts.push(o);return o}
/* Окна времени: детали списка по очереди внутри [t0,t1]. */
function seq(list,t0,t1,dur){var n=list.length;list.forEach(function(p,i){var a=n>1?t0+(t1-t0-dur)*i/(n-1):t0;p.t0=a;p.t1=a+dur})}

/* Модули: [от, до] вдоль стены и что на фасаде. */
var BACK=[[.6,1.2,'dr3'],[1.2,1.8,'d2'],[1.8,2.4,'d1'],[2.4,3,'dr3']];
var LEFT=[[.6,1.2,'d1'],[1.2,1.8,'dr3'],[1.8,2.4,'d2']];
var UPB=[[0,.6],[.6,1.2],[1.2,1.8],[1.8,2.4]],UPL=[[.34,.94],[.94,1.54],[1.54,2.14]];

/* Цоколь и корпуса низа. */
var plinth=[],carc=[],uppers=[],fronts=[],tops=[],tech=[];
plinth.push(part({k:'box',b:[0,3,0,LOW[0],0,.52],c:['#2a2826','#22201e','#1c1a18'],key:.5}));
plinth.push(part({k:'box',b:[0,.52,0,LOW[0],.6,SIDE],c:['#2a2826','#22201e','#1c1a18'],key:.49}));
seq(plinth,.03,.1,.06);
carc.push(part({k:'box',b:[0,.6,LOW[0],LOW[1],0,DL],c:COL.body,key:.6,fly:[0,1.4,0]}));
BACK.forEach(function(m){carc.push(part({k:'box',b:[m[0],m[1],LOW[0],LOW[1],0,DL],c:COL.body,key:(m[0]+m[1])/2+.3,fly:[0,1.4,0]}))});
LEFT.forEach(function(m){carc.push(part({k:'box',b:[0,DL,LOW[0],LOW[1],m[0],m[1]],c:COL.body,key:(m[0]+m[1])/2+.3,fly:[0,1.4,0]}))});
carc.sort(function(a,b){return a.key-b.key});seq(carc,.07,.24,.07);
/* Высокая колонна под духовку и микроволновку. */
var tall=part({k:'box',b:[3,LEN,0,H,0,.6],c:COL.body,key:3.6,fly:[0,2.4,0]});tall.t0=.2;tall.t1=.29;
/* Верхние шкафы. */
UPB.forEach(function(m){uppers.push(part({k:'box',b:[m[0],m[1],UP[0],UP[1],0,DU],c:COL.body,key:(m[0]+m[1])/2+.17-.05,fly:[0,1,0]}))});
UPL.forEach(function(m){uppers.push(part({k:'box',b:[0,DU,UP[0],UP[1],m[0],m[1]],c:COL.body,key:(m[0]+m[1])/2+.17-.05,fly:[0,1,0]}))});
uppers.push(part({k:'box',b:[2.4,3,1.76,UP[1],0,DU],c:COL.body,key:2.85,fly:[0,1,0]}));
seq(uppers,.17,.32,.06);

/* Фасады: панель на лицевой стороне, с зазорами, ручкой и, у дуба, волокнами. */
function front(axis,at,u0,u1,y0,y1,type,col,wood,key){return part({k:'front',axis:axis,at:at,u:[u0,u1],y:[y0,y1],type:type,c:col,wood:wood,key:key,fly:axis==='z'?[0,0,.7]:[.7,0,0]})}
BACK.forEach(function(m){fronts.push(front('z',DL+.02,m[0]+.003,m[1]-.003,LOW[0]+.01,LOW[1]-.012,m[2],COL.low,false,(m[0]+m[1])/2+.31))});
LEFT.forEach(function(m){fronts.push(front('x',DL+.02,m[0]+.003,m[1]-.003,LOW[0]+.01,LOW[1]-.012,m[2],COL.low,false,(m[0]+m[1])/2+.31))});
UPB.forEach(function(m,i){fronts.push(front('z',DU+.02,m[0]+(i===0?.34:.003),m[1]-.003,UP[0]+.01,UP[1]-.01,'up',COL.oak,true,(m[0]+m[1])/2+.18))});
UPL.forEach(function(m){fronts.push(front('x',DU+.02,m[0]+.003,m[1]-.003,UP[0]+.01,UP[1]-.01,'up',COL.oak,true,(m[0]+m[1])/2+.18))});
fronts.push(front('z',DU+.02,2.403,2.997,1.77,UP[1]-.01,'flap',COL.oak,true,2.86));
fronts.push(front('z',.62,3.003,LEN-.003,LOW[0]+.01,H-.01,'tall',COL.low,false,3.62));
seq(fronts,.33,.5,.06);

/* Столешница: две плиты, ложатся сверху. */
tops.push(part({k:'box',b:[0,3,TOPY[0],TOPY[1],0,.62],c:COL.top,key:3.4,fly:[0,.9,0],slab:1}));
tops.push(part({k:'box',b:[0,.62,TOPY[0],TOPY[1],.62,SIDE],c:COL.top,key:3.41,fly:[0,.9,0],slab:1}));
seq(tops,.52,.63,.08);

/* Техника. */
tech.push(part({k:'sink',key:3.45,fly:[0,.5,0]}));
tech.push(part({k:'hob',key:3.46,fly:[0,.5,0]}));
tech.push(part({k:'oven',key:3.63,fly:[0,0,.5]}));
tech.push(part({k:'micro',key:3.64,fly:[0,0,.5]}));
tech.push(part({k:'hood',key:2.9,fly:[0,.6,0]}));
seq(tech,.66,.82,.07);
var light=part({k:'light',key:99,t0:.84,t1:.98});
parts.sort(function(a,b){return a.key-b.key});

/* ── Камера ── */
var dpr=1,Wc=0,Hc=0,sc=1,ox=0,oy=0,last=-1;
function fit(){
  var r=cv.getBoundingClientRect();dpr=Math.min(devicePixelRatio||1,2);
  Wc=Math.max(1,r.width);Hc=Math.max(1,r.height);cv.width=Math.round(Wc*dpr);cv.height=Math.round(Hc*dpr);
  var pts=[[0,0,0],[4.1,0,0],[0,0,2.9],[4.1,0,.9],[.9,0,2.9],[0,2.55,0],[4.1,2.55,0],[0,2.55,2.9]],xs=[],ys=[];
  pts.forEach(function(p){var q=P(p[0],p[1],p[2]);xs.push(q[0]);ys.push(q[1])});
  var mnx=Math.min.apply(0,xs),mxx=Math.max.apply(0,xs),mny=Math.min.apply(0,ys),mxy=Math.max.apply(0,ys);
  var wide=Wc>=900&&!reduce,box=wide?[Wc*.42,Hc*.1,Wc*.96,Hc*.9]:reduce?[Wc*.04,Hc*.04,Wc*.96,Hc*.96]:[Wc*.04,Hc*.2,Wc*.96,Hc*.6];
  sc=Math.min((box[2]-box[0])/(mxx-mnx),(box[3]-box[1])/(mxy-mny));
  ox=(box[0]+box[2])/2-(mnx+mxx)/2*sc;oy=(box[1]+box[3])/2-(mny+mxy)/2*sc;last=-1;
}
var V=function(x,y,z){var q=P(x,y,z);return [ox+q[0]*sc,oy+q[1]*sc]};

/* ── Рисование ── */
var off=[0,0,0];
function poly(pts){cx.beginPath();pts.forEach(function(p,i){var v=V(p[0]+off[0],p[1]+off[1],p[2]+off[2]);if(i)cx.lineTo(v[0],v[1]);else cx.moveTo(v[0],v[1])});cx.closePath()}
function line(a,b){var A=V(a[0]+off[0],a[1]+off[1],a[2]+off[2]),B=V(b[0]+off[0],b[1]+off[1],b[2]+off[2]);cx.beginPath();cx.moveTo(A[0],A[1]);cx.lineTo(B[0],B[1]);cx.stroke()}
function box(b,c){var x0=b[0],x1=b[1],y0=b[2],y1=b[3],z0=b[4],z1=b[5];
  cx.fillStyle=c[0];poly([[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]]);cx.fill();
  cx.fillStyle=c[1];poly([[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]]);cx.fill();
  cx.fillStyle=c[2];poly([[x1,y0,z0],[x1,y0,z1],[x1,y1,z1],[x1,y1,z0]]);cx.fill();
  cx.strokeStyle=COL.edge;cx.lineWidth=.8;
  poly([[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]]);cx.stroke();
  poly([[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]]);cx.stroke();
  poly([[x1,y0,z0],[x1,y0,z1],[x1,y1,z1],[x1,y1,z0]]);cx.stroke()}
/* Точка на лицевой плоскости фасада: u вдоль стены, y вверх. */
function fp(f,u,y){return f.axis==='z'?[u,y,f.at]:[f.at,y,u]}
function frontDraw(f){
  var u0=f.u[0],u1=f.u[1],y0=f.y[0],y1=f.y[1],side=f.axis==='z'?0:1,T=.018;
  /* торец панели: тонкая полоска сверху и сбоку */
  cx.fillStyle=f.c[2];
  if(f.axis==='z'){poly([[u1,y0,f.at-T],[u1,y0,f.at],[u1,y1,f.at],[u1,y1,f.at-T]]);cx.fill()}
  cx.fillStyle=f.c[0];poly([fp(f,u0,y1),fp(f,u1,y1),f.axis==='z'?[u1,y1,f.at-T]:[f.at-T,y1,u1],f.axis==='z'?[u0,y1,f.at-T]:[f.at-T,y1,u0]]);cx.fill();
  cx.fillStyle=f.c[1+side];poly([fp(f,u0,y0),fp(f,u1,y0),fp(f,u1,y1),fp(f,u0,y1)]);cx.fill();
  if(f.wood){cx.save();poly([fp(f,u0,y0),fp(f,u1,y0),fp(f,u1,y1),fp(f,u0,y1)]);cx.clip();cx.lineWidth=.7;
    for(var g=0;g<26;g++){var gu=u0+(u1-u0)*((g*0.6180339)%1),a=.08+((g*7)%5)*.025;cx.strokeStyle='rgba(70,45,20,'+a.toFixed(3)+')';line(fp(f,gu,y0),fp(f,gu+((g%3)-1)*.01,y1))}
    cx.restore()}
  /* зазоры между дверцами и ящиками */
  cx.strokeStyle='rgba(8,8,8,.75)';cx.lineWidth=Math.max(1,sc*.006);
  var hs=[],vs=[];
  if(f.type==='dr3'){hs=[y0+(y1-y0)*.26,y0+(y1-y0)*.56]}
  else if(f.type==='d2'||f.type==='up'&&u1-u0>.5){vs=[(u0+u1)/2]}
  else if(f.type==='tall'){hs=[.86,1.48,1.88]}
  hs.forEach(function(h){line(fp(f,u0,h),fp(f,u1,h))});vs.forEach(function(v){line(fp(f,v,y0),fp(f,v,y1))});
  cx.strokeStyle='rgba(8,8,8,.5)';cx.lineWidth=1;poly([fp(f,u0,y0),fp(f,u1,y0),fp(f,u1,y1),fp(f,u0,y1)]);cx.stroke();
  /* ручки-профили: тонкий светлый штрих у верхнего края каждого ящика и двери */
  cx.strokeStyle='rgba(225,228,232,.8)';cx.lineWidth=Math.max(1.2,sc*.009);cx.lineCap='round';
  var rows=f.type==='dr3'?[y1,hs[1],hs[0]]:f.type==='tall'?[.86,H-.01]:f.type==='up'||f.type==='flap'?[]:[y1];
  rows.forEach(function(h){var hh=h-.035;if(f.type==='tall'&&h>1)hh=h-.06;line(fp(f,u0+(u1-u0)*.3,hh),fp(f,u1-(u1-u0)*.3,hh))});
  if(f.type==='up'||f.type==='flap'){var by=y0+.04;line(fp(f,u0+(u1-u0)*.35,by),fp(f,u1-(u1-u0)*.35,by))}
}
function ell(cxp,y,cz,r,n){var pts=[];for(var i=0;i<n;i++){var a=i/n*Math.PI*2;pts.push([cxp+Math.cos(a)*r,y,cz+Math.sin(a)*r])}return pts}
function techDraw(p){
  var y=TOPY[1]+.002;
  if(p.k==='sink'){cx.fillStyle='#2b2d31';poly([[1.3,y,.1],[1.72,y,.1],[1.72,y,.5],[1.3,y,.5]]);cx.fill();
    cx.fillStyle='#17181b';poly([[1.34,y,.14],[1.68,y,.14],[1.68,y,.46],[1.34,y,.46]]);cx.fill();
    cx.strokeStyle=COL.metal;cx.lineWidth=Math.max(2,sc*.016);cx.lineCap='round';cx.lineJoin='round';
    var a=V(1.51+off[0],y+off[1],.06+off[2]),b=V(1.51+off[0],1.14+off[1],.06+off[2]),c=V(1.51+off[0],1.14+off[1],.26+off[2]),e=V(1.51+off[0],1.04+off[1],.26+off[2]);
    cx.beginPath();cx.moveTo(a[0],a[1]);cx.lineTo(b[0],b[1]);cx.quadraticCurveTo(V(1.51+off[0],1.2+off[1],.16+off[2])[0],V(1.51+off[0],1.2+off[1],.16+off[2])[1],c[0],c[1]);cx.lineTo(e[0],e[1]);cx.stroke();return}
  if(p.k==='hob'){cx.fillStyle=COL.dark;poly([[2.46,y,.08],[2.94,y,.08],[2.94,y,.52],[2.46,y,.52]]);cx.fill();
    cx.strokeStyle='rgba(120,124,130,.9)';cx.lineWidth=1.2;[[2.58,.2,.07],[2.82,.2,.06],[2.58,.4,.06],[2.82,.4,.08]].forEach(function(q){poly(ell(q[0],y+.001,q[1],q[2],24));cx.stroke()});
    if(p.glow>0){cx.strokeStyle='rgba(255,90,40,'+(.75*p.glow).toFixed(3)+')';cx.lineWidth=2;poly(ell(2.82,y+.001,.4,.06,24));cx.stroke()}return}
  if(p.k==='oven'||p.k==='micro'){var y0=p.k==='oven'?.9:1.52,y1=p.k==='oven'?1.44:1.84,z=.625;
    cx.fillStyle=COL.glass;poly([[3.05,y0,z],[3.55,y0,z],[3.55,y1,z],[3.05,y1,z]]);cx.fill();
    cx.fillStyle='rgba(255,255,255,.06)';poly([[3.1,y0+.05,z],[3.5,y0+.05,z],[3.5,y1-.08,z],[3.1,y1-.08,z]]);cx.fill();
    cx.strokeStyle=COL.metal;cx.lineWidth=Math.max(1.5,sc*.012);line([3.1,y1-.04,z+.01],[3.5,y1-.04,z+.01]);
    if(p.k==='oven'&&p.glow>0){cx.fillStyle='rgba(255,170,90,'+(.35*p.glow).toFixed(3)+')';poly([[3.1,y0+.05,z],[3.5,y0+.05,z],[3.5,y1-.08,z],[3.1,y1-.08,z]]);cx.fill()}return}
  if(p.k==='hood'){box([2.42,2.98,1.38,1.46,0,.5],['#d4d7db','#b8bcc1','#9fa3a8'])}
}
function lightDraw(k){
  if(k<=0)return;
  /* в комнате темнеет */
  cx.setTransform(dpr,0,0,dpr,0,0);cx.fillStyle='rgba(6,5,4,'+(.36*k).toFixed(3)+')';cx.fillRect(0,0,Wc,Hc);
  cx.save();cx.globalCompositeOperation='lighter';
  var runs=[{a:[0,UP[0]-.005,DU],b:[2.4,UP[0]-.005,DU],wall:[[0,TOPY[1],0],[2.4,TOPY[1],0],[2.4,UP[0],0],[0,UP[0],0]],top:[[0,TOPY[1],0],[2.4,TOPY[1],0],[2.4,TOPY[1],.62],[0,TOPY[1],.62]]},
            {a:[DU,UP[0]-.005,.34],b:[DU,UP[0]-.005,2.14],wall:[[0,TOPY[1],.6],[0,TOPY[1],2.14],[0,UP[0],2.14],[0,UP[0],.6]],top:[[0,TOPY[1],.62],[0,TOPY[1],2.14],[.62,TOPY[1],2.14],[.62,TOPY[1],.62]]}];
  runs.forEach(function(r){
    var A=V(r.a[0],r.a[1],r.a[2]),B=V(r.b[0],r.b[1],r.b[2]),T0=V(r.wall[0][0],r.wall[0][1],r.wall[0][2]);
    /* свет на фартуке: сверху ярко, к столешнице гаснет */
    var g=cx.createLinearGradient(A[0],A[1],A[0],T0[1]);g.addColorStop(0,'rgba('+COL.led+','+(.42*k).toFixed(3)+')');g.addColorStop(1,'rgba('+COL.led+','+(.08*k).toFixed(3)+')');
    cx.fillStyle=g;poly(r.wall);cx.fill();
    cx.fillStyle='rgba('+COL.led+','+(.22*k).toFixed(3)+')';poly(r.top);cx.fill();
    /* сама лента */
    cx.strokeStyle='rgba('+COL.led+','+(.95*k).toFixed(3)+')';cx.lineWidth=Math.max(2,sc*.012);cx.shadowColor='rgba('+COL.led+',1)';cx.shadowBlur=18*k;
    cx.beginPath();cx.moveTo(A[0],A[1]);cx.lineTo(B[0],B[1]);cx.stroke();cx.shadowBlur=0});
  cx.restore();
}
function dims(a){
  if(a<=0)return;cx.globalAlpha=a;cx.strokeStyle=COL.blue;cx.fillStyle=COL.blue;cx.lineWidth=1;
  var fs=Math.round(clamp(sc*.075,11,16)),Y=2.42;cx.font='400 '+fs+'px Onest, system-ui, sans-serif';cx.textAlign='center';cx.textBaseline='middle';
  /* размеры на стенах над шкафами, как на чертеже */
  [[[0,Y,0],[LEN,Y,0],'3600 '+MM],[[0,Y,0],[0,Y,SIDE],'2400 '+MM]].forEach(function(s){
    var A=V(s[0][0],s[0][1],s[0][2]),B=V(s[1][0],s[1][1],s[1][2]);
    cx.beginPath();cx.moveTo(A[0],A[1]);cx.lineTo(B[0],B[1]);cx.stroke();
    [A,B].forEach(function(T){cx.beginPath();cx.arc(T[0],T[1],2.2,0,Math.PI*2);cx.fill()});
    var m=[(A[0]+B[0])/2,(A[1]+B[1])/2],w=cx.measureText(s[2]).width+16,ang=Math.atan2(B[1]-A[1],B[0]-A[0]);if(ang>Math.PI/2)ang-=Math.PI;if(ang<-Math.PI/2)ang+=Math.PI;
    cx.save();cx.translate(m[0],m[1]);cx.rotate(ang);cx.fillStyle='#121110';cx.fillRect(-w/2,-fs*.9,w,fs*1.8);cx.fillStyle='#cfe1d1';cx.fillText(s[2],0,0);cx.restore();cx.fillStyle=COL.blue});
  cx.globalAlpha=1;
}
function room(t){
  var a=.35+.65*out3(clamp(t/.06,0,1));cx.globalAlpha=a;
  /* стены и пол комнаты */
  var g=cx.createLinearGradient(0,V(0,2.5,0)[1],0,V(0,0,0)[1]);g.addColorStop(0,'#141311');g.addColorStop(1,COL.wall);
  cx.fillStyle=g;poly([[0,0,0],[4.1,0,0],[4.1,2.55,0],[0,2.55,0]]);cx.fill();
  cx.fillStyle=COL.wall2;poly([[0,0,0],[0,0,2.9],[0,2.55,2.9],[0,2.55,0]]);cx.fill();
  cx.fillStyle=COL.floor;poly([[0,0,0],[4.1,0,0],[4.1,0,2.9],[0,0,2.9]]);cx.fill();
  cx.strokeStyle=COL.grid;cx.lineWidth=1;
  for(var x=.3;x<4.1;x+=.3)line([x,0,0],[x,0,2.9]);
  for(var z=.3;z<2.9;z+=.3)line([0,0,z],[4.1,0,z]);
  /* чертёж: контур будущей кухни на стенах */
  var b=clamp(1-(t-.08)/.2,0,1)*.9;if(b>0){cx.globalAlpha=a*b;cx.strokeStyle=COL.blue;cx.setLineDash([5,5]);
    [[[0,0,DL],[3,0,DL]],[[3,0,DL],[3,0,0]],[[3,0,.6],[LEN,0,.6]],[[LEN,0,.6],[LEN,0,0]],[[DL,0,.6],[DL,0,SIDE]],[[DL,0,SIDE],[0,0,SIDE]],[[0,UP[0],0],[3,UP[0],0]],[[0,UP[1],0],[3,UP[1],0]],[[3,0,0],[3,H,0]],[[LEN,H,0],[3,H,0]],[[0,UP[0],.34],[0,UP[0],2.14]],[[0,UP[1],.34],[0,UP[1],2.14]]].forEach(function(s){line(s[0],s[1])});
    cx.setLineDash([])}
  cx.globalAlpha=1;
}
function draw(t){
  cx.setTransform(dpr,0,0,dpr,0,0);cx.clearRect(0,0,Wc,Hc);
  room(t);
  /* тень кухни на полу растёт со сборкой */
  var sh=clamp((t-.06)/.3,0,1);if(sh>0){cx.globalAlpha=.5*sh;cx.fillStyle='rgba(0,0,0,.6)';off=[0,0,0];poly([[0,.001,0],[LEN+.08,.001,0],[LEN+.08,.001,.7],[.7,.001,.7],[.7,.001,SIDE+.08],[0,.001,SIDE+.08]]);cx.fill();cx.globalAlpha=1}
  var lk=clamp((t-light.t0)/(light.t1-light.t0),0,1);
  for(var n=0;n<parts.length;n++){var p=parts[n];if(p.k==='light')continue;
    var k=clamp((t-p.t0)/Math.max(.0001,p.t1-p.t0),0,1);if(k<=0)continue;
    var mv=p.slab?out3(k):spring(k),f=p.fly||[0,0,0];off=[f[0]*(1-mv),f[1]*(1-mv),f[2]*(1-mv)];
    cx.globalAlpha=out3(clamp(k*2.4,0,1));
    if(p.k==='box')box(p.b,p.c);
    else if(p.k==='front')frontDraw(p);
    else{p.glow=lk;techDraw(p)}
  }
  off=[0,0,0];cx.globalAlpha=1;
  lightDraw(lk);
  dims(Math.max(clamp(1-(t-.1)/.18,0,1),clamp((t-.9)/.08,0,1)));
}

/* ── Прокрутка → шкала сборки ── */
var steps=[].slice.call(sec.querySelectorAll('.asm-steps li')),bar=sec.querySelector('.asm-bar');
var CUTS=[.32,.52,.66,.84],lastK=-1,active=false,raf=0;
function stepOf(t){for(var i=0;i<CUTS.length;i++)if(t<CUTS[i])return i;return CUTS.length}
function paint(t){
  if(Math.abs(t-last)<.0003)return;last=t;draw(t);
  if(bar)bar.style.setProperty('--p',t.toFixed(4));
  var k=stepOf(t);if(k!==lastK){lastK=k;steps.forEach(function(li,i){li.classList.toggle('on',i===k)})}
}
function progress(){var r=sec.getBoundingClientRect();return clamp(-r.top/Math.max(1,r.height-innerHeight)*1.04,0,1)}
function loop(){raf=0;if(!active)return;paint(progress());raf=requestAnimationFrame(loop)}
fit();
if(reduce){steps.forEach(function(li){li.classList.add('on')});paint(1);addEventListener('resize',function(){fit();paint(1)});if(d.fonts&&d.fonts.ready)d.fonts.ready.then(function(){last=-1;paint(1)});return}
paint(progress());
new IntersectionObserver(function(es){active=es[0].isIntersecting;if(active&&!raf)raf=requestAnimationFrame(loop)}).observe(sec);
addEventListener('resize',function(){fit();paint(progress())});
if(d.fonts&&d.fonts.ready)d.fonts.ready.then(function(){last=-1;paint(progress())});
})();
