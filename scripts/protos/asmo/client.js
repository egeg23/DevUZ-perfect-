(function(){
'use strict';
/* main: появление блоков, шапка и цвет страницы между блоками, бенто со
   светом за курсором, онлайн-запись, конструктор лечения, тест «к кому
   записаться», цитата по прокрутке, «было / стало», конструктор сайта.
   Всё, что уходит клинике, уходит в Telegram клиники. Анимации только
   transform и opacity, прокрутку только читаем. */
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

/* Сообщение в Telegram клиники. Готовый текст в чат не подставить, поэтому
   кладём его в буфер обмена и открываем чат: остаётся вставить и отправить. */
function tgSend(text,note){
  try{navigator.clipboard.writeText(text)}catch(e){}
  if(note){note.textContent=L.sent;note.hidden=false}
  window.open(L.tg,'_blank','noopener');
}
d.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[data-tg]');if(!a)return;e.preventDefault();tgSend(a.dataset.tg||'')});

/* Появление блоков: у каждого своё движение. */
function reveal(scope){
  var rv=qa('.rv:not(.in)',scope);
  if('IntersectionObserver' in window&&!reduce){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
    rv.forEach(function(el){io.observe(el)});
  }else rv.forEach(function(el){el.classList.add('in')});
}
reveal();

/* Цвет страницы: блок, который пересекает середину экрана, зажигает свой
   слой фона, остальные гаснут. Меняется только opacity слоёв. */
var tones={};qa('.bgfx i').forEach(function(i){tones[i.dataset.tone]=i});
var secs=qa('main [data-tone], footer[data-tone]'),curTone='';
function toneAt(){var y=innerHeight*.5,k='';for(var i=0;i<secs.length;i++){var s=secs[i];if(s.offsetParent===null&&s.tagName!=='FOOTER')continue;var r=s.getBoundingClientRect();if(r.top<=y&&r.bottom>y){k=s.dataset.tone;}}return k}
function paintTone(){var k=toneAt();if(!k||k===curTone)return;curTone=k;Object.keys(tones).forEach(function(n){tones[n].classList.toggle('on',n===k)})}

/* Шапка: на тёмном светлая, на светлом тёмная. */
var hdr=d.querySelector('.top .wrap'),tq=0;
var dark={ink:1,sea:1,deep:1};
var tone=function(){tq=0;paintTone();if(!hdr)return;var r=hdr.getBoundingClientRect(),x=innerWidth/2,y=r.top+r.height/2,isDark=false;
  var under=(d.elementsFromPoint?d.elementsFromPoint(x,y):[]).filter(function(e){return !e.closest('.top')&&!e.closest('#intro')&&!e.closest('.bgfx')})[0];
  if(under){var st=under.closest('#story');if(st)isDark=!root.classList.contains('st-lt');else{var tn=under.closest('[data-tone]');isDark=!!(tn&&dark[tn.dataset.tone])}}
  d.body.classList.toggle('hd-dark',isDark)};
var top=function(){var y=scrollY;d.body.classList.toggle('scrolled',y>40);d.body.classList.toggle('past',y>innerHeight*.6);if(!tq)tq=requestAnimationFrame(tone)};
addEventListener('scroll',top,{passive:true});addEventListener('resize',top);top();setTimeout(top,400);

/* Бенто: пятно света за курсором, по мотивам «Magic Card» (Magic UI, MIT). */
if(hov&&!reduce)qa('.spot-host').forEach(function(c){var s=c.querySelector('.spot'),raf=0,px=0,py=0;
  c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect();px=e.clientX-r.left;py=e.clientY-r.top;if(!raf)raf=requestAnimationFrame(function(){raf=0;s.style.transform='translate3d('+px.toFixed(0)+'px,'+py.toFixed(0)+'px,0)'})});
  c.addEventListener('pointerleave',function(){s.style.transform='translate3d(-400px,-400px,0)'})});

/* Онлайн-запись: шесть рабочих дней вперёд (воскресенье выходной), время с
   9:00 до 17:30. Занятое время здесь для примера, по дате; на сайте придёт
   из графика врачей. */
var book=$('book');
if(book){
  var daysEl=$('bk-days'),slotsEl=$('bk-slots'),pick=$('bk-pick'),sel={day:null,time:null};
  var now=new Date(),list=[];
  for(var k=0;list.length<6&&k<10;k++){var dt=new Date(now.getFullYear(),now.getMonth(),now.getDate()+k);if(dt.getDay()===0)continue;list.push(dt)}
  var label=function(dt,i){var diff=Math.round((dt-new Date(now.getFullYear(),now.getMonth(),now.getDate()))/864e5);return diff===0?L.today:diff===1?L.tomorrow:L.days[dt.getDay()]};
  daysEl.innerHTML=list.map(function(dt,i){return '<button type="button" role="radio" aria-checked="false" data-i="'+i+'"><small>'+label(dt,i)+'</small><b class="num">'+dt.getDate()+'</b><small>'+L.months[dt.getMonth()]+'</small></button>'}).join('');
  var times=[];for(var h=9;h<18;h++){times.push(h+':00');times.push(h+':30')}
  var busy=function(dt,i){var s=(dt.getDate()*7+dt.getMonth()*3+i*5)%9;return s===0||s===4};
  var drawSlots=function(){var dt=list[sel.day||0],isToday=dt.toDateString()===now.toDateString();
    slotsEl.innerHTML=times.map(function(x,i){var hh=+x.split(':')[0],mm=+x.split(':')[1],past=isToday&&(hh*60+mm)<=now.getHours()*60+now.getMinutes()+60;var off=past||busy(dt,i);return '<button type="button" role="radio" aria-checked="'+(sel.time===x?'true':'false')+'" data-t="'+x+'"'+(off?' disabled':'')+'>'+x+'</button>'}).join('')};
  var show=function(){qa('button',daysEl).forEach(function(b){b.setAttribute('aria-checked',String(+b.dataset.i===sel.day))});
    pick.textContent=sel.day!=null&&sel.time?L.pick.replace('{d}',list[sel.day].getDate()+' '+L.months[list[sel.day].getMonth()]).replace('{t}',sel.time):''};
  daysEl.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;sel.day=+b.dataset.i;sel.time=null;drawSlots();show()});
  slotsEl.addEventListener('click',function(e){var b=e.target.closest('button');if(!b||b.disabled)return;sel.time=b.dataset.t;qa('button',slotsEl).forEach(function(x){x.setAttribute('aria-checked',String(x===b))});show()});
  sel.day=list.length>1?1:0;drawSlots();show();
  /* «Записаться» с карточки услуги выбирает направление. */
  var mapDir={derm:'derm',cosm:'cosm',phys:'phys',diag:'diag',hair:'hair',stac:'derm'};
  qa('[data-dir]').forEach(function(a){a.addEventListener('click',function(){var v=mapDir[a.dataset.dir],r=book.querySelector('input[data-d="'+v+'"]');if(r)r.checked=true})});
  book.addEventListener('submit',function(e){
    e.preventDefault();
    var v=function(n){var x=book.querySelector('[name="'+n+'"]');return x?(x.value||'').trim():''};
    var done=$('bk-done');
    if(sel.day==null||!sel.time){done.textContent=L.bSlot;done.hidden=false;return}
    if(!v('phone')){done.textContent=L.bNeed;done.hidden=false;return}
    var dir=(book.querySelector('[name="dir"]:checked')||{}).value||'';
    var dt=list[sel.day];
    var lines=[L.bHead,L.bDir+': '+dir,L.bWhen+': '+dt.getDate()+' '+L.months[dt.getMonth()]+', '+sel.time,L.bName+': '+(v('name')||L.empty),L.bPhone+': '+v('phone')];
    if(v('note'))lines.push(L.bNote+': '+v('note'));
    var plan=$('prc-sel');if(plan&&plan.dataset.txt)lines.push('',plan.dataset.txt);
    tgSend(lines.join('\n'),done);
  });
}

/* Конструктор лечения: процедуры, сеансы, итог в сумах. Число итога
   набегает, как «Number Ticker» (Magic UI, MIT): меняется только текст. */
var prc=d.querySelector('.prc');
if(prc){
  var rows=qa('.pr',prc),selEl=$('prc-sel'),sumEl=$('prc-sum'),nEl=$('prc-n'),shown=0,goal=0,traf=0;
  var tick=function(){traf=0;var dlt=goal-shown;if(Math.abs(dlt)<1||reduce){shown=goal;sumEl.textContent=sp(goal);return}shown+=dlt*.18;sumEl.textContent=sp(Math.round(shown/1000)*1000);traf=requestAnimationFrame(tick)};
  var calc=function(){var tot=0,items=[];rows.forEach(function(r){var on=r.querySelector('[data-pc]').checked,q=+r.querySelector('[data-q]').textContent;r.classList.toggle('on',on);if(!on)return;var p=+r.dataset.p*q;tot+=p;items.push([r.querySelector('.pr-t b').textContent,q,p])});
    selEl.innerHTML=items.map(function(x){return '<li><span>'+esc(x[0])+(x[1]>1?' × '+x[1]:'')+'</span><span class="num">'+sp(x[2])+'</span></li>'}).join('');
    nEl.textContent=items.length?L.cN.replace('{n}',items.length):L.cNone;
    selEl.dataset.txt=items.length?[L.cHead].concat(items.map(function(x){return '· '+x[0]+(x[1]>1?' × '+x[1]:'')})).concat([L.cTotal.replace('{s}',sp(tot))]).join('\n'):'';
    goal=tot;if(!traf)traf=requestAnimationFrame(tick)};
  rows.forEach(function(r){var out=r.querySelector('[data-q]'),max=+r.dataset.max,cb=r.querySelector('[data-pc]');
    r.querySelector('[data-m]').addEventListener('click',function(){out.textContent=Math.max(1,+out.textContent-1);cb.checked=true;calc()});
    r.querySelector('[data-a]').addEventListener('click',function(){out.textContent=Math.min(max,+out.textContent+1);cb.checked=true;calc()});
    cb.addEventListener('change',calc)});
  qa('.prc-tabs .chip').forEach(function(b){b.addEventListener('click',function(){qa('.prc-tabs .chip').forEach(function(x){x.setAttribute('aria-selected',String(x===b))});qa('.prc-l',prc).forEach(function(l){l.hidden=l.dataset.list!==b.dataset.tab;if(!l.hidden&&!reduce){l.classList.remove('k-fresh');void l.offsetWidth;l.classList.add('k-fresh')}})})});
  $('prc-send').addEventListener('click',function(){var done=$('prc-done');if(!selEl.dataset.txt){done.textContent=L.cNone;done.hidden=false;return}tgSend(selEl.dataset.txt,done)});
  calc();
}

/* Тест: три вопроса, ответ первого решает направление. */
var qz=$('quiz');
if(qz){
  var R={};try{R=JSON.parse($('qz-data').textContent)}catch(e){}
  var steps=qa('.qz-s',qz),dots=qa('.qz-dots li',qz),ans={},dirMap={derm:'derm',diag:'diag',hair:'hair',cosm:'cosm'};
  var go=function(i){steps.forEach(function(s){s.hidden=+s.dataset.s!==i});dots.forEach(function(x,k){x.classList.toggle('on',k<=i)})};
  qz.addEventListener('click',function(e){var b=e.target.closest('.qo');if(!b)return;var s=+b.closest('.qz-s').dataset.s;ans[s]=b.dataset;
    if(s<2){go(s+1);return}
    var r=R[ans[0].r]||R.derm;$('qz-h').textContent=r[0];$('qz-p').textContent=r[1];$('qz-kid').hidden=ans[2].v!=='kid';go(3);
    var bk=$('book');if(bk){var x=bk.querySelector('input[data-d="'+(ans[2].v==='kid'&&ans[0].r==='derm'?'kid':dirMap[ans[0].r])+'"]');if(x)x.checked=true;var nt=bk.querySelector('[name="note"]');if(nt&&!nt.value)nt.value=qa('.qo',steps[0]).filter(function(q){return q.dataset.v===ans[0].v})[0].textContent}});
  $('qz-re').addEventListener('click',function(){ans={};go(0)});
}

/* Цитата: слова загораются по мере прокрутки, по мотивам «Text Reveal» (Magic UI, MIT). */
var qt=$('qt');
if(qt&&!reduce){var ws=qa('span',qt),qon=false,qraf=0;
  var qf=function(){qraf=0;if(!qon)return;var r=qt.getBoundingClientRect(),p=(innerHeight*.85-r.top)/(r.height+innerHeight*.35),n=Math.round(ws.length*Math.min(1,Math.max(0,p)));ws.forEach(function(w,i){w.classList.toggle('on',i<n)})};
  addEventListener('scroll',function(){if(qon&&!qraf)qraf=requestAnimationFrame(qf)},{passive:true});
  new IntersectionObserver(function(es){qon=es[0].isIntersecting;if(qon)qf()}).observe(qt)}
else if(qt)qa('span',qt).forEach(function(w){w.classList.add('on')});

/* Было / стало */
qa('[data-ba]').forEach(function(box){var r=box.querySelector('input');var s=function(){box.style.setProperty('--x',r.value+'%')};r.addEventListener('input',s);s()});

/* Конструктор сайта: тумблер включает и выключает настоящий блок. */
var KEY='am-kit-v1',inputs=qa('input[data-k][data-p]');
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
    secs=qa('main [data-tone], footer[data-tone]');curTone='';top();
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
