"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { record } from "@/lib/admin/audit";
import {
  prepareOutreach,
  queueOutreach,
  saveProspects,
  skipProspect,
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
export async function prepareOutreachAction(formData: FormData) {
  const staff = await requireStaff();
  const id = String(formData.get("prospect") ?? "");
  const result = await prepareOutreach(id, staff);
  revalidatePath("/admin/prospect");
  redirect(
    result.ok
      ? `/admin/prospect?open=${id}`
      : `/admin/prospect?open=${id}&e=${encodeURIComponent(result.reason ?? result.why)}`,
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

  const result = await queueOutreach(id, message, staff, await requestIp());
  revalidatePath("/admin/prospect");
  revalidatePath("/admin");
  redirect(result.ok ? "/admin/prospect?sent=1" : `/admin/prospect?open=${id}&e=${encodeURIComponent(result.why)}`);
}

/** «Не пишем»: сайт убирается из очереди руками, с причиной. */
export async function skipProspectAction(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("prospect") ?? "");
  await skipProspect(id, String(formData.get("reason") ?? ""));
  revalidatePath("/admin/prospect");
  redirect("/admin/prospect");
}
