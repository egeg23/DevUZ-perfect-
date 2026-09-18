import { NextResponse, type NextRequest } from "next/server";

import { record } from "@/lib/admin/audit";
import {
  ABSOLUTE_DAYS,
  SESSION_COOKIE,
  createSession,
  hashToken,
  staffByTelegramId,
} from "@/lib/admin/session";
import { AUTH_FRESH_SECONDS, checkTelegramAuth, destinationFrom } from "@/lib/admin/tg-auth";
import { ipFromHeaders, rateLimit } from "@/lib/qualify/limiter";
import { absoluteUrl } from "@/lib/seo";
import { serviceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Вход по нажатию кнопки в Telegram — и сразу туда, куда человек шёл.
 *
 * Было так: уведомление о лиде приходит в чат, в нём ссылка на карточку,
 * владелец по ней нажимает — и попадает на страницу входа. Дальше надо
 * выйти из уведомления, найти чат с ботом, написать /login, вернуться,
 * нажать ссылку, нажать «Войти» и заново найти тот самый лид. Шесть
 * действий, чтобы посмотреть одну карточку; в третий раз за день их уже
 * никто не делает, и панель перестают открывать вовсе.
 *
 * Стало: кнопка «Открыть карточку» под тем же уведомлением. Telegram сам
 * подписывает, кто её нажал, — и мы заводим сессию этому человеку и ведём
 * его в ту самую карточку. Пароля по-прежнему нет, проверка по-прежнему
 * есть, а шагов один.
 *
 * Три вещи, без которых это было бы дырой, а не удобством:
 *
 * 1. Подпись. Её кладёт Telegram ключом, который знает только он и наш
 *    бот, — см. lib/admin/tg-auth.ts. Ссылка без подписи или с чужой
 *    подписью не входит никуда.
 * 2. Одноразовость. Подписанный адрес виден в адресной строке и попадает
 *    в историю браузера; переслать его — значит переслать вход. Поэтому
 *    подпись гасится здесь же, через тот же уникальный индекс
 *    login_tokens.token_hash, что и ссылки от /login: второй переход по
 *    тому же адресу уже не работает.
 * 3. Свежесть. Кнопка живёт под сообщением вечно, но подпись Telegram
 *    ставит в момент нажатия, и мы принимаем её пятнадцать минут — ровно
 *    столько же, сколько живёт ссылка от /login.
 *
 * Кто не сотрудник — не входит: нажать кнопку может любой участник чата
 * отдела, и это нормально. Ответ ему такой же, как при любой неудаче.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ to?: string[] }> },
) {
  const ip = ipFromHeaders(request.headers);
  const { to } = await context.params;
  const destination = destinationFrom(to);

  const fail = (code: string) => {
    const response = NextResponse.redirect(absoluteUrl(`admin/login?e=${code}`));
    // Панель закрыта от индексации раскладкой, а обработчик маршрута
    // раскладку не наследует: заголовок ставится здесь руками.
    response.headers.set("x-robots-tag", "noindex, nofollow");
    return response;
  };

  // Тот же лимит, что и у формы входа, и по той же причине: каждая
  // неудачная попытка пишет строку в неудаляемый журнал.
  if (!rateLimit(`admin-enter:${ip}`, { limit: 10, windowMs: 10 * 60 * 1000 }).ok) {
    return fail("3");
  }

  const checked = checkTelegramAuth(
    request.nextUrl.searchParams,
    process.env.TELEGRAM_BOT_TOKEN,
  );
  if (!checked.ok) {
    // «Ссылки нет» — это просто человек, открывший адрес руками; такое в
    // журнал не пишем, чтобы не наполнять его собственными опечатками.
    if (checked.why !== "absent") await record("login.failed", { ip, meta: { via: "telegram_button", why: checked.why } });
    return fail(checked.why === "stale" ? "4" : "1");
  }

  const staff = await staffByTelegramId(checked.auth.id);
  if (!staff) {
    await record("login.failed", { ip, meta: { via: "telegram_button", why: "not_staff" } });
    return fail("1");
  }

  const db = serviceClient();
  if (!db) return fail("2");

  // Гашение подписи. Вставка в таблицу с уникальным индексом по хешу — это
  // проверка и запись одной операцией: две одновременные попытки открыть
  // один адрес дают сессию ровно одной.
  const { error: spent } = await db.from("login_tokens").insert({
    staff_id: staff.id,
    token_hash: hashToken(checked.auth.hash),
    expires_at: new Date((checked.auth.authDate + AUTH_FRESH_SECONDS) * 1000).toISOString(),
    used_at: new Date().toISOString(),
  });
  if (spent) {
    await record("login.failed", { actorStaffId: staff.id, ip, meta: { via: "telegram_button", why: "replay" } });
    return fail("4");
  }

  const session = await createSession(staff.id, ip, request.headers.get("user-agent"));
  if (!session) return fail("2");

  await record("login.succeeded", {
    actorStaffId: staff.id,
    ip,
    meta: { role: staff.role, via: "telegram_button", to: destination },
  });

  const response = NextResponse.redirect(absoluteUrl(destination.slice(1)));
  response.headers.set("x-robots-tag", "noindex, nofollow");
  response.cookies.set(SESSION_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: ABSOLUTE_DAYS * 24 * 3600,
  });
  return response;
}
