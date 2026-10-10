import { WIDGET_SCRIPT } from "@/lib/ai-staff/widget-script";

export const runtime = "nodejs";

/**
 * Скрипт виджета: `<script src="https://devuz.studio/api/ai-staff/widget.js?k=КЛЮЧ" async></script>`.
 * Ключ скрипт берёт из своего же адреса. Отдаётся одинаковым всем, поэтому
 * кэшируется: на сайте клиента он грузится на каждой странице.
 */
export function GET() {
  return new Response(WIDGET_SCRIPT, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
