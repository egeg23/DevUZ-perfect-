/**
 * Виджет ИИ-сотрудника для сайта клиента — одним файлом, без зависимостей.
 *
 * Встраивается строкой `<script src=".../api/ai-staff/widget.js?k=КЛЮЧ" async>`.
 * Рисуется в Shadow DOM: стили сайта клиента его не ломают, а его стили —
 * сайт. Язык — из `lang` страницы (uz → узбекский), или `data-lang` у тега.
 * Цвет — `data-color`. Переписка хранится у посетителя (последние 30
 * сообщений) и на сервере — по случайному id посетителя, без кук.
 *
 * Текст сообщений вставляется через textContent: ответ модели и слова
 * посетителя не исполняются как разметка.
 */
export const WIDGET_SCRIPT = `(function () {
  var me = document.currentScript || document.querySelector('script[src*="/api/ai-staff/widget.js"]');
  if (!me || window.__aiStaffWidget) return;
  window.__aiStaffWidget = true;
  var src = new URL(me.src);
  var key = src.searchParams.get("k");
  if (!key) return;
  var api = src.origin + "/api/ai-staff/widget";
  var lang = (me.getAttribute("data-lang") || document.documentElement.lang || "ru").slice(0, 2) === "uz" ? "uz" : "ru";
  var color = me.getAttribute("data-color") || "#0f766e";
  var T = {
    ru: { open: "Задать вопрос", title: "ИИ-помощник", ph: "Напишите сообщение", send: "Отправить", hello: "Здравствуйте! Подскажу по ценам и наличию. Что вас интересует?", err: "Не получилось отправить. Попробуйте ещё раз.", close: "Закрыть" },
    uz: { open: "Savol berish", title: "Sun'iy intellekt yordamchisi", ph: "Xabar yozing", send: "Yuborish", hello: "Assalomu alaykum! Narxlar va mavjudligi bo'yicha yordam beraman. Sizni nima qiziqtiradi?", err: "Yuborilmadi. Qaytadan urinib ko'ring.", close: "Yopish" }
  }[lang];

  function store(name, value) {
    try {
      if (value === undefined) return JSON.parse(localStorage.getItem("aiw:" + key + ":" + name) || "null");
      localStorage.setItem("aiw:" + key + ":" + name, JSON.stringify(value));
    } catch (e) { return null; }
  }
  var visitor = store("v");
  if (!visitor) {
    var bytes = new Uint8Array(12);
    (window.crypto || window.msCrypto).getRandomValues(bytes);
    visitor = "v" + Array.prototype.map.call(bytes, function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
    store("v", visitor);
  }
  var history = store("m") || [];

  fetch(api + "?k=" + encodeURIComponent(key)).then(function (r) { return r.ok ? r.json() : null; }).then(function (cfg) {
    if (cfg) mount(cfg);
  }).catch(function () {});

  function mount(cfg) {
    var host = document.createElement("div");
    host.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:2147483000";
    document.body.appendChild(host);
    var root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;
    var css = document.createElement("style");
    css.textContent = [
      ":host,*{box-sizing:border-box;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}",
      ".btn{background:" + color + ";color:#fff;border:0;border-radius:999px;padding:12px 18px;font-size:15px;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.18)}",
      ".box{display:none;flex-direction:column;width:min(360px,calc(100vw - 32px));height:min(520px,calc(100vh - 96px));background:#fff;color:#111;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.22);overflow:hidden;margin-bottom:12px}",
      ".box.on{display:flex}",
      ".head{background:" + color + ";color:#fff;padding:12px 14px;display:flex;justify-content:space-between;align-items:center}",
      ".head b{display:block;font-size:15px}.head small{opacity:.85;font-size:12px}",
      ".x{background:transparent;border:0;color:#fff;font-size:22px;cursor:pointer;line-height:1}",
      ".list{flex:1;overflow-y:auto;padding:12px;background:#f6f7f8}",
      ".m{max-width:85%;margin:6px 0;padding:8px 12px;border-radius:14px;font-size:14px;line-height:1.4;white-space:pre-wrap;word-wrap:break-word}",
      ".ai{background:#fff;border:1px solid #e5e7eb}.me{background:" + color + ";color:#fff;margin-left:auto}",
      ".dots{opacity:.6}",
      "form{display:flex;gap:8px;padding:10px;border-top:1px solid #e5e7eb}",
      "textarea{flex:1;resize:none;border:1px solid #d1d5db;border-radius:10px;padding:8px 10px;font-size:14px;height:40px;max-height:96px}",
      ".send{background:" + color + ";color:#fff;border:0;border-radius:10px;padding:0 14px;font-size:14px;cursor:pointer}"
    ].join("");
    root.appendChild(css);
    var box = document.createElement("div");
    box.className = "box";
    var head = document.createElement("div");
    head.className = "head";
    var who = document.createElement("div");
    var b = document.createElement("b");
    b.textContent = cfg.company || "";
    var s = document.createElement("small");
    s.textContent = (cfg.assistant ? cfg.assistant + ", " : "") + T.title;
    who.appendChild(b); who.appendChild(s);
    var x = document.createElement("button");
    x.className = "x"; x.type = "button"; x.setAttribute("aria-label", T.close); x.textContent = "×";
    head.appendChild(who); head.appendChild(x);
    var list = document.createElement("div");
    list.className = "list";
    var form = document.createElement("form");
    var input = document.createElement("textarea");
    input.placeholder = T.ph; input.maxLength = 2000;
    var send = document.createElement("button");
    send.className = "send"; send.type = "submit"; send.textContent = T.send;
    form.appendChild(input); form.appendChild(send);
    box.appendChild(head); box.appendChild(list); box.appendChild(form);
    var open = document.createElement("button");
    open.className = "btn"; open.type = "button"; open.textContent = T.open;
    root.appendChild(box); root.appendChild(open);

    function bubble(text, mine) {
      var d = document.createElement("div");
      d.className = "m " + (mine ? "me" : "ai");
      d.textContent = text;
      list.appendChild(d);
      list.scrollTop = list.scrollHeight;
      return d;
    }
    bubble(cfg.greeting || T.hello, false);
    history.forEach(function (h) { bubble(h.t, h.me); });
    function remember(t, mine) {
      history.push({ t: t, me: mine });
      history = history.slice(-30);
      store("m", history);
    }

    open.onclick = function () { box.classList.toggle("on"); if (box.classList.contains("on")) input.focus(); };
    x.onclick = function () { box.classList.remove("on"); };
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.onsubmit(e); }
    });
    var busy = false;
    form.onsubmit = function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text || busy) return;
      busy = true; input.value = "";
      bubble(text, true); remember(text, true);
      var wait = bubble("…", false); wait.className += " dots";
      fetch(api, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ key: key, visitor: visitor, text: text }) })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          wait.remove();
          if (data && data.reply) { bubble(data.reply, false); remember(data.reply, false); }
          else if (!data || data.error) bubble(T.err, false);
        })
        .catch(function () { wait.remove(); bubble(T.err, false); })
        .then(function () { busy = false; });
    };
  }
})();`;
