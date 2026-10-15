(function(){
'use strict';
/* panel: панель менеджеров Medikor. Сводка, заказы, запросы КП с ответом,
   счета и оплаты, организации, товары с ценой, остатком и РУ, история.
   Заказы и КП из магазина приходят из того же браузера (mk-demo-1), ответ
   менеджера и смена статуса уходят покупателю туда же. Остальное демо из
   одной формулы, поэтому числа сходятся между экранами. */
var d=document,root=d.documentElement,G=JSON.parse(d.getElementById('mp-data').textContent);
var P={},KEY='mk-demo-1',PKEY='mk-panel-1',EMBED=/[?&]embed=1/.test(location.search);
G.products.forEach(function(p){P[p.id]=p});
if(EMBED)root.classList.add('embed');
var REDUCED=false;try{REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
var $=function(s,r){return (r||d).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))};
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function rub(n){return fmt(n)+' ₽'}
function ic(k){return '<svg class="ic" aria-hidden="true"><use href="#i-'+k+'"/></svg>'}
function day(k){var x=new Date(Date.now()-k*864e5);return ('0'+x.getDate()).slice(-2)+'.'+('0'+(x.getMonth()+1)).slice(-2)}
function today(k){var x=new Date(Date.now()+(k||0)*864e5);return ('0'+x.getDate()).slice(-2)+'.'+('0'+(x.getMonth()+1)).slice(-2)+'.'+x.getFullYear()}

/* ── Демо: одна формула на все экраны ─────────────────────────────────── */
var r0=7;function rnd(){r0=(r0*16807)%2147483647;return (r0-1)/2147483646}
var priced=G.products.filter(function(p){return p.price});
var DEMO=[];
for(var i=0;i<26;i++){var org=G.orgs[i%G.orgs.length],n=1+Math.floor(rnd()*3),items=[];
  for(var k=0;k<n;k++){var p=priced[Math.floor(rnd()*priced.length)];if(items.some(function(x){return x.id===p.id}))continue;items.push({id:p.id,q:p.price<5000?Math.ceil(rnd()*20):1+Math.floor(rnd()*2),price:p.price})}
  var age=Math.floor(i*1.15+rnd()*1.2),st=age>9?4:age>5?3+Math.floor(rnd()*2):age>2?1+Math.floor(rnd()*3):Math.floor(rnd()*2),inv=org.inn.length>0&&rnd()<.7;
  DEMO.push({no:'MK-'+(10470-i*3),date:day(age),age:age,items:items,sum:items.reduce(function(s,x){return s+x.price*x.q},0),shipSum:[0,450,1290,2380][Math.floor(rnd()*4)],pay:inv?'invoice':['card','sbp'][Math.floor(rnd()*2)],who:inv?'org':'person',org:inv?org:null,name:inv?org.n:G.people[i%G.people.length],st:st,paid:st>0,city:G.cities[Math.floor(rnd()*G.cities.length)][0],inv:inv?'СЧ-'+(10470-i*3):'',mgr:G.mgrs[i%G.mgrs.length],src:G.src[Math.floor(rnd()*G.src.length)].id})}
var DKP=G.kps.map(function(k,i){return {no:'КП-'+(2201-i*4),date:day(i+1),items:k.items,org:G.orgs[k.org],for:k.for,by:today(5+i*3),comment:k.c,st:i<2?'new':'sent',demo:1,mgr:i<2?'':G.mgrs[i%3],valid:today(10)}});

/* ── Состояние: магазин и панель ──────────────────────────────────────── */
var S,Q;
function load(){try{S=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){S=null}S=S&&typeof S==='object'?S:{};S.orders=S.orders||[];S.kps=S.kps||[];
  try{Q=JSON.parse(localStorage.getItem(PKEY)||'null')}catch(e){Q=null}Q=Q&&typeof Q==='object'?Q:{};Q.st=Q.st||{};Q.log=Q.log||[];Q.price=Q.price||{};Q.stock=Q.stock||{};Q.ru=Q.ru||{};Q.kp=Q.kp||{};Q.role=Q.role||'owner'}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));localStorage.setItem(PKEY,JSON.stringify(Q))}catch(e){}}
load();
addEventListener('storage',function(e){if(e.key===KEY||e.key===PKEY){load();draw()}});
function orders(){var site=S.orders.map(function(o){var x=Object.assign({},o);x.site=1;x.mgr=x.mgr||'не назначен';return x});
  var demo=DEMO.map(function(o){var x=Object.assign({},o);if(Q.st[o.no]!=null){x.st=Q.st[o.no];x.paid=x.st>0}return x});return site.concat(demo)}
function kps(){return S.kps.map(function(k){var x=Object.assign({},k);x.site=1;return x}).concat(DKP.map(function(k){var x=Object.assign({},k,Q.kp[k.no]||{});return x}))}
function log(what){Q.log.unshift({at:new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}),d:today(),who:Q.role==='owner'?'Вы (владелец)':G.mgrs[0],what:what});Q.log=Q.log.slice(0,60);save()}
var STP=['Принят','Оплачен','Собран','Передан в доставку','Получен'],STI=['Счёт выставлен','Оплачен','Собран','Передан в доставку','Получен'];
function stN(o){return (o.pay==='invoice'?STI:STP)[o.st]}
function setSt(o,st){if(o.site){var x=S.orders.filter(function(z){return z.no===o.no})[0];x.st=st;x.paid=st>0;if(st===3&&!x.track)x.track=x.ship==='pickup'?'Готов к выдаче на Обручева 52с1':'Трек-номер 1'+String(1e9+Math.floor(Math.random()*8e9)).slice(0,10);x.log=x.log||[];x.log.push({st:st,at:today(),by:'manager'})}else Q.st[o.no]=st;
  log(o.no+': «'+(o.pay==='invoice'?STI:STP)[st]+'»');save()}

/* ── Каркас ───────────────────────────────────────────────────────────── */
var V={},pv=$('#pv'),side=$('#side'),cur='dash';
function owner(){return Q.role==='owner'}
function draw(){if(!side.hidden){side.classList.remove('on');side.hidden=true;side.innerHTML=''}var hs=(location.hash||'#dash').slice(1).split('/'),k=V[hs[0]]?hs[0]:'dash';cur=k;
  pv.classList.remove('in');pv.innerHTML=V[k](hs[1]);requestAnimationFrame(function(){pv.classList.add('in')});if(V[k+'_on'])V[k+'_on'](hs[1]);
  $$('.nav a').forEach(function(a){a.classList.toggle('on',a.getAttribute('href')==='#'+k)});d.body.classList.remove('nav-on');
  var nk=kps().filter(function(x){return x.st==='new'}).length,no=orders().filter(function(o){return o.st===0}).length;
  $$('[data-cnt]').forEach(function(c){var n=c.getAttribute('data-cnt')==='kp'?nk:no;c.textContent=n;c.hidden=!n});
  $$('[data-role]').forEach(function(b){b.setAttribute('aria-checked',b.getAttribute('data-role')===Q.role)})}
addEventListener('hashchange',draw);
$('#menu-b').onclick=function(){d.body.classList.add('nav-on')};
$$('[data-role]').forEach(function(b){b.onclick=function(){Q.role=b.getAttribute('data-role');save();draw()}});
var toastT=0;function toast(m){var t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('on')},2400)}
function openSide(title,body,on){side.innerHTML='<div class="sd-back" data-x></div><aside class="sd" role="dialog" aria-modal="true" aria-label="'+h(title)+'"><header><b>'+title+'</b><button type="button" class="ib" data-x aria-label="Закрыть">'+ic('x')+'</button></header><div class="sd-b">'+body+'</div></aside>';
  side.hidden=false;void side.offsetWidth;side.classList.add('on');$$('[data-x]',side).forEach(function(b){b.onclick=closeSide});if(on)on(side)}
function closeSide(){side.classList.remove('on');setTimeout(function(){side.hidden=true;side.innerHTML=''},REDUCED?0:250)}
addEventListener('keydown',function(e){if(e.key==='Escape')closeSide()});
function head(t,s,extra){return '<div class="ph"><div><h1>'+t+'</h1>'+(s?'<p class="muted">'+s+'</p>':'')+'</div>'+(extra||'')+'</div>'}
function kpi(n,v,s,cls){return '<div class="kpi'+(cls?' '+cls:'')+'"><small>'+n+'</small><b>'+v+'</b>'+(s?'<span>'+s+'</span>':'')+'</div>'}

/* ── Сводка ───────────────────────────────────────────────────────────── */
V.dash=function(){var O=orders(),m30=O.filter(function(o){return (o.age||0)<=30}),paid=m30.filter(function(o){return o.paid}),rev=paid.reduce(function(s,o){return s+o.sum},0);
  var waitInv=O.filter(function(o){return o.pay==='invoice'&&!o.paid}),K=kps(),newK=K.filter(function(k){return k.st==='new'}),avg=paid.length?rev/paid.length:0;
  var byCat={};paid.forEach(function(o){o.items.forEach(function(it){var c=P[it.id].cat;byCat[c]=(byCat[c]||0)+it.price*it.q})});
  var top=Object.keys(byCat).sort(function(a,b){return byCat[b]-byCat[a]}).slice(0,6),mx=top.length?byCat[top[0]]:1;
  var days=[];for(var i=13;i>=0;i--){days.push(O.filter(function(o){return (o.age||0)===i&&o.paid}).reduce(function(s,o){return s+o.sum},0))}var dm=Math.max.apply(null,days.concat([1]));
  return head('Сводка','За 30 дней. Данные демо, кроме заказов и КП, оформленных в макете магазина.')+
  '<div class="kpis">'+(owner()?kpi('Выручка, оплачено',rub(rev),paid.length+' заказов'):'')+kpi('Заказы',m30.length,'из них с сайта '+O.filter(function(o){return o.site}).length)+(owner()?kpi('Средний чек',rub(avg)):'')+kpi('Ждут оплаты по счёту',waitInv.length,rub(waitInv.reduce(function(s,o){return s+o.sum},0)),waitInv.length?'warn':'')+kpi('Запросы КП без ответа',newK.length,newK.length?'ответить сегодня':'все отвечены',newK.length?'warn':'')+kpi('Доля организаций',Math.round(m30.filter(function(o){return o.who==='org'}).length/Math.max(1,m30.length)*100)+' %','заказы по счёту')+'</div>'+
  '<div class="cols"><section class="card"><h2>Оплачено по дням</h2><div class="bars" role="img" aria-label="Оплаченные заказы за 14 дней">'+days.map(function(v,i){return '<i style="--k:'+(v/dm).toFixed(3)+'" title="'+day(13-i)+': '+rub(v)+'"></i>'}).join('')+'</div><p class="muted sm">'+day(13)+'-'+day(0)+'</p></section>'+
  '<section class="card"><h2>Что продаётся</h2><ul class="hbar">'+top.map(function(c){var n=G.cats.filter(function(x){return x.id===c})[0].n;return '<li><span>'+h(n)+'</span><i style="--k:'+(byCat[c]/mx).toFixed(3)+'"></i>'+(owner()?'<b>'+rub(byCat[c])+'</b>':'')+'</li>'}).join('')+'</ul></section></div>'+
  '<div class="cols"><section class="card"><h2>Новые запросы КП</h2>'+(newK.length?'<ul class="lst">'+newK.slice(0,4).map(function(k){return '<li><a href="#kp/'+encodeURIComponent(k.no)+'"><b>'+h(k.no)+'</b><span>'+h(k.org.n)+'</span><small>'+k.items.length+' поз. · нужно к '+h(k.by)+'</small></a></li>'}).join('')+'</ul>':'<p class="muted">Все запросы отвечены.</p>')+'</section>'+
  '<section class="card"><h2>Откуда заказы</h2><ul class="hbar">'+G.src.map(function(s){var n=m30.filter(function(o){return o.src===s.id}).length+(s.id==='site'?O.filter(function(o){return o.site}).length:0);return '<li><span>'+h(s.n)+'</span><i style="--k:'+(n/Math.max(1,m30.length)).toFixed(3)+';--c:'+s.c+'"></i><b>'+n+'</b></li>'}).join('')+'</ul></section></div>'};

/* ── Заказы ───────────────────────────────────────────────────────────── */
var OF='all';
V.orders=function(){var O=orders().filter(function(o){return OF==='all'||(OF==='org'?o.who==='org':OF==='wait'?!o.paid:o.st===Number(OF))});
  return head('Заказы','Заказ, оформленный в магазине макета, приходит сюда первой строкой. Смените статус, и покупатель увидит это у себя.')+
  '<div class="flt">'+[['all','Все'],['wait','Ждут оплаты'],['org','Организации'],['2','Собраны'],['3','В доставке']].map(function(x){return '<button type="button" class="chip'+(OF===x[0]?' on':'')+'" data-of="'+x[0]+'">'+x[1]+'</button>'}).join('')+'</div>'+
  '<div class="card tw"><table class="tb ord"><thead><tr><th>Заказ</th><th class="c-m">Покупатель</th><th class="c-m">Оплата</th><th>Сумма</th><th>Статус</th><th class="c-m">Менеджер</th></tr></thead><tbody>'+O.map(function(o){return '<tr data-o="'+o.no+'" tabindex="0"'+(o.site?' class="site"':'')+'><td><b>'+o.no+'</b><small>'+o.date+(o.site?' · с сайта':'')+'</small><small class="m-o">'+h(o.org?o.org.n:o.name)+'</small></td><td class="c-m">'+h(o.org?o.org.n:o.name)+'<small>'+h(o.city||'')+'</small></td><td class="c-m">'+{invoice:'Счёт',card:'Карта',sbp:'СБП',cash:'При получении'}[o.pay]+'</td><td class="nw"><b>'+rub(o.sum+(o.shipSum||0))+'</b></td><td><em class="st st'+o.st+'">'+stN(o)+'</em></td><td class="c-m">'+h(o.mgr)+'</td></tr>'}).join('')+'</tbody></table></div>'};
V.orders_on=function(){$$('[data-of]').forEach(function(b){b.onclick=function(){OF=b.getAttribute('data-of');draw()}});
  $$('tr[data-o]').forEach(function(r){function op(){orderSide(r.getAttribute('data-o'))}r.onclick=op;r.onkeydown=function(e){if(e.key==='Enter')op()}})};
function orderSide(no){var o=orders().filter(function(x){return x.no===no})[0];if(!o)return;var steps=o.pay==='invoice'?STI:STP;
  openSide('Заказ '+o.no,'<p class="muted">'+o.date+' · '+(o.site?'оформлен в магазине':'демо')+'</p>'+
  '<div class="sd-sec"><h3>Покупатель</h3><p><b>'+h(o.org?o.org.n:o.name)+'</b></p>'+(o.org?'<p class="muted sm">ИНН '+o.org.inn+(o.org.kpp?' · КПП '+o.org.kpp:'')+'</p>':'')+(o.email?'<p class="sm">'+h(o.email)+(o.phone?' · +7 '+h(o.phone):'')+'</p>':'')+(o.comment?'<p class="note">'+h(o.comment)+'</p>':'')+'</div>'+
  '<div class="sd-sec"><h3>Состав</h3><ul class="it">'+o.items.map(function(it){return '<li><img src="'+G.img+'/p-'+it.id+'-s.webp" alt="" width="40" height="40"><span>'+h(P[it.id].n)+'</span><b>'+it.q+' × '+fmt(it.price)+'</b></li>'}).join('')+'</ul><p class="tot"><span>С доставкой'+(o.city?', '+h(o.city):'')+'</span><b>'+rub(o.sum+(o.shipSum||0))+'</b></p></div>'+
  '<div class="sd-sec"><h3>Статус</h3><ol class="stl">'+steps.map(function(s,i){return '<li class="'+(i<=o.st?'on':'')+'">'+s+'</li>'}).join('')+'</ol>'+(o.st<4?'<button type="button" class="btn btn-b" id="oc-next">'+(o.st===0&&o.pay==='invoice'?'Оплата поступила':'Перевести в «'+steps[o.st+1]+'»')+'</button>':'<p class="ok">'+ic('check')+'Заказ закрыт</p>')+'</div>'+
  (o.inv?'<div class="sd-sec"><h3>Документы</h3><p class="sm">Счёт № '+h(o.inv)+(o.st>=3?' · УПД':'')+(o.st>=2?' · гарантийный талон':'')+'</p><p class="muted sm">В рабочем магазине документы приходят из 1С и сразу видны покупателю в кабинете.</p></div>':''),
  function(s){var b=$('#oc-next',s);if(b)b.onclick=function(){setSt(o,o.st+1);toast('Статус «'+steps[o.st+1]+'» отправлен покупателю');closeSide();draw()}})}

/* ── Запросы КП ───────────────────────────────────────────────────────── */
V.kp=function(arg){var K=kps();
  return head('Запросы КП','Запрос из магазина приходит сюда. Цены и сроки подставлены с сайта: поправьте, дайте скидку и отправьте. КП появится у покупателя в кабинете.')+
  '<div class="card tw"><table class="tb"><thead><tr><th>Запрос</th><th class="c-m">Организация</th><th class="c-m">Для чего</th><th class="c-m">Нужно к</th><th>Статус</th></tr></thead><tbody>'+K.map(function(k){return '<tr data-k="'+h(k.no)+'" tabindex="0"'+(k.site?' class="site"':'')+'><td><b>'+h(k.no)+'</b><small>'+k.date+(k.site?' · с сайта':'')+' · '+k.items.length+' поз.</small><small class="m-o">'+h(k.org.n)+'</small></td><td class="c-m">'+h(k.org.n)+'</td><td class="c-m">'+h(k.for||'')+'</td><td class="c-m">'+h(k.by)+'</td><td><em class="st kst-'+k.st+'">'+{new:'Новый',sent:'КП отправлено',accepted:'Принято, счёт'}[k.st]+'</em></td></tr>'}).join('')+'</tbody></table></div>'};
V.kp_on=function(arg){$$('tr[data-k]').forEach(function(r){function op(){kpSide(r.getAttribute('data-k'))}r.onclick=op;r.onkeydown=function(e){if(e.key==='Enter')op()}});if(arg)kpSide(decodeURIComponent(arg))};
function kpSide(no){var k=kps().filter(function(x){return x.no===no})[0];if(!k)return;var ans=k.st!=='new';
  var rows=k.items.map(function(x){var p=P[x.id];return {id:x.id,q:x.q,price:x.price||Q.price[x.id]||p.price||0,eta:x.eta||(avIn(p)?'1-3 дня':'14-21 день')}});
  openSide(h(k.no),'<p class="muted">'+h(k.org.n)+' · ИНН '+k.org.inn+'</p><p class="sm">'+h(k.for||'')+' · нужно к '+h(k.by)+(k.email?' · '+h(k.email):'')+'</p>'+(k.comment?'<p class="note">'+h(k.comment)+'</p>':'')+
  '<div class="sd-sec"><h3>Позиции</h3><div class="tw"><table class="tb kpt"><thead><tr><th>Товар</th><th>Кол.</th><th>Цена, ₽</th><th>Срок</th></tr></thead><tbody>'+rows.map(function(r,i){return '<tr><td>'+h(P[r.id].n)+(P[r.id].price?'':'<small>на сайте без цены</small>')+'</td><td>'+r.q+'</td><td><input class="in" inputmode="numeric" data-ki="'+i+'" value="'+r.price+'"'+(ans?' disabled':'')+' aria-label="Цена"></td><td><select data-ke="'+i+'"'+(ans?' disabled':'')+' aria-label="Срок">'+['1-3 дня','5-7 дней','14-21 день','30-45 дней'].map(function(e){return '<option'+(e===r.eta?' selected':'')+'>'+e+'</option>'}).join('')+'</select></td></tr>'}).join('')+'</tbody></table></div>'+
  '<div class="kp-f"><label>Скидка, %<select id="kp-d"'+(ans?' disabled':'')+'>'+[0,3,5,7,10].map(function(v){return '<option'+(v===(k.disc||0)?' selected':'')+'>'+v+'</option>'}).join('')+'</select></label><label>Действует до<select id="kp-v"'+(ans?' disabled':'')+'>'+[5,10,30].map(function(v){return '<option>'+today(v)+'</option>'}).join('')+'</select></label></div>'+
  '<p class="tot"><span>Итого по КП</span><b id="kp-t"></b></p></div>'+
  (ans?'<p class="ok">'+ic('check')+(k.st==='accepted'?'Покупатель принял КП, счёт выставлен':'КП отправлено '+(k.mgr?'('+h(k.mgr)+')':''))+'</p>':'<button type="button" class="btn btn-b" id="kp-send">'+ic('send')+'Отправить КП покупателю</button><p class="muted sm">Шаблон КП с логотипом и реквизитами собирается сам, покупатель получает письмо и видит КП в кабинете.</p>'),
  function(s){function calc(){var dsc=+($('#kp-d',s).value||0),t=0;rows.forEach(function(r,i){var inp=$('[data-ki="'+i+'"]',s);r.price=+inp.value.replace(/\D/g,'')||0;r.eta=$('[data-ke="'+i+'"]',s).value;t+=Math.round(r.price*(1-dsc/100))*r.q});$('#kp-t',s).textContent=rub(t)}
    $$('input,select',s).forEach(function(i){i.addEventListener('input',calc);i.addEventListener('change',calc)});calc();
    var b=$('#kp-send',s);if(b)b.onclick=function(){var dsc=+$('#kp-d',s).value,patch={st:'sent',disc:dsc,valid:$('#kp-v',s).value,mgr:G.mgrs[0],items:rows.map(function(r){return {id:r.id,q:r.q,price:Math.round(r.price*(1-dsc/100)),eta:r.eta}})};
      if(k.site){var x=S.kps.filter(function(z){return z.no===k.no})[0];Object.assign(x,patch)}else Q.kp[k.no]=patch;
      log(k.no+': КП отправлено, '+k.org.n);save();toast('КП отправлено покупателю');closeSide();draw()}})}
function avIn(p){return p.av==='many'||p.av>0}

/* ── Счета ────────────────────────────────────────────────────────────── */
V.invoices=function(){var I=orders().filter(function(o){return o.pay==='invoice'}),w=I.filter(function(o){return !o.paid});
  return head('Счета','Счета организаций. Оплату по выписке отмечает менеджер или банк через 1С, заказ сам уходит в сборку.')+
  '<div class="kpis">'+kpi('Ждут оплаты',w.length,rub(w.reduce(function(s,o){return s+o.sum+(o.shipSum||0)},0)),w.length?'warn':'')+kpi('Оплачено за 30 дней',I.length-w.length)+'</div>'+
  '<div class="card tw"><table class="tb"><thead><tr><th>Счёт</th><th class="c-m">Организация</th><th>Сумма</th><th class="c-m">Выставлен</th><th></th></tr></thead><tbody>'+I.map(function(o){return '<tr'+(o.site?' class="site"':'')+'><td><b>'+h(o.inv)+'</b><small>заказ '+o.no+'</small><small class="m-o">'+h(o.org?o.org.n:o.name)+'</small></td><td class="c-m">'+h(o.org?o.org.n:o.name)+'<small>'+(o.org?'ИНН '+o.org.inn:'')+'</small></td><td class="nw"><b>'+rub(o.sum+(o.shipSum||0))+'</b></td><td class="c-m">'+o.date+'</td><td>'+(o.paid?'<em class="st st4">Оплачен</em>':'<button type="button" class="btn btn-sm" data-pay="'+o.no+'">Оплата поступила</button>')+'</td></tr>'}).join('')+'</tbody></table></div>'};
V.invoices_on=function(){$$('[data-pay]').forEach(function(b){b.onclick=function(){var o=orders().filter(function(x){return x.no===b.getAttribute('data-pay')})[0];setSt(o,1);toast('Оплата отмечена, заказ ушёл в сборку');draw()}})};

/* ── Организации ──────────────────────────────────────────────────────── */
V.clients=function(){var O=orders(),M={};O.forEach(function(o){if(!o.org)return;var c=M[o.org.inn]||(M[o.org.inn]={o:o.org,n:0,s:0,last:o.date});c.n++;c.s+=o.sum});
  var L=Object.keys(M).map(function(k){return M[k]}).sort(function(a,b){return b.s-a.s});
  return head('Организации','Покупатели по ИНН: сколько заказали и на какую сумму. Реквизиты подставляются в каждый новый счёт.')+
  '<div class="card tw"><table class="tb"><thead><tr><th>Организация</th><th class="c-m">ИНН</th><th>Заказов</th>'+(owner()?'<th>Сумма</th>':'')+'<th class="c-m">Последний</th></tr></thead><tbody>'+L.map(function(c){return '<tr><td><b>'+h(c.o.n)+'</b><small>'+h(c.o.type||'')+'</small></td><td class="c-m">'+c.o.inn+'</td><td>'+c.n+'</td>'+(owner()?'<td class="nw"><b>'+rub(c.s)+'</b></td>':'')+'<td class="c-m">'+c.last+'</td></tr>'}).join('')+'</tbody></table></div><p class="muted sm">Названия организаций демо.</p>'};

/* ── Товары ───────────────────────────────────────────────────────────── */
var GQ='';
V.goods=function(){var L=G.products.filter(function(p){return !GQ||(p.n+' '+p.a).toLowerCase().indexOf(GQ.toLowerCase())>=0});
  return head('Товары','Цена, остаток и регистрационное удостоверение. В рабочем магазине остатки и цены приходят из 1С; здесь их можно поправить руками.','<label class="srch">'+ic('search')+'<input id="gq" type="search" placeholder="Название или артикул" value="'+h(GQ)+'" aria-label="Поиск товара"></label>')+
  '<div class="card tw"><table class="tb gd"><thead><tr><th>Товар</th><th>Цена, ₽</th><th class="c-m">Остаток</th><th class="c-m">РУ</th></tr></thead><tbody>'+L.map(function(p){var price=Q.price[p.id]!=null?Q.price[p.id]:p.price,stock=Q.stock[p.id]!=null?Q.stock[p.id]:p.av==='many'?12:p.av||0,ru=Q.ru[p.id]||p.ru;
    return '<tr><td><span class="gn"><img src="'+G.img+'/p-'+p.id+'-s.webp" alt="" width="40" height="40" loading="lazy"><span>'+h(p.n)+'<small>'+h(p.a)+'</small></span></span></td><td><input class="in" inputmode="numeric" data-gp="'+p.id+'" value="'+(price||'')+'" placeholder="по запросу" aria-label="Цена"></td><td class="c-m"><input class="in sm" inputmode="numeric" data-gs="'+p.id+'" value="'+stock+'" aria-label="Остаток"></td><td class="c-m">'+(ru?'<em class="st st4">'+(ru===true||ru==='есть'?'есть':h(ru))+'</em>':'<button type="button" class="btn btn-sm" data-gr="'+p.id+'">Прикрепить</button>')+'</td></tr>'}).join('')+'</tbody></table></div>'};
V.goods_on=function(){var q=$('#gq');q.oninput=function(){GQ=q.value;var pos=q.selectionStart;draw();var n=$('#gq');n.focus();n.setSelectionRange(pos,pos)};
  $$('[data-gp]').forEach(function(i){i.onchange=function(){var id=i.getAttribute('data-gp'),v=+i.value.replace(/\D/g,'');Q.price[id]=v||null;log(P[id].n+': цена '+(v?rub(v):'по запросу'));toast('Цена сохранена')}});
  $$('[data-gs]').forEach(function(i){i.onchange=function(){var id=i.getAttribute('data-gs');Q.stock[id]=+i.value.replace(/\D/g,'')||0;log(P[id].n+': остаток '+Q.stock[id]);toast('Остаток сохранён')}});
  $$('[data-gr]').forEach(function(b){b.onclick=function(){var id=b.getAttribute('data-gr');Q.ru[id]=true;log(P[id].n+': прикреплено РУ');toast('Файл РУ прикреплён (для показа)');draw()}})};

/* ── История ──────────────────────────────────────────────────────────── */
V.log=function(){var L=Q.log.concat(G.demoLog);
  return head('История','Кто что сделал: статусы, ответы на КП, цены и остатки. Ваши действия в панели макета попадают сюда первыми.')+
  '<div class="card"><ul class="lg">'+L.map(function(x){return '<li><time>'+h(x.d||'')+' '+h(x.at)+'</time><b>'+h(x.who)+'</b><span>'+h(x.what)+'</span></li>'}).join('')+'</ul></div>'};

if(!location.hash)location.hash='#dash';
draw();
})();
