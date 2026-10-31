/* Dispetcherskaya CARGO PRO GROUP (TMS): raspredelenie gruzov po mashinam
   (tip kuzova, ves i obyom, first-fit decreasing), ruchnoy perenos s
   proverkoy, voditeli na karte (dvizhutsya po marshrutam, geozony), reysy so
   statusami (pishet cp-panel-1.st, sayt chitaet ego v «Gde gruz»), voditeli
   i reyting, vybor perevozchika po reytingu i tsene, roli i istoriya.
   Nastroyki (settings.js, cp-set-1): tarify, ozhidanie, roli, kompaniya, uvedomleniya.
   Demo-dannye iz odnogo zerna. Sostoyanie: cp-disp-1. Podpisi tolko iz
   slovarya, bez modeli i vneshnih servisov. */
(function(){
var d=document,w=window,$=function(s,r){return(r||d).querySelector(s)},$$=function(s,r){return[].slice.call((r||d).querySelectorAll(s))};
var D=JSON.parse($('#dp-data').textContent),U=D.ui,C=D.city;
var RM=w.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function t(k){return U[k]}
function get(k,def){try{var v=localStorage.getItem(k);return v?JSON.parse(v):def}catch(e){return def}}
function put(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function fv(n){return String(n).replace('.',',')}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function pct(x){return Math.round(x*100)+'%'}
var S=get('cp-disp-1',{});S.role=S.role||'disp';S.log=S.log||[];S.as=S.as||null;
function save(){put('cp-disp-1',S)}
function log(what,ref){S.log.unshift({at:Date.now(),who:S.role,w:what,r:ref||''});S.log=S.log.slice(0,80);save()}
/* Dengi vidit rol s pravom «money» (nastroyki, matritsa prav); vladelets vsegda. */
function head(){return can('money')>=1}
/* Modul «sbornye gruzy» vyklyuchen v konstruktore - vkladki net. */
var LTL=(function(){var c=get('cp-cfg-1',{});return c.m_ltl!==false&&c.m_tms!==false})();
var TABS=['plan','route','map','trips','drivers','fleet','int','set','log'];
function tabOk(x){return(x!=='route'||LTL)&&can(x)>=1}
/* #set i #set-<gruppa> - nastroyki; vkladka, zakrytaya rolyu, uvodit v pervuyu otkrytuyu. */
function vw(){var x=location.hash.slice(1)||'plan',g='tar';if(x.indexOf('set')===0){g=x.slice(4)||'tar';x='set'}if(x==='route'&&!LTL)x='plan';if(!tabOk(x))x=TABS.filter(tabOk)[0]||'plan';if(x==='set')setGrp=GRPS.indexOf(g)>=0?g:'tar';return x}
var view='plan',setGrp='tar',pick=null,drv=null,offFor=null,sortBy='rate';

/* Demo-zerno. */
var zr=20261031;function rnd(){zr=(zr*16807)%2147483647;return zr/2147483647}
var TN=['[[t:0]]','[[t:1]]','[[t:2]]','[[t:3]]','[[t:4]]'];
var INI=['A.','B.','D.','J.','K.','M.','N.','O.','R.','S.','T.','U.'];

/* Park: kuzov, gruzopodyomnost (kg) i obyom (m3), realnye dlya rynka. v:0 - otkrytaya ploshchadka. */
var BODY={van:{kg:1500,v:9},b5:{kg:5000,v:36},b10:{kg:10000,v:45},fura:{kg:20000,v:86},ref:{kg:20000,v:82},c20:{kg:21700,v:33},c40:{kg:26500,v:67},tral:{kg:40000,v:0}};
var FIT={gen:['van','b5','b10','fura','c20','c40'],dg:['b10','fura'],ref:['ref'],oog:['tral']};
var FLEET=[['van',0],['van',0],['b5',0],['b5',0],['b10',1],['b10',0],['fura',1],['fura',0],['ref',0],['c20',0],['c40',0],['tral',0]].map(function(x,i){
  var n=TN[i%TN.length]+' '+INI[i];
  return{id:'T'+(i+1),b:x[0],adr:!!x[1],kg:BODY[x[0]].kg,v:BODY[x[0]].v,dr:n,pl:'01 '+(100+Math.floor(rnd()*899))+' '+'ABCDEHKMOPTX'.charAt(Math.floor(rnd()*12))+'ABCDEHKMOPTX'.charAt(Math.floor(rnd()*12))+'A',
    rate:+(4.2+rnd()*.78).toFixed(2),trips:40+Math.floor(rnd()*260),late:Math.floor(rnd()*rnd()*9),km:+(0.38+rnd()*.32).toFixed(2),
    doc:[Math.floor(rnd()*400)-20,Math.floor(rnd()*300)+5,Math.floor(rnd()*200)-8]}});
var CARGO=[
  ['C-301','gen',1200,6,'sam','d0'],['C-302','gen',800,5.5,'sam','d0'],['C-303','gen',400,3,'fer','d0'],['C-304','gen',6500,30,'bux','d1'],
  ['C-305','gen',14000,70,'alm','d1'],['C-306','gen',3200,18,'and','d0'],['C-307','gen',9000,40,'nuk','d2'],['C-308','gen',18500,30,'bis','d1'],
  ['C-309','dg',4200,12,'fer','d1'],['C-310','ref',12000,50,'alm','d0'],['C-311','ref',9000,38,'sam','d1'],['C-312','oog',24000,0,'nav','d2'],
  ['C-313','gen',28000,60,'ter','d2'],['C-314','gen',600,4,'and','d0']
].map(function(x,i){return{id:x[0],ty:x[1],kg:x[2],v:x[3],to:x[4],dl:x[5],pal:x[3]?Math.max(1,Math.round(x[3]/1.8)):0,co:t('co')+' «'+TN[(i+2)%TN.length]+'»'}});
/* Stavka klientu: baza po vesu x natsenka kategorii iz nastroek (bidOf v settings.js). */
var CG={};CARGO.forEach(function(c){CG[c.id]=c});
var TR={};FLEET.forEach(function(f){TR[f.id]=f});

/* Raskladka: sortiruem po «tyazhesti» (dolya vesa ili obyoma samoy bolshoy podkhodyashchey mashiny), kladyom v pervuyu podkhodyashchuyu:
   tot zhe kuzov, svobodnye kg i m3, luchshe - mashina s tem zhe napravleniem (sbornyy gruz), potom - samaya malaya, kuda vlezaet. */
function load(as,id){var s={kg:0,v:0,to:{}};Object.keys(as).forEach(function(c){if(as[c]===id){s.kg+=CG[c].kg;s.v+=CG[c].v;s.to[CG[c].to]=1}});return s}
function why(c,f,as){var s=load(as,f.id),bad=[];
  if(FIT[c.ty].indexOf(f.b)<0)bad.push(t('w_body'));
  if(c.ty==='dg'&&!f.adr)bad.push(t('w_adr'));
  if(s.kg>f.kg)bad.push(t('w_kg')+' +'+fmt(s.kg-f.kg)+' '+t('kg'));
  if(f.v&&s.v>f.v)bad.push(t('w_v')+' +'+fv((s.v-f.v).toFixed(1))+' '+t('m3'));
  return bad}
function plan(){var as={},left=[];
  var big=function(c){var o=FIT[c.ty].map(function(b){return BODY[b]});var mk=Math.max.apply(null,o.map(function(x){return x.kg})),mv=Math.max.apply(null,o.map(function(x){return x.v||1e9}));return Math.max(c.kg/mk,c.v/mv)};
  CARGO.slice().sort(function(a,b){return big(b)-big(a)}).forEach(function(c){
    var ok=FLEET.filter(function(f){if(FIT[c.ty].indexOf(f.b)<0)return false;if(c.ty==='dg'&&!f.adr)return false;var s=load(as,f.id);
      if(Object.keys(s.to).length&&!s.to[c.to])return false;return s.kg+c.kg<=f.kg&&(!f.v||s.v+c.v<=f.v)});
    ok.sort(function(a,b){var sa=load(as,a.id),sb=load(as,b.id),ka=sa.to[c.to]?0:1,kb=sb.to[c.to]?0:1;return ka-kb||a.kg-b.kg});
    if(ok.length)as[c.id]=ok[0].id;
    else{var any=FLEET.filter(function(f){return FIT[c.ty].indexOf(f.b)>=0});var r=!any.length?t('u_body'):c.kg>Math.max.apply(null,any.map(function(f){return f.kg}))?t('u_heavy'):c.ty==='ref'?t('u_ref'):t('u_busy');left.push(c.id);as[c.id]=null;S.why=S.why||{};S.why[c.id]=r}});
  return as}

/* Karta: goroda v uslovnykh koordinatakh (ne karta), dorogi - krivye. */
var P={tas:[560,200],sam:[360,340],bux:[220,380],nav:[290,330],fer:[770,250],and:[850,225],nuk:[70,180],ter:[400,540],alm:[950,60],bis:[830,140]};
function road(a,b){var A=P[a],B=P[b],mx=(A[0]+B[0])/2,my=(A[1]+B[1])/2-40;return'M'+A[0]+' '+A[1]+' Q '+mx+' '+my+' '+B[0]+' '+B[1]}
var RUN=FLEET.map(function(f,i){var to=['sam','fer','bux','alm','and','nuk','alm','bis','alm','ter','nav','nav'][i];
  var st=i===2?'free':i===5?'load':i===9?'idle':i===7?'late':i===11?'free':'go';
  return{f:f,to:to,st:st,k:st==='free'?0:st==='load'?0:.08+rnd()*.7,sp:st==='go'||st==='late'?(st==='late'?.000006:.000011)*(0.7+rnd()*.6):0,spd:st==='go'?62+Math.floor(rnd()*28):st==='late'?38:0,
    fuel:30+Math.floor(rnd()*65),odo:60+Math.floor(rnd()*480),ping:Math.floor(rnd()*4)+1,off:i===4}});

var GEAR='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';
function shell(){var tabs=TABS.filter(tabOk);
  $('#app').innerHTML='<header class="pn-top"><div class="pn-brand"><img src="'+D.logo+'" alt="CARGO PRO GROUP" width="670" height="249"><span>'+t('title')+' · '+t('demo')+'</span></div>'+
  '<label class="pn-role"><span>'+t('role')+'</span><select id="role">'+ROLES.map(function(r){return'<option value="'+r+'">'+t('role_'+r)+'</option>'}).join('')+'</select></label>'+(can('set')>=1?'<a class="btn btn-g btn-s pn-gear" '+hl()+' aria-label="'+t('tab_set')+'" title="'+t('tab_set')+'">'+GEAR+'</a>':'')+
  '<a class="btn btn-g btn-s" href="'+D.home+'">'+t('home')+'</a><a class="btn btn-g btn-s" href="'+D.panel+'">'+t('panel')+'</a><a class="btn btn-a btn-s" href="'+D.site+'">'+t('site')+'</a></header>'+
  '<nav class="pn-tabs">'+tabs.map(function(x){return'<a href="#'+x+'" data-v="'+x+'"'+(x===view?' aria-current="page"':'')+'>'+t('tab_'+x)+'</a>'}).join('')+'</nav>'+
  '<div class="dp-go"><b>'+t('go_t')+'</b><span>'+t('go_e')+'</span><a href="'+D.gp+'" target="_blank" rel="noopener">Google Play</a><a href="'+D.as+'" target="_blank" rel="noopener">App Store</a></div><main class="pn-main" id="pv"></main>';
  $('#role').value=S.role;$('#role').addEventListener('change',function(e){S.role=e.target.value;log('l_role',t('role_'+S.role));save();view=vw();shell();render()})}
addEventListener('hashchange',function(){view=vw();drv=null;shell();render()});

function bar(x,lab){var c=x>1?'bad':x>.85?'hi':'';return'<div class="dp-bar '+c+'"><i style="transform:scaleX('+Math.min(1,x).toFixed(3)+')"></i><span>'+lab+'</span></div>'}
function tyName(c){return t('ty_'+c.ty)}
function chipC(c,cls){return'<button type="button" class="dp-c '+(cls||'')+' ty-'+c.ty+(pick===c.id?' sel':'')+'" data-c="'+c.id+'" draggable="true"><b>'+c.id+'</b><span>'+tyName(c)+' · '+fmt(c.kg)+' '+t('kg')+(c.v?' · '+fv(c.v)+' '+t('m3'):'')+(c.pal?' · '+c.pal+' '+t('pal'):'')+'</span><small>'+esc(C[c.to])+' · '+t(c.dl)+'</small></button>'}
function vPlan(){var as=S.as;
  var q=CARGO.filter(function(c){return!as||!as[c.id]});
  var h='<p class="pn-hint">'+t('p_hint')+(can('set')>=1&&head()?' <a class="dp-to-r-b" '+hl('tar')+'>'+t('st_go')+'</a>':'')+'</p>'+(LTL?'<p class="dp-to-r">'+t('r_from_plan')+' <button type="button" class="dp-to-r-b" id="toroute">'+t('tab_route')+'</button></p>':'')+'<div class="dp-act"><button type="button" class="btn btn-a" id="dist"'+(can('plan')>=2?'':' disabled')+'>'+t('dist')+'</button><button type="button" class="btn btn-g btn-s" id="reset">'+t('reset')+'</button>'+(pick?'<span class="dp-pick">'+t('pick')+' <b>'+pick+'</b></span>':'')+'</div>';
  h+='<div class="dp-plan"><section class="pn-card dp-q" data-drop="q"><h3>'+t('queue')+' <small class="pn-mu">'+q.length+'</small></h3>'+(q.length?q.map(function(c){return chipC(c,as&&as[c.id]===null?'un':'')+(as&&as[c.id]===null&&S.why&&S.why[c.id]?'<p class="dp-why">'+esc(S.why[c.id])+'</p>':'')}).join(''):'<p class="pn-mu">'+t('q_none')+'</p>')+'</section>';
  h+='<section class="dp-fleet">'+FLEET.map(function(f){var s=load(as||{},f.id),bad=[];Object.keys(as||{}).forEach(function(c){if(as[c]===f.id)bad=bad.concat(why(CG[c],f,as))});
    bad=bad.filter(function(x,i){return bad.indexOf(x)===i});
    var cs=Object.keys(as||{}).filter(function(c){return as[c]===f.id});
    return'<article class="dp-t'+(bad.length?' bad':'')+(pick?' tgt':'')+'" data-t="'+f.id+'"><header><b>'+bn(f)+'</b>'+(f.adr?'<span class="dp-adr">ADR</span>':'')+'<small>'+fmt(f.kg)+' '+t('kg')+(f.v?' · '+f.v+' '+t('m3'):' · '+t('open'))+'</small></header>'+
      '<p class="pn-mu">'+esc(f.dr)+' · '+f.pl+'</p>'+bar(s.kg/f.kg,t('kg')+' '+pct(s.kg/f.kg))+(f.v?bar(s.v/f.v,t('m3')+' '+pct(s.v/f.v)):'')+
      (bad.length?'<p class="dp-err">'+bad.map(esc).join(' · ')+'</p>':'')+'<div class="dp-in">'+cs.map(function(c){return chipC(CG[c],'in')}).join('')+'</div>'+
      (head()&&cs.length?'<p class="dp-money">'+t('rate_c')+': '+fmt(cs.reduce(function(a,c){return a+bidOf(CG[c])},0))+' $ · '+t('margin')+': '+fmt(cs.reduce(function(a,c){return a+bidOf(CG[c])},0)*.21)+' $</p>':'')+'</article>'}).join('')+'</section></div>';
  return h}
function moveTo(c,to){S.as=S.as||{};S.as[c]=to==='q'?undefined:to;if(to==='q')delete S.as[c];log('l_move',c+' → '+(to==='q'?t('queue'):TR[to].dr));pick=null;render()}

function mapSvg(){var cities=Object.keys(P).map(function(k){return'<g class="dp-city'+(k==='tas'?' hub':'')+'"><circle cx="'+P[k][0]+'" cy="'+P[k][1]+'" r="'+(k==='tas'?9:5)+'"/><text x="'+(P[k][0]+(P[k][0]>880||k==='tas'?-14:10))+'" y="'+(P[k][1]+(k==='tas'?-16:-10))+'"'+(P[k][0]>880||k==='tas'?' text-anchor="end"':'')+'>'+esc(C[k])+'</text></g>'}).join('');
  var dots='';for(var x=20;x<1000;x+=24)for(var y=20;y<600;y+=24){var v=Math.sin(x*.012)*Math.cos(y*.016)+Math.sin((x+y)*.005);if(v>.15)dots+='<circle cx="'+x+'" cy="'+y+'" r="1.8"/>'}
  return'<svg viewBox="0 0 1000 600" class="dp-map" role="img" aria-label="'+t('map_a')+'"><defs><linearGradient id="gArcD" x1="0" x2="1"><stop offset="0" stop-color="#f6c445"/><stop offset=".5" stop-color="#f08a24"/><stop offset="1" stop-color="#e5352b"/></linearGradient></defs><g class="dp-land">'+dots+'</g>'+RUN.map(function(r,i){return'<path id="rt'+i+'" class="dp-road'+(r.st==='late'?' late':'')+'" d="'+road('tas',r.to)+'"/>'}).join('')+
  (RUN[4].off?'<path class="dp-dev" d="M'+P.tas[0]+' '+P.tas[1]+' q 120 -120 260 -40"/>':'')+cities+RUN.map(function(r,i){return'<g class="dp-m s-'+r.st+(drv===i?' on':'')+'" data-d="'+i+'" tabindex="0" role="button" aria-label="'+esc(r.f.dr)+'"><circle r="14" class="halo"/><circle r="8"/><text y="4">'+(i+1)+'</text></g>'}).join('')+'</svg>'}
function eta(r){if(r.st==='free'||r.st==='load')return'-';var L=$('#rt'+RUN.indexOf(r));var left=L?L.getTotalLength()*(1-r.k):300;var h=left/(r.spd||30)*.9;return Math.floor(h)+' '+t('h')+' '+Math.round(h%1*60)+' '+t('min')}
function vMap(){var ev=[[RUN[4],'e_off'],[RUN[9],'e_idle'],[RUN[7],'e_late'],[RUN[5],'e_load']];
  return'<div class="dp-mapw"><section class="pn-card dp-mc">'+mapSvg()+'<div class="dp-leg">'+['go','load','free','idle','late'].map(function(s){return'<span class="s-'+s+'"><i></i>'+t('s_'+s)+'</span>'}).join('')+'</div></section>'+
  '<aside class="pn-card dp-side" id="dside">'+(drv!=null?card(RUN[drv]):'<h3>'+t('ev')+'</h3>'+ev.map(function(e){return'<button type="button" class="dp-ev" data-d="'+RUN.indexOf(e[0])+'"><b>'+t(e[1])+'</b><span>'+esc(e[0].f.dr)+' · '+esc(C[e[0].to])+'</span></button>'}).join('')+'<p class="pn-mu">'+t('m_hint')+'</p>')+'</aside></div>'}
function card(r){var cs=S.as?Object.keys(S.as).filter(function(c){return S.as[c]===r.f.id}):[];var msg=encodeURIComponent(t('tg_msg')+' '+r.f.dr);
  return'<button type="button" class="btn btn-g btn-s" id="dback">'+t('back')+'</button><h3>'+esc(r.f.dr)+'</h3><p class="pn-mu">'+bn(r.f)+' · '+r.f.pl+'</p>'+
  '<p><span class="dp-st s-'+r.st+'">'+t('s_'+r.st)+'</span></p><div class="dp-kv"><span>'+t('route')+'</span><b>'+esc(C.tas)+' → '+esc(C[r.to])+'</b><span>'+t('prog')+'</span><b id="dk">'+pct(r.k)+'</b><span>ETA</span><b id="deta">'+eta(r)+'</b><span>'+t('speed')+'</span><b>'+r.spd+' '+t('kmh')+'</b><span>'+t('ping')+'</span><b>'+r.ping+' '+t('min_ago')+'</b><span>'+t('fuel')+'</span><b>'+r.fuel+'%</b><span>'+t('odo')+'</span><b>'+r.odo+' '+t('km')+'</b></div>'+
  bar(r.k,t('prog'))+'<p class="pn-mu">'+t('onboard')+': '+(cs.length?cs.join(', '):t('empty'))+'</p>'+
  '<div class="dp-call"><a class="btn btn-a btn-s" href="tel:'+D.tel+'">'+t('call')+'</a><a class="btn btn-g btn-s" href="https://t.me/share/url?url=cargoprogroup.uz&amp;text='+msg+'" target="_blank" rel="noopener">Telegram</a></div>'}

var STEPS=[0,2,3,4,5];
function stOf(id,def){var P2=get('cp-panel-1',{});return P2.st&&P2.st[id]!==undefined?P2.st[id]:def}
function setSt(id,s){var P2=get('cp-panel-1',{});P2.st=P2.st||{};P2.st[id]=s;P2.log=P2.log||[];P2.log.unshift({at:Date.now(),who:'manager',w:'l_st',r:id+' · '+t('k_'+s)});put('cp-panel-1',P2)}
function trips(){var site=get('cp-req-1',[]).map(function(r,i){return{id:r.id,co:r.co||r.n,dr:FLEET[i%FLEET.length],s0:0,site:1,dir:r.dir,rt:Math.round(r.tot||600)}});
  return site.concat(D.trips.map(function(x,i){return{id:x[0],co:t('co')+' «'+TN[x[2]]+'»',dr:FLEET[6+i],s0:x[1],rt:x[3]}}))}
function vTrips(){var ed=can('trips')>=2;return'<p class="pn-hint">'+t('t_hint')+(can('set')>=1?' <a class="dp-to-r-b" '+hl('wt')+'>'+t('wt_t_h')+': '+t('st_go')+'</a>':'')+'</p>'+trips().map(function(o){var s=stOf(o.id,o.s0);
  return'<section class="pn-card dp-trip"><header><b>'+o.id+'</b>'+(o.site?' <span class="pn-new">'+t('new')+'</span>':'')+'<span class="pn-mu">'+esc(o.co)+' · '+esc(o.dr.dr)+'</span></header><ol class="dp-tl">'+
  STEPS.map(function(k){return'<li><button type="button" data-tr="'+o.id+'" data-s="'+k+'" aria-pressed="'+(k===s)+'" class="'+(k<s?'done':'')+'"'+(ed?'':' disabled')+'>'+t('k_'+k)+'</button></li>'}).join('')+'</ol>'+
  (head()?'<p class="dp-money">'+t('rate_c')+': '+fmt(o.rt)+' $ · '+t('pay')+': '+fmt(o.rt*.79)+' $ · '+t('margin')+': '+fmt(o.rt-Math.round(o.rt*.79))+' $</p>':'<p class="pn-mu">'+t('money_h')+'</p>')+tripExtras(o)+'</section>'}).join('')}
function doc(n){return n<0?'<b class="dp-bad">'+t('d_exp')+'</b>':n<30?'<b class="warn">'+n+' '+t('days')+'</b>':'<span>'+n+' '+t('days')+'</span>'}
function vDrivers(){var c=offFor?CG[offFor]:CARGO[0];
  var cand=FLEET.filter(function(f){return FIT[c.ty].indexOf(f.b)>=0}).map(function(f){var dist={sam:300,bux:570,nav:470,fer:310,and:360,nuk:1100,ter:700,alm:810,bis:620}[c.to]||400;return{f:f,price:Math.round(dist*f.km*(.55+f.kg/20000*.9)+40)}});
  cand.sort(function(a,b){return sortBy==='rate'?b.f.rate-a.f.rate:a.price-b.price});
  return'<section class="pn-card"><h3>'+t('choose')+'</h3><p class="pn-mu">'+t('ch_hint')+'</p><div class="dp-act"><label class="fld"><span>'+t('cargo')+'</span><select id="ofc">'+CARGO.map(function(x){return'<option value="'+x.id+'"'+(x.id===c.id?' selected':'')+'>'+x.id+' · '+tyName(x)+' · '+esc(C[x.to])+'</option>'}).join('')+'</select></label>'+
  '<div class="pn-seg" role="group"><button type="button" data-sort="rate" aria-pressed="'+(sortBy==='rate')+'">'+t('by_rate')+'</button><button type="button" data-sort="price" aria-pressed="'+(sortBy==='price')+'">'+t('by_price')+'</button></div></div>'+
  '<div class="dp-offers">'+(cand.length?cand.map(function(o,i){return'<div class="dp-off'+(i===0?' best':'')+'"><b>'+esc(o.f.dr)+'</b><span>★ '+o.f.rate.toFixed(2)+' · '+o.f.trips+' '+t('trips')+'</span><span>'+bn(o.f)+'</span><b class="pr">'+fmt(o.price)+' $</b><button type="button" class="btn btn-g btn-s" data-give="'+o.f.id+'">'+t('give')+'</button></div>'}).join(''):'<p class="pn-mu">'+t('u_body')+'</p>')+'</div></section>'+
  '<section class="pn-card"><h3>'+t('tab_drivers')+'</h3><table class="pn-t"><thead><tr><th>'+t('driver')+'</th><th>'+t('rating')+'</th><th>'+t('trips')+'</th><th>'+t('lates')+'</th><th>'+t('lic')+'</th><th>'+t('tech')+'</th><th>'+t('ins')+'</th></tr></thead><tbody>'+
  FLEET.map(function(f){return'<tr><td>'+esc(f.dr)+'<br><small class="pn-mu">'+bn(f)+' · '+f.pl+'</small></td><td>★ '+f.rate.toFixed(2)+'</td><td>'+f.trips+'</td><td>'+(f.late>3?'<b class="warn">'+f.late+'</b>':f.late)+'</td><td>'+doc(f.doc[0])+'</td><td>'+doc(f.doc[1])+'</td><td>'+doc(f.doc[2])+'</td></tr>'}).join('')+'</tbody></table></section>'}
function vLog(){var who=function(r){return U['role_'+r]?t('role_'+r):r};return'<div class="pn-card">'+(S.log.length?S.log.map(function(x){return'<div class="pn-log"><time>'+new Date(x.at).toLocaleString()+'</time><b>'+who(x.who)+'</b><span>'+t(x.w)+(x.r?' '+esc(x.r):'')+'</span></div>'}).join(''):'<p class="pn-mu">'+t('l_none')+'</p>')+'</div>'}
var toastT;function toast(m){var e=$('#pt');if(!e){e=d.createElement('div');e.id='pt';e.className='toast';e.setAttribute('role','status');d.body.appendChild(e)}e.textContent=m;e.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){e.classList.remove('on')},2200)}

function render(){var v=$('#pv');if(!v)return;
  v.innerHTML=view==='set'?vSet():view==='route'?vRoute():view==='fleet'?vFleet():view==='int'?vInt():view==='map'?vMap():view==='trips'?vTrips():view==='drivers'?vDrivers():view==='log'?vLog():vPlan();
  var g=function(s,f){var e=$(s,v);if(e)e.addEventListener('click',f)};
  g('#dist',function(){S.why={};S.as=plan();var n=Object.keys(S.as).filter(function(c){return S.as[c]}).length;log('l_dist',n+'/'+CARGO.length);render();toast(t('dist_ok')+' '+n+'/'+CARGO.length)});
  g('#toroute',function(){location.hash='route'});
  g('#reset',function(){S.as=null;S.why={};pick=null;log('l_reset');render()});
  g('#dback',function(){drv=null;render()});
  $$('[data-c]',v).forEach(function(b){b.addEventListener('click',function(e){e.stopPropagation();pick=pick===b.getAttribute('data-c')?null:b.getAttribute('data-c');render()});
    b.addEventListener('dragstart',function(e){e.dataTransfer.setData('text/plain',b.getAttribute('data-c'))})});
  $$('[data-t],[data-drop]',v).forEach(function(z){var to=z.getAttribute('data-t')||'q';
    z.addEventListener('click',function(){if(pick)moveTo(pick,to)});
    z.addEventListener('dragover',function(e){e.preventDefault()});
    z.addEventListener('drop',function(e){e.preventDefault();var c=e.dataTransfer.getData('text/plain');if(c)moveTo(c,to)})});
  $$('[data-d]',v).forEach(function(m){var go=function(){drv=+m.getAttribute('data-d');render()};m.addEventListener('click',go);m.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}})});
  $$('[data-tr]',v).forEach(function(b){b.addEventListener('click',function(){var id=b.getAttribute('data-tr'),s=+b.getAttribute('data-s');setSt(id,s);onStatus(id,s);log('l_st',id+' · '+t('k_'+s));render();toast(t('synced'))})});
  var ofc=$('#ofc',v);if(ofc)ofc.addEventListener('change',function(){offFor=ofc.value;render()});
  $$('[data-sort]',v).forEach(function(b){b.addEventListener('click',function(){sortBy=b.getAttribute('data-sort');render()})});
  $$('[data-give]',v).forEach(function(b){b.addEventListener('click',function(){var c=offFor||CARGO[0].id,f=b.getAttribute('data-give');S.as=S.as||{};S.as[c]=f;log('l_give',c+' → '+TR[f].dr);toast(t('given'));render()})});
  if(view==='route')bindRoute(v);
  if(view==='fleet')bindFleet(v);
  if(view==='int')bindInt(v);
  if(view==='trips')bindTrips(v);
  if(view==='set')bindSet(v);
  if(view==='map')place()}

/* Sbornye gruzy i posledovatelnyy zabor. Koordinaty rayonov Tashkenta (shirota, dolgota), rasstoyanie: po pryamoy (gaversinus)
   x koeffitsient dorog, orientir. Poryadok: blizhayshiy sosed, potom 2-opt i perestanovki po stoimosti (km + shtraf za opozdanie v okno). */
var RF=/*~*/1.35,CITY_V=26,LOAD_H=1/3,T0=8.5,FUELP=11900;
var GEO={base:[41.2905,69.2585],chi:[41.2757,69.2034],yun:[41.3647,69.2849],mu:[41.3248,69.3346],ser:[41.2263,69.2192],shy:[41.3241,69.2286],uch:[41.2989,69.1704],bek:[41.2091,69.3347],yas:[41.2900,69.3400],olm:[41.3517,69.2133],mir:[41.2925,69.2814],exit:[41.2440,69.1330]};
/* Gde podpis rayona otnositelno tochki: dx, dy, vyravnivanie. */
var LBL={mu:[0,34,'middle'],yas:[14,-12,''],mir:[14,-16,''],base:[14,30,''],exit:[-10,-18,''],bek:[-12,-12,'end'],yun:[12,-12,''],uch:[-12,-12,'end'],chi:[-14,-14,'end'],ser:[14,8,'']};
var LPK={van:12,b5:18,b10:24,fura:31,ref:33,c20:30,c40:32,tral:42};
var TN2=['[[t:5]]','[[t:6]]','[[t:7]]','[[t:8]]','[[t:9]]'];
var ORD=[['S-01','chi','gen',0,1200,6,9,12,'tex'],['S-02','yun','gen',1,900,6,10,13,'food'],['S-03','mu','gen',0,1600,7,9,14,'parts'],['S-04','ser','gen',0,2100,8,12,16,'tile'],
  ['S-05','shy','gen',0,700,4,9,11.5,'box'],['S-06','uch','dg',0,800,3,10,15,'paint'],['S-07','bek','gen',0,1500,6,13,17,'furn'],['S-08','yas','ref',1,1300,6,9,12,'milk'],['S-09','olm','gen',0,2600,10,9,15,'ele'],
  ['S-10','mir','gen',0,600,3,11,15,'pap']].map(function(x,i){return{id:x[0],at:x[1],ty:x[2],food:!!x[3],kg:x[4],v:x[5],w:[x[6],x[7]],g:x[8],co:t('co')+' «'+(i<5?TN2[i]:TN[i-5])+'»'}});
var OG={};ORD.forEach(function(o){OG[o.id]=o});
var RTR=['T5','T6','T8','T3'];
var R={tr:'T5',add:false,cons:null,opt:null,naive:null,cur:null,ins:null,k:0,drawn:false};
function hav(a,b){var A=GEO[a],B=GEO[b],r=Math.PI/180,dl=(B[0]-A[0])*r,dn=(B[1]-A[1])*r,h=Math.sin(dl/2)*Math.sin(dl/2)+Math.cos(A[0]*r)*Math.cos(B[0]*r)*Math.sin(dn/2)*Math.sin(dn/2);return 12742*Math.asin(Math.sqrt(h))*RF}
function hm(h){var m=Math.round(h*60);return('0'+Math.floor(m/60)).slice(-2)+':'+('0'+m%60).slice(-2)}
function cons(f){var inn=[],left=[],kg=0,v=0,food=false,dg=false;
  ORD.filter(function(o){return o.id!=='S-10'}).slice().sort(function(a,b){return a.w[0]-b.w[0]||b.kg-a.kg}).forEach(function(o){var r=null;
    if(o.ty==='ref'&&f.b!=='ref')r=t('r_ref');else if(o.ty==='dg'&&!f.adr)r=t('w_adr');else if((o.ty==='dg'&&food)||(o.food&&dg))r=t('r_food');
    else if(kg+o.kg>f.kg)r=t('w_kg')+' +'+fmt(kg+o.kg-f.kg)+' '+t('kg');else if(f.v&&v+o.v>f.v)r=t('w_v')+' +'+fv(v+o.v-f.v)+' '+t('m3');
    if(r)left.push({o:o,r:r});else{inn.push(o.id);kg+=o.kg;v+=o.v;if(o.food)food=true;if(o.ty==='dg')dg=true}});
  return{inn:inn,left:left,kg:kg,v:v}}
/* Prosmotr poryadka: km, chasy, opozdaniya. Ranshe okna - zhdyom otkrytiya. */
function sim(seq){var km=0,h=T0,at='base',late=0,rows=[];
  seq.forEach(function(id){var o=OG[id],d=hav(at,o.at);km+=d;h+=d/CITY_V;var wait=h<o.w[0]?o.w[0]-h:0;h+=wait;var lt=h>o.w[1]?h-o.w[1]:0;late+=lt;rows.push({id:id,eta:h,wait:wait,late:lt,d:d});h+=LOAD_H;at=o.at});
  var e=hav(at,'exit');km+=e;h+=e/CITY_V;return{km:km,h:h-T0,end:h,late:late,rows:rows,last:e}}
function cost(seq){var s=sim(seq);return s.km+s.late*400}
function optimize(ids){if(!ids.length)return[];var left=ids.slice(),seq=[],at='base';
  while(left.length){left.sort(function(a,b){return hav(at,OG[a].at)-hav(at,OG[b].at)});var n=left.shift();seq.push(n);at=OG[n].at}
  var best=cost(seq),it=0,imp=true,i,j;
  while(imp&&it++<200){imp=false;
    for(i=0;i<seq.length-1;i++)for(j=i+1;j<seq.length;j++){var c=seq.slice(0,i).concat(seq.slice(i,j+1).reverse(),seq.slice(j+1)),k=cost(c);if(k<best-1e-6){seq=c;best=k;imp=true}}
    for(i=0;i<seq.length;i++)for(j=0;j<seq.length;j++){if(i===j)continue;var c2=seq.slice(),x=c2.splice(i,1)[0];c2.splice(j,0,x);var k2=cost(c2);if(k2<best-1e-6){seq=c2;best=k2;imp=true}}}
  return seq}
function insertCheap(seq,id){var best=null;for(var p=0;p<=seq.length;p++){var c=seq.slice();c.splice(p,0,id);var k=cost(c);if(!best||k<best.k)best={seq:c,k:k,p:p}}return best}
function rBuild(){var f=TR[R.tr];R.cons=cons(f);var ids=R.cons.inn.slice();R.ins=null;
  if(R.add){var o=OG['S-10'],okk=R.cons.kg+o.kg<=f.kg&&(!f.v||R.cons.v+o.v<=f.v);if(okk){R.cons.kg+=o.kg;R.cons.v+=o.v}else{R.add=false;R.ins={no:1}}}
  R.naive=ids.slice().sort();R.opt=optimize(ids);
  if(R.add){var b=insertCheap(R.opt,'S-10'),before=sim(R.opt).km;R.ins={km:sim(b.seq).km-before,a:b.p?OG[b.seq[b.p-1]].at:'base',b:b.p<b.seq.length-1?OG[b.seq[b.p+1]].at:'exit'};R.opt=b.seq;R.naive=R.naive.concat(['S-10'])}
  R.cur=R.opt.slice();R.k=0;R.drawn=false}
/* Karta goroda: proektsiya shiroty i dolgoty v svg, rayony podpisany. */
function xy(k){var g=GEO[k];return[Math.round(20+(g[1]-69.11)*83.5*31),Math.round(20+(41.375-g[0])*111*31)]}
function dpath(seq){var pts=['base'].concat(seq.map(function(id){return OG[id].at}),['exit']).map(xy),s='M'+pts[0][0]+' '+pts[0][1];
  for(var i=1;i<pts.length;i++){var a=pts[i-1],b=pts[i],mx=(a[0]+b[0])/2+(b[1]-a[1])*.12,my=(a[1]+b[1])/2-(b[0]-a[0])*.12;s+=' Q '+mx.toFixed(0)+' '+my.toFixed(0)+' '+b[0]+' '+b[1]}return s}
function rMap(){var dots='',x,y;for(x=14;x<680;x+=22)for(y=14;y<640;y+=22){var v=Math.sin(x*.02)*Math.cos(y*.017)+Math.sin((x+y)*.008);if(v>-.2)dots+='<circle cx="'+x+'" cy="'+y+'" r="1.6"/>'}
  var c=xy('base'),ring='<ellipse class="dp-ring" cx="'+(c[0]+10)+'" cy="'+(c[1]-30)+'" rx="250" ry="235"/>',rows=sim(R.cur).rows;
  var labs=Object.keys(GEO).map(function(k){var o=LBL[k]||[12,-12,''],p=xy(k),hub=k==='base'||k==='exit',on=hub||R.cur.some(function(id){return OG[id].at===k});return'<g class="dp-dst'+(on?' on':'')+(hub?' hub':'')+'"><circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+(hub?8:4)+'"/><text x="'+(p[0]+o[0])+'" y="'+(p[1]+o[1])+'"'+(o[2]?' text-anchor="'+o[2]+'"':'')+'>'+esc(D.dist[k])+'</text></g>'}).join('');
  var nums=R.cur.map(function(id,i){var p=xy(OG[id].at);return'<g class="dp-sn'+(rows[i].late?' late':'')+'" transform="translate('+p[0]+' '+p[1]+')"><circle r="13"/><text y="5">'+(i+1)+'</text></g>'}).join('');
  return'<svg viewBox="-40 0 780 660" class="dp-map dp-cmap" role="img" aria-label="'+t('r_map')+'"><defs><linearGradient id="gArcR" x1="0" x2="1"><stop offset="0" stop-color="#f6c445"/><stop offset=".5" stop-color="#f08a24"/><stop offset="1" stop-color="#e5352b"/></linearGradient></defs><g class="dp-land">'+dots+'</g>'+ring+
  '<path class="dp-naive" d="'+dpath(R.naive)+'"/><path id="rpath" class="dp-rp" d="'+dpath(R.cur)+'"/>'+labs+nums+'<g id="rtruck" class="dp-m s-go"><circle r="14" class="halo"/><circle r="8"/></g></svg>'}
function stat(s,f){var L=s.km*LPK[f.b]/100;return{km:s.km,h:s.h,L:L,m:L*FUELP}}
function dur(h){return Math.floor(h)+' '+t('h')+' '+Math.round(h%1*60)+' '+t('min')}
function sbox(cls,title,s,f,extra){var x=stat(s,f);return'<div class="dp-sb '+cls+'"><small>'+title+'</small><b>'+fv(x.km.toFixed(1))+' '+t('km')+'</b><span>'+dur(x.h)+' '+t('r_hours')+'</span><span>'+fv(x.L.toFixed(1))+' '+t('r_l')+' · '+t('r_fuel')+'</span>'+(head()?'<span class="dp-money">'+fmt(x.m)+' '+t('sum')+'</span>':'')+(s.late?'<span class="dp-err">'+t('r_late')+'</span>':'')+(extra||'')+'</div>'}
function vRoute(){if(!R.cons)rBuild();var f=TR[R.tr],sn=sim(R.naive),so=sim(R.opt),sc=sim(R.cur),own=R.cur.join()!==R.opt.join();
  var sv=sn.km-so.km,sp=sn.km?sv/sn.km:0,dL=sv*LPK[f.b]/100;
  var h='<p class="pn-hint">'+t('r_hint')+'</p><div class="dp-act"><label class="fld"><span>'+t('r_truck')+'</span><select id="rtr">'+RTR.map(function(id){var x=TR[id];return'<option value="'+id+'"'+(id===R.tr?' selected':'')+'>'+bn(x)+(x.adr?' · ADR':'')+' · '+esc(x.dr)+'</option>'}).join('')+'</select></label>'+
    '<button type="button" class="btn btn-a" id="rbuild">'+t('r_build')+'</button><button type="button" class="btn btn-g btn-s" id="radd">'+(R.add?t('r_rm'):t('r_add')+': S-10, '+esc(D.dist.mir))+'</button></div>';
  h+='<div class="dp-rg"><section class="pn-card dp-rin"><h3>'+t('r_in')+' <small class="pn-mu">'+R.cur.length+' · '+esc(f.dr)+'</small></h3>'+bar(R.cons.kg/f.kg,t('kg')+' '+fmt(R.cons.kg)+' / '+fmt(f.kg)+' · '+pct(R.cons.kg/f.kg))+(f.v?bar(R.cons.v/f.v,t('m3')+' '+fv(R.cons.v)+' / '+f.v+' · '+pct(R.cons.v/f.v)):'')+
    (R.ins&&R.ins.no?'<p class="dp-err">S-10: '+t('r_nofit')+'</p>':'')+(R.ins&&R.ins.km!=null?'<p class="dp-ok" id="rins">'+t('r_added')+' '+esc(D.dist[R.ins.a])+' · '+esc(D.dist[R.ins.b])+': +'+fv(R.ins.km.toFixed(1))+' '+t('km')+'</p>':'')+
    '<h3 class="dp-h4">'+t('r_left')+' <small class="pn-mu">'+R.cons.left.length+'</small></h3>'+(R.cons.left.length?R.cons.left.map(function(x){return'<div class="dp-lo"><b>'+x.o.id+'</b> <span>'+esc(D.dist[x.o.at])+' · '+t('g_'+x.o.g)+' · '+fmt(x.o.kg)+' '+t('kg')+'</span><p class="dp-why">'+esc(x.r)+'</p></div>'}).join(''):'<p class="pn-mu">'+t('q_none')+'</p>')+'</section>';
  h+='<section class="pn-card dp-cmw">'+rMap()+'<div class="dp-leg"><span class="lg-o"><i></i>'+t('r_opt')+'</span><span class="lg-n"><i></i>'+t('r_naive')+'</span></div><p class="pn-mu dp-note">'+t('r_km_note')+'. '+t('r_price')+'.</p></section></div>';
  h+='<div class="dp-cmp">'+sbox('n',t('r_naive'),sn,f)+sbox('o',t('r_opt'),so,f,'<span class="dp-save" id="rsave" data-km="'+sv.toFixed(2)+'">'+t('r_save')+' '+fv(sv.toFixed(1))+' '+t('km')+' ('+Math.round(sp*100)+'%) · '+fv(dL.toFixed(1))+' '+t('r_l')+(head()?' · '+fmt(dL*FUELP)+' '+t('sum'):'')+'</span>')+(own?sbox('m',t('r_mine'),sc,f,'<span class="dp-err" id="rworse">'+t('r_worse')+' '+fv((sc.km-so.km).toFixed(1))+' '+t('km')+'</span>'):'')+'</div>';
  h+='<section class="pn-card"><h3>'+t('r_stops')+'</h3><p class="pn-mu">'+t('r_start_t')+' · '+t('r_load20')+'</p><ol class="dp-stops"><li class="hub"><b>'+esc(D.dist.base)+'</b><span>'+hm(T0)+'</span></li>'+
    sc.rows.map(function(r,i){var o=OG[r.id];return'<li class="'+(r.late?'late':'')+'"><span class="n">'+(i+1)+'</span><div><b>'+r.id+' · '+esc(D.dist[o.at])+'</b><small>'+esc(o.co)+' · '+t('g_'+o.g)+' · '+fmt(o.kg)+' '+t('kg')+' · '+fv(o.v)+' '+t('m3')+'</small><small>'+t('r_win')+' '+hm(o.w[0])+'-'+hm(o.w[1])+' · '+t('r_eta')+' '+hm(r.eta)+' · '+(r.late?'<em class="dp-bad">'+t('r_late')+'</em>':r.wait?t('r_wait'):t('r_ok'))+'</small></div><span class="mv"><button type="button" class="btn btn-g btn-s" data-up="'+i+'" aria-label="'+t('r_up')+'"'+(i?'':' disabled')+'>↑</button><button type="button" class="btn btn-g btn-s" data-dn="'+i+'" aria-label="'+t('r_down')+'"'+(i<sc.rows.length-1?'':' disabled')+'>↓</button></span></li>'}).join('')+
    '<li class="hub"><b>'+esc(D.dist.exit)+'</b><span>'+hm(sc.end)+'</span></li></ol><p class="pn-mu">'+t('r_lifo')+' '+t('r_dest')+'</p><div class="dp-act">'+(own?'<button type="button" class="btn btn-g" id="rback">'+t('r_back')+'</button>':'')+
    '<a class="btn btn-a" id="rsend" href="https://t.me/share/url?url=cargoprogroup.uz&amp;text='+encodeURIComponent(t('r_msg')+', '+bn(f)+', '+f.dr+': '+sc.rows.map(function(r,i){return(i+1)+') '+D.dist[OG[r.id].at]+' '+r.id+' '+hm(OG[r.id].w[0])+'-'+hm(OG[r.id].w[1])}).join('; ')+'; '+D.dist.exit)+'" target="_blank" rel="noopener">'+t('r_send')+'</a></div>'+(head()?'':'<p class="pn-mu">'+t('r_money_h')+'</p>')+'</section>';
  return h}
function bindRoute(v){var g=function(s,f){var e=$(s,v);if(e)e.addEventListener('click',f)};
  var sel=$('#rtr',v);if(sel)sel.addEventListener('change',function(){R.tr=sel.value;rBuild();render()});
  g('#rbuild',function(){rBuild();var n=sim(R.naive).km-sim(R.opt).km;log('l_cons',R.cur.length+' · '+TR[R.tr].dr);log('l_opt','-'+fv(n.toFixed(1))+' '+t('km'));render();toast(t('r_built')+' '+fv(n.toFixed(1))+' '+t('km'))});
  g('#radd',function(){R.add=!R.add;rBuild();if(R.ins&&R.ins.km!=null)log('l_ins','S-10 +'+fv(R.ins.km.toFixed(1))+' '+t('km'));render();if(R.ins&&R.ins.no)toast('S-10: '+t('r_nofit'))});
  g('#rback',function(){R.cur=R.opt.slice();R.k=0;R.drawn=false;render()});
  g('#rsend',function(){log('l_send',TR[R.tr].dr)});
  $$('[data-up],[data-dn]',v).forEach(function(b){b.addEventListener('click',function(){var up=b.hasAttribute('data-up'),i=+b.getAttribute(up?'data-up':'data-dn'),j=up?i-1:i+1,x=R.cur[i];R.cur[i]=R.cur[j];R.cur[j]=x;R.k=0;R.drawn=false;log('l_order',R.cur.join(' '));render()})});
  var p=$('#rpath',v);if(p){var L=p.getTotalLength();p.style.strokeDasharray=L;if(RM||R.drawn){p.style.strokeDashoffset=0}else{p.style.strokeDashoffset=L;p.getBoundingClientRect();requestAnimationFrame(function(){p.style.strokeDashoffset=0});R.drawn=true}}
  rDrive(0)}
function rDrive(dt){var p=$('#rpath'),m=$('#rtruck');if(!p||!m)return;R.k=(R.k+dt*0.00004)%1;var L=p.getTotalLength(),q=p.getPointAtLength(L*(RM?0:R.k));m.setAttribute('transform','translate('+q.x.toFixed(1)+' '+q.y.toFixed(1)+')')}

/* Dvizhenie markerov: tolko atribut transform, bez perescheta vyorstki. */
var last=0;
function place(){var j=0;RUN.forEach(function(r,i){var p=$('#rt'+i),m=$('[data-d="'+i+'"]');if(!p||!m)return;var x,y;
  /* Svobodnye i na pogruzke stoyat ryadom so skladom v Tashkente, ne drug na druge. */
  if(!r.k){x=P.tas[0]-34+j*34;y=P.tas[1]+40;j++}else{var L=p.getTotalLength(),pt=p.getPointAtLength(L*r.k);x=pt.x;y=pt.y}
  m.setAttribute('transform','translate('+x.toFixed(1)+' '+y.toFixed(1)+')')});
  if(drv!=null){var k=$('#dk'),e=$('#deta');if(k)k.textContent=pct(RUN[drv].k);if(e)e.textContent=eta(RUN[drv])}}
function tick(ts){var dt=last?Math.min(64,ts-last):16;last=ts;
  RUN.forEach(function(r){if(r.sp){r.k+=r.sp*dt* /*~*/1.0;if(r.k>.97)r.k=.06}});
  if(view==='map'&&!d.hidden)place();if(view==='route'&&!d.hidden)rDrive(dt);requestAnimationFrame(tick)}
/*@@SUPER@@*/
/*@@SETTINGS@@*/
view=vw();shell();render();if(!RM)requestAnimationFrame(tick);
})();
