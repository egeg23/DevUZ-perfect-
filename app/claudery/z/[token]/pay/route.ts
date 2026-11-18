import { NextResponse } from "next/server";

import { ORDER_PATH, orderPayUrl } from "@/lib/claudery/store";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

/** Кнопка «Оплатить» на странице заявки: счёт Platega и переход на его страницу. */
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const form = await req.formData().catch(() => null);
  const index = Number(form?.get("p") ?? 0);
  const url = await orderPayUrl(token, Number.isInteger(index) ? index : 0);
  // Счёт не выставился или заявка уже оплачена — обратно на страницу заявки,
  // с пометкой: иначе нажатие выглядит так, будто ничего не произошло.
  return NextResponse.redirect(url ?? `${siteUrl}${ORDER_PATH}/${encodeURIComponent(token)}?pay=failed`, 303);
}
