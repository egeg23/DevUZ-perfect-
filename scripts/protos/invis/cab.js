(function(){
'use strict';
/* cab: кабинет игрока и пульт администратора. Одна страница на каждый,
   вкладки без перезагрузки. Брони и колесо — из core.js (IV), поэтому то,
   что сделано на странице клуба, видно здесь. Данные клиентов и смен демо. */
var d=document,IV=window.IV,C=JSON.parse(d.getElementById('cab-data').textContent),TR=C.tr,U=IV.ui;
var esc=IV.esc,sum=IV.sum,grp=IV.grp,hh=IV.hh;
var $=function(s,r){return (r||d).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))};
var embed=/[?&]embed=1/.test(location.search);if(embed)d.documentElement.classList.add('embed');
var box=$('#cb');
function ic(k){return '<svg class="ic" aria-hidden="true"><use href="#i-'+k+'"/></svg>'}
function toast(t){var el=$('.cb-toast');if(!el){el=d.createElement('div');el.className='cb-toast';el.setAttribute('role','status');d.body.appendChild(el)}el.textContent=t;el.classList.remove('on');void el.offsetWidth;el.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(function(){el.classList.remove('on')},2600)}
function S(){return IV.state()}

var TABS=C.kind==='player'?[
  ['home','pc',TR.tHome],['book','clock',TR.tBook],['wallet','card',TR.tWallet],['bonus','gift',TR.tBonus],['friends','users',TR.tFriends]
]:[
  ['hall','pc',TR.aHall],['bookings','clock',TR.aBookings],['clients','users',TR.aClients],['tariffs','card',TR.aTariffs],['wheel','chart',TR.aWheel],['shifts','shield',TR.aShifts]
];
var cur=TABS[0][0];
try{var h=location.hash.slice(1);if(TABS.some(function(t){return t[0]===h}))cur=h}catch(e){}

function shell(){
  box.innerHTML='<aside class="cb-side"><a class="cb-logo" href="'+C.site+'" target="_top"><svg aria-hidden="true"><use href="#iv-mark"/></svg><b>INVIS</b><small>'+(C.kind==='player'?TR.player:TR.admin)+'</small></a>'+
    '<nav class="cb-nav" aria-label="'+TR.sections+'">'+TABS.map(function(t){return '<button type="button" data-tab="'+t[0]+'">'+ic(t[1])+'<span>'+esc(t[2])+'</span></button>'}).join('')+'</nav>'+
    '<div class="cb-sfoot"><a href="'+(C.kind==='player'?C.adminUrl:C.playerUrl)+'" target="_top">'+(C.kind==='player'?TR.toAdmin:TR.toPlayer)+'</a><a href="'+C.other+'" target="_top">'+(C.lang==='ru'?'O‘zbekcha':'Русский')+'</a></div></aside>'+
    '<main class="cb-main"><header class="cb-top"><h1 class="cb-h"></h1><div class="cb-me">'+(C.kind==='player'?'<span class="cb-bal num" id="cb-bal"></span>':'<span class="cb-live"><span class="dot"></span>'+esc(TR.onShift)+' '+esc(C.admins[0])+'</span>')+'</div></header><div class="cb-body" id="cb-body"></div></main>';
  $$('.cb-nav button').forEach(function(b){b.addEventListener('click',function(){go(b.getAttribute('data-tab'))})});
}
function go(t){cur=t;try{history.replaceState(null,'','#'+t)}catch(e){}render();var m=$('.cb-main');if(m)m.scrollTop=0;scrollTo(0,0)}
function render(){
  $$('.cb-nav button').forEach(function(b){b.setAttribute('aria-current',b.getAttribute('data-tab')===cur?'page':'false')});
  var tab=TABS.filter(function(t){return t[0]===cur})[0];$('.cb-h').textContent=tab[2];
  var body=$('#cb-body');body.className='cb-body v-'+cur;body.innerHTML='';
  (V[cur]||function(){})(body);
  var bal=$('#cb-bal');if(bal)bal.innerHTML=ic('card')+sum(S().balance);
}
var V={};
function card(cls,html){return '<div class="cc '+(cls||'')+'">'+html+'</div>'}
function dayName(day){var t=IV.tash().day;return day===t?U.today:U.tomorrow}
function active(){var t=IV.tash();return S().bookings.filter(function(b){return !b.cancel&&(b.day>t.day||(b.day===t.day&&b.from+b.dur>t.h))})}

/* ── Игрок ── */
V.home=function(el){
  var s=S(),nb=active()[0],sp=s.spins.filter(function(x){return x.day===IV.tash().day})[0];
  var lv=level(s.points);
  el.innerHTML='<p class="cb-hi">'+esc(TR.hi.replace('{nick}',IV.data.me.nick))+'</p>'+
    '<div class="cc-grid">'+
    card('cc-bal','<p class="cc-k">'+TR.balance+'</p><p class="cc-big num">'+sum(s.balance)+'</p><p class="cc-sub">'+ic('gift')+' <b class="num">'+s.bonus+'</b> '+TR.bonusHours+'</p><button type="button" class="b-pri" data-go="wallet">'+TR.topup+'</button>')+
    card('cc-next',nb?'<p class="cc-k">'+TR.nextBook+'</p><p class="cc-mid">'+esc(nb.zn)+' · '+nb.seat+'</p><p class="cc-sub">'+dayName(nb.day)+', '+hh(nb.from)+'-'+hh(nb.from+nb.dur)+'</p><p class="cc-sync">'+ic('sync')+' '+esc(nb.sys)+'</p>':'<p class="cc-k">'+TR.nextBook+'</p><p class="cc-sub">'+TR.noBook+'</p><button type="button" class="b-pri" data-go="book">'+TR.bookNow+'</button>')+
    card('cc-wh','<p class="cc-k">'+TR.wheelDay+'</p><p class="cc-mid">'+(sp?(sp.hours?'+'+sp.hours+' '+TR.h:TR.noWin):TR.wheelReady)+'</p><button type="button" class="b-gl" data-go="bonus">'+(sp?TR.toBonus:U.spin)+'</button>')+
    card('cc-lv','<p class="cc-k">'+TR.level+'</p><p class="cc-mid" style="color:'+lv.c+'">'+esc(lv.n)+'</p><div class="bar"><i style="transform:scaleX('+lv.k.toFixed(3)+')"></i></div><p class="cc-sub num">'+grp(s.points)+' / '+grp(lv.next)+' '+TR.points+'</p>')+
    '</div>'+
    '<h2 class="cb-h2">'+TR.zonesNow+'</h2><div class="cc-zones">'+IV.data.zones.map(function(z){return '<button type="button" class="cz" data-go="book" style="--zc:'+z.c+'"><b>'+esc(z.n)+'</b><span class="num">'+grp(z.hour)+' '+U.sum+' / '+TR.h+'</span></button>'}).join('')+'</div>';
};
function level(p){var L=C.levels,i=0;while(i<L.length-1&&p>=L[i+1].from)i++;var nx=L[i+1]?L[i+1].from:L[i].from;return {n:L[i].n,c:L[i].c,next:nx,k:L[i+1]?(p-L[i].from)/(nx-L[i].from):1}}
V.book=function(el){
  el.innerHTML='<div class="cc cc-hall" id="cb-hall"></div><h2 class="cb-h2">'+TR.myBooks+'</h2><div id="cb-mine"></div>';
  IV.hall($('#cb-hall'),{onBook:mineList});mineList();
};
function mineList(){var m=$('#cb-mine');if(!m)return;var a=active();
  m.innerHTML=a.length?'<ul class="lst">'+a.map(function(b){return '<li><span><b>'+esc(b.zn)+' · '+b.seat+'</b><small>'+dayName(b.day)+', '+hh(b.from)+'-'+hh(b.from+b.dur)+' · '+esc(b.pn)+'</small><small class="ok">'+ic('sync')+' '+esc(TR.inSys.replace('{sys}',b.sys))+'</small></span><span class="lst-r"><b class="num">'+sum(b.price)+'</b><button type="button" class="b-sm" data-cancel="'+b.id+'">'+TR.cancel+'</button></span></li>'}).join('')+'</ul>':'<p class="empty">'+TR.noBook+'</p>'}
V.wallet=function(el){
  var s=S(),amt=C.tops[1],pay=C.pay[0].id;
  el.innerHTML=card('cc-bal wide','<p class="cc-k">'+TR.balance+'</p><p class="cc-big num" id="w-bal">'+sum(s.balance)+'</p><p class="cc-sub">'+TR.walletNote+'</p>')+
    '<h2 class="cb-h2">'+TR.topup+'</h2><div class="cc"><div class="chips" id="w-amt">'+C.tops.map(function(a){return '<button type="button" data-amt="'+a+'">'+grp(a)+'</button>'}).join('')+'</div>'+
    '<p class="w-bonus" id="w-bonus"></p><div class="pays" id="w-pay">'+C.pay.map(function(p){return '<button type="button" data-pay="'+p.id+'" style="--pc:'+p.c+'"><b>'+esc(p.n)+'</b></button>'}).join('')+'</div>'+
    '<button type="button" class="b-pri wide" id="w-go"></button><p class="note">'+TR.payNote+'</p></div>'+
    '<h2 class="cb-h2">'+TR.visits+'</h2><ul class="lst" id="w-hist"></ul>';
  function draw(){
    $$('#w-amt button').forEach(function(b){b.setAttribute('aria-pressed',+b.getAttribute('data-amt')===amt)});
    $$('#w-pay button').forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-pay')===pay)});
    var bonus=C.topBonus.filter(function(x){return amt>=x.from}).pop();
    $('#w-bonus').innerHTML=bonus?ic('gift')+' '+esc(TR.topBonus.replace('{h}',bonus.hours)):esc(TR.topBonusFrom.replace('{s}',grp(C.topBonus[0].from)));
    $('#w-go').textContent=TR.pay+' '+sum(amt);
    var tops=S().tops.map(function(t){return '<li><span><b>'+TR.topped+'</b><small>'+esc(t.via)+' · '+TR.justNow+'</small></span><b class="num ok">+'+sum(t.amt)+'</b></li>'}).join('');
    $('#w-hist').innerHTML=tops+C.history.map(function(v){return '<li><span><b>'+esc(v.zone)+' · '+esc(v.seat)+'</b><small>'+esc(v.date)+' · '+v.hours+' '+TR.h+'</small></span><b class="num">−'+sum(v.paid)+'</b></li>'}).join('');
  }
  el.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;
    if(b.hasAttribute('data-amt')){amt=+b.getAttribute('data-amt');draw()}
    else if(b.hasAttribute('data-pay')){pay=b.getAttribute('data-pay');draw()}
    else if(b.id==='w-go'){b.disabled=true;b.textContent=TR.paying;var via=C.pay.filter(function(p){return p.id===pay})[0].n;
      setTimeout(function(){var st=S();st.balance+=amt;var bonus=C.topBonus.filter(function(x){return amt>=x.from}).pop();if(bonus)st.bonus+=bonus.hours;st.tops.unshift({amt:amt,via:via,at:Date.now()});IV.save();b.disabled=false;$('#w-bal').textContent=sum(st.balance);toast(TR.paid.replace('{s}',sum(amt)).replace('{via}',via));draw();render()},1100)}
  });
  draw();
};
V.bonus=function(el){
  var s=S(),lv=level(s.points);
  el.innerHTML='<div class="b-grid"><div class="cc cc-wheel" id="cb-wheel"></div><div class="b-side">'+
    card('','<p class="cc-k">'+TR.bonusAcc+'</p><p class="cc-big num"><span id="b-h">'+s.bonus+'</span> '+TR.h+'</p><p class="cc-sub">'+TR.bonusUse+'</p>')+
    card('','<p class="cc-k">'+TR.level+': <b style="color:'+lv.c+'">'+esc(lv.n)+'</b></p><ul class="lv">'+C.levels.map(function(x){return '<li style="--lc:'+x.c+'"><b>'+esc(x.n)+'</b><span>'+esc(x.perk)+'</span><small class="num">'+grp(x.from)+'+</small></li>'}).join('')+'</ul><p class="note">'+TR.levelNote+'</p>')+
    card('','<p class="cc-k">'+TR.myWins+'</p><ul class="wins" id="b-wins"></ul>')+'</div></div>';
  IV.wheel($('#cb-wheel'),{reset:true,onSpin:function(){var h=$('#b-h');if(h)h.textContent=S().bonus;wins()}});
  function wins(){var w=S().spins;$('#b-wins').innerHTML=w.length?w.slice(0,6).map(function(x){return '<li><span>'+esc(x.day)+'</span><b>'+(x.hours?'+'+x.hours+' '+TR.h:TR.noWin)+'</b></li>'}).join(''):'<li class="empty">'+TR.noSpins+'</li>'}
  wins();
};
V.friends=function(el){
  var link='https://t.me/invis_bot?start='+C.invite;
  el.innerHTML=card('cc-inv wide','<p class="cc-k">'+TR.invite+'</p><p class="cc-mid">'+TR.inviteDeal+'</p><div class="inv"><code>'+esc(C.invite)+'</code><button type="button" class="b-pri" id="f-copy">'+TR.copy+'</button><a class="b-gl" href="https://t.me/share/url?url='+encodeURIComponent(link)+'&text='+encodeURIComponent(TR.shareText)+'" target="_blank" rel="noopener">'+ic('tg')+' '+TR.share+'</a></div><p class="note">'+TR.inviteNote+'</p>')+
    '<h2 class="cb-h2">'+TR.friendsList+' · <span class="num">'+C.friends.length+'</span></h2><ul class="lst">'+C.friends.map(function(f){return '<li><span class="ava" style="--ac:'+f.c+'">'+esc(f.nick.charAt(0))+'</span><span><b>'+esc(f.nick)+'</b><small>'+esc(f.state)+'</small></span><b class="'+(f.done?'ok':'mut')+'">'+(f.done?'+1 '+TR.h:TR.wait)+'</b></li>'}).join('')+'</ul>';
  $('#f-copy').addEventListener('click',function(){try{navigator.clipboard.writeText(link)}catch(e){}toast(TR.copied)});
};

/* ── Администратор ── */
var NICKS=C.nicks,SEATS=[];IV.data.zones.forEach(function(z){SEATS=SEATS.concat(z.seats)});
function seatState(s){var t=IV.tash(),h=t.h+t.m/60,z=IV.zoneOf(s),k=hashN(s+t.day);
  var mineB=S().bookings.filter(function(b){return b.seat===s&&!b.cancel&&b.day===t.day&&h<b.from+b.dur&&b.from-h<2})[0];
  if(mineB)return {st:'bk',nick:IV.data.me.nick,left:Math.round((b0(mineB)-h)*60),site:true};
  var nk=NICKS[SEATS.indexOf(s)%NICKS.length];
  if(k<.55)return {st:'on',nick:nk,left:Math.round(10+k*170)-Math.floor((Date.now()/60000)%10)};
  if(k<.65)return {st:'bk',nick:nk,left:Math.round(20+k*60)};
  if(k<.7)return {st:'off'};return {st:'free'}}
function b0(b){return b.from}
function hashN(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0)/4294967296}
var hallT=0;
V.hall=function(el){
  function draw(){
    var all=[],on=0,bk=0,fr=0;
    IV.data.zones.forEach(function(z){z.seats.forEach(function(s){var x=seatState(s);x.s=s;x.z=z;all.push(x);if(x.st==='on')on++;else if(x.st==='bk')bk++;else if(x.st==='free')fr++})});
    var load=Math.round(on/all.length*100);
    el.innerHTML='<div class="kpi">'+
      kpi(TR.kLoad,load+'%',on+' / '+all.length)+kpi(TR.kFree,fr,TR.kFreeS)+kpi(TR.kBook,bk,TR.kBookS)+kpi(TR.kRev,sum(C.stats.revToday),TR.kRevS)+'</div>'+
      '<p class="sync">'+ic('sync')+' '+esc(TR.syncAdm.replace('{sys}',IV.data.systems[0]))+'</p>'+
      '<div class="ad-hall">'+IV.data.zones.map(function(z){return '<div class="ad-room" style="--zc:'+z.c+'"><p class="ad-rh"><b>'+esc(z.n)+'</b><span class="num">'+grp(z.hour)+' '+U.sum+'/'+TR.h+'</span></p><div class="ad-seats">'+all.filter(function(x){return x.z===z}).map(function(x){
        return '<button type="button" class="ad-s '+x.st+'" data-s="'+x.s+'"><b>'+x.s+'</b><span>'+(x.st==='on'?esc(x.nick):x.st==='bk'?(x.site?TR.fromSite:esc(x.nick)):x.st==='off'?TR.off:TR.free)+'</span>'+(x.left>0&&x.st!=='free'&&x.st!=='off'?'<small class="num">'+(x.st==='bk'?TR.in+' ':'')+Math.floor(x.left/60)+':'+('0'+x.left%60).slice(-2)+'</small>':'')+'</button>'}).join('')+'</div></div>'}).join('')+'</div>'+
      '<div class="ad-leg"><span class="on">'+TR.lOn+'</span><span class="bk">'+TR.lBk+'</span><span class="free">'+TR.lFree+'</span><span class="off">'+TR.lOff+'</span></div>';
  }
  draw();clearInterval(hallT);hallT=setInterval(function(){if(cur==='hall'&&!d.hidden)draw()},5000);
  el.addEventListener('click',function(e){var b=e.target.closest('.ad-s');if(!b)return;var x=seatState(b.getAttribute('data-s'));
    sheet('<p class="cc-k">'+TR.seat+' '+b.getAttribute('data-s')+'</p><p class="cc-mid">'+(x.st==='on'?esc(x.nick):x.st==='bk'?TR.lBk+': '+esc(x.site?IV.data.me.nick:x.nick):x.st==='off'?TR.off:TR.free)+'</p><div class="sh-act">'+
      (x.st==='on'?'<button type="button" class="b-pri" data-t="'+esc(TR.extended)+'">'+TR.extend+'</button><button type="button" class="b-gl" data-t="'+esc(TR.ended)+'">'+TR.end+'</button><button type="button" class="b-gl" data-t="'+esc(TR.msgSent)+'">'+TR.msg+'</button>':
       x.st==='bk'?'<button type="button" class="b-pri" data-t="'+esc(TR.started)+'">'+TR.start+'</button><button type="button" class="b-gl" data-t="'+esc(TR.moved)+'">'+TR.move+'</button>':
       '<button type="button" class="b-pri" data-t="'+esc(TR.started)+'">'+TR.startGuest+'</button><button type="button" class="b-gl" data-t="'+esc(TR.blocked)+'">'+TR.block+'</button>')+'</div>')});
};
function kpi(k,v,s){return '<div class="kp"><p class="cc-k">'+k+'</p><p class="kp-v num">'+v+'</p><p class="cc-sub">'+s+'</p></div>'}
function sheet(html){var o=d.createElement('div');o.className='sheet';o.innerHTML='<div class="sh-in" role="dialog" aria-modal="true">'+html+'<button type="button" class="sh-x" aria-label="'+TR.close+'">×</button></div>';d.body.appendChild(o);
  requestAnimationFrame(function(){o.classList.add('on')});
  o.addEventListener('click',function(e){var b=e.target.closest('button');if(e.target===o||(b&&b.classList.contains('sh-x'))){close()}else if(b&&b.hasAttribute('data-t')){toast(b.getAttribute('data-t'));close()}});
  function close(){o.classList.remove('on');setTimeout(function(){o.remove()},300)}}
V.bookings=function(el){
  var site=S().bookings.filter(function(b){return !b.cancel}).map(function(b){return {id:b.id,nick:IV.data.me.nick,zone:b.zn,seat:b.seat,when:dayName(b.day)+', '+hh(b.from)+'-'+hh(b.from+b.dur),pack:b.pn,price:b.price,src:TR.srcSite,fresh:true}});
  var demo=C.clients.slice(0,7).map(function(c,i){var z=IV.data.zones[i%IV.data.zones.length],from=IV.tash().h+1+i%5;return {id:'B'+(2100+i),nick:c.nick,zone:z.n,seat:z.seats[(i*3)%z.seats.length],when:U.today+', '+hh(from)+'-'+hh(from+2+i%3),pack:'',price:z.hour*(2+i%3),src:i%3?TR.srcSite:TR.srcDesk}});
  var rows=site.concat(demo);
  el.innerHTML='<div class="tbl-w"><table class="tbl"><thead><tr><th>№</th><th>'+TR.client+'</th><th>'+TR.seat+'</th><th>'+TR.when+'</th><th>'+TR.source+'</th><th class="r">'+TR.sumT+'</th><th></th></tr></thead><tbody>'+rows.map(function(r){
    return '<tr'+(r.fresh?' class="fresh"':'')+'><td class="num">'+r.id+'</td><td><b>'+esc(r.nick)+'</b></td><td>'+esc(r.zone)+' · '+r.seat+'</td><td>'+esc(r.when)+'</td><td><span class="pill'+(r.src===TR.srcSite?' s':'')+'">'+esc(r.src)+'</span></td><td class="r num">'+sum(r.price)+'</td><td><button type="button" class="b-sm" data-t="'+esc(TR.confirmed)+'">'+TR.confirm+'</button></td></tr>'}).join('')+'</tbody></table></div>'+
    (site.length?'':'<p class="note">'+TR.bookHint+'</p>');
  el.addEventListener('click',function(e){var b=e.target.closest('[data-t]');if(b){toast(b.getAttribute('data-t'));b.disabled=true;b.textContent='✓'}});
};
V.clients=function(el){
  el.innerHTML='<label class="srch">'+ic('users')+'<input type="search" id="c-q" placeholder="'+esc(TR.search)+'" aria-label="'+esc(TR.search)+'"></label><div class="tbl-w"><table class="tbl"><thead><tr><th>'+TR.client+'</th><th>'+TR.phone+'</th><th class="r">'+TR.balance+'</th><th class="r">'+TR.hoursT+'</th><th class="r">'+TR.visitsT+'</th><th>'+TR.level+'</th></tr></thead><tbody id="c-rows"></tbody></table></div><p class="note">'+TR.clientsNote+'</p>';
  function draw(q){q=(q||'').toLowerCase();$('#c-rows').innerHTML=C.clients.filter(function(c){return !q||c.nick.toLowerCase().indexOf(q)>=0||c.phone.indexOf(q)>=0}).map(function(c){var lv=level(c.points);
    return '<tr><td><span class="ava sm" style="--ac:'+lv.c+'">'+esc(c.nick.charAt(0))+'</span><b>'+esc(c.nick)+'</b></td><td class="num">'+esc(c.phone)+'</td><td class="r num">'+sum(c.balance)+'</td><td class="r num">'+c.hours+'</td><td class="r num">'+c.visits+'</td><td><span class="pill" style="--pc:'+lv.c+'">'+esc(lv.n)+'</span></td></tr>'}).join('')}
  $('#c-q').addEventListener('input',function(e){draw(e.target.value)});draw('');
};
V.tariffs=function(el){
  var Z=IV.data.zones,P=IV.data.packs;
  el.innerHTML='<p class="note top">'+TR.tariffNote.replace('{sys}',IV.data.systems[0])+'</p><div class="tbl-w"><table class="tbl tar"><thead><tr><th>'+TR.pack+'</th>'+Z.map(function(z){return '<th style="color:'+z.c+'">'+esc(z.n)+'</th>'}).join('')+'</tr></thead><tbody>'+P.map(function(p){
    return '<tr><th>'+esc(p.n)+(p.note?'<small>'+esc(p.note)+'</small>':'')+'</th>'+Z.map(function(z){var v=(z.pack&&z.pack[p.id])||z.hour*p.dur;return '<td><input type="number" inputmode="numeric" step="1000" min="0" value="'+v+'" aria-label="'+esc(z.n+', '+p.n)+'"></td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div>'+
    '<div class="tar-act"><button type="button" class="b-pri" id="t-save">'+TR.saveSync.replace('{sys}',IV.data.systems[0])+'</button><span class="note" id="t-st"></span></div>';
  $('#t-save').addEventListener('click',function(){$('#t-st').textContent=TR.synced;toast(TR.savedT)});
  el.addEventListener('input',function(e){if(e.target.tagName==='INPUT'){e.target.classList.add('ch');$('#t-st').textContent=TR.unsaved}});
};
V.wheel=function(el){
  var st=C.stats.wheel,mine=S().spins,n=st.spins+mine.length,got={none:st.none,h1:st.h1,h2:st.h2};
  mine.forEach(function(x){got[x.id]++});
  var hours=got.h1+got.h2*2,used=st.used,exp=IV.data.wheel.odds;
  var perSpin=exp.reduce(function(a,o){return a+o.p/100*o.hours},0);
  el.innerHTML='<div class="kpi">'+kpi(TR.wSpins,grp(n),TR.w30)+kpi(TR.wGiven,grp(hours)+' '+TR.h,TR.wGivenS)+kpi(TR.wUsed,grp(used)+' '+TR.h,Math.round(used/hours*100)+'% '+TR.wUsedS)+kpi(TR.wLeft,grp(hours-used)+' '+TR.h,TR.wLeftS)+'</div>'+
    '<div class="cc"><p class="cc-k">'+TR.wDist+'</p><div class="dist">'+exp.map(function(o){var f=got[o.id]/n*100;return '<div class="ds"><p><b>'+esc(o.win)+'</b><span class="num">'+got[o.id]+' · '+f.toFixed(1)+'%</span></p><div class="ds-b"><i style="transform:scaleX('+(f/100).toFixed(3)+');background:'+o.c+'"></i><em style="left:'+o.p+'%" title="'+o.p+'%"></em></div><small>'+TR.wExp+' '+o.p+'%</small></div>'}).join('')+'</div>'+
    '<p class="note">'+TR.wMath.replace('{x}',perSpin.toFixed(2)).replace('{s}',grp(Math.round(perSpin*IV.data.zones[0].hour)))+'</p></div>'+
    '<div class="cc"><p class="cc-k">'+TR.wLast+'</p><ul class="lst">'+mine.slice(0,3).map(function(x){return '<li><span><b>'+esc(IV.data.me.nick)+'</b><small>'+esc(x.day)+'</small></span><b class="'+(x.hours?'ok':'mut')+'">'+(x.hours?'+'+x.hours+' '+TR.h:TR.noWin)+'</b></li>'}).join('')+C.stats.lastSpins.map(function(x){return '<li><span><b>'+esc(x[0])+'</b><small>'+esc(x[1])+'</small></span><b class="'+(x[2]?'ok':'mut')+'">'+(x[2]?'+'+x[2]+' '+TR.h:TR.noWin)+'</b></li>'}).join('')+'</ul></div>';
};
V.shifts=function(el){
  var s=C.shifts[0];
  el.innerHTML='<div class="cc cc-shift"><p class="cc-k">'+TR.curShift+'</p><p class="cc-mid">'+esc(s.admin)+' · '+esc(s.time)+'</p><div class="kpi in">'+kpi(TR.cash,sum(s.cash),'')+kpi(TR.cards,sum(s.card),'Uzcard / Humo')+kpi('Click · Payme',sum(s.online),'')+kpi(TR.bonusSpent,s.bonus+' '+TR.h,'')+'</div><button type="button" class="b-pri" id="sh-close">'+TR.closeShift+'</button></div>'+
    '<h2 class="cb-h2">'+TR.pastShifts+'</h2><div class="tbl-w"><table class="tbl"><thead><tr><th>'+TR.when+'</th><th>'+TR.adminT+'</th><th class="r">'+TR.cash+'</th><th class="r">'+TR.cards+'</th><th class="r">Click · Payme</th><th class="r">'+TR.sumT+'</th></tr></thead><tbody>'+C.shifts.slice(1).map(function(x){return '<tr><td>'+esc(x.time)+'</td><td>'+esc(x.admin)+'</td><td class="r num">'+sum(x.cash)+'</td><td class="r num">'+sum(x.card)+'</td><td class="r num">'+sum(x.online)+'</td><td class="r num"><b>'+sum(x.cash+x.card+x.online)+'</b></td></tr>'}).join('')+'</tbody></table></div>';
  $('#sh-close').addEventListener('click',function(){sheet('<p class="cc-k">'+TR.closeShift+'</p><p class="cc-mid num">'+sum(s.cash+s.card+s.online)+'</p><p class="cc-sub">'+TR.closeNote+'</p><div class="sh-act"><button type="button" class="b-pri" data-t="'+esc(TR.closed)+'">'+TR.closeOk+'</button></div>')});
};

box.addEventListener('click',function(e){var g=e.target.closest('[data-go]');if(g){go(g.getAttribute('data-go'));return}
  var c=e.target.closest('[data-cancel]');if(c){var id=c.getAttribute('data-cancel');S().bookings.forEach(function(b){if(b.id===id)b.cancel=true});IV.save();toast(TR.cancelled);mineList()}});
IV.on(function(){if(cur!=='book'&&cur!=='bonus'&&cur!=='wallet')render();var bal=$('#cb-bal');if(bal)bal.innerHTML=ic('card')+sum(S().balance)});
shell();render();
})();
