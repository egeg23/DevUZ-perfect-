import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { IDS_PER_QUERY, prospectsByIds } from "@/lib/admin/outreach-store";

/*
 * 20.10.2026: у Дины в потоке «Получать лиды» за день набралось 405
 * компаний. Карточки читались одним запросом `id=in.(…405 id…)`, база
 * повторила адрес в заголовке Content-Location, Node не принял заголовок
 * длиннее 16 КБ — и ответ пропал целиком: «сегодня касаний 0», поток встал,
 * закрытие дня в 18:00 засчитало бы всем «не сделано».
 */

test("400+ компаний читаются частями, и каждая часть короче предела заголовка", async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";

  const urls: string[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input instanceof Request ? input.url : input);
    urls.push(url);
    const list = new URL(url).searchParams.get("id") ?? "";
    const ids = list.replace(/^in\.\(/, "").replace(/\)$/, "").split(",").filter(Boolean);
    const rows = ids.map((id) => ({ id, created_at: "2026-10-20T07:00:00Z", status: "manual" }));
    return new Response(JSON.stringify(rows), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;

  try {
    const ids = Array.from({ length: 405 }, () => randomUUID());
    const found = await prospectsByIds([...ids, ids[0]]);

    assert.equal(found.length, 405, "часть карточек потерялась");
    assert.deepEqual(new Set(found.map((p) => p.id)), new Set(ids));
    assert.equal(urls.length, Math.ceil(405 / IDS_PER_QUERY), "повтор id не должен давать лишний запрос");
    for (const url of urls) {
      // Node режет ответ, если заголовки длиннее 16 КБ; адрес — с запасом.
      assert.ok(url.length < 8 * 1024, `адрес запроса ${url.length} знаков — база вернёт его в заголовке`);
    }
  } finally {
    globalThis.fetch = original;
  }
});

test("пустой список — без запроса", async () => {
  assert.deepEqual(await prospectsByIds([]), []);
});
