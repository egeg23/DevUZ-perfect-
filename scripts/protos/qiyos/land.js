/* Первая страница макета Qiyos: залёт в знак по прокрутке (кодом, только
   transform и opacity), выбор «Сайт» или «Админка», конструктор цены.
   Прокрутку только читаем. Высота залёта — пикселями от первой высоты окна:
   в браузере Telegram vh прыгает при смене направления прокрутки. Тумблер
   конструктора пишет qy-cfg-1, сайт по нему прячет блок допа. */
(function(){
var d=document,w=window,$=function(s,r){return(r||d).querySelector(s)},$$=function(s,r){return[].slice.call((r||d).querySelectorAll(s))};
var D=JSON.parse($('#qy-land').textContent),T=D.t;
var RM=w.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function get(k,def){try{var v=localStorage.getItem(k);return v?JSON.parse(v):def}catch(e){return def}}
function put(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function money(n){return fmt(n)+' $'}
function cl(x){return x<0?0:x>1?1:x}
function pad(n){return(n<10?'0':'')+n}
var toastT=0;function toast(m){var t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('on')},2200)}
/* Шапка: прячется при любой прокрутке, возвращается через 3 с после последнего события. */
var top=$('.top'),IDLE=3000,idleT=0;
function headIdle(){if(!top)return;clearTimeout(idleT);
  if(!top.contains(d.activeElement))top.classList.add('hide');
  idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}
var io='IntersectionObserver'in w?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'}):null;
$$('.rise').forEach(function(e){if(io&&!RM)io.observe(e);else e.classList.add('on')});

/* ── Залёт: камера влетает в кольцо-монету, за ним расчёт ─────────── */
var fly=$('#fly'),ring=$('.ring',fly),tx=$('.fly-tx',fly),hint=$('.hint-s',fly),K=3,wid=w.innerWidth,raf=0;
function fix(){if(!RM)fly.style.height=Math.round(K*w.innerHeight)+'px'}
function prog(){var r=fly.getBoundingClientRect(),span=r.height-w.innerHeight;return span>0?cl(-r.top/span):1}
function paint(){raf=0;var p=prog(),s=1+Math.pow(p,2.2)* /*~*/14,o=cl(1-p/.35),q=cl((p-.62)/.25);
  ring.style.transform='scale('+s.toFixed(3)+') rotate('+(p*40).toFixed(1)+'deg)';ring.style.opacity=Math.min(.16+.84*cl((p-.12)/.2),cl(1-(p-.55)/.25)).toFixed(3);
  tx.style.setProperty('--o',o.toFixed(3));hint.style.setProperty('--o',o.toFixed(3));fly.style.setProperty('--q',q.toFixed(3));fly.classList.toggle('end',q>.5)}
function poke(){headIdle();if(!raf&&!RM)raf=requestAnimationFrame(paint)}
fix();if(RM){fly.style.setProperty('--q','1');fly.classList.add('end')}else paint();
addEventListener('scroll',poke,{passive:true});
addEventListener('resize',function(){if(w.innerWidth!==wid){wid=w.innerWidth;fix()}poke()});

/* ── Конструктор DevUz ─────────────────────────────────────────────── */
var cfg=get('qy-cfg-1',{}),boxes=$$('[data-add]');
function cfgApply(){var s=0,n=0;boxes.forEach(function(b){var id=b.getAttribute('data-add');b.checked=cfg[id]!==false;if(b.checked){var a=D.add.filter(function(x){return x.id===id})[0];s+=a.p;n++}});
  $('#adds').textContent=money(s);$('#addn').textContent=n?'('+n+')':'';$('#total').textContent=money(D.base+s);put('qy-cfg-1',cfg)}
boxes.forEach(function(b){b.addEventListener('change',function(){cfg[b.getAttribute('data-add')]=b.checked;cfgApply()})});
$('#allon').addEventListener('click',function(){cfg={};cfgApply()});
$('#alloff').addEventListener('click',function(){boxes.forEach(function(b){cfg[b.getAttribute('data-add')]=false});cfgApply()});
$('#copy').addEventListener('click',function(){var txt=[$('.base b').textContent+': '+money(D.base)];D.add.forEach(function(a){if(cfg[a.id]!==false)txt.push(a.t+': '+money(a.p))});txt.push(T.tot+': '+$('#total').textContent);
  var done=function(){toast(T.copied)};if(navigator.clipboard)navigator.clipboard.writeText(txt.join('\n')).then(done,done);else done()});
cfgApply();
/* 48 часов с первого открытия макета на этом устройстве. */
var t0=get('qy-offer-1',0);if(!t0){t0=Date.now();put('qy-offer-1',t0)}
(function clock(){var left=Math.max(0,t0+D.hours*36e5-Date.now()),h=Math.floor(left/36e5),m=Math.floor(left%36e5/6e4),s=Math.floor(left%6e4/1e3);
  $('#th').textContent=h;$('#tm').textContent=pad(m);$('#ts').textContent=pad(s);if(left>0)setTimeout(clock,1000)})();
})();
