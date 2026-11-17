import { NextResponse } from "next/server";

import { ORDER_PATH, orderPayUrl } from "@/lib/claudery/store";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

/** Кнопка «Оплатить» на странице заявки: счёт Platega и переход на его страницу. */
export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const url = await orderPayUrl(token);
  // Счёт не выставился или заявка уже оплачена — обратно на страницу заявки.
  return NextResponse.redirect(url ?? `${siteUrl}${ORDER_PATH}/${encodeURIComponent(token)}`, 303);
}
