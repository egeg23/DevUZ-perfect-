import { agentPage } from "@/lib/agent/markdown";
import { agentHtmlHref, agentPath } from "@/lib/agent/paths";
import { absoluteUrl } from "@/lib/seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Текстовый двойник страницы для ИИ-агентов. Снаружи адрес — страница с
 * `.md` на конце или та же страница с `Accept: text/markdown`; сюда запрос
 * переписывает middleware (lib/agent/paths.ts). Прямой заход на /agent-md/…
 * middleware уводит в 404, как любой адрес не из разделов сайта.
 *
 * `Link: rel="canonical"` ведёт на страницу для людей: поисковик не должен
 * считать двойник отдельной страницей.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const found = agentPath(`/${path.join("/")}.md`);
  const doc = found ? agentPage(found.locale, found.segments) : null;
  if (!found || !doc) {
    return new Response("Not found\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
  const html = absoluteUrl(agentHtmlHref(found.locale, found.segments.filter((s) => s !== "full")).slice(1));
  return new Response(doc.body + "\n", {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Language": found.locale,
      "Cache-Control": "public, max-age=3600",
      Vary: "Accept",
      Link: `<${html}>; rel="canonical"`,
    },
  });
}
