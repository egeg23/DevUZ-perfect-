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
var portrait=innerHeight>innerWidth,set=portrait?'m':'d',blend=!portrait;
var names=site.frames,N=names.length,img=new Array(N),ok=new Array(N),cache={};
var cur=0,want=0,raf=0,ready=false;

function fit(){if(!cv)return;var r=Math.min(devicePixelRatio||1,2),w=Math.round(stage.clientWidth*r),h=Math.round(stage.clientHeight*r);if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;box=null}}
/* Ближайший загруженный кадр — пока грузятся не все, без пустого экрана. */
function near(i){for(var s=0;s<N;s++){if(i-s>=0&&ok[i-s])return i-s;if(i+s<N&&ok[i+s])return i+s}return -1}
/* Кадр на весь экран, но узкий телефон срезал бы детали разлёта по бокам:
   режем не больше 8% ширины, сверху и снизу кадр тает в цвет зала. */
var box=null;
function place(im){var W=cv.width,H=cv.height,iw=im.naturalWidth,ih=im.naturalHeight,k=Math.min(Math.max(W/iw,H/ih),W/iw*1.08),w=iw*k,h=ih*k;box=[(W-w)/2,(H-h)/2,w,h]}
function put(i,a){var im=img[i];if(!im)return;if(!box)place(im);cx.globalAlpha=a;cx.drawImage(im,box[0],box[1],box[2],box[3])}
function feather(){var y=box[1],H=cv.height,f=Math.min(80,H*.08),g;if(y<=0)return;
  cx.fillStyle='#07080a';cx.fillRect(0,0,cv.width,y);cx.fillRect(0,H-y,cv.width,y);
  g=cx.createLinearGradient(0,y,0,y+f);g.addColorStop(0,'#07080a');g.addColorStop(1,'rgba(7,8,10,0)');cx.fillStyle=g;cx.fillRect(0,y,cv.width,f);
  g=cx.createLinearGradient(0,H-y,0,H-y-f);g.addColorStop(0,'#07080a');g.addColorStop(1,'rgba(7,8,10,0)');cx.fillStyle=g;cx.fillRect(0,H-y-f,cv.width,f)}
function draw(){if(!cx)return;var f=cur*(N-1),a=near(Math.floor(f)),b=near(Math.min(N-1,Math.ceil(f))),t=f-Math.floor(f);if(a<0)return;
  put(a,1);if(blend&&b!==a&&t>.02)put(b,t);cx.globalAlpha=1;feather()}
/* Плавно к нужному кадру: шаг прокрутки колесом не дёргает картинку. */
function loop(){raf=0;var dlt=want-cur;cur=Math.abs(dlt)<.0004?want:cur+dlt*.22;draw();if(cur!==want)raf=requestAnimationFrame(loop)}
function poke(){want=progress();if(!raf)raf=requestAnimationFrame(loop)}

/* Загрузка до 100%: прокрутка держится, пока не придут все кадры. */
var boot=$('#boot'),bn=$('#boot-n'),bb=$('#boot-b'),done=0,LIMIT=45000;
function unlock(){if(ready)return;ready=true;root.classList.remove('lock');stage.classList.add('live');poke()}
function count(){done++;var k=done/N;if(bn)bn.textContent=Math.floor(k*100);if(bb)bb.style.transform='scaleX('+k.toFixed(3)+')';if(done===1||!ready)poke();if(done>=N)setTimeout(unlock,250)}
function load(){
  var next=0;root.classList.add('lock');setTimeout(unlock,LIMIT);
  function one(){if(next>=N)return;var i=next++,n=names[i];
    if(cache[n]){wait(cache[n],i);return}
    var im=new Image();im.decoding='async';cache[n]=im;im.src=site.img+'/seq/'+set+'/'+n+'.webp';wait(im,i)}
  function wait(im,i){img[i]=im;var fin=function(good){ok[i]=good;count();one()};
    if(im.complete&&im.naturalWidth){fin(true);return}
    im.addEventListener('load',function(){fin(true)},{once:true});im.addEventListener('error',function(){fin(false)},{once:true})}
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
