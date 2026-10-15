(function(){
'use strict';
/* Сайт архбюро: шапка, меню с фонами, форма справа, видео первого экрана,
   пролёт по прокрутке (кадры Blender на canvas), появление блоков, фильтр,
   карта и переходы между страницами. GSAP грузится отложенно: всё, что его
   зовёт, берёт его в момент вызова, без него работает на CSS. */
var d=document,root=d.documentElement,body=d.body;
var $=function(s,c){return (c||d).querySelector(s)},$$=function(s,c){return Array.prototype.slice.call((c||d).querySelectorAll(s))};
var REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches;
var NET=navigator.connection||{};
var SLOW=!!NET.saveData||/(^|-)2g|3g/.test(NET.effectiveType||'');
var G=function(){return window.gsap};
var DATA={};try{DATA=JSON.parse($('#arh-data').textContent)}catch(e){}
var EN=DATA.lang==='en';

/* Шапка: при любой прокрутке прячется, возвращается через 3 секунды после
   последнего события прокрутки. Фокус в шапке держит её на месте. */
var top=$('#top'),IDLE=3000,idleT=0;
function headIdle(){if(!top)return;clearTimeout(idleT);
  if(!top.contains(d.activeElement)&&!body.classList.contains('menu-open')&&!body.classList.contains('panel-open'))top.classList.add('hide');
  idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}
var lastY=scrollY;
addEventListener('scroll',function(){if(Math.abs(scrollY-lastY)>2)headIdle();lastY=scrollY},{passive:true});

/* Меню во весь экран: фон пункта меняется по наведению и фокусу. */
var menu=$('#menu'),burger=$('#burger'),bgs=$$('.mn-bg'),items=$$('.mn-i');
function lockScroll(on){root.style.overflow=on?'hidden':''}
function setBg(i){bgs.forEach(function(b,k){b.classList.toggle('on',k===i)});items.forEach(function(a,k){a.classList.toggle('on',k===i)})}
function openMenu(){if(!menu)return;closePanel(true);menu.hidden=false;void menu.offsetWidth;menu.classList.add('on');body.classList.add('menu-open');burger.setAttribute('aria-expanded','true');lockScroll(true);setBg(0);
  var g=G();if(g&&!REDUCED){g.fromTo(items.map(function(a){return a.querySelector('.mn-t')}),{yPercent:110,opacity:0},{yPercent:0,opacity:1,duration:.9,ease:'expo.out',stagger:.06,delay:.1});g.fromTo('.mn-side',{y:24,opacity:0},{y:0,opacity:1,duration:.8,ease:'power3.out',delay:.35})}
  setTimeout(function(){if(items[0])items[0].focus({preventScroll:true})},60)}
function closeMenu(){if(!menu||!menu.classList.contains('on'))return;menu.classList.remove('on');body.classList.remove('menu-open');burger.setAttribute('aria-expanded','false');lockScroll(false);setTimeout(function(){if(!menu.classList.contains('on'))menu.hidden=true},520)}
if(burger)burger.addEventListener('click',function(){body.classList.contains('menu-open')?closeMenu():openMenu()});
items.forEach(function(a,i){a.addEventListener('pointerenter',function(){setBg(i)});a.addEventListener('focus',function(){setBg(i)});
  a.addEventListener('click',function(){if(a.getAttribute('href').charAt(0)==='#')closeMenu()})});

/* Форма справа: одна на сайт, без перезагрузки. */
var panel=$('#panel'),veilP=$('#panel-veil'),form=$('#pn-form'),okBox=$('#pn-ok'),opener=null;
function openPanel(btn){if(!panel)return;closeMenu();opener=btn||null;panel.hidden=false;veilP.hidden=false;void panel.offsetWidth;body.classList.add('panel-open');lockScroll(true);
  setTimeout(function(){var f=panel.querySelector('input,button');if(f)f.focus({preventScroll:true})},420)}
function closePanel(quiet){if(!panel||!body.classList.contains('panel-open'))return;body.classList.remove('panel-open');if(!body.classList.contains('menu-open'))lockScroll(false);
  setTimeout(function(){if(!body.classList.contains('panel-open')){panel.hidden=true;veilP.hidden=true}},620);if(!quiet&&opener)opener.focus({preventScroll:true})}
d.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-contact]');if(b){e.preventDefault();openPanel(b)}
  if(e.target.closest&&e.target.closest('[data-close]'))closePanel()});
if(veilP)veilP.addEventListener('click',function(){closePanel()});
addEventListener('keydown',function(e){if(e.key==='Escape'){closePanel();closeMenu()}
  if(e.key==='Tab'&&body.classList.contains('panel-open')){var f=$$('input,textarea,button,a[href]',panel).filter(function(x){return x.offsetParent!==null});if(!f.length)return;
    if(e.shiftKey&&d.activeElement===f[0]){e.preventDefault();f[f.length-1].focus()}else if(!e.shiftKey&&d.activeElement===f[f.length-1]){e.preventDefault();f[0].focus()}}});
if(form)form.addEventListener('submit',function(e){e.preventDefault();var fd=new FormData(form),name=(fd.get('name')||'').trim(),ct=(fd.get('contact')||'').trim(),err=$('#pn-err');
  if(!name||ct.length<5){err.hidden=false;(name?form.contact:form.name).focus();return}err.hidden=true;
  var kind=form.querySelector('input[name=kind]:checked'),sum=$('#pn-sum'),rows=[[EN?'Name':'Имя',name],[EN?'Contact':'Связь',ct],[EN?'Project':'Проект',kind?kind.nextElementSibling.textContent:'']];
  if((fd.get('msg')||'').trim())rows.push([EN?'Brief':'Задача',fd.get('msg').trim()]);
  sum.innerHTML='';rows.forEach(function(r){var dt=d.createElement('dt'),dd=d.createElement('dd');dt.textContent=r[0];dd.textContent=r[1];sum.appendChild(dt);sum.appendChild(dd)});
  form.hidden=true;okBox.hidden=false;var b=okBox.querySelector('button');if(b)b.focus()});

/* Видео первого экрана: на ПК и быстрой сети, иначе остаётся картинка. */
var hv=$('#hero-v');
if(hv&&!REDUCED&&!SLOW&&matchMedia('(min-width: 761px), (orientation: landscape)').matches){
  var big=innerWidth*Math.min(devicePixelRatio||1,2)>1500;
  setTimeout(function(){hv.src=big?hv.dataset.src:hv.dataset.srcS;hv.addEventListener('playing',function(){hv.classList.add('on')},{once:true});var p=hv.play();if(p&&p.catch)p.catch(function(){})},body.classList.contains('hero-on')?200:2600);
  if('IntersectionObserver' in window)new IntersectionObserver(function(es){es.forEach(function(e){if(!hv.src)return;if(e.isIntersecting){var p=hv.play();if(p&&p.catch)p.catch(function(){})}else hv.pause()})}).observe(hv);
}

/* Пролёт: кадры Blender по прокрутке. Камеру двигает только прокрутка,
   кадр плавно догоняет её (без перехвата скролла). Кадры грузятся очередью
   по четыре: сначала каждый 16-й, потом гуще, чтобы пролёт был цельным
   уже через секунду. На медленной сети каждый третий. */
var fly=$('.fly');
if(fly&&!REDUCED){(function(){
  var N=+fly.dataset.n,cv=$('.fly-cv',fly),cx=cv.getContext('2d',{alpha:false}),caps=$$('.fly-cap',fly),rail=$('.fly-rail',fly),note=$('#fly-load');
  var portrait=function(){return innerHeight>innerWidth*1.1};
  var set=portrait()?fly.dataset.m:fly.dataset.d,imgs=new Array(N),got=0,want=0,started=false,cur=0,target=0,drawn=-1,raf=0;
  var step=SLOW?3:1;
  function order(){var o=[],seen={};[16,8,4,2,1].forEach(function(s){if(s<step&&s!==1)return;for(var i=0;i<N;i+=Math.max(s,step)){if(!seen[i]){seen[i]=1;o.push(i)}}});if(!seen[N-1])o.push(N-1);return o}
  function url(i){var n=String(i+1);while(n.length<4)n='0'+n;return set+n+'.webp'}
  function load(){if(started)return;started=true;var q=order(),run=0;want=q.length;
    function next(){if(!q.length)return;var i=q.shift();run++;var im=new Image();im.decoding='async';im.onload=function(){var done=function(b){imgs[i]=b||im;got++;run--;if(got===1||i===0)fly.classList.add('ready');paintSoon();if(note)note.textContent=got<want?(EN?'loading ':'загрузка ')+Math.round(got/want*100)+'%':'';next()};
      if(window.createImageBitmap)createImageBitmap(im).then(done,function(){done(null)});else done(null)};im.onerror=function(){run--;next()};im.src=url(i)}
    for(var k=0;k<4;k++)next()}
  function size(){var r=Math.min(devicePixelRatio||1,2),w=cv.clientWidth,h=cv.clientHeight;cv.width=Math.round(w*r);cv.height=Math.round(h*r);drawn=-1;paintSoon()}
  function nearest(i){if(imgs[i])return i;for(var k=1;k<N;k++){if(i-k>=0&&imgs[i-k])return i-k;if(i+k<N&&imgs[i+k])return i+k}return -1}
  function draw(i){var j=nearest(i);if(j<0||j===drawn)return;var im=imgs[j],W=cv.width,H=cv.height,iw=im.width,ih=im.height,s=Math.max(W/iw,H/ih),dw=iw*s,dh=ih*s;cx.drawImage(im,(W-dw)/2,(H-dh)/2,dw,dh);drawn=j}
  function progress(){var r=fly.getBoundingClientRect(),len=r.height-innerHeight;return Math.min(1,Math.max(0,-r.top/len))}
  function tick(){raf=0;var p=progress();target=p*(N-1);cur+=(target-cur)*.22;if(Math.abs(target-cur)<.05)cur=target;draw(Math.round(cur));
    rail.style.setProperty('--p',p.toFixed(4));caps.forEach(function(c){var on=p>=+c.dataset.from&&p<=+c.dataset.to;if(on!==c.hasAttribute('data-on'))on?c.setAttribute('data-on',''):c.removeAttribute('data-on')});
    if(Math.abs(target-cur)>.05)paintSoon()}
  function paintSoon(){if(!raf)raf=requestAnimationFrame(tick)}
  addEventListener('scroll',paintSoon,{passive:true});addEventListener('resize',function(){var s=portrait()?fly.dataset.m:fly.dataset.d;if(s!==set){set=s;imgs=new Array(N);got=0;started=false;load()}size()});
  size();
  if('IntersectionObserver' in window)new IntersectionObserver(function(es){if(es[0].isIntersecting)load()},{rootMargin:'150% 0px'}).observe(fly);else load();
  setTimeout(load,4000);
})()}

/* Появление: у блоков своё движение (класс .in ставит наблюдатель). */
var reveal=$$('.pj,.sv,.sp');
if('IntersectionObserver' in window&&!REDUCED){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -12% 0px'});reveal.forEach(function(el){io.observe(el)})}
else reveal.forEach(function(el){el.classList.add('in')});
$$('.sp').forEach(function(el,i){el.style.transitionDelay=(i%3)*.08+'s'});

/* Параллакс кадров: картинка внутри рамки едет медленнее страницы. */
var par=$$('.pj-img,.pp-img'),pTick=false;
function parallax(){pTick=false;var h=innerHeight;par.forEach(function(el){var r=el.parentNode.getBoundingClientRect();if(r.bottom<0||r.top>h)return;var k=((r.top+r.height/2)-h/2)/h;el.style.transform='translate3d(0,'+(k*-6).toFixed(2)+'%,0)'})}
if(par.length&&!REDUCED){addEventListener('scroll',function(){if(!pTick){pTick=true;requestAnimationFrame(parallax)}},{passive:true});parallax()}

/* Фильтр проектов по услугам. */
var chips=$$('.chip');
chips.forEach(function(c){c.addEventListener('click',function(){var f=c.dataset.f;chips.forEach(function(x){x.setAttribute('aria-pressed',x===c?'true':'false')});
  $$('.pj').forEach(function(p){var on=f==='all'||p.dataset.cats.split(' ').indexOf(f)>=0;p.classList.toggle('off',!on);if(on)p.classList.add('in')})})});

/* Карта: строка списка подсвечивает свою точку. */
$$('[data-pt]').forEach(function(a){var pts=$$('.mp-pt[data-tr="'+a.dataset.pt+'"]');
  ['pointerenter','focus'].forEach(function(ev){a.addEventListener(ev,function(){pts.forEach(function(p){p.classList.add('on')})})});
  ['pointerleave','blur'].forEach(function(ev){a.addEventListener(ev,function(){pts.forEach(function(p){p.classList.remove('on')})})})});

/* Видео на странице проекта: грузится, когда до него долистали. */
$$('.pp-v').forEach(function(v){if(REDUCED||SLOW||!('IntersectionObserver' in window))return;new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){if(!v.src)v.src=v.dataset.src;var p=v.play();if(p&&p.catch)p.catch(function(){})}else if(v.src)v.pause()})},{rootMargin:'200px'}).observe(v)});

/* Переход между страницами. Кадр проекта раскрывается из карточки на весь
   экран маской, и страница проекта начинается с того же кадра. Остальные
   ссылки между страницами уходят в тёмную шторку. */
var veil=$('#veil');
function go(url){location.href=url}
function cover(slug,url,img){
  var g=G();try{sessionStorage.setItem('arh-tr',slug||'1')}catch(e){}
  if(!g||REDUCED||!veil){go(url);return}
  veil.innerHTML='';veil.classList.add('on');
  var shade=d.createElement('div');shade.className='veil-shade';veil.appendChild(shade);
  if(img){var box=(img.closest('.pj-fig,.pp-next,.sv-ps a,.pp-cover')||img).getBoundingClientRect(),W=innerWidth,H=innerHeight;
    var c=new Image();c.src=img.currentSrc||img.src;c.className='veil-img';c.style.width=W+'px';c.style.height=H+'px';veil.appendChild(c);
    var t=Math.max(0,box.top),l=Math.max(0,box.left),b=Math.max(0,H-Math.min(H,box.bottom)),r=Math.max(0,W-Math.min(W,box.right));
    g.set(c,{clipPath:'inset('+t+'px '+r+'px '+b+'px '+l+'px)'});
    g.to(shade,{opacity:.6,duration:.6,ease:'power2.out'});
    g.to(c,{clipPath:'inset(0px 0px 0px 0px)',duration:.95,ease:'expo.inOut',onComplete:function(){go(url)}});
  }else{g.to(shade,{opacity:1,duration:.45,ease:'power2.inOut',onComplete:function(){go(url)}})}
}
d.addEventListener('click',function(e){
  if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  var a=e.target.closest&&e.target.closest('a[href]');if(!a||a.target||a.hasAttribute('download'))return;
  var u;try{u=new URL(a.href,location.href)}catch(x){return}
  if(u.origin!==location.origin||u.pathname===location.pathname)return;
  e.preventDefault();closeMenu();
  var slug=a.dataset.tr,img=null;
  if(slug){img=a.querySelector('img[data-tr-img]')||$('.pj [data-tr="'+slug+'"] img[data-tr-img]')||$('[data-tr="'+slug+'"] img[data-tr-img]')}
  cover(slug,u.href,img);
});
addEventListener('pageshow',function(e){if(e.persisted&&veil){veil.classList.remove('on');veil.innerHTML=''}});

/* Вход на страницу: после перехода кадр уже на месте, текст поднимается. */
var cameIn=root.classList.contains('tr-in');
try{sessionStorage.removeItem('arh-tr')}catch(e){}
function pageIn(){body.classList.add('page-in')}
if(body.classList.contains('project')){if(cameIn)requestAnimationFrame(pageIn);else setTimeout(pageIn,120)}
if(cameIn&&body.classList.contains('home'))body.classList.add('hero-on');
})();
