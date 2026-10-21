(function(){
'use strict';
var d=document,root=d.documentElement,$=function(s,c){return(c||d).querySelector(s)},$$=function(s,c){return[].slice.call((c||d).querySelectorAll(s))};
var CALM=root.classList.contains('calm');
var top=$('#top'),dock=$('#dock'),track=$('#track'),stage=$('#stage');

/* Шапка: при любой прокрутке прячется, через 3 с после остановки — обратно. */
var IDLE=3000,idleT=0;
function headIdle(){if(!top)return;clearTimeout(idleT);
  if(!top.contains(d.activeElement))top.classList.add('hide');
  idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}

/* Доля пройденной сцены 0…1: сколько дорожки уехало за верх экрана. */
function progress(){if(!track)return 0;var r=track.getBoundingClientRect(),h=r.height-innerHeight;return h>0?Math.min(1,Math.max(0,-r.top/h)):0}

var chips=$('#chips'),c0=$('#c0'),c1=$('#c1'),c2=$('#c2'),bar=$('#bar');
var sm=function(a,b,v){var t=Math.min(1,Math.max(0,(v-a)/(b-a)));return t*t*(3-2*t)};
function show(el,k){if(!el)return;el.style.opacity=k.toFixed(3);el.style.transform='translateY('+((1-k)*16).toFixed(1)+'px)';el.setAttribute('aria-hidden',k<.5?'true':'false');
  $$('a',el).forEach(function(a){a.tabIndex=k<.5?-1:0})}
function copy(p){
  show(c0,1-sm(.05,.13,p));
  show(c1,sm(.3,.4,p)*(1-sm(.6,.68,p)));
  show(c2,sm(.9,.97,p));
  if(bar)bar.style.transform='scaleX('+p.toFixed(4)+')';
  if(dock)dock.classList.toggle('off',track.getBoundingClientRect().bottom>innerHeight*.4)}

var scene=null;
function onScroll(){headIdle();var p=progress();if(!CALM)copy(p);if(scene)scene.poke()}
addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll);
if(!CALM)copy(progress());else if(dock)dock.classList.remove('off');

/* Появление блоков ниже сцены. */
if('IntersectionObserver' in window&&!CALM){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -10% 0px'});$$('.rv').forEach(function(el){io.observe(el)})}
else $$('.rv').forEach(function(el){el.classList.add('in')});

/* 3D: только когда можно. Иначе — кадры (класс calm). */
function calm(){CALM=true;root.classList.add('calm');if(scene)scene.stop();scene=null;show(c0,1);show(c2,1);if(dock)dock.classList.remove('off')}
function boot(){
  if(CALM||!window.SamScene)return;
  var site=JSON.parse($('#sa-site').textContent),phone=Math.min(innerWidth,innerHeight)<700;
  var tags={};$$('.tag').forEach(function(t){tags[t.getAttribute('data-part')]=t});
  var lb=$('#load-b');
  try{
    scene=SamScene.start({canvas:$('#gl'),src:site.img+(phone?'/dmax-m.glb':'/dmax.glb'),labels:tags,progress:progress,
      onProgress:function(k){if(lb)lb.style.transform='scaleX('+k.toFixed(3)+')'},
      onFrame:function(p,e){if(chips)chips.style.opacity=sm(.55,.9,e).toFixed(3)},
      onReady:function(n){var h=$('#c1-h');if(h&&n)h.textContent='Mashinani '+n+' ta detalga ajratdik'},
      onFirst:function(){stage.classList.add('live')},
      onError:calm});
  }catch(e){calm();return}
  /* Сцена не на экране — не рисуем. */
  if('IntersectionObserver' in window)new IntersectionObserver(function(es){es.forEach(function(e){if(!scene)return;if(e.isIntersecting)scene.run();else scene.stop()})}).observe(stage);
  /* Контекст WebGL потерян — кадры вместо пустоты. */
  $('#gl').addEventListener('webglcontextlost',function(e){e.preventDefault();calm()});
}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot);else boot();
})();
