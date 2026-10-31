/* Первая страница макета CARGO PRO GROUP: залёт в бренд по прокрутке, выбор
   «Сайт» или «Панель», конструктор цены. Прокрутку только читаем: ни
   scrollTo, ни preventDefault на колесе. Тумблер конструктора пишет
   cp-cfg-1, сайт читает его и убирает блок выключенного допа. */
(function(){
var d=document,w=window,$=function(s,r){return(r||d).querySelector(s)},$$=function(s,r){return[].slice.call((r||d).querySelectorAll(s))};
var D=JSON.parse($('#cp-land').textContent),T=D.t;
var RM=w.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function get(k,def){try{var v=localStorage.getItem(k);return v?JSON.parse(v):def}catch(e){return def}}
function put(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function money(n){return fmt(n)+' $'}
function cl(x){return x<0?0:x>1?1:x}
function pad(n){return(n<10?'0':'')+n}
var toastT=0;function toast(m){var t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('on')},2200)}
/* Шапка: прячется при любой прокрутке, возвращается через 3 с после последнего события. */
var top=$('.top'),IDLE=3000,idleT=0;
function headIdle(){if(!top)return;clearTimeout(idleT);
  if(!top.contains(d.activeElement))top.classList.add('hide');
  idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}
addEventListener('scroll',headIdle,{passive:true});
var io='IntersectionObserver'in w?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'}):null;
$$('.rise,.tilt,.pop,.slide').forEach(function(e){if(io&&!RM)io.observe(e);else e.classList.add('on')});
d.addEventListener('pointermove',function(e){var g=e.target.closest&&e.target.closest('.glass,.choice');if(!g)return;var r=g.getBoundingClientRect();g.style.setProperty('--gx',((e.clientX-r.left)/r.width*100)+'%');g.style.setProperty('--gy',((e.clientY-r.top)/r.height*100)+'%')},{passive:true});

/* ── Залёт в бренд: кадры ролика по прокрутке ─────────────────────────
   Кадры зашифрованы (AES-GCM, 12 байт nonce + шифр), ключ отдаёт только
   открытый макет: app/proto/[token]/promo/scene. Компьютеру — 1920×1080,
   телефону — свои 9:16. Расшифрованные кадры лежат картинками из blob:
   браузер сам держит в памяти распакованными только нужные. */
var hs=$('.hs');
if(hs){
  var cv=$('canvas',hs),cx=cv.getContext('2d'),wd=$$('h1 .w>span',hs),F=D.n,im=[],ready=false,want=0,cur=0,raf=0,last=-1;
  var M=w.innerWidth<900,SET=M?'m':'d';
  function prog(){var r=hs.getBoundingClientRect(),span=r.height-innerHeight;return span>0?cl(-r.top/span):0}
  function size(){var dpr=Math.min(w.devicePixelRatio||1,2);cv.width=Math.round(cv.clientWidth*dpr);cv.height=Math.round(cv.clientHeight*dpr);last=-1}
  function near(i){for(var k=0;k<F;k++){var a=im[i-k],b=im[i+k];if(a&&a.complete&&a.naturalWidth)return a;if(b&&b.complete&&b.naturalWidth)return b}return null}
  function draw(){var i=Math.round(cur*(F-1));if(i===last)return;var g=near(i);if(!g)return;last=i;var cw=cv.width,ch=cv.height,s=Math.max(cw/g.naturalWidth,ch/g.naturalHeight),gw=g.naturalWidth*s,gh=g.naturalHeight*s;cx.drawImage(g,(cw-gw)*.5,(ch-gh)*.5,gw,gh)}
  function paint(p){
    for(var i=0;i<wd.length;i++)wd[i].style.setProperty('--u',cl(1-(p-.04-i*.05)/.12).toFixed(3));
    hs.style.setProperty('--lt',cl(1-(p-.18)/.15).toFixed(3));var q=cl((p-.72)/.2);hs.style.setProperty('--q',q.toFixed(3));hs.classList.toggle('end',q>.5);
    hs.classList.toggle('moved',p>.02)}
  function loop(){raf=0;var dl=want-cur;cur=Math.abs(dl)<.0015?want:cur+dl* /*~*/.18;if(ready)draw();if(cur!==want)raf=requestAnimationFrame(loop)}
  function poke(){want=prog();paint(want);if(!raf)raf=requestAnimationFrame(loop)}
  /* Заголовок стоит сразу и уходит по мере залёта. */
  wd.forEach(function(s){s.style.setProperty('--u','1')});
  if(RM){$('#hs-load').classList.add('ok');hs.style.setProperty('--q','1');hs.classList.add('end')}
  else{addEventListener('scroll',poke,{passive:true});addEventListener('resize',function(){if(ready)size();poke()});poke();
    if(!w.crypto||!crypto.subtle||!w.URL||!URL.createObjectURL)$('#hs-load').classList.add('ok');
    else if(d.readyState==='complete')setTimeout(loadScene,200);else addEventListener('load',function(){setTimeout(loadScene,200)})}
  function loadScene(){
    var n=$('#hs-n'),bar=$('#hs-b'),done=0,ok=0;
    function step(){done++;var k=done/F;n.textContent=Math.floor(k*100);bar.style.transform='scaleX('+k.toFixed(3)+')';
      if(ok>=2&&!ready){ready=true;size();hs.classList.add('live');cur=want=prog();draw()}
      if(done===F)$('#hs-load').classList.add('ok')}
    fetch(D.root+'/promo/scene',{credentials:'same-origin'}).then(function(r){if(!r.ok)throw 0;return r.arrayBuffer()})
    .then(function(b){return crypto.subtle.importKey('raw',b,'AES-GCM',false,['decrypt'])})
    .then(function(key){
      /* Сначала каждый восьмой кадр, потом остальные: сцена живая сразу. */
      var q=[],i,seen={};for(i=0;i<F;i+=8){q.push(i);seen[i]=1}if(!seen[F-1]){q.push(F-1);seen[F-1]=1}for(i=0;i<F;i++)if(!seen[i])q.push(i);
      function next(){var j=q.shift();if(j==null)return;
        fetch(D.img+'/seq/'+SET+'/f'+pad(j)+'.bin').then(function(r){if(!r.ok)throw 0;return r.arrayBuffer()})
        .then(function(buf){return crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(buf,0,12)},key,new Uint8Array(buf,12))})
        .then(function(x){return new Promise(function(res,rej){var g=new Image();g.decoding='async';g.onload=function(){res(g)};g.onerror=rej;g.src=URL.createObjectURL(new Blob([x],{type:'image/webp'}))})})
        .then(function(g){im[j]=g;ok++;last=-1;step();if(ready&&!raf)raf=requestAnimationFrame(loop);next()},function(){step();next()})}
      for(i=0;i<4;i++)next()})
    .catch(function(){$('#hs-load').classList.add('ok')})}
}

/* ── Конструктор DevUz ─────────────────────────────────────────────── */
var cfg=get('cp-cfg-1',{}),boxes=$$('[data-add]');
var mods=$$('[data-mod]');
function cfgApply(){var s=0,n=0,ms=0;boxes.forEach(function(b){var id=b.getAttribute('data-add');b.checked=cfg[id]!==false;if(b.checked){var a=D.add.filter(function(x){return x.id===id})[0];s+=a.p;n++}});
  /* Otdelnyy modul: svoy tumbler, pryachet vybor i ssylki na nego na etoy stranitse. */
  mods.forEach(function(b){var id=b.getAttribute('data-mod'),on=cfg['m_'+id]!==false;b.checked=on;if(on)ms+=D.mod.filter(function(x){return x.id===id})[0].p;
    $$('[data-module="'+id+'"]').forEach(function(e){e.classList.toggle('off',!on)})});
  $('#adds').textContent=money(s);$('#addn').textContent=n?'('+n+')':'';$('#total').textContent=money(D.base+s);
  $('#mrow').classList.toggle('off',!ms);$('#mods').textContent=ms?money(ms):T.none;$('#withm').textContent=ms?money(D.base+s+ms):T.none;$('#mtot').classList.toggle('dim',!ms);put('cp-cfg-1',cfg)}
mods.forEach(function(b){b.addEventListener('change',function(){cfg['m_'+b.getAttribute('data-mod')]=b.checked;cfgApply()})});
boxes.forEach(function(b){b.addEventListener('change',function(){cfg[b.getAttribute('data-add')]=b.checked;cfgApply()})});
$('#allon').addEventListener('click',function(){var keep={};Object.keys(cfg).forEach(function(k){if(k.indexOf('m_')===0)keep[k]=cfg[k]});cfg=keep;cfgApply()});
$('#alloff').addEventListener('click',function(){boxes.forEach(function(b){cfg[b.getAttribute('data-add')]=false});cfgApply()});
$('#copy').addEventListener('click',function(){var txt=[$('.base b').textContent+': '+money(D.base)];D.add.forEach(function(a){if(cfg[a.id]!==false)txt.push(a.t+': '+money(a.p))});txt.push(T.tot+': '+$('#total').textContent);D.mod.forEach(function(m){if(cfg['m_'+m.id]!==false){txt.push(m.t+': '+money(m.p));txt.push(T.totm+': '+$('#withm').textContent)}});
  var done=function(){toast(T.copied)};if(navigator.clipboard)navigator.clipboard.writeText(txt.join('\n')).then(done,done);else done()});
cfgApply();
/* 48 часов с первого открытия макета на этом устройстве. */
var t0=get('cp-offer-1',0);if(!t0){t0=Date.now();put('cp-offer-1',t0)}
(function clock(){var left=Math.max(0,t0+D.hours*36e5-Date.now()),h=Math.floor(left/36e5),m=Math.floor(left%36e5/6e4),s=Math.floor(left%6e4/1e3);
  $('#th').textContent=h;$('#tm').textContent=pad(m);$('#ts').textContent=pad(s);if(left>0)setTimeout(clock,1000)})();
/* Мини-график в карточке панели: демо из одного зерна. */
var sp=$('#lspark');if(sp){var z=17,r=function(){z=(z*16807)%2147483647;return z/2147483647},h='';for(var i=0;i<18;i++)h+='<i style="height:'+(30+r()*70)+'%"></i>';sp.innerHTML=h}
})();
