import type { NextConfig } from "next";

const config: NextConfig = {
  // Standalone кладёт рядом с приложением только те зависимости, которые
  // реально нужны в рантайме. Образ выходит десятками мегабайт вместо
  // сотен, а на VPS это разница во времени каждого деплоя.
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  images: { formats: ["image/avif", "image/webp"] },
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
    ];
  },
};

export default config;
