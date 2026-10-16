(function(){
'use strict';
/* site: шапка, меню, заявка справа, сообщения в Telegram, смена кухонь на
   первом экране, примерка фасадов, лента работ, расчёт метров, параллакс
   и счётчики. Прокрутку не перехватывает: всё считается от положения
   страницы и пишется только в transform и opacity. */
var d=document,root=d.documentElement;
var $=function(s,r){return (r||d).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))};
var L=JSON.parse(($('#i18n')||{}).textContent||'{}');
var REDUCED=root.classList.contains('rm');
var clamp=function(x,a,b){return x<a?a:x>b?b:x};

/* ── Сообщение в Telegram vTashkente. Готовый текст в чат по ссылке не
   подставить, поэтому кладём его в буфер обмена и открываем чат. ── */
var toast=$('#toast'),toastT=0;
function copy(text){try{if(navigator.clipboard)navigator.clipboard.writeText(text).catch(function(){})}catch(e){}}
function say(){if(!toast)return;toast.hidden=false;clearTimeout(toastT);toastT=setTimeout(function(){toast.hidden=true},3200)}
d.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[data-tg]');if(!a)return;var text=a.getAttribute('data-tg')||'';if(text){copy(text);say()}});

/* ── Шапка (правило владельца, 15.10.2026): при любой прокрутке прячется
   и возвращается только через 3 секунды после полной остановки. Инерция
   на телефоне тоже шлёт scroll, таймер ждёт её конца. Пока фокус с
   клавиатуры внутри шапки, она не прячется. ── */
var top=$('#top'),dock=$('#dock'),IDLE=3000,idleT=0;
function headIdle(){if(!top)return;clearTimeout(idleT);
  if(!top.contains(d.activeElement))top.classList.add('hide');
  idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}

/* ── Меню во весь экран ── */
var menu=$('#menu'),mBtn=$('#menu-btn'),bgs=$$('.mn-bg');
function menuSet(on){if(!menu)return;if(on){menu.hidden=false;requestAnimationFrame(function(){menu.classList.add('on')});mBtn.setAttribute('aria-expanded','true');root.style.overflow='hidden';var f=$('.mn-i',menu);if(f)f.focus()}
  else{menu.classList.remove('on');mBtn.setAttribute('aria-expanded','false');root.style.overflow='';setTimeout(function(){if(!menu.classList.contains('on'))menu.hidden=true},400)}}
if(mBtn)mBtn.addEventListener('click',function(){menuSet(menu.hidden)});
$$('.mn-i').forEach(function(a){
  var pick=function(){var i=+a.getAttribute('data-i');bgs.forEach(function(b,j){b.classList.toggle('on',i===j)})};
  a.addEventListener('mouseenter',pick);a.addEventListener('focus',pick);a.addEventListener('click',function(){menuSet(false)})});
if(menu)$('[data-close]',menu).addEventListener('click',function(){menuSet(false)});

/* ── Заявка справа: та же форма, что в последней секции ── */
var panel=$('#panel'),back=$('#pn-back'),opener=null;
function panelSet(on){if(!panel)return;
  if(on){opener=d.activeElement;panel.hidden=false;back.hidden=false;requestAnimationFrame(function(){panel.classList.add('on');back.classList.add('on')});root.style.overflow='hidden';setTimeout(function(){var i=$('input[name=phone]',panel);if(i)i.focus({preventScroll:true})},420)}
  else{panel.classList.remove('on');back.classList.remove('on');root.style.overflow='';setTimeout(function(){if(!panel.classList.contains('on')){panel.hidden=true;back.hidden=true}},500);if(opener&&opener.focus)opener.focus({preventScroll:true})}}
d.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-zamer]');if(!b)return;e.preventDefault();if(menu&&!menu.hidden)menuSet(false);panelSet(true)});
if(panel){$('[data-close]',panel).addEventListener('click',function(){panelSet(false)});back.addEventListener('click',function(){panelSet(false)})}
d.addEventListener('keydown',function(e){if(e.key!=='Escape')return;if(panel&&!panel.hidden)panelSet(false);if(menu&&!menu.hidden)menuSet(false)});

/* Размеры из расчёта попадают в обе формы. */
var sizeLine='';
function sizeSet(text){sizeLine=text;$$('[data-size]').forEach(function(p){p.textContent=text;p.hidden=!text})}
$$('[data-form]').forEach(function(f){
  f.addEventListener('submit',function(e){e.preventDefault();
    var ph=f.elements.phone.value.replace(/[^\d+]/g,'');var err=$('[data-err]',f);
    if(ph.replace(/\D/g,'').length<9){err.hidden=false;f.elements.phone.focus();return}err.hidden=true;
    var pick=function(n){var r=$('input[name$="-'+n+'"]:checked',f);return r?r.value:L.none};
    var lines=[L.formHead,L.fName+': '+(f.elements.name.value.trim()||L.none),L.fPhone+': '+f.elements.phone.value.trim(),L.fWhat+': '+pick('what'),L.fWhen+': '+pick('when')];
    if(sizeLine)lines.push(sizeLine);
    var text=lines.join('\n');$('[data-sum]',f).textContent=text;copy(text);
    var a=$('[data-tg-form]',f);if(a)a.setAttribute('data-tg',text);
    f.classList.add('sent');$('[data-ok]',f).hidden=false;
  })});

/* ── 1. Первый экран: кухни сменяют друг друга, слово в плашке перебирается ── */
var hero=$('#hero'),imgs=$$('.hr-img'),bars=$$('.hr-bars i'),hrI=$('#hr-i'),hrName=$('#hr-name'),roll=$$('.hr-roll b'),slide=0,word=0,heroT=0,wordT=0;
function show(n){imgs[slide].classList.remove('on');bars[slide].classList.remove('on');bars[slide].classList.add('past');
  slide=n%imgs.length;if(slide===0)bars.forEach(function(b){b.classList.remove('past')});
  var img=imgs[slide];img.classList.remove('on');void img.offsetWidth;img.classList.add('on');
  bars[slide].classList.remove('past');void bars[slide].offsetWidth;bars[slide].classList.add('on');
  if(hrI)hrI.textContent='0'+(slide+1);if(hrName&&L.hero)hrName.textContent=L.hero[slide]}
function nextWord(){var a=roll[word];a.classList.remove('on');a.classList.add('out');setTimeout(function(){a.classList.remove('out')},700);word=(word+1)%roll.length;roll[word].classList.add('on')}
function heroGo(){if(REDUCED||heroT||imgs.length<2)return;
  /* картинки следующих кухонь грузятся заранее, чтобы смена не мигала */
  imgs.forEach(function(i){i.loading='eager'});
  heroT=setInterval(function(){if(!d.hidden&&inHero)show(slide+1)},6000);wordT=setInterval(function(){if(!d.hidden&&inHero)nextWord()},2200)}
var inHero=true;
if(hero&&'IntersectionObserver' in window)new IntersectionObserver(function(es){inHero=es[0].isIntersecting}).observe(hero);
if(d.body.classList.contains('hero-on'))heroGo();else d.addEventListener('vt:hero',heroGo);
if(REDUCED&&bars[0])bars[0].classList.add('past');

/* ── 3. Примерка: цвет ложится на фасады и столешницу умножением ── */
var tryPic=$('#try-pic'),sweep=$('.try-sweep'),sel={facade:'',top:''},selN={};
$$('.sw').forEach(function(b){b.addEventListener('click',function(){
  var g=b.getAttribute('data-g'),c=b.getAttribute('data-c');
  $$('.sw[data-g="'+g+'"]').forEach(function(x){var on=x===b;x.classList.toggle('on',on);x.setAttribute('aria-pressed',String(on))});
  var z=$('.try-z[data-z="'+g+'"]',tryPic);sel[g]=c;selN[g]=b.getAttribute('data-n');
  if(c){z.setAttribute('fill',c==='wood'?'url(#wood)':c);z.classList.add('on')}else z.classList.remove('on');
  var tag=$('[data-tag="'+g+'"]',tryPic);if(tag)tag.textContent=selN[g];
  if(sweep&&!REDUCED){sweep.classList.remove('go');void sweep.offsetWidth;sweep.classList.add('go')}
  var go=$('.try-go');if(go&&L.tryTg){var f=selN.facade||$('.sw[data-g="facade"]').getAttribute('data-n'),t=selN.top||$('.sw[data-g="top"]').getAttribute('data-n');go.setAttribute('data-tg',L.tryTg.replace('{f}',f.toLowerCase()).replace('{t}',t.toLowerCase()))}
})});

/* ── 5. Расчёт метров кухни ── */
var calc=$('#calc');
if(calc){
  var plan=$('#plan'),gk=$('.plan-k',plan),gg=$('.plan-grid',plan),mOut=$('#calc-m'),tgA=$('#calc-tg'),SVGN='http://www.w3.org/2000/svg';
  for(var gx=0;gx<=320;gx+=20){var ln=d.createElementNS(SVGN,'line');ln.setAttribute('x1',gx);ln.setAttribute('x2',gx);ln.setAttribute('y1',0);ln.setAttribute('y2',240);gg.appendChild(ln)}
  for(var gy=0;gy<=240;gy+=20){ln=d.createElementNS(SVGN,'line');ln.setAttribute('y1',gy);ln.setAttribute('y2',gy);ln.setAttribute('x1',0);ln.setAttribute('x2',320);gg.appendChild(ln)}
  var R={};$$('[data-r]',calc).forEach(function(i){R[i.getAttribute('data-r')]=i});
  var NEED={line:['a'],corner:['a','b'],u:['a','b','c'],island:['a','i']};
  var rect=function(x,y,w,h,cls){var r=d.createElementNS(SVGN,'rect');r.setAttribute('x',x.toFixed(1));r.setAttribute('y',y.toFixed(1));r.setAttribute('width',w.toFixed(1));r.setAttribute('height',h.toFixed(1));r.setAttribute('rx',2);if(cls)r.setAttribute('class',cls);gk.appendChild(r)};
  var label=function(x,y,t){var e=d.createElementNS(SVGN,'text');e.setAttribute('x',x.toFixed(1));e.setAttribute('y',y.toFixed(1));e.setAttribute('text-anchor','middle');e.textContent=t;gk.appendChild(e)};
  var fmt=function(n){return (Math.round(n*10)/10).toFixed(1).replace('.',L.lang==='ru'||L.lang==='uz'?',':'.')};
  var calcRun=function(){
    var lay=($('input[name=lay]:checked',calc)||{}).value||'corner',need=NEED[lay];
    $$('[data-wall]',calc).forEach(function(w){w.hidden=need.indexOf(w.getAttribute('data-wall'))<0});
    var v={};Object.keys(R).forEach(function(k){v[k]=+R[k].value;var o=$('[data-o="'+k+'"]',calc);if(o)o.textContent=v[k]});
    /* погонные метры: длины по стенам, угол считается один раз */
    var m=v.a/100;if(lay==='corner')m+=v.b/100-.6;if(lay==='u')m+=(v.b+v.c)/100-1.2;if(lay==='island')m+=v.i/100;
    mOut.textContent=fmt(m);
    while(gk.firstChild)gk.removeChild(gk.firstChild);
    var k=200/Math.max(v.a,lay==='u'||lay==='corner'?Math.max(v.b,lay==='u'?v.c:0)*1.2:0,300),D=60*k,x0=(320-v.a*k)/2,y0=24;
    rect(x0,y0,v.a*k,D);label(x0+v.a*k/2,y0-8,v.a+' '+L.cm);
    if(lay==='corner'||lay==='u'){rect(x0,y0+D,D,v.b*k-D);label(x0-4,y0+v.b*k/2+20,v.b+'')}
    if(lay==='u'){rect(x0+v.a*k-D,y0+D,D,v.c*k-D);label(x0+v.a*k+4,y0+v.c*k/2+20,v.c+'')}
    if(lay==='island'){var iw=v.i*k;rect((320-iw)/2,y0+D+56*k+30,iw,D*1.1,'is');label(160,y0+D+56*k+30+D*1.1+16,L.island+' '+v.i+' '+L.cm)}
    var sizes=need.map(function(n){return v[n]+' '+L.cm}).join(' + ');
    var msg=L.calcTg.replace('{lay}',L.lay[lay]).replace('{sizes}',sizes).replace('{m}',fmt(m));
    tgA.setAttribute('data-tg',msg);
    calc.setAttribute('data-size',L.calcSize.replace('{lay}',L.lay[lay]).replace('{sizes}',sizes).replace('{m}',fmt(m)));
  };
  calc.addEventListener('input',calcRun);calc.addEventListener('change',calcRun);calcRun();
  $('#calc-z').addEventListener('click',function(){sizeSet(calc.getAttribute('data-size'));panelSet(true)});
}

/* ── Появление шагов и счётчики ── */
var steps=$('#od-steps');
if('IntersectionObserver' in window&&!REDUCED){
  if(steps)new IntersectionObserver(function(es,o){if(es[0].isIntersecting){steps.classList.add('in');o.disconnect()}},{threshold:.2}).observe(steps);
  $$('[data-to]').forEach(function(el){var to=+el.getAttribute('data-to');el.textContent='0';
    new IntersectionObserver(function(es,o){if(!es[0].isIntersecting)return;o.disconnect();var t0=performance.now();
      (function f(now){var k=Math.min(1,(now-t0)/1200);el.textContent=String(Math.round(to*(1-Math.pow(1-k,3))));if(k<1)requestAnimationFrame(f)})(t0)},{threshold:.6}).observe(el)});
}else if(steps)steps.classList.add('in');

/* ── Прокрутка: лента работ вбок, параллакс снимков, бегущая строка ── */
var works=$('#raboty'),track=$('#wk-track'),wkBar=$('.wk-bar'),wkI=$('#wk-i'),cards=$$('.wk',track),par=$$('[data-par]'),mq=$('.mq-in'),zamer=$('#zamer'),asmSec=$('#sborka'),tick=false,lastY=scrollY,vel=0;
var mqAnim=mq&&mq.getAnimations?mq.getAnimations()[0]:null;
function frame(){
  tick=false;var h=innerHeight,y=scrollY,dy=y-lastY;lastY=y;
  if(works&&track&&!REDUCED){var r=works.getBoundingClientRect();
    if(r.bottom>0&&r.top<h){var p=clamp(-r.top/Math.max(1,r.height-h),0,1),max=Math.max(0,track.scrollWidth-innerWidth);
      track.style.transform='translate3d('+(-p*max).toFixed(1)+'px,0,0)';if(wkBar)wkBar.style.setProperty('--p',p.toFixed(4));
      var mid=innerWidth/2,best=0,bd=1e9;cards.forEach(function(c,i){var b=c.getBoundingClientRect(),dd=Math.abs(b.left+b.width/2-mid);c.classList.toggle('near',b.left<innerWidth&&b.right>0);if(dd<bd&&!c.classList.contains('wk-end')){bd=dd;best=i}});
      if(wkI)wkI.textContent='0'+(best+1)}}
  if(!REDUCED)for(var i=0;i<par.length;i++){var el=par[i],b=el.parentNode.getBoundingClientRect();if(b.bottom<-200||b.top>h+200)continue;el.style.transform='translate3d(0,'+((b.top+b.height/2-h/2)*-(+el.getAttribute('data-par'))).toFixed(1)+'px,0)'}
  /* бегущая строка ускоряется от прокрутки и меняет направление */
  if(mqAnim&&!REDUCED){vel=vel*.85+dy*.15;var rate=1+clamp(Math.abs(vel)/6,0,5);mqAnim.playbackRate=(vel<-1?-1:1)*rate}
  /* нижние кнопки не закрывают форму заявки */
  if(dock&&zamer){var zr=zamer.getBoundingClientRect(),ar=asmSec?asmSec.getBoundingClientRect():null;
    /* и не закрывают шаги сборки, пока её кадр закреплён */
    dock.classList.toggle('off',zr.top<h*.6&&zr.bottom>0||!!ar&&ar.top<=1&&ar.bottom>=h-1)}
}
function onScroll(){headIdle();if(!tick){tick=true;requestAnimationFrame(frame)}}
addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',function(){if(!tick){tick=true;requestAnimationFrame(frame)}});frame();
if(mqAnim&&!REDUCED)setInterval(function(){if(!tick){tick=true;requestAnimationFrame(frame)}},120);
})();
