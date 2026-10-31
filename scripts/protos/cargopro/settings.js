/* Nastroyki super-adminki CARGO PRO GROUP: tarify perevozki (obyomnyy
   koeffitsient, natsenka po kategorii gruza, koeffitsient po plotnosti, dopy),
   ozhidanie i prostoy (zalozheno v tsenu, besplatno sverh, stavka v chas),
   polzovateli i roli (matritsa prav), kompaniya i dokumenty, uvedomleniya.
   Odin istochnik: cp-set-1. Ego chitayut sayt (konstruktor tarifov), kartochka
   reysa, kabinet klienta i vse vkladki (roli). Vstavlyaetsya v zamykanie
   dispatch.js posle super.js, polzuetsya ego S, t(), get(), put(), log(). */
var SKEY='cp-set-1',ST_MS=/*~*/140;
var TN4=['[[t:16]]','[[t:17]]','[[t:18]]'];
var GRPS=['tar','wt','users','co','nt'];
var ROLES=['owner','head','disp','sales','acc'],EXT_ROLES=['drv','broker','client'];
var SECS=['plan','route','map','trips','drivers','fleet','int','set','log'],PERMS=['money','tariffs','export','del','broker','users'];
var CATS=['gen','frag','dg','ref','oog','val','ltl'],STG=['load','cus','unl'],EVS=['dep','cus','arr','doc','idle','late','docx'],TPLS=['dep','cus','arr','doc','idle'],CURS=['UZS','USD','EUR','AED'];
var DEVS=['iPhone · Safari','Android · Chrome','Windows · Chrome','macOS · Safari'];
function clone(o){return JSON.parse(JSON.stringify(o))}
function sub(s,o){return String(s).replace(/\{(\w+)\}/g,function(_,k){return o[k]==null?'':o[k]})}
function hl(g){return'href="#'+(g?'set-'+g:'set')+'"'}
function pathGet(o,p){var a=p.split('.');for(var i=0;i<a.length;i++){if(o==null)return undefined;o=o[a[i]]}return o}
function pathSet(o,p,v){var a=p.split('.');for(var i=0;i<a.length-1;i++){if(o[a[i]]==null)o[a[i]]={};o=o[a[i]]}o[a[a.length-1]]=v}

/* Umolchaniya: te zhe chisla, chto v tariffs.mjs i v kode do nastroek, poetomu bez pravok nichego ne menyaetsya. */
function defPerm(){var p={},all=SECS.concat(PERMS);
  var row=function(o){var r={};all.forEach(function(k){r[k]=o[k]==null?0:o[k]});return r};
  var two={};all.forEach(function(k){two[k]=2});
  p.owner=row(two);p.head=row(two);
  p.disp=row({plan:2,route:2,map:2,trips:2,drivers:2,fleet:2,int:1,set:1,log:1,broker:2});
  p.sales=row({plan:1,map:1,trips:1,set:1,money:1,tariffs:1});
  p.acc=row({trips:1,drivers:1,fleet:1,int:1,set:1,log:1,money:2,tariffs:1,export:2,broker:1});
  return p}
function defUsers(){var zq=20261101,r=function(){zq=(zq*16807)%2147483647;return zq/2147483647},ph=function(){return'+998 9'+Math.floor(r()*10)+' '+(100+Math.floor(r()*900))+' '+(10+Math.floor(r()*90))+' '+(10+Math.floor(r()*90))};
  return[{id:'U1',n:TN4[0]+' A.',role:'owner',c:ph(),st:'on'},{id:'U2',n:TN4[1]+' R.',role:'head',c:ph(),st:'on'},{id:'U3',n:TN4[2]+' S.',role:'disp',c:ph(),st:'on'},
    {id:'U4',n:TN[1]+' K.',role:'disp',c:ph(),st:'on'},{id:'U5',n:TN[3]+' M.',role:'sales',c:ph(),st:'on'},{id:'U6',n:TN[4]+' D.',role:'acc',c:ph(),st:'off'},{id:'U7',n:TN2[2]+' T.',role:'drv',c:ph(),st:'inv'}]}
function defSet(){var x=D.tar,c=D.co;
  return{tar:{dim:{air:x.dim.air,auto:x.dim.auto},cat:clone(x.cat),bands:clone(x.bands),min:0,fuel:0,ins:{pct:x.ex.ins.pct,min:x.ex.ins.min},customs:x.ex.customs,door:{base:x.ex.door.base,kg:x.ex.door.kg,cont:x.ex.door.cont},cons:x.ex.cons},
    wt:clone(D.wt),perm:defPerm(),users:defUsers(),
    co:{name:c.name,inn:'',addr:c.addr,tel:c.tel,email:c.email,bank:'',acc:'',mfo:'',num:'CPG-{year}-{n}',seq:118,cur:{UZS:1,USD:1,EUR:1,AED:1},fx:{UZS:x.fx.UZS,EUR:x.fx.EUR,AED:x.fx.AED},fxAuto:1,prepay:50,defer:14,vat:0,vatPct:12},
    nt:{ch:{dep:[1,1,0],cus:[1,0,0],arr:[1,1,1],doc:[1,0,1],idle:[1,1,0],late:[0,1,0],docx:[0,1,1]},tpl:{ru:{},uz:{}},quiet:{from:21,to:8}}}}
function merge(a,b){if(Array.isArray(a)||typeof a!=='object'||a===null)return b===undefined?a:b;if(typeof b!=='object'||b===null||Array.isArray(b))return a;var o={},k;for(k in a)o[k]=merge(a[k],b[k]);for(k in b)if(!(k in o))o[k]=b[k];return o}
var DEF=null,SET=null,SD=null,ERR={},prevT=0,inv={n:'',role:'disp',c:''};
function loadSet(){if(!DEF)DEF=defSet();SET=merge(DEF,get(SKEY,{}));SD=clone(SET);return SET}
function saveSet(){put(SKEY,SET)}
/* Prava: 0 ne vidit, 1 vidit, 2 menyaet. Vladelets vsegda 2. */
function can(k){if(!SET)loadSet();if(S.role==='owner')return 2;var p=SET.perm[S.role];return p&&p[k]!=null?p[k]:0}
function canEdit(g){return g==='tar'?can('tariffs')>=2:g==='users'?can('users')>=2:can('set')>=2}
function catPct(ty){if(!SET)loadSet();var v=+SET.tar.cat[ty];return isNaN(v)?0:v}
function bidOf(c){return Math.round((c.kg/1000*38+60)*(1+catPct(c.ty)/100))}
function bandK(b,d){if(!b)return 1;for(var i=0;i<b.length;i++){if(!(+b[i].to)||d<=+b[i].to)return +b[i].k||1}return 1}

/* Ozhidanie v reyse: norma = zalozheno + besplatno, sverh normy pochasovaya, okruglenie vverkh, potolok, kto platit. */
function hm2(h){var m=Math.round(h*60);return Math.floor(m/60)+' '+t('h')+(m%60?' '+(m%60)+' '+t('min'):'')}
function waitOf(o){var w=(S.tx[o.id]&&S.tx[o.id].w)||D.dw[o.id]||{};return{load:+w.load||0,cus:+w.cus||0,unl:+w.unl||0}}
function waitCalc(o,W){W=W||SET.wt;var f=waitOf(o),ref=!!(o.dr&&o.dr.b==='ref'),rate=+(ref?W.rateRef:W.rate)||0,rows=[],tot=0;
  STG.forEach(function(s){var n=(+W.plan[s]||0)+(+W.free[s]||0),over=Math.max(0,f[s]-n);if(+W.round>0&&over>0)over=Math.ceil(over*60/W.round)*W.round/60;var sum=over*rate;tot+=sum;rows.push({s:s,fact:f[s],norm:n,over:over,sum:sum})});
  var capped=false;if(+W.cap>0&&tot>+W.cap){tot=+W.cap;capped=true}
  return{rows:rows,rate:rate,tot:tot,capped:capped,payer:W.payer,ref:ref}}
function waitRow(x,r){var W=SET.wt;return'<small>'+t('wt_norm')+' '+hm2(x.norm)+' ('+t('wt_incl')+' '+fv(W.plan[x.s])+' + '+t('wt_freel')+' '+fv(W.free[x.s])+')</small><b>'+(x.over?t('wt_over')+' '+hm2(x.over)+' × '+fv(r.rate)+' $ = '+fmt(x.sum)+' $':t('wt_ok'))+'</b>'}
function waitTot(r){return t(r.payer==='client'?'wt_sum':'wt_sum_car')+': <b>'+fmt(r.tot)+' $</b>'+(r.capped?' · '+t('wt_capped'):'')+(r.ref?' · '+t('cat_ref'):'')}
function waitBlock(o){var r=waitCalc(o),ed=can('trips')>=2;
  return'<div class="sp-wt" id="wt-'+o.id+'"><div class="sp-wth"><b>'+t('wt_t_h')+'</b>'+(can('set')>=1?'<a class="dp-to-r-b" '+hl('wt')+'>'+t('st_go')+'</a>':'')+'</div><div class="sp-wtg">'+
    r.rows.map(function(x){return'<div class="sp-wts'+(x.over?' over':'')+'" data-ws="'+x.s+'"><span>'+t('stg_'+x.s)+'</span><label><span>'+t('wt_fact')+'</span><input type="number" min="0" max="200" step="0.25" inputmode="decimal" data-wait="'+o.id+'" data-stg="'+x.s+'" value="'+x.fact+'"'+(ed?'':' disabled')+'></label><span class="sp-wsr">'+waitRow(x,r)+'</span></div>'}).join('')+
    '</div><p class="sp-wtt" id="wts-'+o.id+'">'+waitTot(r)+'</p></div>'}
function waitRefresh(o){var e=$('#wt-'+o.id);if(!e)return;var r=waitCalc(o);
  r.rows.forEach(function(x){var c=$('[data-ws="'+x.s+'"]',e);if(!c)return;c.classList.toggle('over',!!x.over);$('.sp-wsr',c).innerHTML=waitRow(x,r)});
  $('#wts-'+o.id).innerHTML=waitTot(r)}
function bindWait(v,find){$$('[data-wait]',v).forEach(function(i){i.addEventListener('input',function(){var id=i.getAttribute('data-wait'),s=i.getAttribute('data-stg'),h=Math.max(0,Math.min(200,+String(i.value).replace(',','.')||0));
    S.tx[id]=S.tx[id]||{};S.tx[id].w=S.tx[id].w||clone(waitOf({id:id}));S.tx[id].w[s]=h;save();var o=find(id);if(o)waitRefresh(o)})})}

/* Pravila poley: [min, max]. Podpis dlya istorii: labOf. */
var RULES={'tar.dim.air':[50,1000],'tar.dim.auto':[50,1000],'tar.min':[0,10000],'tar.fuel':[0,100],'tar.ins.pct':[0,10],'tar.ins.min':[0,1000],'tar.customs':[0,5000],'tar.door.base':[0,1000],'tar.door.kg':[0,10],'tar.door.cont':[0,5000],'tar.cons':[0,1000],
  'wt.rate':[0,1000],'wt.rateRef':[0,1000],'wt.cap':[0,100000],'co.seq':[1,999999],'co.prepay':[0,100],'co.defer':[0,365],'co.vatPct':[0,50],'co.fx.UZS':[1,100000],'co.fx.EUR':[0.1,10],'co.fx.AED':[0.1,10],'nt.quiet.from':[0,23],'nt.quiet.to':[0,23]};
var LABS={'tar.dim.air':'tr_dim_air','tar.dim.auto':'tr_dim_auto','tar.min':'tr_min','tar.fuel':'tr_fuel','tar.ins.pct':'tr_ins','tar.ins.min':'tr_ins_min','tar.customs':'tr_cus','tar.door.base':'tr_door','tar.door.kg':'tr_door_kg','tar.door.cont':'tr_door_c','tar.cons':'tr_cons',
  'wt.rate':'wt_rate','wt.rateRef':'wt_rate_ref','wt.round':'wt_round','wt.cap':'wt_cap','wt.payer':'wt_payer','co.name':'co_name','co.inn':'co_inn','co.addr':'co_addr','co.tel':'co_tel','co.email':'co_email','co.bank':'co_bank','co.acc':'co_acc','co.mfo':'co_mfo','co.num':'co_num','co.seq':'co_seq','co.fxAuto':'co_cur_h','co.prepay':'co_prepay','co.defer':'co_defer','co.vat':'co_vat','co.vatPct':'co_vat_pct','nt.quiet.from':'nt_quiet','nt.quiet.to':'nt_quiet'};
function ruleOf(p){if(RULES[p])return RULES[p];if(/^tar\.cat\./.test(p))return[-50,300];if(/^wt\.(plan|free)\./.test(p))return[0,72];if(/^tar\.bands\.\d\.to$/.test(p))return[1,5000];if(/^tar\.bands\.\d\.k$/.test(p))return[0.1,3];return null}
function colName(k){return SECS.indexOf(k)>=0?t('tab_'+k):t('pm_'+k)}
function labOf(p){var m;if(LABS[p])return t(LABS[p]);
  if((m=p.match(/^tar\.cat\.(\w+)$/)))return t('tr_cat_h')+': '+t('cat_'+m[1]);
  if((m=p.match(/^wt\.(plan|free)\.(\w+)$/)))return t(m[1]==='plan'?'wt_plan_h':'wt_free_h')+': '+t('stg_'+m[2]);
  if((m=p.match(/^tar\.bands\.(\d)\.(to|k)$/)))return t('tr_band_h')+' '+(+m[1]+1)+': '+t(m[2]==='to'?'tr_band_to':'tr_band_k');
  if((m=p.match(/^nt\.ch\.(\w+)\.(\d)$/)))return t('ev_'+m[1])+' · '+t(['nt_cl','nt_grp','nt_em'][+m[2]]);
  if((m=p.match(/^nt\.tpl\.(\w+)\.(\w+)$/)))return t('nt_tpl_h')+' · '+t('ev_'+m[2])+' ('+m[1].toUpperCase()+')';
  if((m=p.match(/^perm\.(\w+)\.(\w+)$/)))return t('us_matrix')+' · '+t('role_'+m[1])+' · '+colName(m[2]);
  if((m=p.match(/^co\.cur\.(\w+)$/)))return t('co_cur_h')+' · '+m[1];
  if((m=p.match(/^co\.fx\.(\w+)$/)))return m[1]+' '+t('co_fx_for');
  return p}
function showV(p,v){if(/^perm\./.test(p))return t('pm_'+v);if(/^(nt\.ch|co\.cur)\./.test(p))return v?'1':'0';if(p==='wt.payer')return t(v==='client'?'wt_p_cl':'wt_p_car');if(p==='co.fxAuto')return t(+v?'co_fx_auto':'co_fx_man');if(p==='co.vat')return t(+v?'co_vat_on':'co_vat_off');if(p==='wt.round')return t('wt_r'+(+v||0));return v===''||v==null?'·':String(v)}
function flat(o,pre,out){out=out||{};Object.keys(o).forEach(function(k){var v=o[k],p=pre?pre+'.'+k:k;if(v&&typeof v==='object')flat(v,p,out);else out[p]=v});return out}
function diffs(a,b){var A=flat(a),B=flat(b),o=[];Object.keys(B).forEach(function(p){if(p.indexOf('users')===0)return;if(String(A[p])!==String(B[p]))o.push([p,A[p],B[p]])});return o}
function ferrCalc(p,v){if(/^tar\.bands\.\d\.to$/.test(p)&&+p.split('.')[2]===SD.tar.bands.length-1)return'';var r=ruleOf(p);if(r){if(v===''||v==null||isNaN(+v))return t('e_req');if(+v<r[0]||+v>r[1])return sub(t('e_range'),{a:fv(r[0]),b:fv(r[1])})}
  if(p==='co.name'&&!String(v||'').trim())return t('e_req');return''}
function ferr(p){return ERR[p]||''}
function validateAll(){ERR={};var F=flat(SD);Object.keys(F).forEach(function(p){var m=ferrCalc(p,F[p]);if(m)ERR[p]=m});
  if(!CURS.some(function(c){return+SD.co.cur[c]}))ERR['co.cur']=t('e_cur');return Object.keys(ERR)}

/* Pole formy: data-p = put v SD. */
function sf(p,lab,o){o=o||{};var v=pathGet(SD,p),ro=!o.ed,err=ferr(p),note=o.note||'';
  var inp=o.sel?'<select data-p="'+p+'"'+(ro?' disabled':'')+'>'+o.sel.map(function(x){return'<option value="'+esc(x[0])+'"'+(String(x[0])===String(v)?' selected':'')+'>'+esc(x[1])+'</option>'}).join('')+'</select>'
    :o.area?'<textarea data-p="'+p+'" rows="2"'+(o.ph?' placeholder="'+esc(o.ph)+'"':'')+(ro?' disabled':'')+'>'+esc(v==null?'':v)+'</textarea>'
    :'<input data-p="'+p+'"'+(o.num?' data-t="num" type="number" inputmode="decimal" step="'+(o.step||'any')+'"':'')+(o.ph?' placeholder="'+esc(o.ph)+'"':'')+' value="'+esc(v==null?'':v)+'"'+(ro?' disabled':'')+' autocomplete="off">';
  return'<label class="fld st-f'+(err?' sp-bad':'')+'"><span>'+lab+'</span>'+inp+'<small class="'+(err?'sp-e':'pn-mu')+'" data-e="'+p+'" data-n="'+esc(note)+'">'+esc(err||note)+'</small></label>'}
function ck(p,lab,ed){var v=+pathGet(SD,p);return'<label class="st-ck"><input type="checkbox" data-p="'+p+'"'+(v?' checked':'')+(ed?'':' disabled')+'><span>'+lab+'</span></label>'}
function gHead(g,ed){return'<div class="st-h"><h3>'+t('st_grp_'+g)+'</h3>'+(ed?'<button type="button" class="btn btn-g btn-s" data-streset="'+g+'">'+t('st_reset')+'</button>':'')+'</div>'+
  '<p class="pn-mu">'+t(g==='tar'?'tr_hint':g==='wt'?'wt_hint':g==='users'?'us_hint':g==='co'?'co_hint':'nt_hint')+'</p><p class="st-where"><b>'+t('st_where')+':</b> '+t(g==='tar'?'tr_where':g==='wt'?'wt_where':g==='users'?'us_where':g==='co'?'co_where':'nt_where')+'</p>'+(ed?'':'<p class="dp-err">'+t('st_ro')+'</p>')}

/* Tarify. */
function trPrev(){var o=SD.tar,kg=250,m3=2,d=kg/m3,out=[];['air','auto'].forEach(function(m){var vw=m3*(+o.dim[m]||0),cw=Math.max(kg,vw),k=bandK(o.bands,d),rate=D.tar.rate[m],sum=cw*rate*k;if(+o.min&&sum<+o.min)sum=+o.min;
    out.push(sub(t('tr_prev'),{mode:t('mode_'+m),d:fmt(d),vw:fmt(vw),cw:fmt(cw),rate:fv(rate),k:fv((+k).toFixed(2)),sum:fmt(sum)}))});return out.map(function(x){return'<p>'+esc(x)+'</p>'}).join('')}
function gTar(ed){var o=SD.tar;
  return gHead('tar',ed)+
  '<section class="pn-card"><h3>'+t('tr_dim_h')+'</h3><p class="pn-mu">'+t('tr_dim_e')+'</p><div class="st-g">'+sf('tar.dim.air',t('tr_dim_air'),{num:1,ed:ed})+sf('tar.dim.auto',t('tr_dim_auto'),{num:1,ed:ed})+'</div></section>'+
  '<section class="pn-card"><h3>'+t('tr_cat_h')+'</h3><p class="pn-mu">'+t('tr_cat_e')+'</p><div class="st-g">'+CATS.map(function(c){return sf('tar.cat.'+c,t('cat_'+c)+', %',{num:1,ed:ed})}).join('')+'</div></section>'+
  '<section class="pn-card"><h3>'+t('tr_band_h')+'</h3><p class="pn-mu">'+t('tr_band_e')+'</p><div class="st-g st-bands">'+o.bands.map(function(b,i){var last=i===o.bands.length-1;
    return'<div class="st-band">'+(last?'<p class="fld st-f"><span>'+t('tr_band_over')+' '+fv(o.bands[i-1].to)+' '+t('kg')+'/'+t('m3')+'</span></p>':sf('tar.bands.'+i+'.to',t('tr_band_to'),{num:1,ed:ed,step:'1'}))+sf('tar.bands.'+i+'.k',t('tr_band_k'),{num:1,ed:ed,step:'0.01'})+'</div>'}).join('')+'</div></section>'+
  '<section class="pn-card st-prev"><h3>'+t('tr_prev_h')+'</h3><p class="pn-mu">'+t('tr_prev_e')+'</p><div id="trprev">'+trPrev()+'</div></section>'+
  '<section class="pn-card"><h3>'+t('tr_extra_h')+'</h3><div class="st-g">'+sf('tar.min',t('tr_min'),{num:1,ed:ed,note:t('tr_min_e')})+sf('tar.fuel',t('tr_fuel'),{num:1,ed:ed,note:t('tr_fuel_e')})+sf('tar.ins.pct',t('tr_ins'),{num:1,ed:ed})+sf('tar.ins.min',t('tr_ins_min'),{num:1,ed:ed})+
    sf('tar.customs',t('tr_cus'),{num:1,ed:ed})+sf('tar.door.base',t('tr_door'),{num:1,ed:ed})+sf('tar.door.kg',t('tr_door_kg'),{num:1,ed:ed,step:'0.01'})+sf('tar.door.cont',t('tr_door_c'),{num:1,ed:ed})+sf('tar.cons',t('tr_cons'),{num:1,ed:ed})+'</div></section>'}

/* Ozhidanie i prostoy. */
function wtPrev(){var W=SD.wt,r=waitCalc({id:'CPG-24109',dr:null},W),x=r.rows[0];
  return'<p>'+esc(sub(t('wt_ex'),{p:fv(W.plan.load),f:fv(W.free.load),n:fv(x.norm),a:hm2(x.fact),o:hm2(x.over),r:fv(r.rate),s:fmt(x.sum)}))+'</p>'}
function gWt(ed){return gHead('wt',ed)+
  '<section class="pn-card"><h3>'+t('wt_plan_h')+'</h3><p class="pn-mu">'+t('wt_plan_e')+'</p><div class="st-g">'+STG.map(function(s){return sf('wt.plan.'+s,t('stg_'+s),{num:1,ed:ed,step:'0.5'})}).join('')+'</div></section>'+
  '<section class="pn-card"><h3>'+t('wt_free_h')+'</h3><p class="pn-mu">'+t('wt_free_e')+'</p><div class="st-g">'+STG.map(function(s){return sf('wt.free.'+s,t('stg_'+s),{num:1,ed:ed,step:'0.5'})}).join('')+'</div></section>'+
  '<section class="pn-card"><h3>'+t('wt_rate_h')+'</h3><p class="pn-mu">'+t('wt_rate_e')+'</p><div class="st-g">'+sf('wt.rate',t('wt_rate'),{num:1,ed:ed})+sf('wt.rateRef',t('wt_rate_ref'),{num:1,ed:ed})+
    sf('wt.round',t('wt_round'),{ed:ed,sel:[[0,t('wt_r0')],[15,t('wt_r15')],[30,t('wt_r30')],[60,t('wt_r60')]]})+sf('wt.cap',t('wt_cap'),{num:1,ed:ed,note:t('wt_cap_e')})+sf('wt.payer',t('wt_payer'),{ed:ed,sel:[['client',t('wt_p_cl')],['carrier',t('wt_p_car')]]})+'</div></section>'+
  '<section class="pn-card st-prev"><h3>'+t('wt_ex_h')+'</h3><div id="wtprev">'+wtPrev()+'</div></section>'}

/* Polzovateli i roli. */
function meId(){var u=SET.users.filter(function(x){return x.role===S.role&&x.st==='on'})[0];return u?u.id:null}
function logins(){var us=SET.users.filter(function(u){return u.st==='on'&&ROLES.indexOf(u.role)>=0}),out=[];if(!us.length)return out;
  for(var i=0;i<6;i++){var u=us[i%us.length];out.push({u:u,at:new Date(TODAY.getTime()+(17-i*3)*36e5-(i>2?DAY:0)),via:i%3?'tg':'code',dev:DEVS[(i*2+u.id.length)%DEVS.length]})}return out}
function gUsers(ed){var me=meId(),rs=ROLES.concat(['drv','broker']);
  var h=gHead('users',ed);
  h+='<section class="pn-card"><div class="sp-hd"><h3>'+t('us_list')+' <small class="pn-mu">'+SET.users.length+'</small></h3></div><div class="sp-gw"><table class="st-tbl"><thead><tr><th>'+t('us_name')+'</th><th>'+t('us_role')+'</th><th>'+t('us_contact')+'</th><th>'+t('us_state')+'</th><th></th></tr></thead><tbody>'+
    SET.users.map(function(u){var own=u.role==='owner';return'<tr><td><b>'+esc(u.n)+'</b>'+(u.id===me?' <span class="pn-new">'+t('us_you')+'</span>':'')+'</td><td>'+(own||!ed?esc(t('role_'+u.role)):'<select data-urole="'+u.id+'">'+rs.map(function(r){return'<option value="'+r+'"'+(r===u.role?' selected':'')+'>'+esc(t('role_'+r))+'</option>'}).join('')+'</select>')+'</td><td>'+esc(u.c)+'</td>'+
      '<td><span class="st-u u-'+u.st+'">'+t(u.st==='on'?'us_active':u.st==='off'?'us_off':'us_invited')+'</span></td><td class="sp-ac">'+(own?'<small class="pn-mu">'+t('us_owner_lock')+'</small>':ed?'<button type="button" class="btn btn-g btn-s" data-utog="'+u.id+'">'+t(u.st==='on'?'us_deact':'us_act')+'</button>':'')+'</td></tr>'}).join('')+'</tbody></table></div></section>';
  if(ed)h+='<section class="pn-card"><h3>'+t('us_inv_h')+'</h3><p class="pn-mu">'+t('us_inv_e')+'</p><div class="st-g"><label class="fld st-f"><span>'+t('us_name')+'</span><input id="invn" value="'+esc(inv.n)+'" autocomplete="off"></label><label class="fld st-f"><span>'+t('us_role')+'</span><select id="invr">'+rs.filter(function(r){return r!=='owner'}).map(function(r){return'<option value="'+r+'"'+(r===inv.role?' selected':'')+'>'+esc(t('role_'+r))+'</option>'}).join('')+'</select></label>'+
    '<label class="fld st-f'+(inv.err?' sp-bad':'')+'"><span>'+t('us_contact')+'</span><input id="invc" value="'+esc(inv.c)+'" placeholder="@username, +998 90 123 45 67" autocomplete="off"><small class="'+(inv.err?'sp-e':'pn-mu')+'">'+esc(inv.err||'')+'</small></label></div><div class="dp-act"><button type="button" class="btn btn-a btn-s" id="invgo">'+t('us_invite')+'</button></div></section>';
  var cols=SECS.concat(PERMS);
  h+='<section class="pn-card"><h3>'+t('us_matrix')+'</h3><p class="pn-mu">'+t('us_matrix_e')+'</p><div class="sp-gw"><table class="st-tbl st-pm"><thead><tr><th>'+t('us_role')+'</th>'+cols.map(function(c){return'<th>'+esc(colName(c))+'</th>'}).join('')+'</tr></thead><tbody>'+
    ROLES.map(function(r){return'<tr><th>'+esc(t('role_'+r))+'</th>'+cols.map(function(c){var v=r==='owner'?2:+SD.perm[r][c]||0;return'<td><button type="button" class="pm pm-'+v+'" data-pm="'+r+'.'+c+'"'+(r==='owner'||!ed?' disabled':'')+' aria-label="'+esc(t('role_'+r)+' · '+colName(c))+'">'+t('pm_'+v)+'</button></td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div>'+
    '<ul class="st-ext">'+EXT_ROLES.map(function(r){return'<li><b>'+esc(t('role_'+r))+'</b>: '+esc(t('role_'+r+'_e'))+'</li>'}).join('')+'</ul></section>';
  h+='<section class="pn-card"><h3>'+t('us_log')+'</h3><p class="pn-mu">'+t('us_log_e')+'</p>'+logins().map(function(x){return'<div class="pn-log"><time>'+x.at.toLocaleString()+'</time><b>'+esc(x.u.n)+'</b><span>'+esc(t('role_'+x.u.role))+' · '+t('us_via_'+x.via)+' · '+esc(x.dev)+'</span></div>'}).join('')+'</section>';
  return h}
function nextNo(){var c=SD.co,y=new Date().getFullYear();return sub(String(c.num||'{n}'),{year:y,yy:String(y).slice(2),n:String(c.seq||1)})}

/* Kompaniya i dokumenty. */
function gCo(ed){var c=SD.co,auto=+c.fxAuto;
  return gHead('co',ed)+
  '<section class="pn-card"><h3>'+t('co_req_h')+'</h3><div class="st-g">'+sf('co.name',t('co_name'),{ed:ed})+sf('co.inn',t('co_inn'),{ed:ed,note:c.inn?'':t('co_fill')})+sf('co.addr',t('co_addr'),{ed:ed})+sf('co.tel',t('co_tel'),{ed:ed})+sf('co.email',t('co_email'),{ed:ed})+
    sf('co.bank',t('co_bank'),{ed:ed,note:c.bank?'':t('co_fill')})+sf('co.acc',t('co_acc'),{ed:ed,note:c.acc?'':t('co_fill')})+sf('co.mfo',t('co_mfo'),{ed:ed,note:c.mfo?'':t('co_fill')})+'</div></section>'+
  '<section class="pn-card"><h3>'+t('co_num_h')+'</h3><div class="st-g">'+sf('co.num',t('co_num'),{ed:ed,note:t('co_num_e')})+sf('co.seq',t('co_seq'),{num:1,ed:ed,step:'1'})+'<p class="fld st-f"><span>'+t('co_next')+'</span><b class="st-next" id="conext">'+esc(nextNo())+'</b></p></div></section>'+
  '<section class="pn-card"><h3>'+t('co_cur_h')+'</h3><p class="pn-mu">'+t('co_cur_e')+'</p><div class="st-cks">'+CURS.map(function(k){return ck('co.cur.'+k,k,ed)}).join('')+'</div>'+(ERR['co.cur']?'<p class="sp-e">'+esc(ERR['co.cur'])+'</p>':'')+
    '<div class="st-g">'+sf('co.fxAuto',t('co_fx_for'),{ed:ed,sel:[[1,t('co_fx_auto')],[0,t('co_fx_man')]]})+['UZS','EUR','AED'].map(function(k){return sf('co.fx.'+k,k+' '+t('co_fx_for'),{num:1,ed:ed&&!auto,step:k==='UZS'?'1':'0.0001'})}).join('')+'</div></section>'+
  '<section class="pn-card"><h3>'+t('co_pay_h')+'</h3><div class="st-g">'+sf('co.prepay',t('co_prepay'),{num:1,ed:ed,step:'1'})+sf('co.defer',t('co_defer'),{num:1,ed:ed,step:'1'})+sf('co.vat',t('co_vat'),{ed:ed,sel:[[0,t('co_vat_off')],[1,t('co_vat_on')]]})+sf('co.vatPct',t('co_vat_pct'),{num:1,ed:ed&&!!+c.vat,step:'1'})+'</div></section>'}

/* Uvedomleniya. */
function tplOf(lang,k){var v=SD.nt.tpl[lang]&&SD.nt.tpl[lang][k];return String(v||'').trim()||D.tpl[lang][k]}
function ntPrev(){var ex={id:'CPG-24109',st:t('k_3'),dr:TN[0]+' A.'};return TPLS.map(function(k){return'<div class="bt">'+esc(sub(tplOf(L,k),ex))+'</div>'}).join('')}
function gNt(ed){var hrs=[];for(var i=0;i<24;i++)hrs.push([i,('0'+i).slice(-2)+':00']);
  return gHead('nt',ed)+
  '<section class="pn-card"><div class="sp-gw"><table class="st-tbl"><thead><tr><th>'+t('nt_ev')+'</th><th>'+t('nt_cl')+'</th><th>'+t('nt_grp')+'</th><th>'+t('nt_em')+'</th></tr></thead><tbody>'+
    EVS.map(function(e){return'<tr><th>'+esc(t('ev_'+e))+'</th>'+[0,1,2].map(function(i){return'<td>'+ck('nt.ch.'+e+'.'+i,'',ed)+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div></section>'+
  '<section class="pn-card"><h3>'+t('nt_tpl_h')+'</h3><p class="pn-mu">'+t('nt_tpl_e')+'</p><div class="st-tpl">'+TPLS.map(function(k){return'<div class="st-tpl-r"><b>'+esc(t('ev_'+k))+'</b>'+sf('nt.tpl.ru.'+k,'RU',{area:1,ed:ed,ph:D.tpl.ru[k]})+sf('nt.tpl.uz.'+k,'UZ',{area:1,ed:ed,ph:D.tpl.uz[k]})+'</div>'}).join('')+'</div>'+
    '<h3 class="dp-h4">'+t('nt_prev')+'</h3><div class="phone st-ph" aria-label="Telegram"><div class="scr"><div class="tgh"><i></i><b>@cargoprogroup_bot</b></div><div class="chat on" id="ntprev">'+ntPrev()+'</div></div></div></section>'+
  '<section class="pn-card"><h3>'+t('nt_quiet')+'</h3><p class="pn-mu">'+t('nt_quiet_e')+'</p><div class="st-g">'+sf('nt.quiet.from',t('nt_from'),{ed:ed,sel:hrs})+sf('nt.quiet.to',t('nt_to'),{ed:ed,sel:hrs})+'</div></section>'}

function vSet(){if(!SET)loadSet();var g=setGrp,ed=canEdit(g);
  return'<p class="pn-hint">'+t('st_hint')+' '+t('st_int_link')+'</p><div class="st"><nav class="st-nav" aria-label="'+t('st_grp_pick')+'">'+GRPS.map(function(x){return'<a '+hl(x)+(x===g?' aria-current="page"':'')+'>'+t('st_grp_'+x)+'</a>'}).join('')+'</nav>'+
    '<label class="fld st-sel"><span>'+t('st_grp_pick')+'</span><select id="stgrp">'+GRPS.map(function(x){return'<option value="'+x+'"'+(x===g?' selected':'')+'>'+t('st_grp_'+x)+'</option>'}).join('')+'</select></label>'+
    '<div class="st-body" id="stb">'+(g==='tar'?gTar(ed):g==='wt'?gWt(ed):g==='users'?gUsers(ed):g==='co'?gCo(ed):gNt(ed))+'</div></div>'+
    '<div class="st-bar" id="stbar" hidden><span>'+t('st_unsaved')+'</span><button type="button" class="btn btn-a btn-s" id="stsave">'+t('st_save')+'</button><button type="button" class="btn btn-g btn-s" id="stcancel">'+t('st_cancel')+'</button></div>'}
function stBar(){var b=$('#stbar');if(!b)return;b.hidden=!diffs(SET,SD).length}
function stPreview(){var e=$('#trprev');if(e)e.innerHTML=trPrev();e=$('#wtprev');if(e)e.innerHTML=wtPrev();e=$('#conext');if(e)e.textContent=nextNo();e=$('#ntprev');if(e)e.innerHTML=ntPrev()}
function onField(e){var el=e.target,p=el.getAttribute&&el.getAttribute('data-p');if(!p)return;var v;
  if(el.type==='checkbox')v=el.checked?1:0;else if(el.getAttribute('data-t')==='num')v=el.value===''?'':+String(el.value).replace(',','.');else v=el.value;
  pathSet(SD,p,v);var m=ferrCalc(p,v);if(m)ERR[p]=m;else delete ERR[p];
  var sm=$('[data-e="'+p+'"]',$('#stb'));if(sm){sm.textContent=m||sm.getAttribute('data-n')||'';sm.className=m?'sp-e':'pn-mu'}var lb=el.closest('.st-f');if(lb)lb.classList.toggle('sp-bad',!!m);
  clearTimeout(prevT);prevT=setTimeout(stPreview,ST_MS);stBar();
  if(e.type==='change'&&(p==='co.fxAuto'||p==='co.vat'))render()}
function stSave(){var bad=validateAll();if(bad.length){render();toast(t('st_errs'));return}
  diffs(SET,SD).forEach(function(x){log('l_set',labOf(x[0])+': '+showV(x[0],x[1])+' → '+showV(x[0],x[2]))});
  SET=clone(SD);saveSet();ERR={};toast(t('st_saved'));render()}
function usersPut(){SET.users=clone(SD.users);saveSet()}
function bindSet(v){var g=function(s,f){var e=$(s,v);if(e)e.addEventListener('click',f)};
  var b=$('#stb',v);b.addEventListener('input',onField);b.addEventListener('change',onField);
  var sel=$('#stgrp',v);if(sel)sel.addEventListener('change',function(){location.hash='set-'+sel.value});
  g('#stsave',stSave);
  g('#stcancel',function(){SD=clone(SET);ERR={};inv={n:'',role:'disp',c:''};render()});
  $$('[data-streset]',v).forEach(function(x){x.addEventListener('click',function(){var k=x.getAttribute('data-streset');if(k==='users'){SD.perm=clone(DEF.perm);SD.users=clone(DEF.users);usersPut()}else SD[k]=clone(DEF[k]);ERR={};render();stBar()})});
  $$('[data-pm]',v).forEach(function(x){x.addEventListener('click',function(){var a=x.getAttribute('data-pm').split('.'),n=((+SD.perm[a[0]][a[1]]||0)+1)%3;SD.perm[a[0]][a[1]]=n;x.className='pm pm-'+n;x.textContent=t('pm_'+n);stBar()})});
  $$('[data-urole]',v).forEach(function(x){x.addEventListener('change',function(){var u=SD.users.filter(function(y){return y.id===x.getAttribute('data-urole')})[0];if(!u)return;var was=u.role;u.role=x.value;usersPut();log('l_urole',u.n+': '+t('role_'+was)+' → '+t('role_'+u.role));render()})});
  $$('[data-utog]',v).forEach(function(x){x.addEventListener('click',function(){var u=SD.users.filter(function(y){return y.id===x.getAttribute('data-utog')})[0];if(!u)return;u.st=u.st==='on'?'off':'on';usersPut();log(u.st==='on'?'l_react':'l_deact',u.n);render()})});
  g('#invgo',function(){inv={n:$('#invn',v).value.trim(),role:$('#invr',v).value,c:$('#invc',v).value.trim()};
    if(!inv.n){inv.err=t('e_req');render();return}
    if(!/^@\w{3,}$/.test(inv.c)&&!/^\+998[\d ]{9,}$/.test(inv.c)){inv.err=t('e_contact');render();return}
    SD.users.push({id:'U'+(SD.users.length+1),n:inv.n,role:inv.role,c:inv.c,st:'inv'});usersPut();log('l_invite',inv.n+' · '+t('role_'+inv.role));inv={n:'',role:'disp',c:''};toast(t('us_invited_ok'));render()});
  stBar()}
/* Nastroyki pomenyali v drugoy vkladke: perechityvaem, esli zdes net nesohranyonnogo. */
addEventListener('storage',function(e){if(e.key===SKEY){var keep=diffs(SET,SD).length?clone(SD):null;loadSet();if(keep)SD=keep;if(!keep||view!=='set')render()}});
