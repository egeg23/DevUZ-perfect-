import { NextResponse, type NextRequest } from "next/server";

import { defaultLocale, isLocale, locales, matchLocale } from "@/lib/i18n";

const COOKIE = "NEXT_LOCALE";

/** Заголовок, которым локаль из пути доезжает до страницы 404. */
export const LOCALE_HEADER = "x-devuz-locale";

/**
 * Каждая страница живёт под префиксом локали — иначе не построить корректный
 * hreflang, а без него мультиязычный сайт в выдаче конкурирует сам с собой.
 *
 * Порядок определения языка: явный выбор пользователя → Accept-Language
 * браузера → русский.
 *
 * Куку здесь не пишем — ни на одной ветке. Раньше писали, и это давало
 * неприятный эффект: достаточно было один раз открыть ссылку с русским
 * префиксом — из поиска, из чужой пересылки, — и англоязычный посетитель
 * оказывался прижат к русскому навсегда. Заголовок Accept-Language после
 * этого не спрашивался уже никогда, и чат встречал человека приветствием на
 * чужом языке. Отличить «нажал переключатель» от «пришёл по ссылке» на
 * стороне сервера нечем: и то и другое — обычный GET на /ru/....
 *
 * Поэтому запись куки перенесена туда, где выбор действительно происходит, —
 * в сам переключатель языка. Нет куки — значит человек ничего не выбирал, и
 * язык определяется по браузеру, каждый раз заново.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (hasLocale) {
    // Локаль едет дальше заголовком запроса. Нужна она ровно одному месту —
    // странице 404: она рендерится вне контекста параметров маршрута, и
    // узнать из неё, на каком языке человек ходил по сайту, больше неоткуда.
    // Без этого китаец, попавший на битую ссылку, получал русскую страницу.
    const headers = new Headers(request.headers);
    headers.set(LOCALE_HEADER, pathname.split("/")[1]);
    return NextResponse.next({ request: { headers } });
  }

  const saved = request.cookies.get(COOKIE)?.value;
  const locale = isLocale(saved)
    ? saved
    : matchLocale(request.headers.get("accept-language"));

  const url = request.nextUrl.clone();
  url.pathname = `/${locale ?? defaultLocale}${pathname === "/" ? "" : pathname}`;

  // 307, а не 308: язык зависит от пользователя, и постоянный редирект
  // закэшировался бы у поисковика вместе с чужой локалью.
  return NextResponse.redirect(url, 307);
}

export const config = {
  // Пропускаем статику, API и файлы, которые должны отдаваться из корня:
  // robots.txt, sitemap.xml и ключ IndexNow не имеют языковой версии.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|txt|xml|webmanifest)).*)",
  ],
};
