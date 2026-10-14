(function () {
'use strict';
/* Приложение DomTut, прототип DevUz Studio. Данные страницы (язык, тексты,
   ЖК, статистика) приходят в window.DT от gen.mjs. Навигация как в iOS:
   у каждой вкладки свой стек экранов, переход вглубь справа, назад кнопкой
   или свайпом от левого края, нижние листы тянутся пальцем. Анимации только
   transform и opacity. Состояние демо (избранное, заявки, валюта) живёт в
   этом браузере. */
var DT = window.DT, U = DT.ui, L = DT.lang;
var d = document, root = d.documentElement;
var REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
var KEY = 'dt-app-1';
var IMG = DT.img;

/* Режим показа: в рамке на сайте (embed), в рамке на ПК, на весь экран телефона. */
var Q = location.search;
var EMBED = /[?&]embed=1/.test(Q);
var NARROW = matchMedia('(max-width: 899px), (max-height: 560px)');
function mode() {
  root.classList.toggle('embed', EMBED);
  root.classList.toggle('framed', !EMBED && !NARROW.matches);
  root.classList.toggle('native', !EMBED && NARROW.matches);
  root.classList.toggle('in-phone', EMBED || !NARROW.matches);
}
mode();
if (NARROW.addEventListener) NARROW.addEventListener('change', mode);

/* Двойной тап и щипок не приближают: viewport + touch-action, а Safari ещё и жестами. */
['gesturestart', 'gesturechange', 'gestureend'].forEach(function (t) { d.addEventListener(t, function (e) { e.preventDefault(); }, { passive: false }); });
var lastTouch = 0;
d.addEventListener('touchend', function (e) { var n = Date.now(); if (n - lastTouch < 300 && !e.target.closest('input,textarea,select')) e.preventDefault(); lastTouch = n; }, { passive: false });

/* ── Состояние ── */
var S = (function () {
  var s = { fav: ['center', 'mirador'], cur: 'uzs', notif: { fresh: true, drop: true, promo: false }, reqs: [], phone: '', name: '', authed: false, seen: false };
  try { var x = JSON.parse(localStorage.getItem(KEY) || 'null'); if (x) for (var k in x) s[k] = x[k]; } catch (e) {}
  return s;
})();
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

/* ── Мелочи ── */
function $(s, r) { return (r || d).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function ic(n, c) { return '<svg class="ic' + (c ? ' ' + c : '') + '" aria-hidden="true"><use href="#i-' + n + '"/></svg>'; }
function grp(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
function dec(n) { return String(n).replace('.', ','); }
function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms || 8); } catch (e) {} }
function fmt(s, o) { return String(s).replace(/\{(\w+)\}/g, function (_, k) { return o[k] != null ? o[k] : ''; }); }
function byId(id) { for (var i = 0; i < DT.zk.length; i++) if (DT.zk[i].id === id) return DT.zk[i]; return null; }
function plural(n, a) { if (L !== 'ru') return a[0]; var x = n % 10, y = n % 100; return x === 1 && y !== 11 ? a[0] : x >= 2 && x <= 4 && (y < 10 || y >= 20) ? a[1] : a[2]; }

/* Цена «от»: в миллионах сум, как у DomTut; в долларах — по их же курсу. */
function money(mln) {
  if (S.cur === 'usd') return grp(Math.round(mln * 1e6 / DT.rate / 100) * 100) + ' $';
  if (mln >= 1000) return dec(Math.round(mln / 100) / 10) + ' ' + U.bln;
  if (mln < 100) return dec(Math.round(mln * 10) / 10) + '\u00a0' + U.mln;
  return grp(mln) + ' ' + U.mln;
}
/* «от 173 млн сум» по-русски, «173 mln so‘m dan» по-узбекски. */
function upTo(x) { return L === 'ru' ? U.upTo + ' ' + x : x + ' ' + U.upTo; }
function from(x) { return L === 'ru' ? U.from + ' ' + x : x + ' ' + U.from; }
function minPrice(z) { var m = Infinity; z.rooms.forEach(function (r) { if (r[2] < m) m = r[2]; }); return m === Infinity ? null : m; }
function priceLine(z) {
  var m = minPrice(z);
  if (m != null) return from(money(m));
  if (z.m2) return L === 'ru' ? from((S.cur === 'usd' ? grp(Math.round(z.m2 * 1e6 / DT.rate)) + ' $' : dec(z.m2) + ' ' + U.mln) + ' ' + U.perM2) : U.perM2 + ' ' + from(S.cur === 'usd' ? grp(Math.round(z.m2 * 1e6 / DT.rate)) + ' $' : dec(z.m2) + ' ' + U.mln);
  return U.onRequest;
}
function photo(z, i, small) { return IMG + '/' + z.photo + '-' + (i || 0) + (small ? '-s' : '') + '.webp'; }
function isFav(id) { return S.fav.indexOf(id) >= 0; }

/* ── Каркас ── */
var app = $('#app'), views = $('#views'), tabsEl = $('#tabs'), toastEl = $('#toast');
var sheetBg = $('#sheet-bg'), sheet = $('#sheet');
var TABS = ['home', 'catalog', 'map', 'fav', 'more'];
var stacks = {}, cur = 'home';
TABS.forEach(function (t) { stacks[t] = []; });

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.remove('on'); void toastEl.offsetWidth; toastEl.classList.add('on');
  clearTimeout(toast.t); toast.t = setTimeout(function () { toastEl.classList.remove('on'); }, 2200);
}

/* Экран: элемент с прокруткой, своей шапкой и обработчиками. */
function build(name, arg) {
  var v = d.createElement('section');
  v.className = 'v v-' + name;
  v.setAttribute('data-view', name);
  var r = V[name](arg);
  v.innerHTML = r.html;
  if (r.noTabs) v.classList.add('no-tabs');
  v._arg = arg; v._name = name; v._after = r.after;
  return v;
}
function mount(v) {
  views.appendChild(v);
  if (v._after) v._after(v);
  bindCommon(v);
}
function top() { var s = stacks[cur]; return s ? s[s.length - 1] : null; }
/* Все вкладки — к началу, ни одна не показана: дальше tab() откроет нужную. */
function reset() { closeSheet(); TABS.forEach(function (t) { while (stacks[t].length > 1) stacks[t].pop().remove(); if (stacks[t][0]) stacks[t][0].hidden = true; }); cur = null; }
function showTabs(v) { tabsEl.classList.toggle('hide', !!(v && v.classList.contains('no-tabs'))); darkTop(v); }
/* Строка состояния белая, пока под ней фото ЖК. */
function darkTop(v) { root.classList.toggle('dark-top', !!(v && v._name === 'zk' && v.scrollTop < 230)); }

function go(name, arg) {
  var prev = top(), v = build(name, arg);
  stacks[cur].push(v);
  mount(v);
  showTabs(v);
  if (prev) {
    if (REDUCED) { prev.hidden = true; return; }
    v.classList.add('push-in'); prev.classList.add('under');
    v.addEventListener('animationend', function f() { v.removeEventListener('animationend', f); v.classList.remove('push-in'); prev.classList.remove('under'); prev.hidden = true; });
  }
  buzz(6);
}
function back() {
  var s = stacks[cur];
  if (s.length < 2) return;
  var v = s.pop(), prev = s[s.length - 1];
  prev.hidden = false; showTabs(prev);
  refresh(prev);
  if (REDUCED) { v.remove(); return; }
  v.classList.add('pop-out'); prev.classList.add('over');
  v.addEventListener('animationend', function f() { v.remove(); prev.classList.remove('over'); });
}
/* Вкладка: свой стек; повторное нажатие — к началу вкладки и наверх. */
function tab(t) {
  if (t === cur) {
    var s = stacks[cur];
    if (s.length > 1) { while (s.length > 2) s.splice(1, 1)[0].remove(); back(); }
    else if (s[0]) s[0].scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' });
    return;
  }
  var old = cur && top();
  if (old) old.hidden = true;
  cur = t;
  $$('button', tabsEl).forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-tab') === t); b.setAttribute('aria-selected', b.getAttribute('data-tab') === t); });
  if (!stacks[t].length) { var v = build(t); stacks[t].push(v); mount(v); }
  var nv = top(); nv.hidden = false; refresh(nv); showTabs(nv);
  if (!REDUCED) { nv.classList.remove('fade-in'); void nv.offsetWidth; nv.classList.add('fade-in'); }
  buzz(4);
}
/* Вернулись на экран — перерисовать то, что могло поменяться (избранное, валюта). */
function refresh(v) {
  if (!v || !v._name || /^(book|podbor|mortgage|done)$/.test(v._name)) return;
  var y = v.scrollTop, r = V[v._name](v._arg);
  v.innerHTML = r.html; v._after = r.after;
  if (r.after) r.after(v);
  bindCommon(v); v.scrollTop = y;
}
function refreshAll() { TABS.forEach(function (t) { stacks[t].forEach(function (v) { if (!v.hidden) refresh(v); }); }); }

/* Общие нажатия внутри экрана: data-go, избранное, назад, большой заголовок. */
function bindCommon(v) {
  var bar = $('.nb', v);
  if (bar && !v._sc) {
    v._sc = true;
    var lt = $('.lt', v), tick = false;
    v.addEventListener('scroll', function () {
      if (tick) return; tick = true;
      requestAnimationFrame(function () {
        tick = false;
        var y = v.scrollTop, k = Math.min(Math.max((y - 20) / 34, 0), 1);
        bar.style.setProperty('--k', k.toFixed(3));
        if (lt) lt.style.transform = 'translate3d(0,' + (-Math.min(y, 60) * .25).toFixed(1) + 'px,0)';
        if (v === top()) darkTop(v);
        var hero = $('.zk-hero', v);
        if (hero) {
          if (y < 0) hero.style.transform = 'translate3d(0,' + y + 'px,0) scale(' + (1 - y / 300).toFixed(3) + ')';
          else hero.style.transform = 'translate3d(0,' + (y * .45).toFixed(1) + 'px,0)';
        }
      });
    }, { passive: true });
  }
}
app.addEventListener('click', function (e) {
  var t = e.target.closest('[data-go],[data-fav],[data-back],[data-tab-go],[data-act]');
  if (!t || !app.contains(t)) return;
  if (t.hasAttribute('data-fav')) {
    e.preventDefault(); e.stopPropagation();
    var id = t.getAttribute('data-fav'), i = S.fav.indexOf(id);
    if (i >= 0) S.fav.splice(i, 1); else S.fav.push(id);
    save(); buzz(i >= 0 ? 6 : [6, 40, 10]);
    $$('[data-fav="' + id + '"]', app).forEach(function (b) { b.classList.toggle('on', i < 0); if (i < 0 && !REDUCED) { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); } });
    toast(i >= 0 ? U.favOff : U.favOn);
    badge();
    return;
  }
  if (t.hasAttribute('data-back')) { back(); return; }
  if (t.hasAttribute('data-tab-go')) { tab(t.getAttribute('data-tab-go')); return; }
  if (t.hasAttribute('data-go')) {
    var p = t.getAttribute('data-go').split(':');
    go(p[0], p.slice(1).join(':') || undefined);
    return;
  }
  if (t.hasAttribute('data-act')) ACT[t.getAttribute('data-act')](t, e);
});
tabsEl.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) tab(b.getAttribute('data-tab')); });
function badge() { var b = $('[data-tab="fav"] .dot', tabsEl); if (b) { b.textContent = S.fav.length; b.style.display = S.fav.length ? '' : 'none'; } }

/* Свайп назад от левого края, как в iOS. */
(function () {
  var sx = 0, sy = 0, on = false, v = null, prev = null, w = 1, dx = 0, t0 = 0;
  views.addEventListener('touchstart', function (e) {
    var s = stacks[cur]; if (s.length < 2 || sheet.classList.contains('on')) return;
    var r = views.getBoundingClientRect(), x = e.touches[0].clientX - r.left;
    if (x > 28) return;
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; on = true; dx = 0; t0 = Date.now();
    v = s[s.length - 1]; prev = s[s.length - 2]; w = r.width;
  }, { passive: true });
  views.addEventListener('touchmove', function (e) {
    if (!on) return;
    var x = e.touches[0].clientX - sx, y = e.touches[0].clientY - sy;
    if (!dx && Math.abs(y) > Math.abs(x)) { on = false; return; }
    dx = Math.max(0, x);
    prev.hidden = false;
    v.style.transition = prev.style.transition = 'none';
    v.style.transform = 'translate3d(' + dx + 'px,0,0)';
    prev.style.transform = 'translate3d(' + (-w * .3 + dx * .3) + 'px,0,0)';
    prev.style.opacity = (.7 + .3 * dx / w).toFixed(3);
  }, { passive: true });
  views.addEventListener('touchend', function () {
    if (!on) return; on = false;
    var fast = dx / Math.max(1, Date.now() - t0) > .5, done = dx > w * .35 || (fast && dx > 30);
    v.style.transition = prev.style.transition = 'transform .28s cubic-bezier(.2,.85,.25,1), opacity .28s';
    if (done) {
      v.style.transform = 'translate3d(' + w + 'px,0,0)'; prev.style.transform = 'none'; prev.style.opacity = '1';
      var vv = v, pp = prev;
      setTimeout(function () { stacks[cur].pop(); vv.remove(); pp.style.transition = ''; pp.style.transform = ''; pp.style.opacity = ''; showTabs(pp); refresh(pp); }, 280);
    } else {
      v.style.transform = 'none'; prev.style.transform = 'translate3d(' + (-w * .3) + 'px,0,0)';
      var a = v, b = prev;
      setTimeout(function () { a.style.transition = a.style.transform = ''; b.style.transition = b.style.transform = b.style.opacity = ''; b.hidden = true; }, 280);
    }
  });
})();

/* Каркас приложения не прокручивается никогда: браузер иногда двигает
   overflow:hidden-контейнеры, когда показывает поле ввода или кнопку. */
[app, views, $('#screen')].forEach(function (el) { if (el) el.addEventListener('scroll', function () { if (el.scrollTop || el.scrollLeft) { el.scrollTop = 0; el.scrollLeft = 0; } }); });

/* ── Нижний лист: открывается снизу, закрывается фоном, крестиком и пальцем вниз ── */
function openSheet(html, after) {
  sheet.innerHTML = '<div class="grab" aria-hidden="true"></div>' + html;
  sheet.classList.add('on'); sheetBg.classList.add('on');
  sheet.scrollTop = 0;
  if (after) after(sheet);
  buzz(6);
}
function closeSheet() { sheet.classList.remove('on'); sheetBg.classList.remove('on'); sheet.style.transform = ''; }
sheetBg.addEventListener('click', closeSheet);
(function () {
  var sy = 0, dy = 0, on = false;
  sheet.addEventListener('touchstart', function (e) { if (sheet.scrollTop > 0) return; sy = e.touches[0].clientY; dy = 0; on = true; }, { passive: true });
  sheet.addEventListener('touchmove', function (e) {
    if (!on) return; dy = e.touches[0].clientY - sy;
    if (dy < 0) { dy = 0; return; }
    sheet.style.transition = 'none'; sheet.style.transform = 'translate3d(0,' + dy + 'px,0)';
  }, { passive: true });
  sheet.addEventListener('touchend', function () {
    if (!on) return; on = false; sheet.style.transition = '';
    if (dy > 110) closeSheet(); else sheet.style.transform = '';
  });
})();
sheet.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) closeSheet(); });

/* ── Куски экранов ── */
function nav(title, opts) {
  opts = opts || {};
  return '<header class="nb' + (opts.solid ? ' solid' : '') + '">' +
    (opts.back ? '<button class="nb-b" data-back aria-label="' + U.back + '">' + ic('back') + '</button>' : '<span class="nb-g"></span>') +
    '<h2>' + esc(title) + '</h2>' + (opts.right || '<span class="nb-g"></span>') + '</header>';
}
function chip(text, cls) { return '<span class="chip ' + (cls || '') + '">' + text + '</span>'; }
function clsChip(z) { return chip(DT.cls[z.cls], 'c-' + z.cls); }
function favBtn(id, cls) { return '<button class="fav ' + (cls || '') + (isFav(id) ? ' on' : '') + '" data-fav="' + id + '" aria-label="' + U.fav + '">' + ic('heart') + ic('heartf', 'f') + '</button>'; }
function zkCard(z, wide) {
  return '<article class="zc' + (wide ? ' wide' : '') + '" data-go="zk:' + z.id + '">' +
    '<div class="zc-img"><img src="' + photo(z, 0, true) + '" alt="' + esc(z.name) + '" loading="lazy" decoding="async">' + favBtn(z.id) +
    '<div class="zc-tags">' + clsChip(z) + (z.done ? chip(U.ready, 'c-ok') : '') + (z.tags.indexOf('plan') >= 0 ? chip(U.plan, 'c-plan') : '') + '</div></div>' +
    '<div class="zc-b"><p class="zc-p num">' + priceLine(z) + '</p><h3>' + esc(z.name) + '</h3><p class="zc-m">' + esc(z.dev) + ' · ' + esc(z.due) + '</p>' +
    '<p class="zc-a">' + ic('pin') + '<span>' + esc(z.addr) + '</span></p></div></article>';
}
function rowsMini(z) {
  if (!z.rooms.length) return '';
  return '<div class="rm">' + z.rooms.slice(0, 3).map(function (r) { return '<span><b>' + r[0] + U.rShort + '</b> ' + from(dec(r[1]) + ' ' + U.m2) + '</span>'; }).join('') + '</div>';
}

/* ── Экраны ── */
var V = {};

V.home = function () {
  var pop = ['center', 'mirador', 'dcasa', 'mezon', 'afsona', 'mavera'].map(byId);
  var st = DT.stats[1];
  return {
    html: nav('DomTut', { right: '<button class="nb-b" data-go="alerts" aria-label="' + U.alerts + '">' + ic('bell') + '</button>' }) +
      '<div class="lt home-lt"><svg class="lt-mark" aria-hidden="true"><use href="#dt-mark"/></svg><div><p class="lt-k">' + U.hello + '</p><h1>' + U.homeTitle + '</h1></div></div>' +
      '<button class="search" data-go="catalog:q">' + ic('search') + '<span>' + U.searchPh + '</span></button>' +
      '<div class="qchips">' +
        '<button class="qc" data-act="quick" data-q="r1">' + U.q1 + '</button>' +
        '<button class="qc" data-act="quick" data-q="b50">' + U.q50 + '</button>' +
        '<button class="qc" data-act="quick" data-q="plan">' + U.plan + '</button>' +
        '<button class="qc" data-act="quick" data-q="ready">' + U.ready + '</button>' +
        '<button class="qc" data-act="quick" data-q="premium">' + DT.cls.premium + '</button>' +
      '</div>' +
      '<button class="promo" data-go="podbor"><span class="promo-t"><b>' + U.podborTitle + '</b><small>' + U.podborSub + '</small></span><span class="promo-i">' + ic('spark') + '</span><span class="promo-a">' + U.podborBtn + ic('chev') + '</span></button>' +
      '<div class="sec"><h3>' + U.popular + '</h3><button data-tab-go="catalog">' + U.all + '</button></div>' +
      '<div class="rail">' + pop.map(function (z) { return zkCard(z); }).join('') + '</div>' +
      '<div class="tiles">' +
        '<button class="tile t-mort" data-go="mortgage">' + ic('calc') + '<b>' + U.mortTitle + '</b><small>' + U.mortSub + '</small></button>' +
        '<button class="tile t-map" data-tab-go="map">' + ic('map') + '<b>' + U.mapTitle + '</b><small>' + U.mapSub + '</small></button>' +
      '</div>' +
      '<button class="card stat-card" data-go="stats"><div class="sc-h"><span>' + U.statsTitle + '</span><small>' + fmt(U.statsDate, { d: DT.statsDate }) + '</small></div>' +
        '<p class="sc-d">' + DT.districts[st.d] + '</p><div class="sc-row">' + st.rooms.map(function (p, i) { return '<div><small>' + (i + 1) + U.rShort + '</small><b class="num">' + grp(p) + ' $</b></div>'; }).join('') + '</div>' +
        '<span class="sc-more">' + U.statsMore + ic('chev') + '</span></button>' +
      '<div class="sec"><h3>' + U.devs + '</h3></div>' +
      '<div class="devs">' + DT.devs.map(function (x) { return '<button class="dev" data-go="catalog:dev=' + esc(x[0]) + '"><span class="dev-l">' + esc(x[0].charAt(0)) + '</span><b>' + esc(x[0]) + '</b><small>' + fmt(U.offers, { n: x[1] }) + '</small>' + ic('check', 'ok') + '</button>'; }).join('') + '</div>' +
      '<p class="foot-note">' + U.demoNote + '</p>'
  };
};

/* Каталог: поиск, фильтры в листе, сортировка. Состояние фильтра — в самом экране. */
var F = { q: '', rooms: 0, cls: '', ready: false, plan: false, max: 0, sort: 'pop', dev: '' };
function applyQuick(q) {
  F = { q: '', rooms: 0, cls: '', ready: false, plan: false, max: 0, sort: 'pop', dev: '' };
  if (q === 'r1') F.rooms = 1;
  if (q === 'b50') F.max = Math.round(50000 * DT.rate / 1e6);
  if (q === 'plan') F.plan = true;
  if (q === 'ready') F.ready = true;
  if (q === 'premium') F.cls = 'premium';
}
function matches(z) {
  if (F.q) { var s = (z.name + ' ' + z.dev + ' ' + z.addr + ' ' + (z.district ? DT.districts[z.district] : '')).toLowerCase(); if (s.indexOf(F.q.toLowerCase()) < 0) return false; }
  if (F.dev && z.dev !== F.dev) return false;
  if (F.cls && z.cls !== F.cls) return false;
  if (F.ready && !z.done) return false;
  if (F.plan && z.tags.indexOf('plan') < 0) return false;
  if (F.rooms && !z.rooms.some(function (r) { return r[0] === F.rooms || (F.rooms === 3 && r[0] >= 3); })) return false;
  if (F.max) { var m = minPrice(z); if (m == null || m > F.max) return false; }
  return true;
}
function filtered() {
  var list = DT.zk.filter(matches);
  if (F.sort === 'cheap') list.sort(function (a, b) { return (minPrice(a) || 1e9) - (minPrice(b) || 1e9); });
  if (F.sort === 'soon') list.sort(function (a, b) { return a.dueY - b.dueY; });
  return list;
}
function nFilters() { return (F.rooms ? 1 : 0) + (F.cls ? 1 : 0) + (F.ready ? 1 : 0) + (F.plan ? 1 : 0) + (F.max ? 1 : 0) + (F.dev ? 1 : 0); }
V.catalog = function (arg) {
  if (arg && arg.indexOf('dev=') === 0) { applyQuick(''); F.dev = arg.slice(4); }
  var list = filtered(), nf = nFilters();
  return {
    html: nav(U.catalog, { back: stacks[cur].length > 0 && cur !== 'catalog', right: '<button class="nb-b" data-act="sort" aria-label="' + U.sort + '">' + ic('sort') + '</button>' }) +
      '<h1 class="lt">' + U.catalog + '</h1>' +
      '<div class="find"><label class="search in">' + ic('search') + '<input type="search" id="q" value="' + esc(F.q) + '" placeholder="' + U.searchPh2 + '" enterkeyhint="search" autocomplete="off"></label>' +
      '<button class="fbtn' + (nf ? ' on' : '') + '" data-act="filters" aria-label="' + U.filters + '">' + ic('filter') + (nf ? '<i class="num">' + nf + '</i>' : '') + '</button></div>' +
      (F.dev ? '<div class="qchips"><button class="qc on" data-act="undev">' + esc(F.dev) + ' ' + ic('x') + '</button></div>' : '') +
      '<p class="count" id="cnt">' + fmt(U.found, { n: list.length, w: plural(list.length, U.zkWords) }) + '</p>' +
      '<div class="list" id="list">' + (list.length ? list.map(function (z) { return zkCard(z, true) + ''; }).join('') : empty(U.nothing, U.nothingSub, '<button class="btn sec-btn" data-act="reset">' + U.reset + '</button>')) + '</div>',
    after: function (v) {
      var q = $('#q', v);
      q.addEventListener('input', function () {
        F.q = q.value.trim();
        var l = filtered();
        $('#list', v).innerHTML = l.length ? l.map(function (z) { return zkCard(z, true); }).join('') : empty(U.nothing, U.nothingSub, '<button class="btn sec-btn" data-act="reset">' + U.reset + '</button>');
        $('#cnt', v).textContent = fmt(U.found, { n: l.length, w: plural(l.length, U.zkWords) });
      });
      if (arg === 'q') setTimeout(function () { q.focus(); }, 380);
      if (arg) v._arg = 'seen';
    }
  };
};
function empty(t, s, extra) { return '<div class="empty"><svg class="em-i" aria-hidden="true"><use href="#dt-mark"/></svg><b>' + t + '</b><p>' + s + '</p>' + (extra || '') + '</div>'; }

/* Карточка ЖК: галерея с параллаксом, квартиры, ипотека, район, запись на показ. */
V.zk = function (id) {
  var z = byId(id);
  var st = null; DT.stats.forEach(function (s) { if (s.d === z.district) st = s; });
  var m = minPrice(z);
  var shots = []; for (var i = 0; i < z.shots; i++) shots.push(i);
  return {
    noTabs: true,
    html: nav(z.name, { back: true, right: favBtn(z.id, 'nb-b') }) +
      '<div class="zk-top"><div class="zk-hero"><div class="gal" id="gal">' + shots.map(function (i) { return '<img src="' + photo(z, i, true) + '" srcset="' + photo(z, i, true) + ' 640w, ' + photo(z, i) + ' 1080w" sizes="(max-width: 500px) 100vw, 430px" alt="' + esc(z.name) + '" ' + (i ? 'loading="lazy" ' : '') + 'decoding="async" data-act="zoom" data-i="' + i + '">'; }).join('') + '</div></div>' +
      (shots.length > 1 ? '<div class="dots" id="dots">' + shots.map(function (i) { return '<i' + (i ? '' : ' class="on"') + '></i>'; }).join('') + '</div>' : '') +
      '<div class="zk-fl"><button class="glass-b" data-back aria-label="' + U.back + '">' + ic('back') + '</button><span></span><button class="glass-b" data-act="share" aria-label="' + U.share + '">' + ic('share') + '</button>' + favBtn(z.id, 'glass-b') + '</div></div>' +
      '<div class="zk-body">' +
        '<div class="zk-chips">' + clsChip(z) + chip(esc(z.due), z.done ? 'c-ok' : '') + (z.tags.indexOf('plan') >= 0 ? chip(U.plan, 'c-plan') : '') + (z.tags.indexOf('mortgage') >= 0 ? chip(U.mortChip, 'c-plan') : '') + (z.tags.indexOf('promo') >= 0 ? chip(U.promoChip, 'c-hot') : '') + '</div>' +
        '<h1 class="zk-name">' + esc(z.name) + '</h1>' +
        '<p class="zk-dev">' + ic('build') + '<span>' + U.devBy + ' <b>' + esc(z.dev) + '</b></span></p>' +
        '<p class="zk-addr">' + ic('pin') + '<span>' + esc(z.addr) + '</span></p>' +
        '<div class="zk-price"><small>' + U.priceFrom + '</small><b class="num">' + priceLine(z) + '</b><div class="cur" role="group"><button data-act="cur" data-c="uzs" class="' + (S.cur === 'uzs' ? 'on' : '') + '">' + U.som + '</button><button data-act="cur" data-c="usd" class="' + (S.cur === 'usd' ? 'on' : '') + '">USD</button></div></div>' +
        (z.rooms.length ? '<div class="sec"><h3>' + U.flats + '</h3><small class="mute">' + U.tapPlan + '</small></div><div class="card flats">' + z.rooms.map(function (r) {
          return '<button class="flat" data-act="plan" data-z="' + z.id + '" data-r="' + r[0] + '" data-a="' + r[1] + '" data-p="' + r[2] + '"><span class="fl-i">' + planIcon(r[0]) + '</span><span class="fl-t"><b>' + fmt(U.roomsN, { n: r[0] }) + '</b><small>' + from(dec(r[1]) + ' ' + U.m2) + '</small></span><span class="fl-p num">' + from(money(r[2])) + '</span>' + ic('chev', 'mute') + '</button>';
        }).join('') + '</div>' : '<div class="card note">' + U.noRooms + '</div>') +
        (m != null ? '<button class="card mini-mort" data-go="mortgage:' + z.id + '"><span>' + ic('calc') + '</span><span><small>' + U.mortFrom + '</small><b class="num">' + fmt(U.perMonth, { s: money(pay(m, 30, 10, DT.rateDefault)) }) + '</b><small class="mute">' + fmt(U.mortHint, { r: dec(DT.rateDefault) }) + '</small></span>' + ic('chev', 'mute') + '</button>' : '') +
        (st ? '<div class="sec"><h3>' + U.inDistrict + '</h3></div><div class="card dist"><p>' + fmt(U.distLine, { d: DT.districts[st.d], c: DT.cls[z.cls].toLowerCase() }) + '</p><div class="bars">' +
          ['comfort', 'business', 'premium', 'resale'].map(function (k) { var mx = Math.max(st.m2.comfort, st.m2.business, st.m2.premium, st.m2.resale); return '<div class="bar' + (k === z.cls ? ' me' : '') + '"><small>' + (k === 'resale' ? U.resale : DT.cls[k]) + '</small><span><i style="--x:scaleX(' + (st.m2[k] / mx).toFixed(3) + ')"></i></span><b class="num">' + grp(st.m2[k]) + ' $</b></div>'; }).join('') +
          '</div><p class="src">' + fmt(U.statsSrc, { d: DT.statsDate }) + '</p></div>' : '') +
        '<div class="sec"><h3>' + U.onMap + '</h3></div><button class="card mapmini" data-act="tomap" data-z="' + z.id + '">' + mapSvg([z], z.id, true) + '<span class="mm-a">' + ic('pin') + esc(z.addr) + '</span></button>' +
        '<div class="sec"><h3>' + U.howBuy + '</h3></div><div class="card steps">' + U.buySteps.map(function (s, i) { return '<div class="step"><i class="num">' + (i + 1) + '</i><div><b>' + s[0] + '</b><small>' + s[1] + '</small></div></div>'; }).join('') + '</div>' +
      '</div>' +
      '<div class="cta"><button class="btn call" data-act="call" aria-label="' + U.call + '">' + ic('phone') + '</button><button class="btn pri" data-go="book:' + z.id + '">' + ic('cal') + '<span>' + U.bookView + '</span></button></div>',
    after: function (v) {
      var g = $('#gal', v), dots = $$('#dots i', v);
      if (g && dots.length) g.addEventListener('scroll', function () { var i = Math.round(g.scrollLeft / g.clientWidth); dots.forEach(function (x, k) { x.classList.toggle('on', k === i); }); }, { passive: true });
      requestAnimationFrame(function () { $$('.bar i', v).forEach(function (b) { b.classList.add('go'); }); });
    }
  };
};
/* Платёж по аннуитету: цена в млн сум, взнос %, срок лет, ставка % годовых. */
function pay(mln, downPct, years, rate) {
  var P = mln * (1 - downPct / 100), r = rate / 1200, n = years * 12;
  return r ? P * r / (1 - Math.pow(1 + r, -n)) : P / n;
}
function planIcon(n) {
  var cells = n >= 4 ? 4 : n;
  var out = '<svg viewBox="0 0 28 28" aria-hidden="true"><rect x="2" y="2" width="24" height="24" rx="3" fill="none" stroke="currentColor" stroke-width="1.6"/>';
  if (cells >= 2) out += '<path d="M14 2v14" stroke="currentColor" stroke-width="1.6"/>';
  if (cells >= 3) out += '<path d="M2 16h24" stroke="currentColor" stroke-width="1.6"/>';
  if (cells >= 4) out += '<path d="M14 16v10" stroke="currentColor" stroke-width="1.6"/>';
  return out + '</svg>';
}
/* Схема планировки кодом: настоящих планировок застройщика в макете нет, лист
   показывает, как они будут выглядеть: комнаты, кухня, санузел, прихожая. */
function planSvg(n, area) {
  var W = 320, H = 220, w = 6, rooms = [];
  var lab = function (x, y, ww, hh, t, s) { rooms.push('<g><rect x="' + x + '" y="' + y + '" width="' + ww + '" height="' + hh + '" class="pr' + (s ? ' ' + s : '') + '"/><text x="' + (x + ww / 2) + '" y="' + (y + hh / 2 + 4) + '" text-anchor="middle">' + t + '</text></g>'); };
  var k = Math.min(n, 4), colW = (W - 110) / k;
  for (var i = 0; i < k; i++) lab(110 + i * colW, 0, colW, 130, U.pRoom + ' ' + (i + 1), 'r');
  lab(0, 0, 110, 130, U.pKitchen, 'k');
  lab(0, 130, 90, 90, U.pBath, 'b');
  lab(90, 130, W - 90 - (n > 1 ? 90 : 0), 90, U.pHall, 'h');
  if (n > 1) lab(W - 90, 130, 90, 90, U.pBalcony, 'g');
  return '<svg class="plan" viewBox="-' + w + ' -' + w + ' ' + (W + 2 * w) + ' ' + (H + 2 * w) + '" role="img" aria-label="' + fmt(U.roomsN, { n: n }) + ', ' + dec(area) + ' ' + U.m2 + '">' + rooms.join('') + '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="none" stroke="currentColor" stroke-width="' + w + '" rx="2"/></svg>';
}

/* Карта: схема Ташкента кодом — кольцевая, Анхор, линии метро и ЖК по адресам. */
function mapSvg(list, focus, mini) {
  var pins = list.map(function (z) {
    var m = minPrice(z), lab = m != null ? money(m) : z.name;
    return '<g class="pin' + (z.id === focus ? ' f' : '') + ' c-' + z.cls + '" data-act="pin" data-z="' + z.id + '" transform="translate(' + (z.x * 4) + ' ' + (z.y * 4) + ')" tabindex="0" role="button" aria-label="' + esc(z.name) + '">' +
      (mini ? '<circle r="10" class="pd"/><circle r="22" class="pr2"/>' : '<rect x="' + (-lab.length * 3.6 - 12) + '" y="-34" width="' + (lab.length * 7.2 + 24) + '" height="26" rx="13" class="pb"/><text y="-17" text-anchor="middle">' + esc(lab) + '</text><circle r="5" class="pd"/>') + '</g>';
  }).join('');
  var vb = mini && focus ? (function () { var z = byId(focus); return (z.x * 4 - 110) + ' ' + (z.y * 4 - 60) + ' 220 120'; })() : '0 0 400 400';
  return '<svg class="map' + (mini ? ' mini' : '') + '" viewBox="' + vb + '" aria-hidden="' + (mini ? 'true' : 'false') + '"><rect x="-200" y="-200" width="800" height="800" class="m-bg"/>' +
    '<path class="m-blk" d="M40 60h70v50H40zM130 50h80v40h-80zM230 60h60v60h-60zM300 140h60v50h-60zM60 140h60v60H60zM140 120h70v60h-70zM150 220h60v50h-60zM230 210h70v60h-70zM70 230h60v60H70zM110 310h70v40h-70zM210 300h60v50h-60zM300 230h50v60h-50z"/>' +
    '<ellipse cx="200" cy="200" rx="185" ry="178" class="m-ring"/><ellipse cx="205" cy="190" rx="110" ry="100" class="m-ring2"/>' +
    '<path class="m-water" d="M150 0C160 60 120 110 160 170S150 260 200 320 230 380 240 400"/><path class="m-water t" d="M330 20C300 90 320 140 290 200S310 300 280 400"/>' +
    '<path class="m-metro r" d="M120 330 160 260 190 210 215 175"/><path class="m-metro b" d="M60 150 140 165 215 175 290 190 350 230"/><path class="m-metro g" d="M215 175 210 120 205 60 200 30"/><path class="m-metro y" d="M300 300 330 230 320 140 260 90"/>' +
    '<circle cx="215" cy="175" r="6" class="m-hub"/>' + pins + '</svg>';
}

V.map = function () {
  return {
    html: '<div class="mapwrap" id="mw"><div class="mapin" id="mi">' + mapSvg(DT.zk.filter(function (z) { return !MF || z.cls === MF; }), null, false) + '</div></div>' +
      '<div class="map-top"><h1 class="glass-t">' + U.mapTitle + '</h1><div class="qchips m">' + ['', 'comfort', 'business', 'premium'].map(function (k) { return '<button class="qc' + (MF === k ? ' on' : '') + '" data-act="mf" data-k="' + k + '">' + (k ? DT.cls[k] : U.allCls) + '</button>'; }).join('') + '</div></div>' +
      '<div class="map-z"><button class="glass-b" data-act="zin" aria-label="' + U.zoomIn + '">' + ic('plus') + '</button><button class="glass-b" data-act="zout" aria-label="' + U.zoomOut + '">' + ic('minus') + '</button></div>',
    after: function (v) { v.classList.add('v-full'); panMap(v); }
  };
};
var MF = '', MZ = 1.25, MX = 0, MY = 0;
function panMap(v) {
  var w = $('#mw', v), m = $('#mi', v), sx = 0, sy = 0, ox = 0, oy = 0, on = false, moved = false;
  function put(anim) { m.style.transition = anim ? 'transform .3s cubic-bezier(.2,.85,.25,1)' : 'none'; m.style.transform = 'translate3d(' + MX + 'px,' + MY + 'px,0) scale(' + MZ + ')'; }
  put(false);
  w.addEventListener('pointerdown', function (e) { on = true; moved = false; sx = e.clientX; sy = e.clientY; ox = MX; oy = MY; });
  w.addEventListener('pointermove', function (e) { if (!on) return; var dx = e.clientX - sx, dy = e.clientY - sy; if (Math.abs(dx) + Math.abs(dy) > 4) { moved = true; try { w.setPointerCapture(e.pointerId); } catch (x) {} } var lim = 160 * MZ; MX = Math.max(-lim, Math.min(lim, ox + dx)); MY = Math.max(-lim, Math.min(lim, oy + dy)); put(false); });
  w.addEventListener('pointerup', function () { on = false; });
  w.addEventListener('pointercancel', function () { on = false; });
  w.addEventListener('click', function (e) { if (moved) { e.stopPropagation(); e.preventDefault(); } }, true);
  v._zoom = function (k) { MZ = Math.max(.9, Math.min(2.4, MZ * k)); put(true); buzz(4); };
}

V.fav = function () {
  var list = S.fav.map(byId).filter(Boolean);
  return {
    html: nav(U.favTitle, { right: list.length > 1 ? '<button class="nb-t" data-go="compare">' + U.compare + '</button>' : '<span class="nb-g"></span>' }) +
      '<h1 class="lt">' + U.favTitle + '</h1>' +
      (list.length ? (list.length > 1 ? '<button class="card cmp-hint" data-go="compare">' + ic('cmp') + '<span><b>' + U.compareTitle + '</b><small>' + fmt(U.compareSub, { n: list.length }) + '</small></span>' + ic('chev', 'mute') + '</button>' : '') +
        '<div class="list">' + list.map(function (z) { return zkCard(z, true); }).join('') + '</div>'
        : empty(U.favEmpty, U.favEmptySub, '<button class="btn pri" data-tab-go="catalog">' + U.toCatalog + '</button>'))
  };
};
V.compare = function () {
  var list = S.fav.map(byId).filter(Boolean).slice(0, 3);
  var row = function (t, f) { return '<tr><th>' + t + '</th>' + list.map(function (z) { return '<td>' + f(z) + '</td>'; }).join('') + '</tr>'; };
  return {
    noTabs: true,
    html: nav(U.compareTitle, { back: true }) +
      '<div class="cmp"><table><thead><tr><th></th>' + list.map(function (z) { return '<td><img src="' + photo(z, 0, true) + '" alt=""><b>' + esc(z.name) + '</b></td>'; }).join('') + '</tr></thead><tbody>' +
      row(U.cClass, function (z) { return DT.cls[z.cls]; }) +
      row(U.cDue, function (z) { return esc(z.due); }) +
      row(U.cPrice, function (z) { return '<span class="num">' + priceLine(z) + '</span>'; }) +
      row(U.cRooms, function (z) { return z.rooms.length ? z.rooms.map(function (r) { return r[0]; }).join(', ') : '·'; }) +
      row(U.cPlan, function (z) { return z.tags.indexOf('plan') >= 0 ? ic('check', 'ok') : '·'; }) +
      row(U.cDev, function (z) { return esc(z.dev); }) +
      '</tbody></table></div>' +
      '<div class="pad"><button class="btn pri wide" data-go="podbor">' + U.askExpert + '</button></div>'
  };
};

/* Запись на показ: формат, день, время, контакты — и экран «готово». */
function days() {
  var out = [], dt = new Date(); dt.setHours(0, 0, 0, 0);
  for (var i = 1; out.length < 7; i++) { var x = new Date(dt); x.setDate(dt.getDate() + i); if (x.getDay() !== 0) out.push(x); }
  return out;
}
var B = {};
V.book = function (id) {
  var z = byId(id), ds = days();
  B = { z: id, fmt: 'office', day: 0, time: '', name: S.name || '', phone: S.phone || '' };
  var slots = ['10:00', '11:30', '13:00', '14:30', '16:00', '17:30'];
  return {
    noTabs: true,
    html: nav(U.bookTitle, { back: true }) +
      '<div class="bk-z card"><img src="' + photo(z, 0, true) + '" alt=""><div><b>' + esc(z.name) + '</b><small>' + esc(z.addr) + '</small></div></div>' +
      '<h3 class="lab">' + U.bkFormat + '</h3><div class="seg" role="radiogroup"><button class="on" data-act="bfmt" data-v="office" role="radio" aria-checked="true">' + ic('build') + U.bkOffice + '</button><button data-act="bfmt" data-v="video" role="radio" aria-checked="false">' + ic('video') + U.bkVideo + '</button></div>' +
      '<h3 class="lab">' + U.bkDay + '</h3><div class="days">' + ds.map(function (x, i) { return '<button class="day' + (i ? '' : ' on') + '" data-act="bday" data-i="' + i + '"><small>' + DT.wd[x.getDay()] + '</small><b class="num">' + x.getDate() + '</b><small>' + DT.mon[x.getMonth()] + '</small></button>'; }).join('') + '</div>' +
      '<h3 class="lab">' + U.bkTime + '</h3><div class="slots">' + slots.map(function (s) { return '<button class="slot num" data-act="btime" data-v="' + s + '">' + s + '</button>'; }).join('') + '</div>' +
      '<h3 class="lab">' + U.bkYou + '</h3><div class="card form">' +
        '<label class="fld"><span>' + U.fName + '</span><input id="bn" value="' + esc(B.name) + '" autocomplete="name" placeholder="' + U.fNamePh + '"></label>' +
        '<label class="fld"><span>' + U.fPhone + '</span><input id="bp" value="' + esc(B.phone || '+998 ') + '" inputmode="tel" autocomplete="tel" placeholder="+998 90 123 45 67"></label>' +
      '</div><p class="hint" id="bh">' + U.bkHint + '</p>' +
      '<div class="cta"><button class="btn pri wide" id="bgo" data-act="bsend" disabled>' + U.bkSend + '</button></div>',
    after: function (v) {
      v._days = ds;
      var check = function () {
        B.name = $('#bn', v).value.trim(); B.phone = $('#bp', v).value;
        var ok = B.time && B.name.length > 1 && digits(B.phone).length === 12;
        $('#bgo', v).disabled = !ok;
        $('#bh', v).textContent = !B.time ? U.bkNeedTime : B.name.length < 2 ? U.bkNeedName : digits(B.phone).length !== 12 ? U.bkNeedPhone : U.bkReady;
      };
      phoneMask($('#bp', v), check);
      $('#bn', v).addEventListener('input', check);
      v._check = check;
    }
  };
};
function digits(s) { return String(s).replace(/\D/g, ''); }
/* Маска +998 XX XXX XX XX: цифры не теряются, курсор в конце. */
function phoneMask(inp, cb) {
  var f = function () {
    var x = digits(inp.value); if (x.indexOf('998') !== 0) x = '998' + x.replace(/^998?/, '');
    x = x.slice(0, 12);
    var p = [x.slice(0, 3), x.slice(3, 5), x.slice(5, 8), x.slice(8, 10), x.slice(10, 12)].filter(Boolean);
    inp.value = '+' + p.join(' ');
    if (cb) cb();
  };
  inp.addEventListener('input', f); inp.addEventListener('focus', function () { if (!digits(inp.value)) inp.value = '+998 '; });
}

V.done = function (k) {
  var r = S.reqs[+k] || S.reqs[S.reqs.length - 1], z = r && byId(r.z);
  return {
    noTabs: true,
    html: '<div class="done"><div class="ok-ring"><svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="36" class="okc"/><path d="m24 41 11 11 22-24" class="okp"/></svg></div>' +
      '<h1>' + (r && r.kind === 'view' ? U.doneView : U.doneLead) + '</h1><p class="mute">' + U.doneSub + '</p>' +
      (r ? '<div class="card sum">' + (z ? '<div class="sm-z"><img src="' + photo(z, 0, true) + '" alt=""><b>' + esc(z.name) + '</b></div>' : '') +
        (r.when ? '<p><span>' + U.when + '</span><b>' + esc(r.when) + '</b></p>' : '') + (r.what ? '<p><span>' + U.what + '</span><b>' + esc(r.what) + '</b></p>' : '') +
        '<p><span>' + U.fName + '</span><b>' + esc(r.name) + '</b></p><p><span>' + U.fPhone + '</span><b class="num">' + esc(r.phone) + '</b></p></div>' : '') +
      '<div class="done-b">' + (r && r.ics ? '<button class="btn sec-btn wide" data-act="ics">' + ic('cal') + U.toCal + '</button>' : '') +
      '<a class="btn tg wide" href="' + DT.tg + '" target="_blank" rel="noopener" data-act="tgsend">' + ic('tg') + U.toTg + '</a>' +
      '<button class="btn ghost wide" data-act="home">' + U.toHome + '</button></div>' +
      '<p class="foot-note">' + U.doneNote + '</p></div>',
    after: function () { buzz([10, 60, 20]); }
  };
};

/* Бесплатный подбор — их главная услуга: четыре шага и контакты. */
var P = {};
V.podbor = function () {
  P = { step: 0, goal: '', ds: [], rooms: 0, budget: 80000, pay: '', name: S.name || '', phone: S.phone || '' };
  return { noTabs: true, html: nav(U.podborTitle, { back: true }) + '<div class="wz" id="wz"></div>', after: function (v) { wizard(v); } };
};
function wizard(v) {
  var box = $('#wz', v), n = 5;
  var head = '<div class="wz-p"><i style="transform:scaleX(' + ((P.step + 1) / n).toFixed(3) + ')"></i></div><p class="wz-s">' + fmt(U.stepOf, { a: P.step + 1, b: n }) + '</p>';
  var body = '';
  if (P.step === 0) body = '<h2>' + U.w1 + '</h2><div class="opts">' + U.goals.map(function (g, i) { return '<button class="opt' + (P.goal === g[0] ? ' on' : '') + '" data-act="wset" data-k="goal" data-v="' + esc(g[0]) + '"><span class="o-i">' + ic(['home', 'key', 'chart'][i]) + '</span><span><b>' + g[0] + '</b><small>' + g[1] + '</small></span></button>'; }).join('') + '</div>';
  if (P.step === 1) body = '<h2>' + U.w2 + '</h2><p class="mute">' + U.w2s + '</p><div class="chips-m">' + Object.keys(DT.districts).map(function (k) { return '<button class="qc' + (P.ds.indexOf(k) >= 0 ? ' on' : '') + '" data-act="wds" data-v="' + k + '">' + DT.districts[k] + '</button>'; }).join('') + '</div>';
  if (P.step === 2) body = '<h2>' + U.w3 + '</h2><div class="rooms">' + [1, 2, 3, 4].map(function (r) { return '<button class="room' + (P.rooms === r ? ' on' : '') + '" data-act="wset" data-k="rooms" data-v="' + r + '">' + planIcon(r) + '<b>' + (r === 4 ? '4+' : r) + '</b><small>' + plural(r, U.roomWords) + '</small></button>'; }).join('') + '</div>';
  if (P.step === 3) body = '<h2>' + U.w4 + '</h2><div class="card bud"><b class="num" id="bv">' + grp(P.budget) + ' $</b><small class="mute" id="bs">' + fmt(U.inSom, { s: grp(P.budget * DT.rate / 1e6) }) + '</small><input type="range" id="br" min="30000" max="300000" step="5000" value="' + P.budget + '" aria-label="' + U.w4 + '"><div class="rng"><span>30 000 $</span><span>300 000 $</span></div></div>' +
    '<h3 class="lab">' + U.w4b + '</h3><div class="seg">' + U.pays.map(function (p) { return '<button class="' + (P.pay === p ? 'on' : '') + '" data-act="wset" data-k="pay" data-v="' + esc(p) + '">' + p + '</button>'; }).join('') + '</div>' +
    '<p class="hint" id="wmatch"></p>';
  if (P.step === 4) {
    var m = podborMatch();
    body = '<h2>' + fmt(U.w5, { n: m.length, w: plural(m.length, U.zkWords) }) + '</h2><p class="mute">' + U.w5s + '</p><div class="rail sm">' + m.map(function (z) { return zkCard(z); }).join('') + '</div>' +
      '<div class="card form"><label class="fld"><span>' + U.fName + '</span><input id="wn" value="' + esc(P.name) + '" autocomplete="name" placeholder="' + U.fNamePh + '"></label><label class="fld"><span>' + U.fPhone + '</span><input id="wp" value="' + esc(P.phone || '+998 ') + '" inputmode="tel" autocomplete="tel"></label></div>';
  }
  var can = [P.goal, P.ds.length || true, P.rooms, P.pay, true][P.step];
  box.innerHTML = head + '<div class="wz-b' + (REDUCED ? '' : ' in') + '">' + body + '</div><div class="cta">' + (P.step ? '<button class="btn ghost" data-act="wback">' + U.back + '</button>' : '') +
    '<button class="btn pri wide" id="wnext" data-act="wnext"' + (can ? '' : ' disabled') + '>' + (P.step === 4 ? U.getList : U.next) + '</button></div>';
  if (P.step === 3) {
    var r = $('#br', box), show = function () { P.budget = +r.value; $('#bv', box).textContent = grp(P.budget) + ' $'; $('#bs', box).textContent = fmt(U.inSom, { s: grp(P.budget * DT.rate / 1e6) }); var k = podborMatch().length; $('#wmatch', box).textContent = fmt(U.matchNow, { n: k, w: plural(k, U.zkWords) }); };
    r.addEventListener('input', show); show();
  }
  if (P.step === 4) {
    var chk = function () { P.name = $('#wn', box).value.trim(); P.phone = $('#wp', box).value; $('#wnext', box).disabled = !(P.name.length > 1 && digits(P.phone).length === 12); };
    phoneMask($('#wp', box), chk); $('#wn', box).addEventListener('input', chk); chk();
  }
  v.scrollTop = 0;
}
function podborMatch() {
  var max = P.budget * DT.rate / 1e6;
  var l = DT.zk.filter(function (z) {
    if (P.ds.length && P.ds.indexOf(z.district) < 0) return false;
    var ok = z.rooms.filter(function (r) { return (!P.rooms || r[0] === P.rooms || (P.rooms === 4 && r[0] >= 4)) && r[2] <= max; });
    return ok.length > 0;
  });
  return l;
}

/* Ипотека: цена, взнос, срок, ставка — платёж и переплата, кольцом. */
var M = {};
V.mortgage = function (id) {
  var z = id ? byId(id) : null, m = z ? minPrice(z) : 700;
  M = { z: id || '', price: m, down: 30, years: 10, rate: DT.rateDefault };
  return {
    noTabs: true,
    html: nav(U.mortTitle, { back: true }) +
      (z ? '<div class="bk-z card"><img src="' + photo(z, 0, true) + '" alt=""><div><b>' + esc(z.name) + '</b><small>' + from(money(m)) + '</small></div></div>' : '') +
      '<div class="card mres"><div class="donut"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="48" class="d-bg"/><circle cx="60" cy="60" r="48" class="d-a" id="da" pathLength="100"/></svg><div><small>' + U.monthly + '</small><b class="num" id="mp"></b></div></div>' +
        '<div class="mleg"><p><i class="l1"></i><span>' + U.credit + '</span><b class="num" id="mc"></b></p><p><i class="l2"></i><span>' + U.over + '</span><b class="num" id="mo"></b></p></div></div>' +
      rng('price', U.mPrice, 150, 5000, 10, M.price, function (x) { return money(x); }) +
      rng('down', U.mDown, 10, 90, 5, M.down, function (x) { return x + '% · ' + money(M.price * x / 100); }) +
      rng('years', U.mYears, 1, 20, 1, M.years, function (x) { return x + ' ' + plural(x, U.yearWords); }) +
      rng('rate', U.mRate, 10, 30, .5, M.rate, function (x) { return dec(x) + '%'; }) +
      '<p class="hint">' + U.mNote + '</p>' +
      '<div class="cta"><button class="btn pri wide" data-act="mlead">' + U.mLead + '</button></div>',
    after: function (v) {
      var calc = function () {
        var p = pay(M.price, M.down, M.years, M.rate), cr = M.price * (1 - M.down / 100), all = p * M.years * 12;
        $('#mp', v).textContent = money(p);
        $('#mc', v).textContent = money(cr);
        $('#mo', v).textContent = money(all - cr);
        $('#da', v).style.strokeDasharray = (cr / all * 100).toFixed(2) + ' 100';
        $$('[data-rv]', v).forEach(function (o) { var k = o.getAttribute('data-rv'); o.textContent = RF[k](M[k]); });
      };
      $$('input[type=range]', v).forEach(function (r) { r.addEventListener('input', function () { M[r.name] = +r.value; calc(); fill(r); }); fill(r); });
      calc();
    }
  };
};
var RF = {};
function rng(k, label, min, max, step, val, f) {
  RF[k] = f;
  return '<label class="card rg"><span class="rg-h"><span>' + label + '</span><b class="num" data-rv="' + k + '">' + f(val) + '</b></span><input type="range" name="' + k + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '"></label>';
}
function fill(r) { var k = (r.value - r.min) / (r.max - r.min) * 100; r.style.setProperty('--f', k.toFixed(1) + '%'); }

V.stats = function (k) {
  var i = +(k || 1), st = DT.stats[i];
  var mx = Math.max.apply(null, st.rooms);
  return {
    noTabs: true,
    html: nav(U.statsTitle, { back: true }) +
      '<p class="mute pad-t">' + fmt(U.statsLead, { d: DT.statsDate }) + '</p>' +
      '<div class="qchips wrap">' + DT.stats.map(function (s, j) { return '<button class="qc' + (j === i ? ' on' : '') + '" data-act="stat" data-i="' + j + '">' + DT.districts[s.d] + '</button>'; }).join('') + '</div>' +
      '<div class="card"><h3 class="ch">' + U.avgFlat + '</h3><div class="cols">' + st.rooms.map(function (p, j) { return '<div class="col"><b class="num">' + grp(p / 1000) + 'k $</b><span><i style="transform:scaleY(' + (p / mx).toFixed(3) + ')"></i></span><small>' + fmt(U.roomsN, { n: j + 1 }) + '</small></div>'; }).join('') + '</div></div>' +
      '<div class="card"><h3 class="ch">' + U.perM2t + '</h3><div class="bars">' + ['comfort', 'business', 'premium', 'resale'].map(function (c) { var m = Math.max(st.m2.comfort, st.m2.business, st.m2.premium, st.m2.resale); return '<div class="bar"><small>' + (c === 'resale' ? U.resale : DT.cls[c]) + '</small><span><i class="go" style="--x:scaleX(' + (st.m2[c] / m).toFixed(3) + ')"></i></span><b class="num">' + grp(st.m2[c]) + ' $</b></div>'; }).join('') + '</div></div>' +
      '<button class="card cmp-hint" data-go="podbor">' + ic('spark') + '<span><b>' + U.podborTitle + '</b><small>' + U.podborSub + '</small></span>' + ic('chev', 'mute') + '</button>' +
      '<p class="src pad">' + U.statsSrcLong + '</p>'
  };
};

V.alerts = function () {
  var t = function (k, a, b) { return '<label class="tg-row"><span><b>' + a + '</b><small>' + b + '</small></span><input type="checkbox" class="sw" data-act="notif" data-k="' + k + '"' + (S.notif[k] ? ' checked' : '') + '></label>'; };
  return {
    noTabs: true,
    html: nav(U.alerts, { back: true }) +
      '<div class="card push-demo"><div class="pd-n"><svg aria-hidden="true"><use href="#dt-mark"/></svg><div><b>DomTut</b><p>' + U.pushDemo + '</p></div><small>' + U.now + '</small></div></div>' +
      '<p class="mute pad-t">' + U.alertsLead + '</p>' +
      '<div class="card list-c">' + t('fresh', U.nFresh, U.nFreshS) + t('drop', U.nDrop, U.nDropS) + t('promo', U.nPromo, U.nPromoS) + '</div>' +
      '<button class="btn sec-btn wide" data-act="pushtest">' + ic('bell') + U.pushTest + '</button>'
  };
};

V.more = function () {
  var line = function (i, t, a, extra) { return '<button class="ln" ' + a + '>' + ic(i) + '<span>' + t + '</span>' + (extra || ic('chev', 'mute')) + '</button>'; };
  return {
    html: nav(U.profile) + '<h1 class="lt">' + U.profile + '</h1>' +
      '<div class="card me">' + (S.authed ? '<span class="av">' + esc((S.name || 'D').charAt(0)) + '</span><div><b>' + esc(S.name || U.guest) + '</b><small class="num">' + esc(S.phone) + '</small></div>' : '<span class="av g">' + ic('user') + '</span><div><b>' + U.guest + '</b><small>' + U.guestSub + '</small></div><button class="btn pri sm" data-act="login">' + U.login + '</button>') + '</div>' +
      '<div class="card list-c">' +
        line('doc', U.myReqs, 'data-go="reqs"', '<span class="cnt num">' + S.reqs.length + '</span>' + ic('chev', 'mute')) +
        line('heart', U.favTitle, 'data-tab-go="fav"') +
        line('bell', U.alerts, 'data-go="alerts"') +
      '</div>' +
      '<div class="card list-c">' +
        '<div class="ln">' + ic('cur') + '<span>' + U.currency + '</span><div class="cur"><button data-act="cur" data-c="uzs" class="' + (S.cur === 'uzs' ? 'on' : '') + '">' + U.som + '</button><button data-act="cur" data-c="usd" class="' + (S.cur === 'usd' ? 'on' : '') + '">USD</button></div></div>' +
        '<div class="ln">' + ic('globe') + '<span>' + U.language + '</span><div class="cur"><a href="' + DT.ruUrl + (EMBED ? '?embed=1' : '') + '" class="' + (L === 'ru' ? 'on' : '') + '">RU</a><a href="' + DT.uzUrl + (EMBED ? '?embed=1' : '') + '" class="' + (L === 'uz' ? 'on' : '') + '">UZ</a></div></div>' +
      '</div>' +
      '<div class="card list-c">' +
        line('plus', U.addAd, 'data-act="addad"') +
        line('phone', U.contacts, 'data-act="contacts"') +
        line('info', U.about, 'data-act="about"') +
      '</div>' +
      '<p class="foot-note">' + U.version + ' · <a href="' + DT.terms + '" target="_blank" rel="noopener">' + U.terms + '</a></p>'
  };
};
V.reqs = function () {
  return {
    noTabs: true,
    html: nav(U.myReqs, { back: true }) + (S.reqs.length ? '<div class="list">' + S.reqs.slice().reverse().map(function (r, i) {
      var z = r.z && byId(r.z);
      return '<div class="card req"><span class="rq-i">' + ic(r.kind === 'view' ? 'cal' : r.kind === 'mort' ? 'calc' : 'spark') + '</span><div><b>' + esc(r.title) + '</b><small>' + esc(r.when || r.what || '') + '</small></div><span class="chip c-ok">' + U.sent + '</span></div>';
    }).join('') + '</div>' : empty(U.noReqs, U.noReqsSub, '<button class="btn pri" data-go="podbor">' + U.podborBtn + '</button>'))
  };
};

/* ── Действия ── */
var ACT = {
  quick: function (t) { applyQuick(t.getAttribute('data-q')); if (stacks.catalog.length) { stacks.catalog.forEach(function (v) { v.remove(); }); stacks.catalog = []; } tab('catalog'); },
  reset: function () { applyQuick(''); refresh(top()); },
  undev: function () { F.dev = ''; refresh(top()); },
  sort: function () {
    openSheet('<h3 class="sh-t">' + U.sort + '</h3>' + [['pop', U.sPop], ['cheap', U.sCheap], ['soon', U.sSoon]].map(function (s) { return '<button class="ln radio' + (F.sort === s[0] ? ' on' : '') + '" data-act="setsort" data-v="' + s[0] + '"><span>' + s[1] + '</span>' + ic('check', 'ok') + '</button>'; }).join(''));
  },
  setsort: function (t) { F.sort = t.getAttribute('data-v'); closeSheet(); refresh(top()); buzz(6); },
  filters: function () {
    var tmp = JSON.parse(JSON.stringify(F));
    var draw = function (sh) {
      var n = DT.zk.filter(function (z) { var keep = F; F = tmp; var r = matches(z); F = keep; return r; }).length;
      sh.innerHTML = '<div class="grab" aria-hidden="true"></div><div class="sh-h"><h3 class="sh-t">' + U.filters + '</h3><button class="nb-t" data-f="clear">' + U.reset + '</button></div>' +
        '<h4 class="lab">' + U.fRooms + '</h4><div class="seg">' + [0, 1, 2, 3].map(function (r) { return '<button class="' + (tmp.rooms === r ? 'on' : '') + '" data-f="rooms" data-v="' + r + '">' + (r ? (r === 3 ? '3+' : r) : U.any) + '</button>'; }).join('') + '</div>' +
        '<h4 class="lab">' + U.fClass + '</h4><div class="seg">' + ['', 'comfort', 'business', 'premium'].map(function (c) { return '<button class="' + (tmp.cls === c ? 'on' : '') + '" data-f="cls" data-v="' + c + '">' + (c ? DT.cls[c] : U.any) + '</button>'; }).join('') + '</div>' +
        '<h4 class="lab">' + U.fBudget + '</h4><div class="seg">' + [0, 30000, 50000, 80000].map(function (b) { var v = b ? Math.round(b * DT.rate / 1e6) : 0; return '<button class="' + (tmp.max === v ? 'on' : '') + '" data-f="max" data-v="' + v + '">' + (b ? upTo(grp(b / 1000) + 'k $') : U.any) + '</button>'; }).join('') + '</div>' +
        '<label class="tg-row"><span><b>' + U.ready + '</b></span><input type="checkbox" class="sw" data-f="ready"' + (tmp.ready ? ' checked' : '') + '></label>' +
        '<label class="tg-row"><span><b>' + U.plan + '</b><small>' + U.planSub + '</small></span><input type="checkbox" class="sw" data-f="plan"' + (tmp.plan ? ' checked' : '') + '></label>' +
        '<button class="btn pri wide" data-f="apply">' + fmt(U.showN, { n: n, w: plural(n, U.zkWords) }) + '</button>';
    };
    openSheet('', function (sh) {
      draw(sh);
      sh.onclick = function (e) {
        var b = e.target.closest('[data-f]'); if (!b) return;
        var k = b.getAttribute('data-f');
        if (k === 'apply') { F = tmp; closeSheet(); refresh(top()); sh.onclick = null; return; }
        if (k === 'clear') { tmp = { q: F.q, rooms: 0, cls: '', ready: false, plan: false, max: 0, sort: F.sort, dev: '' }; }
        else if (k === 'ready' || k === 'plan') tmp[k] = b.checked;
        else tmp[k] = k === 'cls' ? b.getAttribute('data-v') : +b.getAttribute('data-v');
        buzz(4); draw(sh);
      };
    });
  },
  plan: function (t) {
    var z = byId(t.getAttribute('data-z')), r = +t.getAttribute('data-r'), a = +t.getAttribute('data-a'), p = +t.getAttribute('data-p');
    openSheet('<h3 class="sh-t">' + fmt(U.roomsN, { n: r }) + ' · ' + from(dec(a) + ' ' + U.m2) + '</h3><p class="mute">' + esc(z.name) + '</p>' + planSvg(r, a) + '<p class="src">' + U.planNote + '</p>' +
      '<div class="pl-p"><span>' + U.priceFrom + '</span><b class="num">' + money(p) + '</b></div><div class="pl-p"><span>' + U.mortFrom + '</span><b class="num">' + fmt(U.perMonth, { s: money(pay(p, 30, 10, DT.rateDefault)) }) + '</b></div>' +
      '<button class="btn pri wide" data-close data-go="book:' + z.id + '">' + U.bookView + '</button>');
  },
  zoom: function (t) {
    var z = byId(top()._arg), i = +t.getAttribute('data-i');
    openSheet('<div class="zoom"><img src="' + photo(z, i) + '" alt="' + esc(z.name) + '"></div><p class="mute">' + esc(z.name) + ' · ' + (i + 1) + '/' + z.shots + '</p><button class="btn ghost wide" data-close>' + U.close + '</button>');
  },
  share: function () {
    var z = byId(top()._arg), text = z.name + ' · ' + priceLine(z) + ' · domtut.uz';
    if (navigator.share) navigator.share({ title: z.name, text: text }).catch(function () {});
    else { try { navigator.clipboard.writeText(text); } catch (e) {} toast(U.copied); }
  },
  cur: function (t) { S.cur = t.getAttribute('data-c'); save(); buzz(6); refreshAll(); },
  call: function () {
    openSheet('<h3 class="sh-t">' + U.call + '</h3><p class="mute">' + U.callSub + '</p>' + DT.phones.map(function (p) { return '<a class="ln" href="tel:' + p[0] + '">' + ic('phone') + '<span class="num">' + p[1] + '</span>' + ic('chev', 'mute') + '</a>'; }).join('') + '<p class="src">' + esc(DT.hours) + '</p>');
  },
  tomap: function (t) { var id = t.getAttribute('data-z'), z = byId(id); MX = (200 - z.x * 4) * MZ; MY = (200 - z.y * 4) * MZ; tab('map'); setTimeout(function () { pinSheet(id); }, 320); },
  pin: function (t) { pinSheet(t.getAttribute('data-z')); },
  mf: function (t) { MF = t.getAttribute('data-k'); refresh(top()); buzz(4); },
  zin: function () { var v = top(); if (v._zoom) v._zoom(1.25); },
  zout: function () { var v = top(); if (v._zoom) v._zoom(.8); },
  bfmt: function (t) { B.fmt = t.getAttribute('data-v'); $$('[data-act="bfmt"]', top()).forEach(function (b) { var on = b === t; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); }); buzz(4); },
  bday: function (t) { B.day = +t.getAttribute('data-i'); $$('.day', top()).forEach(function (b) { b.classList.toggle('on', b === t); }); buzz(4); },
  btime: function (t) { B.time = t.getAttribute('data-v'); $$('.slot', top()).forEach(function (b) { b.classList.toggle('on', b === t); }); buzz(4); top()._check(); },
  bsend: function () {
    var v = top(), dt = v._days[B.day], z = byId(B.z);
    var when = DT.wd[dt.getDay()] + ', ' + dt.getDate() + ' ' + DT.mon[dt.getMonth()] + ', ' + B.time;
    S.name = B.name; S.phone = B.phone;
    var start = new Date(dt); start.setHours(+B.time.slice(0, 2), +B.time.slice(3), 0, 0);
    S.reqs.push({ kind: 'view', z: B.z, title: U.reqView + ': ' + z.name, when: when + ' · ' + (B.fmt === 'video' ? U.bkVideo : U.bkOffice), name: B.name, phone: B.phone, ics: start.toISOString() });
    save(); finish();
  },
  wset: function (t) { var k = t.getAttribute('data-k'), v = t.getAttribute('data-v'); P[k] = k === 'rooms' ? +v : v; buzz(4); wizard(top()); },
  wds: function (t) { var k = t.getAttribute('data-v'), i = P.ds.indexOf(k); if (i >= 0) P.ds.splice(i, 1); else P.ds.push(k); t.classList.toggle('on', i < 0); buzz(4); },
  wback: function () { P.step--; wizard(top()); },
  wnext: function () {
    if (P.step < 4) { P.step++; wizard(top()); return; }
    S.name = P.name; S.phone = P.phone;
    var what = [P.goal, P.ds.map(function (k) { return DT.districts[k]; }).join(', ') || U.anyDistrict, fmt(U.roomsN, { n: P.rooms }), upTo(grp(P.budget) + ' $'), P.pay].filter(Boolean).join(' · ');
    S.reqs.push({ kind: 'podbor', title: U.reqPodbor, what: what, name: P.name, phone: P.phone });
    save(); finish();
  },
  mlead: function () {
    var z = M.z && byId(M.z);
    openSheet('<h3 class="sh-t">' + U.mLead + '</h3><p class="mute">' + fmt(U.mLeadSub, { p: money(pay(M.price, M.down, M.years, M.rate)) }) + '</p><div class="card form"><label class="fld"><span>' + U.fName + '</span><input id="mn" value="' + esc(S.name) + '" autocomplete="name" placeholder="' + U.fNamePh + '"></label><label class="fld"><span>' + U.fPhone + '</span><input id="mph" value="' + esc(S.phone || '+998 ') + '" inputmode="tel" autocomplete="tel"></label></div><button class="btn pri wide" id="mgo" disabled>' + U.send + '</button>', function (sh) {
      var chk = function () { $('#mgo', sh).disabled = !($('#mn', sh).value.trim().length > 1 && digits($('#mph', sh).value).length === 12); };
      phoneMask($('#mph', sh), chk); $('#mn', sh).addEventListener('input', chk); chk();
      $('#mgo', sh).onclick = function () {
        S.name = $('#mn', sh).value.trim(); S.phone = $('#mph', sh).value;
        S.reqs.push({ kind: 'mort', z: M.z, title: U.reqMort + (z ? ': ' + z.name : ''), what: money(M.price) + ' · ' + M.down + '% · ' + M.years + ' ' + plural(M.years, U.yearWords) + ' · ' + dec(M.rate) + '%', name: S.name, phone: S.phone });
        save(); closeSheet(); finish();
      };
    });
  },
  stat: function (t) { var v = top(); v._arg = t.getAttribute('data-i'); refresh(v); buzz(4); },
  notif: function (t) { S.notif[t.getAttribute('data-k')] = t.checked; save(); buzz(4); toast(t.checked ? U.on : U.off); },
  pushtest: function () {
    var n = $('#push'); n.classList.remove('on'); void n.offsetWidth; n.classList.add('on'); buzz([8, 50, 8]);
    clearTimeout(ACT.pt); ACT.pt = setTimeout(function () { n.classList.remove('on'); }, 3600);
  },
  login: function () {
    openSheet('<h3 class="sh-t">' + U.login + '</h3><p class="mute">' + U.loginSub + '</p><div class="card form"><label class="fld"><span>' + U.fName + '</span><input id="ln" autocomplete="name" placeholder="' + U.fNamePh + '"></label><label class="fld"><span>' + U.fPhone + '</span><input id="lp" value="+998 " inputmode="tel" autocomplete="tel"></label></div><button class="btn pri wide" id="lgo" disabled>' + U.getCode + '</button>', function (sh) {
      var chk = function () { $('#lgo', sh).disabled = !($('#ln', sh).value.trim().length > 1 && digits($('#lp', sh).value).length === 12); };
      phoneMask($('#lp', sh), chk); $('#ln', sh).addEventListener('input', chk);
      $('#lgo', sh).onclick = function () {
        S.name = $('#ln', sh).value.trim(); S.phone = $('#lp', sh).value;
        sh.innerHTML = '<div class="grab"></div><h3 class="sh-t">' + U.codeTitle + '</h3><p class="mute">' + fmt(U.codeSub, { p: esc(S.phone) }) + '</p><div class="otp" id="otp">' + [0, 1, 2, 3].map(function () { return '<input inputmode="numeric" maxlength="1" class="num">'; }).join('') + '</div><p class="src">' + U.codeDemo + '</p>';
        var ins = $$('#otp input', sh); ins[0].focus();
        ins.forEach(function (inp, i) {
          inp.addEventListener('input', function () {
            inp.value = digits(inp.value).slice(-1);
            if (inp.value && ins[i + 1]) ins[i + 1].focus();
            if (ins.every(function (x) { return x.value; })) { S.authed = true; save(); closeSheet(); toast(U.loggedIn); refresh(top()); buzz([8, 40, 8]); }
          });
        });
      };
    });
  },
  addad: function () { openSheet('<h3 class="sh-t">' + U.addAd + '</h3><p>' + U.addAdSub + '</p>' + DT.phones.map(function (p) { return '<a class="ln" href="tel:' + p[0] + '">' + ic('phone') + '<span class="num">' + p[1] + '</span></a>'; }).join('') + '<a class="btn tg wide" href="' + DT.tg + '" target="_blank" rel="noopener">' + ic('tg') + U.writeTg + '</a>'); },
  contacts: function () { openSheet('<h3 class="sh-t">' + U.contacts + '</h3>' + DT.phones.map(function (p) { return '<a class="ln" href="tel:' + p[0] + '">' + ic('phone') + '<span class="num">' + p[1] + '</span></a>'; }).join('') + '<div class="ln">' + ic('clock') + '<span>' + esc(DT.hours) + '</span></div><div class="ln">' + ic('pin') + '<span>' + esc(DT.addr) + '</span></div><div class="soc"><a href="' + DT.ig + '" target="_blank" rel="noopener">Instagram</a><a href="' + DT.yt + '" target="_blank" rel="noopener">YouTube</a><a href="' + DT.site + '" target="_blank" rel="noopener">domtut.uz</a></div>'); },
  about: function () { openSheet('<h3 class="sh-t">DomTut</h3><p>' + U.aboutText + '</p><p class="src">' + U.aboutSrc + '</p><button class="btn ghost wide" data-close>' + U.close + '</button>'); },
  ics: function () {
    var r = S.reqs[S.reqs.length - 1]; if (!r || !r.ics) return;
    var st = new Date(r.ics), en = new Date(st.getTime() + 3600000);
    var f = function (x) { return x.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, ''); };
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//DomTut//RU', 'BEGIN:VEVENT', 'UID:' + Date.now() + '@domtut', 'DTSTART:' + f(st), 'DTEND:' + f(en), 'SUMMARY:' + r.title, 'DESCRIPTION:' + U.icsDesc, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    var a = d.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = 'domtut.ics'; d.body.appendChild(a); a.click(); a.remove();
    toast(U.icsDone);
  },
  tgsend: function (t, e) {
    var r = S.reqs[S.reqs.length - 1]; if (!r) return;
    var text = [U.tgHead, r.title, r.when || r.what || '', U.fName + ': ' + r.name, U.fPhone + ': ' + r.phone].filter(Boolean).join('\n');
    try { navigator.clipboard.writeText(text); } catch (x) {}
    toast(U.tgCopied);
  },
  home: function () { reset(); tab('home'); },
};
function pinSheet(id) {
  var z = byId(id);
  openSheet(zkCard(z, true) + '<button class="btn pri wide" data-close data-go="zk:' + z.id + '">' + U.open + '</button>');
  buzz(6);
}
function finish() {
  /* «Готово» — поверх стека; назад с него — сразу туда, откуда начали. */
  var s = stacks[cur];
  go('done', String(S.reqs.length - 1));
  setTimeout(function () { s.splice(1, s.length - 2).forEach(function (x) { x.remove(); }); }, 450);
}

/* Пуш-уведомление для демо: падает сверху, как настоящее. */
var push = d.createElement('div');
push.id = 'push'; push.className = 'push'; push.setAttribute('role', 'status');
push.innerHTML = '<svg aria-hidden="true"><use href="#dt-mark"/></svg><div><b>DomTut</b><p>' + U.pushDemo + '</p></div><small>' + U.now + '</small>';
push.addEventListener('click', function () { push.classList.remove('on'); tab('catalog'); go('zk', 'dcasa'); });
app.appendChild(push);

/* ── Старт: заставка со знаком, потом главная ── */
TABS.forEach(function (t) { var b = $('[data-tab="' + t + '"]', tabsEl); if (b) b.setAttribute('aria-selected', t === 'home'); });
var first = build('home'); stacks.home.push(first); mount(first);
$('[data-tab="home"]', tabsEl).classList.add('on');
badge();
var splash = $('#splash');
if (REDUCED) splash.remove();
else setTimeout(function () { splash.classList.add('out'); setTimeout(function () { splash.remove(); }, 520); }, S.seen ? 650 : 1500);
S.seen = true; save();

/* Сайт снаружи может попросить открыть нужный экран (кнопки у айфона). */
var JUMP = {
  home: function () { tab('home'); },
  catalog: function () { applyQuick(''); tab('catalog'); },
  zk: function () { tab('catalog'); go('zk', 'center'); },
  book: function () { tab('catalog'); go('zk', 'mirador'); setTimeout(function () { go('book', 'mirador'); }, 420); },
  podbor: function () { tab('home'); go('podbor'); },
  mortgage: function () { tab('home'); go('mortgage', 'mirador'); },
  map: function () { tab('map'); },
  stats: function () { tab('home'); go('stats'); },
  push: function () { tab('more'); go('alerts'); setTimeout(ACT.pushtest, 500); },
  zkid: function (m) { if (!m || !byId(m.id)) return; tab('catalog'); go('zk', m.id); },
  /* Поиск с первого экрана сайта: комнаты, район (как строка поиска) и бюджет в долларах. */
  find: function (m) {
    applyQuick('');
    if (m) { F.rooms = Math.min(+m.rooms || 0, 3); F.max = m.max ? Math.round(m.max * DT.rate / 1e6) : 0; F.q = m.district && DT.districts[m.district] ? DT.districts[m.district] : ''; }
    if (stacks.catalog.length) { stacks.catalog.forEach(function (v) { v.remove(); }); stacks.catalog = []; }
    tab('catalog');
  },
};
window.addEventListener('message', function (e) {
  if (e.origin !== location.origin || !e.data || e.data.dt !== 'jump') return;
  var f = JUMP[e.data.to]; if (!f) return;
  reset(); f(e.data);
});
$$('[data-jump]').forEach(function (b) { b.addEventListener('click', function () { reset(); JUMP[b.getAttribute('data-jump')](); }); });
var m = /[?&]to=(\w+)/.exec(Q); if (m && JUMP[m[1]]) setTimeout(JUMP[m[1]], 60);
})();
