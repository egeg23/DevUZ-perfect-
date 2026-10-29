/* AutoPepe: zachowanie strony. Przewijania nie przejmujemy: sceny tylko
   czytają, ile przewinięto, i ruszają transform, opacity i shader. Stan
   makiety jest w przeglądarce: zgłoszenia ap-req-1 (czyta je panel), etapy
   napraw z panelu ap-panel-1, dodatki z konstruktora ap-cfg-1. */
(function(){
var d=document,w=window,$=function(s,r){return(r||d).querySelector(s)},$$=function(s,r){return[].slice.call((r||d).querySelectorAll(s))};
var D=JSON.parse($('#ap-data').textContent);
var RM=w.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var TOUCH=w.matchMedia&&matchMedia('(pointer: coarse)').matches;
function get(k,def){try{var v=localStorage.getItem(k);return v?JSON.parse(v):def}catch(e){return def}}
function put(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function zl(n){return fmt(n)+' zł'}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var toastT=0;function toast(m){var t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('on')},2400)}
function sms(body){return'sms:'+D.tel+'?&body='+encodeURIComponent(body)}

/* Dodatki wyłączone w konstruktorze znikają ze strony. */
var cfg=get('ap-cfg-1',{});function addOn(id){return cfg[id]!==false}
$$('[data-addon]').forEach(function(e){if(!addOn(e.getAttribute('data-addon')))e.classList.add('addon-off')});

/* Na telefonie przycisk dzwoni albo otwiera SMS z gotowym tekstem; na komputerze dzwoni. */
if(TOUCH)$$('[data-sms]').forEach(function(a){a.setAttribute('href',sms(a.getAttribute('data-sms')))});

/* Szapka: chowa się przy każdym przewinięciu, wraca 3 s po ostatnim zdarzeniu. */
var top=$('.top'),dock=$('#dock'),IDLE=3000,idleT=0;
function headIdle(){if(!top)return;clearTimeout(idleT);
  if(!top.contains(d.activeElement))top.classList.add('hide');
  idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}

/* Pierwszy ekran: słowa wjeżdżają po kolei. */
$$('.hero h1 .w>span').forEach(function(s,i){s.style.transitionDelay=(120+i*70)+'ms'});
(function heroIn(){if(d.documentElement.classList.contains('api')){setTimeout(heroIn,150);return}var h=$('.hero');h.classList.add('on');$$('.rise',h).forEach(function(e){e.classList.add('on')})})();
var io='IntersectionObserver'in w?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'}):null;
$$('.rise,.pop,[data-m]').forEach(function(e){if(e.closest('.hero'))return;if(io&&!RM)io.observe(e);else e.classList.add('on')});

/* Ciekłe szkło: blask ramki idzie za palcem; karta usługi świeci pod kursorem. */
d.addEventListener('pointermove',function(e){var g=e.target.closest&&e.target.closest('.glass');if(g){var r=g.getBoundingClientRect();g.style.setProperty('--gx',((e.clientX-r.left)/r.width*100)+'%');g.style.setProperty('--gy',((e.clientY-r.top)/r.height*100)+'%')}
  var c=e.target.closest&&e.target.closest('.sv');if(c){var q=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-q.left)+'px');c.style.setProperty('--my',(e.clientY-q.top)+'px')}},{passive:true});

/* Lakier na pierwszym ekranie: lampy idą za kursorem i za przewijaniem. */
var hl=$('#hl'),HL=hl&&w.Lak?Lak.make(hl,'hero'):null;
if(HL&&!RM&&!TOUCH)addEventListener('pointermove',function(e){HL.aim((e.clientX/innerWidth-.5)*2,-(e.clientY/innerHeight-.5)*1.2)},{passive:true});
/* Scena: od wgniecenia do lustra. */
var sl=$('#sl'),SL=sl&&w.Lak?Lak.make(sl,'scene'):null;
if(SL){SL.s.board=1;SL.s.dent=1;SL.s.swirl=0;SL.s.cx=innerWidth>899?.55:0;SL.s.cy=innerWidth>899?-.1:-.35;SL.kick()}

/* Wszystko, co zależy od przewijania, liczy się w jednej klatce. */
var velo=$$('.velo .row'),vx=[0,0],lastY=scrollY,speed=0,ticking=false;
var road=$('.road'),caps=$$('.cap'),bars=$$('.prog i b'),rlab=$('#rlab'),LABS=['Tablica z pasami','Narzędzie od środka','Polerka','Lustro'];
var sx=$$('.sx'),par=$$('[data-par]');
function clamp(v){return v<0?0:v>1?1:v}
function sm(a,b,x){var t=clamp((x-a)/(b-a));return t*t*(3-2*t)}
function frame(){if(ticking)return;ticking=true;requestAnimationFrame(tick)}
function tick(){ticking=false;var y=scrollY,vh=innerHeight;
  speed=speed*.86+(y-lastY)*.14;lastY=y;
  if(y<vh*1.4&&!RM)par.forEach(function(e){e.style.transform='translate3d(0,'+(y*+e.getAttribute('data-par'))+'px,0)'});
  if(HL&&y<vh*1.2){HL.s.shift=-y/vh*.35;HL.kick()}
  if(road&&!RM){var R=road.getBoundingClientRect(),p=clamp(-R.top/(R.height-vh));
    if(R.top<vh&&R.bottom>0){var st=Math.min(3,Math.floor(p*4)),lp=p*4-st;
      caps.forEach(function(c,i){c.classList.toggle('on',i===st)});
      bars.forEach(function(b,i){b.style.transform='scaleX('+(i<st?1:i===st?lp:0)+')'});
      if(rlab)rlab.textContent=LABS[st];
      if(SL){var S=SL.s;
        S.dent=1-sm(.27,.47,p);S.push=p>.25&&p<.5?1:0;
        S.board=1-sm(.48,.6,p);
        S.scr=sm(.47,.55,p)*(1-sm(.95,1,p));S.wipe=-2+sm(.56,.74,p)*4.2;
        S.swirl=sm(.5,.58,p)*.7*(1-sm(.75,.86,p));
        S.shift=p*.25;SL.kick()}
    }}
  if(!RM)sx.forEach(function(s){var r=s.getBoundingClientRect();if(r.top>vh||r.bottom<0)return;var e=clamp((vh-r.top)/(vh*.6));s.style.transform='translate3d(0,'+((1-e)*60)+'px,0) scale('+(.96+.04*e)+')';s.style.opacity=(.35+.65*e).toFixed(3)});
  if(dock)dock.classList.toggle('off',y<vh*.6);
  if(Math.abs(speed)>.3)frame();
}
addEventListener('scroll',function(){headIdle();frame()},{passive:true});
addEventListener('resize',frame);frame();
/* Pasy: własna prędkość plus prędkość przewijania, tylko gdy widać. */
var vbox=$('.velo'),von=false;if(vbox&&io&&!RM){new IntersectionObserver(function(es){von=es[0].isIntersecting;if(von)requestAnimationFrame(roll)}).observe(vbox)}
function roll(){if(!von)return;speed*=.94;velo.forEach(function(r,i){var dir=i?1:-1;vx[i]+=dir*(.5+Math.min(Math.abs(speed),60)*.14);var wd=r.scrollWidth/3;if(vx[i]<-wd)vx[i]+=wd;if(vx[i]>0)vx[i]-=wd;r.style.transform='translate3d('+vx[i]+'px,0,0)'});requestAnimationFrame(roll)}

/* Przed i po: kurtyna palcem, strzałkami albo myszą. */
$$('[data-cmp]').forEach(function(c){var r=$('input',c);function set(){c.style.setProperty('--cut',r.value+'%')}r.addEventListener('input',set);set();
  if(!RM&&io){var once=new IntersectionObserver(function(es){if(!es[0].isIntersecting)return;once.disconnect();var t0=performance.now();(function a(now){var k=(now-t0)/1600;if(k>1||c.classList.contains('used'))return;r.value=50+Math.sin(k*Math.PI*2)*22;set();requestAnimationFrame(a)})(t0)});once.observe(c)}
  r.addEventListener('pointerdown',function(){c.classList.add('used')})});

/* Kalkulator: schemat auta, klasa, pakiet, dodatki, OC. */
var CS=get('ap-calc-1',{cls:'m',parts:{},pack:'none',felg:false,zap:0,oc:false}),cur='';
var byDmg={};D.dmg.forEach(function(x){byDmg[x.id]=x});
function k(){var c=D.car.filter(function(x){return x.id===CS.cls})[0];return c?c.k:1}
function lines(){var L=[],lo=0,hi=0,kk=k();
  Object.keys(CS.parts).forEach(function(p){var x=byDmg[CS.parts[p]];if(!x)return;var m=x.k?kk:1;L.push([D.parts[p]+': '+x.t.toLowerCase(),x.lo*m,x.hi*m])});
  var pk=D.packs.filter(function(x){return x.id===CS.pack})[0];if(pk&&pk.hi)L.push(['Pakiet „'+pk.t+'”',pk.lo*kk,pk.hi*kk]);
  D.extras.forEach(function(x){if(x.n){if(CS.zap)L.push([x.t+' × '+CS.zap,x.lo*CS.zap,x.hi*CS.zap])}else if(CS.felg)L.push([x.t,x.lo,x.hi])});
  L.forEach(function(l){lo+=l[1];hi+=l[2]});return{L:L,lo:Math.round(lo/10)*10,hi:Math.round(hi/10)*10}}
function calc(){put('ap-calc-1',CS);var r=lines();
  $$('#cls button').forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-cls')===CS.cls?'true':'false')});
  $$('#car .pt').forEach(function(p){var id=p.getAttribute('data-part');p.setAttribute('class','pt'+(CS.parts[id]?' '+CS.parts[id]:'')+(id===cur?' sel':''))});
  $('#rl').innerHTML=r.L.length?r.L.map(function(l){return'<li><span>'+esc(l[0])+'</span><span>'+zl(Math.round(l[1]/10)*10)+' do '+zl(Math.round(l[2]/10)*10)+'</span></li>'}).join(''):'<li><span>Nic jeszcze nie zaznaczono</span><span></span></li>';
  if(CS.oc&&r.L.length){$('#rk').textContent='Dla Ciebie, z OC sprawcy';$('#rt').textContent='0 zł';$('#rn').textContent='Wycenę zatwierdza ubezpieczyciel sprawcy, my rozliczamy się z nim bezgotówkowo. Orientacyjnie naprawa to '+zl(r.lo)+' do '+zl(r.hi)+'.'}
  else{$('#rk').textContent='Orientacyjnie';$('#rt').textContent=r.L.length?zl(r.lo)+' do '+zl(r.hi):'0 zł';$('#rn').textContent='Dokładna wycena jest możliwa po obejrzeniu auta.'}
  var body='Dzień dobry, proszę o wycenę. Auto: '+D.car.filter(function(x){return x.id===CS.cls})[0].t+'. '+(r.L.length?r.L.map(function(l){return l[0]}).join('; ')+'. Z kalkulatora: '+zl(r.lo)+' do '+zl(r.hi)+'.':'')+(CS.oc?' Szkoda z OC sprawcy.':'');
  $('#rsms').setAttribute('href',sms(body));$('#zapn').textContent=CS.zap;$('#ex-felg').checked=CS.felg;$('#ocx').checked=CS.oc;
  $$('input[name=pack]').forEach(function(i){i.checked=i.value===CS.pack});return r}
function pickPart(id){cur=id;$('#pn').textContent=D.parts[id];$('#pp').textContent='Co jest z tym elementem?';$('#po').hidden=false;calc()}
$$('#car .pt').forEach(function(p){p.addEventListener('click',function(){pickPart(p.getAttribute('data-part'))});p.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();pickPart(p.getAttribute('data-part'))}})});
$$('[data-dmg]').forEach(function(b){b.addEventListener('click',function(){if(!cur)return;var v=b.getAttribute('data-dmg');if(v)CS.parts[cur]=v;else delete CS.parts[cur];calc();toast(D.parts[cur]+': '+(v?byDmg[v].t.toLowerCase():'bez uszkodzeń'))})});
$$('#cls button').forEach(function(b){b.addEventListener('click',function(){CS.cls=b.getAttribute('data-cls');calc()})});
$$('input[name=pack]').forEach(function(i){i.addEventListener('change',function(){CS.pack=i.value;calc()})});
$$('[data-zap]').forEach(function(b){b.addEventListener('click',function(){CS.zap=Math.max(0,Math.min(9,CS.zap+ +b.getAttribute('data-zap')));calc()})});
$('#ex-felg').addEventListener('change',function(e){CS.felg=e.target.checked;calc()});
$('#ocx').addEventListener('change',function(e){CS.oc=e.target.checked;calc()});
/* Karta usługi „Policz” zaznacza typowe miejsce i rodzaj szkody. */
$$('[data-svc]').forEach(function(a){a.addEventListener('click',function(){var s=a.getAttribute('data-svc'),dm=D.svcDmg[s];if(dm){CS.parts.dlp=dm;cur='dlp'}if(s==='lak')CS.pack='fresh';if(s==='felg')CS.felg=true;if(s==='oc')CS.oc=true;calc();if(cur)pickPart(cur)})});
calc();

/* Zgłoszenia do panelu (dodatki): wycena ze zdjęć, szkoda z OC, termin. */
function req(o){var a=get('ap-req-1',[]);o.id=2047+a.length;o.at=Date.now();a.unshift(o);put('ap-req-1',a);return o.id}
var photos=[];
var ph=$('#photos');if(ph)ph.addEventListener('change',function(){[].slice.call(ph.files).slice(0,6).forEach(function(f){var r=new FileReader();r.onload=function(){var im=new Image();im.onload=function(){var c=d.createElement('canvas'),s=Math.min(1,320/Math.max(im.width,im.height));c.width=im.width*s;c.height=im.height*s;c.getContext('2d').drawImage(im,0,0,c.width,c.height);photos.push(c.toDataURL('image/jpeg',.7));$('#thumbs').innerHTML=photos.map(function(u){return'<img src="'+u+'" alt="Zdjęcie uszkodzenia">'}).join('')};im.src=r.result};r.readAsDataURL(f)})});
var fs=$('#fsend');if(fs)fs.addEventListener('click',function(){var p=$('#fph').value.trim(),r=lines();if(p.replace(/\D/g,'').length<9){toast('Wpisz numer telefonu');return}if(!r.L.length){toast('Zaznacz uszkodzenie na schemacie');return}
  var id=req({k:'foto',ph:p,cls:CS.cls,parts:CS.parts,pack:CS.pack,oc:CS.oc,lo:r.lo,hi:r.hi,img:photos.slice(0,3)});var ok=$('#fok');ok.hidden=false;ok.textContent='Zgłoszenie AP-'+id+' wysłane. Oddzwonimy z ceną w godzinach pracy.'+(addOn('admin')?' To makieta: zgłoszenie jest już w panelu.':'')});
var ocs=$('#ocs');if(ocs)ocs.addEventListener('click',function(){var p=$('#ocp').value.trim();if(!$('#ocn').value.trim()||p.replace(/\D/g,'').length<9){toast('Wpisz numer szkody i telefon');return}
  var id=req({k:'oc',ph:p,szk:$('#ocn').value.trim(),ins:$('#oci').value,reg:$('#ocr').value.trim(),docs:$$('[data-doc]:checked').length});var ok=$('#ocok');ok.hidden=false;ok.textContent='Zgłoszenie szkody AP-'+id+' przyjęte. Zadzwonimy, żeby umówić oględziny.'});

/* Status naprawy: etap ustawia panel. */
function stOf(id){var P=get('ap-panel-1',{});return P.rep&&P.rep[id]}
function showStatus(q){var m=String(q).toUpperCase().replace(/\s/g,'').match(/(\d{4})/),out=$('#sres');if(!out)return;if(!m){out.innerHTML='<p class="okmsg" style="color:var(--warn);background:rgb(255 181 71 / .1)">Wpisz numer w formie AP-2041.</p>';return}
  var id=+m[1],r=stOf(id),st=r?r.st:(id===2041?2:-1);
  if(st<0){out.innerHTML='<p class="okmsg" style="color:var(--warn);background:rgb(255 181 71 / .1)">Nie ma takiego zlecenia. Sprawdź numer albo zadzwoń: '+D.phone+'.</p>';return}
  out.innerHTML='<ul class="track">'+D.st.map(function(x,i){return'<li class="'+(i<=st?'done':'')+(i===st?' now':'')+'"><b>'+x+'</b>'+(i===st?'<small>teraz</small>':'')+'</li>'}).join('')+'</ul>'+(r&&r.car?'<p style="margin:0;color:var(--mu);font-size:14px">'+esc(r.car)+'</p>':'')}
var sgo=$('#sgo');if(sgo){sgo.addEventListener('click',function(){showStatus($('#sq').value)});$('#sq').addEventListener('keydown',function(e){if(e.key==='Enter')showStatus($('#sq').value)})}
function mine(){var m=$('#mine'),P=get('ap-panel-1',{}),ids=Object.keys(P.rep||{});if(!m||!ids.length||!addOn('status'))return;var id=ids[ids.length-1],r=P.rep[id];m.classList.add('on');m.querySelector('span').textContent='AP-'+id+' · '+D.st[r.st];m.onclick=function(){$('#sq').value='AP-'+id;showStatus(id);$('#status').scrollIntoView({block:'start'})}}
addEventListener('storage',function(e){if(e.key==='ap-panel-1'){mine();var q=$('#sq');if(q&&q.value)showStatus(q.value);slots()}});
mine();

/* Rezerwacja: 10 dni roboczych, godziny 8-15; część zajęta (z jednego ziarna). */
var days=[],dsel=-1,ssel='';(function(){var t=new Date();t.setHours(0,0,0,0);while(days.length<10){t.setDate(t.getDate()+1);var g=t.getDay();if(g>0&&g<6)days.push(new Date(t))}})();
var DN=['nd','pn','wt','śr','cz','pt','sb'];
function taken(di,h){var z=(days[di].getDate()*31+h*17)%7;var mineT=get('ap-req-1',[]).some(function(r){return r.k==='termin'&&r.day===days[di].toISOString().slice(0,10)&&r.h===h});return z<2||mineT}
function slots(){var dd=$('#days');if(!dd)return;dd.innerHTML=days.map(function(x,i){return'<button type="button" data-d="'+i+'" aria-pressed="'+(i===dsel)+'">'+DN[x.getDay()]+'<b>'+x.getDate()+'</b>'+String(x.getMonth()+1).padStart(2,'0')+'</button>'}).join('');
  $('#slots').innerHTML=dsel<0?'<p style="grid-column:1/-1;margin:0;color:var(--mu);font-size:14px">Wybierz dzień.</p>':[8,9,10,11,12,13,14,15].map(function(h){var t=taken(dsel,h);return'<button type="button" data-h="'+h+'"'+(t?' disabled aria-label="'+h+':00 zajęte"':'')+' aria-pressed="'+(ssel===h)+'">'+h+':00</button>'}).join('');
  $('#tgo').disabled=!(dsel>=0&&ssel!=='')}
var dd=$('#days');if(dd){dd.addEventListener('click',function(e){var b=e.target.closest('[data-d]');if(!b)return;dsel=+b.getAttribute('data-d');ssel='';slots()});
  $('#slots').addEventListener('click',function(e){var b=e.target.closest('[data-h]');if(!b||b.disabled)return;ssel=+b.getAttribute('data-h');slots()});
  $('#tgo').addEventListener('click',function(){var p=$('#tph').value.trim();if(p.replace(/\D/g,'').length<9){toast('Wpisz imię i telefon');return}var day=days[dsel],id=req({k:'termin',ph:p,day:day.toISOString().slice(0,10),h:ssel});var ok=$('#tok');ok.hidden=false;ok.textContent='Zarezerwowano: '+DN[day.getDay()]+' '+day.getDate()+'.'+String(day.getMonth()+1).padStart(2,'0')+', '+ssel+':00. Numer AP-'+id+'. Dzień wcześniej przypomnimy SMS-em.';ssel='';slots()});slots()}

/* Język: podgląd wersji UA i EN. */
var lg=$('#lngd');if(lg){var LG=JSON.parse(lg.textContent);$$('[data-lng]').forEach(function(b){b.addEventListener('click',function(){var k2=b.getAttribute('data-lng'),v=LG[k2];$$('[data-lng]').forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});var o=$('#lngv');o.setAttribute('lang',k2==='uk'?'uk':k2);o.innerHTML='<b>'+esc(v[0])+'</b><p>'+esc(v[1])+'</p>'})})}
/* Flota: temat maila z liczbą aut. */
var flm=$('#flm');if(flm){function fl(){flm.setAttribute('href','mailto:biuro@autopepe.pl?subject='+encodeURIComponent('Flota: '+($('#fl1').value||'firma')+', aut: '+($('#fl2').value||1)))}$('#fl1').addEventListener('input',fl);$('#fl2').addEventListener('input',fl)}

/* Panel w przeglądarce: liczby demo z jednego ziarna (te same co w panelu). */
var z=20261029,rnd=function(){z=(z*16807)%2147483647;return z/2147483647};
var sp=$('#aspark');if(sp){var h='',tot=0;for(var i=0;i<24;i++){var v=1+Math.floor(rnd()*5);tot+=v;h+='<i style="height:'+(18+v*16)+'%"></i>'}sp.innerHTML=h;$('#ak1').textContent='86,4 tys. zł';$('#ak2').textContent=String(6+get('ap-req-1',[]).length)}
})();
