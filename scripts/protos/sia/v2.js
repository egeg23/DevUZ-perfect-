(function(){
'use strict';
/* Вариант 2. Скролл не перехватывается; всё на transform и opacity. */
var d=document,R=d.documentElement,$=function(s,c){return (c||d).querySelector(s)},$$=function(s,c){return [].slice.call((c||d).querySelectorAll(s))};
var REDUCED=false;try{REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
var HOVER=false;try{HOVER=matchMedia('(hover: hover) and (min-width: 900px)').matches}catch(e){}

/* Первый экран проявляется, когда ушла заставка DevUz. */
function ready(){setTimeout(function(){R.classList.add('ready')},60)}
var dzi=d.getElementById('dzi');
if(!dzi||REDUCED)ready();else new MutationObserver(function(m,o){if(!d.getElementById('dzi')||d.getElementById('dzi').classList.contains('done')){o.disconnect();ready()}}).observe(d.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});

/* Шапка: при любой прокрутке прячется, через 3 секунды после остановки возвращается. */
var top=$('#top'),IDLE=3000,idleT=0;
addEventListener('scroll',function(){if(scrollY<40){top.classList.remove('hide');clearTimeout(idleT);return}
  top.classList.add('hide');clearTimeout(idleT);
  idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)},{passive:true});
top.addEventListener('focusin',function(){clearTimeout(idleT);top.classList.remove('hide')});

/* Появление блоков. */
var rv=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');rv.unobserve(e.target)}})},{rootMargin:'0px 0px -12% 0px'});
$$('[data-rv]').forEach(function(el){rv.observe(el)});

/* Цвет: на ПК — под курсором, из точки входа; на телефоне — у середины экрана. */
function at(ph,e){var r=ph.getBoundingClientRect();ph.style.setProperty('--x',((e.clientX-r.left)/r.width*100).toFixed(1)+'%');ph.style.setProperty('--y',((e.clientY-r.top)/r.height*100).toFixed(1)+'%')}
var own=function(ph){return ph.closest('.pl-pv,.pl-sp,.vd-p,.vd-still')};
if(HOVER){
  $$('.ph').forEach(function(ph){if(ph.closest('.pl-pv,.pl-sp'))return;var raf=0;
    ph.addEventListener('pointerenter',function(e){at(ph,e);ph.classList.add('on')});
    ph.addEventListener('pointermove',function(e){if(raf)return;raf=requestAnimationFrame(function(){raf=0;at(ph,e)})});
    ph.addEventListener('pointerleave',function(){ph.classList.remove('on')})});
}else{
  var mid=new IntersectionObserver(function(es){es.forEach(function(e){e.target.classList.toggle('on',e.isIntersecting)})},{rootMargin:'-34% 0px -34% 0px'});
  $$('.ph').forEach(function(ph){if(!own(ph)||ph.closest('.vd-still'))mid.observe(ph)});
}

/* Избранные проекты. */
var list=$('.pl-list'),rows=$$('.pl'),sps=$$('.pl-sp');
if(HOVER&&list){
  rows.forEach(function(row){var ph=$('.pl-pv .ph',row),t=0;
    row.addEventListener('pointerenter',function(){clearTimeout(t);t=setTimeout(function(){ph.classList.add('on')},180)});
    row.addEventListener('pointerleave',function(){clearTimeout(t);ph.classList.remove('on')});
    var nm=$('.pl-n',row);row.addEventListener('pointermove',function(e){var r=row.getBoundingClientRect(),n=nm.getBoundingClientRect(),x=Math.max(e.clientX,n.right)-r.left+32;if(r.left+x+260>innerWidth)x=Math.min(e.clientX,n.left)-r.left-272;row.style.setProperty('--px',Math.round(x)+'px')});
  });
}else if(list){
  var tOn=0;
  var act=function(i){rows.forEach(function(r,k){r.classList.toggle('act',k===i)});sps.forEach(function(s,k){s.classList.toggle('act',k===i);if(k!==i)$('.ph',s).classList.remove('on')});clearTimeout(tOn);tOn=setTimeout(function(){var s=sps[i];if(s)$('.ph',s).classList.add('on')},320)};
  var band=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)act(+e.target.getAttribute('data-i'))})},{rootMargin:'-46% 0px -46% 0px'});
  rows.forEach(function(r){band.observe(r)});act(0);
}

/* Направления: прокрутка меняет шаг, кадр стоит. */
var dir=$('.v-dir');
if(dir&&!REDUCED){
  var n=+getComputedStyle(dir).getPropertyValue('--n')||3,cur=-1,tPic=0,inView=false;
  var parts=['.vd-t','.vd-p','.vd-x','.vd-idx li','.vd-s'].map(function(s){return $$(s,$('.vd-stick',dir))});
  var go=function(i){if(i===cur)return;cur=i;
    parts.forEach(function(g){g.forEach(function(el,k){el.classList.toggle('act',k===i);el.classList.toggle('was',k<i)})});
    if(!HOVER){parts[1].forEach(function(p){$('.ph',p).classList.remove('on')});clearTimeout(tPic);tPic=setTimeout(function(){if(inView&&parts[1][cur])$('.ph',parts[1][cur]).classList.add('on')},450)}};
  var tick=function(){var r=dir.getBoundingClientRect(),span=r.height-innerHeight;inView=r.top<innerHeight*.5&&r.bottom>innerHeight*.5;
    var p=span>0?Math.min(.999,Math.max(0,-r.top/span)):0;go(Math.floor(p*n));
    if(!HOVER&&!inView&&parts[1][cur])$('.ph',parts[1][cur]).classList.remove('on')};
  var pend=false;addEventListener('scroll',function(){if(pend)return;pend=true;requestAnimationFrame(function(){pend=false;tick()})},{passive:true});
  addEventListener('resize',tick);tick();
}

/* Тумблер вариантов: ползунок едет, потом переход; заставки второй раз не показываем. */
$$('.vt').forEach(function(vt){$$('a',vt).forEach(function(a){a.addEventListener('click',function(e){
  var v=a.getAttribute('data-v');if(v===vt.getAttribute('data-cur')){e.preventDefault();return}
  if(e.metaKey||e.ctrlKey||e.shiftKey||e.button)return;e.preventDefault();vt.setAttribute('data-cur',v);
  try{sessionStorage.setItem('dz-intro','1');sessionStorage.setItem('sia-intro','1')}catch(x){}
  setTimeout(function(){location.href=a.href},REDUCED?0:420)})})});
})();
