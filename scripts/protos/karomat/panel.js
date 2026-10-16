(function(){
'use strict';
/* panel: панель ресторана Karomat. Сводка, заказы, брони по столам и часам,
   банкеты, зал по QR, меню со стоп-листом, популярные блюда. Демо-день
   собирается из одного зерна (дата), поэтому цифры сходятся между экранами;
   сверху — живое из km-demo-1: заказы, брони и заявки с сайта и из
   приложения, вызовы официанта. Смена статуса пишется туда же, и гость
   видит её у себя. «Владелец / Менеджер»: менеджер не видит выручку. */
var d=document,W=window,G=JSON.parse(d.getElementById('kp-data').textContent),U=G.ui;
var $=function(s,r){return (r||d).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))};
var REDUCED=false;try{REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
if(/[?&]embed=1/.test(location.search))d.documentElement.classList.add('embed');
function t(k,v){var s=U[k];if(s==null)return k;if(v)for(var x in v)s=s.split('{'+x+'}').join(v[x]);return s}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function sum(n){return fmt(n)+' '+t('sum')}
function mln(n){return (n/1e6).toFixed(1).replace('.',',')+' '+t('mln')}
function ic(k){return '<svg class="ic" aria-hidden="true"><use href="#i-'+k+'"/></svg>'}
function pad(n){return (n<10?'0':'')+n}
var P={};G.menu.forEach(function(m){P[m.id]=m});
function price(id,v){var p=P[id];return v>=0&&p.v[v]?p.v[v].p:p.p}

/* ── Живое из браузера ─────────────────────────────────────────────────── */
var KEY='km-demo-1',S;
function load(){try{S=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){S=null}S=S||{};['cart','orders','books','banq','calls','stop'].forEach(function(k){if(!Array.isArray(S[k]))S[k]=[]});if(typeof S.pts!=='number')S.pts=0}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
load();
var ROLE='owner';try{ROLE=sessionStorage.getItem('kp-role')||'owner'}catch(e){}

/* ── Демо-день из зерна ────────────────────────────────────────────────── */
var now=new Date(),today=now.getFullYear()+'-'+pad(now.getMonth()+1)+'-'+pad(now.getDate());
function rng(z){return function(){z|=0;z=z+0x6D2B79F5|0;var x=Math.imul(z^z>>>15,1|z);x=x+Math.imul(x^x>>>7,61|x)^x;return ((x^x>>>14)>>>0)/4294967296}}
var R=rng(+today.replace(/-/g,''));
var POP=[3745,3771,3790,3755,3758,3781,3794,3749,3833,3818,3767,3725,3718,3808,3793,3786,3750,3810,3820,3753];
function pick(a){return a[Math.floor(R()*a.length)]}
function demoOrders(){var o=[],n=now.getHours()*60+now.getMinutes(),start=10*60+20,modes=['deliv','deliv','pick','table','table','deliv'];
  for(var i=0;i<22;i++){var m=start+Math.floor(i*(Math.max(n,start+300)-start)/22+R()*12);if(m>n)break;var mode=pick(modes),k=1+Math.floor(R()*3),items=[];
    for(var j=0;j<k;j++){var id=R()<.7?pick(POP):pick(G.menu).id;items.push({id:id,v:P[id].v.length?0:-1,q:1+Math.floor(R()*2)})}
    if(R()<.6)items.push({id:3749,v:-1,q:1});if(R()<.7)items.push({id:3833,v:-1,q:2+Math.floor(R()*3)});
    var food=items.reduce(function(s,c){return s+price(c.id,c.v)*c.q},0),age=n-m,st=age>70?3:age>40?2:age>15?1:0;
    o.push({no:'KR-'+(4020+i),ts:new Date(now.getFullYear(),now.getMonth(),now.getDate(),Math.floor(m/60),m%60).getTime(),items:items,food:food,deliv:mode==='deliv'&&food<300000?15000:0,svc:mode==='table'?Math.round(food*.15):0,mode:mode,table:mode==='table'?1+Math.floor(R()*13):0,pay:pick(['click','payme','uzum','cash']),addr:mode==='deliv'?pick(G.streets)+', '+(1+Math.floor(R()*60)):'',st:st,src:pick(['site','app','phone','ig']),demo:1})}
  o.forEach(function(x){x.total=x.food+x.deliv+x.svc});return o.reverse()}
function demoBooks(){var o=[],used={};for(var i=0;i<15;i++){var tb=G.hall[Math.floor(R()*G.hall.length)],hh=12+Math.floor(R()*9),mm=R()<.5?'00':'30',key=tb.id+'|'+hh;if(used[key]||used[tb.id+'|'+(hh+1)]||used[tb.id+'|'+(hh-1)])continue;used[key]=1;
    o.push({no:'B-'+(1001+i),date:today,time:pad(hh)+':'+mm,g:Math.max(1,tb.s-Math.floor(R()*2)),t:tb.id,name:pick(G.guests),phone:'+998 9'+Math.floor(R()*9)+' *** ** '+pad(Math.floor(R()*99)),src:pick(['phone','ig','site','phone']),st:hh*60<now.getHours()*60+now.getMinutes()-90?1:0,demo:1})}return o}
function demoBanq(){var k=G.kinds;return [
  {no:'K-205',kind:'toy',g:120,date:'+12',name:pick(G.guests),tot:21400000,st:1,src:'phone'},{no:'K-206',kind:'bday',g:30,date:'+3',name:pick(G.guests),tot:4950000,st:2,src:'ig'},
  {no:'K-207',kind:'corp',g:60,date:'+9',name:pick(G.guests),tot:9800000,st:0,src:'site'},{no:'K-203',kind:'family',g:20,date:'-2',name:pick(G.guests),tot:3300000,st:3,src:'phone'}].map(function(b){var dd=new Date();dd.setDate(dd.getDate()+ +b.date);b.date=dd.getFullYear()+'-'+pad(dd.getMonth()+1)+'-'+pad(dd.getDate());b.demo=1;return b})}
var SO=demoOrders(),SB=demoBooks(),SQ=demoBanq();
function orders(){return S.orders.concat(SO)}
function books(){return S.books.concat(SB)}
function banqs(){return S.banq.concat(SQ)}
function isLive(x){return !x.demo}

/* ── Каркас ────────────────────────────────────────────────────────────── */
var pv=$('#pv'),cur='dash',toastT=0;
function toast(m){var el=$('#toast');el.textContent=m;el.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){el.classList.remove('on')},2400)}
function own(){return ROLE==='owner'}
function counts(){var n={orders:S.orders.filter(function(o){return o.st<3}).length,books:S.books.filter(function(b){return b.st===0}).length,banq:S.banq.filter(function(b){return b.st===0}).length,hall:S.calls.filter(function(c){return !c.done}).length};
  $$('[data-cnt]').forEach(function(i){var v=n[i.getAttribute('data-cnt')];i.textContent=v;i.hidden=!v})}
function go(){cur=(location.hash||'#dash').slice(1);if(!V[cur])cur='dash';
  $$('.nav a').forEach(function(a){a.classList.toggle('on',a.getAttribute('href')==='#'+cur)});$('#tb-t').textContent=t('h_'+cur);
  pv.innerHTML=V[cur]();if(V[cur+'_on'])V[cur+'_on']();d.body.classList.remove('nav-on');d.body.classList.toggle('mgr',!own());counts();window.scrollTo(0,0)}
addEventListener('hashchange',go);
addEventListener('storage',function(e){if(e.key===KEY){load();go();toast(t('liveNew'))}});
$('#menu-b').onclick=function(){d.body.classList.add('nav-on')};$('#nav-back').onclick=function(){d.body.classList.remove('nav-on')};
$$('[data-role]').forEach(function(b){b.setAttribute('aria-checked',b.getAttribute('data-role')===ROLE);b.onclick=function(){ROLE=b.getAttribute('data-role');try{sessionStorage.setItem('kp-role',ROLE)}catch(e){}$$('[data-role]').forEach(function(x){x.setAttribute('aria-checked',x===b)});go()}});
function tick(){var n=new Date();$('#clock').textContent=pad(n.getHours())+':'+pad(n.getMinutes())}tick();setInterval(tick,15000);
function side(title,body){var s=$('#side');s.innerHTML='<div class="sd-back" data-x></div><aside class="sd" role="dialog" aria-modal="true" aria-label="'+h(title)+'"><header><b>'+h(title)+'</b><button type="button" class="ib" data-x aria-label="'+t('close')+'">'+ic('x')+'</button></header><div class="sd-b">'+body+'</div></aside>';s.hidden=false;void s.offsetWidth;s.classList.add('on');$$('[data-x]',s).forEach(function(b){b.onclick=closeSide});return $('.sd-b',s)}
function closeSide(){var s=$('#side');s.classList.remove('on');setTimeout(function(){s.hidden=true;s.innerHTML=''},REDUCED?0:250)}
addEventListener('keydown',function(e){if(e.key==='Escape')closeSide()});
function hm(ts){var x=new Date(ts);return pad(x.getHours())+':'+pad(x.getMinutes())}
function ddm(s){var p=s.split('-');return p[2]+'.'+p[1]}
function stN(o,i){return t(['st0','st1',o.mode==='deliv'?'st2d':o.mode==='pick'?'st2p':'st2t',o.mode==='deliv'?'st3d':'st3p'][i])}
function modeIc(m){return {deliv:'truck',pick:'walk',table:'qr'}[m]}
function newTag(x){return isLive(x)?'<i class="nw">'+t('newLive')+'</i>':''}
function kpi(ic2,label,val,sub,cls){return '<div class="kp'+(cls?' '+cls:'')+'">'+ic(ic2)+'<small>'+label+'</small><b>'+val+'</b>'+(sub?'<span>'+sub+'</span>':'')+'</div>'}

/* ── Сводка ────────────────────────────────────────────────────────────── */
var V={};
V.dash=function(){var os=orders(),todayO=os.filter(function(o){return new Date(o.ts).toDateString()===now.toDateString()}),rev=todayO.reduce(function(s,o){return s+o.total},0),bk=books().filter(function(b){return b.date===today&&b.st<2}),gs=bk.reduce(function(s,b){return s+b.g},0),bq=banqs().filter(function(b){return b.st<3}),pipe=bq.reduce(function(s,b){return s+b.tot},0);
  var days=[],k=rng(7);for(var i=6;i>=0;i--){var dd=new Date();dd.setDate(dd.getDate()-i);var base=(dd.getDay()===5||dd.getDay()===6?1.35:1)*(9+k()*4);days.push({d:t('wd'+dd.getDay()),v:i===0?rev:Math.round(base*1e6/1000)*1000,n:i===0?todayO.length:Math.round(base*2.1)})}
  var mx=Math.max.apply(null,days.map(function(x){return own()?x.v:x.n}));
  var feed=[].concat(S.orders.map(function(o){return {ts:o.ts,ic:'bag',t:t('f_order',{n:o.no,s:sum(o.total)})}}),S.books.map(function(b){return {ts:b.ts,ic:'table',t:t('f_book',{t:b.t,h:b.time,g:b.g})}}),S.banq.map(function(b){return {ts:b.ts,ic:'users',t:t('f_banq',{g:b.g})}}),S.calls.map(function(c){return {ts:c.ts,ic:c.type==='bill'?'receipt':'bell',t:t(c.type==='bill'?'f_bill':'f_call',{t:c.t})}})).sort(function(a,b){return b.ts-a.ts}).slice(0,6);
  return '<div class="kps">'+kpi('chart',t('k_rev'),mln(rev),t('k_revS',{n:todayO.length}),'own')+kpi('bag',t('k_orders'),todayO.length,t('k_ordersS',{d:todayO.filter(function(o){return o.mode==='deliv'}).length,t:todayO.filter(function(o){return o.mode==='table'}).length}))+kpi('table',t('k_books'),bk.length,t('k_booksS',{g:gs}))+kpi('users',t('k_banq'),bq.length,own()?t('k_banqS',{s:mln(pipe)}):'')+kpi('receipt',t('k_avg'),sum(todayO.length?Math.round(rev/todayO.length/1000)*1000:0),'','own')+'</div>'+
    '<div class="g2"><section class="card"><h2>'+(own()?t('week'):t('weekN'))+'</h2><div class="bars">'+days.map(function(x,i){var v=own()?x.v:x.n;return '<div class="bar'+(i===6?' on':'')+'"><span style="--h:'+(v/mx).toFixed(3)+'"><i>'+(own()?mln(v):v)+'</i></span><small>'+x.d+'</small></div>'}).join('')+'</div></section>'+
    '<section class="card"><h2>'+t('liveFeed')+'</h2>'+(feed.length?'<ul class="feed">'+feed.map(function(f){return '<li>'+ic(f.ic)+'<span>'+f.t+'</span><small>'+hm(f.ts)+'</small></li>'}).join('')+'</ul>':'<p class="muted">'+t('feedEmpty')+'</p>')+'</section></div>'+
    '<div class="g2"><section class="card"><h2>'+t('topToday')+'</h2><ol class="top">'+topDishes().slice(0,5).map(function(x){return '<li><img src="'+G.img+'/d-'+x.id+'.webp" alt="" loading="lazy"><span><b>'+h(P[x.id].n)+'</b><small>'+t('portions',{n:x.n})+'</small></span><b class="own">'+mln(x.rev)+'</b></li>'}).join('')+'</ol><a class="more" href="#dishes">'+t('allDishes')+ic('chev')+'</a></section>'+
    '<section class="card"><h2>'+t('hallNow')+'</h2>'+miniHall()+'<a class="more" href="#hall">'+t('openHall')+ic('chev')+'</a></section></div>'};

/* ── Заказы ────────────────────────────────────────────────────────────── */
V.orders=function(){var os=orders();return '<section class="card"><div class="tw"><table class="tbl"><thead><tr><th>'+t('no')+'</th><th>'+t('time')+'</th><th>'+t('how')+'</th><th>'+t('items')+'</th><th>'+t('sumT')+'</th><th>'+t('status')+'</th></tr></thead><tbody>'+
  os.map(function(o,i){return '<tr data-o="'+o.no+'"'+(isLive(o)?' class="live"':'')+'><td><b>'+h(o.no)+'</b>'+newTag(o)+'</td><td>'+hm(o.ts)+'</td><td><span class="md">'+ic(modeIc(o.mode))+(o.mode==='table'?t('tableN',{n:o.table}):t('m_'+o.mode))+'</span></td><td class="its">'+o.items.map(function(c){return h(P[c.id].n)+(c.q>1?' × '+c.q:'')}).join(', ')+'</td><td>'+sum(o.total)+'</td><td>'+(o.st<3?'<button type="button" class="stb s'+o.st+'" data-adv="'+o.no+'">'+stN(o,o.st)+ic('chev')+'</button>':'<span class="stb s3">'+stN(o,3)+'</span>')+'</td></tr>'}).join('')+'</tbody></table></div><p class="fine">'+t('ordersNote')+'</p></section>'};
V.orders_on=function(){$$('[data-adv]').forEach(function(b){b.onclick=function(e){e.stopPropagation();adv(b.getAttribute('data-adv'))}});$$('tr[data-o]').forEach(function(r){r.onclick=function(){orderSide(r.getAttribute('data-o'))}})};
function findO(no){return orders().filter(function(o){return o.no===no})[0]}
function adv(no){var o=findO(no);if(!o||o.st>=3)return;o.st++;if(o.hist)o.hist.push({st:o.st,ts:Date.now()});if(isLive(o))save();toast(t('stSet',{n:no,s:stN(o,o.st)}));go()}
function orderSide(no){var o=findO(no);var b=side(t('orderN',{n:no}),'<p class="md">'+ic(modeIc(o.mode))+(o.mode==='table'?t('tableN',{n:o.table}):t('m_'+o.mode))+(o.addr?': '+h(o.addr):'')+'</p><ul class="lines">'+o.items.map(function(c){return '<li><img src="'+G.img+'/d-'+c.id+'.webp" alt=""><span>'+h(P[c.id].n)+(c.v>=0?', '+h(P[c.id].v[c.v].n).toLowerCase():'')+' × '+c.q+'</span><b>'+sum(price(c.id,c.v)*c.q)+'</b></li>'}).join('')+'</ul><dl class="dl2"><div><dt>'+t('food')+'</dt><dd>'+sum(o.food)+'</dd></div>'+(o.deliv?'<div><dt>'+t('delivery')+'</dt><dd>'+sum(o.deliv)+'</dd></div>':'')+(o.svc?'<div><dt>'+t('service')+'</dt><dd>'+sum(o.svc)+'</dd></div>':'')+'<div class="tot"><dt>'+t('total')+'</dt><dd>'+sum(o.total)+'</dd></div><div><dt>'+t('pay')+'</dt><dd>'+h(o.pay)+(o.paid?' · '+t('paid'):'')+'</dd></div></dl>'+
  '<ol class="steps">'+[0,1,2,3].map(function(i){return '<li class="'+(i<=o.st?'on':'')+'">'+stN(o,i)+'</li>'}).join('')+'</ol>'+(o.st<3?'<button type="button" class="btn" id="sd-adv">'+t('toStatus',{s:stN(o,o.st+1)})+'</button>':''));
  var a=$('#sd-adv',b);if(a)a.onclick=function(){adv(no);closeSide()}}

/* ── Брони: день по столам и часам ─────────────────────────────────────── */
var BD=today;
V.books=function(){var H0=10,H1=23,list=books().filter(function(b){return b.date===BD&&b.st<2}),nowM=now.getHours()*60+now.getMinutes();
  var dd=[0,1,2].map(function(i){var x=new Date();x.setDate(x.getDate()+i);return x.getFullYear()+'-'+pad(x.getMonth()+1)+'-'+pad(x.getDate())});
  var other=books().filter(function(b){return b.date!==BD&&b.st<2&&!b.demo});
  return '<div class="tabs2">'+dd.map(function(x,i){return '<button type="button" data-bd="'+x+'" aria-pressed="'+(x===BD)+'">'+(i===0?t('today'):i===1?t('tomorrow'):ddm(x))+'</button>'}).join('')+'</div>'+
  '<section class="card"><div class="tl-w"><div class="tl" style="--n:'+(H1-H0)+'"><div class="tl-h"><span></span>'+Array.from({length:H1-H0},function(_,i){return '<span>'+(H0+i)+'</span>'}).join('')+'</div>'+
  G.hall.map(function(tb){var mine=list.filter(function(b){return b.t===tb.id});return '<div class="tl-r"><b>'+t('tableShort',{n:tb.id})+'<small>'+tb.s+'</small></b><div class="tl-c">'+mine.map(function(b){var m=b.time.split(':'),st=(+m[0]-H0)*60+ +m[1];return '<button type="button" class="tl-b'+(isLive(b)?' live':'')+(b.st===1?' came':'')+'" data-b="'+b.no+'" style="--s:'+(st/((H1-H0)*60)).toFixed(4)+';--w:'+(120/((H1-H0)*60)).toFixed(4)+'"><b>'+b.time+'</b> '+h(b.name)+' · '+b.g+'</button>'}).join('')+(BD===today&&nowM>H0*60&&nowM<H1*60?'<i class="tl-now" style="--s:'+((nowM-H0*60)/((H1-H0)*60)).toFixed(4)+'"></i>':'')+'</div></div>'}).join('')+'</div></div><p class="fine">'+t('booksNote')+'</p></section>'+
  (other.length?'<section class="card"><h2>'+t('otherDays')+'</h2><ul class="feed">'+other.map(function(b){return '<li>'+ic('table')+'<span><button type="button" class="lnk" data-b="'+b.no+'">'+h(b.no)+'</button> · '+ddm(b.date)+' '+b.time+' · '+t('tableN',{n:b.t})+' · '+b.g+' · '+h(b.name)+'</span>'+newTag(b)+'</li>'}).join('')+'</ul></section>':'')};
V.books_on=function(){$$('[data-bd]').forEach(function(b){b.onclick=function(){BD=b.getAttribute('data-bd');go()}});$$('[data-b]').forEach(function(b){b.onclick=function(){bookSide(b.getAttribute('data-b'))}});var w=$('.tl-w'),n=$('.tl-now');if(w&&n)w.scrollLeft=Math.max(0,n.offsetLeft-120)};
function bookSide(no){var b=books().filter(function(x){return x.no===no})[0];var s=side(t('bookN',{n:no}),'<dl class="dl2"><div><dt>'+t('table')+'</dt><dd>'+b.t+'</dd></div><div><dt>'+t('date')+'</dt><dd>'+ddm(b.date)+', '+b.time+'</dd></div><div><dt>'+t('guests')+'</dt><dd>'+b.g+'</dd></div><div><dt>'+t('guest')+'</dt><dd>'+h(b.name)+'</dd></div><div><dt>'+t('phone')+'</dt><dd>'+h(b.phone)+'</dd></div><div><dt>'+t('source')+'</dt><dd>'+t('src_'+(b.demo?b.src:b.src||'site'))+'</dd></div></dl><div class="row"><button type="button" class="btn" data-bs="1">'+t('came')+'</button><button type="button" class="btn ghost" data-bs="2">'+t('cancel')+'</button></div>');
  $$('[data-bs]',s).forEach(function(x){x.onclick=function(){b.st=+x.getAttribute('data-bs');if(!b.demo)save();closeSide();toast(b.st===1?t('cameOk'):t('cancelOk'));go()}})}

/* ── Банкеты ───────────────────────────────────────────────────────────── */
V.banq=function(){var all=banqs();return '<div class="kan">'+[0,1,2,3].map(function(st){var l=all.filter(function(b){return b.st===st});return '<section class="kc"><h2>'+t('bq_st'+st)+' <i>'+l.length+'</i></h2>'+l.map(function(b){return '<article class="kb'+(isLive(b)?' live':'')+'" data-q="'+b.no+'"><header><b>'+h(b.no)+'</b>'+newTag(b)+'</header><p>'+t('k_'+b.kind)+' · '+b.g+' '+t('guestsS')+'</p><p class="muted">'+ddm(b.date)+' · '+h(b.name)+'</p><p class="own"><b>'+sum(b.tot)+'</b></p><p class="mgr-only">≈ '+sum(Math.round(b.tot/b.g/1000)*1000)+' '+t('perGuest')+'</p>'+(st<3?'<button type="button" class="stb s'+st+'" data-qa="'+b.no+'">'+t('bq_st'+(st+1))+ic('chev')+'</button>':'')+'</article>'}).join('')+'</section>'}).join('')+'</div><p class="fine">'+t('banqNote')+'</p>'};
V.banq_on=function(){$$('[data-qa]').forEach(function(b){b.onclick=function(e){e.stopPropagation();var q=banqs().filter(function(x){return x.no===b.getAttribute('data-qa')})[0];q.st++;if(!q.demo)save();go()}});
  $$('[data-q]').forEach(function(c){c.onclick=function(){var q=banqs().filter(function(x){return x.no===c.getAttribute('data-q')})[0];side(t('banqN',{n:q.no}),'<p>'+t('k_'+q.kind)+' · '+q.g+' '+t('guestsS')+' · '+ddm(q.date)+'</p>'+(q.items?'<ul class="lines">'+q.items.map(function(it){return '<li><img src="'+G.img+'/d-'+it.id+'.webp" alt=""><span>'+h(P[it.id].n)+' × '+it.q+' '+t('perTable')+'</span><b>'+sum(price(it.id,it.v)*it.q)+'</b></li>'}).join('')+'</ul>':'<p class="muted">'+t('byPhone')+'</p>')+'<dl class="dl2">'+(q.food?'<div><dt>'+t('food')+'</dt><dd>'+sum(q.food)+'</dd></div><div><dt>'+t('service')+'</dt><dd>'+sum(q.svc)+'</dd></div>':'')+'<div class="tot"><dt>'+t('total')+'</dt><dd>'+sum(q.tot)+'</dd></div><div><dt>'+t('phone')+'</dt><dd>'+h(q.phone||'+998 9* *** ** **')+'</dd></div></dl>')}})};

/* ── Зал и QR ──────────────────────────────────────────────────────────── */
function hallState(){var nowM=now.getHours()*60+now.getMinutes(),o={};
  books().forEach(function(b){if(b.date===today&&b.st<2){var m=b.time.split(':'),s=+m[0]*60+ +m[1];if(nowM>=s-30&&nowM<s+120)o[b.t]=b.st===1||nowM>=s?'eat':'soon'}});
  orders().forEach(function(x){if(x.mode==='table'&&x.st<3)o[x.table]='eat'});
  S.calls.forEach(function(c){if(!c.done)o[c.t]=c.type})
  return o}
function miniHall(){var st=hallState();return '<svg viewBox="0 -4 100 70" class="mh">'+G.hall.map(function(x){var cx=x.x+x.w/2,cy=x.y+x.h/2,c='mt '+(st[x.id]||'free');return '<g class="'+c+'">'+(x.r?'<circle cx="'+cx+'" cy="'+cy+'" r="'+x.w/2+'"/>':'<rect x="'+x.x+'" y="'+x.y+'" width="'+x.w+'" height="'+x.h+'" rx="2"/>')+'<text x="'+cx+'" y="'+(cy+1.4)+'" text-anchor="middle">'+x.id+'</text></g>'}).join('')+'</svg><p class="lg2"><span><i class="free"></i>'+t('h_free')+'</span><span><i class="soon"></i>'+t('h_soon')+'</span><span><i class="eat"></i>'+t('h_eat')+'</span><span><i class="waiter"></i>'+t('h_call')+'</span></p>'}
V.hall=function(){var calls=S.calls.filter(function(c){return !c.done});return '<div class="g2"><section class="card"><h2>'+t('hallNow')+'</h2>'+miniHall()+'</section><section class="card"><h2>'+t('calls')+'</h2>'+(calls.length?'<ul class="calls">'+calls.map(function(c,i){return '<li class="'+c.type+'">'+ic(c.type==='bill'?'receipt':'bell')+'<span><b>'+t('tableN',{n:c.t})+'</b><small>'+(c.type==='bill'?t('wantsBill',{s:sum(c.sum||0)}):t('wantsWaiter'))+' · '+hm(c.ts)+'</small></span><button type="button" class="btn" data-done="'+i+'">'+t('done')+'</button></li>'}).join('')+'</ul>':'<p class="muted">'+t('noCalls')+'</p>')+'<p class="fine">'+t('qrNote')+'</p><a class="btn ghost" href="'+G.app+'#/t/7">'+ic('qr')+t('openQr')+'</a></section></div>'};
V.hall_on=function(){$$('[data-done]').forEach(function(b){b.onclick=function(){var live=S.calls.filter(function(c){return !c.done});live[+b.getAttribute('data-done')].done=1;save();toast(t('doneOk'));go()}})};

/* ── Меню и стоп-лист ──────────────────────────────────────────────────── */
var MC=G.cats[0].id;
V.menu=function(){var l=G.menu.filter(function(m){return m.cat===MC});return '<div class="tabs2 scroll">'+G.cats.map(function(c){return '<button type="button" data-mc="'+c.id+'" aria-pressed="'+(c.id===MC)+'">'+h(c.n)+'</button>'}).join('')+'</div><section class="card"><ul class="mlist">'+l.map(function(m){var off=S.stop.indexOf(m.id)>=0;return '<li'+(off?' class="off"':'')+'><img src="'+G.img+'/d-'+m.id+'.webp" alt="" loading="lazy"><span><b>'+h(m.n)+'</b><small>'+(m.v.length?m.v.map(function(v){return h(v.n)+' '+fmt(v.p)}).join(' · '):sum(m.p))+'</small></span><label class="sw2"><input type="checkbox" data-stop="'+m.id+'"'+(off?'':' checked')+'><i></i><small>'+(off?t('inStop'):t('onSale'))+'</small></label></li>'}).join('')+'</ul><p class="fine">'+t('stopNote')+'</p></section>'};
V.menu_on=function(){$$('[data-mc]').forEach(function(b){b.onclick=function(){MC=b.getAttribute('data-mc');go()}});$$('[data-stop]').forEach(function(c){c.onchange=function(){var id=+c.getAttribute('data-stop');S.stop=S.stop.filter(function(x){return x!==id});if(!c.checked)S.stop.push(id);save();toast(c.checked?t('backOn'):t('stopOn',{n:P[id].n}));go()}})};

/* ── Популярные блюда ──────────────────────────────────────────────────── */
function topDishes(){var c={};orders().forEach(function(o){o.items.forEach(function(it){var x=c[it.id]||(c[it.id]={id:it.id,n:0,rev:0});x.n+=it.q;x.rev+=price(it.id,it.v)*it.q})});
  var k=rng(11);POP.forEach(function(id,i){var x=c[id]||(c[id]={id:id,n:0,rev:0});var add=Math.round((40-i*1.6)*(1+k()*.3));x.n+=add;x.rev+=add*P[id].p});
  return Object.keys(c).map(function(k2){return c[k2]}).sort(function(a,b){return b.n-a.n})}
V.dishes=function(){var all=topDishes(),mx=all[0].n,low=G.menu.filter(function(m){return !all.some(function(x){return x.id===m.id})&&m.cat!=='bar'}).slice(0,6);
  return '<div class="g2 wide1"><section class="card"><h2>'+t('top30')+'</h2><ol class="rank">'+all.slice(0,15).map(function(x,i){return '<li><span class="n">'+(i+1)+'</span><img src="'+G.img+'/d-'+x.id+'.webp" alt="" loading="lazy"><span class="rb"><b>'+h(P[x.id].n)+'</b><i style="--k:'+(x.n/mx).toFixed(3)+'"></i></span><span class="rv2"><b>'+x.n+'</b><small class="own">'+mln(x.rev)+'</small></span></li>'}).join('')+'</ol></section>'+
  '<section class="card"><h2>'+t('rare')+'</h2><ul class="mlist">'+low.map(function(m){return '<li><img src="'+G.img+'/d-'+m.id+'.webp" alt="" loading="lazy"><span><b>'+h(m.n)+'</b><small>'+sum(m.p)+'</small></span></li>'}).join('')+'</ul><p class="fine">'+t('rareNote')+'</p></section></div>'};

/* Шапка (правило владельца, 15.10.2026): при любой прокрутке прячется и
   возвращается только через 3 секунды после полной остановки. */
var top=$('.topbar'),IDLE=3000,idleT=0;
function headIdle(){if(!top)return;clearTimeout(idleT);if(!top.contains(d.activeElement))top.classList.add('hide');idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}
addEventListener('scroll',headIdle,{passive:true});

go();
})();
