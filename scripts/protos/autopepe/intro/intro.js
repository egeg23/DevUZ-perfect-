/* Заставка AutoPepe (задание владельца DevUz, 29.10.2026: «Залёт камерой в
   бренд в хиро секции после промо нашей студии»). Механика — от Neoline и
   CHECHFARM: камера низко летит вдоль букв AutoPepe, лакированных, как
   кузов после их лакировки, над ними проходят лампы покрасочной камеры, по
   лаку бегут их отражения; камера отъезжает, буквы встают в слово, и логотип
   садится в шапку. Идёт после видео DevUz, раз за визит (?intro=1 — ещё раз,
   &apt=2.5 — замереть на этой секунде для снимков).

   Сборка: build.mjs → public/protos/autopepe/intro3d.js (three.js внутри).
   Отражения — студия, собранная кодом (RoomEnvironment), без картинок.
   3D раскладывается по живому логотипу шапки (его размеры меряются),
   поэтому в конце подмена незаметна. Прокрутку страницы не трогает: колесо,
   касание, клавиша, нажатие — пропуск. Сбой — оверлей снимается. */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, MeshPhysicalMaterial, MeshBasicMaterial,
  ExtrudeGeometry, PlaneGeometry, CircleGeometry, Vector3, Color, Fog, PMREMGenerator,
  ACESFilmicToneMapping, SRGBColorSpace, DirectionalLight, PointLight, BufferGeometry,
  Float32BufferAttribute, Points, PointsMaterial, AdditiveBlending, CanvasTexture, Box3,
} from "three";
import { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import ARC from "./arc.json";

(function () {
  var box = document.getElementById("api");
  if (!box || !window.apiOff) return;
  var cv = box.querySelector("canvas");
  var off = window.apiOff, ended = false;
  function fail() { if (ended) return; ended = true; off(); }
  setTimeout(function () { if (!window.apiOn) fail(); }, 15000);

  var arc = new Font(ARC);
  var RED = "#e3140c", DEEP = "#0b0c0e";

  /* Логотип шапки в em слова: всё 3D раскладывается по нему. */
  function measure() {
    var logo = document.querySelector(".top .logo"), b = logo && logo.querySelector(".word");
    if (!b) return null;
    var R = b.getBoundingClientRect();
    if (!R.width) return null;
    var fs = parseFloat(getComputedStyle(b).fontSize), cx = R.left + R.width / 2, cy = R.top + R.height / 2;
    return { logo: logo, b: b, fs: fs, word: { x: 0, y: 0, w: R.width / fs, h: R.height / fs }, cx: cx, cy: cy };
  }
  var M = measure() || { word: { x: 0, y: 0, w: 4.6, h: 1.2 } };

  function glyph(ch, size, depth) {
    var g = new ExtrudeGeometry(arc.generateShapes(ch, size), {
      depth: depth, curveSegments: 12, bevelEnabled: true,
      bevelThickness: size * 0.04, bevelSize: size * 0.022, bevelSegments: 6,
    });
    g.translate(0, 0, -depth);
    return g;
  }
  function baseline(h) {
    var a = arc.data.ascender / 1000, d = arc.data.descender / 1000;
    return h / 2 - ((h - (a - d)) / 2 + a);
  }

  var renderer;
  try {
    renderer = new WebGLRenderer({ canvas: cv, antialias: true, alpha: false, powerPreference: "high-performance" });
  } catch (e) { fail(); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, innerWidth < 700 ? 1.75 : 2));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.outputColorSpace = SRGBColorSpace;

  var scene = new Scene();
  scene.background = new Color(DEEP);
  scene.fog = new Fog(DEEP, 5, 18);
  var cam = new PerspectiveCamera(58, 1, 0.05, 60);
  var pm = new PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.03).texture;

  /* «Auto» — их красный лак с прозрачным слоем, «Pepe» — белый перламутр. */
  var mRed = new MeshPhysicalMaterial({ color: "#b00804", metalness: 0.2, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 0.55 });
  var mWhite = new MeshPhysicalMaterial({ color: "#e9eaec", metalness: 0.1, roughness: 0.34, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 0.5, iridescence: 0.2, iridescenceIOR: 1.3 });

  var WORD = "AutoPepe", DEPTH = 0.4;
  var word = new Group(), letters = [];
  var bw0 = 0;
  WORD.split("").forEach(function (ch) { bw0 += arc.data.glyphs[ch].ha / 1000; });
  var sz = M.word.w / bw0;
  var pen = M.word.x - M.word.w / 2, base = M.word.y + baseline(M.word.h / sz) * sz;
  WORD.split("").forEach(function (ch, i) {
    var m = new Mesh(glyph(ch, sz, DEPTH), i < 4 ? mRed : mWhite);
    m.position.set(pen, base, 0);
    m.userData.x = pen;
    word.add(m); letters.push(m);
    pen += (arc.data.glyphs[ch].ha / 1000) * sz;
  });
  scene.add(word);
  var bb = new Box3().setFromObject(word);
  var xl = bb.min.x, xr = bb.max.x, top = bb.max.y, bot = bb.min.y;
  var floorY = bot - 0.02;

  /* Лампы покрасочной камеры: длинные полосы света над буквами, плывут
     навстречу камере; их отражение и бежит по лаку. */
  var bars = [];
  for (var i = 0; i < 9; i++) {
    var bm = new Mesh(new PlaneGeometry(0.16, 9), new MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.95, depthWrite: false }));
    bm.rotation.x = Math.PI / 2; bm.rotation.z = Math.PI / 2;
    bm.position.set(xl - 2 + i * 1.1, top + 2.4, -0.4);
    scene.add(bm); bars.push(bm);
  }
  /* Пол — тёмный глянец с размытым отражением ламп. */
  var fc = document.createElement("canvas");
  fc.width = fc.height = 512;
  var fx = fc.getContext("2d"), fg = fx.createRadialGradient(256, 256, 20, 256, 256, 256);
  fg.addColorStop(0, "rgba(227,20,12,.28)"); fg.addColorStop(0.45, "rgba(227,20,12,.06)"); fg.addColorStop(1, "rgba(227,20,12,0)");
  fx.fillStyle = fg; fx.fillRect(0, 0, 512, 512);
  var glowT = new CanvasTexture(fc); glowT.colorSpace = SRGBColorSpace;
  var glow = new Mesh(new PlaneGeometry(14, 6), new MeshBasicMaterial({ map: glowT, transparent: true, depthWrite: false, blending: AdditiveBlending }));
  glow.rotation.x = -Math.PI / 2; glow.position.set((xl + xr) / 2, floorY + 0.002, 0);
  scene.add(glow);
  var floor = new Mesh(new CircleGeometry(30, 64), new MeshBasicMaterial({ color: "#0a0b0d" }));
  floor.rotation.x = -Math.PI / 2; floor.position.set((xl + xr) / 2, floorY, 0);
  scene.add(floor);

  /* Пыль в свете ламп: мелкая, тёплая. */
  var N = 520, pos = new Float32Array(N * 3);
  for (var j = 0; j < N; j++) {
    pos[j * 3] = xl - 5 + Math.random() * (xr - xl + 10);
    pos[j * 3 + 1] = floorY + Math.random() * 4;
    pos[j * 3 + 2] = -6 + Math.random() * 8;
  }
  var dg = new BufferGeometry();
  dg.setAttribute("position", new Float32BufferAttribute(pos, 3));
  var dc = document.createElement("canvas");
  dc.width = dc.height = 32;
  var dx = dc.getContext("2d"), dgr = dx.createRadialGradient(16, 16, 0, 16, 16, 16);
  dgr.addColorStop(0, "rgba(255,255,255,1)"); dgr.addColorStop(0.4, "rgba(255,255,255,.45)"); dgr.addColorStop(1, "rgba(255,255,255,0)");
  dx.fillStyle = dgr; dx.fillRect(0, 0, 32, 32);
  var dust = new Points(dg, new PointsMaterial({ color: "#ffd9c8", size: 0.024, map: new CanvasTexture(dc), transparent: true, opacity: 0.5, blending: AdditiveBlending, depthWrite: false }));
  scene.add(dust);

  var key = new DirectionalLight("#fff6ee", 1.1); key.position.set(-3, 6, 5); scene.add(key);
  var rim = new DirectionalLight("#ff4a3a", 2.2); rim.position.set(4, 2, -6); scene.add(rim);
  var glint = new PointLight("#ffffff", 4, 3, 2); scene.add(glint);
  var front = new DirectionalLight("#ffffff", 0); scene.add(front); scene.add(front.target);

  var cxL = (xl + xr) / 2, cyL = (top + bot) / 2, bw = xr - xl;
  var FOV0 = 60, FOV1 = 26, W = 1, H = 1, D = 10;
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
  function back(t) { var c = 1.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
  var T_FLY = 3.2, T_PULL = 2.1, T_END = 5.9;
  var portrait = H > W;
  var flyY = top + (portrait ? 0.95 : 0.6), flyZ = portrait ? 1.8 : 1.2;
  var x0 = xl - 1.0, x1 = xr - 0.4;
  var P1 = new Vector3(x1, flyY, flyZ), L1 = new Vector3(Math.min(x1 + 1.6, xr - 0.2), top - 0.35, -0.3);
  var tmp = new Vector3(), look = new Vector3();
  function place(t) {
    if (t < T_FLY) {
      var k = sine(t / T_FLY), x = x0 + (x1 - x0) * k;
      cam.position.set(x, flyY + Math.sin(k * Math.PI) * 0.1, flyZ);
      look.set(Math.min(x + 1.6, xr - 0.2), top - 0.35, -0.3);
      cam.fov = FOV0;
      cam.up.set(Math.sin(k * Math.PI * 2) * 0.05, 1, 0).normalize();
    } else {
      var p = ease(clamp((t - T_FLY) / T_PULL)), q = 1 - p;
      var C = new Vector3(xr + 1.1, top + 2.0, D * 0.45), P2 = new Vector3(cxL, cyL, D);
      cam.position.set(
        q * q * P1.x + 2 * q * p * C.x + p * p * P2.x,
        q * q * P1.y + 2 * q * p * C.y + p * p * P2.y,
        q * q * P1.z + 2 * q * p * C.z + p * p * P2.z);
      look.copy(L1).lerp(tmp.set(cxL, cyL, 0), ease(clamp((t - T_FLY) / (T_PULL * 0.85))));
      cam.fov = FOV0 + (FOV1 - FOV0) * p;
      front.intensity = 2.0 * p;
      front.position.set(cxL - 2, cyL + 3, D);
      front.target.position.set(cxL, cyL, 0);
      scene.fog.near = 5 + p * D * 2; scene.fog.far = 18 + p * D * 4;
      cam.up.set(0, 1, 0);
    }
    cam.updateProjectionMatrix();
    cam.lookAt(look);
    glint.position.set(cam.position.x + 0.8, cam.position.y - 0.1, cam.position.z - 0.4);
    glint.intensity = t < T_FLY + 0.6 ? 4 : Math.max(0, 4 - (t - T_FLY - 0.6) * 4);

    /* Лампы плывут, к концу гаснут: остаётся чистый знак. */
    var calm = 1 - clamp((t - T_FLY - 0.9) / 1.2);
    bars.forEach(function (bm, i) {
      var span = xr - xl + 6;
      bm.position.x = xl - 3 + ((i * span / 9 - t * 1.6) % span + span) % span;
      bm.material.opacity = 0.7 * calm;
    });
    glow.material.opacity = 0.6 + 0.4 * (1 - calm);

    /* Буквы «садятся» по одной: лёгкий отскок, как деталь на место. */
    letters.forEach(function (m, i) {
      var lt = clamp((t - 0.12 * i) / 0.9), j = back(lt);
      m.position.y = base + (1 - j) * 0.9;
      m.rotation.x = (1 - lt) * -0.5;
      m.material.opacity = 1;
    });
    dust.rotation.y = t * 0.01;
  }

  var t0 = 0, skipAt = -1, raf = 0, handed = false;
  var freeze = /[?&]apt=([\d.]+)/.exec(location.search);
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
    c.className += " api-fly";
    c.style.cssText = "left:" + Lr.left + "px;top:" + Lr.top + "px;width:" + Lr.width + "px;height:" + Lr.height + "px;transform-origin:" + ox + "px " + oy + "px;transform:translate(" + (sx - Lr.left - ox) + "px," + (sy - Lr.top - oy) + "px) scale(" + s + ");opacity:0";
    document.body.appendChild(c);
    c.getBoundingClientRect();
    c.style.opacity = "1";
    setTimeout(function () {
      box.classList.add("out");
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
    if (freeze) { window.apiFrame = (window.apiFrame || 0) + 1; if (+freeze[1] >= T_END) handoff(); if (handed) return; raf = requestAnimationFrame(frame); return; }
    if (t >= T_END) { handoff(); if (handed) return; }
    raf = requestAnimationFrame(frame);
  }
  function start() {
    window.apiOn = true;
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
