#!/usr/bin/env node
//
// Проверка ключа Вордстата — руками, на сервере, без статьи.
//
//   cd /opt/devuz && set -a && . .env && set +a
//   node --import ./tests/alias-hook.mjs scripts/seo/wordstat-check.mjs
//
// Владелец, 15.11.2026: «Яндекс Клауд оплатил, теперь ключи для вордстата
// должны работать, проверь». Ключ берётся тем же путём, что у статей
// (appSecret → .env или хранилище), запрос — тем же wordstatRequest. В вывод —
// только статус, вид ключа (облако или OAuth), код и текст ошибки Яндекса и
// первые фразы. Сам ключ не печатается: журнал задачи публичный.
import { appSecret } from "@/lib/secrets";
import { WORDSTAT_UZ, wordstatPhrases, wordstatRequest } from "@/lib/seo/keywords";

const PHRASES = ["разработка сайтов", "сайт"];
const RU = 225; // Россия: если по Узбекистану пусто, видно, что ключ всё равно работает

const token = await appSecret("WORDSTAT_TOKEN");
if (!token) {
  console.log("Ключа нет: WORDSTAT_TOKEN пуст и в .env, и в хранилище.");
  process.exit(1);
}
console.log(`Ключ: ${token.startsWith("AQVN") ? "API-ключ Яндекс Облака" : "OAuth-токен"}, длина ${token.length}.`);

let worked = false;
for (const [phrase, region] of [[PHRASES[0], WORDSTAT_UZ], [PHRASES[1], WORDSTAT_UZ], [PHRASES[0], RU]]) {
  const { url, init } = wordstatRequest(token, phrase, region);
  try {
    const response = await fetch(url, { ...init, signal: AbortSignal.timeout(20_000) });
    const text = await response.text();
    let body = null;
    try { body = JSON.parse(text); } catch {}
    if (response.ok) {
      const phrases = wordstatPhrases(body);
      worked = true;
      console.log(`«${phrase}», регион ${region}: ответ ${response.status}, фраз ${phrases.length}.`);
      for (const p of phrases.slice(0, 5)) console.log(`   ${p.phrase} — ${p.value}`);
    } else {
      // У облака ошибка — { code, message, details }; ключ в ответ не попадает.
      const message = String(body?.message ?? body?.error ?? text).replaceAll(token, "***").slice(0, 300);
      console.log(`«${phrase}», регион ${region}: ответ ${response.status}. Яндекс: ${message}`);
    }
  } catch (error) {
    console.log(`«${phrase}», регион ${region}: не ответил (${error instanceof Error ? error.message : String(error)}).`);
  }
}
console.log(worked ? "Итог: Вордстат отвечает." : "Итог: Вордстат не отвечает — причина в строках выше.");
process.exit(worked ? 0 : 1);
