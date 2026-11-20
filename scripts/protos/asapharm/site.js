(function(){'use strict';
/* main: ASAPHARM Academy, лендинг. Анимации — transform и opacity,
   прокрутку не перехватываем, при reduced motion всё стоит готовым. */
var d=document,w=window,$=function(s,r){return(r||d).querySelector(s)},$$=function(s,r){return[].slice.call((r||d).querySelectorAll(s))};
var L=JSON.parse($('#i18n').textContent);
var RM=w.matchMedia&&w.matchMedia('(prefers-reduced-motion: reduce)').matches;
function copy(t){try{var p=navigator.clipboard&&navigator.clipboard.writeText(t);if(p&&p.catch)p.catch(function(){})}catch(x){}}
var LS={get:function(k,f){try{var v=localStorage.getItem(k);return v?JSON.parse(v):f}catch(e){return f}},set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};

/* Шапка: прячется при любой прокрутке, возвращается через 3 с тишины. */
var top=$('#top'),IDLE=3000,idleT=0,dock=$('#dock');
function headIdle(){if(!top)return;clearTimeout(idleT);
  if(!top.contains(d.activeElement))top.classList.add('hide');
  if(dock)dock.classList.add('away');
  idleT=setTimeout(function(){top.classList.remove('hide');if(dock)dock.classList.remove('away')},IDLE)}
function solid(){top.classList.toggle('solid',scrollY>80)}
addEventListener('scroll',function(){headIdle();solid()},{passive:true});solid();

/* Появление блоков. */
var io='IntersectionObserver'in w&&!RM?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'}):null;
$$('.rv').forEach(function(e){if(io)io.observe(e);else e.classList.add('on')});
requestAnimationFrame(function(){var h=$('.hero');if(h)h.classList.add('on')});
/* Нижняя кнопка не закрывает первый экран: у него своя запись. */
(function(){var h=$('.hero');if(!h||!dock||!('IntersectionObserver'in w))return;new IntersectionObserver(function(es){dock.classList.toggle('in-hero',es[0].isIntersecting)},{threshold:.35}).observe(h)})();

/* Молекулы на первом экране: точки и связи, медленный дрейф. */
(function(){var c=$('#mol');if(!c||RM)return;var x=c.getContext('2d'),P=[],W=0,H=0,dpr=Math.min(2,w.devicePixelRatio||1),run=true;
  var DRIFT=/*~*/0.18,LINK=/*~*/120;
  function size(){W=c.clientWidth;H=c.clientHeight;c.width=W*dpr;c.height=H*dpr;x.setTransform(dpr,0,0,dpr,0,0);var n=W<768?22:44;P=[];for(var i=0;i<n;i++)P.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*DRIFT,vy:(Math.random()-.5)*DRIFT,r:1.5+Math.random()*2.5})}
  function frame(){if(!run)return;x.clearRect(0,0,W,H);for(var i=0;i<P.length;i++){var p=P[i];p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;for(var j=i+1;j<P.length;j++){var q=P[j],dx=p.x-q.x,dy=p.y-q.y,dd=Math.sqrt(dx*dx+dy*dy);if(dd<LINK){x.strokeStyle='rgba(201,213,255,'+(1-dd/LINK)*.35+')';x.lineWidth=1;x.beginPath();x.moveTo(p.x,p.y);x.lineTo(q.x,q.y);x.stroke()}}x.fillStyle=i%5?'rgba(201,213,255,.8)':'rgba(255,133,98,.9)';x.beginPath();x.arc(p.x,p.y,p.r,0,7);x.fill()}requestAnimationFrame(frame)}
  size();frame();var lw=innerWidth;addEventListener('resize',function(){if(innerWidth!==lw){lw=innerWidth;size()}});
  if(io)new IntersectionObserver(function(es){var v=es[0].isIntersecting;if(v&&!run){run=true;frame()}run=v}).observe(c)})();

/* Отсчёт до старта ближайшего потока (24.11.2026 по Ташкенту). */
(function(){var n=$('.next');if(!n)return;var at=Date.parse(n.dataset.start+'T09:00:00+05:00');
  function tick(){var s=Math.max(0,at-Date.now());if(!s){$('.cd',n).hidden=true;$('.cd-past',n).hidden=false;return}
    $('[data-cd=d]',n).textContent=Math.floor(s/864e5);$('[data-cd=h]',n).textContent=Math.floor(s%864e5/36e5);$('[data-cd=m]',n).textContent=Math.floor(s%36e5/6e4);setTimeout(tick,3e4)}tick()})();

/* Путь досье: шаг по доле прокрутки секции, полоса хода. */
(function(){var s=$('.dos');if(!s)return;var bar=$('.dos-bar',s);
  function upd(){var r=s.getBoundingClientRect(),h=s.offsetHeight-innerHeight;if(h<=0)return;var p=Math.min(1,Math.max(0,-r.top/h));s.style.setProperty('--p',p.toFixed(3));s.dataset.s=p<.18?0:p<.45?1:p<.75?2:3}
  if(RM){s.dataset.s=3;return}upd();addEventListener('scroll',upd,{passive:true})})();

/* Онлайн или офлайн в карточке онлайн-формата. */
$$('.fmt-sw').forEach(function(g){$$('button',g).forEach(function(b){b.addEventListener('click',function(){$$('button',g).forEach(function(x){x.setAttribute('aria-pressed',x===b)});var r=d.querySelector('.frm input[name=fmt][value='+b.dataset.fmt+']');if(r)r.checked=true})})});

/* Команда: справка по нажатию. */
$$('.tm-b').forEach(function(b){b.addEventListener('click',function(){var o=b.getAttribute('aria-expanded')!=='true';b.setAttribute('aria-expanded',o);$('#'+b.getAttribute('aria-controls')).hidden=!o})});

/* Курс в форму: любая кнопка с data-course. */
var frm=$('#frm');
function pick(c){if(!frm||!c)return;var sel=frm.course;if(c==='online'){sel.value='base';var r=frm.querySelector('input[name=fmt][value=online]');if(r)r.checked=true}else if([].some.call(sel.options,function(o){return o.value===c}))sel.value=c}
d.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('[data-course]');if(a)pick(a.dataset.course)});

/* Подбор курса: три вопроса, совет, ответы — в заявку. */
(function(){var q=$('#quiz');if(!q)return;var A=[],qs=$$('.q',q),res=$('.q-res',q),bar=$('.q-bar',q);
  function show(i){qs.forEach(function(f,k){f.hidden=k!==i});bar.style.setProperty('--q',i/3)}
  function done(){var who=A[0],exp=A[1],k=who==='corp'?'corp':(exp==='2'||(who==='staff'&&exp!=='0'))?'pro':'base';var r=L.res[k];
    qs.forEach(function(f){f.hidden=true});res.hidden=false;bar.style.setProperty('--q',1);$('.q-t',q).textContent=r[0];$('.q-d',q).textContent=r[1]+(A[2]==='online'?L.online:'');
    var txt=$$('.q',q).map(function(f,i){return $('legend',f).textContent.replace(/^\d\/3 · /,'')+' '+($('[data-v="'+A[i]+'"]',f)||{}).textContent}).join('; ');
    $('#q-go').onclick=function(){pick(k);if(A[2]==='online'&&frm){var r=frm.querySelector('input[name=fmt][value=online]');if(r)r.checked=true}if(frm)frm.quiz.value=txt}}
  qs.forEach(function(f,i){$$('.q-o',f).forEach(function(b){b.addEventListener('click',function(){A[i]=b.dataset.v;if(i<2)show(i+1);else done()})})});
  $('#q-re').addEventListener('click',function(){A=[];res.hidden=true;show(0)})})();

/* Вебинары: прошедшие гаснут, у будущих — сколько осталось. */
$$('.web').forEach(function(li){var at=Date.parse(li.dataset.at),now=Date.now(),s=$('[data-left]',li),dd=Math.ceil((at-now)/864e5);
  if(at+72e5<now){li.classList.add('past');s.textContent=L.past}else s.textContent=dd<=0?L.today:L.left.replace('{d}',dd)});

/* Проверка сертификата: в макете знаем только номер образца. */
(function(){var f=$('#chk');if(!f)return;var r=$('.chk-r',f);f.addEventListener('submit',function(e){e.preventDefault();var v=f.n.value.trim().toUpperCase().replace(/\s/g,'');if(!v)return;var ok=v==='ASA-2026-0417';r.className='chk-r '+(ok?'ok':'no');r.textContent=ok?L.certOk.replace('{n}',L.certName).replace('{c}',L.certCourse):L.certNo})})();

/* Заявка: ложится в браузер (её видит панель), текст — в Telegram академии. */
var KEY='asa-leads-1';
function myLead(){var m=$('#my');if(!m)return;var all=LS.get(KEY,[]),mine=LS.get('asa-my',null),x=all.filter(function(a){return a.id===mine})[0];if(!x){m.hidden=true;return}m.hidden=false;$('.my-t',m).textContent=L.myN.replace('{n}',x.id).replace('{s}',L.st[x.st]||x.st)}
myLead();addEventListener('storage',myLead);addEventListener('focus',myLead);
if(frm)frm.addEventListener('submit',function(e){e.preventDefault();var err=$('.frm-err',frm),name=frm.name.value.trim(),ph=frm.phone.value.replace(/[^\d+]/g,'');
  if(name.length<2||ph.replace(/\D/g,'').length<9){err.textContent=L.need;return}err.textContent='';
  var fmt=(frm.querySelector('input[name=fmt]:checked')||{}).value||'offline',all=LS.get(KEY,[]),id=String(1000+all.length+1);
  var lead={id:id,at:Date.now(),name:name,phone:ph,course:frm.course.value,fmt:fmt,note:frm.note.value.trim(),quiz:frm.quiz.value,st:'new',lang:L.l};all.unshift(lead);LS.set(KEY,all);LS.set('asa-my',id);
  var txt=[L.head,L.fName+': '+name,L.fPhone+': '+ph,L.fCourse+': '+L.names[lead.course],L.fFmt+': '+L.fmt[fmt]].concat(lead.note?[L.fNote+': '+lead.note]:[]).concat(lead.quiz?[L.fQuiz+': '+lead.quiz]:[]).join('\n');
  copy(txt);err.textContent=L.sent;myLead();
  setTimeout(function(){w.open('https://t.me/'+L.tg+'?text='+encodeURIComponent(txt),'_blank','noopener')},600)});

/* Конструктор: тумблер прячет блок доп-а, итог сразу; акция 48 часов. */
(function(){var pill=$('#kd-pill'),kd=$('#kd');if(!kd)return;var K='asa-kit-v1',st=LS.get(K,{});
  function apply(){var sum=L.base,n=0;$$('input[data-k]',kd).forEach(function(i){var on=st[i.dataset.k]!==false;i.checked=on;if(on){sum+=+i.dataset.p;n++}$$('[data-addon="'+i.dataset.k+'"]').forEach(function(b){b.hidden=!on})});
    var fmt=function(v){return String(v).replace(/\B(?=(\d{3})+(?!\d))/g,' ')+' $'};$('#kd-sum').textContent=fmt(sum);$('#kd-pill-sum').textContent=fmt(sum);$('#kd-add').textContent='+'+fmt(sum-L.base);$('#kd-n').textContent=L.n.replace('{n}',n)}
  $$('input[data-k]',kd).forEach(function(i){i.addEventListener('change',function(){st[i.dataset.k]=i.checked;LS.set(K,st);apply()})});apply();
  function open(o){kd.hidden=!o;pill.setAttribute('aria-expanded',o);if(o)$('.kd-x',kd).focus()}
  pill.addEventListener('click',function(){open(kd.hidden)});$('#kd-x').addEventListener('click',function(){open(false);pill.focus()});
  d.addEventListener('keydown',function(e){if(e.key==='Escape'&&!kd.hidden){open(false);pill.focus()}});
  $('#kd-copy').addEventListener('click',function(){var lines=[L.kitHead,'• '+L.kitBase+': '+L.base+' $'];$$('input[data-k]:checked',kd).forEach(function(i){lines.push('• '+$('b',i.closest('.kd-row')).firstChild.textContent+': +'+i.dataset.p+' $')});lines.push(L.kitTot+': '+$('#kd-sum').textContent);copy(lines.join('\n'));this.lastChild.textContent=L.copied});
  var t0=LS.get('asa-offer',0);if(!t0){t0=Date.now();LS.set('asa-offer',t0)}var tm=$('#kd-tm'),end=t0+L.hours*36e5;
  function left(){var s=end-Date.now();if(s<=0){tm.textContent=L.offerEnd;$('#kd-offer').classList.add('gone');return}tm.textContent=L.offerLeft.replace('{h}',Math.floor(s/36e5)).replace('{m}',Math.floor(s%36e5/6e4));setTimeout(left,3e4)}left()})();
})();
