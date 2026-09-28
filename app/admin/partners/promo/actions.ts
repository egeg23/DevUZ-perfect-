"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";

import { requestIp, requireAdmin } from "@/lib/admin/guard";
import {
  announcePromo,
  deletePromo,
  promoTicket,
  registerPromo,
  updatePromo,
  type TicketResult,
} from "@/lib/partners/promo";

/**
 * Промо-материалы партнёров. Только владелец — как и весь раздел партнёров.
 *
 * Первые два действия зовёт форма загрузки из браузера и ждёт ответа
 * данными, а не переходом: между ними файл уходит прямо в хранилище.
 */

const num = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : null);

export async function promoTicketAction(input: { mime: string; bytes: number }): Promise<TicketResult> {
  await requireAdmin();
  return promoTicket({ mime: String(input?.mime ?? ""), bytes: Number(input?.bytes) });
}

export async function promoRegisterAction(input: {
  path: string;
  title: string;
  locale: string;
  caption: string;
  width: number | null;
  height: number | null;
  duration: number | null;
  notify: boolean;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const admin = await requireAdmin();
  const result = await registerPromo(
    {
      path: String(input?.path ?? ""),
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
  const admin = await requireAdmin();
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
  const admin = await requireAdmin();
  const hidden = String(formData.get("hidden") ?? "") === "1";
  const result = await updatePromo(String(formData.get("promo") ?? ""), { hidden }, admin, await requestIp());
  revalidatePath("/admin/partners/promo");
  back(result.ok ? (hidden ? "hidden" : "shown") : result.reason);
}

export async function promoDeleteAction(formData: FormData) {
  const admin = await requireAdmin();
  const result = await deletePromo(String(formData.get("promo") ?? ""), admin, await requestIp());
  revalidatePath("/admin/partners/promo");
  back(result.ok ? "deleted" : result.reason);
}
