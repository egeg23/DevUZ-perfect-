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
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default config;
