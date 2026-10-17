/**
 * Мелкие защиты из проверки безопасности 17.10.2026: сверка секретов,
 * JSON-LD, который нельзя закрыть «</script>», и ключи GitHub не по заказу.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { secretOk } from "@/lib/secret-ok";
import { jsonLdGraph, jsonLdText } from "@/lib/schema";
import { voiceSecretOk } from "@/lib/admin/voice-notes";

test("секрет: пустой ожидаемый не пускает никого, сверка точная", () => {
  assert.equal(secretOk("x", undefined), false);
  assert.equal(secretOk("", ""), false);
  assert.equal(secretOk(null, "s3cret"), false);
  assert.equal(secretOk("s3cre", "s3cret"), false);
  assert.equal(secretOk("s3cret ", "s3cret"), false);
  assert.equal(secretOk("s3cret", "s3cret"), true);
  assert.equal(voiceSecretOk("s3cret", "s3cret"), true);
  assert.equal(voiceSecretOk("s3cret", ""), false);
});

test("секреты в заголовках сверяются через secretOk, а не через ===", () => {
  for (const file of [
    "app/api/telegram/webhook/route.ts",
    "app/api/reminders/sweep/route.ts",
    "app/api/telegram/menu/route.ts",
    "app/api/indexnow/route.ts",
    "app/api/shift/report/route.ts",
  ]) {
    const src = readFileSync(file, "utf8");
    assert.match(src, /secretOk\(provided, expected\)/, file);
    assert.doesNotMatch(src, /provided !== expected/, file);
  }
});

test("JSON-LD не закрывается заголовком из чужого сайта", () => {
  const evil = { name: "</script><script>alert(1)</script>", d: "a\u2028b" };
  for (const text of [jsonLdText(evil), jsonLdGraph(evil)]) {
    assert.doesNotMatch(text, /<\/script/i);
    assert.doesNotMatch(text, /</);
    assert.doesNotMatch(text, /\u2028/);
  }
  // Для поисковика это тот же JSON.
  assert.deepEqual(JSON.parse(jsonLdText(evil)), evil);
});

test("страницы разборов отдают JSON-LD только через jsonLdText", () => {
  for (const file of ["app/[locale]/razbor/page.tsx", "app/[locale]/razbor/[slug]/page.tsx"]) {
    const src = readFileSync(file, "utf8");
    assert.doesNotMatch(src, /__html: JSON\.stringify/, file);
  }
});

test("файлы договоров и «Открыть» в «Макетах» смотрят на галочки владельца", () => {
  for (const [file, href] of [
    ["app/admin/contracts/[id]/file/route.ts", "/admin/contracts"],
    ["app/admin/contracts/[id]/signature/route.ts", "/admin/contracts"],
    ["app/admin/mockups/open/[id]/route.ts", "/admin/mockups"],
  ]) {
    assert.match(readFileSync(file, "utf8"), new RegExp(`opens\\(staff, "${href}"\\)`), file);
  }
});
