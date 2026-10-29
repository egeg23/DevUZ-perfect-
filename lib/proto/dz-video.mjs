// Промо DevUz в заставке макета: видео, одно на все макеты (public/protos/_dz).
// Правило владельца, 18.10.2026: видео — в каждом новом макете, само, без
// согласований (CLAUDE.md, «Заставка макета — видео DevUz»).
//
// Два входа:
// - DZ_VIDEO — макетам, собранным руками (scripts/protos): `${DZ_VIDEO}`
//   первым в #intro, потом прежний знак клиента;
// - dzIntroSolo(язык) — прототипам из панели (lib/proto/booking): своя
//   заставка поверх страницы, после видео сразу сайт.
//
// Первый кадр (webp) — <picture> в разметке, грузится сразу, пока видео грузится: телефону в
// портретной ориентации вертикальный, компьютеру горизонтальный. Видео без
// звука, 1.2x, чтобы промо уложилось в ~4 с.
//
// dzVideo(box, go) зовёт intro.js макета вместо requestAnimationFrame:
// go(true) после видео (дальше знак клиента), go(false) — запасной путь,
// прежнее промо кодом: prefers-reduced-motion, saveData, play() отклонён,
// ошибка, или видео не заиграло: 2,5 с без новых данных или 4,5 с всего (до
// того стоит первый кадр). Видео встало посреди — к знаку.
// Возвращает { on(), end() }: нажатие во время видео ведёт к знаку.
//
// В разметке, которая уходит клиенту, нет комментариев и слов, по которым
// ищут отпечаток: только классы dz-vid, dz-v, dz-v-out, dz-code-on.

const SRC = "/protos/_dz/dz-intro-";

// Сколько ждём, пока видео заиграет (первый кадр всё это время на экране):
// не дольше WAIT_MAX, и не дольше WAIT_IDLE без новых данных из сети. Видео
// грузится — ждём; не грузится — запасной путь. Владелец, 19.10.2026: на
// Baldinini с iPhone вместо видео вышло промо кодом.
const WAIT_MAX = 4500;
const WAIT_IDLE = 2500;
// Телефон не дал видео запуститься самому (iPhone в энергосбережении):
// стоит первый кадр, первое нажатие запускает видео. Не нажали за HELD_MAX —
// запасной путь.
const HELD_MAX = 3000;

const VID_CSS = `.dz-vid{position:absolute;inset:0;z-index:9;background:#05070b;transition:opacity .35s ease;pointer-events:none}
.dz-vid img,.dz-vid video{position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:cover}
.dz-vid img{z-index:1;transition:opacity .2s linear}
.dz-vid.on img{opacity:0}`;

const CSS = `${VID_CSS}
.intro.dz-v .in-skip{z-index:10}
.intro.dz-v .dz-grid,.intro.dz-v .dz-glow,.intro.dz-v .dz-ring,.intro.dz-v .dz-flash,.intro.dz-v .dz-stage,.intro.dz-v .dz-code{display:none}
.intro.dz-v-out .dz-vid{opacity:0}
.intro.dz-code-on .dz-vid,.intro-off .dz-vid{display:none}`;

const JS = `function dzStart(box){
if(box.dzS)return box.dzS;
var w=box.querySelector('.dz-vid'),v=w&&w.querySelector('video'),S={k:0,res:false,go:0,fin:false,played:false},timers=[],seen=-1,still=0,t0=Date.now(),fed=t0;
box.dzS=S;
function clear(){for(var i=0;i<timers.length;i++){clearTimeout(timers[i]);clearInterval(timers[i])}timers=[]}
function done(r){S.k=1;S.res=r;if(S.go)S.go(r)}
function code(){if(S.fin)return;S.fin=true;clear();box.classList.remove('dz-v');box.classList.add('dz-code-on');if(v){try{v.pause();v.removeAttribute('src');v.load()}catch(e){}}done(false)}
function end(){if(S.fin)return;S.fin=true;clear();box.classList.add('dz-v-out');setTimeout(function(){try{v.pause()}catch(e){}},400);done(true)}
S.on=function(){return!S.fin};S.end=function(){if(S.played)end();else if(S.held){S.held=false;clear();watch();go()}else code()};
var off=!v||typeof v.play!=='function';
try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)off=true}catch(e){}
try{var c=navigator.connection;if(c&&c.saveData)off=true}catch(e){}
if(off){code();return S}
box.classList.add('dz-v');
var tall=false;try{tall=matchMedia('(orientation: portrait)').matches}catch(e){}
v.muted=true;v.defaultMuted=true;v.playsInline=true;
v.addEventListener('playing',function(){if(S.fin||S.played)return;S.played=true;w.classList.add('on');box.style.setProperty('--in-skip','1');timers.push(setTimeout(end,6000))});
v.addEventListener('progress',function(){fed=Date.now()});
v.addEventListener('ended',function(){S.played?end():code()});
v.addEventListener('error',function(){S.played?end():code()});
v.addEventListener('timeupdate',function(){if(S.played&&v.duration&&v.currentTime>=v.duration-.25)end()});
v.src='${SRC}'+(tall?'9':'16')+'.mp4';
v.defaultPlaybackRate=1.2;v.playbackRate=1.2;
timers.push(setTimeout(function(){box.style.setProperty('--in-skip','1')},600));
function watch(){t0=fed=Date.now();timers.push(setInterval(function(){var now=Date.now();if(!S.played){if(now-t0>=${WAIT_MAX}||(now-t0>=${WAIT_IDLE}&&now-fed>=${WAIT_IDLE}))code();return}var n=v.currentTime;if(n===seen){if((still+=250)>=1500)end()}else{seen=n;still=0}},250))}
watch();
function go(){try{var p=v.play();if(p&&p.catch)p.catch(function(e){if(S.played||S.fin)return;if(e&&e.name==='NotAllowedError'&&!S.asked){S.asked=true;S.held=true;clear();box.style.setProperty('--in-skip','1');timers.push(setTimeout(function(){if(S.held)code()},${HELD_MAX}))}else code()})}catch(e){code()}}
go();
return S}
function dzVideo(box,go){var S=dzStart(box);S.go=go;if(S.k)go(S.res);return{on:S.on,end:S.end}}`;

// Заставка со знаком клиента: видео запускается сразу, как только разметка
// разобрана, а не когда дойдёт до intro.js в конце страницы. На тяжёлой
// странице (Baldinini) это секунды: iPhone не грузит видео до play().
const EARLY = `(function(){var s=document.currentScript,b=s&&s.parentNode;if(b&&!document.documentElement.classList.contains('intro-off'))dzStart(b)})()`;

const VID = `<div class="dz-vid" aria-hidden="true"><picture><source media="(orientation: portrait)" srcset="${SRC}9.webp"><img src="${SRC}16.webp" alt="" fetchpriority="high"></picture><video muted playsinline disablepictureinpicture preload="auto"></video></div>`;

export const DZ_VIDEO = `${VID}
<style>${CSS}</style>
<script>${JS}
${EARLY}</script>`;

// Прототип из панели: заставки со знаком клиента там нет, поэтому видео
// идёт поверх страницы само по себе и потом уходит. Запасного промо кодом
// нет: reduced motion, экономия трафика, видео не заиграло (WAIT_IDLE/WAIT_MAX), уже
// видел за этот визит — сразу сайт. Прокрутку не слушает (проверка
// прототипа, lib/proto/check, «hijack»): нажатие, «Пропустить», Esc.
const SKIP = { ru: "Пропустить", uz: "O‘tkazib yuborish", en: "Skip", pl: "Pomiń" };

const SOLO_CSS = `.dzi{position:fixed;inset:0;z-index:2147483000;background:#05070b;cursor:pointer;transition:opacity .4s ease}
.dzi.done{opacity:0;pointer-events:none}
.dzi-skip{position:absolute;right:16px;bottom:calc(16px + env(safe-area-inset-bottom));z-index:10;padding:8px 16px;min-height:44px;border:1px solid rgb(234 240 247 / .24);border-radius:999px;font:500 12px/1 system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:rgb(234 240 247 / .78);background:rgb(17 18 21 / .4);cursor:pointer;opacity:var(--in-skip,0);transition:opacity .3s}
@media (prefers-reduced-motion:reduce){.dzi{display:none}}`;

const SOLO_JS = `(function(){var b=document.getElementById('dzi');if(!b)return;var done=false;
function close(){if(done)return;done=true;b.classList.add('done');setTimeout(function(){if(b.parentNode)b.parentNode.removeChild(b)},450)}
var seen=false;try{seen=!!sessionStorage.getItem('dz-intro');sessionStorage.setItem('dz-intro','1')}catch(e){}
if(seen||typeof dzVideo!=='function'){b.parentNode.removeChild(b);return}
b.addEventListener('click',function(e){var S=b.dzS;if(S&&S.held&&!(e.target&&e.target.className==='dzi-skip')){S.end();return}close()});document.addEventListener('keydown',function(e){if(e.key==='Escape')close()});
setTimeout(close,9000);
dzVideo(b,close);
})()`;

/** Заставка DevUz для прототипа из панели: первой строкой в <body>. */
export function dzIntroSolo(locale) {
  return `<div class="dzi" id="dzi" role="presentation">${VID}<button type="button" class="dzi-skip">${SKIP[locale] ?? SKIP.ru}</button></div>
<style>${VID_CSS}
${SOLO_CSS}</style>
<script>${JS}</script>
<script>${SOLO_JS}</script>`;
}

/**
 * Макет, собранный до правила (прототип из панели в базе, старая сборка), —
 * видео подставляется при отдаче (lib/proto/store, protoPage). Владелец,
 * 19.10.2026: «На все бывшие и будущие макеты накинь его». Уже есть — не
 * трогаем; не страница (манифест, воркер) — тоже.
 */
export function withDzIntro(html) {
  if (html.includes('class="dz-vid"')) return html;
  const body = /<body[^>]*>/i.exec(html);
  if (!body) return html;
  const lang = (/<html[^>]*\slang="([a-z]{2})/i.exec(html)?.[1] ?? "ru").toLowerCase();
  const at = body.index + body[0].length;
  return `${html.slice(0, at)}\n${dzIntroSolo(lang)}${html.slice(at)}`;
}
