/**
 * Трафик на дашборде владельца: Метрика и Google Analytics.
 *
 * Сеть подменяется: проверяется, что мы спрашиваем у API и как разбираем
 * ответ, — а не то, доступен ли Яндекс из машины, где идут тесты.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { createVerify, generateKeyPairSync } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { loadGa, loadMetrika, parseServiceAccount, periodDates } from "@/lib/analytics/traffic";

const ROOT = new URL("../", import.meta.url);
const read = (file: string) => readFileSync(new URL(file, ROOT), "utf8");

const realFetch = globalThis.fetch;
type Seen = { url: string; init?: RequestInit };

function stubFetch(answer: (url: string, init?: RequestInit) => unknown): Seen[] {
  const seen: Seen[] = [];
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    seen.push({ url, init });
    return new Response(JSON.stringify(answer(url, init)), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  return seen;
}

test.afterEach(() => {
  globalThis.fetch = realFetch;
  delete process.env.YANDEX_METRIKA_TOKEN;
  delete process.env.GA4_PROPERTY_ID;
  delete process.env.GA_SERVICE_ACCOUNT;
});

test("период — по Ташкенту, включая сегодня, и столько же до него", () => {
  // 22 сентября, 21:30 UTC — в Ташкенте уже 23-е.
  const d = periodDates(7, new Date("2026-09-22T21:30:00Z"));
  assert.deepEqual(d, { from: "2026-09-17", to: "2026-09-23", prevFrom: "2026-09-10", prevTo: "2026-09-16" });
});

test("без ключей — «не подключено», и в сеть не ходим", async () => {
  const seen = stubFetch(() => ({}));
  assert.deepEqual(await loadMetrika(7), { ok: false, reason: "not_configured" });
  assert.deepEqual(await loadGa(7), { ok: false, reason: "not_configured" });
  assert.equal(seen.length, 0);
});

test("Метрика: токен в заголовке, сводка, дни, источники, страницы", async () => {
  process.env.YANDEX_METRIKA_TOKEN = "ym-token";
  const seen = stubFetch((url) => {
    const q = new URL(url).searchParams;
    const dims = q.get("dimensions");
    if (!dims) return { data: [], totals: q.get("date1") === "2026-09-16" ? [120, 90, 400, 31.5, 75] : [60, 50, 150, 40, 60] };
    if (dims === "ym:s:date") return { data: [{ dimensions: [{ name: "2026-09-16" }], metrics: [10, 8] }] };
    if (dims === "ym:s:lastTrafficSource") return { data: [{ dimensions: [{ name: "Переходы из поисковых систем" }], metrics: [70] }] };
    return { data: [{ dimensions: [{ name: "/ru" }], metrics: [55] }] };
  });

  const r = await loadMetrika(7, new Date("2026-09-22T10:00:00Z"));
  assert.ok(r.ok, JSON.stringify(r));
  assert.equal(r.report.totals.visits, 120);
  assert.equal(r.report.totals.bounce, 31.5);
  assert.equal(r.report.prev.visits, 60);
  assert.deepEqual(r.report.days, [{ date: "2026-09-16", visits: 10, users: 8 }]);
  assert.equal(r.report.sources[0].name, "Переходы из поисковых систем");
  assert.equal(r.report.pages[0].name, "/ru");

  assert.equal(seen.length, 5);
  for (const s of seen) {
    assert.equal((s.init?.headers as Record<string, string>).Authorization, "OAuth ym-token");
    assert.match(s.url, /ids=112925960/);
    assert.match(s.url, /accuracy=full/);
  }

  // Второй раз — из кэша, без запросов.
  const again = await loadMetrika(7, new Date("2026-09-22T10:00:00Z"));
  assert.ok(again.ok);
  assert.equal(seen.length, 5, "кэш не сработал");
});

test("ключ сервисного аккаунта — JSON как есть или base64", () => {
  const json = JSON.stringify({ client_email: "a@b.iam.gserviceaccount.com", private_key: "-----BEGIN\\nKEY\\n-----END" });
  assert.equal(parseServiceAccount(json)?.client_email, "a@b.iam.gserviceaccount.com");
  // Экранированные переводы строк в ключе раскрываются.
  assert.equal(parseServiceAccount(json)?.private_key, "-----BEGIN\nKEY\n-----END");
  assert.equal(parseServiceAccount(Buffer.from(json).toString("base64"))?.client_email, "a@b.iam.gserviceaccount.com");
  assert.equal(parseServiceAccount("мусор"), null);
  assert.equal(parseServiceAccount(JSON.stringify({ client_email: "x" })), null);
  assert.equal(parseServiceAccount(""), null);
});

test("GA: подписанный JWT меняется на токен, отчёт разбирается", async () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  process.env.GA4_PROPERTY_ID = "123456789";
  process.env.GA_SERVICE_ACCOUNT = Buffer.from(
    JSON.stringify({ client_email: "reader@devuz.iam.gserviceaccount.com", private_key: pem }),
  ).toString("base64");

  let assertion = "";
  const seen = stubFetch((url, init) => {
    if (url.startsWith("https://oauth2.googleapis.com/token")) {
      assertion = new URLSearchParams(String(init?.body)).get("assertion") ?? "";
      return { access_token: "ga-access", expires_in: 3600 };
    }
    const m = (...v: number[]) => ({ metricValues: v.map((x) => ({ value: String(x) })) });
    return {
      reports: [
        { rows: [m(200, 150, 600, 0.42, 88)] },
        { rows: [m(100, 80, 300, 0.5, 70)] },
        { rows: [{ dimensionValues: [{ value: "20260916" }], ...m(20, 15) }] },
        { rows: [{ dimensionValues: [{ value: "Organic Search" }], ...m(120) }] },
        { rows: [{ dimensionValues: [{ value: "/ru/services" }], ...m(40) }] },
      ],
    };
  });

  const r = await loadGa(7, new Date("2026-09-22T10:00:00Z"));
  assert.ok(r.ok, JSON.stringify(r));
  assert.equal(r.report.totals.visits, 200);
  assert.equal(Math.round(r.report.totals.bounce), 42, "доля отказов GA не приведена к процентам");
  assert.deepEqual(r.report.days, [{ date: "2026-09-16", visits: 20, users: 15 }]);
  assert.equal(r.report.sources[0].name, "Organic Search");

  // JWT подписан ключом аккаунта и просит только чтение аналитики.
  const [h, c, sig] = assertion.split(".");
  const verify = createVerify("RSA-SHA256");
  verify.update(`${h}.${c}`);
  assert.ok(verify.verify(publicKey, Buffer.from(sig, "base64url")), "подпись JWT не сходится");
  const claims = JSON.parse(Buffer.from(c, "base64url").toString());
  assert.equal(claims.iss, "reader@devuz.iam.gserviceaccount.com");
  assert.equal(claims.scope, "https://www.googleapis.com/auth/analytics.readonly");

  const report = seen.find((s) => s.url.includes(":batchRunReports"));
  assert.ok(report, "отчёт не запрошен");
  assert.match(report.url, /properties\/123456789:batchRunReports/);
  assert.equal((report.init?.headers as Record<string, string>).Authorization, "Bearer ga-access");
});

test("ключи доходят до контейнера и не уходят в браузер", () => {
  const compose = read("docker-compose.yml");
  for (const name of ["YANDEX_METRIKA_TOKEN", "GA4_PROPERTY_ID", "GA_SERVICE_ACCOUNT"]) {
    assert.match(compose, new RegExp(`${name}: \\$\\{${name}:-\\}`), `${name} не доедет до контейнера`);
    assert.ok(!name.startsWith("NEXT_PUBLIC_"), `${name} ушёл бы в браузер`);
  }
  // Трафик — только во вкладке владельца.
  const page = read("app/admin/page.tsx");
  assert.match(page, /const ownerTab = staff\.role === "admin" \? ownerTabOf\(params\.tab\) : null/);
  assert.match(page, /ownerTab === "traffic" \? <TrafficPanel/);
});
