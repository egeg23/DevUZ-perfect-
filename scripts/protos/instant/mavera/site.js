(function(){
var D=document,R=D.documentElement,L={};
try{L=JSON.parse(D.getElementById('i18n').textContent)}catch(e){}
var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function $(s,r){return (r||D).querySelector(s)}
function $$(s,r){return [].slice.call((r||D).querySelectorAll(s))}
function sw(el,on,a,b){a.split(' ').forEach(function(c){el.classList.toggle(c,on)});b.split(' ').forEach(function(c){el.classList.toggle(c,!on)})}

/* Появление при прокрутке: то же, что Rise в макете. */
var rise=$$('.w-rise');
if(!('IntersectionObserver' in window)||reduce){rise.forEach(function(n){n.classList.add('w-rise-in')})}
else{var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('w-rise-in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -12% 0px',threshold:.05});rise.forEach(function(n){io.observe(n)})}

/* Первый экран: снимок отстаёт от прокрутки, заголовок обгоняет и гаснет. */
var hero=$('#hero-scene'),raf=0;
function shift(){raf=0;if(!hero)return;var b=hero.getBoundingClientRect(),p=Math.min(Math.max(-b.top/Math.max(b.height,1),0),1);hero.style.setProperty('--p',p.toFixed(4));hero.style.setProperty('--shift',(p*160).toFixed(1)+'px')}

/* Шапка: при любой прокрутке прячется, возвращается через 3 секунды тишины. */
var head=$('#top'),idle=0,IDLE=/*~*/3000;
function headIdle(){if(!head)return;if(head.contains(D.activeElement)&&D.activeElement!==D.body)return;head.classList.add('mvx-away');clearTimeout(idle);idle=setTimeout(function(){head.classList.remove('mvx-away')},IDLE)}
window.addEventListener('scroll',function(){headIdle();if(!reduce&&!raf)raf=requestAnimationFrame(shift)},{passive:true});
window.addEventListener('resize',function(){if(!reduce&&!raf)raf=requestAnimationFrame(shift)},{passive:true});
if(head)head.addEventListener('focusin',function(){clearTimeout(idle);head.classList.remove('mvx-away')});
if(!reduce)shift();

/* Кинолента: карточка под рукой выходит из тени, полоска под лентой показывает, где вы. */
var rail=$('#rail'),cards=rail?$$('[data-card]',rail):[],bars=$$('#rail-bars span');
function pick(i){cards.forEach(function(c,k){sw(c,k===i,'w-glow','opacity-70')});bars.forEach(function(b,k){sw(b,k===i,'bg-[var(--w-accent)]','bg-[var(--w-line)]')})}
cards.forEach(function(c,i){c.addEventListener('mouseenter',function(){pick(i)});c.addEventListener('focus',function(){pick(i)})});
if(rail){var rt=0;rail.addEventListener('scroll',function(){clearTimeout(rt);rt=setTimeout(function(){var x=rail.getBoundingClientRect().left,best=0,d=1e9;cards.forEach(function(c,k){var q=Math.abs(c.getBoundingClientRect().left-x);if(q<d){d=q;best=k}});pick(best)},90)},{passive:true})}

/* Генплан: корпус нажимается, справа меняются статус и срок. */
var gp=$('#gp'),G=L.gp||[],BASE={done:.32,build:.58,sale:.9},gsel=-1;
function gpPick(i){if(!gp||!G[i])return;gsel=i;
  $$('g[role=button]',gp).forEach(function(g,k){var on=k===i,po=g.querySelector('polygon'),tx=g.querySelector('text');g.setAttribute('aria-pressed',on?'true':'false');po.setAttribute('fill-opacity',on?1:BASE[G[k].s]);po.setAttribute('stroke-opacity',on?.9:0);tx.setAttribute('opacity',on?1:.75)});
  $('#gp-name').textContent=L.house+' '+G[i].n;$('#gp-st').textContent=L.st[G[i].s];$('#gp-note').textContent=L.note[G[i].s];
  var h=$('#pk-house');if(h)h.textContent=L.house+' '+G[i].n;line()}
if(gp)$$('g[role=button]',gp).forEach(function(g,k){g.addEventListener('click',function(){gpPick(k)});g.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();gpPick(k)}})});

/* Шахматка: клетка квартиры, статус и планировка. */
var pk=$('#pk'),cells=pk?$$('button[data-s]',pk):[],room=1,cell=null,OUT='outline outline-[0.12em] outline-offset-[0.1em] outline-[var(--mv-text)]';
function line(){var a=$('#pk-line');if(!a)return;var s=cell?cell.getAttribute('data-s'):'f';
  $('#pk-title').textContent=L.rooms[room];a.textContent=(gsel>=0?L.house+' '+G[gsel].n+' · ':'')+L.cell[s];
  var b=$('#pk-go');if(b){b.disabled=s==='s';b.style.opacity=s==='s'?.45:1}}
function cellPick(c){if(cell)OUT.split(' ').forEach(function(x){cell.classList.remove(x)});cell=c;OUT.split(' ').forEach(function(x){c.classList.add(x)});cells.forEach(function(x){x.setAttribute('aria-pressed',x===c?'true':'false')});line()}
cells.forEach(function(c){c.addEventListener('click',function(){cellPick(c)})});
$$('[data-room]').forEach(function(ch){ch.addEventListener('click',function(){room=+ch.getAttribute('data-room');$$('[data-room]').forEach(function(x){var on=x===ch;x.setAttribute('aria-pressed',on?'true':'false');sw(x,on,'bg-[var(--mv-accent)] text-[var(--mv-accent-ink)]','border border-[var(--mv-line)] text-[var(--mv-muted)]')});line()})});
if(gp)gpPick(L.gpStart||0);
if(cells.length){var first=cells.filter(function(c){return c.getAttribute('data-s')==='f'})[Math.min(40,cells.length-1)]||cells[0];cellPick(first)}

/* Заявка: текст собирается на глазах и уходит в чат агентства. */
var form=$('#book'),msg=$('#msg'),err=$('#err'),done=$('#done');
function val(n){var f=form.elements[n];if(!f)return '';if(f.length&&!f.tagName){for(var i=0;i<f.length;i++)if(f[i].checked)return f[i].value;return ''}return (f.value||'').trim()}
function text(){var rows=[L.msgHead,L.fDeal+': '+(val('deal')||L.empty)];
  if(val('svc'))rows.push(L.fSvc+': '+val('svc'));
  if(val('wish'))rows.push(L.fWish+': '+val('wish'));
  rows.push(L.fName+': '+(val('nm')||L.empty),L.fPhone+': '+(val('ph')||L.empty));return rows.join('\n')}
function draw(){if(msg)msg.textContent=text()}
function toForm(note,svc){if(!form)return;if(note&&form.elements.wish)form.elements.wish.value=note;if(svc&&form.elements.svc)form.elements.svc.value=svc;draw();form.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'})}
var go=$('#pk-go');if(go)go.addEventListener('click',function(){toForm(L.fromPick+': '+(gsel>=0?L.house+' '+G[gsel].n+', ':'')+L.rooms[room].toLowerCase(),'')});
var gg=$('#gp-go');if(gg)gg.addEventListener('click',function(){var p=$('#picker');if(p)p.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'})});
$$('[data-svc]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();toForm('',a.getAttribute('data-svc'))})});
if(form){form.addEventListener('input',draw);form.addEventListener('change',draw);draw();
  form.addEventListener('submit',function(e){e.preventDefault();err.hidden=true;done.hidden=true;
    if(val('ph').replace(/\D/g,'').length<7){err.textContent=L.need;err.hidden=false;form.elements.ph.focus();return}
    var t=text();
    try{var k='nv-leads-1',a=JSON.parse(localStorage.getItem(k)||'[]');if(!Array.isArray(a))a=[];a.unshift({id:'S'+Date.now().toString(36).toUpperCase(),ts:Date.now(),kind:'pick',ch:'site',n:val('nm')});localStorage.setItem(k,JSON.stringify(a.slice(0,20)))}catch(x){}
    function fin(){done.textContent=L.sent;done.hidden=false;if(L.chat)window.open(L.chat,'_blank','noopener')}
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(fin,fin);else fin()})}
})();
