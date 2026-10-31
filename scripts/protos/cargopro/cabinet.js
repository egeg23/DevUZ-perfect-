/* CARGO PRO GROUP: клиентский раздел (доп «cab»). Вход через Telegram или
   кодом по телефону (демо: окно Telegram и код на экране, сеть не трогаем),
   «Мои грузы» со статусами из той же памяти браузера, что пишут админка и
   супер-админка (cp-panel-1), карта с машиной в пути, привязка заказа к
   Telegram через бота и превью чата бота. Состояние: cp-cab-1. Прокрутку не
   перехватываем, движение только transform и opacity. */
(function(){
var d=document,w=window,$=function(s,r){return(r||d).querySelector(s)},$$=function(s,r){return[].slice.call((r||d).querySelectorAll(s))};
var D=JSON.parse($('#cb-data').textContent),U=D.ui,ST=D.st;
var RM=w.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function t(k){return U[k]}
function get(k,def){try{var v=localStorage.getItem(k);return v?JSON.parse(v):def}catch(e){return def}}
function put(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function cl(v){return v<0?0:v>1?1:v}
function sub(s,o){return s.replace(/\{(\w+)\}/g,function(_,k){return o[k]})}
var toastT=0;function toast(m){var e=$('#toast');e.textContent=m;e.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){e.classList.remove('on')},2400)}
var lanes={};D.lanes.forEach(function(x){lanes[x.id]=x});

/* Шапка: прячется при любой прокрутке, возвращается через 3 с после последнего события. */
var top=$('.top'),IDLE=3000,idleT=0;
function headIdle(){if(!top)return;clearTimeout(idleT);
  if(!top.contains(d.activeElement))top.classList.add('hide');
  idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}
addEventListener('scroll',headIdle,{passive:true});

/* Демо-клиент и водитель: слова-ловушки, при показе: выдуманные слова клиента. */
var TN=['[[t:13]]','[[t:14]]','[[t:15]]'];
var DRV=TN[0]+' A.',CLIENT=TN[2],COMP=t('co')+' «'+TN[1]+'»';
var S=get('cp-cab-1',{});S.links=S.links||{};S.nt=S.nt||{dep:1,cus:1,arr:1,doc:1,idle:1};S.msgs=S.msgs||[];S.seen=S.seen||{};
function save(){put('cp-cab-1',S)}
var tab=(location.hash.slice(1)||'orders'),pickId=null;

/* Заказы: демо-номера (те же, что на сайте и в супер-админке) и заявки с сайта. */
var DEMO=[['CPG-24117','cn','air',4],['CPG-24109','tr','auto',3],['CPG-24095','ae','sea',5]];
function stOf(id,def){var P=get('cp-panel-1',{});return P.st&&P.st[id]!==undefined?P.st[id]:def}
function orders(){var site=get('cp-req-1',[]).map(function(r){return{id:r.id,dir:r.dir,m:r.m,s:stOf(r.id,0),site:1}});
  return site.concat(DEMO.map(function(x){return{id:x[0],dir:x[1],m:x[2],s:stOf(x[0],x[3])}}))}
function byId(id){return orders().filter(function(o){return o.id===id})[0]}
function town(){return D.town}
function days(o){var r=lanes[o.dir]&&lanes[o.dir][o.m],m=r?String(r.days).match(/\d+/g):null;return m?(+m[0]+ +(m[1]||m[0]))/2:5}

/* Бот: сообщения появляются, когда статус привязанного заказа меняется. */
function bot(x,me){S.msgs.push({x:x,me:!!me,at:Date.now()});S.msgs=S.msgs.slice(-24)}
function sync(){var ch=false;orders().forEach(function(o){var was=S.seen[o.id];
    if(was!==undefined&&was!==o.s&&S.links[o.id]){ch=true;
      if(o.s===3&&S.nt.dep)bot(sub(t('b_dep'),{id:o.id,dr:DRV}));
      else if(o.s===4&&S.nt.cus)bot(sub(t('b_cus'),{id:o.id}));
      else if(o.s===5){if(S.nt.arr)bot(sub(t('b_arr'),{id:o.id}));if(S.nt.doc)bot(sub(t('b_doc'),{id:o.id}))}
      else bot(sub(t('b_st'),{id:o.id,st:ST[o.s]}))}
    S.seen[o.id]=o.s});
  save();return ch}

/* ── Экраны ──────────────────────────────────────────────────────── */
var app=$('#cb-app');
function cfgOn(){return get('cp-cfg-1',{}).cab!==false}
function applyMods(){var c=get('cp-cfg-1',{});$$('[data-module]').forEach(function(e){e.classList.toggle('off',c['m_'+e.getAttribute('data-module')]===false)})}
function render(){applyMods();
  if(!cfgOn()){app.innerHTML='<section class="cb-card cb-off"><h2>'+t('off_h')+'</h2><p class="mu">'+t('off_e')+'</p><a class="btn btn-a" href="'+D.home+'#offer">'+t('to_offer')+'</a></section>';return}
  if(!S.u){app.innerHTML=vLogin();bindLogin();return}
  var tabs=['orders','map','tg'];
  app.innerHTML='<section class="cb-hi"><div><p class="kick"><i></i>'+t('kick')+' · '+t('demo')+'</p><h1>'+t('hello')+', '+esc(S.u.n)+'</h1><p class="mu">'+esc(S.u.co)+' · '+t(S.u.via==='tg'?'via_tg':'via_ph')+'</p></div><button type="button" class="btn btn-g btn-s" id="cbout">'+t('logout')+'</button></section>'+
    '<nav class="cb-tabs" role="tablist">'+tabs.map(function(k){return'<a role="tab" href="#'+k+'" aria-selected="'+(k===tab)+'">'+t('tab_'+k)+'</a>'}).join('')+'</nav>'+
    '<div id="cbv">'+(tab==='map'?vMap():tab==='tg'?vTg():vOrders())+'</div>';
  $('#cbout').addEventListener('click',function(){S.u=null;save();render()});
  if(tab==='map')startMap();else stopMap();
  bindView()}

function vLogin(){return'<section class="cb-login cb-card glass rise on"><p class="kick"><i></i>'+t('kick')+'</p><h1>'+t('login_h')+'</h1><p class="mu">'+t('login_e')+'</p>'+
  '<button type="button" class="btn btn-tg" id="intg">'+D.tgIcon+'<span>'+t('tg_in')+'</span></button>'+
  '<details class="cb-ph"><summary>'+t('ph_in')+'</summary><div class="cb-phf"><label class="fld"><span>'+t('phone')+'</span><input id="inph" type="tel" inputmode="tel" autocomplete="tel" placeholder="+998"></label><button type="button" class="btn btn-g" id="incode">'+t('get_code')+'</button>'+
  '<div id="incb" hidden><p class="cb-code" id="incc"></p><label class="fld"><span>'+t('code')+'</span><input id="inc" inputmode="numeric" maxlength="4" autocomplete="one-time-code"></label><button type="button" class="btn btn-a" id="ingo">'+t('enter')+'</button></div></div></details></section>'}
var code='';
function bindLogin(){
  $('#intg').addEventListener('click',function(){
    openSheet(t('tg_ask'),'<div class="cb-tga"><span class="cb-av" aria-hidden="true">'+esc(CLIENT.charAt(0)||'C')+'</span><div><b>'+esc(CLIENT)+'</b><small>@'+esc(CLIENT.toLowerCase())+'</small></div></div><p class="mu">'+t('tg_ask_e')+'</p><p class="cb-note">'+t('tg_demo')+'</p>',
      '<button type="button" class="btn btn-tg" id="tgok">'+t('tg_ok')+'</button><button type="button" class="btn btn-g" data-close>'+t('cancel')+'</button>');
    $('#tgok').addEventListener('click',function(){login('tg');closeSheet()})});
  $('#incode').addEventListener('click',function(){var p=$('#inph').value.replace(/\D/g,'');if(p.length<9){toast(t('bad_ph'));return}
    code=String(1000+Math.floor(Math.random()*9000));$('#incc').textContent=t('code_demo')+': '+code.split('').join(' ');$('#incb').hidden=false;$('#inc').focus()});
  $('#ingo').addEventListener('click',function(){if($('#inc').value.trim()!==code){toast(t('bad_code'));return}login('ph')})}
function login(via){S.u={n:CLIENT,co:COMP,via:via};sync();save();tab='orders';render();toast(t('hello')+', '+CLIENT)}

function tl(o){return'<ol class="cb-tl">'+ST.map(function(s,i){return'<li class="'+(i<o.s?'d':i===o.s?'c':'')+'"><i aria-hidden="true"></i><span>'+s+'</span></li>'}).join('')+'</ol>'}
function vOrders(){var all=orders();if(!all.length)return'<p class="mu">'+t('none')+'</p>';
  return'<p class="mu cb-e">'+t('orders_e')+'</p><div class="cb-list">'+all.map(function(o,i){var x=lanes[o.dir]||{},ln=S.links[o.id];
    return'<article class="cb-card cb-o '+['rise','slide','pop'][i%3]+' on" data-o="'+o.id+'"><header><b>'+o.id+'</b>'+(o.site?'<span class="cb-new">'+t('from_site')+'</span>':'')+'<span class="st s'+o.s+'">'+ST[o.s]+'</span></header>'+
    '<p class="cb-rt">'+esc(x.c||'')+' → '+town()+' · '+esc(D.mode[o.m])+'</p>'+tl(o)+
    '<div class="cb-docs"><b>'+t('docs')+'</b>'+['d_cmr','d_inv','d_act'].map(function(k){var ok=o.s>=5||(k!=='d_act'&&o.s>=3);return'<button type="button" class="cb-doc" data-dl'+(ok?'':' disabled')+'>'+D.docIcon+'<span>'+t(k)+'</span>'+(ok?'':'<small>'+t('d_wait')+'</small>')+'</button>'}).join('')+'</div>'+
    '<div class="cb-act">'+(o.s>=3&&o.s<5?'<button type="button" class="btn btn-a btn-s" data-map="'+o.id+'">'+t('see_map')+'</button>':'')+
    '<a class="btn btn-'+(ln?'g':'tg')+' btn-s" data-link="'+o.id+'" href="'+D.bot+'?start=order_'+o.id+'" target="_blank" rel="noopener">'+D.tgIcon+'<span>'+t(ln?'tg_linked':'tg_link')+'</span></a>'+
    '<a class="btn btn-g btn-s" data-rep="'+o.id+'" href="'+D.site+'#calc">'+t('repeat')+'</a></div></article>'}).join('')+'</div>'}

/* ── Карта: машина едет по маршруту, точки пройденные и следующие ───── */
/* Схема одна на все направления: отправление справа, Ташкент слева, дуга через границу. */
var FROM=[860,450],TAS=[220,170];
var KM={cn:4600,tr:4300,ae:2900,in:2600,eu:6000};
var STOPS=[['s_wh',0,1],['s_bord',.42,-1],['s_cus',.8,1],['s_out',1,-1]];
function path(){return'M'+FROM[0]+' '+FROM[1]+' C 700 120, 360 470, '+TAS[0]+' '+TAS[1]}
function moving(){return orders().filter(function(o){return o.s>=3&&o.s<5}).sort(function(a,b){return a.s-b.s})}
function k0(o){var h=o.id.split('').reduce(function(a,c){return a+c.charCodeAt(0)},0);return o.s===4?.8:.24+(h%30)/100}
var T0=Date.now(),raf=0,ping=0;
function kOf(o){if(o.s>=4)return o.s===4?.8:1;return Math.min(.78,k0(o)+(Date.now()-T0)/1000* /*~*/.0011)}
function vMap(){var mv=moving();if(!pickId||!byId(pickId))pickId=mv.length?mv[0].id:(orders()[0]||{}).id;var o=byId(pickId);
  var sel='<label class="fld cb-pick"><span>'+t('map_pick')+'</span><select id="cbpick">'+orders().map(function(x){return'<option value="'+x.id+'"'+(x.id===pickId?' selected':'')+'>'+x.id+' · '+ST[x.s]+'</option>'}).join('')+'</select></label>';
  if(!o)return'<p class="mu">'+t('map_none')+'</p>';
  if(o.s<3)return sel+'<section class="cb-card"><p class="mu">'+t('map_wait')+'</p>'+tl(o)+'</section>';
  if(o.s>=5)return sel+'<section class="cb-card"><p class="mu">'+t('map_done')+'</p>'+tl(o)+'</section>';
  var allow=(get('cp-disp-1',{}).ic||{}).dph!==false;
  return sel+'<div class="cb-map"><div class="cb-mapv cb-card"><svg viewBox="0 0 1000 600" aria-hidden="true" focusable="false">'+D.dots+
    '<path class="cb-r0" d="'+path()+'"/><path class="cb-r1" id="cbr" d="'+path()+'"/>'+
    STOPS.map(function(s,i){return'<g class="cb-stop" data-st="'+i+'"><circle r="10"/><text y="'+(s[2]>0?-22:38)+'" style="text-anchor:'+(i===0?'end':i===STOPS.length-1?'start':'middle')+'">'+t(s[0])+'</text></g>'}).join('')+
    '<g class="cb-truck" id="cbtr"><circle r="24"/><g transform="translate(-12 -12)">'+D.truck+'</g></g></svg><p class="cb-note">'+t('map_note')+'</p></div>'+
    '<aside class="cb-card cb-side"><h3>'+o.id+'</h3><p class="mu">'+esc((lanes[o.dir]||{}).c||'')+' → '+town()+' · '+esc(D.mode[o.m])+'</p>'+
    '<div class="cb-kv"><span>'+t('eta')+'</span><b id="cbeta"></b><span>'+t('left')+'</span><b id="cbleft"></b><span>'+t('speed')+'</span><b id="cbspd"></b><span>'+t('upd')+'</span><b id="cbupd"></b></div>'+
    '<div class="cb-bar"><i id="cbbar"></i></div>'+
    '<h4>'+t('stops')+'</h4><ul class="cb-stops" id="cbstops"></ul>'+
    '<div class="cb-drv"><span class="cb-av" aria-hidden="true">'+esc(DRV.charAt(0))+'</span><div><small>'+t('driver')+' · '+t('demo')+'</small><b>'+esc(DRV)+'</b></div></div>'+
    (allow?'<a class="btn btn-a btn-s" href="tel:'+D.drvTel+'">'+t('call_drv')+' · '+t('demo')+'</a>':'<p class="mu">'+t('drv_hidden')+'</p><a class="btn btn-g btn-s" href="tel:'+D.tel+'">'+t('call_disp')+'</a>')+'</aside></div>'}
function startMap(){stopMap();var o=byId(pickId);if(!o||o.s<3||o.s>=5)return;var p=$('#cbr'),L=p&&p.getTotalLength?p.getTotalLength():800;
  if(p){p.style.strokeDasharray=L;p.style.strokeDashoffset=L}
  $$('.cb-stop').forEach(function(g,i){var q=p.getPointAtLength(L*STOPS[i][1]);g.setAttribute('transform','translate('+q.x.toFixed(1)+' '+q.y.toFixed(1)+')')});
  ping=Date.now();
  function frame(){var o2=byId(pickId);if(!o2||!$('#cbtr')){raf=0;return}var k=kOf(o2),q=p.getPointAtLength(L*k);
    $('#cbtr').setAttribute('transform','translate('+q.x.toFixed(1)+' '+q.y.toFixed(1)+')');p.style.strokeDashoffset=(L*(1-k)).toFixed(1);
    $('#cbbar').style.transform='scaleX('+k.toFixed(3)+')';
    var rest=(1-k)*days(o2),eta=new Date(Date.now()+rest*864e5);$('#cbeta').textContent=('0'+eta.getDate()).slice(-2)+'.'+('0'+(eta.getMonth()+1)).slice(-2)+' · '+(rest<1?Math.max(1,Math.round(rest*24))+' '+t('h'):rest.toFixed(1).replace('.',D.l==='ru'?',':'.')+' '+t('d'));
    $('#cbleft').textContent=fmt((KM[o2.dir]||3000)*(1-k))+' '+t('km');
    $('#cbspd').textContent=(o2.s===4?0:62+Math.round(Math.sin(Date.now()/9000)*7+7))+' '+t('kmh');
    var sec=Math.floor((Date.now()-ping)/1000);if(sec>14)ping=Date.now();$('#cbupd').textContent=sec+' '+t('sec_ago');
    $('#cbstops').innerHTML=STOPS.map(function(s,i){var ok=k>=s[1]-.001;return'<li class="'+(ok?'ok':'')+'"><i aria-hidden="true"></i><span>'+t(s[0])+'</span><small>'+t(ok?'passed':'next')+'</small></li>'}).join('');
    $$('.cb-stop').forEach(function(g,i){g.classList.toggle('ok',k>=STOPS[i][1]-.001)});
    raf=RM?0:requestAnimationFrame(frame)}
  frame()}
function stopMap(){if(raf)cancelAnimationFrame(raf);raf=0}

/* ── Telegram: привязка заказа и превью чата бота ───────────────────── */
function vTg(){var n=Object.keys(S.links).length;
  return'<div class="cb-tg"><section class="cb-card"><h2>'+t('tg_h')+'</h2><p class="mu">'+t('tg_e')+'</p><p class="cb-note">'+t('bot_note')+'</p>'+
  '<p class="cb-cnt">'+t('linked_n')+': <b id="cbn">'+n+'</b></p>'+
  '<div class="cb-act">'+orders().slice(0,4).map(function(o){var ln=S.links[o.id];return'<a class="btn btn-'+(ln?'g':'tg')+' btn-s" data-link="'+o.id+'" href="'+D.bot+'?start=order_'+o.id+'" target="_blank" rel="noopener">'+D.tgIcon+'<span>'+o.id+': '+t(ln?'tg_linked':'tg_link')+'</span></a>'}).join('')+'</div>'+
  '<h3>'+t('notif')+'</h3><div class="cb-nt">'+['dep','cus','arr','doc','idle'].map(function(k){return'<label class="opt"><input type="checkbox" data-nt="'+k+'"'+(S.nt[k]?' checked':'')+'><span class="sw"></span><span class="ot"><b>'+t('n_'+k)+'</b></span></label>'}).join('')+'</div>'+
  '<button type="button" class="btn btn-g btn-s" id="cbidle">'+t('idle_try')+'</button></section>'+
  '<div class="phone" aria-label="Telegram"><div class="scr"><div class="tgh"><i></i><b>@cargoprogroup_bot</b></div><div class="chat on" id="cbchat">'+chat()+'</div></div></div></div>'}
function chat(){if(!S.msgs.length)return'<div class="bt">'+t('bot_empty')+'</div>';return S.msgs.map(function(m){return'<div class="bt'+(m.me?' me':'')+'">'+esc(m.x)+'</div>'}).join('')}
function link(id){if(S.links[id])return;S.links[id]=Date.now();bot('/start order_'+id,true);bot(sub(t('b_linked'),{id:id}));save()}

function bindView(){var v=$('#cbv');
  $$('[data-dl]',v).forEach(function(b){b.addEventListener('click',function(){toast(t('dl_demo'))})});
  $$('[data-map]',v).forEach(function(b){b.addEventListener('click',function(){pickId=b.getAttribute('data-map');location.hash='map'})});
  $$('[data-rep]',v).forEach(function(a){a.addEventListener('click',function(){toast(t('repeat_t'))})});
  $$('[data-link]',v).forEach(function(a){a.addEventListener('click',function(){link(a.getAttribute('data-link'));render()})});
  $$('[data-nt]',v).forEach(function(c){c.addEventListener('change',function(){S.nt[c.getAttribute('data-nt')]=c.checked?1:0;save()})});
  var idle=$('#cbidle',v);if(idle)idle.addEventListener('click',function(){var o=moving()[0]||orders()[0];if(!o)return;if(!S.nt.idle){toast(t('n_idle')+': off');return}bot(sub(t('b_idle'),{id:o.id}));save();render()});
  var pk=$('#cbpick',v);if(pk)pk.addEventListener('change',function(){pickId=pk.value;render()});
  var ch=$('#cbchat',v);if(ch)ch.scrollTop=ch.scrollHeight}

/* ── Окно ──────────────────────────────────────────────────────────── */
var sheet=$('#sheet');
function openSheet(h,b,f){$('#shh').textContent=h;$('#shb').innerHTML=b;$('#shf').innerHTML=f||'';sheet.classList.add('on');d.body.style.overflow='hidden';var x=$('button',$('#shf'))||$('.x',sheet);x.focus()}
function closeSheet(){sheet.classList.remove('on');d.body.style.overflow=''}
sheet.addEventListener('click',function(e){if(e.target.closest('[data-close]'))closeSheet()});
addEventListener('keydown',function(e){if(e.key==='Escape'&&sheet.classList.contains('on'))closeSheet()});

addEventListener('hashchange',function(){tab=location.hash.slice(1)||'orders';if(['orders','map','tg'].indexOf(tab)<0)tab='orders';render()});
/* Статус из админки или супер-админки: таймлайн и бот обновляются сами. */
addEventListener('storage',function(e){if(e.key==='cp-panel-1'||e.key==='cp-req-1'){sync();if(S.u)render()}if(e.key==='cp-cfg-1'||e.key==='cp-disp-1')render()});
if(['orders','map','tg'].indexOf(tab)<0)tab='orders';
sync();render();
})();
