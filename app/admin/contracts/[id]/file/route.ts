import { currentStaff } from "@/lib/admin/guard";
import { contractById, contractFile } from "@/lib/admin/contract-store";
import { signedFileName } from "@/lib/admin/contracts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Отдаёт приложение к договору: смету или скан с подписями.
 *
 * Путь к файлу берётся из записи договора, а не из адреса. Пустить путь
 * параметром значило бы отдать всё приватное хранилище любому сотруднику:
 * подставил `../signature/owner.png` — и забрал подпись владельца.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const staff = await currentStaff();
  if (!staff) return new Response(null, { status: 404 });

  const { id } = await params;
  const contract = await contractById(id);
  if (!contract) return new Response(null, { status: 404 });

  const kind = new URL(request.url).searchParams.get("kind");
  const path = kind === "signed" ? contract.signed_path : contract.estimate_path;
  if (!path) return new Response(null, { status: 404 });

  const bytes = await contractFile(path);
  if (!bytes) return new Response(null, { status: 404 });

  const name = kind === "signed"
    ? signedFileName(contract.number, path)
    : (contract.estimate_name ?? "smeta");

  return new Response(bytes, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(name)}"`,
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
