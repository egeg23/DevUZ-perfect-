/**
 * Пароль на прототип.
 *
 * Владелец, 06.10.2026: «Ставь пароль 2303 на доступ к сайту» — прототип
 * bloger.agency открывается только тому, кому пароль сказали. Без него по
 * ссылке — форма ввода, а не макет; журнал показа пишется только после
 * верного пароля (это и есть «открыл макет»).
 *
 * В базе пароля нет: в `protos.facts.lock` лежит хеш от id прототипа и
 * пароля. В браузер после верного ввода уходит кука, значение которой
 * выводится из того же хеша, — подделать её, не зная пароля, нельзя, а смена
 * пароля сама обнуляет все выданные куки.
 *
 * Четыре цифры — это 10 000 вариантов, поэтому попытки ограничены по адресу
 * (маршрут, PIN_LIMIT).
 */
import { createHash, timingSafeEqual } from "node:crypto";

/** Попыток ввода с одного адреса — дальше форма отвечает «подождите». */
export const PIN_LIMIT = { limit: 10, windowMs: 15 * 60_000 } as const;

/** Сколько живёт доступ после верного пароля. */
export const PIN_COOKIE_DAYS = 30;

const sha = (text: string) => createHash("sha256").update(text).digest("hex");

/** Хеш для `facts.lock`: так пароль и ставится на прототип. */
export function lockHash(protoId: string, pin: string): string {
  return sha(`${protoId}:${pin.trim()}`);
}

export function pinCookieName(protoId: string): string {
  return `proto_pin_${protoId.replace(/[^a-z0-9]/gi, "").slice(0, 12)}`;
}

/** Значение куки — из хеша пароля, не сам хеш. */
export function pinCookieValue(lock: string): string {
  return sha(`${lock}:open`);
}

const same = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export function pinMatches(protoId: string, lock: string, pin: string): boolean {
  return same(lockHash(protoId, pin), lock);
}

/** Есть ли у запроса кука доступа к этому прототипу. */
export function hasPinCookie(cookieHeader: string | null, protoId: string, lock: string): boolean {
  if (!cookieHeader) return false;
  const name = pinCookieName(protoId);
  for (const part of cookieHeader.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return same(rest.join("="), pinCookieValue(lock));
  }
  return false;
}

export function pinCookieHeader(protoId: string, lock: string, token: string): string {
  return [
    `${pinCookieName(protoId)}=${pinCookieValue(lock)}`,
    `Path=/proto/${token}`,
    `Max-Age=${PIN_COOKIE_DAYS * 24 * 60 * 60}`,
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
  ].join("; ");
}

export type PinState = "ask" | "wrong" | "limit";

const COPY = {
  ask: ["Прототип открывается по паролю", "Prototip parol bilan ochiladi"],
  wrong: ["Пароль не подошёл — попробуйте ещё раз", "Parol mos kelmadi — yana urinib ko‘ring"],
  limit: ["Слишком много попыток — подождите 15 минут", "Urinishlar juda ko‘p — 15 daqiqa kuting"],
} as const;

/**
 * Форма ввода пароля. Своя страница без макета: ни названия клиента, ни
 * его оформления, — только поле и кнопка. Ссылка на условия стоит и здесь:
 * это первое, что видит человек, открывший ссылку.
 */
export function pinPage(state: PinState): string {
  const [ru, uz] = COPY[state];
  const bad = state !== "ask";
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow, noarchive">
<title>DevUz Studio — прототип</title>
<style>
:root{color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;min-height:100svh;display:grid;place-items:center;padding:16px;background:#0b0d12;color:#eef0f7;font:400 16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
form{width:min(360px,100%);display:grid;gap:16px;padding:32px 24px;border-radius:20px;background:#151a2c;box-shadow:inset 0 0 0 1px rgb(255 255 255 / .1)}
h1{margin:0;font-size:20px;line-height:1.3}
p{margin:0;font-size:14px;color:${bad ? "#f5a38f" : "#9aa1b8"}}
input{width:100%;padding:12px 16px;border-radius:12px;border:1px solid rgb(255 255 255 / .2);background:#0b0d12;color:inherit;font:700 24px/1.2 system-ui,sans-serif;letter-spacing:.3em;text-align:center}
input:focus-visible{outline:3px solid #ffd15c;outline-offset:2px}
button{min-height:48px;border:0;border-radius:999px;background:#f55d3b;color:#0b0d12;font:700 16px/1 system-ui,sans-serif;cursor:pointer}
small{font-size:12px;color:#9aa1b8;text-align:center}
small a{color:#c9cddc}
</style>
</head>
<body>
<form method="post">
<h1>DevUz Studio</h1>
<p>${ru}<br>${uz}</p>
<input name="pin" type="password" inputmode="numeric" autocomplete="off" maxlength="12" required autofocus aria-label="Пароль / Parol">
<button type="submit">Открыть · Ochish</button>
<small>Прототип принадлежит DevUz Studio — <a href="https://devuz.studio/ru/mockup-terms">условия использования</a> · <a href="https://devuz.studio/uz/mockup-terms">foydalanish shartlari</a></small>
</form>
</body>
</html>`;
}
