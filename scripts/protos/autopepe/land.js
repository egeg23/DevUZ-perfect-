/* Pierwsza strona makiety: wybór „Strona” albo „Panel” i konstruktor ceny.
   Przełącznik zapisuje ap-cfg-1, strona go czyta i chowa blok wyłączonego dodatku. */
(function(){
var d=document,w=window,$=function(s,r){return(r||d).querySelector(s)},$$=function(s,r){return[].slice.call((r||d).querySelectorAll(s))};
var D=JSON.parse($('#ap-land').textContent),T=D.t;
var RM=w.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function get(k,def){try{var v=localStorage.getItem(k);return v?JSON.parse(v):def}catch(e){return def}}
function put(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function money(n){return fmt(n)+' $'}
var toastT=0;function toast(m){var t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('on')},2200)}
/* Szapka: chowa się przy każdym przewinięciu, wraca 3 s po ostatnim zdarzeniu. */
var top=$('.top'),IDLE=3000,idleT=0;
function headIdle(){if(!top)return;clearTimeout(idleT);
  if(!top.contains(d.activeElement))top.classList.add('hide');
  idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}
addEventListener('scroll',headIdle,{passive:true});
(function heroIn(){if(d.documentElement.classList.contains('api')){setTimeout(heroIn,150);return}$$('.land .rise').forEach(function(e){e.classList.add('on')})})();
var io='IntersectionObserver'in w?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'}):null;
$$('.rise,.pop').forEach(function(e){if(e.closest('.land'))return;if(io&&!RM)io.observe(e);else e.classList.add('on')});
d.addEventListener('pointermove',function(e){var g=e.target.closest&&e.target.closest('.glass,.choice');if(!g)return;var r=g.getBoundingClientRect();g.style.setProperty('--gx',((e.clientX-r.left)/r.width*100)+'%');g.style.setProperty('--gy',((e.clientY-r.top)/r.height*100)+'%')},{passive:true});
/* Lakier w tle i na karcie strony: lampy za kursorem. */
var A=$('#hl')&&w.Lak?Lak.make($('#hl'),'hero'):null,B=$('#cl')&&w.Lak?Lak.make($('#cl'),'hero'):null;
if(B){B.s.board=.0;B.s.shift=.08}
if(!RM&&matchMedia('(pointer: fine)').matches)addEventListener('pointermove',function(e){var x=(e.clientX/innerWidth-.5)*2,y=-(e.clientY/innerHeight-.5)*1.2;if(A)A.aim(x,y);if(B)B.aim(x,y)},{passive:true});
addEventListener('scroll',function(){if(A&&scrollY<innerHeight*1.2){A.s.shift=-scrollY/innerHeight*.35;A.kick()}},{passive:true});
/* Konstruktor. */
var cfg=get('ap-cfg-1',{}),boxes=$$('[data-add]');
function cfgApply(){var s=0,n=0;boxes.forEach(function(b){var id=b.getAttribute('data-add');b.checked=cfg[id]!==false;if(b.checked){var a=D.add.filter(function(x){return x.id===id})[0];s+=a.p;n++}});
  $('#adds').textContent=money(s);$('#addn').textContent=n?'('+n+')':'';$('#total').textContent=money(D.base+s);put('ap-cfg-1',cfg)}
boxes.forEach(function(b){b.addEventListener('change',function(){cfg[b.getAttribute('data-add')]=b.checked;cfgApply()})});
$('#allon').addEventListener('click',function(){cfg={};cfgApply()});
$('#alloff').addEventListener('click',function(){boxes.forEach(function(b){cfg[b.getAttribute('data-add')]=false});cfgApply()});
$('#copy').addEventListener('click',function(){var txt=[$('.base b').textContent+': '+money(D.base)];D.add.forEach(function(a){if(cfg[a.id]!==false)txt.push(a.t+': '+money(a.p))});txt.push(T.tot+': '+$('#total').textContent);
  var done=function(){toast(T.copied)};if(navigator.clipboard)navigator.clipboard.writeText(txt.join('\n')).then(done,done);else done()});
cfgApply();
/* 48 godzin od pierwszego otwarcia makiety na tym urządzeniu. */
var t0=get('ap-offer-1',0);if(!t0){t0=Date.now();put('ap-offer-1',t0)}
(function clock(){var left=Math.max(0,t0+D.hours*36e5-Date.now()),h=Math.floor(left/36e5),m=Math.floor(left%36e5/6e4),s=Math.floor(left%6e4/1e3);
  $('#th').textContent=h;$('#tm').textContent=('0'+m).slice(-2);$('#ts').textContent=('0'+s).slice(-2);if(left>0)setTimeout(clock,1000)})();
var sp=$('#lspark');if(sp){var z=20261029,r=function(){z=(z*16807)%2147483647;return z/2147483647},h='';for(var i=0;i<24;i++)h+='<i style="height:'+(18+(1+Math.floor(r()*5))*16)+'%"></i>';sp.innerHTML=h}
})();
