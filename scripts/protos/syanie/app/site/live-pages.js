/* Многостраничный рабочий сайт клиники: меню на телефоне, версия для
   слабовидящих, окно о cookie (Яндекс Метрика только после «Разрешить»,
   152-ФЗ) и запись с выбранной услугой со страницы раздела. Работает на
   каждой странице, без библиотек. */
(function(){
'use strict';
var d=document,root=d.documentElement;
function $(s,c){return(c||d).querySelector(s)}
function $$(s,c){return Array.prototype.slice.call((c||d).querySelectorAll(s))}
function lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}
var K={};try{K=JSON.parse($('#sy-site').textContent)}catch(e){}

/* ── Меню на телефоне ─────────────────────────────────────────────── */
var mnav=$('#mnav'),burger=$('#burger'),mBack=null;
function mOpen(){if(!mnav)return;mBack=d.activeElement;mnav.hidden=false;burger.setAttribute('aria-expanded','true');root.classList.add('cx-lock');
  requestAnimationFrame(function(){mnav.classList.add('on');var a=$('a',mnav);if(a)a.focus({preventScroll:true})})}
function mClose(){if(!mnav||mnav.hidden)return;mnav.classList.remove('on');burger.setAttribute('aria-expanded','false');root.classList.remove('cx-lock');
  setTimeout(function(){mnav.hidden=true},root.classList.contains('calm')?0:300);try{(mBack||burger).focus({preventScroll:true})}catch(e){}}
if(mnav&&burger){
  burger.onclick=function(){mnav.hidden?mOpen():mClose()};
  $$('[data-mclose]',mnav).forEach(function(b){b.onclick=mClose});
  mnav.addEventListener('click',function(e){if(e.target===mnav)mClose();else if(e.target.closest&&e.target.closest('a'))setTimeout(mClose,0)});
  d.addEventListener('keydown',function(e){if(e.key==='Escape')mClose()});
}

/* ── Версия для слабовидящих: настройки в памяти браузера ─────────── */
var VI_KEY='sy-vi';
function vi(){var v=null;try{v=JSON.parse(lsGet(VI_KEY)||'null')}catch(e){}return v&&typeof v==='object'?v:{on:false}}
function viSave(v){lsSet(VI_KEY,JSON.stringify(v))}
function viApply(v){['vi-f1','vi-f2','vi-f3','vi-c1','vi-c2','vi-c3','vi-noimg','vi-sp'].forEach(function(c){root.classList.remove(c)});
  if(!v.on)return;root.classList.add('vi','vi-f'+(v.f||2),'vi-c'+(v.c||1));if(v.i===0)root.classList.add('vi-noimg');if(v.s)root.classList.add('vi-sp');
  $$('.vi-bar [data-vi]').forEach(function(b){var k=b.getAttribute('data-vi'),t=k.charAt(0),n=+k.slice(1);
    if(k==='off')return;b.setAttribute('aria-pressed',String(t==='f'?(v.f||2)===n:t==='c'?(v.c||1)===n:t==='i'?(v.i===0?0:1)===n:t==='s'?(v.s?1:0)===n:false))})}
/* Включить и выключить — с перезагрузкой: страница собирается «спокойной»,
   без пролёта и видео, и обратно. */
$$('[data-vi]').forEach(function(b){var k=b.getAttribute('data-vi');
  if(k==='on'){var on=vi().on;b.setAttribute('aria-pressed',String(on));
    if(on){if(b.classList.contains('vi-btn'))b.setAttribute('aria-label','Обычная версия сайта');else{var sp=$('span',b);(sp||b).textContent='Обычная версия сайта'}}}
  b.addEventListener('click',function(){var v=vi();
    if(k==='on'||k==='off'){v.on=k==='on'?!v.on:false;if(v.on){v.f=v.f||2;v.c=v.c||1;if(v.i!==0)v.i=1}viSave(v);location.reload();return}
    var t=k.charAt(0),n=+k.slice(1);if(t==='f')v.f=n;else if(t==='c')v.c=n;else if(t==='i')v.i=n;else if(t==='s')v.s=n;viSave(v);viApply(v)})});
viApply(vi());

/* ── Окно о cookie: Яндекс Метрика только с согласия ──────────────── */
var CK='sy-ck',ckBox=null;
function metrika(){var id=String(K.metrika||'');if(!/^\d{5,12}$/.test(id)||window.ym)return;
  (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();k=e.createElement(t);a=e.getElementsByTagName(t)[0];k.async=1;k.src=r;a.parentNode.insertBefore(k,a)})(window,d,'script','https://mc.yandex.ru/metrika/tag.js','ym');
  window.ym(+id,'init',{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:false})}
function ckSet(v){lsSet(CK,v+'|'+(K.pdv||'')+'|'+Date.now());if(ckBox){ckBox.classList.remove('on');setTimeout(function(){ckBox.hidden=true},300)}
  if(v==='all')metrika();else if(window.ym)location.reload()}
function ckShow(){if(!K.metrika)return;
  if(!ckBox){ckBox=d.createElement('div');ckBox.className='ck';ckBox.setAttribute('role','dialog');ckBox.setAttribute('aria-label','Файлы cookie');
    ckBox.innerHTML='<p>Сайт хранит в браузере только то, что нужно для записи и чата. Яндекс Метрика считает посещения и ставит свои cookie: включим её, только если вы разрешите. <a href="/privacy#cookies">Подробнее</a></p><div class="ck-b"><button type="button" class="btn btn-onyx" data-ck="all">Разрешить</button><button type="button" class="btn btn-line" data-ck="min">Только необходимые</button></div>';
    d.body.appendChild(ckBox);$$('[data-ck]',ckBox).forEach(function(b){b.onclick=function(){ckSet(b.getAttribute('data-ck'))}})}
  ckBox.hidden=false;requestAnimationFrame(function(){ckBox.classList.add('on')})}
var ck=String(lsGet(CK)||'').split('|')[0];
if(K.metrika){if(ck==='all')metrika();else if(ck!=='min')setTimeout(ckShow,1200)}
$$('[data-cookies]').forEach(function(b){b.onclick=ckShow});

/* ── Запись со страницы раздела: услуга выбрана заранее ───────────── */
var sheet=$('#zapis');
function pickSvc(name){if(!sheet||!name)return;var g=$('.bk-g[aria-label="Услуга"]',sheet);if(!g)return;
  var chip=$$('.chip[data-svc]',g).filter(function(c){return c.getAttribute('data-svc')===name})[0];
  if(!chip){chip=d.createElement('button');chip.type='button';chip.className='chip';chip.setAttribute('data-svc',name);chip.textContent=name;g.insertBefore(chip,g.firstChild);
    chip.onclick=function(){$$('.chip',g).forEach(function(x){x.setAttribute('aria-pressed',String(x===chip))})}}
  $$('.chip',g).forEach(function(x){x.setAttribute('aria-pressed',String(x===chip))})}
$$('[data-book][data-svc]').forEach(function(a){a.addEventListener('click',function(){pickSvc(a.getAttribute('data-svc'))})});
var page=d.body.getAttribute('data-page')||'',cat=(K.cats||{})[page];if(cat)pickSvc(cat);

/* Согласие отмечено — подсказка об ошибке уходит. */
$$('.pd-ok input').forEach(function(i){i.addEventListener('change',function(){var l=i.closest('.pd-ok');if(l)l.classList.remove('err');
  var f=l&&l.parentNode&&$('.lv-err',l.parentNode);if(f&&i.checked&&/согласи/i.test(f.textContent))f.textContent=''})});
})();
