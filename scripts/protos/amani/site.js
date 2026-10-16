(function(){
'use strict';
/* site: главная Amani. Шёлк первого экрана (WebGL) раскрывается аркой по
   прокрутке, лента коллекции едет вбок, бегущая строка слушает скорость
   прокрутки, коробка подарка собирается, наборы для умры, подбор хиджаба,
   шаги «как завязать», размеры, доставка, подарок за первый заказ, айфон с
   магазином, панель и конструктор цены. Прокрутку не перехватывает: сцены
   стоят на sticky, GSAP ScrollTrigger только читает положение (scrub), всё
   пишется в transform и opacity. Без движения всё стоит на месте. */
var d=document,W=window,root=d.documentElement,K=JSON.parse(d.getElementById('am-data').textContent);
var $=function(s,r){return (r||d).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))};
var REDUCED=false;try{REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
var G=W.gsap,ST=W.ScrollTrigger,MOTION=!REDUCED&&!!(G&&ST);
if(MOTION)G.registerPlugin(ST);else root.classList.add('no-pin');
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
var clamp=function(x,a,b){return Math.min(b,Math.max(a,x))};
var smooth=function(x){x=clamp(x,0,1);return x*x*(3-2*x)};

/* Появление блоков: у каждого своё движение (классы a-*). */
if('IntersectionObserver' in W&&!REDUCED){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
  $$('.rv').forEach(function(el){io.observe(el)});
}else $$('.rv').forEach(function(el){el.classList.add('in')});

/* ── Шёлк первого экрана ─────────────────────────────────────────────────
   Полотно цвета слоновой кости с мягкими складками и блеском; в нём арка,
   сквозь которую виден снимок. Прокрутка раздвигает арку, пока полотно не
   уйдёт за края. Кадры рисуются, только пока сцена видна. */
var stage=$('.stage'),cv=$('#silk'),gl=null,prog=null,U={},open=0,raf=0,visible=true,t0=performance.now();
var VS='attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
var FS=['precision mediump float;uniform vec2 r;uniform float t;uniform vec4 a;uniform float o;',
'float hgt(vec2 u){float x=u.x*3.1+sin(u.y*2.3+t*.21)*1.25;float y=u.y*1.7;',
' return sin(x+sin(y*1.3+t*.17)*.9+t*.12)*.55+sin(x*.53+y*1.9-t*.09)*.35+sin((u.x+u.y)*6.2+t*.25)*.06;}',
'float arch(vec2 q){vec2 c=vec2(a.x,a.z);float box=max(abs(q.x-a.x)-a.w,max(a.y-q.y,q.y-a.z));float cir=length(q-c)-a.w;return min(box,cir);}',
'void main(){vec2 q=gl_FragCoord.xy;float m=min(r.x,r.y);vec2 u=q/m;',
' float e=1.5/m;float h0=hgt(u),hx=hgt(u+vec2(e,0.)),hy=hgt(u+vec2(0.,e));',
' vec3 n=normalize(vec3((h0-hx)/e*.012,(h0-hy)/e*.012,1.));',
' vec3 L=normalize(vec3(-.45,.6,.75));float df=clamp(dot(n,L),0.,1.);',
' vec3 H=normalize(L+vec3(0.,0.,1.));float sp=pow(clamp(dot(n,H),0.,1.),46.);',
' vec3 lo=vec3(.80,.72,.62),hi=vec3(.975,.95,.915);vec3 col=mix(lo,hi,smoothstep(.15,1.,df))+sp*vec3(.30,.27,.22);',
' col*=.94+h0*.06;',
' float dd=arch(q);float px=1.;',
' col*=1.-.20*exp(-max(dd,0.)/(26.*px));',
' float rim=1.-smoothstep(1.2,2.6,abs(dd-5.));col=mix(col,vec3(.69,.54,.31),rim*.85*(1.-o));',
' float al=smoothstep(-1.,1.,dd);gl_FragColor=vec4(col*al,al);}'].join('\n');
function initGL(){
  if(!cv)return false;
  try{gl=cv.getContext('webgl',{premultipliedAlpha:true,alpha:true,antialias:false})||cv.getContext('experimental-webgl')}catch(e){gl=null}
  if(!gl)return false;
  function sh(type,src){var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s}
  try{prog=gl.createProgram();gl.attachShader(prog,sh(gl.VERTEX_SHADER,VS));gl.attachShader(prog,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(prog);if(!gl.getProgramParameter(prog,gl.LINK_STATUS))return false}catch(e){return false}
  gl.useProgram(prog);var b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  var loc=gl.getAttribLocation(prog,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  ['r','t','a','o'].forEach(function(k){U[k]=gl.getUniformLocation(prog,k)});
  return true}
var DPR=1;
function sizeGL(){if(!gl)return;var w=stage.clientWidth,hh=stage.clientHeight;DPR=Math.min(W.devicePixelRatio||1,w<700?1.25:1.5);cv.width=Math.round(w*DPR);cv.height=Math.round(hh*DPR);gl.viewport(0,0,cv.width,cv.height)}
/* Арка в пикселях полотна (ось y снизу): центр, низ, начало свода, полуширина. */
function archAt(k){var w=cv.width,hh=cv.height,mob=w/DPR<1024,k2=smooth(k);
  var r0=mob?Math.min(w*.31,hh*.19):Math.min(w*.15,hh*.25),ys0=mob?hh*.47:hh*.40,yb0=mob?hh*.25:-4*DPR;
  var rMax=Math.hypot(w,hh)*1.1;
  return [w/2,yb0-k2*hh*.5,ys0-k2*hh*.15,r0+(rMax-r0)*Math.pow(k2,1.6)]}
function drawGL(now){if(!gl)return;var a=archAt(open);gl.uniform2f(U.r,cv.width,cv.height);gl.uniform1f(U.t,REDUCED?3:(now-t0)/1000);gl.uniform4f(U.a,a[0],a[1],a[2],a[3]);gl.uniform1f(U.o,open);gl.drawArrays(gl.TRIANGLE_STRIP,0,4)}
function loop(now){raf=0;drawGL(now);if(visible&&!REDUCED)raf=requestAnimationFrame(loop)}
if(stage&&initGL()){sizeGL();addEventListener('resize',function(){sizeGL();drawGL(performance.now())});
  if('IntersectionObserver' in W)new IntersectionObserver(function(es){visible=es[0].isIntersecting;if(visible&&!raf&&!REDUCED)raf=requestAnimationFrame(loop)}).observe(stage);
  raf=requestAnimationFrame(loop);
  d.addEventListener('visibilitychange',function(){if(d.hidden){cancelAnimationFrame(raf);raf=0}else if(visible&&!raf)raf=requestAnimationFrame(loop)});
}else root.classList.add('no-gl');

/* Раскрытие по прокрутке: снимок за аркой приближается к зрителю, буквы
   имени расходятся, внизу встаёт подпись коллекции. */
var heroPh=$('.hero-ph img'),letters=$$('.hero-word text'),cap=$('.hero-cap'),out=$('.hero-out'),veil=$('.veil'),hint=$('.hero-hint');
function heroSet(k){open=k;
  if(!REDUCED&&heroPh&&!root.classList.contains('no-gl'))heroPh.style.transform='scale('+(1.18-.18*smooth(k)).toFixed(4)+')';
  letters.forEach(function(l,i){var c=(i-(letters.length-1)/2);l.style.transform='translate('+(c*k*90).toFixed(1)+'px,'+(-k*40).toFixed(1)+'px)';l.style.opacity=(1-smooth(k*1.6)).toFixed(3)});
  if(cap)cap.style.opacity=(1-smooth(k*2.2)).toFixed(3),cap.style.transform='translateY('+(k*40).toFixed(1)+'px)';
  if(hint)hint.style.opacity=(1-smooth(k*4)).toFixed(3);
  if(out){var o=smooth((k-.62)/.3);out.style.opacity=o.toFixed(3);out.style.transform='translateY('+((1-o)*30).toFixed(1)+'px)';out.style.pointerEvents=o>.6?'auto':'none'}
  if(veil)veil.style.opacity=smooth((k-.55)/.4).toFixed(3);
  if(gl&&REDUCED)drawGL(0)}
if(MOTION&&$('.hero')){var hs={k:0};G.to(hs,{k:1,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom bottom',scrub:.7},onUpdate:function(){heroSet(hs.k)}})}
heroSet(0);

/* Бегущая строка: своя скорость плюс скорость прокрутки, направление от неё же. */
var mq=$('.marq-t');
if(mq&&!REDUCED){var mx=0,dir=1,boost=0,half=0;function mw(){half=mq.scrollWidth/2}mw();addEventListener('resize',mw);
  var lastY=scrollY,lastT=performance.now();
  addEventListener('scroll',function(){var now=performance.now(),dy=scrollY-lastY,dt=Math.max(16,now-lastT);lastY=scrollY;lastT=now;if(dy)dir=dy>0?1:-1;boost=Math.min(14,Math.abs(dy)/dt*6)},{passive:true});
  (function tick(){mx-=dir*(.6+boost);boost*=.92;if(half){if(mx<=-half)mx+=half;if(mx>0)mx-=half}mq.style.transform='translate3d('+mx.toFixed(2)+'px,0,0)';requestAnimationFrame(tick)})()}

/* Коллекция: дорожка едет вбок, пока секция стоит. Высота секции =
   длина дорожки, поэтому прокрутка идёт своим ходом. */
var pin=$('.col-pin'),tr=$('.col-tr'),bar=$('.col-bar i'),num=$('.col-n b');
if(MOTION&&pin&&tr){
  var dist=function(){return Math.max(0,tr.scrollWidth-innerWidth)};
  var setH=function(){pin.style.height=(dist()+innerHeight)+'px'};setH();
  var cards=$$('.pc',tr),imgs=$$('.pc-im img',tr);
  G.to(tr,{x:function(){return -dist()},ease:'none',scrollTrigger:{trigger:pin,start:'top top',end:'bottom bottom',scrub:.6,invalidateOnRefresh:true,onRefresh:setH,
    onUpdate:function(s){if(bar)bar.style.transform='scaleX('+s.progress.toFixed(4)+')';if(num)num.textContent=String(Math.min(cards.length,1+Math.floor(s.progress*cards.length*.999))).padStart(2,'0');
      var vw=innerWidth;imgs.forEach(function(im){var r=im.parentNode.getBoundingClientRect(),c=(r.left+r.width/2)/vw-.5;im.style.transform='translate3d('+(-c*8).toFixed(2)+'%,0,0)'})}}});
}

/* Подарок: ткань ложится, коробка встаёт, крышка, лента, бирка. */
if(MOTION&&$('.gift-st')){var gt=G.timeline({scrollTrigger:{trigger:'.gift-st',start:'top 85%',end:'center 45%',scrub:.6}});
  gt.from('.g-cloth',{y:-60,opacity:0,scaleY:.7,transformOrigin:'50% 0%',ease:'none'})
    .from('.g-box',{y:80,opacity:0,ease:'none'},'<.1')
    .from('.g-lid',{y:-120,rotation:-8,transformOrigin:'50% 100%',opacity:0,ease:'none'})
    .from('.g-rib',{scaleY:0,transformOrigin:'50% 0%',ease:'none'})
    .from('.g-bow',{scale:0,transformOrigin:'50% 50%',ease:'none'})
    .from('.g-tag',{rotation:-40,transformOrigin:'0% 0%',opacity:0,ease:'none'})}
var gn=$('#g-note'),gp=$('#g-prev');if(gn&&gp){gn.addEventListener('input',function(){gp.textContent=gn.value||gn.getAttribute('placeholder')})}

var ICK='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
/* ── Наборы для умры ─────────────────────────────────────────────────── */
var kitW=$('#kits');
if(kitW){var who='her';
  function kitDraw(){var set=K.kits[who];
    $('#kit-list').innerHTML=set.items.map(function(it,i){var pr=it.price?fmt(it.price)+' '+K.sum:'<em>'+h(K.priceYours)+'</em>';
      return '<li><label class="kit-it"><input type="checkbox" data-i="'+i+'"'+(it.on?' checked':'')+'><span class="kit-ck">'+ICK+'</span><span class="kit-th">'+(it.img?'<img src="'+K.img+'/'+it.img+'" alt="" loading="lazy">':'<svg aria-hidden="true"><use href="#i-'+it.ic+'"/></svg>')+'</span><span class="kit-t"><b>'+h(it.n)+'</b><small>'+h(it.s)+'</small></span><span class="kit-p">'+pr+'</span></label></li>'}).join('');
    $$('.kit-vis [data-who]',kitW).forEach(function(im){im.hidden=im.getAttribute('data-who')!==who});
    $('#kit-go').setAttribute('href',K.shop+'#/kit/'+who);
    $$('#kit-list input').forEach(function(inp){inp.onchange=function(){set.items[+inp.getAttribute('data-i')].on=inp.checked;if(inp.checked)flyTo(inp.closest('.kit-it'));kitSum()}});
    kitSum()}
  function kitSum(){var set=K.kits[who],s=0,n=0,open2=0;set.items.forEach(function(it){if(it.on){n++;if(it.price)s+=it.price;else open2++}});
    $('#kit-sum').textContent=fmt(s)+' '+K.sum;$('#kit-n').textContent=K.kitN.replace('{n}',n).replace('{m}',set.items.length)+(open2?K.kitOpen.replace('{n}',open2):'');
    var b=$('.kit-bag');b.classList.remove('bump');void b.offsetWidth;b.classList.add('bump')}
  function flyTo(row){if(REDUCED||!row)return;var th=$('.kit-th',row),to=$('.kit-bag svg');if(!th||!to)return;var a=th.getBoundingClientRect(),b=to.getBoundingClientRect();var c=th.cloneNode(true);c.className='flyer kit-th';c.style.left=a.left+'px';c.style.top=a.top+'px';d.body.appendChild(c);
    var an=c.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:'translate('+(b.left-a.left)*.5+'px,'+((b.top-a.top)*.5-80)+'px) scale(.8)',opacity:1},{transform:'translate('+(b.left-a.left)+'px,'+(b.top-a.top)+'px) scale(.3)',opacity:0}],{duration:700,easing:'cubic-bezier(.5,0,.3,1)'});an.onfinish=function(){c.remove()}}
  $$('.kits-sw button').forEach(function(b){b.onclick=function(){who=b.getAttribute('data-who');$$('.kits-sw button').forEach(function(x){x.setAttribute('aria-selected',x===b)});kitDraw()}});
  kitDraw()}

/* ── Подбор хиджаба по форме лица и случаю ───────────────────────────── */
var fd=$('#finder');
if(fd){var shape=K.finder.shapes[0].id,occ=K.finder.occ[0].id;
  function fdDraw(){var s=K.finder.shapes.filter(function(x){return x.id===shape})[0],o=K.finder.occ.filter(function(x){return x.id===occ})[0];
    var res=$('.fd-res',fd);res.classList.remove('fd-on');
    $('#fd-fig').innerHTML=figSvg(s.face,o.c);
    $('#fd-h').textContent=s.wrap;$('#fd-p').textContent=s.why+' '+o.tip;
    $('#fd-tips').innerHTML=s.tips.map(function(x){return '<li>'+h(x)+'</li>'}).join('');
    var list=K.finder.products.filter(function(p){return p.occ.indexOf(occ)>=0}).concat(K.finder.products.filter(function(p){return p.occ.indexOf(occ)<0})).slice(0,6);
    $('#fd-pr').innerHTML=list.map(function(p){return '<a href="'+K.shop+'#/p/'+p.id+'"><img src="'+K.img+'/'+p.img+'" alt="" loading="lazy"><b>'+h(p.n)+'</b>'+(p.price?fmt(p.price)+' '+K.sum:'')+'</a>'}).join('');
    requestAnimationFrame(function(){requestAnimationFrame(function(){res.classList.add('fd-on')})})}
  $$('.face',fd).forEach(function(b){b.onclick=function(){shape=b.getAttribute('data-s');$$('.face',fd).forEach(function(x){x.setAttribute('aria-checked',x===b)});fdDraw()}});
  $$('.occ button',fd).forEach(function(b){b.onclick=function(){occ=b.getAttribute('data-o');$$('.occ button',fd).forEach(function(x){x.setAttribute('aria-checked',x===b)});fdDraw()}});
  fdDraw()}
function figSvg(face,c){return '<svg viewBox="0 0 120 150" aria-hidden="true"><path class="hj" style="--c:'+c+'" d="M60 8C28 8 12 34 12 64c0 26 8 46 4 72h88c-4-26 4-46 4-72C108 34 92 8 60 8z"/><path class="fc" d="'+face+'"/></svg>'}

/* ── Как завязать: слои встают по шагам, сами, пока блок на экране. ── */
var wr=$('#wrap');
if(wr){var steps=$$('.wr-steps button',wr),lys=$$('.ly',wr),cur=0,auto=!REDUCED,wt=0;
  function wSet(i){cur=i;steps.forEach(function(b,k){if(k===i)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')});lys.forEach(function(l){l.classList.toggle('on',+l.getAttribute('data-s')<=i)})}
  steps.forEach(function(b,k){b.onclick=function(){auto=false;clearInterval(wt);wSet(k)}});
  wSet(REDUCED?steps.length-1:0);
  if(auto&&'IntersectionObserver' in W)new IntersectionObserver(function(es){clearInterval(wt);if(es[0].isIntersecting&&auto)wt=setInterval(function(){wSet((cur+1)%steps.length)},2600)},{threshold:.4}).observe(wr)}

/* ── Размеры: рост в длину изделия и строку таблицы. ─────────────────── */
var szr=$('#sz-r');
if(szr){function szDraw(){var hgt=+szr.value,row=K.sizes.filter(function(r){return hgt>=r.from&&hgt<r.to})[0]||K.sizes[K.sizes.length-1];
    $('#sz-v').textContent=hgt+' '+K.cm;$('#sz-len').textContent=row.len+' '+K.cm;$('#sz-size').textContent=row.size;
    $$('.tbl tbody tr').forEach(function(tr2){tr2.classList.toggle('on',tr2.getAttribute('data-s')===String(row.size))});
    var ab=$('.sz-fig .ab');if(ab)ab.style.transform='scaleY('+(row.len/150).toFixed(3)+')';
    var fig=$('.sz-fig .who');if(fig)fig.style.transform='scale('+(hgt/170).toFixed(3)+')'}
  szr.addEventListener('input',szDraw);szDraw()}

/* ── Подарок за первый заказ: коробка открывается по нажатию. ────────── */
var bn=$('.bn-box');if(bn){var bb=$('button',bn);bb.onclick=function(){bn.classList.add('open');bb.setAttribute('aria-expanded','true');var t=$('#bn-t');if(t)t.hidden=false}}

/* ── Айфон и панель: страница внутри грузится, когда рамка близко. ───── */
function fit(){$$('.iph').forEach(function(p){var s=$('.iscr',p);if(s)s.style.setProperty('--k',($('.iph-in',p).clientWidth/390).toFixed(4))})}
fit();addEventListener('resize',fit);
var frames=$$('iframe[data-src]');function load(f){if(!f.src)f.src=f.getAttribute('data-src')}
if('IntersectionObserver' in W){var fo=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){load(e.target);fo.unobserve(e.target)}})},{rootMargin:'600px 0px'});frames.forEach(function(f){fo.observe(f)})}else frames.forEach(load);
var pf=$('#ph-path iframe');
$$('[data-go]').forEach(function(b){b.addEventListener('click',function(){
  $$('[data-go]').forEach(function(x){x.removeAttribute('aria-current')});b.setAttribute('aria-current','step');
  if(!pf)return;load(pf);var hh=b.getAttribute('data-go');
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

/* ── Конструктор цены: магазин по акции и допы тумблерами. ───────────── */
var rows=$$('#konstruktor input[data-k]'),sumEl=$('#kit-total-sum'),addEl=$('#kit-add'),nEl=$('#kit-cnt'),shown=K.offer.base,rr=0;
function roll(to){var from=shown,st=performance.now();cancelAnimationFrame(rr);if(REDUCED){shown=to;sumEl.textContent=fmt(to)+' $';return}(function f(now){var k=Math.min(1,(now-st)/500);shown=Math.round(from+(to-from)*(1-Math.pow(1-k,3)));sumEl.textContent=fmt(shown)+' $';if(k<1)rr=requestAnimationFrame(f)})(st)}
function kitPrice(){var add=0,n=0;rows.forEach(function(r){if(r.checked){add+=+r.getAttribute('data-p');n++}});addEl.textContent=fmt(add)+' $';nEl.textContent=n;roll(K.offer.base+add)}
rows.forEach(function(r){r.addEventListener('change',kitPrice)});
var all=$('#kit-all');if(all)all.onclick=function(){var on=rows.some(function(r){return !r.checked});rows.forEach(function(r){r.checked=on});kitPrice()};
var cp2=$('#kit-copy');if(cp2)cp2.onclick=function(){var lines=[K.offer.head,'• '+K.offer.baseName+': '+fmt(K.offer.base)+' $'];rows.forEach(function(r){if(r.checked){var it=K.offer.items.filter(function(x){return x.id===r.getAttribute('data-k')})[0];lines.push('• '+it.t+': '+fmt(it.p)+' $')}});lines.push(K.offer.totalW+': '+sumEl.textContent);
  var txt=lines.join('\n');try{navigator.clipboard.writeText(txt).then(function(){cp2.textContent=K.offer.copied})}catch(e){cp2.textContent=K.offer.copied}};
/* Отсчёт 48 часов: с первого открытия макета на этом устройстве. */
var tm=$('#tm'),start=Date.now();try{var s0=+localStorage.getItem('am-offer-1');if(s0&&s0<=Date.now())start=s0;else localStorage.setItem('am-offer-1',String(start))}catch(e){}
var end=start+K.offer.hours*36e5;
function pad(n){return (n<10?'0':'')+n}
function tickT(){var left=Math.max(0,end-Date.now());if(!left){$('#timer').classList.add('over');tm.textContent='00:00:00';$('#timer span').firstChild.textContent=K.offer.ended;return}var hh=Math.floor(left/36e5),mm=Math.floor(left%36e5/6e4),ss=Math.floor(left%6e4/1e3);tm.textContent=pad(hh)+':'+pad(mm)+':'+pad(ss);setTimeout(tickT,1000)}
if(tm)tickT();

/* Шрифты дорисовались: ScrollTrigger пересчитывает высоты. */
if(MOTION){try{d.fonts.ready.then(function(){ST.refresh()})}catch(e){}addEventListener('load',function(){ST.refresh()})}
})();
