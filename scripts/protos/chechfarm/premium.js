(function(){
'use strict';
/* premium: сцена первого экрана, стеклянные блоки, глобус, аудитории,
   стоимость. Прокрутку только читает: ни scrollTo, ни preventDefault на
   колесе. Сцена короткая (полтора экрана) — урок Engelberg. */
var d=document,W=window,root=d.documentElement,K=JSON.parse(d.getElementById('cf-data').textContent);
var $=function(s,r){return (r||d).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))};
var REDUCED=root.classList.contains('rm');
function pad(n){return (n<10?'0':'')+n}
function cl(x){return x<0?0:x>1?1:x}
function lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function inView(el,cb){if(!('IntersectionObserver' in W)){cb(true);return}new IntersectionObserver(function(es){cb(es[0].isIntersecting)},{threshold:.25}).observe(el)}

/* ── Сцена: капсула раскрывается по прокрутке ─────────────────────────
   На компьютере — кадры ролика (зашифрованы, ключ по ссылке макета),
   на телефоне и пока кадры не пришли — смена двух кадров. */
var hs=$('.hs');
if(hs){
  var A=$('.hs-a',hs),B=$('.hs-b',hs),cv=$('.hs-cv',hs),cx=cv.getContext('2d'),words=$$('h1 .w>span',hs),F=K.scene.n,bm=[],ready=false,want=0,cur=0,raf=0;
  var DESK=false;try{DESK=matchMedia('(min-width: 900px) and (orientation: landscape)').matches}catch(e){}
  function prog(){var r=hs.getBoundingClientRect(),span=r.height-innerHeight;return span>0?cl(-r.top/span):0}
  function size(){var dpr=Math.min(W.devicePixelRatio||1,2);cv.width=Math.round(cv.clientWidth*dpr);cv.height=Math.round(cv.clientHeight*dpr)}
  function draw(){var i=Math.round(cur*(F-1)),im=bm[i];if(!im)return;var cw=cv.width,ch=cv.height,s=Math.max(cw/im.width,ch/im.height),w=im.width*s,h=im.height*s;cx.drawImage(im,(cw-w)*.62,(ch-h)*.5,w,h)}
  function paint(p){
    if(!ready){A.style.transform='scale('+(1+p*.05).toFixed(4)+')';B.style.opacity=String(cl((p-.15)/.65).toFixed(3))}
    for(var i=0;i<words.length;i++)words[i].style.setProperty('--u',cl((p-i*.22)/.22).toFixed(3));
    hs.classList.toggle('moved',p>.02)}
  function loop(){raf=0;var dl=want-cur;cur=Math.abs(dl)<.001?want:cur+dl*.2;if(ready)draw();if(cur!==want)raf=requestAnimationFrame(loop)}
  function poke(){want=prog();paint(want);if(!raf)raf=requestAnimationFrame(loop)}
  if(REDUCED){$('#hs-load').classList.add('ok')}
  else{addEventListener('scroll',poke,{passive:true});addEventListener('resize',function(){if(ready)size();poke()});poke();
    if(!DESK||!W.crypto||!crypto.subtle||!W.createImageBitmap)$('#hs-load').classList.add('ok');
    else addEventListener('load',function(){setTimeout(loadScene,300)})}
  /* Кадры: 12 байт nonce + AES-GCM; ключ — app/proto/[token]/promo/scene. */
  function loadScene(){
    var n=$('#hs-n'),bar=$('#hs-b'),done=0,ok=0;
    function step(){done++;var k=done/F;n.textContent=Math.floor(k*100);bar.style.transform='scaleX('+k.toFixed(3)+')';
      if(done===F){$('#hs-load').classList.add('ok');if(ok===F){ready=true;size();hs.classList.add('cv');A.style.transform='';B.style.opacity='0';cur=want=prog();draw()}}}
    fetch(K.base+'/promo/scene',{credentials:'same-origin'}).then(function(r){if(!r.ok)throw 0;return r.arrayBuffer()})
    .then(function(b){return crypto.subtle.importKey('raw',b,'AES-GCM',false,['decrypt'])})
    .then(function(key){
      var q=[],i;for(i=0;i<F;i++)q.push(i);
      function next(){var j=q.shift();if(j==null)return;
        fetch(K.img+'/seq/f'+pad(j)+'.bin').then(function(r){if(!r.ok)throw 0;return r.arrayBuffer()})
        .then(function(buf){return crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(buf,0,12)},key,new Uint8Array(buf,12))})
        .then(function(x){return createImageBitmap(new Blob([x],{type:'image/webp'}))})
        .then(function(im){bm[j]=im;ok++;step();next()},function(){step();next()})}
      for(i=0;i<4;i++)next()})
    .catch(function(){$('#hs-load').classList.add('ok')})}
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
