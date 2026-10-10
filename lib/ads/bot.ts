import { adsLoginLink, LOGIN_TOKEN_MINUTES, memberForTelegram } from "@/lib/ads/session";
import { workspaceById } from "@/lib/ads/store";

/**
 * `/start ads` — кнопка «Войти через Telegram» в кабинете автопилота рекламы.
 * Участнику кабинета бот присылает одноразовую ссылку на языке кабинета.
 * Не участник — false: бот ведёт себя так, будто payload незнакомый, и
 * через бота нельзя проверить, кто клиент студии.
 */
export async function handleAdsLogin(chatId: number, telegramUserId: number): Promise<boolean> {
  const member = await memberForTelegram(telegramUserId);
  if (!member) return false;
  const [link, workspace] = await Promise.all([adsLoginLink(member), workspaceById(member.workspace_id)]);
  if (!link || !workspace) return false;
  const { sendWithButtons } = await import("@/lib/qualify/telegram");
  const uz = workspace.locale === "uz";
  await sendWithButtons(
    chatId,
    uz
      ? `«${workspace.name}» reklama avtopiloti kabinetiga kirish havolasi. U ${LOGIN_TOKEN_MINUTES} daqiqa ishlaydi va bir marta ochiladi.`
      : `Ссылка для входа в кабинет автопилота рекламы «${workspace.name}». Действует ${LOGIN_TOKEN_MINUTES} минут и открывается один раз.`,
    [{ text: uz ? "Kabinetga kirish" : "Войти в кабинет", url: link }],
  );
  return true;
}
