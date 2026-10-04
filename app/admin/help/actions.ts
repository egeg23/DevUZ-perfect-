"use server";

import { revalidatePath } from "next/cache";

import { isHelpLocale, type HelpLocale } from "@/content/admin-help";
import { requestIp, requireRole, requireStaff } from "@/lib/admin/guard";
import { MODEL_LIMIT, QUESTION_MAX, searchHelp, type HelpSearchResult } from "@/lib/admin/help-search";
import { helpVideoStart, removeHelpVideo, saveHelpVideo } from "@/lib/admin/help-videos";
import { isRole, type Role } from "@/lib/admin/roles";
import { promoChunk, promoDiscard, type PromoFail, type StartResult } from "@/lib/partners/promo";
import { rateLimit } from "@/lib/qualify/limiter";

/**
 * Поиск по инструкции: вопрос своими словами → пункты, которые на него
 * отвечают (см. lib/admin/help-search.ts).
 *
 * Роль и язык — те же, что у страницы: владелец в «Показать как» ищет по
 * инструкции этой роли, остальные — только по своей, что бы ни пришло из
 * браузера. Частые вопросы одного человека модели не отдаются, а ищутся по
 * словам: страница работает, а счёт за модель не растёт от зажатой клавиши.
 */
export async function searchHelpAction(question: string, lang: string, as?: string): Promise<HelpSearchResult> {
  const staff = await requireStaff();
  const locale: HelpLocale = isHelpLocale(lang) ? lang : isHelpLocale(staff.panel_locale) ? staff.panel_locale : "ru";
  const role: Role = staff.role === "admin" && as && isRole(as) ? as : staff.role;
  const text = String(question ?? "").slice(0, QUESTION_MAX);
  const useModel = rateLimit(`help-search:${staff.id}`, MODEL_LIMIT).ok;
  return searchHelp({ question: text, locale, role, useModel });
}

/**
 * Видео к инструкциям (lib/admin/help-videos.ts): загружают и убирают
 * владелец и руководитель. Файл едет кусками, по одному действию на кусок —
 * как промо-материалы партнёров, и в ту же папку на сервере.
 */
const manage = () => requireRole("admin", "head");
const num = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : null);

export async function helpVideoStartAction(input: { mime: string; bytes: number }): Promise<StartResult> {
  await manage();
  return helpVideoStart({ mime: String(input?.mime ?? ""), bytes: Number(input?.bytes) });
}

export async function helpVideoChunkAction(formData: FormData): Promise<{ ok: true; received: number } | PromoFail> {
  await manage();
  const chunk = formData.get("chunk");
  if (!(chunk instanceof Blob)) return { ok: false, reason: "chunk_missing" };
  return promoChunk(
    String(formData.get("upload") ?? ""),
    Number(formData.get("offset")),
    new Uint8Array(await chunk.arrayBuffer()),
  );
}

export async function helpVideoDiscardAction(uploadId: string): Promise<void> {
  await manage();
  await promoDiscard(String(uploadId ?? ""));
}

export async function helpVideoSaveAction(input: {
  uploadId: string;
  section: string;
  locale: string;
  width: number | null;
  height: number | null;
  duration: number | null;
}): Promise<{ ok: true } | PromoFail> {
  const staff = await manage();
  const result = await saveHelpVideo(
    {
      uploadId: String(input?.uploadId ?? ""),
      section: String(input?.section ?? ""),
      locale: String(input?.locale ?? ""),
      width: num(input?.width),
      height: num(input?.height),
      duration: num(input?.duration),
    },
    staff,
    await requestIp(),
  );
  if (result.ok) revalidatePath("/admin/help");
  return result;
}

export async function helpVideoRemoveAction(id: string): Promise<boolean> {
  const staff = await manage();
  const removed = await removeHelpVideo(String(id ?? ""), staff, await requestIp());
  if (removed) revalidatePath("/admin/help");
  return removed;
}
