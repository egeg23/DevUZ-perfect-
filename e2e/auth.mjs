// Сквозной тест этапа 2 в настоящем браузере на поднятом стеке Compose:
// регистрация → письмо → подтверждение → вход → 2FA → выход → вход с кодом.
//
//   node e2e/auth.mjs http://localhost:3471 "<команда compose без up>"
//
// Письма читаются из таблицы outbox_emails (SMTP в тесте нет).
import { createHmac } from "node:crypto";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";

const [, , BASE, COMPOSE] = process.argv;
const email = `e2e-${Date.now()}@example.com`;
const password = "e2e long password 1";

function lastLink(kind) {
  const sql = `SELECT body FROM outbox_emails WHERE "to"='${email}' ORDER BY id DESC LIMIT 1`;
  const [cmd, ...args] = COMPOSE.split(/\s+/);
  const body = execFileSync(cmd, [
    ...args, "exec", "-T", "postgres", "psql", "-U", "sunscrypt", "-d", "sunscrypt", "-At", "-c", sql,
  ]).toString();
  const m = body.match(new RegExp(`/${kind}\\?token=(\\S+)`));
  if (!m) throw new Error(`нет ссылки ${kind} в письме`);
  return `${BASE}/${kind}?token=${m[1]}`;
}

function totp(secret, at = Date.now()) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const c of secret.replace(/=+$/, "")) bits += alphabet.indexOf(c).toString(2).padStart(5, "0");
  const key = Buffer.from(bits.match(/.{8}/g).map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(at / 1000 / 30)));
  const h = createHmac("sha1", key).update(counter).digest();
  const o = h[h.length - 1] & 15;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1e6).padStart(6, "0");
}

const step = (s) => console.log(`▸ ${s}`);
const browser = await chromium.launch();
const page = await browser.newPage();
page.setDefaultTimeout(15000);
try {
  step("регистрация");
  await page.goto(`${BASE}/register`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.check('input[type="checkbox"]');
  await page.click("button.btn");
  await page.getByText("Мы отправили письмо").waitFor();

  step("вход до подтверждения почты — отказ");
  await page.goto(`${BASE}/login`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click("button.btn >> text=Войти");
  await page.getByText("Подтвердите почту").first().waitFor();

  step("подтверждение по ссылке из письма");
  await page.goto(lastLink("verify"));
  await page.getByText("Почта подтверждена").waitFor();

  step("вход");
  await page.goto(`${BASE}/login`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click("button.btn >> text=Войти");
  await page.waitForURL(`${BASE}/account`);

  step("включение 2FA");
  await page.click("text=Включить 2FA");
  const secret = (await page.locator("code").first().textContent()).trim();
  await page.fill('input[name="code"]', totp(secret));
  await page.click("text=Подтвердить и включить");
  await page.getByText("Включена.").waitFor();

  step("выход и вход с кодом 2FA");
  await page.click("text=Выйти");
  await page.waitForURL(`${BASE}/login`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click("button.btn >> text=Войти");
  await page.locator('input[name="code"]').waitFor();
  // Код следующего шага: текущий уже израсходован при включении.
  await page.fill('input[name="code"]', totp(secret, Date.now() + 30000));
  await page.click("text=Подтвердить");
  await page.waitForURL(`${BASE}/account`);
  await page.getByText("Включена.").waitFor();
  await page.getByText("Код 2FA").first().waitFor();

  step("сброс пароля");
  await page.click("text=Выйти");
  await page.goto(`${BASE}/forgot`);
  await page.fill('input[name="email"]', email);
  await page.click("text=Прислать ссылку");
  await page.getByText("пришла ссылка").waitFor();
  await page.goto(lastLink("reset"));
  await page.fill('input[name="password"]', "new e2e password 2");
  await page.fill('input[name="password2"]', "new e2e password 2");
  await page.click("text=Сохранить");
  await page.getByText("Пароль изменён").waitFor();

  console.log("✓ e2e: полный цикл регистрации и входа пройден");
} catch (e) {
  await page.screenshot({ path: "e2e-failure.png", fullPage: true }).catch(() => {});
  console.error("✗ e2e:", e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
