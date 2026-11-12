(function(){
'use strict';
/* premium: сцена первого экрана, стеклянные блоки, глобус, аудитории,
   стоимость. Прокрутку только читает: ни scrollTo, ни preventDefault на
   колесе. */
var d=document,W=window,root=d.documentElement,K=JSON.parse(d.getElementById('cf-data').textContent);
var $=function(s,r){return (r||d).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))};
var REDUCED=root.classList.contains('rm');
function pad(n){return (n<10?'0':'')+n}
function cl(x){return x<0?0:x>1?1:x}
function lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function inView(el,cb){if(!('IntersectionObserver' in W)){cb(true);return}new IntersectionObserver(function(es){cb(es[0].isIntersecting)},{threshold:.25}).observe(el)}

/* ── Сцена первого экрана: путь препарата по прокрутке ────────────────
   Завод → пустая баночка падает в цех → наполняется таблетками → фирменная
   коробка → полёт над трассой «от лица коробки» → полка аптеки с именем
   бренда (владелец, 12.11.2026). Пять роликов между шестью ключевыми
   кадрами; кадры (компьютеру 16:9, телефону 9:16) зашифрованы пачками, ключ
   по ссылке сайта. На ключевых кадрах прокрутка «стоит» (HOLD), чтобы
   прочитать подпись. Пока кадры не пришли, без ключа и при экономии
   трафика — те же шесть ключевых кадров плавной сменой. Прокрутку только
   читаем. Распакованных кадров не больше MAXB. */
var hs=$('.hs');
if(hs){
  var cv=$('.hs-cv',hs),cx=cv.getContext('2d'),posters=$$('.hs-p',hs),caps=$$('.hs-cap',hs),intro=$('.hs-intro',hs),dots=$$('.hs-steps i',hs),hl=$('#hs-load'),hn=$('#hs-n'),hb=$('#hs-b'),words=$$('h1 .w>span',hs);
  var DESK=false;try{DESK=matchMedia('(min-width: 900px) and (orientation: landscape)').matches}catch(e){}
  var S=K.scene,F=DESK?S.d:S.p,KF=DESK?S.dk:S.pk,raw=[],bm={},bmN=[],MAXB=14,ready=false,want=0,cur=-1,drawn=-1,raf=0,vis=true,dpr=Math.min(W.devicePixelRatio||1,2);
  /* Шкала сцены: стоянка на ключевом кадре, потом ролик до следующего. */
  var HOLD=[.2,0,.35,.35,.35,.55],SEG=[],TOT=0,HS=[],i0;
  for(i0=0;i0<KF.length;i0++){HS.push([TOT,TOT+HOLD[i0]]);SEG.push([TOT,TOT+HOLD[i0],KF[i0],KF[i0]]);TOT+=HOLD[i0];if(i0<KF.length-1){SEG.push([TOT,TOT+1,KF[i0],KF[i0+1]]);TOT+=1}}
  function sm(t){t=cl(t);return t*t*(3-2*t)}
  function frameOf(p){var u=cl(p)*TOT;for(var i=0;i<SEG.length;i++){var g=SEG[i];if(u<=g[1]||i===SEG.length-1){var t=g[1]>g[0]?cl((u-g[0])/(g[1]-g[0])):0;return g[2]+(g[3]-g[2])*(.5*t+.5*sm(t))}}return F-1}
  function prog(){var r=hs.getBoundingClientRect(),span=r.height-innerHeight;return span>0?cl(-r.top/span):0}
  function size(){cv.width=Math.round(cv.clientWidth*dpr);cv.height=Math.round(cv.clientHeight*dpr);drawn=-1}
  function want4(i){if(bm[i]||bm[i]===0||!raw[i])return;bm[i]=0;
    createImageBitmap(new Blob([raw[i]],{type:'image/webp'})).then(function(im){bm[i]=im;bmN.push(i);
      var f=frameOf(cur);while(bmN.length>MAXB){var o=bmN.shift();if(Math.abs(o-f)>4&&bm[o]&&bm[o].close){bm[o].close();delete bm[o]}else{bmN.push(o);break}}
      drawn=-1;poke()},function(){delete bm[i]})}
  function cover(im,a){var cw=cv.width,ch=cv.height,s=Math.max(cw/im.width,ch/im.height),w=im.width*s,h=im.height*s;cx.globalAlpha=a;cx.drawImage(im,(cw-w)*.5,(ch-h)*.5,w,h)}
  function nearest(i){for(var k=0;k<F;k++){if(bm[i-k])return bm[i-k];if(bm[i+k])return bm[i+k]}return null}
  function draw(){var f=frameOf(cur),i=Math.floor(f),k=f-i;
    for(var j=-2;j<=4;j++)want4(Math.max(0,Math.min(F-1,i+j)));
    /* Нужный кадр не пришёл — ближайший пришедший. */
    if(!raw[i]){for(var q=1;q<F;q++){if(raw[i-q]){i=i-q;k=0;break}if(raw[i+q]){i=i+q;k=0;break}}want4(i)}
    var A=bm[i]||nearest(i);if(!A)return;cover(A,1);var B=bm[i+1];if(B&&k>.02)cover(B,k);cx.globalAlpha=1}
  function paint(p){
    var u=cl(p)*TOT,f=frameOf(p),a,i;
    a=1-sm((u-.12)/.3);intro.style.opacity=a.toFixed(3);intro.style.transform='translateY('+((a-1)*28).toFixed(1)+'px)';intro.classList.toggle('off',a<.4);
    for(i=0;i<words.length;i++)words[i].style.setProperty('--u',cl((u-i*.05)/.08).toFixed(3));
    caps.forEach(function(el,j){var h=HS[j+2],last=j===caps.length-1,x=sm((u-(h[0]-.34))/.2)*(last?1:1-sm((u-(h[1]+.08))/.2));
      el.style.opacity=x.toFixed(3);el.style.transform='translateY('+((1-x)*26).toFixed(1)+'px)';el.classList.toggle('on',x>.5)});
    dots.forEach(function(dn,j){dn.classList.toggle('on',f>=KF[j===0?0:j+1]-.5)});
    if(!ready){var s=0;while(s<KF.length-2&&f>KF[s+1])s++;var t=sm((f-KF[s])/(KF[s+1]-KF[s]));
      posters.forEach(function(pp,j){pp.style.opacity=j<=s?'1':j===s+1?t.toFixed(3):'0'})}
    hs.classList.toggle('moved',p>.01);hs.classList.toggle('end',p>.97)}
  function loop(){raf=0;var dl=want-cur;cur=cur<0||Math.abs(dl)<.0003?want:cur+dl*.13;
    if(ready&&cur!==drawn){draw();drawn=cur}paint(cur);if(vis&&cur!==want)raf=requestAnimationFrame(loop)}
  /* Пока шапка над тёмной сценой (владелец, 12.11.2026, на телефоне: «белые
     штуки мелькают при скролле»): шапка тёмным стеклом, цвет строки браузера
     тёмный. Светлая капсула и светлая строка мигали поверх сцены. */
  var tc=$('meta[name="theme-color"]'),dark=null;
  function tone(){var on=hs.getBoundingClientRect().bottom>72;if(on===dark)return;dark=on;root.classList.toggle('on-dark',on);if(tc)tc.setAttribute('content',on?'#071a18':'#f5f3ee')}
  function poke(){tone();want=prog();if(!raf&&vis)raf=requestAnimationFrame(loop)}
  function done(){hl.classList.add('ok')}
  tone();addEventListener('scroll',tone,{passive:true});
  if(REDUCED){done()}
  else{
    addEventListener('scroll',poke,{passive:true});addEventListener('resize',function(){if(ready)size();drawn=-1;poke()});
    if('IntersectionObserver' in W)new IntersectionObserver(function(es){vis=es[0].isIntersecting;if(vis)poke()}).observe(hs);
    poke();
    var cn=navigator.connection;
    if(!W.crypto||!crypto.subtle||!W.createImageBitmap||(cn&&cn.saveData))done();
    else if(d.readyState==='complete')setTimeout(loadScene,300);else addEventListener('load',function(){setTimeout(loadScene,300)});
  }
  /* Пачки по K.scene.pack: 12 байт nonce + AES-GCM; внутри число кадров,
     длины, WebP подряд. Ключ — /promo/scene. Сцена стартует с первой
     пачкой, дальше качается ближайшая к месту прокрутки, по две сразу;
     молчащая 25 с — заново, потом пропуск. Счёт до 100% в углу. */
  function loadScene(){
    var PK=S.pack,NP=Math.ceil(F/PK),left=[],tries={},got=0,key=null,i;
    for(i=0;i<NP;i++)left.push(i);
    function show(){hn.textContent=Math.floor(got/NP*100);hb.style.transform='scaleX('+(got/NP).toFixed(3)+')';if(got>=NP)done()}
    function start(){if(ready)return;ready=true;size();hs.classList.add('cv');drawn=-1;poke()}
    function pick(){var f=frameOf(Math.max(0,cur))/PK,bi=0,bd=1e9;left.forEach(function(k,j){var dd=k+.5-f;dd=dd<0?-dd*1.6:dd;if(dd<bd){bd=dd;bi=j}});return left.splice(bi,1)[0]}
    function unpack(k,buf){var v=new DataView(buf),n=v.getUint32(0,true),o=4+4*n;for(var j=0;j<n;j++){var len=v.getUint32(4+4*j,true);raw[k*PK+j]=buf.slice(o,o+len);o+=len}}
    function next(){if(!left.length)return;var k=pick();
      var ac=W.AbortController?new AbortController():null,tm=setTimeout(function(){if(ac)ac.abort()},25000);
      fetch(K.img+'/seq/'+(DESK?'d':'p')+pad(k)+'.bin',ac?{signal:ac.signal}:{}).then(function(r){if(!r.ok)throw 0;return r.arrayBuffer()})
      .then(function(buf){return crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(buf,0,12)},key,new Uint8Array(buf,12))})
      .then(function(x){clearTimeout(tm);unpack(k,x);got++;show();start();drawn=-1;poke();next()},
        function(){clearTimeout(tm);tries[k]=(tries[k]||0)+1;if(tries[k]<3)left.push(k);else{got++;show()}next()})}
    fetch(K.base+'/promo/scene',{credentials:'same-origin'}).then(function(r){if(!r.ok)throw 0;return r.arrayBuffer()})
    .then(function(b){return crypto.subtle.importKey('raw',b,'AES-GCM',false,['decrypt'])})
    .then(function(k){key=k;next();next()})
    .catch(done)}
}

/* ── Стеклянные блоки: огонь бежит от первого к седьмому ──────────── */
var gb=$('.gb');
if(gb){
  var bs=$$('.gb-b',gb),card=$('.gb-card'),gi=0,gRun=!REDUCED,gT=0,gVis=false;
  function gSet(i){gi=i;bs.forEach(function(b,j){b.classList.toggle('on',j<=i);b.classList.toggle('cur',j===i)});var c=K.chain[i];$('.no',card).textContent=pad(i+1)+' / '+pad(bs.length);$('h3',card).textContent=c[0];$('.ds',card).textContent=c[1]}
  function gTick(){if(gRun&&gVis&&!d.hidden)gSet(gi>=bs.length-1?0:gi+1)}
  bs.forEach(function(b,j){b.addEventListener('click',function(){gRun=false;gSet(j)})});
  gSet(REDUCED?bs.length-1:0);inView(gb,function(v){gVis=v});gT=setInterval(gTick,1300);
}

/* ── Глобус: точки бегут по маршрутам к знаку ─────────────────────── */
var gl=$('.gl');
if(gl){
  var rs=$$('.gl-r',gl),gc=$('.gl-card'),glVis=false,t0=0,rr=0;
  function glSet(i){rs.forEach(function(r,j){r.classList.toggle('cur',j===i)});var s=K.steps[i];$('.no',gc).textContent=pad(i+1)+' / '+pad(rs.length);$('h3',gc).textContent=s[0];$('.ds',gc).textContent=s[1]}
  rs.forEach(function(r,i){function pick(){glSet(i)}r.addEventListener('mouseenter',pick);r.addEventListener('click',pick);r.addEventListener('focus',pick);r.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();pick()}})});
  function glLoop(now){rr=0;if(!glVis)return;if(!t0)t0=now;rs.forEach(function(r,i){var p=$('.gl-p',r),L=p.getTotalLength(),k=((now-t0)/2600+i*.21)%1,pt=p.getPointAtLength(L*k);$('.gl-dot',r).setAttribute('transform','translate('+pt.x.toFixed(1)+' '+pt.y.toFixed(1)+')')});rr=requestAnimationFrame(glLoop)}
  glSet(0);
  if(!REDUCED)inView(gl,function(v){glVis=v;if(v&&!rr)rr=requestAnimationFrame(glLoop)});
}

/* ── Главная под аудиторию: выбор меняет кнопку первого экрана ────── */
var as=$('.as');
if(as){
  var tabs=$$('[role="tab"]',as),cta=$('#hero-cta');
  function aSet(id,save){tabs.forEach(function(b){var on=b.getAttribute('data-a')===id;b.setAttribute('aria-selected',on?'true':'false');b.tabIndex=on?0:-1;$('#as-p-'+b.getAttribute('data-a')).hidden=!on});
    var c=K.aud[id];if(cta&&c){cta.setAttribute('href',c.h);$('span',cta).textContent=c.t}if(save)lsSet('cf-aud',id)}
  tabs.forEach(function(b,i){b.addEventListener('click',function(){aSet(b.getAttribute('data-a'),true)});
    b.addEventListener('keydown',function(e){var k=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;if(!k)return;e.preventDefault();var n=tabs[(i+k+tabs.length)%tabs.length];n.focus();aSet(n.getAttribute('data-a'),true)})});
  var saved=lsGet('cf-aud');if(saved&&K.aud[saved])aSet(saved,false);
}

/* ── Стоимость: основа по акции, допы за половину, отсчёт 48 часов ─── */
var kitEl=$('#kit');
if(kitEl){
  var O=K.offer,rows=$$('input[data-k]',kitEl),sumEl=$('#kit-sum'),shown=O.base,rollT=0;
  function usd(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')+' $'}
  function roll(to){cancelAnimationFrame(rollT);if(REDUCED){shown=to;sumEl.textContent=usd(to);return}var from=shown,t0=performance.now();
    (function f(now){var k=Math.min(1,(now-t0)/450),e=1-Math.pow(1-k,3);shown=from+(to-from)*e;sumEl.textContent=usd(shown);if(k<1)rollT=requestAnimationFrame(f)})(t0)}
  function kit(){var add=0,full=0,c=0;rows.forEach(function(r){if(r.checked){var it=O.items.filter(function(x){return x.id===r.getAttribute('data-k')})[0];add+=it.p;full+=it.f;c++}});
    $('#kit-add').textContent=usd(add);$('#kit-cnt').textContent=c;$('#kit-save').textContent=usd(full-add);roll(O.base+add)}
  rows.forEach(function(r){r.addEventListener('change',kit)});
  $('#kit-all').addEventListener('click',function(){rows.forEach(function(r){r.checked=true});kit()});
  $('#kit-copy').addEventListener('click',function(){var lines=[O.head,'- '+O.baseName+': '+usd(O.base)];rows.forEach(function(r){if(r.checked){var it=O.items.filter(function(x){return x.id===r.getAttribute('data-k')})[0];lines.push('- '+it.t+': '+usd(it.p))}});lines.push(O.totalW+': '+sumEl.textContent);
    try{navigator.clipboard.writeText(lines.join('\n'))}catch(e){}var tt=$('#toast');tt.textContent=O.copied;tt.hidden=false;setTimeout(function(){tt.hidden=true},2400)});
  kit();
  var tm=$('#tm'),start=Date.now(),s0=+lsGet('cf-offer-1');if(s0&&s0<=Date.now())start=s0;else lsSet('cf-offer-1',String(start));
  var end=start+O.hours*36e5;
  function tick(){var left=Math.max(0,end-Date.now());if(!left){$('#timer').classList.add('over');tm.textContent='00:00:00';$('#timer span').firstChild.textContent=O.ended;return}
    var s=Math.floor(left/1e3);tm.textContent=pad(Math.floor(s/3600))+':'+pad(Math.floor(s%3600/60))+':'+pad(s%60);setTimeout(tick,1000)}
  tick();
}
})();
