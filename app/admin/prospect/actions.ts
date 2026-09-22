"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { record } from "@/lib/admin/audit";
import {
  markSelfContacted,
  prepareOutreach,
  queueOutreach,
  recordManualAnswer,
  saveProspects,
  skipProspect,
  saveNoSite,
} from "@/lib/admin/outreach-store";
import { requestIp, requireStaff } from "@/lib/admin/guard";
import { pitchLocales, type PitchLocale } from "@/lib/audit/pitch";
import {
  auditOne,
  BATCH_CAP,
  CHUNK,
  toProspectRow,
  type BatchTarget,
  type ProspectRow,
} from "@/lib/audit/batch";

/**
 * Проверка пачки адресов.
 *
 * Пачками, а не одним запросом на весь список, по двум причинам. Первая:
 * один сайт держит соединение до восьми секунд, и полсотни подряд не
 * уложатся ни в какой разумный таймаут. Вторая важнее — человек должен
 * видеть движение. Прогресс, идущий на экране, отличает работающий
 * инструмент от зависшего.
 *
 * Внутри пачки идём последовательно. Параллельно было бы быстрее, но это
 * чужие сайты, и десяток одновременных запросов с одного адреса выглядит
 * со стороны ровно как то, чем не является.
 */
export async function auditChunkAction(
  targets: BatchTarget[],
  locale: PitchLocale = "ru",
): Promise<ProspectRow[]> {
  const staff = await requireStaff();

  // Язык черновика — тоже ввод из браузера: незнакомое значение не должно
  // стать ключом словаря заходов.
  const lang: PitchLocale = pitchLocales.includes(locale) ? locale : "ru";

  // Потолок на случай, если пачка придёт не с нашей страницы: действие
  // сервера вызывается из браузера, и размер пачки — это ввод, а не
  // константа.
  const slice = targets.slice(0, CHUNK);

  const rows: ProspectRow[] = [];
  for (const target of slice) {
    rows.push(toProspectRow(await auditOne(target), lang, staff.display_name));
  }

  await record("prospect.audited", {
    actorStaffId: staff.id,
    targetType: "system",
    ip: await requestIp(),
    meta: { count: rows.length },
  });

  return rows;
}

/**
 * Разобранное сохраняется сразу, а не по кнопке.
 *
 * До этого прогон жил в состоянии вкладки: обновил страницу — и полсотни
 * проверенных сайтов исчезли вместе с находками. Сохранение прямо здесь,
 * в том же действии, что и проверка, — потому что решение «писать или нет»
 * менеджер принимает не в ту же минуту, а позже и на свежую голову.
 */
export async function saveRunAction(rows: ProspectRow[]): Promise<number> {
  await requireStaff();
  return saveProspects(rows.slice(0, BATCH_CAP));
}

/** Кнопка «Связаться»: модель пишет первое сообщение по находкам. */
/**
 * Компании без сайта — списком, одной нишей на всех.
 *
 * Прогона здесь нет: разбирать нечего. Строки ложатся в базу сразу, а письмо
 * по каждой пишется потом — от ниши, а не от находок.
 */
export async function saveNoSiteAction(
  names: string[],
  niche: string,
): Promise<{ added: number; skipped: number }> {
  await requireStaff();
  const result = await saveNoSite(names, niche);
  revalidatePath("/admin/prospect");
  return result;
}

export async function prepareOutreachAction(formData: FormData) {
  const staff = await requireStaff();
  const id = String(formData.get("prospect") ?? "");
  /**
   * Отказ вместо исключения.
   *
   * Серверное действие, выбросившее наружу, в проде не показывает ничего:
   * форма молча остаётся как была, и менеджер видит нерабочую кнопку.
   * Обход сайта и модель — два места, где что угодно может пойти не так, и
   * любое «не так» должно доезжать до экрана словами.
   */
  let result: Awaited<ReturnType<typeof prepareOutreach>>;
  try {
    result = await prepareOutreach(id, staff);
  } catch (error) {
    result = { ok: false, why: error instanceof Error ? error.message : String(error) };
  }

  revalidatePath("/admin/prospect");
  // Якорь на карточку: список бывает в полсотни строк, и без него страница
  // возвращается наверх — результат нажатия остаётся за три экрана ниже, и
  // выглядит это как будто ничего не произошло.
  redirect(
    result.ok
      ? `/admin/prospect?open=${id}#p-${id}`
      : `/admin/prospect?open=${id}&e=${encodeURIComponent(result.reason ?? result.why)}#p-${id}`,
  );
}

/**
 * Кнопка «Отправить»: сообщение уходит в очередь, лид закрепляется за тем,
 * кто нажал. Отправляет процесс скаута — у него сессия рабочего аккаунта.
 */
export async function sendOutreachAction(formData: FormData) {
  const staff = await requireStaff();
  const id = String(formData.get("prospect") ?? "");
  const message = String(formData.get("message") ?? "");

  /**
   * Отказ вместо исключения — по той же причине, что и у «Связаться».
   *
   * Серверное действие, выбросившее наружу, в проде не показывает ничего:
   * страница перерисовывается той же, и менеджер видит кнопку, которая
   * «не работает». Здесь этого ремня не было, хотя внутри и база, и
   * создание лида, и запись в журнал.
   */
  let result: Awaited<ReturnType<typeof queueOutreach>>;
  try {
    result = await queueOutreach(id, message, staff, await requestIp());
  } catch (error) {
    console.error("касания: отправка упала", error);
    result = { ok: false, why: error instanceof Error ? error.message : String(error) };
  }

  revalidatePath("/admin/prospect");
  revalidatePath("/admin");
  // Возврат на ту же карточку: результат нажатия стоит там, где была кнопка,
  // и увидеть его надо не прокруткой, а сразу.
  redirect(
    result.ok
      ? `/admin/prospect?sent=1&open=${id}#p-${id}`
      : `/admin/prospect?open=${id}&e=${encodeURIComponent(result.why)}#p-${id}`,
  );
}

/**
 * «Связался сам»: касание, которое человек сделал в обход скаута.
 *
 * Менеджеры пишут со своих аккаунтов — рабочая сессия Telegram одна, и
 * подключить к ней всех нельзя. Без этой отметки панель не видит отправки
 * вовсе: письмо ушло, а карточка висит новой, второй менеджер пишет тому же
 * человеку второй раз, и недельный план не считается ни у кого.
 */
export async function markSelfContactedAction(formData: FormData) {
  const staff = await requireStaff();
  const id = String(formData.get("prospect") ?? "");
  const result = await markSelfContacted(id, staff, String(formData.get("note") ?? ""), await requestIp());
  revalidatePath("/admin/prospect");
  revalidatePath("/admin");
  redirect(
    result.ok
      ? `/admin/prospect?open=${id}#p-${id}`
      : `/admin/prospect?open=${id}&e=${encodeURIComponent(result.why)}#p-${id}`,
  );
}

/**
 * «Что ответили»: ответ клиента переносит человек.
 *
 * По ручному маршруту он приходит менеджеру на телефон и к нам не попадает
 * ничем. Перенёс — дальше всё как в телеграме: модель пишет ответ, ответ
 * появляется в карточке, отправляет снова человек.
 */
export async function recordManualAnswerAction(formData: FormData) {
  const staff = await requireStaff();
  const id = String(formData.get("prospect") ?? "");
  const result = await recordManualAnswer(id, String(formData.get("body") ?? ""), staff, await requestIp());
  revalidatePath("/admin/prospect");
  redirect(
    result.ok
      ? `/admin/prospect?open=${id}#p-${id}`
      : `/admin/prospect?open=${id}&e=${encodeURIComponent(result.why)}#p-${id}`,
  );
}

/** «Не пишем»: сайт убирается из очереди руками, с причиной. */
export async function skipProspectAction(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("prospect") ?? "");
  await skipProspect(id, String(formData.get("reason") ?? ""));
  revalidatePath("/admin/prospect");
  redirect("/admin/prospect");
}
