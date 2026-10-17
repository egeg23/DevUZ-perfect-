import { PWA_SCOPE, WORKER_SOURCE } from "@/lib/admin/pwa";

export const dynamic = "force-static";

/**
 * Сервис-воркер приложения панели: пуш и нажатие на него (lib/admin/pwa.ts).
 * Не кэшируется — новая версия доходит до телефона со следующим открытием.
 * Service-Worker-Allowed расширяет область до «/admin», чтобы «Лиды»
 * (/admin) открывались внутри приложения.
 */
export function GET() {
  return new Response(WORKER_SOURCE, {
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "no-cache, no-store, must-revalidate",
      "service-worker-allowed": PWA_SCOPE,
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
