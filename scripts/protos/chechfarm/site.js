(function(){
'use strict';
/* site: сайт CZECHFARM. Прокрутку не перехватывает: всё, что связано с
   прокруткой, только читает её и двигает transform или opacity. Связь с
   панелью — память браузера, как у greenwell: обращения пишет сайт
   (cf-leads-1), новости, портфель, статусы и заголовки страниц — панель
   (cf-panel-1). Комментарии вырезает сборка. */
var d=document,W=window,root=d.documentElement,K=JSON.parse(d.getElementById('cf-data').textContent);
var $=function(s,r){return (r||d).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))};
var REDUCED=root.classList.contains('rm');
var LK='cf-leads-1',PK='cf-panel-1';
function lsGet(k,def){try{var v=JSON.parse(localStorage.getItem(k)||'null');return v==null?def:v}catch(e){return def}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function fill(s,o){return String(s).replace(/\{(\w+)\}/g,function(_,k){return o[k]==null?'':o[k]})}
function pad(n){return (n<10?'0':'')+n}
function day(ts){var x=new Date(ts);return pad(x.getDate())+'.'+pad(x.getMonth()+1)+'.'+x.getFullYear()}
function txt(o){return o&&typeof o==='object'?(o[K.lang]||o.ru||o.en||''):(o||'')}
var toastT=0;
function toast(html){var el=$('#toast');el.innerHTML=html;el.hidden=false;clearTimeout(toastT);toastT=setTimeout(function(){el.hidden=true},6500)}

/* Появление после заставки: класс go на корне. */
requestAnimationFrame(function(){root.classList.add('go')});

/* ── Шапка (правило владельца, 15.10.2026): при любой прокрутке прячется
   и возвращается через 3 секунды после последнего события прокрутки.
   Пока фокус с клавиатуры внутри шапки, она не прячется. ─────────────── */
/* Владелец, 27.10.2026: на компьютере шапка стоит всегда (как у Soffice),
   на телефоне — общее правило, 3 секунды. */
var top=$('#top'),IDLE=3000,idleT=0,DESK=null;try{DESK=matchMedia('(min-width: 1080px)')}catch(e){}
function headIdle(){if(!top)return;clearTimeout(idleT);
  if(DESK&&DESK.matches){top.classList.remove('hide');return}
  if(!top.contains(d.activeElement))top.classList.add('hide');
  idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}

/* ── Меню ──────────────────────────────────────────────────────────── */
var menu=$('#menu'),mb=$('#menu-btn');
function menuOn(on){if(!menu)return;menu.hidden=!on;mb&&mb.setAttribute('aria-expanded',on?'true':'false');d.body.style.overflow=on?'hidden':'';if(on)$('[data-close]',menu).focus();else mb&&mb.focus()}
mb&&mb.addEventListener('click',function(){menuOn(true)});
menu&&menu.addEventListener('click',function(e){if(e.target.closest('[data-close]')||e.target.closest('a'))menuOn(false)});
d.addEventListener('keydown',function(e){if(e.key==='Escape'){if(menu&&!menu.hidden)menuOn(false);closeDlg()}});

/* ── Появление блоков: у каждого своё движение (класс mv-*) ──────────── */
var mvs=$$('.mv');
if(REDUCED||!('IntersectionObserver' in W))mvs.forEach(function(x){x.classList.add('in')});
else{var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});mvs.forEach(function(x){io.observe(x)})}

/* ── Прокрутка только читается: фото первого экрана, слова миссии ──── */
var heroImg=$('.hero-img'),words=$$('.mission .wd'),dock=$('#dock'),foot=$('.foot'),tick=false;
function frame(){tick=false;var y=W.scrollY||0,vh=W.innerHeight;
  if(heroImg&&!REDUCED&&y<vh*1.2)heroImg.style.transform='translate3d(0,'+(y*.18).toFixed(1)+'px,0) scale(1.04)';
  if(words.length){var lim=vh*.72;for(var i=0;i<words.length;i++){var r=words[i].getBoundingClientRect();words[i].classList.toggle('on',REDUCED||r.top<lim)}}
  if(dock&&foot){dock.classList.toggle('off',foot.getBoundingClientRect().top<vh-40)}}
function onScroll(){headIdle();if(!tick){tick=true;requestAnimationFrame(frame)}}
addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',function(){if(!tick){tick=true;requestAnimationFrame(frame)}});frame();

/* ── Первый экран: Health / Trust / Value переключаются сами ────────── */
var hc=$('#hc');
if(hc){var hb=$$('button',hc),ht=$('.hc-txt',hc),hi=0,hcT=0,hcStop=false;
  function hcSet(i){hi=i;hb.forEach(function(b,j){b.setAttribute('aria-pressed',j===i?'true':'false')});ht.classList.add('fade');setTimeout(function(){ht.textContent=K.pillars[i];ht.classList.remove('fade')},REDUCED?0:220)}
  hb.forEach(function(b,i){b.addEventListener('click',function(){hcStop=true;clearInterval(hcT);hcSet(i)})});
  if(!REDUCED)hcT=setInterval(function(){if(!hcStop&&!d.hidden)hcSet((hi+1)%hb.length)},4200)}

/* ── Цепочка стоимости: импульс бежит по пути, узлы загораются.
   Идёт сама, пока схема на экране; нажатие на узел — остановка на нём. ── */
$$('.chain').forEach(function(ch){
  var svgs=$$('.ch-svg',ch),card=$('.ch-card',ch),play=$('[data-play]',ch),bar=$('.ch-bar i',ch),N=K.chain.length;
  var step=0,run=!REDUCED,vis=false,t0=0,STEP=1300,raf=0;
  function cur(){for(var i=0;i<svgs.length;i++)if(svgs[i].getBoundingClientRect().width>0)return svgs[i];return svgs[0]}
  function info(i){var c=K.chain[i];$('.no',card).textContent=pad(i+1)+' / '+pad(N);$('h3',card).textContent=c[0];$('.ds',card).textContent=c[1]}
  function paint(i,f){svgs.forEach(function(svg){var path=$('.ch-lit',svg),dot=$('.ch-dot',svg),L=+svg.getAttribute('data-len'),stops=JSON.parse(svg.getAttribute('data-at')),
      a=stops[i],b=stops[Math.min(i+1,N-1)],at=a+(b-a)*f;
    path.style.strokeDashoffset=String(L-at);
    var p=path.getPointAtLength(at);dot.setAttribute('transform','translate('+p.x.toFixed(1)+' '+p.y.toFixed(1)+')');
    $$('.ch-n',svg).forEach(function(n,j){n.classList.toggle('on',j<=i)})});
    bar.style.transform='scaleX('+((i+f)/(N-1)).toFixed(3)+')'}
  function set(i){step=i;info(i);paint(i,0)}
  function loop(now){raf=0;if(!run||!vis)return;if(!t0)t0=now;var f=(now-t0)/STEP;
    if(f>=1){t0=now;f=0;if(step>=N-1){step=0}else step++;info(step)}
    paint(step,step>=N-1?0:Math.min(f,1));raf=requestAnimationFrame(loop)}
  function go(){if(run&&vis&&!raf){t0=0;raf=requestAnimationFrame(loop)}}
  function pbtn(){play.innerHTML=run?K.icPause+'<span>'+h(K.pause)+'</span>':K.icPlay+'<span>'+h(K.play)+'</span>';play.setAttribute('aria-pressed',run?'false':'true')}
  play.addEventListener('click',function(){run=!run;pbtn();if(run){if(step>=N-1)set(0);go()}});
  svgs.forEach(function(svg){$$('.ch-n',svg).forEach(function(n,j){
    function pickN(){run=false;pbtn();set(j)}
    n.addEventListener('click',pickN);n.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();pickN()}})})});
  if('IntersectionObserver' in W)new IntersectionObserver(function(es){vis=es[0].isIntersecting;go()},{threshold:.3}).observe(ch);else vis=true;
  set(REDUCED?N-1:0);if(REDUCED)paint(N-1,0);pbtn();go()});

/* ── Обращения: проверка полей, запись в память браузера, панель видит ── */
function leads(){var a=lsGet(LK,[]);return Array.isArray(a)?a:[]}
$$('form[data-lead]').forEach(function(f){
  var kind=f.getAttribute('data-lead'),tabs=$$('.tabs button',f),sent=f.parentNode.querySelector('.sent');
  tabs.forEach(function(b){b.addEventListener('click',function(){kind=b.getAttribute('data-k');tabs.forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false')})})});
  function bad(el,msg){var w=el.closest('.fl')||el.closest('.agree');if(!w)return false;w.classList.toggle('bad',!!msg);var e=w.querySelector('.err');if(e)e.textContent=msg||'';return !!msg}
  function check(){var first=null;$$('[name]',f).forEach(function(el){var v=(el.type==='checkbox'?el.checked:el.value.trim()),m='';
      if(el.required&&!v)m=K.err.need;else if(el.name==='email'&&v&&!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v))m=K.err.mail;else if(el.name==='phone'&&v&&String(v).replace(/\D/g,'').length<9)m=K.err.phone;
      if(bad(el,m)&&!first)first=el});return first}
  f.addEventListener('input',function(e){if(e.target.closest('.bad'))bad(e.target,'')});
  f.addEventListener('submit',function(e){e.preventDefault();var miss=check();if(miss){miss.focus();toast(h(K.err.form));return}
    var btn=$('button[type="submit"]',f),lab=btn.innerHTML;btn.disabled=true;btn.innerHTML='<i class="spin" aria-hidden="true"></i><span>'+h(K.sending)+'</span>';
    var x={id:'S'+Date.now().toString(36).slice(-6).toUpperCase(),ts:Date.now(),kind:kind,page:K.page,lang:K.lang};
    $$('[name]',f).forEach(function(el){if(el.type!=='checkbox')x[el.name]=el.value.trim()});
    function done(){var a=leads();a.unshift(x);lsSet(LK,a.slice(0,40));btn.disabled=false;btn.innerHTML=lab;f.reset();
      if(sent){f.hidden=true;sent.hidden=false;$('[data-no]',sent).textContent=x.id;sent.focus()}
      toast(h(K.sentToast)+(K.panel?' <a href="'+K.panel+'#leads">'+h(K.toPanel)+'</a>':''));track()}
    /* Боевой сайт: обращение — на сервер, в памяти браузера только номер и ключ статуса. */
    if(K.prod){fetch('/api/lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(x)})
      .then(function(r){return r.json().then(function(j){if(!r.ok)throw j;return j})})
      .then(function(j){x={id:j.no,key:j.key,ts:x.ts,kind:x.kind};if(!j.no){btn.disabled=false;btn.innerHTML=lab;return}liveSt=null;done()},
        function(j){btn.disabled=false;btn.innerHTML=lab;toast(h((j&&j.error)||K.sendFail))});return}
    setTimeout(done,REDUCED?0:700)});
  sent&&$('[data-again]',sent).addEventListener('click',function(){sent.hidden=true;f.hidden=false;f.querySelector('input,textarea').focus()})});

/* Мои обращения: статус ставит панель (cf-panel-1, st[id]). */
var ST=['new','work','meet','done'];
var liveSt=null;
function track(){var box=$('#track');if(!box)return;var mine=leads().slice(0,4),PS=K.prod?{st:liveSt||{}}:lsGet(PK,{})||{};
  box.hidden=!mine.length;if(!mine.length)return;
  if(K.prod&&!liveSt){liveSt={};fetch('/api/track',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:mine.map(function(x){return {no:x.id,key:x.key}})})})
    .then(function(r){return r.ok?r.json():{}}).then(function(j){liveSt=j.st||{};track()},function(){})}
  $('.track-l',box).innerHTML=mine.map(function(x){var s=(PS.st&&PS.st[x.id])||'new',k=ST.indexOf(s);
    return '<div class="tr"><div class="tr-h"><b>'+h(x.id)+' · '+h(K.kinds[x.kind]||x.kind)+'</b><span>'+day(x.ts)+'</span></div><div class="tr-st" aria-hidden="true">'+ST.map(function(_,i){return '<i'+(i<=k?' class="on"':'')+'></i>'}).join('')+'</div><p class="tr-l">'+h(K.status)+': <b>'+h(K.st[s])+'</b></p></div>'}).join('')}
track();

/* ── Портфель из панели ────────────────────────────────────────────── */
function panel(){return K.prod?(K.live||{}):lsGet(PK,{})||{}}
var cat=$('#catalog');
function val(p,id){var v=p[id];if(id==='rx'&&K.rxName&&K.rxName[v])return K.rxName[v];return v}
function prodHtml(p){return '<button type="button" class="prod" data-pid="'+h(p.id)+'"><span class="pr-top">'+(K.demo?'<span class="chip">'+h(K.demo)+'</span>':'')+'</span><h3>'+h(p.name)+'</h3><dl>'+
  K.fields.slice(1,5).map(function(f){return '<dt>'+h(f.t)+'</dt><dd>'+h(val(p,f.id)||(K.prod?'-':K.agree))+'</dd>'}).join('')+'</dl></button>'}
function skel(){var s='';for(var i=0;i<6;i++)s+='<div class="prod sk" aria-hidden="true"><span class="sk-l" style="width:40%"></span><span class="sk-l" style="width:80%;height:18px"></span><span class="sk-l"></span><span class="sk-l" style="width:70%"></span><span class="sk-l" style="width:55%"></span></div>';return s}
var fDir=$('#f-dir'),fRx=$('#f-rx');
function catalog(){if(!cat)return;var ps=(panel().prod||[]).filter(function(p){return p.pub}),q=($('#q')||{}).value||'';q=q.trim().toLowerCase();
  if(K.prod&&fDir&&fDir.options.length<2){var ds=[];ps.forEach(function(p){if(p.dir&&ds.indexOf(p.dir)<0)ds.push(p.dir)});ds.sort().forEach(function(x){var o=d.createElement('option');o.value=x;o.textContent=x;fDir.appendChild(o)})}
  var dv=K.prod&&fDir?fDir.value:'',rv=K.prod&&fRx?fRx.value:'';
  var list=ps.filter(function(p){return (!q||(p.name+' '+(p.inn||'')+' '+(p.dir||'')).toLowerCase().indexOf(q)>=0)&&(!dv||p.dir===dv)&&(!rv||p.rx===rv)});
  $('#cat-n').textContent=ps.length?fill(K.catN,{n:list.length}):K.catEmpty;
  cat.innerHTML=ps.length?(list.length?list.map(prodHtml).join(''):'<p class="note">'+h(K.notFound)+'</p>'):(K.prod?'':skel())}
var qi=$('#q');qi&&qi.addEventListener('input',catalog);fDir&&fDir.addEventListener('change',catalog);fRx&&fRx.addEventListener('change',catalog);catalog();

/* ── Окно: продукт, новость ────────────────────────────────────────── */
var dlg=$('#dlg'),lastFocus=null;
function openDlg(html){lastFocus=d.activeElement;$('.dlg-b',dlg).innerHTML=html;dlg.hidden=false;d.body.style.overflow='hidden';$('.dlg-x',dlg).focus()}
function closeDlg(){if(!dlg||dlg.hidden)return;dlg.hidden=true;d.body.style.overflow='';lastFocus&&lastFocus.focus()}
dlg&&dlg.addEventListener('click',function(e){if(e.target===dlg||e.target.closest('.dlg-x'))closeDlg()});
function safeUrl(u){u=String(u||'');return /^(https:\/\/|\/uploads\/)/.test(u)?u:''}
function prodPage(p){if(K.prod&&p){var doc=safeUrl(p.doc);return (p.dir?'<p class="kicker">'+h(p.dir)+'</p>':'')+'<h2>'+h(p.name)+'</h2>'+(safeUrl(p.img)?'<img class="pp-img" src="'+h(safeUrl(p.img))+'" alt="'+h(p.name)+'">':'')+
  '<div class="sect-list">'+K.fields.filter(function(f){return f.id!=='name'&&f.id!=='doc'&&p[f.id]}).map(function(f,i){return '<div><b>'+pad(i+1)+'</b><span><strong>'+h(f.t)+'</strong><br>'+h(val(p,f.id))+'</span></div>'}).join('')+'</div>'+
  (p.about?'<p>'+h(p.about).replace(/\n/g,'<br>')+'</p>':'')+(doc?'<a class="btn btn-line" href="'+h(doc)+'" target="_blank" rel="noopener">'+K.icInfo+'<span>'+h(K.leaflet)+'</span></a>':'')+
  '<p class="warn">'+K.icInfo+'<span>'+h(K.medNote)+'</span></p>'}
  return '<p class="kicker">'+h(p?K.demo:K.sample)+'</p><h2>'+h(p?p.name:K.prodSample)+'</h2>'+
  '<div class="sect-list">'+K.fields.map(function(f,i){return '<div><b>'+pad(i+1)+'</b><span><strong>'+h(f.t)+'</strong><br>'+h(p&&p[f.id]?p[f.id]:K.agree)+'</span></div>'}).join('')+'</div>'+
  '<p class="warn">'+K.icInfo+'<span>'+h(K.medNote)+'</span></p>'}
d.addEventListener('click',function(e){var b=e.target.closest('[data-pid]');if(b){var p=(panel().prod||[]).filter(function(x){return String(x.id)===b.getAttribute('data-pid')})[0];openDlg(prodPage(p))}
  if(e.target.closest('[data-sample-prod]'))openDlg(prodPage(null));
  var n=e.target.closest('[data-nid]');if(n){var x=(panel().news||[]).filter(function(y){return String(y.id)===n.getAttribute('data-nid')})[0];if(x)openDlg(article(x))}
  if(e.target.closest('[data-sample-news]'))openDlg(article(null))});

/* ── Новости из панели ─────────────────────────────────────────────── */
function article(x){if(K.prod&&x)return '<time class="note">'+day(x.ts)+'</time><h2>'+h(x.title)+'</h2>'+(safeUrl(x.img)?'<img class="art-img" src="'+h(safeUrl(x.img))+'" alt="">':'')+'<p>'+h(x.body).replace(/\n/g,'<br>')+'</p>';
  return '<time class="note">'+(x?day(x.ts):h(K.dateW))+'</time><h2>'+h(x?x.title:K.newsSample)+'</h2><div class="art-im" aria-hidden="true">'+K.icImg+'</div>'+
  (x?'<p>'+h(x.body).replace(/\n/g,'<br>')+'</p><p class="chip">'+h(K.demo)+'</p>':'<div class="sect-list">'+K.newsParts.map(function(t,i){return '<div><b>'+pad(i+1)+'</b><span>'+h(t)+'</span></div>'}).join('')+'</div>')}
function newsHtml(x){var im=K.prod&&safeUrl(x.img);return '<button type="button" class="nw" data-nid="'+h(x.id)+'"><span class="im" aria-hidden="true">'+(im?'<img src="'+h(im)+'" alt="" loading="lazy">':K.icImg)+'</span><span class="tx"><time>'+day(x.ts)+'</time><h3>'+h(x.title)+'</h3>'+(K.demo?'<span class="chip">'+h(K.demo)+'</span>':'')+'</span></button>'}
function news(){var box=$('#news-l');if(!box)return;var ns=(panel().news||[]).filter(function(x){return x.pub}).sort(function(a,b){return b.ts-a.ts}),lim=+box.getAttribute('data-lim')||99;
  $('#news-empty')&&($('#news-empty').hidden=!!ns.length);box.innerHTML=ns.slice(0,lim).map(newsHtml).join('')+(ns.length||K.prod?'':'<button type="button" class="nw sample" data-sample-news><span class="im" aria-hidden="true">'+K.icImg+'</span><span class="tx"><time>'+h(K.dateW)+'</time><h3>'+h(K.newsSample)+'</h3><span class="chip">'+h(K.sample)+'</span></span></button>')}
news();

/* ── Заголовок вкладки из панели (SEO: title и description правятся там) ── */
function seo(){var s=panel().seo&&panel().seo[K.lang+':'+K.page];if(!s)return;if(s.t)d.title=s.t;var m=$('meta[name="description"]');if(m&&s.d)m.setAttribute('content',s.d)}
seo();

/* ── Контакты компании из панели (боевой сайт) ───────────────────────── */
function contactsLive(){var c=K.prod&&K.live&&K.live.contacts;if(!c)return;
  $$('[data-live]').forEach(function(el){var k=el.getAttribute('data-live'),v=String(c[k]||'').trim();
    $$('[data-live-wrap="'+k+'"]').forEach(function(w){w.hidden=!v});if(!v)return;
    if(k==='map'){if(/^https:\/\/(www\.)?(google\.com\/maps\/embed|yandex\.(ru|uz|com)\/map-widget)/.test(v))el.src=v;else $$('[data-live-wrap="map"]').forEach(function(w){w.hidden=true});return}
    el.textContent=v;if(el.tagName!=='A')return;
    if(k==='phone')el.href='tel:'+v.replace(/[^\d+]/g,'');else if(k==='email')el.href='mailto:'+v;else if(k==='social'&&/^https:\/\//.test(v))el.href=v;else el.removeAttribute('href')})}
contactsLive();

addEventListener('storage',function(e){if(e.key===PK||e.key===LK){catalog();news();track();seo()}});
})();
