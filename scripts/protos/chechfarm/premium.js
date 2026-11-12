(function(){
'use strict';
/* premium: сцена первого экрана, стеклянные блоки, глобус, аудитории,
   стоимость. Прокрутку только читает: ни scrollTo, ни preventDefault на
   колесе. */
var d=document,W=window,root=d.documentElement,K=JSON.parse(d.getElementById('cf-data').textContent);
var $=function(s,r){return (r||d).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))};
var REDUCED=root.classList.contains('rm');
function pad(n){return (n<10?'0':'')+n}
function cl(x){return x<0?0:x>1?1:x}
function lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function inView(el,cb){if(!('IntersectionObserver' in W)){cb(true);return}new IntersectionObserver(function(es){cb(es[0].isIntersecting)},{threshold:.25}).observe(el)}

/* ── Сцена первого экрана: путь препарата по прокрутке ────────────────
   Завод → пустая баночка падает в цех → наполняется таблетками → фирменная
   коробка → полёт над трассой «от лица коробки» → полка аптеки с именем
   бренда (владелец, 12.11.2026). Пять роликов между шестью ключевыми
   кадрами; кадры (компьютеру 16:9, телефону 9:16) зашифрованы пачками, ключ
   по ссылке сайта. На ключевых кадрах прокрутка «стоит» (HOLD), чтобы
   прочитать подпись. Пока кадры не пришли, без ключа и при экономии
   трафика — те же шесть ключевых кадров плавной сменой. Прокрутку только
   читаем. Распакованных кадров не больше MAXB. */
var hs=$('.hs');
if(hs){
  var posters=$$('.hs-p',hs),caps=$$('.hs-cap',hs),intro=$('.hs-intro',hs),dots=$$('.hs-steps i',hs),words=$$('h1 .w>span',hs);
  var NK=posters.length-1,want=0,cur=-1,raf=0;
  function sm(t){t=cl(t);return t*t*(3-2*t)}
  function prog(){var r=hs.getBoundingClientRect(),span=r.height-innerHeight;return span>0?cl(-r.top/span):0}
  /* Подписи и точки стоят у своих ключевых кадров: ролики равной длины,
     ключевой кадр j на доле j/NK. Постеры меняются всегда, и под живой
     сценой тоже: если кадры на телефоне не нарисовались, видна плавная
     смена постеров, а не застывшая смесь двух (владелец, 13.11.2026). */
  function paint(p){
    var u=cl(p)*NK,a,i;
    a=1-sm((u-.1)/.3);intro.style.opacity=a.toFixed(3);intro.style.transform='translateY('+((a-1)*28).toFixed(1)+'px)';intro.classList.toggle('off',a<.4);
    for(i=0;i<words.length;i++)words[i].style.setProperty('--u',cl((u-i*.05)/.08).toFixed(3));
    caps.forEach(function(el,j){var c=j+2,last=j===caps.length-1,x=sm((u-(c-.42))/.22)*(last?1:1-sm((u-(c+.2))/.22));
      el.style.opacity=x.toFixed(3);el.style.transform='translateY('+((1-x)*26).toFixed(1)+'px)';el.classList.toggle('on',x>.5)});
    dots.forEach(function(dn,j){dn.classList.toggle('on',u>=(j===0?0:j+1)-.01)});
    var s=Math.min(NK-1,Math.floor(u)),t=sm(u-s);
    posters.forEach(function(pp,j){pp.style.opacity=j<=s?'1':j===s+1?t.toFixed(3):'0'})}
  function loop(){raf=0;var dl=want-cur;cur=cur<0||Math.abs(dl)<.0002?want:cur+dl*.12;paint(cur);if(cur!==want)raf=requestAnimationFrame(loop)}
  /* Пока шапка над тёмной сценой (владелец, 12.11.2026, на телефоне: «белые
     штуки мелькают при скролле»): шапка тёмным стеклом, цвет строки браузера
     тёмный. Светлая капсула и светлая строка мигали поверх сцены. */
  var tc=$('meta[name="theme-color"]'),dark=null;
  function tone(){var on=hs.getBoundingClientRect().bottom>72;if(on===dark)return;dark=on;root.classList.toggle('on-dark',on);if(tc)tc.setAttribute('content',on?'#071a18':'#f5f3ee')}
  function poke(){tone();want=prog();if(!raf)raf=requestAnimationFrame(loop)}
  tone();addEventListener('scroll',tone,{passive:true});
  /* Высота сцены — в пикселях от первой высоты окна, заново только при
     повороте. Во встроенном браузере Telegram панель выезжает при смене
     направления прокрутки, vh пересчитывается, и 1000vh сдвигали всю
     страницу на сотни точек (владелец, 13.11.2026: «когда я начинаю
     скролить в другую сторону, скачет»). */
  var hsK=0,hsW=0;
  function hsFix(){if(innerWidth===hsW)return;hsW=innerWidth;hs.style.height='';hsK=hsK||hs.offsetHeight/innerHeight;hs.style.height=Math.round(hsK*innerHeight)+'px'}
  if(!REDUCED){hsFix();addEventListener('resize',hsFix)}
  if(REDUCED)$('#hs-load').classList.add('ok');
  else{addEventListener('scroll',poke,{passive:true});addEventListener('resize',poke);poke()}
}
/* Сами кадры и видео: движок пролёта Nek и салона красоты как есть
   (nek/land.js, вставляет gen.mjs). Свой движок на телефоне владельца трижды
   не завёлся: «возьми за основу как для салона красоты и повтори функции». */
__NEK_SCENE__;

/* ── Стеклянные блоки: огонь бежит от первого к седьмому ──────────── */
var gb=$('.gb');
if(gb){
  var bs=$$('.gb-b',gb),card=$('.gb-card'),gi=0,gRun=!REDUCED,gT=0,gVis=false;
  function gSet(i){gi=i;bs.forEach(function(b,j){b.classList.toggle('on',j<=i);b.classList.toggle('cur',j===i)});var c=K.chain[i];$('.no',card).textContent=pad(i+1)+' / '+pad(bs.length);$('h3',card).textContent=c[0];$('.ds',card).textContent=c[1]}
  function gTick(){if(gRun&&gVis&&!d.hidden)gSet(gi>=bs.length-1?0:gi+1)}
  bs.forEach(function(b,j){b.addEventListener('click',function(){gRun=false;gSet(j)})});
  gSet(REDUCED?bs.length-1:0);inView(gb,function(v){gVis=v});gT=setInterval(gTick,1300);
}

/* ── Глобус: точки бегут по маршрутам к знаку ─────────────────────── */
var gl=$('.gl');
if(gl){
  var rs=$$('.gl-r',gl),gc=$('.gl-card'),glVis=false,t0=0,rr=0;
  function glSet(i){rs.forEach(function(r,j){r.classList.toggle('cur',j===i)});var s=K.steps[i];$('.no',gc).textContent=pad(i+1)+' / '+pad(rs.length);$('h3',gc).textContent=s[0];$('.ds',gc).textContent=s[1]}
  rs.forEach(function(r,i){function pick(){glSet(i)}r.addEventListener('mouseenter',pick);r.addEventListener('click',pick);r.addEventListener('focus',pick);r.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();pick()}})});
  function glLoop(now){rr=0;if(!glVis)return;if(!t0)t0=now;rs.forEach(function(r,i){var p=$('.gl-p',r),L=p.getTotalLength(),k=((now-t0)/2600+i*.21)%1,pt=p.getPointAtLength(L*k);$('.gl-dot',r).setAttribute('transform','translate('+pt.x.toFixed(1)+' '+pt.y.toFixed(1)+')')});rr=requestAnimationFrame(glLoop)}
  glSet(0);
  if(!REDUCED)inView(gl,function(v){glVis=v;if(v&&!rr)rr=requestAnimationFrame(glLoop)});
}

/* ── Главная под аудиторию: выбор меняет кнопку первого экрана ────── */
var as=$('.as');
if(as){
  var tabs=$$('[role="tab"]',as),cta=$('#hero-cta');
  function aSet(id,save){tabs.forEach(function(b){var on=b.getAttribute('data-a')===id;b.setAttribute('aria-selected',on?'true':'false');b.tabIndex=on?0:-1;$('#as-p-'+b.getAttribute('data-a')).hidden=!on});
    var c=K.aud[id];if(cta&&c){cta.setAttribute('href',c.h);$('span',cta).textContent=c.t}if(save)lsSet('cf-aud',id)}
  tabs.forEach(function(b,i){b.addEventListener('click',function(){aSet(b.getAttribute('data-a'),true)});
    b.addEventListener('keydown',function(e){var k=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;if(!k)return;e.preventDefault();var n=tabs[(i+k+tabs.length)%tabs.length];n.focus();aSet(n.getAttribute('data-a'),true)})});
  var saved=lsGet('cf-aud');if(saved&&K.aud[saved])aSet(saved,false);
}

/* ── Стоимость: основа по акции, допы за половину, отсчёт 48 часов ─── */
var kitEl=$('#kit');
if(kitEl){
  var O=K.offer,rows=$$('input[data-k]',kitEl),sumEl=$('#kit-sum'),shown=O.base,rollT=0;
  function usd(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')+' $'}
  function roll(to){cancelAnimationFrame(rollT);if(REDUCED){shown=to;sumEl.textContent=usd(to);return}var from=shown,t0=performance.now();
    (function f(now){var k=Math.min(1,(now-t0)/450),e=1-Math.pow(1-k,3);shown=from+(to-from)*e;sumEl.textContent=usd(shown);if(k<1)rollT=requestAnimationFrame(f)})(t0)}
  function kit(){var add=0,full=0,c=0;rows.forEach(function(r){if(r.checked){var it=O.items.filter(function(x){return x.id===r.getAttribute('data-k')})[0];add+=it.p;full+=it.f;c++}});
    $('#kit-add').textContent=usd(add);$('#kit-cnt').textContent=c;$('#kit-save').textContent=usd(full-add);roll(O.base+add)}
  rows.forEach(function(r){r.addEventListener('change',kit)});
  $('#kit-all').addEventListener('click',function(){rows.forEach(function(r){r.checked=true});kit()});
  $('#kit-copy').addEventListener('click',function(){var lines=[O.head,'- '+O.baseName+': '+usd(O.base)];rows.forEach(function(r){if(r.checked){var it=O.items.filter(function(x){return x.id===r.getAttribute('data-k')})[0];lines.push('- '+it.t+': '+usd(it.p))}});lines.push(O.totalW+': '+sumEl.textContent);
    try{navigator.clipboard.writeText(lines.join('\n'))}catch(e){}var tt=$('#toast');tt.textContent=O.copied;tt.hidden=false;setTimeout(function(){tt.hidden=true},2400)});
  kit();
  var tm=$('#tm'),start=Date.now(),s0=+lsGet('cf-offer-1');if(s0&&s0<=Date.now())start=s0;else lsSet('cf-offer-1',String(start));
  var end=start+O.hours*36e5;
  function tick(){var left=Math.max(0,end-Date.now());if(!left){$('#timer').classList.add('over');tm.textContent='00:00:00';$('#timer span').firstChild.textContent=O.ended;return}
    var s=Math.floor(left/1e3);tm.textContent=pad(Math.floor(s/3600))+':'+pad(Math.floor(s%3600/60))+':'+pad(s%60);setTimeout(tick,1000)}
  tick();
}
})();
