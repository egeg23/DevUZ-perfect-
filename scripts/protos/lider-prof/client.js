(function(){
'use strict';
/* main: появление блоков, шапка, фильтр проектов, очередь превью, страница
   проекта с галереей, расчёт проекта с брифом, просмотр 360°, «было /
   стало», конструктор. Всё, что уходит архитектору, уходит в Telegram
   студии. Анимации только transform и opacity, прокрутку только читаем. */
var d=document,root=d.documentElement,$=function(id){return d.getElementById(id)};
var L={};try{L=JSON.parse($('i18n').textContent)}catch(e){}
var reduce=false;try{reduce=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
var hov=false;try{hov=matchMedia('(hover:hover) and (pointer:fine)').matches}catch(e){}
var store={get:function(k,f){try{var v=localStorage.getItem(k);return v?JSON.parse(v):f}catch(e){return f}},set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
var qa=function(s,el){return [].slice.call((el||d).querySelectorAll(s))};
var money=function(n){return '$'+String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ')};
var sp=function(n){return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ')};
var esc=function(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')};

if(root.classList.contains('intro-off')||!$('intro')){var h0=$('hero');if(h0)h0.classList.add('hero-on')}

/* ── Сообщение в Telegram студии. Готовый текст в чат не подставить,
   поэтому кладём его в буфер обмена и открываем чат: человеку остаётся
   вставить и отправить. ── */
function tgSend(text,note){
  try{navigator.clipboard.writeText(text)}catch(e){}
  if(note){note.textContent=L.sent;note.hidden=false}
  window.open(L.tg,'_blank','noopener');
}
d.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[data-tg]');if(!a)return;e.preventDefault();tgSend(a.dataset.tg||'')});

/* ── Превью грузятся очередью: по три за раз и только те, что на виду.
   11.10.2026 у enotmebel iPhone запрашивал всю сетку разом, nginx отбивал
   пачку с 429, и вместо картинок были знаки вопроса. Не ответил — ещё две
   попытки с паузой. Снимки истории грузит story.js своей очередью. ── */
var pq=[],pBusy=0;
function pump(){
  while(pBusy<3&&pq.length){
    var im=pq.shift();pBusy++;
    (function(im){var tries=0,src=im.getAttribute('data-src');
      var done=function(){pBusy--;im.classList.add('ok');pump()};
      im.onload=done;
      im.onerror=function(){if(tries<2){tries++;setTimeout(function(){im.src=src+'?r='+tries},900*tries)}else done()};
      im.src=src})(im);
  }
}
function want(im){if(im.dataset.q)return;im.dataset.q='1';pq.push(im);pump()}
var lio='IntersectionObserver' in window?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){lio.unobserve(e.target);want(e.target)}})},{rootMargin:'300px 0px'}):null;
function watch(scope){qa('img[data-src]',scope).forEach(function(im){if(im.closest('.st-stage')&&!root.classList.contains('st-calm'))return;if(lio)lio.observe(im);else want(im)})}
watch();

/* ── Появление блоков: у каждого своё движение ── */
function reveal(scope){
  var rv=qa('.rv:not(.in)',scope);
  if('IntersectionObserver' in window&&!reduce){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
    rv.forEach(function(el){io.observe(el)});
  }else rv.forEach(function(el){el.classList.add('in')});
}
reveal();

/* ── Шапка: над историей и тёмными блоками светлый текст, дальше стекло ── */
var story=$('story');
var hdr=d.querySelector('.top .wrap'),tq=0;
var tone=function(){tq=0;if(!hdr)return;var r=hdr.getBoundingClientRect(),x=innerWidth/2,y=r.top+r.height/2,dark=false;
  var under=(d.elementsFromPoint?d.elementsFromPoint(x,y):[]).filter(function(e){return !e.closest('.top')&&!e.closest('#intro')})[0];
  if(under)dark=!!under.closest('#story,.dark,.foot');
  d.body.classList.toggle('hd-dark',dark)};
var top=function(){var y=scrollY;d.body.classList.toggle('scrolled',y>40);if(!tq)tq=requestAnimationFrame(tone)};
addEventListener('scroll',top,{passive:true});addEventListener('resize',top);top();

/* ── Карточка наклоняется за курсором, пятно света за ним же ── */
function tilt(scope){if(!hov||reduce)return;qa('.tilt',scope).forEach(function(c){
  if(c.dataset.t)return;c.dataset.t='1';
  var spot=c.querySelector('.spot'),raf=0,px=0,py=0;
  c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect();px=(e.clientX-r.left)/r.width;py=(e.clientY-r.top)/r.height;
    if(!raf)raf=requestAnimationFrame(function(){raf=0;c.style.transform='perspective(900px) rotateX('+((.5-py)*5).toFixed(2)+'deg) rotateY('+((px-.5)*7).toFixed(2)+'deg)';if(spot)spot.style.transform='translate3d('+(px*r.width).toFixed(0)+'px,'+(py*r.height).toFixed(0)+'px,0)'})});
  c.addEventListener('pointerleave',function(){c.style.transform=''});
})}
tilt();

/* ── Проекты: фильтр по направлению ── */
var grid=$('pgrid'),catN=$('cat-n');
if(grid){
  var cards=qa('.pc',grid);
  var apply=function(f){var n=0;cards.forEach(function(c){var ok=!f||(' '+c.dataset.c+' ').indexOf(' '+f+' ')>=0;c.hidden=!ok;if(ok){n++;if(!reduce){c.classList.remove('k-fresh');void c.offsetWidth;c.classList.add('k-fresh')}}});if(catN)catN.textContent=L.found.replace('{n}',n)};
  qa('.chips .chip').forEach(function(b){b.addEventListener('click',function(){qa('.chips .chip').forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});apply(b.dataset.f)})});
  apply('');
}

/* ── Страница проекта: одна на все, проект по ?id= ── */
var pj=$('pj-data');
if(pj){
  var D={};try{D=JSON.parse(pj.textContent)}catch(e){}
  var id=+(new URLSearchParams(location.search).get('id')||0),list=D.p||[],P=null;
  for(var i=0;i<list.length;i++)if(list[i].id===id)P=list[i];
  if(!P){P=list.filter(function(x){return x.id===64})[0]||list[0];if(id){var nb=d.createElement('p');nb.className='pj-miss';nb.textContent=L.noProj;$('pj-n').parentNode.insertBefore(nb,$('pj-n'))}}
  var big=function(x){return L.img+'/p-'+P.id+'_'+x[0]+'-'+(x[3]?1280:640)+'.webp'};
  d.title=P.n+' | LIDER PROF PROEKT';
  var mi=$('pj-main');mi.src=big(P.img[0]);mi.alt=P.n;mi.width=P.img[0][1];mi.height=P.img[0][2];
  $('pj-n').textContent=P.n;$('pj-c').textContent=P.c.join(' · ');$('pj-m').textContent=P.m;
  /* Цифры проекта крупно: число отдельно от подписи. */
  var st=$('pj-s');
  if(P.s.length){st.innerHTML=P.s.map(function(x){var v=x[1].replace(/:\s*\d+%$/,'');return '<div class="rv a-rise"><dt>'+esc(x[0])+'</dt><dd class="num">'+esc(v)+'</dd></div>'}).join('')}
  else st.closest('section').classList.add('none');
  $('pj-d').innerHTML=P.d.map(function(x){return '<p>'+esc(x)+'</p>'}).join('');
  var tm=$('pj-t');if(P.tm.length)tm.innerHTML=P.tm.map(function(x){return '<div><dt>'+esc(x[0])+'</dt><dd>'+esc(x[1])+'</dd></div>'}).join('');else tm.hidden=true;
  var like=$('pj-like');if(like)like.dataset.tg=P.like;
  /* Галерея: остальные кадры проекта, по нажатию — во весь экран. */
  var gal=$('pj-gal'),shots=P.img;
  if(shots.length>1){gal.innerHTML=shots.map(function(x,k){return '<button type="button" class="g-it rv a-'+(['rise','slab','floor'][k%3])+'" data-i="'+k+'"><img data-src="'+L.img+'/p-'+P.id+'_'+x[0]+'-640.webp" alt="'+esc(P.n)+'" width="'+x[1]+'" height="'+x[2]+'" decoding="async"></button>'}).join('')}
  else $('pj-gal-s').hidden=true;
  /* Ещё из того же направления: до шести, без текущего. */
  var more=list.filter(function(x){return x.id!==P.id&&x.cs.some(function(c){return P.cs.indexOf(c)>=0})}).slice(0,6);
  $('pj-more').innerHTML=more.map(function(x,k){return '<a class="pc rv a-'+(['floor','rise','slab'][k%3])+'" href="'+D.base+'?id='+x.id+'"><span class="pc-ph tilt"><span class="spot" aria-hidden="true"></span><img data-src="'+L.img+'/p-'+x.id+'_'+x.img[0][0]+'-640.webp" alt="'+esc(x.n)+'" width="640" height="'+Math.round(640*x.img[0][2]/x.img[0][1])+'" decoding="async"></span><span class="pc-bd"><span class="pc-c">'+esc(x.c.join(' · '))+'</span><b>'+esc(x.n)+'</b><span class="pc-m">'+esc(x.m)+'</span></span></a>'}).join('');
  watch(d.getElementById('pj'));reveal(d.getElementById('pj'));tilt(d.getElementById('pj'));
  /* Просмотр во весь экран: стрелки, свайп, Esc. */
  var lb=$('lb'),lbi=$('lb-i'),cur=0;
  var show=function(k){cur=(k+shots.length)%shots.length;lbi.src=big(shots[cur]);lbi.alt=P.n};
  var open=function(k){show(k);lb.hidden=false;$('lb-x').focus()};
  var close=function(){lb.hidden=true};
  gal.addEventListener('click',function(e){var b=e.target.closest('.g-it');if(b)open(+b.dataset.i)});
  $('pj-ph').addEventListener('click',function(){open(0)});
  $('lb-x').addEventListener('click',close);$('lb-p').addEventListener('click',function(){show(cur-1)});$('lb-n').addEventListener('click',function(){show(cur+1)});
  addEventListener('keydown',function(e){if(lb.hidden)return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')show(cur-1);if(e.key==='ArrowRight')show(cur+1)});
  var sx=0;lb.addEventListener('touchstart',function(e){sx=e.touches[0].clientX},{passive:true});lb.addEventListener('touchend',function(e){var dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>50)show(cur+(dx<0?1:-1))},{passive:true});
}

/* ── Расчёт проекта: что войдёт в работу и бриф архитектору ── */
var calc=$('calc');
if(calc){
  var C={};try{C=JSON.parse($('calc-data').textContent)}catch(e){}
  var area=$('area'),av=$('area-v'),ax=$('area-ex'),cl=$('calc-l'),cnn=$('calc-n'),pf=$('plan-f'),pn=$('plan-n'),pn0=pn.textContent;
  var draw=function(){
    var a=+area.value;av.textContent=sp(a);
    var ex=(C.ex||[]).filter(function(x){return a<=x[0]})[0];ax.textContent=ex?'≈ '+ex[1]:'';
    var on=qa('input[name="st"]:checked',calc),items=[];
    on.forEach(function(x){(C[x.value]||[]).forEach(function(s){items.push(s)})});
    cl.innerHTML=items.map(function(s){return '<li>'+esc(s)+'</li>'}).join('');
    if(!reduce)qa('li',cl).forEach(function(li,k){li.style.setProperty('--d',(k*40)+'ms')});
    cnn.textContent=items.length?'':L.bNone;
  };
  calc.addEventListener('input',draw);calc.addEventListener('change',draw);draw();
  pf.addEventListener('change',function(){var f=pf.files&&pf.files[0];pn.textContent=f?f.name:pn0});
  calc.addEventListener('submit',function(e){
    e.preventDefault();
    var v=function(n){var x=calc.querySelector('[name="'+n+'"]');return x?(x.value||'').trim():''};
    var done=$('calc-done'),on=qa('input[name="st"]:checked',calc);
    if(!on.length){done.textContent=L.bNone;done.hidden=false;return}
    if(!v('phone')){done.textContent=L.bNeed;done.hidden=false;return}
    var type=(calc.querySelector('[name="type"]:checked')||{}).value||'';
    var f=pf.files&&pf.files[0];
    var lines=[L.briefHead,L.bType+': '+type,L.bArea+': '+sp(+area.value)+' '+L.m2,L.bStages+': '+on.map(function(x){return x.dataset.n}).join(', '),L.bCity+': '+(v('city')||L.empty),L.bPhone+': '+v('phone')];
    if(f)lines.push(L.bFile.replace('{f}',f.name));
    tgSend(lines.join('\n'),done);
  });
}

/* ── Просмотр 360°: кадр шире экрана, тянем пальцем или мышкой, на
   телефоне ещё и наклоном. Сдвиг — transform, с инерцией. ── */
var pv=$('pano-v'),pin=$('pano-in');
if(pv&&pin){
  var x=0,v=0,drag=false,lx=0,max=0,raf2=0,dot=$('pano-dot');
  var size=function(){max=Math.max(0,pin.offsetWidth-pv.offsetWidth);x=Math.min(0,Math.max(-max,x||-max/2));paint()};
  var paint=function(){pin.style.transform='translate3d('+x.toFixed(1)+'px,0,0)';if(dot)dot.style.transform='translate3d('+(max?(-x/max)*100:50).toFixed(1)+'%,0,0)'};
  var spin=function(){raf2=0;if(drag||Math.abs(v)<.2)return;x=Math.min(0,Math.max(-max,x+v));v*=.94;paint();raf2=requestAnimationFrame(spin)};
  pv.addEventListener('pointerdown',function(e){drag=true;lx=e.clientX;v=0;pv.setPointerCapture(e.pointerId);pv.classList.add('grab')});
  pv.addEventListener('pointermove',function(e){if(!drag)return;var dx=e.clientX-lx;lx=e.clientX;v=dx;x=Math.min(0,Math.max(-max,x+dx));paint()});
  var up=function(){if(!drag)return;drag=false;pv.classList.remove('grab');if(!reduce&&!raf2)raf2=requestAnimationFrame(spin)};
  pv.addEventListener('pointerup',up);pv.addEventListener('pointercancel',up);
  pv.addEventListener('keydown',function(e){if(e.key==='ArrowLeft'){x=Math.min(0,x+60);paint()}if(e.key==='ArrowRight'){x=Math.max(-max,x-60);paint()}});
  if(!reduce&&'DeviceOrientationEvent' in window)addEventListener('deviceorientation',function(e){if(drag||e.gamma==null)return;x=Math.min(0,Math.max(-max,-max/2-e.gamma/30*max/2));paint()},{passive:true});
  var im=pin.querySelector('img');if(im)im.addEventListener('load',size);
  addEventListener('resize',size);size();
}

/* ── Параллакс: фото первого экрана без истории уходит медленнее страницы ── */
qa('[data-depth]').forEach(function(img){if(reduce)return;var sec=img.closest('section'),on=false,raf=0;
  var f=function(){raf=0;if(!on)return;var r=sec.getBoundingClientRect(),p=(innerHeight-r.top)/(innerHeight+r.height);img.style.transform='translate3d(0,'+((p-.5)*-90).toFixed(1)+'px,0) scale(1.14)';raf=requestAnimationFrame(f)};
  new IntersectionObserver(function(es){on=es[0].isIntersecting;if(on&&!raf)raf=requestAnimationFrame(f)}).observe(sec)});

/* ── Было / стало ── */
qa('[data-ba]').forEach(function(box){var r=box.querySelector('input');var s=function(){box.style.setProperty('--x',r.value+'%')};r.addEventListener('input',s);s()});

/* ── Конструктор: тумблер — настоящий блок на странице ── */
var KEY='lp-kit-v1',inputs=qa('input[data-k][data-p]');
if(inputs.length){
  var price={},needs={},def={},title={};
  inputs.forEach(function(x){var k=x.dataset.k;price[k]=+x.dataset.p;needs[k]=(x.dataset.needs||'').split(' ').filter(Boolean);if(x.hasAttribute('data-def'))def[k]=true;var r=x.closest('label'),tt=r&&r.querySelector('b');if(tt&&!title[k])title[k]=tt.textContent});
  var onK=store.get(KEY,null)||{};Object.keys(price).forEach(function(k){if(!(k in onK))onK[k]=!!def[k]});
  var pill=$('kd-pill'),panel=$('kd'),kb=+(L.kitBase||0);
  var applyK=function(fresh){
    Object.keys(price).forEach(function(k){
      root.classList.toggle('k-no-'+k,!onK[k]);
      qa('[data-addon="'+k+'"]').forEach(function(el){if(el.id==='intro')return;el.hidden=!onK[k];if(fresh===k&&onK[k]&&!reduce){el.classList.remove('k-fresh');void el.offsetWidth;el.classList.add('k-fresh')}});
      qa('[data-addon-off="'+k+'"]').forEach(function(el){el.hidden=!!onK[k]});
    });
    inputs.forEach(function(x){x.checked=!!onK[x.dataset.k]});
    var ids=Object.keys(price).filter(function(k){return onK[k]}),add=ids.reduce(function(s,k){return s+price[k]},0),sum=kb+add;
    var set=function(id,v){var el=$(id);if(el)el.textContent=v};
    set('kd-pill-sum',money(sum));set('kd-sum',money(sum));set('kd-add','+'+money(add));set('kd-n',(L.kitN||'').replace('{n}',ids.length));
    set('kit-sum',money(sum));set('kit-n',(L.kitN||'').replace('{n}',ids.length));
    root.dataset.kit=L.kitTg+'\n'+L.kitBaseName+' · '+money(kb)+'\n'+ids.map(function(k){return title[k]+' · '+money(price[k])}).join('\n')+'\n'+L.kitTotal+': '+money(sum);
    store.set(KEY,onK);
    if(fresh==='story'&&onK.story)location.reload();
  };
  var setK=function(k,v){onK[k]=v;if(v)needs[k].forEach(function(n){if((n in onK)&&!onK[n])setK(n,true)});else Object.keys(needs).forEach(function(o){if(onK[o]&&needs[o].indexOf(k)>=0)setK(o,false)})};
  inputs.forEach(function(x){x.addEventListener('change',function(){setK(x.dataset.k,x.checked);applyK(x.checked?x.dataset.k:'')})});
  var openK=function(v){if(!panel)return;panel.hidden=!v;pill.setAttribute('aria-expanded',String(v));pill.hidden=v};
  if(pill)pill.addEventListener('click',function(){openK(true)});
  var xb=$('kd-x');if(xb)xb.addEventListener('click',function(){openK(false)});
  addEventListener('keydown',function(e){if(e.key==='Escape'&&panel&&!panel.hidden)openK(false)});
  var rs=$('kd-reset');if(rs)rs.addEventListener('click',function(){Object.keys(price).forEach(function(k){onK[k]=!!def[k]});applyK('')});
  var cp=$('kd-copy');if(cp)cp.addEventListener('click',function(){try{navigator.clipboard.writeText(root.dataset.kit).then(function(){var o=cp.textContent;cp.textContent=L.copied;setTimeout(function(){cp.textContent=o},1400)})}catch(e){}});
  applyK('');
}
})();
