(function(){
'use strict';
/* Чат на сайте «Сияния Севера», два варианта для показа владельцу:
   «ИИ-консультант» и «Менеджер в Telegram». В макете модель не вызывается:
   консультант отвечает фактами клиники (вопросы из поиска, цены, гарантии,
   врачи, адрес) простым подбором по словам, ответ администратора в Telegram
   идёт по сценарию с пометкой «демо». Переписка пишется в общее состояние
   (window.SY, store.js), поэтому её видит панель клиники, а ответ из панели
   сразу появляется здесь. */
var d=document,root=d.documentElement;
if(!window.SY)return;
function $(s,c){return(c||d).querySelector(s)}
function el(tag,cls,txt){var e=d.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}
function ic(k){return'<svg class="ic" aria-hidden="true"><use href="#i-'+k+'"/></svg>'}
function lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function pad(n){return(n<10?'0':'')+n}
function hm(t){var x=new Date(t);return pad(x.getHours())+':'+pad(x.getMinutes())}
function rub(n){return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ')+' ₽'}
var K={};try{K=JSON.parse($('#sy-site').textContent).chat||{}}catch(e){}
if(!K.faq)return;
var CALM=root.classList.contains('calm');
var TEL='tel:'+(K.phone||'').replace(/[^\d+]/g,'');
var ADMIN='Анна';
var MARK='<svg class="cx-mk" viewBox="0 0 40 40" aria-hidden="true"><path d="M13.6 9.5c-3.4 0-5.3 2.7-5.3 6.5 0 4.6 2.1 6.8 3 10.9.8 3.8 1.5 6.6 3.4 6.6 2.2 0 2-6.6 5.4-6.6s3.2 6.6 5.4 6.6c1.9 0 2.6-2.8 3.4-6.6.9-4.1 3-6.3 3-10.9 0-3.8-1.9-6.5-5.3-6.5-2.7 0-3.9 1.5-6.5 1.5s-3.8-1.5-6.5-1.5z" fill="currentColor"/><path d="M5 26.5C3.2 17 9.5 6.5 21 5.2" fill="none" stroke="var(--onyx)" stroke-width="1.6" stroke-linecap="round"/><path d="M31.5 5.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" fill="var(--onyx)"/></svg>';

/* ── Часы клиники по Томску (UTC+7) ───────────────────────────────── */
function tomskHour(){var n=new Date();return(n.getUTCHours()+7)%24+n.getUTCMinutes()/60}
function isOpen(){if(window.__cxNight)return false;var h=tomskHour();return h>=(K.open||9)&&h<(K.close||21)}

/* ── Ответы консультанта: подбор по словам, только факты клиники ──── */
function norm(s){return String(s||'').toLowerCase().replace(/ё/g,'е').replace(/all\s*on\s*/g,'allon').replace(/[^a-zа-я0-9\s]/g,' ').replace(/\s+/g,' ').trim()}
var F=K.faq;
function fa(i){return F[i]?F[i].a:''}
function priceText(){var p=K.prices||[],g=K.gifts||[];
  var s='Два варианта: '+p.map(function(x){return x.t.toLowerCase()+' за '+rub(x.p)}).join(' и ')+'. ';
  if(p[1])s+='Под ключ: '+p[1].d.replace(/«|»/g,'').toLowerCase()+'. ';
  if(g.length)s+='Сейчас в подарок: '+g.map(function(x){return x.t.toLowerCase()+(x.sale?'':' ('+rub(x.was)+')')}).join(', ')+', выгода до '+rub(K.benefit)+'. ';
  return s+'Есть рассрочка 0% без первого взноса. Точная сумма станет понятна после КТ.'}
function giftText(){var g=K.gifts||[];return'Сейчас в подарок: '+g.map(function(x){return x.t+(x.sale?' до '+rub(x.was):' (обычно '+rub(x.was)+')')}).join('; ')+'. Вместе выгода до '+rub(K.benefit)+'. Подарки закрепляются за вами на консультации.'}
function docText(){return(K.docs||[]).map(function(x){return x.n+': '+x.r.toLowerCase()+', '+x.f.toLowerCase()}).join('. ')+'. Кто будет вести лечение, решают на консультации.'}
function addrText(){return'Мы на '+K.addr.replace(/^Томск,\s*/,'')+', '+K.near.toLowerCase()+'. '+K.parking+'. Работаем '+K.hours+'.'}
function hoursText(){return'Клиника работает '+K.hours+'. '+(isOpen()?'Сейчас открыто, можно позвонить: '+K.phone+'.':'Сейчас закрыто, утром с 9:00 ответим и перезвоним.')}
function guarText(){return'Гарантии записаны в договоре: '+(K.guar||[]).join('; ')+'.'}
var CH0=['Сколько стоит?','Больно ли?','Если мало кости','Записаться'];
/* key, основы слов, ответ, медицинский ли вопрос, подсказки после */
var IN=[
  ['book',['запис','приеха','прийти','приду','хочу на прием','на прием','к врачу'],null,0,null],
  ['price',['сколько стоит','стоим','стоит','цен','прайс','руб','денег','дорог','деньг','сумм','бюджет'],priceText,0,['Рассрочка','Что в подарок?','Записаться']],
  ['gift',['подар','акци','скидк','бесплат','выгод'],giftText,0,['Сколько стоит?','Записаться']],
  ['inst',['рассроч','кредит','частям','по частям','платеж','ежемесяч'],function(){return fa(7)},0,['Налоговый вычет','Записаться']],
  ['tax',['вычет','налог','13'],function(){return fa(8)},0,['Записаться']],
  ['sleep',['сне','сон','седац','наркоз','усып','спать','спите'],function(){return fa(4)},1,['Больно ли?','Записаться']],
  ['pain',['больн','боль','болит','страш','боюсь','бояться','анестез','обезбол','терпе'],function(){return fa(3)},1,['Можно во сне?','Записаться']],
  ['bone',['кост','синус','челюст убы','атрофи'],function(){return fa(5)},1,['Что на консультации?','Записаться']],
  ['contra',['противопоказ','возраст','пожил','диабет','давлен','болезн','сердц','лет мне','мне 6','мне 7','мне 5','беремен'],function(){return fa(6)},1,['Что на консультации?','Записаться']],
  ['day',['один день','за день','за 1 день','сразу','сколько времени','долго','быстро','визит','сроки','срок лечения','когда будут зубы'],function(){return fa(2)},1,['Сколько стоит?','Записаться']],
  ['food',['есть','мясо','яблок','жеват','жеван','орех','еда','кушать','грызть'],function(){return fa(9)},1,['Гарантия','Записаться']],
  ['guar',['гарант','прослуж','срок служб','100 лет','надежн','выпадет','отторж','прижив'],guarText,0,['Как ухаживать?','Записаться']],
  ['care',['уход','ухаж','чист','щетк'],function(){return fa(11)},1,['Гарантия','Записаться']],
  ['consult',['консультац','кт','снимок','томограф','осмотр','первый прием','план лечения','другой клиник'],function(){return fa(12)},1,['Записаться','Где вы находитесь?']],
  ['doc',['врач','хирург','доктор','ортопед','имплантолог','реутов','савин','стаж','кто делает','кто будет'],docText,0,['Записаться','Гарантия']],
  ['addr',['адрес','где вы','где наход','доехать','добрать','парков','белинск','улиц','район','отзыв','такси','машин'],addrText,0,['Часы работы','Записаться']],
  ['hours',['час работ','часы','работает','работаете','график','открыт','выходн','воскрес','суббот','вечер','утр','до скольки','во сколько'],hoursText,0,['Записаться','Где вы находитесь?']],
  ['what',['allon6','allon4','allon 6','allon 4','отлича','что такое','разниц','4 импл','6 импл','шесть','четыре','методик','протез'],function(){return fa(0)},1,['Сколько стоит?','Больно ли?','Записаться']],
  ['human',['человек','администратор','оператор','менеджер','позвон','звонок','телефон','перезвон','живой'],function(){return'Позвоните администратору: '+K.phone+', '+K.hours+'. Или оставьте номер здесь, и вам перезвонят сами.'},0,['Записаться','Позвонить']],
  ['hi',['здравств','привет','добрый','доброе','добрая','хай','салам'],function(){return'Здравствуйте! Спрашивайте про All-on-6, цены, врачей, рассрочку или запись. Отвечу по фактам клиники.'},0,CH0],
  ['thanks',['спасиб','благодар','понятно','ясно','хорошо'],function(){return'Пожалуйста! Если появятся вопросы, пишите. Записать вас на бесплатную консультацию?'},0,['Записаться']]
];
function match(text){var t=' '+norm(text)+' ',ws=t.trim().split(' '),best=null,bs=0;
  IN.forEach(function(it,ix){var sc=0;it[1].forEach(function(st){if(st.indexOf(' ')>=0){if(t.indexOf(' '+st)>=0)sc+=2}else if(ws.some(function(w){return w.indexOf(st)===0&&(st.length>2||w===st)}))sc+=1});
    if(sc>bs){bs=sc;best=it}});
  if(best)return best;
  /* Не нашли по основам: ищем вопрос из списка клиники с теми же словами. */
  var bi=-1,bv=0;F.forEach(function(f,i){var q=norm(f.q).split(' ').filter(function(w){return w.length>3}),v=0;q.forEach(function(w){var s=w.slice(0,5);if(ws.some(function(x){return x.length>3&&x.slice(0,5)===s}))v++});if(v>bv){bv=v;bi=i}});
  if(bi>=0&&bv>=2)return['faq',[],function(){return fa(bi)},1,['Записаться']];
  return null}

/* ── Хранение: какая переписка открыта ────────────────────────────── */
var IDS={};try{IDS=JSON.parse(lsGet('sy-chat-ids'))||{}}catch(e){}
var DEMO={};try{DEMO=JSON.parse(lsGet('sy-chat-demo'))||{}}catch(e){}
var mode=lsGet('sy-chat-mode')==='tg'?'tg':'ai';
function chat(){var id=IDS[mode];return id?SY.chat(id):null}
function ensure(){var c=chat();if(c)return c.id;var id=SY.addChat({mode:mode,name:''});IDS[mode]=id;lsSet('sy-chat-ids',JSON.stringify(IDS));lsSet('sy-chat',id);return id}
function remember(){lsSet('sy-chat-mode',mode);if(IDS[mode])lsSet('sy-chat',IDS[mode])}

/* ── Разметка ──────────────────────────────────────────────────────── */
var fab=el('button','cx-fab');fab.type='button';fab.id='cx-fab';fab.setAttribute('aria-label','Открыть чат с клиникой');fab.setAttribute('aria-expanded','false');root.classList.remove('cx-open');fab.setAttribute('aria-controls','cx');
fab.innerHTML='<span class="cx-fi">'+ic('msg')+'</span><span class="cx-fx">'+ic('x')+'</span><i class="cx-dot" hidden></i>';
var box=el('div','cx');box.id='cx';box.setAttribute('role','dialog');box.setAttribute('aria-labelledby','cx-h');box.hidden=true;
box.innerHTML='<div class="cx-win">'+
  '<div class="cx-hd"><span class="cx-av">'+MARK+'</span><div class="cx-ht"><b id="cx-h">Сияние Севера</b><small id="cx-st"></small></div><button type="button" class="cx-x" aria-label="Закрыть чат">'+ic('x')+'</button></div>'+
  '<div class="cx-sw" role="group" aria-label="Вариант чата"><button type="button" data-m="ai" aria-pressed="false">'+ic('spark')+'<span>ИИ-консультант</span></button><button type="button" data-m="tg" aria-pressed="false">'+ic('tg')+'<span>Менеджер в Telegram</span></button></div>'+
  '<p class="cx-demo">Для показа: два варианта, на сайте останется один</p>'+
  '<div class="cx-tgslot"></div>'+
  '<div class="cx-log" id="cx-log" role="log" aria-live="polite" aria-relevant="additions" tabindex="0" aria-label="Переписка"></div>'+
  '<div class="cx-chips" id="cx-chips"></div>'+
  '<form class="cx-f" id="cx-f" autocomplete="on"><label class="cx-sr" for="cx-in">Сообщение</label><input id="cx-in" name="msg" type="text" enterkeyhint="send" maxlength="500" placeholder="Напишите вопрос"><button type="submit" class="cx-go" aria-label="Отправить">'+ic('arrow')+'</button></form>'+
  '<p class="cx-foot" id="cx-foot"></p>'+
'</div>';
/* Как сообщение видит администратор: мини-Telegram */
var tg=el('aside','cx-tg');tg.setAttribute('aria-label','Так сообщение видит администратор в Telegram');
tg.innerHTML='<button type="button" class="cx-tgt" aria-expanded="false"><span>'+ic('tg')+'Так это видит администратор</span><i class="cx-n" hidden></i><span class="cx-ch" aria-hidden="true"></span></button>'+
  '<div class="cx-ph"><div class="cx-phh"><span class="cx-bav">'+MARK+'</span><span><b>Сияние Севера · заявки</b><small>бот клиники в Telegram</small></span></div><div class="cx-tlog" id="cx-tlog"></div><p class="cx-tnote">Показ: в Telegram администратора. Ответ «'+ADMIN+'» в макете по сценарию (демо).</p></div>';
d.body.appendChild(fab);d.body.appendChild(box);
var win=$('.cx-win',box),log=$('#cx-log'),chips=$('#cx-chips'),form=$('#cx-f'),inp=$('#cx-in'),stEl=$('#cx-st'),foot=$('#cx-foot'),slot=$('.cx-tgslot',box),tlog=$('#cx-tlog',tg),tgt=$('.cx-tgt',tg),tgN=$('.cx-n',tg),dot=$('.cx-dot',fab);
var mqD=matchMedia('(min-width:1024px)');
function placeTg(){if(mqD.matches){if(tg.parentNode!==box)box.insertBefore(tg,win)}else if(tg.parentNode!==slot)slot.appendChild(tg);tgOpen(mqD.matches||tg.classList.contains('open'))}
function tgOpen(on){tg.classList.toggle('open',on);tgt.setAttribute('aria-expanded',String(on));if(on){tgN.hidden=true;tlog.scrollTop=tlog.scrollHeight}}
tgt.onclick=function(){tgOpen(!tg.classList.contains('open'))};
if(mqD.addEventListener)mqD.addEventListener('change',placeTg);else if(mqD.addListener)mqD.addListener(placeTg);

/* ── Кнопка видна, когда кино закончилось ─────────────────────────── */
var dock=$('#dock'),stage=$('#stage');
function fabVis(){var away=(dock&&dock.classList.contains('away'))||(stage&&stage.classList.contains('playing'));fab.classList.toggle('away',!!away&&box.hidden)}
if(window.MutationObserver){var mo=new MutationObserver(fabVis);if(dock)mo.observe(dock,{attributes:true,attributeFilter:['class']});if(stage)mo.observe(stage,{attributes:true,attributeFilter:['class']})}
fabVis();

/* ── Рисуем переписку ─────────────────────────────────────────────── */
var shown={},flow=null,typing=null,pending={};
function who(m){return m.from==='user'?'Вы':m.from==='ai'?'Консультант':(DEMO[m.at]?ADMIN+', администратор':'Администратор')}
function bubble(m,c){var b=el('div','cx-m cx-'+m.from);var meta=el('span','cx-who');meta.textContent=who(m)+' · '+hm(m.at);
  if(m.from==='manager'&&DEMO[m.at])meta.appendChild(el('em','cx-tag','демо'));
  var p=el('p');p.textContent=m.text;b.appendChild(meta);b.appendChild(p);
  if(m.from==='user'&&c.mode==='tg'){var tk=el('span','cx-tick',isOpen()?'ушло администратору в Telegram':'ушло в Telegram, ответим утром');b.appendChild(tk)}
  return b}
function intro(){var c=el('div','cx-m cx-ai cx-intro');var p=el('p');
  if(mode==='ai')p.textContent='Здравствуйте! Я консультант клиники «Сияние Севера». Отвечу про All-on-6, цены, врачей и рассрочку, помогу записаться на бесплатную консультацию.';
  else p.textContent=isOpen()?'Напишите вопрос, сообщение уйдёт администратору клиники в Telegram. Обычно отвечают за 2 минуты (9:00-21:00), ответ придёт сюда же.':'Сейчас клиника закрыта, ответим утром с 9:00. Сообщение всё равно примем: оно уйдёт администратору в Telegram, ответ придёт сюда же.';
  var meta=el('span','cx-who',mode==='ai'?'Консультант':'Клиника');c.appendChild(meta);c.appendChild(p);return c}
function render(full){var c=chat(),msgs=c?c.msgs:[],key=mode+(c?c.id:'');
  if(full||shown.key!==key){log.setAttribute('aria-live','off');log.innerHTML='';log.appendChild(intro());shown={key:key,n:0}}
  for(var i=shown.n;i<msgs.length;i++)log.appendChild(bubble(msgs[i],c));
  var added=msgs.length-shown.n;shown.n=msgs.length;
  if(typing)log.appendChild(typing);
  if(full||added)log.scrollTop=log.scrollHeight;
  if(full)setTimeout(function(){log.setAttribute('aria-live','polite')},50);
  renderTg();
  if(box.hidden&&added>0&&msgs.length&&msgs[msgs.length-1].from!=='user')dot.hidden=false}
function setChips(list){chips.innerHTML='';chips.scrollLeft=0;(list||[]).forEach(function(t){var b;if(t==='Позвонить'){b=el('a','cx-chip');b.href=TEL;b.innerHTML=ic('phone')+'<span>Позвонить</span>'}else{b=el('button','cx-chip',t);b.type='button';b.onclick=function(){send(t)}}chips.appendChild(b)})}
function showTyping(name){hideTyping();typing=el('div','cx-m cx-typing');typing.setAttribute('aria-label',name+' печатает');typing.innerHTML='<span class="cx-who"></span><p><i></i><i></i><i></i></p>';typing.firstChild.textContent=name+' печатает';log.appendChild(typing);log.scrollTop=log.scrollHeight}
function hideTyping(){if(typing&&typing.parentNode)typing.parentNode.removeChild(typing);typing=null}
function status(){var on=isOpen();
  stEl.textContent=mode==='ai'?'ИИ-консультант · отвечает сразу':on?'На связи · ответим за 2 минуты':'Сейчас клиника закрыта, ответим утром с 9:00';
  box.setAttribute('data-mode',mode);box.classList.toggle('cx-night',!on&&mode==='tg');
  Array.prototype.forEach.call(box.querySelectorAll('.cx-sw button'),function(b){b.setAttribute('aria-pressed',String(b.getAttribute('data-m')===mode))});
  foot.textContent=mode==='ai'?'В макете ответы из вопросов клиники. На сайте ответит ИИ по базе знаний клиники, сложные вопросы передаст администратору.':'В макете ответ администратора по сценарию (демо). На сайте сообщение придёт в Telegram-бот клиники, ответ из Telegram появится здесь.';
  inp.placeholder=mode==='ai'?'Напишите вопрос':'Напишите сообщение'}

/* ── Мини-Telegram ─────────────────────────────────────────────────── */
var tShown={key:null,n:0},taken={};
function renderTg(){var c=mode==='tg'?chat():null,msgs=c?c.msgs:[],key=c?c.id:'';
  if(tShown.key!==key){tlog.innerHTML='';tShown={key:key,n:0};if(!msgs.length){var e=el('p','cx-tempty','Здесь появится сообщение посетителя, как его получит администратор.');tlog.appendChild(e)}}
  if(msgs.length&&tShown.n===0)tlog.innerHTML='';
  for(var i=tShown.n;i<msgs.length;i++){var m=msgs[i];
    if(m.from==='user'){var card=el('div','cx-tb');
      card.innerHTML='<p class="cx-tbh">📩 Сообщение с сайта</p><p class="cx-tbt"></p><p class="cx-tbm"></p><span class="cx-tbtime"></span>';
      card.children[1].textContent='«'+m.text+'»';
      card.children[2].textContent='Имя: '+(c.name||'гость сайта')+'\nСтраница: главная, чат\nВремя: '+hm(m.at)+(isOpen()?'':' (ночью)');
      card.children[3].textContent=hm(m.at);
      var kb=el('div','cx-kb');[['Ответить','reply'],['Взять','take'],['Позвонить','call']].forEach(function(b){var x=el('button',null,b[0]);x.type='button';x.setAttribute('data-a',b[1]);kb.appendChild(x)});
      var wrap=el('div','cx-tw');wrap.appendChild(card);wrap.appendChild(kb);tlog.appendChild(wrap);
      if(!tg.classList.contains('open')&&i===msgs.length-1){tgN.hidden=false}}
    else if(m.from==='manager'){var o=el('div','cx-to');var p=el('p');p.textContent=m.text;var t=el('span','cx-tbtime',hm(m.at)+' ✓✓');o.appendChild(p);o.appendChild(t);tlog.appendChild(o)}}
  tShown.n=msgs.length;tlog.scrollTop=tlog.scrollHeight}
tlog.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('button[data-a]');if(!b)return;var a=b.getAttribute('data-a'),kb=b.parentNode;
  if(a==='take'){b.textContent='✓ Взяла '+ADMIN;b.disabled=true}
  else if(a==='reply'){var c=chat();if(c)demoReply(c.id,0)}
  else if(a==='call'){var n=kb.nextSibling&&kb.nextSibling.classList&&kb.nextSibling.classList.contains('cx-tn')?kb.nextSibling:null;if(!n){n=el('p','cx-tn','Позвонить можно, когда посетитель оставит номер: бот подставит его в кнопку.');kb.parentNode.insertBefore(n,kb.nextSibling)}}});

/* ── Ответ администратора по сценарию (демо) ──────────────────────── */
function demoText(c){var u=c.msgs.filter(function(m){return m.from==='user'}),last=u.length?u[u.length-1].text:'',it=match(last),k=it?it[0]:'',first=!c.msgs.some(function(m){return m.from==='manager'});
  var hi=first?'Здравствуйте! Я '+ADMIN+', администратор клиники. ':'';
  if(/^\+?[\d\s()-]{10,}$/.test(last.trim()))return'Спасибо, номер записала. Перезвоню в течение рабочего дня и подберём время консультации.';
  if(k==='price'||k==='gift'||k==='inst')return hi+'All-on-6 стоит '+rub(K.prices[0].p)+', под ключ с несъёмным протезом '+rub(K.prices[1].p)+'. Точную сумму врач назовёт после КТ, сейчас КТ бесплатно. Записать вас на консультацию?';
  if(k==='book'||k==='consult')return hi+'Запишу вас на бесплатную консультацию. Когда удобно прийти: сегодня, завтра или на неделе? И оставьте, пожалуйста, номер телефона.';
  if(!isOpen())return hi+'Увидела ваше сообщение. Клиника сейчас закрыта, утром с 9:00 позвоню и отвечу подробно. Оставьте номер телефона, если удобно.';
  return hi+'Спасибо за вопрос! Точно ответит врач на бесплатной консультации, а я помогу записаться. Оставьте номер телефона, и я перезвоню.'}
function demoReply(id,delay){if(pending[id])return;var c=SY.chat(id);if(!c)return;
  var lastU=0;c.msgs.forEach(function(m){if(m.from==='user')lastU=m.at});var answered=c.msgs.some(function(m){return m.from==='manager'&&m.at>lastU});
  var demos=c.msgs.filter(function(m){return m.from==='manager'&&DEMO[m.at]}).length;
  if(!lastU||answered||demos>=3)return;
  pending[id]=setTimeout(function(){
    if(mode==='tg'&&IDS.tg===id)showTyping(ADMIN);
    pending[id]=setTimeout(function(){pending[id]=0;hideTyping();var c2=SY.chat(id);if(!c2)return;
      var lu=0;c2.msgs.forEach(function(m){if(m.from==='user')lu=m.at});if(c2.msgs.some(function(m){return m.from==='manager'&&m.at>lu}))return;
      var at=Date.now();DEMO[at]=1;lsSet('sy-chat-demo',JSON.stringify(DEMO));
      /* SY.push ставит своё время; помечаем демо по нему же */
      var before=c2.msgs.length;SY.push(id,'manager',demoText(c2));var c3=SY.chat(id),m=c3&&c3.msgs[before];
      if(m&&m.at!==at){delete DEMO[at];DEMO[m.at]=1;lsSet('sy-chat-demo',JSON.stringify(DEMO));render(true)}
    },CALM?300:1400)},delay)}

/* ── Запись внутри чата: имя, телефон, время ──────────────────────── */
var WHEN=['Сегодня','Завтра утром','Завтра вечером','На этой неделе','Перезвоните, договоримся'];
function phoneMode(on){inp.type=on?'tel':'text';inp.setAttribute('inputmode',on?'tel':'text');inp.setAttribute('autocomplete',on?'tel':'off');inp.placeholder=on?'+7 (___) ___-__-__':(mode==='ai'?'Напишите вопрос':'Напишите сообщение');if(on&&!inp.value)inp.value='+7 '}
function digits(s){var x=String(s).replace(/\D/g,'');if(x.length===11&&(x[0]==='7'||x[0]==='8'))x=x.slice(1);else if(x[0]==='7'&&x.length>10)x=x.slice(1);return x.slice(0,10)}
function masked(x){var s='+7';if(x.length)s+=' ('+x.slice(0,3);if(x.length>3)s+=') '+x.slice(3,6);if(x.length>6)s+='-'+x.slice(6,8);if(x.length>8)s+='-'+x.slice(8,10);return s}
inp.addEventListener('input',function(){if(inp.type!=='tel')return;var raw=inp.value;var x=raw.replace(/\D/g,'');if(x[0]==='7'||x[0]==='8')x=x.slice(1);inp.value=masked(x.slice(0,10))});
function warnOnce(id){var c=SY.chat(id);if(!c||!K.warn)return;var w=K.warn+'.';if(c.msgs.some(function(m){return m.text.indexOf(K.warn)>=0}))return;SY.push(id,'ai',w)}
function aiSay(id,text,ch,med,after){if(mode==='ai'){showTyping('Консультант');setChips([])}
  var t=CALM?250:600+Math.round(Math.random()*600);
  setTimeout(function(){var here=mode==='ai'&&IDS.ai===id;if(here)hideTyping();SY.push(id,'ai',text);if(med)warnOnce(id);if(here){setChips(ch);if(after)after();log.scrollTop=log.scrollHeight}},t)}
function startBook(id){flow={step:'name'};aiSay(id,'Запишу на бесплатную консультацию с КТ. Как к вам обращаться?',[])}
function bookStep(id,text){
  if(flow.step==='name'){var n=text.trim().replace(/\s+/g,' ').slice(0,40);flow.name=n.charAt(0).toUpperCase()+n.slice(1);flow.step='phone';
    SY.set(function(s){s.chats.forEach(function(c){if(c.id===id)c.name=flow.name})});
    aiSay(id,flow.name+', оставьте номер телефона: администратор позвонит, чтобы подтвердить время.',[],0,function(){phoneMode(true)});return}
  if(flow.step==='phone'){var x=digits(text);if(x.length<10){aiSay(id,'Кажется, в номере не хватает цифр. Нужно 10 цифр после +7, например +7 (913) 123-45-67.',[],0,function(){phoneMode(true)});return}
    flow.phone=masked(x);flow.step='when';phoneMode(false);aiSay(id,'Когда вам удобно прийти?',WHEN);return}
  if(flow.step==='when'){var w=text.trim().slice(0,60),f=flow;flow=null;setChips([]);
    var lid=SY.addLead({src:'chat',name:f.name,phone:f.phone,what:'Консультация All-on-6 (из чата)',when:w.toLowerCase(),chat:id});
    lsSet('sy-me',lid);try{d.dispatchEvent(new CustomEvent('sy:change'))}catch(e){}
    aiSay(id,'Готово, '+f.name+'! Заявка у администратора: '+f.phone+', '+w.toLowerCase()+'. '+(isOpen()?'Администратор позвонит, чтобы подтвердить время.':'Клиника сейчас закрыта, администратор позвонит утром с 9:00.')+' Статус заявки виден внизу экрана.',['Где вы находитесь?','Что на консультации?'])}}

/* ── Отправка ─────────────────────────────────────────────────────── */
function send(text){text=String(text||'').trim();if(!text)return;var id=ensure();remember();
  if(mode==='tg'&&flow)flow=null;
  SY.push(id,'user',text);inp.value='';
  if(mode==='tg'){setChips([]);if(!mqD.matches&&!tg.classList.contains('open'))tgN.hidden=false;demoReply(id,CALM?600:1800);return}
  if(flow){if(/^(отмена|стоп|не надо|передумал)/i.test(text)){flow=null;phoneMode(false);aiSay(id,'Хорошо, запись отменил. Спрашивайте, если что-то ещё интересно.',CH0);return}bookStep(id,text);return}
  var it=match(text);
  if(!it){aiSay(id,'Точно ответит врач на консультации. Записать вас? Консультация и КТ бесплатно. Или позвоните: '+K.phone+', '+K.hours+'.',['Записаться','Позвонить','Сколько стоит?']);return}
  if(it[0]==='book'){startBook(id);return}
  aiSay(id,it[2](),it[4],it[3])}
form.addEventListener('submit',function(e){e.preventDefault();send(inp.value)});

/* ── Переключатель вариантов ──────────────────────────────────────── */
Array.prototype.forEach.call(box.querySelectorAll('.cx-sw button'),function(b){b.onclick=function(){var m=b.getAttribute('data-m');if(m===mode)return;mode=m;flow=null;phoneMode(false);hideTyping();remember();status();render(true);setChips(mode==='ai'?CH0:['Сколько стоит?','Хочу записаться','Есть вопрос']);
  if(mode==='tg'&&mqD.matches)tgOpen(true)}});

/* ── Открыть и закрыть ────────────────────────────────────────────── */
var back=null,mqP=matchMedia('(max-width:1023px)');
function fit(){if(box.hidden||!mqP.matches||!window.visualViewport){box.style.removeProperty('--cx-vh');box.style.removeProperty('--cx-top');return}
  var v=visualViewport;box.classList.toggle('kb',v.height<innerHeight*.78);box.style.setProperty('--cx-vh',Math.round(v.height)+'px');box.style.setProperty('--cx-top',Math.round(v.offsetTop)+'px');log.scrollTop=log.scrollHeight}
if(window.visualViewport){visualViewport.addEventListener('resize',fit);visualViewport.addEventListener('scroll',fit)}
function open(){if(!box.hidden)return;back=d.activeElement;box.hidden=false;placeTg();status();render(true);
  if(!chips.children.length)setChips(mode==='ai'?CH0:['Сколько стоит?','Хочу записаться','Есть вопрос']);
  box.setAttribute('aria-modal',String(mqP.matches));root.classList.toggle('cx-lock',mqP.matches);fit();
  fab.setAttribute('aria-expanded','true');root.classList.add('cx-open');fab.setAttribute('aria-label','Закрыть чат');fab.classList.add('on');dot.hidden=true;
  requestAnimationFrame(function(){box.classList.add('on');if(!mqP.matches||!('ontouchstart' in window))inp.focus({preventScroll:true});else $('.cx-x',box).focus({preventScroll:true})})}
function close(){if(box.hidden)return;box.classList.remove('on');root.classList.remove('cx-lock');fab.setAttribute('aria-expanded','false');root.classList.remove('cx-open');fab.setAttribute('aria-label','Открыть чат с клиникой');fab.classList.remove('on');inp.blur();
  setTimeout(function(){box.hidden=true;fabVis()},CALM?0:260);try{(back&&back.focus?back:fab).focus({preventScroll:true})}catch(e){}}
fab.onclick=function(){box.hidden?open():close()};
$('.cx-x',box).onclick=close;
box.addEventListener('keydown',function(e){if(e.key==='Escape'){e.stopPropagation();close();return}
  if(e.key!=='Tab')return;var f=Array.prototype.filter.call(box.querySelectorAll('button:not([disabled]),a[href],input,[tabindex="0"]'),function(x){return x.offsetParent!==null});if(!f.length)return;
  var a=f[0],z=f[f.length-1];if(e.shiftKey&&d.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&d.activeElement===z){e.preventDefault();a.focus()}});
box.addEventListener('click',function(e){if(e.target===box&&mqP.matches)close()});

/* ── Живые обновления: ответ из панели клиники, другая вкладка ────── */
d.addEventListener('sy:change',function(){if(IDS[mode]&&!SY.chat(IDS[mode])){delete IDS[mode];lsSet('sy-chat-ids',JSON.stringify(IDS))}
  try{DEMO=JSON.parse(lsGet('sy-chat-demo'))||DEMO}catch(e){}
  var c=chat();if(c&&c.msgs.length<shown.n)render(true);else render(false)});
/* Ответ демо не пришёл (вкладку перезагрузили): пришлём после открытия. */
if(IDS.tg){var ct=SY.chat(IDS.tg);if(ct&&ct.msgs.length&&ct.msgs[ct.msgs.length-1].from==='user')demoReply(IDS.tg,CALM?600:2500)}
status();placeTg();render(true);
window.SYChat={open:open,close:close,mode:function(){return mode}};
})();
