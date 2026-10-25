/**
 * «Настройки» — всё, что в панели настраивают, на одной странице.
 *
 * Владелец, 25.10.2026, на разбор «чем мы уступаем HubSpot и Close»:
 * «Погнали по порядку». Настройки лежали в шести местах: язык и «Новое
 * меню» — в шапке, уведомления на телефоне — на «Главной» и в «Команде»,
 * тексты писем и «Первое сообщение» — в «Тексты писем и A/B», автопрогон —
 * в «Холодных касаниях», кружки — в «Аккаунтах», галочки бота, доступ к
 * разделам и «Лиды без лимита» — в «Команде», выключатель «Обучения» — в
 * самом «Обучении». Новичок не знал, где что, и спрашивал владельца.
 *
 * Сами настройки остаются там, где жили: кнопки, права и проверки — те же.
 * Здесь только список ссылок на них, отобранный по роли и галочкам
 * владельца (`opens`), чтобы никому не показать то, что ему не откроется.
 */
import { SECTIONS, opens, type Role, type Viewer } from "@/lib/admin/roles";

export type SettingId =
  | "texts"
  | "hello"
  | "autopilot"
  | "circles"
  | "accounts"
  | "notices"
  | "access"
  | "unlimited"
  | "learn";

export type SettingLink = {
  id: SettingId;
  /** Блок на странице: касания или команда. Своё («Моё») — не ссылки, а сами переключатели. */
  group: "touch" | "team";
  href: string;
  /** Кто это меняет, а не только видит: строку видит тот, кому настройка в руках. */
  roles: readonly Role[];
};

const EVERYONE: readonly Role[] = ["admin", "head", "manager"];
const WITH_HEAD: readonly Role[] = ["admin", "head"];
const OWNER: readonly Role[] = ["admin"];

/**
 * Порядок — как на странице. Роли — кто вправе менять: «Первое сообщение» —
 * руководитель и владелец (lib/admin/hello-text.ts), выключатель автопрогона
 * у руководителя только на просмотр, но норму и порядок он видит там же;
 * доступ к разделам, «Лиды без лимита» и «Обучение для команды» — только
 * владелец.
 */
export const SETTING_LINKS: readonly SettingLink[] = [
  { id: "texts", group: "touch", href: "/admin/prospect/texts", roles: EVERYONE },
  { id: "hello", group: "touch", href: "/admin/prospect/texts#hello", roles: WITH_HEAD },
  { id: "autopilot", group: "touch", href: "/admin/prospect#autopilot", roles: WITH_HEAD },
  { id: "circles", group: "touch", href: "/admin/accounts#circle-niches", roles: WITH_HEAD },
  { id: "accounts", group: "touch", href: "/admin/accounts", roles: WITH_HEAD },
  { id: "notices", group: "team", href: "/admin/team", roles: WITH_HEAD },
  { id: "access", group: "team", href: "/admin/team", roles: OWNER },
  { id: "unlimited", group: "team", href: "/admin/team", roles: OWNER },
  { id: "learn", group: "team", href: "/admin/learn", roles: OWNER },
];

/** Раздел, которому принадлежит адрес: «/admin/prospect/texts#hello» — «Холодные касания». */
export function sectionOfHref(href: string): string | null {
  const path = href.split("#")[0].split("?")[0];
  let best: string | null = null;
  for (const s of SECTIONS) {
    const inside = s.href === "/admin" ? path === "/admin" : path === s.href || path.startsWith(`${s.href}/`);
    if (inside && (!best || s.href.length > best.length)) best = s.href;
  }
  return best;
}

/** Что из настроек показать человеку: роль вправе менять, а раздел ему открыт. */
export function settingsFor(who: Viewer): SettingLink[] {
  return SETTING_LINKS.filter((link) => {
    if (!link.roles.includes(who.role)) return false;
    const section = sectionOfHref(link.href);
    return section !== null && opens(who, section);
  });
}
