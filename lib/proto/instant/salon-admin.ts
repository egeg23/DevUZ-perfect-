/**
 * Админка салона красоты в «Макете в боте» (владелец, 11.11.2026: «Сделай
 * админку для салона красоты тоже. Объедини в одном окне все мессенджеры,
 * инстаграм директ, статьи и управление сайтом, акциями и тд»).
 *
 * Сама панель — админка нашего сайта «Сияние Севера» как есть
 * (`panel-assets.json`, `syanie`): заявки, «Сообщения» всех каналов одним
 * окном, раздел «Сайт», подключения, команда, история. У неё настоящий
 * сервер; здесь вместо него демо в памяти браузера (`SALON_DEMO_JS`) с теми
 * же ответами, что у сервера. Дописано для салона: раздел «Статьи»
 * (`SALON_EXT_JS`) и «Акции» в «Сайте». Модели нет, в сеть панель не ходит.
 */

/** Демо вместо сервера: те же пути, что у /api/admin, состояние в браузере. */
export const SALON_DEMO_JS = String.raw`window.__sd=function(PD){
var KEY='is-adm',HOUR=36e5,DAY=864e5,WEEK=/*~*/7,S=null;
function now(){return Date.now()}
function seed(){var t=now();
  return{v:PD.v,in:true,seen:t,nid:100,
    users:PD.team.map(function(u,i){return{id:i+1,name:u[0],login:u[1],role:u[2],disabled:false}}),
    leads:PD.leads.map(function(l,i){return{id:i+1,name:l.name,phone:l.phone,what:l.what,wish:l.wish,src:l.src,status:l.status,note:l.note||'',at:t-l.ago*HOUR,conv_id:l.conv||0,amo_id:0,amo_err:''}}),
    convs:PD.convs.map(function(c,i){return{id:i+1,name:c.name,kind:c.kind,phone:c.phone||'',unread:c.unread||0,msgs:c.msgs.map(function(m){return{dir:m[0],text:m[1],at:t-m[2]*HOUR,who:m[0]==='out'?PD.team[1][0]:''}})}}),
    set:{amo:noAmo(),tg:{on:true,bot:PD.bot,staff:[PD.team[0][0]]},wz:{on:true,channels:PD.channels},seo:{metrika:'',yandex:'',google:''},publicUrl:'demo'},
    edits:{},
    posts:PD.posts.map(function(p,i){return{id:i+1,title:p.title,text:p.text,status:p.status,at:t-p.ago*HOUR,ch:p.ch}}),
    log:PD.log.map(function(x){return{at:t-x[0]*HOUR,who:x[1],t:x[2]}})}}
function noAmo(){return{on:false,domain:'',base:'',account:'',pipeline:1,status:11,auto:true,hasToken:false}}
try{S=JSON.parse(localStorage.getItem(KEY)||'null')}catch(_){}
if(!S||S.v!==PD.v)S=seed();
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(_){}}
function me(){return S.users[0]}
function note(t){S.log.unshift({at:now(),who:me().name,t:t});S.log=S.log.slice(0,200)}
function find(a,id){return a.filter(function(x){return x.id===Number(id)})[0]}
function head(c){var l=c.msgs[c.msgs.length-1]||{};return{id:c.id,name:c.name,kind:c.kind,phone:c.phone,unread:c.unread,last_at:l.at||0,last_dir:l.dir||'',last_text:l.text||''}}
/* Запись с сайта макета приходит первой строкой: сайт кладёт её в память браузера. */
function fromSite(){var b=null;try{b=JSON.parse(localStorage.getItem('is-salon-book')||'null')}catch(_){}
  if(!b||!b.at||b.at<=S.seen)return;S.seen=b.at;
  S.leads.unshift({id:++S.nid,name:String(b.n||'').slice(0,60),phone:String(b.p||'').slice(0,30),what:String(b.s||PD.any).slice(0,120),wish:String(b.w||'').slice(0,60),src:'booking',status:'new',note:'',at:b.at,conv_id:0,amo_id:0,amo_err:''})}
function summary(){fromSite();var t=now(),w=Math.round(WEEK)*DAY,src={},kind={};
  function n(a,b){return S.leads.filter(function(l){return l.at>a&&l.at<=b}).length}
  S.leads.forEach(function(l){if(l.at>t-30*DAY)src[l.src]=(src[l.src]||0)+1});
  S.convs.forEach(function(c){kind[c.kind]=(kind[c.kind]||0)+1});
  return{week:n(t-w,t),prev:n(t-2*w,t-w),fresh:S.leads.filter(function(l){return l.status==='new'}).length,
    came:S.leads.filter(function(l){return l.status==='came'}).length,
    waiting:S.convs.filter(function(c){return head(c).last_dir==='in'}).length,amoUnsent:0,
    bySrc:Object.keys(src).map(function(k){return{src:k,n:src[k]}}),byKind:Object.keys(kind).map(function(k){return{kind:k,n:kind[k]}}),settings:S.set}}
function siteView(){return{groups:PD.groups,texts:PD.texts,defaults:PD.defaults,edits:S.edits,seo:S.set.seo}}
function posts(){return S.posts.slice().sort(function(a,b){return b.at-a.at})}
function run(path,body){var p=path.split('/').slice(1),a=p[0],id=p[1],act=p[2];
  if(a==='state')return{setup:false,user:S.in?me():null};
  if(a==='login'){S.in=true;return{ok:true}}
  if(a==='logout'){S.in=false;return{ok:true}}
  if(a==='summary')return summary();
  if(a==='settings')return S.set;
  if(a==='log')return{log:S.log};
  if(a==='me')return{ok:true};
  if(a==='leads'){fromSite();
    if(!id)return{leads:S.leads.slice().sort(function(x,y){return y.at-x.at}),roles:PD.roles};
    var l=find(S.leads,id);if(!l)throw new Error('Заявка не найдена');
    if(act==='amo'){l.amo_id=70000+l.id;note('Отправил заявку №'+l.id+' в amoCRM');return{ok:true}}
    if(body){if(body.status&&body.status!==l.status&&PD.st[body.status]){l.status=body.status;note('Заявка №'+l.id+': '+PD.st[l.status])}
      if(body.note!==undefined){l.note=String(body.note).slice(0,1000);note('Заметка к заявке №'+l.id)}}
    return l}
  if(a==='inbox'){
    if(!id)return{convs:S.convs.map(head).sort(function(x,y){return y.last_at-x.last_at})};
    var c=find(S.convs,id);if(!c)throw new Error('Диалог не найден');
    if(act==='lead'){var nl={id:++S.nid,name:c.name,phone:c.phone,what:PD.any,wish:'',src:c.kind==='site'?'chat':c.kind==='tg'?'tg':'wz',status:'new',note:'',at:now(),conv_id:c.id,amo_id:0,amo_err:''};
      S.leads.unshift(nl);note('Завёл заявку №'+nl.id+' из переписки');return{lead:nl.id}}
    if(body&&body.text){c.msgs.push({dir:'out',text:String(body.text).slice(0,4000),at:now(),who:me().name});
      /* Демо-ответ собеседника, один раз на диалог: видно, что переписка живая. */
      if(!c.re){c.re=1;setTimeout(function(){c.msgs.push({dir:'in',text:PD.thanks,at:now(),who:''});c.unread=1;save()},5000)}}
    c.unread=0;return{id:c.id,name:c.name,kind:c.kind,phone:c.phone,msgs:c.msgs}}
  if(a==='connect'){
    if(act==='off'){if(id==='amo')S.set.amo=noAmo();if(id==='tg')S.set.tg={on:false,bot:'',staff:[]};if(id==='wz')S.set.wz={on:false,channels:[]};note('Отключил: '+PD.conn[id]);return S.set}
    if(id==='amo'){var dm=String(body.domain||'').toLowerCase().replace(/^https?:\/\//,'').replace(/\.amocrm\.ru.*$/,'').replace(/[^a-z0-9-]/g,'');
      if(!dm)throw new Error('Поддомен amoCRM: например, salon или salon.amocrm.ru');
      S.set.amo={on:true,domain:dm,base:'https://'+dm+'.amocrm.ru',account:dm,pipeline:1,status:11,auto:true,hasToken:true}}
    if(id==='tg')S.set.tg={on:true,bot:PD.bot,staff:[me().name]};
    if(id==='wz')S.set.wz={on:true,channels:PD.channels};
    note('Подключил: '+PD.conn[id]);return S.set}
  if(a==='seo'){S.set.seo={metrika:String(body.metrika||'').replace(/\D/g,'').slice(0,12),yandex:String(body.yandex||'').slice(0,80),google:String(body.google||'').slice(0,80)};note('Изменил счётчик и коды поиска');return{seo:S.set.seo}}
  if(a==='tg')throw new Error('В макете бот не подключён. На рабочем сайте здесь откроется Telegram.');
  if(a==='amo'){if(id==='pipelines')return{pipelines:PD.pipes};S.set.amo.pipeline=body.pipeline;S.set.amo.status=body.status;S.set.amo.auto=!!body.auto;return S.set}
  if(a==='users'){
    if(!id&&!body)return{users:S.users,roles:PD.roles};
    if(!id){if(!String(body.name||'').trim()||!String(body.login||'').trim())throw new Error('Заполните имя и логин');
      S.users.push({id:++S.nid,name:String(body.name).slice(0,60),login:String(body.login).slice(0,40),role:body.role==='owner'?'owner':'admin',disabled:false});note('Добавил сотрудника: '+body.name);return{users:S.users}}
    var u=find(S.users,id);if(u&&act==='off'){u.disabled=true;note('Отключил сотрудника: '+u.name)}
    return{users:S.users}}
  if(a==='site'){
    if(!id)return siteView();
    var g=PD.groups.filter(function(x){return x.key===id})[0];if(!g)throw new Error('Такого раздела нет');
    if(act==='reset'){delete S.edits[id];note('Вернул как было: «'+g.title+'»');return siteView()}
    S.edits[id]=body.value;note('Изменил на сайте: «'+g.title+'»');return siteView()}
  if(a==='upload'){if(String(body.data||'').length>400000)throw new Error('В макете фото до 300 КБ');return{url:body.data}}
  if(a==='posts'){
    if(!id&&!body)return{posts:posts()};
    if(!id){var np={id:++S.nid,title:String(body.title||'').slice(0,120),text:'',status:'draft',at:now(),ch:{site:true,tg:true,ig:false}};S.posts.push(np);note('Начал статью');return{posts:posts(),id:np.id}}
    var po=find(S.posts,id);if(!po)throw new Error('Статья не найдена');
    if(act==='del'){S.posts=S.posts.filter(function(x){return x!==po});note('Удалил статью: «'+po.title+'»');return{posts:posts()}}
    if(body.title!==undefined){if(!String(body.title).trim())throw new Error('У статьи нет заголовка');
      po.title=String(body.title).trim().slice(0,120);po.text=String(body.text||'').slice(0,6000);if(body.ch)po.ch={site:!!body.ch.site,tg:!!body.ch.tg,ig:!!body.ch.ig}}
    if(body.status&&body.status!==po.status){
      if(body.status==='published'&&po.text.trim().length<40)throw new Error('Текст слишком короткий для публикации');
      po.status=body.status==='published'?'published':'draft';po.at=now();note((po.status==='published'?'Опубликовал статью: «':'Снял с публикации: «')+po.title+'»')}
    return{posts:posts()}}
  throw new Error('В макете это действие выключено')}
return function(path,body){try{var r=run(path,body);save();return Promise.resolve(JSON.parse(JSON.stringify(r)))}catch(e){return Promise.reject(e)}}};`;

/** Раздел «Статьи»: пишется здесь, в панель встаёт через её же функции. */
export const SALON_EXT_JS = String.raw`window.__sx=function(K){var api=K.api,h=K.h,$=K.$,$$=K.$$,POSTS=[],CUR=0,OPEN=false;
var CH=[['site','Сайт'],['tg','Telegram-канал'],['ig','Instagram']];
K.VIEWS.stati=function(v){
  v.innerHTML=K.pg('Статьи','Пишете один раз: статья выходит на сайте, анонс уходит в Telegram-канал и Instagram.','<button type="button" class="btn sm" id="p-new">Новая статья</button>')+'<div class="split" id="pz"><div class="list"><div class="items" id="pl"><p class="empty">Загружаем…</p></div></div><div class="det-w" id="pe"></div></div>';
  $('#p-new').onclick=function(){api('/posts',{title:'Новая статья'}).then(function(r){POSTS=r.posts;CUR=r.id;OPEN=true;draw()})};
  api('/posts').then(function(r){POSTS=r.posts;if(!POSTS.some(function(p){return p.id===CUR}))CUR=POSTS[0]?POSTS[0].id:0;draw()})};
function draw(){var z=$('#pz');if(!z)return;z.classList.toggle('open',OPEN);
  $('#pl').innerHTML=POSTS.length?POSTS.map(function(p){return'<a class="it" href="#stati" data-p="'+p.id+'"'+(p.id===CUR?' aria-current="true"':'')+'><span class="t"><span>'+h(p.title)+'</span><small>'+K.when(p.at)+'</small></span><span class="m"><span class="st st-'+(p.status==='published'?'came':'new')+'">'+(p.status==='published'?'Опубликована':'Черновик')+'</span>'+CH.filter(function(c){return p.ch[c[0]]}).map(function(c){return'<span class="chip">'+c[1]+'</span>'}).join('')+'</span></a>'}).join(''):'<p class="empty">Статей пока нет.</p>';
  $$('[data-p]',z).forEach(function(a){a.onclick=function(e){e.preventDefault();CUR=Number(a.getAttribute('data-p'));OPEN=true;draw()}});
  var p=POSTS.filter(function(x){return x.id===CUR})[0],box=$('#pe');
  if(!p){box.innerHTML='<div class="cd"><p class="empty">Выберите статью слева</p></div>';return}
  box.innerHTML='<div class="cd det"><a class="btn ghost sm back" href="#stati" id="p-back">'+K.ic('back')+'К статьям</a>'+
    '<label class="f">Заголовок<input id="p-t" maxlength="120" value="'+h(p.title)+'"></label>'+
    '<label class="f">Текст<textarea id="p-x" rows="12" maxlength="6000">'+h(p.text)+'</textarea></label>'+
    '<div class="f"><span>Куда выходит</span><div class="row">'+CH.map(function(c){return'<label class="f fb"><input type="checkbox" data-c="'+c[0]+'"'+(p.ch[c[0]]?' checked':'')+'> '+c[1]+'</label>'}).join('')+'</div></div>'+
    '<p class="hint">Telegram-канал и Instagram подключаются в «Подключениях». В макете статья остаётся в админке.</p><p class="err" id="p-err"></p>'+
    '<div class="row"><button type="button" class="btn" id="p-save">Сохранить</button><button type="button" class="btn ghost" id="p-pub">'+(p.status==='published'?'Снять с публикации':'Опубликовать')+'</button><button type="button" class="btn danger" id="p-del">Удалить</button></div></div>';
  function val(){var ch={};$$('[data-c]',box).forEach(function(i){ch[i.getAttribute('data-c')]=i.checked});return{title:$('#p-t').value,text:$('#p-x').value,ch:ch}}
  function send(body,ok){$('#p-err').textContent='';api('/posts/'+p.id,body).then(function(r){POSTS=r.posts;draw();K.toast(ok)},function(e){var er=$('#p-err');if(er)er.textContent=e.message})}
  $('#p-back').onclick=function(e){e.preventDefault();OPEN=false;draw()};
  $('#p-save').onclick=function(){send(val(),'Сохранено')};
  $('#p-pub').onclick=function(){var v=val();v.status=p.status==='published'?'draft':'published';send(v,v.status==='published'?'Опубликовано':'Снято с публикации')};
  $('#p-del').onclick=function(){if(!confirm('Удалить статью?'))return;api('/posts/'+p.id+'/del',{}).then(function(r){POSTS=r.posts;CUR=POSTS[0]?POSTS[0].id:0;OPEN=false;draw()})}}};`;
