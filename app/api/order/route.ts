import { clientIp, rateLimit } from "@/lib/qualify/limiter";
import { createOrder } from "@/lib/store/orders";
import { isLocale, type Locale } from "@/lib/i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Заявка на покупку готового продукта.
 *
 * Никакой оплаты здесь не происходит и происходить не будет: покупатель —
 * юрлицо, платит по счёту, и между «нажал купить» и «деньги пришли» всегда
 * стоит человек. Поэтому эндпоинт ничего не списывает и не хранит
 * платёжных данных — он передаёт менеджеру, кому выставлять счёт.
 */
export async function POST(request: Request) {
  // Реже, чем у лида: заявка на покупку — редкое событие, а вот рассылать
  // менеджеру мусор через неё удобно.
  const limit = rateLimit(`order:${clientIp(request)}`, {
    limit: 3,
    windowMs: 15 * 60 * 1000,
  });
  if (!limit.ok) {
    return Response.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  // Ловушка для ботов: поле скрыто в разметке, человек его не заполнит.
  if (typeof body.website === "string" && body.website.trim()) {
    return Response.json({ ok: true, requestNo: null });
  }

  const text = (value: unknown, max = 300) =>
    typeof value === "string" ? value.trim().slice(0, max) : "";

  const locale: Locale = isLocale(body.locale as string) ? (body.locale as Locale) : "ru";

  const result = await createOrder(
    {
      productSlug: text(body.product, 80),
      locale,
      company: text(body.company, 200),
      taxId: text(body.taxId, 60),
      country: text(body.country, 80),
      contactName: text(body.contactName, 120),
      contact: text(body.contact, 200),
      payment: text(body.payment, 20),
      comment: text(body.comment, 2000),
      // === true, а не truthy: строка "false" из чужого клиента иначе
      // прошла бы за согласие.
      acceptedOffer: body.acceptedOffer === true,
    },
    clientIp(request),
  );

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  return Response.json({ ok: true, requestNo: result.requestNo });
}
