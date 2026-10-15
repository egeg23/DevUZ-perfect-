"""Код, который «пишут» на мониторах студии.

Обычный TypeScript и Python, написан для ролика: без секретов, без чужих
логотипов и без настоящих адресов. Каждому экрану — свой файл.
"""

SNIPPETS = [
    {
        "name": "app/api/leads/route.ts",
        "lang": "ts",
        "code": '''import { NextResponse } from "next/server";
import { z } from "zod";

const Lead = z.object({
  name: z.string().min(2),
  phone: z.string().regex(/^\\+?\\d{9,15}$/),
  niche: z.string().optional(),
  message: z.string().max(2000).default(""),
});

type Lead = z.infer<typeof Lead>;

// Заявка с сайта: проверяем, сохраняем, зовём менеджера.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = Lead.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const lead: Lead = parsed.data;
  const saved = await saveLead(lead);
  await notifyTeam(`New lead: ${lead.name}`, saved.id);

  return NextResponse.json({ ok: true, id: saved.id });
}

async function saveLead(lead: Lead) {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await db.insert("leads", { id, ...lead, createdAt });
  return { id, createdAt };
}

async function notifyTeam(text: string, leadId: string) {
  const managers = await db.select("staff", { active: true });
  for (const manager of managers) {
    await queue.push({ to: manager.id, text, leadId });
  }
}
''',
    },
    {
        "name": "components/hero.tsx",
        "lang": "ts",
        "code": '''"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type HeroProps = {
  title: string;
  subtitle: string;
  cta: string;
};

export function Hero({ title, subtitle, cta }: HeroProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 120);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative overflow-hidden py-24">
      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={visible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-5xl font-semibold tracking-tight"
      >
        {title}
      </motion.h1>
      <p className="mt-6 max-w-xl text-lg text-slate-400">
        {subtitle}
      </p>
      <a href="#contact" className="btn-primary mt-10">
        {cta}
      </a>
    </section>
  );
}
''',
    },
    {
        "name": "scripts/report.py",
        "lang": "py",
        "code": '''from dataclasses import dataclass
from datetime import date, timedelta
from statistics import mean


@dataclass
class Day:
    day: date
    visits: int
    leads: int

    @property
    def rate(self) -> float:
        return self.leads / self.visits if self.visits else 0.0


def week(days: list[Day], end: date) -> list[Day]:
    start = end - timedelta(days=7)
    return [d for d in days if start < d.day <= end]


def summary(days: list[Day]) -> dict:
    if not days:
        return {"visits": 0, "leads": 0, "rate": 0.0}
    return {
        "visits": sum(d.visits for d in days),
        "leads": sum(d.leads for d in days),
        "rate": round(mean(d.rate for d in days) * 100, 1),
    }


def trend(now: dict, before: dict) -> str:
    if before["leads"] == 0:
        return "new"
    change = (now["leads"] - before["leads"]) / before["leads"]
    return f"{change:+.0%}"


if __name__ == "__main__":
    today = date.today()
    history = load_history(days=30)
    this_week = summary(week(history, today))
    last_week = summary(week(history, today - timedelta(days=7)))
    print("Leads this week:", this_week["leads"], trend(this_week, last_week))
''',
    },
    {
        "name": "lib/booking/slots.ts",
        "lang": "ts",
        "code": '''export type Slot = { start: Date; end: Date; free: boolean };

const OPEN_HOUR = 9;
const CLOSE_HOUR = 20;
const STEP_MINUTES = 30;

export function daySlots(day: Date, busy: Slot[]): Slot[] {
  const slots: Slot[] = [];
  const cursor = new Date(day);
  cursor.setHours(OPEN_HOUR, 0, 0, 0);

  while (cursor.getHours() < CLOSE_HOUR) {
    const start = new Date(cursor);
    cursor.setMinutes(cursor.getMinutes() + STEP_MINUTES);
    const end = new Date(cursor);
    const taken = busy.some((b) => overlaps(b, { start, end }));
    slots.push({ start, end, free: !taken });
  }
  return slots;
}

function overlaps(a: Pick<Slot, "start" | "end">, b: Pick<Slot, "start" | "end">) {
  return a.start < b.end && b.start < a.end;
}

export function firstFree(slots: Slot[], after = new Date()): Slot | null {
  return slots.find((s) => s.free && s.start >= after) ?? null;
}

export function formatSlot(slot: Slot, locale = "ru-RU"): string {
  const time = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${time.format(slot.start)} - ${time.format(slot.end)}`;
}
''',
    },
    {
        "name": "bot/handlers.py",
        "lang": "py",
        "code": '''import asyncio
import logging
from typing import Awaitable, Callable

log = logging.getLogger("studio.bot")

Handler = Callable[[dict], Awaitable[str | None]]
ROUTES: dict[str, Handler] = {}


def command(name: str):
    def wrap(fn: Handler) -> Handler:
        ROUTES[name] = fn
        return fn
    return wrap


@command("/start")
async def start(message: dict) -> str:
    name = message.get("from", {}).get("first_name", "friend")
    return f"Hello, {name}! Send /brief to describe your project."


@command("/brief")
async def brief(message: dict) -> str:
    return "Tell us about your business, site and deadline in one message."


async def dispatch(message: dict) -> str | None:
    text = (message.get("text") or "").strip()
    handler = ROUTES.get(text.split()[0] if text else "")
    if handler is None:
        return None
    try:
        return await asyncio.wait_for(handler(message), timeout=5)
    except asyncio.TimeoutError:
        log.warning("handler %s timed out", text)
        return "One moment, please. We will answer shortly."
''',
    },
    {
        "name": "lib/seo/sitemap.ts",
        "lang": "ts",
        "code": '''import type { MetadataRoute } from "next";

const LOCALES = ["ru", "uz", "en"] as const;
type Locale = (typeof LOCALES)[number];

interface Page {
  path: string;
  updated: string;
  priority?: number;
}

const PAGES: Page[] = [
  { path: "", updated: "2026-10-01", priority: 1 },
  { path: "/services", updated: "2026-09-20", priority: 0.8 },
  { path: "/cases", updated: "2026-10-12", priority: 0.8 },
  { path: "/blog", updated: "2026-10-14", priority: 0.6 },
];

function url(locale: Locale, path: string): string {
  return `https://example.com/${locale}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.flatMap((page) =>
    LOCALES.map((locale) => ({
      url: url(locale, page.path),
      lastModified: new Date(page.updated),
      priority: page.priority ?? 0.5,
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map((l) => [l, url(l, page.path)]),
        ),
      },
    })),
  );
}
''',
    },
]
