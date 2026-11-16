/* «Наши врачи»: нажали на врача — он выходит из строя и встаёт слева,
   справа его карточка, остальные в тени. Нажатие куда угодно (кроме кнопок
   карточки) или Esc — врач разворачивается спиной, идёт на своё место и
   поворачивается лицом. Разметка — teamBlock в gen.mjs, вид — team.css.
   Движение — только transform и opacity; «меньше движения» и версия для
   слабовидящих — сразу, без шагов. Запись из карточки помнит врача
   (window.SY_DOC, его дописывает в заявку store-live.js). */
(function(){
'use strict';
var root=document.querySelector('[data-tm]');if(!root)return;
var d=document,sg=root.querySelector('.tm-sg'),gh=root.querySelector('.tm-gh'),btns=[].slice.call(root.querySelectorAll('.tm-d')),cur=-1,busy=false,T=[];
var mq=window.matchMedia?matchMedia('(prefers-reduced-motion: reduce)'):null;
function calm(){return (mq&&mq.matches)||d.documentElement.classList.contains('vi')}
function later(f,ms){T.push(setTimeout(f,calm()?0:ms))}
function info(i){return d.getElementById('tm-i'+i)}
function slot(i){return btns[i].parentNode}
root.classList.add('tm-js');
/* Появление ряда: врачи встают по одному, когда блок на экране. */
function seen(){root.classList.add('tm-in');if(!slow)setTimeout(function(){btns.forEach(function(b){load(b.parentNode,'wf')})},600)}
if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){seen();io.disconnect()}})},{threshold:.2});io.observe(root)}else seen();
btns.forEach(function(b){b.addEventListener('pointerdown',function(){load(b.parentNode,'wf')},{passive:true})});
/* Куда встать: слева, ногами на пол сцены, ростом почти во всю сцену. */
function place(i,on){
  var g=btns[i].querySelector('.tm-g');
  if(!on){g.style.removeProperty('--tx');g.style.removeProperty('--ty');g.style.removeProperty('--sc');return}
  /* Мерка — по месту в строю (li не двигается), не по самому врачу. */
  var r=slot(i).getBoundingClientRect(),s=sg.getBoundingClientRect(),wide=s.width>=760;
  /* На ПК врач почти во всю сцену (владелец, 16.11.2026: «чуть больше занимать в пк версии места на экране, % на 20-30»), заголовок над ним гаснет. */
  var sc=Math.min(s.height*(wide?.97:.74)/r.height,wide?1.9:1.5),cx=s.left+s.width*(wide?.25:.23),fl=s.top+s.height*(wide?.96:.95);
  g.style.setProperty('--tx',Math.round(cx-(r.left+r.width/2))+'px');g.style.setProperty('--ty',Math.round(fl-r.bottom)+'px');g.style.setProperty('--sc',sc.toFixed(3));
}
/* Походка (владелец, 16.11.2026: «можешь сделать прям походку, чтобы он шел?»):
   кадры шага из видео — лента tm-<ключ>-wf.webp (к нам) и -wb.webp (от нас), её
   сдвигает transform, пока врач идёт. Первый и последний кадр ленты — та же поза,
   что кадр врача, поэтому подмена не видна. Ленты «к нам» грузятся, когда блок
   на экране (медленная сеть и экономия трафика — по первому касанию врача),
   «от нас» — когда врач вышел. Нет ленты — покачивание, «меньше движения» —
   без шагов. */
var WALK=1650;
function load(s,kind){[].slice.call(s.querySelectorAll('.tm-w'+(kind?'.tm-'+kind:''))).forEach(function(w){var im=w.querySelector('img');if(!im||im.getAttribute('src'))return;
  im.onload=function(){var ok=function(){w.setAttribute('data-ok','1')};if(im.decode)im.decode().then(ok,ok);else ok()};im.src=w.getAttribute('data-src')})}
var net=navigator.connection||{},slow=!!(net.saveData||/2g|3g/.test(net.effectiveType||''));
function walk(s,kind){
  if(calm())return 0;
  var w=s.querySelector('.tm-w'+kind);
  s.style.setProperty('--wd',WALK+'ms');
  if(!w||!w.hasAttribute('data-ok')){s.classList.add('tm-walk');later(function(){s.classList.remove('tm-walk')},WALK);return WALK}
  var im=w.querySelector('img'),n=+w.getAttribute('data-n'),t0=0;s.classList.add('tm-ws','tm-w'+kind+'-on');
  (function step(t){if(!t0)t0=t||performance.now();var k=((t||t0)-t0)/WALK;
    if(k>=1){s.classList.remove('tm-ws','tm-w'+kind+'-on');im.style.removeProperty('--f');return}
    im.style.setProperty('--f',String(Math.min(n-1,Math.floor(k*n))));requestAnimationFrame(step)})();
  return WALK;
}
function turn(el,back,done){
  if(calm()){el.classList.toggle('tm-back',back);if(done)done();return}
  el.classList.add('tm-turn');later(function(){el.classList.toggle('tm-back',back)},220);later(function(){el.classList.remove('tm-turn');if(done)done()},440);
}
function open(i){
  busy=true;cur=i;var s=slot(i),b=btns[i],inf=info(i);
  root.classList.add('tm-on');s.classList.add('tm-sel');b.setAttribute('aria-expanded','true');
  /* Фамилия контуром за врачом, как имя бойца: по ширине левой половины сцены. */
  if(gh){var sn=b.getAttribute('data-sn')||'';gh.textContent=sn;gh.style.setProperty('--gs',Math.round(Math.min(200,sg.clientWidth*.46/Math.max(4,sn.length)/.58))+'px')}
  var r=sg.getBoundingClientRect();if(r.top<-40||r.bottom>innerHeight+40)try{sg.scrollIntoView({block:'center',behavior:calm()?'auto':'smooth'})}catch(e){}
  var ms=walk(s,'f');load(s,'wb');
  place(i,true);
  later(function(){inf.hidden=false;requestAnimationFrame(function(){inf.classList.add('on');var h=inf.querySelector('h3');if(h)try{h.focus({preventScroll:true})}catch(e){}});busy=false},ms||10);
}
function close(then){
  var i=cur;if(i<0)return;busy=true;var s=slot(i),b=btns[i],inf=info(i);
  inf.classList.remove('on');later(function(){inf.hidden=true},300);
  turn(s,true);
  var ms=calm()?0:WALK;
  later(function(){walk(s,'b');place(i,false);root.classList.remove('tm-on')},260);
  later(function(){s.style.removeProperty('--wd');turn(s,false,function(){s.classList.remove('tm-sel');b.setAttribute('aria-expanded','false');cur=-1;busy=false;if(then)then();else try{b.focus({preventScroll:true})}catch(e){}})},260+ms);
}
function vi(){return d.documentElement.classList.contains('vi')}
/* В версии для слабовидящих карточки открыты все сразу (team.css), сцены нет. */
btns.forEach(function(b,i){b.addEventListener('click',function(e){e.stopPropagation();if(busy||vi())return;if(cur===i)close();else if(cur>=0)close(function(){open(i)});else open(i)})});
d.addEventListener('click',function(e){if(cur<0||busy||vi())return;var t=e.target;if(t.closest&&t.closest('.tm-i')&&t.closest('a,button,input,label'))return;close()});
d.addEventListener('keydown',function(e){if(e.key!=='Escape'||cur<0||busy)return;var sh=d.getElementById('zapis');if(sh&&!sh.hidden)return;close()});
var rz=0;addEventListener('resize',function(){clearTimeout(rz);rz=setTimeout(function(){if(cur>=0&&!busy)place(cur,true)},120)});
/* Врач для записи: кнопка в карточке — этот врач, любая другая запись — без врача. */
d.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('[data-book]');if(a)window.SY_DOC=a.getAttribute('data-doc')||''},true);
})();
