/* Dispetcherskaya CARGO PRO GROUP (TMS): raspredelenie gruzov po mashinam
   (tip kuzova, ves i obyom, first-fit decreasing), ruchnoy perenos s
   proverkoy, voditeli na karte (dvizhutsya po marshrutam, geozony), reysy so
   statusami (pishet cp-panel-1.st, sayt chitaet ego v «Gde gruz»), voditeli
   i reyting, vybor perevozchika po reytingu i tsene, roli i istoriya.
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
var head=function(){return S.role==='head'};
var view=location.hash.slice(1)||'plan',pick=null,drv=null,offFor=null,sortBy='rate';

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
].map(function(x,i){return{id:x[0],ty:x[1],kg:x[2],v:x[3],to:x[4],dl:x[5],pal:x[3]?Math.max(1,Math.round(x[3]/1.8)):0,co:t('co')+' «'+TN[(i+2)%TN.length]+'»',bid:Math.round((x[2]/1000*38+60)*(x[1]==='ref'?1.4:x[1]==='oog'?2.2:x[1]==='dg'?1.3:1))}});
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

function shell(){var tabs=['plan','map','trips','drivers','log'];
  $('#app').innerHTML='<header class="pn-top"><div class="pn-brand"><img src="'+D.logo+'" alt="CARGO PRO GROUP" width="670" height="249"><span>'+t('title')+' · '+t('demo')+'</span></div>'+
  '<label class="pn-role"><span>'+t('role')+'</span><select id="role"><option value="disp">'+t('role_disp')+'</option><option value="head">'+t('role_head')+'</option></select></label>'+
  '<a class="btn btn-g btn-s" href="'+D.home+'">'+t('home')+'</a><a class="btn btn-g btn-s" href="'+D.panel+'">'+t('panel')+'</a><a class="btn btn-a btn-s" href="'+D.site+'">'+t('site')+'</a></header>'+
  '<nav class="pn-tabs">'+tabs.map(function(x){return'<a href="#'+x+'" data-v="'+x+'"'+(x===view?' aria-current="page"':'')+'>'+t('tab_'+x)+'</a>'}).join('')+'</nav>'+
  '<div class="dp-go"><b>'+t('go_t')+'</b><span>'+t('go_e')+'</span><a href="'+D.gp+'" target="_blank" rel="noopener">Google Play</a><a href="'+D.as+'" target="_blank" rel="noopener">App Store</a></div><main class="pn-main" id="pv"></main>';
  $('#role').value=S.role;$('#role').addEventListener('change',function(e){S.role=e.target.value;log('l_role',t(S.role==='head'?'role_head':'role_disp'));render()})}
addEventListener('hashchange',function(){view=location.hash.slice(1)||'plan';drv=null;shell();render()});

function bar(x,lab){var c=x>1?'bad':x>.85?'hi':'';return'<div class="dp-bar '+c+'"><i style="transform:scaleX('+Math.min(1,x).toFixed(3)+')"></i><span>'+lab+'</span></div>'}
function tyName(c){return t('ty_'+c.ty)}
function chipC(c,cls){return'<button type="button" class="dp-c '+(cls||'')+' ty-'+c.ty+(pick===c.id?' sel':'')+'" data-c="'+c.id+'" draggable="true"><b>'+c.id+'</b><span>'+tyName(c)+' · '+fmt(c.kg)+' '+t('kg')+(c.v?' · '+fv(c.v)+' '+t('m3'):'')+(c.pal?' · '+c.pal+' '+t('pal'):'')+'</span><small>'+esc(C[c.to])+' · '+t(c.dl)+'</small></button>'}
function vPlan(){var as=S.as;
  var q=CARGO.filter(function(c){return!as||!as[c.id]});
  var h='<p class="pn-hint">'+t('p_hint')+'</p><div class="dp-act"><button type="button" class="btn btn-a" id="dist">'+t('dist')+'</button><button type="button" class="btn btn-g btn-s" id="reset">'+t('reset')+'</button>'+(pick?'<span class="dp-pick">'+t('pick')+' <b>'+pick+'</b></span>':'')+'</div>';
  h+='<div class="dp-plan"><section class="pn-card dp-q" data-drop="q"><h3>'+t('queue')+' <small class="pn-mu">'+q.length+'</small></h3>'+(q.length?q.map(function(c){return chipC(c,as&&as[c.id]===null?'un':'')+(as&&as[c.id]===null&&S.why&&S.why[c.id]?'<p class="dp-why">'+esc(S.why[c.id])+'</p>':'')}).join(''):'<p class="pn-mu">'+t('q_none')+'</p>')+'</section>';
  h+='<section class="dp-fleet">'+FLEET.map(function(f){var s=load(as||{},f.id),bad=[];Object.keys(as||{}).forEach(function(c){if(as[c]===f.id)bad=bad.concat(why(CG[c],f,as))});
    bad=bad.filter(function(x,i){return bad.indexOf(x)===i});
    var cs=Object.keys(as||{}).filter(function(c){return as[c]===f.id});
    return'<article class="dp-t'+(bad.length?' bad':'')+(pick?' tgt':'')+'" data-t="'+f.id+'"><header><b>'+t('b_'+f.b)+'</b>'+(f.adr?'<span class="dp-adr">ADR</span>':'')+'<small>'+fmt(f.kg)+' '+t('kg')+(f.v?' · '+f.v+' '+t('m3'):' · '+t('open'))+'</small></header>'+
      '<p class="pn-mu">'+esc(f.dr)+' · '+f.pl+'</p>'+bar(s.kg/f.kg,t('kg')+' '+pct(s.kg/f.kg))+(f.v?bar(s.v/f.v,t('m3')+' '+pct(s.v/f.v)):'')+
      (bad.length?'<p class="dp-err">'+bad.map(esc).join(' · ')+'</p>':'')+'<div class="dp-in">'+cs.map(function(c){return chipC(CG[c],'in')}).join('')+'</div>'+
      (head()&&cs.length?'<p class="dp-money">'+t('rate_c')+': '+fmt(cs.reduce(function(a,c){return a+CG[c].bid},0))+' $ · '+t('margin')+': '+fmt(cs.reduce(function(a,c){return a+CG[c].bid},0)*.21)+' $</p>':'')+'</article>'}).join('')+'</section></div>';
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
  return'<button type="button" class="btn btn-g btn-s" id="dback">'+t('back')+'</button><h3>'+esc(r.f.dr)+'</h3><p class="pn-mu">'+t('b_'+r.f.b)+' · '+r.f.pl+'</p>'+
  '<p><span class="dp-st s-'+r.st+'">'+t('s_'+r.st)+'</span></p><div class="dp-kv"><span>'+t('route')+'</span><b>'+esc(C.tas)+' → '+esc(C[r.to])+'</b><span>'+t('prog')+'</span><b id="dk">'+pct(r.k)+'</b><span>ETA</span><b id="deta">'+eta(r)+'</b><span>'+t('speed')+'</span><b>'+r.spd+' '+t('kmh')+'</b><span>'+t('ping')+'</span><b>'+r.ping+' '+t('min_ago')+'</b><span>'+t('fuel')+'</span><b>'+r.fuel+'%</b><span>'+t('odo')+'</span><b>'+r.odo+' '+t('km')+'</b></div>'+
  bar(r.k,t('prog'))+'<p class="pn-mu">'+t('onboard')+': '+(cs.length?cs.join(', '):t('empty'))+'</p>'+
  '<div class="dp-call"><a class="btn btn-a btn-s" href="tel:'+D.tel+'">'+t('call')+'</a><a class="btn btn-g btn-s" href="https://t.me/share/url?url=cargoprogroup.uz&amp;text='+msg+'" target="_blank" rel="noopener">Telegram</a></div>'}

var STEPS=[0,2,3,4,5];
function stOf(id,def){var P2=get('cp-panel-1',{});return P2.st&&P2.st[id]!==undefined?P2.st[id]:def}
function setSt(id,s){var P2=get('cp-panel-1',{});P2.st=P2.st||{};P2.st[id]=s;P2.log=P2.log||[];P2.log.unshift({at:Date.now(),who:'manager',w:'l_st',r:id+' · '+t('k_'+s)});put('cp-panel-1',P2)}
function trips(){var site=get('cp-req-1',[]).map(function(r,i){return{id:r.id,co:r.co||r.n,dr:FLEET[i%FLEET.length],s0:0,site:1,rt:Math.round(r.tot||600)}});
  return site.concat(D.trips.map(function(x,i){return{id:x[0],co:t('co')+' «'+TN[x[2]]+'»',dr:FLEET[6+i],s0:x[1],rt:x[3]}}))}
function vTrips(){return'<p class="pn-hint">'+t('t_hint')+'</p>'+trips().map(function(o){var s=stOf(o.id,o.s0);
  return'<section class="pn-card dp-trip"><header><b>'+o.id+'</b>'+(o.site?' <span class="pn-new">'+t('new')+'</span>':'')+'<span class="pn-mu">'+esc(o.co)+' · '+esc(o.dr.dr)+'</span></header><ol class="dp-tl">'+
  STEPS.map(function(k){return'<li><button type="button" data-tr="'+o.id+'" data-s="'+k+'" aria-pressed="'+(k===s)+'" class="'+(k<s?'done':'')+'">'+t('k_'+k)+'</button></li>'}).join('')+'</ol>'+
  (head()?'<p class="dp-money">'+t('rate_c')+': '+fmt(o.rt)+' $ · '+t('pay')+': '+fmt(o.rt*.79)+' $ · '+t('margin')+': '+fmt(o.rt-Math.round(o.rt*.79))+' $</p>':'<p class="pn-mu">'+t('money_h')+'</p>')+'</section>'}).join('')}
function doc(n){return n<0?'<b class="dp-bad">'+t('d_exp')+'</b>':n<30?'<b class="warn">'+n+' '+t('days')+'</b>':'<span>'+n+' '+t('days')+'</span>'}
function vDrivers(){var c=offFor?CG[offFor]:CARGO[0];
  var cand=FLEET.filter(function(f){return FIT[c.ty].indexOf(f.b)>=0}).map(function(f){var dist={sam:300,bux:570,nav:470,fer:310,and:360,nuk:1100,ter:700,alm:810,bis:620}[c.to]||400;return{f:f,price:Math.round(dist*f.km*(.55+f.kg/20000*.9)+40)}});
  cand.sort(function(a,b){return sortBy==='rate'?b.f.rate-a.f.rate:a.price-b.price});
  return'<section class="pn-card"><h3>'+t('choose')+'</h3><p class="pn-mu">'+t('ch_hint')+'</p><div class="dp-act"><label class="fld"><span>'+t('cargo')+'</span><select id="ofc">'+CARGO.map(function(x){return'<option value="'+x.id+'"'+(x.id===c.id?' selected':'')+'>'+x.id+' · '+tyName(x)+' · '+esc(C[x.to])+'</option>'}).join('')+'</select></label>'+
  '<div class="pn-seg" role="group"><button type="button" data-sort="rate" aria-pressed="'+(sortBy==='rate')+'">'+t('by_rate')+'</button><button type="button" data-sort="price" aria-pressed="'+(sortBy==='price')+'">'+t('by_price')+'</button></div></div>'+
  '<div class="dp-offers">'+(cand.length?cand.map(function(o,i){return'<div class="dp-off'+(i===0?' best':'')+'"><b>'+esc(o.f.dr)+'</b><span>★ '+o.f.rate.toFixed(2)+' · '+o.f.trips+' '+t('trips')+'</span><span>'+t('b_'+o.f.b)+'</span><b class="pr">'+fmt(o.price)+' $</b><button type="button" class="btn btn-g btn-s" data-give="'+o.f.id+'">'+t('give')+'</button></div>'}).join(''):'<p class="pn-mu">'+t('u_body')+'</p>')+'</div></section>'+
  '<section class="pn-card"><h3>'+t('tab_drivers')+'</h3><table class="pn-t"><thead><tr><th>'+t('driver')+'</th><th>'+t('rating')+'</th><th>'+t('trips')+'</th><th>'+t('lates')+'</th><th>'+t('lic')+'</th><th>'+t('tech')+'</th><th>'+t('ins')+'</th></tr></thead><tbody>'+
  FLEET.map(function(f){return'<tr><td>'+esc(f.dr)+'<br><small class="pn-mu">'+t('b_'+f.b)+' · '+f.pl+'</small></td><td>★ '+f.rate.toFixed(2)+'</td><td>'+f.trips+'</td><td>'+(f.late>3?'<b class="warn">'+f.late+'</b>':f.late)+'</td><td>'+doc(f.doc[0])+'</td><td>'+doc(f.doc[1])+'</td><td>'+doc(f.doc[2])+'</td></tr>'}).join('')+'</tbody></table></section>'}
function vLog(){var who=function(r){return t(r==='head'?'role_head':'role_disp')};return'<div class="pn-card">'+(S.log.length?S.log.map(function(x){return'<div class="pn-log"><time>'+new Date(x.at).toLocaleString()+'</time><b>'+who(x.who)+'</b><span>'+t(x.w)+(x.r?' '+esc(x.r):'')+'</span></div>'}).join(''):'<p class="pn-mu">'+t('l_none')+'</p>')+'</div>'}
var toastT;function toast(m){var e=$('#pt');if(!e){e=d.createElement('div');e.id='pt';e.className='toast';e.setAttribute('role','status');d.body.appendChild(e)}e.textContent=m;e.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){e.classList.remove('on')},2200)}

function render(){var v=$('#pv');if(!v)return;
  v.innerHTML=view==='map'?vMap():view==='trips'?vTrips():view==='drivers'?vDrivers():view==='log'?vLog():vPlan();
  var g=function(s,f){var e=$(s,v);if(e)e.addEventListener('click',f)};
  g('#dist',function(){S.why={};S.as=plan();var n=Object.keys(S.as).filter(function(c){return S.as[c]}).length;log('l_dist',n+'/'+CARGO.length);render();toast(t('dist_ok')+' '+n+'/'+CARGO.length)});
  g('#reset',function(){S.as=null;S.why={};pick=null;log('l_reset');render()});
  g('#dback',function(){drv=null;render()});
  $$('[data-c]',v).forEach(function(b){b.addEventListener('click',function(e){e.stopPropagation();pick=pick===b.getAttribute('data-c')?null:b.getAttribute('data-c');render()});
    b.addEventListener('dragstart',function(e){e.dataTransfer.setData('text/plain',b.getAttribute('data-c'))})});
  $$('[data-t],[data-drop]',v).forEach(function(z){var to=z.getAttribute('data-t')||'q';
    z.addEventListener('click',function(){if(pick)moveTo(pick,to)});
    z.addEventListener('dragover',function(e){e.preventDefault()});
    z.addEventListener('drop',function(e){e.preventDefault();var c=e.dataTransfer.getData('text/plain');if(c)moveTo(c,to)})});
  $$('[data-d]',v).forEach(function(m){var go=function(){drv=+m.getAttribute('data-d');render()};m.addEventListener('click',go);m.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}})});
  $$('[data-tr]',v).forEach(function(b){b.addEventListener('click',function(){var id=b.getAttribute('data-tr'),s=+b.getAttribute('data-s');setSt(id,s);log('l_st',id+' · '+t('k_'+s));render();toast(t('synced'))})});
  var ofc=$('#ofc',v);if(ofc)ofc.addEventListener('change',function(){offFor=ofc.value;render()});
  $$('[data-sort]',v).forEach(function(b){b.addEventListener('click',function(){sortBy=b.getAttribute('data-sort');render()})});
  $$('[data-give]',v).forEach(function(b){b.addEventListener('click',function(){var c=offFor||CARGO[0].id,f=b.getAttribute('data-give');S.as=S.as||{};S.as[c]=f;log('l_give',c+' → '+TR[f].dr);toast(t('given'));render()})});
  if(view==='map')place()}

/* Dvizhenie markerov: tolko atribut transform, bez perescheta vyorstki. */
var last=0;
function place(){var j=0;RUN.forEach(function(r,i){var p=$('#rt'+i),m=$('[data-d="'+i+'"]');if(!p||!m)return;var x,y;
  /* Svobodnye i na pogruzke stoyat ryadom so skladom v Tashkente, ne drug na druge. */
  if(!r.k){x=P.tas[0]-34+j*34;y=P.tas[1]+40;j++}else{var L=p.getTotalLength(),pt=p.getPointAtLength(L*r.k);x=pt.x;y=pt.y}
  m.setAttribute('transform','translate('+x.toFixed(1)+' '+y.toFixed(1)+')')});
  if(drv!=null){var k=$('#dk'),e=$('#deta');if(k)k.textContent=pct(RUN[drv].k);if(e)e.textContent=eta(RUN[drv])}}
function tick(ts){var dt=last?Math.min(64,ts-last):16;last=ts;
  RUN.forEach(function(r){if(r.sp){r.k+=r.sp*dt* /*~*/1.0;if(r.k>.97)r.k=.06}});
  if(view==='map'&&!d.hidden)place();requestAnimationFrame(tick)}
shell();render();if(!RM)requestAnimationFrame(tick);
})();
