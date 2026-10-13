(function(){
'use strict';
/* main: появление блоков, шапка и цвет страницы между блоками, бенто со
   светом за курсором, очередь превью, запись, калькулятор экономии, срок
   испытания баллона, конструктор фургона, просмотр фото, «было / стало», конструктор сайта.
   Всё, что уходит компании, уходит в её Telegram. Анимации только
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

/* Сообщение в Telegram компании. Готовый текст в чат не подставить, поэтому
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
var dark={ink:1,night:1,deep:1};
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

/* Превью грузятся очередью: по три за раз и только те, что на виду.
   11.10.2026 у enotmebel iPhone запрашивал всю сетку разом, nginx отбивал
   пачку с 429, и вместо картинок были знаки вопроса. Не ответил — ещё две
   попытки с паузой. */
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
qa('img[data-src]').forEach(function(im){if(lio)lio.observe(im);else want(im)});

/* Числа набегают, когда блок на виду, по мотивам «Number Ticker» (Magic UI, MIT). */
var tick0=qa('.tm-n [data-count]');
if(tick0.length&&!reduce&&'IntersectionObserver' in window){
  tick0.forEach(function(n){n.textContent='0'});
  var tio=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;tio.unobserve(e.target);var n=e.target,to=+n.dataset.count,t0=performance.now();
    (function f(now){var k=Math.min(1,(now-t0)/1400),v=Math.round(to*(1-Math.pow(1-k,3)));n.textContent=sp(v);if(k<1)requestAnimationFrame(f)})(t0)})},{threshold:.6});
  tick0.forEach(function(n){tio.observe(n)});
}

/* Запись: машина, услуга, день и время суток. Часов работы на сайте
   компании нет, поэтому слотов нет: мастер перезвонит и назовёт время. */
var book=$('book');
if(book){
  var daysEl=$('bk-days'),pick=$('bk-pick'),sel={day:null};
  var now=new Date(),list=[];
  for(var k=0;list.length<6&&k<10;k++){var dt=new Date(now.getFullYear(),now.getMonth(),now.getDate()+k);if(dt.getDay()===0)continue;list.push(dt)}
  var label=function(dt){var diff=Math.round((dt-new Date(now.getFullYear(),now.getMonth(),now.getDate()))/864e5);return diff===0?L.today:diff===1?L.tomorrow:L.days[dt.getDay()]};
  daysEl.innerHTML=list.map(function(dt,i){return '<button type="button" role="radio" aria-checked="false" data-i="'+i+'"><small>'+label(dt)+'</small><b class="num">'+dt.getDate()+'</b><small>'+L.months[dt.getMonth()]+'</small></button>'}).join('');
  var part=function(){return (book.querySelector('[name="part"]:checked')||{}).value||''};
  var show=function(){qa('button',daysEl).forEach(function(b){b.setAttribute('aria-checked',String(+b.dataset.i===sel.day))});
    pick.textContent=sel.day!=null?L.pick.replace('{d}',list[sel.day].getDate()+' '+L.months[list[sel.day].getMonth()]).replace('{p}',part().toLowerCase()):''};
  daysEl.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;sel.day=+b.dataset.i;show()});
  qa('[name="part"]',book).forEach(function(x){x.addEventListener('change',show)});
  sel.day=list.length>1?1:0;show();
  /* «Записаться» с карточки услуги выбирает услугу. */
  qa('[data-svc]').forEach(function(a){a.addEventListener('click',function(){var r=book.querySelector('input[data-s="'+a.dataset.svc+'"]');if(r)r.checked=true})});
  book.addEventListener('submit',function(e){
    e.preventDefault();
    var v=function(n){var x=book.querySelector('[name="'+n+'"]');return x?(x.value||'').trim():''};
    var c=function(n){return (book.querySelector('[name="'+n+'"]:checked')||{}).value||''};
    var done=$('bk-done');
    if(sel.day==null){done.textContent=L.bDay;done.hidden=false;return}
    if(!v('phone')){done.textContent=L.bNeed;done.hidden=false;return}
    var dt=list[sel.day];
    var lines=[L.bHead,L.bCar+': '+c('car')+(v('note')?' ('+v('note')+')':''),L.bSvc+': '+c('svc'),L.bWhen+': '+dt.getDate()+' '+L.months[dt.getMonth()]+', '+part().toLowerCase(),L.bName+': '+(v('name')||L.empty),L.bPhone+': '+v('phone')];
    tgSend(lines.join('\n'),done);
  });
}

/* Калькулятор экономии: всё считается по ползункам сразу. Расход метана
   идёт за бензином (0,95 м³ на литр), пока его не тронули руками. */
var cs=$('c-sum');
if(cs){
  var gi=function(id){return $(id)},num=function(id){return +(gi(id).value||0)},gmTouched=false,shown=0,goal=0,craf=0,last={};
  var arc=gi('c-arc'),needle=gi('c-needle');
  var tickC=function(){craf=0;var dl=goal-shown;if(Math.abs(dl)<500||reduce){shown=goal;cs.textContent=sp(Math.round(goal/1000)*1000);return}shown+=dl*.16;cs.textContent=sp(Math.round(shown/1000)*1000);craf=requestAnimationFrame(tickC)};
  var calcC=function(){
    if(!gmTouched){gi('c-gm').value=(Math.round(num('c-pl')*.95*10)/10)}
    ['c-km','c-days','c-pl','c-gm'].forEach(function(id){gi(id+'-o').textContent=String(gi(id).value).replace('.',L.lang==='ru'?',':'.')});
    var km=num('c-km')*num('c-days'),pet=km/100*num('c-pl')*num('c-pp'),gas=km/100*num('c-gm')*num('c-gp'),save=Math.round(pet-gas);
    last={km:num('c-km'),pl:num('c-pl'),s:save};
    goal=Math.max(save,0);if(!craf)craf=requestAnimationFrame(tickC);
    var k=Math.max(0,Math.min(1,save/6e6));arc.style.strokeDashoffset=String(100-k*100);needle.style.transform='rotate('+(-90+k*180).toFixed(1)+'deg)';
    var mx=Math.max(pet,gas,1);gi('c-bp').style.transform='scaleX('+(pet/mx).toFixed(3)+')';gi('c-bg').style.transform='scaleX('+(gas/mx).toFixed(3)+')';
    gi('c-vp').textContent=sp(Math.round(pet/1000)*1000);gi('c-vg').textContent=sp(Math.round(gas/1000)*1000);
    gi('c-year').textContent=save>0?L.cYear.replace('{s}',sp(Math.round(save*12/1000)*1000)):L.cNeg;
  };
  ['c-km','c-days','c-pl','c-gm','c-pp','c-gp'].forEach(function(id){gi(id).addEventListener('input',function(){if(id==='c-gm')gmTouched=true;calcC()})});
  gi('c-send').addEventListener('click',function(){tgSend(L.cTg.replace('{km}',last.km).replace('{pl}',String(last.pl).replace('.',',')).replace('{s}',sp(Math.round(Math.max(last.s,0)/1000)*1000)),$('c-done'))});
  calcC();
}

/* Срок испытания баллона: метан раз в 3 года, пропан раз в 2 (gov.uz).
   Напоминание — файл календаря за месяц до срока, без сервера. */
var tl=$('t-last');
if(tl){
  var yrs=function(){var r=d.querySelector('[name="gas"]:checked');return r?+r.value:3};
  var gname=function(){var r=d.querySelector('[name="gas"]:checked');return r?r.dataset.g:''};
  var fmtD=function(x){return x.getDate()+' '+L.months[x.getMonth()]+' '+x.getFullYear()};
  var ymd=function(x){return x.getFullYear()+('0'+(x.getMonth()+1)).slice(-2)+('0'+x.getDate()).slice(-2)};
  var t0=new Date();tl.max=t0.getFullYear()+'-'+('0'+(t0.getMonth()+1)).slice(-2)+'-'+('0'+t0.getDate()).slice(-2);
  var prev=new Date(t0.getFullYear()-2,t0.getMonth(),t0.getDate()+40);tl.value=prev.getFullYear()+'-'+('0'+(prev.getMonth()+1)).slice(-2)+'-'+('0'+prev.getDate()).slice(-2);
  var ics=$('t-ics'),nextD=null;
  var calcT=function(){
    var v=tl.value;if(!v){$('t-next').textContent=L.tNeed;return}
    var p=v.split('-').map(Number),last=new Date(p[0],p[1]-1,p[2]);nextD=new Date(p[0]+yrs(),p[1]-1,p[2]);
    var days=Math.round((nextD-new Date(t0.getFullYear(),t0.getMonth(),t0.getDate()))/864e5),span=yrs()*365;
    $('t-next').textContent=L.tNext.replace('{d}',fmtD(nextD));
    $('t-left').textContent=days<0?L.tLate.replace('{n}',-days):L.tLeft.replace('{n}',days);
    $('t-res').classList.toggle('late',days<30);
    $('t-bar').style.transform='scaleX('+Math.max(0,Math.min(1,1-days/span)).toFixed(3)+')';
    var rem=new Date(nextD.getFullYear(),nextD.getMonth(),nextD.getDate()-30);if(rem<t0)rem=new Date(t0.getFullYear(),t0.getMonth(),t0.getDate()+1);
    var body=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//europegas//test//RU','BEGIN:VEVENT','UID:'+ymd(nextD)+'-ballon@europegas.uz','DTST'+'AMP:'+ymd(t0)+'T090000Z','DTSTART;VALUE=DATE:'+ymd(rem),'SUMMARY:'+L.tIcs+' · '+fmtD(nextD),'DESCRIPTION:'+L.tIcsD,'END:VEVENT','END:VCALENDAR'].join('\r\n');
    ics.href='data:text/calendar;charset=utf-8,'+encodeURIComponent(body);
  };
  tl.addEventListener('input',calcT);qa('[name="gas"]').forEach(function(x){x.addEventListener('change',calcT)});
  $('t-send').addEventListener('click',function(){if(!tl.value){$('t-done').textContent=L.tNeed;$('t-done').hidden=false;return}var p=tl.value.split('-').map(Number);tgSend(L.tTg.replace('{g}',gname()).replace('{d}',fmtD(new Date(p[0],p[1]-1,p[2]))),$('t-done'))});
  calcT();
}

/* Конструктор фургона: рисунок меняется сразу (только классы и opacity). */
var vk=$('vk');
if(vk){
  var VD={};try{VD=JSON.parse($('vk-data').textContent)}catch(e){}
  var pic=$('vk-pic'),cap=$('vk-cap'),note=$('vk-note');
  var val=function(n){return vk.querySelector('[name="'+n+'"]:checked')};
  var drawV=function(){
    var cargo=val('vcargo').value,unit=val('vunit').value;
    pic.dataset.cargo=cargo;pic.dataset.unit=unit;pic.dataset.floor=val('vfloor').value;
    cap.textContent=[val('vcar').dataset.n,val('vvol').dataset.n,val('vunit').dataset.n].join(' · ');
    note.textContent=VD[cargo]||'';
  };
  vk.addEventListener('change',drawV);
  vk.addEventListener('submit',function(e){e.preventDefault();var lines=[L.vHead].concat(['vcar','vcargo','vvol','vunit','vfloor'].map(function(n){var r=val(n);return '· '+r.closest('fieldset').querySelector('legend').textContent+': '+r.dataset.n}));tgSend(lines.join('\n'),$('vk-done'))});
  drawV();
}

/* Просмотр фото и документов во весь экран. */
var lb=$('lb');
if(lb){
  var lbi=$('lb-img'),lbc=$('lb-cap'),opener=null;
  var openL=function(b){opener=b;lbi.src=b.dataset.full;lbi.alt=(b.querySelector('img')||{}).alt||'';lbc.textContent=b.dataset.cap||'';lb.hidden=false;root.style.overflow='hidden';$('lb-x').focus()};
  var closeL=function(){lb.hidden=true;lbi.removeAttribute('src');root.style.overflow='';if(opener)opener.focus()};
  qa('[data-full]').forEach(function(b){b.addEventListener('click',function(){openL(b)})});
  $('lb-x').addEventListener('click',closeL);
  lb.addEventListener('click',function(e){if(e.target===lb)closeL()});
  addEventListener('keydown',function(e){if(e.key==='Escape'&&!lb.hidden)closeL()});
}

/* Было / стало */
qa('[data-ba]').forEach(function(box){var r=box.querySelector('input');var s=function(){box.style.setProperty('--x',r.value+'%')};r.addEventListener('input',s);s()});

/* Конструктор сайта: тумблер включает и выключает настоящий блок. */
var KEY='eg-kit-v1',inputs=qa('input[data-k][data-p]');
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
