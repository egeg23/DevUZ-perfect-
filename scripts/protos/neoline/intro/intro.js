/* Заставка Neoline (задание владельца, 28.10.2026: «после промо нашей студии —
   залёт камерой в бренд»). Механика — от CHECHFARM (PR #599): пролёт камеры
   низко вдоль хромовых букв NEOLINE, по полу от знака расходятся радарные
   волны, камера отдаляется, знак «N» собирается из двух половин, и логотип
   встаёт на своё место в шапке. Идёт после видео DevUz, раз за визит
   (?intro=1 — ещё раз, &nlt=2.5 — замереть на этой секунде для снимков).

   Сборка: build.mjs → public/protos/neoline/intro3d.js (three.js внутри).
   Отражения — студия, собранная кодом (RoomEnvironment), без картинок.
   3D раскладывается по живому логотипу шапки (его размеры меряются),
   поэтому в конце подмена незаметна. Прокрутку страницы не трогает: колесо,
   касание, клавиша, нажатие — пропуск. Сбой — оверлей снимается. */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, MeshPhysicalMaterial, MeshBasicMaterial,
  ExtrudeGeometry, PlaneGeometry, RingGeometry, Shape, Vector3, Color, Fog, PMREMGenerator,
  ACESFilmicToneMapping, SRGBColorSpace, DirectionalLight, PointLight, BufferGeometry,
  Float32BufferAttribute, Points, PointsMaterial, AdditiveBlending, CanvasTexture, Box3, DoubleSide,
} from "three";
import { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import UNB from "./unb.json";

(function () {
  var box = document.getElementById("nli");
  if (!box || !window.nliOff) return;
  var cv = box.querySelector("canvas");
  var off = window.nliOff, ended = false;
  function fail() { if (ended) return; ended = true; off(); }
  setTimeout(function () { if (!window.nliOn) fail(); }, 15000);

  var unb = new Font(UNB);
  var WORD = "NEOLINE", TRACK = 0.04;
  var CYAN = "#00abeb", CYAN2 = "#6fd8ff", DEEP = "#05080c";

  /* Логотип шапки в em слова: всё 3D раскладывается по нему. */
  function measure() {
    var logo = document.querySelector(".top .logo"), b = logo && logo.querySelector(".word");
    if (!b) return null;
    var R = b.getBoundingClientRect();
    if (!R.width) return null;
    var fs = parseFloat(getComputedStyle(b).fontSize), cx = R.left + R.width / 2, cy = R.top + R.height / 2;
    function rel(r) { return { x: (r.left + r.width / 2 - cx) / fs, y: -(r.top + r.height / 2 - cy) / fs, w: r.width / fs, h: r.height / fs }; }
    var mk = logo.querySelector(".mk");
    return { logo: logo, b: b, fs: fs, word: rel(R), mk: mk ? rel(mk.getBoundingClientRect()) : null };
  }
  var M = measure() || { word: { x: 0, y: 0, w: 6.2, h: 1.2 }, mk: { x: -4.2, y: 0, w: 1.6, h: 1.1 } };

  var gcache = {};
  function glyph(ch, size, depth) {
    var k = ch + size;
    if (gcache[k]) return gcache[k];
    var g = new ExtrudeGeometry(unb.generateShapes(ch, size), {
      depth: depth, curveSegments: 10, bevelEnabled: true,
      bevelThickness: size * 0.035, bevelSize: size * 0.02, bevelSegments: 5,
    });
    g.translate(0, 0, -depth);
    g.computeBoundingBox();
    return (gcache[k] = g);
  }
  function baseline(h) {
    var a = unb.data.ascender / 1000, d = unb.data.descender / 1000;
    return h / 2 - ((h - (a - d)) / 2 + a);
  }

  var renderer;
  try {
    renderer = new WebGLRenderer({ canvas: cv, antialias: true, alpha: false, powerPreference: "high-performance" });
  } catch (e) { fail(); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, innerWidth < 700 ? 1.7 : 2));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = SRGBColorSpace;

  var scene = new Scene();
  scene.background = new Color(DEEP);
  scene.fog = new Fog(DEEP, 5, 18);
  var cam = new PerspectiveCamera(58, 1, 0.05, 60);
  var pm = new PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;

  /* Буквы — тёмный хром, знак — их голубой с лаком. */
  var mWord = new MeshPhysicalMaterial({ color: "#8f9caa", metalness: 1, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.0 });
  var mMark = new MeshPhysicalMaterial({ color: CYAN, metalness: 0.1, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.05, emissive: CYAN, emissiveIntensity: 0.55, envMapIntensity: 0.6 });

  var word = new Group(), DEPTH = 0.42;
  var bw0 = 0;
  WORD.split("").forEach(function (ch) { bw0 += unb.data.glyphs[ch].ha / 1000 + TRACK; });
  bw0 -= TRACK;
  /* Слово шапки набрано тем же шрифтом: масштаб — по ширине. */
  var sz = M.word.w / bw0;
  var pen = M.word.x - M.word.w / 2, base = M.word.y + baseline(M.word.h / sz) * sz;
  WORD.split("").forEach(function (ch) {
    var m = new Mesh(glyph(ch, sz, DEPTH), mWord);
    m.position.set(pen, base, 0);
    word.add(m);
    pen += (unb.data.glyphs[ch].ha / 1000 + TRACK) * sz;
  });
  scene.add(word);
  var bb = new Box3().setFromObject(word);
  var xl = bb.min.x, xr = bb.max.x, top = bb.max.y, bot = bb.min.y;

  /* Знак: две половины «N» по их SVG (viewBox 5 8 69.5 47). */
  var mk = M.mk || { x: xl - 1.3, y: 0, w: 1.6, h: 1.1 }, u = mk.w / 69.5;
  function half(pts) {
    var s = new Shape();
    pts.forEach(function (p, i) { var x = (p[0] - 39.85) * u, y = -(p[1] - 31.45) * u; if (i) s.lineTo(x, y); else s.moveTo(x, y); });
    s.closePath();
    var g = new ExtrudeGeometry(s, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.018, bevelSegments: 4 });
    g.translate(0, 0, -0.16);
    return new Mesh(g, mMark);
  }
  var hA = half([[58.6, 8], [58.6, 19.9], [46.8, 31.7], [46.8, 19.9], [39.2, 19.9], [21.1, 38], [5.2, 38], [13.1, 30], [35.1, 8]]);
  var hB = half([[21, 54.9], [21, 43], [32.8, 31.2], [32.8, 43], [40.5, 43], [58.5, 24.9], [74.5, 24.9], [66.5, 32.9], [44.5, 54.9]]);
  var mark3 = new Group();
  mark3.position.set(mk.x, mk.y, 0);
  mark3.add(hA, hB);
  scene.add(mark3);
  mark3.visible = false;

  /* Пол-дорога и радарные волны от знака: то, ради чего покупают X-COP. */
  var floorY = bot - 0.02;
  var rc = document.createElement("canvas");
  rc.width = rc.height = 512;
  var rx = rc.getContext("2d");
  var rg = rx.createRadialGradient(256, 256, 180, 256, 256, 256);
  rg.addColorStop(0, "rgba(0,171,235,0)"); rg.addColorStop(0.82, "rgba(111,216,255,.9)"); rg.addColorStop(0.9, "rgba(0,171,235,.35)"); rg.addColorStop(1, "rgba(0,171,235,0)");
  rx.fillStyle = rg; rx.fillRect(0, 0, 512, 512);
  var ringT = new CanvasTexture(rc); ringT.colorSpace = SRGBColorSpace;
  var rings = [];
  for (var ri = 0; ri < 4; ri++) {
    var rm = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: ringT, transparent: true, depthWrite: false, blending: AdditiveBlending, side: DoubleSide, opacity: 0 }));
    rm.rotation.x = -Math.PI / 2;
    rm.position.set(mk.x, floorY, -0.2);
    scene.add(rm); rings.push(rm);
  }
  /* Линии разметки, бегущие под камерой: чувство скорости. */
  var lane = [];
  for (var li = 0; li < 14; li++) {
    var lm = new Mesh(new PlaneGeometry(0.5, 0.025), new MeshBasicMaterial({ color: CYAN2, transparent: true, opacity: 0.5, depthWrite: false, blending: AdditiveBlending }));
    lm.rotation.x = -Math.PI / 2;
    lm.position.set(xl - 3 + li * ((xr - xl + 6) / 14), floorY, 0.9);
    scene.add(lm); lane.push(lm);
  }
  var glossy = new Mesh(new RingGeometry(0.001, 30, 64), new MeshBasicMaterial({ color: "#0a1118", transparent: true, opacity: 0.9 }));
  glossy.rotation.x = -Math.PI / 2;
  glossy.position.set((xl + xr) / 2, floorY - 0.01, 0);
  scene.add(glossy);

  /* Искры в воздухе. */
  var N = 650, pos = new Float32Array(N * 3);
  for (var i = 0; i < N; i++) {
    pos[i * 3] = xl - 5 + Math.random() * (xr - xl + 10);
    pos[i * 3 + 1] = floorY + Math.random() * 5;
    pos[i * 3 + 2] = -7 + Math.random() * 9;
  }
  var dg = new BufferGeometry();
  dg.setAttribute("position", new Float32BufferAttribute(pos, 3));
  var dc = document.createElement("canvas");
  dc.width = dc.height = 32;
  var dx = dc.getContext("2d"), dgr = dx.createRadialGradient(16, 16, 0, 16, 16, 16);
  dgr.addColorStop(0, "rgba(255,255,255,1)"); dgr.addColorStop(0.4, "rgba(255,255,255,.5)"); dgr.addColorStop(1, "rgba(255,255,255,0)");
  dx.fillStyle = dgr; dx.fillRect(0, 0, 32, 32);
  var dust = new Points(dg, new PointsMaterial({ color: CYAN2, size: 0.028, map: new CanvasTexture(dc), transparent: true, opacity: 0.55, blending: AdditiveBlending, depthWrite: false }));
  scene.add(dust);

  var key = new DirectionalLight("#eaf6ff", 1.3); key.position.set(-3, 6, 5); scene.add(key);
  var rim = new DirectionalLight(CYAN, 1.6); rim.position.set(4, 2, -6); scene.add(rim);
  var glint = new PointLight(CYAN2, 8, 4.5, 2); scene.add(glint);
  var front = new DirectionalLight("#ffffff", 0); scene.add(front); scene.add(front.target);

  var all = new Box3().setFromObject(word);
  all.expandByPoint(new Vector3(mk.x - mk.w / 2, mk.y - mk.w / 2, 0));
  all.expandByPoint(new Vector3(mk.x + mk.w / 2, mk.y + mk.w / 2, 0));
  var cxL = (all.min.x + all.max.x) / 2, cyL = (all.min.y + all.max.y) / 2, bw = all.max.x - all.min.x;
  var FOV0 = 62, FOV1 = 26, W = 1, H = 1, D = 10;
  function size() {
    W = innerWidth; H = innerHeight;
    renderer.setSize(W, H, false);
    cam.aspect = W / H;
    var ppu = Math.min((W * 0.74) / bw, 1000 / bw);
    D = H / 2 / (Math.tan((FOV1 * Math.PI) / 360) * ppu);
    cam.far = Math.max(60, D * 3);
  }
  size();
  addEventListener("resize", size);

  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function sine(t) { return 0.5 - Math.cos(Math.PI * t) / 2; }
  function clamp(t) { return t < 0 ? 0 : t > 1 ? 1 : t; }
  function back(t) { var c = 1.5; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
  var T_FLY = 3.3, T_PULL = 2.0, T_MARK = 4.1, T_END = 6.1;
  var portrait = H > W;
  var flyY = top + (portrait ? 1.0 : 0.62), flyZ = portrait ? 1.9 : 1.25;
  var x0 = xl - 1.0, x1 = xr - 0.5;
  var P1 = new Vector3(x1, flyY, flyZ), L1 = new Vector3(Math.min(x1 + 1.6, xr - 0.2), top - 0.35, -0.3);
  var tmp = new Vector3(), look = new Vector3();
  function place(t) {
    if (t < T_FLY) {
      var k = sine(t / T_FLY), x = x0 + (x1 - x0) * k;
      cam.position.set(x, flyY + Math.sin(k * Math.PI) * 0.1, flyZ);
      look.set(Math.min(x + 1.6, xr - 0.2), top - 0.35, -0.3);
      cam.fov = FOV0;
      cam.up.set(Math.sin(k * Math.PI * 2) * 0.06, 1, 0).normalize();
    } else {
      var p = ease(clamp((t - T_FLY) / T_PULL)), q = 1 - p;
      var C = new Vector3(xr + 1.1, top + 2.2, D * 0.45), P2 = new Vector3(cxL, cyL, D);
      cam.position.set(
        q * q * P1.x + 2 * q * p * C.x + p * p * P2.x,
        q * q * P1.y + 2 * q * p * C.y + p * p * P2.y,
        q * q * P1.z + 2 * q * p * C.z + p * p * P2.z);
      look.copy(L1).lerp(tmp.set(cxL, cyL, 0), ease(clamp((t - T_FLY) / (T_PULL * 0.85))));
      cam.fov = FOV0 + (FOV1 - FOV0) * p;
      front.intensity = 2.2 * p;
      front.position.set(cxL - 2, cyL + 3, D);
      front.target.position.set(cxL, cyL, 0);
      scene.fog.near = 5 + p * D * 2; scene.fog.far = 18 + p * D * 4;
      cam.up.set(0, 1, 0);
    }
    cam.updateProjectionMatrix();
    cam.lookAt(look);
    glint.position.set(cam.position.x + 0.8, cam.position.y - 0.1, cam.position.z - 0.4);
    glint.intensity = t < T_FLY + 0.6 ? 8 : Math.max(0, 8 - (t - T_FLY - 0.6) * 7);

    /* Волны: каждые 1,1 с новая, расходится и гаснет; к концу стихают. */
    var calm = 1 - clamp((t - T_FLY - 1.2) / 1.2);
    rings.forEach(function (rm, i) {
      var ph = ((t + i * 1.1) % 4.4) / 4.4, s = 0.6 + ph * 16;
      rm.scale.set(s, s, 1);
      rm.material.opacity = (1 - ph) * 0.8 * calm * clamp(t / 0.4);
    });
    lane.forEach(function (lm, i) {
      var span = xr - xl + 6;
      lm.position.x = xl - 3 + ((i * span / 14 - t * 2.6) % span + span) % span;
      lm.material.opacity = 0.5 * calm;
    });

    /* Знак: половины летят навстречу по диагонали и защёлкиваются. */
    var mt = clamp((t - T_MARK) / 1.1);
    mark3.visible = t >= T_MARK;
    var j = back(mt);
    hA.position.set((1 - j) * 2.4, (1 - j) * 1.6, 0); hB.position.set(-(1 - j) * 2.4, -(1 - j) * 1.6, 0);
    hA.rotation.y = (1 - mt) * 3.2; hB.rotation.y = -(1 - mt) * 3.2;
    mark3.position.z = -(1 - ease(mt)) * 1.4;
    dust.rotation.y = t * 0.012;
  }

  var t0 = 0, skipAt = -1, raf = 0, handed = false;
  var freeze = /[?&]nlt=([\d.]+)/.exec(location.search);
  function handoff() {
    if (handed) return; handed = true;
    var m = measure();
    if (!m) { finish(); return; }
    var o = new Vector3(M.word.x, M.word.y, 0).project(cam), q = new Vector3(M.word.x + 1, M.word.y, 0).project(cam);
    var sx = ((o.x + 1) / 2) * W, sy = ((1 - o.y) / 2) * H, ppu = ((q.x + 1) / 2) * W - sx;
    var s = ppu / m.fs, Lr = m.logo.getBoundingClientRect(), Br = m.b.getBoundingClientRect();
    var ox = Br.left + Br.width / 2 - Lr.left, oy = Br.top + Br.height / 2 - Lr.top;
    var c = m.logo.cloneNode(true);
    c.removeAttribute("href"); c.removeAttribute("id"); c.setAttribute("aria-hidden", "true");
    c.className += " nli-fly";
    c.style.cssText = "left:" + Lr.left + "px;top:" + Lr.top + "px;width:" + Lr.width + "px;height:" + Lr.height + "px;transform-origin:" + ox + "px " + oy + "px;transform:translate(" + (sx - Lr.left - ox) + "px," + (sy - Lr.top - oy) + "px) scale(" + s + ");opacity:0";
    document.body.appendChild(c);
    c.getBoundingClientRect();
    c.style.opacity = "1";
    setTimeout(function () {
      box.classList.add("out");
      c.classList.add("lnd");
      c.style.transform = "none";
      setTimeout(finish, 1000);
      setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 1100);
    }, 260);
  }
  function finish() {
    if (ended) return; ended = true;
    cancelAnimationFrame(raf);
    off();
    try { renderer.dispose(); } catch (e) {}
  }
  function skip() { if (skipAt < 0 && !handed) skipAt = 1; }
  function frame(now) {
    if (!t0) t0 = now;
    var t = freeze ? +freeze[1] : (now - t0) / 1000;
    if (skipAt > 0) { t = T_END; t0 = now - T_END * 1000; skipAt = 0; }
    place(Math.min(t, T_END));
    renderer.render(scene, cam);
    if (freeze) { window.nliFrame = (window.nliFrame || 0) + 1; if (+freeze[1] >= T_END) handoff(); if (handed) return; raf = requestAnimationFrame(frame); return; }
    if (t >= T_END) { handoff(); if (handed) return; }
    raf = requestAnimationFrame(frame);
  }
  function start() {
    window.nliOn = true;
    box.classList.add("on");
    ["wheel", "touchmove", "keydown"].forEach(function (e) { addEventListener(e, skip, { passive: true, once: true }); });
    box.addEventListener("click", skip);
    raf = requestAnimationFrame(frame);
  }
  place(0);
  try { renderer.compile(scene, cam); } catch (e) {}
  (function wait() {
    if (ended) return;
    if (document.getElementById("dzi")) { setTimeout(wait, 120); return; }
    start();
  })();
})();
