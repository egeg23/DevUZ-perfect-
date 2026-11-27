/* QR-код для электронных визиток: без пакетов и без сети, считается в браузере.
   Байтовый режим, уровень коррекции M (до 15% повреждений), версии 1–10
   (адрес до 213 байт). Возвращает квадратную матрицу true/false и умеет SVG.
   Тот же файл грузит тест (tests/czechfarm-app.test.ts) и сверяет с эталоном. */
(function (root) {
  "use strict";
  /* Уровень M: [кодовых слов коррекции в блоке, [[блоков, данных в блоке], …]] */
  var EC = [null, [10, [[1, 16]]], [16, [[1, 28]]], [26, [[1, 44]]], [18, [[2, 32]]], [24, [[2, 43]]], [16, [[4, 27]]], [18, [[4, 31]]], [22, [[2, 38], [2, 39]]], [22, [[3, 36], [2, 37]]], [26, [[4, 43], [1, 44]]]];
  var ALIGN = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];

  /* Поле Галуа GF(256), многочлен 0x11d. */
  var EXP = new Array(512), LOG = new Array(256);
  (function () { var x = 1; for (var i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; } for (var j = 255; j < 512; j++) EXP[j] = EXP[j - 255]; })();
  function mul(a, b) { return a && b ? EXP[LOG[a] + LOG[b]] : 0; }
  function rsGen(n) { var g = [1]; for (var i = 0; i < n; i++) { var ng = new Array(g.length + 1).fill(0); for (var j = 0; j < g.length; j++) { ng[j] ^= g[j]; ng[j + 1] ^= mul(g[j], EXP[i]); } g = ng; } return g; }
  function rsRem(data, n) {
    var g = rsGen(n), r = data.concat(new Array(n).fill(0));
    for (var i = 0; i < data.length; i++) { var c = r[i]; if (c) for (var j = 1; j < g.length; j++) r[i + j] ^= mul(g[j], c); }
    return r.slice(data.length);
  }
  function utf8(s) { var out = [], b = unescape(encodeURIComponent(String(s))); for (var i = 0; i < b.length; i++) out.push(b.charCodeAt(i)); return out; }
  function dataCap(v) { return EC[v][1].reduce(function (s, g) { return s + g[0] * g[1]; }, 0); }

  function codewords(bytes, v) {
    var bits = [], put = function (val, n) { for (var i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
    put(4, 4); put(bytes.length, v < 10 ? 8 : 16); bytes.forEach(function (b) { put(b, 8); });
    var cap = dataCap(v) * 8;
    put(0, Math.min(4, cap - bits.length));
    while (bits.length % 8) bits.push(0);
    var data = []; for (var i = 0; i < bits.length; i += 8) { var x = 0; for (var k = 0; k < 8; k++) x = (x << 1) | bits[i + k]; data.push(x); }
    for (var p = 0; data.length < cap / 8; p++) data.push(p % 2 ? 0x11 : 0xec);
    var ec = EC[v][0], blocks = [], ecs = [], off = 0;
    EC[v][1].forEach(function (g) { for (var n = 0; n < g[0]; n++) { var blk = data.slice(off, off + g[1]); off += g[1]; blocks.push(blk); ecs.push(rsRem(blk, ec)); } });
    var out = [], maxLen = Math.max.apply(null, blocks.map(function (b) { return b.length; }));
    for (var c = 0; c < maxLen; c++) blocks.forEach(function (b) { if (c < b.length) out.push(b[c]); });
    for (var e = 0; e < ec; e++) ecs.forEach(function (b) { out.push(b[e]); });
    return out;
  }

  function bch(val, gen, top) { var d = val << top; var gl = 31 - Math.clz32(gen); while (31 - Math.clz32(d) >= gl && d) d ^= gen << ((31 - Math.clz32(d)) - gl); return (val << top) | d; }
  var MASKS = [
    function (r, c) { return (r + c) % 2 === 0; }, function (r) { return r % 2 === 0; }, function (r, c) { return c % 3 === 0; }, function (r, c) { return (r + c) % 3 === 0; },
    function (r, c) { return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0; }, function (r, c) { return (r * c) % 2 + (r * c) % 3 === 0; },
    function (r, c) { return ((r * c) % 2 + (r * c) % 3) % 2 === 0; }, function (r, c) { return ((r + c) % 2 + (r * c) % 3) % 2 === 0; }
  ];

  function build(v, cw, mask) {
    var n = v * 4 + 17, m = [], fixed = [];
    for (var i = 0; i < n; i++) { m.push(new Array(n).fill(false)); fixed.push(new Array(n).fill(false)); }
    function set(r, c, on) { m[r][c] = on; fixed[r][c] = true; }
    function finder(r0, c0) { for (var r = -1; r <= 7; r++) for (var c = -1; c <= 7; c++) { var rr = r0 + r, cc = c0 + c; if (rr < 0 || cc < 0 || rr >= n || cc >= n) continue; var on = r >= 0 && r <= 6 && c >= 0 && c <= 6 && (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)); set(rr, cc, on); } }
    finder(0, 0); finder(0, n - 7); finder(n - 7, 0);
    for (var t = 8; t < n - 8; t++) { set(6, t, t % 2 === 0); set(t, 6, t % 2 === 0); }
    var al = ALIGN[v];
    var last = al.length - 1;
    al.forEach(function (ar, i) { al.forEach(function (ac, j) { if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return; for (var r = -2; r <= 2; r++) for (var c = -2; c <= 2; c++) set(ar + r, ac + c, Math.max(Math.abs(r), Math.abs(c)) !== 1); }); });
    set(n - 8, 8, true);
    /* Места под служебные биты (формат и версия) — до раскладки данных. */
    for (var f = 0; f < 9; f++) { if (!fixed[8][f]) fixed[8][f] = true; if (!fixed[f][8]) fixed[f][8] = true; }
    for (var g = 0; g < 8; g++) { fixed[8][n - 1 - g] = true; fixed[n - 1 - g][8] = true; }
    if (v >= 7) for (var a = 0; a < 6; a++) for (var b = 0; b < 3; b++) { fixed[n - 11 + b][a] = true; fixed[a][n - 11 + b] = true; }
    /* Данные змейкой снизу вверх по парам столбцов. */
    var bitIdx = 0, total = cw.length * 8, up = true;
    for (var col = n - 1; col > 0; col -= 2) {
      if (col === 6) col--;
      for (var k = 0; k < n; k++) {
        var row = up ? n - 1 - k : k;
        for (var dc = 0; dc < 2; dc++) {
          var cc = col - dc; if (fixed[row][cc]) continue;
          var on = bitIdx < total ? ((cw[bitIdx >> 3] >>> (7 - (bitIdx & 7))) & 1) === 1 : false;
          bitIdx++;
          if (MASKS[mask](row, cc)) on = !on;
          m[row][cc] = on;
        }
      }
      up = !up;
    }
    /* Формат: уровень M = 00, маска, BCH(15,5), XOR 0x5412. */
    var fmt = bch(mask, 0x537, 10) ^ 0x5412;
    for (var q = 0; q < 15; q++) {
      var bit = ((fmt >>> q) & 1) === 1;
      /* Первая копия — вокруг левого верхнего угла. */
      if (q < 6) m[q][8] = bit; else if (q === 6) m[7][8] = bit; else if (q === 7) m[8][8] = bit; else if (q === 8) m[8][7] = bit; else m[8][14 - q] = bit;
      /* Вторая — у правого верхнего и левого нижнего. */
      if (q < 8) m[8][n - 1 - q] = bit; else m[n - 15 + q][8] = bit;
    }
    if (v >= 7) {
      var ver = bch(v, 0x1f25, 12);
      for (var s = 0; s < 18; s++) { var vb = ((ver >>> s) & 1) === 1, r6 = Math.floor(s / 3), c3 = s % 3; m[n - 11 + c3][r6] = vb; m[r6][n - 11 + c3] = vb; }
    }
    return m;
  }

  function penalty(m) {
    var n = m.length, p = 0, r, c, k;
    for (var dir = 0; dir < 2; dir++) for (r = 0; r < n; r++) {
      var run = 1;
      for (c = 1; c < n; c++) { var a = dir ? m[c][r] : m[r][c], b = dir ? m[c - 1][r] : m[r][c - 1]; if (a === b) run++; else { if (run >= 5) p += run - 2; run = 1; } }
      if (run >= 5) p += run - 2;
    }
    for (r = 0; r < n - 1; r++) for (c = 0; c < n - 1; c++) { var x = m[r][c]; if (x === m[r][c + 1] && x === m[r + 1][c] && x === m[r + 1][c + 1]) p += 3; }
    var pat = [true, false, true, true, true, false, true, false, false, false, false], pat2 = pat.slice().reverse();
    for (r = 0; r < n; r++) for (c = 0; c <= n - 11; c++) for (var d2 = 0; d2 < 2; d2++) {
      var ok1 = true, ok2 = true;
      for (k = 0; k < 11; k++) { var val = d2 ? m[c + k][r] : m[r][c + k]; if (val !== pat[k]) ok1 = false; if (val !== pat2[k]) ok2 = false; }
      if (ok1) p += 40; if (ok2) p += 40;
    }
    var dark = 0; for (r = 0; r < n; r++) for (c = 0; c < n; c++) if (m[r][c]) dark++;
    p += Math.floor(Math.abs(dark * 20 - n * n * 10) / (n * n)) * 10;
    return p;
  }

  function qr(text, forceMask) {
    var bytes = utf8(text), v = 1;
    while (v <= 10 && dataCap(v) < bytes.length + (v < 10 ? 2 : 3)) v++;
    if (v > 10) throw new Error("Слишком длинный адрес для QR");
    var cw = codewords(bytes, v), best = null, bestP = Infinity;
    for (var mk = 0; mk < 8; mk++) {
      if (forceMask != null && mk !== forceMask) continue;
      var mm = build(v, cw, mk), pp = penalty(mm);
      if (pp < bestP) { bestP = pp; best = { version: v, mask: mk, matrix: mm }; }
    }
    return best;
  }

  /* SVG для печати: один путь, поля по 4 модуля, цвета на выбор. */
  function svg(text, opt) {
    opt = opt || {};
    var q = qr(text), n = q.matrix.length, pad = 4, d = "";
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.matrix[r][c]) d += "M" + (c + pad) + " " + (r + pad) + "h1v1h-1z";
    var s = n + pad * 2;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + s + " " + s + '" shape-rendering="crispEdges"' + (opt.size ? ' width="' + opt.size + '" height="' + opt.size + '"' : "") + '><rect width="' + s + '" height="' + s + '" fill="' + (opt.bg || "#fff") + '"/><path fill="' + (opt.fg || "#000") + '" d="' + d + '"/></svg>';
  }

  root.cfQr = { make: qr, svg: svg };
})(typeof window !== "undefined" ? window : globalThis);
