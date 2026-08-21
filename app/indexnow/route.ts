export const dynamic = "force-static";

/**
 * Ключ IndexNow.
 *
 * IndexNow — единый протокол уведомления поисковиков об изменениях. Одним
 * запросом уведомляются Bing и Яндекс, а Яндекс в Узбекистане даёт заметную
 * часть трафика, и ждать планового обхода там дольше, чем у Google.
 *
 * Протокол требует, чтобы ключ был доступен по адресу вида
 * https://домен/<ключ>.txt и содержал сам ключ. Отдаём его отсюда через
 * rewrite в next.config.ts, чтобы не держать файл в репозитории и не путать
 * ключи между окружениями.
 */
export async function GET() {
  const key = process.env.INDEXNOW_KEY;
  if (!key) return new Response("not configured", { status: 404 });

  return new Response(key, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
