(function(){
'use strict';
/* site: страница-презентация. Появление блоков, параллакс банок, шапка по
   правилу трёх секунд, магазин и панель в рамках (грузятся, когда видны),
   шаги пути переключают экран магазина в айфоне, калькулятор рассрочки,
   конструктор цены с отсчётом 48 часов. Прокрутку не перехватывает: всё
   пишется в transform и opacity. */
var d=document,K=JSON.parse(d.getElementById('kit-data').textContent);
var $=function(s,r){return (r||d).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))};
var REDUCED=false;try{REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}

/* Появление. */
if('IntersectionObserver' in window&&!REDUCED){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
  $$('.rv').forEach(function(el){io.observe(el)});
}else $$('.rv').forEach(function(el){el.classList.add('in')});

/* Рамки: айфон масштабируется под ширину, страница внутри грузится, когда рамка близко. */
function fit(){$$('.iph').forEach(function(p){var s=$('.iscr',p);if(s)s.style.setProperty('--k',($('.iph-in',p).clientWidth/390).toFixed(4))})}
fit();addEventListener('resize',fit);
var frames=$$('iframe[data-src]');
function load(f){if(!f.src)f.src=f.getAttribute('data-src')}
if('IntersectionObserver' in window){var fo=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){load(e.target);fo.unobserve(e.target)}})},{rootMargin:'600px 0px'});frames.forEach(function(f){fo.observe(f)})}else frames.forEach(load);

/* Шаги пути: экран магазина в айфоне меняется на нужный. */
var pf=$('#ph-path iframe');
$$('[data-go]').forEach(function(b){b.addEventListener('click',function(){
  $$('[data-go]').forEach(function(x){x.removeAttribute('aria-current')});b.setAttribute('aria-current','step');
  if(!pf)return;load(pf);var h=b.getAttribute('data-go');
  try{pf.contentWindow.location.hash=h}catch(e){pf.src=pf.getAttribute('data-src').split('#')[0]+h}
  if(innerWidth<1024)pf.closest('.pt-ph').scrollIntoView({behavior:REDUCED?'auto':'smooth',block:'center'})})});

/* Параллакс банок первого экрана: один rAF на прокрутку. */
var par=$$('[data-par]'),top=$('#top'),dock=$('#dock'),hero=$('#hero'),tick=false;
function frame(){tick=false;var h=innerHeight;
  if(!REDUCED)for(var i=0;i<par.length;i++){var el=par[i],r=el.getBoundingClientRect();if(r.bottom<-200||r.top>h+200)continue;el.style.transform='translate3d(0,'+(scrollY*-(+el.getAttribute('data-par'))).toFixed(1)+'px,0)'}
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

/* Калькулятор рассрочки. */
var cr=$('#cl-r'),cv=$('#cl-v'),cp=$('#cl-p'),cm=6;
function mo(price,m,n){return Math.ceil(price*(1+n.terms[m]/100)/m/100)*100}
function calc(){if(!cr)return;var p=+cr.value;cv.textContent=fmt(p)+' '+K.sum;
  cp.innerHTML=K.nasiya.map(function(n){var x=mo(p,cm,n);return '<li><span style="--c:'+n.c+'">'+n.n+'</span><span><b>'+fmt(x)+' '+K.sum+'</b><small>'+K.mo+', '+(n.terms[cm]?K.over+' '+fmt(x*cm-p):K.noOver)+'</small></span></li>'}).join('')}
if(cr){cr.addEventListener('input',calc);$$('.cl-m button').forEach(function(b){b.onclick=function(){cm=+b.getAttribute('data-m');$$('.cl-m button').forEach(function(x){x.setAttribute('aria-checked',x===b)});calc()}});calc()}

/* Конструктор: магазин по акции и допы тумблерами. */
var rows=$$('#konstruktor input[data-k]'),sumEl=$('#kit-sum'),addEl=$('#kit-add'),nEl=$('#kit-n'),shown=K.base,raf=0;
function roll(to){var from=shown,st=performance.now();cancelAnimationFrame(raf);if(REDUCED){shown=to;sumEl.textContent=fmt(to)+' $';return}(function f(now){var k=Math.min(1,(now-st)/500);shown=Math.round(from+(to-from)*(1-Math.pow(1-k,3)));sumEl.textContent=fmt(shown)+' $';if(k<1)raf=requestAnimationFrame(f)})(st)}
/* AI Seller: разовый код прибавляется к итогу, подписка идёт отдельной строкой в месяц. */
function aiSel(){var r=$('input[name=ais]:checked');return r?r.value:'none'}
function kit(){var add=0,n=0;rows.forEach(function(r){if(r.checked){add+=+r.getAttribute('data-p');n++}});addEl.textContent=fmt(add)+' $';nEl.textContent=n;
  var ai=aiSel(),ln=$('#kit-ai'),mo=$('#kit-month');if(ln){ln.hidden=ai==='none';$('#kit-ai-v').textContent=ai==='code'?fmt(K.ai.code.p)+' $':ai==='sub'?K.ai.sub.m+' $ '+K.perMonth:''}
  if(mo){mo.hidden=ai!=='sub';mo.textContent=K.plusMonth.replace('{n}',K.ai.sub.m)}
  roll(K.base+add+(ai==='code'?K.ai.code.p:0))}
$$('input[name=ais]').forEach(function(r){r.addEventListener('change',kit)});
rows.forEach(function(r){r.addEventListener('change',kit)});
var all=$('#kit-all');if(all)all.onclick=function(){var on=rows.some(function(r){return !r.checked});rows.forEach(function(r){r.checked=on});kit()};
var cp2=$('#kit-copy');if(cp2)cp2.onclick=function(){var lines=[K.head,'• '+K.baseName+': '+fmt(K.base)+' $'];rows.forEach(function(r){if(r.checked){var it=K.items.filter(function(x){return x.id===r.getAttribute('data-k')})[0];lines.push('• '+it.t+': '+fmt(it.p)+' $')}});var ai=aiSel();if(ai==='code')lines.push('• '+K.ai.code.t+': '+fmt(K.ai.code.p)+' $');if(ai==='sub')lines.push('• '+K.ai.sub.t+': '+K.ai.sub.m+' $ '+K.perMonth);lines.push(K.total+': '+sumEl.textContent);
  var txt=lines.join('\n');try{navigator.clipboard.writeText(txt).then(function(){cp2.textContent=K.copied})}catch(e){cp2.textContent=K.copied}};

/* Отсчёт 48 часов: с первого открытия макета на этом устройстве. Ключ
   gw-offer-2: 16.10.2026 владелец сбросил таймер, на всех устройствах
   отсчёт пошёл заново с первого открытия. */
var tm=$('#tm'),start=Date.now();try{var s=+localStorage.getItem('gw-offer-2');if(s&&s<=Date.now())start=s;else localStorage.setItem('gw-offer-2',String(start))}catch(e){}
/* Владелец, 16.10.2026: срок продлён до вторника 17:00, отсчёт до K.until. */
var end=K.until?Date.parse(K.until):start+K.hours*36e5;
function pad(n){return (n<10?'0':'')+n}
function tickT(){var left=Math.max(0,end-Date.now());if(!left){$('#timer').classList.add('over');tm.textContent='00:00:00';$('#timer span').firstChild.textContent=K.ended;return}var hh=Math.floor(left/36e5),mm=Math.floor(left%36e5/6e4),ss=Math.floor(left%6e4/1e3);tm.textContent=pad(hh)+':'+pad(mm)+':'+pad(ss);setTimeout(tickT,1000)}
if(tm)tickT();
/* Капсулы первого экрана живут видео и на телефоне: клиенты открывают макет из Telegram. При «меньше движения» и экономии трафика стоит кадр. */
var hv=$('.hv-vid');if(hv&&!REDUCED&&!(navigator.connection&&navigator.connection.saveData)){hv.src=hv.getAttribute('data-src');var hp=hv.play();if(hp&&hp.then)hp.then(function(){hv.classList.add('on')},function(){})}
})();
