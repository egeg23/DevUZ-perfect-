/* Super-adminka CARGO PRO GROUP: avtopark i voditeli s dokumentami dlya tamozhni,
   paket dlya tamozhennogo brokera (CMR, knizhka MDP, tranzitnaya deklaratsiya),
   integratsii 1S / Bitriks24 / Telegram (demo: nichego nikuda ne uhodit) i
   besplatnye dopy: sroki dokumentov, putevoy list, prostoy, foto dostavki,
   otchyot dnya. Vstavlyaetsya v zamykanie dispatch.js (gen.mjs), polzuetsya ego
   FLEET, TR, RUN, S, t(), get(), put(). Sostoyanie avtoparka: cp-fleet-1. */
var L=D.l,DAY=864e5,TODAY=new Date();TODAY.setHours(0,0,0,0);
var BT=['tent','ref','iso','bort','c20','c40','tral','tank','dump','car'];
var CODE={van:'tent',b5:'tent',b10:'tent',fura:'tent',ref:'ref',c20:'c20',c40:'c40',tral:'tral'};
BODY.tent={kg:20000,v:86};BODY.iso={kg:20000,v:82};BODY.bort={kg:20000,v:0};BODY.tank={kg:20000,v:0};BODY.dump={kg:20000,v:0};BODY.car={kg:15000,v:0};
FIT.gen=FIT.gen.concat(['tent','iso','bort']);FIT.dg=FIT.dg.concat(['tent']);
var CNT=['UZ','KZ','KG','TJ','TM','RU','TR'];
var FN=['AZIZ','BOBUR','DILSHOD','JASUR','KAMOL','MUROD','NODIR','OYBEK','RUSTAM','SARDOR','TIMUR','ULUGBEK'];
var MK={van:'GAZ GAZelle Next',b5:'Isuzu NPR 75',b10:'Isuzu FVR 34',fura:'MAN TGX 18.480',ref:'Mercedes-Benz Actros 1845',c20:'DAF XF 480',c40:'Volvo FH 500',tral:'Scania R 500'};
var PAL={van:4,b5:10,b10:15,fura:33,ref:33,c20:11,c40:24,tral:0};
var TRAIL={fura:1,ref:1,c20:1,c40:1,tral:1};
/* Novye slova-lovushki: poluchateli v pakete dlya brokera i perevozchik. */
var TN3=['[[t:10]]','[[t:11]]','[[t:12]]'];
var POSTS=['gisht','yallama','dustlik','oybek','ayritom','alat'];

/* Transliteratsiya kirillitsy v latinitsu dlya imeni «kak v pasporte» (kody simvolov, chtoby v kode ne bylo kirillitsy). */
var LAT=['A','B','V','G','D','E','J','Z','I','Y','K','L','M','N','O','P','R','S','T','U','F','X','TS','CH','SH','SH','','I','','E','YU','YA'];
function lat(s){return String(s).split('').map(function(ch){var c=ch.charCodeAt(0);if(c>=0x410&&c<=0x42F)return LAT[c-0x410];if(c>=0x430&&c<=0x44F)return LAT[c-0x430];if(c===0x401||c===0x451)return'YO';return ch.toUpperCase()}).join('')}
function iso(n){var x=new Date(TODAY.getTime()+n*DAY);return x.getFullYear()+'-'+('0'+(x.getMonth()+1)).slice(-2)+'-'+('0'+x.getDate()).slice(-2)}
function left(dt){if(!dt)return null;var x=new Date(dt+'T00:00:00');return isNaN(x)?null:Math.round((x-TODAY)/DAY)}
function dshow(dt){if(!dt)return'';var p=dt.split('-');return p[2]+'.'+p[1]+'.'+p[0]}
var zs=31102026;function r2(){zs=(zs*16807)%2147483647;return zs/2147483647}
function digs(n){var s='';for(var i=0;i<n;i++)s+=Math.floor(r2()*10);return s}
var VINC='ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
function vin(){var s='';for(var i=0;i<17;i++)s+=VINC.charAt(Math.floor(r2()*VINC.length));return s}

/* Demo-zapisi: po odnoy mashine i odnomu voditelyu na kazhduyu mashinu parka. Chast poley pustaya: paket dlya brokera pokazhet ih krasnym. */
var DEMO_T={},DEMO_D={};
FLEET.forEach(function(f,i){var did='D'+(i+1),nm=f.dr.split(' ')[0],tr=TRAIL[f.b];
  DEMO_D[did]={id:did,lat:lat(nm)+' '+FN[i],cyr:f.dr,bd:iso(-(9500+Math.floor(r2()*6000))),cit:i===10?'KG':'UZ',pass:i===10?'ID'+digs(7):'A'+'BCD'.charAt(i%3)+digs(7),
    by:i===6?'':'IIB '+digs(5),iss:iso(-(400+Math.floor(r2()*2500))),exp:iso(f.doc[0]>0?900+Math.floor(r2()*1500):f.doc[0]+200),pinfl:digs(14),lic:'AF'+digs(7),cat:tr?'B, C, CE':'B, C',
    licx:iso(f.doc[0]),adrx:f.adr?iso(f.doc[2]+40):'',med:iso(i===3?18:120+Math.floor(r2()*200)),tel:'+998 9'+digs(1)+' '+digs(3)+' '+digs(2)+' '+digs(2),tg:''};
  DEMO_T[f.id]={id:f.id,pl:f.pl,tpl:tr?'01 '+(100+Math.floor(r2()*899))+' '+'XAB'.charAt(i%3)+'XA':'',cn:'UZ',mk:MK[f.b],vin:vin(),yr:2014+Math.floor(r2()*11),bt:CODE[f.b],t:f.kg/1000,m3:f.v,pal:PAL[f.b],
    temp:f.b==='ref'?'+2...+6':'',adr:f.adr?'3, 8, 9':'',tir:tr&&i!==6?'XC '+digs(8):'',tech:'AAF '+digs(7),cmr:tr?iso(f.doc[2]+30):'',ins:iso(f.doc[2]),drv:did,demo:1}});
var FL=get('cp-fleet-1',{tr:{},dr:{}});FL.tr=FL.tr||{};FL.dr=FL.dr||{};
function trucks(){var o={};Object.keys(DEMO_T).forEach(function(k){o[k]=Object.assign({},DEMO_T[k],FL.tr[k]||{})});Object.keys(FL.tr).forEach(function(k){if(!DEMO_T[k]&&FL.tr[k])o[k]=FL.tr[k]});return o}
function drivers(){var o={};Object.keys(DEMO_D).forEach(function(k){o[k]=Object.assign({},DEMO_D[k],FL.dr[k]||{})});Object.keys(FL.dr).forEach(function(k){if(!DEMO_D[k]&&FL.dr[k])o[k]=FL.dr[k]});return o}
function dname(p){if(!p)return'';return L==='ru'?(p.cyr||p.lat):(p.lat||p.cyr)}
function codeOf(r){return r.bt==='tent'?(r.t<=1.5?'van':r.t<=5?'b5':r.t<=10?'b10':'fura'):r.bt}
function btLabel(r){return t('bt_'+r.bt)+' '+fv(r.t)+' '+t('t_unit')}

/* Avtopark v dispetcherskoy: pravki demo-mashin i novye mashiny srazu v raspredelenii, na karte i v vybore perevozchika. */
function syncFleet(){var T=trucks(),P=drivers();
  Object.keys(T).forEach(function(id){var r=T[id],f=TR[id],p=P[r.drv];
    var docs=[left(p&&p.licx),left(r.cmr||r.ins),left(r.ins)].map(function(x){return x==null?365:x});
    if(!f){f={id:id,rate:4.5,trips:0,late:0,km:+(0.42+r2()*.2).toFixed(2),u:1};FLEET.push(f);TR[id]=f;RUN.push({f:f,to:'sam',st:'free',k:0,sp:0,spd:0,fuel:100,odo:0,ping:1,off:false})}
    f.pl=r.pl;f.adr=!!r.adr;if(f.u||r.ed||FL.dr[r.drv]||FL.tr[id])f.dr=dname(p)||t('f_none');
    if(f.u||r.ed){f.b=codeOf(r);if(f.b==='van'||f.b==='b5'||f.b==='b10'||f.b==='fura')f.b='tent';f.kg=Math.round(r.t*1000);f.v=+r.m3||0;f.lab=btLabel(r);f.doc=docs}});
  for(var i=FLEET.length-1;i>=0;i--){var f=FLEET[i];if(f.u&&!T[f.id]){FLEET.splice(i,1);RUN.splice(i,1);delete TR[f.id];if(S.as)Object.keys(S.as).forEach(function(c){if(S.as[c]===f.id)delete S.as[c]})}}}
function bn(f){return f.lab||t('b_'+f.b)}

/* Proverki poley. Gosnomer Uzbekistana: «01 A 123 BC» ili «01 123 ABC». */
var PL_UZ=/^\d{2} ?([A-Z] ?\d{3} ?[A-Z]{2}|\d{3} ?[A-Z]{3})$/;
function vTruck(r){var e={};
  if(!r.pl)e.pl=t('e_req');else if(r.cn==='UZ'&&!PL_UZ.test(r.pl))e.pl=t('e_plate');else if(r.pl.length<4)e.pl=t('e_req');
  if(r.tpl&&r.cn==='UZ'&&!PL_UZ.test(r.tpl))e.tpl=t('e_plate');
  if(!/^[A-HJ-NPR-Z0-9]{17}$/.test(r.vin||''))e.vin=t('e_vin');
  var y=+r.yr;if(!(y>=1990&&y<=TODAY.getFullYear()+1))e.yr=t('e_year');
  if(!(+r.t>0))e.t=t('e_num');if(r.bt!=='tral'&&r.bt!=='bort'&&r.bt!=='tank'&&r.bt!=='car'&&!(+r.m3>0))e.m3=t('e_num');
  if(!r.mk)e.mk=t('e_req');return e}
function vDriver(p){var e={};
  if(!/^[A-Z][A-Z' -]{2,}$/.test(p.lat||''))e.lat=t('e_lat');
  if(!p.pass)e.pass=t('e_req');else if(p.cit==='UZ'&&!/^[A-Z]{2}\d{7}$/.test(p.pass))e.pass=t('e_pass');
  if(p.cit==='UZ'&&!/^\d{14}$/.test(p.pinfl||''))e.pinfl=t('e_pinfl');
  ['bd','iss','exp','licx','med'].forEach(function(k){if(left(p[k])==null)e[k]=t('e_date')});
  if(!p.lic)e.lic=t('e_req');
  if(p.tel&&!/^\+998 ?\d{2} ?\d{3} ?\d{2} ?\d{2}$/.test(p.tel))e.tel=t('e_tel');
  return e}

/* Sroki dokumentov (besplatno): vse, chto istekaet za 30 dney ili uzhe prosrocheno. */
function expiring(){var out=[],T=trucks(),P=drivers();
  Object.keys(P).forEach(function(k){var p=P[k];[['licx','d_lic'],['exp','d_pass'],['med','d_med'],['adrx','d_adr']].forEach(function(x){var n=left(p[x[0]]);if(n!=null&&n<=30)out.push({who:dname(p),d:x[1],n:n,dt:p[x[0]]})})});
  Object.keys(T).forEach(function(k){var r=T[k];[['ins','d_ins'],['cmr','d_cmr']].forEach(function(x){var n=left(r[x[0]]);if(n!=null&&n<=30)out.push({who:r.pl+' · '+r.mk,d:x[1],n:n,dt:r[x[0]]})})});
  return out.sort(function(a,b){return a.n-b.n})}
function dl(n){return n==null?'':n<0?'<b class="dp-bad">'+t('d_exp')+'</b>':n<=30?'<b class="warn">'+n+' '+t('days')+'</b>':'<span>'+n+' '+t('days')+'</span>'}

/* Forma: pole s oshibkoy pod nim. */
var form=null,docsAll=false;
function fld(k,lab,v,o){o=o||{};var err=form&&form.err&&form.err[k];
  var inp=o.sel?'<select name="'+k+'">'+o.sel.map(function(x){return'<option value="'+esc(x[0])+'"'+(String(x[0])===String(v)?' selected':'')+'>'+esc(x[1])+'</option>'}).join('')+'</select>':
    '<input name="'+k+'" value="'+esc(v==null?'':v)+'"'+(o.type?' type="'+o.type+'"':'')+(o.ph?' placeholder="'+esc(o.ph)+'"':'')+(o.mode?' inputmode="'+o.mode+'"':'')+' autocomplete="off">';
  return'<label class="fld sp-f'+(err?' sp-bad':'')+'"><span>'+lab+'</span>'+inp+(err?'<small class="sp-e">'+esc(err)+'</small>':o.note?'<small class="pn-mu">'+esc(o.note)+'</small>':'')+'</label>'}
function tForm(r){var P=drivers();return'<form class="pn-card sp-form" id="spf" novalidate><h3>'+(r.id?t('f_edit')+' · '+esc(r.pl):t('f_add_t'))+'</h3><div class="sp-g">'+
  fld('pl',t('v_plate'),r.pl,{ph:'01 A 123 BC'})+fld('tpl',t('v_trail'),r.tpl,{ph:'01 123 ABC'})+fld('cn',t('v_country'),r.cn||'UZ',{sel:CNT.map(function(c){return[c,c]})})+
  fld('mk',t('v_make'),r.mk,{ph:'MAN TGX 18.480'})+fld('vin',t('v_vin'),r.vin,{ph:'WMA06XZZ7KM812345'})+fld('yr',t('v_year'),r.yr,{mode:'numeric'})+
  fld('bt',t('v_body'),r.bt||'tent',{sel:BT.map(function(b){return[b,t('bt_'+b)]})})+fld('t',t('v_t'),r.t,{mode:'decimal'})+fld('m3',t('v_m3'),r.m3,{mode:'decimal'})+fld('pal',t('v_pal'),r.pal,{mode:'numeric'})+
  fld('temp',t('v_temp'),r.temp,{ph:'+2...+6'})+fld('adr',t('v_adr'),r.adr,{ph:'3, 8, 9'})+fld('tir',t('v_tir'),r.tir,{ph:'XC 12345678'})+fld('tech',t('v_tech'),r.tech)+
  fld('cmr',t('v_cmrins'),r.cmr,{type:'date'})+fld('ins',t('v_ins'),r.ins,{type:'date'})+
  fld('drv',t('v_drv'),r.drv,{sel:[['',t('f_none')]].concat(Object.keys(P).map(function(k){return[k,dname(P[k])]}))})+
  '</div><div class="dp-act"><button type="submit" class="btn btn-a">'+t('f_save')+'</button><button type="button" class="btn btn-g btn-s" id="spx">'+t('f_cancel')+'</button></div>'+(form.err&&Object.keys(form.err).length?'<p class="dp-err">'+t('f_err')+'</p>':'')+'</form>'}
function dForm(p){return'<form class="pn-card sp-form" id="spf" novalidate><h3>'+(p.id?t('f_edit')+' · '+esc(dname(p)):t('f_add_d'))+'</h3><div class="sp-g">'+
  fld('lat',t('p_lat'),p.lat,{ph:'KARIMOV AZIZ'})+fld('cyr',t('p_cyr'),p.cyr)+fld('bd',t('p_birth'),p.bd,{type:'date'})+fld('cit',t('p_cit'),p.cit||'UZ',{sel:CNT.map(function(c){return[c,c]})})+
  fld('pass',t('p_pass'),p.pass,{ph:'AB1234567'})+fld('by',t('p_by'),p.by)+fld('iss',t('p_iss'),p.iss,{type:'date'})+fld('exp',t('p_exp'),p.exp,{type:'date'})+
  fld('pinfl',t('p_pinfl'),p.pinfl,{mode:'numeric',ph:'31234567890123'})+fld('lic',t('p_lic'),p.lic,{ph:'AF1234567'})+fld('cat',t('p_cat'),p.cat,{ph:'B, C, CE'})+fld('licx',t('p_licexp'),p.licx,{type:'date'})+
  fld('adrx',t('p_adr'),p.adrx,{type:'date'})+fld('med',t('p_med'),p.med,{type:'date'})+fld('tel',t('p_tel'),p.tel,{ph:'+998 90 123 45 67',mode:'tel'})+fld('tg',t('p_tg'),p.tg,{ph:'@username'})+
  '</div><div class="dp-act"><button type="submit" class="btn btn-a">'+t('f_save')+'</button><button type="button" class="btn btn-g btn-s" id="spx">'+t('f_cancel')+'</button></div>'+(form.err&&Object.keys(form.err).length?'<p class="dp-err">'+t('f_err')+'</p>':'')+'</form>'}

function vFleet(){var T=trucks(),P=drivers(),ex=expiring();
  var h='<p class="pn-hint">'+t('f_hint')+'</p>';
  h+='<section class="pn-card sp-docs"><h3>'+t('x_docs')+' <span class="sp-free">'+t('free')+'</span></h3><p class="pn-mu">'+t('x_docs_e')+'</p>'+(ex.length?'<div class="sp-dl">'+ex.slice(0,docsAll?99:5).map(function(x){
    var m=encodeURIComponent(t('x_remind_m')+': '+t(x.d)+', '+x.who+', '+dshow(x.dt));
    return'<div class="sp-di'+(x.n<0?' bad':'')+'"><b>'+esc(x.who)+'</b><span>'+t(x.d)+' · '+dshow(x.dt)+'</span>'+dl(x.n)+'<a class="btn btn-g btn-s" href="https://t.me/share/url?url=cargoprogroup.uz&amp;text='+m+'" target="_blank" rel="noopener">'+t('x_remind')+'</a></div>'}).join('')+'</div>'+(ex.length>5?'<button type="button" class="btn btn-g btn-s" id="spdocs">'+(docsAll?t('x_less'):t('x_more')+' · '+ex.length)+'</button>':''):'<p class="pn-mu">'+t('x_docs_ok')+'</p>')+'</section>';
  if(form)h+=form.k==='t'?tForm(form.r):dForm(form.r);
  h+='<section class="pn-card"><div class="sp-hd"><h3>'+t('f_trucks')+' <small class="pn-mu">'+Object.keys(T).length+'</small></h3><button type="button" class="btn btn-a btn-s" id="spat">'+t('f_add_t')+'</button></div><table class="pn-t sp-t"><thead><tr><th>'+t('v_plate')+'</th><th>'+t('v_body')+'</th><th>'+t('v_make')+'</th><th>VIN</th><th>'+t('v_tir')+'</th><th>'+t('v_ins')+'</th><th>'+t('v_drv')+'</th><th></th></tr></thead><tbody>'+
    Object.keys(T).map(function(k){var r=T[k];return'<tr data-tid="'+k+'"><td><b>'+esc(r.pl)+'</b>'+(r.tpl?'<br><small class="pn-mu">'+esc(r.tpl)+'</small>':'')+(r.demo?'':'<br><span class="pn-new">'+t('f_new')+'</span>')+'</td><td>'+esc(btLabel(r))+(r.adr?' <span class="dp-adr">ADR</span>':'')+'</td><td>'+esc(r.mk)+' · '+esc(r.yr)+'</td><td><small>'+esc(r.vin)+'</small></td><td>'+(r.tir?esc(r.tir):'<b class="dp-bad">'+t('f_none')+'</b>')+'</td><td>'+dl(left(r.ins))+'</td><td>'+esc(dname(P[r.drv])||t('f_none'))+'</td><td class="sp-ac"><button type="button" class="btn btn-g btn-s" data-et="'+k+'">'+t('f_edit')+'</button>'+(r.demo?'':'<button type="button" class="btn btn-g btn-s" data-xt="'+k+'">'+t('f_del')+'</button>')+'</td></tr>'}).join('')+'</tbody></table></section>';
  h+='<section class="pn-card"><div class="sp-hd"><h3>'+t('f_drivers')+' <small class="pn-mu">'+Object.keys(P).length+'</small></h3><button type="button" class="btn btn-a btn-s" id="spad">'+t('f_add_d')+'</button></div><table class="pn-t sp-t"><thead><tr><th>'+t('p_lat')+'</th><th>'+t('p_cit')+'</th><th>'+t('p_pass')+'</th><th>'+t('p_exp')+'</th><th>'+t('p_licexp')+'</th><th>'+t('p_med')+'</th><th>'+t('p_adr')+'</th><th></th></tr></thead><tbody>'+
    Object.keys(P).map(function(k){var p=P[k];return'<tr data-did="'+k+'"><td><b>'+esc(p.lat)+'</b><br><small class="pn-mu">'+esc(p.cyr||'')+'</small>'+(DEMO_D[k]?'':'<br><span class="pn-new">'+t('f_new')+'</span>')+'</td><td>'+esc(p.cit)+'</td><td>'+esc(p.pass)+'</td><td>'+dl(left(p.exp))+'</td><td>'+dl(left(p.licx))+'</td><td>'+dl(left(p.med))+'</td><td>'+(p.adrx?dl(left(p.adrx)):'<span class="pn-mu">'+t('f_none')+'</span>')+'</td><td class="sp-ac"><button type="button" class="btn btn-g btn-s" data-ed="'+k+'">'+t('f_edit')+'</button>'+(DEMO_D[k]?'':'<button type="button" class="btn btn-g btn-s" data-xd="'+k+'">'+t('f_del')+'</button>')+'</td></tr>'}).join('')+'</tbody></table></section>';
  return h}
function readForm(el){var o={};[].slice.call(el.elements).forEach(function(x){if(x.name)o[x.name]=String(x.value).trim()});return o}
function bindFleet(v){var g=function(s,f){var e=$(s,v);if(e)e.addEventListener('click',f)};
  g('#spat',function(){form={k:'t',r:{cn:'UZ',bt:'tent'},err:null};render();var f=$('#spf');if(f)f.scrollIntoView({block:'start'})});
  g('#spad',function(){form={k:'d',r:{cit:'UZ'},err:null};render();var f=$('#spf');if(f)f.scrollIntoView({block:'start'})});
  g('#spx',function(){form=null;render()});
  g('#spdocs',function(){docsAll=!docsAll;render()});
  $$('[data-et]',v).forEach(function(b){b.addEventListener('click',function(){form={k:'t',r:trucks()[b.getAttribute('data-et')],err:null};render();$('#spf').scrollIntoView({block:'start'})})});
  $$('[data-ed]',v).forEach(function(b){b.addEventListener('click',function(){form={k:'d',r:drivers()[b.getAttribute('data-ed')],err:null};render();$('#spf').scrollIntoView({block:'start'})})});
  $$('[data-xt]',v).forEach(function(b){b.addEventListener('click',function(){var k=b.getAttribute('data-xt');delete FL.tr[k];put('cp-fleet-1',FL);syncFleet();log('l_fleet',k);toast(t('f_deleted'));render()})});
  $$('[data-xd]',v).forEach(function(b){b.addEventListener('click',function(){var k=b.getAttribute('data-xd');delete FL.dr[k];put('cp-fleet-1',FL);syncFleet();log('l_fleet',k);toast(t('f_deleted'));render()})});
  var f=$('#spf',v);if(!f)return;
  f.addEventListener('submit',function(e){e.preventDefault();var o=readForm(f),old=form.r||{};
    if(form.k==='t'){o.pl=o.pl.toUpperCase().replace(/\s+/g,' ');o.tpl=o.tpl.toUpperCase().replace(/\s+/g,' ');o.vin=o.vin.toUpperCase();o.t=+String(o.t).replace(',','.');o.m3=+String(o.m3).replace(',','.')||0;o.pal=+o.pal||0;o.yr=+o.yr;
      var err=vTruck(o);if(Object.keys(err).length){form.err=err;form.r=Object.assign({},old,o);render();var bad=$('.sp-bad input,.sp-bad select');if(bad)bad.focus();return}
      var id=old.id||('U'+Date.now().toString(36));o.id=id;if(old.demo){o.ed=1;o.demo=1}FL.tr[id]=Object.assign({},FL.tr[id]||{},o);
      if(!old.id&&S.ic.c1!==false)xlog(t('il_fleet')+' '+o.pl)}
    else{o.lat=o.lat.toUpperCase();o.pass=o.pass.toUpperCase().replace(/\s/g,'');
      var er=vDriver(o);if(Object.keys(er).length){form.err=er;form.r=Object.assign({},old,o);render();var bd=$('.sp-bad input,.sp-bad select');if(bd)bd.focus();return}
      var did=old.id||('P'+Date.now().toString(36));o.id=did;FL.dr[did]=Object.assign({},FL.dr[did]||{},o)}
    put('cp-fleet-1',FL);syncFleet();log('l_fleet',form.k==='t'?o.pl:o.lat);form=null;toast(t('f_saved'));render()})}

/* Integratsii: demo-podklyuchenie, svyazi poley i zhurnal obmena. */
S.ic=S.ic||{c1:true,bx:true,tg:true};S.xl=S.xl||[];S.bk=S.bk||{};S.tx=S.tx||{};
var setup={};
function xlog(txt){S.xl.unshift({at:Date.now(),x:txt});S.xl=S.xl.slice(0,60);save()}
function onStatus(id,s){var n=String(id).replace(/\D/g,'');
  if(S.ic.bx)xlog(t('il_bx')+' #'+n+' · '+t('il_bx_st')+' «'+t('k_'+s)+'»');
  if(S.ic.tg)xlog(t('il_tg_cl')+' «'+t('k_'+s)+'» · '+id);
  if(S.ic.tg&&s===3)xlog(t('il_tg_drv')+' · '+id);
  if(S.ic.c1&&s===0)xlog(t('il_1c_cpt')+' · '+id);
  if(S.ic.c1&&s===5)xlog(t('il_1c_act')+' '+id);
  var cb=get('cp-cab-1',{});if(S.ic.tg&&cb.links&&cb.links[id])xlog(t('il_tg_cab')+' '+((cb.u&&cb.u.n)||t('il_tg_cab_n'))+' '+t('il_tg_cab_st')+' «'+t('k_'+s)+'» · '+id)}
var INT=[
  {k:'c1',n:'i_1c',e:'i_1c_e',dir:'i_1c_dir',sch:'i_1c_sched',f:[['i_1c_url','https://1c.cargoprogroup.uz/hs/cargo'],['i_1c_user','exchange']],map:[['i_f_trip','i_f_act'],['i_f_co','i_f_cpt'],['i_f_pay','i_f_paid']],sec:1},
  {k:'bx',n:'i_bx',e:'i_bx_e',dir:'i_bx_dir',sch:'i_bx_sched',f:[['i_bx_url','https://cargopro.bitrix24.kz/rest/1/••••••••/']],map:[['i_f_req','i_f_deal'],['i_f_st','i_f_stage'],['i_f_co','i_f_cpt'],['i_f_mgr','i_f_mgr']],sec:0},
  {k:'tg',n:'i_tg',e:'i_tg_e',dir:'i_tg_dir',sch:'i_tg_sched',f:[['i_tg_tok','••••••••••:••••••••••••••••'],['i_tg_grp','@cargopro_dispatch']],map:[['i_f_st','i_f_grp'],['i_f_drvbtn','i_f_st'],['i_f_cmr','i_f_pod'],['i_f_alarm','i_f_grp']],sec:1}];
function report(){var tr=trips(),go=0,done=0;tr.forEach(function(o){var s=stOf(o.id,o.s0);if(s===5)done++;else if(s>=2)go++});
  var late=RUN.filter(function(r){return r.st==='late'}).length,ex=expiring().length;
  return{go:go,done:done,late:late,ex:ex,txt:t('x_report')+' · '+dshow(iso(0))+': '+go+' '+t('x_rep_go')+', '+done+' '+t('x_rep_done')+', '+late+' '+t('x_rep_late')+', '+ex+' '+t('x_rep_docs')}}
/* Клиентский раздел на сайте: сколько заказов клиенты привязали к боту, показывать ли им телефон водителя. */
function cabLine(){var cb=get('cp-cab-1',{}),n=Object.keys(cb.links||{}).length;S.ic.dph=S.ic.dph!==false;
  return'<div class="dp-kv"><span>'+t('i_tg_cab')+'</span><b id="tgcab">'+n+'</b><span>'+t('i_dph')+'</span><b><button type="button" class="btn btn-g btn-s" id="dph" aria-pressed="'+S.ic.dph+'">'+t(S.ic.dph?'i_dph_on':'i_dph_off')+'</button></b></div>'}
function vInt(){var h='<p class="pn-hint">'+t('i_hint')+'</p><div class="sp-ints">';
  h+=INT.map(function(c){var on=!!S.ic[c.k];return'<section class="pn-card sp-int'+(on?' on':'')+'"><header><b>'+t(c.n)+'</b><span class="sp-st">'+t(on?'i_on':'i_off')+'</span></header><p class="pn-mu">'+t(c.e)+'</p>'+
    '<div class="dp-kv"><span>'+t('i_dir')+'</span><b>'+t(c.dir)+'</b><span>'+t('i_sched')+'</span><b>'+t(c.sch)+'</b></div>'+
    (c.k==='tg'?cabLine():'')+
    '<h4 class="dp-h4">'+t('i_map')+'</h4><div class="sp-map">'+c.map.map(function(m){return'<span>'+t(m[0])+'</span><i aria-hidden="true">→</i><span>'+t(m[1])+'</span>'}).join('')+'</div>'+
    (setup[c.k]?'<div class="sp-set">'+c.f.map(function(x,i){return'<label class="fld"><span>'+t(x[0])+'</span><input value="'+esc(x[1])+'" readonly'+(c.sec&&i===0&&c.k==='tg'?' type="password"':'')+'><small class="pn-mu">'+t('i_secret')+'</small></label>'}).join('')+'</div>':'')+
    '<div class="dp-act"><button type="button" class="btn btn-g btn-s" data-iset="'+c.k+'">'+t('i_setup')+'</button><button type="button" class="btn '+(on?'btn-g':'btn-a')+' btn-s" data-itog="'+c.k+'">'+t(on?'i_disconnect':'i_connect')+'</button></div></section>'}).join('');
  var r=report();
  h+='<section class="pn-card sp-rep"><h3>'+t('x_report')+' <span class="sp-free">'+t('free')+'</span></h3><p class="pn-mu">'+t('x_report_e')+'</p><div class="pn-kpis"><div class="pn-k"><small>'+t('x_rep_go')+'</small><b>'+r.go+'</b></div><div class="pn-k"><small>'+t('x_rep_done')+'</small><b>'+r.done+'</b></div><div class="pn-k"><small>'+t('x_rep_late')+'</small><b>'+r.late+'</b></div><div class="pn-k"><small>'+t('x_rep_docs')+'</small><b>'+r.ex+'</b></div></div>'+
    '<a class="btn btn-a btn-s" href="https://t.me/share/url?url=cargoprogroup.uz&amp;text='+encodeURIComponent(r.txt)+'" target="_blank" rel="noopener">'+t('x_rep_send')+'</a></section></div>';
  h+='<section class="pn-card" id="xlog"><h3>'+t('i_log')+'</h3><p class="pn-mu">'+t('i_log_e')+'</p>'+(S.xl.length?S.xl.map(function(x){return'<div class="pn-log"><time>'+new Date(x.at).toLocaleTimeString()+'</time><span>'+esc(x.x)+'</span></div>'}).join(''):'<p class="pn-mu">'+t('i_log_none')+'</p>')+'</section>';
  return h}
function bindInt(v){var dp=$('#dph',v);if(dp)dp.addEventListener('click',function(){S.ic.dph=!S.ic.dph;save();log('l_int',t('i_dph'));render()});$$('[data-iset]',v).forEach(function(b){b.addEventListener('click',function(){var k=b.getAttribute('data-iset');setup[k]=!setup[k];render()})});
  $$('[data-itog]',v).forEach(function(b){b.addEventListener('click',function(){var k=b.getAttribute('data-itog');S.ic[k]=!S.ic[k];var c=INT.filter(function(x){return x.k===k})[0];xlog(t(c.n)+': '+t(S.ic[k]?'il_conn':'il_disc'));log('l_int',t(c.n));render()})})}

/* Paket dlya brokera: dannye reysa, voditelya, tyagacha i pritsepa, gruzy. Chego ne hvataet: krasnym do formirovaniya. */
var GN=['tex','food','parts','tile','box','furn','ele','pap'];
function bkOf(o){var b=S.bk[o.id];if(b)return b;var i=Math.abs(String(o.id).split('').reduce(function(a,c){return a*31+c.charCodeAt(0)},7))%97;
  var n=1+i%3,goods=[];for(var k=0;k<n;k++){var g=500+((i*37+k*211)%40)*150;goods.push({n:t('g_'+GN[(i+k)%GN.length]),hs:'',g:g,ne:Math.round(g*.93),pl:2+((i+k)%9),val:Math.round(g*(1.6+(k%3)*.9))})}
  b={cmr:'UZ '+String(100000+i*1234).slice(0,6),seal:i%3?'':'UZ-'+String(70000+i*91),post:o.dir&&{cn:'dustlik',tr:'yallama',eu:'yallama',ae:'alat',in:'ayritom'}[o.dir]||'gisht',sender:o.co,cons:t('co')+' «'+TN3[i%TN3.length]+'»',goods:goods};
  S.bk[o.id]=b;return b}
function tripTruck(o){var T=trucks();return T[o.dr.id]||null}
function need(o){var b=bkOf(o),r=tripTruck(o),p=r&&drivers()[r.drv],m=[];
  var q=function(v,lab){if(v==null||v==='')m.push(lab)};
  q(b.sender,t('bk_sender'));q(b.cons,t('bk_cons'));q(b.cmr,t('bk_cmr'));q(b.seal,t('bk_seal'));q(b.post,t('bk_post'));
  if(!r){m.push(t('bk_tractor'));return m}
  q(r.pl,t('bk_tractor')+': '+t('v_plate'));q(r.vin,t('bk_tractor')+': VIN');q(r.mk,t('bk_tractor')+': '+t('v_make'));q(r.cn,t('v_country'));q(r.tir,t('v_tir'));
  if(TRAIL[codeOf(r)]||r.bt==='ref'||r.bt==='c20'||r.bt==='c40'||r.bt==='tral')q(r.tpl,t('bk_trailer')+': '+t('v_trail'));
  if(!p)m.push(t('bk_drv'));else{q(p.lat,t('bk_drv')+': '+t('p_lat'));q(p.cit,t('bk_drv')+': '+t('p_cit'));q(p.pass,t('bk_drv')+': '+t('p_pass'));q(p.by,t('bk_drv')+': '+t('p_by'));q(p.iss,t('bk_drv')+': '+t('p_iss'));q(p.exp,t('bk_drv')+': '+t('p_exp'))}
  b.goods.forEach(function(g,i){var x=t('bk_goods')+' '+(i+1)+': ';q(g.n,x+t('bk_name'));q(g.g,x+t('bk_gross'));q(g.ne,x+t('bk_net'));q(g.pl,x+t('bk_pl'));q(g.val,x+t('bk_val'))});
  return m}
function rows(o){var b=bkOf(o),r=tripTruck(o)||{},p=drivers()[r.drv]||{},to=RUN.filter(function(x){return x.f.id===o.dr.id})[0];
  return[[t('bk_trip'),o.id],[t('bk_date'),dshow(iso(0))],[t('bk_carrier'),'CARGO PRO GROUP'],[t('bk_sender'),b.sender],[t('bk_cons'),b.cons],[t('bk_cmr'),b.cmr],[t('bk_seal'),b.seal],
    [t('bk_routeto'),C.tas+' → '+(to?C[to.to]:'')],[t('bk_post'),t('post_'+b.post)],
    [t('bk_drv'),(p.lat||'')+(p.cyr?' / '+p.cyr:'')],[t('p_cit'),p.cit||''],[t('p_pass'),p.pass||''],[t('p_by'),p.by||''],[t('p_iss'),dshow(p.iss)],[t('p_exp'),dshow(p.exp)],[t('p_lic'),(p.lic||'')+(p.cat?' ('+p.cat+')':'')],
    [t('bk_tractor'),(r.pl||'')+' · '+(r.mk||'')+' · VIN '+(r.vin||'')],[t('bk_trailer'),r.tpl||t('f_none')],[t('v_country'),r.cn||''],[t('v_body'),r.bt?btLabel(r):''],[t('v_tir'),r.tir||''],[t('v_adr'),r.adr||t('f_none')]]}
function bkText(o){var b=bkOf(o);return rows(o).map(function(x){return x[0]+': '+x[1]}).join('\n')+'\n'+t('bk_goods')+':\n'+b.goods.map(function(g,i){return(i+1)+') '+g.n+'; '+t('bk_hs')+' '+(g.hs||t('bk_hs_b'))+'; '+t('bk_gross')+' '+g.g+'; '+t('bk_net')+' '+g.ne+'; '+t('bk_pl')+' '+g.pl+'; '+t('bk_val')+' '+g.val}).join('\n')}
function csvQ(s){return'"'+String(s).replace(/"/g,'""')+'"'}
function bkCsv(o){var b=bkOf(o);return'﻿'+rows(o).map(function(x){return csvQ(x[0])+';'+csvQ(x[1])}).join('\n')+'\n\n'+[t('bk_name'),t('bk_hs'),t('bk_gross'),t('bk_net'),t('bk_pl'),t('bk_val')].map(csvQ).join(';')+'\n'+b.goods.map(function(g){return[g.n,g.hs,g.g,g.ne,g.pl,g.val].map(csvQ).join(';')}).join('\n')}

/* Modalnoe okno s listom na pechat (paket dlya brokera, putevoy list, foto dostavki). */
var modal=null;
function sheet(o){var b=bkOf(o);return'<div class="sp-sheet" id="sheet"><h2>'+t('bk_title')+'</h2>'+'<table class="sp-kvt">'+rows(o).map(function(x){return'<tr><th>'+esc(x[0])+'</th><td>'+esc(x[1])+'</td></tr>'}).join('')+'</table>'+
  '<h3>'+t('bk_goods')+'</h3><table class="sp-gt"><thead><tr><th>№</th><th>'+t('bk_name')+'</th><th>'+t('bk_hs')+'</th><th>'+t('bk_gross')+'</th><th>'+t('bk_net')+'</th><th>'+t('bk_pl')+'</th><th>'+t('bk_val')+'</th></tr></thead><tbody>'+
  b.goods.map(function(g,i){return'<tr><td>'+(i+1)+'</td><td>'+esc(g.n)+'</td><td>'+esc(g.hs||t('bk_hs_b'))+'</td><td>'+fmt(g.g)+'</td><td>'+fmt(g.ne)+'</td><td>'+g.pl+'</td><td>'+fmt(g.val)+'</td></tr>'}).join('')+'</tbody></table><p class="sp-sm">'+t('bk_demo')+'</p></div>'}
function bkModal(o){var b=bkOf(o),m=need(o);
  var gi=function(i,k,v,ph){return'<input data-g="'+i+'" data-k="'+k+'" value="'+esc(v==null?'':v)+'"'+(ph?' placeholder="'+esc(ph)+'"':'')+((v===''||v==null)&&k!=='hs'?' class="sp-need"':'')+'>'};
  return'<h2>'+t('bk_title')+' · '+esc(o.id)+'</h2><p class="pn-mu">'+t('bk_hint')+'</p>'+
  (m.length?'<div class="sp-miss" id="bkmiss"><b>'+t('bk_miss')+': '+m.length+'</b><ul>'+m.map(function(x){return'<li>'+esc(x)+'</li>'}).join('')+'</ul><button type="button" class="btn btn-g btn-s" id="bkfix">'+t('bk_fix')+'</button></div>':'<p class="dp-ok" id="bkok">'+t('bk_ok')+'</p>')+
  '<div class="sp-g">'+[['sender','bk_sender'],['cons','bk_cons'],['cmr','bk_cmr'],['seal','bk_seal']].map(function(x){return'<label class="fld"><span>'+t(x[1])+'</span><input data-b="'+x[0]+'" value="'+esc(b[x[0]]||'')+'"'+(b[x[0]]?'':' class="sp-need"')+'></label>'}).join('')+
  '<label class="fld"><span>'+t('bk_post')+'</span><select data-b="post">'+POSTS.map(function(p){return'<option value="'+p+'"'+(p===b.post?' selected':'')+'>'+t('post_'+p)+'</option>'}).join('')+'</select></label></div>'+
  '<div class="sp-gw"><table class="sp-gt sp-ge"><thead><tr><th>'+t('bk_name')+'</th><th>'+t('bk_hs')+'</th><th>'+t('bk_gross')+'</th><th>'+t('bk_net')+'</th><th>'+t('bk_pl')+'</th><th>'+t('bk_val')+'</th></tr></thead><tbody>'+
  b.goods.map(function(g,i){return'<tr><td>'+gi(i,'n',g.n)+'</td><td>'+gi(i,'hs',g.hs,t('bk_hs_ph'))+'</td><td>'+gi(i,'g',g.g)+'</td><td>'+gi(i,'ne',g.ne)+'</td><td>'+gi(i,'pl',g.pl)+'</td><td>'+gi(i,'val',g.val)+'</td></tr>'}).join('')+'</tbody></table></div>'+
  '<div class="dp-act sp-noprint"><button type="button" class="btn btn-a" id="bkmake"'+(m.length?' disabled':'')+'>'+t('bk_make')+'</button></div>'+(modal.made&&!m.length?'<div class="sp-out">'+sheet(o)+'<div class="dp-act sp-noprint"><button type="button" class="btn btn-a btn-s" id="bkprint">'+t('bk_print')+'</button><button type="button" class="btn btn-g btn-s" id="bkcopy">'+t('bk_copy')+'</button><button type="button" class="btn btn-g btn-s" id="bkcsv">'+t('bk_csv')+'</button><a class="btn btn-g btn-s" id="bktg" href="https://t.me/share/url?url=cargoprogroup.uz&amp;text='+encodeURIComponent(bkText(o))+'" target="_blank" rel="noopener">'+t('bk_tg')+'</a></div></div>':'')}
function wbModal(o){var r=tripTruck(o)||{},p=drivers()[r.drv]||{},to=RUN.filter(function(x){return x.f.id===o.dr.id})[0];
  return'<div class="sp-sheet" id="sheet"><h2>'+t('x_wb_t')+' · '+esc(o.id)+'</h2><table class="sp-kvt">'+[[t('bk_carrier'),'CARGO PRO GROUP'],[t('bk_drv'),(p.lat||'')+(p.cyr?' / '+p.cyr:'')],[t('p_lic'),(p.lic||'')+(p.cat?' ('+p.cat+')':'')],
    [t('bk_tractor'),(r.pl||'')+' · '+(r.mk||'')],[t('bk_trailer'),r.tpl||t('f_none')],[t('bk_routeto'),C.tas+' → '+(to?C[to.to]:'')],[t('x_wb_dep'),dshow(iso(0))+' 08:30'],
    [t('x_wb_odo'),fmt(180000+Math.floor(r2()*90000))+' '+t('km')],[t('x_wb_med'),'________________'],[t('x_wb_tech'),'________________'],[t('x_wb_sign'),'________________']].map(function(x){return'<tr><th>'+esc(x[0])+'</th><td>'+esc(x[1])+'</td></tr>'}).join('')+'</table><p class="sp-sm">'+t('bk_demo')+'</p></div>'+
  '<div class="dp-act sp-noprint"><button type="button" class="btn btn-a btn-s" id="bkprint">'+t('bk_print')+'</button></div>'}
function podModal(o){var s=stOf(o.id,o.s0);
  return'<h2>'+t('x_pod')+' · '+esc(o.id)+'</h2><p class="pn-mu">'+t('x_pod_e')+'</p>'+(s===5?
    '<svg class="sp-pod" viewBox="0 0 320 220" role="img" aria-label="'+t('x_pod_alt')+'"><rect x="30" y="14" width="260" height="192" rx="6" fill="#f4f1e8"/><g fill="#c9c3b2"><rect x="50" y="34" width="120" height="8"/><rect x="50" y="52" width="210" height="5"/><rect x="50" y="64" width="190" height="5"/><rect x="50" y="76" width="200" height="5"/><rect x="50" y="98" width="100" height="5"/><rect x="50" y="110" width="160" height="5"/><rect x="50" y="122" width="140" height="5"/></g><text x="220" y="44" font-size="14" font-weight="700" fill="#5b5648">CMR</text><path d="M60 170 c 14 -26 22 10 34 -6 s 16 -20 26 4 s 20 -14 30 0" fill="none" stroke="#1f3a8a" stroke-width="2.4"/><circle cx="232" cy="164" r="28" fill="none" stroke="#3b5bdb" stroke-width="3" opacity=".75"/><circle cx="232" cy="164" r="19" fill="none" stroke="#3b5bdb" stroke-width="1.5" opacity=".75"/></svg>'+
    '<div class="dp-act"><a class="btn btn-a btn-s" id="podsend" href="https://t.me/share/url?url=cargoprogroup.uz&amp;text='+encodeURIComponent(t('x_pod')+' · '+o.id+' · '+t('k_5'))+'" target="_blank" rel="noopener">'+t('x_pod_send')+'</a></div>':'<p class="pn-hint">'+t('x_pod_wait')+'</p>')}
function openModal(kind,o){modal={kind:kind,o:o,made:false};drawModal()}
function drawModal(){var m=$('#spm');if(!modal){if(m)m.remove();d.body.classList.remove('sp-open');return}
  if(!m){m=d.createElement('div');m.id='spm';m.className='sp-m';m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');d.body.appendChild(m)}
  d.body.classList.add('sp-open');var o=modal.o;
  m.innerHTML='<div class="sp-mb glass"><button type="button" class="btn btn-g btn-s sp-close sp-noprint" id="spmx">'+t('bk_close')+'</button>'+(modal.kind==='bk'?bkModal(o):modal.kind==='wb'?wbModal(o):podModal(o))+'</div>';
  var g=function(s,f){var e=$(s,m);if(e)e.addEventListener('click',f)};
  g('#spmx',function(){modal=null;drawModal()});
  m.onclick=function(e){if(e.target===m){modal=null;drawModal()}};
  g('#bkprint',function(){w.print()});
  g('#bkfix',function(){modal=null;drawModal();location.hash='fleet'});
  g('#bkmake',function(){modal.made=true;log('l_bk',o.id);drawModal();toast(t('bk_made'))});
  g('#bkcopy',function(){var txt=bkText(o);var ok=function(){toast(t('bk_copied'))};if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(ok,function(){fallback(txt);ok()});else{fallback(txt);ok()}});
  g('#bkcsv',function(){var a=d.createElement('a');a.href=URL.createObjectURL(new Blob([bkCsv(o)],{type:'text/csv'}));a.download=o.id+'-broker.csv';d.body.appendChild(a);a.click();a.remove()});
  $$('[data-b]',m).forEach(function(x){x.addEventListener('change',function(){bkOf(o)[x.getAttribute('data-b')]=x.value.trim();modal.made=false;save();drawModal()})});
  $$('[data-g]',m).forEach(function(x){x.addEventListener('change',function(){var gg=bkOf(o).goods[+x.getAttribute('data-g')],k=x.getAttribute('data-k'),v=x.value.trim();gg[k]=k==='n'||k==='hs'?v:(v===''?'':+v.replace(',','.')||0);modal.made=false;save();drawModal()})});
  var f=$('.sp-close',m);if(f)f.focus()}
function fallback(txt){var a=d.createElement('textarea');a.value=txt;a.setAttribute('readonly','');a.style.position='fixed';a.style.opacity='0';d.body.appendChild(a);a.select();try{d.execCommand('copy')}catch(e){}a.remove()}
addEventListener('keydown',function(e){if(e.key==='Escape'&&modal){modal=null;drawModal()}});

/* Prostoy (besplatno): sverh 24 chasov na pogruzke i vygruzke, demo-stavka za sutki. */
var IDLE_FREE=24,IDLE_DAY=70;
function idleSum(h){return h>IDLE_FREE?Math.ceil((h-IDLE_FREE)/24)*IDLE_DAY:0}
function tripExtras(o){var x=S.tx[o.id]||{},h=x.idle==null?0:x.idle;
  return'<div class="sp-tx"><button type="button" class="btn btn-a btn-s" data-bk="'+o.id+'">'+t('bk_btn')+'</button><button type="button" class="btn btn-g btn-s" data-wb="'+o.id+'">'+t('x_wb')+'</button><button type="button" class="btn btn-g btn-s" data-pod="'+o.id+'">'+t('x_pod')+'</button>'+
    '<label class="sp-idle"><span>'+t('x_idle')+': '+t('x_idle_h')+'</span><input type="number" min="0" step="1" inputmode="numeric" data-idle="'+o.id+'" value="'+h+'"></label><span class="sp-ids" id="ids-'+o.id+'">'+t('x_idle_sum')+': <b>'+fmt(idleSum(h))+' $</b></span><span class="sp-free">'+t('free')+'</span></div>'}
function bindTrips(v){var find=function(id){return trips().filter(function(o){return o.id===id})[0]};
  $$('[data-bk]',v).forEach(function(b){b.addEventListener('click',function(){openModal('bk',find(b.getAttribute('data-bk')))})});
  $$('[data-wb]',v).forEach(function(b){b.addEventListener('click',function(){openModal('wb',find(b.getAttribute('data-wb')))})});
  $$('[data-pod]',v).forEach(function(b){b.addEventListener('click',function(){openModal('pod',find(b.getAttribute('data-pod')))})});
  $$('[data-idle]',v).forEach(function(i){i.addEventListener('input',function(){var id=i.getAttribute('data-idle'),h=Math.max(0,+i.value||0);S.tx[id]=S.tx[id]||{};S.tx[id].idle=h;save();var e=$('#ids-'+id);if(e)e.innerHTML=t('x_idle_sum')+': <b>'+fmt(idleSum(h))+' $</b>'})})}
syncFleet();
addEventListener('storage',function(e){if(e.key==='cp-cab-1'&&view==='int')render()});
