/* Разделы после сцены (sections.mjs). Код идёт внутри той же функции, что и
   site.js: $, $$, d, root, CALM, site, unseal, top — оттуда. */
var CAT=JSON.parse(($('#sa-cat')||{}).textContent||'{"items":[],"kinds":[],"dealers":[]}'),RM=CALM;
try{RM=RM||matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
var nf=function(n){return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ')};
var kindOf=function(k){for(var i=0;i<CAT.kinds.length;i++)if(CAT.kinds[i].cat===k)return CAT.kinds[i];return null};
var specOf=function(it){var s=[];if(it.hp)s.push(it.hp+' o.k.');if(it.kg)s.push(nf(it.kg)+' kg yuk');if(it.seats&&it.cat!=='yuk'&&it.cat!=='maxsus')s.push(it.seats+(it.cat==='avtobus'?' yo‘lovchi':' o‘rin'));if(it.wheels)s.push(it.wheels);return s.join(' · ')};

/* Красные линии: волна бежит, только пока линия на экране. */
if('IntersectionObserver' in window&&!RM){var lo=new IntersectionObserver(function(es){es.forEach(function(e){e.target.classList.toggle('run',e.isIntersecting)})},{rootMargin:'40px'});$$('.rl').forEach(function(x){lo.observe(x)})}

/* Ариза: собираем текст и открываем их телефон или бота — форма ничего не
   отправляет ни им, ни нам (proto-master, §4). */
var az=$('#az'),azLast=null,paintName='To‘q sariq',rimName='Qora yaltiroq';
function azOpen(text,from){if(!az)return;$('#az-m').textContent=text;azLast=from||null;az.hidden=false;root.classList.add('lock-fv');
  requestAnimationFrame(function(){az.classList.add('show')});$('#az-x').focus({preventScroll:true})}
function azClose(){if(!az||az.hidden)return;az.classList.remove('show');setTimeout(function(){az.hidden=true;if(!fv||fv.hidden)root.classList.remove('lock-fv');if(azLast)azLast.focus({preventScroll:true})},280)}
var HI='Assalomu alaykum! samauto.uz saytidan ariza.\n';
function arizaText(kind){
  if(kind==='tanlash')return HI+'Model: '+$('#pk-sel').textContent+'\n'+$('#pk-pay').textContent+'\nSoni: '+(($('#pk-q').qty||{}).value==='99'?'20 dan ko‘p':({1:'1',5:'2-5',20:'6-20'})[($('#pk-q').qty||{}).value]||'1');
  if(kind==='narx')return HI+'ISUZU D-MAX IRBIS LSE narxini bilmoqchiman.\nRang: '+paintName+', disklar: '+rimName+'.';
  if(kind==='testdrayv')return HI+'ISUZU D-MAX IRBIS LSE test-drayviga yozilmoqchiman.\nRang: '+paintName+'.';
  if(kind==='kredit')return HI+'Muddatli to‘lov (24 oygacha, 0%, Mikrokreditbank) bo‘yicha ariza.';
  return HI+'Texnika bo‘yicha maslahat kerak.'}
d.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-ariza]');if(!b)return;e.preventDefault();var k=b.getAttribute('data-ariza');azOpen(k.indexOf('m:')===0?HI+'Model: '+k.slice(2):arizaText(k),b)});
if(az){$('#az-x').addEventListener('click',azClose);az.addEventListener('click',function(e){if(e.target===az)azClose()});
  $('#az-cp').addEventListener('click',function(){var t=$('#az-m').textContent,b=this;(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){b.textContent='Nusxalandi'},function(){b.textContent='Nusxalab bo‘lmadi'})})}

/* Окно техники: живая сцена (зашифрованное видео), цифры полосками, модели. */
var fv=$('#fv'),fvLast=null,fvT=[],fvU={};
function fvClear(){fvT.forEach(clearTimeout);fvT=[]}
function fvVid(f){return fvU[f]||(fvU[f]=fetch(f).then(function(r){if(!r.ok)throw 0;return r.arrayBuffer()})
  .then(function(b){return unseal(b,'video/mp4')}).then(function(b){return URL.createObjectURL(b)},function(e){delete fvU[f];throw e}))}
function fvOpen(k,from){var K=kindOf(k);if(!K||!fv)return;fvLast=from;fvClear();
  var v=$('#fv-v'),tall=innerHeight>innerWidth,base=site.img+'/fleet/'+K.key;
  $('#fv-k').textContent=K.title;$('#fv-h').textContent=K.lead;$('#fv-w').textContent=K.where;
  $('#fv-b').innerHTML=K.bars.map(function(b,i){return'<li style="--i:'+i+'"><small>'+b[0]+'</small><b data-n="'+b[1]+'" data-u="'+b[3].replace(/^[\d ]+/,'')+'">'+b[3]+'</b><i style="--v:0%" data-v="'+Math.min(100,b[1]/b[2]*100).toFixed(1)+'%"></i></li>'}).join('');
  $('#fv-t').innerHTML=K.tags.map(function(t){return'<li>'+t+'</li>'}).join('');
  var list=CAT.items.filter(function(i){return i.cat===k});
  $('#fv-mh').textContent=list.length+' ta model';
  $('#fv-ml').innerHTML=list.map(function(it,i){return'<li style="--i:'+i+'"><button type="button" data-ariza="m:'+it.title.replace(/"/g,'')+'"><img src="'+site.img+'/cat/'+it.n+'.webp" alt="" loading="lazy" width="320" height="200"><span><b>'+it.title.replace(/ shassisi (negizidagi|negizida|asosidagi) /,' · ')+'</b><small>'+specOf(it)+'</small></span></button></li>'}).join('');
  v.poster=base+(tall?'-9.webp':'-16.webp');v.removeAttribute('src');
  var go=function(){if(!v.src||!fv.classList.contains('live'))return;var p=v.play();if(p&&p.catch)p.catch(function(){})};
  fvVid(base+(tall?'-9.bin':'-16.bin')).then(function(u){if(fvLast!==from||fv.hidden)return;v.src=u;go()},function(){});
  fv.classList.remove('live','show');fv.hidden=false;root.classList.add('lock-fv');$('.fv-p',fv).scrollTop=0;
  fvT.push(setTimeout(function(){fv.classList.add('live');go()},RM?0:120));
  fvT.push(setTimeout(function(){fv.classList.add('show');bars()},RM?0:420));
  function bars(){$$('#fv-b i').forEach(function(i){i.style.setProperty('--v',i.getAttribute('data-v'))});if(RM)return;
    $$('#fv-b b').forEach(function(b){var n=+b.getAttribute('data-n'),t0=performance.now(),D=1200;
      (function tick(t){var q=Math.min(1,(t-t0)/D);q=1-Math.pow(1-q,3);b.textContent=nf(Math.round(n*q))+' '+b.getAttribute('data-u');if(q<1)requestAnimationFrame(tick)})(t0)})}
  $('#fv-x').focus({preventScroll:true})}
function fvClose(){if(!fv||fv.hidden)return;fvClear();var v=$('#fv-v');fv.classList.remove('show','live');lnBack();
  fvT.push(setTimeout(function(){fv.hidden=true;v.pause();v.removeAttribute('src');v.load();root.classList.remove('lock-fv');if(fvLast)fvLast.focus({preventScroll:true})},420))}
if(fv){$('#fv-x').addEventListener('click',fvClose)}
addEventListener('keydown',function(e){if(e.key!=='Escape')return;if(az&&!az.hidden)azClose();else fvClose()});

/* Линейка: наведение высвечивает машину, нажатие — камера «ныряет» к ней,
   и открывается её окно. */
var lnSt=$('#ln-st'),lnIn=$('#ln-in');
function lnBack(){if(lnIn)lnIn.classList.remove('dive')}
$$('.ln-hs').forEach(function(b){var x=b.style.getPropertyValue('--x');
  b.addEventListener('pointerenter',function(){lnSt.style.setProperty('--sx',x);lnSt.classList.add('hl')});
  b.addEventListener('pointerleave',function(){lnSt.classList.remove('hl')});
  b.addEventListener('focus',function(){lnSt.style.setProperty('--sx',x);lnSt.classList.add('hl')});
  b.addEventListener('blur',function(){lnSt.classList.remove('hl')});
  b.addEventListener('click',function(){var k=b.getAttribute('data-k');if(RM){fvOpen(k,b);return}
    lnIn.style.transformOrigin=x+' '+b.style.getPropertyValue('--y');lnIn.classList.add('dive');setTimeout(function(){fvOpen(k,b)},380)})});
$$('.ln-cat').forEach(function(b){b.addEventListener('click',function(){fvOpen(b.getAttribute('data-k'),b)})});
/* Телефон листает панораму вбок: начинаем с D-MAX, подсказка гаснет после
   первого сдвига. */
if(lnSt){lnSt.addEventListener('scroll',function(){lnSt.classList.add('moved')},{passive:true,once:true})}

/* Подбор по задаче: правила по их каталогу, без модели. */
var pq=$('#pk-q');
function pkScore(it,a){var s=0,b=it.body||'',c=it.cat,L=it.kg||0,ch=it.chassis||'';
  if(a.what==='yuk')s+=(c==='yuk'&&/Furgon|Tentli|Bortli|Refrij/.test(b))?6:c==='yuk'?3:c==='pikap'&&!b?1:0;
  if(a.what==='odam')s+=c==='avtobus'?7:(c==='pikap'&&!b)?2:0;
  if(a.what==='suv')s+=/Suv|Yoqilg/.test(b)?7:0;
  if(a.what==='qurilish')s+=/Samosval|Kran/.test(b)?7:/Bortli|Tentli/.test(b)?3:0;
  if(a.what==='shahar')s+=(c==='maxsus'&&!/Suv|Yoqilg/.test(b))?7:/Suv/.test(b)?3:0;
  if(a.what!=='odam'&&L){var r={1:[0,1000],5:[1000,5000],10:[5000,10000],99:[10000,1e9]}[a.kg]||[0,1e9],m=Math.max(r[0],Math.min(r[1],L));s+=3-Math.min(3,Math.abs(Math.log(L/Math.max(m,1)))*2.5)}
  if(a.road==='city')s+=/^(NMR|NPR|NQR|NPS|LE60|HC45)/.test(ch)?2:0;
  if(a.road==='inter')s+=/^(FVR|HD50|CYZ)/.test(ch)?2:0;
  if(a.road==='off')s+=/D-MAX|CYZ|FVR34K|NPS/.test(ch)||it.wheels==='4x4'?2:0;
  return s}
function pkRun(){if(!pq)return;var a={};['what','kg','road','pay','qty'].forEach(function(n){a[n]=(pq[n]||{}).value});
  var kg=$('fieldset:nth-of-type(2)',pq);kg.disabled=a.what==='odam';kg.classList.toggle('off',a.what==='odam');
  var seen={},top=CAT.items.map(function(it){return{it:it,s:pkScore(it,a)}}).sort(function(x,y){return y.s-x.s}).filter(function(x){var t=x.it.title;if(seen[t])return false;seen[t]=1;return true}).slice(0,3);
  $('#pk-l').innerHTML=top.map(function(x,i){var it=x.it;return'<li style="--i:'+i+'"'+(i?'':' class="best"')+'>'+(i?'':'<em>Eng mos</em>')+'<img src="'+site.img+'/cat/'+it.n+'.webp" alt="" width="320" height="200" loading="lazy"><b>'+it.title.replace(/ shassisi (negizidagi|negizida|asosidagi) /,' · ')+'</b><span>'+specOf(it)+'</span></li>'}).join('');
  $('#pk-sel').textContent=top[0]?top[0].it.title:'';
  $('#pk-pay').textContent=({cash:'Naqd to‘lov',credit:'Muddatli to‘lov: 24 oygacha, 0%',tender:'Tender orqali: SamAuto tenderlar bo‘limi'})[a.pay]+(a.qty==='20'||a.qty==='99'?' · korporativ taklif':'')}
if(pq){pq.addEventListener('change',pkRun);pkRun()}

/* FVR: кузов меняется на том же кадре, по машине проходит свет, цифры
   догоняют. */
var fvr=$('#fvr'),FV=JSON.parse(($('#sa-fvr')||{}).textContent||'[]');
function countTo(el,n){if(RM){el.textContent=nf(n);return}var from=+el.textContent.replace(/\s/g,'')||0,t0=performance.now();
  (function tick(t){var q=Math.min(1,(t-t0)/700);q=1-Math.pow(1-q,3);el.textContent=nf(Math.round(from+(n-from)*q));if(q<1)requestAnimationFrame(tick)})(t0)}
$$('#fvr .seg button').forEach(function(b){b.addEventListener('click',function(){var k=b.getAttribute('data-k'),x=FV.filter(function(f){return f.k===k})[0];if(!x)return;
  $$('#fvr .seg button').forEach(function(o){o.setAttribute('aria-checked',o===b?'true':'false')});
  $$('.fv2-im',fvr).forEach(function(p){p.classList.toggle('on',p.getAttribute('data-k')===k)});
  var sw=$('.fv2-sw',fvr);sw.classList.remove('go');void sw.offsetWidth;sw.classList.add('go');
  countTo($('[data-n="hp"]',fvr),x.hp);countTo($('[data-n="load"]',fvr),x.load);countTo($('[data-n="weight"]',fvr),x.weight);$('#fv2-u').textContent=x.use})});

/* Дилеры: точки по их координатам, список, ближайший по геолокации. */
var dmap=$('#dl-map'),dlist=$('#dl-l'),DL=CAT.dealers.filter(function(x){return x.lat});
var X0=58.6,X1=73.4,Y0=42.8,Y1=36.8,LEFT={'Qoraqalpog‘iston Respublikasi':'t','Buxoro viloyati':'l','Sirdaryo viloyati':'l'};
function dlRender(reg){if(!dlist)return;dlist.innerHTML=CAT.dealers.filter(function(x){return x.name&&(!reg||x.region===reg)}).map(function(x){
  var i=CAT.dealers.indexOf(x),go=x.lat?'<a href="https://www.google.com/maps/dir/?api=1&amp;destination='+x.lat+','+x.lng+'" target="_blank" rel="noopener">Yo‘nalish</a>':'';
  return'<li data-i="'+i+'"><b>'+x.name+'</b><span>'+x.address+'</span><p><a href="tel:'+x.phone.replace(/[^\d+]/g,'')+'">'+x.phone+'</a>'+go+'</p></li>'}).join('');
  if(dmap)$$('.dl-pt',dmap).forEach(function(p){p.classList.toggle('dim',!!reg&&p.getAttribute('data-r')!==reg)})}
if(dmap){var seenR={};dmap.innerHTML=CAT.dealers.map(function(x,i){if(!x.lat)return'';var lbl=!seenR[x.region];seenR[x.region]=1;
  return'<button type="button" role="listitem" class="dl-pt" data-i="'+i+'" data-r="'+x.region+'" style="left:'+((x.lng-X0)/(X1-X0)*100).toFixed(2)+'%;top:'+((Y0-x.lat)/(Y0-Y1)*100).toFixed(2)+'%" aria-label="'+x.name+', '+x.region+'"><i></i>'+(lbl?'<span'+(LEFT[x.region]?' class="'+LEFT[x.region]+'"':'')+'>'+x.region.replace(/ viloyati| Respublikasi/,'')+'</span>':'')+'</button>'}).join('');
  dmap.addEventListener('click',function(e){var p=e.target.closest('.dl-pt');if(p)dlPick(+p.getAttribute('data-i'))})}
function dlPick(i,note){var li=$('#dl-l li[data-i="'+i+'"]');if(!li){$('#dl-reg').value='';dlRender('');li=$('#dl-l li[data-i="'+i+'"]')}
  $$('#dl-l li.on,.dl-pt.on').forEach(function(x){x.classList.remove('on')});if(li){li.classList.add('on');li.scrollIntoView({block:'nearest',behavior:RM?'auto':'smooth'})}
  var p=$('.dl-pt[data-i="'+i+'"]');if(p)p.classList.add('on');var s=$('#sv-d');if(s)s.selectedIndex=Math.max(0,DLuz.indexOf(CAT.dealers[i]));if(note&&li){var n=d.createElement('em');n.textContent=note;li.appendChild(n)}}
var DLuz=CAT.dealers.filter(function(x){return x.name});
if(dlist){dlRender('');$('#dl-reg').addEventListener('change',function(){dlRender(this.value)});
  dlist.addEventListener('pointerover',function(e){var li=e.target.closest('li');$$('.dl-pt.hv').forEach(function(x){x.classList.remove('hv')});if(li){var p=$('.dl-pt[data-i="'+li.getAttribute('data-i')+'"]');if(p)p.classList.add('hv')}})}
var geo=$('#dl-geo');if(geo)geo.addEventListener('click',function(){var s=$('span',geo);if(!navigator.geolocation){s.textContent='Joylashuv aniqlanmadi';return}s.textContent='Aniqlanmoqda…';
  navigator.geolocation.getCurrentPosition(function(p){var la=p.coords.latitude,lo=p.coords.longitude,best=-1,bd=1e9;
    CAT.dealers.forEach(function(x,i){if(!x.lat)return;var r=Math.PI/180,a=Math.sin((x.lat-la)*r/2),b=Math.sin((x.lng-lo)*r/2),k=2*6371*Math.asin(Math.sqrt(a*a+Math.cos(la*r)*Math.cos(x.lat*r)*b*b));if(k<bd){bd=k;best=i}});
    s.textContent='Eng yaqinini topish';if(best>=0)dlPick(best,'Sizdan '+Math.round(bd)+' km')},function(){s.textContent='Ruxsat berilmadi'},{timeout:8000,maximumAge:6e5})});
var svf=$('#sv-f');if(svf)svf.addEventListener('submit',function(e){e.preventDefault();var f=svf;
  azOpen(HI+'Servisga yozilish.\nModel: '+f.model.value+'\nXizmat: '+f.xizmat.value+'\nDiler: '+f.diler.value+'\nSana: '+f.sana.value,svf.querySelector('button'))});

/* D-MAX 360°: кадры стенда (turn.py) листаются пальцем; цвет кузова и
   дисков перекрашивает шейдер, новый цвет проходит по машине волной. */
var dm=$('#dm-st'),dcv=$('#dm-cv'),TT=JSON.parse(($('#sa-tt')||{}).textContent||'null');
if(dm&&dcv&&TT&&!CALM)(function(){
  var gl=null;try{gl=dcv.getContext('webgl',{premultipliedAlpha:false,antialias:false})}catch(e){}
  if(!gl){dm.classList.add('nogl');return}
  var tall=innerWidth<768,set=tall?'m':'d',N=TT.n,W=TT.wheel[set];
  var VS='attribute vec2 p;varying vec2 v;void main(){v=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}';
  var FS='precision mediump float;varying vec2 v;uniform sampler2D t;uniform vec3 pa,pb,ra,rb;uniform float pk,rk,lr,lg,qa,qb;'+
    'vec3 hsv(vec3 c){vec4 K=vec4(0.,-1./3.,2./3.,-1.);vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));float d=q.x-min(q.w,q.y);return vec3(abs(q.z+(q.w-q.y)/(6.*d+1e-6)),d/(q.x+1e-6),q.x);}'+
    'vec3 lin(vec3 c){return pow(c,vec3(2.2));}vec3 srgb(vec3 c){return pow(clamp(c,0.,1.),vec3(1./2.2));}'+
    'float edge(float k){float e=k*1.5-.25;return 1.-smoothstep(e-.12,e+.12,v.x);}'+
    'vec3 paint(vec3 l,vec3 tc,float ref){float y=dot(l,vec3(.2126,.7152,.0722));float s=y/ref;vec3 o=tc*s;float m=max(max(o.r,o.g),o.b);o=o/(1.+max(0.,m-.85)*1.4);return o+max(0.,s-1.6)*.06;}'+
    'void main(){vec3 c=texture2D(t,vec2(v.x,v.y*.6667)).rgb;vec3 h=hsv(c);vec3 l=lin(c);'+
    'float mp=texture2D(t,vec2(v.x*.5,.6667+v.y*.3333)).r;mp=smoothstep(.08,.92,mp);'+
    'float mr=smoothstep(.2,.26,h.x)*(1.-smoothstep(.42,.5,h.x))*smoothstep(.25,.45,h.y)*smoothstep(.05,.12,h.z);'+
    'float ep=edge(pk),er=edge(rk);vec3 tp=mix(pa,pb,ep),tr=mix(ra,rb,er);'+
    'vec3 o=mix(l,mix(l,paint(l,tp,lr),mix(qa,qb,ep)),mp);o=mix(o,paint(l,tr,lg),mr);'+
    'float sh=exp(-pow((v.x-(pk*1.5-.25))/.035,2.))*mp*step(.001,pk)*step(pk,.999)+exp(-pow((v.x-(rk*1.5-.25))/.035,2.))*mr*step(.001,rk)*step(rk,.999);'+
    'gl_FragColor=vec4(srgb(o+sh*.35),1.);}';
  function sh(type,src){var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);return s}
  var pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);
  if(!gl.getProgramParameter(pr,gl.LINK_STATUS)){dm.classList.add('nogl');return}
  gl.useProgram(pr);var bf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,bf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  var ap=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(ap);gl.vertexAttribPointer(ap,2,gl.FLOAT,false,0,0);
  var tx=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tx);[gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T].forEach(function(w){gl.texParameteri(gl.TEXTURE_2D,w,gl.CLAMP_TO_EDGE)});
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  var U={};['pa','pb','ra','rb','pk','rk','lr','lg','qa','qb'].forEach(function(n){U[n]=gl.getUniformLocation(pr,n)});
  var hex=function(h){var n=parseInt(h.slice(1),16);return[Math.pow((n>>16&255)/255,2.2),Math.pow((n>>8&255)/255,2.2),Math.pow((n&255)/255,2.2)]};
  var P={qa:0,qb:0,pa:hex(TT.paint[0][2]),pb:hex(TT.paint[0][2]),pk:1,ra:hex(TT.rims[0][2]),rb:hex(TT.rims[0][2]),rk:1};
  gl.uniform1f(U.lr,TT.ref.paint);gl.uniform1f(U.lg,TT.ref.rim);

  /* Кадры: качаем все (сжатыми, ~5 МБ), распаковываем окном вокруг угла. */
  var blobs=new Array(N),bm={},nb=0,MAX=tall?14:18,cur=0,shown=-1,got=0,want=0,vel=0,raf=0,busy=0;
  function draw(){var i=((Math.round(cur)%N)+N)%N,b=bm[i];if(!b){var k=near(i);if(k<0)return;b=bm[k];i=k}
    if(i!==shown){gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,b);shown=i}
    gl.uniform3fv(U.pa,P.pa);gl.uniform3fv(U.pb,P.pb);gl.uniform1f(U.pk,P.pk);gl.uniform3fv(U.ra,P.ra);gl.uniform3fv(U.rb,P.rb);gl.uniform1f(U.rk,P.rk);gl.uniform1f(U.qa,P.qa);gl.uniform1f(U.qb,P.qb);
    gl.viewport(0,0,dcv.width,dcv.height);gl.drawArrays(gl.TRIANGLE_STRIP,0,4)}
  function near(i){for(var s=1;s<N/2;s++){var a=(i+s)%N,b=(i-s+N)%N;if(bm[a])return a;if(bm[b])return b}return -1}
  function fit(){var r=Math.min(devicePixelRatio||1,2),w=Math.round(dcv.clientWidth*r),h=Math.round(dcv.clientHeight*r);if(dcv.width!==w||dcv.height!==h){dcv.width=w;dcv.height=h;shown=-1}}
  function pump(){while(busy<2){var i=((Math.round(cur)%N)+N)%N,u=-1;for(var s=0;s<8&&u<0;s++){[i+s,i-s].forEach(function(j){j=(j+N)%N;if(u<0&&blobs[j]&&!bm[j]&&!pend[j])u=j})}if(u<0)return;dec(u)}}
  var pend={};function dec(u){busy++;pend[u]=1;createImageBitmap(blobs[u]).then(function(b){bm[u]=b;nb++;busy--;pend[u]=0;trim();tick()},function(){busy--;pend[u]=0})}
  function trim(){var i=((Math.round(cur)%N)+N)%N;while(nb>MAX){var w=-1,wd=-1;for(var k in bm){var dd=Math.min(Math.abs(k-i),N-Math.abs(k-i));if(+k!==shown&&dd>wd){wd=dd;w=k}}if(w<0)return;if(bm[w].close)bm[w].close();delete bm[w];nb--}}
  function tick(){if(!raf)raf=requestAnimationFrame(loop)}
  function loop(){raf=0;var moving=false;
    if(!touched&&!RM&&hintOn&&inView){var t=performance.now()/1000;cur=Math.sin(t*1.6)*3;moving=true;hand(Math.sin(t*1.6))}
    else if(Math.abs(vel)>.02){cur+=vel;vel*=.92;moving=true}
    var a=anim();pump();draw();if(rg)rg.value=((Math.round(cur)%N)+N)%N;if(moving||a)tick()}
  var lb=$('#dm-lb');
  function load(){var next=0,inFlight=0;function one(){if(next>=N)return;var i=next++;inFlight++;
      fetch(site.img+'/tt/'+set+'/'+(i<10?'0':'')+i+'.bin').then(function(r){if(!r.ok)throw 0;return r.arrayBuffer()}).then(function(b){return unseal(b,'image/webp')})
      .then(function(b){blobs[i]=b;got++;if(lb)lb.style.transform='scaleX('+(got/N).toFixed(3)+')';if(got>=Math.min(N,8)&&!dm.classList.contains('ready')){fit();dm.classList.add('ready')}pump();tick()},function(){})
      .then(function(){inFlight--;one()})}
    for(var j=0;j<4;j++)one()}
  /* Подсказка: рука водит пальцем, машина чуть качается — до первого касания. */
  var hint=$('#dm-hint'),hb=$('.dm-hand',hint),touched=false,hintOn=true;
  function hand(s){if(hb)hb.style.transform='translateX('+(s*34).toFixed(1)+'px) rotate('+(s*-8).toFixed(1)+'deg)'}
  function touch(){if(touched)return;touched=true;hint.classList.add('off');setTimeout(function(){hintOn=false},400)}
  var drag=null;
  dm.addEventListener('pointerdown',function(e){if(e.target.closest('button,input'))return;touch();drag={x:e.clientX,c:cur,t:performance.now(),lx:e.clientX};vel=0;dm.classList.add('grab');try{dm.setPointerCapture(e.pointerId)}catch(_){}});
  dm.addEventListener('pointermove',function(e){if(!drag)return;var per=dm.clientWidth*1.1/N,now=performance.now();cur=drag.c-(e.clientX-drag.x)/per;
    var dt=Math.max(8,now-drag.t);vel=-(e.clientX-drag.lx)/per*(16/dt);drag.t=now;drag.lx=e.clientX;tick()});
  function up(){if(!drag)return;drag=null;dm.classList.remove('grab');if(RM)vel=0;tick()}
  dm.addEventListener('pointerup',up);dm.addEventListener('pointercancel',up);
  var rg=$('#dm-rg');rg.max=N-1;rg.addEventListener('input',function(){touch();vel=0;cur=+rg.value;tick()});
  $$('.dm-ar',dm).forEach(function(b){b.addEventListener('click',function(){touch();vel=+b.getAttribute('data-step')*(RM?0:.9);if(RM)cur+=+b.getAttribute('data-step')*4;tick()})});
  dm.addEventListener('keydown',function(e){if(e.key==='ArrowLeft'||e.key==='ArrowRight'){if(e.target===rg)return;touch();cur+=e.key==='ArrowLeft'?-2:2;tick()}});
  /* Смена цвета: прошлый → новый волной слева направо, 1,1 с. */
  var tw=[];function anim(){var now=performance.now(),on=false;tw=tw.filter(function(a){var q=Math.min(1,(now-a.t0)/a.d);q=q<.5?2*q*q:1-Math.pow(-2*q+2,2)/2;P[a.k]=q;if(q<1){on=true;return true}return false});return on}
  function to(kind,c,orig){var a=kind==='p'?'pa':'ra',b=kind==='p'?'pb':'rb',k=kind==='p'?'pk':'rk',q=P[k];if(kind==='p'){P.qa=P.qa+(P.qb-P.qa)*q;P.qb=orig?0:1}
    P[a]=[0,1,2].map(function(j){return P[a][j]+(P[b][j]-P[a][j])*q});P[b]=hex(c);P[k]=RM?1:0;if(!RM)tw=tw.filter(function(x){return x.k!==k}).concat([{k:k,t0:performance.now(),d:1100}]);tick()}
  $$('[data-paint]').forEach(function(b){b.addEventListener('click',function(){$$('[data-paint]').forEach(function(o){o.setAttribute('aria-checked',o===b?'true':'false')});
    var p=TT.paint.filter(function(x){return x[0]===b.getAttribute('data-paint')})[0];paintName=p[1];$('#dm-pn').textContent=p[1];to('p',p[2],p===TT.paint[0])})});
  /* Диски: камера подходит к ближнему колесу, пока новый цвет проходит по диску. */
  var zoomT=0;
  $$('[data-rim]').forEach(function(b){b.addEventListener('click',function(){$$('[data-rim]').forEach(function(o){o.setAttribute('aria-checked',o===b?'true':'false')});
    var r=TT.rims.filter(function(x){return x[0]===b.getAttribute('data-rim')})[0];rimName=r[1];to('r',r[2]);
    if(RM)return;var i=((Math.round(cur)%N)+N)%N,w=W[i];if(!w)return;clearTimeout(zoomT);dcv.style.transformOrigin=(w[0]*100).toFixed(1)+'% '+(w[1]*100).toFixed(1)+'%';dm.classList.add('zoom');
    if(dm.getBoundingClientRect().top<0||dm.getBoundingClientRect().bottom>innerHeight)dm.scrollIntoView({block:'center',behavior:'smooth'});
    zoomT=setTimeout(function(){dm.classList.remove('zoom')},2200)})});
  addEventListener('resize',function(){fit();draw()});
  if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){io.disconnect();load();tick()}},{rootMargin:'600px'});io.observe(dm)}else load();
  var inView=false,vis=new IntersectionObserver(function(es){inView=es[0].isIntersecting;if(inView)tick()});vis.observe(dm);
})();
