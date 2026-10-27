/* Заставка CZECHFARM alliance (владелец, 27.10.2026): пролёт камеры вдоль
   букв над ними, камера отдаляется, собирается логотип и встаёт на своё место
   в шапке. Идёт после видео DevUz, раз за визит (?intro=1 — ещё раз).

   Сборка: build.mjs → public/protos/chechfarm/intro3d.js (three.js внутри).
   Логотип в 3D раскладывается по живому логотипу шапки (его размеры
   меряются), поэтому в конце 3D-логотип и логотип шапки совпадают, и
   подмена незаметна. Прокрутку страницы не трогает: колесо, касание,
   клавиша, нажатие — пропуск. Сбой — оверлей снимается, сайт как обычно. */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, MeshPhysicalMaterial, MeshBasicMaterial,
  ExtrudeGeometry, LatheGeometry, PlaneGeometry, Shape, Vector2, Vector3, Color, Fog, PMREMGenerator,
  TextureLoader, EquirectangularReflectionMapping, ACESFilmicToneMapping, SRGBColorSpace,
  DirectionalLight, PointLight, BufferGeometry, Float32BufferAttribute, Points, PointsMaterial,
  AdditiveBlending, CanvasTexture, Box3,
} from "three";
import { Font } from "three/examples/jsm/loaders/FontLoader.js";
import LIT from "./lit.json";
import ONE from "./one.json";

(function () {
  var box = document.getElementById("cfi");
  if (!box || !window.cfiOff) return;
  var root = document.documentElement, cv = box.querySelector("canvas");
  var off = window.cfiOff, ended = false;
  function fail() { if (ended) return; ended = true; off(); }
  setTimeout(function () { if (!window.cfiOn) fail(); }, 15000);

  var lit = new Font(LIT), one = new Font(ONE);
  var WORD = "CZECHFARM", SMALL = "ALLIANCE", TRACK = 0.08;
  var TEAL = "#0b5a53", GOLD = "#b98a3a", GOLD2 = "#e5c98f", DEEP = "#071a18";

  /* Размеры логотипа шапки в em слова: всё 3D раскладывается по ним. */
  function measure() {
    var logo = document.querySelector("#top .logo"), b = logo && logo.querySelector(".word b");
    if (!b) return null;
    var R = b.getBoundingClientRect();
    if (!R.width) return null;
    var fs = parseFloat(getComputedStyle(b).fontSize), cx = R.left + R.width / 2, cy = R.top + R.height / 2;
    function rel(r) { return { x: (r.left + r.width / 2 - cx) / fs, y: -(r.top + r.height / 2 - cy) / fs, w: r.width / fs, h: r.height / fs }; }
    var mk = logo.querySelector(".mk"), ii = [].slice.call(logo.querySelectorAll(".word small i"));
    return {
      logo: logo, b: b, fs: fs, word: rel(R), mk: mk ? rel(mk.getBoundingClientRect()) : null,
      sm: ii.map(function (i) { return rel(i.getBoundingClientRect()); }),
      smFs: ii.length ? parseFloat(getComputedStyle(ii[0]).fontSize) / fs : 0.38,
    };
  }
  var M = measure() || {
    word: { x: 0, y: 0.26, w: 6.9, h: 1 }, mk: { x: -4.4, y: 0, w: 1.8, h: 1.8 },
    sm: SMALL.split("").map(function (c, i) { return { x: -3.2 + i * 0.914, y: -0.52, w: 0.3, h: 0.38 }; }), smFs: 0.38,
  };

  /* Буква: экструзия с фаской, лицевая сторона в z = 0. */
  var gcache = {};
  function glyph(font, ch, size, depth) {
    var k = font.data.familyName + ch + size;
    if (gcache[k]) return gcache[k];
    var g = new ExtrudeGeometry(font.generateShapes(ch, size), {
      depth: depth, curveSegments: 10, bevelEnabled: true,
      bevelThickness: size * 0.03, bevelSize: size * 0.018, bevelSegments: 4,
    });
    g.translate(0, 0, -depth);
    g.computeBoundingBox();
    return (gcache[k] = g);
  }
  /* Где базовая линия в блоке строки высотой h (em), шрифт с метриками f. */
  function baseline(f, h) {
    var a = f.data.ascender / 1000, d = f.data.descender / 1000;
    return h / 2 - ((h - (a - d)) / 2 + a);
  }

  var renderer;
  try {
    renderer = new WebGLRenderer({ canvas: cv, antialias: true, alpha: false, powerPreference: "high-performance" });
  } catch (e) { fail(); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, innerWidth < 700 ? 1.6 : 1.8));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = SRGBColorSpace;

  var scene = new Scene();
  scene.background = new Color(DEEP);
  scene.fog = new Fog(DEEP, 6, 20);
  var cam = new PerspectiveCamera(58, 1, 0.05, 60);

  /* Материалы: буквы — фарфор, ALLIANCE — золото, капсула — бирюза и золото. */
  var mWord = new MeshPhysicalMaterial({ color: "#f1ece1", roughness: 0.26, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.15 });
  var mSmall = new MeshPhysicalMaterial({ color: GOLD2, metalness: 0.6, roughness: 0.3, emissive: GOLD, emissiveIntensity: 0.35, envMapIntensity: 1.4, transparent: true, opacity: 0 });
  var mTeal = new MeshPhysicalMaterial({ color: TEAL, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.2 });
  var mGold = new MeshPhysicalMaterial({ color: GOLD, metalness: 0.85, roughness: 0.22, clearcoat: 1, envMapIntensity: 1.3 });
  var mLeaf = new MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.3, clearcoat: 1, envMapIntensity: 1 });

  /* Слово: каждая буква отдельно, шаг — как в шапке (ширина + .08em). */
  var word = new Group(), letters = [], DEPTH = 0.34;
  var pen = M.word.x - M.word.w / 2, base = M.word.y + baseline(lit, M.word.h);
  WORD.split("").forEach(function (ch) {
    var m = new Mesh(glyph(lit, ch, 1, DEPTH), mWord);
    m.position.set(pen, base, 0);
    word.add(m); letters.push(m);
    pen += lit.data.glyphs[ch].ha / 1000 + TRACK;
  });
  scene.add(word);
  var bb = new Box3().setFromObject(word);
  var xl = bb.min.x, xr = bb.max.x, top = bb.max.y;

  /* ALLIANCE: каждая буква по центру своей ячейки в шапке. */
  var small = [];
  SMALL.split("").forEach(function (ch, i) {
    var c = M.sm[i] || { x: 0, y: -0.5, h: M.smFs };
    var s = M.smFs, g = glyph(one, ch, s, 0.12);
    var m = new Mesh(g, mSmall);
    m.position.set(c.x - (one.data.glyphs[ch].ha / 1000) * s / 2, c.y + baseline(one, c.h / s) * s, 0);
    m.userData.y = m.position.y;
    scene.add(m); small.push(m);
  });

  /* Знак: капсула из двух половин (как в SVG: viewBox 40, поворот −38°) и лист. */
  var mk = M.mk || { x: xl - 1.4, y: 0, w: 1.8 }, u = mk.w / 40;
  var r = 8 * u, L = 12.5 * u, flat = 4.5 * u, prof = [new Vector2(0, 0), new Vector2(r, 0), new Vector2(r, 0.002)];
  for (var a = 0; a <= 16; a++) {
    var t = (a / 16) * Math.PI / 2;
    prof.push(new Vector2(r * Math.cos(t), flat + r * Math.sin(t)));
  }
  var halfG = new LatheGeometry(prof, 48);
  var pill = new Group(), hTeal = new Mesh(halfG, mTeal), hGold = new Mesh(halfG, mGold);
  hTeal.rotation.z = Math.PI / 2; hGold.rotation.z = -Math.PI / 2;
  var tealArm = new Group(), goldArm = new Group();
  tealArm.add(hTeal); goldArm.add(hGold); pill.add(tealArm, goldArm);
  pill.rotation.z = (38 * Math.PI) / 180;
  var mark3 = new Group();
  mark3.position.set(mk.x, mk.y, -r);
  mark3.add(pill);
  var lf = new Shape(), P = function (x, y) { return [(x - 20) * u, -(y - 20) * u]; };
  lf.moveTo.apply(lf, P(20, 14));
  lf.bezierCurveTo.apply(lf, P(23, 16.5).concat(P(23.4, 20.8), P(20.6, 25.5)));
  lf.bezierCurveTo.apply(lf, P(17.3, 22.5).concat(P(16.8, 17.9), P(20, 14)));
  var leafG = new ExtrudeGeometry(lf, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 3, curveSegments: 16 });
  var leaf = new Mesh(leafG, mLeaf);
  leaf.position.set(0, 0, r + 0.005);
  leaf.scale.setScalar(0.001);
  mark3.add(leaf);
  scene.add(mark3);
  mark3.visible = false;

  /* Пыль в воздухе: даёт глубину и чувство скорости в пролёте. */
  var N = 700, pos = new Float32Array(N * 3);
  for (var i = 0; i < N; i++) {
    pos[i * 3] = xl - 5 + Math.random() * (xr - xl + 10);
    pos[i * 3 + 1] = base - 3 + Math.random() * 6.5;
    pos[i * 3 + 2] = -7 + Math.random() * 9;
  }
  var dg = new BufferGeometry();
  dg.setAttribute("position", new Float32BufferAttribute(pos, 3));
  var dc = document.createElement("canvas");
  dc.width = dc.height = 32;
  var dx = dc.getContext("2d"), dgr = dx.createRadialGradient(16, 16, 0, 16, 16, 16);
  dgr.addColorStop(0, "rgba(255,255,255,1)"); dgr.addColorStop(0.4, "rgba(255,255,255,.5)"); dgr.addColorStop(1, "rgba(255,255,255,0)");
  dx.fillStyle = dgr; dx.fillRect(0, 0, 32, 32);
  var dust = new Points(dg, new PointsMaterial({ color: GOLD2, size: 0.03, map: new CanvasTexture(dc), transparent: true, opacity: 0.6, blending: AdditiveBlending, depthWrite: false }));
  scene.add(dust);

  /* Свечение за логотипом. */
  var gc = document.createElement("canvas");
  gc.width = gc.height = 256;
  var gx = gc.getContext("2d"), grd = gx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, "rgba(18,133,122,.55)"); grd.addColorStop(0.5, "rgba(11,90,83,.18)"); grd.addColorStop(1, "rgba(7,26,24,0)");
  gx.fillStyle = grd; gx.fillRect(0, 0, 256, 256);
  var glowT = new CanvasTexture(gc); glowT.colorSpace = SRGBColorSpace;
  var glow = new Mesh(new PlaneGeometry(24, 12), new MeshBasicMaterial({ map: glowT, transparent: true, depthWrite: false, fog: false }));
  glow.position.set((xl + xr) / 2, base, -9);
  scene.add(glow);

  /* Свет: ключевой тёплый, контровой бирюзовый и блик, который летит с камерой. */
  var key = new DirectionalLight("#fff4e2", 1.4); key.position.set(-3, 6, 5); scene.add(key);
  var rim = new DirectionalLight("#5fd1c2", 1.1); rim.position.set(4, 2, -6); scene.add(rim);
  var glint = new PointLight(GOLD2, 7, 4.5, 2); scene.add(glint);
  /* Лицевой свет: в конце логотип смотрит в камеру, а за камерой в студии темно. */
  var front = new DirectionalLight("#fff6e8", 0); scene.add(front); scene.add(front.target);

  /* Кадр в конце: логотип целиком, анфас. */
  var all = new Box3().setFromObject(word);
  small.forEach(function (m) { all.expandByObject(m); });
  all.expandByPoint(new Vector3(mk.x - mk.w / 2, mk.y - mk.w / 2, 0));
  all.expandByPoint(new Vector3(mk.x + mk.w / 2, mk.y + mk.w / 2, 0));
  var cxL = (all.min.x + all.max.x) / 2, cyL = (all.min.y + all.max.y) / 2, bw = all.max.x - all.min.x;
  var FOV0 = 60, FOV1 = 26, W = 1, H = 1, D = 10;
  function size() {
    W = innerWidth; H = innerHeight;
    renderer.setSize(W, H, false);
    cam.aspect = W / H;
    /* Слово логотипа — 70% ширины экрана, но не больше 980 px. */
    var ppu = Math.min((W * 0.72) / bw, 980 / bw);
    D = H / 2 / (Math.tan((FOV1 * Math.PI) / 360) * ppu);
    cam.far = Math.max(60, D * 3);
  }
  size();
  addEventListener("resize", size);

  /* Путь камеры. */
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function sine(t) { return 0.5 - Math.cos(Math.PI * t) / 2; }
  function clamp(t) { return t < 0 ? 0 : t > 1 ? 1 : t; }
  function back(t) { var c = 1.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
  var T_FLY = 3.5, T_PULL = 2.0, T_MARK = 4.4, T_SMALL = 5.0, T_LEAF = 5.55, T_END = 6.4;
  var portrait = H > W;
  var flyY = top + (portrait ? 0.8 : 0.5), flyZ = portrait ? 1.35 : 0.7;
  var x0 = xl - 0.9, x1 = xr - 0.4;
  var P1 = new Vector3(x1, flyY, flyZ), L1 = new Vector3(Math.min(x1 + 1.5, xr - 0.2), top - 0.3, -0.25);
  var tmp = new Vector3(), look = new Vector3();
  function place(t) {
    if (t < T_FLY) {
      var k = sine(t / T_FLY), x = x0 + (x1 - x0) * k;
      cam.position.set(x, flyY + Math.sin(k * Math.PI) * 0.12, flyZ);
      look.set(Math.min(x + 1.5, xr - 0.2), top - 0.3, -0.25);
      cam.fov = FOV0;
      cam.up.set(Math.sin(k * Math.PI * 2) * 0.05, 1, 0).normalize();
    } else {
      var p = ease(clamp((t - T_FLY) / T_PULL)), q = 1 - p;
      var C = new Vector3(xr + 1.2, top + 2.4, D * 0.45), P2 = new Vector3(cxL, cyL, D);
      cam.position.set(
        q * q * P1.x + 2 * q * p * C.x + p * p * P2.x,
        q * q * P1.y + 2 * q * p * C.y + p * p * P2.y,
        q * q * P1.z + 2 * q * p * C.z + p * p * P2.z);
      look.copy(L1).lerp(tmp.set(cxL, cyL, 0), ease(clamp((t - T_FLY) / (T_PULL * 0.85))));
      cam.fov = FOV0 + (FOV1 - FOV0) * p;
      /* Туман уходит вместе с камерой: логотип в конце — без дымки. */
      front.intensity = 2.4 * p;
      front.position.set(cxL - 2, cyL + 3, D);
      front.target.position.set(cxL, cyL, 0);
      scene.fog.near = 6 + p * D * 2; scene.fog.far = 20 + p * D * 4;
      cam.up.set(0, 1, 0);
    }
    cam.updateProjectionMatrix();
    cam.lookAt(look);
    glint.position.set(cam.position.x + 0.8, cam.position.y - 0.1, cam.position.z - 0.4);
    glint.intensity = t < T_FLY + 0.6 ? 7 : Math.max(0, 7 - (t - T_FLY - 0.6) * 6);

    /* Капсула: половины летят навстречу и смыкаются, потом лист. */
    var mt = clamp((t - T_MARK) / 1.15);
    mark3.visible = t >= T_MARK;
    var j = back(mt);
    tealArm.position.x = -(1 - j) * 3.2; goldArm.position.x = (1 - j) * 3.2;
    tealArm.rotation.x = (1 - mt) * 4.2; goldArm.rotation.x = -(1 - mt) * 4.2;
    mark3.position.z = -r - (1 - ease(mt)) * 1.5;
    leaf.scale.setScalar(Math.max(0.001, back(clamp((t - T_LEAF) / 0.45))));
    small.forEach(function (m, i) {
      var st = clamp((t - T_SMALL - i * 0.05) / 0.55);
      m.position.y = m.userData.y - (1 - ease(st)) * 0.35;
    });
    mSmall.opacity = clamp((t - T_SMALL) / 0.6);
    dust.rotation.y = t * 0.01;
  }

  /* Окружение для отражений: студия (Higgsfield, nano banana 2.1). */
  var ready = false, pm = new PMREMGenerator(renderer);
  new TextureLoader().load(box.getAttribute("data-env"), function (tex) {
    tex.mapping = EquirectangularReflectionMapping; tex.colorSpace = SRGBColorSpace;
    scene.environment = pm.fromEquirectangular(tex).texture;
    tex.dispose(); ready = true; window.cfiEnv = true;
  }, undefined, function () { ready = true; });
  setTimeout(function () { ready = true; }, 2500);

  /* Подмена: 3D-логотип → копия логотипа шапки поверх него → на место. */
  var t0 = 0, skipAt = -1, raf = 0, handed = false;
  /* ?cft=2.5 — кадр на этой секунде, без продолжения: снимки для проверки. */
  var freeze = /[?&]cft=([\d.]+)/.exec(location.search);
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
    c.className += " cfi-fly";
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
    if (freeze) { window.cfiFrame = (window.cfiFrame || 0) + 1; if (+freeze[1] >= T_END) handoff(); if (handed) return; raf = requestAnimationFrame(frame); return; }
    if (t >= T_END) { handoff(); if (handed) return; }
    raf = requestAnimationFrame(frame);
  }
  function start() {
    window.cfiOn = true;
    box.classList.add("on");
    ["wheel", "touchmove", "keydown"].forEach(function (e) { addEventListener(e, skip, { passive: true, once: true }); });
    box.addEventListener("click", skip);
    raf = requestAnimationFrame(frame);
  }
  /* Ждём, пока закончится видео DevUz и подгрузится окружение. */
  place(0);
  try { renderer.compile(scene, cam); } catch (e) {}
  (function wait() {
    if (ended) return;
    if (document.getElementById("dzi") || !ready) { setTimeout(wait, 120); return; }
    start();
  })();
})();
