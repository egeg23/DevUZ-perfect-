import type { HelpCopy } from "./admin-help";

import { head, leadsSections } from "./admin-help-pl/leads";
import { prospectSections } from "./admin-help-pl/prospect";
import { workSections } from "./admin-help-pl/work";
import { moreSections, tail } from "./admin-help-pl/more";

/**
 * Instrukcja po polsku.
 *
 * Перевод admin-help-ru.ts абзац в абзац: те же пункты, роли и число
 * абзацев — это сверяет тест. Названия кнопок, блоков и статусов — в
 * «ёлочках» и ровно так, как они написаны на польской панели: человек ищет
 * их глазами на экране. Сообщения и кнопки бота в Telegram — по-русски, пока
 * бот не пишет на языке панели.
 *
 * Текст большой, поэтому разделён на четыре файла в content/admin-help-pl/
 * в порядке меню; здесь они только собираются.
 */
export const pl: HelpCopy = {
  ...head,
  sections: { ...leadsSections, ...prospectSections, ...workSections, ...moreSections },
  ...tail,
};
