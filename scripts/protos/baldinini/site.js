(function(){
'use strict';
/* site: страница-презентация магазина Baldinini Tashkent. Тихое появление
   блоков, один мягкий параллакс (фото первого экрана), шапка по правилу трёх
   секунд, магазин в айфоне и панель в окне браузера (грузятся, когда
   близко), шаги пути переключают экран магазина, конструктор цены с
   отсчётом 48 часов. Прокрутку не перехватывает: только transform и opacity. */
var d=document,K=JSON.parse(d.getElementById('kit-data').textContent);
var $=function(s,r){return (r||d).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))};
var REDUCED=false;try{REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}

/* Появление: медленно и коротко, один раз. */
if('IntersectionObserver' in window&&!REDUCED){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
  $$('.rv').forEach(function(el){io.observe(el)});
}else $$('.rv').forEach(function(el){el.classList.add('in')});

/* Айфон масштабируется под ширину; страницы в рамках грузятся, когда рядом. */
function fit(){$$('.iph').forEach(function(p){var s=$('.iscr',p);if(s)s.style.setProperty('--k',($('.iph-in',p).clientWidth/390).toFixed(4))});$$('.brw').forEach(function(b){var s=$('.brw-scr',b);if(s)s.style.setProperty('--k',Math.min(1,b.clientWidth/1280).toFixed(4))})}
fit();addEventListener('resize',fit);
var frames=$$('iframe[data-src]');
function load(f){if(!f.src)f.src=f.getAttribute('data-src')}
if('IntersectionObserver' in window){var fo=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){load(e.target);fo.unobserve(e.target)}})},{rootMargin:'600px 0px'});frames.forEach(function(f){fo.observe(f)})}else frames.forEach(load);

/* Шаги пути: экран магазина в айфоне меняется на нужный. */
var pf=$('#ph-path iframe');
$$('[data-go]').forEach(function(b){b.addEventListener('click',function(){
  $$('[data-go]').forEach(function(x){x.removeAttribute('aria-current')});b.setAttribute('aria-current','step');
  if(!pf)return;load(pf);var hh=b.getAttribute('data-go');
  try{pf.contentWindow.location.hash=hh}catch(e){pf.src=pf.getAttribute('data-src').split('#')[0]+hh}
  if(innerWidth<1024)pf.closest('.pt-ph').scrollIntoView({behavior:REDUCED?'auto':'smooth',block:'center'})})});

/* Один параллакс на странице: фото первого экрана чуть медленнее прокрутки. */
var par=$('[data-par]'),top=$('#top'),dock=$('#dock'),hero=$('#hero'),tick=false;
function frame(){tick=false;var h=innerHeight;
  if(par&&!REDUCED&&scrollY<h*1.2)par.style.transform='translate3d(0,'+(scrollY*.12).toFixed(1)+'px,0)';
  if(dock&&hero)dock.classList.toggle('on',hero.getBoundingClientRect().bottom<h*.4)}
/* Шапка (правило владельца, 15.10.2026): при любой прокрутке прячется и
   возвращается только через 3 секунды после полной остановки. Инерция
   прокрутки на телефоне тоже шлёт scroll, так что таймер ждёт её конца.
   Пока фокус с клавиатуры внутри шапки, она не прячется. */
var IDLE=3000,idleT=0;
function headIdle(){if(!top)return;clearTimeout(idleT);
  if(!top.contains(d.activeElement))top.classList.add('hide');
  idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}
function onScroll(){headIdle();if(!tick){tick=true;requestAnimationFrame(frame)}}
addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',function(){if(!tick){tick=true;requestAnimationFrame(frame)}});frame();

/* Конструктор: магазин по акции, админка одним выбором, допы тумблерами. */
var rows=$$('#konstruktor input[data-k]'),sumEl=$('#kit-sum'),addEl=$('#kit-add'),nEl=$('#kit-n'),shown=K.base,raf=0;
function roll(to){var from=shown,st=performance.now();cancelAnimationFrame(raf);if(REDUCED){shown=to;sumEl.textContent=fmt(to)+' $';return}(function f(now){var k=Math.min(1,(now-st)/500);shown=Math.round(from+(to-from)*(1-Math.pow(1-k,3)));sumEl.textContent=fmt(shown)+' $';if(k<1)raf=requestAnimationFrame(f)})(st)}
function panelSel(){var r=$('input[name=pnl]:checked');return r?r.value:'none'}
function kit(){var add=0,n=0;rows.forEach(function(r){if(r.checked){add+=+r.getAttribute('data-p');n++}});addEl.textContent=fmt(add)+' $';nEl.textContent=n;
  var pn=panelSel(),pl=$('#kit-pn');pl.hidden=pn==='none';if(pn!=='none'){$('#kit-pn-n').textContent=K.panels[pn].t;$('#kit-pn-v').textContent=fmt(K.panels[pn].p)+' $'}
  roll(K.base+add+(pn==='none'?0:K.panels[pn].p))}
$$('input[name=pnl]').forEach(function(r){r.addEventListener('change',kit)});
rows.forEach(function(r){r.addEventListener('change',kit)});
var all=$('#kit-all');if(all)all.onclick=function(){var on=rows.some(function(r){return !r.checked});rows.forEach(function(r){r.checked=on});kit()};
var cp=$('#kit-copy');if(cp)cp.onclick=function(){var lines=[K.head,'• '+K.baseName+': '+fmt(K.base)+' $'],pn=panelSel();if(pn!=='none')lines.push('• '+K.panels[pn].t+': '+fmt(K.panels[pn].p)+' $');
  rows.forEach(function(r){if(r.checked){var it=K.items.filter(function(x){return x.id===r.getAttribute('data-k')})[0];lines.push('• '+it.t+': '+fmt(it.p)+' $')}});lines.push(K.total+': '+sumEl.textContent);
  var txt=lines.join('\n');try{navigator.clipboard.writeText(txt).then(function(){cp.textContent=K.copied})}catch(e){cp.textContent=K.copied}};
kit();

/* Отсчёт 48 часов: с первого открытия макета на этом устройстве. */
var tm=$('#tm'),start=Date.now();try{var s=+localStorage.getItem('bd-offer-1');if(s&&s<=Date.now())start=s;else localStorage.setItem('bd-offer-1',String(start))}catch(e){}
var end=start+K.hours*36e5;
function pad(n){return (n<10?'0':'')+n}
function tickT(){var left=Math.max(0,end-Date.now());if(!left){$('#timer').classList.add('over');tm.textContent='00:00:00';$('#timer span').firstChild.textContent=K.ended;return}var hh=Math.floor(left/36e5),mm=Math.floor(left%36e5/6e4),ss=Math.floor(left%6e4/1e3);tm.textContent=pad(hh)+':'+pad(mm)+':'+pad(ss);setTimeout(tickT,1000)}
if(tm)tickT();
})();
