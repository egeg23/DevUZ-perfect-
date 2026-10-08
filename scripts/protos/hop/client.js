(function(){
'use strict';
/* main — параллакс первого экрана и «жидкое стекло», появление блоков,
   подсказки поиска по каталогу HOP.UZ, живой аукцион, мастер объявления с
   отправкой в Telegram HOP.UZ, колесо фортуны, «было / стало», конструктор.
   Анимации — transform и opacity, прокрутку только читаем. */
var d=document,root=d.documentElement,$=function(id){return d.getElementById(id)};
var L={};try{L=JSON.parse($('i18n').textContent)}catch(e){}
var reduce=false;try{reduce=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
var store={get:function(k,f){try{var v=localStorage.getItem(k);return v?JSON.parse(v):f}catch(e){return f}},set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
var money=function(n){return '$'+String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ')};
var spaced=function(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')};
var clamp=function(x,a,b){return x<a?a:x>b?b:x};
var qa=function(s,el){return [].slice.call((el||d).querySelectorAll(s))};
var calm=function(){return reduce||root.classList.contains('k-no-glass')};
var hov=false;try{hov=matchMedia('(hover:hover) and (pointer:fine)').matches}catch(e){}

/* Без заставки (другая страница, второй заход) — первый экран сразу. */
if(root.classList.contains('intro-off')||!$('intro')){var h0=$('hero');if(h0)h0.classList.add('hero-on')}

/* ── Сообщение в Telegram HOP.UZ. Готовый текст в чат Telegram не
   подставить, поэтому кладём его в буфер обмена и открываем чат: человеку
   остаётся вставить и отправить. ── */
function tgSend(text,note){
  try{navigator.clipboard.writeText(text)}catch(e){}
  if(note){note.textContent=L.sent;note.hidden=false}
  window.open(L.tg,'_blank','noopener');
}
qa('[data-tg]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();tgSend(a.dataset.tg)})});

/* ── Появление блоков: у каждого своё движение ── */
var rv=qa('.rv');
if('IntersectionObserver' in window&&!reduce){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
  rv.forEach(function(el){io.observe(el)});
}else rv.forEach(function(el){el.classList.add('in')});

/* ── Пятно света за курсором (только мышь, только transform) ── */
if(hov&&!reduce)qa('.spot').forEach(function(sp){var card=sp.parentNode;
  card.addEventListener('pointermove',function(e){var r=card.getBoundingClientRect();sp.style.transform='translate3d('+(e.clientX-r.left).toFixed(0)+'px,'+(e.clientY-r.top).toFixed(0)+'px,0)'})});

/* ── Шапка над первым экраном: прозрачная, дальше — стекло ── */
if(d.body.classList.contains('home')){
  var top=function(){d.body.classList.toggle('scrolled',scrollY>innerHeight*.6)};
  addEventListener('scroll',top,{passive:true});top();
}

/* ── Сцена по прокрутке: один кадр, пока блок на экране ── */
function scene(el,draw){
  if(!el||reduce)return;
  var active=false,raf=0,last=null;
  function frame(){raf=0;if(!active)return;var r=el.getBoundingClientRect(),k=r.top+'|'+innerHeight+'|'+innerWidth;if(k!==last){last=k;if(!calm())draw(r)}raf=requestAnimationFrame(frame)}
  new IntersectionObserver(function(es){active=es[0].isIntersecting;if(active&&!raf)raf=requestAnimationFrame(frame)}).observe(el);
}

/* ── Первый экран: красная плоскость с логотипом и стеклянные карточки
   уходят с разной скоростью и чуть следуют за курсором ── */
var hero=$('hero');
if(hero&&!reduce){
  var lay=qa('[data-depth]',hero),mx=0,my=0,tx=0,ty=0,act=false,hraf=0,hlast='';
  if(hov)hero.addEventListener('pointermove',function(e){tx=e.clientX/innerWidth-.5;ty=e.clientY/innerHeight-.5});
  var hloop=function(){
    hraf=0;if(!act)return;
    if(!calm()){
      mx+=(tx-mx)*.08;my+=(ty-my)*.08;
      var y=Math.max(0,-hero.getBoundingClientRect().top),key=Math.round(y)+'|'+mx.toFixed(3)+'|'+my.toFixed(3);
      if(key!==hlast){hlast=key;
        lay.forEach(function(n){var k=+n.dataset.depth;n.style.transform=(n.dataset.base||'')+' translate3d('+(mx*k*-22).toFixed(1)+'px,'+(-y*k*.12+my*k*-14).toFixed(1)+'px,0)'});}
    }
    hraf=requestAnimationFrame(hloop);
  };
  new IntersectionObserver(function(es){act=es[0].isIntersecting;if(act&&!hraf)hraf=requestAnimationFrame(hloop)}).observe(hero);
}

/* ── Слово меняется ── */
qa('.rot').forEach(function(rot){
  if(reduce)return;var ws=qa('span',rot),wi=0;if(ws.length<2)return;
  setInterval(function(){if(d.hidden||calm())return;var a=ws[wi];wi=(wi+1)%ws.length;var b=ws[wi];a.classList.remove('on');a.classList.add('out');b.classList.remove('out');b.classList.add('on');setTimeout(function(){a.classList.remove('out')},650)},2200);
});

/* ── Числа катятся — по мотивам «Number Ticker» (Magic UI) ── */
qa('[data-count]').forEach(function(el){
  var to=+el.dataset.count,from=+(el.dataset.from||0),suf=el.dataset.suf||'',pre=el.dataset.pre||'';
  if(reduce||!('IntersectionObserver' in window))return;
  el.textContent=pre+spaced(from)+suf;
  var o=new IntersectionObserver(function(es){if(!es[0].isIntersecting)return;o.disconnect();var t0=performance.now();
    (function f(now){var p=clamp((now-t0)/1400,0,1),e=1-Math.pow(1-p,4);el.textContent=pre+spaced(from+(to-from)*e)+suf;if(p<1)requestAnimationFrame(f)})(t0)});
  o.observe(el);
});

/* ── Безопасная сделка: полосы за стеклом едут медленнее страницы ── */
var sd=d.querySelector('.sd');
if(sd){var bars=qa('.sd-bg i',sd);scene(sd,function(r){var p=(innerHeight-r.top)/(innerHeight+r.height);bars.forEach(function(b){var k=+(b.dataset.k||1);b.style.transform='rotate(-8deg) translate3d('+((p-.5)*k*140).toFixed(1)+'px,'+((p-.5)*k*-50).toFixed(1)+'px,0)'})})}

/* ── Колесо фортуны крутится от прокрутки: сколько пролистали, столько и
   повернулось. Только transform. ── */
var wh=d.querySelector('.wheel-d');
if(wh){var app=wh.closest('section');scene(app,function(r){var p=(innerHeight-r.top)/(innerHeight+r.height);wh.style.transform='rotate('+(p*540).toFixed(1)+'deg)'})}

/* ── Поиск: подсказки по разделам каталога HOP.UZ. Каталог — их же меню,
   снятое с сайта: путь и название раздела. ── */
var q=$('q'),qOut=$('q-out'),CAT=[];
try{CAT=JSON.parse($('cats').textContent)}catch(e){}
if(q&&qOut&&CAT.length){
  var low=function(s){return s.toLowerCase().replace(/ё/g,'е')};
  /* Каталог сжат: [родитель, кусок адреса, название] — путь и «хлебные
     крошки» собираем здесь. */
  var IDX=[];CAT.forEach(function(c){var up=IDX[c[0]];IDX.push({p:(up?up.p+'/':'')+c[1],n:c[2],t:up?(up.t?up.t+' › ':'')+up.n:''})});
  IDX.forEach(function(x){x.k=low(x.n+' '+x.t)});
  var link=function(p){return 'https://hop.uz/'+p};
  var draw=function(){
    var v=low(q.value.trim());qOut.innerHTML='';
    if(v.length<2||root.classList.contains('k-no-search')){qOut.hidden=true;return}
    var words=v.split(/\s+/),hit=IDX.filter(function(x){return words.every(function(w){return x.k.indexOf(w.slice(0,Math.max(3,w.length-2)))>=0})}).slice(0,6);
    if(!hit.length){var li=d.createElement('li');li.className='q-none';li.textContent=L.qNone;qOut.appendChild(li)}
    hit.forEach(function(x,i){var li=d.createElement('li'),a=d.createElement('a');a.href=link(x.p);a.target='_blank';a.rel='noopener';
      var b=d.createElement('b');b.textContent=x.n;var sm=d.createElement('small');sm.textContent=x.t||L.qTop;a.appendChild(b);a.appendChild(sm);li.appendChild(a);li.style.setProperty('--i',i);qOut.appendChild(li)});
    qOut.hidden=false;
  };
  q.addEventListener('input',draw);
  $('q-form').addEventListener('submit',function(e){e.preventDefault();draw();var a=qOut.querySelector('a');window.open(a?a.href:'https://hop.uz/all','_blank','noopener')});
  qa('[data-q]').forEach(function(b){b.addEventListener('click',function(){q.value=b.dataset.q;draw();q.focus()})});
  /* Подсказка в поле меняется, пока человек не начал писать */
  var ph=(q.dataset.ph||'').split('|'),pi=0;
  if(ph.length>1&&!reduce)setInterval(function(){if(d.hidden||calm()||q.value||d.activeElement===q)return;pi=(pi+1)%ph.length;q.placeholder=ph[pi]},2600);
}

/* ── Аукцион: таймер идёт по-настоящему. Ставка, сделанная меньше чем за
   3 минуты до конца, добавляет ещё 3 минуты — правило с hop.uz. Соперник
   иногда перебивает, чтобы было с кем бороться. ── */
var auc=$('auc');
if(auc){
  var tEl=$('auc-t'),log=$('auc-log'),btn=$('auc-bid'),stEl=$('auc-st'),ext=$('auc-ext'),aBars=$('auc-bars');
  var left=20,mine=false,bids=0,over=false,tick=0,rival=0;
  var fmt=function(s){s=Math.max(0,Math.ceil(s));return ('0'+Math.floor(s/60)).slice(-2)+':'+('0'+s%60).slice(-2)};
  var note=function(txt,me){var li=d.createElement('li');li.textContent=txt;if(me)li.className='me';log.insertBefore(li,log.firstChild);while(log.children.length>4)log.removeChild(log.lastChild)};
  var bump=function(){bids++;var i=d.createElement('i');i.style.setProperty('--h',Math.min(1,.22+bids*.08).toFixed(2));if(mine)i.className='me';aBars.appendChild(i);while(aBars.children.length>9)aBars.removeChild(aBars.firstChild)};
  var place=function(me){
    if(over)return;mine=me;bump();
    note(me?L.aucYou:L.aucRival,me);
    if(left<180){left+=180;ext.classList.remove('on');void ext.offsetWidth;ext.classList.add('on');note(L.aucExt,false)}
    stEl.textContent=me?L.aucLead:L.aucLost;auc.classList.toggle('lead',me);
  };
  var reset=function(){left=20;mine=false;bids=0;over=false;rival=0;log.innerHTML='';aBars.innerHTML='';auc.classList.remove('won','lost','lead');stEl.textContent=L.aucStart;btn.textContent=L.aucBid;tEl.textContent=fmt(left)};
  btn.addEventListener('click',function(){if(over){reset();return}place(true)});
  reset();
  var run=false;
  new IntersectionObserver(function(es){run=es[0].isIntersecting}).observe(auc);
  setInterval(function(){
    if(!run||over||d.hidden)return;
    /* Пока до конца больше 3 минут, время бежит быстрее: показ, а не ожидание */
    left-=left>180?12:1;tick++;
    if(mine&&rival<3&&left<9&&left>2&&Math.random()<.35){rival++;place(false)}
    if(left<=0){over=true;left=0;auc.classList.add(mine?'won':'lost');stEl.textContent=mine?L.aucWon:(bids?L.aucGone:L.aucNone);btn.textContent=L.aucAgain}
    tEl.textContent=fmt(left);
  },1000);
}

/* ── Разместить объявление: три шага, карточка собирается на глазах,
   готовый текст уходит в Telegram HOP.UZ ── */
var post=$('post');
if(post){
  var val=function(n){var x=post.querySelector('input[name="'+n+'"]:checked');return x?x.value:''};
  var fld=function(id){return ($(id).value||'').trim()};
  var chk=function(id){var x=$(id);return x&&x.checked};
  var no=L.empty||'';
  var pPrice=function(){var p=fld('p-pr').replace(/\D/g,'');return p?spaced(+p)+' '+L.sum:L.deal};
  var text=function(){return L.msgHead+'\n'+L.fCat+': '+(val('cat')||no)+'\n'+L.fTitle+': '+(fld('p-tt')||no)+'\n'+L.fPrice+': '+pPrice()+'\n'+L.fCity+': '+(val('city')||no)+'\n'+L.fState+': '+(val('st')||no)+(chk('p-sd')?'\n'+L.fSafe:'')+(chk('p-hot')?'\n'+L.fHot:'')+'\n'+L.fName+': '+(fld('p-nm')||no)+'\n'+L.fPhone+': '+(fld('p-ph')||no)+(fld('p-tx')?'\n'+L.fText+': '+fld('p-tx'):'')};
  var put=function(id,v){var el=$(id);if(el)el.textContent=v};
  var drawP=function(){
    put('pc-t',fld('p-tt')||L.pvTitle);put('pc-p',pPrice());put('pc-c',val('city')||L.pvCity);put('pc-k',val('cat')||L.pvCat);
    var card=$('pc');if(card){card.classList.toggle('sd-on',chk('p-sd'));card.classList.toggle('hot-on',chk('p-hot'))}
    var ic=post.querySelector('input[name="cat"]:checked'),pi=$('pc-i');if(pi&&ic){pi.innerHTML=ic.parentNode.querySelector('svg').outerHTML}
    var m=$('msg');if(m)m.textContent=text();var t=new Date(Date.now()+5*36e5),mt=$('msg-t');if(mt)mt.textContent=('0'+t.getUTCHours()).slice(-2)+':'+('0'+t.getUTCMinutes()).slice(-2);
    var n=0;['cat','city'].forEach(function(k){if(val(k))n++});if(fld('p-tt'))n++;var pb=$('p-bar');if(pb)pb.style.setProperty('--p',(n/3).toFixed(2));
  };
  post.addEventListener('input',drawP);post.addEventListener('change',drawP);drawP();
  post.addEventListener('submit',function(e){
    e.preventDefault();var err=$('err'),done=$('done');
    if(!val('cat')||!val('city')||!fld('p-tt')||!fld('p-ph')){err.textContent=L.need;err.hidden=false;done.hidden=true;return}
    err.hidden=true;tgSend(text(),done);
  });
}

/* ── Витрина: «Скрытие конкурентов» убирает чужие карточки ── */
var hr=$('hide-rivals'),shop=$('shop');
if(hr&&shop)hr.addEventListener('change',function(){shop.classList.toggle('solo',hr.checked)});

/* ── Тариф: кнопка подставляет название тарифа в сообщение ── */
qa('[data-plan]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();tgSend(L.planHead.replace('{p}',a.dataset.plan))})});

/* ── Было / стало ── */
qa('[data-ba]').forEach(function(box){var r=box.querySelector('input');var s=function(){box.style.setProperty('--x',r.value+'%')};r.addEventListener('input',s);s()});

/* ── Конструктор: тумблер — настоящий блок на странице ── */
var KEY='hop-kit-v1',inputs=qa('input[data-k][data-p]');
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
