(function(){
'use strict';
/* story: история клиники на главной, по движку Engelberg v2 (как у
   LIDER PROF PROEKT). Одна липкая сцена, слои во весь экран, у каждого свой
   вход, выход и камера. Сюжет идёт вглубь кожи: первый экран с клетками и
   знаком, линза дерматоскопа идёт по коже и увеличивает родинку и папиллому,
   камера уходит сквозь слои кожи, свет и пузырьки физиотерапии, четыре этапа
   лечения, специалисты по орбите вокруг знака, запись.
   Время в экранах прокрутки: t = 6.5 значит «пролистано шесть с половиной
   высот окна». Каждый кадр зависит только от t: сцену можно листать вперёд
   и назад. Прокрутка браузерная, мы её только читаем и пишем transform и
   opacity в один requestAnimationFrame, пока сцена на экране. */
var d=document,root=d.documentElement,el=d.getElementById('story');
if(!el)return;
var reduce=false;try{reduce=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
if(reduce||root.classList.contains('k-no-story')){root.classList.add('st-calm');return}
root.classList.add('st-live');

var clamp=function(v,a,b){a=a==null?0:a;b=b==null?1:b;return Math.min(b,Math.max(a,v))};
var seg=function(t,a,b){return clamp((t-a)/(b-a))};
var lerp=function(a,b,x){return a+(b-a)*x};
var inOut=function(x){return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2};
var out=function(x){return 1-Math.pow(1-x,3)};
var win=function(t,a,b,f){f=f||.5;return Math.min(seg(t,a,a+f),1-seg(t,b-f,b))};

var END=+el.dataset.end||21;
var track=el.querySelector('.st-track');
var N={};[].forEach.call(el.querySelectorAll('[data-k]'),function(n){N[n.dataset.k]=n});
var beats=[].map.call(el.querySelectorAll('[data-beat]'),function(n){var ab=n.dataset.beat.split(' ').map(Number);if((ab[0]>=2&&ab[0]<11.4)||ab[0]>=14.4)n.classList.add('lt');return {el:n,a:ab[0],b:ab[1],lines:[].slice.call(n.querySelectorAll('[data-line]'))}});
var chapters=JSON.parse(el.dataset.chapters||'[]');
var hud=el.querySelector('[data-hud]'),bar=el.querySelector('[data-bar]');
var XS=el.dataset.xs.split(' ').map(Number),MOLE=el.dataset.mole.split(' ').map(Number),PAP=el.dataset.pap.split(' ').map(Number);
var spots=[].slice.call(el.querySelectorAll('.st-xs .hs'));
var rays=[].slice.call(el.querySelectorAll('[data-ray]'));
var bubs=[].map.call(el.querySelectorAll('[data-b]'),function(n){return {el:n,s:+n.dataset.s,o:+n.dataset.o}});
var orbs=[].slice.call(el.querySelectorAll('[data-orb]'));
var layers=[].slice.call(el.querySelectorAll('.cl'));

var W=1,H=1,mobile=false,lastT=-1,chapter=-1,mx=0,my=0;
var last=new Map();
function write(n,tf,o){
  if(!n)return;var prev=last.get(n)||{};
  if(tf!=null&&prev.tf!==tf){n.style.transform=tf;prev.tf=tf}
  if(o!=null){o=clamp(o);if(prev.o===undefined||Math.abs(prev.o-o)>.001||(o===0)!==(prev.o===0)){n.style.opacity=o.toFixed(3);n.style.visibility=o<=.001?'hidden':'visible';prev.o=o}}
  last.set(n,prev);
}
function fade(k,o){write(N[k],null,o)}
function on(n,v){if(n)n.classList.toggle('on',!!v)}
var tr=function(x,y,s){return 'translate3d('+x.toFixed(1)+'px,'+y.toFixed(1)+'px,0)'+(s!=null?' scale('+s.toFixed(4)+')':'')};

/* Камера по рисунку: вписать прямоугольник [x, y, w, h] во весь экран. */
function cam(IW,IH,r){var s=Math.max(W/r[2],H/r[3]);var cx=r[0]+r[2]/2,cy=r[1]+r[3]/2,x=W/2-cx*s,y=H/2-cy*s;x=Math.min(0,Math.max(W-IW*s,x));y=Math.min(0,Math.max(H-IH*s,y));return {s:s,x:x,y:y}}
function mixR(a,b,k){return [lerp(a[0],b[0],k),lerp(a[1],b[1],k),lerp(a[2],b[2],k),lerp(a[3],b[3],k)]}
/* Разрез кожи: опорные кадры камеры [t, на компьютере, на телефоне]. */
var XK=[[6.4,[0,0,1600,900],[420,0,760,1300]],[7.6,[0,170,1600,720],[300,120,760,1300]],[9.2,[260,560,1080,640],[420,500,760,1300]],[10.4,[0,980,1600,800],[300,820,760,1300]],[11.4,[0,1320,1600,880],[300,900,760,1300]]];
function xsRect(t){var K=XK,i=0;while(i+1<K.length&&t>K[i+1][0])i++;var a=K[i],b=K[Math.min(i+1,K.length-1)],k=b===a?0:inOut(seg(t,a[0],b[0]));return mixR(a[mobile?2:1],b[mobile?2:1],k)}

/* Поверхность кожи: viewBox 1600 x 1000, обрезка по краям (slice). */
function sk(){var s=Math.max(W/1600,H/1000);return {s:s,x:(W-1600*s)/2,y:(H-1000*s)/2}}

var cnts=[].slice.call(el.querySelectorAll('[data-count]')).map(function(n){return {el:n,to:+n.dataset.count,p:n.dataset.plus||'',v:-1}});
var fmt=function(n){return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ')};
function count(k){cnts.forEach(function(c,i){var q=out(seg(k,i*.1,.7+i*.1)),v=Math.round(c.to*q);if(v!==c.v){c.v=v;c.el.textContent=fmt(v)+c.p}})}

var LD=300,K=2.6;
function render(){
  var r=track.getBoundingClientRect(),start=r.top+scrollY;
  root.classList.toggle('st-in',r.top<=0&&r.bottom>=H);
  var t=clamp((scrollY-start)/H,0,END);
  if(Math.abs(t-lastT)<.0005&&!render.force)return;lastT=t;render.force=false;
  root.classList.toggle('st-lt',(t>2.1&&t<6.6)||(t>14.3&&t<END));

  /* 0 · Первый экран: клетки уходят с разной скоростью, знак поворачивается. */
  if(t<2.4){
    layers.forEach(function(l,i){var k=(i+1)*.18;write(l,tr(mx*(i+1)*10,-t*H*k+my*(i+1)*8),null)});
    write(N.heroMark,tr(mx*-18,-t*H*.1+my*-12)+' rotate('+(t*14).toFixed(2)+'deg)',1-seg(t,1.2,2));
    var nm=Math.min(1,1-seg(t,1.3,1.8));write(N.nums,tr(0,(1-nm)*-20),nm);
    count(1);
  }
  fade('hero',1-seg(t,1.7,2.3));
  fade('hint',1-seg(t,0,.5));

  /* 1 · Кожа под дерматоскопом: линза идёт к родинке, потом к папилломе. */
  fade('skin',Math.min(seg(t,1.8,2.3),1-seg(t,6.5,7)));
  if(t>1.6&&t<7.2){
    var S=sk(),pt=function(p){return [S.x+p[0]*S.s,S.y+p[1]*S.s]};
    var M=pt(MOLE),P=pt(PAP),A=[W*(mobile?.2:.12),H*(mobile?.78:.82)];
    var go1=inOut(seg(t,2.2,3.6)),go2=inOut(seg(t,4.4,5.4));
    var lx=lerp(lerp(A[0],M[0],go1),P[0],go2),ly=lerp(lerp(A[1],M[1],go1),P[1],go2);
    var R=LD/2,zoom=1+inOut(seg(t,6,6.9))*1.6;
    write(N.skCam,'scale('+(1.06-.06*seg(t,1.8,3)+(zoom-1)*.6).toFixed(4)+')',null);
    write(N.lens,tr(lx-R,ly-R,1+(zoom-1)*.6),Math.min(seg(t,2,2.4),1-seg(t,6.3,6.8)));
    write(N.lensIn,tr(R-lx*K,R-ly*K,K),null);
    var tg=function(p){return mobile?tr(Math.max(12,Math.min(W-200,p[0]-90)),p[1]+R+12):tr(p[0]+R*.72,p[1]-16)};
    write(N.tagMole,tg(M),win(t,3.6,4.5,.3));
    write(N.tagPap,tg(P),win(t,5.3,6.2,.3));
  }

  /* 2 · Разрез кожи: камера уходит вниз по слоям, метки держатся за рисунок. */
  fade('xs',Math.min(seg(t,6.4,6.9),1-seg(t,11.3,11.8)));
  if(t>6.2&&t<12){
    var c=cam(XS[0],XS[1],xsRect(t));
    write(N.xsCam,tr(c.x,c.y,c.s),null);
    var SP={epi:[7.2,9],hair:[8.8,10.4],derm:[9.4,10.8],vessel:[10,11.2],fat:[10.6,11.4]};
    spots.forEach(function(s){var w=SP[s.dataset.k],x=c.x+(+s.dataset.x)*c.s,y=c.y+(+s.dataset.y)*c.s;if(mobile)x=Math.min(x,W*.42);write(s,tr(x,y),win(t,w[0],w[1],.3))});
  }

  /* 3 · Свет: лампа, лучи качаются, пузырьки озона поднимаются. */
  fade('light',Math.min(seg(t,11.3,11.8),1-seg(t,14.2,14.7)));
  if(t>11.1&&t<14.9){
    var lo=seg(t,11.6,12.2);
    write(N.lamp,tr(0,(1-out(lo))*-30),lo);
    rays.forEach(function(n,k){var base=(k-3)*9,sw=Math.sin(t*2.2+k*.9)*3.5;write(n,'rotate('+(base+sw).toFixed(2)+'deg) scaleY('+(.4+.6*out(seg(t,11.8+k*.06,12.6+k*.06))).toFixed(3)+')',seg(t,11.8+k*.06,12.4+k*.06)*.9)});
    bubs.forEach(function(b){var p=((t-11.4)*b.s*.42+b.o)%1;write(b.el,tr(Math.sin((t+b.o*6)*1.6)*12,-p*(H+120)),seg(t,11.8,12.3)*Math.min(1,p*6)*(1-seg(p,.8,1))*.9)});
    var ph=win(t,12,14.2,.4);write(N.phys,tr(0,(1-ph)*24),ph);
    for(var i=0;i<7;i++)on(N['ph'+i],t>=12.3+i*.26);
  }

  /* 4 · Четыре этапа: линия прочерчивается, этапы встают по очереди. */
  fade('stages',Math.min(seg(t,14.2,14.7),1-seg(t,17.2,17.7)));
  if(t>14&&t<17.9){
    var lp=inOut(seg(t,14.6,16.4));
    write(N.sgLine,mobile?'scaleY('+lp.toFixed(4)+')':'scaleX('+lp.toFixed(4)+')',null);
    for(var j=0;j<4;j++){var q=seg(t,14.7+j*.42,15.2+j*.42);write(N['sg'+j],tr(0,(1-out(q))*28),q)}
  }

  /* 5 · Специалисты по орбите вокруг знака. */
  fade('team',Math.min(seg(t,17.2,17.7),1-seg(t,20.1,20.6)));
  if(t>17&&t<20.8){
    var o1=mobile?Math.min(W*.3,140):Math.min(H*.2,170),o2=o1*1.62;
    N.orbit.style.setProperty('--o1',o1.toFixed(0)+'px');N.orbit.style.setProperty('--o2',o2.toFixed(0)+'px');
    var rot=(t-17)*.55;
    orbs.forEach(function(n,k){var inner=k<4,rr=inner?o1:o2,cnt=inner?4:5,idx=inner?k:k-4,a=idx/cnt*Math.PI*2+(inner?rot:-rot*.7)-Math.PI/2;
      var ap=seg(t,17.5+k*.12,17.9+k*.12);write(n,tr(Math.cos(a)*rr*(.6+.4*out(ap)),Math.sin(a)*rr*(.6+.4*out(ap))),ap)});
    var tc=N.team20;if(tc){var v=Math.round(20*out(seg(t,17.6,18.6)));if(tc.dataset.v!=v){tc.dataset.v=v;tc.textContent=v+'+'}}
  }

  /* 6 · Финал */
  write(N.end,null,seg(t,20.1,20.6));

  /* Подписи: выплывают снизу, строки догоняют друг друга, уходят вверх. */
  beats.forEach(function(b){
    var inn=b.a<0?1:seg(t,b.a,b.a+.6),op=seg(t,b.b-.5,b.b),o=Math.min(inn,1-op);
    write(b.el,'translate3d(0,'+((1-out(inn))*28-out(op)*28).toFixed(1)+'px,0)',o);
    b.el.classList.toggle('live',o>.5);
    if(o<=0)return;
    b.lines.forEach(function(l,i){var li=b.a<0?1:seg(t,b.a+.1*i,b.a+.1*i+.7);write(l,'translate3d(0,'+((1-out(li))*22).toFixed(1)+'px,0)',out(li))});
  });

  var ci=0;while(ci+1<chapters.length&&t>=chapters[ci+1][0])ci++;
  if(ci!==chapter&&hud){chapter=ci;hud.textContent=('0'+ci).slice(-2)+' · '+chapters[ci][1]}
  if(bar)bar.style.transform='scaleX('+(t/END).toFixed(4)+')';
}

function measure(){
  var w=innerWidth,h=innerHeight;
  if(w===W&&Math.abs(h-H)<140)return;
  W=w;H=h;mobile=W<820||W<H;
  track.style.height=Math.round((END+1)*H)+'px';
  LD=Math.round(Math.min(Math.max(Math.min(W,H)*(mobile?.5:.36),180),360));
  el.style.setProperty('--ld',LD+'px');
  var li=N.lensIn&&N.lensIn.querySelector('svg');if(li){li.style.width=W+'px';li.style.height=H+'px'}
  last.clear();lastT=-1;
}
measure();render();

/* Мышь сдвигает клетки первого экрана: глубина без перехвата прокрутки. */
var fine=false;try{fine=matchMedia('(hover:hover) and (pointer:fine)').matches}catch(e){}
if(fine)addEventListener('pointermove',function(e){mx=e.clientX/W-.5;my=e.clientY/H-.5;if(lastT<2.4)render.force=true},{passive:true});

var act=false,raf=0;
function loop(){raf=0;if(!act)return;render();raf=requestAnimationFrame(loop)}
new IntersectionObserver(function(es){act=es[0].isIntersecting;if(!act)root.classList.remove('st-in','st-lt');if(act&&!raf)raf=requestAnimationFrame(loop)}).observe(el);
addEventListener('resize',function(){measure();lastT=-1;render()});
})();
