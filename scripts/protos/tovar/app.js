(function(){
'use strict';
/* app: приложение покупателя tovar.uz. Экраны по адресу после #:
   / — главная, /c/<раздел> — каталог, /s/<запрос> — поиск, /p/<id> — карточка
   (/offer, /ask сразу открывают торг или вопрос), /cmp — сравнение, /cart —
   корзина, /checkout — оформление, /o/<номер> — статус, /rfq — запрос цены,
   /me — профиль. Состояние в браузере (tv-demo-1) общее с кабинетом
   продавца: вопрос, торг и заказ отсюда видны там, ответ и статус оттуда —
   здесь. Товары, цены, продавцы и даты цен — с tovar.uz, ответы демо. */
var d=document,W=window,root=d.documentElement,K=JSON.parse(d.getElementById('tv-data').textContent),U=K.ui;
var $=function(s,r){return (r||d).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))};
var REDUCED=false;try{REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
var EMBED=/[?&]embed=1/.test(location.search);if(EMBED)root.classList.add('embed');
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,'\u00a0')}
function sum(n){return fmt(n)+'\u00a0'+U.sumW}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function ic(k){return '<svg class="ic" aria-hidden="true"><use href="#i-'+k+'"/></svg>'}
function dmy(iso){var p=iso.split('-');return p[2]+'.'+p[1]+'.'+p[0]}
var GD={};K.goods.forEach(function(g){GD[g.id]=g});

/* Общее с кабинетом продавца демо-хранилище. */
var KEY='tv-demo-1';
function load(){var s=null;try{s=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){}s=s||{};['cart','cmp','orders','offers','asks','rfqs'].forEach(function(k){if(!Array.isArray(s[k]))s[k]=[]});['confirmed','ladders','prices','stock'].forEach(function(k){if(!s[k]||typeof s[k]!=='object')s[k]={}});return s}
function save(s){try{localStorage.setItem(KEY,JSON.stringify(s))}catch(e){}badges()}
addEventListener('storage',function(e){if(e.key===KEY)render()});

function price(id,s){s=s||load();return s.prices[id]||GD[id].p}
function stockOf(id,s){s=s||load();return s.stock[id]!=null?s.stock[id]:GD[id].st}
function ladderOf(id,s){s=s||load();return s.ladders[id]||K.ladder[id]||null}
function unitAt(id,q,s){var L=ladderOf(id,s),p=price(id,s);if(!L)return p;var u=p;L.forEach(function(t){if(q>=t[0])u=t[1]});return u}
function ageDays(iso){return Math.max(0,Math.round((new Date(K.today)-new Date(iso))/864e5))}
function ago(n){return n<1?U.today:n<45?U.ago_d.replace('{n}',n):n<365?U.ago_m.replace('{n}',Math.round(n/30)):U.ago_y.replace('{n}',Math.floor(n/365))}
function freshOf(g,s){s=s||load();if(s.confirmed[g.s]||s.confirmed['i'+g.id])return {ok:true,txt:U.confirmed};var a=ageDays(g.upd);return {ok:a<=30,txt:U.updated+' '+dmy(g.upd)+' · '+ago(a),old:a>365}}
function replyMin(sk,s){s=s||load();var a=s.asks.filter(function(x){return x.s===sk&&x.ats}).concat(s.offers.filter(function(x){return x.s===sk&&x.ats}));
  if(a.length){var m=a.reduce(function(t,x){return t+(x.ats-x.ts)},0)/a.length/6e4;return Math.max(1,Math.round(m))}return K.reply[sk]}
function replyTxt(m){return m<60?U.replies.replace('{n}',m):U.repliesH.replace('{n}',Math.round(m/60))}

/* ── Поиск на двух языках ─────────────────────────────────────────────── */
function find(q){q=(q||'').toLowerCase().trim();if(q.length<2)return [];
  var cats={};Object.keys(K.syn).forEach(function(c){K.syn[c].forEach(function(w){if(q.indexOf(w)>=0||w.indexOf(q)===0)cats[c]=1})});
  var mem=(q.match(/\d+\s*\/\s*\d+/)||[''])[0].replace(/\s/g,'');
  return K.goods.filter(function(g){var n=(g.n+' '+g.alt).toLowerCase();
    if(mem&&g.mem!==mem)return false;if(mem&&!/[a-zа-яё‘]{3,}/i.test(q.replace(mem,'')))return true;
    return cats[g.cat]||n.indexOf(q)>=0})}

/* ── Мелочи интерфейса ────────────────────────────────────────────────── */
var toastT=0;function toast(m){var t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('on')},2200)}
function badges(){var s=load(),c=s.cart.reduce(function(a,x){return a+x.q},0);
  $$('[data-badge="cart"]').forEach(function(b){var was=b.textContent;b.textContent=c;b.hidden=!c;if(was!==String(c)&&c&&!REDUCED){b.classList.remove('bump');void b.offsetWidth;b.classList.add('bump')}});
  $$('[data-badge="cmp"]').forEach(function(b){b.textContent=s.cmp.length;b.hidden=!s.cmp.length})}
var sheetLast=null;
function sheet(title,body){sheetLast=d.activeElement;var s=$('#sheet');s.innerHTML='<div class="sh-back" data-close></div><div class="sh" role="dialog" aria-modal="true" aria-label="'+h(title)+'"><div class="sh-h"><b>'+h(title)+'</b><button type="button" class="ib" data-close aria-label="'+h(U.back)+'">'+ic('x')+'</button></div><div class="sh-b">'+body+'</div></div>';s.hidden=false;void s.offsetWidth;s.classList.add('on');root.classList.add('locked');$$('[data-close]',s).forEach(function(b){b.onclick=closeSheet});var f=$('.sh input,.sh textarea',s);if(f)f.focus({preventScroll:true});return $('.sh-b',s)}
function closeSheet(){var s=$('#sheet');if(s.hidden)return;s.classList.remove('on');root.classList.remove('locked');setTimeout(function(){if(s.classList.contains('on'))return;s.hidden=true;s.innerHTML=''},REDUCED?0:240);if(sheetLast&&sheetLast.focus)sheetLast.focus({preventScroll:true})}
addEventListener('keydown',function(e){if(e.key==='Escape'){closeSheet();closeSearch()}});
function payLogo(p){var n={click:'Click',payme:'Payme',uzum:'Uzum',cash:'',bank:''}[p];return '<span class="pl pl-'+p+'">'+(p==='cash'?ic('cash'):p==='bank'?ic('bank'):n)+'</span>'}

function gcard(g,i){var s=load(),f=freshOf(g,s),sl=K.sellers[g.s];
  return '<a class="gc drop" style="--d:'+Math.min(i||0,8)*35+'ms" href="#/p/'+g.id+'"><span class="gc-im"><img src="'+K.img+'/p-'+g.id+'.webp" alt="" loading="lazy"></span><span class="gc-b"><b>'+h(g.n)+'</b><em>'+sum(price(g.id,s))+'</em><small>'+h(sl.n)+' · '+(stockOf(g.id,s)?U.inStock:U.onOrder)+'</small><i class="chip '+(f.ok?'chip-ok':'chip-warn')+'">'+(f.ok?ic('check')+h(U.fFresh):h(dmy(g.upd)))+'</i></span></a>'}

/* ── Экраны ──────────────────────────────────────────────────────────── */
var view=$('#view');
function tab(k){$$('.tabbar a').forEach(function(a){a.classList.toggle('on',a.getAttribute('data-tab')===k)})}
function scr(){if(!REDUCED){view.classList.remove('in');void view.offsetWidth}view.classList.add('in');scrollTo(0,0)}

function home(){tab('home');var s=load();
  var fresh=K.goods.slice().sort(function(a,b){return (s.confirmed[b.s]?1:0)-(s.confirmed[a.s]?1:0)||b.upd.localeCompare(a.upd)}).slice(0,8);
  view.innerHTML='<section class="hello glass"><h1>'+h(U.hello)+'</h1><button type="button" class="hd-s" data-search>'+ic('search')+'<span>'+h(U.search)+'</span></button>'+
    '<div class="pill-r">'+K.pillars.map(function(p,i){return '<a href="#/c/all"'+(i===0?' class="on"':'')+'>'+h(p.n)+'</a>'}).join('')+'</div></section>'+
    '<a class="rfq-ban" href="#/rfq">'+ic('doc')+'<b>'+h(U.rfqBan)+'</b><span>'+h(U.rfqGo)+'</span></a>'+
    '<div class="sec-h"><div><h2>'+h(U.fresh)+'</h2><small>'+h(U.freshSub)+'</small></div><a href="#/c/all">'+h(U.allCats)+ic('chev')+'</a></div><div class="rail">'+fresh.map(gcard).join('')+'</div>'+
    '<div class="sec-h"><h2>'+h(U.cats)+'</h2></div><div class="cat-g">'+K.cats.map(function(c){return '<a href="#/c/all">'+ic(c.ic)+'<span>'+h(c.n)+'</span></a>'}).join('')+'</div>'+
    '<div class="sec-h"><h2>'+h(U.hits)+'</h2></div><div class="gl">'+[127572,113945,130576,79478,113670,130426,53664,129337].map(function(id,i){return gcard(GD[id],i)}).join('')+'</div>';
  bindSearch();scr()}

var F={fresh:false,stock:false,cheap:true};
function list(title,items,catSel){tab('cat');var s=load();
  var r=items.filter(function(g){return (!F.fresh||freshOf(g,s).ok)&&(!F.stock||stockOf(g.id,s))});
  if(F.cheap)r.sort(function(a,b){return price(a.id,s)-price(b.id,s)});
  var subs=Object.keys(K.subs);
  view.innerHTML='<div class="head-row"><a class="ib" href="#/" aria-label="'+h(U.back)+'">'+ic('back')+'</a><h1>'+h(title)+'</h1></div>'+
    (catSel!=null?'<div class="pill-r"><a href="#/c/all"'+(catSel==='all'?' class="on"':'')+'>'+h(U.allCats)+'</a>'+subs.map(function(k){return '<a href="#/c/'+k+'"'+(catSel===k?' class="on"':'')+'>'+h(K.subs[k])+'</a>'}).join('')+'</div>':'')+
    '<div class="pill-r"><button type="button" data-f="fresh" aria-pressed="'+F.fresh+'">'+ic('refresh')+h(U.fFresh)+'</button><button type="button" data-f="stock" aria-pressed="'+F.stock+'">'+h(U.inStock)+'</button><button type="button" data-f="cheap" aria-pressed="'+F.cheap+'">'+h(U.fCheap)+'</button></div>'+
    '<p class="fine">'+h(U.results)+': '+r.length+'</p>'+(r.length?'<div class="gl" style="margin-top:12px">'+r.map(gcard).join('')+'</div>':'<p class="empty">'+h(U.nothing)+'</p>');
  $$('[data-f]').forEach(function(b){b.onclick=function(){var k=b.getAttribute('data-f');F[k]=!F[k];render()}});scr()}

function product(id,open){var g=GD[id];if(!g){location.hash='#/';return}tab('');var s=load(),sl=K.sellers[g.s],f=freshOf(g,s),p=price(id,s),inC=s.cart.some(function(x){return x.id===id}),inCmp=s.cmp.indexOf(id)>=0,rm=replyMin(g.s,s);
  /* Та же память у других продавцов, иначе похожие из раздела. */
  var same=g.mem?K.goods.filter(function(x){return x.mem===g.mem}):[];var lab=U.others;
  if(same.length<2){same=K.goods.filter(function(x){return x.cat===g.cat}).slice(0,5);lab=U.othersCat}
  if(same.indexOf(g)<0)same.unshift(g);same.sort(function(a,b){return price(a.id,s)-price(b.id,s)});
  var L=ladderOf(id,s),mine=s.offers.filter(function(o){return o.id===id})[0],qa=s.asks.filter(function(a){return a.id===id});
  view.innerHTML='<div class="head-row"><button type="button" class="ib" data-back aria-label="'+h(U.back)+'">'+ic('back')+'</button><p class="pd-crumb">'+h(K.subs[g.cat]||'')+(g.biz?' · '+h(U.biz):'')+'</p></div>'+
  '<div class="pd"><div class="pd-im"><img src="'+K.img+'/p-'+g.id+'.webp" alt="'+h(g.n)+'">'+(g.biz?'<span class="chip chip-biz">'+h(U.biz)+'</span>':'')+'</div><div class="pd-more">'+
    '<div class="sec-h"><div><h2>'+h(lab)+'</h2></div></div><ul class="ofr">'+same.map(function(x,i){var xs=K.sellers[x.s],xf=freshOf(x,s);return '<li class="'+(x.id===id?'me ':'')+(i===0?'best':'')+'"><a href="#/p/'+x.id+'"><img src="'+K.img+'/p-'+x.id+'.webp" alt="" loading="lazy"><span><b>'+h(x.n)+'</b><small>'+h(xs.n)+' · '+(stockOf(x.id,s)?U.inStock:U.onOrder)+' · '+(xf.ok?h(U.fFresh):dmy(x.upd))+'</small></span><em>'+sum(price(x.id,s))+(i===0?'<i class="chip chip-ok">'+h(U.cheapest)+'</i>':x.id===id?'<i class="chip chip-tag">'+h(U.thisOne)+'</i>':'')+'</em></a></li>'}).join('')+'</ul>'+
    (L?'<div class="sec-h"><div><h2>'+ic('stairs')+' '+h(U.ladder)+'</h2><small>'+h(U.ladderNote)+'</small></div></div><div class="lad">'+L.map(function(t,i){return '<span style="--h:'+(48+i*17)+'%"'+(i===0?' class="on"':'')+'><b>'+fmt(t[1])+'</b>'+h(U.from.replace('{n}',t[0]))+'</span>'}).join('')+'</div>':'')+
    (g.spec.length?'<div class="sec-h"><h2>'+h(U.specs)+'</h2></div><dl class="spec">'+g.spec.map(function(r){return '<div><dt>'+h(r[0])+'</dt><dd>'+h(r[1])+'</dd></div>'}).join('')+'</dl>':'')+
    '<div class="sec-h"><h2>'+h(U.qa)+'</h2><button type="button" class="lnk" id="ask2">'+h(U.ask)+'</button></div><ul class="qa">'+(qa.length?qa.map(function(a){return '<li><p><b>'+h(a.q)+'</b></p>'+(a.a?'<p>'+h(sl.n)+': '+h(a.a)+'</p>':'<p class="wait">'+h(U.noAns)+'</p>')+'</li>'}).join(''):'<li class="muted">'+h(U.none)+'</li>')+'</ul>'+
    (sl.deliv?'<div class="sec-h"><h2>'+h(U.deliv)+'</h2></div><p class="deliv">'+h(sl.deliv)+'</p>':'')+
  '</div><aside class="pd-buy glass"><h1>'+h(g.n)+'</h1><p class="pd-price">'+sum(p)+' <small>/ '+h(U.pcs)+'</small></p>'+
    '<div class="fresh"><i class="chip '+(f.ok?'chip-ok':'chip-warn')+'">'+ic(f.ok?'check':'clock')+h(f.txt)+'</i><i class="chip '+(stockOf(id,s)?'chip-ok':'chip-tag')+'">'+(stockOf(id,s)?h(U.inStock):h(U.onOrder))+'</i>'+(f.old?'<p>'+h(U.stale)+'</p>':'')+'</div>'+
    (mine?'<div class="ok">'+ic('hand')+'<div><b>'+h(U.offerT)+': '+sum(mine.p)+' × '+mine.q+'</b><p>'+h(offerSt(mine))+'</p>'+(mine.st==='counter'||mine.st==='yes'?'<button type="button" class="btn btn-red btn-sm" id="take" style="margin-top:8px">'+h(U.buyAt)+'</button>':'')+'</div></div>':'')+
    '<div class="buy-b"><button type="button" class="btn btn-red" id="add">'+ic('bag')+'<span>'+h(inC?U.inCart:U.toCart)+'</span></button><button type="button" class="btn btn-line'+(inCmp?' on':'')+'" id="cmp" aria-pressed="'+inCmp+'" aria-label="'+h(U.cmpAdd)+'">'+ic('scale')+'</button></div>'+
    '<div class="row-b" style="margin-top:0"><button type="button" class="btn btn-line btn-sm" id="offer">'+ic('hand')+h(U.offer)+'</button><button type="button" class="btn btn-line btn-sm" id="ask">'+ic('chat')+h(U.ask)+'</button></div>'+
    '<div class="sel"><span class="sel-av">'+h(sl.n.slice(0,2).toUpperCase())+'</span><b>'+h(sl.n)+'</b><small>'+h(sl.legal)+'</small><p class="rp'+(rm>60?' slow':'')+'">'+ic('chat')+h(replyTxt(rm))+'</p><small style="grid-column:1/-1">'+h(U.replyNote)+'</small>'+(sl.addr?'<small style="grid-column:1/-1">'+ic('pin')+' '+h(sl.addr)+'</small>':'')+(sl.hours?'<small style="grid-column:1/-1">'+h(U.hours)+': '+h(sl.hours)+'</small>':'')+'</div>'+
    '<div><p class="fine" style="margin:0 0 6px">'+h(U.pays)+'</p><div class="pays">'+sl.pay.map(function(k){return '<span>'+h(K.pay[k])+'</span>'}).join('')+'<span>Click</span><span>Payme</span><span>Uzum</span></div></div>'+
  '</aside></div>';
  $('#add').onclick=function(){var s2=load(),it=s2.cart.filter(function(x){return x.id===id})[0];if(it)it.q++;else s2.cart.push({id:id,q:g.biz?5:1});save(s2);toast(U.added);$('#add span').textContent=U.inCart};
  $('#cmp').onclick=function(){var s2=load(),i=s2.cmp.indexOf(id);if(i>=0)s2.cmp.splice(i,1);else{if(s2.cmp.length>=3){toast(U.cmpFull);return}s2.cmp.push(id)}save(s2);var on=s2.cmp.indexOf(id)>=0;this.classList.toggle('on',on);this.setAttribute('aria-pressed',on)};
  $('#offer').onclick=function(){offerSheet(g)};$('#ask').onclick=$('#ask2').onclick=function(){askSheet(g)};
  var tk=$('#take');if(tk)tk.onclick=function(){var s2=load(),o=s2.offers.filter(function(x){return x.id===id})[0],fp=o.st==='counter'?o.cp:o.p;s2.cart=s2.cart.filter(function(x){return x.id!==id});s2.cart.push({id:id,q:o.q,fp:fp});save(s2);location.hash='#/cart'};
  scr();if(open==='offer')offerSheet(g);if(open==='ask')askSheet(g)}
function offerSt(o){return o.st==='yes'?U.oYes:o.st==='no'?U.oNo:o.st==='counter'?U.oCounter.replace('{p}',sum(o.cp)):U.oWait}
function offerSheet(g){var p=price(g.id),sug=Math.round(p*.92/10000)*10000,floor=Math.round(p*.8/1000)*1000;
  var b=sheet(U.offer,'<p class="muted">'+h(g.n)+' · '+sum(p)+'</p><div class="two"><label class="fld"><span>'+h(U.offerT)+'</span><input id="of-p" inputmode="numeric" value="'+fmt(sug)+'"></label><label class="fld"><span>'+h(U.qty)+'</span><input id="of-q" inputmode="numeric" value="'+(g.biz?10:1)+'"></label></div><button type="button" class="btn btn-red wide" id="of-go">'+ic('send')+h(U.offerSend)+'</button><p class="err" id="of-err" role="alert"></p>');
  $('#of-go',b).onclick=function(){var v=+$('#of-p').value.replace(/\D/g,''),q=Math.max(1,+$('#of-q').value.replace(/\D/g,'')||1);
    if(v<floor){$('#of-err').textContent=U.offerLow.replace('{p}',sum(floor));return}
    var s=load();s.offers=s.offers.filter(function(o){return o.id!==g.id});s.offers.unshift({no:'P-'+(500+s.offers.length+1),id:g.id,s:g.s,p:v,q:q,ts:Date.now(),st:'wait',src:'app'});save(s);
    b.innerHTML='<div class="ok">'+ic('check')+'<p>'+h(U.offerSent)+'</p></div><a class="btn btn-line wide" href="'+K.panel+'#ask">'+h(U.openPanel)+'</a>';setTimeout(render,50)}}
function askSheet(g){var b=sheet(U.ask,'<label class="fld"><span>'+h(U.askT)+'</span><textarea id="as-q">'+h(U.askPh)+'</textarea></label><button type="button" class="btn btn-red wide" id="as-go">'+ic('send')+h(U.askSend)+'</button>');
  $('#as-go',b).onclick=function(){var q=($('#as-q').value||'').trim();if(!q)return;var s=load();s.asks.unshift({no:'Q-'+(300+s.asks.length+1),id:g.id,s:g.s,q:q,ts:Date.now(),src:'app'});save(s);
    b.innerHTML='<div class="ok">'+ic('check')+'<p>'+h(U.askSent)+'</p></div><a class="btn btn-line wide" href="'+K.panel+'#ask">'+h(U.openPanel)+'</a>';setTimeout(render,50)}}

function compare(){tab('cmp');var s=load(),ids=s.cmp;
  if(!ids.length){view.innerHTML='<div class="head-row"><h1>'+h(U.compare)+'</h1></div><div class="empty">'+ic('scale')+'<p>'+h(U.cmpEmpty)+'</p><div class="row-b" style="justify-content:center"><a class="btn btn-line" href="#/s/4%2F128">4/128</a></div></div>';scr();return}
  var gs=ids.map(function(i){return GD[i]}),minP=Math.min.apply(null,gs.map(function(g){return price(g.id,s)}));
  function row(name,f,best){return '<tr><th>'+h(name)+'</th>'+gs.map(function(g){return '<td'+(best&&best(g)?' class="best"':'')+'>'+f(g)+'</td>'}).join('')+'</tr>'}
  view.innerHTML='<div class="head-row"><h1>'+h(U.compare)+'</h1></div><div class="cmp"><table><tbody>'+
    '<tr><th></th>'+gs.map(function(g){return '<td><a href="#/p/'+g.id+'"><img src="'+K.img+'/p-'+g.id+'.webp" alt=""></a><b style="display:block;font-weight:400;margin-top:6px">'+h(g.n)+'</b><button type="button" class="x" data-x="'+g.id+'">'+h(U.del)+'</button></td>'}).join('')+'</tr>'+
    row(U.price,function(g){return '<b>'+sum(price(g.id,s))+'</b>'},function(g){return price(g.id,s)===minP&&gs.length>1})+
    row(U.seller,function(g){return h(K.sellers[g.s].n)})+
    row(U.stock,function(g){return stockOf(g.id,s)?h(U.inStock):h(U.onOrder)},function(g){return stockOf(g.id,s)})+
    row(U.memory,function(g){return h(g.mem||'·')})+
    row(U.freshness,function(g){var f=freshOf(g,s);return '<i class="chip '+(f.ok?'chip-ok':'chip-warn')+'">'+(f.ok?h(U.fFresh):dmy(g.upd))+'</i>'},function(g){return freshOf(g,s).ok})+
    row(U.reply||'',function(g){return h(replyTxt(replyMin(g.s,s)))})+
    row(U.pays,function(g){return K.sellers[g.s].pay.map(function(k){return h(K.pay[k])}).join(', ')})+
    '</tbody></table></div>';
  $$('[data-x]').forEach(function(b){b.onclick=function(){var s2=load();s2.cmp=s2.cmp.filter(function(x){return x!==+b.getAttribute('data-x')});save(s2);render()}});scr()}

function cartCalc(s){var lines=s.cart.map(function(c){var g=GD[c.id],u=c.fp||unitAt(c.id,c.q,s),base=price(c.id,s);return {c:c,g:g,u:u,base:base,t:u*c.q,save:(base-u)*c.q}});
  var t=lines.reduce(function(a,x){return a+x.t},0),sv=lines.reduce(function(a,x){return a+Math.max(0,x.save)},0);return {lines:lines,total:t,saved:sv}}
function cart(){tab('cart');var s=load();
  if(!s.cart.length){view.innerHTML='<div class="head-row"><h1>'+h(U.cart)+'</h1></div><div class="empty">'+ic('bag')+'<p>'+h(U.cartEmpty)+'</p></div>';scr();return}
  var c=cartCalc(s),by={};c.lines.forEach(function(x){(by[x.g.s]=by[x.g.s]||[]).push(x)});
  view.innerHTML='<div class="head-row"><h1>'+h(U.cart)+'</h1></div><div class="cart-g"><div style="display:grid;gap:12px">'+Object.keys(by).map(function(sk){return '<section class="cs"><header>'+ic('building')+'<b>'+h(K.sellers[sk].n)+'</b><span class="muted">'+h(replyTxt(replyMin(sk,s)))+'</span></header><ul class="cl">'+by[sk].map(function(x){
    var L=x.c.fp?null:ladderOf(x.g.id,s),hint='';
    if(L){var nx=L.filter(function(t){return t[0]>x.c.q})[0],cur=L.filter(function(t){return x.c.q>=t[0]}).pop();
      if(nx)hint='<p class="lad-hint">'+ic('stairs')+'<span>'+h(U.ladderHint.replace('{k}',nx[0]-x.c.q).replace('{p}',sum(nx[1])))+'</span><button type="button" data-up="'+x.g.id+'" data-to="'+nx[0]+'">+'+(nx[0]-x.c.q)+'</button></p>';
      else if(cur)hint='<p class="lad-hint got">'+ic('check')+'<span>'+h(U.ladderGot.replace('{p}',sum(cur[1])).replace('{n}',cur[0]))+'</span></p>'}
    return '<li><img src="'+K.img+'/p-'+x.g.id+'.webp" alt=""><div><b>'+h(x.g.n)+'</b><em>'+sum(x.u)+(x.u<x.base?'<s>'+fmt(x.base)+'</s>':'')+'</em><span class="stp"><button type="button" data-d="-1" data-id="'+x.g.id+'" aria-label="'+h(U.less)+'">'+ic('minus')+'</button><output>'+x.c.q+'</output><button type="button" data-d="1" data-id="'+x.g.id+'" aria-label="'+h(U.more)+'">'+ic('plus')+'</button></span></div>'+hint+'</li>'}).join('')+'</ul></section>'}).join('')+'</div>'+
    '<aside class="tot glass"><dl><div><dt>'+h(U.cart)+'</dt><dd>'+s.cart.reduce(function(a,x){return a+x.q},0)+' '+h(U.pcs)+'</dd></div>'+(c.saved?'<div><dt>'+h(U.saved)+'</dt><dd style="color:var(--ok)">−'+sum(c.saved)+'</dd></div>':'')+'</dl><p class="big">'+sum(c.total)+'</p><a class="btn btn-red wide" href="#/checkout">'+h(U.checkout)+ic('arrow')+'</a></aside></div>';
  $$('[data-d]').forEach(function(b){b.onclick=function(){var s2=load(),id=+b.getAttribute('data-id'),it=s2.cart.filter(function(x){return x.id===id})[0];it.q+=+b.getAttribute('data-d');if(it.q<1)s2.cart.splice(s2.cart.indexOf(it),1);save(s2);cart()}});
  $$('[data-up]').forEach(function(b){b.onclick=function(){var s2=load(),it=s2.cart.filter(function(x){return x.id===+b.getAttribute('data-up')})[0];it.q=+b.getAttribute('data-to');save(s2);cart()}});
  if(!view.classList.contains('in'))scr()}

var CO={who:'person',how:'deliv',pay:'click',ok:false,inn:''};
function checkout(){tab('cart');var s=load();if(!s.cart.length){location.hash='#/cart';return}var c=cartCalc(s);
  var pays=['click','payme','uzum','cash'].concat(CO.who==='company'?['bank']:[]);if(pays.indexOf(CO.pay)<0)CO.pay='click';
  view.innerHTML='<div class="head-row"><a class="ib" href="#/cart" aria-label="'+h(U.back)+'">'+ic('back')+'</a><h1>'+h(U.checkout)+'</h1></div><div class="co">'+
  '<section class="blk"><h2>'+h(U.phone)+'</h2><p class="fine" style="margin:0">'+h(U.noReg)+'</p><div class="two"><label class="fld"><span>'+h(U.phone)+'</span><input id="co-ph" type="tel" inputmode="tel" autocomplete="tel" value="+998 90 123 45 67"></label>'+(CO.ok?'<p class="ok" style="align-self:end">'+ic('check')+'</p>':'<label class="fld"><span>'+h(U.code)+'</span><input id="co-cv" inputmode="numeric" maxlength="4" placeholder="1234"></label>')+'</div>'+(CO.ok?'':'<button type="button" class="btn btn-line btn-sm" id="co-code">'+h(U.getCode)+'</button><p class="fine" id="co-sent" hidden>'+h(U.codeSent)+'</p>')+'<p class="err" id="co-err" role="alert"></p></section>'+
  '<section class="blk"><h2>'+h(U.who)+'</h2><div class="seg" role="radiogroup"><button type="button" role="radio" data-who="person" aria-checked="'+(CO.who==='person')+'">'+h(U.person)+'</button><button type="button" role="radio" data-who="company" aria-checked="'+(CO.who==='company')+'">'+h(U.company)+'</button></div>'+
    (CO.who==='company'?'<label class="fld"><span>'+h(U.inn)+'</span><input id="co-inn" inputmode="numeric" maxlength="9" value="'+h(CO.inn||'305123456')+'"></label><p class="ok" id="co-innok">'+ic('building')+h(U.innFound.replace('{n}',U.innDemo))+'</p>':'')+'</section>'+
  '<section class="blk"><h2>'+h(U.how)+'</h2><div class="seg" role="radiogroup"><button type="button" role="radio" data-how="deliv" aria-checked="'+(CO.how==='deliv')+'">'+h(U.delivery)+'</button><button type="button" role="radio" data-how="pick" aria-checked="'+(CO.how==='pick')+'">'+h(U.pickup)+'</button></div>'+
    (CO.how==='deliv'?'<label class="fld"><span>'+h(U.addr)+'</span><select id="co-reg">'+K.regions.map(function(r){return '<option>'+h(r)+'</option>'}).join('')+'</select></label><label class="fld"><span>'+h(U.addr)+'</span><input id="co-ad" value="'+h(K.lang==='ru'?'Чиланзар, 9 квартал, дом 14':'Chilonzor, 9-kvartal, 14-uy')+'"></label>':'')+'</section>'+
  '<section class="blk"><h2>'+h(U.payBy)+'</h2><div class="payg" role="radiogroup">'+pays.map(function(p){return '<button type="button" role="radio" data-pay="'+p+'" aria-checked="'+(CO.pay===p)+'">'+payLogo(p)+'<span>'+(p==='cash'?h(U.cashC):p==='bank'?h(U.bankT):h(K.pay[p]||p))+'</span></button>'}).join('')+'</div></section>'+
  '<section class="tot glass"><dl><div><dt>'+h(U.total)+'</dt><dd class="big">'+sum(c.total)+'</dd></div></dl><button type="button" class="btn btn-red wide" id="co-go">'+h(U.place)+'</button></section></div>';
  var cb=$('#co-code');if(cb)cb.onclick=function(){$('#co-sent').hidden=false;$('#co-cv').focus()};
  var cv=$('#co-cv');if(cv)cv.oninput=function(){if(cv.value==='1234'){CO.ok=true;checkout()}};
  $$('[data-who]').forEach(function(b){b.onclick=function(){CO.who=b.getAttribute('data-who');if(CO.who==='company')CO.pay='bank';checkout()}});
  $$('[data-how]').forEach(function(b){b.onclick=function(){CO.how=b.getAttribute('data-how');checkout()}});
  $$('[data-pay]').forEach(function(b){b.onclick=function(){CO.pay=b.getAttribute('data-pay');$$('[data-pay]').forEach(function(x){x.setAttribute('aria-checked',x===b)})}});
  $('#co-go').onclick=place;scr()}
function place(){var e=$('#co-err');if(!CO.ok){var cv=$('#co-cv');if(cv&&cv.value==='1234')CO.ok=true;else{e.textContent=U.badCode;return}}
  var s=load(),c=cartCalc(s),no='TV-'+(10240+s.orders.length+1);
  var o={no:no,ts:Date.now(),items:c.lines.map(function(x){return {id:x.g.id,q:x.c.q,u:x.u}}),sum:c.total,pay:CO.pay,who:CO.who,how:CO.how,st:0,paid:false,buyer:K.lang==='ru'?'Азиз К.':'Aziz K.',src:'app'};
  if(CO.pay==='cash'||CO.pay==='bank'){s.orders.unshift(o);s.cart=[];save(s);location.hash='#/o/'+no;return}
  var b=sheet(U.payCode,'<div class="ok" style="background:var(--s1);color:var(--ink)">'+payLogo(CO.pay)+'<b style="font-size:20px">'+sum(c.total)+'</b></div><label class="fld"><span>'+h(U.code)+'</span><input id="pc-c" inputmode="numeric" maxlength="4" placeholder="1234"></label><button type="button" class="btn btn-red wide" id="pc-go">'+h(U.pay)+'</button><p class="err" id="pc-err" role="alert"></p>');
  $('#pc-go',b).onclick=function(){if($('#pc-c').value!=='1234'){$('#pc-err').textContent=U.badCode;return}o.paid=true;var s2=load();s2.orders.unshift(o);s2.cart=[];save(s2);b.innerHTML='<div class="ok">'+ic('check')+'<p>'+h(U.paid)+'</p></div>';setTimeout(function(){closeSheet();location.hash='#/o/'+no},REDUCED?0:900)}}

function order(no){tab('me');var s=load(),o=s.orders.filter(function(x){return x.no===no})[0];if(!o){location.hash='#/me';return}
  var st=[U.st0,U.st1,U.st2,U.st3,U.st4];
  view.innerHTML='<div class="head-row"><a class="ib" href="#/me" aria-label="'+h(U.back)+'">'+ic('back')+'</a><h1>'+h(U.order)+' '+h(o.no)+'</h1></div><div class="co">'+
    '<section class="blk"><ol class="trk">'+st.map(function(n,i){return '<li class="'+(i<o.st?'done':i===o.st?'now':'')+'"><i>'+(i<o.st?ic('check'):i===o.st?ic('truck'):'')+'</i><span>'+h(n)+'</span></li>'}).join('')+'</ol><p class="fine">'+h(U.stNote)+'</p><a class="btn btn-line" href="'+K.panel+'#orders">'+ic('building')+h(U.openPanel)+'</a></section>'+
    '<section class="blk"><ul class="cl">'+o.items.map(function(it){var g=GD[it.id];return '<li><img src="'+K.img+'/p-'+g.id+'.webp" alt=""><div><b>'+h(g.n)+'</b><em>'+sum(it.u)+' × '+it.q+'</em><small class="muted">'+h(K.sellers[g.s].n)+'</small></div></li>'}).join('')+'</ul><p class="big" style="font-weight:700;font-size:20px">'+sum(o.sum)+(o.paid?' · <span style="color:var(--ok)">'+h(U.paid)+'</span>':'')+'</p></section></div>';scr()}

var RQ={};
function rfq(){tab('');var s=load(),last=s.rfqs[0];
  view.innerHTML='<div class="head-row"><a class="ib" href="#/" aria-label="'+h(U.back)+'">'+ic('back')+'</a><h1>'+h(U.rfq)+'</h1></div><div class="co"><p class="muted">'+h(U.rfqSub)+'</p>'+
  '<section class="blk"><label class="fld"><span>'+h(U.rfqWhat)+'</span><input id="rq-w" value="'+h(U.rfqWhatV)+'"></label><div class="two"><label class="fld"><span>'+h(U.qty)+'</span><input id="rq-q" inputmode="numeric" value="20"></label><label class="fld"><span>'+h(U.rfqWhen)+'</span><input id="rq-t" value="'+h(U.rfqWhenV)+'"></label></div><label class="fld"><span>'+h(U.rfqRegion)+'</span><select id="rq-r">'+K.regions.map(function(r){return '<option>'+h(r)+'</option>'}).join('')+'</select></label><button type="button" class="btn btn-red" id="rq-go">'+ic('send')+h(U.rfqSend)+'</button></section>'+
  (last?'<section class="blk"><h2>'+h(U.quotes)+' · '+h(last.what)+', '+last.qty+' '+h(U.pcs)+'</h2><p class="fine" style="margin:0">'+h(U.rfqWait)+'</p><ul class="ml">'+(last.quotes.length?last.quotes.map(function(q,i){return '<li><div><span class="grow"><b>'+h(q.seller)+'</b><small>'+sum(q.p)+' / '+h(U.pcs)+' · '+h(U.days.replace('{n}',q.days))+(q.demo?' · '+h(U.quoteDemo):'')+'</small></span>'+(last.taken===i?'<i class="chip chip-ok">'+ic('check')+'</i>':'<button type="button" class="btn btn-line btn-sm" data-take="'+i+'">'+h(U.take)+'</button>')+'</div></li>'}).join(''):'<li class="muted">…</li>')+'</ul></section>':'')+'</div>';
  $('#rq-go').onclick=function(){var s2=load(),no='R-'+(70+s2.rfqs.length+1);s2.rfqs.unshift({no:no,what:$('#rq-w').value,qty:+$('#rq-q').value||1,when:$('#rq-t').value,region:$('#rq-r').value,ts:Date.now(),quotes:[],src:'app'});save(s2);rfq();
    /* Демо: два продавца раздела отвечают сами, третий ответ — из кабинета. */
    [[K.sellers.sayina.n,1760000,3],[(K.lang==='ru'?'Продавец раздела':'Bo‘lim sotuvchisi')+' №2',1820000,2]].forEach(function(q,i){setTimeout(function(){var s3=load(),r=s3.rfqs.filter(function(x){return x.no===no})[0];if(!r)return;r.quotes.push({seller:q[0],p:q[1],days:q[2],demo:true});save(s3);if(location.hash==='#/rfq')rfq()},REDUCED?10:1200+i*1500)})};
  $$('[data-take]').forEach(function(b){b.onclick=function(){var s2=load();s2.rfqs[0].taken=+b.getAttribute('data-take');save(s2);toast(U.taken);rfq()}});
  if(!view.classList.contains('in'))scr()}

function me(){tab('me');var s=load(),st=[U.st0,U.st1,U.st2,U.st3,U.st4];
  function sec(t,items){return '<div class="sec-h"><h2>'+h(t)+'</h2></div><ul class="ml">'+(items.length?items.join(''):'<li class="muted">'+h(U.none)+'</li>')+'</ul>'}
  view.innerHTML='<div class="head-row"><h1>'+h(U.me)+'</h1></div>'+
    sec(U.myOrders,s.orders.map(function(o){return '<li><a href="#/o/'+o.no+'">'+ic('bag')+'<span class="grow"><b>'+h(o.no)+' · '+sum(o.sum)+'</b><small>'+h(st[o.st])+'</small></span>'+ic('chev')+'</a></li>'}))+
    sec(U.myOffers,s.offers.map(function(o){var g=GD[o.id];return '<li><a href="#/p/'+o.id+'">'+ic('hand')+'<span class="grow"><b>'+h(g.n)+'</b><small>'+sum(o.p)+' × '+o.q+' · '+h(offerSt(o))+'</small></span>'+ic('chev')+'</a></li>'}))+
    sec(U.myRfq,s.rfqs.map(function(r){return '<li><a href="#/rfq">'+ic('doc')+'<span class="grow"><b>'+h(r.what)+', '+r.qty+' '+h(U.pcs)+'</b><small>'+h(U.quotes)+': '+r.quotes.length+'</small></span>'+ic('chev')+'</a></li>'}));scr()}

/* ── Поиск во весь экран ──────────────────────────────────────────────── */
function openSearch(q){var b=$('#search');b.hidden=false;root.classList.add('locked');var i=$('#sq');i.value=q||'';i.focus();drawSq()}
function closeSearch(){var b=$('#search');if(b.hidden)return;b.hidden=true;root.classList.remove('locked')}
function drawSq(){var q=$('#sq').value,r=find(q);$('#sq-res').innerHTML=q.trim().length<2?'<div class="pill-r">'+['quloqchin','телевизор','4/128','ariston','noutbuk'].map(function(x){return '<button type="button" data-q="'+x+'">'+x+'</button>'}).join('')+'</div>':r.length?'<ul class="sq-l">'+r.map(function(g){return '<li><a href="#/p/'+g.id+'"><img src="'+K.img+'/p-'+g.id+'.webp" alt=""><span>'+h(g.n)+'</span><em>'+sum(price(g.id))+'</em></a></li>'}).join('')+'</ul>':'<p class="empty">'+h(U.nothing)+'</p>';
  $$('#sq-res [data-q]').forEach(function(b){b.onclick=function(){$('#sq').value=b.getAttribute('data-q');drawSq()}});$$('#sq-res a').forEach(function(a){a.addEventListener('click',closeSearch)})}
function bindSearch(){$$('[data-search]').forEach(function(b){b.onclick=function(){openSearch('')}})}
$('#sq').addEventListener('input',drawSq);$('#sq-x').onclick=closeSearch;
$('#sq-form').addEventListener('submit',function(e){e.preventDefault();var q=$('#sq').value.trim();closeSearch();location.hash='#/s/'+encodeURIComponent(q)});

/* ── Маршруты ────────────────────────────────────────────────────────── */
var prevH='#/',curH='';
function render(){var hs=location.hash||'#/';if(curH&&hs!==curH)prevH=curH;curH=hs;var p=hs.slice(1).split('/').filter(Boolean);closeSheet();
  if(!p.length)home();
  else if(p[0]==='c'){var c=p[1]||'all';list(c==='all'?U.catalog:(K.subs[c]||U.catalog),c==='all'?K.goods:K.goods.filter(function(g){return g.cat===c}),c)}
  else if(p[0]==='s'){var q=decodeURIComponent(p.slice(1).join('/'));list('«'+q+'»',find(q),null)}
  else if(p[0]==='p')product(+p[1],p[2]);
  else if(p[0]==='cmp')compare();
  else if(p[0]==='cart')cart();
  else if(p[0]==='checkout')checkout();
  else if(p[0]==='o')order(p[1]);
  else if(p[0]==='rfq')rfq();
  else if(p[0]==='me')me();
  else home();
  bindSearch();badges();$$('[data-back]').forEach(function(b){b.onclick=function(){location.hash=prevH&&prevH!==location.hash?prevH:'#/'}})}
addEventListener('hashchange',render);
render();

/* Шапка (правило владельца, 15.10.2026): при любой прокрутке прячется и
   возвращается только через 3 секунды после полной остановки. */
var top=$('#top'),IDLE=3000,idleT=0;
function headIdle(){if(!top)return;clearTimeout(idleT);
  if(!top.contains(d.activeElement))top.classList.add('hide');
  idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}
addEventListener('scroll',headIdle,{passive:true});
})();
