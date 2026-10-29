/* Neoline: поведение страницы. Прокрутку не перехватываем: сцены только
   читают, сколько прошли, и двигают transform и opacity. Состояние демо —
   в браузере: корзина nl-cart-1, заказы nl-orders-1 (их читает панель),
   статусы и базы камер из панели nl-panel-1, конструктор nl-cfg-1. */
(function(){
var d=document,w=window,$=function(s,r){return(r||d).querySelector(s)},$$=function(s,r){return[].slice.call((r||d).querySelectorAll(s))};
var D=JSON.parse($('#nl-data').textContent),T=D.t,L=D.l;
var RM=w.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function get(k,def){try{var v=localStorage.getItem(k);return v?JSON.parse(v):def}catch(e){return def}}
function put(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function sum(n){return fmt(n)+' '+T.sum}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var byId={};D.p.forEach(function(p){byId[p.id]=p});
function img(n,wd){return'/protos/neoline/p/'+n+'-'+wd+'.webp'}
var toastT=0;function toast(m){var t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('on')},2200)}

/* Шапка: прячется при любой прокрутке, возвращается через 3 с после последнего события. */
var top=$('.top'),dock=$('#dock'),IDLE=3000,idleT=0;
function headIdle(){if(!top)return;clearTimeout(idleT);
  if(!top.contains(d.activeElement))top.classList.add('hide');
  idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}

/* Заголовок первого экрана: слова выезжают по очереди, когда заставка ушла. */
$$('.hero h1 .w>span').forEach(function(s,i){s.style.transitionDelay=(120+i*70)+'ms'});
(function heroIn(){if(d.documentElement.classList.contains('nli')){setTimeout(heroIn,150);return}$$('.hero .rise').forEach(function(e){e.classList.add('on')})})();

/* Появление блоков. */
var io='IntersectionObserver'in w?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'}):null;
$$('.rise,.tilt,.pop').forEach(function(e){if(e.closest('.hero'))return;if(io&&!RM)io.observe(e);else e.classList.add('on')});

/* Текст по словам загорается по прокрутке (Text Reveal). */
$$('[data-reveal]').forEach(function(el){el.innerHTML=el.textContent.split(' ').map(function(x){return'<span class="rw">'+esc(x)+'</span>'}).join(' ')});

/* Жидкое стекло: блик рамки идёт за пальцем. */
d.addEventListener('pointermove',function(e){var g=e.target.closest&&e.target.closest('.glass');if(!g)return;var r=g.getBoundingClientRect();g.style.setProperty('--gx',((e.clientX-r.left)/r.width*100)+'%');g.style.setProperty('--gy',((e.clientY-r.top)/r.height*100)+'%')},{passive:true});
/* Подсветка карточки за курсором (Spotlight Card). */
d.addEventListener('pointermove',function(e){var c=e.target.closest&&e.target.closest('.card');if(!c)return;var r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px')},{passive:true});
/* Наклон прибора на первом экране за курсором. */
var tb=$('[data-tiltbox]'),tilt=$('[data-tilt]'),tx=0,ty=0;
if(tb&&!RM&&matchMedia('(pointer: fine)').matches)tb.addEventListener('pointermove',function(e){var r=tb.getBoundingClientRect();tx=((e.clientX-r.left)/r.width-.5);ty=((e.clientY-r.top)/r.height-.5);frame()},{passive:true});

/* Всё, что зависит от прокрутки, считается в одном кадре. */
var velo=$$('.velo .row'),vx=[0,0],lastY=scrollY,speed=0,ticking=false;
var road=$('.road'),caps=$$('.cap'),bars=$$('.prog i b'),chips=$$('.rlist span'),pole=$('.scene .pole'),car=$('.scene .car'),dev=$('.scene .dev'),oled=$('#oled');
var dash=$('#dash'),DASH=10;if(dash){var s='';for(var i=0;i<DASH;i++)s+='<rect x="-4" y="-20" width="8" height="40" rx="3" fill="#cfd8e0"/>';dash.innerHTML=s}
var dashes=dash?$$('rect',dash):[];
var STAGES=[{k:L==='ru'?'КОРДОН':'KORDON',z:L==='ru'?'в спину':'orqadan',v:60,c:[1,2]},{k:L==='ru'?'АВТОКОН':'AVTOKON',z:L==='ru'?'перекрёсток':'chorraha',v:70,c:[3]},{k:L==='ru'?'ТИШИНА':'SOKINLIK',z:L==='ru'?'зона тишины':'sokinlik zonasi',v:60,c:[]},{k:'GPS',z:L==='ru'?'база обновлена':'baza yangilandi',v:60,c:[0,5,6]}];
var sx=$$('.sx'),reveal=$$('[data-reveal]'),par=$$('[data-par]');
function clamp(v){return v<0?0:v>1?1:v}
function frame(){if(ticking)return;ticking=true;requestAnimationFrame(tick)}
function tick(){ticking=false;var y=scrollY,vh=innerHeight;
  speed=speed*.86+(y-lastY)*.14;lastY=y;
  /* Параллакс первого экрана: слои с разной скоростью. */
  if(y<vh*1.4&&!RM)par.forEach(function(e){var k=+e.getAttribute('data-par');e.style.transform='translate3d(0,'+(y*k)+'px,0)'+(e===tilt?' rotateY('+(tx*10)+'deg) rotateX('+(-ty*8)+'deg)':'')});
  /* Радар в деле. */
  if(road&&!RM){var R=road.getBoundingClientRect(),p=clamp(-R.top/(R.height-vh));
    if(R.top<vh&&R.bottom>0){var st=Math.min(3,Math.floor(p*4)),lp=p*4-st;
      caps.forEach(function(c,i){c.classList.toggle('on',i===st)});
      bars.forEach(function(b,i){b.style.transform='scaleX('+(i<st?1:i===st?lp:0)+')'});
      var S=STAGES[st];chips.forEach(function(c,i){c.classList.toggle('on',S.c.indexOf(i)>=0)});
      var dist=Math.max(0,Math.round((1-lp)*65)*10);
      $('#o-type').textContent=S.k;$('#o-zone').textContent=S.z;$('#o-lim').textContent=S.v;
      $('#o-sp').textContent=st===2?'··':String(S.v);
      $('#o-d').textContent=st===2||st===3?'':dist+' '+T.m;
      $('#o-bar').style.transform='scaleX('+(st>=2?0:lp)+')';oled.classList.toggle('al',st<2&&lp>.6);
      /* Камера на столбе приближается: масштаб по перспективе. */
      var z=st<2?lp:0,sc=.35+z*z*2.2;pole.style.transform='translate('+(-50+z*160)+'%,'+(z*z*30)+'%) scale('+sc+')';pole.style.opacity=st<2?1:0;
      car.style.transform='translateX(-50%) translateY('+(Math.sin(p*40)*1.2)+'px)';
      dev.style.transform='translateY('+(Math.sin(p*22)*4)+'px)';
      dashes.forEach(function(r,i){var q=((i/DASH)+p*6)%1,yy=190+q*q*360,xx=400,sc2=.15+q*q*2.2;r.setAttribute('transform','translate('+xx+' '+yy+') scale('+sc2+')');r.setAttribute('opacity',(q*.9).toFixed(2))});
    }}
  /* Переход между секциями: входящая поднимается и проявляется. */
  if(!RM)sx.forEach(function(s){var r=s.getBoundingClientRect();if(r.top>vh||r.bottom<0)return;var e=clamp((vh-r.top)/(vh*.6));s.style.transform='translate3d(0,'+((1-e)*60)+'px,0) scale('+(.96+.04*e)+')';s.style.opacity=(.35+.65*e).toFixed(3)});
  reveal.forEach(function(el){var r=el.getBoundingClientRect();if(r.top>vh||r.bottom<0)return;var e=clamp((vh*.85-r.top)/(vh*.5)),ws=$$('.rw',el);ws.forEach(function(x,i){x.classList.toggle('on',i<e*ws.length+.5||RM)})});
  if(dock)dock.classList.toggle('off',y<vh*.6);
  if(Math.abs(speed)>.3)frame();
}
addEventListener('scroll',function(){headIdle();frame()},{passive:true});
addEventListener('resize',frame);frame();
/* Бегущие строки: своя скорость плюс скорость прокрутки (Scroll Velocity), только пока видны. */
var vbox=$('.velo'),von=false;if(vbox&&io&&!RM){new IntersectionObserver(function(es){von=es[0].isIntersecting;if(von)requestAnimationFrame(roll)}).observe(vbox)}
function roll(){if(!von)return;speed*=.94;velo.forEach(function(r,i){var dir=i?1:-1;vx[i]+=dir*(.5+Math.min(Math.abs(speed),60)*.14);var wd=r.scrollWidth/3;if(vx[i]<-wd)vx[i]+=wd;if(vx[i]>0)vx[i]-=wd;r.style.transform='translate3d('+vx[i]+'px,0,0)'});requestAnimationFrame(roll)}

/* Стенд: ракурсы X-COP 8900 пальцем и стрелками. */
var turn=$('#turn');if(turn){var shots=$$('img',turn),dots=$$('.dots i',turn),cur=0,x0=null,acc=0;
  function show(i){cur=(i+shots.length)%shots.length;shots.forEach(function(s,k){s.classList.toggle('on',k===cur)});dots.forEach(function(s,k){s.classList.toggle('on',k===cur)})}
  turn.addEventListener('pointerdown',function(e){x0=e.clientX;acc=0;turn.classList.add('used');turn.setPointerCapture&&turn.setPointerCapture(e.pointerId)});
  turn.addEventListener('pointermove',function(e){if(x0===null)return;acc+=e.clientX-x0;x0=e.clientX;var step=Math.max(24,turn.clientWidth/shots.length/1.4);while(acc>step){show(cur-1);acc-=step}while(acc<-step){show(cur+1);acc+=step}});
  ['pointerup','pointercancel'].forEach(function(n){turn.addEventListener(n,function(){x0=null})});
  turn.addEventListener('keydown',function(e){if(e.key==='ArrowLeft'){show(cur-1);turn.classList.add('used')}if(e.key==='ArrowRight'){show(cur+1);turn.classList.add('used')}});
  if(!RM){var auto=setInterval(function(){if(turn.classList.contains('used')){clearInterval(auto);return}var r=turn.getBoundingClientRect();if(r.top<innerHeight&&r.bottom>0)show(cur+1)},1400)}}

/* Каталог: разделы, поиск, порядок. */
var grid=$('#grid'),cards=$$('.card',grid),tab='all',q='',srt='pop';
function apply(){var shown=0;cards.forEach(function(c){var ok=(tab==='all'||c.getAttribute('data-cat')===tab)&&(!q||c.getAttribute('data-q').indexOf(q)>=0);c.hidden=!ok;if(ok)shown++});
  $('#empty').hidden=shown>0;
  var list=cards.slice().sort(function(a,b){var pa=+a.getAttribute('data-price'),pb=+b.getAttribute('data-price');if(srt==='lo')return pa-pb;if(srt==='hi')return pb-pa;var A=byId[a.getAttribute('data-id')],B=byId[b.getAttribute('data-id')];return(B.pop-A.pop)||(B.s-A.s)});
  list.forEach(function(c){grid.insertBefore(c,$('#empty'))})}
function setTab(c){tab=c;$$('.tabs button').forEach(function(b){b.setAttribute('aria-selected',b.getAttribute('data-tab')===c?'true':'false')});apply()}
$$('.tabs button').forEach(function(b){b.addEventListener('click',function(){setTab(b.getAttribute('data-tab'))})});
$('#q').addEventListener('input',function(e){q=e.target.value.trim().toLowerCase();apply()});
$('#sort').addEventListener('change',function(e){srt=e.target.value;apply()});
$$('[data-cat]').forEach(function(g){if(g.classList.contains('card'))return;g.addEventListener('click',function(e){e.preventDefault();setTab(g.getAttribute('data-cat'));$('#catalog').scrollIntoView({block:'start'})})});
apply();

/* Корзина и окно снизу/справа. */
var cart=get('nl-cart-1',{}),sheet=$('#sheet'),mode='';
function cartN(){var n=0;for(var k in cart)n+=cart[k];$('#cartn').textContent=n||'';return n}
function addOn(id){var c=get('nl-cfg-1',null);return!c||c[id]!==false}
function gifts(){return D.gift.ids.filter(function(id){return cart[id]})}
function cartTotal(){var s=0;for(var k in cart)s+=byId[k].p*cart[k];return s}
function open(m,title){mode=m;$('#shh').textContent=title;sheet.classList.toggle('pm',m==='pm');sheet.classList.add('on');requestAnimationFrame(function(){sheet.classList.add('in')});d.body.style.overflow='hidden'}
function close(){sheet.classList.remove('in');d.body.style.overflow='';setTimeout(function(){sheet.classList.remove('on')},350)}
$$('[data-close]',sheet).forEach(function(b){b.addEventListener('click',close)});
d.addEventListener('keydown',function(e){if(e.key==='Escape'&&sheet.classList.contains('on'))close()});
function buy(id){var p=byId[id];if(!p||!p.s)return;cart[id]=(cart[id]||0)+1;put('nl-cart-1',cart);cartN();toast(T.added);renderCart()}
function line(p,qty,gift){return'<div class="li'+(gift?' gift':'')+'"><img src="'+img(p.im[0],800)+'" alt=""><div><b>'+esc(gift?T.gift+': '+p.n:p.n)+'</b><small>'+(gift?T.free:sum(p.p))+'</small></div>'+(gift?'':'<div class="qty"><button type="button" data-q="m" data-id="'+p.id+'" aria-label="'+T.less+'"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 12h12"/></svg></button><span>'+qty+'</span><button type="button" data-q="p" data-id="'+p.id+'" aria-label="'+T.more+'"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 12h12M12 6v12"/></svg></button></div>')+'</div>'}
function renderCart(){if(mode&&mode!=='cart')return;var h='',n=cartN();
  if(!n){h='<p style="color:var(--tx2)">'+T.empty+'</p>'}else{for(var k in cart)h+=line(byId[k],cart[k]);gifts().forEach(function(){h+=line(byId[D.gift.gift],1,true)})}
  $('#shb').innerHTML=h;
  $('#shf').innerHTML=n?'<div class="tot2"><span>'+T.tot+'</span><b>'+sum(cartTotal())+'</b></div><p style="margin:8px 0 12px;color:var(--mu);font-size:14px">'+T.deliv+'</p><button type="button" class="btn btn-a" style="width:100%" id="tocheck">'+T.next+'</button>':'';
  var tc=$('#tocheck');if(tc)tc.addEventListener('click',checkout)}
$('#shb').addEventListener('click',function(e){var b=e.target.closest('[data-q]');if(!b)return;var id=b.getAttribute('data-id');cart[id]+=b.getAttribute('data-q')==='p'?1:-1;if(cart[id]<=0)delete cart[id];put('nl-cart-1',cart);renderCart()});
function showCart(){mode='cart';open('cart',T.cart);renderCart()}
$('#cartb').addEventListener('click',showCart);
function checkout(){mode='check';$('#shh').textContent=T.checkout;var pays=T.pays.slice();if(addOn('pay'))pays=pays.concat(T.paysPlus);
  $('#shb').innerHTML='<label class="fld"><span>'+T.name+'</span><input id="fn" autocomplete="name"></label><label class="fld"><span>'+T.phone+'</span><input id="fp" type="tel" inputmode="tel" autocomplete="tel" placeholder="+998"></label><label class="fld"><span>'+T.addr+'</span><input id="fa" autocomplete="street-address"></label><div class="fld"><span>'+T.pay+'</span><div class="pays">'+pays.map(function(x,i){return'<label><input type="radio" name="pay" value="'+esc(x)+'"'+(i?'':' checked')+'>'+esc(x)+'</label>'}).join('')+'</div></div>';
  $('#shf').innerHTML='<div class="tot2"><span>'+T.tot+'</span><b>'+sum(cartTotal())+'</b></div><div style="display:flex;gap:8px;margin-top:12px"><button type="button" class="btn btn-g" id="toback">'+T.back+'</button><button type="button" class="btn btn-a" style="flex:1" id="place">'+T.checkout+'</button></div>';
  $('#toback').addEventListener('click',showCart);$('#place').addEventListener('click',place)}
function place(){var n=$('#fn').value.trim(),ph=$('#fp').value.trim();if(!n||ph.replace(/\D/g,'').length<7){toast(T.need);return}
  var orders=get('nl-orders-1',[]),id=1043+orders.length,items=[];for(var k in cart)items.push([+k,cart[k]]);
  orders.unshift({id:id,at:Date.now(),n:n,ph:ph,a:$('#fa').value.trim(),pay:(d.querySelector('input[name=pay]:checked')||{}).value||'',items:items,g:gifts(),sum:cartTotal()});
  put('nl-orders-1',orders);cart={};put('nl-cart-1',cart);cartN();track(id)}
function status(id){var s=get('nl-panel-1',{}).st||{};return s[id]||0}
function track(id){mode='ok';var o=(get('nl-orders-1',[]).filter(function(x){return x.id===id})[0]);if(!o)return;var st=status(id);
  if(!sheet.classList.contains('on'))open('ok',T.order+' №'+id);else $('#shh').textContent=T.order+' №'+id;
  $('#shb').innerHTML='<div class="okv"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg></div><b style="font:700 20px/1.3 var(--hd)">'+T.ok+'</b><p style="color:var(--tx2)">'+T.okp+' <a href="tel:+998948887943">+998 (94) 88879-43</a></p><ul class="track">'+T.st.map(function(x,i){return'<li'+(i<=st?' class="done"':'')+'>'+x+'</li>'}).join('')+'</ul></div>';
  $('#shf').innerHTML=addOn('admin')?'<a class="btn btn-g" style="width:100%" href="'+D.panel+'">'+T.panel+'</a>':'';
  mine()}
function mine(){var o=get('nl-orders-1',[])[0],m=$('#mine');if(!o){m.classList.remove('on');return}m.classList.add('on');m.querySelector('span').textContent=T.mine+' · '+T.st[status(o.id)];m.onclick=function(){track(o.id)}}
addEventListener('storage',function(e){if(e.key==='nl-panel-1'){mine();if(mode==='ok'&&sheet.classList.contains('on')){var o=get('nl-orders-1',[])[0];if(o)track(o.id)}upd()}});
mine();cartN();

/* Окно товара. */
function pm(id){var p=byId[id];mode='pm';open('pm',p.n);
  $('#shb').innerHTML='<div class="pmg"><div><div class="main"><img id="pmi" src="'+img(p.im[0],1600)+'" alt="'+esc(p.n)+'"></div><div class="thumbs">'+p.im.map(function(n,i){return'<button type="button" data-i="'+n+'" aria-current="'+(i?'false':'true')+'"><img src="'+img(n,i?1200:800)+'" alt=""></button>'}).join('')+'</div></div><div><h3>'+esc(p.n)+'</h3><div class="badges"><span>'+T.war+'</span><span>'+T.dl+'</span><span>'+T.nasiya+'</span></div><ul>'+p.tx.map(function(x){return'<li>'+esc(x)+'</li>'}).join('')+'</ul><div class="pr">'+sum(p.p)+(p.o?'<s>'+sum(p.o)+'</s>':'')+'</div>'+(D.gift.ids.indexOf(p.id)>=0?'<p style="color:var(--ac2);font-weight:700">'+T.gift+'</p>':'')+'<div class="act"><button type="button" class="btn btn-a" data-buy="'+p.id+'"'+(p.s?'':' disabled')+'>'+T.buy+'</button><a class="btn btn-g" href="'+p.u+'" target="_blank" rel="noopener">'+T.site+'</a></div></div></div>';
  $('#shf').innerHTML='';
  $$('.thumbs button',sheet).forEach(function(b){b.addEventListener('click',function(){var n=b.getAttribute('data-i');$('#pmi').src=img(n,n.slice(-2)==='-0'?1600:1200);$$('.thumbs button',sheet).forEach(function(x){x.setAttribute('aria-current',x===b?'true':'false')})})})}
d.addEventListener('click',function(e){var b=e.target.closest('[data-buy]');if(b){e.preventDefault();buy(b.getAttribute('data-buy'));showCart();return}
  var o=e.target.closest('[data-open]');if(o){pm(o.getAttribute('data-open'))}});

/* Сравнение: до трёх. */
var cmp=get('nl-cmp-1',[]);
function method(p){var s=p.tx.join(' ');return/Wi-Fi Hotspot/i.test(s)?T.upd.wifi:/OTG/i.test(s)?T.upd.otg:/Wi-Fi/i.test(s)?T.upd.app:T.upd.cab}
function renderCmp(){$$('[data-cmp]').forEach(function(b){b.setAttribute('aria-pressed',cmp.indexOf(+b.getAttribute('data-cmp'))>=0?'true':'false')});
  var dk=$('#cmpdock'),sec=$('#compare');dk.classList.toggle('on',cmp.length>0);$('#cmpn').textContent=cmp.length+' '+T.cmpN;sec.hidden=!cmp.length;
  if(!cmp.length)return;var ps=cmp.map(function(i){return byId[i]});
  var rows=[['',function(p){return'<img src="'+img(p.im[0],800)+'" alt=""><b>'+esc(p.n)+'</b>'}],[T.rows[0],function(p){return sum(p.p)}],[T.rows[1],function(p){return D.cats[p.c]}],[T.rows[2],method],[T.rows[3],function(p){return p.tx.slice(0,4).map(esc).join('<br>')}]];
  $('#cmpt').innerHTML=rows.map(function(r){return'<tr><th>'+r[0]+'</th>'+ps.map(function(p){return'<td>'+r[1](p)+'</td>'}).join('')+'</tr>'}).join('')}
d.addEventListener('click',function(e){var b=e.target.closest('[data-cmp]');if(!b)return;var id=+b.getAttribute('data-cmp'),i=cmp.indexOf(id);if(i>=0)cmp.splice(i,1);else{if(cmp.length>=3){toast(T.cmpMax);return}cmp.push(id)}put('nl-cmp-1',cmp);renderCmp()});
$('#cmpclr').addEventListener('click',function(){cmp=[];put('nl-cmp-1',cmp);renderCmp()});
renderCmp();

/* Подбор: четыре вопроса, правила по их описаниям. */
var quiz=$('#quiz');if(quiz){var ans={},steps=$$('.step',quiz),pips=$$('.steps i',quiz);
  function go(i){steps.forEach(function(s,k){s.classList.toggle('on',k===i)});pips.forEach(function(s,k){s.classList.toggle('on',k<=i)})}
  steps.forEach(function(s,i){$$('.opts button',s).forEach(function(b){b.addEventListener('click',function(){$$('.opts button',s).forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});ans[s.getAttribute('data-q')]=b.getAttribute('data-v');if(i<steps.length-2)setTimeout(function(){go(i+1)},220);else{recs();setTimeout(function(){go(steps.length-1)},220)}})})});
  $('#qagain').addEventListener('click',function(){ans={};$$('.opts button',quiz).forEach(function(x){x.setAttribute('aria-pressed','false')});go(0)});
  function recs(){var lim=ans.budget==='1'?1e6:ans.budget==='2'?2.5e6:1e9,lo=ans.budget==='3'?2.5e6:0;
    var list=D.p.filter(function(p){if(!p.s||p.c==='sale')return false;var tx=p.tx.join(' ');
      if(ans.goal==='radar'&&!(p.c==='radar'&&!p.h))return false;if(ans.goal==='dvr'&&p.c!=='dvr')return false;if(ans.goal==='hyb'&&!p.h)return false;if(ans.goal==='audio'&&p.c!=='audio')return false;
      if(ans.mount==='hide'&&ans.goal!=='audio'&&!/Скрыт|yashirin|Yashirin/i.test(tx)&&p.c==='radar')return false;
      return true}).map(function(p){var tx=p.tx.join(' '),sc=0,why=[];
      if(p.p<=lim&&p.p>=lo){sc+=3;why.push(T.why.cheap)}
      if(ans.goal==='radar'||ans.goal==='hyb')why.push(T.why[p.h?'hyb':'radar']);if(ans.goal==='dvr')why.push(T.why.dvr);if(ans.goal==='audio')why.push(T.why.audio);
      if(ans.mount==='hide'&&/Скрыт|yashirin/i.test(tx)){sc+=3;why.push(T.why.hide)}
      if(ans.car==='work'&&/вертикал|vertikal|коммерческ|tijorat/i.test(tx)){sc+=3;why.push(T.why.work)}
      sc+=p.pop*2;return{p:p,sc:sc,why:why}}).sort(function(a,b){return b.sc-a.sc||Math.abs(a.p.p-lim/2)-Math.abs(b.p.p-lim/2)}).slice(0,3);
    $('#recs').innerHTML=list.map(function(r){return'<div class="rec"><img src="'+img(r.p.im[0],800)+'" alt=""><div><b>'+esc(r.p.n)+'</b><small>'+sum(r.p.p)+' · '+esc(r.why.join(', '))+'</small></div><button type="button" class="btn btn-a btn-s" data-buy="'+r.p.id+'">'+T.buy+'</button></div>'}).join('')}}

/* Обновления по модели. Версию базы ставит панель, по умолчанию — демо. */
function base(id){var b=(get('nl-panel-1',{}).base||{})[id];if(b)return{v:b.v,dt:b.dt,demo:false};var dd=new Date(Date.now()-((id%9)+1)*864e5);return{v:'v'+(dd.getMonth()+1)+'.'+dd.getDate(),dt:dd.toISOString().slice(0,10),demo:true}}
var uq=$('#uq');function upd(){if(!uq)return;var s=uq.value.trim().toLowerCase();
  var list=D.p.filter(function(p){return(p.c==='radar'||p.c==='dvr'||p.c==='sale')&&(!s||p.n.toLowerCase().indexOf(s)>=0)}).slice(0,s?6:3);
  $('#ures').innerHTML=list.length?list.map(function(p){var b=base(p.id);return'<div class="upd"><img src="'+img(p.im[0],800)+'" alt=""><div><b>'+esc(p.n)+'</b><div class="meta"><span>'+method(p)+'</span><span>'+T.upd.base+' '+b.v+'</span><span>'+b.dt.split('-').reverse().join('.')+(b.demo?' · '+T.upd.demo:' · '+T.upd.from)+'</span></div></div><a class="btn btn-g btn-s" href="'+(L==='ru'?'https://neoline.uz/ru/update-ru/':'https://neoline.uz/update/')+'" target="_blank" rel="noopener">'+T.upd.go+'</a></div>'}).join(''):'<p style="color:var(--mu)">'+T.upd.none+'</p>'}
if(uq){uq.addEventListener('input',upd);upd()}

/* Бот: сообщения появляются по очереди, когда телефон на экране. */
var tgp=$('#tgp');if(tgp){var ms=$$('.msg',tgp),shown=false;var o2=io?new IntersectionObserver(function(es){if(es[0].isIntersecting&&!shown){shown=true;ms.forEach(function(m,i){setTimeout(function(){m.classList.add('on')},RM?0:300+i*900)})}},{threshold:.4}):null;if(o2)o2.observe(tgp);else ms.forEach(function(m){m.classList.add('on')})}

/* Панель в окне: цифры из заказов этого макета и демо-зерна. */
(function(){var o=get('nl-orders-1',[]),s=o.reduce(function(a,x){return a+x.sum},0),k1=$('#ak1'),k2=$('#ak2'),sp=$('#aspark');if(!k1)return;
  var zr=7,rnd=function(){zr=(zr*16807)%2147483647;return zr/2147483647},days=[];for(var i=0;i<14;i++)days.push(40+rnd()*60);
  k1.textContent=fmt((days.reduce(function(a,b){return a+b},0)*480000+s)/1e6)+' '+(L==='ru'?'млн':'mln');k2.textContent=String(Math.round(days.reduce(function(a,b){return a+b},0)/9)+o.length);
  sp.innerHTML=days.map(function(v){return'<i style="height:'+v+'%"></i>'}).join('')})();

/* Остатки из 1С: время обновления (демо). */
var et=$('#erpt');if(et){var dt=new Date(Date.now()-7*6e4);et.textContent=T.erp+' '+('0'+dt.getHours()).slice(-2)+':'+('0'+dt.getMinutes()).slice(-2)}

/* Допы из конструктора (он на первой странице, nl-cfg-1): выключенный доп — его блока нет. */
function cfgApply(){var cfg=get('nl-cfg-1',{});D.add.forEach(function(a){$$('[data-addon="'+a.id+'"]').forEach(function(el){el.classList.toggle('addon-off',cfg[a.id]===false)})});frame()}
addEventListener('storage',function(e){if(e.key==='nl-cfg-1')cfgApply()});
cfgApply();
})();
