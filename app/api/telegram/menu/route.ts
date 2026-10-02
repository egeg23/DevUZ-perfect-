import { NextResponse } from "next/server";

import { syncBotMenu } from "@/lib/qualify/menu";
import { syncBotProfile } from "@/lib/qualify/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Обновить меню команд и профиль бота (имя, описания, аватар). Дёргается
 * скриптом выкатки с самого сервера — тем же секретом, что и свип
 * напоминаний: одна переменная, один способ позвать сервер изнутри.
 */
export async function POST(request: Request) {
  const expected = process.env.REMINDER_SWEEP_SECRET;
  const provided = request.headers.get("x-devuz-sweep");
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const menu = await syncBotMenu();
  const profile = await syncBotProfile();
  return NextResponse.json({ ...menu, ok: menu.ok && profile.ok, profile });
}
