import { NextResponse, type NextRequest } from "next/server";

import { bookingText } from "@/lib/clients/maximova/bot";
import { SESSION_COOKIE } from "@/lib/clients/maximova/session";
import { markNotified, saveBooking, validateBooking, viewerBySession } from "@/lib/clients/maximova/store";
import { botConfig, sendMessage } from "@/lib/clients/maximova/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Онлайн-запись на пробное занятие.
 *
 * Заявка сохраняется в базу на нашем сервере и сразу уходит Дарье в её бот.
 * Не дошла до Telegram — заявка всё равно сохранена и видна в кабинете;
 * человеку отвечаем честно, что Дарья увидит её там, и даём прямую ссылку
 * написать ей самому.
 */

// Простой предохранитель от засыпания формы: пять заявок за десять минут с
// одного адреса. Память процесса — после выкатки счёт начинается заново, и
// этого достаточно: цель не защита от атаки, а от случайного бота.
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 5;
const hits = new Map<string, number[]>();

function tooMany(ip: string, now: number): boolean {
  const recent = (hits.get(ip) ?? []).filter((t) => t > now - WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5_000) hits.clear();
  return recent.length > LIMIT;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ ok: false, errors: { form: "Не удалось прочитать форму" } }, { status: 400 });

  // Ловушка для ботов: поле спрятано от людей, заполняют его только скрипты.
  if (typeof body.website === "string" && body.website.trim()) return NextResponse.json({ ok: true, notified: true });

  const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "?";
  if (tooMany(ip, Date.now())) {
    return NextResponse.json(
      { ok: false, errors: { form: "Слишком много заявок подряд. Напишите Дарье в Telegram напрямую." } },
      { status: 429 },
    );
  }

  const checked = validateBooking(body);
  if (!checked.ok) return NextResponse.json({ ok: false, errors: checked.errors }, { status: 422 });

  let viewerId: number | null = null;
  try {
    viewerId = viewerBySession(request.cookies.get(SESSION_COOKIE)?.value)?.telegramId ?? null;
  } catch {
    viewerId = null;
  }

  let booking;
  try {
    booking = saveBooking(checked.value, viewerId);
  } catch (error) {
    console.error("maximova: заявка не сохранилась", error);
    return NextResponse.json(
      { ok: false, errors: { form: "Не получилось сохранить заявку. Напишите Дарье в Telegram — ссылка ниже." } },
      { status: 500 },
    );
  }

  const config = botConfig();
  let notified = false;
  if (config && config.admins.length) {
    const results = await Promise.all(config.admins.map((id) => sendMessage(config, id, bookingText(booking))));
    notified = results.some(Boolean);
    if (notified) markNotified(booking.id);
  }

  return NextResponse.json({ ok: true, id: booking.id, notified });
}
