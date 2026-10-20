(function () {
'use strict';
var D = window.HB, U = D.ui, PL = D.lang;
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
var ic = function (k, c) { return '<svg class="' + (c || 'ic') + '" aria-hidden="true"><use href="#i-' + k + '"/></svg>'; };
var MOB = matchMedia('(max-width: 860px)');
var CO = D.company, CL = D.client, ME = D.managers[0], AD = D.ads[0];
var H = 3600e3, MIN = 60e3;

/* ---------- состояние демо ---------- */
var S, seq = 0, timers = [];
function fresh() {
  return { scheme: 'B', role: 'mgr', side: 'ig', cl: null, step: 1, ig: 'feed', tg: 'list', from: null,
    msgs: [], lead: false, t0: 0, taken: false, takeAt: 0, status: 'new', crm: null, closed: false,
    off: 0, remind: 0, warned: false, sheet: null, qtab: null, reply: false, q: '', push: null, typing: false,
    badge: { ig: false, tg: false }, con: 0 };
}
function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }
function now() { return Date.now() + S.off; }
function hm(ms) { var d = new Date(ms); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
function clientMsgs() { return S.msgs.filter(function (m) { return m.who === 'c'; }); }
function lastClient() { var c = clientMsgs(); return c.length ? c[c.length - 1].at : 0; }
function winLeft() { return lastClient() ? lastClient() + 24 * H - now() : 24 * H; }
function dur(ms) {
  if (ms <= 0) return '0 ' + U.m;
  var h = Math.floor(ms / H), m = Math.floor(ms % H / MIN);
  return (h ? h + ' ' + U.h + ' ' : '') + m + ' ' + U.m;
}
function dsec(ms) { var s = Math.max(0, Math.round(ms / 1000)); return s < 60 ? s + ' ' + U.s : Math.floor(s / 60) + ' ' + U.m + ' ' + (s % 60) + ' ' + U.s; }
function add(who, k, text, extra) {
  var m = { id: ++seq, who: who, k: k, t: text || '', at: now() };
  if (extra) for (var x in extra) m[x] = extra[x];
  S.msgs.push(m); return m;
}
function hue(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return h; }
function av(name, cls, ini) {
  var t = ini || name.split(/\s+/).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
  return '<span class="av ' + (cls || '') + '" style="--h:' + hue(name) + '">' + esc(t) + '</span>';
}
function cLang() { return S.cl || D.langs[0]; }
function cname() { return CL.name + ' · @' + CL.user; }
function mgrName() { return S.role === 'head' ? D.head : ME.name; }

/* ---------- рисунки: шкаф-купе и кухня кодом ---------- */
function art(kind) {
  if (kind === 'room') return '<svg class="art" viewBox="0 0 120 150" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="120" height="150" fill="hsl(36 30% 88%)"/><rect y="112" width="120" height="38" fill="hsl(30 25% 70%)"/><rect x="14" y="30" width="62" height="82" fill="hsl(36 20% 96%)" stroke="hsl(30 15% 60%)"/><path d="M45 30v82" stroke="hsl(30 15% 60%)"/><rect x="84" y="62" width="24" height="50" fill="hsl(200 20% 75%)"/><path d="M0 112h120" stroke="hsl(30 20% 55%)"/><circle cx="96" cy="40" r="10" fill="hsl(45 80% 75%)"/></svg>';
  if (kind === 'kitchen') return '<svg class="art" viewBox="0 0 120 150" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="120" height="150" fill="hsl(200 18% 90%)"/><rect y="118" width="120" height="32" fill="hsl(30 30% 62%)"/><rect x="6" y="20" width="108" height="34" rx="2" fill="#fff" stroke="hsl(200 10% 78%)"/><path d="M42 20v34M78 20v34" stroke="hsl(200 10% 78%)"/><rect x="6" y="74" width="108" height="44" fill="#fff" stroke="hsl(200 10% 78%)"/><rect x="6" y="70" width="108" height="5" fill="hsl(30 35% 55%)"/><path d="M42 74v44M78 74v44M36 96h0M48 96h0" stroke="hsl(200 10% 78%)"/><rect x="50" y="44" width="20" height="18" rx="2" fill="hsl(200 10% 70%)"/></svg>';
  /* шкаф-купе: зеркало, дерево, белый */
  return '<svg class="art" viewBox="0 0 120 150" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="gm" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="hsl(200 30% 92%)"/><stop offset=".5" stop-color="hsl(200 20% 78%)"/><stop offset="1" stop-color="hsl(200 30% 90%)"/></linearGradient><linearGradient id="gw" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="hsl(30 45% 62%)"/><stop offset="1" stop-color="hsl(26 45% 48%)"/></linearGradient></defs><rect width="120" height="150" fill="hsl(36 34% 90%)"/><rect y="124" width="120" height="26" fill="hsl(28 30% 58%)"/><rect x="10" y="14" width="100" height="112" rx="2" fill="hsl(36 25% 97%)" stroke="hsl(30 15% 70%)"/><rect x="14" y="18" width="30" height="104" fill="url(#gw)"/><rect x="45" y="18" width="30" height="104" fill="url(#gm)"/><rect x="76" y="18" width="30" height="104" fill="hsl(36 20% 94%)" stroke="hsl(30 12% 78%)"/><path d="M52 30l14 30M56 70l10 22" stroke="#fff" stroke-width="2" opacity=".7"/><rect x="40" y="62" width="2" height="16" rx="1" fill="hsl(30 10% 35%)"/><rect x="79" y="62" width="2" height="16" rx="1" fill="hsl(30 10% 35%)"/><path d="M10 12h100" stroke="hsl(30 10% 40%)" stroke-width="2"/></svg>';
}
function wave(n) { var h = ''; for (var i = 0; i < n; i++) h += '<i style="height:' + (5 + (i * 37 % 17)) + 'px"></i>'; return '<span class="wave">' + h + '</span>'; }
function voice(sec) { return '<span class="voice"><span class="pl">' + ic('play') + '</span>' + wave(22) + '<small>0:0' + sec + '</small></span>'; }

/* ---------- Instagram клиента ---------- */
function renderIg() {
  var el = $('#ig'), h = '';
  if (S.ig === 'feed') {
    var st = ['nilu.decor', 'sardor_88', 'kamola.uy', 'aziza_home', 'javlon.r'];
    h += '<div class="ig-h"><span class="ig-word">Instagram</span>' + ic('heart') + '<span class="ib" data-hint="igdm">' + ic('send') + '</span></div><div class="body">';
    h += '<div class="stories">' + st.map(function (n) { return '<div class="story"><span class="ring">' + av(n) + '</span><span>' + n + '</span></div>'; }).join('') + '</div>';
    h += '<div class="post-h">' + av(CO.name, 'sm') + '<div><b>' + CO.ig + '</b><small>' + U.sponsored + '</small></div>' + ic('dots') + '</div>';
    h += '<div class="reel">' + art('wardrobe') + '<span class="rtag">' + ic('reel') + 'Reels</span><span class="cap">' + esc(AD.title) + '</span></div>';
    h += '<button class="cta" data-act="cta" data-hint="cta">' + U.sendMsg + ic('chev') + '</button>';
    h += '<div class="post-a">' + ic('heart') + ic('chat') + ic('send') + ic('save') + '</div>';
    h += '<p class="post-t"><b>' + U.likes + '</b><br><b>' + CO.ig + '</b> ' + U.adCaption + '</p>';
    h += '<div class="post-h">' + av('nilu.decor', 'sm') + '<div><b>nilu.decor</b><small>' + D.langName[D.langs[0]] + '</small></div>' + ic('dots') + '</div>';
    h += '<div class="reel">' + art('kitchen') + '<span class="cap">' + U.post2 + '</span></div>';
    h += '</div><div class="ig-nav">' + ic('home') + ic('search') + ic('plus') + ic('reel') + ic('user') + '</div>';
  } else {
    h += '<div class="dm-h"><button class="ib" data-act="igback" aria-label="back">' + ic('back') + '</button>' + av(CO.name, 'sm') + '<div><b>' + CO.ig + '</b><small>' + U.replies + '</small></div></div><div class="body" id="igb"><div class="dm">';
    h += '<div class="adctx"><span class="mini">' + art('wardrobe') + '</span><b>' + esc(AD.title) + '</b>' + U.replyAd + '</div>';
    S.msgs.forEach(function (m) {
      if (m.who === 'bot') return;
      var cls = m.id > shown.ig ? ' new' : '';
      if (m.who === 'c') {
        if (m.k === 'photo') h += '<div class="media me' + cls + '">' + art('room') + '</div>';
        else h += '<div class="b me' + cls + '">' + esc(m.t) + '</div>';
      } else {
        var inner = m.k === 'photo' ? '<div class="media">' + art('wardrobe') + '</div>' : m.k === 'voice' ? '<div class="b co">' + voice(7) + '</div>' : '<div class="b co">' + esc(m.t) + '</div>';
        h += '<div class="row' + cls + '">' + av(CO.name) + inner + '</div>';
      }
    });
    if (S.typing) h += '<div class="typing"><i></i><i></i><i></i></div>';
    var last = S.msgs.filter(function (m) { return m.who !== 'bot'; }).pop();
    if (last && last.who === 'c' && S.taken) h += '<span class="seen">' + U.seen + '</span>';
    h += '</div></div>';
    var opts = [];
    var answered = S.msgs.some(function (m) { return m.who === 'm' || m.who === 'ig'; });
    var lastWho = last ? last.who : null;
    if (!clientMsgs().length) D.langs.forEach(function (l) { D.ask[l].forEach(function (q, i) { opts.push({ a: 'ask', l: l, i: i, t: q }); }); });
    else if (answered && lastWho !== 'c') { var cl = cLang(); D.creply[cl].forEach(function (q, i) { opts.push({ a: 'creply', l: cl, i: i, t: q }); }); opts.push({ a: 'cphoto', t: '📷 ' + U.photoRoom }); }
    if (opts.length) {
      h += '<div class="quickq"><small>' + (clientMsgs().length ? U.sideClient : U.igQuick) + '</small><div class="qs">' + opts.map(function (o, n) {
        return '<button data-act="' + o.a + '" data-a="' + (o.l || '') + '" data-i="' + (o.i || 0) + '"' + (n === 0 ? ' data-hint="ask"' : '') + '>' + esc(o.t) + (o.l && !clientMsgs().length ? '<span class="l">' + o.l + '</span>' : '') + '</button>';
      }).join('') + '</div></div>';
    }
    h += '<div class="compose"><span class="camb">' + ic('cam') + '</span><span>' + U.msgPh + '</span>' + ic('mic') + ic('img') + '</div>';
  }
  if (S.push && S.push.side === 'ig') h += pushHtml();
  el.innerHTML = h;
  var b = $('#igb'); if (b) b.scrollTop = b.scrollHeight;
  shown.ig = seq;
}

/* ---------- Telegram: общие куски ---------- */
function adBlock() { return '<div class="adp"><span class="th">' + art('wardrobe') + '</span><div><b>' + esc(AD.title) + '</b><small>' + U.ad + ' · ' + AD.kind + ' · ' + esc(AD.camp) + '</small></div></div>'; }
function winHtml() {
  if (!S.lead) return '';
  var l = winLeft();
  return '<span class="win' + (l <= 0 ? ' bad' : l <= 2 * H ? ' warn' : '') + '" data-win>' + (l <= 0 ? U.winShut : U.winLeft + ' ' + dur(l)) + '</span>';
}
function statusTxt() { return S.closed ? U.stClosed : S.taken ? U.stWork : U.stNew; }
function takenLine() { return '✋ ' + S.taker + ' ' + (PL === 'ru' && S.taker === ME.name ? U.took : U.tookM) + ' · ' + U.in + ' ' + dsec(S.takeAt - S.t0); }
/* Карточка заявки: kind 'new' — в «Новые заявки», 'pin' — первая в теме, 'feed' — в ленте. */
function card(kind) {
  var first = clientMsgs()[0];
  var h = '<div class="tb in card' + (kind === 'new' && S.cardNew ? ' new' : '') + '"><span class="ct">' + (kind === 'pin' ? ic('pin', 'ic s') + esc(cname()) : '🆕 ' + U.newLead) + '</span>';
  h += adBlock();
  h += '<dl>';
  if (kind !== 'pin') h += '<dt>' + U.sideClient + '</dt><dd>' + esc(cname()) + '</dd>';
  if (kind === 'pin') h += '<dt>IGSID</dt><dd>' + CL.igsid + '</dd>';
  h += '<dt>' + U.status + '</dt><dd>' + statusTxt() + '</dd>';
  h += '<dt>' + U.win + '</dt><dd>' + winHtml() + '</dd>';
  h += '<dt>' + U.lang + '</dt><dd>' + D.langName[cLang()] + '</dd>';
  if (kind !== 'new') {
    h += '<dt>' + U.manager + '</dt><dd>' + (S.taken ? S.taker : U.nobody) + '</dd>';
    h += '<dt>' + U.crm + '</dt><dd>' + (S.crm ? S.crm.name + ' № ' + S.crm.no : U.crmNone) + '</dd>';
  }
  h += '</dl>';
  if (kind === 'new' && first) h += '<div class="q">' + esc(first.t) + '</div>';
  if (S.taken && kind !== 'pin') h += '<div class="took">' + takenLine() + '</div>';
  h += '<span class="tm">' + hm(S.t0) + '</span></div>';
  /* кнопки под карточкой */
  var kb = [];
  if (kind === 'new') {
    if (!S.taken) kb.push('<button class="w" data-act="take" data-hint="take">' + U.take + '</button>');
    else if (S.role === 'mgr') kb.push('<button class="w" data-act="opentopic">' + U.openTopic + ' →</button>');
  } else {
    if (!S.taken) kb.push('<button class="w" data-act="take" data-hint="take">' + U.takeWork + '</button>');
    if (!S.crm) kb.push('<button data-act="crm" data-hint="crm">' + U.createLead + '</button>');
    kb.push(S.closed ? '<button data-act="reopen">' + U.reopen + '</button>' : '<button data-act="close" data-hint="close">' + U.closeDlg + '</button>');
    if (kb.length === 2 && S.taken) kb = kb.map(function (b) { return b; });
  }
  if (kb.length) h += '<div class="kb">' + kb.join('') + '</div>';
  return h;
}
function bubble(m, opt) {
  var cls = m.id > shown.tg ? ' new' : '';
  if (m.who === 'bot') return '<div class="svc' + cls + '">' + m.t + '</div>';
  var out = m.who === 'm' || m.who === 'ig';
  var h = '<div class="tb ' + (out ? 'out' : 'in') + cls + '"' + (m.who === 'c' ? ' style="--h:' + hue(CL.name) + '"' : '') + '>';
  if (m.who === 'c' && opt && opt.who) h += '<span class="who">' + esc(cname()) + '</span>';
  if (out) h += '<span class="who" style="--h:' + (m.who === 'ig' ? 330 : 150) + '">' + esc(m.by || ME.name) + '</span>';
  if (m.quote) h += '<span class="quote">' + esc(m.quote) + '</span>';
  if (m.k === 'photo') h += '<div class="media">' + art(m.who === 'c' ? 'room' : 'wardrobe') + '</div>' + (m.t ? esc(m.t) : '');
  else if (m.k === 'voice') h += voice(7);
  else h += esc(m.t);
  h += '<span class="tm' + (out ? ' ok' : '') + '">' + hm(m.at) + (out ? ' ✓✓' : '') + '</span>';
  if (m.who === 'ig') h += '<span class="via">' + ic('ig', 'ic s') + ' ' + U.manualNote + '</span>';
  if (opt && opt.answer && m.who === 'c') h += '<button class="ans" data-act="answer" data-a="' + m.id + '"' + (m.id === lastCid() ? ' data-hint="answer"' : '') + '>' + U.answer + '</button>';
  return h + '</div>';
}
function lastCid() { var c = clientMsgs(); return c.length ? c[c.length - 1].id : 0; }
function hdr(title, sub, back, avh) {
  return '<div class="tg-h">' + (back ? '<button class="ib" data-act="tgback" aria-label="back">' + ic('back') + '</button>' : '<span class="ib">' + ic('menu') + '</span>') + (avh || '') + '<div><b>' + title + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</div>' + (back ? '<span class="ib">' + ic('dots') + '</span>' : '<span class="ib">' + ic('search') + '</span>') + '</div>';
}
function pushHtml() {
  var p = S.push;
  return '<button class="push" data-act="pushgo">' + p.av + '<div><b>' + esc(p.t) + '</b><span>' + esc(p.d) + '</span></div><small>' + U.push + '</small></button>';
}
function composer(enabled, ph) {
  var h = '<div class="tfoot">';
  if (enabled) h += '<div class="tools"><button data-act="qsheet" data-hint="reply">' + ic('bolt') + U.quick + '</button><button data-act="photo">' + ic('img') + U.photo + '</button><button data-act="voice">' + ic('mic') + U.voice + '</button></div>';
  if (S.scheme === 'C' && S.reply && enabled) h += '<div class="rbar">↩ <span><b>' + U.replyTo + '</b> · ' + esc(cname()) + '</span></div>';
  h += '<form class="tin" data-form="send"><span class="ib">' + ic('clip') + '</span><input name="t" autocomplete="off" placeholder="' + esc(ph || U.composer) + '"' + (enabled ? '' : ' disabled') + '><button class="sendb" type="submit" aria-label="send"' + (enabled ? '' : ' disabled') + '>' + ic('send') + '</button></form></div>';
  return h;
}
function sheetHtml() {
  if (!S.sheet) return '';
  var h = '<div class="dim" data-act="sheetx"></div><div class="sheet">';
  if (S.sheet === 'quick') {
    var tab = S.qtab || cLang();
    h += '<h4>' + U.quick + '</h4><div class="tabs">' + D.langs.map(function (l) { return '<button data-act="qtab" data-a="' + l + '" class="' + (l === tab ? 'on' : '') + '">' + D.langName[l] + (l === cLang() ? ' · ' + U.quickLang : '') + '</button>'; }).join('') + '</div><div class="list">';
    h += D.quick.map(function (q, i) { return '<button class="qi" data-act="qr" data-i="' + i + '" data-a="' + tab + '"' + (i === 0 ? ' data-hint="qr"' : '') + '><b>' + q.title + '</b>' + esc(q[tab]) + '</button>'; }).join('') + '</div>';
  } else {
    h += '<h4>' + U.crmPick + '</h4><div class="list">' + D.crms.map(function (c, i) { return '<button class="crm" data-act="crmpick" data-i="' + i + '"' + (i === 0 ? ' data-hint="crmpick"' : '') + '>' + ic('chart') + c.name + '</button>'; }).join('') + '</div>';
  }
  return h + '<button class="x" data-act="sheetx">' + U.cancel + '</button></div>';
}

/* ---------- Telegram: экраны ---------- */
function others(by) { return D.others.filter(function (o) { return !by || o.by === by; }); }
function topicRow(name, user, last, time, unread, act, hint, closed) {
  return '<button class="chat" ' + act + (hint ? ' data-hint="' + hint + '"' : '') + '><span class="topic-i" style="background:hsl(' + hue(name) + ' 55% 52%)">' + esc(name[0]) + '</span><div><div class="l1"><b>' + esc(name + ' · @' + user) + '</b><small>' + time + '</small></div><div class="l2"><span>' + (closed ? '<span class="closed-l">✅ </span>' : '') + esc(last) + '</span>' + (unread ? '<span class="badge">' + unread + '</span>' : '') + '</div></div></button>';
}
function myTopicRow(hint) {
  var last = S.msgs.filter(function (m) { return m.who !== 'bot'; }).pop();
  var unread = clientMsgs().filter(function (m) { return m.at > (S.readAt || 0); }).length;
  var lt = last ? (last.k === 'photo' ? '🖼' : last.k === 'voice' ? '🎤' : '') + ' ' + (last.who === 'c' ? '' : (last.by || ME.name) + ': ') + (last.t || '') : '';
  return topicRow(CL.name, CL.user, lt, last ? hm(last.at) : '', S.tg === 'topic' ? 0 : unread, 'data-act="opentopic"', hint, S.closed);
}
function listScreen() {
  var head = S.role === 'head', rows = [], h = hdr('Telegram', '', false);
  h += '<div class="tsearch">' + ic('search') + '<input data-input="q" value="' + esc(S.q) + '" placeholder="' + esc(U.search) + '"></div><div class="body" id="tgb">';
  if (S.q) {
    var q = S.q.toLowerCase(), all = [{ name: CL.name, user: CL.user, me: true, last: (clientMsgs()[0] || {}).t || '' }].filter(function () { return S.lead; }).concat(D.others.map(function (o) { return { name: o.name, user: o.user, last: o.last, ago: o.ago }; }));
    var hit = all.filter(function (o) { return (o.name + ' ' + o.user).toLowerCase().indexOf(q.replace(/^@/, '')) >= 0; });
    h += '<div class="sep">' + U.clients + '</div>';
    h += hit.length ? hit.map(function (o) { return o.me ? myTopicRow() : topicRow(o.name, o.user, o.last, o.ago, 0, 'data-act="other"'); }).join('') : '<p class="sep" style="background:none;color:#999">' + U.searchNone + '</p>';
    return h + '</div>';
  }
  var unNew = S.lead && !S.taken ? 1 : 0;
  var grpLast = S.lead ? (S.taken ? takenLine() : '🆕 ' + CL.name + ': ' + (clientMsgs()[0] || {}).t) : others()[0].name + ': ' + others()[0].last;
  if (head) {
    rows.push(chatRow('forum', U.grpHub, (S.lead ? CL.name + ': ' + lastText() : D.others[0].name + ': ' + D.others[0].last), S.lead ? hm(lastAt()) : '11:42', S.lead && !S.readHead ? 1 : 0, '#', 'open'));
    rows.push(chatRow('head', U.summary, U.summaryLast, '18:00', 0, '📊'));
  } else if (S.scheme === 'A') {
    rows.push(chatRow('forum', U.grpHub, S.lead ? CL.name + ': ' + lastText() : D.others[0].name + ': ' + D.others[0].last, S.lead ? hm(lastAt()) : '11:42', S.lead ? Math.max(1, unreadAll()) : 0, '#', 'open'));
  } else if (S.scheme === 'B') {
    rows.push(chatRow('group', U.grpNew, grpLast, S.lead ? hm(S.taken ? S.takeAt : S.t0) : '11:40', unNew, '🆕', 'open'));
    rows.push(chatRow('bot', U.botHub + ' · ' + CO.name, S.taken ? CL.name + ': ' + lastText() : U.bot, S.taken ? hm(lastAt()) : '', S.taken ? unreadAll() : 0, 'H', S.taken ? 'open' : ''));
  } else {
    rows.push(chatRow('lenta', U.botHub + ' · ' + CO.name, S.lead ? CL.name + ': ' + lastText() : D.others[0].name + ': ' + D.others[0].last, S.lead ? hm(lastAt()) : '11:42', S.lead ? Math.max(1, unreadAll()) : 0, 'H', 'open'));
  }
  rows.push(chatRow('x', U.team, U.teamLast, '11:20', 0, 'T'));
  rows.push(chatRow('x', U.shop, U.shopLast, '10:02', 0, 'S'));
  return h + rows.join('') + '</div>';
}
function lastText() { var m = S.msgs.filter(function (x) { return x.who !== 'bot'; }).pop(); return m ? (m.k === 'photo' ? '🖼' : m.k === 'voice' ? '🎤 ' + U.voiceMsg : m.t) : ''; }
function lastAt() { var m = S.msgs[S.msgs.length - 1]; return m ? m.at : now(); }
function unreadAll() { return clientMsgs().filter(function (m) { return m.at > (S.readAt || 0); }).length; }
function chatRow(id, name, last, time, unread, mark, hint) {
  var a = id === 'x' ? 'data-act="noop"' : 'data-act="open" data-a="' + id + '"';
  var avh = '<span class="av" style="--h:' + hue(name) + '">' + esc(mark === '#' ? name[0] : mark) + '</span>';
  return '<button class="chat" ' + a + (hint && unread ? ' data-hint="open"' : hint && S.taken && id === 'bot' ? ' data-hint="open"' : hint && id === 'forum' && S.lead ? ' data-hint="open"' : '') + '>' + avh + '<div><div class="l1"><b>' + esc(name) + '</b><small>' + time + '</small></div><div class="l2"><span>' + esc(last) + '</span>' + (unread ? '<span class="badge">' + unread + '</span>' : '') + '</div></div></button>';
}
function groupScreen() {
  var h = hdr(U.grpNew, U.members, true) + '<div class="body wall" id="tgb"><div class="msgs"><div class="svc">' + U.today + '</div>';
  others().slice(0, 3).reverse().forEach(function (o) {
    var mg = D.managers.filter(function (m) { return m.id === o.by; })[0];
    h += '<div class="tb in card"><span class="ct">🆕 ' + U.newLead + '</span><dl><dt>' + U.sideClient + '</dt><dd>' + esc(o.name + ' · @' + o.user) + '</dd></dl><div class="q">' + esc(o.last) + '</div><div class="took">✋ ' + mg.name + '</div><span class="tm">' + o.ago + '</span></div>';
  });
  if (S.lead) { h += card('new'); S.remind && !S.taken && (h += '<div class="svc">' + U.remindNew + '</div>'); }
  return h + '</div></div>' + composer(false, U.grpNew);
}
function botScreen() {
  var h = hdr(U.botHub + ' · ' + CO.name, U.bot + ' · ' + (others('me').length + (S.taken ? 1 : 0)) + ' ' + U.topicsN, true) + '<div class="body" id="tgb">';
  if (S.taken) h += myTopicRow('topic');
  others('me').forEach(function (o) { h += topicRow(o.name, o.user, o.last, o.ago, 0, 'data-act="other"'); });
  return h + '</div>';
}
function forumScreen() {
  var h = hdr(U.grpHub, (D.others.length + (S.lead ? 1 : 0)) + ' ' + U.topicsN + ' · ' + U.members, true) + '<div class="body" id="tgb">';
  if (S.lead) h += myTopicRow('topic');
  D.others.forEach(function (o) { h += topicRow(o.name, o.user, o.last, o.ago, 0, 'data-act="other"'); });
  return h + '</div>';
}
function topicScreen() {
  S.readAt = now(); if (S.role === 'head') S.readHead = true;
  var sub = (S.from === 'forum' ? U.grpHub : U.botHub + ' · ' + CO.name);
  var h = hdr(esc(cname()), sub, true, '<span class="topic-i" style="width:36px;height:36px;background:hsl(' + hue(CL.name) + ' 55% 52%)">' + CL.name[0] + '</span>') + '<div class="body wall" id="tgb"><div class="msgs">';
  h += card('pin');
  h += '<div class="svc">' + U.renamed + ' «' + esc(cname()) + '»</div>';
  S.msgs.forEach(function (m) { h += bubble(m, { who: true }); });
  h += '</div></div>';
  var can = (S.taken || S.role === 'head') && !S.closed;
  return h + composer(can, S.closed ? U.closed : can ? U.composer : U.composerOff) + sheetHtml();
}
function lentaScreen() {
  var h = hdr(U.botHub + ' · ' + CO.name, U.bot, true) + '<div class="body wall" id="tgb"><div class="msgs"><div class="svc">' + U.today + '</div>';
  others().slice(0, 2).reverse().forEach(function (o) {
    h += '<div class="tb in"><span class="who" style="--h:' + hue(o.name) + '">' + esc(o.name + ' · @' + o.user) + '</span>' + esc(o.last) + '<span class="tm">' + o.ago + '</span></div>';
  });
  if (S.lead) {
    h += card('feed');
    S.msgs.forEach(function (m) { h += bubble(m, { who: true, answer: true }); });
  }
  h += '</div></div>';
  var can = S.lead && (S.taken || S.role === 'head') && !S.closed;
  return h + composer(can && S.reply, !S.lead ? U.composer : !S.taken ? U.composerOff : S.reply ? U.composer : U.pickReply) + sheetHtml();
}
function headScreen() {
  var t = S.taken ? (S.takeAt - S.t0) : 0, took = D.managers.map(function (m) { return { name: m.name, took: m.took + (m.id === 'me' && S.taken && S.taker === ME.name ? 1 : 0), first: m.first }; });
  var total = took.reduce(function (s, m) { return s + m.took; }, 0) + (S.lead && !S.taken ? 1 : 0);
  var avg = Math.round(took.reduce(function (s, m) { return s + m.first * m.took; }, 0) / took.reduce(function (s, m) { return s + m.took; }, 0) * 1000);
  var max = Math.max.apply(null, D.ads.map(function (a) { return a.n + 1; }));
  var h = hdr(U.summary, U.bot, true) + '<div class="body" id="tgb"><div class="head">';
  h += '<div class="hd-k"><div><b>' + total + '</b><small>' + U.hdLeads + ', ' + U.hdToday.toLowerCase() + '</small></div><div><b>' + (S.lead && !S.taken ? 1 : 0) + '</b><small>' + U.hdWait + '</small></div><div><b>' + Math.round(avg / MIN) + ' ' + U.m + '</b><small>' + U.hdFirst + '</small></div></div>';
  h += '<div class="hd-s"><h5>' + U.hdWaitNow + '</h5>' + (S.lead && !S.taken ? '<div class="hd-row"><span>' + esc(cname()) + '</span><em class="slow">' + dsec(now() - S.t0) + '</em></div>' : '<p class="hd-note">' + U.hdNone + '</p>') + '</div>';
  h += '<div class="hd-s"><h5>' + U.hdWho + '</h5>' + took.map(function (m) { return '<div class="hd-row"><span>' + m.name + '</span><em>' + U.hdTook + ' ' + m.took + '</em><em class="' + (m.first > 600 ? 'slow' : '') + '">' + U.hdResp + ' ' + dsec(m.first * 1000) + '</em></div>'; }).join('') + (S.taken ? '<p class="hd-note">' + esc(cname()) + ': ' + takenLine() + '</p>' : '') + '</div>';
  h += '<div class="hd-s"><h5>' + U.hdAds + '</h5>' + D.ads.map(function (a, i) { var n = a.n + (i === 0 && S.lead ? 1 : 0); return '<div class="hd-row"><span>' + esc(a.title) + ' <em>· ' + a.kind + '</em></span><span class="bar"><i style="transform:scaleX(' + (n / max).toFixed(2) + ')"></i></span><b>' + n + '</b></div>'; }).join('') + '<div class="hd-row"><span>' + U.hdNoAd + '</span><span class="bar"><i style="transform:scaleX(' + (D.noAd / max).toFixed(2) + ')"></i></span><b>' + D.noAd + '</b></div></div>';
  h += '<p class="hd-note">' + U.hdAll + '</p><button class="btn sm" data-act="open" data-a="forum">' + U.hdOpen + '</button>';
  return h + '</div></div>';
}
function renderTg() {
  var el = $('#tg'), h;
  switch (S.tg) {
    case 'group': h = groupScreen(); break;
    case 'bot': h = botScreen(); break;
    case 'forum': h = forumScreen(); break;
    case 'topic': h = topicScreen(); break;
    case 'lenta': h = lentaScreen(); break;
    case 'head': h = headScreen(); break;
    default: h = listScreen();
  }
  if (S.push && S.push.side === 'tg') h += pushHtml();
  var focus = document.activeElement && document.activeElement.getAttribute('data-input') === 'q';
  el.innerHTML = h;
  S.cardNew = false;
  var b = $('#tgb'); if (b && S.tg !== 'list' && S.tg !== 'head' && S.tg !== 'bot' && S.tg !== 'forum') b.scrollTop = b.scrollHeight;
  if (focus) { var i = $('[data-input="q"]', el); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
  shown.tg = seq;
  $('#tgcap').textContent = S.role === 'head' ? U.phoneTgHead : U.phoneTg;
}
var shown = { ig: 0, tg: 0 };

/* ---------- путь и подсказки ---------- */
function stepNow() {
  if (!S.lead) return 1;
  if (!S.taken) return 2;
  var mm = S.msgs.filter(function (m) { return m.who === 'm' || m.who === 'ig'; });
  if (!mm.length) return 3;
  var cAfter = clientMsgs().some(function (c) { return c.at >= mm[0].at && c !== clientMsgs()[0]; });
  if (!cAfter) return 4;
  if (!S.closed) return 5;
  return 6;
}
function hintKey() {
  var st = S.step;
  if (st === 1) return { side: 'ig', k: S.ig === 'feed' ? 'cta' : 'ask', t: S.ig === 'feed' ? U.hintCta : U.hintAsk };
  if (st === 2) {
    if (S.role === 'head') return { side: 'tg', k: 'open', t: U.hintOpen };
    if (S.tg === 'list') return { side: 'tg', k: 'open', t: U.hintOpen };
    if (S.tg === 'forum') return { side: 'tg', k: 'topic', t: U.hintTopic };
    return { side: 'tg', k: 'take', t: U.hintTake };
  }
  if (st === 3) {
    if (S.tg === 'topic' || S.tg === 'lenta') {
      if (S.tg === 'lenta' && !S.reply) return { side: 'tg', k: 'answer', t: U.hintReply };
      return { side: 'tg', k: S.sheet === 'quick' ? 'qr' : 'reply', t: U.hintReply };
    }
    if (S.tg === 'list') return { side: 'tg', k: 'open', t: U.hintTopic };
    if (S.tg === 'group') return { side: 'tg', k: 'opentopic', t: U.hintTopic };
    return { side: 'tg', k: 'topic', t: U.hintTopic };
  }
  if (st === 4) return { side: 'ig', k: 'ask', t: U.hintClient };
  if (st === 5) {
    if (S.tg !== 'topic' && S.tg !== 'lenta') return { side: 'tg', k: S.tg === 'list' ? 'open' : 'topic', t: U.hintTopic };
    if (S.sheet === 'crm') return { side: 'tg', k: 'crmpick', t: U.hintCrm };
    return { side: 'tg', k: S.crm ? 'close' : 'crm', t: S.crm ? U.hintClose : U.hintCrm };
  }
  return null;
}
function renderPath() {
  S.step = stepNow();
  $$('#steps li').forEach(function (li) { var n = +li.getAttribute('data-step'); li.className = n < S.step ? 'ok' : n === S.step ? 'on' : ''; });
  var hk = hintKey();
  $('#now').innerHTML = hk ? '<b>' + U.doNow + '</b> ' + hk.t + (MOB.matches && hk.side !== S.side ? ' (' + (hk.side === 'ig' ? U.sideClient : U.sideMgr) + ')' : '') : U.done;
  $('#nowm').innerHTML = $('#now').innerHTML;
  $$('.hint').forEach(function (e) { e.classList.remove('hint'); });
  if (hk) { var el = $('#' + hk.side + ' [data-hint="' + hk.k + '"]'); if (el) el.classList.add('hint'); }
  $$('[data-act="scheme"]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-a') === S.scheme); });
  $$('[data-act="role"]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-a') === S.role); });
  $$('.side-sw button').forEach(function (b) { var s = b.getAttribute('data-a'); b.classList.toggle('on', s === S.side); $('.dot', b).classList.toggle('on', !!S.badge[s] && s !== S.side); });
  $('#stage').setAttribute('data-side', S.side);
}
function render() { $('#stage').setAttribute('data-side', S.side); renderIg(); renderTg(); renderPath(); }
function flag(side) { if (side !== S.side) S.badge[side] = true; }
function push(side, t, d, avh) {
  S.push = { side: side, t: t, d: d, av: avh || av(CO.name, 'sm') };
  later(function () { S.push = null; render(); }, 3800);
}

/* ---------- действия ---------- */
function deliverToIg(m) {
  S.typing = true; renderIg();
  later(function () { S.typing = false; flag('ig'); if (S.ig === 'feed') push('ig', CO.ig, m.t || U.voiceMsg); render(); }, 700);
}
function clientSends(text, k) {
  var first = !S.lead;
  if (S.closed) { S.closed = false; S.status = 'work'; }
  var m = add('c', k || 'text', text);
  if (first) {
    S.lead = true; S.t0 = m.at; S.cardNew = true;
    later(function () {
      flag('tg');
      var where = S.role === 'head' ? U.grpHub : S.scheme === 'B' ? U.grpNew : S.scheme === 'A' ? U.grpHub : U.botHub;
      push('tg', where, '🆕 ' + CL.name + ' · ' + U.fromAd + ': ' + text, av(CL.name, 'sm'));
      render();
    }, 650);
  } else {
    if (S.wasClosed) { add('bot', 'text', U.reopened); S.wasClosed = false; }
    later(function () { flag('tg'); render(); }, 500);
  }
}
function managerSends(k, text, by) {
  var m = add(by === 'ig' ? 'ig' : 'm', k, text, { by: by === 'ig' ? D.head : mgrName() });
  if (S.scheme === 'C' && by !== 'ig') { m.quote = cname(); S.reply = false; later(function () { add('bot', 'text', U.delivered + ' · ' + CL.name); render(); }, 450); }
  S.remind = 0;
  deliverToIg(m);
}
function take() {
  if (S.taken || !S.lead) return;
  S.taken = true; S.takeAt = now(); S.status = 'work'; S.taker = mgrName();
  if (S.scheme === 'B' && S.role === 'mgr') {
    render();
    later(function () { S.from = 'bot'; add('bot', 'text', U.topicNew); S.tg = 'topic'; render(); }, 900);
  }
}
var ACT = {
  cta: function () { S.ig = 'dm'; },
  igback: function () { S.ig = 'feed'; },
  ask: function (a, i) { if (clientMsgs().length) return ACT.creply(a, i); S.cl = a; clientSends(D.ask[a][i]); },
  creply: function (a, i) { clientSends(D.creply[a || cLang()][i]); },
  cphoto: function () { clientSends('', 'photo'); },
  open: function (a) {
    S.tg = a; S.q = '';
    if (a === 'forum') S.from = 'forum';
    if (a === 'lenta') S.readAt = now();
  },
  opentopic: function () {
    if (S.role === 'head' || S.scheme === 'A') S.from = 'forum';
    else if (S.scheme === 'C') { S.tg = 'lenta'; return; }
    else S.from = 'bot';
    S.tg = 'topic'; S.q = '';
  },
  other: function () {},
  noop: function () {},
  tgback: function () {
    S.sheet = null;
    if (S.tg === 'topic') S.tg = S.from === 'forum' ? (S.role === 'head' || S.scheme === 'A' ? 'forum' : 'list') : 'bot';
    else S.tg = 'list';
  },
  take: function () { take(); },
  qsheet: function () { S.sheet = S.sheet === 'quick' ? null : 'quick'; S.qtab = null; },
  qtab: function (a) { S.qtab = a; },
  sheetx: function () { S.sheet = null; },
  qr: function (a, i) { S.sheet = null; managerSends('text', D.quick[i][a]); },
  photo: function () { managerSends('photo', ''); },
  voice: function () { managerSends('voice', ''); },
  answer: function () { S.reply = true; },
  crm: function () { S.sheet = 'crm'; },
  crmpick: function (a, i) { S.sheet = null; S.crm = D.crms[i]; add('bot', 'text', '📋 ' + U.crmMade + ': ' + S.crm.name + ' № ' + S.crm.no + ' · ' + U.crmWhat); },
  close: function () { S.closed = true; S.wasClosed = true; S.status = 'closed'; add('bot', 'text', '✅ ' + U.closed + ' · ' + mgrName()); },
  reopen: function () { S.closed = false; S.wasClosed = false; },
  scheme: function (a) { S.scheme = a; S.role = 'mgr'; S.tg = 'list'; S.sheet = null; S.reply = false; if (MOB.matches) S.side = 'tg'; },
  role: function (a) { S.role = a; S.tg = a === 'head' ? 'head' : 'list'; S.sheet = null; if (MOB.matches) S.side = 'tg'; },
  side: function (a) { S.side = a; S.badge[a] = false; },
  pushgo: function () {
    var p = S.push; S.push = null;
    if (p.side === 'ig') { S.ig = 'dm'; return; }
    if (S.role === 'head') S.tg = 'forum', S.from = 'forum';
    else S.tg = S.scheme === 'B' ? (S.taken ? 'bot' : 'group') : S.scheme === 'A' ? 'forum' : 'lenta';
  },
  ff10: function () {
    S.off += 10 * MIN;
    if (!S.lead) return;
    if (!S.taken) { S.remind = 1; if (S.scheme !== 'B' || S.tg === 'topic') add('bot', 'text', U.remindNew); flag('tg'); push('tg', U.botHub, U.remindNew + ' · ' + U.remindHead); }
    else { var last = S.msgs.filter(function (m) { return m.who !== 'bot'; }).pop(); if (last && last.who === 'c') { add('bot', 'text', U.remindReply + ' · ' + U.remindHead); push('tg', U.botHub, U.remindReply); flag('tg'); } }
  },
  ff22: function () {
    S.off += 22 * H;
    if (S.lead && winLeft() > 0) { add('bot', 'text', U.warn2h); push('tg', U.botHub, U.warn2h); flag('tg'); }
  },
  igManual: function () {
    if (!S.lead) { S.ig = 'dm'; return; }
    managerSends('text', D.manual[cLang()], 'ig'); flag('tg');
  },
  feat: function (a) {
    scrollDemo();
    if (!S.lead) { S.ig = 'dm'; S.cl = D.langs[0]; clientSends(D.ask[D.langs[0]][0]); }
    if (a === 'ad') { S.role = 'mgr'; S.scheme = 'B'; S.tg = S.taken ? 'topic' : 'group'; S.from = 'bot'; }
    if (a === 'ff10') ACT.ff10();
    if (a === 'ff22') { if (!S.taken) take(); S.role = 'mgr'; S.scheme = 'B'; S.from = 'bot'; S.tg = 'topic'; ACT.ff22(); }
    if (a === 'head') ACT.role('head');
    if (a === 'lang') { S.role = 'mgr'; if (!S.taken) take(); S.from = S.scheme === 'A' ? 'forum' : 'bot'; S.tg = S.scheme === 'C' ? 'lenta' : 'topic'; S.sheet = 'quick'; }
    if (a === 'search') { S.role = 'mgr'; S.tg = 'list'; S.q = '@madina'; }
    S.side = 'tg';
  },
  con: function (a) {
    S.con = Math.max(S.con, +a + 1);
    $$('#con li').forEach(function (li, n) { li.className = n < S.con ? 'ok' : n === S.con ? 'on' : ''; });
    $('#conok').hidden = S.con < 4;
    return true;
  },
  play: function () { if (playing) stopPlay(); else startPlay(); return true; },
  reset: function () { stopPlay(); reset(); return true; },
};
function reset() { timers.forEach(clearTimeout); timers = []; var sch = S ? S.scheme : 'B', role = S ? S.role : 'mgr', con = S ? S.con : 0; S = fresh(); S.scheme = sch; S.role = role; S.con = con; S.tg = role === 'head' ? 'head' : 'list'; S.side = 'ig'; render(); }
function act(name, a, i) {
  var f = ACT[name]; if (!f) return;
  var side = S.side;
  if (f(a, i) === true) return;
  /* на телефоне показываем ту сторону, где случилось действие */
  if (MOB.matches && !/^(scheme|role|side|feat|ff10|ff22|igManual)$/.test(name)) {
    var igActs = /^(cta|igback|ask|creply|cphoto)$/;
    S.side = igActs.test(name) ? 'ig' : 'tg';
    if (S.side !== side) S.badge[S.side] = false;
  }
  render();
}

/* ---------- проигрывание пути ---------- */
var playing = false, pt = 0;
function stopPlay() { playing = false; clearTimeout(pt); var b = $('#play'); b.innerHTML = ic('play') + '<span>' + U.play + '</span>'; }
function startPlay() {
  reset(); playing = true;
  var b = $('#play'); b.innerHTML = ic('pause') + '<span>' + U.stop + '</span>';
  var B = S.scheme, head = S.role === 'head', cl = D.langs[PL === 'ru' ? 1 : 0];
  var seqA = [['cta'], ['ask', cl, 0], ['side', 'tg']];
  if (head) seqA.push(['open', 'forum'], ['opentopic'], ['take']);
  else if (B === 'B') seqA.push(['open', 'group'], ['take'], ['wait']);
  else if (B === 'A') seqA.push(['open', 'forum'], ['opentopic'], ['take']);
  else seqA.push(['open', 'lenta'], ['take'], ['answer']);
  seqA.push(['qsheet'], ['qr', cl, 0], ['side', 'ig'], ['creply', cl, 0], ['side', 'tg']);
  if (B === 'C' && !head) seqA.push(['answer']);
  seqA.push(['photo'], ['crm'], ['crmpick', '', 0], ['close']);
  var n = 0;
  (function next() {
    if (!playing) return;
    if (n >= seqA.length) { stopPlay(); return; }
    var s = seqA[n++];
    if (s[0] !== 'wait' && !(s[0] === 'side' && !MOB.matches)) act(s[0], s[1], s[2]);
    pt = setTimeout(next, s[0] === 'side' ? (MOB.matches ? 700 : 0) : 1500);
  })();
}

/* ---------- события ---------- */
document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-act]'); if (!b) return;
  if (b.tagName === 'A') return;
  e.preventDefault();
  if (playing && !/^(play|reset)$/.test(b.getAttribute('data-act')) && e.isTrusted) stopPlay();
  act(b.getAttribute('data-act'), b.getAttribute('data-a'), +(b.getAttribute('data-i') || 0));
  /* кнопка ниже телефонов: показать, что поменялось */
  if (b.hasAttribute('data-scroll')) scrollDemo();
});
document.addEventListener('submit', function (e) {
  var f = e.target.closest('[data-form="send"]'); if (!f) return;
  e.preventDefault();
  var v = f.t.value.trim(); if (!v) return;
  if (S.scheme === 'C' && S.tg === 'lenta' && !S.reply) return;
  managerSends('text', v); render();
});
document.addEventListener('input', function (e) {
  if (e.target.getAttribute('data-input') === 'q') { S.q = e.target.value; renderTg(); }
});
MOB.addEventListener && MOB.addEventListener('change', renderPath);
setInterval(function () { $$('[data-win]').forEach(function (el) { var p = el.parentNode; if (p) { var t = document.createElement('div'); t.innerHTML = winHtml(); p.replaceChild(t.firstChild, el); } }); }, 15000);
function scrollDemo() { var el = MOB.matches ? $('.side-sw') : $('#stage'); window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 80, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }

/* ---------- шапка: прячется при прокрутке, возвращается через 3 с ---------- */
var top = $('#top');
var IDLE=3000,idleT=0;
function headIdle(){if(!top)return;clearTimeout(idleT);
  if(!top.contains(document.activeElement))top.classList.add('hide');
  idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}
function onScroll(){headIdle();}
addEventListener('scroll', onScroll, { passive: true });

/* ---------- стоимость: акция 48 часов с первого открытия ---------- */
var start = Date.now();
try { var s0 = +localStorage.getItem('hb-offer-1'); if (s0 && s0 <= Date.now()) start = s0; else localStorage.setItem('hb-offer-1', String(start)); } catch (e) {}
var fmt = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' $'; };
function price() {
  var left = start + D.plan.hours * H - Date.now(), on = left > 0, base = on ? D.plan.base.promo : D.plan.base.price;
  var sum = base + $$('[data-add]').filter(function (c) { return c.checked; }).reduce(function (s, c) { return s + +c.getAttribute('data-price'); }, 0);
  $('#ptot').textContent = fmt(sum); $('#pbase').textContent = fmt(base); $('#preg').style.display = on ? '' : 'none';
  if (on) { var h = Math.floor(left / H), m = Math.floor(left % H / MIN), s = Math.floor(left % MIN / 1000); $('#offt').textContent = h + ':' + ('0' + m).slice(-2) + ':' + ('0' + s).slice(-2); }
  else $('#offer').innerHTML = ic('clock') + '<span>' + U.offerEnd + '</span>';
}
document.addEventListener('change', function (e) { if (e.target.hasAttribute('data-add')) price(); });
setInterval(price, 1000); price();

reset();
})();
