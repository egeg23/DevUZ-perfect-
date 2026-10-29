/* Первая страница макета: выбор «Сайт» или «Панель» и конструктор цены.
   Тумблер пишет nl-cfg-1, сайт читает его и убирает блок выключенного допа. */
(function(){
var d=document,w=window,$=function(s,r){return(r||d).querySelector(s)},$$=function(s,r){return[].slice.call((r||d).querySelectorAll(s))};
var D=JSON.parse($('#nl-land').textContent),T=D.t;
var RM=w.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function get(k,def){try{var v=localStorage.getItem(k);return v?JSON.parse(v):def}catch(e){return def}}
function put(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function money(n){return fmt(n)+' $'}
var toastT=0;function toast(m){var t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('on')},2200)}
/* Шапка: прячется при любой прокрутке, возвращается через 3 с после последнего события. */
var top=$('.top'),IDLE=3000,idleT=0;
function headIdle(){if(!top)return;clearTimeout(idleT);
  if(!top.contains(d.activeElement))top.classList.add('hide');
  idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}
addEventListener('scroll',headIdle,{passive:true});
(function heroIn(){if(d.documentElement.classList.contains('nli')){setTimeout(heroIn,150);return}$$('.land .rise').forEach(function(e){e.classList.add('on')})})();
var io='IntersectionObserver'in w?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'}):null;
$$('.rise,.tilt,.pop').forEach(function(e){if(e.closest('.land'))return;if(io&&!RM)io.observe(e);else e.classList.add('on')});
d.addEventListener('pointermove',function(e){var g=e.target.closest&&e.target.closest('.glass,.choice');if(!g)return;var r=g.getBoundingClientRect();g.style.setProperty('--gx',((e.clientX-r.left)/r.width*100)+'%');g.style.setProperty('--gy',((e.clientY-r.top)/r.height*100)+'%')},{passive:true});
/* Конструктор. */
var cfg=get('nl-cfg-1',{}),boxes=$$('[data-add]');
function cfgApply(){var s=0,n=0;boxes.forEach(function(b){var id=b.getAttribute('data-add');b.checked=cfg[id]!==false;if(b.checked){var a=D.add.filter(function(x){return x.id===id})[0];s+=a.p;n++}});
  $('#adds').textContent=money(s);$('#addn').textContent=n?'('+n+')':'';$('#total').textContent=money(D.base+s);put('nl-cfg-1',cfg)}
boxes.forEach(function(b){b.addEventListener('change',function(){cfg[b.getAttribute('data-add')]=b.checked;cfgApply()})});
$('#allon').addEventListener('click',function(){cfg={};cfgApply()});
$('#alloff').addEventListener('click',function(){boxes.forEach(function(b){cfg[b.getAttribute('data-add')]=false});cfgApply()});
$('#copy').addEventListener('click',function(){var txt=[$('.base b').textContent+': '+money(D.base)];D.add.forEach(function(a){if(cfg[a.id]!==false)txt.push(a.t+': '+money(a.p))});txt.push(T.tot+': '+$('#total').textContent);
  var done=function(){toast(T.copied)};if(navigator.clipboard)navigator.clipboard.writeText(txt.join('\n')).then(done,done);else done()});
cfgApply();
/* 48 часов с первого открытия макета на этом устройстве. */
var t0=get('nl-offer-1',0);if(!t0){t0=Date.now();put('nl-offer-1',t0)}
(function clock(){var left=Math.max(0,t0+D.hours*36e5-Date.now()),h=Math.floor(left/36e5),m=Math.floor(left%36e5/6e4),s=Math.floor(left%6e4/1e3);
  $('#th').textContent=h;$('#tm').textContent=('0'+m).slice(-2);$('#ts').textContent=('0'+s).slice(-2);if(left>0)setTimeout(clock,1000)})();
/* Мини-график в карточке панели: демо из одного зерна. */
var sp=$('#lspark');if(sp){var z=11,r=function(){z=(z*16807)%2147483647;return z/2147483647},h='';for(var i=0;i<18;i++)h+='<i style="height:'+(30+r()*70)+'%"></i>';sp.innerHTML=h}
})();
