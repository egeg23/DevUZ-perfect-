import { manifestOf } from "@/lib/admin/pwa";

export const dynamic = "force-static";

/**
 * Манифест приложения панели — только здесь, под /admin (lib/admin/pwa.ts).
 * Ссылка на него стоит только в каркасе панели: публичный сайт
 * устанавливаемым не становится.
 */
export function GET() {
  return new Response(JSON.stringify(manifestOf()), {
    headers: {
      "content-type": "application/manifest+json; charset=utf-8",
      "cache-control": "public, max-age=3600",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
