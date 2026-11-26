import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";

import { company } from "@/content/company";
import { SIGNUP_DAY_CAP, SIGNUP_IP_LIMIT, SIGNUP_START, parseSignup } from "@/lib/callhelper/signup";
import { savePending, signupIpHash, signupOpen } from "@/lib/callhelper/signup-store";
import { clientIp, rateLimit } from "@/lib/qualify/limiter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Метка браузера для правила «один пробный на устройство в 30 дней» (lib/callhelper/trial.ts). */
const DEVICE_COOKIE = "ch_dev";

/**
 * Регистрация колл-центра в DevUz CallHelper со страницы продукта
 * (lib/callhelper/signup.ts). Здесь только заявка: номер подтверждается в
 * боте студии, там же выдаётся ключ. Поле `website` — ловушка для ботов.
 */
export async function GET() {
  return Response.json({ open: await signupOpen() });
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  const limit = rateLimit(`callhelper-signup:${ip}`, { limit: SIGNUP_IP_LIMIT, windowMs: 10 * 60 * 1000 });
  if (!limit.ok) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  if (body && typeof body === "object" && String((body as { website?: unknown }).website ?? "").trim()) return Response.json({ ok: true });
  if (!(await signupOpen())) return Response.json({ error: "closed" }, { status: 403 });

  const parsed = parseSignup(body);
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });
  const day = rateLimit("callhelper-signup:all", { limit: SIGNUP_DAY_CAP, windowMs: 24 * 3600 * 1000 });
  if (!day.ok) return Response.json({ error: "rate_limited" }, { status: 429 });

  const jar = await cookies();
  let device = jar.get(DEVICE_COOKIE)?.value ?? "";
  if (!/^[a-f0-9]{32}$/.test(device)) {
    device = randomBytes(16).toString("hex");
    jar.set(DEVICE_COOKIE, device, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 365 * 86_400 });
  }
  const token = await savePending(parsed.form, signupIpHash(ip), device);
  if (!token) return Response.json({ error: "save_failed" }, { status: 502 });
  return Response.json({ ok: true, bot: `${company.telegramUrl}?start=${SIGNUP_START}${token}` });
}
