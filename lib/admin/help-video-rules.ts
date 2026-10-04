import { SECTIONS, canSee, type Role } from "@/lib/admin/roles";

/**
 * Видео к инструкциям — то, что считается без базы и диска.
 *
 * Отдельно от lib/admin/help-videos.ts: эти правила нужны и форме загрузки
 * в браузере, а модуль с базой и диском в браузер не тянется.
 */

/** Ключ вводного ролика — наверху страницы «Инструкции», а не в разделе. */
export const HELP_VIDEO_INTRO = "intro";

export const HELP_VIDEO_LOCALES = ["ru", "uz", "pl"] as const;
export type HelpVideoLocale = (typeof HELP_VIDEO_LOCALES)[number];

export function isHelpVideoLocale(value: string): value is HelpVideoLocale {
  return (HELP_VIDEO_LOCALES as readonly string[]).includes(value);
}

/** Только ролики: картинка к разделу — это скриншот в тексте, а не видео. */
export const HELP_VIDEO_MIME: readonly string[] = ["video/mp4", "video/quicktime", "video/webm"];

/** Раздел из меню панели или вводный ролик — и ничего больше. */
export function isHelpVideoSection(key: string): boolean {
  return key === HELP_VIDEO_INTRO || SECTIONS.some((section) => section.href === key);
}

/** Загружают и убирают видео владелец и руководитель: команда видео смотрит. */
export function canManageHelpVideos(role: Role): boolean {
  return role === "admin" || role === "head";
}

/** Видео раздела видит тот, кому открыт раздел; вводное — все. */
export function canWatchHelpVideo(role: Role, section: string): boolean {
  return section === HELP_VIDEO_INTRO || canSee(role, section);
}

/** Адрес файла — под /admin, где живёт кука сессии панели. */
export const helpVideoUrl = (id: string): string => `/admin/help/video/${id}`;

/**
 * Какое видео показать: на языке инструкции, а если на нём нет — на другом,
 * в порядке ru → uz → pl. Видео на чужом языке лучше, чем никакого: в нём
 * видно, куда нажимать.
 */
export function pickHelpVideo<T extends { section: string; locale: string }>(
  videos: readonly T[],
  section: string,
  locale: string,
): T | null {
  const own = videos.filter((video) => video.section === section);
  for (const lang of [locale, ...HELP_VIDEO_LOCALES]) {
    const hit = own.find((video) => video.locale === lang);
    if (hit) return hit;
  }
  return null;
}
