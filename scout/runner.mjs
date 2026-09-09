// Читатель публичных чатов.
//
// Единственное, что он делает, — читает. Ни одного вызова, который
// отправляет сообщение, здесь нет и быть не должно: отвечает оператор
// руками и в том же чате. Это не осторожность ради осторожности — именно
// рассылка, а не чтение, приводит к ограничениям на аккаунт.
//
// Живёт отдельным пакетом, чтобы сайту не достались его зависимости:
// в приложении их пять, и так и должно остаться.
import { readFileSync } from "node:fs";
// teleproto — пакет CommonJS без карты экспортов, поэтому импорт подпапки
// («teleproto/sessions») в ESM не резолвится. Берём всё с верхнего уровня.
import telegram from "teleproto";

import { createBuffer } from "@/lib/scout/buffer";
import { classify } from "@/lib/scout/classify";
import { processBatch } from "@/lib/scout/store";

const DRY_RUN = process.argv.includes("--dry-run");

/**
 * Окно накопления и размер пачки.
 *
 * Минута — компромисс: в оживлённом чате пачка набирается раньше и уходит
 * сразу, а в тихом сообщение не лежит до вечера.
 */
const FLUSH_MS = Number(process.env.SCOUT_FLUSH_MS || 60_000);
const MAX_BATCH = Number(process.env.SCOUT_MAX_BATCH || 20);

function env(name, required = true) {
  const value = (process.env[name] || "").trim();
  if (!value && required) {
    console.error(`scout: не задан ${name}`);
    process.exit(1);
  }
  return value;
}

/**
 * Список чатов, за которыми следим.
 *
 * Только чтение уже вступивших чатов. Вступать скрипт не умеет намеренно:
 * массовое вступление — как раз то поведение, по которому аккаунт получает
 * ограничение. В чаты человек входит сам, руками и не за один день.
 */
function chats() {
  const raw = (process.env.SCOUT_CHATS || "").trim();
  if (!raw) {
    console.error(
      "scout: не задан SCOUT_CHATS — список чатов через запятую, " +
        "например «uzdevs,@tashkent_it,-1001234567890»",
    );
    process.exit(1);
  }
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Сообщение Telegram → то, что понимает наш разбор. */
function shape(message) {
  const chat = message.chat ?? {};
  const sender = message.sender ?? {};

  // У чата id хранится без префикса -100, а ссылки и наши ключи строятся
  // с ним. Приводим к тому виду, в котором его показывает сам Telegram.
  const rawId = chat.id?.toString?.() ?? "";
  const chatId = rawId && !rawId.startsWith("-") ? Number(`-100${rawId}`) : Number(rawId);

  return {
    chatId,
    chatTitle: chat.title ?? null,
    chatUsername: chat.username ?? null,
    messageId: Number(message.id),
    authorTelegramId: sender.id ? Number(sender.id.toString()) : null,
    authorUsername: sender.username ?? null,
    text: message.message ?? "",
  };
}

async function flushBatch(batch) {
  const run = await processBatch(batch, classify);
  console.log(
    `scout: увидел ${run.seen}, до модели дошло ${run.passedPrefilter}, ` +
      `разобрано ${run.classified}, сохранено ${run.saved}, отправлено ${run.notified}`,
  );
}

const buffer = createBuffer({
  flushMs: FLUSH_MS,
  maxBatch: MAX_BATCH,
  onFlush: flushBatch,
});

/**
 * Холостой прогон: гоняет заготовленные сообщения через тот же путь, что и
 * живые, но без подключения к Telegram. Нужен, чтобы проверить связку
 * «отсев → модель → база → канал оператора» до того, как в дело пойдёт
 * настоящий аккаунт.
 */
async function dryRun() {
  const file = process.env.SCOUT_SAMPLE || new URL("./sample.json", import.meta.url);
  const sample = JSON.parse(readFileSync(file, "utf8"));

  console.log(`scout: холостой прогон, ${sample.length} сообщений, Telegram не трогаем`);
  for (const message of sample) buffer.push(message);
  await buffer.stop();
}

async function live() {
  const { TelegramClient } = telegram;
  const { StringSession } = telegram.sessions;
  const { NewMessage } = telegram.events;

  const session = new StringSession(env("SCOUT_SESSION"));
  const client = new TelegramClient(
    session,
    Number(env("SCOUT_API_ID")),
    env("SCOUT_API_HASH"),
    { connectionRetries: 5 },
  );

  await client.connect();
  if (!(await client.isUserAuthorized())) {
    console.error("scout: сессия недействительна — выполните npm run login");
    process.exit(1);
  }

  const watched = chats();
  console.log(`scout: читаю ${watched.length} чатов, окно ${FLUSH_MS / 1000} с`);

  client.addEventHandler((event) => {
    const message = event.message;
    if (!message?.message) return;
    // Свои сообщения не разбираем: оператор отвечает из этого же аккаунта.
    if (message.out) return;
    buffer.push(shape(message));
  }, new NewMessage({ chats: watched }));

  const stop = async (signal) => {
    console.log(`scout: ${signal}, дочитываю накопленное`);
    await buffer.stop();
    await client.disconnect();
    process.exit(0);
  };
  process.on("SIGINT", () => void stop("SIGINT"));
  process.on("SIGTERM", () => void stop("SIGTERM"));
}

await (DRY_RUN ? dryRun() : live());
