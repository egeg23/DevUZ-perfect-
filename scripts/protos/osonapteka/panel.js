/* Panel Oson Apteka po etalonu Greenwell: svodka, broni (bron s sayta
   pervoy strokoy, status viden pokupatelyu), apteki i tarify (svezhest
   ostatkov, v vydache), lekarstva i spros, istoriya, roli. Demo-tsifry iz
   odnogo zerna, poetomu shodyatsya mezhdu ekranami. Sostoyanie: oa-panel-1
   (pishet panel), oa-bron-1 (pishet sayt). Podpisi tolko iz slovarya. */
(function(){
var d=document,$=function(s,r){return(r||d).querySelector(s)},$$=function(s,r){return[].slice.call((r||d).querySelectorAll(s))};
var D=JSON.parse($('#pn-data').textContent),U=D.ui;
function t(k){return U[k]}
function get(k,def){try{var v=localStorage.getItem(k);return v?JSON.parse(v):def}catch(e){return def}}
function put(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function sum(n){return fmt(n)+' '+D.sum}
function mln(n){return(n/1e6).toFixed(1).replace('.',',')+' '+t('mln')}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var byId={};D.p.forEach(function(p){byId[p.id]=p});
var S=get('oa-panel-1',{}),view=location.hash.slice(1)||'sum',open=null;
S.st=S.st||{};S.note=S.note||{};S.off=S.off||{};S.log=S.log||[];S.role=S.role||'owner';
function save(){put('oa-panel-1',S)}
function log(what,ref){S.log.unshift({at:Date.now(),who:S.role,w:what,r:ref||''});S.log=S.log.slice(0,80);save()}

/* Demo-zerno: vse tsifry paneli iz nego. */
var zr=20261030;function rnd(){zr=(zr*16807)%2147483647;return zr/2147483647}
var NAMES=['Akmal','Dilnoza','Jasur','Sardor','Malika','Rustam','Nigora','Aziz','Shahnoza','Otabek','Nodira','Kamol'];
var PH=[],TN=['[[t:0]]','[[t:1]]','[[t:2]]','[[t:3]]','[[t:4]]','[[t:5]]'];for(var i=0;i<24;i++){var di=i%D.dist.length;PH.push({id:i,n:'«'+TN[i%TN.length]+'» '+(i+1)+' · '+D.dist[di],d:D.dist[di],top:rnd()>.7,upd:rnd()>.82?Math.floor(26+rnd()*70)*60:Math.ceil(rnd()*40),first:rnd()>.85})}
var Q={},AV={};D.p.forEach(function(p){Q[p.id]=Math.round((p.rx?400:1400)*(.4+rnd()))*(p.id%5===0?2:1);AV[p.id]=Math.max(2,Math.round((p.rx?60:220)*(.2+rnd())))});
var demo=[],now=Date.now();
for(var k=0;k<64;k++){var p=D.p[Math.floor(rnd()*rnd()*D.p.length)],ph=PH[Math.floor(rnd()*PH.length)];
  demo.push({id:4999-k,at:now-Math.floor(k*11+rnd()*9)*36e5,n:NAMES[Math.floor(rnd()*NAMES.length)],ph:'+998 9'+Math.floor(rnd()*10)+' *** ** '+(10+Math.floor(rnd()*89)),pid:p.id,phn:'#'+(ph.id+1)+' · '+ph.d,d:ph.d,pay:'cash',demo:1,st0:k<4?Math.floor(rnd()*2):rnd()>.12?2:3})}
function brons(){return get('oa-bron-1',[]).concat(demo)}
function st(o){return S.st[o.id]!==undefined?S.st[o.id]:o.demo?o.st0:0}
var owner=function(){return S.role==='owner'};

function shell(){var tabs=['sum','brons','ph','meds','log'];
  $('#app').innerHTML='<header class="pn-top"><div class="pn-brand"><svg viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="15" fill="#3873D3"/><path d="M14.9 15.2H30V30H14.9z" fill="#3873D3"/><circle cx="15" cy="15" r="10.4" fill="#fff"/><path d="M20.6 13.2v3.5h-3.9v3.9h-3.5v-3.9H9.3v-3.5h3.9V9.3h3.5v3.9z" fill="#EC3E34"/></svg><b>oson apteka</b><span>'+t('title')+' · '+t('demo')+'</span></div>'+
  '<label class="pn-role"><span>'+t('role')+'</span><select id="role"><option value="owner">'+t('role_owner')+'</option><option value="manager">'+t('role_manager')+'</option></select></label><a class="btn btn-g btn-s" href="'+D.home+'">'+t('home')+'</a><a class="btn btn-a btn-s" href="'+D.site+'">'+t('site')+'</a></header>'+
  '<nav class="pn-tabs">'+tabs.map(function(x){return'<a href="#'+x+'" data-v="'+x+'"'+(x===view?' aria-current="page"':'')+'>'+t('tab_'+x)+'</a>'}).join('')+'</nav><main class="pn-main" id="pv"></main>';
  $('#role').value=S.role;$('#role').addEventListener('change',function(e){S.role=e.target.value;log('l_role');render()});
  $$('.pn-tabs a').forEach(function(a){a.addEventListener('click',function(){view=a.getAttribute('data-v');open=null;$$('.pn-tabs a').forEach(function(x){x.toggleAttribute('aria-current',x===a)})})})}
addEventListener('hashchange',function(){view=location.hash.slice(1)||'sum';open=null;shell();render()});
addEventListener('storage',function(e){if(e.key==='oa-bron-1')render()});

function kpi(k,v,dl,hide){return'<div class="pn-k">'+(hide?'<small>'+t(k)+'</small><b class="pn-lock">'+t('hidden')+'</b>':'<small>'+t(k)+'</small><b>'+v+'</b>'+(dl!==undefined?'<em class="'+(dl>=0?'up':'dn')+'">'+(dl>=0?'+':'')+dl+'% '+t('vs')+'</em>':''))+'</div>'}
function fee(o){return byId[o.pid].pr*D.tf.fee/100}
function vSum(){var bs=brons(),done=bs.filter(function(o){return st(o)===2}),sq=Object.keys(Q).reduce(function(a,k){return a+Q[k]},0)*11;
  var fresh=PH.filter(function(x){return x.upd<1440}).length,rev=PH.reduce(function(a,x){return a+(x.first?0:D.tf.base)+(x.top?D.tf.top:0)},0)*7+done.reduce(function(a,o){return a+fee(o)},0)*40;
  var days=[];for(var i=29;i>=0;i--)days.push({v:0,site:false});bs.forEach(function(o){var k=29-Math.floor((now-o.at)/864e5);if(k>=0&&k<30){days[k].v+=1;if(!o.demo)days[k].site=true}});
  var mx=Math.max.apply(null,days.map(function(x){return x.v}))||1,nb=bs.length*38;
  var top=D.p.slice().sort(function(a,b){return Q[b.id]-Q[a.id]}).slice(0,5),short=D.p.slice().sort(function(a,b){return AV[a.id]/Q[a.id]-AV[b.id]/Q[b.id]}).slice(0,5);
  var f=[[t('f_search'),sq],[t('f_card'),Math.round(sq*.31)],[t('f_bron'),nb],[t('f_taken'),Math.round(nb*done.length/bs.length)]];
  return'<div class="pn-kpis">'+kpi('k_search',fmt(sq),9)+kpi('k_brons',fmt(nb),14)+kpi('k_taken',Math.round(done.length/bs.length*100)+'%')+kpi('k_fresh',fresh+' / '+PH.length)+kpi('k_rev',mln(rev),undefined,!owner())+'</div>'+
  '<div class="pn-row"><section class="pn-card w2"><h3>'+t('chart')+'</h3><div class="pn-chart">'+days.map(function(x){return'<i class="'+(x.site?'site':'')+'" style="height:'+Math.max(3,x.v/mx*100)+'%"></i>'}).join('')+'</div><p class="pn-mu"><span class="dot"></span>'+t('chart_site')+'</p></section>'+
  '<section class="pn-card"><h3>'+t('funnel')+'</h3>'+f.map(function(x){return'<div class="pn-f"><span>'+x[0]+'</span><b>'+fmt(x[1])+'</b><i style="transform:scaleX('+(x[1]/f[0][1])+')"></i></div>'}).join('')+'</section></div>'+
  '<div class="pn-row eq"><section class="pn-card"><h3>'+t('top')+'</h3>'+top.map(function(p){return'<div class="pn-li"><img src="'+p.im+'" alt=""><span>'+esc(p.n)+'</span><b>'+fmt(Q[p.id]*11)+' '+t('times')+'</b></div>'}).join('')+'</section>'+
  '<section class="pn-card"><h3>'+t('short')+'</h3>'+short.map(function(p){return'<div class="pn-li"><img src="'+p.im+'" alt=""><span>'+esc(p.n)+'</span><b class="warn">'+AV[p.id]+' '+t('ph_n')+'</b></div>'}).join('')+'</section></div>'+
  '<section class="pn-card"><h3>'+t('stale')+'</h3>'+PH.filter(function(x){return x.upd>=1440}).map(function(x){return'<div class="pn-li"><span></span><span>'+esc(x.n)+'</span><b class="warn">'+ago(x.upd)+'</b></div>'}).join('')+'</section>'}
function ago(m){return m<60?m+' '+t('p_min'):Math.floor(m/60)+' '+t('p_h')}
function when(ts){var dd=Math.floor((now-ts)/864e5);return dd<1?t('today')+' '+new Date(ts).toTimeString().slice(0,5):dd+' '+t('ago_d')}
function chip(o){var s=st(o);return'<span class="pn-st s'+s+'">'+t('st_'+s)+'</span>'}
function vBrons(){if(open)return vBron(open);var bs=brons(),mine=get('oa-bron-1',[]);
  return(mine.length?'':'<p class="pn-hint">'+t('b_none')+'</p>')+'<div class="pn-card"><table class="pn-t"><thead><tr><th>'+t('b_no')+'</th><th>'+t('b_when')+'</th><th>'+t('b_who')+'</th><th>'+t('b_med')+'</th><th>'+t('b_ph')+'</th><th>'+t('b_st')+'</th></tr></thead><tbody>'+
  bs.slice(0,40).map(function(o){return'<tr data-o="'+o.id+'"'+(o.demo?'':' class="new"')+'><td>'+o.id+(o.demo?'':' <span class="pn-new">'+t('b_new')+'</span>')+'</td><td>'+when(o.at)+'</td><td>'+esc(o.n)+'</td><td>'+esc(byId[o.pid].n)+'</td><td>'+esc(o.phn)+'</td><td>'+chip(o)+'</td></tr>'}).join('')+'</tbody></table></div>'}
function vBron(id){var o=brons().filter(function(x){return x.id===id})[0];if(!o){open=null;return vBrons()}var s=st(o),p=byId[o.pid];
  return'<button type="button" class="btn btn-g btn-s" id="oback">'+t('b_back')+'</button><div class="pn-row"><section class="pn-card w2"><h3>'+t('b_no')+o.id+(o.demo?'':' <span class="pn-new">'+t('b_new')+'</span>')+'</h3>'+
  '<p class="pn-mu">'+t('b_hint')+'</p><div class="pn-steps">'+[0,1,2,3].map(function(k){return'<button type="button" data-s="'+k+'" aria-pressed="'+(k===s)+'" class="'+(k<=s&&s<3&&k<3?'done':'')+'">'+t('st_'+k)+'</button>'}).join('')+'</div>'+
  '<div class="pn-li"><img src="'+p.im+'" alt=""><span>'+esc(p.f)+'<br><small class="pn-mu">'+t(p.rx?'rx1':'rx0')+'</small></span><b>'+sum(p.pr)+(owner()?'<small>'+t('b_fee')+' '+sum(fee(o))+'</small>':'')+'</b></div></section>'+
  '<section class="pn-card"><h3>'+esc(o.n)+'</h3><p><span class="pn-mu">'+t('b_phone')+':</span> '+esc(o.ph)+'</p><p><span class="pn-mu">'+t('b_ph')+':</span> '+esc(o.phn)+'</p><p><span class="pn-mu">'+t('b_dist')+':</span> '+esc(o.d)+'</p><p><span class="pn-mu">'+t('b_pay')+':</span> '+esc(o.pay==='cash'?t('b_cash'):o.pay)+'</p>'+
  '<label class="fld"><span>'+t('b_note')+'</span><input id="onote" value="'+esc(S.note[o.id]||'')+'"></label><button type="button" class="btn btn-g btn-s" id="osave" style="margin-top:8px">'+t('b_save')+'</button></section></div>'}
function vPh(){return'<p class="pn-hint">'+t('p_hint')+'</p><div class="pn-card"><table class="pn-t"><thead><tr><th>'+t('p_name')+'</th><th>'+t('p_tariff')+'</th><th>'+t('p_upd')+'</th>'+(owner()?'<th>'+t('p_fee')+'</th>':'')+'<th>'+t('p_on')+'</th></tr></thead><tbody>'+
  PH.map(function(x){return'<tr><td>'+esc(x.n)+'</td><td>'+t(x.top?'p_top':'p_base')+'</td><td'+(x.upd>=1440?' class="warn"':'')+'>'+ago(x.upd)+'</td>'+(owner()?'<td>'+(x.first?t('p_first'):sum(D.tf.base+(x.top?D.tf.top:0)))+'</td>':'')+'<td><label class="pn-sw"><input type="checkbox" data-ph="'+x.id+'"'+(S.off[x.id]?'':' checked')+' aria-label="'+t('p_on')+'"></label></td></tr>'}).join('')+'</tbody></table></div>'}
function vMeds(){return'<p class="pn-hint">'+t('m_hint')+'</p><div class="pn-card"><table class="pn-t"><thead><tr><th>'+t('m_name')+'</th><th>'+t('m_rx')+'</th><th>'+t('m_price')+'</th><th>'+t('m_ph')+'</th><th>'+t('m_q')+'</th></tr></thead><tbody>'+
  D.p.map(function(p){return'<tr><td><span class="pn-nm"><img src="'+p.im+'" alt="">'+esc(p.f)+'</span></td><td>'+t(p.rx?'rx1':'rx0')+'</td><td>'+sum(p.pr)+'</td><td>'+AV[p.id]+'</td><td>'+fmt(Q[p.id]*11)+'</td></tr>'}).join('')+'</tbody></table></div>'}
function vLog(){var who=function(r){return t(r==='manager'?'role_manager':'role_owner')};return'<div class="pn-card">'+(S.log.length?S.log.map(function(x){return'<div class="pn-log"><time>'+new Date(x.at).toLocaleString()+'</time><b>'+who(x.who)+'</b><span>'+t(x.w)+(x.r?' '+esc(x.r):'')+'</span></div>'}).join(''):'<p class="pn-mu">'+t('l_none')+'</p>')+'</div>'}
var toastT;function toast(m){var e=$('#pt');if(!e){e=d.createElement('div');e.id='pt';e.className='toast';d.body.appendChild(e)}e.textContent=m;e.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){e.classList.remove('on')},2200)}
function render(){var v=$('#pv');if(!v)return;now=Date.now();
  v.innerHTML=view==='brons'?vBrons():view==='ph'?vPh():view==='meds'?vMeds():view==='log'?vLog():vSum();
  $$('[data-o]',v).forEach(function(r){r.addEventListener('click',function(){open=+r.getAttribute('data-o');render()})});
  var ob=$('#oback');if(ob)ob.addEventListener('click',function(){open=null;render()});
  $$('[data-s]',v).forEach(function(b){b.addEventListener('click',function(){S.st[open]=+b.getAttribute('data-s');log('l_st','№'+open+' · '+t('st_'+S.st[open]));render()})});
  var os=$('#osave');if(os)os.addEventListener('click',function(){S.note[open]=$('#onote').value;log('l_note','№'+open);toast(t('saved'));render()});
  $$('[data-ph]',v).forEach(function(c){c.addEventListener('change',function(){var id=+c.getAttribute('data-ph');S.off[id]=!c.checked;log('l_ph',PH[id].n+(c.checked?' +':' -'));toast(t('saved'))})})}
shell();render();
})();
