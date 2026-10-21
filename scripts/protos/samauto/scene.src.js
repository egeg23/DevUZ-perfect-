/*
 * Сцена макета SamAuto: оранжевый D-MAX IRBIS LSE на подиуме, по прокрутке
 * разлетается на детали и собирается обратно. Сборка — build-scene.mjs
 * (esbuild, three 0.180.0) → public/protos/samauto/scene.js.
 *
 * Разлёт — по рецепту из ролика владельца:
 *  - у каждой детали запомнены начальное место и направление от центра
 *    машины (центры — Box3().setFromObject(...).getCenter());
 *  - всё ведёт одно число explode 0…1 от прокрутки;
 *  - место = старт + направление · explode · шаг · множитель 0.7…1.3,
 *    выбранный один раз (с зерном: раскладка одинаковая при каждом открытии);
 *  - мелкие детали летят дальше: · clamp(1 / size, 0.5, 2), size — размер
 *    детали к размеру машины;
 *  - поворот до 0.6 рад · explode;
 *  - прокрутка сглажена (damp), детали не дёргаются.
 * Шаг 1.5 из рецепта рассчитан на машину в метрах, наша модель длиной ~1,
 * поэтому шаг 0.3: при 1.5 мелкие детали улетают за край телефона.
 *
 * Прокрутку сцена не трогает: страница листается сама, сцена только читает
 * долю пройденного (setProgress).
 */
import {
  ACESFilmicToneMapping, AdditiveBlending, Box3, CanvasTexture, CircleGeometry, Color, CylinderGeometry,
  DirectionalLight, DoubleSide, SpotLight, Euler, Fog, Group, HemisphereLight, MathUtils, Mesh, MeshBasicMaterial,
  MeshStandardMaterial, PerspectiveCamera, PlaneGeometry, PMREMGenerator,   Quaternion, RingGeometry, SRGBColorSpace, Scene, TorusGeometry, Vector3, WebGLRenderer,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const RED = 0xe31e24;
const STEP = 0.3;
const SEED = 2026_10_21;

/* Зерно: mulberry32. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

/* Доля прокрутки → разлёт: стоит, разлетается, держится, собирается. */
export function explodeAt(p) {
  return smooth(0.12, 0.42, p) * (1 - smooth(0.62, 0.9, p));
}

/* Доля прокрутки → камера: справа спереди, вдоль борта, сзади справа. */
function cameraAt(p, e, tall) {
  /* Телефон стоя: в разлёте смотрим спереди сбоку, иначе длина не влезает. */
  const deg = tall ? (p < 0.5 ? lerp(24, 48, smooth(0, 0.5, p)) : lerp(48, 150, smooth(0.5, 0.98, p))) : lerp(26, 150, smooth(0.02, 0.98, p));
  const az = deg * (Math.PI / 180);
  const el = (3 + 15 * e + 4 * smooth(0.9, 1, p)) * (Math.PI / 180);
  return { az, el };
}

/* Радиальное пятно: тень под машиной и свечение подиума. */
function blob(inner, outer, rgb) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  const gr = g.createRadialGradient(128, 128, 128 * inner, 128, 128, 128 * outer);
  gr.addColorStop(0, `rgba(${rgb},1)`);
  gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr;
  g.fillRect(0, 0, 256, 256);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/*
 * Краска — фотография: цвет и свет запечены из снимков (photo/, README),
 * поэтому основное — свечение текстурой, без тонкомпрессии, а поверх — немного
 * живого света и отражения зала, чтобы при повороте по лаку шли блики.
 * Альфа текстуры — доля фото: где снимков нет (внутренности, изнанка), там
 * ни бликов, ни света, детали отлетают тёмными.
 */
function paint(m) {
  const p = new MeshStandardMaterial({
    map: m.map, color: 0x2a2a2a, emissive: 0xffffff, emissiveMap: m.map, emissiveIntensity: 1.0,
    roughnessMap: m.roughnessMap || m.metalnessMap, roughness: 0.9, metalness: 0, normalMap: m.normalMap,
    envMapIntensity: 0.22, side: DoubleSide, toneMapped: false,
  });
  if (m.normalScale) p.normalScale.copy(m.normalScale).multiplyScalar(0.6);
  p.onBeforeCompile = (s) => {
    s.fragmentShader = s.fragmentShader
      .replace("#include <color_fragment>", "#include <color_fragment>\nif (!gl_FrontFacing) diffuseColor.rgb = vec3(0.03);")
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\nif (!gl_FrontFacing) totalEmissiveRadiance = vec3(0.0);")
      .replace("#include <aomap_fragment>", "#include <aomap_fragment>\nfloat dzK = gl_FrontFacing ? texture2D(map, vMapUv).a : 0.05;\nreflectedLight.directSpecular *= dzK; reflectedLight.indirectSpecular *= dzK; reflectedLight.directDiffuse *= dzK; reflectedLight.indirectDiffuse *= dzK;");
  };
  return p;
}

export function start(o) {
  const canvas = o.canvas;
  const phone = Math.min(innerWidth, innerHeight) < 700;
  const renderer = new WebGLRenderer({ canvas, antialias: !phone, alpha: false, powerPreference: "high-performance", preserveDrawingBuffer: !!o.still });
  let dpr = Math.min(devicePixelRatio || 1, phone ? 1.6 : 1.75);
  renderer.setPixelRatio(dpr);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = SRGBColorSpace;

  const BG = new Color(0x07080a);
  const scene = new Scene();
  scene.background = BG;
  scene.fog = new Fog(BG, 3.2, 7.5);
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.035).texture;
  scene.environmentIntensity = 0.55;

  const camera = new PerspectiveCamera(30, 1, 0.05, 30);

  /* Свет: мягкий сверху, как в зале из презентации, и красный снизу. */
  scene.add(new HemisphereLight(0xdfe6ff, 0x120406, 0.45));
  const key = new SpotLight(0xffffff, 20, 8, 0.5, 0.9, 1.2);
  key.position.set(0.3, 3.2, 0.7);
  key.target.position.set(0, 0.2, 0);
  scene.add(key, key.target);
  const fill = new DirectionalLight(0xffffff, 0.7);
  fill.position.set(2, 1.4, 2.4);
  scene.add(fill);
  const rim = new DirectionalLight(0xffe6d8, 0.9);
  rim.position.set(-2.2, 1.2, -1.6);
  scene.add(rim);

  /* Пол с отражением: зеркальная копия машины под полупрозрачным полом. */
  const floor = new Mesh(new CircleGeometry(9, 64), new MeshBasicMaterial({ color: 0x060709, transparent: true, opacity: 0.84 }));
  floor.rotation.x = -Math.PI / 2;
  floor.renderOrder = 2;
  scene.add(floor);
  const podium = new Mesh(new CylinderGeometry(0.78, 0.8, 0.03, 96, 1, true), new MeshStandardMaterial({ color: 0x0d0e11, roughness: 0.35, metalness: 0.3, envMapIntensity: 0.2 }));
  podium.position.y = 0.0;
  scene.add(podium);
  const top = new Mesh(new CircleGeometry(0.78, 96), new MeshStandardMaterial({ color: 0x020203, roughness: 0.7, metalness: 0.05, envMapIntensity: 0.08, transparent: true, opacity: 0.86 }));
  top.rotation.x = -Math.PI / 2;
  top.position.y = 0.0155;
  top.renderOrder = 3;
  scene.add(top);
  const ring = new Mesh(new TorusGeometry(0.795, 0.0045, 8, 160), new MeshBasicMaterial({ color: RED, toneMapped: false }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.01;
  scene.add(ring);
  const ring2 = ring.clone();
  ring2.scale.setScalar(0.94);
  ring2.position.y = 0.0;
  scene.add(ring2);
  const halo = new Mesh(new RingGeometry(0.6, 1.05, 128), new MeshBasicMaterial({ map: blob(0.72, 1, "227,30,36"), transparent: true, opacity: 0.55, blending: AdditiveBlending, depthWrite: false, toneMapped: false }));
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.002;
  halo.renderOrder = 4;
  scene.add(halo);
  const outer = new Mesh(new TorusGeometry(1.25, 0.0025, 6, 200), new MeshBasicMaterial({ color: 0xd9c9bd, toneMapped: false, transparent: true, opacity: 0.6 }));
  outer.rotation.x = Math.PI / 2;
  outer.position.y = 0.001;
  scene.add(outer);
  /* Пятно света на полу под машиной, как от потолка в зале. */
  const pool = new Mesh(new PlaneGeometry(4, 4), new MeshBasicMaterial({ map: blob(0, 1, "190,196,210"), transparent: true, opacity: 0.1, depthWrite: false }));
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.0015;
  pool.renderOrder = 3;
  scene.add(pool);
  const shadow = new Mesh(new PlaneGeometry(1.5, 0.75), new MeshBasicMaterial({ map: blob(0.05, 1, "0,0,0"), transparent: true, opacity: 0.9, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.017;
  shadow.renderOrder = 5;
  scene.add(shadow);

  const car = new Group();
  const mirror = new Group();
  mirror.scale.y = -1;
  scene.add(car, mirror);

  const parts = [];
  let ready = false, target = o.progress ? o.progress() : 0, cur = target, dirty = true, frames = 0, slow = 0, last = 0;
  const labels = o.labels || {};

  function size() {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < h * 0.8 ? 48 : 30;
    camera.updateProjectionMatrix();
    dirty = true;
  }
  addEventListener("resize", size);
  size();

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  loader.load(o.src, (g) => {
    const root = g.scene;
    const box = new Box3().setFromObject(root);
    const C = box.getCenter(new Vector3());
    const S = box.getSize(new Vector3()).length();
    /* Машина на полу подиума, центр над центром. */
    const lift = new Vector3(-C.x, -box.min.y + 0.016, -C.z);
    const mats = new Map();
    const rand = rng(SEED);
    const list = root.children.filter((c) => c.isMesh || c.children.length).sort((a, b) => (a.name < b.name ? -1 : 1));
    for (const node of list) {
      node.traverse((m) => {
        if (!m.isMesh) return;
        if (!m.geometry.attributes.normal) m.geometry.computeVertexNormals();
        if (!mats.has(m.material)) mats.set(m.material, paint(m.material));
        m.material = mats.get(m.material);
      });
      const center = new Box3().setFromObject(node).getCenter(new Vector3());
      const dir = center.clone().sub(C);
      dir.y = Math.max(dir.y, -0.05) + 0.12; // вниз некуда: там пол
      dir.normalize();
      const sz = new Box3().setFromObject(node).getSize(new Vector3()).length() / S;
      const far = STEP * (0.7 + rand() * 0.6) * clamp(1 / sz, 0.5, 2);
      const axis = new Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize();
      const angle = rand() * 0.6;
      const start = node.position.clone().add(lift);
      const q0 = node.quaternion.clone();
      node.position.copy(start);
      car.add(node);
      const twin = node.clone();
      mirror.add(twin);
      const r = new Box3().setFromObject(node).getSize(new Vector3()).length() / 2;
      parts.push({ name: node.name, node, twin, start, dir, far, axis, angle, q0, r });
    }
    ready = true;
    dirty = true;
    o.onReady && o.onReady();
  }, (ev) => { if (ev.total && o.onProgress) o.onProgress(ev.loaded / ev.total); }, (err) => { o.onError && o.onError(err); });

  const q = new Quaternion();
  const look = new Vector3();
  const tmp = new Vector3();
  function place(p) {
    const e = explodeAt(p);
    for (const t of parts) {
      t.node.position.copy(t.start).addScaledVector(t.dir, e * t.far);
      t.node.position.y += e * 0.12;
      q.setFromAxisAngle(t.axis, t.angle * e);
      t.node.quaternion.copy(t.q0).premultiply(q);
      t.twin.position.copy(t.node.position);
      t.twin.quaternion.copy(t.node.quaternion);
    }
    shadow.material.opacity = 0.9 * (1 - e * 0.7);
    halo.material.opacity = 0.45 + 0.25 * e;
    const { az, el } = cameraAt(p, e, camera.aspect < 0.8);
    /* Дистанция — по шару, в который влезают все детали сейчас. */
    look.set(0, 0, 0);
    for (const t of parts) look.add(t.node.position);
    look.divideScalar(parts.length || 1);
    let R = 0;
    for (const t of parts) R = Math.max(R, t.node.position.distanceTo(look) + t.r * 0.8);
    R = Math.max(R, 0.5);
    const vf = MathUtils.degToRad(camera.fov) / 2;
    const hf = Math.atan(Math.tan(vf) * camera.aspect);
    const d = (R / Math.sin(Math.min(vf, hf))) * (camera.aspect < 0.8 ? 0.92 : 0.96);
    look.y = Math.max(look.y, 0.18);
    /* Туман — от камеры: зал тонет в темноте, машина нет. */
    scene.fog.near = d * 0.9;
    scene.fog.far = d * 2.6;
    camera.position.set(Math.cos(az) * Math.cos(el) * d, look.y + Math.sin(el) * d, Math.sin(az) * Math.cos(el) * d);
    camera.lookAt(look);
    /* Подписи деталей — к центру своей детали. */
    const op = smooth(0.55, 0.9, e);
    for (const t of parts) {
      const el2 = labels[t.name];
      if (!el2) continue;
      tmp.copy(t.node.position).project(camera);
      const x = (tmp.x * 0.5 + 0.5) * canvas.clientWidth, y = (-tmp.y * 0.5 + 0.5) * canvas.clientHeight;
      el2.classList.toggle("l", x > canvas.clientWidth - 190);
      el2.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
      el2.style.opacity = op.toFixed(3);
    }
    o.onFrame && o.onFrame(p, e);
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    if (o.progress) target = o.progress();
    const next = o.still ? target : MathUtils.damp(cur, target, 5.5, dt);
    if (Math.abs(next - cur) < 1e-5 && !dirty) return;
    cur = Math.abs(next - target) < 1e-5 ? target : next;
    dirty = false;
    if (!ready) return;
    place(cur);
    const t0 = performance.now();
    renderer.render(scene, camera);
    /* Слабое устройство: после 40 тяжёлых кадров — меньше пикселей. */
    if (++frames > 5 && dt > 0.045 && dpr > 1) { if (++slow > 40) { dpr = 1; renderer.setPixelRatio(1); size(); slow = 0; } }
    if (!o.first) { o.first = true; o.onFirst && o.onFirst(); }
    void t0;
  }
  let raf = requestAnimationFrame(frame);

  return {
    poke() { dirty = true; },
    stop() { cancelAnimationFrame(raf); },
    run() { cancelAnimationFrame(raf); last = 0; raf = requestAnimationFrame(frame); },
  };
}

window.SamScene = { start, explodeAt };
