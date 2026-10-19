(function(){
'use strict';
/* Панель сайта SIA: проекты, разделы сайта, новости, коллектив, медиатека,
   заявки, пользователи и роли, журнал, настройки. Работает в браузере:
   состояние в localStorage (sia-panel-1), загруженные фото в IndexedDB
   (sia-media). Главная макета читает то же состояние: новости, проекты,
   коллектив, контакты, заголовки, фото и порядок блоков меняются там сразу. */
var d=document,G=JSON.parse(d.getElementById('sp-data').textContent),KEY='sia-panel-1',IMGS='image/'+'*';
var $=function(s,r){return (r||d).querySelector(s)},$$=function(s,r){return [].slice.call((r||d).querySelectorAll(s))};
if(/[?&]embed=1/.test(location.search))d.documentElement.classList.add('embed');
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function ic(k){return '<svg class="ic" aria-hidden="true"><use href="#i-'+k+'"/></svg>'}
function uid(p){return (p||'x')+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function pad(n){return (n<10?'0':'')+n}
function when(ts){var x=new Date(ts),n=new Date();var same=x.toDateString()===n.toDateString();return (same?'сегодня':pad(x.getDate())+'.'+pad(x.getMonth()+1)+'.'+x.getFullYear())+' '+pad(x.getHours())+':'+pad(x.getMinutes())}
function plural(n,a,b,c){var m=n%10,k=n%100;return n+' '+(m===1&&k!==11?a:m>=2&&m<=4&&(k<12||k>14)?b:c)}

/* ── Разделы панели и права ─────────────────────────────────────────── */
var AREAS=[['dash','Сводка','home'],['proj','Проекты','grid'],['sec','Разделы сайта','layers'],['news','Новости и выставки','news'],['team','Коллектив','team'],['media','Медиатека','photo'],['leads','Заявки','inbox'],['users','Пользователи и роли','key'],['log','Журнал','clock'],['set','Настройки','gear']];
var LV=['Нет доступа','Просмотр','Правка'];
function baseRoles(){var all=function(v){var o={};AREAS.forEach(function(a){o[a[0]]=v});return o};
  var ed=all(0);ed.dash=1;ed.proj=2;ed.sec=2;ed.news=2;ed.team=2;ed.media=2;ed.log=1;
  var md=all(0);md.dash=1;md.proj=1;md.sec=1;md.news=1;md.team=1;md.media=2;
  var sl=all(0);sl.dash=1;sl.leads=2;sl.proj=1;
  var ad=all(2);ad.log=1;
  return {owner:{n:'Владелец',p:all(2),lock:1},admin:{n:'Администратор',p:ad},editor:{n:'Редактор',p:ed},media:{n:'Медиа',p:md},sales:{n:'Менеджер заявок',p:sl}}}

/* ── Состояние ───────────────────────────────────────────────────────── */
function fresh(){var now=Date.now(),H=36e5;
  return {v:1,me:'u1',
    users:[{id:'u1',n:'Вы',mail:G.contacts.mail,role:'owner',on:1,last:now},
      {id:'u2',n:'Мария Петровская',mail:'',role:'editor',on:1,last:now-5*H},
      {id:'u3',n:'Наталья Миронова',mail:'',role:'editor',on:1,last:now-26*H},
      {id:'u4',n:'Игорь Слухов',mail:'',role:'media',on:1,last:now-50*H}],
    roles:baseRoles(),proj:{},newProj:[],sec:{},order:G.sections.map(function(s){return s.id}),
    news:G.events.map(function(e,i){return {id:'e'+i,kind:'Выставка',title:e.n,date:e.d,place:e.w,text:e.t,photo:'',on:1}}),
    team:G.team.map(function(m,i){return {id:'t'+i,n:m.n,r:m.r,photo:m.photo}}),
    media:[],set:JSON.parse(JSON.stringify(G.contacts)),
    leads:[['WhatsApp','Загородный дом, участок около 30 соток, нужен эскизный проект',3],['Telegram','Дизайн-проект квартиры 140 м², ищем бюро',20],['Звонок','Согласование реконструкции особняка',30],['WhatsApp','3D-визуализация фасада для презентации инвестору',52],['Почта','Авторский надзор за стройкой в Подмосковье',75],['WhatsApp','Интерьер офиса 400 м²',120]].map(function(l,i){return {id:'l'+i,src:l[0],text:l[1],ts:now-l[2]*H,st:i<2?'new':i<4?'work':'deal',who:i%2?'u2':''}}),
    log:[{ts:now-5*H,who:'u2',a:'изменён проект APx182.1208'},{ts:now-26*H,who:'u3',a:'опубликована новость «АрхМосква»'},{ts:now-50*H,who:'u4',a:'загрузка: 3 фото в раздел «Интерьеры»'}]}}
var S;try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){}
if(!S||S.v!==1)S=fresh();
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){toast('Браузер не дал сохранить: место закончилось')}}
function me(){return S.users.filter(function(u){return u.id===S.me})[0]||S.users[0]}
function lvl(area){var r=S.roles[me().role];return r?(r.p[area]||0):0}
function can(area,need){return lvl(area)>=(need||1)}
function uname(id){var u=S.users.filter(function(x){return x.id===id})[0];return u?u.n:'Система'}
function log(a){S.log.unshift({ts:Date.now(),who:S.me,a:a});S.log=S.log.slice(0,300);save()}

/* ── Фото: сжимаем в браузере до 2000 px и кладём в IndexedDB ─────────── */
var dbp=null;
function db(){if(dbp)return dbp;dbp=new Promise(function(ok,no){if(!window.indexedDB)return no();var r=indexedDB.open('sia-media',1);r.onupgradeneeded=function(){r.result.createObjectStore('f')};r.onsuccess=function(){ok(r.result)};r.onerror=no});return dbp}
function put(id,blob){return db().then(function(x){return new Promise(function(ok,no){var t=x.transaction('f','readwrite');t.objectStore('f').put(blob,id);t.oncomplete=ok;t.onerror=no})})}
function get(id){return db().then(function(x){return new Promise(function(ok){var q=x.transaction('f').objectStore('f').get(id);q.onsuccess=function(){ok(q.result)};q.onerror=function(){ok(null)}})})}
function del(id){return db().then(function(x){x.transaction('f','readwrite').objectStore('f').delete(id)}).catch(function(){})}
var URLS={};
function src(ref){if(!ref)return '';if(ref.indexOf('m:')!==0)return ref;return URLS[ref]||''}
function hydrate(root){$$('img[data-m]',root||d).forEach(function(im){var ref=im.getAttribute('data-m');if(URLS[ref]){im.src=URLS[ref];return}get(ref).then(function(b){if(b){URLS[ref]=URL.createObjectURL(b);im.src=URLS[ref]}})})}
function pic(ref,cls,alt){return ref&&ref.indexOf('m:')===0?'<img class="'+(cls||'')+'" data-m="'+h(ref)+'" alt="'+h(alt||'')+'">':'<img class="'+(cls||'')+'" src="'+h(ref||'')+'" alt="'+h(alt||'')+'" loading="lazy" decoding="async">'}
function shrink(file){var MAX=2000;
  var load=window.createImageBitmap?createImageBitmap(file):new Promise(function(ok,no){var im=new Image();im.onload=function(){ok(im)};im.onerror=no;im.src=URL.createObjectURL(file)});
  return load.then(function(b){var k=Math.min(1,MAX/Math.max(b.width,b.height)),w=Math.round(b.width*k),hh=Math.round(b.height*k),c=d.createElement('canvas');c.width=w;c.height=hh;c.getContext('2d').drawImage(b,0,0,w,hh);if(b.close)b.close();
    return new Promise(function(ok){c.toBlob(function(bl){ok({blob:bl,w:w,h:hh})},'image/webp',.86)})})}
function upload(files,sec){var arr=[].slice.call(files||[]).filter(function(f){return /^image\//.test(f.type)});if(!arr.length)return Promise.resolve([]);
  toast('Загружаем '+plural(arr.length,'фото','фото','фото')+'…');
  return Promise.all(arr.map(function(f){return shrink(f).then(function(r){var id='m:'+uid('');return put(id,r.blob).then(function(){URLS[id]=URL.createObjectURL(r.blob);S.media.unshift({id:id,name:f.name,sec:sec||'',alt:'',w:r.w,h:r.h,size:r.blob.size,ts:Date.now()});return id})})}))
    .then(function(ids){log('загрузка: '+plural(ids.length,'фото','фото','фото')+(sec?' в раздел «'+secName(sec)+'»':''));toast('Фото загружены: '+ids.length);return ids})
    .catch(function(){toast('Не удалось загрузить фото');return []})}
function secName(id){var s=G.sections.filter(function(x){return x.id===id})[0];return s?s.n:id==='proj'?'Проекты':id==='news'?'Новости':id==='team'?'Коллектив':id}

/* ── Каркас ──────────────────────────────────────────────────────────── */
var view='dash',app=$('#app');
function shell(){
  var nav=AREAS.filter(function(a){return can(a[0])}).map(function(a){var badge=a[0]==='leads'?S.leads.filter(function(l){return l.st==='new'}).length:0;return '<button type="button" data-go="'+a[0]+'"'+(view===a[0]?' aria-current="page"':'')+'>'+ic(a[2])+'<span>'+a[1]+'</span>'+(badge?'<span class="badge">'+badge+'</span>':'')+'</button>'}).join('');
  var u=me(),opts=S.users.filter(function(x){return x.on}).map(function(x){return '<option value="'+x.id+'"'+(x.id===u.id?' selected':'')+'>'+h(x.n)+' · '+h((S.roles[x.role]||{}).n||'')+'</option>'}).join('');
  app.innerHTML='<aside class="side" id="side"><div class="side-logo"><img src="'+G.img+'/logo-k.png" alt="SIA" width="400" height="178"><small>Панель сайта</small></div><nav class="nav" aria-label="Разделы панели">'+nav+'</nav><div class="side-foot"><a href="'+G.home+'" target="_top">'+ic('out')+' Открыть сайт</a><p>Макет DevUz Studio, данные демо</p></div></aside><div class="veil" id="veil"></div>'+
    '<div class="main"><header class="top"><button type="button" class="burger" id="burger" aria-label="Разделы">'+ic('menu')+'</button><h1>'+h(title())+'</h1><span class="sp"></span><div class="as"><label for="as">Вы смотрите как</label><select id="as" aria-label="Смотреть панель как пользователь">'+opts+'</select></div></header><div class="view" id="view"></div><p class="demo">Макет панели от DevUz Studio: всё, что вы меняете, хранится в этом браузере и сразу видно на <a href="'+G.home+'" target="_top">главной макета</a>. <a href="'+G.terms+'" target="_blank" rel="noopener">Условия макета</a></p></div>';
  $('#burger').onclick=function(){$('#side').classList.add('on');$('#veil').classList.add('on')};
  $('#veil').onclick=closeSide;
  $$('[data-go]').forEach(function(b){b.onclick=function(){go(b.getAttribute('data-go'))}});
  $('#as').onchange=function(e){S.me=e.target.value;save();if(!can(view))view='dash';render();toast('Панель глазами: '+me().n)};
  draw()}
function closeSide(){var s=$('#side'),v=$('#veil');if(s)s.classList.remove('on');if(v)v.classList.remove('on')}
function title(){var a=AREAS.filter(function(x){return x[0]===view})[0];return a?a[1]:''}
function go(v){view=v;try{history.replaceState(null,'','#'+v)}catch(e){}render();window.scrollTo(0,0)}
function render(){shell()}
function draw(){var el=$('#view');if(!can(view)){el.innerHTML='<div class="lock">'+ic('key')+'<p>У роли «'+h(S.roles[me().role].n)+'» нет доступа к этому разделу.</p></div>';return}
  el.innerHTML=VIEWS[view]();(BIND[view]||function(){})(el);hydrate(el)}
var ro=function(a){return !can(a,2)};

/* ── Тост и шторка ───────────────────────────────────────────────────── */
var tT=0;function toast(m){var t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(tT);tT=setTimeout(function(){t.classList.remove('on')},2400)}
var dr=$('#drawer');
function drawer(o){dr.innerHTML='<div class="dr-h"><h2>'+h(o.title)+'</h2><button type="button" class="x" data-x aria-label="Закрыть">'+ic('x')+'</button></div><form class="dr-b" id="dr-form">'+o.body+'</form><div class="dr-f">'+(o.remove?'<button type="button" class="btn d" data-rm>'+ic('trash')+'Удалить</button>':'')+'<span class="sp"></span><button type="button" class="btn o" data-x>Отмена</button>'+(o.save!==false?'<button type="button" class="btn" data-ok>'+(o.okText||'Сохранить')+'</button>':'')+'</div>';
  dr.classList.add('on');dr.setAttribute('aria-hidden','false');var f=$('#dr-form');hydrate(dr);if(o.bind)o.bind(f);
  $$('[data-x]',dr).forEach(function(b){b.onclick=closeDr});
  var ok=$('[data-ok]',dr);if(ok)ok.onclick=function(){if(o.ok(f)!==false){closeDr();render()}};
  var rm=$('[data-rm]',dr);if(rm)rm.onclick=function(){if(confirm('Удалить без возврата?')){o.remove();closeDr();render()}};
  setTimeout(function(){var i=$('input,textarea,select',f);if(i)i.focus()},60)}
function closeDr(){dr.classList.remove('on');dr.setAttribute('aria-hidden','true')}
d.addEventListener('keydown',function(e){if(e.key==='Escape'){closeDr();closeSide()}});
function fld(lbl,name,val,o){o=o||{};var tag=o.area?'<textarea name="'+name+'"'+(o.ro?' readonly':'')+'>'+h(val)+'</textarea>':o.opts?'<select name="'+name+'"'+(o.ro?' disabled':'')+'>'+o.opts.map(function(x){return '<option value="'+h(x[0])+'"'+(String(x[0])===String(val)?' selected':'')+'>'+h(x[1])+'</option>'}).join('')+'</select>':'<input name="'+name+'" value="'+h(val)+'"'+(o.type?' type="'+o.type+'"':'')+(o.ro?' readonly':'')+(o.ph?' placeholder="'+h(o.ph)+'"':'')+'>';
  return '<label class="fld"><span>'+lbl+'</span>'+tag+(o.hint?'<small>'+o.hint+'</small>':'')+'</label>'}
function val(f,n){var e=f.elements[n];return e?(e.type==='checkbox'?e.checked:e.value.trim()):''}

/* Сетка фото с загрузкой, обложкой, порядком и удалением. Меняет массив. */
function photos(arr,sec,lock,opt){opt=opt||{};
  var tiles=arr.map(function(ref,i){return '<figure>'+pic(ref,'','')+(lock?'':'<span class="ctl">'+(i?'<button type="button" data-l="'+i+'" aria-label="Левее">'+ic('left')+'</button>':'')+(i<arr.length-1?'<button type="button" data-r="'+i+'" aria-label="Правее">'+ic('right')+'</button>':'')+'<button type="button" data-del="'+i+'" aria-label="Убрать">'+ic('x')+'</button></span>')+'</figure>'}).join('');
  return '<div class="ph'+(opt.nc?' nc':'')+'" data-ph>'+tiles+(lock?'':'<label class="drop" data-drop>'+ic('plus')+'<span>Загрузить фото<br>или перетащить сюда</span><input class="sr" type="file" accept="'+IMGS+'" multiple></label>')+'</div>'}
function bindPhotos(f,arr,sec,opt){var box=$('[data-ph]',f);if(!box)return;
  function redraw(){box.outerHTML=photos(arr,sec,false,opt);bindPhotos(f,arr,sec,opt);hydrate(f)}
  $$('[data-l]',box).forEach(function(b){b.onclick=function(){var i=+b.getAttribute('data-l');arr.splice(i-1,0,arr.splice(i,1)[0]);redraw()}});
  $$('[data-r]',box).forEach(function(b){b.onclick=function(){var i=+b.getAttribute('data-r');arr.splice(i+1,0,arr.splice(i,1)[0]);redraw()}});
  $$('[data-del]',box).forEach(function(b){b.onclick=function(){arr.splice(+b.getAttribute('data-del'),1);redraw()}});
  var drop=$('[data-drop]',box),inp=$('input',drop);
  inp.onchange=function(){upload(inp.files,sec).then(function(ids){if(opt&&opt.one)arr.splice(0,arr.length);[].push.apply(arr,ids);save();redraw()})};
  ['dragenter','dragover'].forEach(function(t){drop.addEventListener(t,function(e){e.preventDefault();drop.classList.add('on')})});
  ['dragleave','drop'].forEach(function(t){drop.addEventListener(t,function(e){e.preventDefault();drop.classList.remove('on')})});
  drop.addEventListener('drop',function(e){upload(e.dataTransfer.files,sec).then(function(ids){if(opt&&opt.one)arr.splice(0,arr.length);[].push.apply(arr,ids);save();redraw()})})}

/* ── Проекты ─────────────────────────────────────────────────────────── */
function projects(){var base=G.projects.map(function(p){var o=S.proj[p.code]||{};return {code:p.code,slug:p.slug,cat:o.cat||p.cat,title:o.title!=null?o.title:p.title,sub:o.sub!=null?o.sub:p.sub,kinds:o.kinds!=null?o.kinds:p.kinds.join(', '),area:o.area!=null?o.area:p.area,term:o.term!=null?o.term:p.term,year:o.year||p.date.slice(0,4),text:o.text!=null?o.text:p.text,photos:o.photos||p.photos.slice(),st:o.st||'pub',home:o.home!=null?o.home:p.feat,feat:p.feat,mine:0}});
  return S.newProj.concat([]).map(function(p){return Object.assign({mine:1},p)}).concat(base)}
var pf={q:'',c:'all'};
var VIEWS={},BIND={};
VIEWS.proj=function(){var list=projects(),q=pf.q.toLowerCase(),c=pf.c;
  var rows=list.filter(function(p){return (c==='all'||(c==='draft'?p.st==='draft':p.cat===c))&&(!q||(p.code+' '+p.title+' '+p.kinds).toLowerCase().indexOf(q)>=0)});
  var n=function(k){return list.filter(function(p){return k==='all'||(k==='draft'?p.st==='draft':p.cat===k)}).length};
  return '<div class="row"><div><p class="h2">'+plural(list.length,'проект','проекта','проектов')+'</p><p class="lead">Проекты стоят в архиве на главной: название, тип, площадь и год меняются там сразу. Черновик на сайте не виден.</p></div><span class="sp"></span>'+(ro('proj')?'':'<button type="button" class="btn" data-new>'+ic('plus')+'Новый проект</button>')+'</div>'+
  '<div class="row"><input class="search" type="search" placeholder="Код, название, тип" value="'+h(pf.q)+'" data-q aria-label="Поиск проекта"><div class="chips" role="group" aria-label="Фильтр">'+[['all','Все'],['arh','Архитектура'],['int','Интерьеры'],['draft','Черновики']].map(function(x){return '<button type="button" data-c="'+x[0]+'" aria-pressed="'+(c===x[0])+'">'+x[1]+' <span class="cap">'+n(x[0])+'</span></button>'}).join('')+'</div></div>'+
  '<div class="list">'+(rows.length?rows.map(function(p){return '<button type="button" class="li" data-p="'+h(p.code)+'">'+pic(p.photos[0],'th','')+'<p class="t"><span class="code">'+h(p.code)+'</span> · '+h(p.title)+'</p><p class="m">'+h(p.kinds||'')+(p.area?' · '+h(p.area)+' м²':'')+' · '+h(p.year)+'</p><span class="a">'+(p.st==='draft'?'<span class="pill warn">черновик</span>':'<span class="pill ok">на сайте</span>')+'</span></button>'}).join(''):'<p class="empty">Ничего не нашлось</p>')+'</div>'};
BIND.proj=function(el){var q=$('[data-q]',el);q.oninput=function(){pf.q=q.value;var pos=q.selectionStart;draw();var n=$('[data-q]');n.focus();n.setSelectionRange(pos,pos)};
  $$('[data-c]',el).forEach(function(b){b.onclick=function(){pf.c=b.getAttribute('data-c');draw()}});
  $$('[data-p]',el).forEach(function(b){b.onclick=function(){editProj(b.getAttribute('data-p'))}});
  var nb=$('[data-new]',el);if(nb)nb.onclick=function(){editProj(null)}};
function editProj(code){var lock=ro('proj'),p=code?projects().filter(function(x){return x.code===code})[0]:{code:'',cat:'arh',title:'',sub:'',kinds:'',area:'',term:'',year:String(new Date().getFullYear()),text:'',photos:[],st:'draft',home:false,mine:1};
  var ph=p.photos.slice();
  drawer({title:code?p.code:'Новый проект',save:!lock,
    body:'<div class="two">'+fld('Код проекта','code',p.code,{ro:!!code||lock,ph:'APx190.2610',hint:code?'Код задаёт адрес страницы и не меняется':'Как в архиве бюро: APx для архитектуры, ИНт для интерьеров'})+fld('Направление','cat',p.cat,{opts:[['arh','Архитектура'],['int','Интерьер']],ro:lock})+'</div>'+
      fld('Название','title',p.title,{ro:lock})+fld('Короткое описание','sub',p.sub,{ro:lock,hint:'Строка под названием в галереях и архиве'})+
      '<div class="two">'+fld('Тип объекта','kinds',p.kinds,{ro:lock,ph:'Загородный дом'})+fld('Площадь, м²','area',p.area,{ro:lock,ph:'2 600'})+fld('Срок, мес.','term',p.term,{ro:lock,type:'number'})+fld('Год','year',p.year,{ro:lock,type:'number'})+'</div>'+
      fld('Описание проекта','text',p.text,{area:1,ro:lock})+
      '<div class="fld"><span>Фото проекта</span>'+photos(ph,'proj',lock)+'<small>Первое фото становится обложкой. Большие снимки браузер сам сжимает до 2000 px.</small></div>'+
      '<label class="chk"><input type="checkbox" name="pub"'+(p.st!=='draft'?' checked':'')+(lock?' disabled':'')+'> Показывать в архиве на сайте</label>',
    bind:function(f){if(!lock)bindPhotos(f,ph,'proj')},
    remove:code&&p.mine&&!lock?function(){S.newProj=S.newProj.filter(function(x){return x.code!==code});log('удалён проект '+code);save()}:null,
    ok:function(f){var o={cat:val(f,'cat'),title:val(f,'title'),sub:val(f,'sub'),kinds:val(f,'kinds'),area:val(f,'area'),term:val(f,'term'),year:val(f,'year'),text:val(f,'text'),photos:ph,st:val(f,'pub')?'pub':'draft'};
      if(!o.title){toast('Нужно название');return false}
      if(code&&!p.mine){S.proj[code]=o}else{var c=code||val(f,'code');if(!c){toast('Нужен код проекта');return false}if(!code&&projects().some(function(x){return x.code===c})){toast('Такой код уже есть');return false}o.code=c;o.slug=c.toLowerCase().replace(/[^a-z0-9а-я]+/gi,'-');S.newProj=S.newProj.filter(function(x){return x.code!==c});S.newProj.unshift(o)}
      log((code?'изменён':'добавлен')+' проект '+(code||o.code));save();toast('Сохранено. На сайте уже видно')}})}

/* ── Разделы сайта ───────────────────────────────────────────────────── */
function secState(s){var o=S.sec[s.id]||{};return {title:o.title!=null?o.title:(s.title||''),text:o.text!=null?o.text:s.text,photos:o.photos||s.photos.slice(),hidden:!!o.hidden}}
VIEWS.sec=function(){var lock=ro('sec');
  return '<div><p class="h2">Блоки главной страницы</p><p class="lead">Заголовок, текст и фото каждого блока, порядок и видимость. Первый экран и контакты стоят на своих местах.</p></div><div class="list">'+
  S.order.map(function(id,i){var s=G.sections.filter(function(x){return x.id===id})[0];if(!s)return '';var o=secState(s);
    return '<div class="li"><span>'+pic(o.photos[0]||G.img+'/logo-k.png','th','')+'</span><p class="t">'+pad(i+1)+' · '+h(s.n)+'</p><p class="m">'+h((o.title||o.text||'Без текста: блок из чертежей и кадров').replace(/\n/g,' ').slice(0,90))+(o.photos.length?' · '+plural(o.photos.length,'фото','фото','фото'):'')+'</p><span class="a">'+(o.hidden?'<span class="pill warn">скрыт</span>':'')+(lock||s.fixed?'':'<button type="button" class="btn o s" data-up="'+i+'" aria-label="Выше"'+(i<2?' disabled':'')+'>'+ic('up')+'</button><button type="button" class="btn o s" data-dn="'+i+'" aria-label="Ниже"'+(i>=S.order.length-2?' disabled':'')+'>'+ic('down')+'</button>')+'<button type="button" class="btn o s" data-s="'+id+'">'+(lock?'Открыть':'Изменить')+'</button></span></div>'}).join('')+'</div>'};
BIND.sec=function(el){var mv=function(i,dlt){var j=i+dlt,a=S.order;if(j<1||j>a.length-2)return;var t=a[i];a[i]=a[j];a[j]=t;log('изменён порядок блоков');save();draw()};
  $$('[data-up]',el).forEach(function(b){b.onclick=function(){mv(+b.getAttribute('data-up'),-1)}});
  $$('[data-dn]',el).forEach(function(b){b.onclick=function(){mv(+b.getAttribute('data-dn'),1)}});
  $$('[data-s]',el).forEach(function(b){b.onclick=function(){editSec(b.getAttribute('data-s'))}})};
function editSec(id){var s=G.sections.filter(function(x){return x.id===id})[0],o=secState(s),lock=ro('sec'),ph=o.photos.slice();
  drawer({title:s.n,save:!lock,
    body:(s.title!=null?fld('Заголовок блока','title',o.title,{area:1,ro:lock,hint:'Каждая строка заголовка с новой строки. Вторая строка на сайте курсивом.'}):'')+(s.text!=null?fld('Текст блока','text',o.text,{area:1,ro:lock}):'')+
      (s.canPhotos?'<div class="fld"><span>Фото блока</span>'+photos(ph,id,lock,{nc:1})+'<small>Фото встают на места по порядку: '+h(s.where||'по одному на карточку')+'.</small></div>':(s.title==null&&s.text==null?'<p class="lead">Этот блок собран из чертежей, кадров и цифр: его можно скрыть или переставить.</p>':''))+
      (s.fixed?'':'<label class="chk"><input type="checkbox" name="hidden"'+(o.hidden?' checked':'')+(lock?' disabled':'')+'> Скрыть блок на сайте</label>'),
    bind:function(f){if(!lock)bindPhotos(f,ph,id,{nc:1})},
    ok:function(f){S.sec[id]={title:s.title!=null?val(f,'title'):undefined,text:s.text!=null?val(f,'text'):undefined,photos:ph,hidden:!!val(f,'hidden')};log('изменён блок «'+s.n+'»');save();toast('Блок обновлён на сайте')}})}

/* ── Новости и выставки ──────────────────────────────────────────────── */
VIEWS.news=function(){var lock=ro('news');
  return '<div class="row"><div><p class="h2">Новости и выставки</p><p class="lead">Опубликованное выходит в блоке «Выставки» на главной в том порядке, что здесь.</p></div><span class="sp"></span>'+(lock?'':'<button type="button" class="btn" data-new>'+ic('plus')+'Новость</button>')+'</div><div class="list">'+
  (S.news.length?S.news.map(function(n){return '<button type="button" class="li" data-n="'+n.id+'">'+pic(n.photo||G.img+'/logo-k.png','th','')+'<p class="t">'+h(n.title)+'</p><p class="m">'+h(n.kind)+' · '+h(n.date)+(n.place?' · '+h(n.place):'')+'</p><span class="a">'+(n.on?'<span class="pill ok">на сайте</span>':'<span class="pill warn">черновик</span>')+'</span></button>'}).join(''):'<p class="empty">Новостей пока нет</p>')+'</div>'};
BIND.news=function(el){$$('[data-n]',el).forEach(function(b){b.onclick=function(){editNews(b.getAttribute('data-n'))}});var nb=$('[data-new]',el);if(nb)nb.onclick=function(){editNews(null)}};
function editNews(id){var lock=ro('news'),n=id?S.news.filter(function(x){return x.id===id})[0]:{id:uid('n'),kind:'Новость',title:'',date:new Date().toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'}),place:'',text:'',photo:'',on:1},ph=n.photo?[n.photo]:[];
  drawer({title:id?'Новость':'Новая новость',save:!lock,
    body:'<div class="two">'+fld('Тип','kind',n.kind,{opts:[['Новость','Новость'],['Выставка','Выставка'],['Публикация','Публикация'],['Награда','Награда']],ro:lock})+fld('Дата','date',n.date,{ro:lock})+'</div>'+fld('Заголовок','title',n.title,{ro:lock})+fld('Место','place',n.place,{ro:lock,ph:'Москва, Гостиный двор'})+fld('Текст','text',n.text,{area:1,ro:lock})+
      '<div class="fld"><span>Фото</span>'+photos(ph,'news',lock,{nc:1,one:1})+'</div><label class="chk"><input type="checkbox" name="on"'+(n.on?' checked':'')+(lock?' disabled':'')+'> Опубликовать на сайте</label>',
    bind:function(f){if(!lock)bindPhotos(f,ph,'news',{nc:1,one:1})},
    remove:id&&!lock?function(){S.news=S.news.filter(function(x){return x.id!==id});log('удалена новость «'+n.title+'»');save()}:null,
    ok:function(f){var o={id:n.id,kind:val(f,'kind'),title:val(f,'title'),date:val(f,'date'),place:val(f,'place'),text:val(f,'text'),photo:ph[0]||'',on:val(f,'on')?1:0};if(!o.title){toast('Нужен заголовок');return false}
      if(id)S.news=S.news.map(function(x){return x.id===id?o:x});else S.news.unshift(o);log((o.on?'опубликована':'сохранена черновиком')+' новость «'+o.title+'»');save();toast(o.on?'Новость на сайте':'Сохранено черновиком')}})}

/* ── Коллектив ───────────────────────────────────────────────────────── */
VIEWS.team=function(){var lock=ro('team');
  return '<div class="row"><div><p class="h2">Коллектив</p><p class="lead">Люди и должности в блоке «Коллектив» на главной, в этом порядке.</p></div><span class="sp"></span>'+(lock?'':'<button type="button" class="btn" data-new>'+ic('plus')+'Добавить</button>')+'</div><div class="list">'+
  S.team.map(function(m,i){return '<div class="li">'+pic(m.photo||G.img+'/logo-k.png','th','')+'<p class="t">'+h(m.n)+'</p><p class="m">'+h(m.r)+'</p><span class="a">'+(lock?'':'<button type="button" class="btn o s" data-up="'+i+'" aria-label="Выше"'+(i?'':' disabled')+'>'+ic('up')+'</button>')+'<button type="button" class="btn o s" data-m="'+m.id+'">'+(lock?'Открыть':'Изменить')+'</button></span></div>'}).join('')+'</div>'};
BIND.team=function(el){$$('[data-up]',el).forEach(function(b){b.onclick=function(){var i=+b.getAttribute('data-up');S.team.splice(i-1,0,S.team.splice(i,1)[0]);save();draw()}});
  $$('[data-m]',el).forEach(function(b){b.onclick=function(){editTeam(b.getAttribute('data-m'))}});var nb=$('[data-new]',el);if(nb)nb.onclick=function(){editTeam(null)}};
function editTeam(id){var lock=ro('team'),m=id?S.team.filter(function(x){return x.id===id})[0]:{id:uid('t'),n:'',r:'',photo:''},ph=m.photo?[m.photo]:[];
  drawer({title:id?m.n:'Новый сотрудник',save:!lock,body:fld('Имя и фамилия','n',m.n,{ro:lock})+fld('Должность','r',m.r,{ro:lock})+'<div class="fld"><span>Фото</span>'+photos(ph,'team',lock,{nc:1,one:1})+'<small>Квадратное фото смотрится лучше всего.</small></div>',
    bind:function(f){if(!lock)bindPhotos(f,ph,'team',{nc:1,one:1})},
    remove:id&&!lock?function(){S.team=S.team.filter(function(x){return x.id!==id});log('удалена карточка коллектива: '+m.n);save()}:null,
    ok:function(f){var o={id:m.id,n:val(f,'n'),r:val(f,'r'),photo:ph[0]||''};if(!o.n){toast('Нужно имя');return false}if(id)S.team=S.team.map(function(x){return x.id===id?o:x});else S.team.push(o);log((id?'изменена':'добавлена')+' карточка коллектива: '+o.n);save();toast('Коллектив обновлён')}})}

/* ── Медиатека ───────────────────────────────────────────────────────── */
var mf='all';
VIEWS.media=function(){var lock=ro('media'),secs=[['all','Все']].concat(G.sections.map(function(s){return [s.id,s.n]}),[['proj','Проекты'],['news','Новости'],['team','Коллектив']]);
  var mine=S.media.filter(function(m){return mf==='all'||m.sec===mf});
  return '<div class="row"><div><p class="h2">Медиатека</p><p class="lead">Загруженные фото по разделам. Подпись к фото читают поисковики и экранные дикторы.</p></div></div>'+
  (lock?'':'<div class="card"><div class="row"><label class="fld" style="flex:1 1 220px"><span>Раздел для новых фото</span><select data-to>'+secs.slice(1).map(function(s){return '<option value="'+s[0]+'">'+h(s[1])+'</option>'}).join('')+'</select></label></div><div class="ph" style="margin-top:12px"><label class="drop" data-drop>'+ic('plus')+'<span>Загрузить фото<br>или перетащить сюда</span><input class="sr" type="file" accept="'+IMGS+'" multiple></label></div></div>')+
  '<div class="row"><label class="fld" style="flex:0 1 280px"><span>Показать</span><select data-f>'+secs.map(function(s){return '<option value="'+s[0]+'"'+(mf===s[0]?' selected':'')+'>'+h(s[1])+'</option>'}).join('')+'</select></label><span class="sp"></span><p class="cap">'+plural(S.media.length,'фото','фото','фото')+'</p></div>'+
  (mine.length?'<div class="ph nc">'+mine.map(function(m){return '<figure>'+pic(m.id,'',m.alt)+'<span class="ctl"><button type="button" data-e="'+m.id+'" aria-label="Подпись и раздел">'+ic('pen')+'</button></span></figure>'}).join('')+'</div>':'<p class="empty">Здесь появятся фото, которые вы загрузите. Фото с сайта бюро уже стоят в проектах и блоках.</p>')};
BIND.media=function(el){var f=$('[data-f]',el);f.onchange=function(){mf=f.value;draw()};
  var drop=$('[data-drop]',el);if(drop){var inp=$('input',drop),to=$('[data-to]',el),go2=function(files){upload(files,to.value).then(function(){save();draw()})};inp.onchange=function(){go2(inp.files)};
    ['dragenter','dragover'].forEach(function(t){drop.addEventListener(t,function(e){e.preventDefault();drop.classList.add('on')})});['dragleave','drop'].forEach(function(t){drop.addEventListener(t,function(e){e.preventDefault();drop.classList.remove('on')})});drop.addEventListener('drop',function(e){go2(e.dataTransfer.files)})}
  $$('[data-e]',el).forEach(function(b){b.onclick=function(){editMedia(b.getAttribute('data-e'))}})};
function editMedia(id){var m=S.media.filter(function(x){return x.id===id})[0],lock=ro('media');
  drawer({title:'Фото',save:!lock,body:'<div class="ph nc">'+'<figure style="aspect-ratio:auto">'+pic(m.id,'','')+'</figure></div><p class="cap">'+h(m.name)+' · '+m.w+'×'+m.h+' · '+Math.round(m.size/1024)+' КБ · '+when(m.ts)+'</p>'+fld('Подпись к фото','alt',m.alt,{ro:lock,hint:'Что на снимке: «Фасад виллы APx180.2606 на закате»'})+fld('Раздел','sec',m.sec,{opts:G.sections.map(function(s){return [s.id,s.n]}).concat([['proj','Проекты'],['news','Новости'],['team','Коллектив']]),ro:lock}),
    remove:lock?null:function(){S.media=S.media.filter(function(x){return x.id!==id});del(id);log('удалено фото '+m.name);save()},
    ok:function(f){m.alt=val(f,'alt');m.sec=val(f,'sec');log('подписано фото '+m.name);save()}})}

/* ── Заявки ──────────────────────────────────────────────────────────── */
var ST=[['new','Новая','b'],['work','В работе',''],['deal','Договор','ok'],['no','Отказ','warn']],lf='all';
VIEWS.leads=function(){var lock=ro('leads'),rows=S.leads.filter(function(l){return lf==='all'||l.st===lf}),mgr=S.users.filter(function(u){var r=S.roles[u.role];return u.on&&r&&r.p.leads>=2});
  return '<div><p class="h2">Заявки</p><p class="lead">Обращения с кнопок WhatsApp и Telegram, звонки и письма. Демо-заявки: на боевом сайте сюда приходят настоящие.</p></div>'+
  '<div class="chips" role="group" aria-label="Статус">'+[['all','Все']].concat(ST).map(function(s){return '<button type="button" data-st="'+s[0]+'" aria-pressed="'+(lf===s[0])+'">'+s[1]+' <span class="cap">'+(s[0]==='all'?S.leads.length:S.leads.filter(function(l){return l.st===s[0]}).length)+'</span></button>'}).join('')+'</div>'+
  '<div class="scroll"><table class="tb"><thead><tr><th>Когда</th><th>Откуда</th><th>Запрос</th><th>Статус</th><th>Ведёт</th></tr></thead><tbody>'+rows.map(function(l){return '<tr><td>'+when(l.ts)+'</td><td>'+h(l.src)+'</td><td style="min-width:240px">'+h(l.text)+'</td><td><select data-ls="'+l.id+'"'+(lock?' disabled':'')+' aria-label="Статус">'+ST.map(function(s){return '<option value="'+s[0]+'"'+(l.st===s[0]?' selected':'')+'>'+s[1]+'</option>'}).join('')+'</select></td><td><select data-lw="'+l.id+'"'+(lock?' disabled':'')+' aria-label="Кто ведёт"><option value="">никто</option>'+mgr.map(function(u){return '<option value="'+u.id+'"'+(l.who===u.id?' selected':'')+'>'+h(u.n)+'</option>'}).join('')+'</select></td></tr>'}).join('')+'</tbody></table></div>'};
BIND.leads=function(el){$$('[data-st]',el).forEach(function(b){b.onclick=function(){lf=b.getAttribute('data-st');draw()}});
  $$('[data-ls]',el).forEach(function(s){s.onchange=function(){var l=S.leads.filter(function(x){return x.id===s.getAttribute('data-ls')})[0];l.st=s.value;log('заявка «'+l.text.slice(0,32)+'…» теперь «'+ST.filter(function(x){return x[0]===s.value})[0][1]+'»');save();render()}});
  $$('[data-lw]',el).forEach(function(s){s.onchange=function(){var l=S.leads.filter(function(x){return x.id===s.getAttribute('data-lw')})[0];l.who=s.value;log('заявка передана: '+(s.value?uname(s.value):'никому'));save()}})};

/* ── Пользователи и роли ─────────────────────────────────────────────── */
var ut='users';
VIEWS.users=function(){var lock=ro('users');
  var tabs='<div class="chips" role="group" aria-label="Вкладки"><button type="button" data-t="users" aria-pressed="'+(ut==='users')+'">Пользователи</button><button type="button" data-t="roles" aria-pressed="'+(ut==='roles')+'">Роли и права</button></div>';
  if(ut==='users')return '<div class="row"><div><p class="h2">Пользователи</p><p class="lead">Кто входит в панель и с какой ролью. Новому человеку уходит приглашение на почту, пароль он задаёт сам.</p></div><span class="sp"></span>'+(lock?'':'<button type="button" class="btn" data-inv>'+ic('plus')+'Пригласить</button>')+'</div>'+tabs+
    '<div class="list">'+S.users.map(function(u){var r=S.roles[u.role]||{n:'роль удалена'};return '<button type="button" class="li nt" data-u="'+u.id+'"><span class="who"><span class="av">'+h(u.n.split(' ').map(function(x){return x[0]}).join('').slice(0,2))+'</span><p class="t">'+h(u.n)+(u.id===S.me?' <span class="pill">это вы</span>':'')+'<small>'+(u.mail?h(u.mail):'почта не указана')+'</small></p></span><span class="a"><span class="pill'+(u.role==='owner'?' b':'')+'">'+h(r.n)+'</span>'+(u.on?u.inv?'<span class="pill warn">приглашён</span>':'':'<span class="pill warn">отключён</span>')+'</span><p class="m">'+(u.inv?'ждёт входа':'был'+' '+when(u.last))+'</p></button>'}).join('')+'</div>';
  var roles=Object.keys(S.roles);
  return '<div class="row"><div><p class="h2">Роли и права</p><p class="lead">Для каждой роли: какие разделы видно и где можно менять. «Владелец» видит и меняет всё. Переключатель «Вы смотрите как» сверху показывает панель глазами любого пользователя.</p></div><span class="sp"></span>'+(lock?'':'<button type="button" class="btn" data-nr>'+ic('plus')+'Новая роль</button>')+'</div>'+tabs+
    '<div class="scroll card" style="padding:0"><table class="mx"><thead><tr><th>Раздел</th>'+roles.map(function(k){return '<th>'+h(S.roles[k].n)+'</th>'}).join('')+'</tr></thead><tbody>'+AREAS.map(function(a){return '<tr><td>'+a[1]+'</td>'+roles.map(function(k){var r=S.roles[k],v=r.p[a[0]]||0;return '<td><select data-rk="'+k+'" data-ra="'+a[0]+'" data-v="'+v+'"'+(lock||r.lock?' disabled':'')+' aria-label="'+h(r.n)+': '+a[1]+'">'+LV.map(function(n,i){return '<option value="'+i+'"'+(v===i?' selected':'')+'>'+n+'</option>'}).join('')+'</select></td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div>'};
BIND.users=function(el){$$('[data-t]',el).forEach(function(b){b.onclick=function(){ut=b.getAttribute('data-t');draw()}});
  $$('[data-u]',el).forEach(function(b){b.onclick=function(){editUser(b.getAttribute('data-u'))}});
  var iv=$('[data-inv]',el);if(iv)iv.onclick=function(){editUser(null)};
  $$('[data-rk]',el).forEach(function(s){s.onchange=function(){var r=S.roles[s.getAttribute('data-rk')];r.p[s.getAttribute('data-ra')]=+s.value;s.setAttribute('data-v',s.value);log('изменены права роли «'+r.n+'»: '+AREAS.filter(function(a){return a[0]===s.getAttribute('data-ra')})[0][1]+', '+LV[+s.value].toLowerCase());save();toast('Права сохранены');if(!can(view))go('dash')}});
  var nr=$('[data-nr]',el);if(nr)nr.onclick=function(){drawer({title:'Новая роль',body:fld('Название роли','n','',{ph:'Архитектор проекта'})+fld('Взять права у роли','from','editor',{opts:Object.keys(S.roles).map(function(k){return [k,S.roles[k].n]})}),okText:'Создать',
    ok:function(f){var n=val(f,'n');if(!n){toast('Нужно название');return false}var k=uid('r');S.roles[k]={n:n,p:JSON.parse(JSON.stringify(S.roles[val(f,'from')].p))};log('создана роль «'+n+'»');save();toast('Роль создана, права настраиваются в таблице')}})}};
function editUser(id){var lock=ro('users'),u=id?S.users.filter(function(x){return x.id===id})[0]:{id:uid('u'),n:'',mail:'',role:'editor',on:1,inv:1,last:Date.now()},self=id===S.me,own=u.role==='owner';
  var roles=Object.keys(S.roles).filter(function(k){return k!=='owner'||own}).map(function(k){return [k,S.roles[k].n]});
  drawer({title:id?u.n:'Пригласить пользователя',save:!lock,okText:id?'Сохранить':'Отправить приглашение',
    body:fld('Имя','n',u.n,{ro:lock})+fld('Почта','mail',u.mail,{type:'email',ro:lock,ph:'name@sia88.ru',hint:id?'':'На эту почту уйдёт ссылка для входа'})+fld('Роль','role',u.role,{opts:roles,ro:lock||own})+(id&&!self&&!own?'<label class="chk"><input type="checkbox" name="on"'+(u.on?' checked':'')+(lock?' disabled':'')+'> Доступ включён</label>':'')+(own?'<p class="lead">Владельца нельзя отключить или понизить: у сайта всегда есть тот, кто может всё.</p>':''),
    remove:id&&!self&&!own&&!lock?function(){S.users=S.users.filter(function(x){return x.id!==id});log('удалён пользователь '+u.n);save()}:null,
    ok:function(f){var n=val(f,'n'),m=val(f,'mail');if(!n){toast('Нужно имя');return false}if(!id&&!/^\S+@\S+\.\S+$/.test(m)){toast('Нужна почта для приглашения');return false}
      u.n=n;u.mail=m;if(!own)u.role=val(f,'role');if(id&&!self&&!own)u.on=val(f,'on')?1:0;
      if(!id){S.users.push(u);log('приглашение: '+n+', роль «'+S.roles[u.role].n+'»');toast('Приглашение отправлено на '+m)}else{log('изменён пользователь '+n)}save()}})}

/* ── Журнал ──────────────────────────────────────────────────────────── */
VIEWS.log=function(){return '<div><p class="h2">Журнал действий</p><p class="lead">Кто, что и когда менял в панели. Записи не удаляются.</p></div>'+(S.log.length?'<ul class="log">'+S.log.slice(0,120).map(function(l){return '<li><time>'+when(l.ts)+'</time><span><b>'+h(uname(l.who))+'</b> '+h(l.a)+'</span></li>'}).join('')+'</ul>':'<p class="empty">Пока пусто</p>')};

/* ── Настройки ───────────────────────────────────────────────────────── */
VIEWS.set=function(){var s=S.set,lock=ro('set');
  return '<div><p class="h2">Контакты и поиск</p><p class="lead">Контакты меняются на всех страницах сайта сразу. Заголовок и описание видит человек в выдаче поисковика.</p></div><form class="card" id="setf" style="display:grid;gap:16px">'+
  '<div class="two">'+fld('Телефон','phone',s.phone,{ro:lock})+fld('Почта','mail',s.mail,{type:'email',ro:lock})+fld('WhatsApp, номер','wa',s.wa,{ro:lock,hint:'Только цифры, с кодом страны'})+fld('Telegram','tg',s.tg,{ro:lock})+'</div>'+
  fld('Адрес','addr',s.addr,{ro:lock})+fld('Метро','metro',s.metro,{ro:lock})+fld('Время работы','hours',s.hours,{ro:lock})+
  fld('Заголовок главной для поиска','seoT',s.seoT,{ro:lock,hint:'До 60 знаков'})+fld('Описание для поиска','seoD',s.seoD,{area:1,ro:lock,hint:'До 160 знаков'})+
  (lock?'':'<div class="row"><button type="button" class="btn" data-ok>Сохранить</button><span class="sp"></span><button type="button" class="btn d" data-reset>Сбросить демо</button></div>')+'</form>'};
BIND.set=function(el){var f=$('#setf',el),ok=$('[data-ok]',el),rs=$('[data-reset]',el);
  if(ok)ok.onclick=function(){['phone','mail','wa','tg','addr','metro','hours','seoT','seoD'].forEach(function(k){S.set[k]=val(f,k)});log('изменены контакты и настройки поиска');save();toast('Контакты обновлены на сайте')};
  if(rs)rs.onclick=function(){if(!confirm('Вернуть панель к начальному виду? Загруженные фото удалятся.'))return;S.media.forEach(function(m){del(m.id)});S=fresh();save();view='dash';render();toast('Панель сброшена')}};

/* ── Сводка ──────────────────────────────────────────────────────────── */
VIEWS.dash=function(){var pr=projects(),pub=pr.filter(function(p){return p.st!=='draft'}).length,dr=pr.length-pub,news=S.news.filter(function(n){return n.on}).length,fresh7=S.leads.filter(function(l){return Date.now()-l.ts<7*864e5}).length,nw=S.leads.filter(function(l){return l.st==='new'}).length;
  var q=[['proj','Новый проект','plus'],['news','Новость','news'],['media','Загрузить фото','photo'],['users','Пригласить','key']].filter(function(x){return can(x[0],2)});
  return '<div><p class="h2">Здравствуйте, '+h(me().n==='Вы'?'это ваш сайт':me().n.split(' ')[0])+'</p><p class="lead">Всё, что на сайте, меняется здесь: проекты, тексты и фото блоков, новости, коллектив, контакты. Разработчик для этого не нужен.</p></div>'+
  '<div class="kpis">'+[[pub,'проектов на сайте',dr?dr+' в черновиках':'черновиков нет','proj'],[news,'новостей на сайте','блок «Выставки»','news'],[S.media.length,'фото загружено','в медиатеке','media'],[fresh7,'заявок за 7 дней',nw?nw+' новых ждут ответа':'новых нет','leads']].filter(function(k){return can(k[3])}).map(function(k){return '<button type="button" class="card kpi" data-go2="'+k[3]+'" style="text-align:left"><b>'+k[0]+'</b><span>'+k[1]+'</span><span class="cap">'+k[2]+'</span></button>'}).join('')+'</div>'+
  '<div class="grid2"><div class="card"><div class="row"><p class="h3">Последние действия</p><span class="sp"></span>'+(can('log')?'<button type="button" class="btn o s" data-go2="log">Весь журнал</button>':'')+'</div><ul class="log">'+S.log.slice(0,6).map(function(l){return '<li><time>'+when(l.ts)+'</time><span><b>'+h(uname(l.who))+'</b> '+h(l.a)+'</span></li>'}).join('')+'</ul></div>'+
  '<div class="card" style="display:grid;gap:12px;align-content:start"><p class="h3">Быстро</p><div class="quick">'+q.map(function(x){return '<button type="button" class="btn o" data-quick="'+x[0]+'">'+ic(x[2])+x[1]+'</button>'}).join('')+'<a class="btn" href="'+G.home+'" target="_top">'+ic('out')+'Открыть сайт</a></div><p class="lead">Ваша роль: «'+h(S.roles[me().role].n)+'». '+(me().role==='owner'?'Вы видите и меняете всё.':'Разделы без доступа скрыты.')+'</p></div></div>'};
BIND.dash=function(el){$$('[data-go2]',el).forEach(function(b){b.onclick=function(){go(b.getAttribute('data-go2'))}});
  $$('[data-quick]',el).forEach(function(b){b.onclick=function(){var k=b.getAttribute('data-quick');if(k==='proj'){go('proj');editProj(null)}else if(k==='news'){go('news');editNews(null)}else if(k==='users'){ut='users';go('users');editUser(null)}else go(k)}})};

var hv=(location.hash||'').slice(1);if(AREAS.some(function(a){return a[0]===hv}))view=hv;
render();
})();
