(function () {
'use strict';
/* Приложение турагентства, макет DevUz Studio. Данные (язык, подписи, демо-туры)
   приходят в window.TB от gen.mjs. Навигация как в iOS: у каждой вкладки свой
   стек экранов, вглубь справа, назад кнопкой или свайпом от левого края,
   нижние листы тянутся пальцем. Анимации только transform и opacity.
   Состояние демо (брони, избранное, туристы) живёт в этом браузере.
   Туры, отели, операторы и цены демо: в приложении их отдаёт Турвизор. */
var TB = window.TB, U = TB.ui, L = TB.lang;
var d = document, root = d.documentElement;
var REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
var KEY = 'tb-app-1';
var IMG = TB.img;

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
var DEMO_TRIP = TB.demoTrip;
function freshState() {
  return {
    fav: ['sharm', 'lara'], watch: [{ h: 'lara', p: 0 }], trips: [], tourists: [{ n: 'ALIYEV AZIZ', b: '14.03.1990', p: 'AB1234567', e: '21.08.2031' }, { n: 'ALIYEVA MADINA', b: '02.11.1992', p: 'AC7654321', e: '05.02.2030' }],
    notif: { status: true, docs: true, price: true, hot: false }, authed: false, phone: '', name: '', seen: false, offline: false,
    sr: { dest: '', from: TB.dates.from, to: TB.dates.to, nf: TB.dates.nightsFrom, nt: TB.dates.nightsTo, adults: 2, kids: [], meal: '', stars: 0 },
    feed: [], chat: [], seq: 20431,
  };
}
var S = (function () {
  var s = freshState();
  try { var x = JSON.parse(localStorage.getItem(KEY) || 'null'); if (x) for (var k in x) s[k] = x[k]; } catch (e) {}
  if (!s.trips.length) s.trips.push(demoTrip());
  return s;
})();
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

/* ── Мелочи ── */
function $(s, r) { return (r || d).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function ic(n, c) { return '<svg class="ic' + (c ? ' ' + c : '') + '" aria-hidden="true"><use href="#i-' + n + '"/></svg>'; }
function grp(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
function usd(n) { return grp(n) + ' $'; }
function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms || 8); } catch (e) {} }
function fmt(s, o) { return String(s).replace(/\{(\w+)\}/g, function (_, k) { return o[k] != null ? o[k] : ''; }); }
function digits(s) { return String(s).replace(/\D/g, ''); }
function plural(n, a) { if (L !== 'ru') return a[0]; var x = n % 10, y = n % 100; return x === 1 && y !== 11 ? a[0] : x >= 2 && x <= 4 && (y < 10 || y >= 20) ? a[1] : a[2]; }
function hotel(id) { for (var i = 0; i < TB.hotels.length; i++) if (TB.hotels[i].id === id) return TB.hotels[i]; return null; }
function dest(id) { for (var i = 0; i < TB.dest.length; i++) if (TB.dest[i].id === id) return TB.dest[i]; return null; }
function opOf(id) { for (var i = 0; i < TB.ops.length; i++) if (TB.ops[i].id === id) return TB.ops[i]; return null; }
function opIdx(id) { for (var i = 0; i < TB.ops.length; i++) if (TB.ops[i].id === id) return i; return 0; }
function photo(name, small) { return IMG + '/' + name + (small ? '-s' : '') + '.webp'; }
function stars(n) { return '<span class="stars" aria-label="' + n + '★">' + new Array(n + 1).join('★') + '</span>'; }
function isFav(id) { return S.fav.indexOf(id) >= 0; }
function watched(id) { for (var i = 0; i < S.watch.length; i++) if (S.watch[i].h === id) return S.watch[i]; return null; }

/* Даты: месяц вылетов из данных (демо, ноябрь 2026). */
function day(dn) { return dn + ' ' + TB.mon[TB.dates.month]; }
function dayShort(dn) { var x = new Date(TB.dates.year, TB.dates.month, dn); return TB.wd[x.getDay()] + ', ' + dn + ' ' + TB.mon[TB.dates.month]; }
function back2(dn, n) { var x = new Date(TB.dates.year, TB.dates.month, dn + n); return x.getDate() + ' ' + TB.mon[x.getMonth()]; }
function range(dn, n) { return day(dn) + ' → ' + back2(dn, n); }
function nightsW(n) { return n + ' ' + plural(n, U.nightW); }
function people(a, kids) { var s = a + ' ' + plural(a, U.adultW); if (kids && kids.length) s += ', ' + kids.length + ' ' + plural(kids.length, U.kidW); return s; }

/* ── Цена тура: демо-формула, у настоящего приложения цену отдаёт Турвизор ── */
var MEALS = ['RO', 'BB', 'HB', 'AI', 'UAI'];
function kidK(age) { return age < 2 ? 0.1 : age < 12 ? 0.55 : 0.8; }
function dateK(dn, op) { return 1 + ((((dn * 7) + opIdx(op) * 3) % 9) - 4) / 100; }
function tourPrice(h, op, dn, n, a, kids) {
  var k = a; (kids || []).forEach(function (x) { k += kidK(+x); });
  var p = h.base * n * k * (1 + (h.ops[op] || 0) / 100) * dateK(dn, op) + 180 * Math.min(a, 1);
  return Math.round(p / 10) * 10;
}
/* Предложения отеля в окне дат: у каждого оператора самая дешёвая дата. */
function offers(h, sr, nights) {
  var n = nights || sr.nf, out = [];
  Object.keys(h.ops).forEach(function (op) {
    var best = null;
    for (var dn = sr.from; dn <= sr.to; dn++) {
      var p = tourPrice(h, op, dn, n, sr.adults, sr.kids);
      if (!best || p < best.price) best = { op: op, date: dn, nights: n, price: p };
    }
    out.push(best);
  });
  return out.sort(function (a, b) { return a.price - b.price; });
}
function hotProfile(h) { var o = offers(h, S.sr)[0]; return { o: o, was: Math.round(o.price * 1.18 / 10) * 10 }; }
function matches(h, sr) {
  if (sr.dest && h.dest !== sr.dest) return false;
  if (sr.stars && h.stars < sr.stars) return false;
  if (sr.meal && MEALS.indexOf(h.meal) < MEALS.indexOf(sr.meal)) return false;
  return true;
}
function tourId(o, h) { return h.id + ':' + o.op + ':' + o.date + ':' + o.nights; }
function parseTour(s) { var p = String(s).split(':'); var h = hotel(p[0]); return { h: h, op: p[1], date: +p[2], nights: +p[3], price: tourPrice(h, p[1], +p[2], +p[3], S.sr.adults, S.sr.kids) }; }
function flight(h, op, dn, n) {
  var f = TB.fly[h.dest], o = opOf(op), code = o.air.replace(/[^A-Z]/g, '').slice(0, 2).padEnd(2, 'X');
  var no = 1100 + TB.dest.map(function (x) { return x.id; }).indexOf(h.dest) * 37 + opIdx(op) * 11;
  return { out: { no: code + ' ' + no, d: dn, t: f.out, a: f.code }, back: { no: code + ' ' + (no + 1), d: dn + n, t: f.back, a: f.code }, air: o.air };
}

function demoTrip() {
  var x = DEMO_TRIP, h = hotel(x.hotel);
  return { id: x.deal, deal: x.deal, h: x.hotel, op: x.op, date: x.date, nights: x.nights, adults: x.adults, kids: x.kids, names: x.names, price: tourPrice(h, x.op, x.date, x.nights, x.adults, x.kids), paid: tourPrice(h, x.op, x.date, x.nights, x.adults, x.kids), step: x.step, extras: [], refused: false, demo: true, card: '4417', method: 'payme' };
}
function tripById(id) { for (var i = 0; i < S.trips.length; i++) if (S.trips[i].id === id) return S.trips[i]; return null; }
function tripTotal(t) { var s = t.price; t.extras.forEach(function (k) { s += extraPrice(k, t); }); return s; }
function extraPrice(k, t) { var a = t.adults + t.kids.length; return k === 'ins' ? 9 * a * Math.ceil(t.nights / 7) : k === 'trans' ? 60 : k === 'visa' ? 35 * a : k === 'seat' ? 15 * a : 0; }

/* ── Каркас ── */
var app = $('#app'), views = $('#views'), tabsEl = $('#tabs'), toastEl = $('#toast');
var sheetBg = $('#sheet-bg'), sheet = $('#sheet');
var TABS = ['home', 'hot', 'trips', 'fav', 'more'];
var stacks = {}, cur = 'home';
TABS.forEach(function (t) { stacks[t] = []; });

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.remove('on'); void toastEl.offsetWidth; toastEl.classList.add('on');
  clearTimeout(toast.t); toast.t = setTimeout(function () { toastEl.classList.remove('on'); }, 2400);
}

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
function mount(v) { views.appendChild(v); if (v._after) v._after(v); bindCommon(v); }
function top() { var s = stacks[cur]; return s ? s[s.length-1] : null; }
function reset() { closeSheet(); TABS.forEach(function (t) { while (stacks[t].length > 1) stacks[t].pop().remove(); if (stacks[t][0]) stacks[t][0].hidden = true; }); cur = null; }
function showTabs(v) { tabsEl.classList.toggle('hide', !!(v && v.classList.contains('no-tabs'))); darkTop(v); }
function darkTop(v) { root.classList.toggle('dark-top', !!(v && /^(hotel|trip)$/.test(v._name) && v.scrollTop < 200)); }

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
  var v = s.pop(), prev = s[s.length-1];
  if (v._leave) v._leave();
  prev.hidden = false; showTabs(prev);
  refresh(prev);
  if (REDUCED) { v.remove(); return; }
  v.classList.add('pop-out'); prev.classList.add('over');
  v.addEventListener('animationend', function f() { v.remove(); prev.classList.remove('over'); });
}
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
/* Вернулись на экран: перерисовать то, что могло поменяться. Формы не трогаем. */
function refresh(v) {
  if (!v || !v._name || /^(book|check|pay|paid|booked|results|chat)$/.test(v._name)) return;
  var y = v.scrollTop, r = V[v._name](v._arg);
  v.innerHTML = r.html; v._after = r.after;
  if (r.after) r.after(v);
  bindCommon(v); v.scrollTop = y;
}
function refreshAll() { TABS.forEach(function (t) { stacks[t].forEach(function (v) { if (!v.hidden) refresh(v); }); }); badge(); }

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
        var hero = $('.hx', v);
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
    var p = t.getAttribute('data-go').split('|');
    if (sheet.classList.contains('on')) closeSheet();
    go(p[0], p[1]);
    return;
  }
  if (t.hasAttribute('data-act')) ACT[t.getAttribute('data-act')](t, e);
});
tabsEl.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) tab(b.getAttribute('data-tab')); });
function badge() {
  var b = $('[data-tab="trips"] .dot', tabsEl);
  var n = S.trips.filter(function (t) { return !t.refused && t.step < 5; }).length;
  if (b) { b.textContent = n; b.style.display = n ? '' : 'none'; }
}

/* Свайп назад от левого края, как в iOS. */
(function () {
  var sx = 0, sy = 0, on = false, v = null, prev = null, w = 1, dx = 0, t0 = 0;
  views.addEventListener('touchstart', function (e) {
    var s = stacks[cur]; if (s.length < 2 || sheet.classList.contains('on')) return;
    var r = views.getBoundingClientRect(), x = e.touches[0].clientX - r.left;
    if (x > 28) return;
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; on = true; dx = 0; t0 = Date.now();
    v = s[s.length-1]; prev = s[s.length - 2]; w = r.width;
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
      setTimeout(function () { stacks[cur].pop(); if (vv._leave) vv._leave(); vv.remove(); pp.style.transition = ''; pp.style.transform = ''; pp.style.opacity = ''; showTabs(pp); refresh(pp); }, 280);
    } else {
      v.style.transform = 'none'; prev.style.transform = 'translate3d(' + (-w * .3) + 'px,0,0)';
      var a = v, b = prev;
      setTimeout(function () { a.style.transition = a.style.transform = ''; b.style.transition = b.style.transform = b.style.opacity = ''; b.hidden = true; }, 280);
    }
  });
})();

[app, views, $('#screen')].forEach(function (el) { if (el) el.addEventListener('scroll', function () { if (el.scrollTop || el.scrollLeft) { el.scrollTop = 0; el.scrollLeft = 0; } }); });

/* ── Нижний лист ── */
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
  sheet.addEventListener('touchstart', function (e) { if (sheet.scrollTop > 0 || e.target.closest('input,select')) return; sy = e.touches[0].clientY; dy = 0; on = true; }, { passive: true });
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
  return '<header class="nb' + (opts.solid ? ' solid' : '') + (opts.over ? ' over' : '') + '">' +
    (opts.back ? '<button class="nb-b" data-back aria-label="' + U.back + '">' + ic('back') + '</button>' : '<span class="nb-g"></span>') +
    '<h2>' + esc(title) + '</h2>' + (opts.right || '<span class="nb-g"></span>') + '</header>';
}
function chip(text, cls) { return '<span class="chip ' + (cls || '') + '">' + text + '</span>'; }
function favBtn(id, cls) { return '<button class="fav ' + (cls || '') + (isFav(id) ? ' on' : '') + '" data-fav="' + id + '" aria-label="' + U.fav + '">' + ic('heart') + ic('heartf', 'f') + '</button>'; }
function demoTag() { return '<span class="demo-tag">' + U.demo + '</span>'; }
function hotelCard(h, o, extra) {
  var de = dest(h.dest);
  return '<article class="hc" data-go="hotel|' + h.id + '">' +
    '<div class="hc-img"><img src="' + photo(h.photos[0], true) + '" alt="' + esc(h.name) + '" loading="lazy" decoding="async">' + favBtn(h.id) +
    '<div class="hc-tags">' + (extra || '') + chip(TB.meal[h.meal]) + '</div></div>' +
    '<div class="hc-b"><div class="hc-top">' + stars(h.stars) + '<span class="rt">' + ic('star', 'sm') + String(h.rating).replace('.', L === 'ru' ? ',' : '.') + '</span>' + demoTag() + '</div>' +
    '<h3>' + esc(h.name) + '</h3><p class="hc-m">' + ic('pin', 'sm') + esc(de.resorts[h.resort]) + ', ' + esc(de.name) + '</p>' +
    '<div class="hc-p"><div><small>' + esc(day(o.date)) + ' · ' + nightsW(o.nights) + '</small><b class="num">' + U.from + ' ' + usd(o.price) + '</b></div><span class="hc-ops">' + fmt(U.atOps, { n: Object.keys(h.ops).length }) + '</span></div>' +
    '</div></article>';
}
function srLine(sr) {
  var de = sr.dest ? dest(sr.dest).name : U.anyCountry;
  return esc(de) + ' · ' + sr.from + '-' + day(sr.to) + ' · ' + sr.nf + '-' + sr.nt + ' ' + U.nightsShort + ' · ' + people(sr.adults, sr.kids);
}

/* ── Экраны ── */
var V = {};

V.home = function () {
  var sr = S.sr;
  var hot = TB.hotels.filter(function (h) { return h.hot; });
  return {
    html: nav(TB.brand, { right: '<button class="nb-b" data-go="alerts" aria-label="' + U.alerts + '">' + ic('bell') + (S.feed.some(function (f) { return !f.read; }) ? '<i class="nb-dot"></i>' : '') + '</button>' }) +
      '<div class="lt home-lt"><svg class="lt-mark" aria-hidden="true"><use href="#tb-mark"/></svg><div><p class="lt-k">' + esc(S.authed && S.name ? fmt(U.helloName, { n: S.name.split(' ')[0] }) : U.hello) + '</p><h1>' + U.homeTitle + '</h1></div></div>' +
      '<div class="sbox">' +
        '<button class="sf" data-act="fromCity">' + ic('plane') + '<span><small>' + U.fFrom + '</small><b>' + U.tashkent + '</b></span></button>' +
        '<button class="sf" data-act="pickDest">' + ic('pin') + '<span><small>' + U.fTo + '</small><b>' + esc(sr.dest ? dest(sr.dest).name : U.anyCountry) + '</b></span>' + ic('chev', 'sm mute') + '</button>' +
        '<div class="sf2"><button class="sf" data-act="pickDates">' + ic('cal') + '<span><small>' + U.fDates + '</small><b>' + day(sr.from) + '-' + day(sr.to) + '</b></span></button>' +
        '<button class="sf" data-act="pickNights">' + ic('moon') + '<span><small>' + U.fNights + '</small><b>' + sr.nf + '-' + sr.nt + '</b></span></button></div>' +
        '<button class="sf" data-act="pickPeople">' + ic('users') + '<span><small>' + U.fPeople + '</small><b>' + people(sr.adults, sr.kids) + (sr.kids.length ? ' (' + sr.kids.map(function (a) { return a + ' ' + U.yo; }).join(', ') + ')' : '') + '</b></span>' + ic('chev', 'sm mute') + '</button>' +
        '<div class="sf2"><button class="sf" data-act="pickMeal">' + ic('food') + '<span><small>' + U.fMeal + '</small><b>' + (sr.meal ? TB.meal[sr.meal] : U.any) + '</b></span></button>' +
        '<button class="sf" data-act="pickStars">' + ic('star') + '<span><small>' + U.fStars + '</small><b>' + (sr.stars ? sr.stars + '★' + (sr.stars < 5 ? '+' : '') : U.any) + '</b></span></button></div>' +
        '<button class="btn pri wide go-btn" data-act="search">' + ic('search') + U.findTours + '</button>' +
        '<p class="sbox-n">' + ic('layers', 'sm') + fmt(U.fromTv, { n: TB.ops.length }) + '</p>' +
      '</div>' +
      '<div class="sec"><h3>' + ic('flame', 'sm hot') + U.hotTitle + '</h3><button data-tab-go="hot">' + U.all + '</button></div>' +
      '<div class="rail">' + hot.map(function (h) { var x = hotProfile(h); return hotelCard(h, x.o, chip('−' + Math.round((1 - x.o.price / x.was) * 100) + '%', 'c-hot')); }).join('') + '</div>' +
      '<div class="sec"><h3>' + U.destTitle + '</h3></div>' +
      '<div class="dgrid">' + TB.dest.map(function (de) {
        var min = Infinity; TB.hotels.forEach(function (h) { if (h.dest === de.id) { var o = offers(h, S.sr)[0]; if (o.price < min) min = o.price; } });
        return '<button class="dt" data-act="destGo" data-d="' + de.id + '"><img src="' + photo(de.photo, true) + '" alt="" loading="lazy"><span><b>' + esc(de.name) + '</b><small>' + U.from + ' ' + usd(min) + '</small></span></button>';
      }).join('') + '</div>' +
      '<button class="promo" data-act="watchInfo"><span class="promo-t"><b>' + U.watchTitle + '</b><small>' + U.watchSub + '</small></span><span class="promo-i">' + ic('bell') + '</span></button>' +
      '<div class="how"><h3>' + U.howTitle + '</h3>' + [['search', U.how1], ['shield', U.how2], ['card', U.how3], ['doc', U.how4]].map(function (x, i) { return '<div class="how-i"><span>' + ic(x[0]) + '</span><p><b>' + (i + 1) + '.</b> ' + x[1] + '</p></div>'; }).join('') + '</div>' +
      '<p class="foot-note">' + U.demoNote + '</p>'
  };
};

/* Поиск: туры идут от операторов по очереди, как в Турвизоре. */
var RS = { sort: 'price', meal: '', stars: 0 };
V.results = function () {
  var sr = S.sr;
  return {
    noTabs: false,
    html: nav(U.resTitle, { back: true, solid: true, right: '<button class="nb-b" data-act="watchSearch" aria-label="' + U.watchBtn + '">' + ic('bell') + '</button>' }) +
      '<button class="sr-line" data-back>' + ic('search', 'sm') + '<span>' + srLine(sr) + '</span>' + ic('edit', 'sm') + '</button>' +
      '<div class="load" id="load"><div class="load-h"><b>' + U.searching + '</b><span class="num" id="lpct">0%</span></div><div class="load-bar"><i id="lbar"></i></div><ul class="load-ops">' + TB.ops.map(function (o) { return '<li data-op="' + o.id + '"><span>' + esc(o.name) + '</span><em></em></li>'; }).join('') + '</ul></div>' +
      '<div id="res" class="res" hidden></div>',
    after: function (v) {
      var list = TB.hotels.filter(function (h) { return matches(h, sr); });
      var counts = {}, total = 0;
      TB.ops.forEach(function (o) { counts[o.id] = 0; });
      list.forEach(function (h) { Object.keys(h.ops).forEach(function (op) { var n = (sr.to - sr.from + 1) * (sr.nt - sr.nf + 1); counts[op] += n; total += n; }); });
      var lis = $$('.load-ops li', v), i = 0, step = REDUCED ? 0 : 320;
      var tickOne = function () {
        if (!v.isConnected) return;
        if (i < lis.length) {
          var li = lis[i], n = counts[li.getAttribute('data-op')];
          li.classList.add('on'); $('em', li).textContent = n ? fmt(U.toursN, { n: n }) : U.noTours;
          i++;
          $('#lbar', v).style.transform = 'scaleX(' + (i / lis.length).toFixed(3) + ')';
          $('#lpct', v).textContent = Math.round(i / lis.length * 100) + '%';
          setTimeout(tickOne, step);
        } else setTimeout(function () { show(v, list, total); }, step ? 260 : 0);
      };
      tickOne();
    }
  };
};
function show(v, list, total) {
  var box = $('#res', v); if (!box) return;
  $('#load', v).classList.add('done');
  box.hidden = false;
  var draw = function () {
    var rows = list.filter(function (h) { return (!RS.stars || h.stars >= RS.stars) && (!RS.meal || MEALS.indexOf(h.meal) >= MEALS.indexOf(RS.meal)); })
      .map(function (h) { return { h: h, o: offers(h, S.sr)[0] }; });
    rows.sort(function (a, b) { return RS.sort === 'price' ? a.o.price - b.o.price : RS.sort === 'rating' ? b.h.rating - a.h.rating : b.h.stars - a.h.stars || a.o.price - b.o.price; });
    box.innerHTML = '<p class="tv-note">' + ic('layers', 'sm') + fmt(U.tvLine, { n: TB.ops.length, t: grp(total) }) + '</p>' +
      '<div class="seg sort">' + [['price', U.sortPrice], ['rating', U.sortRating], ['stars', U.sortStars]].map(function (x) { return '<button class="' + (RS.sort === x[0] ? 'on' : '') + '" data-act="sort" data-v="' + x[0] + '">' + (x[0] === 'price' ? ic('sort', 'sm') : '') + x[1] + '</button>'; }).join('') + '</div>' +
      '<div class="qchips">' + [['', U.anyMeal], ['BB', TB.meal.BB], ['AI', TB.meal.AI]].map(function (x) { return '<button class="qc' + (RS.meal === x[0] ? ' on' : '') + '" data-act="rmeal" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') +
      [4, 5].map(function (s) { return '<button class="qc' + (RS.stars === s ? ' on' : '') + '" data-act="rstars" data-v="' + s + '">' + s + '★' + (s < 5 ? '+' : '') + '</button>'; }).join('') + '</div>' +
      '<p class="count">' + fmt(U.hotelsN, { n: rows.length }) + (RS.sort === 'price' ? ' · ' + U.cheapFirst : '') + '</p>' +
      (rows.length ? rows.map(function (r, i) { return hotelCard(r.h, r.o, i === 0 && RS.sort === 'price' ? chip(U.cheapest, 'c-ok') : ''); }).join('') : '<div class="empty">' + ic('search') + '<b>' + U.nothing + '</b><p>' + U.nothingSub + '</p></div>') +
      '<p class="foot-note">' + U.demoTours + '</p>';
    if (!REDUCED) $$('.hc', box).forEach(function (c, i) { c.style.animationDelay = (i * 60) + 'ms'; c.classList.add('rise'); });
  };
  v._draw = draw; draw();
}

/* Отель: галерея, о чём отель и кто из операторов дешевле. */
V.hotel = function (id) {
  var h = hotel(id), de = dest(h.dest), sr = S.sr, n = V.hotel.n && V.hotel.n[id] || sr.nf;
  var list = offers(h, sr, n), best = list[0].price, w = watched(id);
  var nights = []; for (var x = sr.nf; x <= sr.nt; x++) nights.push(x);
  return {
    html: nav(h.name, { back: true, over: true, right: favBtn(h.id, 'nb-fav') }) +
      '<div class="hx-w"><div class="hx"><div class="gal" id="gal">' + h.photos.map(function (p, i) { return '<img src="' + photo(p, i > 0) + '" alt="' + esc(h.name) + '"' + (i ? ' loading="lazy"' : '') + '>'; }).join('') + '</div></div><div class="gal-dots">' + h.photos.map(function (_, i) { return '<i class="' + (i ? '' : 'on') + '"></i>'; }).join('') + '</div></div>' +
      '<div class="hd">' +
        '<div class="hc-top">' + stars(h.stars) + '<span class="rt">' + ic('star', 'sm') + String(h.rating).replace('.', L === 'ru' ? ',' : '.') + ' · ' + fmt(U.reviewsN, { n: grp(h.reviews) }) + '</span>' + demoTag() + '</div>' +
        '<h1>' + esc(h.name) + '</h1><p class="hc-m">' + ic('pin', 'sm') + esc(de.resorts[h.resort]) + ', ' + esc(de.name) + ' · ' + U.flight + ' ' + esc(de.fly) + '</p>' +
        '<div class="facts"><div>' + ic('wave') + '<span><small>' + U.beach + '</small>' + esc(h.beach) + '</span></div><div>' + ic('bed') + '<span><small>' + U.room + '</small>' + esc(h.room) + '</span></div><div>' + ic('food') + '<span><small>' + U.meal + '</small>' + TB.meal[h.meal] + '</span></div></div>' +
        '<div class="chips-m">' + h.feats.map(function (f) { return chip(esc(f), 'c-soft'); }).join('') + '</div>' +
        '<button class="watch' + (w ? ' on' : '') + '" data-act="watch" data-h="' + h.id + '">' + ic('bell') + '<span><b>' + (w ? U.watchOn : U.watchBtn) + '</b><small>' + (w ? U.watchOnSub : U.watchBtnSub) + '</small></span><span class="sw2"></span></button>' +
        '<div class="sec"><h3>' + U.whoCheaper + '</h3></div>' +
        '<p class="mute sm">' + fmt(U.whoCheaperSub, { n: list.length, p: people(sr.adults, sr.kids) }) + '</p>' +
        '<div class="seg nights">' + nights.map(function (x) { return '<button class="' + (x === n ? 'on' : '') + '" data-act="hn" data-h="' + h.id + '" data-v="' + x + '">' + nightsW(x) + '</button>'; }).join('') + '</div>' +
        '<div class="offs">' + list.map(function (o, i) {
          var op = opOf(o.op);
          return '<button class="off' + (i ? '' : ' best') + '" data-go="tour|' + tourId(o, h) + '"><span class="off-l"><b>' + esc(op.name) + '</b><small>' + dayShort(o.date) + ' · ' + nightsW(o.nights) + ' · ' + TB.meal[h.meal] + '</small></span><span class="off-r"><b class="num">' + usd(o.price) + '</b>' + (i ? '<small class="num">+' + usd(o.price - best) + '</small>' : '<small class="best-t">' + U.cheapest + '</small>') + '</span>' + ic('chev', 'sm mute') + '</button>';
        }).join('') + '</div>' +
        '<p class="src">' + U.offsNote + '</p>' +
      '</div>' +
      '<div class="cta"><div class="cta-p"><small>' + U.from + '</small><b class="num">' + usd(best) + '</b></div><button class="btn pri" data-go="tour|' + tourId(list[0], h) + '">' + U.chooseTour + '</button></div>',
    noTabs: true,
    after: function (v) {
      var g = $('#gal', v), dots = $$('.gal-dots i', v);
      if (g) g.addEventListener('scroll', function () { var k = Math.round(g.scrollLeft / g.clientWidth); dots.forEach(function (x, i) { x.classList.toggle('on', i === k); }); }, { passive: true });
    }
  };
};
V.hotel.n = {};

/* Тур: всё, что клиент покупает, до кнопки. */
V.tour = function (arg) {
  var t = parseTour(arg), h = t.h, op = opOf(t.op), f = flight(h, t.op, t.date, t.nights), sr = S.sr;
  var inc = [['plane', U.incFlight], ['bus', U.incTransfer], ['bed', fmt(U.incHotel, { n: nightsW(t.nights) })], ['food', TB.meal[h.meal]], ['shield', U.incIns]];
  return {
    noTabs: true,
    html: nav(U.tourTitle, { back: true, solid: true }) +
      '<div class="tsum"><img src="' + photo(h.photos[0], true) + '" alt=""><div><div class="hc-top">' + stars(h.stars) + demoTag() + '</div><b>' + esc(h.name) + '</b><small>' + esc(dest(h.dest).resorts[h.resort]) + ', ' + esc(dest(h.dest).name) + '</small></div></div>' +
      '<div class="card rows">' +
        row('cal', U.dates, range(t.date, t.nights) + ' · ' + nightsW(t.nights)) + row('users', U.tourists, people(sr.adults, sr.kids)) + row('bed', U.room, esc(h.room)) + row('food', U.meal, TB.meal[h.meal]) + row('briefcase', U.operator, esc(op.name)) +
      '</div>' +
      '<div class="sec"><h3>' + U.flights + '</h3></div>' +
      '<div class="card fl">' + leg(U.there, f.out, 'TAS', f.out.a, f.air) + leg(U.backW, f.back, f.back.a, 'TAS', f.air) + '</div>' +
      '<div class="sec"><h3>' + U.included + '</h3></div>' +
      '<div class="card inc">' + inc.map(function (x) { return '<p>' + ic(x[0]) + '<span>' + x[1] + '</span>' + ic('check', 'ok') + '</p>'; }).join('') + '<p class="no">' + ic('info') + '<span>' + U.notIncluded + '</span></p></div>' +
      '<div class="card note-c">' + ic('shield') + '<p><b>' + U.checkFirst + '</b>' + U.checkFirstSub + '</p></div>' +
      '<p class="foot-note">' + U.demoTours + '</p>' +
      '<div class="cta"><div class="cta-p"><small>' + U.forAll + '</small><b class="num">' + usd(t.price) + '</b></div><button class="btn pri" data-go="check|' + arg + '">' + U.checkAndBook + '</button></div>'
  };
};
function row(i, k, v) { return '<p class="row">' + ic(i) + '<span class="k">' + k + '</span><span class="vl">' + v + '</span></p>'; }
function leg(title, x, a, b, air) {
  return '<div class="leg"><p class="leg-h"><b>' + title + '</b><span>' + dayShort(x.d) + ' · ' + esc(air) + ' ' + x.no + '</span></p><div class="leg-r"><div><b class="num">' + x.t[0] + '</b><small>' + a + '</small></div><i aria-hidden="true">' + ic('plane', 'sm') + '</i><div class="r"><b class="num">' + x.t[1] + '</b><small>' + b + '</small></div></div></div>';
}

/* Проверка цены (актуализация): тот же запрос к туроператору перед бронью. */
var CHECK_OUT = {};
V.check = function (arg) {
  var t = parseTour(arg);
  var changed = CHECK_OUT[arg] != null ? CHECK_OUT[arg] : /^(lara|kemer)$/.test(t.h.id);
  var now = changed ? Math.round(t.price * 1.035 / 10) * 10 : t.price;
  var steps = [U.ck1, U.ck2, U.ck3];
  return {
    noTabs: true,
    html: nav(U.checkTitle, { back: true, solid: true }) +
      '<div class="ck"><div class="ck-ring" id="ckr"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="bg"/><circle cx="60" cy="60" r="52" class="fg" pathLength="100"/></svg>' + ic('shield') + '</div>' +
      '<h2 id="ckh">' + U.checking + '</h2><p class="mute">' + esc(t.h.name) + ' · ' + esc(opOf(t.op).name) + '</p>' +
      '<ul class="ck-s">' + steps.map(function (s) { return '<li><i>' + ic('check') + '</i>' + s + '</li>'; }).join('') + '</ul></div>' +
      '<div id="ckres" hidden>' +
        (changed
          ? '<div class="ckr warn"><p class="ckr-h">' + ic('alert') + U.priceChanged + '</p><div class="was-now"><div><small>' + U.was + '</small><s class="num">' + usd(t.price) + '</s></div>' + ic('arrow') + '<div><small>' + U.now + '</small><b class="num">' + usd(now) + '</b></div></div><p>' + fmt(U.priceChangedSub, { d: usd(now - t.price) }) + '</p></div>'
          : '<div class="ckr ok"><p class="ckr-h">' + ic('check') + U.priceOk + '</p><b class="num big">' + usd(now) + '</b><p>' + U.priceOkSub + '</p></div>') +
        '<div class="card note-c">' + ic('info') + '<p>' + U.whyCheck + '</p></div>' +
        '<button class="link-btn" data-act="flipCheck" data-t="' + arg + '">' + U.otherOutcome + '</button>' +
      '</div>' +
      '<div class="cta" id="ckcta" hidden>' + (changed ? '<button class="btn ghost" data-act="otherOps" data-h="' + t.h.id + '">' + U.otherOffers + '</button>' : '') + '<button class="btn pri" data-go="book|' + arg + ':' + now + '">' + (changed ? fmt(U.goOn, { p: usd(now) }) : U.toBooking) + '</button></div>',
    after: function (v) {
      var lis = $$('.ck-s li', v), i = 0, ring = $('#ckr', v);
      var stepT = REDUCED ? 0 : 520;
      ring.style.setProperty('--p', '0');
      var tickOne = function () {
        if (!v.isConnected) return;
        if (i < lis.length) { lis[i].classList.add('on'); i++; ring.style.setProperty('--p', (i / lis.length).toFixed(3)); setTimeout(tickOne, stepT); return; }
        ring.classList.add(changed ? 'warn' : 'ok');
        $('#ckh', v).textContent = changed ? U.priceChangedShort : U.priceOkShort;
        $('#ckres', v).hidden = false; $('#ckcta', v).hidden = false;
        buzz(changed ? [10, 60, 10] : [8, 40, 8]);
      };
      setTimeout(tickOne, stepT);
    }
  };
};

/* Бронь: туристы латиницей как в паспорте, контакты, допы, согласие. */
var B = null;
V.book = function (arg) {
  var p = String(arg).split(':'), t = parseTour(p.slice(0, 4).join(':')), price = +p[4] || t.price, sr = S.sr;
  if (!B || B.arg !== arg) {
    B = { arg: arg, price: price, ppl: [], extras: [], phone: S.phone || '+998 ', email: '', ok: false };
    for (var i = 0; i < sr.adults; i++) B.ppl.push({ kind: 'a', n: '', b: '', p: '', e: '' });
    sr.kids.forEach(function (age) { B.ppl.push({ kind: 'k', age: age, n: '', b: '', p: '', e: '' }); });
  }
  var extras = [['ins', U.exIns, U.exInsSub], ['trans', U.exTrans, U.exTransSub], ['visa', U.exVisa, U.exVisaSub], ['seat', U.exSeat, U.exSeatSub]];
  var fake = { adults: sr.adults, kids: sr.kids, nights: t.nights };
  return {
    noTabs: true,
    html: nav(U.bookTitle, { back: true, solid: true }) +
      '<div class="tsum sm"><img src="' + photo(t.h.photos[0], true) + '" alt=""><div><b>' + esc(t.h.name) + '</b><small>' + range(t.date, t.nights) + ' · ' + esc(opOf(t.op).name) + '</small></div></div>' +
      '<button class="fill-demo" data-act="fillDemo">' + ic('spark', 'sm') + U.fillDemo + '</button>' +
      '<div class="sec"><h3>' + U.touristsTitle + '</h3></div>' +
      (S.tourists.length ? '<div class="saved"><small>' + U.fromSaved + '</small><div class="qchips">' + S.tourists.map(function (x, i) { return '<button class="qc" data-act="useSaved" data-i="' + i + '">' + ic('user', 'sm') + esc(x.n) + '</button>'; }).join('') + '</div></div>' : '') +
      B.ppl.map(function (x, i) {
        return '<div class="card form tf" data-i="' + i + '"><p class="tf-h"><b>' + (x.kind === 'a' ? fmt(U.adultN, { n: i + 1 }) : fmt(U.kidN, { n: x.age })) + '</b><span class="tf-ok">' + ic('check', 'sm') + '</span></p>' +
          '<label class="fld"><span>' + U.fLatin + '</span><input data-f="n" value="' + esc(x.n) + '" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="ALIYEV AZIZ"><em class="err">' + U.errLatin + '</em></label>' +
          '<div class="fld2"><label class="fld"><span>' + U.fBirth + '</span><input data-f="b" value="' + esc(x.b) + '" inputmode="numeric" placeholder="' + U.datePh + '"></label>' +
          '<label class="fld"><span>' + U.fPass + '</span><input data-f="p" value="' + esc(x.p) + '" autocapitalize="characters" placeholder="AB1234567"></label></div>' +
          '<label class="fld"><span>' + U.fPassTill + '</span><input data-f="e" value="' + esc(x.e) + '" inputmode="numeric" placeholder="' + U.datePh + '"></label></div>';
      }).join('') +
      '<p class="src">' + U.passNote + '</p>' +
      '<div class="sec"><h3>' + U.contacts + '</h3></div>' +
      '<div class="card form"><label class="fld"><span>' + U.fPhone + '</span><input id="bph" value="' + esc(B.phone) + '" inputmode="tel" autocomplete="tel"></label><label class="fld"><span>' + U.fEmail + '</span><input id="bem" value="' + esc(B.email) + '" inputmode="email" autocomplete="email" placeholder="name@mail.uz"></label></div>' +
      '<div class="sec"><h3>' + U.extrasTitle + '</h3></div>' +
      '<div class="card ex">' + extras.map(function (x) { return '<label class="ex-r"><input type="checkbox" class="sw" data-ex="' + x[0] + '"' + (B.extras.indexOf(x[0]) >= 0 ? ' checked' : '') + '><span><b>' + x[1] + '</b><small>' + x[2] + '</small></span><em class="num">+' + usd(extraPrice(x[0], fake)) + '</em></label>'; }).join('') + '</div>' +
      '<label class="agree"><input type="checkbox" id="bok"' + (B.ok ? ' checked' : '') + '><span class="cb" aria-hidden="true">' + ic('check', 'sm') + '</span><span>' + U.agree + ' <button type="button" class="lnk" data-act="offer">' + U.agreeLink + '</button></span></label>' +
      '<div class="cta"><div class="cta-p"><small>' + U.total + '</small><b class="num" id="btot"></b></div><button class="btn pri" id="bgo" data-act="bsend" disabled>' + U.bookBtn + '</button></div>',
    after: function (v) {
      var latin = /^[A-Z][A-Z' -]*[A-Z]$/;
      var dateRe = /^(0[1-9]|[12]\d|3[01])\.(0[1-9]|1[0-2])\.(19|20)\d\d$/;
      var passRe = /^[A-Z]{2}\d{7}$/;
      var chk = function () {
        var ok = true;
        $$('.tf', v).forEach(function (f) {
          var x = B.ppl[+f.getAttribute('data-i')];
          var nOk = latin.test(x.n) && x.n.indexOf(' ') > 0, good = nOk && dateRe.test(x.b) && passRe.test(x.p) && dateRe.test(x.e);
          f.classList.toggle('bad-n', !!x.n && !/^[A-Z' -]*$/.test(x.n));
          f.classList.toggle('good', good);
          if (!good) ok = false;
        });
        B.phone = $('#bph', v).value; B.email = $('#bem', v).value; B.ok = $('#bok', v).checked;
        var total = B.price; B.extras.forEach(function (k) { total += extraPrice(k, fake); });
        $('#btot', v).textContent = usd(total);
        $('#bgo', v).disabled = !(ok && digits(B.phone).length === 12 && B.ok);
      };
      $$('.tf input', v).forEach(function (inp) {
        inp.addEventListener('input', function () {
          var f = inp.getAttribute('data-f'), x = B.ppl[+inp.closest('.tf').getAttribute('data-i')];
          if (f === 'n' || f === 'p') { var s = inp.selectionStart; inp.value = inp.value.toUpperCase(); try { inp.setSelectionRange(s, s); } catch (e) {} }
          if (f === 'b' || f === 'e') inp.value = dateMask(inp.value);
          x[f] = inp.value; chk();
        });
      });
      phoneMask($('#bph', v), chk);
      $('#bem', v).addEventListener('input', chk);
      $('#bok', v).addEventListener('change', chk);
      $$('[data-ex]', v).forEach(function (c) { c.addEventListener('change', function () { var k = c.getAttribute('data-ex'), i = B.extras.indexOf(k); if (c.checked && i < 0) B.extras.push(k); if (!c.checked && i >= 0) B.extras.splice(i, 1); buzz(4); chk(); }); });
      v._chk = chk; chk();
    }
  };
};
function dateMask(s) { var x = digits(s).slice(0, 8), o = x.slice(0, 2); if (x.length > 2) o += '.' + x.slice(2, 4); if (x.length > 4) o += '.' + x.slice(4); return o; }
function phoneMask(inp, cb) {
  var f = function () { var x = digits(inp.value); if (x.indexOf('998') !== 0) x = '998' + x; x = x.slice(0, 12); var o = '+998'; if (x.length > 3) o += ' ' + x.slice(3, 5); if (x.length > 5) o += ' ' + x.slice(5, 8); if (x.length > 8) o += ' ' + x.slice(8, 10); if (x.length > 10) o += ' ' + x.slice(10, 12); inp.value = o; if (cb) cb(); };
  inp.addEventListener('input', f); f();
}

/* Заявка ушла: номер сделки в Битрикс24 и выбор, когда платить. */
V.booked = function (id) {
  var t = tripById(id), h = hotel(t.h);
  return {
    noTabs: true,
    html: '<div class="done"><div class="ok-ring"><svg viewBox="0 0 80 80"><circle class="okc" cx="40" cy="40" r="36"/><path class="okp" d="m24 41 11 11 22-24"/></svg></div>' +
      '<h1>' + U.bookedTitle + '</h1><p class="mute">' + fmt(U.bookedSub, { d: t.deal }) + '</p>' +
      '<div class="bx-mini"><p class="bx-h"><span class="bx-logo">' + U.bxName + '</span><small>' + U.bxCol0 + '</small></p><b>' + esc(t.names[0] || '') + ' · ' + esc(h.name) + '</b><small>' + range(t.date, t.nights) + ' · ' + esc(opOf(t.op).name) + ' · ' + usd(tripTotal(t)) + '</small><small>' + esc(S.phone || t.phone || '') + '</small></div>' +
      '<p class="src">' + U.bookedNote + '</p>' +
      '<div class="done-b"><button class="btn pri wide" data-go="pay|' + t.id + '">' + ic('card') + fmt(U.payNow, { p: usd(tripTotal(t)) }) + '</button><button class="btn ghost wide" data-act="openTrip" data-id="' + t.id + '">' + U.payLater + '</button></div>' +
      '<p class="mute sm">' + U.payLaterSub + '</p></div>'
  };
};

/* Оплата: способы, принятые в Узбекистане, полностью или предоплатой. */
var PAY = { mode: 'full', m: 'click' };
V.pay = function (id) {
  var t = tripById(id), total = tripTotal(t), left = total - (t.paid || 0);
  var part = Math.round(total * TB.prepay / 100 / 10) * 10;
  var amount = t.paid ? left : PAY.mode === 'full' ? total : part;
  var ms = [['click', 'Click', U.pmClick], ['payme', 'Payme', U.pmPayme], ['uzum', 'Uzum Bank', U.pmUzum], ['card', 'Uzcard / Humo', U.pmCard], ['visa', 'Visa / Mastercard', U.pmVisa], ['nasiya', U.pmNasiya, U.pmNasiyaSub]];
  return {
    noTabs: true,
    html: nav(U.payTitle, { back: true, solid: true }) +
      '<div class="pay-sum"><small>' + esc(hotel(t.h).name) + ' · ' + U.deal + ' ' + t.deal + '</small><b class="num" id="pamt">' + usd(amount) + '</b><small>' + U.paySom + '</small></div>' +
      (t.paid ? '<p class="mute sm center">' + fmt(U.leftToPay, { p: usd(t.paid) }) + '</p>' :
        '<div class="seg">' + [['full', fmt(U.payFull, { p: usd(total) })], ['part', fmt(U.payPart, { n: TB.prepay, p: usd(part) })]].map(function (x) { return '<button class="' + (PAY.mode === x[0] ? 'on' : '') + '" data-act="pmode" data-v="' + x[0] + '" data-id="' + t.id + '">' + x[1] + '</button>'; }).join('') + '</div>' +
        (PAY.mode === 'part' ? '<p class="mute sm">' + U.partNote + '</p>' : '')) +
      '<div class="sec"><h3>' + U.payHow + '</h3></div>' +
      '<div class="card pm">' + ms.map(function (x) { return '<button class="pm-r' + (PAY.m === x[0] ? ' on' : '') + '" data-act="pm" data-v="' + x[0] + '" data-id="' + t.id + '"><span class="pm-l pm-' + x[0] + '">' + payLogo(x[0]) + '</span><span><b>' + x[1] + '</b><small>' + x[2] + '</small></span><i class="rd"></i></button>'; }).join('') + '</div>' +
      '<div class="card note-c">' + ic('shield') + '<p><b>' + U.refundTitle + '</b>' + U.refundSub + '</p></div>' +
      '<p class="src">' + U.payDemo + '</p>' +
      '<div class="cta"><button class="btn pri wide" data-act="paygo" data-id="' + t.id + '" data-a="' + amount + '">' + ic('lock', 'sm') + fmt(U.payBtn, { p: usd(amount) }) + '</button></div>'
  };
};
function payLogo(k) { return { click: 'C', payme: 'P', uzum: 'U', card: 'UZ', visa: 'V', nasiya: '%' }[k]; }

/* Чек об оплате. */
V.paid = function (arg) {
  var p = String(arg).split(':'), t = tripById(p[0]), a = +p[1];
  var now = new Date(), when = ('0' + now.getDate()).slice(-2) + '.' + ('0' + (now.getMonth() + 1)).slice(-2) + '.' + now.getFullYear() + ', ' + ('0' + now.getHours()).slice(-2) + ':' + ('0' + now.getMinutes()).slice(-2);
  var mName = { click: 'Click', payme: 'Payme', uzum: 'Uzum Bank', card: 'Uzcard / Humo', visa: 'Visa / Mastercard', nasiya: U.pmNasiya }[t.method || 'click'];
  return {
    noTabs: true,
    html: '<div class="done"><div class="ok-ring"><svg viewBox="0 0 80 80"><circle class="okc" cx="40" cy="40" r="36"/><path class="okp" d="m24 41 11 11 22-24"/></svg></div><h1>' + U.paidTitle + '</h1><p class="mute">' + U.paidSub + '</p>' +
      '<div class="rcpt"><p class="rc-h"><b>' + TB.brand + '</b><small>' + U.receipt + '</small></p>' +
        [[U.deal, t.deal], [U.rcTour, esc(hotel(t.h).name)], [U.rcDate, when], [U.rcMethod, mName + ' •• ' + (t.card || '4417')], [U.rcSum, usd(a)], [U.rcLeft, usd(tripTotal(t) - t.paid)]].map(function (r) { return '<p><span>' + r[0] + '</span><b class="num">' + r[1] + '</b></p>'; }).join('') +
        '<div class="rc-qr" aria-hidden="true">' + qr(t.deal + a) + '</div><small class="mute">' + U.rcNote + '</small></div>' +
      '<div class="done-b"><button class="btn pri wide" data-act="openTrip" data-id="' + t.id + '">' + U.toTrip + '</button></div></div>'
  };
};
/* Квадратик «как QR»: рисунок из строки, не настоящий код. */
function qr(s) {
  var h = 0, out = '', n = 13; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
    var corner = (x < 4 && y < 4) || (x > 8 && y < 4) || (x < 4 && y > 8);
    var on = ((h >> ((x * 7 + y * 3) % 31)) & 1) === 1;
    if (corner) { var cx = x > 8 ? x - 9 : x, cy = y > 8 ? y - 9 : y; on = cx === 0 || cy === 0 || cx === 3 || cy === 3; }
    if (on) out += '<i style="grid-area:' + (y + 1) + '/' + (x + 1) + '"></i>';
    h = (h * 1103515245 + 12345) >>> 0;
  }
  return out;
}

/* Мои поездки. */
V.trips = function () {
  var list = S.trips.slice().reverse();
  return {
    html: nav(U.tripsTitle) + '<div class="lt"><h1>' + U.tripsTitle + '</h1></div>' +
      (S.offline ? '<p class="offline-n">' + ic('wifiOff', 'sm') + U.offlineList + '</p>' : '') +
      (list.length ? list.map(function (t) {
        var h = hotel(t.h), st = stepName(t);
        return '<button class="trc" data-go="trip|' + t.id + '"><img src="' + photo(h.photos[0], true) + '" alt="" loading="lazy"><div><p class="trc-s ' + st.cls + '">' + st.t + '</p><b>' + esc(h.name) + '</b><small>' + range(t.date, t.nights) + ' · ' + U.deal + ' ' + t.deal + '</small>' + (t.demo ? '<small class="mute">' + U.demoTrip + '</small>' : '') + '</div>' + ic('chev', 'sm mute') + '</button>';
      }).join('') : '<div class="empty">' + ic('suitcase') + '<b>' + U.noTrips + '</b><p>' + U.noTripsSub + '</p><button class="btn pri" data-tab-go="home">' + U.findTours + '</button></div>')
  };
};
var STEPS = ['st0', 'st1', 'st2', 'st3', 'st4', 'st5'];
function stepName(t) {
  if (t.refused) return { t: U.stRefused, cls: 'bad' };
  if (t.step === 3 && !(t.paid >= tripTotal(t))) return { t: U.stWaitPay, cls: 'wait' };
  return { t: U[STEPS[t.step]], cls: t.step >= 4 ? 'ok' : 'wait' };
}

/* Бронь: лента статусов, оплата, документы, менеджер. */
V.trip = function (id) {
  var t = tripById(id), h = hotel(t.h), total = tripTotal(t), paidAll = t.paid >= total;
  var tl = STEPS.map(function (k, i) {
    var done = i < t.step || (i === 3 && paidAll && t.step >= 2) || (i === t.step && i === 5);
    var now = !t.refused && i === t.step && !(i === 3 && paidAll);
    var sub = now ? (i === 3 && !paidAll ? U.stWaitPaySub : U[k + 's']) : '';
    return '<li class="' + (done ? 'is-done' : '') + (now ? ' is-now' : '') + '"><i>' + (done ? ic('check', 'sm') : '') + '</i><div><b>' + U[k] + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</div></li>';
  }).join('');
  var docs = [['voucher', 'ticket'], ['tickets', 'plane'], ['insurance', 'shield'], ['memo', 'info']];
  return {
    noTabs: true,
    html: nav(U.deal + ' ' + t.deal, { back: true, over: true, right: '<button class="nb-b" data-go="chat|' + t.id + '" aria-label="' + U.chat + '">' + ic('chat') + '</button>' }) +
      '<div class="hx-w short"><div class="hx"><img src="' + photo(h.photos[0]) + '" alt=""></div><div class="hx-cap"><b>' + esc(h.name) + '</b><small>' + range(t.date, t.nights) + ' · ' + people(t.adults, t.kids) + '</small></div></div>' +
      (S.offline ? '<p class="offline-n">' + ic('wifiOff', 'sm') + U.offlineTrip + '</p>' : '') +
      (t.refused
        ? '<div class="ckr bad">' + '<p class="ckr-h">' + ic('alert') + U.stRefused + '</p><p>' + U.refusedWhy + '</p>' + (t.paid ? '<p><b>' + fmt(U.refundGo, { p: usd(t.paid), c: t.card || '4417' }) + '</b></p>' : '') + '<button class="btn pri wide" data-act="similar" data-h="' + t.h + '">' + U.similar + '</button></div>'
        : '') +
      '<div class="sec"><h3>' + U.statusTitle + '</h3><small class="mute">' + U.statusSub + '</small></div>' +
      '<ol class="tl' + (t.refused ? ' off' : '') + '">' + tl + '</ol>' +
      '<div class="sec"><h3>' + U.payTitle + '</h3></div>' +
      '<div class="card paybox">' + (paidAll
        ? '<p class="pb-ok">' + ic('check', 'sm') + fmt(U.paidAll, { p: usd(total) }) + '</p>'
        : '<p><span>' + U.toPay + '</span><b class="num">' + usd(total - (t.paid || 0)) + '</b></p>' + (t.paid ? '<p class="mute sm">' + fmt(U.paidPart, { p: usd(t.paid) }) + '</p>' : '') + (t.refused ? '' : '<button class="btn pri wide" data-go="pay|' + t.id + '">' + ic('card', 'sm') + U.pay + '</button>')) + '</div>' +
      '<div class="sec"><h3>' + U.docsTitle + '</h3>' + (t.step >= 4 && !t.refused ? '<small class="ok-t">' + ic('download', 'sm') + U.docsSaved + '</small>' : '') + '</div>' +
      (t.step >= 4 && !t.refused
        ? '<div class="docs">' + docs.map(function (x) { return '<button class="doc" data-go="doc|' + t.id + ':' + x[0] + '"><span class="doc-i">' + ic(x[1]) + '</span><span><b>' + U['doc_' + x[0]] + '</b><small>PDF · ' + U.fromBx + '</small></span>' + ic('chev', 'sm mute') + '</button>'; }).join('') + '</div>'
        : '<div class="card empty-docs">' + ic('doc') + '<p>' + U.docsLater + '</p></div>') +
      '<div class="sec"><h3>' + U.manager + '</h3></div>' +
      '<div class="card mgr"><span class="ava">' + U.mgrName.charAt(0) + '</span><div><b>' + U.mgrName + '</b><small>' + U.mgrRole + '</small></div><button class="btn sm sec-btn" data-go="chat|' + t.id + '">' + ic('chat', 'sm') + U.chat + '</button></div>' +
      '<div class="demo-box"><p><b>' + U.demoBox + '</b>' + U.demoBoxSub + '</p><div class="demo-b">' +
        (t.refused ? '<button class="btn sm ghost" data-act="unrefuse" data-id="' + t.id + '">' + U.demoReset + '</button>' :
          (t.step < 5 ? '<button class="btn sm pri" data-act="advance" data-id="' + t.id + '">' + ic('arrow', 'sm') + U.demoNext + '</button>' : '') +
          (t.step < 4 ? '<button class="btn sm ghost" data-act="refuse" data-id="' + t.id + '">' + U.demoRefuse + '</button>' : '') +
          (t.step >= 4 ? '<button class="btn sm ghost" data-act="offline">' + ic(S.offline ? 'wifi' : 'wifiOff', 'sm') + (S.offline ? U.onlineBtn : U.offlineBtn) + '</button>' : '')) +
      '</div></div>'
  };
};

/* Документ: открывается в приложении и лежит в телефоне. */
V.doc = function (arg) {
  var p = arg.split(':'), t = tripById(p[0]), k = p[1], h = hotel(t.h), de = dest(h.dest), op = opOf(t.op), f = flight(h, t.op, t.date, t.nights);
  var body;
  if (k === 'voucher') body = '<p class="pp-k">' + U.doc_voucher + '</p><h4>' + esc(h.name) + ' ' + h.stars + '*</h4><p>' + esc(de.resorts[h.resort]) + ', ' + esc(de.name) + '</p>' +
    dl([[U.checkIn, day(t.date)], [U.checkOut, back2(t.date, t.nights)], [U.room, esc(h.room)], [U.meal, h.meal + ' · ' + TB.meal[h.meal]], [U.guests, t.names.map(esc).join('<br>')], [U.operator, esc(op.name)], [U.confNo, 'BR-' + t.deal.replace(/\D/g, '') + '7']]);
  else if (k === 'tickets') body = '<p class="pp-k">' + U.doc_tickets + '</p>' + [[f.out, 'TAS', f.out.a], [f.back, f.back.a, 'TAS']].map(function (x) {
    return '<div class="bp"><div><small>' + dayShort(x[0].d) + '</small><b>' + x[1] + ' → ' + x[2] + '</b><small>' + esc(f.air) + ' ' + x[0].no + '</small></div><div class="r"><b class="num">' + x[0].t[0] + '</b><small>' + U.boarding + '</small></div></div>';
  }).join('') + dl([[U.passengers, t.names.map(esc).join('<br>')], [U.baggage, U.baggageV]]);
  else if (k === 'insurance') body = '<p class="pp-k">' + U.doc_insurance + '</p><h4>' + U.insPolicy + '</h4>' + dl([[U.insured, t.names.map(esc).join('<br>')], [U.period, day(t.date) + ' → ' + back2(t.date, t.nights)], [U.territory, esc(de.name)], [U.insSum, U.insSumV]]) + '<p class="mute sm">' + U.insNote + '</p>';
  else body = '<p class="pp-k">' + U.doc_memo + '</p><h4>' + U.memoTitle + '</h4><ul class="memo">' + [U.memo1, U.memo2, U.memo3, U.memo4].map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>';
  return {
    noTabs: true,
    html: nav(U['doc_' + k], { back: true, solid: true, right: '<button class="nb-b" data-act="share" aria-label="' + U.share + '">' + ic('share') + '</button>' }) +
      '<p class="off-ok">' + ic('download', 'sm') + (S.offline ? U.offlineDoc : U.docOffline) + '</p>' +
      '<div class="paper"><div class="pp-h"><svg aria-hidden="true"><use href="#tb-mark"/></svg><b>' + TB.brand + '</b><small>' + U.deal + ' ' + t.deal + '</small></div>' + body + '<p class="pp-f">' + U.docDemo + '</p></div>' +
      '<div class="cta"><button class="btn ghost" data-act="share">' + ic('share', 'sm') + U.share + '</button><button class="btn pri" data-act="saveFile">' + ic('download', 'sm') + U.saveFile + '</button></div>'
  };
};
function dl(rows) { return '<dl>' + rows.map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>'; }).join('') + '</dl>'; }

/* Чат с менеджером: та же сделка в Битрикс24 (открытые линии). */
V.chat = function (id) {
  var t = tripById(id);
  if (!S.chat.length) S.chat = [{ me: false, t: fmt(U.chatHello, { n: U.mgrName, d: t ? t.deal : '' }) }];
  return {
    noTabs: true,
    html: nav(U.mgrName, { back: true, solid: true }) +
      '<div class="chat" id="chat">' + S.chat.map(msg).join('') + '</div>' +
      '<div class="qchips wrap chat-q">' + [U.q1, U.q2, U.q3].map(function (q) { return '<button class="qc" data-act="say" data-t="' + esc(q) + '">' + q + '</button>'; }).join('') + '</div>' +
      '<div class="cta chat-in"><input id="cin" placeholder="' + U.chatPh + '" autocomplete="off"><button class="btn pri sq" data-act="send" aria-label="' + U.send + '">' + ic('send') + '</button></div>' +
      '<button class="tg-row" data-act="tg">' + ic('tg', 'sm') + U.orTg + '</button>',
    after: function (v) { var c = $('#chat', v); c.scrollTop = 1e6; v.scrollTop = 1e6; var inp = $('#cin', v); inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') ACT.send(); }); }
  };
};
function msg(m) { return '<p class="msg' + (m.me ? ' me' : '') + '">' + esc(m.t) + '</p>'; }

/* Горящие туры: вылет скоро, цена ниже обычной. */
V.hot = function () {
  var list = TB.hotels.filter(function (h) { return h.hot; }).concat(TB.hotels.filter(function (h) { return !h.hot && h.stars === 4; }).slice(0, 1));
  return {
    html: nav(U.hotTitle) + '<div class="lt"><h1>' + U.hotTitle + '</h1><p class="lt-s">' + U.hotSub + '</p></div>' +
      list.map(function (h, i) {
        var x = hotProfile(h), soon = 2 + i * 2;
        return hotelCard(h, { op: x.o.op, date: soon + 1, nights: x.o.nights, price: x.o.price }, chip('−' + Math.round((1 - x.o.price / x.was) * 100) + '%', 'c-hot') + chip(fmt(U.inDays, { n: soon }), 'c-dark'));
      }).join('') +
      '<p class="foot-note">' + U.hotNote + '</p>'
  };
};

/* Избранное и «следить за ценой». */
var FT = 'h';
V.fav = function () {
  var list = S.fav.map(hotel).filter(Boolean);
  return {
    html: nav(U.favTitle) + '<div class="lt"><h1>' + U.favTitle + '</h1></div>' +
      '<div class="seg">' + [['h', U.favHotels + ' · ' + list.length], ['w', U.favWatch + ' · ' + S.watch.length]].map(function (x) { return '<button class="' + (FT === x[0] ? 'on' : '') + '" data-act="ftab" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      (FT === 'h'
        ? (list.length ? list.map(function (h) { return hotelCard(h, offers(h, S.sr)[0]); }).join('') : '<div class="empty">' + ic('heart') + '<b>' + U.noFav + '</b><p>' + U.noFavSub + '</p></div>')
        : (S.watch.length ? S.watch.map(function (w) {
            var h = hotel(w.h), now = offers(h, S.sr)[0].price, start = w.p || now, dlt = now - start;
            return '<div class="card wt"><img src="' + photo(h.photos[0], true) + '" alt=""><div><b>' + esc(h.name) + '</b><small>' + U.wasWhenStart + ' ' + usd(start) + '</small><p class="num ' + (dlt < 0 ? 'down' : dlt > 0 ? 'up' : '') + '">' + usd(now) + (dlt ? ' (' + (dlt > 0 ? '+' : '−') + usd(Math.abs(dlt)) + ')' : '') + '</p></div><button class="nb-b" data-act="unwatch" data-h="' + h.id + '" aria-label="' + U.remove + '">' + ic('x', 'sm') + '</button></div>';
          }).join('') + '<button class="btn ghost wide" data-act="priceDrop">' + ic('bell', 'sm') + U.simDrop + '</button><p class="src">' + U.watchHow + '</p>' : '<div class="empty">' + ic('bell') + '<b>' + U.noWatch + '</b><p>' + U.noWatchSub + '</p></div>'))
  };
};

/* Профиль: вход по SMS, туристы, уведомления, язык. */
V.more = function () {
  return {
    html: nav(U.profile) + '<div class="lt"><h1>' + U.profile + '</h1></div>' +
      (S.authed
        ? '<div class="card me"><span class="ava">' + esc((S.name || '?').charAt(0)) + '</span><div><b>' + esc(S.name) + '</b><small class="num">' + esc(S.phone) + '</small></div><button class="btn sm ghost" data-act="logout">' + U.logout + '</button></div>'
        : '<button class="card me login" data-act="login"><span class="ava">' + ic('user') + '</span><div><b>' + U.login + '</b><small>' + U.loginSub + '</small></div>' + ic('chev', 'sm mute') + '</button>') +
      '<div class="card list">' +
        '<button class="ln" data-go="tourists">' + ic('users') + '<span>' + U.savedTourists + '</span><b class="cnt">' + S.tourists.length + '</b>' + ic('chev', 'sm mute') + '</button>' +
        '<button class="ln" data-tab-go="trips">' + ic('suitcase') + '<span>' + U.tripsTitle + '</span><b class="cnt">' + S.trips.length + '</b>' + ic('chev', 'sm mute') + '</button>' +
        '<button class="ln" data-go="alerts">' + ic('bell') + '<span>' + U.alerts + '</span>' + ic('chev', 'sm mute') + '</button>' +
        '<a class="ln" href="' + (L === 'ru' ? TB.uzUrl : TB.ruUrl) + (EMBED ? '?embed=1' : '') + '">' + ic('globe') + '<span>' + U.lang + '</span><b class="cnt">' + (L === 'ru' ? 'Русский' : 'O‘zbekcha') + '</b>' + ic('chev', 'sm mute') + '</a>' +
      '</div>' +
      '<div class="card list">' +
        '<button class="ln" data-go="chat|' + S.trips[S.trips.length-1].id + '">' + ic('chat') + '<span>' + U.writeMgr + '</span>' + ic('chev', 'sm mute') + '</button>' +
        '<button class="ln" data-act="offer">' + ic('doc') + '<span>' + U.offerTitle + '</span>' + ic('chev', 'sm mute') + '</button>' +
        '<button class="ln" data-act="about">' + ic('info') + '<span>' + U.about + '</span>' + ic('chev', 'sm mute') + '</button>' +
        '<button class="ln" data-act="resetDemo">' + ic('refresh') + '<span>' + U.resetDemo + '</span></button>' +
      '</div>' +
      '<p class="foot-note">' + U.demoNote + '</p>'
  };
};
V.tourists = function () {
  return {
    html: nav(U.savedTourists, { back: true, solid: true, right: '<button class="nb-b" data-act="addTourist" aria-label="' + U.add + '">' + ic('plus') + '</button>' }) +
      '<p class="mute sm pad">' + U.savedSub + '</p>' +
      S.tourists.map(function (x, i) { return '<div class="card tr"><span class="ava">' + esc(x.n.charAt(0)) + '</span><div><b>' + esc(x.n) + '</b><small class="num">' + esc(x.b) + ' · ' + esc(x.p.slice(0, 2)) + ' •••' + esc(x.p.slice(-3)) + '</small></div><button class="nb-b" data-act="delTourist" data-i="' + i + '" aria-label="' + U.remove + '">' + ic('x', 'sm') + '</button></div>'; }).join('') +
      '<button class="btn ghost wide" data-act="addTourist">' + ic('plus', 'sm') + U.addTourist + '</button>'
  };
};
V.alerts = function () {
  S.feed.forEach(function (f) { f.read = true; }); save();
  var feed = S.feed.length ? S.feed.slice().reverse() : [{ t: U.feed0, s: U.feed0s, w: U.now }];
  return {
    html: nav(U.alerts, { back: true, solid: true }) +
      '<div class="card list">' + [['status', U.nStatus], ['docs', U.nDocs], ['price', U.nPrice], ['hot', U.nHot]].map(function (x) { return '<label class="ln">' + ic('bell') + '<span>' + x[1] + '</span><input type="checkbox" class="sw" data-act="notif" data-k="' + x[0] + '"' + (S.notif[x[0]] ? ' checked' : '') + '></label>'; }).join('') + '</div>' +
      '<div class="sec"><h3>' + U.feedTitle + '</h3></div>' +
      feed.map(function (f) { return '<div class="card feed"><svg aria-hidden="true"><use href="#tb-mark"/></svg><div><b>' + esc(f.t) + '</b><p>' + esc(f.s) + '</p></div><small>' + esc(f.w) + '</small></div>'; }).join('')
  };
};

/* ── Действия ── */
function sheetPick(title, items, cur, onPick, note) {
  openSheet('<h3 class="sh-t">' + title + '</h3>' + (note ? '<p class="mute">' + note + '</p>' : '') + '<div class="card list">' + items.map(function (x) { return '<button class="ln radio' + (String(x[0]) === String(cur) ? ' on' : '') + '" data-v="' + x[0] + '">' + (x[2] || '') + '<span>' + x[1] + '</span>' + ic('check', 'ok') + '</button>'; }).join('') + '</div>', function (sh) {
    $$('[data-v]', sh).forEach(function (b) { b.addEventListener('click', function () { onPick(b.getAttribute('data-v')); save(); closeSheet(); refresh(top()); buzz(4); }); });
  });
}
function stepper(label, val, min, max, key) { return '<div class="stp"><span>' + label + '</span><div><button data-st="' + key + '" data-d="-1"' + (val <= min ? ' disabled' : '') + ' aria-label="−">' + ic('minus', 'sm') + '</button><b class="num">' + val + '</b><button data-st="' + key + '" data-d="1"' + (val >= max ? ' disabled' : '') + ' aria-label="+">' + ic('plus', 'sm') + '</button></div></div>'; }
function notify(title, sub, onTap) {
  S.feed.push({ t: title, s: sub, w: U.now, read: false }); save();
  var n = $('#push'); $('b', n).textContent = title; $('p', n).textContent = sub;
  n._tap = onTap;
  n.classList.remove('on'); void n.offsetWidth; n.classList.add('on'); buzz([8, 50, 8]);
  clearTimeout(notify.t); notify.t = setTimeout(function () { n.classList.remove('on'); }, 4200);
}
/* Наружу, на страницу с канбаном: заявка упала в Битрикс24, статус сменился. */
function tellSite(m) { if (EMBED && window.parent !== window) try { window.parent.postMessage(m, location.origin); } catch (e) {} }
function tripMsg(t) { var h = hotel(t.h); return { tb: 'deal', id: t.id, deal: t.deal, name: t.names[0] || '', phone: t.phone || S.phone || '', hotel: h.name, dates: range(t.date, t.nights), op: opOf(t.op).name, sum: usd(tripTotal(t)), step: t.step, refused: t.refused, paid: t.paid >= tripTotal(t) }; }
function setStep(t, n, quiet) {
  t.step = n; save();
  if (!quiet && S.notif.status) {
    var st = stepName(t);
    notify(st.t, fmt(U.pushStep, { d: t.deal, h: hotel(t.h).name }), function () { openTrip(t.id); });
  }
  tellSite(tripMsg(t));
}
function openTrip(id) {
  if (cur !== 'trips') { reset(); tab('trips'); }
  var s = stacks.trips; while (s.length > 1) s.pop().remove();
  go('trip', id);
}

var ACT = {
  fromCity: function () { toast(U.fromCityNote); },
  pickDest: function () { sheetPick(U.fTo, [['', U.anyCountry]].concat(TB.dest.map(function (x) { return [x.id, x.name + ' <small class="mute">· ' + x.fly + '</small>']; })), S.sr.dest, function (v) { S.sr.dest = v; }); },
  pickMeal: function () { sheetPick(U.fMeal, [['', U.any]].concat(['BB', 'HB', 'AI', 'UAI'].map(function (k) { return [k, TB.meal[k] + ' <small class="mute">' + k + '</small>']; })), S.sr.meal, function (v) { S.sr.meal = v; }, U.mealNote); },
  pickStars: function () { sheetPick(U.fStars, [['0', U.any], ['3', '3★+'], ['4', '4★+'], ['5', '5★']], S.sr.stars, function (v) { S.sr.stars = +v; }); },
  pickNights: function () {
    var draw = function (sh) {
      sh.innerHTML = '<div class="grab"></div><h3 class="sh-t">' + U.fNights + '</h3><p class="mute">' + U.nightsNote + '</p><div class="card">' + stepper(U.nFrom, S.sr.nf, 3, S.sr.nt, 'nf') + stepper(U.nTo, S.sr.nt, S.sr.nf, 21, 'nt') + '</div><button class="btn pri wide" data-close>' + U.done + '</button>';
      $$('[data-st]', sh).forEach(function (b) { b.addEventListener('click', function () { S.sr[b.getAttribute('data-st')] += +b.getAttribute('data-d'); save(); draw(sh); refresh(top()); buzz(4); }); });
    };
    openSheet('', draw);
  },
  pickPeople: function () {
    var draw = function (sh) {
      var sr = S.sr;
      sh.innerHTML = '<div class="grab"></div><h3 class="sh-t">' + U.fPeople + '</h3><div class="card">' + stepper(U.adults, sr.adults, 1, 4, 'adults') + stepper(U.kids, sr.kids.length, 0, 3, 'kids') +
        sr.kids.map(function (a, i) { return '<label class="stp"><span>' + fmt(U.kidAge, { n: i + 1 }) + '</span><select data-k="' + i + '">' + Array.apply(null, Array(18)).map(function (_, x) { return '<option value="' + x + '"' + (x === +a ? ' selected' : '') + '>' + (x ? x + ' ' + plural(x, U.yearW) : U.under1) + '</option>'; }).join('') + '</select></label>'; }).join('') +
        '</div><p class="mute sm">' + U.kidsNote + '</p><button class="btn pri wide" data-close>' + U.done + '</button>';
      $$('[data-st]', sh).forEach(function (b) {
        b.addEventListener('click', function () {
          var k = b.getAttribute('data-st'), dd = +b.getAttribute('data-d');
          if (k === 'adults') sr.adults += dd; else if (dd > 0) sr.kids.push(7); else sr.kids.pop();
          save(); draw(sh); refresh(top()); buzz(4);
        });
      });
      $$('select', sh).forEach(function (s) { s.addEventListener('change', function () { sr.kids[+s.getAttribute('data-k')] = +s.value; save(); refresh(top()); }); });
    };
    openSheet('', draw);
  },
  pickDates: function () {
    var pick = null;
    var draw = function (sh) {
      var y = TB.dates.year, m = TB.dates.month, first = (new Date(y, m, 1).getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate(), cells = '';
      for (var i = 0; i < first; i++) cells += '<span></span>';
      for (var dn = 1; dn <= days; dn++) {
        var on = pick ? dn === pick : dn >= S.sr.from && dn <= S.sr.to, edge = !pick && (dn === S.sr.from || dn === S.sr.to);
        cells += '<button class="' + (on ? 'on' : '') + (edge ? ' edge' : '') + '" data-dn="' + dn + '">' + dn + '<small>' + (dn % 3 === 0 ? '' : '·') + '</small></button>';
      }
      sh.innerHTML = '<div class="grab"></div><h3 class="sh-t">' + U.fDates + '</h3><p class="mute">' + (pick ? U.pickEnd : U.datesNote) + '</p><div class="cal"><p class="cal-m">' + U.monthName + '</p><div class="cal-w">' + TB.wdMon.map(function (x) { return '<span>' + x + '</span>'; }).join('') + '</div><div class="cal-g">' + cells + '</div></div><p class="mute sm">' + U.calDots + '</p><button class="btn pri wide" data-close>' + U.done + '</button>';
      $$('[data-dn]', sh).forEach(function (b) {
        b.addEventListener('click', function () {
          var dn = +b.getAttribute('data-dn');
          if (!pick) { pick = dn; S.sr.from = dn; S.sr.to = dn; }
          else { S.sr.from = Math.min(pick, dn); S.sr.to = Math.max(pick, dn); pick = null; }
          save(); draw(sh); refresh(top()); buzz(4);
        });
      });
    };
    openSheet('', draw);
  },
  search: function () { if (S.offline) { toast(U.needNet); return; } RS = { sort: 'price', meal: '', stars: 0 }; go('results'); },
  destGo: function (t) { S.sr.dest = t.getAttribute('data-d'); save(); refresh(top()); ACT.search(); },
  sort: function (t) { RS.sort = t.getAttribute('data-v'); buzz(4); if (top()._draw) top()._draw(); },
  rmeal: function (t) { RS.meal = t.getAttribute('data-v'); buzz(4); if (top()._draw) top()._draw(); },
  rstars: function (t) { var s = +t.getAttribute('data-v'); RS.stars = RS.stars === s ? 0 : s; buzz(4); if (top()._draw) top()._draw(); },
  hn: function (t) { V.hotel.n[t.getAttribute('data-h')] = +t.getAttribute('data-v'); buzz(4); refresh(top()); },
  watch: function (t) {
    var id = t.getAttribute('data-h'), w = watched(id);
    if (w) S.watch.splice(S.watch.indexOf(w), 1); else S.watch.push({ h: id, p: offers(hotel(id), S.sr)[0].price });
    save(); toast(w ? U.watchOffT : U.watchOnT); buzz(w ? 6 : [6, 40, 10]); refresh(top());
  },
  watchSearch: function () { var h = TB.hotels.filter(function (x) { return matches(x, S.sr); })[0]; if (h && !watched(h.id)) { S.watch.push({ h: h.id, p: offers(h, S.sr)[0].price }); save(); } toast(U.watchSearchT); },
  watchInfo: function () { FT = 'w'; tab('fav'); refresh(top()); },
  unwatch: function (t) { var w = watched(t.getAttribute('data-h')); if (w) S.watch.splice(S.watch.indexOf(w), 1); save(); refresh(top()); },
  priceDrop: function () {
    var w = S.watch[0]; if (!w) return; var h = hotel(w.h), now = offers(h, S.sr)[0].price;
    if (!w.p) w.p = now; w.p = now + 70; save(); refresh(top());
    notify(U.pushDropT, fmt(U.pushDrop, { h: h.name, p: usd(70), n: usd(now) }), function () { tab('fav'); go('hotel', h.id); });
  },
  ftab: function (t) { FT = t.getAttribute('data-v'); buzz(4); refresh(top()); },
  otherOps: function (t) { back(); back(); },
  flipCheck: function (t) { var a = t.getAttribute('data-t'), p = parseTour(a); var was = CHECK_OUT[a] != null ? CHECK_OUT[a] : /^(lara|kemer)$/.test(p.h.id); CHECK_OUT[a] = !was; var v = top(); var r = V.check(a); v.innerHTML = r.html; r.after(v); bindCommon(v); },
  fillDemo: function () {
    var v = top(), sv = S.tourists;
    B.ppl.forEach(function (x, i) {
      if (x.kind === 'a') { var s = sv[i] || { n: i ? 'ALIYEVA MADINA' : 'ALIYEV AZIZ', b: '02.11.1992', p: 'AC7654321', e: '05.02.2030' }; x.n = s.n; x.b = s.b; x.p = s.p; x.e = s.e; }
      else { x.n = 'ALIYEV TIMUR'; x.b = '10.05.' + (2026 - (+x.age || 7)); x.p = 'AD' + (1000000 + i * 4321); x.e = '01.09.2030'; }
    });
    if (digits(B.phone).length < 12) B.phone = '+998 90 123 45 67';
    B.ok = true; S.phone = S.phone || B.phone; save();
    var r = V.book(B.arg); v.innerHTML = r.html; r.after(v); bindCommon(v); buzz(6);
  },
  useSaved: function (t) {
    var s = S.tourists[+t.getAttribute('data-i')], v = top();
    var slot = B.ppl.filter(function (x) { return !x.n; })[0] || B.ppl[0];
    slot.n = s.n; slot.b = s.b; slot.p = s.p; slot.e = s.e;
    var r = V.book(B.arg); v.innerHTML = r.html; r.after(v); bindCommon(v); buzz(6);
  },
  offer: function () { openSheet('<h3 class="sh-t">' + U.offerTitle + '</h3><p>' + U.offerText + '</p><p class="src">' + U.offerSrc + '</p><button class="btn ghost wide" data-close>' + U.close + '</button>'); },
  bsend: function () {
    var p = String(B.arg).split(':'), t0 = parseTour(p.slice(0, 4).join(':'));
    S.seq = (S.seq || 20431) + 1;
    var t = { id: 'D-' + S.seq, deal: 'D-' + S.seq, h: t0.h.id, op: t0.op, date: t0.date, nights: t0.nights, adults: S.sr.adults, kids: S.sr.kids.slice(), names: B.ppl.map(function (x) { return x.n; }), price: B.price, paid: 0, step: 0, extras: B.extras.slice(), refused: false, phone: B.phone, card: '4417', method: 'click' };
    S.trips.push(t); S.phone = B.phone;
    B.ppl.forEach(function (x) { if (!S.tourists.some(function (s) { return s.n === x.n; })) S.tourists.push({ n: x.n, b: x.b, p: x.p, e: x.e }); });
    save(); badge();
    tellSite(tripMsg(t));
    go('booked', t.id);
    var s = stacks[cur]; setTimeout(function () { s.splice(1, s.length - 2).forEach(function (x) { x.remove(); }); }, 450);
    setTimeout(function () { if (t.step === 0) setStep(t, 1); }, 4200);
  },
  openTrip: function (t) { openTrip(t.getAttribute('data-id')); },
  pmode: function (t) { PAY.mode = t.getAttribute('data-v'); buzz(4); refresh2(); },
  pm: function (t) { PAY.m = t.getAttribute('data-v'); buzz(4); refresh2(); },
  paygo: function (t) {
    var tr = tripById(t.getAttribute('data-id')), a = +t.getAttribute('data-a');
    var name = { click: 'Click', payme: 'Payme', uzum: 'Uzum Bank', card: 'Uzcard / Humo', visa: 'Visa / Mastercard', nasiya: U.pmNasiya }[PAY.m];
    openSheet('<h3 class="sh-t">' + name + '</h3><p class="mute">' + (PAY.m === 'nasiya' ? U.nasiyaFlow : U.payFlow) + '</p><div class="pay-sum sm"><b class="num">' + usd(a) + '</b><small>' + U.paySom + '</small></div><div class="card form"><label class="fld"><span>' + U.cardNo + '</span><input value="8600 •••• •••• 4417" readonly></label></div><div class="otp" id="potp">' + [0, 1, 2, 3, 4, 5].map(function () { return '<input inputmode="numeric" maxlength="1" class="num">'; }).join('') + '</div><p class="src center">' + U.smsDemo + '</p><button class="btn pri wide" id="pok">' + U.confirm + '</button>', function (sh) {
      var ins = $$('#potp input', sh);
      ins.forEach(function (inp, i) { inp.addEventListener('input', function () { inp.value = digits(inp.value).slice(-1); if (inp.value && ins[i + 1]) ins[i + 1].focus(); }); });
      $('#pok', sh).onclick = function () {
        var b = this; b.disabled = true; b.textContent = U.paying;
        setTimeout(function () {
          tr.paid = (tr.paid || 0) + a; tr.method = PAY.m; save(); closeSheet();
          var sx = stacks[cur]; go('paid', tr.id + ':' + a);
          setTimeout(function () { sx.splice(1, sx.length - 2).forEach(function (x) { if (x._name !== 'trip') x.remove(); }); }, 450);
          if (tr.step === 3 && tr.paid >= tripTotal(tr)) setTimeout(function () { setStep(tr, 4); }, 2600);
          tellSite(tripMsg(tr));
          if (tr.step < 3 && tr.paid >= tripTotal(tr)) toast(U.paidEarly);
        }, REDUCED ? 100 : 1200);
      };
    });
  },
  advance: function (t) {
    var tr = tripById(t.getAttribute('data-id'));
    var paidAll = tr.paid >= tripTotal(tr);
    if (tr.step === 3 && !paidAll) { toast(U.needPay); return; }
    var n = tr.step + 1;
    if (n === 3 && paidAll) n = 4;
    setStep(tr, n); refresh(top());
  },
  refuse: function (t) { var tr = tripById(t.getAttribute('data-id')); tr.refused = true; save(); notify(U.stRefused, fmt(U.pushRefuse, { d: tr.deal }), function () { openTrip(tr.id); }); tellSite(tripMsg(tr)); refresh(top()); },
  unrefuse: function (t) { var tr = tripById(t.getAttribute('data-id')); tr.refused = false; save(); tellSite(tripMsg(tr)); refresh(top()); },
  similar: function (t) { var h = hotel(t.getAttribute('data-h')); S.sr.dest = h.dest; save(); tab('home'); ACT.search(); },
  offline: function () { S.offline = !S.offline; save(); root.classList.toggle('is-off', S.offline); toast(S.offline ? U.offlineOn : U.offlineOff); refreshAll(); },
  share: function () { toast(U.shareT); },
  saveFile: function () { toast(U.savedT); },
  say: function (t) { $('#cin').value = t.getAttribute('data-t'); ACT.send(); },
  send: function () {
    var inp = $('#cin'); if (!inp || !inp.value.trim()) return;
    S.chat.push({ me: true, t: inp.value.trim() }); inp.value = ''; save();
    var c = $('#chat'); c.insertAdjacentHTML('beforeend', msg(S.chat[S.chat.length-1]) + '<p class="msg typing" id="typing"><i></i><i></i><i></i></p>'); top().scrollTop = 1e6;
    setTimeout(function () { var x = $('#typing'); if (x) x.remove(); S.chat.push({ me: false, t: U.chatReply }); save(); if (c.isConnected) { c.insertAdjacentHTML('beforeend', msg(S.chat[S.chat.length-1])); top().scrollTop = 1e6; } buzz(6); }, REDUCED ? 200 : 1500);
  },
  tg: function () { toast(U.tgNote); },
  notif: function (t) { S.notif[t.getAttribute('data-k')] = t.checked; save(); buzz(4); toast(t.checked ? U.on : U.off); },
  login: function () {
    openSheet('<h3 class="sh-t">' + U.login + '</h3><p class="mute">' + U.loginSub + '</p><div class="card form"><label class="fld"><span>' + U.fName + '</span><input id="ln" autocomplete="name" placeholder="' + U.fNamePh + '"></label><label class="fld"><span>' + U.fPhone + '</span><input id="lp" value="+998 " inputmode="tel" autocomplete="tel"></label></div><button class="btn pri wide" id="lgo" disabled>' + U.getCode + '</button>', function (sh) {
      var chk = function () { $('#lgo', sh).disabled = !($('#ln', sh).value.trim().length > 1 && digits($('#lp', sh).value).length === 12); };
      phoneMask($('#lp', sh), chk); $('#ln', sh).addEventListener('input', chk);
      $('#lgo', sh).onclick = function () {
        S.name = $('#ln', sh).value.trim(); S.phone = $('#lp', sh).value;
        sh.innerHTML = '<div class="grab"></div><h3 class="sh-t">' + U.codeTitle + '</h3><p class="mute">' + fmt(U.codeSub, { p: esc(S.phone) }) + '</p><div class="otp" id="otp">' + [0, 1, 2, 3].map(function () { return '<input inputmode="numeric" maxlength="1" class="num">'; }).join('') + '</div><p class="src center">' + U.codeDemo + '</p>';
        var ins = $$('#otp input', sh); ins[0].focus();
        ins.forEach(function (inp, i) {
          inp.addEventListener('input', function () {
            inp.value = digits(inp.value).slice(-1);
            if (inp.value && ins[i + 1]) ins[i + 1].focus();
            if (ins.every(function (x) { return x.value; })) { S.authed = true; save(); closeSheet(); toast(U.loggedIn); refreshAll(); buzz([8, 40, 8]); }
          });
        });
      };
    });
  },
  logout: function () { S.authed = false; save(); refresh(top()); },
  addTourist: function () {
    openSheet('<h3 class="sh-t">' + U.addTourist + '</h3><div class="card form"><label class="fld"><span>' + U.fLatin + '</span><input id="tn" autocapitalize="characters" placeholder="ALIYEV AZIZ"></label><label class="fld"><span>' + U.fBirth + '</span><input id="tb" inputmode="numeric" placeholder="' + U.datePh + '"></label><label class="fld"><span>' + U.fPass + '</span><input id="tp" autocapitalize="characters" placeholder="AB1234567"></label><label class="fld"><span>' + U.fPassTill + '</span><input id="te" inputmode="numeric" placeholder="' + U.datePh + '"></label></div><button class="btn pri wide" id="tgo" disabled>' + U.save + '</button>', function (sh) {
      var chk = function () { $('#tgo', sh).disabled = !(/^[A-Z' -]+ [A-Z' -]+$/.test($('#tn', sh).value.trim()) && $('#tb', sh).value.length === 10 && /^[A-Z]{2}\d{7}$/.test($('#tp', sh).value) && $('#te', sh).value.length === 10); };
      ['tn', 'tp'].forEach(function (k) { $('#' + k, sh).addEventListener('input', function (e) { e.target.value = e.target.value.toUpperCase(); chk(); }); });
      ['tb', 'te'].forEach(function (k) { $('#' + k, sh).addEventListener('input', function (e) { e.target.value = dateMask(e.target.value); chk(); }); });
      $('#tgo', sh).onclick = function () { S.tourists.push({ n: $('#tn', sh).value.trim(), b: $('#tb', sh).value, p: $('#tp', sh).value, e: $('#te', sh).value }); save(); closeSheet(); refresh(top()); toast(U.savedTourist); };
    });
  },
  delTourist: function (t) { S.tourists.splice(+t.getAttribute('data-i'), 1); save(); refresh(top()); },
  about: function () { openSheet('<h3 class="sh-t">' + TB.brand + '</h3><p>' + U.aboutText + '</p><p class="src">' + U.aboutSrc + '</p><a class="btn ghost wide" href="' + TB.terms + '" target="_blank" rel="noopener">' + U.termsLink + '</a>'); },
  resetDemo: function () { try { localStorage.removeItem(KEY); } catch (e) {} location.reload(); },
};
function refresh2() { var v = top(), y = v.scrollTop, r = V[v._name](v._arg); v.innerHTML = r.html; if (r.after) r.after(v); bindCommon(v); v.scrollTop = y; }

/* Уведомление сверху, как настоящее. */
var push = d.createElement('div');
push.id = 'push'; push.className = 'push'; push.setAttribute('role', 'status');
push.innerHTML = '<svg aria-hidden="true"><use href="#tb-mark"/></svg><div><b></b><p></p></div><small>' + U.now + '</small>';
push.addEventListener('click', function () { push.classList.remove('on'); if (push._tap) push._tap(); });
app.appendChild(push);

/* ── Старт ── */
root.classList.toggle('is-off', !!S.offline);
TABS.forEach(function (t) { var b = $('[data-tab="' + t + '"]', tabsEl); if (b) b.setAttribute('aria-selected', t === 'home'); });
var first = build('home'); stacks.home.push(first); mount(first);
$('[data-tab="home"]', tabsEl).classList.add('on');
badge();
var splash = $('#splash');
if (REDUCED) splash.remove();
else setTimeout(function () { splash.classList.add('out'); setTimeout(function () { splash.remove(); }, 520); }, S.seen ? 600 : 1400);
S.seen = true; save();
/* Странице с канбаном: брони, которые уже есть. */
setTimeout(function () { S.trips.forEach(function (t) { tellSite(tripMsg(t)); }); }, 300);

/* Сайт снаружи может попросить открыть нужный экран (кнопки у айфона и канбан). */
function demoT() { var t = tripById(DEMO_TRIP.deal); if (!t) { t = demoTrip(); S.trips.unshift(t); save(); } return t; }
function lastT() { return S.trips[S.trips.length-1]; }
var JUMP = {
  home: function () { tab('home'); },
  results: function () { tab('home'); ACT.search(); },
  hotel: function () { tab('home'); go('hotel', 'lara'); },
  tour: function () { tab('home'); var h = hotel('lara'); go('tour', tourId(offers(h, S.sr)[0], h)); },
  check: function () { tab('home'); var h = hotel('lara'); go('check', tourId(offers(h, S.sr)[0], h)); },
  book: function () { tab('home'); var h = hotel('sharm'), o = offers(h, S.sr)[0]; go('book', tourId(o, h) + ':' + o.price); },
  pay: function () { var t = lastT(); if (t.paid >= tripTotal(t)) { t = demoT(); t.paid = 0; t.step = 2; save(); } openTrip(t.id); go('pay', t.id); },
  trip: function () { openTrip(lastT().id); },
  docs: function () { var t = demoT(); if (t.step < 4) setStep(t, 4, true); openTrip(t.id); go('doc', t.id + ':voucher'); },
  chat: function () { openTrip(lastT().id); go('chat', lastT().id); },
  hot: function () { tab('hot'); },
  fav: function () { FT = 'w'; tab('fav'); },
  more: function () { tab('more'); },
  push: function () { tab('fav'); FT = 'w'; refresh(top()); setTimeout(ACT.priceDrop, 400); },
  /* Канбан: менеджер передвинул сделку или приложил файл. */
  status: function (m) {
    var t = m && tripById(m.id) || demoT();
    t.refused = !!m.refused;
    if (m.refused) { save(); notify(U.stRefused, fmt(U.pushRefuse, { d: t.deal }), function () { openTrip(t.id); }); }
    else {
      if (m.step >= 3 && !(t.paid >= tripTotal(t))) t.paid = tripTotal(t);
      setStep(t, m.step);
      if (m.step === 4) notify(U.pushDocsT, fmt(U.pushDocs, { d: t.deal }), function () { openTrip(t.id); });
    }
    openTrip(t.id);
  },
  /* Поиск с первого экрана сайта. */
  find: function (m) {
    if (m) { S.sr.dest = m.dest || ''; S.sr.adults = Math.min(Math.max(+m.adults || 2, 1), 4); S.sr.kids = []; for (var i = 0; i < (+m.kids || 0); i++) S.sr.kids.push(7); if (m.nights) { S.sr.nf = +m.nights; S.sr.nt = +m.nights + 2; } save(); }
    stacks.home.forEach(function (v, i) { if (i) v.remove(); }); stacks.home.length = Math.min(stacks.home.length, 1);
    tab('home'); refresh(top()); ACT.search();
  },
};
window.addEventListener('message', function (e) {
  if (e.origin !== location.origin || !e.data || e.data.tb !== 'jump') return;
  var f = JUMP[e.data.to]; if (!f) return;
  if (e.data.to !== 'status') reset();
  else { closeSheet(); if (cur) { var o = top(); if (o) o.hidden = true; } TABS.forEach(function (t) { while (stacks[t].length > 1) stacks[t].pop().remove(); }); cur = null; }
  f(e.data);
});
$$('[data-jump]').forEach(function (b) { b.addEventListener('click', function () { reset(); JUMP[b.getAttribute('data-jump')](); }); });
var m = /[?&]to=(\w+)/.exec(Q); if (m && JUMP[m[1]]) setTimeout(JUMP[m[1]], 60);
})();
