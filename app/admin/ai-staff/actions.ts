"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { CABINET_COOKIE, enterAsStaff } from "@/lib/ai-staff/auth";
import { setupServiceBot } from "@/lib/ai-staff/channels";
import { PLANS, extendPaid, isPlan } from "@/lib/ai-staff/plans";
import * as store from "@/lib/ai-staff/store";
import { requireAdmin } from "@/lib/admin/guard";

/**
 * Действия владельца студии над клиентами ИИ-сотрудников. Только админ:
 * деньги, сроки и доступ к чужим кабинетам.
 */

const str = (form: FormData, name: string, max = 200) => String(form.get(name) ?? "").trim().slice(0, max);
const PAGE = "/admin/ai-staff";

export async function toggleService(form: FormData): Promise<void> {
  await requireAdmin();
  await store.setServiceEnabled(str(form, "on") === "on");
  revalidatePath(PAGE);
}

export async function connectServiceBot(): Promise<void> {
  await requireAdmin();
  const result = await setupServiceBot();
  const n = result.ok ? (result.business ? "bot_ok" : "bot_nobiz") : "bot_fail";
  redirect(`${PAGE}?n=${n}&d=${encodeURIComponent(result.detail.slice(0, 120))}`);
}

export async function markPaid(form: FormData): Promise<void> {
  const staff = await requireAdmin();
  const tenant = await store.tenantById(str(form, "tenant", 64));
  const plan = str(form, "plan");
  const months = Math.max(1, Math.min(24, Number(str(form, "months")) || 1));
  if (!tenant || !isPlan(plan) || plan === "trial") redirect(PAGE);
  const method = ["invoice", "cash", "card"].includes(str(form, "method")) ? str(form, "method") : "invoice";
  const amount = Number(str(form, "amount").replace(/\D/g, "")) || PLANS[plan].priceUzs * months;
  await store.addPayment(tenant.id, {
    plan,
    months,
    amountUzs: amount,
    method,
    paidUntil: extendPaid(tenant.paid_until, months, new Date()),
    staffId: staff.id,
  });
  await store.setEmployeeTier(tenant.id, PLANS[plan].tier);
  revalidatePath(PAGE);
}

export async function setStatus(form: FormData): Promise<void> {
  await requireAdmin();
  const status = str(form, "status");
  if (status === "active" || status === "paused" || status === "blocked") {
    await store.setTenantTerms(str(form, "tenant", 64), { status });
  }
  revalidatePath(PAGE);
}

export async function extendTrial(form: FormData): Promise<void> {
  await requireAdmin();
  const tenant = await store.tenantById(str(form, "tenant", 64));
  if (tenant) {
    const from = tenant.trial_until && Date.parse(tenant.trial_until) > Date.now() ? Date.parse(tenant.trial_until) : Date.now();
    await store.setTenantTerms(tenant.id, { trial_until: new Date(from + 7 * 86_400_000).toISOString() });
  }
  revalidatePath(PAGE);
}

/** Демо на странице сервиса: виджет этого клиента встаёт на /ru/ai-sotrudnik. */
export async function makeShowcase(form: FormData): Promise<void> {
  await requireAdmin();
  const tenant = await store.tenantById(str(form, "tenant", 64));
  if (tenant) {
    const widget = await store.ensureWidgetChannel(tenant.id);
    await store.saveSetting("demo_widget_key", widget.widget_key);
  }
  revalidatePath(PAGE);
}

/** Вход поддержки в кабинет клиента: своя сессия на 2 часа, с пометкой в шапке кабинета. */
export async function openCabinet(form: FormData): Promise<void> {
  const staff = await requireAdmin();
  const tenant = await store.tenantById(str(form, "tenant", 64));
  if (!tenant) redirect(PAGE);
  const session = await enterAsStaff(staff, tenant.id);
  (await cookies()).set(CABINET_COOKIE, session.cookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/cabinet",
    expires: session.expires,
  });
  redirect("/cabinet");
}
