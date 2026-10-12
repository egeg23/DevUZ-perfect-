(function(){
'use strict';
/* admin: панель оператора Giftora. Демо: цифры игровые, хранится в localStorage этого браузера. */
var root = document.documentElement;
var EN = root.lang === 'en';
var L = function(r, e){ return EN ? e : r; };
var BASE = root.getAttribute('data-base') || '';
var APP = BASE + (EN ? '/en' : '');
var $ = function(s, el){ return (el || document).querySelector(s); };
var $$ = function(s, el){ return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function sp(n){ return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
function ton(v){ v = Number(v) || 0; var a = Math.abs(v); return (v < 0 ? '−' : '') + (a >= 1000 ? sp(Math.round(a)) : a.toFixed(a >= 100 ? 0 : 2)); }
function pc(v, d){ return (v * 100).toFixed(d == null ? 1 : d) + '%'; }
function ic(k){ return '<svg class="ic"><use href="#i-' + k + '"/></svg>'; }
var DAY = 864e5;
function dstr(t){ var d = new Date(t); return ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2); }
function dfull(t){ var d = new Date(t); return dstr(t) + '.' + d.getFullYear(); }
/* Детерминированный поток чисел: одни и те же «вчерашние» цифры при каждом открытии. */
function rng(n){ return function(){ n |= 0; n = n + 0x6D2B79F5 | 0; var t = Math.imul(n ^ n >>> 15, 1 | n); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ── Настройки оператора: общие с приложением ── */
var AKEY = 'gx-admin-1', GKEY = 'gx-demo-1';
var BOXN = { start: L('Стартовый', 'Starter'), sweet: L('Сладкий', 'Sweet'), farm: 'FARM BOX', luck: L('Удача', 'Lucky'), night: L('Ночной', 'Night'), legend: L('Легенда', 'Legend') };
function defaults(){
  return {
    v: 1,
    rtp: { box: 90, rocket: 96, dice: 96, upgrade: 92, pvp: 95 },
    promos: [
      { code: 'DEMO', type: 'box', box: 'luck', ton: 0, limit: 1000, used: 412, until: Date.now() + 20 * DAY, on: 1 },
      { code: 'FARM', type: 'box', box: 'farm', ton: 0, limit: 500, used: 133, until: Date.now() + 9 * DAY, on: 1 },
      { code: 'GIFT', type: 'box', box: 'sweet', ton: 0, limit: 300, used: 287, until: Date.now() + 3 * DAY, on: 1 },
      { code: 'WELCOME5', type: 'ton', box: '', ton: 5, limit: 2000, used: 1290, until: Date.now() + 40 * DAY, on: 0 }
    ],
    refs: [
      { code: 'GIFTCHAT', name: L('Канал «Подарки и NFT»', 'Gifts & NFT channel'), pct: 10, clicks: 18420, regs: 2310, dep: 41200, on: 1 },
      { code: 'TONHUB', name: 'TON Hub', pct: 12, clicks: 9600, regs: 1180, dep: 25350, on: 1 },
      { code: 'STREAMKZ', name: L('Стример Арман', 'Streamer Arman'), pct: 15, clicks: 5240, regs: 870, dep: 19800, on: 1 },
      { code: 'CRYPTOSOFT', name: L('Блогер Ольга', 'Blogger Olga'), pct: 10, clicks: 2100, regs: 160, dep: 2400, on: 0 }
    ],
    users: {},
    log: []
  };
}
var A = null;
try { A = JSON.parse(localStorage.getItem(AKEY) || 'null'); } catch (e) {}
if (!A || A.v !== 1) A = defaults();
function save(what){
  if (what) { A.log.unshift({ at: Date.now(), t: what }); A.log = A.log.slice(0, 30); }
  try { localStorage.setItem(AKEY, JSON.stringify(A)); } catch (e) {}
}
function game(){ try { return JSON.parse(localStorage.getItem(GKEY) || 'null'); } catch (e) { return null; } }
function gameSave(g){ try { localStorage.setItem(GKEY, JSON.stringify(g)); } catch (e) {} }

/* ── Игровая статистика: 90 дней ── */
var today0 = new Date(); today0.setHours(0, 0, 0, 0); today0 = today0.getTime();
var DAYS = [];
(function(){
  var r = rng(4242);
  var dayPart = Math.max(0.08, (Date.now() - today0) / DAY);
  for (var i = 0; i < 90; i++) {
    var t = today0 - (89 - i) * DAY, dow = new Date(t).getDay();
    var base = 2400 + 2600 * (i / 89), week = dow === 5 || dow === 6 ? 1.22 : dow === 0 ? 1.12 : dow === 2 ? 0.9 : 1;
    var dep = base * week * (0.86 + r() * 0.28);
    if (r() < 0.07) dep *= 1.45;
    var wd = dep * (0.6 + r() * 0.2);
    if (r() < 0.05) wd = dep * (1.05 + r() * 0.2);
    var players = Math.round(dep / (7 + r() * 3)), fresh = Math.round(players * (0.12 + r() * 0.1));
    if (i === 89) { dep *= dayPart; wd *= dayPart; players = Math.round(players * Math.min(1, dayPart * 1.6)); fresh = Math.round(fresh * dayPart); }
    DAYS.push({ t: t, dep: Math.round(dep), wd: Math.round(wd), pl: players, nw: fresh });
  }
  var g = game();
  if (g && g.dd) { var mine = g.dd[String(today0)] || 0; DAYS[89].dep += mine; DAYS[89].mine = mine; }
})();
var GAMES = [['box', L('Боксы', 'Boxes'), 0.38], ['rocket', 'Rocket', 0.27], ['pvp', 'PvP', 0.15], ['dice', 'Dice', 0.12], ['upgrade', 'Upgrade', 0.08]];

/* ── Пользователи ── */
var NAMES = ['Тимур', 'Alex', 'Nodir', 'Kate', 'Мадина', 'Rustam', 'Lena', 'Jasur', 'Max', 'Diyor', 'Sofia', 'Bek', 'Аня', 'Oleg', 'Kamila', 'Sardor', 'Mira', 'Igor', 'Zara', 'Den', 'Арман', 'Ivan', 'Dana', 'Erik'];
var LAT = { 'Тимур': 'timur', 'Мадина': 'madina', 'Аня': 'anya', 'Арман': 'arman' };
var USERS = [];
(function(){
  var r = rng(777);
  for (var i = 0; i < 240; i++) {
    var n = NAMES[Math.floor(r() * NAMES.length)], whale = r() < 0.06;
    var dep = Math.round((whale ? 800 + r() * 9000 : 5 + r() * r() * 600) * 100) / 100;
    var wd = Math.round(dep * (r() < 0.12 ? 1.2 + r() : r() * 0.9) * 100) / 100;
    var refI = r() < 0.4 ? Math.floor(r() * 4) : -1;
    USERS.push({
      id: String(518200 + i * 37 + Math.floor(r() * 30)), name: n, un: (LAT[n] || n).toLowerCase() + Math.floor(r() * 900 + 100),
      reg: today0 - Math.floor(r() * 120) * DAY, seen: Date.now() - Math.floor(r() * r() * 30 * DAY), dep: dep, wd: wd,
      bal: Math.round(r() * (whale ? 400 : 30) * 100) / 100, games: Math.floor(10 + r() * (whale ? 4000 : 400)), ref: refI >= 0 ? ['GIFTCHAT', 'TONHUB', 'STREAMKZ', 'CRYPTOSOFT'][refI] : '', h: Math.floor(r() * 360)
    });
  }
  USERS.sort(function(a, b){ return b.seen - a.seen; });
})();
function meRow(){
  var g = game();
  return { id: 'me', name: L('Вы (это устройство)', 'You (this device)'), un: 'demo', reg: today0, seen: Date.now(), dep: g ? sumObj(g.dd) : 0, wd: 0, bal: g ? g.bal : 25, games: g && g.cnt ? (g.cnt.boxes || 0) + (g.cnt.rocket || 0) + (g.cnt.dice || 0) + (g.cnt.pvp || 0) + (g.cnt.upgrade || 0) : 0, ref: '', h: 268, me: 1 };
}
function sumObj(o){ var s = 0; for (var k in (o || {})) s += o[k]; return Math.round(s * 100) / 100; }
function over(u){ return A.users[u.id] || {}; }
function bal(u){ return u.me ? u.bal : Math.max(0, Math.round((u.bal + (over(u).adj || 0)) * 100) / 100); }
function flags(u){ var o = over(u), f = []; if (o.ban) f.push(['ban', L('Заблокирован', 'Blocked')]); if (o.vip || (!u.me && u.dep > 2000 && o.vip !== 0)) f.push(['vip', 'VIP']); if (u.wd > u.dep * 1.5 && u.dep > 20) f.push(['risk', L('Вывод больше депозитов', 'Cash out above deposits')]); return f; }

/* ── Каркас ── */
var main = $('#adm-main'), scroller = $('#adm-scroll'), tab = 'overview', period = 30;
var toastT = 0;
function toast(msg){ var t = $('#adm-toast'); t.innerHTML = msg; t.className = 'adm-toast on'; clearTimeout(toastT); toastT = setTimeout(function(){ t.className = 'adm-toast'; }, 2600); }
function show(name){
  tab = name;
  try { sessionStorage.setItem('gx-adm', name); } catch (e) {}
  $$('[data-tab]').forEach(function(b){ b.classList.toggle('on', b.getAttribute('data-tab') === name); });
  main.innerHTML = '<div class="adm-pg">' + VIEW[name]() + '</div>';
  scroller.scrollTop = 0;
  requestAnimationFrame(function(){ var p = main.firstChild; if (p) p.classList.add('in'); });
  if (MOUNT[name]) MOUNT[name]();
}
var VIEW = {}, MOUNT = {};
function head(t, sub, right){ return '<div class="ah"><div><h1>' + t + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' + (right || '') + '</div>'; }

/* ── Обзор: депозиты и выводы по дням ── */
function slice(){ return DAYS.slice(90 - period); }
function sumF(list, f){ return list.reduce(function(s, d){ return s + d[f]; }, 0); }
VIEW.overview = function(){
  var cur = slice(), prev = DAYS.slice(Math.max(0, 90 - period * 2), 90 - period);
  var dep = sumF(cur, 'dep'), wd = sumF(cur, 'wd'), net = dep - wd;
  var pdep = sumF(prev, 'dep') || 1, pwd = sumF(prev, 'wd') || 1, pnet = (sumF(prev, 'dep') - sumF(prev, 'wd')) || 1;
  var turnover = dep * 4.2, payout = 0;
  GAMES.forEach(function(g){ payout += turnover * g[2] * (A.rtp[g[0]] / 100); });
  var rtpNow = payout / turnover;
  var td = DAYS[89];
  var trend = function(a, b){ var d = (a - b) / Math.abs(b); return '<span class="tr ' + (d >= 0 ? 'up' : 'down') + '">' + (d >= 0 ? '+' : '−') + Math.abs(d * 100).toFixed(1) + '%</span>'; };
  var tiles = [
    [L('Депозиты', 'Deposits'), ton(dep) + ' TON', trend(dep, pdep), 'dep'],
    [L('Выводы', 'Withdrawals'), ton(wd) + ' TON', trend(wd, pwd), 'wd'],
    [L('Разница депозитов и выводов', 'Deposits minus withdrawals'), ton(net) + ' TON', trend(net, pnet), net >= 0 ? 'net' : 'neg'],
    [L('Средний RTP по играм', 'Average RTP across games'), pc(rtpNow), '<span class="tr">' + L('настройка во вкладке RTP', 'set in the RTP tab') + '</span>', ''],
    [L('Игроков за день', 'Players per day'), sp(Math.round(sumF(cur, 'pl') / cur.length)), '<span class="tr">' + L('новых ', 'new ') + sp(sumF(cur, 'nw')) + '</span>', ''],
    [L('Сегодня', 'Today'), '+' + ton(td.dep) + ' / −' + ton(td.wd), '<span class="tr">' + L('депозиты / выводы, TON', 'deposits / withdrawals, TON') + '</span>', '']
  ];
  return head(L('Обзор', 'Overview'), L('Все суммы в TON. Демо: цифры игровые.', 'All amounts in TON. Demo: figures are made up.'),
      '<div class="seg" id="per"><button data-p="7">' + L('7 дней', '7 days') + '</button><button data-p="30">' + L('30 дней', '30 days') + '</button><button data-p="90">' + L('90 дней', '90 days') + '</button></div>') +
    '<div class="tiles">' + tiles.map(function(x){ return '<div class="tile ' + x[3] + '"><small>' + x[0] + '</small><b>' + x[1] + '</b>' + x[2] + '</div>'; }).join('') + '</div>' +
    '<div class="card"><div class="card-h"><h2>' + L('Депозиты и выводы по дням', 'Deposits and withdrawals per day') + '</h2><div class="lg"><span><i class="c-dep"></i>' + L('Депозиты', 'Deposits') + '</span><span><i class="c-wd"></i>' + L('Выводы', 'Withdrawals') + '</span><span><i class="c-net"></i>' + L('Разница', 'Difference') + '</span></div></div><div class="chart" id="chart"><svg id="ch-svg"></svg><div class="tip" id="tip"></div></div>' +
    (td.mine ? '<p class="note">' + L('В сегодняшнем столбце есть ваши демо-депозиты из приложения: ', 'Today includes your demo deposits from the app: ') + ton(td.mine) + ' TON.</p>' : '') + '</div>' +
    '<div class="grid2"><div class="card"><div class="card-h"><h2>' + L('Игры за период', 'Games in the period') + '</h2></div><div class="tbw"><table class="tb"><thead><tr><th>' + L('Игра', 'Game') + '</th><th>' + L('Ставки', 'Bets') + '</th><th>' + L('Выплаты', 'Paid out') + '</th><th>' + L('Доход', 'Revenue') + '</th><th>RTP</th></tr></thead><tbody>' +
    GAMES.map(function(g){ var to = turnover * g[2], r = A.rtp[g[0]] / 100, fact = Math.min(0.995, r + (rng(g[0].length * 91 + period)() - 0.5) * 0.02), po = to * fact; return '<tr><td><b>' + g[1] + '</b></td><td>' + ton(to) + '</td><td>' + ton(po) + '</td><td class="pos">' + ton(to - po) + '</td><td>' + pc(fact) + '<small> / ' + pc(r, 0) + '</small></td></tr>'; }).join('') +
    '</tbody></table></div><p class="note">' + L('RTP: сколько из каждой ставки в среднем возвращается игрокам. Первое число по факту за период, второе выставлено вами.', 'RTP: how much of every bet goes back to players on average. First figure is actual for the period, second is what you set.') + '</p></div>' +
    '<div class="card"><div class="card-h"><h2>' + L('Последние действия в панели', 'Latest panel actions') + '</h2></div>' + (A.log.length ? '<ul class="log">' + A.log.slice(0, 8).map(function(x){ var d = new Date(x.at); return '<li><time>' + dstr(x.at) + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + '</time>' + esc(x.t) + '</li>'; }).join('') + '</ul>' : '<p class="empty">' + L('Пока пусто. Измените RTP, промокод или пользователя, и запись появится здесь.', 'Nothing yet. Change RTP, a promo code or a user and it shows up here.') + '</p>') + '</div></div>';
};
MOUNT.overview = function(){
  $$('#per [data-p]').forEach(function(b){ b.classList.toggle('on', +b.getAttribute('data-p') === period); });
  $('#per').addEventListener('click', function(e){ var b = e.target.closest('[data-p]'); if (b) { period = +b.getAttribute('data-p'); show('overview'); } });
  chart();
};
/* Плавная линия через точки: кривые Безье по соседям (Catmull-Rom), без выбросов за точки. */
function smooth(p){
  if (p.length < 2) return '';
  var d = 'M' + p[0][0].toFixed(1) + ' ' + p[0][1].toFixed(1);
  for (var i = 0; i < p.length - 1; i++) {
    var p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2, k = 0.18;
    var c1x = p1[0] + (p2[0] - p0[0]) * k, c1y = p1[1] + (p2[1] - p0[1]) * k, c2x = p2[0] - (p3[0] - p1[0]) * k, c2y = p2[1] - (p3[1] - p1[1]) * k;
    var lo = Math.min(p1[1], p2[1]), hi = Math.max(p1[1], p2[1]);
    c1y = Math.max(lo, Math.min(hi, c1y)); c2y = Math.max(lo, Math.min(hi, c2y));
    d += 'C' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ' ' + c2x.toFixed(1) + ' ' + c2y.toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
  }
  return d;
}
function chart(){
  var box = $('#chart'), svg = $('#ch-svg'), tip = $('#tip');
  if (!box) return;
  var list = slice(), W = box.clientWidth, H = box.clientHeight, pl = 52, pr = 12, pt = 14, pb = 28;
  var max = Math.max.apply(null, list.map(function(d){ return Math.max(d.dep, d.wd); })) * 1.1;
  var min = Math.min(0, Math.min.apply(null, list.map(function(d){ return d.dep - d.wd; })) * 1.2);
  var step = (W - pl - pr) / list.length, bw = Math.max(2, Math.min(18, step * 0.36));
  var Y = function(v){ return pt + (max - v) / (max - min) * (H - pt - pb); };
  var out = '<defs><linearGradient id="gd-dep" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5dfab0"/><stop offset="1" stop-color="#14a866"/></linearGradient><linearGradient id="gd-wd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8aa0"/><stop offset="1" stop-color="#d42a4e"/></linearGradient><linearGradient id="gd-net" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a98bff" stop-opacity=".35"/><stop offset="1" stop-color="#a98bff" stop-opacity="0"/></linearGradient></defs>';
  var ticks = 4;
  for (var k = 0; k <= ticks; k++) { var v = min + (max - min) * k / ticks, y = Y(v); out += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '" class="gl"/><text x="' + (pl - 8) + '" y="' + (y + 4).toFixed(1) + '" class="ax" text-anchor="end">' + (Math.abs(v) >= 1000 ? (v / 1000).toFixed(1) + 'k' : Math.round(v)) + '</text>'; }
  out += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(0).toFixed(1) + '" y2="' + Y(0).toFixed(1) + '" class="zl"/>';
  var every = Math.ceil(list.length / Math.max(4, Math.floor((W - pl) / 64)));
  var line = [];
  list.forEach(function(d, i){
    var cx = pl + step * (i + 0.5);
    var dl = 'style="animation-delay:' + Math.round(i / list.length * 380) + 'ms"', rx = Math.min(4, bw / 2).toFixed(1);
    out += '<rect class="b-dep" ' + dl + ' x="' + (cx - bw - 1).toFixed(1) + '" y="' + Y(d.dep).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (Y(0) - Y(d.dep)).toFixed(1) + '" rx="' + rx + '"/>';
    out += '<rect class="b-wd" ' + dl + ' x="' + (cx + 1).toFixed(1) + '" y="' + Y(d.wd).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (Y(0) - Y(d.wd)).toFixed(1) + '" rx="' + rx + '"/>';
    line.push([cx, Y(d.dep - d.wd)]);
    if ((list.length - 1 - i) % every === 0) out += '<text x="' + cx.toFixed(1) + '" y="' + (H - 8) + '" class="ax" text-anchor="middle">' + (i + 1 === list.length ? L('сегодня', 'today') : dstr(d.t)) + '</text>';
  });
  var path = smooth(line);
  out += '<path class="a-net" d="' + path + ' L' + line[line.length - 1][0].toFixed(1) + ' ' + Y(0).toFixed(1) + ' L' + line[0][0].toFixed(1) + ' ' + Y(0).toFixed(1) + 'Z"/><path class="l-net" pathLength="1" d="' + path + '"/>';
  line.forEach(function(p, i){ if (i + 1 === line.length) out += '<circle class="d-net" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="4"/>'; });
  out += '<rect id="ch-hi" class="hi" x="0" y="' + pt + '" width="' + step.toFixed(1) + '" height="' + (H - pt - pb) + '" style="opacity:0"/>';
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
  svg.innerHTML = out;
  var hi = $('#ch-hi');
  function at(x){
    var i = Math.max(0, Math.min(list.length - 1, Math.floor((x - pl) / step)));
    var d = list[i], cx = pl + step * (i + 0.5);
    hi.setAttribute('x', (cx - step / 2).toFixed(1)); hi.style.opacity = 1;
    tip.innerHTML = '<b>' + (i + 1 === list.length ? L('Сегодня', 'Today') : dfull(d.t)) + '</b><span><i class="c-dep"></i>' + L('Депозиты', 'Deposits') + '<em>' + ton(d.dep) + '</em></span><span><i class="c-wd"></i>' + L('Выводы', 'Withdrawals') + '<em>' + ton(d.wd) + '</em></span><span><i class="c-net"></i>' + L('Разница', 'Difference') + '<em class="' + (d.dep - d.wd >= 0 ? 'pos' : 'neg') + '">' + ton(d.dep - d.wd) + '</em></span><span>' + L('Игроков', 'Players') + '<em>' + sp(d.pl) + '</em></span>';
    tip.style.left = Math.max(4, Math.min(W - 190, cx + 12)) + 'px';
    tip.classList.add('on');
  }
  box.onpointermove = function(e){ var r = box.getBoundingClientRect(); at(e.clientX - r.left); };
  box.onpointerdown = box.onpointermove;
  box.onpointerleave = function(){ tip.classList.remove('on'); hi.style.opacity = 0; };
}
addEventListener('resize', function(){ if (tab === 'overview') chart(); });

/* ── RTP ── */
var RTPG = [
  ['box', L('Боксы', 'Boxes'), 80, 97, L('Сколько в среднем отдаёт бокс от своей цены. Шансы подарков пересчитываются сами.', 'How much a box returns of its price on average. Gift odds are recalculated automatically.')],
  ['rocket', 'Rocket', 90, 99, L('Чем ниже, тем раньше в среднем улетает ракета.', 'The lower it is, the earlier the rocket leaves on average.')],
  ['dice', 'Dice', 90, 99, L('Множитель = RTP / шанс. При 96% и шансе 50% выплата 1.92×.', 'Multiplier = RTP / chance. At 96% and 50% chance the payout is 1.92×.')],
  ['upgrade', 'Upgrade', 80, 97, L('Шанс улучшения = RTP × цена своего подарка / цена цели.', 'Upgrade chance = RTP × your gift price / target price.')],
  ['pvp', 'PvP', 85, 99, L('Комиссия с банка: 100% минус RTP. При 95% берём 5%.', 'Pot fee: 100% minus RTP. At 95% we keep 5%.')]
];
VIEW.rtp = function(){
  return head(L('RTP и шансы', 'RTP and odds'), L('Изменения сразу действуют в приложении на этом устройстве.', 'Changes apply right away in the app on this device.')) +
    '<div class="rtps">' + RTPG.map(function(g){ var v = A.rtp[g[0]]; return '<div class="card rt" data-g="' + g[0] + '"><div class="card-h"><h2>' + g[1] + '</h2><b class="rt-v">' + v + '%</b></div><input type="range" class="rng" min="' + g[2] + '" max="' + g[3] + '" step="0.5" value="' + v + '" aria-label="RTP ' + g[1] + '"><div class="rt-s"><span>' + L('Доход с 1 000 TON ставок', 'Revenue per 1,000 TON bet') + '<b class="rt-m">' + ton(1000 * (1 - v / 100)) + ' TON</b></span><span class="rt-w"></span></div><p class="note">' + g[4] + '</p></div>'; }).join('') + '</div>' +
    '<div class="bar"><button class="btn ghost" id="rt-reset">' + L('Вернуть как было', 'Restore defaults') + '</button><button class="btn" id="rt-save">' + L('Сохранить RTP', 'Save RTP') + '</button></div>';
};
MOUNT.rtp = function(){
  var vals = JSON.parse(JSON.stringify(A.rtp));
  function sync(card){
    var g = card.getAttribute('data-g'), v = vals[g];
    $('.rt-v', card).textContent = v + '%';
    $('.rt-m', card).textContent = ton(1000 * (1 - v / 100)) + ' TON';
    var w = $('.rt-w', card);
    w.textContent = v >= 98 ? L('Маржа меньше 2%: доход почти не покрывает бонусы и рефералов', 'Margin under 2%: revenue barely covers bonuses and referrals') : v <= 85 ? L('Низкий RTP: игроки быстрее уходят', 'Low RTP: players leave sooner') : '';
    var rg = $('.rng', card); rg.style.setProperty('--p', ((v - rg.min) / (rg.max - rg.min) * 100) + '%');
  }
  $$('.rt').forEach(function(card){
    sync(card);
    $('.rng', card).addEventListener('input', function(e){ vals[card.getAttribute('data-g')] = +e.target.value; sync(card); });
  });
  $('#rt-save').addEventListener('click', function(){
    var ch = Object.keys(vals).filter(function(k){ return vals[k] !== A.rtp[k]; });
    if (!ch.length) { toast(L('Изменений нет', 'Nothing changed')); return; }
    var what = ch.map(function(k){ return RTPG.filter(function(g){ return g[0] === k; })[0][1] + ' ' + A.rtp[k] + '% > ' + vals[k] + '%'; }).join(', ');
    A.rtp = vals; save('RTP: ' + what);
    toast(L('RTP сохранён. Откройте приложение: шансы уже другие.', 'RTP saved. Open the app: the odds have changed.'));
  });
  $('#rt-reset').addEventListener('click', function(){ A.rtp = defaults().rtp; save(L('RTP возвращён к исходному', 'RTP restored to defaults')); show('rtp'); });
};

/* ── Пользователи ── */
var uq = '', uf = 'all', upage = 0;
VIEW.users = function(){
  return head(L('Пользователи', 'Users'), sp(USERS.length + 1) + L(' игроков. Нажмите строку, чтобы открыть карточку.', ' players. Click a row to open the card.')) +
    '<div class="flt"><input id="u-q" placeholder="' + L('Имя, @username или ID', 'Name, @username or ID') + '" value="' + esc(uq) + '"><div class="seg" id="u-f"><button data-f="all">' + L('Все', 'All') + '</button><button data-f="vip">VIP</button><button data-f="risk">' + L('Риск', 'Risk') + '</button><button data-f="ban">' + L('Блок', 'Blocked') + '</button></div></div>' +
    '<div class="card flush"><table class="tb users"><thead><tr><th>' + L('Игрок', 'Player') + '</th><th>ID</th><th>' + L('Депозиты', 'Deposits') + '</th><th>' + L('Выводы', 'Withdrawals') + '</th><th>' + L('Баланс', 'Balance') + '</th><th>' + L('Пришёл', 'Joined') + '</th><th>' + L('Отметки', 'Flags') + '</th></tr></thead><tbody id="u-b"></tbody></table></div><div class="pager" id="u-p"></div>';
};
function ulist(){
  var all = [meRow()].concat(USERS), q = uq.trim().toLowerCase();
  return all.filter(function(u){
    if (q && (u.name + ' ' + u.un + ' ' + u.id).toLowerCase().indexOf(q.replace('@', '')) < 0) return false;
    var f = flags(u).map(function(x){ return x[0]; });
    return uf === 'all' || f.indexOf(uf) >= 0;
  });
}
function urows(){
  var list = ulist(), per = 20, pages = Math.max(1, Math.ceil(list.length / per));
  upage = Math.min(upage, pages - 1);
  $('#u-b').innerHTML = list.slice(upage * per, upage * per + per).map(function(u){
    return '<tr data-u="' + u.id + '" class="' + (u.me ? 'me' : '') + '"><td><span class="who"><span class="av" style="--h:' + u.h + '">' + esc(u.name.slice(0, 1)) + '</span><span><b>' + esc(u.name) + '</b><small>@' + esc(u.un) + '</small></span></span></td><td class="mono">' + u.id + '</td><td>' + ton(u.dep) + '</td><td>' + ton(u.wd) + '</td><td><b>' + ton(bal(u)) + '</b></td><td>' + dstr(u.reg) + '</td><td>' + flags(u).map(function(f){ return '<span class="fl ' + f[0] + '">' + f[1] + '</span>'; }).join('') + '</td></tr>';
  }).join('') || '<tr><td colspan="7" class="empty">' + L('Никого не нашли', 'Nobody found') + '</td></tr>';
  $('#u-p').innerHTML = pages > 1 ? '<button data-pg="-1"' + (upage ? '' : ' disabled') + '>' + L('Назад', 'Back') + '</button><span>' + (upage + 1) + ' / ' + pages + '</span><button data-pg="1"' + (upage < pages - 1 ? '' : ' disabled') + '>' + L('Дальше', 'Next') + '</button>' : '';
}
MOUNT.users = function(){
  $$('#u-f [data-f]').forEach(function(b){ b.classList.toggle('on', b.getAttribute('data-f') === uf); });
  urows();
  $('#u-q').addEventListener('input', function(e){ uq = e.target.value; upage = 0; urows(); });
  $('#u-f').addEventListener('click', function(e){ var b = e.target.closest('[data-f]'); if (!b) return; uf = b.getAttribute('data-f'); upage = 0; $$('#u-f [data-f]').forEach(function(x){ x.classList.toggle('on', x === b); }); urows(); });
  $('#u-p').addEventListener('click', function(e){ var b = e.target.closest('[data-pg]'); if (b) { upage += +b.getAttribute('data-pg'); urows(); } });
  $('#u-b').addEventListener('click', function(e){ var tr = e.target.closest('[data-u]'); if (tr) ucard(tr.getAttribute('data-u')); });
};
function ucard(id){
  var u = id === 'me' ? meRow() : USERS.filter(function(x){ return x.id === id; })[0];
  if (!u) return;
  var o = over(u), r = rng(+u.id || 9);
  var tx = [];
  for (var i = 0; i < 6; i++) { var kind = r() < 0.55 ? 'dep' : 'wd'; tx.push([Date.now() - Math.floor(r() * 20 * DAY), kind, Math.round((5 + r() * (u.dep / 6 + 10)) * 100) / 100]); }
  tx.sort(function(a, b){ return b[0] - a[0]; });
  drawer('<div class="uc-h"><span class="av big" style="--h:' + u.h + '">' + esc(u.name.slice(0, 1)) + '</span><div><h2>' + esc(u.name) + '</h2><p>@' + esc(u.un) + ' · ID ' + u.id + '</p></div></div>' +
    '<div class="uc-f">' + flags(u).map(function(f){ return '<span class="fl ' + f[0] + '">' + f[1] + '</span>'; }).join('') + (u.ref ? '<span class="fl">' + L('пришёл по ссылке ', 'came via ') + u.ref + '</span>' : '') + '</div>' +
    '<div class="tiles sm"><div class="tile"><small>' + L('Баланс', 'Balance') + '</small><b id="uc-bal">' + ton(bal(u)) + '</b></div><div class="tile"><small>' + L('Депозиты', 'Deposits') + '</small><b>' + ton(u.dep) + '</b></div><div class="tile"><small>' + L('Выводы', 'Withdrawals') + '</small><b>' + ton(u.wd) + '</b></div><div class="tile"><small>' + L('Игр', 'Games') + '</small><b>' + sp(u.games) + '</b></div></div>' +
    '<h3>' + L('Баланс вручную', 'Manual balance') + '</h3><div class="row"><input id="uc-amt" inputmode="decimal" placeholder="' + L('Сумма, TON', 'Amount, TON') + '"><button class="btn sm" data-a="add">' + L('Начислить', 'Credit') + '</button><button class="btn sm ghost" data-a="sub">' + L('Списать', 'Debit') + '</button></div>' +
    '<h3>' + L('Доступ', 'Access') + '</h3><div class="sw-l"><label class="sw"><input type="checkbox" data-a="vip"' + (o.vip || (!u.me && u.dep > 2000 && o.vip !== 0) ? ' checked' : '') + '><span></span>' + L('VIP: личный менеджер, быстрый вывод', 'VIP: personal manager, fast withdrawals') + '</label><label class="sw"><input type="checkbox" data-a="ban"' + (o.ban ? ' checked' : '') + '><span></span>' + L('Заблокировать: ставки и вывод закрыты', 'Block: bets and withdrawals are closed') + '</label></div>' +
    '<div class="row"><span class="lbl">' + L('Лимит вывода в сутки, TON', 'Daily withdrawal limit, TON') + '</span><input id="uc-lim" inputmode="decimal" value="' + (o.lim || '') + '" placeholder="' + L('без лимита', 'no limit') + '"><button class="btn sm ghost" data-a="lim">' + L('Сохранить', 'Save') + '</button></div>' +
    '<h3>' + L('Последние операции', 'Recent transactions') + '</h3><ul class="ops">' + (u.me ? '<li class="empty">' + L('Ваши демо-операции живут в приложении.', 'Your demo transactions live in the app.') + '</li>' : tx.map(function(x){ return '<li><time>' + dstr(x[0]) + '</time><span>' + (x[1] === 'dep' ? L('Депозит', 'Deposit') : L('Вывод', 'Withdrawal')) + '</span><b class="' + (x[1] === 'dep' ? 'pos' : 'neg') + '">' + (x[1] === 'dep' ? '+' : '−') + ton(x[2]) + '</b></li>'; }).join('')) + '</ul>', function(el){
    el.addEventListener('click', function(e){
      var b = e.target.closest('button[data-a]'); if (!b) return;
      var a = b.getAttribute('data-a');
      if (a === 'add' || a === 'sub') {
        var v = parseFloat(String($('#uc-amt', el).value).replace(',', '.'));
        if (!(v > 0)) { toast(L('Введите сумму', 'Enter an amount')); return; }
        v = a === 'add' ? v : -v;
        if (u.me) { var g = game(); if (g) { g.bal = Math.max(0, Math.round((g.bal + v) * 100) / 100); gameSave(g); } }
        else { A.users[u.id] = Object.assign({}, A.users[u.id], { adj: Math.round(((over(u).adj || 0) + v) * 100) / 100 }); }
        save((v > 0 ? L('Начислено ', 'Credited ') : L('Списано ', 'Debited ')) + ton(Math.abs(v)) + ' TON: ' + u.name + ' (' + u.id + ')');
        $('#uc-bal', el).textContent = ton(bal(u.me ? meRow() : u));
        toast(u.me ? L('Готово. Баланс в приложении изменён.', 'Done. The app balance has changed.') : L('Готово', 'Done'));
        urows();
      }
      if (a === 'lim') { var l = parseFloat($('#uc-lim', el).value) || 0; A.users[u.id] = Object.assign({}, A.users[u.id], { lim: l || undefined }); save(L('Лимит вывода ', 'Withdrawal limit ') + (l ? ton(l) + ' TON' : L('снят', 'removed')) + ': ' + u.name); toast(L('Лимит сохранён', 'Limit saved')); }
    });
    el.addEventListener('change', function(e){
      var c = e.target.closest('input[data-a]'); if (!c) return;
      var a = c.getAttribute('data-a'), o2 = {}; o2[a] = c.checked ? 1 : 0;
      A.users[u.id] = Object.assign({}, A.users[u.id], o2);
      save((a === 'ban' ? (c.checked ? L('Заблокирован', 'Blocked') : L('Разблокирован', 'Unblocked')) : (c.checked ? L('VIP включён', 'VIP on') : L('VIP снят', 'VIP off'))) + ': ' + u.name + ' (' + u.id + ')');
      toast(a === 'ban' && u.me ? (c.checked ? L('Откройте приложение: ставки закрыты.', 'Open the app: betting is closed.') : L('Ставки снова открыты', 'Betting is open again')) : L('Сохранено', 'Saved'));
      urows();
    });
  });
}
var drawerEl = null;
function drawer(html, mount){
  closeDrawer();
  var el = document.createElement('div');
  el.className = 'dw';
  el.innerHTML = '<div class="dw-bg" data-x></div><div class="dw-p"><button class="dw-x" data-x aria-label="' + L('Закрыть', 'Close') + '">' + ic('close') + '</button>' + html + '</div>';
  document.body.appendChild(el);
  requestAnimationFrame(function(){ el.classList.add('on'); });
  el.addEventListener('click', function(e){ if (e.target.closest('[data-x]')) closeDrawer(); });
  drawerEl = el;
  if (mount) mount(el);
}
function closeDrawer(){ var el = drawerEl; if (!el) return; drawerEl = null; el.classList.remove('on'); setTimeout(function(){ el.remove(); }, 300); }
addEventListener('keydown', function(e){ if (e.key === 'Escape') closeDrawer(); });
['gesturestart', 'gesturechange', 'gestureend'].forEach(function(t){ document.addEventListener(t, function(e){ e.preventDefault(); }, { passive: false }); });
document.addEventListener('touchmove', function(e){ if (e.touches.length > 1) e.preventDefault(); }, { passive: false });

/* ── Промокоды ── */
VIEW.promo = function(){
  var act = A.promos.filter(function(p){ return p.on && p.used < p.limit && p.until > Date.now(); }).length;
  return head(L('Промокоды', 'Promo codes'), L('Активных ', 'Active ') + act + L(' из ', ' of ') + A.promos.length + L('. Коды работают в приложении на этом устройстве.', '. Codes work in the app on this device.')) +
    '<div class="card"><div class="card-h"><h2>' + L('Новый промокод', 'New promo code') + '</h2></div><form class="frm" id="p-new"><label>' + L('Код', 'Code') + '<input name="code" maxlength="16" placeholder="SPRING" required></label><label>' + L('Что даёт', 'Reward') + '<select name="type"><option value="box">' + L('Бесплатный бокс', 'Free box') + '</option><option value="ton">' + L('Бонус TON на баланс', 'TON bonus to balance') + '</option></select></label><label class="p-box">' + L('Бокс', 'Box') + '<select name="box">' + Object.keys(BOXN).map(function(k){ return '<option value="' + k + '">' + BOXN[k] + '</option>'; }).join('') + '</select></label><label class="p-ton" hidden>' + L('Сумма, TON', 'Amount, TON') + '<input name="ton" inputmode="decimal" value="2"></label><label>' + L('Сколько раз', 'Uses') + '<input name="limit" inputmode="numeric" value="500"></label><label>' + L('Дней действует', 'Days valid') + '<input name="days" inputmode="numeric" value="14"></label><button class="btn">' + L('Создать', 'Create') + '</button></form></div>' +
    '<div class="card flush"><table class="tb"><thead><tr><th>' + L('Код', 'Code') + '</th><th>' + L('Что даёт', 'Reward') + '</th><th>' + L('Использовано', 'Used') + '</th><th>' + L('До', 'Until') + '</th><th>' + L('Статус', 'Status') + '</th><th></th></tr></thead><tbody>' +
    A.promos.map(function(p, i){
      var st = !p.on ? ['off', L('Выключен', 'Off')] : p.used >= p.limit ? ['end', L('Закончился', 'Used up')] : p.until < Date.now() ? ['end', L('Истёк', 'Expired')] : ['on', L('Работает', 'Live')];
      return '<tr><td class="mono"><b>' + esc(p.code) + '</b></td><td>' + (p.type === 'box' ? L('Бокс «', 'Box «') + (BOXN[p.box] || p.box) + '»' : '+' + ton(p.ton) + ' TON') + '</td><td><div class="prog"><i style="width:' + Math.min(100, p.used / p.limit * 100) + '%"></i></div><small>' + sp(p.used) + ' / ' + sp(p.limit) + '</small></td><td>' + dstr(p.until) + '</td><td><span class="st ' + st[0] + '">' + st[1] + '</span></td><td class="acts"><label class="sw sm"><input type="checkbox" data-pi="' + i + '"' + (p.on ? ' checked' : '') + '><span></span></label><button class="lnk" data-pd="' + i + '">' + L('Удалить', 'Delete') + '</button></td></tr>';
    }).join('') + '</tbody></table></div>';
};
MOUNT.promo = function(){
  var f = $('#p-new');
  f.type.addEventListener('change', function(){ $('.p-box', f).hidden = f.type.value !== 'box'; $('.p-ton', f).hidden = f.type.value !== 'ton'; });
  f.addEventListener('submit', function(e){
    e.preventDefault();
    var code = f.code.value.trim().toUpperCase();
    if (!/^[A-Z0-9]{3,16}$/.test(code)) { toast(L('Код: от 3 до 16 латинских букв и цифр', 'Code: 3 to 16 Latin letters and digits')); return; }
    if (A.promos.some(function(p){ return p.code === code; })) { toast(L('Такой код уже есть', 'This code already exists')); return; }
    var p = { code: code, type: f.type.value, box: f.box.value, ton: Math.max(0.1, parseFloat(f.ton.value) || 1), limit: Math.max(1, parseInt(f.limit.value, 10) || 1), used: 0, until: Date.now() + Math.max(1, parseInt(f.days.value, 10) || 7) * DAY, on: 1 };
    A.promos.unshift(p); save(L('Создан промокод ', 'Promo code created ') + code);
    toast(L('Промокод ', 'Code ') + code + L(' работает. Введите его в приложении.', ' is live. Enter it in the app.'));
    show('promo');
  });
};
main.addEventListener('change', onPromo);
main.addEventListener('click', onPromoDel);
function onPromo(e){ var c = e.target.closest('[data-pi]'); if (!c || tab !== 'promo') return; var p = A.promos[+c.getAttribute('data-pi')]; p.on = c.checked ? 1 : 0; save((p.on ? L('Включён промокод ', 'Promo on ') : L('Выключен промокод ', 'Promo off ')) + p.code); show('promo'); }
function onPromoDel(e){ var b = e.target.closest('[data-pd]'); if (!b || tab !== 'promo') return; var p = A.promos.splice(+b.getAttribute('data-pd'), 1)[0]; save(L('Удалён промокод ', 'Promo deleted ') + p.code); show('promo'); }

/* ── Реферальные ссылки ── */
VIEW.refs = function(){
  var tot = A.refs.reduce(function(s, r){ return { clicks: s.clicks + r.clicks, regs: s.regs + r.regs, dep: s.dep + r.dep, paid: s.paid + r.dep * r.pct / 100 }; }, { clicks: 0, regs: 0, dep: 0, paid: 0 });
  return head(L('Реферальные ссылки', 'Referral links'), L('Партнёр получает процент с каждого депозита приведённых игроков, пожизненно.', 'A partner earns a share of every deposit by the players they bring, for life.')) +
    '<div class="tiles"><div class="tile"><small>' + L('Переходов', 'Clicks') + '</small><b>' + sp(tot.clicks) + '</b></div><div class="tile"><small>' + L('Регистраций', 'Sign-ups') + '</small><b>' + sp(tot.regs) + '</b><span class="tr">' + pc(tot.regs / tot.clicks) + L(' от переходов', ' of clicks') + '</span></div><div class="tile dep"><small>' + L('Депозиты рефералов', 'Referral deposits') + '</small><b>' + ton(tot.dep) + ' TON</b></div><div class="tile wd"><small>' + L('Выплачено партнёрам', 'Paid to partners') + '</small><b>' + ton(tot.paid) + ' TON</b></div></div>' +
    '<div class="card"><div class="card-h"><h2>' + L('Новая ссылка', 'New link') + '</h2></div><form class="frm" id="r-new"><label>' + L('Партнёр', 'Partner') + '<input name="name" maxlength="40" placeholder="' + L('Канал, блогер, чат', 'Channel, blogger, chat') + '" required></label><label>' + L('Код в ссылке', 'Code in the link') + '<input name="code" maxlength="16" placeholder="' + L('сам, если пусто', 'auto if empty') + '"></label><label>' + L('Процент', 'Share') + '<input name="pct" inputmode="decimal" value="10"></label><button class="btn">' + L('Создать ссылку', 'Create link') + '</button></form></div>' +
    '<div class="card flush"><table class="tb"><thead><tr><th>' + L('Партнёр', 'Partner') + '</th><th>' + L('Ссылка', 'Link') + '</th><th>' + L('Переходы', 'Clicks') + '</th><th>' + L('Регистрации', 'Sign-ups') + '</th><th>' + L('Депозиты', 'Deposits') + '</th><th>' + L('Партнёру', 'To partner') + '</th><th>%</th><th></th></tr></thead><tbody>' +
    A.refs.map(function(r, i){ var link = 't.me/…/app?startapp=ref_' + r.code; return '<tr class="' + (r.on ? '' : 'dim') + '"><td><b>' + esc(r.name) + '</b></td><td><button class="lnk mono" data-rc="' + i + '" title="' + L('Копировать', 'Copy') + '">' + ic('copy') + esc(link) + '</button></td><td>' + sp(r.clicks) + '</td><td>' + sp(r.regs) + '<small> · ' + (r.clicks ? pc(r.regs / r.clicks) : '0%') + '</small></td><td>' + ton(r.dep) + '</td><td class="pos">' + ton(r.dep * r.pct / 100) + '</td><td><input class="pct" data-rp="' + i + '" value="' + r.pct + '" inputmode="decimal" aria-label="%"></td><td><label class="sw sm"><input type="checkbox" data-ro="' + i + '"' + (r.on ? ' checked' : '') + '><span></span></label></td></tr>'; }).join('') + '</tbody></table></div>';
};
MOUNT.refs = function(){
  var f = $('#r-new');
  f.addEventListener('submit', function(e){
    e.preventDefault();
    var name = f.name.value.trim(), code = (f.code.value.trim() || name.replace(/[^A-Za-z0-9]/g, '') || 'P').toUpperCase().slice(0, 10);
    if (!/^[A-Z0-9]{2,16}$/.test(code)) code = 'P' + Math.floor(Math.random() * 1e5);
    while (A.refs.some(function(r){ return r.code === code; })) code += Math.floor(Math.random() * 10);
    var pct = Math.max(1, Math.min(50, parseFloat(String(f.pct.value).replace(',', '.')) || 10));
    A.refs.unshift({ code: code, name: name, pct: pct, clicks: 0, regs: 0, dep: 0, on: 1 });
    save(L('Создана ссылка ', 'Link created ') + 'ref_' + code + ' (' + name + ', ' + pct + '%)');
    toast(L('Ссылка готова: ', 'Link ready: ') + 'ref_' + code);
    show('refs');
  });
};
main.addEventListener('click', function(e){
  var c = e.target.closest('[data-rc]'); if (!c || tab !== 'refs') return;
  var r = A.refs[+c.getAttribute('data-rc')];
  try { navigator.clipboard.writeText('https://t.me/…/app?startapp=ref_' + r.code); } catch (x) {}
  toast(L('Скопировано. В боевой версии здесь будет имя бота.', 'Copied. The live version puts the bot name here.'));
});
main.addEventListener('change', function(e){
  if (tab !== 'refs') return;
  var o = e.target.closest('[data-ro]'), p = e.target.closest('[data-rp]');
  if (o) { var r = A.refs[+o.getAttribute('data-ro')]; r.on = o.checked ? 1 : 0; save((r.on ? L('Включена ссылка ', 'Link on ') : L('Выключена ссылка ', 'Link off ')) + 'ref_' + r.code); show('refs'); }
  if (p) { var r2 = A.refs[+p.getAttribute('data-rp')], v = Math.max(1, Math.min(50, parseFloat(String(p.value).replace(',', '.')) || r2.pct)); save(L('Процент ', 'Share ') + 'ref_' + r2.code + ': ' + r2.pct + '% > ' + v + '%'); r2.pct = v; show('refs'); }
});

/* ── Старт ── */
document.addEventListener('click', function(e){ var b = e.target.closest('[data-tab]'); if (b) { closeDrawer(); show(b.getAttribute('data-tab')); } });
var start = 'overview';
try { start = sessionStorage.getItem('gx-adm') || 'overview'; } catch (e) {}
show(VIEW[start] ? start : 'overview');
window.__gxa = { show: show, state: function(){ return A; } };

/* Плашка «Демо закроется через …»: отсчёт до facts.lockAt, после срока прячется. */
(function(){
  var el = document.getElementById('closing'); if (!el) return;
  var until = Date.parse(el.getAttribute('data-until')), out = document.getElementById('cl-left');
  function tick(){
    var ms = until - Date.now();
    if (!(ms > 0)) { el.classList.add('gone'); return; }
    var s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); s %= 60;
    out.textContent = (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    el.classList.toggle('urgent', ms < 3600000);
    setTimeout(tick, 1000 - Date.now() % 1000);
  }
  tick();
})();
})();
