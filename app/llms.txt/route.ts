import { llmsIndex } from "@/lib/agent/markdown";

export const dynamic = "force-static";

/**
 * Указатель сайта для ИИ-агентов (llmstxt.org): что за студия, услуги с
 * ценами и ссылки на текстовые версии страниц (lib/agent/markdown.ts).
 * Собирается на сборке: в нём только тексты из репозитория, базы нет.
 */
export function GET() {
  return new Response(llmsIndex(), {
    headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
