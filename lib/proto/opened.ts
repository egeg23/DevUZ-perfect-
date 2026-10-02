/**
 * Клиент открыл прототип — лучший момент написать.
 *
 * Владелец бизнеса прямо сейчас смотрит на свой новый сайт: через час он
 * про него забудет, а сейчас любой вопрос попадает в мысль, которую он уже
 * думает. Поэтому о первом открытии бот зовёт того, кто ведёт касание, — в
 * ту же минуту, а не к вечеру в отчёте.
 *
 * Считать надо только живого человека. Ссылку в письме Telegram открывает
 * сам, чтобы нарисовать превью, — в секунду отправки, и без фильтра каждое
 * касание «открывалось» сразу. Так же ведут себя WhatsApp и прочие
 * мессенджеры. И наши собственные открытия из панели — менеджер проверил
 * ссылку перед отправкой — клиентом не являются.
 */

/** Кто приходит за превью ссылки, а не смотреть страницу. */
const PREVIEW_AGENTS =
  /TelegramBot|WhatsApp|facebookexternalhit|Facebot|Twitterbot|Slackbot|Discordbot|LinkedInBot|SkypeUriPreview|vkShare|redditbot|Googlebot|bingbot|YandexBot|Applebot|Embedly|Iframely|\bbot\b|bot\/|crawler|spider|preview/i;

export function isPreviewFetch(userAgent: string | null): boolean {
  // Пустой агент — не браузер: браузер его присылает всегда.
  if (!userAgent?.trim()) return true;
  return PREVIEW_AGENTS.test(userAgent);
}

/** Есть ли у запроса сессия панели — значит, открыл свой. */
export function fromPanel(cookieHeader: string | null, sessionCookie: string): boolean {
  if (!cookieHeader) return false;
  return cookieHeader.split(";").some((part) => part.trim().startsWith(`${sessionCookie}=`));
}

/** Строка тому, кто ведёт касание. Обёртку «Касание · сайт» и ссылку на лид добавляет tellManager. */
export function openedText(name: string): string {
  return `👀 Клиент открыл прототип «${name}» — прямо сейчас он смотрит на свой новый сайт. Самое время написать: спросите, что ему понравилось и что бы он поменял.`;
}
