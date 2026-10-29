/* Panel warsztatu AutoPepe wg wzorca Greenwell: pulpit (przychód do
   poprzednich 30 dni, wykres ze zgłoszeniami ze strony, droga klienta,
   najczęstsze naprawy, co się kończy), zlecenia (ze strony na górze, etap
   widzi klient), kalendarz oględzin, materiały, historia, role. Liczby demo
   z jednego ziarna, więc zgadzają się między ekranami. Stan: ap-panel-1
   (pisze panel), ap-req-1 (pisze strona). Podpisy tylko ze słownika. */
(function(){
var d=document,$=function(s,r){return(r||d).querySelector(s)},$$=function(s,r){return[].slice.call((r||d).querySelectorAll(s))};
var D=JSON.parse($('#pn-data').textContent),U=D.ui;
function t(k){return U[k]}
function get(k,def){try{var v=localStorage.getItem(k);return v?JSON.parse(v):def}catch(e){return def}}
function put(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function zl(n){return fmt(n)+' '+t('zl')}
function tys(n){return(n/1000).toFixed(1).replace('.',',')+' '+t('tys')}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var S=get('ap-panel-1',{}),view=location.hash.slice(1)||'sum',open=null;
S.rep=S.rep||{};S.note=S.note||{};S.log=S.log||[];S.role=S.role||'owner';
function save(){put('ap-panel-1',S)}
function log(what,ref){S.log.unshift({at:Date.now(),who:S.role,w:what,r:ref||''});S.log=S.log.slice(0,80);save()}
var owner=function(){return S.role==='owner'};

/* Ziarno demo: wszystkie liczby panelu z niego. */
var zr=20261029;function rnd(){zr=(zr*16807)%2147483647;return zr/2147483647}
var CARS=['Toyota Corolla','Skoda Octavia','VW Golf','Opel Astra','Ford Focus','Kia Ceed','Hyundai i30','Renault Clio','BMW 320d','Audi A4','Toyota RAV4','VW Passat','Fiat Ducato','Mercedes Vito','Dacia Duster','Mazda 6'];
var JOBS=[['Usuwanie wgnieceń',350,.25],['Kasowanie rys',260,.2],['Lakierowanie elementu',900,.45],['Renowacja lakieru',800,.3],['Renowacja felg',1100,.4],['Naprawa powypadkowa',4200,.55]];
var now=Date.now(),demo=[];
for(var i=0;i<46;i++){var j=JOBS[Math.floor(rnd()*rnd()*JOBS.length*1.6)%JOBS.length],oc=j[0]==='Naprawa powypadkowa'||rnd()<.18,amt=Math.round(j[1]*(.7+rnd()*.9)/10)*10;
  demo.push({id:2046-i,at:now-Math.floor(i*15.2+rnd()*10)*36e5,car:CARS[Math.floor(rnd()*CARS.length)],job:j[0],sum:amt,cost:Math.round(amt*j[2]),oc:oc,ph:'+48 5'+Math.floor(rnd()*10)+'* *** *'+(10+Math.floor(rnd()*89)),demo:1,st0:i<6?Math.floor(rnd()*4):4})}
demo.forEach(function(o){if(o.id===2041)o.st0=2});
function reqs(){return get('ap-req-1',[])}
function siteReps(){return reqs().filter(function(r){return S.rep[r.id]}).map(function(r){var x=S.rep[r.id];return{id:r.id,at:r.at,car:x.car,job:t('r_'+r.k),sum:r.hi?Math.round((r.lo+r.hi)/2):0,cost:0,oc:r.k==='oc'||!!r.oc,ph:r.ph,site:1}})}
function orders(){return siteReps().concat(demo)}
function st(o){return S.rep[o.id]?S.rep[o.id].st:o.st0}
var prev=demo.reduce(function(a,o){return a+o.sum},0)*.88;

function shell(){var tabs=['sum','orders','cal','mat','log'];
  $('#app').innerHTML='<header class="pn-top"><div class="pn-brand"><b><i>Auto</i>Pepe</b><span>'+t('title')+' · '+t('demo')+'</span></div>'+
  '<label class="pn-role"><span>'+t('role')+'</span><select id="role"><option value="owner">'+t('role_owner')+'</option><option value="desk">'+t('role_desk')+'</option></select></label><a class="btn btn-g btn-s" href="'+D.home+'">'+t('home')+'</a><a class="btn btn-a btn-s" href="'+D.site+'">'+t('site')+'</a></header>'+
  '<nav class="pn-tabs">'+tabs.map(function(x){return'<a href="#'+x+'" data-v="'+x+'"'+(x===view?' aria-current="page"':'')+'>'+t('tab_'+x)+(x==='orders'&&newReqs().length?' · '+newReqs().length:'')+'</a>'}).join('')+'</nav><main class="pn-main" id="pv"></main>';
  $('#role').value=S.role;$('#role').addEventListener('change',function(e){S.role=e.target.value;log('l_role');render()});
  $$('.pn-tabs a').forEach(function(a){a.addEventListener('click',function(){view=a.getAttribute('data-v');open=null;$$('.pn-tabs a').forEach(function(x){x.toggleAttribute('aria-current',x===a)})})})}
addEventListener('hashchange',function(){view=location.hash.slice(1)||'sum';open=null;shell();render()});
addEventListener('storage',function(e){if(e.key==='ap-req-1'){shell();render()}});
function newReqs(){return reqs().filter(function(r){return!S.rep[r.id]})}

function kpi(k,v,dl,hide){return'<div class="pn-k">'+(hide?'<small>'+t(k)+'</small><b class="pn-lock">'+t('hidden')+'</b>':'<small>'+t(k)+'</small><b>'+v+'</b>'+(dl!==undefined?'<em class="'+(dl>=0?'up':'dn')+'">'+(dl>=0?'+':'')+dl+'% '+t('vs')+'</em>':''))+'</div>'}
var MAT=[['Bezbarwny lakier 2K, 5 l',4,3,420],['Podkład akrylowy szary, 1 l',6,4,96],['Baza czerwona RAL 3020, 1 l',2,2,180],['Baza srebrna metalik, 1 l',1,2,210],['Utwardzacz, 2,5 l',5,2,140],['Pasta polerska gruba',3,2,120],['Pasta polerska wykańczająca',1,2,130],['Papier ścierny P1500, 50 szt.',8,3,65],['Kit szpachlowy, 2 kg',2,2,85],['Taśma maskująca 38 mm',12,6,14]];
function vSum(){var os=orders(),rev=os.reduce(function(a,o){return a+o.sum},0),pr=os.reduce(function(a,o){return a+o.sum-o.cost},0);
  var ocn=os.filter(function(o){return o.oc}).length,inw=os.filter(function(o){return st(o)<4}).length;
  var days=[];for(var i=29;i>=0;i--)days.push({v:0,site:false});os.forEach(function(o){var k=29-Math.floor((now-o.at)/864e5);if(k>=0&&k<30){days[k].v+=o.sum;if(o.site)days[k].site=true}});
  reqs().forEach(function(r){days[29].site=true});
  var mx=Math.max.apply(null,days.map(function(x){return x.v}))||1;
  var by={};os.forEach(function(o){by[o.job]=(by[o.job]||0)+1});var top=Object.keys(by).sort(function(a,b){return by[b]-by[a]}).slice(0,5);
  var low=MAT.filter(function(m){return m[1]<=m[2]});
  var vis=Math.round(os.length*41),f=[[t('f_visit'),vis],[t('f_calc'),Math.round(vis*.22)],[t('f_req'),Math.round(vis*.05)+reqs().length],[t('f_car'),os.length]];
  return'<div class="pn-kpis">'+kpi('k_rev',tys(rev),Math.round((rev/prev-1)*100))+kpi('k_cars',inw)+kpi('k_avg',zl(rev/os.length))+kpi('k_margin',tys(pr),undefined,!owner())+kpi('k_oc',Math.round(ocn/os.length*100)+'%')+'</div>'+
  '<div class="pn-row"><section class="pn-card"><h3>'+t('chart')+'</h3><div class="pn-chart">'+days.map(function(x){return'<i class="'+(x.site?'site':'')+'" style="height:'+Math.max(3,x.v/mx*100)+'%" title="'+zl(x.v)+'"></i>'}).join('')+'</div><p class="pn-mu"><span class="dot"></span>'+t('chart_site')+'</p></section>'+
  '<section class="pn-card"><h3>'+t('funnel')+'</h3>'+f.map(function(x){return'<div class="pn-f"><span>'+x[0]+'</span><b>'+fmt(x[1])+'</b><i style="transform:scaleX('+(x[1]/f[0][1])+')"></i></div>'}).join('')+'</section></div>'+
  '<div class="pn-row eq"><section class="pn-card"><h3>'+t('top')+'</h3>'+top.map(function(k){return'<div class="pn-li"><span>'+esc(k)+'</span><b>'+by[k]+'</b></div>'}).join('')+'</section>'+
  '<section class="pn-card"><h3>'+t('low')+'</h3>'+low.map(function(m){return'<div class="pn-li"><span>'+esc(m[0])+'</span><b class="warn">'+t('left')+' '+m[1]+' '+t('pcs')+' · '+t('order')+'</b></div>'}).join('')+'</section></div>'}
function when(ts){var dd=Math.floor((now-ts)/864e5);return dd<1?t('today')+' '+new Date(ts).toTimeString().slice(0,5):dd+' '+t('ago_d')}
function chip(o){var s=st(o);return'<span class="pn-st s'+s+'">'+t('st_'+s)+'</span>'}
function reqLine(r){var what=r.k==='foto'?Object.keys(r.parts||{}).length+' · '+zl(r.lo)+'…'+zl(r.hi):r.k==='oc'?esc(r.ins)+' · '+esc(r.szk):r.day+' '+r.h+':00';
  return'<tr data-r="'+r.id+'" class="new"><td>AP-'+r.id+' <span class="pn-new">'+t('r_new')+'</span></td><td>'+when(r.at)+'</td><td>'+esc(r.ph)+'</td><td>'+t('r_'+r.k)+'</td><td>'+what+'</td><td></td><td></td></tr>'}
function vOrders(){if(open&&open.r)return vReq(open.r);if(open)return vOrder(open);var os=orders(),nr=newReqs();
  return(reqs().length?'':'<p class="pn-hint">'+t('r_none')+'</p>')+'<div class="pn-card"><table class="pn-t"><thead><tr><th>'+t('o_no')+'</th><th>'+t('o_when')+'</th><th>'+t('o_car')+'</th><th>'+t('o_job')+'</th><th>'+t('o_sum')+'</th><th>'+t('o_pay')+'</th><th>'+t('o_st')+'</th></tr></thead><tbody>'+
  nr.map(reqLine).join('')+
  os.slice(0,40).map(function(o){return'<tr data-o="'+o.id+'"'+(o.site?' class="new"':'')+'><td>AP-'+o.id+(o.site?' <span class="pn-new">'+t('r_new')+'</span>':'')+'</td><td>'+when(o.at)+'</td><td>'+esc(o.car)+'</td><td>'+esc(o.job)+'</td><td>'+(o.sum?zl(o.sum):'')+'</td><td>'+t(o.oc?'pay_oc':'pay_cash')+'</td><td>'+chip(o)+'</td></tr>'}).join('')+'</tbody></table></div>'}
function vReq(id){var r=reqs().filter(function(x){return x.id===id})[0];if(!r){open=null;return vOrders()}
  var body='';if(r.k==='foto'){body='<p><span class="pn-mu">'+t('r_parts')+':</span> '+Object.keys(r.parts||{}).map(function(p){return esc(D.parts[p])+' ('+esc((D.dmg[r.parts[p]]||'').toLowerCase())+')'}).join(', ')+'</p><p><span class="pn-mu">'+t('r_range')+':</span> <b>'+zl(r.lo)+' … '+zl(r.hi)+'</b>'+(r.oc?' · '+t('pay_oc'):'')+'</p>'+(r.img&&r.img.length?'<div class="pn-ph">'+r.img.map(function(u){return'<img src="'+u+'" alt="">'}).join('')+'</div>':'')}
  else if(r.k==='oc')body='<p><span class="pn-mu">'+t('r_ins')+':</span> '+esc(r.ins)+'</p><p><span class="pn-mu">'+t('r_claim')+':</span> '+esc(r.szk)+'</p><p><span class="pn-mu">'+t('r_reg')+':</span> '+esc(r.reg||'')+'</p><p><span class="pn-mu">'+t('r_docs')+':</span> '+r.docs+'/5</p>';
  else body='<p><span class="pn-mu">'+t('r_when')+':</span> <b>'+r.day+' '+r.h+':00</b></p>';
  return'<button type="button" class="btn btn-g btn-s" id="oback">'+t('o_back')+'</button><section class="pn-card"><h3>AP-'+r.id+' · '+t('r_'+r.k)+' <span class="pn-new">'+t('r_new')+'</span></h3><p><span class="pn-mu">'+t('o_phone')+':</span> '+esc(r.ph)+'</p>'+body+
  (S.rep[r.id]?'<p class="pn-hint">'+t('r_accepted')+' AP-'+r.id+'</p>':'<button type="button" class="btn btn-a" id="accept" style="margin-top:12px">'+t('r_accept')+'</button>')+'</section>'}
function vOrder(id){var o=orders().filter(function(x){return x.id===id})[0];if(!o){open=null;return vOrders()}var s=st(o);
  return'<button type="button" class="btn btn-g btn-s" id="oback">'+t('o_back')+'</button><div class="pn-row"><section class="pn-card"><h3>AP-'+o.id+' · '+esc(o.car)+(o.site?' <span class="pn-new">'+t('r_new')+'</span>':'')+'</h3>'+
  '<p class="pn-mu">'+t('o_hint')+'</p><div class="pn-steps">'+[0,1,2,3,4].map(function(k){return'<button type="button" data-s="'+k+'" aria-pressed="'+(k===s)+'" class="'+(k<=s?'done':'')+'">'+t('st_'+k)+'</button>'}).join('')+'</div>'+
  '<p><span class="pn-mu">'+t('o_job')+':</span> '+esc(o.job)+'</p><p><span class="pn-mu">'+t('o_sum')+':</span> <b>'+(o.sum?zl(o.sum):'')+'</b> · '+t(o.oc?'pay_oc':'pay_cash')+'</p>'+(owner()&&o.cost?'<p><span class="pn-mu">'+t('o_cost')+':</span> '+zl(o.cost)+'</p>':'')+'</section>'+
  '<section class="pn-card"><p><span class="pn-mu">'+t('o_phone')+':</span> '+esc(o.ph)+'</p><label class="fld"><span>'+t('o_note')+'</span><input id="onote" value="'+esc(S.note[o.id]||'')+'"></label><button type="button" class="btn btn-g btn-s" id="osave" style="margin-top:8px">'+t('o_save')+'</button></section></div>'}
/* Kalendarz: ta sama reguła zajętości co na stronie, plus terminy ze strony. */
function vCal(){var days=[],dt=new Date();dt.setHours(0,0,0,0);while(days.length<5){dt.setDate(dt.getDate()+1);var g=dt.getDay();if(g>0&&g<6)days.push(new Date(dt))}
  var DN=['nd','pn','wt','śr','cz','pt','sb'],rs=reqs().filter(function(r){return r.k==='termin'});
  var h='<b></b>'+days.map(function(x){return'<b>'+DN[x.getDay()]+' '+x.getDate()+'.'+String(x.getMonth()+1).padStart(2,'0')+'</b>'}).join('');
  [8,9,10,11,12,13,14,15].forEach(function(hr){h+='<b>'+hr+':00</b>';days.forEach(function(x){var site=rs.filter(function(r){return r.day===x.toISOString().slice(0,10)&&r.h===hr})[0],busy=(x.getDate()*31+hr*17)%7<2;
    h+='<span class="'+(site?'site':busy?'busy':'')+'">'+(site?'AP-'+site.id+' · '+t('c_site'):busy?t('c_busy'):t('c_free'))+'</span>'})});
  return'<p class="pn-hint">'+t('c_hint')+'</p><div class="pn-card"><div class="pn-cal">'+h+'</div></div>'}
function vMat(){return'<p class="pn-hint">'+t('m_hint')+'</p><div class="pn-card"><table class="pn-t"><thead><tr><th>'+t('m_name')+'</th><th>'+t('m_stock')+'</th><th>'+t('m_min')+'</th>'+(owner()?'<th>'+t('m_cost')+'</th>':'')+'</tr></thead><tbody>'+
  MAT.map(function(m){var lo=m[1]<=m[2];return'<tr><td>'+esc(m[0])+'</td><td>'+m[1]+' '+t('pcs')+'<div class="pn-bar'+(lo?' lo':'')+'"><i style="transform:scaleX('+Math.min(1,m[1]/(m[2]*3))+')"></i></div></td><td>'+m[2]+'</td>'+(owner()?'<td>'+zl(m[3])+'</td>':'')+'</tr>'}).join('')+'</tbody></table></div>'}
function vLog(){var who=function(r){return t(r==='desk'?'role_desk':'role_owner')};return'<div class="pn-card">'+(S.log.length?S.log.map(function(x){return'<div class="pn-log"><time>'+new Date(x.at).toLocaleString('pl-PL')+'</time><b>'+who(x.who)+'</b><span>'+t(x.w)+(x.r?' '+esc(x.r):'')+'</span></div>'}).join(''):'<p class="pn-mu">'+t('l_none')+'</p>')+'</div>'}
function render(){var v=$('#pv');if(!v)return;now=Date.now();
  v.innerHTML=view==='orders'?vOrders():view==='cal'?vCal():view==='mat'?vMat():view==='log'?vLog():vSum();
  $$('[data-o]',v).forEach(function(r){r.addEventListener('click',function(){open=+r.getAttribute('data-o');render()})});
  $$('[data-r]',v).forEach(function(r){r.addEventListener('click',function(){open={r:+r.getAttribute('data-r')};render()})});
  var ob=$('#oback');if(ob)ob.addEventListener('click',function(){open=null;render()});
  var ac=$('#accept');if(ac)ac.addEventListener('click',function(){var r=reqs().filter(function(x){return x.id===open.r})[0];S.rep[r.id]={st:0,car:r.reg||r.ph};log('l_acc','AP-'+r.id);open=r.id;shell();render()});
  $$('[data-s]',v).forEach(function(b){b.addEventListener('click',function(){var o=orders().filter(function(x){return x.id===open})[0];S.rep[open]={st:+b.getAttribute('data-s'),car:(S.rep[open]&&S.rep[open].car)||o.car};log('l_st','AP-'+open+' · '+t('st_'+S.rep[open].st));render()})});
  var os=$('#osave');if(os)os.addEventListener('click',function(){S.note[open]=$('#onote').value;log('l_note','AP-'+open);render()})}
shell();render();
})();
