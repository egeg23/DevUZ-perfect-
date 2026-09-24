import { timingSafeEqual } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { record } from "@/lib/admin/audit";
import { currentStaff } from "@/lib/admin/guard";
import {
  GA_SCOPE,
  GOOGLE_SECRETS,
  STATE_COOKIE,
  STATE_PATH,
  exchangeCode,
  findProperty,
  googleClient,
} from "@/lib/analytics/google-oauth";
import { ipFromHeaders } from "@/lib/qualify/limiter";
import { saveAppSecret } from "@/lib/secrets";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

/**
 * Куда Google возвращает владельца после входа.
 *
 * Здесь код из адреса меняется на постоянный доступ к статистике, доступ
 * кладётся в хранилище секретов, и по счётчику сайта ищется номер ресурса
 * GA4. Что бы ни случилось — владелец возвращается в раздел «Трафик» с
 * пометкой `ga=…`, и карточка объясняет, что произошло и что делать.
 *
 * Адрес — под /admin: кука сессии панели живёт только там, и без неё не
 * проверить, что вернулся именно владелец.
 */
export async function GET(request: NextRequest) {
  const back = (ga: string, extra: Record<string, string> = {}) => {
    const response = NextResponse.redirect(
      new URL(`/admin/traffic?${new URLSearchParams({ ga, ...extra })}`, siteUrl),
      303,
    );
    response.cookies.set(STATE_COOKIE, "", { path: STATE_PATH, maxAge: 0 });
    return response;
  };

  const staff = await currentStaff();
  if (!staff || staff.role !== "admin") {
    return NextResponse.redirect(new URL("/admin/login", siteUrl), 303);
  }

  const params = request.nextUrl.searchParams;
  if (params.get("error")) return back("denied");

  const state = params.get("state") ?? "";
  const expected = request.cookies.get(STATE_COOKIE)?.value ?? "";
  if (!state || !expected || !sameText(state, expected)) return back("state");

  const code = params.get("code");
  const client = await googleClient();
  if (!code || !client) return back("client");

  const tokens = await exchangeCode(client, code);
  if (!tokens.ok) return back("exchange", { gd: short(tokens.detail) });
  // На экране Google у каждого разрешения своя галочка — её могли снять.
  if (!tokens.scopes.includes(GA_SCOPE)) return back("scope");
  if (!tokens.refresh) return back("no_refresh");

  const saved =
    (await saveAppSecret(GOOGLE_SECRETS.refresh, tokens.refresh)) &&
    (await saveAppSecret(GOOGLE_SECRETS.email, tokens.email ?? ""));
  if (!saved) return back("save_failed");

  const found = await findProperty(tokens.access);
  if (found.ok) await saveAppSecret(GOOGLE_SECRETS.property, found.property);

  await record("google.connected", {
    actorStaffId: staff.id,
    meta: { email: tokens.email, property: found.ok ? found.property : null },
    ip: ipFromHeaders(request.headers),
  });

  if (found.ok) return back("connected", { gp: found.property });
  if (found.reason === "not_found") return back("no_property", { gd: String(found.checked) });
  return back("admin_api", { gd: short(found.detail) });
}

function sameText(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Ответ Google бывает на полэкрана — в адрес идёт начало, этого хватает, чтобы понять причину. */
function short(text: string): string {
  return text.length > 400 ? `${text.slice(0, 400)}…` : text;
}
