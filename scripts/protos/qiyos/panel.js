/* Qiyos admin panel (Greenwell + Cargo Pro functions, Glassy V7 + CRM look).
   Views: summary, clicks (site click first row, status visible on the site
   in "my applications"), partners (hide, rates, sums, terms, referral link,
   order, "recommended": the site re-renders at once), rewards (owner only),
   history. Demo numbers come from one seed so screens agree. State:
   qy-panel-1 (panel), qy-clicks-1 (site clicks), qy-partners-1 (partner
   overrides read by the site). No model calls. Labels only from the dict. */
(function(){
var d=document,$=function(s,r){return(r||d).querySelector(s)},$$=function(s,r){return[].slice.call((r||d).querySelectorAll(s))};
var D=JSON.parse($('#pn-data').textContent),U=D.ui;
function t(k){return U[k]}
function get(k,def){try{var v=localStorage.getItem(k);return v?JSON.parse(v):def}catch(e){return def}}
function put(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function sum(n){return fmt(n)+' '+D.sum}
function mln(n){var x=n/1e6;return(x>=10||x%1===0?Math.round(x):x.toFixed(1).replace('.',','))+' '+t('mln')}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function ago(ts){var dt=new Date(ts);return('0'+dt.getDate()).slice(-2)+'.'+('0'+(dt.getMonth()+1)).slice(-2)+' '+('0'+dt.getHours()).slice(-2)+':'+('0'+dt.getMinutes()).slice(-2)}
function ann(s,r,n){var q=r/1200;return q?s*q/(1-Math.pow(1+q,-n)):s/n}
var byId={};D.p.forEach(function(p){byId[p.id]=p});
var S=get('qy-panel-1',{}),view=location.hash.slice(1)||'sum',open=null,q='',onlySite=false;
S.st=S.st||{};S.log=S.log||[];S.role=S.role||'owner';S.req=S.req||0;
function save(){put('qy-panel-1',S)}
function log(what,ref){S.log.unshift({at:Date.now(),who:S.role,w:what,r:ref||''});S.log=S.log.slice(0,80);save()}
var owner=function(){return S.role==='owner'};
var toastT=0;function toast(m){var e=$('#pn-toast');e.textContent=m;e.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){e.classList.remove('on')},2200)}

/* Demo seed: every number of the panel comes from it. */
var zr=20261118;function rnd(){zr=(zr*16807)%2147483647;return zr/2147483647}
var CPA={},W={};D.p.forEach(function(p,i){CPA[p.id]=+(0.8+rnd()*1.4).toFixed(1);W[p.id]=.4+rnd()*1.2});
var NZ=[];for(var z0=0;z0<30;z0++)NZ.push((z0%7>4?.35:0)+rnd()*.65);
var NET=['[[t:0]] CPA','Admitad','direct'];
var SUMS=[3e6,5e6,10e6,15e6,20e6,30e6,50e6],TERMS=[6,12,18,24,36,48],now=Date.now(),demo=[];
for(var k=0;k<96;k++){var ids=D.p.map(function(p){return p.id}),pid=ids[Math.floor(rnd()*rnd()*ids.length*1.3)%ids.length],p=byId[pid],s=SUMS[Math.floor(rnd()*SUMS.length)],n=TERMS[Math.floor(rnd()*TERMS.length)];
  if(p.max&&s>p.max)s=p.max;if(n>p.tmax)n=p.tmax;if(n<p.tmin)n=p.tmin;
  var r0=rnd(),st0=k<5?(r0>.5?1:0):r0>.62?3:r0>.48?2:r0>.3?1:r0>.18?4:0;
  demo.push({id:6999-k,p:pid,s:s,n:n,pay:Math.round(ann(s,p.lo,n)),at:now-Math.floor(k*7+rnd()*6)*36e5,demo:1,st0:st0,net:NET[Math.floor(rnd()*NET.length)]})}
function clicks(){return get('qy-clicks-1',[]).concat(demo)}
function st(c){return S.st[c.id]!==undefined?S.st[c.id]:c.demo?c.st0:0}
function ov(){return get('qy-partners-1',{})}
function partners(){var o=ov();return D.p.map(function(p,i){var x=o[p.id]||{},r={};for(var kk in p)r[kk]=p[kk];for(var kk2 in x)if(x[kk2]!==''&&x[kk2]!=null)r[kk2]=x[kk2];if(r.ord===undefined)r.ord=i;return r}).sort(function(a,b){return a.ord-b.ord})}

var IC={sum:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',clicks:'<path d="M5 12h14M13 6l6 6-6 6"/>',partners:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5h8v2"/>',pay:'<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9 10h4.5a1.5 1.5 0 0 1 0 3H10a1.5 1.5 0 0 0 0 3H15"/>',log:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'};
function ic(k){return'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+IC[k]+'</svg>'}
function shell(){var tabs=['sum','clicks','partners','pay','log'],nw=get('qy-clicks-1',[]).filter(function(c){return st(c)===0}).length;
  $('#app').innerHTML='<div class="pn-bg" aria-hidden="true"><i></i><i></i><i></i></div><nav class="pn-rail" aria-label="'+t('title')+'"><span class="pn-mark"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="none" stroke="#fff" stroke-width="5"/><path d="M27 27l7 7" stroke="#fff" stroke-width="5" stroke-linecap="round"/><circle cx="20" cy="20" r="6" fill="#f0b429"/></svg></span>'+
  tabs.map(function(x){return'<a href="#'+x+'" data-v="'+x+'"'+(x===view?' aria-current="page"':'')+'>'+ic(x)+'<span>'+t('tab_'+x)+'</span>'+(x==='clicks'&&nw?'<b class="pn-dot">'+nw+'</b>':'')+'</a>'}).join('')+'</nav>'+
  '<div class="pn-wrap"><header class="pn-top"><div class="pn-brand"><b>Qiyos</b><span>'+t('title')+' · '+t('demo')+'</span></div><label class="pn-find"><span class="sr">'+t('search')+'</span><input id="find" type="search" placeholder="'+t('search')+'" value="'+esc(q)+'"></label>'+
  '<label class="pn-role"><span>'+t('role')+'</span><select id="role"><option value="owner">'+t('role_owner')+'</option><option value="manager">'+t('role_manager')+'</option></select></label><a class="pb pb-g" href="'+D.home+'">'+t('home')+'</a><a class="pb pb-a" href="'+D.site+'">'+t('site')+'</a></header><main class="pn-main" id="pv"></main></div><div class="pn-toast" id="pn-toast" role="status" aria-live="polite"></div>';
  $('#role').value=S.role;$('#role').addEventListener('change',function(e){S.role=e.target.value;log('l_role',t('role_'+S.role));render()});
  $('#find').addEventListener('input',function(e){q=e.target.value.trim().toLowerCase();if(view!=='clicks'&&view!=='partners'){view=/^\d+$/.test(q)?'clicks':'partners';history.replaceState(null,'','#'+view);$$('.pn-rail a').forEach(function(x){x.toggleAttribute('aria-current',x.getAttribute('data-v')===view)})}render()});
  $$('.pn-rail a').forEach(function(a){a.addEventListener('click',function(){view=a.getAttribute('data-v');open=null;$$('.pn-rail a').forEach(function(x){x.toggleAttribute('aria-current',x===a)})})})}
addEventListener('hashchange',function(){view=location.hash.slice(1)||'sum';open=null;render()});
addEventListener('storage',function(e){if(e.key==='qy-clicks-1'){shell();render()}});

function kpi(k,v,dl,hide,main){return'<div class="pn-k'+(main?' main':'')+'"><small>'+t(k)+'</small>'+(hide?'<b class="pn-lock">'+t('hidden')+'</b>':'<b>'+v+'</b>'+(dl!==undefined?'<em class="'+(dl>=0?'up':'dn')+'">'+(dl>=0?'+':'')+dl+'% '+t('vs')+'</em>':''))+'</div>'}
function reward(c){return c.s*CPA[c.p]/100}
function stats(){var cs=clicks(),m=cs.length*19,iss=cs.filter(function(c){return st(c)===3}),app=cs.filter(function(c){return st(c)>=1}),k=m/cs.length;
  var ki=k*.22;return{cs:cs,clicks:m,apps:Math.round(app.length*k*.55),iss:Math.round(iss.length*ki),issList:iss,k:ki,rew:iss.reduce(function(a,c){return a+reward(c)},0)*ki}}
function vSum(){var s=stats(),cs=s.cs,site=get('qy-clicks-1',[]),nw=site.filter(function(c){return st(c)===0}).length,wait=cs.filter(function(c){return st(c)===1||st(c)===2}).length;
  var days=[];for(var i=29;i>=0;i--)days.push({v:0,site:false});cs.forEach(function(c){var j=29-Math.floor((now-c.at)/864e5);if(j>=0&&j<30){days[j].v+=1;if(!c.demo)days[j].site=true}});
  days.forEach(function(x,j){x.v=x.v*(.55+NZ[j]*.9)+(x.site?1:0)});var mx=Math.max.apply(null,days.map(function(x){return x.v}))||1;
  var by={};D.p.forEach(function(p){by[p.id]=0});s.issList.forEach(function(c){by[c.p]++});var top=D.p.slice().sort(function(a,b){return by[b.id]-by[a.id]}).slice(0,5),tm=by[top[0].id]||1;
  var f=[[t('f_view'),s.clicks*6],[t('f_calc'),Math.round(s.clicks*3.1)],[t('f_click'),s.clicks],[t('f_app'),s.apps],[t('f_iss'),s.iss]];
  var asks={};cs.forEach(function(c){var key=mln(c.s)+' · '+c.n+' '+t('mo');asks[key]=(asks[key]||0)+1});var ak=Object.keys(asks).sort(function(a,b){return asks[b]-asks[a]}).slice(0,6);
  return'<h1 class="pn-h">'+t('hello')+'</h1><div class="pn-kpis">'+kpi('k_reward',sum(s.rew),12,!owner(),true)+kpi('k_clicks',fmt(s.clicks),18)+kpi('k_apps',fmt(s.apps),9)+kpi('k_issued',fmt(s.iss),11)+kpi('k_conv',(s.iss/s.clicks*100).toFixed(1).replace('.',',')+'%')+'</div>'+
  '<div class="pn-crm"><a class="pn-c" href="#clicks" data-site="1"><b>'+nw+'</b><span>'+t('crm_new')+' · <em>'+t('crm_new2')+'</em></span></a><a class="pn-c" href="#clicks"><b>'+wait+'</b><span>'+t('crm_wait')+' · <em>'+t('crm_wait2')+'</em></span></a><a class="pn-c" href="#partners"><b>'+(S.req?0:1)+'</b><span>'+t('crm_req')+' · <em>'+t('crm_req2')+'</em></span></a></div>'+
  '<div class="pn-row"><section class="pn-card w2"><h3>'+t('chart')+'</h3><div class="pn-chart">'+days.map(function(x){return'<i class="'+(x.site?'site':'')+'" style="--h:'+Math.max(.04,x.v/mx).toFixed(3)+'"></i>'}).join('')+'</div><p class="pn-mu"><span class="dot"></span>'+t('chart_site')+'</p></section>'+
  '<section class="pn-card"><h3>'+t('funnel')+'</h3>'+f.map(function(x,i){return'<div class="pn-f"><span>'+x[0]+'</span><b>'+fmt(x[1])+'</b><i style="--w:'+(x[1]/f[0][1]).toFixed(3)+'"></i></div>'}).join('')+'</section></div>'+
  '<div class="pn-row"><section class="pn-card"><h3>'+t('top')+'</h3>'+top.map(function(p){return'<div class="pn-f"><span><img src="'+D.img+'/logo/'+p.logo+'" alt="" class="pn-lg">'+esc(p.bank)+'</span><b>'+Math.round(by[p.id]*s.k)+'</b><i style="--w:'+(by[p.id]/tm).toFixed(3)+'"></i></div>'}).join('')+'</section>'+
  '<section class="pn-card"><h3>'+t('ask')+'</h3>'+ak.map(function(a){return'<div class="pn-f"><span>'+a+'</span><b>'+asks[a]+'</b><i style="--w:'+(asks[a]/asks[ak[0]]).toFixed(3)+'"></i></div>'}).join('')+'</section></div>'}

function chip(c){var v=st(c);return'<span class="pn-st s'+v+'">'+t('st_'+v)+'</span>'}
function vClicks(){var cs=clicks().filter(function(c){if(onlySite&&c.demo)return false;if(!q)return true;return String(c.id).indexOf(q)>=0||byId[c.p].bank.toLowerCase().indexOf(q)>=0});
  var h='<h1 class="pn-h">'+t('tab_clicks')+'</h1><div class="pn-tool"><div class="pn-seg"><button type="button" data-os="0" aria-pressed="'+!onlySite+'">'+t('all')+'</button><button type="button" data-os="1" aria-pressed="'+onlySite+'">'+t('only_site')+'</button></div><button type="button" class="pb pb-g" id="csv">'+t('csv')+'</button></div><p class="pn-mu">'+t('st_hint')+'</p>';
  if(!cs.length)return h+'<p class="pn-empty">'+t('nothing')+'</p>';
  h+='<div class="pn-tw"><table class="pn-t"><thead><tr><th>'+t('c_no')+'</th><th>'+t('c_time')+'</th><th>'+t('c_bank')+'</th><th>'+t('c_sum')+'</th><th>'+t('c_term')+'</th><th>'+t('c_pay')+'</th><th>'+t('c_st')+'</th><th>'+t('c_src')+'</th></tr></thead><tbody>'+
  cs.slice(0,60).map(function(c){var p=byId[c.p];return'<tr data-id="'+c.id+'" class="'+(c.demo?'':'new')+(open===c.id?' on':'')+'" tabindex="0"><td><b>'+c.id+'</b></td><td>'+ago(c.at)+'</td><td><span class="pn-bk"><img src="'+D.img+'/logo/'+p.logo+'" alt="" class="pn-lg">'+esc(p.bank)+'</span></td><td>'+mln(c.s)+'</td><td>'+c.n+' '+t('mo')+'</td><td>'+sum(c.pay)+'</td><td>'+chip(c)+'</td><td>'+(c.demo?t('src_demo'):'<b class="pn-new">'+t('src_site')+'</b>')+'</td></tr>'+
    (open===c.id?'<tr class="pn-open"><td colspan="8"><div class="pn-acts">'+[0,1,2,3,4].map(function(v){return'<button type="button" class="pb '+(st(c)===v?'pb-a':'pb-g')+'" data-s="'+v+'">'+t('st_'+v)+'</button>'}).join('')+'</div><p class="pn-mu">'+t('pb')+': '+esc(c.net||'Qiyos')+' · sub_id='+c.id+'</p></td></tr>':'')}).join('')+'</tbody></table></div>';
  return h}
function vPartners(){var ps=partners(),o=ov(),list=ps.filter(function(p){return!q||p.bank.toLowerCase().indexOf(q)>=0});
  var h='<h1 class="pn-h">'+t('tab_partners')+'</h1><p class="pn-mu">'+t('p_hint')+'</p>';
  if(!S.req)h+='<div class="pn-card pn-reqc"><b>'+t('p_req')+'</b><span class="pn-tag">'+t('demo')+'</span><p class="pn-mu">'+t('p_req2')+'</p><button type="button" class="pb pb-a" id="req">'+t('p_req_b')+'</button></div>';
  h+=list.map(function(p){var x=o[p.id]||{},on=!p.off;return'<div class="pn-card pn-p'+(on?'':' off')+'" data-pid="'+p.id+'"><div class="pn-ph"><span class="pn-lgw"><img src="'+D.img+'/logo/'+p.logo+'" alt="" class="pn-lg"></span><span><b>'+esc(p.bank)+'</b><small>'+t('p_lic')+p.lic+' · '+p.lo+(p.hi!=null&&p.hi!==p.lo?'-'+p.hi:'')+'% · '+(p.max?mln(p.min||0)+'-'+mln(p.max):t('unk'))+' · '+p.tmin+'-'+p.tmax+' '+t('mo')+'</small></span>'+
    '<label class="pn-sw"><input type="checkbox" data-on '+(on?'checked':'')+'><i aria-hidden="true"></i><span>'+t('p_on')+'</span></label><label class="pn-sw"><input type="checkbox" data-rec '+(p.rec?'checked':'')+'><i aria-hidden="true"></i><span>'+t('p_rec')+'</span></label>'+
    '<span class="pn-ord"><button type="button" class="pb pb-g" data-mv="-1" aria-label="'+t('p_up')+'">↑</button><button type="button" class="pb pb-g" data-mv="1" aria-label="'+t('p_down')+'">↓</button></span><button type="button" class="pb pb-g" data-ed>'+t('p_edit')+'</button></div>'+
    (open===p.id?'<form class="pn-ed" data-form>'+[['lo','p_lo'],['hi','p_hi'],['min','p_min'],['max','p_max'],['tmin','p_tmin'],['tmax','p_tmax']].map(function(f){return'<label><span>'+t(f[1])+'</span><input name="'+f[0]+'" inputmode="decimal" value="'+esc(x[f[0]]!=null?x[f[0]]:p[f[0]]!=null?p[f[0]]:'')+'"></label>'}).join('')+
    '<label class="w"><span>'+t('p_ref')+'</span><input name="ref" value="'+esc(x.ref||'')+'" placeholder="'+esc(p.src)+'"></label><label class="pn-sw"><input type="checkbox" name="zero" '+(p.zero?'checked':'')+'><i aria-hidden="true"></i><span>'+t('p_zero')+'</span></label>'+
    '<p class="pn-mu w">'+(owner()?t('p_cpa')+': <b>'+String(CPA[p.id]).replace('.',',')+'%</b> · ':'')+'<a href="'+esc(p.src)+'" target="_blank" rel="noopener">'+t('p_src')+'</a></p><div class="pn-acts w"><button class="pb pb-a" type="submit">'+t('p_save')+'</button><button class="pb pb-g" type="button" data-rs>'+t('p_reset')+'</button></div></form>':'')+'</div>'}).join('');
  return h}
function vPay(){if(!owner())return'<h1 class="pn-h">'+t('tab_pay')+'</h1><p class="pn-card pn-lock">'+t('w_lock')+'</p>';
  var s=stats(),by={};D.p.forEach(function(p){by[p.id]={n:0,a:0,r:0}});s.issList.forEach(function(c){var b=by[c.p];b.n++;b.a+=c.s;b.r+=reward(c)});
  var tot=0;var rows=D.p.map(function(p){var b=by[p.id],r=b.r*s.k;tot+=r;return'<tr><td><span class="pn-bk"><img src="'+D.img+'/logo/'+p.logo+'" alt="" class="pn-lg">'+esc(p.bank)+'</span></td><td>'+Math.round(b.n*s.k)+'</td><td>'+mln(b.a*s.k)+'</td><td>'+String(CPA[p.id]).replace('.',',')+'%</td><td><b>'+sum(r)+'</b></td><td>'+sum(r*W[p.id]/1.6)+'</td><td>'+sum(r-r*W[p.id]/1.6)+'</td></tr>'}).join('');
  return'<h1 class="pn-h">'+t('tab_pay')+'</h1><div class="pn-kpis">'+kpi('k_reward',sum(tot),12,false,true)+kpi('k_issued',fmt(s.iss))+'</div><p class="pn-mu">'+t('w_hint')+'</p><div class="pn-tw"><table class="pn-t"><thead><tr><th>'+t('c_bank')+'</th><th>'+t('w_issued')+'</th><th>'+t('w_amount')+'</th><th>'+t('w_rate')+'</th><th>'+t('w_reward')+'</th><th>'+t('w_paid')+'</th><th>'+t('w_wait')+'</th></tr></thead><tbody>'+rows+'</tbody></table></div>'}
function vLog(){return'<h1 class="pn-h">'+t('tab_log')+'</h1>'+(S.log.length?'<div class="pn-tw"><table class="pn-t"><thead><tr><th>'+t('l_when')+'</th><th>'+t('l_who')+'</th><th>'+t('l_what')+'</th></tr></thead><tbody>'+S.log.map(function(x){return'<tr><td>'+ago(x.at)+'</td><td>'+t('role_'+x.who)+'</td><td>'+t(x.w)+(x.r?' · '+esc(x.r):'')+'</td></tr>'}).join('')+'</tbody></table></div>':'<p class="pn-card pn-empty">'+t('l_empty')+'</p>')}

function setOv(id,patch){var o=ov();o[id]=o[id]||{};for(var k in patch){if(patch[k]===null)delete o[id][k];else o[id][k]=patch[k]}put('qy-partners-1',o)}
function render(){if(!$('#pv'))shell();$$('.pn-rail a').forEach(function(x){x.toggleAttribute('aria-current',x.getAttribute('data-v')===view)});
  var v=$('#pv');v.innerHTML=view==='clicks'?vClicks():view==='partners'?vPartners():view==='pay'?vPay():view==='log'?vLog():vSum();
  $$('[data-site]',v).forEach(function(a){a.addEventListener('click',function(){onlySite=true})});
  $$('.pn-t tr[data-id]',v).forEach(function(r){var go=function(){var id=+r.getAttribute('data-id');open=open===id?null:id;render()};r.addEventListener('click',go);r.addEventListener('keydown',function(e){if(e.key==='Enter')go()})});
  $$('[data-s]',v).forEach(function(b){b.addEventListener('click',function(e){e.stopPropagation();S.st[open]=+b.getAttribute('data-s');log('l_st','№'+open+' · '+t('st_'+S.st[open]));render()})});
  $$('[data-os]',v).forEach(function(b){b.addEventListener('click',function(){onlySite=b.getAttribute('data-os')==='1';render()})});
  var csv=$('#csv',v);if(csv)csv.addEventListener('click',function(){var rows=[[t('c_no'),t('c_time'),t('c_bank'),t('c_sum'),t('c_term'),t('c_pay'),t('c_st')]].concat(clicks().map(function(c){return[c.id,ago(c.at),byId[c.p].bank,c.s,c.n,c.pay,t('st_'+st(c))]}));
    var b=new Blob(['﻿'+rows.map(function(r){return r.map(function(x){return'"'+String(x).replace(/"/g,'""')+'"'}).join(';')}).join('\n')],{type:'text/csv'}),a=d.createElement('a');a.href=URL.createObjectURL(b);a.download='qiyos-clicks.csv';a.click();log('l_csv')});
  var rq=$('#req',v);if(rq)rq.addEventListener('click',function(){S.req=1;log('l_req');toast(t('p_req_ok'));render()});
  $$('.pn-p',v).forEach(function(c){var id=c.getAttribute('data-pid');
    $('[data-on]',c).addEventListener('change',function(e){setOv(id,{off:e.target.checked?null:true});log('l_on',byId[id].bank);toast(t('saved'));render()});
    $('[data-rec]',c).addEventListener('change',function(e){setOv(id,{rec:e.target.checked?true:null});log('l_part',byId[id].bank+' · '+t('p_rec'));toast(t('saved'));render()});
    $('[data-ed]',c).addEventListener('click',function(){open=open===id?null:id;render()});
    $$('[data-mv]',c).forEach(function(b){b.addEventListener('click',function(){var ps=partners(),i=ps.findIndex(function(p){return p.id===id}),j=i+ +b.getAttribute('data-mv');if(j<0||j>=ps.length)return;var tmp=ps[i];ps[i]=ps[j];ps[j]=tmp;ps.forEach(function(p,k){setOv(p.id,{ord:k})});log('l_ord',byId[id].bank);render()})});
    var f=$('[data-form]',c);if(f){f.addEventListener('submit',function(e){e.preventDefault();var patch={};['lo','hi','min','max','tmin','tmax'].forEach(function(k){var val=f.elements[k].value.replace(/\s/g,'').replace(',','.');patch[k]=val===''||+val===byId[id][k]?null:+val});patch.ref=f.elements.ref.value.trim()||null;patch.zero=f.elements.zero.checked?true:null;setOv(id,patch);log('l_part',byId[id].bank);toast(t('saved'));open=null;render()});
      $('[data-rs]',f).addEventListener('click',function(){var o=ov();var keep={off:(o[id]||{}).off,rec:(o[id]||{}).rec,ord:(o[id]||{}).ord};o[id]={};for(var k in keep)if(keep[k]!=null)o[id][k]=keep[k];put('qy-partners-1',o);log('l_part',byId[id].bank+' · '+t('p_reset'));toast(t('saved'));open=null;render()})}})}
shell();render();
})();
