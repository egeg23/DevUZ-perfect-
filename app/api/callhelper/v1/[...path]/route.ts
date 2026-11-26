import { handleApi } from "@/lib/callhelper/api";
import { apiStore } from "@/lib/callhelper/api-store";
import { clientIp, rateLimit } from "@/lib/qualify/limiter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * DevUz CallHelper API v1 (lib/callhelper/api.ts): расширение браузера
 * оператора и чужие программы ходят сюда с ключом колл-центра. Куки не
 * нужны, поэтому запросы с любых адресов разрешены: доступ решает ключ.
 */
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Max-Age": "86400",
  "Cache-Control": "no-store",
};

const MAX_JSON = 200_000;
const MAX_AUDIO = 700_000;

async function run(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  // Перебор ключей с одного адреса: неверный ключ тоже стоит запроса в базу.
  const flood = rateLimit(`callhelper-api-ip:${clientIp(request)}`, { limit: 1200, windowMs: 60_000 });
  if (!flood.ok) return Response.json({ error: "rate" }, { status: 429, headers: CORS });

  const { path } = await params;
  const url = new URL(request.url);
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_AUDIO) return Response.json({ error: "too_big" }, { status: 413, headers: CORS });

  const reply = await handleApi(
    {
      method: request.method,
      path,
      query: url.searchParams,
      auth: request.headers.get("authorization"),
      async json() {
        const text = await request.text();
        if (text.length > MAX_JSON) throw new Error("too_big");
        return text ? JSON.parse(text) : {};
      },
      async bytes() {
        const buf = new Uint8Array(await request.arrayBuffer());
        return buf.byteLength > MAX_AUDIO ? new Uint8Array(MAX_AUDIO + 1) : buf;
      },
    },
    apiStore,
  );
  return Response.json(reply.body, { status: reply.status, headers: CORS });
}

export { run as GET, run as POST, run as PUT, run as DELETE };

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
