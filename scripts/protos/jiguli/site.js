(function(){
'use strict';
/* «Жигули Рестобар»: кино по прокрутке на canvas, пузырьки в струе, меню
   «замороженным мгновением» (прокрутка — это время), бронь в два нажатия,
   всё меню, 18+, шапка по правилу трёх секунд, конструктор цены. Прокрутка
   родная: GSAP ScrollTrigger только читает её положение и сглаживает
   (scrub), sticky держит сцену. Модель макет не вызывает. */
var d=document,root=d.documentElement;
function $(s,c){return(c||d).querySelector(s)}
function $$(s,c){return Array.prototype.slice.call((c||d).querySelectorAll(s))}
var K=JSON.parse($('#jg-site').textContent);
var CALM=root.classList.contains('calm');
var top=$('#top'),dock=$('#dock');
function clamp(x,a,b){return Math.min(Math.max(x,a==null?0:a),b==null?1:b)}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function pad(n){return(n<10?'0':'')+n}

/* Шапка (правило владельца, 15.10.2026): при любой прокрутке прячется и
   возвращается только через 3 секунды после полной остановки. Инерция
   прокрутки на телефоне тоже шлёт scroll, так что таймер ждёт её конца.
   Пока фокус с клавиатуры внутри шапки, она не прячется. */
var IDLE=3000,idleT=0;
function headIdle(){if(!top)return;clearTimeout(idleT);
  if(!top.contains(d.activeElement))top.classList.add('hide');
  idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}

/* ── Кино: кадры на canvas ────────────────────────────────────────── */
var story=$('#story'),stage=$('#stage'),fr=$('#fr'),cv=$('#cv'),hero=$('#hero'),barEl=$('#bar'),bub=$('#bub');
var ctx=cv&&cv.getContext('2d'),N=K.frames.s,CUT=K.frames.cut,imgs=new Array(N),ready=new Array(N),queue=[],active=0;
var st={f:0},shownF=-1,pumping=false,dark=0,lastP=-1;
var chs=K.chapters.map(function(c){return{el:d.getElementById(c.id),a:c.a,b:c.b}});
function src(i){return K.img+'/s/'+(i<10?'00':i<100?'0':'')+i+'.webp'}
/* Кадр считается готовым после decode(): тогда первый показ не ждёт
   распаковки картинки, и медленная прокрутка не спотыкается. */
function load(i){if(imgs[i])return;var im=new Image();im.decoding='async';imgs[i]=im;active++;
  im.onload=function(){var ok=function(){ready[i]=1;active--;if(Math.abs(i-st.f)<3)paint(true);pump()};if(im.decode)im.decode().then(ok,ok);else ok()};
  im.onerror=function(){active--;pump()};im.src=src(i)}
/* Догружаем по очереди, ближние к текущему кадру первыми; шесть сразу. */
function pump(){if(!pumping)return;
  if(queue.length>1){var c=Math.round(st.f);queue.sort(function(a,b){return Math.abs(a-c)-Math.abs(b-c)})}
  while(active<6&&queue.length){var i=queue.shift();if(!imgs[i])load(i)}}
function startPump(){if(pumping)return;pumping=true;pump()}
function size(){if(!cv)return;var dp=Math.min(devicePixelRatio||1,2);cv.width=Math.round(fr.clientWidth*dp);cv.height=Math.round(fr.clientHeight*dp);
  if(bub){bub.width=Math.round(fr.clientWidth*Math.min(dp,1.5));bub.height=Math.round(fr.clientHeight*Math.min(dp,1.5))}shownF=-1;paint(true)}
function near(i){for(var k=0;k<N;k++){if(ready[i-k])return i-k;if(ready[i+k])return i+k}return -1}
function cover(im,a){var iw=im.naturalWidth,ih=im.naturalHeight,s=Math.max(cv.width/iw,cv.height/ih),w=iw*s,h=ih*s;ctx.globalAlpha=a;ctx.drawImage(im,(cv.width-w)/2,(cv.height-h)/2,w,h)}
function paint(force){
  if(!ctx)return;var f=clamp(st.f,0,N-1);if(!force&&Math.abs(f-shownF)<.01)return;
  var i=Math.floor(f),t=f-i,b=near(i);if(b<0)return;shownF=f;
  cover(imgs[b],1);
  /* Между соседними кадрами — мягкая смесь: прокрутка не идёт ступеньками. */
  if(b===i&&t>.04&&ready[i+1])cover(imgs[i+1],t);
  ctx.globalAlpha=1;
}
function render(){
  var p=st.f/(N-1);paint(false);
  if(barEl)barEl.style.transform='scaleX('+p.toFixed(4)+')';
  /* Темнота: с конца рисованной части до первого кадра струи. */
  dark=clamp((st.f-CUT[0]+4)/(CUT[1]-CUT[0]-6));
  stage.style.setProperty('--dark',dark.toFixed(3));stage.classList.toggle('dark',dark>.5);
  stage.style.setProperty('--cue',clamp(1-p*25).toFixed(3));
  var ho=clamp(1-p/.07);hero.style.opacity=ho.toFixed(3);hero.style.setProperty('--hy',(-p*700).toFixed(1)+'px');hero.style.visibility=ho>0?'visible':'hidden';stage.style.setProperty('--ho',clamp(1-p/.04).toFixed(3));
  for(var j=0;j<chs.length;j++){var c=chs[j],e=c.el;if(!e)continue;
    var o=Math.min(clamp((p-c.a)/.035),clamp((c.b-p)/.035));
    if(o<=0){if(e.style.visibility!=='hidden'){e.style.visibility='hidden';e.style.opacity=0}continue}
    e.style.visibility='visible';e.style.opacity=o.toFixed(3);e.style.setProperty('--y',((1-o)*24).toFixed(1)+'px')}
  if(dark>.02)bubStart();
  lastP=p;
}

/* Пузырьки в струе: рисуются кодом поверх кадров, пока экран тёмный.
   Скорость берут от прокрутки: листаете быстрее — пиво бежит быстрее. */
var bx=bub&&bub.getContext('2d'),B=[],bRaf=0,bOn=false,bT=0,vel=0;
function bubFill(){B=[];for(var i=0;i<46;i++)B.push({x:(Math.random()-.5)*.09,y:Math.random(),r:.6+Math.random()*2.2,s:.25+Math.random()*.8,w:Math.random()*6.28})}
function bubStart(){if(bOn||!bx)return;bOn=true;if(!B.length)bubFill();bT=performance.now();bRaf=requestAnimationFrame(bubFrame)}
function bubFrame(now){var dt=Math.min(.05,(now-bT)/1000);bT=now;
  if(dark<.02){bOn=false;bx.clearRect(0,0,bub.width,bub.height);return}
  var W=bub.width,H=bub.height,k=W/390;bx.clearRect(0,0,W,H);
  var sp=.08+Math.min(1.6,Math.abs(vel)*.004);vel*=.9;
  for(var i=0;i<B.length;i++){var q=B[i];q.y-=dt*sp*q.s;q.w+=dt*3;if(q.y<-.02){q.y=1.02;q.x=(Math.random()-.5)*.09}
    var x=W*(.5+q.x)+Math.sin(q.w)*2*k,y=H*q.y,r=q.r*k;
    bx.globalAlpha=.55;bx.strokeStyle='rgba(255,226,170,.9)';bx.lineWidth=Math.max(.6,r*.35);bx.beginPath();bx.arc(x,y,r,0,6.283);bx.stroke();
    bx.globalAlpha=.8;bx.fillStyle='rgba(255,250,235,.95)';bx.beginPath();bx.arc(x-r*.35,y-r*.35,r*.28,0,6.283);bx.fill()}
  bx.globalAlpha=1;bRaf=requestAnimationFrame(bubFrame)}

function initStory(){
  if(!story||CALM||!ctx)return;
  load(0);for(var i=1;i<N;i++)queue.push(i);
  size();
  /* Первые кадры — сразу, остальные — пока смотрят заставку. */
  for(var j=1;j<8;j++)load(j);
  setTimeout(startPump,900);
  /* Фильм, а не перемотка (владелец, 20.10.2026: «ограничение по скорости
     скрола… как фильм, который ты смотришь скроллом»). Прокрутка страницы
     родная и ничем не тормозится; ScrollTrigger только читает, где сейчас
     палец, — это цель. Кадр сам идёт к цели на каждом кадре экрана: мягко
     разгоняется и тормозит, но не быстрее MAXF кадров в секунду (владелец,
     20.10.2026: «чуть быстрее… иначе выглядит с фризами» — 60, как видео). Листнули
     резко — фильм догоняет со своей скоростью; остановились — доезжает и
     замирает. Ушли за конец сцены — догоняет быстро, чтобы не отставать. */
  var MAXF=60,target=0,raf=0,last=0;
  var tick=function(now){var dt=Math.min(.05,(now-(last||now))/1000);last=now;
    var d=target-st.f,ad=Math.abs(d);
    if(ad<.002){st.f=target;render();raf=0;last=0;return}
    var out=story.getBoundingClientRect().bottom<innerHeight*.98,cap=(out?MAXF*4:MAXF)*dt,k=1-Math.exp(-dt*11);
    var step=d*k;if(Math.abs(step)<Math.min(ad,dt*8))step=Math.sign(d)*Math.min(ad,dt*8);
    if(Math.abs(step)>cap)step=Math.sign(d)*cap;
    st.f+=step;render();raf=requestAnimationFrame(tick)};
  var aim=function(p){target=clamp(p)*(N-1);if(!raf)raf=requestAnimationFrame(tick)};
  if(window.gsap&&window.ScrollTrigger){
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.create({trigger:story,start:'top top',end:'bottom bottom',invalidateOnRefresh:true,onUpdate:function(t){aim(t.progress)}});
  }else{
    addEventListener('scroll',function(){var r=story.getBoundingClientRect();aim(-r.top/Math.max(1,r.height-innerHeight))},{passive:true});
  }
  addEventListener('resize',function(){size();render()});
  render();
}

/* ── Меню: замороженные мгновения ─────────────────────────────────── */
/* Кадр снят на 1/8000 секунды. Время в сцене идёт только от прокрутки:
   листаете — капли летят, пар поднимается; остановились — всё замерло
   (остаётся едва заметный дрейф). Блик идёт за пальцем или курсором. */
var FZ=$$('.fz').map(function(el){var c=$('.fz-fx',el);return{el:el,fr:$('.fz-fr',el),t:$('.fz-t',el),cv:c,x:c&&c.getContext('2d'),kind:el.getAttribute('data-fx'),P:[],T:0,on:false,mx:0,my:0,tx:0,ty:0,gl:0,tgl:0}});
var steamSpr=null;
function steamSprite(){if(steamSpr)return steamSpr;var c=d.createElement('canvas');c.width=c.height=128;var x=c.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);
  g.addColorStop(0,'rgba(255,248,236,.5)');g.addColorStop(.45,'rgba(255,244,228,.18)');g.addColorStop(1,'rgba(255,240,220,0)');x.fillStyle=g;x.fillRect(0,0,128,128);return steamSpr=c}
function fillFx(z){var P=[],i,n;
  if(z.kind==='steam'){for(i=0;i<16;i++)P.push({x:.32+Math.random()*.36,y0:.62+Math.random()*.1,s:.25+Math.random()*.35,r:.16+Math.random()*.18,ph:Math.random(),sw:Math.random()*6.28})}
  else{n=z.kind==='ice'?34:44;for(i=0;i<n;i++){var a=Math.random()*6.283,sp=.01+Math.random()*.035;P.push({x:.5+(Math.random()-.5)*.5,y:.3+Math.random()*.32,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp*.6+.004,r:.6+Math.random()*2.4,ph:Math.random()*6.28,g:z.kind==='ice'&&i<10})}}
  z.P=P}
function sizeFx(z){var dp=Math.min(devicePixelRatio||1,1.5);z.cv.width=Math.round(z.cv.clientWidth*dp);z.cv.height=Math.round(z.cv.clientHeight*dp)}
function drawFx(z){var x=z.x,W=z.cv.width,H=z.cv.height,k=W/390,T=z.T,i,q;x.clearRect(0,0,W,H);
  if(z.kind==='steam'){var sp=steamSprite();x.globalCompositeOperation='screen';
    for(i=0;i<z.P.length;i++){q=z.P[i];var life=(q.ph+T*q.s*.12)%1,y=H*(q.y0-life*.5),xx=W*q.x+Math.sin(q.sw+life*5)*24*k,r=W*q.r*(.6+life*1.3);
      x.globalAlpha=Math.sin(life*Math.PI)*.55;x.drawImage(sp,xx-r,y-r,r*2,r*2)}
    x.globalCompositeOperation='source-over';x.globalAlpha=1;return}
  for(i=0;i<z.P.length;i++){q=z.P[i];var px=(q.x+q.vx*T)%1.2,py=(q.y+q.vy*T)%1.1;if(px<-.1)px+=1.2;
    var X=W*px,Y=H*py,r=q.r*k;
    if(q.g){var tw=.5+.5*Math.sin(q.ph+T*2.2),s=r*3*tw;x.globalAlpha=.85*tw;x.strokeStyle='#fffaf0';x.lineWidth=Math.max(.8,k*.9);
      x.beginPath();x.moveTo(X-s,Y);x.lineTo(X+s,Y);x.moveTo(X,Y-s);x.lineTo(X,Y+s);x.stroke();continue}
    x.globalAlpha=.75;x.fillStyle=z.kind==='ice'?'rgba(255,190,150,.85)':'rgba(240,170,60,.9)';x.beginPath();x.ellipse(X,Y,r,r*1.15,0,0,6.283);x.fill();
    x.globalAlpha=.9;x.fillStyle='#fff8e8';x.beginPath();x.arc(X-r*.3,Y-r*.35,r*.32,0,6.283);x.fill()}
  x.globalAlpha=1}
var fzRaf=0,fzT=0,fzOn=0;
function fzFrame(now){var dt=Math.min(.05,(now-(fzT||now))/1000);fzT=now;var any=false;
  for(var i=0;i<FZ.length;i++){var z=FZ[i];if(!z.on)continue;any=true;
    z.T+=dt*.06;z.mx+=(z.tx-z.mx)*.08;z.my+=(z.ty-z.my)*.08;z.gl+=(z.tgl-z.gl)*.08;
    z.fr.style.setProperty('--mx',z.mx.toFixed(3));z.fr.style.setProperty('--my',z.my.toFixed(3));z.fr.style.setProperty('--gl',z.gl.toFixed(3));
    if(z.x)drawFx(z)}
  fzRaf=any?requestAnimationFrame(fzFrame):0;if(!any)fzT=0}
function fzKick(){if(!fzRaf)fzRaf=requestAnimationFrame(fzFrame)}
function fzScroll(dy){var vh=innerHeight,pin=false;
  for(var i=0;i<FZ.length;i++){var z=FZ[i],r=z.el.getBoundingClientRect();
    if(r.top<vh*.15&&r.bottom>vh*.85)pin=true;
    if(r.bottom<-vh*.2||r.top>vh*1.2)continue;
    var t=clamp(-r.top/Math.max(1,r.height-vh));z.fr.style.setProperty('--t',t.toFixed(4));
    z.t.style.setProperty('--o',clamp(Math.min((t+.08)/.2,(1.04-t)/.14)).toFixed(3));
    if(z.on)z.T+=Math.min(.9,Math.abs(dy)*.0035)}
  /* Кнопка брони внизу не закрывает тарелку, пока на экране сцена меню. */
  if(dock)dock.classList.toggle('fzon',pin)}
function initFz(){
  if(CALM||!FZ.length)return;
  var io=new IntersectionObserver(function(es){es.forEach(function(e){var z=FZ.filter(function(q){return q.el===e.target})[0];if(!z)return;
    z.on=e.isIntersecting;if(z.on){if(!z.P.length)fillFx(z);sizeFx(z);fzKick()}})},{rootMargin:'10% 0px'});
  FZ.forEach(function(z){io.observe(z.el);
    var inn=$('.fz-in',z.el);
    var mv=function(cx,cy){var r=z.fr.getBoundingClientRect();z.tx=clamp((cx-r.left)/r.width*2-1,-1,1);z.ty=clamp((cy-r.top)/r.height*2-1,-1,1);z.tgl=1};
    inn.addEventListener('pointermove',function(e){mv(e.clientX,e.clientY)});
    inn.addEventListener('touchmove',function(e){var t=e.touches[0];if(t)mv(t.clientX,t.clientY)},{passive:true});
    inn.addEventListener('pointerleave',function(){z.tx=z.ty=0;z.tgl=0});
    inn.addEventListener('touchend',function(){z.tgl=0},{passive:true})});
  addEventListener('resize',function(){FZ.forEach(function(z){if(z.on)sizeFx(z)})});
  fzScroll(0);
}

/* ── Прокрутка: шапка, время в сценах ─────────────────────────────── */
var lastY=scrollY;
addEventListener('scroll',function(){
  headIdle();
  var y=scrollY,dy=y-lastY;lastY=y;vel=dy*30;
  if(top)top.classList.toggle('solid',story?y>story.offsetTop+story.offsetHeight-80:y>40);
  if(!CALM){fzScroll(dy);fzKick()}
},{passive:true});

/* ── Появление блоков ─────────────────────────────────────────────── */
var rvs=$$('.rv');
if(CALM||!('IntersectionObserver' in window))rvs.forEach(function(e){e.classList.add('in')});
else{var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:.08});rvs.forEach(function(e){io.observe(e)})}

/* ── Бронь в два нажатия: день и гости, дальше SMS бару ───────────── */
function bkUpdate(box){var dy=$('.chip[data-day][aria-pressed="true"]',box),g=$('.chip[data-g][aria-pressed="true"]',box),go=$('.bk-go',box);
  var a=dy?dy.getAttribute('data-day'):'',b=g?g.getAttribute('data-g'):'';
  go.lastChild.textContent=K.bk.go.replace('@D',a.toLowerCase()).replace('@G',b+' '+K.bk.w);
  go.href='sms:'+K.phone+'?&body='+encodeURIComponent(K.bk.sms.replace('@D',a.toLowerCase()).replace('@G',b))}
$$('[data-bk]').forEach(function(box){$$('.bk-g',box).forEach(function(g){$$('.chip',g).forEach(function(c){c.onclick=function(){$$('.chip',g).forEach(function(x){x.setAttribute('aria-pressed',String(x===c))});bkUpdate(box)}})});bkUpdate(box)});

/* ── Шторки: бронь и всё меню ─────────────────────────────────────── */
var lastFocus=null,openEl=null;
function openSheet(el){lastFocus=d.activeElement;openEl=el;el.hidden=false;requestAnimationFrame(function(){el.classList.add('on')});var f=$('button,a',$('.sh-in',el));if(f)f.focus();d.addEventListener('keydown',escK);root.style.overflow='hidden'}
function closeSheet(){var el=openEl;if(!el)return;openEl=null;el.classList.remove('on');d.removeEventListener('keydown',escK);root.style.overflow='';setTimeout(function(){el.hidden=true},350);if(lastFocus&&lastFocus.focus)lastFocus.focus()}
function escK(e){if(e.key==='Escape')closeSheet()}
$$('.sheet').forEach(function(s){$$('[data-close]',s).forEach(function(b){b.onclick=closeSheet});s.addEventListener('click',function(e){if(e.target===s)closeSheet()})});
var bookS=$('#zapis');
$$('[data-book]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();openSheet(bookS)})});
var full=$('#full'),fo=$('#full-open');
if(fo)fo.onclick=function(){openSheet(full)};
$$('.tabs button',full).forEach(function(b){b.onclick=function(){$$('.tabs button',full).forEach(function(x){var on=x===b;x.setAttribute('aria-selected',String(on));d.getElementById(x.getAttribute('aria-controls')).hidden=!on});$('.sh-in',full).scrollTop=0}});

/* ── 18+: подставка под кружку, после заставки DevUz ──────────────── */
var age=$('#age');
if(age&&root.classList.contains('ask18')){
  var w=0,t=setInterval(function(){w+=150;if(!d.getElementById('dzi')||w>14000){clearInterval(t);age.hidden=false;if(dock)dock.classList.add('away');var y=$('#age-yes');if(y)y.focus()}},150);
  $('#age-yes').onclick=function(){try{localStorage.setItem('jg-18','1')}catch(e){}root.classList.remove('ask18');age.hidden=true;if(dock)dock.classList.remove('away')};
  $('#age-no').onclick=function(){$('#age-p').textContent=K.bye;$('.age-b',age).hidden=true};
}

/* ── Конструктор цены и отсчёт 48 часов ───────────────────────────── */
var rows=$$('#konstruktor input[data-k]'),sumEl=$('#kit-sum'),addEl=$('#kit-add'),nEl=$('#kit-cnt'),shown=K.offer.base,rq=0;
function roll(to){cancelAnimationFrame(rq);var from=shown,t0=0;function s(t){if(!t0)t0=t;var k=clamp((t-t0)/500),e=1-Math.pow(1-k,3);shown=from+(to-from)*e;sumEl.textContent=fmt(shown)+' $';if(k<1)rq=requestAnimationFrame(s)}rq=requestAnimationFrame(s)}
function kit(){var add=0,n=0;rows.forEach(function(r){if(r.checked){add+=+r.getAttribute('data-p');n++}});addEl.textContent=fmt(add)+' $';nEl.textContent=n;roll(K.offer.base+add)}
rows.forEach(function(r){r.onchange=kit});
var all=$('#kit-all');if(all)all.onclick=function(){var on=rows.some(function(r){return!r.checked});rows.forEach(function(r){r.checked=on});kit()};
var cp=$('#kit-copy');if(cp)cp.onclick=function(){var lines=[K.offer.head,'• '+K.offer.baseName+': '+fmt(K.offer.base)+' $'];rows.forEach(function(r){if(r.checked){var it=K.offer.items.filter(function(x){return x.id===r.getAttribute('data-k')})[0];lines.push('• '+it.t+': '+fmt(it.p)+' $')}});lines.push(K.offer.totalW+': '+sumEl.textContent);
  var txt=lines.join('\n');try{navigator.clipboard.writeText(txt).then(function(){cp.lastChild.textContent=K.offer.copied},function(){})}catch(e){}cp.lastChild.textContent=K.offer.copied};
var tm=$('#tm');
if(tm){var start=Date.now();try{var s0=+localStorage.getItem('jg-offer-1');if(s0&&s0<=Date.now())start=s0;else localStorage.setItem('jg-offer-1',String(start))}catch(e){}
  var end=start+K.offer.hours*36e5;
  (function tick(){var left=Math.max(0,end-Date.now());if(!left){$('#timer').classList.add('over');tm.textContent='00:00:00';$('#timer span').firstChild.textContent=K.offer.ended;return}
    tm.textContent=pad(Math.floor(left/36e5))+':'+pad(Math.floor(left%36e5/6e4))+':'+pad(Math.floor(left%6e4/1e3));setTimeout(tick,1000)})()}

initStory();
initFz();
})();
