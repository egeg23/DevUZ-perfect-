(function(){
'use strict';
/* main — параллакс первого экрана и «жидкое стекло», появление блоков,
   тест уровня, запись на открытый урок в Telegram академии, «было /
   стало», конструктор. Анимации — transform и opacity, прокрутку только
   читаем. */
var d=document,root=d.documentElement,$=function(id){return d.getElementById(id)};
var L={};try{L=JSON.parse($('i18n').textContent)}catch(e){}
var reduce=false;try{reduce=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
var store={get:function(k,f){try{var v=localStorage.getItem(k);return v?JSON.parse(v):f}catch(e){return f}},set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
var money=function(n){return '$'+String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ')};
var spaced=function(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')};
var clamp=function(x,a,b){return x<a?a:x>b?b:x};
var qa=function(s,el){return [].slice.call((el||d).querySelectorAll(s))};
var calm=function(){return reduce||root.classList.contains('k-no-motion')};
var hov=false;try{hov=matchMedia('(hover:hover) and (pointer:fine)').matches}catch(e){}

/* Без заставки (другая страница, второй заход) — первый экран сразу. */
if(root.classList.contains('intro-off')||!$('intro')){var h0=$('hero');if(h0)h0.classList.add('hero-on')}

/* ── Сообщение в Telegram академии. Готовый текст в чат Telegram не
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

/* ── Первый экран: полосы знака, ведущий и стеклянные карточки уходят с
   разной скоростью и чуть следуют за курсором ── */
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

/* ── Открытый урок: полосы за стеклом едут медленнее страницы ── */
var od=d.querySelector('.od');
if(od){var bars=qa('.od-bg i',od);scene(od,function(r){var p=(innerHeight-r.top)/(innerHeight+r.height);bars.forEach(function(b,i){var k=+(b.dataset.k||1);b.style.transform='skewX(-34deg) rotate(9deg) translate3d('+((p-.5)*k*120).toFixed(1)+'px,'+((p-.5)*k*-60).toFixed(1)+'px,0)'})})}

/* ── Тест уровня: шесть вопросов, итог уходит в Telegram ── */
var test=$('test');
if(test){
  var qs=qa('.tq',test),res=$('t-res'),bar=test.querySelector('.test-bar i'),cnt=$('t-n'),score=0,ans=[],qi=0;
  var show=function(i){qs.forEach(function(q,k){q.hidden=k!==i;if(k===i&&!reduce){q.classList.remove('in');void q.offsetWidth;q.classList.add('in')}});if(bar)bar.style.setProperty('--p',(i/qs.length).toFixed(3));if(cnt)cnt.textContent=(i+1)+' / '+qs.length};
  qs.forEach(function(q,k){qa('button',q).forEach(function(b){b.addEventListener('click',function(){score+=+b.dataset.v;ans.push(q.querySelector('h3').textContent+' '+b.textContent);qi=k+1;if(qi<qs.length)show(qi);else finishT()})})});
  var finishT=function(){
    qs.forEach(function(q){q.hidden=true});if(bar)bar.style.setProperty('--p','1');if(cnt)cnt.textContent='';
    var lv=score<=3?0:score<=8?1:2,R=L.levels[lv];
    $('t-lv').textContent=R[0];$('t-tx').textContent=R[1];res.hidden=false;
    var go=$('t-go');go.dataset.tg=L.testHead+'\n'+L.testLevel+': '+R[0]+'\n'+ans.join('\n');
    try{store.set('ap-level',R[0])}catch(e){}
  };
  $('t-go').addEventListener('click',function(e){e.preventDefault();tgSend(this.dataset.tg)});
  $('t-re').addEventListener('click',function(){score=0;ans=[];qi=0;res.hidden=true;show(0)});
  show(0);
}

/* ── Запись на открытый урок → Telegram академии одним сообщением ── */
var book=$('book');
if(book){
  var val=function(n){var x=book.querySelector('input[name="'+n+'"]:checked');return x?x.value:''};
  var fld=function(id){return ($(id).value||'').trim()};
  var no=L.empty||'',lvl=store.get('ap-level','');
  if(lvl){var lx=book.querySelector('input[name="lv"][value="'+lvl+'"]');if(lx)lx.checked=true}
  var text=function(){return L.msgHead+'\n'+L.fDay+': '+(val('day')||no)+'\n'+L.fTime+': '+(val('tm')||no)+'\n'+L.fLevel+': '+(val('lv')||no)+'\n'+L.fPc+': '+(val('pc')||no)+'\n'+L.fName+': '+(fld('b-nm')||no)+'\n'+L.fPhone+': '+(fld('b-ph')||no)+(fld('b-wish')?'\n'+L.fWish+': '+fld('b-wish'):'')};
  var drawB=function(){var m=$('msg');if(m)m.textContent=text();var t=new Date(Date.now()+5*36e5),mt=$('msg-t');if(mt)mt.textContent=('0'+t.getUTCHours()).slice(-2)+':'+('0'+t.getUTCMinutes()).slice(-2)};
  book.addEventListener('input',drawB);book.addEventListener('change',drawB);drawB();
  book.addEventListener('submit',function(e){
    e.preventDefault();var err=$('err'),done=$('done');
    if(!val('day')||!val('tm')||!fld('b-nm')||!fld('b-ph')){err.textContent=L.need;err.hidden=false;done.hidden=true;return}
    err.hidden=true;tgSend(text(),done);
  });
}

/* ── Было / стало ── */
qa('[data-ba]').forEach(function(box){var r=box.querySelector('input');var s=function(){box.style.setProperty('--x',r.value+'%')};r.addEventListener('input',s);s()});

/* ── Конструктор: тумблер — настоящий блок на странице ── */
var KEY='ap-kit-v1',inputs=qa('input[data-k][data-p]');
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
