import { currentStaff } from "@/lib/admin/guard";
import { accountById, type Account } from "@/lib/ads/store";
import { currentAdsViewer } from "@/lib/ads/session";

/**
 * Кто вправе смотреть и менять рекламный кабинет.
 *
 * Два входа: участник кабинета агентства (вход через бота, lib/ads/session.ts)
 * — только свои кабинеты; владелец и руководитель студии из панели — все.
 * Менеджер студии — нет: решения о чужих рекламных деньгах не его работа.
 *
 * Каждое действие зовёт это само: server action — обычный POST, и отправить
 * его можно мимо страницы.
 */

export type AdsActor = { kind: "member" | "staff"; label: string; locale: "ru" | "uz" | "pl"; telegramId: number };

export async function staffAdsActor(): Promise<AdsActor | null> {
  const staff = await currentStaff();
  if (!staff || (staff.role !== "admin" && staff.role !== "head")) return null;
  return { kind: "staff", label: `студия: ${staff.display_name}`, locale: staff.panel_locale, telegramId: staff.telegram_user_id };
}

export async function canUseAccount(accountId: string): Promise<{ account: Account; actor: AdsActor } | null> {
  const account = await accountById(accountId);
  if (!account) return null;
  const staff = await staffAdsActor();
  if (staff) return { account, actor: staff };
  const viewer = await currentAdsViewer();
  if (viewer && viewer.workspace.id === account.workspace_id) {
    return { account, actor: { kind: "member", label: viewer.member.name || `tg:${viewer.member.telegram_user_id}`, locale: viewer.workspace.locale, telegramId: viewer.member.telegram_user_id } };
  }
  return null;
}

export async function canUseWorkspace(workspaceId: string): Promise<AdsActor | null> {
  const staff = await staffAdsActor();
  if (staff) return staff;
  const viewer = await currentAdsViewer();
  if (viewer && viewer.workspace.id === workspaceId) {
    return { kind: "member", label: viewer.member.name || `tg:${viewer.member.telegram_user_id}`, locale: viewer.workspace.locale, telegramId: viewer.member.telegram_user_id };
  }
  return null;
}
