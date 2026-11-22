import { friendCopy } from "@/content/friend-bot";
import { FRIEND_GIFT_USD } from "@/lib/partners/friend";
import { friendLinks, friendProgress } from "@/lib/partners/friend-store";
import { promoOf } from "@/lib/partners/rules";
import { ensurePartner, isStaffTelegram, partnerByTelegram, type Partner, type TelegramIdentity } from "@/lib/partners/store";
import { botLangOf } from "@/lib/proto/instant/store";
import { sendMessage, sendWithButtons } from "@/lib/qualify/telegram";

/**
 * /friend в боте студии и кнопка «🎁 Приведи друга — сайт бесплатно»:
 * регистрация одной кнопкой, без проверки руками. Сотрудник — отказ (по
 * списку сотрудников, как у партнёров). Уже партнёр с процентом —
 * остаётся партнёром: одна запись на Telegram, второй системы нет.
 */
export async function handleFriend(chatId: number, from: TelegramIdentity): Promise<void> {
  const lang = await botLangOf(chatId).catch(() => null);
  const copy = friendCopy(lang);
  if (await isStaffTelegram(from.id)) {
    await sendMessage(chatId, copy.staffOnly);
    return;
  }
  const existing = await partnerByTelegram(from.id);
  if (existing && existing.kind !== "friend") {
    await sendMessage(chatId, copy.partner(promoOf(existing)));
    return;
  }
  const partner = existing ?? (await ensurePartner(from, "friend"));
  if (!partner || partner.status !== "active") {
    await sendMessage(chatId, copy.unavailable);
    return;
  }
  await sendFriendView(chatId, partner, lang);
}

/** Ссылка, слово, условия и прогресс — одним сообщением, с кнопкой «Переслать другу». */
export async function sendFriendView(chatId: number, partner: Partner, lang: string | null): Promise<void> {
  const copy = friendCopy(lang);
  const [links, progress] = await Promise.all([friendLinks(partner), friendProgress([partner])]);
  const stats = progress.get(partner.id) ?? { came: 0, ordered: 0, paid: 0, earned: [] };
  const text = `${copy.intro({ ...links, price: FRIEND_GIFT_USD })}\n\n${copy.stats(stats)}`;
  const share = `https://t.me/share/url?url=${encodeURIComponent(links.bot)}&text=${encodeURIComponent(copy.share(links))}`;
  await sendWithButtons(chatId, text, [{ text: copy.shareButton, url: share }]);
}
