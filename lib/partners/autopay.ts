import { alertOwners } from "@/lib/partners/bot";
import { autoPayoutTurnover, notifyPartner, turnoverProjectsDue } from "@/lib/partners/store";
import { esc } from "@/lib/qualify/telegram";
import { siteUrl } from "@/lib/seo";

/**
 * Выплата с оборота — сама, как только проект оплачен целиком.
 *
 * Владелец, 01.10: «Расчёт с оборота происходит автоматически, когда мы
 * получаем 100 % суммы». Заявку на выплату заводит `autoPayoutTurnover`
 * (строго одна на проект), здесь — два сообщения: партнёру — «начислено,
 * выплата в обработке» (нет реквизитов — попросить внести), владельцу —
 * кому, сколько и за что перевести.
 *
 * Зовётся при записи платежа (lib/admin/ledger.ts — и из «Деньги», и из
 * «Оплачен» у счёта договора) и страховочно из свипа. Модель «от прибыли»
 * сюда не попадает: её база зависит от себестоимости.
 *
 * `true` — выплата заведена сейчас.
 */
export async function settleTurnover(projectId: string): Promise<boolean> {
  const done = await autoPayoutTurnover(projectId);
  if (!done) return false;
  const { partner, payout, project } = done;
  const name = project.client?.trim() || project.title.trim();
  const sum = `${payout.amount_usd.toLocaleString("ru-RU")} $`;

  await notifyPartner(
    partner,
    [
      `✅ Проект${name ? ` «${esc(name)}»` : ""} оплачен целиком. Вам начислено <b>${sum}</b> с оборота — выплата в обработке, заявку подавать не нужно.`,
      payout.requisites
        ? `Переведём на: ${esc(payout.requisites)}. Когда отправим — придёт сообщение.`
        : "Реквизиты для выплаты не указаны — внесите их в кабинете: /cabinet (раздел «Выплата»). Без них перевести некуда.",
    ].join("\n"),
  );

  await alertOwners(
    [
      "💸 <b>Выплата партнёру с оборота</b>",
      `Выплатить партнёру ${esc(partner.name)}${partner.username ? ` (@${esc(partner.username)})` : ""} <b>${sum}</b> за «${esc(name || "проект")}».`,
      `Куда: ${payout.requisites ? esc(payout.requisites) : "реквизитов нет — партнёра попросили внести"}`,
      "",
      `Перевели — нажмите «Выплачено»: ${siteUrl}/admin/partners`,
    ].join("\n"),
  );
  return true;
}

/** Свип: оплаченные проекты «с оборота», по которым выплата почему-то не завелась. */
export async function settleTurnoverDue(): Promise<number> {
  let made = 0;
  for (const projectId of await turnoverProjectsDue()) {
    try {
      if (await settleTurnover(projectId)) made += 1;
    } catch (error) {
      console.error("partners: автовыплата в свипе", projectId, error);
    }
  }
  return made;
}
