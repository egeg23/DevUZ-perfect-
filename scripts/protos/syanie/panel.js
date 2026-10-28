(function(){
'use strict';
/* Панель клиники «Сияние Севера». Заявки и чаты с сайта — общее состояние
   window.SY (store.js): смена статуса здесь видна пациенту на сайте. Своё —
   в localStorage `sy-panel-1`: роль, подключение amoCRM (без токена), статусы
   демо-заявок, шаблоны напоминаний. Демо-цифры — из одного зерна, поэтому
   сводка, заявки, расписание и история сходятся между собой. */
var d=document,K=JSON.parse(d.getElementById('sy-panel').textContent),DOC=K.doctors,B=K.brand;
var REDUCED=false;try{REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
var $=function(s,r){return (r||d).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))};
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function rub(n){return fmt(n)+' ₽'}
function mln(n){return (n/1e6).toFixed(1).replace('.',',')+' млн ₽'}
function pad(n){return (n<10?'0':'')+n}
function ic(k){return '<svg class="ic" aria-hidden="true"><use href="#p-'+k+'"/></svg>'}
var WD=['вс','пн','вт','ср','чт','пт','сб'],MON=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
var NOW=Date.now(),DAY=864e5,TODAY=new Date(new Date(NOW).setHours(0,0,0,0)).getTime();
function day0(ts){return new Date(new Date(ts).setHours(0,0,0,0)).getTime()}
function tstr(ts){var x=new Date(ts);return pad(x.getHours())+':'+pad(x.getMinutes())}
function dstr(ts){var x=new Date(ts);return pad(x.getDate())+'.'+pad(x.getMonth()+1)}
function dayName(t0){var k=Math.round((t0-TODAY)/DAY);if(k===0)return 'Сегодня';if(k===1)return 'Завтра';if(k===-1)return 'Вчера';var x=new Date(t0);return WD[x.getDay()]+' '+dstr(t0)}
function dayLong(t0){var x=new Date(t0);return x.getDate()+' '+MON[x.getMonth()]}
function ago(ts){var m=(Date.now()-ts)/6e4;if(m<2)return 'только что';if(m<60)return Math.round(m)+' мин назад';if(day0(ts)===TODAY)return 'сегодня в '+tstr(ts);if(day0(ts)===TODAY-DAY)return 'вчера в '+tstr(ts);return dstr(ts)+' в '+tstr(ts)}
function plural(n,a,b,c){var m=n%10,mm=n%100;return n+' '+(m===1&&mm!==11?a:m>=2&&m<=4&&(mm<10||mm>=20)?b:c)}

/* ── Своё состояние панели ─────────────────────────────────────────── */
var PK='sy-panel-1',PS;
function pload(){try{PS=JSON.parse(localStorage.getItem(PK)||'null')}catch(e){PS=null}
  if(!PS||PS.v!==1)PS={v:1};PS.role=PS.role||'owner';PS.st=PS.st||{};PS.lg=PS.lg||{};PS.amoD=PS.amoD||{};PS.amoLog=PS.amoLog||[];
  PS.amo=PS.amo||{ok:false,sub:'',pipe:'p1',stage:'s1',resp:'admin',tags:{site:true,quiz:true,chat:true},auto:false,last4:''};
  PS.tg=PS.tg||{day:true,h2:true,tplDay:'',tplH2:''};PS.chat=PS.chat||{}}
function psave(){try{localStorage.setItem(PK,JSON.stringify(PS))}catch(e){}}
pload();
addEventListener('storage',function(e){if(e.key===PK){pload();soft()}});
function who(){return PS.role==='owner'?'Главный врач':'Администратор'}
function owner(){return PS.role==='owner'}

/* ── Демо-данные из одного зерна ───────────────────────────────────── */
var zr=20261028;function rnd(){zr=(zr*1664525+1013904223)>>>0;return zr/4294967296}
function pick(a,w){if(!w)return a[Math.floor(rnd()*a.length)];var t=0,i,r;for(i=0;i<w.length;i++)t+=w[i];r=rnd()*t;for(i=0;i<a.length;i++){r-=w[i];if(r<0)return a[i]}return a[a.length-1]}
var NAMES=['Ольга','Татьяна','Наталья','Елена','Ирина','Светлана','Галина','Людмила','Валентина','Нина','Сергей','Александр','Владимир','Николай','Михаил','Андрей','Виктор','Юрий','Геннадий','Анатолий'];
var LET='АБВГДЕЗКЛМНОПРСТФЧШ';
function demoName(){return pick(NAMES)+' '+LET.charAt(Math.floor(rnd()*LET.length))+'.'}
function demoPhone(){return '+7 9•• •••-'+pad(Math.floor(rnd()*100))+'-'+pad(Math.floor(rnd()*100))}
var SRC={booking:'Сайт: запись',quiz:'Сайт: квиз',chat:'Сайт: чат',maps:'Яндекс Карты',call:'Звонок'},SRCK=['booking','quiz','chat','maps','call'],SRCW=[26,22,14,20,18];
var Q=[['Верхнюю','Нижнюю','Обе'],['Да','Нет'],['Под анестезией','Под седацией, во сне','Посчитайте оба варианта'],['Да, нужна','Нет, спасибо']];
function demoWhat(src){if(src==='booking')return 'Бесплатная консультация All-on-6';
  if(src==='quiz')return 'Расчёт All-on-6: '+Q.map(function(a){return pick(a)}).join(', ');
  if(src==='chat')return pick(['Из чата: сколько стоит под ключ','Из чата: можно ли в рассрочку','Из чата: больно ли ставить импланты','Из чата: сколько ходить без зубов']);
  if(src==='maps')return 'Консультация по имплантации';return pick(['Консультация, позвонил сам','Хочет план лечения по своим снимкам'])}
var WHEN=['сегодня вечером','завтра утром','завтра днём','завтра вечером','на этой неделе днём'];
var STEPS=['Заявка','Консультация','КТ','План лечения','Операция'];
var DEMO=[],nd=0;
for(var dd=62;dd>=0;dd--){var base=TODAY-dd*DAY,cnt=Math.round((2.6+rnd()*2.4)*(1+(62-dd)/62*.25));
  for(var k=0;k<cnt;k++){var at=base+(9+rnd()*12)*36e5;if(at>NOW-20*6e4)continue;var src=pick(SRCK,SRCW),age=(NOW-at)/DAY,step=0;
    if(age>1&&rnd()<.64){step=1;if(age>2&&rnd()<.8){step=2;if(age>3&&rnd()<.86){step=3;if(age>6&&rnd()<.5)step=4}}}
    var st=step?'came':age<.25?'new':age<2?'confirmed':(rnd()<.4?'canceled':'confirmed');
    if(st==='confirmed'&&age>=2)st='canceled';
    var op=step===4?pick(K.prices,[40,60]):null;
    DEMO.push({id:'d'+(++nd),at:at,name:demoName(),phone:demoPhone(),src:src,what:demoWhat(src),when:src==='booking'||src==='maps'?pick(WHEN):'',st0:st,step:step,op:op,opAt:op?at+(5+rnd()*9)*DAY*.5:0,demo:true})}}
DEMO.sort(function(a,b){return b.at-a.at});

/* Расписание двух врачей: неделя вперёд и вчера. Операции у хирурга. */
var H0=B.open,H1=B.close,APPT=[];
(function(){for(var o=-1;o<=6;o++){var t0=TODAY+o*DAY,i;
  var sav=DOC[1]?DOC[1].id:DOC[0].id,reu=DOC[0].id;
  if(rnd()<.6)APPT.push({doc:sav,t0:t0,h:H0,len:4,kind:'Операция All-on-6',name:demoName(),phone:demoPhone(),tg:rnd()<.8});
  for(i=H0;i<H1;i++){if(rnd()<.5)APPT.push({doc:reu,t0:t0,h:i,len:1,kind:pick(['Консультация','Консультация','План лечения']),name:demoName(),phone:demoPhone(),tg:rnd()<.75})}
  for(i=H0+5;i<H1;i++){if(rnd()<.35)APPT.push({doc:sav,t0:t0,h:i,len:1,kind:'Консультация хирурга',name:demoName(),phone:demoPhone(),tg:rnd()<.75})}}})();
APPT.forEach(function(a){a.st=a.t0+a.h*36e5<NOW?'came':rnd()<.7?'confirmed':'new'});

var LOG0=[];(function(){var acts=[['Администратор','Подтвердил запись'],['Администратор','Перенёс запись на другое время'],['Главный врач','Составил план лечения'],['Администратор','Отметил: пациент пришёл'],['amoCRM','Сделка создана в amoCRM'],['Бот клиники','Напоминание за день ушло'],['Бот клиники','Пациент подтвердил запись кнопкой в Telegram'],['Сайт','Новая заявка с сайта']];
  for(var i=0;i<28;i++){var a=pick(acts),l=DEMO[Math.floor(rnd()*Math.min(60,DEMO.length))];LOG0.push({at:NOW-(i*95+rnd()*80)*6e4,who:a[0],t:a[1]+': '+l.name,demo:true})}})();

var DCHATS=[
  {id:'dc1',demo:true,mode:'ai',name:'Галина П.',at:NOW-50*6e4,msgs:[{from:'user',text:'Сколько стоит All-on-6 под ключ?',at:NOW-52*6e4},{from:'ai',text:'Под ключ, 6 имплантатов и несъёмный протез: 259 900 ₽. Точную сумму главный врач назовёт после КТ, а КТ сейчас бесплатно. Записать вас на консультацию?',at:NOW-51*6e4},{from:'user',text:'Да, завтра вечером',at:NOW-50*6e4},{from:'ai',text:'Хорошо, передала администратору. Он позвонит и подтвердит время.',at:NOW-50*6e4}]},
  {id:'dc2',demo:true,mode:'tg',name:'Виктор С.',at:NOW-25*6e4,msgs:[{from:'user',text:'Можно в рассрочку?',at:NOW-40*6e4},{from:'manager',text:'Да, рассрочка от клиники под 0% и без первого взноса. Срок и платёж в месяц посчитаем на консультации.',at:NOW-36*6e4},{from:'user',text:'А на консультацию в субботу можно?',at:NOW-25*6e4}]}
];

/* ── Заявки: с сайта (SY) и демо ───────────────────────────────────── */
function siteLeads(){var s=window.SY?SY.get():{leads:[]};return (s.leads||[]).map(function(l){return {id:l.id,at:l.at,name:l.name||'',phone:l.phone||'',src:l.src||'booking',what:l.what||'',when:l.when||'',st0:l.status||'new',amo:l.amo||null,log:l.log||[],slot:l.slot||null,site:true}})}
function demoLeads(days){var a=NOW-(days||14)*DAY;return DEMO.filter(function(l){return l.at>a})}
function statusOf(l){return l.site?l.st0:(PS.st[l.id]||l.st0)}
function amoOf(l){return l.site?l.amo:(PS.amoD[l.id]||null)}
function logOf(l){if(l.site)return l.log;var g=[{at:l.at,who:l.src==='call'?'Администратор':SRC[l.src],t:l.src==='call'?'Записал звонок':'Заявка'}];
  if(l.st0==='confirmed'||l.st0==='came')g.push({at:l.at+40*6e4,who:'Администратор',t:'Подтвердил запись'});
  for(var i=1;i<=l.step;i++)g.push({at:l.at+i*DAY*.6,who:i===1?'Администратор':'Главный врач',t:i===1?'Пациент пришёл на консультацию':STEPS[i]});
  if(l.st0==='canceled')g.push({at:l.at+DAY,who:'Администратор',t:'Отменил: пациент не пришёл'});
  return g.concat(PS.lg[l.id]||[])}
function allLeads(){return siteLeads().concat(demoLeads(14))}
function findLead(id){var all=siteLeads().concat(DEMO);for(var i=0;i<all.length;i++)if(all[i].id===id)return all[i];return null}
function nm(l){return l.name||'Без имени'}
var STT={new:{t:'Новая',act:'Вернул в новые'},confirmed:{t:'Подтверждена',act:'Подтвердил запись'},came:{t:'Был на приёме',act:'Отметил: пациент пришёл'},canceled:{t:'Отменена',act:'Отменил запись'}};

/* Где запись в расписании: выбранное время или первое свободное по «когда удобно». */
var PARTS={'утром':[0,3],'днём':[3,8],'вечером':[8,12]};
function busy(doc,t0,hh,skip){for(var i=0;i<APPT.length;i++){var a=APPT[i];if(a.doc===doc&&a.t0===t0&&hh>=a.h&&hh<a.h+a.len)return true}
  return siteSlots().some(function(x){return x.lead.id!==skip&&x.doc===doc&&x.t0===t0&&x.h===hh})}
var SLOTS=null;
function siteSlots(){if(SLOTS)return SLOTS;SLOTS=[];var ls=siteLeads().filter(function(l){return l.st0!=='canceled'}).sort(function(a,b){return a.at-b.at});
  ls.forEach(function(l){var s=l.slot||place(l);if(s)SLOTS.push({lead:l,doc:s.doc,t0:s.t0,h:s.h,fixed:!!l.slot})});return SLOTS}
function place(l){var w=(l.when||'').toLowerCase();if(!w)return null;var off=/сегодня/.test(w)?0:/завтра/.test(w)?1:/недел/.test(w)?2:-1;if(off<0)return null;
  var pr=[0,12];for(var p in PARTS)if(w.indexOf(p)>=0)pr=PARTS[p];
  for(var dd=0;dd<5;dd++){var t0=day0(l.at)+(off+dd)*DAY;if(t0<TODAY)t0=TODAY;
    for(var i=H0+pr[0];i<H0+pr[1]&&i<H1;i++){if(t0+i*36e5<NOW)continue;for(var j=0;j<DOC.length;j++){var dc=DOC[j].id;if(!busy(dc,t0,i,l.id)&&!SLOTS.some(function(x){return x.doc===dc&&x.t0===t0&&x.h===i}))return {doc:dc,t0:t0,h:i}}}
    pr=[0,12]}
  return null}
function slotOf(l){var s=siteSlots().filter(function(x){return x.lead.id===l.id})[0];return s||null}
function docName(id){for(var i=0;i<DOC.length;i++)if(DOC[i].id===id)return DOC[i].short;return ''}

/* ── Действия ──────────────────────────────────────────────────────── */
function setStatus(id,st){var l=findLead(id);if(!l)return;var w=who(),t=STT[st].act,at=Date.now();
  if(l.site){var sl=slotOf(l);SY.set(function(s){s.leads.forEach(function(x){if(x.id!==id)return;x.status=st;x.log=x.log||[];x.log.push({at:at,who:w,t:t});if(st==='confirmed'&&!x.slot&&sl)x.slot={doc:sl.doc,t0:sl.t0,h:sl.h}})})}
  else{PS.st[id]=st;(PS.lg[id]=PS.lg[id]||[]).push({at:at,who:w,t:t});psave()}
  SY.note(w,t+': '+nm(l));toast(t+': '+nm(l))}
function amoSend(id,quiet){var l=findLead(id);if(!l||amoOf(l))return;
  if(!PS.amo.ok){toast('Сначала подключите amoCRM');location.hash='#amo';return}
  var deal=10000000+Math.floor(Math.random()*89999999),at=Date.now(),t='Сделка №'+deal+' создана в amoCRM';
  if(l.site)SY.set(function(s){s.leads.forEach(function(x){if(x.id!==id)return;x.amo={deal:deal,at:at};x.log=x.log||[];x.log.push({at:at,who:'amoCRM',t:t})})});
  else{PS.amoD[id]={deal:deal,at:at};(PS.lg[id]=PS.lg[id]||[]).push({at:at,who:'amoCRM',t:t})}
  PS.amoLog.unshift({at:at,dir:'out',t:t+': '+nm(l)+', '+SRC[l.src]});if(PS.amoLog.length>60)PS.amoLog.length=60;psave();
  SY.note('amoCRM',t+': '+nm(l));if(!quiet)toast(t)}
function unsent(){return siteLeads().filter(function(l){return !l.amo&&l.st0!=='canceled'})}

/* ── Каркас: роли, разделы, значки ─────────────────────────────────── */
var view=$('#view'),R={tab:'svodka',sub:'',filter:'all',day:0,hist:'all',amoLead:''};
function route(){var x=(location.hash||'#svodka').slice(1).split('/');R.tab=x[0]||'svodka';R.sub=x[1]?decodeURIComponent(x[1]):'';
  if(!/^(svodka|zayavki|raspisanie|amo|chaty|napominaniya|istoriya)$/.test(R.tab))R.tab='svodka'}
function badges(){var nNew=allLeads().filter(function(l){return statusOf(l)==='new'}).length,nCh=chats().filter(waits).length,nA=PS.amo.ok?unsent().length:0;
  var m={zayavki:nNew,chaty:nCh,amo:nA,more:nCh};$$('[data-nb]').forEach(function(b){var v=m[b.getAttribute('data-nb')]||0;b.hidden=!v;b.textContent=v})}
function shell(){$$('[data-tab]').forEach(function(a){var on=a.getAttribute('data-tab')===R.tab;if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
  var more=$('#dk-more');if(more)more.classList.toggle('on',/^(chaty|napominaniya|istoriya)$/.test(R.tab));
  $$('.role [data-role]').forEach(function(b){b.setAttribute('aria-checked',String(b.getAttribute('data-role')===PS.role))});
  d.body.setAttribute('data-role',PS.role)}
var pending=false;
/* Изменение из другой вкладки не стирает то, что человек сейчас печатает. */
function soft(){var a=d.activeElement;if(a&&view.contains(a)&&/^(INPUT|TEXTAREA)$/.test(a.tagName)&&a.value&&a.type!=='checkbox'){pending=true;return}render()}
function render(){SLOTS=null;NOW=Date.now();
  pending=false;route();shell();badges();var f=V[R.tab]||V.svodka;view.innerHTML=f();view.setAttribute('data-v',R.tab);after()}
d.addEventListener('focusout',function(){if(pending)setTimeout(function(){if(pending)render()},0)});
function after(){var ta=$('#ch-log');if(ta)ta.scrollTop=ta.scrollHeight}

var tmr=0;function toast(t){var el=$('#toast');el.textContent=t;el.hidden=false;el.classList.add('on');clearTimeout(tmr);tmr=setTimeout(function(){el.classList.remove('on');setTimeout(function(){el.hidden=true},300)},2600)}
function pg(title,lead,body,act){return '<div class="pg-h"><div><h1>'+title+'</h1>'+(lead?'<p>'+lead+'</p>':'')+'</div>'+(act||'')+'</div>'+body}
function card(title,body,cls,extra){return '<section class="cd '+(cls||'')+'">'+(title?'<div class="cd-h"><h2>'+title+'</h2>'+(extra||'')+'</div>':'')+body+'</section>'}
function chip(st){return '<span class="st st-'+st+'">'+STT[st].t+'</span>'}
function delta(a,b){if(!b)return '<span class="dl">новое</span>';var x=(a-b)/b,up=x>=0;return '<span class="dl '+(up?'up':'down')+'">'+(up?'↑':'↓')+' '+Math.round(Math.abs(x)*100)+'% к прошлой неделе</span>'}
var V={};

/* ── Сводка ────────────────────────────────────────────────────────── */
function inRange(ts,a,b){return ts>a&&ts<=b}
V.svodka=function(){var t=Date.now(),w1=t-7*DAY,w2=t-14*DAY,all=siteLeads().concat(DEMO);
  var lw=all.filter(function(l){return inRange(l.at,w1,t)}),pw=all.filter(function(l){return inRange(l.at,w2,w1)});
  var rec=function(a){return a.filter(function(l){var s=statusOf(l);return s==='confirmed'||s==='came'}).length};
  var m30=all.filter(function(l){return l.at>t-30*DAY});
  var ops=DEMO.filter(function(l){return l.op&&l.opAt>t-30*DAY&&l.opAt<=t}),opsP=DEMO.filter(function(l){return l.op&&l.opAt>t-60*DAY&&l.opAt<=t-30*DAY});
  var rev=ops.reduce(function(s,l){return s+l.op.price},0),revP=opsP.reduce(function(s,l){return s+l.op.price},0);
  var kp='<div class="kpis">'+kpi('Заявки за неделю',lw.length,delta(lw.length,pw.length))+kpi('Записались',rec(lw),delta(rec(lw),rec(pw)))+
    (owner()?kpi('Выручка по операциям, 30 дней',mln(rev),'<span class="dl '+(rev>=revP?'up':'down')+'">'+(rev>=revP?'↑':'↓')+' '+Math.round(Math.abs(rev-revP)/Math.max(1,revP)*100)+'% к прошлым 30 дням</span>','own')+kpi('Средний чек',rub(ops.length?rev/ops.length:0),'<span class="dl">'+plural(ops.length,'операция','операции','операций')+' за 30 дней</span>','own'):kpi('Операций за 30 дней',ops.length,'<span class="dl">по плану лечения</span>')+kpi('Новых без ответа',all.filter(function(l){return statusOf(l)==='new'&&l.at>t-14*DAY}).length,'<span class="dl">позвонить сегодня</span>'))+'</div>';
  /* График: 14 дней, заявки и сколько из них записались. */
  var cols='',mx=1,ser=[];for(var i=13;i>=0;i--){var a=TODAY-i*DAY,b=a+DAY,ls=all.filter(function(l){return l.at>=a&&l.at<b});ser.push({t0:a,n:ls.length,r:rec(ls)});if(ls.length>mx)mx=ls.length}
  ser.forEach(function(s,i){cols+='<div class="bc'+(i>=7?' now':'')+'" title="'+dayName(s.t0)+': заявок '+s.n+', записались '+s.r+'"><div class="bc-b"><i style="height:'+(s.n/mx*100)+'%"></i><b style="height:'+(s.r/mx*100)+'%"></b></div><span>'+(i%2&&i!==13?'':(i===13?'сег.':dstr(s.t0)))+'</span></div>'});
  var chart='<div class="bars" role="img" aria-label="Заявки по дням за 14 дней">'+cols+'</div><p class="lgd"><span class="k1">заявки</span><span class="k2">из них записались</span><span class="k3">прошлая неделя светлее</span></p>';
  /* Воронка за 30 дней */
  var fun=STEPS.map(function(s,i){return m30.filter(function(l){return i===0||(l.step||0)>=i}).length});
  var fn='<ol class="fun">'+fun.map(function(n,i){return '<li><span>'+STEPS[i]+'</span><div class="fb"><i style="width:'+(n/Math.max(1,fun[0])*100)+'%"></i></div><b>'+n+'</b><small>'+(i?Math.round(n/Math.max(1,fun[i-1])*100)+'%':'')+'</small></li>'}).join('')+'</ol><p class="cd-n">Процент: сколько дошли от прошлого шага. Шаги ставит администратор и главный врач в заявке.</p>';
  /* Источники */
  var by={};m30.forEach(function(l){by[l.src]=(by[l.src]||0)+1});var smx=Math.max.apply(null,SRCK.map(function(k){return by[k]||0}).concat([1]));
  var so='<ul class="src">'+SRCK.map(function(k){var n=by[k]||0;return '<li><span>'+SRC[k]+'</span><div class="fb"><i style="width:'+(n/smx*100)+'%"></i></div><b>'+n+'</b><small>'+Math.round(n/Math.max(1,m30.length)*100)+'%</small></li>'}).join('')+'</ul>';
  /* Сегодня */
  var today=dayAppts(TODAY).filter(function(a){return a.h+a.len>new Date().getHours()}).slice(0,6);
  var td=today.length?'<ul class="tdy">'+today.map(function(a){return '<li'+(a.lead?' class="site"':'')+'><b>'+pad(a.h)+':00</b><span>'+h(a.name)+'<small>'+h(a.kind)+' · '+docName(a.doc)+'</small></span>'+(a.lead?'<a class="tag" href="#zayavki/'+encodeURIComponent(a.lead.id)+'">с сайта</a>':chip(a.st))+'</li>'}).join('')+'</ul>':'<p class="cd-n">На сегодня больше записей нет.</p>';
  return pg('Сводка','Неделя к прошлой неделе. Клиника работает '+h(B.hours.toLowerCase())+'.',kp+
    '<div class="g2">'+card('Требует внимания',attention())+card('Ближайшие записи сегодня',td,'','<a class="lk" href="#raspisanie">Расписание</a>')+'</div>'+
    card('Заявки по дням',chart,'wide')+
    '<div class="g2">'+card('Воронка за 30 дней',fn)+card('Откуда пришли, 30 дней',so)+'</div>'+
    (owner()?'':'<p class="role-n">Администратор не видит выручку и средний чек: это только у главного врача.</p>'))};
function kpi(l,v,dl,cls){return '<div class="kpi '+(cls||'')+'"><small>'+l+'</small><b>'+v+'</b>'+(dl||'')+'</div>'}
function attention(){var t=Date.now(),out=[],nNew=allLeads().filter(function(l){return statusOf(l)==='new'}),site=siteLeads().filter(function(l){return l.st0==='new'});
  if(site.length)out.push(['spark','Заявки с сайта ждут звонка: '+site.length,'#zayavki/'+encodeURIComponent(site[0].id),'hot']);
  else if(nNew.length)out.push(['inbox','Новых заявок без ответа: '+nNew.length,'#zayavki','']);
  var cw=chats().filter(waits);if(cw.length)out.push(['chat','Пациент ждёт ответа в чате: '+cw.map(function(c){return c.name}).join(', '),'#chaty/'+encodeURIComponent(cw[0].id),'hot']);
  if(!PS.amo.ok)out.push(['link','amoCRM не подключена: заявки не попадают в воронку','#amo','']);else if(unsent().length)out.push(['link','Не отправлены в amoCRM: '+unsent().length,'#amo','']);
  var tm=dayAppts(TODAY+DAY),noTg=tm.filter(function(a){return !a.tg&&!a.lead}).length;
  if(tm.length)out.push(['bell','Завтра '+plural(tm.length,'запись','записи','записей')+(PS.tg.day?': напоминание уйдёт за сутки':': напоминания выключены'),'#napominaniya',PS.tg.day?'':'hot']);
  if(noTg)out.push(['phone','Без Telegram завтра: '+noTg+'. Им администратор звонит сам','#raspisanie','']);
  return '<ul class="att">'+out.map(function(o){return '<li class="'+o[3]+'"><a href="'+o[2]+'">'+ic(o[0])+'<span>'+h(o[1])+'</span></a></li>'}).join('')+'</ul>'}

/* ── Заявки ────────────────────────────────────────────────────────── */
var FILT=[['all','Все'],['new','Новые'],['confirmed','Подтверждены'],['came','Были'],['canceled','Отменены']];
V.zayavki=function(){var ls=allLeads(),site=ls.filter(function(l){return l.site}),cnt={all:ls.length};ls.forEach(function(l){var s=statusOf(l);cnt[s]=(cnt[s]||0)+1});
  var f=R.filter,list=ls.filter(function(l){return f==='all'||statusOf(l)===f});
  var row=function(l){var s=statusOf(l),fresh=l.site&&Date.now()-l.at<30*6e4,sel=R.sub===l.id;
    return '<li><a class="lr'+(l.site?' site':'')+(sel?' sel':'')+'" href="#zayavki/'+encodeURIComponent(l.id)+'"'+(sel?' aria-current="true"':'')+'><span class="lr-t"><b>'+h(nm(l))+'</b>'+(l.site?'<em class="tag">'+(fresh?'с сайта, только что':'с сайта')+'</em>':'')+'</span><span class="lr-w">'+h(l.what)+'</span><span class="lr-m">'+h(SRC[l.src])+(l.when?' · '+h(l.when):'')+' · '+ago(l.at)+'</span><span class="lr-s">'+chip(s)+(amoOf(l)?'<span class="amo-s">amo</span>':'')+'</span></a></li>'};
  var lst='<div class="flt" role="group" aria-label="Фильтр по статусу">'+FILT.map(function(x){return '<button type="button" data-act="filter" data-v="'+x[0]+'" aria-pressed="'+(f===x[0])+'">'+x[1]+' <span>'+(cnt[x[0]]||0)+'</span></button>'}).join('')+'</div>'+
    (site.length?'':'<p class="hint">'+ic('spark')+'<span>Запишитесь на <a href="__PROTO_BASE__">сайте клиники</a>: заявка появится здесь первой строкой.</span></p>')+
    '<ul class="lst">'+list.map(row).join('')+'</ul>';
  var l=R.sub?findLead(R.sub):null;
  return '<div class="split'+(l?' open':'')+'"><div class="sp-l">'+pg('Заявки','С сайта, квиза, чата, Яндекс Карт и звонков. Новые с сайта сверху.',lst)+'</div><div class="sp-r">'+(l?leadCard(l):'<div class="empty">'+ic('inbox')+'<p>Выберите заявку слева</p></div>')+'</div></div>'};
function leadCard(l){var s=statusOf(l),sl=l.site?slotOf(l):null,amo=amoOf(l),lg=logOf(l).slice().sort(function(a,b){return b.at-a.at});
  var btn=function(st,t,cls){return '<button type="button" class="btn '+(cls||'')+'" data-act="status" data-id="'+h(l.id)+'" data-v="'+st+'">'+t+'</button>'};
  var acts=s==='new'?btn('confirmed','Подтвердить запись','pri')+btn('canceled','Отменить','ghost'):s==='confirmed'?btn('came','Пришёл на приём','pri')+btn('canceled','Отменить','ghost')+btn('new','Вернуть в новые','ghost'):btn('new','Вернуть в новые','ghost');
  var amoRow=amo?'<p class="amo-ok">'+ic('check')+'<span>В amoCRM: <a href="https://'+h(PS.amo.sub||'siyanie.amocrm.ru')+'/leads/detail/'+amo.deal+'" target="_blank" rel="noopener">сделка №'+amo.deal+'</a><small>'+ago(amo.at)+'</small></span></p>':'<button type="button" class="btn line" data-act="amo-send" data-id="'+h(l.id)+'">'+ic('link')+'<span>Отправить заявку в amoCRM</span></button>';
  return '<article class="lc" aria-labelledby="lc-h"><a class="back" href="#zayavki">'+ic('back')+'<span>К заявкам</span></a>'+
    '<div class="lc-top"><div><h2 id="lc-h">'+h(nm(l))+'</h2><p>'+(l.site?'<em class="tag">с сайта</em> ':'')+h(SRC[l.src])+' · '+ago(l.at)+'</p></div>'+chip(s)+'</div>'+
    '<dl class="kv"><dt>Телефон</dt><dd>'+(l.phone?(l.site?'<a href="tel:'+h(l.phone.replace(/[^\d+]/g,''))+'">'+h(l.phone)+'</a>':h(l.phone)+' <small>демо</small>'):'придёт в SMS от пациента')+'</dd>'+
    '<dt>Что хочет</dt><dd>'+h(l.what||'не написал')+'</dd><dt>Когда удобно</dt><dd>'+h(l.when||'не выбрал: позвоните и договоритесь')+'</dd>'+
    (sl?'<dt>В расписании</dt><dd>'+dayName(sl.t0)+', '+pad(sl.h)+':00 · '+docName(sl.doc)+(sl.fixed?'':' <small>предварительно, до подтверждения</small>')+'</dd>':'')+
    (!l.site&&l.step?'<dt>Дошёл до шага</dt><dd>'+STEPS[l.step]+(l.op&&owner()?' · '+h(l.op.t)+', '+rub(l.op.price):'')+'</dd>':'')+'</dl>'+
    '<div class="acts">'+acts+'</div>'+(l.site?'<p class="cd-n">Статус сразу видит пациент на сайте: «Ваша заявка '+(s==='confirmed'?'подтверждена администратором':s==='came'?'вы были на приёме, спасибо':s==='canceled'?'отменена':'принята, администратор скоро свяжется')+'».</p>':'')+
    '<div class="amo-b">'+amoRow+'</div>'+
    '<h3>История заявки</h3><ol class="hist">'+lg.map(function(e){return '<li><time>'+ago(e.at)+'</time><b>'+h(e.who)+'</b><span>'+h(e.t)+'</span></li>'}).join('')+'</ol></article>'}

/* ── Расписание ────────────────────────────────────────────────────── */
function dayAppts(t0){var a=APPT.filter(function(x){return x.t0===t0}).map(function(x){return x});
  siteSlots().forEach(function(s){if(s.t0===t0)a.push({doc:s.doc,t0:t0,h:s.h,len:1,kind:'Консультация',name:nm(s.lead),st:s.lead.st0,lead:s.lead,tg:false,fixed:s.fixed})});
  return a.sort(function(x,y){return x.h-y.h})}
V.raspisanie=function(){var t0=TODAY+R.day*DAY,ap=dayAppts(t0),days='';
  for(var i=-1;i<=6;i++){var x=TODAY+i*DAY;days+='<button type="button" data-act="day" data-v="'+i+'" aria-pressed="'+(i===R.day)+'"><b>'+dayName(x)+'</b><small>'+(i>=-1&&i<=1?dstr(x):dayLong(x))+'</small></button>'}
  var g='<div class="grid" style="--n:'+DOC.length+'"><div class="gh"></div>'+DOC.map(function(dc){return '<div class="gh"><b>'+h(dc.short)+'</b><small>'+h(dc.role)+'</small></div>'}).join('');
  for(var hh=H0;hh<H1;hh++){g+='<div class="gt" style="grid-row:'+(hh-H0+2)+'">'+pad(hh)+':00</div>';
    DOC.forEach(function(dc,j){var a=ap.filter(function(x){return x.doc===dc.id&&x.h===hh})[0],cov=ap.some(function(x){return x.doc===dc.id&&hh>x.h&&hh<x.h+x.len});if(cov)return;
      var pos='grid-column:'+(j+2)+';grid-row:'+(hh-H0+2)+(a&&a.len>1?' / span '+a.len:'');
      if(!a){g+='<div class="slot free" style="'+pos+'"><span>свободно</span></div>';return}
      var inner='<b>'+h(a.kind)+'</b><span>'+h(a.name)+'</span>'+(a.lead?'<em class="tag">с сайта'+(a.fixed?'':', ждёт подтверждения')+'</em>':'<small>'+(a.st==='came'?'был на приёме':a.st==='confirmed'?'подтвердил':'не подтвердил')+(a.tg?'':' · без Telegram')+'</small>');
      g+=a.lead?'<a class="slot busy site" style="'+pos+'" href="#zayavki/'+encodeURIComponent(a.lead.id)+'">'+inner+'</a>':'<div class="slot busy'+(a.len>1?' op':'')+'" style="'+pos+'">'+inner+'</div>'})}
  g+='</div>';
  var nFree=0;for(hh=H0;hh<H1;hh++)DOC.forEach(function(dc){if(!ap.some(function(x){return x.doc===dc.id&&hh>=x.h&&hh<x.h+x.len}))nFree++});
  return pg('Расписание','Два врача, приём '+pad(H0)+':00-'+H1+':00. Запись с сайта встаёт в первое свободное окно в то время, которое выбрал пациент.',
    '<div class="days" role="group" aria-label="День">'+days+'</div><p class="day-s"><b>'+dayName(t0)+', '+dayLong(t0)+'</b>: '+plural(ap.length,'запись','записи','записей')+', свободно '+plural(nFree,'час','часа','часов')+'</p><div class="gw">'+g+'</div>')};

/* ── Напоминания в Telegram ────────────────────────────────────────── */
var TPL={day:'Здравствуйте, {имя}! Напоминаем: завтра, {дата}, в {время} вас ждёт {врач} в клинике «Сияние Севера», {адрес}. Если планы поменялись, нажмите «Перенести».',
  h2:'{имя}, ждём вас сегодня в {время}. У клиники своя парковка, свободные места есть всегда. Телефон: {телефон}.'};
function tpl(k){return (k==='day'?PS.tg.tplDay:PS.tg.tplH2)||TPL[k]}
function fill(s,a){var dc=DOC.filter(function(x){return x.id===a.doc})[0];return s.split('{имя}').join(a.name.split(' ')[0]).split('{дата}').join(dayLong(a.t0)).split('{время}').join(pad(a.h)+':00').split('{врач}').join(dc?dc.short:'врач').split('{адрес}').join(B.street).split('{телефон}').join(B.phone)}
V.napominaniya=function(){var tm=dayAppts(TODAY+DAY).filter(function(a){return !a.lead}),td=dayAppts(TODAY).filter(function(a){return !a.lead}),ex=tm[0]||td[0]||{name:'Ольга',doc:DOC[0].id,t0:TODAY+DAY,h:10};
  var box=function(k,title,when){var on=PS.tg[k],a=k==='day'?ex:(td.filter(function(x){return x.h*36e5+x.t0>Date.now()})[0]||ex);
    return card(title,'<label class="sw"><input type="checkbox" data-act="tg-on" data-v="'+k+'"'+(on?' checked':'')+'><span class="sw-k" aria-hidden="true"></span><span>'+(on?'Включено: '+when:'Выключено: не уходит')+'</span></label>'+
      '<label class="fld"><span>Текст. Подставится само: {имя}, {дата}, {время}, {врач}, {адрес}, {телефон}</span><textarea rows="4" data-act="tpl" data-v="'+k+'" maxlength="400">'+h(tpl(k))+'</textarea></label>'+
      '<div class="tg'+(on?'':' off')+'" aria-label="Как увидит пациент в Telegram"><div class="tg-h">'+ic('send')+'<b>Сияние Севера · запись</b><small>бот</small></div><div class="tg-m"><p data-prev="'+k+'">'+h(fill(tpl(k),a))+'</p><time>'+(k==='day'?pad(a.h)+':00':pad(Math.max(H0,a.h-2))+':00')+'</time></div><div class="tg-b"><span>Подтверждаю</span><span>Перенести</span></div></div>','tgc')};
  var log=[];tm.concat(td).forEach(function(a){var k=a.t0===TODAY?'h2':'day',send=a.t0+a.h*36e5-(k==='day'?DAY:2*36e5),gone=send<=Date.now();if(!PS.tg[k])return;
    log.push({a:a,k:k,send:send,st:!a.tg?'нет Telegram: позвонить':!gone?'уйдёт в '+tstr(send):a.st==='confirmed'||a.st==='came'?'прочитано, подтвердил':(a.name.length%2?'прочитано':'ушло')})});
  log.sort(function(x,y){return y.send-x.send});
  var lg='<ul class="tlog">'+log.slice(0,14).map(function(x){return '<li class="'+(x.st.indexOf('нет')===0?'warn':x.st.indexOf('уйдёт')===0?'wait':'')+'"><time>'+(day0(x.send)===TODAY?'сегодня':dayName(day0(x.send)).toLowerCase())+' '+tstr(x.send)+'</time><span><b>'+h(x.a.name)+'</b> · '+(x.k==='day'?'за день':'за 2 часа')+'</span><em>'+x.st+'</em></li>'}).join('')+'</ul>';
  return pg('Напоминания в Telegram','Бот клиники сам пишет пациенту за день и за 2 часа до приёма. Пациент отвечает кнопкой, ответ виден в расписании.',
    '<p class="demo-n">'+ic('warn')+'<span>Демо: в макете сообщения не уходят. На рабочем сайте пациент после записи нажимает «Напоминать в Telegram» и попадает в бота клиники. Кто без Telegram, тому администратор звонит сам: такие записи помечены «без Telegram».</span></p>'+
    '<div class="g2">'+box('day','За день до приёма','за сутки до записи')+box('h2','За 2 часа','за 2 часа до записи')+'</div>'+card('Что ушло','<p class="cd-n">Сегодня и завтра по расписанию.</p>'+lg))};

/* ── Чаты ──────────────────────────────────────────────────────────── */
function chats(){var s=window.SY?SY.get():{chats:[]};var site=(s.chats||[]).map(function(c){return {id:c.id,at:c.last||c.at,mode:c.mode,name:c.name||'Посетитель сайта',msgs:c.msgs||[],site:true}});
  var demo=DCHATS.map(function(c){return {id:c.id,at:c.at,mode:c.mode,name:c.name,msgs:c.msgs.concat(PS.chat[c.id]||[]),demo:true}});
  return site.sort(function(a,b){return b.at-a.at}).concat(demo)}
function waits(c){var m=c.msgs[c.msgs.length-1];return c.mode==='tg'&&m&&m.from==='user'}
V.chaty=function(){var cs=chats(),c=R.sub?cs.filter(function(x){return x.id===R.sub})[0]:null;
  var lst='<ul class="lst">'+cs.map(function(x){var m=x.msgs[x.msgs.length-1],sel=c&&c.id===x.id;return '<li><a class="lr'+(x.site?' site':'')+(sel?' sel':'')+'" href="#chaty/'+encodeURIComponent(x.id)+'"'+(sel?' aria-current="true"':'')+'><span class="lr-t"><b>'+h(x.name)+'</b>'+(x.site?'<em class="tag">с сайта</em>':'')+(waits(x)?'<em class="tag hot">ждёт ответа</em>':'')+'</span><span class="lr-w">'+h(m?m.text:'Разговор начат')+'</span><span class="lr-m">'+(x.mode==='tg'?'Отвечает менеджер в Telegram':'ИИ-консультант')+' · '+ago(x.at)+'</span></a></li>'}).join('')+'</ul>'+
    (cs.some(function(x){return x.site})?'':'<p class="hint">'+ic('chat')+'<span>Напишите в чат на <a href="__PROTO_BASE__">сайте клиники</a>: разговор появится здесь.</span></p>');
  var who2={user:'Пациент',ai:'ИИ-консультант',manager:'Клиника'};
  var conv=c?'<article class="cv"><a class="back" href="#chaty">'+ic('back')+'<span>К чатам</span></a><div class="lc-top"><div><h2>'+h(c.name)+'</h2><p>'+(c.mode==='tg'?'Отвечает менеджер: в Telegram или здесь, ответ появится у пациента на сайте':'Разговор ведёт ИИ-консультант сайта')+'</p></div></div>'+
    '<div class="ch-log" id="ch-log" tabindex="0" aria-label="Сообщения">'+c.msgs.map(function(m){return '<div class="msg m-'+m.from+'"><small>'+who2[m.from]+' · '+tstr(m.at)+'</small><p>'+h(m.text)+'</p></div>'}).join('')+'</div>'+
    (c.mode==='tg'?'<form class="reply" data-act="reply" data-id="'+h(c.id)+'"><label class="sr" for="rp">Ответ пациенту</label><textarea id="rp" rows="2" maxlength="600" placeholder="Ответ пациенту"></textarea><button class="btn pri" type="submit">'+ic('send')+'<span>Ответить</span></button></form>':'<p class="cd-n">ИИ-консультант отвечает по фактам клиники: цены, врачи, адрес, часы. Вопросы, на которые у него нет ответа, он передаёт менеджеру.</p>')+'</article>':'<div class="empty">'+ic('chat')+'<p>Выберите чат слева</p></div>';
  return '<div class="split'+(c?' open':'')+'"><div class="sp-l">'+pg('Чаты','Разговоры из чата на сайте.',lst)+'</div><div class="sp-r">'+conv+'</div></div>'};

/* ── amoCRM ────────────────────────────────────────────────────────── */
var PIPES=[{id:'p1',t:'Пациенты',n:8124501,st:[['s1','Новая заявка с сайта',67012301,'new'],['s2','Записан на консультацию',67012302,'confirmed'],['s3','Пришёл на консультацию',67012303,'came'],['s4','КТ и план лечения',67012304,'came'],['s5','Операция назначена',67012305,'came'],['s142','Успешно реализовано',142,'came'],['s143','Закрыто и не реализовано',143,'canceled']]}];
var RESP=[['admin','Администратор',9100201],[DOC[0].id,DOC[0].short,9100202]].concat(DOC[1]?[[DOC[1].id,DOC[1].short,9100203]]:[]);
function stageOf(id){var p=PIPES[0];for(var i=0;i<p.st.length;i++)if(p.st[i][0]===id)return p.st[i];return p.st[0]}
function respOf(id){for(var i=0;i<RESP.length;i++)if(RESP[i][0]===id)return RESP[i];return RESP[0]}
var TAGW={booking:'запись',quiz:'квиз',chat:'чат'};
function tagsOf(l){var t=[];if(PS.amo.tags.site)t.push('сайт');var k=TAGW[l.src];if(k&&(k==='запись'||PS.amo.tags[l.src]))t.push(k);if(!TAGW[l.src])t.push(SRC[l.src].toLowerCase());return t}
function phoneVal(l){return l.phone?l.phone.replace(/[^\d+•]/g,''):'+7••••••••••'}
function body(l){var sg=stageOf(PS.amo.stage),rp=respOf(PS.amo.resp),j=[{name:'Заявка с сайта: '+(l.what||'консультация'),pipeline_id:PIPES[0].n,status_id:sg[2],responsible_user_id:rp[2],
    custom_fields_values:l.when?[{field_id:1234567,values:[{value:l.when}]}]:undefined,
    _embedded:{tags:tagsOf(l).map(function(t){return {name:t}}),contacts:[{first_name:l.name||'Пациент с сайта',custom_fields_values:[{field_code:'PHONE',values:[{value:phoneVal(l),enum_code:'MOB'}]}]}]}}];
  return JSON.stringify(j,null,2)}
V.amo=function(){var a=PS.amo,ls=siteLeads().concat(demoLeads(3)),sel=findLead(R.amoLead)||ls[0]||DEMO[0],sub=a.sub||'siyanie.amocrm.ru',dealsAll=allLeads().filter(function(l){return amoOf(l)});
  var conn=a.ok?'<p class="ok-b">'+ic('check')+'<span><b>Подключено: аккаунт '+h(a.sub)+', воронка «Пациенты»</b><small>Токен ••••'+h(a.last4)+' хранится на сервере клиники</small></span><button type="button" class="btn ghost sm" data-act="amo-off">Отключить</button></p>':
    '<form class="conn" data-act="amo-check" novalidate><label class="fld"><span>Адрес аккаунта</span><input id="amo-sub" type="text" inputmode="url" autocomplete="off" spellcheck="false" placeholder="siyanie.amocrm.ru" value="'+h(a.sub)+'"></label>'+
    '<label class="fld"><span>Долгосрочный токен</span><input id="amo-tok" type="password" autocomplete="off" spellcheck="false" placeholder="eyJ0eXAiOiJKV1Qi..."></label>'+
    '<p class="cd-n">Где взять: amoCRM → Настройки → Интеграции → Создать интеграцию → Ключи и доступы → Долгосрочный токен. Скопируйте целиком.</p><p class="err" id="amo-err" role="alert"></p>'+
    '<button class="btn pri" type="submit" id="amo-go">'+ic('link')+'<span>Проверить</span></button></form>';
  var dis=a.ok?'':' disabled';
  var where='<div class="fg"><label class="fld"><span>Воронка</span><select data-act="amo-set" data-v="pipe"'+dis+'>'+PIPES.map(function(p){return '<option value="'+p.id+'"'+(a.pipe===p.id?' selected':'')+'>'+p.t+'</option>'}).join('')+'</select></label>'+
    '<label class="fld"><span>Этап для новой заявки</span><select data-act="amo-set" data-v="stage"'+dis+'>'+PIPES[0].st.slice(0,2).map(function(s){return '<option value="'+s[0]+'"'+(a.stage===s[0]?' selected':'')+'>'+s[1]+'</option>'}).join('')+'</select></label>'+
    '<label class="fld"><span>Ответственный</span><select data-act="amo-set" data-v="resp"'+dis+'>'+RESP.map(function(r){return '<option value="'+r[0]+'"'+(a.resp===r[0]?' selected':'')+'>'+h(r[1])+'</option>'}).join('')+'</select></label></div>'+
    '<fieldset class="tags"'+dis+'><legend>Теги сделки</legend>'+[['site','сайт'],['quiz','квиз'],['chat','чат']].map(function(t){return '<label><input type="checkbox" data-act="amo-tag" data-v="'+t[0]+'"'+(a.tags[t[0]]?' checked':'')+'><span>'+t[1]+'</span></label>'}).join('')+'</fieldset>'+
    '<p class="cd-n">Воронки, этапы и сотрудников панель берёт из вашей amoCRM сама: GET /api/v4/leads/pipelines и /api/v4/users.</p>';
  var fields='<table class="map"><thead><tr><th scope="col">В заявке с сайта</th><th scope="col">В amoCRM</th></tr></thead><tbody>'+
    [['Имя','Контакт: имя'],['Телефон','Контакт: поле «Телефон» (PHONE)'],['Что хочет','Примечание к сделке'],['Когда удобно','Поле сделки «Когда удобно»'],['Источник','Тег: сайт, квиз, чат']].map(function(r){return '<tr><td>'+r[0]+'</td><td>'+r[1]+'</td></tr>'}).join('')+'</tbody></table>';
  var un=unsent().length,lg=PS.amoLog.slice(0,12);
  var sync='<label class="sw"><input type="checkbox" data-act="amo-auto"'+(a.auto?' checked':'')+dis+'><span class="sw-k" aria-hidden="true"></span><span>Отправлять каждую новую заявку сразу</span></label>'+
    '<div class="sync-r"><p><b>'+un+'</b> '+(un===1?'заявка с сайта не отправлена':'заявок с сайта не отправлены')+'</p><button type="button" class="btn line" data-act="amo-all"'+dis+'>'+ic('sync')+'<span>Синхронизировать всё</span></button></div>'+
    '<ul class="slog">'+(lg.length?lg.map(function(x){return '<li class="'+x.dir+'"><time>'+ago(x.at)+'</time><b>'+(x.dir==='out'?'Туда':'Обратно')+'</b><span>'+h(x.t)+'</span></li>'}).join(''):'<li class="none">Пока ничего не отправляли.</li>')+'</ul>';
  var hook='https://'+B.site.replace(/^https?:\/\//,'').replace(/\/$/,'')+'/api/amo/hook';
  var how='<p>Туда: каждая заявка с сайта одним запросом создаёт сделку и контакт сразу. Ответ amoCRM даёт номер сделки, он встаёт в карточку заявки ссылкой. Что хочет пациент, уходит вторым запросом примечанием к этой сделке.</p>'+
    '<label class="fld"><span>Заявка для примера</span><select data-act="amo-lead">'+ls.slice(0,12).map(function(l){return '<option value="'+h(l.id)+'"'+(l.id===sel.id?' selected':'')+'>'+h(nm(l))+(l.site?' (с сайта)':'')+'</option>'}).join('')+'</select></label>'+
    '<p class="req"><b>POST</b> https://'+h(sub)+'/api/v4/leads/complex<br><small>Authorization: Bearer ••••'+h(a.last4||'токен')+'</small></p><pre class="code" tabindex="0">'+h(body(sel))+'</pre>'+
    '<p class="req"><b>POST</b> https://'+h(sub)+'/api/v4/leads/{id сделки}/notes</p><pre class="code" tabindex="0">'+h(JSON.stringify([{note_type:'common',params:{text:'Что хочет: '+(sel.what||'консультация')}}],null,2))+'</pre>'+
    '<p>Обратно: в amoCRM включается вебхук «Сделка сменила этап» на адрес сайта. Администратор двигает сделку в amoCRM, статус в панели и у пациента на сайте меняется сам.</p>'+
    '<p class="req"><b>Вебхук</b> '+h(hook)+'<br><small>amoCRM → Настройки → Интеграции → Веб-хуки → «Сделка сменила этап»</small></p>'+
    '<table class="map"><thead><tr><th scope="col">Этап в amoCRM</th><th scope="col">Статус в панели</th></tr></thead><tbody>'+PIPES[0].st.map(function(s){return '<tr><td>'+s[1]+'</td><td>'+STT[s[3]].t+'</td></tr>'}).join('')+'</tbody></table>'+
    (dealsAll.length?'<div class="fg hookt"><label class="fld"><span>Для показа: сделка</span><select id="hk-l">'+dealsAll.slice(0,12).map(function(l){return '<option value="'+h(l.id)+'">№'+amoOf(l).deal+' · '+h(nm(l))+'</option>'}).join('')+'</select></label><label class="fld"><span>Новый этап</span><select id="hk-s">'+PIPES[0].st.slice(1).map(function(s){return '<option value="'+s[0]+'">'+s[1]+'</option>'}).join('')+'</select></label><button type="button" class="btn line" data-act="amo-hook">'+ic('sync')+'<span>Как будто передвинули в amoCRM</span></button></div>':'<p class="cd-n">Отправьте заявку в amoCRM, и здесь можно будет показать, как этап из amoCRM меняет статус в панели.</p>');
  return pg('amoCRM','Связь через API самой amoCRM: адрес аккаунта и один ключ. Без посредников и платных модулей.',
    '<p class="demo-n">'+ic('warn')+'<span>В макете запросы в amoCRM не уходят: на сайте ключ хранится на сервере клиники, браузер его не видит.</span></p>'+
    '<div class="g2">'+card('1. Подключение',conn)+card('2. Куда попадают заявки',where,a.ok?'':'dim')+'</div>'+
    '<div class="g2">'+card('3. Поля',fields)+card('4. Синхронизация',sync,a.ok?'':'dim')+'</div>'+card('Как это работает',how,'wide how'))};
function amoCheck(){var su=$('#amo-sub'),tk=$('#amo-tok'),er=$('#amo-err'),go=$('#amo-go');var s=(su.value||'').trim().toLowerCase().replace(/^https?:\/\//,'').replace(/\/.*$/,'');
  if(s&&s.indexOf('.')<0)s+='.amocrm.ru';
  if(!/^[a-z0-9][a-z0-9-]*\.(amocrm\.ru|amocrm\.com|kommo\.com)$/.test(s)){er.textContent='Адрес вида siyanie.amocrm.ru: его видно в адресной строке, когда вы в amoCRM.';su.focus();return}
  var t=(tk.value||'').trim();if(t.length<20){er.textContent='Токен короткий: скопируйте его в amoCRM целиком.';tk.focus();return}
  er.textContent='';go.disabled=true;go.lastChild.textContent='Проверяем…';
  setTimeout(function(){PS.amo.ok=true;PS.amo.sub=s;PS.amo.last4=t.slice(-4);PS.amo.at=Date.now();PS.amoLog.unshift({at:Date.now(),dir:'out',t:'Подключено: аккаунт '+s+', воронка «Пациенты»'});psave();
    tk.value='';su.value='';SY.note(who(),'Подключил amoCRM: '+s);toast('Подключено: аккаунт '+s+', воронка «Пациенты»')},REDUCED?50:700)}
function amoHook(){var l=findLead(($('#hk-l')||{}).value),sg=stageOf(($('#hk-s')||{}).value);if(!l||!amoOf(l))return;var st=sg[3],at=Date.now(),t='Этап в amoCRM: «'+sg[1]+'», статус: '+STT[st].t.toLowerCase();
  if(l.site)SY.set(function(s){s.leads.forEach(function(x){if(x.id!==l.id)return;x.status=st;x.log=x.log||[];x.log.push({at:at,who:'amoCRM',t:t})})});
  else{PS.st[l.id]=st;(PS.lg[l.id]=PS.lg[l.id]||[]).push({at:at,who:'amoCRM',t:t})}
  PS.amoLog.unshift({at:at,dir:'in',t:'Сделка №'+amoOf(l).deal+': '+t});psave();SY.note('amoCRM','Сделка №'+amoOf(l).deal+' ('+nm(l)+'): '+t);toast(t)}
function autoSend(){if(!PS.amo.ok||!PS.amo.auto)return;var u=unsent();if(!u.length)return;setTimeout(function(){unsent().forEach(function(l){amoSend(l.id,true)})},REDUCED?50:900)}

/* ── История ───────────────────────────────────────────────────────── */
V.istoriya=function(){var s=window.SY?SY.get():{log:[]},all=(s.log||[]).map(function(x){return {at:x.at,who:x.who,t:x.t}}).concat(LOG0).sort(function(a,b){return b.at-a.at});
  var ws=['all','Администратор','Главный врач','amoCRM','Бот клиники','Сайт'],f=R.hist,list=all.filter(function(x){return f==='all'||x.who===f||(f==='Сайт'&&/^сайт$/i.test(x.who))});
  return pg('История действий','Кто, что и когда сделал в панели, на сайте и в amoCRM.','<div class="flt" role="group" aria-label="Кто">'+ws.map(function(x){return '<button type="button" data-act="hist" data-v="'+h(x)+'" aria-pressed="'+(f===x)+'">'+(x==='all'?'Все':h(x))+'</button>'}).join('')+'</div>'+
    card('','<ol class="hist big">'+list.slice(0,80).map(function(e){return '<li><time>'+ago(e.at)+'</time><b>'+h(e.who)+'</b><span>'+h(e.t)+'</span></li>'}).join('')+'</ol>'))};

/* ── События ───────────────────────────────────────────────────────── */
d.addEventListener('click',function(e){var b=e.target.closest('[data-act]');
  var r=e.target.closest('.role [data-role]');if(r){PS.role=r.getAttribute('data-role');psave();render();toast('Смотрит: '+who());return}
  var mb=e.target.closest('#dk-more');if(mb){var m=$('#more'),open=m.hidden;m.hidden=!open;mb.setAttribute('aria-expanded',String(open));if(open){var f=$('a',m);if(f)f.focus()}return}
  if(!$('#more').hidden&&!e.target.closest('#more')){$('#more').hidden=true;$('#dk-more').setAttribute('aria-expanded','false')}
  if(!b||b.tagName==='FORM'||b.tagName==='SELECT'||b.tagName==='TEXTAREA'||(b.tagName==='INPUT'))return;
  var act=b.getAttribute('data-act'),v=b.getAttribute('data-v'),id=b.getAttribute('data-id');
  if(act==='filter'){R.filter=v;render()}
  else if(act==='hist'){R.hist=v;render()}
  else if(act==='day'){R.day=+v;render()}
  else if(act==='status')setStatus(id,v);
  else if(act==='amo-send')amoSend(id);
  else if(act==='amo-all'){var u=unsent();if(!u.length){toast('Все заявки с сайта уже в amoCRM');return}u.forEach(function(l){amoSend(l.id,true)});toast('Отправлено в amoCRM: '+u.length)}
  else if(act==='amo-off'){PS.amo.ok=false;PS.amo.last4='';psave();SY.note(who(),'Отключил amoCRM');render()}
  else if(act==='amo-hook')amoHook()});
d.addEventListener('change',function(e){var b=e.target,act=b.getAttribute('data-act'),v=b.getAttribute('data-v');if(!act)return;
  if(act==='tg-on'){PS.tg[v]=b.checked;psave();SY.note(who(),(b.checked?'Включил':'Выключил')+' напоминание '+(v==='day'?'за день':'за 2 часа'));render()}
  else if(act==='tpl'){if(v==='day')PS.tg.tplDay=b.value.trim();else PS.tg.tplH2=b.value.trim();psave();SY.note(who(),'Изменил текст напоминания '+(v==='day'?'за день':'за 2 часа'))}
  else if(act==='amo-set'){PS.amo[v]=b.value;psave();render()}
  else if(act==='amo-tag'){PS.amo.tags[v]=b.checked;psave();render()}
  else if(act==='amo-auto'){PS.amo.auto=b.checked;psave();SY.note(who(),(b.checked?'Включил':'Выключил')+' отправку заявок в amoCRM сразу');render();autoSend()}
  else if(act==='amo-lead'){R.amoLead=b.value;b.blur();render()}});
d.addEventListener('input',function(e){var b=e.target;if(b.getAttribute('data-act')!=='tpl')return;var k=b.getAttribute('data-v'),p=$('[data-prev="'+k+'"]');if(!p)return;
  var tm=dayAppts(TODAY+DAY).filter(function(a){return !a.lead})[0]||{name:'Ольга',doc:DOC[0].id,t0:TODAY+DAY,h:10};p.textContent=fill(b.value||TPL[k],tm)});
d.addEventListener('submit',function(e){var f=e.target,act=f.getAttribute('data-act');if(!act)return;e.preventDefault();
  if(act==='amo-check')amoCheck();
  else if(act==='reply'){var ta=$('textarea',f),t=(ta.value||'').trim(),id=f.getAttribute('data-id');if(!t)return;ta.value='';ta.blur();
    if(/^dc/.test(id)){(PS.chat[id]=PS.chat[id]||[]).push({from:'manager',text:t,at:Date.now()});psave();var c=DCHATS.filter(function(x){return x.id===id})[0];SY.note(who(),'Ответил в чате: '+(c?c.name:''))}
    else{var cc=SY.chat(id);SY.push(id,'manager',t);SY.note(who(),'Ответил в чате сайта: '+(cc&&cc.name||'посетитель'))}
    toast('Ответ ушёл пациенту');render()}});
d.addEventListener('keydown',function(e){if(e.key==='Escape'&&!$('#more').hidden){$('#more').hidden=true;var mb=$('#dk-more');mb.setAttribute('aria-expanded','false');mb.focus()}});
var navd=false;
addEventListener('hashchange',function(){$('#more').hidden=true;$('#dk-more').setAttribute('aria-expanded','false');var prev=R.tab;render();
  if(R.sub&&innerWidth<1024){window.scrollTo(0,0)}
  var t=R.sub?$('.sp-r h2',view):$('h1',view);if(t&&navd){t.setAttribute('tabindex','-1');t.focus({preventScroll:true})}navd=false;if(prev!==R.tab&&!R.sub)window.scrollTo(0,0)});
d.addEventListener('click',function(e){if(e.target.closest('a[href^="#"]'))navd=true},true);
d.addEventListener('sy:change',function(){soft();autoSend()});
render();
})();
