/* Oson Apteka: поведение сайта. Прокрутку не перехватываем: сцены только
   читают, сколько прошли, и двигают transform и opacity. Состояние демо —
   в браузере: список лекарств oa-list-1, брони oa-bron-1 (их читает панель),
   статусы из панели oa-panel-1, конструктор oa-cfg-1, регион oa-reg-1. */
(function(){
var d=document,w=window,$=function(s,r){return(r||d).querySelector(s)},$$=function(s,r){return[].slice.call((r||d).querySelectorAll(s))};
var D=JSON.parse($('#oa-data').textContent),T=D.t,L=D.l;
var RM=w.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function get(k,def){try{var v=localStorage.getItem(k);return v?JSON.parse(v):def}catch(e){return def}}
function put(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function sum(n){return fmt(n)+' '+T.sum}
function from(n){return(T.from?T.from+' ':'')+sum(n)+(T.fromS?' '+T.fromS:'')}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function cl(v){return v<0?0:v>1?1:v}
var byId={};D.p.forEach(function(p){byId[p.id]=p});
var toastT=0;function toast(m){var t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('on')},2200)}
var ICO={pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',ok:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>',x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="width:18px;height:18px"><path d="M6 6l12 12M18 6 6 18"/></svg>'};

/* Конструктор на первой странице выключает допы: их блоки уходят. */
var cfg=get('oa-cfg-1',{});
function addonOn(id){return cfg[id]!==false}
function applyCfg(){cfg=get('oa-cfg-1',{});$$('[data-addon]').forEach(function(e){e.classList.toggle('off',!addonOn(e.getAttribute('data-addon')))})}
applyCfg();

/* Шапка: прячется при любой прокрутке, возвращается через 3 с после последнего события. */
var top=$('.top'),dock=$('#dock'),IDLE=3000,idleT=0;
function headIdle(){if(!top)return;clearTimeout(idleT);
  if(!top.contains(d.activeElement))top.classList.add('hide');
  idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}

/* Заголовок: слова выезжают по очереди. */
$$('.hero h1 .w>span').forEach(function(s,i){s.style.transitionDelay=(120+i*70)+'ms'});
requestAnimationFrame(function(){$('.hero h1').classList.add('on');$$('.hero .rise').forEach(function(e){e.classList.add('on')})});

/* Появление блоков. */
var io='IntersectionObserver'in w?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'}):null;
$$('.rise,.tilt,.pop,.slide,.chat').forEach(function(e){if(e.closest('.hero'))return;if(io&&!RM)io.observe(e);else e.classList.add('on')});

/* Жидкое стекло и подсветка карточки за курсором. */
d.addEventListener('pointermove',function(e){var g=e.target.closest&&e.target.closest('.glass');if(g){var r=g.getBoundingClientRect();g.style.setProperty('--gx',((e.clientX-r.left)/r.width*100)+'%');g.style.setProperty('--gy',((e.clientY-r.top)/r.height*100)+'%')}
  var c=e.target.closest&&e.target.closest('.card');if(c){var q=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-q.left)+'px');c.style.setProperty('--my',(e.clientY-q.top)+'px')}},{passive:true});

/* Всё, что зависит от прокрутки, считается в одном кадре. */
var velo=$$('.velo .row'),vx=[0,0],lastY=scrollY,speed=0,ticking=false;
var how=$('.how'),stp=$$('.stp'),bars=$$('.how .prog b'),vs=$$('.scr .v',how||d),par=$$('[data-par]');
function frame(){if(ticking)return;ticking=true;requestAnimationFrame(tick)}
function tick(){ticking=false;var y=scrollY,vh=innerHeight;
  speed=speed*.86+(y-lastY)*.14;lastY=y;
  if(y<vh*1.5&&!RM)par.forEach(function(e){var k=+e.getAttribute('data-par');e.style.transform='translate3d(0,'+(y*k).toFixed(1)+'px,0)'});
  if(how&&!RM){var R=how.getBoundingClientRect();if(R.top<vh&&R.bottom>0){var p=cl(-R.top/(R.height-vh)),n=stp.length,st=Math.min(n-1,Math.floor(p*n)),lp=p*n-st;
    stp.forEach(function(c,i){c.classList.toggle('on',i===st)});vs.forEach(function(v,i){v.classList.toggle('on',i===st)});
    bars.forEach(function(b,i){b.style.transform='scaleX('+(i<st?1:i===st?lp:0).toFixed(3)+')'})}}
  if(dock)dock.classList.toggle('hide',y<vh*.6||!!$('.sheet.on'))}
function veloLoop(){if(!RM&&!d.hidden){var v=1+Math.min(6,Math.abs(speed)*.25);velo.forEach(function(r,i){var wd=r.scrollWidth/3;vx[i]=(vx[i]+(i?-1:1)*v*.6)%wd;r.style.transform='translate3d('+(i?vx[i]-wd:-vx[i]).toFixed(1)+'px,0,0)'})}requestAnimationFrame(veloLoop)}
addEventListener('scroll',function(){headIdle();frame()},{passive:true});addEventListener('resize',frame);frame();
if(velo.length)veloLoop();

/* ── Поиск: по названию и действующему веществу, с подсказками ────── */
var q=$('#q'),sug=$('#sug'),cursor=-1;
function norm(s){return String(s||'').toLowerCase().replace(/ё/g,'е').replace(/[‘’ʼ']/g,'')}
function hl(s,qq){if(!qq)return esc(s);var i=norm(s).indexOf(norm(qq));return i<0?esc(s):esc(s.slice(0,i))+'<mark>'+esc(s.slice(i,i+qq.length))+'</mark>'+esc(s.slice(i+qq.length))}
function match(qq){var n=norm(qq).trim();if(!n)return{p:[],i:[]};
  var p=D.p.filter(function(x){return norm(x.n).indexOf(n)>=0||norm(x.s).indexOf(n)>=0});
  var inns={};D.p.forEach(function(x){if(x.inn&&norm(x.inn).indexOf(n)>=0)inns[x.inn]=(inns[x.inn]||[]).concat(x.id)});
  return{p:p,i:Object.keys(inns).map(function(k){return[k,inns[k]]})}}
function showSug(){var v=q.value.trim(),m=match(v);cursor=-1;
  if(!v){sug.classList.remove('on');return}
  var h='';if(m.p.length)h+='<div class="hd">'+T.sugN+'</div>'+m.p.slice(0,6).map(function(x){return'<button type="button" role="option" data-open="'+x.id+'"><img src="'+x.im+'" alt="" width="48" height="48"><span><b>'+hl(x.s,v)+'</b><small>'+esc(x.f)+(x.inn?' · '+esc(x.inn):'')+'</small></span><span class="pr">'+from(x.pr)+'</span></button>'}).join('');
  if(m.i.length)h+='<div class="hd">'+T.sugI+'</div>'+m.i.map(function(a){return'<button type="button" role="option" data-inn="'+esc(a[0])+'"><span><b>'+hl(a[0],v)+'</b><small>'+a[1].map(function(id){return esc(byId[id].s)}).join(', ')+'</small></span></button>'}).join('');
  if(!h)h='<div class="hd">'+T.nothing+'</div>';
  sug.innerHTML=h;sug.classList.add('on')}
if(q){q.addEventListener('input',showSug);q.addEventListener('focus',showSug);
  q.addEventListener('keydown',function(e){var b=$$('button',sug);if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();cursor=(cursor+(e.key==='ArrowDown'?1:-1)+b.length)%b.length;b.forEach(function(x,i){x.classList.toggle('cur',i===cursor)})}
    else if(e.key==='Enter'){e.preventDefault();if(b[cursor])b[cursor].click();else goSearch(q.value)}else if(e.key==='Escape')sug.classList.remove('on')});
  d.addEventListener('click',function(e){if(!e.target.closest('#sbox'))sug.classList.remove('on')});
  sug.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;sug.classList.remove('on');if(b.hasAttribute('data-inn'))goSearch(b.getAttribute('data-inn'));else openP(+b.getAttribute('data-open'))});
  $('#qgo').addEventListener('click',function(){goSearch(q.value)})}
$$('[data-q]').forEach(function(b){b.addEventListener('click',function(){var k=b.getAttribute('data-q');if(/^\d+$/.test(k))openP(+k);else if(k.indexOf('inn:')===0)goSearch(k.slice(4));else if(k.indexOf('atc:')===0){flt.atc=k.slice(4);flt.text='';render();jump()}})});
function jump(){var s=$('#search');if(s)s.scrollIntoView({block:'start'})}
function goSearch(v){flt.text=v.trim();flt.atc='';sug.classList.remove('on');render();jump()}

/* ── Каталог: отпуск, форма, порядок ─────────────────────────────── */
var flt={rx:'all',kinds:{},sort:'pop',text:'',atc:''},grid=$('#grid'),cards=$$('.card',grid);
$$('[data-rx]').forEach(function(b){if(b.tagName!=='BUTTON')return;b.addEventListener('click',function(){flt.rx=b.getAttribute('data-rx');$$('.tabs [data-rx]').forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});render()})});
$$('[data-kind]').forEach(function(b){b.addEventListener('click',function(){var k=b.getAttribute('data-kind');flt.kinds[k]=!flt.kinds[k];b.setAttribute('aria-pressed',flt.kinds[k]?'true':'false');render()})});
$('#sort').addEventListener('change',function(e){flt.sort=e.target.value;render()});
function render(){var any=Object.keys(flt.kinds).some(function(k){return flt.kinds[k]}),n=norm(flt.text),shown=[];
  cards.forEach(function(c){var p=byId[+c.getAttribute('data-id')],ok=(flt.rx==='all'||String(p.rx)===flt.rx)&&(!any||flt.kinds[p.k])&&(!n||norm(p.n).indexOf(n)>=0||norm(p.inn).indexOf(n)>=0)&&(!flt.atc||p.atc.indexOf(flt.atc)===0);c.hidden=!ok;if(ok)shown.push(c)});
  shown.sort(function(a,b){var x=byId[+a.getAttribute('data-id')],y=byId[+b.getAttribute('data-id')];return flt.sort==='cheap'?x.pr-y.pr:flt.sort==='name'?x.s.localeCompare(y.s):x.id-y.id}).forEach(function(c){grid.appendChild(c)});
  $('#found').textContent=shown.length?T.found+': '+shown.length+(flt.text?' · «'+flt.text+'»':''):T.nothing}
render();

/* ── Демо-аптеки: из одного зерна, подписаны «демо» ───────────────── */
var reg=get('oa-reg-1',{d:8});
function rnd(s0){var z=s0;return function(){z=(z*16807)%2147483647;return z/2147483647}}
function pharmacies(pid,di){var r=rnd(1000+di*97+(pid||0)*13),n=3+Math.floor(r()*3),out=[];
  for(var i=0;i<n;i++)out.push({id:di*10+i,n:T.apt+' '+(di*10+i+1)+' · '+T.demo,dist:Math.round((.3+i*.7+r()*.6)*10)/10,h:r()>.75?T.allday:T.open,upd:Math.ceil(r()*25),d:D.dist[di]});
  return out}
function phRow(x,pid){return'<div class="phr"><div><b>'+esc(x.n)+'</b><br><small>'+esc(x.d)+' · '+x.dist+' '+T.km+' · <span class="open">'+x.h+'</span></small><br><span class="sync" data-addon="erp">'+T.upd+' '+x.upd+' '+T.minAgo+'</span></div><div></div>'+
  '<div class="acts">'+(pid!=null?'<button type="button" class="btn btn-a" data-addon="bron" data-bron="'+pid+'" data-ph="'+x.id+'" data-phn="'+esc(x.n)+'">'+T.bron+'</button>':'')+'<a class="btn btn-g" href="https://yandex.uz/maps/?text='+encodeURIComponent((L==='ru'?'аптека ':'dorixona ')+x.d+' Toshkent')+'" target="_blank" rel="noopener">'+T.route+'</a></div></div>'}

/* ── Окно ─────────────────────────────────────────────────────────── */
var sheet=$('#sheet'),lastFocus=null;
function openSheet(h,b,f){lastFocus=d.activeElement;$('#shh').textContent=h;$('#shb').innerHTML=b;$('#shf').innerHTML=f||'';$('#shf').style.display=f?'':'none';sheet.classList.add('on');applyCfg();$('#shb').scrollTop=0;setTimeout(function(){$('.x',sheet).focus()},50);frame()}
function closeSheet(){sheet.classList.remove('on');if(lastFocus)lastFocus.focus();frame()}
sheet.addEventListener('click',function(e){if(e.target.closest('[data-close]'))closeSheet()});
d.addEventListener('keydown',function(e){if(e.key==='Escape'&&sheet.classList.contains('on'))closeSheet()});

function analogs(p){var same=D.p.filter(function(x){return x.id!==p.id&&p.inn&&x.inn===p.inn}),kind='inn';
  if(!same.length){same=D.p.filter(function(x){return x.id!==p.id&&x.atc.slice(0,4)===p.atc.slice(0,4)});kind='atc'}
  return{list:same,kind:kind}}
function openP(id){var p=byId[id];if(!p)return;var a=analogs(p),phs=pharmacies(id,reg.d);
  var sec=Object.keys(p.sec||{}).map(function(k){return'<details><summary>'+esc(k)+'</summary><p>'+esc(p.sec[k])+'</p></details>'}).join('');
  var b='<div class="pd"><div class="pic"><img src="'+p.im+'" alt="'+esc(p.n)+'"></div>'+
  '<div><span class="badge '+(p.rx?'b-rx':'b-otc')+'">'+(p.rx?T.rx:T.otc)+'</span><div class="h4" style="margin-top:8px">'+from(p.pr)+' <small class="mu" style="font:400 12px var(--bd)">'+T.fromAll+'</small></div>'+(p.cnt>1?'<div class="unitp" data-addon="unit">≈ '+sum(Math.round(p.pr/p.cnt))+' '+T.unit+'</div>':'')+'</div>'+
  '<dl class="dl">'+(p.inn?'<dt>'+T.inn+'</dt><dd>'+esc(p.inn)+'</dd>':'')+'<dt>'+T.form+'</dt><dd>'+esc(p.f)+'</dd><dt>'+T.brand+'</dt><dd>'+esc(p.b)+'</dd><dt>'+T.maker+'</dt><dd>'+esc(p.m)+'</dd><dt>'+T.atc+'</dt><dd>'+esc(p.atc)+(p.an?' · '+esc(p.an):'')+'</dd></dl>'+
  '<p class="note" style="margin:0">'+(p.rx?T.warnRx:T.warn)+'</p>'+
  '<div class="h4">'+T.near+' · '+esc(D.dist[reg.d])+'</div><p class="mu" style="margin:0;font-size:14px">'+T.nearHint+'</p><div class="ph-list">'+phs.map(function(x){return phRow(x,id)}).join('')+'</div>'+
  '<div class="h4">'+T.analogs+'</div><p class="mu" style="margin:0;font-size:14px">'+(a.list.length?(a.kind==='inn'?T.analogsInn:T.analogsAtc):T.analogsNo)+'</p>'+(a.list.length?'<div class="an">'+a.list.map(function(x){return'<button type="button" data-open="'+x.id+'"><img src="'+x.im+'" alt=""><b>'+esc(x.s)+'</b><small class="mu">'+from(x.pr)+'</small>'+(x.cnt>1?'<small class="unitp" data-addon="unit">≈ '+sum(Math.round(x.pr/x.cnt))+' '+T.unit+'</small>':'')+'</button>'}).join('')+'</div>':'')+
  '<div class="hero-act" style="margin:0"><button type="button" class="btn btn-g btn-s" data-notify="'+id+'" data-addon="notify">'+T.notify+'</button><button type="button" class="btn btn-g btn-s" data-watch="'+id+'" data-addon="watch">'+T.watch+'</button></div>'+'<div class="h4">'+T.instr+'</div><div class="acc">'+(sec||'<p class="mu" style="font-size:14px">'+T.instrNone+'</p>')+'</div><a class="btn btn-g" href="'+p.u+'" target="_blank" rel="noopener">'+T.instrFull+'</a></div>';
  openSheet(p.s,b,'<button type="button" class="btn btn-g" data-add="'+id+'">'+(inList(id)?T.inList:T.add)+'</button><button type="button" class="btn btn-a" data-scroll-ph>'+T.near+'</button>')}
d.addEventListener('click',function(e){var o=e.target.closest('[data-open]');if(o&&!o.closest('.sug')){openP(+o.getAttribute('data-open'));return}
  var s=e.target.closest('[data-scroll-ph]');if(s){var l=$('.ph-list',sheet);if(l)l.scrollIntoView({block:'start'})}});

/* ── Список лекарств ──────────────────────────────────────────────── */
var lst=get('oa-list-1',[]);
function inList(id){return lst.indexOf(id)>=0}
function saveList(){put('oa-list-1',lst);paintList()}
function paintList(){$('#listn').textContent=lst.length||'';
  $$('.card [data-add]').forEach(function(b){var on=inList(+b.getAttribute('data-add'));b.setAttribute('aria-pressed',on?'true':'false')});
  var r=$('#lrows');if(r)r.innerHTML=lst.length?lst.map(function(id){var p=byId[id];return'<div class="lrow"><img src="'+p.im+'" alt=""><span><b>'+esc(p.s)+'</b><br><small class="mu">'+from(p.pr)+'</small></span><button type="button" data-rm="'+id+'" aria-label="'+T.close+'">'+ICO.x+'</button></div>'}).join(''):'<p class="lempty">'+T.lEmpty+'</p>'}
d.addEventListener('click',function(e){var a=e.target.closest('[data-add]');if(a&&a.tagName==='BUTTON'){var id=+a.getAttribute('data-add');if(inList(id))lst=lst.filter(function(x){return x!==id});else{lst.push(id);toast(T.added)}saveList();if(a.closest('.sheet'))a.textContent=inList(id)?T.inList:T.add}
  var rm=e.target.closest('[data-rm]');if(rm){lst=lst.filter(function(x){return x!==+rm.getAttribute('data-rm')});saveList();$('#cov').innerHTML=''}});
function coverage(){var cov=$('#cov');if(!lst.length){toast(T.lNone);return}
  var all=[];for(var i=0;i<D.dist.length;i++)pharmacies(lst[0],i).forEach(function(x){var r=rnd(x.id*31+lst.length*7),has=lst.filter(function(){return r()>.22}).length;if(lst.length===1)has=1;all.push({x:x,has:Math.max(1,has)})});
  all.sort(function(a,b){return b.has-a.has||a.x.dist-b.x.dist});
  cov.innerHTML=all.slice(0,5).map(function(o){var full=o.has===lst.length;return'<div class="cv pop on"><span>'+ICO.pin+'</span><b>'+esc(o.x.n)+'<br><small class="mu">'+esc(o.x.d)+' · '+o.x.dist+' '+T.km+'</small></b><span class="badge '+(full?'b-otc':'b-rx')+'">'+(full?T.lFound:o.has+' '+T.lOf+' '+lst.length)+'</span><span class="bar"><i style="transform:scaleX('+(o.has/lst.length)+')"></i></span></div>'}).join('');applyCfg()}
$('#lgo').addEventListener('click',coverage);
function openList(){var s=$('#list');if(s)s.scrollIntoView({block:'start'})}
$('#listb').addEventListener('click',openList);var dl=$('#dockl');if(dl)dl.addEventListener('click',openList);
paintList();

/* ── Карта районов ────────────────────────────────────────────────── */
var mp=$('#mpins');
function paintDist(){var di=reg.d;$$('#dlist [data-d]').forEach(function(b){b.setAttribute('aria-pressed',+b.getAttribute('data-d')===di?'true':'false')});
  $$('.tmap .dz').forEach(function(p){p.classList.toggle('on',+p.getAttribute('data-d')===di)});
  var poly=$('.tmap .dz[data-d="'+di+'"]');if(poly&&mp){var pts=poly.getAttribute('points').split(' ').map(function(s){return s.split(',').map(Number)}),cx=0,cy=0;pts.forEach(function(p){cx+=p[0];cy+=p[1]});cx/=6;cy/=6;
    var r=rnd(di+5),h='';for(var i=0;i<4;i++){var x=cx+(r()-.5)*60,y=cy+(r()-.5)*50;h+='<g transform="translate('+x.toFixed(0)+' '+y.toFixed(0)+') scale(.55)"><g class="pin"><path d="M0 0c-10-10-16-17-16-24a16 16 0 0 1 32 0c0 7-6 14-16 24Z" fill="#3873D3"/><circle cx="0" cy="-24" r="10" fill="#fff"/><path d="M-2 -30h4v4h4v4h-4v4h-4v-4h-4v-4h4z" fill="#EC3E34"/></g></g>'}mp.innerHTML=h}
  var l=$('#dph');if(l)l.innerHTML=pharmacies(null,di).slice(0,3).map(function(x){return phRow(x,null)}).join('');
  var rn=$('#regn');if(rn)rn.textContent=D.regs[0]+', '+D.dist[di];applyCfg()}
$$('[data-d]').forEach(function(b){b.addEventListener('click',function(){reg.d=+b.getAttribute('data-d');put('oa-reg-1',reg);paintDist()})});
paintDist();
var rb=$('#regb');if(rb)rb.addEventListener('click',function(){openSheet(T.regTitle,'<div class="dlist">'+D.dist.map(function(x,i){return'<button type="button" data-rd="'+i+'" aria-pressed="'+(i===reg.d)+'">'+esc(D.regs[0])+', '+esc(x)+'</button>'}).join('')+'</div><p class="mu" style="font-size:14px">'+D.regs.slice(1).map(esc).join(' · ')+'</p>')});
d.addEventListener('click',function(e){var b=e.target.closest('[data-rd]');if(!b)return;reg.d=+b.getAttribute('data-rd');put('oa-reg-1',reg);paintDist();closeSheet()});

/* ── Бронь: ложится в браузер, панель видит её первой строкой ───────── */
function brons(){return get('oa-bron-1',[])}
function stOf(o){var s=get('oa-panel-1',{}).st||{};return s[o.id]!==undefined?s[o.id]:0}
d.addEventListener('click',function(e){var b=e.target.closest('[data-bron]');if(!b)return;var pid=+b.getAttribute('data-bron'),p=byId[pid],phn=b.getAttribute('data-phn');
  var body='<div class="pd"><div class="lrow"><img src="'+p.im+'" alt=""><span><b>'+esc(p.s)+'</b><br><small class="mu">'+esc(phn)+' · '+from(p.pr)+'</small></span></div><p class="mu" style="margin:0;font-size:14px">'+T.hold+'</p>'+
  '<label class="fld"><span>'+T.name+'</span><input id="bn" autocomplete="name"></label><label class="fld"><span>'+T.phone+'</span><input id="bp" type="tel" inputmode="tel" autocomplete="tel" value="+998 "></label>'+
  '<div class="pays" data-addon="pay"><label><input type="radio" name="bpay" value="cash" checked> '+T.payCash+'</label><label><input type="radio" name="bpay" value="Payme"> Payme</label><label><input type="radio" name="bpay" value="Click"> Click</label><label><input type="radio" name="bpay" value="Uzum"> Uzum</label></div>'+
  (p.rx?'<p class="note" style="margin:0">'+T.warnRx+'</p>':'')+'</div>';
  openSheet(T.bron,body,'<button type="button" class="btn btn-a" id="bgo" data-pid="'+pid+'" data-phn="'+esc(phn)+'">'+T.bron+'</button>')});
d.addEventListener('click',function(e){var b=e.target.closest('#bgo');if(!b)return;var n=$('#bn').value.trim(),ph=$('#bp').value.trim();if(!n||ph.replace(/\D/g,'').length<9){toast(T.need);return}
  var pay=($('input[name=bpay]:checked')||{}).value||'cash',all=brons(),id=5001+all.length;
  all.unshift({id:id,at:Date.now(),n:n,ph:ph,pid:+b.getAttribute('data-pid'),phn:b.getAttribute('data-phn'),d:D.dist[reg.d],pay:pay});put('oa-bron-1',all);
  openSheet(T.ok,'<div class="okk">'+ICO.ok+'<b class="h4">'+T.order+' №'+id+'</b><p class="mu">'+T.okp+'</p></div>','<button type="button" class="btn btn-g" data-close>'+T.close+'</button><a class="btn btn-a" href="'+D.panel+'#brons">'+T.panel+'</a>');paintMine()});
function paintMine(){var m=$('#mine'),all=brons();if(m)m.classList.toggle('on',all.length>0)}
function mine(){var all=brons();openSheet(T.mine,all.length?all.map(function(o){var s=stOf(o),p=byId[o.pid];return'<div class="lbox" style="margin-bottom:12px"><div class="lrow"><img src="'+p.im+'" alt=""><span><b>'+T.order+' №'+o.id+' · '+esc(p.s)+'</b><br><small class="mu">'+esc(o.phn)+' · '+esc(o.d)+'</small></span></div><div class="stl">'+[0,1,2].map(function(k){return'<span class="'+(s===3?'':s>k?'done':s===k?'cur':'')+'">'+T.st[k]+'</span>'}).join('')+'</div>'+(s===3?'<div class="stl"><span class="x" style="grid-column:1/-1">'+T.st[3]+'</span></div>':'')+'</div>'}).join(''):'<p class="mu">'+T.none+'</p>','<a class="btn btn-a" href="'+D.panel+'#brons">'+T.panel+'</a>')}
var mb=$('#mine');if(mb)mb.addEventListener('click',mine);
paintMine();
addEventListener('storage',function(e){if(e.key==='oa-panel-1'&&sheet.classList.contains('on')&&$('#shh').textContent===T.mine)mine();if(e.key==='oa-cfg-1')applyCfg();if(e.key==='oa-bron-1')paintMine()});

/* ── Тарифы: покупателю и аптеке ──────────────────────────────────── */
var TB=D.tf.b,TP=D.tf.p;
$$('[data-tf]').forEach(function(b){b.addEventListener('click',function(){var k=b.getAttribute('data-tf');$$('[data-tf]').forEach(function(x){var on=x===b;x.setAttribute('aria-pressed',on?'true':'false');x.setAttribute('aria-selected',on?'true':'false')});$('#tf-b').classList.toggle('on',k==='b');$('#tf-p').classList.toggle('on',k==='p');tCalc()})});
function rowH(a,b){return'<div class="row"><span>'+a+'</span><span>'+b+'</span></div>'}
function tCalc(){var out=$('#tsum');if(!out)return;
  if($('#tf-b').classList.contains('on')){var ord=+$('#ord').value,chk=+$('#chk').value,get1=($('input[name=get]:checked')||{}).value||'bron';$('#ordv').textContent=ord;$('#chkv').textContent=sum(chk);
    var z=TB.zones.filter(function(x){return x.id===get1})[0],per=z?z.price:0,fast=z&&$('#fast').checked?TB.fast:0,plus=$('#plus').checked;
    if(!z)$('#fast').checked=false;
    var dl=(per+fast)*ord,free=plus&&chk>=TB.plus.free?per*ord:0,tot=dl-free+(plus?TB.plus.price:0);
    out.innerHTML=rowH(z?T.tb.deliv+', '+T.tb.per:T.tb.bron,z?sum(per+fast):T.tb.free)+(plus?rowH(T.tb.plus,sum(TB.plus.price))+(free?rowH(T.tb.save,'−'+sum(free)):''):'')+'<div class="tot"><span>'+T.tb.pay+'<br><small class="mu">'+T.tb.month+'</small></span><b>'+(tot?sum(tot):T.tb.free)+'</b></div>'}
  else{var bn=+$('#brn').value,pc=+$('#pchk').value;$('#brnv').textContent=bn;$('#pchkv').textContent=sum(pc);
    var t=TP.base.price,h=rowH(T.tp.base,sum(TP.base.price));
    $$('[data-o]').forEach(function(c){if(!c.checked||c.closest('.off'))return;var o=TP.opts.filter(function(x){return x.id===c.getAttribute('data-o')})[0],v=o.per==='pct'?bn*pc*o.fee/100:o.per==='order'?o.price*Math.round(bn*.3):o.price;t+=v;h+=rowH(esc(o[L]),sum(v))});
    out.innerHTML=h+rowH(T.tp.sales,sum(bn*pc))+'<div class="tot"><span>'+T.tp.month+'<br><small class="mu">'+T.tp.first+'</small></span><b>'+sum(t)+'</b></div>'}}
$$('#tarif input').forEach(function(i){i.addEventListener('input',tCalc);i.addEventListener('change',tCalc)});
tCalc();

/* ── Допы второго захода ─────────────────────────────────────────── */
d.addEventListener('click',function(e){var n=e.target.closest('[data-notify]');if(n){var w=get('oa-watch-1',{});w['n'+n.getAttribute('data-notify')]=Date.now();put('oa-watch-1',w);toast(T.notified)}
  var wt=e.target.closest('[data-watch]');if(wt){var w2=get('oa-watch-1',{}),r=$('#wr');w2['w'+wt.getAttribute('data-watch')]=r&&!wt.closest('.sheet')?+r.value:byId[+wt.getAttribute('data-watch')].pr;put('oa-watch-1',w2);toast(T.watched)}
  var ak=e.target.closest('[data-ask]');if(ak){var c=$('#askc'),q=d.createElement('p'),a=d.createElement('p');q.className='me';q.textContent=ak.textContent;a.className='bt';a.textContent=T.ask[ak.getAttribute('data-ask')];c.appendChild(q);setTimeout(function(){c.appendChild(a)},RM?0:500)}});
var wr=$('#wr');if(wr)wr.addEventListener('input',function(){$('#wv').textContent=sum(+wr.value)});
var rxf=$('#rxf');if(rxf)rxf.addEventListener('change',function(){var f=rxf.files&&rxf.files[0];if(!f)return;var im=$('#rxi');im.src=URL.createObjectURL(f);im.hidden=false;$('#rxl').hidden=true;$('#rxgo').disabled=false});
var rxg=$('#rxgo');if(rxg)rxg.addEventListener('click',function(){toast(T.rxSent)});
function adCalc(){var o=$('#ado');if(!o)return;var w=+$('#adw').value,m=+($('input[name=adf]:checked')||{}).value;$('#adwv').textContent=w;o.innerHTML=T.adSum+': '+sum(Math.round(m*w/4/1000)*1000)+'<br><small>'+esc($('#adr').selectedOptions[0].textContent)+' · '+T.adHint+'</small>'}
['#adw','#adr'].forEach(function(s){var e=$(s);if(e){e.addEventListener('input',adCalc);e.addEventListener('change',adCalc)}});$$('input[name=adf]').forEach(function(r){r.addEventListener('change',adCalc)});adCalc();

/* ── Напоминания ──────────────────────────────────────────────────── */
var rm=$('#rout');
function remCalc(){if(!rm)return;var tm=$$('[data-tm][aria-pressed="true"]').map(function(b){return b.getAttribute('data-tm')}),days=Math.max(1,+$('#rdays').value||1),end=new Date(Date.now()+(days-2)*864e5);
  rm.innerHTML=T.rem.at+' '+(tm.length?tm.join(', '):'08:00')+'<br>'+T.rem.buy+' '+end.toLocaleDateString(L==='ru'?'ru-RU':'uz-UZ',{day:'numeric',month:'long'})}
$$('[data-tm]').forEach(function(b){b.addEventListener('click',function(){b.setAttribute('aria-pressed',b.getAttribute('aria-pressed')==='true'?'false':'true');remCalc()})});
var rd=$('#rdays');if(rd)rd.addEventListener('input',remCalc);var rmd=$('#rmed');if(rmd)rmd.addEventListener('change',remCalc);
remCalc();
})();
