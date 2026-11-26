import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { CALLHELPER_API_BASE } from "@/content/callhelper-api";
import { AUDIO_MAX_BYTES, AUDIO_MIN_BYTES, AUDIO_RATE } from "@/lib/callhelper/orgs";

import { RATE, Segmenter, insertLine, makeResampler, toPcm16 } from "../extension/callhelper/audio-core.mjs";
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

test("расширение: третья версия манифеста, прав только нужные, ходит только на наш API", () => {
  const manifest = JSON.parse(readFileSync(`${EXT}/manifest.json`, "utf8"));
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual([...manifest.permissions].sort(), ["activeTab", "sidePanel", "storage", "tabCapture"]);
  assert.deepEqual(manifest.host_permissions, ["https://devuz.studio/*"]);
  assert.equal(manifest.content_scripts, undefined, "в страницы колл-центра расширение не встраивается");
  const panel = readFileSync(`${EXT}/panel.mjs`, "utf8");
  assert.ok(panel.includes(`"https://devuz.studio${CALLHELPER_API_BASE}"`), "адрес API");
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
