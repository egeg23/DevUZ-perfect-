(function(){
'use strict';
/* panel: панель магазина Greenwell. Сводка владельца, заказы с историей,
   отзывы, товары и прибыль от себестоимости, доставка, рассрочка,
   посещаемость с воронкой, журнал менеджеров. Цифры — демо: собираются
   из одного зерна, поэтому сходятся между экранами. Заказ и отзыв из
   магазина (gw-demo-1) приходят сюда первой строкой, смена статуса здесь
   видна покупателю. */
var d=document,W=window,G=JSON.parse(d.getElementById('gp-data').textContent),U=G.ui,L=G.lang,IMG=G.img,P={};
G.products.forEach(function(p){P[p.id]=p});
var REDUCED=false;try{REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
if(/[?&]embed=1/.test(location.search))d.documentElement.classList.add('embed');
var $=function(s,r){return (r||d).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))};
function t(k,v){var s=U[k];if(s==null)return k;if(v)for(var x in v)s=s.split('{'+x+'}').join(v[x]);return s}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function mln(n){return (n/1e6).toFixed(n>=1e8?0:1).replace('.',',')+' '+t('mln')}
function sum(n){return fmt(n)+' '+t('sum')}
function pct(x,dg){return (x*100).toFixed(dg==null?1:dg).replace('.',',')+'%'}
function ic(k){return '<svg class="ic" aria-hidden="true"><use href="#i-'+k+'"/></svg>'}
function pad(n){return (n<10?'0':'')+n}
function dstr(ts){var x=new Date(ts);return pad(x.getDate())+'.'+pad(x.getMonth()+1)}
function tstr(ts){var x=new Date(ts);return pad(x.getHours())+':'+pad(x.getMinutes())}
function dur(min){if(min<60)return Math.round(min)+' '+t('min');var hh=Math.floor(min/60),m=Math.round(min%60);return hh+' '+t('h')+(m?' '+m+' '+t('min'):'')}

/* ── Демо-данные из одного зерна ─────────────────────────────────────── */
var zr=20261015;function rnd(){zr=(zr*1664525+1013904223)>>>0;return zr/4294967296}
function pick(a,w){var s=0,i;if(!w){return a[Math.floor(rnd()*a.length)]}var tot=w.reduce(function(x,y){return x+y},0),r=rnd()*tot;for(i=0;i<a.length;i++){s+=w[i];if(r<s)return a[i]}return a[a.length-1]}
var NOW=Date.now(),DAY=864e5,START=new Date(new Date(NOW).setHours(0,0,0,0)).getTime();
var popW=G.products.map(function(p){return parseInt(p.orders)||100});
var PAYW={click:28,payme:24,uzumbank:14,card:8,cash:10,nasiya:16};
var SRC=G.sources;
var ORD=[],n0=10480;
for(var day=89;day>=0;day--){var base=START-day*DAY,wk=new Date(base).getDay(),cnt=Math.round((11+rnd()*6)*(wk===0?.8:wk===6?.9:1)*(1+(89-day)/89*.18));if(day===0)cnt=Math.round(cnt*Math.min(1,(NOW-START)/DAY+.15));
  for(var k=0;k<cnt;k++){var ts=base+(8+Math.pow(rnd(),.8)*15)*36e5;if(ts>NOW-30*6e4)continue;var items=[],m=pick([1,2,3],[58,30,12]);
    for(var j=0;j<m;j++){var p=pick(G.products,popW);if(items.some(function(x){return x.id===p.id}))continue;items.push({id:p.id,q:pick([1,1,1,2,3]),p:p.price})}
    var goods=items.reduce(function(s,x){return s+x.p*x.q},0),pay=pick(Object.keys(PAYW),Object.keys(PAYW).map(function(x){return PAYW[x]}));
    if(pay==='nasiya'&&goods<300000)items[0].q+=1,goods+=items[0].p;
    var age=(NOW-ts)/36e5,asm=18+Math.pow(rnd(),1.6)*170,del=asm+120+Math.pow(rnd(),1.3)*(rnd()<.12?1500:700);
    var st=age*60<asm?0:age*60<asm+40?1:age*60<del?2:3,ret=st===3&&rnd()<.022,canc=rnd()<.028;
    var deliv=goods>=G.shop.freeFrom?0:G.shop.delivery,disc=rnd()<.18?Math.round(goods*.1):0,pts=rnd()<.22?Math.min(30000,Math.round(goods*.1/1000)*1000):0;
    ORD.push({no:'GW-'+(n0--),ts:ts,items:items,goods:goods,disc:disc,pts:pts,deliv:deliv,total:goods-disc-pts+deliv,pay:pay,nas:pay==='nasiya'?pick(G.nasiya.map(function(x){return x.id}),[50,35,15]):null,
      st:canc?-1:ret?4:st,asm:asm,del:del,late:del>840,cour:pick(G.couriers),mgr:pick(G.managers,[45,35,20]),dist:pick(G.districts,[18,14,12,10,10,9,8,7,6,6]),src:pick(SRC.map(function(s){return s.id}),SRC.map(function(s){return s.w})),cl:pick(G.clients),demo:1})}}
ORD.sort(function(a,b){return b.ts-a.ts});
/* Заказы и отзывы из магазина: та же память браузера. */
var KEY='gw-demo-1',PK='gw-panel-1',S={},PS={};
function load(){try{S=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){S={}}try{PS=JSON.parse(localStorage.getItem(PK)||'{}')||{}}catch(e){PS={}}PS.log=PS.log||[];PS.cost=PS.cost||{};PS.rv=PS.rv||{};PS.ord=PS.ord||{};PS.notes=PS.notes||{}}
function saveS(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function saveP(){try{localStorage.setItem(PK,JSON.stringify(PS))}catch(e){}}
load();
function live(){return (S.orders||[]).map(function(o){return {no:o.no,ts:o.ts,items:o.items,goods:o.T.goods,disc:o.T.promo,pts:o.T.pts,deliv:o.T.deliv,total:o.T.total,pay:o.pay,nas:o.nas?o.nas.p:null,st:o.st,asm:null,del:null,cour:G.couriers[0],mgr:G.managers[0],dist:o.recv&&o.recv.dist||'',src:'direct',cl:{n:(o.user&&o.user.name)||t('fromSite'),ph:o.user&&o.user.phone||''},site:1,ref:o,recv:o.recv}})}
function all(){return live().concat(ORD.map(function(o){var x=PS.ord[o.no];if(x){o.st=x.st;o.cour=x.cour||o.cour}return o}))}
var COST=function(id){return PS.cost[id]!=null?PS.cost[id]:Math.round(P[id].price*G.costShare[id]/1000)*1000};
var LOG0=[];(function(){var acts=G.logActs,o=ORD.slice(0,60);for(var i=0;i<34;i++){var a=pick(acts),x=o[Math.floor(rnd()*o.length)];LOG0.push({ts:NOW-(i*47+rnd()*40)*6e4,who:a.who==='c'?x.cour:pick(G.managers),k:a.k,o:x.no,v:a.v?pick(a.v):''})}})();
function logAdd(k,o,v){PS.log.unshift({ts:Date.now(),who:G.me,k:k,o:o,v:v||''});saveP()}

/* ── Расчёты за период ────────────────────────────────────────────────── */
var R={days:30,role:PS.role||'owner',tab:'dash'};
function inP(o,days,shift){var a=NOW-(days*(shift?2:1))*DAY,b=NOW-(shift?days*DAY:0);return o.ts>a&&o.ts<=b}
function calc(days,shift){var os=all().filter(function(o){return inP(o,days,shift)}),ok=os.filter(function(o){return o.st!==-1&&o.st!==4}),rev=0,cost=0,ret=0,n=ok.length,nas=0,nasSum=0,byP={},byC={};
  ok.forEach(function(o){rev+=o.total-o.deliv;o.items.forEach(function(i){var c=COST(i.id)*i.q;cost+=c;var x=byP[i.id]=byP[i.id]||{q:0,rev:0,cost:0};x.q+=i.q;x.rev+=i.p*i.q*(1-(o.disc+o.pts)/Math.max(1,o.goods));x.cost+=c});if(o.pay==='nasiya'){nas++;nasSum+=o.total}});
  os.forEach(function(o){if(o.st===4)ret+=o.total});
  G.products.forEach(function(p){var x=byP[p.id];if(!x)return;var c=byC[p.cat]=byC[p.cat]||{rev:0,cost:0};c.rev+=x.rev;c.cost+=x.cost});
  var done=ok.filter(function(o){return o.st===3&&o.asm});
  var asm=med(done.map(function(o){return o.asm})),del=med(done.map(function(o){return o.del})),late=done.filter(function(o){return o.late}).length/Math.max(1,done.length);
  return {os:os,ok:ok,n:n,rev:rev,cost:cost,gp:rev-cost,margin:(rev-cost)/Math.max(1,rev),avg:rev/Math.max(1,n),ret:ret,retN:os.filter(function(o){return o.st===4}).length,canc:os.filter(function(o){return o.st===-1}).length,nas:nas/Math.max(1,n),nasSum:nasSum,byP:byP,byC:byC,asm:asm,del:del,late:late,done:done}}
function med(a){if(!a.length)return 0;a=a.slice().sort(function(x,y){return x-y});return a[Math.floor(a.length/2)]}
function delta(a,b,inv){if(!b)return '';var x=(a-b)/b,up=x>=0,good=inv?!up:up;return '<span class="dl '+(good?'up':'down')+'">'+(up?'↑':'↓')+' '+pct(Math.abs(x),1)+'</span>'}
function kpi(label,val,dl,note,own){return '<div class="kpi'+(own?' own':'')+'"><small>'+label+'</small><b>'+val+'</b><span>'+(dl||'')+(note?'<em>'+note+'</em>':'')+'</span></div>'}

/* ── Графики: SVG кодом ───────────────────────────────────────────────── */
function series(days,fn){var out=[];for(var i=days-1;i>=0;i--){var a=START-i*DAY,b=a+DAY;out.push(fn(a,b,i))}return out}
function line(sets,opts){opts=opts||{};var w=640,hh=opts.h||200,pl=44,pb=22,pt=10,n=sets[0].v.length,mx=0;sets.forEach(function(s){s.v.forEach(function(v){if(v>mx)mx=v})});mx=nice(mx);
  var x=function(i){return pl+(w-pl-8)*i/Math.max(1,n-1)},y=function(v){return pt+(hh-pt-pb)*(1-v/mx)};
  var g='';for(var k=0;k<=4;k++){var vy=y(mx*k/4);g+='<line x1="'+pl+'" x2="'+w+'" y1="'+vy+'" y2="'+vy+'" class="gl"/><text x="'+(pl-6)+'" y="'+(vy+4)+'" class="ax" text-anchor="end">'+short(mx*k/4)+'</text>'}
  var lab='';var step=Math.ceil(n/6);for(var i=0;i<n;i+=step)lab+='<text x="'+x(i)+'" y="'+(hh-4)+'" class="ax" text-anchor="middle">'+opts.lab[i]+'</text>';
  var paths=sets.map(function(s,si){var dd=s.v.map(function(v,i){return (i?'L':'M')+x(i).toFixed(1)+' '+y(v).toFixed(1)}).join(' ');return (si===0&&opts.area?'<path d="'+dd+' L'+x(n-1)+' '+y(0)+' L'+x(0)+' '+y(0)+'Z" class="area"/>':'')+'<path d="'+dd+'" class="ln" style="--c:'+s.c+'"/>'}).join('');
  var dots=sets.map(function(s){return s.v.map(function(v,i){return '<circle cx="'+x(i).toFixed(1)+'" cy="'+y(v).toFixed(1)+'" r="3" class="pt" style="--c:'+s.c+'"><title>'+opts.lab[i]+': '+fmt(v)+'</title></circle>'}).join('')}).join('');
  return '<svg class="chart" viewBox="0 0 '+w+' '+hh+'" role="img" aria-label="'+h(opts.aria||'')+'">'+g+paths+(n<=31?dots:'')+lab+'</svg>'+(sets.length>1?'<p class="lg">'+sets.map(function(s){return '<span style="--c:'+s.c+'"><i></i>'+s.n+'</span>'}).join('')+'</p>':'')}
function bars(v,opts){var w=640,hh=opts.h||160,pl=36,pb=22,n=v.length,mx=nice(Math.max.apply(null,v)),bw=(w-pl)/n;
  var s='';v.forEach(function(x,i){var bh=(hh-pb-8)*x/mx;s+='<rect x="'+(pl+i*bw+bw*.18).toFixed(1)+'" y="'+(hh-pb-bh).toFixed(1)+'" width="'+(bw*.64).toFixed(1)+'" height="'+bh.toFixed(1)+'" rx="3" class="br"><title>'+opts.lab[i]+': '+fmt(x)+'</title></rect>'});
  var lab='',step=Math.ceil(n/7);for(var i=0;i<n;i+=step)lab+='<text x="'+(pl+i*bw+bw/2)+'" y="'+(hh-4)+'" class="ax" text-anchor="middle">'+opts.lab[i]+'</text>';
  return '<svg class="chart" viewBox="0 0 '+w+' '+hh+'" role="img" aria-label="'+h(opts.aria||'')+'"><line x1="'+pl+'" x2="'+w+'" y1="'+(hh-pb)+'" y2="'+(hh-pb)+'" class="gl"/><text x="'+(pl-6)+'" y="14" class="ax" text-anchor="end">'+short(mx)+'</text>'+s+lab+'</svg>'}
function hbars(rows,fmtv){var mx=Math.max.apply(null,rows.map(function(r){return r.v}));return '<ul class="hb">'+rows.map(function(r){return '<li><span class="hb-n">'+r.n+'</span><span class="hb-t"><i style="--k:'+(r.v/mx).toFixed(3)+';--c:'+(r.c||'var(--g3)')+'"></i></span><b>'+(fmtv?fmtv(r.v,r):fmt(r.v))+'</b>'+(r.s?'<small>'+r.s+'</small>':'')+'</li>'}).join('')+'</ul>'}
function nice(x){if(x<=0)return 1;var e=Math.pow(10,Math.floor(Math.log10(x))),f=x/e;return (f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*e}
function short(v){return v>=1e6?(v/1e6).toFixed(v>=1e7?0:1).replace('.',',')+t('m'):v>=1e3?Math.round(v/1e3)+t('k'):Math.round(v)}

/* ── Экраны ───────────────────────────────────────────────────────────── */
var V={},main=$('#pv');
function card(title,body,cls,extra){return '<section class="cd '+(cls||'')+'"><header><h2>'+title+'</h2>'+(extra||'')+'</header>'+body+'</section>'}
function per(){return '<div class="per" role="radiogroup" aria-label="'+t('period')+'">'+[7,30,90].map(function(x){return '<button type="button" role="radio" aria-checked="'+(R.days===x)+'" data-per="'+x+'">'+t('d'+x)+'</button>'}).join('')+'</div>'}
function own(){return R.role==='owner'}

V.dash=function(){var c=calc(R.days),p=calc(R.days,true),dd=Math.min(R.days,30);
  var lab=series(dd,function(a){return dstr(a)}),rv=series(dd,function(a,b){var s=0;all().forEach(function(o){if(o.ts>=a&&o.ts<b&&o.st!==-1&&o.st!==4)s+=o.total-o.deliv});return s}),gp=series(dd,function(a,b){var s=0;all().forEach(function(o){if(o.ts>=a&&o.ts<b&&o.st!==-1&&o.st!==4){s+=o.total-o.deliv;o.items.forEach(function(i){s-=COST(i.id)*i.q})}});return s});
  var top=Object.keys(c.byP).map(function(id){var x=c.byP[id];return {id:id,q:x.q,rev:x.rev,gp:x.rev-x.cost,m:(x.rev-x.cost)/x.rev}}).sort(function(a,b){return b.gp-a.gp});
  var low=G.products.map(function(p){var sold=c.byP[p.id]?c.byP[p.id].q/R.days:0;return {p:p,st:G.stock[p.id],days:sold?G.stock[p.id]/sold:999}}).sort(function(a,b){return a.days-b.days}).slice(0,4);
  var newO=all().filter(function(o){return o.st===0}).length,newR=reviews().filter(function(r){return r.st==='new'}).length;
  return '<div class="ph"><div><h1>'+t('dashH')+'</h1><p class="muted">'+t('dashS')+'</p></div>'+per()+'</div>'+
  '<div class="alerts">'+(newO?'<a href="#orders?st=0" class="al">'+ic('box')+'<span>'+t('alNew',{n:newO})+'</span></a>':'')+(newR?'<a href="#reviews" class="al">'+ic('star')+'<span>'+t('alRev',{n:newR})+'</span></a>':'')+(low[0].days<10?'<a href="#goods" class="al warn">'+ic('alert')+'<span>'+t('alStock',{p:h(low[0].p.n),n:Math.round(low[0].days)})+'</span></a>':'')+'</div>'+
  '<div class="kpis">'+kpi(t('revenue'),mln(c.rev),delta(c.rev,p.rev),t('vsPrev'))+kpi(t('gp'),mln(c.gp),delta(c.gp,p.gp),t('margin')+' '+pct(c.margin,0),1)+kpi(t('orders'),fmt(c.n),delta(c.n,p.n))+kpi(t('avg'),fmt(c.avg/1000)+t('k')+'\u00a0'+t('sum'),delta(c.avg,p.avg))+kpi(t('nasShare'),pct(c.nas,0),delta(c.nas,p.nas),sum(c.nasSum))+kpi(t('returns'),mln(c.ret),delta(c.ret,p.ret,true),c.retN+' '+t('pcs'))+'</div>'+
  '<div class="cols">'+card(t('revGp'),line(own()?[{n:t('revenue'),v:rv,c:'var(--g3)'},{n:t('gp'),v:gp,c:'var(--gold)'}]:[{n:t('revenue'),v:rv,c:'var(--g3)'}],{lab:lab,area:1,aria:t('revGp')}),'w2')+
  card(t('logi'),'<div class="mk"><div><small>'+t('toAsm')+'</small><b>'+dur(c.asm)+'</b></div><div><small>'+t('toDel')+'</small><b>'+dur(c.del)+'</b></div><div><small>'+t('late')+'</small><b class="'+(c.late>.1?'bad':'')+'">'+pct(c.late,0)+'</b></div></div>'+hbars(G.couriers.map(function(cr){var my=c.done.filter(function(o){return o.cour===cr});return {n:h(cr),v:my.length,s:dur(med(my.map(function(o){return o.del})))}}))+'<a class="more" href="#logistics">'+t('more')+ic('chev')+'</a>')+'</div>'+
  '<div class="cols">'+card(t('topProfit'),'<table class="tb"><thead><tr><th>'+t('good')+'</th><th class="r">'+t('sold')+'</th><th class="r">'+t('revenue')+'</th>'+(own()?'<th class="r">'+t('gp')+'</th><th class="r">'+t('margin')+'</th>':'')+'</tr></thead><tbody>'+top.slice(0,6).map(function(x){return '<tr><td><span class="pr"><img src="'+IMG+'/p-'+x.id+'-s.webp" alt="" width="20" height="38">'+h(P[x.id].n)+'</span></td><td class="r">'+fmt(x.q)+'</td><td class="r">'+mln(x.rev)+'</td>'+(own()?'<td class="r">'+mln(x.gp)+'</td><td class="r"><span class="mg" style="--k:'+x.m.toFixed(3)+'">'+pct(x.m,0)+'</span></td>':'')+'</tr>'}).join('')+'</tbody></table><a class="more" href="#goods">'+t('allGoods')+ic('chev')+'</a>','w2')+
  card(t('stockLow'),'<ul class="stk">'+low.map(function(x){return '<li><img src="'+IMG+'/p-'+x.p.id+'-s.webp" alt="" width="22" height="42"><span><b>'+h(x.p.n)+'</b><small>'+t('left',{n:x.st})+'</small></span><em class="'+(x.days<10?'bad':x.days<21?'warn':'')+'">'+(x.days>=999?'∞':t('daysLeft',{n:Math.round(x.days)}))+'</em></li>'}).join('')+'</ul>')+'</div>'+
  '<div class="cols">'+card(t('byCat'),own()?hbars(G.cats.map(function(cat){var x=c.byC[cat.id]||{rev:0,cost:0};return {n:h(cat.n),v:x.rev,s:t('margin')+' '+pct((x.rev-x.cost)/Math.max(1,x.rev),0)}}).sort(function(a,b){return b.v-a.v}),mln):hbars(G.cats.map(function(cat){var x=c.byC[cat.id]||{rev:0};return {n:h(cat.n),v:x.rev}}).sort(function(a,b){return b.v-a.v}),mln))+
  card(t('funnel'),funnel(R.days,true)+'<a class="more" href="#traffic">'+t('trafficH')+ic('chev')+'</a>','w2')+'</div>'+
  '<p class="demo">'+t('demoNote')+'</p>'};

function visits(days){var out=[];for(var i=days-1;i>=0;i--){var wk=new Date(START-i*DAY).getDay(),v=Math.round((1500+((i*7919)%400))*(wk===0?.82:wk===6?.9:1)*(1+(89-i)/89*.15));out.push(v)}return out}
function funnel(days,mini){var vs=visits(days).reduce(function(a,b){return a+b},0),c=calc(days),paid=c.n+c.canc,recv=c.ok.filter(function(o){return o.st===3}).length;
  var st=[[t('f1'),vs],[t('f2'),Math.round(vs*.47)],[t('f3'),Math.round(vs*.108)],[t('f4'),Math.round(vs*.046)],[t('f5'),paid],[t('f6'),recv]];
  var worst=1,wk=0;for(var i=1;i<st.length;i++){var r=st[i][1]/st[i-1][1];if(r<worst&&i<5){worst=r;wk=i}}
  return '<ol class="fn">'+st.map(function(s,i){var share=s[1]/st[0][1],step=i?s[1]/st[i-1][1]:1;return '<li'+(i===wk?' class="lose"':'')+'><span class="fn-n">'+s[0]+'</span><span class="fn-t"><i style="--k:'+Math.max(.02,Math.sqrt(share)).toFixed(3)+'"></i></span><b>'+fmt(s[1])+'</b><small>'+(i?pct(step,0)+' '+t('ofPrev'):'100%')+'</small>'+(i===wk?'<em>'+t('loseHere',{n:pct(1-step,0)})+'</em>':'')+'</li>'}).join('')+'</ol>'+(mini?'':'<p class="tip">'+ic('alert')+'<span>'+t('loseTip'+wk)+'</span></p>')}

/* Заказы */
var OF={st:'all',q:'',pay:'all'};
function stName(s){return s===-1?t('canc'):s===4?t('ret'):t('st'+s)}
V.orders=function(q){if(q&&q.st!=null)OF.st=q.st;var list=all().filter(function(o){return (OF.st==='all'||String(o.st)===String(OF.st))&&(OF.pay==='all'||o.pay===OF.pay)&&(!OF.q||(o.no+' '+o.cl.n+' '+o.cl.ph).toLowerCase().indexOf(OF.q.toLowerCase())>=0)});
  var cnt={};all().forEach(function(o){cnt[o.st]=(cnt[o.st]||0)+1});
  return '<div class="ph"><div><h1>'+t('ordersH')+'</h1><p class="muted">'+t('ordersS')+'</p></div></div>'+
  '<div class="flt"><div class="seg2">'+[['all',t('allSt')],['0',t('st0')],['1',t('st1')],['2',t('st2')],['3',t('st3')],['4',t('ret')],['-1',t('canc')]].map(function(x){return '<button type="button" data-st="'+x[0]+'" class="'+(String(OF.st)===x[0]?'on':'')+'">'+x[1]+(x[0]!=='all'?' <i>'+(cnt[x[0]]||0)+'</i>':'')+'</button>'}).join('')+'</div>'+
  '<div class="srch">'+ic('search')+'<input id="oq" placeholder="'+t('oSearch')+'" value="'+h(OF.q)+'"></div><select id="opay" aria-label="'+t('payW')+'"><option value="all">'+t('allPay')+'</option>'+G.pays.map(function(p){return '<option value="'+p.id+'"'+(OF.pay===p.id?' selected':'')+'>'+h(p.n)+'</option>'}).join('')+'</select></div>'+
  '<div class="cd tbw"><table class="tb ord"><thead><tr><th>'+t('no')+'</th><th>'+t('when')+'</th><th>'+t('client')+'</th><th>'+t('goodsW')+'</th><th class="r">'+t('sumW')+'</th><th>'+t('payW')+'</th><th>'+t('status')+'</th></tr></thead><tbody>'+
  list.slice(0,60).map(function(o){return '<tr data-o="'+o.no+'" tabindex="0"'+(o.site?' class="site"':'')+'><td><b>'+o.no+'</b>'+(o.site?'<span class="nw">'+t('fromSite')+'</span>':'')+'</td><td>'+dstr(o.ts)+' '+tstr(o.ts)+'</td><td>'+h(o.cl.n)+'<small>'+h(o.cl.ph)+'</small></td><td><span class="thumbs">'+o.items.map(function(i){return '<img src="'+IMG+'/p-'+i.id+'-s.webp" alt="'+h(P[i.id].n)+'" width="16" height="30">'}).join('')+'</span></td><td class="r">'+fmt(o.total)+'</td><td>'+payN(o)+'</td><td><span class="sb s'+o.st+'">'+stName(o.st)+'</span></td></tr>'}).join('')+'</tbody></table>'+(list.length?'':'<p class="empty">'+t('noOrders')+'</p>')+'</div><p class="demo">'+t('shown',{n:Math.min(60,list.length),m:list.length})+'</p>'};
function payN(o){if(o.pay==='nasiya'){var n=G.nasiya.filter(function(x){return x.id===o.nas})[0];return '<span class="nb" style="--c:'+(n?n.c:'#888')+'">'+h(n?n.n:t('nas'))+'</span>'}var p=G.pays.filter(function(x){return x.id===o.pay})[0];return p?h(p.n):''}
V.orders_on=function(){$$('[data-st]').forEach(function(b){b.onclick=function(){OF.st=b.getAttribute('data-st');draw()}});
  var q=$('#oq');q.oninput=function(){OF.q=q.value;var pos=q.selectionStart;draw();var q2=$('#oq');q2.focus();q2.setSelectionRange(pos,pos)};
  $('#opay').onchange=function(){OF.pay=this.value;draw()};
  $$('tr[data-o]').forEach(function(r){r.onclick=function(){orderCard(r.getAttribute('data-o'))};r.onkeydown=function(e){if(e.key==='Enter')orderCard(r.getAttribute('data-o'))}})};
function orderCard(no){var o=all().filter(function(x){return x.no===no})[0];if(!o)return;
  var steps=[[t('st0'),o.ts,o.site?t('fromSite'):t('srcW')+': '+srcName(o.src)],[t('st1'),o.asm!=null?o.ts+o.asm*6e4:null,o.mgr],[t('st2'),o.asm!=null?o.ts+(o.asm+25)*6e4:null,o.cour],[t('st3'),o.del!=null?o.ts+o.del*6e4:null,o.cour]];
  var hist=PS.log.filter(function(l){return l.o===no}).concat(o.site?[]:LOG0.filter(function(l){return l.o===no}));
  var costSum=o.items.reduce(function(s,i){return s+COST(i.id)*i.q},0);
  side('<div class="oc"><header><div><h2>'+o.no+'</h2><small>'+dstr(o.ts)+', '+tstr(o.ts)+(o.site?' · '+t('fromSite'):'')+'</small></div><span class="sb s'+o.st+'">'+stName(o.st)+'</span></header>'+
  (o.st>=0&&o.st<3?'<div class="oc-act"><button type="button" class="btn btn-g" id="oc-next">'+ic('check')+t('toSt'+(o.st+1))+'</button><select id="oc-cour" aria-label="'+t('courier')+'">'+G.couriers.map(function(c){return '<option'+(c===o.cour?' selected':'')+'>'+h(c)+'</option>'}).join('')+'</select></div>':'')+
  '<ol class="tl">'+steps.map(function(s,i){var done=o.st>=i&&o.st<4;return '<li class="'+(done?'done':'')+'"><i></i><span><b>'+s[0]+'</b><small>'+(done&&s[1]?dstr(s[1])+', '+tstr(s[1])+' · ':'')+h(s[2]||'')+'</small></span></li>'}).join('')+'</ol>'+
  '<h3>'+t('goodsW')+'</h3><ul class="oi">'+o.items.map(function(i){var c=COST(i.id);return '<li><img src="'+IMG+'/p-'+i.id+'-s.webp" alt="" width="24" height="46"><span>'+h(P[i.id].n)+' <small>× '+i.q+'</small></span><b>'+fmt(i.p*i.q)+'</b>'+(own()?'<small class="cst">'+t('costW')+' '+fmt(c*i.q)+'</small>':'')+'</li>'}).join('')+'</ul>'+
  '<dl class="ol"><div><dt>'+t('client')+'</dt><dd>'+h(o.cl.n)+'<br><small>'+h(o.cl.ph)+'</small></dd></div><div><dt>'+t('addrW')+'</dt><dd>'+(o.recv?(o.recv.t==='pickup'?h(o.recv.p):h(o.recv.a)+(o.recv.lm?'<br><small>'+h(o.recv.lm)+'</small>':'')):h(o.dist))+'</dd></div><div><dt>'+t('payW')+'</dt><dd>'+payN(o)+'</dd></div>'+
  (o.disc?'<div><dt>'+t('discW')+'</dt><dd>−'+fmt(o.disc)+'</dd></div>':'')+(o.pts?'<div><dt>'+t('ptsW')+'</dt><dd>−'+fmt(o.pts)+'</dd></div>':'')+'<div><dt>'+t('delW')+'</dt><dd>'+fmt(o.deliv)+'</dd></div><div class="tot"><dt>'+t('total')+'</dt><dd>'+sum(o.total)+'</dd></div>'+(own()?'<div class="own"><dt>'+t('gpW')+'</dt><dd>'+sum(o.total-o.deliv-costSum)+' · '+pct((o.total-o.deliv-costSum)/Math.max(1,o.total-o.deliv),0)+'</dd></div>':'')+'</dl>'+
  '<h3>'+t('histW')+'</h3><ul class="lg2">'+(hist.length?hist.map(logRow).join(''):'<li class="muted">'+t('noHist')+'</li>')+'</ul>'+
  '<form id="oc-note" class="note"><input placeholder="'+t('notePh')+'" aria-label="'+t('notePh')+'"><button class="btn btn-ghost">'+t('add')+'</button></form>'+
  (o.st===3?'<button type="button" class="btn btn-ghost red" id="oc-ret">'+t('doRet')+'</button>':'')+'</div>',function(s){
    var nx=$('#oc-next',s);if(nx)nx.onclick=function(){var ns=o.st+1;setSt(o,ns,$('#oc-cour',s).value);logAdd('st',o.no,t('st'+ns));orderCard(no);redraw()};
    var cr=$('#oc-cour',s);if(cr)cr.onchange=function(){(PS.ord[o.no]=PS.ord[o.no]||{st:o.st}).cour=cr.value;saveP();logAdd('cour',o.no,cr.value);orderCard(no)};
    $('#oc-note',s).onsubmit=function(e){e.preventDefault();var v=$('input',this).value.trim();if(!v)return;logAdd('note',o.no,v);orderCard(no)};
    var rt=$('#oc-ret',s);if(rt)rt.onclick=function(){if(!confirm(t('retConfirm',{n:sum(o.total)})))return;setSt(o,4);logAdd('ret',o.no,sum(o.total));orderCard(no);redraw()}})}
function setSt(o,st,cour){if(o.site){var r=(S.orders||[]).filter(function(x){return x.no===o.no})[0];if(r){r.st=Math.min(3,st);r.times=r.times||[];r.times[r.st]=Date.now();saveS()}}else{PS.ord[o.no]={st:st,cour:cour||o.cour};saveP()}o.st=st;if(cour)o.cour=cour}
function srcName(id){var s=SRC.filter(function(x){return x.id===id})[0];return s?h(s.n):''}
function logRow(l){return '<li><span class="lt">'+dstr(l.ts)+' '+tstr(l.ts)+'</span><span><b>'+h(l.who)+'</b> '+t('log_'+l.k,{o:'<a href="#orders" data-oc="'+l.o+'">'+l.o+'</a>',v:h(l.v)})+'</span></li>'}

/* Сайд-панель */
function side(html,on){var s=$('#side');s.innerHTML='<div class="sd-back" data-x></div><aside class="sd" role="dialog" aria-modal="true"><button type="button" class="ib sd-x" data-x aria-label="'+t('close')+'">'+ic('x')+'</button>'+html+'</aside>';s.hidden=false;void s.offsetWidth;s.classList.add('on');$$('[data-x]',s).forEach(function(b){b.onclick=closeSide});if(on)on(s);var f=$('button,input,select',$('.sd',s));if(f)f.focus({preventScroll:true})}
function closeSide(){var s=$('#side');s.classList.remove('on');setTimeout(function(){s.hidden=true;s.innerHTML=''},REDUCED?0:250)}
addEventListener('keydown',function(e){if(e.key==='Escape')closeSide()});

/* Отзывы */
function reviews(){var out=[];(S.reviews||[]).forEach(function(r,i){var x=PS.rv['s'+r.ts];out.push({key:'s'+r.ts,id:r.id,a:r.name||t('buyer'),ph:r.phone,d:r.date,r:r.stars,t:r.text,photo:r.photo,st:x&&x.st||r.status||'new',reply:x&&x.reply||r.reply||'',pts:r.pts,order:r.order,site:1,ref:r})});
  G.pending.forEach(function(r,i){var x=PS.rv['p'+i];out.push({key:'p'+i,id:r.id,a:r.a,d:r.d,r:r.r,t:r.t,st:x&&x.st||'new',reply:x&&x.reply||'',pts:r.photo?G.shop.reviewPhotoPts:G.shop.reviewPts,order:r.o,cmp:r.cmp,photoNote:r.photo})});
  G.products.forEach(function(p){(p.rev||[]).forEach(function(r,i){var k='u'+p.id+i,x=PS.rv[k];out.push({key:k,id:p.id,a:r.a,d:r.d,r:r.r,t:r.t,st:x&&x.st||'ok',reply:x&&x.reply||'',uzum:1})})});return out}
var RF='new';
V.reviews=function(){var all2=reviews(),cnt={new:0,ok:0,no:0,cmp:0};all2.forEach(function(r){cnt[r.st]=(cnt[r.st]||0)+1;if(r.cmp)cnt.cmp++});
  var list=all2.filter(function(r){return RF==='cmp'?r.cmp:r.st===RF});
  var pts=all2.filter(function(r){return r.pts&&r.st!=='no'}).reduce(function(s,r){return s+r.pts},0);
  return '<div class="ph"><div><h1>'+t('revH')+'</h1><p class="muted">'+t('revS')+'</p></div></div>'+
  '<div class="kpis k4">'+kpi(t('rvNew'),cnt.new)+kpi(t('rvAvg'),'4,9 ★','',t('rvAvgS'))+kpi(t('rvPts'),fmt(pts),'',t('rvPtsS'))+kpi(t('rvCmp'),cnt.cmp,'',t('rvCmpS'))+'</div>'+
  '<div class="seg2">'+[['new',t('rvNew')],['ok',t('rvOk')],['no',t('rvNo')],['cmp',t('rvCmp')]].map(function(x){return '<button type="button" data-rf="'+x[0]+'" class="'+(RF===x[0]?'on':'')+'">'+x[1]+' <i>'+(cnt[x[0]]||0)+'</i></button>'}).join('')+'</div>'+
  '<div class="rvl">'+(list.length?list.slice(0,30).map(function(r){var p=P[r.id];return '<article class="cd rvc'+(r.cmp?' cmp':'')+'" data-k="'+r.key+'"><header><img src="'+IMG+'/p-'+r.id+'-s.webp" alt="" width="22" height="42"><span><b>'+h(p.n)+'</b><small>'+h(r.a)+' · '+h(r.d)+(r.order?' · '+h(r.order):'')+(r.uzum?' · Uzum Market':'')+(r.site?' · '+t('fromSite'):'')+'</small></span><span class="rs">'+'★'.repeat(r.r)+'<i>'+'★'.repeat(5-r.r)+'</i></span></header>'+(r.cmp?'<p class="cmpl">'+ic('alert')+h(r.cmp)+'</p>':'')+'<p>'+h(r.t)+'</p>'+(r.photo?'<img class="rvp" src="'+r.photo+'" alt="'+t('photoW')+'">':r.photoNote?'<p class="muted sm">'+ic('camera')+t('withPhoto')+'</p>':'')+
    (r.reply?'<p class="rpl"><b>Greenwell</b>'+h(r.reply)+'</p>':'')+(r.pts?'<p class="pts">'+ic('gift')+t('ptsGiven',{n:fmt(r.pts)})+'</p>':'')+
    '<footer>'+(r.st==='new'?'<button type="button" class="btn btn-g sm" data-ok>'+t('publish')+'</button><button type="button" class="btn btn-ghost sm" data-no>'+t('reject')+'</button>':'')+'<button type="button" class="btn btn-ghost sm" data-re>'+(r.reply?t('editReply'):t('reply'))+'</button>'+(r.cmp?'<button type="button" class="btn btn-ghost sm" data-fix>'+t('fixCmp')+'</button>':'')+'</footer></article>'}).join(''):'<p class="empty">'+t('noRev')+'</p>')+'</div><p class="demo">'+t('rvDemo')+'</p>'};
V.reviews_on=function(){$$('[data-rf]').forEach(function(b){b.onclick=function(){RF=b.getAttribute('data-rf');draw()}});
  $$('.rvc').forEach(function(c){var k=c.getAttribute('data-k'),r=reviews().filter(function(x){return x.key===k})[0];
    function set(st,reply){var x=PS.rv[k]=PS.rv[k]||{};if(st)x.st=st;if(reply!=null)x.reply=reply;saveP();if(r.site){r.ref.status=x.st==='ok'?'ok':x.st||r.ref.status;if(reply!=null)r.ref.reply=reply;saveS()}}
    var ok=$('[data-ok]',c);if(ok)ok.onclick=function(){set('ok');logAdd('rvok',r.order||'',h(P[r.id].n));draw();toast(t('published'))};
    var no=$('[data-no]',c);if(no)no.onclick=function(){set('no');logAdd('rvno',r.order||'',h(P[r.id].n));draw();toast(t('rejected'))};
    $('[data-re]',c).onclick=function(){var f=d.createElement('form');f.className='rf';f.innerHTML='<textarea rows="3" placeholder="'+t('replyPh')+'">'+h(r.reply||G.replyTpl)+'</textarea><div><button class="btn btn-g sm">'+t('send')+'</button></div>';$('footer',c).replaceWith(f);$('textarea',f).focus();f.onsubmit=function(e){e.preventDefault();var v=$('textarea',f).value.trim();if(!v)return;set(r.st==='new'?'ok':null,v);logAdd('reply',r.order||'',h(P[r.id].n));draw();toast(t('replied'))}};
    var fx=$('[data-fix]',c);if(fx)fx.onclick=function(){set('ok',G.cmpReply);logAdd('cmp',r.order||'',t('cmpDone'));draw();toast(t('cmpDone'))}})};

/* Товары: прибыль от себестоимости и остатки */
V.goods=function(){var c=calc(R.days);
  return '<div class="ph"><div><h1>'+t('goodsH')+'</h1><p class="muted">'+(own()?t('goodsS'):t('goodsSm'))+'</p></div>'+per()+'</div>'+
  '<div class="cd tbw"><table class="tb gd"><thead><tr><th>'+t('good')+'</th><th class="r">'+t('price')+'</th>'+(own()?'<th class="r">'+t('costW')+'</th>':'')+'<th class="r">'+t('sold')+'</th><th class="r">'+t('revenue')+'</th>'+(own()?'<th class="r">'+t('gp')+'</th><th class="r">'+t('margin')+'</th>':'')+'<th class="r">'+t('stock')+'</th><th class="r">'+t('enough')+'</th></tr></thead><tbody>'+
  G.products.map(function(p){var x=c.byP[p.id]||{q:0,rev:0,cost:0},sold=x.q/R.days,days=sold?G.stock[p.id]/sold:999,m=(x.rev-x.cost)/Math.max(1,x.rev);
    return '<tr><td><span class="pr"><img src="'+IMG+'/p-'+p.id+'-s.webp" alt="" width="20" height="38">'+h(p.n)+'</span></td><td class="r">'+fmt(p.price)+'</td>'+(own()?'<td class="r"><input class="cost" data-cost="'+p.id+'" inputmode="numeric" value="'+COST(p.id)+'" aria-label="'+t('costW')+' '+h(p.n)+'"></td>':'')+'<td class="r">'+fmt(x.q)+'</td><td class="r">'+mln(x.rev)+'</td>'+(own()?'<td class="r">'+mln(x.rev-x.cost)+'</td><td class="r"><span class="mg" style="--k:'+m.toFixed(3)+'">'+pct(m,0)+'</span></td>':'')+'<td class="r">'+G.stock[p.id]+'</td><td class="r"><em class="dleft '+(days<10?'bad':days<21?'warn':'')+'">'+(days>=999?'∞':t('daysLeft',{n:Math.round(days)}))+'</em></td></tr>'}).join('')+
  '</tbody>'+(own()?'<tfoot><tr><td>'+t('total')+'</td><td></td><td></td><td class="r">'+fmt(Object.keys(c.byP).reduce(function(s,k){return s+c.byP[k].q},0))+'</td><td class="r">'+mln(c.rev)+'</td><td class="r">'+mln(c.gp)+'</td><td class="r">'+pct(c.margin,0)+'</td><td></td><td></td></tr></tfoot>':'')+'</table></div>'+
  (own()?'<p class="demo">'+t('costDemo')+'</p>':'')};
V.goods_on=function(){$$('[data-cost]').forEach(function(i){i.onchange=function(){var v=parseInt(i.value.replace(/\D/g,''));if(!(v>0))return;var id=i.getAttribute('data-cost');PS.cost[id]=v;saveP();logAdd('cost','',h(P[id].n)+': '+fmt(v));draw();toast(t('costSaved'))}})};

/* Доставка */
V.logistics=function(){var c=calc(R.days),p=calc(R.days,true);
  var buckets=[[0,120],[120,240],[240,480],[480,720],[720,1440],[1440,1e9]],dist=buckets.map(function(b){return c.done.filter(function(o){return o.del>=b[0]&&o.del<b[1]}).length});
  return '<div class="ph"><div><h1>'+t('logH')+'</h1><p class="muted">'+t('logS')+'</p></div>'+per()+'</div>'+
  '<div class="kpis k4">'+kpi(t('toAsm'),dur(c.asm),delta(c.asm,p.asm,true))+kpi(t('toDel'),dur(c.del),delta(c.del,p.del,true))+kpi(t('late'),pct(c.late,0),delta(c.late,p.late,true))+kpi(t('inWay'),all().filter(function(o){return o.st===2}).length)+'</div>'+
  '<div class="cols">'+card(t('delDist'),hbars(buckets.map(function(b,i){return {n:t('b'+i),v:dist[i],c:i>3?'var(--red)':'var(--g3)'}}),function(v){return fmt(v)}),'w2')+
  card(t('byCour'),'<table class="tb"><thead><tr><th>'+t('courier')+'</th><th class="r">'+t('deliv')+'</th><th class="r">'+t('avgT')+'</th><th class="r">'+t('late')+'</th></tr></thead><tbody>'+G.couriers.map(function(cr){var my=c.done.filter(function(o){return o.cour===cr}),lt=my.filter(function(o){return o.late}).length/Math.max(1,my.length);return '<tr><td>'+h(cr)+'</td><td class="r">'+my.length+'</td><td class="r">'+dur(med(my.map(function(o){return o.del})))+'</td><td class="r"><span class="'+(lt>.12?'bad':'')+'">'+pct(lt,0)+'</span></td></tr>'}).join('')+'</tbody></table>')+'</div>'+
  card(t('byDist'),hbars(G.districts.map(function(dn){var my=c.done.filter(function(o){return o.dist===dn});return {n:h(dn),v:my.length,s:dur(med(my.map(function(o){return o.del})))}}).sort(function(a,b){return b.v-a.v})))+
  '<p class="demo">'+t('demoNote')+'</p>'};

/* Рассрочка */
V.nasiya=function(){var c=calc(R.days),p=calc(R.days,true),nas=c.ok.filter(function(o){return o.pay==='nasiya'}),card2=c.ok.filter(function(o){return o.pay!=='nasiya'});
  var avgN=nas.reduce(function(s,o){return s+o.total},0)/Math.max(1,nas.length),avgC=card2.reduce(function(s,o){return s+o.total},0)/Math.max(1,card2.length);
  return '<div class="ph"><div><h1>'+t('nasH')+'</h1><p class="muted">'+t('nasS')+'</p></div>'+per()+'</div>'+
  '<div class="kpis k4">'+kpi(t('nasShare'),pct(c.nas,0),delta(c.nas,p.nas))+kpi(t('nasSum'),mln(c.nasSum),delta(c.nasSum,p.nasSum))+kpi(t('avgNas'),fmt(avgN/1000)+t('k')+'\u00a0'+t('sum'),'',t('vsCard',{n:pct(avgN/avgC-1,0)}))+kpi(t('appr'),'82%','',t('apprS'))+'</div>'+
  '<div class="cols">'+card(t('byPartner'),'<table class="tb"><thead><tr><th>'+t('partner')+'</th><th class="r">'+t('orders')+'</th><th class="r">'+t('sumW')+'</th><th class="r">'+t('appr')+'</th></tr></thead><tbody>'+G.nasiya.map(function(n,i){var my=nas.filter(function(o){return o.nas===n.id});return '<tr><td><span class="nb" style="--c:'+n.c+'">'+h(n.n)+'</span></td><td class="r">'+my.length+'</td><td class="r">'+mln(my.reduce(function(s,o){return s+o.total},0))+'</td><td class="r">'+[84,79,73][i]+'%</td></tr>'}).join('')+'</tbody></table>','w2')+
  card(t('byTerm'),hbars([[3,22],[6,47],[12,31]].map(function(x){return {n:x[0]+' '+t('mo'),v:x[1]}}),function(v){return v+'%'}))+'</div><p class="demo">'+t('nasDemo')+'</p>'};

/* Посещаемость */
V.traffic=function(){var dd=Math.min(R.days,30),vs=visits(R.days),vp=visits(R.days*2).slice(0,R.days),tot=vs.reduce(function(a,b){return a+b},0),totp=vp.reduce(function(a,b){return a+b},0),c=calc(R.days);
  var lab=series(dd,function(a){return dstr(a)}),vv=visits(dd);
  return '<div class="ph"><div><h1>'+t('trafficH')+'</h1><p class="muted">'+t('trafficS')+'</p></div>'+per()+'</div>'+
  '<div class="kpis">'+kpi(t('visits'),fmt(tot),delta(tot,totp))+kpi(t('users'),fmt(tot*.71))+kpi(t('time'),'2:41','',t('timeS'))+kpi(t('bounce'),'31%','',t('bounceS'))+kpi(t('mobile'),'80%','',t('mobileS'))+kpi(t('conv'),pct(c.n/tot,2),'',t('convS'))+'</div>'+
  '<div class="cols">'+card(t('visitsDay'),bars(vv,{lab:lab,aria:t('visitsDay')}),'w2')+card(t('devices'),hbars([{n:t('dev1'),v:80},{n:t('dev2'),v:16,c:'var(--blue)'},{n:t('dev3'),v:4,c:'var(--gold)'}],function(v){return v+'%'}))+'</div>'+
  '<div class="cols">'+card(t('sources'),'<table class="tb"><thead><tr><th>'+t('source')+'</th><th class="r">'+t('visits')+'</th><th class="r">'+t('time')+'</th><th class="r">'+t('bounce')+'</th><th class="r">'+t('orders')+'</th><th class="r">'+t('conv')+'</th></tr></thead><tbody>'+SRC.map(function(s){var v=Math.round(tot*s.w/100),o=c.ok.filter(function(x){return x.src===s.id}).length;return '<tr><td><span class="src" style="--c:'+s.c+'"><i></i>'+h(s.n)+'</span></td><td class="r">'+fmt(v)+'</td><td class="r">'+s.t+'</td><td class="r">'+s.b+'%</td><td class="r">'+o+'</td><td class="r">'+pct(o/v,2)+'</td></tr>'}).join('')+'</tbody></table>','w2')+
  card(t('geo'),hbars(G.geo.map(function(g){return {n:h(g[0]),v:g[1]}}),function(v){return v+'%'}))+'</div>'+
  card(t('funnel'),funnel(R.days))+
  '<div class="cols">'+card(t('topPages'),'<ol class="tp">'+G.topPages.map(function(x,i){return '<li><span>'+h(x[0])+'</span><b>'+fmt(Math.round(tot*x[1]/100))+'</b></li>'}).join('')+'</ol>')+card(t('searches'),'<ol class="tp">'+G.searches.map(function(x){return '<li><span>«'+h(x[0])+'»</span><b>'+fmt(Math.round(tot*x[1]/1000))+'</b></li>'}).join('')+'</ol><p class="muted sm">'+t('searchesS')+'</p>')+'</div>'+
  '<p class="demo">'+t('trafficDemo')+'</p>'};

/* Журнал менеджеров */
V.log=function(){var list=PS.log.concat(LOG0).sort(function(a,b){return b.ts-a.ts});var who={};list.forEach(function(l){who[l.who]=(who[l.who]||0)+1});
  return '<div class="ph"><div><h1>'+t('logH2')+'</h1><p class="muted">'+t('logS2')+'</p></div></div>'+
  '<div class="cols">'+card(t('journal'),'<ul class="lg2">'+list.slice(0,40).map(logRow).join('')+'</ul>','w2')+card(t('team'),'<ul class="team">'+Object.keys(who).sort(function(a,b){return who[b]-who[a]}).map(function(n){var r=G.roles[n]||'';return '<li><span class="av">'+h(n.charAt(0))+'</span><span><b>'+h(n)+'</b><small>'+h(r)+'</small></span><em>'+who[n]+'</em></li>'}).join('')+'</ul>')+'</div><p class="demo">'+t('demoNote')+'</p>'};

/* ── Навигация ────────────────────────────────────────────────────────── */
function draw(){var hs=location.hash.replace(/^#/,''),q={},i=hs.indexOf('?');if(i>=0){hs.slice(i+1).split('&').forEach(function(kv){var p=kv.split('=');q[p[0]]=p[1]});hs=hs.slice(0,i)}
  R.tab=V[hs]?hs:'dash';main.innerHTML=V[R.tab](q);main.classList.remove('in');requestAnimationFrame(function(){main.classList.add('in')});
  $$('.nav a').forEach(function(a){a.classList.toggle('on',a.getAttribute('href')==='#'+R.tab);if(a.classList.contains('on'))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
  var nb=$('[data-cnt="orders"]');if(nb){var n=all().filter(function(o){return o.st===0}).length;nb.textContent=n;nb.hidden=!n}
  var rb=$('[data-cnt="reviews"]');if(rb){var m=reviews().filter(function(r){return r.st==='new'}).length;rb.textContent=m;rb.hidden=!m}
  $$('[data-per]').forEach(function(b){b.onclick=function(){R.days=+b.getAttribute('data-per');draw()}});
  $$('[data-oc]').forEach(function(a){a.onclick=function(e){e.preventDefault();orderCard(a.getAttribute('data-oc'))}});
  if(V[R.tab+'_on'])V[R.tab+'_on'](q);d.title=($('h1',main)||{textContent:''}).textContent+' · '+t('brand')}
function redraw(){var y=scrollY;draw();scrollTo(0,y)}
addEventListener('hashchange',function(){draw();scrollTo(0,0);d.body.classList.remove('nav-on')});
addEventListener('storage',function(e){if(e.key===KEY){load();redraw()}});
$$('[data-role]').forEach(function(b){b.onclick=function(){R.role=b.getAttribute('data-role');PS.role=R.role;saveP();$$('[data-role]').forEach(function(x){x.setAttribute('aria-checked',x===b)});d.body.classList.toggle('mgr',R.role!=='owner');redraw();toast(R.role==='owner'?t('asOwner'):t('asMgr'))}});
d.body.classList.toggle('mgr',R.role!=='owner');$$('[data-role]').forEach(function(x){x.setAttribute('aria-checked',x.getAttribute('data-role')===R.role)});
var tt=0;function toast(m){var el=$('#toast');el.textContent=m;el.classList.add('on');clearTimeout(tt);tt=setTimeout(function(){el.classList.remove('on')},2400)}
var mb=$('#menu-b');if(mb)mb.onclick=function(){d.body.classList.toggle('nav-on')};
draw();
})();
