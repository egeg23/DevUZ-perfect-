/* CARGO PRO GROUP: поведение сайта. Прокрутку не перехватываем: сцены только
   читают, сколько прошли, и двигают transform и opacity. Состояние демо —
   в браузере: заявки cp-req-1 (их читает панель), статусы из панели
   cp-panel-1, конструктор cp-cfg-1, настройки супер-админки cp-set-1 (объёмный
   коэффициент, наценка по категории, плотность, допы, валюты, курс, оплата).
   Ставки — середина рынка из tariffs.mjs, пока в настройках не поменяли. */
(function(){
var d=document,w=window,$=function(s,r){return(r||d).querySelector(s)},$$=function(s,r){return[].slice.call((r||d).querySelectorAll(s))};
var D=JSON.parse($('#cp-data').textContent),T=D.t;
var RM=w.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function get(k,def){try{var v=localStorage.getItem(k);return v?JSON.parse(v):def}catch(e){return def}}
function put(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function cl(v){return v<0?0:v>1?1:v}
var toastT=0;function toast(m){var t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('on')},2400)}
var lanes={};D.lanes.forEach(function(x){lanes[x.id]=x});
/* Настройки супер-админки: нет записи — умолчания из сборки (те же числа). */
var SETS=get('cp-set-1',{});
function sv(a,def){var o=SETS;for(var i=0;i<a.length;i++){if(o==null||typeof o!=='object')return def;o=o[a[i]]}return o==null||o===''?def:o}
function bandK(b,d){if(!b)return 1;for(var i=0;i<b.length;i++){if(!(+b[i].to)||d<=+b[i].to)return +b[i].k||1}return 1}
function sub(s,o){return String(s).replace(/\{(\w+)\}/g,function(_,k){return o[k]==null?'':o[k]})}
function fv(n){return String(n).replace('.',D.l==='ru'?',':'.')}

/* Конструктор на первой странице выключает допы: их блоки уходят. */
var cfg=get('cp-cfg-1',{});
function addonOn(id){return cfg[id]!==false}
function applyCfg(){cfg=get('cp-cfg-1',{});$$('[data-addon]').forEach(function(e){e.classList.toggle('off',!addonOn(e.getAttribute('data-addon')))})}
applyCfg();

/* Шапка: прячется при любой прокрутке, возвращается через 3 с после последнего события. */
var top=$('.top'),dock=$('#dock'),IDLE=3000,idleT=0;
function headIdle(){if(!top)return;clearTimeout(idleT);
  if(!top.contains(d.activeElement))top.classList.add('hide');
  idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}

/* Заголовок: слова выезжают по очереди. */
$$('.hero h1 .w>span').forEach(function(s,i){s.style.transitionDelay=(120+i*70)+'ms'});
requestAnimationFrame(function(){var h1=$('.hero h1');if(h1)h1.classList.add('on');$$('.hero .rise').forEach(function(e){e.classList.add('on')})});

/* Появление блоков: у каждого своё движение. */
var io='IntersectionObserver'in w?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'}):null;
$$('.rise,.tilt,.pop,.slide,.slider,.lift,.drop,.flip,.chat').forEach(function(e){if(e.closest('.hero'))return;if(io&&!RM)io.observe(e);else e.classList.add('on')});

/* Жидкое стекло и подсветка карточки за курсором. */
d.addEventListener('pointermove',function(e){var g=e.target.closest&&e.target.closest('.glass');if(g){var r=g.getBoundingClientRect();g.style.setProperty('--gx',((e.clientX-r.left)/r.width*100)+'%');g.style.setProperty('--gy',((e.clientY-r.top)/r.height*100)+'%')}
  var c=e.target.closest&&e.target.closest('.sv');if(c){var q=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-q.left)+'px');c.style.setProperty('--my',(e.clientY-q.top)+'px')}},{passive:true});

/* Первый экран: кадр грузового узла из сцены залёта (шифром, тем же ключом). */
(function(){var im=$('#hubimg');if(!im||!w.crypto||!crypto.subtle||!w.fetch)return;
  var set=w.innerWidth<900?'m':'d';
  fetch(D.root+'/promo/scene',{credentials:'same-origin'}).then(function(r){if(!r.ok)throw 0;return r.arrayBuffer()})
  .then(function(b){return crypto.subtle.importKey('raw',b,'AES-GCM',false,['decrypt'])})
  .then(function(key){return fetch(D.img+'/seq/'+set+'/f59.bin').then(function(r){if(!r.ok)throw 0;return r.arrayBuffer()}).then(function(buf){return crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(buf,0,12)},key,new Uint8Array(buf,12))})})
  .then(function(x){im.onload=function(){im.classList.add('on')};im.src=URL.createObjectURL(new Blob([x],{type:'image/webp'}))})
  .catch(function(){})})();

/* ── Маршруты: камера идёт по направлениям по прокрутке ───────────── */
var rt=$('.routes'),order=['cn','tr','ae','in','eu'],lns={},len={},veh=$('#veh'),rdots=$$('.rdots b'),cur=-1;
$$('[data-ln]').forEach(function(p){var id=p.getAttribute('data-ln');lns[id]=p;len[id]=p.getTotalLength?p.getTotalLength():600;p.style.strokeDasharray=len[id];p.style.strokeDashoffset=len[id]});
function laneCard(i){if(i===cur)return;cur=i;var x=lanes[order[i]];$('#rcn').textContent=x.n;$('#rcc').textContent=x.c+' → '+(D.l==='ru'?'Ташкент':'Toshkent');
  $('#rcm').innerHTML=['air','auto','rail','sea'].map(function(m){var r=x[m];return'<li'+(r?'':' class="no"')+'><span>'+T.mode[m]+'</span><b>'+(r?r.days+' '+(D.l==='ru'?'дн.':'kun'):T.no)+'</b></li>'}).join('');
  order.forEach(function(id,k){lns[id].classList.toggle('dim',k!==i)})}
function routeAt(p){var n=order.length,i=Math.min(n-1,Math.floor(p*n)),lp=cl(p*n-i);laneCard(i);
  order.forEach(function(id,k){lns[id].style.strokeDashoffset=(len[id]*(k<i?0:k===i?1-lp:1)).toFixed(1)});
  rdots.forEach(function(b,k){b.style.transform='scaleX('+(k<i?1:k===i?lp:0).toFixed(3)+')'});
  var path=lns[order[i]];if(veh&&path&&path.getPointAtLength){var pt=path.getPointAtLength(len[order[i]]*lp);veh.setAttribute('transform','translate('+pt.x.toFixed(1)+' '+pt.y.toFixed(1)+')')}}
if(rt)routeAt(RM?0.1:0);
if(RM&&rt){order.forEach(function(id){lns[id].style.strokeDashoffset=0;lns[id].classList.remove('dim')})}

/* Всё, что зависит от прокрутки, считается в одном кадре. */
var velo=$$('.velo .row'),vx=[0,0],lastY=scrollY,speed=0,ticking=false,par=$$('[data-par]');
function frame(){if(ticking)return;ticking=true;requestAnimationFrame(tick)}
function tick(){ticking=false;var y=scrollY,vh=innerHeight;
  speed=speed* /*~*/.86+(y-lastY)*.14;lastY=y;
  if(y<vh*1.5&&!RM)par.forEach(function(e){var k=+e.getAttribute('data-par');e.style.transform='translate3d(0,'+(y*k).toFixed(1)+'px,0)'});
  if(rt&&!RM){var R=rt.getBoundingClientRect();if(R.top<vh&&R.bottom>0)routeAt(cl(-R.top/(R.height-vh)))}
  if(dock)dock.classList.toggle('hide',y<vh*.6||!!$('.sheet.on'))}
function veloLoop(){if(!RM&&!d.hidden){var v=1+Math.min(6,Math.abs(speed)*.25);velo.forEach(function(r,i){var wd=r.scrollWidth/3;vx[i]=(vx[i]+(i?-1:1)*v*.6)%wd;r.style.transform='translate3d('+(i?vx[i]-wd:-vx[i]).toFixed(1)+'px,0,0)'})}requestAnimationFrame(veloLoop)}
addEventListener('scroll',function(){headIdle();frame()},{passive:true});addEventListener('resize',frame);frame();
if(velo.length)veloLoop();

/* ── Конструктор тарифов ──────────────────────────────────────────── */
var st={dir:'cn',m:'air',kg:250,m3:1.2,ct:'c40',n:1,cur:'USD'};
var kgI=$('#kg'),m3I=$('#m3');
function money(n){var r=st.cur==='USD'?1:+sv(['co','fxAuto'],1)?D.fx[st.cur]:+sv(['co','fx',st.cur],D.fx[st.cur]),v=n*r;return st.cur==='USD'?fmt(v)+' $':st.cur==='UZS'?fmt(Math.round(v/1000)*1000)+' '+(D.l==='ru'?'сум':'so‘m'):st.cur==='EUR'?fmt(v)+' €':fmt(v)+' AED'}
function avail(){var x=lanes[st.dir];$$('#modes [data-m]').forEach(function(b){var m=b.getAttribute('data-m');b.disabled=!x[m];b.setAttribute('aria-pressed',m===st.m)});
  if(!x[st.m]){st.m=['air','auto','rail','sea'].filter(function(m){return x[m]})[0];return avail()}}
function calc(){avail();var x=lanes[st.dir],r=x[st.m],byKg=st.m==='air'||st.m==='auto';
  $('#bykg').hidden=!byKg;$('#bycont').hidden=byKg;
  $('#kgv').textContent=fmt(st.kg)+' '+T.kg;$('#m3v').textContent=String(st.m3).replace('.',D.l==='ru'?',':'.')+' '+T.m3;
  var lines=[],fr,cw=0;
  /* Платный вес, плотность и минимальная сумма — из настроек супер-админки. */
  if(byKg){var dim=+sv(['tar','dim',st.m],D.dim[st.m]),dens=st.m3?st.kg/st.m3:0,k=bandK(sv(['tar','bands'],D.bands),dens);cw=Math.max(st.kg,st.m3*dim);fr=cw*r.kg*k;
    $('#cw').textContent=T.cw+': '+fmt(cw)+' '+T.kg+', '+(cw>st.kg?T.cwBy:T.cwW)+' · '+fv(r.kg)+' $ '+T.per+' · '+T.dens+' '+fmt(dens)+' '+T.kg+'/'+T.m3+(k!==1?' × '+fv(k):'');
    var lab=T.fr+' · '+T.mode[st.m]+', '+fmt(cw)+' '+T.kg+(k!==1?' × '+fv(k):''),mn=+sv(['tar','min'],0);if(mn&&fr<mn){fr=mn;lab+=' · '+T.minc}
    lines.push([lab,fr])}
  else{fr=r[st.ct]*st.n;lines.push([T.fr+' · '+T.mode[st.m]+', '+st.n+'×'+(st.ct==='c20'?'20′':'40′'),fr])}
  var ck=$('#ocat').value,cp=+sv(['tar','cat',ck],D.cat[ck])||0;$('#ocatp').textContent=(cp>0?'+':'')+cp+'%';
  if(cp)lines.push([T.cat[ck]+' '+(cp>0?'+':'')+cp+'%',fr*cp/100]);
  var fu=+sv(['tar','fuel'],0);if(fu)lines.push([T.fuel+' '+fu+'%',fr*fu/100]);
  var val=+$('#val').value||0,ins=Math.max(+sv(['tar','ins','min'],D.ex.ins.min),val*+sv(['tar','ins','pct'],D.ex.ins.pct)/100);$('#oinsp').textContent=money(ins);
  if($('#oins').checked)lines.push([T.ins,ins]);
  if($('#ocus').checked)lines.push([T.cus,+sv(['tar','customs'],D.ex.customs)]);
  var door=byKg?+sv(['tar','door','base'],D.ex.door.base)+cw*+sv(['tar','door','kg'],D.ex.door.kg):+sv(['tar','door','cont'],D.ex.door.cont)*st.n;$('#odoorp').textContent=money(door);
  if($('#odoor').checked)lines.push([T.door,door]);
  var cn=Math.max(1,+$('#consn').value||1);if($('#ocons').checked)lines.push([T.cons+' × '+cn,+sv(['tar','cons'],D.ex.cons)*cn]);
  var tot=lines.reduce(function(a,l){return a+l[1]},0);
  $('#tsum').innerHTML=lines.map(function(l){return'<div class="li"><span>'+esc(l[0])+'</span><b>'+money(l[1])+'</b></div>'}).join('')+'<div class="big"><span>'+T.tot+'</span><b id="ttot">'+money(tot)+'</b></div>';
  $('#tdays').textContent=x.c+' → '+(D.l==='ru'?'Ташкент':'Toshkent')+': '+r.days+' '+T.days;
  st.lines=lines;st.tot=tot;st.days=r.days;st.cw=cw}
$$('#dirs [data-dir]').forEach(function(b){b.addEventListener('click',function(){st.dir=b.getAttribute('data-dir');$$('#dirs [data-dir]').forEach(function(x){x.setAttribute('aria-pressed',x===b)});calc()})});
$$('#modes [data-m]').forEach(function(b){b.addEventListener('click',function(){st.m=b.getAttribute('data-m');calc()})});
kgI.addEventListener('input',function(){st.kg=+kgI.value;calc()});m3I.addEventListener('input',function(){st.m3=+m3I.value;calc()});
$$('input[name=ct]').forEach(function(r){r.addEventListener('change',function(){st.ct=r.value;calc()})});
$('#cn').addEventListener('input',function(){st.n=Math.max(1,Math.min(20,+$('#cn').value||1));calc()});
['#oins','#ocus','#odoor','#ocons','#ocat','#val','#consn'].forEach(function(s){$(s).addEventListener('input',calc);$(s).addEventListener('change',calc)});
$$('.cur [data-cur]').forEach(function(b){b.addEventListener('click',function(){st.cur=b.getAttribute('data-cur');$$('.cur [data-cur]').forEach(function(x){x.setAttribute('aria-pressed',x===b)});calc()})});
/* Валюты, которые компания включила, и условия оплаты — из настроек. */
function applySet(){SETS=get('cp-set-1',{});var on={};$$('.cur [data-cur]').forEach(function(b){var k=b.getAttribute('data-cur');on[k]=+sv(['co','cur',k],1)!==0;b.hidden=!on[k]});
  if(!on[st.cur]){st.cur='USD';$$('.cur [data-cur]').forEach(function(x){x.setAttribute('aria-pressed',x.getAttribute('data-cur')==='USD')})}
  var vat=+sv(['co','vat'],0);$('#payl').textContent=sub(T.pay,{p:sv(['co','prepay'],50),d:sv(['co','defer'],14)})+' · '+(vat?sub(T.vatOn,{v:sv(['co','vatPct'],12)}):T.vatOff)}
applySet();calc();
/* Быстрый расчёт на первом экране и кнопки услуг ведут в конструктор с выбором. */
var qm='air';$$('[data-qm]').forEach(function(b){b.addEventListener('click',function(){qm=b.getAttribute('data-qm');$$('[data-qm]').forEach(function(x){x.setAttribute('aria-pressed',x===b)})})});
function pick(dir,m,kg){if(dir){st.dir=dir;$$('#dirs [data-dir]').forEach(function(x){x.setAttribute('aria-pressed',x.getAttribute('data-dir')===dir)})}if(m)st.m=m;if(kg){st.kg=Math.max(10,Math.min(5000,Math.round(kg/10)*10));kgI.value=st.kg}calc()}
$('#qc').addEventListener('submit',function(e){e.preventDefault();pick($('#qdir').value,qm,+$('#qkg').value||250);$('#calc').scrollIntoView();toast(T.tot+': '+$('#ttot').textContent)});
$$('[data-mode]').forEach(function(a){a.addEventListener('click',function(){var m=a.getAttribute('data-mode');if(m==='customs'){$('#ocus').checked=true;calc()}else if(m==='multi')pick(null,'sea');else pick(null,m)})});

/* ── Окно ─────────────────────────────────────────────────────────── */
var sheet=$('#sheet');
function open(title,body,foot){$('#shh').textContent=title;$('#shb').innerHTML=body;$('#shf').innerHTML=foot||'';sheet.classList.add('on');d.body.style.overflow='hidden';frame();var f=$('input,button',$('#shb'))||$('.x',sheet);f.focus()}
function close(){sheet.classList.remove('on');d.body.style.overflow='';frame()}
sheet.addEventListener('click',function(e){if(e.target.closest('[data-close]'))close()});
addEventListener('keydown',function(e){if(e.key==='Escape'&&sheet.classList.contains('on'))close()});

/* Заявка: ложится в браузер (её видит панель), письмо им — с готовым текстом. */
function reqs(){return get('cp-req-1',[])}
function stOf(id,def){var P=get('cp-panel-1',{});return P.st&&P.st[id]!==undefined?P.st[id]:def}
function summary(){var x=lanes[st.dir];return x.c+' → '+(D.l==='ru'?'Ташкент':'Toshkent')+', '+T.mode[st.m]+(st.cw?', '+fmt(st.cw)+' '+T.kg:', '+st.n+'×'+(st.ct==='c20'?'20′':'40′'))+'\n'+st.lines.map(function(l){return l[0]+': '+money(l[1])}).join('\n')+'\n'+T.tot+': '+money(st.tot)+' · '+st.days+' '+T.days}
$('#send').addEventListener('click',function(){
  open(T.req,'<div class="calc-l">'+esc(summary())+'</div><label class="fld"><span>'+T.name+'</span><input id="rn" autocomplete="name"></label><label class="fld"><span>'+T.co+'</span><input id="rc" autocomplete="organization"></label><label class="fld"><span>'+T.phone+'</span><input id="rp" type="tel" autocomplete="tel" placeholder="+998"></label>','<button type="button" class="btn btn-a" id="rgo">'+T.send+'</button>');
  $('#rgo').addEventListener('click',function(){var n=$('#rn').value.trim(),p=$('#rp').value.trim();if(!n||p.replace(/\D/g,'').length<7){toast(T.need);return}
    var all=reqs(),id='CPG-'+(24200+all.length+1),o={id:id,at:Date.now(),n:n,co:$('#rc').value.trim(),ph:p,dir:st.dir,m:st.m,cw:Math.round(st.cw),ct:st.cw?'':st.n+'×'+st.ct,tot:Math.round(st.tot),days:st.days,txt:summary()};
    all.unshift(o);put('cp-req-1',all);mineBtn();
    var body=T.req+' '+id+'\n'+summary()+'\n'+T.name+': '+n+(o.co?' · '+o.co:'')+'\n'+T.phone+': '+p;
    $('#shb').innerHTML='<div class="okk">'+T.ok+': '+id+'</div><p class="mu">'+T.okp+'</p>';
    $('#shf').innerHTML='<a class="btn btn-a" href="mailto:'+D.mail+'?subject='+encodeURIComponent(T.req+' '+id)+'&body='+encodeURIComponent(body)+'">'+T.mailGo+' '+D.mail+'</a><button type="button" class="btn btn-g" data-close>OK</button>'})});

/* «Мои заявки» и отслеживание: статус ставит панель. */
var TN=['[[t:0]]','[[t:1]]','[[t:2]]'];
var DEMO={'CPG-24117':{dir:'cn',m:'air',s:4,co:T.co2+' «'+TN[0]+'»',kg:420,wh:T.wh+' '+TN[1]+' · '+(D.l==='ru'?'Гуанчжоу':'Guanchjou')},'CPG-24109':{dir:'tr',m:'auto',s:3,co:T.co2+' «'+TN[2]+'»',kg:1800,wh:T.wh+' '+TN[0]+' · '+(D.l==='ru'?'Стамбул':'Istanbul')},'CPG-24095':{dir:'ae',m:'sea',s:5,co:T.co2+' «'+TN[1]+'»',kg:0,wh:T.wh+' '+TN[2]+' · '+(D.l==='ru'?'Дубай':'Dubay')}};
function mineBtn(){var b=$('#mine');if(b)b.classList.toggle('on',reqs().length>0)}
mineBtn();
function find(no){no=no.trim().toUpperCase();var r=reqs().filter(function(x){return x.id===no})[0];if(r)return{id:r.id,dir:r.dir,m:r.m,s:stOf(r.id,0),co:r.co||r.n,wh:'',mine:1};var x=DEMO[no];return x?{id:no,dir:x.dir,m:x.m,s:stOf(no,x.s),co:x.co,wh:x.wh,demo:1}:null}
function timeline(o){var x=lanes[o.dir];return'<h3>'+o.id+' · '+esc(x.c)+' → '+(D.l==='ru'?'Ташкент':'Toshkent')+'</h3><p class="mu">'+T.mode[o.m]+' · '+esc(o.co)+(o.demo?' · '+T.demo:'')+'</p><ol>'+T.st.map(function(s,i){return'<li class="'+(i<o.s?'d':i===o.s?'c':'')+'"><i aria-hidden="true"></i><span><b>'+s+'</b>'+(i===2&&o.wh?'<small>'+esc(o.wh)+'</small>':i===3?'<small>'+x[o.m].days+' '+T.days+'</small>':'')+'</span></li>'}).join('')+'</ol>'}
var tl=$('#tl');
function showTrack(no){var o=find(no);tl.innerHTML=o?timeline(o):'<h3>'+esc(no)+'</h3><p class="mu">'+T.notFound+'</p>'}
if($('#trkf')){$('#trkex').innerHTML=Object.keys(DEMO).concat(reqs().slice(0,2).map(function(r){return r.id})).map(function(n){return'<button type="button" data-tn="'+n+'">'+n+'</button>'}).join('');
  $('#trkf').addEventListener('submit',function(e){e.preventDefault();showTrack($('#trkn').value)});
  $('#trkex').addEventListener('click',function(e){var b=e.target.closest('[data-tn]');if(!b)return;$('#trkn').value=b.getAttribute('data-tn');showTrack(b.getAttribute('data-tn'))})}
$('#mine').addEventListener('click',function(){var all=reqs();open(T.mine,all.length?all.map(function(r){var o=find(r.id);return'<div class="tl" style="min-height:0">'+timeline(o)+'<div class="calc-l">'+esc(r.txt)+'</div></div>'}).join(''):'<p class="mu">'+T.none+'</p>')});
addEventListener('storage',function(e){if(e.key==='cp-panel-1'||e.key==='cp-req-1'){mineBtn();var v=$('#trkn');if(v&&v.value)showTrack(v.value)}if(e.key==='cp-cfg-1')applyCfg();if(e.key==='cp-set-1'){applySet();calc()}});

/* Кабинет клиента: грузы компании, демо. */
var cabt=$('#cabt');if(cabt)cabt.innerHTML=Object.keys(DEMO).map(function(n){var o=find(n),x=lanes[o.dir];return'<tr><td>'+n+'</td><td>'+esc(x.n)+' → '+(D.l==='ru'?'Ташкент':'Toshkent')+', '+T.mode[o.m]+'</td><td><span class="st s'+o.s+'">'+T.st[o.s]+'</span></td></tr>'}).join('');
$$('[data-dl]').forEach(function(b){b.addEventListener('click',function(){toast(T.dl)})});
/* Документы для таможни по виду груза. */
var dk=$('#dkind');function docs(){$('#dlist').innerHTML=T.docs[dk.value].map(function(x){return'<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>'+esc(x)+'</li>'}).join('')}
if(dk){dk.addEventListener('change',docs);docs()}
})();
