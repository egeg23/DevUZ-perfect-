/* Первая страница макета Nek Dental Studio: пролёт по прокрутке, выбор
   «Сайт» или «Панель», конструктор цены. Прокрутку только читаем: ни
   scrollTo, ни preventDefault на колесе. Тумблер конструктора пишет
   nk-cfg-1, сайт читает его и убирает блок выключенного допа. */
(function(){
var d=document,w=window,$=function(s,r){return(r||d).querySelector(s)},$$=function(s,r){return[].slice.call((r||d).querySelectorAll(s))};
var D=JSON.parse($('#nk-land').textContent),T=D.t;
var RM=w.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function get(k,def){try{var v=localStorage.getItem(k);return v?JSON.parse(v):def}catch(e){return def}}
function put(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function money(n){return fmt(n)+' $'}
function cl(x){return x<0?0:x>1?1:x}
function pad(n,k){n=String(n);while(n.length<(k||2))n='0'+n;return n}
var toastT=0;function toast(m){var t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('on')},2200)}
/* Шапка: прячется при любой прокрутке, возвращается через 3 с после последнего события. */
var top=$('.top'),IDLE=3000,idleT=0;
function headIdle(){if(!top)return;clearTimeout(idleT);
  if(!top.contains(d.activeElement))top.classList.add('hide');
  idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}
addEventListener('scroll',headIdle,{passive:true});
var io='IntersectionObserver'in w?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'}):null;
$$('.rise,.tilt,.pop,.slide').forEach(function(e){if(io&&!RM)io.observe(e);else e.classList.add('on')});

/* ── Пролёт: кадры роликов по прокрутке ───────────────────────────────
   Кадры зашифрованы (AES-GCM, 12 байт nonce + шифр), ключ отдаёт только
   открытый макет: app/proto/[token]/promo/scene. Компьютеру — 1280×720,
   телефону — свои ролики 9:16. Кадр едет за прокруткой мягким догоном,
   соседние кадры смешиваются. Кадр распаковывается заранее и не в главном
   потоке (createImageBitmap): распаковка WebP в миг отрисовки и давала
   рывки на телефоне. */
var hs=$('.hs');
if(hs&&!RM){
  var cv=$('canvas',hs),cx=cv.getContext('2d'),cps=$$('.cp',hs),F=D.n,blob=[],bm={},order=[],busy={},nb=0,asked={},ready=false,want=0,cur=0,raf=0,last=-1,dir=1;
  var SET=w.innerWidth<900?'m':'d',EASE=/*~*/0.12,MAXB=SET==='m'?24:56,AHEAD=SET==='m'?14:18,SRC=SET==='m'?1280:720,BMP='createImageBitmap'in w;
  function prog(){var r=hs.getBoundingClientRect(),span=r.height-innerHeight;return span>0?cl(-r.top/span):0}
  /* Холст не крупнее самого кадра: лишние точки только греют телефон. */
  function size(){var dpr=Math.min(w.devicePixelRatio||1,2,Math.max(1,SRC/(cv.clientHeight||1)));cv.width=Math.round(cv.clientWidth*dpr);cv.height=Math.round(cv.clientHeight*dpr);last=-1}
  function at(){return Math.round(cur*(F-1))}
  function viaImg(b){return new Promise(function(ok,no){var g=new Image(),u=URL.createObjectURL(b);g.onload=function(){var fin=function(){URL.revokeObjectURL(u);ok(g)};g.decode?g.decode().then(fin,fin):fin()};g.onerror=function(){URL.revokeObjectURL(u);no()};g.src=u})}
  /* Расшифрованный кадр лежит сжатым (Blob), распакованными — только MAXB
     ближних: сотни кадров iPhone в памяти не держит. Распаковка идёт по
     ходу прокрутки, ближние первыми, не больше трёх сразу. */
  function unpack(i){if(i<0||i>=F||bm[i]||busy[i]||!blob[i]||nb>=3)return;busy[i]=1;nb++;
    (BMP?createImageBitmap(blob[i]).catch(function(){BMP=false;return viaImg(blob[i])}):viaImg(blob[i])).then(function(g){busy[i]=0;nb--;bm[i]=g;order.push(i);trim(at());if(Math.abs(i-at())<3)last=-1;warm(at());if(!raf)raf=requestAnimationFrame(loop)},function(){busy[i]=0;nb--})}
  function trim(c){while(order.length>MAXB){var far=0,fd=-1;for(var k=0;k<order.length;k++){var dd=Math.abs(order[k]-c);if(dd>fd){fd=dd;far=k}}var j=order[far];if(bm[j]&&bm[j].close)bm[j].close();delete bm[j];order.splice(far,1)}}
  function warm(c){for(var k=0;k<=AHEAD;k++)unpack(c+k*dir);for(k=1;k<=4;k++)unpack(c-k*dir)}
  function near(i){if(bm[i])return bm[i];for(var k=1;k<F;k++){if(bm[i-k])return bm[i-k];if(bm[i+k])return bm[i+k]}return null}
  function blit(g){var cw=cv.width,ch=cv.height,s=Math.max(cw/g.width,ch/g.height),gw=g.width*s,gh=g.height*s;cx.drawImage(g,(cw-gw)*.5,(ch-gh)*.5,gw,gh)}
  /* Между двумя кадрами — их смесь: соседний кадр ложится поверх с долей
     прозрачности, и медленная прокрутка идёт без ступеней. На быстрой кадр
     и так меняется каждый раз, смесь не видна, а слабому телефону она
     вдвое дороже — там её нет. */
  function draw(){var f=cur*(F-1),i=Math.floor(f),t=f-i,key=Math.round(f*50),slow=Math.abs(want-cur)*(F-1)*EASE<.6;if(key===last)return;warm(i);var g=near(i);if(!g)return;last=key;
    cx.globalAlpha=1;blit(g);var h=slow&&t>.02&&g===bm[i]?bm[i+1]:null;if(h){cx.globalAlpha=t;blit(h);cx.globalAlpha=1}}
  /* Глава видна вокруг своей доли сцены: появляется и уходит движением. */
  function paint(p){
    for(var i=0;i<cps.length;i++){var at=D.ch[i].at,o=i===0?cl(1-(p-.02)/.08):i===cps.length-1&&p>at?1:cl(1-Math.abs(p-at)/.085);cps[i].style.setProperty('--o',o.toFixed(3))}
    var q=cl((p-.9)/.08);hs.style.setProperty('--q',q.toFixed(3));hs.classList.toggle('end',q>.5);hs.classList.toggle('moved',p>.015)}
  function loop(){raf=0;var dl=want-cur;if(dl)dir=dl>0?1:-1;cur=Math.abs(dl)<.0002?want:cur+dl*EASE;if(ready)draw();if(cur!==want)raf=requestAnimationFrame(loop)}
  function poke(){want=prog();paint(want);if(!raf)raf=requestAnimationFrame(loop)}
  addEventListener('scroll',poke,{passive:true});addEventListener('resize',function(){if(ready)size();poke()});poke();
  if(!w.crypto||!crypto.subtle||!w.Blob)$('#hs-load').classList.add('ok');
  else if(d.readyState==='complete')setTimeout(loadScene,200);else addEventListener('load',function(){setTimeout(loadScene,200)});
  function loadScene(){
    var n=$('#hs-n'),bar=$('#hs-b'),done=0,got=0;
    function step(){done++;var k=done/F;n.textContent=Math.floor(k*100);bar.style.transform='scaleX('+k.toFixed(3)+')';
      if(got>=2&&!ready){ready=true;size();hs.classList.add('live');cur=want=prog();draw()}
      if(done===F)$('#hs-load').classList.add('ok')}
    fetch(D.root+'/promo/scene',{credentials:'same-origin'}).then(function(r){if(!r.ok)throw 0;return r.arrayBuffer()})
    .then(function(b){return crypto.subtle.importKey('raw',b,'AES-GCM',false,['decrypt'])})
    .then(function(key){
      /* Сначала каждый двенадцатый кадр (сцена живая сразу), потом те, что
         ближе к месту, где человек листает, впереди по ходу первыми. */
      var q=[],i;for(i=0;i<F;i+=12)q.push(i);if((F-1)%12)q.push(F-1);
      function pick(){while(q.length){var j=q.shift();if(!asked[j])return j}var c=at();for(var k=0;k<F;k++){var a=c+k*dir,z=c-k*dir;if(a>=0&&a<F&&!asked[a])return a;if(z>=0&&z<F&&!asked[z])return z}return null}
      function next(){var j=pick();if(j==null)return;asked[j]=1;
        fetch(D.img+'/seq/'+SET+'/f'+pad(j,3)+'.bin').then(function(r){if(!r.ok)throw 0;return r.arrayBuffer()})
        .then(function(buf){return crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(buf,0,12)},key,new Uint8Array(buf,12))})
        .then(function(x){blob[j]=new Blob([x],{type:'image/webp'});got++;step();if(ready){if(Math.abs(j-at())<=AHEAD)warm(at());if(!raf)raf=requestAnimationFrame(loop)}next()},function(){step();next()})}
      for(i=0;i<6;i++)next()})
    .catch(function(){$('#hs-load').classList.add('ok')})}
}else if(hs){$$('.cp',hs).forEach(function(c){c.style.setProperty('--o','1')})}

/* ── Конструктор DevUz ─────────────────────────────────────────────── */
var cfg=get('nk-cfg-1',{}),boxes=$$('[data-add]');
function cfgApply(){var s=0,n=0;boxes.forEach(function(b){var id=b.getAttribute('data-add');b.checked=cfg[id]!==false;if(b.checked){var a=D.add.filter(function(x){return x.id===id})[0];s+=a.p;n++}});
  $('#adds').textContent=money(s);$('#addn').textContent=n?'('+n+')':'';$('#total').textContent=money(D.base+s);put('nk-cfg-1',cfg)}
boxes.forEach(function(b){b.addEventListener('change',function(){cfg[b.getAttribute('data-add')]=b.checked;cfgApply()})});
$('#allon').addEventListener('click',function(){cfg={};cfgApply()});
$('#alloff').addEventListener('click',function(){boxes.forEach(function(b){cfg[b.getAttribute('data-add')]=false});cfgApply()});
$('#copy').addEventListener('click',function(){var txt=[$('.base b').textContent+': '+money(D.base)];D.add.forEach(function(a){if(cfg[a.id]!==false)txt.push(a.t+': '+money(a.p))});txt.push(T.tot+': '+$('#total').textContent);
  var done=function(){toast(T.copied)};if(navigator.clipboard)navigator.clipboard.writeText(txt.join('\n')).then(done,done);else done()});
cfgApply();
/* 48 часов с первого открытия макета на этом устройстве. */
var t0=get('nk-offer-1',0);if(!t0){t0=Date.now();put('nk-offer-1',t0)}
(function clock(){var left=Math.max(0,t0+D.hours*36e5-Date.now()),h=Math.floor(left/36e5),m=Math.floor(left%36e5/6e4),s=Math.floor(left%6e4/1e3);
  $('#th').textContent=h;$('#tm').textContent=pad(m);$('#ts').textContent=pad(s);if(left>0)setTimeout(clock,1000)})();
/* Мини-график в карточке панели: демо из одного зерна. */
var sp=$('#lspark');if(sp){var z=23,r=function(){z=(z*16807)%2147483647;return z/2147483647},h='';for(var i=0;i<14;i++)h+='<i style="height:'+Math.round(12+r()*32)+'px"></i>';sp.innerHTML=h}
})();
