"use server";

import { isHelpLocale, type HelpLocale } from "@/content/admin-help";
import { requireStaff } from "@/lib/admin/guard";
import { MODEL_LIMIT, QUESTION_MAX, searchHelp, type HelpSearchResult } from "@/lib/admin/help-search";
import { isRole, type Role } from "@/lib/admin/roles";
import { rateLimit } from "@/lib/qualify/limiter";

/**
 * Поиск по инструкции: вопрос своими словами → пункты, которые на него
 * отвечают (см. lib/admin/help-search.ts).
 *
 * Роль и язык — те же, что у страницы: владелец в «Показать как» ищет по
 * инструкции этой роли, остальные — только по своей, что бы ни пришло из
 * браузера. Частые вопросы одного человека модели не отдаются, а ищутся по
 * словам: страница работает, а счёт за модель не растёт от зажатой клавиши.
 */
export async function searchHelpAction(question: string, lang: string, as?: string): Promise<HelpSearchResult> {
  const staff = await requireStaff();
  const locale: HelpLocale = isHelpLocale(lang) ? lang : isHelpLocale(staff.panel_locale) ? staff.panel_locale : "ru";
  const role: Role = staff.role === "admin" && as && isRole(as) ? as : staff.role;
  const text = String(question ?? "").slice(0, QUESTION_MAX);
  const useModel = rateLimit(`help-search:${staff.id}`, MODEL_LIMIT).ok;
  return searchHelp({ question: text, locale, role, useModel });
}
