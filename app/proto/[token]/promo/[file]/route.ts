import { servePromo } from "@/lib/proto/promo-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Промо-ролик макета: плейлист и ключ к зашифрованным кускам (lib/proto/promo). */
export async function GET(request: Request, { params }: { params: Promise<{ token: string; file: string }> }) {
  const { token, file } = await params;
  return servePromo(request, token, file);
}
