(function(){
'use strict';
/* site: страница-презентация. Появление блоков, сканер по прокрутке, шапка
   по правилу трёх секунд, магазин и панель в рамках (грузятся, когда
   видны), шаги пути переключают экран магазина в айфоне, счёт по ИНН,
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

/* Сканер: луч идёт по фото вместе с прокруткой, за ним видно «изнанку»
   карточки, подписи встают, когда луч до них дошёл. Только transform. */
var sc=$('#sc-box'),tags=$$('.sc-tag'),scW=0;
function scSize(){if(sc){scW=sc.clientWidth;sc.style.setProperty('--bw',scW+'px')}}
scSize();addEventListener('resize',scSize);
function scan(h){if(!sc)return;var r=sc.getBoundingClientRect();if(r.bottom<-100||r.top>h+100)return;
  var p=REDUCED?1:Math.min(1,Math.max(0,(h*.85-r.top)/(r.height+h*.35)));sc.style.setProperty('--p',p.toFixed(4));
  tags.forEach(function(t){t.classList.toggle('on',p>=+t.getAttribute('data-at'))})}

var top=$('#top'),dock=$('#dock'),hero=$('#hero'),tick=false;
function frame(){tick=false;var h=innerHeight;scan(h);
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

/* Счёт по ИНН: реквизиты подставляются, счёт собирается сам. Организации демо. */
var inn=$('#inn'),res=$('#inn-res'),doc=$('#inn-doc');
function innRun(){if(!inn)return;var v=inn.value.replace(/\D/g,'').slice(0,12);if(inn.value!==v)inn.value=v;
  var o=K.orgs.filter(function(x){return x.inn===v})[0];
  if(!o&&(v.length===10||v.length===12))o={n:K.anyOrg,inn:v,kpp:v.length===10?v.slice(0,4)+'01001':'',a:K.anyAddr};
  if(!o){res.innerHTML='<span>'+(v.length?K.innWait.replace('{n}',10-Math.min(v.length,10)):K.innHint)+'</span>';doc.classList.remove('on');return}
  res.innerHTML='<b>'+o.n+'</b><span>'+K.innL+' '+o.inn+(o.kpp?' · '+K.kppL+' '+o.kpp:'')+'</span><span>'+o.a+'</span><span class="ok">'+K.innOk+'</span>';
  doc.classList.add('on')}
if(inn){inn.addEventListener('input',innRun);$$('[data-inn]').forEach(function(b){b.onclick=function(){inn.value=b.getAttribute('data-inn');innRun()}});innRun()}

/* Конструктор: магазин по акции и допы тумблерами. */
var rows=$$('#konstruktor input[data-k]'),sumEl=$('#kit-sum'),addEl=$('#kit-add'),nEl=$('#kit-n'),shown=K.base,raf=0;
function roll(to){var from=shown,st=performance.now();cancelAnimationFrame(raf);if(REDUCED){shown=to;sumEl.textContent=fmt(to)+' '+K.cur;return}(function f(now){var k=Math.min(1,(now-st)/500);shown=Math.round(from+(to-from)*(1-Math.pow(1-k,3)));sumEl.textContent=fmt(shown)+' '+K.cur;if(k<1)raf=requestAnimationFrame(f)})(st)}
function kit(){var add=0,n=0;rows.forEach(function(r){if(r.checked){add+=+r.getAttribute('data-p');n++}});addEl.textContent=fmt(add)+' '+K.cur;nEl.textContent=n;roll(K.base+add)}
rows.forEach(function(r){r.addEventListener('change',kit)});
var all=$('#kit-all');if(all)all.onclick=function(){var on=rows.some(function(r){return !r.checked});rows.forEach(function(r){r.checked=on});kit()};
var cp2=$('#kit-copy');if(cp2)cp2.onclick=function(){var lines=[K.head,'• '+K.baseName+': '+fmt(K.base)+' '+K.cur];rows.forEach(function(r){if(r.checked){var it=K.items.filter(function(x){return x.id===r.getAttribute('data-k')})[0];lines.push('• '+it.t+': '+fmt(it.p)+' '+K.cur)}});lines.push(K.total+': '+sumEl.textContent);
  var txt=lines.join('\n');try{navigator.clipboard.writeText(txt).then(function(){cp2.textContent=K.copied})}catch(e){cp2.textContent=K.copied}};

/* Отсчёт 48 часов: с первого открытия макета на этом устройстве. Ключ
   mk-offer-2: владелец, 16.10.2026, «скинь таймер до первого открытия»,
   старый отсчёт после рублей и скидки 30% не продолжается. */
var tm=$('#tm'),start=Date.now();try{var s=+localStorage.getItem('mk-offer-2');if(s&&s<=Date.now())start=s;else localStorage.setItem('mk-offer-2',String(start))}catch(e){}
var end=start+K.hours*36e5;
function pad(n){return (n<10?'0':'')+n}
function tickT(){var left=Math.max(0,end-Date.now());if(!left){$('#timer').classList.add('over');tm.textContent='00:00:00';$('#timer span').firstChild.textContent=K.ended;return}var hh=Math.floor(left/36e5),mm=Math.floor(left%36e5/6e4),ss=Math.floor(left%6e4/1e3);tm.textContent=pad(hh)+':'+pad(mm)+':'+pad(ss);setTimeout(tickT,1000)}
if(tm)tickT();
})();
