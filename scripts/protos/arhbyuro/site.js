(function(){
'use strict';
/* Сайт архбюро, минимализм как у референса. Один цикл на прокрутку ведёт
   все эффекты: сцена первого экрана, проявление слов, приближение кадров,
   барабан городов, бегущая строка, пролёт. Прокрутка не перехватывается:
   эффекты только читают её положение, двигают transform и opacity.
   GSAP грузится отложенно и нужен для переходов между страницами и меню;
   без него всё работает на CSS. */
var d=document,root=d.documentElement,body=d.body;
var $=function(s,c){return (c||d).querySelector(s)},$$=function(s,c){return Array.prototype.slice.call((c||d).querySelectorAll(s))};
var REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches;
var NET=navigator.connection||{};
var SLOW=!!NET.saveData||/(^|-)2g|3g/.test(NET.effectiveType||'');
var G=function(){return window.gsap};
var DATA={};try{DATA=JSON.parse($('#arh-data').textContent)}catch(e){}
var EN=DATA.lang==='en';
var clamp=function(v){return v<0?0:v>1?1:v};
/* Доля прохода секции: 0 — верх секции у верха экрана, 1 — низ секции у низа экрана. */
function pass(el){var r=el.getBoundingClientRect(),len=r.height-innerHeight;return len>0?clamp(-r.top/len):clamp(1-r.top/innerHeight)}

/* Шапка: при любой прокрутке прячется, возвращается через 3 секунды после
   последнего события прокрутки. Фокус в шапке держит её на месте. */
var top=$('#top'),IDLE=3000,idleT=0;
function headIdle(){if(!top)return;clearTimeout(idleT);
  if(!top.contains(d.activeElement)&&!body.classList.contains('menu-open')&&!body.classList.contains('panel-open'))top.classList.add('hide');
  idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}
var lastY=scrollY;

/* Меню во весь экран: фон пункта меняется по наведению и фокусу. */
var menu=$('#menu'),burger=$('#burger'),bgs=$$('.mn-bg'),items=$$('.mn-i');
function lockScroll(on){root.style.overflow=on?'hidden':''}
function setBg(i){bgs.forEach(function(b,k){b.classList.toggle('on',k===i)});items.forEach(function(a,k){a.classList.toggle('on',k===i)})}
function openMenu(){if(!menu)return;closePanel(true);menu.hidden=false;void menu.offsetWidth;menu.classList.add('on');body.classList.add('menu-open');burger.setAttribute('aria-expanded','true');lockScroll(true);setBg(0);
  var g=G();if(g&&!REDUCED){g.fromTo(items.map(function(a){return a.querySelector('.mn-t')}),{yPercent:100,opacity:0},{yPercent:0,opacity:1,duration:1,ease:'expo.out',stagger:.05,delay:.1});g.fromTo('.mn-side',{y:16,opacity:0},{y:0,opacity:1,duration:.8,ease:'power3.out',delay:.3})}
  setTimeout(function(){if(items[0])items[0].focus({preventScroll:true})},60)}
function closeMenu(){if(!menu||!menu.classList.contains('on'))return;menu.classList.remove('on');body.classList.remove('menu-open');burger.setAttribute('aria-expanded','false');lockScroll(false);setTimeout(function(){if(!menu.classList.contains('on'))menu.hidden=true},620)}
if(burger)burger.addEventListener('click',function(){body.classList.contains('menu-open')?closeMenu():openMenu()});
items.forEach(function(a,i){a.addEventListener('pointerenter',function(){setBg(i)});a.addEventListener('focus',function(){setBg(i)});
  a.addEventListener('click',function(){if(a.getAttribute('href').charAt(0)==='#')closeMenu()})});

/* Форма справа: одна на сайт, без перезагрузки. */
var panel=$('#panel'),veilP=$('#panel-veil'),form=$('#pn-form'),okBox=$('#pn-ok'),opener=null;
function openPanel(btn){if(!panel)return;closeMenu();opener=btn||null;panel.hidden=false;veilP.hidden=false;void panel.offsetWidth;body.classList.add('panel-open');lockScroll(true);
  setTimeout(function(){var f=panel.querySelector('input,button');if(f)f.focus({preventScroll:true})},460)}
function closePanel(quiet){if(!panel||!body.classList.contains('panel-open'))return;body.classList.remove('panel-open');if(!body.classList.contains('menu-open'))lockScroll(false);
  setTimeout(function(){if(!body.classList.contains('panel-open')){panel.hidden=true;veilP.hidden=true}},720);if(!quiet&&opener)opener.focus({preventScroll:true})}
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
  form.hidden=true;okBox.hidden=false;var b=okBox.querySelector('[data-close]');if(b)b.focus()});

/* Видео первого экрана: на ПК и быстрой сети, иначе остаётся картинка. */
var hv=$('#hero-v');
if(hv&&!REDUCED&&!SLOW&&matchMedia('(min-width: 761px), (orientation: landscape)').matches){
  var big=innerWidth*Math.min(devicePixelRatio||1,2)>1500;
  setTimeout(function(){hv.src=big?hv.dataset.src:hv.dataset.srcS;hv.addEventListener('playing',function(){hv.classList.add('on')},{once:true});var p=hv.play();if(p&&p.catch)p.catch(function(){})},body.classList.contains('hero-on')?200:2600);
}

/* ── Эффекты прокрутки ─────────────────────────────────────────────── */
var hero=$('.hero'),slides=$$('.hs'),caps=$$('.hc'),heroI=$('#hero-i'),heroWord=$('.hero-word'),heroIdx=-1;
function heroFx(){if(!hero)return;var p=pass(hero),n=slides.length,f=p*n,i=Math.min(n-1,Math.floor(f));
  if(i!==heroIdx){heroIdx=i;slides.forEach(function(s,k){k===i?s.setAttribute('data-on',''):s.removeAttribute('data-on')});caps.forEach(function(c,k){k===i?c.setAttribute('data-on',''):c.removeAttribute('data-on')});if(heroI)heroI.textContent=('0'+(i+1)).slice(-2);
    if(hv){i===0?(hv.src&&hv.play&&hv.play().catch(function(){})):hv.pause&&hv.pause()}}
  /* Кадр медленно отъезжает, пока он на экране (как у референса). */
  var s=slides[i];if(s)s.style.setProperty('--z',(1.08-.08*clamp(f-i)).toFixed(4));
  if(heroWord)heroWord.style.setProperty('--wy',(p*18).toFixed(2)+'%')}

/* Заявление: слова проявляются одно за другим (Text Reveal). */
var stmt=$('.stmt'),words=$$('.stmt-t .w');
function stmtFx(){if(!stmt)return;var p=pass(stmt),N=words.length,head=p*(N+8)-4;
  for(var i=0;i<N;i++){var o=clamp((head-i)/4);words[i].style.setProperty('--o',o.toFixed(3))}}

/* Кадры приближаются к рамке, пока въезжают в экран. */
var zooms=$$('[data-zoom]');
function zoomFx(){var h=innerHeight;zooms.forEach(function(el){var r=el.parentNode.getBoundingClientRect();if(r.bottom<-50||r.top>h+50)return;
  var q=clamp((h-r.top)/(h+r.height)),e=clamp(q*1.7),base=el.classList.contains('pj-img')?1.25:1.2;el.style.setProperty('--z',(base-(base-1)*e).toFixed(4))})}

/* Барабан городов крутится прокруткой (как у референса). */
var geoS=$('.geo'),drum=$('#drum');
function drumFx(){if(!geoS||!drum)return;var r=geoS.getBoundingClientRect(),q=(innerHeight-r.top)/(innerHeight+r.height);drum.style.setProperty('--r',(-q*300).toFixed(2)+'deg')}

var tick=false;
function frame(){tick=false;heroFx();stmtFx();zoomFx();drumFx()}
function onScroll(){if(Math.abs(scrollY-lastY)>2)headIdle();velBoost(scrollY-lastY);lastY=scrollY;if(!tick&&!REDUCED){tick=true;requestAnimationFrame(frame)}}
addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',function(){if(!REDUCED)frame()});
if(!REDUCED)frame();

/* Бегущая строка: своя скорость, прокрутка разгоняет и разворачивает (Scroll Based Velocity). */
var velo=$$('.velo-row'),vk=0,vRun=false,vX=velo.map(function(){return 0});
function velBoost(dy){vk=Math.max(-40,Math.min(40,vk+dy*.15))}
function veloStep(){if(!vRun)return;vk*=.92;velo.forEach(function(row,i){var t=row.firstElementChild,w=t.scrollWidth/3,dir=+row.dataset.velo,sp=(1+Math.abs(vk))*dir*(vk<0?-1:1);
  vX[i]-=sp;if(vX[i]<=-w)vX[i]+=w;if(vX[i]>0)vX[i]-=w;t.style.setProperty('--x',vX[i].toFixed(1)+'px')});requestAnimationFrame(veloStep)}
if(velo.length&&!REDUCED&&'IntersectionObserver' in window)new IntersectionObserver(function(es){var on=es.some(function(e){return e.isIntersecting});if(on&&!vRun){vRun=true;requestAnimationFrame(veloStep)}else if(!on)vRun=false}).observe($('.velo'));

/* Пролёт: кадры Blender по прокрутке. Кадр плавно догоняет прокрутку.
   Кадры грузятся очередью по четыре: сначала каждый 16-й, потом гуще. */
var fly=$('.fly');
if(fly&&!REDUCED){(function(){
  var N=+fly.dataset.n,cv=$('.fly-cv',fly),cx=cv.getContext('2d',{alpha:false}),fcaps=$$('.fly-cap',fly),rail=$('.fly-rail',fly),note=$('#fly-load'),fnum=$('#fly-f');
  var portrait=function(){return innerHeight>innerWidth*1.1};
  var set=portrait()?fly.dataset.m:fly.dataset.d,imgs=new Array(N),got=0,want=0,started=false,cur=0,target=0,drawn=-1,raf=0;
  var step=SLOW?3:1;
  function order(){var o=[],seen={};[16,8,4,2,1].forEach(function(s){if(s<step&&s!==1)return;for(var i=0;i<N;i+=Math.max(s,step)){if(!seen[i]){seen[i]=1;o.push(i)}}});if(!seen[N-1])o.push(N-1);return o}
  function url(i){var n=String(i+1);while(n.length<4)n='0'+n;return set+n+'.webp'}
  function load(){if(started)return;started=true;var q=order();want=q.length;
    function next(){if(!q.length)return;var i=q.shift(),im=new Image();im.decoding='async';im.onload=function(){var done=function(b){imgs[i]=b||im;got++;if(got===1||i===0)fly.classList.add('ready');paintSoon();if(note)note.textContent=got<want?(EN?'· loading ':'· загрузка ')+Math.round(got/want*100)+'%':'';next()};
      if(window.createImageBitmap)createImageBitmap(im).then(done,function(){done(null)});else done(null)};im.onerror=function(){next()};im.src=url(i)}
    for(var k=0;k<4;k++)next()}
  function size(){var r=Math.min(devicePixelRatio||1,2);cv.width=Math.round(cv.clientWidth*r);cv.height=Math.round(cv.clientHeight*r);drawn=-1;paintSoon()}
  function nearest(i){if(imgs[i])return i;for(var k=1;k<N;k++){if(i-k>=0&&imgs[i-k])return i-k;if(i+k<N&&imgs[i+k])return i+k}return -1}
  function draw(i){var j=nearest(i);if(j<0||j===drawn)return;var im=imgs[j],W=cv.width,H=cv.height,iw=im.width,ih=im.height,s=Math.max(W/iw,H/ih),dw=iw*s,dh=ih*s;cx.drawImage(im,(W-dw)/2,(H-dh)/2,dw,dh);drawn=j}
  function tickF(){raf=0;var p=pass(fly);target=p*(N-1);cur+=(target-cur)*.22;if(Math.abs(target-cur)<.05)cur=target;var k=Math.round(cur);draw(k);
    if(fnum)fnum.textContent=('00'+(k+1)).slice(-3);rail.style.setProperty('--p',p.toFixed(4));
    fcaps.forEach(function(c){var on=p>=+c.dataset.from&&p<=+c.dataset.to;if(on!==c.hasAttribute('data-on'))on?c.setAttribute('data-on',''):c.removeAttribute('data-on')});
    if(Math.abs(target-cur)>.05)paintSoon()}
  function paintSoon(){if(!raf)raf=requestAnimationFrame(tickF)}
  addEventListener('scroll',paintSoon,{passive:true});addEventListener('resize',function(){var s=portrait()?fly.dataset.m:fly.dataset.d;if(s!==set){set=s;imgs=new Array(N);got=0;started=false;load()}size()});
  size();
  if('IntersectionObserver' in window)new IntersectionObserver(function(es){if(es[0].isIntersecting)load()},{rootMargin:'150% 0px'}).observe(fly);else load();
  setTimeout(load,4000);
})()}

/* Появление: строки заголовков поднимаются, абзацы проступают. */
var rv=$$('[data-lines]');
if('IntersectionObserver' in window&&!REDUCED){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -10% 0px'});rv.forEach(function(el){io.observe(el)})}
else rv.forEach(function(el){el.classList.add('in')});

/* Фильтр проектов по услугам. */
var chips=$$('.chip');
chips.forEach(function(c){c.addEventListener('click',function(){var f=c.dataset.f;chips.forEach(function(x){x.setAttribute('aria-pressed',x===c?'true':'false')});
  $$('.pj').forEach(function(p){p.classList.toggle('off',!(f==='all'||p.dataset.cats.split(' ').indexOf(f)>=0))});zoomFx()})});

/* Услуги: аккордеон. */
$$('.sv-h').forEach(function(b){b.addEventListener('click',function(){var open=b.getAttribute('aria-expanded')==='true';b.setAttribute('aria-expanded',open?'false':'true');b.nextElementSibling.hidden=open})});

/* Карта: строка списка подсвечивает свою точку. */
$$('[data-pt]').forEach(function(a){var pts=$$('.mp-pt[data-tr="'+a.dataset.pt+'"]');
  ['pointerenter','focus'].forEach(function(ev){a.addEventListener(ev,function(){pts.forEach(function(p){p.classList.add('on')})})});
  ['pointerleave','blur'].forEach(function(ev){a.addEventListener(ev,function(){pts.forEach(function(p){p.classList.remove('on')})})})});

/* Видео на странице проекта: грузится, когда до него долистали. */
$$('.pp-v').forEach(function(v){if(REDUCED||SLOW||!('IntersectionObserver' in window))return;new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){if(!v.src)v.src=v.dataset.src;var p=v.play();if(p&&p.catch)p.catch(function(){})}else if(v.src)v.pause()})},{rootMargin:'200px'}).observe(v)});

/* Курсор: точка, над кадрами проектов вырастает в круг со словом. */
var cur=$('#cursor');
if(cur&&matchMedia('(hover: hover) and (pointer: fine)').matches&&!REDUCED){var cs=cur.firstElementChild,mx=-100,my=-100,px=-100,py=-100,cRaf=0;
  function cStep(){px+=(mx-px)*.2;py+=(my-py)*.2;cur.style.setProperty('--cx',px.toFixed(1)+'px');cur.style.setProperty('--cy',py.toFixed(1)+'px');cRaf=Math.abs(mx-px)+Math.abs(my-py)>.5?requestAnimationFrame(cStep):0}
  addEventListener('pointermove',function(e){mx=e.clientX;my=e.clientY;if(!cRaf)cRaf=requestAnimationFrame(cStep);var t=e.target.closest&&e.target.closest('[data-cur]');
    if(t){cs.setAttribute('data-t',t.dataset.cur);cur.classList.add('big')}else cur.classList.remove('big')},{passive:true})}

/* Переход между страницами. Кадр проекта раскрывается из карточки на весь
   экран маской, и страница проекта начинается с того же кадра. Остальные
   ссылки между страницами уходят в светлую шторку. */
var veil=$('#veil');
function go(url){location.href=url}
function cover(slug,url,img){
  var g=G();try{sessionStorage.setItem('arh-tr',slug||'1')}catch(e){}
  if(!g||REDUCED||!veil){go(url);return}
  veil.innerHTML='';veil.classList.add('on');
  var shade=d.createElement('div');shade.className='veil-shade';veil.appendChild(shade);
  if(img){var box=(img.closest('.pj-fig,.pp-next,.sv-ps a,.pp-cover,.hs')||img).getBoundingClientRect(),W=innerWidth,H=innerHeight;
    var c=new Image();c.src=img.currentSrc||img.src;c.className='veil-img';c.style.width=W+'px';c.style.height=H+'px';veil.appendChild(c);
    var t=Math.max(0,box.top),l=Math.max(0,box.left),b=Math.max(0,H-Math.min(H,box.bottom)),r=Math.max(0,W-Math.min(W,box.right));
    g.set(c,{clipPath:'inset('+t+'px '+r+'px '+b+'px '+l+'px)'});
    g.to(shade,{opacity:1,duration:.6,ease:'power2.out'});
    g.to(c,{clipPath:'inset(0px 0px 0px 0px)',duration:1,ease:'expo.inOut',onComplete:function(){go(url)}});
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
