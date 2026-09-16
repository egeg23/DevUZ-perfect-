import { currentStaff } from "@/lib/admin/guard";
import { signatureVisible } from "@/lib/admin/contracts";
import { contractById } from "@/lib/admin/contract-store";
import { signatureBytes } from "@/lib/admin/signature";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Отдаёт подпись владельца — и только для подтверждённого им договора.
 *
 * Это и есть то место, где выполняется обещание «подпись появится только
 * после подтверждения мной». Спрятать картинку стилями недостаточно:
 * скрытое изображение достают через «сохранить как» и просмотр исходного
 * кода. Здесь её просто нет в ответе.
 *
 * Порядок проверок: сначала сессия, потом состояние договора. Обе отвечают
 * 404, а не 403: 403 сообщает, что файл существует, и это уже подсказка.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const staff = await currentStaff();
  if (!staff) return new Response(null, { status: 404 });

  const { id } = await params;
  const contract = await contractById(id);
  if (!contract || !signatureVisible(contract)) return new Response(null, { status: 404 });

  const bytes = await signatureBytes();
  if (!bytes) return new Response(null, { status: 404 });

  return new Response(bytes, {
    headers: {
      "Content-Type": "image/png",
      // Кэшировать подпись нельзя: договор могут отменить, а картинка
      // осталась бы в браузере и в промежуточных кэшах.
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
