"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

import { canConfigure, requireCabinet, requireTenant } from "@/lib/ai-staff/auth";
import { channelsLeft, connectBot, disconnectBot } from "@/lib/ai-staff/channels";
import { openToken, randomKey } from "@/lib/ai-staff/crypto";
import { parseHours } from "@/lib/ai-staff/hours";
import { importSite } from "@/lib/ai-staff/import";
import { isKnowledgeKind } from "@/lib/ai-staff/prompt";
import { handleIncoming } from "@/lib/ai-staff/service";
import * as store from "@/lib/ai-staff/store";
import { sendText } from "@/lib/ai-staff/telegram";
import { appSecret } from "@/lib/secrets";

/**
 * Действия кабинета. Каждое начинается с проверки входа, а изменение
 * настроек — ещё и с роли: менеджер клиента видит разговоры и заявки, но
 * базу, каналы и команду меняет владелец (или поддержка студии).
 *
 * id клиента берётся из сессии, а не из формы: всё, что пришло формой, —
 * это id строки внутри своего кабинета, и store.ts ищет её с фильтром по
 * клиенту, так что чужой id ничего не найдёт.
 */

const str = (form: FormData, name: string, max = 2000) => String(form.get(name) ?? "").trim().slice(0, max);

async function owner() {
  const cabinet = await requireTenant();
  if (!canConfigure(cabinet.role)) notFound();
  return cabinet;
}

export async function createCabinet(form: FormData): Promise<void> {
  const cabinet = await requireCabinet();
  if (cabinet.session.staffId) notFound();
  const name = str(form, "name", 120);
  if (!name) redirect("/cabinet/start?e=name");
  const locale = str(form, "locale") === "uz" ? "uz" : "ru";
  const tenant = await store.createTenant({
    name,
    niche: str(form, "niche", 120),
    locale,
    owner: { id: cabinet.session.telegramUserId, name: str(form, "owner", 120) || name, username: null },
  });
  const site = str(form, "site", 300);
  if (/^https?:\/\/\S+\.\S+/.test(site)) await store.updateTenant(tenant.id, { site_url: site });
  await store.setSessionTenant(cabinet.tokenHash, tenant.id);
  redirect("/cabinet/knowledge");
}

export async function switchTenant(form: FormData): Promise<void> {
  const cabinet = await requireCabinet();
  const id = str(form, "tenant", 64);
  if (cabinet.memberships.some((m) => m.tenant_id === id)) await store.setSessionTenant(cabinet.tokenHash, id);
  redirect("/cabinet");
}

/* ── База знаний ── */

export async function addKnowledgeItem(form: FormData): Promise<void> {
  const { tenant } = await owner();
  const kind = str(form, "kind");
  const title = str(form, "title", 200);
  const body = str(form, "body", 8000);
  if (body || title) await store.addKnowledge(tenant.id, [{ kind: isKnowledgeKind(kind) ? kind : "other", title, body }]);
  revalidatePath("/cabinet/knowledge");
  redirect("/cabinet/knowledge?n=saved");
}

export async function saveKnowledgeItem(form: FormData): Promise<void> {
  const { tenant } = await owner();
  const kind = str(form, "kind");
  await store.updateKnowledge(tenant.id, str(form, "id", 64), {
    kind: isKnowledgeKind(kind) ? kind : "other",
    title: str(form, "title", 200),
    body: str(form, "body", 8000),
  });
  revalidatePath("/cabinet/knowledge");
  redirect("/cabinet/knowledge?n=saved");
}

export async function removeKnowledgeItem(form: FormData): Promise<void> {
  const { tenant } = await owner();
  await store.deleteKnowledge(tenant.id, str(form, "id", 64));
  revalidatePath("/cabinet/knowledge");
}

export async function importFromSite(form: FormData): Promise<void> {
  const { tenant } = await owner();
  let url = str(form, "url", 300);
  if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
  let target = "/cabinet/knowledge?n=import_fail";
  try {
    const result = await importSite(tenant.id, url);
    if (result.items.length) {
      await store.replaceSiteKnowledge(tenant.id, result.items, url);
      await store.updateTenant(tenant.id, {
        site_url: url,
        ...(tenant.niche ? {} : { niche: result.niche }),
      });
      target = `/cabinet/knowledge?n=import&c=${result.items.length}&d=${result.dropped}`;
    }
  } catch (error) {
    console.error("ai-staff: разбор сайта", tenant.id, (error as Error).message);
  }
  revalidatePath("/cabinet/knowledge");
  redirect(target);
}

/* ── Каналы ── */

export async function connectOwnBot(form: FormData): Promise<void> {
  const { tenant } = await owner();
  const result = await connectBot(tenant, str(form, "token", 120));
  revalidatePath("/cabinet/channels");
  redirect(result.ok ? "/cabinet/channels?n=bot_ok" : `/cabinet/channels?n=${result.why}`);
}

export async function disconnectChannel(form: FormData): Promise<void> {
  const { tenant } = await owner();
  const channel = (await store.channels(tenant.id)).find((c) => c.id === str(form, "id", 64));
  if (channel) {
    let token: string | null = null;
    if (channel.kind === "tg_bot" && channel.token_enc) {
      const key = await appSecret("AI_STAFF_KEY");
      token = key ? openToken(channel.token_enc, key) : null;
    }
    if (channel.kind === "tg_bot") await disconnectBot(tenant, channel, token);
    else await store.setChannelStatus(tenant.id, channel.id, "off");
  }
  revalidatePath("/cabinet/channels");
  redirect("/cabinet/channels");
}

export async function enableWidget(): Promise<void> {
  const { tenant } = await owner();
  if (channelsLeft(tenant.plan, await store.channels(tenant.id), "widget") < 0) redirect("/cabinet/channels?n=limit");
  const widget = await store.ensureWidgetChannel(tenant.id);
  if (widget.status !== "active") await store.setChannelStatus(tenant.id, widget.id, "active");
  revalidatePath("/cabinet/channels");
  redirect("/cabinet/channels#widget");
}

/* ── Проверка на себе ── */

export async function testSend(text: string, chatKey: string): Promise<{ reply: string | null; requestNo: string | null }> {
  const { tenant } = await requireTenant();
  const clean = text.trim().slice(0, 2000);
  if (!clean || !/^[\w-]{8,64}$/.test(chatKey)) return { reply: null, requestNo: null };
  const outcome = await handleIncoming({
    tenantId: tenant.id,
    channel: null,
    kind: "test",
    chatKey,
    text: clean,
    customer: { name: "", handle: null },
  });
  if (outcome.kind === "reply") return { reply: outcome.text, requestNo: outcome.lead?.request_no ?? null };
  if (outcome.kind === "stopped") return { reply: outcome.text, requestNo: null };
  return { reply: null, requestNo: null };
}

export async function testReset(chatKey: string): Promise<string> {
  const { tenant } = await requireTenant();
  if (/^[\w-]{8,64}$/.test(chatKey)) await store.resetTestConversation(tenant.id, chatKey);
  return randomKey(12);
}

/* ── Разговоры ── */

export async function setTalkMode(form: FormData): Promise<void> {
  const { tenant } = await requireTenant();
  const id = str(form, "id", 64);
  const human = str(form, "mode") === "human";
  if (await store.conversationById(tenant.id, id)) {
    await store.saveConversation(tenant.id, id, { mode: human ? "human" : "ai", human_until: null });
  }
  revalidatePath(`/cabinet/talks/${id}`);
  redirect(`/cabinet/talks/${id}`);
}

/** Ответ покупателю от имени бота клиента — только в канале «свой бот». */
export async function replyInTalk(form: FormData): Promise<void> {
  const { tenant } = await requireTenant();
  const id = str(form, "id", 64);
  const text = str(form, "text", 3000);
  const conv = await store.conversationById(tenant.id, id);
  if (conv && text && conv.kind === "tg_bot" && conv.channel_id) {
    const channel = (await store.channels(tenant.id)).find((c) => c.id === conv.channel_id);
    const key = await appSecret("AI_STAFF_KEY");
    const token = channel?.token_enc && key ? openToken(channel.token_enc, key) : null;
    if (token && (await sendText(token, conv.chat_key, text))) {
      await store.saveConversation(tenant.id, id, {
        messages: [...conv.messages, { role: "human", text, at: new Date().toISOString() }],
        mode: "human",
        human_until: null,
        last_at: new Date().toISOString(),
      });
    }
  }
  revalidatePath(`/cabinet/talks/${id}`);
  redirect(`/cabinet/talks/${id}`);
}

export async function removeTalk(form: FormData): Promise<void> {
  const { tenant } = await owner();
  await store.deleteConversation(tenant.id, str(form, "id", 64));
  redirect("/cabinet/talks");
}

/* ── Заявки ── */

export async function setLead(form: FormData): Promise<void> {
  const cabinet = await requireTenant();
  const status = str(form, "status");
  if (status === "new" || status === "taken" || status === "won" || status === "lost") {
    const who = cabinet.memberships.find((m) => m.tenant_id === cabinet.tenant.id)?.name ?? null;
    await store.setLeadStatus(cabinet.tenant.id, str(form, "id", 64), status, who);
  }
  revalidatePath("/cabinet/leads");
}

export async function removeLead(form: FormData): Promise<void> {
  const { tenant } = await owner();
  await store.deleteLead(tenant.id, str(form, "id", 64));
  revalidatePath("/cabinet/leads");
}

/* ── Настройки и команда ── */

export async function saveSettings(form: FormData): Promise<void> {
  const { tenant } = await owner();
  const days = form.getAll("days").map(Number);
  await store.updateTenant(tenant.id, {
    name: str(form, "name", 120) || tenant.name,
    niche: str(form, "niche", 120),
    locale: str(form, "locale") === "uz" ? "uz" : "ru",
    answer_mode: str(form, "answer_mode") === "off_hours" ? "off_hours" : "always",
    work_hours: parseHours({ from: str(form, "from", 5), to: str(form, "to", 5), days }),
  });
  await store.updateEmployee(tenant.id, {
    name: str(form, "assistant", 60),
    tone: str(form, "tone") === "formal" ? "formal" : "friendly",
    greeting: str(form, "greeting", 300),
    enabled: form.get("enabled") === "on",
  });
  revalidatePath("/cabinet/settings");
  redirect("/cabinet/settings?n=saved");
}

export async function toggleNotify(form: FormData): Promise<void> {
  const { tenant } = await owner();
  await store.setMemberNotify(tenant.id, str(form, "id", 64), str(form, "notify") === "on");
  revalidatePath("/cabinet/team");
}

export async function removeMemberAction(form: FormData): Promise<void> {
  const { tenant } = await owner();
  await store.removeMember(tenant.id, str(form, "id", 64));
  revalidatePath("/cabinet/team");
}
