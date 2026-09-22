import { NextResponse } from "next/server";

import { announceRazbors } from "@/lib/razbor/announce";

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
 *
 * Сам пинг собирается в `lib/razbor/announce.ts`: тот же набор адресов
 * уходит из кнопки «Опубликовать», и выкатка здесь — не единственный повод.
 */
export async function POST(request: Request) {
  const expected = process.env.REMINDER_SWEEP_SECRET;
  const provided = request.headers.get("x-devuz-sweep");
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const done = await announceRazbors();
  if (done.state === "no-key") return NextResponse.json({ skipped: "no key" });
  if (done.state === "bad-input") return NextResponse.json({ error: done.why }, { status: 400 });

  const { report } = done;
  // Ключ в ответе не повторяем: его читает лог выкатки.
  return NextResponse.json(
    { ok: report.ok, status: report.status, urls: report.urls, text: report.text },
    { status: report.ok ? 200 : 502 },
  );
}
