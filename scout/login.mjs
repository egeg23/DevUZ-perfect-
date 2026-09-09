// Разовое получение строки сессии.
//
// Запускается руками, с телефоном под рукой. Строка, которую он напечатает,
// кладётся в SCOUT_SESSION на сервере — после этого скрипт входа больше не
// нужен, и повторять его придётся только если сессию отозвали.
//
// Строка сессии равносильна доступу к аккаунту: с ней можно читать всё, что
// читает человек. Хранить её в репозитории нельзя, пересылать в мессенджере
// — тоже.
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

import telegram from "teleproto";

const { TelegramClient } = telegram;
const { StringSession } = telegram.sessions;

function env(name) {
  const value = (process.env[name] || "").trim();
  if (!value) {
    console.error(
      `Не задан ${name}. api_id и api_hash берутся на https://my.telegram.org → API development tools.`,
    );
    process.exit(1);
  }
  return value;
}

const rl = createInterface({ input: stdin, output: stdout });

const client = new TelegramClient(
  new StringSession(""),
  Number(env("SCOUT_API_ID")),
  env("SCOUT_API_HASH"),
  { connectionRetries: 5 },
);

await client.start({
  phoneNumber: () => rl.question("Номер телефона (в формате +998…): "),
  password: () => rl.question("Пароль двухфакторной защиты (если включена): "),
  phoneCode: () => rl.question("Код из Telegram: "),
  onError: (error) => console.error("Ошибка входа:", error?.message ?? error),
});

const me = await client.getMe();
console.log(`\nВошли как ${me.firstName ?? ""} ${me.username ? `(@${me.username})` : ""}`.trim());
console.log("\nСтрока сессии — положите её в SCOUT_SESSION на сервере:\n");
console.log(client.session.save());
console.log("\nНикому её не пересылайте: она равносильна доступу к аккаунту.\n");

await client.disconnect();
rl.close();
