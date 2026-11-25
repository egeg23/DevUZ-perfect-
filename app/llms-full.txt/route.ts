import { llmsFull } from "@/lib/agent/markdown";

export const dynamic = "force-static";

/** Весь сайт по-английски одним файлом; другие языки — `/ru/full.md` и т. д. */
export function GET() {
  return new Response(llmsFull(), {
    headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
