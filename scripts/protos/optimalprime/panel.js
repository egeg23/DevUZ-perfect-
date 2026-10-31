/* Panel Optimal Prime po etalonu Greenwell: svodka (zayavki k proshlym 30
   dnyam, grafik s otmetkoy dnya s sayta, put zayavki, otkuda, klienty po
   rezhimu, sroki nedeli), zayavki (s sayta i iz konstruktora pervoy
   strokoy, status viden klientu v "Moya zayavka"), klienty na
   obsluzhivanii, sroki otchyotov, istoriya, roli: menedzher ne vidit
   vyruchku. Demo-tsifry iz odnogo zerna. Sostoyanie: op-panel-1 (pishet
   panel), op-req-1 (pishet sayt). Podpisi tolko iz slovarya. */
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
var RG={};D.rg.forEach(function(r){RG[r.id]=r});
var S=get('op-panel-1',{}),view=location.hash.slice(1)||'sum',open=null;
S.st=S.st||{};S.note=S.note||{};S.acc=S.acc||{};S.cal=S.cal||{};S.log=S.log||[];S.role=S.role||'owner';
function save(){put('op-panel-1',S)}
function log(what,ref){S.log.unshift({at:Date.now(),who:S.role,w:what,r:ref||''});S.log=S.log.slice(0,80);save()}

/* Demo-zerno: vse tsifry paneli iz nego. */
var zr=20261031;function rnd(){zr=(zr*16807)%2147483647;return zr/2147483647}
var ACC=['Dilnoza','Gulnora','Sardor','Nodira','Malika'],TN=['[[t:0]]','[[t:1]]','[[t:2]]','[[t:3]]','[[t:4]]','[[t:5]]'],KIND=['Trade','Build','Logistic','Med','Food','Textile'];
var CL=[];for(var i=0;i<18;i++){var rg=D.rg[i%5===0?0:i%3===0?1:2],ops=Math.round(20+rnd()*90);
  CL.push({id:i,n:'«'+TN[i%TN.length]+' '+KIND[(i*5)%KIND.length]+'» · '+t('demo'),rg:rg.id,acc:ACC[i%ACC.length],ops:ops,fee:rg.def+Math.round((rnd()-.4)*6)*500000,next:1+Math.floor(rnd()*12),docs:rnd()>.28})}
var demo=[],now=Date.now(),SRC=['src_calc','src_tg','src_call','src_check'];
for(var k=0;k<46;k++){var c=CL[Math.floor(rnd()*CL.length)],r=D.rg[Math.floor(rnd()*3)];
  demo.push({id:2999-k,at:now-Math.floor(k*14+rnd()*12)*36e5,co:'«'+TN[(k+2)%TN.length]+' '+KIND[k%KIND.length]+'»',ph:'+998 9'+Math.floor(rnd()*10)+' *** ** '+(10+Math.floor(rnd()*89)),regime:r.id,sum:Math.max(r.def*.6,r.def+Math.round((rnd()-.5)*8)*500000),src:SRC[Math.floor(rnd()*rnd()*4)],kind:D.kinds[Math.floor(rnd()*D.kinds.length)],demo:1,st0:k<5?Math.floor(rnd()*2):rnd()>.62?3:rnd()>.4?2:rnd()>.5?4:1})}
function reqs(){return get('op-req-1',[]).concat(demo)}
function st(o){return S.st[o.id]!==undefined?S.st[o.id]:o.demo?o.st0:0}
function owner(){return S.role==='owner'}

function shell(){var tabs=['sum','req','cl','cal','log'];
  $('#app').innerHTML='<header class="pn-top"><div class="pn-brand">'+D.mark+'<b>Optimal Prime</b><span>'+t('title')+' · '+t('demo')+'</span></div>'+
  '<label class="pn-role"><span>'+t('role')+'</span><select id="role"><option value="owner">'+t('role_owner')+'</option><option value="manager">'+t('role_manager')+'</option></select></label><a class="btn btn-g btn-s" href="'+D.home+'">'+t('home')+'</a><a class="btn btn-a btn-s" href="'+D.site+'">'+t('site')+'</a></header>'+
  '<nav class="pn-tabs">'+tabs.map(function(x){return'<a href="#'+x+'" data-v="'+x+'"'+(x===view?' aria-current="page"':'')+'>'+t('tab_'+x)+'</a>'}).join('')+'</nav><main class="pn-main" id="pv"></main>';
  $('#role').value=S.role;$('#role').addEventListener('change',function(e){S.role=e.target.value;log('l_role');render()});
  $$('.pn-tabs a').forEach(function(a){a.addEventListener('click',function(){view=a.getAttribute('data-v');open=null;$$('.pn-tabs a').forEach(function(x){x.toggleAttribute('aria-current',x===a)})})})}
addEventListener('hashchange',function(){view=location.hash.slice(1)||'sum';open=null;shell();render()});
addEventListener('storage',function(e){if(e.key==='op-req-1')render()});

function kpi(k,v,dl,hide){return'<div class="pn-k">'+(hide?'<small>'+t(k)+'</small><b class="pn-lock">'+t('hidden')+'</b>':'<small>'+t(k)+'</small><b>'+v+'</b>'+(dl!==undefined?'<em class="'+(dl>=0?'up':'dn')+'">'+(dl>=0?'+':'')+dl+'% '+t('vs')+'</em>':''))+'</div>'}
var EV=['e_vat','e_profit','e_turn','e_ndfl','e_stat','e_pay'];
function cal(){var a=[];for(var i=0;i<9;i++){var due=new Date(now+(i*3+1)*864e5);a.push({id:i,due:due,w:EV[i%EV.length],n:3+((i*7)%9)})}return a}
function vSum(){var rs=reqs(),meet=rs.filter(function(o){return st(o)>=1&&st(o)<4}).length,won=rs.filter(function(o){return st(o)===3}).length,rev=CL.reduce(function(a,c){return a+c.fee},0);
  var days=[];for(var i=29;i>=0;i--)days.push({v:0,site:false});rs.forEach(function(o){var k=29-Math.floor((now-o.at)/864e5);if(k>=0&&k<30){days[k].v+=1;if(!o.demo)days[k].site=true}});
  var mx=Math.max.apply(null,days.map(function(x){return x.v}))||1;
  var f=[[t('f_req'),rs.length],[t('f_meet'),meet],[t('f_calc'),rs.filter(function(o){return st(o)===2||st(o)===3}).length],[t('f_deal'),won]];
  var src={};rs.forEach(function(o){var s=o.src||'src_calc';src[s]=(src[s]||0)+1});
  var by={};CL.forEach(function(c){by[c.rg]=(by[c.rg]||0)+1});
  return'<div class="pn-kpis">'+kpi('k_req',fmt(rs.length),12)+kpi('k_meet',meet)+kpi('k_won',won,8)+kpi('k_cl',CL.length)+kpi('k_rev',mln(rev),6,!owner())+kpi('k_late',cal().filter(function(x){return x.due-now<7*864e5}).length)+'</div>'+
  '<div class="pn-row"><section class="pn-card w2"><h3>'+t('chart')+'</h3><div class="pn-chart">'+days.map(function(x){return'<i class="'+(x.site?'site':'')+'" style="height:'+Math.max(4,x.v/mx*100)+'%"></i>'}).join('')+'</div><p class="pn-mu"><span class="dot"></span>'+t('chart_site')+'</p></section>'+
  '<section class="pn-card"><h3>'+t('funnel')+'</h3>'+f.map(function(x){return'<div class="pn-f"><span>'+x[0]+'</span><b>'+fmt(x[1])+'</b><i style="transform:scaleX('+(x[1]/f[0][1])+')"></i></div>'}).join('')+'</section></div>'+
  '<div class="pn-row eq"><section class="pn-card"><h3>'+t('src')+'</h3>'+SRC.map(function(s){return'<div class="pn-f"><span>'+t(s)+'</span><b>'+(src[s]||0)+'</b><i style="transform:scaleX('+((src[s]||0)/rs.length)+')"></i></div>'}).join('')+'</section>'+
  '<section class="pn-card"><h3>'+t('by_regime')+'</h3>'+D.rg.map(function(r){return'<div class="pn-f"><span>'+esc(r.n)+'</span><b>'+(by[r.id]||0)+'</b><i style="transform:scaleX('+((by[r.id]||0)/CL.length)+')"></i></div>'}).join('')+'</section></div>'+
  '<section class="pn-card"><h3>'+t('week')+'</h3>'+cal().filter(function(x){return x.due-now<7*864e5}).map(function(x){return'<div class="pn-li"><b>'+x.due.toLocaleDateString()+'</b><span>'+t(x.w)+'</span><b>'+x.n+'</b></div>'}).join('')+'</section>'}
function when(ts){var dd=Math.floor((now-ts)/864e5);return dd<1?t('today')+' '+new Date(ts).toTimeString().slice(0,5):dd+' '+t('ago_d')}
function chip(o){var s=st(o);return'<span class="pn-st s'+s+'">'+t('st_'+s)+'</span>'}
function vReq(){if(open)return vOne(open);var rs=reqs(),mine=get('op-req-1',[]);
  return(mine.length?'':'<p class="pn-hint">'+t('r_none')+'</p>')+'<div class="pn-card"><table class="pn-t"><thead><tr><th>'+t('r_no')+'</th><th>'+t('r_when')+'</th><th>'+t('r_who')+'</th><th>'+t('r_regime')+'</th><th>'+t('r_sum')+'</th><th>'+t('r_st')+'</th></tr></thead><tbody>'+
  rs.slice(0,40).map(function(o){return'<tr data-o="'+o.id+'"'+(o.demo?'':' class="new"')+'><td>'+o.id+(o.demo?'':' <span class="pn-new">'+t('r_new')+'</span>')+'</td><td>'+when(o.at)+'</td><td>'+esc(o.co)+'</td><td>'+esc(RG[o.regime]?RG[o.regime].n:'')+'</td><td>'+sum(o.sum)+'</td><td>'+chip(o)+'</td></tr>'}).join('')+'</tbody></table></div>'}
function vOne(id){var o=reqs().filter(function(x){return x.id===id})[0];if(!o){open=null;return vReq()}var s=st(o);
  return'<button type="button" class="btn btn-g btn-s" id="oback">'+t('r_back')+'</button><div class="pn-row"><section class="pn-card w2"><h3>'+t('r_no')+o.id+' · '+esc(o.co)+(o.demo?'':' <span class="pn-new">'+t('r_new')+'</span>')+'</h3>'+
  '<p class="pn-mu">'+t('r_hint')+'</p><div class="pn-steps">'+[0,1,2,3,4].map(function(k){return'<button type="button" data-s="'+k+'" aria-pressed="'+(k===s)+'" class="'+(k<=s&&s<4&&k<4?'done':'')+'">'+t('st_'+k)+'</button>'}).join('')+'</div>'+
  '<h4>'+t('r_calc')+'</h4><p>'+esc(RG[o.regime]?RG[o.regime].n:'')+' · <b>'+sum(o.sum)+'</b> '+t('per_m')+'</p>'+(o.calc?'<p class="pn-mu">'+esc(o.calc)+'</p>':'')+'</section>'+
  '<section class="pn-card"><p><span class="pn-mu">'+t('r_phone')+':</span> '+esc(o.ph)+'</p><p><span class="pn-mu">'+t('r_kind')+':</span> '+esc(o.kind||'')+'</p><p><span class="pn-mu">'+t('src')+':</span> '+t(o.src||'src_calc')+'</p>'+
  '<label class="fld"><span>'+t('r_acc')+'</span><select id="oacc"><option value="">'+t('pick')+'</option>'+ACC.map(function(a){return'<option'+(S.acc[o.id]===a?' selected':'')+'>'+a+'</option>'}).join('')+'</select></label>'+
  '<label class="fld"><span>'+t('r_note')+'</span><input id="onote" value="'+esc(S.note[o.id]||'')+'"></label><button type="button" class="btn btn-g btn-s" id="osave" style="margin-top:8px">'+t('r_save')+'</button></section></div>'}
function vCl(){return'<p class="pn-hint">'+t('c_hint')+'</p><div class="pn-card"><table class="pn-t"><thead><tr><th>'+t('c_name')+'</th><th>'+t('r_regime')+'</th><th>'+t('c_acc')+'</th><th>'+t('c_ops')+'</th><th>'+t('c_docs')+'</th><th>'+t('c_next')+'</th>'+(owner()?'<th>'+t('c_fee')+'</th>':'')+'</tr></thead><tbody>'+
  CL.map(function(c){return'<tr><td>'+esc(c.n)+'</td><td>'+esc(RG[c.rg].n)+'</td><td>'+c.acc+'</td><td>'+c.ops+'</td><td'+(c.docs?'':' class="warn"')+'>'+t(c.docs?'c_ok':'c_wait')+'</td><td>'+new Date(now+c.next*864e5).toLocaleDateString()+'</td>'+(owner()?'<td>'+sum(c.fee)+'</td>':'')+'</tr>'}).join('')+'</tbody></table></div>'}
function vCal(){return'<p class="pn-hint">'+t('cal_hint')+'</p><div class="pn-card"><table class="pn-t"><thead><tr><th>'+t('cal_due')+'</th><th>'+t('cal_what')+'</th><th>'+t('cal_who')+'</th><th>'+t('cal_st')+'</th></tr></thead><tbody>'+
  cal().map(function(x){return'<tr><td>'+x.due.toLocaleDateString()+'</td><td>'+t(x.w)+'</td><td>'+x.n+'</td><td><label class="pn-sw"><input type="checkbox" data-cal="'+x.id+'"'+(S.cal[x.id]?' checked':'')+' aria-label="'+t('cal_st')+'"></label></td></tr>'}).join('')+'</tbody></table></div>'}
function vLog(){var who=function(r){return t(r==='manager'?'role_manager':'role_owner')};return'<div class="pn-card">'+(S.log.length?S.log.map(function(x){return'<div class="pn-log"><time>'+new Date(x.at).toLocaleString()+'</time><b>'+who(x.who)+'</b><span>'+t(x.w)+(x.r?' '+esc(x.r):'')+'</span></div>'}).join(''):'<p class="pn-mu">'+t('l_none')+'</p>')+'</div>'}
var toastT;function toast(m){var e=$('#pt');if(!e){e=d.createElement('div');e.id='pt';e.className='toast';d.body.appendChild(e)}e.textContent=m;e.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){e.classList.remove('on')},2200)}
function render(){var v=$('#pv');if(!v)return;now=Date.now();
  v.innerHTML=view==='req'?vReq():view==='cl'?vCl():view==='cal'?vCal():view==='log'?vLog():vSum();
  $$('[data-o]',v).forEach(function(r){r.addEventListener('click',function(){open=+r.getAttribute('data-o');render()})});
  var ob=$('#oback');if(ob)ob.addEventListener('click',function(){open=null;render()});
  $$('[data-s]',v).forEach(function(b){b.addEventListener('click',function(){S.st[open]=+b.getAttribute('data-s');log('l_st','№'+open+' · '+t('st_'+S.st[open]));render()})});
  var os=$('#osave');if(os)os.addEventListener('click',function(){S.note[open]=$('#onote').value;var a=$('#oacc').value;if(a!==(S.acc[open]||'')){S.acc[open]=a;log('l_acc','№'+open+' · '+a)}log('l_note','№'+open);toast(t('saved'));render()});
  $$('[data-cal]',v).forEach(function(c){c.addEventListener('change',function(){var id=+c.getAttribute('data-cal');S.cal[id]=c.checked;log('l_cal',t(EV[id%EV.length]));toast(t('saved'))})})}
shell();render();
})();
