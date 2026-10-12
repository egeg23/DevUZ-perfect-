(function(){
'use strict';
/* main: демо мини-приложения Giftora. Только игровая валюта, всё в localStorage. */
var root = document.documentElement;
var EN = root.lang === 'en';
var L = function(r, e){ return EN ? e : r; };
var BASE = root.getAttribute('data-base') || '';
var TERMS = 'https://devuz.studio/' + (EN ? 'en' : 'ru') + '/mockup-terms';
var REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
var $ = function(s, el){ return (el || document).querySelector(s); };
var $$ = function(s, el){ return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
var rnd = Math.random;
var pick = function(a){ return a[Math.floor(rnd() * a.length)]; };
var clamp = function(v, a, b){ return Math.max(a, Math.min(b, v)); };
var r2 = function(v){ return Math.round(v * 100) / 100; };
function fmt(v){
  v = Number(v) || 0;
  var s = v >= 1000 ? String(Math.round(v)) : v >= 100 ? v.toFixed(1) : v.toFixed(2);
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}
function ic(k, c){ return '<svg class="ic ' + (c || '') + '"><use href="#i-' + k + '"/></svg>'; }
function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

/* Настройки из панели оператора (BASE/admin): RTP, промокоды, блокировка. Общие через localStorage. */
var AKEY = 'gx-admin-1';
var RTP_DEF = { box: 90, rocket: 96, dice: 96, upgrade: 92, pvp: 95 };
function adm(){ try { var a = JSON.parse(localStorage.getItem(AKEY) || 'null'); if (a && a.v === 1) return a; } catch (e) {} return null; }
function rtp(k){ var a = adm(), v = a && a.rtp ? +a.rtp[k] : 0; return (v >= 50 && v <= 99.5 ? v : RTP_DEF[k]) / 100; }
function banned(){ var a = adm(); return !!(a && a.users && a.users.me && a.users.me.ban); }

/* ── Telegram: SDK, если он есть, иначе мост событий Telegram напрямую ── */
var TG = (function(){
  var w = window.Telegram && window.Telegram.WebApp;
  var hp = new URLSearchParams(location.hash.slice(1));
  var inTg = !!(w && w.initData) || hp.has('tgWebAppData') || hp.has('tgWebAppVersion') || !!window.TelegramWebviewProxy;
  var subs = {};
  function emit(type, data){ (subs[type] || []).forEach(function(f){ try { f(data); } catch (e) {} }); }
  function post(type, data){
    if (!inTg) return;
    var body = JSON.stringify(data || {});
    try {
      if (window.TelegramWebviewProxy) window.TelegramWebviewProxy.postEvent(type, body);
      else if (window.external && 'notify' in window.external) window.external.notify(JSON.stringify({ eventType: type, eventData: data || {} }));
      else if (window.parent !== window) window.parent.postMessage(JSON.stringify({ eventType: type, eventData: data || {} }), '*');
    } catch (e) {}
  }
  if (!w) {
    window.Telegram = window.Telegram || {};
    if (!window.Telegram.WebView) window.Telegram.WebView = { receiveEvent: emit };
    addEventListener('message', function(e){
      try { var m = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; if (m && m.eventType) emit(m.eventType, m.eventData); } catch (_) {}
    });
  }
  var theme = null, user = null;
  try { theme = w ? w.themeParams : JSON.parse(hp.get('tgWebAppThemeParams') || 'null'); } catch (e) {}
  try { user = w ? (w.initDataUnsafe && w.initDataUnsafe.user) : JSON.parse(new URLSearchParams(hp.get('tgWebAppData') || '').get('user') || 'null'); } catch (e) {}
  var backFn = null;
  if (w && w.BackButton) w.BackButton.onClick(function(){ if (backFn) backFn(); });
  else { var onBack = function(){ if (backFn) backFn(); }; subs.back_button_pressed = [onBack]; }
  return {
    inTg: inTg, theme: theme, user: user,
    ready: function(){
      if (w) { try { w.ready(); w.expand(); w.setHeaderColor('#0c0b16'); w.setBackgroundColor('#0c0b16'); w.disableVerticalSwipes && w.disableVerticalSwipes(); } catch (e) {} }
      else { post('web_app_ready'); post('web_app_expand'); post('web_app_set_header_color', { color: '#0c0b16' }); post('web_app_set_background_color', { color: '#0c0b16' }); post('web_app_setup_swipe_behavior', { allow_vertical_swipe: false }); }
    },
    haptic: function(kind){
      try {
        if (w && w.HapticFeedback) {
          if (/success|error|warning/.test(kind)) w.HapticFeedback.notificationOccurred(kind);
          else if (kind === 'select') w.HapticFeedback.selectionChanged();
          else w.HapticFeedback.impactOccurred(kind);
        } else if (inTg) {
          post('web_app_trigger_haptic_feedback', kind === 'select' ? { type: 'selection_change' } : /success|error|warning/.test(kind) ? { type: 'notification', notification_type: kind } : { type: 'impact', impact_style: kind });
        }
      } catch (e) {}
    },
    back: function(fn){
      backFn = fn;
      try {
        if (w && w.BackButton) { if (fn) w.BackButton.show(); else w.BackButton.hide(); }
        else post('web_app_setup_back_button', { is_visible: !!fn });
      } catch (e) {}
    },
    openLink: function(url){ if (w && w.openTelegramLink && /^https:\/\/t\.me\//.test(url)) w.openTelegramLink(url); else window.open(url, '_blank', 'noopener'); }
  };
})();
if (TG.inTg) root.classList.add('tg');
(function(){
  var th = TG.theme;
  if (!th || !th.bg_color) return;
  var m = /^#?([0-9a-f]{6})$/i.exec(th.bg_color);
  if (!m) return;
  var n = parseInt(m[1], 16), lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  if (lum > 0.6) root.classList.add('light');
})();

/* ── Подарки: модель, фон, редкость, цена в демо-TON ── */
var MODELS = {
  lolli: [1.2, 'Леденец', 'Lollipop'], cake: [1.4, 'Торт', 'Cake'], candle: [1.6, 'Свеча', 'Candle'],
  flame: [2, 'Тихое пламя', 'Quiet Flame'], clover: [2.4, 'Клевер', 'Clover'], peach: [3.2, 'Персик', 'Peach'],
  star: [3.8, 'Звезда', 'Star'], bear: [4.5, 'Мишка', 'Teddy'], lamp: [5, 'Лампа джинна', 'Genie Lamp'],
  rose: [6, 'Вечная роза', 'Forever Rose'], frog: [8, 'Принц-лягушка', 'Frog Prince'], trophy: [9, 'Мини-кубок', 'Mini Cup'],
  potion: [11, 'Зелье', 'Potion'], gem: [14, 'Кристалл', 'Crystal'], ring: [18, 'Кольцо', 'Ring'],
  watch: [28, 'Часы', 'Watch'], helmet: [35, 'Шлем рыцаря', 'Knight Helmet'], cap: [60, 'Фуражка капитана', 'Captain Cap'],
  crown: [120, 'Корона', 'Crown'], locket: [300, 'Медальон-сердце', 'Heart Locket'], cat: [900, 'Плюшевый кот', 'Plush Cat']
};
var NEW = { potion: 1, frog: 1, flame: 1 };
var BGS = {
  mint: [1, 'Мята', 'Mint', 'hsl(160 60% 62%)', 'hsl(170 55% 30%)'],
  sky: [1, 'Небо', 'Sky', 'hsl(200 85% 66%)', 'hsl(215 70% 34%)'],
  lav: [1.05, 'Лаванда', 'Lavender', 'hsl(265 80% 76%)', 'hsl(262 50% 36%)'],
  apricot: [1.05, 'Абрикос', 'Apricot', 'hsl(26 95% 72%)', 'hsl(8 70% 42%)'],
  fuchsia: [1.1, 'Фуксия', 'Fuchsia', 'hsl(330 85% 72%)', 'hsl(325 55% 36%)'],
  emerald: [1.2, 'Изумруд', 'Emerald', 'hsl(145 65% 50%)', 'hsl(160 70% 18%)'],
  sunset: [1.25, 'Закат', 'Sunset', 'hsl(38 100% 64%)', 'hsl(350 70% 40%)'],
  cobalt: [1.3, 'Кобальт', 'Cobalt', 'hsl(225 90% 64%)', 'hsl(240 70% 24%)'],
  black: [2.5, 'Black', 'Black', 'hsl(230 10% 28%)', 'hsl(230 15% 5%)'],
  onyx: [4, 'Onyx Black', 'Onyx Black', 'hsl(250 14% 20%)', 'hsl(0 0% 1%)']
};
var COMMON_BG = ['mint', 'sky', 'lav', 'apricot', 'fuchsia', 'emerald', 'sunset', 'cobalt'];
var RAR = [[L('Обычный', 'Common'), 'r0'], [L('Редкий', 'Rare'), 'r1'], [L('Эпический', 'Epic'), 'r2'], [L('Легендарный', 'Legendary'), 'r3'], [L('Мифический', 'Mythic'), 'r4']];
function val(g){ return g.ton != null ? g.ton : r2(MODELS[g.m][0] * BGS[g.b][0]); }
function rar(g){ var v = val(g); return v < 3 ? 0 : v < 10 ? 1 : v < 40 ? 2 : v < 200 ? 3 : 4; }
function gname(g){ return g.ton != null ? fmt(g.ton) + ' TON' : MODELS[g.m][EN ? 2 : 1]; }
function bname(g){ return g.ton != null ? L('на баланс', 'to balance') : BGS[g.b][EN ? 2 : 1]; }
function art(g, cls){
  if (g.ton != null) return '<div class="ga coin ' + (cls || '') + '"><svg viewBox="0 0 24 24"><use href="#i-ton"/></svg></div>';
  var B = BGS[g.b];
  return '<div class="ga ' + (cls || '') + (g.b === 'black' || g.b === 'onyx' ? ' dark' : '') + '" style="--b1:' + B[3] + ';--b2:' + B[4] + '"><svg viewBox="0 0 100 100"><use href="#g-' + g.m + '"/></svg></div>';
}
function card(g, extra){
  var r = rar(g);
  return '<div class="gc ' + RAR[r][1] + '">' + art(g) + '<div class="gc-t"><b>' + esc(gname(g)) + '</b><small>' + esc(bname(g)) + '</small></div><span class="gc-v">' + ic('ton') + fmt(val(g)) + '</span>' + (extra || '') + '</div>';
}

/* ── Боксы: шансы считаются так, чтобы бокс в среднем отдавал 90% цены ── */
var BOXES = [
  { id: 'free', n: 'FREE24', p: 0, ev: 0.3, c: ['hsl(150 70% 45%)', 'hsl(150 80% 60%)', 'hsl(48 100% 62%)'], items: [{ ton: 0.05 }, { ton: 0.1 }, { ton: 0.25 }, { ton: 0.5 }, ['lolli', 'mint'], ['candle', 'sky'], ['cake', 'apricot'], ['star', 'lav'], ['clover', 'emerald'], ['bear', 'fuchsia'], ['gem', 'cobalt']] },
  { id: 'start', n: L('Стартовый', 'Starter'), p: 1.5, c: ['hsl(205 85% 55%)', 'hsl(200 90% 68%)', 'hsl(0 0% 100%)'], items: [{ ton: 0.5 }, ['lolli', 'mint'], ['cake', 'sky'], ['candle', 'lav'], ['flame', 'mint'], ['clover', 'sky'], ['star', 'apricot'], ['peach', 'fuchsia'], ['bear', 'sky'], ['rose', 'emerald'], ['gem', 'sky'], ['watch', 'sky']] },
  { id: 'sweet', n: L('Сладкий', 'Sweet'), p: 3, c: ['hsl(335 85% 60%)', 'hsl(330 90% 74%)', 'hsl(48 100% 70%)'], items: [['lolli', 'fuchsia'], ['cake', 'apricot'], ['candle', 'fuchsia'], ['peach', 'apricot'], ['star', 'sunset'], ['bear', 'lav'], ['rose', 'fuchsia'], ['lamp', 'sunset'], ['locket', 'fuchsia']] },
  { id: 'farm', n: 'FARM BOX', p: 5, tag: L('Новые коллекции', 'New collections'), c: ['hsl(95 60% 45%)', 'hsl(80 70% 58%)', 'hsl(30 90% 55%)'], items: [['flame', 'sky'], ['clover', 'emerald'], ['peach', 'apricot'], ['lamp', 'lav'], ['frog', 'emerald'], ['potion', 'lav'], ['frog', 'black'], ['potion', 'onyx']] },
  { id: 'luck', n: L('Удача', 'Lucky'), p: 7, c: ['hsl(268 80% 58%)', 'hsl(276 90% 72%)', 'hsl(42 96% 62%)'], items: [['clover', 'emerald'], ['star', 'sunset'], ['lamp', 'cobalt'], ['trophy', 'sunset'], ['gem', 'cobalt'], ['ring', 'lav'], ['watch', 'apricot'], ['helmet', 'sky'], ['cap', 'cobalt']] },
  { id: 'night', n: L('Ночной', 'Night'), p: 15, tag: 'Black · Onyx', c: ['hsl(240 12% 22%)', 'hsl(240 10% 34%)', 'hsl(268 90% 70%)'], items: [['candle', 'black'], ['rose', 'black'], ['frog', 'black'], ['gem', 'onyx'], ['watch', 'onyx'], ['cap', 'black'], ['crown', 'black'], ['locket', 'black']] },
  { id: 'legend', n: L('Легенда', 'Legend'), p: 40, c: ['hsl(40 95% 50%)', 'hsl(45 100% 66%)', 'hsl(350 85% 58%)'], items: [['gem', 'emerald'], ['trophy', 'black'], ['helmet', 'sky'], ['cap', 'mint'], ['ring', 'onyx'], ['watch', 'onyx'], ['crown', 'sky'], ['locket', 'fuchsia'], ['cat', 'lav']] }
];
BOXES.forEach(function(b){ b.items = b.items.map(function(x){ return Array.isArray(x) ? { m: x[0], b: x[1] } : x; }); });
function odds(){ BOXES.forEach(function(b){
  var vs = b.items.map(val), target = b.ev != null ? b.ev : b.p * rtp('box');
  var ev = function(a){ var w = vs.map(function(v){ return Math.pow(v, -a); }), s = w.reduce(function(x, y){ return x + y; }, 0); return { w: w, s: s, e: vs.reduce(function(acc, v, i){ return acc + v * w[i] / s; }, 0) }; };
  var lo = -2, hi = 9;
  for (var k = 0; k < 60; k++) { var mid = (lo + hi) / 2; if (ev(mid).e > target) lo = mid; else hi = mid; }
  var res = ev((lo + hi) / 2);
  b.ch = res.w.map(function(w){ return w / res.s; });
}); }
odds();
function boxArt(b, cls){ return '<div class="bx ' + (cls || '') + '" style="--c1:' + b.c[0] + ';--c2:' + b.c[1] + ';--c3:' + b.c[2] + '"><svg viewBox="0 0 100 100"><use href="#g-box"/></svg></div>'; }
function drawFrom(b){ var x = rnd(), acc = 0; for (var i = 0; i < b.items.length; i++) { acc += b.ch[i]; if (x <= acc) return i; } return b.items.length - 1; }
function pct(p){ return p >= 0.1 ? (p * 100).toFixed(1) + '%' : p >= 0.001 ? (p * 100).toFixed(2) + '%' : (p * 100).toFixed(3) + '%'; }

/* ── Состояние ── */
var KEY = 'gx-demo-1';
function weekId(){ return Math.floor((Date.now() / 864e5 + 3) / 7); }
function weekEnd(){ return ((weekId() + 1) * 7 - 3) * 864e5; }
function fresh(){
  return { v: 1, bal: 25, inv: [], pts: 0, all: 0, wk: weekId(), tix: 2, pool: 0, free: 0, used: {}, freeOpens: {}, tasks: {}, cnt: {}, snd: false, q: 'high', nid: 1, best: 0, ref: 0, rk: [], dc: [] };
}
var S = null;
try { S = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
if (!S || S.v !== 1) {
  S = fresh();
  [['peach', 'mint'], ['candle', 'sky'], ['star', 'lav'], ['rose', 'black']].forEach(function(x){ S.inv.push({ id: S.nid++, m: x[0], b: x[1], at: Date.now() }); });
}
if (S.wk !== weekId()) { S.wk = weekId(); S.pts = 0; S.cnt = {}; S.tasks = {}; S.pool = 0; }
function save(){ try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
function addGift(g){ var x = { id: S.nid++, m: g.m, b: g.b, at: Date.now() }; S.inv.push(x); return x; }
function count(k, n){ S.cnt[k] = (S.cnt[k] || 0) + (n || 1); }
function depDay(v){ var d = new Date(); d.setHours(0, 0, 0, 0); S.dd = S.dd || {}; S.dd[d.getTime()] = r2((S.dd[d.getTime()] || 0) + v); }
function points(n){ n = Math.round(n); S.pts += n; S.all += n; }

/* ── Звук: синтез WebAudio, по умолчанию выключен ── */
var AC = null;
function tone(f, d, type, vol, at, f2){
  var t0 = AC.currentTime + (at || 0), o = AC.createOscillator(), g = AC.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(f, t0);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + d);
  g.gain.setValueAtTime(vol || 0.06, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  o.connect(g); g.connect(AC.destination); o.start(t0); o.stop(t0 + d + 0.02);
}
function snd(kind){
  if (!S.snd) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (kind === 'tick') tone(1400, 0.035, 'triangle', 0.035);
    else if (kind === 'win') [523, 659, 784, 1047].forEach(function(f, i){ tone(f, 0.22, 'triangle', 0.06, i * 0.08); });
    else if (kind === 'big') [523, 659, 784, 1047, 1319, 1568].forEach(function(f, i){ tone(f, 0.3, 'triangle', 0.07, i * 0.07); });
    else if (kind === 'lose') tone(320, 0.45, 'sawtooth', 0.04, 0, 90);
    else if (kind === 'coin') { tone(988, 0.08, 'square', 0.04); tone(1319, 0.25, 'square', 0.04, 0.08); }
    else if (kind === 'tap') tone(660, 0.05, 'sine', 0.04);
    else if (kind === 'boom') tone(140, 0.6, 'sawtooth', 0.08, 0, 40);
  } catch (e) {}
}

/* ── Эффекты: конфетти и вспышка на одном canvas поверх приложения ── */
var app = $('#app'), fx = $('#fx'), fctx = fx.getContext('2d'), parts = [], fxRun = false;
function fxSize(){ var r = app.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1); fx.width = Math.round(r.width * d); fx.height = Math.round(r.height * d); fctx.setTransform(d, 0, 0, d, 0, 0); }
var CONF = ['#ffd45c', '#ff5c8a', '#8f6bff', '#45d5ff', '#52e08f', '#ffffff'];
function confetti(n, x, y){
  if (REDUCED) n = Math.round(n / 4);
  if (S.q === 'medium') n = Math.round(n * 0.6); else if (S.q === 'low') n = Math.round(n * 0.3);
  var r = app.getBoundingClientRect();
  x = x == null ? r.width / 2 : x; y = y == null ? r.height * 0.42 : y;
  for (var i = 0; i < n; i++) {
    var a = rnd() * Math.PI * 2, s = 260 + rnd() * 520;
    parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 380, w: 5 + rnd() * 6, h: 8 + rnd() * 8, r: rnd() * 6, vr: (rnd() - 0.5) * 14, c: pick(CONF), life: 1.8 + rnd() * 1.2, t: 0 });
  }
  if (!fxRun) { fxRun = true; fxSize(); var last = performance.now(); requestAnimationFrame(function step(now){
    var dt = Math.min(0.033, (now - last) / 1000); last = now;
    var w = fx.width, h = fx.height; fctx.clearRect(0, 0, w, h);
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i]; p.t += dt;
      if (p.t > p.life) { parts.splice(i, 1); continue; }
      p.vx *= 0.985; p.vy = p.vy * 0.985 + 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
      fctx.save(); fctx.globalAlpha = Math.min(1, (p.life - p.t) * 2); fctx.translate(p.x, p.y); fctx.rotate(p.r);
      fctx.fillStyle = p.c; fctx.fillRect(-p.w / 2, -p.h / 2 * Math.abs(Math.cos(p.r * 1.7)), p.w, p.h * Math.abs(Math.cos(p.r * 1.7)) + 1); fctx.restore();
    }
    if (parts.length) requestAnimationFrame(step); else { fxRun = false; fctx.clearRect(0, 0, w, h); }
  }); }
}
function flash(kind){ var f = $('#flash'); f.className = 'flash'; void f.offsetWidth; f.className = 'flash on ' + (kind || ''); }
function celebrate(big){ confetti(big ? 160 : 70); flash(big ? 'gold' : ''); snd(big ? 'big' : 'win'); TG.haptic('success'); }

/* ── Баланс и шапка ── */
var balEl = $('#bal'), shown = S.bal, balAnim = 0;
function renderBal(){
  var from = shown, to = S.bal, t0 = performance.now();
  cancelAnimationFrame(balAnim);
  var step = function(now){ var p = Math.min(1, (now - t0) / 500), e = 1 - Math.pow(1 - p, 3); shown = from + (to - from) * e; balEl.textContent = fmt(shown); if (p < 1) balAnim = requestAnimationFrame(step); };
  balAnim = requestAnimationFrame(step);
  var b = balEl.parentNode; b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse');
}
function money(delta){ S.bal = r2(Math.max(0, S.bal + delta)); save(); renderBal(); }
function level(){ return 1 + Math.floor(Math.sqrt(S.all / 150)); }
function renderMe(){
  var name = TG.user && TG.user.first_name ? TG.user.first_name : L('Гость', 'Guest');
  $('#me-name').textContent = name; $('#me-ava').textContent = name.slice(0, 1).toUpperCase();
  $('#me-lvl').textContent = L('Уровень ', 'Level ') + level() + ' · ' + fmt0(S.pts) + L(' очк.', ' pts');
}
function fmt0(n){ return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
function renderSnd(){ var b = $('[data-act="sound"]'); b.innerHTML = ic(S.snd ? 'sound' : 'mute'); b.classList.toggle('on', S.snd); }

var toastT = 0;
function toast(msg, kind){ var t = $('#toast'); t.innerHTML = msg; t.className = 'toast on ' + (kind || ''); clearTimeout(toastT); toastT = setTimeout(function(){ t.className = 'toast'; }, 2400); }
function pay(cost){ if (banned()) { toast(L('Аккаунт заблокирован оператором. Снять блок можно в панели оператора.', 'The operator has blocked this account. Unblock it in the operator panel.'), 'bad'); TG.haptic('error'); return false; } if (S.bal + 1e-9 < cost) { toast(L('Не хватает демо-TON. Пополните баланс кнопкой «+».', 'Not enough demo TON. Top up with the «+» button.'), 'bad'); TG.haptic('error'); return false; } money(-cost); return true; }

/* ── Слои: нижний лист и окно выигрыша ── */
var layer = $('#layer'), sheetOpen = null;
function sheet(html, mount, cls){
  closeSheet(true);
  var el = document.createElement('div');
  el.className = 'sh-wrap ' + (cls || '');
  el.innerHTML = '<div class="sh-bg" data-close></div><div class="sh"><span class="sh-grip"></span><button class="sh-x" data-close aria-label="' + L('Закрыть', 'Close') + '">' + ic('close') + '</button>' + html + '</div>';
  layer.appendChild(el);
  requestAnimationFrame(function(){ el.classList.add('on'); });
  sheetOpen = el; syncBack();
  el.addEventListener('click', function(e){ if (e.target.closest('[data-close]')) closeSheet(); });
  var sh = $('.sh', el), y0 = null, dy = 0;
  sh.addEventListener('touchstart', function(e){ if (sh.scrollTop <= 0) { y0 = e.touches[0].clientY; dy = 0; } }, { passive: true });
  sh.addEventListener('touchmove', function(e){ if (y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0); sh.style.transform = 'translateY(' + dy + 'px)'; }, { passive: true });
  sh.addEventListener('touchend', function(){ if (y0 == null) return; y0 = null; sh.style.transform = ''; if (dy > 90) closeSheet(); });
  if (mount) mount(el);
  return el;
}
function closeSheet(now){
  var el = sheetOpen; if (!el) return;
  sheetOpen = null; syncBack();
  if (now) { el.remove(); return; }
  el.classList.remove('on'); setTimeout(function(){ el.remove(); }, 320);
}

function winModal(gifts, opts){
  opts = opts || {};
  var total = gifts.reduce(function(s, g){ return s + val(g); }, 0);
  var giftsOnly = gifts.filter(function(g){ return g.ton == null; });
  var top = gifts.slice().sort(function(a, b){ return val(b) - val(a); })[0];
  var big = rar(top) >= 3 || (opts.cost != null && total >= opts.cost * 3);
  var many = gifts.length > 1;
  var html = '<div class="win-in ' + RAR[rar(top)][1] + '"><div class="rays"></div>' +
    (many ? '<div class="win-row">' + gifts.map(function(g){ return '<div class="win-mini ' + RAR[rar(g)][1] + '">' + art(g) + '<small>' + ic('ton') + fmt(val(g)) + '</small></div>'; }).join('') + '</div>'
      : art(top, 'win-art')) +
    (top.ton == null || many ? '<span class="rar-chip ' + RAR[rar(top)][1] + '">' + RAR[rar(top)][0] + '</span>' : '') +
    '<h3>' + (opts.title || (many ? L('Ваши выигрыши', 'Your wins') : esc(gname(top)))) + '</h3>' +
    '<p class="win-sub">' + (many ? gifts.length + L(' предмета', ' items') : opts.title ? esc(gname(top)) + ' · ' + esc(bname(top)) : esc(bname(top))) + (top.b === 'black' || top.b === 'onyx' ? ' · ' + L('считается по цене торгов', 'priced at trading value') : '') + '</p>' +
    (top.ton == null || many ? '<div class="win-v">' + ic('ton') + fmt(total) + '</div>' : '<div class="win-gap"></div>') +
    '<div class="win-b">' + (giftsOnly.length ? '<button class="btn ghost" data-w="sell">' + L('Продать за ', 'Sell for ') + fmt(giftsOnly.reduce(function(s, g){ return s + val(g); }, 0)) + '</button>' : '') +
    '<button class="btn" data-w="keep">' + (giftsOnly.length ? L('В инвентарь', 'To inventory') : L('Отлично', 'Great')) + '</button></div></div>';
  var el = document.createElement('div');
  el.className = 'win';
  el.innerHTML = html;
  layer.appendChild(el);
  requestAnimationFrame(function(){ el.classList.add('on'); });
  celebrate(big);
  el.addEventListener('click', function(e){
    var b = e.target.closest('[data-w]'); if (!b) return;
    if (b.getAttribute('data-w') === 'sell') {
      var ids = opts.ids || [];
      var sum = 0;
      S.inv = S.inv.filter(function(x){ if (ids.indexOf(x.id) >= 0) { sum += val(x); return false; } return true; });
      if (sum) { money(sum); points(sum * 10); count('sell'); snd('coin'); toast(L('Продано за ', 'Sold for ') + fmt(sum) + ' TON', 'good'); }
    }
    save(); renderMe();
    el.classList.remove('on'); setTimeout(function(){ el.remove(); }, 300);
    if (opts.after) opts.after();
  });
}

/* ── Навигация ── */
var view = $('#view'), cur = null, curName = '', curArg = null;
var PARENT = { box: 'home', rocket: 'hub', dice: 'hub', upgrade: 'hub', pvp: 'hub', tasks: 'top' };
var V = {};
function go(name, arg){
  if (!V[name]) name = 'home';
  if (cur && cur.leave) { try { cur.leave(); } catch (e) {} }
  closeSheet(true);
  curName = name; curArg = arg;
  try { sessionStorage.setItem('gx-view', name); } catch (e) {}
  var v = V[name](arg);
  cur = v;
  view.innerHTML = '<div class="pg">' + v.html + '</div>';
  view.scrollTop = 0;
  var pg = view.firstChild; requestAnimationFrame(function(){ pg.classList.add('in'); });
  var tab = PARENT[name] || name;
  $$('#tabs [data-tab]').forEach(function(b){ b.classList.toggle('on', b.getAttribute('data-tab') === tab); });
  $$('.side-nav [data-go]').forEach(function(b){ b.classList.toggle('on', b.getAttribute('data-go') === name); });
  if (v.mount) v.mount(pg);
  syncBack();
}
function syncBack(){
  if (sheetOpen) TG.back(function(){ closeSheet(); });
  else if (PARENT[curName]) TG.back(function(){ go(PARENT[curName]); });
  else TG.back(null);
}
function head(title, sub, back){
  return '<div class="ph">' + (back ? '<button class="ph-b" data-go="' + back + '" aria-label="' + L('Назад', 'Back') + '">' + ic('back') + '</button>' : '') + '<div><h2>' + title + '</h2>' + (sub ? '<p>' + sub + '</p>' : '') + '</div></div>';
}
function legal(){ return '<p class="legal">' + L('Демо-макет DevUz Studio на игровой валюте.', 'DevUz Studio demo on play money.') + ' <a href="' + TERMS + '" target="_blank" rel="noopener">' + L('Условия использования макета', 'Mock-up terms of use') + '</a></p>'; }
function hms(ms){ ms = Math.max(0, ms); var s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); s = s % 60; return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; }
function dhm(ms){ ms = Math.max(0, ms); var d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4); return d + L(' д ', 'd ') + h + L(' ч ', 'h ') + m + L(' мин', 'm'); }

var NAMES = ['Тимур', 'Alex', 'Nodir', 'Kate', 'Мадина', 'Rustam', 'Lena', 'Jasur', 'Max', 'Diyor', 'Sofia', 'Bek', 'Аня', 'Oleg', 'Kamila', 'Sardor', 'Mira', 'Igor', 'Zara', 'Den'];
var HUES = [268, 200, 340, 150, 30, 220, 300, 180, 10, 120];
function ava(name, hue, cls){ return '<span class="av ' + (cls || '') + '" style="--h:' + hue + '">' + esc(name.slice(0, 1)) + '</span>'; }
function randGift(maxV){
  var keys = Object.keys(MODELS).filter(function(k){ return MODELS[k][0] <= (maxV || 40); });
  var b = rnd() < 0.08 ? 'black' : pick(COMMON_BG);
  return { m: pick(keys), b: b };
}

/* ── Главная: лента выигрышей, FREE24, промокод, боксы ── */
V.home = function(){
  var tick = 0, feed = 0;
  var html = '<div class="feed" id="feed"><span class="feed-l">' + L('Живые выигрыши', 'Live wins') + '</span><div class="feed-row" id="feed-row"></div></div>' +
    '<div class="hero glass" id="free-card">' + boxArt(BOXES[0], 'hero-box float') + '<div class="hero-t"><span class="chip ok">' + L('Бесплатно', 'Free') + '</span><h3>FREE24 Box</h3><p>' + L('Раз в 24 часа, без депозита. Один тап в день.', 'Once every 24 hours, no deposit. One tap a day.') + '</p><button class="btn" id="free-btn" data-go="box" data-arg="free"></button></div></div>' +
    '<div class="row2"><button class="mini glass" data-go="tasks">' + ic('ticket') + '<span><b>' + L('Розыгрыш недели', 'Weekly giveaway') + '</b><small>' + L('Билеты за задания', 'Tickets for tasks') + '</small></span></button><button class="mini glass" data-go="top">' + ic('cup') + '<span><b>' + L('250 призов', '250 prizes') + '</b><small>' + L('Рейтинг недели', 'Weekly top') + '</small></span></button></div>' +
    '<form class="promo glass" id="promo"><input id="promo-i" maxlength="16" placeholder="' + L('Промокод, например DEMO', 'Promo code, e.g. DEMO') + '" autocomplete="off" aria-label="' + L('Промокод', 'Promo code') + '"><button class="btn sm">' + L('Применить', 'Apply') + '</button></form>' +
    '<h4 class="sec">' + L('Боксы', 'Boxes') + '</h4><div class="boxes">' +
    BOXES.slice(1).map(function(b, i){
      var free = S.freeOpens[b.id] || 0;
      return '<button class="boxc glass" data-go="box" data-arg="' + b.id + '" style="--d:' + i * 50 + 'ms">' + (b.tag ? '<span class="tag">' + b.tag + '</span>' : '') + (free ? '<span class="tag ok">' + L('бесплатно', 'free') + ' ×' + free + '</span>' : '') + boxArt(b) + '<b>' + b.n + '</b><span class="price">' + ic('ton') + fmt(b.p) + '</span></button>';
    }).join('') + '</div>' + legal();
  function freeState(){
    var btn = $('#free-btn'); if (!btn) return;
    var left = S.free + 864e5 - Date.now();
    if (left > 0) { btn.textContent = L('Снова через ', 'Again in ') + hms(left); btn.classList.add('wait'); }
    else { btn.textContent = L('Открыть бесплатно', 'Open for free'); btn.classList.remove('wait'); }
  }
  function addFeed(){
    var row = $('#feed-row'); if (!row) return;
    var b = pick(BOXES.slice(1)), g = rnd() < 0.5 ? b.items[drawFrom(b)] : randGift(rnd() < 0.1 ? 900 : 40);
    if (g.ton != null) g = randGift(20);
    var el = document.createElement('div');
    el.className = 'fw ' + RAR[rar(g)][1];
    el.innerHTML = art(g) + '<span>' + esc(pick(NAMES)) + '<b>' + fmt(val(g)) + '</b></span>';
    row.insertBefore(el, row.firstChild);
    while (row.children.length > 14) row.removeChild(row.lastChild);
  }
  return {
    html: html,
    mount: function(pg){
      for (var i = 0; i < 8; i++) addFeed();
      freeState();
      tick = setInterval(freeState, 1000);
      feed = setInterval(addFeed, REDUCED ? 6000 : 2200);
      $('#promo', pg).addEventListener('submit', function(e){
        e.preventDefault();
        var code = $('#promo-i', pg).value.trim().toUpperCase();
        var a = adm(), list = a ? a.promos : [{ code: 'DEMO', type: 'box', box: 'luck', limit: 1e9, used: 0, until: 1e15, on: 1 }, { code: 'FARM', type: 'box', box: 'farm', limit: 1e9, used: 0, until: 1e15, on: 1 }, { code: 'GIFT', type: 'box', box: 'sweet', limit: 1e9, used: 0, until: 1e15, on: 1 }];
        var p = list.filter(function(x){ return x.code === code; })[0];
        if (!p || !p.on) { toast(L('Такого промокода нет. В демо работают DEMO, FARM и GIFT, свои коды создаются в панели оператора.', 'No such code. In the demo try DEMO, FARM or GIFT, or create your own in the operator panel.'), 'bad'); TG.haptic('error'); return; }
        if (p.used >= p.limit || p.until < Date.now()) { toast(L('Промокод закончился', 'This code has run out'), 'bad'); TG.haptic('error'); return; }
        if (S.used[code]) { toast(L('Этот промокод уже применён', 'This code is already used'), 'bad'); return; }
        S.used[code] = 1;
        if (a) { p.used++; try { localStorage.setItem(AKEY, JSON.stringify(a)); } catch (x) {} }
        TG.haptic('success'); snd('coin');
        if (p.type === 'ton') { money(p.ton); save(); celebrate(false); toast('+' + fmt(p.ton) + L(' демо-TON по промокоду', ' demo TON from the code'), 'good'); return; }
        var bx = BOXES.filter(function(b){ return b.id === p.box; })[0] || BOXES[4];
        S.freeOpens[bx.id] = (S.freeOpens[bx.id] || 0) + 1; save();
        toast(L('Бесплатное открытие: ', 'Free open: ') + bx.n, 'good');
        go('box', bx.id);
      });
    },
    leave: function(){ clearInterval(tick); clearInterval(feed); }
  };
};

/* ── Бокс: рулетка выпадения и таблица шансов ── */
var CELL = 104;
V.box = function(id){
  var b = BOXES.filter(function(x){ return x.id === id; })[0] || BOXES[1];
  var n = 1, fast = false, busy = false, tick = 0;
  var order = b.items.map(function(g, i){ return i; }).sort(function(x, y){ return val(b.items[y]) - val(b.items[x]); });
  var html = head(b.n, b.id === 'free' ? L('Раз в 24 часа', 'Once every 24 hours') : L('Цена ', 'Price ') + fmt(b.p) + ' TON', 'home') +
    '<div class="bx-top">' + boxArt(b, 'bx-big float') + '</div>' +
    '<div class="rls" id="rls"></div>' +
    '<div class="bx-ctl">' + (b.id === 'free' ? '' : '<div class="seg" id="n-seg"><button class="on" data-n="1">×1</button><button data-n="2">×2</button><button data-n="3">×3</button></div>') +
    '<label class="tog"><input type="checkbox" id="fast"><span></span>' + L('Быстро', 'Fast') + '</label></div>' +
    '<button class="btn big" id="open"></button>' +
    '<h4 class="sec">' + L('Что внутри и шансы', 'Contents and odds') + '</h4>' +
    '<div class="odds">' + order.map(function(i){ var g = b.items[i]; return '<div class="od ' + RAR[rar(g)][1] + '">' + art(g) + '<div><b>' + esc(gname(g)) + (g.m && NEW[g.m] ? ' <i class="new">' + L('новинка', 'new') + '</i>' : '') + '</b><small>' + esc(bname(g)) + ' · ' + ic('ton') + fmt(val(g)) + '</small></div><span class="od-p">' + pct(b.ch[i]) + '</span></div>'; }).join('') + '</div>' +
    '<p class="note">' + L('Шансы открыты и одинаковы для всех. В среднем бокс отдаёт ' + Math.round(rtp('box') * 100) + '% своей цены.', 'Odds are public and equal for everyone. On average a box returns ' + Math.round(rtp('box') * 100) + '% of its price.') + '</p>';
  function strip(win){
    var cells = [];
    for (var i = 0; i < 60; i++) cells.push(i === 52 ? win : rnd() < 0.55 ? Math.floor(rnd() * b.items.length) : drawFrom(b));
    return '<div class="rl"><div class="rl-s">' + cells.map(function(k){ var g = b.items[k]; return '<div class="rc ' + RAR[rar(g)][1] + '">' + art(g) + '<small>' + fmt(val(g)) + '</small></div>'; }).join('') + '</div><i class="rl-m"></i></div>';
  }
  function idle(){
    var el = $('#rls'); if (!el) return;
    var rows = [];
    for (var k = 0; k < n; k++) rows.push(strip(Math.floor(rnd() * b.items.length)));
    el.innerHTML = rows.join('');
    $$('.rl-s', el).forEach(function(s){ var w = s.parentNode.clientWidth; s.style.transform = 'translate3d(' + (-(26 * CELL) + w / 2 - CELL / 2) + 'px,0,0)'; });
  }
  function label(){
    var btn = $('#open'); if (!btn) return;
    var free = S.freeOpens[b.id] || 0;
    if (b.id === 'free') {
      var left = S.free + 864e5 - Date.now();
      btn.disabled = left > 0 || busy;
      btn.textContent = left > 0 ? L('Снова через ', 'Again in ') + hms(left) : L('Открыть бесплатно', 'Open for free');
    } else {
      btn.disabled = busy;
      btn.innerHTML = free >= n ? L('Открыть бесплатно', 'Open for free') + ' (' + free + ')' : L('Открыть за ', 'Open for ') + ic('ton') + fmt(b.p * n);
    }
  }
  function open(){
    if (busy) return;
    if (b.id === 'free') { if (S.free + 864e5 > Date.now()) return; S.free = Date.now(); count('free'); }
    else if ((S.freeOpens[b.id] || 0) >= n) S.freeOpens[b.id] -= n;
    else if (!pay(b.p * n)) return;
    busy = true; label();
    TG.haptic('medium');
    var wins = [], el = $('#rls');
    for (var k = 0; k < n; k++) wins.push(drawFrom(b));
    el.innerHTML = wins.map(strip).join('');
    var strips = $$('.rl-s', el), w = el.clientWidth, dur = REDUCED ? 600 : fast ? 1500 : 5200;
    var targets = strips.map(function(){ return -(52 * CELL) + w / 2 - CELL / 2 + (rnd() - 0.5) * (CELL * 0.7); });
    var starts = strips.map(function(){ return -(2 * CELL) + w / 2 - CELL / 2; });
    var lastCell = -1, t0 = performance.now();
    function frame(now){
      var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 4.2);
      strips.forEach(function(s, i){ s.style.transform = 'translate3d(' + (starts[i] + (targets[i] - starts[i]) * e).toFixed(1) + 'px,0,0)'; });
      var c = Math.floor((-(starts[0] + (targets[0] - starts[0]) * e) + w / 2) / CELL);
      if (c !== lastCell) { lastCell = c; snd('tick'); if (c % 2 === 0) TG.haptic('select'); }
      if (p < 1) tick = requestAnimationFrame(frame); else done();
    }
    tick = requestAnimationFrame(frame);
    function done(){
      $$('.rl', el).forEach(function(r){ r.classList.add('hit'); });
      var gifts = wins.map(function(i){ return b.items[i]; });
      var ids = [];
      gifts.forEach(function(g){ if (g.ton != null) money(g.ton); else ids.push(addGift(g).id); });
      var total = gifts.reduce(function(s, g){ return s + val(g); }, 0);
      S.best = Math.max(S.best, total);
      count('boxes', n); points(b.p * n * 10 + 5);
      save(); renderMe();
      setTimeout(function(){
        winModal(gifts, { ids: ids, cost: b.p * n, after: function(){ busy = false; label(); } });
      }, REDUCED ? 100 : 380);
    }
  }
  return {
    html: html,
    mount: function(pg){
      idle(); label();
      var lt = setInterval(label, 1000);
      $('#open', pg).addEventListener('click', open);
      $('#fast', pg).addEventListener('change', function(e){ fast = e.target.checked; });
      var seg = $('#n-seg', pg);
      if (seg) seg.addEventListener('click', function(e){
        var x = e.target.closest('[data-n]'); if (!x || busy) return;
        n = +x.getAttribute('data-n'); $$('[data-n]', seg).forEach(function(y){ y.classList.toggle('on', y === x); });
        TG.haptic('select'); idle(); label();
      });
      this.leave = function(){ clearInterval(lt); cancelAnimationFrame(tick); };
    }
  };
};

/* ── Игры ── */
V.hub = function(){
  var games = [
    ['rocket', 'Rocket', L('Множитель растёт, пока ракета летит. Заберите до того, как она улетит.', 'The multiplier climbs while the rocket flies. Cash out before it is gone.'), 'g-rk', 1840],
    ['pvp', 'PvP', L('Ставки в общий банк. Шанс равен доле ставки, победитель забирает всё.', 'Bets go to one pot. Your chance equals your share, the winner takes it all.'), 'g-pv', 612],
    ['dice', 'Dice', L('Сами ставите шанс. Чем он ниже, тем выше множитель.', 'You set the chance. The lower it is, the higher the multiplier.'), 'g-dc', 935],
    ['upgrade', 'Upgrade', L('Улучшите подарок до более дорогого с шансом на колесе.', 'Upgrade a gift to a pricier one with a chance on the wheel.'), 'g-up', 427]
  ];
  var ICN = { rocket: 'rocket', pvp: 'pvp', dice: 'dice', upgrade: 'up' };
  return {
    html: head('Play Hub', L('Очки рейтинга идут за каждую игру', 'Every game earns leaderboard points')) +
      '<div class="games">' + games.map(function(g, i){ return '<button class="game ' + g[3] + '" data-go="' + g[0] + '" style="--d:' + i * 60 + 'ms"><span class="game-ic">' + ic(ICN[g[0]]) + '</span><b>' + g[1] + '</b><p>' + g[2] + '</p><span class="online"><i></i>' + fmt0(g[4] + Math.round(rnd() * 80)) + L(' играют', ' playing') + '</span></button>'; }).join('') + '</div>' + legal()
  };
};

/* ── Rocket: canvas, график множителя, забрать, другие игроки ── */
var RK = { hist: [] };
for (var hi0 = 0; hi0 < 12; hi0++) RK.hist.push(crashPoint());
function crashPoint(){ var u = rnd(); return Math.min(500, Math.max(1, Math.floor(rtp('rocket') * 100 / (1 - u)) / 100)); }
var K = 0.11;
V.rocket = function(){
  var html = head('Rocket', L('Заберите до того, как ракета улетит', 'Cash out before the rocket is gone'), 'hub') +
    '<div class="rk-h" id="rk-h"></div>' +
    '<div class="rk glass"><canvas id="rk-c"></canvas><div class="rk-o"><b id="rk-m">1.00×</b><span id="rk-s"></span></div><div class="rk-q seg sm" id="rk-q"><button data-q="high">High</button><button data-q="medium">Medium</button><button data-q="low">Low</button></div></div>' +
    '<div class="bet glass"><div class="bet-r"><label>' + L('Ставка', 'Bet') + '</label><div class="num-in"><button data-d="-1">−</button><input id="rk-bet" inputmode="decimal" value="1"><button data-d="1">+</button></div><div class="chips"><button data-x=".5">½</button><button data-x="2">×2</button></div></div>' +
    '<div class="bet-r"><label>' + L('Автовывод', 'Auto cash out') + '</label><div class="num-in"><input id="rk-auto" inputmode="decimal" placeholder="' + L('выкл', 'off') + '"><span class="suf">×</span></div></div>' +
    '<button class="btn big" id="rk-btn"></button></div>' +
    '<h4 class="sec">' + L('Игроки раунда', 'Players this round') + ' <span id="rk-n"></span></h4><div class="pl" id="rk-pl"></div>';
  var R = null, raf = 0, cv, ctx, W = 0, H = 0, DPR = 1, stars = [], smoke = [], boom = [], last = 0, me = null, next = null;
  var mEl, sEl, btn, plEl, dirty = true, lastBtn = '';
  function size(){
    var r = cv.getBoundingClientRect(); W = r.width; H = r.height;
    var d = window.devicePixelRatio || 1;
    DPR = S.q === 'high' ? Math.min(2, d) : S.q === 'medium' ? Math.min(1.5, d) : 1;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    var nStars = S.q === 'high' ? 110 : S.q === 'medium' ? 60 : 24;
    stars = []; for (var i = 0; i < nStars; i++) stars.push({ x: rnd() * W, y: rnd() * H, z: 0.2 + rnd() * 0.8 });
  }
  function round(){
    R = { phase: 'wait', t0: performance.now(), crash: crashPoint(), m: 1, players: [] };
    var nb = 7 + Math.floor(rnd() * 7);
    R.queue = [];
    for (var i = 0; i < nb; i++) R.queue.push({ at: rnd() * 5200, name: pick(NAMES), h: pick(HUES), bet: r2(pick([0.5, 1, 1, 2, 3, 5, 5, 10, 20, 50]) * (0.6 + rnd() * 0.8)), goal: Math.max(1.05, r2(1 + Math.pow(rnd(), 1.8) * 6)) });
    if (next) { if (pay(next.bet)) { me = { bet: next.bet, auto: next.auto, out: 0 }; count('rocket'); } next = null; }
    boom = []; dirty = true;
  }
  function resolveLeave(){
    if (!me || !R) return;
    if (R.phase === 'wait') money(me.bet);
    else if (R.phase === 'fly' && !me.out) {
      if (me.auto && R.crash >= me.auto) { money(me.bet * me.auto); toast(L('Автовывод сработал: ', 'Auto cash out: ') + fmt(me.bet * me.auto) + ' TON', 'good'); }
    }
    me = null;
  }
  function cashOut(m){
    if (!me || me.out || R.phase !== 'fly') return;
    me.out = m; var win = r2(me.bet * m);
    money(win); points(me.bet * 10); S.best = Math.max(S.best, win); save(); renderMe();
    var big = m >= 5;
    confetti(big ? 140 : 60, W / 2, H * 0.5 + 90); flash(big ? 'gold' : ''); snd(big ? 'big' : 'coin'); TG.haptic('success');
    toast(L('Вы забрали ', 'You cashed out ') + fmt(win) + ' TON · ' + m.toFixed(2) + '×', 'good');
    dirty = true;
  }
  function onBtn(){
    var bet = clamp(parseFloat(String($('#rk-bet').value).replace(',', '.')) || 0, 0.1, 1000);
    var auto = parseFloat(String($('#rk-auto').value).replace(',', '.')) || 0;
    auto = auto >= 1.01 ? auto : 0;
    if (R.phase === 'wait') {
      if (me) { money(me.bet); me = null; TG.haptic('light'); }
      else if (pay(bet)) { me = { bet: bet, auto: auto, out: 0 }; count('rocket'); TG.haptic('medium'); snd('tap'); }
    } else if (R.phase === 'fly' && me && !me.out) cashOut(R.m);
    else { next = next ? null : { bet: bet, auto: auto }; TG.haptic('light'); }
    save(); dirty = true;
  }
  function btnState(){
    var s;
    if (R.phase === 'wait') s = me ? L('Отменить ставку', 'Cancel bet') : L('Поставить ', 'Bet ') + '<b>' + fmt(parseFloat($('#rk-bet').value) || 0) + ' TON</b>';
    else if (R.phase === 'fly' && me && !me.out) s = L('Забрать ', 'Cash out ') + '<b>' + fmt(me.bet * R.m) + ' TON</b>';
    else s = next ? L('Ставка на следующий раунд принята', 'Bet for next round placed') : L('Поставить на следующий раунд', 'Bet on next round');
    if (s !== lastBtn) { btn.innerHTML = s; lastBtn = s; }
    btn.className = 'btn big ' + (R.phase === 'fly' && me && !me.out ? 'cash' : me && R.phase === 'wait' ? 'ghost' : next ? 'ghost' : '');
  }
  function players(){
    var list = R.players.slice();
    if (me) list.unshift({ name: L('Вы', 'You'), h: 268, bet: me.bet, out: me.out, me: 1 });
    list.sort(function(a, b){ return (b.me || 0) - (a.me || 0) || b.bet - a.bet; });
    $('#rk-n').textContent = '· ' + list.length;
    plEl.innerHTML = list.map(function(p){
      var st = p.out ? '<span class="pl-w">' + p.out.toFixed(2) + '× · +' + fmt(p.bet * p.out) + '</span>' : R.phase === 'crash' ? '<span class="pl-l">' + L('сгорело', 'lost') + '</span>' : '<span class="pl-n">' + L('в игре', 'in game') + '</span>';
      return '<div class="pr ' + (p.me ? 'me' : '') + '">' + ava(p.name, p.h) + '<b>' + esc(p.name) + '</b><span class="pl-b">' + ic('ton') + fmt(p.bet) + '</span>' + st + '</div>';
    }).join('');
  }
  function hist(){ $('#rk-h').innerHTML = RK.hist.slice(0, 14).map(function(c){ return '<span class="hc ' + (c >= 10 ? 'h3' : c >= 2 ? 'h2' : 'h1') + '">' + c.toFixed(2) + '×</span>'; }).join(''); }
  function rocketShape(x, y, a, s, t){
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(s, s);
    var fl = 14 + Math.sin(t * 40) * 4 + rnd() * 4;
    var g = ctx.createLinearGradient(-30 - fl, 0, -14, 0); g.addColorStop(0, 'rgba(255,90,40,0)'); g.addColorStop(0.5, 'rgba(255,150,40,.9)'); g.addColorStop(1, '#fff3c4');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-14, -6); ctx.quadraticCurveTo(-24 - fl, 0, -14, 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff4f7a'; ctx.beginPath(); ctx.moveTo(-8, -7); ctx.lineTo(-16, -15); ctx.lineTo(-2, -8); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-8, 7); ctx.lineTo(-16, 15); ctx.lineTo(-2, 8); ctx.closePath(); ctx.fill();
    var bg = ctx.createLinearGradient(0, -9, 0, 9); bg.addColorStop(0, '#ffffff'); bg.addColorStop(1, '#b9b3d6');
    ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(-15, -8); ctx.lineTo(8, -8); ctx.quadraticCurveTo(22, -6, 26, 0); ctx.quadraticCurveTo(22, 6, 8, 8); ctx.lineTo(-15, 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff4f7a'; ctx.beginPath(); ctx.moveTo(14, -7); ctx.quadraticCurveTo(22, -6, 26, 0); ctx.quadraticCurveTo(22, 6, 14, 7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3ec6ff'; ctx.beginPath(); ctx.arc(4, 0, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(3, -1.5, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function draw(now, dt){
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var fly = R.phase === 'fly', t = fly ? (now - R.t0) / 1000 : R.phase === 'crash' ? R.ft : 0;
    var speed = fly ? 30 + Math.min(260, R.m * 22) : 12;
    ctx.fillStyle = '#fff';
    for (var i = 0; i < stars.length; i++) {
      var st = stars[i]; st.x -= speed * st.z * dt; st.y += speed * 0.35 * st.z * dt;
      if (st.x < 0) st.x += W; if (st.y > H) st.y -= H;
      ctx.globalAlpha = 0.25 + st.z * 0.6; ctx.fillRect(st.x, st.y, st.z * 1.8, st.z * 1.8);
    }
    ctx.globalAlpha = 1;
    var pad = 18, xmax = Math.max(9, t * 1.15), ymax = Math.max(2, R.m * 1.2);
    var X = function(tt){ return pad + tt / xmax * (W - pad * 2); };
    var Y = function(m){ return H - pad - (m - 1) / (ymax - 1) * (H - pad * 2 - 30); };
    ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = 1; ctx.font = '600 10px system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.35)';
    var stepM = ymax > 20 ? 10 : ymax > 6 ? 2 : ymax > 3 ? 1 : 0.5;
    for (var gm = 1 + stepM; gm < ymax; gm += stepM) { var gy = Y(gm); ctx.beginPath(); ctx.moveTo(pad, gy); ctx.lineTo(W - pad, gy); ctx.stroke(); ctx.fillText(gm.toFixed(stepM < 1 ? 1 : 0) + '×', W - pad - 26, gy - 4); }
    if (fly || R.phase === 'crash') {
      var N = 64, tipX = X(t), tipY = Y(R.m);
      ctx.beginPath(); ctx.moveTo(X(0), Y(1));
      for (var k = 1; k <= N; k++) { var tk = t * k / N; ctx.lineTo(X(tk), Y(Math.exp(K * tk))); }
      var crashed = R.phase === 'crash';
      var col = crashed ? '#ff4f6d' : '#9b7bff';
      ctx.lineTo(tipX, H - pad); ctx.lineTo(X(0), H - pad); ctx.closePath();
      var fg = ctx.createLinearGradient(0, tipY, 0, H); fg.addColorStop(0, crashed ? 'rgba(255,79,109,.35)' : 'rgba(155,123,255,.38)'); fg.addColorStop(1, 'rgba(155,123,255,0)');
      ctx.fillStyle = fg; ctx.fill();
      ctx.beginPath(); ctx.moveTo(X(0), Y(1));
      for (k = 1; k <= N; k++) { tk = t * k / N; ctx.lineTo(X(tk), Y(Math.exp(K * tk))); }
      var lg = ctx.createLinearGradient(X(0), 0, tipX, 0); lg.addColorStop(0, crashed ? '#ff8a5c' : '#45d5ff'); lg.addColorStop(1, col);
      ctx.strokeStyle = lg; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (S.q === 'high') { ctx.shadowColor = col; ctx.shadowBlur = 16; }
      ctx.stroke(); ctx.shadowBlur = 0;
      if (fly) {
        var dm = K * R.m * (xmax / (W - pad * 2)) * ((H - pad * 2 - 30) / (ymax - 1));
        var ang = -Math.atan(dm);
        var nSm = S.q === 'high' ? 3 : S.q === 'medium' ? 1 : 0;
        for (var s2 = 0; s2 < nSm; s2++) smoke.push({ x: tipX - Math.cos(ang) * 16, y: tipY - Math.sin(ang) * 16, vx: -40 - rnd() * 60, vy: (rnd() - 0.5) * 30 + 20, r: 2 + rnd() * 3, life: 0.6 + rnd() * 0.5, t: 0 });
        for (var q = smoke.length - 1; q >= 0; q--) {
          var sm = smoke[q]; sm.t += dt; if (sm.t > sm.life) { smoke.splice(q, 1); continue; }
          sm.x += sm.vx * dt; sm.y += sm.vy * dt; sm.r += 14 * dt;
          ctx.globalAlpha = (1 - sm.t / sm.life) * 0.5; ctx.fillStyle = sm.t < 0.15 ? '#ffb347' : '#c9c1ff';
          ctx.beginPath(); ctx.arc(sm.x, sm.y, sm.r, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        rocketShape(tipX, tipY, ang, 1.15, now / 1000);
      }
      if (crashed) {
        for (q = boom.length - 1; q >= 0; q--) {
          var bp = boom[q]; bp.t += dt; if (bp.t > bp.life) { boom.splice(q, 1); continue; }
          bp.x += bp.vx * dt; bp.y += bp.vy * dt; bp.vy += 120 * dt; bp.vx *= 0.97;
          ctx.globalAlpha = 1 - bp.t / bp.life; ctx.fillStyle = bp.c; ctx.beginPath(); ctx.arc(bp.x, bp.y, bp.r * (1 - bp.t / bp.life) + 0.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    } else {
      var bob = Math.sin(now / 300) * 3;
      rocketShape(W / 2, H * 0.73 + bob, -Math.PI / 2, 1.4, now / 1000);
      var left = Math.max(0, 6000 - (now - R.t0)) / 6000;
      ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(W / 2, H * 0.73, 42, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#9b7bff'; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(W / 2, H * 0.73, 42, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * left); ctx.stroke();
    }
  }
  function loop(now){
    var dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    if (R.phase === 'wait') {
      var el = now - R.t0;
      R.queue = R.queue.filter(function(p){ if (p.at <= el) { R.players.push(p); dirty = true; return false; } return true; });
      sEl.textContent = L('Старт через ', 'Start in ') + (Math.max(0, 6000 - el) / 1000).toFixed(1) + L(' с', 's');
      mEl.textContent = '1.00×'; mEl.className = '';
      if (el >= 6000) { R.phase = 'fly'; R.t0 = now; TG.haptic('heavy'); snd('tap'); dirty = true; }
    } else if (R.phase === 'fly') {
      var t = (now - R.t0) / 1000; R.m = Math.exp(K * t);
      if (me && !me.out && me.auto && R.m >= me.auto && me.auto <= R.crash) cashOut(me.auto);
      R.players.forEach(function(p){ if (!p.out && R.m >= p.goal && p.goal <= R.crash) { p.out = p.goal; dirty = true; } });
      if (R.m >= R.crash) {
        R.m = R.crash; R.phase = 'crash'; R.ft = Math.log(R.crash) / K; R.t0 = now;
        RK.hist.unshift(R.crash); hist(); dirty = true;
        var tipX = 0, tipY = 0;
        var pad = 18, xmax = Math.max(9, R.ft * 1.15), ymax = Math.max(2, R.m * 1.2);
        tipX = pad + R.ft / xmax * (W - pad * 2); tipY = H - pad - (R.m - 1) / (ymax - 1) * (H - pad * 2 - 30);
        var nb = S.q === 'high' ? 70 : S.q === 'medium' ? 36 : 14;
        for (var i = 0; i < nb; i++) { var a = rnd() * Math.PI * 2, sp = 40 + rnd() * 220; boom.push({ x: tipX, y: tipY, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 2 + rnd() * 4, life: 0.5 + rnd() * 0.9, t: 0, c: pick(['#ffb347', '#ff4f6d', '#fff3c4', '#ff7a2f']) }); }
        if (me && !me.out) { snd('lose'); TG.haptic('error'); toast(L('Ракета улетела на ', 'The rocket left at ') + R.crash.toFixed(2) + '×', 'bad'); me.lost = 1; }
        else snd('boom');
        S.rk = RK.hist.slice(0, 20); save();
      }
      mEl.textContent = R.m.toFixed(2) + '×'; mEl.className = R.m >= 10 ? 'hot' : R.m >= 2 ? 'warm' : '';
      sEl.textContent = L('Летит', 'Flying');
    } else {
      mEl.textContent = R.crash.toFixed(2) + '×'; mEl.className = 'dead';
      sEl.textContent = L('Улетела', 'Gone');
      if (now - R.t0 > 2600) { me = null; round(); }
    }
    draw(now, dt);
    btnState();
    if (dirty) { players(); dirty = false; }
    raf = requestAnimationFrame(loop);
  }
  return {
    html: html,
    mount: function(pg){
      cv = $('#rk-c', pg); ctx = cv.getContext('2d'); mEl = $('#rk-m', pg); sEl = $('#rk-s', pg); btn = $('#rk-btn', pg); plEl = $('#rk-pl', pg);
      if (S.rk && S.rk.length && RK.hist.length < 20) RK.hist = S.rk.slice();
      size(); hist(); round();
      var q = $('#rk-q', pg);
      var syncQ = function(){ $$('[data-q]', q).forEach(function(b){ b.classList.toggle('on', b.getAttribute('data-q') === S.q); }); };
      syncQ();
      q.addEventListener('click', function(e){ var b = e.target.closest('[data-q]'); if (!b) return; S.q = b.getAttribute('data-q'); save(); syncQ(); size(); TG.haptic('select'); });
      btn.addEventListener('click', onBtn);
      pg.addEventListener('click', function(e){
        var d = e.target.closest('[data-d]'), x = e.target.closest('[data-x]'), inp = $('#rk-bet', pg);
        var v = parseFloat(inp.value) || 1;
        if (d) inp.value = fmt(clamp(v + (+d.getAttribute('data-d')) * (v >= 10 ? 5 : v >= 2 ? 1 : 0.5), 0.5, 1000)).replace(/ /g, '');
        if (x) inp.value = fmt(clamp(v * parseFloat(x.getAttribute('data-x')), 0.1, 1000)).replace(/ /g, '');
        if (d || x) TG.haptic('select');
      });
      var ro = window.ResizeObserver ? new ResizeObserver(size) : null; if (ro) ro.observe(cv);
      raf = requestAnimationFrame(loop);
      this.leave = function(){ cancelAnimationFrame(raf); if (ro) ro.disconnect(); resolveLeave(); save(); };
    }
  };
};

/* ── Dice: шанс ползунком, Higher или Lower ── */
V.dice = function(){
  var chance = 50, mode = 'lo', busy = false, hist = S.dc || [];
  var html = head('Dice', L('Чем ниже шанс, тем выше множитель', 'The lower the chance, the higher the multiplier'), 'hub') +
    '<div class="dc glass"><div class="dc-n" id="dc-n">50.00</div><div class="dc-bar" id="dc-bar"><i class="dc-z" id="dc-z"></i><i class="dc-k" id="dc-k"></i><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div><div class="dc-h" id="dc-h"></div></div>' +
    '<div class="seg big" id="dc-mode"><button data-m="lo" class="on">Lower<small id="dc-lo"></small></button><button data-m="hi">Higher<small id="dc-hi"></small></button></div>' +
    '<div class="bet glass"><div class="dc-st"><div><small>' + L('Шанс', 'Chance') + '</small><b id="dc-c">50%</b></div><div><small>' + L('Множитель', 'Multiplier') + '</small><b id="dc-x"></b></div><div><small>' + L('Выигрыш', 'Payout') + '</small><b id="dc-p"></b></div></div>' +
    '<input type="range" class="rng" id="dc-r" min="2" max="95" step="1" value="50" aria-label="' + L('Шанс', 'Chance') + '">' +
    '<div class="bet-r"><label>' + L('Ставка', 'Bet') + '</label><div class="num-in"><button data-d="-1">−</button><input id="dc-bet" inputmode="decimal" value="1"><button data-d="1">+</button></div><div class="chips"><button data-x=".5">½</button><button data-x="2">×2</button></div></div>' +
    '<button class="btn big" id="dc-go">' + L('Бросить', 'Roll') + '</button></div>';
  var mult = function(){ return rtp('dice') * 100 / chance; };
  function sync(){
    var bet = parseFloat($('#dc-bet').value) || 0;
    $('#dc-c').textContent = chance + '%';
    $('#dc-x').textContent = mult().toFixed(2) + '×';
    $('#dc-p').textContent = fmt(bet * mult());
    $('#dc-lo').textContent = L('меньше ', 'under ') + chance.toFixed(2);
    $('#dc-hi').textContent = L('больше ', 'over ') + (100 - chance).toFixed(2);
    var z = $('#dc-z');
    z.style.left = mode === 'lo' ? '0%' : (100 - chance) + '%'; z.style.width = chance + '%';
    $('#dc-r').style.setProperty('--p', ((chance - 2) / 93 * 100) + '%');
  }
  function renderHist(){ $('#dc-h').innerHTML = hist.slice(0, 10).map(function(h){ return '<span class="hc ' + (h.w ? 'h2' : 'h1') + '">' + h.r.toFixed(2) + '</span>'; }).join(''); }
  function roll(){
    if (busy) return;
    var bet = clamp(parseFloat(String($('#dc-bet').value).replace(',', '.')) || 0, 0.1, 1000);
    if (!pay(bet)) return;
    busy = true; TG.haptic('medium');
    var r = Math.floor(rnd() * 10000) / 100;
    var win = mode === 'lo' ? r < chance : r > 100 - chance;
    var n = $('#dc-n'), k = $('#dc-k'), t0 = performance.now(), dur = REDUCED ? 150 : 900;
    n.className = 'dc-n';
    k.style.transition = 'left ' + dur + 'ms cubic-bezier(.2,.9,.2,1)'; k.style.left = r + '%';
    (function step(now){
      var p = Math.min(1, (now - t0) / dur);
      if (p < 1) { n.textContent = (rnd() * 100).toFixed(2); if (Math.floor(p * 12) !== Math.floor((p - 0.016) * 12)) snd('tick'); requestAnimationFrame(step); return; }
      n.textContent = r.toFixed(2); n.className = 'dc-n ' + (win ? 'w' : 'l');
      hist.unshift({ r: r, w: win }); S.dc = hist.slice(0, 10); renderHist();
      count('dice'); points(bet * 10);
      if (win) { var pay2 = r2(bet * mult()); money(pay2); count('dicewin'); S.best = Math.max(S.best, pay2); confetti(mult() >= 5 ? 130 : 50, null, 160); flash(mult() >= 5 ? 'gold' : ''); snd(mult() >= 5 ? 'big' : 'win'); TG.haptic('success'); toast('+' + fmt(pay2) + ' TON', 'good'); }
      else { snd('lose'); TG.haptic('error'); }
      save(); renderMe(); busy = false;
    })(t0);
  }
  return {
    html: html,
    mount: function(pg){
      sync(); renderHist();
      $('#dc-r', pg).addEventListener('input', function(e){ chance = +e.target.value; sync(); TG.haptic('select'); });
      $('#dc-mode', pg).addEventListener('click', function(e){ var b = e.target.closest('[data-m]'); if (!b) return; mode = b.getAttribute('data-m'); $$('[data-m]', pg).forEach(function(x){ x.classList.toggle('on', x === b); }); sync(); TG.haptic('select'); });
      $('#dc-go', pg).addEventListener('click', roll);
      $('#dc-bet', pg).addEventListener('input', sync);
      pg.addEventListener('click', function(e){
        var d = e.target.closest('[data-d]'), x = e.target.closest('[data-x]'), inp = $('#dc-bet', pg);
        var v = parseFloat(inp.value) || 1;
        if (d) inp.value = String(r2(clamp(v + (+d.getAttribute('data-d')) * (v >= 10 ? 5 : v >= 2 ? 1 : 0.5), 0.5, 1000)));
        if (x) inp.value = String(r2(clamp(v * parseFloat(x.getAttribute('data-x')), 0.1, 1000)));
        if (d || x) { sync(); TG.haptic('select'); }
      });
    }
  };
};

/* ── Upgrade: колесо шанса ── */
var CATALOG = Object.keys(MODELS).map(function(k, i){ return { m: k, b: COMMON_BG[i % COMMON_BG.length] }; })
  .concat([{ m: 'rose', b: 'black' }, { m: 'gem', b: 'onyx' }, { m: 'cap', b: 'black' }, { m: 'watch', b: 'onyx' }, { m: 'locket', b: 'black' }])
  .sort(function(a, b){ return val(a) - val(b); });
V.upgrade = function(arg){
  var from = null, to = null, busy = false, angle = 0;
  if (arg) from = S.inv.filter(function(x){ return x.id === arg; })[0] || null;
  if (!from && S.inv.length) from = S.inv.slice().sort(function(a, b){ return val(a) - val(b); })[0];
  var C = 2 * Math.PI * 84;
  var html = head('Upgrade', L('Подарок станет дороже, если стрелка остановится в цветной зоне', 'Your gift gets pricier if the needle stops in the coloured zone'), 'hub') +
    '<div class="up glass"><svg class="wheel" viewBox="0 0 200 200"><circle cx="100" cy="100" r="84" class="wh-bg"/><circle cx="100" cy="100" r="84" class="wh-s" id="up-s" transform="rotate(-90 100 100)" stroke-dasharray="0 ' + C + '"/><g id="up-n"><path d="M100 10l7 22h-14z" class="wh-n"/></g><circle cx="100" cy="100" r="58" class="wh-in"/></svg><div class="up-c"><b id="up-p">0%</b><small>' + L('шанс', 'chance') + '</small></div></div>' +
    '<div class="up-sl"><button class="slot glass" id="up-from"></button><span class="up-ar">' + ic('up') + '</span><button class="slot glass" id="up-to"></button></div>' +
    '<div class="chips wide" id="up-k"><button data-k="1.5">×1.5</button><button data-k="2">×2</button><button data-k="3">×3</button><button data-k="5">×5</button><button data-k="10">×10</button></div>' +
    '<button class="btn big" id="up-go">' + L('Улучшить', 'Upgrade') + '</button>' +
    '<p class="note">' + L('Шанс равен ' + Math.round(rtp('upgrade') * 100) + '% от отношения цен и не выше 80%. Не повезло: подарок сгорает.', 'Chance is ' + Math.round(rtp('upgrade') * 100) + '% of the price ratio, capped at 80%. No luck: the gift burns.') + '</p>';
  function chance(){ return from && to ? Math.min(0.8, rtp('upgrade') * val(from) / val(to)) : 0; }
  function slot(el, g, empty){ el.innerHTML = g ? art(g) + '<b>' + esc(gname(g)) + '</b><small>' + ic('ton') + fmt(val(g)) + '</small>' : '<span class="slot-e">' + ic('plus') + '</span><b>' + empty + '</b>'; el.className = 'slot glass ' + (g ? RAR[rar(g)][1] : ''); }
  function sync(){
    slot($('#up-from'), from, L('Ваш подарок', 'Your gift'));
    slot($('#up-to'), to, L('Цель', 'Target'));
    var p = chance();
    $('#up-p').textContent = (p * 100).toFixed(1) + '%';
    $('#up-s').setAttribute('stroke-dasharray', (p * C).toFixed(1) + ' ' + C.toFixed(1));
    $('#up-go').disabled = !from || !to || busy;
  }
  function byK(k){
    if (!from) return;
    var goal = val(from) * k, best = null;
    CATALOG.forEach(function(g){ if (val(g) > val(from) && (!best || Math.abs(val(g) - goal) < Math.abs(val(best) - goal))) best = g; });
    to = best; sync();
  }
  function pickFrom(){
    if (!S.inv.length) { toast(L('Инвентарь пуст. Откройте бокс.', 'Inventory is empty. Open a box.'), 'bad'); return; }
    sheet('<h3>' + L('Какой подарок улучшить', 'Gift to upgrade') + '</h3><div class="pick">' + S.inv.slice().sort(function(a, b){ return val(b) - val(a); }).map(function(g){ return '<button data-id="' + g.id + '">' + card(g) + '</button>'; }).join('') + '</div>', function(el){
      el.addEventListener('click', function(e){ var b = e.target.closest('[data-id]'); if (!b) return; from = S.inv.filter(function(x){ return x.id === +b.getAttribute('data-id'); })[0]; if (to && val(to) <= val(from)) to = null; if (!to) byK(2); sync(); closeSheet(); TG.haptic('select'); });
    });
  }
  function pickTo(){
    var list = CATALOG.filter(function(g){ return !from || val(g) > val(from); });
    sheet('<h3>' + L('Во что улучшить', 'Upgrade into') + '</h3><div class="pick">' + list.map(function(g, i){ return '<button data-i="' + CATALOG.indexOf(g) + '">' + card(g, from ? '<span class="gc-p">' + (Math.min(0.8, rtp('upgrade') * val(from) / val(g)) * 100).toFixed(1) + '%</span>' : '') + '</button>'; }).join('') + '</div>', function(el){
      el.addEventListener('click', function(e){ var b = e.target.closest('[data-i]'); if (!b) return; to = CATALOG[+b.getAttribute('data-i')]; sync(); closeSheet(); TG.haptic('select'); });
    });
  }
  function spin(){
    if (busy || !from || !to) return;
    busy = true; sync();
    var p = chance(), win = rnd() < p;
    var land = win ? rnd() * p * 360 * 0.94 + p * 360 * 0.03 : p * 360 + (0.03 + rnd() * 0.94) * (1 - p) * 360;
    var start = angle % 360, end = start + 360 * (REDUCED ? 1 : 5) + ((land - start % 360) + 360) % 360;
    var t0 = performance.now(), dur = REDUCED ? 500 : 3600, n = $('#up-n'), lastTick = -1;
    TG.haptic('medium');
    (function step(now){
      var q = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - q, 4);
      angle = start + (end - start) * e;
      n.setAttribute('transform', 'rotate(' + angle.toFixed(2) + ' 100 100)');
      var tk = Math.floor(angle / 15); if (tk !== lastTick) { lastTick = tk; snd('tick'); }
      if (q < 1) { requestAnimationFrame(step); return; }
      var lost = from;
      S.inv = S.inv.filter(function(x){ return x.id !== lost.id; });
      count('upgrade'); points(val(lost) * 10);
      if (win) {
        var got = addGift(to); S.best = Math.max(S.best, val(got));
        save(); renderMe();
        winModal([to], { ids: [got.id], title: L('Улучшено!', 'Upgraded!'), cost: val(lost), after: function(){ from = S.inv.filter(function(x){ return x.id === got.id; })[0] || S.inv.slice().sort(function(a, b){ return val(a) - val(b); })[0] || null; to = null; if (from) byK(2); busy = false; sync(); } });
      } else {
        save(); renderMe(); snd('lose'); TG.haptic('error');
        $('.up').classList.add('shake'); setTimeout(function(){ var u = $('.up'); if (u) u.classList.remove('shake'); }, 600);
        toast(L('Не повезло: ', 'No luck: ') + esc(gname(lost)) + L(' сгорел', ' burned'), 'bad');
        from = S.inv.slice().sort(function(a, b){ return val(a) - val(b); })[0] || null; to = null; if (from) byK(2);
        busy = false; sync();
      }
    })(t0);
  }
  return {
    html: html,
    mount: function(pg){
      if (from) byK(2); else sync();
      $('#up-from', pg).addEventListener('click', pickFrom);
      $('#up-to', pg).addEventListener('click', pickTo);
      $('#up-go', pg).addEventListener('click', spin);
      $('#up-k', pg).addEventListener('click', function(e){ var b = e.target.closest('[data-k]'); if (b) { byK(parseFloat(b.getAttribute('data-k'))); TG.haptic('select'); } });
    }
  };
};

/* ── PvP: общий банк, шанс по доле ставки, колесо ── */
var PV = null;
function pvNew(){
  PV = { phase: 'wait', round: PV ? PV.round + 1 : 18240 + Math.floor(rnd() * 400), players: [], ends: Date.now() + 25000, angle: 0, nextBot: Date.now() + 800 };
  var n0 = 2;
  for (var i = 0; i < n0; i++) pvBot();
}
function pvBot(){
  var used = PV.players.map(function(p){ return p.name; });
  var name = pick(NAMES.filter(function(x){ return used.indexOf(x) < 0; }));
  var gifts = [], amt = 0;
  if (rnd() < 0.6) { var g = randGift(rnd() < 0.15 ? 60 : 14); gifts.push(g); amt = val(g); }
  else amt = r2(pick([1, 2, 3, 5, 8, 12, 20]) * (0.7 + rnd() * 0.6));
  PV.players.push({ name: name, h: pick(HUES), amt: amt, gifts: gifts, col: 'hsl(' + ((PV.players.length * 67 + 210) % 360) + ' 85% 62%)' });
}
V.pvp = function(){
  if (!PV || PV.phase === 'done') pvNew();
  var timer = 0, busy = false;
  var html = head('PvP', L('Шанс равен вашей доле в банке', 'Your chance equals your share of the pot'), 'hub') +
    '<div class="pv glass"><div class="pv-top"><span>' + L('Раунд ', 'Round ') + '#<b id="pv-r"></b></span><span id="pv-t" class="pv-t"></span></div>' +
    '<div class="pv-w"><svg viewBox="0 0 220 220" class="pvw"><g id="pv-g"></g></svg><i class="pv-ptr"></i><div class="pv-c"><small>' + L('Банк', 'Pot') + '</small><b id="pv-pot"></b></div></div></div>' +
    '<div class="bet glass"><div class="bet-r"><label>' + L('Ставка', 'Bet') + '</label><div class="num-in"><button data-d="-1">−</button><input id="pv-bet" inputmode="decimal" value="2"><button data-d="1">+</button></div></div>' +
    '<div class="row2"><button class="btn" id="pv-ton">' + L('Войти на TON', 'Join with TON') + '</button><button class="btn ghost" id="pv-gift">' + ic('gift') + L('Подарком', 'With a gift') + '</button></div></div>' +
    '<h4 class="sec">' + L('Участники', 'Players') + '</h4><div class="pl" id="pv-pl"></div>';
  function total(){ return PV.players.reduce(function(s, p){ return s + p.amt; }, 0); }
  function arc(cx, cy, r, a0, a1){
    var rad = function(a){ return (a - 90) * Math.PI / 180; };
    var x0 = cx + r * Math.cos(rad(a0)), y0 = cy + r * Math.sin(rad(a0)), x1 = cx + r * Math.cos(rad(a1)), y1 = cy + r * Math.sin(rad(a1));
    return 'M' + x0.toFixed(2) + ' ' + y0.toFixed(2) + 'A' + r + ' ' + r + ' 0 ' + (a1 - a0 > 180 ? 1 : 0) + ' 1 ' + x1.toFixed(2) + ' ' + y1.toFixed(2);
  }
  function wheel(){
    var tot = total(), a = 0, out = '';
    PV.players.forEach(function(p){
      var sw = tot ? p.amt / tot * 360 : 0; p.a0 = a; p.a1 = a + sw;
      if (PV.players.length === 1) out += '<circle cx="110" cy="110" r="88" fill="none" stroke="' + p.col + '" stroke-width="30"/>';
      else out += '<path d="' + arc(110, 110, 88, a + 0.6, a + sw - 0.6) + '" fill="none" stroke="' + p.col + '" stroke-width="30"/>';
      a += sw;
    });
    $('#pv-g').innerHTML = out;
    $('#pv-pot').innerHTML = ic('ton') + fmt(tot);
  }
  function list(){
    var tot = total();
    $('#pv-pl').innerHTML = PV.players.slice().sort(function(a, b){ return b.amt - a.amt; }).map(function(p){
      return '<div class="pr ' + (p.me ? 'me' : '') + (PV.winner === p ? ' won' : '') + '"><i class="pv-dot" style="background:' + p.col + '"></i>' + ava(p.name, p.h) + '<b>' + esc(p.name) + '</b>' + (p.gifts.length ? '<span class="pv-gs">' + p.gifts.slice(0, 3).map(function(g){ return art(g, 'xs'); }).join('') + '</span>' : '') + '<span class="pl-b">' + ic('ton') + fmt(p.amt) + '</span><span class="pv-ch">' + (tot ? (p.amt / tot * 100).toFixed(1) : '0') + '%</span></div>';
    }).join('');
  }
  function sync(){
    $('#pv-r').textContent = PV.round;
    var t = $('#pv-t');
    if (PV.phase === 'wait') t.textContent = PV.players.length < 2 ? L('Ждём второго игрока', 'Waiting for a second player') : L('Старт через ', 'Start in ') + Math.ceil(Math.max(0, PV.ends - Date.now()) / 1000) + L(' с', 's');
    else if (PV.phase === 'spin') t.textContent = L('Крутим', 'Spinning');
    else t.textContent = L('Победитель: ', 'Winner: ') + PV.winner.name;
    var joinable = PV.phase === 'wait';
    $('#pv-ton').disabled = !joinable; $('#pv-gift').disabled = !joinable;
    wheel(); list();
  }
  function meRow(){ var m = PV.players.filter(function(p){ return p.me; })[0]; if (!m) { m = { name: L('Вы', 'You'), h: 268, amt: 0, gifts: [], me: 1, col: 'hsl(268 90% 66%)' }; PV.players.push(m); count('pvp'); } return m; }
  function joinTon(){
    var v = clamp(parseFloat(String($('#pv-bet').value).replace(',', '.')) || 0, 0.5, 1000);
    if (PV.phase !== 'wait' || !pay(v)) return;
    var m = meRow(); m.amt = r2(m.amt + v); points(v * 10); save(); renderMe(); TG.haptic('medium'); snd('tap'); sync();
  }
  function joinGift(){
    if (PV.phase !== 'wait') return;
    if (!S.inv.length) { toast(L('Инвентарь пуст', 'Inventory is empty'), 'bad'); return; }
    sheet('<h3>' + L('Поставить подарок', 'Bet a gift') + '</h3><div class="pick">' + S.inv.slice().sort(function(a, b){ return val(b) - val(a); }).map(function(g){ return '<button data-id="' + g.id + '">' + card(g) + '</button>'; }).join('') + '</div>', function(el){
      el.addEventListener('click', function(e){
        var b = e.target.closest('[data-id]'); if (!b || PV.phase !== 'wait') return;
        var g = S.inv.filter(function(x){ return x.id === +b.getAttribute('data-id'); })[0];
        S.inv = S.inv.filter(function(x){ return x !== g; });
        var m = meRow(); m.gifts.push({ m: g.m, b: g.b }); m.amt = r2(m.amt + val(g)); points(val(g) * 10);
        save(); renderMe(); closeSheet(); TG.haptic('medium'); sync();
      });
    });
  }
  function spin(){
    PV.phase = 'spin'; busy = true; sync();
    var tot = total(), x = rnd() * tot, acc = 0, win = PV.players[PV.players.length - 1];
    for (var i = 0; i < PV.players.length; i++) { acc += PV.players[i].amt; if (x <= acc) { win = PV.players[i]; break; } }
    var p = win.a0 + (0.1 + rnd() * 0.8) * (win.a1 - win.a0);
    var start = PV.angle, end = start + 360 * (REDUCED ? 1 : 6) + ((360 - p) - start % 360 + 720) % 360;
    var g = $('#pv-g'), t0 = performance.now(), dur = REDUCED ? 600 : 5200, lt = -1;
    TG.haptic('heavy');
    (function step(now){
      var q = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - q, 4);
      PV.angle = start + (end - start) * e;
      if (g && g.isConnected) g.setAttribute('transform', 'rotate(' + PV.angle.toFixed(2) + ' 110 110)');
      var tk = Math.floor(PV.angle / 12); if (tk !== lt) { lt = tk; snd('tick'); }
      if (q < 1) { requestAnimationFrame(step); return; }
      PV.phase = 'done'; PV.winner = win; busy = false;
      if (win.me) {
        var tonPart = 0, ids = [], gifts = [];
        PV.players.forEach(function(pl){ var gv = pl.gifts.reduce(function(s, gg){ return s + val(gg); }, 0); tonPart += pl.amt - gv; pl.gifts.forEach(function(gg){ ids.push(addGift(gg).id); gifts.push(gg); }); });
        var tonWin = r2(tonPart * rtp('pvp'));
        if (tonWin > 0) { money(tonWin); gifts.push({ ton: tonWin }); }
        count('pvpwin'); S.best = Math.max(S.best, tot); save(); renderMe();
        if ($('#pv-g')) winModal(gifts, { ids: ids, title: L('Банк ваш!', 'The pot is yours!'), cost: 1 });
      } else if (PV.players.some(function(pl){ return pl.me; })) { snd('lose'); TG.haptic('error'); toast(L('Банк забрал ', 'Pot went to ') + esc(win.name), 'bad'); }
      if ($('#pv-pl')) sync();
      setTimeout(function(){ if (PV.phase === 'done') { pvNew(); if ($('#pv-pl')) { PV.angle = 0; $('#pv-g').setAttribute('transform', ''); sync(); } } }, 4500);
    })(t0);
  }
  return {
    html: html,
    mount: function(pg){
      $('#pv-g', pg).setAttribute('transform', 'rotate(' + (PV.angle % 360).toFixed(2) + ' 110 110)');
      sync();
      timer = setInterval(function(){
        if (PV.phase !== 'wait') return;
        var now = Date.now();
        if (now >= PV.nextBot && PV.players.length < 7 && PV.ends - now > 2500) { pvBot(); PV.nextBot = now + 1500 + rnd() * 3500; snd('tap'); }
        if (PV.players.length < 2) PV.ends = Math.max(PV.ends, now + 8000);
        if (now >= PV.ends && PV.players.length >= 2) spin(); else sync();
      }, 250);
      $('#pv-ton', pg).addEventListener('click', joinTon);
      $('#pv-gift', pg).addEventListener('click', joinGift);
      pg.addEventListener('click', function(e){
        var d = e.target.closest('[data-d]'), inp = $('#pv-bet', pg); if (!d) return;
        var v = parseFloat(inp.value) || 1;
        inp.value = String(r2(clamp(v + (+d.getAttribute('data-d')) * (v >= 10 ? 5 : 1), 0.5, 1000))); TG.haptic('select');
      });
    },
    leave: function(){ clearInterval(timer); }
  };
};

/* ── Инвентарь: продать, вывести, улучшить ── */
V.inv = function(){
  var sort = 'v';
  var html = head(L('Инвентарь', 'Inventory'), '') +
    '<div class="inv-s glass"><div><small>' + L('Подарков', 'Gifts') + '</small><b id="iv-n"></b></div><div><small>' + L('Стоимость', 'Value') + '</small><b id="iv-v"></b></div><button class="btn sm ghost" id="iv-all">' + L('Продать всё', 'Sell all') + '</button></div>' +
    '<div class="seg sm" id="iv-sort"><button data-s="v" class="on">' + L('Дороже', 'Price') + '</button><button data-s="n">' + L('Новые', 'Newest') + '</button><button data-s="r">' + L('Редкость', 'Rarity') + '</button></div>' +
    '<div class="grid" id="iv-g"></div>' +
    '<button class="dep glass" data-act="deposit">' + ic('gift') + '<span><b>' + L('Внести подарок', 'Deposit a gift') + '</b><small>' + L('Как перевести свои подарки из Telegram', 'How to move your Telegram gifts in') + '</small></span></button>';
  function render(){
    var list = S.inv.slice();
    list.sort(sort === 'n' ? function(a, b){ return b.at - a.at; } : sort === 'r' ? function(a, b){ return rar(b) - rar(a) || val(b) - val(a); } : function(a, b){ return val(b) - val(a); });
    $('#iv-n').textContent = list.length;
    $('#iv-v').innerHTML = ic('ton') + fmt(list.reduce(function(s, g){ return s + val(g); }, 0));
    $('#iv-all').disabled = !list.length;
    $('#iv-g').innerHTML = list.length ? list.map(function(g, i){ return '<button class="gi" data-id="' + g.id + '" style="--d:' + Math.min(i, 12) * 30 + 'ms">' + card(g) + '</button>'; }).join('')
      : '<div class="empty">' + boxArt(BOXES[0], 'float') + '<b>' + L('Пока пусто', 'Nothing yet') + '</b><p>' + L('Откройте бесплатный FREE24 или любой бокс.', 'Open the free FREE24 or any box.') + '</p><button class="btn" data-go="home">' + L('К боксам', 'To boxes') + '</button></div>';
  }
  function sell(ids){
    var sum = 0;
    S.inv = S.inv.filter(function(x){ if (ids.indexOf(x.id) >= 0) { sum += val(x); return false; } return true; });
    money(sum); points(sum * 10); count('sell', ids.length); save(); renderMe(); render();
    snd('coin'); TG.haptic('success'); toast(L('Продано за ', 'Sold for ') + fmt(sum) + ' TON', 'good');
  }
  function detail(id){
    var g = S.inv.filter(function(x){ return x.id === id; })[0]; if (!g) return;
    var r = rar(g), dark = g.b === 'black' || g.b === 'onyx';
    sheet('<div class="dt ' + RAR[r][1] + '">' + art(g, 'dt-art') + '<span class="rar-chip ' + RAR[r][1] + '">' + RAR[r][0] + '</span><h3>' + esc(gname(g)) + '</h3>' +
      '<div class="dt-t"><div><small>' + L('Модель', 'Model') + '</small><b>' + esc(gname(g)) + '</b></div><div><small>' + L('Фон', 'Backdrop') + '</small><b>' + esc(bname(g)) + '</b></div><div><small>' + L('Цена', 'Price') + '</small><b>' + ic('ton') + fmt(val(g)) + '</b></div></div>' +
      (dark ? '<p class="note">' + L('Фоны Black и Onyx Black считаются по цене торгов, поэтому подарок дороже такого же на обычном фоне.', 'Black and Onyx Black backdrops are priced at trading value, so the gift is worth more than the same one on a plain backdrop.') + '</p>' : '') +
      '<div class="dt-b"><button class="btn" data-s="sell">' + L('Продать за ', 'Sell for ') + fmt(val(g)) + '</button><button class="btn ghost" data-s="out">' + ic('send') + L('Вывести', 'Withdraw') + '</button><button class="btn ghost" data-s="up">' + ic('up') + L('Улучшить', 'Upgrade') + '</button></div></div>', function(el){
      el.addEventListener('click', function(e){
        var b = e.target.closest('[data-s]'); if (!b) return;
        var a = b.getAttribute('data-s');
        if (a === 'sell') { closeSheet(); sell([id]); }
        else if (a === 'up') { closeSheet(true); go('upgrade', id); }
        else withdraw(g);
      });
    });
  }
  return {
    html: html,
    mount: function(pg){
      render();
      $('#iv-sort', pg).addEventListener('click', function(e){ var b = e.target.closest('[data-s]'); if (!b) return; sort = b.getAttribute('data-s'); $$('[data-s]', $('#iv-sort', pg)).forEach(function(x){ x.classList.toggle('on', x === b); }); render(); TG.haptic('select'); });
      $('#iv-g', pg).addEventListener('click', function(e){ var b = e.target.closest('[data-id]'); if (b) { TG.haptic('light'); detail(+b.getAttribute('data-id')); } });
      $('#iv-all', pg).addEventListener('click', function(){
        var sum = S.inv.reduce(function(s, g){ return s + val(g); }, 0);
        sheet('<h3>' + L('Продать все подарки?', 'Sell every gift?') + '</h3><p class="sh-p">' + S.inv.length + L(' шт. за ', ' items for ') + fmt(sum) + L(' демо-TON. Их не вернуть.', ' demo TON. This cannot be undone.') + '</p><div class="row2"><button class="btn ghost" data-close>' + L('Отмена', 'Cancel') + '</button><button class="btn" id="sell-ok">' + L('Продать', 'Sell') + '</button></div>', function(el){
          $('#sell-ok', el).addEventListener('click', function(){ closeSheet(); sell(S.inv.map(function(x){ return x.id; })); });
        });
      });
    }
  };
};
function withdraw(g){
  sheet('<div class="dt">' + art(g, 'dt-art') + '<h3>' + L('Вывод подарка', 'Gift withdrawal') + '</h3>' +
    '<ol class="steps"><li><b>' + L('Вы нажимаете «Вывести»', 'You tap «Withdraw»') + '</b><span>' + L('Подарок блокируется в инвентаре, чтобы его не продать дважды.', 'The gift is locked in the inventory so it cannot be sold twice.') + '</span></li><li><b>' + L('Аккаунт-хранитель передаёт его вам', 'The custody account sends it to you') + '</b><span>' + L('Обычный подарок Telegram приходит в ваш профиль, обычно за пару минут.', 'A regular Telegram gift arrives in your profile, usually within minutes.') + '</span></li><li><b>' + L('Готово', 'Done') + '</b><span>' + L('Бот присылает сообщение, подарок виден у вас в профиле.', 'The bot messages you and the gift shows up in your profile.') + '</span></li></ol>' +
    '<div class="demo-note">' + ic('bolt') + '<span>' + L('Это демо: настоящий вывод не подключён. Подарок остаётся в инвентаре.', 'This is a demo: real withdrawal is not connected. The gift stays in your inventory.') + '</span></div>' +
    '<button class="btn big" data-close>' + L('Понятно', 'Got it') + '</button></div>');
}

/* ── Депозит: подарком, TON или Stars, всё демо ── */
function deposit(){
  var tab = 'gift';
  sheet('<h3>' + L('Пополнить баланс', 'Top up') + '</h3><div class="seg" id="dp-t"><button data-t="gift" class="on">' + L('Подарок', 'Gift') + '</button><button data-t="ton">TON</button><button data-t="stars">Stars</button></div><div id="dp-b"></div><div class="demo-note">' + ic('bolt') + '<span>' + L('Демо: платежи и кошелёк не подключены, начисляется игровая валюта.', 'Demo: no payments or wallet connected, you get play money.') + '</span></div>', function(el){
    function body(){
      var b = $('#dp-b', el);
      if (tab === 'gift') b.innerHTML = '<ol class="steps"><li><b>' + L('Откройте подарок в своём профиле Telegram', 'Open a gift in your Telegram profile') + '</b><span>' + L('Подойдёт любой коллекционный подарок.', 'Any collectible gift works.') + '</span></li><li><b>' + L('Нажмите «Передать» и выберите аккаунт-хранитель', 'Tap «Transfer» and pick the custody account') + '</b><span>' + L('Его имя бот покажет в боевой версии.', 'The bot shows its name in the live version.') + '</span></li><li><b>' + L('Подарок появится в инвентаре', 'The gift appears in the inventory') + '</b><span>' + L('С его моделью, фоном и ценой, за 1 демо-TON цены 20 очков рейтинга.', 'With model, backdrop and price, 20 leaderboard points per demo TON of value.') + '</span></li></ol><button class="btn big" id="dp-go">' + ic('gift') + L('Получить демо-подарок', 'Get a demo gift') + '</button>';
      else b.innerHTML = '<div class="amts">' + (tab === 'ton' ? [5, 10, 25, 50] : [100, 250, 500, 1000]).map(function(a, i){ return '<button data-a="' + a + '" class="' + (i === 1 ? 'on' : '') + '"><b>' + a + '</b><small>' + (tab === 'ton' ? 'TON' : 'Stars · ≈' + fmt(a * 0.0042 * 10) + ' TON') + '</small></button>'; }).join('') + '</div><button class="btn big" id="dp-go">' + L('Пополнить (демо)', 'Top up (demo)') + '</button>';
    }
    body();
    $('#dp-t', el).addEventListener('click', function(e){ var x = e.target.closest('[data-t]'); if (!x) return; tab = x.getAttribute('data-t'); $$('[data-t]', el).forEach(function(y){ y.classList.toggle('on', y === x); }); body(); TG.haptic('select'); });
    $('#dp-b', el).addEventListener('click', function(e){
      var a = e.target.closest('[data-a]');
      if (a) { $$('[data-a]', el).forEach(function(y){ y.classList.toggle('on', y === a); }); TG.haptic('select'); return; }
      if (!e.target.closest('#dp-go')) return;
      if (tab === 'gift') {
        var g = randGift(rnd() < 0.2 ? 40 : 10), x = addGift(g);
        points(val(g) * 20); count('dep'); depDay(val(g)); save(); renderMe(); closeSheet();
        winModal([g], { ids: [x.id], title: L('Подарок внесён', 'Gift deposited') });
      } else {
        var on = $('[data-a].on', el), n = +(on ? on.getAttribute('data-a') : 10);
        var ton = tab === 'ton' ? n : r2(n * 0.042);
        money(ton); points(ton * 20); count('dep'); depDay(ton); save(); renderMe(); closeSheet();
        celebrate(false); toast('+' + fmt(ton) + L(' демо-TON на балансе', ' demo TON added'), 'good');
      }
    });
  });
}

/* ── Рейтинг недели: очки и 250 призов ── */
function hash32(n){ n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3) | 0; n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); return ((n ^ (n >>> 15)) >>> 0) / 4294967296; }
var PRIZES = [
  ['1', { m: 'cat', b: 'lav' }], ['2', { m: 'locket', b: 'fuchsia' }], ['3', { m: 'crown', b: 'sky' }], ['4-5', { m: 'cap', b: 'black' }],
  ['6-10', { m: 'helmet', b: 'cobalt' }], ['11-20', { m: 'watch', b: 'sunset' }], ['21-50', { m: 'ring', b: 'lav' }], ['51-100', { m: 'potion', b: 'emerald' }], ['101-250', { m: 'flame', b: 'sky' }]
];
function board(){
  var wk = weekId(), list = [], into = (Date.now() - (weekEnd() - 7 * 864e5)) / (7 * 864e5);
  for (var i = 0; i < 250; i++) list.push({ name: NAMES[(i * 7 + wk) % NAMES.length] + (i > 19 ? ' ' + (Math.floor(hash32(wk * 977 + i) * 90) + 10) : ''), h: HUES[i % HUES.length], pts: Math.round((52000 * Math.pow(0.975, i) + hash32(wk + i * 31) * 300) * (0.25 + into * 0.75)) });
  list.sort(function(a, b){ return b.pts - a.pts; });
  var place = 1 + list.filter(function(x){ return x.pts > S.pts; }).length;
  return { list: list, place: place };
}
function prizeFor(place){ for (var i = 0; i < PRIZES.length; i++) { var p = PRIZES[i][0].split('-'); if (place <= +(p[1] || p[0])) return PRIZES[i][1]; } return null; }
V.top = function(){
  var tab = 'top', tm = 0;
  var bd = board();
  var html = head(L('Рейтинг недели', 'Weekly leaderboard'), L('250 призов · до конца ', '250 prizes · ends in ') + '<span id="tp-t">' + dhm(weekEnd() - Date.now()) + '</span>') +
    '<div class="me-card glass"><span class="me-pl">#' + (bd.place > 250 ? '250+' : bd.place) + '</span><div><b>' + L('Ваше место', 'Your place') + '</b><small>' + fmt0(S.pts) + L(' очков', ' points') + (bd.place <= 250 ? '' : ' · ' + L('до 250 места ', 'to place 250: ') + fmt0(bd.list[249].pts - S.pts + 1)) + '</small></div>' + (bd.place <= 250 ? art(prizeFor(bd.place), 'sm') : '') + '</div>' +
    '<button class="mini glass wide" data-go="tasks">' + ic('ticket') + '<span><b>' + L('Задания и розыгрыш недели', 'Tasks and weekly giveaway') + '</b><small>' + L('Билеты за задания, у вас ', 'Tickets for tasks, you have ') + S.tix + '</small></span></button>' +
    '<div class="seg" id="tp-s"><button data-t="top" class="on">' + L('Рейтинг', 'Top') + '</button><button data-t="prize">' + L('Призы', 'Prizes') + '</button><button data-t="how">' + L('Очки', 'Points') + '</button></div><div id="tp-b"></div>';
  function body(){
    var b = $('#tp-b');
    if (tab === 'top') {
      var rows = bd.list.slice(0, 50), out = '', meShown = false;
      rows.forEach(function(x, i){
        if (!meShown && S.pts >= x.pts && S.pts > 0) { out += row(i + 1, { name: L('Вы', 'You'), h: 268, pts: S.pts, me: 1 }); meShown = true; }
        out += row(i + 1 + (meShown ? 1 : 0), x);
      });
      if (!meShown) out += '<div class="lb-gap">···</div>' + row(bd.place, { name: L('Вы', 'You'), h: 268, pts: S.pts, me: 1 });
      b.innerHTML = '<div class="lb">' + out + '</div>';
    } else if (tab === 'prize') {
      b.innerHTML = '<div class="prz">' + PRIZES.map(function(p){ return '<div class="pz ' + RAR[rar(p[1])][1] + '">' + art(p[1]) + '<div><b>' + p[0] + L(' место', ' place') + '</b><small>' + esc(gname(p[1])) + ' · ' + esc(bname(p[1])) + '</small></div><span class="gc-v">' + ic('ton') + fmt(val(p[1])) + '</span></div>'; }).join('') + '</div>';
    } else {
      var how = [[L('Депозит', 'Deposit'), L('20 очков за 1 TON', '20 pts per 1 TON')], [L('Продажа подарка', 'Selling a gift'), L('10 очков за 1 TON', '10 pts per 1 TON')], [L('Открытие боксов', 'Opening boxes'), L('10 очков за 1 TON и 5 за открытие', '10 pts per 1 TON plus 5 per open')], ['Rocket', L('10 очков за 1 TON ставки', '10 pts per 1 TON bet')], ['PvP', L('10 очков за 1 TON в банке', '10 pts per 1 TON in the pot')], ['Play Hub', L('Dice и Upgrade: 10 очков за 1 TON', 'Dice and Upgrade: 10 pts per 1 TON')]];
      b.innerHTML = '<div class="how">' + how.map(function(h){ return '<div><b>' + h[0] + '</b><span>' + h[1] + '</span></div>'; }).join('') + '</div><p class="note">' + L('Рейтинг обнуляется каждый понедельник в 00:00. Призы приходят в инвентарь.', 'The board resets every Monday at 00:00. Prizes land in the inventory.') + '</p>';
    }
  }
  function row(n, x){ var pz = prizeFor(n); return '<div class="lr ' + (x.me ? 'me' : '') + (n <= 3 ? ' p' + n : '') + '"><span class="lr-n">' + n + '</span>' + ava(x.name, x.h) + '<b>' + esc(x.name) + '</b><span class="lr-p">' + fmt0(x.pts) + '</span>' + (pz ? art(pz, 'xs') : '') + '</div>'; }
  return {
    html: html,
    mount: function(pg){
      body();
      $('#tp-s', pg).addEventListener('click', function(e){ var x = e.target.closest('[data-t]'); if (!x) return; tab = x.getAttribute('data-t'); $$('[data-t]', pg).forEach(function(y){ y.classList.toggle('on', y === x); }); body(); TG.haptic('select'); });
      tm = setInterval(function(){ var t = $('#tp-t'); if (t) t.textContent = dhm(weekEnd() - Date.now()); }, 30000);
    },
    leave: function(){ clearInterval(tm); }
  };
};

/* ── Задания и недельный розыгрыш по билетам ── */
var TASKS = [
  ['free', 1, 1, L('Откройте FREE24 Box', 'Open the FREE24 Box'), 'home'],
  ['boxes', 3, 2, L('Откройте 3 бокса', 'Open 3 boxes'), 'home'],
  ['rocket', 3, 2, L('Сыграйте в Rocket 3 раза', 'Play Rocket 3 times'), 'rocket'],
  ['dicewin', 1, 1, L('Выиграйте в Dice', 'Win at Dice'), 'dice'],
  ['pvp', 1, 2, L('Сыграйте раунд PvP', 'Play a PvP round'), 'pvp'],
  ['sell', 1, 1, L('Продайте подарок', 'Sell a gift'), 'inv'],
  ['dep', 1, 3, L('Пополните баланс', 'Top up your balance'), 'deposit'],
  ['ref', 1, 5, L('Пригласите друга', 'Invite a friend'), 'profile'],
  ['sub', 1, 1, L('Подпишитесь на канал', 'Join the channel'), 'sub']
];
var GIVE = [{ m: 'watch', b: 'onyx' }, { m: 'watch', b: 'sunset' }, { m: 'watch', b: 'cobalt' }, { m: 'watch', b: 'sky' }];
V.tasks = function(){
  var tm = 0;
  var drawAt = weekEnd();
  function poolTotal(){ return 14200 + Math.round((Date.now() - (weekEnd() - 7 * 864e5)) / 36e5 * 96) + S.pool; }
  var html = head(L('Задания и розыгрыш', 'Tasks and giveaway'), '', 'top') +
    '<div class="gv glass"><div class="gv-h"><span class="chip">' + L('Розыгрыш недели', 'Weekly giveaway') + '</span><span class="gv-t" id="gv-t"></span></div>' +
    '<div class="gv-p">' + GIVE.map(function(g, i){ return '<div class="gv-i ' + RAR[rar(g)][1] + '">' + art(g) + '<small>' + (i === 3 ? '×12' : esc(bname(g))) + '</small></div>'; }).join('') + '</div>' +
    '<div class="gv-s"><div><small>' + L('Билетов у вас', 'Your tickets') + '</small><b id="gv-my">' + S.tix + '</b></div><div><small>' + L('В розыгрыше ваших', 'Yours in the draw') + '</small><b id="gv-in">' + S.pool + '</b></div><div><small>' + L('Шанс на приз', 'Prize chance') + '</small><b id="gv-c"></b></div></div>' +
    '<button class="btn big" id="gv-go">' + ic('ticket') + L('Бросить все билеты', 'Drop all tickets') + '</button><p class="note">' + L('15 призов. Больше билетов в розыгрыше, выше шанс.', '15 prizes. More tickets in the draw, higher chance.') + '</p></div>' +
    '<h4 class="sec">' + L('Задания', 'Tasks') + '</h4><div class="tk" id="tk"></div>';
  function sync(){
    $('#gv-my').textContent = S.tix; $('#gv-in').textContent = S.pool;
    var pool = poolTotal(), c = 1 - Math.pow(1 - S.pool / pool, 15);
    $('#gv-c').textContent = S.pool ? (c * 100).toFixed(2) + '%' : '0%';
    $('#gv-go').disabled = !S.tix;
    $('#gv-t').textContent = L('итоги через ', 'draw in ') + dhm(drawAt - Date.now());
    $('#tk').innerHTML = TASKS.map(function(t){
      var have = Math.min(t[1], S.cnt[t[0]] || 0), done = have >= t[1], got = S.tasks[t[0]];
      return '<div class="tr ' + (got ? 'got' : done ? 'done' : '') + '"><span class="tr-i">' + (got ? ic('check') : ic('ticket')) + '</span><div><b>' + t[3] + '</b><div class="tr-bar"><i style="width:' + (have / t[1] * 100) + '%"></i></div><small>' + have + '/' + t[1] + ' · +' + t[2] + L(' бил.', ' tix') + '</small></div>' +
        (got ? '<span class="tr-ok">' + L('Готово', 'Done') + '</span>' : done ? '<button class="btn sm" data-claim="' + t[0] + '">' + L('Забрать', 'Claim') + '</button>' : '<button class="btn sm ghost" data-do="' + t[4] + '">' + L('Начать', 'Go') + '</button>') + '</div>';
    }).join('');
  }
  return {
    html: html,
    mount: function(pg){
      sync();
      tm = setInterval(sync, 30000);
      $('#gv-go', pg).addEventListener('click', function(){ if (!S.tix) return; S.pool += S.tix; S.tix = 0; save(); sync(); TG.haptic('success'); snd('coin'); confetti(40, null, 220); toast(L('Билеты в розыгрыше. Удачи!', 'Tickets are in the draw. Good luck!'), 'good'); });
      $('#tk', pg).addEventListener('click', function(e){
        var c = e.target.closest('[data-claim]'), d = e.target.closest('[data-do]');
        if (c) { var t = TASKS.filter(function(x){ return x[0] === c.getAttribute('data-claim'); })[0]; S.tasks[t[0]] = 1; S.tix += t[2]; save(); sync(); TG.haptic('success'); snd('coin'); toast('+' + t[2] + L(' билет(а)', ' ticket(s)'), 'good'); }
        if (d) {
          var w = d.getAttribute('data-do');
          if (w === 'deposit') deposit();
          else if (w === 'sub') { count('sub'); save(); sync(); toast(L('В демо канала нет, задание засчитано', 'No channel in the demo, task counted'), 'good'); }
          else go(w);
        }
      });
    },
    leave: function(){ clearInterval(tm); }
  };
};

/* ── Профиль, рефералка, настройки ── */
V.profile = function(){
  var code = 'ref_' + (S.code || (S.code = Math.random().toString(36).slice(2, 8).toUpperCase())); save();
  var link = 't.me/…/app?startapp=' + code;
  var name = TG.user && TG.user.first_name ? TG.user.first_name : L('Гость', 'Guest');
  var html = '<div class="pf glass"><span class="av big" style="--h:268">' + esc(name.slice(0, 1).toUpperCase()) + '</span><div><h2>' + esc(name) + '</h2><p>' + L('Уровень ', 'Level ') + level() + ' · ' + fmt0(S.all) + L(' очков за всё время', ' lifetime points') + '</p></div></div>' +
    '<div class="stats">' + [[L('Боксов', 'Boxes'), S.cnt.boxes || 0], [L('Игр', 'Games'), (S.cnt.rocket || 0) + (S.cnt.dice || 0) + (S.cnt.pvp || 0) + (S.cnt.upgrade || 0)], [L('Лучший выигрыш', 'Best win'), fmt(S.best)], [L('Подарков', 'Gifts'), S.inv.length]].map(function(s){ return '<div class="glass"><small>' + s[0] + '</small><b>' + s[1] + '</b></div>'; }).join('') + '</div>' +
    '<div class="ref glass"><div class="ref-h">' + ic('users') + '<div><b>' + L('10% с каждого депозита друга', '10% of every friend deposit') + '</b><small>' + L('Пожизненно, сразу на баланс', 'For life, straight to your balance') + '</small></div></div>' +
    '<div class="ref-l"><code>' + link + '</code><button class="btn sm" id="ref-c">' + ic('copy') + L('Копировать', 'Copy') + '</button></div>' +
    '<label class="ref-calc"><span>' + L('Если друзья внесут за месяц', 'If friends deposit per month') + ' <b id="ref-a">100 TON</b></span><input type="range" class="rng" id="ref-r" min="10" max="2000" step="10" value="100"><span>' + L('ваш доход', 'your income') + ' <b id="ref-i" class="ok">10 TON</b></span></label>' +
    '<div class="ref-s"><div><small>' + L('Друзей', 'Friends') + '</small><b>' + (S.ref || 0) + '</b></div><div><small>' + L('Заработано', 'Earned') + '</small><b>' + ic('ton') + '0.00</b></div></div></div>' +
    '<h4 class="sec">' + L('Настройки', 'Settings') + '</h4><div class="set glass">' +
    '<div class="set-r"><span>' + L('Звук', 'Sound') + '</span><label class="tog"><input type="checkbox" id="st-snd"' + (S.snd ? ' checked' : '') + '><span></span></label></div>' +
    '<div class="set-r"><span>' + L('Графика', 'Graphics') + '</span><div class="seg sm" id="st-q"><button data-q="high">High</button><button data-q="medium">Medium</button><button data-q="low">Low</button></div></div>' +
    '<div class="set-r"><span>' + L('Язык', 'Language') + '</span><div class="seg sm"><a href="' + BASE + '" data-lang class="' + (EN ? '' : 'on') + '">RU</a><a href="' + BASE + '/en" data-lang class="' + (EN ? 'on' : '') + '">EN</a></div></div>' +
    '<div class="set-r"><span>' + L('Начать демо заново', 'Restart the demo') + '</span><button class="btn sm ghost" id="st-reset">' + L('Сбросить', 'Reset') + '</button></div></div>' +
    '<a class="adm-link glass" href="' + BASE + (EN ? '/en' : '') + '/admin">' + ic('panel') + '<span><b>' + L('Панель оператора', 'Operator panel') + '</b><small>' + L('RTP, депозиты и выводы, игроки, промокоды, рефералы', 'RTP, deposits and withdrawals, players, promo codes, referrals') + '</small></span></a>' +
    '<div class="about glass"><b>' + L('Это демо-макет', 'This is a demo') + '</b><p>' + L('DevUz Studio собрала его, чтобы показать механики и внешний вид. Деньги игровые, ставки и подарки ненастоящие, данные никуда не отправляются.', 'DevUz Studio built it to show the mechanics and the look. The money is play money, bets and gifts are not real, nothing is sent anywhere.') + '</p></div>' + legal();
  return {
    html: html,
    mount: function(pg){
      var r = $('#ref-r', pg);
      var syncR = function(){ var v = +r.value; $('#ref-a', pg).textContent = fmt0(v) + ' TON'; $('#ref-i', pg).textContent = fmt(v * 0.1) + ' TON'; r.style.setProperty('--p', ((v - 10) / 1990 * 100) + '%'); };
      syncR(); r.addEventListener('input', syncR);
      $('#ref-c', pg).addEventListener('click', function(){
        try { navigator.clipboard.writeText('https://' + link); } catch (e) {}
        if (!S.cnt.ref) { count('ref'); S.ref = 1; save(); }
        TG.haptic('success'); toast(L('Ссылка скопирована. В демо засчитан один друг.', 'Link copied. The demo counts one friend.'), 'good');
      });
      $('#st-snd', pg).addEventListener('change', function(e){ S.snd = e.target.checked; save(); renderSnd(); snd('tap'); });
      var q = $('#st-q', pg), syncQ = function(){ $$('[data-q]', q).forEach(function(b){ b.classList.toggle('on', b.getAttribute('data-q') === S.q); }); };
      syncQ(); q.addEventListener('click', function(e){ var b = e.target.closest('[data-q]'); if (!b) return; S.q = b.getAttribute('data-q'); save(); syncQ(); TG.haptic('select'); });
      $('#st-reset', pg).addEventListener('click', function(){
        sheet('<h3>' + L('Сбросить демо?', 'Reset the demo?') + '</h3><p class="sh-p">' + L('Баланс станет 25 демо-TON, инвентарь, очки и билеты начнутся заново.', 'Balance goes back to 25 demo TON, inventory, points and tickets start over.') + '</p><div class="row2"><button class="btn ghost" data-close>' + L('Отмена', 'Cancel') + '</button><button class="btn" id="rs-ok">' + L('Сбросить', 'Reset') + '</button></div>', function(el){
          $('#rs-ok', el).addEventListener('click', function(){ try { localStorage.removeItem(KEY); } catch (e) {} location.reload(); });
        });
      });
    }
  };
};

/* ── Общие действия ── */
document.addEventListener('click', function(e){
  var g = e.target.closest('[data-go]');
  if (g) { e.preventDefault(); var a = g.getAttribute('data-arg'); TG.haptic('light'); snd('tap'); go(g.getAttribute('data-go'), a); return; }
  var act = e.target.closest('[data-act]');
  if (act) {
    var k = act.getAttribute('data-act');
    if (k === 'deposit') { TG.haptic('light'); deposit(); }
    if (k === 'sound') { S.snd = !S.snd; save(); renderSnd(); snd('tap'); toast(S.snd ? L('Звук включён', 'Sound on') : L('Звук выключен', 'Sound off')); }
    return;
  }
  var lang = e.target.closest('[data-lang]');
  if (lang) { try { sessionStorage.setItem('gx-view', curName); } catch (x) {} if (location.hash) { e.preventDefault(); location.href = lang.getAttribute('href') + location.hash; } }
});
addEventListener('keydown', function(e){ if (e.key === 'Escape') closeSheet(); });
addEventListener('resize', function(){ if (fxRun) fxSize(); });
document.addEventListener('visibilitychange', function(){ if (document.hidden) save(); });
addEventListener('storage', function(e){
  if (e.key === AKEY) odds();
  if (e.key === KEY && e.newValue) { try { var n = JSON.parse(e.newValue); if (n && n.v === 1) { S = n; renderBal(); renderMe(); } } catch (x) {} }
});

TG.ready();
renderMe(); renderSnd(); balEl.textContent = fmt(S.bal);
var startView = 'home';
try { startView = sessionStorage.getItem('gx-view') || 'home'; } catch (e) {}
if (V[startView] && startView !== 'box') go(startView); else go('home');
var sp = $('#splash');
setTimeout(function(){ sp.classList.add('off'); setTimeout(function(){ sp.remove(); }, 600); }, REDUCED ? 50 : 900);
window.__gx = { go: go, state: function(){ return S; }, deposit: deposit };
})();
