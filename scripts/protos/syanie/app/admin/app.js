/* Админка «Сияние Севера» на сервере клиники. Данные — из своей базы
   (/api/admin/*), никаких демо-цифр. Подключения вводятся здесь же: ключ
   amoCRM, токен Telegram-бота, ключ Wazzup. Сообщения из всех каналов —
   в одном окне «Сообщения». */
(function(){
'use strict';
var d=document,app=d.getElementById('app');
var $=function(s,c){return(c||d).querySelector(s)},$$=function(s,c){return[].slice.call((c||d).querySelectorAll(s))};
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function pad(n){return(n<10?'0':'')+n}
function when(t){var x=new Date(t),n=new Date(),hm=pad(x.getHours())+':'+pad(x.getMinutes());
  if(x.toDateString()===n.toDateString())return'сегодня '+hm;
  var y=new Date(n.getTime()-864e5);if(x.toDateString()===y.toDateString())return'вчера '+hm;
  return pad(x.getDate())+'.'+pad(x.getMonth()+1)+' '+hm}
function plural(n,a,b,c){var m=n%10,mm=n%100;return n+' '+(m===1&&mm!==11?a:m>=2&&m<=4&&(mm<10||mm>=20)?b:c)}

var ST={new:'Новая',confirmed:'Подтверждена',came:'Пришёл',canceled:'Отменена'};
var SRC={booking:'Запись с сайта',quiz:'Квиз',chat:'Чат сайта',tg:'Telegram-бот',wz:'Мессенджер'};
var KIND={site:'Сайт',tg:'Telegram-бот',whatsapp:'WhatsApp',whatsgroup:'WhatsApp',instagram:'Instagram',telegram:'Telegram',telegroup:'Telegram',vk:'ВКонтакте',avito:'Авито',max:'MAX',maxgroup:'MAX',viber:'Viber'};
var NAV=[['svodka','Сводка','home'],['zayavki','Заявки','list'],['soobshcheniya','Сообщения','chat'],['sayt','Сайт','globe'],['podklyucheniya','Подключения','plug'],['komanda','Команда','users'],['istoriya','История','clock']];
var P='fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';
var ICONS={globe:'<circle cx="12" cy="12" r="8.5" '+P+'/><path d="M3.5 12h17M12 3.5c2.3 2.4 3.5 5.2 3.5 8.5s-1.2 6.1-3.5 8.5c-2.3-2.4-3.5-5.2-3.5-8.5s1.2-6.1 3.5-8.5z" '+P+'/>',home:'<path d="M4 11 12 4l8 7v9H4z" '+P+'/>',list:'<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" '+P+'/>',chat:'<path d="M4 5h16v11H9l-5 4z" '+P+'/>',plug:'<path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4" '+P+'/>',users:'<circle cx="9" cy="8" r="3.5" '+P+'/><path d="M2.5 20c.9-3.4 3.4-5 6.5-5s5.6 1.6 6.5 5M16 4.5a3.5 3.5 0 0 1 0 7M18 15c1.8.6 3 2.2 3.5 5" '+P+'/>',clock:'<circle cx="12" cy="12" r="8.5" '+P+'/><path d="M12 7.5V12l3 2" '+P+'/>',phone:'<path d="M5 4.5h3.5l1.5 4-2 1.3a10 10 0 0 0 6.2 6.2l1.3-2 4 1.5V19a1.5 1.5 0 0 1-1.6 1.5A15.5 15.5 0 0 1 3.5 6.1 1.5 1.5 0 0 1 5 4.5z" '+P+'/>',back:'<path d="M15 5l-7 7 7 7" '+P+'/>'};
function ic(k){return'<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">'+(ICONS[k]||'')+'</svg>'}

/* ── Запросы ─────────────────────────────────────────────────────── */
function api(path,body){
  var o={method:body?'POST':'GET',credentials:'same-origin',headers:{'X-SY':'1'}};
  if(body){o.headers['Content-Type']='application/json';o.body=JSON.stringify(body)}
  return fetch('/api/admin'+path,o).then(function(r){return r.json().catch(function(){return{}}).then(function(j){
    if(r.status===401&&path!=='/login'){ME=null;boot();throw new Error(j.error||'Войдите')}
    if(!r.ok)throw new Error(j.error||'Не получилось, попробуйте ещё раз');return j})})}
var tmr=0;function toast(t){var e=$('#toast');e.textContent=t;e.hidden=false;clearTimeout(tmr);tmr=setTimeout(function(){e.hidden=true},3200)}
function busy(btn,p){if(btn){btn.disabled=true}return p.then(function(x){if(btn)btn.disabled=false;return x},function(e){if(btn)btn.disabled=false;toast(e.message);throw e})}

/* ── Вход и первый запуск ────────────────────────────────────────── */
var ME=null,SETUP=false;
function boot(){api('/state').then(function(s){ME=s.user;SETUP=s.setup;ME?start():authView()}).catch(function(){app.innerHTML='<p class="boot">Сервер не отвечает. Обновите страницу через минуту.</p>'})}
function authView(){
  stopPoll();
  app.innerHTML='<div class="auth"><form id="af" novalidate>'+
    '<div class="brand"><i>С</i>Сияние Севера</div>'+
    (SETUP?'<h1>Первый вход</h1><p>Заведите учётную запись главного врача. Код установки лежит на сервере клиники в файле /opt/syanie/.env, строка SETUP_CODE. Его даст тот, кто ставил сайт.</p>'+
      '<label class="f">Код установки<input name="code" autocomplete="off" required></label>'+
      '<label class="f">Ваше имя<input name="name" autocomplete="name" required placeholder="Евгений Реутов"></label>':
      '<h1>Вход в админку</h1><p>Заявки с сайта, переписка из всех мессенджеров и подключения.</p>')+
    '<label class="f">Логин<input name="login" autocomplete="username" autocapitalize="none" required></label>'+
    '<label class="f">Пароль<input name="pass" type="password" autocomplete="'+(SETUP?'new-password':'current-password')+'" required'+(SETUP?' minlength="8"':'')+'></label>'+
    '<p class="err" id="aerr"></p><button class="btn" type="submit">'+(SETUP?'Создать и войти':'Войти')+'</button></form></div>';
  $('#af').onsubmit=function(e){e.preventDefault();var f=e.target,b=$('button',f),v={login:f.login.value.trim(),pass:f.pass.value};
    if(SETUP){v.code=f.code.value.trim();v.name=f.name.value.trim()}
    b.disabled=true;api(SETUP?'/setup':'/login',v).then(function(){boot()},function(er){b.disabled=false;$('#aerr').textContent=er.message})};
  var first=$('#af input');if(first)first.focus()}

/* ── Каркас ──────────────────────────────────────────────────────── */
var R={tab:'svodka',id:0},CNT={leads:0,msgs:0},poll=0;
function route(){var x=(location.hash||'#svodka').slice(1).split('/');R.tab=NAV.some(function(n){return n[0]===x[0]})?x[0]:'svodka';R.id=Number(x[1])||0}
function start(){
  app.innerHTML='<div class="shell"><aside class="side"><div class="brand"><i>С</i>Сияние Севера</div><nav class="nav" aria-label="Разделы">'+
    NAV.map(function(n){return'<a href="#'+n[0]+'" data-t="'+n[0]+'">'+ic(n[2])+'<span>'+n[1]+'</span></a>'}).join('')+
    '</nav><div class="me"><span><b>'+h(ME.name)+'</b><br>'+(ME.role==='owner'?'Главный врач':'Администратор')+'</span><button type="button" id="out">Выйти</button></div></aside><main class="main" id="view"></main></div>';
  $('#out').onclick=logout;route();show();startPoll()}
function logout(){api('/logout',{}).then(function(){ME=null;location.hash='';boot()})}
function marks(){$$('.nav a').forEach(function(a){var t=a.getAttribute('data-t');if(t===R.tab)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
  var old=$('b',a);if(old)old.remove();var n=t==='zayavki'?CNT.leads:t==='soobshcheniya'?CNT.msgs:0;if(n)a.insertAdjacentHTML('beforeend','<b>'+n+'</b>')})}
var VIEWS={};
function show(){route();marks();var v=$('#view');if(!v)return;(VIEWS[R.tab]||VIEWS.svodka)(v)}
addEventListener('hashchange',function(){if(ME)show()});
function pg(t,lead,act){return'<div class="pg-h"><div><h1>'+t+'</h1>'+(lead?'<p>'+lead+'</p>':'')+'</div>'+(act||'')+'</div>'}
function owner(){return ME&&ME.role==='owner'}

/* Сами обновляемся: новые заявки и сообщения видно без перезагрузки. */
function startPoll(){stopPoll();tick();poll=setInterval(tick,8000)}
function stopPoll(){clearInterval(poll);poll=0}
function tick(){if(d.hidden)return;api('/summary').then(function(s){CNT.leads=s.fresh;CNT.msgs=s.waiting;marks();
  if(R.tab==='soobshcheniya')VIEWS.soobshcheniya.refresh&&VIEWS.soobshcheniya.refresh();
  if(R.tab==='svodka')VIEWS.svodka.draw&&VIEWS.svodka.draw(s)}).catch(function(){})}

/* ── Сводка ──────────────────────────────────────────────────────── */
VIEWS.svodka=function(v){v.innerHTML=pg('Сводка','Что пришло с сайта и из мессенджеров')+'<div id="sv"><p class="hint">Загружаем…</p></div>';api('/summary').then(VIEWS.svodka.draw)};
VIEWS.svodka.draw=function(s){var box=$('#sv');if(!box)return;var dl=s.prev?Math.round((s.week-s.prev)/s.prev*100):null,set=s.settings,todo=[];
  if(!set.amo.on)todo.push('amoCRM');if(!set.tg.on)todo.push('Telegram-бот');if(!set.wz.on)todo.push('Wazzup');
  box.innerHTML='<div class="grid">'+
    (todo.length?'<div class="todo"><p><b>Осталось подключить: '+todo.join(', ')+'.</b><br><span class="hint">'+(owner()?'Нужен только ключ: где его взять, написано рядом с полем.':'Подключает главный врач.')+'</span></p><a class="btn" href="#podklyucheniya">Подключить</a></div>':'')+
    '<div class="kpis">'+
      '<a class="kpi hot" href="#zayavki"><small>Новые заявки</small><b>'+s.fresh+'</b><em>ждут звонка администратора</em></a>'+
      '<a class="kpi" href="#soobshcheniya"><small>Ждут ответа</small><b>'+s.waiting+'</b><em>диалоги, где последним писал пациент</em></a>'+
      '<a class="kpi" href="#zayavki"><small>Заявки за 7 дней</small><b>'+s.week+'</b><em class="'+(dl==null?'':dl>=0?'up':'down')+'">'+(dl==null?'неделей раньше: '+s.prev:(dl>=0?'↑ ':'↓ ')+Math.abs(dl)+'% к прошлой неделе')+'</em></a>'+
      '<a class="kpi" href="#zayavki"><small>Пришли на приём</small><b>'+s.came+'</b><em>за 30 дней</em></a>'+
    '</div>'+
    '<div class="conn">'+
      stateCard('amoCRM',set.amo.on,set.amo.on?'Аккаунт <b>'+h(set.amo.account||set.amo.domain)+'</b>'+(set.amo.auto?', заявки уходят сами':', заявки — по кнопке')+(s.amoUnsent?'<br>Не отправлено за 30 дней: <b>'+s.amoUnsent+'</b>':''):'Не подключена')+
      stateCard('Telegram-бот',set.tg.on,set.tg.on?'<b>@'+h(set.tg.bot)+'</b><br>Уведомления получают: '+(set.tg.staff.length?h(set.tg.staff.join(', ')):'никто, привяжите свой Telegram'):'Не подключён')+
      stateCard('Wazzup',set.wz.on,set.wz.on?plural(set.wz.channels.length,'канал','канала','каналов')+': '+h(set.wz.channels.map(function(c){return KIND[c.kind]||c.kind}).join(', ')):'Не подключён')+
    '</div>'+
    (s.bySrc.length?'<div class="cd"><h2>Откуда заявки за 30 дней</h2><div class="chips">'+s.bySrc.map(function(x){return'<span class="chip">'+h(SRC[x.src]||x.src)+': <b>'+x.n+'</b></span>'}).join('')+'</div></div>':'')+
    (s.byKind.length?'<div class="cd"><h2>Диалоги за 30 дней</h2><div class="chips">'+s.byKind.map(function(x){return'<span class="kd kd-'+h(x.kind)+'">'+h(KIND[x.kind]||x.kind)+' · '+x.n+'</span>'}).join('')+'</div></div>':'')+
  '</div>'};
function stateCard(t,on,body){return'<a class="cd cx cx-a" href="#podklyucheniya"><div class="cx-h"><span class="dot'+(on?' on':'')+'"></span><h2>'+t+'</h2></div><p class="state">'+body+'</p></a>'}

/* ── Заявки ──────────────────────────────────────────────────────── */
var LEADS=[],LF='all',AMO_BASE='';
VIEWS.zayavki=function(v){
  v.innerHTML=pg('Заявки','С сайта, квиза, чата и из переписки. Новые сверху.')+'<div class="split'+(R.id?' open':'')+'" id="lz"><div class="list"><div class="tabs" role="group" aria-label="Статус">'+
    [['all','Все'],['new','Новые'],['confirmed','Подтверждены'],['came','Пришли'],['canceled','Отменены']].map(function(x){return'<button type="button" data-f="'+x[0]+'" aria-pressed="'+(LF===x[0])+'">'+x[1]+'</button>'}).join('')+
    '</div><div class="items" id="li"><p class="empty">Загружаем…</p></div></div><div class="det-w" id="ld"></div></div>';
  $$('.tabs button',v).forEach(function(b){b.onclick=function(){LF=b.getAttribute('data-f');$$('.tabs button',v).forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});drawLeads()}});
  Promise.all([api('/leads'),api('/settings')]).then(function(r){LEADS=r[0].leads;AMO_BASE=r[1].amo.on?r[1].amo.base:'';drawLeads();drawLead()})};
function drawLeads(){var box=$('#li');if(!box)return;var list=LEADS.filter(function(l){return LF==='all'||l.status===LF});
  box.innerHTML=list.length?list.map(function(l){return'<a class="it" href="#zayavki/'+l.id+'"'+(l.id===R.id?' aria-current="true"':'')+'><span class="t"><span>'+h(l.name||'Без имени')+'</span><small>'+when(l.at)+'</small></span><span class="s">'+h(l.what)+(l.wish?' · '+h(l.wish):'')+'</span><span class="m"><span class="st st-'+l.status+'">'+ST[l.status]+'</span><span class="chip">'+h(SRC[l.src]||l.src)+'</span>'+(l.amo_id?'<span class="chip">amoCRM</span>':'')+'</span></a>'}).join(''):'<p class="empty">'+(LEADS.length?'Здесь пусто.':'Заявок пока нет. Они появятся здесь, как только кто-то оставит их на сайте.')+'</p>'}
function drawLead(){var box=$('#ld');if(!box)return;var l=LEADS.filter(function(x){return x.id===R.id})[0];
  if(!l){box.innerHTML=R.id?'<div class="cd"><p class="empty">Заявка не найдена</p></div>':'<div class="cd"><p class="empty">Выберите заявку слева</p></div>';return}
  box.innerHTML='<div class="cd det"><a class="btn ghost sm back" href="#zayavki">'+ic('back')+'К списку</a><div class="row row-sb"><h2>'+h(l.name||'Без имени')+'</h2><span class="st st-'+l.status+'">'+ST[l.status]+'</span></div>'+
    '<dl class="facts"><dt>Телефон</dt><dd>'+(l.phone?'<a href="tel:'+h(l.phone)+'">'+h(l.phone)+'</a>':'не указан')+'</dd><dt>Что нужно</dt><dd>'+h(l.what)+'</dd>'+(l.wish?'<dt>Удобно</dt><dd>'+h(l.wish)+'</dd>':'')+'<dt>Откуда</dt><dd>'+h(SRC[l.src]||l.src)+', '+when(l.at)+'</dd>'+
    (l.conv_id?'<dt>Переписка</dt><dd><a href="#soobshcheniya/'+l.conv_id+'">открыть диалог</a></dd>':'')+
    '<dt>amoCRM</dt><dd>'+(l.amo_id?(AMO_BASE?'<a href="'+AMO_BASE+'/leads/detail/'+l.amo_id+'" target="_blank" rel="noopener">сделка '+l.amo_id+'</a>':'сделка '+l.amo_id):AMO_BASE?'ещё не отправлена'+(l.amo_err?' <span class="err">('+h(l.amo_err)+')</span>':''):'не подключена')+'</dd></dl>'+
    '<div class="row">'+(l.phone?'<a class="btn" href="tel:'+h(l.phone)+'">'+ic('phone')+'Позвонить</a>':'')+(!l.amo_id&&AMO_BASE?'<button type="button" class="btn ghost" id="toamo">Отправить в amoCRM</button>':'')+'</div>'+
    '<div><p class="hint">Статус видит и пациент: на сайте у него стоит отметка о заявке.</p><div class="row">'+Object.keys(ST).map(function(k){return'<button type="button" class="btn sm '+(l.status===k?'':'ghost')+'" data-st="'+k+'">'+ST[k]+'</button>'}).join('')+'</div></div>'+
    '<label class="f">Заметка для коллег<textarea id="lnote" maxlength="1000">'+h(l.note)+'</textarea></label><div><button type="button" class="btn ghost sm" id="lsave">Сохранить заметку</button></div></div>';
  $$('[data-st]',box).forEach(function(b){b.onclick=function(){busy(b,api('/leads/'+l.id,{status:b.getAttribute('data-st')})).then(upd)}});
  $('#lsave').onclick=function(){busy(this,api('/leads/'+l.id,{note:$('#lnote').value})).then(function(x){upd(x);toast('Заметка сохранена')})};
  var ta=$('#toamo');if(ta)ta.onclick=function(){busy(ta,api('/leads/'+l.id+'/amo',{})).then(function(){return api('/leads/'+l.id)}).then(function(x){upd(x);toast('Сделка создана в amoCRM')})};
  function upd(x){LEADS=LEADS.map(function(y){return y.id===x.id?x:y});drawLeads();drawLead()}}

/* ── Сообщения: все каналы в одном окне ──────────────────────────── */
var CONVS=[],CONV=null;
VIEWS.soobshcheniya=function(v){
  v.innerHTML=pg('Сообщения','Сайт, Telegram, WhatsApp, Instagram, ВКонтакте и Авито в одном окне. Ответ уходит туда же, откуда написал пациент.')+'<div class="split'+(R.id?' open':'')+'" id="mz"><div class="list"><div class="items" id="mi"><p class="empty">Загружаем…</p></div></div><div class="det-w" id="md"></div></div>';
  CONV=null;VIEWS.soobshcheniya.refresh()};
VIEWS.soobshcheniya.refresh=function(){
  api('/inbox').then(function(r){CONVS=r.convs;drawConvs()});
  if(R.id)api('/inbox/'+R.id).then(function(c){var fresh=!CONV||CONV.id!==c.id||CONV.msgs.length!==c.msgs.length;CONV=c;if(fresh)drawConv()}).catch(function(){CONV=null;drawConv()});else drawConv()};
function drawConvs(){var box=$('#mi');if(!box)return;
  box.innerHTML=CONVS.length?CONVS.map(function(c){return'<a class="it" href="#soobshcheniya/'+c.id+'"'+(c.id===R.id?' aria-current="true"':'')+'><span class="t"><span>'+h(c.name||'Без имени')+'</span><small>'+when(c.last_at)+'</small></span><span class="s">'+(c.last_dir==='out'?'Вы: ':'')+h(c.last_text||'')+'</span><span class="m"><span class="kd kd-'+h(c.kind)+'">'+h(KIND[c.kind]||c.kind)+'</span>'+(c.unread&&c.id!==R.id?'<span class="n">'+c.unread+'</span>':'')+(c.last_dir==='in'?'<span class="chip">ждёт ответа</span>':'')+'</span></a>'}).join(''):'<p class="empty">Диалогов пока нет. Сюда придут сообщения из чата на сайте, Telegram-бота и мессенджеров Wazzup.</p>'}
function drawConv(){var box=$('#md');if(!box)return;var c=CONV;
  if(!c){box.innerHTML='<div class="cd"><p class="empty">'+(R.id?'Диалог не найден':'Выберите диалог слева')+'</p></div>';return}
  var keep=$('#rt')?$('#rt').value:'';
  box.innerHTML='<div class="cd chat"><div class="chat-h"><span class="row"><a class="btn ghost sm back" href="#soobshcheniya">'+ic('back')+'</a><b>'+h(c.name||'Без имени')+'</b><span class="kd kd-'+h(c.kind)+'">'+h(KIND[c.kind]||c.kind)+'</span>'+(c.phone?'<a href="tel:'+h(c.phone)+'" class="hint">'+h(c.phone)+'</a>':'')+'</span><button type="button" class="btn ghost sm" id="mlead">Завести заявку</button></div>'+
    '<div class="log" id="mlog">'+c.msgs.map(function(m){return'<div class="msg '+m.dir+'">'+h(m.text)+'<small>'+(m.dir==='out'?h(m.who||'Клиника')+' · ':'')+when(m.at)+'</small></div>'}).join('')+'</div>'+
    '<form class="reply" id="mform"><textarea id="rt" rows="1" placeholder="Ответ пациенту: '+h(KIND[c.kind]||c.kind)+'" maxlength="4000"></textarea><button class="btn" type="submit">Отправить</button></form></div>';
  var lg=$('#mlog');lg.scrollTop=lg.scrollHeight;var rt=$('#rt');rt.value=keep;
  rt.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();$('#mform').requestSubmit()}});
  $('#mform').onsubmit=function(e){e.preventDefault();var t=rt.value.trim();if(!t)return;busy($('button',e.target),api('/inbox/'+c.id,{text:t})).then(function(x){CONV=x;rt.value='';drawConv();VIEWS.soobshcheniya.refresh()})};
  $('#mlead').onclick=function(){busy(this,api('/inbox/'+c.id+'/lead',{})).then(function(r){toast('Заявка №'+r.lead+' заведена');location.hash='#zayavki/'+r.lead})};
  rt.focus()}

/* ── Подключения ─────────────────────────────────────────────────── */
VIEWS.podklyucheniya=function(v){v.innerHTML=pg('Подключения','Вставьте ключи один раз, дальше всё работает само.')+'<div id="cz"><p class="hint">Загружаем…</p></div>';api('/settings').then(drawConn)};
function drawConn(s){var box=$('#cz');if(!box)return;var ro=!owner();
  box.innerHTML=(ro?'<div class="todo"><p>Подключения меняет главный врач. Вы видите, что подключено.</p></div><br>':'')+'<div class="conn">'+
  /* amoCRM */
  '<section class="cd cx"><div class="cx-h"><span class="dot'+(s.amo.on?' on':'')+'"></span><h2>amoCRM</h2></div>'+
    (s.amo.on?'<p class="state">Аккаунт <b>'+h(s.amo.account||s.amo.domain)+'</b></p><div id="amo-opt" class="grid"><p class="hint">Загружаем воронки…</p></div>':'<p class="state">Каждая заявка станет сделкой с контактом и телефоном.</p>')+
    (ro?'':'<form id="f-amo" class="grid"><label class="f">Поддомен amoCRM<input name="domain" placeholder="siyanie или siyanie.amocrm.ru" value="'+h(s.amo.domain)+'" autocomplete="off"></label>'+
      '<label class="f">Долгосрочный токен<input name="token" type="password" autocomplete="off" placeholder="'+(s.amo.hasToken?'сохранён, вставьте новый, чтобы заменить':'вставьте токен')+'"></label>'+
      '<div class="hint">Где взять: amoCRM → «amoМаркет» → «⋯» → «Создать интеграцию» → «Внешняя интеграция», галочки «Доступ к данным аккаунта» → «Сохранить». Во вкладке «Ключи и доступы» нажмите «Сгенерировать токен» и скопируйте его сюда.</div>'+
      '<div class="row"><button class="btn" type="submit">'+(s.amo.on?'Проверить и сохранить':'Подключить')+'</button>'+(s.amo.on?'<button type="button" class="btn danger" data-off="amo">Отключить</button>':'')+'</div></form>')+
  '</section>'+
  /* Telegram */
  '<section class="cd cx"><div class="cx-h"><span class="dot'+(s.tg.on?' on':'')+'"></span><h2>Telegram-бот</h2></div>'+
    (s.tg.on?'<p class="state">Бот <b>@'+h(s.tg.bot)+'</b>. Пациенты пишут ему, ответы уходят из «Сообщений». Уведомления получают: <b>'+(s.tg.staff.length?h(s.tg.staff.join(', ')):'пока никто')+'</b>.</p><div class="row"><button type="button" class="btn" id="tglink">Привязать мой Telegram</button></div><p class="hint">После привязки сюда, в Telegram, придут новые заявки и сообщения из всех каналов. Ответьте на уведомление (Reply), и ответ уйдёт пациенту туда, откуда он написал.</p>':'<p class="state">Пациенты пишут боту клиники, а вы получаете заявки и сообщения в Telegram и отвечаете прямо из него.</p>')+
    (ro?'':'<form id="f-tg" class="grid"><label class="f">Токен бота<input name="token" type="password" autocomplete="off" placeholder="'+(s.tg.on?'сохранён, вставьте новый, чтобы заменить':'123456789:AA…')+'"></label>'+
      '<div class="hint">Где взять: в Telegram откройте @BotFather → /newbot → название, например «Сияние Севера» → короткое имя на bot. BotFather пришлёт токен, вставьте его сюда.</div>'+
      '<div class="row"><button class="btn" type="submit">'+(s.tg.on?'Заменить токен':'Подключить')+'</button>'+(s.tg.on?'<button type="button" class="btn danger" data-off="tg">Отключить</button>':'')+'</div></form>')+
  '</section>'+
  /* Wazzup */
  '<section class="cd cx"><div class="cx-h"><span class="dot'+(s.wz.on?' on':'')+'"></span><h2>Wazzup: WhatsApp, Instagram и другие</h2></div>'+
    (s.wz.on?'<p class="state">'+(s.wz.channels.length?'Каналы:':'Каналов в Wazzup пока нет.')+'</p><div class="chips">'+s.wz.channels.map(function(c){return'<span class="kd kd-'+h(c.kind)+'">'+h(KIND[c.kind]||c.kind)+(c.plain?' · '+h(c.plain):'')+'</span>'}).join('')+'</div>':'<p class="state">Instagram, WhatsApp, Telegram-аккаунт, ВКонтакте, Авито и MAX одним ключом. Каналы подключаются в самом Wazzup.</p>')+
    (ro?'':'<form id="f-wz" class="grid"><label class="f">Ключ API Wazzup<input name="key" type="password" autocomplete="off" placeholder="'+(s.wz.on?'сохранён, вставьте новый, чтобы заменить':'вставьте ключ')+'"></label>'+
      '<div class="hint">Где взять: личный кабинет Wazzup → «Интеграции» → «API» → скопировать ключ. Мессенджеры (WhatsApp, Instagram и др.) подключаются там же, в разделе «Каналы». Новый канал подтянется сам: нажмите «Обновить каналы».</div>'+
      '<div class="row"><button class="btn" type="submit">'+(s.wz.on?'Обновить каналы':'Подключить')+'</button>'+(s.wz.on?'<button type="button" class="btn danger" data-off="wz">Отключить</button>':'')+'</div></form>')+
  '</section>'+
  /* Метрика и поисковики (п. 7 техзадания) */
  '<section class="cd cx"><div class="cx-h"><span class="dot'+(s.seo.metrika?' on':'')+'"></span><h2>Яндекс.Метрика и поиск</h2></div>'+
    '<p class="state">'+(s.seo.metrika?'Метрика <b>'+h(s.seo.metrika)+'</b> считает посещения и записи.':'Метрика не подключена.')+(s.seo.yandex?' Вебмастер подтверждён.':'')+(s.seo.google?' Search Console подтверждена.':'')+'</p>'+
    (ro?'':'<form id="f-seo" class="grid"><label class="f">Номер счётчика Метрики<input name="metrika" inputmode="numeric" autocomplete="off" placeholder="98765432" value="'+h(s.seo.metrika)+'"></label>'+
      '<label class="f">Код Яндекс.Вебмастера<input name="yandex" autocomplete="off" placeholder="значение content из мета-тега" value="'+h(s.seo.yandex)+'"></label>'+
      '<label class="f">Код Google Search Console<input name="google" autocomplete="off" placeholder="значение content из мета-тега" value="'+h(s.seo.google)+'"></label>'+
      '<div class="hint">Метрика: metrika.yandex.ru → «Добавить счётчик» → адрес сайта → номер счётчика. Вебмастер: webmaster.yandex.ru → «Добавить сайт» → способ «Мета-тег», скопируйте только значение content. Search Console: search.google.com/search-console → «Префикс URL» → «Тег HTML», так же. Карта сайта для них: адрес сайта и /sitemap.xml.</div>'+
      '<div class="row"><button class="btn" type="submit">Сохранить</button></div></form>')+
  '</section></div>';
  if(!s.publicUrl)box.insertAdjacentHTML('afterbegin','<div class="todo"><p>У сервера не задан адрес сайта (DOMAIN в .env): Telegram и Wazzup не смогут присылать сообщения.</p></div><br>');
  function form(id,name,read){var f=$('#'+id);if(!f)return;f.onsubmit=function(e){e.preventDefault();var b=$('button[type=submit]',f),v=read(f);
    busy(b,api('/connect/'+name,v)).then(function(){toast('Подключено');return api('/settings')}).then(drawConn)}}
  form('f-amo','amo',function(f){return{domain:f.domain.value.trim(),token:f.token.value.trim()}});
  form('f-tg','tg',function(f){return{token:f.token.value.trim()}});
  form('f-wz','wz',function(f){return{key:f.key.value.trim()}});
  var fs=$('#f-seo');if(fs)fs.onsubmit=function(e){e.preventDefault();busy($('button[type=submit]',fs),api('/seo',{metrika:fs.metrika.value.trim(),yandex:fs.yandex.value.trim(),google:fs.google.value.trim()})).then(function(){toast('Сохранено, сайт обновлён');return api('/settings')}).then(drawConn)};
  $$('[data-off]',box).forEach(function(b){b.onclick=function(){if(!confirm('Отключить? Ключ удалится из админки.'))return;busy(b,api('/connect/'+b.getAttribute('data-off')+'/off',{})).then(drawConn)}});
  var tl=$('#tglink');if(tl)tl.onclick=function(){busy(tl,api('/tg/link',{})).then(function(r){window.open(r.url,'_blank','noopener');toast('Нажмите «Start» в Telegram')})};
  if(s.amo.on)amoOptions(s,ro)}
function amoOptions(s,ro){api('/amo/pipelines').then(function(r){var box=$('#amo-opt');if(!box)return;var ps=r.pipelines,cur=ps.filter(function(p){return String(p.id)===String(s.amo.pipeline)})[0]||ps[0];
  box.innerHTML='<label class="f">Воронка<select id="ap"'+(ro?' disabled':'')+'>'+ps.map(function(p){return'<option value="'+p.id+'"'+(cur&&p.id===cur.id?' selected':'')+'>'+h(p.name)+'</option>'}).join('')+'</select></label>'+
    '<label class="f">Этап для новых заявок<select id="as"'+(ro?' disabled':'')+'></select></label>'+
    '<label class="switch"><input type="checkbox" id="aa"'+(s.amo.auto?' checked':'')+(ro?' disabled':'')+'>Новые заявки сразу в amoCRM</label>'+
    (ro?'':'<div><button type="button" class="btn ghost sm" id="asave">Сохранить</button></div>');
  function stages(){var p=ps.filter(function(x){return String(x.id)===$('#ap').value})[0];$('#as').innerHTML=(p?p.statuses:[]).map(function(x){return'<option value="'+x.id+'"'+(String(x.id)===String(s.amo.status)?' selected':'')+'>'+h(x.name)+'</option>'}).join('')}
  $('#ap').onchange=stages;stages();
  var sv=$('#asave');if(sv)sv.onclick=function(){busy(sv,api('/amo/options',{pipeline:$('#ap').value,status:$('#as').value,auto:$('#aa').checked})).then(function(){toast('Сохранено')})}}).catch(function(e){var box=$('#amo-opt');if(box)box.innerHTML='<p class="err">'+h(e.message)+'</p>'})}

/* ── Команда ─────────────────────────────────────────────────────── */
VIEWS.komanda=function(v){v.innerHTML=pg('Команда','Кто входит в админку')+'<div class="grid" id="tz"><p class="hint">Загружаем…</p></div>';api('/users').then(drawTeam)};
function drawTeam(r){var box=$('#tz');if(!box)return;
  box.innerHTML='<div class="cd"><table class="tbl"><thead><tr><th>Имя</th><th>Логин</th><th>Роль</th><th></th></tr></thead><tbody>'+r.users.map(function(u){return'<tr><td>'+h(u.name)+(u.disabled?' <span class="chip">отключён</span>':'')+'</td><td>'+h(u.login)+'</td><td>'+h(r.roles[u.role]||u.role)+'</td><td>'+(owner()&&!u.disabled&&u.id!==ME.id?'<button type="button" class="btn ghost sm" data-pw="'+u.id+'">Новый пароль</button> <button type="button" class="btn danger sm" data-off="'+u.id+'">Отключить</button>':'')+'</td></tr>'}).join('')+'</tbody></table></div>'+
    (owner()?'<form class="cd grid" id="uadd"><h2>Добавить сотрудника</h2><div class="fgrid"><label class="f">Имя<input name="name" required></label><label class="f">Логин<input name="login" required autocapitalize="none"></label><label class="f">Роль<select name="role"><option value="admin">Администратор</option><option value="owner">Главный врач</option></select></label><label class="f">Пароль (от 8 знаков)<input name="pass" type="text" minlength="8" required autocomplete="new-password"></label></div><p class="hint">Администратор видит заявки и сообщения и отвечает пациентам. Главный врач ещё подключает сервисы и управляет командой.</p><div><button class="btn" type="submit">Добавить</button></div></form>':'')+
    '<form class="cd grid" id="mypw"><h2>Мой пароль</h2><div class="fgrid fgrid-w"><label class="f">Текущий<input name="old" type="password" required autocomplete="current-password"></label><label class="f">Новый (от 8 знаков)<input name="pass" type="password" minlength="8" required autocomplete="new-password"></label></div><div><button class="btn ghost" type="submit">Сменить пароль</button></div></form>';
  var ua=$('#uadd');if(ua)ua.onsubmit=function(e){e.preventDefault();var f=e.target;busy($('button',f),api('/users',{name:f.name.value.trim(),login:f.login.value.trim(),role:f.role.value,pass:f.pass.value})).then(function(x){toast('Сотрудник добавлен');drawTeam({users:x.users,roles:r.roles})})};
  $$('[data-off]',box).forEach(function(b){b.onclick=function(){if(!confirm('Отключить сотрудника? Он больше не войдёт.'))return;busy(b,api('/users/'+b.getAttribute('data-off')+'/off',{})).then(function(x){drawTeam({users:x.users,roles:r.roles})})}});
  $$('[data-pw]',box).forEach(function(b){b.onclick=function(){var p=prompt('Новый пароль, от 8 знаков. Передайте его сотруднику.');if(!p)return;busy(b,api('/users/'+b.getAttribute('data-pw')+'/pass',{pass:p})).then(function(){toast('Пароль сменён')})}});
  $('#mypw').onsubmit=function(e){e.preventDefault();var f=e.target;busy($('button',f),api('/me/pass',{old:f.old.value,pass:f.pass.value})).then(function(){toast('Пароль сменён, войдите заново');ME=null;boot()})}}

/* ── История ─────────────────────────────────────────────────────── */
VIEWS.istoriya=function(v){v.innerHTML=pg('История','Кто, что и когда сделал')+'<div class="cd" id="hz"><p class="hint">Загружаем…</p></div>';
  api('/log').then(function(r){$('#hz').innerHTML=r.log.length?'<table class="tbl"><tbody>'+r.log.map(function(x){return'<tr><td class="td-t">'+when(x.at)+'</td><td>'+h(x.who)+'</td><td>'+h(x.t)+'</td></tr>'}).join('')+'</tbody></table>':'<p class="empty">Пока пусто</p>'})};

/* ── Сайт: правка содержимого без программиста ───────────────────── */
var SITE=null,SG='contacts',SV=null,SOPEN=false;
VIEWS.sayt=function(v){v.innerHTML=pg('Сайт','Цены, услуги, акции, врачи, вопросы, отзывы и тексты. Сохранили: сайт обновился сразу.','<a class="btn ghost sm" href="/" target="_blank" rel="noopener">Открыть сайт</a>')+'<div class="split" id="sz"><p class="hint">Загружаем…</p></div>';
  api('/site').then(function(r){SITE=r;drawSite()}).catch(function(e){$('#sz').innerHTML='<div class="cd"><p class="empty">'+h(e.message)+'</p></div>'})};
function cur(key){return SITE.edits[key]!==undefined?SITE.edits[key]:SITE.defaults[key]}
function clone(x){return JSON.parse(JSON.stringify(x))}
function drawSite(){var box=$('#sz');if(!box||!SITE)return;box.classList.toggle('open',SOPEN);
  box.innerHTML='<div class="list"><div class="items">'+SITE.groups.map(function(g){return'<a class="it" href="#sayt" data-g="'+g.key+'"'+(g.key===SG?' aria-current="true"':'')+'><span class="t"><span>'+h(g.title)+'</span>'+(SITE.edits[g.key]!==undefined?'<small>изменено</small>':'')+'</span></a>'}).join('')+'</div></div><div class="det-w" id="se"></div>';
  $$('[data-g]',box).forEach(function(a){a.onclick=function(e){e.preventDefault();SG=a.getAttribute('data-g');SV=null;SOPEN=true;drawSite();scrollTo(0,0)}});
  var g=SITE.groups.filter(function(x){return x.key===SG})[0];if(!SV)SV=clone(SG==='texts'?(SITE.edits.texts||{}):cur(SG));drawGroup(g)}
function inp(f,val,path){var id='s-'+path.replace(/\W/g,'-'),ph=f.hint?' placeholder="'+h(f.hint)+'"':'';
  if(f.type==='bool')return'<label class="f fb"><input type="checkbox" data-p="'+path+'"'+(val?' checked':'')+'> '+h(f.label)+'</label>';
  if(f.type==='image')return'<div class="f"><span>'+h(f.label)+'</span><div class="row">'+(val?'<img class="s-img" src="'+(val.charAt(0)==='/'?h(val):'/protos/syanie/'+h(val)+'.webp')+'" alt="">':'<span class="hint">нет фото</span>')+'<label class="btn ghost sm">Загрузить<input type="file" accept="image/jpeg,image/png,image/webp" data-up="'+path+'" hidden></label>'+(val?'<button type="button" class="btn ghost sm" data-clr="'+path+'">Убрать</button>':'')+'</div></div>';
  if(f.type==='area'||f.type==='lines')return'<label class="f">'+h(f.label)+'<textarea data-p="'+path+'" maxlength="'+f.max+'"'+ph+'>'+h(val)+'</textarea></label>';
  return'<label class="f">'+h(f.label)+'<input data-p="'+path+'"'+(f.type==='int'?' inputmode="numeric"':'')+' value="'+h(val)+'"'+(f.max?' maxlength="'+f.max+'"':'')+ph+'></label>'}
function getP(path){return path.split('.').reduce(function(o,k){return o==null?o:o[k]},SV)}
function setP(path,val){var ks=path.split('.'),o=SV;for(var i=0;i<ks.length-1;i++)o=o[ks[i]];o[ks[ks.length-1]]=val}
function drawGroup(g){var box=$('#se');if(!box)return;var html='<div class="cd det"><a class="btn ghost sm back" href="#sayt" id="s-back">'+ic('back')+'К разделам</a><h2>'+h(g.title)+'</h2>'+(g.hint?'<p class="hint">'+h(g.hint)+'</p>':'');
  if(g.kind==='object')html+='<div class="fgrid fgrid-w">'+g.fields.map(function(f){return inp(f,SV[f.k],f.k)}).join('')+'</div>';
  else if(g.kind==='texts')html+=Object.keys(SITE.texts).map(function(k){var d=SITE.defaults.texts[k]||{},t=SV[k]||(SV[k]={});
    return'<details class="s-tx"'+(k==='hero'?' open':'')+'><summary>'+h(SITE.texts[k])+'</summary><div class="fgrid fgrid-w">'+['kick','h'].concat(k==='hero'?['em']:[]).concat(['p']).map(function(p){
      return'<label class="f">'+({kick:'Подзаголовок',h:'Заголовок',em:'Выделенная часть заголовка',p:'Абзац'})[p]+(p==='p'?'<textarea data-p="'+k+'.'+p+'" placeholder="'+h(d[p]||'')+'">'+h(t[p]||'')+'</textarea>':'<input data-p="'+k+'.'+p+'" placeholder="'+h(d[p]||'')+'" value="'+h(t[p]||'')+'">')+'</label>'}).join('')+'</div></details>'}).join('');
  else{var list=g.head?SV.items:SV,pre=g.head?'items.':'';
    if(g.head)html+='<div class="fgrid">'+g.head.map(function(f){return inp(f,SV[f.k],f.k)}).join('')+'</div>';
    html+=list.map(function(it,i){return'<div class="s-row"><div class="s-rh"><b>'+(i+1)+'</b><span class="row"><button type="button" class="btn ghost sm" data-up-i="'+i+'"'+(i?'':' disabled')+'>Выше</button><button type="button" class="btn ghost sm" data-del="'+i+'">Удалить</button></span></div><div class="fgrid fgrid-w">'+g.fields.map(function(f){return inp(f,it[f.k],pre+i+'.'+f.k)}).join('')+'</div></div>'}).join('')||'<p class="hint">Пока пусто.</p>';
    if(list.length<g.max)html+='<button type="button" class="btn ghost" id="s-add">Добавить</button>'}
  html+='<p class="err" id="s-err"></p><div class="row"><button type="button" class="btn" id="s-save">Сохранить</button>'+(SITE.edits[g.key]!==undefined?'<button type="button" class="btn ghost" id="s-reset">Вернуть как было</button>':'')+'</div></div>';
  box.innerHTML=html;
  $$('[data-p]',box).forEach(function(el){el.addEventListener(el.type==='checkbox'?'change':'input',function(){var p=el.getAttribute('data-p');
    if(g.kind==='texts'){var ks=p.split('.');SV[ks[0]]=SV[ks[0]]||{};SV[ks[0]][ks[1]]=el.value;return}
    setP(p,el.type==='checkbox'?el.checked:el.value)})});
  var list2=g.kind==='list'?(g.head?SV.items:SV):null;
  $$('[data-del]',box).forEach(function(b){b.onclick=function(){list2.splice(+b.getAttribute('data-del'),1);drawGroup(g)}});
  $$('[data-up-i]',box).forEach(function(b){b.onclick=function(){var i=+b.getAttribute('data-up-i'),x=list2[i];list2[i]=list2[i-1];list2[i-1]=x;drawGroup(g)}});
  var add=$('#s-add');if(add)add.onclick=function(){var o={};g.fields.forEach(function(f){o[f.k]=f.type==='bool'?false:f.type==='int'?0:''});list2.push(o);drawGroup(g)};
  $$('[data-clr]',box).forEach(function(b){b.onclick=function(){setP(b.getAttribute('data-clr'),'');drawGroup(g)}});
  $$('[data-up]',box).forEach(function(el){el.onchange=function(){var file=el.files[0];if(!file)return;if(file.size>3*1024*1024){toast('Фото больше 3 МБ: уменьшите его');return}
    var rd=new FileReader();rd.onload=function(){api('/upload',{data:rd.result}).then(function(r){setP(el.getAttribute('data-up'),r.url);drawGroup(g);toast('Фото загружено, сохраните раздел')},function(e){toast(e.message)})};rd.readAsDataURL(file)}});
  $('#s-back').onclick=function(e){e.preventDefault();SOPEN=false;$('#sz').classList.remove('open')};
  $('#s-save').onclick=function(){var b=this;$('#s-err').textContent='';busy(b,api('/site/'+g.key,{value:SV})).then(function(r){SITE=r;SV=null;drawSite();toast('Сохранено, сайт обновлён')},function(e){$('#s-err').textContent=e.message})};
  var rs=$('#s-reset');if(rs)rs.onclick=function(){if(!confirm('Вернуть раздел «'+g.title+'» как было при запуске сайта?'))return;busy(rs,api('/site/'+g.key+'/reset',{})).then(function(r){SITE=r;SV=null;drawSite();toast('Вернули как было')})}}

d.addEventListener('visibilitychange',function(){if(!d.hidden&&ME)tick()});
boot();
})();
