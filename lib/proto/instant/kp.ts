/**
 * КП после «Макета в боте» — страница на фирменном бланке DevUz, рядом с
 * макетом: `/proto/<токен>/kp`.
 *
 * Владелец, 11.11.2026: «сразу после этого должно высыпаться КП которое
 * актуально 48 часов с таймером также в виде html красивого… И на нашем
 * бланке. То есть данные просто подставляются клиентские, ничего заново не
 * генерируем и не тратим на это токены… Фиксируем цену на 48 часов для
 * принятия решения».
 *
 * Строковая подстановка, без модели: бланк — как kp/letterhead.* (шапка с
 * знаком, контакты, подвал ИП), база и допы — lib/proto/instant/offer.ts,
 * срок — 48 часов от сборки (OFFER_MS, как акция после любого макета).
 * Клиент отмечает допы и видит итог; выбор копируется текстом в чат бота.
 */
import { OFFER_HOURS, OFFER_MS, untilText } from "@/lib/admin/mockup-offer";
import { mockupTermsUrl } from "@/lib/proto/booking";
import { PROTO_BASE } from "@/lib/proto/pages";
import { offerAddons, offerBase } from "@/lib/proto/instant/offer";
import { esc } from "@/lib/proto/instant/safe";
import type { InstantSite } from "@/lib/proto/instant/types";

const BOT = "https://t.me/Devuz_studio_bot";

const T = {
  ru: {
    title: "Коммерческое предложение",
    for: "для",
    date: "Дата",
    fixed: `Цена закреплена на ${OFFER_HOURS} часов`,
    until: "до",
    tz: "по Ташкенту",
    left: "Осталось",
    over: "Срок спецусловий вышел: действуют обычные цены. Напишите нам, обсудим.",
    mockKick: "Ваш макет",
    mockText: "Собран по данным вашей компании. Так может выглядеть ваш новый сайт.",
    mockBtn: "Открыть макет",
    baseKick: "Основа",
    baseText: "Выберите, какой сайт нужен.",
    instead: "вместо",
    addKick: "Дополнительно",
    addText: "Отметьте то, что нужно. Можно без допов: сайт работает и так.",
    total: "Итого",
    pay: "Оплата частями: половина при старте, половина после запуска, когда всё работает.",
    go: "Хочу такой сайт",
    goHint: "Выбор скопируется, вставьте его в чат бота и отправьте. Менеджер свяжется с вами.",
    copied: "Выбор скопирован: вставьте его в чат бота.",
    msgHead: "Хочу сайт по макету",
    terms: "условия макета",
    termsLine: "Макет принадлежит DevUz Studio. Пользуясь им, вы принимаете",
    days: "д",
  },
  uz: {
    title: "Tijorat taklifi",
    for: "uchun",
    date: "Sana",
    fixed: `Narx ${OFFER_HOURS} soatga qotirildi`,
    until: "gacha",
    tz: "Toshkent vaqti bilan",
    left: "Qoldi",
    over: "Maxsus shartlar muddati tugadi: odatiy narxlar amal qiladi. Bizga yozing, gaplashamiz.",
    mockKick: "Maketingiz",
    mockText: "Kompaniyangiz ma’lumotlari bo‘yicha yig‘ildi. Yangi saytingiz shunday ko‘rinishi mumkin.",
    mockBtn: "Maketni ochish",
    baseKick: "Asos",
    baseText: "Qanday sayt kerakligini tanlang.",
    instead: "o‘rniga",
    addKick: "Qo‘shimcha",
    addText: "Keraklisini belgilang. Qo‘shimchasiz ham bo‘ladi: sayt baribir ishlaydi.",
    total: "Jami",
    pay: "Bo‘lib to‘lash: yarmi boshida, yarmi ishga tushgandan keyin, hammasi ishlaganda.",
    go: "Shunday sayt kerak",
    goHint: "Tanlov nusxalanadi, uni bot chatiga qo‘yib yuboring. Menejer siz bilan bog‘lanadi.",
    copied: "Tanlov nusxalandi: uni bot chatiga qo‘ying.",
    msgHead: "Maket bo‘yicha sayt kerak",
    terms: "maket shartlari",
    termsLine: "Maket DevUz Studio’ga tegishli. Undan foydalanib, siz qabul qilasiz:",
    days: "k",
  },
} as const;

const STAR =
  "M0 -100 L29.29 -70.71 L70.71 -70.71 L70.71 -29.29 L100 0 L70.71 29.29 L70.71 70.71 L29.29 70.71 L0 100 L-29.29 70.71 L-70.71 70.71 L-70.71 29.29 L-100 0 L-70.71 -29.29 L-70.71 -70.71 L-29.29 -70.71 Z";
/** Знак DevUz — тот же, что на бланке (kp/letterhead.js). */
const LOGO = `<svg viewBox="-112 -112 224 224" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="-1" x2="1" y2="1"><stop offset="0" stop-color="#5B9BFF"/><stop offset="55%" stop-color="#3B82F6"/><stop offset="100%" stop-color="#22F0A0"/></linearGradient><mask id="lm"><rect x="-112" y="-112" width="224" height="224" fill="#fff"/><path d="M-22 -34 L-58 0 L-22 34" stroke="#000" stroke-width="15" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 -34 L58 0 L22 34" stroke="#000" stroke-width="15" fill="none" stroke-linecap="round" stroke-linejoin="round"/></mask></defs><path d="${STAR}" fill="url(#lg)" mask="url(#lm)"/><rect x="-5" y="-27" width="10" height="54" rx="5" fill="#e8b14c"/></svg>`;

const HEAD = {
  ru: { tag: "Разработка сайтов, приложений и ИИ-продуктов · Ташкент", addr: "Ташкент, улица Шота Руставели, 138", legal: "ИП MAKSIMOV EGOR ANDREEVICH · Республика Узбекистан, г. Ташкент, улица Шота Руставели, 138" },
  uz: { tag: "Saytlar, ilovalar va sun’iy intellekt mahsulotlari · Toshkent", addr: "Toshkent, Shota Rustaveli ko‘chasi, 138", legal: "YaTT MAKSIMOV EGOR ANDREEVICH · O‘zbekiston Respublikasi, Toshkent sh., Shota Rustaveli ko‘chasi, 138" },
} as const;

const money = (n: number) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} $`;

/** Страница КП. `builtAt` — время сборки макета: от него 48 часов. */
export function kpHtml(site: InstantSite, builtAt: Date): string {
  const l = site.locale;
  const t = T[l];
  const h = HEAD[l];
  const deadline = new Date(builtAt.getTime() + OFFER_MS).toISOString();
  const base = offerBase(l);
  const addons = offerAddons(site.niche);
  const name = esc(site.name);
  const day = untilText(builtAt.toISOString()).split(" ")[0];
  const data = {
    deadline,
    base: base.map((b) => ({ id: b.id, price: b.price, regular: b.regular, title: b.title })),
    addons: addons.map((a) => ({ id: a.id, price: a.price, title: a[l] })),
    head: `${t.msgHead} «${site.name}»`,
    total: t.total,
    over: t.over,
    copied: t.copied,
    d: t.days,
  };

  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${t.title} · ${name}</title>
<meta name="robots" content="noindex, nofollow, noarchive">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap&subset=cyrillic,latin-ext">
<style>
*{box-sizing:border-box}
html{background:#e9ebee}
body{margin:0;padding:16px;font:400 15px/1.55 Inter,system-ui,sans-serif;color:#000;-webkit-font-smoothing:antialiased}
.sheet{max-width:820px;margin:0 auto;background:#fff;padding:28px 22px 22px;box-shadow:0 4px 24px rgba(0,0,0,.14);border-radius:4px}
@media(min-width:720px){.sheet{padding:40px 56px 32px}}
.lh{display:flex;justify-content:space-between;gap:16px;padding-bottom:14px;border-bottom:2px solid #000;flex-wrap:wrap}
.lh-b{display:flex;align-items:center;gap:10px}
.lh-b svg{width:40px;height:40px;flex:none}
.lh-n{margin:0;font-size:18px;font-weight:600;line-height:1}
.lh-t{margin:4px 0 0;font-size:12px;color:rgba(0,0,0,.6)}
.lh-c{font-size:12px;line-height:1.45;color:rgba(0,0,0,.7);text-align:right}
.lh-c p{margin:0}
@media(max-width:560px){.lh-c{text-align:left}}
h1{font-size:28px;line-height:1.15;margin:28px 0 6px;letter-spacing:-.01em}
.sub{margin:0;color:rgba(0,0,0,.6)}
.timer{margin:22px 0 0;padding:16px 18px;border:2px solid #000;border-radius:10px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.timer b{font-size:16px}
.timer small{display:block;color:rgba(0,0,0,.6)}
.clock{font:700 28px/1 Inter,system-ui,sans-serif;font-variant-numeric:tabular-nums;letter-spacing:.02em}
.timer.over{border-color:#b42318;color:#b42318}
section{margin:30px 0 0}
.kick{font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(0,0,0,.55);margin:0 0 6px}
.lead{margin:0 0 14px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:0 22px;border-radius:999px;background:#000;color:#fff;font-weight:600;text-decoration:none;border:0;cursor:pointer;font-size:15px}
.btn.ghost{background:#fff;color:#000;border:2px solid #000}
.opts{display:grid;gap:10px;grid-template-columns:minmax(0,1fr)}
@media(min-width:720px){.opts.two{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}}
.opt{display:flex;gap:12px;align-items:flex-start;padding:14px 16px;border:1px solid rgba(0,0,0,.18);border-radius:10px;cursor:pointer}
.opt:has(input:checked){border-color:#000;box-shadow:inset 0 0 0 1px #000}
.opt input{margin-top:4px;width:18px;height:18px;accent-color:#000;flex:none}
.opt .tx{flex:1;min-width:0}
.opt b{display:block}
.opt small{color:rgba(0,0,0,.6)}
.pr{text-align:right;white-space:nowrap;font-weight:700}
.pr s{display:block;font-weight:400;color:rgba(0,0,0,.45)}
.sum{margin:26px 0 0;padding:18px;background:#f4f5f7;border-radius:10px}
.sum .row{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
.sum .big{font-size:30px;font-weight:700}
.sum p{margin:10px 0 0;color:rgba(0,0,0,.7)}
.go{margin:20px 0 0;display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.hint{margin:10px 0 0;font-size:13px;color:rgba(0,0,0,.6)}
.toast{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);background:#000;color:#fff;padding:10px 16px;border-radius:999px;font-size:14px}
.foot{margin:34px 0 0;padding-top:12px;border-top:1px solid rgba(0,0,0,.25);font-size:11px;color:rgba(0,0,0,.6);display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
.foot a{color:inherit}
@media print{html{background:#fff}body{padding:0}.sheet{box-shadow:none}.go,.toast{display:none}}
</style>
</head>
<body>
<div class="sheet">
<header class="lh"><div class="lh-b">${LOGO}<div><p class="lh-n">DevUz Studio</p><p class="lh-t">${h.tag}</p></div></div>
<div class="lh-c"><p>devuz.studio</p><p>t.me/Devuz_studio_bot</p><p>+998 90 912-05-78 · +48 574 050 123</p><p>${h.addr}</p></div></header>

<h1>${t.title}</h1>
<p class="sub">${l === "uz" ? `«${name}» ${t.for}` : `${t.for} «${name}»`} · ${t.date} ${day}</p>

<div class="timer" id="timer"><div><b>${t.fixed}</b><small>${l === "uz" ? `${t.tz} ${esc(untilText(deadline))} ${t.until}` : `${t.until} ${esc(untilText(deadline))} ${t.tz}`}</small></div><div><small>${t.left}</small><span class="clock" id="clock">48:00:00</span></div></div>

<section><p class="kick">${t.mockKick}</p><p class="lead">${t.mockText}</p><a class="btn ghost" href="${PROTO_BASE}/">${t.mockBtn}</a></section>

<section><p class="kick">${t.baseKick}</p><p class="lead">${t.baseText}</p>
<div class="opts two">${base
    .map(
      (b, i) =>
        `<label class="opt"><input type="radio" name="base" value="${b.id}"${i === 0 ? " checked" : ""}><span class="tx"><b>${esc(b.title)}</b><small>${esc(b.note)}</small></span><span class="pr">${money(b.price)}<s>${t.instead} ${money(b.regular)}</s></span></label>`,
    )
    .join("")}</div></section>

<section><p class="kick">${t.addKick}</p><p class="lead">${t.addText}</p>
<div class="opts">${addons
    .map((a) => `<label class="opt"><input type="checkbox" name="add" value="${esc(a.id)}"><span class="tx"><b>${esc(a[l])}</b></span><span class="pr">${money(a.price)}</span></label>`)
    .join("")}</div></section>

<div class="sum"><div class="row"><b>${t.total}</b><span class="big" id="total">${money(base[0].price)}</span></div><p>${t.pay}</p></div>

<div class="go"><a class="btn" id="go" href="${BOT}" target="_blank" rel="noopener">${t.go}</a></div>
<p class="hint">${t.goHint}</p>

<footer class="foot"><span><b>${h.legal.split(" · ")[0]}</b> · ${h.legal.split(" · ")[1]}</span><span>${t.termsLine} <a href="${esc(mockupTermsUrl(l))}" target="_blank" rel="noopener">${t.terms}</a></span></footer>
</div>
<p class="toast" id="toast" hidden></p>
<script type="application/json" id="kp">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>
<script>
(function(){var D=JSON.parse(document.getElementById('kp').textContent),$=function(i){return document.getElementById(i)};
function fmt(n){return String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g,' ')+' $'}
function pick(){var b=document.querySelector('input[name=base]:checked'),base=D.base.filter(function(x){return x.id===(b&&b.value)})[0]||D.base[0];
var add=Array.prototype.filter.call(document.querySelectorAll('input[name=add]'),function(x){return x.checked}).map(function(x){return D.addons.filter(function(a){return a.id===x.value})[0]}).filter(Boolean);
return{base:base,add:add,total:add.reduce(function(s,a){return s+a.price},base.price)}}
function draw(){$('total').textContent=fmt(pick().total)}
document.addEventListener('change',draw);draw();
var end=Date.parse(D.deadline),tm;function tick(){var left=end-Date.now(),c=$('clock');if(left<=0){$('timer').classList.add('over');$('timer').innerHTML='<b>'+D.over+'</b>';clearInterval(tm);return}
var s=Math.floor(left/1000),h=Math.floor(s/3600),m=Math.floor(s%3600/60),p=function(n){return(n<10?'0':'')+n};c.textContent=p(h)+':'+p(m)+':'+p(s%60)}
tick();tm=setInterval(tick,1000);
$('go').addEventListener('click',function(){var x=pick(),text=[D.head,'• '+x.base.title+': '+fmt(x.base.price)].concat(x.add.map(function(a){return '• '+a.title+': '+fmt(a.price)})).concat([D.total+': '+fmt(x.total)]).join('\\n');
try{navigator.clipboard&&navigator.clipboard.writeText(text)}catch(e){}var t=$('toast');t.textContent=D.copied;t.hidden=false;setTimeout(function(){t.hidden=true},3500)});
})();
</script>
</body>
</html>`;
}
