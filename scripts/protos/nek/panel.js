/* Panel of Nek Dental Studio in the mockup (Greenwell reference, sections as
   in the working Syanie Severa panel). Shares state with the site through
   localStorage nk-demo-1: a booking from the site comes first, the status set
   here is what the patient sees there; the site chat lands in «Messages» and
   the reply from here shows up in the chat on the site. Messengers come
   through Wazzup, keys are typed in «Connections» and stay in this browser.
   Language switch keeps the same state. Demo numbers come from one seed.
   No model, no outside requests. */
(function(){
'use strict';
var d=document,$=function(s,r){return(r||d).querySelector(s)},$$=function(s,r){return[].slice.call((r||d).querySelectorAll(s))};
var P=JSON.parse($('#pn-data').textContent),U=P.ui;
function get(k,def){try{var v=localStorage.getItem(k);return v?JSON.parse(v):def}catch(e){return def}}
function put(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var KEY='nk-demo-1';
function load(){var s=get(KEY,null);s=s&&s.v===1?s:{v:1,leads:[],log:[]};s.chat=s.chat||[];s.th=s.th||{};return s}
function save(s){put(KEY,s)}
var role=get('nk-role-1','doc'),tab=get('nk-tab-1','sum'),cur=null;
function conn(){return get('nk-conn-1',{})}
function setConn(c){put('nk-conn-1',c)}
var toastT=0;function toast(m){var t=$('#pn-toast');if(!t)return;t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('on')},2400)}

/* Demo from one seed: 14 days of bookings, sources, today's visits. */
var z=20261110;function rnd(){z=(z*16807)%2147483647;return z/2147483647}
var DAYS=[];for(var i=0;i<14;i++)DAYS.push(3+Math.round(rnd()*6));
var SRC=[['s_site',0],['s_ig',0],['s_call',0],['s_quiz',0],['s_trip',0]];
DAYS.forEach(function(n){for(var k=0;k<n;k++){var r=rnd();SRC[r<.34?0:r<.62?1:r<.82?2:r<.93?3:4][1]++}});
var WEEK=DAYS.slice(7).reduce(function(a,b){return a+b},0),PREV=DAYS.slice(0,7).reduce(function(a,b){return a+b},0);
var SLOT=['11:00','12:30','14:00','15:30','17:00','18:00'];
var DEMO=[];for(i=0;i<7;i++){var nm=P.names[i%P.names.length]+(i===3?' · '+P.trap:'');DEMO.push({id:'d'+i,name:nm,phone:'+995 5•• ••• '+(10+Math.round(rnd()*89)),svc:P.svc[Math.floor(rnd()*P.svc.length)].id,when:P.wd[(i%6)+1]+' '+SLOT[i%6],src:SRC[i%5][0],status:['ok','new','came','ok','new','ok','no'][i],demo:true,doc:i%P.docs.length})}
var AVG=/*~*/180;

/* Channels: Wazzup brings WhatsApp, Instagram, Telegram and Viber; the site chat is ours. */
var CH={site:[U.ch_site,'#7a4f8f'],whatsapp:['WhatsApp','#1f9d55'],instagram:['Instagram','#c13584'],telegram:['Telegram','#229ed9'],viber:['Viber','#7360f2']};
function chTag(c){var x=CH[c]||[c,'#888'];return'<span class="chn" style="--c:'+x[1]+'">'+esc(x[0])+'</span>'}
function threads(){var s=load(),out=[];
  if(s.chat.length){var seen=(s.th.site||{}).seen||0,un=0;s.chat.forEach(function(m,i){if(i>=seen&&m.f==='p')un++});
    out.push({id:'site',ch:'site',name:U.m_visitor,svc:P.svc[0].id,m:s.chat.map(function(m){return[m.f==='p'?'p':m.f==='b'?'b':'a',m.t,m.at]}),un:un})}
  P.threads.forEach(function(t,k){var id='t'+k,st=s.th[id]||{};out.push({id:id,ch:t.ch,name:P.names[t.n%P.names.length],svc:t.svc,m:t.m.concat(st.add||[]),un:st.read?0:t.un})});
  return out}
function waiting(){return threads().filter(function(t){return t.un>0}).length}

function svcName(id){var s=P.svc.filter(function(x){return x.id===id})[0];return s?s.n:id}
function pill(st){return'<span class="pl pl-'+st+'">'+esc(U['st_'+st])+'</span>'}
function all(){return load().leads.concat(DEMO)}
function who(){return role==='doc'?U.r_doc:U.r_adm}
function note(t){var s=load();s.log.unshift({at:Date.now(),who:who(),t:t});s.log.length=Math.min(s.log.length,100);save(s)}
function setStatus(id,st){var s=load(),l=s.leads.filter(function(x){return x.id===id})[0];
  if(l){l.status=st;l.log=l.log||[];l.log.push({at:Date.now(),who:role,st:st});save(s)}else{var dm=DEMO.filter(function(x){return x.id===id})[0];if(dm)dm.status=st}
  var nm=l?l.name:(DEMO.filter(function(x){return x.id===id})[0]||{}).name;note(U['note_'+st]+': '+nm);render()}

function shell(body){
  var tabs=[['sum',U.tab_sum],['req',U.tab_req],['msg',U.tab_msg],['cal',U.tab_cal],['con',U.tab_con],['log',U.tab_log]];
  var nw=all().filter(function(l){return l.status==='new'}).length,wt=waiting();
  return'<header class="pn-top">'+P.mark+'<div><b>Nek Dental Studio</b><small>'+U.title+' · '+U.demo+'</small></div>'+
    '<nav class="pn-lang" aria-label="'+U.lang+'">'+P.langs.map(function(x){return'<a href="'+x.h+'" hreflang="'+x.l+'" lang="'+x.l+'"'+(x.on?' aria-current="true"':'')+'>'+x.k+'</a>'}).join('')+'</nav>'+
    '<label class="pn-role"><span>'+U.role+'</span><select id="role"><option value="doc"'+(role==='doc'?' selected':'')+'>'+U.r_doc+'</option><option value="adm"'+(role==='adm'?' selected':'')+'>'+U.r_adm+'</option></select></label>'+
    '<a class="btn btn-l btn-s" href="'+P.site+'">'+U.openSite+'</a><a class="btn btn-l btn-s pn-back" href="'+P.home+'">'+U.back+'</a></header>'+
    '<nav class="pn-tabs" aria-label="'+U.title+'">'+tabs.map(function(t){var c=t[0]==='req'?nw:t[0]==='msg'?wt:0;return'<button type="button" data-tab="'+t[0]+'" aria-pressed="'+(tab===t[0])+'">'+t[1]+(c?'<i>'+c+'</i>':'')+'</button>'}).join('')+'</nav>'+
    '<main class="pn-main">'+body+'</main><div class="pn-toast" id="pn-toast" role="status" aria-live="polite"></div>'}

function sum(){
  var site=load().leads,mx=Math.max.apply(null,DAYS),pc=Math.round((WEEK-PREV)/PREV*100),came=all().filter(function(l){return l.status==='came'}).length+Math.round(WEEK*.6);
  var nw=all().filter(function(l){return l.status==='new'}).length,tot=SRC.reduce(function(a,b){return a+b[1]},0),wt=waiting(),c=conn();
  var left=[['wz','Wazzup'],['tg','Telegram'],['crm','CRM']].filter(function(x){return!c[x[0]]}).map(function(x){return x[1]});
  return'<div class="kp">'+
    '<div class="card"><small>'+U.week+'</small><b>'+(WEEK+site.length)+'</b><span class="'+(pc>=0?'up':'dn')+'">'+(pc>=0?'+':'')+pc+'% '+U.vs+'</span></div>'+
    '<div class="card"><small>'+U.site+'</small><b>'+(SRC[0][1]+site.length)+'</b><span>'+U.demo+'</span></div>'+
    '<div class="card"><small>'+U.came+'</small><b>'+came+'</b></div>'+
    '<div class="card'+(role==='doc'?'':' lock')+'"><small>'+U.rev+'</small><b>'+(role==='doc'?(came*AVG).toLocaleString('en').replace(/,/g,' ')+' ₾':'•••')+'</b><span>'+(role==='doc'?U.demo:U.revHide)+'</span></div></div>'+
    (nw?'<div class="card attn"><b>'+U.attn+'</b><span>'+nw+' '+U.attn1+'</span><button type="button" class="btn btn-a btn-s" data-tab="req">'+U.tab_req+'</button></div>':'')+
    (wt?'<div class="card attn"><b>'+U.tab_msg+'</b><span>'+wt+' '+U.m_wait+'</span><button type="button" class="btn btn-a btn-s" data-tab="msg">'+U.tab_msg+'</button></div>':'')+
    (left.length?'<div class="card attn soft"><b>'+U.c_left+'</b><span>'+left.join(', ')+'</span><button type="button" class="btn btn-l btn-s" data-tab="con">'+U.tab_con+'</button></div>':'')+
    '<div class="grid2"><div class="card"><h3>'+U.days14+'</h3><div class="bars">'+DAYS.map(function(n){return'<i style="height:'+Math.round(n/mx*100)+'%" title="'+n+'"></i>'}).join('')+'</div></div>'+
    '<div class="card"><h3>'+U.src+'</h3>'+SRC.map(function(s){var k=Math.round(s[1]/tot*100);return'<div class="src"><span>'+U[s[0]]+'</span><b>'+k+'%</b><i style="transform:scaleX('+(k/100)+')"></i></div>'}).join('')+'</div></div>'}

function req(){var ls=all(),site=load().leads;
  return(site.length?'':'<p class="card mu">'+U.empty+'</p>')+'<div class="card tbl"><div class="tr th"><span>'+U.who+'</span><span>'+U.what+'</span><span>'+U.when+'</span><span>'+U.stt+'</span><span></span></div>'+
  ls.map(function(l){var act=l.status==='new'?'<button type="button" class="btn btn-a btn-s" data-st="ok" data-id="'+l.id+'">'+U.a_ok+'</button>':l.status==='ok'?'<button type="button" class="btn btn-l btn-s" data-st="came" data-id="'+l.id+'">'+U.a_came+'</button>':'';
    if(l.status==='new'||l.status==='ok')act+='<button type="button" class="btn btn-l btn-s" data-st="no" data-id="'+l.id+'">'+U.a_no+'</button>';
    return'<div class="tr'+(l.demo?'':' fresh')+'"><span><b>'+esc(l.name)+'</b><small>'+esc(l.phone||'')+(l.ch?' · '+esc((CH[l.ch]||[l.ch])[0]):l.demo?'':' · '+U.fresh)+'</small></span><span>'+esc(svcName(l.svc))+(l.note?'<small>'+esc(l.note)+'</small>':'')+'</span><span>'+esc(l.when)+'</span><span>'+pill(l.status)+'</span><span class="acts">'+act+'</span></div>'}).join('')+'</div>'}

/* Messages: list of conversations on the left, the conversation on the right.
   On the phone one at a time, «All conversations» goes back. */
function msg(){var ts=threads(),t=ts.filter(function(x){return x.id===cur})[0],c=conn();
  var list='<div class="ms-list">'+(ts.some(function(x){return x.ch==='site'})?'':'<p class="mu ms-hint">'+U.m_site0+'</p>')+ts.map(function(x){var last=x.m[x.m.length-1];
    return'<button type="button" class="ms-it'+(x.id===cur?' on':'')+'" data-th="'+x.id+'"><span class="ms-h"><b>'+esc(x.name)+'</b>'+chTag(x.ch)+'</span><span class="ms-l">'+esc(last?last[1]:'')+'</span>'+(x.un?'<i>'+x.un+'</i>':'')+'</button>'}).join('')+'</div>';
  var view=!t?'<div class="ms-view ms-none"><p class="mu">'+U.m_pick+'</p></div>':
    '<div class="ms-view"><div class="ms-top"><button type="button" class="btn btn-l btn-s ms-back" data-th="">'+U.m_back+'</button><b>'+esc(t.name)+'</b>'+chTag(t.ch)+'<button type="button" class="btn btn-a btn-s" id="ms-book">'+U.m_book+'</button></div>'+
    '<div class="ms-log" id="ms-log">'+t.m.map(function(m){return'<p class="mm mm-'+m[0]+'">'+(m[0]==='b'?'<small>'+U.m_bot+'</small>':'')+esc(m[1])+'</p>'}).join('')+'</div>'+
    (t.ch!=='site'&&!c.wz?'<p class="ms-warn">'+U.m_nowz+' <button type="button" class="lnk" data-tab="con">'+U.tab_con+'</button></p>':'')+
    '<form class="ms-form" id="ms-form"><label class="vh" for="ms-in">'+U.m_ph+'</label><input id="ms-in" autocomplete="off" maxlength="600" placeholder="'+U.m_ph+'"><button class="btn btn-a" type="submit">'+U.m_send+'</button></form>'+
    '<p class="mu ms-note">'+U.m_demo+'</p></div>';
  return'<div class="card ms'+(t?' open':'')+'">'+list+view+'</div>'}
function read(id){var s=load();if(id==='site'){s.th.site={seen:s.chat.length}}else{s.th[id]=s.th[id]||{};s.th[id].read=1}save(s)}
function reply(id,text){var s=load(),t=threads().filter(function(x){return x.id===id})[0];
  if(id==='site'){s.chat.push({f:'a',t:text,at:Date.now()});s.th.site={seen:s.chat.length}}else{s.th[id]=s.th[id]||{};(s.th[id].add=s.th[id].add||[]).push(['a',text]);s.th[id].read=1}
  save(s);note(U.note_msg+' '+(CH[t.ch]||[t.ch])[0]+': '+t.name)}
function bookFrom(id){var t=threads().filter(function(x){return x.id===id})[0],s=load();
  s.leads.unshift({id:'m'+Date.now().toString(36).slice(-6),at:Date.now(),name:t.name,phone:'',svc:t.svc,when:P.wd[2]+' '+SLOT[2],src:t.ch==='instagram'?'s_ig':'s_site',ch:t.ch,status:'new',note:t.m[0]?t.m[0][1].slice(0,90):'',log:[]});
  save(s);note(U.note_book+': '+t.name);toast(U.m_booked)}

/* Connections: keys are typed here once; only the head doctor changes them. */
function con(){var c=conn(),ro=role!=='doc';
  function box(k,title,text,how,extra){var on=!!c[k];
    return'<div class="card cn'+(on?' on':'')+'"><div class="cn-h"><h3>'+title+'</h3><span class="pl '+(on?'pl-ok':'')+'">'+(on?U.c_on:U.c_need)+'</span></div><p>'+text+'</p>'+
      (extra||'')+
      (ro?'':on?'<button type="button" class="btn btn-l btn-s" data-off="'+k+'">'+U.c_off+'</button>':
        '<form class="cn-f" data-con="'+k+'"><label class="vh" for="cn-'+k+'">'+U.c_key+'</label><input id="cn-'+k+'" autocomplete="off" spellcheck="false" placeholder="'+U.c_key+'" required><button class="btn btn-a btn-s" type="submit">'+U.c_save+'</button></form>')+
      '<details><summary>'+U.how+'</summary><p>'+how+'</p></details></div>'}
  var crm='<label class="cn-sel"><span>CRM</span><select id="cn-crm-k"'+(ro||c.crm?' disabled':'')+'><option value="amo"'+(c.crmk==='b24'?'':' selected')+'>amoCRM</option><option value="b24"'+(c.crmk==='b24'?' selected':'')+'>Bitrix24</option></select></label>';
  var rem='<div class="card cn'+(c.rem?' on':'')+'"><div class="cn-h"><h3>'+U.c_rem_t+'</h3><span class="pl '+(c.rem?'pl-ok':'')+'">'+(c.rem?U.c_on:U.c_need)+'</span></div><p>'+U.c_rem_e+'</p>'+
    (ro?'':!c.wz?'<p class="mu">'+U.c_need_wz+'</p>':'<button type="button" class="btn '+(c.rem?'btn-l':'btn-a')+' btn-s" id="cn-rem">'+(c.rem?U.c_turnoff:U.c_turn)+'</button>')+'</div>';
  return'<div class="card"><p>'+U.c_sub+'</p><p class="mu">'+U.c_demo+'</p>'+(ro?'<p class="ms-warn">'+U.c_ro+'</p>':'')+'</div>'+
    '<div class="cns">'+box('wz',U.c_wz_t,U.c_wz_e,U.c_wz_how)+box('tg',U.c_tg_t,U.c_tg_e,U.c_tg_how)+box('crm',U.c_crm_t+(c.crm?' · '+(c.crmk==='b24'?'Bitrix24':'amoCRM'):''),U.c_crm_e,U.c_crm_how,crm)+rem+'</div>'}

function cal(){var busy={};all().forEach(function(l,i){if(l.status==='no')return;busy[(l.doc!=null?l.doc:i%P.docs.length)+'|'+l.when]=l});
  var days=P.wd.slice(1,7);
  return'<div class="card cal"><div class="cr ch"><span>'+U.doctor+'</span>'+days.map(function(x){return'<span>'+x+'</span>'}).join('')+'</div>'+
  P.docs.map(function(dc,di){return'<div class="cr"><span><b>'+esc(dc.n)+'</b><small>'+esc(dc.r)+'</small></span>'+days.map(function(x){var h='';SLOT.forEach(function(s){var l=busy[di+'|'+x+' '+s];if(l)h+='<i class="'+(l.demo?'':'me')+'" title="'+esc(s+' '+l.name)+'">'+s+'</i>'});return'<span>'+(h||'<em>'+U.free+'</em>')+'</span>'}).join('')+'</div>'}).join('')+'</div>'}

function log(){var s=load().log;return'<div class="card"><h3>'+U.hist+'</h3>'+(s.length?s.map(function(e){return'<p class="lg"><small>'+new Date(e.at).toLocaleString()+'</small><b>'+esc(e.who)+'</b> '+esc(e.t)+'</p>'}).join(''):'<p class="mu">'+U.empty+'</p>')+'<button type="button" class="btn btn-l btn-s" id="reset">'+U.reset+'</button></div>'}

function render(){
  var body=tab==='req'?req():tab==='msg'?msg():tab==='cal'?cal():tab==='con'?con():tab==='log'?log():sum();
  $('#app').innerHTML=shell(body);
  $$('[data-tab]').forEach(function(b){b.addEventListener('click',function(){tab=b.getAttribute('data-tab');cur=null;put('nk-tab-1',tab);render();scrollTo(0,0)})});
  $$('[data-st]').forEach(function(b){b.addEventListener('click',function(){setStatus(b.getAttribute('data-id'),b.getAttribute('data-st'))})});
  $$('[data-th]').forEach(function(b){b.addEventListener('click',function(){cur=b.getAttribute('data-th')||null;if(cur)read(cur);render();var lg=$('#ms-log');if(lg)lg.scrollTop=lg.scrollHeight})});
  var lg=$('#ms-log');if(lg)lg.scrollTop=lg.scrollHeight;
  var mf=$('#ms-form');if(mf)mf.addEventListener('submit',function(e){e.preventDefault();var i=$('#ms-in'),v=i.value.trim();if(!v)return;reply(cur,v);render();var n=$('#ms-in');if(n)n.focus()});
  var bk=$('#ms-book');if(bk)bk.addEventListener('click',function(){bookFrom(cur);render()});
  $$('[data-con]').forEach(function(f){f.addEventListener('submit',function(e){e.preventDefault();var k=f.getAttribute('data-con'),c=conn();if(!f.querySelector('input').value.trim())return;
    c[k]=1;if(k==='crm'){var sk=$('#cn-crm-k');c.crmk=sk?sk.value:'amo'}setConn(c);note(U.note_con+': '+(k==='wz'?'Wazzup':k==='tg'?'Telegram':c.crmk==='b24'?'Bitrix24':'amoCRM'));render()})});
  $$('[data-off]').forEach(function(b){b.addEventListener('click',function(){var k=b.getAttribute('data-off'),c=conn(),nm=k==='wz'?'Wazzup':k==='tg'?'Telegram':c.crmk==='b24'?'Bitrix24':'amoCRM';delete c[k];if(k==='wz')delete c.rem;setConn(c);note(U.note_coff+': '+nm);render()})});
  var rm=$('#cn-rem');if(rm)rm.addEventListener('click',function(){var c=conn();c.rem=c.rem?0:1;setConn(c);note((c.rem?U.note_con:U.note_coff)+': '+U.c_rem_t);render()});
  $('#role').addEventListener('change',function(e){role=e.target.value;put('nk-role-1',role);render()});
  var rs=$('#reset');if(rs)rs.addEventListener('click',function(){save({v:1,leads:[],log:[]});put('nk-conn-1',{});render()});
}
addEventListener('storage',function(e){if(e.key===KEY||e.key==='nk-conn-1'){var a=d.activeElement,keep=a&&a.id==='ms-in'?a.value:null;render();if(keep!=null){var n=$('#ms-in');if(n){n.value=keep;n.focus()}}}});
render();
})();
