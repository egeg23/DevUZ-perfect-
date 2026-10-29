/* Lakier na żywo: jeden shader WebGL, bez bibliotek i bez obrazków, więc
   ostry w każdej rozdzielczości. Powierzchnia drzwi z przetłoczeniem,
   lakier bazowy z drobinkami, nad nim bezbarwny klar, w którym odbijają się
   lampy warsztatu. Tryb „hero”: lampy idą za kursorem i przewijaniem.
   Tryb „scena”: tablica z pasami (taką fachowiec szuka wgnieceń),
   wgniecenie, wypychanie od środka, rysy, polerowanie do lustra.
   Rysuje tylko, gdy płótno jest na ekranie; przy „mniej ruchu” jedna klatka. */
var Lak=(function(){
var VS='attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
var FS=[
'precision highp float;',
'uniform vec2 R;uniform float T,DPR,dent,push,scr,wipe,swirl,board,box,shift;uniform vec2 P,C;',
'float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
'float H(vec2 p){',
' float h=-.16*p.y*p.y-.03*p.x*p.x;',
' float d=p.y-(.26-.09*p.x);',
' h+=-.13*max(d,0.)*max(d,0.)-.05*smoothstep(-.4,-1.,p.y)*(p.y+.4);',
' h+=.009*exp(-d*d/.006);',
' vec2 q=p-C;float r2=dot(q,q);',
' h-=dent*.007*exp(-r2/.009);',
' h+=dent*.0015*exp(-pow(sqrt(r2)-.15,2.)/.002);',
' return h;}',
'float aa;',
'vec3 env(vec3 r){',
' float hz=-.12+shift*.5;',
' vec3 c=mix(vec3(.003,.003,.004),mix(vec3(.05,.052,.058),vec3(.012,.013,.016),smoothstep(.2,1.,r.y)),smoothstep(hz-.012,hz+.012,r.y));',
' float y1=.34+P.y*.14+shift,y2=.06+P.y*.08+shift*.6;',
' float da=(r.y-y1)/.05,db=(r.y-y2)/.022;',
' float a=exp(-da*da*da*da)*(.55+.45*exp(-da*da*3.))*smoothstep(1.5,.9,abs(r.x-.15-P.x*.35));',
' float b=exp(-db*db*db*db)*smoothstep(1.3,.7,abs(r.x+.35-P.x*.2));',
' float v=smoothstep(.09,.055,abs(r.x-.78-P.x*.25))*smoothstep(.9,.45,abs(r.y-.18));',
' c+=vec3(1.,.97,.93)*(a*12.+b*7.+v*1.2)*box;',
' float L=abs(fract(r.y*16.+.5+shift*2.)-.5);',
' float lb=smoothstep(.1,.05,L)*smoothstep(1.7,1.1,abs(r.x))*aa;',
' c+=vec3(.25)*board*(1.-aa);',
' c=mix(c,vec3(.006),board*.85)+vec3(1.,.98,.95)*lb*8.*board;',
' return c;}',
'float seg(vec2 p,vec2 a,vec2 b){vec2 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h);}',
'vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}',
'vec3 nrm(vec2 p){float e=.0016;float h0=H(p),hx=H(p+vec2(e,0.)),hy=H(p+vec2(0.,e));return normalize(vec3(-(hx-h0)/e,-(hy-h0)/e,1.));}',
'void main(){',
' vec2 p=(gl_FragCoord.xy-.5*R)/R.y*2.;',
' float px=2./R.y;',
' vec3 n=nrm(p),v=normalize(vec3(p*.33,-1.)),r=reflect(v,n);',
' vec2 p2=p+vec2(0.,px);vec3 r2=reflect(normalize(vec3(p2*.33,-1.)),nrm(p2));',
' aa=smoothstep(.45,.15,abs(r2.y-r.y)*16.);',
' vec3 E=env(r);',
' float sw=0.;',
' if(swirl>0.){vec2 hc=vec2(.15+P.x*.35,.3);float rr=length(p-hc);float an=atan(p.y-hc.y,p.x-hc.x);',
'  float ring=abs(fract(rr*90.+hs(vec2(floor(an*8.),0.))*.5)-.5);sw=smoothstep(.08,0.,ring)*smoothstep(.9,.1,rr);',
'  E=mix(E,vec3(dot(E,vec3(.33))),swirl*.35);}',
' vec3 base=vec3(.42,.008,.006);',
' vec3 l=normalize(vec3(-.35,.65,.7));',
' float dif=max(dot(n,l),0.);',
' vec2 cell=floor(gl_FragCoord.xy/(DPR*1.5));',
' float fl=pow(hs(cell),90.)*(.6+.4*sin(T*1.7+hs(cell+3.)*6.28));',
' vec3 paint=base*(.03+.42*dif*dif)+base*.10*smoothstep(-.3,.6,r.y)+vec3(1.,.6,.5)*fl*.08*(.2+dif);',
' float F=.04+.96*pow(1.-max(dot(n,-v),0.),5.);',
' vec3 col=paint*(1.-F)+E*F*(1.-swirl*.25);',
' col+=vec3(1.)*sw*swirl*dot(E,vec3(.1))*.6;',
' if(scr>0.){float s=1e3;',
'  s=min(s,seg(p,vec2(-1.0,-.42),vec2(.35,-.18)));s=min(s,seg(p,vec2(-.7,-.62),vec2(.75,-.36)));',
'  s=min(s,seg(p,vec2(-.25,-.05),vec2(.95,.02)));s=min(s,seg(p,vec2(.1,-.75),vec2(.55,-.55)));',
'  s=min(s,seg(p,vec2(-1.3,-.2),vec2(-.6,-.12)));s=min(s,seg(p,vec2(.5,-.28),vec2(1.3,-.46)));',
'  float amt=scr*smoothstep(wipe-.04,wipe+.04,p.x);',
'  float core=1.-smoothstep(0.,px*1.3,s),halo=1.-smoothstep(0.,px*5.,s);',
'  col=mix(col,vec3(.75,.72,.7),core*amt*.85);col*=1.-halo*amt*.25;',
'  float edge=exp(-pow((p.x-wipe)/.018,2.))*step(.0001,scr)*step(wipe,1.9)*step(-1.9,wipe);',
'  col+=vec3(1.,.8,.7)*edge*.12;}',
' if(push>0.){float rr=length(p-C);float pl=fract(T*.9);',
'  col+=vec3(1.,.35,.25)*exp(-pow((rr-pl*.25)/.012,2.))*(1.-pl)*push*.9;}',
' col=aces(col*1.15);',
' col=pow(col,vec3(1./2.2));',
' col+=(hs(gl_FragCoord.xy+T)-.5)/255.;',
' gl_FragColor=vec4(col,1.);}'].join('\n');
function make(cv,mode){
  var gl=null;try{gl=cv.getContext('webgl',{antialias:false,alpha:false,premultipliedAlpha:false,powerPreference:'high-performance'})}catch(e){}
  if(!gl)return null;
  function sh(t,s){var o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);return o}
  var pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);
  if(!gl.getProgramParameter(pr,gl.LINK_STATUS))return null;
  gl.useProgram(pr);
  var b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  var al=gl.getAttribLocation(pr,'a');gl.enableVertexAttribArray(al);gl.vertexAttribPointer(al,2,gl.FLOAT,false,0,0);
  var U={};['R','T','DPR','dent','push','scr','wipe','swirl','board','box','shift','P','C'].forEach(function(k){U[k]=gl.getUniformLocation(pr,k)});
  var S={dent:0,push:0,scr:0,wipe:-2,swirl:0,board:0,box:1,shift:0,px:0,py:0,cx:.25,cy:-.05};
  var RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dpr=1,W=0,H=0,vis=true,raf=0,t0=performance.now(),tx=0,ty=0;
  function size(){dpr=Math.min(window.devicePixelRatio||1,2);var r=cv.getBoundingClientRect();var w=Math.max(1,Math.round(r.width*dpr)),h=Math.max(1,Math.round(r.height*dpr));
    if(w!==W||h!==H){W=w;H=h;cv.width=w;cv.height=h;gl.viewport(0,0,w,h)}}
  function draw(now){raf=0;size();
    S.px+=(tx-S.px)*.06;S.py+=(ty-S.py)*.06;
    gl.uniform2f(U.R,W,H);gl.uniform1f(U.T,RM?0:(now-t0)/1000);gl.uniform1f(U.DPR,dpr);
    ['dent','push','scr','wipe','swirl','board','box','shift'].forEach(function(k){gl.uniform1f(U[k],S[k])});
    var drift=RM?0:Math.sin((now-t0)/5200)*.25;
    gl.uniform2f(U.P,S.px+drift,S.py);gl.uniform2f(U.C,S.cx,S.cy);
    gl.drawArrays(gl.TRIANGLES,0,3);
    if(vis&&!RM)raf=requestAnimationFrame(draw)}
  function kick(){if(!raf)raf=requestAnimationFrame(draw)}
  if('IntersectionObserver'in window)new IntersectionObserver(function(es){vis=es[0].isIntersecting;if(vis)kick()}).observe(cv);
  addEventListener('resize',kick);
  kick();
  return{s:S,kick:kick,aim:function(x,y){tx=x;ty=y;kick()},mode:mode};
}
return{make:make};
})();
