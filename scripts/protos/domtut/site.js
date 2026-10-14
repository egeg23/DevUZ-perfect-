(function(){
'use strict';
/* Сайт DomTut, макет. Прокрутку не перехватываем: всё движение считается от
   того, где блок на экране, и рисуется transform и opacity. */
var d=document,root=d.documentElement;
var REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches;
var $=function(s,r){return (r||d).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))};
var grp=function(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')};

/* Первый экран: если заставки нет, он оживает сразу. */
if(!d.getElementById('intro')||root.classList.contains('intro-off'))$('#hero').classList.add('hero-on');

/* ── Цвет страницы между блоками ── */
var tones={};$$('.bgfx i').forEach(function(i){tones[i.getAttribute('data-tone')]=i});
var cur='';
function tone(t){if(t===cur||!tones[t])return;if(tones[cur])tones[cur].classList.remove('on');tones[t].classList.add('on');cur=t}
tone('sky');
var secs=$$('main>section[data-tone],footer[data-tone]');

/* ── Появление блоков ── */
if('IntersectionObserver' in window&&!REDUCED){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -10% 0px'});
  $$('.rv').forEach(function(el){io.observe(el)});
}else $$('.rv').forEach(function(el){el.classList.add('in')});

/* ── Прокрутка: параллакс, шапка, смена цвета, лента ЖК — одним кадром ── */
var par=$$('[data-par]'),top=$('#top'),dock=$('#dock'),lastY=scrollY,tick=false;
function frame(){
  tick=false;
  var y=scrollY,h=innerHeight;
  if(!REDUCED)for(var i=0;i<par.length;i++){var el=par[i],r=el.parentNode.getBoundingClientRect();if(r.bottom<-200||r.top>h+200)continue;var k=+el.getAttribute('data-par');el.style.transform='translate3d(0,'+((r.top+r.height/2-h/2)*-k).toFixed(1)+'px,0)'}
  if(top){top.classList.toggle('hide',y>lastY+4&&y>320);if(y<lastY-4)top.classList.remove('hide')}
  lastY=y;
  for(var j=secs.length-1;j>=0;j--){var b=secs[j].getBoundingClientRect();if(b.top<h*.5){tone(secs[j].getAttribute('data-tone'));break}}
  if(j<0)tone('sky');
}
addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(frame)}},{passive:true});
addEventListener('resize',function(){requestAnimationFrame(frame)});
frame();

/* ── Счётчики набегают при появлении — по мотивам Number Ticker (Magic UI, MIT) ── */
function count(el){
  var to=+el.getAttribute('data-count'),plain=el.hasAttribute('data-plain'),t0=0;
  if(REDUCED){return}
  var from=plain?to-7:0;
  function f(now){if(!t0)t0=now;var k=Math.min((now-t0)/1400,1),e=1-Math.pow(1-k,3),v=from+(to-from)*e;el.textContent=plain?Math.round(v):grp(v);if(k<1)requestAnimationFrame(f)}
  requestAnimationFrame(f);
}
if('IntersectionObserver' in window){var co=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){count(e.target);co.unobserve(e.target)}})});$$('[data-count]').forEach(function(el){co.observe(el)})}

/* ── Путь покупателя: какой шаг посередине экрана, тот и на телефоне ── */
var steps=$$('.st-step'),screens=$$('.ps'),dots=$$('.st-dots i');
function step(n){steps.forEach(function(s,i){s.classList.toggle('on',i===n)});screens.forEach(function(s,i){s.classList.toggle('on',i===n)});dots.forEach(function(s,i){s.classList.toggle('on',i===n)})}
step(0);
if('IntersectionObserver' in window){var so=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)step(+e.target.getAttribute('data-step'))})},{rootMargin:'-45% 0px -45% 0px'});steps.forEach(function(s){so.observe(s)})}

/* ── Пятно света за курсором у карточек бенто — по мотивам Magic Card (Magic UI, MIT) ── */
$$('.spot').forEach(function(c){c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px')})});

/* ── Лента ЖК: картинка внутри карточки едет медленнее карточки ── */
var rail=$('#zk-rail');
if(rail){
  var rt=false,cards=$$('.zk',rail);
  var rp=function(){rt=false;if(REDUCED)return;var w=innerWidth;cards.forEach(function(c){var r=c.getBoundingClientRect();if(r.right<0||r.left>w)return;var k=(r.left+r.width/2-w/2)/w;c.style.setProperty('--px',(k*-28).toFixed(1)+'px')})};
  rail.addEventListener('scroll',function(){if(!rt){rt=true;requestAnimationFrame(rp)}},{passive:true});rp();
  $$('[data-rail]').forEach(function(b){b.addEventListener('click',function(){rail.scrollBy({left:+b.getAttribute('data-rail')*Math.min(rail.clientWidth*.8,760),behavior:REDUCED?'auto':'smooth'})})});
}

/* ── Цены по районам ── */
var sd=$('#stx-data');
if(sd){
  var ST=JSON.parse(sd.textContent),stTabs=$$('[data-st]');
  var showSt=function(i){
    var s=ST[i],mr=Math.max.apply(null,ST.map(function(x){return Math.max.apply(null,x.rooms)})),mm=0;
    ['comfort','business','premium','resale'].forEach(function(k){if(s.m2[k]>mm)mm=s.m2[k]});
    stTabs.forEach(function(b,j){b.classList.toggle('on',j===i);b.setAttribute('aria-selected',j===i)});
    s.rooms.forEach(function(p,j){$('[data-r="'+j+'"]').textContent=grp(p)+' $';$('[data-rb="'+j+'"]').style.setProperty('--w',(p/mr).toFixed(3))});
    ['comfort','business','premium','resale'].forEach(function(k){$('[data-m="'+k+'"]').textContent=grp(s.m2[k])+' $';$('[data-mb="'+k+'"]').style.setProperty('--w',(s.m2[k]/mm).toFixed(3))});
  };
  stTabs.forEach(function(b){b.addEventListener('click',function(){showSt(+b.getAttribute('data-st'))})});
  showSt(1);
}

/* ── Приложение в айфоне ── */
var dev=$('#ap-dev'),iph=$('#iph'),frameEl=$('#app-frame'),loaded=false,queue=null;
var narrow=matchMedia('(max-width: 999px)');
/* На телефоне нарисованный айфон повторяет пропорции экрана того, кто смотрит. */
function aspect(){if(!iph)return;if(narrow.matches){var a=Math.min(Math.max(innerWidth/innerHeight,.42),.62);iph.style.setProperty('--ar',a.toFixed(4))}else iph.style.removeProperty('--ar')}
aspect();addEventListener('resize',aspect);
function load(){if(!frameEl||frameEl.src)return;frameEl.src=frameEl.getAttribute('data-src')}
if(frameEl){
  frameEl.addEventListener('load',function(){loaded=true;if(queue){send(queue);queue=null}});
  if('IntersectionObserver' in window){var fo=new IntersectionObserver(function(es){if(es[0].isIntersecting){load();fo.disconnect()}},{rootMargin:'800px 0px'});fo.observe(frameEl)}else load();
}
function send(msg){if(!frameEl)return;if(!loaded){queue=msg;load();return}try{frameEl.contentWindow.postMessage(msg,location.origin)}catch(e){}}
function toApp(msg){var s=$('#prilozhenie');if(s)s.scrollIntoView({behavior:REDUCED?'auto':'smooth',block:'start'});send(msg)}
$$('[data-jump]').forEach(function(b){b.addEventListener('click',function(e){e.preventDefault();toApp({dt:'jump',to:b.getAttribute('data-jump')})})});
$$('[data-zk]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();toApp({dt:'jump',to:'zkid',id:a.getAttribute('data-zk')})})});

/* Нижняя плашка не закрывает айфон, пока он на экране. */
if(dock&&dev&&'IntersectionObserver' in window){new IntersectionObserver(function(es){dock.classList.toggle('hide',es[0].isIntersecting)},{threshold:.35}).observe(dev)}

/* Поиск на первом экране ведёт в приложение с теми же фильтрами. */
var find=$('#find');
if(find){
  $$('.f-tabs button',find).forEach(function(b){b.addEventListener('click',function(){$$('.f-tabs button',find).forEach(function(x){x.classList.toggle('on',x===b)})})});
  find.addEventListener('submit',function(e){e.preventDefault();var f=new FormData(find);toApp({dt:'jump',to:'find',rooms:+f.get('rooms'),district:f.get('district'),max:+f.get('max')})});
}

/* «Во весь экран»: на телефоне — приложение на весь экран по ссылке, на ПК —
   тот же айфон поверх страницы во всю высоту окна (окно не перезагружается). */
var full=$('#ap-full'),fx=$('#iph-x');
function close(){if(!dev)return;dev.classList.remove('full');root.classList.remove('full-on')}
if(full)full.addEventListener('click',function(e){
  if(narrow.matches||matchMedia('(pointer: coarse) and (max-width: 1100px)').matches)return;
  e.preventDefault();load();dev.classList.add('full');root.classList.add('full-on');
});
if(fx)fx.addEventListener('click',close);
if(dev)dev.addEventListener('click',function(e){if(e.target===dev)close()});
addEventListener('keydown',function(e){if(e.key==='Escape')close()});

/* ── Конструктор и 48 часов ── */
var K=JSON.parse($('#kit-data').textContent),KEY='dt-kit-1',OKEY='dt-offer-1';
var sel={};try{sel=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
var start=0;try{start=+localStorage.getItem(OKEY)||0}catch(e){}
if(!start){start=Date.now();try{localStorage.setItem(OKEY,String(start))}catch(e){}}
var END=start+48*3600*1000;
function left(){return END-Date.now()}
var boxes=$$('#konstruktor input[type=checkbox]');
boxes.forEach(function(b){b.checked=!!sel[b.getAttribute('data-k')];b.addEventListener('change',function(){sel[b.getAttribute('data-k')]=b.checked;try{localStorage.setItem(KEY,JSON.stringify(sel))}catch(e){}sum()})});
var shown=0;
function sum(){
  var add=0,n=0,live=left()>0;
  boxes.forEach(function(b){if(b.checked){add+=+b.getAttribute('data-p');n++}});
  var total=(live?K.promo:K.base)+add;
  $('#kit-n').textContent=n;$('#kit-add').textContent=grp(add)+' $';
  $('#kit-was').textContent=grp(K.base+add)+' $';
  roll($('#kit-sum'),shown,total);shown=total;
  var ds=$('#dock-sum');if(ds)ds.textContent=grp(total)+' $';
}
function roll(el,a,b){if(REDUCED||a===b||!a){el.textContent=grp(b)+' $';return}var t0=0;function f(now){if(!t0)t0=now;var k=Math.min((now-t0)/500,1),e=1-Math.pow(1-k,3);el.textContent=grp(a+(b-a)*e)+' $';if(k<1)requestAnimationFrame(f)}requestAnimationFrame(f)}
sum();
var tm=$('#tm'),tb=$('#timer');
function pad(n){return (n<10?'0':'')+n}
function clock(){
  var ms=left();
  if(ms<=0){tb.classList.add('over');tb.firstChild.textContent=K.ended;tm.textContent='';sum();return}
  var s=Math.floor(ms/1000),h=Math.floor(s/3600),m=Math.floor(s%3600/60);
  tm.textContent=pad(h)+':'+pad(m)+':'+pad(s%60);
  setTimeout(clock,1000-(Date.now()%1000));
}
clock();
$('#kit-copy').addEventListener('click',function(){
  var lines=[K.head,'• '+K.baseName+': '+grp(K.promo)+' $ ('+grp(K.base)+' $)'];
  K.items.forEach(function(a){if(sel[a.id])lines.push('• '+a.t+': '+grp(a.p)+' $')});
  lines.push(K.total+': '+$('#kit-sum').textContent);
  var txt=lines.join('\n'),b=this;
  var done=function(){var o=b.textContent;b.textContent=K.copied;setTimeout(function(){b.textContent=o},1600)};
  if(navigator.clipboard)navigator.clipboard.writeText(txt).then(done,done);else done();
});
var kg=$('#kit-go');
if(kg)kg.addEventListener('click',function(){var lines=[K.head];K.items.forEach(function(a){if(sel[a.id])lines.push('• '+a.t)});try{navigator.clipboard.writeText(lines.join('\n'))}catch(e){}});
})();
