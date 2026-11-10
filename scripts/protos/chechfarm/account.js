/* Кабинет партнёра и клиента на боевом сайте CZECHFARM (только CF_PROD).
   Вход и регистрация по почте и паролю; кука HttpOnly ставит сервер,
   здесь только формы и список своих обращений. Подписи — K.acc. */
(function(){
var d=document,K=JSON.parse(d.getElementById('cf-data').textContent),A=K.acc;if(!A)return;
function $(s,r){return (r||d).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function pad(n){return (n<10?'0':'')+n}
function day(ts){var x=new Date(ts);return pad(x.getDate())+'.'+pad(x.getMonth()+1)+'.'+x.getFullYear()}
function post(path,body){return fetch('/api/acc/'+path,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{})}).then(function(r){return r.json().catch(function(){return {}}).then(function(j){if(!r.ok)throw j;return j})})}
var box=$('#acc-app');if(!box)return;
var views={auth:$('#acc-auth'),cab:$('#acc-cab')};
function show(v){views.auth.hidden=v!=='auth';views.cab.hidden=v!=='cab'}
function err(f,msg){var e=$('.acc-err',f);if(e)e.textContent=msg||''}
/* Вкладки «Вход» / «Регистрация». */
$$('[data-acc-tab]').forEach(function(b){b.addEventListener('click',function(){var t=b.getAttribute('data-acc-tab');$$('[data-acc-tab]').forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});$('#acc-login').hidden=t!=='login';$('#acc-reg').hidden=t!=='reg'})});
/* Партнёр: компания обязательна. */
var org=$('#acc-reg [name="org"]');
$$('#acc-reg [name="kind"]').forEach(function(r){r.addEventListener('change',function(){if(org)org.required=r.value==='partner'&&r.checked})});
function submit(f,path,extra){f.addEventListener('submit',function(e){e.preventDefault();err(f,'');var b={lang:K.lang};$$('[name]',f).forEach(function(el){if(el.type==='radio'){if(el.checked)b[el.name]=el.value}else if(el.type==='checkbox')b[el.name]=el.checked;else b[el.name]=el.value.trim()});
  if(extra&&!extra(b,f))return;var btn=$('button[type="submit"]',f);btn.disabled=true;
  post(path,b).then(function(){btn.disabled=false;load()},function(j){btn.disabled=false;err(f,(j&&j.error)||A.fail)})})}
submit($('#acc-login'),'login');
submit($('#acc-reg'),'register',function(b,f){if(!b.kind){err(f,A.needKind);return false}if(!b.agree){err(f,A.needAgree);return false}if(String(b.pass).length<8){err(f,A.shortPass);return false}return true});
$('#acc-out').addEventListener('click',function(){post('logout').then(function(){show('auth')})});
$('#acc-tg').addEventListener('click',function(){post('tg').then(function(j){location.href=j.url},function(j){alert((j&&j.error)||A.fail)})});
function load(){fetch('/api/acc/me',{credentials:'same-origin'}).then(function(r){if(r.status===401){show('auth');return null}return r.json()}).then(function(me){if(!me)return;show('cab');
  $('#acc-hi').textContent=fill(A.hi,{n:me.name});
  $('#acc-kind').textContent=me.kind==='partner'?A.partner:A.client;
  var st=$('#acc-st');st.textContent=A.st[me.status]||me.status;st.className='chip'+(me.status==='pending'?' warn':'');
  $('#acc-pend').hidden=me.status!=='pending';
  $('#acc-tg').hidden=!!me.tg;$('#acc-tg-ok').hidden=!me.tg;
  $('#acc-leads').innerHTML=me.leads.length?me.leads.map(function(l){return '<div class="tr"><div class="tr-h"><b>'+h(l.no)+' · '+h(K.kinds[l.kind]||l.kind)+'</b><span>'+day(l.at)+'</span></div><p class="tr-l">'+h(K.status)+': <b>'+h(K.st[l.status]||l.status)+'</b></p>'+(l.msg?'<p class="note">'+h(l.msg)+'</p>':'')+'</div>'}).join(''):'<p class="note">'+h(A.noLeads)+'</p>';
  var f=$('#acc-new form');if(f){var n=$('[name="name"]',f);if(n&&!n.value)n.value=me.name;var e=$('[name="email"]',f);if(e&&!e.value)e.value=me.email;var o=$('[name="org"]',f);if(o&&!o.value)o.value=me.org}
}).catch(function(){show('auth')})}
function fill(s,o){return String(s).replace(/\{(\w+)\}/g,function(_,k){return o[k]==null?'':o[k]})}
load();
})();
