import { serveProto, unlockProto } from "@/lib/proto/serve";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Прототип по ссылке — главная страница. Всё устройство — в lib/proto/serve. */
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return serveProto(request, token);
}

/** Ввод пароля (lib/proto/lock). */
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return unlockProto(request, token);
}
