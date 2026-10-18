// Промо DevUz в заставке макета: видео, одно на все макеты (public/protos/_dz).
// Вставляется в начало #intro каждого макета: `${DZ_VIDEO}` в introHtml.
//
// Первый кадр (webp) — <picture> в разметке, грузится сразу, пока видео грузится: телефону в
// портретной ориентации вертикальный, компьютеру горизонтальный. Видео без
// звука, 1.2x, чтобы промо уложилось в ~4 с.
//
// dzVideo(box, go) зовёт intro.js макета вместо requestAnimationFrame:
// go(true) после видео (дальше знак клиента), go(false) — запасной путь,
// прежнее промо кодом: prefers-reduced-motion, saveData, play() отклонён,
// ошибка, или видео не заиграло за 1,2 с. Видео встало посреди — к знаку.
// Возвращает { on(), end() }: нажатие во время видео ведёт к знаку.
//
// В разметке, которая уходит клиенту, нет комментариев и слов, по которым
// ищут отпечаток: только классы dz-vid, dz-v, dz-v-out, dz-code-on.

const SRC = "/protos/_dz/dz-intro-";

const CSS = `.dz-vid{position:absolute;inset:0;z-index:9;background:#05070b;transition:opacity .35s ease;pointer-events:none}
.dz-vid img,.dz-vid video{position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:cover}
.dz-vid video{opacity:0;transition:opacity .2s linear}
.dz-vid.on video{opacity:1}
.intro.dz-v .in-skip{z-index:10}
.intro.dz-v .dz-grid,.intro.dz-v .dz-glow,.intro.dz-v .dz-ring,.intro.dz-v .dz-flash,.intro.dz-v .dz-stage,.intro.dz-v .dz-code{display:none}
.intro.dz-v-out .dz-vid{opacity:0}
.intro.dz-code-on .dz-vid,.intro-off .dz-vid{display:none}`;

const JS = `function dzVideo(box,go){
var w=box.querySelector('.dz-vid'),v=w&&w.querySelector('video'),fin=false,played=false,timers=[],seen=-1,still=0;
function clear(){for(var i=0;i<timers.length;i++){clearTimeout(timers[i]);clearInterval(timers[i])}timers=[]}
function code(){if(fin)return;fin=true;clear();box.classList.remove('dz-v');box.classList.add('dz-code-on');if(v){try{v.pause();v.removeAttribute('src');v.load()}catch(e){}}go(false)}
function end(){if(fin)return;fin=true;clear();box.classList.add('dz-v-out');setTimeout(function(){try{v.pause()}catch(e){}},400);go(true)}
var api={on:function(){return!fin},end:function(){played?end():code()}};
var off=!v||typeof v.play!=='function';
try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)off=true}catch(e){}
try{var c=navigator.connection;if(c&&c.saveData)off=true}catch(e){}
if(off){code();return api}
box.classList.add('dz-v');
var tall=false;try{tall=matchMedia('(orientation: portrait)').matches}catch(e){}
v.muted=true;v.defaultMuted=true;v.playsInline=true;
v.addEventListener('playing',function(){if(fin)return;played=true;w.classList.add('on');box.style.setProperty('--in-skip','1')});
v.addEventListener('ended',function(){played?end():code()});
v.addEventListener('error',function(){played?end():code()});
v.addEventListener('timeupdate',function(){if(played&&v.duration&&v.currentTime>=v.duration-.25)end()});
v.src='${SRC}'+(tall?'9':'16')+'.mp4';
v.defaultPlaybackRate=1.2;v.playbackRate=1.2;
timers.push(setTimeout(function(){if(!played)code()},1200));
timers.push(setTimeout(function(){box.style.setProperty('--in-skip','1')},600));
timers.push(setTimeout(end,7000));
timers.push(setInterval(function(){if(!played)return;var n=v.currentTime;if(n===seen){if((still+=250)>=1500)end()}else{seen=n;still=0}},250));
try{var p=v.play();if(p&&p.catch)p.catch(function(){if(!played)code()})}catch(e){code()}
return api}`;

export const DZ_VIDEO = `<div class="dz-vid" aria-hidden="true"><picture><source media="(orientation: portrait)" srcset="${SRC}9.webp"><img src="${SRC}16.webp" alt="" fetchpriority="high"></picture><video muted playsinline disablepictureinpicture preload="auto"></video></div>
<style>${CSS}</style>
<script>${JS}</script>`;
