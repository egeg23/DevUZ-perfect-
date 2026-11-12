/**
 * Поиск туров, авиабилетов и отелей для макета турагентства: из нашего макета
 * Apollo Travel (владелец, 12.11.2026: «для турагентства будто мало, мы делали
 * же для турагентств - там и поиск билетов, туры. Добавь пожалуйста»).
 *
 * От Apollo — вкладки «Туры / Авиабилеты / Отели» над поиском и экран поиска:
 * дуга перелёта с самолётом, полоса «ищем варианты», карточки выдачи.
 * Не берём то, что про сам Apollo: их цены, число туров, логотипы туроператоров,
 * расписание рейсов. Цена в карточке — только та, что у клиента на сайте;
 * нет цены — «цена по запросу», рейсы и отели — «пришлём после заявки».
 * Кнопка карточки ведёт в ту же заявку, что и поиск шаблона.
 */
import type { InstantService } from "@/lib/proto/instant/types";
import { esc } from "@/lib/proto/instant/safe";

type L = "ru" | "uz";
type DestLite = { id: string; code: string; img: string; ru: string; uz: string; words: RegExp };

const T = {
  tours: ["Туры", "Turlar"],
  air: ["Авиабилеты", "Aviachiptalar"],
  hotel: ["Отели", "Mehmonxonalar"],
  where: ["Куда", "Qayerga"],
  ph: ["Страна или город", "Davlat yoki shahar"],
  close: ["Закрыть", "Yopish"],
  seek: ["Ищем варианты", "Variantlarni qidiryapmiz"],
  done: ["Готово: варианты ниже", "Tayyor: variantlar pastda"],
  ask: ["цена по запросу", "narx so‘rov bo‘yicha"],
  later: ["Варианты и цену пришлём после заявки", "Variantlar va narxni arizadan keyin yuboramiz"],
  book: ["Забронировать", "Band qilish"],
  askAir: ["Запросить билеты", "Chipta so‘rash"],
  askHotel: ["Подобрать отель", "Mehmonxona tanlash"],
  there: ["Туда", "Borish"],
  back: ["Обратно", "Qaytish"],
  any: ["куда посоветуете", "maslahatingizga ko‘ra"],
  note: [
    "Пример выдачи: на рабочем сайте здесь будут живые цены и рейсы из системы бронирования.",
    "Namuna: ish saytida bu yerda bron tizimidagi jonli narxlar va reyslar bo‘ladi.",
  ],
  gen: [
    ["Пляжный отдых", "Plyaj dam olishi"],
    ["Экскурсионный тур", "Ekskursiya turi"],
    ["Отдых с детьми", "Bolalar bilan dam olish"],
  ],
  hot: [
    ["Первая линия у моря", "Dengiz bo‘yida birinchi qator"],
    ["Для семьи с детьми", "Bolali oila uchun"],
    ["В центре города", "Shahar markazida"],
  ],
} as const;

const PLANE = `<path d="M-11 0 9-7 5 0 9 7z" fill="currentColor"/>`;

export function turSearch(o: { l: L; img: string; services: InstantService[]; dests: DestLite[]; all: DestLite[]; city: string | null }) {
  const i = o.l === "ru" ? 0 : 1;
  const t = (k: keyof typeof T) => (T[k] as readonly string[])[i];
  const home = /ташкент|toshkent|tashkent/i.test(o.city ?? "ташкент");
  const from = o.city ?? (o.l === "ru" ? "Ташкент" : "Toshkent");
  const picOf = (name: string) => o.all.find((d) => d.words.test(name));

  const tabs = `<div class="xt" role="group" aria-label="${t("tours")}, ${t("air")}, ${t("hotel")}">${(["tours", "air", "hotel"] as const)
    .map((m, n) => `<button type="button" data-xm="${m}" aria-pressed="${n === 0}">${t(m)}</button>`)
    .join("")}</div>
<label class="fld xq" id="xq-f"${o.dests.length ? " hidden" : ""}><span class="fl">${t("where")}</span><input id="xq" autocomplete="off" placeholder="${t("ph")}"></label>`;

  const overlay = `<div class="xr" id="xr" role="dialog" aria-modal="true" aria-labelledby="xr-h" hidden>
<div class="xr-in">
<button type="button" class="xr-x" id="xr-x">&#10005; ${t("close")}</button>
<span class="xr-k" id="xr-k"></span>
<h2 id="xr-h"><span>${esc(from)}</span><i aria-hidden="true">&rarr;</i><span id="xr-to"></span></h2>
<p class="xr-sub" id="xr-sub"></p>
<div class="xr-arc">
<svg viewBox="0 0 600 196" aria-hidden="true"><path id="xr-p" d="M60 160 Q300 -50 540 160"/><path id="xr-d" d="M60 160 Q300 -50 540 160"/><circle cx="60" cy="160" r="5"/><circle cx="540" cy="160" r="5" class="xr-e"/><g id="xr-pl">${PLANE}</g><text x="60" y="186" text-anchor="middle">${home ? "TAS" : ""}</text><text x="540" y="186" text-anchor="middle" id="xr-code"></text></svg>
<div class="xr-bar"><i id="xr-b"></i></div>
<p class="xr-st" id="xr-st" aria-live="polite">${t("seek")}</p>
</div>
<div class="xr-g" id="xr-g"></div>
<p class="xr-note">${t("note")}</p>
</div></div>`;

  const data = {
    from,
    img: o.img,
    t: { tours: t("tours"), air: t("air"), hotel: t("hotel"), seek: t("seek"), done: t("done"), ask: t("ask"), later: t("later"), book: t("book"), askAir: t("askAir"), askHotel: t("askHotel"), there: t("there"), back: t("back"), any: t("any") },
    tours: o.services.map((s) => {
      const d = picOf(s.name);
      return { n: s.name, p: s.price ?? "", d: d?.id ?? "", img: d ? `${d.img}-s` : "hero-s" };
    }),
    gen: T.gen.map((g) => g[i]),
    hot: T.hot.map((g) => g[i]),
    dest: o.all.map((d) => ({ id: d.id, code: d.code, img: `${d.img}-s`, n: d[o.l], w: d.words.source })),
  };

  const css = `<style>
.xt{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}
.xt button{font:700 14px/1 var(--f-t,inherit);padding:11px 16px;border-radius:999px;border:1px solid rgb(12 34 54/.16);background:transparent;color:inherit;cursor:pointer;transition:background .2s,color .2s,transform .15s}
.xt button[aria-pressed="true"]{background:var(--sun);border-color:var(--sun);color:#0c2236}
.xt button:active{transform:scale(.97)}
.xq[hidden],.fld[hidden]{display:none}
.xq input{width:100%;font:inherit;padding:12px 14px;border-radius:14px;border:1px solid rgb(12 34 54/.18);background:#fff;color:#0c2236}
.xr{position:fixed;inset:0;z-index:90;background:#0c2236;color:#fff;overflow:auto;overscroll-behavior:contain;opacity:0;transition:opacity .28s ease}
.xr.on{opacity:1}
.xr[hidden]{display:none}
.xr-in{max-width:1100px;margin:0 auto;padding:clamp(22px,5vh,56px) 20px 110px;position:relative}
.xr-x{position:absolute;right:20px;top:clamp(18px,4vh,40px);font:700 13px/1 inherit;color:#fff;background:rgb(255 255 255/.1);border:1px solid rgb(255 255 255/.18);border-radius:999px;padding:11px 16px;cursor:pointer}
.xr-k{display:block;font:700 11px/1 inherit;letter-spacing:.16em;text-transform:uppercase;color:var(--sun)}
.xr h2{font:700 clamp(26px,5vw,46px)/1.1 var(--f-d,serif);margin:12px 0 8px;display:flex;flex-wrap:wrap;gap:.35em;align-items:baseline;padding-right:120px;overflow-wrap:anywhere}
.xr h2 i{font-style:normal;color:var(--sun)}
.xr-sub{margin:0;color:rgb(255 255 255/.66);font-size:14px}
.xr-arc{margin:24px 0;padding:18px clamp(14px,3vw,28px) 22px;border-radius:24px;background:rgb(255 255 255/.05);border:1px solid rgb(255 255 255/.1)}
.xr-arc svg{display:block;width:100%;max-height:230px;overflow:visible}
#xr-p{fill:none;stroke:rgb(255 255 255/.14);stroke-width:2;stroke-dasharray:3 7}
#xr-d{fill:none;stroke:var(--sun);stroke-width:2.5;stroke-linecap:round}
.xr-arc circle{fill:var(--sun)}
.xr-arc .xr-e{fill:rgb(255 255 255/.4)}
.xr-arc text{fill:#fff;font:700 13px/1 inherit;letter-spacing:.08em}
#xr-pl{color:#fff}
.xr-bar{height:4px;border-radius:9px;background:rgb(255 255 255/.12);overflow:hidden;margin-top:6px}
.xr-bar i{display:block;height:100%;width:100%;background:var(--sun);transform-origin:left;transform:scaleX(0)}
.xr-st{margin:10px 0 0;font-size:13px;color:rgb(255 255 255/.75)}
.xr-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px}
.xc{background:#fff;color:#0c2236;border-radius:20px;overflow:hidden;display:grid;opacity:0;transform:translateY(14px);transition:opacity .4s ease,transform .4s ease;transition-delay:calc(var(--i)*70ms)}
.xr-g.in .xc{opacity:1;transform:none}
.xc img{width:100%;aspect-ratio:16/10;object-fit:cover;display:block}
.xc-b{padding:16px;display:grid;gap:10px;align-content:start}
.xc h3{margin:0;font:700 17px/1.3 inherit;overflow-wrap:anywhere}
.xc small{color:#5b6b78;font-size:13px;line-height:1.45}
.xc-f{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.xc-f b{font:700 18px/1.2 var(--f-d,serif)}
.xc button{font:700 13px/1 inherit;padding:11px 16px;border-radius:999px;border:0;background:#0c2236;color:#fff;cursor:pointer}
.xc button:active{transform:scale(.97)}
.xp{grid-template-columns:1fr auto;align-items:stretch}
.xp .xc-b{border-right:2px dashed rgb(12 34 54/.16)}
.xp-r{display:flex;align-items:center;gap:10px;font:700 clamp(18px,3vw,22px)/1.2 var(--f-d,serif);flex-wrap:wrap}
.xp-r i{font-style:normal;color:var(--sea2,#1b7fa8)}
.xp-s{display:grid;place-items:center;padding:16px;writing-mode:vertical-rl;font:700 11px/1 inherit;letter-spacing:.2em;text-transform:uppercase;color:#5b6b78}
.xr-note{margin:22px 0 0;font-size:12.5px;color:rgb(255 255 255/.55)}
.tks{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:18px}
.tk{background:var(--paper,#fff);border-radius:var(--r2,22px);overflow:hidden;box-shadow:var(--sh1,0 6px 24px rgb(12 34 54/.08));display:grid;transition:transform .25s ease}
.tk img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block;transition:transform .5s ease}
.tk-b{padding:16px 18px 18px;display:grid;gap:10px}
.tk h3{margin:0;font:700 18px/1.3 var(--f-d,serif);overflow-wrap:anywhere}
.tk-f{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.tk-f b{font-weight:700;color:var(--sea2,#1b7fa8)}
.tk-f button{font:700 13px/1 inherit;padding:11px 16px;border-radius:999px;border:0;background:var(--sun);color:#0c2236;cursor:pointer}
@media(hover:hover){.tk:hover{transform:translateY(-4px)}.tk:hover img{transform:scale(1.04)}}
@media(max-width:560px){.xr-in{padding-top:84px}.xr h2{padding-right:0}.xr-x{top:22px}.xp{grid-template-columns:1fr}.xp-s{writing-mode:horizontal-tb;border-top:2px dashed rgb(12 34 54/.16)}.xp .xc-b{border-right:0}}
@media(prefers-reduced-motion:reduce){.xr,.xc,.tk,.tk img{transition:none}.xc{opacity:1;transform:none}}
</style>`;

  const js = `<script>(function(){
var X=${JSON.stringify(data).replace(/</g, "\\u003c")};
var $=function(s,r){return (r||document).querySelector(s)},mode='tours',pass=false,raf=0;
var xr=$('#xr'),go=$('#go-know');if(!xr||!go)return;
var calm=false;try{calm=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
function el(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}
function destBy(text){for(var i=0;i<X.dest.length;i++){if(new RegExp(X.dest[i].w,'i').test(text))return X.dest[i]}return null}
function picked(){
  var q=($('#xq')||{}).value||'',f=$('#xq-f'),chip=$('[data-g="dest"] .chip[aria-pressed="true"]');
  if(f&&!f.hidden&&q.trim()){var d=destBy(q);return{n:q.trim(),d:d}}
  if(chip){var id=chip.getAttribute('data-dest');for(var i=0;i<X.dest.length;i++)if(X.dest[i].id===id)return{n:X.dest[i].n,d:X.dest[i]}}
  return{n:X.t.any,d:null};
}
function sub(){var m=$('[data-g="mk"] .chip[aria-pressed="true"]'),a=[];if(m)a.push(m.textContent.trim());
  document.querySelectorAll('.stp').forEach(function(s){var o=$('output',s),l=$('span',s);if(o&&+o.textContent>0&&l)a.push(l.textContent.trim()+': '+o.textContent.trim())});return a.join(' · ')}
function img(name){var i=el('img');i.src=X.img+'/'+name+'.webp';i.alt='';i.loading='lazy';i.decoding='async';i.width=640;i.height=400;return i}
function card(n,price,pic,btn,note,i,what){
  var c=el('article','xc');c.style.setProperty('--i',i);c.appendChild(img(pic));
  var b=el('div','xc-b');b.appendChild(el('h3','',n));if(note)b.appendChild(el('small','',note));
  var f=el('div','xc-f');f.appendChild(el('b','',price));var k=el('button','',btn);k.type='button';k.addEventListener('click',function(){proceed(what||n)});f.appendChild(k);b.appendChild(f);c.appendChild(b);return c}
function pass2(a,b,label,i,what){
  var c=el('article','xc xp');c.style.setProperty('--i',i);var bd=el('div','xc-b');
  bd.appendChild(el('small','',label));var r=el('div','xp-r');r.appendChild(el('span','',a));r.appendChild(el('i','','\\u2192'));r.appendChild(el('span','',b));bd.appendChild(r);
  bd.appendChild(el('small','',X.t.later));var k=el('button','',X.t.askAir);k.type='button';k.addEventListener('click',function(){proceed(what)});var f=el('div','xc-f');f.appendChild(el('b','',X.t.ask));f.appendChild(k);bd.appendChild(f);
  c.appendChild(bd);c.appendChild(el('div','xp-s',X.t.air));return c}
function fill(p){
  var g=$('#xr-g');g.textContent='';g.classList.remove('in');var pic=p.d?p.d.img:'hero-s',list=[];
  if(mode==='tours'){
    var mine=X.tours.filter(function(x){return p.d&&x.d===p.d.id});if(!mine.length)mine=X.tours;
    if(mine.length)mine.slice(0,6).forEach(function(x,i){list.push(card(x.n,x.p||X.t.ask,x.img,X.t.book,'',i,X.t.tours+': '+x.n))});
    else X.gen.forEach(function(n,i){list.push(card(n,X.t.ask,pic,X.t.book,X.t.later,i,X.t.tours+': '+n+', '+p.n))});
  }else if(mode==='air'){
    list.push(pass2(X.from,p.n,X.t.there,0,X.t.air+': '+X.from+' \\u2192 '+p.n));
    list.push(pass2(p.n,X.from,X.t.back,1,X.t.air+': '+p.n+' \\u2192 '+X.from));
  }else X.hot.forEach(function(n,i){list.push(card(n,X.t.ask,pic,X.t.askHotel,X.t.later,i,X.t.hotel+': '+n+', '+p.n))});
  list.forEach(function(c){g.appendChild(c)});
}
function fly(done){
  var path=$('#xr-d'),pl=$('#xr-pl'),bar=$('#xr-b'),len=path.getTotalLength(),t0=0,D=/*~*/2200;
  path.style.strokeDasharray=len;
  function at(q){var pt=path.getPointAtLength(len*q),p2=path.getPointAtLength(Math.min(len,len*q+2));
    pl.setAttribute('transform','translate('+pt.x.toFixed(1)+' '+pt.y.toFixed(1)+') rotate('+(Math.atan2(p2.y-pt.y,p2.x-pt.x)*180/Math.PI).toFixed(1)+')');
    path.style.strokeDashoffset=(len*(1-q)).toFixed(1);bar.style.transform='scaleX('+q.toFixed(3)+')'}
  cancelAnimationFrame(raf);
  if(calm){at(1);done();return}
  at(0);raf=requestAnimationFrame(function step(ts){if(!t0)t0=ts;var q=Math.min((ts-t0)/D,1),e=1-Math.pow(1-q,3);at(e);if(q<1)raf=requestAnimationFrame(step);else done()});
}
var last=null;
function open(){
  var p=picked();last=document.activeElement;
  $('#xr-k').textContent=X.t[mode];$('#xr-to').textContent=p.n;$('#xr-sub').textContent=sub();$('#xr-code').textContent=p.d?p.d.code:'';
  $('#xr-st').textContent=X.t.seek;fill(p);
  xr.hidden=false;document.documentElement.style.overflow='hidden';requestAnimationFrame(function(){xr.classList.add('on')});xr.scrollTop=0;$('#xr-x').focus();
  fly(function(){$('#xr-st').textContent=X.t.done;$('#xr-g').classList.add('in')});
}
function close(){cancelAnimationFrame(raf);xr.classList.remove('on');xr.hidden=true;document.documentElement.style.overflow='';if(last&&last.focus)last.focus()}
function proceed(what){close();pass=true;go.click();pass=false;setTimeout(function(){var c=$('#bf-c');if(c&&what)c.value=what},60)}
document.addEventListener('click',function(e){
  var t=e.target&&e.target.closest?e.target.closest('#go-know'):null;if(!t||pass)return;
  e.preventDefault();e.stopPropagation();open();
},true);
$('#xr-x').addEventListener('click',close);
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!xr.hidden)close()});
document.querySelectorAll('.xt button').forEach(function(b){b.addEventListener('click',function(){
  mode=b.getAttribute('data-xm');document.querySelectorAll('.xt button').forEach(function(o){o.setAttribute('aria-pressed',o===b?'true':'false')});
  var f=$('#xq-f'),chips=$('[data-g="dest"]');if(f)f.hidden=mode==='tours'&&!!chips;if(chips&&chips.closest('.fld'))chips.closest('.fld').hidden=mode!=='tours';
})});
document.querySelectorAll('[data-tour]').forEach(function(b){b.addEventListener('click',function(){
  var q=$('#xq'),f=$('#xq-f'),n=b.getAttribute('data-tour');mode='tours';
  document.querySelectorAll('.xt button').forEach(function(o){o.setAttribute('aria-pressed',o.getAttribute('data-xm')==='tours'?'true':'false')});
  var ch=$('[data-g="dest"]');if(ch&&ch.closest('.fld'))ch.closest('.fld').hidden=true;var dd=destBy(n);if(q&&f){f.hidden=false;q.value=dd?dd.n:n}open();
})});
})();</script>`;

  return { tabs, overlay, css, js };
}

/** Карточка тура клиента: фото страны, если узнали её по названию, цена — только его. */
export function tourCard(o: { name: string; price: string | null; img: string; alt: string; ask: string; cta: string; delay: number }): string {
  return `<article class="tk rv" style="--d:${o.delay}ms"><img src="${esc(o.img)}" alt="${esc(o.alt)}" width="640" height="480" loading="lazy" decoding="async"><div class="tk-b"><h3>${esc(o.name)}</h3><div class="tk-f"><b>${o.price ? esc(o.price) : esc(o.ask)}</b><button type="button" data-tour="${esc(o.name)}">${esc(o.cta)}</button></div></div></article>`;
}
