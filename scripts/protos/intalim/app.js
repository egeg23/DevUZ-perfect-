(function () {
'use strict';
/* IntalimStudents, прототип. Данные страницы (язык, тексты, вопросы) приходят в window.IT от gen.mjs. */
var IT = window.IT, U = IT.ui, L = IT.lang;
var REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
var KEY = 'it-demo-1';
var app = document.getElementById('app'), views = document.getElementById('views'), tabsEl = document.getElementById('tabs');
var screen = document.getElementById('screen');

/* ── Состояние демо: только в этом браузере ── */
var S = load();
function load() {
  var d = { ans: {}, mis: [], saved: [3, 11], hist: [], theme: 'light', notif: true, booked: [], read: ['gen', 'lights', 'cross', 'ped', 'speed', 'over', 's-warn', 's-prio', 'belt', 'phone'], day: '', today: 0, xp: 1240, signBest: 0, made: [] };
  try { var x = JSON.parse(localStorage.getItem(KEY) || 'null'); if (x) for (var k in x) d[k] = x[k]; } catch (e) {}
  var t = dayKey(new Date());
  if (d.day !== t) { d.day = t; d.today = 0; }
  return d;
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

/* ── Мелочи ── */
function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function ic(n, c) { return '<svg class="ic' + (c ? ' ' + c : '') + '" aria-hidden="true"><use href="#i-' + n + '"/></svg>'; }
function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
function pad(n) { return (n < 10 ? '0' : '') + n; }
function dayKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms || 8); } catch (e) {} }
function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
function plural(n, one, few, many) { if (L !== 'ru') return one; var a = n % 10, b = n % 100; return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 10 || b >= 20) ? few : many; }
var Q = IT.questions, SUBJ = IT.subjects, SIGNS = IT.signs;
var TOPICS = []; SUBJ.forEach(function (s) { s.topics.forEach(function (t, i) { t.subj = s.id; t.n = i + 1; TOPICS.push(t); }); });
function topic(id) { return byId(TOPICS, id); }
function topicQs(t) { var a = Q.filter(function (q) { return q.t === t.id; }); if (a.length < 2) a = Q.filter(function (q) { var x = topic(q.t); return x && x.subj === t.subj; }); return a; }

/* ── Готовность и прогноз ──
   Точность по темам = прошлые ответы ученика (демо) + ответы в этом браузере.
   Шанс сдать: вероятность сделать не больше 2 ошибок из 20 при такой точности. */
var BASE = { cross: [18, 20], lights: [17, 18], ped: [10, 10], speed: [8, 9], over: [5, 6], stop: [6, 9], gen: [8, 8], 's-prio': [15, 16], 's-ban': [12, 15], 's-must': [5, 5], belt: [5, 5], phone: [4, 4], 'aid-1': [4, 6], 'aid-2': [3, 4], 'car-1': [4, 4] };
function acc(tid) {
  var b = BASE[tid] || [3, 5], ok = b[0], n = b[1];
  Q.forEach(function (q) { if (q.t === tid && S.ans[q.id]) { ok += S.ans[q.id][0]; n += S.ans[q.id][0] + S.ans[q.id][1]; } });
  return ok / n;
}
function stats() {
  var ids = Object.keys(BASE), sum = 0, w = 0;
  ids.forEach(function (t) { var b = BASE[t][1] + 2; sum += acc(t) * b; w += b; });
  var p = sum / w, solved = 0;
  Object.keys(S.ans).forEach(function (k) { solved += S.ans[k][0] + S.ans[k][1]; });
  var cover = Math.min(1, (412 + solved) / 600);
  var ready = Math.round(100 * (0.75 * p + 0.25 * cover));
  var q = 1 - p, pass = 0, c = 1;
  for (var k = 0; k <= 2; k++) { pass += c * Math.pow(q, k) * Math.pow(p, 20 - k); c = c * (20 - k) / (k + 1); }
  var weak = ids.map(function (t) { return { t: t, a: acc(t) }; }).sort(function (a, b) { return a.a - b.a; });
  return { p: p, ready: Math.min(99, ready), pass: Math.round(pass * 100), solved: 412 + solved, weak: weak };
}

/* ── Кольцо прогресса ── */
function ring(pct, cls, label) {
  var r = 40, c = 2 * Math.PI * r;
  return '<div class="ring ' + (cls || '') + '" data-ring="' + pct + '"><svg viewBox="0 0 100 100"><circle class="tr" cx="50" cy="50" r="' + r + '"/><circle class="pr" cx="50" cy="50" r="' + r + '" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + c.toFixed(1) + '"/></svg><b class="num">' + (label == null ? pct + '%' : label) + '</b></div>';
}
function animateRings(root) {
  $$('[data-ring]', root).forEach(function (el) {
    var c = el.querySelector('.pr'), len = parseFloat(c.getAttribute('stroke-dasharray')), pct = +el.getAttribute('data-ring');
    var to = (len * (1 - pct / 100)).toFixed(1);
    if (REDUCED) { c.style.strokeDashoffset = to; return; }
    requestAnimationFrame(function () { requestAnimationFrame(function () { c.style.strokeDashoffset = to; }); });
  });
}
function bar(pct) { return '<div class="bar-p"><i style="width:' + Math.max(2, pct) + '%"></i></div>'; }

/* ── Расписание: строится от сегодняшнего дня, чтобы демо всегда было живым ── */
var NOW = new Date();
function events() {
  var list = [], start = addDays(NOW, -40);
  for (var i = 0; i < 70; i++) {
    var d = addDays(start, i), wd = d.getDay(), k = dayKey(d), past = d < new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());
    if (wd === 1 || wd === 3 || wd === 5) list.push({ d: k, time: '18:00', end: '19:30', kind: 'th', title: theoryTitle(i), who: U.teacherName, where: IT.places.cls, missed: past && (i === 9 || i === 23) });
    if (wd === 2 || wd === 6) list.push({ d: k, time: wd === 6 ? '10:00' : '16:30', end: wd === 6 ? '11:30' : '18:00', kind: 'pr', title: U.drivingTitle, who: IT.instructors[0].name, where: IT.places.ad, missed: past && i === 16 });
  }
  if (!list.some(function (e) { return e.d === dayKey(NOW) && e.kind === 'pr'; })) list.push({ d: dayKey(NOW), time: '16:30', end: '18:00', kind: 'pr', title: U.drivingTitle, who: IT.instructors[0].name, where: IT.places.ad });
  S.booked.forEach(function (b) { list.push({ d: b.d, time: b.time, end: b.end, kind: 'pr', title: U.drivingTitle, who: byId(IT.instructors, b.inst).name, where: IT.places.ad, mine: true }); });
  return list.sort(function (a, b) { return (a.d + a.time) < (b.d + b.time) ? -1 : 1; });
}
function theoryTitle(i) { var t = ['lights', 'cross', 'ped', 'speed', 'over', 'stop', 's-ban', 'aid-1', 'car-1', 'psy-1']; return topic(t[i % t.length]).name; }
function evDate(e) { var p = e.d.split('-'), t = e.time.split(':'); return new Date(+p[0], +p[1] - 1, +p[2], +t[0], +t[1]); }
function nextEvent() { var now = new Date(); return events().filter(function (e) { return evDate(e) > now && !e.missed; })[0]; }
function dayName(d) { var t = dayKey(new Date()), tm = dayKey(addDays(new Date(), 1)), k = dayKey(d); return k === t ? U.today : k === tm ? U.tomorrow : d.getDate() + ' ' + IT.monthsGen[d.getMonth()]; }
function left(ms) { var s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); if (h >= 24) return Math.floor(h / 24) + ' ' + U.dShort + ' ' + (h % 24) + ' ' + U.hShort; return (h ? h + ' ' + U.hShort + ' ' : '') + m + ' ' + U.mShort + ' ' + pad(s % 60) + ' ' + U.sShort; }

/* ── Экраны ── */
var V = {};
function head(title, opts) {
  opts = opts || {};
  return '<div class="bar">' + (opts.noBack ? '<span class="ghost"></span>' : '<button class="icon-btn" data-back aria-label="' + esc(U.back) + '">' + ic('back') + '</button>') + '<h2>' + esc(title) + '</h2>' + (opts.right || '<span class="ghost"></span>') + '</div>';
}

V.home = function () {
  var st = stats(), e = nextEvent(), d = e && evDate(e);
  var lt = topic(S.lastTopic || 'stop'), lp = S.lastTopic ? 30 : 40;
  var wk = [];
  for (var i = 6; i >= 0; i--) { var dd = addDays(new Date(), -i), on = i > 0 || S.today > 0; wk.push('<span class="' + (on ? 'on ' : '') + (i === 0 ? 'today' : '') + '">' + IT.wd[(dd.getDay() + 6) % 7] + '</span>'); }
  var streak = 11 + (S.today > 0 ? 1 : 0);
  var h = '';
  h += '<div class="hello"><div class="ava">' + IT.me.ini + '<span class="ver">' + ic('check') + '</span></div><div class="grow"><small>' + esc(U.hi) + '</small><b>' + esc(IT.me.name) + '</b><small>' + esc(U.groupT) + ' ' + IT.me.group + ' · ' + esc(U.catB) + '</small></div><a class="demo-pill" href="' + IT.terms + '" target="_blank" rel="noopener">' + esc(U.demo) + '</a><button class="icon-btn bell" data-act="pushes" aria-label="' + esc(U.notifT) + '">' + ic('bell') + '<i></i></button></div>';
  if (e) {
    h += '<div class="card next press" data-go="schedule"><div class="row"><span class="k grow">' + esc(U.next) + '</span><span class="cd" data-count="' + d.getTime() + '">' + ic('clock') + '<span class="num">' + left(d - new Date()) + '</span></span></div>';
    h += '<h3>' + esc(e.kind === 'pr' ? U.driving : U.theory) + ': ' + esc(e.title) + '</h3><div class="small" style="opacity:.85">' + esc(dayName(d)) + ', ' + e.time + '-' + e.end + '</div>';
    h += '<div class="meta"><div>' + esc(e.kind === 'pr' ? U.instructor : U.teacher) + '<b>' + esc(e.who) + '</b></div><div>' + esc(U.place) + '<b>' + esc(e.where) + '</b></div></div>';
    h += '<div class="btns"><button class="btn" data-act="route">' + ic('geo') + esc(U.route) + '</button><button class="btn glass" data-go="book">' + ic('cal') + esc(U.move) + '</button></div></div>';
  }
  h += '<div class="duo"><button class="card ready press" data-go="forecast"><span class="lbl">' + esc(U.ready) + '</span>' + ring(st.ready) + '<span class="tiny mute">' + esc(U.chancePrefix) + ' <b style="color:var(--ink)">' + st.pass + '%</b></span></button>';
  h += '<div class="card streak"><span class="lbl small mute" style="font-weight:600">' + esc(U.streak) + '</span><div class="row" style="gap:8px;margin-top:6px"><span class="flame">' + flame() + '</span><b class="n num">' + streak + '</b></div><div class="week">' + wk.join('') + '</div>';
  h += '<div class="goal"><div class="tiny"><span>' + esc(U.goal) + '</span><b class="num">' + Math.min(S.today, 20) + '/20</b></div>' + bar(Math.min(100, S.today * 5)) + '</div></div></div>';
  h += '<div class="sec"><h3>' + esc(U.cont) + '</h3></div><button class="card cont press" style="width:100%" data-go="topic" data-a="' + lt.id + '"><span class="ico">' + ic('book') + '</span><span class="grow"><b style="display:block;font-size:15px;line-height:1.3">' + esc(lt.name) + '</b><span class="small mute">' + esc(byId(SUBJ, lt.subj).name) + '</span>' + bar(lp) + '</span>' + ic('chev', 'chev') + '</button>';
  h += '<div class="sec"><h3>' + esc(U.autodrome) + '</h3><span class="chip warn">' + esc(U.adWait) + '</span></div><div class="card autodrome"><div class="row"><span class="ico warn">' + ic('steer') + '</span><div class="grow"><b>' + esc(IT.places.ad) + '</b><div class="small mute">' + esc(U.adText) + '</div></div></div>';
  h += '<div class="steps"><div class="st done"><i>' + ic('check') + '</i>' + esc(U.adSent) + '</div><span class="ln done"></span><div class="st now"><i>' + ic('clock') + '</i>' + esc(U.adOk) + '</div><span class="ln"></span><div class="st"><i>' + ic('flag') + '</i>' + esc(U.adExam) + '</div></div></div>';
  h += '<div class="sec"><h3>' + esc(U.sections) + '</h3></div><div class="card"><div class="grid">';
  [['signs', 'sign', U.signs, ''], ['fines', 'law', U.fines, 'bad'], ['attendance', 'chart', U.attendance, 'ok'], ['saved', 'pin', U.saved, 'warn'], ['exercises', 'steer', U.manual, 'teal'], ['group', 'users', U.group, ''], ['helper', 'spark', U.helper, 'violet'], ['forecast', 'target', U.forecast, 'teal']].forEach(function (x) {
    h += '<button class="tile" data-go="' + x[0] + '"><span class="ico ' + x[3] + '">' + ic(x[1]) + '</span>' + esc(x[2]) + '</button>';
  });
  h += '</div></div>' + termsLine();
  return h;
};
function flame() { return '<svg viewBox="0 0 24 24" width="28" height="28"><path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3-1-3 0-7 1-9.5z" fill="hsl(28 96% 54%)"/><path d="M12 12c1.5 1.5 2.5 2.6 2.5 4a2.5 2.5 0 0 1-5 0c0-1.4 1-2.5 2.5-4z" fill="hsl(46 100% 62%)"/></svg>'; }
function termsLine() { return '<p class="terms-line">' + esc(U.belongs) + ' <a href="' + IT.terms + '" target="_blank" rel="noopener">' + esc(U.terms) + '</a></p>'; }

V.lessons = function () {
  var h = '<h1 class="big-title">' + esc(U.lessons) + '</h1><label class="search">' + ic('search') + '<input type="search" data-input="lsearch" placeholder="' + esc(U.search) + '" autocomplete="off"></label><div id="lres">' + lessonList('') + '</div>';
  return h;
};
function subjPct(s) { var r = s.topics.filter(function (t) { return S.read.indexOf(t.id) >= 0; }).length; return Math.round(100 * r / s.topics.length); }
function lessonList(qs) {
  qs = qs.trim().toLowerCase();
  if (qs) {
    var hits = TOPICS.filter(function (t) { return t.name.toLowerCase().indexOf(qs) >= 0 || byId(SUBJ, t.subj).name.toLowerCase().indexOf(qs) >= 0; });
    if (!hits.length) return '<div class="empty">' + esc(U.nothing) + '</div>';
    return '<div class="list">' + hits.map(function (t) { return '<button class="li" data-go="topic" data-a="' + t.id + '"><span class="topic-n">' + t.n + '</span><span class="grow"><span class="t">' + esc(t.name) + '</span><span class="s">' + esc(byId(SUBJ, t.subj).name) + '</span></span>' + ic('chev', 'chev') + '</button>'; }).join('') + '</div>';
  }
  return SUBJ.map(function (s) {
    var p = subjPct(s);
    return '<button class="card subj press" style="width:100%;display:block;text-align:left" data-go="subject" data-a="' + s.id + '"><div class="row"><span class="ico ' + s.c + '">' + ic(s.ic) + '</span><span class="grow"><b style="display:block;font-size:15px;line-height:1.3">' + esc(s.name) + '</b><span class="small mute">' + s.topics.length + ' ' + esc(plural(s.topics.length, U.topic1, U.topic2, U.topics)) + '</span></span><span class="pc num">' + p + '%</span></div>' + bar(p) + '</button>';
  }).join('');
}
V.subject = function (id) {
  var s = byId(SUBJ, id), cur = null;
  var h = head(s.name) + '<div class="list">';
  s.topics.forEach(function (t) {
    var done = S.read.indexOf(t.id) >= 0, qn = topicQs(t).length;
    var c = done ? 'done' : (!cur ? (cur = 'cur') : '');
    h += '<button class="li" data-go="topic" data-a="' + t.id + '"><span class="topic-n ' + c + '">' + (done ? ic('check') : t.n) + '</span><span class="grow"><span class="t">' + esc(t.name) + '</span><span class="s">' + t.min + ' ' + esc(U.min) + ' · ' + qn + ' ' + esc(plural(qn, U.q1, U.q2, U.qs)) + '</span></span>' + ic('chev', 'chev') + '</button>';
  });
  return h + '</div>';
};
V.topic = function (id) {
  var t = topic(id), s = byId(SUBJ, t.subj), qn = topicQs(t).length;
  S.lastTopic = id; save();
  var h = head(s.name) + '<div class="read-prog"><i></i></div><article class="mat"><span class="chip brand">' + esc(U.topicWord) + ' ' + t.n + ' · ' + t.min + ' ' + esc(U.min) + '</span><h1>' + esc(t.name) + '</h1>';
  t.body.forEach(function (p, i) { h += '<p>' + esc(p) + '</p>'; if (i === 0 && t.fig) h += figure(t.fig); });
  if (t.list.length) h += '<div class="note">' + ic('info') + '<div><b>' + esc(U.remember2) + '</b><ul style="margin:6px 0 0;padding-left:18px">' + t.list.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div></div>';
  if (t.signs) h += '<div class="signs">' + SIGNS.filter(function (x) { return x.g === t.signs; }).map(signTile).join('') + '</div>';
  h += '</article><div class="card" style="margin-top:20px"><div class="row"><span class="ico teal">' + ic('test') + '</span><div class="grow"><b>' + esc(U.topicTest) + '</b><div class="small mute">' + qn + ' ' + esc(plural(qn, U.q1, U.q2, U.qs)) + ', ' + esc(U.withExpl) + '</div></div></div><button class="btn wide teal" style="margin-top:12px" data-act="topicTest" data-a="' + id + '">' + esc(U.startTest) + '</button></div>';
  var nx = s.topics[t.n] || null;
  if (nx) h += '<button class="li card" style="margin-top:12px" data-go="topic" data-a="' + nx.id + '" data-replace><span class="grow"><span class="s">' + esc(U.nextTopic) + '</span><span class="t">' + esc(nx.name) + '</span></span>' + ic('chev', 'chev') + '</button>';
  return h;
};

V.tests = function () {
  var st = stats(), ex = S.hist.filter(function (x) { return x.mode === 'exam'; }), passed = ex.filter(function (x) { return x.pass; }).length;
  var h = '<h1 class="big-title">' + esc(U.tests) + '</h1>';
  h += '<div class="card exam-card"><div class="row"><div class="grow"><b style="font-size:20px">' + esc(U.exam) + '</b><div class="small mute" style="margin-top:4px">' + esc(U.examRules) + '</div></div>' + ring(st.pass, 'sm', st.pass + '%') + '</div>';
  h += '<div class="rules"><span>20 ' + esc(U.qs) + '</span><span>' + esc(U.max2) + '</span><span>25 ' + esc(U.minutes) + '</span></div>';
  h += '<div class="small mute" style="margin-bottom:6px">' + esc(U.examTries) + ': <b class="num" style="color:#fff">' + (4 + passed) + ' / ' + (6 + ex.length) + '</b></div><button class="btn wide" data-act="exam">' + ic('play') + esc(U.startExam) + '</button></div>';
  h += '<div class="sec"><h3>' + esc(U.practice) + '</h3></div><div class="list">';
  var mis = S.mis.length;
  h += li('thematic', 'list', '', U.thematic, U.thematicS);
  h += li('mixed', 'shuffle', 'teal', U.mixed, U.mixedS, 'data-act="mixed"');
  h += li('mistakes', 'refresh', 'bad', U.mistakes, mis ? mis + ' ' + plural(mis, U.q1, U.q2, U.qs) : U.mistakesS, 'data-act="mistakes"', mis ? '<span class="chip bad num">' + mis + '</span>' : '');
  h += li('saved', 'pin', 'warn', U.savedQ, S.saved.length + ' ' + plural(S.saved.length, U.q1, U.q2, U.qs));
  h += li('signs', 'sign', 'violet', U.guess, U.guessS, 'data-go="guess"');
  h += '</div>';
  h += '<div class="sec"><h3>' + esc(U.history) + '</h3></div><div class="list">';
  var hist = S.hist.slice(-6).reverse().concat(DEMO_HIST);
  h += hist.slice(0, 6).map(function (x) {
    return '<div class="li"><span class="ico ' + (x.pass ? 'ok' : 'bad') + '">' + ic(x.pass ? 'check' : 'x') + '</span><span class="grow"><span class="t">' + esc(x.title) + '</span><span class="s">' + esc(x.when) + '</span></span><b class="num">' + x.ok + '/' + x.n + '</b></div>';
  }).join('');
  return h + '</div>';
};
var DEMO_HIST = [
  { title: U.exam, when: U.ago2, ok: 18, n: 20, pass: true }, { title: U.mixed, when: U.ago2, ok: 8, n: 10, pass: true },
  { title: U.exam, when: U.ago3, ok: 16, n: 20, pass: false }, { title: U.topicTest, when: U.ago3, ok: 4, n: 5, pass: true },
];
function li(go, icon, c, t, s, attr, right) { return '<button class="li" ' + (attr || 'data-go="' + go + '"') + '><span class="ico ' + c + '">' + ic(icon) + '</span><span class="grow"><span class="t">' + esc(t) + '</span><span class="s">' + esc(s) + '</span></span>' + (right || '') + ic('chev', 'chev') + '</button>'; }

V.thematic = function () {
  var h = head(U.thematic);
  SUBJ.forEach(function (s) {
    var ts = s.topics.filter(function (t) { return Q.some(function (q) { return q.t === t.id; }); });
    if (!ts.length) return;
    h += '<div class="sec"><h3 style="font-size:15px">' + esc(s.name) + '</h3></div><div class="list">';
    ts.forEach(function (t) { var a = Math.round(acc(t.id) * 100); h += '<button class="li" data-act="topicTest" data-a="' + t.id + '"><span class="grow"><span class="t">' + esc(t.name) + '</span><span class="s">' + topicQs(t).length + ' ' + esc(U.qs) + ' · ' + esc(U.accuracy) + ' ' + a + '%</span></span>' + ring(a, 'sm', a + '') + '</button>'; });
    h += '</div>';
  });
  return h;
};
V.saved = function () {
  var qs = Q.filter(function (q) { return S.saved.indexOf(q.id) >= 0; });
  var h = head(U.savedQ);
  if (!qs.length) return h + '<div class="empty">' + ic('pin') + '<p>' + esc(U.noSaved) + '</p></div>';
  h += '<button class="btn wide" data-act="savedTest" style="margin-bottom:12px">' + ic('play') + esc(U.startTest) + '</button><div class="list">';
  qs.forEach(function (q) { h += '<div class="li"><span class="grow"><span class="t">' + esc(q.q) + '</span><span class="s">' + esc(topic(q.t).name) + '</span></span><button class="icon-btn on" data-act="unsave" data-a="' + q.id + '" aria-label="' + esc(U.unsavedT) + '">' + ic('pinf') + '</button></div>'; });
  return h + '</div>';
};

/* ── Движок теста ── */
var QZ = null;
function startQuiz(mode, list, title) {
  if (!list.length) { toast(mode === 'mistakes' ? U.noMistakes : U.noSaved); return; }
  QZ = { mode: mode, title: title, list: list, i: 0, picks: list.map(function () { return -1; }), shown: false, t0: Date.now(), limit: mode === 'exam' ? 25 * 60 : 0, done: false };
  go('quiz');
  if (QZ.limit) tickQuiz();
}
function tickQuiz() {
  clearInterval(QZ.timer);
  QZ.timer = setInterval(function () {
    if (!QZ || QZ.done) return clearInterval(QZ && QZ.timer);
    var s = QZ.limit - Math.floor((Date.now() - QZ.t0) / 1000), el = $('#qtimer');
    if (el) { el.lastChild.textContent = pad(Math.floor(Math.max(0, s) / 60)) + ':' + pad(Math.max(0, s) % 60); el.classList.toggle('low', s < 120); }
    if (s <= 0) { toast(U.timeUp); finishQuiz(); }
  }, 1000);
}
V.quiz = function () {
  var z = QZ, q = z.list[z.i], exam = z.mode === 'exam', pick = z.picks[z.i];
  var right = exam ? '<span class="timer num" id="qtimer">' + ic('clock') + '<span>25:00</span></span>' : '<button class="icon-btn ' + (S.saved.indexOf(q.id) >= 0 ? 'on' : '') + '" data-act="save" data-a="' + q.id + '" aria-label="' + esc(U.savedT) + '">' + ic(S.saved.indexOf(q.id) >= 0 ? 'pinf' : 'pin') + '</button>';
  var h = '<div class="bar"><button class="icon-btn" data-act="leave" aria-label="' + esc(U.exit) + '">' + ic('x') + '</button><h2>' + esc(z.title) + '</h2>' + right + '</div>';
  h += '<div class="qtop"><span class="small mute num">' + (z.i + 1) + ' ' + esc(U.of) + ' ' + z.list.length + '</span>' + '<div class="bar-p"><i style="width:100%;transform:scaleX(' + ((z.i + (z.shown ? 1 : 0)) / z.list.length).toFixed(3) + ')"></i></div>' + '</div>';
  if (exam) h += '<div class="dots">' + z.list.map(function (x, i) { return '<i class="' + (i === z.i ? 'cur ' : '') + (z.picks[i] >= 0 ? 'ans' : '') + '"></i>'; }).join('') + '</div>';
  h += '<div class="qcard" style="margin-top:12px">';
  if (q.pic) h += '<div class="pic">' + pic(q.pic) + '</div>';
  h += '<h3>' + esc(q.q) + '</h3>';
  q.o.forEach(function (o, i) {
    var c = '';
    if (z.shown) c = i === q.a ? 'ok' : i === pick ? 'bad' : 'dim';
    else if (i === pick) c = 'pick';
    h += '<button class="opt ' + c + '" data-act="pick" data-a="' + i + '"' + (z.shown ? ' disabled' : '') + '><span class="k">' + (i + 1) + '</span><span>' + esc(o) + '</span></button>';
  });
  if (z.shown) h += explain(q, pick === q.a);
  h += '</div><div class="qfoot">';
  if (exam) h += '<button class="btn wide" data-act="next"' + (pick < 0 ? ' disabled' : '') + '>' + esc(z.i === z.list.length - 1 ? U.finish : U.nextQ) + '</button>';
  else if (!z.shown) h += '<button class="btn wide" data-act="check"' + (pick < 0 ? ' disabled' : '') + '>' + esc(U.check) + '</button>';
  else h += '<button class="btn wide ' + (pick === q.a ? 'teal' : '') + '" data-act="next">' + esc(z.i === z.list.length - 1 ? U.finish : U.nextQ) + '</button>';
  return h + '</div>';
};
function explain(q, ok) {
  return '<div class="expl"><b style="color:var(--' + (ok ? 'ok' : 'bad') + ')">' + ic(ok ? 'check' : 'x') + esc(ok ? U.right : U.wrong) + '</b><p>' + esc(q.e) + '</p>' + (q.p ? '<div class="src">' + esc(U.rule) + ': ' + esc(String(q.p).indexOf('.') > 0 ? U.signNo + ' ' + q.p : U.pddPoint + ' ' + q.p) + '</div>' : '') + '<div id="aisay"></div><button class="btn soft ai-btn" data-act="simple" data-a="' + q.id + '">' + ic('spark') + esc(U.aiExplain) + '</button></div>';
}
function record(q, ok) {
  var a = S.ans[q.id] || [0, 0]; a[ok ? 0 : 1]++; S.ans[q.id] = a;
  var m = S.mis.indexOf(q.id);
  if (!ok && m < 0) S.mis.push(q.id);
  if (ok && m >= 0 && QZ.mode === 'mistakes') S.mis.splice(m, 1);
  S.today++; S.xp += ok ? 10 : 2; save();
}
function finishQuiz() {
  var z = QZ; if (!z || z.done) return;
  z.done = true; clearInterval(z.timer);
  if (z.mode === 'exam') z.list.forEach(function (q, i) { if (z.picks[i] >= 0) record(q, z.picks[i] === q.a); });
  var ok = z.list.filter(function (q, i) { return z.picks[i] === q.a; }).length, n = z.list.length, err = n - ok;
  var pass = z.mode === 'exam' ? err <= 2 : ok / n >= 0.8;
  z.res = { ok: ok, n: n, err: err, pass: pass, sec: Math.round((Date.now() - z.t0) / 1000) };
  S.hist.push({ mode: z.mode, title: z.title, when: U.today, ok: ok, n: n, pass: pass }); save();
  go('result', null, true);
  if (pass) setTimeout(function () { confetti(); buzz([12, 40, 12]); }, 350); else buzz(30);
}
V.result = function () {
  var z = QZ, r = z.res, exam = z.mode === 'exam', pct = Math.round(100 * r.ok / r.n);
  var h = head(z.title, { noBack: true });
  h += '<div class="res-head">' + ring(pct, 'lg', r.ok + '/' + r.n) + '<h1>' + esc(exam ? (r.pass ? U.examPass : U.examFail) : U.testDone) + '</h1><p>' + esc(r.pass ? U.passMsg : (exam ? U.failMsg : U.keepGoing)) + '</p></div>';
  h += '<div class="stats3"><div><b class="num" style="color:var(--ok)">' + r.ok + '</b><span>' + esc(U.correct) + '</span></div><div><b class="num" style="color:var(--bad)">' + r.err + '</b><span>' + esc(U.errors) + '</span></div><div><b class="num">' + Math.floor(r.sec / 60) + ':' + pad(r.sec % 60) + '</b><span>' + esc(U.time) + '</span></div></div>';
  if (r.err) h += '<button class="btn wide" data-act="mistakes" style="margin-bottom:8px">' + ic('refresh') + esc(U.toMistakes) + '</button>';
  h += '<div class="row" style="gap:8px"><button class="btn line grow" data-act="again">' + esc(U.again) + '</button><button class="btn line grow" data-act="home">' + esc(U.toHome) + '</button></div>';
  h += '<div class="sec"><h3>' + esc(U.review) + '</h3></div><div class="list">';
  z.list.forEach(function (q, i) {
    var p = z.picks[i], ok = p === q.a;
    h += '<button class="li rev" data-act="revOpen" data-a="' + i + '"><span class="k ' + (ok ? 'ok' : 'bad') + '">' + (i + 1) + '</span><span class="grow"><span class="t">' + esc(q.q) + '</span><span class="s">' + (ok ? esc(q.o[q.a]) : esc(U.yourAns) + ': ' + esc(p >= 0 ? q.o[p] : U.noAns)) + '</span></span>' + ic('chev', 'chev') + '</button>';
  });
  return h + '</div>';
};
V.rev = function (i) {
  var z = QZ, q = z.list[i], p = z.picks[i];
  var h = head(U.question + ' ' + (+i + 1)) + '<div class="qcard">' + (q.pic ? '<div class="pic">' + pic(q.pic) + '</div>' : '') + '<h3>' + esc(q.q) + '</h3>';
  q.o.forEach(function (o, k) { h += '<div class="opt ' + (k === q.a ? 'ok' : k === p ? 'bad' : 'dim') + '" style="animation:none"><span class="k">' + (k + 1) + '</span><span>' + esc(o) + '</span></div>'; });
  return h + explain(q, p === q.a) + '</div>';
};

/* ── Знаки ── */
V.signs = function (g) {
  g = g || 'all';
  var h = head(U.signs) + '<label class="search">' + ic('search') + '<input type="search" data-input="ssearch" placeholder="' + esc(U.signSearch) + '" autocomplete="off"></label>';
  h += '<div class="scroll-x">' + [['all', U.all]].concat(IT.signGroups.map(function (x) { return [x.id, x.name]; })).map(function (x) { return '<button class="chip ' + (x[0] === g ? 'on' : '') + '" data-act="sgroup" data-a="' + x[0] + '">' + esc(x[1]) + '</button>'; }).join('') + '</div>';
  h += '<button class="card press row" style="width:100%;margin-bottom:12px;text-align:left" data-go="guess"><span class="ico violet">' + ic('bolt') + '</span><span class="grow"><b>' + esc(U.guess) + '</b><span class="small mute" style="display:block">' + esc(U.guessS) + (S.signBest ? ' · ' + esc(U.best) + ' ' + S.signBest : '') + '</span></span>' + ic('chev', 'chev') + '</button>';
  return h + '<div class="signs" id="sres">' + signList(g, '') + '</div>';
};
function signList(g, qs) { qs = qs.trim().toLowerCase(); var a = SIGNS.filter(function (s) { return (g === 'all' || s.g === g) && (!qs || s.n.toLowerCase().indexOf(qs) >= 0 || (s.no || '').indexOf(qs) === 0); }); return a.length ? a.map(signTile).join('') : '<div class="empty" style="grid-column:1/-1">' + esc(U.nothing) + '</div>'; }
function signTile(s) { return '<button class="sign" data-go="sign" data-a="' + s.id + '">' + signSvg(s.id) + '<span>' + esc(s.n) + '</span></button>'; }
V.sign = function (id) {
  var s = byId(SIGNS, id), g = byId(IT.signGroups, s.g), q = Q.filter(function (x) { return x.pic === 'sign:' + id; })[0];
  var h = head(g.name) + '<div class="sign-big">' + signSvg(id) + '</div><div class="card" style="margin-top:12px">' + (s.no ? '<span class="chip brand">' + esc(U.signNo) + ' ' + s.no + '</span>' : '') + '<h2 style="font-size:20px;margin:8px 0">' + esc(s.n) + '</h2><p class="small mute" style="font-weight:600">' + esc(U.meaning) + '</p><p style="margin-top:4px">' + esc(s.d) + '</p></div>';
  h += '<div class="note">' + ic('spark') + '<div><b>' + esc(U.remember) + '</b><div>' + esc(s.m) + '</div></div></div>';
  if (q) h += '<button class="btn wide" data-act="oneQ" data-a="' + q.id + '">' + ic('test') + esc(U.trySign) + '</button>';
  return h;
};
var GS = null;
V.guess = function () {
  if (!GS || GS.over) GS = { list: shuffle(SIGNS).slice(0, 10), i: 0, score: 0, ok: 0, combo: 0, picked: -1 };
  var s = GS.list[GS.i];
  if (!s) return guessEnd();
  if (!GS.opts) { var others = shuffle(SIGNS.filter(function (x) { return x.id !== s.id && x.n !== s.n; })).slice(0, 3); GS.opts = shuffle([s].concat(others)); GS.t0 = Date.now(); }
  var h = head(U.guess, { right: '<span class="timer num">' + ic('star') + '<span>' + GS.score + '</span></span>' });
  h += '<div class="qtop"><span class="small mute num">' + (GS.i + 1) + ' ' + esc(U.of) + ' 10</span><div class="bar-p"><i style="width:100%;transform:scaleX(' + (GS.i / 10) + ')"></i></div></div>';
  h += '<div class="guess" style="margin-top:12px"><div class="sign-big">' + signSvg(s.id) + '</div><h3 style="margin:16px 0 10px;font-size:17px">' + esc(U.whatSign) + '</h3>';
  GS.opts.forEach(function (o, i) {
    var c = GS.picked < 0 ? '' : o.id === s.id ? 'ok' : i === GS.picked ? 'bad' : 'dim';
    h += '<button class="opt ' + c + '" data-act="gpick" data-a="' + i + '"' + (GS.picked >= 0 ? ' disabled' : '') + '><span class="k">' + (i + 1) + '</span><span>' + esc(o.n) + '</span></button>';
  });
  if (GS.picked >= 0) h += '<div class="expl"><p style="margin:0">' + esc(s.d) + '</p></div><div class="qfoot"><button class="btn wide" data-act="gnext">' + esc(U.nextQ) + '</button></div>';
  return h + '</div>';
};
function guessEnd() {
  GS.over = true; S.signBest = Math.max(S.signBest || 0, GS.score); S.xp += GS.ok * 5; save();
  if (GS.ok >= 7) setTimeout(confetti, 300);
  return head(U.guess) + '<div class="res-head">' + ring(GS.ok * 10, 'lg', GS.ok + '/10') + '<h1>' + esc(U.guessDone) + '</h1><p>' + GS.ok + ' ' + esc(U.guessOf) + ' · ' + esc(U.score) + ': ' + GS.score + '</p></div><button class="btn wide" data-act="greplay">' + esc(U.again) + '</button><button class="btn wide line" style="margin-top:8px" data-back>' + esc(U.close) + '</button>';
}

/* ── Занятия: расписание, посещаемость, запись ── */
var CAL = { m: NOW.getMonth(), y: NOW.getFullYear(), sel: dayKey(NOW), seg: 'cal' };
V.schedule = function () {
  var h = '<h1 class="big-title">' + esc(U.schedule) + '</h1><div class="seg"><button class="' + (CAL.seg === 'cal' ? 'on' : '') + '" data-act="seg" data-a="cal">' + esc(U.schedule) + '</button><button class="' + (CAL.seg === 'att' ? 'on' : '') + '" data-act="seg" data-a="att">' + esc(U.attendance) + '</button></div>';
  if (CAL.seg === 'att') return h + attendance();
  var ev = events(), first = new Date(CAL.y, CAL.m, 1), off = (first.getDay() + 6) % 7, days = new Date(CAL.y, CAL.m + 1, 0).getDate(), today = dayKey(new Date());
  h += '<div class="cal"><div class="cal-h"><button class="icon-btn" data-act="mon" data-a="-1" aria-label="' + esc(U.prev) + '">' + ic('back') + '</button><b>' + esc(IT.months[CAL.m]) + ' ' + CAL.y + '</b><button class="icon-btn" data-act="mon" data-a="1" aria-label="' + esc(U.nextQ) + '">' + ic('chev') + '</button></div><div class="cal-g">';
  h += IT.wd.map(function (w) { return '<span class="wd">' + w + '</span>'; }).join('');
  for (var i = 0; i < 42; i++) {
    var d = new Date(CAL.y, CAL.m, 1 - off + i), k = dayKey(d), es = ev.filter(function (e) { return e.d === k; });
    if (i >= 35 && d.getMonth() !== CAL.m) break;
    var m = es.map(function (e) { return '<i class="' + (e.missed ? 'ms' : e.kind) + '"></i>'; }).join('');
    h += '<button class="' + (d.getMonth() !== CAL.m ? 'out ' : '') + (k === today ? 'today ' : '') + (k === CAL.sel ? 'sel' : '') + '" data-act="day" data-a="' + k + '">' + d.getDate() + (m ? '<span class="m">' + m + '</span>' : '') + '</button>';
  }
  h += '</div><div class="legend"><span><i class="m th" style="background:var(--brand2)"></i>' + esc(U.theory) + '</span><span><i style="background:var(--teal)"></i>' + esc(U.driving) + '</span><span><i style="background:var(--bad)"></i>' + esc(U.missed) + '</span></div></div>';
  var sel = ev.filter(function (e) { return e.d === CAL.sel; }), sd = new Date(CAL.sel + 'T12:00:00');
  h += '<div class="sec"><h3>' + esc(dayName(sd)) + ', ' + esc(IT.wdLong[(sd.getDay() + 6) % 7]) + '</h3></div>';
  if (!sel.length) h += '<div class="card empty">' + esc(U.noLessons) + '</div>';
  sel.forEach(function (e) {
    h += '<div class="card lesson ' + (e.missed ? 'ms' : e.kind) + '"><div class="time num">' + e.time + '<small>' + e.end + '</small></div><div class="body"><span class="chip ' + (e.missed ? 'bad' : e.kind === 'pr' ? 'teal' : 'brand') + '">' + esc(e.missed ? U.missed : e.kind === 'pr' ? U.driving : U.theory) + '</span><b style="display:block;margin:6px 0 2px">' + esc(e.title) + '</b><div class="small mute">' + esc(e.who) + ' · ' + esc(e.where) + '</div></div></div>';
  });
  h += '<div class="card" style="margin-top:16px"><div class="row"><span class="ico teal">' + ic('steer') + '</span><div class="grow"><b class="num">' + (IT.me.left - S.booked.length) + ' ' + esc(U.hoursLeft) + '</b><div class="small mute">' + esc(U.bookS) + '</div></div></div><button class="btn wide teal" style="margin-top:12px" data-go="book">' + ic('plus') + esc(U.book) + '</button></div>';
  return h;
};
function attendance() {
  var ev = events(), now = new Date(), past = ev.filter(function (e) { return evDate(e) < now; });
  var th = past.filter(function (e) { return e.kind === 'th'; }), pr = past.filter(function (e) { return e.kind === 'pr'; });
  var thOk = th.filter(function (e) { return !e.missed; }).length, prOk = pr.filter(function (e) { return !e.missed; }).length;
  var h = '<div class="att"><div class="card" style="text-align:center">' + ring(Math.round(100 * thOk / th.length), '', thOk + '/' + th.length) + '<b style="display:block;margin-top:8px">' + esc(U.attTheory) + '</b><span class="tiny mute">' + esc(U.visited) + '</span></div><div class="card" style="text-align:center">' + ring(Math.round(100 * prOk / pr.length), '', prOk + '/' + pr.length) + '<b style="display:block;margin-top:8px">' + esc(U.attPractice) + '</b><span class="tiny mute">' + esc(U.visited) + '</span></div></div>';
  var ms = past.filter(function (e) { return e.missed; });
  h += '<div class="sec"><h3>' + esc(U.missedList) + '</h3><span class="chip bad num">' + ms.length + '</span></div><div class="list">';
  ms.forEach(function (e) { var d = evDate(e), done = S.made.indexOf(e.d + e.time) >= 0; h += '<div class="li"><span class="ico bad">' + ic(e.kind === 'pr' ? 'steer' : 'book') + '</span><span class="grow"><span class="t">' + esc(e.title) + '</span><span class="s">' + d.getDate() + ' ' + esc(IT.monthsGen[d.getMonth()]) + ', ' + e.time + '</span></span><button class="chip ' + (done ? 'ok' : 'brand') + '" data-act="makeup" data-a="' + e.d + e.time + '"' + (done ? ' disabled' : '') + '>' + esc(done ? U.sent : U.makeUp) + '</button></div>'; });
  h += '</div><div class="note">' + ic('info') + '<div>' + esc(U.attNote) + '</div></div>';
  return h;
}
var BK = { d: null, t: null, i: 'i1' };
V.book = function () {
  var h = head(U.book), days = [];
  for (var i = 1; days.length < 7; i++) { var d = addDays(NOW, i); if (d.getDay() !== 0) days.push(d); }
  if (!BK.d) BK.d = dayKey(days[0]);
  h += '<p class="small mute" style="margin-bottom:12px">' + esc(U.bookS) + '</p><div class="sec" style="margin-top:4px"><h3>' + esc(U.pickDay) + '</h3></div><div class="days">';
  days.forEach(function (d) { var k = dayKey(d); h += '<button class="day ' + (k === BK.d ? 'on' : '') + '" data-act="bday" data-a="' + k + '">' + esc(IT.wd[(d.getDay() + 6) % 7]) + '<b class="num">' + d.getDate() + '</b></button>'; });
  h += '</div><div class="sec"><h3>' + esc(U.pickTime) + '</h3></div><div class="slots">';
  ['08:00', '09:30', '11:00', '13:30', '15:00', '16:30', '18:00', '19:30', '21:00'].forEach(function (t, i) {
    var busy = (BK.d.charCodeAt(9) + i * 3 + BK.i.charCodeAt(1)) % 4 === 0 || S.booked.some(function (b) { return b.d === BK.d && b.time === t; });
    h += '<button class="slot num ' + (BK.t === t ? 'on' : '') + '" data-act="bslot" data-a="' + t + '"' + (busy ? ' disabled' : '') + '>' + t + '<small>' + (busy ? esc(U.busy) : '1,5 ' + esc(U.hShort)) + '</small></button>';
  });
  h += '</div><div class="sec"><h3>' + esc(U.pickInst) + '</h3></div>';
  IT.instructors.forEach(function (x) { h += '<button class="inst ' + (BK.i === x.id ? 'on' : '') + '" data-act="binst" data-a="' + x.id + '"><span class="ava">' + x.ini + '</span><span class="grow"><b style="display:block">' + esc(x.name) + '</b><span class="small mute">' + esc(x.car) + '</span></span>' + (BK.i === x.id ? '<span class="ico ok" style="width:28px;height:28px">' + ic('check') + '</span>' : '') + '</button>'; });
  h += '<div class="qfoot"><button class="btn wide" data-act="bconfirm"' + (BK.t ? '' : ' disabled') + '>' + esc(U.confirm) + (BK.t ? ' · ' + esc(dayName(new Date(BK.d + 'T12:00:00'))) + ', ' + BK.t : '') + '</button></div>';
  return h;
};
V.attendance = function () { return head(U.attendance) + attendance(); };

/* ── Штрафы ── */
V.fines = function () {
  var h = head(U.fines) + '<p class="small mute" style="margin-bottom:12px">' + esc(U.finesS) + '</p><div class="card row" style="margin-bottom:12px"><span class="ico">' + ic('info') + '</span><div class="grow small">' + esc(U.finesNote) + ' = <b class="num">' + fmt(IT.brv) + ' ' + esc(U.sum) + '</b>. ' + esc(U.brvAuto) + '</div></div>';
  IT.fines.forEach(function (f) {
    h += '<div class="card fine"><h3>' + esc(f.n) + '</h3><p class="small mute" style="margin-top:4px">' + esc(f.d) + '</p>';
    if (f.tiers) h += '<div style="margin-top:10px">' + f.tiers.map(function (t) { return '<div class="row small" style="padding:6px 0;box-shadow:inset 0 -1px 0 var(--line)"><span class="grow">' + esc(t[0]) + '</span><b class="num" style="color:var(--bad)">' + fmt(t[1] * IT.brv) + ' ' + esc(U.sum) + '</b></div>'; }).join('') + '</div>';
    else h += '<div class="sum"><b class="num">' + fmt(f.brv * IT.brv) + ' ' + esc(U.sum) + '</b><span class="small mute num">' + String(f.brv).replace('.', ',') + ' ' + esc(U.brv) + '</span></div>';
    if (f.warn) h += '<span class="chip">' + esc(U.orWarn) + '</span> ';
    if (f.ban) h += '<span class="chip bad">+ ' + esc(f.ban) + '</span>';
    h += '<div class="how">' + ic('check') + '<div><b>' + esc(U.howAvoid) + '.</b> ' + esc(f.h) + '</div></div>' + (f.art ? '<div class="art">' + esc(U.koao) + ' ' + f.art + '</div>' : '') + '</div>';
  });
  return h + '<p class="tiny mute" style="margin-top:12px">' + esc(U.finesSrc) + '</p>';
};

/* ── Прогноз экзамена ── */
V.forecast = function () {
  var st = stats(), h = head(U.forecastT);
  h += '<div class="card" style="text-align:center"><div class="small mute" style="font-weight:600">' + esc(U.fcPass) + '</div>' + ring(st.pass, 'lg') + '<div class="small mute">' + esc(U.fcLine.replace('{n}', fmt(st.solved)).replace('{p}', Math.round(st.p * 100))) + '</div></div>';
  var need = Math.max(20, Math.round((0.95 - st.p) * 600 / 10) * 10);
  h += '<div class="note">' + ic('target') + '<div>' + esc(st.pass >= 70 ? U.fcGood : U.fcTip.replace('{n}', need || 10)) + '</div></div>';
  h += '<div class="sec"><h3>' + esc(U.weak) + '</h3></div><div class="list">';
  st.weak.slice(0, 3).forEach(function (w) { var t = topic(w.t), a = Math.round(w.a * 100); h += '<div class="li"><span class="grow"><span class="t">' + esc(t.name) + '</span><span class="s">' + esc(U.accuracy) + ' ' + a + '%</span></span><button class="chip brand" data-act="topicTest" data-a="' + t.id + '">' + esc(U.train) + '</button></div>'; });
  h += '</div><div class="sec"><h3>' + esc(U.byTopic) + '</h3></div><div class="card fc-bars">';
  st.weak.slice().reverse().forEach(function (w) { var a = Math.round(w.a * 100); h += '<div class="row"><span class="t">' + esc(topic(w.t).name) + '</span>' + bar(a) + '<b class="num">' + a + '%</b></div>'; });
  h += '</div><p class="small mute" style="margin-top:12px">' + esc(U.fcWhy) + '</p>';
  return h;
};

/* ── Профиль ── */
V.profile = function () {
  var lvl = Math.floor(S.xp / 500) + 1, inLvl = S.xp % 500;
  var h = '<div class="prof"><div class="ava">' + IT.me.ini + '<span class="ver">' + ic('check') + '</span></div><h2>' + esc(IT.me.name) + '</h2><p class="small mute">' + esc(U.groupT) + ' ' + IT.me.group + ' · ' + esc(U.catB) + ' · ' + esc(IT.me.school) + '</p></div>';
  h += '<div class="card" style="margin-top:12px"><div class="row"><span class="ico violet">' + ic('star') + '</span><div class="grow"><b>' + esc(U.level) + ' ' + lvl + '</b><div class="small mute num">' + fmt(S.xp) + ' ' + esc(U.xp) + ' · ' + (500 - inLvl) + ' ' + esc(U.toNext) + '</div></div></div><div style="margin-top:10px">' + bar(inLvl / 5) + '</div></div>';
  h += '<div class="sec"><h3>' + esc(U.achievements) + '</h3></div><div class="badges">' + IT.badges.map(function (b) { return '<div class="badge ' + (b.on ? '' : 'off') + '"><span class="ico ' + b.c + '" style="margin:0 auto 6px">' + ic(b.ic) + '</span>' + esc(b.n) + '</div>'; }).join('') + '</div>';
  h += '<div class="sec"><h3>' + esc(U.general) + '</h3></div><div class="list">';
  h += li('', 'user', '', U.personal, IT.me.phone, 'data-act="personal"');
  h += li('', 'doc', 'teal', U.edu, U.eduS, 'data-act="edu"');
  h += '<div class="li"><span class="ico violet">' + ic('moon') + '</span><span class="grow t">' + esc(U.dark) + '</span><button class="sw ' + (S.theme === 'dark' ? 'on' : '') + '" data-act="theme" role="switch" aria-checked="' + (S.theme === 'dark') + '" aria-label="' + esc(U.dark) + '"></button></div>';
  h += '<div class="li"><span class="ico">' + ic('globe') + '</span><span class="grow t">' + esc(U.lang) + '</span><span class="lang-pick"><a href="' + IT.ruUrl + '#profile" class="' + (L === 'ru' ? 'on' : '') + '">RU</a><a href="' + IT.uzUrl + '#profile" class="' + (L === 'uz' ? 'on' : '') + '">UZ</a></span></div>';
  h += '<div class="li"><span class="ico warn">' + ic('bell') + '</span><span class="grow t">' + esc(U.notif) + '</span><button class="sw ' + (S.notif ? 'on' : '') + '" data-act="notif" role="switch" aria-checked="' + S.notif + '" aria-label="' + esc(U.notif) + '"></button></div>';
  h += li('', 'lock', '', U.pass, U.passS, 'data-act="demo"');
  h += '</div><div class="sec"><h3>' + esc(U.useful) + '</h3></div><div class="list">';
  h += li('', 'star', 'warn', U.rate, U.rateS, 'data-act="rate"');
  h += li('helper', 'spark', 'violet', U.helper, U.helperS);
  h += li('', 'help', 'teal', U.help, U.helpS, 'data-act="help"');
  h += li('', 'chat', '', U.contact, U.contactS, 'data-act="demo"');
  h += '</div><button class="btn wide line" style="margin-top:16px;color:var(--bad)" data-act="demo">' + ic('logout') + esc(U.logout) + '</button>';
  h += '<p class="ver-line">' + esc(U.version) + ' 2.0 · ' + esc(U.demo) + '</p>' + termsLine();
  return h;
};

/* ── Группа и упражнения ── */
V.group = function () {
  var h = head(U.group) + '<div class="card"><div class="row"><span class="ico">' + ic('users') + '</span><div class="grow"><b>' + esc(U.groupT) + ' ' + IT.me.group + ' · ' + esc(U.catB) + '</b><div class="small mute">' + esc(IT.me.school) + ', ' + esc(IT.me.started) + '</div></div></div></div>';
  var me = { n: U.you, xp: S.xp, me: true }, list = IT.mates.concat([me]).sort(function (a, b) { return b.xp - a.xp; });
  h += '<div class="sec"><h3>' + esc(U.rating) + '</h3></div><div class="list">';
  list.forEach(function (m, i) { h += '<div class="li" style="' + (m.me ? 'background:var(--brand-soft)' : '') + '"><b class="num" style="width:20px;color:' + (i < 3 ? 'var(--warn)' : 'var(--ink3)') + '">' + (i + 1) + '</b><span class="ava" style="width:36px;height:36px;font-size:13px">' + esc(m.me ? IT.me.ini : m.n.charAt(0)) + '</span><span class="grow t">' + esc(m.n) + '</span><b class="num small">' + fmt(m.xp) + ' ' + esc(U.xp) + '</b></div>'; });
  return h + '</div><p class="small mute" style="margin-top:12px">' + esc(U.ratingNote) + '</p>';
};
V.exercises = function () {
  var h = head(U.exercises);
  IT.exercises.forEach(function (x) {
    h += '<div class="card"><div class="row"><span class="ico teal">' + ic('steer') + '</span><b class="grow" style="font-size:17px">' + esc(x.n) + '</b></div>' + exFig(x.id) + '<p class="small mute" style="font-weight:600;margin-top:10px">' + esc(U.steps) + '</p><ol style="margin:6px 0 0;padding-left:20px">' + x.s.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol><p class="small" style="font-weight:600;margin-top:10px;color:var(--bad)">' + esc(U.commonErr) + '</p><ul style="margin:6px 0 0;padding-left:20px" class="mute">' + x.e.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul></div>';
  });
  return h;
};

/* ── Помощник ── */
var CHAT = [];
V.helper = function () {
  var h = head(U.helper) + '<div class="card ai-head"><span class="ico">' + ic('spark') + '</span><div class="grow"><b>' + esc(U.helper) + '</b><div class="small mute">' + esc(U.helperS) + '</div></div></div>';
  h += '<div class="chat" id="chat" style="margin-top:12px"><div class="msg bot">' + esc(U.helperHi) + '</div>' + CHAT.map(function (m) { return '<div class="msg ' + m[0] + '">' + esc(m[1]) + '</div>'; }).join('') + '</div>';
  h += '<div class="sugg" id="sugg">' + IT.chat.map(function (c, i) { return '<button data-act="ask" data-a="' + i + '">' + esc(c.q) + '</button>'; }).join('') + '</div>';
  return h + '<p class="tiny mute" style="margin-top:16px">' + esc(U.helperDemo) + '</p>';
};
function answer(i) {
  var c = IT.chat[i], a = c.a;
  if (a === '@exam') a = U.examAnswer;
  if (a === '@weak') { var st = stats(); a = U.weakAnswer.replace('{a}', topic(st.weak[0].t).name).replace('{b}', topic(st.weak[1].t).name).replace('{p}', st.pass); }
  return a;
}
function typeInto(el, text, done) {
  el.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
  setTimeout(function () {
    if (REDUCED) { el.textContent = text; if (done) done(); return; }
    var words = text.split(' '), k = 0; el.textContent = '';
    (function step() { if (k >= words.length) { if (done) done(); return; } el.textContent += (k ? ' ' : '') + words[k++]; var v = el.closest('.v'); if (v) v.scrollTop = v.scrollHeight; setTimeout(step, 28); })();
  }, 700);
}

/* ── Навигация: стек экранов со слайдом, вкладки без анимации слайда ── */
var STACK = [], TAB = 'home';
var TABS = ['home', 'lessons', 'tests', 'schedule', 'profile'];
function render(name, arg) { var v = document.createElement('div'); v.className = 'v'; v.setAttribute('data-view', name); v.innerHTML = V[name](arg); return v; }
function setTabs() { var top = STACK[STACK.length - 1]; tabsEl.classList.toggle('hide', !!top && ['quiz', 'result', 'rev', 'guess', 'book'].indexOf(top.name) >= 0); $$('button', tabsEl).forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-tab') === TAB); }); var d = $('.dot', tabsEl); if (d) d.style.display = S.mis.length ? '' : 'none'; if (d) d.textContent = S.mis.length; }
function afterShow(v) { animateRings(v); setTabs(); }
function tab(name) {
  TAB = name; QZ = null;
  STACK.forEach(function (s) { s.el.remove(); });
  var v = render(name); v.classList.add('fade-in'); views.appendChild(v);
  STACK = [{ name: name, el: v }]; afterShow(v);
}
function go(name, arg, replace) {
  var prev = STACK[STACK.length - 1], v = render(name, arg);
  if (prev && (name === 'quiz' && prev.name === 'quiz' || replace)) { prev.el.replaceWith(v); STACK[STACK.length - 1] = { name: name, arg: arg, el: v }; v.classList.add('fade-in'); afterShow(v); return; }
  views.appendChild(v); STACK.push({ name: name, arg: arg, el: v });
  if (!REDUCED) { v.classList.add('push-in'); if (prev) { prev.el.classList.add('under'); setTimeout(function () { prev.el.style.visibility = 'hidden'; prev.el.classList.remove('under'); }, 380); } }
  else if (prev) prev.el.style.visibility = 'hidden';
  afterShow(v);
}
function back() {
  if (STACK.length < 2) return;
  var top = STACK.pop(), prev = STACK[STACK.length - 1];
  if (top.name === 'quiz' || top.name === 'result') { if (QZ) clearInterval(QZ.timer); QZ = null; }
  prev.el.style.visibility = '';
  var fresh = render(prev.name, prev.arg); fresh.scrollTop = 0; prev.el.innerHTML = fresh.innerHTML;
  if (REDUCED) top.el.remove(); else { top.el.classList.add('pop-out'); setTimeout(function () { top.el.remove(); }, 300); }
  afterShow(prev.el);
}
function refresh() { var top = STACK[STACK.length - 1], st = top.el.scrollTop; top.el.innerHTML = V[top.name](top.arg); top.el.scrollTop = st; afterShow(top.el); }

/* ── Действия ── */
var A = {
  pushes: function () { sheet('<h3>' + esc(U.notifT) + '</h3><div class="list">' + U.pushes.map(function (p, i) { return '<div class="li"><span class="ico ' + ['teal', 'warn', ''][i] + '">' + ic(['steer', 'bolt', 'book'][i]) + '</span><span class="grow small">' + esc(p) + '</span></div>'; }).join('') + '</div>'); },
  route: function () { toast(U.routeDemo); },
  topicTest: function (a) { var t = topic(a); startQuiz('topic', shuffle(topicQs(t)).slice(0, 5), t.name); if (S.read.indexOf(a) < 0) { S.read.push(a); save(); } },
  exam: function () { startQuiz('exam', shuffle(Q).slice(0, 20), U.exam); },
  mixed: function () { startQuiz('mixed', shuffle(Q).slice(0, 10), U.mixed); },
  mistakes: function () { var l = Q.filter(function (q) { return S.mis.indexOf(q.id) >= 0; }); startQuiz('mistakes', l, U.mistakes); },
  savedTest: function () { startQuiz('saved', Q.filter(function (q) { return S.saved.indexOf(q.id) >= 0; }), U.savedQ); },
  oneQ: function (a) { startQuiz('one', Q.filter(function (q) { return q.id === +a; }), U.signs); },
  pick: function (a) { if (!QZ || QZ.shown) return; QZ.picks[QZ.i] = +a; buzz(6); refreshQuiz(); },
  check: function () {
    var q = QZ.list[QZ.i], ok = QZ.picks[QZ.i] === q.a; QZ.shown = true; record(q, ok); buzz(ok ? 10 : [20, 40, 20]); refreshQuiz();
    if (ok) burst(); },
  next: function () { if (QZ.i >= QZ.list.length - 1) return finishQuiz(); QZ.i++; QZ.shown = false; refreshQuiz(true); },
  leave: function () { if (QZ && (QZ.picks.some(function (p) { return p >= 0; }) && !QZ.done)) sheet('<h3>' + esc(U.leave) + '</h3><p class="mute" style="margin-bottom:16px">' + esc(U.leaveS) + '</p><button class="btn wide" data-act="closeSheet">' + esc(U.stay) + '</button><button class="btn wide line" style="margin-top:8px;color:var(--bad)" data-act="leaveYes">' + esc(U.exit) + '</button>'); else A.leaveYes(); },
  leaveYes: function () { closeSheet(); if (QZ) clearInterval(QZ.timer); QZ = null; back(); },
  again: function () { var z = QZ; startQuiz(z.mode, z.mode === 'exam' ? shuffle(Q).slice(0, 20) : shuffle(z.list), z.title); },
  home: function () { tab('home'); },
  revOpen: function (a) { go('rev', a); },
  simple: function (a) { var q = byId(Q, +a), box = $('#aisay', STACK[STACK.length - 1].el); if (!box || box.innerHTML) return; box.innerHTML = '<div class="ai-say"><b>' + ic('spark') + ' ' + esc(U.aiSays) + '</b><span></span></div>'; typeInto(box.querySelector('span'), q.simple); },
  save: function (a) { a = +a; var i = S.saved.indexOf(a); if (i >= 0) { S.saved.splice(i, 1); toast(U.unsavedT); } else { S.saved.push(a); toast(U.savedT); } save(); buzz(); refreshQuiz(); },
  unsave: function (a) { var i = S.saved.indexOf(+a); if (i >= 0) S.saved.splice(i, 1); save(); refresh(); },
  sgroup: function (a) { var top = STACK[STACK.length - 1]; top.arg = a; refresh(); },
  gpick: function (a) { var s = GS.list[GS.i], o = GS.opts[+a]; GS.picked = +a; var ok = o.id === s.id; if (ok) { GS.ok++; GS.combo++; GS.score += 100 + Math.max(0, 50 - Math.floor((Date.now() - GS.t0) / 200)) + (GS.combo > 1 ? 20 * GS.combo : 0); burst(); buzz(10); } else { GS.combo = 0; buzz([20, 40, 20]); } refresh(); },
  gnext: function () { GS.i++; GS.picked = -1; GS.opts = null; refresh(); },
  greplay: function () { GS = null; refresh(); },
  seg: function (a) { CAL.seg = a; refresh(); },
  mon: function (a) { CAL.m += +a; if (CAL.m < 0) { CAL.m = 11; CAL.y--; } if (CAL.m > 11) { CAL.m = 0; CAL.y++; } refresh(); },
  day: function (a) { CAL.sel = a; var p = a.split('-'); CAL.y = +p[0]; CAL.m = +p[1] - 1; buzz(5); refresh(); },
  bday: function (a) { BK.d = a; BK.t = null; refresh(); },
  bslot: function (a) { BK.t = a; buzz(5); refresh(); },
  binst: function (a) { BK.i = a; BK.t = null; refresh(); },
  bconfirm: function () {
    var p = BK.t.split(':'), end = new Date(2000, 0, 1, +p[0], +p[1] + 90);
    S.booked.push({ d: BK.d, time: BK.t, end: pad(end.getHours()) + ':' + pad(end.getMinutes()), inst: BK.i }); save();
    CAL.sel = BK.d; CAL.seg = 'cal'; var pp = BK.d.split('-'); CAL.y = +pp[0]; CAL.m = +pp[1] - 1;
    BK = { d: null, t: null, i: 'i1' }; confetti(); toast(U.booked); buzz([10, 30, 10]);
    setTimeout(function () { tab('schedule'); }, 500);
  },
  makeup: function (a) { if (S.made.indexOf(a) < 0) S.made.push(a); save(); toast(U.makeUpT); refresh(); },
  theme: function () { S.theme = S.theme === 'dark' ? 'light' : 'dark'; save(); applyTheme(); refresh(); },
  notif: function () { S.notif = !S.notif; save(); refresh(); },
  personal: function () { sheet('<h3>' + esc(U.personal) + '</h3><div class="list">' + [[U.fio, IT.me.name], [U.phone, IT.me.phone], [U.groupT, IT.me.group + ' · ' + U.catB], [U.schoolW, IT.me.school]].map(function (r) { return '<div class="li"><span class="grow"><span class="s">' + esc(r[0]) + '</span><span class="t">' + esc(r[1]) + '</span></span></div>'; }).join('') + '</div><button class="btn wide" style="margin-top:16px" data-act="closeSheet">' + esc(U.done) + '</button>'); },
  edu: function () { sheet('<h3>' + esc(U.edu) + '</h3><div class="list">' + U.eduRows.map(function (r) { return '<div class="li"><span class="grow"><span class="s">' + esc(r[0]) + '</span><span class="t">' + esc(r[1]) + '</span></span></div>'; }).join('') + '</div><button class="btn wide" style="margin-top:16px" data-act="closeSheet">' + esc(U.done) + '</button>'); },
  rate: function () { sheet('<h3>' + esc(U.rate) + '</h3><p class="mute">' + esc(U.rateQ) + '</p><div class="row" style="justify-content:center;gap:8px;margin:20px 0" id="stars">' + [1, 2, 3, 4, 5].map(function (i) { return '<button class="icon-btn" data-act="star" data-a="' + i + '" aria-label="' + i + '" style="width:48px;height:48px">' + ic('star') + '</button>'; }).join('') + '</div>'); },
  star: function (a) { $$('#stars button').forEach(function (b, i) { b.style.color = i < +a ? 'var(--warn)' : ''; }); buzz(); setTimeout(function () { closeSheet(); toast(U.thanks); if (+a === 5) confetti(); }, 500); },
  help: function () { sheet('<h3>' + esc(U.help) + '</h3><div class="list">' + U.faq.map(function (f) { return '<div class="li" style="display:block"><b class="t">' + esc(f[0]) + '</b><p class="s" style="margin-top:4px">' + esc(f[1]) + '</p></div>'; }).join('') + '</div>'); },
  demo: function () { toast(U.demoAction); },
  closeSheet: function () { closeSheet(); },
  ask: function (a) {
    var c = IT.chat[+a], chat = $('#chat'); if (!chat) return;
    CHAT.push(['me', c.q]); chat.insertAdjacentHTML('beforeend', '<div class="msg me">' + esc(c.q) + '</div><div class="msg bot"></div>');
    var text = answer(+a), el = chat.lastChild; typeInto(el, text, function () { CHAT.push(['bot', text]); });
  },
};
function refreshQuiz(slide) { var top = STACK[STACK.length - 1]; if (!top || top.name !== 'quiz') return; top.el.innerHTML = V.quiz(); if (slide) top.el.scrollTop = 0; if (QZ && QZ.limit) { var el = $('#qtimer'); var s = QZ.limit - Math.floor((Date.now() - QZ.t0) / 1000); if (el) el.lastChild.textContent = pad(Math.floor(s / 60)) + ':' + pad(s % 60); } }
function applyTheme() { screen.setAttribute('data-theme', S.theme); var m = $('meta[name=theme-color]'); if (m) m.setAttribute('content', S.theme === 'dark' ? '#0d1220' : '#eef2f8'); }

/* ── Лист снизу, всплывашка ── */
function sheet(html) {
  closeSheet(true);
  app.insertAdjacentHTML('beforeend', '<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog"><div class="grab"></div>' + html + '</div>');
  var bg = app.querySelector('.sheet-bg'), sh = app.querySelector('.sheet');
  requestAnimationFrame(function () { requestAnimationFrame(function () { bg.classList.add('on'); sh.classList.add('on'); }); });
}
function closeSheet(now) {
  var bg = app.querySelector('.sheet-bg'), sh = app.querySelector('.sheet'); if (!sh) return;
  if (now) { bg.remove(); sh.remove(); return; }
  bg.classList.remove('on'); sh.classList.remove('on'); setTimeout(function () { bg.remove(); sh.remove(); }, 350);
}
var toastT;
function toast(t) { var el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { el.classList.remove('on'); }, 2200); }

/* ── Конфетти: свой canvas, ничего не грузится со стороны ── */
var fx = document.getElementById('fx'), ctx = fx.getContext('2d'), parts = [], running = false;
var COLORS = ['#1f56d6', '#22b8a6', '#ffb020', '#ff5a6e', '#7c5cff', '#ffffff'];
function sizeFx() { var r = app.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2); fx.width = r.width * dpr; fx.height = r.height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); return r; }
function confetti() {
  if (REDUCED) return; var r = sizeFx();
  for (var i = 0; i < 140; i++) parts.push({ x: r.width / 2 + (Math.random() - 0.5) * 60, y: r.height * 0.35, vx: (Math.random() - 0.5) * 12, vy: -Math.random() * 12 - 4, s: 5 + Math.random() * 6, a: Math.random() * 6, va: (Math.random() - 0.5) * 0.4, c: COLORS[i % COLORS.length], life: 0 });
  if (!running) { running = true; requestAnimationFrame(frame); }
}
function burst() {
  if (REDUCED) return; var r = sizeFx(), b = $('.opt.ok', STACK[STACK.length - 1].el), br = b ? b.getBoundingClientRect() : null, ar = app.getBoundingClientRect();
  var x = br ? br.left - ar.left + br.width - 30 : r.width / 2, y = br ? br.top - ar.top + br.height / 2 : r.height / 2;
  for (var i = 0; i < 26; i++) parts.push({ x: x, y: y, vx: (Math.random() - 0.5) * 8, vy: -Math.random() * 7 - 1, s: 4 + Math.random() * 4, a: 0, va: 0.3, c: COLORS[i % 5], life: 30 });
  if (!running) { running = true; requestAnimationFrame(frame); }
}
function frame() {
  var w = fx.width, h = fx.height; ctx.clearRect(0, 0, w, h);
  parts = parts.filter(function (p) { return p.life < 140 && p.y < h; });
  parts.forEach(function (p) { p.life++; p.vy += 0.32; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.a += p.va; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.globalAlpha = Math.max(0, 1 - p.life / 140); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); });
  if (parts.length) requestAnimationFrame(frame); else { running = false; ctx.clearRect(0, 0, w, h); }
}

/* ── Рисунки: знаки по стандартным формам, схемы перекрёстков ── */
var C = { red: '#d7262f', blue: '#1858b8', yel: '#f6c21c', blk: '#1b1d22', wh: '#ffffff' };
var PED = '<g fill="' + C.blk + '"><circle cx="52" cy="35" r="5.5"/><path d="M49 42h7l5 13 8 5-2 4-10-5-2-5-3 9 7 9 1 13h-5l-2-11-8-8-4 19h-5l5-26 2-8-6 4-2 8h-5l3-11z"/></g>';
function tri(inner) { return '<svg viewBox="0 0 100 100"><path d="M50 9 93 86H7z" fill="' + C.wh + '" stroke="' + C.red + '" stroke-width="8" stroke-linejoin="round"/>' + inner + '</svg>'; }
function cRed(inner, fill) { return '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="' + (fill || C.wh) + '" stroke="' + C.red + '" stroke-width="10"/>' + (inner || '') + '</svg>'; }
function cBlue(inner) { return '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="' + C.blue + '" stroke="#fff" stroke-width="2"/>' + inner + '</svg>'; }
function sq(inner, fill) { return '<svg viewBox="0 0 100 100"><rect x="5" y="5" width="90" height="90" rx="9" fill="' + (fill || C.blue) + '" stroke="#fff" stroke-width="3"/>' + inner + '</svg>'; }
function arrow(d, w) { return '<path d="' + d + '" fill="none" stroke="#fff" stroke-width="' + (w || 9) + '" stroke-linejoin="round"/>'; }
function carIcon(x, y, c, s) { s = s || 1; return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path d="M-12 4v-6l4-7h16l4 7v6z" fill="' + c + '"/><circle cx="-7" cy="5" r="3" fill="' + C.blk + '"/><circle cx="7" cy="5" r="3" fill="' + C.blk + '"/><path d="M-6-7h12l2 4H-8z" fill="#fff" opacity=".8"/></g>'; }
var SV = {
  pedwarn: function () { return tri('<g transform="translate(14 22) scale(.72)">' + PED + '</g><path d="M30 76h40" stroke="' + C.blk + '" stroke-width="3" stroke-dasharray="6 4"/>'); },
  kids: function () { return tri('<g transform="translate(6 26) scale(.6)">' + PED + '</g><g transform="translate(34 34) scale(.5)">' + PED + '</g>'); },
  tlight: function () { return tri('<rect x="41" y="34" width="18" height="44" rx="6" fill="' + C.blk + '"/><circle cx="50" cy="43" r="5" fill="' + C.red + '"/><circle cx="50" cy="56" r="5" fill="' + C.yel + '"/><circle cx="50" cy="69" r="5" fill="#1fa463"/>'); },
  danger: function () { return tri('<rect x="45" y="34" width="10" height="28" rx="4" fill="' + C.blk + '"/><circle cx="50" cy="72" r="5.5" fill="' + C.blk + '"/>'); },
  curve: function () { return tri('<path d="M42 78V60c0-8 4-12 12-15l6-2" fill="none" stroke="' + C.blk + '" stroke-width="7"/><path d="M56 34l14 7-12 10z" fill="' + C.blk + '"/>'); },
  narrow: function () { return tri('<path d="M36 78l6-18V40M64 78l-6-18V40" fill="none" stroke="' + C.blk + '" stroke-width="6" stroke-linecap="round"/>'); },
  rail: function () { return tri('<g stroke="' + C.blk + '" stroke-width="5"><path d="M30 76V48M70 76V48M27 54h46M27 68h46"/></g><g stroke="' + C.blk + '" stroke-width="3"><path d="M38 54v14M46 54v14M54 54v14M62 54v14"/></g>'); },
  main: function () { return '<svg viewBox="0 0 100 100"><path d="M50 3 97 50 50 97 3 50z" fill="#fff" stroke="' + C.blk + '" stroke-width="2"/><path d="M50 18 82 50 50 82 18 50z" fill="' + C.yel + '" stroke="' + C.blk + '" stroke-width="1.5"/></svg>'; },
  endmain: function () { return '<svg viewBox="0 0 100 100"><path d="M50 3 97 50 50 97 3 50z" fill="#fff" stroke="' + C.blk + '" stroke-width="2"/><path d="M50 18 82 50 50 82 18 50z" fill="' + C.yel + '" stroke="' + C.blk + '" stroke-width="1.5"/><path d="M28 28 72 72M33 23 77 67M23 33 67 77" stroke="' + C.blk + '" stroke-width="2.5"/></svg>'; },
  giveway: function () { return '<svg viewBox="0 0 100 100"><path d="M50 91 7 14h86z" fill="#fff" stroke="' + C.red + '" stroke-width="9" stroke-linejoin="round"/></svg>'; },
  stop: function () { return '<svg viewBox="0 0 100 100"><path d="M31 4h38l27 27v38L69 96H31L4 69V31z" fill="' + C.red + '" stroke="#fff" stroke-width="3"/><text x="50" y="60" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="27" fill="#fff">STOP</text></svg>'; },
  noentry: function () { return '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="' + C.red + '" stroke="#fff" stroke-width="2"/><rect x="16" y="42" width="68" height="16" rx="2" fill="#fff"/></svg>'; },
  noveh: function () { return cRed(); },
  speed40: function () { return cRed('<text x="50" y="64" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="40" fill="' + C.blk + '">40</text>'); },
  noovertake: function () { return cRed(carIcon(36, 50, C.red, 1.15) + carIcon(64, 50, C.blk, 1.15)); },
  nostop: function () { return cRed('<path d="M22 22 78 78M78 22 22 78" stroke="' + C.red + '" stroke-width="10"/>', C.blue); },
  nopark: function () { return cRed('<path d="M22 22 78 78" stroke="' + C.red + '" stroke-width="10"/>', C.blue); },
  noleft: function () { return cRed('<path d="M60 80V52c0-6-3-9-9-9H32" fill="none" stroke="' + C.blk + '" stroke-width="8"/><path d="M36 31 22 43l14 12z" fill="' + C.blk + '"/><path d="M20 20 80 80" stroke="' + C.red + '" stroke-width="8"/>'); },
  nouturn: function () { return cRed('<path d="M62 80V44c0-9-6-14-13-14s-13 5-13 14v14" fill="none" stroke="' + C.blk + '" stroke-width="8"/><path d="M24 54h24L36 70z" fill="' + C.blk + '"/><path d="M20 20 80 80" stroke="' + C.red + '" stroke-width="8"/>'); },
  ahead: function () { return cBlue(arrow('M50 82V34') + '<path d="M50 16 70 40H30z" fill="#fff"/>'); },
  right: function () { return cBlue(arrow('M36 80V56c0-6 3-9 9-9h17') + '<path d="M78 47 58 30v34z" fill="#fff"/>'); },
  round: function () { return cBlue('<g fill="none" stroke="#fff" stroke-width="7"><path d="M33 40a20 20 0 0 1 22-14"/><path d="M70 46a20 20 0 0 1-8 22"/><path d="M44 72a20 20 0 0 1-16-18"/></g><g fill="#fff"><path d="M53 17l12 9-13 7z"/><path d="M71 69l-14 3 6-13z"/><path d="M21 46l7 13-14-1z"/></g>'); },
  pedx: function () { return sq('<path d="M50 14 88 86H12z" fill="#fff"/><g transform="translate(18 30) scale(.64)">' + PED + '</g>'); },
  parking: function () { return sq('<text x="50" y="74" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="64" fill="#fff">P</text>'); },
  oneway: function () { return sq(arrow('M50 84V40', 12) + '<path d="M50 14 74 44H26z" fill="#fff"/>'); },
  deadend: function () { return sq('<path d="M50 86V40" stroke="#fff" stroke-width="16"/><path d="M24 30h52" stroke="' + C.red + '" stroke-width="14"/>'); },
  aidpt: function () { return '<svg viewBox="0 0 100 100"><rect x="14" y="5" width="72" height="90" rx="7" fill="' + C.blue + '" stroke="#fff" stroke-width="3"/><rect x="24" y="16" width="52" height="52" fill="#fff"/><path d="M50 24v36M32 42h36" stroke="' + C.red + '" stroke-width="11"/></svg>'; },
};
function signSvg(id) { return SV[id] ? SV[id]() : ''; }

/* Схема перекрёстка 320×190: дороги, разметка, машины сверху. */
function road(extra) {
  return '<svg viewBox="0 0 320 190" role="img"><rect width="320" height="190" fill="hsl(140 30% 82%)"/><rect x="0" y="62" width="320" height="66" fill="#5b6270"/><rect x="127" y="0" width="66" height="190" fill="#5b6270"/><rect x="127" y="62" width="66" height="66" fill="#5b6270"/>' +
    '<path d="M0 95h120M200 95h120M160 0v55M160 135v55" stroke="#fff" stroke-width="2" stroke-dasharray="10 8"/>' + extra + '</svg>';
}
function topCar(x, y, rot, c) { return '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ')"><rect x="-11" y="-19" width="22" height="38" rx="6" fill="' + c + '"/><rect x="-8" y="-11" width="16" height="9" rx="2" fill="#cfe4ff" opacity=".9"/><rect x="-8" y="8" width="16" height="6" rx="2" fill="#cfe4ff" opacity=".7"/></g>'; }
function arrowPath(d, c) { return '<path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="4" stroke-linecap="round" stroke-dasharray="1 9" opacity=".95"/>'; }
function pic(k) {
  if (k.indexOf('sign:') === 0) return '<div style="display:grid;place-items:center;padding:20px"><div style="width:128px">' + signSvg(k.slice(5)) + '</div></div>';
  if (k === 'q-right') return road(topCar(176, 160, 0, '#2563eb') + topCar(268, 79, 270, '#e23b4a') + arrowPath('M176 140V30', '#2563eb') + arrowPath('M250 79H40', '#e23b4a'));
  if (k === 'q-left') return road(topCar(176, 160, 0, '#2563eb') + topCar(144, 30, 180, '#f59e0b') + arrowPath('M176 140v-40c0-10-6-16-16-16H20', '#2563eb') + arrowPath('M144 50v130', '#f59e0b') + light(214, 140, 'g'));
  if (k === 'q-ped') return '<svg viewBox="0 0 320 190"><rect width="320" height="190" fill="hsl(140 30% 82%)"/><rect y="50" width="320" height="90" fill="#5b6270"/>' + [0, 1, 2, 3, 4, 5, 6].map(function (i) { return '<rect x="' + (130 + 0) + '" y="' + (54 + i * 12.5) + '" width="60" height="7" fill="#fff"/>'; }).join('') + '<path d="M0 95h110M210 95h110" stroke="#fff" stroke-width="2" stroke-dasharray="10 8"/>' + topCar(60, 117, 90, '#2563eb') + '<g transform="translate(140 108) scale(.5)">' + PED + '</g><g transform="translate(232 6)"><rect width="56" height="38" rx="6" fill="' + C.blue + '"/><path d="M28 6 48 34H8z" fill="#fff"/></g></svg>';
  if (k === 'q-yellow') return '<svg viewBox="0 0 320 190"><rect width="320" height="190" fill="hsl(214 40% 92%)"/><rect x="134" y="20" width="52" height="150" rx="16" fill="' + C.blk + '"/><circle cx="160" cy="52" r="17" fill="#3a1416"/><circle class="blink-y" cx="160" cy="95" r="17" fill="' + C.yel + '"/><circle cx="160" cy="138" r="17" fill="#0f2a1a"/><circle cx="160" cy="95" r="27" fill="none" stroke="' + C.yel + '" stroke-width="3" opacity=".5"/></svg>';
  if (k === 'q-reg') return '<svg viewBox="0 0 320 190"><rect width="320" height="190" fill="hsl(214 40% 92%)"/><ellipse cx="160" cy="176" rx="70" ry="8" fill="#000" opacity=".12"/><rect x="146" y="70" width="28" height="62" rx="8" fill="#1f3a68"/><rect x="72" y="74" width="80" height="12" rx="6" fill="#1f3a68"/><rect x="168" y="74" width="80" height="12" rx="6" fill="#1f3a68"/><rect x="148" y="128" width="11" height="46" rx="5" fill="#16294a"/><rect x="161" y="128" width="11" height="46" rx="5" fill="#16294a"/><circle cx="160" cy="54" r="14" fill="#f1c9a5"/><path d="M144 46h32l-4-10h-24z" fill="#fff"/><rect x="150" y="70" width="20" height="8" fill="#e9eef7"/><rect x="246" y="76" width="34" height="8" rx="4" fill="#fff" stroke="#111" stroke-width="2"/></svg>';
  return '';
}
function light(x, y, on) { return '<g transform="translate(' + x + ' ' + y + ')"><rect width="18" height="44" rx="6" fill="' + C.blk + '"/><circle cx="9" cy="9" r="5" fill="#3a1416"/><circle cx="9" cy="22" r="5" fill="#3a2f10"/><circle cx="9" cy="35" r="5" fill="' + (on === 'g' ? '#22c55e' : '#0f2a1a') + '"/></g>'; }
function figure(k) {
  var cap = U['fig_' + k] || '';
  var svg = k === 'lights' ? pic('q-reg') : k === 'cross' ? pic('q-right') : pic('q-ped');
  return '<figure class="fig">' + svg + '<figcaption>' + esc(cap) + '</figcaption></figure>';
}
function exFig(id) {
  var cone = function (x, y) { return '<path d="M' + (x - 5) + ' ' + (y + 6) + 'l5-14 5 14z" fill="#f97316"/>'; }, inner = '';
  if (id === 'snake') inner = [60, 120, 180, 240].map(function (x) { return cone(x, 40); }).join('') + '<path d="M20 52c20 0 30-24 50-24s30 24 50 24 30-24 50-24 30 24 50 24 30-24 50-24" fill="none" stroke="#2563eb" stroke-width="3" stroke-dasharray="6 6"/>';
  if (id === 'hill') inner = '<path d="M20 64h60l60-36h60l60 36h40" fill="none" stroke="#5b6270" stroke-width="6"/><path d="M168 22v12" stroke="#d7262f" stroke-width="3"/>' + carIcon(110, 40, '#2563eb', 1.2);
  if (id === 'park') inner = '<rect x="40" y="40" width="240" height="26" fill="none" stroke="#5b6270" stroke-width="2" stroke-dasharray="6 4"/>' + carIcon(80, 52, '#94a3b8') + carIcon(240, 52, '#94a3b8') + '<path d="M200 22c-20 0-30 30-40 30" fill="none" stroke="#2563eb" stroke-width="3" stroke-dasharray="6 6"/>' + carIcon(206, 22, '#2563eb');
  if (id === 'garage') inner = '<path d="M130 10v50h60V10" fill="none" stroke="#5b6270" stroke-width="4"/><path d="M160 76c40 0 60-10 80-30" fill="none" stroke="#2563eb" stroke-width="3" stroke-dasharray="6 6"/>' + carIcon(244, 40, '#2563eb');
  return '<svg viewBox="0 0 320 80" style="width:100%;height:auto;margin-top:12px;border-radius:12px;background:var(--bg2)">' + inner + '</svg>';
}

/* ── Связка событий ── */
app.addEventListener('click', function (e) {
  var b = e.target.closest('[data-act],[data-go],[data-back],[data-tab]'); if (!b || b.disabled) return;
  if (b.tagName === 'A') return;
  e.preventDefault();
  var a = b.getAttribute('data-a');
  if (b.hasAttribute('data-tab')) { buzz(5); return tab(b.getAttribute('data-tab')); }
  if (b.hasAttribute('data-back')) return back();
  if (b.hasAttribute('data-go')) { buzz(5); return go(b.getAttribute('data-go'), a, b.hasAttribute('data-replace')); }
  var f = A[b.getAttribute('data-act')]; if (f) f(a, b);
});
app.addEventListener('input', function (e) {
  var k = e.target.getAttribute('data-input');
  if (k === 'lsearch') $('#lres').innerHTML = lessonList(e.target.value);
  if (k === 'ssearch') { var top = STACK[STACK.length - 1]; $('#sres', top.el).innerHTML = signList(top.arg || 'all', e.target.value); }
});
app.addEventListener('scroll', function (e) {
  var v = e.target; if (!v.classList || !v.classList.contains('v')) return;
  var p = $('.read-prog i', v); if (p) p.style.transform = 'scaleX(' + Math.min(1, v.scrollTop / Math.max(1, v.scrollHeight - v.clientHeight)).toFixed(3) + ')';
}, true);
setInterval(function () { $$('[data-count]').forEach(function (el) { el.lastChild.textContent = left(+el.getAttribute('data-count') - Date.now()); }); }, 1000);

/* Кнопки сбоку от айфона на ПК: сразу в нужный сценарий. */
document.addEventListener('click', function (e) {
  var j = e.target.closest('[data-jump]'); if (!j) return;
  var k = j.getAttribute('data-jump');
  if (TABS.indexOf(k) >= 0) return tab(k);
  tab(k === 'exam' ? 'tests' : 'home');
  setTimeout(function () { if (k === 'exam') A.exam(); else go(k); }, 60);
});

/* Телефон: листается только вверх-вниз, щипок и двойной тап не приближают. */
['gesturestart', 'gesturechange', 'gestureend'].forEach(function (t) { document.addEventListener(t, function (e) { e.preventDefault(); }, { passive: false }); });
var lastTouch = 0; document.addEventListener('touchend', function (e) { var n = Date.now(); if (n - lastTouch < 300) e.preventDefault(); lastTouch = n; }, { passive: false });

/* Внутри корпуса айфона на ПК и на весь экран на телефоне. */
function layout() { var inPhone = window.innerWidth >= 900 && window.innerHeight > 560; app.classList.toggle('in-phone', inPhone); }
window.addEventListener('resize', layout); layout();
applyTheme();
var start = (location.hash || '').replace('#', '');
tab(TABS.indexOf(start) >= 0 ? start : 'home');
setTimeout(function () { var sp = $('#splash'); if (sp) { sp.classList.add('off'); setTimeout(function () { sp.remove(); }, 700); } }, REDUCED ? 0 : 900);
})();
