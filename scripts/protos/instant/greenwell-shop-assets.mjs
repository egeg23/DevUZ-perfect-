// Магазин нашего макета Greenwell — для шаблона «Интернет-магазин» в «Макете в боте».
//
// Владелец, 12.11.2026: «Мы теряем лидов из-за того, что они нажимают
// "другая ниша"… выведем больше ниш которые у нас есть, также переодевать
// просто». Шаблон магазина — страница `shop` макета Greenwell
// (scripts/protos/greenwell): её shop.css и shop.js берутся отсюда как есть.
// Правится только то, что зашито под Greenwell и биодобавки: фото банок,
// оценки и отзывы с Uzum, баллы, промокод, форма выпуска и состав с
// этикетки, их ссылки и знак, ключ памяти браузера. Товар без цены —
// «цена по запросу» и вопрос в чат вместо корзины. Каждая замена
// проверяется: поменялся макет Greenwell и замена не нашлась — скрипт
// падает, а не тихо собирает чужое.
//
//   node scripts/protos/instant/greenwell-shop-assets.mjs
//
// Пишет content/proto-instant/greenwell-shop-assets.json; тест сверяет его с макетом.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { SHOP_UI } from "../greenwell/ui.mjs";

const GW = new URL("../greenwell/", import.meta.url);
const read = (f) => readFileSync(new URL(f, GW), "utf8");

/** [откуда, куда] или [/регэксп/, куда] — каждая должна найтись. */
const JS_SWAPS = [
  // Память браузера — своя у шаблона: заказ отсюда читает панель магазина (lib/proto/instant/admin).
  ["KEY='gw-demo-1'", "KEY='ms-demo-1'"],
  // Фото товара — клиента или нейтральные фото ниши, по номеру товара.
  ["G.products.forEach(function(p){P[p.id]=p});", "G.products.forEach(function(p){P[p.id]=p});function PH(id){return (G.ph&&G.ph[id])||''}function PR(p){return p.ps||t('ask')}function ASK(p){var x=t('askText')+' '+p.n;return G.chat?G.chat+(G.chat.indexOf('?')<0?'?':'&')+'text='+encodeURIComponent(x):(G.tel||'#/')}"],
  [/'\+IMG\+'\/p-'\+([a-z.]+)\+'-s\.webp"/g, "'+PH($1)+'\""],
  ["var jars=['mgc','om','vc'];", "var jars=G.products.slice(0,3).map(function(p){return p.id});"],
  ["var o=off(p),imgs=['p-'+p.id+'.webp'];for(var i=0;i<p.g;i++)imgs.push('g-'+p.id+'-'+i+'.webp');", "var o=off(p),imgs=[PH(p.id)];"],
  [/src="'\+IMG\+'\/'\+s\+'"/g, "src=\"'+s+'\""],
  ["<figure class=\"label\"><img src=\"'+IMG+'/g-'+p.id+'-'+p.back+'.webp\" alt=\"'+t('labelAlt')+'\" loading=\"lazy\"></figure>", ""],
  // Цели-категории с фото, отзывы за баллы — про Greenwell.
  ["'<nav class=\"goals\" aria-label=\"'+t('cats')+'\">'+G.cats.map(function(c){return '<a href=\"#/c/'+c.id+'\" class=\"goal\"><img src=\"'+G.img+'/goal-'+c.id+'.webp\" alt=\"\" loading=\"lazy\" decoding=\"async\"><span>'+h(c.n)+'</span></a>'}).join('')+'</nav>'+", ""],
  ["'<a class=\"rev-ban\" href=\"#/me\"><span><b>'+t('revBanH',{n:fmt(G.shop.reviewPhotoPts)})+'</b><small>'+t('revBanS')+'</small></span>'+ic('camera')+'</a>'+", ""],
  // Доверие — «почему мы» клиента словами его сайта, без оценок Uzum.
  [
    "'<section class=\"trust\">'+[['globe',t('tr1h'),t('tr1s')],['star',t('tr2h',{n:'4,9'}),t('tr2s',{n:fmt(total)})],['shield',t('tr3h'),t('tr3s')],['gift',t('tr4h'),t('tr4s',{n:fmt(G.shop.reviewPhotoPts)})]].map(function(x){return '<div class=\"tr\">'+ic(x[0])+'<b>'+x[1]+'</b><small>'+x[2]+'</small></div>'}).join('')+'</section>'+",
    "(G.trust.length?'<section class=\"trust\">'+G.trust.map(function(x){return '<div class=\"tr\">'+ic(x[0])+'<b>'+h(x[1])+'</b><small>'+h(x[2])+'</small></div>'}).join('')+'</section>':'')+",
  ],
  [
    "sec(t('sale'),'<a class=\"more\" href=\"#/c/all?sale=1\">'+t('all')+ic('arrow')+'</a>','<div class=\"grid\">'+sale.slice(0,4).map(function(p){return card(p)}).join('')+'</div>')+",
    "(sale.length?sec(t('sale'),'<a class=\"more\" href=\"#/c/all?sale=1\">'+t('all')+ic('arrow')+'</a>','<div class=\"grid\">'+sale.slice(0,4).map(function(p){return card(p)}).join('')+'</div>'):'')+",
  ],
  // Карточка: цена словами клиента, без оценки и числа отзывов; рассрочка — только у цены числом.
  [
    "'<div class=\"pc-b\"><p class=\"pc-price\"><b>'+sum(p.price)+'</b>'+(o?'<s>'+fmt(p.old)+'</s>':'')+'</p><p class=\"pc-mo\">'+t('fromMo',{n:fmt(monthly(p.price,12))})+'</p>'+",
    "'<div class=\"pc-b\"><p class=\"pc-price\"><b>'+h(PR(p))+'</b></p>'+(p.price?'<p class=\"pc-mo\">'+t('fromMo',{n:fmt(monthly(p.price,12))})+'</p>':'')+",
  ],
  ["'<h3 class=\"pc-n\">'+h(p.n)+'</h3><p class=\"pc-s\">'+h(p.s)+'</p><p class=\"pc-r\">'+ic('star','st')+'<b>'+String(p.rating).replace('.',',')+'</b><span>'+fmt(p.reviews)+' '+plural(p.reviews,[t('rev1'),t('rev2'),t('rev5')])+'</span></p></div>'+", "'<h3 class=\"pc-n\">'+h(p.n)+'</h3>'+(p.s?'<p class=\"pc-s\">'+h(p.s)+'</p>':'')+'</div>'+"],
  // Без цены — не в корзину, а вопрос в чат магазина.
  ["function buyBtn(id,q){return q?", "function buyBtn(id,q){if(!P[id].price)return '<a class=\"btn btn-add\" href=\"'+h(ASK(P[id]))+'\" target=\"_blank\" rel=\"noopener\">'+ic('tg')+'<span>'+t('askPrice')+'</span></a>';return q?"],
  ["function pdBuy(p){var q=inCart(p.id);return q?", "function pdBuy(p){var q=inCart(p.id);if(!p.price)return buyBtn(p.id,0);return q?"],
  ["function pdBar(p){var q=inCart(p.id);return ", "function pdBar(p){var q=inCart(p.id);if(!p.price)return '<div class=\"pb-p\"><b>'+h(PR(p))+'</b></div>'+buyBtn(p.id,0);return "],
  ["'<div class=\"pb-p\"><b>'+sum(p.price)+'</b><small>'+t('fromMo',{n:fmt(monthly(p.price,12))})+'</small></div>'", "'<div class=\"pb-p\"><b>'+h(PR(p))+'</b><small>'+t('fromMo',{n:fmt(monthly(p.price,12))})+'</small></div>'"],
  // Страница товара: без формы выпуска, оценки Uzum, бесплатной доставки от суммы и баллов.
  ["<p class=\"pd-s\">'+h(p.s)+', '+p.count+' '+t('unit_'+p.form)+'</p>'+", "'+(p.s?'<p class=\"pd-s\">'+h(p.s)+'</p>':'')+"],
  ["'<a class=\"pd-r\" href=\"#pd-rev\">'+stars(p.rating)+'<b>'+String(p.rating).replace('.',',')+'</b><span>'+fmt(p.reviews)+' '+plural(p.reviews,[t('rev1'),t('rev2'),t('rev5')])+'</span><span class=\"dotsep\">'+p.orders+' '+t('ordersW')+'</span></a>'+", ""],
  ["'<div class=\"pd-price\"><b>'+sum(p.price)+'</b>'+(o?'<s>'+sum(p.old)+'</s><span class=\"tag-off\">−'+o+'%</span>':'')+'</div>'+", "'<div class=\"pd-price\"><b>'+h(PR(p))+'</b></div>'+"],
  ["'<button type=\"button\" class=\"pd-mo\" id=\"pd-mo\">'+ic('cal')+'<span><b>'+t('fromMo',{n:fmt(monthly(p.price,12))})+'</b><small>'+t('nasLine')+'</small></span>'+ic('chev')+'</button>'+", "(p.price?'<button type=\"button\" class=\"pd-mo\" id=\"pd-mo\">'+ic('cal')+'<span><b>'+t('fromMo',{n:fmt(monthly(p.price,12))})+'</b><small>'+t('nasLine')+'</small></span>'+ic('chev')+'</button>':'')+"],
  ["$('#pd-mo').onclick=function(){nasCalc(p.price)};", "if($('#pd-mo'))$('#pd-mo').onclick=function(){nasCalc(p.price)};"],
  [
    "'<ul class=\"pd-del\"><li>'+ic('truck')+'<span><b>'+t('delTomorrow')+'</b><small>'+t('delTerms',{n:fmt(G.shop.freeFrom)})+'</small></span></li><li>'+ic('box')+'<span><b>'+t('inStock')+'</b><small>'+t('course',{n:p.count})+'</small></span></li><li>'+ic('gift')+'<span><b>'+t('ptsFor',{n:fmt(Math.round(p.price*G.shop.pointsRate))})+'</b><small>'+t('ptsForS')+'</small></span></li></ul>'+",
    "'<ul class=\"pd-del\"><li>'+ic('truck')+'<span><b>'+t('delTomorrow')+'</b><small>'+t('delTerms')+'</small></span></li></ul>'+",
  ],
  ["'<h2 class=\"pd-h\">'+t('helps')+'</h2><ul class=\"pd-b\">'+p.b.map(function(b){return '<li>'+ic('check')+'<span>'+h(b)+'</span></li>'}).join('')+'</ul>'+", "(p.b.length?'<h2 class=\"pd-h\">'+t('helps')+'</h2><ul class=\"pd-b\">'+p.b.map(function(b){return '<li>'+ic('check')+'<span>'+h(b)+'</span></li>'}).join('')+'</ul>':'')+"],
  ["<div class=\"rv-avg\"><b>'+String(p.rating).replace('.',',')+'</b>'+stars(p.rating)+'<small>'+t('revOnUzum',{n:fmt(p.reviews)})+'</small></div>", "<div class=\"rv-avg\"><small>'+t('revOnUzum')+'</small></div>"],
  ["$('#pair-all').onclick=", "if($('#pair-all'))$('#pair-all').onclick="],
  // «С этим покупают» — пары Greenwell; у клиента пар нет — блока нет.
  ["sec(t('withThis'),'','<div class=\"rail\">'+(G.pairs[id]||[])", "(G.pairs[id]?sec(t('withThis'),'','<div class=\"rail\">'+(G.pairs[id]||[])"],
  ["return s+P[x].price},0))})+'</button>')+", "return s+P[x].price},0))})+'</button>'):'')+"],
  ["<em>'+sum(p.price)+'</em>", "<em>'+h(PR(p))+'</em>"],
  // Фильтры: без формы выпуска, оценки 4,9 и их ценовых диапазонов.
  [/'<div class="fchips">'\+\[\[0,200000\][\s\S]*?\.join\(''\)\+'<\/div><\/fieldset>'\+/, "'</fieldset>'+"],
  [/'<fieldset><legend>'\+t\('form'\)\+'<\/legend>[\s\S]*?<\/div><\/fieldset>'\+/, ""],
  ["'<label class=\"sw-row\"><span>'+t('topRated')+'</span><input type=\"checkbox\" id=\"f-top\" class=\"sw\"'+(F.top?' checked':'')+'></label>'", "''"],
  ["F.top=$('#f-top',s).checked;", "F.top=false;"],
  // Корзина: без бесплатной доставки от суммы, промокода GREEN10 и баллов.
  [/'<div class="ship-bar'[\s\S]*?<\/i><\/div>'\+/, ""],
  ["<small>'+p.count+' '+t('unit_'+p.form)+'</small>", ""],
  [/'<aside class="pg-side"><div class="box"><form class="promo"[\s\S]*?\n  sumBox\(T\)\+/, "'<aside class=\"pg-side\"><div class=\"box\">'+\n  sumBox(T)+"],
  ["V.cart_on=function(){var f=$('#promo');if(!f)return;", "V.cart_on=function(){var f=$('#promo')||{};"],
  ["</dl><p class=\"earn\">'+ic('gift')+t('earn',{n:fmt(T.earn)})+'</p>'", "</dl>'"],
  // Заказ: номер в формате панели, без баллов, поддержка — чат магазина.
  ["no='GW-'+(10480+S.orders.length+1)", "no='Z-'+(20480+S.orders.length+1)"],
  ["'<p class=\"earn c\">'+ic('gift')+t('willEarn',{n:fmt(o.T.earn)})+'</p></div>'", "'</div>'"],
  ["toast(t('ptsPlus',{n:fmt(o.T.earn)}))", "0"],
  ["'<a class=\"btn btn-ghost\" href=\"https://t.me/'+G.brand.tg+'\">'", "'<a class=\"btn btn-ghost\" href=\"'+h(G.chat||G.tel||'#/')+'\">'"],
  ["<svg class=\"logo-w dk\" viewBox=\"0 0 131 16\" aria-label=\"Greenwell\"><use href=\"#gw-logo\"/></svg>", "'+G.mark+'"],
  // Отзыв: на проверке, без баллов.
  ["<b>+'+fmt(total)+'</b><p>'+t('ptsBurst')+'</p>", "<b>'+t('ratedH')+'</b><p>'+t('ptsBurst')+'</p>"],
  ["go('#/points')},REDUCED?800:2300)", "go('#/me')},REDUCED?800:2300)"],
  // Кабинет: без уровней и баллов.
  ["<span class=\"lvl lvl-'+lv.id+'\">'+h(lv.n)+'</span>", ""],
  [/'<a class="pts-card" href="#\/points">[\s\S]*?<\/a>'\+\n\s*menu\(true\)/, "menu(true)"],
  [",['#/points','gift',t('ptsHist'),'']", ""],
  // Подвал: знак, ссылки и слова клиента вместо Greenwell.
  [/function legal\(\)\{[\s\S]*?<\/footer>'\}/, "function legal(){return '<footer class=\"sfoot\"><div class=\"sf-brand\">'+G.markW+(G.brand.made?'<p>'+h(G.brand.made)+'</p>':'')+'</div>'+(G.links.length?'<ul class=\"sf-c\">'+G.links.map(function(l){return '<li><a href=\"'+h(l[2])+'\" target=\"_blank\" rel=\"noopener\">'+ic(l[0])+'<span>'+h(l[1])+'</span></a></li>'}).join('')+'</ul>':'')+(G.brand.dist?'<p class=\"sf-l\">'+h(G.brand.dist)+'</p>':'')+'<p class=\"sf-l demo\">'+t('demoFoot')+' <a href=\"'+G.terms+'\">'+t('terms')+'</a></p><p class=\"sf-l\">'+t('source')+' '+h(G.source)+'</p></footer>'}"],
  ["<p class=\"rv-reply\"><b>Greenwell</b>", "<p class=\"rv-reply\"><b>'+h(G.brand.name)+'</b>"],
  // Язык у макета один — тот, на котором клиент выбрал бота.
  ["'<li><div class=\"lang-row\">'+ic('globe')+'<span>'+t('language')+'</span><a href=\"'+G.other+location.hash+'\" class=\"chip on\">'+(L==='ru'?'RU':'UZ')+'</a><a href=\"'+G.other+location.hash+'\" class=\"chip\">'+(L==='ru'?'UZ':'RU')+'</a></div></li>'+", ""],
  // Метка числа скрипта: при показе число сдвигается, свой сдвиг у клиента (lib/proto/stamp).
  ["((now-t0)/14000)%1", "((now-t0)/(/*~*/14000))%1"],
];

// Комментарии макета — про Greenwell; клиенту они не нужны. Метку «/*~*/» не трогаем.
const noComments = (text) => text.replace(/\/\*(?!~\*\/)[\s\S]*?\*\//g, "");

function swap(text, swaps, file) {
  let out = text;
  for (const [from, to] of swaps) {
    if (from instanceof RegExp) {
      if (!from.test(out)) throw new Error(`${file} Greenwell изменился: не нашлось ${from}`);
      from.lastIndex = 0;
      out = out.replace(from, to);
      continue;
    }
    if (!out.includes(from)) throw new Error(`${file} Greenwell изменился: не нашлось «${from.slice(0, 90)}»`);
    out = out.split(from).join(to);
  }
  return out;
}

/** Рисунок города для булавки адреса — из gen.mjs Greenwell, без подписей их улиц. */
function city() {
  const gen = read("gen.mjs");
  const m = gen.match(/const CITY = `([\s\S]*?)`;/);
  if (!m) throw new Error("greenwell/gen.mjs изменился: нет рисунка города");
  const out = m[1].replace(/<g font-family[\s\S]*?<\/g>/, "").replace('id="gw-city"', 'id="ms-city"');
  if (/<text/.test(out)) throw new Error("в рисунке города остались подписи улиц");
  return out;
}

/**
 * Подписи магазина — только те, что зовёт скрипт; имя Greenwell — местом
 * «{name}». Подписи про них (GMP, дистрибутор, Uzum, баллы за отзыв) скрипт
 * после замен не зовёт, и в шаблон они не идут.
 */
const UI_DROP = ["tr1h", "tr1s", "tr2h", "tr2s", "tr3h", "tr3s", "tr4h", "tr4s", "revBanH", "revBanS", "onUzum", "certH", "certS", "labelAlt", "form_caps", "form_tab", "form_soft", "unit_caps", "unit_tab", "unit_soft", "topRated", "course", "ptsFor", "ptsForS", "toFree", "freeOk", "promoHint", "usePts", "ptsBal", "ptsLogin", "ptsLoginS", "earn", "willEarn", "ptsPlus", "tag_halal", "tag_vegan"];
function ui(js) {
  const out = {};
  for (const [k, v] of Object.entries(SHOP_UI)) {
    if (UI_DROP.includes(k)) continue;
    out[k] = v.map((x) => x.split("Greenwell").join("{name}"));
  }
  const used = [...js.matchAll(/\bt\('([A-Za-z0-9_]+)'/g)].map((m) => m[1]);
  for (const k of used) if (!SHOP_UI[k] && !["ask", "askPrice", "askText", "source"].includes(k) && !/^(sort_|st\d|pw_|form_|unit_|tag_)$/.test(k)) throw new Error(`нет подписи «${k}»`);
  return out;
}

export function greenwellShopAssets() {
  const css = noComments(read("shop.css")).replace(/\n\s*/g, "");
  const js = swap(noComments(read("shop.js")).replace(/\n\s*\n/g, "\n"), JS_SWAPS, "shop.js").replace("'#gw-city'", "'#ms-city'").split("#gw-city").join("#ms-city");
  const left = js.match(/.{0,60}(?:Greenwell|greenwell|uzum\.uz|GREEN10).{0,60}/);
  if (left) throw new Error(`в shop.js остался Greenwell: ${left[0]}`);
  return { css, js, city: city(), ui: ui(js) };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL("../../../content/proto-instant/greenwell-shop-assets.json", import.meta.url), `${JSON.stringify(greenwellShopAssets())}\n`);
  console.log("greenwell-shop-assets.json записан");
}
