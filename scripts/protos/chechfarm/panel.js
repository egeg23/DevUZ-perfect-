(function(){
'use strict';
/* panel: panel CHECHFARM po etalonu greenwell. Obrashcheniya s saita
   (cf-leads-1) prihodyat pervoi strokoi; status, novosti, portfel i
   zagolovki stranic panel pishet v cf-panel-1, sait chitaet ih ottuda.
   Demo-cifry iz odnogo zerna: shodyatsya mezhdu ekranami. Roli: menedzher
   ne vidit investorov i SEO. Kommentarii vyrezaet sborka. */
var d=document,W=window,G=JSON.parse(d.getElementById('cp-data').textContent),U=G.ui;
var $=function(s,r){return (r||d).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))};
if(/[?&]embed=1/.test(location.search))d.documentElement.classList.add('embed');
function t(k,v){var s=U[k];if(s==null)return k;if(v)for(var x in v)s=s.split('{'+x+'}').join(v[x]);return s}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function ic(k){return '<svg class="ic" aria-hidden="true"><use href="#i-'+k+'"/></svg>'}
function pad(n){return (n<10?'0':'')+n}
function dstr(ts){var x=new Date(ts);return pad(x.getDate())+'.'+pad(x.getMonth()+1)}
function tstr(ts){var x=new Date(ts);return pad(x.getHours())+':'+pad(x.getMinutes())}
function when(ts){var m=(Date.now()-ts)/6e4;if(m<60)return Math.max(1,Math.round(m))+' '+t('min')+' '+t('ago');return dstr(ts)+' '+tstr(ts)}

/* Demo iz odnogo zerna */
var zr=20261026;function rnd(){zr=(zr*1664525+1013904223)>>>0;return zr/4294967296}
function pick(a,w){if(!w)return a[Math.floor(rnd()*a.length)];var tot=w.reduce(function(x,y){return x+y},0),r=rnd()*tot,s=0;for(var i=0;i<a.length;i++){s+=w[i];if(r<s)return a[i]}return a[a.length-1]}
var NOW=Date.now(),DAY=864e5,KINDS=['partner','pharmacy','investor','other'],ST=['new','work','meet','done'],MGR=G.names.slice(0,3),PAGES=['home','partners','investors','contacts','products','about'];
var DEMO=[],n0=1240;
for(var day=59;day>=0;day--){var c=Math.round(1+rnd()*3*(1+(59-day)/90));for(var k=0;k<c;k++){var ts=NOW-day*DAY-rnd()*DAY;if(ts>NOW-2*36e5)continue;var kind=pick(KINDS,[42,30,10,18]),age=(NOW-ts)/DAY;
  var st=age<1.2?pick(ST,[60,30,10,0]):age<5?pick(ST,[12,40,28,20]):pick(ST,[2,14,24,60]);
  DEMO.push({id:'D'+(n0--),ts:ts,kind:kind,st:st,name:pick(G.names.slice(3)),org:(kind==='pharmacy'?'Pharmacy':kind==='investor'?'Fund':'Company')+' '+(10+Math.floor(rnd()*80))+' ('+t('demo')+')',page:kind==='partner'?pick(['partners','home','contacts'],[60,20,20]):kind==='investor'?pick(['investors','home'],[75,25]):pick(['contacts','home','products'],[55,25,20]),reply:(.6+Math.pow(rnd(),1.4)*14),mgr:pick(MGR),demo:1})}}
DEMO.sort(function(a,b){return b.ts-a.ts});

/* Pamyat brauzera, obshchaya s saitom */
var LK='cf-leads-1',PK='cf-panel-1',PS={};
function lsGet(k,def){try{var v=JSON.parse(localStorage.getItem(k)||'null');return v==null?def:v}catch(e){return def}}
function load(){PS=lsGet(PK,{})||{};PS.st=PS.st||{};PS.notes=PS.notes||{};PS.news=PS.news||[];PS.prod=PS.prod||[];PS.seo=PS.seo||{};PS.log=PS.log||[];PS.mgr=PS.mgr||{}}
function save(){try{localStorage.setItem(PK,JSON.stringify(PS))}catch(e){}}
load();
function live(){var a=lsGet(LK,[]);return (Array.isArray(a)?a:[]).map(function(x){return {id:x.id,ts:x.ts,kind:x.kind||'other',st:PS.st[x.id]||'new',name:x.name||'',org:x.org||'',email:x.email||'',phone:x.phone||'',msg:x.msg||'',country:x.country||'',want:x.want||'',scale:x.scale||'',page:x.page||'home',mgr:PS.mgr[x.id]||'',live:1}})}
function all(){return live().concat(DEMO.map(function(o){o.st=PS.st[o.id]||o.st;return o}))}
var R={role:PS.role||'owner',tab:'dash',kind:'',st:'',q:''};
function sees(o){return R.role!=='manager'||o.kind!=='investor'}
function opens(v){if(R.role==='manager'&&(v==='seo'||v==='team'))return false;return true}
function logAdd(k,ref){PS.log.unshift({ts:Date.now(),who:t('role_'+R.role),k:k,ref:ref||''});PS.log=PS.log.slice(0,200);save()}
var toastT=0;function toast(s){var el=$('#toast');el.textContent=s;el.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){el.classList.remove('on')},2400)}

/* Svodka */
var V={};
V.dash=function(){var L=all().filter(sees),a=L.filter(function(o){return o.ts>NOW-30*DAY}),b=L.filter(function(o){return o.ts<=NOW-30*DAY&&o.ts>NOW-60*DAY});
  function dl(x,y){if(!y)return '';var p=Math.round((x-y)/y*100);return '<span class="d '+(p>=0?'up':'down')+'">'+(p>=0?'+':'')+p+'% '+h(t('vsPrev'))+'</span>'}
  var nw=L.filter(function(o){return o.st==='new'}).length,rep=a.filter(function(o){return o.reply}),avg=rep.length?rep.reduce(function(s,o){return s+o.reply},0)/rep.length:0,
    meet=a.filter(function(o){return o.st==='meet'||o.st==='done'}).length,mb=b.filter(function(o){return o.st==='meet'||o.st==='done'}).length;
  var days=[],mx=1;for(var i=29;i>=0;i--){var s=NOW-i*DAY,e=s+DAY,n=a.filter(function(o){return o.ts>s-DAY&&o.ts<=s}).length,lv=a.filter(function(o){return o.live&&o.ts>s-DAY&&o.ts<=s}).length;days.push([n,lv]);if(n>mx)mx=n}
  var fn=ST.map(function(s,i){return a.filter(function(o){return ST.indexOf(o.st)>=i}).length}),cols=['#0b5a53','#12857a','#b98a3a','#284a7a'];
  var kinds=KINDS.filter(function(k){return R.role!=='manager'||k!=='investor'}),kmax=Math.max.apply(null,kinds.map(function(k){return a.filter(function(o){return o.kind===k}).length}).concat(1));
  var pmax=Math.max.apply(null,PAGES.map(function(p){return a.filter(function(o){return o.page===p}).length}).concat(1));
  return '<div class="head"><h1>'+h(t('n_dash'))+'</h1><span class="muted">'+h(t('days30'))+'</span></div>'+
  '<div class="grid g4"><div class="card kpi"><span class="muted">'+h(t('k_total'))+'</span><b>'+a.length+'</b>'+dl(a.length,b.length)+'</div><div class="card kpi"><span class="muted">'+h(t('k_new'))+'</span><b class="'+(nw?'down':'')+'">'+nw+'</b></div><div class="card kpi"><span class="muted">'+h(t('k_reply'))+'</span><b>'+avg.toFixed(1).replace('.',',')+' '+h(t('h'))+'</b></div><div class="card kpi"><span class="muted">'+h(t('k_meet'))+'</span><b>'+meet+'</b>'+dl(meet,mb)+'</div></div>'+
  '<div class="grid g2"><div class="card"><h2>'+h(t('byDay'))+'</h2><div class="bars" aria-hidden="true">'+days.map(function(x,i){return '<i class="'+(x[1]?'s':'')+'" style="height:'+Math.max(3,x[0]/mx*100)+'%;--d:'+i*18+'ms"></i>'}).join('')+'</div><p class="sm muted">'+h(t('demo'))+' · <span style="color:var(--gold)">&#9632;</span> '+h(t('fromSite'))+'</p></div>'+
  '<div class="card"><h2>'+h(t('funnel'))+'</h2><div class="fun">'+fn.map(function(n,i){return '<div style="background:'+cols[i]+';width:'+Math.max(36,n/(fn[0]||1)*100)+'%"><span>'+h(t('s_'+ST[i]))+'</span><span>'+n+'</span></div>'}).join('')+'</div></div></div>'+
  '<div class="grid g2"><div class="card"><h2>'+h(t('byKind'))+'</h2><div class="hbar">'+kinds.map(function(k,i){var n=a.filter(function(o){return o.kind===k}).length;return '<div><span class="k-'+k+'">'+h(t('k_'+k))+'</span><span class="b"><i style="width:'+n/kmax*100+'%;animation-delay:'+i*80+'ms"></i></span><b>'+n+'</b></div>'}).join('')+'</div>'+(R.role==='manager'?'<p class="sm muted">'+h(t('hiddenInv'))+'</p>':'')+'</div>'+
  '<div class="card"><h2>'+h(t('byPage'))+'</h2><div class="hbar">'+PAGES.map(function(p,i){var n=a.filter(function(o){return o.page===p}).length,pg=G.pages.filter(function(x){return x.k===p})[0];return '<div><span>'+h(pg?pg.n:p)+'</span><span class="b"><i style="width:'+n/pmax*100+'%;animation-delay:'+i*80+'ms"></i></span><b>'+n+'</b></div>'}).join('')+'</div></div></div>'+
  '<div class="card"><div class="row" style="justify-content:space-between"><h2>'+h(t('latest'))+'</h2><a class="btn ln" href="#leads">'+h(t('n_leads'))+'</a></div>'+leadTable(all().filter(sees).slice(0,6))+'</div>'};

/* Obrashcheniya */
function leadTable(L){if(!L.length)return '<p class="muted">'+h(t('noRows'))+'</p>';
  return '<div class="tw"><table><thead><tr><th>'+h(t('col_no'))+'</th><th>'+h(t('col_who'))+'</th><th>'+h(t('col_kind'))+'</th><th>'+h(t('col_st'))+'</th><th>'+h(t('col_mgr'))+'</th><th>'+h(t('col_when'))+'</th></tr></thead><tbody>'+
  L.map(function(o){return '<tr data-id="'+h(o.id)+'" class="'+(o.live?'live':'')+(o.live&&Date.now()-o.ts<6e4?' fresh':'')+'" tabindex="0"><td><b>'+h(o.id)+'</b> '+(o.live?'<span class="tag site">'+h(t('fromSite'))+'</span>':'<span class="tag">'+h(t('demo'))+'</span>')+'</td><td>'+h(o.name)+'<br><span class="sm muted">'+h(o.org)+'</span></td><td class="k-'+o.kind+'"><b>'+h(t('k_'+o.kind))+'</b></td><td><span class="st st-'+o.st+'">'+h(t('s_'+o.st))+'</span></td><td>'+h(o.mgr||'')+'</td><td>'+h(when(o.ts))+'</td></tr>'}).join('')+'</tbody></table></div>'}
V.leads=function(){var L=all().filter(sees).filter(function(o){return (!R.kind||o.kind===R.kind)&&(!R.st||o.st===R.st)&&(!R.q||(o.id+' '+o.name+' '+o.org).toLowerCase().indexOf(R.q.toLowerCase())>=0)});
  var kinds=KINDS.filter(function(k){return R.role!=='manager'||k!=='investor'});
  return '<div class="head"><h1>'+h(t('n_leads'))+'</h1><input class="inp" style="max-width:320px" id="lq" type="search" placeholder="'+h(t('search'))+'" value="'+h(R.q)+'" aria-label="'+h(t('search'))+'"></div>'+
  '<div class="chips" data-f="kind"><button class="'+(R.kind?'':'on')+'" data-v="">'+h(t('all'))+'</button>'+kinds.map(function(k){return '<button class="'+(R.kind===k?'on':'')+'" data-v="'+k+'">'+h(t('k_'+k))+'</button>'}).join('')+'</div>'+
  '<div class="chips" data-f="st"><button class="'+(R.st?'':'on')+'" data-v="">'+h(t('all'))+'</button>'+ST.map(function(s){return '<button class="'+(R.st===s?'on':'')+'" data-v="'+s+'">'+h(t('s_'+s))+'</button>'}).join('')+'</div>'+leadTable(L)};
function leadById(id){return all().filter(function(o){return o.id===id})[0]}
function openLead(id){var o=leadById(id);if(!o)return;var m=$('#mdl');
  var hist=PS.log.filter(function(x){return x.ref===id});
  m.innerHTML='<div class="sheet" role="dialog" aria-modal="true" aria-label="'+h(o.id)+'"><div class="sheet-h"><div><span class="k-'+o.kind+'"><b>'+h(t('k_'+o.kind))+'</b></span><h1>'+h(o.id)+'</h1><p class="muted">'+h(when(o.ts))+(o.live?' · <span class="tag site">'+h(t('fromSite'))+'</span>':'')+'</p></div><button class="ib" data-x aria-label="'+h(t('close'))+'">'+ic('x')+'</button></div>'+
  '<div class="card"><b>'+h(o.name)+'</b><span class="muted">'+h(o.org)+(o.country?' · '+h(o.country):'')+'</span>'+(o.email||o.phone?'<p>'+h(t('contact'))+': '+h([o.email,o.phone].filter(Boolean).join(' · '))+'</p>':'')+(o.scale?'<p><b>'+h(t('scale'))+':</b> '+h(t('sc_'+o.scale))+'</p>':'')+(o.msg?'<p><b>'+h(t('msg'))+':</b> '+h(o.msg)+'</p>':'')+'<p class="sm muted">'+h(t('page'))+': '+h((G.pages.filter(function(p){return p.k===o.page})[0]||{n:o.page}).n)+'</p>'+
  (o.email?'<a class="btn ln" href="mailto:'+h(o.email)+'?subject='+encodeURIComponent('CHECHFARM '+o.id)+'" data-reply>'+ic('mail')+h(t('reply'))+'</a>':'')+'</div>'+
  '<div class="card"><h2>'+h(t('setSt'))+'</h2><div class="stbtns">'+ST.map(function(s){return '<button data-st="'+s+'" class="'+(o.st===s?'on':'')+'" aria-pressed="'+(o.st===s)+'">'+h(t('s_'+s))+'</button>'}).join('')+'</div><p class="sm muted">'+h(t('stNote'))+'</p></div>'+
  '<div class="card"><label class="lab">'+h(t('note'))+'<textarea class="inp" id="nt" placeholder="'+h(t('notePh'))+'">'+h(PS.notes[id]||'')+'</textarea></label><button class="btn" data-note>'+h(t('save'))+'</button></div>'+
  '<div class="card"><h2>'+h(t('hist'))+'</h2><ul class="tl"><li><b>'+h(dstr(o.ts)+' '+tstr(o.ts))+'</b><span>'+h(t('newLead'))+'</span></li>'+hist.slice().reverse().map(function(x){return '<li><b>'+h(dstr(x.ts)+' '+tstr(x.ts))+'</b><span>'+h(x.who)+' '+h(t(x.k))+'</span></li>'}).join('')+'</ul></div></div>';
  m.hidden=false;$('[data-x]',m).focus();
  m.onclick=function(e){if(e.target===m||e.target.closest('[data-x]')){m.hidden=true;m.innerHTML='';return}
    var b=e.target.closest('[data-st]');if(b){PS.st[id]=b.getAttribute('data-st');if(!PS.mgr[id])PS.mgr[id]=t('me');logAdd('a_status',id);save();toast(t('saved'));render();openLead(id);return}
    if(e.target.closest('[data-note]')){PS.notes[id]=$('#nt').value;logAdd('a_note',id);save();toast(t('saved'));return}
    if(e.target.closest('[data-reply]')){logAdd('a_reply',id)}}}

/* Novosti i portfel: to, chto sait pokazhet */
function field(id,lab,area,req){return '<label class="lab" data-req="'+(req?1:0)+'">'+h(lab)+(req?' *':'')+(area?'<textarea class="inp" name="'+id+'"></textarea>':'<input class="inp" name="'+id+'">')+'</label>'}
function check(f){var ok=true;$$('[data-req="1"]',f).forEach(function(l){var el=$('.inp',l),bad=!el.value.trim();l.classList.toggle('bad',bad);if(bad&&ok){el.focus();ok=false}});if(!ok)toast(t('need'));return ok}
V.news=function(){return '<div class="head"><h1>'+h(t('n_news'))+'</h1><a class="btn ln" href="'+h(G.pages.filter(function(p){return p.k==='news'})[0].href)+'">'+ic('eye')+h(t('see'))+'</a></div>'+
  '<form class="card" id="nf" novalidate><h2>'+h(t('n_add'))+'</h2>'+field('title',t('n_title'),0,1)+field('body',t('n_body'),1,1)+'<label class="row sm"><input type="checkbox" name="pub" checked> '+h(t('n_pub'))+'</label><button class="btn" type="submit">'+ic('plus')+h(t('save'))+'</button></form>'+
  (PS.news.length?PS.news.map(function(x){return '<div class="item" data-n="'+h(x.id)+'"><div class="row"><span class="tag '+(x.pub?'site':'')+'">'+h(x.pub?t('n_onSite'):t('n_draft'))+'</span><span class="sm muted">'+h(dstr(x.ts))+'</span></div><h3>'+h(x.title)+'</h3><div class="row"><button class="btn ln" data-tg>'+h(x.pub?t('hide'):t('show'))+'</button><button class="btn rd" data-del>'+ic('trash')+h(t('del'))+'</button></div></div>'}).join(''):'<p class="card muted">'+h(t('n_empty'))+'</p>')};
V.products=function(){return '<div class="head"><h1>'+h(t('n_products'))+'</h1><a class="btn ln" href="'+h(G.pages.filter(function(p){return p.k==='products'})[0].href)+'">'+ic('eye')+h(t('see'))+'</a></div>'+
  '<form class="card" id="pf" novalidate><h2>'+h(t('p_add'))+'</h2><p class="warn">'+h(t('p_warn'))+'</p><div class="grid g2">'+G.fields.map(function(f,i){return field(f.id,f.t,0,i===0)}).join('')+'</div><label class="row sm"><input type="checkbox" name="pub" checked> '+h(t('n_pub'))+'</label><button class="btn" type="submit">'+ic('plus')+h(t('save'))+'</button></form>'+
  (PS.prod.length?PS.prod.map(function(x){return '<div class="item" data-p="'+h(x.id)+'"><div class="row"><span class="tag '+(x.pub?'site':'')+'">'+h(x.pub?t('n_onSite'):t('n_draft'))+'</span></div><h3>'+h(x.name)+'</h3><p class="sm muted">'+h([x.inn,x.form,x.maker].filter(Boolean).join(' · '))+'</p><div class="row"><button class="btn ln" data-tg>'+h(x.pub?t('hide'):t('show'))+'</button><button class="btn rd" data-del>'+ic('trash')+h(t('del'))+'</button></div></div>'}).join(''):'<p class="card muted">'+h(t('p_empty'))+'</p>')};

/* Stranicy i SEO */
V.seo=function(){return '<div class="head"><h1>'+h(t('n_seo'))+'</h1></div><p class="muted">'+h(t('seoHelp'))+'</p>'+G.pages.map(function(p){var s=PS.seo[G.lang+':'+p.k]||{},tt=s.t||p.t,dd=s.d||p.d;
  return '<form class="card" data-seo="'+p.k+'"><div class="row"><h2>'+h(p.n)+'</h2><a class="sm muted" href="'+h(p.href)+'">'+ic('ext')+'</a></div><label class="lab">'+h(t('seoT'))+'<input class="inp" name="t" value="'+h(tt)+'"></label><span class="cnt'+(tt.length>60?' over':'')+'">'+tt.length+' '+h(t('chars'))+(tt.length>60?' · '+h(t('long')):'')+'</span><label class="lab">'+h(t('seoD'))+'<textarea class="inp" name="d" style="min-height:70px">'+h(dd)+'</textarea></label><button class="btn" type="submit">'+h(t('save'))+'</button></form>'}).join('')};

/* Istoriya i komanda */
V.log=function(){var L=PS.log.concat(DEMO.slice(0,24).map(function(o,i){return {ts:o.ts+(o.reply||1)*36e5,who:o.mgr,k:o.st==='new'?'a_take':'a_status',ref:o.id,demo:1}})).filter(function(x){return x.ts<=Date.now()}).sort(function(a,b){return b.ts-a.ts});
  return '<div class="head"><h1>'+h(t('n_log'))+'</h1></div><div class="card">'+(L.length?'<ul class="tl">'+L.slice(0,60).map(function(x){return '<li><b>'+h(dstr(x.ts)+' '+tstr(x.ts))+'</b><span>'+h(x.who)+' '+h(t(x.k))+(x.ref?' · '+h(x.ref):'')+(x.demo?' <span class="tag">'+h(t('demo'))+'</span>':'')+'</span></li>'}).join('')+'</ul>':'<p class="muted">'+h(t('logEmpty'))+'</p>')+'</div>'};
V.team=function(){return '<div class="head"><h1>'+h(t('n_team'))+'</h1></div><div class="tw"><table><thead><tr><th>'+h(t('viewAs'))+'</th><th>'+h(t('r_what'))+'</th></tr></thead><tbody>'+['owner','head','manager'].map(function(r){return '<tr><td><b>'+h(t('role_'+r))+'</b></td><td style="white-space:normal">'+h(t('r_'+r))+'</td></tr>'}).join('')+'</tbody></table></div>'+
  '<div class="card"><h2>'+h(t('people'))+' <span class="tag">'+h(t('demo'))+'</span></h2>'+MGR.map(function(n,i){return '<div class="row"><b>'+h(n)+'</b><span class="muted">'+h(t(i?'role_manager':'role_head'))+'</span></div>'}).join('')+'</div>'+
  '<div class="card"><h2>'+h(t('routes'))+'</h2><p>'+h(t('routesTxt'))+'</p></div>'};

/* Karkas */
function count(){var n=all().filter(sees).filter(function(o){return o.st==='new'}).length,el=$('[data-cnt]');if(el){el.hidden=!n;el.textContent=n}}
function render(){var v=R.tab;if(!V[v])v='dash';$$('.nav a').forEach(function(a){var k=a.getAttribute('href').slice(1);a.classList.toggle('on',k===v);a.classList.toggle('off',!opens(k))});
  $('#tb-t').textContent=t('n_'+v);var pv=$('#pv');pv.innerHTML=opens(v)?V[v]():'<div class="card"><p>'+h(t('noAccess'))+'</p></div>';count()}
function go(){R.tab=(location.hash||'#dash').slice(1).split('?')[0];d.body.classList.remove('nav-on');render();$('#pv').focus({preventScroll:true});W.scrollTo(0,0)}
addEventListener('hashchange',go);
$('#menu-b').addEventListener('click',function(){d.body.classList.add('nav-on')});
$('[data-navclose]').addEventListener('click',function(){d.body.classList.remove('nav-on')});
var role=$('#role');role.value=R.role;role.addEventListener('change',function(){R.role=role.value;PS.role=R.role;save();render()});
d.addEventListener('click',function(e){var tr=e.target.closest('tr[data-id]');if(tr){openLead(tr.getAttribute('data-id'));return}
  var c=e.target.closest('.chips button');if(c){R[c.parentNode.getAttribute('data-f')]=c.getAttribute('data-v');render();return}
  var it=e.target.closest('.item');if(it){var isN=it.hasAttribute('data-n'),id=it.getAttribute(isN?'data-n':'data-p'),arr=isN?PS.news:PS.prod,x=arr.filter(function(y){return y.id===id})[0];if(!x)return;
    if(e.target.closest('[data-tg]')){x.pub=!x.pub;logAdd(isN?(x.pub?'a_news':'a_newsHide'):(x.pub?'a_prod':'a_prodHide'),isN?x.title:x.name);save();render();toast(t('saved'))}
    if(e.target.closest('[data-del]')){arr.splice(arr.indexOf(x),1);logAdd(isN?'a_newsDel':'a_prodDel',isN?x.title:x.name);save();render();toast(t('saved'))}}});
d.addEventListener('keydown',function(e){var tr=e.target.closest&&e.target.closest('tr[data-id]');if(tr&&e.key==='Enter')openLead(tr.getAttribute('data-id'));if(e.key==='Escape'&&!$('#mdl').hidden){$('#mdl').hidden=true}});
d.addEventListener('input',function(e){if(e.target.id==='lq'){R.q=e.target.value;var pos=e.target.selectionStart;render();var q=$('#lq');q.focus();try{q.setSelectionRange(pos,pos)}catch(x){}}
  var l=e.target.closest&&e.target.closest('.bad');if(l)l.classList.remove('bad')});
d.addEventListener('submit',function(e){var f=e.target;e.preventDefault();
  if(f.id==='nf'){if(!check(f))return;var x={id:'N'+Date.now().toString(36),ts:Date.now(),title:f.elements.title.value.trim(),body:f.elements.body.value.trim(),pub:f.elements.pub.checked};PS.news.unshift(x);if(x.pub)logAdd('a_news',x.title);save();render();toast(t('saved'))}
  if(f.id==='pf'){if(!check(f))return;var p={id:'P'+Date.now().toString(36),pub:f.elements.pub.checked};G.fields.forEach(function(fl){p[fl.id]=f.elements[fl.id].value.trim()});PS.prod.unshift(p);logAdd('a_prod',p.name);save();render();toast(t('saved'))}
  if(f.hasAttribute('data-seo')){PS.seo[G.lang+':'+f.getAttribute('data-seo')]={t:f.elements.t.value.trim(),d:f.elements.d.value.trim()};logAdd('a_seo',f.getAttribute('data-seo'));save();render();toast(t('saved'))}});
addEventListener('storage',function(e){if(e.key===LK||e.key===PK){load();render()}});
go();
})();
