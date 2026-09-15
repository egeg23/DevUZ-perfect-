import { NextResponse } from "next/server";

import { razbors } from "@/content/razbor/items";
import { buildPayload, freshRazborUrls, sendPing } from "@/lib/indexnow";
import { RAZBOR_LOCALES } from "@/lib/razbor/routing";
import { siteUrl } from "@/lib/seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Пинг IndexNow после выкатки.
 *
 * Живёт внутри приложения, а не в скрипте выкатки, по одной причине: ключ
 * лежит в окружении контейнера, и тянуть его на хост ради одного curl
 * значило бы завести второе место, где он хранится. Скрипт выкатки зовёт
 * этот адрес тем же секретом, что и меню бота.
 *
 * Bing и Яндекс. Google протокол не поддерживает — туда страницы попадают
 * через sitemap.xml и обычный обход, и отдельного пинка не требуют.
 */
export async function POST(request: Request) {
  const expected = process.env.REMINDER_SWEEP_SECRET;
  const provided = request.headers.get("x-devuz-sweep");
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const key = (process.env.INDEXNOW_KEY || "").trim();
  // Не ошибка выкатки: без ключа пинговать нечем, и падать из-за этого
  // деплою незачем.
  if (!key) return NextResponse.json({ skipped: "no key" });

  let payload;
  try {
    const urls = freshRazborUrls(siteUrl, { locales: RAZBOR_LOCALES, items: razbors });
    payload = buildPayload({ key, siteUrl, urls });
  } catch (error) {
    const text = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: text }, { status: 400 });
  }

  const report = await sendPing(payload);
  // Ключ в ответе не повторяем: его читает лог выкатки.
  return NextResponse.json(
    { ok: report.ok, status: report.status, urls: report.urls, text: report.text },
    { status: report.ok ? 200 : 502 },
  );
}
