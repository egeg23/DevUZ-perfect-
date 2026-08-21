import { NextResponse, type NextRequest } from "next/server";

import { defaultLocale, isLocale, locales, matchLocale } from "@/lib/i18n";

const COOKIE = "NEXT_LOCALE";
const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Каждая страница живёт под префиксом локали — иначе не построить корректный
 * hreflang, а без него мультиязычный сайт в выдаче конкурирует сам с собой.
 *
 * Порядок определения языка: сохранённый выбор пользователя → Accept-Language
 * браузера → русский. Явный выбор всегда сильнее заголовка: если человек
 * переключился на узбекский, мы не должны перекидывать его обратно только
 * потому, что в системе стоит русский.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (hasLocale) {
    // Запоминаем локаль, по которой человек ходит прямо сейчас, чтобы
    // следующий заход на «/» открылся на том же языке.
    const current = pathname.split("/")[1];
    const response = NextResponse.next();
    if (isLocale(current) && request.cookies.get(COOKIE)?.value !== current) {
      response.cookies.set(COOKIE, current, { maxAge: ONE_YEAR, path: "/", sameSite: "lax" });
    }
    return response;
  }

  const saved = request.cookies.get(COOKIE)?.value;
  const locale = isLocale(saved)
    ? saved
    : matchLocale(request.headers.get("accept-language"));

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;

  // 307, а не 308: язык зависит от пользователя, и постоянный редирект
  // закэшировался бы у поисковика вместе с чужой локалью.
  const response = NextResponse.redirect(url, 307);
  response.cookies.set(COOKIE, locale ?? defaultLocale, {
    maxAge: ONE_YEAR,
    path: "/",
    sameSite: "lax",
  });
  return response;
}

export const config = {
  // Пропускаем статику, API и файлы, которые должны отдаваться из корня:
  // robots.txt, sitemap.xml и ключ IndexNow не имеют языковой версии.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|txt|xml|webmanifest)).*)",
  ],
};
