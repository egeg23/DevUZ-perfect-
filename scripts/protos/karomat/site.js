(function(){
'use strict';
/* site: главная Karomat. Первый экран — тёмный стол, на который по
   прокрутке ложатся их блюда, над шурпой поднимается пар. Прокрутку не
   перехватывает: сцена стоит на sticky, GSAP ScrollTrigger только читает
   положение (scrub), всё пишется в transform и opacity. Ниже: меню с
   фильтрами, айфон с приложением, бронь на схеме зала, банкет с расчётом по
   их ценам, QR, конструктор цены. Брони и заявки пишутся в то же хранилище
   браузера, что читают приложение и панель (km-demo-1). Без движения всё
   стоит на месте. */
var d=document,W=window,root=d.documentElement,K=JSON.parse(d.getElementById('km-site').textContent),U=K.ui;
var $=function(s,r){return (r||d).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))};
var REDUCED=false;try{REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
var G=W.gsap,ST=W.ScrollTrigger,MOTION=!REDUCED&&!!(G&&ST);
if(MOTION)G.registerPlugin(ST);else root.classList.add('no-pin');
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function sum(n){return fmt(n)+' '+K.sum}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function pad(n){return (n<10?'0':'')+n}
function ic(k){return '<svg class="ic" aria-hidden="true"><use href="#i-'+k+'"/></svg>'}
var clamp=function(x,a,b){return Math.min(b,Math.max(a,x))};
var out3=function(x){return 1-Math.pow(1-x,3)};
var back=function(x){var c=1.3;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2)};

/* Общее с приложением и панелью демо-хранилище. */
var KEY='km-demo-1';
function load(){var s=null;try{s=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){}s=s||{};['cart','orders','books','banq','calls'].forEach(function(k){if(!Array.isArray(s[k]))s[k]=[]});if(typeof s.pts!=='number')s.pts=0;return s}
function save(s){try{localStorage.setItem(KEY,JSON.stringify(s))}catch(e){}}

/* Появление блоков: у каждого своё движение (классы a-*). */
if('IntersectionObserver' in W&&!REDUCED){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
  $$('.rv').forEach(function(el){io.observe(el)});
}else $$('.rv').forEach(function(el){el.classList.add('in')});

/* ── Дастархан ────────────────────────────────────────────────────────────
   Блюдо прилетает с ближнего к нему края стола, поворачивается и садится
   на место с лёгкой отдачей. Шурпа стоит с самого начала, остальные по
   очереди; доска «Ассорти от шефа» ложится последней. */
var stage=$('.stage'),plates=$$('.pl'),word=$('.hero-word'),letters=$$('.hero-word text'),cap=$('.hero-cap'),outC=$('.hero-out'),hint=$('.hero-hint');
var START=[.46,-1,-1,.04,.1,.16,.22,.28,.34],SPAN=.16,ROT=[-8,14,-18,22,-16,18,-24,16,-20];
var dirs=[];
function measure(){if(!stage)return;var r=stage.getBoundingClientRect(),cx=r.width/2,cy=r.height/2,far=Math.max(r.width,r.height)*.9;
  dirs=plates.map(function(p){var cs=getComputedStyle(p),x=parseFloat(cs.getPropertyValue('--x'))/100*r.width,y=parseFloat(cs.getPropertyValue('--y'))/100*r.height,vx=x-cx,vy=y-cy,L=Math.hypot(vx,vy)||1;if(L<40){vx=0;vy=1;L=1}return [vx/L*far,vy/L*far]})}
var prog=0;
function scene(p){prog=p;
  plates.forEach(function(el,i){var k=clamp((p-START[i])/SPAN,0,1),e=out3(k),dv=dirs[i]||[0,0];
    el.style.setProperty('--dx',((1-e)*dv[0]).toFixed(1)+'px');el.style.setProperty('--dy',((1-e)*dv[1]).toFixed(1)+'px');
    el.style.setProperty('--r',((1-e)*ROT[i]).toFixed(2)+'deg');el.style.setProperty('--s',(k<1?1.28-.28*back(k):1).toFixed(4));el.style.setProperty('--o',clamp(k*3,0,1).toFixed(3))});
  var w=clamp(p/.6,0,1);
  if(word){word.style.setProperty('--ws',(1-.18*w).toFixed(4));word.style.opacity=(1-clamp((p-.62)/.1,0,1)).toFixed(3)}
  letters.forEach(function(l,i){var c=i-(letters.length-1)/2;l.style.transform='translate('+(c*w*6).toFixed(1)+'px,0)'});
  if(cap){var o=1-clamp((p-.03)/.1,0,1);cap.style.opacity=o.toFixed(3);cap.style.transform='translateY('+((1-o)*30).toFixed(1)+'px)';cap.style.pointerEvents=o>.5?'auto':'none'}
  if(hint)hint.style.opacity=(1-clamp(p*8,0,1)).toFixed(3);
  if(outC){var q=clamp((p-.66)/.14,0,1);outC.style.opacity=q.toFixed(3);outC.style.transform='translateY(calc(-50% + '+((1-q)*30).toFixed(1)+'px))';outC.style.pointerEvents=q>.6?'auto':'none'}
}
if(stage){measure();
  if(MOTION){scene(0);ST.create({trigger:'.hero',start:'top top',end:'bottom bottom',scrub:.6,onUpdate:function(s){scene(s.progress)}});
    addEventListener('resize',function(){measure();scene(prog)})}
  else{scene(.7);if(outC)outC.style.opacity='0'}}

/* Пар над шурпой: мягкие клубы из заранее нарисованного пятна, поднимаются
   и тают. Кадры идут, только пока стол на экране и вкладка видна. */
var cv=$('#steam'),cx=cv&&cv.getContext('2d'),soup=plates[1],puffs=[],sprite=null,vis=true,raf=0,lastT=0,DPR=1;
function sizeSteam(){if(!cv)return;DPR=1;cv.width=Math.round(stage.clientWidth*DPR);cv.height=Math.round(stage.clientHeight*DPR)}
function mkSprite(){var s=d.createElement('canvas');s.width=s.height=128;var g=s.getContext('2d'),gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(255,250,240,.55)');gr.addColorStop(.5,'rgba(255,250,240,.18)');gr.addColorStop(1,'rgba(255,250,240,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);return s}
function steam(now){raf=0;if(!vis||d.hidden)return;var dt=Math.min(now-lastT,50);lastT=now;
  cx.setTransform(1,0,0,1,0,0);cx.clearRect(0,0,cv.width,cv.height);
  var sr=stage.getBoundingClientRect(),r=soup.getBoundingClientRect(),landed=clamp((prog-START[1])/SPAN,0,1)>=1;
  if(landed&&r.width){var bx=(r.left-sr.left+r.width*.47)*DPR,by=(r.top-sr.top+r.height*.3)*DPR,bw=r.width*.36*DPR;
    if(puffs.length<34&&Math.random()<dt/45)puffs.push({x:bx+(Math.random()-.5)*bw,y:by,vx:(Math.random()-.5)*.02,vy:-(.035+Math.random()*.03),s:(18+Math.random()*24)*DPR,g:.6+Math.random()*.5,a:0,life:0,max:2600+Math.random()*1800,ph:Math.random()*6})}
  for(var i=puffs.length-1;i>=0;i--){var q=puffs[i];q.life+=dt;if(q.life>q.max){puffs.splice(i,1);continue}
    var k=q.life/q.max;q.x+=(q.vx+Math.sin(q.ph+q.life/600)*.018)*dt*DPR;q.y+=q.vy*dt*DPR;var size=q.s*(1+k*q.g*2.2),al=Math.sin(Math.PI*k)*.55;
    cx.globalAlpha=al;cx.drawImage(sprite,q.x-size/2,q.y-size/2,size,size)}
  cx.globalAlpha=1;raf=requestAnimationFrame(steam)}
if(cx&&soup&&!REDUCED){sprite=mkSprite();sizeSteam();addEventListener('resize',sizeSteam);
  if('IntersectionObserver' in W)new IntersectionObserver(function(es){vis=es[0].isIntersecting;if(vis&&!raf){lastT=performance.now();raf=requestAnimationFrame(steam)}}).observe(stage);
  d.addEventListener('visibilitychange',function(){if(!d.hidden&&vis&&!raf){lastT=performance.now();raf=requestAnimationFrame(steam)}});
  lastT=performance.now();raf=requestAnimationFrame(steam)}

/* Бегущая строка: скорость от прокрутки. */
var mq=$('.marq-t');
if(MOTION&&mq){var anim=mq.getAnimations?mq.getAnimations()[0]:null,lastY=scrollY,vel=0;
  if(anim)(function f(){var y=scrollY,v=Math.abs(y-lastY);lastY=y;vel+=(v-vel)*.12;anim.playbackRate=1+Math.min(vel/6,5);requestAnimationFrame(f)})()}

/* ── Меню: разделы и фильтры ──────────────────────────────────────────── */
var grid=$('#mn-grid'),sec=$('#menyu'),cat='all',flt={},more=$('#mn-more');
if(sec)sec.classList.add('short');
function drawMenu(anim){var n=0;$$('.dc',grid).forEach(function(c){var ok=(cat==='all'||c.getAttribute('data-cat')===cat);var tg=c.getAttribute('data-tags');for(var f in flt)if(flt[f]&&tg.indexOf(f)<0)ok=false;c.hidden=!ok;if(ok&&anim&&!REDUCED){c.classList.remove('drop');void c.offsetWidth;c.style.setProperty('--d',Math.min(n,8)*40+'ms');c.classList.add('drop')}if(ok)n++});
  if(more)more.hidden=!sec.classList.contains('short')||n<=8}
$$('.mn-tabs button').forEach(function(b){b.onclick=function(){$$('.mn-tabs button').forEach(function(x){x.setAttribute('aria-selected',x===b)});cat=b.getAttribute('data-cat');drawMenu(true)}});
$$('.mn-f button').forEach(function(b){b.onclick=function(){var k=b.getAttribute('data-f'),on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',on);flt[k]=on;drawMenu(true)}});
if(more)more.onclick=function(){sec.classList.remove('short');more.hidden=true};
drawMenu(false);

/* ── Айфоны и панель грузятся, когда до них близко ─────────────────────── */
var frames=$$('iframe[data-src]');function loadF(f){if(!f.src)f.src=f.getAttribute('data-src')}
if('IntersectionObserver' in W){var fo=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){loadF(e.target);fo.unobserve(e.target)}})},{rootMargin:'600px 0px'});frames.forEach(function(f){fo.observe(f)})}else frames.forEach(loadF);
var pf=$('#ph-path iframe');
$$('[data-go]').forEach(function(b){b.addEventListener('click',function(){
  $$('[data-go]').forEach(function(x){x.removeAttribute('aria-current')});b.setAttribute('aria-current','step');
  if(!pf)return;loadF(pf);var hh=b.getAttribute('data-go');
  try{pf.contentWindow.location.hash=hh}catch(e){pf.src=pf.getAttribute('data-src').split('#')[0]+hh}
  if(innerWidth<1024)pf.closest('.pt-ph').scrollIntoView({behavior:REDUCED?'auto':'smooth',block:'center'})})});

/* ── Бронь на схеме зала ──────────────────────────────────────────────── */
var B={day:0,time:'',g:4,t:0},days=[],bkSum=$('#bk-sum');
function dayDate(i){var x=new Date();x.setHours(12,0,0,0);x.setDate(x.getDate()+i);return x}
function iso(x){return x.getFullYear()+'-'+pad(x.getMonth()+1)+'-'+pad(x.getDate())}
function dayLabel(i){var x=dayDate(i);return i===0?U.today:i===1?U.tomorrow:U.days[x.getDay()]}
function dayLong(i){var x=dayDate(i);return x.getDate()+' '+U.months[x.getMonth()]}
function slots(){var o=[],h0=K.open[0],h1=K.close[0]-1;for(var hh=h0+1;hh<=h1;hh++){o.push(pad(hh)+':00');if(hh<h1)o.push(pad(hh)+':30')}return o}
function past(t){if(B.day!==0)return false;var n=new Date(),p=t.split(':');return +p[0]*60+ +p[1]<=n.getHours()*60+n.getMinutes()+30}
/* Занятость: демо по дню и часу, плюс брони, сделанные здесь. */
function hash(s){var x=0;for(var i=0;i<s.length;i++)x=(x*31+s.charCodeAt(i))|0;return Math.abs(x)}
function busyOf(date,time){var o={},hh=+time.split(':')[0],peak=hh>=18&&hh<=20?.5:hh>=13&&hh<=14?.35:.2;
  K.hall.forEach(function(tb){if((hash(date+'|'+tb.id+'|'+Math.floor(hh/2))%100)/100<peak)o[tb.id]=1});
  load().books.forEach(function(b){if(b.date===date&&Math.abs(toMin(b.time)-toMin(time))<120)o[b.t]=1});return o}
function toMin(t){var p=t.split(':');return +p[0]*60+ +p[1]}
function drawDays(){var box=$('#bk-days');if(!box)return;box.innerHTML='';for(var i=0;i<7;i++){var b=d.createElement('button');b.type='button';b.setAttribute('aria-pressed',i===B.day);b.innerHTML='<span>'+h(dayLabel(i))+'</span><small>'+h(dayLong(i))+'</small>';(function(i){b.onclick=function(){B.day=i;B.time='';drawDays();drawTimes();drawHall()}})(i);box.appendChild(b)}}
function drawTimes(){var box=$('#bk-times');if(!box)return;box.innerHTML='';var list=slots();if(!B.time){B.time=list.filter(function(t){return !past(t)&&t>='19:00'})[0]||list.filter(function(t){return !past(t)})[0]||list[list.length-1]}
  list.forEach(function(t){var b=d.createElement('button');b.type='button';b.textContent=t;b.disabled=past(t);b.setAttribute('aria-pressed',t===B.time);b.onclick=function(){B.time=t;drawTimes();drawHall()};box.appendChild(b)});
  var on=$('[aria-pressed="true"]',box);if(on&&on.scrollIntoView&&box.scrollWidth>box.clientWidth)box.scrollLeft=on.offsetLeft-box.clientWidth/2+on.clientWidth/2}
function drawHall(){var busy=busyOf(iso(dayDate(B.day)),B.time);
  $$('#hall .tb').forEach(function(g){var id=+g.getAttribute('data-t'),s=+g.getAttribute('data-s');g.classList.toggle('busy',!!busy[id]);g.classList.toggle('small',s<B.g);g.classList.toggle('sel',id===B.t);g.setAttribute('aria-disabled',busy[id]?'true':'false')});
  if(B.t&&busy[B.t])B.t=0;drawSum()}
function tbOf(id){return K.hall.filter(function(x){return x.id===id})[0]}
function drawSum(msg){if(!bkSum)return;var dl=dayLong(B.day)+', '+dayLabel(B.day);
  if(!B.t){bkSum.innerHTML='<p class="hint">'+h(U.pick)+'</p><div class="meta"><span>'+ic('cal')+h(dl)+'</span><span>'+ic('clock')+h(B.time)+'</span><span>'+ic('users')+B.g+' '+h(U.guests)+'</span></div>'+(msg?'<p class="warn">'+h(msg)+'</p>':'');return}
  var tb=tbOf(B.t);
  bkSum.innerHTML='<h3>'+h(U.table)+' '+B.t+' · '+tb.s+' '+h(U.seats)+'</h3><div class="meta"><span>'+ic('cal')+h(dl)+'</span><span>'+ic('clock')+h(B.time)+'</span><span>'+ic('users')+B.g+' '+h(U.guests)+'</span></div>'+(msg?'<p class="warn">'+h(msg)+'</p>':'')+
    '<div class="bk-two"><label class="fld"><span>'+h(U.name)+'</span><input id="bk-n" autocomplete="name" value="Aziz"></label><label class="fld"><span>'+h(U.phone)+'</span><input id="bk-ph" type="tel" inputmode="tel" autocomplete="tel" value="+998 90 123 45 67"></label></div>'+
    '<button type="button" class="btn btn-gold" id="bk-go">'+ic('table')+'<span>'+h(U.confirm)+'</span></button>';
  $('#bk-go').onclick=book}
function pick(g){var id=+g.getAttribute('data-t'),s=+g.getAttribute('data-s');
  if(g.classList.contains('busy')){B.t=0;drawSum(U.busy.replace('{h}',B.time));return}
  if(s<B.g){B.t=0;drawHall();drawSum(U.small.replace('{s}',s).replace('{g}',B.g));return}
  B.t=id;drawHall();g.classList.remove('pop');void g.getBoundingClientRect();if(!REDUCED)g.classList.add('pop')}
$$('#hall .tb').forEach(function(g){g.addEventListener('click',function(){pick(g)});g.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();pick(g)}})});
var gOut=$('#bk-g');
function setG(n){B.g=clamp(n,1,12);if(gOut)gOut.textContent=B.g;if(B.t&&tbOf(B.t).s<B.g)B.t=0;drawHall()}
if($('#bk-m'))$('#bk-m').onclick=function(){setG(B.g-1)};if($('#bk-p'))$('#bk-p').onclick=function(){setG(B.g+1)};
function book(){var s=load(),no='B-'+(1040+s.books.length+1),nm=($('#bk-n').value||'').trim()||'Aziz',ph=($('#bk-ph').value||'').trim();
  s.books.unshift({no:no,ts:Date.now(),date:iso(dayDate(B.day)),time:B.time,g:B.g,t:B.t,name:nm,phone:ph,src:'site',st:0});save(s);
  var dl=dayLong(B.day);
  bkSum.innerHTML='<div class="ok">'+ic('check')+'<p>'+h(U.done.replace('{t}',B.t).replace('{d}',dl).replace('{h}',B.time).replace('{g}',B.g).replace('{n}',no))+'</p></div><div class="row-b"><a class="btn btn-gold" href="'+K.panel+'#books">'+h(U.toPanel)+'</a><button type="button" class="btn btn-line" id="bk-again">'+h(U.again)+'</button></div>';
  $('#bk-again').onclick=function(){B.t=0;drawHall()};drawHall2()}
function drawHall2(){var busy=busyOf(iso(dayDate(B.day)),B.time);$$('#hall .tb').forEach(function(g){var id=+g.getAttribute('data-t');g.classList.toggle('busy',!!busy[id]&&id!==B.t);g.classList.toggle('sel',id===B.t)})}
if(bkSum){drawDays();drawTimes();drawHall()}

/* ── Банкет: стол на 10 гостей из их меню, итог с обслуживанием ─────────── */
var Q={kind:K.banq.kinds[0].id,g:40,items:K.banq.items.map(function(x){return {id:x.id,q:x.q,v:x.v==null?-1:x.v}})};
function price(it){var m=K.menu[it.id];return it.v>=0&&m.v[it.v]?m.v[it.v].p:m.p}
function iname(it){var m=K.menu[it.id];return m.n+(it.v>=0&&m.v[it.v]?', '+m.v[it.v].n.toLowerCase():'')}
var bqList=$('#bq-list'),bqTot=$('#bq-tot'),bqX=$('#bq-xl'),shownTot=0,rr=0;
function bqCalc(){var per=Q.items.reduce(function(s,it){return s+price(it)*it.q},0),tables=Math.ceil(Q.g/K.banq.per),food=per*tables,svc=Math.round(food*K.service/100),tot=food+svc;return {per:per,tables:tables,food:food,svc:svc,tot:tot,guest:Math.round(tot/Q.g/1000)*1000}}
function drawBq(){if(!bqList)return;
  bqList.innerHTML=Q.items.map(function(it,i){return '<li class="bq-it"><img src="'+K.img+'/d-'+it.id+'.webp" alt="" loading="lazy"><span><b>'+h(iname(it))+'</b><small>'+sum(price(it))+'</small></span><span class="stp"><button type="button" data-i="'+i+'" data-d="-1" aria-label="'+h(U.less)+'">'+ic('minus')+'</button><output>'+it.q+'</output><button type="button" data-i="'+i+'" data-d="1" aria-label="'+h(U.more)+'">'+ic('plus')+'</button></span></li>'}).join('');
  $$('button',bqList).forEach(function(b){b.onclick=function(){var it=Q.items[+b.getAttribute('data-i')];it.q=Math.max(0,it.q+ +b.getAttribute('data-d'));if(!it.q)Q.items.splice(Q.items.indexOf(it),1);drawBq()}});
  var have={};Q.items.forEach(function(it){have[it.id]=1});
  bqX.innerHTML=K.banq.extra.filter(function(id){return !have[id]}).map(function(id){return '<button type="button" data-id="'+id+'"><img src="'+K.img+'/d-'+id+'.webp" alt="" loading="lazy">'+h(K.menu[id].n)+' · '+sum(K.menu[id].p)+'</button>'}).join('');
  $$('button',bqX).forEach(function(b){b.onclick=function(){Q.items.push({id:+b.getAttribute('data-id'),q:1,v:-1});drawBq()}});
  drawTot()}
function drawTot(sent){var c=bqCalc();
  bqTot.innerHTML='<p class="per">'+Q.g+' '+h(U.guests)+' · '+c.tables+' '+h(U.tables)+'</p><b class="big" id="bq-big">'+sum(shownTot||c.tot)+'</b><p class="per">≈ '+sum(c.guest)+' '+h(U.perGuest)+'</p>'+
    '<dl><div><dt>'+h(U.food)+' · '+sum(c.per)+' '+h(U.per10)+'</dt><dd>'+sum(c.food)+'</dd></div><div><dt>'+h(U.service)+' '+K.service+'%</dt><dd>'+sum(c.svc)+'</dd></div><div class="tot"><dt>'+h(U.total)+'</dt><dd>'+sum(c.tot)+'</dd></div></dl>'+
    (sent?'<div class="ok">'+ic('check')+'<p>'+h(sent)+'</p></div><a class="btn btn-gold" href="'+K.panel+'#banq">'+h(U.toPanel)+'</a>':
    '<div class="bk-two"><label class="fld"><span>'+h(U.name)+'</span><input id="bq-n" autocomplete="name" value="Nodira"></label><label class="fld"><span>'+h(U.phone)+'</span><input id="bq-ph" type="tel" inputmode="tel" value="+998 93 555 12 34"></label></div><button type="button" class="btn btn-gold" id="bq-go">'+ic('users')+'<span>'+h(U.send)+'</span></button>');
  roll(c.tot);var go=$('#bq-go');if(go)go.onclick=sendBq}
function roll(to){var el=$('#bq-big');if(!el)return;var from=shownTot||to,st=performance.now();cancelAnimationFrame(rr);if(REDUCED||from===to){shownTot=to;el.textContent=sum(to);return}
  (function f(now){var k=Math.min(1,(now-st)/450);shownTot=Math.round(from+(to-from)*out3(k));var e=$('#bq-big');if(e)e.textContent=sum(shownTot);if(k<1)rr=requestAnimationFrame(f)})(st)}
function sendBq(){var s=load(),c=bqCalc(),no='K-'+(210+s.banq.length+1),dt=dayDate(14);
  s.banq.unshift({no:no,ts:Date.now(),kind:Q.kind,g:Q.g,items:Q.items.map(function(it){return {id:it.id,q:it.q,v:it.v}}),food:c.food,svc:c.svc,tot:c.tot,name:($('#bq-n').value||'').trim()||'Nodira',phone:($('#bq-ph').value||'').trim(),date:iso(dt),src:'site',st:0});save(s);
  drawTot(U.sent.replace('{n}',no))}
$$('.bq-kinds button').forEach(function(b){b.onclick=function(){$$('.bq-kinds button').forEach(function(x){x.setAttribute('aria-checked',x===b)});Q.kind=b.getAttribute('data-k')}});
var bqR=$('#bq-r'),bqV=$('#bq-v');if(bqR)bqR.oninput=function(){Q.g=+bqR.value;bqV.textContent=Q.g;drawTot()};
if(bqList)drawBq();

/* ── Шапка (правило владельца, 15.10.2026): при любой прокрутке прячется и
   возвращается только через 3 секунды после полной остановки. Инерция
   прокрутки на телефоне тоже шлёт scroll, так что таймер ждёт её конца.
   Пока фокус с клавиатуры внутри шапки, она не прячется. */
var top=$('#top'),dock=$('#dock'),hero=$('.hero'),IDLE=3000,idleT=0,tick=false;
function headIdle(){if(!top)return;clearTimeout(idleT);
  if(!top.contains(d.activeElement))top.classList.add('hide');
  idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}
function frame(){tick=false;if(dock&&hero)dock.classList.toggle('on',hero.getBoundingClientRect().bottom<innerHeight*.6)}
addEventListener('scroll',function(){headIdle();if(!tick){tick=true;requestAnimationFrame(frame)}},{passive:true});frame();

/* ── Конструктор цены: сайт по акции и допы тумблерами ─────────────────── */
var rows=$$('#konstruktor input[data-k]'),sumEl=$('#kit-total-sum'),addEl=$('#kit-add'),nEl=$('#kit-cnt'),shown=K.offer.base,r2=0;
function rollK(to){var from=shown,st=performance.now();cancelAnimationFrame(r2);if(REDUCED){shown=to;sumEl.textContent=fmt(to)+' $';return}(function f(now){var k=Math.min(1,(now-st)/500);shown=Math.round(from+(to-from)*out3(k));sumEl.textContent=fmt(shown)+' $';if(k<1)r2=requestAnimationFrame(f)})(st)}
function kitPrice(){var add=0,n=0;rows.forEach(function(r){if(r.checked){add+=+r.getAttribute('data-p');n++}});addEl.textContent=fmt(add)+' $';nEl.textContent=n;rollK(K.offer.base+add)}
rows.forEach(function(r){r.onchange=kitPrice});
var all=$('#kit-all');if(all)all.onclick=function(){var on=rows.some(function(r){return !r.checked});rows.forEach(function(r){r.checked=on});kitPrice()};
var cp=$('#kit-copy');if(cp)cp.onclick=function(){var lines=[K.offer.head,'• '+K.offer.baseName+': '+fmt(K.offer.base)+' $'];rows.forEach(function(r){if(r.checked){var it=K.offer.items.filter(function(x){return x.id===r.getAttribute('data-k')})[0];lines.push('• '+it.t+': '+fmt(it.p)+' $')}});lines.push(K.offer.totalW+': '+sumEl.textContent);
  var txt=lines.join('\n');try{navigator.clipboard.writeText(txt).then(function(){cp.textContent=K.offer.copied})}catch(e){cp.textContent=K.offer.copied}};
/* Отсчёт 48 часов с первого открытия на этом устройстве. */
var tm=$('#tm'),start=Date.now();try{var s0=+localStorage.getItem('km-offer-1');if(s0&&s0<=Date.now())start=s0;else localStorage.setItem('km-offer-1',String(start))}catch(e){}
var end=start+K.offer.hours*36e5;
function tickT(){var left=Math.max(0,end-Date.now());if(!left){$('#timer').classList.add('over');tm.textContent='00:00:00';$('#timer span').firstChild.textContent=K.offer.ended;return}var hh=Math.floor(left/36e5),mm=Math.floor(left%36e5/6e4),ss=Math.floor(left%6e4/1e3);tm.textContent=pad(hh)+':'+pad(mm)+':'+pad(ss);setTimeout(tickT,1000)}
if(tm)tickT();
})();
