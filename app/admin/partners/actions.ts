"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { partnerCopy } from "@/content/partner-bot";
import { parsePercent } from "@/lib/admin/finance";
import { requestIp, requireAdmin } from "@/lib/admin/guard";
import {
  createPartner,
  decideAgency,
  decidePayout,
  notifyPartner,
  partnerById,
  updatePartner,
} from "@/lib/partners/store";
import { agencyUntilDay } from "@/lib/partners/rules";
import { esc } from "@/lib/qualify/telegram";

/**
 * Партнёры — деньги посторонним людям, поэтому каждое действие начинается
 * с requireAdmin, а книга (`store.ts`) проверяет роль ещё раз: действие
 * сервера — обычный POST.
 */

function back(code: string): never {
  redirect(`/admin/partners?r=${code}`);
}

export async function addPartner(formData: FormData) {
  const admin = await requireAdmin();
  const telegramRaw = String(formData.get("telegram_id") ?? "").trim();
  const telegramUserId = /^\d{1,19}$/.test(telegramRaw) ? Number(telegramRaw) : null;
  if (telegramRaw && telegramUserId === null) back("invalid");

  const result = await createPartner(
    {
      name: String(formData.get("name") ?? ""),
      telegramUserId,
      code: String(formData.get("code") ?? "").trim() || null,
      note: String(formData.get("note") ?? ""),
    },
    admin,
    await requestIp(),
  );
  revalidatePath("/admin/partners");
  back(result.ok ? "created" : result.reason);
}

export async function editPartner(formData: FormData) {
  const admin = await requireAdmin();
  const partnerId = String(formData.get("partner") ?? "");
  const statusRaw = String(formData.get("status") ?? "");
  const percentRaw = String(formData.get("percent") ?? "").trim();
  const percent = percentRaw ? parsePercent(percentRaw) : null;
  if (percentRaw && percent === null) back("invalid");

  const result = await updatePartner(
    partnerId,
    {
      status: statusRaw === "blocked" ? "blocked" : statusRaw === "active" ? "active" : undefined,
      percentOverride: percent,
      note: String(formData.get("note") ?? ""),
      requisites: String(formData.get("requisites") ?? ""),
    },
    admin,
    await requestIp(),
  );
  revalidatePath("/admin/partners");
  back(result.ok ? "ok" : result.reason);
}

export async function decide(formData: FormData) {
  const admin = await requireAdmin();
  const payoutId = String(formData.get("payout") ?? "");
  const status = String(formData.get("status") ?? "") === "paid" ? "paid" : "rejected";
  const note = String(formData.get("note") ?? "").trim() || null;

  const result = await decidePayout(payoutId, status, note, admin, await requestIp());
  if (result.ok) {
    // Партнёр ждёт именно этого сообщения: без него «отправили» и «ничего не
    // пришло» неотличимы.
    const partner = await partnerById(result.payout.partner_id);
    if (partner) {
      const copy = partnerCopy("ru");
      await notifyPartner(
        partner,
        status === "paid"
          ? copy.paid(result.payout.amount_usd, note)
          : copy.rejected(result.payout.amount_usd, note),
      );
    }
  }
  revalidatePath("/admin/partners");
  back(result.ok ? (status === "paid" ? "paid" : "rejected") : result.reason);
}

/**
 * Решение по агентству партнёра. Партнёру — сообщение: подключили — все
 * заказы агентства его; отклонили — с причиной, чтобы не гадал.
 */
export async function decideAgencyAction(formData: FormData) {
  const admin = await requireAdmin();
  const decision = String(formData.get("decision") ?? "") === "active" ? "active" : "rejected";
  const note = String(formData.get("note") ?? "").trim() || null;
  const result = await decideAgency(String(formData.get("agency") ?? ""), decision, note, admin, await requestIp());
  if (!result.ok) back(result.reason);

  const partner = await partnerById(result.agency.partner_id);
  if (partner) {
    await notifyPartner(
      partner,
      decision === "active"
        ? `🏢 Агентство «${esc(result.agency.name)}» подключено. Его заказы засчитываются вам 12 месяцев — до ${agencyUntilDay(result.agency.decided_at)}, без ограничения в 30 дней. Этапы — в кабинете: /cabinet.`
        : `Агентство «${esc(result.agency.name)}» не подключено.${note ? ` Причина: ${esc(note)}.` : ""} Вопросы — напишите нам в этот бот.`,
    );
  }
  revalidatePath("/admin/partners");
  back(decision === "active" ? "agency_active" : "agency_rejected");
}
