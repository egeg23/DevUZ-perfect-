import { NextResponse, type NextRequest } from "next/server";

import { currentStaff } from "@/lib/admin/guard";
import { verifyHelpVideoLink } from "@/lib/admin/help-video-link";
import { canWatchHelpVideo } from "@/lib/admin/help-video-rules";
import { helpVideoById } from "@/lib/admin/help-videos";
import { servePromo } from "@/lib/partners/promo-serve";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Файл видео к инструкции — с поддержкой Range, иначе Safari его не покажет,
 * а перемотка скачивает ролик с начала. Видит тот, кому открыт раздел видео;
 * чужому и вышедшему — 404, без подсказки, что файл есть.
 *
 * Ссылка со страницы инструкций подписана (lib/admin/help-video-link.ts): по
 * ней кусок отдаётся сразу, без запросов в базу — права уже проверила
 * страница. Без подписи (старая закладка, ключа нет) — вход и раздел
 * проверяются на каждый кусок, как раньше.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const signed = verifyHelpVideoLink(id, request.nextUrl.searchParams);
  if (signed) {
    return servePromo(request, { id, title: "help", storage_path: signed.path, mime: signed.mime }, { download: false });
  }

  const staff = await currentStaff();
  if (!staff) return new NextResponse(null, { status: 404 });
  const video = await helpVideoById(id);
  if (!video || !canWatchHelpVideo(staff.role, video.section)) return new NextResponse(null, { status: 404 });
  return servePromo(request, { id: video.id, title: "help", storage_path: video.storage_path, mime: video.mime }, { download: false });
}
