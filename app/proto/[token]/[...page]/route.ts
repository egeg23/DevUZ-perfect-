import { protoPagePath } from "@/lib/proto/pages";
import { serveProto } from "@/lib/proto/serve";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Страница внутри прототипа: `/proto/<токен>/kurs/python`. Адрес, которого
 * быть не может, — 404 сразу, без похода в базу.
 */
export async function GET(request: Request, { params }: { params: Promise<{ token: string; page: string[] }> }) {
  const { token, page } = await params;
  const path = protoPagePath(page);
  if (!path) return new Response(null, { status: 404 });
  return serveProto(request, token, path);
}
