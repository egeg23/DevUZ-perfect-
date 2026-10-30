/* Заявки рабочего сайта: вместо демо-состояния в браузере (store.js
   макета) — сервер клиники. SY.send кладёт заявку в базу (/api/lead),
   оттуда она идёт в админку, в amoCRM и сотрудникам в Telegram. В браузере
   пациента остаются только номер заявки и ключ к её статусу: статус,
   который ставит администратор, сайт спрашивает раз в минуту. */
(function(){
'use strict';
var KEY='sy-lead-1',FINAL={came:1,canceled:1},mem=null;
function load(){if(mem)return mem;try{mem=JSON.parse(localStorage.getItem(KEY))}catch(e){}return mem}
function save(r){mem=r;try{localStorage.setItem(KEY,JSON.stringify(r))}catch(e){}fire()}
function fire(){try{document.dispatchEvent(new CustomEvent('sy:change'))}catch(e){}}
function poll(){var r=load();if(!r||!r.key||FINAL[r.status]||Date.now()-r.at>30*864e5||document.hidden)return;
  fetch('/api/lead/'+r.id+'?k='+encodeURIComponent(r.key),{cache:'no-store'}).then(function(x){return x.ok?x.json():null}).then(function(j){
    if(j&&j.status&&j.status!==r.status){r.status=j.status;save(r)}}).catch(function(){})}
window.SY={
  live:true,
  /* lead: {src, name, phone, what, wish, website}; ответ — номер заявки. */
  send:function(lead){return fetch('/api/lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(lead)})
    .then(function(r){return r.json().catch(function(){return{}}).then(function(j){if(!r.ok)throw new Error(j.error||'Не получилось отправить. Позвоните нам, пожалуйста');return j})})
    .then(function(j){var id=String(j.id||'');if(id&&id!=='0')save({id:id,key:j.key,status:'new',at:Date.now()});return id})},
  lead:function(id){var r=load();return r&&r.id===id?r:null}
};
setInterval(poll,60000);document.addEventListener('visibilitychange',poll);setTimeout(poll,1500);
})();
