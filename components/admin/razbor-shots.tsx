import { razborDict } from "@/content/admin-panel/razbor";
import { pick, type PanelLocale } from "@/lib/admin/i18n";
import type { ReviewRow } from "@/lib/razbor/store";

/**
 * Сколько у разбора снимков — одной строкой в заголовке карточки.
 *
 * Снимки — половина ценности разбора: текст «на сайте не видно телефона»
 * читатель либо принимает на веру, либо нет, а первый экран с обведённой
 * шапкой спорить не с чем. Съёмка идёт отдельным проходом и может отстать
 * от статьи на несколько часов, поэтому проверяющему нужно видеть, дошла
 * она сюда или нет, — до того, как он нажмёт «Опубликовать», а не после.
 *
 * Публиковать без снимков не запрещено: страница покажет статью и подберёт
 * снимки, как только они появятся. Но молчать об их отсутствии — значит
 * дать выпустить полразбора, не заметив этого.
 */
export function ShotState({ shots, locale = "ru" }: { shots: ReviewRow["shots"]; locale?: PanelLocale }) {
  const t = pick(razborDict, locale);
  const missing: string[] = [];
  if (!shots.before) missing.push(t.shotBefore);
  if (!shots.after) missing.push(t.shotAfter);

  if (!missing.length) {
    return <span className="font-mono text-[0.7rem] text-green">{t.shotsOk(shots.findings)}</span>;
  }

  return <span className="font-mono text-[0.7rem] text-gold">{t.noShot(missing.join(t.shotAnd))}</span>;
}
