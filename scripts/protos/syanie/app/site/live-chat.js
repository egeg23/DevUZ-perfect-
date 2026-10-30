(function(){
'use strict';
/* Чат на рабочем сайте клиники. Сообщение посетителя уходит на сервер
   клиники (/api/chat): в админке оно в «Сообщениях» рядом с Instagram,
   WhatsApp и Telegram, привязанным сотрудникам приходит в Telegram. Ответ
   администратора из админки или из Telegram появляется здесь: чат
   спрашивает сервер раз в 4 секунды, пока открыт, и раз в 30, пока закрыт.
   Модели нет: отвечают люди. Вид — chat.css макета. */
var d=document,root=d.documentElement;
function $(s,c){return(c||d).querySelector(s)}
function el(tag,cls,txt){var e=d.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}
function ic(k){return'<svg class="ic" aria-hidden="true"><use href="#i-'+k+'"/></svg>'}
function lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function pad(n){return(n<10?'0':'')+n}
function hm(t){var x=new Date(t);return pad(x.getHours())+':'+pad(x.getMinutes())}
var K={};try{K=JSON.parse($('#sy-site').textContent).chat||{}}catch(e){}
var CALM=root.classList.contains('calm');
var TEL='tel:'+(K.phone||'').replace(/[^\d+]/g,'');
var MARK='<svg class="cx-mk" viewBox="0 0 40 40" aria-hidden="true"><path d="M13.6 9.5c-3.4 0-5.3 2.7-5.3 6.5 0 4.6 2.1 6.8 3 10.9.8 3.8 1.5 6.6 3.4 6.6 2.2 0 2-6.6 5.4-6.6s3.2 6.6 5.4 6.6c1.9 0 2.6-2.8 3.4-6.6.9-4.1 3-6.3 3-10.9 0-3.8-1.9-6.5-5.3-6.5-2.7 0-3.9 1.5-6.5 1.5s-3.8-1.5-6.5-1.5z" fill="currentColor"/></svg>';

/* Часы клиники по Томску (UTC+7). */
function isOpen(){var n=new Date(),h=(n.getUTCHours()+7)%24+n.getUTCMinutes()/60;return h>=(K.open||9)&&h<(K.close||21)}

/* Ключ посетителя: случайный, живёт в его браузере. */
var SID=lsGet('sy-chat-sid');
if(!SID||!/^[\w-]{16,64}$/.test(SID)){var a=new Uint8Array(18);(window.crypto||{}).getRandomValues?crypto.getRandomValues(a):a.forEach(function(_,i){a[i]=Math.random()*256|0});
  SID=Array.prototype.map.call(a,function(b){return('0'+b.toString(16)).slice(-2)}).join('');lsSet('sy-chat-sid',SID)}
var started=lsGet('sy-chat-on')==='1',msgs=[],last=0,pend=[];

/* ── Разметка ──────────────────────────────────────────────────────── */
var fab=el('button','cx-fab');fab.type='button';fab.id='cx-fab';fab.setAttribute('aria-label','Открыть чат с клиникой');fab.setAttribute('aria-expanded','false');fab.setAttribute('aria-controls','cx');
fab.innerHTML='<span class="cx-fi">'+ic('msg')+'</span><span class="cx-fx">'+ic('x')+'</span><i class="cx-dot" hidden></i>';
var box=el('div','cx');box.id='cx';box.setAttribute('role','dialog');box.setAttribute('aria-labelledby','cx-h');box.setAttribute('data-mode','tg');box.hidden=true;
box.innerHTML='<div class="cx-win">'+
  '<div class="cx-hd"><span class="cx-av">'+MARK+'</span><div class="cx-ht"><b id="cx-h">Сияние Севера</b><small id="cx-st"></small></div><button type="button" class="cx-x" aria-label="Закрыть чат">'+ic('x')+'</button></div>'+
  '<div class="cx-log" id="cx-log" role="log" aria-live="polite" aria-relevant="additions" tabindex="0" aria-label="Переписка"></div>'+
  '<div class="cx-chips" id="cx-chips"></div>'+
  '<form class="cx-f" id="cx-f" autocomplete="on"><label class="cx-sr" for="cx-in">Сообщение</label><input id="cx-in" name="msg" type="text" enterkeyhint="send" maxlength="1000" placeholder="Напишите сообщение"><button type="submit" class="cx-go" aria-label="Отправить">'+ic('arrow')+'</button></form>'+
  '<p class="cx-foot" id="cx-foot">Отвечает администратор клиники. Срочно: <a href="'+TEL+'">'+(K.phone||'позвоните')+'</a></p>'+
'</div>';
d.body.appendChild(fab);d.body.appendChild(box);
var log=$('#cx-log'),chips=$('#cx-chips'),form=$('#cx-f'),inp=$('#cx-in'),stEl=$('#cx-st'),dot=$('.cx-dot',fab);

var dock=$('#dock'),stage=$('#stage');
function fabVis(){var away=(dock&&dock.classList.contains('away'))||(stage&&stage.classList.contains('playing'));fab.classList.toggle('away',!!away&&box.hidden)}
if(window.MutationObserver){var mo=new MutationObserver(fabVis);if(dock)mo.observe(dock,{attributes:true,attributeFilter:['class']});if(stage)mo.observe(stage,{attributes:true,attributeFilter:['class']})}
fabVis();

/* ── Переписка ─────────────────────────────────────────────────────── */
function intro(){var c=el('div','cx-m cx-ai cx-intro'),p=el('p');
  p.textContent=isOpen()?'Здравствуйте! Напишите вопрос, администратор клиники ответит здесь же. Обычно за несколько минут, с 9:00 до 21:00.':'Здравствуйте! Сейчас клиника закрыта, ответим утром с 9:00. Сообщение примем сейчас, ответ придёт сюда же.';
  c.appendChild(el('span','cx-who','Клиника'));c.appendChild(p);return c}
function bubble(m){var me=m.dir==='in',b=el('div','cx-m cx-'+(me?'user':'manager'));
  b.appendChild(el('span','cx-who',(me?'Вы':'Администратор')+' · '+hm(m.at)));b.appendChild(el('p','',m.text));
  if(m.wait)b.appendChild(el('span','cx-tick',m.fail?'не ушло, нажмите, чтобы отправить снова':'отправляем…'));
  if(m.fail){b.classList.add('cx-fail');b.onclick=function(){pend=pend.filter(function(x){return x!==m});draw();send(m.text)}}
  return b}
function draw(){log.innerHTML='';log.appendChild(intro());msgs.concat(pend).forEach(function(m){log.appendChild(bubble(m))});log.scrollTop=log.scrollHeight}
function status(){var on=isOpen();stEl.textContent=on?'На связи, отвечаем с 9:00 до 21:00':'Клиника закрыта, ответим утром';box.classList.toggle('cx-night',!on)}
function setChips(list){chips.innerHTML='';(list||[]).forEach(function(t){var b;if(t==='Позвонить'){b=el('a','cx-chip');b.href=TEL;b.innerHTML=ic('phone')+'<span>Позвонить</span>'}else{b=el('button','cx-chip',t);b.type='button';b.onclick=function(){send(t)}}chips.appendChild(b)})}

function send(text){text=String(text||'').trim();if(!text)return;inp.value='';setChips([]);
  var m={dir:'in',text:text,at:Date.now(),wait:true};pend.push(m);draw();
  fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sid:SID,text:text})})
    .then(function(r){if(!r.ok)throw 0;pend=pend.filter(function(x){return x!==m});started=true;lsSet('sy-chat-on','1');return pull()})
    .catch(function(){m.fail=true;draw()})}
form.addEventListener('submit',function(e){e.preventDefault();send(inp.value)});

/* Новые сообщения с сервера: только то, что после последнего. */
var busy=false;
function pull(){if(busy||!started)return Promise.resolve();busy=true;
  return fetch('/api/chat?sid='+encodeURIComponent(SID)+'&after='+last,{cache:'no-store'}).then(function(r){return r.ok?r.json():{msgs:[]}}).then(function(j){busy=false;
    var got=(j.msgs||[]).filter(function(m){return m.id>last});if(!got.length)return;
    got.forEach(function(m){last=Math.max(last,m.id);msgs.push(m)});
    var reply=got.some(function(m){return m.dir==='out'});
    draw();if(box.hidden&&reply)dot.hidden=false}).catch(function(){busy=false})}
var tm=0;function loop(){clearTimeout(tm);tm=setTimeout(function(){if(!d.hidden)pull();loop()},box.hidden?30000:4000)}
d.addEventListener('visibilitychange',function(){if(!d.hidden)pull()});

/* ── Открыть и закрыть ────────────────────────────────────────────── */
var back=null,mqP=matchMedia('(max-width:1023px)');
function fit(){if(box.hidden||!mqP.matches||!window.visualViewport){box.style.removeProperty('--cx-vh');box.style.removeProperty('--cx-top');return}
  var v=visualViewport;box.classList.toggle('kb',v.height<innerHeight*.78);box.style.setProperty('--cx-vh',Math.round(v.height)+'px');box.style.setProperty('--cx-top',Math.round(v.offsetTop)+'px');log.scrollTop=log.scrollHeight}
if(window.visualViewport){visualViewport.addEventListener('resize',fit);visualViewport.addEventListener('scroll',fit)}
function open(){if(!box.hidden)return;back=d.activeElement;box.hidden=false;status();draw();
  if(!msgs.length&&!pend.length)setChips(['Сколько стоит?','Хочу записаться','Есть вопрос','Позвонить']);
  box.setAttribute('aria-modal',String(mqP.matches));root.classList.toggle('cx-lock',mqP.matches);fit();
  fab.setAttribute('aria-expanded','true');root.classList.add('cx-open');fab.setAttribute('aria-label','Закрыть чат');fab.classList.add('on');dot.hidden=true;pull();loop();
  requestAnimationFrame(function(){box.classList.add('on');if(!mqP.matches||!('ontouchstart' in window))inp.focus({preventScroll:true});else $('.cx-x',box).focus({preventScroll:true})})}
function close(){if(box.hidden)return;box.classList.remove('on');root.classList.remove('cx-lock');fab.setAttribute('aria-expanded','false');root.classList.remove('cx-open');fab.setAttribute('aria-label','Открыть чат с клиникой');fab.classList.remove('on');inp.blur();
  setTimeout(function(){box.hidden=true;fabVis();loop()},CALM?0:260);try{(back&&back.focus?back:fab).focus({preventScroll:true})}catch(e){}}
fab.onclick=function(){box.hidden?open():close()};
$('.cx-x',box).onclick=close;
box.addEventListener('keydown',function(e){if(e.key==='Escape'){e.stopPropagation();close();return}
  if(e.key!=='Tab')return;var f=Array.prototype.filter.call(box.querySelectorAll('button:not([disabled]),a[href],input,[tabindex="0"]'),function(x){return x.offsetParent!==null});if(!f.length)return;
  var a=f[0],z=f[f.length-1];if(e.shiftKey&&d.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&d.activeElement===z){e.preventDefault();a.focus()}});
box.addEventListener('click',function(e){if(e.target===box&&mqP.matches)close()});

status();if(started){pull();loop()}
window.SYChat={open:open,close:close,mode:function(){return'tg'}};
})();
