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
if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){root.classList.add('tm-in');io.disconnect()}})},{threshold:.2});io.observe(root)}else root.classList.add('tm-in');
/* Куда встать: слева, ногами на пол сцены, ростом почти во всю сцену. */
function place(i,on){
  var g=btns[i].querySelector('.tm-g');
  if(!on){g.style.removeProperty('--tx');g.style.removeProperty('--ty');g.style.removeProperty('--sc');return}
  /* Мерка — по месту в строю (li не двигается), не по самому врачу. */
  var r=slot(i).getBoundingClientRect(),s=sg.getBoundingClientRect(),wide=s.width>=760;
  var sc=Math.min(s.height*(wide?.84:.74)/r.height,wide?1.55:1.5),cx=s.left+s.width*(wide?.25:.23),fl=s.top+s.height*.95;
  g.style.setProperty('--tx',Math.round(cx-(r.left+r.width/2))+'px');g.style.setProperty('--ty',Math.round(fl-r.bottom)+'px');g.style.setProperty('--sc',sc.toFixed(3));
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
  if(!calm())s.classList.add('tm-walk');
  place(i,true);
  later(function(){s.classList.remove('tm-walk');inf.hidden=false;requestAnimationFrame(function(){inf.classList.add('on');var h=inf.querySelector('h3');if(h)try{h.focus({preventScroll:true})}catch(e){}});busy=false},860);
}
function close(then){
  var i=cur;if(i<0)return;busy=true;var s=slot(i),b=btns[i],inf=info(i);
  inf.classList.remove('on');later(function(){inf.hidden=true},300);
  turn(s,true);
  later(function(){if(!calm())s.classList.add('tm-walk');place(i,false);root.classList.remove('tm-on')},260);
  later(function(){s.classList.remove('tm-walk');turn(s,false,function(){s.classList.remove('tm-sel');b.setAttribute('aria-expanded','false');cur=-1;busy=false;if(then)then();else try{b.focus({preventScroll:true})}catch(e){}})},1160);
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
