(function(){
'use strict';
/* site: появление блоков, параллакс, сцена «Сетап», карточки зон, бронь,
   колесо, кабинеты в рамках и конструктор. Прокрутку не перехватывает:
   всё считается от положения страницы и пишется только в transform и
   opacity. */
var d=document,root=d.documentElement,IV=window.IV;
var $=function(s,r){return (r||d).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))};
var REDUCED=IV.reduced;

/* Появление. */
if('IntersectionObserver' in window&&!REDUCED){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
  $$('.rv').forEach(function(el){io.observe(el)});
}else $$('.rv').forEach(function(el){el.classList.add('in')});

/* Параллакс и сцена «Сетап»: один rAF на прокрутку. */
var par=$$('[data-par]'),top=$('#top'),dock=$('#dock'),setup=$('#setup'),parts=$$('.su-p'),items=$$('.su-li'),stage=$('.su-stage'),tick=false,lastY=0;
var from=parts.map(function(p){return p.getAttribute('data-from').split(',').map(Number)});
function clamp(x){return x<0?0:x>1?1:x}
function easeOut(x){return 1-Math.pow(1-x,3)}
function scene(){
  if(!setup)return;
  var r=setup.getBoundingClientRect(),h=innerHeight,p=clamp(-r.top/Math.max(1,r.height-h));
  if(r.bottom<0||r.top>h)return;
  /* Детали влетают по очереди: у каждой свой отрезок прокрутки. */
  parts.forEach(function(el,i){
    var a=i*.13,k=easeOut(clamp((p-a)/.3)),f=from[i];
    el.style.transform='translate3d('+(f[0]*(1-k)).toFixed(1)+'%,'+(f[1]*(1-k)).toFixed(1)+'%,0) rotate('+(f[2]*(1-k)).toFixed(2)+'deg) scale('+(f[3]+(1-f[3])*k).toFixed(3)+')';
    el.style.opacity=(.15+.85*k).toFixed(3);
  });
  var on=Math.min(items.length-1,Math.floor(p*items.length*1.05));
  items.forEach(function(li,i){li.classList.toggle('on',i===on)});
  if(stage)stage.style.setProperty('--su-g',clamp(p*1.6).toFixed(3));
}
function frame(){
  tick=false;var h=innerHeight,y=scrollY;
  if(!REDUCED)for(var i=0;i<par.length;i++){var el=par[i],r=el.parentNode.getBoundingClientRect();if(r.bottom<-200||r.top>h+200)continue;var k=+el.getAttribute('data-par');el.style.transform='translate3d(0,'+((r.top+r.height/2-h/2)*-k).toFixed(1)+'px,0)'}
  if(!REDUCED)scene();
  if(top)top.classList.toggle('hide',y>lastY+4&&y>400);
  if(y<lastY-4||y<400)top&&top.classList.remove('hide');
  lastY=y;
}
function onScroll(){if(!tick){tick=true;requestAnimationFrame(frame)}}
addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll);frame();
if(REDUCED)items.forEach(function(li){li.classList.add('on')});

/* Пятно света за курсором и лёгкий наклон карточек зон (только мышь). */
var fine=matchMedia('(hover: hover) and (pointer: fine)').matches;
$$('.spot').forEach(function(c){
  c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;c.style.setProperty('--mx',x+'px');c.style.setProperty('--my',y+'px');
    if(fine&&!REDUCED&&c.classList.contains('tilt'))c.style.transform='perspective(900px) rotateX('+((.5-y/r.height)*8).toFixed(2)+'deg) rotateY('+((x/r.width-.5)*10).toFixed(2)+'deg) translateY(-4px)'});
  c.addEventListener('pointerleave',function(){c.style.transform=''});
});

/* Счётчик первого экрана: числа набегают (по мотивам Number Ticker, Magic UI, MIT). */
var hcFree=$('#hc-free'),shown=0,goal=0,raf=0;
function roll(){var s=shown;var st=performance.now();cancelAnimationFrame(raf);(function f(now){var k=Math.min(1,(now-st)/700);shown=Math.round(s+(goal-s)*easeOut(k));hcFree.textContent=shown;if(k<1)raf=requestAnimationFrame(f)})(st)}

/* Бронь: карта зала. Свободные места по зонам идут и в карточку первого экрана. */
var hallEl=$('#hall'),kb=$('.cab-ph .btn'),kabUrl=kb?kb.getAttribute('href'):'';
if(hallEl){IV.hall(hallEl,{cab:kabUrl,onCount:function(f){goal=f;if(hcFree){if(REDUCED){hcFree.textContent=f}else roll()}
  IV.data.zones.forEach(function(z){var el=$('[data-hz="'+z.id+'"]');if(el){var n=z.seats.filter(function(s){var b=hallEl.querySelector('[data-seat="'+s+'"]');return b&&b.classList.contains('f')}).length;el.textContent=n+'/'+z.seats.length}})},
  onBook:function(){$$('.cab-frame').forEach(function(f){try{f.contentWindow&&f.contentWindow.postMessage({iv:'sync'},'*')}catch(e){}})}})}

/* Колесо. */
var wh=$('#wheel');if(wh)IV.wheel(wh,{reset:true});

/* Кабинеты в рамках: грузятся, когда до них недалеко. */
var frames=$$('.cab-frame');
function load(f){if(!f.src)f.src=f.getAttribute('data-src')}
if('IntersectionObserver' in window){var fo=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){load(e.target);fo.unobserve(e.target)}})},{rootMargin:'900px 0px'});frames.forEach(function(f){fo.observe(f)})}else frames.forEach(load);

/* Нижняя плашка прячется, пока на экране бронь или колесо. */
if(dock&&'IntersectionObserver' in window){var seen=new Set();var dob=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)seen.add(e.target);else seen.delete(e.target)});dock.classList.toggle('hide',seen.size>0)},{threshold:.15});['#bron','#predlozhenie','#hero'].forEach(function(s){var el=$(s);if(el)dob.observe(el)})}

/* Конструктор: сайт и допы, итог пересчитывается сразу. */
var KIT=JSON.parse($('#kit-data').textContent),boxes=$$('#konstruktor input[data-k]');
function grp(n){return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
var sumEl=$('#kit-sum'),addEl=$('#kit-add'),nEl=$('#kit-n'),tot=KIT.base;
function calc(){var add=0,n=0;boxes.forEach(function(b){if(b.checked){add+=+b.getAttribute('data-p');n++}});
  var next=KIT.base+add;addEl.textContent=grp(add)+' $';nEl.textContent=n;
  var s=tot,st=performance.now();tot=next;if(REDUCED){sumEl.textContent=grp(next)+' $';return}
  (function f(now){var k=Math.min(1,(now-st)/450);sumEl.textContent=grp(Math.round(s+(next-s)*easeOut(k)))+' $';if(k<1)requestAnimationFrame(f)})(st)}
boxes.forEach(function(b){b.addEventListener('change',calc)});
var all=$('#kit-all');if(all)all.addEventListener('click',function(){var on=boxes.some(function(b){return !b.checked});boxes.forEach(function(b){b.checked=on});calc()});
var cp=$('#kit-copy');if(cp)cp.addEventListener('click',function(){
  var lines=[KIT.head,'• '+KIT.baseName+': '+grp(KIT.base)+' $'];
  boxes.forEach(function(b){if(b.checked){var it=KIT.items.filter(function(x){return x.id===b.getAttribute('data-k')})[0];lines.push('• '+it.t+': '+grp(it.p)+' $')}});
  lines.push(KIT.total+': '+grp(tot)+' $');
  var txt=lines.join('\n');
  (navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(function(){cp.textContent=KIT.copied},function(){cp.textContent=KIT.copied});
});
calc();
})();
