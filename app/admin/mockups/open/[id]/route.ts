import { currentStaff } from "@/lib/admin/guard";
import { codeCookieHeader } from "@/lib/proto/codes";
import { teamAccess } from "@/lib/proto/code-store";
import { protoById } from "@/lib/proto/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * «Открыть» в разделе «Макеты»: сотрудник открывает прототип сам.
 *
 * Сессия панели живёт только под /admin и до /proto не доходит, поэтому
 * свой доступ к макету выдаётся здесь: строка доступа команды на 12 часов
 * (lib/proto/codes, kind team) и кука на адрес прототипа. Пароль вводить
 * не нужно, даже если макет закрыт, а открытие по такой куке не идёт в
 * журнал показа: менеджер, проверивший ссылку, — не клиент.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await currentStaff();
  if (!staff) return new Response(null, { status: 303, headers: { Location: "/admin/login" } });

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response(null, { status: 404 });
  const proto = await protoById(id);
  if (!proto || proto.status === "draft") return new Response(null, { status: 404 });

  const location = `/proto/${proto.token}`;
  const access = await teamAccess(proto.id, staff.id);
  if (!access) return new Response(null, { status: 303, headers: { Location: location } });

  return new Response(null, {
    status: 303,
    headers: {
      Location: location,
      "Set-Cookie": codeCookieHeader({
        protoId: proto.id,
        token: proto.token,
        codeId: access.id,
        codeHash: access.codeHash,
        expiresAt: access.expiresAt,
      }),
      "Cache-Control": "no-store",
    },
  });
}
