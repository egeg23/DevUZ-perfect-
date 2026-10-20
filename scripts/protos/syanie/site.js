(function(){
'use strict';
/* «Сияние Севера»: кино первого экрана, сцены по прокрутке на canvas, шапка
   по правилу трёх секунд, сравнение методик, квиз, запись в два нажатия,
   вопросы, конструктор цены. Прокрутка родная: GSAP ScrollTrigger только
   читает её положение и сглаживает (scrub), sticky держит сцену. Модель
   макет не вызывает. */
var d=document,root=d.documentElement;
function $(s,c){return(c||d).querySelector(s)}
function $$(s,c){return Array.prototype.slice.call((c||d).querySelectorAll(s))}
var K=JSON.parse($('#sy-site').textContent);
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

/* ── Кино и сцены ─────────────────────────────────────────────────── */
var story=$('#story'),stage=$('#stage'),cv=$('#cv'),film=$('#film'),hero=$('#hero'),capEl=$('#cap'),barEl=$('#bar');
var caps=capEl?$$('span',capEl):[];
var chs=K.chapters.map(function(c){return{el:d.getElementById(c.id),a:c.a,b:c.b}});
var ctBars=$$('.ch-ct i'),ctN=$('#ct-n');
var ctx=cv&&cv.getContext('2d'),fmtK='',N=0,SEG=[],imgs=[],ready=[],queue=[],active=0,dpr=1,cw=0,chh=0;
var st={f:0},shownF=-1,filmDone=false,filmOn=false;

function pick(){return innerWidth/innerHeight<0.8?'9':'16'}
function frameSrc(i){return K.img+'/s'+fmtK+'/'+(i<10?'00':i<100?'0':'')+i+'.webp'}
function setFmt(){
  var f=pick();if(f===fmtK)return;fmtK=f;
  N=K.frames['s'+f];SEG=K.frames['seg'+f].concat([N-1]);imgs=new Array(N);ready=new Array(N);queue=[];
  load(0);for(var i=1;i<N;i++)queue.push(i);
  if(film&&!filmOn&&!filmDone){film.poster=film.getAttribute('data-p'+f)}
  shownF=-1;
}
function load(i){if(imgs[i])return;var im=new Image();im.decoding='async';imgs[i]=im;active++;
  im.onload=function(){ready[i]=1;active--;if(Math.abs(i-st.f)<3||i===0)paint(true);pump()};
  im.onerror=function(){active--;pump()};im.src=frameSrc(i)}
/* Догружаем по очереди, ближние к текущему кадру первыми; шесть сразу. */
var pumping=false;
function pump(){if(!pumping)return;
  if(queue.length>1){var c=Math.round(st.f);queue.sort(function(a,b){return Math.abs(a-c)-Math.abs(b-c)})}
  while(active<6&&queue.length){var i=queue.shift();if(!imgs[i])load(i)}}
function startPump(){if(pumping)return;pumping=true;pump()}

function size(){if(!cv)return;dpr=Math.min(devicePixelRatio||1,2);cw=stage.clientWidth;chh=stage.clientHeight;cv.width=Math.round(cw*dpr);cv.height=Math.round(chh*dpr);shownF=-1;paint(true)}
function near(i){for(var k=0;k<N;k++){if(ready[i-k])return i-k;if(ready[i+k])return i+k}return -1}
function cover(im,a){var iw=im.naturalWidth,ih=im.naturalHeight,s=Math.max(cv.width/iw,cv.height/ih),w=iw*s,h=ih*s;ctx.globalAlpha=a;ctx.drawImage(im,(cv.width-w)/2,(cv.height-h)/2,w,h)}
function paint(force){
  if(!ctx||!N)return;var f=clamp(st.f,0,N-1);if(!force&&Math.abs(f-shownF)<.01)return;
  var i=Math.floor(f),t=f-i,b=near(i);if(b<0)return;shownF=f;
  cover(imgs[b],1);
  /* Между соседними кадрами — мягкая смесь: прокрутка не идёт ступеньками. */
  if(b===i&&t>.04&&ready[i+1])cover(imgs[i+1],t);
  ctx.globalAlpha=1;
}
function seg(k,f){var a=SEG[k],b=SEG[k+1];return clamp((f-a)/Math.max(1,b-a))}
function render(){
  if(!N)return;var p=st.f/(N-1);paint(false);
  if(barEl)barEl.style.transform='scaleX('+p.toFixed(4)+')';
  if(filmDone){hero.classList.toggle('on',p<.025||asmRun||ivOn);stage.classList.toggle('dark',p<.03||asmRun||ivOn)}
  stage.classList.toggle('lamp',st.f>SEG[0]&&st.f<SEG[2]);
  for(var j=0;j<chs.length;j++){var c=chs[j],e=c.el;if(!e)continue;
    var o=Math.min(clamp((p-c.a)/.03),clamp((c.b-p)/.03));
    if(o<=0){if(e.style.visibility!=='hidden'){e.style.visibility='hidden';e.style.opacity=0}continue}
    e.style.visibility='visible';e.style.opacity=o.toFixed(3);e.style.transform='translate3d(0,'+((1-o)*24).toFixed(1)+'px,0)';
    e.style.pointerEvents=o>.6?'auto':'none'}
  if(ctBars.length){var n=Math.min(6,Math.floor(seg(2,st.f)*6.6));ctBars.forEach(function(b,k){b.classList.toggle('on',k<n)});if(ctN)ctN.textContent=n}
}

function captions(){if(!film.duration)return;var k=film.currentTime/film.duration,on=-1;
  for(var i=0;i<caps.length;i++)if(k>=+caps[i].getAttribute('data-t'))on=i;
  if(k>.94)on=-1;
  caps.forEach(function(c,i){c.classList.toggle('on',i===on)})}
function endFilm(){if(filmDone)return;filmDone=true;filmOn=false;stage.classList.add('done');stage.classList.remove('playing');
  caps.forEach(function(c){c.classList.remove('on')});paint(true);
  film.classList.add('off');setTimeout(function(){try{film.pause()}catch(e){}},700);
  var atTop=scrollY-story.offsetTop<innerHeight*.2;hero.classList.toggle('on',atTop);stage.classList.toggle('dark',atTop);
  if(atTop&&!asmDone)implantShot();else asmDone=true;if(dock)dock.classList.remove('away');startPump()}
function playFilm(){
  if(film.error){endFilm();return}
  filmDone=false;filmOn=true;asmDone=false;asmStop();ivOn=false;if(ivEl){ivEl.classList.remove('on');try{ivEl.pause()}catch(e){}}stage.classList.remove('done','dark');stage.classList.add('playing');hero.classList.remove('on');film.classList.remove('off');
  if(dock)dock.classList.add('away');
  try{film.currentTime=0}catch(e){}
  var t0=Date.now(),seen=-1,still=0,watch=setInterval(function(){
    if(filmDone){clearInterval(watch);return}
    if(film.currentTime===seen){still+=250;if(still>=(seen>0?1500:4500)){clearInterval(watch);endFilm()}}else{seen=film.currentTime;still=0}
  },250);
  try{var p=film.play();if(p&&p.catch)p.catch(function(){clearInterval(watch);endFilm()})}catch(e){endFilm()}
  setTimeout(startPump,1200);
}
/* Заголовок собирается из имплантов. Буквы настоящего h1 рисуются в
   невидимый холст, из пикселей берутся точки; в каждую из глубины, как от
   зрителя, медленно летит титановый имплант (рисунок кодом, без файла) и
   встаёт вертикально. «За один день» — импланты цвета оникса. Потом слой
   растворяется в настоящий текст, следом подзаголовок, кнопки, «Листайте».
   Прокрутка во время сборки сразу показывает текст. */
var ivEl=$('#iv'),ivOn=false,asmCv=$('#asm'),asmX=asmCv&&asmCv.getContext('2d'),asmRun=false,asmDone=false,asmRaf=0,asmT=0;
/* Имплант для роя: фотореалистичный спрайт (Nano Banana, вырезан с
   чёрного фона). Золотой — тот же, тонированный под оникс. */
var spImg=new Image(),spGold=null;
function spriteGold(){if(spGold)return spGold;var c=d.createElement('canvas');c.width=spImg.naturalWidth;c.height=spImg.naturalHeight;var x=c.getContext('2d');
  x.drawImage(spImg,0,0);x.globalCompositeOperation='multiply';x.fillStyle='#e8b571';x.fillRect(0,0,c.width,c.height);
  x.globalCompositeOperation='destination-in';x.drawImage(spImg,0,0);return spGold=c}
function asmStop(){cancelAnimationFrame(asmRaf);asmRun=false;if(asmCv){asmCv.classList.add('out')}hero.classList.remove('asm')}
function asmFinish(){if(!asmRun)return;asmRun=false;asmDone=true;cancelAnimationFrame(asmRaf);hero.classList.remove('asm');asmCv.classList.add('out');setTimeout(function(){if(!asmRun)asmX.clearRect(0,0,asmCv.width,asmCv.height)},900);render()}
/* Перед сборкой — видео: один имплант медленно уплывает, камера догоняет
   его и снимает макро, потом импланты разгоняются и уходят роем вглубь.
   Из этого роя в центре и вылетают импланты, которые садятся в буквы. */
function implantShot(){
  if(!ivEl||!ivEl.src){assemble();return}
  ivOn=true;hero.classList.add('asm','on');stage.classList.add('dark');
  var done=false,fin=function(){if(done)return;done=true;ivOn=false;ivEl.classList.remove('on');setTimeout(function(){try{ivEl.pause()}catch(e){}},900);assemble()};
  var t=setTimeout(fin,11000),seen=-1,still=0,w=setInterval(function(){if(done){clearInterval(w);return}if(ivEl.currentTime===seen){if((still+=250)>=(seen>0?1200:3500)){clearInterval(w);fin()}}else{seen=ivEl.currentTime;still=0}},250);
  ivEl.onended=function(){clearTimeout(t);fin()};ivEl.onerror=function(){clearTimeout(t);fin()};
  ivEl.ontimeupdate=function(){if(ivEl.duration&&ivEl.currentTime>ivEl.duration-.9&&!done)fin()};
  try{ivEl.currentTime=0;ivEl.classList.add('on');var p=ivEl.play();if(p&&p.catch)p.catch(function(){clearTimeout(t);fin()})}catch(e){fin()}
}
function assemble(){
  var h1=$('#h1');if(!asmX||!h1){asmDone=true;return}
  asmRun=true;hero.classList.add('asm','on');stage.classList.add('dark');
  var go=function(){if(!asmRun)return;
    var r=stage.getBoundingClientRect(),dp=Math.min(devicePixelRatio||1,2),W=r.width,H=r.height;
    asmCv.width=Math.round(W*dp);asmCv.height=Math.round(H*dp);asmCv.classList.remove('out');
    var off=d.createElement('canvas');off.width=Math.round(W);off.height=Math.round(H);var o=off.getContext('2d');
    var spans=$$('.w',h1),gold=[];
    spans.forEach(function(sp){var b=sp.getBoundingClientRect(),cs=getComputedStyle(sp),em=!!sp.closest('em');
      o.font=cs.fontStyle+' '+cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily;o.textBaseline='alphabetic';
      o.fillStyle=em?'#f00':'#fff';var m=o.measureText(sp.textContent);
      o.fillText(sp.textContent,b.left-r.left,b.top-r.top+(b.height+m.actualBoundingBoxAscent-m.actualBoundingBoxDescent)/2)});
    var px=o.getImageData(0,0,off.width,off.height).data,step=W<700?3:4,pts=[];
    for(;;){pts=[];for(var y=0;y<off.height;y+=step)for(var x=0;x<off.width;x+=step){var k=(y*off.width+x)*4;if(px[k+3]>140)pts.push([x,y,px[k+1]<80])}if(pts.length<=(W<700?1700:2600)||step>9)break;step++}
    var sp0=spImg,sp1=spriteGold(),cx=W/2,cy=H*.5,P=pts.map(function(q){var a=Math.random()*6.283,rr=.6+Math.random()*1.4;
      return{tx:q[0],ty:q[1],g:q[2],x0:cx+Math.cos(a)*W*.16*rr,y0:cy+Math.sin(a)*H*.12*rr,s0:.2+Math.random()*.35,r0:(Math.random()-.5)*6,
        dl:Math.random()*900,du:1900+Math.random()*900}});
    var hh=step*2.7,ww=hh*.3,t0=performance.now();
    function frame(now){if(!asmRun)return;var t=now-t0,all=true;asmX.setTransform(dp,0,0,dp,0,0);asmX.clearRect(0,0,W,H);
      for(var i=0;i<P.length;i++){var q=P[i],k=clamp((t-q.dl)/q.du);if(k<1)all=false;if(k<=0)continue;
        var e=1-Math.pow(1-k,4),s=q.s0+(1-q.s0)*e,x=q.x0+(q.tx-q.x0)*e,y=q.y0+(q.ty-q.y0)*e;
        asmX.globalAlpha=Math.min(1,.35+k*3);asmX.save();asmX.translate(x,y);asmX.rotate(q.r0*(1-e));
        asmX.drawImage(q.g?sp1:sp0,-ww*s/2,-hh*s/2,ww*s,hh*s);asmX.restore()}
      asmX.globalAlpha=1;
      if(all){if(!asmT)asmT=now;if(now-asmT>700){asmT=0;asmFinish();return}}
      asmRaf=requestAnimationFrame(frame)}
    asmRaf=requestAnimationFrame(frame)};
  var f=d.fonts&&d.fonts.ready,sp=new Promise(function(ok){if(spImg.complete&&spImg.naturalWidth)ok();else{spImg.onload=ok;spImg.onerror=function(){asmFinish()}}});
  Promise.all([f||1,sp]).then(function(){requestAnimationFrame(go)});
  setTimeout(asmFinish,9000);
}
function initStory(){
  if(!story||CALM||!ctx)return;
  setFmt();size();
  film.src=film.getAttribute('data-v'+fmtK);
  if(ivEl){ivEl.preload='auto';ivEl.src=ivEl.getAttribute('data-v'+fmtK)}
  if(asmCv)spImg.src=asmCv.getAttribute('data-sprite');
  film.addEventListener('timeupdate',captions);
  film.addEventListener('ended',endFilm);
  film.addEventListener('error',endFilm);
  $('#skipf').onclick=endFilm;
  $('#replay').onclick=function(){scrollTo(0,story.offsetTop);playFilm()};
  /* Видео DevUz первым: кино клиники ждёт, пока заставка уйдёт. */
  var waited=0,w=setInterval(function(){waited+=120;if(!d.getElementById('dzi')||waited>12000){clearInterval(w);if(scrollY>story.offsetTop+innerHeight*.3)endFilm();else playFilm()}},120);
  if(window.gsap&&window.ScrollTrigger){
    gsap.registerPlugin(ScrollTrigger);
    gsap.to(st,{f:function(){return N-1},ease:'none',scrollTrigger:{trigger:story,start:'top top',end:'bottom bottom',scrub:.7,invalidateOnRefresh:true},onUpdate:render});
  }else{
    var lerp=function(){var r=story.getBoundingClientRect(),p=clamp(-r.top/Math.max(1,r.height-innerHeight));st.f+=(p*(N-1)-st.f)*.18;render();requestAnimationFrame(lerp)};lerp();
  }
  addEventListener('resize',function(){var f=fmtK;setFmt();if(f!==fmtK&&pumping){pumping=false;startPump()}size();render()});
  render();
}

/* ── Прокрутка: шапка, док, кино уступает пальцу ──────────────────── */
var lastY=scrollY;
addEventListener('scroll',function(){
  headIdle();
  var y=scrollY;
  if(filmOn&&!filmDone&&story&&y-story.offsetTop>40)endFilm();
  if((asmRun||ivOn)&&story&&y-story.offsetTop>40){if(ivOn){ivOn=false;ivEl.classList.remove('on');try{ivEl.pause()}catch(e){}asmDone=true;hero.classList.remove('asm')}asmFinish()}
  if(top)top.classList.toggle('solid',story?y>story.offsetTop+story.offsetHeight-80:y>40);
  lastY=y;
},{passive:true});

/* ── Появление блоков ─────────────────────────────────────────────── */
var rvs=$$('.rv');
if(CALM||!('IntersectionObserver' in window))rvs.forEach(function(e){e.classList.add('in')});
else{var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:.08});rvs.forEach(function(e){io.observe(e)})}

/* Цены прокатываются до своего числа, когда карточка в кадре. */
$$('.pr-n').forEach(function(el){var n=+el.getAttribute('data-n');if(CALM||!('IntersectionObserver' in window))return;
  var o=new IntersectionObserver(function(es){if(!es[0].isIntersecting)return;o.disconnect();var t0=0;
    function step(t){if(!t0)t0=t;var k=clamp((t-t0)/1400),e=1-Math.pow(1-k,4);el.textContent=fmt(Math.round(n*e/100)*100)+' ₽';if(k<1)requestAnimationFrame(step)}
    requestAnimationFrame(step)},{threshold:.4});o.observe(el)});

/* ── All-on-6 / All-on-4 ──────────────────────────────────────────── */
var vs=$('#all-on-6');
if(vs){vs.setAttribute('data-n','6');$$('.vs-tg button',vs).forEach(function(b){b.onclick=function(){var n=b.getAttribute('data-n');vs.setAttribute('data-n',n);$$('.vs-tg button',vs).forEach(function(x){x.setAttribute('aria-selected',String(x===b))});$('#vs-n').textContent=n}})}

/* ── Квиз ─────────────────────────────────────────────────────────── */
var qz=$('#qz');
if(qz){
  var steps=$$('.qz-s',qz),cur=0,back=$('#qz-back'),hint=$('#qz-hint'),qbar=$('#qz-bar'),sum=$('#qz-sum'),nm=$('#qz-name'),go=$('#qz-sms');
  var answers=function(){return K.quiz.map(function(q,i){var c=$('input[name="q'+i+'"]:checked',qz);return[q,c?c.value:'']})};
  var smsBody=function(){var lines=['Здравствуйте! Хочу на консультацию по All-on-6. Мой расчёт с сайта:'];answers().forEach(function(a){lines.push(a[0]+' '+a[1])});if(nm&&nm.value.trim())lines.push('Меня зовут '+nm.value.trim()+'.');return lines.join('\n')};
  var show=function(k){cur=k;steps.forEach(function(s,i){s.classList.toggle('on',i===k);s.classList.toggle('past',i<k);s.toggleAttribute('inert',i!==k)});
    qbar.style.transform='scaleX('+((k+1)/steps.length)+')';back.disabled=k===0;qz.classList.toggle('end',k===steps.length-1);
    hint.textContent=k<steps.length-1?'Выберите ответ':'';
    if(k===steps.length-1){sum.innerHTML='';answers().forEach(function(a){var li=d.createElement('li');li.innerHTML='<span></span><b></b>';li.firstChild.textContent=a[0];li.lastChild.textContent=a[1];sum.appendChild(li)});upd()}};
  var upd=function(){go.href='sms:'+K.phone+'?&body='+encodeURIComponent(smsBody())};
  steps.forEach(function(s,i){$$('input',s).forEach(function(r){r.addEventListener('change',function(){setTimeout(function(){if(cur===i)show(i+1)},320)})})});
  back.onclick=function(){if(cur>0)show(cur-1)};
  if(nm)nm.addEventListener('input',upd);
  $('#qz-f').addEventListener('submit',function(e){e.preventDefault()});
  show(0);
}

/* ── Запись в два нажатия ─────────────────────────────────────────── */
var sheet=$('#zapis'),bkGo=$('#bk-go'),lastFocus=null;
function bkText(){var dy=$('.chip[data-day][aria-pressed="true"]'),pt=$('.chip[data-part][aria-pressed="true"]');
  var a=dy?dy.getAttribute('data-day'):'',b=pt?pt.getAttribute('data-part'):'';
  bkGo.lastChild.textContent='Записаться: '+(a+' '+b).toLowerCase();
  bkGo.href='sms:'+K.phone+'?&body='+encodeURIComponent('Здравствуйте! Хочу записаться на бесплатную консультацию по All-on-6. Удобно: '+(a+', '+b).toLowerCase()+'.')}
function openSheet(e){if(e)e.preventDefault();lastFocus=d.activeElement;sheet.hidden=false;requestAnimationFrame(function(){sheet.classList.add('on')});var f=$('.chip',sheet);if(f)f.focus();d.addEventListener('keydown',esc)}
function closeSheet(){sheet.classList.remove('on');d.removeEventListener('keydown',esc);setTimeout(function(){sheet.hidden=true},350);if(lastFocus&&lastFocus.focus)lastFocus.focus()}
function esc(e){if(e.key==='Escape')closeSheet()}
if(sheet){
  $$('[data-book]').forEach(function(a){a.addEventListener('click',openSheet)});
  $$('[data-close]',sheet).forEach(function(b){b.onclick=closeSheet});
  sheet.addEventListener('click',function(e){if(e.target===sheet)closeSheet()});
  $$('.bk-g',sheet).forEach(function(g){$$('.chip',g).forEach(function(c){c.onclick=function(){$$('.chip',g).forEach(function(x){x.setAttribute('aria-pressed',String(x===c))});bkText()}})});
  bkText();
}

/* ── Вопросы: раскрытие с плавной высотой ─────────────────────────── */
$$('.fq-q').forEach(function(b){b.onclick=function(){var it=b.closest('.fq-i'),open=!it.classList.contains('open');
  $$('.fq-i.open').forEach(function(x){if(x!==it){x.classList.remove('open');$('.fq-q',x).setAttribute('aria-expanded','false')}});
  it.classList.toggle('open',open);b.setAttribute('aria-expanded',String(open))}});

/* ── Конструктор цены и отсчёт 48 часов ───────────────────────────── */
var rows=$$('#konstruktor input[data-k]'),sumEl=$('#kit-sum'),addEl=$('#kit-add'),nEl=$('#kit-cnt'),shown=K.offer.base,rq=0;
function roll(to){cancelAnimationFrame(rq);var from=shown,t0=0;function s(t){if(!t0)t0=t;var k=clamp((t-t0)/500),e=1-Math.pow(1-k,3);shown=from+(to-from)*e;sumEl.textContent=fmt(shown)+' '+K.offer.cur;if(k<1)rq=requestAnimationFrame(s)}rq=requestAnimationFrame(s)}
function kit(){var add=0,n=0;rows.forEach(function(r){if(r.checked){add+=+r.getAttribute('data-p');n++}});addEl.textContent=fmt(add)+' '+K.offer.cur;nEl.textContent=n;roll(K.offer.base+add)}
rows.forEach(function(r){r.onchange=kit});
var all=$('#kit-all');if(all)all.onclick=function(){var on=rows.some(function(r){return!r.checked});rows.forEach(function(r){r.checked=on});kit()};
var cp=$('#kit-copy');if(cp)cp.onclick=function(){var lines=[K.offer.head,'• '+K.offer.baseName+': '+fmt(K.offer.base)+' '+K.offer.cur];rows.forEach(function(r){if(r.checked){var it=K.offer.items.filter(function(x){return x.id===r.getAttribute('data-k')})[0];lines.push('• '+it.t+': '+fmt(it.p)+' '+K.offer.cur)}});lines.push(K.offer.totalW+': '+sumEl.textContent);
  var txt=lines.join('\n');try{navigator.clipboard.writeText(txt).then(function(){cp.lastChild.textContent=K.offer.copied},function(){})}catch(e){}cp.lastChild.textContent=K.offer.copied};
var tm=$('#tm');
if(tm){var start=Date.now();try{var s0=+localStorage.getItem('sy-offer-1');if(s0&&s0<=Date.now())start=s0;else localStorage.setItem('sy-offer-1',String(start))}catch(e){}
  var end=start+K.offer.hours*36e5;
  (function tick(){var left=Math.max(0,end-Date.now());if(!left){$('#timer').classList.add('over');tm.textContent='00:00:00';$('#timer span').firstChild.textContent=K.offer.ended;return}
    tm.textContent=pad(Math.floor(left/36e5))+':'+pad(Math.floor(left%36e5/6e4))+':'+pad(Math.floor(left%6e4/1e3));setTimeout(tick,1000)})()}

/* Шапка у верхнего края страницы стоит прозрачной. */
initStory();
if(CALM&&hero)hero.classList.add('on');
})();
