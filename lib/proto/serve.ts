import { after } from "next/server";

import { tellManager } from "@/lib/admin/outreach-talk-store";
import { SESSION_COOKIE } from "@/lib/admin/return-to";
import { looksLikeAccessToken } from "@/lib/store/access";
import { fromPanel, isPreviewFetch, openedText } from "@/lib/proto/opened";
import { isQuietProtoPath, protoContentType } from "@/lib/proto/pages";
import { logView, markOpened, protoPage } from "@/lib/proto/store";
import { PIN_LIMIT, hasPinCookie, pinCookieHeader, pinMatches, pinPage, type PinState } from "@/lib/proto/lock";
import { ipFromHeaders, rateLimit } from "@/lib/qualify/limiter";

/**
 * Прототип по ссылке — то, что открывает владелец чужого бизнеса.
 *
 * Отдаём готовый html из базы, а не собираем страницу React'ом. Причина не в
 * скорости: прототип — это самостоятельная страница со своей палитрой,
 * своими шрифтами и своим каркасом, и ей нечего делать внутри вёрстки нашего
 * сайта. Владелец должен увидеть свой бизнес, а не нашу студию с его
 * названием в шапке.
 *
 * 404 на чужой токен, а не 403: 403 подтверждает, что прототип существует.
 *
 * Черновики наружу не уходят — это решает `protoPage`, здесь их просто нет.
 *
 * `path` — страница внутри прототипа из нескольких страниц (lib/proto/pages):
 * маршруты app/proto/[token] и app/proto/[token]/[...page] отдают их одним
 * и тем же способом, с тем же журналом показа.
 */
export async function serveProto(request: Request, token: string, path = ""): Promise<Response> {
  if (!looksLikeAccessToken(token)) return new Response(null, { status: 404 });

  const page = await protoPage(token, path);
  if (!page) return new Response(null, { status: 404 });

  // Пароль на макет (lib/proto/lock): без верного пароля — форма, а не макет,
  // и в журнал показа ничего не пишется.
  if (page.lock && !hasPinCookie(request.headers.get("cookie"), page.id, page.lock)) return pinResponse("ask");

  // Отметка об открытии не задерживает ответ: человеку страница нужна сейчас.
  // Превью мессенджера и наши собственные открытия из панели не считаются —
  // см. lib/proto/opened. Первое настоящее открытие прототипа из касания —
  // строка тому, кто касание ведёт.
  // Манифест, service worker и офлайн-страницу запрашивает телефон, а не
  // человек: в журнал показа они не идут (lib/proto/pages).
  const countable = !isQuietProtoPath(path);
  if (countable && !isPreviewFetch(request.headers.get("user-agent")) && !fromPanel(request.headers.get("cookie"), SESSION_COOKIE)) {
    // Журнал показа — доказательство, что клиент видел макет (условия,
    // раздел 5). Адрес — тем же способом, что у ограничителя запросов.
    const ip = ipFromHeaders(request.headers);
    const userAgent = request.headers.get("user-agent");
    const referer = request.headers.get("referer");
    after(async () => {
      try {
        await logView(page.id, { ip, userAgent, referer, path });
        const seen = await markOpened(page.id);
        if (seen?.first && seen.prospectId) await tellManager(seen.prospectId, openedText(seen.name));
      } catch (error) {
        console.error("прототип: открытие не записалось", error instanceof Error ? error.message : error);
      }
    });
  }

  return new Response(page.html, {
    headers: {
      "Content-Type": protoContentType(path),
      /*
       * noindex стоит и в самой странице, и здесь. Мета-тег не спасает, если
       * ссылку утащил агрегатор и отдаёт её содержимое у себя; заголовок
       * действует и на такой случай, и на поисковик, который до html не
       * дочитал.
       */
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      // Прототип пересобирается, а ссылка остаётся прежней: закешированная
      // старая версия означала бы, что клиент смотрит на вчерашнюю правку.
      "Cache-Control": "no-store, max-age=0",
      "Referrer-Policy": "no-referrer",
    },
  });
}

const PIN_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Cache-Control": "no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
};

function pinResponse(state: PinState): Response {
  return new Response(pinPage(state), { status: state === "ask" ? 200 : 401, headers: PIN_HEADERS });
}

/**
 * Ввод пароля с формы (POST на тот же адрес). Верный — кука на 30 дней и
 * переход на ту же страницу обычным GET; неверный — форма с ошибкой.
 * Попытки ограничены по адресу: четыре цифры перебираются быстро.
 */
export async function unlockProto(request: Request, token: string, path = ""): Promise<Response> {
  if (!looksLikeAccessToken(token)) return new Response(null, { status: 404 });
  const page = await protoPage(token, path);
  if (!page) return new Response(null, { status: 404 });
  const self = `/proto/${token}${path ? `/${path}` : ""}`;
  if (!page.lock) return new Response(null, { status: 303, headers: { Location: self } });

  const ip = ipFromHeaders(request.headers);
  if (!rateLimit(`proto-pin:${ip}`, PIN_LIMIT).ok) return pinResponse("limit");

  let pin = "";
  try {
    const form = await request.formData();
    pin = String(form.get("pin") ?? "").slice(0, 32);
  } catch {
    return pinResponse("wrong");
  }
  if (!pinMatches(page.id, page.lock, pin)) return pinResponse("wrong");

  return new Response(null, {
    status: 303,
    headers: { Location: self, "Set-Cookie": pinCookieHeader(page.id, page.lock, token), "Cache-Control": "no-store" },
  });
}
