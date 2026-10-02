import { after } from "next/server";

import { tellManager } from "@/lib/admin/outreach-talk-store";
import { SESSION_COOKIE } from "@/lib/admin/return-to";
import { looksLikeAccessToken } from "@/lib/store/access";
import { fromPanel, isPreviewFetch, openedText } from "@/lib/proto/opened";
import { markOpened, protoPage } from "@/lib/proto/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!looksLikeAccessToken(token)) return new Response(null, { status: 404 });

  const page = await protoPage(token);
  if (!page) return new Response(null, { status: 404 });

  // Отметка об открытии не задерживает ответ: человеку страница нужна сейчас.
  // Превью мессенджера и наши собственные открытия из панели не считаются —
  // см. lib/proto/opened. Первое настоящее открытие прототипа из касания —
  // строка тому, кто касание ведёт.
  if (!isPreviewFetch(request.headers.get("user-agent")) && !fromPanel(request.headers.get("cookie"), SESSION_COOKIE)) {
    after(async () => {
      try {
        const seen = await markOpened(page.id);
        if (seen?.first && seen.prospectId) await tellManager(seen.prospectId, openedText(seen.name));
      } catch (error) {
        console.error("прототип: открытие не записалось", error instanceof Error ? error.message : error);
      }
    });
  }

  return new Response(page.html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
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
