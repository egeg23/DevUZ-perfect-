import { record } from "@/lib/admin/audit";
import { circleFile, recordCircleFile } from "@/lib/admin/circle-store";
import { CIRCLE_MAX_BYTES, CIRCLE_MIME, circleProblem } from "@/lib/admin/circle-rules";
import type { Staff } from "@/lib/admin/session";
import { promoStart, type StartResult } from "@/lib/partners/promo";
import { discardUpload, finishUpload, removePromoFile, type PromoFail } from "@/lib/partners/promo-files";

/**
 * Загрузка кружка для касаний в «Аккаунтах» (lib/admin/circle-store.ts).
 *
 * Файл едет кусками тем же путём, что промо-материалы и видео к инструкциям,
 * и ложится в ту же папку на сервере. Кружок один на всю студию: новый
 * заменяет старый, старый файл стирается. Сколько секунд, ширину и высоту
 * присылает браузер (он их уже прочитал) — без них Telegram покажет кружок
 * с нулевой длительностью.
 */

export async function circleStart(input: { mime: string; bytes: number }): Promise<StartResult> {
  if (!(CIRCLE_MIME as readonly string[]).includes(input.mime)) return { ok: false, reason: "bad_type" };
  if (input.bytes > CIRCLE_MAX_BYTES) return { ok: false, reason: "too_big" };
  return promoStart(input);
}

export async function saveCircle(
  input: { uploadId: string; width: number | null; height: number | null; duration: number | null },
  actor: Staff,
  ip: string | null,
): Promise<{ ok: true } | PromoFail> {
  const finished = await finishUpload(input.uploadId);
  if (!finished.ok) return finished;

  const problem = circleProblem({
    mime: finished.mime,
    bytes: finished.bytes,
    duration: input.duration,
    width: input.width,
    height: input.height,
  });
  if (problem) {
    await removePromoFile(finished.path);
    return { ok: false, reason: problem === "type" ? "bad_type" : problem === "size" ? "too_big" : "bad_size", detail: problem };
  }

  const before = await circleFile();
  const saved = await recordCircleFile({
    path: finished.path,
    bytes: finished.bytes,
    duration: Math.round(input.duration!),
    width: Math.round(input.width!),
    height: Math.round(input.height!),
    uploadedAt: Date.now(),
    by: actor.display_name,
  });
  if (!saved) {
    await removePromoFile(finished.path);
    return { ok: false, reason: "offline" };
  }
  if (before && before.path !== finished.path) await removePromoFile(before.path);

  await record("tg_circle.saved", {
    actorStaffId: actor.id,
    targetType: "tg_circle",
    targetId: null,
    meta: { bytes: finished.bytes, duration: Math.round(input.duration!), replaced: Boolean(before) },
    ip,
  });
  return { ok: true };
}

export { discardUpload as circleDiscard };
