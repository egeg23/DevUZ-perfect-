import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * Вход в панель по подписи Telegram.
 *
 * Владелец: «я не могу как владелец перейти из бота без авторизации, можно
 * как-то легче для меня сделать? Или это поломает все?».
 *
 * Не поломает — при одном условии: «легче» не должно означать «без
 * проверки». Ссылка на карточку, открывающая панель любому, кто её
 * перешлёт, — это не удобство, это отданные наружу контакты клиентов,
 * переписки, деньги и договоры.
 *
 * Telegram умеет ровно то, что здесь нужно. Кнопка login_url под
 * сообщением: человек нажимает, Telegram открывает наш адрес и дописывает
 * к нему, кто именно нажал, подписав это ключом, который знают только
 * Telegram и наш бот. Подделать подпись, не зная токена бота, нельзя —
 * значит нажатие само по себе доказывает, кто пришёл. Ровно то же
 * доверие, на котором стоит команда /login («Telegram уже знает, кто
 * пишет»), только без пяти шагов: нажал — ты в карточке.
 *
 * Здесь — проверка этой подписи. Алгоритм Telegram: ключ равен sha256 от
 * токена бота, подпись — hmac-sha256 по всем присланным полям, кроме самой
 * подписи, отсортированным по имени и склеенным переводом строки.
 */

/** Сколько живёт подписанный переход. Столько же, сколько ссылка от /login. */
export const AUTH_FRESH_SECONDS = 15 * 60;

export type TelegramAuth = {
  id: number;
  username: string | null;
  firstName: string | null;
  /** Когда Telegram подписал переход, секунды эпохи. */
  authDate: number;
  /** Сама подпись — она же ключ одноразовости. */
  hash: string;
};

export type AuthFailure = "absent" | "malformed" | "bad_signature" | "stale";

export type AuthCheck = { ok: true; auth: TelegramAuth } | { ok: false; why: AuthFailure };

/**
 * Строка, которую подписывает Telegram.
 *
 * Берутся **все** пришедшие параметры, кроме hash, — так написано в
 * документации, и так это должно остаться: когда Telegram однажды добавит
 * в набор новое поле, перечисленный вручную список полей молча перестанет
 * сходиться, и вход сломается у всех сразу.
 *
 * Отсюда требование к адресу кнопки: у него не должно быть своих
 * параметров запроса. Куда вести после входа — сказано путём
 * (/admin/enter/leads/…), а не «?next=», именно поэтому: чужой параметр в
 * адресе попал бы в подписываемую строку и сломал бы проверку.
 */
export function dataCheckString(params: URLSearchParams): string {
  const pairs: string[] = [];
  for (const [key, value] of params) {
    if (key === "hash") continue;
    pairs.push(`${key}=${value}`);
  }
  return pairs.sort().join("\n");
}

function sameHash(a: string, b: string): boolean {
  // Сравнение за постоянное время: здесь, в отличие от сессий, сравниваются
  // не хеши в базе, а секрет, вычисленный нами, с секретом из адреса.
  // Побайтовое сравнение с ранним выходом даёт подбирающему обратную связь
  // «первые N символов верны», а 64 символа по одному подбираются быстро.
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

/**
 * Проверить переход, пришедший от кнопки login_url.
 *
 * `now` — секунды эпохи; параметром, чтобы проверка возраста подписи
 * закрывалась тестом, а не «подождите пятнадцать минут».
 */
export function checkTelegramAuth(
  params: URLSearchParams,
  botToken: string | undefined,
  now: number = Math.floor(Date.now() / 1000),
): AuthCheck {
  const hash = params.get("hash");
  const id = Number(params.get("id"));
  const authDate = Number(params.get("auth_date"));

  if (!hash && !params.get("id")) return { ok: false, why: "absent" };
  if (!hash || !Number.isFinite(id) || id <= 0 || !Number.isFinite(authDate)) {
    return { ok: false, why: "malformed" };
  }
  if (!botToken) return { ok: false, why: "bad_signature" };

  const secret = createHash("sha256").update(botToken).digest();
  const mine = createHmac("sha256", secret).update(dataCheckString(params)).digest("hex");
  if (!sameHash(mine, hash.toLowerCase())) return { ok: false, why: "bad_signature" };

  // Возраст проверяется после подписи, а не до: иначе «просрочено» стало бы
  // ответом и на поддельную подпись, то есть подсказкой подбирающему.
  //
  // Будущее тоже отсекаем: переход, подписанный «на завтра», — это либо
  // сбитые часы, либо попытка продлить себе окно.
  if (authDate > now + 60 || now - authDate > AUTH_FRESH_SECONDS) {
    return { ok: false, why: "stale" };
  }

  const username = (params.get("username") ?? "").trim();
  const firstName = (params.get("first_name") ?? "").trim();

  return {
    ok: true,
    auth: {
      id,
      username: username || null,
      firstName: firstName || null,
      authDate,
      hash: hash.toLowerCase(),
    },
  };
}

/**
 * Куда вести после входа — из хвоста адреса /admin/enter/….
 *
 * Путь собирается из сегментов, а не берётся из параметра: собранное нами
 * из кусочков не может увести на чужой сайт в принципе, и проверять адрес
 * на «а не начинается ли он с //» не приходится. Сегменты при этом всё
 * равно чужой ввод — поэтому и ограничены тем, из чего состоят наши
 * собственные адреса.
 */
const SEGMENT = /^[A-Za-z0-9._-]{1,64}$/;

/**
 * Точка и две точки — тоже «наши буквы», и это ровно та дыра, которую
 * такие проверки обычно и пропускают: /admin/../.. проходит посимвольную
 * проверку целиком, а ведёт наружу панели.
 */
const DOTS = /^\.{1,2}$/;

export function destinationFrom(segments: string[] | undefined): string {
  const clean = (segments ?? []).filter((s) => SEGMENT.test(s) && !DOTS.test(s));
  if (!clean.length || clean.length !== (segments ?? []).length) return "/admin";
  return `/admin/${clean.join("/")}`;
}
