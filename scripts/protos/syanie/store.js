/* Общее состояние демо: сайт, чат и панель клиники видят одно и то же.
   Живёт в браузере (localStorage `sy-demo-1`), между вкладками сайта и
   панели — через событие storage. На боевом сайте это база клиники.
   Заявка: {id, at, name, phone, what, when, src: booking|quiz|chat,
   status: new|confirmed|came|canceled, amo: {deal, at}|null, log: []}.
   Чат: {id, at, mode: ai|tg, name, msgs: [{from: user|ai|manager, text, at}]}. */
(function(){
'use strict';
var KEY='sy-demo-1',mem=null;
function blank(){return{leads:[],chats:[],log:[],v:1}}
function load(){if(mem)return mem;try{mem=JSON.parse(localStorage.getItem(KEY))}catch(e){}if(!mem||mem.v!==1)mem=blank();return mem}
function save(){try{localStorage.setItem(KEY,JSON.stringify(mem))}catch(e){}fire()}
function fire(){try{document.dispatchEvent(new CustomEvent('sy:change'))}catch(e){}}
function uid(p){return p+'-'+Date.now().toString(36).slice(-5)+Math.random().toString(36).slice(2,5)}
addEventListener('storage',function(e){if(e.key===KEY){mem=null;fire()}});
window.SY={
  get:load,
  set:function(fn){fn(load());save()},
  addLead:function(l){var s=load();l.id=uid('z');l.at=Date.now();l.status=l.status||'new';l.amo=null;l.log=[{at:l.at,who:'сайт',t:'Заявка с сайта'}];s.leads.unshift(l);save();return l.id},
  lead:function(id){return load().leads.filter(function(l){return l.id===id})[0]||null},
  addChat:function(c){var s=load();c.id=uid('c');c.at=Date.now();c.msgs=c.msgs||[];s.chats.unshift(c);save();return c.id},
  chat:function(id){return load().chats.filter(function(c){return c.id===id})[0]||null},
  push:function(id,from,text){var c=this.chat(id);if(!c)return;c.msgs.push({from:from,text:text,at:Date.now()});c.last=Date.now();save()},
  note:function(who,t){var s=load();s.log.unshift({at:Date.now(),who:who,t:t});if(s.log.length>200)s.log.length=200;save()},
  reset:function(){mem=blank();save()}
};
})();
