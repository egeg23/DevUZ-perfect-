import { asInet } from "@/lib/net";
import { serviceClient } from "@/lib/supabase";

/**
 * Действия, которые журналируются.
 *
 * Массив с `as const`, а не enum: Node запускает наши .ts без компиляции,
 * только срезая типы, и enum — единственная конструкция TypeScript,
 * которая после среза должна была бы оставить код. Он падает с
 * ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX, хотя tsc и next build принимают его
 * молча. Массив переживает срез типов и заодно доступен в рантайме —
 * фильтру на экране журнала он нужен именно таким.
 */
export const AUDIT_ACTIONS = [
  "login.requested",
  "login.succeeded",
  "login.failed",
  "logout",
  "lead.viewed",
  "lead.taken",
  "lead.added",
  "lead.prototype_taken",
  "lead.released",
  "lead.status_changed",
  "lead.contact_revealed",
  "lead.transcript_viewed",
  "lead.auto_reminder_toggled",
  "reminder.created",
  "reminder.done",
  "reminder.sent",
  "message.posted",
  "project.created",
  "project.updated",
  "project.stage_changed",
  "order.status_changed",
  "order.invoiced",
  "order.paid",
  "order.delivered",
  "order.cancelled",
  "order.reopened",
  "order.amount_set",
  "order.link_reissued",
  "release.published",
  "download.served",
  "download.refused",
  "entitlement.revoked",
  "entitlement.restored",
  "order.nudged",
  "prospect.audited",
  "signal.status_changed",
  "staff.invited",
  "staff.disabled",
  "staff.role_changed",
  "staff.head_changed",
  "staff.grade_changed",
  "staff.touch_plan_set",
  "staff.notices",
  "staff.sections",
  // «Без лимита лидов» — владелец снял или вернул ночной потолок равной доли.
  "staff.lead_unlimited",
  "staff.updated",
  "partner.model_changed",
  "partner.agency_requested",
  "partner.agency_decided",
  "partner.client_claimed",
  "partner.client_lead",
  "lead.inn_set",
  // Ступени продажи: «Есть интерес», «Показал макет», «Назвал цену»
  // (lib/admin/sales-stages-store.ts).
  "lead.sales_marked",
  // Порядок в лидах (lib/admin/lead-tidy.ts): «⏳ Ещё в работе» под вопросом
  // бота и лид, который бот сам закрыл «проиграли» после 21 дня без движения.
  "lead.idle_snoozed",
  "lead.auto_lost",
  "partner.client_cancelled",
  "partner.payout_auto",
  "partner.accumulate_set",
  // Промо-материалы партнёров: что выложили, поправили и удалили.
  "partner.promo_added",
  "partner.promo_updated",
  "partner.promo_deleted",
  // Деньги: сумма и вид проекта, платежи клиента, выплаты сотрудникам.
  "project.money_set",
  "project.quote_set",
  "plan.set",
  "plan.removed",
  // Разбор резюме кандидата: кто смотрел и кого. Чужие персональные
  // данные проходят через панель, и след о том, кто их читал, обязателен.
  "candidate.reviewed",
  "candidate.dropped",
  "prospect.queued",
  // Касание, сделанное руками: по ручному маршруту его не видно ниоткуда
  // больше, а знать, кто и когда написал, нужно так же, как и по телеграму.
  "prospect.manual_sent",
  "prospect.manual_reply",
  "prospect.taken_over",
  "prospect.staff_reply",
  // «Клиент отказался» / «Игнорирует»: касание убрано из работы, лид закрыт.
  "prospect.closed",
  // Тексты писем касания и A/B (lib/admin/letter-texts.ts): кто какой текст
  // завёл, убрал, оставил победителем и сделал общим для всех.
  "letter_text.saved",
  "letter_text.removed",
  "letter_text.kept",
  "letter_text.made_common",
  // Своё «Здравствуйте» (lib/admin/hello-text.ts): руководитель или владелец
  // сменил первое сообщение касания.
  "hello_text.saved",
  // «Исправить» у отправленного письма или ответа (lib/admin/outreach-edit-request.ts).
  "prospect.edit_requested",
  // Поток «Получать лиды» в боте: включил и выключил.
  "stream.on",
  "stream.off",
  // Автопрогон касаний в «Касаниях»: владелец включил и выключил.
  "autopilot.on",
  "autopilot.off",
  "invoice.issued",
  "invoice.paid",
  // Оплата счёта стала платежом в проекте — или отметку сняли как ошибочную.
  "invoice.payment_confirmed",
  "invoice.unpaid",
  "contract.link_issued",
  "razbor.published",
  "razbor.rejected",
  // Снятие с публикации, правка и удаление — то же решение, что и
  // публикация, только обратное: страница под именем студии появляется или
  // исчезает из поиска. След о нём нужен ровно так же.
  "razbor.unpublished",
  "razbor.edited",
  "razbor.deleted",
  "proto.build",
  "proto.sent",
  // Пароль на сутки к макету из раздела «Макеты» (lib/admin/mockups-store.ts):
  // кто выдал и к какому макету. Сам пароль в журнал не пишется.
  "mockup.code",
  "mockup.auto_closed",
  // Ответственный за макет, назначенный руками (руководитель или владелец).
  "mockup.owner",
  // Рабочие аккаунты Telegram: кто подключил номер, кто остановил и снял.
  "work_account.add",
  "work_account.pause",
  "work_account.resume",
  "work_account.remove",
  "work_account.staff",
  // Видео к инструкциям: кто загрузил и кто убрал.
  "help_video.saved",
  "help_video.removed",
  // Кружок для касаний: кто загрузил новый (lib/admin/circle-upload.ts).
  "tg_circle.saved",
  "project.payment_added",
  "project.payment_removed",
  "payout.recorded",
  "payout.removed",
  "expense.added",
  "expense.removed",
  "project.share_set",
  // Партнёрская программа.
  "partner.created",
  "partner.link_created",
  "partner.updated",
  "partner.deleted",
  "partner.payout_requested",
  "partner.payout_decided",
  "project.partner_set",
  // Передача лида: просьба, решение и сама смена хозяина.
  "lead.transfer_requested",
  "lead.transfer_decided",
  "lead.transferred",
  // Свободного лида отдали человеку с «Главной» (giveLead).
  "lead.given",
  // Лид удалён кнопкой «🗑 Мусор» в боте (lib/admin/lead-trash-store.ts).
  "lead.trashed",
  // Сотрудник ответил клиенту в боте на «📩 Обращение в бота»
  // (lib/qualify/bot-inbox-store.ts): ответ ушёл копией от бота студии.
  "bot.replied",
  // Вход владельца через Google для статистики GA: доступ к данным
  // Analytics сохраняется в хранилище секретов — кто и когда его дал, видно.
  "google.client_saved",
  "google.connected",
  "google.property_set",
  // Задачи команды: поставил, взял, закрыл, перенёс срок.
  "task.created",
  "task.taken",
  "task.done",
  "task.failed",
  "task.moved",
  "task.cancelled",
  "task.edited",
  // Рассылка в бот всей команде с «Главной» (lib/admin/broadcast-store.ts).
  "broadcast.created",
  "broadcast.cancelled",
  // Обучение: владелец включил или выключил раздел для команды, добавил или
  // убрал материал курса (app/admin/learn/actions.ts).
  "learn.switched",
  "learn.material_added",
  "learn.material_removed",
] as const;

/**
 * Тип выводится из списка, а не пишется рядом с ним. Два перечисления
 * одного и того же расходятся: экран журнала фильтрует по массиву, код
 * пишет по типу, и добавленное в одном месте действие тихо выпадает из
 * фильтра — то есть перестаёт находиться ровно тогда, когда его ищут.
 */
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/**
 * Запись в журнал.
 *
 * Молчит при любой ошибке и никогда не бросает: журнал не должен ронять
 * действие, которое он описывает. Обратное — прямой путь к тому, что
 * первый же сбой журналирования выключает панель целиком.
 *
 * Строку отсюда уже нельзя ни изменить, ни удалить: на таблице стоит
 * триггер, а принадлежит она роли postgres, поэтому его не снимет и наш
 * собственный сервер со service_role.
 */
export async function record(
  action: AuditAction,
  detail: {
    actorStaffId?: string | null;
    targetType?: string | null;
    targetId?: string | null;
    meta?: Record<string, unknown>;
    ip?: string | null;
  } = {},
): Promise<void> {
  const db = serviceClient();
  if (!db) return;

  try {
    const { error } = await db.from("audit_events").insert({
      actor_staff_id: detail.actorStaffId ?? null,
      action,
      target_type: detail.targetType ?? null,
      target_id: detail.targetId ?? null,
      meta: detail.meta ?? {},
      ip: asInet(detail.ip ?? null),
    });
    if (error) console.error("audit", action, error.message);
  } catch (error) {
    console.error("audit", action, error);
  }
}
