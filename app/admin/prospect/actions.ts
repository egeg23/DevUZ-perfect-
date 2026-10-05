"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";

import { record } from "@/lib/admin/audit";
import {
  closeTouch,
  markSelfContacted,
  prepareOutreach,
  queueOutreach,
  recordManualAnswer,
  saveProspects,
  skipProspect,
  saveNoSite,
} from "@/lib/admin/outreach-store";
import { requestIp, requireRole, requireStaff } from "@/lib/admin/guard";
import { deliverReplacement, portionOwner, topUpPortion } from "@/lib/admin/portion-store";
import { nudgeStream } from "@/lib/admin/stream-store";
import { isCloseReason } from "@/lib/admin/touch-close";
import { touchErrorParam } from "@/lib/admin/touch-errors";
import { createCampaign, listCampaigns, processPlaces, runSearch, setCampaignActive } from "@/lib/maps/store";
import { setAutopilot } from "@/lib/admin/autopilot-store";
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
    const detail = error instanceof Error ? error.message : String(error);
    result = { ok: false, why: detail, code: "defect", detail };
  }

  revalidatePath("/admin/prospect");
  // Якорь на карточку: список бывает в полсотни строк, и без него страница
  // возвращается наверх — результат нажатия остаётся за три экрана ниже, и
  // выглядит это как будто ничего не произошло.
  redirect(
    result.ok
      ? `/admin/prospect?open=${id}#p-${id}`
      : `/admin/prospect?open=${id}&e=${encodeURIComponent(touchErrorParam(result))}#p-${id}`,
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
    const detail = error instanceof Error ? error.message : String(error);
    result = { ok: false, why: detail, code: "defect", detail };
  }
  // Компания из потока «Получать лиды» — следующая придёт в Telegram сразу.
  if (result.ok) after(() => nudgeStream(id));

  revalidatePath("/admin/prospect");
  revalidatePath("/admin");
  // Возврат на ту же карточку: результат нажатия стоит там, где была кнопка,
  // и увидеть его надо не прокруткой, а сразу.
  redirect(
    result.ok
      ? `/admin/prospect?sent=1&open=${id}#p-${id}`
      : `/admin/prospect?open=${id}&e=${encodeURIComponent(touchErrorParam(result))}#p-${id}`,
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
  if (result.ok) after(() => nudgeStream(id));
  revalidatePath("/admin/prospect");
  revalidatePath("/admin");
  redirect(
    result.ok
      ? `/admin/prospect?open=${id}#p-${id}`
      : `/admin/prospect?open=${id}&e=${encodeURIComponent(touchErrorParam(result))}#p-${id}`,
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
      : `/admin/prospect?open=${id}&e=${encodeURIComponent(touchErrorParam(result))}#p-${id}`,
  );
}

/**
 * «Клиент отказался» / «Игнорирует»: касание уходит из работы — без дожима,
 * без ответов модели, лид закрыт «проиграли» (outreach-store → closeTouch).
 * Возврат — на ту же карточку: там теперь стоит, чем кончилось.
 */
export async function closeTouchAction(formData: FormData) {
  const staff = await requireStaff();
  const id = String(formData.get("prospect") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const result = isCloseReason(reason)
    ? await closeTouch(id, reason, staff, await requestIp(), "panel")
    : { ok: false as const, why: "Неизвестная причина.", code: "unknown_reason" as const };
  revalidatePath("/admin/prospect");
  revalidatePath("/admin/leads");
  redirect(
    result.ok
      ? `/admin/prospect?open=${id}#p-${id}`
      : `/admin/prospect?open=${id}&e=${encodeURIComponent(touchErrorParam(result))}#p-${id}`,
  );
}

/**
 * «Не пишем»: сайт убирается из очереди руками, с причиной.
 *
 * Если это компания из чьей-то сегодняшней порции, хозяину порции сразу
 * выдаётся замена — как за «Не подходит» в Telegram: в счёт порции идут
 * только касания. Письмо и карточка в Telegram — после ответа.
 */
export async function skipProspectAction(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("prospect") ?? "");
  await skipProspect(id, String(formData.get("reason") ?? ""));
  const owner = await portionOwner(id);
  if (owner) {
    const top = await topUpPortion(owner);
    if (top.made.length) after(async () => {
      for (const item of top.made) await deliverReplacement(item.rowId);
    });
    after(() => nudgeStream(id));
  }
  revalidatePath("/admin/prospect");
  redirect("/admin/prospect");
}

/* ── Автопоиск по картам ────────────────────────────────────────────── */

/**
 * Кампании автопоиска заводят владелец и руководитель: каждая — это
 * запросы к платному API и сотни компаний в пуле, а решать, какие ниши
 * студии нужны, — их работа, не менеджера.
 */
export async function createMapsCampaignAction(formData: FormData) {
  const staff = await requireRole("admin", "head");
  const created = await createCampaign(
    String(formData.get("niche") ?? ""),
    String(formData.get("city") ?? ""),
    staff,
  );
  if (created.ok && created.existed) {
    revalidatePath("/admin/prospect");
    redirect("/admin/prospect?maps=exists#maps");
  }
  if (created.ok) {
    // Первый проход — сразу, а не завтра в шесть: человек только что завёл
    // кампанию и хочет видеть, что она ищет.
    const campaign = (await listCampaigns()).find((c) => c.id === created.id);
    if (campaign) {
      await runSearch(campaign);
      after(() => processPlaces(new Date()).catch((error) => console.error("карты:", error)));
    }
  }
  revalidatePath("/admin/prospect");
  redirect(`/admin/prospect?maps=${created.ok ? "created" : "invalid"}#maps`);
}

export async function toggleMapsCampaignAction(formData: FormData) {
  await requireRole("admin", "head");
  await setCampaignActive(String(formData.get("campaign") ?? ""), formData.get("active") === "1");
  revalidatePath("/admin/prospect");
  redirect("/admin/prospect#maps");
}

export async function runMapsCampaignAction(formData: FormData) {
  await requireRole("admin", "head");
  const id = String(formData.get("campaign") ?? "");
  const campaign = (await listCampaigns()).find((c) => c.id === id);
  let code = "gone";
  if (campaign) {
    const run = await runSearch(campaign);
    code = run.error ? "failed" : run.requests === 0 ? "cap" : "ran";
    after(() => processPlaces(new Date()).catch((error) => console.error("карты:", error)));
  }
  revalidatePath("/admin/prospect");
  redirect(`/admin/prospect?maps=${code}#maps`);
}

/** Остановить или запустить автопрогон касаний — только владелец. */
export async function toggleAutopilotAction(formData: FormData) {
  const staff = await requireRole("admin");
  await setAutopilot(formData.get("enabled") === "1", staff, await requestIp());
  revalidatePath("/admin/prospect");
  redirect("/admin/prospect#autopilot");
}
