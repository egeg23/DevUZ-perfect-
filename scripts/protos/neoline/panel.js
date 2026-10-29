/* Panel magazina Neoline po etalonu Greenwell: svodka, zakazy (zakaz s sayta
   pervoy strokoy, status viden pokupatelyu), tovary i ostatki, bazy kamer
   (versiya uhodit na sayt), istoriya, roli. Demo-tsifry iz odnogo zerna,
   poetomu shodyatsya mezhdu ekranami. Sostoyanie: nl-panel-1 (pishet panel),
   nl-orders-1 (pishet sayt). Podpisi tolko iz slovarya (panel-ui.mjs). */
(function(){
var d=document,$=function(s,r){return(r||d).querySelector(s)},$$=function(s,r){return[].slice.call((r||d).querySelectorAll(s))};
var D=JSON.parse($('#pn-data').textContent),U=D.ui;
function t(k){return U[k]}
function get(k,def){try{var v=localStorage.getItem(k);return v?JSON.parse(v):def}catch(e){return def}}
function put(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function sum(n){return fmt(n)+' '+D.sum}
function mln(n){return(n/1e6).toFixed(1).replace('.',',')+' '+t('mln')}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var byId={};D.p.forEach(function(p){byId[p.id]=p});
var S=get('nl-panel-1',{}),view=location.hash.slice(1)||'sum',open=null;
S.st=S.st||{};S.note=S.note||{};S.base=S.base||{};S.log=S.log||[];S.role=S.role||'owner';
function save(){put('nl-panel-1',S)}
function log(what,ref){S.log.unshift({at:Date.now(),who:S.role,w:what,r:ref||''});S.log=S.log.slice(0,80);save()}

/* Demo-zerno: vse tsifry panely iz nego. */
var zr=20261029;function rnd(){zr=(zr*16807)%2147483647;return zr/2147483647}
var live=D.p.filter(function(p){return p.c!=='sale'});
var stock={},cost={};D.p.forEach(function(p){stock[p.id]=p.s?Math.floor(rnd()*28)+1:0;cost[p.id]=Math.round(p.p*(.62+rnd()*.12)/1000)*1000});
var NAMES=['Akmal','Dilshod','Jasur','Sardor','Bekzod','Rustam','Timur','Aziz','Sherzod','Otabek','Nodir','Kamol'];
var demo=[],now=Date.now(),PAYS=['Payme','Uzum Nasiya','UzCard','Humo'];
for(var i=0;i<46;i++){var n=1+Math.floor(rnd()*2),items=[],s=0;for(var k=0;k<n;k++){var p=live[Math.floor(rnd()*rnd()*live.length)];items.push([p.id,1]);s+=p.p}
  demo.push({id:996-i,at:now-Math.floor(i*15.4+rnd()*10)*36e5,n:NAMES[Math.floor(rnd()*NAMES.length)],ph:'+998 9'+Math.floor(rnd()*10)+' *** ** '+(10+Math.floor(rnd()*89)),a:'',pay:PAYS[Math.floor(rnd()*4)],items:items,g:[],sum:s,demo:1,st0:i<3?Math.floor(rnd()*2):3})}
function orders(){return get('nl-orders-1',[]).concat(demo)}
function st(o){return S.st[o.id]!==undefined?S.st[o.id]:o.demo?o.st0:0}
var prev=demo.reduce(function(a,o){return a+o.sum},0)*.86;

function shell(){var tabs=['sum','orders','goods','base','log'];
  $('#app').innerHTML='<header class="pn-top"><div class="pn-brand"><svg viewBox="5 8 69.5 47" aria-hidden="true"><path fill="currentColor" d="M58.6 8v11.9L46.8 31.7V19.9h-7.6L21.1 38H5.2l7.9-8 22-22z"/><path fill="currentColor" d="M21 54.9V43l11.8-11.8V43h7.7l18-18.1h16l-8 8-22 22z"/></svg><b>NEOLINE</b><span>'+t('title')+' · '+t('demo')+'</span></div>'+
  '<label class="pn-role"><span>'+t('role')+'</span><select id="role"><option value="owner">'+t('role_owner')+'</option><option value="manager">'+t('role_manager')+'</option></select></label><a class="btn btn-g btn-s" href="'+D.home+'">'+t('home')+'</a><a class="btn btn-a btn-s" href="'+D.site+'">'+t('site')+'</a></header>'+
  '<nav class="pn-tabs">'+tabs.map(function(x){return'<a href="#'+x+'" data-v="'+x+'"'+(x===view?' aria-current="page"':'')+'>'+t('tab_'+x)+'</a>'}).join('')+'</nav><main class="pn-main" id="pv"></main>';
  $('#role').value=S.role;$('#role').addEventListener('change',function(e){S.role=e.target.value;log('l_role');render()});
  $$('.pn-tabs a').forEach(function(a){a.addEventListener('click',function(){view=a.getAttribute('data-v');open=null;$$('.pn-tabs a').forEach(function(x){x.toggleAttribute('aria-current',x===a)})})})}
addEventListener('hashchange',function(){view=location.hash.slice(1)||'sum';open=null;shell();render()});
addEventListener('storage',function(e){if(e.key==='nl-orders-1')render()});
var owner=function(){return S.role==='owner'};

function kpi(k,v,dl,hide){return'<div class="pn-k">'+(hide?'<small>'+t(k)+'</small><b class="pn-lock">'+t('hidden')+'</b>':'<small>'+t(k)+'</small><b>'+v+'</b>'+(dl!==undefined?'<em class="'+(dl>=0?'up':'dn')+'">'+(dl>=0?'+':'')+dl+'% '+t('vs')+'</em>':''))+'</div>'}
function vSum(){var os=orders(),rev=os.reduce(function(a,o){return a+o.sum},0),pr=os.reduce(function(a,o){return a+o.items.reduce(function(b,it){return b+(byId[it[0]].p-cost[it[0]])*it[1]},0)},0);
  var nas=os.filter(function(o){return/Nasiya/.test(o.pay)}).length;
  var days=[];for(var i=29;i>=0;i--)days.push({v:0,site:false});os.forEach(function(o){var k=29-Math.floor((now-o.at)/864e5);if(k>=0&&k<30){days[k].v+=o.sum;if(!o.demo)days[k].site=true}});
  var mx=Math.max.apply(null,days.map(function(x){return x.v}))||1;
  var sold={};os.forEach(function(o){o.items.forEach(function(it){sold[it[0]]=(sold[it[0]]||0)+it[1]})});
  var top=Object.keys(sold).sort(function(a,b){return sold[b]-sold[a]}).slice(0,5);
  var low=D.p.filter(function(p){return p.c!=='sale'}).sort(function(a,b){return stock[a.id]-stock[b.id]}).slice(0,5);
  var vis=Math.round(os.length*58),f=[[t('f_visit'),vis],[t('f_card'),Math.round(vis*.34)],[t('f_cart'),Math.round(vis*.06)],[t('f_order'),os.length]];
  return'<div class="pn-kpis">'+kpi('k_rev',mln(rev),Math.round((rev/prev-1)*100))+kpi('k_orders',os.length)+kpi('k_avg',sum(rev/os.length))+kpi('k_profit',mln(pr),undefined,!owner())+kpi('k_nasiya',Math.round(nas/os.length*100)+'%')+'</div>'+
  '<div class="pn-row"><section class="pn-card w2"><h3>'+t('chart')+'</h3><div class="pn-chart">'+days.map(function(x){return'<i class="'+(x.site?'site':'')+'" style="height:'+Math.max(2,x.v/mx*100)+'%" title="'+sum(x.v)+'"></i>'}).join('')+'</div><p class="pn-mu"><span class="dot"></span>'+t('chart_site')+'</p></section>'+
  '<section class="pn-card"><h3>'+t('funnel')+'</h3>'+f.map(function(x,i){return'<div class="pn-f"><span>'+x[0]+'</span><b>'+fmt(x[1])+'</b><i style="transform:scaleX('+(x[1]/f[0][1])+')"></i></div>'}).join('')+'</section></div>'+
  '<div class="pn-row"><section class="pn-card"><h3>'+t('top')+'</h3>'+top.map(function(id){var p=byId[id];return'<div class="pn-li"><img src="/protos/neoline/p/'+p.im+'-800.webp" alt=""><span>'+esc(p.n)+'</span><b>'+sold[id]+' '+t('pcs')+'</b></div>'}).join('')+'</section>'+
  '<section class="pn-card"><h3>'+t('low')+'</h3>'+low.map(function(p){return'<div class="pn-li"><img src="/protos/neoline/p/'+p.im+'-800.webp" alt=""><span>'+esc(p.n)+'</span><b class="'+(stock[p.id]?'':'warn')+'">'+(stock[p.id]?t('left')+' '+stock[p.id]:t('wait'))+'</b></div>'}).join('')+'</section></div>'}
function when(ts){var dd=Math.floor((now-ts)/864e5);return dd<1?t('today')+' '+new Date(ts).toTimeString().slice(0,5):dd+' '+t('ago_d')}
function chip(o){var s=st(o);return'<span class="pn-st s'+s+'">'+t('st_'+s)+'</span>'}
function vOrders(){if(open)return vOrder(open);var os=orders();
  var mine=get('nl-orders-1',[]);
  return(mine.length?'':'<p class="pn-hint">'+t('o_none')+'</p>')+'<div class="pn-card"><table class="pn-t"><thead><tr><th>'+t('o_no')+'</th><th>'+t('o_when')+'</th><th>'+t('o_who')+'</th><th>'+t('o_sum')+'</th><th>'+t('o_pay')+'</th><th>'+t('o_st')+'</th></tr></thead><tbody>'+
  os.slice(0,40).map(function(o){return'<tr data-o="'+o.id+'"'+(o.demo?'':' class="new"')+'><td>'+o.id+(o.demo?'':' <span class="pn-new">'+t('o_new')+'</span>')+'</td><td>'+when(o.at)+'</td><td>'+esc(o.n)+'</td><td>'+sum(o.sum)+'</td><td>'+esc(o.pay)+'</td><td>'+chip(o)+'</td></tr>'}).join('')+'</tbody></table></div>'}
function vOrder(id){var o=orders().filter(function(x){return x.id===id})[0];if(!o){open=null;return vOrders()}var s=st(o);
  return'<button type="button" class="btn btn-g btn-s" id="oback">'+t('o_back')+'</button><div class="pn-row"><section class="pn-card w2"><h3>'+t('o_no')+o.id+(o.demo?'':' <span class="pn-new">'+t('o_new')+'</span>')+'</h3>'+
  '<p class="pn-mu">'+t('o_hint')+'</p><div class="pn-steps">'+[0,1,2,3].map(function(k){return'<button type="button" data-s="'+k+'" aria-pressed="'+(k===s)+'" class="'+(k<=s?'done':'')+'">'+t('st_'+k)+'</button>'}).join('')+'</div>'+
  '<h4>'+t('o_items')+'</h4>'+o.items.map(function(it){var p=byId[it[0]];return'<div class="pn-li"><img src="/protos/neoline/p/'+p.im+'-800.webp" alt=""><span>'+esc(p.n)+' × '+it[1]+'</span><b>'+sum(p.p*it[1])+(owner()?'<small>'+t('o_cost')+' '+sum(cost[p.id]*it[1])+'</small>':'')+'</b></div>'}).join('')+
  (o.g||[]).map(function(){var p=byId[999441];return'<div class="pn-li"><img src="/protos/neoline/p/'+p.im+'-800.webp" alt=""><span>'+esc(p.n)+' · '+t('o_gift')+'</span><b>0</b></div>'}).join('')+'</section>'+
  '<section class="pn-card"><h3>'+esc(o.n)+'</h3><p><span class="pn-mu">'+t('o_phone')+':</span> '+esc(o.ph)+'</p><p><span class="pn-mu">'+t('o_addr')+':</span> '+esc(o.a||'')+'</p><p><span class="pn-mu">'+t('o_pay')+':</span> '+esc(o.pay)+'</p><p><span class="pn-mu">'+t('o_sum')+':</span> <b>'+sum(o.sum)+'</b></p>'+
  '<label class="fld"><span>'+t('o_note')+'</span><input id="onote" value="'+esc(S.note[o.id]||'')+'"></label><button type="button" class="btn btn-g btn-s" id="osave" style="margin-top:8px">'+t('o_save')+'</button></section></div>'}
function way(u){return t(u==='wifi'?'u_wifi':u==='otg'?'u_otg':u==='app'?'u_app':'u_cab')}
function vGoods(){return'<p class="pn-hint">'+t('g_hint')+'</p><div class="pn-card"><table class="pn-t"><thead><tr><th>'+t('g_name')+'</th><th>'+t('g_cat')+'</th><th>'+t('g_price')+'</th><th>'+t('g_stock')+'</th>'+(owner()?'<th>'+t('o_cost')+'</th><th>'+t('g_margin')+'</th>':'')+'</tr></thead><tbody>'+
  D.p.map(function(p){return'<tr><td><span class="pn-nm"><img src="/protos/neoline/p/'+p.im+'-800.webp" alt="">'+esc(p.n)+'</span></td><td>'+esc(D.cats[p.c])+'</td><td>'+sum(p.p)+'</td><td>'+(stock[p.id]?stock[p.id]+' '+t('pcs'):'<span class="warn">'+t('wait')+'</span>')+'</td>'+(owner()?'<td>'+sum(cost[p.id])+'</td><td>'+Math.round((p.p/cost[p.id]-1)*100)+'%</td>':'')+'</tr>'}).join('')+'</tbody></table></div>'}
function baseOf(id){var b=S.base[id];if(b)return b;var dd=new Date(now-((id%9)+1)*864e5);return{v:'v'+(dd.getMonth()+1)+'.'+dd.getDate(),dt:dd.toISOString().slice(0,10)}}
function vBase(){return'<p class="pn-hint">'+t('b_hint')+'</p><div class="pn-card"><table class="pn-t"><thead><tr><th>'+t('g_name')+'</th><th>'+t('b_way')+'</th><th>'+t('b_ver')+'</th><th>'+t('b_date')+'</th><th></th></tr></thead><tbody>'+
  D.p.filter(function(p){return p.c==='radar'||p.c==='dvr'}).map(function(p){var b=baseOf(p.id);return'<tr data-b="'+p.id+'"><td><span class="pn-nm"><img src="/protos/neoline/p/'+p.im+'-800.webp" alt="">'+esc(p.n)+'</span></td><td>'+way(p.u)+'</td><td><input class="pn-in" data-f="v" value="'+esc(b.v)+'" aria-label="'+t('b_ver')+'"></td><td><input class="pn-in" type="date" data-f="dt" value="'+b.dt+'" aria-label="'+t('b_date')+'"></td><td><button type="button" class="btn btn-a btn-s" data-save="'+p.id+'">'+t('b_save')+'</button></td></tr>'}).join('')+'</tbody></table></div>'}
function vLog(){var who=function(r){return t(r==='manager'?'role_manager':'role_owner')};return'<div class="pn-card">'+(S.log.length?S.log.map(function(x){return'<div class="pn-log"><time>'+new Date(x.at).toLocaleString()+'</time><b>'+who(x.who)+'</b><span>'+t(x.w)+(x.r?' '+esc(x.r):'')+'</span></div>'}).join(''):'<p class="pn-mu">'+t('l_none')+'</p>')+'</div>'}
var toastT;function toast(m){var e=$('#pt');if(!e){e=d.createElement('div');e.id='pt';e.className='toast';d.body.appendChild(e)}e.textContent=m;e.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){e.classList.remove('on')},2200)}
function render(){var v=$('#pv');if(!v)return;now=Date.now();
  v.innerHTML=view==='orders'?vOrders():view==='goods'?vGoods():view==='base'?vBase():view==='log'?vLog():vSum();
  $$('[data-o]',v).forEach(function(r){r.addEventListener('click',function(){open=+r.getAttribute('data-o');render()})});
  var ob=$('#oback');if(ob)ob.addEventListener('click',function(){open=null;render()});
  $$('[data-s]',v).forEach(function(b){b.addEventListener('click',function(){S.st[open]=+b.getAttribute('data-s');log('l_st','№'+open+' · '+t('st_'+S.st[open]));render()})});
  var os=$('#osave');if(os)os.addEventListener('click',function(){S.note[open]=$('#onote').value;log('l_note','№'+open);render()});
  $$('[data-save]',v).forEach(function(b){b.addEventListener('click',function(){var id=b.getAttribute('data-save'),r=b.closest('tr');S.base[id]={v:$('[data-f=v]',r).value.trim(),dt:$('[data-f=dt]',r).value};log('l_base',byId[id].n+' · '+S.base[id].v);toast(t('b_saved'))})})}
shell();render();
})();
