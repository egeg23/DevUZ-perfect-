/* Золотые кнопки (владелец, 28.10.2026): «реально с анимацией и физикой…
   сочно, просто вау». Внутри каждой кнопки — поверхность жидкого золота,
   которая считается по-настоящему: вязкая жидкость на сетке (ячейка 3
   точки), тягучая, как мёд: вмятина медленно расплывается и оседает. Курсор тянет за собой след, как
   палец в мёде; нажатие — всплеск; на телефоне волна от пальца, а без
   касания по золоту изредка падают капли. Свет рисует WebGL: нормали из
   высоты, блик идёт за курсором, текстура расплавленного золота
   (gold.webp, Nano Banana) преломляется на волнах, блёстки — чешуйки со
   своим наклоном, вспыхивают, когда волна их поворачивает к свету. Поверх
   — блёстки, которые гребень поднимает, а потом они оседают. Один
   контекст WebGL на все кнопки, рисуются только видимые. Нет WebGL — те же
   волны и блёстки на холсте 2D. Без движения — просто золото. */
(function(){
'use strict';
var d=document,root=d.documentElement;
if(root.classList.contains('calm'))return;
try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return}catch(e){}
var TEX='/protos/syanie/gold.webp',CELL=3,DPR=Math.min(window.devicePixelRatio||1,2),hover=false;
try{hover=matchMedia('(hover: hover)').matches}catch(e){}
function R(a,b){return a+Math.random()*(b-a)}
function clamp(x,a,b){return x<a?a:x>b?b:x}

/* ── WebGL: один контекст, кадр каждой кнопки копируется в её холст ── */
var gc=d.createElement('canvas'),gl=null,prog,loc={},hTex,gTex,gReady=false,gw=0,gh=0;
try{gl=gc.getContext('webgl',{alpha:false,antialias:false,premultipliedAlpha:false,preserveDrawingBuffer:false})}catch(e){}
var VS='attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
var FS=['precision mediump float;varying vec2 v;uniform sampler2D H,G;uniform vec2 tx,res,L,off;uniform float t,ready;',
'float h(vec2 q){return texture2D(H,q).r*2.-1.;}',
'float hs(vec2 q){return fract(sin(dot(q,vec2(127.1,311.7)))*43758.5453);}',
'void main(){vec2 uv=vec2(v.x,1.-v.y);float a=res.x/res.y;',
' float hx=h(uv+vec2(tx.x,0.))-h(uv-vec2(tx.x,0.)),hy=h(uv+vec2(0.,tx.y))-h(uv-vec2(0.,tx.y));',
/* Капсула: края кнопки загибаются, как у налитого золота. */
' float cy=(uv.y-.5)*2.;vec3 n=normalize(vec3(-hx*2.2,-hy*2.2+cy*.5,1.));',
' vec2 tu=vec2(uv.x*.78,uv.y*1.56/a)+off+n.xy*.06+vec2(sin(t*.05),cos(t*.037))*.03;',
' vec3 b=texture2D(G,tu).rgb;b=mix(b,b*vec3(1.,.95,.8),.35);b=pow(b,vec3(1.15))*.9;',
' b=mix(vec3(.80,.55,.16),b,ready);',
' vec3 V=vec3(0.,0.,1.),Ld=normalize(vec3((L-uv)*vec2(a,1.)*.9,.75)),Hh=normalize(Ld+V);',
' float df=max(dot(n,Ld),0.),sp=pow(max(dot(n,Hh),0.),28.),sk=smoothstep(.15,.95,n.y*.5+.5-cy*.18);',
' vec3 c=b*(.62+.42*df)+vec3(1.,.92,.72)*sp*.42+vec3(1.,.88,.6)*sk*.08;c=c/(1.+c*.35);c*=1.14;',
/* Блёстки: в каждой ячейке своя чешуйка со своим наклоном. */
' vec2 px=uv*res/2.6+n.xy*6.;vec2 ci=floor(px);float k=hs(ci);',
' vec3 fn=normalize(n+vec3(hs(ci+3.1)-.5,hs(ci+7.7)-.5,0.)*1.3);',
' float fl=pow(max(dot(fn,Hh),0.),260.)*step(.62,k)*(.6+.4*sin(t*2.+k*40.));',
' float dd=length(fract(px)-.5);fl*=smoothstep(.5,.0,dd);',
' c+=vec3(1.,.96,.84)*fl*1.5;',
' c*=.86+.22*(1.-cy*cy);',
' gl_FragColor=vec4(c,1.);}'].join('\n');
function sh(type,src){var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s}
if(gl){try{
  prog=gl.createProgram();gl.attachShader(prog,sh(gl.VERTEX_SHADER,VS));gl.attachShader(prog,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(prog);
  if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw new Error('link');gl.useProgram(prog);
  var bf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,bf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  var pl=gl.getAttribLocation(prog,'p');gl.enableVertexAttribArray(pl);gl.vertexAttribPointer(pl,2,gl.FLOAT,false,0,0);
  ['H','G','tx','res','L','off','t','ready'].forEach(function(n){loc[n]=gl.getUniformLocation(prog,n)});
  gl.uniform1i(loc.H,0);gl.uniform1i(loc.G,1);
  hTex=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,hTex);
  [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T].forEach(function(w){gl.texParameteri(gl.TEXTURE_2D,w,gl.CLAMP_TO_EDGE)});
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gTex=gl.createTexture();gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,gTex);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([204,150,50,255]));
  var im=new Image();im.onload=function(){gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,gTex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,im);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.MIRRORED_REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.MIRRORED_REPEAT);
    gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gReady=true};im.src=TEX;
  gc.addEventListener('webglcontextlost',function(e){e.preventDefault();gl=null});
}catch(e){gl=null}}

/* ── Физика поверхности: волновое уравнение на сетке ─────────────────── */
var B=[],raf=0;
function setup(el){
  if(el.__gold)return;var cv=d.createElement('canvas');cv.className='gl';cv.setAttribute('aria-hidden','true');el.insertBefore(cv,el.firstChild);
  var b={el:el,cv:cv,x:cv.getContext('2d'),w:0,h:0,vis:false,drop:R(600,2200),L:[.3,.1],Lt:[.3,.1],off:[R(.06,.16),R(.1,.6)],p:[],lx:-1,ly:-1,lt:0};
  el.__gold=b;el.classList.add('gold-live');size(b);B.push(b);
  function pos(e){var r=el.getBoundingClientRect();return[(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height]}
  el.addEventListener('pointermove',function(e){var q=pos(e);b.Lt=[q[0],q[1]-.35];if(e.pointerType==='mouse'||e.buttons)drag(b,q[0],q[1]);go()});
  el.addEventListener('pointerenter',function(e){var q=pos(e);b.lx=q[0];b.ly=q[1];splash(b,q[0],q[1],.35,2.2);go()});
  el.addEventListener('pointerleave',function(){b.lx=-1;b.Lt=[.3,.1]});
  el.addEventListener('pointerdown',function(e){var q=pos(e);b.lx=q[0];b.ly=q[1];b.Lt=[q[0],q[1]-.35];splash(b,q[0],q[1],1.1,2.6);burst(b,q[0],q[1]);go()});
  if(window.IntersectionObserver)new IntersectionObserver(function(es){b.vis=es[0].isIntersecting;if(b.vis){size(b);go()}}).observe(el);else b.vis=true;
}
/* Капсула под надписью — по ширине самой надписи (иконка и текст), чтобы
   вокруг оставалось золото. Меряем заново, когда текст кнопки меняется. */
function fit(b){var el=b.el,r=el.getBoundingClientRect(),L=1e9,Rr=-1e9,k,n,q;if(!r.width)return;
  for(k=0;k<el.childNodes.length;k++){n=el.childNodes[k];if(n===b.cv)continue;
    if(n.nodeType===1)q=n.getBoundingClientRect();else if(n.nodeType===3&&n.textContent.trim()){var rg=d.createRange();rg.selectNodeContents(n);q=rg.getBoundingClientRect()}else continue;
    if(!q.width)continue;L=Math.min(L,q.left);Rr=Math.max(Rr,q.right)}
  if(Rr<L)return;var pad=r.height>46?18:12,l=Math.max(5,L-r.left-pad),rr=Math.max(5,r.right-Rr-pad);
  el.style.setProperty('--gl-l',l.toFixed(1)+'px');el.style.setProperty('--gl-r',rr.toFixed(1)+'px')}
function size(b){fit(b);var r=b.el.getBoundingClientRect(),w=Math.max(1,Math.round(r.width)),h=Math.max(1,Math.round(r.height));if(w===b.w&&h===b.h)return;
  b.w=w;b.h=h;b.cv.width=Math.round(w*DPR);b.cv.height=Math.round(h*DPR);
  b.gw=clamp(Math.round(w/CELL),16,200);b.gh=clamp(Math.round(h/CELL),8,48);var n=b.gw*b.gh;b.c=new Float32Array(n);b.o=new Float32Array(n);b.px=new Uint8Array(n*4);
  var k=Math.round(clamp(w*h/260,14,64));b.p=[];for(var i=0;i<k;i++){var y=R(.25,.9);b.p.push({x:R(0,1),y:y,y0:y,vx:0,vy:0,r:R(.5,1.3),ph:R(0,6.3),g:0})}}
/* Капля: гауссова ямка в поверхности, дальше её разносит уравнение. */
function splash(b,u,v,amt,rad){if(!b.c)return;var gx=u*b.gw,gy=v*b.gh,rr=rad*Math.max(1.6,b.gh/7),r2=rr*rr,x0=Math.max(1,Math.floor(gx-rr*2)),x1=Math.min(b.gw-2,Math.ceil(gx+rr*2)),y0=Math.max(1,Math.floor(gy-rr*2)),y1=Math.min(b.gh-2,Math.ceil(gy+rr*2));
  for(var y=y0;y<=y1;y++)for(var x=x0;x<=x1;x++){var dx=x-gx,dy=y-gy,e=Math.exp(-(dx*dx+dy*dy)/r2);b.c[y*b.gw+x]-=amt*e}}
/* След курсора: чем быстрее ведёшь, тем глубже, как палец в мёде. */
function drag(b,u,v){var t=performance.now();if(b.lx<0){b.lx=u;b.ly=v;b.lt=t;return}
  var dx=(u-b.lx)*b.w,dy=(v-b.ly)*b.h,dist=Math.sqrt(dx*dx+dy*dy),dt=Math.max(8,t-b.lt),sp=clamp(dist/dt,0,2.5),n=Math.max(1,Math.ceil(dist/(CELL*2)));
  for(var i=1;i<=n;i++){var k=i/n;splash(b,b.lx+(u-b.lx)*k,b.ly+(v-b.ly)*k,.07+.11*sp,1.9)}
  b.lx=u;b.ly=v;b.lt=t}
function burst(b,u,v){for(var i=0;i<b.p.length;i++){var p=b.p[i],dx=p.x-u,dy=(p.y-v)*b.h/b.w,dd=Math.sqrt(dx*dx+dy*dy)+.02;if(dd<.35){var f=(.35-dd)*.02/dd;p.vx+=dx*f;p.vy-=.012+Math.random()*.01;p.g=1}}}
/* Вязкая жидкость, как мёд (владелец, 28.10.2026: «на кнопках эффект
   воды, надо что-то более тягучее»): у каждой ячейки высота c и скорость
   o; скорость тянется к соседям и сильно гаснет от трения, поэтому вмятина
   медленно расплывается и оседает почти без ряби. */
function sim(b){var W=b.gw,H=b.gh,c=b.c,o=b.o,i,x,y;
  for(y=1;y<H-1;y++)for(x=1;x<W-1;x++){i=y*W+x;o[i]=o[i]*.9+(c[i-1]+c[i+1]+c[i-W]+c[i+W]-4*c[i])*.085}
  for(i=0;i<c.length;i++){c[i]=(c[i]+o[i]*.5)*.9985}}
function hAt(b,u,v){var x=clamp(Math.round(u*b.gw),1,b.gw-2),y=clamp(Math.round(v*b.gh),1,b.gh-2);return b.c[y*b.gw+x]}
function vAt(b,u,v){var x=clamp(Math.round(u*b.gw),1,b.gw-2),y=clamp(Math.round(v*b.gh),1,b.gh-2);return -b.o[y*b.gw+x]*4}
/* Блёстки над золотом: гребень подбрасывает их, потом они оседают. */
function flakes(b,dt){var x=b.x,w=b.w,h=b.h;x.globalCompositeOperation='lighter';
  for(var i=0;i<b.p.length;i++){var p=b.p[i],rise=vAt(b,p.x,p.y),gx=hAt(b,p.x+.02,p.y)-hAt(b,p.x-.02,p.y);
    if(rise>.02){p.vy-=rise*.0009*dt;p.g=Math.min(1,p.g+rise*.6)}
    p.vx+=-gx*.00012*dt;p.vy+=(p.y0-p.y)*.00009*dt;p.vx*=.95;p.vy*=.95;p.x+=p.vx*dt*.06;p.y+=p.vy*dt*.06;p.g*=.982;p.ph+=dt*.005;
    if(p.x<0)p.x+=1;if(p.x>1)p.x-=1;
    var tw=.25+.75*Math.pow(Math.max(0,Math.sin(p.ph)),4),al=clamp(tw*(.25+p.g*1.2),0,1),r=p.r*(1+p.g);if(al<.04)continue;
    var px=p.x*w,py=p.y*h;x.globalAlpha=al*.75;x.fillStyle='#fff3cc';x.beginPath();x.arc(px,py,r,0,6.283);x.fill();
    if(p.g>.25||tw>.9){x.globalAlpha=al*.8;x.fillRect(px-r*3.5,py-.35,r*7,.7);x.fillRect(px-.35,py-r*3.5,.7,r*7)}}
  x.globalAlpha=1;x.globalCompositeOperation='source-over'}
function upload(b){var c=b.c,px=b.px;for(var i=0,n=c.length;i<n;i++){var v=clamp(c[i]*.5+.5,0,1)*255;px[i*4]=v;px[i*4+3]=255}
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,hTex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,b.gw,b.gh,0,gl.RGBA,gl.UNSIGNED_BYTE,px)}
function drawGL(b,t){var W=b.cv.width,H=b.cv.height;if(gw<W||gh<H){gw=Math.max(gw,W);gh=Math.max(gh,H);gc.width=gw;gc.height=gh}
  upload(b);gl.viewport(0,0,W,H);gl.uniform2f(loc.tx,1/b.gw,1/b.gh);gl.uniform2f(loc.res,b.w,b.h);gl.uniform2f(loc.L,b.L[0],b.L[1]);
  gl.uniform2f(loc.off,b.off[0],b.off[1]);gl.uniform1f(loc.t,t/1000);gl.uniform1f(loc.ready,gReady?1:0);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  b.x.setTransform(1,0,0,1,0,0);b.x.drawImage(gc,0,gh-H,W,H,0,0,W,H)}
/* Без WebGL: те же волны светлыми кольцами по золоту из CSS. */
function draw2D(b){var x=b.x,W=b.gw,H=b.gh,c=b.c,sx=b.w/W,sy=b.h/H;x.setTransform(DPR,0,0,DPR,0,0);x.clearRect(0,0,b.w,b.h);
  for(var y=1;y<H-1;y++)for(var xx=1;xx<W-1;xx++){var s=c[y*W+xx+1]-c[y*W+xx-1]+c[(y+1)*W+xx]-c[(y-1)*W+xx];if(s>.04){x.fillStyle='rgba(255,246,214,'+Math.min(.5,s*.9)+')';x.fillRect(xx*sx,y*sy,sx,sy)}else if(s<-.04){x.fillStyle='rgba(120,70,0,'+Math.min(.35,-s*.6)+')';x.fillRect(xx*sx,y*sy,sx,sy)}}}
var lt=0,acc=0;
function loop(t){raf=0;if(d.hidden){lt=0;return}var dt=Math.min(50,lt?t-lt:16);lt=t;acc+=dt;var steps=0;while(acc>=12&&steps<5){acc-=12;steps++}var any=false;
  for(var i=0;i<B.length;i++){var b=B[i];if(!b.vis||!b.el.isConnected||!b.c)continue;any=true;
    if((b.drop-=dt)<0){b.drop=hover?R(2600,5200):R(1800,3600);splash(b,R(.08,.92),R(.25,.8),hover?.3:.5,R(1.8,2.6))}
    for(var s=0;s<steps;s++)sim(b);
    b.L[0]+=(b.Lt[0]-b.L[0])*.08;b.L[1]+=(b.Lt[1]-b.L[1])*.08;
    if(gl){drawGL(b,t);b.x.setTransform(DPR,0,0,DPR,0,0)}else draw2D(b);
    flakes(b,dt)}
  if(any)raf=requestAnimationFrame(loop);else lt=0}
function go(){if(!raf)raf=requestAnimationFrame(loop)}
function scan(){Array.prototype.forEach.call(d.querySelectorAll('.btn-onyx'),setup);B.forEach(fit);go()}
d.addEventListener('visibilitychange',function(){if(!d.hidden)go()});
addEventListener('resize',function(){B.forEach(size)});
if(window.MutationObserver)new MutationObserver(scan).observe(d.body,{childList:true,subtree:true,characterData:true});
if(d.fonts&&d.fonts.ready)d.fonts.ready.then(function(){B.forEach(fit)});
if(gl)root.classList.add('gold-gl');
scan();
})();
