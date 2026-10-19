(function(){
'use strict';
/* panel: панель управляющей компании Soffice. Сводка, заявки и сделки,
   просмотры, объекты (БЦ, этажи, блоки), арендаторы и договоры, счета и
   оплаты, эксплуатация, отчёт собственнику, спрос с сайта, команда и
   история. Цифры демо из одного зерна, поэтому сходятся между экранами.
   Связь с сайтом через память браузера: so-leads-1 и so-demand-1 пишет
   сайт, so-panel-1 пишет панель (статусы блоков и ставки сайт читает сразу).
   Комментарии вырезает сборка. Модель панель не вызывает. */
var d=document,W=window,G=JSON.parse(d.getElementById('sp-data').textContent),U=G.ui,L=G.lang,EN=L==='en';
if(/[?&]embed=1/.test(location.search))d.documentElement.classList.add('embed');
var REDUCED=false;try{REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
var $=function(s,r){return (r||d).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))};
function t(k,v){var s=U[k];if(s==null)return k;if(v&&typeof s==='string')for(var x in v)s=s.split('{'+x+'}').join(v[x]);return s}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function grp(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,EN?',':' ')}
function dec(x,dg){var s=x.toFixed(dg);return EN?s:s.replace('.',',')}
function money(n){var a=Math.abs(n),s=a>=1e9?dec(n/1e9,a>=1e11?0:1)+' '+t('bln'):a>=1e6?dec(n/1e6,a>=1e8?0:1)+' '+t('mln'):grp(n);return s+' '+t('sum')}
function pct(x,dg){return dec(x*100,dg==null?0:dg)+'%'}
function pad(n){return (n<10?'0':'')+n}
function dstr(ts){var x=new Date(ts);return pad(x.getDate())+'.'+pad(x.getMonth()+1)}
function dfull(ts){var x=new Date(ts);return pad(x.getDate())+'.'+pad(x.getMonth()+1)+'.'+x.getFullYear()}
function tstr(ts){var x=new Date(ts);return pad(x.getHours())+':'+pad(x.getMinutes())}
function mname(m){return t('months')[m%12]+' '+Math.floor(m/12)}
function ic(k){return '<svg class="ic" aria-hidden="true"><use href="#i-'+k+'"/></svg>'}
function toast(s){var el=$('#toast');el.textContent=s;el.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(function(){el.classList.remove('on')},3200)}
function lsGet(k,def){try{var v=JSON.parse(localStorage.getItem(k)||'null');return v==null?def:v}catch(e){return def}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}

/* ── Опорные данные ─────────────────────────────────────────────────── */
var DAY=864e5,NOW=Date.now(),T0=new Date(new Date(NOW).setHours(0,0,0,0)).getTime();
var CUR=new Date(NOW).getFullYear()*12+new Date(NOW).getMonth();
function mStart(m){return new Date(Math.floor(m/12),m%12,1).getTime()}
function mOf(ts){var x=new Date(ts);return x.getFullYear()*12+x.getMonth()}
function addM(ts,k){var x=new Date(ts);return new Date(x.getFullYear(),x.getMonth()+k,x.getDate()).getTime()}
var BC={};G.bc.forEach(function(b){BC[b.id]=b;b.rate0=b.rate});
var TEAM={};G.team.forEach(function(p){TEAM[p.id]=p});
var BROKERS=G.team.filter(function(p){return p.role==='broker'}).map(function(p){return p.id});
var OPS=G.team.filter(function(p){return p.role==='ops'}).map(function(p){return p.id});
var OWN={};G.owners.forEach(function(o){o.bcs.forEach(function(id){OWN[id]=o.id})});
var zr=20261019;function rnd(){zr=(zr*1664525+1013904223)>>>0;return zr/4294967296}
function pick(a,w){if(!w)return a[Math.floor(rnd()*a.length)];var tot=0,i,s=0;for(i=0;i<w.length;i++)tot+=w[i];var r=rnd()*tot;for(i=0;i<a.length;i++){s+=w[i];if(r<s)return a[i]}return a[a.length-1]}

/* ── Память: правки панели, заявки и спрос с сайта ─────────────────── */
var PK='so-panel-1',LK='so-leads-1',DK='so-demand-1',PS={};
function load(){PS=lsGet(PK,{})||{};['u','rate','leads','views','pay','remind','tickets','lsx'].forEach(function(k){PS[k]=PS[k]||{}});['newLeads','newViews','newLeases','newBills','newTickets','log'].forEach(function(k){PS[k]=PS[k]||[]});
  if(!PS.role)PS.role='owner';if(!PS.owner)PS.owner=G.owners[0].id}
function save(){lsSet(PK,PS)}
load();
G.bc.forEach(function(b){if(PS.rate[b.id])b.rate=+PS.rate[b.id]});

/* ── Блоки: те же, что на сайте ─────────────────────────────────────── */
var UN=[],UK={};
G.bc.forEach(function(b){var inv=G.inv[b.id];for(var i=0;i<inv.s.length;i++){var g=G.units[i%8],x={k:b.id+':'+i,bc:b.id,i:i,fl:2+Math.floor(i/8),u:i%8,n:g.n,a:Math.round(g.a*inv.k),s0:inv.s.charAt(i),idle:5+((i*37+b.n.length*29)%160)};UN.push(x);UK[x.k]=x}});
function st(x){return PS.u[x.k]||x.s0}
function ulab(x){return BC[x.bc].n+' · '+x.fl+'.'+x.n}

/* ── Договоры: сданные блоки, соседние иногда у одного арендатора ──── */
var LS=[],LSK={},prev=null;
function tenantName(k){var i=(k*7919)%1000;return G.roots[i%G.roots.length]+' '+G.kinds[Math.floor(i/G.roots.length)%G.kinds.length]}
UN.forEach(function(x){if(x.s0!=='l'){prev=null;return}
  if(prev&&prev.bc===x.bc&&prev.fl===x.fl&&prev.units.length<3&&rnd()<.35){prev.units.push(x);prev.area+=x.a;x.ls=prev;return}
  var k=LS.length,b=BC[x.bc],term=pick([11,12,24,36],[20,40,25,15]),back=1+Math.floor(rnd()*(term-1)),start=addM(mStart(CUR),-back)+Math.floor(rnd()*27)*DAY;
  prev={id:'D-'+(2001+k),bc:x.bc,fl:x.fl,units:[x],area:x.a,rate:Math.round(b.rate0*(.9+rnd()*.15)/1000)*1000,start:start,end:addM(start,term)-DAY,term:term,idx:pick([0,5,7,10],[20,35,30,15]),dep:pick([1,1,2]),
    since:new Date(start).getFullYear()-pick([0,0,1,2,3]),auto:rnd()<.45,t:tenantName(k),nm:pick(G.first)+' '+pick(G.lastI),ph:'+998 9'+(k%10)+' *** '+pad(10+k%89)+' '+pad(11+(k*7)%88)};
  prev.spots=Math.max(0,Math.round(prev.area/90-rnd()));if(prev.since<2020)prev.since=2020;x.ls=prev;LS.push(prev)});
LS.forEach(function(l){LSK[l.id]=l});
function lsMonthly(l){return l.area*l.rate+l.area*G.tariff.util+l.spots*G.tariff.park}
function lsEnd(l){var x=PS.lsx[l.id];return x&&x.end?x.end:l.end}
function addNewLeases(){PS.newLeases.forEach(function(n){if(LSK[n.id])return;var l={};for(var k in n)l[k]=n[k];l.units=n.uk.map(function(k){return UK[k]});l.units.forEach(function(x){x.ls=l});l.fresh=1;LS.unshift(l);LSK[l.id]=l})}
addNewLeases();

/* ── Счета: аренда, коммунальные, парковка, за четыре месяца ───────── */
var BL=[];
LS.forEach(function(l){if(l.fresh)return;for(var m=CUR-3;m<=CUR;m++){if(mStart(m)<l.start-20*DAY)continue;var due=mStart(m)+4*DAY,paid=null,r=rnd();
  if(m<CUR?r<.985:r<.9)paid={ts:due-Math.floor(rnd()*6)*DAY+Math.floor(rnd()*9)*DAY,how:pick(['bank','click','payme'],[62,22,16])};
  if(paid&&paid.ts>NOW)paid.ts=NOW-DAY;
  BL.push({id:'S-'+m+'-'+l.id.slice(2),ls:l,m:m,rent:l.area*l.rate,util:l.area*G.tariff.util,park:l.spots*G.tariff.park,dep:0,due:due,paid0:paid})}});
function addNewBills(){PS.newBills.forEach(function(n){if(BL.some(function(b){return b.id===n.id}))return;var l=LSK[n.ls];if(!l)return;BL.unshift({id:n.id,ls:l,m:n.m,rent:n.rent,util:n.util,park:n.park,dep:n.dep,due:n.due,paid0:null,fresh:1})})}
addNewBills();
function bTotal(b){return b.rent+b.util+b.park+b.dep}
function bPaid(b){return PS.pay[b.id]||b.paid0}
function bSt(b){return bPaid(b)?'paid':b.due<NOW?'late':'open'}
function bAge(b){return Math.max(0,Math.floor((NOW-b.due)/DAY))}

/* ── Заявки и сделки ────────────────────────────────────────────────── */
var STG=['new','view','offer','contract','moved'],SRC=['site_pick','site_view','wa','tg','call','ig','ref','sign'],SRCW=[16,14,20,14,16,8,8,4];
var REASONS=['r_price','r_place','r_size','r_time','r_rival','r_silent'],FMT=['office','cabinet','open','cowork'];
var LEADS=[];
(function(){for(var k=0;k<150;k++){var age=Math.pow(rnd(),1.25)*120,ts=NOW-age*DAY-rnd()*8*36e5,b=pick(G.bc),area=pick([25,40,60,80,120,200,350,600,1200],[6,12,18,18,16,12,8,6,4]);
  var p=Math.min(1,age/50),stg=age<2?'new':pick(['new','view','offer','contract','moved','lost'],[Math.max(1,30-age),18,14+p*4,5+p*8,p*24,8+p*30]);
  var where=rnd()<.45?'b:'+b.id:rnd()<.7?'d:'+b.d:'';
  LEADS.push({id:'Z-'+(3400+150-k),ts:ts,src:pick(SRC,SRCW),nm:pick(G.first)+' '+pick(G.lastI),co:tenantName(500+k),ph:'+998 9'+(k%10)+' *** '+pad(20+k%79)+' '+pad(31+(k*3)%68),
    area:area,where:where,bc:where.charAt(0)==='b'?b.id:'',budget:Math.round(area*b.rate0*(1+rnd()*.3)/1e6)*1e6,fmt:area<40?pick(['cabinet','cowork']):pick(FMT,[60,20,15,5]),
    br:pick(BROKERS),st:stg,reason:stg==='lost'?pick(REASONS,[30,18,16,14,12,10]):'',kp:stg!=='new'&&stg!=='view'?[b.id]:[]})}
  LEADS.sort(function(a,b){return b.ts-a.ts})})();
function siteLeads(){var a=lsGet(LK,[]);if(!Array.isArray(a))return [];return a.filter(function(x){return x&&x.id}).map(function(x){var w=x.where||'',bc=x.bc||(w.charAt(0)==='b'?w.slice(2):'');
  return {id:x.id,ts:x.ts,src:x.kind==='view'?'site_view':'site_pick',ch:x.ch,nm:t('fromSite'),co:'',ph:'',area:+x.area||100,where:w||(bc?'b:'+bc:''),bc:bc,budget:+x.budget||0,fmt:'office',br:'',st:'new',reason:'',kp:[],site:1,unit:x.unit||'',day:x.day||'',dayTs:+x.dayTs||0,time:x.time||'',n:x.n}})}
function overlay(l){var o=PS.leads[l.id];if(o)for(var k in o)l[k]=o[k];return l}
function leadsAll(){return siteLeads().concat(PS.newLeads.map(function(x){var c={};for(var k in x)c[k]=x[k];return c}),LEADS).map(overlay)}
function leadSet(id,patch,log){var o=PS.leads[id]=PS.leads[id]||{};for(var k in patch)o[k]=patch[k];save();if(log)logAdd(log[0],id,log[1])}
function leadById(id){return leadsAll().filter(function(l){return l.id===id})[0]}
function whereTxt(l){if(!l.where)return t('anyWhere');var p=l.where.split(':');return p[0]==='b'?BC[p[1]].n:G.dist[p[1]]}

/* ── Просмотры ──────────────────────────────────────────────────────── */
var SLOTS=[10,12,15,17],VW=[];
(function(){var pool=LEADS.filter(function(l){return l.st!=='new'});for(var dd=-7;dd<=7;dd++){var day=T0+dd*DAY;if(new Date(day).getDay()===0)continue;var n=dd<0?4+Math.floor(rnd()*3):dd<=5?3+Math.floor(rnd()*3):1;
  for(var i=0;i<n;i++){var l=dd>=0?pick(LEADS.filter(function(x){return x.st==='view'}))||pick(pool):pick(pool),bc=l.bc||pick(G.bc).id,ts=day+pick(SLOTS)*36e5;
    VW.push({id:'V-'+(500+VW.length),ts:ts,bc:bc,br:l.br,lead:l.id,res:ts<NOW?pick(['liked','think','came','noshow'],[30,30,25,15]):'plan'})}}})();
function siteViews(){return siteLeads().filter(function(l){return l.src==='site_view'&&l.dayTs&&l.time}).map(function(l){var o=overlay(l);return {id:'V'+l.id,ts:l.dayTs+parseInt(l.time,10)*36e5,bc:l.bc||'platform',br:o.br||'',lead:l.id,res:'plan',site:1}})}
function viewsAll(){return siteViews().concat(PS.newViews,VW).map(function(v){var o=PS.views[v.id];if(o)for(var k in o)v[k]=o[k];return v})}

/* ── Эксплуатация ───────────────────────────────────────────────────── */
var TKT=['repair','clean','pass','park'],TK=[];
(function(){for(var k=0;k<38;k++){var l=pick(LS),type=pick(TKT,[40,22,26,12]),ts=NOW-Math.pow(rnd(),1.4)*20*DAY,dueH={repair:48,clean:8,pass:4,park:24}[type];
  var due=ts+dueH*36e5,done=ts<NOW-3*DAY?rnd()<.9:rnd()<.45;TK.push({id:'E-'+(900-k),ts:ts,type:type,bc:l.bc,ls:l.id,txt:t('tx_'+type)[k%3],who:pick(OPS),due:due,st:done?'done':ts<NOW-DAY&&rnd()<.6?'work':'new'})}})();
function ticketsAll(){return PS.newTickets.concat(TK).map(function(x){var o=PS.tickets[x.id];if(o)for(var k in o)x[k]=o[k];return x})}

/* ── Журнал ─────────────────────────────────────────────────────────── */
var LOG0=[];(function(){var acts=[['lead_br',BROKERS],['view_set',BROKERS],['kp',BROKERS],['unit',BROKERS],['pay',['gulnora']],['remind',['gulnora']],['tk_done',OPS],['rate',['nodira']],['doc',['nodira','gulnora']]];
  for(var i=0;i<36;i++){var a=pick(acts),l=pick(LEADS);LOG0.push({ts:NOW-(i*53+rnd()*40)*6e4,who:pick(a[1]),k:a[0],o:a[0]==='pay'||a[0]==='remind'?pick(LS).id:a[0]==='unit'?ulab(pick(UN)):a[0]==='rate'?pick(G.bc).n:l.id})}})();
function me(){return t('role_'+PS.role)}
function logAdd(k,o,v){PS.log.unshift({ts:Date.now(),who:'',role:PS.role,k:k,o:o,v:v||''});PS.log=PS.log.slice(0,200);save()}

/* ── Роли: каждая видит своё ────────────────────────────────────────── */
var ROLE={owner:{s:'*',m:1,deal:1,bill:1,obj:2,svc:1},head:{s:'*',m:1,deal:1,bill:1,obj:2,svc:1},
  broker:{s:'dash leads views objects leases service demand',deal:1,obj:1,svc:1},acc:{s:'dash bills leases owners',m:1,bill:1},
  ops:{s:'dash objects views service',obj:3,svc:1},own:{s:'dash objects leases owners demand',m:1,ro:1}};
var NAV=['dash','leads','views','objects','leases','bills','service','owners','demand','team'];
function R(){return ROLE[PS.role]||ROLE.owner}
function sees(sec){var s=R().s;return s==='*'||(' '+s+' ').indexOf(' '+sec+' ')>=0}
function scope(bc){if(PS.role!=='own')return true;var o=G.owners.filter(function(x){return x.id===PS.owner})[0];return o.bcs.indexOf(bc)>=0}
function bcsIn(){return G.bc.filter(function(b){return scope(b.id)})}

/* ── Расчёты по зданиям ─────────────────────────────────────────────── */
function bcStats(id){var a=0,lt=0,hold=0,free=0,rep=0,fu=0,idle=0,rs=0,ra=0;UN.forEach(function(x){if(x.bc!==id)return;var s=st(x);a+=x.a;if(s==='l'){lt+=x.a}else if(s==='h')hold+=x.a;else if(s==='r')rep+=x.a;else{free+=x.a;fu++;idle+=PS.u[x.k]?0:x.idle}});
  LS.forEach(function(l){if(l.bc===id){rs+=l.rate*l.area;ra+=l.area}});
  return {a:a,let:lt,hold:hold,free:free,rep:rep,occ:a?lt/a:0,fu:fu,idle:fu?idle/fu:0,avg:ra?rs/ra:BC[id].rate}}
function money4(m,bcf){var ch=0,pd=0;BL.forEach(function(b){if(b.m!==m||(bcf&&!bcf(b.ls.bc)))return;var tt=bTotal(b);ch+=tt;var p=bPaid(b);if(p)pd+=tt});return {ch:ch,pd:pd}}
function debts(bcf){var out={n:0,s:0,b:[0,0,0,0]};BL.forEach(function(b){if(bcf&&!bcf(b.ls.bc))return;if(bSt(b)!=='late')return;var a=bAge(b),tt=bTotal(b);out.n++;out.s+=tt;out.b[a<=30?0:a<=60?1:a<=90?2:3]+=tt});return out}

/* ── Графики: SVG кодом ─────────────────────────────────────────────── */
function hbars(rows,fv){var mx=Math.max.apply(null,rows.map(function(r){return r.v}).concat([1e-9]));return '<ul class="hb">'+rows.map(function(r){return '<li'+(r.href?' data-go="'+r.href+'"':'')+'><span class="hb-n">'+r.n+'</span><span class="hb-t"><i style="--k:'+(r.v/mx).toFixed(3)+(r.c?';--c:'+r.c:'')+'"></i></span><b>'+(fv?fv(r.v,r):grp(r.v))+'</b>'+(r.s?'<small>'+r.s+'</small>':'')+'</li>'}).join('')+'</ul>'}
function nice(x){if(x<=0)return 1;var e=Math.pow(10,Math.floor(Math.log(x)/Math.LN10)),f=x/e;return (f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*e}
function short(v){return v>=1e9?dec(v/1e9,v>=1e10?0:1)+t('bShort'):v>=1e6?Math.round(v/1e6)+t('mShort'):grp(v)}
function gbars(lab,sets,aria){var w=640,hh=220,pl=72,pb=24,pt=12,n=lab.length,mx=0;sets.forEach(function(s){s.v.forEach(function(v){if(v>mx)mx=v})});mx=nice(mx);var gw=(w-pl)/n,bw=Math.min(28,gw*.7/sets.length);
  var g='';for(var k=0;k<=4;k++){var y=pt+(hh-pt-pb)*(1-k/4);g+='<line x1="'+pl+'" x2="'+w+'" y1="'+y+'" y2="'+y+'" class="gl"/><text x="'+(pl-8)+'" y="'+(y+4)+'" class="ax" text-anchor="end">'+short(mx*k/4)+'</text>'}
  var s='';lab.forEach(function(l,i){var x0=pl+i*gw+(gw-bw*sets.length-2*(sets.length-1))/2;sets.forEach(function(se,j){var v=se.v[i],bh=(hh-pt-pb)*v/mx,x=x0+j*(bw+2);s+='<rect x="'+x.toFixed(1)+'" y="'+(hh-pb-bh).toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+Math.max(0,bh).toFixed(1)+'" rx="3" style="fill:'+se.c+'"><title>'+h(se.n+', '+l+': '+money(v))+'</title></rect>'});s+='<text x="'+(pl+i*gw+gw/2)+'" y="'+(hh-6)+'" class="ax" text-anchor="middle">'+h(l)+'</text>'});
  return '<svg class="chart" viewBox="0 0 '+w+' '+hh+'" role="img" aria-label="'+h(aria)+'">'+g+s+'</svg><p class="lg">'+sets.map(function(se){return '<span><i style="background:'+se.c+'"></i>'+h(se.n)+'</span>'}).join('')+'</p>'}
function divbars(rows){var mx=Math.max.apply(null,rows.map(function(r){return Math.abs(r.v)}).concat([.05]));return '<ul class="dv">'+rows.map(function(r){var k=Math.abs(r.v)/mx;return '<li><span class="dv-n">'+r.n+'</span><span class="dv-t"><i class="'+(r.v>=0?'up':'dn')+'" style="--k:'+k.toFixed(3)+'"></i></span><b>'+(r.v>=0?'+':'')+pct(r.v)+'</b><small>'+r.s+'</small></li>'}).join('')+'</ul>'}

/* ── Каркас: роли, меню, экраны ─────────────────────────────────────── */
var V={},main=$('#pv'),side=$('#side');
function card(title,body,cls,extra){body=body.replace(/<table /g,'<div class="tw"><table ').replace(/<\/table>/g,'</table></div>');return '<section class="cd '+(cls||'')+'"><header><h2>'+title+'</h2>'+(extra||'')+'</header>'+body+'</section>'}
function kpi(label,val,note,cls){return '<div class="kpi'+(cls?' '+cls:'')+'"><small>'+label+'</small><b>'+val+'</b>'+(note?'<span>'+note+'</span>':'')+'</div>'}
function ph(title,sub,right){return '<div class="ph"><div><h1>'+title+'</h1>'+(sub?'<p class="muted">'+sub+'</p>':'')+'</div>'+(right||'')+'</div>'}
function nope(){return ph(t('noAccess'),t('noAccessS',{r:me()}))}
function stTag(s){return '<span class="tag s-'+s+'">'+t('u_'+s)+'</span>'}
function lstTag(s){return '<span class="tag l-'+s+'">'+t('st_'+s)+'</span>'}
function btn(lbl,attrs,cls){return '<button'+(/type=/.test(attrs)?'':' type="button"')+' class="b '+(cls||'')+'" '+attrs+'>'+lbl+'</button>'}

function counts(){var n=leadsAll().filter(function(l){return l.st==='new'&&scope(l.bc||'x')}).length,late=0;BL.forEach(function(b){if(scope(b.ls.bc)&&bSt(b)==='late')late++});var tk=ticketsAll().filter(function(x){return x.st!=='done'&&scope(x.bc)}).length;
  if(PS.role==='own')n=0;$$('[data-cnt]').forEach(function(i){var v={leads:n,bills:late,service:tk}[i.getAttribute('data-cnt')]||0;i.textContent=v;i.hidden=!v})}
function navSync(){$$('.nav a').forEach(function(a){var k=a.getAttribute('href').slice(1);a.hidden=!sees(k);a.classList.toggle('on',k===cur.sec)});
  $('#role').value=PS.role;$('#own-w').hidden=PS.role!=='own';$('#own').value=PS.owner;$('#me-n').textContent=me();counts()}
var cur={sec:'dash',q:{}};
function route(){var hs=(location.hash||'#dash').slice(1).split('?'),q={};(hs[1]||'').split('&').forEach(function(p){var kv=p.split('=');if(kv[0])q[kv[0]]=decodeURIComponent(kv[1]||'')});cur={sec:V[hs[0]]?hs[0]:'dash',q:q};if(!side.hidden)closeSide();if(!mdl.hidden)closeModal();render()}
function render(){navSync();var f=V[cur.sec];main.innerHTML=sees(cur.sec)?f(cur.q):nope();d.body.classList.remove('nav-on');main.focus({preventScroll:true});if(!render.first)W.scrollTo(0,0);render.first=0}
render.first=1;
addEventListener('hashchange',route);
$('#role').onchange=function(){PS.role=this.value;save();logAdd('role','',me());closeSide();if(!sees(cur.sec))location.hash='#dash';else render()};
$('#own').onchange=function(){PS.owner=this.value;save();render()};
$('#menu-b').onclick=function(){d.body.classList.toggle('nav-on')};
addEventListener('storage',function(e){if(e.key===LK||e.key===DK){render();toast(t('siteNew'))}});

/* ── Сводка ─────────────────────────────────────────────────────────── */
V.dash=function(){var r=R(),bcs=bcsIn(),f=function(id){return scope(id)},tot={a:0,let:0,free:0,fu:0,idle:0,hold:0},rows=[];
  bcs.forEach(function(b){var s=bcStats(b.id);s.b=b;rows.push(s);tot.a+=s.a;tot.let+=s.let;tot.free+=s.free;tot.fu+=s.fu;tot.idle+=s.idle*s.fu;tot.hold+=s.hold});
  var mo=money4(CUR,f),dbt=debts(f),ls=leadsAll().filter(function(l){return l.ts>NOW-30*DAY&&(PS.role!=='own'||scope(l.bc))});
  var exp=LS.filter(function(l){var e=lsEnd(l);return f(l.bc)&&e>NOW&&e<NOW+90*DAY}).sort(function(a,b){return lsEnd(a)-lsEnd(b)});
  var newSite=siteLeads().map(overlay).filter(function(l){return l.st==='new'}).length,alerts='';
  if(newSite&&r.deal)alerts+='<a class="al hot" href="#leads">'+ic('bolt')+'<span>'+t('alSite',{n:newSite})+'</span></a>';
  if(r.m&&dbt.n)alerts+='<a class="al" href="#bills?st=late">'+ic('alert')+'<span>'+t('alDebt',{n:dbt.n,s:money(dbt.s)})+'</span></a>';
  var e30=exp.filter(function(l){return lsEnd(l)<NOW+30*DAY}).length;if(e30)alerts+='<a class="al" href="#leases?f=exp">'+ic('cal')+'<span>'+t('alExp',{n:e30})+'</span></a>';
  var k='<div class="kpis">'+kpi(t('occ'),pct(tot.let/tot.a,1),t('occN',{a:grp(tot.let),b:grp(tot.a)}),'big')+kpi(t('freeM2'),grp(tot.free)+' m²',t('freeN',{n:tot.fu}))+kpi(t('idle'),t('daysN',{n:Math.round(tot.idle/Math.max(1,tot.fu))}),t('idleS'));
  if(r.m)k+=kpi(t('charged'),money(mo.ch),mname(CUR),'money')+kpi(t('paid'),money(mo.pd),pct(mo.pd/Math.max(1,mo.ch))+' '+t('ofCharged'),'money')+kpi(t('debt'),money(dbt.s),t('debtN',{n:dbt.n}),'money'+(dbt.s?' bad':''));
  else k+=kpi(t('leads30'),grp(ls.length),t('leads30S'))+kpi(t('viewsWeek'),grp(viewsAll().filter(function(v){return v.ts>T0&&v.ts<T0+7*DAY&&f(v.bc)}).length),t('viewsWeekS'))+kpi(t('expiring'),grp(exp.length),t('in90'));
  k+='</div>';
  var occ=card(t('occByBc'),hbars(rows.slice().sort(function(a,b){return a.occ-b.occ}).map(function(s){return {n:h(s.b.n),v:s.occ,href:'objects?bc='+s.b.id,s:t('freeShort',{a:grp(s.free),d:Math.round(s.idle)}),c:s.occ<.85?'var(--or)':'var(--ink3)'}}),function(v){return pct(v)})+'<p class="hint">'+t('occHint')+'</p>','w2');
  var rate=card(t('rateMkt'),divbars(rows.map(function(s){var m=G.market[s.b.cls];return {n:h(s.b.n)+' <em>'+s.b.cls+'</em>',v:s.avg/m-1,s:grp(s.avg)+' / '+grp(m)}}).sort(function(a,b){return b.v-a.v}))+'<p class="hint">'+t('rateHint')+'</p>');
  var fun=funnel(leadsAll().filter(function(l){return l.ts>NOW-90*DAY}));
  var src={};ls.forEach(function(l){src[l.src]=(src[l.src]||0)+1});
  var srcC=card(t('sources'),hbars(SRC.map(function(s){return {n:t('src_'+s),v:src[s]||0}}).sort(function(a,b){return b.v-a.v}),function(v){return grp(v)})+'<p class="hint">'+t('sourcesHint')+'</p>');
  var expC=card(t('expiring90'),exp.length?'<table class="tb"><thead><tr><th>'+t('tenant')+'</th><th>'+t('bcCol')+'</th><th class="r">'+t('ends')+'</th><th class="r hm">'+t('areaCol')+'</th></tr></thead><tbody>'+exp.slice(0,8).map(function(l){var dl=Math.ceil((lsEnd(l)-NOW)/DAY);return '<tr data-ls="'+l.id+'" class="click"><td><b>'+h(l.t)+'</b></td><td>'+h(BC[l.bc].n)+'</td><td class="r"><span class="'+(dl<=30?'bad':'')+'">'+t('inDays',{n:dl})+'</span></td><td class="r hm">'+grp(l.area)+'</td></tr>'}).join('')+'</tbody></table><a class="more" href="#leases?f=exp">'+t('allN',{n:exp.length})+ic('chev')+'</a>':'<p class="muted">'+t('none')+'</p>');
  var mon='';if(r.m){var lab=[],ch=[],pd=[];for(var m=CUR-3;m<=CUR;m++){var x=money4(m,f);lab.push(t('monthsS')[m%12]);ch.push(x.ch);pd.push(x.pd)}
    mon='<div class="cols">'+card(t('chPaid'),gbars(lab,[{n:t('charged'),v:ch,c:'var(--ink3)'},{n:t('paid'),v:pd,c:'var(--or)'}],t('chPaid')),'w2')+card(t('debtAge'),hbars([0,1,2,3].map(function(i){return {n:t('age'+i),v:dbt.b[i],c:i>1?'var(--bad)':'var(--or)'}}),function(v){return money(v)})+'<a class="more" href="#bills?st=late">'+t('toBills')+ic('chev')+'</a>')+'</div>'}
  return ph(t('dashH'),PS.role==='own'?t('dashOwn',{o:ownerName()}):t('dashS'),'<span class="pill">'+ic('user')+me()+'</span>')+(alerts?'<div class="alerts">'+alerts+'</div>':'')+k+
    '<div class="cols">'+occ+rate+'</div>'+mon+'<div class="cols">'+card(t('funnel'),fun,'w2')+srcC+'</div><div class="cols">'+expC+'</div><p class="demo">'+t('demoNote')+'</p>'};
function ownerName(){var o=G.owners.filter(function(x){return x.id===PS.owner})[0];return o.n+' ('+t('demo')+')'}
function funnel(list){var reach=STG.map(function(s,i){return list.filter(function(l){var j=STG.indexOf(l.st);if(l.st==='lost')j=l.lostAt!=null?l.lostAt:(l.kp&&l.kp.length?2:1);return j>=i}).length});
  return '<ol class="fn">'+STG.map(function(s,i){var share=reach[i]/Math.max(1,reach[0]),step=i?reach[i]/Math.max(1,reach[i-1]):1;return '<li><span class="fn-n">'+t('fn_'+s)+'</span><span class="fn-t"><i style="--k:'+Math.max(.03,share).toFixed(3)+'"></i></span><b>'+grp(reach[i])+'</b><small>'+(i?pct(step)+' '+t('ofPrev'):t('in90d'))+'</small></li>'}).join('')+'</ol>'}

/* ── Заявки и сделки: доска по этапам ───────────────────────────────── */
var LF={br:'',q:'',view:'board'};
V.leads=function(){var r=R(),all=leadsAll().filter(function(l){return (!LF.br||l.br===LF.br)&&(!LF.q||(l.id+' '+l.nm+' '+l.co+' '+whereTxt(l)).toLowerCase().indexOf(LF.q.toLowerCase())>=0)});
  var tools='<div class="tools"><label class="sr"><span class="vh">'+t('search')+'</span>'+ic('search')+'<input type="search" id="lq" placeholder="'+h(t('searchLead'))+'" value="'+h(LF.q)+'"></label><select id="lbr" aria-label="'+h(t('broker'))+'"><option value="">'+t('allBrokers')+'</option>'+BROKERS.map(function(b){return '<option value="'+b+'"'+(LF.br===b?' selected':'')+'>'+h(TEAM[b].n)+'</option>'}).join('')+'</select>'+
    '<div class="seg" role="radiogroup">'+['board','list'].map(function(v){return '<button type="button" role="radio" aria-checked="'+(LF.view===v)+'" data-lv="'+v+'">'+t('v_'+v)+'</button>'}).join('')+'</div>'+(r.deal?btn(ic('plus')+t('newLead'),'data-act="lead-new"','pri'):'')+'</div>';
  var body;if(LF.view==='board'){body='<div class="board">'+STG.concat(['lost']).map(function(s){var col=all.filter(function(l){return l.st===s}),sum=col.reduce(function(a,l){return a+l.area},0);
    return '<section class="col c-'+s+'"><header><b>'+t('st_'+s)+'</b><span>'+col.length+' · '+grp(sum)+' m²</span></header><div class="col-in">'+col.slice(0,s==='moved'||s==='lost'?12:40).map(leadCard).join('')+(col.length>(s==='moved'||s==='lost'?12:40)?'<p class="muted sm">'+t('andMore',{n:col.length-(s==='moved'||s==='lost'?12:40)})+'</p>':'')+'</div></section>'}).join('')+'</div>'}
  else body=card(t('leadsList'),'<table class="tb"><thead><tr><th>'+t('lead')+'</th><th>'+t('stage')+'</th><th class="hm">'+t('need')+'</th><th class="hm">'+t('broker')+'</th><th class="r">'+t('when')+'</th></tr></thead><tbody>'+all.slice(0,80).map(function(l){return '<tr class="click'+(l.site?' site':'')+'" data-lead="'+l.id+'"><td><b>'+h(l.co||l.nm)+'</b><small class="sub">'+l.id+' · '+t('src_'+l.src)+'</small></td><td>'+lstTag(l.st)+'</td><td class="hm">'+grp(l.area)+' m² · '+h(whereTxt(l))+'</td><td class="hm">'+(l.br?h(TEAM[l.br].n):'<span class="bad">'+t('noBroker')+'</span>')+'</td><td class="r">'+dstr(l.ts)+'</td></tr>'}).join('')+'</tbody></table>');
  return ph(t('leadsH'),r.deal?t('leadsS'):t('leadsRo'))+tools+body};
function leadCard(l){return '<button type="button" class="lc'+(l.site?' site':'')+'" data-lead="'+l.id+'">'+(l.site?'<span class="new">'+ic('bolt')+t('fromSiteNow')+'</span>':'')+'<b>'+h(l.co||l.nm)+'</b><span>'+grp(l.area)+' m² · '+h(whereTxt(l))+'</span><small>'+t('src_'+l.src)+' · '+dstr(l.ts)+(l.br?' · '+h(TEAM[l.br].n.split(' ')[0]):'')+'</small>'+(l.st==='lost'?'<em>'+t(l.reason||'r_silent')+'</em>':'')+'</button>'}

function leadSide(id){var l=leadById(id);if(!l)return;var r=R(),i=STG.indexOf(l.st),kp=(PS.leads[id]&&PS.leads[id].kp)||l.kp||[];
  var steps='<ol class="steps">'+STG.map(function(s,j){return '<li class="'+(j<i||l.st==='moved'?'done':j===i?'now':'')+'">'+t('st_'+s)+'</li>'}).join('')+'</ol>';
  var need='<dl class="kv"><dt>'+t('contact')+'</dt><dd>'+h(l.nm)+(l.ph?'<br><small>'+h(l.ph)+'</small>':'')+'</dd>'+(l.co?'<dt>'+t('company')+'</dt><dd>'+h(l.co)+' <small class="muted">'+t('demo')+'</small></dd>':'')+'<dt>'+t('need')+'</dt><dd>'+grp(l.area)+' m² · '+t('f_'+l.fmt)+'</dd><dt>'+t('where')+'</dt><dd>'+h(whereTxt(l))+(l.unit?', '+t('unitN',{n:l.unit}):'')+'</dd>'+(l.budget?'<dt>'+t('budget')+'</dt><dd>'+t('upTo')+' '+money(l.budget)+'</dd>':'')+(l.day?'<dt>'+t('viewWish')+'</dt><dd>'+h(l.day)+', '+h(l.time)+'</dd>':'')+'<dt>'+t('source')+'</dt><dd>'+t('src_'+l.src)+(l.ch?' · '+(l.ch==='wa'?'WhatsApp':'Telegram'):'')+'</dd><dt>'+t('created')+'</dt><dd>'+dfull(l.ts)+' '+tstr(l.ts)+'</dd></dl>';
  var br='<label class="fld"><span>'+t('broker')+'</span><select data-lbr="'+id+'"'+(r.deal?'':' disabled')+'><option value="">'+t('noBroker')+'</option>'+BROKERS.map(function(b){return '<option value="'+b+'"'+(l.br===b?' selected':'')+'>'+h(TEAM[b].n)+'</option>'}).join('')+'</select></label>';
  var acts='';if(r.deal&&l.st!=='moved'&&l.st!=='lost'){
    if(l.st==='new')acts+=btn(ic('cal')+t('setView'),'data-act="view-new" data-id="'+id+'"','pri');
    if(l.st==='new'||l.st==='view')acts+=btn(ic('doc')+t('makeKp'),'data-act="kp" data-id="'+id+'"',l.st==='view'?'pri':'');
    if(l.st==='offer')acts+=btn(ic('doc')+t('makeLease'),'data-act="lease-new" data-id="'+id+'"','pri')+btn(ic('doc')+t('makeKp'),'data-act="kp" data-id="'+id+'"');
    if(l.st==='contract')acts+=btn(ic('key')+t('moveIn'),'data-act="move-in" data-id="'+id+'"','pri');
    acts+=btn(t('lose'),'data-act="lose" data-id="'+id+'"','ghost')}
  var kpH=kp.length?'<div class="kp-l"><b>'+t('kpSent')+'</b><p>'+kp.map(function(k){var x=UK[k];return x?h(ulab(x))+' · '+grp(x.a)+' m²':h(BC[k]?BC[k].n:k)}).join('<br>')+'</p><code>soffice.uz/kp/'+id.toLowerCase()+'</code></div>':'';
  var lease=l.lease&&LSK[l.lease]?'<a class="row-l" href="#leases" data-ls="'+l.lease+'">'+ic('doc')+t('leaseN',{n:l.lease})+'</a>':'';
  var qr=quick(l,kp);
  var lost=l.st==='lost'?'<p class="lost">'+t('lostWhy')+': <b>'+t(l.reason||'r_silent')+'</b></p>':'';
  var hist=(PS.log.filter(function(x){return x.o===id})).map(function(x){return '<li><time>'+dstr(x.ts)+' '+tstr(x.ts)+'</time>'+logText(x)+'</li>'}).join('')+'<li><time>'+dstr(l.ts)+' '+tstr(l.ts)+'</time>'+t('lg_created',{s:t('src_'+l.src)})+'</li>';
  openSide('<header class="sd-h"><div><small>'+l.id+(l.site?' · '+t('fromSiteNow'):'')+'</small><h2>'+h(l.co||l.nm)+'</h2></div>'+lstTag(l.st)+'</header>'+steps+(r.deal&&l.st!=='moved'&&l.st!=='lost'?'<button type="button" class="next" data-act="next" data-id="'+id+'">'+ic('play')+'<span>'+t('nextStep')+'<small>'+t('nextS_'+l.st)+'</small></span></button>':'')+
    need+br+(acts?'<div class="acts">'+acts+'</div>':'')+lost+kpH+lease+qr+'<h3>'+t('history')+'</h3><ul class="hist">'+hist+'</ul>')}
function quick(l,kp){var n=l.site?'':(l.nm||'').split(' ')[0],link='https://soffice.uz/kp/'+l.id.toLowerCase(),bc=l.bc?BC[l.bc].n:whereTxt(l);
  var q=[['q_hello',{n:n,a:grp(l.area),w:bc}],['q_view',{n:n,b:bc,d:l.day||t('tomorrowW'),h:l.time||'15:00'}],['q_kp',{n:n,c:kp.length||3,l:link}],['q_docs',{n:n}]];
  return '<h3>'+t('quick')+'</h3><div class="qr">'+q.map(function(x){var s=U[x[0]+'T'];if(!n){s=s.replace(/^\{n\}, /,'').replace(/ \{n\}/,'');s=s.charAt(0).toUpperCase()+s.slice(1)}s=t2(s,x[1]);return '<div class="qr-i"><b>'+t(x[0])+'</b><p>'+h(s)+'</p><span><a class="b sm" href="https://wa.me/?text='+encodeURIComponent(s)+'" target="_blank" rel="noopener">'+ic('wa')+'WhatsApp</a><a class="b sm" href="https://t.me/share/url?url='+encodeURIComponent(link)+'&amp;text='+encodeURIComponent(s)+'" target="_blank" rel="noopener">'+ic('tg')+'Telegram</a></span></div>'}).join('')+'</div>'}

/* Сделка: шаги */
function freeUnits(l,limit){var list=UN.filter(function(x){return st(x)==='f'&&(!l.bc||x.bc===l.bc)&&(!l.where||l.where.charAt(0)!=='d'||BC[x.bc].d===l.where.slice(2))});
  list.sort(function(a,b){return Math.abs(a.a-l.area)-Math.abs(b.a-l.area)});if(list.length<3)list=list.concat(UN.filter(function(x){return st(x)==='f'&&list.indexOf(x)<0}).sort(function(a,b){return Math.abs(a.a-l.area)-Math.abs(b.a-l.area)}));return list.slice(0,limit||8)}
function viewNew(l,auto){var bc=l.bc||(freeUnits(l,1)[0]||UN[0]).bc,dd=T0+DAY;if(new Date(dd).getDay()===0)dd+=DAY;var v={id:'V-'+(800+PS.newViews.length),ts:dd+15*36e5,bc:bc,br:l.br||BROKERS[0],lead:l.id,res:'plan'};
  if(l.site&&l.dayTs&&l.time)return v;PS.newViews.unshift(v);return v}
function stepView(id){var l=leadById(id),br=l.br||BROKERS[0];var v=viewNew(l);leadSet(id,{st:'view',br:br,bc:l.bc||v.bc},['view_set',BC[v.bc].n+', '+dstr(v.ts)+' '+tstr(v.ts)]);toast(t('tView',{b:BC[v.bc].n,d:dstr(v.ts)+' '+tstr(v.ts)}))}
function kpOpen(id){var l=leadById(id),list=freeUnits(l,8);
  modal('<h2>'+t('kpH')+'</h2><p class="muted">'+t('kpS')+'</p><ul class="kp-pick">'+list.map(function(x,i){var b=BC[x.bc];return '<li><label><input type="checkbox" value="'+x.k+'"'+(i<3?' checked':'')+'><img src="/protos/soffice/b-'+b.id+'-560.webp" alt="" width="96" height="60" loading="lazy"><span><b>'+h(ulab(x))+'</b><small>'+grp(x.a)+' m² · '+b.cls+' · '+money(x.a*b.rate)+' '+t('perMo')+'</small></span></label></li>'}).join('')+'</ul><div class="acts">'+btn(ic('doc')+t('kpGo'),'data-act="kp-go" data-id="'+id+'"','pri')+btn(t('cancel'),'data-close')+'</div>')}
function kpGo(id){var ks=$$('.kp-pick input:checked').map(function(i){return i.value});if(!ks.length){toast(t('kpNone'));return}var l=leadById(id);
  ks.forEach(function(k){if(st(UK[k])==='f')PS.u[k]='h'});leadSet(id,{st:'offer',kp:ks,br:l.br||BROKERS[0],bc:l.bc||UK[ks[0]].bc,lostAt:2},['kp',ks.length+' · soffice.uz/kp/'+id.toLowerCase()]);closeModal();toast(t('tKp',{n:ks.length}));leadSide(id);render()}
function leaseNew(id){var l=leadById(id),kp=((PS.leads[id]&&PS.leads[id].kp)||[]).filter(function(k){return UK[k]}),k=kp[0]||freeUnits(l,1)[0].k,x=UK[k],b=BC[x.bc];
  var n=PS.newLeases.length,lid='D-'+(3101+n),start=T0+DAY,ls={id:lid,bc:x.bc,fl:x.fl,uk:[k],area:x.a,rate:b.rate,start:start,end:addM(start,12)-DAY,term:12,idx:7,dep:1,since:new Date(NOW).getFullYear(),auto:false,t:l.co||(l.nm+' ('+t('fromSite')+')'),nm:l.nm,ph:l.ph||'',spots:Math.round(x.a/90),lead:id};
  PS.newLeases.unshift(ls);PS.u[k]='l';kp.slice(1).forEach(function(q){if(PS.u[q]==='h')PS.u[q]='f'});
  var m=CUR,bill={id:'S-'+m+'-N'+n,ls:lid,m:m,rent:ls.area*ls.rate,util:ls.area*G.tariff.util,park:ls.spots*G.tariff.park,dep:ls.area*ls.rate*ls.dep,due:T0+5*DAY};PS.newBills.unshift(bill);
  leadSet(id,{st:'contract',lease:lid,lostAt:3},['lease',lid+' · '+ulab(x)]);addNewLeases();addNewBills();toast(t('tLease',{n:lid}));leadSide(id);render()}
function moveIn(id){var l=leadById(id),b=BL.filter(function(x){return x.ls.id===l.lease})[0];if(b&&!bPaid(b)&&!moveIn.force){toast(t('tNeedPay'));billSide(b.id);return}leadSet(id,{st:'moved'},['moved',l.lease||''])
  ;if(l.lease){var tk={id:'E-'+(1000+PS.newTickets.length),ts:NOW,type:'pass',bc:LSK[l.lease].bc,ls:l.lease,txt:t('tx_movein'),who:OPS[0],due:NOW+24*36e5,st:'new'};PS.newTickets.unshift(tk);save()}
  toast(t('tMoved'));leadSide(id);render()}
function nextStep(id){var l=leadById(id);if(l.st==='new'){if(!l.br)leadSet(id,{br:BROKERS[0]});stepView(id)}
  else if(l.st==='view'){var v=viewsAll().filter(function(v){return v.lead===id})[0];if(v){PS.views[v.id]={res:'liked'};save()}var ks=freeUnits(l,3).map(function(x){return x.k});ks.forEach(function(k){PS.u[k]='h'});leadSet(id,{st:'offer',kp:ks,lostAt:2},['kp',ks.length+' · soffice.uz/kp/'+id.toLowerCase()]);toast(t('tKp',{n:ks.length}))}
  else if(l.st==='offer'){leaseNew(id);return}
  else if(l.st==='contract'){var b=BL.filter(function(x){return x.ls.id===l.lease})[0];if(b&&!bPaid(b)){PS.pay[b.id]={ts:NOW,how:'payme'};save();logAdd('pay',b.ls.id,money(bTotal(b))+' · Payme');toast(t('tPaid'))}else{moveIn(id);return}}
  leadSide(id);render()}
function loseOpen(id){modal('<h2>'+t('loseH')+'</h2><div class="rs">'+REASONS.map(function(r){return btn(t(r),'data-act="lose-go" data-id="'+id+'" data-r="'+r+'"')}).join('')+'</div><div class="acts">'+btn(t('cancel'),'data-close')+'</div>')}
function newLead(){var n=PS.newLeads.length,b=pick(G.bc),l={id:'Z-'+(3700+n),ts:NOW,src:'call',nm:pick(G.first)+' '+pick(G.lastI),co:tenantName(900+n),ph:'+998 90 *** '+pad(40+n)+' 17',area:120,where:'b:'+b.id,bc:b.id,budget:Math.round(120*b.rate/1e6+5)*1e6,fmt:'office',br:'',st:'new',reason:'',kp:[]};
  PS.newLeads.unshift(l);save();logAdd('lead_new',l.id,'');render();leadSide(l.id)}

/* ── Просмотры: неделя по БЦ и брокерам ─────────────────────────────── */
var VF={wk:0,bc:'',br:''};
V.views=function(){var r=R(),mon=T0-((new Date(T0).getDay()+6)%7)*DAY+VF.wk*7*DAY,days=[0,1,2,3,4,5].map(function(i){return mon+i*DAY});
  var list=viewsAll().filter(function(v){return scope(v.bc)&&(!VF.bc||v.bc===VF.bc)&&(!VF.br||v.br===VF.br)&&(PS.role!=='broker'||!VF.mine||v.br===BROKERS[0])});
  var tools='<div class="tools"><div class="seg">'+btn(ic('chevl'),'data-wk="-1" aria-label="'+h(t('prevWk'))+'"')+'<span class="wk">'+dstr(days[0])+' · '+dstr(days[5])+'</span>'+btn(ic('chev'),'data-wk="1" aria-label="'+h(t('nextWk'))+'"')+'</div>'+
    '<select id="vbc" aria-label="'+h(t('bcCol'))+'"><option value="">'+t('allBc')+'</option>'+bcsIn().map(function(b){return '<option value="'+b.id+'"'+(VF.bc===b.id?' selected':'')+'>'+h(b.n)+'</option>'}).join('')+'</select><select id="vbr" aria-label="'+h(t('broker'))+'"><option value="">'+t('allBrokers')+'</option>'+BROKERS.map(function(b){return '<option value="'+b+'"'+(VF.br===b?' selected':'')+'>'+h(TEAM[b].n)+'</option>'}).join('')+'</select></div>';
  var grid='<div class="tw"><table class="cal"><thead><tr><th></th>'+days.map(function(dd){return '<th class="'+(dd===T0?'today':'')+'">'+t('dw')[new Date(dd).getDay()]+' <b>'+dstr(dd)+'</b></th>'}).join('')+'</tr></thead><tbody>'+SLOTS.map(function(s){return '<tr><th>'+s+':00</th>'+days.map(function(dd){var cell=list.filter(function(v){return v.ts>=dd+s*36e5&&v.ts<dd+(s+1)*36e5});
    return '<td>'+cell.map(function(v){var l=leadById(v.lead);return '<button type="button" class="vc r-'+v.res+(v.site?' site':'')+'" data-view="'+v.id+'"><b>'+h(BC[v.bc].n)+'</b><span>'+h(l?(l.co||l.nm):v.lead)+'</span><small>'+(v.br?h(TEAM[v.br].n.split(' ')[0]):t('noBroker'))+' · '+t('res_'+v.res)+'</small></button>'}).join('')+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div>';
  var wk=list.filter(function(v){return v.ts>=days[0]&&v.ts<days[0]+7*DAY}),past=list.filter(function(v){return v.ts<NOW&&v.ts>NOW-30*DAY});
  var res={};past.forEach(function(v){res[v.res]=(res[v.res]||0)+1});
  var byBr=BROKERS.map(function(b){var m=past.filter(function(v){return v.br===b});return {n:h(TEAM[b].n),v:m.length,s:t('likedN',{n:m.filter(function(v){return v.res==='liked'}).length})}});
  return ph(t('viewsH'),t('viewsS'))+tools+'<div class="kpis">'+kpi(t('wkViews'),grp(wk.length),t('wkViewsS'))+kpi(t('res_liked'),grp(res.liked||0),t('in30'))+kpi(t('res_noshow'),grp(res.noshow||0),pct((res.noshow||0)/Math.max(1,past.length))+' '+t('ofViews'))+'</div>'+
    card(t('calH'),grid+'<ul class="lgd">'+['plan','came','liked','think','noshow'].map(function(x){return '<li><i class="r-'+x+'"></i>'+t('res_'+x)+'</li>'}).join('')+'</ul>','w3')+'<div class="cols">'+card(t('byBroker'),hbars(byBr))+'</div>'};
function viewSide(id){var v=viewsAll().filter(function(x){return x.id===id})[0];if(!v)return;var l=leadById(v.lead),r=R(),can=r.deal||PS.role==='ops';
  openSide('<header class="sd-h"><div><small>'+v.id+'</small><h2>'+h(BC[v.bc].n)+'</h2></div><span class="tag r-'+v.res+'">'+t('res_'+v.res)+'</span></header><dl class="kv"><dt>'+t('when')+'</dt><dd>'+t('dw')[new Date(v.ts).getDay()]+', '+dfull(v.ts)+' '+tstr(v.ts)+'</dd><dt>'+t('lead')+'</dt><dd>'+(l?'<a href="#leads" data-lead="'+l.id+'">'+h(l.co||l.nm)+'</a>':v.lead)+'</dd><dt>'+t('broker')+'</dt><dd>'+(v.br?h(TEAM[v.br].n):t('noBroker'))+'</dd><dt>'+t('address')+'</dt><dd>'+h(BC[v.bc].a)+', '+h(BC[v.bc].m)+'</dd></dl>'+
    (can?'<h3>'+t('result')+'</h3><div class="rs">'+['came','liked','think','noshow'].map(function(x){return btn(t('res_'+x),'data-act="vres" data-id="'+id+'" data-r="'+x+'"',v.res===x?'on':'')}).join('')+'</div><div class="acts">'+btn(ic('cal')+t('repeat'),'data-act="vrep" data-id="'+id+'"','pri')+'</div>':'')+
    '<p class="hint">'+t('viewHint')+'</p>')}

/* ── Объекты: БЦ, этажи, блоки ──────────────────────────────────────── */
var OF={bc:'',fl:0,u:''};
V.objects=function(q){if(!q||!q.bc)OF.bc='';else if(q.bc!==OF.bc&&scope(q.bc)){OF.bc=q.bc;OF.fl=0;OF.u=''}var r=R();if(OF.bc&&!scope(OF.bc))OF.bc='';
  if(!OF.bc)return ph(t('objH'),t('objS'))+'<div class="bcg">'+bcsIn().map(function(b){var s=bcStats(b.id);return '<a class="bcc" href="#objects?bc='+b.id+'"><img src="/protos/soffice/b-'+b.id+'-560.webp" alt="'+h(b.n)+'" width="560" height="350" loading="lazy"><span class="cls">'+b.cls+'</span><div><b>'+h(b.n)+'</b><small>'+h(b.dn)+' · '+G.inv[b.id].fl+' '+t('floorsW')+' · '+grp(s.a)+' m²</small><span class="bar" style="--k:'+s.occ.toFixed(3)+'"><i></i></span><small>'+t('occShort',{p:pct(s.occ,1),a:grp(s.free),n:s.fu})+'</small><small>'+t('rateW')+': '+grp(b.rate)+' '+t('perM2')+(b.rate!==b.rate0?' <em>'+t('changed')+'</em>':'')+'</small></div></a>'}).join('')+'</div>';
  var b=BC[OF.bc],inv=G.inv[b.id],s=bcStats(b.id),fls=[];for(var f=0;f<inv.fl;f++)fls.push(f);
  var units=UN.filter(function(x){return x.bc===b.id&&x.fl===OF.fl+2}),sel=OF.u?UK[OF.u]:null;
  var svg='<svg class="fl-svg" viewBox="0 0 100 60" role="group" aria-label="'+h(t('floorN',{n:OF.fl+2}))+'"><rect class="fl-shell" x="1" y="1" width="98" height="58" rx="1.2"/><rect class="fl-cor" x="2" y="25" width="96" height="10"/><rect class="fl-core" x="44" y="36" width="14" height="22"/><text class="fl-tx" x="51" y="47.5">'+t('lifts')+'</text>'+
    units.map(function(x){var g=G.units[x.u],sx=st(x);return '<g class="u s-'+sx+(sel===x?' pick':'')+'" data-unit="'+x.k+'" tabindex="0" role="button" aria-label="'+h(t('unitN',{n:x.fl+'.'+x.n})+', '+x.a+' m², '+t('u_'+sx))+'"><rect x="'+(g.r[0]+.4)+'" y="'+(g.r[1]+.4)+'" width="'+(g.r[2]-.8)+'" height="'+(g.r[3]-.8)+'" rx=".8"/><text x="'+(g.r[0]+g.r[2]/2)+'" y="'+(g.r[1]+g.r[3]/2-1)+'">'+x.n+'</text><text class="a" x="'+(g.r[0]+g.r[2]/2)+'" y="'+(g.r[1]+g.r[3]/2+4)+'">'+x.a+' m²</text></g>'}).join('')+'</svg>';
  var info=sel?unitInfo(sel):'<p class="muted">'+(r.obj&&!r.ro?t('tapUnit'):t('tapUnitRo'))+'</p>';
  var rateBox=r.obj===2?'<form class="rate" data-rate="'+b.id+'"><label><span>'+t('rateEdit')+'</span><input type="number" inputmode="numeric" step="1000" min="100000" max="2000000" value="'+b.rate+'" name="r"></label>'+btn(t('save'),'type="submit"','pri')+(b.rate!==b.rate0?btn(t('reset'),'data-act="rate-reset" data-id="'+b.id+'"','ghost'):'')+'<small>'+t('rateNote',{m:grp(G.market[b.cls])})+'</small></form>':'';
  return ph(h(b.n)+' <span class="cls">'+b.cls+'</span>',h(b.a)+' · '+h(b.dn)+' · '+h(b.m),'<a class="b ghost" href="#objects">'+ic('chevl')+t('allObj')+'</a>')+
    '<div class="kpis">'+kpi(t('occ'),pct(s.occ,1),grp(s.let)+' / '+grp(s.a)+' m²','big')+kpi(t('freeM2'),grp(s.free)+' m²',t('freeN',{n:s.fu}))+kpi(t('u_h'),grp(s.hold)+' m²',t('holdS'))+kpi(t('idle'),t('daysN',{n:Math.round(s.idle)}),t('idleS'))+'</div>'+
    '<div class="cols obj">'+card(t('floorPlan'),'<div class="fls" role="tablist">'+fls.map(function(f){var fu=UN.filter(function(x){return x.bc===b.id&&x.fl===f+2&&st(x)==='f'}).length;return '<button type="button" role="tab" aria-selected="'+(OF.fl===f)+'" data-fl="'+f+'">'+(f+2)+(fu?'<i>'+fu+'</i>':'')+'</button>'}).join('')+'</div>'+svg+'<ul class="lgd">'+['f','h','l','r'].map(function(x){return '<li><i class="s-'+x+'"></i>'+t('u_'+x)+'</li>'}).join('')+'</ul>'+(b.id==='platform'&&(OF.fl===1||OF.fl===2)?'<p class="hint site">'+ic('link')+t('sameAsSite')+' <a href="'+G.site+'#etazh" target="_blank" rel="noopener">'+t('openSite')+'</a></p>':'<p class="hint">'+t('planHint')+'</p>'),'w2')+
    card(t('unitCard'),info)+'</div>'+(rateBox?card(t('rateH'),rateBox+'<p class="hint">'+t('rateSite')+' <a href="'+G.site+'#katalog" target="_blank" rel="noopener">'+t('openSite')+'</a></p>'):'')};
function unitInfo(x){var r=R(),s=st(x),b=BC[x.bc],l=s==='l'?(x.ls||null):null,can=!r.ro&&(r.obj===1||r.obj===2||r.obj===3);
  return '<img class="u-pic" src="/protos/soffice/b-'+b.id+'-560.webp" alt="'+h(b.n)+'" width="560" height="350" loading="lazy"><h3>'+t('unitN',{n:x.fl+'.'+x.n})+' '+stTag(s)+'</h3><dl class="kv"><dt>'+t('areaCol')+'</dt><dd>'+x.a+' m²</dd><dt>'+t('windows')+'</dt><dd>'+h(G.units[x.u].w)+'</dd><dt>'+t('rateW')+'</dt><dd>'+grp(b.rate)+' '+t('perM2')+'</dd><dt>'+t('perMo')+'</dt><dd>'+money(b.rate*x.a)+'</dd>'+(s==='f'?'<dt>'+t('idle')+'</dt><dd>'+t('daysN',{n:PS.u[x.k]?0:x.idle})+'</dd>':'')+(l?'<dt>'+t('tenant')+'</dt><dd><a href="#leases" data-ls="'+l.id+'">'+h(l.t)+'</a><br><small>'+t('until',{d:dfull(lsEnd(l))})+'</small></dd>':'')+'</dl>'+
    (can?'<div class="sts" role="group" aria-label="'+h(t('status'))+'">'+['f','h','l','r'].map(function(z){var dis=r.obj===3&&z!=='r'&&z!=='f';return btn(t('u_'+z),'data-act="ust" data-k="'+x.k+'" data-s="'+z+'"'+(dis?' disabled':''),'s-'+z+(s===z?' on':''))}).join('')+'</div><p class="hint">'+t('stHint')+'</p>':'')}
function unitSet(k,s){var x=UK[k],was=st(x);if(was===s)return;if(s===x.s0)delete PS.u[k];else PS.u[k]=s;save();logAdd('unit',ulab(x),t('u_'+was)+' → '+t('u_'+s));OF.u=k;render();toast(t('tUnit',{u:ulab(x),s:t('u_'+s)}))}

/* ── Арендаторы и договоры ──────────────────────────────────────────── */
var CF={f:'all',q:'',lim:40};
V.leases=function(q){if(q&&q.f)CF.f=q.f;var r=R();
  var list=LS.filter(function(l){var e=lsEnd(l);return scope(l.bc)&&(CF.f==='all'||(CF.f==='exp'&&e>NOW&&e<NOW+90*DAY)||(CF.f==='new'&&l.start>NOW-60*DAY)||(CF.f==='auto'&&l.auto))&&(!CF.q||(l.t+' '+l.id+' '+BC[l.bc].n).toLowerCase().indexOf(CF.q.toLowerCase())>=0)});
  if(CF.f==='exp')list.sort(function(a,b){return lsEnd(a)-lsEnd(b)});
  var tenants={};LS.forEach(function(l){if(scope(l.bc))tenants[l.t]=1});
  var area=list.reduce(function(s,l){return s+l.area},0);
  return ph(t('lsH'),t('lsS'))+'<div class="kpis">'+kpi(t('tenants'),grp(Object.keys(tenants).length),t('tenantsS'))+kpi(t('leasesN'),grp(LS.filter(function(l){return scope(l.bc)}).length),grp(area)+' m² '+t('inList'))+kpi(t('expiring'),grp(LS.filter(function(l){var e=lsEnd(l);return scope(l.bc)&&e>NOW&&e<NOW+90*DAY}).length),t('in90'))+'</div>'+
    '<div class="tools"><label class="sr">'+ic('search')+'<span class="vh">'+t('search')+'</span><input type="search" id="cq" placeholder="'+h(t('searchLs'))+'" value="'+h(CF.q)+'"></label><div class="seg" role="radiogroup">'+['all','exp','new','auto'].map(function(f){return '<button type="button" role="radio" aria-checked="'+(CF.f===f)+'" data-cf="'+f+'">'+t('cf_'+f)+'</button>'}).join('')+'</div></div>'+
    card(t('lsList'),'<table class="tb"><thead><tr><th>'+t('tenant')+'</th><th>'+t('bcCol')+'</th><th class="r hm">'+t('areaCol')+'</th><th class="r hm">'+t('rateW')+'</th><th class="r">'+t('ends')+'</th><th class="hm">'+t('idxCol')+'</th></tr></thead><tbody>'+list.slice(0,CF.lim).map(function(l){var e=lsEnd(l),dl=Math.ceil((e-NOW)/DAY);return '<tr class="click'+(l.fresh?' site':'')+'" data-ls="'+l.id+'"><td><b>'+h(l.t)+'</b><small class="sub">'+l.id+' · '+t('since',{y:l.since})+'</small></td><td>'+h(BC[l.bc].n)+' <small class="sub">'+t('floorN',{n:l.fl})+'</small></td><td class="r hm">'+grp(l.area)+'</td><td class="r hm">'+grp(l.rate)+'</td><td class="r"><span class="'+(dl<=30?'bad':dl<=90?'warn':'')+'">'+dfull(e)+'</span></td><td class="hm">'+(l.idx?'+'+l.idx+'%':t('noIdx'))+(l.auto?' · '+t('autoP'):'')+'</td></tr>'}).join('')+'</tbody></table>'+(list.length>CF.lim?'<button type="button" class="more" data-act="more-ls">'+t('showMore',{n:list.length-CF.lim})+'</button>':''),'w3')};
function lsSide(id){var l=LSK[id];if(!l)return;var r=R(),e=lsEnd(l),dl=Math.ceil((e-NOW)/DAY),mo=lsMonthly(l),bills=BL.filter(function(b){return b.ls===l}).sort(function(a,b){return b.m-a.m});
  var can=r.deal||r.bill;
  openSide('<header class="sd-h"><div><small>'+l.id+' · '+t('demo')+'</small><h2>'+h(l.t)+'</h2></div>'+(dl<=90?'<span class="tag warn">'+t('inDays',{n:dl})+'</span>':'')+'</header>'+
    '<dl class="kv"><dt>'+t('bcCol')+'</dt><dd>'+h(BC[l.bc].n)+', '+t('floorN',{n:l.fl})+'</dd><dt>'+t('units')+'</dt><dd>'+l.units.map(function(x){return x.fl+'.'+x.n+' ('+x.a+' m²)'}).join(', ')+'</dd><dt>'+t('areaCol')+'</dt><dd>'+grp(l.area)+' m²</dd><dt>'+t('term')+'</dt><dd>'+dfull(l.start)+' · '+dfull(e)+' ('+t('monthsN',{n:l.term})+')</dd><dt>'+t('rateW')+'</dt><dd>'+grp(l.rate)+' '+t('perM2')+'</dd><dt>'+t('idxCol')+'</dt><dd>'+(l.idx?t('idxTxt',{n:l.idx}):t('noIdx'))+'</dd>'+
    (r.m||r.deal?'<dt>'+t('perMo')+'</dt><dd>'+money(mo)+'<br><small>'+t('moParts',{r:money(l.area*l.rate),u:money(l.area*G.tariff.util),p:money(l.spots*G.tariff.park)})+'</small></dd><dt>'+t('deposit')+'</dt><dd>'+money(l.area*l.rate*l.dep)+' ('+t('monthsN',{n:l.dep})+')</dd>':'')+'<dt>'+t('prolong')+'</dt><dd>'+(l.auto?t('autoYes'):t('autoNo'))+'</dd><dt>'+t('contact')+'</dt><dd>'+h(l.nm)+'<br><small>'+h(l.ph)+'</small></dd></dl>'+
    (dl<=90?'<p class="warnbox">'+ic('cal')+t('expWarn',{n:dl})+'</p>':'')+
    '<h3>'+t('docs')+'</h3><div class="acts">'+['doc_lease','doc_add','doc_act'].map(function(k){return btn(ic('doc')+t(k),'data-act="doc" data-id="'+id+'" data-k="'+k+'"')}).join('')+'</div>'+
    (can&&!r.ro?'<div class="acts">'+btn(ic('bell')+t('remindEnd'),'data-act="ls-remind" data-id="'+id+'"')+btn(ic('cal')+t('prolongBtn'),'data-act="ls-prolong" data-id="'+id+'"','pri')+'</div>':'')+
    (r.m?'<h3>'+t('bills')+'</h3><ul class="bl-mini">'+bills.map(function(b){var s=bSt(b);return '<li data-bill="'+b.id+'"><span>'+mname(b.m)+'</span><b>'+money(bTotal(b))+'</b><span class="tag b-'+s+'">'+t('b_'+s)+'</span></li>'}).join('')+'</ul>':''))}
function docOpen(id,k){var l=LSK[id],b=BC[l.bc],e=lsEnd(l),v={no:l.id,d:dfull(NOW),t:l.t,bc:b.n,a:b.a,fl:l.fl,u:l.units.map(function(x){return x.fl+'.'+x.n}).join(', '),s:grp(l.area),r:grp(l.rate),m:money(l.area*l.rate),from:dfull(l.start),to:dfull(e),i:l.idx,dep:money(l.area*l.rate*l.dep),nto:dfull(addM(e+DAY,12)-DAY),nr:grp(Math.round(l.rate*(1+l.idx/100)/1000)*1000)};
  var paras=t(k+'_p').map(function(p){return '<p>'+h(t2(p,v))+'</p>'}).join('');
  modal('<article class="doc" id="doc"><header><img src="/protos/soffice/logo.webp" alt="Soffice" width="574" height="127"><small>'+t('tplNote')+'</small></header><h2>'+h(t2(t(k+'_h'),v))+'</h2><p class="muted">'+t('docCity')+', '+v.d+'</p>'+paras+'<footer><div><b>'+t('lessor')+'</b><small>Soffice · Global Property Group</small></div><div><b>'+t('lessee')+'</b><small>'+h(l.t)+'</small></div></footer></article><div class="acts">'+btn(ic('print')+t('printPdf'),'data-act="print"','pri')+btn(t('close'),'data-close')+'</div>');logAdd('doc',id,t(k))}
function t2(s,v){for(var x in v)s=s.split('{'+x+'}').join(v[x]);return s}

/* ── Счета и оплаты ─────────────────────────────────────────────────── */
var BF={m:CUR,st:'all',lim:40};
V.bills=function(q){if(q&&q.st)BF.st=q.st;var r=R(),f=function(id){return scope(id)};
  var list=BL.filter(function(b){return f(b.ls.bc)&&(BF.st==='late'?bSt(b)==='late':b.m===BF.m&&(BF.st==='all'||bSt(b)===BF.st))});
  list.sort(function(a,b){var o={late:0,open:1,paid:2};return o[bSt(a)]-o[bSt(b)]||bAge(b)-bAge(a)});
  var mo=money4(BF.m,f),dbt=debts(f),how={};BL.forEach(function(b){var p=bPaid(b);if(p&&b.m===BF.m&&f(b.ls.bc))how[p.how]=(how[p.how]||0)+bTotal(b)});
  return ph(t('billsH'),t('billsS'))+'<div class="kpis">'+kpi(t('charged'),money(mo.ch),mname(BF.m))+kpi(t('paid'),money(mo.pd),pct(mo.pd/Math.max(1,mo.ch))+' '+t('ofCharged'))+kpi(t('debt'),money(dbt.s),t('debtN',{n:dbt.n}),dbt.s?'bad':'')+'</div>'+
    '<div class="cols">'+card(t('debtAge'),hbars([0,1,2,3].map(function(i){return {n:t('age'+i),v:dbt.b[i],c:i>1?'var(--bad)':'var(--or)'}}),function(v){return money(v)}))+card(t('payHow'),hbars(['bank','click','payme'].map(function(k){return {n:t('how_'+k),v:how[k]||0}}),function(v){return money(v)}))+'</div>'+
    '<div class="tools"><select id="bm" aria-label="'+h(t('month'))+'">'+[0,1,2,3].map(function(i){var m=CUR-i;return '<option value="'+m+'"'+(BF.m===m?' selected':'')+'>'+mname(m)+'</option>'}).join('')+'</select><div class="seg" role="radiogroup">'+['all','late','open','paid'].map(function(s){return '<button type="button" role="radio" aria-checked="'+(BF.st===s)+'" data-bf="'+s+'">'+t('bf_'+s)+'</button>'}).join('')+'</div></div>'+
    card(BF.st==='late'?t('lateAll'):t('billsOf',{m:mname(BF.m)}),'<table class="tb"><thead><tr><th>'+t('tenant')+'</th><th class="hm">'+t('bcCol')+'</th><th class="r">'+t('sumCol')+'</th><th>'+t('status')+'</th><th class="r hm">'+t('due')+'</th></tr></thead><tbody>'+list.slice(0,BF.lim).map(function(b){var s=bSt(b);return '<tr class="click'+(b.fresh?' site':'')+'" data-bill="'+b.id+'"><td><b>'+h(b.ls.t)+'</b><small class="sub">'+b.id+(BF.st==='late'?' · '+mname(b.m):'')+'</small></td><td class="hm">'+h(BC[b.ls.bc].n)+'</td><td class="r">'+money(bTotal(b))+'</td><td><span class="tag b-'+s+'">'+t('b_'+s)+(s==='late'?' · '+t('daysN',{n:bAge(b)}):'')+'</span>'+(PS.remind[b.id]?' <small class="muted">'+t('reminded')+'</small>':'')+'</td><td class="r hm">'+dstr(b.due)+'</td></tr>'}).join('')+'</tbody></table>'+(list.length>BF.lim?'<button type="button" class="more" data-act="more-b">'+t('showMore',{n:list.length-BF.lim})+'</button>':''),'w3')};
function billSide(id){var b=BL.filter(function(x){return x.id===id})[0];if(!b)return;var r=R(),s=bSt(b),p=bPaid(b),l=b.ls;
  var msg=t('remindT',{t:l.t,m:mname(b.m),s:money(bTotal(b)),d:dfull(b.due)});
  openSide('<header class="sd-h"><div><small>'+b.id+'</small><h2>'+h(l.t)+'</h2></div><span class="tag b-'+s+'">'+t('b_'+s)+'</span></header><dl class="kv"><dt>'+t('month')+'</dt><dd>'+mname(b.m)+'</dd><dt>'+t('l_rent')+'</dt><dd>'+money(b.rent)+'<br><small>'+grp(l.area)+' m² × '+grp(l.rate)+'</small></dd><dt>'+t('l_util')+'</dt><dd>'+money(b.util)+'</dd><dt>'+t('l_park')+'</dt><dd>'+money(b.park)+' <small>('+l.spots+')</small></dd>'+(b.dep?'<dt>'+t('deposit')+'</dt><dd>'+money(b.dep)+'</dd>':'')+'<dt>'+t('sumCol')+'</dt><dd><b>'+money(bTotal(b))+'</b></dd><dt>'+t('due')+'</dt><dd>'+dfull(b.due)+(s==='late'?' · <span class="bad">'+t('lateD',{n:bAge(b)})+'</span>':'')+'</dd>'+(p?'<dt>'+t('paidAt')+'</dt><dd>'+dfull(p.ts)+' · '+t('how_'+p.how)+'</dd>':'')+'</dl>'+
    (!p&&r.bill?'<h3>'+t('markPaid')+'</h3><div class="rs pay">'+['click','payme','bank'].map(function(k){return btn(t('how_'+k),'data-act="pay" data-id="'+id+'" data-h="'+k+'"','pay-'+k)}).join('')+'</div><h3>'+t('remindH')+'</h3><p class="msg">'+h(msg)+'</p><div class="acts"><a class="b pri" data-act="remind" data-id="'+id+'" href="https://wa.me/?text='+encodeURIComponent(msg)+'" target="_blank" rel="noopener">'+ic('wa')+t('remindWa')+'</a><a class="b" data-act="remind" data-id="'+id+'" href="https://t.me/share/url?url='+encodeURIComponent('https://soffice.uz/pay/'+b.id.toLowerCase())+'&amp;text='+encodeURIComponent(msg)+'" target="_blank" rel="noopener">'+ic('tg')+'Telegram</a></div>'+(PS.remind[id]?'<p class="hint">'+t('remindedAt',{d:dfull(PS.remind[id])+' '+tstr(PS.remind[id])})+'</p>':''):'')+
    '<p class="hint">'+t('payHint')+'</p>')}

/* ── Эксплуатация ───────────────────────────────────────────────────── */
var SF={st:'open',type:''};
V.service=function(){var r=R(),all=ticketsAll().filter(function(x){return scope(x.bc)}),list=all.filter(function(x){return (SF.st==='all'||(SF.st==='open'?x.st!=='done':x.st===SF.st))&&(!SF.type||x.type===SF.type)}).sort(function(a,b){return (a.st==='done')-(b.st==='done')||a.due-b.due});
  var late=all.filter(function(x){return x.st!=='done'&&x.due<NOW}).length;
  return ph(t('svcH'),t('svcS'))+'<div class="kpis">'+kpi(t('svcOpen'),grp(all.filter(function(x){return x.st!=='done'}).length),t('svcOpenS'))+kpi(t('svcLate'),grp(late),t('svcLateS'),late?'bad':'')+kpi(t('svcDone'),grp(all.filter(function(x){return x.st==='done'&&x.ts>NOW-7*DAY}).length),t('in7'))+'</div>'+
    '<div class="tools"><div class="seg">'+['open','all','done'].map(function(s){return '<button type="button" role="radio" aria-checked="'+(SF.st===s)+'" data-sf="'+s+'">'+t('sf_'+s)+'</button>'}).join('')+'</div><select id="st-type" aria-label="'+h(t('type'))+'"><option value="">'+t('allTypes')+'</option>'+TKT.map(function(k){return '<option value="'+k+'"'+(SF.type===k?' selected':'')+'>'+t('tk_'+k)+'</option>'}).join('')+'</select>'+(r.svc&&!r.ro?btn(ic('plus')+t('newTk'),'data-act="tk-new"','pri'):'')+'</div>'+
    card(t('tkList'),'<table class="tb"><thead><tr><th>'+t('type')+'</th><th>'+t('tkWhat')+'</th><th class="hm">'+t('who')+'</th><th class="r">'+t('due')+'</th><th>'+t('status')+'</th></tr></thead><tbody>'+list.map(function(x){var lt=x.st!=='done'&&x.due<NOW;return '<tr class="click" data-tk="'+x.id+'"><td><span class="tk tk-'+x.type+'">'+ic(x.type==='repair'?'tool':x.type==='clean'?'spark':x.type==='pass'?'user':'car')+t('tk_'+x.type)+'</span></td><td><b>'+h(x.txt)+'</b><small class="sub">'+h(BC[x.bc].n)+' · '+h(LSK[x.ls]?LSK[x.ls].t:'')+'</small></td><td class="hm">'+h(TEAM[x.who].n)+'</td><td class="r"><span class="'+(lt?'bad':'')+'">'+dstr(x.due)+' '+tstr(x.due)+'</span></td><td><span class="tag t-'+x.st+'">'+t('ts_'+x.st)+'</span></td></tr>'}).join('')+'</tbody></table>','w3')};
function tkSide(id){var x=ticketsAll().filter(function(z){return z.id===id})[0];if(!x)return;var r=R(),can=(PS.role==='ops'||PS.role==='owner'||PS.role==='head');
  openSide('<header class="sd-h"><div><small>'+x.id+' · '+t('tk_'+x.type)+'</small><h2>'+h(x.txt)+'</h2></div><span class="tag t-'+x.st+'">'+t('ts_'+x.st)+'</span></header><dl class="kv"><dt>'+t('bcCol')+'</dt><dd>'+h(BC[x.bc].n)+'</dd><dt>'+t('tenant')+'</dt><dd>'+h(LSK[x.ls]?LSK[x.ls].t:'')+'</dd><dt>'+t('created')+'</dt><dd>'+dfull(x.ts)+' '+tstr(x.ts)+'</dd><dt>'+t('due')+'</dt><dd>'+dfull(x.due)+' '+tstr(x.due)+'</dd></dl>'+
    '<label class="fld"><span>'+t('who')+'</span><select data-tkwho="'+id+'"'+(can?'':' disabled')+'>'+OPS.map(function(o){return '<option value="'+o+'"'+(x.who===o?' selected':'')+'>'+h(TEAM[o].n)+'</option>'}).join('')+'</select></label>'+
    (can?'<div class="rs">'+['new','work','done'].map(function(s){return btn(t('ts_'+s),'data-act="tk-st" data-id="'+id+'" data-s="'+s+'"',x.st===s?'on':'')}).join('')+'</div>':'')+'<p class="hint">'+t('tkHint')+'</p>')}
function tkNew(){var lsList=LS.filter(function(l){return scope(l.bc)}).slice(0,60);
  modal('<h2>'+t('newTk')+'</h2><form id="tkf" class="frm"><label class="fld"><span>'+t('type')+'</span><select name="type">'+TKT.map(function(k){return '<option value="'+k+'">'+t('tk_'+k)+'</option>'}).join('')+'</select></label><label class="fld"><span>'+t('tenant')+'</span><select name="ls">'+lsList.map(function(l){return '<option value="'+l.id+'">'+h(l.t)+' · '+h(BC[l.bc].n)+'</option>'}).join('')+'</select></label><label class="fld"><span>'+t('tkWhat')+'</span><input name="txt" required maxlength="120" value="'+h(t('tx_pass')[0])+'"></label><label class="fld"><span>'+t('who')+'</span><select name="who">'+OPS.map(function(o){return '<option value="'+o+'">'+h(TEAM[o].n)+'</option>'}).join('')+'</select></label><div class="acts">'+btn(t('create'),'type="submit"','pri')+btn(t('cancel'),'data-close')+'</div></form>');
  $('#tkf').onsubmit=function(e){e.preventDefault();var f=e.target,l=LSK[f.ls.value],type=f.type.value,x={id:'E-'+(1000+PS.newTickets.length),ts:Date.now(),type:type,bc:l.bc,ls:l.id,txt:f.txt.value.slice(0,120),who:f.who.value,due:Date.now()+{repair:48,clean:8,pass:4,park:24}[type]*36e5,st:'new'};PS.newTickets.unshift(x);save();logAdd('tk_new',x.id,t('tk_'+type));closeModal();render();toast(t('tTk',{n:x.id}))}}

/* ── Отчёт собственнику ─────────────────────────────────────────────── */
var RF={m:CUR-1,o:''};
V.owners=function(){var r=R(),oid=PS.role==='own'?PS.owner:(RF.o||G.owners[0].id),o=G.owners.filter(function(x){return x.id===oid})[0];
  var rows=o.bcs.map(function(id){var s=bcStats(id),mo=money4(RF.m,function(b){return b===id}),exp=mo.ch*G.tariff.expense,fee=mo.pd*G.tariff.fee;return {b:BC[id],s:s,ch:mo.ch,pd:mo.pd,exp:exp,fee:fee,net:mo.pd-exp-fee}});
  var T={a:0,let:0,ch:0,pd:0,exp:0,fee:0,net:0};rows.forEach(function(x){T.a+=x.s.a;T.let+=x.s.let;T.ch+=x.ch;T.pd+=x.pd;T.exp+=x.exp;T.fee+=x.fee;T.net+=x.net});
  var trend=[],lab=[];for(var m=CUR-3;m<=CUR;m++){var z=money4(m,function(b){return o.bcs.indexOf(b)>=0});trend.push(z.pd);lab.push(t('monthsS')[m%12])}
  var sel=PS.role==='own'?'<span class="pill">'+ic('user')+h(o.n)+' · '+t('demo')+'</span>':'<select id="ro" aria-label="'+h(t('ownerW'))+'">'+G.owners.map(function(x){return '<option value="'+x.id+'"'+(x.id===oid?' selected':'')+'>'+h(x.n)+' ('+t('demo')+')</option>'}).join('')+'</select>';
  return ph(t('repH'),t('repS'))+'<div class="tools">'+sel+'<select id="rm" aria-label="'+h(t('month'))+'">'+[1,2,3].map(function(i){var m=CUR-i;return '<option value="'+m+'"'+(RF.m===m?' selected':'')+'>'+mname(m)+'</option>'}).join('')+'</select>'+btn(ic('print')+t('pdf'),'data-act="print-rep"','pri')+'</div>'+
    '<div class="report" id="report"><header class="rp-h"><img src="/protos/soffice/logo.webp" alt="Soffice" width="574" height="127"><div><b>'+t('repFor',{o:h(o.n)})+'</b><small>'+mname(RF.m)+' · '+t('demo')+'</small></div></header>'+
    '<div class="kpis">'+kpi(t('occ'),pct(T.let/T.a,1),grp(T.let)+' / '+grp(T.a)+' m²','big')+kpi(t('income'),money(T.pd),t('ofChargedN',{s:money(T.ch)}))+kpi(t('expenses'),money(T.exp),t('expS',{p:pct(G.tariff.expense)}))+kpi(t('fee'),money(T.fee),t('feeS',{p:pct(G.tariff.fee)}))+kpi(t('toOwner'),money(T.net),t('toOwnerS'),'good')+'</div>'+
    card(t('repByBc'),'<table class="tb"><thead><tr><th>'+t('bcCol')+'</th><th class="r">'+t('occ')+'</th><th class="r hm">'+t('charged')+'</th><th class="r">'+t('income')+'</th><th class="r hm">'+t('expenses')+'</th><th class="r hm">'+t('fee')+'</th><th class="r">'+t('toOwner')+'</th></tr></thead><tbody>'+rows.map(function(x){return '<tr><td><b>'+h(x.b.n)+'</b> <small class="sub">'+x.b.cls+'</small></td><td class="r">'+pct(x.s.occ,1)+'</td><td class="r hm">'+money(x.ch)+'</td><td class="r">'+money(x.pd)+'</td><td class="r hm">'+money(x.exp)+'</td><td class="r hm">'+money(x.fee)+'</td><td class="r"><b>'+money(x.net)+'</b></td></tr>'}).join('')+'</tbody></table>','w3')+
    '<div class="cols">'+card(t('incomeTrend'),gbars(lab,[{n:t('income'),v:trend,c:'var(--or)'}],t('incomeTrend')),'w2')+card(t('repFree'),hbars(rows.map(function(x){return {n:h(x.b.n),v:x.s.free,s:t('freeN',{n:x.s.fu})}}),function(v){return grp(v)+' m²'}))+'</div><p class="demo">'+t('repNote')+'</p></div>'};

/* ── Спрос с сайта ──────────────────────────────────────────────────── */
V.demand=function(){var live=lsGet(DK,[]);if(!Array.isArray(live))live=[];
  var AB=[[0,50],[50,100],[100,300],[300,500],[500,1000],[1000,1e9]],ab=[930,1540,1720,610,330,140],bb=[[0,20e6],[20e6,50e6],[50e6,100e6],[100e6,300e6],[300e6,1e12]],bv=[1180,1620,1210,620,240];
  var dist={mirabad:1310,yunusabad:1180,yakkasaray:820,shayhantahur:540,yashnabad:430,'':1010},views={};G.bc.forEach(function(b,i){views[b.id]=Math.round(1400/(1+i*.35)+((i*53)%120))});
  var fm={office:2410,cabinet:1380,open:640,cowork:410},liveN=0;
  live.forEach(function(x){if(x.k==='s'){liveN++;AB.forEach(function(r,i){if(x.a>=r[0]&&x.a<r[1])ab[i]++});bb.forEach(function(r,i){if(x.b>=r[0]&&x.b<r[1])bv[i]++});var w=x.w||'';if(w.charAt(0)==='d')dist[w.slice(2)]=(dist[w.slice(2)]||0)+1;else if(!w)dist['']++;else views[w.slice(2)]=(views[w.slice(2)]||0)+1}if(x.k==='v'&&views[x.id]!=null){views[x.id]++;liveN++}});
  var sup=AB.map(function(r){return UN.filter(function(x){return st(x)==='f'&&x.a>=r[0]&&x.a<r[1]}).length});
  var abl=['<50','50-100','100-300','300-500','500-1000','1000+'];
  var gap=AB.map(function(r,i){return {n:abl[i]+' m²',v:ab[i]/Math.max(1,sup[i]),s:t('gapS',{d:grp(ab[i]),f:grp(sup[i])})}});
  return ph(t('demH'),t('demS'))+(liveN?'<p class="al hot">'+ic('bolt')+t('demLive',{n:liveN})+'</p>':'')+
    '<div class="cols">'+card(t('demArea'),hbars(ab.map(function(v,i){return {n:abl[i]+' m²',v:v}})))+card(t('demBudget'),hbars(bv.map(function(v,i){return {n:t('bud'+i),v:v}})))+card(t('demFmt'),hbars(Object.keys(fm).map(function(k){return {n:t('f_'+k),v:fm[k]}})))+'</div>'+
    '<div class="cols">'+card(t('demDist'),hbars(Object.keys(dist).map(function(k){return {n:k?h(G.dist[k]):t('anyWhere'),v:dist[k]}}).sort(function(a,b){return b.v-a.v})))+card(t('demTop'),hbars(G.bc.map(function(b){return {n:h(b.n),v:views[b.id],href:'objects?bc='+b.id}}).sort(function(a,b){return b.v-a.v}).slice(0,10)),'w2')+'</div>'+
    card(t('demGap'),hbars(gap,function(v){return dec(v,1)+'×'})+'<p class="hint">'+t('demGapHint')+'</p>','w3')+'<p class="demo">'+t('demNote')+'</p>'};

/* ── Команда, роли, история ─────────────────────────────────────────── */
V.team=function(){var secs=NAV.filter(function(s){return s!=='team'});
  var matrix='<table class="tb mx"><thead><tr><th>'+t('roleCol')+'</th>'+secs.map(function(s){return '<th class="c">'+t('n_'+s)+'</th>'}).join('')+'<th class="c">'+t('moneyCol')+'</th></tr></thead><tbody>'+Object.keys(ROLE).map(function(k){var R0=ROLE[k];return '<tr><td><b>'+t('role_'+k)+'</b><small class="sub">'+t('rd_'+k)+'</small></td>'+secs.map(function(s){var y=R0.s==='*'||(' '+R0.s+' ').indexOf(' '+s+' ')>=0;return '<td class="c">'+(y?(R0.ro?'<span class="yes ro" title="'+h(t('readOnly'))+'">'+ic('eye')+'</span>':'<span class="yes">'+ic('check')+'</span>'):'<span class="no">·</span>')+'</td>'}).join('')+'<td class="c">'+(R0.m?'<span class="yes">'+ic('check')+'</span>':'<span class="no">·</span>')+'</td></tr>'}).join('')+'</tbody></table>';
  var people=G.team.map(function(p){var n=PS.log.length?0:0;return '<li><span class="av">'+h(p.n.charAt(0))+'</span><span><b>'+h(p.n)+'</b><small>'+t('role_'+p.role)+' · '+t('demo')+'</small></span></li>'}).join('')+G.owners.map(function(o){return '<li><span class="av o">'+h(o.n.charAt(0))+'</span><span><b>'+h(o.n)+'</b><small>'+t('role_own')+': '+o.bcs.map(function(id){return h(BC[id].n)}).join(', ')+'</small></span></li>'}).join('');
  var log=PS.log.map(function(x){return {ts:x.ts,who:t('role_'+x.role)+' · '+t('you'),k:x.k,o:x.o,v:x.v}}).concat(LOG0.map(function(x){return {ts:x.ts,who:TEAM[x.who].n,k:x.k,o:x.o,v:''}})).sort(function(a,b){return b.ts-a.ts}).slice(0,60);
  return ph(t('teamH'),t('teamS'))+card(t('rolesH'),matrix+'<p class="hint">'+t('rolesHint')+'</p>','w3')+'<div class="cols">'+card(t('peopleH'),'<ul class="ppl">'+people+'</ul>')+card(t('logH'),'<ul class="hist">'+log.map(function(x){return '<li><time>'+dstr(x.ts)+' '+tstr(x.ts)+'</time><b>'+h(x.who)+'</b> '+logText(x)+'</li>'}).join('')+'</ul>','w2')+'</div>'};
function logText(x){return h(t('lg_'+x.k,{o:x.o,v:x.v}))}

/* ── Боковая карточка и окно ────────────────────────────────────────── */
var lastFocus=null;
function openSide(html){lastFocus=d.activeElement;side.innerHTML='<div class="sd-back" data-sclose></div><aside class="sd" role="dialog" aria-modal="true" aria-label="'+h(t('card'))+'"><button type="button" class="x" data-sclose aria-label="'+h(t('close'))+'">'+ic('x')+'</button>'+html+'</aside>';side.hidden=false;d.body.classList.add('sd-on');var x=$('.x',side);if(x)x.focus()}
function closeSide(){side.hidden=true;side.innerHTML='';d.body.classList.remove('sd-on');if(lastFocus&&lastFocus.focus)try{lastFocus.focus({preventScroll:true})}catch(e){}}
var mdl=$('#mdl');
function modal(html){mdl.innerHTML='<div class="md-back" data-close></div><div class="md" role="dialog" aria-modal="true">'+html+'</div>';mdl.hidden=false;var f=$('.md button,.md input',mdl);if(f)f.focus()}
function closeModal(){mdl.hidden=true;mdl.innerHTML=''}
d.addEventListener('keydown',function(e){if(e.key==='Escape'){if(!mdl.hidden)closeModal();else if(!side.hidden)closeSide()}if((e.key==='Enter'||e.key===' ')&&e.target.closest&&e.target.closest('g[data-unit]')){e.preventDefault();e.target.closest('g[data-unit]').dispatchEvent(new MouseEvent('click',{bubbles:true}))}});

/* ── Нажатия ────────────────────────────────────────────────────────── */
d.addEventListener('click',function(e){var el=e.target.closest?e.target:null;if(!el)return;var a;
  if(el.closest('[data-close]')){closeModal();return}
  if(el.closest('[data-sclose]')){closeSide();return}
  if((a=el.closest('[data-go]'))){location.hash='#'+a.getAttribute('data-go');return}
  if((a=el.closest('[data-act]'))){var act=a.getAttribute('data-act'),id=a.getAttribute('data-id'),r=R();
    if(act==='next')nextStep(id);else if(act==='view-new'){stepView(id);leadSide(id);render()}else if(act==='kp')kpOpen(id);else if(act==='kp-go')kpGo(id);else if(act==='lease-new')leaseNew(id);else if(act==='move-in')moveIn(id);
    else if(act==='lose')loseOpen(id);else if(act==='lose-go'){var l0=leadById(id);leadSet(id,{st:'lost',reason:a.getAttribute('data-r'),lostAt:Math.max(0,STG.indexOf(l0.st))},['lost',t(a.getAttribute('data-r'))]);closeModal();leadSide(id);render()}
    else if(act==='lead-new')newLead();
    else if(act==='vres'){PS.views[id]={res:a.getAttribute('data-r')};save();logAdd('view_res',id,t('res_'+a.getAttribute('data-r')));viewSide(id);render()}
    else if(act==='vrep'){var v=viewsAll().filter(function(x){return x.id===id})[0],nv={id:'V-'+(800+PS.newViews.length),ts:Math.max(v.ts,T0)+2*DAY+(12-new Date(v.ts).getHours())*36e5,bc:v.bc,br:v.br,lead:v.lead,res:'plan'};if(new Date(nv.ts).getDay()===0)nv.ts+=DAY;PS.newViews.unshift(nv);save();logAdd('view_set',v.lead,BC[v.bc].n+', '+dstr(nv.ts));toast(t('tView',{b:BC[v.bc].n,d:dstr(nv.ts)+' '+tstr(nv.ts)}));viewSide(nv.id);render()}
    else if(act==='ust'){if(!a.disabled)unitSet(a.getAttribute('data-k'),a.getAttribute('data-s'))}
    else if(act==='rate-reset'){delete PS.rate[id];BC[id].rate=BC[id].rate0;save();logAdd('rate',BC[id].n,grp(BC[id].rate));render();toast(t('tRate',{b:BC[id].n,r:grp(BC[id].rate)}))}
    else if(act==='doc')docOpen(id,a.getAttribute('data-k'));else if(act==='print'||act==='print-rep'){d.body.classList.add(act==='print'?'pr-doc':'pr-rep');W.print();setTimeout(function(){d.body.classList.remove('pr-doc','pr-rep')},500);if(act==='print-rep')logAdd('pdf',ownerName(),mname(RF.m))}
    else if(act==='ls-remind'){var l1=LSK[id];logAdd('ls_remind',id,'');W.open('https://wa.me/?text='+encodeURIComponent(t('endT',{t:l1.t,d:dfull(lsEnd(l1))})),'_blank','noopener');toast(t('tRemind'))}
    else if(act==='ls-prolong'){var l2=LSK[id],ne=addM(lsEnd(l2)+DAY,12)-DAY;PS.lsx[id]={end:ne};save();logAdd('prolong',id,dfull(ne));toast(t('tProlong',{d:dfull(ne)}));lsSide(id);render()}
    else if(act==='pay'){PS.pay[id]={ts:Date.now(),how:a.getAttribute('data-h')};save();var b=BL.filter(function(x){return x.id===id})[0];logAdd('pay',b.ls.id,money(bTotal(b))+' · '+t('how_'+a.getAttribute('data-h')));toast(t('tPaid'));billSide(id);render()}
    else if(act==='remind'){PS.remind[id]=Date.now();save();logAdd('remind',id,'');setTimeout(function(){billSide(id);render()},50);return}
    else if(act==='tk-new')tkNew();else if(act==='tk-st'){PS.tickets[id]=PS.tickets[id]||{};PS.tickets[id].st=a.getAttribute('data-s');save();logAdd(a.getAttribute('data-s')==='done'?'tk_done':'tk_st',id,t('ts_'+a.getAttribute('data-s')));tkSide(id);render()}
    else if(act==='more-ls'){CF.lim+=60;render()}else if(act==='more-b'){BF.lim+=60;render()}
    return}
  if((a=el.closest('[data-lead]'))){e.preventDefault();leadSide(a.getAttribute('data-lead'));return}
  if((a=el.closest('[data-ls]'))){e.preventDefault();lsSide(a.getAttribute('data-ls'));return}
  if((a=el.closest('[data-bill]'))){billSide(a.getAttribute('data-bill'));return}
  if((a=el.closest('[data-tk]'))){tkSide(a.getAttribute('data-tk'));return}
  if((a=el.closest('[data-view]'))){viewSide(a.getAttribute('data-view'));return}
  if((a=el.closest('g[data-unit]'))){var k=a.getAttribute('data-unit'),x=UK[k],r2=R();
    if(OF.u===k&&!r2.ro&&r2.obj){var order=r2.obj===3?['f','r']:['f','h','l','r'],cs=st(x),nx=order[(order.indexOf(cs)+1)%order.length];unitSet(k,nx)}else{OF.u=k;render()}return}
  if((a=el.closest('[data-fl]'))){OF.fl=+a.getAttribute('data-fl');OF.u='';render();return}
  if((a=el.closest('[data-lv]'))){LF.view=a.getAttribute('data-lv');render();return}
  if((a=el.closest('[data-wk]'))){VF.wk+=+a.getAttribute('data-wk');render();return}
  if((a=el.closest('[data-cf]'))){CF.f=a.getAttribute('data-cf');CF.lim=40;render();return}
  if((a=el.closest('[data-bf]'))){BF.st=a.getAttribute('data-bf');BF.lim=40;render();return}
  if((a=el.closest('[data-sf]'))){SF.st=a.getAttribute('data-sf');render();return}
});
d.addEventListener('change',function(e){var el=e.target,id;
  if(el.id==='lbr'){LF.br=el.value;render()}else if(el.id==='vbc'){VF.bc=el.value;render()}else if(el.id==='vbr'){VF.br=el.value;render()}
  else if(el.id==='bm'){BF.m=+el.value;BF.st=BF.st==='late'?'all':BF.st;render()}else if(el.id==='st-type'){SF.type=el.value;render()}
  else if(el.id==='ro'){RF.o=el.value;render()}else if(el.id==='rm'){RF.m=+el.value;render()}
  else if((id=el.getAttribute('data-lbr'))){leadSet(id,{br:el.value},['lead_br',el.value?TEAM[el.value].n:'']);render();leadSide(id)}
  else if((id=el.getAttribute('data-tkwho'))){PS.tickets[id]=PS.tickets[id]||{};PS.tickets[id].who=el.value;save();logAdd('tk_who',id,TEAM[el.value].n);render()}});
var qT=0;d.addEventListener('input',function(e){var el=e.target;if(el.id!=='lq'&&el.id!=='cq')return;clearTimeout(qT);qT=setTimeout(function(){if(el.id==='lq')LF.q=el.value;else{CF.q=el.value;CF.lim=40}var pos=el.selectionStart;render();var n=$('#'+el.id);if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(x){}}},250)});
d.addEventListener('submit',function(e){var f=e.target;if(!f.getAttribute('data-rate'))return;e.preventDefault();var id=f.getAttribute('data-rate'),v=Math.round(+f.r.value/1000)*1000;if(!(v>=100000&&v<=2000000)){toast(t('rateBad'));return}
  PS.rate[id]=v;BC[id].rate=v;save();logAdd('rate',BC[id].n,grp(v));render();toast(t('tRate',{b:BC[id].n,r:grp(v)}))});

route();
})();
