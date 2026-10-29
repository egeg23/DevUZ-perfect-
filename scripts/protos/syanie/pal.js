/* Переключатель палитр (palettes.mjs). Выбор — <html data-pal>, на этом
   устройстве он запоминается (localStorage), ссылка ?pal=3 открывает сайт
   сразу в нужной палитре. Сама палитра ставится ещё в <head>, до первой
   отрисовки, здесь — только кнопка и список. */
(function(){
'use strict';
var d=document,root=d.documentElement,fab=d.getElementById('pal-fab'),box=d.getElementById('pal'),dock=d.getElementById('dock');
if(!fab||!box)return;
var opts=[].slice.call(box.querySelectorAll('.pal-o')),meta=d.querySelector('meta[name="theme-color"]');
function cur(){return root.getAttribute('data-pal')||'4'}
function mark(){var c=cur();opts.forEach(function(o){var on=o.getAttribute('data-p')===c;o.setAttribute('aria-checked',on?'true':'false');o.tabIndex=on?0:-1})}
function set(id){if(id==='4')root.removeAttribute('data-pal');else root.setAttribute('data-pal',id);
  try{localStorage.setItem('sy-pal',id)}catch(e){}
  if(meta)meta.setAttribute('content',getComputedStyle(root).getPropertyValue('--ink').trim()||'#0e3b33');
  mark();try{window.dispatchEvent(new CustomEvent('sy:pal',{detail:id}))}catch(e){}}
function open(on){box.classList.toggle('open',on);fab.setAttribute('aria-expanded',on?'true':'false');
  if(on){var c=box.querySelector('[aria-checked="true"]');if(c)c.focus({preventScroll:true})}}
fab.addEventListener('click',function(){open(!box.classList.contains('open'))});
box.querySelector('.pal-x').addEventListener('click',function(){open(false);fab.focus({preventScroll:true})});
opts.forEach(function(o,i){
  o.addEventListener('click',function(){set(o.getAttribute('data-p'))});
  /* Стрелки — как в группе переключателей: выбор идёт следом за фокусом. */
  o.addEventListener('keydown',function(e){var k=e.key,j=-1;if(k==='ArrowDown'||k==='ArrowRight')j=(i+1)%opts.length;else if(k==='ArrowUp'||k==='ArrowLeft')j=(i-1+opts.length)%opts.length;
    if(j<0)return;e.preventDefault();opts[j].focus();set(opts[j].getAttribute('data-p'))})});
d.addEventListener('keydown',function(e){if(e.key==='Escape'&&box.classList.contains('open')){open(false);fab.focus({preventScroll:true})}});
d.addEventListener('click',function(e){if(box.classList.contains('open')&&!box.contains(e.target)&&!fab.contains(e.target))open(false)});
/* На первом экране дока нет — кнопка опускается на его место. */
function low(){var l=!dock||dock.classList.contains('away')||getComputedStyle(dock).display==='none';fab.classList.toggle('low',l);box.classList.toggle('low',l)}
if(dock&&window.MutationObserver)new MutationObserver(low).observe(dock,{attributes:true,attributeFilter:['class']});
addEventListener('resize',low);low();
if(meta&&cur()!=='4')meta.setAttribute('content',getComputedStyle(root).getPropertyValue('--ink').trim());
mark();
})();
