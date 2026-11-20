(function(){'use strict';
/* panel: ASAPHARM Academy. Эталон Greenwell: заявка с сайта — первой
   строкой, статус из панели виден слушателю на сайте (одно состояние в
   браузере), роли, история. Демо-цифры из одного зерна, сходятся. */
var d=document,$=function(s,r){return(r||d).querySelector(s)},$$=function(s,r){return[].slice.call((r||d).querySelectorAll(s))};
var P=JSON.parse($('#pl').textContent),U=P.ui,app=$('#app');
var LS={get:function(k,f){try{var v=localStorage.getItem(k);return v?JSON.parse(v):f}catch(e){return f}},set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
var esc=function(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
var seed=7,rnd=function(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646};
var SPREAD=/*~*/0.35;

/* Демо-заявки: имена условные, телефоны скрыты. */
var DEMO=P.demo.map(function(n,i){var c=['base','pro','corp','web:3','base','pro'][i%6];return{id:String(900+i),at:Date.now()-(i+1)*(5+Math.floor(rnd()*30))*36e5,name:n,phone:'+998 9'+(i%9)+' *** ** '+(10+i*7),course:c,fmt:i%3?'offline':'online',st:['new','work','done','work','new','no'][i%6],demo:true}});
var dst=LS.get('asa-panel-demo',{});DEMO.forEach(function(x){if(dst[x.id])x.st=dst[x.id]});
var S={tab:0,role:LS.get('asa-role','dir'),f:'all',q:''};
function leads(){return LS.get('asa-leads-1',[]).concat(DEMO)}
function hist(){return LS.get('asa-hist',[])}
function setSt(id,st){var all=LS.get('asa-leads-1',[]),hit=all.filter(function(a){return a.id===id})[0];if(hit){hit.st=st;LS.set('asa-leads-1',all)}else{dst[id]=st;LS.set('asa-panel-demo',dst);DEMO.forEach(function(x){if(x.id===id)x.st=st})}
  var h=hist();h.unshift({at:Date.now(),who:S.role,id:id,st:st});LS.set('asa-hist',h.slice(0,60));draw()}

var I={sum:'<path d="M3 20h18M6 16v-4M11 16V8M16 16v-6M21 16V5"/>',lead:'<path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h5"/>',flow:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',web:'<rect x="2.5" y="6" width="13" height="12" rx="2"/><path d="m15.5 10 6-3.5v11l-6-3.5"/>',hist:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'};
var ic=function(k){return'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+I[k]+'</svg>'};
var KEYS=['sum','lead','flow','web','hist'];
var when=function(t){var dd=new Date(t);return dd.toLocaleDateString(P.l==='uz'?'uz-Latn-UZ':'ru-RU',{day:'numeric',month:'short'})+', '+dd.toTimeString().slice(0,5)};

function login(){app.innerHTML='<div class="lg"><div class="lg-card"><div class="lg-side"><span class="mk"></span><h1>ASAPHARM<br>Academy</h1><p>'+esc(U.title)+'</p></div><form class="lg-f" id="lg" novalidate><h2>'+esc(U.login)+'</h2><p>'+esc(U.loginSub)+' <b>2026</b></p><div class="otp" id="otp">'+[0,1,2,3].map(function(){return'<i></i>'}).join('')+'<input id="code" inputmode="numeric" autocomplete="one-time-code" maxlength="4" aria-label="'+esc(U.code)+'"></div><p class="lg-err" aria-live="polite"></p><button class="pb pb-main" type="submit">'+esc(U.enter)+'</button><a class="pb pb-line" href="'+P.site+'">'+esc(U.toSite)+'</a></form></div><p class="lg-demo">'+esc(U.demo)+' · <a href="'+P.terms+'">'+esc(U.terms)+'</a></p></div>';
  var inp=$('#code'),cells=$$('#otp i');inp.focus();
  inp.addEventListener('input',function(){inp.value=inp.value.replace(/\D/g,'').slice(0,4);cells.forEach(function(c,i){c.textContent=inp.value[i]||'';c.classList.toggle('on',i<inp.value.length)})});
  $('#lg').addEventListener('submit',function(e){e.preventDefault();if(inp.value.length!==4){$('.lg-err').textContent=U.wrong;$('#otp').classList.remove('shake');void $('#otp').offsetWidth;$('#otp').classList.add('shake');return}
    cells.forEach(function(c,i){setTimeout(function(){c.classList.add('ok')},i*90)});setTimeout(function(){try{sessionStorage.setItem('asa-in','1')}catch(x){}draw()},520)})}

function draw(){var all=leads();
  var cnt=function(st){return all.filter(function(a){return a.st===st}).length};
  var head='<header class="ph"><a class="ph-logo" href="'+P.site+'"><span class="mk"></span><b>ASAPHARM</b></a><span class="ph-demo">'+esc(U.demo)+'</span><div class="ph-r"><label class="ph-role">'+esc(U.role)+' <select id="role"><option value="dir"'+(S.role==='dir'?' selected':'')+'>'+esc(U.roles.dir)+'</option><option value="mgr"'+(S.role==='mgr'?' selected':'')+'>'+esc(U.roles.mgr)+'</option></select></label><a class="ph-l" href="'+P.other+'">'+esc(U.other)+'</a><button class="ph-l" type="button" id="out">'+esc(U.logout)+'</button></div></header>';
  var nav='<nav class="pn-nav" aria-label="'+esc(U.title)+'">'+U.nav.map(function(n,i){var badge=i===1&&cnt('new')?'<em>'+cnt('new')+'</em>':'';return'<button type="button" data-t="'+i+'"'+(S.tab===i?' aria-current="page"':'')+'>'+ic(KEYS[i])+'<span>'+esc(n)+'</span>'+badge+'</button>'}).join('')+'</nav>';
  var body='';
  if(S.tab===0){var k=[[U.kNew,cnt('new'),3],[U.kWork,cnt('work'),5],[U.kDone,cnt('done'),4],[U.kWeb,64,48]];
    body='<div class="kpi">'+k.map(function(x){var up=x[1]>=x[2];return'<div class="card k"><p>'+esc(x[0])+'</p><b>'+x[1]+'</b><small class="'+(up?'up':'dn')+'">'+(up?'+':'')+(x[1]-x[2])+' · '+esc(U.prev)+'</small></div>'}).join('')+'</div>';
    var f=[cnt('new')+cnt('work')+cnt('done')+cnt('no'),cnt('work')+cnt('done'),cnt('done')];
    body+='<div class="grid2"><section class="card"><h3>'+esc(U.funnel)+'</h3>'+[U.all,U.st.work,U.st.done].map(function(n,i){return'<div class="fn"><span>'+esc(n)+'</span><i style="transform:scaleX('+(f[i]/Math.max(1,f[0])).toFixed(3)+')"></i><b>'+f[i]+'</b></div>'}).join('')+'</section>';
    body+='<section class="card"><h3>'+esc(U.src)+'</h3>'+(S.role==='dir'?U.srcs.map(function(n,i){var v=Math.round((1-i*SPREAD/1.4)*40);return'<div class="fn"><span>'+esc(n)+'</span><i style="transform:scaleX('+(v/40).toFixed(3)+')"></i><b>'+v+'%</b></div>'}).join(''):'<p class="muted">'+esc(U.srcOnlyDir)+'</p>')+'</section></div>';
    body+=seats()}
  if(S.tab===1){var list=all.filter(function(a){return(S.f==='all'||a.st===S.f)&&(!S.q||(a.name+a.phone).toLowerCase().indexOf(S.q)>-1)});
    body='<div class="bar"><input id="q" type="search" placeholder="'+esc(U.search)+'" value="'+esc(S.q)+'"><div class="chips">'+['all','new','work','done','no'].map(function(s){return'<button type="button" data-f="'+s+'"'+(S.f===s?' aria-pressed="true"':'')+'>'+esc(s==='all'?U.all:U.st[s])+'</button>'}).join('')+'</div></div>';
    body+='<p class="muted">'+esc(U.seenOnSite)+'</p><div class="leads">'+(list.length?list.map(row).join(''):'<p class="muted">'+esc(U.empty)+'</p>')+'</div>'}
  if(S.tab===2)body=seats();
  if(S.tab===3)body='<section class="card"><h3>'+esc(U.webs)+'</h3>'+P.webinars.map(function(w,i){var past=Date.parse(w.d+'T17:00:00+05:00')<Date.now(),n=18+Math.floor(rnd()*30)+(w.free?40:0)+all.filter(function(a){return a.course==='web:'+i}).length;return'<div class="wb'+(past?' past':'')+'"><time>'+esc(w.d.split('-').reverse().slice(0,2).join('.'))+'</time><span>'+esc(w.t)+(w.free?' <em>'+esc(U.free)+'</em>':'')+'</span><b>'+n+' '+esc(U.reg)+'</b>'+(past?'<small>'+esc(U.past)+'</small>':'')+'</div>'}).join('')+'</section>';
  if(S.tab===4){var h=hist();body='<section class="card"><h3>'+esc(U.hist)+'</h3>'+(h.length?h.map(function(x){return'<div class="hs"><time>'+when(x.at)+'</time><b>'+esc(U.who[x.who])+'</b> '+esc(U.did[x.st])+' · №'+esc(x.id)+'</div>'}).join(''):'<p class="muted">'+esc(U.empty)+'</p>')+'</section>'}
  app.innerHTML='<div class="pn-app">'+head+'<div class="pn-main">'+nav+'<main class="pn-body"><h1>'+esc(U.nav[S.tab])+'</h1>'+body+'<p class="muted"><a href="'+P.terms+'">'+esc(U.terms)+'</a></p></main></div></div>';
  bind()}

function seats(){return'<section class="card"><h3>'+esc(U.seats)+'</h3>'+P.courses.map(function(c,i){var cap=i?16:20,taken=(i?9:12)+leads().filter(function(a){return a.course===c.k&&a.st==='done'}).length;return'<div class="seat"><div><b>'+esc(c.t)+'</b><small>'+esc(U.start)+' '+esc(c.start.split('-').reverse().slice(0,2).join('.'))+' · '+c.hours+'</small></div><div class="seat-bar"><i style="transform:scaleX('+Math.min(1,taken/cap).toFixed(3)+')"></i></div><b class="seat-n">'+taken+' '+esc(U.of)+' '+cap+'</b></div>'}).join('')+'</section>'}

function row(a){var acts=a.st==='new'?[['work',U.toWork],['no',U.toNo]]:a.st==='work'?[['done',U.toDone],['no',U.toNo]]:[['new',U.st.new]];
  return'<article class="ld'+(a.demo?'':' fresh')+'"><div class="ld-h"><b>№'+esc(a.id)+' · '+esc(a.name)+'</b><span class="st st-'+a.st+'">'+esc(U.st[a.st])+'</span></div><p class="ld-m">'+(a.demo?'':'<em>'+esc(U.fromSite)+'</em> ')+esc(when(a.at))+' · '+esc(P.names[a.course]||a.course)+' · '+esc(U.fmt[a.fmt]||'')+'</p>'+(a.quiz?'<p class="ld-n">'+esc(U.quiz)+': '+esc(a.quiz)+'</p>':'')+(a.note?'<p class="ld-n">'+esc(U.note)+': '+esc(a.note)+'</p>':'')+'<div class="ld-a"><a class="pb pb-line" href="tel:'+esc(a.phone.replace(/[^\d+]/g,''))+'">'+esc(U.call)+'</a>'+acts.map(function(x){return'<button type="button" class="pb'+(x[0]==='no'?' pb-line':' pb-main')+'" data-id="'+esc(a.id)+'" data-st="'+x[0]+'">'+esc(x[1])+'</button>'}).join('')+'</div></article>'}

function bind(){$$('.pn-nav button').forEach(function(b){b.addEventListener('click',function(){S.tab=+b.dataset.t;draw()})});
  $('#role').addEventListener('change',function(){S.role=this.value;LS.set('asa-role',S.role);draw()});
  $('#out').addEventListener('click',function(){try{sessionStorage.removeItem('asa-in')}catch(x){}login()});
  $$('[data-f]').forEach(function(b){b.addEventListener('click',function(){S.f=b.dataset.f;draw()})});
  var q=$('#q');if(q)q.addEventListener('input',function(){S.q=q.value.toLowerCase();var p=q.selectionStart;draw();var n=$('#q');n.focus();n.setSelectionRange(p,p)});
  $$('[data-st]').forEach(function(b){b.addEventListener('click',function(){setSt(b.dataset.id,b.dataset.st)})})}

addEventListener('storage',function(){if(app.querySelector('.pn-app'))draw()});
var inside=false;try{inside=!!sessionStorage.getItem('asa-in')}catch(x){}
if(inside)draw();else login();
})();
