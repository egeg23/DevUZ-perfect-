/* Сайт Sunday Event Agency. Связь с панелью — память браузера: сайт пишет
   заявки в sn-req-1 и брони дат в sn-hold-1, ответы гостей в sn-rsvp-1;
   панель пишет статусы заявок и занятые даты (sn-dates-1). Тумблеры
   конструктора первой страницы (sn-cfg-1) прячут блоки допов. Модели нет. */
(function(){
var d=document,w=window,$=function(s,r){return(r||d).querySelector(s)},$$=function(s,r){return[].slice.call((r||d).querySelectorAll(s))};
var D=JSON.parse($('#sn-data').textContent),T=D.t,C=D.calc;
var RM=w.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function get(k,def){try{var v=localStorage.getItem(k);return v?JSON.parse(v):def}catch(e){return def}}
function put(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function usd(n){return fmt(n)+' $'}
function cl(x){return x<0?0:x>1?1:x}
function iso(dt){return dt.getFullYear()+'-'+(dt.getMonth()<9?'0':'')+(dt.getMonth()+1)+'-'+(dt.getDate()<10?'0':'')+dt.getDate()}
function human(s){var p=s.split('-');return(+p[2])+' '+T.mgen[+p[1]-1]+' '+p[0]}
var toastT=0;function toast(m){var e=$('#toast');e.textContent=m;e.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){e.classList.remove('on')},2400)}
function openTg(text){var u='https://t.me/'+D.tg+'?text='+encodeURIComponent(text);var x=w.open(u,'_blank','noopener');if(!x)location.href=u}

/* Шапка: прячется при любой прокрутке, возвращается через 3 с после последнего события. */
var top=$('.top'),IDLE=3000,idleT=0;
function headIdle(){if(!top)return;clearTimeout(idleT);
  if(!top.contains(d.activeElement))top.classList.add('hide');
  idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}
addEventListener('scroll',headIdle,{passive:true});

var io='IntersectionObserver'in w?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'}):null;
$$('.rise,.tilt,.pop,.slide,.chat').forEach(function(e){if(io&&!RM)io.observe(e);else e.classList.add('on')});
requestAnimationFrame(function(){$('.hero').classList.add('on')});
d.addEventListener('pointermove',function(e){var g=e.target.closest&&e.target.closest('.glass');if(!g)return;var r=g.getBoundingClientRect();g.style.setProperty('--gx',((e.clientX-r.left)/r.width*100)+'%');g.style.setProperty('--gy',((e.clientY-r.top)/r.height*100)+'%')},{passive:true});

/* Параллакс и линия шагов: только transform, от прокрутки. */
var pars=$$('[data-par]'),stepsEl=$('#steps'),stepItems=$$('.step'),ticking=0;
function onScroll(){ticking=0;var y=scrollY;
  if(!RM)pars.forEach(function(e){e.style.transform='translate3d(0,'+(y*+e.getAttribute('data-par')).toFixed(1)+'px,0)'});
  if(stepsEl){var r=stepsEl.getBoundingClientRect(),p=cl((innerHeight*.7-r.top)/r.height);stepsEl.style.setProperty('--pr',p.toFixed(3));
    stepItems.forEach(function(s,i){s.classList.toggle('on',p>=(i+.3)/stepItems.length)})}}
addEventListener('scroll',function(){if(!ticking){ticking=1;requestAnimationFrame(onScroll)}},{passive:true});onScroll();

/* Тумблеры конструктора: выключенный доп — блока на сайте нет. */
var cfg=get('sn-cfg-1',{});
$$('[data-addon]').forEach(function(b){if(cfg[b.getAttribute('data-addon')]===false)b.hidden=true});
function addonOn(id){return cfg[id]!==false}

/* ── Направления: список и сцена ─────────────────────────────────── */
$$('[data-dir]').forEach(function(b){function pick(){var id=b.getAttribute('data-dir');
  $$('[data-dir]').forEach(function(x){x.setAttribute('aria-selected',String(x===b))});
  $$('[data-ds]').forEach(function(x){x.classList.toggle('on',x.getAttribute('data-ds')===id)})}
  b.addEventListener('click',pick);b.addEventListener('mouseenter',pick);b.addEventListener('focus',pick)});

/* ── Смета ───────────────────────────────────────────────────────── */
function val(name){var x=$('input[name="'+name+'"]:checked');return x?x.value:''}
function by(list,id){return list.filter(function(x){return x.id===id})[0]}
function estimate(o){var g=o.g,lines=[],k=by(C.kinds,o.k),f=by(C.food,o.f),dc=by(C.decor,o.d),sh=by(C.show,o.s);
  lines.push([T.food+': '+f.n,fmt(g)+' '+T.guests+' × '+usd(f.p),f.p*g]);
  lines.push([T.decor,dc.n,dc.p]);lines.push([T.show,sh.n,sh.p]);
  (o.e||[]).forEach(function(id){var x=by(C.extra,id);if(x)lines.push([x.n,'',x.p])});
  var sub=lines.reduce(function(a,x){return a+x[2]},0);lines.push([T.fee,'',Math.round(sub*C.fee)]);
  var tot=sub*(1+C.fee),lo=Math.round(tot*(1-C.spread)/50)*50,hi=Math.round(tot*(1+C.spread)/50)*50;
  return{k:k,lines:lines,lo:lo,hi:hi}}
var cx=$('#calc'),gR=$('#c-g');
function calcState(){return{k:val('ck'),g:+gR.value,f:val('cf'),d:val('cd'),s:val('cs'),e:$$('input[name="ce"]:checked').map(function(x){return x.value})}}
function calcDraw(){var st=calcState(),r=estimate(st);$('#c-gv').textContent=fmt(st.g);$('#cx-k').textContent=r.k.n+', '+fmt(st.g)+' '+T.guests;
  $('#cx-lines').innerHTML=r.lines.map(function(x){return'<div class="cl"><span>'+esc(x[0])+(x[1]?'<small>'+esc(x[1])+'</small>':'')+'</span><b>'+usd(x[2])+'</b></div>'}).join('');
  $('#cx-tot').textContent=usd(r.lo)+' - '+usd(r.hi);return r}
if(cx){$$('input',cx).forEach(function(x){x.addEventListener('input',calcDraw);x.addEventListener('change',calcDraw)});
  $$('input[name="ck"]').forEach(function(x){x.addEventListener('change',function(){var k=by(C.kinds,x.value);gR.value=k.g;calcDraw()})});
  calcDraw();
  $('#cx-send').addEventListener('click',function(){var st=calcState(),r=estimate(st);
    var text=T.hello+'\n'+r.k.n+', '+st.g+' '+T.guests+'\n'+r.lines.map(function(x){return'· '+x[0]+(x[1]?' ('+x[1]+')':'')+': '+usd(x[2])}).join('\n')+'\n'+T.total+': '+usd(r.lo)+' - '+usd(r.hi);
    addReq({kind:st.k,text:r.k.n+', '+st.g+' '+T.guests,sum:Math.round((r.lo+r.hi)/2)});toast(T.sent);setTimeout(function(){openTg(text)},500)})}
/* Сумма в примере переписки бота — тем же расчётом. */
var chatSum=$('#chat-sum');if(chatSum){var ex=estimate({k:'wedding',g:120,f:'banquet',d:'author',s:'artists',e:[]});chatSum.textContent=usd(ex.lo)+' - '+usd(ex.hi)}

/* ── Заявки: в память браузера (их видит панель) ───────────────────── */
function addReq(o){var l=get('sn-req-1',[]),id=5001+l.length;l.unshift(Object.assign({id:id,at:Date.now(),st:0,src:'site'},o));put('sn-req-1',l);mine();return id}
var mineB=$('#mine');
function mine(){var l=get('sn-req-1',[]);if(!mineB)return;mineB.hidden=!l.length;if(l.length)$('#mine-d').classList.toggle('ok',l[0].st>0)}
mine();
addEventListener('storage',function(e){if(e.key==='sn-req-1'){mine();if($('#sheet').classList.contains('on'))showMine()}if(e.key==='sn-dates-1')drawCal()});
function sheet(title,html){$('#shh').textContent=title;$('#shb').innerHTML=html;$('#sheet').classList.add('on');var x=$('#sheet .x');if(x)x.focus({preventScroll:true})}
function closeSheet(){$('#sheet').classList.remove('on')}
$$('[data-close]').forEach(function(x){x.addEventListener('click',closeSheet)});
d.addEventListener('keydown',function(e){if(e.key==='Escape')closeSheet()});
function showMine(){var l=get('sn-req-1',[]);if(!l.length)return;var r=l[0];
  sheet(T.no+' №'+r.id,'<p>'+esc(r.text||'')+'</p><div class="st-l">'+T.st.map(function(s,i){return'<span'+(i===r.st?' class="on"':'')+'>'+esc(s)+'</span>'}).join('')+'</div><p class="mu">'+esc(T.mineHint)+'</p>'+(addonOn('admin')?'<p style="margin-top:14px"><a class="btn btn-a" href="'+T.panelUrl+'">'+esc(T.panel)+'</a></p>':''))}
if(mineB)mineB.addEventListener('click',showMine);

/* ── Подбор концепции ────────────────────────────────────────────── */
var qz=$('#qz'),Q=T.quiz,ans=[];
function qDraw(){if(!qz)return;var i=ans.length;
  if(i<Q.q.length){qz.innerHTML='<div class="qz-in"><span class="qz-n">'+(i+1)+' '+Q.of+' '+Q.q.length+'</span><div class="qz-bar"><i style="transform:scaleX('+(i/Q.q.length)+')"></i></div><h3>'+esc(Q.q[i])+'</h3><div class="qz-a">'+Q.a[i].map(function(a,k){return'<button type="button" data-qa="'+k+'">'+esc(a)+'</button>'}).join('')+'</div></div>';
    $$('[data-qa]',qz).forEach(function(b){b.addEventListener('click',function(){ans.push(+b.getAttribute('data-qa'));qDraw()})});return}
  /* Концепция — по настроению и цветам: два главных ответа. */
  var c=(ans[1]*/*~*/3+ans[2])%4;
  qz.innerHTML='<div class="qz-in"><span class="qz-n">'+esc(Q.res)+'</span><div class="qz-bar"><i style="transform:scaleX(1)"></i></div><div class="qz-r"><img src="'+D.img+'/'+Q.img[c]+'-640.webp" width="640" height="482" alt="'+esc(Q.names[c])+', '+esc(Q.ill)+'"><div><h3>'+esc(Q.names[c])+'</h3><div class="qz-pal">'+Q.pal[c].map(function(x){return'<i style="background:'+x+'"></i>'}).join('')+'</div><p class="mu">'+esc(Q.desc[c])+'</p></div></div>'+
    '<div class="hero-act" style="margin-top:16px"><button type="button" class="btn btn-a" id="qz-s">'+esc(Q.send)+'</button><button type="button" class="btn btn-g" id="qz-r">'+esc(Q.again)+'</button></div></div>';
  $('#qz-r').addEventListener('click',function(){ans=[];qDraw()});
  $('#qz-s').addEventListener('click',function(){var a=ans.map(function(x,k){return Q.a[k][x]});addReq({kind:'quiz',text:Q.names[c]+': '+a.join(', ')});toast(T.sent);var m=Q.msg+' '+Q.names[c]+'\n'+a.join(', ');setTimeout(function(){openTg(m)},500)})}
qDraw();

/* ── Свободные даты: демо-занятость из правила, его же считает панель ── */
function demoBusy(dt){var g=dt.getDate(),m=dt.getMonth(),wd=dt.getDay();return wd===6?(g+m)%3!==1:wd===5||wd===0?(g*7+m)%4===0:(g*3+m)%11===0}
function isBusy(k,dt){var P=get('sn-dates-1',{});if(P[k]==='busy')return true;if(P[k]==='free')return false;return demoBusy(dt)}
var calOff=0,calG=$('#cal-g');
function drawCal(){if(!calG)return;var now=new Date();now.setHours(0,0,0,0);var m0=new Date(now.getFullYear(),now.getMonth()+calOff,1),holds=get('sn-hold-1',[]);
  $('#cal-m').textContent=T.months[m0.getMonth()]+' '+m0.getFullYear();$('#cal-p').disabled=calOff<=0;
  var html=T.wd.map(function(x){return'<span>'+x+'</span>'}).join(''),lead=(m0.getDay()+6)%7,days=new Date(m0.getFullYear(),m0.getMonth()+1,0).getDate();
  for(var i=0;i<lead;i++)html+='<span></span>';
  for(var g=1;g<=days;g++){var dt=new Date(m0.getFullYear(),m0.getMonth(),g),k=iso(dt),past=dt<now,cls=holds.indexOf(k)>=0?'hd':isBusy(k,dt)?'bz':'fr';
    html+='<button type="button" class="'+cls+(past?' past':'')+'" data-day="'+k+'" aria-label="'+human(k)+'">'+g+'</button>'}
  calG.innerHTML=html;
  $$('[data-day]',calG).forEach(function(b){b.addEventListener('click',function(){var k=b.getAttribute('data-day');
    if(b.classList.contains('bz')){toast(T.busy);return}
    var h=get('sn-hold-1',[]);if(h.indexOf(k)<0){h.push(k);put('sn-hold-1',h);addReq({kind:'date',text:human(k),date:k})}
    toast(T.held);drawCal();var m=T.holdMsg+' '+human(k);setTimeout(function(){openTg(m)},600)})})}
if(calG){$('#cal-p').addEventListener('click',function(){if(calOff>0){calOff--;drawCal()}});$('#cal-n').addEventListener('click',function(){if(calOff<11){calOff++;drawCal()}});drawCal()}

/* ── Кабинет: демо-свадьба через 74 дня ───────────────────────────── */
var cabB=$('#cab-b');
if(cabB){var ev=new Date();ev.setHours(0,0,0,0);ev.setDate(ev.getDate()+74);
  $('#cab-d').textContent=human(iso(ev))+' · '+T.demoDate;$('#cab-c').innerHTML='<b>74</b><span>'+esc(T.days)+'</span>';
  function cabDraw(k){var c=T.cab;$$('[data-cab]').forEach(function(b){b.setAttribute('aria-pressed',String(b.getAttribute('data-cab')===k))});
    if(k==='plan'){var done=c.plan.filter(function(x){return x[1]}).length;cabB.innerHTML='<div class="cab-p"><i style="transform:scaleX('+(done/c.plan.length).toFixed(2)+')"></i></div>'+c.plan.map(function(x){return'<div class="ck"><span>'+esc(x[0])+'</span><em class="'+(x[1]?'ok':'')+'">'+(x[1]?esc(T.done):'...')+'</em></div>'}).join('')}
    else if(k==='est'){var s=c.est.reduce(function(a,x){return a+x[1]},0);cabB.innerHTML=c.est.map(function(x){return'<div class="ck"><span>'+esc(x[0])+'</span><b>'+usd(x[1])+'</b></div>'}).join('')+'<div class="ck"><b>'+esc(T.total)+'</b><b>'+usd(s)+'</b></div>'}
    else cabB.innerHTML=c.pay.map(function(x){return'<div class="ck"><span>'+esc(x[0])+'<br><b>'+usd(x[1])+'</b></span><em class="'+(x[2]?'ok':'')+'">'+esc(x[2]?T.paid:T.left)+'</em></div>'}).join('')}
  $$('[data-cab]').forEach(function(b){b.addEventListener('click',function(){cabDraw(b.getAttribute('data-cab'))})});cabDraw('plan')}

/* ── Приглашение: ответы гостей ──────────────────────────────────── */
var rv=$('#rv-f');
function rvCount(){var l=get('sn-rsvp-1',[]),n=l.filter(function(x){return x.yes}).reduce(function(a,x){return a+x.c},0);var e=$('#rv-n');if(e)e.textContent=n}
if(rv){var ev2=new Date();ev2.setDate(ev2.getDate()+74);$('#inv-d').textContent=human(iso(ev2))+' · '+T.demoDate;rvCount();
  rv.addEventListener('submit',function(e){e.preventDefault();var n=$('#rv-name').value.trim();if(!n){$('#rv-ok').textContent=T.rvNeed;$('#rv-name').focus();return}
    var yes=val('rv')==='1',l=get('sn-rsvp-1',[]);l.unshift({at:Date.now(),name:n,yes:yes,c:Math.max(1,Math.min(10,+$('#rv-c').value||1)),diet:$('#rv-diet').value.trim()});put('sn-rsvp-1',l);
    $('#rv-ok').textContent=yes?T.rvOk:T.rvNo;rv.reset();rvCount()})}

/* ── Работы: фильтр и окно ───────────────────────────────────────── */
$$('[data-wf]').forEach(function(b){b.addEventListener('click',function(){var f=b.getAttribute('data-wf');
  $$('[data-wf]').forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});
  $$('.wc').forEach(function(c){c.hidden=!(f==='all'||c.getAttribute('data-f')===f)})})});
$$('[data-w]').forEach(function(b){b.addEventListener('click',function(){var x=D.works[+b.getAttribute('data-w')];
  sheet(x.n,'<img src="'+D.img+'/'+x.img+'.webp" width="1168" height="880" alt="'+esc(x.n)+'"><p class="mu sm">'+esc(T.quiz.ill)+'</p>')})});

/* ── Связь ───────────────────────────────────────────────────────── */
var cf=$('#cf');
if(cf)cf.addEventListener('submit',function(e){e.preventDefault();var n=$('#cf-n').value.trim(),p=$('#cf-p').value.trim(),k=val('cfk'),dt=$('#cf-d').value;
  if(!n||p.replace(/\D/g,'').length<9){$('#cf-e').textContent=T.need;return}$('#cf-e').textContent='';
  var kn=($('input[name="cfk"]:checked+span')||{}).textContent||k;
  addReq({kind:k,text:kn+(dt?', '+human(dt):''),name:n,ph:p,date:dt||''});toast(T.sent);
  var m=T.req+'\n'+T.name+': '+n+'\n'+T.phone+': '+p+'\n'+T.kind+': '+kn+(dt?'\n'+T.date+': '+human(dt):'');setTimeout(function(){openTg(m)},500);cf.reset()});
})();
