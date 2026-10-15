(function(){
'use strict';
/* core: общее для страницы и кабинетов — карта зала с бронью и колесо
   бонусов. Данные — в <script id="iv-data">, состояние демо — в браузере
   (iv-demo-1), поэтому бронь со страницы видна в кабинетах игрока и
   администратора. Модель не вызывается, сеть не трогается. */
var d=document,W=window;
var DATA=JSON.parse(d.getElementById('iv-data').textContent),U=DATA.ui;
var REDUCED=false;try{REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
var KEY='iv-demo-1';
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function grp(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function sum(n){return grp(n)+' '+U.sum}
function pad(n){return (n<10?'0':'')+n}
function hh(h){h=((h%24)+24)%24;return pad(Math.floor(h))+':'+(h%1?'30':'00')}

/* ── Состояние демо ── */
function load(){var s=null;try{s=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){}
  if(!s||s.v!==1)s={v:1,balance:DATA.me.balance,bonus:DATA.me.bonus,points:DATA.me.points,bookings:[],spins:[],tops:[],invited:DATA.me.invited};
  return s}
var S=load();
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}emit()}
var subs=[];function on(f){subs.push(f)}function emit(){subs.forEach(function(f){try{f(S)}catch(e){}})}
addEventListener('storage',function(e){if(e.key===KEY){S=load();emit()}});

/* Дата и час по Ташкенту (UTC+5): «раз в сутки» и брони считаются по нему. */
function tashNow(){var n=new Date(Date.now()+5*3600e3);return {day:n.toISOString().slice(0,10),h:n.getUTCHours(),m:n.getUTCMinutes()}}

/* ── Занятость мест: детерминированно по месту и часу, плюс живые сдвиги ── */
function hash(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0)/4294967296}
var live={};
function busyAt(seat,day,h){
  var k=seat+'|'+day+'|'+Math.floor(h);
  if(live[k]!=null)return live[k];
  var peak=h>=17||h<2?.62:h>=12?.42:.22;
  return hash(k)<peak;
}
function mine(seat,day,h){return S.bookings.some(function(b){return b.seat===seat&&b.day===day&&!b.cancel&&h>=b.from&&h<b.from+b.dur})}
function freeFor(seat,day,from,dur){for(var h=from;h<from+dur;h++){if(busyAt(seat,day,h%24)||mine(seat,day,h))return false}return true}
function zoneOf(seat){for(var i=0;i<DATA.zones.length;i++)if(DATA.zones[i].seats.indexOf(seat)>=0)return DATA.zones[i];return null}
function priceFor(zone,pack){
  return (zone.pack&&zone.pack[pack.id])||zone.hour*pack.dur;
}

/* ── Карта зала ── */
function hall(root,opt){
  opt=opt||{};
  var st={day:0,from:null,pack:DATA.packs[0].id,seat:null,zone:'all'};
  var now=tashNow();
  function days(){var a=[];for(var i=0;i<2;i++){var t=new Date(Date.now()+5*3600e3+i*864e5);a.push(t.toISOString().slice(0,10))}return a}
  var DAYS=days();
  function startHours(){var a=[],h0=st.day===0?now.h+1:10;for(var h=h0;h<(st.day===0?now.h+13:24);h++)a.push(h);return a.slice(0,10)}
  if(st.from==null)st.from=startHours()[0];
  function pack(){for(var i=0;i<DATA.packs.length;i++)if(DATA.packs[i].id===st.pack)return DATA.packs[i];return DATA.packs[0]}
  function from(){var p=pack();return p.at!=null?p.at:st.from}
  function free(seat){return freeFor(seat,DAYS[st.day],from(),pack().dur)}
  function cnt(){var f=0,a=0;DATA.zones.forEach(function(z){z.seats.forEach(function(s){a++;if(free(s))f++})});return [f,a]}
  root.innerHTML=
    '<div class="hl-bar">'+
      '<div class="hl-sync"><span class="dot" aria-hidden="true"></span><span>'+U.synced+' <b class="hl-sys">'+esc(DATA.systems[0])+'</b></span><small class="hl-ago num"></small></div>'+
      '<label class="hl-pick"><span>'+U.system+'</span><select class="hl-sel">'+DATA.systems.map(function(s){return '<option>'+esc(s)+'</option>'}).join('')+'</select></label>'+
    '</div>'+
    '<div class="hl-ctl">'+
      '<div class="chips hl-days" role="group" aria-label="'+U.day+'">'+DAYS.map(function(x,i){return '<button type="button" data-day="'+i+'">'+(i?U.tomorrow:U.today)+'</button>'}).join('')+'</div>'+
      '<div class="chips hl-packs" role="group" aria-label="'+U.duration+'">'+DATA.packs.map(function(p){return '<button type="button" data-pack="'+p.id+'">'+esc(p.n)+'</button>'}).join('')+'</div>'+
      '<div class="chips hl-hours" role="group" aria-label="'+U.start+'"></div>'+
    '</div>'+
    '<div class="hl-wrap"><div class="hl-map" role="group" aria-label="'+U.map+'">'+DATA.zones.map(function(z){
      return '<div class="hl-room hl-'+z.id+'" style="--zc:'+z.c+'"><p class="hl-rh"><b>'+esc(z.n)+'</b><span class="num hl-zf" data-zf="'+z.id+'"></span></p><div class="hl-seats">'+z.seats.map(function(s){
        return '<button type="button" class="seat" data-seat="'+s+'" aria-label="'+esc(z.n)+' '+s+'"><i aria-hidden="true"></i><span>'+s.replace(/^[A-Z]/,'')+'</span></button>'}).join('')+'</div></div>'}).join('')+
    '</div>'+
    '<div class="hl-leg"><span><i class="lg-f"></i>'+U.free+'</span><span><i class="lg-b"></i>'+U.busy+'</span><span><i class="lg-m"></i>'+U.yours+'</span><span class="hl-cnt num"></span></div></div>'+
    '<div class="hl-sum" aria-live="polite"></div>';
  var $=function(s){return root.querySelector(s)};
  var sync=Date.now();
  function drawHours(){var p=pack(),box=$('.hl-hours');
    if(p.at!=null){box.innerHTML='<span class="hl-fix">'+esc(p.note)+'</span>';return}
    box.innerHTML=startHours().map(function(h){return '<button type="button" data-from="'+h+'"'+(h===st.from?' aria-pressed="true"':'')+'>'+hh(h)+'</button>'}).join('')}
  function draw(){
    root.querySelectorAll('[data-day]').forEach(function(b){b.setAttribute('aria-pressed',+b.getAttribute('data-day')===st.day)});
    root.querySelectorAll('[data-pack]').forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-pack')===st.pack)});
    drawHours();
    var day=DAYS[st.day];
    root.querySelectorAll('.seat').forEach(function(b){var s=b.getAttribute('data-seat'),m=mine(s,day,from()),f=free(s);
      b.className='seat'+(m?' m':f?' f':' b')+(st.seat===s?' on':'');b.disabled=!f&&!m;b.setAttribute('aria-pressed',st.seat===s)});
    DATA.zones.forEach(function(z){var f=z.seats.filter(free).length;var el=root.querySelector('[data-zf="'+z.id+'"]');if(el)el.textContent=f+'/'+z.seats.length})
    var c=cnt();$('.hl-cnt').textContent=U.freeNow+' '+c[0]+' / '+c[1];
    if(opt.onCount)opt.onCount(c[0],c[1]);
    summary();
  }
  function summary(){var box=$('.hl-sum');
    if(!st.seat){box.innerHTML='<p class="hl-hint">'+U.pickSeat+'</p>';return}
    var z=zoneOf(st.seat),p=pack(),f=from(),pr=priceFor(z,p);
    box.innerHTML='<div class="hl-pay"><p><small>'+U.place+'</small><b>'+esc(z.n)+' · '+st.seat+'</b></p><p><small>'+U.when+'</small><b>'+(st.day?U.tomorrow:U.today)+', '+hh(f)+'-'+hh(f+p.dur)+'</b></p><p><small>'+U.price+'</small><b class="num">'+sum(pr)+'</b></p></div>'+
      '<button type="button" class="btn btn-pri shim hl-go">'+U.book+'</button>';
  }
  root.addEventListener('click',function(e){
    var b=e.target.closest('button');if(!b||!root.contains(b))return;
    if(b.hasAttribute('data-day')){st.day=+b.getAttribute('data-day');var hs=startHours();if(hs.indexOf(st.from)<0)st.from=hs[0];st.seat=null;draw()}
    else if(b.hasAttribute('data-pack')){st.pack=b.getAttribute('data-pack');if(st.seat&&!free(st.seat))st.seat=null;draw()}
    else if(b.hasAttribute('data-from')){st.from=+b.getAttribute('data-from');if(st.seat&&!free(st.seat))st.seat=null;draw()}
    else if(b.hasAttribute('data-seat')){var s=b.getAttribute('data-seat');st.seat=st.seat===s?null:s;draw()}
    else if(b.classList.contains('hl-go'))book();
  });
  $('.hl-sel').addEventListener('change',function(e){$('.hl-sys').textContent=e.target.value;sync=Date.now();tickAgo()});
  function book(){
    var z=zoneOf(st.seat),p=pack(),f=from(),pr=priceFor(z,p);
    var bk={id:'B'+(1000+S.bookings.length+Math.floor(hash(String(Date.now()))*8000)),seat:st.seat,zone:z.id,zn:z.n,day:DAYS[st.day],from:f,dur:p.dur,pn:p.n,price:pr,sys:$('.hl-sys').textContent,at:Date.now()};
    S.bookings.unshift(bk);save();st.seat=null;draw();
    var box=$('.hl-sum');
    box.innerHTML='<div class="hl-ok"><p class="hl-okh">'+U.booked+'</p><p>'+esc(bk.zn)+' · '+bk.seat+' · '+(bk.day===DAYS[0]?U.today:U.tomorrow)+', '+hh(bk.from)+'-'+hh(bk.from+bk.dur)+' · <b class="num">'+sum(bk.price)+'</b></p><p class="hl-oks">'+U.bookedSync.replace('{sys}',esc(bk.sys))+'</p>'+
      '<div class="hl-oka">'+(DATA.tg?'<a class="btn btn-ghost" href="https://t.me/'+DATA.tg+'?text='+encodeURIComponent(U.tgText.replace('{seat}',bk.seat).replace('{zone}',bk.zn).replace('{when}',(bk.day===DAYS[0]?U.today:U.tomorrow)+' '+hh(bk.from)+'-'+hh(bk.from+bk.dur)))+'">'+U.tgSend+'</a>':'')+
      (opt.cab?'<a class="btn btn-ghost" href="'+opt.cab+'">'+U.toCab+'</a>':'')+'</div></div>';
    if(opt.onBook)opt.onBook(bk);
  }
  /* Живой зал: раз в несколько секунд кто-то садится или уходит — как из системы клуба. */
  function tickAgo(){var s=Math.round((Date.now()-sync)/1000);$('.hl-ago').textContent=s<3?U.justNow:U.ago.replace('{s}',s)}
  var liveT=setInterval(function(){
    if(d.hidden)return;
    var all=[];DATA.zones.forEach(function(z){all=all.concat(z.seats)});
    var s=all[Math.floor(Math.random()*all.length)],day=DAYS[st.day],h=from();
    if(s===st.seat||mine(s,day,h))return;
    var k=s+'|'+day+'|'+Math.floor(h);live[k]=!busyAt(s,day,h);sync=Date.now();
    var b=root.querySelector('[data-seat="'+s+'"]');draw();if(b&&!REDUCED){b.classList.add('flip')}
    tickAgo();
  },REDUCED?9000:4200);
  setInterval(tickAgo,1000);
  on(draw);
  draw();tickAgo();
  return {count:cnt,stop:function(){clearInterval(liveT)}};
}

/* ── Колесо бонусов ──
   Исход выбирается по весам ДО анимации (crypto.getRandomValues), колесо
   доезжает ровно до сектора выпавшего исхода. Сектора по площади равны
   вероятностям: «ничего» 65% (три по 78°), «1 час» 25% (два по 45°),
   «2 часа» 10% (один 36°). Раз в сутки по Ташкенту на игрока. */
var ODDS=DATA.wheel.odds;
var SECT=DATA.wheel.sectors;
function rnd(){try{var a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296}catch(e){return Math.random()}}
function pickOutcome(){var r=rnd()*100,acc=0;for(var i=0;i<ODDS.length;i++){acc+=ODDS[i].p;if(r<acc)return ODDS[i]}return ODDS[0]}
function spunToday(){var day=tashNow().day;return S.spins.filter(function(x){return x.day===day})[0]||null}
function wheel(root,opt){
  opt=opt||{};
  var R=150,cx=160,cy=160,a0=-90,acc=0,paths='',labels='';
  SECT.forEach(function(s,i){
    var o=ODDS.filter(function(x){return x.id===s.id})[0],a1=acc,a2=acc+s.deg;acc=a2;
    var r1=(a0+a1)*Math.PI/180,r2=(a0+a2)*Math.PI/180,large=s.deg>180?1:0;
    var p='M'+cx+' '+cy+'L'+(cx+R*Math.cos(r1)).toFixed(2)+' '+(cy+R*Math.sin(r1)).toFixed(2)+'A'+R+' '+R+' 0 '+large+' 1 '+(cx+R*Math.cos(r2)).toFixed(2)+' '+(cy+R*Math.sin(r2)).toFixed(2)+'Z';
    paths+='<path d="'+p+'" fill="'+o.c+'" stroke="#090616" stroke-width="3"/>';
    var mid=(a0+(a1+a2)/2)*Math.PI/180,lx=cx+R*.64*Math.cos(mid),ly=cy+R*.64*Math.sin(mid),rot=(a0+(a1+a2)/2+90);
    labels+='<text x="'+lx.toFixed(1)+'" y="'+ly.toFixed(1)+'" transform="rotate('+rot.toFixed(1)+' '+lx.toFixed(1)+' '+ly.toFixed(1)+')" fill="'+o.tc+'" text-anchor="middle" dominant-baseline="middle">'+esc(o.short)+'</text>';
    s.a1=a1;s.a2=a2;
  });
  var bulbs='';for(var i=0;i<24;i++){var a=i/24*Math.PI*2;bulbs+='<circle cx="'+(cx+(R+9)*Math.cos(a)).toFixed(1)+'" cy="'+(cy+(R+9)*Math.sin(a)).toFixed(1)+'" r="3" class="wb'+(i%2)+'"/>'}
  root.innerHTML='<div class="wh-stage"><div class="wh-pin" aria-hidden="true"></div><div class="wh-rot"><svg viewBox="0 0 320 320" class="wh-svg" aria-hidden="true"><circle cx="160" cy="160" r="'+(R+16)+'" fill="#14102e" stroke="url(#whg)" stroke-width="4"/><defs><linearGradient id="whg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff064d"/><stop offset=".5" stop-color="#ff9db8"/><stop offset="1" stop-color="#2ee6ff"/></linearGradient></defs>'+bulbs+'<g class="wh-face">'+paths+labels+'</g><circle cx="160" cy="160" r="30" fill="#090616" stroke="url(#whg)" stroke-width="3"/></svg></div>'+
    '<button type="button" class="wh-go">'+U.spin+'</button></div>'+
    '<p class="wh-res" aria-live="polite"></p><p class="wh-odds">'+U.odds+'</p>';
  var rot=root.querySelector('.wh-rot'),go=root.querySelector('.wh-go'),res=root.querySelector('.wh-res'),turned=0,busy=false;
  function state(){var t=spunToday();go.disabled=busy||!!t;go.textContent=t?U.spunToday:U.spin;
    if(t&&!busy)res.innerHTML=resultText(t)+' <span class="wh-next">'+U.nextSpin+'</span>'}
  function resultText(t){var o=ODDS.filter(function(x){return x.id===t.id})[0];return o.hours?'<b>'+esc(o.win)+'</b>':esc(o.win)}
  go.addEventListener('click',function(){
    if(busy||spunToday())return;busy=true;go.disabled=true;res.textContent='';
    var out=pickOutcome(),cands=SECT.filter(function(s){return s.id===out.id}),sec=cands[Math.floor(rnd()*cands.length)];
    var inside=sec.a1+sec.deg*(.18+rnd()*.64);
    /* Стрелка сверху: повернуть так, чтобы точка inside встала под неё. */
    var target=turned+360*6+((360-inside)-(turned%360)+720)%360;
    turned=target;
    rot.style.transition=REDUCED?'none':'transform 5.2s cubic-bezier(.12,.67,.1,1)';
    rot.style.transform='rotate('+target+'deg)';
    var done=function(){busy=false;var day=tashNow().day;var sp={id:out.id,hours:out.hours,day:day,at:Date.now()};S.spins.unshift(sp);if(out.hours)S.bonus+=out.hours;save();
      res.innerHTML=resultText(sp);root.classList.add(out.hours?'won':'miss');setTimeout(function(){root.classList.remove('won','miss')},2400);state();if(opt.onSpin)opt.onSpin(sp)};
    if(REDUCED)setTimeout(done,50);else setTimeout(done,5300);
  });
  /* Только для показа владельцу: сбросить сегодняшнюю попытку. */
  if(opt.reset){var rs=d.createElement('button');rs.type='button';rs.className='wh-reset';rs.textContent=U.resetSpin;rs.addEventListener('click',function(){var day=tashNow().day;S.spins=S.spins.filter(function(x){return x.day!==day});save();res.textContent='';state()});root.appendChild(rs)}
  on(state);state();
  return {pick:pickOutcome};
}

W.IV={data:DATA,ui:U,state:function(){return S},save:save,on:on,hall:hall,wheel:wheel,sum:sum,grp:grp,hh:hh,esc:esc,tash:tashNow,pick:pickOutcome,zoneOf:zoneOf,reduced:REDUCED};
})();
