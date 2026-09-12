"use server";

import { record } from "@/lib/admin/audit";
import { requestIp, requireStaff } from "@/lib/admin/guard";
import {
  auditOne,
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
export async function auditChunkAction(targets: BatchTarget[]): Promise<ProspectRow[]> {
  const staff = await requireStaff();

  // Потолок на случай, если пачка придёт не с нашей страницы: действие
  // сервера вызывается из браузера, и размер пачки — это ввод, а не
  // константа.
  const slice = targets.slice(0, CHUNK);

  const rows: ProspectRow[] = [];
  for (const target of slice) {
    rows.push(toProspectRow(await auditOne(target)));
  }

  await record("prospect.audited", {
    actorStaffId: staff.id,
    targetType: "system",
    ip: await requestIp(),
    meta: { count: rows.length },
  });

  return rows;
}
