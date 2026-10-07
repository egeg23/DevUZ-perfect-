(function(){
'use strict';
/* main — сцены по прокрутке (позиция читается в кадре, только transform и
   opacity, без перехвата прокрутки), поиск, каталог, избранное, валюта,
   ипотека, подбор, «было / стало», приложение, конструктор. */
var d=document,root=d.documentElement,$=function(id){return d.getElementById(id)};
var L={};try{L=JSON.parse($('i18n').textContent)}catch(e){}
var reduce=false;try{reduce=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
var store={get:function(k,f){try{var v=localStorage.getItem(k);return v?JSON.parse(v):f}catch(e){return f}},set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
var money=function(n){return '$'+String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ')};
var spaced=function(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')};
var clamp=function(x,a,b){return x<a?a:x>b?b:x};
var qa=function(s,el){return [].slice.call((el||d).querySelectorAll(s))};
var calm=function(){return reduce||root.classList.contains('k-no-motion')};
var params=new URLSearchParams(location.search);

/* Без заставки (другая страница, второй заход, приложение) — первый экран сразу. */
if(root.classList.contains('intro-off')||!$('intro')){var h0=$('hero');if(h0)h0.classList.add('hero-on')}

/* ── Появление блоков: у каждого своё движение ── */
var rv=qa('.rv');
if('IntersectionObserver' in window&&!reduce){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
  rv.forEach(function(el){io.observe(el)});
}else rv.forEach(function(el){el.classList.add('in')});

/* ── Шапка над фото: прозрачная, после первого экрана — плотная ── */
if(d.body.classList.contains('home')){
  var top=function(){d.body.classList.toggle('scrolled',scrollY>innerHeight*.6)};
  addEventListener('scroll',top,{passive:true});top();
}

/* ── Сцены по прокрутке: один requestAnimationFrame, пока блок на экране ── */
function scene(el,draw){
  if(!el||reduce)return;
  var active=false,raf=0,last=null;
  function frame(){
    raf=0;if(!active)return;
    var r=el.getBoundingClientRect(),k=r.top+'|'+innerHeight;
    if(k!==last){last=k;if(!calm())draw(r)}
    raf=requestAnimationFrame(frame);
  }
  new IntersectionObserver(function(es){active=es[0].isIntersecting;if(active&&!raf)raf=requestAnimationFrame(frame)}).observe(el);
}
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
        ph.style.transform='translate3d(0,'+(y*.35).toFixed(1)+'px,0) scale('+(1+p*.08).toFixed(4)+')';
        fcs.forEach(function(c,i){var k=+c.dataset.depth||1;c.style.transform='translate3d('+(mx*k*-28).toFixed(1)+'px,'+(-y*.18*k+my*k*-20).toFixed(1)+'px,0) rotate('+((i-1)*2+mx*k*3).toFixed(2)+'deg)'});}
    }
    hraf=requestAnimationFrame(hloop);
  };
  new IntersectionObserver(function(es){act=es[0].isIntersecting;if(act&&!hraf)hraf=requestAnimationFrame(hloop)}).observe(hero);
}
qa('[data-scene="band"],.band').forEach(function(b){
  var bp=b.querySelector('[data-l="band"]');if(!bp)return;
  scene(b,function(r){var c=(r.top+r.height/2-innerHeight/2);bp.style.transform='translate3d(0,'+(c*-.18)+'px,0) scale(1.04)'});
});
/* Смещение блоков: соседние шаги едут с разной скоростью. */
qa('.shift').forEach(function(el){
  var k=+el.dataset.shift||0;
  scene(el,function(r){if(innerWidth<1024){el.style.transform='';return}var c=(r.top+r.height/2-innerHeight/2);el.style.transform='translate3d(0,'+(c*k)+'px,0)'});
});

/* ── Слово в заголовке меняется (Magic UI Word Rotate) ── */
var rot=d.querySelector('.hero h1 .rot');
if(rot&&!reduce){
  var ws=qa('span',rot),wi=0;
  setInterval(function(){if(d.hidden||calm())return;var a=ws[wi];wi=(wi+1)%ws.length;var b=ws[wi];a.classList.remove('on');a.classList.add('out');b.classList.remove('out');b.classList.add('on');setTimeout(function(){a.classList.remove('out')},700)},2400);
}

/* ── Числа катятся (Magic UI Number Ticker) ── */
qa('[data-count]').forEach(function(el){
  var to=+el.dataset.count,from=+(el.dataset.from||0);
  if(reduce||!('IntersectionObserver' in window))return;
  el.textContent=String(from);
  var o=new IntersectionObserver(function(es){if(!es[0].isIntersecting)return;o.disconnect();var t0=performance.now();
    (function f(now){var p=clamp((now-t0)/1400,0,1),e=1-Math.pow(1-p,4);el.textContent=String(Math.round(from+(to-from)*e));if(p<1)requestAnimationFrame(f)})(t0)});
  o.observe(el);
});

/* ── Валюта: $ · сумы · евро — курс из их же карточки объекта ── */
var CUR=store.get('sh-cur','usd'),R=L.rate||{sum:1,eur:1};
function fmt(n,c){return c==='sum'?spaced(n*R.sum)+' '+(L.sum||''):c==='eur'?'€'+spaced(n*R.eur):money(n)}
function applyCur(){
  qa('[data-cur]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.cur===CUR))});
  qa('[data-p]').forEach(function(el){el.textContent=fmt(+el.dataset.p,CUR)});
  qa('[data-pm]').forEach(function(el){el.textContent=fmt(+el.dataset.pm,CUR)+(L.perM||'')});
  root.classList.toggle('cur-sum',CUR==='sum');
  favBar();
}
qa('[data-cur]').forEach(function(b){b.addEventListener('click',function(){CUR=b.dataset.cur;store.set('sh-cur',CUR);applyCur()})});
applyCur();

/* ── Избранное: в телефоне, без регистрации ── */
var FAV=store.get('sh-fav',[]);
function favDraw(){
  qa('[data-fav]').forEach(function(b){b.setAttribute('aria-pressed',String(FAV.indexOf(+b.dataset.fav)>=0))});
  qa('[data-favn]').forEach(function(n){n.textContent=String(FAV.length);n.hidden=!FAV.length});
}
qa('[data-fav]').forEach(function(b){b.addEventListener('click',function(e){e.preventDefault();var id=+b.dataset.fav,i=FAV.indexOf(id);if(i>=0)FAV.splice(i,1);else{FAV.push(id);if(!reduce){b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop')}}store.set('sh-fav',FAV);favDraw();if(cat)filter()})});
favDraw();

/* ── Поиск на первом экране ── */
var sf=$('search');
if(sf){
  var tabs=qa('.s-tabs button',sf),bar=sf.querySelector('.s-tabs i');
  tabs.forEach(function(b,i){b.addEventListener('click',function(){tabs.forEach(function(x){x.setAttribute('aria-selected',String(x===b))});bar.style.setProperty('--t',String(i));sf.elements.deal.value=b.dataset.deal})});
  qa('[data-room]',sf).forEach(function(b){b.addEventListener('click',function(){var on=b.getAttribute('aria-pressed')!=='true';qa('[data-room]',sf).forEach(function(x){x.setAttribute('aria-pressed','false')});b.setAttribute('aria-pressed',String(on));sf.elements.rooms.value=on?b.dataset.room:''})});
  sf.addEventListener('submit',function(e){
    e.preventDefault();var q=new URLSearchParams();
    ['deal','type','dist','max','rooms'].forEach(function(k){var v=sf.elements[k]&&sf.elements[k].value;if(v&&!(k==='deal'&&v==='buy'))q.set(k,v)});
    location.href=sf.getAttribute('action')+(q.toString()?'?'+q:'');
  });
}

/* ── Каталог: фильтры одной лентой, счётчик сразу ── */
var cat=$('cat');
var F={deal:params.get('deal')||'buy',type:params.get('type')||'',rooms:params.get('rooms')||'',mort:'',fav:params.get('fav')||'',dist:params.get('dist')||'',max:params.get('max')||''};
function match(c,f){
  var id=+c.dataset.id,ok=f.deal==='buy';
  if(f.type&&c.dataset.type!==f.type)ok=false;
  if(f.rooms&&(f.rooms==='4'?+c.dataset.rooms<4:c.dataset.rooms!==f.rooms))ok=false;
  if(f.mort&&c.dataset.mort!=='1')ok=false;
  if(f.fav&&FAV.indexOf(id)<0)ok=false;
  if(f.dist!==''&&c.dataset.dist!==f.dist)ok=false;
  if(f.max&&+c.dataset.usd>+f.max)ok=false;
  return ok;
}
function fname(k){var N=L.fNames||{};if(k==='type')return (N.type||{})[F.type]||F.type;if(k==='rooms')return (N.rooms||'').replace('{v}',F.rooms==='4'?'4+':F.rooms);return N[k]||k}
function filter(){
  var n=0,cards=qa('.lc',cat);
  qa('.lcw',cat).forEach(function(w){var ok=match(w.querySelector('.lc'),F);w.hidden=!ok;if(ok)n++});
  $('cat-empty').hidden=n>0;
  $('cat-n').textContent=(L.found||'').replace('{n}',n);
  qa('#filters [data-f]').forEach(function(b){b.setAttribute('aria-pressed',String(F[b.dataset.f]===b.dataset.v))});
  var ds=$('cat-dist');if(ds)ds.value=F.dist;
  /* Ничего не нашлось — подсказываем, какой фильтр снять (как подбор Golden House). */
  var rx=$('cat-relax');
  if(rx){rx.innerHTML='';if(!n)['type','rooms','dist','max','mort','fav','deal'].forEach(function(k){
    var on=k==='deal'?F.deal!=='buy':!!F[k];if(!on)return;
    var g={};Object.keys(F).forEach(function(x){g[x]=F[x]});g[k]=k==='deal'?'buy':'';
    var m=cards.filter(function(c){return match(c,g)}).length;if(!m)return;
    var b=d.createElement('button');b.type='button';b.className='chip';b.textContent=(L.relax||'').replace('{f}',fname(k)).replace('{n}',m);
    b.addEventListener('click',function(){F[k]=g[k];filter()});rx.appendChild(b);
  });if(!n&&!rx.children.length){var r=d.createElement('button');r.type='button';r.className='chip';r.textContent=L.reset||'';r.addEventListener('click',function(){F={deal:'buy',type:'',rooms:'',mort:'',fav:'',dist:'',max:''};filter()});rx.appendChild(r)}}
  /* Фильтры — в адресе: ссылку на подборку можно переслать (как каталог MAVERA). */
  try{var q=new URLSearchParams();Object.keys(F).forEach(function(k){if(F[k]&&!(k==='deal'&&F[k]==='buy'))q.set(k,F[k])});history.replaceState(null,'',location.pathname+(q.toString()?'?'+q:''))}catch(e){}
  favBar();
}
/* Подборка из избранного — в Telegram одним сообщением (как «В подборку» у MAVERA). */
function favBar(){
  var bar=$('fav-bar');if(!bar||!cat)return;
  var picked=qa('.lc',cat).filter(function(c){return FAV.indexOf(+c.dataset.id)>=0});
  bar.hidden=!picked.length;if(!picked.length)return;
  $('fav-n').textContent=(L.favN||'').replace('{n}',picked.length);
  var base=location.origin+(L.base||'');
  var txt=(L.favHead||'')+'\n'+picked.map(function(c){return '• '+c.dataset.name+' — '+fmt(+c.dataset.usd,CUR)+' (ID '+c.dataset.id+')'}).join('\n');
  $('fav-share').href='https://t.me/share/url?url='+encodeURIComponent(base+'/katalog?fav=1')+'&text='+encodeURIComponent(txt);
}
if(cat){
  qa('#filters [data-f]').forEach(function(b){b.addEventListener('click',function(){var k=b.dataset.f;F[k]=k==='deal'?b.dataset.v:(F[k]===b.dataset.v?'':b.dataset.v);filter()})});
  $('cat-dist').addEventListener('change',function(){F.dist=this.value;filter()});
  filter();
}

/* ── Новостройки: фильтр по классу ── */
var zf=$('zk-f');
if(zf)qa('[data-cls]',zf).forEach(function(b){b.addEventListener('click',function(){qa('[data-cls]',zf).forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});qa('#zk .zc').forEach(function(c){c.hidden=!!b.dataset.cls&&c.dataset.cls!==b.dataset.cls})})});

/* ── Галерея объекта ── */
var gal=$('gal');
if(gal){
  var th=qa('#thumbs button'),gn=$('gal-n'),cnt=th.length;
  var cur=function(){var k=Math.round(gal.scrollLeft/gal.clientWidth);th.forEach(function(b,i){b.setAttribute('aria-current',String(i===k))});gn.textContent=(k+1)+' / '+cnt};
  gal.addEventListener('scroll',function(){requestAnimationFrame(cur)},{passive:true});
  th.forEach(function(b,i){b.addEventListener('click',function(){gal.scrollTo({left:i*gal.clientWidth,behavior:reduce?'auto':'smooth'})})});
}

/* ── Ипотека: аннуитет ── */
var mf=$('mort');
if(mf){
  var calc=function(){
    var P=+mf.dataset.usd,dp=+$('m-d').value,y=+$('m-y').value,r=+$('m-r').value/1200,n=y*12,S=P*(1-dp/100);
    var pay=r?S*r/(1-Math.pow(1+r,-n)):S/n;
    $('m-dv').textContent=dp+'%';$('m-yv').textContent=y;$('m-rv').textContent=$('m-r').value;
    var el=$('m-pay');el.dataset.p=String(Math.round(pay));el.textContent=fmt(Math.round(pay),CUR);
    var lo=$('m-loan'),ov=$('m-over');if(lo){lo.dataset.p=String(Math.round(S));lo.textContent=fmt(Math.round(S),CUR)}if(ov){var o=Math.max(0,pay*n-S);ov.dataset.p=String(Math.round(o));ov.textContent=fmt(Math.round(o),CUR)}
  };
  mf.addEventListener('input',calc);calc();
  qa('[data-cur]').forEach(function(b){b.addEventListener('click',calc)});
}

/* ── Запись на просмотр объекта (как бронь и заявка у MAVERA) ── */
var vf=$('viewf');
if(vf){
  var vd=$('v-days'),now=new Date(Date.now()+5*36e5),out=[];
  for(var k=0;out.length<6&&k<8;k++){var dt=new Date(now.getTime()+k*864e5);if(k===0&&now.getUTCHours()>=17)continue;out.push({k:k,lab:k===0?L.today:k===1?L.tomorrow:L.days[dt.getUTCDay()]+', '+dt.getUTCDate()+' '+L.months[dt.getUTCMonth()]})}
  vd.innerHTML=out.map(function(x){return '<label class="opt"><input type="radio" name="vd" value="'+x.lab+'" data-k="'+x.k+'"><span>'+x.lab+'</span></label>'}).join('');
  var vtimes=function(){var c=vf.querySelector('input[name="vd"]:checked'),today=c&&c.dataset.k==='0',h=now.getUTCHours();qa('input[name="vh"]',vf).forEach(function(x){var dis=today&&parseInt(x.value,10)<=h;x.disabled=dis;if(dis)x.checked=false})};
  vf.addEventListener('change',vtimes);
  vf.addEventListener('submit',function(e){
    e.preventDefault();
    var dd=vf.querySelector('input[name="vd"]:checked'),hh=vf.querySelector('input[name="vh"]:checked'),ph=($('v-ph').value||'').trim(),err=$('v-err'),done=$('v-done');
    if(!dd||!hh||ph.replace(/\D/g,'').length<9){err.textContent=L.vNeed;err.hidden=false;done.hidden=true;return}
    err.hidden=true;
    var id=(location.search.match(/[?&]id=(\d+)/)||[])[1]||'149645';
    var msg=L.vHead+'\n'+L.vObj+': ID '+id+' — '+L.objName+'\n'+L.vWhen+': '+dd.value+', '+hh.value+'\n'+L.fPhone+': '+ph;
    try{navigator.clipboard.writeText(msg)}catch(x){}
    done.textContent=L.vSent;done.hidden=false;window.open(L.adminUrl,'_blank','noopener');
  });
}

/* ── Подбор: заявка → Telegram администратора ── */
var book=$('book');
if(book){
  var val=function(n){var x=book.querySelector('input[name="'+n+'"]:checked');return x?x.value:''};
  var fld=function(id){return ($(id).value||'').trim()};
  var text=function(){return L.msgHead+'\n'+L.fDeal+': '+(val('deal')||'—')+'\n'+L.fType+': '+(val('type')||'—')+'\n'+L.fWhere+': '+(val('where')||'—')+'\n'+L.fRooms+': '+(val('rooms')||'—')+'\n'+L.fBudget+': '+(fld('budget')||'—')+'\n'+L.fWish+': '+(fld('wish')||'—')+'\n'+L.fName+': '+(fld('nm')||'—')+'\n'+L.fPhone+': '+(fld('ph')||'—')};
  var draw=function(){var m=$('msg');if(m)m.textContent=text();var t=new Date(Date.now()+5*36e5),mt=$('msg-t');if(mt)mt.textContent=('0'+t.getUTCHours()).slice(-2)+':'+('0'+t.getUTCMinutes()).slice(-2)};
  book.addEventListener('input',draw);book.addEventListener('change',draw);draw();
  book.addEventListener('submit',function(e){
    e.preventDefault();
    var err=$('err'),done=$('done'),digits=fld('ph').replace(/\D/g,'');
    if(!val('deal')||!val('type')||!val('where')||digits.length<9){err.textContent=L.need;err.hidden=false;done.hidden=true;return}
    err.hidden=true;try{navigator.clipboard.writeText(text())}catch(x){}
    done.textContent=L.sent;done.hidden=false;window.open(L.adminUrl,'_blank','noopener');
  });
}

/* ── Было / стало ── */
qa('[data-ba]').forEach(function(box){var r=box.querySelector('input');var s=function(){box.style.setProperty('--x',r.value+'%')};r.addEventListener('input',s);s()});

/* ── Сайт как приложение ── */
var base=(L.base||'').replace(/\/uz$/,'');
if('serviceWorker' in navigator&&base)addEventListener('load',function(){navigator.serviceWorker.register(base+'/sw',{scope:base+'/'}).catch(function(){})});
var deferred=null;
addEventListener('beforeinstallprompt',function(e){e.preventDefault();deferred=e});
addEventListener('appinstalled',function(){qa('[data-install]').forEach(function(b){b.textContent=L.installed})});
var ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
qa('[data-install]').forEach(function(b){b.addEventListener('click',function(){if(deferred){deferred.prompt();deferred.userChoice.then(function(){deferred=null});return}var bx=b.parentNode.querySelector('[data-ios]');if(bx)bx.classList.toggle('on')})});
if(!ios){qa('[data-ios] b').forEach(function(b){b.textContent=L.lang==='ru'?'Как добавить на Android':'Android’ga qanday qo‘shish'});qa('[data-ios] ol').forEach(function(o){o.innerHTML=L.lang==='ru'?'<li>Откройте меню браузера ⋮</li><li>Выберите «Установить приложение» или «Добавить на главный экран»</li>':'<li>Brauzer menyusini oching ⋮</li><li>«Ilovani o‘rnatish» yoki «Bosh ekranga qo‘shish»ni tanlang</li>'})}

/* ── Конструктор: тумблер — настоящий блок на странице ── */
var KEY='sh-kit-v1',inputs=qa('input[data-k][data-p]');
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
    if(!on.cur&&CUR!=='usd'){CUR='usd';store.set('sh-cur',CUR);applyCur()}
    inputs.forEach(function(x){x.checked=!!on[x.dataset.k]});
    qa('.kit-pv[data-pv]').forEach(function(p){p.hidden=!on[p.dataset.pv];p.classList.toggle('fresh',p.dataset.pv===fresh&&!reduce)});
    var ids=Object.keys(price).filter(function(k){return on[k]}),add=ids.reduce(function(s,k){return s+price[k]},0),sum=kb+add;
    var set=function(id,v){var el=$(id);if(el)el.textContent=v};
    set('kd-pill-sum',money(sum));set('kd-sum',money(sum));set('kd-add','+'+money(add));set('kd-n',(L.kitN||'').replace('{n}',ids.length));
    set('kit-sum',money(sum));set('kit-n',(L.kitN||'').replace('{n}',ids.length));
    root.dataset.kit=L.kitTg+'\n'+L.kitBaseName+' — '+money(kb)+'\n'+ids.map(function(k){return title[k]+' — '+money(price[k])}).join('\n')+'\n'+L.kitTotal+': '+money(sum);
    store.set(KEY,on);
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
