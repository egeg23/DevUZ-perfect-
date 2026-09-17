import { signatureVisible } from "@/lib/admin/contracts";
import { contractByToken } from "@/lib/admin/invoice-store";
import { signatureBytes } from "@/lib/admin/signature";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Подпись владельца для заказчика — по ссылке на договор.
 *
 * Тот же маршрут, что в панели, но авторизует не сессия, а токен: у
 * заказчика логина нет и не будет. Проверки ровно те же и в том же порядке:
 * сначала «кто спрашивает», потом «есть ли что показывать».
 *
 * Подпись существует только у подтверждённого договора. Спрятать её стилями
 * недостаточно — скрытое изображение достают через «сохранить как»; здесь
 * её просто нет в ответе.
 *
 * 404 вместо 403 на обеих проверках: 403 сообщает, что файл существует, и
 * это уже подсказка перебирающему.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const contract = await contractByToken(token);
  if (!contract || !signatureVisible(contract)) return new Response(null, { status: 404 });

  const bytes = await signatureBytes();
  if (!bytes) return new Response(null, { status: 404 });

  return new Response(bytes, {
    headers: {
      "Content-Type": "image/png",
      // Кэшировать нельзя: договор могут отменить, а картинка осталась бы в
      // браузере и в промежуточных кэшах.
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
