/* Панель CZECHFARM: одна страница, разделы по адресу после #.
   Права решает сервер; здесь только прячем то, что роль не увидит. */
(function () {
  "use strict";
  var app = document.getElementById("app"), toastEl = document.getElementById("toast"), toastT = 0;
  var M = null, ME = null;
  var LANG_NAME = { ru: "Русский", uz: "O‘zbekcha", en: "English", ar: "العربية" };
  var PAGE_NAME = { home: "Главная", about: "О компании", products: "Продукты", partners: "Партнёрам", investors: "Инвесторам", news: "Новости", contacts: "Контакты", privacy: "Политика данных" };
  var CT_NAME = { phone: "Телефон", email: "Почта", address: "Адрес офиса", social: "Соцсеть (ссылка https://)", map: "Карта: адрес для встраивания (Google «Встроить карту» или Яндекс «Конструктор карт»)" };
  var PROD_F = [["name", "Название *"], ["inn", "Действующее вещество"], ["form", "Форма выпуска и дозировка"], ["pack", "В упаковке"], ["group", "Фармакологическая группа"], ["doctors", "Кому из врачей"], ["maker", "Производитель и страна"], ["dir", "Направление своими словами (если нет в списке)"], ["dose", "Схема приёма (только в панели, на сайт не выходит)"]];
  var AREA_NAME = { neuro: "Неврология и боль", cardio: "Сердце, сосуды и обмен веществ", uro: "Урология и мужское здоровье", women: "Женское здоровье и репродукция", endo: "Эндокринология и кости", care: "Печень, сон и дети" };

  function h(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function dt(ts) { if (!ts) return ""; var d = new Date(ts); return d.toLocaleDateString("ru-RU") + " " + d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }); }
  function toast(t, bad) { toastEl.textContent = t; toastEl.className = "toast" + (bad ? " bad" : ""); toastEl.hidden = false; clearTimeout(toastT); toastT = setTimeout(function () { toastEl.hidden = true; }, 3500); }
  function api(path, body) {
    var o = body === undefined ? { credentials: "same-origin" } : { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", "X-CF": "1" }, body: JSON.stringify(body) };
    return fetch("/api/admin" + path, o).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (r.status === 401 && path !== "/login") { boot(); throw new Error(j.error || "Войдите"); }
        if (!r.ok) throw new Error(j.error || "Ошибка " + r.status);
        return j;
      });
    });
  }
  function fail(e) { toast(e.message || String(e), true); }
  function readFile(input) {
    return new Promise(function (ok, no) {
      var f = input.files && input.files[0]; if (!f) return no(new Error("Выберите файл"));
      var r = new FileReader(); r.onload = function () { ok({ data: r.result, name: f.name }); }; r.onerror = function () { no(new Error("Файл не прочитался")); }; r.readAsDataURL(f);
    });
  }
  function upload(input) { return readFile(input).then(function (f) { return api("/upload", { data: f.data }); }).then(function (j) { return j.url; }); }
  var staff = function () { return ME && ME.role !== "manager"; };

  /* ── Вход ──────────────────────────────────────────────────────── */
  function boot() {
    fetch("/api/admin/state", { credentials: "same-origin" }).then(function (r) { return r.json(); }).then(function (s) {
      if (s.user) { ME = s.user; return api("/meta").then(function (m) { M = m; shell(); route(); }); }
      loginForm(s.setup);
    }).catch(function () { app.textContent = "Сервер не ответил. Обновите страницу."; });
  }
  function loginForm(setup) {
    app.className = "";
    app.innerHTML = '<form class="card login" id="lf"><h1>' + (setup ? "Первый вход" : "Панель CZECHFARM") + "</h1>" +
      (setup ? '<p class="note">Код установки знает тот, кто запускал сайт на сервере. Здесь заводится владелец, остальных он добавит в «Команде».</p><label class="f">Код установки<input name="code" required autocomplete="off"></label><label class="f">Ваше имя<input name="name" required></label>' : "") +
      '<label class="f">Логин<input name="login" required autocomplete="username"></label><label class="f">Пароль' + (setup ? " (от 8 знаков)" : "") + '<input name="pass" type="password" required autocomplete="' + (setup ? "new-password" : "current-password") + '"></label>' +
      '<button class="btn pri" type="submit">' + (setup ? "Создать владельца и войти" : "Войти") + '</button><p class="err" id="le"></p></form>';
    $("#lf").addEventListener("submit", function (e) {
      e.preventDefault(); var f = e.target, b = {}; $$("input", f).forEach(function (i) { b[i.name] = i.value.trim(); });
      api(setup ? "/setup" : "/login", b).then(boot).catch(function (er) { $("#le").textContent = er.message; });
    });
  }

  /* ── Каркас ────────────────────────────────────────────────────── */
  var NAV = [["home", "Сводка"], ["leads", "Обращения"], ["accounts", "Партнёры и клиенты"], ["bc", "Рассылки в бот", "head"], ["products", "Продукты"], ["news", "Новости"], ["cards", "Визитки"], ["ir", "Комната инвестора", "head"], ["pages", "Страницы сайта"], ["site", "Сайт и бот"], ["connect", "Подключения"], ["team", "Команда"], ["log", "История", "head"]];
  /* Значки разделов — свои контуры, как в панели Agora (Glassy V7 + CRM). */
  var IC = {
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    leads: '<path d="M4 5h16v11H8l-4 4z"/><path d="M8 10h8M8 13h5"/>',
    accounts: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.8c1.7.8 2.7 2.5 3 5.2"/>',
    bc: '<path d="M3 10v4l11 5V5z"/><path d="M14 8.5a4 4 0 0 1 0 7M7 15l1.5 5h3l-1-4"/>',
    products: '<rect x="4" y="9" width="16" height="12" rx="2"/><path d="M8 9V6a4 4 0 0 1 8 0v3M12 12.5v5M9.5 15h5"/>',
    news: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/>',
    ir: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    pages: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 13h8M8 16h5"/>',
    site: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z"/>',
    connect: '<path d="M9 7V3M15 7V3M6 7h12v4a6 6 0 0 1-12 0zM12 17v4"/>',
    team: '<circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4.2 3.9-6.5 8-6.5s7.2 2.3 8 6.5"/>',
    cards: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><circle cx="8" cy="11" r="2.2"/><path d="M4.8 16c.5-1.7 1.7-2.6 3.2-2.6s2.7.9 3.2 2.6M14 9.5h5M14 12.5h5M14 15.5h3"/>',
    log: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    out: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 8l-4 4 4 4M6 12h10"/>',
    web: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    go: '<path d="M7 17L17 7M9 7h8v8"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>'
  };
  function ic(k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (IC[k] || "") + "</svg>"; }
  function shell() {
    app.className = "";
    var first = String(ME.name || "").trim().charAt(0).toUpperCase() || "C";
    app.innerHTML = '<div class="shell"><nav class="side glass" id="side"><a class="brand" href="#home"><img class="bmk" src="/admin/eagle.svg" alt="" width="34" height="34"><span>CZECHFARM<small>ALLIANCE · ПАНЕЛЬ</small></span></a>' +
      NAV.filter(function (n) { return !n[2] || staff(); }).map(function (n) { return '<a href="#' + n[0] + '" data-s="' + n[0] + '">' + ic(n[0]) + "<span>" + n[1] + "</span>" + (n[0] === "leads" ? '<span class="n" id="nfresh" hidden></span>' : "") + "</a>"; }).join("") +
      '<a class="web" href="/" target="_blank" rel="noopener">' + ic("web") + "<span>Открыть сайт</span></a></nav>" +
      '<div class="work"><header class="top glass"><button class="btn burger" id="bg" aria-label="Меню">' + ic("menu") + '</button><div class="org"><img src="/admin/eagle.svg" alt="" width="30" height="30"><span><b>CZECHFARM Alliance</b><small>czechfarm.org</small></span></div><span class="sp"></span>' +
      '<div class="me"><span class="av">' + h(first) + '</span><span><b>' + h(ME.name) + "</b><small>" + h(M.roles[ME.role]) + '</small></span><button class="btn ico" id="out" title="Выйти" aria-label="Выйти">' + ic("out") + "</button></div></header>" +
      '<main id="main"></main></div></div>';
    $("#out").addEventListener("click", function () { api("/logout", {}).then(boot); });
    $("#bg").addEventListener("click", function () { $("#side").classList.toggle("open"); });
    window.addEventListener("hashchange", route);
  }
  function route() {
    var hs = location.hash.slice(1) || "home", sec = hs.split("/")[0];
    $$("#side a").forEach(function (a) { if (a.getAttribute("data-s") === (sec === "lead" ? "leads" : sec)) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    $("#side").classList.remove("open");
    var main = $("#main"); main.innerHTML = '<p class="note">Загружаем…</p>';
    var V = { accounts: accounts, bc: broadcasts, home: home, leads: leads, lead: lead, products: products, news: news, ir: ir, cards: cards, pages: pages, site: site, connect: connect, team: team, log: logV }[sec] || home;
    Promise.resolve(V(main, hs.split("/")[1])).catch(fail);
    api("/summary").then(function (s) { var n = $("#nfresh"); if (n) { n.hidden = !s.fresh; n.textContent = s.fresh; } }).catch(function () {});
  }
  function head(main, title, extra, sub) { main.innerHTML = '<div class="row hd"><div><h1>' + title + "</h1>" + (sub ? '<p class="lead">' + sub + "</p>" : "") + '</div><span class="sp"></span>' + (extra || "") + "</div><div id='body'></div>"; return $("#body", main); }

  /* ── Сводка ────────────────────────────────────────────────────── */
  function home(main) {
    return api("/summary").then(function (s) {
      var hr = new Date().getHours(), hi = hr < 5 ? "Доброй ночи" : hr < 12 ? "Доброе утро" : hr < 18 ? "Добрый день" : "Добрый вечер";
      var b = head(main, hi + ", " + h(String(ME.name || "").split(" ")[0]), "", "Что пришло с сайта и из бота, и что ждёт решения.");
      b.innerHTML = '<div class="grid g4">' + [["Новые обращения", s.fresh, "leads", "ждут ответа"], ["Без ответственного", s.noOwner, "team", "никто не взял"], ["За сутки", s.day, "log", "обращений"], ["За неделю", s.week, "ir", "обращений"]].map(function (x, i) { return '<a class="card stat k' + (i ? "" : " hot") + '" href="#leads"><i>' + ic(x[2]) + "</i><span>" + x[0] + "</span><b>" + x[1] + "</b><small>" + x[3] + "</small></a>"; }).join("") + "</div>" +
        (s.fresh || s.noOwner ? '<a class="card crm k" href="#leads"><i>' + ic("leads") + "</i><span><b>" + s.fresh + "</b> новых, <em>" + s.noOwner + ' без ответственного</em></span><span class="go">' + ic("go") + "</span></a>" : "") +
        "<h2>Темы за неделю</h2><div class='card'>" + Object.keys(s.byKind).filter(function (k) { return s.byKind[k]; }).map(function (k) { return h(M.kinds[k]) + ": <b>" + s.byKind[k] + "</b>"; }).join(" · ") + (Object.keys(s.byKind).some(function (k) { return s.byKind[k]; }) ? "" : '<span class="note">Обращений за неделю не было</span>') + "</div>" +
        "<h2>На сайте</h2><div class='card'>Продуктов опубликовано: <b>" + s.products + "</b> · новостей: <b>" + s.news + "</b></div>" +
        (s.todo.length ? "<h2>Что осталось сделать</h2><div class='card'><ul>" + s.todo.map(function (t) { return "<li>" + h(t) + "</li>"; }).join("") + "</ul></div>" : "");
    });
  }

  /* ── Обращения ─────────────────────────────────────────────────── */
  var lf = { status: "", kind: "", q: "" };
  function leads(main) {
    var b = head(main, "Обращения");
    b.innerHTML = '<div class="row"><select class="i" id="fs"><option value="">Все статусы</option>' + Object.keys(M.status).map(function (k) { return '<option value="' + k + '"' + (lf.status === k ? " selected" : "") + ">" + h(M.status[k]) + "</option>"; }).join("") + '</select><select class="i" id="fk"><option value="">Все темы</option>' + Object.keys(M.kinds).filter(function (k) { return staff() || k !== "investor"; }).map(function (k) { return '<option value="' + k + '"' + (lf.kind === k ? " selected" : "") + ">" + h(M.kinds[k]) + "</option>"; }).join("") + '</select><input class="i" id="fq" placeholder="Номер, имя, почта, текст" value="' + h(lf.q) + '"></div><div id="lt"><p class="note">Загружаем…</p></div>';
    function load() {
      api("/leads?status=" + encodeURIComponent(lf.status) + "&kind=" + encodeURIComponent(lf.kind) + "&q=" + encodeURIComponent(lf.q)).then(function (j) {
        $("#lt").innerHTML = j.leads.length ? '<table class="resp"><thead><tr><th>Номер</th><th>Когда</th><th>Тема</th><th>Кто</th><th>Статус</th><th>Ответственный</th></tr></thead><tbody>' + j.leads.map(function (l) {
          return '<tr class="click" data-id="' + l.id + '"><td><b>' + h(l.no) + "</b></td><td>" + dt(l.at) + "</td><td>" + h(l.kindName) + "</td><td>" + h([l.name, l.org].filter(Boolean).join(", ")) + '<br><span class="note">' + h(l.email || l.phone) + '</span></td><td><span class="pill ' + l.status + '">' + h(l.statusName) + "</span></td><td>" + (h(l.owner) || '<span class="note">никто</span>') + "</td></tr>";
        }).join("") + "</tbody></table>" : '<div class="card note">Обращений нет.</div>';
        $$("#lt tr[data-id]").forEach(function (tr) { tr.addEventListener("click", function () { location.hash = "lead/" + tr.getAttribute("data-id"); }); });
      }).catch(fail);
    }
    $("#fs").addEventListener("change", function (e) { lf.status = e.target.value; load(); });
    $("#fk").addEventListener("change", function (e) { lf.kind = e.target.value; load(); });
    var qt = 0; $("#fq").addEventListener("input", function (e) { lf.q = e.target.value.trim(); clearTimeout(qt); qt = setTimeout(load, 300); });
    load();
  }
  function lead(main, id) {
    return api("/leads/" + id).then(function (l) { drawLead(main, l); });
  }
  function drawLead(main, l) {
    var b = head(main, "Обращение " + h(l.no), '<a class="btn" href="#leads">← Все обращения</a>');
    var info = [["Тема", l.kindName], ["Когда", dt(l.at)], ["Откуда", l.src === "bot" ? "Telegram-бот" : "сайт · " + (PAGE_NAME[l.page] || l.page) + " · " + (LANG_NAME[l.lang] || l.lang)], ["Имя", l.name], ["Организация", l.org], ["Страна", l.country], ["Почта", l.email ? { html: '<a href="mailto:' + h(l.email) + '">' + h(l.email) + "</a>" } : ""], ["Телефон", l.phone ? { html: '<a href="tel:' + h(l.phone.replace(/[^\d+]/g, "")) + '">' + h(l.phone) + "</a>" } : ""]];
    /* Имя, организация, страна и поля формы пишет посетитель: только текстом. Разметка — лишь у ссылок выше. */
    Object.keys(l.extra || {}).forEach(function (k) { info.push([k, l.extra[k]]); });
    b.innerHTML = '<div class="grid g2"><div class="card"><div class="hist">' + info.filter(function (x) { return x[1]; }).map(function (x) { return "<div><span class='note'>" + h(x[0]) + "</span><span>" + (typeof x[1] === "object" ? x[1].html : h(x[1])) + "</span></div>"; }).join("") + "</div>" + (l.msg ? '<h2>Сообщение</h2><p>' + h(l.msg).replace(/\n/g, "<br>") + "</p>" : "") + "</div>" +
      '<div class="card grid"><label class="f">Статус (клиент видит его на сайте в «Мои обращения»)<select id="ls">' + Object.keys(M.status).map(function (k) { return '<option value="' + k + '"' + (l.status === k ? " selected" : "") + ">" + h(M.status[k]) + "</option>"; }).join("") + "</select></label>" +
      '<div class="row"><span>Ответственный: <b>' + (h(l.owner) || "никто") + "</b></span>" + (l.owner_id === ME.id ? "" : '<button class="btn" id="take">Взять себе</button>') + "</div>" +
      (staff() ? '<label class="f">Назначить<select id="lo"><option value="">никто</option>' + M.users.map(function (u) { return '<option value="' + u.id + '"' + (l.owner_id === u.id ? " selected" : "") + ">" + h(u.name) + "</option>"; }).join("") + "</select></label>" : "") +
      '<label class="f">Заметка для команды (клиент её не видит)<textarea id="ln">' + h(l.note) + '</textarea></label><div class="row"><button class="btn pri" id="lsave">Сохранить заметку</button><button class="btn" id="lcrm">' + (l.crm_id ? "Отправлено в CRM: № " + h(l.crm_id) + " · ещё раз" : "Отправить в CRM") + "</button></div>" + (l.crm_err ? '<p class="err">CRM: ' + h(l.crm_err) + "</p>" : "") + "</div></div>" +
      (l.tg_chat ? '<h2>Переписка в Telegram</h2><div class="card grid">' + (l.msgs.length ? l.msgs.map(function (m) { return '<div class="msg ' + m.dir + '"><span class="note">' + h(m.who) + " · " + dt(m.at) + "</span><br>" + h(m.text).replace(/\n/g, "<br>") + "</div>"; }).join("") : '<p class="note">Сообщений нет</p>') + '<label class="f">Ответ клиенту в бот<textarea id="lr"></textarea></label><div class="row"><button class="btn pri" id="lrs">Отправить</button></div></div>' : "") +
      '<h2>История</h2><div class="card hist">' + l.history.map(function (x) { return "<div><span class='note'>" + dt(x.at) + "</span><span>" + h(x.who) + ": " + h(x.t) + "</span></div>"; }).join("") + "</div>";
    function save(body) { return api("/leads/" + l.id, body).then(function (n) { drawLead(main, n); toast("Сохранено"); }).catch(fail); }
    $("#ls").addEventListener("change", function (e) { save({ status: e.target.value }); });
    $("#take") && $("#take").addEventListener("click", function () { save({ take: true }); });
    $("#lo") && $("#lo").addEventListener("change", function (e) { save({ owner: e.target.value }); });
    $("#lsave").addEventListener("click", function () { save({ note: $("#ln").value }); });
    $("#lcrm").addEventListener("click", function () { api("/leads/" + l.id + "/crm", {}).then(function () { toast("Ушло в CRM"); return lead(main, l.id); }).catch(function (e) { fail(e); lead(main, l.id); }); });
    $("#lrs") && $("#lrs").addEventListener("click", function () { api("/leads/" + l.id + "/reply", { text: $("#lr").value }).then(function (n) { drawLead(main, n); toast("Отправлено клиенту"); }).catch(fail); });
  }

  /* ── Продукты ──────────────────────────────────────────────────── */
  function products(main) {
    return api("/products").then(function (j) {
      var b = head(main, "Продукты", '<button class="btn pri" id="padd">Добавить продукт</button>');
      b.innerHTML = '<div id="phero"></div><p class="note">Карточка появляется в каталоге на сайте после «Опубликовать». Названия и вещества — как в инструкции. ' + (j.translate && j.translate.on ? "Пишите по-русски: при сохранении карточка сама переводится на узбекский, английский и арабский. " : "") + 'Портфель из таблицы компании уже здесь и на сайте: карточку можно править, снять или удалить, удалённая сама не вернётся.</p><div id="pe"></div>' + (j.products.length ? '<table class="resp"><thead><tr><th></th><th>Название</th><th>Вещество</th><th>Направление</th><th>На сайте</th><th></th></tr></thead><tbody>' + j.products.map(function (p) {
        return "<tr><td>" + (p.img ? '<img class="thumb" src="' + h(p.img) + '" alt="">' : "") + "</td><td><b>" + h(p.name) + "</b></td><td>" + h(p.inn) + "</td><td>" + h(AREA_NAME[p.area] || p.dir) + '</td><td><span class="pill ' + (p.pub ? "done" : "off") + '">' + (p.pub ? "опубликован" : "черновик") + '</span></td><td class="row"><button class="btn" data-e="' + p.id + '">Изменить</button><button class="btn" data-p="' + p.id + '">' + (p.pub ? "Снять" : "Опубликовать") + '</button><button class="btn warn" data-d="' + p.id + '">Удалить</button></td></tr>';
      }).join("") + "</tbody></table>" : '<div class="card note">Продуктов пока нет.</div>');
      $("#padd").addEventListener("click", function () { editProduct(main, null); });
      heroBox(main, j);
      $$("[data-e]", b).forEach(function (x) { x.addEventListener("click", function () { editProduct(main, j.products.filter(function (p) { return p.id === +x.getAttribute("data-e"); })[0]); }); });
      $$("[data-p]", b).forEach(function (x) { var p = j.products.filter(function (q) { return q.id === +x.getAttribute("data-p"); })[0]; x.addEventListener("click", function () { api("/products/" + p.id + "/" + (p.pub ? "unpub" : "pub"), {}).then(function () { toast(p.pub ? "Снято с сайта" : "Опубликовано"); products(main); }).catch(fail); }); });
      $$("[data-d]", b).forEach(function (x) { x.addEventListener("click", function () { if (confirm("Удалить продукт совсем?")) api("/products/" + x.getAttribute("data-d") + "/del", {}).then(function () { products(main); }).catch(fail); }); });
    });
  }
  /* Подиумы шапки страницы «Продукты»: какой препарат где стоит. */
  function heroBox(main, j) {
    var box = $("#phero"); if (!box || !j.heroSlots) return;
    var ok = j.products.filter(function (p) { return p.pub && p.img; }), byKey = {};
    j.products.forEach(function (p) { if (p.key) byKey[p.key] = p; });
    var ro = staff() ? "" : " disabled";
    box.innerHTML = '<details class="card grid"' + (j.hero.some(function (x) { return x; }) ? " open" : "") + '><summary><b>Подиумы в шапке страницы «Продукты»</b> <span class="note">какие упаковки стоят на стеклянных подиумах</span></summary>' +
      '<p class="note">Упаковка встаёт на свой подиум по своим пропорциям: высокая не вылезет за край, широкая не свесится. В списке опубликованные продукты с фото. Лучше всего смотрятся упаковки, вырезанные здесь же, в «Фото упаковки».' + (ro ? " Менять может руководитель или владелец." : "") + '</p><div class="grid g2">' +
      j.heroSlots.map(function (s, i) {
        var def = byKey[s.key];
        return '<label class="f">Место ' + (i + 1) + ': ' + h(s.where) + '<select data-hero="' + i + '"' + ro + '><option value="">как было' + (def ? ": " + h(def.name) : "") + "</option>" + ok.map(function (p) { return '<option value="' + p.id + '"' + (j.hero[i] === p.id ? " selected" : "") + ">" + h(p.name) + "</option>"; }).join("") + "</select></label>";
      }).join("") + '</div>' + (ro ? "" : '<div class="row"><button class="btn pri" id="hsave">Сохранить подиумы</button><a class="btn" href="/products" target="_blank" rel="noopener">Открыть страницу</a></div>') + "</details>";
    $("#hsave") && $("#hsave").addEventListener("click", function () {
      var slots = $$("[data-hero]", box).map(function (x) { return x.value ? +x.value : null; });
      api("/hero", { slots: slots }).then(function () { toast("Подиумы сохранены, страница «Продукты» уже с ними"); }).catch(fail);
    });
  }
  function editProduct(main, p) {
    p = p || {}; var box = $("#pe");
    box.innerHTML = '<div class="card grid"><h2>' + (p.id ? "Изменить продукт" : "Новый продукт") + '</h2><div class="grid g2">' + PROD_F.map(function (f) { return '<label class="f">' + f[1] + '<input data-k="' + f[0] + '" value="' + h(p[f[0]]) + '"></label>'; }).join("") +
      '<label class="f">Направление на сайте<select data-k="area"><option value="">не выбрано</option>' + Object.keys(AREA_NAME).map(function (k) { return '<option value="' + k + '"' + (p.area === k ? " selected" : "") + ">" + AREA_NAME[k] + "</option>"; }).join("") + "</select></label>" +
      '<label class="f">Отпуск<select data-k="rx"><option value="">не указано</option><option value="rx"' + (p.rx === "rx" ? " selected" : "") + '>по рецепту</option><option value="otc"' + (p.rx === "otc" ? " selected" : "") + ">без рецепта</option></select></label></div>" +
      '<label class="f">Состав (если отличается от вещества)<textarea data-k="comp">' + h(p.comp) + "</textarea></label>" +
      '<label class="f">Описание (необязательно)<textarea data-k="about">' + h(p.about) + "</textarea></label>" +
      '<div class="grid g2"><label class="f">Инструкция PDF ' + (p.doc ? '(<a href="' + h(p.doc) + '" target="_blank">загружена</a>)' : "") + '<input type="file" accept="application/pdf" id="pdoc"></label><label class="f">Фото упаковки ' + (p.img ? "(загружено)" : "") + '<input type="file" accept="image/jpeg,image/png,image/webp" id="pimg"></label></div>' +
      '<div class="cutbox" id="pcut" hidden><div class="cutst" id="pcst"><span class="cutwait" id="pcw">Готовим вырезку…</span></div><div class="grid">' +
      '<p class="note">Фон убирается прямо в браузере, фото никуда не уходит до «Сохранить». Так упаковка встанет на подиум в каталоге. Снимайте упаковку прямо, целиком, на однотонном столе или стене.</p>' +
      '<label class="chk"><input type="checkbox" id="pcbox" checked> Ровный контур: для коробки, флакона, тубы (белая коробка не станет дырявой)</label>' +
      '<label class="f">Наклон, если упаковка стоит косо<input type="range" id="pcdeg" min="-15" max="15" step="0.5" value="0"></label>' +
      '<label class="chk"><input type="checkbox" id="pcraw"> Без вырезки: фото как есть</label></div></div>' +
      '<div class="row"><button class="btn pri" id="psave">Сохранить</button><button class="btn" id="pcan">Отмена</button><span class="note">Медицинские тексты публикуйте только после согласования с ответственным.</span></div></div>';
    box.scrollIntoView({ behavior: "smooth" });
    $("#pcan").addEventListener("click", function () { box.innerHTML = ""; });
    /* Фото упаковки: вырезка в браузере (cut.js) и показ на подиуме направления. */
    var cut = null, cutJob = null;
    function cutOpts() { return { box: $("#pcbox").checked, deg: +$("#pcdeg").value, raw: $("#pcraw").checked }; }
    function cutDraw() {
      if (!cut) return; var st = $("#pcst"), old = $("canvas", st);
      try { var c = cut.draw(cutOpts()); if (old) old.remove(); st.appendChild(c); $("#pcw").hidden = true; } catch (e) { fail(e); }
    }
    function cutArea() { var a = $("[data-k=area]", box).value || p.area; $("#pcst").className = "cutst" + (AREA_NAME[a] ? " cut-" + a : ""); }
    $("[data-k=area]", box).addEventListener("change", cutArea);
    ["#pcbox", "#pcraw"].forEach(function (k) { $(k).addEventListener("change", cutDraw); });
    $("#pcdeg").addEventListener("input", cutDraw);
    $("#pimg").addEventListener("change", function () {
      var f = this.files[0]; cut = null; if (!f) { $("#pcut").hidden = true; return; }
      if (!window.CFCut) return;
      $("#pcut").hidden = false; cutArea(); var w = $("#pcw"); w.hidden = false; w.textContent = "Готовим вырезку…"; var old = $("canvas", $("#pcst")); if (old) old.remove();
      $("#psave").disabled = true;
      cutJob = window.CFCut.open(f, function (t) { w.textContent = t; }).then(function (c) {
        cut = c; if (c.already) $("#pcbox").checked = false; cutDraw(); $("#psave").disabled = false;
      }, function (e) { $("#psave").disabled = false; w.textContent = "Вырезать не вышло: " + (e.message || e) + ". Сохранится фото как есть."; cut = null; });
    });
    $("#psave").addEventListener("click", function () {
      var d = { doc: p.doc || "", img: p.img || "" }; $$("[data-k]", box).forEach(function (i) { d[i.getAttribute("data-k")] = i.value.trim(); });
      var jobs = [];
      if ($("#pdoc").files.length) jobs.push(upload($("#pdoc")).then(function (u) { d.doc = u; }));
      if ($("#pimg").files.length) jobs.push(cut ? api("/upload", { data: cut.data(cutOpts()) }).then(function (j) { d.img = j.url; }) : upload($("#pimg")).then(function (u) { d.img = u; }));
      $("#psave").disabled = true;
      Promise.all(jobs).then(function () { return api("/products" + (p.id ? "/" + p.id : ""), d); }).then(function (r) { toast("Сохранено." + trSaid(r.tr) + " Чтобы карточка появилась на сайте, нажмите «Опубликовать»", !!(r.tr && r.tr.failed)); products(main); }).catch(function (e) { $("#psave").disabled = false; fail(e); });
    });
  }

  /* ── Новости ───────────────────────────────────────────────────── */
  function news(main) {
    return api("/news").then(function (j) {
      var b = head(main, "Новости", '<button class="btn pri" id="nadd">Написать новость</button>');
      NEWS_TR = j.translate;
      b.innerHTML = (j.translate && j.translate.on ? '<p class="note">Пишите на русском: при сохранении новость сама переводится на узбекский, английский и арабский. Перевод можно поправить на вкладке языка, поправленное перевод больше не трогает.</p>' : '<p class="note">Текст пишется на каждом языке сайта отдельно; где перевода нет, показываем русский.</p>') + '<div id="ne"></div>' + (j.news.length ? '<table class="resp"><thead><tr><th>Дата</th><th>Заголовок</th><th>Языки</th><th>На сайте</th><th></th></tr></thead><tbody>' + j.news.map(function (n) {
        return "<tr><td>" + dt(n.ts) + "</td><td><b>" + h(n.ru.title) + "</b></td><td>" + M.langs.filter(function (l) { return n[l] && n[l].title; }).join(", ") + '</td><td><span class="pill ' + (n.pub ? "done" : "off") + '">' + (n.pub ? "опубликована" : "черновик") + '</span></td><td class="row"><button class="btn" data-e="' + n.id + '">Изменить</button><button class="btn" data-p="' + n.id + '">' + (n.pub ? "Снять" : "Опубликовать") + '</button><button class="btn warn" data-d="' + n.id + '">Удалить</button></td></tr>';
      }).join("") + "</tbody></table>" : '<div class="card note">Новостей пока нет.</div>');
      $("#nadd").addEventListener("click", function () { editNews(main, null); });
      $$("[data-e]", b).forEach(function (x) { x.addEventListener("click", function () { editNews(main, j.news.filter(function (n) { return n.id === +x.getAttribute("data-e"); })[0]); }); });
      $$("[data-p]", b).forEach(function (x) { var n = j.news.filter(function (q) { return q.id === +x.getAttribute("data-p"); })[0]; x.addEventListener("click", function () { api("/news/" + n.id + "/" + (n.pub ? "unpub" : "pub"), {}).then(function () { toast(n.pub ? "Снято с сайта" : "Опубликовано"); news(main); }).catch(fail); }); });
      $$("[data-d]", b).forEach(function (x) { x.addEventListener("click", function () { if (confirm("Удалить новость совсем?")) api("/news/" + x.getAttribute("data-d") + "/del", {}).then(function () { news(main); }).catch(fail); }); });
    });
  }
  var NEWS_TR = null;
  function editNews(main, n) {
    n = n || {}; var box = $("#ne"), cur = "ru", d = {}; M.langs.forEach(function (l) { d[l] = { title: (n[l] && n[l].title) || "", body: (n[l] && n[l].body) || "" }; });
    var day = new Date(n.ts || Date.now()); var iso = day.getFullYear() + "-" + String(day.getMonth() + 1).padStart(2, "0") + "-" + String(day.getDate()).padStart(2, "0");
    box.innerHTML = '<div class="card grid"><h2>' + (n.id ? "Изменить новость" : "Новая новость") + '</h2><div class="lang-tabs">' + M.langs.map(function (l) { return '<button class="btn" data-l="' + l + '" aria-pressed="' + (l === cur) + '">' + LANG_NAME[l] + (n.auto && n.auto[l] ? " · перевод" : "") + "</button>"; }).join("") + '</div><label class="f">Заголовок<input id="nt"></label><label class="f">Текст<textarea id="nb" rows="8"></textarea></label><div class="grid g2"><label class="f">Дата<input type="date" id="nd" value="' + iso + '"></label><label class="f">Картинка ' + (n.img ? "(загружена)" : "") + '<input type="file" accept="image/jpeg,image/png,image/webp" id="ni"></label></div><div class="row"><button class="btn pri" id="nsave">Сохранить</button><button class="btn" id="ncan">Отмена</button></div></div>';
    function show() { $("#nt").value = d[cur].title; $("#nb").value = d[cur].body; $("#nt").dir = $("#nb").dir = cur === "ar" ? "rtl" : "ltr"; $$("[data-l]", box).forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-l") === cur ? "true" : "false"); }); }
    function keep() { d[cur] = { title: $("#nt").value.trim(), body: $("#nb").value.trim() }; }
    $$("[data-l]", box).forEach(function (b) { b.addEventListener("click", function () { keep(); cur = b.getAttribute("data-l"); show(); }); });
    show(); box.scrollIntoView({ behavior: "smooth" });
    $("#ncan").addEventListener("click", function () { box.innerHTML = ""; });
    $("#nsave").addEventListener("click", function () {
      keep(); var body = { img: n.img || "", ts: new Date($("#nd").value + "T12:00:00").getTime() }; M.langs.forEach(function (l) { body[l] = d[l]; });
      var job = $("#ni").files.length ? upload($("#ni")).then(function (u) { body.img = u; }) : Promise.resolve();
      $("#nsave").disabled = true;
      if (NEWS_TR && NEWS_TR.on) toast("Сохраняем и переводим…");
      job.then(function () { return api("/news" + (n.id ? "/" + n.id : ""), body); }).then(function (r) { toast("Сохранено." + trSaid(r.tr) + " Чтобы новость появилась на сайте, нажмите «Опубликовать»", !!(r.tr && r.tr.failed)); news(main); }).catch(function (e) { $("#nsave").disabled = false; fail(e); });
    });
  }

  /* ── Комната инвестора ─────────────────────────────────────────── */
  function ir(main) {
    return api("/ir").then(function (j) {
      var b = head(main, "Комната инвестора");
      b.innerHTML = '<p class="note">Инвестор получает личную ссылку и видит в ней документы ниже. Каждое открытие пишется в журнал: кто и когда. Закрытая ссылка больше не открывается.</p>' +
        '<h2>Документы</h2><div class="card grid"><div class="grid g2"><label class="f">Название (например, «Презентация компании»)<input id="dt"></label><label class="f">Файл до 50 МБ: PDF, Word, Excel, PowerPoint, OpenDocument, CSV, TXT или фото<input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.rtf,.csv,.txt,.jpg,.jpeg,.png,.webp" id="df"></label></div><div class="row"><button class="btn pri" id="dadd">Добавить документ</button></div>' +
        (j.docs.length ? '<table class="resp"><tbody>' + j.docs.map(function (d) { return "<tr><td><b>" + h(d.title) + '</b><br><span class="note">' + h(d.name) + " · " + (d.size / 1048576).toFixed(1) + " МБ · " + dt(d.at) + '</span></td><td><button class="btn warn" data-dd="' + d.id + '">Удалить</button></td></tr>'; }).join("") + "</tbody></table>" : '<p class="note">Документов пока нет.</p>') + "</div>" +
        '<h2>Ссылки инвесторам</h2><div class="card grid"><div class="grid g4"><label class="f">Кому *<input id="ln"></label><label class="f">Фонд или компания<input id="lo"></label><label class="f">Язык комнаты<select id="ll">' + M.langs.map(function (l) { return '<option value="' + l + '">' + LANG_NAME[l] + "</option>"; }).join("") + '</select></label><div class="row"><button class="btn pri" id="ladd">Выдать ссылку</button></div></div><p id="lnew"></p>' +
        (j.links.length ? '<table class="resp"><thead><tr><th>Кому</th><th>Выдал</th><th>Открывали</th><th></th></tr></thead><tbody>' + j.links.map(function (l) { return "<tr><td><b>" + h(l.name) + "</b>" + (l.org ? ", " + h(l.org) : "") + '<br><span class="note">' + h(l.url) + '</span></td><td>' + h(l.created_by) + "<br>" + dt(l.created_at) + "</td><td>" + l.views + " раз" + (l.last_at ? "<br>последний — " + dt(l.last_at) : "") + '</td><td class="row">' + (l.revoked ? '<span class="pill off">закрыта</span>' : '<button class="btn" data-cp="' + h(l.url) + '">Скопировать</button><button class="btn warn" data-rv="' + h(l.token) + '">Закрыть</button>') + '<button class="btn" data-vw="' + h(l.token) + '">Журнал</button></td></tr>'; }).join("") + "</tbody></table>" : '<p class="note">Ссылок пока нет.</p>') + '<div id="vw"></div></div>';
      $("#dadd").addEventListener("click", function () { var t = $("#dt").value.trim(); $("#dadd").disabled = true; readFile($("#df")).then(function (f) { return api("/ir/docs", { title: t, data: f.data, name: f.name }); }).then(function () { toast("Документ добавлен"); ir(main); }).catch(function (e) { $("#dadd").disabled = false; fail(e); }); });
      $$("[data-dd]", b).forEach(function (x) { x.addEventListener("click", function () { if (confirm("Удалить документ? Инвесторы его больше не увидят.")) api("/ir/docs/" + x.getAttribute("data-dd") + "/del", {}).then(function () { ir(main); }).catch(fail); }); });
      $("#ladd").addEventListener("click", function () { api("/ir/links", { name: $("#ln").value.trim(), org: $("#lo").value.trim(), lang: $("#ll").value }).then(function (r) { ir(main).then(function () { $("#lnew").innerHTML = 'Новая ссылка: <b>' + h(r.url) + "</b> — отправьте её инвестору."; }); }).catch(fail); });
      $$("[data-cp]", b).forEach(function (x) { x.addEventListener("click", function () { navigator.clipboard.writeText(x.getAttribute("data-cp")).then(function () { toast("Ссылка скопирована"); }, function () { toast("Скопируйте ссылку из строки выше", true); }); }); });
      $$("[data-rv]", b).forEach(function (x) { x.addEventListener("click", function () { if (confirm("Закрыть ссылку? Инвестор больше не откроет комнату.")) api("/ir/links/" + x.getAttribute("data-rv") + "/revoke", {}).then(function () { ir(main); }).catch(fail); }); });
      $$("[data-vw]", b).forEach(function (x) { x.addEventListener("click", function () { api("/ir/links/" + x.getAttribute("data-vw")).then(function (v) { $("#vw").innerHTML = "<h2>Журнал открытий</h2>" + (v.views.length ? '<div class="hist">' + v.views.map(function (r) { return "<div><span class='note'>" + dt(r.at) + "</span><span>" + (r.title ? "открыл «" + h(r.title) + "»" : "открыл комнату") + " · " + h(r.ip) + "</span></div>"; }).join("") + "</div>" : '<p class="note">Ещё не открывали.</p>'); }).catch(fail); }); });
    });
  }

  /* ── Страницы сайта: тексты каждого блока и какие блоки показывать ── */
  var PAGE_NAME = { "*": "Шапка, меню и подвал (все страницы)", home: "Главная", about: "О компании", products: "Продукты", partners: "Партнёрам", investors: "Инвесторам", news: "Новости", contacts: "Контакты", privacy: "Политика данных", account: "Кабинет" };
  var LANG_NAME = { ru: "Русский", uz: "Узбекский", en: "Английский", ar: "Арабский" };
  var pgSel = { lang: "ru", page: "home" };
  /* Перевод при сохранении (lib/translate.mjs на сервере). */
  var LANG_IN = { ru: "русский", uz: "узбекский", en: "английский", ar: "арабский" };
  function trSaid(tr) {
    if (!tr) return "";
    if (tr.langs && tr.langs.length) return " Переведено: " + tr.langs.map(function (l) { return LANG_IN[l]; }).join(", ") + "." + (tr.failed ? " Часть перевода не вышла, там текст прежний." : "");
    return tr.failed ? " Перевод не вышел, на других языках текст прежний." : "";
  }
  function trHint(st) { return st && st.on ? '<p class="note">Перевод сам: при сохранении текст переводится на остальные языки сайта (до ' + new Date(st.until).toLocaleDateString("ru-RU", { timeZone: "Asia/Tashkent" }) + '). Язык, поправленный руками, перевод больше не трогает.</p>' : ""; }
  var CB_LAY = { side: "Фото рядом с текстом", grid: "Фото сеткой под текстом", none: "Без фото" };
  function cbPhoto(p, L) { return '<div class="cbp" data-src="' + h(p.src) + '"><img src="' + h(p.src) + '" alt="" loading="lazy"><input class="i" placeholder="Подпись к фото (можно пусто)" value="' + h((p.cap && p.cap[L]) || "") + '"' + (L === "ar" ? ' dir="rtl"' : "") + '><button type="button" class="btn" data-pup title="Выше" aria-label="Поднять фото выше">↑</button><button type="button" class="btn" data-pdel>Убрать</button></div>'; }
  function cbCard(bl, j, off, fresh) {
    var c = bl.custom, L = j.lang, t = (c.t && c.t[L]) || {}, ru = (c.t && c.t.ru) || {}, rtl = L === "ar" ? ' dir="rtl"' : "";
    var f = function (k, name, big, max) { var ph = L !== "ru" && ru[k] ? "по-русски: " + ru[k] : ""; return '<label class="f">' + name + (big ? '<textarea rows="6" maxlength="' + max + '" data-cf="' + k + '"' + rtl + ' placeholder="' + h(ph.slice(0, 160)) + '">' + h(t[k] || "") + "</textarea>" : '<input maxlength="' + max + '" data-cf="' + k + '"' + rtl + ' placeholder="' + h(ph) + '" value="' + h(t[k] || "") + '">') + "</label>"; };
    return '<details class="card pgb cbx" data-cb data-b="' + h(bl.id) + '"' + (bl.canMove ? " data-mv" : "") + (fresh ? " open" : "") + '><summary><b>' + h(fresh ? "Новый блок" : bl.name) + '</b> <span class="note">свой блок' + (c.photos && c.photos.length ? ", фото: " + c.photos.length : "") + (off ? ", скрыт" : "") + "</span>" +
      (bl.canMove ? '<span class="sp"></span><button type="button" class="btn pgm" data-up aria-label="Поднять блок выше" title="Выше">↑</button><button type="button" class="btn pgm" data-down aria-label="Опустить блок ниже" title="Ниже">↓</button>' : "") + "</summary>" +
      (fresh ? "" : '<label class="chk"><input type="checkbox" data-show="' + h(bl.id) + '"' + (off ? "" : " checked") + "> Показывать блок на странице</label>") +
      '<p class="note">Тексты — для языка «' + h(LANG_NAME[L] || L) + '». ' + (j.translate && j.translate.on ? "При сохранении блок сам переводится на остальные языки сайта; язык, поправленный руками, перевод больше не трогает." : "Пока на другом языке поле пустое, там стоит русский текст.") + ' Фото и настройки — общие для всех языков.</p>' +
      (c.auto && c.auto[L] ? '<p class="note"><b>Этот язык переведён автоматически.</b> Поправьте текст и сохраните: дальше перевод его не тронет.</p>' : "") +
      '<div class="grid g2">' + f("sub", "Подзаголовок (маленькая строка над заголовком)", false, 80) + f("title", "Заголовок", false, 160) + "</div>" +
      f("text", "Текст: каждая строка — абзац, строка с «- » — пункт списка", true, 4000) +
      '<div class="grid g2">' + f("btn", "Подпись кнопки (пусто — «Связаться»)", false, 40) + '<label class="f">Фото в блоке<select data-cl>' + Object.keys(CB_LAY).map(function (k) { return '<option value="' + k + '"' + (c.layout === k ? " selected" : "") + ">" + CB_LAY[k] + "</option>"; }).join("") + "</select></label></div>" +
      '<div class="row"><label class="chk"><input type="checkbox" data-cbtn' + (c.btn ? " checked" : "") + '> Кнопка «Связаться» (ведёт на форму в «Контактах»)</label><label class="chk"><input type="checkbox" data-cdark' + (c.dark ? " checked" : "") + '> Тёмный фон</label><label class="chk"><input type="checkbox" data-cmenu' + (c.menu ? " checked" : "") + "> Пункт в меню страницы</label></div>" +
      '<div class="cbps">' + (c.photos || []).map(function (p) { return cbPhoto(p, L); }).join("") + "</div>" +
      '<div class="row"><label class="btn">+ Фото<input type="file" accept="image/jpeg,image/png,image/webp" data-cadd hidden></label><span class="note">До 8 фото, JPG, PNG или WebP до 15 МБ</span><span class="sp"></span><button type="button" class="btn" data-cdel>' + (fresh ? "Отменить" : "Удалить блок") + '</button><button type="button" class="btn pri" data-csave>Сохранить блок</button></div></details>';
  }
  function pages(main) {
    return api("/pages?lang=" + pgSel.lang + "&page=" + encodeURIComponent(pgSel.page)).then(function (j) { drawPages(main, j); });
  }
  function drawPages(main, j) {
    var b = head(main, "Страницы сайта"), hidden = j.hidden.slice(), rtl = j.lang === "ar" ? ' dir="rtl"' : "";
    var site = "/" + (j.lang === "ru" ? "" : j.lang + "/") + (j.page === "home" || j.page === "*" ? "" : j.page);
    b.innerHTML = '<p class="note">Здесь правится любой текст сайта: выберите страницу и язык, поменяйте текст и нажмите «Сохранить» рядом с этим полем (или Enter) — на сайте он сразу. Пустое поле — текст как был. Галочка «Показывать», стрелки порядка и замена картинки сохраняются сами, сразу. Внизу — «Добавить свой блок»: свой раздел с заголовком, текстом, фото и кнопкой. Продукты, новости, контакты и заголовки для поиска правятся в своих разделах.</p>' +
      '<div class="card grid"><div class="grid g2"><label class="f">Страница<select id="pgp">' + ["*"].concat(M.pages).map(function (p) { return '<option value="' + p + '"' + (p === j.page ? " selected" : "") + ">" + h(PAGE_NAME[p] || p) + "</option>"; }).join("") + '</select></label>' +
      '<label class="f">Язык<select id="pgl">' + M.langs.map(function (l) { return '<option value="' + l + '"' + (l === j.lang ? " selected" : "") + ">" + h(LANG_NAME[l] || l) + "</option>"; }).join("") + '</select></label></div>' +
      '<div class="row"><input class="i" id="pgq" placeholder="Найти текст на странице"><span class="sp"></span><a class="btn" href="' + site + '" target="_blank" rel="noopener">Открыть страницу</a></div></div>' +
      (j.blocks.length ? j.blocks.map(function (bl) {
        if (bl.custom) return cbCard(bl, j, hidden.indexOf(bl.id) >= 0);
        var off = hidden.indexOf(bl.id) >= 0, ch = bl.texts.filter(function (t) { return t.val; }).length + bl.images.filter(function (t) { return t.val; }).length;
        return '<details class="card pgb" data-b="' + h(bl.id) + '"' + (bl.canMove ? " data-mv" : "") + (ch || j.blocks.length === 1 ? " open" : "") + '><summary><b>' + h(bl.name) + '</b> <span class="note">текстов: ' + bl.texts.length + (bl.images.length ? ", картинок: " + bl.images.length : "") + (ch ? ", изменено: " + ch : "") + (off ? ", скрыт" : "") + "</span>" +
          (bl.canMove ? '<span class="sp"></span><button type="button" class="btn pgm" data-up aria-label="Поднять блок «' + h(bl.name) + '» выше" title="Выше">↑</button><button type="button" class="btn pgm" data-down aria-label="Опустить блок «' + h(bl.name) + '» ниже" title="Ниже">↓</button>' : "") + "</summary>" +
          bl.images.map(function (im) {
            return '<div class="pgi" data-ih="' + im.h + '" data-def="' + h(im.src) + '" data-v="' + h(im.val) + '"><img src="' + h(im.val || im.src) + '" alt="Картинка блока" loading="lazy"><div class="grid"><span class="note">Картинка блока. Замена встанет на всех языках. Лучше того же формата кадра, JPG, PNG или WebP до 15 МБ.</span><div class="row"><label class="btn">Заменить картинку<input type="file" accept="image/jpeg,image/png,image/webp" hidden></label><button type="button" class="btn" data-iback' + (im.val ? "" : " hidden") + ">Вернуть исходную</button></div></div></div>";
          }).join("") +
          (bl.canHide ? '<label class="chk"><input type="checkbox" data-show="' + h(bl.id) + '"' + (off ? "" : " checked") + "> Показывать блок на странице</label>" : "") +
          '<div class="grid">' + bl.texts.map(function (t) {
            var big = t.def.length > 70;
            return '<div class="f pgt" data-find="' + h((t.def + " " + t.val).toLowerCase()) + '"><span class="pgd"' + rtl + ">" + h(t.def) + '</span><div class="pgr">' + (big ? '<textarea rows="' + Math.min(6, Math.ceil(t.def.length / 80) + 1) + '"' : '<input') + rtl + ' aria-label="' + h(t.def.slice(0, 80)) + '" data-h="' + t.h + '" data-def="' + h(t.def) + '" data-was="' + h(t.val) + '" placeholder="как на сайте сейчас"' + (big ? ">" + h(t.val) + "</textarea>" : ' value="' + h(t.val) + '">') + '<button type="button" class="btn pri pgsv" data-sv disabled>Сохранить</button></div></div>';
          }).join("") + "</div></details>";
      }).join("") : '<div class="card note">На этой странице нет текстов для правки.</div>') +
      (j.page === "*" ? "" : '<div id="cbnew"></div><div class="row"><button type="button" class="btn" id="cbadd"' + (j.customCount >= j.customMax ? " disabled" : "") + '>+ Добавить свой блок</button><span class="note">' + (j.customCount >= j.customMax ? "Своих блоков уже " + j.customMax + ", больше нельзя" : "Свой раздел: заголовок, текст, фото, кнопка. Встанет в конец страницы, дальше его можно поднять стрелками.") + "</span></div>") +
      (j.stale.length ? '<h2>Правки, которые больше не применяются</h2><div class="card grid"><p class="note">Исходный текст на сайте изменился после обновления, поэтому эти правки не видны. Перенесите нужное в блок выше, затем уберите.</p>' + j.stale.map(function (t) { return '<div class="row"><span><span class="note">' + h(t.def) + "</span><br>" + (t.img ? "своя картинка" : h(t.val)) + '</span><span class="sp"></span><button class="btn" data-drop="' + t.h + '" data-def="' + h(t.def) + '">Убрать</button></div>'; }).join("") + "</div>" : "");
    function go() { pgSel = { lang: $("#pgl").value, page: $("#pgp").value }; pages(main).catch(fail); }
    /* Свои блоки: форма у каждого, сохраняется весь список страницы. */
    var cbs = {}; j.blocks.forEach(function (bl) { if (bl.custom) cbs[bl.id] = bl.custom; });
    function cbRead(d) {
      var c = JSON.parse(JSON.stringify(cbs[d.getAttribute("data-b")] || { t: {}, photos: [] })), L = j.lang;
      c.t = c.t || {}; c.t[L] = {}; $$("[data-cf]", d).forEach(function (i) { c.t[L][i.getAttribute("data-cf")] = i.value; });
      c.photos = $$(".cbp", d).map(function (x) { var old = (c.photos || []).filter(function (p) { return p.src === x.getAttribute("data-src"); })[0], cap = old && old.cap ? old.cap : {}; cap[L] = $("input", x).value; return { src: x.getAttribute("data-src"), cap: cap }; });
      c.layout = $("[data-cl]", d).value; c.btn = $("[data-cbtn]", d).checked; c.dark = $("[data-cdark]", d).checked; c.menu = $("[data-cmenu]", d).checked;
      if (!d.getAttribute("data-b")) delete c.id;
      return c;
    }
    function cbSave(drop) {
      var list = $$(".pgb[data-cb]", b).filter(function (d) { return d !== drop; }).map(cbRead);
      var hide = []; $$("[data-show]", b).forEach(function (c) { if (!c.checked) hide.push(c.getAttribute("data-show")); });
      var btn = drop ? null : $("[data-csave]", b), tr = null;
      $$("[data-csave]", b).forEach(function (x) { x.disabled = true; }); if (btn && j.translate && j.translate.on) toast("Сохраняем и переводим…");
      return api("/pages/custom", { lang: j.lang, page: j.page, blocks: list }).then(function (r) { tr = r.tr; return api("/pages", { lang: j.lang, page: j.page, hide: hide }); }).then(function (n) { toast(drop ? "Блок удалён" : "Блок сохранён, на сайте уже видно." + trSaid(tr), !!(tr && tr.failed)); drawPages(main, n); }).catch(function (e) { $$("[data-csave]", b).forEach(function (x) { x.disabled = false; }); fail(e); });
    }
    function cbWire(d) {
      $("[data-csave]", d).addEventListener("click", function () { cbSave(); });
      $("[data-cdel]", d).addEventListener("click", function () { if (!d.getAttribute("data-b")) { d.remove(); return; } if (confirm("Удалить этот блок со всех языков сайта?")) cbSave(d); });
      var inp = $("[data-cadd]", d);
      inp.addEventListener("change", function () {
        if ($$(".cbp", d).length >= 8) { toast("В блоке до 8 фото", true); return; }
        upload(inp).then(function (url) { var w = document.createElement("div"); w.innerHTML = cbPhoto({ src: url, cap: {} }, j.lang); var x = w.firstChild; $(".cbps", d).appendChild(x); cbPhotoWire(x); inp.value = ""; toast("Фото загружено. Нажмите «Сохранить блок»"); }).catch(fail);
      });
      $$(".cbp", d).forEach(cbPhotoWire);
    }
    function cbPhotoWire(x) {
      $("[data-pdel]", x).addEventListener("click", function () { x.remove(); });
      $("[data-pup]", x).addEventListener("click", function () { var p = x.previousElementSibling; if (p) x.parentNode.insertBefore(x, p); });
    }
    $$(".pgb[data-cb]", b).forEach(cbWire);
    var add = $("#cbadd", b);
    if (add) add.addEventListener("click", function () {
      var w = document.createElement("div"); w.innerHTML = cbCard({ id: "", custom: { t: {}, photos: [], layout: "side", btn: true } }, j, false, true);
      var d = w.firstChild; $("#cbnew", b).appendChild(d); cbWire(d); d.open = true; $("[data-cf=title]", d).focus();
    });
    $("#pgp").addEventListener("change", go); $("#pgl").addEventListener("change", go);
    $("#pgq").addEventListener("input", function (e) { var q = e.target.value.trim().toLowerCase(); $$(".pgt", b).forEach(function (x) { x.hidden = !!q && x.getAttribute("data-find").indexOf(q) < 0; }); if (q) $$(".pgb", b).forEach(function (d) { d.open = !!$(".pgt:not([hidden])", d); }); });
    /* Порядок: стрелка меняет блок местами с соседним; на сайт уходит по «Сохранить». */
    $$(".pgm", b).forEach(function (x) { x.addEventListener("click", function (e) {
      e.preventDefault();
      var d = x.closest(".pgb"), up = x.hasAttribute("data-up"), o = up ? d.previousElementSibling : d.nextElementSibling;
      if (!o || !o.hasAttribute("data-mv")) { toast(up ? "Выше некуда: первый блок страницы стоит на месте" : "Это последний блок", true); return; }
      d.parentNode.insertBefore(up ? d : o, up ? o : d); x.focus();
      quick({ order: $$(".pgb[data-mv]", b).map(function (e) { return e.getAttribute("data-b"); }) }, "Порядок блоков сохранён, на сайте уже видно.");
    }); });
    $$(".pgi", b).forEach(function (x) {
      var inp = $("input[type=file]", x), back = $("[data-iback]", x);
      var put = function (v, said) { var im = {}; im[x.getAttribute("data-ih")] = { v: v, def: x.getAttribute("data-def") }; return quick({ images: im }, said); };
      inp.addEventListener("change", function () { upload(inp).then(function (url) { return put(url, "Картинка заменена, на сайте уже видно.").then(function () { x.setAttribute("data-v", url); $("img", x).src = url; back.hidden = false; inp.value = ""; }); }).catch(fail); });
      back.addEventListener("click", function () { put("", "Вернули исходную картинку.").then(function () { x.setAttribute("data-v", ""); $("img", x).src = x.getAttribute("data-def"); back.hidden = true; }).catch(fail); });
    });
    /* Сохранение сразу, без перерисовки: правки в соседних полях не теряются. Перевод — следом. */
    function quick(part, said) {
      var d = { lang: j.lang, page: j.page, quick: true }; Object.keys(part).forEach(function (k) { d[k] = part[k]; });
      return api("/pages", d).then(function (r) {
        toast(said + (r.job ? " Переводим на другие языки…" : ""));
        if (r.job) trWait(r.job, said);
        return r;
      }, function (e) { fail(e); throw e; });
    }
    function trWait(job, said) {
      var n = 0;
      (function ask() { setTimeout(function () {
        api("/pages/tr/" + job).then(function (r) { if (r.pending && ++n < 45) return ask(); if (r.done && r.tr && (r.tr.langs.length || r.tr.failed)) toast(said + trSaid(r.tr), !!r.tr.failed); }).catch(function () {});
      }, 2000); })();
    }
    function send(texts) {
      return api("/pages", { lang: j.lang, page: j.page, texts: texts }).then(function (n) { toast("Сохранено, на сайте уже видно." + trSaid(n.tr), !!(n.tr && n.tr.failed)); drawPages(main, n); }).catch(fail);
    }
    $$("[data-h]", b).forEach(function (i) {
      var btn = i.parentNode.querySelector("[data-sv]");
      var dirty = function () { return i.value.trim() !== i.getAttribute("data-was"); };
      i.addEventListener("input", function () { btn.disabled = !dirty(); });
      var save = function () {
        if (!dirty()) return;
        var t = {}, v = i.value.trim(); t[i.getAttribute("data-h")] = { v: v, def: i.getAttribute("data-def") };
        btn.disabled = true;
        quick({ texts: t }, v ? "Сохранено, на сайте уже видно." : "Вернули текст как был.").then(function () { i.setAttribute("data-was", v); btn.textContent = "Сохранено ✓"; setTimeout(function () { btn.textContent = "Сохранить"; btn.disabled = !dirty(); }, 1800); }, function () { btn.disabled = false; });
      };
      btn.addEventListener("click", save);
      i.addEventListener("keydown", function (e) { if (e.key === "Enter" && (i.tagName === "INPUT" || e.ctrlKey || e.metaKey)) { e.preventDefault(); save(); } });
    });
    $$("[data-show]", b).forEach(function (c) { if (c.closest("[data-cb]")) return; c.addEventListener("change", function () {
      var hide = []; $$("[data-show]", b).forEach(function (x) { if (!x.checked) hide.push(x.getAttribute("data-show")); });
      quick({ hide: hide }, c.checked ? "Блок снова на странице." : "Блок убран со страницы.").catch(function () { c.checked = !c.checked; });
    }); });
    $$("[data-drop]", b).forEach(function (x) { x.addEventListener("click", function () { var t = {}; var k = x.getAttribute("data-drop"), o = { v: "", def: x.getAttribute("data-def") };
      if (k.charAt(0) === "i") { var im = {}; im[k] = o; api("/pages", { lang: j.lang, page: j.page, images: im }).then(function (n) { toast("Убрано"); drawPages(main, n); }).catch(fail); }
      else { t[k] = o; send(t); } }); });
  }

  /* ── Сайт и бот ────────────────────────────────────────────────── */
  function site(main) {
    return api("/site").then(function (j) {
      var b = head(main, "Сайт и бот");
      var ro = staff() ? "" : " disabled";
      var seoKeys = []; if (j.seo) M.langs.forEach(function (l) { M.pages.forEach(function (p) { seoKeys.push(l + ":" + p); }); });
      b.innerHTML = '<h2>Контакты на сайте</h2><div class="card grid"><p class="note">Пустое поле на сайте не показывается.</p><div class="grid g2">' + M.contactKeys.map(function (k) { return '<label class="f">' + CT_NAME[k] + '<input data-c="' + k + '" value="' + h(j.contacts[k]) + '"></label>'; }).join("") + '</div><div class="row"><button class="btn pri" id="csave">Сохранить контакты</button></div></div>' +
        '<h2>Оформление Telegram-бота</h2><div class="card grid">' +
          '<p class="note">' + (j.bot.on ? "Бот @" + h(j.bot.username) + " подключён. " + (j.bot.pushed ? "Оформление в Telegram обновлено " + dt(+j.bot.pushed) + "." : "Оформление ещё не отправлено в Telegram: нажмите кнопку ниже.") : "Бот ещё не подключён: владелец вставляет токен в «Подключениях». Оформление можно подготовить заранее, оно применится при подключении.") + "</p>" +
          '<div class="grid g2"><label class="f">Имя бота (до ' + j.bot.limits.name + ' знаков)<input id="bn" maxlength="' + j.bot.limits.name + '" value="' + h(j.bot.name) + '"' + ro + '></label><label class="f">Строка в профиле бота (до ' + j.bot.limits.about + ' знаков)<input id="ba" maxlength="' + j.bot.limits.about + '" value="' + h(j.bot.about) + '"' + ro + "></label></div>" +
          '<label class="f">Что видит человек до кнопки «Начать» (до ' + j.bot.limits.desc + ' знаков)<textarea id="bd" rows="7" maxlength="' + j.bot.limits.desc + '"' + ro + ">" + h(j.bot.desc) + "</textarea></label>" +
          '<div class="botlook"><div><img src="/protos/chechfarm/bot/hello.jpg" alt="Картинка приветствия" loading="lazy"><label class="chk"><input type="checkbox" id="bc"' + (j.bot.card ? " checked" : "") + ro + "> Показывать картинку в приветствии</label></div>" +
          '<div><img class="av" src="/protos/chechfarm/bot/avatar.jpg" alt="Аватар бота" loading="lazy"><p class="note">Аватар Telegram разрешает поставить только через @BotFather: <a href="/protos/chechfarm/bot/avatar.jpg" download="czechfarm-bot-avatar.jpg">скачайте картинку</a>, напишите @BotFather команду /setuserpic, выберите бота и отправьте её фотографией.</p></div></div>' +
          '<p class="note">Меню команд: ' + j.bot.commands.map(function (c) { return "/" + c[0] + " — " + h(c[1]); }).join(", ") + ". Под строкой ввода у человека кнопки «Частые вопросы», «Написать нам», «Кабинет» и «Сайт».</p>" +
          (staff() ? '<div class="row"><button class="btn pri" id="bsave">Сохранить и отправить в Telegram</button></div>' : "") + "</div>" +
        '<h2>Частые вопросы в Telegram-боте</h2><div class="card grid"><p class="note">Клиент нажимает вопрос или пишет похожими словами — бот отвечает этим текстом. На остальное бот заводит обращение, и вы отвечаете клиенту из панели или ответом в Telegram.</p><div id="fq"></div><div class="row"><button class="btn" id="fadd">Добавить вопрос</button></div>' +
        '<h2>Тексты бота</h2><div class="grid g2">' + Object.keys(j.botTexts).map(function (k) { return '<label class="f">' + ({ hello: "Приветствие", who: "Вопрос «кто вы» (партнёр или клиент)", kindPartner: "Ответ партнёру", kindClient: "Ответ клиенту", taken: "Обращение принято", more: "Клиент дописал", faq: "Заголовок частых вопросов", none: "Вопросов нет", ask: "Ответ на кнопку «Написать нам»" }[k] || k) + '<textarea data-t="' + k + '">' + h(j.botTexts[k]) + "</textarea></label>"; }).join("") + '</div><div class="row"><button class="btn pri" id="fsave">Сохранить вопросы и тексты</button></div></div>' +
        (j.seo ? '<h2>Заголовки страниц для поиска</h2><div class="card grid"><p class="note">Заголовок — до 60 знаков, описание — до 160. Пусто — стоит заголовок из сайта.</p><table class="resp"><thead><tr><th>Страница</th><th>Заголовок</th><th>Описание</th></tr></thead><tbody>' + seoKeys.map(function (k) { var v = j.seo[k] || {}, p = k.split(":"); return "<tr><td>" + PAGE_NAME[p[1]] + '<br><span class="note">' + LANG_NAME[p[0]] + '</span></td><td><input class="i" data-st="' + k + '" maxlength="120" value="' + h(v.t) + '"' + (p[0] === "ar" ? ' dir="rtl"' : "") + '></td><td><textarea class="i" data-sd="' + k + '" maxlength="300"' + (p[0] === "ar" ? ' dir="rtl"' : "") + ">" + h(v.d) + "</textarea></td></tr>"; }).join("") + '</tbody></table><div class="row"><button class="btn pri" id="ssave">Сохранить заголовки</button></div></div>' +
          '<h2>Счётчики и подтверждение сайта</h2><div class="card grid"><div class="grid g2"><label class="f">Яндекс Метрика: номер счётчика<input id="cm" value="' + h(j.counters.metrika) + '"></label><label class="f">Яндекс Вебмастер: код из meta yandex-verification<input id="cy" value="' + h(j.counters.yandex) + '"></label><label class="f">Google Search Console: код из meta google-site-verification<input id="cg" value="' + h(j.counters.google) + '"></label></div><div class="row"><button class="btn pri" id="ksave">Сохранить</button></div></div>' : "");
      var faq = j.faq.map(function (f) { return { q: f.q, a: f.a }; });
      function drawFaq() { $("#fq").innerHTML = faq.map(function (f, i) { return '<div class="grid g2 card"><label class="f">Вопрос<input data-fq="' + i + '" value="' + h(f.q) + '"></label><label class="f">Ответ<textarea data-fa="' + i + '">' + h(f.a) + '</textarea></label><div class="row"><button class="btn warn" data-fx="' + i + '">Убрать</button></div></div>'; }).join("") || '<p class="note">Вопросов пока нет.</p>';
        $$("[data-fq]").forEach(function (x) { x.addEventListener("input", function () { faq[+x.getAttribute("data-fq")].q = x.value; }); });
        $$("[data-fa]").forEach(function (x) { x.addEventListener("input", function () { faq[+x.getAttribute("data-fa")].a = x.value; }); });
        $$("[data-fx]").forEach(function (x) { x.addEventListener("click", function () { faq.splice(+x.getAttribute("data-fx"), 1); drawFaq(); }); }); }
      drawFaq();
      $("#bsave") && $("#bsave").addEventListener("click", function () {
        $("#bsave").disabled = true;
        api("/site/bot", { name: $("#bn").value, about: $("#ba").value, desc: $("#bd").value, card: $("#bc").checked }).then(function (r) {
          if (!j.bot.on) toast("Сохранено. Применится, когда подключите бота"); else if (r.bot.bad.length) toast("Сохранено, но Telegram принял не всё: " + r.bot.bad.join("; "), true); else toast("Оформление бота обновлено в Telegram");
          site(main);
        }).catch(function (e) { $("#bsave").disabled = false; fail(e); });
      });
      $("#fadd").addEventListener("click", function () { faq.push({ q: "", a: "" }); drawFaq(); });
      $("#csave").addEventListener("click", function () { var c = {}; $$("[data-c]").forEach(function (i) { c[i.getAttribute("data-c")] = i.value.trim(); }); api("/site/contacts", c).then(function () { toast("Контакты на сайте обновлены"); }).catch(fail); });
      $("#fsave").addEventListener("click", function () { var t = {}; $$("[data-t]").forEach(function (i) { t[i.getAttribute("data-t")] = i.value; }); api("/site/faq", { faq: faq, texts: t }).then(function () { toast("Сохранено"); site(main); }).catch(fail); });
      $("#ssave") && $("#ssave").addEventListener("click", function () { var m = {}; seoKeys.forEach(function (k) { m[k] = { t: $('[data-st="' + k + '"]').value.trim(), d: $('[data-sd="' + k + '"]').value.trim() }; }); api("/site/seo", m).then(function () { toast("Заголовки сохранены"); }).catch(fail); });
      $("#ksave") && $("#ksave").addEventListener("click", function () { api("/site/counters", { metrika: $("#cm").value.trim(), yandex: $("#cy").value.trim(), google: $("#cg").value.trim() }).then(function () { toast("Сохранено"); }).catch(fail); });
    });
  }

  /* ── Подключения ───────────────────────────────────────────────── */
  function connect(main) {
    return api("/settings").then(function (s) {
      var b = head(main, "Подключения"), own = ME.role === "owner";
      b.innerHTML = (own ? "" : '<p class="note">Ключи вставляет владелец. Вы можете привязать свой Telegram.</p>') +
        '<h2>Telegram-бот</h2><div class="card grid">' + (s.tg.on ? "<p>Подключён: <b>@" + h(s.tg.bot) + "</b>. Получают обращения: " + (s.tg.staff.length ? h(s.tg.staff.join(", ")) : "пока никто") + '</p><div class="row"><button class="btn pri" id="tlink">Привязать мой Telegram</button>' + (own ? '<button class="btn warn" id="toff">Отключить бота</button>' : "") + '</div><p id="tl"></p>' :
          (own ? '<p class="note">1. В Telegram откройте @BotFather → /newbot → имя и адрес бота. 2. Скопируйте токен вида 123456:ABC… и вставьте сюда. Бот будет и для клиентов (частые вопросы, обращения), и для команды (обращения с кнопкой «Взял»).</p><label class="f">Токен бота<input id="tt" autocomplete="off"></label><div class="row"><button class="btn pri" id="tsave">Подключить</button></div>' : '<p class="note">Бот ещё не подключён.</p>')) + "</div>" +
        (own ? '<h2>CRM</h2><div class="card grid">' + (s.crm.kind ? "<p>Подключена: <b>" + h(s.crm.name) + "</b> (" + h(s.crm.account) + ')</p><label class="row"><input type="checkbox" id="cauto"' + (s.crm.auto ? " checked" : "") + '> Каждое новое обращение уходит в CRM само</label><div class="row"><button class="btn warn" id="coff">Отключить CRM</button></div>' :
          '<div class="grid g2"><div class="grid"><b>amoCRM</b><p class="note">amoCRM → «amoМаркет» → «⋯» → «Создать интеграцию» → «Внешняя интеграция» → «Ключи и доступы» → «Долгосрочный токен».</p><label class="f">Поддомен (например, czechfarm)<input id="ad"></label><label class="f">Долгосрочный токен<textarea id="at"></textarea></label><button class="btn pri" id="asave">Подключить amoCRM</button></div>' +
          '<div class="grid"><b>Bitrix24</b><p class="note">Bitrix24 → «Разработчикам» → «Другое» → «Входящий вебхук», право «CRM (crm)» → скопируйте адрес вебхука.</p><label class="f">Адрес вебхука (https://портал.bitrix24.ru/rest/1/ключ/)<input id="bh" autocomplete="off"></label><button class="btn pri" id="bsave">Подключить Bitrix24</button></div></div>') + "</div>" : "");
      function busy(btn, p) { btn.disabled = true; return p.then(function () { toast("Готово"); connect(main); }).catch(function (e) { btn.disabled = false; fail(e); }); }
      $("#tsave") && $("#tsave").addEventListener("click", function (e) { busy(e.target, api("/connect/tg", { token: $("#tt").value.trim() })); });
      $("#toff") && $("#toff").addEventListener("click", function (e) { if (confirm("Отключить бота? Команда перестанет получать обращения в Telegram.")) busy(e.target, api("/connect/tg/off", {})); });
      $("#tlink") && $("#tlink").addEventListener("click", function () { api("/tg/link", {}).then(function (r) { $("#tl").innerHTML = 'Откройте <a href="' + h(r.url) + '" target="_blank" rel="noopener">эту ссылку</a> в Telegram и нажмите «Старт». Ссылка работает 15 минут.'; }).catch(fail); });
      $("#asave") && $("#asave").addEventListener("click", function (e) { busy(e.target, api("/connect/amo", { domain: $("#ad").value.trim(), token: $("#at").value.trim() })); });
      $("#bsave") && $("#bsave").addEventListener("click", function (e) { busy(e.target, api("/connect/b24", { hook: $("#bh").value.trim() })); });
      $("#coff") && $("#coff").addEventListener("click", function (e) { if (confirm("Отключить CRM?")) busy(e.target, api("/connect/crm/off", {})); });
      $("#cauto") && $("#cauto").addEventListener("change", function (e) { api("/connect/crm-auto", { on: e.target.checked }).then(function () { toast("Сохранено"); }).catch(fail); });
    });
  }

  /* ── Команда ───────────────────────────────────────────────────── */
  function team(main) {
    return api("/users").then(function (j) {
      var b = head(main, "Команда"), own = ME.role === "owner";
      b.innerHTML = '<p class="note">Владелец видит всё и подключает сервисы. Руководитель — всё, кроме подключений и команды. Менеджер не видит запросы инвесторов, комнату инвестора, заголовки страниц и историю.</p><table class="resp"><thead><tr><th>Имя</th><th>Логин</th><th>Роль</th><th>Telegram</th><th>Темы в Telegram</th><th></th></tr></thead><tbody>' + j.users.map(function (u) {
        var ks = u.kinds ? u.kinds.split(",") : [];
        return "<tr><td><b>" + h(u.name) + "</b>" + (u.disabled ? ' <span class="pill off">отключён</span>' : "") + "</td><td>" + h(u.login) + "</td><td>" + (own && !u.disabled ? '<select class="i" data-role="' + u.id + '">' + Object.keys(j.roles).map(function (r) { return '<option value="' + r + '"' + (u.role === r ? " selected" : "") + ">" + h(j.roles[r]) + "</option>"; }).join("") + "</select>" : h(j.roles[u.role])) + "</td><td>" + (u.tg ? "привязан" : '<span class="note">нет</span>') + "</td><td>" + (own && !u.disabled ? Object.keys(j.kinds).map(function (k) { return '<label class="row note"><input type="checkbox" data-kind="' + u.id + '" value="' + k + '"' + (ks.indexOf(k) >= 0 ? " checked" : "") + "> " + h(j.kinds[k]) + "</label>"; }).join("") + '<span class="note">ничего не отмечено — все темы</span>' : (ks.length ? ks.map(function (k) { return h(j.kinds[k]); }).join(", ") : "все")) + '</td><td class="row">' + (own && !u.disabled && u.id !== ME.id ? '<button class="btn" data-pw="' + u.id + '">Новый пароль</button><button class="btn warn" data-off="' + u.id + '">Отключить</button>' : "") + "</td></tr>";
      }).join("") + "</tbody></table>" +
        (own ? '<h2>Добавить сотрудника</h2><div class="card grid"><div class="grid g4"><label class="f">Имя<input id="un"></label><label class="f">Логин<input id="ul" autocomplete="off"></label><label class="f">Пароль (от 8 знаков)<input id="up" type="password" autocomplete="new-password"></label><label class="f">Роль<select id="ur">' + Object.keys(j.roles).map(function (r) { return '<option value="' + r + '"' + (r === "manager" ? " selected" : "") + ">" + h(j.roles[r]) + "</option>"; }).join("") + '</select></label></div><div class="row"><button class="btn pri" id="uadd">Добавить</button><span class="note">Передайте логин и пароль сотруднику лично.</span></div></div>' : "") +
        '<h2>Мой пароль</h2><div class="card grid"><div class="grid g2"><label class="f">Текущий<input id="po" type="password" autocomplete="current-password"></label><label class="f">Новый (от 8 знаков)<input id="pn" type="password" autocomplete="new-password"></label></div><div class="row"><button class="btn" id="psave">Сменить пароль</button></div></div>';
      $("#uadd") && $("#uadd").addEventListener("click", function () { api("/users", { name: $("#un").value.trim(), login: $("#ul").value.trim(), pass: $("#up").value, role: $("#ur").value }).then(function () { toast("Сотрудник добавлен"); team(main); }).catch(fail); });
      $$("[data-role]", b).forEach(function (x) { x.addEventListener("change", function () { api("/users/" + x.getAttribute("data-role"), { role: x.value }).then(function () { toast("Роль изменена"); }).catch(function (e) { fail(e); team(main); }); }); });
      $$("[data-kind]", b).forEach(function (x) { x.addEventListener("change", function () { var id = x.getAttribute("data-kind"); api("/users/" + id, { kinds: $$('[data-kind="' + id + '"]:checked', b).map(function (c) { return c.value; }) }).then(function () { toast("Сохранено"); }).catch(fail); }); });
      $$("[data-pw]", b).forEach(function (x) { x.addEventListener("click", function () { var p = prompt("Новый пароль (от 8 знаков):"); if (p) api("/users/" + x.getAttribute("data-pw") + "/pass", { pass: p }).then(function () { toast("Пароль изменён, сотрудник войдёт заново"); }).catch(fail); }); });
      $$("[data-off]", b).forEach(function (x) { x.addEventListener("click", function () { if (confirm("Отключить сотрудника? Он сразу выйдет из панели.")) api("/users/" + x.getAttribute("data-off") + "/off", {}).then(function () { team(main); }).catch(fail); }); });
      $("#psave").addEventListener("click", function () { api("/me/pass", { old: $("#po").value, pass: $("#pn").value }).then(function () { toast("Пароль сменён, войдите заново"); boot(); }).catch(fail); });
    });
  }

  /* ── Партнёры и клиенты ────────────────────────────────────────── */
  function accounts(main) {
    return api("/accounts").then(function (j) {
      var b = head(main, "Партнёры и клиенты");
      var pend = j.accounts.filter(function (a) { return a.status === "pending"; }).length;
      b.innerHTML = '<p class="note">Кабинеты с сайта (раздел «Кабинет»). Клиент получает кабинет сразу, партнёр — после «Одобрить». В кабинете человек видит свои обращения и их статус. Привязанный Telegram — человек нажал «Привязать Telegram» в кабинете: такие получают рассылки своего сегмента.</p>' +
        (pend ? '<div class="card"><b>Ждут проверки: ' + pend + "</b></div>" : "") +
        (j.accounts.length ? '<table class="resp"><thead><tr><th>Кто</th><th>Контакт</th><th>Когда</th><th>Статус</th><th></th></tr></thead><tbody>' + j.accounts.map(function (a) {
          return "<tr><td><b>" + h(a.name) + "</b>" + (a.org ? ", " + h(a.org) : "") + '<br><span class="note">' + (a.kind === "partner" ? "партнёр" : "клиент") + (a.country ? " · " + h(a.country) : "") + "</span></td><td>" + h(a.email) + (a.phone ? "<br>" + h(a.phone) : "") + (a.tg ? '<br><span class="pill">Telegram</span>' : "") + "</td><td>" + dt(a.created_at) + '</td><td><span class="pill ' + (a.status === "pending" ? "new" : a.status === "active" ? "done" : "spam") + '">' + h(a.statusName) + "</span>" + (a.approved_by ? '<br><span class="note">' + h(a.approved_by) + "</span>" : "") + '</td><td class="row">' + (staff() ? (a.status !== "active" ? '<button class="btn pri" data-st="active" data-id="' + a.id + '">' + (a.status === "pending" ? "Одобрить" : "Разблокировать") + "</button>" : "") + (a.status !== "blocked" ? '<button class="btn warn" data-st="blocked" data-id="' + a.id + '">Заблокировать</button>' : "") : "") + "</td></tr>";
        }).join("") + "</tbody></table>" : '<div class="card note">Регистраций пока нет.</div>');
      $$("[data-st]", b).forEach(function (x) { x.addEventListener("click", function () { var st = x.getAttribute("data-st"); if (st === "blocked" && !confirm("Заблокировать кабинет? Человек сразу выйдет и не сможет войти.")) return; api("/accounts/" + x.getAttribute("data-id"), { status: st }).then(function () { toast("Сохранено"); accounts(main); }).catch(fail); }); });
      var pw = document.createElement("div"); b.appendChild(pw);
      return api("/partners").then(function (p) { partnerList(pw, p.partners, main); });
    });
  }
  /* Партнёры из таблицы: загрузка Excel или CSV, столбцы разбирает Haiku (нет — по заголовкам),
     в рассылке — когда партнёр сам нажал /start в боте. */
  var PL_F = [["name", "Имя"], ["org", "Компания"], ["phone", "Телефон"], ["email", "Почта"], ["country", "Страна"], ["city", "Город"], ["tg", "Telegram"], ["group", "Группа (сеть, направление)"], ["note", "Заметка"]];
  var PL_ST = { "in": ["в боте", "done"], out: ["не в боте", "new"], blocked: ["заблокировал бота", "spam"] };
  function partnerList(box, list, main) {
    var n = { "in": 0, out: 0, blocked: 0 }; list.forEach(function (p) { n[p.state]++; });
    box.innerHTML = '<h2>Партнёры из таблицы</h2><p class="note">Загрузите таблицу партнёров из Excel (.xlsx) или CSV: столбцы разберутся сами, их можно поправить перед загрузкой. Партнёр попадает в рассылку «Партнёрам», когда сам нажмёт «Старт» в боте: по своей личной ссылке, по нику Telegram из таблицы или поделившись номером. «В боте» — нажал и не заблокировал бота.</p>' +
      (staff() ? '<div class="card grid"><label class="f">Таблица Excel (.xlsx) или CSV<input type="file" accept=".xlsx,.csv,.txt" id="plf"></label><div class="row"><button class="btn pri" id="plread">Прочитать таблицу</button></div><div id="plprev"></div></div>' : "") +
      (list.length ? '<p><b>Всего ' + list.length + '</b> · в боте ' + n["in"] + ' · не в боте ' + n.out + (n.blocked ? " · заблокировали " + n.blocked : "") + '</p><table class="resp"><thead><tr><th>Партнёр</th><th>Контакт</th><th>Бот</th><th></th></tr></thead><tbody>' + list.map(function (p) {
        var st = PL_ST[p.state];
        return "<tr><td><b>" + h(p.name || p.org) + "</b>" + (p.name && p.org ? ", " + h(p.org) : "") + ((p.country || p.city) ? '<br><span class="note">' + h([p.country, p.city].filter(Boolean).join(", ")) + "</span>" : "") + (p.groups && p.groups.length ? '<br><span class="note">Группы: ' + h(p.groups.join(", ")) + "</span>" : "") + "</td><td>" + [p.phone, p.email, p.tg].filter(Boolean).map(h).join("<br>") + '</td><td><span class="pill ' + st[1] + '">' + st[0] + "</span>" + (p.joined_at ? '<br><span class="note">с ' + dt(p.joined_at) + "</span>" : "") + '</td><td class="row">' + (p.link && p.state === "out" ? '<button class="btn" data-plcp="' + h(p.link) + '">Ссылка в бот</button>' : "") + (staff() ? '<button class="btn warn" data-pldel="' + p.id + '">Убрать</button>' : "") + "</td></tr>";
      }).join("") + "</tbody></table>" : '<div class="card note">Партнёров из таблицы пока нет.</div>');
    $$("[data-plcp]", box).forEach(function (x) { x.addEventListener("click", function () { navigator.clipboard.writeText(x.getAttribute("data-plcp")).then(function () { toast("Ссылка скопирована: отправьте её партнёру"); }, function () { toast("Не скопировалось", true); }); }); });
    $$("[data-pldel]", box).forEach(function (x) { x.addEventListener("click", function () { if (confirm("Убрать партнёра из списка?")) api("/partners/" + x.getAttribute("data-pldel") + "/del", {}).then(function (r) { partnerList(box, r.partners, main); }).catch(fail); }); });
    var rd = $("#plread", box); if (!rd) return;
    rd.addEventListener("click", function () {
      rd.disabled = true; toast("Читаем таблицу…");
      readFile($("#plf", box)).then(function (f) { return api("/partners/read", { data: f.data, name: f.name }); }).then(function (t) {
        rd.disabled = false;
        var opts = function (sel) { return '<option value="-1">— нет —</option>' + t.headers.map(function (hh, i) { return '<option value="' + i + '"' + (sel === i ? " selected" : "") + ">" + h(hh || "Столбец " + (i + 1)) + "</option>"; }).join(""); };
        var pv = $("#plprev", box);
        pv.innerHTML = '<p class="note">' + (t.by === "ai" ? "Столбцы разобрал Haiku" : "Столбцы подобраны по заголовкам") + ". Строк в таблице: " + t.rows.length + ". Проверьте, что где лежит:</p>" +
          '<div class="grid g4">' + PL_F.map(function (f) { return '<label class="f">' + f[1] + '<select class="i" data-plf="' + f[0] + '">' + opts(t.map[f[0]]) + "</select></label>"; }).join("") + "</div>" +
          '<table class="resp"><tbody>' + t.rows.slice(0, 3).map(function (r) { return "<tr>" + r.slice(0, 8).map(function (c) { return "<td>" + h(c) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table>" +
          '<div class="row"><button class="btn pri" id="plgo">Добавить партнёров: ' + t.rows.length + "</button></div>";
        $("#plgo", pv).addEventListener("click", function () {
          var map = {}; $$("[data-plf]", pv).forEach(function (s) { map[s.getAttribute("data-plf")] = Number(s.value); });
          $("#plgo", pv).disabled = true;
          api("/partners/import", { rows: t.rows, map: map }).then(function (r) { toast("Добавлено: " + r.added + (r.dup ? ", уже были в списке: " + r.dup : "") + (r.empty ? ", без имени или контакта: " + r.empty : "") + (r.groups ? ". По группам рассылки: " + r.groups + " (в «Рассылки в бот»)" : "")); partnerList(box, r.partners, main); }).catch(function (e) { $("#plgo", pv).disabled = false; fail(e); });
        });
      }).catch(function (e) { rd.disabled = false; fail(e); });
    });
  }

  /* ── Рассылки в бот ────────────────────────────────────────────── */
  var BC_ST = { queued: "в очереди", sending: "идёт", done: "готово", canceled: "остановлена" };
  function broadcasts(main) {
    return api("/audience").then(function (j) {
      var c = j.counts, b = head(main, "Рассылки в бот"), gs = j.groups || [];
      var who = Object.keys(j.segments).map(function (k) { return { k: k, t: j.segments[k], n: c[k] }; }).concat(gs.map(function (g) { return { k: "g:" + g.id, t: "Группа «" + g.name + "»", n: g.inBot }; }));
      b.innerHTML = '<div class="grid g4">' + [["Подписчиков сейчас", c.all], ["Партнёров", c.partner], ["Клиентов", c.client], ["Новых за 7 дней", c.week]].map(function (x) { return '<div class="card stat"><b>' + x[1] + "</b><span>" + x[0] + "</span></div>"; }).join("") + '</div><p class="note">Подписчик — тот, кто сам писал боту и не заблокировал его (сотрудники не считаются). Заблокировали бота: ' + c.blocked + '. С телефона: напишите боту /рассылка, пришлите текст или фото с подписью и выберите, кому — там же кнопки ваших групп.</p>' +
        '<h2>Новая рассылка</h2><div class="card grid"><label class="f">Текст (до 4000 знаков, с фото — до 1024)<textarea id="bt" rows="6"></textarea></label><div class="grid g2"><label class="f">Кому<select id="bs">' + who.map(function (x) { return '<option value="' + h(x.k) + '">' + h(x.t) + " · " + x.n + "</option>"; }).join("") + '</select></label><label class="f">Фото (необязательно)<input type="file" accept="image/jpeg,image/png,image/webp" id="bp"></label></div><div class="row"><button class="btn pri" id="bgo">Отправить</button><span class="note">Уходит не быстрее 25 сообщений в секунду; отменить можно, пока идёт.</span></div></div>' +
        '<h2>Группы рассылки</h2><p class="note">Группа — свой список получателей: аптеки одной сети, врачи одного направления, дистрибьюторы страны. В группу добавляются подписчики бота и партнёры из таблицы; партнёр получает рассылку группы, когда сам пришёл в бота. Группы заводятся и сами — столбцом «Группа» при загрузке таблицы партнёров («Партнёры и клиенты»).</p>' +
        '<div class="card grid"><div class="row"><input class="i" id="gnew" maxlength="60" placeholder="Название новой группы, например «Аптеки Арзон»"><button class="btn" id="gadd">+ Завести группу</button></div>' +
        (gs.length ? '<table class="resp"><thead><tr><th>Группа</th><th>Участников</th><th>В боте</th><th></th></tr></thead><tbody>' + gs.map(function (g) { return '<tr><td><b>' + h(g.name) + '</b></td><td>' + g.total + "</td><td>" + g.inBot + '</td><td><button class="btn" data-gopen="' + g.id + '">Открыть</button> <button class="btn" data-gsend="' + g.id + '"' + (g.inBot ? "" : " disabled") + '>Написать группе</button></td></tr>'; }).join("") + "</tbody></table>" : '<p class="note">Групп пока нет.</p>') + '<div id="gbox"></div></div>' +
        "<h2>История</h2>" + (j.broadcasts.length ? '<table class="resp"><thead><tr><th>Когда</th><th>Текст</th><th>Кому</th><th>Итог</th><th></th></tr></thead><tbody>' + j.broadcasts.map(function (r) {
          return "<tr><td>" + dt(r.at) + '<br><span class="note">' + h(r.by) + (r.via === "telegram" ? " · с телефона" : "") + "</span></td><td>" + (r.photo ? "🖼 " : "") + h(r.text.slice(0, 160)) + "</td><td>" + h(r.segName || j.segments[r.seg] || r.seg) + "</td><td>" + h(BC_ST[r.state] || r.state) + "<br>" + r.sent + " из " + r.total + (r.blocked ? ", заблокировали " + r.blocked : "") + (r.failed ? ", не дошло " + r.failed : "") + "</td><td>" + (r.state === "queued" || r.state === "sending" ? '<button class="btn warn" data-cx="' + r.id + '">Остановить</button>' : "") + "</td></tr>";
        }).join("") + "</tbody></table>" : '<div class="card note">Рассылок ещё не было.</div>');
      $("#bgo").addEventListener("click", function () {
        var text = $("#bt").value.trim(), seg = $("#bs").value, x = who.filter(function (w) { return w.k === seg; })[0]; if (!text) return toast("Напишите текст", true);
        if (!confirm("Отправить рассылку: " + x.t.toLowerCase() + ", " + x.n + " получателей?")) return;
        $("#bgo").disabled = true;
        var job = $("#bp").files.length ? upload($("#bp")) : Promise.resolve("");
        job.then(function (photo) { return api("/broadcasts", { text: text, seg: seg, photo: photo }); }).then(function () { toast("Рассылка запущена"); broadcasts(main); }).catch(function (e) { $("#bgo").disabled = false; fail(e); });
      });
      $$("[data-cx]", b).forEach(function (x) { x.addEventListener("click", function () { api("/broadcasts/" + x.getAttribute("data-cx") + "/cancel", {}).then(function () { broadcasts(main); }).catch(fail); }); });
      $("#gadd").addEventListener("click", function () { var n = $("#gnew").value.trim(); if (!n) return toast("Напишите название группы", true); api("/groups", { name: n }).then(function (r) { toast("Группа заведена: добавьте в неё участников"); broadcasts(main).then(function () { groupBox(main, r.group.id); }); }).catch(fail); });
      $$("[data-gopen]", b).forEach(function (x) { x.addEventListener("click", function () { groupBox(main, +x.getAttribute("data-gopen")); }); });
      $$("[data-gsend]", b).forEach(function (x) { x.addEventListener("click", function () { $("#bs").value = "g:" + x.getAttribute("data-gsend"); $("#bt").focus(); $("#bt").scrollIntoView({ block: "center" }); }); });
    });
  }
  /* Одна группа: кто в ней, добавить поиском, убрать, переименовать. */
  function groupBox(main, gid) {
    var box = $("#gbox"); if (!box) return;
    function draw(r) {
      var g = r.group, n = { "in": 0, out: 0, blocked: 0 }; r.members.forEach(function (m) { n[m.state]++; });
      box.innerHTML = '<div class="card grid gbx"><div class="row"><input class="i" id="gname" maxlength="60" value="' + h(g.name) + '"><button class="btn" id="gren">Переименовать</button><span class="sp"></span><button class="btn warn" id="gdel">Убрать группу</button></div>' +
        '<p><b>' + h(g.name) + "</b>: участников " + r.members.length + " · в боте " + n["in"] + " · не в боте " + n.out + (n.blocked ? " · заблокировали " + n.blocked : "") + '</p>' +
        '<label class="f">Добавить: имя, компания, город, телефон или @ник<input class="i" id="gq" placeholder="Начните писать — ниже появятся партнёры из таблицы и подписчики бота"></label><div id="gfound"></div>' +
        (r.members.length ? '<table class="resp"><tbody>' + r.members.map(function (m) { var st = PL_ST[m.state]; return "<tr><td><b>" + h(m.name) + '</b>' + (m.sub ? '<br><span class="note">' + h(m.sub) + "</span>" : "") + '</td><td><span class="pill ' + st[1] + '">' + st[0] + '</span></td><td><button class="btn" data-gdrop="' + h(m.ref) + '">Убрать</button></td></tr>'; }).join("") + "</tbody></table>" : '<p class="note">В группе пока никого: найдите участников поиском выше.</p>') + "</div>";
      $("#gren", box).addEventListener("click", function () { api("/groups/" + gid + "/rename", { name: $("#gname", box).value }).then(function () { toast("Переименовано"); broadcasts(main).then(function () { groupBox(main, gid); }); }).catch(fail); });
      $("#gdel", box).addEventListener("click", function () { if (confirm("Убрать группу «" + g.name + "»? Участники останутся в боте и в списке партнёров.")) api("/groups/" + gid + "/del", {}).then(function () { toast("Группа убрана"); broadcasts(main); }).catch(fail); });
      $$("[data-gdrop]", box).forEach(function (x) { x.addEventListener("click", function () { api("/groups/" + gid + "/drop", { ref: x.getAttribute("data-gdrop") }).then(function (r2) { draw(r2); refreshCounts(r2.groups); }).catch(fail); }); });
      var q = $("#gq", box), t = 0;
      q.addEventListener("input", function () { clearTimeout(t); t = setTimeout(function () {
        var v = q.value.trim(), out = $("#gfound", box); if (v.length < 2) { out.innerHTML = ""; return; }
        api("/groups/" + gid + "/find?q=" + encodeURIComponent(v)).then(function (f) {
          out.innerHTML = f.found.length ? '<div class="row"><button class="btn" id="gall">Добавить всех найденных: ' + f.found.length + '</button></div><table class="resp"><tbody>' + f.found.map(function (m) { var st = PL_ST[m.state]; return "<tr><td><b>" + h(m.name) + '</b><br><span class="note">' + h(m.sub) + '</span></td><td><span class="pill ' + st[1] + '">' + st[0] + '</span></td><td><button class="btn pri" data-gput="' + h(m.ref) + '">Добавить</button></td></tr>'; }).join("") + "</tbody></table>" : '<p class="note">Никого не нашли.</p>';
          var put = function (refs) { api("/groups/" + gid + "/add", { refs: refs }).then(function (r2) { toast("Добавлено: " + r2.added); draw(r2); refreshCounts(r2.groups); }).catch(fail); };
          $$("[data-gput]", out).forEach(function (x) { x.addEventListener("click", function () { put([x.getAttribute("data-gput")]); }); });
          var all = $("#gall", out); if (all) all.addEventListener("click", function () { put(f.found.map(function (m) { return m.ref; })); });
        }).catch(fail);
      }, 250); });
    }
    function refreshCounts(groups) { groups.forEach(function (g) { var o = $('#bs option[value="g:' + g.id + '"]'); if (o) o.textContent = "Группа «" + g.name + "» · " + g.inBot; }); }
    return api("/groups/" + gid).then(function (r) { draw(r); box.scrollIntoView({ block: "start", behavior: "smooth" }); }).catch(fail);
  }

  /* ── Электронные визитки: страница /card/<адрес>, на неё ведёт QR ── */
  var VC_LANG = { ru: "Русский", uz: "Узбекский", en: "Английский", ar: "Арабский" };
  function qrSvg(url, size) { try { return window.cfQr.svg(url, { size: size || 0 }); } catch (e) { return '<p class="note">' + h(e.message) + "</p>"; } }
  function dl(name, blob) { var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
  function qrPng(url, name) {
    var q = window.cfQr.make(url), n = q.matrix.length, pad = 4, px = Math.floor(2048 / (n + pad * 2)), s = px * (n + pad * 2), c = document.createElement("canvas"), x = c.getContext("2d");
    c.width = c.height = s; x.fillStyle = "#fff"; x.fillRect(0, 0, s, s); x.fillStyle = "#000";
    for (var r = 0; r < n; r++) for (var k = 0; k < n; k++) if (q.matrix[r][k]) x.fillRect((k + pad) * px, (r + pad) * px, px, px);
    c.toBlob(function (b) { dl(name + ".png", b); }, "image/png");
  }
  function qrButtons(url, slug) { return '<div class="row"><button type="button" class="btn" data-qsvg="' + h(url) + '" data-qn="' + h(slug) + '">QR для печати (SVG)</button><button type="button" class="btn" data-qpng="' + h(url) + '" data-qn="' + h(slug) + '">QR картинкой (PNG)</button></div>'; }
  function bindQr(root) {
    $$("[data-qsvg]", root).forEach(function (b) { b.onclick = function () { dl("qr-" + b.getAttribute("data-qn") + ".svg", new Blob([window.cfQr.svg(b.getAttribute("data-qsvg"))], { type: "image/svg+xml" })); }; });
    $$("[data-qpng]", root).forEach(function (b) { b.onclick = function () { qrPng(b.getAttribute("data-qpng"), "qr-" + b.getAttribute("data-qn")); }; });
  }
  function cards(main, sub) {
    return api("/cards").then(function (j) {
      if (sub) { var c = sub === "new" ? null : j.cards.filter(function (x) { return String(x.id) === sub; })[0]; if (sub !== "new" && !c) { location.hash = "#cards"; return; } return cardEdit(main, j, c); }
      var b = head(main, "Электронные визитки", '<a class="btn pri" href="#cards/new">Новая визитка</a>', "QR на бумажной визитке ведёт на страницу сотрудника: позвонить одним нажатием, перейти на сайт, сохранить контакт в телефон.");
      var mine = function (c) { return ME.role !== "manager" || c.user_id === ME.id; };
      b.innerHTML = j.cards.length ? '<div class="vcl">' + j.cards.map(function (c) {
        return '<div class="card vci' + (c.off ? " off" : "") + '"><div class="vcq">' + qrSvg(c.url) + '</div><div class="vcm"><b>' + h(c.data.name) + "</b>" + (c.data.title ? '<span class="note">' + h(c.data.title) + "</span>" : "") +
          '<a href="/card/' + h(c.slug) + '" target="_blank" rel="noopener">' + h(c.url.replace(/^https?:\/\//, "")) + "</a>" +
          '<span class="note">Открывали: ' + c.views + (c.last_view ? " · последний раз " + dt(c.last_view) : "") + " · сделал(а) " + h(c.owner || "—") + "</span>" + (c.off ? '<span class="pill off">выключена</span>' : "") +
          '<div class="row">' + (mine(c) ? '<a class="btn" href="#cards/' + c.id + '">Изменить</a>' : "") + '<a class="btn" href="/card/' + h(c.slug) + '" target="_blank" rel="noopener">Открыть</a>' + qrButtons(c.url, c.slug).replace(/^<div class="row">|<\/div>$/g, "") +
          (mine(c) ? '<button class="btn" data-off="' + c.id + '" data-v="' + (c.off ? "on" : "off") + '">' + (c.off ? "Включить" : "Выключить") + '</button><button class="btn warn" data-del="' + c.id + '">Удалить</button>' : "") + "</div></div></div>";
      }).join("") + "</div>" : '<div class="card"><p>Визиток пока нет.</p><p class="note">Нажмите «Новая визитка»: заполните имя, должность и телефон, выберите вид страницы и сохраните. QR появится сразу, его можно скачать для печати.</p><a class="btn pri" href="#cards/new">Новая визитка</a></div>';
      bindQr(b);
      $$("[data-off]", b).forEach(function (x) { x.onclick = function () { var v = x.getAttribute("data-v"); if (v === "off" && !confirm("Выключить визитку? По QR откроется «Визитка больше не действует».")) return; api("/cards/" + x.getAttribute("data-off") + "/" + v, {}).then(function () { cards(main); }).catch(fail); }; });
      $$("[data-del]", b).forEach(function (x) { x.onclick = function () { if (confirm("Удалить визитку навсегда? Напечатанный QR перестанет работать, а адрес освободится.")) api("/cards/" + x.getAttribute("data-del") + "/del", {}).then(function () { toast("Визитка удалена"); cards(main); }).catch(fail); }; });
    });
  }
  function cardEdit(main, j, c) {
    var d = c ? JSON.parse(JSON.stringify(c.data)) : { lang: "ru", company: "CZECHFARM Alliance", site: j.site, phones: [{ label: "", value: "" }], extra: [], theme: "emerald", anim: "drift", accent: "red", logo: true };
    if (!d.phones.length) d.phones = [{ label: "", value: "" }];
    var slug = c ? c.slug : "", slugTouched = false;
    var b = head(main, c ? "Визитка: " + h(d.name) : "Новая визитка", '<a class="btn" href="#cards">← Все визитки</a>');
    var inp = function (id, label, val, ph, extra) { return '<label class="f">' + label + '<input id="' + id + '" value="' + h(val || "") + '"' + (ph ? ' placeholder="' + h(ph) + '"' : "") + (extra || "") + "></label>"; };
    b.innerHTML = '<div class="vc"><div class="vcf">' +
      '<h2>Кто на визитке</h2><div class="card grid"><div class="grid g2">' + inp("vn", "Имя и фамилия *", d.name, "Дильёра Шавкатовна") + inp("vt", "Должность", d.title, "Директор по развитию") + inp("vco", "Компания", d.company) +
      '<label class="f">Язык страницы<select id="vl">' + j.langs.map(function (l) { return '<option value="' + l + '"' + (l === d.lang ? " selected" : "") + ">" + VC_LANG[l] + "</option>"; }).join("") + "</select></label></div>" +
      '<div class="vcph"><div class="vcav" id="vav">' + (d.photo ? '<img src="' + h(d.photo) + '" alt="">' : "фото") + '</div><label class="f">Фото (JPG, PNG или WebP)<input type="file" accept=".jpg,.jpeg,.png,.webp" id="vpf"></label><button type="button" class="btn" id="vpx"' + (d.photo ? "" : " hidden") + ">Убрать фото</button></div></div>" +
      '<h2>Как связаться</h2><div class="card grid"><p class="note">Первый телефон — большая кнопка «Позвонить». Остальные — строками ниже, тоже нажимаются.</p><div id="vphs" class="grid"></div><button type="button" class="btn" id="vpadd">+ Ещё телефон</button>' +
      '<div class="grid g2">' + inp("ve", "Почта", d.email, "name@czechfarm.org", ' type="email"') + inp("vs", "Сайт (кнопка «Перейти на сайт»)", d.site, "https://czechfarm.org") + inp("vtg", "Telegram", d.tg, "@nik или t.me/nik") + inp("vwa", "WhatsApp", d.wa, "+998 90 123 45 67") + "</div>" + inp("va", "Адрес офиса (откроется на карте)", d.address, "Ташкент, …") + "</div>" +
      '<h2>Дополнительно</h2><div class="card grid"><p class="note">Свои строки: «Направление — Неврология», «Instagram — https://…». Ссылка, почта и телефон сами станут нажимаемыми.</p><div id="vexs" class="grid"></div><button type="button" class="btn" id="vexadd">+ Добавить поле</button>' +
      '<label class="f">О себе (до 500 знаков)<textarea id="vab" rows="3">' + h(d.about || "") + "</textarea></label></div>" +
      '<h2>Вид страницы</h2><div class="card grid"><span class="f">Фон</span><div class="vcsw" id="vth">' + Object.keys(j.themes).map(function (k) { var t = j.themes[k]; return '<button type="button" data-th="' + k + '" aria-pressed="' + (k === d.theme) + '"><i></i><span>' + h(t.name) + "</span></button>"; }).join("") + "</div>" +
      '<div id="vbgw"' + (d.theme === "photo" ? "" : " hidden") + '><label class="f">Фото фона (офис, производство…)<input type="file" accept=".jpg,.jpeg,.png,.webp" id="vbgf"></label><p class="note" id="vbgn">' + (d.bg ? "Фон загружен." : "Фон ещё не загружен.") + "</p></div>" +
      '<span class="f">Анимация</span><div class="vcch" id="van">' + Object.keys(j.anims).map(function (k) { return '<button type="button" data-an="' + k + '" aria-pressed="' + (k === d.anim) + '">' + h(j.anims[k]) + "</button>"; }).join("") + "</div>" +
      '<span class="f">Цвет кнопок</span><div class="vcac" id="vac">' + Object.keys(j.accents).map(function (k) { var a = j.accents[k]; return '<button type="button" data-ac="' + k + '" aria-pressed="' + (k === d.accent) + '" title="' + h(a.name) + '" aria-label="' + h(a.name) + '"><i></i></button>'; }).join("") + "</div>" +
      '<label class="chk"><input type="checkbox" id="vlogo"' + (d.logo ? " checked" : "") + "> Знак CZECHFARM рядом с названием компании</label></div>" +
      '<h2>Адрес визитки</h2><div class="card grid">' + (c ? '<p><b>' + h(c.url) + '</b></p><p class="note">Адрес не меняется: он зашит в QR, который уже могли напечатать.</p>' : '<label class="f">' + h(j.site.replace(/^https?:\/\//, "")) + '/card/<input id="vsl" value="" placeholder="dilyora-shavkatovna" autocomplete="off"></label><p class="note">Латиница, цифры и дефис. Подставляется из имени, можно поправить. После сохранения адрес не меняется: он в QR.</p>') + "</div>" +
      '<div class="row vcsave"><button class="btn pri" id="vsave">Сохранить</button><span class="note" id="vsaid"></span></div>' +
      '</div><aside class="vcp"><div class="card vcqr"><div id="vqr"></div><p class="note" id="vqu"></p><div id="vqb"></div></div><div class="vcphone"><iframe id="vfr" title="Как увидит человек" loading="lazy"></iframe></div><p class="note">Так страницу увидят по QR. Обновляется сама, пока вы печатаете.</p></aside></div>';

    function phonesUi() { $("#vphs").innerHTML = d.phones.map(function (p, i) { return '<div class="vcrw"><input class="i" data-pl="' + i + '" placeholder="' + (i ? "Подпись (рабочий…)" : "Подпись (мобильный…)") + '" value="' + h(p.label) + '"><input class="i" data-pv="' + i + '" inputmode="tel" placeholder="+998 90 123 45 67" value="' + h(p.value) + '">' + (d.phones.length > 1 ? '<button type="button" class="btn" data-px="' + i + '" aria-label="Убрать телефон">×</button>' : "") + "</div>"; }).join(""); $("#vpadd").hidden = d.phones.length >= 3; }
    function extraUi() { $("#vexs").innerHTML = d.extra.map(function (x, i) { return '<div class="vcrw"><input class="i" data-el="' + i + '" placeholder="Название (Направление…)" value="' + h(x.label) + '"><input class="i" data-ev="' + i + '" placeholder="Значение" value="' + h(x.value) + '"><button type="button" class="btn" data-ex="' + i + '" aria-label="Убрать поле">×</button></div>'; }).join(""); $("#vexadd").hidden = d.extra.length >= 6; }
    /* Образцы фона и цвета: стили ставим через CSSOM — встроенный style запрещён политикой панели. */
    $$("[data-th]", b).forEach(function (x) { var t = j.themes[x.getAttribute("data-th")]; x.querySelector("i").style.background = "radial-gradient(70% 70% at 20% 15%," + t.g1 + ",transparent),radial-gradient(70% 70% at 90% 95%," + t.g2 + ",transparent)," + t.bg; });
    $$("[data-ac]", b).forEach(function (x) { x.querySelector("i").style.background = j.accents[x.getAttribute("data-ac")].c; });
    phonesUi(); extraUi();
    function read() {
      d.name = $("#vn").value.trim(); d.title = $("#vt").value.trim(); d.company = $("#vco").value.trim(); d.lang = $("#vl").value;
      d.email = $("#ve").value.trim(); d.site = $("#vs").value.trim(); d.tg = $("#vtg").value.trim(); d.wa = $("#vwa").value.trim(); d.address = $("#va").value.trim(); d.about = $("#vab").value; d.logo = $("#vlogo").checked;
      $$("[data-pl]", b).forEach(function (x) { d.phones[+x.getAttribute("data-pl")].label = x.value.trim(); }); $$("[data-pv]", b).forEach(function (x) { d.phones[+x.getAttribute("data-pv")].value = x.value.trim(); });
      $$("[data-el]", b).forEach(function (x) { d.extra[+x.getAttribute("data-el")].label = x.value.trim(); }); $$("[data-ev]", b).forEach(function (x) { d.extra[+x.getAttribute("data-ev")].value = x.value.trim(); });
      if (!c) { var s = $("#vsl"); if (s) slug = s.value.trim().toLowerCase(); }
      return d;
    }
    function url() { return j.site + "/card/" + (slug || "…"); }
    function drawQr() {
      var u = url(); $("#vqu").innerHTML = '<a href="' + (c ? "/card/" + h(slug) : "#") + '"' + (c ? ' target="_blank" rel="noopener"' : "") + ">" + h(u.replace(/^https?:\/\//, "")) + "</a>" + (c ? "" : "<br>QR заработает после «Сохранить»");
      $("#vqr").innerHTML = slug ? qrSvg(u) : '<p class="note">Впишите имя — появится адрес и QR.</p>';
      $("#vqb").innerHTML = slug ? qrButtons(u, slug) : ""; bindQr($("#vqb"));
    }
    var pvT = 0, slugT = 0, pvN = 0;
    function preview() { clearTimeout(pvT); pvT = setTimeout(function () { var n = ++pvN; api("/cards/preview", read()).then(function (r) { if (n === pvN) $("#vfr").src = "/card-preview/" + r.token; }).catch(function () {}); }, 450); }
    function suggest() { if (c || slugTouched) return; clearTimeout(slugT); slugT = setTimeout(function () { api("/cards/slug", { name: $("#vn").value }).then(function (r) { if (slugTouched) return; slug = r.slug || ""; $("#vsl").value = slug; drawQr(); }).catch(function () {}); }, 350); }
    b.addEventListener("input", function (e) { if (e.target.id === "vsl") { slugTouched = true; slug = e.target.value.trim().toLowerCase(); drawQr(); return; } if (e.target.id === "vn") suggest(); preview(); });
    b.addEventListener("change", preview);
    b.addEventListener("click", function (e) {
      var t = e.target.closest("button"); if (!t) return;
      if (t.hasAttribute("data-th")) { read(); d.theme = t.getAttribute("data-th"); $$("[data-th]", b).forEach(function (x) { x.setAttribute("aria-pressed", x === t); }); $("#vbgw").hidden = d.theme !== "photo"; preview(); }
      else if (t.hasAttribute("data-an")) { read(); d.anim = t.getAttribute("data-an"); $$("[data-an]", b).forEach(function (x) { x.setAttribute("aria-pressed", x === t); }); preview(); }
      else if (t.hasAttribute("data-ac")) { read(); d.accent = t.getAttribute("data-ac"); $$("[data-ac]", b).forEach(function (x) { x.setAttribute("aria-pressed", x === t); }); preview(); }
      else if (t.id === "vpadd") { read(); d.phones.push({ label: "", value: "" }); phonesUi(); }
      else if (t.hasAttribute("data-px")) { read(); d.phones.splice(+t.getAttribute("data-px"), 1); phonesUi(); preview(); }
      else if (t.id === "vexadd") { read(); d.extra.push({ label: "", value: "" }); extraUi(); }
      else if (t.hasAttribute("data-ex")) { read(); d.extra.splice(+t.getAttribute("data-ex"), 1); extraUi(); preview(); }
      else if (t.id === "vpx") { d.photo = ""; $("#vav").textContent = "фото"; t.hidden = true; preview(); }
    });
    $("#vpf").addEventListener("change", function () { upload($("#vpf")).then(function (u) { d.photo = u; $("#vav").innerHTML = '<img src="' + h(u) + '" alt="">'; $("#vpx").hidden = false; preview(); }).catch(fail); });
    $("#vbgf").addEventListener("change", function () { upload($("#vbgf")).then(function (u) { d.bg = u; $("#vbgn").textContent = "Фон загружен."; preview(); }).catch(fail); });
    $("#vsave").addEventListener("click", function () {
      var x = read(), body = JSON.parse(JSON.stringify(x)); body.phones = body.phones.filter(function (p) { return p.value; }); body.extra = body.extra.filter(function (e) { return e.label && e.value; }); if (!c) body.slug = slug;
      $("#vsave").disabled = true;
      api(c ? "/cards/" + c.id : "/cards", body).then(function (r) {
        toast(c ? "Сохранено: страница уже обновилась" : "Визитка готова: страница открыта по адресу и QR работает");
        location.hash = "#cards/" + r.id; if (c) cards(main, String(r.id));
      }).catch(function (e) { $("#vsave").disabled = false; fail(e); });
    });
    if (!c && d.name) suggest();
    drawQr(); preview();
  }

  /* ── История ───────────────────────────────────────────────────── */
  function logV(main) {
    return api("/log").then(function (j) {
      var b = head(main, "История");
      b.innerHTML = '<div class="card hist">' + j.log.map(function (x) { return "<div><span class='note'>" + dt(x.at) + "</span><span>" + h(x.who) + ": " + h(x.t) + (x.no ? ' · <a href="#lead/' + x.lead_id + '">' + h(x.no) + "</a>" : "") + "</span></div>"; }).join("") + "</div>";
    });
  }

  boot();
})();
