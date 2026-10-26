(function(){
'use strict';
/* panel: panel FinTax po etalonu greenwell. Zayavki s saita i podbora
   tarifa (ft-leads-1) prihodyat pervoi strokoi; status, buhgalter,
   zametki i ceny tarifov panel pishet v ft-panel-1, sait chitaet ih
   ottuda. Demo-cifry iz odnogo zerna, shodyatsya mezhdu ekranami. Roli:
   menedzher ne vidit deneg i ne pravit tarify. Kommentarii vyrezaet sborka. */
var d=document,W=window,G=JSON.parse(d.getElementById('fp-data').textContent),U=G.ui;
var $=function(s,r){return (r||d).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))};
function t(k,v){var s=U[k];if(s==null)return k;if(v)for(var x in v)s=s.split('{'+x+'}').join(v[x]);return s}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function ic(k){return '<svg class="ic" aria-hidden="true"><use href="#i-'+k+'"/></svg>'}
function pad(n){return (n<10?'0':'')+n}
function dstr(ts){var x=new Date(ts);return pad(x.getDate())+'.'+pad(x.getMonth()+1)}
function tstr(ts){var x=new Date(ts);return pad(x.getHours())+':'+pad(x.getMinutes())}
function when(ts){var m=(Date.now()-ts)/6e4;if(m<60)return Math.max(1,Math.round(m))+' '+t('min')+' '+t('ago');return dstr(ts)+' '+tstr(ts)}
function mln(x){return (Math.round(x*10)/10).toString().replace('.',G.lang==='en'?'.':',')+' '+t('mln')}

/* Demo iz odnogo zerna */
var zr=20261026;function rnd(){zr=(zr*1664525+1013904223)>>>0;return zr/4294967296}
function pick(a,w){if(!w)return a[Math.floor(rnd()*a.length)];var tot=w.reduce(function(x,y){return x+y},0),r=rnd()*tot,s=0;for(var i=0;i<a.length;i++){s+=w[i];if(r<s)return a[i]}return a[a.length-1]}
var NOW=Date.now(),DAY=864e5,SRC=['site','pick','tg','wa','call'],ST=['new','call','offer','client'],KIND=Object.keys(G.kinds),ACC=G.staff.slice(0,4).map(function(p){return p.n}),MGR=G.heads;
var DEMO=[],n0=1480;
for(var day=59;day>=0;day--){var c=Math.round(1+rnd()*3*(1+(59-day)/80));for(var k=0;k<c;k++){var ts=NOW-day*DAY-rnd()*DAY;if(ts>NOW-2*36e5)continue;var age=(NOW-ts)/DAY,src=pick(SRC,[22,18,34,14,12]),tf=pick([0,1,2,3],[34,36,21,9]);
  var st=age<1.2?pick(ST,[62,30,8,0]):age<6?pick(ST,[10,38,34,18]):pick(ST,[2,22,40,36]);
  DEMO.push({id:'D'+(n0--),ts:ts,src:src,st:st,name:pick(G.names),phone:'+998 9'+Math.floor(rnd()*10)+' '+(100+Math.floor(rnd()*899))+'-'+pad(Math.floor(rnd()*99))+'-'+pad(Math.floor(rnd()*99)),kind:pick(KIND,[18,26,22,20,14]),tariff:G.tariffs[tf].id,mgr:pick(MGR),acc:pick(ACC),reply:.3+Math.pow(rnd(),1.6)*9,demo:1})}}
DEMO.sort(function(a,b){return b.ts-a.ts});
var CLIENTS=[];
for(var i=0;i<38;i++){var tf2=pick([0,1,2,3],[30,38,22,10]),T2=G.tariffs[tf2],due=Math.round(-3+rnd()*24),docs=Math.round([22,40,72,104][tf2]*(.5+rnd()*.5)),got=Math.round(docs*(.55+rnd()*.45));
  CLIENTS.push({id:'C'+(201+i),co:t('co')+' '+(11+i*3)+' ('+t('demo')+')',kind:pick(KIND,[18,26,22,20,14]),tariff:T2.id,fee:Math.round((T2.lo+(T2.hi-T2.lo)*rnd())*2)/2,acc:ACC[i%ACC.length],docs:docs,got:got,rep:pick(['rep_vat','rep_pay','rep_fin'],[40,35,25]),due:NOW+due*DAY,since:NOW-Math.round(30+rnd()*500)*DAY,demo:1})}
function stOf(c){if(c.due<NOW&&c.got<c.docs)return 'late';if(c.got<c.docs)return 'wait';return 'ok'}

/* Pamyat brauzera, obshchaya s saitom */
var LK='ft-leads-1',PK='ft-panel-1',PS={};
function lsGet(k,def){try{var v=JSON.parse(localStorage.getItem(k)||'null');return v==null?def:v}catch(e){return def}}
function load(){PS=lsGet(PK,{})||{};PS.st=PS.st||{};PS.notes=PS.notes||{};PS.acc=PS.acc||{};PS.price=PS.price||{};PS.log=PS.log||[];PS.got=PS.got||{}}
function save(){try{localStorage.setItem(PK,JSON.stringify(PS))}catch(e){}}
load();
function live(){var a=lsGet(LK,[]);return (Array.isArray(a)?a:[]).map(function(x){return {id:x.id,ts:x.ts,src:x.pick?'pick':'site',st:PS.st[x.id]||'new',name:x.name||'',phone:x.phone||'',kind:x.kind||'',msg:x.msg||'',pick:x.pick||null,tariff:x.tariff||'',page:x.page||'home',acc:PS.acc[x.id]||'',mgr:'',live:1}})}
function all(){return live().concat(DEMO.map(function(o){o.st=PS.st[o.id]||o.st;if(PS.acc[o.id])o.acc=PS.acc[o.id];return o}))}
function clients(){var L=live().filter(function(o){return o.st==='client'}).map(function(o){var T2=G.tariffs.filter(function(x){return x.id===o.tariff})[0]||G.tariffs[0];return {id:o.id,co:o.name,kind:o.kind,tariff:T2.id,fee:T2.lo,acc:o.acc||ACC[0],docs:0,got:0,rep:'rep_fin',due:NOW+10*DAY,since:o.ts,live:1}});
  return L.concat(CLIENTS.map(function(c){if(PS.got[c.id]!=null)c.got=PS.got[c.id];return c}))}
var R={role:PS.role||'owner',tab:'dash',src:'',st:'',q:'',acc:''};
function money(){return R.role!=='manager'}
function opens(v){if(R.role==='manager'&&(v==='team'))return false;return true}
function tName(id){var x=G.tariffs.filter(function(y){return y.id===id})[0];return x?x.n:''}
function tPrice(id){return PS.price[G.lang+':'+id]||(G.tariffs.filter(function(y){return y.id===id})[0]||{}).p||''}
function logAdd(k,ref){PS.log.unshift({ts:Date.now(),who:t('role_'+R.role),k:k,ref:ref||''});PS.log=PS.log.slice(0,200);save()}
var toastT=0;function toast(s){var el=$('#toast');el.textContent=s;el.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){el.classList.remove('on')},2400)}

/* Svodka */
var V={};
V.dash=function(){var L=all(),a=L.filter(function(o){return o.ts>NOW-30*DAY}),b=L.filter(function(o){return o.ts<=NOW-30*DAY&&o.ts>NOW-60*DAY}),C=clients();
  function dl(x,y){if(!y)return '';var p=Math.round((x-y)/y*100);return '<span class="d '+(p>=0?'up':'down')+'">'+(p>=0?'+':'')+p+'% '+h(t('vsPrev'))+'</span>'}
  var nw=L.filter(function(o){return o.st==='new'}).length,cl=a.filter(function(o){return o.st==='client'}).length,clb=b.filter(function(o){return o.st==='client'}).length,
    rep=a.filter(function(o){return o.reply}),avg=rep.length?rep.reduce(function(s,o){return s+o.reply},0)/rep.length:0,mrr=C.reduce(function(s,c){return s+c.fee},0);
  var days=[],mx=1;for(var i=29;i>=0;i--){var s=NOW-i*DAY,n=a.filter(function(o){return o.ts>s-DAY&&o.ts<=s}).length,lv=a.filter(function(o){return o.live&&o.ts>s-DAY&&o.ts<=s}).length;days.push([n,lv]);if(n>mx)mx=n}
  var fn=ST.map(function(s,i){return a.filter(function(o){return ST.indexOf(o.st)>=i}).length}),cols=['#1f2537','#3a4a7a','#c9bf1e','#2f8f5b'];
  var smax=Math.max.apply(null,SRC.map(function(k){return a.filter(function(o){return o.src===k}).length}).concat(1));
  var mix=G.tariffs.map(function(x){return C.filter(function(c){return c.tariff===x.id}).length}),mcol=['#efe63c','#3a4a7a','#1f2537','#2f8f5b'];
  var soon=C.filter(function(c){return stOf(c)!=='ok'&&c.due<NOW+7*DAY}).sort(function(x,y){return x.due-y.due}).slice(0,6);
  return '<div class="head"><h1>'+h(t('n_dash'))+'</h1><span class="muted">'+h(t('days30'))+'</span></div>'+
  '<div class="grid g4"><div class="card kpi"><span class="muted">'+h(t('k_total'))+'</span><b>'+a.length+'</b>'+dl(a.length,b.length)+'</div><div class="card kpi"><span class="muted">'+h(t('k_new'))+'</span><b class="'+(nw?'down':'')+'">'+nw+'</b></div><div class="card kpi"><span class="muted">'+h(t('k_client'))+'</span><b>'+cl+'</b>'+dl(cl,clb)+'</div>'+
  (money()?'<div class="card kpi"><span class="muted">'+h(t('k_mrr'))+'</span><b>'+h(mln(mrr))+'</b><span class="sm muted">'+C.length+' '+h(t('clientsN'))+'</span></div>':'<div class="card kpi"><span class="muted">'+h(t('k_reply'))+'</span><b>'+avg.toFixed(1).replace('.',',')+' '+h(t('h'))+'</b></div>')+'</div>'+
  '<div class="grid g2"><div class="card"><h2>'+h(t('byDay'))+'</h2><div class="bars" aria-hidden="true">'+days.map(function(x,i){return '<i class="'+(x[1]?'s':'')+'" style="height:'+Math.max(3,x[0]/mx*100)+'%;--d:'+i*18+'ms"></i>'}).join('')+'</div><p class="sm muted">'+h(t('demo'))+' · <span style="color:var(--gold)">&#9632;</span> '+h(t('fromSite'))+'</p></div>'+
  '<div class="card"><h2>'+h(t('funnel'))+'</h2><div class="fun">'+fn.map(function(n,i){return '<div style="background:'+cols[i]+';width:'+Math.max(36,n/(fn[0]||1)*100)+'%;color:'+(i===2?'#151a29':'#fff')+'"><span>'+h(t('s_'+ST[i]))+'</span><span>'+n+'</span></div>'}).join('')+'</div></div></div>'+
  '<div class="grid g2"><div class="card"><h2>'+h(t('bySrc'))+'</h2><div class="hbar">'+SRC.map(function(k,i){var n=a.filter(function(o){return o.src===k}).length;return '<div><span class="src src-'+k+'"><i></i>'+h(t('src_'+k))+'</span><span class="b"><i style="width:'+n/smax*100+'%;animation-delay:'+i*80+'ms"></i></span><b>'+n+'</b></div>'}).join('')+'</div><p class="sm muted">'+h(t('pickNote'))+'</p></div>'+
  '<div class="card"><h2>'+h(t('mix'))+'</h2><div class="mix">'+mix.map(function(n,i){return '<i style="width:'+(n/(C.length||1)*100)+'%;background:'+mcol[i]+';animation-delay:'+i*90+'ms"></i>'}).join('')+'</div><div class="lg">'+G.tariffs.map(function(x,i){return '<span><i style="background:'+mcol[i]+'"></i>'+h(x.n)+': '+mix[i]+'</span>'}).join('')+'</div>'+
  '<h2 style="margin-top:8px">'+h(t('soon'))+'</h2><div class="dl">'+(soon.length?soon.map(function(c){return '<div><span><b>'+h(c.co)+'</b> · '+h(t(c.rep))+'</span><span class="st st-'+stOf(c)+'">'+h(dstr(c.due))+'</span></div>'}).join(''):'<p class="muted">'+h(t('noRows'))+'</p>')+'</div></div></div>'+
  '<div class="card"><div class="row" style="justify-content:space-between"><h2>'+h(t('latest'))+'</h2><a class="btn ln" href="#leads">'+h(t('n_leads'))+'</a></div>'+leadTable(all().slice(0,6))+'</div>'};

/* Zayavki */
function leadTable(L){if(!L.length)return '<p class="muted">'+h(t('noRows'))+'</p>';
  return '<div class="tw"><table><thead><tr><th>'+h(t('col_no'))+'</th><th>'+h(t('col_who'))+'</th><th>'+h(t('col_src'))+'</th><th>'+h(t('col_tariff'))+'</th><th>'+h(t('col_st'))+'</th><th>'+h(t('col_acc'))+'</th><th>'+h(t('col_when'))+'</th></tr></thead><tbody>'+
  L.map(function(o){return '<tr data-id="'+h(o.id)+'" class="'+(o.live?'live':'')+(o.live&&Date.now()-o.ts<6e4?' fresh':'')+'" tabindex="0"><td><b>'+h(o.id)+'</b> '+(o.live?'<span class="tag site">'+h(t('fromSite'))+'</span>':'<span class="tag">'+h(t('demo'))+'</span>')+'</td><td>'+h(o.name)+'<br><span class="sm muted">'+h(G.kinds[o.kind]||'')+'</span></td><td><span class="src src-'+o.src+'"><i></i>'+h(t('src_'+o.src))+'</span></td><td>'+h(tName(o.tariff)||'')+'</td><td><span class="st st-'+o.st+'">'+h(t('s_'+o.st))+'</span></td><td>'+h(o.acc||'')+'</td><td>'+h(when(o.ts))+'</td></tr>'}).join('')+'</tbody></table></div>'}
V.leads=function(){var L=all().filter(function(o){return (!R.src||o.src===R.src)&&(!R.st||o.st===R.st)&&(!R.q||(o.id+' '+o.name+' '+o.phone).toLowerCase().indexOf(R.q.toLowerCase())>=0)});
  return '<div class="head"><h1>'+h(t('n_leads'))+'</h1><input class="inp" style="max-width:320px" id="lq" type="search" placeholder="'+h(t('search'))+'" value="'+h(R.q)+'" aria-label="'+h(t('search'))+'"></div>'+
  '<div class="chips" data-f="src"><button class="'+(R.src?'':'on')+'" data-v="">'+h(t('all'))+'</button>'+SRC.map(function(k){return '<button class="'+(R.src===k?'on':'')+'" data-v="'+k+'">'+h(t('src_'+k))+'</button>'}).join('')+'</div>'+
  '<div class="chips" data-f="st"><button class="'+(R.st?'':'on')+'" data-v="">'+h(t('all'))+'</button>'+ST.map(function(s){return '<button class="'+(R.st===s?'on':'')+'" data-v="'+s+'">'+h(t('s_'+s))+'</button>'}).join('')+'</div>'+leadTable(L)};
function leadById(id){return all().filter(function(o){return o.id===id})[0]}
function openLead(id){var o=leadById(id);if(!o)return;var m=$('#mdl');
  var hist=PS.log.filter(function(x){return x.ref===id}),p=o.pick;
  m.innerHTML='<div class="sheet" role="dialog" aria-modal="true" aria-label="'+h(o.id)+'"><div class="sheet-h"><div><span class="src src-'+o.src+'"><i></i>'+h(t('src_'+o.src))+'</span><h1>'+h(o.id)+'</h1><p class="muted">'+h(when(o.ts))+(o.live?' · <span class="tag site">'+h(t('fromSite'))+'</span>':'')+'</p></div><button class="ib" data-x aria-label="'+h(t('close'))+'">'+ic('x')+'</button></div>'+
  '<div class="card"><b>'+h(o.name)+'</b><span class="muted">'+h(G.kinds[o.kind]||'')+'</span>'+(o.phone?'<p>'+h(t('phone'))+': '+h(o.phone)+'</p>':'')+(o.msg?'<p><b>'+h(t('msg'))+':</b> '+h(o.msg)+'</p>':'')+
  '<div class="row">'+(o.phone?'<a class="btn ln" data-act="call" href="tel:'+h(o.phone.replace(/[^\d+]/g,''))+'">'+ic('phone')+h(t('call'))+'</a>':'')+'</div></div>'+
  (p?'<div class="card pf"><h2>'+h(t('pickH'))+'</h2><div class="row"><span>'+h(t('col_tariff'))+'</span><b>'+h(p.n)+'</b></div><div class="row"><span>'+h(t('price'))+'</span><b>'+h(p.p)+'</b></div><div class="row"><span>'+h(t('docs'))+'</span><b>'+h(p.docs)+'</b></div><div class="row"><span>'+h(t('staffN'))+'</span><b>'+h(p.staff)+'</b></div><div class="row"><span>'+h(t('tax'))+'</span><b>'+h(t('tax_'+p.tax))+'</b></div><div class="row"><span>'+h(t('ved'))+'</span><b>'+h(p.ved?t('yes'):t('no'))+'</b></div><p class="sm muted">'+h(t('pickWhy'))+'</p></div>':(o.tariff?'<div class="card"><h2>'+h(t('col_tariff'))+'</h2><p>'+h(tName(o.tariff))+(money()?' · '+h(tPrice(o.tariff)):'')+'</p></div>':''))+
  '<div class="card"><h2>'+h(t('setSt'))+'</h2><div class="stbtns">'+ST.map(function(s){return '<button data-st="'+s+'" class="'+(o.st===s?'on':'')+'" aria-pressed="'+(o.st===s)+'">'+h(t('s_'+s))+'</button>'}).join('')+'</div><p class="sm muted">'+h(t('stNote'))+'</p></div>'+
  '<div class="card"><label class="lab">'+h(t('col_acc'))+'<select class="inp" id="acc"><option value="">'+h(t('none'))+'</option>'+G.staff.map(function(s){return '<option'+(o.acc===s.n?' selected':'')+'>'+h(s.n)+'</option>'}).join('')+'</select></label></div>'+
  '<div class="card"><label class="lab">'+h(t('note'))+'<textarea class="inp" id="nt" placeholder="'+h(t('notePh'))+'">'+h(PS.notes[id]||'')+'</textarea></label><button class="btn" data-note>'+h(t('save'))+'</button></div>'+
  '<div class="card"><h2>'+h(t('hist'))+'</h2><ul class="tl"><li><b>'+h(dstr(o.ts)+' '+tstr(o.ts))+'</b><span>'+h(t('newLead'))+'</span></li>'+hist.slice().reverse().map(function(x){return '<li><b>'+h(dstr(x.ts)+' '+tstr(x.ts))+'</b><span>'+h(x.who)+' '+h(t(x.k))+'</span></li>'}).join('')+'</ul></div></div>';
  m.hidden=false;$('[data-x]',m).focus();
  m.onclick=function(e){if(e.target===m||e.target.closest('[data-x]')){m.hidden=true;m.innerHTML='';return}
    var b=e.target.closest('[data-st]');if(b){PS.st[id]=b.getAttribute('data-st');logAdd(PS.st[id]==='client'?'a_client':'a_status',id);save();toast(t('saved'));render();openLead(id);return}
    if(e.target.closest('[data-note]')){PS.notes[id]=$('#nt').value;logAdd('a_note',id);save();toast(t('saved'));return}
    if(e.target.closest('[data-act="call"]')){logAdd('a_call',id)}};
  $('#acc',m).onchange=function(){PS.acc[id]=this.value;logAdd('a_acc',id);save();toast(t('saved'));render()}}

/* Klienty na obsluzhivanii */
V.clients=function(){var C=clients().filter(function(c){return !R.acc||c.acc===R.acc});
  return '<div class="head"><h1>'+h(t('n_clients'))+'</h1><span class="muted">'+h(t('clientsHelp'))+'</span></div>'+
  '<div class="chips" data-f="acc"><button class="'+(R.acc?'':'on')+'" data-v="">'+h(t('all'))+'</button>'+ACC.map(function(a){return '<button class="'+(R.acc===a?'on':'')+'" data-v="'+h(a)+'">'+h(a)+'</button>'}).join('')+'</div>'+
  '<div class="tw"><table><thead><tr><th>'+h(t('col_co'))+'</th><th>'+h(t('col_tariff'))+'</th>'+(money()?'<th>'+h(t('col_fee'))+'</th>':'')+'<th>'+h(t('col_acc'))+'</th><th>'+h(t('col_docs'))+'</th><th>'+h(t('col_rep'))+'</th><th>'+h(t('col_st'))+'</th></tr></thead><tbody>'+
  C.map(function(c){var s=stOf(c);return '<tr data-c="'+h(c.id)+'" class="'+(c.live?'live':'')+'" tabindex="0"><td><b>'+h(c.co)+'</b><br><span class="sm muted">'+h(G.kinds[c.kind]||'')+'</span></td><td>'+h(tName(c.tariff))+'</td>'+(money()?'<td>'+h(mln(c.fee))+'</td>':'')+'<td>'+h(c.acc)+'</td><td>'+c.got+' / '+c.docs+'</td><td>'+h(t(c.rep))+' · '+h(dstr(c.due))+'</td><td><span class="st st-'+s+'">'+h(t('cs_'+s))+'</span></td></tr>'}).join('')+'</tbody></table></div>'+
  (money()?'':'<p class="sm muted">'+h(t('noMoney'))+'</p>')};
function openClient(id){var c=clients().filter(function(x){return x.id===id})[0];if(!c)return;var m=$('#mdl'),s=stOf(c);
  m.innerHTML='<div class="sheet" role="dialog" aria-modal="true" aria-label="'+h(c.co)+'"><div class="sheet-h"><div><span class="st st-'+s+'">'+h(t('cs_'+s))+'</span><h1>'+h(c.co)+'</h1><p class="muted">'+h(G.kinds[c.kind]||'')+' · '+h(t('since'))+' '+h(dstr(c.since))+'</p></div><button class="ib" data-x aria-label="'+h(t('close'))+'">'+ic('x')+'</button></div>'+
  '<div class="card pf"><div class="row"><span>'+h(t('col_tariff'))+'</span><b>'+h(tName(c.tariff))+'</b></div>'+(money()?'<div class="row"><span>'+h(t('col_fee'))+'</span><b>'+h(mln(c.fee))+'</b></div>':'')+'<div class="row"><span>'+h(t('col_acc'))+'</span><b>'+h(c.acc)+'</b></div><div class="row"><span>'+h(t('col_rep'))+'</span><b>'+h(t(c.rep))+' · '+h(dstr(c.due))+'</b></div></div>'+
  '<div class="card"><h2>'+h(t('col_docs'))+'</h2><div class="mix"><i style="width:'+(c.docs?c.got/c.docs*100:100)+'%;background:var(--ok)"></i></div><p>'+c.got+' / '+c.docs+'</p>'+(c.docs&&c.got<c.docs?'<button class="btn" data-got>'+ic('check')+h(t('gotAll'))+'</button>':'')+'</div>'+
  '<div class="card"><label class="lab">'+h(t('note'))+'<textarea class="inp" id="nt">'+h(PS.notes[id]||'')+'</textarea></label><button class="btn" data-note>'+h(t('save'))+'</button></div></div>';
  m.hidden=false;$('[data-x]',m).focus();
  m.onclick=function(e){if(e.target===m||e.target.closest('[data-x]')){m.hidden=true;m.innerHTML='';return}
    if(e.target.closest('[data-got]')){PS.got[id]=c.docs;logAdd('a_docs',c.co);save();toast(t('saved'));render();openClient(id);return}
    if(e.target.closest('[data-note]')){PS.notes[id]=$('#nt').value;logAdd('a_note',c.co);save();toast(t('saved'))}}}

/* Tarify: stroka ceny idet na sait */
V.tariffs=function(){var ro=!money();
  return '<div class="head"><h1>'+h(t('n_tariffs'))+'</h1><a class="btn ln" href="'+h(G.prices)+'">'+ic('eye')+h(t('see'))+'</a></div><p class="muted">'+h(ro?t('tariffsRo'):t('tariffsHelp'))+'</p>'+
  G.tariffs.map(function(x){var n=clients().filter(function(c){return c.tariff===x.id}).length;return '<form class="card" data-tf="'+x.id+'"><div class="row" style="justify-content:space-between"><h2>'+h(x.n)+'</h2><span class="tag">'+n+' '+h(t('clientsN'))+'</span></div><label class="lab">'+h(t('priceLine'))+'<input class="inp" name="p" value="'+h(tPrice(x.id))+'"'+(ro?' disabled':'')+'></label>'+(ro?'':'<div class="row"><button class="btn" type="submit">'+h(t('save'))+'</button><button class="btn ln" type="button" data-reset>'+h(t('reset'))+'</button></div>')+'</form>'}).join('')};

/* Istoriya i komanda */
V.log=function(){var L=PS.log.concat(DEMO.slice(0,24).map(function(o){return {ts:o.ts+(o.reply||1)*36e5,who:o.mgr,k:o.st==='new'?'a_take':o.st==='client'?'a_client':'a_status',ref:o.id,demo:1}})).filter(function(x){return x.ts<=Date.now()}).sort(function(a,b){return b.ts-a.ts});
  return '<div class="head"><h1>'+h(t('n_log'))+'</h1></div><div class="card">'+(L.length?'<ul class="tl">'+L.slice(0,60).map(function(x){return '<li><b>'+h(dstr(x.ts)+' '+tstr(x.ts))+'</b><span>'+h(x.who)+' '+h(t(x.k))+(x.ref?' · '+h(x.ref):'')+(x.demo?' <span class="tag">'+h(t('demo'))+'</span>':'')+'</span></li>'}).join('')+'</ul>':'<p class="muted">'+h(t('logEmpty'))+'</p>')+'</div>'};
V.team=function(){var C=clients();return '<div class="head"><h1>'+h(t('n_team'))+'</h1></div><div class="tw"><table><thead><tr><th>'+h(t('viewAs'))+'</th><th>'+h(t('r_what'))+'</th></tr></thead><tbody>'+['owner','head','manager'].map(function(r){return '<tr><td><b>'+h(t('role_'+r))+'</b></td><td style="white-space:normal">'+h(t('r_'+r))+'</td></tr>'}).join('')+'</tbody></table></div>'+
  '<div class="card"><h2>'+h(t('people'))+'</h2><p class="sm muted">'+h(t('peopleNote'))+'</p>'+G.staff.map(function(s){var n=C.filter(function(c){return c.acc===s.n}).length;return '<div class="row" style="justify-content:space-between"><span><b>'+h(s.n)+'</b> <span class="muted">'+h(s.r)+'</span></span>'+(n?'<span class="tag">'+n+' '+h(t('clientsN'))+' · '+h(t('demo'))+'</span>':'')+'</div>'}).join('')+'</div>'};

/* Karkas */
function count(){var n=all().filter(function(o){return o.st==='new'}).length,el=$('[data-cnt]');if(el){el.hidden=!n;el.textContent=n}}
function render(){var v=R.tab;if(!V[v])v='dash';$$('.nav a').forEach(function(a){var k=a.getAttribute('href').slice(1);a.classList.toggle('on',k===v);a.classList.toggle('off',!opens(k))});
  $('#tb-t').textContent=t('n_'+v);var pv=$('#pv');pv.innerHTML=opens(v)?V[v]():'<div class="card"><p>'+h(t('noAccess'))+'</p></div>';count()}
function go(){R.tab=(location.hash||'#dash').slice(1).split('?')[0];d.body.classList.remove('nav-on');render();$('#pv').focus({preventScroll:true});W.scrollTo(0,0)}
addEventListener('hashchange',go);
$('#menu-b').addEventListener('click',function(){d.body.classList.add('nav-on')});
$('[data-navclose]').addEventListener('click',function(){d.body.classList.remove('nav-on')});
var role=$('#role');role.value=R.role;role.addEventListener('change',function(){R.role=role.value;PS.role=R.role;save();render()});
d.addEventListener('click',function(e){var tr=e.target.closest('tr[data-id]');if(tr){openLead(tr.getAttribute('data-id'));return}
  var tc=e.target.closest('tr[data-c]');if(tc){openClient(tc.getAttribute('data-c'));return}
  var c=e.target.closest('.chips button');if(c){R[c.parentNode.getAttribute('data-f')]=c.getAttribute('data-v');render();return}
  var rs=e.target.closest('[data-reset]');if(rs){var f=rs.closest('form');delete PS.price[G.lang+':'+f.getAttribute('data-tf')];logAdd('a_price',f.getAttribute('data-tf'));save();render();toast(t('saved'))}});
d.addEventListener('keydown',function(e){var tr=e.target.closest&&e.target.closest('tr[data-id]');if(tr&&e.key==='Enter')openLead(tr.getAttribute('data-id'));var tc=e.target.closest&&e.target.closest('tr[data-c]');if(tc&&e.key==='Enter')openClient(tc.getAttribute('data-c'));if(e.key==='Escape'&&!$('#mdl').hidden){$('#mdl').hidden=true}});
d.addEventListener('input',function(e){if(e.target.id==='lq'){R.q=e.target.value;var pos=e.target.selectionStart;render();var q=$('#lq');q.focus();try{q.setSelectionRange(pos,pos)}catch(x){}}});
d.addEventListener('submit',function(e){var f=e.target;e.preventDefault();
  if(f.hasAttribute('data-tf')){var v=f.elements.p.value.trim();if(!v){f.classList.add('bad');toast(t('need'));return}PS.price[G.lang+':'+f.getAttribute('data-tf')]=v;logAdd('a_price',f.getAttribute('data-tf'));save();render();toast(t('saved'))}});
addEventListener('storage',function(e){if(e.key===LK||e.key===PK){load();render()}});
go();
})();
