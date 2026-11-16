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
  /* 152-ФЗ: без отмеченного согласия заявка не уходит, сервер её тоже не примет. */
  send:function(lead){var box=document.getElementById(lead.src==='quiz'?'qz-ok':'bk-ok');
    if(box&&!box.checked){var l=box.closest('.pd-ok');if(l)l.classList.add('err');try{box.focus()}catch(e){}return Promise.reject(new Error('Отметьте согласие на обработку персональных данных: без него мы не можем принять заявку'))}
    /* Запись из карточки врача («Наши врачи», team.js): врач — в пожелание к записи. */
    if(lead.src==='booking'&&window.SY_DOC)lead.wish=(lead.wish?lead.wish+'; ':'')+'врач: '+window.SY_DOC;
    lead.consent=true;try{lead.pdv=JSON.parse(document.getElementById('sy-site').textContent).pdv||''}catch(e){}
    return fetch('/api/lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(lead)})
    .then(function(r){return r.json().catch(function(){return{}}).then(function(j){if(!r.ok)throw new Error(j.error||'Не получилось отправить. Позвоните нам, пожалуйста');return j})})
    .then(function(j){var id=String(j.id||'');if(id&&id!=='0')save({id:id,key:j.key,status:'new',at:Date.now()});return id})},
  lead:function(id){var r=load();return r&&r.id===id?r:null}
};
setInterval(poll,60000);document.addEventListener('visibilitychange',poll);setTimeout(poll,1500);
})();
