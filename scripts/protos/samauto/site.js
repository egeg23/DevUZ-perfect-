(function(){
'use strict';
var d=document,root=d.documentElement,$=function(s,c){return(c||d).querySelector(s)},$$=function(s,c){return[].slice.call((c||d).querySelectorAll(s))};
var CALM=root.classList.contains('calm');
var top=$('#top'),dock=$('#dock'),track=$('#track'),stage=$('#stage');

/* Шапка: при любой прокрутке прячется, через 3 с после остановки — обратно. */
var IDLE=3000,idleT=0;
function headIdle(){if(!top)return;clearTimeout(idleT);
  if(!top.contains(d.activeElement))top.classList.add('hide');
  idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}

/* Доля пройденной сцены 0…1: сколько дорожки уехало за верх экрана. */
function progress(){if(!track)return 0;var r=track.getBoundingClientRect(),h=r.height-innerHeight;return h>0?Math.min(1,Math.max(0,-r.top/h)):0}

var bar=$('#bar'),copies=$$('.copy[data-w]').map(function(el){return{el:el,w:el.getAttribute('data-w').split(',').map(Number)}});
var sm=function(a,b,v){if(b<=a)return v>=b?1:0;var t=Math.min(1,Math.max(0,(v-a)/(b-a)));return t*t*(3-2*t)};
function show(el,k){el.style.opacity=k.toFixed(3);el.style.transform='translateY('+((1-k)*16).toFixed(1)+'px)';el.setAttribute('aria-hidden',k<.5?'true':'false');
  $$('a',el).forEach(function(a){a.tabIndex=k<.5?-1:0})}
function copy(p){
  copies.forEach(function(c){var w=c.w;show(c.el,sm(w[0],w[1],p)*(1-sm(w[2],w[3],p)))});
  if(bar)bar.style.transform='scaleX('+p.toFixed(4)+')';
  if(dock)dock.classList.toggle('off',track.getBoundingClientRect().bottom>innerHeight*.4)}

/* Кадры: фото сцены по порядку, прокрутка листает их. */
var cv=$('#cv'),cx=cv&&cv.getContext('2d'),site=JSON.parse($('#sa-site').textContent);
var portrait=innerHeight>innerWidth,set=portrait?'m':'d',blend=true;
/* Телефон — одно видео m.mp4, каждый кадр ключевой: перемотка аппаратная,
   картинки не распаковываются (по одной iPhone на разлёте не успевал). Не
   умеет mp4 или видео не пришло — кадры по одному, как на компьютере. */
var vd=$('#vd'),VID=portrait&&!!vd&&!!vd.canPlayType&&vd.canPlayType('video/mp4; codecs="avc1.640020"')!=='',fps=site.fps||24,vbox=null,vseek=-1;
/* Кадры в порядке сцены повторяются (пауза, сборка задом наперёд): файл
   качаем один раз, кадр сцены — номер файла. */
var names=site.frames,N=names.length,files=[],fi=[],at={},pos=[];
names.forEach(function(n,i){if(!(n in at)){at[n]=files.length;files.push(n);pos.push([])}fi.push(at[n]);pos[at[n]].push(i)});
var F=files.length,blob=new Array(F),bmp={},nb=0,busy={},active=0,shown=null;
var cur=0,want=0,raf=0,ready=false;

function fit(){if(!cv)return;var r=Math.min(devicePixelRatio||1,2),w=Math.round(stage.clientWidth*r),h=Math.round(stage.clientHeight*r);if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;box=null;vbox=null}}

/* Плавность: кадры распаковываются заранее, окном вокруг места прокрутки
   (AHEAD по ходу, вдвое меньше назад), по два сразу. Распакованных — не
   больше MAXB, лишним становится самый далёкий от экрана. Распаковка в момент
   показа на iPhone не успевает, и кадры пропадают (владелец, 21.10.2026). */
var MAXB=portrait?44:36,AHEAD=portrait?28:22,dir=1;
function here(){return Math.round(cur*(N-1))}
function far(u,i){var p=pos[u],d=1e9;for(var k=0;k<p.length;k++)d=Math.min(d,Math.abs(p[k]-i));return d}
function evict(i){while(nb>MAXB){var w=-1,wd=-1;for(var u in bmp){var x=bmp[u];if(x===shown)continue;var d=far(+u,i);if(d>wd){wd=d;w=u}}if(w<0)return;if(bmp[w].close)bmp[w].close();delete bmp[w];nb--}}
function pick(i){for(var s=0;s<=AHEAD;s++){var c=[i+s*dir];if(s&&s<=AHEAD/2)c.push(i-s*dir);for(var k=0;k<c.length;k++){var j=c[k];if(j<0||j>=N)continue;var u=fi[j];if(blob[u]&&!bmp[u]&&!busy[u])return u}}return -1}
function pump(){while(active<2){var i=here(),u=pick(i);if(u<0)return;decode(u)}}
function decode(u){busy[u]=1;active++;
  var done=function(b){busy[u]=0;active--;if(b){bmp[u]=b;nb++;evict(here());if(!raf)raf=requestAnimationFrame(loop)}pump()};
  if(window.createImageBitmap)createImageBitmap(blob[u]).then(done,function(){viaImg(u,done)});else viaImg(u,done)}
function viaImg(u,cb){var im=new Image(),url=URL.createObjectURL(blob[u]);im.onload=function(){cb(im);setTimeout(function(){URL.revokeObjectURL(url)},0)};im.onerror=function(){cb(null)};im.src=url}
var dw=function(b){return b.naturalWidth||b.width},dh=function(b){return b.naturalHeight||b.height};
/* Ближайший к кадру сцены уже распакованный — вместо пустого или прыжка назад. */
function ready_(i){for(var s=0;s<=AHEAD;s++){var a=i-s*dir,b=i+s*dir;if(b>=0&&b<N&&bmp[fi[b]])return fi[b];if(a>=0&&a<N&&bmp[fi[a]])return fi[a]}return -1}

/* Кадр на весь экран, но узкий телефон срезал бы детали разлёта по бокам:
   режем не больше 8% ширины, сверху и снизу кадр тает в цвет зала. */
var box=null;
function place(im){var W=cv.width,H=cv.height,iw=dw(im),ih=dh(im),k=Math.min(Math.max(W/iw,H/ih),W/iw*1.08),w=iw*k,h=ih*k;box=[(W-w)/2,(H-h)/2,w,h]}
function put(im,a){if(!box)place(im);cx.globalAlpha=a;cx.drawImage(im,box[0],box[1],box[2],box[3])}
function feather(){var y=box[1],H=cv.height,f=Math.min(80,H*.08),g;if(y<=0)return;
  cx.fillStyle='#07080a';cx.fillRect(0,0,cv.width,y);cx.fillRect(0,H-y,cv.width,y);
  g=cx.createLinearGradient(0,y,0,y+f);g.addColorStop(0,'#07080a');g.addColorStop(1,'rgba(7,8,10,0)');cx.fillStyle=g;cx.fillRect(0,y,cv.width,f);
  g=cx.createLinearGradient(0,H-y,0,H-y-f);g.addColorStop(0,'#07080a');g.addColorStop(1,'rgba(7,8,10,0)');cx.fillStyle=g;cx.fillRect(0,H-y-f,cv.width,f)}
/* Рисуем нужный кадр и поверх следующий с долей — переход плавный. Не
   распакован — ближайший распакованный, распаковка идёт окном. */
function vplace(){var W=stage.clientWidth,H=stage.clientHeight,iw=vd.videoWidth,ih=vd.videoHeight;if(!iw)return;var k=Math.min(Math.max(W/iw,H/ih),W/iw*1.08),w=iw*k,h=ih*k;
  vbox=[(W-w)/2,(H-h)/2,w,h];vd.style.left=vbox[0]+'px';vd.style.top=vbox[1]+'px';vd.style.width=w+'px';vd.style.height=h+'px';
  var r=cv.width/W;box=[vbox[0]*r,vbox[1]*r,w*r,h*r];cx.clearRect(0,0,cv.width,cv.height);feather()}
/* Перемотка: следующая — только когда прошлая встала (seeked), иначе Safari
   копит запросы и отстаёт. */
function vgo(i){var t=(i+.5)/fps;if(vd.seeking){vseek=t;return}vseek=-1;if(Math.abs(vd.currentTime-t)>.4/fps)vd.currentTime=t}
function draw(){if(VID){if(vd.readyState>=1){if(!vbox)vplace();vgo(Math.round(cur*(N-1)))}return}
  if(!cx)return;var f=cur*(N-1),i=Math.floor(f),t=f-i,j=Math.min(N-1,i+1);pump();
  var a=bmp[fi[i]]?fi[i]:ready_(i),A=a>=0?bmp[a]:shown;if(!A)return;shown=A;
  put(A,1);var B=bmp[fi[j]];if(blend&&a===fi[i]&&B&&B!==A&&t>.02)put(B,t);cx.globalAlpha=1;feather()}
/* Плавно к нужному кадру: шаг прокрутки колесом не дёргает картинку. */
function loop(){raf=0;var dlt=want-cur;cur=Math.abs(dlt)<.0004?want:cur+dlt*.22;draw();if(cur!==want)raf=requestAnimationFrame(loop)}
function poke(){var p=progress();if(p!==want)dir=p>want?1:-1;want=p;if(!raf)raf=requestAnimationFrame(loop)}

/* Загрузка до 100%: прокрутка держится, пока не придут все файлы, но не
   дольше LIMIT. Файл, который молчит дольше WAIT, качается заново (TRY раз),
   потом пропускается: сцена возьмёт соседний. */
var boot=$('#boot'),bn=$('#boot-n'),bb=$('#boot-b'),done=0,LIMIT=30000,WAIT=15000,TRY=2;
function unlock(){if(ready)return;ready=true;root.classList.remove('lock');stage.classList.add('live');poke()}
function count(){done++;var k=done/F;if(bn)bn.textContent=Math.floor(k*100);if(bb)bb.style.transform='scaleX('+k.toFixed(3)+')';if(done===1||!ready)poke();if(done>=F)setTimeout(unlock,250)}
function get(u,left,cb){
  var ctl=window.AbortController?new AbortController():null,t=setTimeout(function(){if(ctl)ctl.abort()},WAIT);
  fetch(site.img+'/seq/'+set+'/'+files[u]+'.webp',ctl?{signal:ctl.signal}:{}).then(function(r){if(!r.ok)throw 0;return r.blob()})
    .then(function(b){clearTimeout(t);blob[u]=b;cb()},function(){clearTimeout(t);if(left>1)get(u,left-1,cb);else cb()})}
/* Видео — одним файлом с ходом загрузки; потом в <video> из памяти, чтобы
   перемотка не ждала сеть. */
function loadVid(){
  root.classList.add('lock');setTimeout(unlock,LIMIT);stage.classList.add('vid');
  var url=site.img+'/seq/m.mp4',fail=function(){if(ready&&vd.src)return;VID=false;stage.classList.remove('vid');F=files.length;done=0;load(true)};
  var show=function(k){if(bn)bn.textContent=Math.floor(k*100);if(bb)bb.style.transform='scaleX('+k.toFixed(3)+')'};
  /* Не обрываем по LIMIT: на медленной сети видео докачается после того, как
     прокрутка откроется, а начинать заново кадрами — вдвое дольше. */
  fetch(url).then(function(r){if(!r.ok)throw 0;var len=+r.headers.get('content-length')||0;
    if(!r.body||!r.body.getReader||!len)return r.blob();
    var rd=r.body.getReader(),parts=[],got=0;
    return(function pump(){return rd.read().then(function(x){if(x.done)return new Blob(parts,{type:'video/mp4'});parts.push(x.value);got+=x.value.length;show(got/len*.98);return pump()})})()})
  .then(function(b){vd.addEventListener('loadeddata',function(){show(1);vplace();
      /* iOS рисует кадры перемотки только после первого play(); в режиме
         энергосбережения play() откажет — тогда по первому касанию. */
      var prime=function(){var p=vd.play();if(p&&p.then)p.then(function(){vd.pause();poke()},function(){})};prime();
      addEventListener('touchstart',function(){if(vd.paused&&vd.currentTime===0)prime()},{once:true,passive:true});
      setTimeout(unlock,250)},{once:true});
    vd.addEventListener('seeked',function(){if(vseek>=0){var s=vseek;vseek=-1;vd.currentTime=s}});
    vd.addEventListener('error',fail,{once:true});
    vd.preload='auto';vd.src=URL.createObjectURL(b);vd.load()},fail)}
function load(again){
  if(VID&&!again){loadVid();return}
  var next=0;if(!again){root.classList.add('lock');setTimeout(unlock,LIMIT)}
  function one(){if(next>=F)return;var u=next++;get(u,TRY,function(){count();one()})}
  for(var j=0;j<6;j++)one()}

function onScroll(){headIdle();var p=progress();if(!CALM){copy(p);poke()}}
addEventListener('scroll',onScroll,{passive:true});
addEventListener('resize',function(){fit();onScroll();poke();draw()});
if(CALM){$$('.copy').forEach(function(el){show(el,1)});if(dock)dock.classList.remove('off')}
else if(cx){fit();copy(progress());load()}

/* Появление блоков ниже сцены. */
if('IntersectionObserver' in window&&!CALM){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -10% 0px'});$$('.rv').forEach(function(el){io.observe(el)})}
else $$('.rv').forEach(function(el){el.classList.add('in')});
})();
