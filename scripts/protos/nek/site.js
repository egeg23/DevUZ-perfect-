/* Сайт Nek Dental Studio в макете. Запись ложится в браузер (общее
   состояние с панелью, localStorage nk-demo-1) и открывает их WhatsApp с
   готовым текстом. Ничего не уходит наружу, модель не вызывается. */
(function(){
'use strict';
var d=document,w=window,$=function(s,r){return(r||d).querySelector(s)},$$=function(s,r){return[].slice.call((r||d).querySelectorAll(s))};
var D=JSON.parse($('#nk-data').textContent),T=D.t;
var RM=w.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function get(k,def){try{var v=localStorage.getItem(k);return v?JSON.parse(v):def}catch(e){return def}}
function put(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var toastT=0;function toast(m){var t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('on')},2400)}
function wa(text){return'https://wa.me/'+D.wa+'?text='+encodeURIComponent(text)}
function open(u){var a=d.createElement('a');a.href=u;a.target='_blank';a.rel='noopener';d.body.appendChild(a);a.click();a.remove()}

/* Общее состояние с панелью. */
var KEY='nk-demo-1';
function load(){var s=get(KEY,null);return s&&s.v===1?s:{v:1,leads:[],log:[]}}
function save(s){put(KEY,s)}
function addLead(l){var s=load();l.id='z'+Date.now().toString(36).slice(-6);l.at=Date.now();l.status='new';l.log=[{at:l.at,who:'site'}];s.leads.unshift(l);save(s);put('nk-mine-1',l.id);return l.id}

/* Шапка: прячется при любой прокрутке, возвращается через 3 с после последнего события. */
var top=$('.top'),IDLE=3000,idleT=0;
function headIdle(){if(!top)return;clearTimeout(idleT);
  if(!top.contains(d.activeElement))top.classList.add('hide');
  idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}
addEventListener('scroll',headIdle,{passive:true});

/* Появление и параллакс: только transform и opacity. */
var io='IntersectionObserver'in w?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'}):null;
$$('.rise,.tilt,.pop,.slide').forEach(function(e){if(io&&!RM)io.observe(e);else e.classList.add('on')});
var par=$$('[data-par]'),pq=0;
function parallax(){pq=0;var h=innerHeight;par.forEach(function(e){var r=e.getBoundingClientRect(),k=+e.getAttribute('data-par');if(r.bottom<0||r.top>h)return;e.style.transform='translate3d(0,'+((r.top+r.height/2-h/2)*-k).toFixed(1)+'px,0)'})}
if(!RM&&par.length){addEventListener('scroll',function(){if(!pq)pq=requestAnimationFrame(parallax)},{passive:true});parallax()}

/* Допы: что выключено в конструкторе, того блока на сайте нет. */
var cfg=get('nk-cfg-1',{});
$$('[data-addon]').forEach(function(b){var id=b.getAttribute('data-addon');if(cfg[id]===false)b.classList.add('off')});

/* Вопросы. */
$$('.qa button').forEach(function(b){b.addEventListener('click',function(){var q=b.parentNode,on=!q.classList.contains('open');q.classList.toggle('open',on);b.setAttribute('aria-expanded',on)})});

/* Слои реставрации ползунком и нажатием. */
var lyr=$('#lyr'),ts=$('.tooth');
function layer(n){ts.setAttribute('data-ly',n);$$('#layers li').forEach(function(li,i){li.classList.toggle('on',i<=n)});lyr.value=n}
if(lyr){lyr.addEventListener('input',function(){layer(+lyr.value)});$$('#layers li').forEach(function(li,i){li.addEventListener('click',function(){layer(i)})});layer(0)}

/* ── Шторка ───────────────────────────────────────────────────────── */
var sh=$('#sheet'),lastF=null;
function sheet(title,html){lastF=d.activeElement;$('#shh').textContent=title;$('#shb').innerHTML=html;sh.classList.add('on');setTimeout(function(){var f=$('#shb button,#shb input');if(f)f.focus()},60)}
function shut(){sh.classList.remove('on');if(lastF&&lastF.focus)lastF.focus()}
$$('[data-close]',sh).forEach(function(b){b.addEventListener('click',shut)});
d.addEventListener('keydown',function(e){if(e.key==='Escape'&&sh.classList.contains('on'))shut()});

/* Запись: услуга, день (пн-сб), время в их часы 11:00-19:00, имя, телефон. */
function daysAhead(){var out=[],t=new Date();for(var i=1;out.length<6&&i<12;i++){var x=new Date(t.getTime()+i*864e5);if(x.getDay()===0)continue;out.push(x)}return out}
var SLOTS=['11:00','12:30','14:00','15:30','17:00','18:00'];
function dd(x){return D.wd[x.getDay()]+' '+x.getDate()+'.'+String(x.getMonth()+1).replace(/^(\d)$/,'0$1')}
function book(pre,note){
  var ds=daysAhead(),st={svc:pre||D.svc[0].id,day:null,time:null};
  var chip=function(k,v,lab,sub){return'<button type="button" data-k="'+k+'" data-v="'+esc(v)+'" aria-pressed="false">'+esc(lab)+(sub?'<small>'+esc(sub)+'</small>':'')+'</button>'};
  sheet(T.book,'<div><p class="small mu" style="margin:0 0 8px">'+T.svc+'</p><div class="chips">'+D.svc.map(function(s){return chip('svc',s.id,s.n)}).join('')+'</div></div>'+
    '<div><p class="small mu" style="margin:0 0 8px">'+T.day+'</p><div class="chips">'+ds.map(function(x,i){return chip('day',i,dd(x))}).join('')+'</div></div>'+
    '<div><p class="small mu" style="margin:0 0 8px">'+T.time+'</p><div class="chips">'+SLOTS.map(function(s){return chip('time',s,s)}).join('')+'</div></div>'+
    '<label class="fld"><span>'+T.name+'</span><input id="bk-n" autocomplete="name"></label><label class="fld"><span>'+T.phone+'</span><input id="bk-p" type="tel" inputmode="tel" autocomplete="tel" placeholder="+995"></label>'+
    '<p class="err" id="bk-e" role="alert"></p><button type="button" class="btn btn-a" id="bk-go">'+T.send+'</button>');
  function mark(){$$('#shb [data-k]').forEach(function(b){var k=b.getAttribute('data-k');b.setAttribute('aria-pressed',String(st[k])===b.getAttribute('data-v'))})}
  $$('#shb [data-k]').forEach(function(b){b.addEventListener('click',function(){st[b.getAttribute('data-k')]=b.getAttribute('data-v');mark()})});mark();
  $('#bk-go').addEventListener('click',function(){var n=$('#bk-n').value.trim(),p=$('#bk-p').value.trim();
    if(st.day==null||!st.time||!n||p.replace(/\D/g,'').length<6){$('#bk-e').textContent=T.need;return}
    var s=D.svc.filter(function(x){return x.id===st.svc})[0],when=dd(ds[+st.day])+' '+st.time;
    addLead({name:n,phone:p,svc:st.svc,when:when,src:note&&note.src||'site',note:note&&note.text||''});
    shut();toast(T.sent);
    open(wa(T.hello+': '+s.n+(T.at?', '+T.at:',')+' '+when+'. '+n+', '+p+(note&&note.text?'. '+note.text:'')))});
}
$$('[data-book]').forEach(function(b){b.addEventListener('click',function(){book(b.getAttribute('data-book')||'')})});

/* Моя запись: статус меняет панель, сайт видит его сразу. */
function mine(){var id=get('nk-mine-1',''),l=load().leads.filter(function(x){return x.id===id})[0];
  if(!l){sheet(T.mine,'<p>'+T.none+'</p><p class="small mu">'+T.hint+'</p><a class="btn btn-l" href="'+D.panel+'">'+T.openPanel+'</a>');return}
  var s=D.svc.filter(function(x){return x.id===l.svc})[0],cls=l.status==='new'?'':l.status==='no'?' no':' ok';
  sheet(T.mine,'<div class="mst"><span class="pill'+cls+'">'+esc(T.st[l.status])+'</span><b>'+esc(s?s.n:'')+'</b><span>'+esc(l.when)+'</span><span class="small mu">'+esc(l.name)+' · '+esc(l.phone)+'</span></div><p class="small mu">'+T.hint+'</p><a class="btn btn-l" href="'+D.panel+'">'+T.openPanel+'</a>')}
var mb=$('#mine');if(mb)mb.addEventListener('click',mine);
addEventListener('storage',function(e){if(e.key===KEY&&sh.classList.contains('on')&&$('#shh').textContent===T.mine)mine()});

/* ── Квиз ─────────────────────────────────────────────────────────── */
var qz=$('#qz'),Q=T.quiz;
function quiz(){var ans=[],i=0;
  function render(){if(i<Q.q.length){qz.innerHTML='<div class="qz-step"><span class="qz-n">'+(i+1)+' '+Q.of+' '+Q.q.length+'</span><div class="qz-bar"><i style="transform:scaleX('+(i/Q.q.length)+')"></i></div><p class="qz-q">'+esc(Q.q[i])+'</p><div class="qz-o">'+Q.a[i].map(function(a,k){return'<button type="button" data-k="'+k+'">'+esc(a[0])+'</button>'}).join('')+'</div></div>';
      $$('button',qz).forEach(function(b){b.addEventListener('click',function(){ans.push(+b.getAttribute('data-k'));i++;render()})});return}
    var sv=Q.a[0][ans[0]][1],s=D.svc.filter(function(x){return x.id===sv})[0],txt=Q.a.map(function(a,k){return a[ans[k]][0]}).join(', ');
    qz.innerHTML='<div class="qz-step qz-r"><span class="qz-n">'+Q.res+'</span><b>'+esc(s.n)+'</b>'+(ans[2]===0?'<p>'+Q.pain+'</p>':'')+'<p class="small mu">'+esc(txt)+'</p><div class="hero-act"><button type="button" class="btn btn-a" id="qz-go">'+Q.go+'</button><button type="button" class="btn btn-l" id="qz-re">'+Q.again+'</button></div></div>';
    $('#qz-go').addEventListener('click',function(){book(sv,{src:'quiz',text:txt})});$('#qz-re').addEventListener('click',quiz)}
  render()}
if(qz)quiz();

/* ── Приезжие: даты поездки и услуга ───────────────────────────────── */
var tr=$('#trip');
if(tr){var ta=$('#tr-a'),tb=$('#tr-b'),tn=$('#tr-n'),today=new Date().toISOString().slice(0,10);ta.min=tb.min=today;
  function nights(){var a=Date.parse(ta.value),b=Date.parse(tb.value);if(!a||!b||b<=a){tn.textContent='';return 0}var n=Math.round((b-a)/864e5);tn.textContent=n+' '+T.tripDays;return n}
  ta.addEventListener('change',function(){if(tb.value<ta.value)tb.value='';tb.min=ta.value;nights()});tb.addEventListener('change',nights);
  tr.addEventListener('submit',function(e){e.preventDefault();if(!nights()){tn.textContent=T.tripNeed;return}
    var s=D.svc.filter(function(x){return x.id===$('#tr-s').value})[0],c=$('#tr-c').value.trim(),txt=ta.value+' / '+tb.value+(c?', '+c:'');
    book(s.id,{src:'trip',text:T.trip+': '+txt})})}

/* ── Чат: ответы из вопросов клиники, без модели ───────────────────── */
var cb=$('#chatb'),cw=$('#chat'),cbody=$('#chb'),C=T.chat;
function say(t,u){var p=d.createElement('p');if(u)p.className='u';p.textContent=t;cbody.appendChild(p);cbody.scrollTop=cbody.scrollHeight}
function words(s){return s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,' ').split(/\s+/).filter(function(x){return x.length>3})}
function answer(q){var qw=words(q),best=null,score=0;D.faq.forEach(function(f){var fw=words(f[0]+' '+f[1]),s=0;qw.forEach(function(x){fw.forEach(function(y){if(y.indexOf(x.slice(0,5))===0)s++})});if(s>score){score=s;best=f}});return score?best[1]:C.miss}
if(cb&&cw){$('#ch-sub').textContent=C.sub;
  cb.addEventListener('click',function(){var on=cw.hidden;cw.hidden=!on;cb.setAttribute('aria-expanded',on);if(on&&!cbody.children.length)say(C.hi);if(on)$('#chi').focus()});
  $('#chx').addEventListener('click',function(){cw.hidden=true;cb.setAttribute('aria-expanded','false');cb.focus()});
  $('#chf').addEventListener('submit',function(e){e.preventDefault();var i=$('#chi'),q=i.value.trim();if(!q)return;i.value='';say(q,true);setTimeout(function(){say(answer(q))},/*~*/420)})}
})();
