/* «Наши врачи»: нажали на врача — он выходит из строя и встаёт слева,
   справа его карточка, остальные в тени. Нажатие куда угодно (кроме кнопок
   карточки) или Esc — врач разворачивается спиной, идёт на своё место и
   поворачивается лицом. Разметка — teamBlock в gen.mjs, вид — team.css.
   Движение — только transform и opacity; «меньше движения» и версия для
   слабовидящих — сразу, без шагов. Запись из карточки помнит врача
   (window.SY_DOC, его дописывает в заявку store-live.js).

   Движение — роликами (владелец, 16.11.2026: «шаги сделай будто бы это шаги
   настоящие. Когда разворачивается — они становятся тонкими, будто бы толщиной
   врач 1 мм»; 20.11.2026: «Киношные походки, плавные, будто это видео. Может
   сделать видео проще с их выходом, которое активируется по нажатии на врача»).
   У врача (.tm-v) — видео и холст WebGL: кадр ролика — сверху цвет, снизу
   прозрачность серым (видео с прозрачностью Safari на iPhone не играет), холст
   складывает их. Два файла: подход (wf) и «уход» — разворот лицом → спиной (t),
   уход в строй (wb) и разворот обратно (tb) подряд, без смены файла и паузы.
   Каждый кадр ролика идёт (24 в секунду, чуть быстрее), разворот — настоящий,
   с профилем. Шаги не скользят: по экрану врача ведёт скрипт (--tx, --ty, --sc)
   по пути p, записанному по кадрам ролика: насколько врач подошёл в ролике,
   настолько он сместился и вырос на экране.
   Файлы скачиваются целиком заранее (fetch → blob): iPhone до play() видео не
   качает, и врач стоял бы, пока грузится. Подход — когда блок на экране
   (медленная сеть и экономия трафика — по первому касанию врача), «уход» —
   когда врач вышел. Видео одно на врача: запущенное нажатием, оно же играет и
   следующие части (на iPhone без нового нажатия играет только уже запущенное
   видео); следующий файл ставится, пока врач стоит. Ролик не запустился —
   врач переезжает плавно, без шагов, кадр лицом перетекает в кадр спиной. */
(function(){
'use strict';
var root=document.querySelector('[data-tm]');if(!root)return;
var d=document,sg=root.querySelector('.tm-sg'),gh=root.querySelector('.tm-gh'),btns=[].slice.call(root.querySelectorAll('.tm-d')),cur=-1,busy=0,want=null,pos=[];
var mq=window.matchMedia?matchMedia('(prefers-reduced-motion: reduce)'):null;
function vi(){return d.documentElement.classList.contains('vi')}
function calm(){return (mq&&mq.matches)||vi()}
function later(f,ms){setTimeout(f,calm()?0:ms)}
function info(i){return d.getElementById('tm-i'+i)}
function slot(i){return btns[i].parentNode}
function fig(i){return btns[i].querySelector('.tm-g')}
var HOME={tx:0,ty:0,sc:1};
root.classList.add('tm-js');
var net=navigator.connection||{},slow=!!(net.saveData||/2g|3g/.test(net.effectiveType||''));
function reel(s){var v=s.querySelector('.tm-v');if(!v)return null;if(!v._c)try{v._c=JSON.parse(v.getAttribute('data-clips'))}catch(e){v._c={}}return v}
function fetchClip(s,kinds){var v=reel(s);if(!v||!window.fetch||!window.URL)return;v._u=v._u||{};kinds.split(' ').forEach(function(k){var c=v._c[k],u=v._u;if(!c||u[c.src])return;u[c.src]=1;
  fetch(c.src).then(function(r){if(!r.ok)throw 0;return r.blob()}).then(function(b){u[c.src]=URL.createObjectURL(b)},function(){u[c.src]=0})})}
/* Появление ряда: врачи встают по одному, когда блок на экране. */
function seen(){root.classList.add('tm-in');if(!slow)setTimeout(function(){btns.forEach(function(b){fetchClip(b.parentNode,'wf')})},600)}
if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){seen();io.disconnect()}})},{threshold:.2});io.observe(root)}else seen();
btns.forEach(function(b){b.addEventListener('pointerdown',function(){fetchClip(b.parentNode,'wf')},{passive:true})});
/* Куда встать: слева, ногами на пол сцены, ростом почти во всю сцену. */
function target(i){
  /* Мерка — по месту в строю (li не двигается), не по самому врачу. */
  var r=slot(i).getBoundingClientRect(),s=sg.getBoundingClientRect(),wide=s.width>=760;
  /* На ПК врач почти во всю сцену (владелец, 16.11.2026: «чуть больше занимать в пк версии места на экране, % на 20-30»), заголовок над ним гаснет. */
  var sc=Math.min(s.height*(wide?.97:.74)/r.height,wide?1.9:1.5),cx=s.left+s.width*(wide?.25:.23),fl=s.top+s.height*(wide?.96:.95);
  return {tx:Math.round(cx-(r.left+r.width/2)),ty:Math.round(fl-r.bottom),sc:sc};
}
function set(g,p){
  if(!p){g.style.removeProperty('--tx');g.style.removeProperty('--ty');g.style.removeProperty('--sc');return}
  g.style.setProperty('--tx',p.tx.toFixed(1)+'px');g.style.setProperty('--ty',p.ty.toFixed(1)+'px');g.style.setProperty('--sc',p.sc.toFixed(4));
}
/* Путь по кадрам ролика (p, 0…1000): доля пути в момент u (0…1) — между соседними кадрами
   плавно, поэтому врач на экране движется ровно, хоть кадры и идут 30 в секунду. */
function prog(c){
  var p=c.p,m=p?p.length-1:0;
  if(!p)return function(u){return u*u*(3-2*u)};
  return function(u){var x=u*(m+1),j=Math.min(m,Math.floor(x)),k=Math.min(m,j+1);return (p[j]+(p[k]-p[j])*(x-j))/1000};
}
function path(i,a,b,c){var g=fig(i),f=prog(c);return function(u){var v=f(u);v=v<0?0:v>1?1:v;
  set(g,{tx:a.tx+(b.tx-a.tx)*v,ty:a.ty+(b.ty-a.ty)*v,sc:a.sc+(b.sc-a.sc)*v})}}
var VS='attribute vec2 p;varying vec2 t;void main(){t=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}',
    FS='precision mediump float;varying vec2 t;uniform sampler2D s;void main(){vec3 c=texture2D(s,vec2(t.x,t.y*.5)).rgb;float a=texture2D(s,vec2(t.x,.5+t.y*.5)).g;gl_FragColor=vec4(c*a,a);}';
function glOf(v){
  if('_g' in v)return v._g;v._g=null;
  var g=null;try{g=v.querySelector('canvas').getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false,depth:false,stencil:false})}catch(e){}
  if(!g)return null;
  function sh(t,src){var o=g.createShader(t);g.shaderSource(o,src);g.compileShader(o);return o}
  var pr=g.createProgram();g.attachShader(pr,sh(g.VERTEX_SHADER,VS));g.attachShader(pr,sh(g.FRAGMENT_SHADER,FS));g.linkProgram(pr);
  if(!g.getProgramParameter(pr,g.LINK_STATUS))return null;
  g.useProgram(pr);g.bindBuffer(g.ARRAY_BUFFER,g.createBuffer());g.bufferData(g.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),g.STATIC_DRAW);
  var at=g.getAttribLocation(pr,'p');g.enableVertexAttribArray(at);g.vertexAttribPointer(at,2,g.FLOAT,false,0,0);
  g.bindTexture(g.TEXTURE_2D,g.createTexture());
  [g.TEXTURE_WRAP_S,g.TEXTURE_WRAP_T].forEach(function(k){g.texParameteri(g.TEXTURE_2D,k,g.CLAMP_TO_EDGE)});
  [g.TEXTURE_MIN_FILTER,g.TEXTURE_MAG_FILTER].forEach(function(k){g.texParameteri(g.TEXTURE_2D,k,g.LINEAR)});
  g.clearColor(0,0,0,0);
  return v._g=g;
}
function paint(g,el){try{g.viewport(0,0,g.canvas.width,g.canvas.height);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,el);g.clear(g.COLOR_BUFFER_BIT);g.drawArrays(g.TRIANGLE_STRIP,0,4);return true}catch(e){return false}}
/* Файл ролика c и время from: blob, если уже скачан; тот же файл — без перезагрузки, перемотка —
   только если видео стоит не там (части «ухода» идут подряд). */
function cue(v,el,c,from){var b=v._u&&v._u[c.src],u=typeof b==='string'?b:c.src;if(el._src!==c.src||(el._blob!==(u!==c.src)&&el.paused)){el._src=c.src;el._blob=u!==c.src;el.src=u}
  if(Math.abs((el.currentTime||0)-from)>.75/c.fps)try{el.currentTime=from}catch(e){}}
/* Следующий файл — заранее, пока врач стоит (после подхода — «уход», после возвращения — подход). */
function prep(s,k){var v=reel(s),c=v&&v._c[k];if(!c||calm())return;var el=v.querySelector('video');el.muted=true;el.preload='auto';cue(v,el,c,c.at)}
/* Часть k ролика. tick — доля пути на каждом кадре экрана; done(true) — доиграла,
   done(false) — не запустилась (врач тогда переезжает без шагов). */
function vrun(s,k,tick,done){
  var v=reel(s),c=v&&v._c[k],g=c&&!calm()&&glOf(v);if(!g)return false;
  var el=v.querySelector('video'),cv=g.canvas,T=c.n/c.fps,from=c.at,shown=false,end=false,t0=Date.now(),fresh=false;
  v.style.cssText='left:'+c.b[0]+'%;top:'+c.b[1]+'%;width:'+c.b[2]+'%;height:'+c.b[3]+'%';
  if(cv.width!==c.w)cv.width=c.w;if(cv.height!==c.h)cv.height=c.h;
  el.muted=true;el._prime=0;cue(v,el,c,from);var tok=v._tok=(v._tok||0)+1;
  /* Следующая часть того же файла запускается прямо в done: холст остаётся с последним кадром,
     кадр врача не мелькает между частями. */
  function fin(ok){if(end)return;end=true;try{el.pause()}catch(e){}if(!ok)s.classList.remove('tm-vs');done(ok);if(ok&&v._tok===tok)s.classList.remove('tm-vs')}
  var p=el.play();if(p&&p.then)p.then(null,function(){fin(false)});
  /* Новый кадр видео — на холст (requestVideoFrameCallback, где есть: без лишних загрузок кадра). */
  if(el.requestVideoFrameCallback)el.requestVideoFrameCallback(function nf(){if(end)return;fresh=true;el.requestVideoFrameCallback(nf)});
  requestAnimationFrame(function step(){
    if(end)return;
    var t=el.currentTime,on=el.readyState>=2&&!el.seeking&&t>=from-.02&&t<from+T+.5;
    if(on&&(fresh||!el.requestVideoFrameCallback||!shown)){fresh=false;if(paint(g,el)&&!shown){shown=true;s.classList.add('tm-vs')}}
    if(!shown&&Date.now()-t0>2500)return fin(false);
    var u=shown?Math.min(1,Math.max(0,(t-from)/T)):0;
    if(tick)tick(u);
    if(shown&&(u>=1-.5/c.n||el.ended)){if(tick)tick(1);return fin(true)}
    requestAnimationFrame(step);
  });
  return true;
}
/* Другой врач при открытом идёт позже нажатия: его видео запущено и остановлено прямо в нажатии. */
function prime(s){var v=reel(s),c=v&&v._c.wf;if(!c||calm())return;var el=v.querySelector('video');el.muted=true;cue(v,el,c,0);el._prime=1;
  var p=el.play();if(p&&p.then)p.then(function(){if(el._prime){el.pause();try{el.currentTime=0}catch(e){}}},function(){})}
/* Разворот: кадры настоящего поворота (лицо, профиль, спина); обратно — своя часть ролика.
   Ролика нет — кадр лицом перетекает в кадр спиной. */
function turn(s,back,done){
  function flip(){s.classList.add('tm-xf');s.classList.toggle('tm-back',back);later(function(){s.classList.remove('tm-xf');done()},320)}
  if(!vrun(s,back?'t':'tb',null,function(ok){if(!ok)return flip();s.classList.toggle('tm-back',back);done()}))flip();
}
function enter(i,done){
  var s=slot(i),b=btns[i],inf=info(i),g=fig(i),to=target(i);
  s.classList.add('tm-sel');b.setAttribute('aria-expanded','true');
  /* Фамилия контуром за врачом, как имя бойца: по ширине левой половины сцены. */
  if(gh){var sn=b.getAttribute('data-sn')||'';gh.textContent=sn;gh.style.setProperty('--gs',Math.round(Math.min(200,sg.clientWidth*.46/Math.max(4,sn.length)/.58))+'px')}
  var r=sg.getBoundingClientRect();if(r.top<-40||r.bottom>innerHeight+40)try{sg.scrollIntoView({block:'center',behavior:calm()?'auto':'smooth'})}catch(e){}
  function card(){if(cur!==i)return;inf.hidden=false;requestAnimationFrame(function(){inf.classList.add('on');var h=inf.querySelector('h3');if(h)try{h.focus({preventScroll:true})}catch(e){}})}
  fetchClip(s,'wf t');pos[i]=to;
  if(calm()){set(g,to);card();done();return}
  /* Карточка — когда врач прошёл больше половины пути (ролик мог ещё грузиться). */
  var v=reel(s),c=v&&v._c.wf,go=c&&path(i,HOME,to,c),said=false;
  s.classList.add('tm-mv');
  if(vrun(s,'wf',function(u){go(u);if(u>=.62&&!said){said=true;card()}},function(ok){s.classList.remove('tm-mv');if(ok){prep(s,'t');return done()}set(g,to);if(!said)later(card,500);later(done,900)}))return;
  s.classList.remove('tm-mv');set(g,to);later(card,500);later(done,900);
}
function leave(i,keep,done){
  var s=slot(i),b=btns[i],inf=info(i),g=fig(i),from=pos[i]||target(i);
  inf.classList.remove('on');later(function(){inf.hidden=true},300);
  function fin(){s.classList.remove('tm-sel');b.setAttribute('aria-expanded','false');prep(s,'wf');done()}
  if(calm()){set(g,null);if(!keep)root.classList.remove('tm-on');fin();return}
  turn(s,true,function(){
    if(!keep)root.classList.remove('tm-on');
    function home(){turn(s,false,fin)}
    var v=reel(s),c=v&&v._c.wb;
    s.classList.add('tm-mv');
    if(vrun(s,'wb',c&&path(i,from,HOME,c),function(ok){s.classList.remove('tm-mv');set(g,null);if(ok)home();else later(home,900)}))return;
    s.classList.remove('tm-mv');set(g,null);later(home,900);
  });
}
/* Пока врач идёт, новое нажатие не теряется: оно выполнится, когда он дойдёт. */
function idle(){
  if(--busy>0)return;busy=0;var w=want;want=null;
  if(w==='x'){if(cur>=0)shut()}else if(w!==null)pick(w);
}
function open(i){busy++;cur=i;root.classList.add('tm-on');enter(i,idle)}
function shut(){var i=cur;if(i<0)return;busy++;cur=-1;leave(i,false,function(){if(want===null)try{btns[i].focus({preventScroll:true})}catch(e){}idle()})}
/* Другой врач при открытом: первый разворачивается и уходит, второй уже идёт на его место. */
function swap(i){var p=cur;busy+=2;cur=i;prime(slot(i));leave(p,true,idle);later(function(){enter(i,idle)},700)}
function pick(i){if(vi())return;if(busy){want=i;return}if(cur===i)shut();else if(cur>=0)swap(i);else open(i)}
/* В версии для слабовидящих карточки открыты все сразу (team.css), сцены нет. */
btns.forEach(function(b,i){b.addEventListener('click',function(e){e.stopPropagation();pick(i)})});
d.addEventListener('click',function(e){if(vi())return;var t=e.target;if(t.closest&&t.closest('.tm-i')&&t.closest('a,button,input,label'))return;if(busy){if(cur>=0)want='x';return}if(cur>=0)shut()});
d.addEventListener('keydown',function(e){if(e.key!=='Escape'||cur<0)return;var sh=d.getElementById('zapis');if(sh&&!sh.hidden)return;if(busy)want='x';else shut()});
var rz=0;addEventListener('resize',function(){clearTimeout(rz);rz=setTimeout(function(){if(cur>=0&&!busy){pos[cur]=target(cur);set(fig(cur),pos[cur])}},120)});
/* Врач для записи: кнопка в карточке — этот врач, любая другая запись — без врача. */
d.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('[data-book]');if(a)window.SY_DOC=a.getAttribute('data-doc')||''},true);
})();
