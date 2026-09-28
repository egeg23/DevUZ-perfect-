import { NextResponse, type NextRequest } from "next/server";

import { company } from "@/content/company";
import { REF_COOKIE, REF_COOKIE_OPTIONS, formatRef, parseRef } from "@/lib/partners/ref-cookie";
import { isBotAgent, targetUrl, visitorSeed } from "@/lib/partners/rules";
import { linkBySlug, recordClick } from "@/lib/partners/store";
import { clientIp } from "@/lib/qualify/limiter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Короткая ссылка партнёра: devuz.studio/r/<slug>.
 *
 * Три дела и редирект. Записать переход (роботов превью — нет, одного
 * человека в день — один раз). Запомнить партнёра в куке на 30 дней —
 * первого: пришёл по двум ссылкам, засчитывается та, что привела первой, как
 * и у `?ref=` в localStorage. И отправить туда, куда партнёр вёл: страница
 * сайта или бот.
 *
 * Адрес страницы — чистый, без `?ref=`: код едет куками, и человек видит
 * обычную ссылку на сайт. Язык добавит middleware по браузеру.
 *
 * Не нашлась ссылка или партнёр заблокирован — на главную, без куки: битая
 * ссылка из старого поста не должна упираться в 404.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = await linkBySlug(slug);
  const home = new URL("/", request.url);

  if (!found || found.partner.status !== "active") {
    return NextResponse.redirect(home, 302);
  }
  const { partner, link } = found;

  const ua = request.headers.get("user-agent") ?? "";
  if (!isBotAgent(ua)) {
    let referer: string | null = null;
    try {
      referer = new URL(request.headers.get("referer") ?? "").host || null;
    } catch {
      referer = null;
    }
    const day = new Date().toISOString().slice(0, 10);
    await recordClick(partner, link, "short", visitorSeed(clientIp(request), `${ua}|${link.id}`, day), referer);
  }

  const destination = targetUrl(link.target, link.code, company.telegram);
  const response = NextResponse.redirect(
    destination.startsWith("http") ? destination : new URL(destination, request.url),
    302,
  );

  // Первый код побеждает: живая кука (моложе 30 дней) уже есть — не трогаем.
  if (!parseRef(request.cookies.get(REF_COOKIE)?.value)) {
    response.cookies.set(REF_COOKIE, formatRef(link.code), {
      ...REF_COOKIE_OPTIONS,
      secure: process.env.NODE_ENV === "production",
    });
  }
  // Короткая ссылка может смениться по направлению — кешировать редирект нельзя.
  response.headers.set("Cache-Control", "no-store");
  return response;
}
