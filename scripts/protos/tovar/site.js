(function(){
'use strict';
/* site: главная tovar.uz. Первый экран — жидкое стекло: слово tovar крупно,
   ценник-линза за буквой v, вокруг их товары. По прокрутке товары садятся
   в витрину три на три, поиск печатает «4/128», остаётся Galaxy A13 ELSO.UZ,
   с краёв прилетают realme и Tecno SHOP-IT с той же памятью, дешевле всех
   отмечен. Прокрутку не перехватывает: сцена стоит на sticky, GSAP
   ScrollTrigger только читает положение (scrub), всё пишется в transform и
   opacity. Ниже поиск на двух языках, механики, айфон, кабинет, цена.
   Без движения всё стоит на месте. */
var d=document,W=window,root=d.documentElement,K=JSON.parse(d.getElementById('tv-site').textContent),U=K.ui;
var $=function(s,r){return (r||d).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))};
var REDUCED=false;try{REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
var G=W.gsap,ST=W.ScrollTrigger,MOTION=!REDUCED&&!!(G&&ST);
if(MOTION)G.registerPlugin(ST);else root.classList.add('no-pin');
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,'\u00a0')}
function sum(n){return fmt(n)+'\u00a0'+K.sum}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function pad(n){return (n<10?'0':'')+n}
var clamp=function(x,a,b){return Math.min(b,Math.max(a,x))};
var out3=function(x){return 1-Math.pow(1-x,3)};
var back=function(x){var c=1.6;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2)};
var lerp=function(a,b,k){return a+(b-a)*k};
var GD={};K.goods.forEach(function(g){GD[g.id]=g});
function dmy(iso){var p=iso.split('-');return p[2]+'.'+p[1]+'.'+p[0]}

/* Появление блоков: у каждого своё движение (классы a-*). */
if('IntersectionObserver' in W&&!REDUCED){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
  $$('.rv').forEach(function(el){io.observe(el)});
}else $$('.rv').forEach(function(el){el.classList.add('in')});

/* ── Первый экран ─────────────────────────────────────────────────────── */
var stage=$('.stage'),prs=$$('.pr'),word=$('.hero-word'),vt=$('.hero-word .v'),lens=$('.lens'),hq=$('#hero-q'),hqi=$('#hq-i'),cap=$('.hero-cap'),outC=$('.hero-out'),hint=$('.hero-hint');
/* Орбита: центр (доля ширины и высоты), размер к карточке, поворот. */
var ORB_D=[[.11,.32,1.5,-10],[.86,.28,1.6,6],[.87,.74,1.5,-6],[.19,.86,1.05,12],[.8,.9,1,-8],[.12,.66,1.3,4],[.66,.17,.8,-14],[.36,.16,.82,8],[.5,.44,1.2,0]];
var ORB_M=[[.16,.15,1.1,-10],[.82,.13,1.15,8],[.87,.57,.85,-6],[.12,.52,.85,12],[.85,.9,.95,-8],[.16,.91,1,4],[.64,.24,.72,-14],[.36,.25,.72,8],[.5,.4,.95,0]];
var Lx={},trioIds=K.trio.slice().sort(function(a,b){return GD[a].p-GD[b].p}),A13=K.trio[0];
var Wd=0,Hd=0,cw=0,ch=0,gap=0,gx=[],gy=[],tx=[],ty=0,ts=1,qA=0,qB=0,mob=false,lensBox=null,prog=0,typed=-1;
var badge=null;
function measure(){if(!stage)return;Wd=stage.clientWidth;Hd=stage.clientHeight;mob=Wd<760;gap=mob?10:16;
  qB=Math.max(72,Hd*.08);var y0=qB+64,avail=Hd-y0-16;
  cw=Math.min((Wd-32-2*gap)/3,210);ch=cw*1.3;if(3*ch+2*gap>avail){ch=(avail-2*gap)/3;cw=ch/1.3}
  stage.style.setProperty('--cw',cw.toFixed(1)+'px');stage.style.setProperty('--ch',ch.toFixed(1)+'px');
  var x0=(Wd-(3*cw+2*gap))/2;gx=[];gy=[];for(var i=0;i<9;i++){gx.push(x0+(i%3)*(cw+gap));gy.push(y0+Math.floor(i/3)*(ch+gap))}
  /* Три продавца: в ряд, крупнее, если есть место. */
  ts=Math.min(mob?1.05:1.35,(Wd-32-2*gap)/(3*cw));var tw=cw*ts,tg=mob?10:24,tx0=(Wd-(3*tw+2*tg))/2;
  tx=[0,1,2].map(function(i){return tx0+i*(tw+tg)+(tw-cw)/2});var oh=outC?outC.offsetHeight:0,oTop=Hd-24-oh;ty=Math.max(y0+(ch*ts-ch)/2,(y0+oTop)/2-ch/2);
  if(word)word.style.setProperty('--wt',(mob?36:40)+'%');
  qA=mob?Hd*.56:Hd*.62;
  if(vt&&stage){var sr=stage.getBoundingClientRect(),vr=vt.getBoundingClientRect();var lw=vr.width*(mob?1.55:1.45);lensBox={w:lw,x:vr.left-sr.left+vr.width/2-lw/2,y:vr.top-sr.top+vr.height*.5-lw*1.25*.5-vr.height*.06}}
  if(cap)cap.style.setProperty('--ct',(qA+76)+'px');
}
function orbOf(k){var o=(mob?ORB_M:ORB_D)[k];return {x:o[0]*Wd-cw/2,y:o[1]*Hd-ch/2,s:o[2],r:o[3]}}
function setv(el,k,v){el.style.setProperty(k,v)}
function scene(p){prog=p;
  var still=p>.16;stage.classList.toggle('still',still);
  prs.forEach(function(el,k){
    var id=+el.getAttribute('data-id'),x,y,s,r,o=1,c=0,m=0,t=0;
    if(k<9){var ob=orbOf(k),a=clamp((p-(.12+k*.022))/.2,0,1),e=out3(a);
      x=lerp(ob.x,gx[k],e);y=lerp(ob.y,gy[k],e);s=lerp(ob.s,1,e);r=lerp(ob.r,0,e);c=clamp((a-.45)/.4,0,1);m=clamp((p-(.3+k*.012))/.08,0,1);
      var f=clamp((p-.52)/.14,0,1),e2=out3(f);
      if(id===A13){var sl=trioIds.indexOf(id);x=lerp(x,tx[sl],e2);y=lerp(y,ty,e2);s=lerp(s,ts,e2);t=e2}
      else if(f>0){o=clamp(1-f*1.6,0,1);s*=1-.2*f;y+=f*40}
    }else{var sl2=trioIds.indexOf(id),f2=clamp((p-(.55+(k-9)*.03))/.14,0,1),e3=out3(f2),from=sl2<1?-cw*1.6:Wd+cw*.6;
      x=lerp(from,tx[sl2],e3);y=ty+(1-e3)*30;s=ts;r=(1-e3)*(sl2<1?-14:14);o=clamp(f2*3,0,1);c=1;t=1;m=clamp((f2-.5)*2,0,1)}
    setv(el,'--x',x.toFixed(1)+'px');setv(el,'--y',y.toFixed(1)+'px');setv(el,'--s',s.toFixed(4));setv(el,'--r',r.toFixed(2)+'deg');
    setv(el,'--o',o.toFixed(3));setv(el,'--c',c.toFixed(3));setv(el,'--m',m.toFixed(3));setv(el,'--t',t.toFixed(3));
    el.classList.toggle('tiled',t>.5);
  });
  if(badge)setv(badge,'--bd',back(clamp((p-.7)/.08,0,1)).toFixed(3));
  if(word){setv(word,'--wo',(1-clamp((p-.06)/.14,0,1)).toFixed(3));setv(word,'--ws',(1-.25*clamp(p/.2,0,1)).toFixed(4))}
  if(lens&&lensBox){var lk=clamp((p-.04)/.2,0,1),le=out3(lk);setv(lens,'--lw',lensBox.w.toFixed(1)+'px');
    setv(lens,'--lx',(lensBox.x+le*(Wd/2-lensBox.w/2-lensBox.x)).toFixed(1)+'px');setv(lens,'--ly',(lensBox.y-le*Hd*.18).toFixed(1)+'px');
    setv(lens,'--ls',(1+le*.7).toFixed(4));setv(lens,'--lr',(-8+le*20).toFixed(2)+'deg');setv(lens,'--lo',(1-clamp((p-.1)/.14,0,1)).toFixed(3))}
  if(hq)setv(hq,'--qy',lerp(qA,qB,out3(clamp((p-.1)/.2,0,1))).toFixed(1)+'px');
  if(hqi&&d.activeElement!==hqi){var tk=clamp((p-.42)/.1,0,1),str=U.types[0],n=Math.round(tk*str.length);if(n!==typed){typed=n;hqi.value=str.slice(0,n)}}
  if(cap)setv(cap,'--co',(1-clamp((p-.03)/.08,0,1)).toFixed(3)),cap.style.pointerEvents=p<.05?'auto':'none';
  if(hint)hint.style.opacity=(1-clamp(p*8,0,1)).toFixed(3);
  if(outC){var q=clamp((p-.74)/.1,0,1);outC.style.opacity=q.toFixed(3);outC.style.transform='translateY('+((1-q)*30).toFixed(1)+'px)';outC.style.pointerEvents=q>.6?'auto':'none'}
}
if(stage&&MOTION){
  var cheap=$('.pr[data-id="'+trioIds[0]+'"]');if(cheap){badge=d.createElement('span');badge.className='pr-badge';badge.textContent=U.cheap;cheap.appendChild(badge)}
  $$('.pr img').forEach(function(im,i){im.classList.add('bob');im.style.animationDelay=(-i*.8)+'s'});
  var go=function(){measure();scene(prog)};
  if(d.fonts&&d.fonts.ready)d.fonts.ready.then(go);
  measure();scene(0);
  ST.create({trigger:'.hero',start:'top top',end:'bottom bottom',scrub:.6,onUpdate:function(s){scene(s.progress)}});
  addEventListener('resize',go);
}
if(hq)hq.addEventListener('submit',function(e){e.preventDefault();var q=(hqi.value||'').trim();location.href=K.app+(q?'#/s/'+encodeURIComponent(q):'#/')});

/* Бегущая строка: скорость от прокрутки. */
var mq=$('.marq-t');
if(MOTION&&mq){var anim=mq.getAnimations?mq.getAnimations()[0]:null,lastY=scrollY,vel=0;
  if(anim)(function f(){var y=scrollY,v=Math.abs(y-lastY);lastY=y;vel+=(v-vel)*.12;anim.playbackRate=1+Math.min(vel/6,5);requestAnimationFrame(f)})()}

/* ── Поиск на двух языках: слово покупателя → раздел, память, название ── */
function find(q){q=(q||'').toLowerCase().trim();if(q.length<2)return [];
  var cats={};Object.keys(K.syn).forEach(function(c){K.syn[c].forEach(function(w){if(q.indexOf(w)>=0||w.indexOf(q)===0)cats[c]=1})});
  var mem=(q.match(/\d+\s*\/\s*\d+/)||[''])[0].replace(/\s/g,'');
  return K.goods.filter(function(g){var n=(g.n+' '+g.alt).toLowerCase();
    if(mem&&g.mem!==mem)return false;if(mem&&!/[a-zа-яё‘]{3,}/i.test(q.replace(mem,'')))return true;
    return cats[g.cat]||n.indexOf(q)>=0}).sort(function(a,b){return a.p-b.p})}
function ageDays(iso){return Math.round((new Date(K.today)-new Date(iso))/864e5)}
function card(g,i){var s=K.sellers[g.s],old=ageDays(g.upd)>30;
  return '<a class="gc drop" style="--d:'+Math.min(i,8)*40+'ms" href="'+K.app+'#/p/'+g.id+'"><span class="gc-im"><img src="'+K.img+'/p-'+g.id+'.webp" alt="" loading="lazy"></span><span class="gc-b"><b>'+h(g.n)+'</b><em>'+sum(g.p)+'</em><small>'+h(s.n)+' · '+(g.st?U.inStock:U.onOrder)+'</small><i class="chip '+(old?'chip-warn':'chip-ok')+'">'+h(U.upd.replace('{d}',dmy(g.upd)))+'</i></span></a>'}
var sx=$('#sx'),sxr=$('#sx-res'),sxn=$('#sx-n');
function drawSx(){if(!sx)return;var r=find(sx.value);sxn.textContent=sx.value.trim().length>1?U.found.replace('{n}',r.length):'';
  sxr.innerHTML=r.length?r.slice(0,8).map(card).join(''):'<p class="sx-none">'+h(U.none)+'</p>'}
if(sx){sx.addEventListener('input',drawSx);$('#sx-form').addEventListener('submit',function(e){e.preventDefault();location.href=K.app+'#/s/'+encodeURIComponent(sx.value.trim())});
  $$('.sx-try button').forEach(function(b){b.onclick=function(){sx.value=b.getAttribute('data-q');drawSx()}});drawSx()}
var pop=$('#pop');
function drawPop(id){if(!pop)return;pop.innerHTML=K.popular[id].map(function(n,i){return '<a class="drop" style="--d:'+i*30+'ms" href="'+K.app+'#/c/all">'+h(n)+'</a>'}).join('')}
$$('.pills button').forEach(function(b){b.onclick=function(){$$('.pills button').forEach(function(x){x.setAttribute('aria-selected',x===b)});drawPop(b.getAttribute('data-p'))}});
drawPop('goods');

/* ── Механики: каждую можно потрогать ─────────────────────────────────── */
var rqGo=$('#rq-go'),rqA=$('#rq-a');
if(rqGo)rqGo.onclick=function(){rqGo.disabled=true;rqA.innerHTML='';[U.q1,U.q3,U.q2].forEach(function(t,i){setTimeout(function(){var li=d.createElement('li');li.innerHTML=i===0?'<b>'+h(t)+'</b>':h(t);rqA.appendChild(li);if(i===2)rqGo.disabled=false},REDUCED?0:500+i*700)})};
var frGo=$('#fr-go');if(frGo)frGo.onclick=function(){$('#fr-st').innerHTML='<i class="chip chip-ok">'+h(U.frOk)+'</i>';frGo.disabled=true};
var boGo=$('#bo-go');if(boGo)boGo.onclick=function(){var v=+($('#bo-v').value||'').replace(/\D/g,''),a=$('#bo-ans'),floor=1000000;
  if(v<floor){a.className='bo-ans no';a.textContent=U.boLow.replace('{p}',sum(floor));return}a.className='bo-ans';a.textContent='…';setTimeout(function(){a.textContent=U.boYes},REDUCED?0:700)};
var ld=$('#ld');
if(ld){var L=JSON.parse(ld.getAttribute('data-l')),n=1;
  var draw=function(){var i=0;L.forEach(function(s,k){if(n>=s[0])i=k});$$('.ld-st span',ld).forEach(function(s,k){s.classList.toggle('on',k===i)});
    $('#ld-n').textContent=n;$('#ld-sum').innerHTML=fmt(L[i][1])+' '+h(U.per)+'<br>'+h(U.total)+' '+sum(L[i][1]*n)};
  $('#ld-m').onclick=function(){n=Math.max(1,n-1);draw()};$('#ld-p').onclick=function(){n=Math.min(40,n+(n<5?1:n<10?5:5));draw()};draw()}

/* ── Айфон и кабинет грузятся, когда до них близко ─────────────────────── */
var frames=$$('iframe[data-src]');function loadF(f){if(!f.src)f.src=f.getAttribute('data-src')}
if('IntersectionObserver' in W){var fo=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){loadF(e.target);fo.unobserve(e.target)}})},{rootMargin:'600px 0px'});frames.forEach(function(f){fo.observe(f)})}else frames.forEach(loadF);
var pf=$('#ph-path iframe');
$$('[data-go]').forEach(function(b){b.addEventListener('click',function(){
  $$('[data-go]').forEach(function(x){x.removeAttribute('aria-current')});b.setAttribute('aria-current','step');
  if(!pf)return;loadF(pf);var hh=b.getAttribute('data-go');
  try{pf.contentWindow.location.hash=hh}catch(e){pf.src=pf.getAttribute('data-src').split('#')[0]+hh}
  if(innerWidth<1024)pf.closest('.pt-ph').scrollIntoView({behavior:REDUCED?'auto':'smooth',block:'center'})})});

/* ── Шапка (правило владельца, 15.10.2026): при любой прокрутке прячется и
   возвращается только через 3 секунды после полной остановки. Инерция
   прокрутки на телефоне тоже шлёт scroll, так что таймер ждёт её конца.
   Пока фокус с клавиатуры внутри шапки, она не прячется. */
var top=$('#top'),dock=$('#dock'),hero=$('.hero'),IDLE=3000,idleT=0,tick=false;
function headIdle(){if(!top)return;clearTimeout(idleT);
  if(!top.contains(d.activeElement))top.classList.add('hide');
  idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}
function frame(){tick=false;if(dock&&hero)dock.classList.toggle('on',hero.getBoundingClientRect().bottom<innerHeight*.6)}
addEventListener('scroll',function(){headIdle();if(!tick){tick=true;requestAnimationFrame(frame)}},{passive:true});frame();

/* ── Конструктор цены: новый облик по акции и допы тумблерами ─────────── */
var rows=$$('#konstruktor input[data-k]'),sumEl=$('#kit-total-sum'),addEl=$('#kit-add'),nEl=$('#kit-cnt'),shown=K.offer.base,r2=0;
function rollK(to){var from=shown,st=performance.now();cancelAnimationFrame(r2);if(REDUCED){shown=to;sumEl.textContent=fmt(to)+'\u00a0$';return}(function f(now){var k=Math.min(1,(now-st)/500);shown=Math.round(from+(to-from)*out3(k));sumEl.textContent=fmt(shown)+'\u00a0$';if(k<1)r2=requestAnimationFrame(f)})(st)}
function kitPrice(){var add=0,c=0;rows.forEach(function(r){if(r.checked){add+=+r.getAttribute('data-p');c++}});addEl.textContent=fmt(add)+'\u00a0$';nEl.textContent=c;rollK(K.offer.base+add)}
rows.forEach(function(r){r.onchange=kitPrice});
var all=$('#kit-all');if(all)all.onclick=function(){var on=rows.some(function(r){return !r.checked});rows.forEach(function(r){r.checked=on});kitPrice()};
var nw=$('#kit-new');if(nw)nw.onclick=function(){var isNew={};K.offer.items.forEach(function(x){if(x.n)isNew[x.id]=1});rows.forEach(function(r){r.checked=!!isNew[r.getAttribute('data-k')]});kitPrice()};
var cp=$('#kit-copy');if(cp)cp.onclick=function(){var lines=[K.offer.head,'• '+K.offer.baseName+': '+fmt(K.offer.base)+' $'];rows.forEach(function(r){if(r.checked){var it=K.offer.items.filter(function(x){return x.id===r.getAttribute('data-k')})[0];lines.push('• '+it.t+': '+fmt(it.p)+' $')}});lines.push(K.offer.totalW+': '+sumEl.textContent);
  var txt=lines.join('\n');try{navigator.clipboard.writeText(txt).then(function(){cp.textContent=K.offer.copied})}catch(e){cp.textContent=K.offer.copied}};
/* Отсчёт 48 часов с первого открытия на этом устройстве. */
var tm=$('#tm'),start=Date.now();try{var s0=+localStorage.getItem('tv-offer-1');if(s0&&s0<=Date.now())start=s0;else localStorage.setItem('tv-offer-1',String(start))}catch(e){}
var end=start+K.offer.hours*36e5;
function tickT(){var left=Math.max(0,end-Date.now());if(!left){$('#timer').classList.add('over');tm.textContent='00:00:00';$('#timer span').firstChild.textContent=K.offer.ended;return}var hh=Math.floor(left/36e5),mm=Math.floor(left%36e5/6e4),ss=Math.floor(left%6e4/1e3);tm.textContent=pad(hh)+':'+pad(mm)+':'+pad(ss);setTimeout(tickT,1000)}
if(tm)tickT();
/* Стекло первого экрана живёт видео и на телефоне: клиенты открывают макет из Telegram. При «меньше движения» и экономии трафика стоит кадр. */
var wv=$('.w-vid');if(wv&&!REDUCED&&!(navigator.connection&&navigator.connection.saveData)){wv.src=wv.getAttribute('data-src');var pl=wv.play();if(pl&&pl.then)pl.then(function(){wv.classList.add('on')},function(){})}
})();
