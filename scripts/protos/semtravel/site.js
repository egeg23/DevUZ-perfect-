(function(){
'use strict';
/* SEM Travel: маршрут из Ташкента на первом экране, поиск «знаю куда» и
   подбор «не знаю куда», выдача с итогом на всех, карта перелётов с
   календарём цен, карточка тура (образец ваучера, шкала отмены), бронь в их
   Telegram со статусом, SEM Club, шапка по правилу трёх секунд, конструктор
   цены. Прокрутка родная: ScrollTrigger только запускает сцены при входе.
   Цены туров — их «от $» на 21.10.2026, остальное — пример расчёта. Модель
   макет не вызывает. */
var d=document,root=d.documentElement;
function $(s,c){return(c||d).querySelector(s)}
function $$(s,c){return Array.prototype.slice.call((c||d).querySelectorAll(s))}
var K=JSON.parse($('#st-site').textContent),L=K.t;
var CALM=root.classList.contains('calm');
var GS=!CALM&&window.gsap;
if(GS&&window.ScrollTrigger)gsap.registerPlugin(ScrollTrigger);
var top=$('#top'),dock=$('#dock');
function clamp(x,a,b){return Math.min(Math.max(x,a==null?0:a),b==null?1:b)}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function pad(n){return(n<10?'0':'')+n}
function usd(n){return '$'+fmt(n)}
function r10(n){return Math.round(n/10)*10}
function byId(id){return K.dest.filter(function(x){return x.id===id})[0]}
function hash(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return((h>>>0)%1000)/1000}

/* Шапка (правило владельца, 15.10.2026): при любой прокрутке прячется и
   возвращается только через 3 секунды после полной остановки. Инерция
   прокрутки на телефоне тоже шлёт scroll, так что таймер ждёт её конца.
   Пока фокус с клавиатуры внутри шапки, она не прячется. */
var IDLE=3000,idleT=0;
function headIdle(){if(!top)return;clearTimeout(idleT);
  if(!top.contains(d.activeElement))top.classList.add('hide');
  idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}
var heroBg=$('.hero-bg'),hero=$('#hero');
addEventListener('scroll',function(){
  headIdle();
  var y=scrollY;
  if(top)top.classList.toggle('solid',y>(hero?hero.offsetHeight-80:40));
  if(!CALM&&heroBg&&y<innerHeight*1.2)heroBg.style.transform='translate3d(0,'+(y*.3).toFixed(1)+'px,0) scale('+(1+y/innerHeight*.06).toFixed(4)+')';
},{passive:true});

/* Число катится к новому значению */
function roll(el,to,pre,suf){if(!el)return;pre=pre||'';suf=suf||'';var from=+(el.getAttribute('data-v')||to);el.setAttribute('data-v',to);
  if(CALM||from===to){el.textContent=pre+fmt(to)+suf;return}
  var t0=0;cancelAnimationFrame(el._rq);(function s(t){if(!t0)t0=t;var k=clamp((t-t0)/600),e=1-Math.pow(1-k,3);el.textContent=pre+fmt(from+(to-from)*e)+suf;if(k<1)el._rq=requestAnimationFrame(s)})(performance.now())}

/* Самолёт идёт по пути SVG: позиция и поворот из getPointAtLength */
function flyAlong(path,pl,dur,done){if(!path||!pl){if(done)done();return}
  var len=path.getTotalLength(),t0=0;pl.style.opacity=1;
  function at(k){var p=path.getPointAtLength(len*k),q=path.getPointAtLength(Math.min(len,len*k+1)),a=Math.atan2(q.y-p.y,q.x-p.x)*180/Math.PI+45;pl.setAttribute('transform','translate('+p.x.toFixed(1)+' '+p.y.toFixed(1)+') rotate('+a.toFixed(1)+')')}
  if(CALM){at(1);if(done)done();return}
  cancelAnimationFrame(pl._rq);(function s(t){if(!t0)t0=t;var k=clamp((t-t0)/dur),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;at(e);if(k<1)pl._rq=requestAnimationFrame(s);else if(done)done()})(performance.now())}

/* ── Состояние поиска ─────────────────────────────────────────────── */
var S={dest:K.dest[0].id,mk:K.months[0][0],mp:K.months[0][0],ad:2,ch:0,flex:true,bud:1200};
var HOT=[{s:3,k:1,meal:0,img:'h-room'},{s:4,k:1.32,meal:1,img:'h-pool'},{s:5,k:1.78,meal:2,img:'h-sea'}];
/* Сезон с их страницы «Туры»: в сезон — цена как есть, вне — дороже;
   где сезон не указан — немного выше их «от». Это пример расчёта. */
function seasonF(x,m){if(!x.m.length)return 1.06;return x.m.indexOf(m)>=0?1:1.18}
function people(){return S.ad+S.ch*.6}
function monName(m){var r=K.months.filter(function(x){return x[0]===m})[0];return r?r[1]:''}
function depDate(x,m){var dd=x.date.split('-'),mm=+dd[1];var day=mm===m?+dd[2]:12;var y=m>=10?2026:2027;return{d:day,m:m,y:y}}
function dayStr(o){return L.day.replace('@D',o.d).replace('@M',K.mon[o.m-1])}
function whoStr(){return S.ch?L.who2k.replace('@A',S.ad).replace('@K',S.ch):L.who2.replace('@A',S.ad)}
function tourTotal(x,h,m){return r10(x.price*seasonF(x,m)*h.k*people()*(S.flex?.97:1))}

/* ── Первый экран: маршрут к выбранной стране ─────────────────────── */
var rp=$('#route-p'),rpl=$('#route-pl');
function routeTo(x){$('#route-code').textContent=x.code;$('#route-name').textContent=x.t;roll($('#route-price'),x.price,'$');flyAlong(rp,rpl,1400)}

/* ── Вкладки, чипы, счётчики ──────────────────────────────────────── */
$$('.tabs[role=tablist]').forEach(function(tl){$$('[role=tab]',tl).forEach(function(b){b.onclick=function(){$$('[role=tab]',tl).forEach(function(x){var on=x===b;x.setAttribute('aria-selected',String(on));d.getElementById(x.getAttribute('aria-controls')).hidden=!on})}})});
$$('.chips').forEach(function(g){$$('.chip',g).forEach(function(c){c.addEventListener('click',function(){$$('.chip',g).forEach(function(x){x.setAttribute('aria-pressed',String(x===c))});
  var dg=g.getAttribute('data-g');
  if(dg==='dest'){S.dest=c.getAttribute('data-dest');routeTo(byId(S.dest))}
  else if(dg==='mk')S.mk=+c.getAttribute('data-m');
  else if(dg==='mp')S.mp=+c.getAttribute('data-m')})})});
function setChip(g,attr,val){var box=$('.chips[data-g="'+g+'"]');if(!box)return;$$('.chip',box).forEach(function(x){var on=x.getAttribute(attr)===String(val);x.setAttribute('aria-pressed',String(on));if(on&&g==='dest'&&x.scrollIntoView&&box.scrollWidth>box.clientWidth)box.scrollLeft=x.offsetLeft-16})}
function syncSteps(){$$('.stp').forEach(function(s){var k=s.getAttribute('data-step'),v=S[k];$('output',s).textContent=v;var b=$$('button',s);b[0].disabled=v<=+s.getAttribute('data-min');b[1].disabled=v>=+s.getAttribute('data-max')})}
$$('.stp').forEach(function(s){$$('button',s).forEach(function(b){b.onclick=function(){var k=s.getAttribute('data-step');S[k]=clamp(S[k]+(+b.getAttribute('data-d')),+s.getAttribute('data-min'),+s.getAttribute('data-max'));syncSteps()}})});
syncSteps();
var flex=$('#flex');if(flex)flex.onchange=function(){S.flex=flex.checked};
var bud=$('#bud'),budO=$('#bud-o');if(bud)bud.oninput=function(){S.bud=+bud.value;budO.textContent=usd(S.bud)};

/* ── Выдача ───────────────────────────────────────────────────────── */
var rez=$('#rez'),rezG=$('#rez-g'),fly=$('#fly');
function img(n,alt,lazy){var b=K.img+'/'+n;return '<img src="'+b+'-s.webp" srcset="'+b+'-s.webp 640w, '+b+'.webp 1200w" sizes="(min-width: 1000px) 400px, 100vw" alt="'+alt+'" width="640" height="427"'+(lazy?' loading="lazy"':'')+' decoding="async">'}
function searching(title,kick,render){rez.hidden=false;$('#rez-k').textContent=kick;$('#rez-t').textContent=title;rezG.innerHTML='';fly.classList.remove('done');$('#fly-t').textContent=L.wait;$('#fly-n').textContent='';
  var y=rez.getBoundingClientRect().top+scrollY-8;scrollTo({top:y,behavior:CALM?'auto':'smooth'});
  flyAlong($('#fly-p'),$('#fly-pl'),CALM?0:1600,function(){fly.classList.add('done');$('#fly-t').textContent=L.waitDone+':';var n=render();$('#fly-n').textContent=n;
    $$('.tc',rezG).forEach(function(c,i){c.style.setProperty('--d',i*120+'ms');requestAnimationFrame(function(){requestAnimationFrame(function(){c.classList.add('in')})})})})}
function runKnow(){var x=byId(S.dest),m=S.mk,dt=depDate(x,m);
  searching(x.t+' · '+monName(m)+' · '+whoStr(),L.rezKick,function(){
    rezG.innerHTML=HOT.map(function(h,i){var sum=tourTotal(x,h,m),pp=r10(sum/people());
      return '<article class="tc"><div class="tc-i">'+img(i?h.img:x.img,i?L.hotel.replace('@',h.s):x.t,true)+'<span class="badge">'+h.s+'★</span></div><div class="tc-b"><h3>'+L.hotel.replace('@',h.s)+'</h3><p class="tc-m"><span>'+x.t+'</span><span>'+x.nights+' '+L.nightsW+'</span><span>'+L.meal[h.meal]+'</span><span>'+dayStr(dt)+'</span></p><p class="tc-p"><b>'+usd(sum)+'</b><small>'+usd(pp)+' '+L.perP+'</small></p><button type="button" class="btn btn-sun" data-tour="'+x.id+'|'+i+'|'+m+'">'+L.see+'</button></div></article>'}).join('');
    return HOT.length})}
function runPick(){var m=S.mp,B=S.bud,P=people();
  var list=K.dest.filter(function(x){return!(x.beach&&x.m.length&&x.m.indexOf(m)<0)}).map(function(x){return{x:x,sum:r10(x.price*seasonF(x,m)*P)}});
  var fit=list.filter(function(o){return o.sum<=B}).sort(function(a,b){return b.sum-a.sum});
  var over=list.filter(function(o){return o.sum>B}).sort(function(a,b){return a.sum-b.sum});
  var top3=fit.slice(0,3).concat(over).slice(0,3);
  var title=L.pickT.replace('@B',usd(B)).replace('@P',whoStr()).replace('@M',monName(m).toLowerCase());
  searching(title,L.pickKick,function(){
    rezG.innerHTML=top3.map(function(o){var x=o.x,diff=B-o.sum;
      return '<article class="tc"><div class="tc-i">'+img(x.img,x.t,true)+'<span class="badge">'+x.code+'</span></div><div class="tc-b"><h3>'+x.t+'</h3><p class="tc-m">'+(x.season?'<span>'+L.season+': '+x.season+'</span>':'')+(x.visa?'<span>'+x.visa+'</span>':'')+(x.hours?'<span>'+x.hours+'</span>':'')+'<span>'+x.nights+' '+L.nightsW+'</span></p><p class="tc-p"><b>'+usd(o.sum)+'</b><small>'+L.total+'</small></p><p class="tc-x'+(diff<0?' over':'')+'">'+(diff>=0?L.left:L.over).replace('@',usd(Math.abs(diff)))+'</p><button type="button" class="btn btn-sun" data-go="'+x.id+'|'+m+'">'+L.seeTours+'</button></div></article>'}).join('');
    return top3.length})}
$('#go-know').onclick=runKnow;
$('#go-pick').onclick=runPick;
function goSearch(id,m){S.dest=id;S.mk=m;setChip('dest','data-dest',id);setChip('mk','data-m',m);routeTo(byId(id));var tb=$('#tb-know');if(tb)tb.click();runKnow()}
rezG.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-go')){var a=b.getAttribute('data-go').split('|');goSearch(a[0],+a[1])}
  else if(b.hasAttribute('data-tour')){var q=b.getAttribute('data-tour').split('|');openTour(byId(q[0]),HOT[+q[1]],+q[2])}});

/* ── Карта перелётов ──────────────────────────────────────────────── */
var N=1,cur=K.dest[0],mapPl=$('#map-pl');
function forW(){return N===1?L.forOne:N===2?L.forTwo:L.forFam}
function priceN(p){return N===1?p:r10(p*N)}
function calendar(x){var dd=x.date.split('-').map(Number),base=new Date(Date.UTC(dd[0],dd[1]-1,dd[2]));var cells=[],mx=0,mn=1e9;
  for(var i=-6;i<8;i++){var t=new Date(base.getTime()+i*864e5),p=i===0?x.price:r10(x.price*(1+.08+.3*hash(x.id+i)));cells.push({d:t.getUTCDate(),m:t.getUTCMonth()+1,p:p,low:i===0});if(p>mx)mx=p;if(p<mn)mn=p}
  var cal=$('#cal');cal.innerHTML=cells.map(function(c){return '<button type="button" role="listitem" class="'+(c.low?'low':'')+'" aria-pressed="'+c.low+'" data-p="'+c.p+'" style="--h:'+(.2+.8*(c.p-mn)/Math.max(1,mx-mn)).toFixed(3)+'"><i></i><span>'+c.d+'</span><b>'+usd(priceN(c.p))+'</b></button>'}).join('');
  var lo=cells[6];$('#cal-k').textContent=L.cheapest+': '+dayStr({d:lo.d,m:lo.m})+', '+usd(priceN(lo.p));
  $$('button',cal).forEach(function(b){b.onclick=function(){$$('button',cal).forEach(function(z){z.setAttribute('aria-pressed',String(z===b))});roll($('#dc-pr'),priceN(+b.getAttribute('data-p')),'$')}})}
function selDest(id,fly){var x=byId(id);if(!x)return;cur=x;
  $$('.dot').forEach(function(g){g.classList.toggle('on',g.getAttribute('data-dest')===id)});
  $$('.arc').forEach(function(a){a.classList.toggle('on',a.getAttribute('data-dest')===id)});
  $$('#rank button').forEach(function(b){b.classList.toggle('on',b.getAttribute('data-dest')===id)});
  var im=$('#dc-img');im.style.opacity=.3;im.onload=function(){im.style.opacity=1};im.srcset=K.img+'/'+x.img+'-s.webp 640w, '+K.img+'/'+x.img+'.webp 1200w';im.src=K.img+'/'+x.img+'-s.webp';im.alt=x.t;
  $('#dc-t').textContent=x.t;roll($('#dc-pr'),priceN(x.price),'$');$('#dc-for').textContent=forW();$('#dc-n').textContent=x.near;
  var f=[[L.flight,fmt(x.km)+' '+L.km+(x.hours?', '+x.hours:'')]];if(x.season)f.push([L.season,x.season]);if(x.visa)f.push([L.visa,x.visa]);
  $('#dc-f').innerHTML=f.map(function(r){return '<dt>'+r[0]+'</dt><dd>'+r[1]+'</dd>'}).join('');
  calendar(x);
  if(fly){var a=$('.arc[data-dest="'+id+'"]');flyAlong(a,mapPl,1100)}}
$$('.dot').forEach(function(g){g.setAttribute('tabindex','0');g.setAttribute('role','button');g.setAttribute('aria-label',g.textContent);
  g.addEventListener('click',function(){selDest(g.getAttribute('data-dest'),true)});
  g.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();selDest(g.getAttribute('data-dest'),true)}})});
$$('#rank button').forEach(function(b){b.onclick=function(){selDest(b.getAttribute('data-dest'),true);var c=$('#dcard');if(c.getBoundingClientRect().top<0||c.getBoundingClientRect().top>innerHeight*.6)scrollTo({top:c.getBoundingClientRect().top+scrollY-80,behavior:CALM?'auto':'smooth'})}});
$$('.karta .seg button').forEach(function(b){b.onclick=function(){$$('.karta .seg button').forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});N=+b.getAttribute('data-n');
  $$('.dot .dp,.rk-p').forEach(function(e){e.textContent=usd(priceN(+e.getAttribute('data-p')))});selDest(cur.id,false)}});
$('#dc-go').onclick=function(){var m=+cur.date.split('-')[1];goSearch(cur.id,K.months.some(function(x){return x[0]===m})?m:K.months[0][0])};
selDest(cur.id,false);
/* Вход в карту: дуги прорисовываются из Ташкента, полосы графика растут */
var arcs=$$('.arc'),rank=$('#rank');
if(GS&&window.ScrollTrigger){
  arcs.forEach(function(a){var l=a.getTotalLength();a.style.strokeDasharray=l;a.style.strokeDashoffset=l});
  ScrollTrigger.create({trigger:'#karta',start:'top 70%',once:true,onEnter:function(){
    gsap.to(arcs,{strokeDashoffset:0,duration:1.4,stagger:.08,ease:'power2.out',onComplete:function(){arcs.forEach(function(a){a.style.strokeDasharray='';a.style.strokeDashoffset=''})}});
    gsap.from('.dot',{opacity:0,scale:.4,transformOrigin:'center',duration:.6,stagger:.06,delay:.5,ease:'back.out(2)'});
    setTimeout(function(){flyAlong($('.arc[data-dest="'+cur.id+'"]'),mapPl,1400)},900)}});
  ScrollTrigger.create({trigger:rank,start:'top 85%',once:true,onEnter:function(){rank.classList.add('in')}});
}else if(rank)rank.classList.add('in');

/* ── Шкала отмены: 21 день и больше — 100% ───────────────────────── */
function cancelScale(r,o,t){if(!r)return;var f=function(){var v=+r.value;o.textContent=v+' '+L.cancelD;var ok=v>=21;t.textContent=ok?L.cancelOk:L.cancelNo;t.classList.toggle('ok',ok)};r.oninput=f;f()}
cancelScale($('#cx-r'),$('#cx-o'),$('#cx-t'));
cancelScale($('#cx-r2'),$('#cx-o2'),$('#cx-t2'));

/* ── Шторки ───────────────────────────────────────────────────────── */
var lastFocus=null,openEl=null;
function openSheet(el){if(openEl&&openEl!==el){openEl.classList.remove('on');openEl.hidden=true}lastFocus=lastFocus||d.activeElement;openEl=el;el.hidden=false;requestAnimationFrame(function(){el.classList.add('on')});var f=$('.sh-x',el);if(f)f.focus();d.addEventListener('keydown',escK);root.style.overflow='hidden';if(dock)dock.classList.add('away')}
function closeSheet(){var el=openEl;if(!el)return;openEl=null;el.classList.remove('on');d.removeEventListener('keydown',escK);root.style.overflow='';if(dock)dock.classList.remove('away');setTimeout(function(){el.hidden=true},350);if(lastFocus&&lastFocus.focus)lastFocus.focus();lastFocus=null}
function escK(e){if(e.key==='Escape')closeSheet()}
$$('.sheet').forEach(function(s){$$('[data-close]',s).forEach(function(b){b.onclick=closeSheet});s.addEventListener('click',function(e){if(e.target===s)closeSheet()})});

/* ── Карточка тура ────────────────────────────────────────────────── */
var tour=null;
function openTour(x,h,m){var dt=depDate(x,m),sum=tourTotal(x,h,m),back=new Date(Date.UTC(dt.y,dt.m-1,dt.d+x.nights));
  var bo={d:back.getUTCDate(),m:back.getUTCMonth()+1};
  tour={x:x,h:h,m:m,sum:sum,when:dayStr(dt),nights:x.nights,hotel:L.hotel.replace('@',h.s)};
  $('#tu-gal').innerHTML=[x.img,h.img,HOT[(HOT.indexOf(h)+1)%3].img].map(function(n,i){return img(n,i?tour.hotel:x.t,false)}).join('');
  $('#tu-k').textContent=x.t+' · '+x.nights+' '+L.nightsW+' · '+L.meal[h.meal];
  $('#tu-h').textContent=tour.hotel;
  $('#tu-sum').textContent=usd(sum);$('#tu-pp').textContent=usd(r10(sum/people()))+' '+L.perP+' · '+whoStr();
  $('#tu-adv').textContent=usd(r10(sum*K.adv/100));
  var mid=x.nights>1?'2-'+x.nights:'2';
  $('#tu-days').innerHTML=[['1 · '+tour.when,L.days[0]],[mid,L.days[1]],[(x.nights+1)+' · '+dayStr(bo),L.days[2]]].map(function(r){return '<li><b>'+r[0]+'</b>'+r[1]+'</li>'}).join('');
  var v=[L.vouHotel+' ('+h.s+'★)',L.vouRoom,L.vouFloor,L.meal[h.meal],tour.when,dayStr(bo),whoStr()];
  $('#tu-vf').innerHTML=L.vouF.map(function(k,i){return '<dt>'+k+'</dt><dd>'+v[i]+'</dd>'}).join('');
  var r2=$('#cx-r2');if(r2){r2.value=30;r2.oninput()}
  openSheet($('#tur'));$('.sh-in',$('#tur')).scrollTop=0}
$('#tu-book').onclick=function(){openBron(tour)};

/* ── Бронь: их Telegram с готовым текстом, дальше статус ──────────── */
var bron=$('#bron'),bf=$('#bf'),stat=$('#stat'),mine=$('#mine'),stT=0;
function brSum(o){return o.dest+' · '+o.when+' · '+o.who+' · '+o.hotel+' · '+usd(o.sum)}
function openBron(t){var o=t&&t.x?{dest:t.x.t,when:t.when,who:whoStr(),hotel:t.hotel,nights:t.nights,sum:t.sum}:t;bron._o=o;
  $('#br-sum').textContent=o?brSum(o):'';$('#br-sum').hidden=!o;bf.hidden=false;stat.hidden=true;$('#bf-e').hidden=true;openSheet(bron)}
$$('[data-spec]').forEach(function(b){b.onclick=function(){openBron({dest:L.spec,when:'',who:whoStr(),hotel:'All Inclusive',nights:K.spec.nights,sum:K.spec.total})}});
bf.onsubmit=function(e){e.preventDefault();var n=$('#bf-n').value.trim(),p=$('#bf-p').value.trim(),c=$('#bf-c').value.trim();
  if(!n||p.replace(/\D/g,'').length<9){$('#bf-e').hidden=false;return}
  var o=bron._o||{dest:'',when:'',who:whoStr(),hotel:'',nights:'',sum:0};
  var msg=L.msg.replace('@D',o.dest).replace('@W',o.when).replace('@P',o.who).replace('@H',o.hotel).replace('@N',o.nights).replace('@S',usd(o.sum)).replace('@NM',n).replace('@PH',p).replace('@NT',c);
  var sm=$('#bf-sms');if(sm)sm.href='sms:'+K.sms+'?&body='+encodeURIComponent(msg);
  try{navigator.clipboard.writeText(msg).catch(function(){})}catch(er){}
  var a=d.createElement('a');a.href=K.tg+'?text='+encodeURIComponent(msg);a.target='_blank';a.rel='noopener';d.body.appendChild(a);a.click();a.remove();
  var st={t0:Date.now(),o:o};try{localStorage.setItem('st-bron',JSON.stringify(st))}catch(er){}
  showStat(st)};
function showStat(st){bf.hidden=true;stat.hidden=false;$('#br-sum').textContent=st.o&&st.o.dest?brSum(st.o):'';$('#br-sum').hidden=!(st.o&&st.o.dest);
  $$('li',stat).forEach(function(li){var i=+li.getAttribute('data-i');li.classList.toggle('done',i===0);li.classList.toggle('now',i===1)});
  if(mine)mine.hidden=false;clearTimeout(stT);
  (function tick(){var left=Math.max(0,15*6e4-(Date.now()-st.t0));var el=$('#st-tm');if(el)el.textContent=pad(Math.floor(left/6e4))+':'+pad(Math.floor(left%6e4/1e3));if(left)stT=setTimeout(tick,1000)})()}
try{var saved=JSON.parse(localStorage.getItem('st-bron')||'null');if(saved&&Date.now()-saved.t0<864e5&&mine){mine.hidden=false;mine._s=saved}}catch(er){}
if(mine)mine.onclick=function(){var s;try{s=JSON.parse(localStorage.getItem('st-bron')||'null')}catch(er){}if(!s)return;bron._o=s.o;openSheet(bron);showStat(s)};

/* ── SEM Club: кэшбэк ─────────────────────────────────────────────── */
var cs=$('#cl-sum'),cb=0.5;
function club(){var v=+cs.value;$('#cl-so').textContent=usd(v);roll($('#cl-cb'),Math.round(v*cb/100),'$');roll($('#cl-5'),Math.round(v*cb/100*5),'$')}
if(cs){cs.oninput=club;$$('#cl-st button').forEach(function(b){b.onclick=function(){$$('#cl-st button').forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});cb=+b.getAttribute('data-cb');club()}});club()}

/* ── Появление блоков ─────────────────────────────────────────────── */
var rvs=$$('.rv');
if(CALM||!('IntersectionObserver' in window))rvs.forEach(function(e){e.classList.add('in')});
else{var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:.08});rvs.forEach(function(e){io.observe(e)})}

/* ── Конструктор цены и отсчёт 48 часов ───────────────────────────── */
var rows=$$('#konstruktor input[data-k]'),sumEl=$('#kit-sum'),addEl=$('#kit-add'),nEl=$('#kit-cnt');
function kit(){var add=0,n=0;rows.forEach(function(r){if(r.checked){add+=+r.getAttribute('data-p');n++}});addEl.textContent=fmt(add)+' $';nEl.textContent=n;roll(sumEl,K.offer.base+add,'',' $')}
if(sumEl)sumEl.setAttribute('data-v',K.offer.base);
rows.forEach(function(r){r.onchange=kit});
var all=$('#kit-all');if(all)all.onclick=function(){var on=rows.some(function(r){return!r.checked});rows.forEach(function(r){r.checked=on});kit()};
var cp=$('#kit-copy');if(cp)cp.onclick=function(){var lines=[K.offer.head,'• '+K.offer.baseName+': '+fmt(K.offer.base)+' $'];rows.forEach(function(r){if(r.checked){var it=K.offer.items.filter(function(x){return x.id===r.getAttribute('data-k')})[0];lines.push('• '+it.t+': '+fmt(it.p)+' $')}});lines.push(K.offer.totalW+': '+sumEl.textContent);
  var txt=lines.join('\n');try{navigator.clipboard.writeText(txt).then(function(){cp.lastChild.textContent=K.offer.copied},function(){})}catch(e){}cp.lastChild.textContent=K.offer.copied};
var tm=$('#tm');
if(tm){var start=Date.now();try{var s0=+localStorage.getItem('st-offer-1');if(s0&&s0<=Date.now())start=s0;else localStorage.setItem('st-offer-1',String(start))}catch(e){}
  var end=start+K.offer.hours*36e5;
  (function tick(){var left=Math.max(0,end-Date.now());if(!left){$('#timer').classList.add('over');tm.textContent='00:00:00';$('#timer span').firstChild.textContent=K.offer.ended;return}
    tm.textContent=pad(Math.floor(left/36e5))+':'+pad(Math.floor(left%36e5/6e4))+':'+pad(Math.floor(left%6e4/1e3));setTimeout(tick,1000)})()}

/* Маршрут первого экрана оживает после заставки DevUz */
(function wait(n){if(d.getElementById('dzi')&&n<120){setTimeout(function(){wait(n+1)},150);return}flyAlong(rp,rpl,1600)})(0);
})();
