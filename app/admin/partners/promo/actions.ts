"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";

import { requestIp, requireRole } from "@/lib/admin/guard";
import {
  announcePromo,
  deletePromo,
  promoChunk,
  promoDiscard,
  promoStart,
  registerPromo,
  updatePromo,
  type PromoFail,
  type StartResult,
} from "@/lib/partners/promo";

/**
 * Промо-материалы партнёров. Только владелец — как и весь раздел партнёров.
 *
 * Первые четыре действия зовёт форма загрузки из браузера и ждёт ответа
 * данными, а не переходом: файл едет на наш сервер кусками, по одному
 * действию на кусок (lib/partners/promo-files.ts).
 */

const num = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : null);

export async function promoStartAction(input: { mime: string; bytes: number }): Promise<StartResult> {
  await requireRole("admin", "head");
  return promoStart({ mime: String(input?.mime ?? ""), bytes: Number(input?.bytes) });
}

/** Кусок файла: FormData с upload, offset и самим куском. */
export async function promoChunkAction(formData: FormData): Promise<{ ok: true; received: number } | PromoFail> {
  await requireRole("admin", "head");
  const chunk = formData.get("chunk");
  if (!(chunk instanceof Blob)) return { ok: false, reason: "chunk_missing" };
  return promoChunk(
    String(formData.get("upload") ?? ""),
    Number(formData.get("offset")),
    new Uint8Array(await chunk.arrayBuffer()),
  );
}

/** Бросить загрузку: владелец передумал или связь не вернулась. */
export async function promoDiscardAction(uploadId: string): Promise<void> {
  await requireRole("admin", "head");
  await promoDiscard(String(uploadId ?? ""));
}

export async function promoRegisterAction(input: {
  uploadId: string;
  title: string;
  locale: string;
  caption: string;
  width: number | null;
  height: number | null;
  duration: number | null;
  notify: boolean;
}): Promise<{ ok: true } | PromoFail> {
  const admin = await requireRole("admin", "head");
  const result = await registerPromo(
    {
      uploadId: String(input?.uploadId ?? ""),
      title: String(input?.title ?? ""),
      locale: String(input?.locale ?? "all"),
      caption: String(input?.caption ?? ""),
      width: num(input?.width),
      height: num(input?.height),
      duration: num(input?.duration),
    },
    admin,
    await requestIp(),
  );
  if (!result.ok) return result;
  // Рассылка — после ответа: владелец не ждёт, пока бот обойдёт всех.
  if (input?.notify === true) after(() => announcePromo(result.material).then(() => undefined));
  revalidatePath("/admin/partners/promo");
  return { ok: true };
}

function back(code: string): never {
  redirect(`/admin/partners/promo?r=${code}`);
}

export async function promoUpdateAction(formData: FormData) {
  const admin = await requireRole("admin", "head");
  const result = await updatePromo(
    String(formData.get("promo") ?? ""),
    {
      title: String(formData.get("title") ?? ""),
      locale: String(formData.get("locale") ?? "all"),
      caption: String(formData.get("caption") ?? ""),
    },
    admin,
    await requestIp(),
  );
  revalidatePath("/admin/partners/promo");
  back(result.ok ? "saved" : result.reason);
}

export async function promoVisibilityAction(formData: FormData) {
  const admin = await requireRole("admin", "head");
  const hidden = String(formData.get("hidden") ?? "") === "1";
  const result = await updatePromo(String(formData.get("promo") ?? ""), { hidden }, admin, await requestIp());
  revalidatePath("/admin/partners/promo");
  back(result.ok ? (hidden ? "hidden" : "shown") : result.reason);
}

export async function promoDeleteAction(formData: FormData) {
  const admin = await requireRole("admin", "head");
  const result = await deletePromo(String(formData.get("promo") ?? ""), admin, await requestIp());
  revalidatePath("/admin/partners/promo");
  back(result.ok ? "deleted" : result.reason);
}
