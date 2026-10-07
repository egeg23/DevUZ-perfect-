(function(){
'use strict';
var d=document, root=d.documentElement, $=function(id){return d.getElementById(id)};
var L={};try{L=JSON.parse($('i18n').textContent)}catch(e){}
var reduce=false;try{reduce=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
var store={get:function(k,f){try{var v=localStorage.getItem(k);return v?JSON.parse(v):f}catch(e){return f}},set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
var money=function(n){return '$'+String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ')};
var clamp=function(x){return x<0?0:x>1?1:x};
var seg=function(p,a,b){return clamp((p-a)/(b-a))};
var inOut=function(x){return x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2};
var easeIn=function(x){return x*x*x};
var out3=function(x){return 1-Math.pow(1-x,3)};

/* ── Заставка DevUz Studio: пока грузится страница, не дольше 2,2 с, тапом — сразу ── */
var dz=$('dz');
if(dz&&!root.classList.contains('dz-off')){
  var t0=performance.now(),gone=false;
  var hide=function(){if(gone)return;gone=true;dz.classList.add('out');try{sessionStorage.setItem('dz','1')}catch(e){}setTimeout(function(){dz.remove()},450)};
  var ready=function(){setTimeout(hide,Math.max(0,(reduce?300:1100)-(performance.now()-t0)))};
  if(d.readyState==='complete')ready();else addEventListener('load',ready);
  setTimeout(hide,2200);
  dz.addEventListener('click',hide);
  addEventListener('keydown',hide,{once:true});
}else if(dz){dz.remove()}

/* ── Появление блоков ── */
var rv=[].slice.call(d.querySelectorAll('.rv'));
if('IntersectionObserver' in window&&!reduce){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
  rv.forEach(function(el){io.observe(el)});
}else rv.forEach(function(el){el.classList.add('in')});

/* ── Сцены по прокрутке: позиция читается в кадре, а не из события ── */
function scene(sec,draw){
  if(!sec||reduce)return;
  var active=false,raf=0,last=-1;
  function frame(){
    raf=0;if(!active||sec.hidden)return;
    var r=sec.getBoundingClientRect(),len=r.height-innerHeight,p=len>0?clamp(-r.top/len):0;
    if(Math.abs(p-last)>.0004){last=p;draw(p)}
    raf=requestAnimationFrame(frame);
  }
  new IntersectionObserver(function(es){active=es[0].isIntersecting;if(active&&!raf)raf=requestAnimationFrame(frame)}).observe(sec);
}
var q=function(sec,k){return sec&&sec.querySelector('[data-l="'+k+'"]')};

var hero=d.querySelector('[data-scene="hero"]');
if(hero){
  var far=q(hero,'far'),rig=q(hero,'rig'),lift=q(hero,'lift'),car=q(hero,'car'),rf=q(hero,'rimf'),rr=q(hero,'rimr'),sh=q(hero,'shadow'),fgl=q(hero,'fgl'),fgr=q(hero,'fgr'),txt=q(hero,'txt'),end=q(hero,'end'),say=hero.querySelector('[data-say]');
  var sayN=-1;
  scene(hero,function(p){
    if(rig.hidden)return;
    var W=innerWidth,H=hero.querySelector('.stage').clientHeight,mob=W<768;
    var a=out3(seg(p,0,.28)),b=inOut(seg(p,.3,.6)),c=easeIn(seg(p,.64,.94)),e=seg(p,.9,1);
    var raise=H*(mob?.14:.26),cw=car.clientWidth,rh=rig.clientHeight;
    far.style.transform='scale('+(1.18-.18*a+.05*p)+')';
    fgl.style.transform='translate3d('+(-a*W*.55)+'px,0,0) scale('+(1+.6*a)+')';
    fgr.style.transform='translate3d('+(a*W*.55)+'px,0,0) scale('+(1+.6*a)+')';
    fgl.style.opacity=fgr.style.opacity=String(1-a*.6);
    rig.style.transform='translate3d(0,'+((1-a)*H*(mob?.015:.04))+'px,0) scale('+(.84+.16*a)+')';
    lift.style.transform='translate3d(0,'+(-(1-b)*raise)+'px,0)';
    sh.style.opacity=String(.2+.7*b);
    var dx=-c*(W*.55+cw*1.15),off=Math.max(0,-dx-cw*.1),dy=Math.min(1,off/(cw*.25))*rh*.22;
    car.style.transform='translate3d('+dx+'px,'+dy+'px,0)';
    var ang=dx/(cw*124/1800)*57.3;
    rf.style.transform=rr.style.transform='rotate('+ang+'deg)';
    var tp=seg(p,.02,.16);txt.style.opacity=String(1-tp);txt.style.transform='translate3d(0,'+(-tp*48)+'px,0)';txt.style.visibility=tp>=1?'hidden':'visible';
    end.style.opacity=String(e);end.style.transform='translate3d(0,'+(-40+(1-e)*-10)+'%,0)';end.classList.toggle('on',e>.5);
    var n=p<.05||e>.3?-1:p<.3?0:p<.62?1:2;
    if(n!==sayN){sayN=n;if(n<0)say.classList.remove('on');else{say.textContent=(L.say||[])[n]||'';say.classList.add('on')}}
  });
}

var oil=d.querySelector('[data-scene="oil"]');
if(oil){
  var of=q(oil,'oilf'),st=q(oil,'stream'),g=q(oil,'gauge'),gt=q(oil,'gaugeT');
  scene(oil,function(p){
    var z=1.2-.2*out3(seg(p,0,.4));of.style.transform='scale('+(-z)+','+z+')';
    st.style.transform='scaleY('+out3(seg(p,.14,.5))+')';
    oil.classList.toggle('pour',p>.5&&p<.98);
    g.style.transform='scaleX('+seg(p,.2,.92)+')';
    gt.textContent=p>.9?'MAX':'MIN';
  });
}

/* ── Открыто ли сейчас: часы с их сайта, время Ташкента ── */
(function(){
  var t=new Date(Date.now()+5*36e5),day=t.getUTCDay(),h=t.getUTCHours();
  var open=day>=1&&day<=6&&h>=9&&h<18;
  root.classList.toggle('is-open',open);
  var txt=open?L.open:(day===0||(day===6&&h>=18))?L.closedSun:L.closed;
  d.querySelectorAll('.open-t').forEach(function(el){el.textContent=txt||''});
})();

/* ── Запись ── */
var book=$('book');
if(book){
  var days=$('days'),now=new Date(Date.now()+5*36e5),list=[],k=0;
  while(list.length<6&&k<9){
    var dt=new Date(now.getTime()+k*864e5),wd=dt.getUTCDay();
    if(wd!==0&&!(k===0&&now.getUTCHours()>=17))list.push({k:k,wd:wd,dt:dt});
    k++;
  }
  days.innerHTML=list.map(function(x){
    var lab=x.k===0?L.today:x.k===1?L.tomorrow:L.days[x.wd]+', '+x.dt.getUTCDate()+' '+L.months[x.dt.getUTCMonth()];
    return '<label class="opt"><input type="radio" name="d" value="'+lab+'" data-k="'+x.k+'"><span>'+lab+'</span></label>';
  }).join('');
  var val=function(n){var x=book.querySelector('input[name="'+n+'"]:checked');return x?x.value:''};
  var fld=function(id){return ($(id).value||'').trim()};
  function times(){
    var dk=book.querySelector('input[name="d"]:checked'),today=dk&&dk.dataset.k==='0',h=now.getUTCHours();
    book.querySelectorAll('input[name="h"]').forEach(function(x){var dis=today&&parseInt(x.value,10)<=h;x.disabled=dis;if(dis)x.checked=false});
  }
  function text(){
    var w=[val('d'),val('h')].filter(Boolean).join(', ');
    return L.msgHead+'\n'+L.fService+': '+(val('s')||'—')+'\n'+L.fCar+': '+(fld('car')||'—')+'\n'+L.fTrouble+': '+(fld('trouble')||'—')+'\n'+L.fWhen+': '+(w||'—')+'\n'+L.fName+': '+(fld('nm')||'—')+'\n'+L.fPhone+': '+(fld('ph')||'—');
  }
  function draw(){
    times();
    var m=$('msg');if(m)m.textContent=text();
    var t=new Date(Date.now()+5*36e5),mt=$('msg-t');if(mt)mt.textContent=('0'+t.getUTCHours()).slice(-2)+':'+('0'+t.getUTCMinutes()).slice(-2);
  }
  var pre=(location.search.match(/[?&]s=([a-z]+)/)||[])[1];
  if(pre){var x=book.querySelector('input[name="s"][data-id="'+pre+'"]');if(x)x.checked=true}
  book.addEventListener('input',draw);book.addEventListener('change',draw);draw();
  book.addEventListener('submit',function(e){
    e.preventDefault();
    var err=$('err'),done=$('done'),digits=fld('ph').replace(/\D/g,'');
    if(!val('s')||!val('d')||!val('h')||digits.length<9){err.textContent=L.need;err.hidden=false;done.hidden=true;return}
    err.hidden=true;
    var msg=text();
    try{navigator.clipboard.writeText(msg)}catch(x){}
    done.textContent=L.sent+L.phoneM;done.hidden=false;
    window.open(L.tgUrl,'_blank','noopener');
  });
}

/* ── Было / стало ── */
d.querySelectorAll('[data-ba]').forEach(function(box){
  var r=box.querySelector('input');
  var set=function(){box.style.setProperty('--x',r.value+'%')};
  r.addEventListener('input',set);set();
});

/* ── Сайт как приложение ── */
var base=(L.base||'').replace(/\/uz$/,'');
if('serviceWorker' in navigator&&base){
  addEventListener('load',function(){navigator.serviceWorker.register(base+'/sw',{scope:base+'/'}).catch(function(){})});
}
var deferred=null;
addEventListener('beforeinstallprompt',function(e){e.preventDefault();deferred=e});
addEventListener('appinstalled',function(){d.querySelectorAll('[data-install]').forEach(function(b){b.textContent=L.installed})});
var ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
d.querySelectorAll('[data-install]').forEach(function(b){
  b.addEventListener('click',function(){
    if(deferred){deferred.prompt();deferred.userChoice.then(function(){deferred=null});return}
    var box=b.parentNode.querySelector('[data-ios]');if(box)box.classList.toggle('on');
  });
});
if(!ios)d.querySelectorAll('[data-ios] b').forEach(function(b){b.textContent=L.lang==='ru'?'Как добавить на Android':'Android’ga qanday qo‘shish'});
if(!ios)d.querySelectorAll('[data-ios] ol').forEach(function(o){o.innerHTML=L.lang==='ru'?'<li>Откройте меню браузера ⋮</li><li>Выберите «Установить приложение» или «Добавить на главный экран»</li>':'<li>Brauzer menyusini oching ⋮</li><li>«Ilovani o‘rnatish» yoki «Bosh ekranga qo‘shish»ni tanlang</li>'});

/* ── Конструктор (как у MAVERA): тумблер — настоящий блок на странице ── */
var KEY='am-kit-v1',inputs=[].slice.call(d.querySelectorAll('input[data-k][data-p]'));
if(inputs.length){
  var price={},needs={},def={},title={};
  inputs.forEach(function(x){var k=x.dataset.k;price[k]=+x.dataset.p;needs[k]=(x.dataset.needs||'').split(' ').filter(Boolean);if(x.hasAttribute('data-def'))def[k]=true;
    var r=x.closest('label'),tt=r&&r.querySelector('b');if(tt&&!title[k])title[k]=tt.firstChild.textContent});
  var on=store.get(KEY,null)||{};Object.keys(price).forEach(function(k){if(!(k in on))on[k]=!!def[k]});
  var pill=$('kd-pill'),panel=$('kd'),kb=+(L.kitBase||0);
  function apply(fresh){
    Object.keys(price).forEach(function(k){
      root.classList.toggle('k-no-'+k,!on[k]);
      d.querySelectorAll('[data-addon="'+k+'"]').forEach(function(el){el.hidden=!on[k];if(fresh===k&&on[k]&&!reduce){el.classList.remove('k-fresh');void el.offsetWidth;el.classList.add('k-fresh')}});
    });
    inputs.forEach(function(x){x.checked=!!on[x.dataset.k]});
    d.querySelectorAll('.kit-pv[data-pv]').forEach(function(p){p.hidden=!on[p.dataset.pv];p.classList.toggle('fresh',p.dataset.pv===fresh&&!reduce)});
    var ids=Object.keys(price).filter(function(k){return on[k]}),add=ids.reduce(function(s,k){return s+price[k]},0),sum=kb+add;
    var set=function(id,v){var el=$(id);if(el)el.textContent=v};
    set('kd-pill-sum',money(sum));set('kd-sum',money(sum));set('kd-add','+'+money(add));set('kd-n',(L.kitN||'').replace('{n}',ids.length));
    set('kit-sum',money(sum));set('kit-n',(L.kitN||'').replace('{n}',ids.length));
    root.dataset.kit=L.kitTg+'\n'+L.kitBaseName+' — '+money(kb)+'\n'+ids.map(function(k){return title[k]+' — '+money(price[k])}).join('\n')+'\n'+L.kitTotal+': '+money(sum);
    store.set(KEY,on);
  }
  function setK(k,v){
    on[k]=v;
    if(v)needs[k].forEach(function(n){if((n in on)&&!on[n])setK(n,true)});
    else Object.keys(needs).forEach(function(o){if(on[o]&&needs[o].indexOf(k)>=0)setK(o,false)});
  }
  inputs.forEach(function(x){x.addEventListener('change',function(){setK(x.dataset.k,x.checked);apply(x.checked?x.dataset.k:'')})});
  function open(v){if(!panel)return;panel.hidden=!v;pill.setAttribute('aria-expanded',String(v));pill.hidden=v}
  if(pill)pill.addEventListener('click',function(){open(true)});
  var xb=$('kd-x');if(xb)xb.addEventListener('click',function(){open(false)});
  addEventListener('keydown',function(e){if(e.key==='Escape'&&panel&&!panel.hidden)open(false)});
  var rs=$('kd-reset');if(rs)rs.addEventListener('click',function(){Object.keys(price).forEach(function(k){on[k]=!!def[k]});apply('')});
  var cp=$('kd-copy');if(cp)cp.addEventListener('click',function(){try{navigator.clipboard.writeText(root.dataset.kit).then(function(){var o=cp.textContent;cp.textContent=L.copied;setTimeout(function(){cp.textContent=o},1400)})}catch(e){}});
  apply('');
}
})();
