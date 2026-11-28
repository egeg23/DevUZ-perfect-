import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { CALLHELPER_API_BASE } from "@/content/callhelper-api";
import { AUDIO_MAX_BYTES, AUDIO_MIN_BYTES, AUDIO_RATE } from "@/lib/callhelper/orgs";

import { RATE, SHIFT, Segmenter, callIsOver, insertLine, keepHeld, makeResampler, toPcm16 } from "../extension/callhelper/audio-core.mjs";
import { API_PATH, CLOUD_ORIGIN, checkServer, isBox, isLocalHost, permissionFor, quotaLine } from "../extension/callhelper/server.mjs";
import { ZIP_PATH, packExtension } from "../scripts/callhelper/pack-extension.mjs";

/**
 * Расширение DevUz CallHelper для Chrome (владелец, 26.11.2026: «клиенты
 * чтобы видели прям расширением»): нарезка речи на реплики, права, архив.
 */

const EXT = "extension/callhelper";

function tone(ms: number, amp: number, rate = RATE): Float32Array {
  const out = new Float32Array(Math.round((rate * ms) / 1000));
  for (let i = 0; i < out.length; i++) out[i] = amp * Math.sin((2 * Math.PI * 220 * i) / rate) + (Math.random() - 0.5) * 0.001;
  return out;
}
const join = (...parts: Float32Array[]) => {
  const out = new Float32Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
};
function feedAll(seg: InstanceType<typeof Segmenter>, signal: Float32Array, chunk = 2048) {
  const out = [];
  for (let i = 0; i < signal.length; i += chunk) out.push(...seg.feed(signal.subarray(i, i + chunk)));
  return out;
}

test("частота: 48 000 и 44 100 сводятся к 16 000, остаток между кусками не теряется", () => {
  assert.equal(RATE, AUDIO_RATE, "расширение и сервер говорят об одной частоте");
  for (const from of [48000, 44100]) {
    const resample = makeResampler(from);
    let got = 0;
    for (let i = 0; i < 100; i++) got += resample(new Float32Array(2048)).length;
    const want = (100 * 2048 * RATE) / from;
    assert.ok(Math.abs(got - want) <= 2, `${from}: ${got} против ${want}`);
  }
  assert.equal(makeResampler(16000)(new Float32Array(100)).length, 100);
  assert.deepEqual([...toPcm16(Float32Array.from([0, 1, -1, 2]))], [0, 32767, -32768, 32767]);
});

test("нарезка: одна фраза между паузами — одна реплика, щелчок и тишина не уходят", () => {
  const seg = new Segmenter();
  const out = feedAll(seg, join(tone(1000, 0), tone(1500, 0.2), tone(1500, 0)));
  assert.equal(out.length, 1);
  const ms = (out[0].pcm.length / RATE) * 1000;
  assert.ok(ms >= 1500 && ms <= 2100, `длина ${ms} мс: речь, немного до и хвост тишины`);
  assert.ok(out[0].startMs >= 700 && out[0].startMs <= 1050, `начало ${out[0].startMs} мс`);
  assert.ok(out[0].pcm.byteLength >= AUDIO_MIN_BYTES);

  assert.equal(feedAll(new Segmenter(), join(tone(800, 0), tone(120, 0.3), tone(1500, 0))).length, 0, "щелчок — не речь");
  assert.equal(feedAll(new Segmenter(), tone(5000, 0)).length, 0, "тишина не уходит на сервер");
});

test("нарезка: длинный монолог режется на куски, которые сервер примет", () => {
  const seg = new Segmenter();
  const out = feedAll(seg, join(tone(500, 0), tone(30_000, 0.2)));
  const last = seg.flush();
  if (last) out.push(last);
  assert.ok(out.length >= 3, `кусков ${out.length}`);
  for (const piece of out) assert.ok(piece.pcm.byteLength <= AUDIO_MAX_BYTES, "кусок не длиннее 20 секунд");
  for (let i = 1; i < out.length; i++) assert.ok(out[i].startMs > out[i - 1].startMs, "куски идут по времени");
});

test("реплики двух голосов встают по времени начала", () => {
  const lines: { who: string; text: string; t: number }[] = [];
  insertLine(lines, { who: "operator", text: "а", t: 100 });
  insertLine(lines, { who: "client", text: "в", t: 900 });
  insertLine(lines, { who: "operator", text: "б", t: 500 });
  assert.deepEqual(lines.map((l) => l.text), ["а", "б", "в"]);
});

test("расширение: третья версия манифеста, прав только нужные, ходит только на наш API или коробку", () => {
  const manifest = JSON.parse(readFileSync(`${EXT}/manifest.json`, "utf8"));
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual([...manifest.permissions].sort(), ["activeTab", "sidePanel", "storage", "tabCapture"]);
  assert.deepEqual(manifest.host_permissions, ["https://devuz.studio/*"], "облако — постоянное право");
  assert.deepEqual(manifest.optional_host_permissions, ["https://*/*", "http://*/*"], "адрес коробки — по запросу у человека");
  assert.equal(manifest.content_scripts, undefined, "в страницы колл-центра расширение не встраивается");
  const panel = readFileSync(`${EXT}/panel.mjs`, "utf8");
  assert.equal(CLOUD_ORIGIN + API_PATH, `https://devuz.studio${CALLHELPER_API_BASE}`, "адрес API");
  assert.match(panel, /fetch\(cfg\.server \+ API_PATH \+ path/, "запросы идут только на проверенный адрес");
  assert.match(panel, /chrome\.permissions\.request\(\{ origins: \[permissionFor/, "право на коробку спрашивается у человека");
  assert.match(panel, /checkServer\(saved\.server/, "сохранённый адрес проверяется заново");
  assert.doesNotMatch(panel, /innerHTML|insertAdjacentHTML|eval\(|new Function/, "текст разговора на экран только как текст");
  assert.match(panel, /source\.connect\(ctx\.destination\)/, "звук вкладки возвращается оператору");
  assert.doesNotMatch(panel, /localStorage|indexedDB/, "разговор не хранится");
  for (const path of ["/me", "/scripts", "/calls", "/stt?who=", "/hint", "/end"]) assert.ok(panel.includes(path), path);
  for (const file of ["panel.html", "mic.html"]) {
    const html = readFileSync(`${EXT}/${file}`, "utf8");
    assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/, `${file}: без встроенных скриптов`);
    assert.doesNotMatch(html, /https?:\/\//, `${file}: ничего со стороны`);
  }
});

test("архив расширения на сайте собран из текущих файлов", () => {
  assert.ok(packExtension().equals(readFileSync(ZIP_PATH)), "запустите node scripts/callhelper/pack-extension.mjs");
});

test("смена: звонок начинается по слову клиента и кончается по тишине, чужих сервисов не нужно", () => {
  assert.equal(callIsOver(0, SHIFT.silenceMs - 1), false);
  assert.equal(callIsOver(0, SHIFT.silenceMs), true, "полминуты тишины — звонок кончился");
  const held = keepHeld([{ startMs: 0 }, { startMs: 5_000 }, { startMs: 24_000 }], 25_000);
  assert.deepEqual(held.map((p: { startMs: number }) => p.startMs), [5_000, 24_000], "старое приветствие в новый звонок не идёт");
  assert.ok(keepHeld(Array.from({ length: 9 }, (_, i) => ({ startMs: i })), 10).length <= 4);

  const panel = readFileSync(`${EXT}/panel.mjs`, "utf8");
  assert.match(panel, /api\("POST", "\/stt\?who=client"/, "между звонками проверяется только голос клиента");
  assert.match(panel, /if \(who === "operator"\) rig\.held = keepHeld/, "оператор между звонками на сервер не уходит");
  assert.doesNotMatch(panel, /\/events|webhook|whk_/, "события от сервисов набора не нужны: расширение слушает само");
  const html = readFileSync(`${EXT}/panel.html`, "utf8");
  for (const id of ["shift", "stop-shift", "last-box"]) assert.ok(html.includes(`id="${id}"`), id);
});

test("адрес сервера: облако и коробка в сети офиса, ключ не уходит в чужой интернет", () => {
  const ok = (input: string, origin: string, local: boolean) => assert.deepEqual(checkServer(input), { ok: true, origin, local }, input);
  ok("https://devuz.studio", CLOUD_ORIGIN, false);
  ok("devuz.studio", CLOUD_ORIGIN, false);
  ok("https://devuz.studio/", CLOUD_ORIGIN, false);
  ok("https://devuz-1a2b.local", "https://devuz-1a2b.local", true);
  ok("devuz-1a2b.local", "https://devuz-1a2b.local", true);
  ok("http://devuz-1a2b.local", "http://devuz-1a2b.local", true);
  ok("https://192.168.1.10", "https://192.168.1.10", true);
  ok("http://10.0.0.5:8443", "http://10.0.0.5:8443", true);
  ok("https://172.20.3.4", "https://172.20.3.4", true);
  ok("http://[fd12::1]", "http://[fd12::1]", true);
  ok("http://[fe80::1]", "http://[fe80::1]", true);

  const bad = (input: string) => assert.equal(checkServer(input).ok, false, input);
  bad("");
  bad("http://devuz.studio"); // облако — только https
  bad("https://example.com"); // чужой сервер в интернете
  bad("http://example.com");
  bad("https://devuz.studio.evil.com");
  bad("https://8.8.8.8");
  bad("http://172.32.0.1");
  bad("http://192.169.0.1");
  bad("https://user:pass@192.168.1.10");
  bad("https://192.168.1.10/office");
  bad("https://192.168.1.10/?x=1");
  bad("https://192.168.1.10/#a");
  bad("ftp://192.168.1.10");
  bad("javascript:alert(1)");
  bad("https://.local");
  bad("http://[2001:db8::1]");

  assert.equal(isLocalHost("box.local"), true);
  assert.equal(isLocalHost("local"), false);
  assert.equal(isLocalHost("300.1.1.1"), false);
  assert.equal(permissionFor("http://10.0.0.5:8443"), "http://10.0.0.5/*", "право — на имя без порта");
  assert.equal(permissionFor("https://devuz-1a2b.local"), "https://devuz-1a2b.local/*");
});

test("ответ коробки без тарифа: «Коробка DevUz», без «null» и минут", () => {
  const boxMe = {
    org: { id: "box", name: "Клиника", plan: "box", operators: null },
    access: { ok: true, minutes_left: null, hours_left: null, minutes_included: null },
    box_class: "pro",
  };
  assert.equal(isBox(boxMe), true);
  assert.equal(quotaLine(boxMe), "Коробка DevUz, класс «pro».");
  assert.equal(quotaLine({ ...boxMe, box_class: null }), "Коробка DevUz.");
  assert.equal(quotaLine({ org: { plan: "box" }, access: { ok: true } }), "Коробка DevUz.", "полей минут может не быть вовсе");
  for (const me of [boxMe, { org: { plan: "box" }, access: { ok: true } }]) assert.doesNotMatch(quotaLine(me), /null|undefined|мин/);
  assert.equal(quotaLine({ ...boxMe, access: { ok: false, reason: "box_class" } }), "");

  assert.equal(isBox({ org: { plan: "start" }, access: { ok: true } }), false);
  assert.equal(quotaLine({ access: { ok: true, minutes_left: 40, hours_left: 50 } }), "Пробный период: осталось 40 мин и 50 ч.");
  assert.equal(quotaLine({ access: { ok: true, minutes_left: 900, minutes_included: 1000 } }), "Минут в этом месяце осталось: 900.");
  assert.equal(quotaLine({ access: { ok: true, minutes_left: 50, hours_left: null } }), "Пробный период: 50 минут с первого звонка.");
  assert.equal(quotaLine({ access: { ok: true, minutes_left: null } }), "", "облако без чисел — пустая строка, не «null»");

  const panel = readFileSync(`${EXT}/panel.mjs`, "utf8");
  for (const code of ["box_class", "box_unknown", "forbidden"]) assert.match(panel, new RegExp(`${code}: "`), `понятный текст для ${code}`);
  assert.match(panel, /\$\("quota"\)\.textContent = quotaLine\(me\)/);
});
