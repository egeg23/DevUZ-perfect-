/**
 * Голосовое → текст в боте студии (lib/admin/voice-notes.ts).
 *
 * Владелец, 14.10.2026: «Я не могу скачать его. Только переслать. Давай я
 * боту перешлю, а ты сам закинешь и через гит расшифруем».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { circleFromMessage } from "@/lib/admin/circle-bot";
import {
  VOICE_MAX_TEXT,
  VOICE_MAX_TRIES,
  VOICE_STALE_MS,
  cleanTranscript,
  doneText,
  failedText,
  formatDuration,
  isGivenUp,
  isTakeable,
  isVoiceId,
  receivedText,
  transcribesVoice,
  voiceFromMessage,
  voiceProblem,
  voiceSecretOk,
} from "@/lib/admin/voice-notes";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("голосовое, аудио и запись файлом — на расшифровку; кружок — нет", () => {
  assert.deepEqual(voiceFromMessage({ voice: { file_id: "v1", duration: 252, mime_type: "audio/ogg", file_size: 900_000 } }), {
    fileId: "v1",
    mime: "audio/ogg",
    duration: 252,
    bytes: 900_000,
  });
  assert.equal(voiceFromMessage({ audio: { file_id: "a1", mime_type: "audio/mpeg" } })?.mime, "audio/mpeg");
  assert.equal(voiceFromMessage({ document: { file_id: "d1", file_name: "ТЗ клиента.m4a" } })?.fileId, "d1");
  assert.equal(voiceFromMessage({ document: { file_id: "d2", mime_type: "audio/ogg" } })?.fileId, "d2");
  assert.equal(voiceFromMessage({ document: { file_id: "d3", mime_type: "application/pdf", file_name: "кп.pdf" } }), null);
  // Кружок — это кружок для касаний (circle-bot), голосом он не считается.
  const circle = { video_note: { file_id: "c1", length: 384, duration: 40 } };
  assert.equal(voiceFromMessage(circle as never), null);
  assert.ok(circleFromMessage(circle));
  assert.equal(voiceFromMessage(undefined), null);
});

test("расшифровка — владельцу и руководителю, менеджеру нет", () => {
  assert.equal(transcribesVoice({ role: "admin" }), true);
  assert.equal(transcribesVoice({ role: "head" }), true);
  assert.equal(transcribesVoice({ role: "manager" }), false);
});

test("больше 20 МБ и длиннее часа — сразу ответ, без очереди", () => {
  assert.equal(voiceProblem({ fileId: "x", mime: "audio/ogg", duration: 240, bytes: 1_000_000 }), null);
  assert.equal(voiceProblem({ fileId: "x", mime: "audio/ogg", duration: 240, bytes: 21 * 1024 * 1024 }), "too_big");
  assert.equal(voiceProblem({ fileId: "x", mime: "audio/ogg", duration: 3601, bytes: null }), "too_long");
});

test("длина — как в Telegram, ответы — по-русски и без жаргона", () => {
  assert.equal(formatDuration(252), "4:12");
  assert.equal(formatDuration(5), "0:05");
  assert.equal(formatDuration(3725), "1:02:05");
  assert.equal(formatDuration(null), "");
  assert.match(receivedText({ fileId: "x", mime: "audio/ogg", duration: 252, bytes: null }), /Получил голосовое \(4:12\)/);
  assert.match(doneText(252, "Нужен сайт для мебели."), /^📝 Расшифровка голосового \(4:12\):\n\nНужен сайт для мебели\.$/);
  assert.match(doneText(null, "  "), /не расслышал слов/);
  assert.match(failedText(252), new RegExp(`${VOICE_MAX_TRIES} попытки`));
  const long = doneText(10, "а".repeat(VOICE_MAX_TEXT + 50));
  assert.match(long, /текст обрезан/);
});

test("текст от задачи — без управляющих символов и лишних пустых строк", () => {
  assert.equal(cleanTranscript("Первый\r\n\r\n\r\n\r\nВторой\u0007"), "Первый\n\nВторой");
  assert.equal(cleanTranscript(""), "");
  assert.equal(cleanTranscript(42), null);
  assert.equal(cleanTranscript(undefined), null);
});

test("очередь: новый и зависший берутся, исчерпавший попытки — нет, ему строка", () => {
  const now = new Date("2026-10-14T10:00:00Z");
  const stale = new Date(now.getTime() - VOICE_STALE_MS - 1000).toISOString();
  const fresh = new Date(now.getTime() - 60_000).toISOString();
  assert.equal(isTakeable({ status: "queued", tries: 0, taken_at: null }, now), true);
  assert.equal(isTakeable({ status: "queued", tries: 1, taken_at: fresh }, now), true, "вернули в очередь после ошибки");
  assert.equal(isTakeable({ status: "working", tries: 1, taken_at: fresh }, now), false, "в работе — второй раз не отдаём");
  assert.equal(isTakeable({ status: "working", tries: 1, taken_at: stale }, now), true, "задача упала на середине");
  assert.equal(isTakeable({ status: "working", tries: VOICE_MAX_TRIES, taken_at: stale }, now), false);
  assert.equal(isTakeable({ status: "done", tries: 1, taken_at: fresh }, now), false);
  assert.equal(isGivenUp({ status: "working", tries: VOICE_MAX_TRIES, taken_at: stale }, now), true);
  assert.equal(isGivenUp({ status: "working", tries: VOICE_MAX_TRIES, taken_at: fresh }, now), false, "ещё может прислать текст");
  assert.equal(isGivenUp({ status: "working", tries: 1, taken_at: stale }, now), false);
});

test("вход задачи — только по секрету; секрета нет — не пускаем никого", () => {
  assert.equal(voiceSecretOk("s3cret", "s3cret"), true);
  assert.equal(voiceSecretOk("wrong", "s3cret"), false);
  assert.equal(voiceSecretOk(null, "s3cret"), false);
  assert.equal(voiceSecretOk("", ""), false);
  assert.equal(voiceSecretOk(null, undefined), false);
  assert.equal(isVoiceId("0b9f3c1e-2d4a-4b6c-8e0f-1a2b3c4d5e6f"), true);
  assert.equal(isVoiceId("../../etc"), false);
  for (const path of ["app/api/voice/queue/route.ts", "app/api/voice/[id]/audio/route.ts", "app/api/voice/[id]/text/route.ts"]) {
    assert.match(read(path), /if \(!\(await voiceAuthorized\(request\)\)\) \{\n\s+return new Response\("forbidden", \{ status: 403 \}\);/, path);
  }
});

test("бот: голос разбирается после кружка и до остальных команд", () => {
  const route = read("app/api/telegram/webhook/route.ts");
  const circle = route.indexOf("handleCircleUpload(update.message)");
  const voice = route.indexOf("handleVoice(update.message)");
  const stream = route.indexOf("handleStreamCommand(update.message)");
  assert.ok(circle > 0 && voice > circle && stream > voice);
  assert.match(route, /transcribesVoice\(staff\)/);
});

test("расшифровка — в Actions, а не на сервере, и журнал без слов из записи", () => {
  const workflow = read(".github/workflows/voice-transcribe.yml");
  assert.match(workflow, /runs-on: ubuntu-latest/);
  assert.doesNotMatch(workflow, /ssh-action|VPS_HOST/, "на сервер не ходим: Whisper тяжёлый");
  // Пропуск — от GitHub (OIDC), а не секрет с сервера.
  assert.match(workflow, /id-token: write/);
  assert.doesNotMatch(workflow, /SHIFT_REPORT_SECRET|VPS_SSH_KEY/);
  // Свежий PyAV не принимает metadata_errors от faster-whisper — версии закреплены.
  assert.match(workflow, /"faster-whisper==[\d.]+" "av==[\d.]+"/);
  const script = read("scripts/voice-transcribe.py");
  // Печатается только длина и число знаков, сам текст — никогда.
  for (const line of script.split("\n").filter((l) => /\bprint\(/.test(l))) {
    assert.doesNotMatch(line, /\{text\}|\{audio\}|\{segments/, line.trim());
  }
  assert.doesNotMatch(read("lib/admin/voice-notes.ts"), /anthropic|claude-|callModel/i, "без платной модели");
});
