(function(){
'use strict';
/* main — сцены по прокрутке (позиция читается в кадре, только transform и
   opacity, прокрутка не перехватывается), расчёт по размерам с заявкой в
   WhatsApp, каталог, объект, «было / стало», конструктор. */
var d=document,root=d.documentElement,$=function(id){return d.getElementById(id)};
var L={};try{L=JSON.parse($('i18n').textContent)}catch(e){}
var reduce=false;try{reduce=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
var store={get:function(k,f){try{var v=localStorage.getItem(k);return v?JSON.parse(v):f}catch(e){return f}},set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
var money=function(n){return '$'+String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ')};
var spaced=function(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')};
var clamp=function(x,a,b){return x<a?a:x>b?b:x};
var smooth=function(a,b,x){var t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
var qa=function(s,el){return [].slice.call((el||d).querySelectorAll(s))};
var calm=function(){return reduce||root.classList.contains('k-no-motion')};
var params=new URLSearchParams(location.search);
var wa=function(text){return 'https://wa.me/'+L.wa+'?text='+encodeURIComponent(text)};

/* Без заставки (другая страница, второй заход) — первый экран сразу. */
if(root.classList.contains('intro-off')||!$('intro')){var h0=$('hero');if(h0)h0.classList.add('hero-on')}

/* ── Появление блоков: у каждого своё движение ── */
var rv=qa('.rv');
if('IntersectionObserver' in window&&!reduce){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
  rv.forEach(function(el){io.observe(el)});
}else rv.forEach(function(el){el.classList.add('in')});

/* ── Пятно света за курсором на карточках (только мышь, только transform) ── */
var hov=false;try{hov=matchMedia('(hover:hover) and (pointer:fine)').matches}catch(e){}
if(hov&&!reduce)qa('.spot').forEach(function(sp){var card=sp.parentNode;
  card.addEventListener('pointermove',function(e){var r=card.getBoundingClientRect();sp.style.transform='translate3d('+(e.clientX-r.left).toFixed(0)+'px,'+(e.clientY-r.top).toFixed(0)+'px,0)'})});

/* ── Шапка над чертежом: прозрачная, после первого экрана — плотная ── */
if(d.body.classList.contains('home')){
  var top=function(){d.body.classList.toggle('scrolled',scrollY>innerHeight*.6)};
  addEventListener('scroll',top,{passive:true});top();
}

/* ── Сцена по прокрутке: один requestAnimationFrame, пока блок на экране ── */
function scene(el,draw,always){
  if(!el||reduce)return;
  var active=false,raf=0,last=null;
  function frame(){
    raf=0;if(!active)return;
    var r=el.getBoundingClientRect(),k=r.top+'|'+r.height+'|'+innerHeight+'|'+innerWidth;
    if(k!==last){last=k;if(always||!calm())draw(r)}
    raf=requestAnimationFrame(frame);
  }
  new IntersectionObserver(function(es){active=es[0].isIntersecting;if(active&&!raf)raf=requestAnimationFrame(frame)}).observe(el);
}

/* ── Первый экран: чертёж уходит медленнее страницы, карточки — по глубине ── */
var hero=$('hero');
if(hero&&!reduce){
  var ph=hero.querySelector('[data-l="ph"]'),fcs=qa('.fc',hero),mx=0,my=0,tx=0,ty=0,act=false,hraf=0,hlast='';
  if(matchMedia('(hover:hover)').matches)hero.addEventListener('pointermove',function(e){tx=e.clientX/innerWidth-.5;ty=e.clientY/innerHeight-.5});
  var hloop=function(){
    hraf=0;if(!act)return;
    if(!calm()){
      mx+=(tx-mx)*.08;my+=(ty-my)*.08;
      var y=Math.max(0,-hero.getBoundingClientRect().top),key=Math.round(y)+'|'+mx.toFixed(3)+'|'+my.toFixed(3);
      if(key!==hlast){hlast=key;var p=clamp(y/innerHeight,0,1.2);
        ph.style.transform='translate3d('+(mx*-14).toFixed(1)+'px,'+(y*.32+my*-10).toFixed(1)+'px,0) scale('+(1.02+p*.08).toFixed(4)+')';
        fcs.forEach(function(c,i){var k=+c.dataset.depth||1;c.style.transform='translate3d('+(mx*k*-26).toFixed(1)+'px,'+(-y*.16*k+my*k*-18).toFixed(1)+'px,0) rotate('+((i-1)*2+mx*k*3).toFixed(2)+'deg)'});}
    }
    hraf=requestAnimationFrame(hloop);
  };
  new IntersectionObserver(function(es){act=es[0].isIntersecting;if(act&&!hraf)hraf=requestAnimationFrame(hloop)}).observe(hero);
}

/* ── Мерцающая сетка над чертежом: десять кадров в секунду, только пока
   первый экран виден; перерисовываются лишь сменившиеся клетки ── */
var fl=d.querySelector('.hero .flick');
if(fl&&fl.getContext&&!reduce){
  var fx=fl.getContext('2d'),G=9,SQ=3,fw=0,fh=0,cols=0,rows=0,cell=null,fdpr=1,fon=false,fraf=0,ft=0;
  var fcol=function(i){return (i*7919)%41===0?'214,232,64':'232,238,247'};
  var fput=function(i){var x=(i%cols)*G,y=Math.floor(i/cols)*G;fx.clearRect(x,y,SQ,SQ);fx.fillStyle='rgba('+fcol(i)+','+cell[i].toFixed(2)+')';fx.fillRect(x,y,SQ,SQ)};
  var fsize=function(){var r=fl.getBoundingClientRect();fdpr=Math.min(devicePixelRatio||1,2);fw=r.width;fh=r.height;fl.width=Math.round(fw*fdpr);fl.height=Math.round(fh*fdpr);fx.setTransform(fdpr,0,0,fdpr,0,0);
    cols=Math.ceil(fw/G);rows=Math.ceil(fh/G);cell=new Float32Array(cols*rows);for(var i=0;i<cell.length;i++){cell[i]=Math.random()*.32;fput(i)}};
  var ftick=function(t){fraf=0;if(!fon)return;fraf=requestAnimationFrame(ftick);if(t-ft<100||d.hidden||calm())return;ft=t;
    for(var n=Math.round(cell.length*.025);n>0;n--){var i=(Math.random()*cell.length)|0;cell[i]=Math.random()<.12?.45+Math.random()*.3:Math.random()*.3;fput(i)}};
  fsize();addEventListener('resize',function(){if(Math.abs(fl.getBoundingClientRect().width-fw)>1)fsize()});
  new IntersectionObserver(function(es){fon=es[0].isIntersecting;if(fon&&!fraf)fraf=requestAnimationFrame(ftick)}).observe(fl);
}

/* ── Слово в заголовке меняется ── */
var rot=d.querySelector('.hero h1 .rot');
if(rot&&!reduce){
  var ws=qa('span',rot),wi=0;
  setInterval(function(){if(d.hidden||calm())return;var a=ws[wi];wi=(wi+1)%ws.length;var b=ws[wi];a.classList.remove('on');a.classList.add('out');b.classList.remove('out');b.classList.add('on');setTimeout(function(){a.classList.remove('out')},700)},2400);
}

/* ── Числа катятся ── */
qa('[data-count]').forEach(function(el){
  var to=+el.dataset.count,from=+(el.dataset.from||0),suf=el.dataset.suf||'';
  if(reduce||!('IntersectionObserver' in window))return;
  el.textContent=spaced(from)+suf;
  var o=new IntersectionObserver(function(es){if(!es[0].isIntersecting)return;o.disconnect();var t0=performance.now();
    (function f(now){var p=clamp((now-t0)/1400,0,1),e=1-Math.pow(1-p,4);el.textContent=spaced(from+(to-from)*e)+suf;if(p<1)requestAnimationFrame(f)})(t0)});
  o.observe(el);
});

/* ── Объекты лентой: листаете вниз, лента едет вбок. Выключили — обычная лента пальцем ── */
var trk=$('trk');
function trackSet(){
  if(!trk)return;
  var row=trk.querySelector('.trk-row'),live=!reduce&&!root.classList.contains('k-no-track')&&innerWidth>=640;
  trk.classList.toggle('live',live);
  if(!live){trk.style.height='';row.style.transform='';return}
  var dist=Math.max(0,row.scrollWidth-innerWidth+32);
  trk.style.height=(innerHeight+dist)+'px';trk.dataset.dist=String(dist);
}
if(trk){
  trackSet();addEventListener('resize',trackSet);d.addEventListener('pv-kit',trackSet);
  scene(trk,function(r){if(!trk.classList.contains('live'))return;var dist=+trk.dataset.dist||0,p=clamp(-r.top/Math.max(1,r.height-innerHeight),0,1);trk.querySelector('.trk-row').style.transform='translate3d('+(-p*dist).toFixed(1)+'px,0,0)'},true);
}

/* ── Карточка в средней полосе экрана — в цвете ── */
if(trk&&'IntersectionObserver' in window){
  var lit=new IntersectionObserver(function(es){es.forEach(function(e){e.target.classList.toggle('lit',e.isIntersecting)})},{rootMargin:'0px -32% 0px -32%'});
  qa('.oc',trk).forEach(function(c){lit.observe(c)});
}
/* ── Наклон карточки за курсором, без пружин: ровно и мягко ── */
if(hov&&!reduce)qa('.oc:not(.more)').forEach(function(c){
  c.addEventListener('pointermove',function(e){if(calm())return;var r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
    c.classList.remove('tilt-off');c.classList.add('tilt');c.style.transform='perspective(900px) rotateX('+(-y*7).toFixed(2)+'deg) rotateY('+(x*9).toFixed(2)+'deg) translateZ(0)'});
  c.addEventListener('pointerleave',function(){c.classList.remove('tilt');c.classList.add('tilt-off');c.style.transform=''});
});

/* ── Символы перебираются и встают на место — по мотивам «Hyper Text»
   (@dillionverma, 21st.dev, MIT): при появлении и при наведении ── */
var POOL={c:'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯ',l:'ABCDEFGHJKLMNPQRSTUVWXYZ',d:'0123456789'};
var hyper=function(el){
  if(el._h||calm())return;el._h=1;var fin=el.dataset.hyper,n=0,N=fin.length*3;
  (function f(){var out='';for(var i=0;i<fin.length;i++){var ch=fin[i];
      if(i<n/3||!/[0-9A-Za-zА-Яа-яЁё]/.test(ch)){out+=ch;continue}
      var pool=/[0-9]/.test(ch)?POOL.d:/[A-Za-z]/.test(ch)?POOL.l:POOL.c,r=pool[(Math.random()*pool.length)|0];
      out+=ch===ch.toLowerCase()?r.toLowerCase():r}
    el.textContent=out;if(++n<=N)setTimeout(f,32);else{el.textContent=fin;el._h=0}})();
};
var hy=qa('[data-hyper]');
if(hy.length&&!reduce&&'IntersectionObserver' in window){
  var hio=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){hio.unobserve(e.target);setTimeout(function(){hyper(e.target)},350)}})},{rootMargin:'0px 0px -12% 0px'});
  hy.forEach(function(el){hio.observe(el);var box=el.closest('.ft,.ws-hub');if(box&&hov)box.addEventListener('pointerenter',function(){hyper(el)})});
}

/* ── WebSteel: лучи от шагов к калькулятору и от него к результату.
   Точки берутся из раскладки (offset*), а не из кадра: на них не влияет
   появление блоков со сдвигом. ── */
var wsb=d.querySelector('.ws');
if(wsb){
  var svg=wsb.querySelector('.ws-beams'),core=wsb.querySelector('.ws-core'),res=wsb.querySelector('.ws-res'),ol=wsb.querySelector('ol'),lis=qa('li',ol);
  var off=function(el){var x=0,y=0,e=el;while(e&&e!==wsb){x+=e.offsetLeft;y+=e.offsetTop;e=e.offsetParent}return {x:x,y:y,w:el.offsetWidth,h:el.offsetHeight}};
  var pt=function(x,y){return x.toFixed(1)+','+y.toFixed(1)};
  var beams=function(){
    var H=off(core),S=off(res),O=off(ol),out='',k=0;
    var add=function(dd){out+='<path class="bl" d="'+dd+'"/><path class="bm" pathLength="100" style="--t:'+((k++*.41)%2.8).toFixed(2)+'s" d="'+dd+'"/>'};
    if(H.x>O.x+O.w-1){
      var hx=H.x,hy=H.y+H.h/2;
      lis.forEach(function(li){var r=off(li),x0=r.x+r.w,y0=r.y+r.h/2,mx=(x0+hx)/2;add('M'+pt(x0,y0)+'C'+pt(mx,y0)+' '+pt(mx,hy)+' '+pt(hx,hy))});
      var x1=H.x+H.w,x2=S.x,y2=S.y+S.h/2,m2=(x1+x2)/2;add('M'+pt(x1,hy)+'C'+pt(m2,hy)+' '+pt(m2,y2)+' '+pt(x2,y2));
    }else{var cx=H.x+H.w/2;add('M'+pt(cx,O.y+O.h)+'L'+pt(cx,H.y));add('M'+pt(cx,H.y+H.h)+'L'+pt(cx,S.y))}
    svg.innerHTML=out;
  };
  beams();addEventListener('resize',beams);if(d.fonts&&d.fonts.ready)d.fonts.ready.then(beams);
}

/* ── География: город в списке подсвечивает свою точку на схеме ── */
qa('.geo-list li[data-k]').forEach(function(li){
  var k=li.dataset.k,mk=qa('.geo-map [data-k="'+k+'"]');
  var on=function(v){mk.forEach(function(m){m.classList.toggle('hot',v)})};
  li.addEventListener('pointerenter',function(){on(true)});li.addEventListener('pointerleave',function(){on(false)});
});

/* ── История завода: линия растёт, пока листаете ── */
var tl=$('tl');
if(tl){var tll=tl.querySelector('.tl-line');if(reduce)tll.style.setProperty('--p','1');else{tll.style.setProperty('--p','0');scene(tl,function(r){var p=clamp((innerHeight*.7-r.top)/Math.max(1,r.height),0,1);tll.style.setProperty('--p',p.toFixed(4))},true)}}

/* ── Расчёт по размерам на первом экране ── */
function segs(box,onPick){qa('button[data-v]',box).forEach(function(b){b.addEventListener('click',function(){qa('button[data-v]',box).forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});onPick(b.dataset.v)})})}
var cfg=$('cfg');
if(cfg){
  var C={w:'18',l:'36',h:'6',ind:cfg.querySelector('select').value};
  var draw=function(){
    $('cfg-l').textContent=C.l+' м';
    $('cfg-a').textContent=spaced(+C.w*+C.l)+' м²';
    $('cfg-dims').textContent=C.w+' × '+C.l+' × '+C.h+' м';
    var text=L.cfgHead+'\n'+L.fInd+': '+C.ind+'\n'+L.fSize+': '+C.w+' × '+C.l+' × '+C.h+' м ('+spaced(+C.w*+C.l)+' м²)';
    $('cfg-go').href=wa(text);
    $('cfg-more').href=L.base+'/raschet?ind='+encodeURIComponent(C.ind)+'&w='+C.w+'&l='+C.l+'&h='+C.h;
  };
  segs($('cfg-w'),function(v){C.w=v;draw()});segs($('cfg-h'),function(v){C.h=v;draw()});
  $('cfg-lr').addEventListener('input',function(){C.l=this.value;draw()});
  cfg.querySelector('select').addEventListener('change',function(){C.ind=this.value;draw()});
  draw();
}

/* ── Каталог: отрасль одной лентой, счётчик сразу ── */
var cat=$('cat');
if(cat){
  var chips=qa('#filters [data-ind]'),secs=qa('.cat-sec',cat),cur=params.get('ind')||'';
  var filt=function(){
    var n=0;secs.forEach(function(s){var ok=!cur||s.dataset.ind===cur;s.hidden=!ok;if(ok)n+=+s.dataset.n});
    chips.forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.ind===cur))});
    $('cat-n').textContent=(L.found||'').replace('{n}',n);
    try{history.replaceState(null,'',location.pathname+(cur?'?ind='+cur:''))}catch(e){}
  };
  chips.forEach(function(b){b.addEventListener('click',function(){cur=b.dataset.ind;filt()})});
  filt();
}

/* ── Объект: карточка по ?id, галерея ── */
var objs=qa('.obj-a');
if(objs.length){
  var id=params.get('id')||objs[0].dataset.id,shown=objs.filter(function(a){return a.dataset.id===id})[0]||objs[0];
  objs.forEach(function(a){a.hidden=a!==shown});
  var t1=shown.querySelector('h1');if(t1)d.title=t1.textContent+' | '+L.name;
  qa('.oc[data-id]').forEach(function(c){c.hidden=c.dataset.id===shown.dataset.id});
  var gal=shown.querySelector('.gal-t');
  if(gal){
    var th=qa('.thumbs button',shown),gn=shown.querySelector('.gal-n'),cnt=th.length;
    var curG=function(){var k=Math.round(gal.scrollLeft/gal.clientWidth);th.forEach(function(b,i){b.setAttribute('aria-current',String(i===k))});gn.textContent=(k+1)+' / '+cnt};
    gal.addEventListener('scroll',function(){requestAnimationFrame(curG)},{passive:true});
    th.forEach(function(b,i){b.addEventListener('click',function(){gal.scrollTo({left:i*gal.clientWidth,behavior:reduce?'auto':'smooth'})})});
  }
}

/* ── Расчёт: заявка → WhatsApp завода одним сообщением ── */
var book=$('book');
if(book){
  var val=function(n){var x=book.querySelector('input[name="'+n+'"]:checked');return x?x.value:''};
  var fld=function(id){return ($(id).value||'').trim()};
  var pick=function(n,v){if(!v)return;var x=book.querySelector('input[name="'+n+'"][value="'+v+'"]');if(x)x.checked=true};
  pick('ind',params.get('ind'));pick('w',params.get('w'));pick('h',params.get('h'));
  if(params.get('l'))$('b-l').value=params.get('l');
  if(params.get('t')){$('b-type').value=params.get('t');var it=params.get('i');if(it)pick('ind',it)}
  var no=L.empty||'';
  var area=function(){var w=+val('w'),l=+fld('b-l');return w&&l?spaced(w*l)+' м²':no};
  var text=function(){return L.msgHead+'\n'+L.fInd+': '+(val('ind')||no)+(fld('b-type')?' · '+fld('b-type'):'')+'\n'+L.fSize+': '+(val('w')||'?')+' × '+(fld('b-l')||'?')+' × '+(val('h')||'?')+' м ('+area()+')\n'+L.fRoof+': '+(val('roof')||no)+'\n'+L.fHeat+': '+(val('heat')||no)+'\n'+L.fCity+': '+(fld('b-city')||no)+'\n'+L.fWish+': '+(fld('b-wish')||no)+'\n'+L.fName+': '+(fld('b-nm')||no)+'\n'+L.fPhone+': '+(fld('b-ph')||no)};
  var drawB=function(){var m=$('msg');if(m)m.textContent=text();var a=$('b-area');if(a)a.textContent=area();var t=new Date(Date.now()+5*36e5),mt=$('msg-t');if(mt)mt.textContent=('0'+t.getUTCHours()).slice(-2)+':'+('0'+t.getUTCMinutes()).slice(-2)};
  book.addEventListener('input',drawB);book.addEventListener('change',drawB);drawB();
  book.addEventListener('submit',function(e){
    e.preventDefault();
    var err=$('err'),done=$('done');
    if(!val('ind')||!val('w')||!fld('b-l')||!val('h')){err.textContent=L.need;err.hidden=false;done.hidden=true;return}
    err.hidden=true;done.textContent=L.sent;done.hidden=false;window.open(wa(text()),'_blank','noopener');
  });
}

/* ── Было / стало ── */
qa('[data-ba]').forEach(function(box){var r=box.querySelector('input');var s=function(){box.style.setProperty('--x',r.value+'%')};r.addEventListener('input',s);s()});

/* ── Конструктор: тумблер — настоящий блок на странице ── */
var KEY='pv-kit-v1',inputs=qa('input[data-k][data-p]');
if(inputs.length){
  var price={},needs={},def={},title={};
  inputs.forEach(function(x){var k=x.dataset.k;price[k]=+x.dataset.p;needs[k]=(x.dataset.needs||'').split(' ').filter(Boolean);if(x.hasAttribute('data-def'))def[k]=true;var r=x.closest('label'),tt=r&&r.querySelector('b');if(tt&&!title[k])title[k]=tt.firstChild.textContent});
  var on=store.get(KEY,null)||{};Object.keys(price).forEach(function(k){if(!(k in on))on[k]=!!def[k]});
  var pill=$('kd-pill'),panel=$('kd'),kb=+(L.kitBase||0);
  var apply=function(fresh){
    Object.keys(price).forEach(function(k){
      root.classList.toggle('k-no-'+k,!on[k]);
      qa('[data-addon="'+k+'"]').forEach(function(el){el.hidden=!on[k];if(fresh===k&&on[k]&&!reduce){el.classList.remove('k-fresh');void el.offsetWidth;el.classList.add('k-fresh')}});
    });
    inputs.forEach(function(x){x.checked=!!on[x.dataset.k]});
    qa('.kit-pv[data-pv]').forEach(function(p){p.hidden=!on[p.dataset.pv];p.classList.toggle('fresh',p.dataset.pv===fresh&&!reduce)});
    var ids=Object.keys(price).filter(function(k){return on[k]}),add=ids.reduce(function(s,k){return s+price[k]},0),sum=kb+add;
    var set=function(id,v){var el=$(id);if(el)el.textContent=v};
    set('kd-pill-sum',money(sum));set('kd-sum',money(sum));set('kd-add','+'+money(add));set('kd-n',(L.kitN||'').replace('{n}',ids.length));
    set('kit-sum',money(sum));set('kit-n',(L.kitN||'').replace('{n}',ids.length));
    root.dataset.kit=L.kitTg+'\n'+L.kitBaseName+' · '+money(kb)+'\n'+ids.map(function(k){return title[k]+' · '+money(price[k])}).join('\n')+'\n'+L.kitTotal+': '+money(sum);
    store.set(KEY,on);
    try{d.dispatchEvent(new Event('pv-kit'))}catch(e){}
  };
  var setK=function(k,v){on[k]=v;if(v)needs[k].forEach(function(n){if((n in on)&&!on[n])setK(n,true)});else Object.keys(needs).forEach(function(o){if(on[o]&&needs[o].indexOf(k)>=0)setK(o,false)})};
  inputs.forEach(function(x){x.addEventListener('change',function(){setK(x.dataset.k,x.checked);apply(x.checked?x.dataset.k:'')})});
  var open=function(v){if(!panel)return;panel.hidden=!v;pill.setAttribute('aria-expanded',String(v));pill.hidden=v};
  if(pill)pill.addEventListener('click',function(){open(true)});
  var xb=$('kd-x');if(xb)xb.addEventListener('click',function(){open(false)});
  addEventListener('keydown',function(e){if(e.key==='Escape'&&panel&&!panel.hidden)open(false)});
  var rs=$('kd-reset');if(rs)rs.addEventListener('click',function(){Object.keys(price).forEach(function(k){on[k]=!!def[k]});apply('')});
  var cp=$('kd-copy');if(cp)cp.addEventListener('click',function(){try{navigator.clipboard.writeText(root.dataset.kit).then(function(){var o=cp.textContent;cp.textContent=L.copied;setTimeout(function(){cp.textContent=o},1400)})}catch(e){}});
  apply('');
}
})();
