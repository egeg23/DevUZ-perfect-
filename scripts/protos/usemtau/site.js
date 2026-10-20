(function(){
'use strict';
/* Юсем Тау: общий скрипт главной и каталога. Позиции и цены за тонну —
   их (um-data), вес метра по ГОСТ посчитан при сборке. Заявка живёт в
   браузере (um-z-1): одна на главную и каталог. Наружу уходит только
   ссылкой в их WhatsApp и почту. Модель не вызывается. */
var d=document,root=d.documentElement;
var $=function(s,el){return (el||d).querySelector(s)},$$=function(s,el){return [].slice.call((el||d).querySelectorAll(s))};
var dataEl=$('#um-data');if(!dataEl)return;
var D=JSON.parse(dataEl.textContent);
var REDUCED=false;try{REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
var NB=' ';
function grp(n){return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,NB)}
function num(x,dg){var p=Math.pow(10,dg||0),v=Math.round(x*p)/p;var s=String(v).split('.');return grp(s[0])+(s[1]?','+s[1]:'')}
function tg(n){return grp(Math.round(n))+NB+'₸'}
function tons(t){return t<1?num(t*1000,0)+NB+'кг':num(t,t<10?2:1)+NB+'т'}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function sec(k,c){return '<svg class="sec'+(c?' '+c:'')+'" viewBox="0 0 64 64" aria-hidden="true"><use href="#s-'+k+'"/></svg>'}

/* ── Позиции ── */
var CAT={};D.cats.forEach(function(c){CAT[c.id]=c});
var ITEMS=D.items.map(function(a){return {id:a[0],n:a[1],c:a[2],p:a[3],kgm:a[4],kgm2:a[5],dims:a[6]||[],mark:a[7],bar:a[8],gost:a[9]}});
var BY={};ITEMS.forEach(function(x){BY[x.id]=x});
var UNITS={m:'м',sh:'хлыстов',m2:'м²',t:'т',kg:'кг'};
function unitsOf(x){return x.kgm?(x.bar?['m','sh','t']:['m','t']):x.kgm2?['m2','t']:['t','kg']}
function defQ(x){return x.kgm?{q:100,u:'m'}:x.kgm2?{q:10,u:'m2'}:{q:1,u:'t'}}
function toT(x,q,u){q=+q||0;if(u==='m')return q*x.kgm/1000;if(u==='sh')return q*(x.bar||0)*x.kgm/1000;if(u==='m2')return q*x.kgm2/1000;if(u==='kg')return q/1000;return q}
function metersOf(x,q,u){if(!x.kgm)return null;if(u==='m')return +q||0;if(u==='sh')return (+q||0)*x.bar;return toT(x,q,u)*1000/x.kgm}

/* ── Поиск: «арматура 12», «труба 40×20», «лист 3 мм» ── */
var SYN={balka:'двутавр балка',shveller:'швеллер швелер',  'truba-profil':'профтруба профильная квадратная прямоугольная профиль труба',truba:'труба круглая водогазопроводная электросварная',list:'лист листовой металл',setka:'сетка кладочная',armatura:'арматура арматурный',ugolok:'уголок угол',krug:'круг пруток',provoloka:'проволока вязальная',katanka:'катанка',kvadrat:'квадрат',polosa:'полоса',profnastil:'профнастил профлист',pvl:'просечно вытяжной пвл лист',rifl:'рифленый рифлёный лист',elektrody:'электроды'};
function norm(s){return String(s).toLowerCase().replace(/ё/g,'е').replace(/(\d)\s*[×x*х]\s*(?=\d)/g,'$1 ').replace(/(\d),(\d)/g,'$1.$2').replace(/[^a-zа-я0-9.\s]/g,' ').replace(/\s+/g,' ').trim()}
ITEMS.forEach(function(x){x.key=' '+norm(x.n+' '+CAT[x.c].n+' '+(SYN[x.c]||'')+' '+(x.mark||''))+' ';var ns=norm(x.n).match(/\d+(?:\.\d+)?/g)||[];x.nums=ns.map(Number)});
var STOP={'мм':1,'м':1,'d':1,'гост':1,'цена':1,'алматы':1,'купить':1,'шт':1};
function match(q){
  var toks=norm(q).split(' ').filter(function(t){return t&&!STOP[t]});if(!toks.length)return [];
  var words=toks.filter(function(t){return !/^\d/.test(t)}),nums=toks.filter(function(t){return /^\d/.test(t)}).map(Number);
  return ITEMS.filter(function(x){
    for(var i=0;i<words.length;i++){var w=words[i],st=w.length>4?w.slice(0,w.length-2):w;if(x.key.indexOf(' '+st)<0)return false}
    for(var j=0;j<nums.length;j++){if(x.nums.indexOf(nums[j])<0)return false}
    return true});
}

/* ── Тост ── */
var toastEl=$('#toast'),toastT=0;
function toast(m){if(!toastEl)return;toastEl.textContent=m;toastEl.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){toastEl.classList.remove('on')},2400)}

/* ── Заявка ── */
var KEY='um-z-1';
function load(){var s=null;try{s=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){}s=s||{};if(!Array.isArray(s.lines))s.lines=[];if(!Array.isArray(s.past))s.past=[];s.lines=s.lines.filter(function(l){return BY[l.id]});if(typeof s.city!=='number')s.city=-1;return s}
var Z=load();
function save(){try{localStorage.setItem(KEY,JSON.stringify(Z))}catch(e){}}
function lineT(l){return toT(BY[l.id],l.q,l.u)}
function totals(){var t=0,s=0,len=0;Z.lines.forEach(function(l){var x=BY[l.id],w=lineT(l);t+=w;s+=w*x.p;var L=l.cut?l.cut:(x.bar||(x.kgm2?6:3));if(L>len)len=L});return {t:t,s:s,len:len}}
function add(id,q,u,quiet){var x=BY[id];if(!x)return;var ex=Z.lines.filter(function(l){return l.id===id&&l.u===u})[0];if(ex)ex.q=(+ex.q||0)+(+q||0);else Z.lines.push({id:id,q:+q||0,u:u,cut:0});save();badges(true);renderDr();renderDoc();if(!quiet)toast('В заявке: '+x.n)}
function badges(pop){var n=Z.lines.length;$$('[data-badge]').forEach(function(b){b.hidden=!n;b.textContent=n;if(pop&&n){b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop')}})}

/* Доставка: машина по весу и длине, рейсы, цена по демо-тарифу. */
function deliv(t,len,ci){
  var city=D.cities[ci];if(!city)return null;
  var tr=-1;for(var i=0;i<D.trucks.length;i++){if(D.trucks[i].t>=t&&D.trucks[i].len>=len){tr=i;break}}
  var trips=1;if(tr<0){tr=D.trucks.length-1;trips=Math.max(1,Math.ceil(t/D.trucks[tr].t))}
  while(D.trucks[tr].len<len&&tr<D.trucks.length-1)tr++;
  var km=city[1],cost=km?km*D.tariff[tr]*trips:[9000,16000,24000,32000][tr]*trips;
  var free=t>=D.free&&km<=100;
  return {tr:D.trucks[tr],trips:trips,km:km,cost:free?0:cost,free:free,city:city[0]};
}

/* БИН Казахстана: 12 цифр, контрольная по весам 1-11, иначе 3-11,1,2; пятая цифра 4-6 у юрлиц. */
function binCheck(b){
  if(!/^\d{12}$/.test(b))return {ok:false,m:b.length?'БИН: 12 цифр, сейчас '+b.length:''};
  var a=b.split('').map(Number),s=0,i;for(i=0;i<11;i++)s+=a[i]*(i+1);s%=11;
  if(s===10){s=0;for(i=0;i<11;i++)s+=a[i]*((i+2)%11+1);s%=11}
  if(s===10||s!==a[11])return {ok:false,m:'Контрольная цифра не сходится: проверьте БИН'};
  if(a[4]<4||a[4]>6)return {ok:true,m:'Похоже на ИИН: счёт выпишем на ИП'};
  return {ok:true,m:'БИН верный, юридическое лицо'};
}

var dr=$('#dr'),lastFocus=null;
function openDr(){if(!dr)return;lastFocus=d.activeElement;dr.hidden=false;root.style.overflow='hidden';renderDr();var c=$('[data-close].ib',dr);if(c)c.focus()}
function closeDr(){if(!dr||dr.hidden)return;dr.hidden=true;root.style.overflow='';if(lastFocus&&lastFocus.focus)lastFocus.focus()}
d.addEventListener('click',function(e){var t=e.target.closest&&e.target.closest('[data-cart]');if(t){e.preventDefault();openDr();return}if(e.target.closest&&e.target.closest('[data-close]'))closeDr()});
d.addEventListener('keydown',function(e){if(e.key==='Escape')closeDr()});

function cutText(l){var x=BY[l.id];if(!l.cut||!x.bar)return '';var per=Math.floor(x.bar/l.cut);if(per<1)return 'Кусок длиннее хлыста '+num(x.bar,1)+' м';var L=metersOf(x,l.q,l.u)||0,pcs=Math.ceil(L/l.cut-1e-9),bars=Math.ceil(pcs/per),rest=x.bar-per*l.cut;return 'Из хлыста '+num(x.bar,1)+' м: '+per+' '+pl(per,'кусок','куска','кусков')+' по '+num(l.cut,2)+' м, обрезок '+num(rest,2)+' м. Всего '+pcs+' '+pl(pcs,'кусок','куска','кусков')+' из '+bars+' '+pl(bars,'хлыста','хлыстов','хлыстов')+'.'}
function pl(n,a,b,c){var m=n%100,k=n%10;return m>10&&m<20?c:k===1?a:k>1&&k<5?b:c}
function renderDr(){
  if(!dr)return;var list=$('#dr-list'),empty=$('#dr-empty'),more=$('#dr-more');
  list.innerHTML=Z.lines.map(function(l,i){var x=BY[l.id],w=lineT(l),m=metersOf(x,l.q,l.u);
    return '<div class="dl-row" data-i="'+i+'"><div class="dl-h">'+sec(CAT[x.c].sec)+'<span><b>'+esc(x.n)+'</b><small>'+tg(x.p)+' за т'+(x.kgm?' · 1 м = '+num(x.kgm,3)+' кг':x.kgm2?' · 1 м² = '+num(x.kgm2,2)+' кг':'')+'</small></span><button type="button" class="ib" data-del aria-label="Убрать '+esc(x.n)+'"><svg class="ic" aria-hidden="true"><use href="#i-x"/></svg></button></div>'+
    '<div class="dl-q"><input type="number" inputmode="decimal" min="0" step="any" value="'+l.q+'" aria-label="Количество" data-q><select data-u aria-label="Единица">'+unitsOf(x).map(function(u){return '<option value="'+u+'"'+(u===l.u?' selected':'')+'>'+UNITS[u]+'</option>'}).join('')+'</select></div>'+
    '<div class="dl-out"><span>'+(m!=null&&l.u!=='m'?'≈ '+num(m,0)+' м · ':'')+tons(w)+'</span><b>'+tg(w*x.p)+'</b></div>'+
    (x.bar&&x.kgm?'<div class="dl-cut"><label><input type="checkbox" data-cutt'+(l.cut?' checked':'')+'>Резка в размер</label>'+(l.cut?'<div class="dl-cutf"><span>Резать по, м</span><input type="number" inputmode="decimal" min="0.1" step="0.1" value="'+l.cut+'" data-cut aria-label="Длина куска, м"></div><p class="dl-cutr">'+cutText(l)+'</p>':'')+'</div>':'')+
    '</div>'}).join('');
  empty.hidden=!!Z.lines.length;more.hidden=!Z.lines.length;
  var rp=$('#dr-repeat');if(rp)rp.hidden=!Z.past.length;
  $('#dr-city').value=String(Z.city);
  if($('#dr-bin')!==d.activeElement)$('#dr-bin').value=Z.bin||'';
  if($('#dr-org')!==d.activeElement)$('#dr-org').value=Z.org||'';
  if($('#dr-tel')!==d.activeElement)$('#dr-tel').value=Z.tel||'';
  binNote();sums();
}
function sums(){if(!dr)return;var T=totals(),dv=Z.city>=0?deliv(T.t,T.len,Z.city):null;
  $('#dr-w').textContent=tons(T.t);$('#dr-sum').textContent=tg(T.s+(dv?dv.cost:0));
  $('#dr-dv').textContent=dv?(dv.tr.n+(dv.trips>1?' × '+dv.trips+' рейса':'')+' под '+tons(T.t)+' и длину '+num(T.len,1)+' м · '+(dv.free?'бесплатно: большой объём':'доставка '+tg(dv.cost)+' (демо-тариф)')):'Самовывоз: '+'Бурундайское шоссе 1 км, 1В';
  var msg=message(T,dv);$('#dr-wa').href='https://wa.me/'+D.brand.wa+'?text='+encodeURIComponent(msg);
  $('#dr-mail').href='mailto:'+D.brand.mail+'?subject='+encodeURIComponent('Заявка на счёт'+(Z.org?': '+Z.org:''))+'&body='+encodeURIComponent(msg);
}
function message(T,dv){var L=['Здравствуйте! Заявка на счёт с сайта usemtau.kz',''];
  Z.lines.forEach(function(l,i){var x=BY[l.id],w=lineT(l);L.push((i+1)+') '+x.n+': '+num(+l.q,2)+' '+UNITS[l.u]+(l.u!=='t'?' ('+tons(w)+')':'')+(l.cut?', резать по '+num(l.cut,2)+' м':'')+' · '+tg(w*x.p))});
  L.push('','Итого металл: '+tons(T.t)+' · '+tg(T.s));
  L.push(dv?'Доставка: '+dv.city+', '+dv.tr.n+(dv.trips>1?' × '+dv.trips:''):'Самовывоз со склада');
  if(Z.org||Z.bin)L.push('Счёт на: '+(Z.org||'')+(Z.bin?', БИН '+Z.bin:''));
  if(Z.tel)L.push('Телефон: '+Z.tel);
  return L.join('\n')}
function binNote(){var el=$('#dr-binok');if(!el)return;var r=binCheck((Z.bin||'').trim());el.textContent=r.m;el.className='dr-ok'+(r.m?(r.ok?' y':' n'):'')}
if(dr){
  dr.addEventListener('input',function(e){var row=e.target.closest('.dl-row'),t=e.target;
    if(row){var l=Z.lines[+row.getAttribute('data-i')];if(t.hasAttribute('data-q'))l.q=Math.max(0,+t.value||0);if(t.hasAttribute('data-cut'))l.cut=Math.max(0,+t.value||0);save();var x=BY[l.id],w=lineT(l),m=metersOf(x,l.q,l.u);$('.dl-out',row).innerHTML='<span>'+(m!=null&&l.u!=='m'?'≈ '+num(m,0)+' м · ':'')+tons(w)+'</span><b>'+tg(w*x.p)+'</b>';var cr=$('.dl-cutr',row);if(cr)cr.textContent=cutText(l);sums();renderDoc();return}
    if(t.id==='dr-bin'){t.value=t.value.replace(/\D/g,'').slice(0,12);Z.bin=t.value;binNote()}
    if(t.id==='dr-org')Z.org=t.value;if(t.id==='dr-tel')Z.tel=t.value;save();sums()});
  dr.addEventListener('change',function(e){var row=e.target.closest('.dl-row'),t=e.target;
    if(row){var l=Z.lines[+row.getAttribute('data-i')],x=BY[l.id];
      if(t.hasAttribute('data-u')){var w=lineT(l),nu=t.value;l.q=Math.round((nu==='t'?w:nu==='kg'?w*1000:nu==='m'?w*1000/x.kgm:nu==='sh'?w*1000/x.kgm/x.bar:w*1000/x.kgm2)*100)/100;l.u=nu}
      if(t.hasAttribute('data-cutt'))l.cut=t.checked?Math.min(3,x.bar||3):0;
      save();renderDr();renderDoc();return}
    if(t.id==='dr-city'){Z.city=+t.value;save();sums()}});
  dr.addEventListener('click',function(e){var del=e.target.closest('[data-del]');if(del){var i=+del.closest('.dl-row').getAttribute('data-i');Z.lines.splice(i,1);save();badges();renderDr();renderDoc();return}
    if(e.target.closest('#dr-repeat')){var p=Z.past[0];if(p){p.forEach(function(l){if(BY[l.id])Z.lines.push({id:l.id,q:l.q,u:l.u,cut:l.cut||0})});save();badges(true);renderDr();renderDoc();toast('Прошлая заявка в списке')}}
    if(e.target.closest('#dr-wa')||e.target.closest('#dr-mail')){if(Z.lines.length){Z.past.unshift(Z.lines.map(function(l){return {id:l.id,q:l.q,u:l.u,cut:l.cut}}));Z.past=Z.past.slice(0,5);save()}}});
}
badges();

/* Черновик счёта на главной: строки из заявки. */
function renderDoc(){var rows=$('#sd-rows');if(!rows)return;var T=totals();
  rows.innerHTML=Z.lines.slice(0,6).map(function(l,i){var x=BY[l.id],w=lineT(l);return '<div class="sd-row'+(i===Z.lines.length-1?' new':'')+'"><span>'+esc(x.n)+'<small>'+num(+l.q,2)+' '+UNITS[l.u]+(l.u!=='t'?' · '+tons(w):'')+(l.cut?' · резка по '+num(l.cut,2)+' м':'')+'</small></span><b>'+tg(w*x.p)+'</b></div>'}).join('')||'<div class="sd-row"><span>Пока пусто<small>добавьте позиции поиском или калькулятором</small></span><b>0'+NB+'₸</b></div>';
  $('#sd-tot').textContent=tg(T.s);var n=Z.lines.length;$('#sd-cnt').textContent=n+' '+pl(n,'позиция','позиции','позиций')}
renderDoc();
var fillB=$('#sd-fill');if(fillB)fillB.onclick=function(){[[/^Арматура 12$/,1200,'m',3.8],[/^Труба профильная 40×20×1,5$/,300,'m',0],[/^Лист г\/к 3,0$/,30,'m2',0],[/^Швеллер 16$/,1,'t',0]].forEach(function(r){var x=ITEMS.filter(function(i){return r[0].test(i.n)})[0];if(x){add(x.id,r[1],r[2],true);if(r[3])Z.lines[Z.lines.length-1].cut=r[3]}});save();renderDr();renderDoc();toast('Пример в заявке: откройте её')};

/* ── Поиск на первом экране ── */
var fq=$('#q'),fres=$('#find-res');
function rowHtml(x){var dq=defQ(x);return '<div class="fr" role="option">'+sec(CAT[x.c].sec)+'<span><b>'+esc(x.n)+'</b><small>'+tg(x.p)+' за т'+(x.kgm?' · 1 м = '+num(x.kgm,3)+' кг':'')+'</small></span><button type="button" class="ib" data-add="'+x.id+'" data-q="'+dq.q+'" data-u="'+dq.u+'" aria-label="В заявку: '+esc(x.n)+'"><svg class="ic" aria-hidden="true"><use href="#i-plus"/></svg></button></div>'}
function findShow(){var v=fq.value.trim();if(!v){fres.hidden=true;return}var r=match(v);
  fres.innerHTML=r.length?r.slice(0,5).map(rowHtml).join('')+'<a class="fr-all" href="'+D.katalog+'?q='+encodeURIComponent(v)+'">Все '+r.length+' в каталоге</a>':'<p class="fr-none">Не нашли «'+esc(v)+'». Напишите в WhatsApp: подберём.</p>';fres.hidden=false}
if(fq){fq.addEventListener('input',findShow);fq.addEventListener('focus',findShow);
  $$('.chips button').forEach(function(b){b.onclick=function(){fq.value=b.getAttribute('data-q');findShow();fq.focus()}});
  d.addEventListener('click',function(e){if(!e.target.closest('#find'))fres.hidden=true});
  fres.addEventListener('click',function(e){var b=e.target.closest('[data-add]');if(b){add(+b.getAttribute('data-add'),+b.getAttribute('data-q'),b.getAttribute('data-u'));b.innerHTML='<svg class="ic" aria-hidden="true"><use href="#i-check"/></svg>'}})}

/* ── Калькулятор ── */
(function(){var box=$('#cc-cats');if(!box)return;
  var cats=D.cats.filter(function(c){return ITEMS.some(function(x){return x.c===c.id})}),cur='armatura',item=null,mode='m';
  box.innerHTML=cats.map(function(c){return '<button type="button" role="radio" aria-checked="'+(c.id===cur)+'" data-c="'+c.id+'">'+sec(c.sec)+'<span>'+esc(c.n)+'</span></button>'}).join('');
  var sz=$('#cc-size'),md=$('#cc-mode'),q=$('#cc-q');
  function setCat(c){cur=c;$$('button',box).forEach(function(b){b.setAttribute('aria-checked',String(b.getAttribute('data-c')===c))});
    var l=ITEMS.filter(function(x){return x.c===c});sz.innerHTML=l.map(function(x){return '<option value="'+x.id+'">'+esc(x.n)+'</option>'}).join('');
    var pref=l.filter(function(x){return /^Арматура 12$|40×20×1,5|^Лист г\/к 3,0$|Швеллер 16$|Уголок 50×5$/.test(x.n)})[0];if(pref)sz.value=pref.id;setItem(+sz.value)}
  function setItem(id){item=BY[id];var us=unitsOf(item);if(us.indexOf(mode)<0){mode=us[0];q.value=defQ(item).q}
    md.innerHTML=us.map(function(u){return '<button type="button" role="radio" aria-checked="'+(u===mode)+'" data-u="'+u+'">'+({m:'Метры',sh:'Хлысты',m2:'Площадь',t:'Тонны',kg:'Килограммы'})[u]+'</button>'}).join('');calc()}
  function calc(){var x=item,qq=Math.max(0,+q.value||0),w=toT(x,qq,mode),m=metersOf(x,qq,mode);
    $('#cc-ql').textContent=({m:'Сколько метров',sh:'Сколько хлыстов по '+num(x.bar||0,1)+' м',m2:'Сколько квадратных метров',t:'Сколько тонн',kg:'Сколько килограммов'})[mode];
    $('#cc-sec').innerHTML=sec(CAT[x.c].sec)+'<span><b>'+esc(x.n)+'</b><small>'+tg(x.p)+' за тонну'+(x.mark?' · '+x.mark:'')+'</small></span>';
    roll($('#cc-w'),w,tons);roll($('#cc-len'),m==null?(x.kgm2&&mode!=='m2'?w*1000/x.kgm2:mode==='m2'?qq:0):m,function(v){return x.kgm2?num(v,1)+NB+'м²':m==null?'по весу':num(v,0)+NB+'м'});roll($('#cc-sum'),w*x.p,tg);
    $('#cc-note').textContent=x.kgm?'1 м = '+num(x.kgm,3)+' кг · в 1 т ≈ '+num(1000/x.kgm,0)+' м'+(x.bar?' · хлыст '+num(x.bar,1)+' м = '+num(x.kgm*x.bar,1)+' кг':''):x.kgm2?'1 м² = '+num(x.kgm2,2)+' кг · в 1 т ≈ '+num(1000/x.kgm2,1)+' м²':'Эта позиция продаётся по весу: метры и площадь скажет менеджер.'}
  box.onclick=function(e){var b=e.target.closest('button');if(b)setCat(b.getAttribute('data-c'))};
  sz.onchange=function(){setItem(+sz.value)};
  md.onclick=function(e){var b=e.target.closest('button');if(!b)return;var nu=b.getAttribute('data-u'),w=toT(item,+q.value||0,mode);mode=nu;q.value=Math.round((nu==='t'?w:nu==='kg'?w*1000:nu==='m'?w*1000/item.kgm:nu==='sh'?w*1000/item.kgm/item.bar:w*1000/item.kgm2)*100)/100;setItem(item.id)};
  q.oninput=calc;
  var step=function(k){return function(){var s=mode==='m'?10:mode==='m2'?5:mode==='kg'?100:mode==='t'?0.5:1;q.value=Math.max(0,Math.round(((+q.value||0)+k*s)*100)/100);calc()}};
  $('#cc-m').onclick=step(-1);$('#cc-p').onclick=step(1);
  $('#cc-add').onclick=function(){add(item.id,+q.value||0,mode)};
  setCat(cur);
})();

/* Числа катятся: только текст, ~0,5 с. */
function roll(el,to,f){if(!el)return;var from=+el.getAttribute('data-v')||0;el.setAttribute('data-v',to);if(REDUCED||!isFinite(from)||Math.abs(to-from)<1e-9){el.textContent=f(to);return}
  var t0=0;cancelAnimationFrame(el._r);function st(ts){if(!t0)t0=ts;var k=Math.min(1,(ts-t0)/450),e=1-Math.pow(1-k,3);el.textContent=f(from+(to-from)*e);if(k<1)el._r=requestAnimationFrame(st)}el._r=requestAnimationFrame(st)}

/* ── Доставка ── */
(function(){var ci=$('#dv-city');if(!ci)return;var tt=$('#dv-t'),lenB=$('#dv-len'),len=6;
  function go(anim){var t=+tt.value,dv=deliv(t,len,+ci.value);$('#dv-tv').textContent=num(t,1);$('#dv-tn').textContent=dv.tr.n;$('#dv-trips').textContent=dv.trips;
    roll($('#dv-cost'),dv.cost,function(v){return dv.free?'бесплатно':tg(v)});
    $('#dv-note').textContent=(dv.km?dv.city+': '+dv.km+' км от склада, '+num(dv.km*2/60,0)+'-'+num(dv.km*2/50,0)+' ч в пути туда и обратно. ':'По Алматы. ')+(dv.free?'От '+D.free+' т по Алматы и рядом доставка бесплатная: так у вас и написано про большие объёмы.':'Для '+tons(t)+' металла длиной '+num(len,1)+' м нужна машина «'+dv.tr.n+'» (кузов '+num(dv.tr.len,1)+' м).');
    var fill=Math.min(1,t/dv.trips/dv.tr.t),n=Math.max(1,Math.round(fill*6)),bw=Math.min(196,len/dv.tr.len*196),g='';for(var i=0;i<n;i++)g+='<rect x="'+(10+(196-bw))+'" y="'+(82-(i+1)*7)+'" width="'+bw.toFixed(0)+'" height="6" rx="1"/>';$('#dv-load').innerHTML=g;
    if(anim){var tr=$('#dv-truck');tr.classList.remove('go');void tr.offsetWidth;tr.classList.add('go')}}
  ci.onchange=function(){go(true)};tt.oninput=function(){go(false)};
  lenB.onclick=function(e){var b=e.target.closest('button');if(!b)return;len=+b.getAttribute('data-l');$$('button',lenB).forEach(function(x){x.setAttribute('aria-checked',String(x===b))});go(true)};
  go(false)})();

/* ── Расчёт ангара ── */
(function(){var w=$('#hg-w');if(!w)return;var type='rect',warm=1,l=$('#hg-l'),h=$('#hg-h'),g=$('#hg-g'),svg=$('#hg-svg');
  function seg(id,fn){var el=$(id);el.onclick=function(e){var b=e.target.closest('button');if(!b)return;$$('button',el).forEach(function(x){x.setAttribute('aria-checked',String(x===b))});fn(b.getAttribute('data-v'));go()}}
  seg('#hg-type',function(v){type=v;$('#hg-hf').hidden=v==='arch'});seg('#hg-warm',function(v){warm=+v});
  function go(){var W=+w.value,L=+l.value,H=+h.value,G=+g.value,gate=4*4.5,A=W*L,V,ws,rs,hh;
    $('#hg-wv').textContent=W;$('#hg-lv').textContent=L;$('#hg-hv').textContent=num(H,1);$('#hg-gv').textContent=G;
    if(type==='rect'){var rise=W*0.1;hh=H+rise;V=W*L*(H+rise/2);ws=2*L*H+2*(W*H+W*rise/2)-G*gate;rs=2*L*Math.hypot(W/2,rise)}
    else{hh=W*0.45;var a=W/2,b=hh,arc=Math.PI*(3*(a+b)-Math.sqrt((3*a+b)*(a+3*b)))/2;V=Math.PI*W*hh/4*L;ws=2*Math.PI*W*hh/4-G*gate;rs=arc*L}
    roll($('#hg-a'),A,function(v){return num(v,0)+NB+'м²'});roll($('#hg-v'),V,function(v){return num(v,0)+NB+'м³'});roll($('#hg-ws'),ws,function(v){return num(v,0)+NB+'м²'});roll($('#hg-rs'),rs,function(v){return num(v,0)+NB+'м²'});
    /* Рисунок: торец слева, план справа, масштаб общий. */
    var sc=Math.min(150/W,150/Math.max(hh,6)),x0=20,y0=190,fw=W*sc,s='<path class="g" d="M10 '+y0+'H390"/>';
    if(type==='rect'){var rr=W*0.1*sc;s+='<path class="sk" d="M'+x0+' '+y0+'V'+(y0-H*sc)+'L'+(x0+fw/2)+' '+(y0-H*sc-rr)+'L'+(x0+fw)+' '+(y0-H*sc)+'V'+y0+'Z"/>'}
    else{s+='<path class="sk" d="M'+x0+' '+y0+'A'+(fw/2)+' '+(hh*sc)+' 0 0 1 '+(x0+fw)+' '+y0+'Z"/>'}
    var gw=Math.min(fw*.3,4*sc);s+='<rect class="gt" x="'+(x0+fw/2-gw/2)+'" y="'+(y0-4.5*sc)+'" width="'+gw+'" height="'+(4.5*sc)+'"/>';
    s+='<text x="'+(x0+fw/2)+'" y="'+(y0+18)+'" text-anchor="middle">'+W+' м</text>';
    var px=220,pw=160,ph=Math.min(170,pw*L/W*0.5),py=y0-ph;s+='<rect class="sk" x="'+px+'" y="'+py+'" width="'+pw+'" height="'+ph+'"/>';
    var fr=Math.round(L/6);for(var i=1;i<fr;i++){var yy=py+ph*i/fr;s+='<path class="hf" d="M'+px+' '+yy+'H'+(px+pw)+'"/>'}
    for(var k=0;k<G;k++){var side=k%2,pos=Math.floor(k/2)+1,n=Math.ceil(G/2)+1;s+=side?'<rect class="gt" x="'+(px+pw*pos/n-8)+'" y="'+(py+ph-3)+'" width="16" height="6"/>':'<rect class="gt" x="'+(px+pw*pos/n-8)+'" y="'+(py-3)+'" width="16" height="6"/>'}
    s+='<text x="'+(px+pw/2)+'" y="'+(y0+18)+'" text-anchor="middle">план '+W+' × '+L+' м</text>';svg.innerHTML=s;
    var msg='Здравствуйте! Расчёт ангара с сайта usemtau.kz\nТип: '+(type==='rect'?'прямостенный, стены '+num(H,1)+' м':'арочный')+'\nРазмер: '+W+' × '+L+' м, площадь '+num(A,0)+' м²\nВорот: '+G+'\nСтены и кровля: '+(warm?'сэндвич-панели':'профнастил, холодный')+'\nПанелей: стены '+num(ws,0)+' м², кровля '+num(rs,0)+' м²\nПрошу посчитать стоимость и сроки.';
    $('#hg-go').href='https://wa.me/'+D.brand.wa+'?text='+encodeURIComponent(msg)}
  [w,l,h,g].forEach(function(el){el.oninput=go});go()})();

/* ── Стоимость: тумблеры и отсчёт 48 часов ── */
(function(){var rows=$$('#konstruktor input[data-k]');if(!rows.length)return;var sumEl=$('#kit-total-sum'),addEl=$('#kit-add'),nEl=$('#kit-cnt'),K=D.offer;
  function fmt(n){return grp(n)}
  function kit(){var a=0,n=0;rows.forEach(function(r){if(r.checked){a+=+r.getAttribute('data-p');n++}});addEl.textContent=fmt(a)+NB+'$';nEl.textContent=n;roll(sumEl,K.base+a,function(v){return grp(Math.round(v))+NB+'$'})}
  rows.forEach(function(r){r.onchange=kit});
  $('#kit-all').onclick=function(){var on=rows.some(function(r){return !r.checked});rows.forEach(function(r){r.checked=on});kit()};
  $('#kit-copy').onclick=function(){var L=['Сайт Юсем Тау, состав:','• '+K.baseName+': '+fmt(K.base)+' $'];rows.forEach(function(r){if(r.checked){var it=K.items.filter(function(x){return x.id===r.getAttribute('data-k')})[0];L.push('• '+it.t+': '+fmt(it.p)+' $')}});L.push('Итого: '+sumEl.textContent);
    var t=L.join('\n');if(navigator.clipboard)navigator.clipboard.writeText(t).then(function(){toast('Скопировано')},function(){toast('Не вышло скопировать')});else toast('Не вышло скопировать')};
  var tm=$('#tm'),start=Date.now();try{var s0=+localStorage.getItem('um-offer-1');if(s0&&s0<=Date.now())start=s0;else localStorage.setItem('um-offer-1',String(start))}catch(e){}
  var end=start+K.hours*36e5;function pad(n){return (n<10?'0':'')+n}
  function tick(){var left=Math.max(0,end-Date.now());if(!left){$('#timer').classList.add('over');tm.textContent='00:00:00';$('#timer span').firstChild.textContent='Акция закончилась, цена обычная';return}tm.textContent=pad(Math.floor(left/36e5))+':'+pad(Math.floor(left%36e5/6e4))+':'+pad(Math.floor(left%6e4/1e3));setTimeout(tick,1000)}tick()})();

/* ── Каталог ── */
(function(){var list=$('#kt-list');if(!list)return;
  var S={c:'',q:'',mark:'',min:'',max:'',bar:'',sort:''},LIM=40,shown=LIM;
  var h=location.hash.match(/c=([\w-]+)/);if(h&&CAT[h[1]])S.c=h[1];
  try{var qs=new URLSearchParams(location.search).get('q');if(qs)S.q=qs}catch(e){}
  var kq=$('#kq');kq.value=S.q;
  function units(x,u){return unitsOf(x).map(function(k){return '<option value="'+k+'"'+(k===u?' selected':'')+'>'+UNITS[k]+'</option>'}).join('')}
  function line(x){var dq=defQ(x),w=toT(x,dq.q,dq.u);
    return '<article class="it" data-id="'+x.id+'">'+sec(CAT[x.c].sec)+'<div class="it-n"><b>'+esc(x.n)+'</b><small>'+esc(CAT[x.c].n)+(x.mark?' · '+x.mark:'')+(x.gost?' · '+esc(x.gost):'')+(x.bar?' · хлыст '+num(x.bar,1)+' м':'')+'</small></div>'+
    '<div class="it-w">'+(x.kgm?'<span>1 м: <b>'+num(x.kgm,3)+' кг</b></span><span>в 1 т: <b>≈'+num(1000/x.kgm,0)+' м</b></span>':x.kgm2?'<span>1 м²: <b>'+num(x.kgm2,2)+' кг</b></span><span>в 1 т: <b>≈'+num(1000/x.kgm2,1)+' м²</b></span>':'<span>продаётся по весу</span>')+'</div>'+
    '<div class="it-p">'+tg(x.p)+'<small> за тонну</small></div>'+
    '<div class="it-q"><input type="number" inputmode="decimal" min="0" step="any" value="'+dq.q+'" aria-label="Количество: '+esc(x.n)+'"><select aria-label="Единица">'+units(x,dq.u)+'</select><button type="button" class="btn btn-blue" data-add>В заявку</button></div>'+
    '<p class="it-s">= '+tons(w)+' · <b>'+tg(w*x.p)+'</b></p></article>'}
  function filt(){var r=S.q?match(S.q):ITEMS.slice();
    if(S.c)r=r.filter(function(x){return x.c===S.c});if(S.mark)r=r.filter(function(x){return x.mark===S.mark});
    var mn=parseFloat(S.min),mx=parseFloat(S.max);if(!isNaN(mn))r=r.filter(function(x){return x.dims[0]>=mn});if(!isNaN(mx))r=r.filter(function(x){return x.dims[0]<=mx});
    if(S.bar!=='')r=r.filter(function(x){return S.bar==='0'?!x.bar:x.bar===+S.bar});
    if(S.sort==='p')r.sort(function(a,b){return a.p-b.p});if(S.sort==='s')r.sort(function(a,b){return (a.dims[0]||0)-(b.dims[0]||0)});return r}
  function render(){var r=filt();$('#kt-cnt').textContent=r.length?'Найдено: '+r.length+' '+pl(r.length,'позиция','позиции','позиций')+(S.c?' в разделе «'+CAT[S.c].n+'»':''):'Ничего не нашли. Уберите фильтр или напишите в WhatsApp: подберём.';
    list.innerHTML=r.slice(0,shown).map(line).join('')+(r.length>shown?'<button type="button" class="btn btn-line kt-more" id="kt-more">Показать ещё '+Math.min(LIM,r.length-shown)+'</button>':'');
    $$('#kt-cats button').forEach(function(b){b.setAttribute('aria-pressed',String(b.getAttribute('data-c')===S.c))})}
  $('#kt-cats').onclick=function(e){var b=e.target.closest('button');if(!b)return;S.c=b.getAttribute('data-c');shown=LIM;try{history.replaceState(null,'',S.c?'#c='+S.c:location.pathname+location.search)}catch(er){}render()};
  kq.oninput=function(){S.q=kq.value.trim();shown=LIM;render()};
  $('#kt-mark').onclick=function(e){var b=e.target.closest('button');if(!b)return;S.mark=b.getAttribute('data-v');$$('#kt-mark button').forEach(function(x){x.setAttribute('aria-checked',String(x===b))});render()};
  [['kt-min','min'],['kt-max','max'],['kt-bar','bar'],['kt-sort','sort']].forEach(function(p){var el=$('#'+p[0]);el.addEventListener(el.tagName==='SELECT'?'change':'input',function(){S[p[1]]=el.value;shown=LIM;render()})});
  list.addEventListener('click',function(e){if(e.target.id==='kt-more'){shown+=LIM;render();return}var b=e.target.closest('[data-add]');if(!b)return;var row=b.closest('.it'),x=BY[+row.getAttribute('data-id')];add(x.id,+$('input',row).value||0,$('select',row).value);row.classList.remove('flash');void row.offsetWidth;row.classList.add('flash')});
  function upd(e){var row=e.target.closest('.it');if(!row)return;var x=BY[+row.getAttribute('data-id')],w=toT(x,+$('input',row).value||0,$('select',row).value);$('.it-s',row).innerHTML='= '+tons(w)+' · <b>'+tg(w*x.p)+'</b>'}
  list.addEventListener('input',upd);list.addEventListener('change',upd);
  render()})();

/* ── Шапка: прячется при любой прокрутке, возвращается через 3 с после
   последнего события прокрутки. Инерция на телефоне тоже шлёт scroll,
   таймер ждёт её конца. Пока фокус с клавиатуры внутри шапки, не прячется. ── */
var top=$('#top'),IDLE=3000,idleT=0,lastY=scrollY;
function shown(v){root.classList.toggle('has-top',v)}
shown(true);
function headIdle(){if(!top)return;clearTimeout(idleT);if(!top.contains(d.activeElement)){top.classList.add('hide');shown(false)}idleT=setTimeout(function(){top.classList.remove('hide');shown(true)},IDLE)}
addEventListener('scroll',function(){if(Math.abs(scrollY-lastY)<2)return;lastY=scrollY;headIdle()},{passive:true});

/* ── Появление блоков ── */
var rvs=$$('.rv');
if(REDUCED||!('IntersectionObserver' in window))rvs.forEach(function(e){e.classList.add('in')});
else{var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target)}})},{rootMargin:'0px 0px -8% 0px'});rvs.forEach(function(e){io.observe(e)})}

/* ── GSAP: заголовок первого экрана, волна гофробалки, слои панели ── */
var G=window.gsap;
if(G&&!REDUCED&&window.ScrollTrigger){G.registerPlugin(window.ScrollTrigger);
  var hs=$$('.hero h1 span, .find, .hero-cta, .hero-facts');if(hs.length)G.from(hs,{y:32,opacity:0,duration:.9,ease:'power3.out',stagger:.09,delay:.15});
  var web=$('.gf-web');if(web)G.fromTo(web,{'--gw':1000},{'--gw':0,ease:'none',scrollTrigger:{trigger:'.gf-beam',start:'top 85%',end:'top 35%',scrub:.6}});
  var sp=$('#sp-v');if(sp)G.fromTo($$('.sp-l',sp),{'--x':.08},{'--x':1,ease:'none',scrollTrigger:{trigger:sp,start:'top 80%',end:'center 45%',scrub:.6}});
}else{$$('.sp-l').forEach(function(e){e.style.setProperty('--x',1)})}

/* ── Первый экран: торцы пакета труб, круга и арматуры на canvas. Пакет
   собирается из центра, свет скользит за пальцем или курсором. Перерисовка
   только когда что-то сдвинулось; вне экрана стоит. ── */
(function(){var cv=$('#ends');if(!cv||!cv.getContext)return;var cx=cv.getContext('2d'),hero=$('#hero');
  var dpr=1,W=0,H=0,cells=[],lx=.7,ly=.3,tx=.7,ty=.3,t0=0,raf=0,on=true,sprites={};
  function rnd(i){var x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x)}
  function sprite(kind,r,paint){var k=kind+r+paint;if(sprites[k])return sprites[k];var c=d.createElement('canvas'),s=Math.ceil(r*2+4)*dpr;c.width=c.height=s;var g=c.getContext('2d');g.scale(dpr,dpr);var m=r+2;
    var gr=g.createRadialGradient(m-r*.35,m-r*.4,r*.1,m,m,r);gr.addColorStop(0,'#C9D2DC');gr.addColorStop(.6,'#8C98A6');gr.addColorStop(1,'#4C5764');
    g.fillStyle=paint||gr;g.beginPath();g.arc(m,m,r,0,Math.PI*2);g.fill();
    if(kind==='pipe'){g.fillStyle='#07090C';g.beginPath();g.arc(m,m,r*.72,0,Math.PI*2);g.fill();g.strokeStyle='rgba(255,255,255,.18)';g.lineWidth=1;g.beginPath();g.arc(m,m,r*.72,Math.PI*.9,Math.PI*1.7);g.stroke()}
    else{g.strokeStyle='rgba(20,26,34,.25)';g.lineWidth=.7;for(var i=1;i<5;i++){g.beginPath();g.arc(m-r*1.4,m+r*.2,r*(.6+i*.35),-.5,.6);g.stroke()}
      if(kind==='rebar'){g.strokeStyle='rgba(20,26,34,.55)';g.lineWidth=Math.max(1.5,r*.12);g.beginPath();g.arc(m,m,r-1,0,Math.PI*2);g.setLineDash([r*.35,r*.25]);g.stroke();g.setLineDash([])}}
    g.strokeStyle='rgba(0,0,0,.5)';g.lineWidth=1;g.beginPath();g.arc(m,m,r,0,Math.PI*2);g.stroke();
    sprites[k]=c;return c}
  function fit(){var r=cv.getBoundingClientRect();dpr=Math.min(devicePixelRatio||1,2);W=r.width;H=r.height;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);sprites={};
    var R=W<700?20:28,dx=R*2+2,dy=dx*Math.sqrt(3)/2,cxp=W<1080?W*.5:W*.72,cyp=W<1080?H*.15:H*.5,rad=W<1080?Math.min(W*.66,H*.26):Math.min(W*.34,H*.62);cells=[];var n=0;
    for(var y=-dy;y<H+dy;y+=dy){var row=Math.round(y/dy);for(var x=-dx+(row%2?dx/2:0);x<W+dx;x+=dx){n++;var dd=Math.hypot(x-cxp,(y-cyp)*1.05);if(dd>rad+R*.5*rnd(n))continue;
      var u=rnd(n*3.7),kind=u<.4?'pipe':u<.75?'round':'rebar',rr=R*(kind==='rebar'?.82:kind==='round'?.9:1),paint=rnd(n*9.1)<.07?'#1A6BDB':rnd(n*5.3)<.03?'#F26A1F':null;
      cells.push({x:x,y:y,r:rr,k:kind,p:paint,dd:dd/rad,z:rnd(n*2.2)})}}
    draw(performance.now())}
  function draw(now){cx.setTransform(dpr,0,0,dpr,0,0);cx.clearRect(0,0,W,H);var age=REDUCED?9:(now-t0)/1000;
    for(var i=0;i<cells.length;i++){var c=cells[i],k=Math.min(1,Math.max(0,(age-c.dd*.9-c.z*.15)/.5));if(k<=0)continue;var e=1-Math.pow(1-k,3),s=sprite(c.k,c.r,c.p),sz=s.width/dpr*e;
      cx.globalAlpha=e;cx.drawImage(s,c.x-sz/2,c.y-sz/2,sz,sz)}
    cx.globalAlpha=1;cx.globalCompositeOperation='source-atop';var L=cx.createRadialGradient(lx*W,ly*H,0,lx*W,ly*H,Math.max(W,H)*.45);L.addColorStop(0,'rgba(255,255,255,.28)');L.addColorStop(1,'rgba(255,255,255,0)');cx.fillStyle=L;cx.fillRect(0,0,W,H);cx.globalCompositeOperation='source-over'}
  function loop(now){raf=0;if(!on)return;lx+=(tx-lx)*.08;ly+=(ty-ly)*.08;draw(now);var age=(now-t0)/1000;if(age<2.6||Math.abs(tx-lx)+Math.abs(ty-ly)>.002)raf=requestAnimationFrame(loop)}
  function kick(){if(!raf&&on&&!REDUCED)raf=requestAnimationFrame(loop)}
  hero.addEventListener('pointermove',function(e){var r=cv.getBoundingClientRect();tx=(e.clientX-r.left)/r.width;ty=(e.clientY-r.top)/r.height;kick()},{passive:true});
  addEventListener('scroll',function(){if(!on)return;var k=Math.min(1,scrollY/Math.max(1,innerHeight));tx=.3+.5*k;ty=.2+.3*k;kick()},{passive:true});
  if('IntersectionObserver' in window)new IntersectionObserver(function(es){on=es[0].isIntersecting;kick()}).observe(hero);
  var rt=0;addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(fit,150)});
  t0=performance.now();fit();kick();
  if(d.fonts&&d.fonts.ready)d.fonts.ready.then(function(){draw(performance.now())});
})();
})();
