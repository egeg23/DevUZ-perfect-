/* Вырезка фона упаковки прямо в браузере менеджера.
   Движок — ONNX Runtime Web, модель — silueta из rembg (u2net 320×320):
   оба файла лежат на сервере компании (/admin/cut/, кладёт сборка
   deploy/cut-assets.sh), фото никуда не уходит, пока его не сохранили.
   Дальше то же, что делали руками для каталога: берём самый крупный предмет
   (стол, люди и полки по краям отпадают), коробку заливаем по внешнему
   контуру (белая коробка не становится дырявой), обрезаем по краю упаковки
   без полей и отдаём WebP до 960 px. Наклон поправляется ползунком. */
(function () {
  "use strict";
  var ORT = "/admin/cut/ort-1.30.0/", MODEL = "/admin/cut/silueta-75da6c8d.onnx", N = 320, MAX_SRC = 2000, OUT_W = 960, OUT_H = 1400;
  var session = null, loading = null;

  function script(src) {
    return new Promise(function (ok, no) {
      if (window.ort) return ok();
      var s = document.createElement("script"); s.src = src; s.onload = function () { ok(); }; s.onerror = function () { no(new Error("Не загрузился движок вырезки, обновите страницу")); };
      document.head.appendChild(s);
    });
  }
  /* Модель — 44 МБ: показываем, сколько скачалось; второй раз она из кэша. */
  function fetchModel(onStep) {
    return fetch(MODEL, { credentials: "same-origin" }).then(function (r) {
      if (!r.ok) throw new Error("Модель вырезки не нашлась на сервере");
      var total = +r.headers.get("Content-Length") || 0;
      if (!r.body || !total) return r.arrayBuffer();
      var reader = r.body.getReader(), got = 0, parts = [];
      return (function pump() {
        return reader.read().then(function (x) {
          if (x.done) { var buf = new Uint8Array(got), o = 0; parts.forEach(function (p) { buf.set(p, o); o += p.length; }); return buf.buffer; }
          parts.push(x.value); got += x.value.length; onStep && onStep("Готовим вырезку: " + Math.round(got / total * 100) + "%");
          return pump();
        });
      })();
    });
  }
  function ready(onStep) {
    if (session) return Promise.resolve(session);
    if (loading) return loading;
    onStep && onStep("Готовим вырезку…");
    loading = script(ORT + "ort.wasm.min.js").then(function () {
      window.ort.env.wasm.wasmPaths = ORT;
      window.ort.env.wasm.numThreads = 1;
      return fetchModel(onStep);
    }).then(function (buf) {
      onStep && onStep("Запускаем модель…");
      return window.ort.InferenceSession.create(buf, { executionProviders: ["wasm"], graphOptimizationLevel: "all" });
    }).then(function (s) { session = s; return s; }, function (e) { loading = null; throw e; });
    return loading;
  }

  function canvas(w, h) { var c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
  /* Фото с телефона — с поворотом из EXIF; большие уменьшаем до 2000 px. */
  function decode(file) {
    var src = window.createImageBitmap ? createImageBitmap(file, { imageOrientation: "from-image" }).catch(function () { return viaImg(file); }) : viaImg(file);
    return src.then(function (bmp) {
      var k = Math.min(1, MAX_SRC / Math.max(bmp.width, bmp.height)), w = Math.max(1, Math.round(bmp.width * k)), h = Math.max(1, Math.round(bmp.height * k));
      var c = canvas(w, h); c.getContext("2d").drawImage(bmp, 0, 0, w, h); return c;
    });
  }
  function viaImg(file) {
    return new Promise(function (ok, no) {
      var r = new FileReader();
      r.onload = function () { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = function () { no(new Error("Фото не открылось: нужен JPG, PNG или WebP")); }; i.src = r.result; };
      r.onerror = function () { no(new Error("Фото не прочиталось")); }; r.readAsDataURL(file);
    });
  }

  /* Уже без фона (PNG/WebP с прозрачностью) — модель не нужна. */
  function hasAlpha(c) {
    var d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data, n = 0;
    for (var i = 3; i < d.length; i += 16) if (d[i] < 200) n++;
    return n > d.length / 16 * 0.02;
  }

  function maskOf(src, onStep) {
    return ready(onStep).then(function (s) {
      onStep && onStep("Убираем фон…");
      var c = canvas(N, N), x = c.getContext("2d"); x.drawImage(src, 0, 0, N, N);
      var d = x.getImageData(0, 0, N, N).data, t = new Float32Array(3 * N * N), mean = [0.485, 0.456, 0.406], std = [0.229, 0.224, 0.225];
      for (var i = 0; i < N * N; i++) for (var ch = 0; ch < 3; ch++) t[ch * N * N + i] = (d[i * 4 + ch] / 255 - mean[ch]) / std[ch];
      var feeds = {}; feeds[s.inputNames[0]] = new window.ort.Tensor("float32", t, [1, 3, N, N]);
      return s.run(feeds).then(function (out) {
        var m = out[s.outputNames[0]].data, lo = Infinity, hi = -Infinity, r = new Float32Array(N * N);
        for (var j = 0; j < m.length; j++) { if (m[j] < lo) lo = m[j]; if (m[j] > hi) hi = m[j]; }
        for (j = 0; j < m.length; j++) r[j] = (m[j] - lo) / (hi - lo + 1e-8);
        return r;
      });
    });
  }
  /* Маска из прозрачности готового PNG — тот же вид, что у модели. */
  function maskFromAlpha(src) {
    var c = canvas(N, N), x = c.getContext("2d"); x.drawImage(src, 0, 0, N, N);
    var d = x.getImageData(0, 0, N, N).data, r = new Float32Array(N * N);
    for (var i = 0; i < N * N; i++) r[i] = d[i * 4 + 3] / 255;
    return r;
  }

  /* Самый крупный связный предмет маски: стол, люди, полки по краям отпадают. */
  function largest(m) {
    var lab = new Int32Array(N * N), best = 0, bestN = 0, id = 0, st = [];
    for (var i = 0; i < N * N; i++) {
      if (m[i] < 0.5 || lab[i]) continue;
      id++; var n = 0; st.push(i); lab[i] = id;
      while (st.length) {
        var p = st.pop(), px = p % N, py = (p - px) / N; n++;
        var nb = [px > 0 ? p - 1 : -1, px < N - 1 ? p + 1 : -1, py > 0 ? p - N : -1, py < N - 1 ? p + N : -1];
        for (var k = 0; k < 4; k++) { var q = nb[k]; if (q >= 0 && !lab[q] && m[q] >= 0.5) { lab[q] = id; st.push(q); } }
      }
      if (n > bestN) { bestN = n; best = id; }
    }
    if (!best) return null;
    var keep = new Uint8Array(N * N); for (i = 0; i < N * N; i++) keep[i] = lab[i] === best ? 1 : 0;
    return keep;
  }
  /* Выпуклая оболочка точек предмета (монотонная цепь Эндрю). */
  function hull(keep) {
    var pts = [];
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) if (keep[y * N + x]) {
      var l = x === 0 || !keep[y * N + x - 1], r = x === N - 1 || !keep[y * N + x + 1], u = y === 0 || !keep[(y - 1) * N + x], d = y === N - 1 || !keep[(y + 1) * N + x];
      if (l || r || u || d) pts.push([x + 0.5, y + 0.5]);
    }
    pts.sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    function cross(o, a, b) { return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); }
    var lo = [], up = [];
    pts.forEach(function (p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); });
    for (var i = pts.length - 1; i >= 0; i--) { var p = pts[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    lo.pop(); up.pop(); return lo.concat(up);
  }

  /* Прозрачность в размере фото: ровный контур — залитая оболочка, чуть
     внутрь, чтобы не тянуть край фона; иначе — маска модели по предмету. */
  function alphaCanvas(src, m, box) {
    var w = src.width, h = src.height, keep = largest(m);
    if (!keep) throw new Error("На фото не нашлась упаковка. Снимите её крупнее, на однотонном фоне");
    var a = canvas(w, h), x = a.getContext("2d");
    if (box) {
      var poly = hull(keep), cx = 0, cy = 0; poly.forEach(function (p) { cx += p[0]; cy += p[1]; }); cx /= poly.length; cy /= poly.length;
      x.fillStyle = "#fff"; x.beginPath();
      poly.forEach(function (p, i) { var px = (cx + (p[0] - cx) * 0.992) * w / N, py = (cy + (p[1] - cy) * 0.992) * h / N; if (i) x.lineTo(px, py); else x.moveTo(px, py); });
      x.closePath(); x.fill();
      return a;
    }
    var mc = canvas(N, N), mx = mc.getContext("2d"), id = mx.createImageData(N, N);
    for (var i = 0; i < N * N; i++) { var v = keep[i] ? Math.max(0, Math.min(1, (m[i] - 0.2) / 0.6)) : 0; id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = 255; id.data[i * 4 + 3] = Math.round(v * 255); }
    mx.putImageData(id, 0, 0); x.imageSmoothingQuality = "high"; x.drawImage(mc, 0, 0, w, h); return a;
  }

  /* Склейка: фото × прозрачность, поворот, обрезка по краю, до 960 px. */
  function compose(src, alpha, deg) {
    var w = src.width, h = src.height, c = canvas(w, h), x = c.getContext("2d");
    x.drawImage(alpha, 0, 0); x.globalCompositeOperation = "source-in"; x.drawImage(src, 0, 0);
    var r = deg * Math.PI / 180, cs = Math.abs(Math.cos(r)), sn = Math.abs(Math.sin(r)), W = Math.ceil(w * cs + h * sn), H = Math.ceil(w * sn + h * cs);
    var rc = canvas(W, H), rx = rc.getContext("2d"); rx.translate(W / 2, H / 2); rx.rotate(r); rx.drawImage(c, -w / 2, -h / 2);
    var d = rx.getImageData(0, 0, W, H).data, x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (var y = 0; y < H; y++) for (var xx = 0; xx < W; xx++) if (d[(y * W + xx) * 4 + 3] > 24) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) throw new Error("После вырезки ничего не осталось. Попробуйте другое фото");
    var bw = x1 - x0 + 1, bh = y1 - y0 + 1, k = Math.min(1, OUT_W / bw, OUT_H / bh), ow = Math.max(1, Math.round(bw * k)), oh = Math.max(1, Math.round(bh * k));
    var o = canvas(ow, oh), ox = o.getContext("2d"); ox.imageSmoothingQuality = "high"; ox.drawImage(rc, x0, y0, bw, bh, 0, 0, ow, oh);
    return o;
  }

  function toData(c) {
    var d = c.toDataURL("image/webp", 0.9);
    return d.indexOf("data:image/webp") === 0 ? d : c.toDataURL("image/png");
  }

  /* Снаружи: open(file) → { draw(opts) → canvas, data(opts) → dataURL }. */
  function open(file, onStep) {
    return decode(file).then(function (src) {
      var cut = !hasAlpha(src);
      return (cut ? maskOf(src, onStep) : Promise.resolve(maskFromAlpha(src))).then(function (m) {
        var cache = {};
        function alpha(box) { return cache[box] || (cache[box] = alphaCanvas(src, m, box)); }
        return {
          already: !cut,
          draw: function (o) { return o.raw ? compose(src, plain(src), o.deg || 0) : compose(src, alpha(!!o.box), o.deg || 0); },
          data: function (o) { return toData(this.draw(o)); },
        };
      });
    });
  }
  function plain(src) { var a = canvas(src.width, src.height), x = a.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, a.width, a.height); return a; }

  window.CFCut = { open: open, warm: function (onStep) { return ready(onStep); } };
})();
