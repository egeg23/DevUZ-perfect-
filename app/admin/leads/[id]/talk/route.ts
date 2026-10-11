import { NextResponse, type NextRequest } from "next/server";

import { currentStaff } from "@/lib/admin/guard";
import { leadById } from "@/lib/admin/leads";
import { canEdit } from "@/lib/admin/ownership";
import { talkForLead } from "@/lib/admin/outreach-talk-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Свежая «Первичка по касанию» для чата карточки (components/admin/talk-chat).
 *
 * Чат спрашивает раз в несколько секунд, пока вкладка открыта: клиент
 * ответил — реплика появляется без перезагрузки, ушло ли наше — видно по
 * статусу. Права те же, что у блока на странице: лид должен быть свой.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "login" }, { status: 401 });
  const { id } = await params;
  const lead = await leadById(id);
  if (!lead || !canEdit(lead, staff)) return NextResponse.json({ error: "forbidden" }, { status: 404 });
  const talk = await talkForLead(id);
  if (!talk) return NextResponse.json({ error: "gone" }, { status: 404 });
  return NextResponse.json(
    { lines: talk.lines, aiHandling: talk.aiHandling, handoverReason: talk.handoverReason },
    { headers: { "cache-control": "no-store" } },
  );
}
