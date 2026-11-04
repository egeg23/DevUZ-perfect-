/* Сайт макета SAMIST AUTO. Прокрутку только читаем (ни scrollTo, ни
   preventDefault на колесе). Связь с панелью — память браузера: сайт пишет
   заявки sm-req-1, панель — статусы и наличие с ценами sm-stock-1, сайт их
   показывает. Конструктор первой страницы пишет sm-cfg-1: выключенный доп
   прячет свой блок. Формы ничего не отправляют наружу: заявка ложится в
   браузер (её видит панель) и открывает их телефон с готовым текстом. */
(function(){
var d=document,w=window,$=function(s,r){return(r||d).querySelector(s)},$$=function(s,r){return[].slice.call((r||d).querySelectorAll(s))};
var D=JSON.parse($('#sm-data').textContent),T=D.t,L=D.l;
var RM=w.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var TOUCH=w.matchMedia&&matchMedia('(pointer: coarse)').matches;
function get(k,def){try{var v=localStorage.getItem(k);return v?JSON.parse(v):def}catch(e){return def}}
function put(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function sum(n){return fmt(n)+' '+T.sum}
function mln(n){return(n/1e6).toFixed(n%1e6?1:0).replace('.',',')+' '+T.mln}
function cl(x){return x<0?0:x>1?1:x}
function ease(x){return 1-Math.pow(1-x,3)}
var toastT=0;function toast(m){var t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('on')},2600)}
var I=function(p){return'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+p+'</svg>'};
var IC={close:I('<path d="M6 6l12 12M18 6 6 18"/>'),phone:I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>'),sms:I('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/>'),
  plus:I('<path d="M12 5v14M5 12h14"/>'),cmp:I('<path d="M4 6h7v14H4zM13 4h7v16h-7z"/>'),cal:I('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),coin:I('<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4"/>'),down:I('<path d="M12 4v12M6 10l6 6 6-6M4 20h16"/>'),doc:I('<path d="M7 3h7l5 5v13H7Z"/><path d="M14 3v5h5"/>')};

/* ── Общее: шапка 3 с, появление, стекло ─────────────────────────── */
var top=$('.top'),IDLE=3000,idleT=0;
function headIdle(){if(!top)return;clearTimeout(idleT);
  if(!top.contains(d.activeElement))top.classList.add('hide');
  idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}
addEventListener('scroll',headIdle,{passive:true});
var io='IntersectionObserver'in w?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'}):null;
function reveal(r){$$('.rise,.tilt,.pop,.slide,.rl',r).forEach(function(e){if(io&&!RM)io.observe(e);else e.classList.add('on')})}
reveal(d);
d.addEventListener('pointermove',function(e){var g=e.target.closest&&e.target.closest('.glass');if(!g)return;var r=g.getBoundingClientRect();g.style.setProperty('--gx',((e.clientX-r.left)/r.width*100)+'%');g.style.setProperty('--gy',((e.clientY-r.top)/r.height*100)+'%')},{passive:true});

/* Допы из конструктора: выключенный — блок пропадает, его замена появляется. */
var cfg=get('sm-cfg-1',{});function on(id){return cfg[id]!==false}
$$('[data-addon]').forEach(function(e){e.hidden=!on(e.getAttribute('data-addon'))});
$$('[data-off]').forEach(function(e){e.hidden=on(e.getAttribute('data-off'))});

/* Наличие и цены из панели: sm-stock-1 = { id: { st: 'in'|'res'|'sold', p: цена } }. */
var STOCK=get('sm-stock-1',{});
var M=D.models.map(function(m){var o=STOCK[m.id]||{};m.st=o.st||'in';m.price=o.p||m.uzs;return m}),byId={};M.forEach(function(m){byId[m.id]=m});

/* ── Заявка: в браузер (видит панель) и их телефон с готовым текстом ── */
function send(kind,model,text,extra){var l=get('sm-req-1',[]),id=4100+l.length+1;
  l.unshift(Object.assign({id:id,at:Date.now(),kind:kind,model:model||'',text:text,st:0},extra||{}));put('sm-req-1',l);mine();
  var body=T.hello+' '+text;
  if(TOUCH){location.href='sms:'+D.tel+'?&body='+encodeURIComponent(body)}
  else{var done=function(){toast(T.sent_pc)};if(navigator.clipboard)navigator.clipboard.writeText(body).then(done,done);else done()}
  return id}
var mineB=$('#mine');
function mine(){var l=get('sm-req-1',[]);if(!mineB)return;mineB.hidden=!l.length;var dot=$('.dot',mineB);if(dot&&l[0])dot.classList.toggle('ok',l[0].st>=2)}
mine();
if(mineB)mineB.addEventListener('click',function(){var l=get('sm-req-1',[]);
  sheet(T.mine,'<div class="mine-st">'+l.slice(0,5).map(function(x){var st=x.st|0;return'<div class="mine-i"><b>'+esc(T['k_'+x.kind])+(x.model?' · '+esc(x.model):'')+'</b><small>#'+x.id+' · '+new Date(x.at).toLocaleDateString(L==='ru'?'ru-RU':'uz-UZ')+'</small>'+
    '<div class="steps">'+[0,1,2,3].map(function(k){return'<i class="'+(st===4?(k===0?'on':'no'):(k<=st?'on':''))+'"></i>'}).join('')+'</div><p class="st-now">'+esc(T['st'+st])+'</p></div>'}).join('')+'</div><p class="note">'+esc(T.mine_note)+'</p>')});
addEventListener('storage',function(e){if(e.key==='sm-req-1')mine();if(e.key==='sm-stock-1'){STOCK=get('sm-stock-1',{});M.forEach(function(m){var o=STOCK[m.id]||{};m.st=o.st||'in';m.price=o.p||m.uzs});renderGrid();toast(T.upd)}});

/* Шторка для коротких окон: «Моя заявка». */
var sh=$('#sheet');
function sheet(h,html){$('#shh').textContent=h;$('#shb').innerHTML=html;sh.classList.add('on');d.body.style.overflow='hidden';setTimeout(function(){$('.x',sh).focus()},50)}
function shut(){sh.classList.remove('on');d.body.style.overflow=''}
$$('[data-close]',sh).forEach(function(b){b.addEventListener('click',shut)});

/* ── Первый экран: слова, параллакс, счёт ───────────────────────── */
var hero=$('.hero');if(hero){requestAnimationFrame(function(){hero.classList.add('on')});
  var hb=$('.hero-bg img',hero),pr=0;
  if(!RM)addEventListener('scroll',function(){if(pr)return;pr=requestAnimationFrame(function(){pr=0;var y=Math.min(scrollY,innerHeight);hb.style.setProperty('--py',(y*/*~*/.22).toFixed(1)+'px')})},{passive:true});
  $$('[data-count]',hero).forEach(function(e){var to=+e.getAttribute('data-count'),t0=performance.now();if(RM){e.textContent=fmt(to);return}(function f(t){var k=cl((t-t0)/1400);e.textContent=fmt(to*ease(k));if(k<1)requestAnimationFrame(f)})(t0)})}

/* Бегущая строка брендов: базовая скорость плюс скорость прокрутки. */
var vt=$('.velo-t');if(vt&&!RM){var vx=0,last=scrollY,boost=0;(function run(){var y=scrollY;boost=boost*.9+Math.abs(y-last)*.05;last=y;vx-=.4+boost;var half=vt.scrollWidth/2;if(-vx>half)vx+=half;vt.style.transform='translateX('+vx.toFixed(1)+'px)';requestAnimationFrame(run)})()}

/* ── Сцена по прокрутке: пять машин их площадки ─────────────────────
   Кадры — их фото. Прокрутка выбирает кадр, внутри кадра камера медленно
   подъезжает и сдвигается, соседние кадры растворяются друг в друге. */
var scn=$('#scn');
if(scn){var fr=$$('.scn-f',scn),tx=$('.scn-tx',scn),rail=$$('.scn-rail i',scn),N=fr.length,curI=-1,want2=0,cur2=0,raf2=0;
  function sp(){var r=scn.getBoundingClientRect(),span=r.height-innerHeight;return span>0?cl(-r.top/span):0}
  function setText(i){var m=byId[D.scene[i]];if(!m)return;tx.classList.add('sw');setTimeout(function(){
      $('.scn-i',tx).textContent=(i+1)+' / '+N;$('.scn-n',tx).textContent=m.name;$('.scn-k',tx).textContent=m.kind;
      $('.scn-nums',tx).innerHTML=nums(m).map(function(n){return'<div><b data-to="'+n[1]+'">0</b><span>'+esc(n[0])+'</span></div>'}).join('');
      $('.scn-price b',tx).textContent=sum(m.price);$('.scn-price small',tx).textContent=m.usd?'≈ '+fmt(m.usd)+' $':'';
      $('.scn-open',tx).setAttribute('data-open',m.id);
      tx.classList.remove('sw');$$('[data-to]',tx).forEach(function(e){var to=+e.getAttribute('data-to'),t0=performance.now();(function f(t){var k=RM?1:cl((t-t0)/900);e.textContent=fmt(to*ease(k));if(k<1)requestAnimationFrame(f)})(t0)})},curI<0||RM?0:220)}
  function sframe(p){var x=p*N,i=Math.min(N-1,Math.floor(x));
    fr.forEach(function(f,k){var loc=x-k,o=k===0?cl(1-(loc-1)/.18):k===N-1?cl((loc+.18)/.18):cl((loc+.18)/.18)*cl(1-(loc-1)/.18);
      f.style.opacity=o.toFixed(3);var t=cl(loc);f.style.setProperty('--k',(1.18-.16*t).toFixed(4));f.style.setProperty('--x',((k%2?-1:1)*(2-4*t)).toFixed(2)+'%')});
    rail.forEach(function(r,k){r.style.setProperty('--f',cl(x-k).toFixed(3))});
    if(i!==curI){setText(i);curI=i}}
  function sloop(){raf2=0;var dl=want2-cur2;cur2=Math.abs(dl)<.0005?want2:cur2+dl*.18;sframe(cur2);if(cur2!==want2)raf2=requestAnimationFrame(sloop)}
  if(RM){fr.forEach(function(f){f.style.opacity=1})}
  else{addEventListener('scroll',function(){want2=sp();if(!raf2)raf2=requestAnimationFrame(sloop)},{passive:true});cur2=want2=sp();sframe(cur2)}}
function nums(m){var a=[];if(m.hp)a.push([T.n_hp,m.hp]);if(m.kg)a.push([T.n_kg,m.kg]);if(m.m3&&a.length<3)a.push([T.n_m3,m.m3]);if(m.seats&&a.length<3)a.push([T.n_seats,m.seats]);if(m.tank&&a.length<3)a.push([T.n_tank,m.tank]);return a.slice(0,3)}

/* ── Площадка: вся техника, фильтр по их разделам ────────────────── */
var grid=$('#grid'),F={cat:'all',sort:'cheap',isNew:false};
function tags(m){var t='';if(m.st==='sold')t+='<span class="tg sold">'+T.sold+'</span>';else if(m.st==='res')t+='<span class="tg res">'+T.res+'</span>';if(m.isNew)t+='<span class="tg new">'+T.new+'</span>';if(m.credit)t+='<span class="tg">'+T.credit_tag+'</span>';return t}
function card(m){var s=nums(m).slice(0,2).map(function(n){return'<span><b>'+fmt(n[1])+'</b> '+esc(n[0])+'</span>'}).join('');
  return'<button type="button" class="car pop'+(m.st==='sold'?' off':'')+'" data-open="'+m.id+'"><span class="car-ph"><img src="'+D.img+'/cat/'+m.img[0]+'" width="1280" height="960" alt="'+esc(m.name+', '+m.kind)+'" loading="lazy"><span class="car-tg">'+tags(m)+'</span></span>'+
    '<span class="car-b"><b>'+esc(m.name)+'</b><span class="car-k">'+esc(m.kind)+(m.year?' · '+m.year:'')+'</span><span class="car-s">'+s+'</span><span class="car-p"><b>'+sum(m.price)+'</b><small>'+(m.usd?'≈ '+fmt(m.usd)+' $':'')+'</small></span></span></button>'}
function renderGrid(){if(!grid)return;var l=M.filter(function(m){return(F.cat==='all'||m.cat===F.cat)&&(!F.isNew||m.isNew)});
  l.sort(function(a,b){return F.sort==='cheap'?a.price-b.price:F.sort==='rich'?b.price-a.price:(b.hp||0)-(a.hp||0)});
  grid.innerHTML=l.map(card).join('')||'<p class="empty">'+T.none+'</p>';$('#found').textContent=T.found+': '+l.length;
  $$('.car',grid).forEach(function(e,k){e.style.transitionDelay=(k%6)*40+'ms';if(RM)e.classList.add('on');else requestAnimationFrame(function(){e.classList.add('on')})})}
$$('[data-cat]').forEach(function(b){b.addEventListener('click',function(){F.cat=b.getAttribute('data-cat');$$('[data-cat]').forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});renderGrid()})});
var so=$('#sort');if(so)so.addEventListener('change',function(){F.sort=so.value;renderGrid()});
var nw=$('#onlynew');if(nw)nw.addEventListener('change',function(){F.isNew=nw.checked;renderGrid()});
renderGrid();

/* ── Окно модели: снимок карточки летит в окно («нырок»), полоски цифр ── */
var rz=$('#rz'),ry=$('#ry-st'),rzFrom=null,CN={};D.cats.forEach(function(c){CN[c[0]]=c[1]});
var mdl=$('#mdl'),MAX={hp:390,kg:20000,m3:51,tank:400,seats:31},lastFocus=null;
d.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-open]');if(!b)return;openModel(b.getAttribute('data-open'),$('img',b))});
function openModel(id,from){var m=byId[id];if(!m)return;lastFocus=d.activeElement;
  var bars=[['hp',T.n_hp],['kg',T.n_kg],['m3',T.n_m3],['tank',T.n_tank],['seats',T.n_seats]].filter(function(b){return m[b[0]]}).map(function(b){return'<div class="bar"><div><span>'+esc(b[1])+'</span><b>'+fmt(m[b[0]])+'</b></div><i><em style="--v:'+(m[b[0]]/MAX[b[0]]).toFixed(3)+'"></em></i></div>'}).join('');
  $('#mdl-in').innerHTML='<div class="mdl-g"><div class="mdl-ph" id="mdl-ph">'+m.img.map(function(f,k){return'<img src="'+D.img+'/cat/'+f+'" width="1280" height="960" alt="'+esc(m.name)+', '+T.photo+' '+(k+1)+'"'+(k?' loading="lazy"':'')+(k===0?' class="on"':'')+'>'}).join('')+
    '<div class="mdl-th">'+m.img.map(function(f,k){return'<button type="button" data-ph="'+k+'" aria-pressed="'+(k===0)+'" aria-label="'+T.photo+' '+(k+1)+'"><img src="'+D.img+'/cat/'+f+'" alt="" loading="lazy"></button>'}).join('')+'</div></div>'+
    '<div class="mdl-in"><span class="car-tg" style="position:static">'+tags(m)+'</span><h3 id="mdl-h">'+esc(m.name)+'</h3><p class="car-k">'+esc(m.kind)+(m.year?' · '+m.year:'')+'</p>'+
    '<div class="mdl-pr"><b>'+sum(m.price)+'</b><span>'+(m.usd?'≈ '+fmt(m.usd)+' $':'')+'</span></div>'+
    '<div class="bars">'+bars+'</div>'+
    '<div class="mdl-act"><button type="button" class="btn btn-a" data-want="'+m.id+'">'+IC.sms+'<span>'+T.want+'</span></button>'+
    (on('credit')?'<a class="btn btn-g" href="#credit" data-cred="'+m.id+'">'+IC.coin+'<span>'+T.to_credit+'</span></a>':'')+
    (on('drive')?'<a class="btn btn-g" href="#drive" data-drv="'+m.id+'">'+IC.cal+'<span>'+T.to_drive+'</span></a>':'')+
    (on('compare')?'<button type="button" class="btn btn-g" data-cmp="'+m.id+'">'+IC.cmp+'<span>'+(CMP.indexOf(m.id)>=0?T.in_cmp:T.to_cmp)+'</span></button>':'')+
    (on('fleet')?'<a class="btn btn-g" href="#fleet" data-flt="'+m.id+'">'+IC.doc+'<span>'+T.to_fleet+'</span></a>':'')+'</div>'+
    '<div class="spec">'+m.spec.map(function(s){return'<div><span>'+esc(s[0])+'</span><b>'+esc(s[1])+'</b></div>'}).join('')+'</div>'+
    '<p class="mdl-src">'+T.src+' <a href="'+m.url+'" target="_blank" rel="noopener">autoline</a></p></div></div>';
  $$('[data-ph]',mdl).forEach(function(b){b.addEventListener('click',function(){var k=+b.getAttribute('data-ph');$$('#mdl-ph>img').forEach(function(im,j){im.classList.toggle('on',j===k)});$$('[data-ph]',mdl).forEach(function(x){x.setAttribute('aria-pressed',String(x===b))})})});
  var go=function(){mdl.classList.add('on');d.body.style.overflow='hidden';setTimeout(function(){$('.mdl-x',mdl).focus()},60)};
  /* Нырок: картинка карточки летит туда, где в окне стоит фото (только transform). */
  if(from&&!RM){var a=from.getBoundingClientRect(),fly=d.createElement('div');fly.className='mdl-fly';fly.innerHTML='<img src="'+from.src+'" alt="">';
    fly.style.left=a.left+'px';fly.style.top=a.top+'px';fly.style.width=a.width+'px';fly.style.height=a.height+'px';d.body.appendChild(fly);
    go();var b=$('#mdl-ph').getBoundingClientRect(),sx=b.width/a.width,sy=b.height/a.height;
    fly.animate([{transform:'none',borderRadius:'24px'},{transform:'translate('+(b.left-a.left)+'px,'+(b.top-a.top)+'px) scale('+sx+','+sy+')',borderRadius:'0px'}],{duration:/*~*/560,easing:'cubic-bezier(.2,.7,.2,1)',fill:'forwards'}).onfinish=function(){fly.remove()}}
  else go()}
function closeModel(){mdl.classList.remove('on');d.body.style.overflow=rz&&rz.classList.contains('on')?'hidden':'';if(lastFocus&&lastFocus.focus)lastFocus.focus({preventScroll:true})}
$$('[data-mclose]',mdl).forEach(function(b){b.addEventListener('click',closeModel)});
d.addEventListener('keydown',function(e){if(e.key==='Escape'){if(mdl.classList.contains('on'))closeModel();else if(sh.classList.contains('on'))shut();else if(rz&&rz.classList.contains('on'))closeCat()}});
mdl.addEventListener('click',function(e){var a;
  if((a=e.target.closest('[data-want]'))){var m=byId[a.getAttribute('data-want')];send('buy',m.name,T.t_buy.replace('{m}',m.name).replace('{p}',sum(m.price)));return}
  if((a=e.target.closest('[data-cred]'))){closeModel();setModel('#cr-m',a.getAttribute('data-cred'));calc()}
  if((a=e.target.closest('[data-drv]'))){closeModel();setModel('#dr-m',a.getAttribute('data-drv'))}
  if((a=e.target.closest('[data-flt]'))){closeModel();QTY[a.getAttribute('data-flt')]=(QTY[a.getAttribute('data-flt')]||0)+1;renderFleet()}
  if((a=e.target.closest('[data-cmp]'))){toggleCmp(a.getAttribute('data-cmp'));$('span',a).textContent=CMP.indexOf(a.getAttribute('data-cmp'))>=0?T.in_cmp:T.to_cmp}});
function setModel(sel,id){var s=$(sel);if(s){s.value=id;s.dispatchEvent(new Event('change'))}}

/* ── Подбор под задачу: правила, без модели ─────────────────────── */
var PK={use:'goods',t:'5',b:'any'};
$$('[data-pk]').forEach(function(g){var k=g.getAttribute('data-pk');$$('button',g).forEach(function(b){b.addEventListener('click',function(){PK[k]=b.getAttribute('data-v');$$('button',g).forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});pick()})})});
function pick(){var box=$('#pk-res');if(!box)return;var lim={'1.5':1500,'5':5000,'10':10000,'20':20000}[PK.t],bud={'500':5e8,'800':8e8,'any':1e13}[PK.b];
  var sc=M.filter(function(m){return m.st!=='sold'}).map(function(m){var s=0,why=[];if(m.use.indexOf(PK.use)>=0){s+=4;why.push(T.why_use)}
    if(m.kg){if(m.kg<=lim&&m.kg>=lim*.3){s+=2;why.push(fmt(m.kg)+' '+T.n_kg)}else if(m.kg>lim)s-=1}
    if(m.price<=bud){s+=2}else s-=3;if(m.isNew){s+=1;why.push(T.new)}if(m.credit){s+=.5;why.push(T.credit_tag)}return{m:m,s:s,why:why}});
  sc.sort(function(a,b){return b.s-a.s||a.m.price-b.m.price});
  box.innerHTML=sc.slice(0,3).map(function(x){return'<button type="button" class="res-i" data-open="'+x.m.id+'"><img src="'+D.img+'/cat/'+x.m.img[0]+'" alt="" loading="lazy"><span><b>'+esc(x.m.name)+'</b><small>'+esc(x.m.kind)+' · '+sum(x.m.price)+'</small><em>'+esc(x.why.join(' · ')||T.why_near)+'</em></span></button>'}).join('')}
pick();

/* ── Сравнение до трёх моделей ──────────────────────────────────── */
var CMP=get('sm-cmp-1',[]).filter(function(id){return byId[id]}),cbar=$('#cmp-bar');
function toggleCmp(id){var k=CMP.indexOf(id);if(k>=0)CMP.splice(k,1);else{if(CMP.length>=3)CMP.shift();CMP.push(id)}put('sm-cmp-1',CMP);renderCmp()}
function renderCmp(){if(!cbar||!on('compare'))return;cbar.classList.toggle('on',CMP.length>0);$('span',cbar).textContent=T.cmp_n+': '+CMP.map(function(id){return byId[id].name}).join(', ');
  var tb=$('#cmp-t');if(!tb)return;if(CMP.length<2){tb.innerHTML='<p class="empty">'+T.cmp_hint+'</p>';return}
  var ms=CMP.map(function(id){return byId[id]});
  var rows=[[T.r_price,function(m){return m.price},function(m){return sum(m.price)},'min'],[T.r_kind,null,function(m){return m.kind}],[T.n_hp,function(m){return m.hp},function(m){return m.hp?fmt(m.hp):'·'},'max'],[T.n_kg,function(m){return m.kg},function(m){return m.kg?fmt(m.kg):'·'},'max'],[T.n_m3,function(m){return m.m3},function(m){return m.m3?String(m.m3).replace('.',','):'·'},'max'],[T.n_tank,function(m){return m.tank},function(m){return m.tank?fmt(m.tank):'·'},'max'],[T.n_seats,function(m){return m.seats},function(m){return m.seats||'·'}],[T.r_fuel,null,function(m){return m.fuel||'·'}],[T.r_state,null,function(m){return m.isNew?T.new:T.used}]];
  tb.innerHTML='<div class="tbl-w"><table class="cmp"><thead><tr><th></th>'+ms.map(function(m){return'<th scope="col">'+esc(m.name)+'</th>'}).join('')+'</tr></thead><tbody>'+rows.map(function(r){var vals=ms.map(function(m){return r[2](m)}),diff=vals.some(function(v){return v!==vals[0]}),best=null;
      if(r[1]&&r[3]){var nums=ms.map(r[1]).filter(function(v){return v});if(nums.length>1)best=r[3]==='min'?Math.min.apply(null,nums):Math.max.apply(null,nums)}
      return'<tr'+(diff?' class="df"':'')+'><th scope="row">'+esc(r[0])+'</th>'+ms.map(function(m,k){var v=vals[k],b=best!=null&&r[1](m)===best;return'<td>'+(b?'<b class="best">'+esc(v)+'</b>':esc(v))+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div>'}
if(cbar)renderCmp();
$$('[data-cmpclear]').forEach(function(b){b.addEventListener('click',function(){CMP=[];put('sm-cmp-1',CMP);renderCmp()})});

/* ── Кредит и лизинг: ставку вписывает покупатель со слов банка ────── */
var crm=$('#cr-m');
function calc(){if(!crm)return;var m=byId[crm.value],dp=+$('#cr-dp').value,n=+$('#cr-n').value,r=parseFloat(String($('#cr-r').value).replace(',','.'));
  $('#cr-dpv').textContent=dp+'%';$('#cr-nv').textContent=n+' '+T.mon;var P=m.price,down=P*dp/100,body=P-down;
  $('#cr-p').textContent=sum(P);$('#cr-down').textContent=sum(down);$('#cr-body').textContent=sum(body);
  if(!(r>=0)||r>80){$('#cr-pay').textContent=T.rate_need;$('#cr-over').textContent='·';return null}
  var i=r/1200,pay=i?body*i/(1-Math.pow(1+i,-n)):body/n;$('#cr-pay').textContent=sum(pay);$('#cr-over').textContent=sum(pay*n-body);return{m:m,dp:dp,n:n,r:r,pay:pay,down:down}}
if(crm){$$('#credit input,#credit select').forEach(function(e){e.addEventListener('input',calc);e.addEventListener('change',calc)});calc();
  $('#cr-go').addEventListener('click',function(){var c=calc(),m=byId[crm.value];var txt=T.t_credit.replace('{m}',m.name).replace('{p}',sum(m.price)).replace('{dp}',$('#cr-dp').value+'%').replace('{n}',$('#cr-n').value);if(c)txt+=' '+T.t_credit_pay.replace('{r}',c.r).replace('{pay}',sum(c.pay));send('credit',m.name,txt)})}

/* ── Трейд-ин: фото остаются в браузере, в заявку идёт число снимков ── */
var trf=$('#tr-f');if(trf){$('#tr-ph').addEventListener('change',function(e){var box=$('#tr-pv');box.innerHTML='';[].slice.call(e.target.files||[],0,6).forEach(function(f){var u=URL.createObjectURL(f);box.insertAdjacentHTML('beforeend','<img src="'+u+'" alt="">')})});
  trf.addEventListener('submit',function(e){e.preventDefault();var f=trf.elements;send('trade',f.want.options[f.want.selectedIndex].text,T.t_trade.replace('{o}',f.old.value).replace('{y}',f.year.value).replace('{km}',f.km.value).replace('{m}',f.want.options[f.want.selectedIndex].text),{name:f.name.value,ph:f.ph.value});trf.reset();$('#tr-pv').innerHTML=''})}

/* ── Тест-драйв: модель, день, часть дня ────────────────────────── */
var drf=$('#dr-f');if(drf){var days=$('#dr-days'),DN=L==='ru'?['вс','пн','вт','ср','чт','пт','сб']:['yak','du','se','chor','pay','ju','sha'],t0=new Date(),dsel=null,psel=null;
  for(var k=1;k<=7;k++){var x=new Date(t0.getTime()+k*864e5);days.insertAdjacentHTML('beforeend','<button type="button" aria-pressed="false" data-day="'+x.toISOString().slice(0,10)+'">'+DN[x.getDay()]+', '+x.getDate()+'.'+(x.getMonth()<9?'0':'')+(x.getMonth()+1)+'</button>')}
  $$('[data-day]',drf).forEach(function(b){b.addEventListener('click',function(){dsel=b.textContent;$$('[data-day]',drf).forEach(function(z){z.setAttribute('aria-pressed',String(z===b))})})});
  $$('[data-part]',drf).forEach(function(b){b.addEventListener('click',function(){psel=b.textContent;$$('[data-part]',drf).forEach(function(z){z.setAttribute('aria-pressed',String(z===b))})})});
  drf.addEventListener('submit',function(e){e.preventDefault();if(!dsel||!psel){toast(T.pick_day);return}var m=byId[$('#dr-m').value];send('drive',m.name,T.t_drive.replace('{m}',m.name).replace('{d}',dsel).replace('{p}',psel),{name:drf.elements.name.value,ph:drf.elements.ph.value})})}

/* ── Сервис и запчасти: вкладки ─────────────────────────────────── */
$$('[role="tab"]').forEach(function(b){b.addEventListener('click',function(){var g=b.parentNode;$$('[role="tab"]',g).forEach(function(x){var s=x===b;x.setAttribute('aria-selected',String(s));$('#'+x.getAttribute('aria-controls')).hidden=!s})})});
var svf=$('#sv-f');if(svf)svf.addEventListener('submit',function(e){e.preventDefault();var f=svf.elements;send('service',f.car.value,T.t_service.replace('{c}',f.car.value).replace('{w}',f.what.value).replace('{km}',f.km.value),{name:f.name.value,ph:f.ph.value})});
var ptf=$('#pt-f');if(ptf)ptf.addEventListener('submit',function(e){e.preventDefault();var f=ptf.elements;send('part',f.part.value,T.t_part.replace('{v}',f.vin.value).replace('{p}',f.part.value),{name:f.name.value,ph:f.ph.value})});

/* ── КП для автопарка: набор машин, файл на их бланке ───────────── */
var QTY=get('sm-kp-1',{}),fl=$('#fl-list');
function renderFleet(){if(!fl)return;put('sm-kp-1',QTY);var tot=0,n=0;
  fl.innerHTML=M.filter(function(m){return m.st!=='sold'}).map(function(m){var q=QTY[m.id]||0;tot+=q*m.price;n+=q;return'<div class="qrow"><img src="'+D.img+'/cat/'+m.img[0]+'" alt="" loading="lazy"><span><b>'+esc(m.name)+'</b><small>'+sum(m.price)+'</small></span><span class="qty"><button type="button" data-q="'+m.id+'" data-d="-1" aria-label="'+T.less+'">−</button><span>'+q+'</span><button type="button" data-q="'+m.id+'" data-d="1" aria-label="'+T.more+'">+</button></span></div>'}).join('');
  $('#fl-n').textContent=n;$('#fl-sum').textContent=sum(tot);var b=$('#fl-dl');b.disabled=!n;
  $$('[data-q]',fl).forEach(function(x){x.addEventListener('click',function(){var id=x.getAttribute('data-q');QTY[id]=Math.max(0,(QTY[id]||0)+(+x.getAttribute('data-d')));renderFleet()})})}
renderFleet();
function kpFile(){var co=$('#fl-co').value||T.kp_co,rows=M.filter(function(m){return QTY[m.id]}),tot=rows.reduce(function(a,m){return a+QTY[m.id]*m.price},0),dt=new Date().toLocaleDateString(L==='ru'?'ru-RU':'uz-UZ');
  return new Blob(['<!doctype html><html lang="'+L+'"><meta charset="utf-8"><title>'+esc(T.kp)+'</title><body style="font:15px/1.5 system-ui,sans-serif;max-width:760px;margin:32px auto;padding:0 16px;color:#16181c">'+
    '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #ec3237;padding-bottom:12px"><svg viewBox="0 0 '+D.logo[0]+' '+D.logo[1]+'" width="140" style="color:#2b2d31">'+$('#sm-g').innerHTML+'</svg><div style="text-align:right;font-size:13px">'+esc(D.legal)+'<br>'+esc(D.addr)+'<br>'+esc(D.phone)+'</div></div>'+
    '<h1 style="font-size:24px;margin:24px 0 4px">'+esc(T.kp)+'</h1><p style="margin:0 0 16px;color:#555">'+esc(co)+' · '+dt+'</p>'+
    '<table style="width:100%;border-collapse:collapse"><tr style="background:#f3f4f6"><th style="text-align:left;padding:8px">'+esc(T.kp_m)+'</th><th style="padding:8px">'+esc(T.kp_q)+'</th><th style="text-align:right;padding:8px">'+esc(T.kp_p)+'</th><th style="text-align:right;padding:8px">'+esc(T.kp_s)+'</th></tr>'+
    rows.map(function(m){return'<tr><td style="padding:8px;border-bottom:1px solid #ddd">'+esc(m.name)+'<br><small style="color:#666">'+esc(m.kind)+'</small></td><td style="text-align:center;border-bottom:1px solid #ddd">'+QTY[m.id]+'</td><td style="text-align:right;border-bottom:1px solid #ddd">'+sum(m.price)+'</td><td style="text-align:right;border-bottom:1px solid #ddd">'+sum(m.price*QTY[m.id])+'</td></tr>'}).join('')+
    '<tr><td colspan="3" style="text-align:right;padding:12px 8px;font-weight:700">'+esc(T.kp_tot)+'</td><td style="text-align:right;font-weight:700">'+sum(tot)+'</td></tr></table>'+
    '<p style="color:#666;font-size:13px;margin-top:24px">'+esc(T.kp_note)+'</p><script>onload=function(){setTimeout(function(){print()},400)}<\/script></body></html>'],{type:'text/html'})}
function pacer(minMs){var t0=performance.now(),shown=0;return function(raw){shown=Math.max(shown,Math.min(raw,(performance.now()-t0)/minMs));return shown}}
var dl=$('#fl-dl');if(dl){var ring=$('circle',dl),LN=2*Math.PI*21,url=null;ring.style.strokeDasharray=LN;ring.style.strokeDashoffset=LN;
  dl.addEventListener('click',function(){if(dl.classList.contains('done')){var a=d.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';a.click();return}if(dl.classList.contains('run'))return;
    dl.classList.add('run');dl.setAttribute('role','progressbar');dl.setAttribute('aria-valuemin','0');dl.setAttribute('aria-valuemax','100');
    url=URL.createObjectURL(kpFile());var pc=pacer(RM?200:/*~*/1100),wat=$('.dot-water i',dl);
    (function fr(){var p=pc(1);ring.style.strokeDashoffset=(LN*(1-p)).toFixed(2);wat.style.transform='translateY('+((1-p)*100).toFixed(1)+'%)';dl.setAttribute('aria-valuenow',String(Math.round(p*100)));
      if(p<1)return requestAnimationFrame(fr);dl.classList.remove('run');dl.classList.add('done');dl.removeAttribute('role');dl.removeAttribute('aria-valuenow');$('.dot-l',dl).textContent=T.open;
      var a=d.createElement('a');a.href=url;a.download='samist-kp.html';d.body.appendChild(a);a.click();a.remove();
      var rows=M.filter(function(m){return QTY[m.id]});send('fleet',rows.map(function(m){return m.name+' x'+QTY[m.id]}).join(', '),T.t_fleet.replace('{c}',$('#fl-co').value||T.kp_co).replace('{l}',rows.map(function(m){return m.name+' x'+QTY[m.id]}).join(', ')))})()})}

/* ── Связаться: короткая форма ─────────────────────────────────── */
var cf=$('#ct-f');if(cf)cf.addEventListener('submit',function(e){e.preventDefault();var f=cf.elements;send('call','',T.t_call.replace('{n}',f.name.value).replace('{q}',f.q.value),{name:f.name.value,ph:f.ph.value});cf.reset()});
$$('[data-buy]').forEach(function(b){b.addEventListener('click',function(){send('call','',T.t_call.replace('{n}','').replace('{q}',T.q_default))})});

/* ── Бот: переписка проигрывается, когда окно на экране ────────── */
var tg=$('#tg-b');if(tg){var played=0,play=function(){if(played)return;played=1;var ms=$$('.msg',tg);ms.forEach(function(m,k){setTimeout(function(){m.classList.add('on')},RM?0:600+k*/*~*/1100)})};
  if(io&&!RM){var tio=new IntersectionObserver(function(es){if(es[0].isIntersecting){play();tio.disconnect()}},{threshold:.4});tio.observe(tg)}else play()}
/* ── Площадка по разделам (как #qator у SamAuto): наведение высвечивает
   машину, нажатие — она выезжает вперёд, остальные гаснут, и камера
   проваливается в раздел: снимок раскрывается во весь экран, за ним модели. */
function ryReset(){if(!ry)return;ry.classList.remove('pick','hl');$$('.ry-c',ry).forEach(function(x){x.classList.remove('on','hot')})}
if(ry){$$('.ry-c',ry).forEach(function(c){
  var hot=function(){if(TOUCH||ry.classList.contains('pick'))return;$$('.ry-c',ry).forEach(function(x){x.classList.toggle('hot',x===c)});ry.classList.add('hl')};
  var cool=function(){c.classList.remove('hot');if(!$('.ry-c.hot',ry))ry.classList.remove('hl')};
  c.addEventListener('pointerenter',hot);c.addEventListener('pointerleave',cool);c.addEventListener('focus',hot);c.addEventListener('blur',cool);
  c.addEventListener('click',function(){if(ry.classList.contains('pick'))return;ry.classList.remove('hl');$$('.ry-c',ry).forEach(function(x){x.classList.remove('hot');x.classList.toggle('on',x===c)});ry.classList.add('pick');
    setTimeout(function(){openCat(c.getAttribute('data-cat'),c)},RM?0:/*~*/620)})})}
function fillCat(cat){var l=M.filter(function(m){return m.cat===cat}).sort(function(a,b){return a.price-b.price}),lo=l[0].price,hi=l[l.length-1].price;
  $('#rz-h').textContent=CN[cat];$('#rz-s').textContent=(l.length>1?T.rz_range.replace('{a}',mln(lo)).replace('{b}',mln(hi)):sum(lo));
  $('#rz-tabs').innerHTML=D.cats.filter(function(c){return M.some(function(m){return m.cat===c[0]})}).map(function(c){return'<button type="button" class="chip" data-rzcat="'+c[0]+'" aria-pressed="'+(c[0]===cat)+'">'+esc(c[1])+'</button>'}).join('');
  var g=$('#rz-grid');g.innerHTML=l.map(card).join('');$$('.car',g).forEach(function(e,k){e.style.setProperty('--i',k);e.classList.add('on')});
  $$('[data-rzcat]',rz).forEach(function(b){b.addEventListener('click',function(){fillCat(b.getAttribute('data-rzcat'))})})}
function openCat(cat,c){if(!rz)return;rzFrom=c;var im=$('img',c);fillCat(cat);$('#rz-bgi').src=im.src;$('#rz-in').scrollTop=0;
  var go=function(){rz.classList.add('on');d.body.style.overflow='hidden';setTimeout(function(){rz.classList.add('show');$('.rz-x',rz).focus({preventScroll:true})},RM?0:280)};
  if(RM){go();return}
  /* Снимок нажатой машины летит во весь экран (только transform), под ним открывается раздел. */
  var a=im.getBoundingClientRect(),fly=d.createElement('div');fly.className='rz-fly';fly.innerHTML='<img src="'+im.src+'" alt="">';
  fly.style.left=a.left+'px';fly.style.top=a.top+'px';fly.style.width=a.width+'px';fly.style.height=a.height+'px';d.body.appendChild(fly);
  var k=Math.max(innerWidth/a.width,innerHeight/a.height);
  var an=fly.animate([{transform:'none',opacity:1},{transform:'translate('+(innerWidth/2-a.left-a.width*k/2)+'px,'+(innerHeight/2-a.top-a.height*k/2)+'px) scale('+k+')',opacity:1,offset:.75},{transform:'translate('+(innerWidth/2-a.left-a.width*k/2)+'px,'+(innerHeight/2-a.top-a.height*k/2)+'px) scale('+k+')',opacity:0}],{duration:/*~*/900,easing:'cubic-bezier(.6,0,.2,1)',fill:'forwards'});
  setTimeout(go,520);an.onfinish=function(){fly.remove()}}
function closeCat(){if(!rz)return;rz.classList.remove('show');setTimeout(function(){rz.classList.remove('on');if(!mdl.classList.contains('on'))d.body.style.overflow='';ryReset();if(rzFrom&&rzFrom.focus)rzFrom.focus({preventScroll:true})},RM?0:300)}
$$('[data-rzclose]').forEach(function(b){b.addEventListener('click',closeCat)});
addEventListener('pageshow',ryReset);
})();
