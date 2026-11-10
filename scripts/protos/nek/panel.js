/* Panel of Nek Dental Studio in the mockup (Greenwell reference). Shares
   state with the site through localStorage nk-demo-1: a booking from the
   site comes first, the status set here is what the patient sees there.
   Demo numbers come from one seed. No model, no outside requests. */
(function(){
'use strict';
var d=document,$=function(s,r){return(r||d).querySelector(s)},$$=function(s,r){return[].slice.call((r||d).querySelectorAll(s))};
var P=JSON.parse($('#pn-data').textContent),U=P.ui;
function get(k,def){try{var v=localStorage.getItem(k);return v?JSON.parse(v):def}catch(e){return def}}
function put(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var KEY='nk-demo-1';
function load(){var s=get(KEY,null);return s&&s.v===1?s:{v:1,leads:[],log:[]}}
function save(s){put(KEY,s)}
var role=get('nk-role-1','doc'),tab=get('nk-tab-1','sum');

/* Demo from one seed: 14 days of bookings, sources, today's visits. */
var z=20261110;function rnd(){z=(z*16807)%2147483647;return z/2147483647}
var DAYS=[];for(var i=0;i<14;i++)DAYS.push(3+Math.round(rnd()*6));
var SRC=[['s_site',0],['s_ig',0],['s_call',0],['s_quiz',0],['s_trip',0]];
DAYS.forEach(function(n){for(var k=0;k<n;k++){var r=rnd();SRC[r<.34?0:r<.62?1:r<.82?2:r<.93?3:4][1]++}});
var WEEK=DAYS.slice(7).reduce(function(a,b){return a+b},0),PREV=DAYS.slice(0,7).reduce(function(a,b){return a+b},0);
var SLOT=['11:00','12:30','14:00','15:30','17:00','18:00'];
var DEMO=[];for(i=0;i<7;i++){var nm=P.names[i%P.names.length]+(i===3?' · '+P.trap:'');DEMO.push({id:'d'+i,name:nm,phone:'+995 5•• ••• '+(10+Math.round(rnd()*89)),svc:P.svc[Math.floor(rnd()*P.svc.length)].id,when:P.wd[(i%6)+1]+' '+SLOT[i%6],src:SRC[i%5][0],status:['ok','new','came','ok','new','ok','no'][i],demo:true,doc:i%P.docs.length})}
var AVG=/*~*/180;

function svcName(id){var s=P.svc.filter(function(x){return x.id===id})[0];return s?s.n:id}
function pill(st){return'<span class="pl pl-'+st+'">'+esc(U['st_'+st])+'</span>'}
function all(){return load().leads.concat(DEMO)}
function note(t){var s=load();s.log.unshift({at:Date.now(),who:role==='doc'?U.r_doc:U.r_adm,t:t});s.log.length=Math.min(s.log.length,100);save(s)}
function setStatus(id,st){var s=load(),l=s.leads.filter(function(x){return x.id===id})[0];
  if(l){l.status=st;l.log=l.log||[];l.log.push({at:Date.now(),who:role,st:st});save(s)}else{var dm=DEMO.filter(function(x){return x.id===id})[0];if(dm)dm.status=st}
  var who=l?l.name:(DEMO.filter(function(x){return x.id===id})[0]||{}).name;note(U['note_'+st]+': '+who);render()}

function shell(body){
  var tabs=[['sum',U.tab_sum],['req',U.tab_req],['cal',U.tab_cal],['log',U.tab_log]];
  var nw=all().filter(function(l){return l.status==='new'}).length;
  return'<header class="pn-top">'+P.mark+'<div><b>Nek Dental Studio</b><small>'+U.title+' · '+U.demo+'</small></div>'+
    '<label class="pn-role"><span>'+U.role+'</span><select id="role"><option value="doc"'+(role==='doc'?' selected':'')+'>'+U.r_doc+'</option><option value="adm"'+(role==='adm'?' selected':'')+'>'+U.r_adm+'</option></select></label>'+
    '<a class="btn btn-l btn-s" href="'+P.site+'">'+U.openSite+'</a><a class="btn btn-l btn-s pn-back" href="'+P.home+'">'+U.back+'</a></header>'+
    '<nav class="pn-tabs" aria-label="'+U.title+'">'+tabs.map(function(t){return'<button type="button" data-tab="'+t[0]+'" aria-pressed="'+(tab===t[0])+'">'+t[1]+(t[0]==='req'&&nw?'<i>'+nw+'</i>':'')+'</button>'}).join('')+'</nav>'+
    '<main class="pn-main">'+body+'</main>'}

function sum(){
  var site=load().leads,mx=Math.max.apply(null,DAYS),pc=Math.round((WEEK-PREV)/PREV*100),came=all().filter(function(l){return l.status==='came'}).length+Math.round(WEEK*.6);
  var nw=all().filter(function(l){return l.status==='new'}).length,tot=SRC.reduce(function(a,b){return a+b[1]},0);
  return'<div class="kp">'+
    '<div class="card"><small>'+U.week+'</small><b>'+(WEEK+site.length)+'</b><span class="'+(pc>=0?'up':'dn')+'">'+(pc>=0?'+':'')+pc+'% '+U.vs+'</span></div>'+
    '<div class="card"><small>'+U.site+'</small><b>'+(SRC[0][1]+site.length)+'</b><span>'+U.demo+'</span></div>'+
    '<div class="card"><small>'+U.came+'</small><b>'+came+'</b></div>'+
    '<div class="card'+(role==='doc'?'':' lock')+'"><small>'+U.rev+'</small><b>'+(role==='doc'?(came*AVG).toLocaleString('en').replace(/,/g,' ')+' ₾':'•••')+'</b><span>'+(role==='doc'?U.demo:U.revHide)+'</span></div></div>'+
    '<div class="grid2"><div class="card"><h3>'+U.days14+'</h3><div class="bars">'+DAYS.map(function(n,i){return'<i style="height:'+Math.round(n/mx*100)+'%" title="'+n+'"></i>'}).join('')+'</div></div>'+
    '<div class="card"><h3>'+U.src+'</h3>'+SRC.map(function(s){var k=Math.round(s[1]/tot*100);return'<div class="src"><span>'+U[s[0]]+'</span><b>'+k+'%</b><i style="transform:scaleX('+(k/100)+')"></i></div>'}).join('')+'</div></div>'+
    (nw?'<div class="card attn"><b>'+U.attn+'</b><span>'+nw+' '+U.attn1+'</span><button type="button" class="btn btn-a btn-s" data-tab="req">'+U.tab_req+'</button></div>':'')}

function req(){var ls=all(),site=load().leads;
  return(site.length?'':'<p class="card mu">'+U.empty+'</p>')+'<div class="card tbl"><div class="tr th"><span>'+U.who+'</span><span>'+U.what+'</span><span>'+U.when+'</span><span>'+U.stt+'</span><span></span></div>'+
  ls.map(function(l){var act=l.status==='new'?'<button type="button" class="btn btn-a btn-s" data-st="ok" data-id="'+l.id+'">'+U.a_ok+'</button>':l.status==='ok'?'<button type="button" class="btn btn-l btn-s" data-st="came" data-id="'+l.id+'">'+U.a_came+'</button>':'';
    if(l.status==='new'||l.status==='ok')act+='<button type="button" class="btn btn-l btn-s" data-st="no" data-id="'+l.id+'">'+U.a_no+'</button>';
    return'<div class="tr'+(l.demo?'':' fresh')+'"><span><b>'+esc(l.name)+'</b><small>'+esc(l.demo?l.phone:l.phone)+(l.demo?'':' · '+U.fresh)+'</small></span><span>'+esc(svcName(l.svc))+(l.note?'<small>'+esc(l.note)+'</small>':'')+'</span><span>'+esc(l.when)+'</span><span>'+pill(l.status)+'</span><span class="acts">'+act+'</span></div>'}).join('')+'</div>'}

function cal(){var busy={};all().forEach(function(l,i){if(l.status==='no')return;busy[(l.doc!=null?l.doc:i%P.docs.length)+'|'+l.when]=l});
  var days=P.wd.slice(1,7);
  return'<div class="card cal"><div class="cr ch"><span>'+U.doctor+'</span>'+days.map(function(x){return'<span>'+x+'</span>'}).join('')+'</div>'+
  P.docs.map(function(dc,di){return'<div class="cr"><span><b>'+esc(dc.n)+'</b><small>'+esc(dc.r)+'</small></span>'+days.map(function(x){var n=0,h='';SLOT.forEach(function(s){var l=busy[di+'|'+x+' '+s];if(l){n++;h+='<i class="'+(l.demo?'':'me')+'" title="'+esc(s+' '+l.name)+'">'+s+'</i>'}});return'<span>'+(h||'<em>'+U.free+'</em>')+'</span>'}).join('')+'</div>'}).join('')+'</div>'}

function log(){var s=load().log;return'<div class="card"><h3>'+U.hist+'</h3>'+(s.length?s.map(function(e){return'<p class="lg"><small>'+new Date(e.at).toLocaleString()+'</small><b>'+esc(e.who)+'</b> '+esc(e.t)+'</p>'}).join(''):'<p class="mu">'+U.empty+'</p>')+'<button type="button" class="btn btn-l btn-s" id="reset">'+U.reset+'</button></div>'}

function render(){
  var body=tab==='req'?req():tab==='cal'?cal():tab==='log'?log():sum();
  $('#app').innerHTML=shell(body);
  $$('[data-tab]').forEach(function(b){b.addEventListener('click',function(){tab=b.getAttribute('data-tab');put('nk-tab-1',tab);render()})});
  $$('[data-st]').forEach(function(b){b.addEventListener('click',function(){setStatus(b.getAttribute('data-id'),b.getAttribute('data-st'))})});
  $('#role').addEventListener('change',function(e){role=e.target.value;put('nk-role-1',role);render()});
  var rs=$('#reset');if(rs)rs.addEventListener('click',function(){save({v:1,leads:[],log:[]});render()});
}
addEventListener('storage',function(e){if(e.key===KEY)render()});
render();
})();
