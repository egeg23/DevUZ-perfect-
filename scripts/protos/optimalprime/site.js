/* Optimal Prime: поведение сайта. Прокрутку не перехватываем: сцены только
   читают, сколько прошли, и двигают transform и opacity. Состояние демо —
   в браузере: заявки op-req-1 (их читает панель), статусы из панели
   op-panel-1, конструктор DevUz op-cfg-1, тариф op-tf-1. */
(function(){
var d=document,w=window,$=function(s,r){return(r||d).querySelector(s)},$$=function(s,r){return[].slice.call((r||d).querySelectorAll(s))};
var D=JSON.parse($('#op-data').textContent),T=D.t,U=D.unit;
var RM=w.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function get(k,def){try{var v=localStorage.getItem(k);return v?JSON.parse(v):def}catch(e){return def}}
function put(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function sum(n){return fmt(n)+' '+T.sum}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function cl(v){return v<0?0:v>1?1:v}
function tgUrl(text){return'https://t.me/'+D.tg+'?text='+encodeURIComponent(text)}
var toastT=0;function toast(m){var t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('on')},2400)}

/* Конструктор на первой странице выключает допы: их блоки уходят. */
var cfg=get('op-cfg-1',{});
function addonOn(id){return cfg[id]!==false}
function applyCfg(){cfg=get('op-cfg-1',{});$$('[data-addon]').forEach(function(e){e.classList.toggle('off',!addonOn(e.getAttribute('data-addon')))})}
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
$$('.rise,.tilt,.pop,.slide,.flip,.stack,.chat').forEach(function(e){if(e.closest('.hero'))return;if(io&&!RM)io.observe(e);else e.classList.add('on')});

/* Жидкое стекло: блик рамки за пальцем. */
d.addEventListener('pointermove',function(e){var g=e.target.closest&&e.target.closest('.glass');if(!g)return;var r=g.getBoundingClientRect();g.style.setProperty('--gx',((e.clientX-r.left)/r.width*100)+'%');g.style.setProperty('--gy',((e.clientY-r.top)/r.height*100)+'%')},{passive:true});

/* Всё, что зависит от прокрутки, считается в одном кадре. */
var rows=$$('.velo .row,.cls .row'),vx=rows.map(function(){return 0}),lastY=scrollY,speed=0,ticking=false;
var par=$$('[data-par]'),curt=$$('.cvn'),steps=$('#steps'),stp=$$('.step');
function frame(){if(ticking)return;ticking=true;requestAnimationFrame(tick)}
function tick(){ticking=false;var y=scrollY,vh=innerHeight;
  speed=speed* /*~*/.86+(y-lastY)* /*~*/.14;lastY=y;
  if(y<vh*1.5&&!RM)par.forEach(function(e){var k=+e.getAttribute('data-par');e.style.transform='translate3d(0,'+(y*k).toFixed(1)+'px,0)'});
  /* Переход между разделами: золотая полоса тянется, пока раздел входит в кадр. */
  curt.forEach(function(s){var r=s.getBoundingClientRect();if(r.top<vh&&r.bottom>0)s.style.setProperty('--cv',RM?1:cl((vh-r.top)/(vh* /*~*/.75)).toFixed(3))});
  if(steps){var R=steps.getBoundingClientRect(),p=RM?1:cl((vh* /*~*/.8-R.top)/(R.height+vh*.2));steps.style.setProperty('--sp',p.toFixed(3));stp.forEach(function(s,i){s.classList.toggle('on',p>=i/stp.length+.02)})}
  if(dock)dock.classList.toggle('hide',y<vh*.6||!!$('.sheet.on'))}
function veloLoop(){if(!RM&&!d.hidden){var v=1+Math.min(6,Math.abs(speed)*.25);rows.forEach(function(r,i){var rev=i%2,wd=r.scrollWidth/3;vx[i]=(vx[i]+(rev?-1:1)*v*.5)%wd;r.style.transform='translate3d('+(rev?vx[i]-wd:-vx[i]).toFixed(1)+'px,0,0)'})}requestAnimationFrame(veloLoop)}
addEventListener('scroll',function(){headIdle();frame()},{passive:true});addEventListener('resize',frame);frame();
if(rows.length)veloLoop();

/* ── Услуги вкладками ───────────────────────────────────────────── */
$$('[data-svc]').forEach(function(b){b.addEventListener('click',function(){var id=b.getAttribute('data-svc');
  $$('[data-svc]').forEach(function(x){x.setAttribute('aria-selected',x===b)});$$('.svc-p').forEach(function(p){p.classList.toggle('on',p.id==='svc-'+id)})})});

/* ── Тайна зарплат: кто видит ведомость ─────────────────────────── */
var pay=$('#payroll');if(pay)$$('[data-who]',pay).forEach(function(b){b.addEventListener('click',function(){$$('[data-who]',pay).forEach(function(x){x.setAttribute('aria-pressed',x===b)});pay.classList.toggle('open',b.getAttribute('data-who')==='out')})});

/* ── Конструктор тарифа: режим, ползунки, допуслуги ─────────────── */
var TF=get('op-tf-1',{rg:'osn'}),RG={};D.rg.forEach(function(r){RG[r.id]=r});
if(!RG[TF.rg])TF={rg:'osn'};
var S=['bank','acc','emp','fx'],once={};
function regime(){return RG[TF.rg]}
function setRegime(id,keep){TF.rg=id;var r=regime();if(!keep||!TF.v){TF.v={};S.forEach(function(k){TF.v[k]=r.def[k]})}if(!keep||!TF.o)TF.o={};
  S.forEach(function(k){var i=$('#s-'+k);if(i)i.value=TF.v[k]});
  var bs=$$('[data-rg]');bs.forEach(function(b,i){var on=b.getAttribute('data-rg')===id;b.setAttribute('aria-pressed',on);if(on)$('.rgtabs .pill').style.setProperty('--i',i)});
  var fx=$('#rgfix');if(fx)fx.innerHTML=r.fixed.map(function(f){return'<label class="opt"><input type="checkbox" checked disabled><span class="sw"></span><span class="ot"><b>'+esc(f.n)+'</b></span><span class="op">'+sum(f.p)+'</span></label>'}).join('')+
    r.opt.map(function(o){return'<label class="opt"><input type="checkbox" data-op="'+o.id+'"'+(TF.o[o.id]===false?'':' checked')+'><span class="sw"></span><span class="ot"><b>'+esc(o.n)+'</b></span><span class="op">'+sum(o.p)+'</span></label>'}).join('');
  $$('[data-op]').forEach(function(c){c.addEventListener('change',function(){TF.o[c.getAttribute('data-op')]=c.checked;calc()})});
  calc()}
function lines(){var r=regime(),v=TF.v,emp=v.emp<=U.empMinN?U.empMin:v.emp*U.emp,L=[
  {k:'bank',n:T.bank+' · '+v.bank+' '+T.ops,p:v.bank*U.bank},{k:'acc',n:T.acc+' · '+v.acc+' '+T.ops,p:v.acc*U.acc},{k:'emp',n:T.emp+' · '+v.emp+' '+T.ppl,p:emp}];
  if(v.fx)L.push({k:'fx',n:T.fx+' · '+v.fx+' '+T.ops,p:v.fx*U.fx});
  r.fixed.forEach(function(f){L.push({n:f.n,p:f.p})});r.opt.forEach(function(o){if(TF.o[o.id]!==false)L.push({n:o.n,p:o.p})});return L}
function monthly(){return lines().reduce(function(a,x){return a+x.p},0)}
/* Ползунок не на пороге их пакета — это наш пересчёт по их цене за единицу. */
function extra(k){var r=regime(),v=TF.v[k];return v!==r.def[k]}
function calc(){var r=regime();if(!r)return;put('op-tf-1',TF);
  S.forEach(function(k){var b=$('#v-'+k),x=$('#x-'+k);if(b)b.textContent=TF.v[k];if(x)x.textContent=extra(k)?T.ex:''});
  $('#trg').textContent=T.reg+': '+r.n+' · '+r.d;
  var L=lines(),m=monthly(),o=0,ol=[];D.once.forEach(function(x){if(once[x.id]){o+=x.p;ol.push(x.n)}});
  $('#tsum').innerHTML=L.map(function(x){return'<div class="row'+(x.k&&extra(x.k)?' x':'')+'"><span>'+esc(x.n)+'</span><b>'+sum(x.p)+'</b></div>'}).join('')+
    '<div class="tot"><span>'+T.tot+'</span><span><b>'+fmt(m)+'</b><small>'+T.sum+' / '+T.month+'</small></span></div>'+(o?'<p class="one">'+T.plusOnce+': <b>'+(ol.some(function(n){return D.once.filter(function(x){return x.n===n&&x.from}).length})?T.from+' ':'')+sum(o)+'</b> · '+esc(ol.join(', '))+'</p>':'');
  staff()}
S.forEach(function(k){var i=$('#s-'+k);if(i)i.addEventListener('input',function(){TF.v[k]=+i.value;calc()})});
$$('[data-rg]').forEach(function(b){b.addEventListener('click',function(){setRegime(b.getAttribute('data-rg'))})});
$$('[data-once]').forEach(function(c){c.addEventListener('change',function(){once[c.getAttribute('data-once')]=c.checked;calc()})});
function reqs(){return get('op-req-1',[])}
function addReq(o){var a=reqs();o.id=3001+a.length;o.at=Date.now();a.unshift(o);put('op-req-1',a);mine();return o}
var send=$('#tsend');if(send)send.addEventListener('click',function(){var r=regime(),m=monthly(),txt=lines().map(function(x){return x.n+': '+sum(x.p)}).join('; ');
  var o=addReq({co:'«'+T.demo+'»',ph:'',regime:r.id,sum:m,src:'src_calc',kind:'',calc:txt});
  toast(T.sent);w.open(tgUrl(T.hello+'\n'+r.n+', '+fmt(m)+' '+T.sum+' / '+T.month+'\n'+txt+'\n'+T.no+' №'+o.id),'_blank','noopener')});

/* ── Доп: бухгалтер в штате или мы ──────────────────────────────── */
function staff(){var s=$('#st-sal');if(!s)return;var sal=+s.value,tx=+$('#st-tax').value,pl=+$('#st-pl').value,inh=sal*(1+tx/100)+pl,us=monthly(),mx=Math.max(inh,us);
  $('#st-salv').textContent=sum(sal);$('#st-taxv').textContent=tx+'%';$('#st-plv').textContent=sum(pl);
  $('#bin').textContent=sum(inh);$('#bus').textContent=sum(us);$('#bini').style.setProperty('--b',(inh/mx).toFixed(3));$('#busi').style.setProperty('--b',(us/mx).toFixed(3));
  var v=$('#tvs');if(v)v.innerHTML=T.vs+': <b>'+sum(inh)+'</b><br>'+(inh>=us?T.vsLess+': <b>'+sum(inh-us)+'</b>':T.vsMore+' <b>'+sum(us-inh)+'</b>')}
['#st-sal','#st-tax','#st-pl'].forEach(function(s){var i=$(s);if(i)i.addEventListener('input',staff)});
setRegime(TF.rg,!!TF.v);

/* ── Доп: кабинет клиента и первичка ────────────────────────────── */
var cabb=$('#cabb');function cab(k){if(!cabb)return;$$('[data-cab]').forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-cab')===k)});
  cabb.innerHTML=T.cab[k].map(function(x){return'<div class="cab-r"><span>'+esc(x[0])+'</span><span class="chip '+x[2]+'">'+esc(x[1])+'</span></div>'}).join('')}
$$('[data-cab]').forEach(function(b){b.addEventListener('click',function(){cab(b.getAttribute('data-cab'))})});cab('rep');
var upf=$('#upf');if(upf)upf.addEventListener('change',function(){if(upf.files&&upf.files.length)toast(T.up);upf.value=''});

/* ── Доп: налоговый календарь по режиму ─────────────────────────── */
var calv=$('#calv');function calr(id){if(!calv)return;var bs=$$('[data-crg]');bs.forEach(function(b,i){var on=b.getAttribute('data-crg')===id;b.setAttribute('aria-pressed',on);if(on)$('#calrg .pill').style.setProperty('--i',i)});
  calv.innerHTML=T.cal[id].map(function(x){return'<div class="pop on"><time>'+x[0]+'<small>'+x[1]+'</small></time><span><b>'+esc(x[2])+'</b><span>'+esc(x[3])+'</span></span></div>'}).join('')}
$$('[data-crg]').forEach(function(b){b.addEventListener('click',function(){calr(b.getAttribute('data-crg'))})});calr('osn');

/* ── Доп: проверка учёта, семь вопросов ─────────────────────────── */
var qz=$('#quiz'),Q=T.quiz,qi=0,qa=[];
function quiz(){if(!qz)return;if(qi<Q.q.length){qz.innerHTML='<div class="qn">'+Q.ql+' '+(qi+1)+' '+Q.of+' '+Q.q.length+'</div><div class="qb"><i style="--qp:'+(qi/Q.q.length)+'"></i></div><h3>'+esc(Q.q[qi])+'</h3><div class="qa"><button type="button" data-qa="1">'+Q.yes+'</button><button type="button" data-qa="0">'+Q.no+'</button></div>';
    $$('[data-qa]',qz).forEach(function(b){b.addEventListener('click',function(){qa[qi]=+b.getAttribute('data-qa');qi++;quiz()})});return}
  var r=Q.r.filter(function(x,i){return qa[i]});
  qz.innerHTML='<div class="qb"><i style="--qp:1"></i></div><h3>'+Q.res+'</h3>'+(r.length?'<ul>'+r.map(function(x){return'<li>'+esc(x)+'</li>'}).join('')+'</ul>':'<p>'+Q.ok+'</p>')+'<div class="qa"><a class="btn btn-a" href="'+tgUrl(Q.msg)+'" target="_blank" rel="noopener" id="qbook">'+Q.book+'</a><button type="button" id="qagain">'+Q.again+'</button></div>';
  $('#qbook').addEventListener('click',function(){addReq({co:'«'+T.demo+'»',ph:'',regime:TF.rg,sum:monthly(),src:'src_check',kind:Q.book,calc:r.join(' ')})});
  $('#qagain').addEventListener('click',function(){qi=0;qa=[];quiz()})}
quiz();

/* ── Связь: заявка ложится в панель и открывает их Telegram ─────── */
var cf=$('#cf');if(cf)cf.addEventListener('submit',function(e){e.preventDefault();var co=$('#cco').value.trim(),ph=$('#cph').value.trim(),k=(cf.querySelector('input[name=kind]:checked')||{}).value||'';
  if(!co||ph.replace(/\D/g,'').length<9){$('#cerr').textContent=T.need;return}$('#cerr').textContent='';
  var o=addReq({co:co,ph:ph,regime:TF.rg,sum:monthly(),src:'src_tg',kind:k,calc:''});
  toast(T.sent);w.open(tgUrl(T.req+'\n'+T.co+': '+co+'\n'+T.ph+': '+ph+'\n'+T.kind+': '+k+'\n'+T.no+' №'+o.id),'_blank','noopener')});

/* ── «Моя заявка»: статус из панели ─────────────────────────────── */
var sheet=$('#sheet');
function stOf(o){var p=get('op-panel-1',{});return p.st&&p.st[o.id]!==undefined?p.st[o.id]:0}
function mine(){var a=reqs(),b=$('#mine');if(b)b.classList.toggle('on',a.length>0)}
function openMine(){var a=reqs();if(!a.length)return;var o=a[0],s=stOf(o);
  $('#shh').textContent=T.mine+' №'+o.id;
  $('#shb').innerHTML='<p class="mu">'+T.mineHint+'</p><p><b>'+esc(RG[o.regime]?RG[o.regime].n:'')+'</b> · '+sum(o.sum)+' / '+T.month+'</p><ul class="stl">'+T.st.map(function(n,i){return'<li class="'+(i===s?'cur':i<s&&s<4&&i<4?'done':'')+'">'+n+'</li>'}).join('')+'</ul><p style="margin-top:16px"><a class="btn btn-n" href="'+T.panelUrl+'#req">'+T.panel+'</a></p>';
  sheet.classList.add('on');frame()}
var mb=$('#mine');if(mb)mb.addEventListener('click',openMine);
$$('[data-close]').forEach(function(x){x.addEventListener('click',function(){sheet.classList.remove('on');frame()})});
d.addEventListener('keydown',function(e){if(e.key==='Escape'&&sheet.classList.contains('on')){sheet.classList.remove('on');frame()}});
mine();
addEventListener('storage',function(e){if(e.key==='op-cfg-1')applyCfg();if(e.key==='op-panel-1'||e.key==='op-req-1'){mine();if(sheet.classList.contains('on'))openMine()}});
})();
