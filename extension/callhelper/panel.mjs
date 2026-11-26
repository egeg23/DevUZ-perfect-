// DevUz CallHelper: боковая панель оператора. Слушает микрофон и звук вкладки
// со звонком, режет речь на реплики, шлёт их в API CallHelper и показывает
// подсказку. Разговор живёт только в памяти этой панели до конца звонка.
import { Segmenter, callIsOver, insertLine, keepHeld, makeResampler } from "./audio-core.mjs";

const DEFAULT_BASE = "https://devuz.studio/api/callhelper/v1";
const $ = (id) => document.getElementById(id);
const VIEWS = ["v-key", "v-ready", "v-script", "v-call", "v-summary"];

const ERRORS = {
  unauthorized: "Ключ не подошёл. Проверьте, что вставили его целиком.",
  trial_over: "Пробный период кончился. Напишите нам, подключим тариф.",
  unpaid: "Оплаченный срок кончился. Продлите подписку, и суфлёр заработает снова.",
  inactive: "Доступ колл-центра выключен. Напишите нам.",
  call_limit: "На пробном периоде звонок до 5 минут. Звонок завершён.",
  seats: "Все оплаченные места заняты другими звонками. Завершите один из них или добавьте операторов.",
  scripts_limit: "На пробном периоде один сценарий. Измените существующий.",
  rate: "Слишком много запросов. Подождите минуту.",
  stt_down: "Распознавание речи сейчас не отвечает. Попробуйте через минуту.",
  stt_off: "Распознавание речи ещё не подключено. Напишите нам.",
};
const SCRIPT_PROBLEMS = {
  product: "Впишите, что продаёте.",
  goal: "Впишите цель звонка.",
  stages: "Нужен хотя бы один этап.",
  stageWords: "У каждого этапа третьей частью строки нужны слова, по которым он считается пройденным.",
};

let cfg = { key: "", operator: "", scriptId: "", shift: false, base: DEFAULT_BASE };
let scripts = [];
let editing = null;
let call = null;
let rig = null;

function show(view) {
  for (const v of VIEWS) $(v).hidden = v !== view;
  $("gear").hidden = view !== "v-ready";
}

function alertText(text) {
  $("alert").textContent = text || "";
  $("alert").hidden = !text;
}

const explain = (error) => ERRORS[error?.code] || "Не получилось связаться с сервером. Проверьте интернет и попробуйте ещё раз.";

async function api(method, path, body, raw) {
  const headers = { Authorization: `Bearer ${cfg.key}` };
  if (raw) headers["Content-Type"] = "application/octet-stream";
  else if (body) headers["Content-Type"] = "application/json";
  const res = await fetch(cfg.base + path, { method, headers, body: raw ?? (body ? JSON.stringify(body) : undefined) });
  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  if (!res.ok) {
    const error = new Error(data.error || `http_${res.status}`);
    error.code = data.error || "";
    error.data = data;
    throw error;
  }
  return data;
}

// --- вход и сценарии ---

async function enter() {
  alertText("");
  const me = await api("GET", "/me");
  $("org").textContent = me.org?.name || "";
  const access = me.access || {};
  $("start").disabled = !access.ok;
  if (!access.ok) alertText(ERRORS[access.reason] || "Доступ закрыт.");
  $("quota").textContent = access.ok
    ? access.hours_left != null
      ? `Пробный период: осталось ${access.minutes_left} мин и ${access.hours_left} ч.`
      : access.minutes_included != null
        ? `Минут в этом месяце осталось: ${access.minutes_left}.`
        : `Пробный период: ${access.minutes_left} минут с первого звонка.`
    : "";
  await loadScripts();
  show("v-ready");
}

async function loadScripts() {
  scripts = (await api("GET", "/scripts")).scripts || [];
  const select = $("script");
  select.textContent = "";
  for (const s of scripts) {
    const option = document.createElement("option");
    option.value = s.id;
    option.textContent = s.name;
    select.append(option);
  }
  if (!scripts.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Сценария ещё нет: нажмите «Новый сценарий»";
    select.append(option);
  }
  if (scripts.some((s) => s.id === cfg.scriptId)) select.value = cfg.scriptId;
  $("edit").disabled = !scripts.length;
}

function openScript(script) {
  editing = script ? script.id : null;
  $("script-title").textContent = script ? "Изменить сценарий" : "Новый сценарий";
  $("script-problems").hidden = true;
  const form = $("script-form");
  form.reset();
  if (script) fillScript(script.name, script.form);
  show("v-script");
}

function fillScript(name, fields) {
  const form = $("script-form");
  if (name) form.elements.name.value = name;
  for (const key of ["product", "goal", "stages", "objections", "must", "banned"]) form.elements[key].value = fields?.[key] || "";
}

async function saveScript(event) {
  event.preventDefault();
  const form = $("script-form");
  const fields = {};
  for (const key of ["product", "goal", "stages", "objections", "must", "banned"]) fields[key] = form.elements[key].value;
  try {
    const saved = await api("PUT", editing ? `/scripts/${editing}` : "/scripts", { name: form.elements.name.value, form: fields });
    cfg.scriptId = saved.script.id;
    await chrome.storage.local.set({ scriptId: cfg.scriptId });
    await loadScripts();
    show("v-ready");
  } catch (error) {
    const problems = error.data?.problems;
    $("script-problems").textContent = problems ? problems.map((p) => SCRIPT_PROBLEMS[p] || p).join(" ") : explain(error);
    $("script-problems").hidden = false;
  }
}

// --- звук и звонок ---
// rig — открытый звук (микрофон и вкладка): на один звонок или на всю смену.
// call — идущий звонок. В смене звонков за один rig много.

async function tabStream() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab || tab.id === undefined) throw new Error("no_tab");
  const id = await chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id });
  return navigator.mediaDevices.getUserMedia({ audio: { mandatory: { chromeMediaSource: "tab", chromeMediaSourceId: id } }, video: false });
}

const FATAL = ["trial_over", "unpaid", "inactive", "unauthorized"];
const newCall = () => api("POST", "/calls", { script_id: rig.scriptId, operator: cfg.operator, source: "extension" });

async function start() {
  alertText("");
  $("start").disabled = true;
  let tab = null;
  let mic = null;
  try {
    try {
      tab = await tabStream();
    } catch {
      alertText("Не слышу вкладку со звонком. Откройте её, нажмите на значок CallHelper на этой вкладке и снова нажмите кнопку.");
      return;
    }
    try {
      mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
    } catch {
      alertText("Нужен доступ к микрофону. Мы открыли вкладку: разрешите там микрофон и нажмите кнопку ещё раз.");
      chrome.tabs.create({ url: chrome.runtime.getURL("mic.html") });
      return;
    }
    const scriptId = $("script").value || null;
    cfg.scriptId = scriptId || "";
    cfg.shift = $("shift").checked;
    chrome.storage.local.set({ scriptId: cfg.scriptId, shift: cfg.shift });
    await openRig(tab, mic, scriptId, cfg.shift);
    tab = null;
    mic = null;
    if (rig.shift) showIdle();
    else beginCall(await newCall());
    show("v-call");
  } catch (error) {
    alertText(explain(error));
    closeRig();
  } finally {
    for (const s of [tab, mic]) s?.getTracks().forEach((t) => t.stop());
    if (!rig) $("start").disabled = false;
  }
}

async function openRig(tab, mic, scriptId, shift) {
  const ctx = new AudioContext();
  await ctx.audioWorklet.addModule(chrome.runtime.getURL("tap.js"));
  rig = { ctx, ears: [], scriptId, shift, closing: false, held: [], probeQ: Promise.resolve() };
  // Вкладку играем обратно в наушники: захваченный звук иначе пропадает у оператора.
  rig.ears.push(listen(tab, "client", true), listen(mic, "operator", false));
  tab.getAudioTracks()[0]?.addEventListener("ended", () => stopAll());
  $("stop-shift").hidden = !shift;
  $("last-box").hidden = true;
}

function closeRig() {
  const mine = rig;
  if (!mine) return;
  rig = null;
  for (const ear of mine.ears) {
    ear.node.port.onmessage = null;
    ear.stream.getTracks().forEach((t) => t.stop());
  }
  mine.ctx.close().catch(() => {});
}

function listen(stream, who, playback) {
  const { ctx } = rig;
  const source = ctx.createMediaStreamSource(stream);
  const node = new AudioWorkletNode(ctx, "tap", {
    numberOfInputs: 1,
    numberOfOutputs: 0,
    channelCount: 1,
    channelCountMode: "explicit",
    channelInterpretation: "speakers",
  });
  source.connect(node);
  if (playback) source.connect(ctx.destination);
  const resample = makeResampler(ctx.sampleRate);
  const segmenter = new Segmenter();
  node.port.onmessage = (event) => {
    if (!rig || rig.closing) return;
    for (const piece of segmenter.feed(resample(event.data))) route(who, piece);
  };
  return { stream, node, segmenter, who };
}

/** Куда идёт реплика: в идущий звонок, а в смене между звонками — на проверку «это клиент заговорил?». */
function route(who, piece) {
  if (call && !call.ending) return hear(who, piece);
  if (!rig.shift) return;
  // Оператор между звонками: на сервер не шлём, держим последние секунды на случай, если это уже приветствие.
  if (who === "operator") rig.held = keepHeld([...rig.held, piece], piece.startMs);
  else probe(piece);
}

/** Смена, звонка нет: клиент сказал слово — начинаем звонок сами. Гудки и тишина дают пустой текст. */
function probe(piece) {
  const mine = rig;
  mine.probeQ = mine.probeQ.then(async () => {
    if (call?.ending) await call.gone;
    if (rig !== mine || mine.closing) return;
    if (call) return hear("client", piece);
    try {
      const heard = await api("POST", "/stt?who=client", null, piece.pcm.buffer);
      if (rig !== mine || mine.closing || !heard.text) return;
      const made = await newCall();
      if (rig !== mine || mine.closing) {
        api("POST", `/calls/${made.call.id}/end`, { lines: [] }).catch(() => {});
        return;
      }
      beginCall(made);
      insertLine(call.lines, { who: "client", text: heard.text, t: piece.startMs });
      // Приветствие оператора догоняет звонок: подсказку просим, когда оно распознано, иначе она советует поздороваться ещё раз.
      const back = keepHeld(mine.held.splice(0), piece.startMs);
      call.catchup = back.length;
      for (const p of back) hear("operator", p, true);
      renderLines();
      askHint();
    } catch (error) {
      if (FATAL.includes(error.code) || error.code === "stt_off") {
        alertText(explain(error));
        stopAll();
      }
    }
  });
}

function beginCall(made) {
  let finish;
  const gone = new Promise((resolve) => (finish = resolve));
  call = {
    id: made.call.id,
    limit: made.limits?.call_seconds || 0,
    startedAt: Date.now(),
    lastHeard: Date.now(),
    lines: [],
    queue: { client: Promise.resolve(), operator: Promise.resolve() },
    catchup: 0,
    hintBusy: false,
    hintAgain: false,
    ending: false,
    gone,
    finish,
  };
  $("lines").textContent = "";
  $("warn").textContent = "";
  $("stages").textContent = "";
  $("objection").hidden = true;
  $("phrase").textContent = "Слушаю разговор…";
  $("live").classList.remove("idle");
  $("stop").disabled = false;
  call.timer = setInterval(tick, 1000);
  tick();
}

function showIdle() {
  $("live").classList.add("idle");
  $("timer").textContent = "Смена";
  $("ears").textContent = "жду звонок";
  $("stop").disabled = true;
  $("objection").hidden = true;
  $("warn").textContent = "";
  $("stages").textContent = "";
  $("lines").textContent = "";
  $("phrase").textContent = "Жду звонок. Начну сам, как только услышу клиента.";
}

/** Реплика ушла на распознавание. По одной на голос за раз: порядок внутри голоса не путается. */
function hear(who, piece, late = false) {
  const mine = call;
  mine.queue[who] = mine.queue[who].then(async () => {
    if (late) mine.catchup -= 1;
    if (call !== mine) return;
    try {
      const heard = await api("POST", `/calls/${mine.id}/stt?who=${who}`, null, piece.pcm.buffer);
      if (call !== mine) return;
      if (!heard.text) {
        if (late && !mine.catchup) askHint();
        return;
      }
      mine.lastHeard = Date.now();
      insertLine(mine.lines, { who, text: heard.text, t: piece.startMs });
      renderLines();
      askHint();
    } catch (error) {
      if (error.code === "call_limit") {
        alertText(explain(error));
        endCall();
      } else if (FATAL.includes(error.code)) {
        alertText(explain(error));
        stopAll();
      }
    }
  });
}

function tick() {
  if (!call) return;
  const seconds = Math.floor((Date.now() - call.startedAt) / 1000);
  $("timer").textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  const you = call.lines.filter((l) => l.who === "operator").length;
  $("ears").textContent = `вы: ${you} · клиент: ${call.lines.length - you}`;
  if (call.limit && seconds >= call.limit) {
    alertText(ERRORS.call_limit);
    endCall();
  } else if (rig?.shift && callIsOver(call.lastHeard, Date.now())) {
    endCall();
  }
}

function renderLines() {
  const list = $("lines");
  list.textContent = "";
  for (const line of call.lines.slice(-30)) {
    const li = document.createElement("li");
    li.className = line.who;
    const who = document.createElement("b");
    who.textContent = line.who === "operator" ? "Вы" : "Клиент";
    li.append(who, line.text);
    list.append(li);
  }
  list.lastElementChild?.scrollIntoView({ block: "nearest" });
}

async function askHint() {
  const mine = call;
  if (!mine || mine.ending || mine.catchup > 0) return;
  if (mine.hintBusy) {
    mine.hintAgain = true;
    return;
  }
  mine.hintBusy = true;
  try {
    const lines = mine.lines.slice(-60).map((l) => ({ who: l.who, text: l.text }));
    const result = await api("POST", `/calls/${mine.id}/hint`, { lines });
    if (call === mine && !mine.ending) renderHint(result);
  } catch (error) {
    if (error.code === "call_limit") {
      alertText(explain(error));
      endCall();
    }
  } finally {
    mine.hintBusy = false;
    if (mine.hintAgain) {
      mine.hintAgain = false;
      askHint();
    }
  }
}

function renderHint(result) {
  const hint = result.hint || {};
  if (result.phrase) $("phrase").textContent = result.phrase;
  $("objection").hidden = !hint.objection;
  if (hint.objection) $("objection").textContent = `Возражение: ${hint.objection.name}`;

  const stages = $("stages");
  stages.textContent = "";
  (hint.stages || []).forEach((stage, i) => {
    const li = document.createElement("li");
    li.textContent = stage.name;
    if (stage.done) li.className = "done";
    else if (i === hint.current) li.className = "now";
    stages.append(li);
  });

  const warn = $("warn");
  warn.textContent = "";
  const items = [];
  if (hint.banned?.length) items.push(`Прозвучало запрещённое: ${hint.banned.join(", ")}`);
  if (hint.noRecordNotice) items.push("Вы не предупредили, что разговор записывается.");
  for (const text of items) {
    const li = document.createElement("li");
    li.textContent = text;
    warn.append(li);
  }
}

/** Завершить идущий звонок. В смене звук остаётся открытым и суфлёр ждёт следующий. */
async function endCall() {
  const mine = call;
  if (!mine) return;
  if (mine.ending) return mine.gone;
  mine.ending = true;
  clearInterval(mine.timer);
  $("stop").disabled = true;
  // В смене звук не закрываем, поэтому ждём только уже отправленное, но не дольше трёх секунд.
  if (!rig?.shift || rig.closing) closeRig();
  await Promise.race([Promise.allSettled([mine.queue.client, mine.queue.operator]), new Promise((r) => setTimeout(r, 3000))]);
  let summary = null;
  try {
    const ended = await api("POST", `/calls/${mine.id}/end`, { lines: mine.lines.slice(-400).map((l) => ({ who: l.who, text: l.text })) });
    summary = ended.call;
  } catch {
    summary = null;
  }
  call = null;
  if (rig && !rig.closing) {
    renderSummary(summary, $("last"));
    $("last-box").hidden = false;
    showIdle();
  } else {
    $("stop").disabled = false;
    $("start").disabled = false;
    renderSummary(summary, $("summary"));
    show("v-summary");
  }
  mine.finish();
}

/** Завершить всё: звонок, если идёт, и смену. */
async function stopAll() {
  if (!rig && !call) return;
  if (rig) rig.closing = true;
  if (call) return endCall();
  closeRig();
  $("start").disabled = false;
  show("v-ready");
}

function block(title, text, bad) {
  const div = document.createElement("div");
  div.className = bad ? "sum bad" : "sum";
  const b = document.createElement("b");
  b.textContent = title;
  div.append(b, document.createElement("br"), text);
  return div;
}

function renderSummary(ended, box) {
  box.textContent = "";
  const s = ended?.summary;
  if (!s) {
    box.append(block("Итог не сохранился", "Звонок завершён, но сервер не ответил. Минуты посчитаны по времени звонка."));
    return;
  }
  const minutes = `${Math.floor(s.seconds / 60)} мин ${s.seconds % 60} с`;
  box.append(block("Длительность", minutes));
  const open = s.stages.filter((x) => !x.done).map((x) => x.name);
  box.append(block(`Этапы: ${s.stagesDone} из ${s.stages.length}`, open.length ? `Не пройдены: ${open.join(", ")}` : "Все этапы пройдены.", open.length > 0));
  box.append(block("Возражения клиента", s.objections.length ? s.objections.join(", ") : "Не было."));
  if (s.banned.length) box.append(block("Запрещённые слова", s.banned.join(", "), true));
  if (s.missingMust.length) box.append(block("Не прозвучало обязательное", s.missingMust.join("; "), true));
  if (!s.recordNotice) box.append(block("Запись разговора", "Вы не предупредили клиента о записи.", true));
}

// --- запуск ---

$("key-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  cfg.key = $("key").value.trim();
  cfg.operator = $("operator").value.trim();
  try {
    await enter();
    await chrome.storage.local.set({ key: cfg.key, operator: cfg.operator });
  } catch (error) {
    alertText(explain(error));
  }
});
$("gear").addEventListener("click", () => {
  $("key").value = "";
  $("operator").value = cfg.operator;
  show("v-key");
});
$("script").addEventListener("change", () => {
  cfg.scriptId = $("script").value;
  chrome.storage.local.set({ scriptId: cfg.scriptId });
});
$("edit").addEventListener("click", () => openScript(scripts.find((s) => s.id === $("script").value) || scripts[0]));
$("new").addEventListener("click", () => openScript(null));
$("script-back").addEventListener("click", () => show("v-ready"));
$("script-form").addEventListener("submit", saveScript);
$("example").addEventListener("click", async () => {
  try {
    const example = await api("GET", "/scripts/example");
    fillScript($("script-form").elements.name.value || "Пример: запись на консультацию", example.form);
  } catch (error) {
    alertText(explain(error));
  }
});
$("start").addEventListener("click", start);
$("stop").addEventListener("click", endCall);
$("stop-shift").addEventListener("click", stopAll);
const startLabel = () => ($("start").textContent = $("shift").checked ? "Начать смену" : "Начать звонок");
$("shift").addEventListener("change", startLabel);
$("again").addEventListener("click", async () => {
  try {
    await enter();
  } catch (error) {
    alertText(explain(error));
    show("v-ready");
  }
});

(async () => {
  const saved = await chrome.storage.local.get(["key", "operator", "scriptId", "shift", "base"]);
  cfg = { key: saved.key || "", operator: saved.operator || "", scriptId: saved.scriptId || "", shift: !!saved.shift, base: saved.base || DEFAULT_BASE };
  $("shift").checked = cfg.shift;
  startLabel();
  if (!cfg.key) {
    show("v-key");
    return;
  }
  try {
    await enter();
  } catch (error) {
    alertText(explain(error));
    show("v-key");
  }
})();
