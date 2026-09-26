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
import { roadFetch } from "../lib/egress.mjs";
import { ackOffset, backoffMs, classifyError } from "./logic.mjs";

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const port = process.env.APP_PORT || "3310";

if (!token || !secret) {
  console.error("bot: нужны TELEGRAM_BOT_TOKEN и TELEGRAM_WEBHOOK_SECRET в .env");
  process.exit(1);
}

const API = `https://api.telegram.org/bot${token}`;
const APP = `http://127.0.0.1:${port}/api/telegram/webhook`;
/** Сколько Telegram держит длинный опрос, прежде чем ответить пустым списком. */
const POLL_TIMEOUT_S = 25;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
        { offset, timeout: POLL_TIMEOUT_S, allowed_updates: ["message", "callback_query"] },
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
        console.error("bot: Telegram не принимает токен — проверьте TELEGRAM_BOT_TOKEN");
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
