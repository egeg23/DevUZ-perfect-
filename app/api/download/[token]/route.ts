import { clientIp, rateLimit } from "@/lib/qualify/limiter";
import { resolveDownload, type DeliveryRefusal } from "@/lib/store/delivery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Выдача купленного файла.
 *
 * Маршрут ничего не решает сам — все проверки живут в lib/store/delivery.ts,
 * здесь только перевод ответа в HTTP. Так они не расходятся между
 * маршрутом и страницей заказа.
 *
 * Ответ — редирект на подписанную ссылку хранилища, живущую минуту. Сам
 * файл через наш сервер не идёт: гнать двести мегабайт через контейнер на
 * VPS значило бы занять его на всё время закачки.
 */

const STATUS: Record<DeliveryRefusal, number> = {
  // Настроить выдачу может только владелец — для покупателя это наша
  // авария, а не его ошибка.
  not_configured: 503,
  bad_token: 404,
  order_not_found: 404,
  // 403, а не 402: платёж мы не принимаем и требовать его по HTTP не можем.
  not_paid: 403,
  revoked: 403,
  no_release: 503,
  daily_limit: 429,
  total_limit: 429,
  storage_error: 502,
};

const MESSAGE: Record<DeliveryRefusal, string> = {
  not_configured: "Выдача файлов пока не настроена. Напишите нам — передадим вручную.",
  bad_token: "Ссылка неверна или устарела. Откройте страницу заказа заново.",
  order_not_found: "Ссылка неверна или устарела. Откройте страницу заказа заново.",
  not_paid: "Оплата ещё не подтверждена.",
  revoked: "Доступ по этой ссылке отозван. Напишите нам.",
  no_release: "Файл готовится. Напишите нам, если ждёте дольше суток.",
  daily_limit: "Сегодня доступных скачиваний больше нет. Лимит обновится через сутки.",
  total_limit: "Лимит скачиваний исчерпан. Напишите нам — снимем ограничение.",
  storage_error: "Хранилище не ответило. Попробуйте через минуту.",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  // Ограничение здесь не от подбора — подобрать подпись HMAC нечем, — а от
  // шума: скрипт, долбящийся в маршрут, иначе кладёт по запросу в базу на
  // каждый удар.
  const ip = clientIp(request);
  const limit = rateLimit(`download:${ip}`, { limit: 30, windowMs: 10 * 60 * 1000 });
  if (!limit.ok) {
    return new Response("Слишком часто. Подождите минуту.", {
      status: 429,
      headers: { "Retry-After": String(limit.retryAfter), "Cache-Control": "no-store" },
    });
  }

  const { token } = await params;
  const result = await resolveDownload(token, ip, request.headers.get("user-agent"));

  if (!result.ok) {
    return new Response(MESSAGE[result.reason], {
      status: STATUS[result.reason],
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  // 302, а не 301: подписанная ссылка живёт минуту, и закэшированный
  // браузером постоянный редирект вёл бы на мёртвый адрес до конца жизни
  // этого браузера.
  return new Response(null, {
    status: 302,
    headers: {
      Location: result.url,
      "Cache-Control": "no-store, max-age=0",
      // Подписанная ссылка не должна уехать в Referer к самому хранилищу и
      // дальше по цепочке редиректов.
      "Referrer-Policy": "no-referrer",
    },
  });
}
