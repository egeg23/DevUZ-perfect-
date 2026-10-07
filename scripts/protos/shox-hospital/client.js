(function(){
var d=document,W=window,html=d.documentElement;
var T=JSON.parse(d.getElementById('i18n').textContent);
var DOCS=JSON.parse(d.getElementById('docs').textContent);
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
function $(s,r){return (r||d).querySelector(s)}
function $$(s,r){return [].slice.call((r||d).querySelectorAll(s))}
function clamp(n,a,b){return Math.min(b,Math.max(a,n))}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function store(k,v){try{if(v===undefined){var r=localStorage.getItem(k);return r?JSON.parse(r):null}localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return v===undefined?null:false}}
function copy(text){try{if(navigator.clipboard)return navigator.clipboard.writeText(text)}catch(e){}return Promise.reject()}
var DOC={};DOCS.forEach(function(x){DOC[x.s]=x});

/* ── Заставка DevUz ── */
var dz=d.getElementById('dz'),dzDone=false;
function dzOff(){if(dzDone)return;dzDone=true;if(dz)dz.classList.add('off');try{sessionStorage.setItem('dz','1')}catch(e){}afterSplash()}
if(dz&&!html.classList.contains('dz-off')&&!reduce){dz.addEventListener('click',dzOff);setTimeout(dzOff,1300)}else{dzDone=true;setTimeout(afterSplash,300)}

/* ── Появление блоков ── */
var rv=$$('.rv-in');
if('IntersectionObserver' in W&&!reduce){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
  rv.forEach(function(el){io.observe(el)});
}else rv.forEach(function(el){el.classList.add('in')});

/* ── Один кадр на всё, что движется за прокруткой; только пока видно ── */
var movers=[],live=new Set(),raf=0;
function loop(){raf=0;var any=false;movers.forEach(function(m){if(live.has(m.el)){m.fn();any=true}});if(any)raf=requestAnimationFrame(loop)}
function kick(){if(!raf)raf=requestAnimationFrame(loop)}
function mover(el,fn){movers.push({el:el,fn:fn});if('IntersectionObserver' in W)new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)live.add(el);else live.delete(el)});kick()}).observe(el);else{live.add(el);kick()}}

/* ── 3D-пролёт по врачам ── */
var fly=d.getElementById('fly');
if(fly){
  var stage=$('.fly-stage',fly),world=$('.fly-world',fly),cards=$$('.fly-card',fly),xs=$$('.fly-x',fly),intro=$('.fly-intro',fly),outro=$('.fly-outro',fly),bar=$('.fly-hud .bar i',fly),now=$('.fly-now',fly);
  if(reduce||!('IntersectionObserver' in W)||!CSS.supports('transform-style','preserve-3d'))fly.classList.add('static');
  else{
    var N=cards.length,GAP=0,FAR=0,NEAR=0,DROP=0,MOB=false,last=-1,lastNow=-1,ops=[];
    var layout=function(){
      var w=innerWidth,h=innerHeight,mob=w<900;MOB=mob;
      GAP=mob?420:560;DROP=mob?h*.2:0;FAR=GAP*4.2;NEAR=mob?240:380;
      var X=mob?w*.17:Math.min(w*.24,380);
      cards.forEach(function(c,i){var side=i%2?-1:1,y=((i%3)-1)*h*(mob?.07:.08);c.style.transform='translate3d('+(side*X).toFixed(1)+'px,'+y.toFixed(1)+'px,'+(-(i+1)*GAP)+'px) rotateY('+(-side*12)+'deg)'});
      xs.forEach(function(x,i){var a=(i*137.5)%360*Math.PI/180,r=(mob?.35:.42)*w+(i%5)*40;x.style.transform='translate3d('+(Math.cos(a)*r).toFixed(0)+'px,'+(Math.sin(a)*r*.6).toFixed(0)+'px,'+(-(i*GAP*N/xs.length)-200).toFixed(0)+'px)'});
      last=-1;
    };
    layout();W.addEventListener('resize',function(){layout();kick()});
    mover(fly,function(){
      var r=fly.getBoundingClientRect(),span=r.height-innerHeight,p=clamp(-r.top/span,0,1);
      if(Math.abs(p-last)<.0004)return;last=p;
      var cam=p*(N+.6)*GAP-GAP*.9;
      world.style.transform='translate3d(0,0,'+cam.toFixed(1)+'px)';
      var best=-1,bd=1e9,reveal=MOB?clamp((p-.07)/.06,0,1):1;
      for(var i=0;i<N;i++){
        var dz=-(i+1)*GAP+cam,o;
        if(dz>NEAR||dz<-FAR)o=0;
        else if(dz<-FAR+GAP)o=(dz+FAR)/GAP;
        else if(dz>NEAR-320)o=(NEAR-dz)/320;
        else o=1;
        o=Math.round(clamp(o,0,1)*reveal*50)/50;
        if(ops[i]!==o){ops[i]=o;cards[i].style.opacity=o;cards[i].style.visibility=o?'visible':'hidden'}
        var dist=Math.abs(dz+GAP*.9);if(dist<bd){bd=dist;best=i}
      }
      var ip=clamp(p/.09,0,1);stage.style.transform='translate3d(0,'+(DROP*ip).toFixed(1)+'px,0)';intro.style.opacity=(1-ip).toFixed(3);intro.style.transform='translate3d(0,'+(-ip*120).toFixed(1)+'px,0)';intro.style.visibility=ip>=1?'hidden':'visible';
      var op=clamp((p-.9)/.08,0,1);outro.style.opacity=op.toFixed(3);outro.style.visibility=op>0?'visible':'hidden';
      bar.style.transform='scaleX('+p.toFixed(4)+')';
      if(best!==lastNow&&p>.06&&p<.92){lastNow=best;var c=cards[best];now.textContent=(best+1)+' / '+N+' · '+c.getAttribute('data-name')}
      else if(p<=.06&&lastNow!==-2){lastNow=-2;now.textContent=T.flyStart}
    });
  }
}

/* ── Смещение блоков при прокрутке (параллакс) ── */
if(!reduce)$$('[data-shift]').forEach(function(el){
  var k=parseFloat(el.getAttribute('data-shift'))||.1,lastY=1e9;
  mover(el,function(){var r=el.getBoundingClientRect(),y=((r.top+r.height/2)-innerHeight/2)*-k;y=Math.round(y*2)/2;if(y!==lastY){lastY=y;el.style.setProperty('--py',y+'px')}});
});

/* ── Счётчики ── */
var fmt=function(n){return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ')};
$$('[data-count]').forEach(function(el){
  var to=+el.getAttribute('data-count'),suf=el.getAttribute('data-suf')||'',plain=el.hasAttribute('data-plain');
  var show=function(v){el.textContent=(plain?String(v):fmt(v))+suf};
  if(reduce||!('IntersectionObserver' in W)){show(to);return}
  show(plain?to:0);if(plain)return;
  var o=new IntersectionObserver(function(es){if(!es[0].isIntersecting)return;o.disconnect();var t0=performance.now();(function f(t){var k=clamp((t-t0)/1400,0,1),e=k===1?1:1-Math.pow(2,-10*k);show(Math.round(to*e));if(k<1)requestAnimationFrame(f)})(t0)});o.observe(el);
});

/* ── Кнопка записи под пальцем ── */
var dock=d.getElementById('dock'),after=d.querySelector('[data-dock-after]');
if(dock&&after&&'IntersectionObserver' in W)new IntersectionObserver(function(es){var e=es[0];dock.classList.toggle('on',!e.isIntersecting&&e.boundingClientRect.top<0)}).observe(after);
else if(dock)dock.classList.add('on');

/* ── Врачи: фильтр и поиск ── */
var dgrid=d.getElementById('docs-grid');
if(dgrid){
  var dq=d.getElementById('docs-q'),dcur='all',dempty=d.getElementById('docs-empty');
  var dfilter=function(){var q=(dq.value||'').trim().toLowerCase(),n=0;$$('.doc',dgrid).forEach(function(c){var ok=(dcur==='all'||c.getAttribute('data-dir')===dcur)&&(!q||c.getAttribute('data-q').indexOf(q)>=0);c.hidden=!ok;if(ok)n++});dempty.hidden=n>0};
  dq.addEventListener('input',dfilter);
  $$('#docs-chips .chip').forEach(function(b){b.addEventListener('click',function(){dcur=b.getAttribute('data-f');$$('#docs-chips .chip').forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});dfilter()})});
}

/* ── Скидка: 5 секунд (механика «Минуты на скидку» devuz.studio) ── */
var DKEY='shox_discount',dsc=d.getElementById('dsc'),dscTpl=dsc?dsc.outerHTML:'',dscTimer=0,dscRaf=0;
function discount(){var s=store(DKEY);return s&&s.code?s:null}
function showDiscount(){var s=discount();$$('.disc').forEach(function(el){el.classList.toggle('on',!!s);var c=$('[data-code]',el);if(c&&s)c.textContent=s.code})}
function startDiscount(){
  if(!dsc)return;var st=store(DKEY);if(st)return;
  var SEC=5,t0=0,n=$('.dsc-n',dsc),bar=$('.dsc-bar i',dsc),phase='run';
  var end=function(won){if(phase!=='run')return;phase=won?'won':'over';cancelAnimationFrame(dscRaf);
    if(won){var code='SHOX10-'+Math.random().toString(36).slice(2,6).toUpperCase();store(DKEY,{code:code,at:Date.now()});dsc.classList.add('won');n.textContent='10%';$('.dsc-t',dsc).innerHTML='<b>'+esc(T.dscWon)+'</b><small>'+esc(T.dscCode)+' '+code+'</small>';$('.dsc-go',dsc).textContent=T.dscBook;$('.dsc-go',dsc).setAttribute('href','#zapis');bar.style.transform='scaleX(1)';showDiscount();dscTimer=setTimeout(function(){dsc.classList.remove('on')},6000)}
    else{store(DKEY,{over:Date.now()});n.textContent='0';$('.dsc-t',dsc).innerHTML='<b>'+esc(T.dscOver)+'</b><small>'+esc(T.dscOverSub)+'</small>';$('.dsc-go',dsc).hidden=true;dscTimer=setTimeout(function(){dsc.classList.remove('on')},2600)}};
  var go=$('.dsc-go',dsc);
  go.addEventListener('click',function(e){if(phase==='run'){e.preventDefault();end(true)}else dsc.classList.remove('on')});
  $('.dsc-x',dsc).addEventListener('click',function(){if(phase==='run')end(false);clearTimeout(dscTimer);dsc.classList.remove('on')});
  var tick=function(t){if(!t0)t0=t;var left=Math.max(0,SEC-(t-t0)/1000);n.textContent=left.toFixed(1).replace('.',T.dec);bar.style.transform='scaleX('+(left/SEC).toFixed(4)+')';if(left<=0){end(false);return}dscRaf=requestAnimationFrame(tick)};
  var run=function(){dsc.classList.add('on');dscRaf=requestAnimationFrame(tick)};
  if(d.visibilityState==='visible')run();else d.addEventListener('visibilitychange',function v(){if(d.visibilityState==='visible'){d.removeEventListener('visibilitychange',v);run()}});
}
function afterSplash(){setTimeout(startDiscount,1200)}
showDiscount();

/* ── Запись в три шага ── */
var bk=d.getElementById('zapis');
var S={dir:'',doc:'',day:'',time:''};
function pane(n){$$('.pane',bk).forEach(function(p){p.classList.toggle('on',+p.getAttribute('data-p')===n)});$$('.steps li',bk).forEach(function(li,i){li.classList.toggle('on',i===n-1);li.classList.toggle('done',i<n-1)})}
function hashCode(s){var h=0;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return Math.abs(h)}
function renderDocs(){
  var box=$('#bk-docs',bk),list=DOCS.filter(function(x){return !S.dir||S.dir==='any'||x.dir===S.dir});
  box.innerHTML='<button type="button" class="mini" data-doc="any" aria-pressed="'+(S.doc==='any')+'"><span><b>'+esc(T.anyDoc)+'</b><span>'+esc(T.anyDocSub)+'</span></span></button>'+list.map(function(x){return '<button type="button" class="mini" data-doc="'+x.s+'" aria-pressed="'+(S.doc===x.s)+'"><img src="'+x.img+'" alt="" loading="lazy" width="48" height="60"><span><b>'+esc(x.n)+'</b><span>'+esc(x.sp)+'</span></span></button>'}).join('');
}
function renderSlots(){
  var box=$('#bk-slots',bk),out=[];
  for(var h=9;h<18;h++)for(var m=0;m<60;m+=30){var t=(h<10?'0':'')+h+':'+(m?'30':'00'),busy=hashCode(S.doc+S.day+t)%10<3;out.push('<button type="button" class="slot" data-t="'+t+'"'+(busy?' disabled':'')+' aria-pressed="'+(S.time===t)+'">'+t+'</button>')}
  box.innerHTML=out.join('');box.classList.remove('swap');void box.offsetWidth;box.classList.add('swap');
}
function summary(){
  var doc=S.doc&&S.doc!=='any'?DOC[S.doc]:null,dn=S.dir&&S.dir!=='any'?T.dirs[S.dir]:T.anyDir;
  return [T.sumDir+': '+dn,T.sumDoc+': '+(doc?doc.n+' ('+doc.sp+')':T.anyDoc),T.sumTime+': '+S.dayLabel+', '+S.time];
}
if(bk){
  var dayBox=$('#bk-days',bk),wd=T.wd,mo=T.mo,base=new Date();
  var days=[];for(var i=1;i<=7;i++){var x=new Date(base.getFullYear(),base.getMonth(),base.getDate()+i);days.push(x)}
  dayBox.innerHTML=days.map(function(x,i){var k=x.toISOString().slice(0,10);return '<button type="button" class="day" data-day="'+k+'" data-label="'+x.getDate()+' '+mo[x.getMonth()]+'" aria-pressed="false"><small>'+wd[x.getDay()]+'</small><b>'+x.getDate()+'</b><small>'+mo[x.getMonth()]+'</small></button>'}).join('');
  bk.addEventListener('click',function(e){
    var b=e.target.closest('button,a');if(!b||!bk.contains(b))return;
    if(b.hasAttribute('data-dir')&&b.closest('#bk-dirs')){S.dir=b.getAttribute('data-dir');S.doc='';$$('#bk-dirs .chip',bk).forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});renderDocs();pane(2)}
    else if(b.hasAttribute('data-doc')){S.doc=b.getAttribute('data-doc');renderDocs();if(!S.day){var f=$('.day',dayBox);S.day=f.getAttribute('data-day');S.dayLabel=f.getAttribute('data-label');f.setAttribute('aria-pressed','true')}renderSlots();pane(3)}
    else if(b.hasAttribute('data-day')){S.day=b.getAttribute('data-day');S.dayLabel=b.getAttribute('data-label');S.time='';$$('.day',dayBox).forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});renderSlots()}
    else if(b.hasAttribute('data-t')){S.time=b.getAttribute('data-t');$('#bk-sum',bk).innerHTML=summary().map(function(s,i){return i?esc(s):'<b>'+esc(s)+'</b>'}).join('<br>');pane(4)}
    else if(b.hasAttribute('data-back')){pane(+b.getAttribute('data-back'))}
  });
  var send=$('#bk-send',bk),err=$('#bk-err',bk);
  send.addEventListener('click',function(e){
    var name=$('#bk-name',bk).value.trim(),tel=$('#bk-tel',bk).value.replace(/\D/g,'');
    if(!name||tel.length<9){e.preventDefault();err.hidden=false;(name?$('#bk-tel',bk):$('#bk-name',bk)).focus();return}
    err.hidden=true;var s=discount();
    var text=[T.msgHead].concat(summary(),[T.sumName+': '+name,T.sumTel+': +'+(tel.length===9?'998'+tel:tel)],$('#bk-note',bk).value.trim()?[T.sumNote+': '+$('#bk-note',bk).value.trim()]:[],s?[T.msgDisc+' '+s.code]:[]).join('\n');
    copy(text).then(function(){},function(){});
    $('#bk-sent',bk).classList.add('on');
  });
}
/* «Записаться» у врача и «Узнать цену» в прейскуранте ведут в форму уже с выбором. */
d.addEventListener('click',function(e){
  var a=e.target.closest('[data-book-doc],[data-book-dir]');if(!a||!bk)return;
  var doc=a.getAttribute('data-book-doc'),dir=a.getAttribute('data-book-dir');
  if(doc&&DOC[doc]){S.dir=DOC[doc].dir;S.doc=doc}else{S.dir=dir||'any';S.doc=''}
  $$('#bk-dirs .chip',bk).forEach(function(x){x.setAttribute('aria-pressed',x.getAttribute('data-dir')===S.dir?'true':'false')});
  var ask=a.getAttribute('data-ask');if(ask)$('#bk-note',bk).value=ask;
  renderDocs();
  if(S.doc){var f=$('.day',bk);S.day=f.getAttribute('data-day');S.dayLabel=f.getAttribute('data-label');$$('.day',bk).forEach(function(x){x.setAttribute('aria-pressed',x===f?'true':'false')});renderSlots();pane(3)}else pane(2);
});

/* ── Прейскурант: поиск ── */
var pl=d.getElementById('plist');
if(pl){
  var pq=d.getElementById('pq'),pc=d.getElementById('pcount'),pcur='all',rows=$$('li',pl);
  rows.forEach(function(li){var b=$('b',li);b.setAttribute('data-raw',b.textContent)});
  var pall=false,pmore=d.getElementById('pmore');if(pmore)pmore.addEventListener('click',function(){pall=true;pf()});
  var pf=function(){var q=(pq.value||'').trim().toLowerCase(),n=0,cut=!pall&&!q&&pcur==='all';rows.forEach(function(li){var b=$('b',li),raw=b.getAttribute('data-raw'),ok=(pcur==='all'||li.getAttribute('data-c')===pcur)&&(!q||li.getAttribute('data-q').indexOf(q)>=0);if(ok)n++;li.hidden=!ok||(cut&&n>8);var at=q?raw.toLowerCase().indexOf(q):-1;b.innerHTML=at>=0?esc(raw.slice(0,at))+'<mark>'+esc(raw.slice(at,at+q.length))+'</mark>'+esc(raw.slice(at+q.length)):esc(raw)});pc.textContent=T.found.replace('{n}',n);if(pmore)pmore.hidden=!cut};
  pq.addEventListener('input',pf);
  $$('#pchips .chip').forEach(function(b){b.addEventListener('click',function(){pcur=b.getAttribute('data-f');$$('#pchips .chip').forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});pf()})});
  pf();
}

/* ── Конструктор: плашка и страница «Что дальше» ── */
var KKEY='shox_kit',kd=d.getElementById('kd'),pill=d.getElementById('kd-pill');
var inputs=$$('input[data-k]');
var def={};inputs.forEach(function(i){if(i.hasAttribute('data-def'))def[i.getAttribute('data-k')]=true});
var kit=store(KKEY)||def;
var BASE=+(d.body.getAttribute('data-base')||0);
function price(k){var i=$('input[data-k="'+k+'"]');return i?+i.getAttribute('data-p'):0}
function needs(k){var i=$('input[data-k="'+k+'"]');return i?(i.getAttribute('data-needs')||'').split(' ').filter(Boolean):[]}
function set(k,on){
  kit[k]=on;
  if(on)needs(k).forEach(function(n){if(!kit[n])set(n,true)});
  else inputs.forEach(function(i){var o=i.getAttribute('data-k');if(kit[o]&&needs(o).indexOf(k)>=0)set(o,false)});
}
function apply(){
  var keys={};inputs.forEach(function(i){keys[i.getAttribute('data-k')]=1});
  var sum=BASE,n=0;Object.keys(keys).forEach(function(k){if(kit[k]){sum+=price(k);n++}});
  inputs.forEach(function(i){i.checked=!!kit[i.getAttribute('data-k')]});
  $$('[data-addon]').forEach(function(el){var k=el.getAttribute('data-addon');if(k in keys)el.classList.toggle('addon-off',!kit[k])});
  $$('[data-pv]').forEach(function(el){el.hidden=!kit[el.getAttribute('data-pv')]});
  var empty=$('.kit-empty');if(empty)empty.hidden=$$('[data-pv]').some(function(el){return !el.hidden});
  var s='$'+fmt(sum);$$('[data-sum]').forEach(function(el){el.textContent=s});
  $$('[data-n]').forEach(function(el){el.textContent=T.blocks.replace('{n}',n)});
  var add=$('#kd-add');if(add)add.textContent='$'+fmt(sum-BASE);
  store(KKEY,kit);
}
inputs.forEach(function(i){i.addEventListener('change',function(){set(i.getAttribute('data-k'),i.checked);apply()})});
apply();
if(kd&&pill){
  var open=function(){kd.hidden=false;pill.setAttribute('aria-expanded','true');$('#kd-x').focus()};
  var close=function(){kd.hidden=true;pill.setAttribute('aria-expanded','false');pill.focus()};
  pill.addEventListener('click',function(){kd.hidden?open():close()});
  $('#kd-x').addEventListener('click',close);
  d.addEventListener('keydown',function(e){if(e.key==='Escape'&&!kd.hidden)close()});
  $$('[data-kit-open]').forEach(function(b){b.addEventListener('click',open)});
  $('#kd-reset').addEventListener('click',function(){kit=JSON.parse(JSON.stringify(def));apply()});
  $('#kd-copy').addEventListener('click',function(){
    var lines=[T.kitHead,T.kitBase+': $'+fmt(BASE)];var seen={};
    inputs.forEach(function(i){var k=i.getAttribute('data-k');if(kit[k]&&!seen[k]){seen[k]=1;lines.push('+ '+i.getAttribute('data-t')+': $'+fmt(price(k)))}});
    lines.push(T.kitTotal+': '+$('[data-sum]').textContent);
    var btn=this;copy(lines.join('\n')).then(function(){btn.textContent=T.copied},function(){btn.textContent=T.copyFail});
  });
  $('#kd-timer').addEventListener('click',function(){try{localStorage.removeItem(DKEY)}catch(e){}showDiscount();if(dsc){cancelAnimationFrame(dscRaf);clearTimeout(dscTimer);var box=d.createElement('div');box.innerHTML=dscTpl;var fresh=box.firstElementChild;dsc.parentNode.replaceChild(fresh,dsc);dsc=fresh}close();setTimeout(startDiscount,400)});
}
})();
