/* Panel CARGO PRO GROUP po etalonu Greenwell: svodka (zayavki k proshlomu
   periodu, grafik, voronka, napravleniya, chto zastryalo), zayavki (zayavka s
   sayta pervoy strokoy), gruzy (status menyaetsya i viden klientu na sayte),
   klienty, istoriya, roli: menedzher ne vidit marzhu i vyruchku. Demo-tsifry
   iz odnogo zerna. Sostoyanie: cp-panel-1 (pishet panel), cp-req-1 (pishet
   sayt). Podpisi tolko iz slovarya. */
(function(){
var d=document,$=function(s,r){return(r||d).querySelector(s)},$$=function(s,r){return[].slice.call((r||d).querySelectorAll(s))};
var D=JSON.parse($('#pn-data').textContent),U=D.ui;
function t(k){return U[k]}
function get(k,def){try{var v=localStorage.getItem(k);return v?JSON.parse(v):def}catch(e){return def}}
function put(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function usd(n){return fmt(n)+' $'}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var L={};D.lanes.forEach(function(x){L[x.id]=x});
var S=get('cp-panel-1',{}),view=location.hash.slice(1)||'sum',open=null;
S.st=S.st||{};S.note=S.note||{};S.log=S.log||[];S.role=S.role||'owner';
function save(){put('cp-panel-1',S)}
function log(what,ref){S.log.unshift({at:Date.now(),who:S.role,w:what,r:ref||''});S.log=S.log.slice(0,80);save()}

/* Demo-zerno: vse tsifry paneli iz nego. */
var zr=20261031;function rnd(){zr=(zr*16807)%2147483647;return zr/2147483647}
var TN=['[[t:0]]','[[t:1]]','[[t:2]]','[[t:3]]','[[t:4]]'];
var CO=[];for(var i=0;i<10;i++)CO.push({id:i,n:t('co')+' «'+TN[i%TN.length]+(i>=TN.length?' '+(i-TN.length+2):'')+'»'});
var MODES=['air','auto','rail','sea'],ORD=['cn','cn','cn','tr','tr','ae','ae','in','eu'];
var now=Date.now(),demo=[];
var FIX={'CPG-24117':['cn','air',4,0,420],'CPG-24109':['tr','auto',3,2,1800],'CPG-24095':['ae','sea',5,1,0]};
for(var k=0;k<72;k++){var dir=ORD[Math.floor(rnd()*ORD.length)],ln=L[dir],ms=MODES.filter(function(m){return ln[m]}),m=ms[Math.floor(rnd()*rnd()*ms.length)],kg=Math.round(50+rnd()*rnd()*2400);
  var tot=ln[m].kg?kg*ln[m].kg+45:ln[m].c40+45,s=k<6?Math.floor(rnd()*2):k<30?2+Math.floor(rnd()*3):rnd()>.08?5:4;
  demo.push({id:'CPG-'+(24116-k),at:now-Math.floor(k*9+rnd()*8)*36e5,co:CO[Math.floor(rnd()*CO.length)].n,dir:dir,m:m,kg:ln[m].kg?kg:0,ct:ln[m].kg?'':'1x40',tot:Math.round(tot),s0:s,demo:1,stuck:s===4&&rnd()>.5?Math.ceil(2+rnd()*4):0})}
Object.keys(FIX).forEach(function(id){var f=FIX[id],o=demo.filter(function(x){return x.id===id})[0]||{};o.id=id;o.dir=f[0];o.m=f[1];o.s0=f[2];o.co=CO[f[3]].n;o.kg=f[4];o.ct=f[4]?'':'1x40';o.demo=1;o.at=o.at||now-864e5;o.tot=o.tot||Math.round(f[4]?f[4]*L[f[0]][f[1]].kg+45:L[f[0]][f[1]].c40+45);if(demo.indexOf(o)<0)demo.push(o)});
function site(){return get('cp-req-1',[]).map(function(r){return{id:r.id,at:r.at,co:r.co||r.n,who:r.n,ph:r.ph,dir:r.dir,m:r.m,kg:r.cw,ct:r.ct,tot:r.tot,txt:r.txt,s0:0}})}
function all(){return site().concat(demo)}
function st(o){return S.st[o.id]!==undefined?S.st[o.id]:o.s0}
var owner=function(){return S.role==='owner'};
var MG=.18;

function shell(){var tabs=['sum','reqs','cargo','clients','log'];
  $('#app').innerHTML='<header class="pn-top"><div class="pn-brand"><img src="'+D.logo+'" alt="CARGO PRO GROUP" width="670" height="249"><span>'+t('title')+' · '+t('demo')+'</span></div>'+
  '<label class="pn-role"><span>'+t('role')+'</span><select id="role"><option value="owner">'+t('role_owner')+'</option><option value="manager">'+t('role_manager')+'</option></select></label><a class="btn btn-g btn-s" href="'+D.home+'">'+t('home')+'</a><a class="btn btn-g btn-s pn-disp" href="'+D.disp+'">'+t('disp')+'</a><a class="btn btn-a btn-s" href="'+D.site+'">'+t('site')+'</a></header>'+
  '<nav class="pn-tabs">'+tabs.map(function(x){return'<a href="#'+x+'" data-v="'+x+'"'+(x===view?' aria-current="page"':'')+'>'+t('tab_'+x)+'</a>'}).join('')+'</nav><main class="pn-main" id="pv"></main>';
  $('#role').value=S.role;$('#role').addEventListener('change',function(e){S.role=e.target.value;log('l_role');render()});
  $$('.pn-tabs a').forEach(function(a){a.addEventListener('click',function(){view=a.getAttribute('data-v');open=null;$$('.pn-tabs a').forEach(function(x){x.toggleAttribute('aria-current',x===a)})})})}
addEventListener('hashchange',function(){view=location.hash.slice(1)||'sum';open=null;shell();render()});
addEventListener('storage',function(e){if(e.key==='cp-req-1')render()});

function kpi(k,v,dl,hide){return'<div class="pn-k"><small>'+t(k)+'</small>'+(hide?'<b class="pn-lock">'+t('hidden')+'</b>':'<b>'+v+'</b>'+(dl!==undefined?'<em class="'+(dl>=0?'up':'dn')+'">'+(dl>=0?'+':'')+dl+'% '+t('vs')+'</em>':''))+'</div>'}
function route(o){return esc(L[o.dir].n)+' · '+t('m_'+o.m)}
function vSum(){var a=all(),m30=a.filter(function(o){return now-o.at<30*864e5}),go=a.filter(function(o){var s=st(o);return s>=2&&s<=4}),done=a.filter(function(o){return st(o)===5});
  var rev=done.reduce(function(s,o){return s+o.tot},0)*4.2;
  var days=[];for(var i=29;i>=0;i--)days.push({v:0,site:false});a.forEach(function(o){var k=29-Math.floor((now-o.at)/864e5);if(k>=0&&k<30){days[k].v++;if(!o.demo)days[k].site=true}});
  var mx=Math.max.apply(null,days.map(function(x){return x.v}))||1,N=m30.length*6;
  var f=[[t('f_req'),N],[t('f_calc'),Math.round(N*.74)],[t('f_deal'),Math.round(N*.41)],[t('f_go'),Math.round(N*.36)],[t('f_done'),Math.round(N*.33)]];
  var by={};a.forEach(function(o){by[o.dir]=(by[o.dir]||0)+1});var bym=Math.max.apply(null,Object.keys(by).map(function(k){return by[k]}));
  var stuck=a.filter(function(o){return o.stuck&&st(o)===4});
  return'<div class="pn-kpis">'+kpi('k_req',fmt(N),12)+kpi('k_go',go.length)+kpi('k_done',fmt(done.length*4))+kpi('k_avg',usd(rev/(done.length*4||1)))+kpi('k_rev',usd(rev),8,!owner())+kpi('k_mg',usd(rev*MG),5,!owner())+'</div>'+
  '<div class="pn-row"><section class="pn-card w2"><h3>'+t('chart')+'</h3><div class="pn-chart">'+days.map(function(x){return'<i class="'+(x.site?'site':'')+'" style="transform:scaleY('+Math.max(.03,x.v/mx).toFixed(3)+')"></i>'}).join('')+'</div><p class="pn-mu"><span class="dot"></span>'+t('chart_site')+'</p></section>'+
  '<section class="pn-card"><h3>'+t('funnel')+'</h3>'+f.map(function(x){return'<div class="pn-f"><span>'+x[0]+'</span><b>'+fmt(x[1])+'</b><i style="transform:scaleX('+(x[1]/f[0][1]).toFixed(3)+')"></i></div>'}).join('')+'</section></div>'+
  '<div class="pn-row eq"><section class="pn-card"><h3>'+t('dirs')+'</h3>'+Object.keys(by).sort(function(x,y){return by[y]-by[x]}).map(function(k){return'<div class="pn-f"><span>'+esc(L[k].n)+'</span><b>'+by[k]+'</b><i style="transform:scaleX('+(by[k]/bym).toFixed(3)+')"></i></div>'}).join('')+'</section>'+
  '<section class="pn-card"><h3>'+t('stuck')+'</h3>'+(stuck.length?stuck.map(function(o){return'<div class="pn-li"><span>'+o.id+'</span><span>'+esc(o.co)+'<br><small class="pn-mu">'+route(o)+'</small></span><b class="warn">'+o.stuck+' '+t('days')+'</b></div>'}).join(''):'<p class="pn-mu">'+t('stuck_none')+'</p>')+'</section></div>'}
function when(ts){var dd=Math.floor((now-ts)/864e5);return dd<1?t('today')+' '+new Date(ts).toTimeString().slice(0,5):dd+' '+t('ago_d')}
function chip(o){var s=st(o);return'<span class="pn-st s'+s+'">'+t('st_'+s)+'</span>'}
function table(rows){return'<div class="pn-card"><table class="pn-t"><thead><tr><th>'+t('c_no')+'</th><th>'+t('c_when')+'</th><th>'+t('c_client')+'</th><th>'+t('c_route')+'</th><th>'+t('c_load')+'</th>'+(owner()?'<th>'+t('c_sum')+'</th>':'')+'<th>'+t('c_st')+'</th></tr></thead><tbody>'+
  rows.slice(0,40).map(function(o){return'<tr data-o="'+o.id+'"'+(o.demo?'':' class="new"')+'><td>'+o.id+(o.demo?'':' <span class="pn-new">'+t('new')+'</span>')+'</td><td>'+when(o.at)+'</td><td>'+esc(o.co)+'</td><td>'+route(o)+'</td><td>'+(o.kg?fmt(o.kg)+' '+t('kg'):esc(o.ct))+'</td>'+(owner()?'<td>'+usd(o.tot)+'</td>':'')+'<td>'+chip(o)+'</td></tr>'}).join('')+'</tbody></table></div>'}
function vReqs(){if(open)return vOne(open);var rows=all().filter(function(o){return st(o)<=1});return(site().length?'':'<p class="pn-hint">'+t('r_none')+'</p>')+table(rows)}
function vCargo(){if(open)return vOne(open);return'<p class="pn-hint">'+t('g_hint')+'</p>'+table(all().filter(function(o){return st(o)>=2}))}
function vOne(id){var o=all().filter(function(x){return x.id===id})[0];if(!o){open=null;return vReqs()}var s=st(o);
  return'<button type="button" class="btn btn-g btn-s" id="oback">'+t('back')+'</button><div class="pn-row"><section class="pn-card w2"><h3>'+o.id+(o.demo?'':' <span class="pn-new">'+t('new')+'</span>')+'</h3>'+
  '<p class="pn-mu">'+t('o_hint')+'</p><div class="pn-steps">'+[0,1,2,3,4,5].map(function(k){return'<button type="button" data-s="'+k+'" aria-pressed="'+(k===s)+'" class="'+(k<s?'done':'')+'">'+t('st_'+k)+'</button>'}).join('')+'</div>'+
  '<p><span class="pn-mu">'+t('c_route')+':</span> '+route(o)+' → '+t('tas')+'</p><p><span class="pn-mu">'+t('c_load')+':</span> '+(o.kg?fmt(o.kg)+' '+t('kg'):esc(o.ct))+'</p>'+(o.txt?'<pre class="pn-pre">'+esc(o.txt)+'</pre>':'')+
  (owner()?'<p><span class="pn-mu">'+t('c_sum')+':</span> '+usd(o.tot)+' · <span class="pn-mu">'+t('k_mg')+':</span> '+usd(o.tot*MG)+'</p>':'<p class="pn-mu">'+t('c_sum')+': '+t('hidden')+'</p>')+'</section>'+
  '<section class="pn-card"><h3>'+esc(o.co)+'</h3>'+(o.who?'<p><span class="pn-mu">'+t('who')+':</span> '+esc(o.who)+'</p><p><span class="pn-mu">'+t('phone')+':</span> '+esc(o.ph)+'</p>':'<p class="pn-mu">'+t('demo')+'</p>')+
  '<label class="fld"><span>'+t('note')+'</span><input id="onote" value="'+esc(S.note[o.id]||'')+'"></label><button type="button" class="btn btn-g btn-s" id="osave" style="margin-top:8px">'+t('save')+'</button></section></div>'}
function vClients(){var by={};all().forEach(function(o){var c=by[o.co]=by[o.co]||{n:0,sum:0,last:0};c.n++;c.sum+=o.tot;c.last=Math.max(c.last,o.at)});
  return'<p class="pn-hint">'+t('cl_hint')+'</p><div class="pn-card"><table class="pn-t"><thead><tr><th>'+t('c_client')+'</th><th>'+t('cl_n')+'</th><th>'+t('cl_last')+'</th>'+(owner()?'<th>'+t('cl_sum')+'</th>':'')+'</tr></thead><tbody>'+
  Object.keys(by).sort(function(a,b){return by[b].n-by[a].n}).map(function(k){var c=by[k];return'<tr><td>'+esc(k)+'</td><td>'+c.n+'</td><td>'+when(c.last)+'</td>'+(owner()?'<td>'+usd(c.sum)+'</td>':'')+'</tr>'}).join('')+'</tbody></table></div>'}
function vLog(){var who=function(r){return t(r==='manager'?'role_manager':'role_owner')};return'<div class="pn-card">'+(S.log.length?S.log.map(function(x){return'<div class="pn-log"><time>'+new Date(x.at).toLocaleString()+'</time><b>'+who(x.who)+'</b><span>'+t(x.w)+(x.r?' '+esc(x.r):'')+'</span></div>'}).join(''):'<p class="pn-mu">'+t('l_none')+'</p>')+'</div>'}
var toastT;function toast(m){var e=$('#pt');if(!e){e=d.createElement('div');e.id='pt';e.className='toast';d.body.appendChild(e)}e.textContent=m;e.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){e.classList.remove('on')},2200)}
function render(){var v=$('#pv');if(!v)return;now=Date.now();
  v.innerHTML=view==='reqs'?vReqs():view==='cargo'?vCargo():view==='clients'?vClients():view==='log'?vLog():vSum();
  $$('[data-o]',v).forEach(function(r){r.addEventListener('click',function(){open=r.getAttribute('data-o');render()})});
  var ob=$('#oback');if(ob)ob.addEventListener('click',function(){open=null;render()});
  $$('[data-s]',v).forEach(function(b){b.addEventListener('click',function(){S.st[open]=+b.getAttribute('data-s');log('l_st',open+' · '+t('st_'+S.st[open]));render()})});
  var os=$('#osave');if(os)os.addEventListener('click',function(){S.note[open]=$('#onote').value;log('l_note',open);toast(t('saved'));render()})}
shell();render();
})();
