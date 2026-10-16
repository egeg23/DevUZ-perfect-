(function(){
'use strict';
/* SIA: один обработчик прокрутки на всё. Прокрутку не перехватываем:
   каждое движение считается от того, где страница уже стоит, и пишется в
   transform и opacity через переменные CSS. */
var d=document,root=d.documentElement,body=d.body,$=function(s,c){return(c||d).querySelector(s)},$$=function(s,c){return[].slice.call((c||d).querySelectorAll(s))};
var REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches,FINE=matchMedia('(hover: hover) and (pointer: fine)').matches;
var clamp=function(v,a,b){return Math.min(Math.max(v,a),b)};
var vh=innerHeight,vw=innerWidth;
if(root.classList.contains('intro-off')||!$('#intro')){$$('.hero .wipe,.hero .wipe-in').forEach(function(w){void getComputedStyle(w).transform});requestAnimationFrame(function(){body.classList.add('hero-on')})}

/* Шапка прячется при любой прокрутке и возвращается через 3 секунды покоя. */
var top=$('#top'),IDLE=3000,idleT=0;
function headIdle(){if(!top)return;clearTimeout(idleT);
  if(!top.contains(d.activeElement)&&!body.classList.contains('menu-on'))top.classList.add('hide');
  idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}

/* Меню: фон пункта меняется по наведению и фокусу. */
var menu=$('#menu'),burger=$('#burger'),bgs=$$('.mn-bg'),mItems=$$('.mn-nav a');
function setBg(i){bgs.forEach(function(b,k){b.classList.toggle('on',k===i)})}
function openMenu(){menu.hidden=false;void menu.offsetWidth;menu.classList.add('open');body.classList.add('menu-on');burger.setAttribute('aria-expanded','true');root.style.overflow='hidden';setBg(0);top.classList.remove('hide');setTimeout(function(){if(mItems[0])mItems[0].focus({preventScroll:true})},80)}
function closeMenu(){if(!menu.classList.contains('open'))return;menu.classList.remove('open');body.classList.remove('menu-on');burger.setAttribute('aria-expanded','false');root.style.overflow='';setTimeout(function(){if(!menu.classList.contains('open'))menu.hidden=true},600)}
if(menu&&burger){
  burger.addEventListener('click',function(){menu.classList.contains('open')?closeMenu():openMenu()});
  mItems.forEach(function(a){var i=+a.getAttribute('data-i');a.addEventListener('mouseenter',function(){setBg(i)});a.addEventListener('focus',function(){setBg(i)});a.addEventListener('click',function(){if(a.getAttribute('href').charAt(0)==='#')closeMenu()})});
  d.addEventListener('keydown',function(e){if(e.key==='Escape')closeMenu()});
}

/* Появление: строки заголовков, абзацы, строки архива, ламели, портреты. */
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -12% 0px'});
$$('[data-lines],[data-lines-p],.stats,.sv-i,.tm-i,.pg,.pp-next').forEach(function(el){io.observe(el)});
var rowIo=new IntersectionObserver(function(es){es.forEach(function(e,k){if(e.isIntersecting){var el=e.target;setTimeout(function(){el.classList.add('in')},Math.min(k,8)*40);rowIo.unobserve(el)}})},{rootMargin:'0px 0px -6% 0px'});
$$('.ix-row').forEach(function(el){rowIo.observe(el)});

/* Первый экран: доля прокрутки сводит кадр в арку; линза с чертежом. */
var hero=$('.hero'),hStick=hero&&$('.hero-stick',hero),hPic=hero&&$('.hero-pic',hero);
if(hPic&&FINE&&!REDUCED){
  hPic.parentNode.addEventListener('mousemove',function(e){hPic.style.setProperty('--lx',e.clientX+'px');hPic.style.setProperty('--ly',e.clientY+'px');hPic.style.setProperty('--ls',hArch<.15&&body.classList.contains('hero-on')?1:0)});
  hPic.parentNode.addEventListener('mouseleave',function(){hPic.style.setProperty('--ls',0)});
}
var hArch=0;

/* Архитектура: на ПК галерея едет вбок, на телефоне карточки идут столбиком. */
var arh=$('.arh'),track=$('#arh-track'),cards=$$('.ac'),bar=$('#arh-bar'),WIDE=false,over=0;
function sizeArh(){WIDE=innerWidth>=900;if(!arh||!track)return;
  if(WIDE){over=Math.max(0,track.scrollWidth-innerWidth);arh.style.setProperty('--arh-h',(over+innerHeight*1.15)+'px')}else{arh.style.removeProperty('--arh-h');track.style.removeProperty('--ax')}}

/* Интерьеры: следующая карточка накрывает предыдущую, та уходит вглубь. */
var ics=$$('.ic');

/* Этапы: линия прочерчивается, шаг загорается, когда линия до него дошла. */
var prList=$('#pr-list'),prItems=prList?$$('li',prList):[];

/* Выставки: контурное имя едет навстречу прокрутке. */
var evs=$$('.ev-i');

/* Заявление: слова проявляются по одному. */
var stmt=$('.stmt'),words=stmt?$$('.w',stmt):[];

/* Страница проекта: рендер стирает чертёж по прокрутке, начинается сам. */
var pp=$('.pp-hero'),ppStick=pp&&$('.pp-stick',pp),ppAuto=0;
if(pp&&!REDUCED){var t0=performance.now();(function grow(now){ppAuto=Math.min((now-t0)/1600,1)*.22;tickNow();if(ppAuto<.22)requestAnimationFrame(grow)})(t0)}


/* Пролёт: кадры грузятся, когда до пролёта осталось полтора экрана. */
var fly=$('.fly'),fls=$$('.fl'),flcs=$$('.flc'),flCode=$('#fl-code'),flN=$('#fl-n'),flStick=fly&&$('.fly-stick',fly),flOn=-1;
if(fly&&!REDUCED){var flIo=new IntersectionObserver(function(es){if(!es[0].isIntersecting)return;$$('img[data-src]',fly).forEach(function(im){im.srcset=im.getAttribute('data-srcset');im.src=im.getAttribute('data-src');im.removeAttribute('data-src')});flIo.disconnect()},{rootMargin:'150% 0px'});flIo.observe(fly)}
function flyFx(){if(!fly||REDUCED)return;var r=fly.getBoundingClientRect(),len=fly.offsetHeight-vh,p=clamp(-r.top/len,0,1),N=fls.length,seg=p*N*.999;
  flStick.style.setProperty('--fp',p.toFixed(4));
  fls.forEach(function(f,i){var u=seg-i,o,s;
    if(u<-.3||u>1.35&&i<N-1){f.style.opacity=0;return}
    if(u<0){o=(u+.3)/.3;s=1+.06*o}else{o=1;var e=Math.min(u,1.3);s=f.hasAttribute('data-deep')?1.06+2.6*e*e:1.06+.5*(e*e*(3-2*e))}
    f.style.opacity=o.toFixed(3);f.style.setProperty('--s',s.toFixed(4));
    if(f.querySelector('.fl-d'))f.style.setProperty('--ro',clamp((u+.05)/.45,0,1).toFixed(3))});
  var on=clamp(Math.floor(seg+.12),0,N-1);
  if(on!==flOn){flOn=on;flcs.forEach(function(c,k){c.classList.toggle('on',k===on)});if(flCode)flCode.textContent=fls[on].getAttribute('data-c');if(flN)flN.textContent=(on<9?'0':'')+(on+1)}
  var tk=flcs[on]&&flcs[on].querySelector('.flc-ticks i.on');if(tk)tk.style.setProperty('--t',clamp(seg-on,0,1).toFixed(3));
}

/* Барабан типов объектов крутится прокруткой. */
var kd=$('.kd'),drum=$('#drum');
function drumFx(){if(!kd||!drum)return;var r=kd.getBoundingClientRect(),q=(vh-r.top)/(vh+r.height);drum.style.setProperty('--r',(-q*360).toFixed(2)+'deg')}

/* Бегущая строка: своя скорость, прокрутка разгоняет и разворачивает (Scroll Based Velocity). */
var velo=$$('.velo-row'),vk=0,vRun=false,vX=velo.map(function(){return 0});
function velBoost(dy){vk=clamp(vk+dy*.06,-14,14)}
function veloStep(){if(!vRun)return;vk*=.92;velo.forEach(function(row,i){var t=row.firstElementChild,w=t.scrollWidth/3,dir=+row.getAttribute('data-velo'),sp=(1+Math.abs(vk))*dir*(vk<0?-1:1);
  vX[i]-=sp;if(vX[i]<=-w)vX[i]+=w;if(vX[i]>0)vX[i]-=w;t.style.setProperty('--x',vX[i].toFixed(1)+'px')});requestAnimationFrame(veloStep)}
if(velo.length&&!REDUCED)new IntersectionObserver(function(es){var on=es.some(function(e){return e.isIntersecting});if(on&&!vRun){vRun=true;requestAnimationFrame(veloStep)}else if(!on)vRun=false}).observe($('.velo'));

/* Стеклянные папки (Glass Folder Cards): размер по ячейке, сборка при
   появлении по очереди, стекло ловит свет за курсором, нажатие открывает
   веер файлов, Escape и нажатие мимо закрывают. Закрытые файлы вне Tab. */
var gfs=$$('[data-gf]');
function gfSize(){gfs.forEach(function(g){var w=g.parentNode.clientWidth;g.style.setProperty('--k',Math.min(1,w/340).toFixed(4))})}
function gfOpen(g,on){if(on)gfs.forEach(function(o){if(o!==g)gfOpen(o,false)});on?g.setAttribute('data-open',''):g.removeAttribute('data-open');var b=$('.gf-hit',g),f=$('.gf-files',g);b.setAttribute('aria-expanded',on?'true':'false');if(on)f.removeAttribute('inert');else f.setAttribute('inert','')}
if(gfs.length){gfSize();addEventListener('resize',gfSize);
  gfs.forEach(function(g){gfOpen(g,false);$('.gf-hit',g).addEventListener('click',function(){gfOpen(g,!g.hasAttribute('data-open'))});
    var raf=0,px=0,py=0;function write(){raf=0;g.style.setProperty('--px',px.toFixed(3));g.style.setProperty('--py',py.toFixed(3))}
    g.addEventListener('pointermove',function(e){if(e.pointerType==='touch'||REDUCED)return;var r=g.getBoundingClientRect();px=(e.clientX-r.left)/r.width*2-1;py=(e.clientY-r.top)/r.height*2-1;if(!raf)raf=requestAnimationFrame(write)});
    g.addEventListener('pointerleave',function(){px=0;py=0;if(!raf)raf=requestAnimationFrame(write)})});
  d.addEventListener('keydown',function(e){if(e.key!=='Escape')return;gfs.forEach(function(g){if(g.hasAttribute('data-open')){gfOpen(g,false);$('.gf-hit',g).focus()}})});
  d.addEventListener('pointerdown',function(e){gfs.forEach(function(g){if(g.hasAttribute('data-open')&&!g.contains(e.target))gfOpen(g,false)})});
  if('IntersectionObserver' in window&&!REDUCED){var gio=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.setAttribute('data-in','');gio.unobserve(e.target)}})},{threshold:.25});gfs.forEach(function(g){gio.observe(g)})}
  else gfs.forEach(function(g){g.setAttribute('data-in','')})}

/* 3D-пролёт: кадры Blender по прокрутке, кадр плавно догоняет прокрутку.
   Кадры качаются сжатыми (WebP, очередью по четыре: сначала каждый 16-й,
   потом гуще), а раскладываются в картинку только рядом с текущим и не
   больше KEEP за раз, вне главного потока. 300 раскрытых кадров — это
   полтора гигабайта памяти, и страница на них дёргается. */
var bfl=$('.bfl');
if(bfl&&!REDUCED){(function(){
  var NET=navigator.connection||{},SLOW=!!NET.saveData||/(^|-)2g|3g/.test(NET.effectiveType||'');
  var N=+bfl.getAttribute('data-n'),cv=$('.bfl-cv',bfl),cx=cv.getContext('2d',{alpha:false}),cards=$$('.bfc',bfl),fnum=$('#bfl-f'),pct=$('#bfl-pct'),fill=$('#bfl-fill'),eager=Math.ceil(N/4);
  var ticks=cards.map(function(c){return $$('.flc-ticks b',c)});
  var BMP=!!(window.createImageBitmap&&window.fetch),KEEP=24,AHEAD=3;
  var portrait=function(){return innerHeight>innerWidth*1.1};
  var set,src,bmp,busy,got,gen=0,started=false,cur=0,target=0,drawn=-1,shown=-1,raf=0,step=SLOW?3:1,act0=-2,loc0=-1;
  function reset(){set=portrait()?bfl.getAttribute('data-m'):bfl.getAttribute('data-d');src=new Array(N);bmp={};busy={};got=0;drawn=-1;gen++}
  reset();
  function order(){var o=[],seen={};[16,8,4,2,1].forEach(function(s){if(s<step&&s!==1)return;for(var i=0;i<N;i+=Math.max(s,step)){if(!seen[i]){seen[i]=1;o.push(i)}}});if(!seen[N-1])o.push(N-1);return o}
  function url(i){var n=String(i+1);while(n.length<4)n='0'+n;return set+n+'.webp'}
  function arrived(i,g){if(g!==gen)return;got++;if(got===1)bfl.classList.add('ready');var lp=Math.min(1,got/eager);if(pct)pct.textContent=Math.round(lp*100);if(fill)fill.style.setProperty('--l',lp.toFixed(3));if(got>=eager)bfl.classList.add('loaded');want(Math.round(cur));soon()}
  function load(){if(started)return;started=true;var q=order(),g=gen;
    function next(){if(g!==gen||!q.length)return;var i=q.shift(),u=url(i);
      if(BMP){fetch(u).then(function(r){if(!r.ok)throw r.status;return r.blob()}).then(function(b){if(g!==gen)return;src[i]=b;arrived(i,g);next()},function(){next()})}
      else{var im=new Image();im.decoding='async';im.onload=function(){if(g!==gen)return;src[i]=im;bmp[i]=im;arrived(i,g);next()};im.onerror=next;im.src=u}}
    for(var k=0;k<4;k++)next()}
  /* Раскрыть кадр в картинку вне главного потока; лишние — закрыть. */
  function open(i){if(!BMP||i<0||i>=N||bmp[i]||busy[i]||!src[i])return;var g=gen;busy[i]=1;
    createImageBitmap(src[i]).then(function(b){delete busy[i];if(g!==gen){b.close();return}bmp[i]=b;trim();soon()},function(){delete busy[i]})}
  function trim(){var ks=Object.keys(bmp);if(ks.length<=KEEP)return;var c=Math.round(cur);ks.sort(function(a,b){return Math.abs(b-c)-Math.abs(a-c)});
    for(var j=0;j<ks.length-KEEP;j++){var k=+ks[j];if(k===drawn)continue;if(bmp[k].close)bmp[k].close();delete bmp[k]}}
  function want(k){var dir=target>=cur?1:-1;open(k);for(var d=1;d<=AHEAD;d++){open(k+d*dir);open(k-d*dir)}
    if(!bmp[k]&&!src[k]){var s=16;while(s>1&&!src[k-k%s])s/=2;open(k-k%s)}}
  function size(){var r=Math.min(devicePixelRatio||1,2);cv.width=Math.round(cv.clientWidth*r);cv.height=Math.round(cv.clientHeight*r);shown=-1;soon()}
  function nearest(i){if(bmp[i])return i;for(var k=1;k<N;k++){if(i-k>=0&&bmp[i-k])return i-k;if(i+k<N&&bmp[i+k])return i+k}return -1}
  function draw(i){var j=nearest(i);if(j<0||j===shown)return;var im=bmp[j],W=cv.width,H=cv.height,s=Math.max(W/im.width,H/im.height),dw=im.width*s,dh=im.height*s;cx.drawImage(im,(W-dw)/2,(H-dh)/2,dw,dh);shown=drawn=j}
  function tick(){raf=0;var r=bfl.getBoundingClientRect();if(r.bottom<-innerHeight||r.top>innerHeight*2)return;var p=clamp(-r.top/(r.height-innerHeight),0,1);target=p*(N-1);cur+=(target-cur)*.22;if(Math.abs(target-cur)<.05)cur=target;var k=Math.round(cur);want(k);draw(k);
    if(fnum)fnum.textContent=('00'+(k+1)).slice(-3);
    var act=-1,loc=0;cards.forEach(function(c,i){var f=+c.getAttribute('data-from'),t=+c.getAttribute('data-to');if(p>=f&&p<t){act=i;loc=(p-f)/(t-f)}});
    if(act!==act0||Math.abs(loc-loc0)>.004){act0=act;loc0=loc;cards.forEach(function(c,i){c.classList.toggle('on',i===act);c.classList.toggle('prev',act>=0&&i<act);ticks[i].forEach(function(b,j){b.style.setProperty('--t',j<act?1:j===act?loc.toFixed(3):0)})})}
    if(Math.abs(target-cur)>.05)soon()}
  function soon(){if(!raf)raf=requestAnimationFrame(tick)}
  addEventListener('scroll',soon,{passive:true});
  /* На телефоне resize приходит при каждом показе и скрытии адресной строки:
     кадры перекачиваем, только если сменилась ориентация. */
  addEventListener('resize',function(){var s=portrait()?bfl.getAttribute('data-m'):bfl.getAttribute('data-d');if(s!==set){Object.keys(bmp).forEach(function(k){if(bmp[k].close)bmp[k].close()});reset();started=false;load()}size()});
  size();
  new IntersectionObserver(function(es){if(es[0].isIntersecting)load()},{rootMargin:'150% 0px'}).observe(bfl);
})()}
function prog(el,start,len){var r=el.getBoundingClientRect();return clamp((-r.top-start)/len,0,1)}
function frame(){tick=false;flyFx();drumFx();
  if(hero){var len=hero.offsetHeight-vh;var p=clamp(-hero.getBoundingClientRect().top/len,0,1);hArch=clamp(p/.7,0,1);var e=hArch<.5?2*hArch*hArch:1-Math.pow(-2*hArch+2,2)/2;hStick.style.setProperty('--ha',e.toFixed(4));if(hArch>.15&&hPic)hPic.style.setProperty('--ls',0)}
  if(stmt){var sp=prog(stmt,-vh*.2,stmt.offsetHeight-vh*.6),n=words.length;words.forEach(function(w,i){w.style.setProperty('--o',clamp(sp*n*1.15-i,0,1).toFixed(3))})}
  if(arh&&track){
    if(WIDE){var ap=prog(arh,0,arh.offsetHeight-vh);track.style.setProperty('--ax',(-ap*over).toFixed(1)+'px');if(bar)bar.style.setProperty('--ap',ap.toFixed(4))}
    cards.forEach(function(c){var r=c.getBoundingClientRect(),dist=WIDE?Math.abs(r.left+r.width/2-vw/2)/(vw*.6):Math.abs(r.top+r.height/2-vh/2)/(vh*.6);c.style.setProperty('--c',clamp(1-dist,0,1).toFixed(3))});
  }
  ics.forEach(function(c,i){var nx=ics[i+1];if(!nx)return;var a=c.getBoundingClientRect(),b=nx.getBoundingClientRect();var cov=clamp((a.bottom-b.top)/a.height,0,1);c.firstElementChild.style.setProperty('--cov',cov.toFixed(3))});
  if(prList){var r=prList.getBoundingClientRect(),pl=clamp((vh*.75-r.top)/(r.height+vh*.2),0,1);prList.style.setProperty('--pl',pl.toFixed(4));prItems.forEach(function(li,k){li.classList.toggle('on',pl>=k/prItems.length+.02)})}
  evs.forEach(function(e,k){var r=e.getBoundingClientRect();e.style.setProperty('--ev',((r.top-vh/2)*(k%2?.4:-.4)).toFixed(1))});
  if(pp){var pr=Math.max(ppAuto,clamp(-pp.getBoundingClientRect().top/((pp.offsetHeight-vh)*.8),0,1));ppStick.style.setProperty('--pw',pr.toFixed(4))}
}
var tick=false,lastY=scrollY;
function tickNow(){if(!tick){tick=true;requestAnimationFrame(frame)}}
function onScroll(){if(Math.abs(scrollY-lastY)>2)headIdle();velBoost(scrollY-lastY);lastY=scrollY;if(!REDUCED)tickNow()}
addEventListener('scroll',onScroll,{passive:true});
addEventListener('resize',function(){vh=innerHeight;vw=innerWidth;sizeArh();tickNow()});
sizeArh();
if(!REDUCED){frame()}else{cards.forEach(function(c){c.style.setProperty('--c',1)})}
addEventListener('load',function(){sizeArh();tickNow()});

/* Архив: фильтр и обложка, которая плывёт за курсором. */
var fBtns=$$('.ix-f button'),rows=$$('#ix-list li');
fBtns.forEach(function(b){b.addEventListener('click',function(){var f=b.getAttribute('data-f');fBtns.forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});rows.forEach(function(li){var c=li.firstElementChild.getAttribute('data-cat');li.hidden=!(f==='all'||c===f);if(!li.hidden)li.firstElementChild.classList.add('in')});sizeArh();tickNow()})});
var peek=$('#peek'),pImg=peek&&$('img',peek);
if(peek&&FINE&&!REDUCED){
  var px=0,py=0,tx=0,ty=0,run=false,vx=0;
  var move=function(){var nx=px+(tx-px)*.16,ny=py+(ty-py)*.16;vx=nx-px;px=nx;py=ny;peek.style.setProperty('--px',(px+24).toFixed(1)+'px');peek.style.setProperty('--py',(py-110).toFixed(1)+'px');peek.style.setProperty('--pr',clamp(vx*.5,-8,8).toFixed(2)+'deg');peek.style.setProperty('--pz',peek.classList.contains('on')?1:.8);if(Math.abs(tx-px)>.4||Math.abs(ty-py)>.4)requestAnimationFrame(move);else run=false};
  $$('.ix-row').forEach(function(r){r.addEventListener('mouseenter',function(){var s=r.getAttribute('data-peek');if(pImg.getAttribute('src')!==s)pImg.setAttribute('src',s);peek.classList.add('on')});r.addEventListener('mouseleave',function(){peek.classList.remove('on')})});
  addEventListener('mousemove',function(e){tx=e.clientX;ty=e.clientY;if(!run){run=true;requestAnimationFrame(move)}},{passive:true});
}

/* Курсор: над кадром вырастает и называет действие. */
var cur=$('#cursor'),cs=cur&&$('span',cur);
if(cur&&FINE&&!REDUCED){
  var cx=-100,cy=-100,kx=-100,ky=-100;
  addEventListener('mousemove',function(e){kx=e.clientX;ky=e.clientY;var t=e.target.closest&&e.target.closest('[data-cur]');cur.classList.toggle('big',!!t);if(t)cs.setAttribute('data-l',t.getAttribute('data-cur'))},{passive:true});
  (function loop(){cx+=(kx-cx)*.2;cy+=(ky-cy)*.2;cur.style.transform='translate('+cx.toFixed(1)+'px,'+cy.toFixed(1)+'px)';requestAnimationFrame(loop)})();
}

/* Переход между страницами: стальные ламели закрывают экран с кодом
   проекта и открывают новую страницу. */
var shut=$('#shut'),shutT=$('#shut-t');
if(shut){
  try{var was=sessionStorage.getItem('sia-tr');if(was){shutT.textContent=was;sessionStorage.removeItem('sia-tr');requestAnimationFrame(function(){requestAnimationFrame(function(){root.classList.remove('tr-in');shut.classList.add('out');setTimeout(function(){shut.classList.remove('out')},1200)})})}}catch(e){root.classList.remove('tr-in')}
  if(!REDUCED)d.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[data-tr]');if(!a||e.metaKey||e.ctrlKey||e.shiftKey||e.button)return;e.preventDefault();var to=a.href;shutT.textContent=a.getAttribute('data-tr');shut.classList.remove('out');shut.classList.add('on');try{sessionStorage.setItem('sia-tr',a.getAttribute('data-tr'))}catch(x){}setTimeout(function(){location.href=to},820)});
  addEventListener('pageshow',function(e){if(e.persisted){shut.classList.remove('on');root.classList.remove('tr-in')}});
}
})();
