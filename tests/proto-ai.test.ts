/**
 * ИИ на прототипе: что модель видит, что уходит на страницу и что держит
 * расходы.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { PROTO_AI_LIMITS, TEXT_MAX, parseProtoAiRequest, shapeReply } from "@/lib/proto/ai";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const TOKEN = "T".repeat(43);

test("запрос со страницы: инструмент из списка, текст обрезан, площадка и тон — из списка", () => {
  assert.equal(parseProtoAiRequest({ token: TOKEN, tool: "hack", text: "привет" }), null);
  assert.equal(parseProtoAiRequest({ token: TOKEN, tool: "ugc", text: "" }), null);
  const req = parseProtoAiRequest({
    token: TOKEN,
    tool: "ugc",
    locale: "uz",
    text: "x".repeat(5000),
    platform: "myspace",
    tone: "angry",
    niches: ["Food", "Food", 7, "Авто"],
  });
  assert.ok(req);
  assert.equal(req.text.length, TEXT_MAX);
  assert.equal(req.locale, "uz");
  assert.equal(req.platform, "reels");
  assert.equal(req.tone, "fun");
  assert.deepEqual(req.niches, ["Food", "Авто"]);
});

test("подбор: модель не может назвать нишу, которой нет в каталоге, и выдумать формат", () => {
  const out = shapeReply(
    "match",
    { niches: ["Food", "Крипта"], budget_usd: "1200", goal: "steal", formats: ["story", "concert"], tips: ["a", "b", "c", "d"] },
    ["Food", "Авто"],
  );
  assert.deepEqual(out.niches, ["Food"]);
  assert.equal(out.budget_usd, 1200);
  assert.equal(out.goal, "awareness");
  assert.deepEqual(out.formats, ["story"]);
  assert.equal((out.tips as string[]).length, 3);
});

test("UGC: лишние поля выкидываются, хэштеги — с решёткой и без пробелов", () => {
  const out = shapeReply("ugc", {
    hooks: ["a"],
    script: [{ time: "0–3", shot: "s", voice: "v", evil: "<script>" }],
    storyboard: "нет",
    hashtags: ["вкусно ташкент", "#uzum"],
    extra: 1,
  });
  // Тире из ответа модели в макет не попадает: «0–3» → «0-3» (lib/proto/plain-text).
  assert.deepEqual(out.script, [{ time: "0-3", shot: "s", voice: "v", overlay: "" }]);
  assert.deepEqual(out.storyboard, []);
  assert.deepEqual(out.hashtags, ["#вкусноташкент", "#uzum"]);
  assert.equal("extra" in out, false);
});

test("модель — дешёвая, ключ — только на сервере, прототип включает ИИ явно", () => {
  const lib = read("lib/proto/ai.ts");
  assert.match(lib, /process\.env\.PROTO_AI_MODEL \|\| "claude-haiku-4-5"/, "ИИ на макете съехал с Haiku");
  assert.match(lib, /facts as \{ ai\?: unknown \}/, "инструменты включаются не списком в фактах прототипа");
  assert.match(lib, /status === "draft"/, "черновику модель доступна");

  const route = read("app/api/proto-ai/route.ts");
  for (const key of ["proto-ai:ip:", "proto-ai:proto:", "proto-ai:all"]) {
    assert.ok(route.includes(key), `нет лимита ${key}`);
  }
  assert.ok(PROTO_AI_LIMITS.ip.limit <= 20 && PROTO_AI_LIMITS.all.limit <= 2000, "лимиты разъехались — это деньги");
  assert.doesNotMatch(route, /ANTHROPIC_API_KEY/, "ключ не должен светиться в маршруте");
});
