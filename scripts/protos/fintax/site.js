(function(){
'use strict';
/* site: сайт FinTax. Прокрутку не перехватывает: всё, что связано с
   прокруткой, только читает её и двигает transform или opacity. Связь с
   панелью — память браузера, как у greenwell: заявки пишет сайт
   (ft-leads-1), статусы и цены тарифов — панель (ft-panel-1). Главное
   действие открывает Telegram или WhatsApp компании с готовым текстом.
   Комментарии вырезает сборка. */
var d=document,W=window,root=d.documentElement,K=JSON.parse(d.getElementById('ft-data').textContent);
var $=function(s,r){return (r||d).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))};
var REDUCED=root.classList.contains('rm');
var LK='ft-leads-1',PK='ft-panel-1',PICK='ft-pick-1';
function lsGet(k,def){try{var v=JSON.parse(localStorage.getItem(k)||'null');return v==null?def:v}catch(e){return def}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function fill(s,o){return String(s).replace(/\{(\w+)\}/g,function(_,k){return o[k]==null?'':o[k]})}
function pad(n){return (n<10?'0':'')+n}
function day(ts){var x=new Date(ts);return pad(x.getDate())+'.'+pad(x.getMonth()+1)+'.'+x.getFullYear()}
function clamp(x,a,b){return x<a?a:x>b?b:x}
function ease(x){return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2}
function tg(text){return 'https://t.me/'+K.tg+'?text='+encodeURIComponent(text)}
function wa(text){return 'https://wa.me/'+K.wa+'?text='+encodeURIComponent(text)}
function panel(){return lsGet(PK,{})||{}}
function price(id){var p=panel().price;var x=K.tariffs.filter(function(t){return t.id===id})[0];return (p&&p[K.lang+':'+id])||(x?x.p:'')}
var toastT=0;
function toast(html){var el=$('#toast');el.innerHTML=html;el.hidden=false;clearTimeout(toastT);toastT=setTimeout(function(){el.hidden=true},6500)}

requestAnimationFrame(function(){root.classList.add('go')});

/* ── Шапка (правило владельца, 15.10.2026): при любой прокрутке прячется
   и возвращается через 3 секунды после последнего события прокрутки.
   Пока фокус с клавиатуры внутри шапки, она не прячется. ─────────────── */
var top=$('#top'),IDLE=3000,idleT=0;
function headIdle(){if(!top)return;clearTimeout(idleT);
  if(!top.contains(d.activeElement))top.classList.add('hide');
  idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}

/* ── Меню ──────────────────────────────────────────────────────────── */
var menu=$('#menu'),mb=$('#menu-btn');
function menuOn(on){if(!menu)return;menu.hidden=!on;mb&&mb.setAttribute('aria-expanded',on?'true':'false');d.body.style.overflow=on?'hidden':'';if(on)$('[data-close]',menu).focus();else mb&&mb.focus()}
mb&&mb.addEventListener('click',function(){menuOn(true)});
menu&&menu.addEventListener('click',function(e){if(e.target.closest('[data-close]')||e.target.closest('a'))menuOn(false)});
d.addEventListener('keydown',function(e){if(e.key==='Escape'&&menu&&!menu.hidden)menuOn(false)});

/* ── Появление блоков: у каждого своё движение (класс mv-*) ──────────── */
var mvs=$$('.mv');
if(REDUCED||!('IntersectionObserver' in W))mvs.forEach(function(x){x.classList.add('in')});
else{var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});mvs.forEach(function(x){io.observe(x)})}

/* ── Хаос → порядок: документы из беспорядка ложатся в три папки.
   Секция чуть выше экрана, прогресс — сколько её пролистали. ────────── */
var ord=$('#order'),board=ord&&$('.ord-board',ord),docs=ord?$$('.doc',ord):[],piles=ord?$$('.pile',ord):[],obar=ord&&$('.ord-bar i',ord);
var MESS=[[.02,.06,-14],[.3,.0,9],[.62,.04,-6],[.8,.16,16],[.12,.38,11],[.44,.26,-18],[.7,.42,7],[.9,.5,-11],[.0,.62,-7],[.28,.56,14],[.52,.6,-3],[.76,.7,12]];
function orderFrame(){if(!ord)return;var vh=W.innerHeight,r=ord.getBoundingClientRect(),
    p=REDUCED?1:clamp(-r.top/Math.max(1,r.height-vh),0,1),bw=board.clientWidth,bh=board.clientHeight;
  if(!docs.length||!bw)return;var dw=docs[0].offsetWidth,dh=docs[0].offsetHeight,cnt=[0,0,0];
  var q=ease(clamp((p-.08)/.74,0,1));
  docs.forEach(function(el,i){var g=+el.getAttribute('data-g'),m=MESS[i],k=cnt[g]++;
    var pl=piles[g],cx=pl.offsetLeft+pl.offsetWidth/2-dw/2,ty=bh-dh-62-k*(bw<640?7:10);
    var x0=m[0]*(bw-dw),y0=m[1]*(bh-dh-62),x=x0+(cx-x0)*q,y=y0+(ty-y0)*q,rot=m[2]*(1-q)+(k%2?1.2:-1.2)*q;
    el.style.transform='translate3d('+x.toFixed(1)+'px,'+y.toFixed(1)+'px,0) rotate('+rot.toFixed(2)+'deg)';el.style.zIndex=String(q>.5?10+k:i)});
  ord.classList.toggle('done',p>.62);if(obar)obar.style.transform='scaleX('+p.toFixed(3)+')'}

/* ── Прокрутка только читается: фото первого экрана, полоса с архивом ── */
var heroImg=$('.hero-ph img'),heroIn=$('.hero-in'),bands=$$('[data-band] img'),dock=$('#dock'),foot=$('.foot'),tick=false;
function frame(){tick=false;var y=W.scrollY||0,vh=W.innerHeight;
  if(heroImg&&!REDUCED&&y<vh*1.3){var f=y/vh;heroImg.style.transform='translate3d(0,'+(y*.22).toFixed(1)+'px,0) scale('+(1.04+f*.08).toFixed(3)+')';
    if(heroIn){heroIn.style.transform='translate3d(0,'+(-y*.12).toFixed(1)+'px,0)';heroIn.style.opacity=String(clamp(1-f*1.3,0,1).toFixed(3))}}
  if(!REDUCED)bands.forEach(function(im){var r=im.parentNode.parentNode.getBoundingClientRect();if(r.bottom<0||r.top>vh)return;var c=(r.top+r.height/2-vh/2)/vh;im.style.transform='translate3d(0,'+(c*-60).toFixed(1)+'px,0) scale(1.06)'});
  orderFrame();
  if(dock&&foot){dock.classList.toggle('off',foot.getBoundingClientRect().top<vh-40)}}
function onScroll(){headIdle();if(!tick){tick=true;requestAnimationFrame(frame)}}
addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',function(){if(!tick){tick=true;requestAnimationFrame(frame)}});frame();
d.fonts&&d.fonts.ready&&d.fonts.ready.then(frame);

/* ── Подбор тарифа: пределы тарифов сайта, берём самый строгий ─────── */
$$('[data-picker]').forEach(function(pk){
  var S={kind:'opt',docs:40,staff:6,tax:'vat',turn:1,ved:false},tiersI=$('.tiers i',pk),tierS=$$('.tiers span',pk),res=$('[data-res]',pk),last=-1;
  function fit(){var ix=0,why=[],over=false,L=K.tariffs.map(function(x){return x.lim});
    var di=0;while(di<3&&S.docs>L[di].docs)di++;if(S.docs>L[3].docs){over=true;why.push(K.r.docsOver)}else why.push(fill(K.r.docs,{n:S.docs,m:L[di].docs}));
    var si=0;while(si<3&&S.staff>=L[si].staff)si++;if(S.staff>=L[3].staff){over=true;why.push(K.r.staffOver)}else why.push(fill(K.r.staff,{n:S.staff,m:L[si].staff}));
    ix=Math.max(di,si,S.turn);
    if(S.tax==='vat'){ix=Math.max(ix,1);why.push(K.r.vat)}else if(ix===0)why.push(K.r.usn);
    if(S.ved){ix=Math.max(ix,2);why.push(K.r.ved)}
    why.push(fill(K.r.turn,{n:K.turn[S.turn]}));
    return {ix:ix,why:why,over:over}}
  function paint(u){var f=fit(),x=K.tariffs[f.ix],pr=price(x.id);
    $('.pk-name',pk).textContent=x.n;$('.pk-for',pk).textContent=x.f;$('.pk-price span',pk).textContent=pr;
    $('[data-why]',pk).innerHTML=f.why.map(function(w){return '<li>'+K.icCheck+'<span>'+h(w)+'</span></li>'}).join('');
    tiersI.style.transform='translateX(calc('+f.ix+' * (100% + 4px)))';tierS.forEach(function(s,i){s.classList.toggle('on',i===f.ix)});
    if(f.ix!==last&&last>=0&&!REDUCED){res.classList.remove('flip');void res.offsetWidth;res.classList.add('flip')}last=f.ix;
    var msg=fill(K.pickMsg,{t:x.n,p:pr,k:K.kinds[S.kind],d:S.docs,s:S.staff,x:K.taxN[S.tax],o:K.turn[S.turn],v:S.ved?K.vedN:''});
    $('[data-pk-tg]',pk).href=tg(msg);
    if(u)lsSet(PICK,{t:x.id,n:x.n,p:pr,kind:S.kind,docs:S.docs,staff:S.staff,tax:S.tax,turn:S.turn,ved:S.ved,ts:Date.now()});
    $$('[data-tariffs] .tf').forEach(function(c){c.classList.toggle('on',c.getAttribute('data-t')===x.id)});
    pickIn()}
  $$('.seg',pk).forEach(function(g){var q=g.getAttribute('data-q');$$('button',g).forEach(function(b){b.addEventListener('click',function(){
    $$('button',g).forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});var v=b.getAttribute('data-v');S[q]=q==='turn'?+v:v;paint(1)})})});
  $$('input[type=range]',pk).forEach(function(r){function u(){S[r.name]=+r.value;$('[data-o="'+r.name+'"]',pk).textContent=r.value;r.style.setProperty('--p',((r.value-r.min)/(r.max-r.min)*100).toFixed(1)+'%')}
    r.addEventListener('input',function(){u();paint(1)});u()});
  var vb=$('[data-q="ved"]',pk);vb.addEventListener('click',function(){S.ved=!S.ved;vb.setAttribute('aria-pressed',S.ved?'true':'false');paint(1)});
  paint()});

/* ── Схема «что берём на себя»: узлы загораются по кругу, пока схема на
   экране; нажатие — остановка на услуге. ──────────────────────────── */
$$('[data-scheme]').forEach(function(sc){
  var nds=$$('.nd',sc),sps=$$('.sp-on',sc),btns=$$('.sch-list button',sc),card=$('.sch-card',sc),pulse=$('.pulse',sc),N=nds.length,cur=0,run=!REDUCED,vis=false,t0=0,STEP=2600,raf=0;
  function set(i){cur=i;var s=K.services[i];
    nds.forEach(function(n,j){n.classList.toggle('on',j===i)});sps.forEach(function(l,j){l.style.opacity=j===i?'1':'0'});
    btns.forEach(function(b,j){b.setAttribute('aria-pressed',j===i?'true':'false')});
    $('[data-g]',card).textContent=pad(i+1)+' · '+s.g;$('h3',card).textContent=s.n;$('p',card).textContent=s.d;$('[data-ask]',card).href=tg(s.ask)}
  function loop(now){raf=0;if(!run||!vis)return;if(!t0)t0=now;var f=(now-t0)/STEP;if(f>=1){t0=now;f=0;set((cur+1)%N)}
    var l=sps[cur],x=+l.getAttribute('x2'),y=+l.getAttribute('y2'),k=ease(Math.min(f*2.2,1));
    pulse.setAttribute('transform','translate('+((x-300)*k).toFixed(1)+' '+((y-300)*k).toFixed(1)+')');pulse.style.opacity=f<.5?'1':String(Math.max(0,1-(f-.5)*3));
    raf=requestAnimationFrame(loop)}
  function go(){if(run&&vis&&!raf){t0=0;raf=requestAnimationFrame(loop)}}
  function pickN(i){run=false;pulse.style.opacity='0';set(i)}
  nds.forEach(function(n,i){n.addEventListener('click',function(){pickN(i)});n.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();pickN(i)}})});
  btns.forEach(function(b,i){b.addEventListener('click',function(){pickN(i)})});
  if('IntersectionObserver' in W)new IntersectionObserver(function(es){vis=es[0].isIntersecting;go()},{threshold:.25}).observe(sc);else vis=true;
  set(0);if(!run)pulse.style.opacity='0';go()});

/* ── Услуги: вкладки на компьютере, раскрытие на телефоне ──────────── */
$$('[data-svc]').forEach(function(sv){var bs=$$('.svc-l button',sv),pn=$('.svc-p',sv),ms=$$('.svc-mob',sv);
  function set(i,user){var s=K.services[i];bs.forEach(function(b,j){b.setAttribute('aria-pressed',j===i?'true':'false')});ms.forEach(function(m,j){m.hidden=j!==i});
    $('.ico',pn).innerHTML=s.ic;$('[data-g]',pn).textContent=pad(i+1)+' · '+s.g;$('h3',pn).textContent=s.n;$('p',pn).textContent=s.d;$('[data-ask]',pn).href=tg(s.ask);
    if(user&&!REDUCED){pn.classList.remove('flip');void pn.offsetWidth;pn.classList.add('flip')}}
  bs.forEach(function(b,i){b.addEventListener('click',function(){set(i,true)})});
  var m=/svc=(\w+)/.exec(location.hash||''),start=0;if(m)K.services.forEach(function(s,i){if(s.id===m[1])start=i});set(start)});

/* ── Стол: отмеченные заботы улетают в папку FinTax ───────────────── */
$$('[data-desk]').forEach(function(dk){var bs=$$('.wy button',dk),hand=$('[data-hand]',dk),back=$('[data-back]',dk),ans=$('[data-ans]',dk),tray=$('[data-tray]',dk);
  bs.forEach(function(b){b.addEventListener('click',function(){if(dk.classList.contains('moved'))return;b.setAttribute('aria-pressed',b.getAttribute('aria-pressed')==='true'?'false':'true')})});
  function fly(from,i,done){if(REDUCED){done();return}var a=from.getBoundingClientRect(),z=tray.getBoundingClientRect(),s=d.createElement('i');s.className='sheet-f';d.body.appendChild(s);
    var x0=a.left+20,y0=a.top+a.height/2-28,x1=z.right-110,y1=z.top+24;
    s.style.transform='translate3d('+x0+'px,'+y0+'px,0) rotate(-6deg)';
    s.animate([{transform:'translate3d('+x0+'px,'+y0+'px,0) rotate(-6deg)',opacity:1},{transform:'translate3d('+((x0+x1)/2)+'px,'+(Math.min(y0,y1)-80)+'px,0) rotate(8deg)',opacity:1,offset:.5},{transform:'translate3d('+x1+'px,'+y1+'px,0) rotate(0) scale(.6)',opacity:0}],{duration:720,delay:i*90,easing:'cubic-bezier(.2,.7,.2,1)',fill:'forwards'}).onfinish=function(){s.remove();done()}}
  hand.addEventListener('click',function(){var on=bs.filter(function(b){return b.getAttribute('aria-pressed')==='true'});
    if(!on.length){toast(h(K.noWorry));return}
    dk.classList.add('moved');hand.disabled=true;ans.innerHTML='<p class="note">'+h(fill(K.nWorry,{n:on.length}))+'</p>';
    on.forEach(function(b,i){fly(b,i,function(){var w=K.why[+b.getAttribute('data-w')];var el=d.createElement('div');el.className='ans';el.innerHTML=K.icCheck+'<span><b>'+h(w.a)+'</b><span>'+h(w.b)+'</span></span>';ans.appendChild(el)})});
    back.hidden=false});
  back.addEventListener('click',function(){dk.classList.remove('moved');hand.disabled=false;back.hidden=true;ans.innerHTML='<p class="dk-empty">'+h(K.emptyAns)+'</p>'})});

/* ── Заявки: проверка, запись в память браузера, мессенджер с текстом ── */
function leads(){var a=lsGet(LK,[]);return Array.isArray(a)?a:[]}
function pickIn(){var pk=lsGet(PICK,null);$$('[data-pick-in]').forEach(function(p){if(!pk){p.hidden=true;return}p.hidden=false;$('span',p).textContent=fill(K.pickIn,{t:pk.n,p:pk.p});var f=p.closest('form');if(f&&f.elements.kind&&!f.elements.kind.value)f.elements.kind.value=pk.kind})}
pickIn();
$$('form[data-lead]').forEach(function(f){
  var sent=f.parentNode.querySelector('.sent');
  function bad(el,msg){var w=el.closest('.fl')||el.closest('.agree');w.classList.toggle('bad',!!msg);var e=w.querySelector('.err');if(e)e.textContent=msg||'';return !!msg}
  function check(){var first=null;$$('[name]',f).forEach(function(el){var v=(el.type==='checkbox'?el.checked:el.value.trim()),m='';
      if(el.required&&!v)m=K.err.need;else if(el.name==='phone'&&v&&String(v).replace(/\D/g,'').length<9)m=K.err.phone;
      if(bad(el,m)&&!first)first=el});return first}
  f.addEventListener('input',function(e){if(e.target.closest('.bad'))bad(e.target,'')});
  f.addEventListener('change',function(e){if(e.target.closest('.bad'))bad(e.target,'')});
  f.addEventListener('submit',function(e){e.preventDefault();var miss=check();if(miss){miss.focus();toast(h(K.err.form));return}
    var btn=$('button[type="submit"]',f),lab=btn.innerHTML;btn.disabled=true;btn.innerHTML='<i class="spin" aria-hidden="true"></i><span>'+h(K.sending)+'</span>';
    var pk=lsGet(PICK,null),x={id:'FT-'+Date.now().toString(36).slice(-5).toUpperCase(),ts:Date.now(),page:K.page,lang:K.lang};
    $$('[name]',f).forEach(function(el){if(el.type!=='checkbox')x[el.name]=el.value.trim()});
    if(pk){x.tariff=pk.t;x.pick=pk}
    var rest=(x.kind?' '+K.kinds[x.kind]+'.':'')+(pk?' '+fill(K.pickIn,{t:pk.n,p:pk.p})+'.':'')+(x.msg?' '+x.msg:'');
    var msg=fill(K.leadMsg,{id:x.id,name:x.name,phone:x.phone,rest:rest});
    setTimeout(function(){var a=leads();a.unshift(x);lsSet(LK,a.slice(0,40));btn.disabled=false;btn.innerHTML=lab;f.reset();
      if(sent){f.hidden=true;sent.hidden=false;$('[data-no]',sent).textContent=x.id;$('[data-send="tg"]',sent).href=tg(msg);$('[data-send="wa"]',sent).href=wa(msg);sent.focus()}
      toast(h(K.sentToast)+' <a href="'+K.panel+'#leads">'+h(K.toPanel)+'</a>');track()},REDUCED?0:600)});
  sent&&$('[data-again]',sent).addEventListener('click',function(){sent.hidden=true;f.hidden=false;f.querySelector('input').focus();pickIn()})});

/* Мои заявки: статус ставит панель (ft-panel-1, st[id]). */
var ST=['new','call','offer','client'];
function track(){var box=$('#track');if(!box)return;var mine=leads().slice(0,4),PS=panel();
  box.hidden=!mine.length;if(!mine.length)return;
  $('.track-l',box).innerHTML=mine.map(function(x){var s=(PS.st&&PS.st[x.id])||'new',k=ST.indexOf(s);if(k<0){s='new';k=0}
    return '<div class="tr"><div class="tr-h"><b>'+h(x.id)+(x.kind?' · '+h(K.kinds[x.kind]||''):'')+'</b><span>'+day(x.ts)+'</span></div><div class="tr-st" aria-hidden="true">'+ST.map(function(_,i){return '<i'+(i<=k?' class="on"':'')+'></i>'}).join('')+'</div><p class="tr-l">'+h(K.status)+': <b>'+h(K.st[s])+'</b></p></div>'}).join('')}
track();

/* Цены тарифов на странице «Тарифы» — из панели, если там правили. */
function prices(){$$('[data-price]').forEach(function(el){el.textContent=price(el.getAttribute('data-price'))})}
prices();
addEventListener('storage',function(e){if(e.key===PK||e.key===LK){track();prices()}});
})();
