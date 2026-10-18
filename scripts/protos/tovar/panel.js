(function(){
'use strict';
/* panel: кабинет продавца tovar.uz. Разделы по адресу после #: dash, start,
   goods, orders, ask, rfq, stats. Продавца переключают слева: SHOP-IT,
   ELSO.UZ, MacBro, Sayina Stroy — товары, цены и даты у каждого его, с
   tovar.uz. Состояние в браузере (tv-demo-1) общее с приложением: вопрос,
   торг, запрос цены и заказ оттуда приходят сюда, ответ, цена и статус
   отсюда — туда. Вопросы и запрос, которые лежат с самого начала, и цифры
   просмотров — демо. */
var d=document,W=window,root=d.documentElement,K=JSON.parse(d.getElementById('tp-data').textContent),U=K.ui;
var $=function(s,r){return (r||d).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))};
var REDUCED=false;try{REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
if(/[?&]embed=1/.test(location.search))root.classList.add('embed');
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,'\u00a0')}
function sum(n){return fmt(n)+'\u00a0'+U.sumW}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function ic(k){return '<svg class="ic" aria-hidden="true"><use href="#i-'+k+'"/></svg>'}
function pad(n){return (n<10?'0':'')+n}
function dmy(iso){var p=iso.split('-');return p[2]+'.'+p[1]+'.'+p[0]}
function hm(ts){var x=new Date(ts);return pad(x.getHours())+':'+pad(x.getMinutes())}
var GD={};K.goods.forEach(function(g){GD[g.id]=g});

var KEY='tv-demo-1';
function load(){var s=null;try{s=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){}s=s||{};['cart','cmp','orders','offers','asks','rfqs'].forEach(function(k){if(!Array.isArray(s[k]))s[k]=[]});['confirmed','ladders','prices','stock'].forEach(function(k){if(!s[k]||typeof s[k]!=='object')s[k]={}});return s}
function save(s){try{localStorage.setItem(KEY,JSON.stringify(s))}catch(e){}counts()}
var AS='shopit';try{AS=localStorage.getItem('tv-as')||'shopit'}catch(e){}
/* Демо с самого начала: два вопроса, одно предложение цены, один запрос. */
(function demo(){var s=load();if(s.demoIn)return;var n=Date.now(),ru=K.lang==='ru';
  s.asks.push({no:'Q-101',id:127572,s:'shopit',q:ru?'Есть гарантия? Можно забрать сегодня?':'Kafolat bormi? Bugun olib ketsa bo‘ladimi?',ts:n-35*6e4,src:'demo'},{no:'Q-102',id:113945,s:'elso',q:ru?'Это оригинал, с гарантией? Есть доставка в Чирчик?':'Bu original, kafolatlimi? Chirchiqqa yetkazish bormi?',ts:n-2*36e5,src:'demo'});
  s.offers.push({no:'P-101',id:79478,s:'macbro',p:2100000,q:2,ts:n-50*6e4,st:'wait',src:'demo'});
  s.rfqs.push({no:'R-11',what:ru?'Водонагреватель 30 л, электрический':'Suv isitgich 30 l, elektr',qty:20,when:ru?'до пятницы':'jumagacha',region:K.regions[0],ts:n-80*6e4,quotes:[],src:'demo'});
  s.demoIn=1;save(s)})();
function mineG(){return K.goods.filter(function(g){return g.s===AS})}
function ageDays(iso){return Math.max(0,Math.round((new Date(K.today)-new Date(iso))/864e5))}
function isFresh(g,s){return !!(s.confirmed[g.s]||s.confirmed['i'+g.id])||ageDays(g.upd)<=30}
function price(id,s){return s.prices[id]||GD[id].p}
function stockOf(id,s){return s.stock[id]!=null?s.stock[id]:GD[id].st}
function myOrders(s){return s.orders.filter(function(o){return o.items.some(function(it){return GD[it.id].s===AS})})}
function myPart(o){return o.items.filter(function(it){return GD[it.id].s===AS}).reduce(function(a,it){return a+it.u*it.q},0)}
function replyMin(s){var a=s.asks.filter(function(x){return x.s===AS&&x.ats}).concat(s.offers.filter(function(x){return x.s===AS&&x.ats}));if(a.length){return Math.max(1,Math.round(a.reduce(function(t,x){return t+(x.ats-x.ts)},0)/a.length/6e4))}return K.reply[AS]}
function waiting(s){return s.asks.filter(function(x){return x.s===AS&&!x.a}).length+s.offers.filter(function(x){return x.s===AS&&x.st==='wait'}).length}
function rfqOpen(s){var me=K.sellers[AS].n;return s.rfqs.filter(function(r){return !r.quotes.some(function(q){return q.seller===me})}).length}
function counts(){var s=load(),c={orders:myOrders(s).filter(function(o){return o.st===0}).length,ask:waiting(s),rfq:rfqOpen(s)};
  $$('[data-cnt]').forEach(function(i){var k=i.getAttribute('data-cnt');i.textContent=c[k];i.hidden=!c[k]})}
addEventListener('storage',function(e){if(e.key===KEY)render()});
var tT=0;function toast(m){var t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(tT);tT=setTimeout(function(){t.classList.remove('on')},2400)}

var pv=$('#pv');
function show(){if(!REDUCED){pv.classList.remove('in');void pv.offsetWidth}pv.classList.add('in')}

function dash(){var s=load(),g=mineG(),stale=g.filter(function(x){return !isFresh(x,s)}),o=myOrders(s),rm=replyMin(s);
  var feed=[].concat(o.map(function(x){return {ts:x.ts,ic:'bag',t:U.order+' '+x.no+' · '+sum(myPart(x)),s:U['st'+x.st],nw:x.src==='app'}}),
    s.asks.filter(function(x){return x.s===AS}).map(function(x){return {ts:x.ts,ic:'chat',t:U.question+': '+x.q,s:GD[x.id].n,nw:x.src==='app'&&!x.a}}),
    s.offers.filter(function(x){return x.s===AS}).map(function(x){return {ts:x.ts,ic:'hand',t:U.offer+': '+sum(x.p)+' × '+x.q,s:GD[x.id].n,nw:x.src==='app'&&x.st==='wait'}})).sort(function(a,b){return b.ts-a.ts}).slice(0,8);
  pv.innerHTML='<div class="kpi"><div class="kp"><small>'+h(U.newOrders)+'</small><b>'+o.filter(function(x){return x.st===0}).length+'</b></div><div class="kp'+(waiting(s)?' warn':'')+'"><small>'+h(U.waiting)+'</small><b>'+waiting(s)+'</b></div><div class="kp ok"><small>'+h(U.reply)+'</small><b>'+rm+' '+h(U.min)+'</b></div><div class="kp'+(stale.length?' warn':' ok')+'"><small>'+h(U.stale)+'</small><b>'+stale.length+' / '+g.length+'</b></div></div>'+
  '<div class="grid2"><section class="card"><h2>'+h(U.h_goods)+'</h2>'+(stale.length?'<ul class="feed">'+stale.slice(0,4).map(function(x){return '<li><img src="'+K.img+'/p-'+x.id+'.webp" alt="" style="width:40px;height:40px;object-fit:contain"><span class="grow">'+h(x.n)+'<small>'+h(U.updated)+' '+dmy(x.upd)+'</small></span><i class="chip chip-warn">'+dmy(x.upd)+'</i></li>'}).join('')+'</ul><button type="button" class="btn btn-red" id="conf-all" style="margin-top:12px">'+ic('refresh')+h(U.confirmAll)+'</button>':'<p class="ok">'+ic('check')+h(U.confirmed)+'</p>')+'</section>'+
  '<section class="card"><h2>'+h(U.live)+'</h2><ul class="feed">'+(feed.length?feed.map(function(f){return '<li'+(f.nw?' class="nw"':'')+'>'+ic(f.ic)+'<span class="grow">'+h(f.t)+'<small>'+h(f.s)+' · '+hm(f.ts)+'</small></span></li>'}).join(''):'<li class="muted">'+h(U.noOrders)+'</li>')+'</ul></section></div>';
  var ca=$('#conf-all');if(ca)ca.onclick=function(){var s2=load();s2.confirmed[AS]=Date.now();save(s2);toast(U.confirmed);dash()};show()}

var ST={t0:0,found:false,open:false,imp:0};
function start(){var sl=K.sellers[AS];
  pv.innerHTML='<div class="grid2"><section class="card inn"><h2>'+ic('bolt')+' '+h(U.h_start)+'</h2><div class="steps" aria-hidden="true"><i class="on"></i><i'+(ST.found?' class="on"':'')+'></i><i'+(ST.open?' class="on"':'')+'></i></div>'+
    '<div class="row"><label class="fld"><span>'+h(U.innT)+' ('+h(U.demo)+')</span><input id="inn" inputmode="numeric" maxlength="9" value="123456789"></label><button type="button" class="btn btn-red" id="inn-go">'+ic('search')+h(U.innGo)+'</button></div>'+
    (ST.found?'<div class="found"><p class="ok">'+ic('check')+h(U.innFound)+'</p><label class="fld"><span>'+h(U.fName)+'</span><input value="'+h(sl.n)+'"></label><label class="fld"><span>'+h(U.fLegal)+'</span><input value="'+h(sl.legal)+'"></label>'+(sl.addr?'<label class="fld"><span>'+h(U.fAddr)+'</span><input value="'+h(sl.addr)+'"></label>':'')+'<label class="fld"><span>'+h(U.fPay)+'</span><input value="'+h(sl.pay.map(function(k){return K.pay[k]}).concat(['Click','Payme','Uzum']).filter(function(v,i,a){return a.indexOf(v)===i}).join(', '))+'"></label>'+
      (ST.open?'<p class="ok">'+ic('check')+h(U.opened)+' · '+Math.max(1,Math.round((Date.now()-ST.t0)/1000))+' '+h(U.secs)+'</p>':'<button type="button" class="btn btn-red" id="open">'+h(U.open)+'</button>')+'</div>':'')+'</section>'+
    '<section class="card"><h2>'+ic('upload')+' '+h(U.excel)+'</h2><div class="drop">'+ic('upload')+'<p>'+h(U.excelD)+'</p><button type="button" class="btn btn-line" id="imp">'+h(U.excelGo)+'</button></div>'+(ST.imp?'<p class="ok" style="margin-top:12px">'+ic('check')+h(U.excelDone.replace('{n}',mineG().length))+'</p><ul class="imp">'+mineG().map(function(g,i){return '<li style="--d:'+i*120+'ms"><span>'+h(g.n)+'</span><b>'+sum(g.p)+'</b></li>'}).join('')+'</ul>':'')+'</section></div>';
  $('#inn-go').onclick=function(){if(!ST.t0)ST.t0=Date.now();ST.found=true;start()};
  var op=$('#open');if(op)op.onclick=function(){ST.open=true;start()};
  $('#imp').onclick=function(){ST.imp=1;start()};show()}

function goods(){var s=load(),g=mineG();
  pv.innerHTML='<div class="tw"><table><thead><tr><th></th><th>'+h(U.goods)+'</th><th>'+h(U.price)+'</th><th>'+h(U.stock)+'</th><th>'+h(U.age)+'</th><th>'+h(U.ladder)+'</th></tr></thead><tbody>'+g.map(function(x){var f=isFresh(x,s),L=s.ladders[x.id]||K.ladder[x.id];
    return '<tr><td><img src="'+K.img+'/p-'+x.id+'.webp" alt=""></td><td>'+h(x.n)+'</td><td><input class="pin" data-p="'+x.id+'" inputmode="numeric" value="'+fmt(price(x.id,s))+'" aria-label="'+h(U.price)+'"></td><td><label class="tg"><input type="checkbox" data-st="'+x.id+'"'+(stockOf(x.id,s)?' checked':'')+' aria-label="'+h(U.inStock)+'"><span></span></label></td>'+
      '<td>'+(f?'<i class="chip chip-ok">'+ic('check')+h(s.confirmed[x.s]||s.confirmed['i'+x.id]?U.today:U.fresh)+'</i>':'<i class="chip chip-warn">'+dmy(x.upd)+'</i> <button type="button" class="btn btn-line btn-sm" data-cf="'+x.id+'">'+h(U.confirm)+'</button>')+'</td>'+
      '<td><button type="button" class="btn btn-line btn-sm" data-ld="'+x.id+'">'+ic('stairs')+(L?L.length:'+')+'</button></td></tr>'+
      '<tr hidden id="ld-'+x.id+'"><td colspan="6"><p class="muted" style="margin-bottom:8px">'+h(U.ladderEdit)+'</p><div class="lad-e">'+[0,1,2,3].map(function(i){var t=(L||[])[i]||[[1,5,10,20][i],Math.round(price(x.id,s)*[1,.97,.94,.9][i]/1000)*1000];return '<div class="fld"><span>'+h(U.from)+'</span><input inputmode="numeric" data-lf="'+i+'" value="'+t[0]+'"><span>'+h(U.price)+'</span><input inputmode="numeric" data-lp="'+i+'" value="'+fmt(t[1])+'"></div>'}).join('')+'</div><button type="button" class="btn btn-red btn-sm" data-ls="'+x.id+'" style="margin-top:8px">'+h(U.ladderSave)+'</button></td></tr>'}).join('')+'</tbody></table></div>'+
    '<button type="button" class="btn btn-red" id="conf-all2" style="margin-top:12px">'+ic('refresh')+h(U.confirmAll)+'</button>';
  $$('[data-p]').forEach(function(i){i.onchange=function(){var s2=load(),v=+i.value.replace(/\D/g,'');if(v){s2.prices[i.getAttribute('data-p')]=v;s2.confirmed['i'+i.getAttribute('data-p')]=Date.now();save(s2);goods()}}});
  $$('[data-st]').forEach(function(i){i.onchange=function(){var s2=load();s2.stock[i.getAttribute('data-st')]=i.checked?1:0;save(s2)}});
  $$('[data-cf]').forEach(function(b){b.onclick=function(){var s2=load();s2.confirmed['i'+b.getAttribute('data-cf')]=Date.now();save(s2);goods()}});
  $$('[data-ld]').forEach(function(b){b.onclick=function(){var r=$('#ld-'+b.getAttribute('data-ld'));r.hidden=!r.hidden}});
  $$('[data-ls]').forEach(function(b){b.onclick=function(){var id=b.getAttribute('data-ls'),r=$('#ld-'+id),L=[0,1,2,3].map(function(i){return [+$('[data-lf="'+i+'"]',r).value||1,+$('[data-lp="'+i+'"]',r).value.replace(/\D/g,'')]}).filter(function(t){return t[1]>0}).sort(function(a,b){return a[0]-b[0]});var s2=load();s2.ladders[id]=L;save(s2);toast(U.saved);goods()}});
  $('#conf-all2').onclick=function(){var s2=load();s2.confirmed[AS]=Date.now();save(s2);toast(U.confirmed);goods()};show()}

function orders(){var s=load(),o=myOrders(s);
  pv.innerHTML=o.length?'<div class="tw"><table><thead><tr><th>'+h(U.order)+'</th><th>'+h(U.buyer)+'</th><th>'+h(U.goods)+'</th><th>'+h(U.sum)+'</th><th>'+h(U.status)+'</th><th></th></tr></thead><tbody>'+o.map(function(x){
    return '<tr data-o="'+x.no+'"'+(x.src==='app'&&x.st===0?' class="nw"':'')+'><td><b>'+h(x.no)+'</b><br><small class="muted">'+hm(x.ts)+'</small></td><td>'+h(x.buyer)+(x.who==='company'?'<br><small class="muted">'+h(U.innT)+'</small>':'')+'</td><td>'+x.items.filter(function(it){return GD[it.id].s===AS}).map(function(it){return h(GD[it.id].n)+' × '+it.q}).join('<br>')+'</td><td>'+sum(myPart(x))+'<br><small class="muted">'+h(K.pay[x.pay]||x.pay)+'</small></td><td><div class="steps">'+[0,1,2,3,4].map(function(i){return '<i'+(i<=x.st?' class="on"':'')+'></i>'}).join('')+'</div><small>'+h(U['st'+x.st])+'</small></td><td>'+(x.st<4?'<button type="button" class="btn btn-red btn-sm" data-adv="'+x.no+'">'+h(U.next)+ic('chev')+'</button>':'<i class="chip chip-ok">'+ic('check')+'</i>')+'</td></tr>'}).join('')+'</tbody></table></div>':'<div class="card"><p>'+h(U.noOrders)+'</p><a class="btn btn-line" href="'+K.app+'" style="margin-top:12px">'+ic('bag')+h(U.toApp)+'</a></div>';
  $$('[data-adv]').forEach(function(b){b.onclick=function(){var s2=load(),x=s2.orders.filter(function(z){return z.no===b.getAttribute('data-adv')})[0];if(x&&x.st<4)x.st++;save(s2);orders()}});show()}

function ask(){var s=load(),a=s.asks.filter(function(x){return x.s===AS}),o=s.offers.filter(function(x){return x.s===AS});
  var items=[].concat(a.map(function(x){return {k:'a',x:x}}),o.map(function(x){return {k:'o',x:x}})).sort(function(p,q){return q.x.ts-p.x.ts});
  pv.innerHTML=items.length?'<div class="q">'+items.map(function(it){var x=it.x,g=GD[x.id];
    if(it.k==='a')return '<article class="qi'+(x.src==='app'&&!x.a?' nw':'')+'"><header>'+ic('chat')+'<b>'+h(U.question)+'</b><span>'+h(g.n)+' · '+hm(x.ts)+'</span></header><p class="q-t">'+h(x.q)+'</p>'+(x.a?'<p class="ans">'+h(x.a)+'</p>':'<div class="row"><label class="fld"><span>'+h(U.answer)+'</span><input data-ai="'+x.no+'" value="'+h(U.answerPh)+'"></label><button type="button" class="btn btn-red" data-an="'+x.no+'">'+ic('send')+h(U.answer)+'</button></div>')+'</article>';
    return '<article class="qi'+(x.src==='app'&&x.st==='wait'?' nw':'')+'"><header>'+ic('hand')+'<b>'+h(U.offer)+'</b><span>'+h(g.n)+' · '+hm(x.ts)+'</span></header><p class="q-t">'+h(U.wantsAt.replace('{p}',sum(x.p)).replace('{q}',x.q))+' · <span class="muted">'+h(U.list.replace('{p}',sum(price(x.id,s))))+'</span></p>'+
      (x.st!=='wait'?'<p class="ans">'+h(x.st==='yes'?U.accept:x.st==='no'?U.decline:U.counter+': '+sum(x.cp))+'</p>':'<div class="row"><button type="button" class="btn btn-red" data-oy="'+x.no+'">'+ic('check')+h(U.accept)+'</button><button type="button" class="btn btn-line" data-on="'+x.no+'">'+h(U.decline)+'</button><label class="fld"><span>'+h(U.counter)+'</span><input data-ci="'+x.no+'" inputmode="numeric" value="'+fmt(Math.round((x.p+price(x.id,s))/2/10000)*10000)+'"></label><button type="button" class="btn btn-line" data-oc="'+x.no+'">'+h(U.counter)+'</button></div>')+'</article>'}).join('')+'</div>':'<div class="card"><p>'+h(U.noAsk)+'</p><a class="btn btn-line" href="'+K.app+'#/p/'+mineG()[0].id+'" style="margin-top:12px">'+ic('bag')+h(U.toApp)+'</a></div>';
  function upd(list,no,f){var s2=load(),x=s2[list].filter(function(z){return z.no===no})[0];if(x){f(x);x.ats=Date.now()}save(s2);toast(U.answered);ask()}
  $$('[data-an]').forEach(function(b){b.onclick=function(){var no=b.getAttribute('data-an');upd('asks',no,function(x){x.a=$('[data-ai="'+no+'"]').value||U.answerPh})}});
  $$('[data-oy]').forEach(function(b){b.onclick=function(){upd('offers',b.getAttribute('data-oy'),function(x){x.st='yes'})}});
  $$('[data-on]').forEach(function(b){b.onclick=function(){upd('offers',b.getAttribute('data-on'),function(x){x.st='no'})}});
  $$('[data-oc]').forEach(function(b){b.onclick=function(){var no=b.getAttribute('data-oc');upd('offers',no,function(x){x.st='counter';x.cp=+$('[data-ci="'+no+'"]').value.replace(/\D/g,'')})}});show()}

function rfq(){var s=load(),me=K.sellers[AS].n;
  pv.innerHTML='<div class="q">'+s.rfqs.map(function(r){var my=r.quotes.filter(function(q){return q.seller===me})[0];
    return '<article class="qi'+(r.src==='app'&&!my?' nw':'')+'"><header>'+ic('doc')+'<b>'+h(U.rfqFrom)+' '+h(r.no)+'</b><span>'+h(r.region)+' · '+h(r.when)+' · '+hm(r.ts)+'</span></header><p class="q-t">'+h(r.what)+', '+r.qty+' '+(K.lang==='ru'?'шт.':'dona')+'</p><small class="muted">'+r.quotes.length+' · '+r.quotes.map(function(q){return h(q.seller)+' '+fmt(q.p)}).join(', ')+'</small>'+
      (my?'<p class="ans">'+h(U.quoted)+': '+sum(my.p)+' · '+my.days+'</p>':'<div class="row"><label class="fld"><span>'+h(U.quote)+'</span><input data-qp="'+r.no+'" inputmode="numeric" value="1 740 000"></label><label class="fld" style="max-width:120px"><span>'+h(U.term)+'</span><input data-qd="'+r.no+'" inputmode="numeric" value="2"></label><button type="button" class="btn btn-red" data-qs="'+r.no+'">'+ic('send')+h(U.sendQuote)+'</button></div>')+'</article>'}).join('')+'</div>';
  $$('[data-qs]').forEach(function(b){b.onclick=function(){var no=b.getAttribute('data-qs'),s2=load(),r=s2.rfqs.filter(function(z){return z.no===no})[0];r.quotes.unshift({seller:me,p:+$('[data-qp="'+no+'"]').value.replace(/\D/g,''),days:+$('[data-qd="'+no+'"]').value||2});save(s2);toast(U.quoted);rfq()}});show()}

function stats(){var s=load(),g=mineG(),old=g.filter(function(x){return !isFresh(x,s)&&ageDays(x.upd)>365}).length,ord=g.filter(function(x){return !stockOf(x.id,s)}).length,rm=replyMin(s);
  var B=[[U.views,1840],[U.carts,96],[U.orders,21]];
  pv.innerHTML='<div class="grid2"><section class="card"><h2>'+h(U.funnel)+'</h2><div class="bars">'+B.map(function(b,i){return '<div><b>'+fmt(b[1])+'</b><span style="--h:'+Math.max(8,Math.round(Math.sqrt(b[1]/B[0][1])*100))+'%;animation-delay:'+i*120+'ms"></span><small>'+h(b[0])+'</small></div>'}).join('')+'</div></section>'+
    '<section class="card"><h2>'+h(U.lose)+'</h2><ul class="lose">'+(old?'<li>'+ic('clock')+'<span>'+h(U.lose1.replace('{n}',old))+'</span></li>':'')+(ord?'<li>'+ic('truck')+'<span>'+h(U.lose2.replace('{n}',ord))+'</span></li>':'')+(rm>60?'<li>'+ic('chat')+'<span>'+h(U.lose3)+'</span></li>':'')+(!old&&!ord&&rm<=60?'<li class="muted">'+ic('check')+h(U.confirmed)+'</li>':'')+'</ul></section></div>';show()}

var V={dash:dash,start:start,goods:goods,orders:orders,ask:ask,rfq:rfq,stats:stats};
function render(){var k=(location.hash||'#dash').slice(1);if(!V[k])k='dash';$('#tb-t').textContent=U['h_'+k];
  $$('.nav a').forEach(function(a){a.classList.toggle('on',a.getAttribute('href')==='#'+k)});root.classList.remove('nav-on');V[k]();counts()}
addEventListener('hashchange',render);
$$('#as button').forEach(function(b){b.setAttribute('aria-checked',b.getAttribute('data-s')===AS);b.onclick=function(){AS=b.getAttribute('data-s');try{localStorage.setItem('tv-as',AS)}catch(e){}$$('#as button').forEach(function(x){x.setAttribute('aria-checked',x===b)});ST={t0:0,found:false,open:false,imp:0};render()}});
$('#menu-b').onclick=function(){root.classList.toggle('nav-on')};$('#nav-back').onclick=function(){root.classList.remove('nav-on')};
function clock(){var x=new Date();$('#clock').textContent=pad(x.getHours())+':'+pad(x.getMinutes())}clock();setInterval(clock,15000);
render();

/* Шапка (правило владельца, 15.10.2026): при любой прокрутке прячется и
   возвращается только через 3 секунды после полной остановки. */
var top=$('.topbar'),IDLE=3000,idleT=0;
function headIdle(){if(!top)return;clearTimeout(idleT);if(!top.contains(d.activeElement))top.classList.add('hide');idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}
addEventListener('scroll',headIdle,{passive:true});
})();
