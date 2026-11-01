/* Панель Agora: вход (Telegram или код по телефону, демо-код 1234), «стекло»
   Glassy Dashboard V7 + CRM поверх их зала. По функциям — эталон Greenwell и
   Cargo Pro: бронь и заказ с сайта первой строкой, статус из панели виден
   гостю, роли, история, демо-цифры из одного зерна. Подписи — только словарём
   (ui.mjs), модель панель не вызывает. Связь с сайтом — память браузера:
   ag-book-1, ag-ord-1, ag-bot-1 пишет сайт, ag-stop-1 и статусы — панель. */
(function(){
var d=document,w=window,$=function(s,r){return(r||d).querySelector(s)},$$=function(s,r){return[].slice.call((r||d).querySelectorAll(s))};
var P=JSON.parse($('#pn-data').textContent),U=P.ui;
function t(k){return U[k]}
var RM=w.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function get(k,def){try{var v=localStorage.getItem(k);return v?JSON.parse(v):def}catch(e){return def}}
function put(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function money(n){return fmt(n)+' '+P.sum}
function mln(n){return(n/1e6).toFixed(1).replace('.',',')+' '+t('mln')}
function hm(ts){var x=new Date(ts);return(x.getHours()<10?'0':'')+x.getHours()+':'+(x.getMinutes()<10?'0':'')+x.getMinutes()}
var toastT=0;function toast(m){var e=$('#toast');e.textContent=m;e.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){e.classList.remove('on')},2400)}
var I=function(p){return'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+p+'</svg>'};
var IC={truck:I('<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>'),gear:I('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>'),eye:I('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>'),trash:I('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),home:I('<path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z"/>'),cal:I('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),bag:I('<path d="M5 8h14l-1 12H6Z"/><path d="M9 8a3 3 0 0 1 6 0"/>'),
  bot:I('<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4M9 13h.01M15 13h.01M9 17h6"/>'),menu:I('<path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4Z"/><path d="M8 9h8M8 13h8M8 17h5"/>'),log:I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  arrow:I('<path d="M7 17 17 7M9 7h8v8"/>'),bell:I('<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4Z"/><path d="M10 20a2 2 0 0 0 4 0"/>'),plus:I('<path d="M12 5v14M5 12h14"/>'),search:I('<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>'),
  tg:I('<path d="M21 4 3 11l6 2 2 6 3-4 5 4Z"/><path d="m9 13 8-6"/>'),phone:I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>'),
  up:I('<path d="M12 16V4M6 10l6-6 6 6M4 20h16"/>'),down:I('<path d="M12 4v12M6 10l6 6 6-6M4 20h16"/>'),back:I('<path d="M19 12H5M11 6l-6 6 6 6"/>'),users:I('<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M16 4a3 3 0 0 1 0 6M21 20a6 6 0 0 0-4-5.6"/>'),
  coin:I('<circle cx="12" cy="12" r="9"/><path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.5 0-2.5.9-2.5 2s1 1.7 2.5 2 2.5.9 2.5 2-1 2-2.5 2c-1 0-2-.5-2.5-1.5M12 6.5v11"/>')};
var MARK='<svg viewBox="0 0 1176 380" aria-hidden="true" focusable="false"><use href="#ag-g"/></svg>';

/* ── Демо из одного зерна: те же числа на каждом экране ─────────── */
var z=20261101;function rnd(){z=(z*16807)%2147483647;return z/2147483647}
function pick(a){return a[Math.floor(rnd()*a.length)]}
var MENU=P.menu.map(function(a){return{id:a[0],cat:a[1],n:a[2],p:a[3],ph:a[4]}}),byId={};MENU.forEach(function(m){byId[m.id]=m});
var CAT={};P.cats.forEach(function(c){CAT[c[0]]={n:c[1],g:c[2]}});
var DAY=864e5,T0=new Date();T0.setHours(0,0,0,0);T0=+T0;
var days=[];for(var i=13;i>=0;i--){var g=Math.round(70+rnd()*90+(i%7<2?40:0)),ck=Math.round(150000+rnd()*90000);days.push({d:T0-i*DAY,guests:g,rev:g*ck})}
var demoBook=[],when=['19:00','19:30','20:00','20:30','21:00','21:30','22:00','18:00'];
for(i=0;i<9;i++)demoBook.push({id:2101+i,at:T0-DAY+i*3600e3,date:i<5?t('today'):t('tomorrow'),time:when[i%when.length],ppl:2+Math.floor(rnd()*6),name:i===3?P.corp:pick(P.names),ph:'+998 9'+Math.floor(rnd()*9)+' *** ** '+(10+Math.floor(rnd()*89)),note:'',st:i<2?0:i<6?1:i<8?2:3,src:pick(['call','ig','site','bot']),demo:1});
demoBook[3].ppl=24;demoBook[3].note=t('note_banket');
var kitchen=MENU.filter(function(m){return CAT[m.cat].g==='k'&&m.ph}),demoOrd=[];
for(i=0;i<6;i++){var it=[[pick(kitchen).id,1+Math.floor(rnd()*2)],[pick(kitchen).id,1]],s=it.reduce(function(a,x){return a+byId[x[0]].p*x[1]},0);
  demoOrd.push({id:1031+i,at:Date.now()-(i+1)*2400e3,items:it,sum:s,mode:i%2?'go':'book',name:pick(P.names),ph:'+998 9'+Math.floor(rnd()*9)+' *** ** '+(10+Math.floor(rnd()*89)),st:i<1?0:i<3?2:4,src:pick(['site','bot']),note:i===2?t('note_courier')+': '+P.addr:'',demo:1})}
var demoBot=[{id:3201,at:Date.now()-1500e3,who:pick(P.names),text:t('q_allergy'),st:0,demo:1},{id:3202,at:Date.now()-5200e3,who:pick(P.names),text:t('q_cert'),st:0,demo:1},{id:3203,at:Date.now()-9e6,who:pick(P.names),text:t('q_late'),st:1,demo:1}];
var pop=kitchen.slice(0).sort(function(){return rnd()-.5}).slice(0,5).map(function(m,k){return{m:m,n:Math.round(60-k*9+rnd()*6)}});

/* Состояние: сайт и бот кладут свои строки, панель хранит статусы демо-строк. */
var S=get('ag-pn-1',{st:{},role:'own'});
function rows(key,demo){var mine=get(key,[]).map(function(x){x.mine=1;return x});return mine.concat(demo.map(function(x){var o=JSON.parse(JSON.stringify(x));if(S.st[key+o.id]!=null)o.st=S.st[key+o.id];return o}))}
function setSt(key,id,st){var l=get(key,[]),hit=l.filter(function(x){return x.id===id})[0];if(hit){hit.st=st;put(key,l)}else{S.st[key+id]=st;put('ag-pn-1',S)}}
function log(what){var l=get('ag-log-1',[]);l.unshift({at:Date.now(),who:S.role,what:what});put('ag-log-1',l.slice(0,80))}
var stop=get('ag-stop-1',{});
/* Меню, доставка и сайт правятся здесь, сайт читает те же ключи: ag-menu-1
   (правки цен и названий, скрытые, «Хит/Новинка», новые позиции), ag-set-1
   (доставка, пауза кухни, баннер, часы, бронь). */
var MO=get('ag-menu-1',{e:{},a:[]}),BASE=MENU.slice(0);
function ed(id){return MO.e[id]||(MO.e[id]={})}
function eff(m){var e=MO.e[m.id]||{};return{id:m.id,cat:m.cat,n:e.n||m.n,p:e.p!=null?e.p:m.p,ph:m.ph,img:m.img,h:!!e.h,tg:e.t||'',added:m.added}}
function allMenu(){return BASE.concat(MO.a.map(function(a){return{id:a.id,cat:a.cat,n:a.n,p:a.p,ph:null,img:a.img,added:1}})).map(eff)}
function saveMO(){put('ag-menu-1',MO);allMenu().forEach(function(m){byId[m.id]=m})}
allMenu().forEach(function(m){byId[m.id]=m});
var SET=Object.assign({},P.set0,get('ag-set-1',{}));SET.dlv=Object.assign({},P.set0.dlv,SET.dlv||{});SET.book=Object.assign({},P.set0.book,SET.book||{});
function saveSET(){put('ag-set-1',SET)}
var mf={q:'',cat:'all'};

/* ── Вход: телефон или Telegram, потом код ─────────────────────── */
var app=$('#app');
function login(){app.innerHTML='<main class="lg-wrap"><div class="lg glass" id="lg">'+
  '<div class="lg-f lg-a"><span class="lg-mark">'+MARK+'</span><h1>'+t('in_title')+'</h1><p class="mu">'+t('in_sub')+'</p>'+
  '<label class="fl" for="lg-ph">'+t('phone')+'</label><input id="lg-ph" type="tel" inputmode="tel" autocomplete="tel" value="+998 97 ">'+
  '<button type="button" class="pb pb-a" id="lg-go">'+IC.phone+'<span>'+t('get_code')+'</span></button></div>'+
  '<div class="lg-f lg-b"><span class="lg-mark">'+MARK+'</span><h1>'+t('in_tg')+'</h1><p class="mu">'+t('in_tg_sub')+'</p>'+
  '<button type="button" class="pb pb-a" id="lg-tg">'+IC.tg+'<span>'+t('open_tg')+'</span></button></div>'+
  '<div class="lg-pane" aria-hidden="false"><div class="lg-pi lg-pa"><b>'+t('pane_a')+'</b><p>'+t('pane_a_sub')+'</p><button type="button" class="pb pb-o" data-sw="b">'+t('sw_tg')+'</button></div>'+
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
  '<button type="button" class="as-b" data-r="own"><b>'+t('r_own')+'</b><span>'+t('r_own_sub')+'</span></button><button type="button" class="as-b" data-r="adm"><b>'+t('r_adm')+'</b><span>'+t('r_adm_sub')+'</span></button></div></div></main>';
  $$('[data-r]').forEach(function(b){b.addEventListener('click',function(){S.role=b.getAttribute('data-r');S.in=1;put('ag-pn-1',S);log(t('log_in'));shell()})})}

/* ── Каркас: колонка, верх, разделы ─────────────────────────────── */
var TABS=[['sum','home'],['book','cal'],['ord','bag'],['bot','bot'],['menu','menu'],['dlv','truck'],['set','gear'],['log','log']],cur='sum';
function counts(){return{book:rows('ag-book-1',demoBook).filter(function(x){return x.st===0}).length,ord:rows('ag-ord-1',demoOrd).filter(function(x){return x.st===0}).length,bot:rows('ag-bot-1',demoBot).filter(function(x){return x.st===0}).length}}
function shell(){var own=S.role==='own';
  app.innerHTML='<div class="pn-sh"><nav class="rail glass" aria-label="'+t('nav')+'"><a class="rail-m" href="'+P.home+'" aria-label="AGORA">A</a>'+TABS.map(function(x){return'<button type="button" data-tab="'+x[0]+'" aria-label="'+t('tab_'+x[0])+'"><span class="ri">'+IC[x[1]]+'<b class="bd" data-bd="'+x[0]+'"></b></span><span class="rl">'+t('tab_'+x[0])+'</span></button>'}).join('')+
    '<a class="rail-x" href="'+P.site+'" aria-label="'+t('to_site')+'">'+IC.back+'<span class="rl">'+t('to_site')+'</span></a></nav>'+
    '<div class="pn-main"><header class="pn-top glass"><span class="ws"><i>A</i><span><b>Agora</b><small>'+esc(P.street)+'</small></span></span>'+
    '<label class="psrch">'+IC.search+'<span class="vh">'+t('search')+'</span><input id="q" type="search" placeholder="'+t('search_ph')+'" autocomplete="off"><kbd>/</kbd><span class="pres" id="qres" hidden></span></label>'+
    '<button type="button" class="pb pb-a pb-s" id="newb">'+IC.plus+'<span>'+t('new_book')+'</span></button>'+
    '<button type="button" class="ib" id="bell" aria-label="'+t('bell')+'">'+IC.bell+'<i class="rd" id="bell-d"></i></button>'+
    '<button type="button" class="av" id="role" aria-label="'+t('role')+'"><b>'+(own?'O':'A')+'</b><span>'+(own?t('r_own'):t('r_adm'))+'</span></button></header>'+
    '<div class="demo">'+t('demo_line')+'</div><div id="view"></div></div></div>';
  $$('[data-tab]').forEach(function(b){b.addEventListener('click',function(){go(b.getAttribute('data-tab'))})});
  $('#role').addEventListener('click',function(){S.role=S.role==='own'?'adm':'own';put('ag-pn-1',S);log(t('log_role')+': '+(S.role==='own'?t('r_own'):t('r_adm')));shell();toast(t('role_now')+': '+(S.role==='own'?t('r_own'):t('r_adm')))});
  $('#newb').addEventListener('click',newBook);$('#bell').addEventListener('click',function(){go(counts().bot?'bot':'book')});
  var q=$('#q');q.addEventListener('input',function(){search(q.value)});d.addEventListener('keydown',function(e){if(e.key==='/'&&d.activeElement!==q&&!/input|textarea/i.test((d.activeElement||{}).tagName||'')){e.preventDefault();q.focus()}});
  var h=(location.hash||'').slice(1);go(TABS.some(function(x){return x[0]===h})?h:cur)}
function badges(){var c=counts();$$('[data-bd]').forEach(function(b){var n=c[b.getAttribute('data-bd')]||0;b.textContent=n||'';b.hidden=!n});var bd=$('#bell-d');if(bd)bd.hidden=!(c.book+c.ord+c.bot)}
function go(tab){cur=tab;$$('[data-tab]').forEach(function(b){b.setAttribute('aria-current',String(b.getAttribute('data-tab')===tab))});
  try{history.replaceState(null,'','#'+tab)}catch(e){}var v=$('#view');v.innerHTML=VIEW[tab]();v.classList.remove('in');void v.offsetWidth;v.classList.add('in');badges();bind(tab)}

/* Поиск по демо-данным: брони, заказы, меню. Без модели. */
function search(q){var r=$('#qres');q=q.trim().toLowerCase();if(q.length<2){r.hidden=true;return}
  var out=[];rows('ag-book-1',demoBook).forEach(function(x){if((x.name+' '+x.id).toLowerCase().indexOf(q)>=0)out.push(['book',t('tab_book')+' #'+x.id+' · '+x.name])});
  rows('ag-ord-1',demoOrd).forEach(function(x){if((x.name+' '+x.id).toLowerCase().indexOf(q)>=0)out.push(['ord',t('tab_ord')+' #'+x.id+' · '+x.name])});
  MENU.forEach(function(m){if(m.n.toLowerCase().indexOf(q)>=0)out.push(['menu',m.n])});
  r.innerHTML=out.slice(0,8).map(function(o){return'<button type="button" data-go="'+o[0]+'">'+esc(o[1])+'</button>'}).join('')||'<span class="mu">'+t('nothing')+'</span>';r.hidden=false;
  $$('[data-go]',r).forEach(function(b){b.addEventListener('click',function(){r.hidden=true;$('#q').value='';go(b.getAttribute('data-go'))})})}

var BST=['st_new','st_ok','st_came','st_cancel'],OST=['o_new','o_acc','o_cook','o_ready','o_done'];
function pill(k,cls){return'<span class="pill '+(cls||'')+'">'+t(k)+'</span>'}
function src(s){return'<span class="src">'+t('src_'+s)+'</span>'}

var VIEW={
  sum:function(){var own=S.role==='own',c=counts(),last7=days.slice(7),prev7=days.slice(0,7),rv=last7.reduce(function(a,x){return a+x.rev},0),rp=prev7.reduce(function(a,x){return a+x.rev},0),gv=last7.reduce(function(a,x){return a+x.guests},0),gp=prev7.reduce(function(a,x){return a+x.guests},0);
    var bt=rows('ag-book-1',demoBook).filter(function(x){return x.date===t('today')&&x.st!==3}),max=Math.max.apply(null,days.map(function(x){return own?x.rev:x.guests}));
    function ch(a,b){var p=Math.round((a-b)/b*100);return'<span class="chg '+(p>=0?'up':'dn')+'">'+(p>=0?'+':'')+p+'% '+t('vs_prev')+'</span>'}
    return'<div class="hello"><div><h1>'+t('hello')+'</h1><p class="mu">'+t('hello_sub')+'</p></div><div class="pills"><span class="pill">'+t('period_7')+'</span><button type="button" class="dot-btn" data-dl="book" data-name="agora-broni.csv"><span class="dot-face"></span><span class="dot-w">'+IC.down+'<span class="dot-l">'+t('csv')+'</span></span><svg class="dot-ring" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21"/></svg><span class="dot-water"><i></i></span></button></div></div>'+
      '<div class="kpis">'+(own?'<div class="kpi glass main">'+IC.coin+'<small>'+t('k_rev')+'</small><b>'+mln(rv)+'</b>'+ch(rv,rp)+'</div>':'<div class="kpi glass main">'+IC.coin+'<small>'+t('k_rev')+'</small><b class="hid">'+t('hidden')+'</b><span class="chg">'+t('hidden_sub')+'</span></div>')+
      '<div class="kpi glass">'+IC.users+'<small>'+t('k_guests')+'</small><b>'+fmt(gv)+'</b>'+ch(gv,gp)+'</div>'+
      '<div class="kpi glass">'+IC.cal+'<small>'+t('k_today')+'</small><b>'+bt.length+'</b><span class="chg">'+bt.reduce(function(a,x){return a+x.ppl},0)+' '+t('guests')+'</span></div>'+
      (own?'<div class="kpi glass">'+IC.bag+'<small>'+t('k_check')+'</small><b>'+fmt(rv/gv/1000)+' '+t('thousand')+'</b><span class="chg">'+t('per_guest')+'</span></div>':'<div class="kpi glass">'+IC.bag+'<small>'+t('k_ord')+'</small><b>'+rows('ag-ord-1',demoOrd).filter(function(x){return x.st<4}).length+'</b><span class="chg">'+t('in_work')+'</span></div>')+'</div>'+
      '<div class="crm"><button type="button" class="crm-c glass" data-go2="book"><span class="ci">'+IC.cal+'</span><b>'+rows('ag-book-1',demoBook).length+'</b><span>'+t('crm_book')+' <em>'+c.book+' '+t('crm_wait_ok')+'</em></span><i>'+IC.arrow+'</i></button>'+
      '<button type="button" class="crm-c glass" data-go2="bot"><span class="ci">'+IC.bot+'</span><b>'+rows('ag-bot-1',demoBot).length+'</b><span>'+t('crm_bot')+' <em>'+c.bot+' '+t('crm_wait_ans')+'</em></span><i>'+IC.arrow+'</i></button>'+
      '<button type="button" class="crm-c glass" data-go2="ord"><span class="ci">'+IC.bag+'</span><b>'+rows('ag-ord-1',demoOrd).length+'</b><span>'+t('crm_ord')+' <em>'+c.ord+' '+t('crm_wait_ok')+'</em></span><i>'+IC.arrow+'</i></button></div>'+
      '<div class="two"><section class="card glass"><h2>'+(own?t('ch_rev'):t('ch_guests'))+'</h2><div class="bars">'+days.map(function(x,k){var v=own?x.rev:x.guests,dd=new Date(x.d);return'<span class="bar'+(k===13?' on':'')+'" style="--h:'+(v/max).toFixed(3)+'" title="'+(own?mln(v):v)+'"><i></i><small>'+dd.getDate()+'</small>'+(k===13?'<em>'+(own?mln(v):v)+'</em>':'')+'</span>'}).join('')+'</div><p class="mu sm">'+t('demo_one')+'</p></section>'+
      '<section class="card glass"><h2>'+t('popular')+'</h2><ul class="popl">'+pop.map(function(x,k){return'<li><span class="pd" style="--k:'+k+'"></span><span>'+esc(x.m.n)+'</span><b>'+x.n+'</b></li>'}).join('')+'</ul><p class="mu sm">'+t('popular_sub')+'</p></section></div>'},
  book:function(){var l=rows('ag-book-1',demoBook);
    return'<div class="hello"><div><h1>'+t('tab_book')+'</h1><p class="mu">'+t('book_sub')+'</p></div><div class="pills"><button type="button" class="pb pb-a pb-s" id="newb2">'+IC.plus+'<span>'+t('new_book')+'</span></button><button type="button" class="dot-btn" data-dl="book" data-name="agora-broni.csv"><span class="dot-face"></span><span class="dot-w">'+IC.down+'<span class="dot-l">'+t('csv')+'</span></span><svg class="dot-ring" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21"/></svg><span class="dot-water"><i></i></span></button></div></div>'+
      '<div class="tbl glass"><table><thead><tr><th>№</th><th>'+t('when')+'</th><th>'+t('guests_h')+'</th><th>'+t('name')+'</th><th>'+t('from')+'</th><th>'+t('status')+'</th><th><span class="vh">'+t('actions')+'</span></th></tr></thead><tbody>'+
      l.map(function(x){return'<tr class="'+(x.mine?'new':'')+'"><td>'+x.id+'</td><td><b>'+esc(x.date)+'</b> '+esc(x.time)+'</td><td>'+x.ppl+'</td><td>'+esc(x.name)+(x.note?'<small>'+esc(x.note)+'</small>':'')+'<small>'+esc(x.ph)+'</small></td><td>'+src(x.src)+'</td><td>'+pill(BST[x.st],'b'+x.st)+'</td><td class="act">'+
        (x.st===0?'<button type="button" class="pb pb-a pb-s" data-bk="'+x.id+'" data-s="1">'+t('confirm')+'</button>':'')+(x.st===1?'<button type="button" class="pb pb-s" data-bk="'+x.id+'" data-s="2">'+t('came')+'</button>':'')+(x.st<2?'<button type="button" class="pb pb-s pb-g" data-bk="'+x.id+'" data-s="3">'+t('cancel')+'</button>':'')+'</td></tr>'}).join('')+'</tbody></table></div>'},
  ord:function(){var l=rows('ag-ord-1',demoOrd),own=S.role==='own';
    return'<div class="hello"><div><h1>'+t('tab_ord')+'</h1><p class="mu">'+t('ord_sub')+'</p></div><div class="pills"><button type="button" class="dot-btn" data-dl="ord" data-name="agora-zakazy.csv"><span class="dot-face"></span><span class="dot-w">'+IC.down+'<span class="dot-l">'+t('csv')+'</span></span><svg class="dot-ring" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21"/></svg><span class="dot-water"><i></i></span></button></div></div>'+
      '<div class="ords">'+l.map(function(x){return'<article class="ordc glass'+(x.mine?' new':'')+'"><header><b>#'+x.id+'</b>'+src(x.src)+'<span class="mu">'+hm(x.at)+' · '+(x.mode==='go'?t('to_go'):x.mode==='dlv'?t('to_dlv'):t('to_book'))+'</span>'+pill(OST[x.st],'o'+x.st)+'</header>'+
        '<ul>'+x.items.map(function(it){var m=byId[it[0]];return m?'<li><span>'+esc(m.n)+' × '+it[1]+'</span><b>'+money(m.p*it[1])+'</b></li>':''}).join('')+'</ul>'+(x.addr?'<p class="mu sm">'+IC.truck+' '+esc(x.addr)+(x.zone?' · '+esc(x.zone):'')+(x.fee!=null?' · '+t('dlv_fee')+': '+(x.fee?money(x.fee):t('free')):'')+'</p>':'')+(x.note?'<p class="mu sm">'+esc(x.note)+'</p>':'')+
        '<footer><span>'+esc(x.name)+' · '+esc(x.ph)+'</span><b>'+money(x.sum)+'</b></footer><div class="act">'+(x.st<4?'<button type="button" class="pb pb-a pb-s" data-or="'+x.id+'" data-s="'+(x.st+1)+'">'+t(OST[x.st+1]+'_do')+'</button>':'')+
        '<button type="button" class="dot-btn sm" data-dl="bill" data-id="'+x.id+'" data-name="agora-schet-'+x.id+'.html"><span class="dot-face"></span><span class="dot-w">'+IC.down+'<span class="dot-l">'+t('bill')+'</span></span><svg class="dot-ring" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21"/></svg><span class="dot-water"><i></i></span></button></div></article>'}).join('')+'</div>'},
  bot:function(){var l=rows('ag-bot-1',demoBot);
    return'<div class="hello"><div><h1>'+t('tab_bot')+'</h1><p class="mu">'+t('bot_sub')+'</p></div></div><div class="inb">'+l.map(function(x){return'<article class="inc glass'+(x.st===0?' wait':'')+'"><header><b>'+esc(x.who)+'</b><span class="mu">'+hm(x.at)+'</span>'+(x.qr?'<span class="src">QR</span>':'<span class="src">Telegram</span>')+(x.st===0?pill('wait_ans','b0'):pill('answered','b1'))+'</header><p>'+esc(x.text)+'</p>'+
      (x.st===0?'<form class="rep" data-rep="'+x.id+'"><label class="vh" for="rp'+x.id+'">'+t('reply')+'</label><input id="rp'+x.id+'" placeholder="'+(x.qr?t('reply_qr'):t('reply_ph'))+'"><button type="submit" class="pb pb-a pb-s">'+(x.qr?t('take'):t('send'))+'</button></form>':'')+'</article>'}).join('')+'</div>'},
  menu:function(){var own=S.role==='own',L=allMenu(),q=mf.q.toLowerCase(),off=Object.keys(stop).filter(function(k){return stop[k]}).length,hid=L.filter(function(m){return m.h}).length;
    var cats=P.cats.filter(function(c){return mf.cat==='all'||c[0]===mf.cat});
    var row=function(m){var so=!!stop[m.id];return'<div class="mrow2'+(so||m.h?' off':'')+'" data-row="'+m.id+'">'+(m.img?'<img src="'+m.img+'" alt="" width="56" height="42">':m.ph?'<img src="'+P.img+'/d-'+m.ph+'-s.webp" alt="" width="56" height="42" loading="lazy">':'<span class="noimg"></span>')+
      (own?'<label class="vh" for="mn-'+m.id+'">'+t('f_name')+'</label><input class="mi-n" id="mn-'+m.id+'" data-mn="'+m.id+'" value="'+esc(m.n)+'">':'<span>'+esc(m.n)+'</span>')+
      '<select class="mi-t" data-mt="'+m.id+'" aria-label="'+t('f_tag')+'"><option value="">'+t('tag_none')+'</option><option value="hit"'+(m.tg==='hit'?' selected':'')+'>'+t('tag_hit')+'</option><option value="new"'+(m.tg==='new'?' selected':'')+'>'+t('tag_new')+'</option></select>'+
      (own?'<label class="mi-p"><span class="vh">'+t('f_price')+'</span><input type="number" min="0" step="1000" inputmode="numeric" data-mp="'+m.id+'" value="'+m.p+'"><small>'+P.sum+'</small></label>':'<b>'+money(m.p)+'</b>')+
      '<button type="button" class="ib sm'+(m.h?' on':'')+'" data-mh="'+m.id+'" aria-pressed="'+m.h+'" title="'+t('hide')+'" aria-label="'+t('hide')+': '+esc(m.n)+'">'+IC.eye+'</button>'+
      (m.added&&own?'<button type="button" class="ib sm" data-md="'+m.id+'" aria-label="'+t('del')+': '+esc(m.n)+'">'+IC.trash+'</button>':'')+
      '<label class="tg"><input type="checkbox" data-stop="'+m.id+'"'+(so?'':' checked')+'><span aria-hidden="true"></span><span class="vh">'+t('on_sale')+': '+esc(m.n)+'</span></label></div>'};
    return'<div class="hello"><div><h1>'+t('tab_menu')+'</h1><p class="mu">'+(own?t('menu_sub'):t('menu_sub_adm'))+'</p></div><div class="pills"><span class="pill">'+off+' '+t('in_stop')+'</span><span class="pill">'+hid+' '+t('hidden_n')+'</span>'+(own?'<button type="button" class="pb pb-a pb-s" id="addi">'+IC.plus+'<span>'+t('add_item')+'</span></button>':'')+'</div></div>'+
      (own?'<form class="addf glass" id="addf" hidden><h2>'+t('add_item')+'</h2><div class="fg">'+
        '<label><span>'+t('f_cat')+'</span><select id="af-cat">'+P.cats.map(function(c){return'<option value="'+c[0]+'">'+esc(c[1])+'</option>'}).join('')+'</select></label>'+
        '<label><span>'+t('f_name')+'</span><input id="af-n" required maxlength="60"></label>'+
        '<label><span>'+t('f_price')+', '+P.sum+'</span><input id="af-p" type="number" min="0" step="1000" inputmode="numeric" required></label>'+
        '<label><span>'+t('f_w')+'</span><input id="af-w" type="number" min="0" inputmode="numeric"></label>'+
        '<label class="wide"><span>'+t('f_desc')+'</span><textarea id="af-d" maxlength="240"></textarea></label>'+
        '<label class="wide"><span>'+t('f_photo')+'</span><input id="af-f" type="file" accept="image/jpeg,image/png,image/webp"><small class="mu">'+t('f_photo_note')+'</small></label>'+
        '<label><span>'+t('f_tag')+'</span><select id="af-t"><option value="">'+t('tag_none')+'</option><option value="hit">'+t('tag_hit')+'</option><option value="new">'+t('tag_new')+'</option></select></label></div>'+
        '<div class="act"><button type="submit" class="pb pb-a">'+t('save')+'</button><button type="button" class="pb pb-g" id="af-x">'+t('cancel')+'</button></div></form>':'')+
      '<div class="mtools"><label class="psrch">'+IC.search+'<span class="vh">'+t('search')+'</span><input id="mq" type="search" placeholder="'+t('menu_find')+'" value="'+esc(mf.q)+'"></label>'+
      '<select id="mcat" aria-label="'+t('f_cat')+'"><option value="all">'+t('all_cats')+'</option>'+P.cats.map(function(c){return'<option value="'+c[0]+'"'+(mf.cat===c[0]?' selected':'')+'>'+esc(c[1])+'</option>'}).join('')+'</select></div>'+
      '<div class="mlist glass">'+cats.map(function(c){var it=L.filter(function(m){return m.cat===c[0]&&(!q||m.n.toLowerCase().indexOf(q)>=0)});if(!it.length)return'';return'<h3>'+esc(c[1])+' <small>'+it.length+'</small></h3>'+it.map(row).join('')}).join('')+'</div>'},
  dlv:function(){var D=SET.dlv,own=S.role==='own',dis=own?'':' disabled';
    return'<div class="hello"><div><h1>'+t('tab_dlv')+'</h1><p class="mu">'+t('dlv_sub')+'</p></div></div>'+
      '<section class="card glass sets"><div class="sw2"><span><b>'+t('pause')+'</b><small>'+t('pause_sub')+'</small></span><label class="tg"><input type="checkbox" data-set="pause"'+(SET.pause?' checked':'')+'><span aria-hidden="true"></span><span class="vh">'+t('pause')+'</span></label></div>'+
      '<div class="sw2"><span><b>'+t('dlv_on')+'</b><small>'+t('dlv_on_sub')+'</small></span><label class="tg"><input type="checkbox" data-dset="on"'+(D.on?' checked':'')+dis+'><span aria-hidden="true"></span><span class="vh">'+t('dlv_on')+'</span></label></div>'+
      '<div class="sw2"><span><b>'+t('pick_on')+'</b><small>'+t('pick_on_sub')+'</small></span><label class="tg"><input type="checkbox" data-dset="pick"'+(D.pick?' checked':'')+dis+'><span aria-hidden="true"></span><span class="vh">'+t('pick_on')+'</span></label></div>'+
      '<div class="fg"><label><span>'+t('dlv_min')+', '+P.sum+'</span><input type="number" min="0" step="10000" data-dnum="min" value="'+D.min+'"'+dis+'></label><label><span>'+t('dlv_free')+', '+P.sum+'</span><input type="number" min="0" step="10000" data-dnum="free" value="'+D.free+'"'+dis+'></label></div></section>'+
      '<section class="card glass"><h2>'+t('zones')+'</h2><p class="mu sm" style="margin:0 0 10px">'+t('zones_sub')+'</p><div class="zones">'+D.zones.map(function(z,k){return'<div class="zr"><input aria-label="'+t('z_name')+'" data-z="'+k+'" data-zk="n" value="'+esc(z.n)+'"'+dis+'><label><span class="vh">'+t('z_price')+'</span><input type="number" min="0" step="1000" data-z="'+k+'" data-zk="p" value="'+z.p+'"'+dis+'><small>'+P.sum+'</small></label><label><span class="vh">'+t('z_time')+'</span><input type="number" min="10" step="5" data-z="'+k+'" data-zk="m" value="'+z.m+'"'+dis+'><small>'+t('min')+'</small></label>'+(own?'<button type="button" class="ib sm" data-zdel="'+k+'" aria-label="'+t('del')+'">'+IC.trash+'</button>':'')+'</div>'}).join('')+'</div>'+
      (own?'<button type="button" class="pb pb-s" id="zadd">'+IC.plus+'<span>'+t('z_add')+'</span></button>':'<p class="mu sm">'+t('own_only')+'</p>')+'</section>'},
  set:function(){var B=SET.book,own=S.role==='own',dis=own?'':' disabled',tm=P.times.map(function(x){return x});
    var opt=function(v){return tm.map(function(x){return'<option'+(x===v?' selected':'')+'>'+x+'</option>'}).join('')};
    return'<div class="hello"><div><h1>'+t('tab_set')+'</h1><p class="mu">'+t('set_sub')+'</p></div><a class="pb pb-s" href="'+P.site+'" target="_blank" rel="noopener">'+t('to_site')+'</a></div>'+
      '<section class="card glass sets"><h2>'+t('banner')+'</h2><div class="sw2"><span><b>'+t('banner_on')+'</b><small>'+t('banner_sub')+'</small></span><label class="tg"><input type="checkbox" data-set="bannerOn"'+(SET.bannerOn?' checked':'')+'><span aria-hidden="true"></span><span class="vh">'+t('banner_on')+'</span></label></div>'+
      '<label class="fl2"><span>'+t('banner_text')+'</span><input data-stext="banner" maxlength="90" value="'+esc(SET.banner)+'"></label></section>'+
      '<section class="card glass sets"><h2>'+t('info')+'</h2><label class="fl2"><span>'+t('hours')+'</span><input data-stext="hours" maxlength="60" value="'+esc(SET.hours)+'"'+dis+'></label></section>'+
      '<section class="card glass sets"><h2>'+t('book_set')+'</h2><div class="fg"><label><span>'+t('book_from')+'</span><select data-bset="from"'+dis+'>'+opt(B.from)+'</select></label><label><span>'+t('book_to')+'</span><select data-bset="to"'+dis+'>'+opt(B.to)+'</select></label><label><span>'+t('book_max')+'</span><input type="number" min="1" max="60" data-bnum="max" value="'+B.max+'"'+dis+'></label></div>'+
      '<div class="sw2"><span><b>'+t('auto_ok')+'</b><small>'+t('auto_ok_sub')+'</small></span><label class="tg"><input type="checkbox" data-bset2="auto"'+(B.auto?' checked':'')+dis+'><span aria-hidden="true"></span><span class="vh">'+t('auto_ok')+'</span></label></div>'+
      '<div class="sw2"><span><b>'+t('pre_on')+'</b><small>'+t('pre_on_sub')+'</small></span><label class="tg"><input type="checkbox" data-bset2="pre"'+(B.pre?' checked':'')+dis+'><span aria-hidden="true"></span><span class="vh">'+t('pre_on')+'</span></label></div>'+
      (own?'':'<p class="mu sm">'+t('own_only')+'</p>')+'</section>'},
  log:function(){var l=get('ag-log-1',[]);return'<div class="hello"><div><h1>'+t('tab_log')+'</h1><p class="mu">'+t('log_sub')+'</p></div></div><div class="tbl glass"><table><thead><tr><th>'+t('time')+'</th><th>'+t('who')+'</th><th>'+t('what')+'</th></tr></thead><tbody>'+
    (l.length?l.map(function(x){return'<tr><td>'+hm(x.at)+'</td><td>'+(x.who==='own'?t('r_own'):t('r_adm'))+'</td><td>'+esc(x.what)+'</td></tr>'}).join(''):'<tr><td colspan="3" class="mu">'+t('log_empty')+'</td></tr>')+'</tbody></table></div>'}
};

function bind(tab){
  $$('[data-go2]').forEach(function(b){b.addEventListener('click',function(){go(b.getAttribute('data-go2'))})});
  $$('[data-bk]').forEach(function(b){b.addEventListener('click',function(){var id=+b.getAttribute('data-bk'),s=+b.getAttribute('data-s');setSt('ag-book-1',id,s);log(t('tab_book')+' #'+id+': '+t(BST[s]));toast(t('tab_book')+' #'+id+': '+t(BST[s]));go('book')})});
  $$('[data-or]').forEach(function(b){b.addEventListener('click',function(){var id=+b.getAttribute('data-or'),s=+b.getAttribute('data-s');setSt('ag-ord-1',id,s);log(t('tab_ord')+' #'+id+': '+t(OST[s]));toast(t('tab_ord')+' #'+id+': '+t(OST[s]));go('ord')})});
  $$('[data-rep]').forEach(function(f){f.addEventListener('submit',function(e){e.preventDefault();var id=+f.getAttribute('data-rep');setSt('ag-bot-1',id,1);log(t('log_reply')+' #'+id);toast(t('sent_demo'));go('bot')})});
  $$('[data-stop]').forEach(function(x){x.addEventListener('change',function(){var id=x.getAttribute('data-stop');stop[id]=!x.checked;put('ag-stop-1',stop);log((x.checked?t('log_back'):t('log_stop'))+': '+byId[id].n);x.closest('.mrow2').classList.toggle('off',!x.checked)})});
  var nb=$('#newb2');if(nb)nb.addEventListener('click',newBook);
  if(tab==='menu')bindMenu();if(tab==='dlv'||tab==='set')bindSet(tab);
  $$('.dot-btn').forEach(dot)}

/* Меню: цена, название, метка, скрыть, удалить своё, новая позиция с фото. */
function bindMenu(){
  var nm=function(id){return byId[id]?byId[id].n:id};
  $$('[data-mp]').forEach(function(x){x.addEventListener('change',function(){var id=x.getAttribute('data-mp'),v=Math.max(0,Math.round(+x.value||0));var a=MO.a.filter(function(y){return y.id===id})[0];if(a)a.p=v;else ed(id).p=v;saveMO();log(t('log_price')+': '+nm(id)+', '+money(v));toast(t('saved'))})});
  $$('[data-mn]').forEach(function(x){x.addEventListener('change',function(){var id=x.getAttribute('data-mn'),v=x.value.trim();if(!v)return;var a=MO.a.filter(function(y){return y.id===id})[0];if(a)a.n=v;else ed(id).n=v;saveMO();log(t('log_name')+': '+v);toast(t('saved'))})});
  $$('[data-mt]').forEach(function(x){x.addEventListener('change',function(){var id=x.getAttribute('data-mt');ed(id).t=x.value;saveMO();log(t('f_tag')+': '+nm(id)+' · '+(x.value?t('tag_'+x.value):t('tag_none')));toast(t('saved'))})});
  $$('[data-mh]').forEach(function(b){b.addEventListener('click',function(){var id=b.getAttribute('data-mh'),e=ed(id);e.h=!e.h;saveMO();log((e.h?t('log_hide'):t('log_show'))+': '+nm(id));go('menu')})});
  $$('[data-md]').forEach(function(b){b.addEventListener('click',function(){var id=b.getAttribute('data-md');log(t('del')+': '+nm(id));MO.a=MO.a.filter(function(y){return y.id!==id});delete MO.e[id];saveMO();go('menu')})});
  var q=$('#mq');q.addEventListener('input',function(){mf.q=q.value;var pos=q.selectionStart;go('menu');var n=$('#mq');n.focus();try{n.setSelectionRange(pos,pos)}catch(e){}});
  $('#mcat').addEventListener('change',function(e){mf.cat=e.target.value;go('menu')});
  var add=$('#addi'),f=$('#addf');if(!add)return;
  add.addEventListener('click',function(){f.hidden=false;$('#af-n').focus()});$('#af-x').addEventListener('click',function(){f.hidden=true});
  f.addEventListener('submit',function(e){e.preventDefault();var n=$('#af-n').value.trim(),pr=Math.round(+$('#af-p').value||0);if(!n||!pr){toast(t('need_np'));return}
    var file=$('#af-f').files[0],done=function(img){var id='n'+Date.now().toString(36);MO.a.push({id:id,cat:$('#af-cat').value,n:n,p:pr,w:+$('#af-w').value||null,d:$('#af-d').value.trim(),img:img||null});if($('#af-t').value)ed(id).t=$('#af-t').value;
      try{saveMO()}catch(x){MO.a.pop();toast(t('too_big'));return}log(t('log_add')+': '+n+', '+money(pr));toast(t('added_ok'));mf.cat=$('#af-cat').value;go('menu')};
    if(!file)return done(null);
    /* Фото уменьшаем до 800 px в браузере: в макете оно живёт в этом браузере. */
    var r=new FileReader();r.onload=function(){var im=new Image();im.onload=function(){var k=Math.min(1,800/im.width),c=d.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);done(c.toDataURL('image/jpeg',.82))};im.onerror=function(){done(null)};im.src=r.result};r.readAsDataURL(file)})}
/* Доставка и сайт: каждое изменение сразу в памяти, сайт подхватывает. */
function bindSet(tab){
  var save=function(what){saveSET();log(what);toast(t('saved'))};
  $$('[data-set]').forEach(function(x){x.addEventListener('change',function(){SET[x.getAttribute('data-set')]=x.checked;save(t(x.getAttribute('data-set')==='pause'?'pause':'banner_on')+': '+(x.checked?t('on'):t('off')))})});
  $$('[data-stext]').forEach(function(x){x.addEventListener('change',function(){SET[x.getAttribute('data-stext')]=x.value.trim();save(t(x.getAttribute('data-stext')==='hours'?'hours':'banner_text')+': '+x.value.trim())})});
  $$('[data-dset]').forEach(function(x){x.addEventListener('change',function(){SET.dlv[x.getAttribute('data-dset')]=x.checked;save(t(x.getAttribute('data-dset')==='on'?'dlv_on':'pick_on')+': '+(x.checked?t('on'):t('off')))})});
  $$('[data-dnum]').forEach(function(x){x.addEventListener('change',function(){SET.dlv[x.getAttribute('data-dnum')]=Math.max(0,+x.value||0);save(t('dlv_'+x.getAttribute('data-dnum'))+': '+money(+x.value||0))})});
  $$('[data-z]').forEach(function(x){x.addEventListener('change',function(){var z=SET.dlv.zones[+x.getAttribute('data-z')],k=x.getAttribute('data-zk');z[k]=k==='n'?x.value.trim():Math.max(0,+x.value||0);save(t('zones')+': '+z.n)})});
  $$('[data-zdel]').forEach(function(b){b.addEventListener('click',function(){var z=SET.dlv.zones.splice(+b.getAttribute('data-zdel'),1)[0];save(t('del')+': '+z.n);go('dlv')})});
  var za=$('#zadd');if(za)za.addEventListener('click',function(){SET.dlv.zones.push({n:t('z_new'),p:0,m:60});save(t('z_add'));go('dlv')});
  $$('[data-bset]').forEach(function(x){x.addEventListener('change',function(){SET.book[x.getAttribute('data-bset')]=x.value;save(t('book_set')+': '+SET.book.from+'-'+SET.book.to)})});
  $$('[data-bnum]').forEach(function(x){x.addEventListener('change',function(){SET.book.max=Math.max(1,+x.value||1);save(t('book_max')+': '+SET.book.max)})});
  $$('[data-bset2]').forEach(function(x){x.addEventListener('change',function(){SET.book[x.getAttribute('data-bset2')]=x.checked;save(t(x.getAttribute('data-bset2')==='auto'?'auto_ok':'pre_on')+': '+(x.checked?t('on'):t('off')))})})}

/* Быстрая бронь по звонку: то же действие, что на сайте, источник «звонок». */
function newBook(){var l=get('ag-book-1',[]),id=2200+l.length+1;l.unshift({id:id,at:Date.now(),date:t('today'),time:'21:00',ppl:2,name:pick(P.names),ph:'+998 9* *** ** **',note:'',st:1,src:'call'});put('ag-book-1',l);log(t('new_book')+' #'+id);toast(t('new_book')+' #'+id);go('book')}

/* ── «The Dot Does The Work»: выгрузка с настоящим ходом ─────────────
   Файл собирается в браузере из демо-данных сразу, поэтому ход идёт по
   «полу» времени minMs: не впереди байтов, не назад. В конце пружина и
   «Открыть». Без движения — ровная дуга без волны. */
function csv(rows){return'﻿'+rows.map(function(r){return r.map(function(c){c=String(c==null?'':c);return/[";\n]/.test(c)?'"'+c.replace(/"/g,'""')+'"':c}).join(';')}).join('\n')}
function makeFile(kind,id){
  if(kind==='book')return new Blob([csv([[t('no'),t('when'),t('guests_h'),t('name'),t('phone'),t('from'),t('status')]].concat(rows('ag-book-1',demoBook).map(function(x){return[x.id,x.date+' '+x.time,x.ppl,x.name,x.ph,t('src_'+x.src),t(BST[x.st])]})))],{type:'text/csv'});
  if(kind==='ord')return new Blob([csv([[t('no'),t('time'),t('name'),t('phone'),t('items'),t('total'),t('status')]].concat(rows('ag-ord-1',demoOrd).map(function(x){return[x.id,hm(x.at),x.name,x.ph,x.items.map(function(it){return byId[it[0]]?byId[it[0]].n+' x'+it[1]:''}).join(', '),x.sum,t(OST[x.st])]})))],{type:'text/csv'});
  var o=rows('ag-ord-1',demoOrd).filter(function(x){return x.id===id})[0];
  return new Blob(['<!doctype html><meta charset="utf-8"><title>'+t('bill')+' '+id+'</title><body style="font:16px system-ui;max-width:420px;margin:40px auto"><h1 style="font-weight:400">AGORA Lounge &amp; bar</h1><p>'+esc(P.street)+'</p><h2>'+t('bill')+' #'+id+'</h2><table style="width:100%">'+o.items.map(function(it){var m=byId[it[0]];return'<tr><td>'+esc(m.n)+' x'+it[1]+'</td><td style="text-align:right">'+money(m.p*it[1])+'</td></tr>'}).join('')+'</table><h3 style="text-align:right">'+t('total')+': '+money(o.sum)+'</h3><p style="color:#888">'+t('demo_line')+'</p></body>'],{type:'text/html'})}
function pacer(minMs){var t0=performance.now(),shown=0;return function(raw){shown=Math.max(shown,Math.min(raw,(performance.now()-t0)/minMs));return shown}}
function dot(b){if(b._d)return;b._d=1;var ring=$('circle',b),L=2*Math.PI*21,url=null;ring.style.strokeDasharray=L;ring.style.strokeDashoffset=L;
  b.setAttribute('aria-live','polite');
  b.addEventListener('click',function(){
    if(b.classList.contains('done')){var a=d.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';a.click();return}
    if(b.classList.contains('run'))return;
    b.classList.add('run');b.setAttribute('role','progressbar');b.setAttribute('aria-valuemin','0');b.setAttribute('aria-valuemax','100');
    var blob=makeFile(b.getAttribute('data-dl'),+b.getAttribute('data-id')),pc=pacer(RM?200:/*~*/1100),wat=$('.dot-water i',b);
    url=URL.createObjectURL(blob);
    (function fr(){var p=pc(1);ring.style.strokeDashoffset=(L*(1-p)).toFixed(2);wat.style.transform='translateY('+((1-p)*100).toFixed(1)+'%)';b.setAttribute('aria-valuenow',String(Math.round(p*100)));
      if(p<1)return requestAnimationFrame(fr);
      b.classList.remove('run');b.classList.add('done');b.removeAttribute('role');b.removeAttribute('aria-valuenow');$('.dot-l',b).textContent=t('open');
      var a=d.createElement('a');a.href=url;a.download=b.getAttribute('data-name');d.body.appendChild(a);a.click();a.remove();log(t('log_dl')+': '+b.getAttribute('data-name'));toast(t('ready'))})()})}

/* Изменения с сайта и из бота — сразу в панели, с отметкой на иконке. */
addEventListener('storage',function(e){if(!S.in||!$('#view'))return;if(/^ag-(book|ord|bot)-1$/.test(e.key)){badges();if(['book','ord','bot','sum'].indexOf(cur)>=0)go(cur);toast(t('new_in'))}});
if(S.in)shell();else login();
})();
