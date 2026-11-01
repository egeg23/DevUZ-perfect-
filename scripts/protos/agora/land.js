/* Первая страница макета Agora: залёт камерой в их знак, выбор «Сайт / Панель /
   Бот», конструктор цены и ежемесячные платежи. Прокрутку только читаем:
   ни scrollTo, ни preventDefault. Тумблер конструктора пишет ag-cfg-1, сайт
   читает его и прячет блок выключенного допа. */
(function(){
var d=document,w=window,$=function(s,r){return(r||d).querySelector(s)},$$=function(s,r){return[].slice.call((r||d).querySelectorAll(s))};
var D=JSON.parse($('#ag-land').textContent),T=D.t;
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

/* ── Залёт в знак ───────────────────────────────────────────────────
   Знак — вектор (обводка их обложки), поэтому камера идёт через viewBox:
   на любом увеличении края чёткие. Камера ныряет в красную чашу буквы «O»,
   чаша заливает экран, из её центра кругом раскрывается их зал. Круг и фото
   в нём двигаются только transform. */
var hs=$('#fly');
if(hs){
  var sv=$('.fl-mark svg',hs),iris=$('.fl-iris',hs),ph=$('img',iris),want=0,cur=0,raf=0;
  var LW=D.logo[0],LH=D.logo[1],AIM=D.aim,C0=[LW/2,LH/2];
  function prog(){var r=hs.getBoundingClientRect(),span=r.height-innerHeight;return span>0?cl(-r.top/span):0}
  function frame(p){
    var A=innerWidth/innerHeight,W=LW/(A<1?.9:.66),H=W/A;if(H<LH/.5){H=LH/.5;W=H*A}
    var zq=ease(cl((p-.06)/.5)),z=Math.pow(46,zq),c=[C0[0]+(AIM[0]-C0[0])*cl(zq*1.6),C0[1]+(AIM[1]-C0[1])*cl(zq*1.6)];
    var vw=W/z,vh=H/z;sv.setAttribute('viewBox',(c[0]-vw/2).toFixed(2)+' '+(c[1]-vh/2).toFixed(2)+' '+vw.toFixed(2)+' '+vh.toFixed(2));
    var q=ease(cl((p-.5)/.3)),s=Math.max(.002,q);
    iris.style.transform='scale('+s.toFixed(4)+')';
    ph.style.transform='scale('+((1/s)*(1.22-.22*q)).toFixed(4)+')';
    hs.style.setProperty('--lt',cl(1-(p-.02)/.1).toFixed(3));
    hs.style.setProperty('--q',cl((p-.8)/.14).toFixed(3));
  }
  function loop(){raf=0;var dl=want-cur;cur=Math.abs(dl)<.001?want:cur+dl* /*~*/.16;frame(cur);if(cur!==want)raf=requestAnimationFrame(loop)}
  function poke(){want=prog();if(!raf)raf=requestAnimationFrame(loop)}
  if(RM){frame(1)}
  else{addEventListener('scroll',poke,{passive:true});addEventListener('resize',function(){frame(cur)});cur=want=prog();frame(cur)}
}

/* ── Конструктор DevUz ─────────────────────────────────────────────── */
var cfg=get('ag-cfg-1',{}),boxes=$$('[data-add]');
function on(id){return cfg[id]!==false}
function cfgApply(){var s=0,n=0;boxes.forEach(function(b){var id=b.getAttribute('data-add');b.checked=on(id);if(b.checked){var a=D.add.filter(function(x){return x.id===id})[0];s+=a.p;n++}});
  $('#adds').textContent=money(s);$('#addn').textContent=n?'('+n+')':'';$('#total').textContent=money(D.base+s);put('ag-cfg-1',cfg);itApply()}
boxes.forEach(function(b){b.addEventListener('change',function(){cfg[b.getAttribute('data-add')]=b.checked;cfgApply()})});
$('#allon').addEventListener('click',function(){cfg={};cfgApply()});
$('#alloff').addEventListener('click',function(){boxes.forEach(function(b){cfg[b.getAttribute('data-add')]=false});cfgApply()});
$('#copy').addEventListener('click',function(){var txt=[$('.base b').textContent+': '+money(D.base)];D.add.forEach(function(a){if(on(a.id))txt.push(a.t+': '+money(a.p))});txt.push(T.tot+': '+$('#total').textContent);
  txt.push('');txt.push(T.month+': '+$('#it-m').textContent+' · '+T.year+': '+$('#it-y').textContent);
  var done=function(){toast(T.copied)};if(navigator.clipboard)navigator.clipboard.writeText(txt.join('\n')).then(done,done);else done()});
/* Ежемесячные платежи: не входят в 3 000 $. Поддержка — одна из двух. */
function itApply(){var m=0,y=0;$$('[data-it]').forEach(function(x){var it=D.it.filter(function(a){return a.id===x.getAttribute('data-it')})[0];if(it.id==='carebot'){x.disabled=!on('tgbot');if(x.disabled&&x.checked){x.checked=false;$('[data-it="care"]').checked=true}}
    if(x.checked){if(it.per==='year')y+=it.p;else m+=it.p}});
  $('#it-m').textContent=money(m);$('#it-y').textContent=money(y);
  var ai=$('#it-ai');ai.hidden=!on('tgbot')}
$$('[data-it]').forEach(function(x){x.addEventListener('change',itApply)});
cfgApply();
/* 48 часов с первого открытия макета на этом устройстве. */
var t0=get('ag-offer-1',0);if(!t0){t0=Date.now();put('ag-offer-1',t0)}
(function clock(){var left=Math.max(0,t0+D.hours*36e5-Date.now()),h=Math.floor(left/36e5),m=Math.floor(left%36e5/6e4),s=Math.floor(left%6e4/1e3);
  $('#th').textContent=h;$('#tm').textContent=pad(m);$('#ts').textContent=pad(s);if(left>0)setTimeout(clock,1000)})();
})();
