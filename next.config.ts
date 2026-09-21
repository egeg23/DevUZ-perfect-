import type { NextConfig } from "next";

/**
 * Откуда приходят снимки разборов.
 *
 * Они лежат в публичном бакете Supabase, а не в репозитории: их снимает
 * отдельный проход с браузером, и класть по четыре картинки на разбор в git
 * значило бы растить образ на каждую ночную смену. next/image чужие хосты
 * без спроса не оптимизирует — иначе любой желающий гонял бы через наш
 * сервер свои картинки, — поэтому хост перечислен явно.
 */
function shotHost(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return [];
  try {
    const { hostname } = new URL(url);
    return [{ protocol: "https", hostname, pathname: "/storage/v1/object/public/**" }];
  } catch {
    return [];
  }
}

const config: NextConfig = {
  // Standalone кладёт рядом с приложением только те зависимости, которые
  // реально нужны в рантайме. Образ выходит десятками мегабайт вместо
  // сотен, а на VPS это разница во времени каждого деплоя.
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  images: { formats: ["image/avif", "image/webp"], remotePatterns: shotHost() },

  experimental: {
    serverActions: {
      // Скан договора с подписями — это фотографии страниц, до двадцати
      // мегабайт. По умолчанию server action отвергает тело больше мегабайта,
      // то есть лимиты в коде (2 МБ на подпись, 20 на скан) были недостижимы:
      // отказ приходил раньше и не от них. Запас сверх двадцати — на границы
      // и заголовки multipart, они добавляют к телу свои килобайты.
      bodySizeLimit: "22mb",
    },
  },
  async rewrites() {
    const key = process.env.INDEXNOW_KEY;
    // IndexNow требует, чтобы ключ отдавался по адресу /<ключ>.txt в корне.
    return key ? [{ source: `/${key}.txt`, destination: "/indexnow" }] : [];
  },
  async headers() {
    // Отдельным списком, чтобы не повторять его для /admin и /admin/:path*.
    const admin = [
      // Закрывает индексацию, ничего не рассказывая о панели — в отличие от
      // строки в robots.txt, которая публична и работает указателем.
      // Мета-тег noindex в layout делает то же самое, но не действует на
      // ответы, которые не HTML: server actions, редиректы, 404.
      { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
      // Панель — это чужие контакты и переписка. no-store запрещает класть
      // их и в кэш браузера: иначе страница лида остаётся на диске рабочего
      // ноутбука и достаётся кнопкой «назад» уже после выхода из панели.
      { key: "Cache-Control", value: "no-store, max-age=0" },
    ];

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
      // Два правила, а не одно: `/admin/:path*` со звёздочкой в Next
      // совпадает и с самим `/admin`, но полагаться на это — значит
      // проверять догадку о матчере каждый раз при обновлении Next.
      { source: "/admin", headers: admin },
      { source: "/admin/:path*", headers: admin },
      // Страница заказа: чужие реквизиты и счёт по неугадываемой ссылке.
      // Мета-тег noindex на ней уже стоит, но он не действует на ответы,
      // которые не HTML, и не защищает от кэша браузера на общем ноутбуке.
      //
      // В robots.txt этого пути намеренно нет: Disallow запретил бы краулеру
      // зайти на страницу — а значит и прочитать noindex. Из трёх мер здесь
      // работают ровно эти две.
      {
        source: "/:locale/order/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
    ];
  },
};

export default config;
