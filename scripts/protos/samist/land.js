/* Первая страница макета SAMIST AUTO: залёт камерой в их знак SIA AUTO, ночная
   дорога, грузовик линиями чертежа, фары, раскрытие их площадки; выбор «Сайт /
   Панель» и конструктор цены. Прокрутку только читаем: ни scrollTo, ни
   preventDefault. Тумблер конструктора пишет sm-cfg-1, сайт читает его и
   прячет блок выключенного допа. Всё нарисовано кодом, без генерации. */
(function(){
var d=document,w=window,$=function(s,r){return(r||d).querySelector(s)},$$=function(s,r){return[].slice.call((r||d).querySelectorAll(s))};
var D=JSON.parse($('#sm-land').textContent),T=D.t;
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
$$('.rise,.tilt,.pop,.slide,.rl').forEach(function(e){if(io&&!RM)io.observe(e);else e.classList.add('on')});
d.addEventListener('pointermove',function(e){var g=e.target.closest&&e.target.closest('.glass');if(!g)return;var r=g.getBoundingClientRect();g.style.setProperty('--gx',((e.clientX-r.left)/r.width*100)+'%');g.style.setProperty('--gy',((e.clientY-r.top)/r.height*100)+'%')},{passive:true});

/* ── Залёт в знак и ночная дорога ──────────────────────────────────
   Знак — вектор (обводка их логотипа), камера идёт через viewBox: края
   чёткие на любом увеличении. Камера входит в просвет буквы «A», за ним
   темнота кольцевой: дорога, грузовик рисуется линиями, загораются фары, из
   их света кругом раскрывается ваша площадка. Круг и фото — только transform. */
var hs=$('#fly');
if(hs){
  var sv=$('.fl-mark svg',hs),iris=$('.fl-iris',hs),ph=$('img',iris),dash=$('.dash',hs),cnt=$('.fl-count b',hs),want=0,cur=0,raf=0;
  var LW=D.logo[0],LH=D.logo[1],AIM=D.aim,C0=[LW/2,LH/2],N=D.count;
  function prog(){var r=hs.getBoundingClientRect(),span=r.height-innerHeight;return span>0?cl(-r.top/span):0}
  function frame(p){
    var A=innerWidth/innerHeight,W=LW/(A<1?.92:.62),H=W/A;if(H<LH/.5){H=LH/.5;W=H*A}
    var zq=ease(cl((p-.05)/.36)),z=Math.pow(70,zq),k=cl(zq*1.5),c=[C0[0]+(AIM[0]-C0[0])*k,C0[1]+(AIM[1]-C0[1])*k];
    var vw=W/z,vh=H/z;sv.setAttribute('viewBox',(c[0]-vw/2).toFixed(2)+' '+(c[1]-vh/2).toFixed(2)+' '+vw.toFixed(2)+' '+vh.toFixed(2));
    hs.style.setProperty('--lt',cl(1-(p-.02)/.1).toFixed(3));
    hs.style.setProperty('--mk',cl(1-(p-.38)/.05).toFixed(3));
    hs.style.setProperty('--rd',cl((p-.40)/.08).toFixed(3));
    hs.style.setProperty('--tk',cl((p-.42)/.06).toFixed(3));
    hs.style.setProperty('--ts',(.5+.5*ease(cl((p-.42)/.32))).toFixed(4));
    hs.style.setProperty('--dr',(1-ease(cl((p-.44)/.2))).toFixed(4));
    hs.style.setProperty('--oc',cl((p-.42)/.04).toFixed(3));
    hs.style.setProperty('--lp',ease(cl((p-.63)/.07)).toFixed(3));
    var ct=cl((p-.47)/.05)*cl(1-(p-.70)/.04);hs.style.setProperty('--ct',ct.toFixed(3));
    if(cnt)cnt.textContent=Math.round(N*ease(cl((p-.48)/.16)));
    /* Дорога бежит навстречу: смещение штрихов разметки от прокрутки. */
    if(dash)dash.style.strokeDashoffset=(-p*/*~*/2400).toFixed(1);
    var q=ease(cl((p-.72)/.15)),s=Math.max(.002,q);
    iris.style.transform='scale('+s.toFixed(4)+')';
    ph.style.transform='scale('+((1/s)*(1.2-.2*q)).toFixed(4)+')';
    hs.style.setProperty('--q',cl((p-.86)/.1).toFixed(3));
  }
  function loop(){raf=0;var dl=want-cur;cur=Math.abs(dl)<.001?want:cur+dl* /*~*/.14;frame(cur);if(cur!==want)raf=requestAnimationFrame(loop)}
  function poke(){want=prog();if(!raf)raf=requestAnimationFrame(loop)}
  if(RM){frame(1)}
  else{addEventListener('scroll',poke,{passive:true});addEventListener('resize',function(){frame(cur)});cur=want=prog();frame(cur)}
}

/* ── Конструктор DevUz ─────────────────────────────────────────────── */
var cfg=get('sm-cfg-1',{}),boxes=$$('[data-add]');
function on(id){return cfg[id]!==false}
function cfgApply(){var s=0,n=0;boxes.forEach(function(b){var id=b.getAttribute('data-add');b.checked=on(id);if(b.checked){var a=D.add.filter(function(x){return x.id===id})[0];s+=a.p;n++}});
  $('#adds').textContent=money(s);$('#addn').textContent=n?'('+n+')':'';$('#total').textContent=money(D.base+s);put('sm-cfg-1',cfg)}
boxes.forEach(function(b){b.addEventListener('change',function(){cfg[b.getAttribute('data-add')]=b.checked;cfgApply()})});
$('#allon').addEventListener('click',function(){cfg={};cfgApply()});
$('#alloff').addEventListener('click',function(){boxes.forEach(function(b){cfg[b.getAttribute('data-add')]=false});cfgApply()});
$('#copy').addEventListener('click',function(){var txt=[$('.base b').textContent+': '+money(D.base)];D.add.forEach(function(a){if(on(a.id))txt.push(a.t+': '+money(a.p))});txt.push(T.tot+': '+$('#total').textContent);
  var done=function(){toast(T.copied)};if(navigator.clipboard)navigator.clipboard.writeText(txt.join('\n')).then(done,done);else done()});
cfgApply();
/* 48 часов с первого открытия макета на этом устройстве. */
var t0=get('sm-offer-1',0);if(!t0){t0=Date.now();put('sm-offer-1',t0)}
(function clock(){var left=Math.max(0,t0+D.hours*36e5-Date.now()),h=Math.floor(left/36e5),m=Math.floor(left%36e5/6e4),s=Math.floor(left%6e4/1e3);
  $('#th').textContent=h;$('#tm').textContent=pad(m);$('#ts').textContent=pad(s);if(left>0)setTimeout(clock,1000)})();
})();
