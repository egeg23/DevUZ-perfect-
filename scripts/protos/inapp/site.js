(function(){
'use strict';
/* Страница макета приложения турагентства. Прокрутку не перехватываем: всё
   движение считается от того, где блок на экране, и рисуется transform и
   opacity. Канбан менеджера связан с приложением в айфоне сообщениями
   postMessage (только с того же адреса). */
var d=document,root=d.documentElement;
var REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches;
var $=function(s,r){return (r||d).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))};
var grp=function(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')};
var esc=function(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};

if(!d.getElementById('intro')||root.classList.contains('intro-off'))$('#hero').classList.add('hero-on');

/* ── Цвет страницы между блоками ── */
var tones={};$$('.bgfx i').forEach(function(i){tones[i.getAttribute('data-tone')]=i});
var cur='';
function tone(t){if(t===cur||!tones[t])return;if(tones[cur])tones[cur].classList.remove('on');tones[t].classList.add('on');cur=t}
tone('sky');
var secs=$$('main>section[data-tone],footer[data-tone]');

/* ── Появление блоков ── */
if('IntersectionObserver' in window&&!REDUCED){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -10% 0px'});
  $$('.rv').forEach(function(el){io.observe(el)});
}else $$('.rv').forEach(function(el){el.classList.add('in')});

/* ── Прокрутка: параллакс и смена цвета, одним кадром ── */
var par=$$('[data-par]'),tick=false;
function frame(){
  tick=false;
  var h=innerHeight;
  if(!REDUCED)for(var i=0;i<par.length;i++){var el=par[i],r=el.parentNode.getBoundingClientRect();if(r.bottom<-200||r.top>h+200)continue;var k=+el.getAttribute('data-par');el.style.transform='translate3d(0,'+((r.top+r.height/2-h/2)*-k).toFixed(1)+'px,0)'}
  for(var j=secs.length-1;j>=0;j--){var b=secs[j].getBoundingClientRect();if(b.top<h*.5){tone(secs[j].getAttribute('data-tone'));break}}
  if(j<0)tone('sky');
}
addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(frame)}},{passive:true});
addEventListener('resize',function(){requestAnimationFrame(frame)});
frame();

/* ── Путь клиента: какой шаг посередине экрана, тот и на телефоне ── */
var steps=$$('.st-step'),screens=$$('.ps'),dots=$$('.st-dots i');
function step(n){steps.forEach(function(s,i){s.classList.toggle('on',i===n)});screens.forEach(function(s,i){s.classList.toggle('on',i===n)});dots.forEach(function(s,i){s.classList.toggle('on',i===n)})}
step(0);
if('IntersectionObserver' in window){var so=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)step(+e.target.getAttribute('data-step'))})},{rootMargin:'-45% 0px -45% 0px'});steps.forEach(function(s){so.observe(s)})}

/* ── Приложение в айфоне ── */
var dev=$('#ap-dev'),iph=$('#iph'),frameEl=$('#app-frame'),loaded=false,queue=[];
var narrow=matchMedia('(max-width: 999px)');
function aspect(){if(!iph)return;if(narrow.matches){var a=Math.min(Math.max(innerWidth/innerHeight,.42),.62);iph.style.setProperty('--ar',a.toFixed(4))}else iph.style.removeProperty('--ar')}
aspect();addEventListener('resize',aspect);
function load(){if(!frameEl||frameEl.src)return;frameEl.src=frameEl.getAttribute('data-src')}
if(frameEl){
  frameEl.addEventListener('load',function(){loaded=true;var q=queue;queue=[];q.forEach(send)});
  if('IntersectionObserver' in window){var fo=new IntersectionObserver(function(es){if(es[0].isIntersecting){load();fo.disconnect()}},{rootMargin:'900px 0px'});fo.observe(frameEl)}else load();
}
function send(msg){if(!frameEl)return;if(!loaded){queue.push(msg);load();return}try{frameEl.contentWindow.postMessage(msg,location.origin)}catch(e){}}
function toApp(msg){var s=$('#prilozhenie');if(s)s.scrollIntoView({behavior:REDUCED?'auto':'smooth',block:'start'});send(msg)}
$$('[data-jump]').forEach(function(b){b.addEventListener('click',function(e){e.preventDefault();toApp({tb:'jump',to:b.getAttribute('data-jump')})})});

/* Нижняя плашка не закрывает айфон и канбан, пока они на экране. */
var dock=$('#dock');
if(dock&&'IntersectionObserver' in window){var seen=new Set();var dob=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)seen.add(e.target);else seen.delete(e.target)});dock.classList.toggle('hide',seen.size>0)},{threshold:.3});[dev,$('.bx')].forEach(function(x){if(x)dob.observe(x)})}

/* Поиск на первом экране ведёт в приложение с теми же условиями. */
var find=$('#find');
if(find)find.addEventListener('submit',function(e){e.preventDefault();var f=new FormData(find);toApp({tb:'jump',to:'find',dest:f.get('dest'),nights:+f.get('nights'),adults:+f.get('adults'),kids:+f.get('kids')})});

/* «Во весь экран»: на телефоне ссылка на приложение, на ПК тот же айфон поверх страницы. */
var full=$('#ap-full'),fx=$('#iph-x');
function close(){if(!dev)return;dev.classList.remove('full');root.classList.remove('full-on')}
if(full)full.addEventListener('click',function(e){
  if(narrow.matches||matchMedia('(pointer: coarse) and (max-width: 1100px)').matches)return;
  e.preventDefault();load();dev.classList.add('full');root.classList.add('full-on');
});
if(fx)fx.addEventListener('click',close);
if(dev)dev.addEventListener('click',function(e){if(e.target===dev)close()});
addEventListener('keydown',function(e){if(e.key==='Escape')close()});

/* ── Канбан менеджера ── */
var BX=JSON.parse($('#bx-data').textContent),board=$('#bx-board'),side=$('#bx-side'),bpush=$('#bx-push');
var cards=BX.others.map(function(o){return {id:o.id,name:o.name,hotel:o.hotel,dates:o.dates,op:o.op,sum:o.sum,col:o.col,files:o.col>=4,app:false}});
var sel=null;
function colOf(m){return m.refused?6:Math.min(m.step,5)}
function draw(){
  board.innerHTML=BX.cols.map(function(c,i){
    var list=cards.filter(function(x){return x.col===i});
    return '<div class="bx-col" data-col="'+i+'"><p class="bx-ch" style="--c:'+c.c+'"><span>'+esc(c.n)+'</span><b class="num">'+list.length+'</b></p><div class="bx-cards">'+list.map(function(x){
      return '<button type="button" class="bx-card'+(x.app?' app':'')+(sel===x.id?' on':'')+(x.fresh?' fresh':'')+'" data-id="'+x.id+'" draggable="true"><span class="bx-n">'+esc(x.deal||'')+(x.app?' <em>'+BX.me+'</em>':'')+'</span><b>'+esc(x.name)+'</b><small>'+esc(x.hotel)+'</small><small>'+esc(x.dates)+' · '+esc(x.op)+'</small><span class="bx-s num">'+esc(x.sum)+'</span>'+(x.files?'<span class="bx-f">📎 4</span>':'')+'</button>';
    }).join('')+'</div></div>';
  }).join('');
  drawSide();
}
function drawSide(){
  var x=cards.filter(function(c){return c.id===sel})[0];
  if(!x){side.innerHTML='<p class="bx-empty">'+BX.pick+'</p>';return}
  var col=BX.cols[x.col];
  side.innerHTML='<p class="bx-sk">'+BX.deal+' '+esc(x.deal||'')+'</p><h4>'+esc(x.name)+'</h4><p class="bx-stage" style="--c:'+col.c+'">'+esc(col.n)+'</p>'+
    '<dl><dt>'+BX.tour+'</dt><dd>'+esc(x.hotel)+'<br>'+esc(x.dates)+'</dd><dt>'+BX.op+'</dt><dd>'+esc(x.op)+'</dd><dt>'+BX.sum+'</dt><dd>'+esc(x.sum)+(x.app?' · '+(x.paid?BX.paid:BX.notPaid):'')+'</dd>'+(x.phone?'<dt>'+BX.contact+'</dt><dd>'+esc(x.phone)+'</dd>':'')+'</dl>'+
    (x.app?'<p class="bx-src">'+BX.source+'</p>':'')+
    '<p class="bx-sk">'+BX.toCol+'</p><div class="bx-move">'+BX.cols.map(function(c,i){return '<button type="button" data-move="'+i+'" class="'+(i===x.col?'on':'')+'" style="--c:'+c.c+'">'+esc(c.n)+'</button>'}).join('')+'</div>'+
    '<p class="bx-sk">'+BX.filesT+'</p>'+(x.files?'<div class="bx-files">'+BX.files.map(function(f){return '<span>📄 '+f+'</span>'}).join('')+'</div>':'<p class="bx-nof">'+BX.noFiles+'</p><button type="button" class="bx-att" data-att>'+BX.att+'</button>')+
    '<p class="bx-hint">'+(x.app?BX.demoCard:BX.otherCard)+'</p>';
}
function reveal(){var c=board.querySelector('.bx-card.on');if(!c)return;var col=c.closest('.bx-col');board.scrollTo({left:Math.max(0,col.offsetLeft-14),behavior:REDUCED?'auto':'smooth'})}
function move(x,col){
  if(x.col===col)return;
  x.col=col;x.fresh=false;
  if(col>=4)x.files=true;
  if(col>=3)x.paid=true;
  draw();reveal();
  ping(BX.steps[col]);
  if(x.app)send({tb:'jump',to:'status',id:x.id,step:col===6?x.step||0:col,refused:col===6});
}
function ping(text){
  $('b',bpush).textContent=text;
  bpush.classList.remove('on');void bpush.offsetWidth;bpush.classList.add('on');
  clearTimeout(ping.t);ping.t=setTimeout(function(){bpush.classList.remove('on')},3200);
}
board.addEventListener('click',function(e){var b=e.target.closest('.bx-card');if(!b)return;sel=b.getAttribute('data-id');draw()});
side.addEventListener('click',function(e){
  var x=cards.filter(function(c){return c.id===sel})[0];if(!x)return;
  var m=e.target.closest('[data-move]');if(m){move(x,+m.getAttribute('data-move'));return}
  if(e.target.closest('[data-att]')){x.files=true;move(x,Math.max(x.col,4));if(x.col===4){draw()}ping(BX.attDone)}
});
/* Перетаскивание мышью между колонками. */
var dragId=null;
board.addEventListener('dragstart',function(e){var b=e.target.closest('.bx-card');if(!b)return;dragId=b.getAttribute('data-id');try{e.dataTransfer.setData('text/plain',dragId)}catch(x){}});
board.addEventListener('dragover',function(e){if(dragId&&e.target.closest('.bx-col')){e.preventDefault();$$('.bx-col',board).forEach(function(c){c.classList.toggle('over',c===e.target.closest('.bx-col'))})}});
board.addEventListener('drop',function(e){var c=e.target.closest('.bx-col');if(!c||!dragId)return;e.preventDefault();var x=cards.filter(function(k){return k.id===dragId})[0];dragId=null;if(x){sel=x.id;move(x,+c.getAttribute('data-col'))}draw()});
board.addEventListener('dragend',function(){dragId=null;$$('.bx-col',board).forEach(function(c){c.classList.remove('over')})});
/* Из приложения: новая заявка или сменился статус. */
addEventListener('message',function(e){
  if(e.origin!==location.origin||!e.data||e.data.tb!=='deal')return;
  var m=e.data,x=cards.filter(function(c){return c.id===m.id})[0],isNew=!x;
  if(!x){x={id:m.id,app:true};cards.unshift(x)}
  x.deal=m.deal;x.name=m.name;x.hotel=m.hotel;x.dates=m.dates;x.op=m.op;x.sum=m.sum;x.phone=m.phone;x.paid=m.paid;x.step=m.step;
  x.col=colOf(m);x.files=x.col===4||x.col===5;
  if(isNew&&m.step===0){x.fresh=true;sel=x.id;ping(BX.fresh+': '+m.name)}
  if(!sel)sel=x.id;
  draw();if(x.id===sel)reveal();
});
draw();

/* ── Конструктор: «Минимум» или «Максимум», допы, срок ── */
var K=JSON.parse($('#kit-data').textContent),KEY='tb-kit-1';
var st={};try{st=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
var boxes=$$('#konstruktor input[data-k]'),radios=$$('#konstruktor input[name="tier"]');
boxes.forEach(function(b){b.checked=!!st[b.getAttribute('data-k')];b.addEventListener('change',function(){st[b.getAttribute('data-k')]=b.checked;keep();sum()})});
radios.forEach(function(r){if(st.__tier)r.checked=r.value===st.__tier;r.addEventListener('change',function(){st.__tier=r.value;keep();sum()})});
var cashBox=$('#kit-cash');
if(cashBox){cashBox.checked=!!st.__cash;cashBox.addEventListener('change',function(){st.__cash=cashBox.checked;keep();sum()})}
function keep(){try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){}}
var shown=0;
function tierNow(){var r=radios.filter(function(x){return x.checked})[0]||radios[1];return K.tiers.filter(function(t){return t.id===r.value})[0]}
function sum(){
  var tr=tierNow(),add=0,n=0,w=0;
  boxes.forEach(function(b){if(b.checked){add+=+b.getAttribute('data-p');w+=+b.getAttribute('data-w');n++}});
  var full=tr.p+add,off=cashBox&&cashBox.checked?Math.round(full*K.cash/100):0,total=full-off;
  $('#kit-cash-v').textContent=off?'−'+grp(off)+'\u00a0$':'';
  $('#kt-tier').textContent=tr.t;$('#kt-tp').textContent=grp(tr.p)+' $';
  $('#kit-n').textContent=n;$('#kit-add').textContent=grp(add)+' $';
  $('#kit-weeks').textContent=(tr.w[0]+Math.ceil(w/2))+'-'+(tr.w[1]+w);
  roll($('#kit-sum'),shown,total);shown=total;
  var ds=$('#dock-sum');if(ds)ds.textContent=grp(total)+' $';
}
function roll(el,a,b){if(REDUCED||a===b||!a){el.textContent=grp(b)+' $';return}var t0=0;function f(now){if(!t0)t0=now;var k=Math.min((now-t0)/500,1),e=1-Math.pow(1-k,3);el.textContent=grp(a+(b-a)*e)+' $';if(k<1)requestAnimationFrame(f)}requestAnimationFrame(f)}
sum();
$('#kit-copy').addEventListener('click',function(){
  var tr=tierNow(),lines=[K.head,'• '+tr.t+': '+grp(tr.p)+' $'];
  K.items.forEach(function(a){if(st[a.id])lines.push('• '+a.t+': '+grp(a.p)+' $')});
  if(cashBox&&cashBox.checked)lines.push('• '+K.cashName+': −'+K.cash+'%');
  lines.push(K.total+': '+$('#kit-sum').textContent+', '+$('#kit-weeks').textContent+' '+K.weeks);
  var txt=lines.join('\n'),b=this;
  var done=function(){var o=b.textContent;b.textContent=K.copied;setTimeout(function(){b.textContent=o},1600)};
  if(navigator.clipboard)navigator.clipboard.writeText(txt).then(done,done);else done();
});
var kg=$('#kit-go');
if(kg)kg.addEventListener('click',function(){var tr=tierNow(),lines=[K.head,'• '+tr.t];K.items.forEach(function(a){if(st[a.id])lines.push('• '+a.t)});try{navigator.clipboard.writeText(lines.join('\n'))}catch(e){}});
})();
