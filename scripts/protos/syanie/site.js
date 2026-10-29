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
  bmClear();blobs=[];N=K.frames['s'+f];SEG=K.frames['seg'+f].concat([N-1]);imgs=new Array(N);ready=new Array(N);queue=[];
  /* Сначала редкие кадры по всей длине (каждый 16-й, 8-й, 4-й, 2-й),
     потом остальные: как бы быстро ни листали, рядом всегда есть кадр. */
  load(0);fill(vidFmt()?[16,8]:[16,8,4,2,1]);
  if(film&&!filmOn&&!filmDone){film.poster=film.getAttribute('data-p'+f)}
  shownF=-1;vShow();
}
/* Телефону сцену играет видео (ниже), кадрам — только редкая сетка на
   случай, пока видео не пришло. */
function fill(ks){var seen={};queue.forEach(function(i){seen[i]=1});ks.forEach(function(k){for(var i=0;i<N;i+=k)if(!seen[i]&&!imgs[i]){seen[i]=1;queue.push(i)}});if(!imgs[N-1]&&!seen[N-1])queue.push(N-1)}
/* Кадр готов, когда он уже раскодирован (decode): иначе браузер
   раскодирует его при первом рисовании, прямо во время прокрутки, и сцена
   дёргается. */
/* Где можно, кадр грузится файлом (blob) и раскодируется в фоне
   (createImageBitmap из blob): из картинки браузер раскодирует его в
   основном потоке, и прокрутка ждёт (аудит 28.10.2026). */
var BLOB=!!(window.createImageBitmap&&window.fetch&&window.Blob),blobs=[];
function load(i){if(imgs[i])return;active++;
  if(BLOB){imgs[i]=1;fetch(frameSrc(i)).then(function(r){if(!r.ok)throw 0;return r.blob()}).then(function(b){blobs[i]=b;ready[i]=1;active--;if(Math.abs(i-st.f)<AHEAD)want(st.f);pump()},function(){active--;pump()});return}
  var im=new Image();im.decoding='async';imgs[i]=im;
  var ok=function(){ready[i]=1;active--;if(Math.abs(i-st.f)<3||i===0)paint(true);pump()};
  im.onload=function(){if(im.decode)im.decode().then(ok,ok);else ok()};
  im.onerror=function(){active--;pump()};im.src=frameSrc(i)}
/* Догружаем по очереди, ближние к текущему кадру первыми; шесть сразу.
   Пока идёт кино — по два, чтобы не отнимать у него сеть. */
var pumping=false,soft=false;
function pump(){if(!pumping&&!soft)return;var cap=pumping?6:2,c=Math.round(st.f),k,j;
  while(active<cap&&queue.length){
    /* Кадры у текущего места — первыми, дальше по редкой сетке. */
    j=-1;for(k=0;k<10;k++){if(c+k<N&&!imgs[c+k]){j=c+k;break}if(c-k>=0&&!imgs[c-k]){j=c-k;break}}
    if(j<0){j=queue.shift();if(imgs[j])continue}
    load(j)}}
function startPump(){if(pumping)return;pumping=true;if(fmtK==='9')vidLoad();pump()}
function softPump(){if(soft||pumping)return;soft=true;pump()}

/* Холст не крупнее самих кадров (1280 и 720 точек по ширине): дальше
   растягивает видеокарта, а не рисование каждого кадра заново. */
var SRC={'16':[1280,720],'9':[720,1280]};
function size(){if(!cv)return;cw=stage.clientWidth;chh=stage.clientHeight;var s=SRC[fmtK]||[cw,chh],sc=Math.max(s[0]/cw,s[1]/chh);
  dpr=Math.min(devicePixelRatio||1,2,Math.max(1,sc));cv.width=Math.round(cw*dpr);cv.height=Math.round(chh*dpr);shownF=-1;paint(true)}
function has(i){return BLOB?!!bm[i]:!!ready[i]}
function pic(i){return BLOB?bm[i]:imgs[i]}
function near(i){for(var k=0;k<N;k++){if(has(i-k))return i-k;if(has(i+k))return i+k}return -1}
function cover(im,a){var iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height,s=Math.max(cv.width/iw,cv.height/ih),w=iw*s,h=ih*s;ctx.globalAlpha=a;ctx.drawImage(im,(cv.width-w)/2,(cv.height-h)/2,w,h)}
function paint(force){
  if(!ctx||!N)return;var f=clamp(st.f,0,N-1);if(!force&&Math.abs(f-shownF)<.01)return;
  if(vOn){vSeek((Math.round(f/(N-1)*(VN-1))+.5)/VF);shownF=f;return}
  var i=Math.floor(f),t=f-i,b=near(i);if(b<0)return;shownF=f;
  cover(pic(b),1);
  /* Между соседними кадрами — мягкая смесь: прокрутка не идёт ступеньками. */
  if(b===i&&t>.04&&has(i+1))cover(pic(i+1),t);
  want(f);
  ctx.globalAlpha=1;
}
/* Кадр едет за прокруткой с мягким догоном (GSAP scrub .7), как в первой
   версии макета: так пролёт выглядел видео (владелец, 28.10.2026: «раньше
   было намного плавнее»). Ограничение скорости кадра ступенями давало
   рывки на разгоне и торможении, его больше нет. Пока сцена едет, золотые
   кнопки ждут (SY_BUSY). */
var busyT=0;function busy(){window.SY_BUSY=true;clearTimeout(busyT);busyT=setTimeout(function(){window.SY_BUSY=false},900)}
function onScene(){busy();render()}
/* Раскодированные кадры — окно вокруг текущего (ImageBitmap). Браузер
   держит раскодированными не все кадры и выбрасывает их, а потом
   раскодирует кадр прямо при показе, на прокрутке (аудит 28.10.2026: по
   7 мс на кадр и больше). Здесь кадры впереди раскодируются заранее, вне
   основного потока, а дальние отпускаются, чтобы телефону хватало памяти. */
var bm={},bmWait={},bmN=0,BACK=8,AHEAD=26;
function bmClear(){for(var k in bm){try{bm[k].close()}catch(e){}}bm={};bmWait={}}
function want(f){if(!BLOB)return;var c=Math.floor(f),k,i;
  for(k in bm){i=+k;if(i<c-BACK*2||i>c+AHEAD*2){try{bm[k].close()}catch(e){}delete bm[k]}}
  for(k=0;k<=AHEAD&&bmN<4;k++){[c+k,c-k].forEach(function(j){if(j<0||j>=N||bm[j]||bmWait[j]||!ready[j]||bmN>=4||(j<c&&c-j>BACK))return;
    var src=blobs[j];bmWait[j]=1;bmN++;createImageBitmap(src).then(function(x){bmN--;delete bmWait[j];if(blobs[j]!==src||Math.abs(j-st.f)>AHEAD*2){x.close();return}bm[j]=x;if(Math.abs(j-st.f)<3||shownF<0)paint(true);want(st.f)},function(){bmN--;delete bmWait[j]})})}}
/* Телефон, как у SamAuto: сцена — одно видео s9.mp4 (все 868 кадров, ключевой
   каждый третий, без B-кадров), прокрутка его перематывает, iPhone делает
   это аппаратно. Кадры по одному он на быстром свайпе не успевал
   распаковывать, и пролёт лагал (владелец, 29.10.2026: «у samauto этот же
   скролл выглядит дорого, а тут лагает»). Видео качается целиком в память,
   пока идёт кино, и играет оттуда: перемотка не ждёт сеть. Следующая
   перемотка — только после seeked, иначе Safari копит их и отстаёт. iOS
   рисует перемотку после первого play(): он сразу и на паузу, в
   энергосбережении — по первому касанию. Не пришло — кадры. */
var sv=$('#sv'),VOK=!!(sv&&sv.canPlayType&&sv.canPlayType('video/mp4; codecs="avc1.640020"')!==''),vState=0,vOn=false,vWant=-1,VF=24,VN=868;
function vidFmt(){return VOK&&fmtK==='9'&&vState>=0}
function vShow(){var on=vState===2&&fmtK==='9';if(on===vOn)return;vOn=on;stage.classList.toggle('vid',on);shownF=-1;paint(true)}
function vSeek(t){if(sv.seeking){vWant=t;return}vWant=-1;if(Math.abs(sv.currentTime-t)>.4/VF)sv.currentTime=t}
function vFail(){if(vState<0)return;vState=-1;vOn=false;stage.classList.remove('vid');if(fmtK==='9'){fill([4,2,1]);pump()}}
function vidLoad(){if(!VOK||vState)return;vState=1;
  fetch(sv.getAttribute('data-v9')).then(function(r){if(!r.ok)throw 0;return r.blob()}).then(function(b){
    sv.addEventListener('loadeddata',function(){if(vState<0)return;vState=2;VN=Math.max(2,Math.round(sv.duration*VF)||VN);
      var prime=function(){try{var p=sv.play();if(p&&p.then)p.then(function(){sv.pause();shownF=-1;paint(true)},function(){})}catch(e){}};prime();
      addEventListener('touchstart',function(){if(sv.paused&&sv.currentTime===0)prime()},{once:true,passive:true});
      vShow()},{once:true});
    sv.addEventListener('seeked',function(){if(vWant>=0)vSeek(vWant)});
    sv.addEventListener('error',vFail,{once:true});
    sv.preload='auto';sv.src=URL.createObjectURL(b);sv.load()},vFail)}
function seg(k,f){var a=SEG[k],b=SEG[k+1];return clamp((f-a)/Math.max(1,b-a))}
function render(){
  if(!N)return;var p=st.f/(N-1);paint(false);
  if(barEl)barEl.style.transform='scaleX('+p.toFixed(4)+')';
  if(filmDone){var hOn=p<.025||asmRun||ivOn;hero.classList.toggle('on',hOn);stage.classList.toggle('dark',p<.03||asmRun||ivOn);
    /* Нижняя «Записаться» не дублирует кнопку первого экрана (владелец,
       28.10.2026: «2 кнопки?»): док выезжает, когда первый экран ушёл. */
    if(dock)dock.classList.toggle('away',hOn)}
  stage.classList.toggle('lamp',st.f>SEG[0]&&st.f<SEG[2]);
  for(var j=0;j<chs.length;j++){var c=chs[j],e=c.el;if(!e)continue;
    var o=Math.min(clamp((p-c.a)/.03),clamp((c.b-p)/.03));
    if(o<=0){if(e.style.visibility!=='hidden'){e.style.visibility='hidden';e.style.opacity=0}continue}
    e.style.visibility='visible';e.style.opacity=o.toFixed(3);e.style.transform='translate3d(0,'+((1-o)*24).toFixed(1)+'px,0)';
    e.style.pointerEvents=o>.6?'auto':'none'}
  if(ctBars.length){var n=Math.min(6,Math.floor(seg(2,st.f)*6.6));ctBars.forEach(function(b,k){b.classList.toggle('on',k<n)});if(ctN)ctN.textContent=n}
}

function captions(){if(!film.duration)return;var k=film.currentTime/film.duration;if(k>.5){softPump();ivLoad()}var on=-1;
  for(var i=0;i<caps.length;i++)if(k>=+caps[i].getAttribute('data-t'))on=i;
  if(k>.94)on=-1;
  caps.forEach(function(c,i){c.classList.toggle('on',i===on)})}
function endFilm(){if(filmDone)return;filmDone=true;filmOn=false;stage.classList.add('done');stage.classList.remove('playing');
  caps.forEach(function(c){c.classList.remove('on')});paint(true);
  film.classList.add('off');setTimeout(function(){try{film.pause()}catch(e){}},700);
  var atTop=scrollY-story.offsetTop<innerHeight*.2;hero.classList.toggle('on',atTop);stage.classList.toggle('dark',atTop);
  if(atTop&&!asmDone)implantShot();else asmDone=true;if(dock)dock.classList.toggle('away',atTop);startPump()}
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
  x.drawImage(spImg,0,0);x.globalCompositeOperation='multiply';x.fillStyle='#f2c14e';x.fillRect(0,0,c.width,c.height);
  x.globalCompositeOperation='destination-in';x.drawImage(spImg,0,0);return spGold=c}
function asmStop(){cancelAnimationFrame(asmRaf);asmRun=false;if(asmCv){asmCv.classList.add('out')}hero.classList.remove('asm')}
/* Переход внахлёст: настоящий текст проявляется, пока последние импланты
   ещё долетают; слой с имплантами гаснет за то же время. */
function asmFinish(){if(!asmRun)return;asmRun=false;asmDone=true;hero.classList.remove('asm');asmCv.classList.add('out');setTimeout(function(){cancelAnimationFrame(asmRaf);if(!asmRun)asmCv.width=asmCv.height=0},700);render()}
/* После заставки слои импланта не остаются над пролётом: холст отпускает
   память (width 0), видео скрыто (visibility), сцена рисует только кадры. */
/* Перед сборкой — видео: один имплант медленно уплывает, камера догоняет
   его и снимает макро, потом импланты разгоняются и уходят роем вглубь.
   Из этого роя в центре и вылетают импланты, которые садятся в буквы. */
var ivLoaded=false;function ivLoad(){if(ivLoaded||!ivEl||!ivEl.src)return;ivLoaded=true;ivEl.preload='auto';try{ivEl.load()}catch(e){}}
function implantShot(){
  if(!ivEl||!ivEl.src){assemble();return}
  ivLoad();
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
        dl:Math.random()*600,du:1800+Math.random()*500}});
    var hh=step*2.7,ww=hh*.3,t0=performance.now();
    function frame(now){if(!asmRun&&!asmCv.classList.contains('out'))return;var t=now-t0,all=true,got=0;asmX.setTransform(dp,0,0,dp,0,0);asmX.clearRect(0,0,W,H);
      for(var i=0;i<P.length;i++){var q=P[i],k=clamp((t-q.dl)/q.du);if(k<1)all=false;if(k>.92)got++;if(k<=0)continue;
        var e=1-Math.pow(1-k,4),s=q.s0+(1-q.s0)*e,x=q.x0+(q.tx-q.x0)*e,y=q.y0+(q.ty-q.y0)*e;
        asmX.globalAlpha=Math.min(1,.35+k*3);asmX.save();asmX.translate(x,y);asmX.rotate(q.r0*(1-e));
        asmX.drawImage(q.g?sp1:sp0,-ww*s/2,-hh*s/2,ww*s,hh*s);asmX.restore()}
      asmX.globalAlpha=1;
      if(asmRun&&(all||got>P.length*.85))asmFinish();
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
  /* Ролик импланта грузится со второй половины кино, а не сразу: иначе он
     отнимал сеть у кино и у кадров прокрутки. */
  if(ivEl){ivEl.preload='none';ivEl.src=ivEl.getAttribute('data-v'+fmtK)}
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
    ScrollTrigger.config({ignoreMobileResize:true});
    gsap.to(st,{f:function(){return N-1},ease:'none',scrollTrigger:{trigger:story,start:'top top',end:'bottom bottom',scrub:.7,invalidateOnRefresh:true,onRefresh:render},onUpdate:onScene});
  }else{
    var lerp=function(){var r=story.getBoundingClientRect(),p=clamp(-r.top/Math.max(1,r.height-innerHeight)),to=p*(N-1);if(Math.abs(to-st.f)>.01){st.f+=(to-st.f)*.18;onScene()}requestAnimationFrame(lerp)};lerp();
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
  if((asmRun||ivOn)&&story&&y-story.offsetTop>40){if(ivOn){ivOn=false;ivEl.classList.remove('on');try{ivEl.pause()}catch(e){}asmDone=true;hero.classList.remove('asm')}asmFinish();render()}
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
  go.addEventListener('click',function(){mine(SY.addLead({src:'quiz',name:nm&&nm.value.trim()||'',what:'Расчёт All-on-6: '+answers().map(function(a){return a[1]}).filter(Boolean).join(', '),when:''}))});
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
  bkGo.addEventListener('click',function(){var dy=$('.chip[data-day][aria-pressed="true"]'),pt=$('.chip[data-part][aria-pressed="true"]');
    mine(SY.addLead({src:'booking',name:'',what:'Бесплатная консультация All-on-6',when:((dy?dy.getAttribute('data-day'):'')+' '+(pt?pt.getAttribute('data-part'):'')).toLowerCase()}))});
}

/* ── Моя заявка: статус из панели клиники виден здесь ──────────────── */
var ME='sy-me',stEl=null,ST={new:'принята, администратор скоро свяжется',confirmed:'подтверждена администратором',came:'вы были на приёме, спасибо',canceled:'отменена'};
function mine(id){try{localStorage.setItem(ME,id)}catch(e){}myStatus()}
function myStatus(){var id;try{id=localStorage.getItem(ME)}catch(e){}var l=id&&window.SY?SY.lead(id):null;
  if(!l){if(stEl)stEl.hidden=true;return}
  if(!stEl){stEl=d.createElement('button');stEl.type='button';stEl.className='my-st';stEl.setAttribute('aria-live','polite');stEl.onclick=function(){stEl.hidden=true};d.body.appendChild(stEl)}
  stEl.hidden=false;stEl.setAttribute('data-s',l.status);stEl.innerHTML='<i></i><span></span>';stEl.lastChild.textContent='Ваша заявка '+ST[l.status]}
d.addEventListener('sy:change',myStatus);myStatus();

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
