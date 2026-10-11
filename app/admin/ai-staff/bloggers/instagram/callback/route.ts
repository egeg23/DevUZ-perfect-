import { NextResponse, type NextRequest } from "next/server";

import { currentStaff } from "@/lib/admin/guard";
import { exchangeCode, igConfig, readState } from "@/lib/ai-staff/instagram";
import { STUDIO_REDIRECT_PATH, STUDIO_STATE, saveStudioIg } from "@/lib/bloggers/direct";
import { appSecret } from "@/lib/secrets";
import { siteUrl } from "@/lib/seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Возврат из Instagram после «Подключить Instagram студии» во вкладке
 * «Блогеры». Адрес — под /admin: кука панели живёт только здесь, и без неё
 * не проверить, что вернулся владелец или руководитель. State подписан
 * ключом AI_STAFF_KEY и живёт 15 минут (lib/ai-staff/instagram.ts).
 */
export async function GET(request: NextRequest) {
  const back = (n: string) => NextResponse.redirect(new URL(`/admin/ai-staff/bloggers?n=${n}`, siteUrl), 303);
  const staff = await currentStaff();
  if (!staff || (staff.role !== "admin" && staff.role !== "head")) return NextResponse.redirect(new URL("/admin/login", siteUrl), 303);
  const [cfg, key] = await Promise.all([igConfig(), appSecret("AI_STAFF_KEY")]);
  if (!cfg || !key) return back("ig_off");
  const q = request.nextUrl.searchParams;
  const code = q.get("code");
  if (!code || readState(q.get("state") ?? "", key) !== STUDIO_STATE) return back("ig_fail");
  const account = await exchangeCode(cfg, code, fetch, STUDIO_REDIRECT_PATH);
  if (!account || !(await saveStudioIg(account, key))) return back("ig_fail");
  return back("ig_ok");
}
