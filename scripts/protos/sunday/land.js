/* Первая страница макета Sunday: залёт камерой в центр их розетки. Лепестки
   трёх слоёв расходятся в разные стороны, камера проходит в тёмный центр,
   там вечерний зал: гирлянды загораются по очереди, счёт 2009 → 2026, кругом
   раскрывается зал. Прокрутку только читаем: ни scrollTo, ни preventDefault.
   Тумблер конструктора пишет sn-cfg-1, сайт прячет блок выключенного допа. */
(function(){
var d=document,w=window,$=function(s,r){return(r||d).querySelector(s)},$$=function(s,r){return[].slice.call((r||d).querySelectorAll(s))};
var D=JSON.parse($('#sn-land').textContent),T=D.t;
var RM=w.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function get(k,def){try{var v=localStorage.getItem(k);return v?JSON.parse(v):def}catch(e){return def}}
function put(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function money(n){return fmt(n)+' $'}
function cl(x){return x<0?0:x>1?1:x}
function ease(x){return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2}
function pad(n){return(n<10?'0':'')+n}
var toastT=0;function toast(m){var t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('on')},2200)}
/* Шапка: прячется при любой прокрутке, возвращается через 3 с после последнего события. */
var top=$('.top'),IDLE=3000,idleT=0;
function headIdle(){if(!top)return;clearTimeout(idleT);
  if(!top.contains(d.activeElement))top.classList.add('hide');
  idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}
addEventListener('scroll',headIdle,{passive:true});
var io='IntersectionObserver'in w?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'}):null;
$$('.rise,.tilt,.pop,.slide').forEach(function(e){if(io&&!RM)io.observe(e);else e.classList.add('on')});
d.addEventListener('pointermove',function(e){var g=e.target.closest&&e.target.closest('.glass');if(!g)return;var r=g.getBoundingClientRect();g.style.setProperty('--gx',((e.clientX-r.left)/r.width*100)+'%');g.style.setProperty('--gy',((e.clientY-r.top)/r.height*100)+'%')},{passive:true});

/* ── Залёт в розетку ───────────────────────────────────────────────
   Розетка — вектор, камера идёт через viewBox: края чёткие на любом
   увеличении. Слои лепестков поворачиваются атрибутом transform вокруг
   центра. Круг и фото зала — только transform. */
var hs=$('#fly');
if(hs){
  var sv=$('.fl-mark svg',hs),L1=$('.fl-l1',hs),L2=$('.fl-l2',hs),L3=$('.fl-l3',hs),iris=$('.fl-iris',hs),ph=$('img',iris),cnt=$('.fl-count b',hs),want=0,cur=0,raf=0;
  function prog(){var r=hs.getBoundingClientRect(),span=r.height-innerHeight;return span>0?cl(-r.top/span):0}
  function frame(p){
    var A=innerWidth/innerHeight,W=400/(A<1?.86:.5),H=W/A;if(H<400/.7){H=400/.7;W=H*A}
    var zq=ease(cl((p-.04)/.38)),z=Math.pow(/*~*/60,zq),vw=W/z,vh=H/z;
    sv.setAttribute('viewBox',(200-vw/2).toFixed(3)+' '+(200-vh/2).toFixed(3)+' '+vw.toFixed(3)+' '+vh.toFixed(3));
    var r=ease(cl((p-.06)/.34));
    L1.setAttribute('transform','rotate('+(r*48).toFixed(2)+' 200 200)');
    L2.setAttribute('transform','rotate('+(-r*72).toFixed(2)+' 200 200)');
    L3.setAttribute('transform','rotate('+(r*110).toFixed(2)+' 200 200)');
    hs.style.setProperty('--lt',cl(1-(p-.02)/.1).toFixed(3));
    hs.style.setProperty('--mk',cl(1-(p-.36)/.06).toFixed(3));
    hs.style.setProperty('--rd',cl((p-.36)/.08).toFixed(3));
    hs.style.setProperty('--gl',cl((p-.42)/.2).toFixed(3));
    var ct=cl((p-.46)/.05)*cl(1-(p-.72)/.04);hs.style.setProperty('--ct',ct.toFixed(3));
    if(cnt)cnt.textContent=Math.round(D.from+(D.to-D.from)*ease(cl((p-.48)/.18)));
    var q=ease(cl((p-.72)/.15)),s=Math.max(.002,q);
    iris.style.transform='scale('+s.toFixed(4)+')';iris.style.opacity=q>.004?'1':'0';
    ph.style.transform='scale('+((1/s)*(1.2-.2*q)).toFixed(4)+')';
    hs.style.setProperty('--q',cl((p-.86)/.1).toFixed(3));
  }
  function loop(){raf=0;var dl=want-cur;cur=Math.abs(dl)<.001?want:cur+dl* /*~*/.14;frame(cur);if(cur!==want)raf=requestAnimationFrame(loop)}
  function poke(){want=prog();if(!raf)raf=requestAnimationFrame(loop)}
  if(RM){frame(1)}
  else{addEventListener('scroll',poke,{passive:true});addEventListener('resize',function(){frame(cur)});cur=want=prog();frame(cur)}
}

/* ── Конструктор DevUz ─────────────────────────────────────────────── */
var cfg=get('sn-cfg-1',{}),boxes=$$('[data-add]');
function on(id){return cfg[id]!==false}
function cfgApply(){var s=0,n=0;boxes.forEach(function(b){var id=b.getAttribute('data-add');b.checked=on(id);if(b.checked){var a=D.add.filter(function(x){return x.id===id})[0];s+=a.p;n++}});
  $('#adds').textContent=money(s);$('#addn').textContent=n?'('+n+')':'';$('#total').textContent=money(D.base+s);put('sn-cfg-1',cfg)}
boxes.forEach(function(b){b.addEventListener('change',function(){cfg[b.getAttribute('data-add')]=b.checked;cfgApply()})});
$('#allon').addEventListener('click',function(){cfg={};cfgApply()});
$('#alloff').addEventListener('click',function(){boxes.forEach(function(b){cfg[b.getAttribute('data-add')]=false});cfgApply()});
$('#copy').addEventListener('click',function(){var txt=[$('.base b').textContent+': '+money(D.base)];D.add.forEach(function(a){if(on(a.id))txt.push(a.t+': '+money(a.p))});txt.push(T.tot+': '+$('#total').textContent);
  var done=function(){toast(T.copied)};if(navigator.clipboard)navigator.clipboard.writeText(txt.join('\n')).then(done,done);else done()});
cfgApply();
/* 48 часов с первого открытия макета на этом устройстве. */
var t0=get('sn-offer-1',0);if(!t0){t0=Date.now();put('sn-offer-1',t0)}
(function clock(){var left=Math.max(0,t0+D.hours*36e5-Date.now()),h=Math.floor(left/36e5),m=Math.floor(left%36e5/6e4),s=Math.floor(left%6e4/1e3);
  $('#th').textContent=h;$('#tm').textContent=pad(m);$('#ts').textContent=pad(s);if(left>0)setTimeout(clock,1000)})();
})();
