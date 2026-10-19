(function(){
'use strict';
/* panel: админка бутика Baldinini Tashkent по эталону greenwell. Два уровня
   (владелец DevUz продаёт их отдельно): «Панель магазина» и «Расширенная
   панель», переключатель в боковом меню, у каждого раздела пометка уровня.
   Роли: владелец, управляющий, продавец; продавец не видит себестоимость и
   прибыль. Заказ, бронь примерки и «сообщить о размере» с сайта (bd-demo-1)
   приходят сюда первой строкой, статус и остатки отсюда видны покупателю.
   Цифры демо из одного зерна: сходятся между экранами. Действия — в
   историю (bd-panel-1). Модель панель не вызывает. */
var d=document,G=JSON.parse(d.getElementById('bp-data').textContent),U=G.ui,L=G.lang,IMG=G.img,P={};
G.products.forEach(function(p){P[p.id]=p});
var REDUCED=false;try{REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
var EMBED=/[?&]embed=1/.test(location.search);if(EMBED)d.documentElement.classList.add('embed');
var $=function(s,r){return (r||d).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))};
function t(k,v){var s=U[k];if(s==null)return k;if(v)for(var x in v)s=s.split('{'+x+'}').join(v[x]);return s}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function mln(n){return (n/1e6).toFixed(Math.abs(n)>=1e8?0:1).replace('.',L==='en'?'.':',')+' '+t('mln')}
function sum(n){return fmt(n)+' '+t('sum')}
function pct(x,dg){return (x*100).toFixed(dg==null?1:dg).replace('.',L==='en'?'.':',')+'%'}
function ic(k){return '<svg class="ic" aria-hidden="true"><use href="#i-'+k+'"/></svg>'}
function pad(n){return (n<10?'0':'')+n}
function dstr(ts){var x=new Date(ts);return pad(x.getDate())+'.'+pad(x.getMonth()+1)}
function tstr(ts){var x=new Date(ts);return pad(x.getHours())+':'+pad(x.getMinutes())}
function img(p,w){return '<img src="'+IMG+'/p-'+p.id+'-0-600.webp" alt="'+h(p.n)+'" width="'+w+'" height="'+w+'" loading="lazy">'}

/* ── Демо-данные из одного зерна ─────────────────────────────────────── */
var zr=20261019;function rnd(){zr=(zr*1664525+1013904223)>>>0;return zr/4294967296}
function pick(a,w){if(!w)return a[Math.floor(rnd()*a.length)];var tot=0,i;for(i=0;i<w.length;i++)tot+=w[i];var r=rnd()*tot,s=0;for(i=0;i<a.length;i++){s+=w[i];if(r<s)return a[i]}return a[a.length-1]}
var NOW=Date.now(),DAY=864e5,START=new Date(new Date(NOW).setHours(0,0,0,0)).getTime();
var popW=G.products.map(function(p){return p.pop||5});
var SELL=G.sellers.map(function(s){return s.n});
/* Клиенты: часть — постоянные (VIP), их размеры и вкусы помнит бутик. */
var CL=G.clients.map(function(c,i){return {id:'C'+(101+i),n:c.n,ph:c.ph,vip:!!c.vip,szw:c.szw,szm:c.szm,like:c.like,seller:SELL[i%SELL.length],bday:c.bday,note:c.note,orders:[],spent:0,last:0}});
var clW=CL.map(function(c){return c.vip?7:1});
var CH={btq:58,site:27,ig:15},PAYW={click:22,payme:18,uzumbank:12,card:22,visa:14,cash:12};
var ORD=[],n0=24170;
for(var day=89;day>=0;day--){var base=START-day*DAY,wd=new Date(base).getDay(),cnt=Math.round((5+rnd()*4)*(wd===6||wd===0?1.45:1)*(1+(89-day)/89*.15));if(day===0)cnt=Math.round(cnt*Math.min(1,(NOW-START)/DAY+.1));
  for(var k=0;k<cnt;k++){var ts=base+(10+Math.pow(rnd(),.9)*12.5)*36e5;if(ts>NOW-20*6e4)continue;var items=[],m=pick([1,2],[78,22]);
    for(var j=0;j<m;j++){var p=pick(G.products,popW);if(items.some(function(x){return x.id===p.id}))continue;items.push({id:p.id,sz:p.sizes?pick(p.sizes,p.sizes.map(function(z,i){return 1+Math.min(i,p.sizes.length-1-i)*2})):'one',q:1,p:p.price})}
    var goods=items.reduce(function(s,x){return s+x.p*x.q},0),ch=pick(Object.keys(CH),Object.keys(CH).map(function(x){return CH[x]})),c=pick(CL,clW);
    var age=(NOW-ts)/36e5,st=ch==='btq'?3:age<2?0:age<6?1:age<24?2:3,ret=st===3&&rnd()<.035,exch=!ret&&st===3&&rnd()<.03,canc=ch!=='btq'&&rnd()<.02;
    var o={no:'BT-'+(n0--),ts:ts,items:items,goods:goods,total:goods,ch:ch,pay:pick(Object.keys(PAYW),Object.keys(PAYW).map(function(x){return PAYW[x]})),st:canc?-1:st,ret:ret,exch:exch,gift:rnd()<.09,seller:c.vip&&rnd()<.7?c.seller:pick(SELL),cl:c,demo:1,recv:ch==='btq'?'btq':pick(['courier','pickup'],[70,30]),tryon:rnd()<.5};
    ORD.push(o);if(o.st!==-1&&!o.ret){c.orders.push(o);c.spent+=o.total;c.last=Math.max(c.last,ts)}}}
ORD.sort(function(a,b){return b.ts-a.ts});
CL.sort(function(a,b){return b.spent-a.spent});
/* Брони примерки бутика на неделю (демо) и «ждут размер». */
var TRY=[];(function(){for(var dd=-3;dd<7;dd++){var n=Math.round(2+rnd()*3);for(var i=0;i<n;i++){var p=pick(G.products.filter(function(x){return x.sizes}),null),c=pick(CL,clW),hh=11+Math.floor(rnd()*10),inSt=p.sizes.filter(function(z){return p.stock[z]>0});
  var dt=new Date(START+dd*DAY);TRY.push({id:'TR-'+(900+TRY.length),day:dt.getFullYear()+'-'+pad(dt.getMonth()+1)+'-'+pad(dt.getDate()),tm:pad(hh)+':00',pid:p.id,sz:pick(inSt.length?inSt:p.sizes),nm:c.n,ph:c.ph,st:dd<0?pick(['done','done','no']):dd===0&&hh<new Date(NOW).getHours()?'done':pick(['ok','ok','new']),seller:pick(SELL),demo:1})}}})();
var ALERTS0=[];(function(){var out=G.products.filter(function(p){return p.sizes});for(var i=0;i<7;i++){var p=pick(out),c=pick(CL);ALERTS0.push({pid:p.id,sz:pick(p.sizes),ph:c.ph,nm:c.n,ts:NOW-rnd()*12*DAY})}})();
/* Посещаемость: визиты по источникам, Instagram отдельно. */
var SRC=G.sources,VIS=[];for(var vd=89;vd>=0;vd--){var wv=new Date(START-vd*DAY).getDay(),tot=Math.round((210+rnd()*90)*(wv===6||wv===0?1.3:1)*(1+(89-vd)/89*.2));VIS.push({ts:START-vd*DAY,n:tot})}

/* ── Память: магазин (bd-demo-1) и панель (bd-panel-1) ───────────────── */
var KEY='bd-demo-1',PK='bd-panel-1',S={},PS={};
function load(){try{S=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){S={}}try{PS=JSON.parse(localStorage.getItem(PK)||'{}')||{}}catch(e){PS={}}
  S.orders=S.orders||[];S.bookings=S.bookings||[];S.alerts=S.alerts||[];S.stock=S.stock||{};PS.log=PS.log||[];PS.ord=PS.ord||{};PS.tr=PS.tr||{};PS.wrap=PS.wrap||{};PS.ret=PS.ret||{};PS.priv=PS.priv||[];PS.rem=PS.rem||{}}
function saveS(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function saveP(){try{localStorage.setItem(PK,JSON.stringify(PS))}catch(e){}}
load();
addEventListener('storage',function(e){if(e.key===KEY||e.key===PK){load();render()}});
function live(){return S.orders.map(function(o){return {no:o.no,ts:o.ts,items:o.items,goods:o.T.goods,total:o.T.total,ch:'site',pay:o.pay,st:o.st,gift:!!o.gift,card:o.gift&&o.gift.card,seller:null,cl:{n:(o.user&&o.user.name)||t('fromSite'),ph:o.user&&o.user.phone||''},site:1,ref:o,recv:o.recv&&o.recv.type,tryon:o.recv&&o.recv.tryon,slot:o.recv&&o.recv.slot,addr:o.recv&&o.recv.addr}})}
function all(){return live().concat(ORD.map(function(o){var x=PS.ord[o.no];if(x){if(x.st!=null)o.st=x.st;if(x.seller)o.seller=x.seller;if(x.ex)o.exch=true}return o}))}
function tries(){return S.bookings.map(function(b){return {id:b.id,day:b.day,tm:b.tm,pid:b.pid,sz:b.sz,nm:b.nm,ph:b.ph,st:b.st,seller:PS.tr[b.id]&&PS.tr[b.id].seller||null,site:1,ref:b}}).concat(TRY.map(function(b){var x=PS.tr[b.id];if(x&&x.st)b.st=x.st;return b}))}
function stock(p,sz){var k=p.id+':'+sz;return S.stock[k]!=null?S.stock[k]:(p.stock&&p.stock[sz]!=null?p.stock[sz]:0)}
function cost(id){return Math.round(P[id].price*P[id].cs/10000)*10000}

/* Кто смотрит: роль и уровень панели. */
var R={tier:PS.tier||'pro',role:PS.role||'owner',tab:null,days:30,day:null};
function who(){return R.role==='owner'?G.me:R.role==='head'?G.head:SELL[0]+' ('+t('r_seller')+')'}
function money(){return R.role!=='seller'}
function tierOf(k){return G.tiers.std.indexOf(k)>=0?'std':'pro'}
function opens(k){return R.tier==='pro'||tierOf(k)==='std'}
function logAdd(k,v){PS.log.unshift({ts:Date.now(),who:who(),k:k,v:v||''});saveP()}
var LOG0=[];(function(){var acts=G.logActs;for(var i=0;i<30;i++){var a=pick(acts),o=ORD[Math.floor(rnd()*40)];LOG0.push({ts:NOW-(i*53+rnd()*45)*6e4,who:a.who==='s'?pick(SELL):a.who==='h'?G.head:G.me,k:a.k,v:(a.v?pick(a.v):'').replace('{o}',o.no)})}})();

/* ── Расчёты ───────────────────────────────────────────────────────────── */
function inP(ts,days,shift){var a=NOW-days*(shift?2:1)*DAY,b=NOW-(shift?days*DAY:0);return ts>a&&ts<=b}
function calc(days,shift){var os=all().filter(function(o){return inP(o.ts,days,shift)}),ok=os.filter(function(o){return o.st!==-1&&!o.ret}),rev=0,cs=0,byP={},byL={},byCh={btq:0,site:0,ig:0};
  ok.forEach(function(o){rev+=o.total;byCh[o.ch]=(byCh[o.ch]||0)+o.total;o.items.forEach(function(i){var c=cost(i.id)*i.q;cs+=c;var x=byP[i.id]=byP[i.id]||{q:0,rev:0,cost:0};x.q+=i.q;x.rev+=i.p*i.q;x.cost+=c;var ln=P[i.id].line,y=byL[ln]=byL[ln]||{q:0,rev:0,cost:0};y.q+=i.q;y.rev+=i.p*i.q;y.cost+=c})});
  return {os:os,ok:ok,n:ok.length,rev:rev,cost:cs,gp:rev-cs,margin:(rev-cs)/Math.max(1,rev),avg:rev/Math.max(1,ok.length),ret:os.filter(function(o){return o.ret}).length,byP:byP,byL:byL,byCh:byCh,online:(byCh.site+byCh.ig)/Math.max(1,rev)}}
function delta(a,b){if(!b)return '';var x=(a-b)/b,up=x>=0;return '<span class="dl '+(up?'up':'down')+'">'+(up?'↑':'↓')+' '+pct(Math.abs(x),1)+'</span>'}
function kpi(label,val,dl,note){return '<div class="kpi"><small>'+label+'</small><b>'+val+'</b><span>'+(dl||'')+(note?'<em>'+note+'</em>':'')+'</span></div>'}
function periods(){return '<div class="seg" role="radiogroup" aria-label="'+t('period')+'">'+[7,30,90].map(function(n){return '<button type="button" role="radio" data-days="'+n+'" aria-checked="'+(R.days===n)+'">'+t('d'+n)+'</button>'}).join('')+'</div>'}
function head(k,sub,right){return '<div class="vh"><div><h1>'+t('n_'+k)+' <span class="tt '+tierOf(k)+'">'+t(tierOf(k)==='std'?'tierStd':'tierPro')+'</span></h1>'+(sub?'<p>'+sub+'</p>':'')+'</div>'+(right||'')+'</div>'}
function noMoney(){return '<p class="lockline">'+ic('lock')+t('noMoney')+'</p>'}
/* Столбики по дням: одна серия, подсказка при наведении и с клавиатуры. */
function bars(rows,fmtv,lbl){var mx=Math.max.apply(null,rows.map(function(r){return r[1]}).concat([1])),w=100/rows.length;
  return '<div class="chart" role="img" aria-label="'+h(lbl)+'"><svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">'+[10,20,30].map(function(y){return '<line x1="0" x2="100" y1="'+y+'" y2="'+y+'"/>'}).join('')+rows.map(function(r,i){var bh=Math.max(.4,r[1]/mx*38);return '<rect x="'+(i*w+w*.18).toFixed(2)+'" y="'+(40-bh).toFixed(2)+'" width="'+(w*.64).toFixed(2)+'" height="'+bh.toFixed(2)+'" rx=".6"/>'}).join('')+'</svg>'+
  '<div class="hits">'+rows.map(function(r){return '<span tabindex="0" data-tip="'+h(r[0]+': '+fmtv(r[1]))+'"></span>'}).join('')+'</div><div class="tip" hidden></div><div class="ax"><span>'+h(rows[0][0])+'</span><span>'+h(rows[rows.length-1][0])+'</span></div></div>'}
function wireTips(r){$$('.chart',r).forEach(function(c){var tip=$('.tip',c);$$('[data-tip]',c).forEach(function(s){function on(){tip.textContent=s.getAttribute('data-tip');tip.hidden=false;var a=s.getBoundingClientRect(),b=c.getBoundingClientRect();tip.style.transform='translate('+Math.min(Math.max(0,a.left-b.left+a.width/2-70),b.width-140)+'px,0)'}s.addEventListener('mouseenter',on);s.addEventListener('focus',on);s.addEventListener('mouseleave',function(){tip.hidden=true});s.addEventListener('blur',function(){tip.hidden=true})})})}
function hbar(rows,fmtv,hi){var mx=Math.max.apply(null,rows.map(function(r){return r[1]}).concat([1]));return '<ul class="hb">'+rows.map(function(r){return '<li'+(hi&&r[2]===hi?' class="hi"':'')+' title="'+h(r[0]+': '+fmtv(r[1]))+'"><span>'+h(r[0])+'</span><i><b style="transform:scaleX('+(r[1]/mx).toFixed(3)+')"></b></i><em>'+fmtv(r[1])+'</em></li>'}).join('')+'</ul>'}

/* ── Разделы ───────────────────────────────────────────────────────────── */
var V={},pv=$('#pv');
var ST=function(o){return o.st===-1?t('st_x'):t((o.recv==='pickup'&&o.st>=2)?'stp'+o.st:'st'+o.st)};
function chName(c){return t('ch_'+c)}

/* Сводка денег (Расширенная). */
V.dash=function(){if(!money())return head('dash')+noMoney();var a=calc(R.days),b=calc(R.days,true),n=Math.min(R.days,30),rows=[];
  for(var i=n-1;i>=0;i--){var s=START-i*DAY,e=s+DAY,v=0;all().forEach(function(o){if(o.ts>=s&&o.ts<e&&o.st!==-1&&!o.ret)v+=o.total});rows.push([dstr(s),v])}
  var top=Object.keys(a.byP).map(function(id){var x=a.byP[id];return [id,x]}).sort(function(x,y){return (y[1].rev-y[1].cost)-(x[1].rev-x[1].cost)}).slice(0,8);
  var lines=Object.keys(a.byL).map(function(k){return [k,a.byL[k]]}).sort(function(x,y){return y[1].rev-x[1].rev});
  return head('dash',t('dashSub'),periods())+
  '<div class="kpis">'+kpi(t('k_rev'),mln(a.rev),delta(a.rev,b.rev))+kpi(t('k_cost'),mln(a.cost),delta(a.cost,b.cost))+kpi(t('k_gp'),mln(a.gp),delta(a.gp,b.gp))+kpi(t('k_margin'),pct(a.margin),'',t('k_marginN'))+kpi(t('k_n'),fmt(a.n),delta(a.n,b.n))+kpi(t('k_avg'),sum(a.avg),delta(a.avg,b.avg))+kpi(t('k_online'),pct(a.online,0),'',t('k_onlineN'))+kpi(t('k_ret'),fmt(a.ret),'',t('k_retN'))+'</div>'+
  '<div class="cards two"><section class="card"><h2>'+t('revByDay')+'</h2>'+bars(rows,mln,t('revByDay'))+'</section>'+
  '<section class="card"><h2>'+t('byChannel')+'</h2>'+hbar([[t('ch_btq'),a.byCh.btq,'btq'],[t('ch_site'),a.byCh.site,'site'],[t('ch_ig'),a.byCh.ig,'ig']],mln,'site')+'<p class="muted sm">'+t('byChannelN')+'</p></section></div>'+
  '<section class="card"><h2>'+t('byModel')+'</h2><div class="tw"><table class="tb"><thead><tr><th>'+t('model')+'</th><th class="r">'+t('sold')+'</th><th class="r">'+t('k_rev')+'</th><th class="r">'+t('k_cost')+'</th><th class="r">'+t('k_gp')+'</th><th class="r">'+t('k_margin')+'</th></tr></thead><tbody>'+
    top.map(function(x){var p=P[x[0]],v=x[1];return '<tr><td><span class="pm">'+img(p,32)+'<span>'+h(p.n)+'<small>'+h(p.line)+'</small></span></span></td><td class="r">'+v.q+'</td><td class="r">'+mln(v.rev)+'</td><td class="r">'+mln(v.cost)+'</td><td class="r"><b>'+mln(v.rev-v.cost)+'</b></td><td class="r">'+pct((v.rev-v.cost)/v.rev,0)+'</td></tr>'}).join('')+'</tbody></table></div></section>'+
  '<section class="card"><h2>'+t('byLine')+'</h2><div class="tw"><table class="tb"><thead><tr><th>'+t('line')+'</th><th class="r">'+t('sold')+'</th><th class="r">'+t('k_rev')+'</th><th class="r">'+t('k_gp')+'</th><th class="r">'+t('k_margin')+'</th></tr></thead><tbody>'+
    lines.map(function(x){var v=x[1];return '<tr><td>'+h(x[0])+'</td><td class="r">'+v.q+'</td><td class="r">'+mln(v.rev)+'</td><td class="r"><b>'+mln(v.rev-v.cost)+'</b></td><td class="r">'+pct((v.rev-v.cost)/v.rev,0)+'</td></tr>'}).join('')+'</tbody></table></div></section>'};

/* Заказы: с сайта — первой строкой. */
V.orders=function(){var os=all().filter(function(o){return o.ch!=='btq'}).slice(0,40),nw=os.filter(function(o){return o.site&&o.st===0}).length;
  return head('orders',t('ordersSub'))+(nw?'<p class="flash">'+ic('bell')+t('newSite',{n:nw})+'</p>':'')+
  '<div class="card flat"><div class="tw"><table class="tb ord"><thead><tr><th>№</th><th>'+t('when')+'</th><th>'+t('client')+'</th><th>'+t('goodsCol')+'</th><th class="r">'+t('sumCol')+'</th><th>'+t('recv')+'</th><th>'+t('status')+'</th></tr></thead><tbody>'+
  os.map(function(o){var p=P[o.items[0].id];return '<tr data-o="'+o.no+'" class="'+(o.site?'site':'')+'" tabindex="0"><td><b>'+o.no+'</b>'+(o.site?'<em class="new">'+t('fromSite')+'</em>':'<small>'+chName(o.ch)+'</small>')+'</td><td>'+dstr(o.ts)+' '+tstr(o.ts)+'</td><td>'+h(o.cl.n)+'</td><td><span class="pm">'+img(p,28)+'<span>'+h(p.n)+(o.items.length>1?' +'+(o.items.length-1):'')+'<small>'+(o.items[0].sz!=='one'?'EU '+o.items[0].sz:'')+'</small></span></span></td><td class="r">'+sum(o.total)+(o.gift?' '+ic('gift'):'')+'</td><td>'+t('rv_'+(o.recv||'courier'))+(o.tryon&&o.recv==='courier'?'<small>'+t('tryDoor')+'</small>':'')+'</td><td><span class="pill s'+o.st+'">'+ST(o)+'</span></td></tr>'}).join('')+'</tbody></table></div></div>'};
V.orders_on=function(){$$('.tb.ord tbody tr').forEach(function(tr){tr.onclick=function(){orderCard(tr.getAttribute('data-o'))};tr.onkeydown=function(e){if(e.key==='Enter')orderCard(tr.getAttribute('data-o'))}})};
function side(title,body){var s=$('#side');s.innerHTML='<div class="sd-back" data-x></div><aside class="sd" role="dialog" aria-modal="true" aria-label="'+h(title)+'"><div class="sd-h"><b>'+title+'</b><button type="button" class="ib" data-x aria-label="'+t('close')+'">'+ic('x')+'</button></div><div class="sd-b">'+body+'</div></aside>';s.hidden=false;void s.offsetWidth;s.classList.add('on');$$('[data-x]',s).forEach(function(b){b.onclick=closeSide});$('.sd-h button',s).focus({preventScroll:true});return s}
function closeSide(){var s=$('#side');if(s.hidden)return;s.classList.remove('on');setTimeout(function(){s.hidden=true;s.innerHTML=''},REDUCED?0:240)}
addEventListener('keydown',function(e){if(e.key==='Escape')closeSide()});
function orderCard(no){var o=all().filter(function(x){return x.no===no})[0];if(!o)return;var mx=3;
  var hist=o.site?(o.ref.hist||[]).map(function(x){return [x.ts,t('st'+x.st)]}):[[o.ts,t('st0')]];
  var s=side(t('order')+' '+o.no,'<p class="muted">'+dstr(o.ts)+' '+tstr(o.ts)+' · '+chName(o.ch)+'</p>'+
    o.items.map(function(i){var p=P[i.id];return '<div class="oi">'+img(p,48)+'<span><b>'+h(p.n)+'</b><small>'+h(p.color)+(i.sz!=='one'?' · EU '+i.sz:'')+' · '+i.q+' '+t('pcs')+'</small>'+(money()?'<small>'+t('costShort')+' '+sum(cost(i.id))+' · '+t('gpShort')+' '+sum(i.p-cost(i.id))+'</small>':'')+'</span><b>'+sum(i.p*i.q)+'</b></div>'}).join('')+
    '<dl class="kv"><dt>'+t('client')+'</dt><dd>'+h(o.cl.n)+' · '+h(o.cl.ph)+'</dd><dt>'+t('recv')+'</dt><dd>'+t('rv_'+(o.recv||'courier'))+(o.slot?', '+o.slot:'')+(o.tryon&&o.recv==='courier'?', '+t('tryDoor').toLowerCase():'')+(o.addr?'<br>'+h(o.addr):'')+'</dd><dt>'+t('payCol')+'</dt><dd>'+h(payName(o.pay))+'</dd>'+(o.gift?'<dt>'+t('giftCol')+'</dt><dd>'+(o.card?'«'+h(o.card)+'»':t('noCard'))+'</dd>':'')+'<dt>'+t('status')+'</dt><dd><span class="pill s'+o.st+'">'+ST(o)+'</span></dd></dl>'+
    (o.st>=0&&o.st<mx?'<button type="button" class="btn" id="oc-next">'+t('toSt'+(o.st+1))+'</button>':'')+
    '<label class="fld"><span>'+t('seller')+'</span><select id="oc-seller"><option value="">'+t('nobody')+'</option>'+SELL.map(function(n){return '<option'+(o.seller===n?' selected':'')+'>'+h(n)+'</option>'}).join('')+'</select></label>'+
    (o.st===3&&!o.exch?'<button type="button" class="btn btn-o" id="oc-ex">'+t('exchange')+'</button>':'')+
    '<h3>'+t('history')+'</h3><ol class="hist">'+hist.map(function(x){return '<li><small>'+dstr(x[0])+' '+tstr(x[0])+'</small>'+h(x[1])+'</li>'}).join('')+PS.log.filter(function(l){return l.v.indexOf(o.no)>=0}).map(function(l){return '<li><small>'+dstr(l.ts)+' '+tstr(l.ts)+' · '+h(l.who)+'</small>'+h(t('log_'+l.k))+'</li>'}).join('')+'</ol>');
  var nx=$('#oc-next',s);if(nx)nx.onclick=function(){var to=o.st+1;if(o.site){var r=S.orders.filter(function(x){return x.no===o.no})[0];r.st=to;r.hist=r.hist||[];r.hist.push({st:to,ts:Date.now()});saveS()}else{PS.ord[o.no]=PS.ord[o.no]||{};PS.ord[o.no].st=to}
    logAdd('st',o.no+': '+t('st'+to));toast(t('stDone',{s:t('st'+to)}));render();orderCard(no)};
  $('#oc-seller',s).onchange=function(){PS.ord[o.no]=PS.ord[o.no]||{};PS.ord[o.no].seller=this.value;o.seller=this.value;logAdd('seller',o.no+': '+this.value)};
  var ex=$('#oc-ex',s);if(ex)ex.onclick=function(){PS.ord[o.no]=PS.ord[o.no]||{};PS.ord[o.no].ex=1;PS.ret[o.no]={kind:'ex',st:'new',ts:Date.now()};logAdd('ex',o.no);toast(t('exDone'));closeSide();R.tab='returns';location.hash='returns'}}
function payName(id){var x=G.pays.filter(function(p){return p.id===id})[0];return x?x.n:id}

/* Примерки: календарь бутика, брони с сайта первыми. */
V.tryon=function(){var all7=tries(),ds=[];for(var i=0;i<7;i++){var x=new Date(START+i*DAY);ds.push(x.getFullYear()+'-'+pad(x.getMonth()+1)+'-'+pad(x.getDate()))}
  if(!R.day||ds.indexOf(R.day)<0){var siteDay=all7.filter(function(b){return b.site&&b.st==='new'})[0];R.day=siteDay&&ds.indexOf(siteDay.day)>=0?siteDay.day:ds[0]}
  var list=all7.filter(function(b){return b.day===R.day}).sort(function(a,b){return (b.site?1:0)-(a.site?1:0)||a.tm.localeCompare(b.tm)}),nw=all7.filter(function(b){return b.site&&b.st==='new'}).length;
  return head('tryon',t('tryonSub'))+(nw?'<p class="flash">'+ic('bell')+t('newTry',{n:nw})+'</p>':'')+
  '<div class="cal" role="tablist">'+ds.map(function(dy,i){var n=all7.filter(function(b){return b.day===dy&&b.st!=='no'}).length,x=new Date(START+i*DAY);return '<button type="button" role="tab" data-day="'+dy+'" aria-selected="'+(dy===R.day)+'"><small>'+G.wd[x.getDay()]+'</small><b>'+x.getDate()+'</b><em>'+n+'</em></button>'}).join('')+'</div>'+
  '<div class="card flat"><div class="tw"><table class="tb tr"><thead><tr><th>'+t('time')+'</th><th>'+t('client')+'</th><th>'+t('model')+'</th><th>'+t('seller')+'</th><th>'+t('status')+'</th><th></th></tr></thead><tbody>'+
  (list.length?list.map(function(b){var p=b.pid?P[b.pid]:null;return '<tr data-tr="'+b.id+'" class="'+(b.site?'site':'')+'"><td><b>'+b.tm+'</b>'+(b.site?'<em class="new">'+t('fromSite')+'</em>':'')+'</td><td>'+h(b.nm)+'<small>'+h(b.ph)+'</small></td><td>'+(p?'<span class="pm">'+img(p,28)+'<span>'+h(p.n)+'<small>'+(b.sz?'EU '+b.sz+' · '+t('inStock')+' '+stock(p,b.sz):'')+'</small></span></span>':t('anyModel'))+'</td><td>'+(b.seller?h(b.seller):t('nobody'))+'</td><td><span class="pill b-'+b.st+'">'+t('bk_'+b.st)+'</span></td><td class="act">'+
    (b.st==='new'?'<button type="button" class="btn btn-s" data-ok="'+b.id+'">'+t('confirmTry')+'</button>':b.st==='ok'?'<button type="button" class="btn btn-s btn-o" data-came="'+b.id+'">'+t('came')+'</button><button type="button" class="lnk sm" data-nocame="'+b.id+'">'+t('noCame')+'</button>':'')+'</td></tr>'}).join(''):'<tr><td colspan="6" class="muted">'+t('noTry')+'</td></tr>')+'</tbody></table></div></div>'};
V.tryon_on=function(){$$('[data-day]').forEach(function(b){b.onclick=function(){R.day=b.getAttribute('data-day');render()}});
  function set(id,st,k){var b=tries().filter(function(x){return x.id===id})[0];if(b.site){var r=S.bookings.filter(function(x){return x.id===id})[0];r.st=st;saveS();PS.tr[id]=PS.tr[id]||{};if(!PS.tr[id].seller)PS.tr[id].seller=SELL[0]}else{PS.tr[id]=PS.tr[id]||{};PS.tr[id].st=st}logAdd(k,id+' '+b.nm);saveP();render()}
  $$('[data-ok]').forEach(function(b){b.onclick=function(){set(b.getAttribute('data-ok'),'ok','try_ok');toast(t('tryOkDone'))}});
  $$('[data-came]').forEach(function(b){b.onclick=function(){set(b.getAttribute('data-came'),'done','try_came')}});
  $$('[data-nocame]').forEach(function(b){b.onclick=function(){set(b.getAttribute('data-nocame'),'no','try_no')}})};

/* Товары и остатки по размерам: правка видна на сайте. */
V.goods=function(){var pro=R.tier==='pro'&&money(),a=calc(30);
  return head('goods',t('goodsSub'))+'<div class="card flat"><div class="tw"><table class="tb gd"><thead><tr><th>'+t('model')+'</th><th class="r">'+t('priceCol')+'</th>'+(pro?'<th class="r">'+t('k_cost')+'</th><th class="r">'+t('k_margin')+'</th>':'')+'<th class="r">'+t('sold30')+'</th><th>'+t('stockBySize')+'</th></tr></thead><tbody>'+
  G.products.map(function(p){var sz=p.sizes||['one'],v=a.byP[p.id];return '<tr><td><span class="pm">'+img(p,32)+'<span>'+h(p.n)+'<small>'+h(p.color)+' · '+h(p.line)+'</small></span></span></td><td class="r">'+sum(p.price)+'</td>'+(pro?'<td class="r">'+sum(cost(p.id))+'</td><td class="r">'+pct(1-p.cs,0)+'</td>':'')+'<td class="r">'+(v?v.q:0)+'</td><td><div class="szg">'+sz.map(function(z){var n=stock(p,z);return '<span class="sg'+(n?n<2?' low':'':' out')+'"><small>'+(z==='one'?t('oneSize'):z)+'</small><button type="button" data-st="'+p.id+':'+z+':-1" aria-label="'+t('less')+'">−</button><b>'+n+'</b><button type="button" data-st="'+p.id+':'+z+':1" aria-label="'+t('more')+'">+</button></span>'}).join('')+'</div></td></tr>'}).join('')+'</tbody></table></div></div>'+(pro?'':(money()&&R.tier==='std'?'<p class="muted sm">'+t('goodsStdN')+'</p>':noMoney()))};
V.goods_on=function(){$$('[data-st]').forEach(function(b){b.onclick=function(){var x=b.getAttribute('data-st').split(':'),p=P[x[0]],n=Math.max(0,stock(p,x[1])+(+x[2]));S.stock[x[0]+':'+x[1]]=n;saveS();logAdd('stock',p.n+(x[1]!=='one'?' EU '+x[1]:'')+': '+n);render()}})};

/* Клиенты. */
V.clients=function(){var q=(R.q||'').toLowerCase(),list=CL.filter(function(c){return !q||c.n.toLowerCase().indexOf(q)>=0||c.ph.indexOf(q)>=0}).slice(0,30);
  return head('clients',t('clientsSub'))+'<input class="srch" id="cq" type="search" placeholder="'+t('searchCl')+'" value="'+h(R.q||'')+'" aria-label="'+t('searchCl')+'">'+
  '<div class="card flat"><div class="tw"><table class="tb"><thead><tr><th>'+t('client')+'</th><th class="r">'+t('purchases')+'</th><th class="r">'+t('spentCol')+'</th><th>'+t('lastBuy')+'</th><th>'+t('sizesCol')+'</th><th>'+t('seller')+'</th></tr></thead><tbody>'+
  list.map(function(c){return '<tr><td>'+h(c.n)+(c.vip?' <span class="vip">VIP</span>':'')+'<small>'+h(c.ph)+'</small></td><td class="r">'+c.orders.length+'</td><td class="r">'+sum(c.spent)+'</td><td>'+(c.last?dstr(c.last):'')+'</td><td>'+[c.szw?'EU '+c.szw:'',c.szm?'EU '+c.szm:''].filter(Boolean).join(', ')+'</td><td>'+h(c.seller)+'</td></tr>'}).join('')+'</tbody></table></div></div>'};
V.clients_on=function(){var i=$('#cq');i.oninput=function(){R.q=i.value;var pos=i.selectionStart;render();var j=$('#cq');j.focus();try{j.setSelectionRange(pos,pos)}catch(e){}}};

/* Подарочные заказы: открытка и упаковка. */
V.gifts=function(){var os=all().filter(function(o){return o.gift&&o.st!==-1}).slice(0,16);
  return head('gifts',t('giftsSub'))+'<div class="gl">'+os.map(function(o){var p=P[o.items[0].id],done=PS.wrap[o.no]||o.st>=1&&!o.site;return '<div class="gc'+(o.site?' site':'')+'">'+img(p,56)+'<div><b>'+o.no+(o.site?' <em class="new">'+t('fromSite')+'</em>':'')+'</b><small>'+dstr(o.ts)+' · '+h(o.cl.n)+' · '+h(p.n)+'</small><p class="card-t">'+(o.card?'«'+h(o.card)+'»':o.site?t('noCard'):'«'+h(pick(G.cards))+'»')+'</p></div>'+(done?'<span class="pill s3">'+t('wrapped')+'</span>':'<button type="button" class="btn btn-s" data-wrap="'+o.no+'">'+t('wrapIt')+'</button>')+'</div>'}).join('')+'</div>'};
V.gifts_on=function(){$$('[data-wrap]').forEach(function(b){b.onclick=function(){PS.wrap[b.getAttribute('data-wrap')]=1;logAdd('wrap',b.getAttribute('data-wrap'));render()}})};

/* Возвраты и обмен размера. */
V.returns=function(){var os=all().filter(function(o){return o.ret||o.exch||PS.ret[o.no]}).slice(0,16);
  return head('returns',t('returnsSub'))+'<div class="card flat"><div class="tw"><table class="tb"><thead><tr><th>№</th><th>'+t('client')+'</th><th>'+t('model')+'</th><th>'+t('kind')+'</th><th>'+t('status')+'</th><th></th></tr></thead><tbody>'+
  os.map(function(o){var p=P[o.items[0].id],x=PS.ret[o.no]||{kind:o.ret?'ret':'ex',st:o.ts<NOW-3*DAY?'done':'new'},to=p.sizes?p.sizes[Math.min(p.sizes.length-1,p.sizes.indexOf(o.items[0].sz)+1)]:null;
    return '<tr><td><b>'+o.no+'</b><small>'+dstr(o.ts)+'</small></td><td>'+h(o.cl.n)+'</td><td>'+h(p.n)+(o.items[0].sz!=='one'?'<small>EU '+o.items[0].sz+(x.kind==='ex'&&to?' → EU '+to:'')+'</small>':'')+'</td><td>'+t(x.kind==='ex'?'kindEx':'kindRet')+'</td><td><span class="pill '+(x.st==='done'?'s3':'s0')+'">'+t(x.st==='done'?'retDone':'retNew')+'</span></td><td class="act">'+(x.st!=='done'?'<button type="button" class="btn btn-s" data-ret="'+o.no+'" data-kind="'+x.kind+'">'+t(x.kind==='ex'?'doEx':'doRet')+'</button>':'')+'</td></tr>'}).join('')+'</tbody></table></div></div><p class="muted sm">'+t('returnsN')+'</p>'};
V.returns_on=function(){$$('[data-ret]').forEach(function(b){b.onclick=function(){var no=b.getAttribute('data-ret');PS.ret[no]={kind:b.getAttribute('data-kind'),st:'done',ts:Date.now()};logAdd(PS.ret[no].kind==='ex'?'exDone':'retDone',no);render()}})};

/* Роли и история действий. */
V.team=function(){var log=PS.log.concat(LOG0).sort(function(a,b){return b.ts-a.ts}).slice(0,40);
  var rows=[[t('r_owner'),1,1,1],[t('r_head'),1,1,1],[t('r_seller'),1,0,0]];
  return head('team',t('teamSub'))+'<section class="card"><h2>'+t('rolesH')+'</h2><div class="tw"><table class="tb"><thead><tr><th>'+t('role')+'</th><th>'+t('seesOrders')+'</th><th>'+t('seesCost')+'</th><th>'+t('seesMoney')+'</th></tr></thead><tbody>'+
  rows.map(function(r){return '<tr><td><b>'+r[0]+'</b></td>'+r.slice(1).map(function(v){return '<td>'+(v?'<span class="yes">'+ic('check')+'</span>':'<span class="no">'+ic('x')+'</span>')+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div></section>'+
  '<section class="card"><h2>'+t('history')+'</h2><ol class="log">'+log.map(function(l){return '<li><small>'+dstr(l.ts)+' '+tstr(l.ts)+'</small><b>'+h(l.who)+'</b><span>'+h(t('log_'+l.k))+(l.v?': '+h(l.v):'')+'</span></li>'}).join('')+'</ol></section>'};

/* Посещаемость и воронка (Расширенная): Instagram отдельно. */
V.traffic=function(){var n=R.days,vis=VIS.slice(-n),tot=vis.reduce(function(s,x){return s+x.n},0),prev=VIS.slice(-2*n,-n).reduce(function(s,x){return s+x.n},0),a=calc(n),orders=a.ok.filter(function(o){return o.ch!=='btq'}).length+S.orders.length;
  var f=[tot,Math.round(tot*.58),Math.round(tot*.071),Math.round(tot*.029),Math.max(orders,1)];
  var src=SRC.map(function(s){return [s.n,Math.round(tot*s.w/100),s.id]});
  var ig=G.igParts.map(function(x){return [x.n,Math.round(tot*SRC[0].w/100*x.w/100)]});
  return head('traffic',t('trafficSub'),periods())+'<div class="kpis">'+kpi(t('visits'),fmt(tot),delta(tot,prev))+kpi(t('fromIg'),fmt(src[0][1]),'',pct(SRC[0].w/100,0))+kpi(t('conv'),pct(f[4]/tot,2))+kpi(t('k_online'),pct(a.online,0))+'</div>'+
  '<div class="cards two"><section class="card"><h2>'+t('sources')+'</h2>'+hbar(src,fmt,'ig')+'</section><section class="card ig"><h2>'+ic('ig')+' Instagram</h2>'+hbar(ig,fmt)+'<p class="muted sm">'+t('igN')+'</p></section></div>'+
  '<section class="card"><h2>'+t('funnel')+'</h2><ol class="fn">'+[t('f1'),t('f2'),t('f3'),t('f4'),t('f5')].map(function(nm,i){return '<li><span>'+nm+'</span><i><b style="transform:scaleX('+(Math.max(.012,f[i]/f[0])).toFixed(3)+')"></b></i><em>'+fmt(f[i])+'</em>'+(i?'<small>'+pct(f[i]/f[i-1],1)+'</small>':'<small></small>')+'</li>'}).join('')+'</ol><p class="muted sm">'+t('funnelN')+'</p></section>'};

/* VIP-клиенты (Расширенная). */
V.vip=function(){var list=CL.filter(function(c){return c.vip}).slice(0,8);
  return head('vip',t('vipSub'))+'<div class="vipg">'+list.map(function(c){var last=c.orders.slice(0,3);return '<article class="vc"><div class="vc-h"><span class="av">'+h(c.n.charAt(0))+'</span><span><b>'+h(c.n)+'</b><small>'+h(c.ph)+' · '+t('seller')+': '+h(c.seller)+'</small></span>'+(money()?'<em>'+mln(c.spent)+'</em>':'')+'</div>'+
    '<dl class="kv"><dt>'+t('sizesCol')+'</dt><dd>'+[c.szw?t('szW')+' EU '+c.szw:'',c.szm?t('szM')+' EU '+c.szm:''].filter(Boolean).join(', ')+'</dd><dt>'+t('likes')+'</dt><dd>'+h(c.like)+'</dd><dt>'+t('bday')+'</dt><dd>'+h(c.bday)+'</dd>'+(c.note?'<dt>'+t('note')+'</dt><dd>'+h(c.note)+'</dd>':'')+'</dl>'+
    '<p class="lbl">'+t('lastBuys')+'</p><ul class="vb">'+last.map(function(o){var p=P[o.items[0].id];return '<li>'+img(p,32)+'<span>'+h(p.n)+'<small>'+dstr(o.ts)+(o.items[0].sz!=='one'?' · EU '+o.items[0].sz:'')+'</small></span></li>'}).join('')+'</ul>'+
    (PS.rem[c.id]?'<p class="ok-l">'+ic('check')+t('remSet',{s:h(c.seller)})+'</p>':'<button type="button" class="btn btn-s btn-o" data-rem="'+c.id+'">'+ic('bell')+t('remind')+'</button>')+'</article>'}).join('')+'</div>'};
V.vip_on=function(){$$('[data-rem]').forEach(function(b){b.onclick=function(){var c=CL.filter(function(x){return x.id===b.getAttribute('data-rem')})[0];PS.rem[c.id]=1;logAdd('rem',c.n+' → '+c.seller);render()}})};

/* Закрытые распродажи (Расширенная). */
V.private=function(){var cur=G.priv,sold=Math.round(cur.ids.length*2.4),inv=CL.length*7;
  return head('private',t('privSub'))+'<div class="cards two"><section class="card"><h2>'+t('privNow')+'</h2><p class="muted">'+t('privNowP',{n:cur.off,d:cur.until})+'</p><div class="kpis sm">'+kpi(t('invited'),fmt(inv))+kpi(t('opened'),fmt(Math.round(inv*.46)))+kpi(t('bought'),fmt(sold))+'</div>'+
  '<ul class="vb">'+cur.ids.map(function(id){var p=P[id];return '<li>'+img(p,32)+'<span>'+h(p.n)+'<small><s>'+sum(p.price)+'</s> '+sum(Math.round(p.price*(1-cur.off/100)/10000)*10000)+'</small></span></li>'}).join('')+'</ul></section>'+
  '<section class="card"><h2>'+t('privNew')+'</h2><p class="lbl">'+t('privModels')+'</p><div class="pv-m">'+G.products.slice(0,14).map(function(p){return '<label class="ck"><input type="checkbox" value="'+p.id+'"><span>'+h(p.n)+'</span></label>'}).join('')+'</div>'+
  '<div class="row2"><label class="fld"><span>'+t('privOff')+'</span><select id="pv-off"><option>20</option><option selected>30</option><option>40</option></select></label><label class="fld"><span>'+t('privWho')+'</span><select id="pv-who"><option>'+t('lv1')+'</option><option>'+t('lv2')+'</option></select></label></div>'+
  '<button type="button" class="btn" id="pv-go">'+t('privGo')+'</button>'+(PS.priv.length?'<ol class="hist">'+PS.priv.map(function(x){return '<li><small>'+dstr(x.ts)+'</small>'+t('privMade',{n:x.n,o:x.off,w:h(x.who)})+'</li>'}).join('')+'</ol>':'')+'</section></div>'};
V.private_on=function(){$('#pv-go').onclick=function(){var ids=$$('.pv-m input:checked').map(function(i){return i.value});if(!ids.length){toast(t('privPick'));return}var x={ts:Date.now(),n:ids.length,off:$('#pv-off').value,who:$('#pv-who').value};PS.priv.unshift(x);logAdd('priv',x.n+' · −'+x.off+'%');toast(t('privStarted'));render()}};

/* Что заканчивается и заказ на новый сезон (Расширенная). */
V.restock=function(){var a=calc(90),low=[],alerts=S.alerts.map(function(x){return {pid:x.pid,sz:x.sz,ph:x.ph,nm:t('fromSite'),ts:x.ts,site:1}}).concat(ALERTS0);
  G.products.forEach(function(p){(p.sizes||['one']).forEach(function(z){var n=stock(p,z);if(n<=1)low.push([p,z,n])})});
  var plan=G.products.map(function(p){var v=a.byP[p.id];return [p,v?v.q:0]}).sort(function(x,y){return y[1]-x[1]}).slice(0,10);
  return head('restock',t('restockSub'))+'<div class="cards two"><section class="card"><h2>'+t('lowH')+' <small>'+low.length+'</small></h2><ul class="vb">'+low.slice(0,12).map(function(x){return '<li>'+img(x[0],32)+'<span>'+h(x[0].n)+'<small>'+(x[1]==='one'?t('oneSize'):'EU '+x[1])+'</small></span><span class="pill '+(x[2]?'s1':'sx')+'">'+(x[2]?t('left1'):t('left0'))+'</span></li>'}).join('')+'</ul></section>'+
  '<section class="card"><h2>'+t('waitH')+' <small>'+alerts.length+'</small></h2><ul class="vb">'+alerts.slice(0,10).map(function(x){var p=P[x.pid];return p?'<li class="'+(x.site?'site':'')+'">'+img(p,32)+'<span>'+h(p.n)+'<small>'+(x.sz==='one'?'':'EU '+x.sz+' · ')+h(x.nm)+' · '+h(x.ph)+'</small></span>'+(x.site?'<em class="new">'+t('fromSite')+'</em>':'')+'</li>':''}).join('')+'</ul></section></div>'+
  '<section class="card"><h2>'+t('seasonH')+'</h2><p class="muted">'+t('seasonP')+'</p><div class="tw"><table class="tb"><thead><tr><th>'+t('model')+'</th><th class="r">'+t('sold90')+'</th><th>'+t('suggest')+'</th></tr></thead><tbody>'+
  plan.map(function(x){var p=x[0],q=Math.max(2,Math.round(x[1]*1.15)),sz=p.sizes||['one'],mid=(sz.length-1)/2,ws=sz.map(function(z,i){return 1/(1+Math.abs(i-mid))}),wt=ws.reduce(function(s,v){return s+v},0);
    return '<tr><td><span class="pm">'+img(p,28)+'<span>'+h(p.n)+'<small>'+h(p.line)+'</small></span></span></td><td class="r">'+x[1]+'</td><td><div class="szg">'+sz.map(function(z,i){return '<span class="sg plan"><small>'+(z==='one'?t('oneSize'):z)+'</small><b>'+Math.max(0,Math.round(q*ws[i]/wt))+'</b></span>'}).join('')+'</div></td></tr>'}).join('')+'</tbody></table></div><button type="button" class="btn" id="ss-copy">'+t('copyOrder')+'</button></section>'};
V.restock_on=function(){$('#ss-copy').onclick=function(){var txt=$$('.tb tbody tr',pv).map(function(tr){return tr.innerText.replace(/\s+/g,' ').trim()}).join('\n');try{navigator.clipboard.writeText(txt)}catch(e){}logAdd('season','');toast(t('copied'))}};

/* Продажи по продавцам (Расширенная). */
V.sellers=function(){var a=calc(R.days),tr=tries(),rows=SELL.map(function(n){var os=a.ok.filter(function(o){return o.seller===n}),rev=os.reduce(function(s,o){return s+o.total},0),tt=tr.filter(function(b){return b.seller===n&&b.st==='done'}).length;return {n:n,c:os.length,rev:rev,avg:rev/Math.max(1,os.length),tr:tt,vip:CL.filter(function(c){return c.vip&&c.seller===n}).length}}).sort(function(x,y){return y.rev-x.rev});
  if(!money())rows=rows.filter(function(r){return r.n===SELL[0]});
  return head('sellers',money()?t('sellersSub'):t('sellersSelf'),periods())+'<div class="card flat"><div class="tw"><table class="tb"><thead><tr><th>'+t('seller')+'</th><th class="r">'+t('salesN')+'</th><th class="r">'+t('k_rev')+'</th><th class="r">'+t('k_avg')+'</th><th class="r">'+t('tries')+'</th><th class="r">VIP</th></tr></thead><tbody>'+
  rows.map(function(r,i){return '<tr><td><b>'+(money()?(i+1)+'. ':'')+h(r.n)+'</b></td><td class="r">'+r.c+'</td><td class="r">'+mln(r.rev)+'</td><td class="r">'+sum(r.avg)+'</td><td class="r">'+r.tr+'</td><td class="r">'+r.vip+'</td></tr>'}).join('')+'</tbody></table></div></div>'+(money()?hbar(rows.map(function(r){return [r.n,r.rev]}),mln):'')};

/* Раздел не входит в «Панель магазина». */
function locked(k){return head(k)+'<div class="lock-v">'+ic('lock')+'<h2>'+t('lockH')+'</h2><p>'+t('lockP_'+k)+'</p><button type="button" class="btn" id="to-pro">'+t('toPro')+'</button><p class="muted sm">'+t('lockN')+'</p></div>'}

/* ── Навигация ─────────────────────────────────────────────────────────── */
var toastT=0;function toast(m){var el=$('#toast');el.textContent=m;el.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){el.classList.remove('on')},2600)}
function counts(){var o=S.orders.filter(function(x){return x.st===0}).length,b=S.bookings.filter(function(x){return x.st==='new'}).length;
  var a=$('[data-cnt="orders"]'),c=$('[data-cnt="tryon"]');if(a){a.textContent=o;a.hidden=!o}if(c){c.textContent=b;c.hidden=!b}}
function render(){var k=(location.hash||'').slice(1);if(!V[k])k=R.tier==='pro'?'dash':'orders';R.tab=k;
  $$('.nav a').forEach(function(a){var x=a.getAttribute('href').slice(1);if(x===k)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');a.classList.toggle('off',!opens(x))});
  pv.innerHTML=opens(k)?V[k]():locked(k);
  if(opens(k)&&V[k+'_on'])V[k+'_on']();var tp=$('#to-pro');if(tp)tp.onclick=function(){setTier('pro')};
  $$('[data-days]',pv).forEach(function(b){b.onclick=function(){R.days=+b.getAttribute('data-days');render()}});wireTips(pv);counts();
  d.body.classList.remove('nav-on');d.body.setAttribute('data-tier',R.tier);d.body.setAttribute('data-role',R.role)}
function setTier(x){R.tier=x;PS.tier=x;saveP();$$('[data-tier]').forEach(function(b){b.setAttribute('aria-checked',b.getAttribute('data-tier')===x)});logAdd('tier',t(x==='pro'?'tierPro':'tierStd'));render()}
$$('[data-tier]').forEach(function(b){b.setAttribute('aria-checked',b.getAttribute('data-tier')===R.tier);b.onclick=function(){setTier(b.getAttribute('data-tier'))}});
var rs=$('#role');rs.value=R.role;rs.onchange=function(){R.role=rs.value;PS.role=R.role;saveP();render()};
$('#menu-b').onclick=function(){d.body.classList.toggle('nav-on')};
addEventListener('hashchange',function(){closeSide();render();scrollTo(0,0)});
render();
})();
