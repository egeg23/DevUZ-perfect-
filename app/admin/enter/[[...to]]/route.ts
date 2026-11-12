import { NextResponse, type NextRequest } from "next/server";

import { record } from "@/lib/admin/audit";
import {
  SESSION_MAX_AGE_SECONDS,
  SESSION_COOKIE,
  createSession,
  hashToken,
  findStaffByTelegram,
} from "@/lib/admin/session";
import { PANEL_LANG_COOKIE } from "@/lib/admin/i18n";
import { NEXT_COOKIE, returnTo } from "@/lib/admin/return-to";
import { AUTH_FRESH_SECONDS, checkTelegramAuth, destinationFrom } from "@/lib/admin/tg-auth";
import { homeOf } from "@/lib/admin/roles";
import { ipFromHeaders, rateLimit } from "@/lib/qualify/limiter";
import { absoluteUrl } from "@/lib/seo";
import { serviceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Сколько входов по кнопке с одного адреса за десять минут. */
const ENTER_LIMIT = 60;

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
 *
 * Адрес без подписи — не вход, а обычная ссылка (владелец, 12.11.2026:
 * «когда нажимаешь на переход в лида сразу бы открывалась панель без
 * запроса пароля в боте»). Так сюда попадают ссылка из текста сообщения и
 * кнопка, у которой человек снял галочку «войти как …»: подписи нет, и
 * раньше это всегда кончалось страницей входа — даже у того, кто в панели
 * уже сидит. Теперь такой адрес просто ведёт на свою страницу: с живой
 * сессией она открывается сразу, без неё страница сама уведёт на вход и
 * запомнит, куда человек шёл. Сессию этот путь не заводит никому.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ to?: string[] }> },
) {
  const ip = ipFromHeaders(request.headers);
  const { to } = await context.params;
  const asked = destinationFrom(to);

  const fail = (code: string) => {
    const response = NextResponse.redirect(absoluteUrl(`admin/login?e=${code}`));
    // Панель закрыта от индексации раскладкой, а обработчик маршрута
    // раскладку не наследует: заголовок ставится здесь руками.
    response.headers.set("x-robots-tag", "noindex, nofollow");
    return response;
  };

  // Без подписи — обычная ссылка на страницу панели. До лимита и журнала:
  // базу этот путь не трогает, а открывать подряд десять лидов из одной
  // порции — обычная работа, не подбор.
  const query = request.nextUrl.searchParams;
  if (!query.get("hash") && !query.get("id")) {
    const response = NextResponse.redirect(absoluteUrl(asked.slice(1)));
    response.headers.set("x-robots-tag", "noindex, nofollow");
    return response;
  }

  // Лимит — потому что каждая неудачная попытка пишет строку в неудаляемый
  // журнал. Шестьдесят, а не десять: кнопка «🔓» стоит у каждого лида в
  // порции бота, порций по восемь, а офис выходит в сеть с одного адреса.
  // Подобрать подпись лимит не мешает и не помогает — её держит ключ бота.
  if (!rateLimit(`admin-enter:${ip}`, { limit: ENTER_LIMIT, windowMs: 10 * 60 * 1000 }).ok) {
    return fail("3");
  }

  const checked = checkTelegramAuth(query, process.env.TELEGRAM_BOT_TOKEN);
  if (!checked.ok) {
    // «Ссылки нет» — это просто человек, открывший адрес руками; такое в
    // журнал не пишем, чтобы не наполнять его собственными опечатками.
    if (checked.why !== "absent") await record("login.failed", { ip, meta: { via: "telegram_button", why: checked.why } });
    return fail(checked.why === "stale" ? "4" : "1");
  }

  const { staff, offline } = await findStaffByTelegram(checked.auth.id);
  // База не ответила — «попробуйте позже», а не «вы не сотрудник».
  if (offline) return fail("2");
  if (!staff) {
    await record("login.failed", { ip, meta: { via: "telegram_button", why: "not_staff" } });
    return fail("1");
  }

  // Кнопка без адреса — «открыть панель». Если человека только что
  // развернуло на вход с конкретной страницы (ссылка на лид из текста
  // сообщения), ведём туда: иначе после /login он оказывался на «Главной»
  // и искал лид заново. Шёл никуда — домой (homeOf).
  const wanted = asked === "/admin" ? returnTo(request.cookies.get(NEXT_COOKIE)?.value) : asked;
  const destination = wanted === "/admin" ? homeOf(staff) : wanted;

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
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  // Память «куда шёл» отработала — и больше не нужна.
  response.cookies.set(NEXT_COOKIE, "", { path: "/admin", maxAge: 0 });
  // Зеркало языка панели для <html lang> — см. lib/admin/i18n.ts.
  response.cookies.set(PANEL_LANG_COOKIE, staff.panel_locale, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: 365 * 24 * 3600,
  });
  return response;
}
