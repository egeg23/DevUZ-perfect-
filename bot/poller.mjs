// Забор обновлений у Telegram вместо вебхука.
//
// Вебхук требует, чтобы Telegram сам дозвонился до сервера. С дата-центров
// Telegram до сервера в России соединения рвутся: в getWebhookInfo стояло
// «Connection timed out» в обычное время, без выкаток, а команда /login
// разбиралась через минуты — Telegram откладывает повтор после каждого
// сбоя. Исходящие соединения через прокси при этом работают — так ходит
// скаут и так приложение шлёт сообщения.
//
// Поэтому обновления забираем сами: getUpdates через прокси (или в обход
// него, если он умер), а каждое обновление отдаём приложению на localhost
// тем же запросом, что прислал бы Telegram, — с тем же секретом в
// заголовке. Код обработки не меняется вовсе.
//
// Живёт на хосте под systemd, как скаут: долгоживущий цикл, а не задача по
// расписанию. Зависимостей нет — только fetch и lib/egress.mjs из того же
// репозитория.
import { dbFetch, roadFetch } from "../lib/egress.mjs";
import { ackOffset, backoffMs, classifyError } from "./logic.mjs";

// Один поллер — на любого бота с этого сервера. По умолчанию — бот студии;
// бот школы Дарьи запускается тем же файлом с тремя переменными в юните
// (deploy/devuz-maximova-bot.service): из какой переменной брать токен и
// секрет и на какой адрес приложения отдавать обновления.
const TOKEN_VAR = process.env.POLLER_TOKEN_VAR || "TELEGRAM_BOT_TOKEN";
const SECRET_VAR = process.env.POLLER_SECRET_VAR || "TELEGRAM_WEBHOOK_SECRET";
const APP_PATH = process.env.POLLER_APP_PATH || "/api/telegram/webhook";
// Какие обновления забирать. Боту ИИ-сотрудников нужны ещё business_* —
// сообщения Telegram Business (deploy/devuz-ai-staff-bot.service).
const UPDATES = (process.env.POLLER_UPDATES || "message,callback_query").split(",").map((u) => u.trim()).filter(Boolean);
// Секреты бота ИИ-сотрудников лежат в хранилище Supabase, а не в .env:
// владелец передал токен в разговоре, и выкатка .env не пишет. Тогда
// поллер спрашивает их у базы той же функцией app_secret, что и сайт.
const FROM_VAULT = process.env.POLLER_FROM_VAULT === "1";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function vaultSecret(name) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  try {
    const response = await dbFetch(`${url}/rest/v1/rpc/app_secret`, {
      method: "POST",
      headers: { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ p_name: `app.${name}` }),
      signal: AbortSignal.timeout(15_000),
    });
    const value = response.ok ? await response.json() : null;
    return typeof value === "string" && value.trim() ? value.trim() : null;
  } catch {
    return null;
  }
}

async function secretValue(name) {
  return process.env[name] || (FROM_VAULT ? await vaultSecret(name) : null);
}

let token = await secretValue(TOKEN_VAR);
let secret = await secretValue(SECRET_VAR);
// Из хранилища секрета может ещё не быть — бот сервиса подключают позже
// выкатки. Ждём его, а не падаем: иначе systemd перезапускал бы поллер
// каждые пять секунд и засорял journal.
while (FROM_VAULT && (!token || !secret)) {
  console.error(`bot: ${TOKEN_VAR} или ${SECRET_VAR} нет в хранилище — проверю через 5 минут`);
  await sleep(5 * 60_000);
  token = await secretValue(TOKEN_VAR);
  secret = await secretValue(SECRET_VAR);
}
const port = process.env.APP_PORT || "3310";

if (!token || !secret) {
  console.error(`bot: нужны ${TOKEN_VAR} и ${SECRET_VAR} в .env`);
  process.exit(1);
}

const API = `https://api.telegram.org/bot${token}`;
// Адрес вебхука бота ИИ-сотрудников содержит секрет: /api/ai-staff/tg/{secret}.
const APP = `http://127.0.0.1:${port}${APP_PATH.replace("{secret}", secret)}`;
/** Сколько Telegram держит длинный опрос, прежде чем ответить пустым списком. */
const POLL_TIMEOUT_S = 25;

class ApiError extends Error {
  constructor(status, description) {
    super(description);
    this.status = status;
  }
}

// Дорога — через прокси или напрямую — та, что сработала последней
// (lib/egress.mjs). 25–26 сентября умер прокси, и поллер сутки не видел ни
// одной команды — хотя напрямую api.telegram.org отвечал.
async function tg(method, payload, timeoutMs) {
  const response = await roadFetch(`${API}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    throw new ApiError(response.status, data.description ?? `HTTP ${response.status}`);
  }
  return data.result;
}

/** Отдать обновление приложению. Не дошло — вернёт false, offset не двигаем. */
async function deliver(update) {
  try {
    const response = await fetch(APP, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-telegram-bot-api-secret-token": secret,
      },
      body: JSON.stringify(update),
      signal: AbortSignal.timeout(15_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

let stopping = false;
for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    stopping = true;
  });
}

async function main() {
  // Пока стоит вебхук, getUpdates отвечает 409. Снимаем, не теряя очередь.
  await tg("deleteWebhook", { drop_pending_updates: false }, 20_000);
  console.log(`bot: вебхук снят, забираю обновления сам и отдаю на ${APP}`);

  let offset = 0;
  let failures = 0;

  while (!stopping) {
    let updates;
    try {
      updates = await tg(
        "getUpdates",
        { offset, timeout: POLL_TIMEOUT_S, allowed_updates: UPDATES },
        (POLL_TIMEOUT_S + 15) * 1_000,
      );
      failures = 0;
    } catch (error) {
      failures++;
      const kind = error instanceof ApiError ? classifyError(error.status, error.message) : "retry";
      const wait = backoffMs(failures);
      if (kind === "conflict") {
        console.error(`bot: Telegram ответил 409 — вебхук поставлен снова или запущен второй поллер; пробую снять через ${wait} мс`);
        await sleep(wait);
        await tg("deleteWebhook", { drop_pending_updates: false }, 20_000).catch(() => undefined);
      } else if (kind === "token") {
        console.error(`bot: Telegram не принимает токен — проверьте ${TOKEN_VAR}`);
        await sleep(30_000);
      } else {
        console.error(`bot: ${error.message}; пауза ${wait} мс`);
        await sleep(wait);
      }
      continue;
    }

    for (const update of updates) {
      let ok = false;
      // Приложение может быть на перезапуске (выкатка): несколько попыток с
      // паузой, а не потеря обновления. Не приняло — offset остаётся, и
      // следующий getUpdates отдаст тот же список.
      for (let attempt = 1; attempt <= 5 && !ok && !stopping; attempt++) {
        ok = await deliver(update);
        if (!ok) await sleep(2_000 * attempt);
      }
      if (!ok) {
        console.error(`bot: приложение не приняло update ${update.update_id}, повторю`);
        await sleep(3_000);
        break;
      }
      offset = ackOffset(offset, update.update_id);
    }
  }
  console.log("bot: остановлен");
}

main().catch((error) => {
  console.error("bot:", error);
  process.exit(1);
});
