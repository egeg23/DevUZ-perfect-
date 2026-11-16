/* «Наши врачи»: нажали на врача — он выходит из строя и встаёт слева,
   справа его карточка, остальные в тени. Нажатие куда угодно (кроме кнопок
   карточки) или Esc — врач разворачивается спиной, идёт на своё место и
   поворачивается лицом. Разметка — teamBlock в gen.mjs, вид — team.css.
   Движение — только transform и opacity; «меньше движения» и версия для
   слабовидящих — сразу, без шагов. Запись из карточки помнит врача
   (window.SY_DOC, его дописывает в заявку store-live.js).

   Кадры движения (владелец, 16.11.2026: «можешь сделать прям походку, чтобы он
   шел?», потом «шаги сделай будто бы это шаги настоящие. Когда разворачивается —
   они становятся тонкими, будто бы толщиной врач 1 мм»): у врача три ленты
   кадров из видео — идёт к нам (wf), уходит (wb), разворот лицом → спиной (t,
   назад — те же кадры с конца). Лента — сетка кадров, её листает transform.
   Первый и последний кадр ленты — та же поза, что кадр врача, поэтому подмена
   не видна. Разворот — настоящий, с профилем: сжатия по ширине нет.
   Шаги не скользят: по экрану врач смещается сам скрипт (--tx, --ty, --sc по
   кадрам), и только на том отрезке ленты, где идут ноги (data-go).
   Ленты «к нам» грузятся, когда блок на экране (медленная сеть и экономия
   трафика — по первому касанию врача), «от нас» и разворот — когда врач
   вышел. Нет ленты — врач переезжает плавно, без шагов, кадр лицом перетекает
   в кадр спиной. */
(function(){
'use strict';
var root=document.querySelector('[data-tm]');if(!root)return;
var d=document,sg=root.querySelector('.tm-sg'),gh=root.querySelector('.tm-gh'),btns=[].slice.call(root.querySelectorAll('.tm-d')),cur=-1,busy=0,want=null,pos=[];
var mq=window.matchMedia?matchMedia('(prefers-reduced-motion: reduce)'):null;
function vi(){return d.documentElement.classList.contains('vi')}
function calm(){return (mq&&mq.matches)||vi()}
function later(f,ms){setTimeout(f,calm()?0:ms)}
function info(i){return d.getElementById('tm-i'+i)}
function slot(i){return btns[i].parentNode}
function fig(i){return btns[i].querySelector('.tm-g')}
var HOME={tx:0,ty:0,sc:1};
root.classList.add('tm-js');
var net=navigator.connection||{},slow=!!(net.saveData||/2g|3g/.test(net.effectiveType||''));
function load(s,kinds){kinds.split(' ').forEach(function(k){var w=s.querySelector('.tm-'+k),im=w&&w.querySelector('img');if(!im||im.getAttribute('src'))return;
  im.onload=function(){w.setAttribute('data-ok','1')};im.src=w.getAttribute('data-src')})}
/* Лента готова к показу: загружена и распакована (распаковка — прямо перед показом,
   иначе четыре ленты держат память телефона зря). Ждём её не дольше 0,4 с. */
function ready(s,k,cb){
  var w=calm()?null:s.querySelector('.tm-'+k),im,hit=false;
  if(w&&!w.hasAttribute('data-ok'))w=null;
  function go(){if(hit)return;hit=true;cb(w)}
  im=w&&w.querySelector('img');if(!im||!im.decode)return go();
  im.decode().then(go,go);setTimeout(go,400);
}
/* Появление ряда: врачи встают по одному, когда блок на экране. */
function seen(){root.classList.add('tm-in');if(!slow)setTimeout(function(){btns.forEach(function(b){load(b.parentNode,'wf')})},600)}
if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){seen();io.disconnect()}})},{threshold:.2});io.observe(root)}else seen();
btns.forEach(function(b){b.addEventListener('pointerdown',function(){var s=b.parentNode;load(s,'wf');ready(s,'wf',function(){})},{passive:true})});
/* Куда встать: слева, ногами на пол сцены, ростом почти во всю сцену. */
function target(i){
  /* Мерка — по месту в строю (li не двигается), не по самому врачу. */
  var r=slot(i).getBoundingClientRect(),s=sg.getBoundingClientRect(),wide=s.width>=760;
  /* На ПК врач почти во всю сцену (владелец, 16.11.2026: «чуть больше занимать в пк версии места на экране, % на 20-30»), заголовок над ним гаснет. */
  var sc=Math.min(s.height*(wide?.97:.74)/r.height,wide?1.9:1.5),cx=s.left+s.width*(wide?.25:.23),fl=s.top+s.height*(wide?.96:.95);
  return {tx:Math.round(cx-(r.left+r.width/2)),ty:Math.round(fl-r.bottom),sc:sc};
}
function set(g,p){
  if(!p){g.style.removeProperty('--tx');g.style.removeProperty('--ty');g.style.removeProperty('--sc');return}
  g.style.setProperty('--tx',p.tx.toFixed(1)+'px');g.style.setProperty('--ty',p.ty.toFixed(1)+'px');g.style.setProperty('--sc',p.sc.toFixed(4));
}
/* Путь по кадрам: врач смещается, только пока идут ноги (отрезок go ленты), почти ровным ходом. */
function path(i,a,b,go){var g=fig(i);return function(u){var v=(u-go[0])/(go[1]-go[0]);v=v<0?0:v>1?1:v;v=v*.6+v*v*(3-2*v)*.4;
  set(g,{tx:a.tx+(b.tx-a.tx)*v,ty:a.ty+(b.ty-a.ty)*v,sc:a.sc+(b.sc-a.sc)*v})}}
/* Листает ленту w за её время (data-ms): кадр — сдвигом сетки, tick — доля пути на каждом кадре экрана. */
function run(s,k,w,rev,tick,done){
  var im=w.querySelector('img'),n=+w.getAttribute('data-n'),c=+w.getAttribute('data-c'),ms=+w.getAttribute('data-ms'),t0=0,last=-1;
  function show(f){if(f===last)return;last=f;im.style.setProperty('--fx',String(f%c));im.style.setProperty('--fy',String(Math.floor(f/c)))}
  show(rev?n-1:0);s.classList.add('tm-ws','tm-'+k+'-on');
  requestAnimationFrame(function step(t){
    if(!t0)t0=t;var u=Math.min(1,(t-t0)/ms),f=Math.min(n-1,Math.floor(u*n));
    show(rev?n-1-f:f);if(tick)tick(u);
    if(u<1){requestAnimationFrame(step);return}
    s.classList.remove('tm-ws','tm-'+k+'-on');if(done)done();
  });
}
function goOf(w){return (w.getAttribute('data-go')||'0,1').split(',').map(Number)}
/* Разворот: кадры настоящего поворота (лицо, профиль, спина); обратно — с конца. */
function turn(s,back,done){
  ready(s,'t',function(w){
    if(!w){s.classList.add('tm-xf');s.classList.toggle('tm-back',back);later(function(){s.classList.remove('tm-xf');done()},320);return}
    run(s,'t',w,!back,null,function(){s.classList.toggle('tm-back',back);done()});
  });
}
function enter(i,done){
  var s=slot(i),b=btns[i],inf=info(i),g=fig(i),to=target(i);
  s.classList.add('tm-sel');b.setAttribute('aria-expanded','true');
  /* Фамилия контуром за врачом, как имя бойца: по ширине левой половины сцены. */
  if(gh){var sn=b.getAttribute('data-sn')||'';gh.textContent=sn;gh.style.setProperty('--gs',Math.round(Math.min(200,sg.clientWidth*.46/Math.max(4,sn.length)/.58))+'px')}
  var r=sg.getBoundingClientRect();if(r.top<-40||r.bottom>innerHeight+40)try{sg.scrollIntoView({block:'center',behavior:calm()?'auto':'smooth'})}catch(e){}
  function card(){if(cur!==i)return;inf.hidden=false;requestAnimationFrame(function(){inf.classList.add('on');var h=inf.querySelector('h3');if(h)try{h.focus({preventScroll:true})}catch(e){}})}
  load(s,'wb t');pos[i]=to;
  if(calm()){set(g,to);card();done();return}
  ready(s,'wf',function(w){
    if(!w){set(g,to);later(card,500);later(done,900);return}
    s.classList.add('tm-mv');later(card,+w.getAttribute('data-ms')*.62);
    run(s,'wf',w,false,path(i,HOME,to,goOf(w)),function(){s.classList.remove('tm-mv');done()});
  });
}
function leave(i,keep,done){
  var s=slot(i),b=btns[i],inf=info(i),g=fig(i),from=pos[i]||target(i);
  inf.classList.remove('on');later(function(){inf.hidden=true},300);
  function fin(){s.classList.remove('tm-sel');b.setAttribute('aria-expanded','false');done()}
  if(calm()){set(g,null);if(!keep)root.classList.remove('tm-on');fin();return}
  turn(s,true,function(){
    if(!keep)root.classList.remove('tm-on');
    function home(){turn(s,false,fin)}
    ready(s,'wb',function(w){
      if(!w){set(g,null);later(home,900);return}
      s.classList.add('tm-mv');
      run(s,'wb',w,false,path(i,from,HOME,goOf(w)),function(){set(g,null);s.classList.remove('tm-mv');home()});
    });
  });
}
/* Пока врач идёт, новое нажатие не теряется: оно выполнится, когда он дойдёт. */
function idle(){
  if(--busy>0)return;busy=0;var w=want;want=null;
  if(w==='x'){if(cur>=0)shut()}else if(w!==null)pick(w);
}
function open(i){busy++;cur=i;root.classList.add('tm-on');enter(i,idle)}
function shut(){var i=cur;if(i<0)return;busy++;cur=-1;leave(i,false,function(){if(want===null)try{btns[i].focus({preventScroll:true})}catch(e){}idle()})}
/* Другой врач при открытом: первый разворачивается и уходит, второй уже идёт на его место. */
function swap(i){var p=cur;busy+=2;cur=i;leave(p,true,idle);later(function(){enter(i,idle)},700)}
function pick(i){if(vi())return;if(busy){want=i;return}if(cur===i)shut();else if(cur>=0)swap(i);else open(i)}
/* В версии для слабовидящих карточки открыты все сразу (team.css), сцены нет. */
btns.forEach(function(b,i){b.addEventListener('click',function(e){e.stopPropagation();pick(i)})});
d.addEventListener('click',function(e){if(vi())return;var t=e.target;if(t.closest&&t.closest('.tm-i')&&t.closest('a,button,input,label'))return;if(busy){if(cur>=0)want='x';return}if(cur>=0)shut()});
d.addEventListener('keydown',function(e){if(e.key!=='Escape'||cur<0)return;var sh=d.getElementById('zapis');if(sh&&!sh.hidden)return;if(busy)want='x';else shut()});
var rz=0;addEventListener('resize',function(){clearTimeout(rz);rz=setTimeout(function(){if(cur>=0&&!busy){pos[cur]=target(cur);set(fig(cur),pos[cur])}},120)});
/* Врач для записи: кнопка в карточке — этот врач, любая другая запись — без врача. */
d.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('[data-book]');if(a)window.SY_DOC=a.getAttribute('data-doc')||''},true);
})();
