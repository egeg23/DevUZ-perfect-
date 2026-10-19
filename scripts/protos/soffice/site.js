(function(){
'use strict';
/* site: главная Soffice. Одно состояние подбора (площадь, район или БЦ,
   бюджет в месяц) на весь экран: его читают первый экран, карта, каталог,
   калькулятор и просмотр. Прокрутку не перехватывает: GSAP ScrollTrigger
   только двигает фото (transform), всё остальное — классы и transform или
   opacity. Без движения всё стоит на месте. Комментарии вырезает сборка,
   в разметку клиенту они не попадают. */
var d=document,W=window,root=d.documentElement,K=JSON.parse(d.getElementById('so-data').textContent);
var $=function(s,r){return (r||d).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))};
var REDUCED=false;try{REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
var EN=K.lang==='en';
var BC={};K.bc.forEach(function(b){BC[b.id]=b});
/* ── Связь с панелью: та же память браузера ─────────────────────────
   so-panel-1 пишет панель: статусы блоков и ставки. Сайт берёт их поверх
   инвентаря из сборки. so-leads-1 и so-demand-1 пишет сайт: заявки с
   подбора и просмотра, что ищут. Панель читает их первой строкой. */
var PK='so-panel-1',LK='so-leads-1',DK='so-demand-1',PS={};
function lsGet(k,def){try{var v=JSON.parse(localStorage.getItem(k)||'null');return v==null?def:v}catch(e){return def}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function stOf(id,i){var o=PS.u&&PS.u[id+':'+i];return o||K.inv[id].s.charAt(i)}
function panelApply(){PS=lsGet(PK,{})||{};K.bc.forEach(function(b){var r=PS.rate&&PS.rate[b.id];b.rate=r?+r:b.rate0;var inv=K.inv[b.id],n=0,lo=0;for(var i=0;i<inv.s.length;i++)if(stOf(b.id,i)==='f'){n++;var a=Math.round(K.ua[i%8]*inv.k);if(!lo||a<lo)lo=a}b.free=n;b.freeMin=lo})}
K.bc.forEach(function(b){b.rate0=b.rate});panelApply();
function leadAdd(x){var a=lsGet(LK,[]);if(!Array.isArray(a))a=[];x.id='S'+Date.now().toString(36);x.ts=Date.now();a.unshift(x);lsSet(LK,a.slice(0,40));toastLink(K.leadSent)}
var demQ=[],demT=0;function demand(x){clearTimeout(demT);demQ.push(x);demT=setTimeout(function(){var a=lsGet(DK,[]);if(!Array.isArray(a))a=[];a=demQ.concat(a).slice(0,300);demQ=[];lsSet(DK,a)},900)}
function grp(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,EN?',':' ')}
function sum(n){return grp(n)+' '+K.sum}
function mln(n){var m=n/1e6,s=m>=100?String(Math.round(m)):(Math.round(m*10)/10).toFixed(1).replace(/\.0$/,'');if(!EN)s=s.replace('.',',');return s+' '+K.mln}
function fill(s,o){return s.replace(/\{(\w+)\}/g,function(_,k){return o[k]})}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function pad(n){return (n<10?'0':'')+n}
function plural(n,f){if(EN||K.lang==='uz')return n===1?f[0]:f[1];var a=n%10,b=n%100;return a===1&&b!==11?f[0]:a>=2&&a<=4&&(b<10||b>=20)?f[1]:f[2]}
function toastLink(t){var el=$('#toast');el.innerHTML=h(t)+' <a href="'+K.panel+'#leads">'+h(K.toPanel)+'</a>';el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(function(){el.hidden=true},6000)}
function toast(t){var el=$('#toast');el.textContent=t;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(function(){el.hidden=true},3200)}
function copy(t){try{if(navigator.clipboard)navigator.clipboard.writeText(t)}catch(e){}}

/* ── Шапка: прячется при любой прокрутке, возвращается через 3 с ─── */
/* Владелец, 19.10.2026: на компьютере шапка стоит всегда, на телефоне
   прячется при прокрутке и возвращается через 2 секунды. */
var top=$('#top'),IDLE=2000,idleT=0,DESK=null;try{DESK=matchMedia('(min-width: 1000px)')}catch(e){}
function headIdle(){if(!top)return;clearTimeout(idleT);if(DESK&&DESK.matches){top.classList.remove('hide');return}
  if(!top.contains(d.activeElement))top.classList.add('hide');
  idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}
addEventListener('scroll',headIdle,{passive:true});

/* Меню */
var menu=$('#menu'),mb=$('#menu-btn');
function menuSet(on){menu.hidden=!on;mb.setAttribute('aria-expanded',on);root.style.overflow=on?'hidden':''}
if(mb)mb.onclick=function(){menuSet(true)};
$$('[data-close]',menu).forEach(function(b){b.onclick=function(){menuSet(false)}});
$$('.mn-i',menu).forEach(function(a){a.addEventListener('click',function(){menuSet(false)})});

/* Telegram: текст копируется, ссылка открывается */
d.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('[data-tg]');if(!a)return;var t=a.getAttribute('data-tg');if(t){copy(t);toast(K.copied)}});

/* ── Появление блоков ─────────────────────────────────────────────── */
if('IntersectionObserver' in W&&!REDUCED){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
  $$('.rv').forEach(function(el){io.observe(el)});
}else $$('.rv').forEach(function(el){el.classList.add('in')});

/* ── Состояние подбора ────────────────────────────────────────────── */
var S={area:100,where:'',budget:40e6};
var AREA_LO=30,AREA_HI=3000,BUD_LO=5e6,BUD_HI=1500e6;
function areaOf(v){var a=AREA_LO*Math.pow(AREA_HI/AREA_LO,v/100);return a<100?Math.round(a/5)*5:a<1000?Math.round(a/10)*10:Math.round(a/50)*50}
function vOfArea(a){return Math.round(Math.log(a/AREA_LO)/Math.log(AREA_HI/AREA_LO)*100)}
function budOf(v){var b=BUD_LO*Math.pow(BUD_HI/BUD_LO,v/100),m=b/1e6;return (m<20?Math.round(m):m<100?Math.round(m/5)*5:m<500?Math.round(m/10)*10:Math.round(m/50)*50)*1e6}
function vOfBud(b){return Math.round(Math.log(b/BUD_LO)/Math.log(BUD_HI/BUD_LO)*100)}
function month(b,a){return b.rate*a}
function areaOk(b,a){return (b.min==null||a>=b.min)&&(b.max==null||a<=b.max)}
function whereOk(b){if(!S.where)return true;var p=S.where.split(':');return p[0]==='d'?b.d===p[1]:b.id===p[1]}
function fits(b){return areaOk(b,S.area)&&whereOk(b)&&month(b,S.area)<=S.budget}
function track(el){var p=(el.value-el.min)/(el.max-el.min)*100;el.style.setProperty('--p',p+'%')}

var fa=$('#fd-area'),fb=$('#fd-budget'),fw=$('#fd-where'),fao=$('#fd-area-o'),fbo=$('#fd-budget-o'),fn=$('#fd-n'),fnw=$('#fd-n-w'),fmin=$('#fd-min');
fa.value=vOfArea(S.area);fb.value=vOfBud(S.budget);
fa.oninput=function(){S.area=areaOf(+fa.value);sync('finder')};
fb.oninput=function(){S.budget=budOf(+fb.value);sync('finder')};
fw.onchange=function(){S.where=fw.value;sync('finder')};
$$('.chip-s').forEach(function(c){c.onclick=function(){S.area=+c.getAttribute('data-area');fa.value=vOfArea(S.area);sync('finder')}});
$$('[data-go]').forEach(function(a){a.addEventListener('click',function(){var f=$('#flt-fit');if(f&&!f.checked){f.checked=true;applyCat()}})});

var lastN=-1;
function sync(from){
  if(from==='finder')demand({k:'s',a:S.area,w:S.where,b:S.budget,ts:Date.now()});
  fao.textContent=grp(S.area);fbo.textContent=grp(S.budget/1e6);track(fa);track(fb);
  $$('.chip-s').forEach(function(c){c.classList.toggle('on',+c.getAttribute('data-area')===S.area)});
  var ok=K.bc.filter(fits),n=ok.length;
  fn.textContent=n;if(n!==lastN&&lastN>=0&&!REDUCED){fn.classList.remove('bump');void fn.offsetWidth;fn.classList.add('bump')}lastN=n;
  fnw.textContent=plural(n,K.fitN);
  if(n){var lo=Math.min.apply(null,ok.map(function(b){return month(b,S.area)}));fmin.textContent=fill(K.fitMin,{s:mln(lo)})}else fmin.textContent=K.none;
  $$('#fd-dots i').forEach(function(i){i.classList.toggle('on',fits(BC[i.getAttribute('data-id')]))});
  mapSync();applyCat();
  if(from!=='calc'){calcArea(S.area)}
  vwMsg();
}

/* ── Первый экран: башни сменяются, имя в заголовке вместе с кадром ── */
var imgs=$$('.hr-img'),rolls=$$('.hr-roll b'),bars=$$('.hr-bars i'),hi=0;
function heroGo(n){var p=hi;hi=n;imgs[p].classList.remove('on');imgs[n].classList.add('on');
  rolls[p].classList.remove('on');rolls[p].classList.add('out');setTimeout(function(){rolls[p].classList.remove('out')},700);rolls[n].classList.add('on');
  bars.forEach(function(b,i){b.classList.toggle('on',i===n)});var ii=$('#hr-i'),nn=$('#hr-name');if(ii)ii.textContent=pad(n+1);if(nn)nn.textContent=K.hero[n];
  var im=imgs[n].querySelector('img');if(im&&im.loading==='lazy')im.loading='eager'}
if(!REDUCED&&imgs.length>1)setInterval(function(){if(!d.hidden)heroGo((hi+1)%imgs.length)},6000);

/* ── Карта ────────────────────────────────────────────────────────── */
var pins=$$('.pin'),chips=$$('.mp-chip'),card=$('#mp-card'),box=$('#mp-box'),cur='';
function cardHtml(b){var fit=fits(b);
  return '<div class="mpc-pic"><img src="/protos/soffice/b-'+b.id+'-560.webp" alt="'+h(b.n+', '+b.a)+'" width="560" height="350"></div>'+
  '<div class="mpc-b"><h3>'+h(b.n)+'<span class="cls c-'+b.cls.replace('+','p')+'">'+b.cls+'</span></h3>'+
  '<p class="mpc-fit'+(fit?' yes':'')+'">'+(fit?K.fitYes:K.fitNo)+'</p>'+
  '<p class="mpc-m">'+mln(month(b,S.area))+'<small>'+fill(K.perMonth,{a:grp(S.area)})+'</small></p>'+
  '<dl class="mpc-dl"><dt>'+K.district+'</dt><dd>'+h(b.dn)+', '+h(b.a)+'</dd><dt>'+K.metro+'</dt><dd>'+h(b.m)+'</dd><dt>'+K.parking+'</dt><dd>'+h(b.p)+'</dd><dt>'+K.size+'</dt><dd>'+h(b.area)+'</dd><dt>'+K.rate+'</dt><dd>'+K.from+' '+grp(b.rate)+' '+K.perM2+'</dd></dl>'+
  '<div class="mpc-btns"><button type="button" class="btn btn-or btn-sm" data-view="'+b.id+'">'+K.view+'</button><a class="btn btn-ghost btn-sm" href="#katalog" data-to="'+b.id+'">'+K.more+'</a></div></div>'}
function pick(id,user){cur=id;if(user)demand({k:'v',id:id,ts:Date.now()});pins.forEach(function(p){p.classList.toggle('on',p.getAttribute('data-id')===id)});chips.forEach(function(c){c.classList.toggle('on',c.getAttribute('data-id')===id)});card.innerHTML=cardHtml(BC[id])}
pins.forEach(function(p){p.onclick=function(){pick(p.getAttribute('data-id'),1)}});
chips.forEach(function(c){c.onclick=function(){pick(c.getAttribute('data-id'),1)}});
function mapSync(){pins.forEach(function(p){p.classList.toggle('dim',!fits(BC[p.getAttribute('data-id')]))});chips.forEach(function(c){c.classList.toggle('dim',!fits(BC[c.getAttribute('data-id')]))});
  if(!cur){var first=K.bc.filter(fits)[0]||K.bc[0];pick(first.id)}else card.innerHTML=cardHtml(BC[cur])}
card.addEventListener('click',function(e){var a=e.target.closest('[data-to]');if(!a)return;var el=$('.bc[data-id="'+a.getAttribute('data-to')+'"]');if(el){e.preventDefault();var f=$('#flt-fit');if(f.checked&&!fits(BC[a.getAttribute('data-to')])){f.checked=false;applyCat()}fltSet('d','');fltSet('t','');el.scrollIntoView({behavior:REDUCED?'auto':'smooth',block:'center'});el.classList.add('in')}});

/* ── Каталог ──────────────────────────────────────────────────────── */
var cards=$$('.bc'),grid=$('#bcs'),F={d:'',t:''},fitEl=$('#flt-fit'),sortEl=$('#flt-sort'),ORDER=K.bc.map(function(b){return b.id});
var CLS={'A+':0,'A':1,'B+':2,'B':3};
function fltSet(g,v){F[g]=v;$$('.chip[data-f="'+g+'"]').forEach(function(c){var on=c.getAttribute('data-v')===v;c.classList.toggle('on',on);c.setAttribute('aria-pressed',on)});applyCat()}
$$('.chip[data-f]').forEach(function(c){c.onclick=function(){fltSet(c.getAttribute('data-f'),c.getAttribute('data-v'))}});
fitEl.onchange=applyCat;sortEl.onchange=applyCat;
function applyCat(){var n=0,s=sortEl.value;
  var list=cards.slice().sort(function(a,b){var x=BC[a.getAttribute('data-id')],y=BC[b.getAttribute('data-id')];
    if(s==='price')return x.rate-y.rate;if(s==='cls')return CLS[x.cls]-CLS[y.cls]||x.rate-y.rate;return ORDER.indexOf(x.id)-ORDER.indexOf(y.id)});
  list.forEach(function(c){var b=BC[c.getAttribute('data-id')];
    var show=(!F.d||b.d===F.d)&&(!F.t||c.getAttribute('data-t').split(' ').indexOf(F.t)>=0)&&(!fitEl.checked||fits(b));
    c.hidden=!show;if(show)n++;grid.appendChild(c);
    $('[data-month]',c).textContent=mln(month(b,S.area));$('[data-rate]',c).textContent=fill(K.rateTpl,{r:grp(b.rate)});
    var fr=$('[data-free]',c);fr.textContent=b.free?fill(K.freeTpl,{n:b.free,a:grp(b.freeMin)}):K.freeNone;fr.classList.toggle('none',!b.free);$('[data-month-w]',c).textContent=fill(K.perMonth,{a:grp(S.area)})});
  $('#flt-n').textContent=n;$('#flt-area').textContent=fill(K.areaNow,{a:grp(S.area)});$('#bcs-empty').hidden=n>0}

/* Сравнение: до трёх */
var cmpSel=[],bar=$('#cmp-bar'),cmpBox=$('#cmp'),back=$('#pn-back');
$$('[data-cmp]').forEach(function(i){i.onchange=function(){var id=i.getAttribute('data-cmp');
  if(i.checked){if(cmpSel.length>=3){i.checked=false;toast(K.cmpMax);return}cmpSel.push(id)}else cmpSel=cmpSel.filter(function(x){return x!==id});
  bar.hidden=!cmpSel.length;$('#cmp-n').textContent=fill(K.cmpN,{n:cmpSel.length})}});
function cmpOpen(){var bs=cmpSel.map(function(id){return BC[id]}),lo=Math.min.apply(null,bs.map(function(b){return b.rate}));
  $('#cmp-in').innerHTML=bs.map(function(b){return '<div class="cc"><img src="/protos/soffice/b-'+b.id+'-560.webp" alt="'+h(b.n)+'" width="560" height="350" loading="lazy"><div class="cc-b"><h3>'+h(b.n)+'</h3><dl>'+
    '<dt>'+K.cls+'</dt><dd>'+b.cls+'</dd><dt>'+K.month+'</dt><dd class="'+(b.rate===lo?'best':'')+'">'+mln(month(b,S.area))+' · '+grp(S.area)+' m²</dd><dt>'+K.rate+'</dt><dd>'+K.from+' '+grp(b.rate)+' '+K.perM2+'</dd><dt>'+K.district+'</dt><dd>'+h(b.dn)+'</dd><dt>'+K.metro+'</dt><dd>'+h(b.m)+'</dd><dt>'+K.parking+'</dt><dd>'+h(b.p)+'</dd><dt>'+K.size+'</dt><dd>'+h(b.area)+'</dd></dl>'+
    '<button type="button" class="btn btn-or btn-sm" data-view="'+b.id+'">'+K.view+'</button></div></div>'}).join('');
  cmpBox.hidden=false;back.hidden=false;var x=$('[data-close]',cmpBox);if(x)x.focus()}
function cmpClose(){cmpBox.hidden=true;back.hidden=true}
$('#cmp-open').onclick=cmpOpen;back.onclick=cmpClose;$('[data-close]',cmpBox).onclick=cmpClose;
$('#cmp-clear').onclick=function(){cmpSel=[];$$('[data-cmp]').forEach(function(i){i.checked=false});bar.hidden=true};
d.addEventListener('keydown',function(e){if(e.key==='Escape'){cmpClose();if(menu&&!menu.hidden)menuSet(false)}});

/* ── Калькулятор ──────────────────────────────────────────────────── */
var cb=$('#cl-bc'),ca=$('#cl-area'),cao=$('#cl-area-o');
function calcArea(a){ca.value=Math.max(30,Math.min(1000,a));calc()}
function calcOpts(){$$('option',cb).forEach(function(o){var b=BC[o.value];o.textContent=b.n+' · '+grp(b.rate)+' '+K.perM2})}
function calc(){var b=BC[cb.value],a=+ca.value,inc=$('input[name="cl-vat"]:checked').value==='1',m=b.rate*a,no=inc?m/1.12:m,vat=inc?m:m*1.12;
  cao.textContent=grp(a);track(ca);
  $('#cl-m').textContent=grp(inc?m:no);$('#cl-mf').textContent=fill(K.vatM,{s:sum(vat)});
  $('#cl-vat').textContent=sum(vat);$('#cl-novat').textContent=sum(no);$('#cl-y').textContent=sum(vat*12);$('#cl-rate').textContent=grp(b.rate)+' '+K.perM2}
cb.onchange=calc;ca.oninput=function(){S.area=+ca.value;fa.value=vOfArea(S.area);sync('calc');calc()};
$$('input[name="cl-vat"]').forEach(function(r){r.onchange=calc});
$('#cl-view').onclick=function(){toView(cb.value)};

/* ── Схема этажа ──────────────────────────────────────────────────── */
var U=JSON.parse($('#fl-data').textContent),fl=0,fu=null,info=$('#fl-info'),PL=BC.platform;
function unitSt(i){return stOf('platform',(fl+1)*8+i)}
function unitsSync(){U.forEach(function(u,i){u.f[fl]=unitSt(i)==='f'?1:0})}
function floorDraw(){unitsSync();$$('.fl-u').forEach(function(g,i){var u=U[i],free=!!u.f[fl];g.classList.toggle('free',free);g.classList.toggle('hold',unitSt(i)==='h');g.classList.remove('pick');
  g.setAttribute('role','button');g.setAttribute('tabindex',free?'0':'-1');g.setAttribute('aria-label',fill(K.unit,{n:(fl+3)+'.'+u.n})+', '+u.a+' m²');
  if(!REDUCED){g.style.animation='none';void g.getBoundingClientRect();g.style.animation='';g.style.animationDelay=(i*50)+'ms'}})}
function unitPick(i){var u=U[i];if(!u.f[fl]){info.innerHTML='<p class="fl-hint">'+(unitSt(i)==='h'?K.hold:K.busy)+'</p>';return}
  fu=(fl+3)+'.'+u.n;$$('.fl-u').forEach(function(g,j){g.classList.toggle('pick',j===i)});
  info.innerHTML='<p class="kicker">Platform · '+K.floorN[fl]+'</p><h3>'+fill(K.unit,{n:fu})+'</h3><p class="fi-m">'+mln(PL.rate*u.a)+'<small style="display:block;font:400 14px var(--ft);color:var(--tx2)">'+fill(K.perMonth,{a:u.a})+'</small></p>'+
  '<dl><dt>'+K.sizeOne+'</dt><dd>'+u.a+' m²</dd><dt>'+K.windows+'</dt><dd>'+h(u.w)+'</dd><dt>'+K.rate+'</dt><dd>'+K.from+' '+grp(PL.rate)+' '+K.perM2+'</dd></dl>'+
  '<button type="button" class="btn btn-or" data-view="platform" data-area="'+u.a+'" data-unit="'+fu+'">'+K.unitView+'</button>'}
$$('.fl-u').forEach(function(g,i){g.addEventListener('click',function(){unitPick(i)});g.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();unitPick(i)}})});
$$('.fl-tabs button').forEach(function(t){t.onclick=function(){fl=+t.getAttribute('data-fl');$$('.fl-tabs button').forEach(function(x){var on=x===t;x.classList.toggle('on',on);x.setAttribute('aria-selected',on)});floorDraw();var first=U.findIndex(function(u){return u.f[fl]});unitPick(first)}});
floorDraw();

/* ── Просмотр в два нажатия ───────────────────────────────────────── */
var vb=$('#vw-bc'),vDays=$('#vw-days'),vDay='',vTime='',vUnit='',vArea=0;
(function(){var now=new Date(),out=[],k=0;for(var i=0;out.length<6&&i<10;i++){var dt=new Date(now.getFullYear(),now.getMonth(),now.getDate()+i);if(dt.getDay()===0)continue;
  var lab=i===0?K.today:i===1?K.tomorrow:K.days[dt.getDay()],full=EN?K.days[dt.getDay()]+', '+dt.getDate()+' '+K.months[dt.getMonth()]:dt.getDate()+' '+K.months[dt.getMonth()];
  out.push('<button type="button" class="chip" data-day="'+h(full)+'" data-ts="'+dt.getTime()+'" aria-pressed="false">'+h(lab)+'<small>'+dt.getDate()+' '+h(K.months[dt.getMonth()].slice(0,3))+'</small></button>');k++}
  vDays.innerHTML=out.join('')})();
$$('[data-day]').forEach(function(c){c.onclick=function(){vDay=c.getAttribute('data-day');vDayTs=+c.getAttribute('data-ts');$$('[data-day]').forEach(function(x){x.setAttribute('aria-pressed',x===c)});vwMsg()}});
$$('[data-time]').forEach(function(c){c.onclick=function(){vTime=c.getAttribute('data-time');$$('[data-time]').forEach(function(x){x.setAttribute('aria-pressed',x===c)});vwMsg()}});
vb.onchange=function(){vUnit='';vwMsg()};
function vwMsg(){var b=BC[vb.value],name=b?b.n+(vUnit?', '+fill(K.unit,{n:vUnit}):''):K.anyBc;
  var t=fill(K.msg,{bc:name,a:grp(vArea||S.area),d:vDay||K.pickDay,h:vTime||K.pickTime});
  $('#vw-msg').textContent=t;$('#vw-wa').href=K.wa+'?text='+encodeURIComponent(t);$('#vw-tg').setAttribute('data-tg',t);
  $('#vw-wa').classList.toggle('ready',!!(vDay&&vTime)&&!REDUCED);
  if(fp){var w=S.where?(S.where.charAt(0)==='b'?BC[S.where.slice(2)].n:K.dist[S.where.slice(2)]):K.anyBc;fp.href=K.wa+'?text='+encodeURIComponent(fill(K.pickMsg,{a:grp(S.area),w:w,b:grp(S.budget/1e6)}))}}
var vDayTs=0;
$('#vw-wa').addEventListener('click',function(){viewLead('wa')});$('#vw-tg').addEventListener('click',function(){viewLead('tg')});
function viewLead(ch){leadAdd({kind:'view',ch:ch,bc:vb.value,area:vArea||S.area,unit:vUnit,day:vDay,dayTs:vDayTs,time:vTime,budget:S.budget,where:S.where})}
var fp=$('#fd-wa');if(fp)fp.addEventListener('click',function(){leadAdd({kind:'pick',ch:'wa',area:S.area,budget:S.budget,where:S.where,n:K.bc.filter(fits).length})});
function toView(id,area,unit){if(id)demand({k:'v',id:id,ts:Date.now()});vb.value=id||'';vUnit=unit||'';vArea=area||0;vwMsg();cmpClose();var s=$('#prosmotr');s.scrollIntoView({behavior:REDUCED?'auto':'smooth'});$$('.rv',s).forEach(function(e){e.classList.add('in')})}
d.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-view]');if(!b)return;toView(b.getAttribute('data-view'),+b.getAttribute('data-area')||0,b.getAttribute('data-unit')||'')});

/* ── Цифры катятся ────────────────────────────────────────────────── */
var nums=$$('[data-to]');
if('IntersectionObserver' in W&&!REDUCED){var nio=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;nio.unobserve(e.target);var el=e.target,to=+el.getAttribute('data-to'),t0=0,yr=to>1900&&to<2100;
  function f(t){if(!t0)t0=t;var k=Math.min(1,(t-t0)/1400),v=yr?Math.round(1990+(to-1990)*(1-Math.pow(1-k,3))):to*(1-Math.pow(1-k,3));el.textContent=yr?String(v):grp(v);if(k<1)requestAnimationFrame(f)}requestAnimationFrame(f)})},{threshold:.4});
  nums.forEach(function(n){if(/^\d+$/.test(n.getAttribute('data-to')))nio.observe(n)})}

/* ── Стоимость сайта: допы и отсчёт 48 часов ──────────────────────── */
var rows=$$('#kit input[data-k]'),sumEl=$('#kit-sum'),addEl=$('#kit-add'),cntEl=$('#kit-cnt'),shown=K.offer.base;
function usd(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')+' $'}
function roll(to){var from=shown;shown=to;if(REDUCED){sumEl.textContent=usd(to);return}var t0=0;function f(t){if(!t0)t0=t;var k=Math.min(1,(t-t0)/500);sumEl.textContent=usd(from+(to-from)*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(f)}requestAnimationFrame(f)}
function kit(){var add=0,c=0;rows.forEach(function(r){if(r.checked){add+=+r.getAttribute('data-p');c++}});addEl.textContent=usd(add);cntEl.textContent=c;roll(K.offer.base+add)}
rows.forEach(function(r){r.onchange=kit});
$('#kit-pnl').onclick=function(){K.offer.items.forEach(function(x){var r=$('#kit input[data-k="'+x.id+'"]');if(r&&x.g==='panel')r.checked=true});kit();var g=$('#kit-panel');if(g)g.scrollIntoView({behavior:REDUCED?'auto':'smooth',block:'center'})};
$('#kit-new').onclick=function(){var isNew={};K.offer.items.forEach(function(x){if(x.n)isNew[x.id]=1});rows.forEach(function(r){r.checked=!!isNew[r.getAttribute('data-k')]});kit()};
$('#kit-copy').onclick=function(){var lines=[K.offer.head,'- '+K.offer.baseName+': '+usd(K.offer.base)];rows.forEach(function(r){if(r.checked){var it=K.offer.items.filter(function(x){return x.id===r.getAttribute('data-k')})[0];lines.push('- '+it.t+': '+usd(it.p))}});lines.push(K.offer.totalW+': '+sumEl.textContent);copy(lines.join('\n'));toast(K.offer.copied)};
kit();
var tm=$('#tm'),start=Date.now();try{var s0=+localStorage.getItem('so-offer-1');if(s0&&s0<=Date.now())start=s0;else localStorage.setItem('so-offer-1',String(start))}catch(e){}
var end=start+K.offer.hours*36e5;
function tick(){var left=Math.max(0,end-Date.now());if(!left){$('#timer').classList.add('over');tm.textContent='00:00:00';$('#timer span').firstChild.textContent=K.offer.ended;return}
  tm.textContent=pad(Math.floor(left/36e5))+':'+pad(Math.floor(left%36e5/6e4))+':'+pad(Math.floor(left%6e4/1e3));setTimeout(tick,1000)}
tick();

/* ── Параллакс фото: GSAP ScrollTrigger только читает прокрутку ───── */
function gs(){var G=W.gsap,ST=W.ScrollTrigger;if(REDUCED||!G||!ST)return;G.registerPlugin(ST);
  G.to('.hr-media',{yPercent:12,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
  $$('[data-par]').forEach(function(im){G.fromTo(im,{yPercent:-8},{yPercent:8,ease:'none',scrollTrigger:{trigger:im.parentNode.parentNode,start:'top bottom',end:'bottom top',scrub:true}})})}
if(d.readyState==='complete')gs();else addEventListener('load',gs);

function panelLive(){panelApply();applyCat();calcOpts();calc();if(cur)card.innerHTML=cardHtml(BC[cur]);floorDraw();if(fu)info.innerHTML='<p class="fl-hint">'+K.tapFree+'</p>';fu=null}
addEventListener('storage',function(e){if(e.key===PK)panelLive()});
calcOpts();
/* Панель в окне браузера: грузится, когда до неё долистали. */
var fr=$('.pnl-frame');if(fr){var go=function(){if(!fr.src)fr.src=fr.getAttribute('data-src')};if('IntersectionObserver' in W){var fio=new IntersectionObserver(function(es){if(es[0].isIntersecting){go();fio.disconnect()}},{rootMargin:'600px 0px'});fio.observe(fr)}else go()}
sync('init');
})();
