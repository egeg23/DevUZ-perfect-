/* Panel Sunday: login (phone or Telegram, demo code 1234), Glassy Dashboard
   V7 + CRM over their evening hall. Functions follow Greenwell and Cargo Pro:
   a request from the site is the first row, its status shows on the site in
   "my request", busy dates set here close at once in the site calendar,
   guest answers to the invitation arrive here, roles (manager does not see
   budgets), history, demo numbers from one seed. Labels only from the
   dictionary (ui.mjs), no model calls. Link with the site is browser
   storage: sn-req-1, sn-hold-1, sn-rsvp-1 from the site, sn-dates-1 here. */
(function(){
var d=document,w=window,$=function(s,r){return(r||d).querySelector(s)},$$=function(s,r){return[].slice.call((r||d).querySelectorAll(s))};
var P=JSON.parse($('#pn-data').textContent),U=P.ui;
function t(k){return U[k]}
var RM=w.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function get(k,def){try{var v=localStorage.getItem(k);return v?JSON.parse(v):def}catch(e){return def}}
function put(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function usd(n){return fmt(n)+' $'}
function hm(ts){var x=new Date(ts);return(x.getHours()<10?'0':'')+x.getHours()+':'+(x.getMinutes()<10?'0':'')+x.getMinutes()}
function dm(ts){var x=new Date(ts);return x.getDate()+'.'+(x.getMonth()<9?'0':'')+(x.getMonth()+1)}
function iso(dt){return dt.getFullYear()+'-'+(dt.getMonth()<9?'0':'')+(dt.getMonth()+1)+'-'+(dt.getDate()<10?'0':'')+dt.getDate()}
var toastT=0;function toast(m){var e=$('#toast');e.textContent=m;e.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){e.classList.remove('on')},2400)}
var I=function(p){return'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+p+'</svg>'};
var IC={home:I('<path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z"/>'),inbox:I('<path d="M3 13h5l2 3h4l2-3h5"/><path d="M5 5h14l2 8v6H3v-6Z"/>'),cal:I('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  users:I('<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M16 4a3 3 0 0 1 0 6M21 20a6 6 0 0 0-4-5.6"/>'),log:I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),arrow:I('<path d="M7 17 17 7M9 7h8v8"/>'),bell:I('<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4Z"/><path d="M10 20a2 2 0 0 0 4 0"/>'),
  plus:I('<path d="M12 5v14M5 12h14"/>'),search:I('<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>'),tg:I('<path d="M21 4 3 11l6 2 2 6 3-4 5 4Z"/><path d="m9 13 8-6"/>'),phone:I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>'),
  down:I('<path d="M12 4v12M6 10l6 6 6-6M4 20h16"/>'),back:I('<path d="M19 12H5M11 6l-6 6 6 6"/>'),next:I('<path d="M5 12h14M13 6l6 6-6 6"/>'),coin:I('<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4"/>'),heart:I('<path d="M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9Z"/>')};
var MARK='<svg viewBox="0 0 400 400" aria-hidden="true" focusable="false"><use href="#sn-g"/></svg>';
var KC={wedding:'#ff8fb0',fest:'#ffc58a',party:'#c9a7ff',corp:'#a9c1ff',quiz:'#7fe0ad',date:'#ffffff',call:'#9aa3ad'};
var KINDS=['wedding','fest','party','corp','quiz','date','call'];

/* Demo from one seed: the same numbers on every screen. */
var z=20261109;function rnd(){z=(z*16807)%2147483647;return z/2147483647}
function pick(a){return a[Math.floor(rnd()*a.length)]}
var DAY=864e5,T0=new Date();T0.setHours(0,0,0,0);T0=+T0;
var days=[];for(var i=13;i>=0;i--)days.push({d:T0-i*DAY,n:Math.round(2+rnd()*5+(i%7<2?2:0))});
var demo=[];for(i=0;i<14;i++){var k=i===1?'corp':i===4?'quiz':i===6?'date':i===9?'corp':i===10||i===11?'wedding':pick(['wedding','wedding','fest','party','call']),g=k==='party'?20+Math.floor(rnd()*30):k==='call'||k==='date'?0:60+Math.floor(rnd()*240);
  var ev=new Date(T0+(20+Math.floor(rnd()*200))*DAY);
  demo.push({id:4001+i,at:T0-Math.floor(i/2)*DAY+(10+i%8)*3600e3,kind:k,name:k==='corp'?P.corp[i===1?0:1]:pick(P.names),ph:'+998 9'+Math.floor(rnd()*9)+' *** ** '+(10+Math.floor(rnd()*89)),
    text:g?g+' '+t('guests'):k==='quiz'?t('ex_quiz'):'',date:k==='call'?'':iso(ev),sum:g?Math.round((g*28+2500)*1.1/50)*50:0,st:i<4?0:i<7?1:i<10?2:i<12?3:4,demo:1})}
var S=get('sn-pn-1',{st:{},role:'own'});
function rows(){var mine=get('sn-req-1',[]).map(function(x){x.mine=1;return x});return mine.concat(demo.map(function(x){var o=JSON.parse(JSON.stringify(x));if(S.st[o.id]!=null)o.st=S.st[o.id];return o}))}
function setSt(id,st){var l=get('sn-req-1',[]),hit=l.filter(function(x){return x.id===id})[0];if(hit){hit.st=st;put('sn-req-1',l)}else{S.st[id]=st;put('sn-pn-1',S)}}
function log(what){var l=get('sn-log-1',[]);l.unshift({at:Date.now(),who:S.role,what:what});put('sn-log-1',l.slice(0,80))}
/* The same demo-busy rule as on the site: one calendar on both sides. */
function demoBusy(dt){var g=dt.getDate(),m=dt.getMonth(),wd=dt.getDay();return wd===6?(g+m)%3!==1:wd===5||wd===0?(g*7+m)%4===0:(g*3+m)%11===0}
function dayState(k,dt){var D=get('sn-dates-1',{}),h=get('sn-hold-1',[]);if(D[k])return D[k]==='busy'?'bz':'fr';if(h.indexOf(k)>=0)return'hd';return demoBusy(dt)?'bz':'fr'}
var demoGuests=[{name:P.names[0],yes:1,c:2,diet:''},{name:P.names[3],yes:1,c:4,diet:t('ex_diet')},{name:P.names[5],yes:0,c:1,diet:''},{name:P.names[6],yes:1,c:3,diet:''}];
function guests(){return get('sn-rsvp-1',[]).map(function(x){x.mine=1;return x}).concat(demoGuests)}

/* ── Login: phone or Telegram, then a code ─────────────────────── */
var app=$('#app');
function login(){app.innerHTML='<main class="lg-wrap"><div class="lg glass" id="lg">'+
  '<div class="lg-f lg-a"><span class="lg-mark">'+MARK+'</span><h1>'+t('in_title')+'</h1><p class="mu">'+t('in_sub')+'</p>'+
  '<label class="fl" for="lg-ph">'+t('phone')+'</label><input id="lg-ph" type="tel" inputmode="tel" autocomplete="tel" value="+998 90 ">'+
  '<button type="button" class="pb pb-a" id="lg-go">'+IC.phone+'<span>'+t('get_code')+'</span></button></div>'+
  '<div class="lg-f lg-b"><span class="lg-mark">'+MARK+'</span><h1>'+t('in_tg')+'</h1><p class="mu">'+t('in_tg_sub')+'</p>'+
  '<button type="button" class="pb pb-a" id="lg-tg">'+IC.tg+'<span>'+t('open_tg')+'</span></button></div>'+
  '<div class="lg-pane"><div class="lg-pi lg-pa"><b>'+t('pane_a')+'</b><p>'+t('pane_a_sub')+'</p><button type="button" class="pb pb-o" data-sw="b">'+t('sw_tg')+'</button></div>'+
  '<div class="lg-pi lg-pb"><b>'+t('pane_b')+'</b><p>'+t('pane_b_sub')+'</p><button type="button" class="pb pb-o" data-sw="a">'+t('sw_ph')+'</button></div></div>'+
  '</div><a class="lg-back" href="'+P.home+'">'+IC.back+'<span>'+t('back')+'</span></a></main>';
  var lg=$('#lg');
  $$('[data-sw]').forEach(function(b){b.addEventListener('click',function(){lg.classList.toggle('swp',b.getAttribute('data-sw')==='b');setTimeout(function(){var f=$(lg.classList.contains('swp')?'#lg-tg':'#lg-ph');if(f)f.focus({preventScroll:true})},RM?0:620)})});
  $('#lg-go').addEventListener('click',function(){otp('sms')});$('#lg-tg').addEventListener('click',function(){otp('tg')})}

function otp(via){app.innerHTML='<main class="lg-wrap"><div class="otp-card glass"><span class="lock" id="lock"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor"/><path class="shk" d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2"/></svg></span>'+
  '<h1>'+t('otp_title')+'</h1><p class="mu">'+(via==='tg'?t('otp_tg'):t('otp_sms'))+'</p>'+
  '<label class="otp-l" for="otp">'+t('otp_label')+'</label><div class="otp" id="otpb"><input id="otp" inputmode="numeric" autocomplete="one-time-code" maxlength="4" pattern="[0-9]*"><i style="--i:0"></i><i style="--i:1"></i><i style="--i:2"></i><i style="--i:3"></i></div>'+
  '<p class="otp-h">'+t('otp_demo')+' <b>1234</b></p><p class="otp-m" id="otpm" aria-live="polite"></p>'+
  '<p class="mu otp-r" id="otpr"></p><button type="button" class="pb pb-a" id="otpgo" disabled>'+t('continue')+'</button></div></main>';
  var box=$('#otpb'),inp=$('#otp'),cells=$$('i',box),left=59;inp.focus();
  (function tick(){var r=$('#otpr');if(!r)return;r.textContent=left>0?t('resend')+' 0:'+(left<10?'0':'')+left:t('resend_now');if(left-->0)setTimeout(tick,1000)})();
  inp.addEventListener('input',function(){inp.value=inp.value.replace(/\D/g,'').slice(0,4);
    cells.forEach(function(c,k){c.textContent=inp.value[k]||'';c.classList.toggle('on',k===inp.value.length)});box.classList.remove('ok','bad');$('#otpm').textContent='';
    if(inp.value.length<4)return;void box.offsetWidth;var ok=inp.value==='1234';box.classList.add(ok?'ok':'bad');
    if(ok){$('#lock').classList.add('open');$('#otpm').textContent=t('otp_ok');$('#otpgo').disabled=false;setTimeout(roles,RM?200:900)}
    else{$('#otpm').textContent=t('otp_bad');setTimeout(function(){inp.value='';inp.dispatchEvent(new Event('input'))},450)}});
  $('#otpgo').addEventListener('click',roles)}

function roles(){if(!$('#otpb'))return;app.innerHTML='<main class="lg-wrap"><div class="otp-card glass"><span class="lg-mark">'+MARK+'</span><h1>'+t('as_title')+'</h1><p class="mu">'+t('as_sub')+'</p><div class="as">'+
  '<button type="button" class="as-b" data-r="own"><b>'+t('r_own')+'</b><span>'+t('r_own_sub')+'</span></button><button type="button" class="as-b" data-r="mgr"><b>'+t('r_mgr')+'</b><span>'+t('r_mgr_sub')+'</span></button></div></div></main>';
  $$('[data-r]').forEach(function(b){b.addEventListener('click',function(){S.role=b.getAttribute('data-r');S.in=1;put('sn-pn-1',S);log(t('log_in'));shell()})})}

/* ── Shell: rail, top bar, sections ─────────────────────────────── */
var TABS=[['sum','home'],['req','inbox'],['cal','cal'],['gst','users'],['log','log']],cur='sum',RF='all',CO=0;
function counts(){var r=rows();return{req:r.filter(function(x){return x.st===0}).length,gst:get('sn-rsvp-1',[]).length}}
function shell(){var own=S.role==='own';
  app.innerHTML='<div class="pn-sh"><nav class="rail glass" aria-label="'+t('nav')+'"><a class="rail-m" href="'+P.home+'" aria-label="Sunday">S</a>'+TABS.map(function(x){return'<button type="button" data-tab="'+x[0]+'" aria-label="'+t('tab_'+x[0])+'"><span class="ri">'+IC[x[1]]+'<b class="bd" data-bd="'+x[0]+'"></b></span><span class="rl">'+t('tab_'+x[0])+'</span></button>'}).join('')+
    '<a class="rail-x" href="'+P.site+'" aria-label="'+t('to_site')+'">'+IC.back+'<span class="rl">'+t('to_site')+'</span></a></nav>'+
    '<div class="pn-main"><header class="pn-top glass"><span class="ws"><i>S</i><span><b>Sunday Event Agency</b><small>'+esc(P.addr)+'</small></span></span>'+
    '<label class="psrch">'+IC.search+'<span class="vh">'+t('search')+'</span><input id="q" type="search" placeholder="'+t('search_ph')+'" autocomplete="off"><kbd>/</kbd><span class="pres" id="qres" hidden></span></label>'+
    '<button type="button" class="pb pb-a pb-s" id="newb">'+IC.plus+'<span>'+t('new_req')+'</span></button>'+
    '<button type="button" class="ib" id="bell" aria-label="'+t('bell')+'">'+IC.bell+'<i class="rd" id="bell-d"></i></button>'+
    '<button type="button" class="av" id="role" aria-label="'+t('role')+'"><b>'+(own?'O':'M')+'</b><span>'+(own?t('r_own'):t('r_mgr'))+'</span></button></header>'+
    '<div class="demo">'+t('demo_line')+'</div><div id="view"></div></div></div>';
  $$('[data-tab]').forEach(function(b){b.addEventListener('click',function(){go(b.getAttribute('data-tab'))})});
  $('#role').addEventListener('click',function(){S.role=S.role==='own'?'mgr':'own';put('sn-pn-1',S);log(t('log_role')+': '+(S.role==='own'?t('r_own'):t('r_mgr')));shell();toast(t('role_now')+': '+(S.role==='own'?t('r_own'):t('r_mgr')))});
  $('#newb').addEventListener('click',newReq);$('#bell').addEventListener('click',function(){go('req')});
  var q=$('#q');q.addEventListener('input',function(){search(q.value)});d.addEventListener('keydown',function(e){if(e.key==='/'&&d.activeElement!==q&&!/input|textarea/i.test((d.activeElement||{}).tagName||'')){e.preventDefault();q.focus()}});
  var h=(location.hash||'').slice(1);go(TABS.some(function(x){return x[0]===h})?h:cur)}
function badges(){var c=counts();$$('[data-bd]').forEach(function(b){var n=c[b.getAttribute('data-bd')]||0;b.textContent=n||'';b.hidden=!n});var bd=$('#bell-d');if(bd)bd.hidden=!c.req}
function go(tab){cur=tab;$$('[data-tab]').forEach(function(b){b.setAttribute('aria-current',String(b.getAttribute('data-tab')===tab))});
  try{history.replaceState(null,'','#'+tab)}catch(e){}var v=$('#view');v.innerHTML=VIEW[tab]();v.classList.remove('in');void v.offsetWidth;v.classList.add('in');badges();bind(tab)}

/* Search over demo data: requests and guests. No AI model. */
function search(q){var r=$('#qres');q=q.trim().toLowerCase();if(q.length<2){r.hidden=true;return}
  var out=[];rows().forEach(function(x){if((x.name+' '+x.id+' '+(x.text||'')).toLowerCase().indexOf(q)>=0)out.push(['req','#'+x.id+' · '+(x.name||t('no_name'))+' · '+t('k_'+x.kind)])});
  guests().forEach(function(g){if(g.name.toLowerCase().indexOf(q)>=0)out.push(['gst',g.name+' · '+(g.yes?t('g_yes'):t('g_no'))])});
  r.innerHTML=out.slice(0,8).map(function(o){return'<button type="button" data-go="'+o[0]+'">'+esc(o[1])+'</button>'}).join('')||'<span class="mu">'+t('nothing')+'</span>';r.hidden=false;
  $$('[data-go]',r).forEach(function(b){b.addEventListener('click',function(){r.hidden=true;$('#q').value='';go(b.getAttribute('data-go'))})})}

var ST=['st_new','st_meet','st_sent','st_deal','st_no'];
function pill(st){return'<span class="pill b'+(st===0?0:st===3?1:st===4?3:st===2?2:'')+'">'+t(ST[st])+'</span>'}
function kd(k){return'<span class="kd" style="--c:'+KC[k]+'"><i></i>'+t('k_'+k)+'</span>'}
function dot(name,kind,lab){return'<button type="button" class="dot-btn" data-dl="'+kind+'" data-name="'+name+'"><span class="dot-face"></span><span class="dot-w">'+IC.down+'<span class="dot-l">'+lab+'</span></span><svg class="dot-ring" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21"/></svg><span class="dot-water"><i></i></span></button>'}
function money(x){return S.role==='own'?(x.sum?usd(x.sum):''):(x.sum?t('hidden'):'')}

function reqTable(list){return'<div class="tbl glass"><table><thead><tr><th>'+t('no')+'</th><th>'+t('what')+'</th><th>'+t('client')+'</th><th>'+t('status')+'</th><th></th></tr></thead><tbody>'+list.map(function(x){
  return'<tr class="'+(x.st===0?'new':'')+'"><td>#'+x.id+'<small>'+dm(x.at)+' '+hm(x.at)+'</small>'+(x.mine?'<small>'+t('from_site')+'</small>':'')+'</td><td>'+kd(x.kind)+(x.text?'<small>'+esc(x.text)+'</small>':'')+(x.date?'<small>'+t('ev_date')+': '+esc(x.date.split('-').reverse().join('.'))+'</small>':'')+(money(x)?'<small>'+t('budget')+': '+money(x)+'</small>':'')+'</td><td>'+esc(x.name||t('no_name'))+'<small>'+esc(x.ph||'')+'</small></td><td>'+pill(x.st)+'</td>'+
    '<td><div class="act">'+(x.st<1?'<button type="button" class="pb pb-a pb-s" data-s="1" data-id="'+x.id+'">'+t('do_meet')+'</button>':'')+(x.st===1?'<button type="button" class="pb pb-s" data-s="2" data-id="'+x.id+'">'+t('do_sent')+'</button>':'')+(x.st>0&&x.st<3?'<button type="button" class="pb pb-a pb-s" data-s="3" data-id="'+x.id+'">'+t('do_deal')+'</button>':'')+(x.st<3?'<button type="button" class="pb pb-g pb-s" data-s="4" data-id="'+x.id+'">'+t('do_no')+'</button>':'')+'</div></td></tr>'}).join('')+'</tbody></table></div>'}

var VIEW={
  sum:function(){var own=S.role==='own',r=rows(),c=counts(),now=Date.now(),w1=r.filter(function(x){return x.at>now-7*DAY}).length+days.slice(7).reduce(function(a,x){return a+x.n},0),w0=days.slice(0,7).reduce(function(a,x){return a+x.n},0);
    var deals=r.filter(function(x){return x.st===3}),ds=deals.reduce(function(a,x){return a+(x.sum||0)},0),pipe=r.filter(function(x){return x.st>0&&x.st<3}).reduce(function(a,x){return a+(x.sum||0)},0);
    var m0=new Date(T0),busyN=0;for(var g=1;g<=31;g++){var dt=new Date(m0.getFullYear(),m0.getMonth()+1,g);if(dt.getMonth()!==(m0.getMonth()+1)%12)break;if(dayState(iso(dt),dt)!=='fr')busyN++}
    function ch(a,b){var p=Math.round((a-b)/b*100);return'<span class="chg '+(p>=0?'up':'dn')+'">'+(p>=0?'+':'')+p+'% '+t('vs_prev')+'</span>'}
    var max=Math.max.apply(null,days.map(function(x){return x.n})),kc={};r.forEach(function(x){kc[x.kind]=(kc[x.kind]||0)+1});
    var gs=guests(),gy=gs.filter(function(x){return x.yes}).reduce(function(a,x){return a+x.c},0);
    return'<div class="hello"><div><h1>'+t('hello')+'</h1><p class="mu">'+t('hello_sub')+'</p></div><div class="pills"><span class="pill">'+t('period_7')+'</span>'+dot('sunday-zayavki.csv','req',t('csv'))+'</div></div>'+
      '<div class="kpis">'+(own?'<div class="kpi glass main">'+IC.coin+'<small>'+t('k_deals')+'</small><b>'+usd(ds)+'</b><span class="chg">'+deals.length+' '+t('deals_n')+' · '+t('pipe')+' '+usd(pipe)+'</span></div>':'<div class="kpi glass main">'+IC.coin+'<small>'+t('k_deals')+'</small><b class="hid">'+t('hidden')+'</b><span class="chg">'+t('hidden_sub')+'</span></div>')+
      '<div class="kpi glass">'+IC.inbox+'<small>'+t('k_req')+'</small><b>'+w1+'</b>'+ch(w1,w0)+'</div>'+
      '<div class="kpi glass">'+IC.cal+'<small>'+t('k_busy')+'</small><b>'+busyN+'</b><span class="chg">'+t('busy_sub')+'</span></div>'+
      '<div class="kpi glass">'+IC.heart+'<small>'+t('k_guests')+'</small><b>'+gy+'</b><span class="chg">'+gs.length+' '+t('answers')+'</span></div></div>'+
      '<div class="crm"><button type="button" class="crm-c glass" data-go2="req"><span class="ci">'+IC.inbox+'</span><b>'+r.length+'</b><span>'+t('crm_req')+' <em>'+c.req+' '+t('crm_wait')+'</em></span><i>'+IC.arrow+'</i></button>'+
      '<button type="button" class="crm-c glass" data-go2="cal"><span class="ci">'+IC.cal+'</span><b>'+get('sn-hold-1',[]).length+'</b><span>'+t('crm_hold')+' <em>'+t('crm_check')+'</em></span><i>'+IC.arrow+'</i></button>'+
      '<button type="button" class="crm-c glass" data-go2="gst"><span class="ci">'+IC.users+'</span><b>'+gs.length+'</b><span>'+t('crm_gst')+' <em>'+gy+' '+t('g_people')+'</em></span><i>'+IC.arrow+'</i></button></div>'+
      '<div class="two"><section class="card glass"><h2>'+t('ch_req')+'</h2><div class="bars">'+days.map(function(x,k){return'<div class="bar'+(k===days.length-1?' on':'')+'"><i style="--h:'+(x.n/max).toFixed(3)+'"></i>'+(k===days.length-1?'<em>'+x.n+'</em>':'')+'<small>'+new Date(x.d).getDate()+'</small></div>'}).join('')+'</div></section>'+
      '<section class="card glass"><h2>'+t('ch_kind')+'</h2><ul class="popl">'+KINDS.filter(function(k){return kc[k]}).map(function(k){return'<li><i class="pd" style="background:'+KC[k]+';--k:0"></i><span>'+t('k_'+k)+'</span><b>'+kc[k]+'</b></li>'}).join('')+'</ul></section></div>'+
      '<h2 class="mu" style="font-size:14px;padding:0 6px">'+t('last_req')+'</h2>'+reqTable(r.slice(0,5))},
  req:function(){var r=rows().filter(function(x){return RF==='all'||x.kind===RF});
    return'<div class="hello"><div><h1>'+t('tab_req')+'</h1><p class="mu">'+t('req_sub')+'</p></div><div class="pills">'+dot('sunday-zayavki.csv','req',t('csv'))+'</div></div>'+
      '<div class="fchips">'+['all'].concat(KINDS).map(function(k){return'<button type="button" data-rf="'+k+'" aria-pressed="'+(RF===k)+'">'+(k==='all'?t('all'):t('k_'+k))+'</button>'}).join('')+'</div>'+
      (r.length?reqTable(r):'<p class="mu">'+t('nothing')+'</p>')},
  cal:function(){var m0=new Date(T0);m0=new Date(m0.getFullYear(),m0.getMonth()+CO,1);var lead=(m0.getDay()+6)%7,n=new Date(m0.getFullYear(),m0.getMonth()+1,0).getDate(),html='';
    for(var i=0;i<lead;i++)html+='<span></span>';
    var evs={};rows().forEach(function(x){if(x.date&&x.st<4)evs[x.date]=(evs[x.date]||0)+1});
    for(var g=1;g<=n;g++){var dt=new Date(m0.getFullYear(),m0.getMonth(),g),k=iso(dt),s=dayState(k,dt);html+='<button type="button" class="'+s+(+dt<T0?' past':'')+'" data-day="'+k+'">'+g+'<small>'+(s==='bz'?t('d_busy'):s==='hd'?t('d_hold'):evs[k]?evs[k]+' '+t('d_req'):'')+'</small></button>'}
    return'<div class="hello"><div><h1>'+t('tab_cal')+'</h1><p class="mu">'+t('cal_sub')+'</p></div></div><section class="card glass"><div class="pcal-h"><button type="button" class="ib" id="co-p" aria-label="'+t('prev')+'">'+IC.back+'</button><b>'+P.months[m0.getMonth()]+' '+m0.getFullYear()+'</b><button type="button" class="ib" id="co-n" aria-label="'+t('next')+'">'+IC.next+'</button></div>'+
      '<div class="pcal">'+P.wd.map(function(x){return'<span>'+x+'</span>'}).join('')+html+'</div><div class="lgd"><span><i style="background:rgb(52 68 136)"></i>'+t('d_busy')+'</span><span><i style="background:rgb(220 68 104)"></i>'+t('d_hold')+'</span><span><i style="background:rgb(255 255 255 / .2)"></i>'+t('d_free')+'</span></div></section>'},
  gst:function(){var gs=guests(),y=gs.filter(function(x){return x.yes}),c=y.reduce(function(a,x){return a+x.c},0),diet=gs.filter(function(x){return x.diet});
    return'<div class="hello"><div><h1>'+t('tab_gst')+'</h1><p class="mu">'+t('gst_sub')+'</p></div><div class="pills">'+dot('sunday-gosti.csv','gst',t('csv'))+'</div></div>'+
      '<div class="kpis"><div class="kpi glass">'+IC.heart+'<small>'+t('g_come')+'</small><b>'+c+'</b><span class="chg">'+y.length+' '+t('answers')+'</span></div><div class="kpi glass">'+IC.users+'<small>'+t('g_no')+'</small><b>'+(gs.length-y.length)+'</b></div><div class="kpi glass">'+IC.inbox+'<small>'+t('g_diet')+'</small><b>'+diet.length+'</b></div></div>'+
      '<section class="card glass"><ul class="gl">'+gs.map(function(g){return'<li><span><b>'+esc(g.name)+'</b><small>'+(g.mine?t('from_site'):t('demo'))+(g.diet?' · '+esc(g.diet):'')+'</small></span><span>'+g.c+'</span>'+(g.yes?'<span class="pill b1">'+t('g_yes')+'</span>':'<span class="pill b3">'+t('g_no')+'</span>')+'</li>'}).join('')+'</ul></section>'},
  log:function(){var l=get('sn-log-1',[]);return'<div class="hello"><div><h1>'+t('tab_log')+'</h1><p class="mu">'+t('log_sub')+'</p></div></div><section class="card glass">'+(l.length?'<ul class="log">'+l.map(function(x){return'<li><b>'+hm(x.at)+'</b><span>'+(x.who==='own'?t('r_own'):t('r_mgr'))+'</span><span>'+esc(x.what)+'</span></li>'}).join('')+'</ul>':'<p class="mu">'+t('log_empty')+'</p>')+'</section>'}
};

function bind(tab){
  $$('[data-go2]').forEach(function(b){b.addEventListener('click',function(){go(b.getAttribute('data-go2'))})});
  $$('[data-s]').forEach(function(b){b.addEventListener('click',function(){var id=+b.getAttribute('data-id'),st=+b.getAttribute('data-s');setSt(id,st);log('#'+id+': '+t(ST[st]));toast(t('saved_site'));go(cur)})});
  $$('[data-rf]').forEach(function(b){b.addEventListener('click',function(){RF=b.getAttribute('data-rf');go('req')})});
  $$('[data-day]').forEach(function(b){b.addEventListener('click',function(){var k=b.getAttribute('data-day'),D=get('sn-dates-1',{}),busy=b.classList.contains('bz');
    D[k]=busy?'free':'busy';put('sn-dates-1',D);var h=get('sn-hold-1',[]),j=h.indexOf(k);if(j>=0&&!busy){h.splice(j,1);put('sn-hold-1',h)}
    log(k.split('-').reverse().join('.')+': '+(busy?t('d_free'):t('d_busy')));toast(t('saved_site'));go('cal')})});
  var p=$('#co-p'),n=$('#co-n');if(p)p.addEventListener('click',function(){if(CO>0){CO--;go('cal')}});if(n)n.addEventListener('click',function(){if(CO<11){CO++;go('cal')}});
  $$('.dot-btn').forEach(dotBtn)}

/* A request by phone: the manager adds it, it becomes the first row. */
function newReq(){var l=get('sn-req-1',[]);l.unshift({id:5100+l.length+1,at:Date.now(),kind:'call',text:'',name:t('by_call'),ph:'+998 9_ *** ** **',st:1});put('sn-req-1',l);log(t('log_new'));toast(t('saved'));go('req')}

/* ── Exports "The Dot Does The Work": the file is built in the browser,
   progress follows a time floor (the file is ready), spring and "Open"
   at the end. Without motion: a plain arc, no wave. */
function csv(rs){return'﻿'+rs.map(function(r){return r.map(function(c){c=String(c==null?'':c);return/[";\n]/.test(c)?'"'+c.replace(/"/g,'""')+'"':c}).join(';')}).join('\n')}
function makeFile(kind){
  if(kind==='gst')return new Blob([csv([[t('client'),t('g_ans'),t('g_n'),t('g_diet')]].concat(guests().map(function(g){return[g.name,g.yes?t('g_yes'):t('g_no'),g.c,g.diet]})))],{type:'text/csv'});
  return new Blob([csv([[t('no'),t('when'),t('what'),t('ev_date'),t('client'),t('phone'),t('status')].concat(S.role==='own'?[t('budget')]:[])].concat(rows().map(function(x){return[x.id,dm(x.at)+' '+hm(x.at),t('k_'+x.kind),x.date||'',x.name,x.ph,t(ST[x.st])].concat(S.role==='own'?[x.sum||'']:[])})))],{type:'text/csv'})}
function pacer(minMs){var t0=performance.now(),shown=0;return function(raw){shown=Math.max(shown,Math.min(raw,(performance.now()-t0)/minMs));return shown}}
function dotBtn(b){if(b._d)return;b._d=1;var ring=$('circle',b),L=2*Math.PI*21,url=null;ring.style.strokeDasharray=L;ring.style.strokeDashoffset=L;
  b.setAttribute('aria-live','polite');
  b.addEventListener('click',function(){
    if(b.classList.contains('done')){var a=d.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';a.click();return}
    if(b.classList.contains('run'))return;
    b.classList.add('run');b.setAttribute('role','progressbar');b.setAttribute('aria-valuemin','0');b.setAttribute('aria-valuemax','100');
    var blob=makeFile(b.getAttribute('data-dl')),pc=pacer(RM?200:/*~*/1100),wat=$('.dot-water i',b);
    url=URL.createObjectURL(blob);
    (function fr(){var p=pc(1);ring.style.strokeDashoffset=(L*(1-p)).toFixed(2);wat.style.transform='translateY('+((1-p)*100).toFixed(1)+'%)';b.setAttribute('aria-valuenow',String(Math.round(p*100)));
      if(p<1)return requestAnimationFrame(fr);
      b.classList.remove('run');b.classList.add('done');b.removeAttribute('role');b.removeAttribute('aria-valuenow');$('.dot-l',b).textContent=t('open');
      var a=d.createElement('a');a.href=url;a.download=b.getAttribute('data-name');d.body.appendChild(a);a.click();a.remove();log(t('log_dl')+': '+b.getAttribute('data-name'));toast(t('ready'))})()})}

/* Requests from the site appear at once, with a badge on the icon. */
addEventListener('storage',function(e){if(!S.in||!$('#view'))return;if(e.key==='sn-req-1'||e.key==='sn-rsvp-1'||e.key==='sn-hold-1'){badges();go(cur);if(e.key==='sn-req-1')toast(t('new_in'))}});
if(S.in)shell();else login();
})();
