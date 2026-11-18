/* Сайт-сравнение микрозаймов Qiyos. Всё считает эта страница, без модели:
   аннуитет по ставке банка для выбранной суммы и срока. Связь с админкой —
   память браузера: qy-partners-1 (правки партнёров из админки: скрыть,
   ставка, суммы, ссылка, порядок), qy-clicks-1 (переходы «Получить» с этой
   страницы), qy-panel-1 (статусы переходов из админки), qy-cfg-1 (тумблеры
   допов на первой странице макета). Прокрутку только читаем. */
(function(){
var d=document,w=window,$=function(s,r){return(r||d).querySelector(s)},$$=function(s,r){return[].slice.call((r||d).querySelectorAll(s))};
var D=JSON.parse($('#qy-data').textContent),T=D.t;
var RM=w.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function get(k,def){try{var v=localStorage.getItem(k);return v?JSON.parse(v):def}catch(e){return def}}
function put(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function sum(n){return fmt(n)+' '+T.sum}
function mln(n){var x=n/1e6;return(x%1?x.toFixed(1).replace('.',','):x)+' '+T.mln}
function pct(x){return String(x).replace('.',',')+'%'}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function cl(x,a,b){return x<a?a:x>b?b:x}
var toastT=0;function toast(m){var t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('on')},2400)}

/* Шапка: прячется при любой прокрутке, возвращается через 3 с после последнего события. */
var top=$('.top'),IDLE=3000,idleT=0;
function headIdle(){if(!top)return;clearTimeout(idleT);
  if(!top.contains(d.activeElement))top.classList.add('hide');
  idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}
function onScroll(){headIdle();coins()}
addEventListener('scroll',onScroll,{passive:true});

/* Заголовок по словам и появление блоков. */
$$('.hero h1 .w>span').forEach(function(s,i){s.style.transitionDelay=(120+i*70)+'ms'});
requestAnimationFrame(function(){var h=$('.hero h1');if(h)h.classList.add('on')});
var io='IntersectionObserver'in w?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'}):null;
$$('.rise').forEach(function(e){if(io&&!RM)io.observe(e);else e.classList.add('on')});

/* Монеты первого экрана: кольца на разной глубине. */
var cn=$('.coins'),cs=[];
if(cn){var z=7;function r(){z=(z*16807)%2147483647;return z/2147483647}
  for(var i=0;i<9;i++){var s=d.createElement('span'),sz=40+r()*160;s.style.cssText='width:'+sz+'px;height:'+sz+'px;left:'+(r()*100)+'%;top:'+(r()*90)+'%';cn.appendChild(s);cs.push({e:s,k:.05+r()*.25})}}
function coins(){if(RM||!cs.length)return;var y=scrollY;if(y>innerHeight*1.5)return;cs.forEach(function(c){c.e.style.transform='translate3d(0,'+(-y*c.k).toFixed(1)+'px,0)'})}

/* Тумблеры допов с первой страницы макета. */
var cfg=get('qy-cfg-1',{});
$$('[data-addon]').forEach(function(e){e.classList.toggle('off',cfg[e.getAttribute('data-addon')]===false)});

/* ── Партнёры: данные страницы + правки из админки ───────────────── */
var P0=D.p,P=[],ov={};
function load(){ov=get('qy-partners-1',{});P=P0.map(function(p,i){var o=ov[p.id]||{},x={};for(var k in p)x[k]=p[k];
  ['lo','hi','min','max','tmin','tmax','ref','rec','zero','off','ord'].forEach(function(k){if(o[k]!==undefined&&o[k]!==null&&o[k]!=='')x[k]=o[k]});
  if(p.tiers&&(o.lo!=null||o.hi!=null)){x.lo=o.lo!=null?o.lo:p.lo!=null?p.lo:p.tiers[0][1];x.hi=o.hi!=null?o.hi:p.tiers[p.tiers.length-1][1];x.tiers=null}if(x.ord===undefined)x.ord=i;return x})}
function rates(p,n){if(p.tiers){var t=p.tiers[p.tiers.length-1][1];for(var i=0;i<p.tiers.length;i++)if(n<=p.tiers[i][0]){t=p.tiers[i][1];break}return[p.lo!=null?p.lo:t,t]}return[p.lo,p.hi]}
function ann(s,rate,n){var q=rate/1200;return q?s*q/(1-Math.pow(1+q,-n)):s/n}
function why(p,s,n){
  if(p.min!=null&&s<p.min)return T.wmin+' '+mln(p.min);
  if(p.max!=null&&s>p.max)return T.wmax+' '+mln(p.max);
  if(n<p.tmin)return T.wtmin+' '+p.tmin+' '+T.mo;
  if(n>p.tmax)return T.wtmax+' '+p.tmax+' '+T.mo;
  if(p.step&&(n-p.tmin)%p.step)return T.wstep;
  return''}
function calc(p,s,n){var r=rates(p,n),lo=r[0],hi=r[1],a=ann(s,lo,n),b=hi!=null?ann(s,hi,n):null;
  return{lo:lo,hi:hi,pay:a,pay2:b,over:a*n-s,over2:b!=null?b*n-s:null,tot:a*n,tot2:b!=null?b*n:null,why:why(p,s,n)}}
function rng(a,b){return b!=null&&Math.round(b)!==Math.round(a)?sum(a)+'<span class="to">'+(T.post?sum(b)+' '+T.upto:T.upto+' '+sum(b))+'</span>':sum(a)}
function easy(p){return(p.online?2:0)+(p.docs?2:0)+(p.noPledge?1:0)+(p.card?1:0)}

/* ── Сумма и срок ──────────────────────────────────────────────── */
var st=get('qy-calc-1',{s:10000000,n:12,sort:'pay',f:{}});st.f=st.f||{};
var rs=$('#rs'),rn=$('#rn'),is=$('#is'),inn=$('#in');
function fill(e){var v=(e.value-e.min)/(e.max-e.min)*100;e.style.setProperty('--v',v+'%')}
function setS(v,from){st.s=cl(Math.round(v/1e5)*1e5||0,D.smin,D.smax);if(from!=='r')rs.value=st.s;if(from!=='i')is.value=fmt(st.s);fill(rs);upd()}
function setN(v,from){st.n=cl(Math.round(v)||1,1,60);if(from!=='r')rn.value=st.n;if(from!=='i')inn.value=st.n;fill(rn);upd()}
rs.addEventListener('input',function(){setS(+rs.value,'r')});
rn.addEventListener('input',function(){setN(+rn.value,'r')});
is.addEventListener('change',function(){setS(+is.value.replace(/\D/g,''))});
inn.addEventListener('change',function(){setN(+inn.value.replace(/\D/g,''))});

/* ── Карточки: строятся один раз, дальше меняются значения и порядок ── */
var list=$('#list'),cards={};
function lic(p){return T.lic+' №'+p.lic.n+(p.lic.d?' '+T.from+' '+p.lic.d:'')}
function refOf(p,id){var u=p.ref||p.src;return u+(u.indexOf('?')<0?'?':'&')+'utm_source=qiyos&utm_medium=cpa&sub_id='+id}
function card(p){var c=d.createElement('article');c.className='offer';c.setAttribute('data-id',p.id);
  c.innerHTML='<div class="o-h"><span class="o-lg"><img src="'+D.img+'/logo/'+p.logo+'" alt="'+esc(p.bank)+'" loading="lazy"></span><span><b>'+esc(p.bank)+'</b><small>'+esc(p.product)+'</small><small>'+esc(lic(p))+'</small></span><span class="o-tag" hidden>'+T.rec+'</span></div>'+
  '<div class="o-m"><div class="big"><small>'+T.pay+'</small><b class="v-pay"></b><em class="v-pay2"></em></div><div><small>'+T.rate+'</small><b class="v-rate"></b></div><div><small>'+T.over+'</small><b class="v-over"></b></div><div><small>'+T.tot+'</small><b class="v-tot"></b></div></div>'+
  '<div class="o-a"><a class="btn btn-a go" href="'+esc(refOf(p,0))+'" rel="noopener sponsored nofollow" target="_blank">'+T.get+'</a>'+
  '<label class="cmpk" data-addon="compare"><input type="checkbox" data-cmp="'+p.id+'">'+T.cmp+'</label><button type="button" class="more" aria-expanded="false">'+T.more+D.down+'</button><small>'+T.demo+'</small></div>'+
  '<p class="o-why" hidden>'+D.info+'<span></span></p>'+
  '<div class="o-d"><div class="o-b"></div><dl><dt>'+T.who+'</dt><dd>'+esc(p.who)+'</dd><dt>'+T.how+'</dt><dd>'+esc(p.how)+'</dd><dt>'+T.pledge+'</dt><dd>'+esc(p.pledge)+'</dd><dt>'+T.lim+'</dt><dd class="v-lim"></dd><dt>'+T.psk+'</dt><dd><a href="'+p.src+'" target="_blank" rel="noopener">'+T.pskl+'</a></dd><dt>'+T.org+'</dt><dd>'+esc(p.legal)+', '+esc(lic(p))+'</dd></dl>'+
  '<div class="sched" data-addon="plan"><p class="mu" style="margin:16px 0 8px">'+T.sched+'</p><div class="bars"></div><p class="flow-l mu" style="margin:8px 0 0"><span><i style="background:var(--gold)"></i>'+T.int+'</span> · <span><i style="background:var(--pr2)"></i>'+T.body+'</span></p></div></div>';
  if(cfg.compare===false)$('.cmpk',c).classList.add('off');if(cfg.plan===false)$('.sched',c).classList.add('off');
  var b=$('.o-b',c);[[p.online,T.b_online],[p.docs,T.b_docs],[p.card,T.b_card],[p.noPledge,T.b_np]].forEach(function(x){if(x[0])b.insertAdjacentHTML('beforeend','<span>'+x[1]+'</span>')});
  $('.more',c).addEventListener('click',function(){var o=$('.o-d',c),on=!o.classList.contains('on');o.classList.toggle('on',on);this.setAttribute('aria-expanded',on);if(on)sched(c,p)});
  $('.go',c).addEventListener('click',function(e){if(c.classList.contains('no')){e.preventDefault();return}go(p,this)});
  $('[data-cmp]',c).addEventListener('change',cmpUpd);
  return c}
function bars(el,s,n,rate){var q=rate/1200,a=ann(s,rate,n),rest=s,h='';for(var i=0;i<n;i++){var it=rest*q,k=a?it/a:0;rest-=a-it;h+='<span><i style="--k:'+k.toFixed(3)+'"></i></span>'}el.innerHTML=h}
function sched(c,p){var x=calc(p,st.s,st.n);bars($('.sched .bars',c),st.s,st.n,x.lo)}

/* FLIP: карточки переезжают на новое место, а не прыгают. */
function flip(fn){var pos={};Object.keys(cards).forEach(function(k){pos[k]=cards[k].getBoundingClientRect().top});fn();if(RM)return;
  Object.keys(cards).forEach(function(k){var c=cards[k],dy=pos[k]-c.getBoundingClientRect().top;if(!dy)return;c.style.transition='none';c.style.transform='translateY('+dy+'px)';
    requestAnimationFrame(function(){requestAnimationFrame(function(){c.style.transition='transform /*~*/.48s cubic-bezier(.2,.8,.2,1)';c.style.transform=''})})})}

var shown=[];
function upd(){put('qy-calc-1',st);var s=st.s,n=st.n,f=st.f,rows=[];
  P.forEach(function(p){if(p.off)return;
    if(f.docs&&!p.docs)return;if(f.card&&!p.card)return;if(f.zero&&!p.zero)return;if(f.online&&!p.online)return;
    rows.push({p:p,x:calc(p,s,n)})});
  var key={pay:function(r){return r.x.pay},over:function(r){return r.x.over2!=null?r.x.over2:r.x.over},easy:function(r){return-easy(r.p)*1e12+r.x.pay},rec:function(r){return(r.p.rec?0:1e15)+r.p.ord*1e12+r.x.pay}}[st.sort];
  rows.sort(function(a,b){return(a.x.why?1e16:0)+key(a)-((b.x.why?1e16:0)+key(b))});
  var fit=rows.filter(function(r){return!r.x.why});shown=fit;
  flip(function(){Object.keys(cards).forEach(function(k){cards[k].hidden=true});
    rows.forEach(function(r){var p=r.p,x=r.x,c=cards[p.id];if(!c)c=cards[p.id]=card(p);c.hidden=false;list.appendChild(c);
      c.classList.toggle('no',!!x.why);c.classList.toggle('rec',!!p.rec&&!x.why);$('.o-tag',c).hidden=!p.rec;
      var rg=x.pay2!=null&&Math.round(x.pay2)!==Math.round(x.pay);$('.v-pay',c).innerHTML=T.post?sum(x.pay)+(rg?' <small>'+T.fr+'</small>':''):(rg?'<small>'+T.fr+'</small>':'')+sum(x.pay);
      $('.v-pay2',c).textContent=x.pay2==null?T.upto_na:Math.round(x.pay2)!==Math.round(x.pay)?(T.post?pct(x.hi)+' '+T.att+' '+sum(x.pay2)+' '+T.upto:T.upto+' '+sum(x.pay2)+' '+T.att+' '+pct(x.hi)):T.fixed;
      $('.v-rate',c).textContent=x.hi==null?T.fr+' '+pct(x.lo):x.lo===x.hi?pct(x.lo):pct(x.lo)+'-'+pct(x.hi);
      $('.v-over',c).innerHTML=rng(x.over,x.over2);
      $('.v-tot',c).innerHTML=rng(x.tot,x.tot2);
      $('.v-lim',c).textContent=(p.min!=null||p.max!=null?(p.min!=null?T.fr+' '+mln(p.min)+' ':'')+(p.max!=null?T.upto+' '+mln(p.max):''):T.byscore)+', '+p.tmin+'-'+p.tmax+' '+T.mo;
      var wy=$('.o-why',c);wy.hidden=!x.why;$('span',wy).textContent=x.why;
      if($('.o-d',c).classList.contains('on'))sched(c,p)})});
  $('#empty').hidden=rows.length>0;
  $('#found').textContent=fit.length+' '+T.of+' '+P.filter(function(p){return!p.off}).length;
  var best=fit[0];
  $('#best').textContent=best?sum(best.x.pay):T.none;
  $('#bestw').textContent=best?best.p.bank+', '+(best.x.hi==null||best.x.lo===best.x.hi?pct(best.x.lo):pct(best.x.lo)+'-'+pct(best.x.hi)):'';
  var hb=$('#hbars');if(hb){if(best)bars(hb,s,n,best.x.lo);else hb.innerHTML=''}
  $('#hover').textContent=best?sum(best.x.over):'';
  $$('.seg button').forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-sort')===st.sort)});
  $$('[data-f]').forEach(function(b){b.setAttribute('aria-pressed',!!f[b.getAttribute('data-f')])});
  $('#sorth').textContent=T['h_'+st.sort];
  cmpUpd();dti()}
$$('.seg button').forEach(function(b){b.addEventListener('click',function(){st.sort=b.getAttribute('data-sort');upd()})});
$$('[data-f]').forEach(function(b){b.addEventListener('click',function(){var k=b.getAttribute('data-f');st.f[k]=!st.f[k];upd()})});
$('#reset').addEventListener('click',function(){st.f={};upd()});

/* ── «Получить»: переход записывается, админка видит его первой строкой ── */
function go(p,a){var cl0=get('qy-clicks-1',[]),x=calc(p,st.s,st.n),id=cl0.length?cl0[0].id+1:7001;
  cl0.unshift({id:id,p:p.id,s:st.s,n:st.n,pay:Math.round(x.pay),r:x.lo,at:Date.now()});put('qy-clicks-1',cl0.slice(0,50));
  a.href=refOf(p,id);mineN();toast(T.sent)}

/* ── Мои заявки: статус ставит админка ─────────────────────────────── */
function mineN(){var n=get('qy-clicks-1',[]).length,i=$('#mine i');if(i){i.textContent=n;i.classList.toggle('on',n>0)}}
mineN();
function sheet(html){var s=$('#sheet');$('.sh-b',s).innerHTML=html;s.classList.add('on');$('.x',s).focus()}
$('#sheet').addEventListener('click',function(e){if(e.target===this||e.target.closest('.x'))this.classList.remove('on')});
addEventListener('keydown',function(e){if(e.key==='Escape')$('#sheet').classList.remove('on')});
$('#mine').addEventListener('click',function(){var cs=get('qy-clicks-1',[]),S=get('qy-panel-1',{}),stt=S.st||{};
  if(!cs.length){sheet('<h3>'+T.mine+'</h3><p class="mu">'+T.mine0+'</p>');return}
  sheet('<h3>'+T.mine+'</h3>'+cs.map(function(c){var p=P0.filter(function(x){return x.id===c.p})[0],s=stt[c.id]||0;
    return'<div class="panel" style="margin:0 0 12px"><b>№'+c.id+' · '+esc(p?p.bank:c.p)+'</b><p class="mu" style="margin:4px 0 0">'+sum(c.s)+' · '+c.n+' '+T.mo+' · '+T.pay+' '+sum(c.pay)+'</p><div class="stl">'+
    T.st.map(function(n,i){var cls=s===4?(i===4?'bad':i===0?'done':''):i<s?'done':i===s?'cur':'';if(i===4&&s!==4)return'';if(s===4&&i>0&&i<4)return'';return'<span class="'+cls+'">'+n+'</span>'}).join('')+'</div></div>'}).join('')+'<p class="mu">'+T.mine1+'</p>')});
addEventListener('storage',function(e){if(e.key==='qy-partners-1'){load();upd()}if(e.key==='qy-clicks-1')mineN()});

/* ── Сравнение рядом ──────────────────────────────────────────────── */
var cmpBar=$('#cmp');
function picked(){return $$('[data-cmp]').filter(function(i){return i.checked&&!i.closest('.offer').hidden}).map(function(i){return i.getAttribute('data-cmp')})}
function cmpUpd(){if(!cmpBar)return;var k=picked();$('b',cmpBar).textContent=T.cmpn+': '+k.length;cmpBar.classList.toggle('on',k.length>0&&cfg.compare!==false)}
$('#cmpgo').addEventListener('click',function(){var k=picked();if(k.length<2){toast(T.cmp2);return}
  var rows=k.map(function(id){var p=P.filter(function(x){return x.id===id})[0];return{p:p,x:calc(p,st.s,st.n)}});
  var tr=function(h,f){return'<tr><th>'+h+'</th>'+rows.map(function(r){return'<td>'+f(r)+'</td>'}).join('')+'</tr>'};
  sheet('<h3>'+T.cmpt+' '+sum(st.s)+', '+st.n+' '+T.mo+'</h3><div class="tw"><table class="tbl"><tr><th></th>'+rows.map(function(r){return'<th><b>'+esc(r.p.bank)+'</b></th>'}).join('')+'</tr>'+
    tr(T.pay,function(r){return'<b>'+sum(r.x.pay)+'</b>'+(r.x.pay2!=null&&Math.round(r.x.pay2)!==Math.round(r.x.pay)?'<br>'+T.upto+' '+sum(r.x.pay2):'')})+
    tr(T.rate,function(r){return r.x.hi==null?T.fr+' '+pct(r.x.lo):pct(r.x.lo)+(r.x.hi!==r.x.lo?'-'+pct(r.x.hi):'')})+
    tr(T.over,function(r){return sum(r.x.over)})+tr(T.tot,function(r){return sum(r.x.tot)})+
    tr(T.who,function(r){return esc(r.p.who)})+tr(T.pledge,function(r){return esc(r.p.pledge)})+tr(T.why0,function(r){return r.x.why?'<span style="color:var(--bad)">'+esc(r.x.why)+'</span>':'✓'})+
    '</table></div><div class="warn-s">'+D.info+'<span>'+T.warn+'</span></div>')});

/* ── Долговая нагрузка ─────────────────────────────────────────────── */
function dti(){var inc=+($('#dinc')||{}).value||0,cur=+($('#dcur')||{}).value||0,o=$('#dout');if(!o)return;
  if(!inc){o.innerHTML='<span class="mu">'+T.d0+'</span>';return}
  var best=shown[0],pay=best?best.x.pay:0,k=(cur+pay)/inc,free=Math.max(0,inc*.5-cur);
  o.innerHTML='<small class="mu">'+T.d1+'</small><br><b>'+sum(free)+'</b><p style="margin:8px 0 0">'+(best?T.d2+' '+sum(pay)+': '+Math.round(k*100)+'% '+T.d3+(k>.5?' <b style="font-size:16px;color:var(--bad)">'+T.d4+'</b>':''):'')+'</p><div class="meter"><i class="'+(k>.5?'hi':'')+'" style="--k:'+Math.min(1,k).toFixed(3)+'"></i></div>'}
['#dinc','#dcur'].forEach(function(s){var e=$(s);if(e)e.addEventListener('input',dti)});

/* ── Подписка на ставку ниже (в макете: строка в памяти браузера) ─── */
var nf=$('#nform');if(nf)nf.addEventListener('submit',function(e){e.preventDefault();var v=$('#ntg').value.trim();if(!v){toast(T.n0);return}
  var a=get('qy-subs-1',[]);a.unshift({tg:v.slice(0,40),r:+$('#nrate').value,at:Date.now()});put('qy-subs-1',a.slice(0,20));nf.reset();toast(T.n1)});

/* ── Частые запросы: ставят сумму, срок и фильтр ───────────────────── */
$$('[data-q]').forEach(function(b){b.addEventListener('click',function(){var q=JSON.parse(b.getAttribute('data-q'));st.f=q.f||{};setS(q.s);setN(q.n);$('#offers').scrollIntoView({block:'start'})})});

load();
P0.forEach(function(p){cards[p.id]=card(p)});
rs.min=D.smin;rs.max=D.smax;setS(st.s);setN(st.n);
})();
