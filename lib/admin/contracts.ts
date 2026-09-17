import type { Role } from "@/lib/admin/roles";
import type { ContractInput, ContractStage } from "@/content/contract";
import type { EstimateItem } from "@/lib/admin/estimate";

/**
 * Права и правила вокруг договора.
 *
 * Владелец: «менеджер может подготовить договор (проверить все), но подпись
 * моя появится на договоре только после подтверждения мной».
 *
 * Отсюда разделение, которое легко потерять при следующей правке ролей:
 * готовить может кто угодно из команды, подтверждать — только владелец, и
 * подпись существует только у подтверждённого договора. Не «скрыта», а не
 * отдаётся: скрытая стилями картинка достаётся любым «сохранить как».
 */

/**
 * Состояния договора.
 *
 * `pending` — отправлен владельцу на подпись. Заморожен: владельцу пришло
 * уведомление, и то, что он открыл, не должно измениться под ним между
 * уведомлением и нажатием кнопки.
 *
 * `signed` — вернулся скан с подписями обеих сторон. Конец маршрута.
 */
export type ContractStatus = "draft" | "pending" | "approved" | "signed" | "void";

export type Contract = {
  id: string;
  created_at: string;
  project_id: string;
  number: string;
  signed_date: string;
  client_name: string;
  client_details: string;
  subject: string;
  amount_usd: number;
  stages: ContractStage[];
  status: ContractStatus;
  prepared_by: string | null;
  prepared_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  void_reason: string | null;

  /** Смета: файл-приложение и разобранные строки. */
  estimate_path: string | null;
  estimate_name: string | null;
  estimate_items: EstimateItem[];
  /** Общий срок словами сотрудника: «60 рабочих дней с даты аванса». */
  deadline_text: string | null;

  /**
   * Банковские реквизиты заказчика — отдельными полями, а не строкой.
   *
   * Номер счёта, набранный внутри предложения с адресом и почтой, нельзя
   * ни проверить, ни перенести в платёжку, не перечитывая фразу целиком.
   * Ошибка в одной цифре — это деньги, ушедшие не туда.
   */
  client_tax_id: string | null;
  client_bank_name: string | null;
  client_account: string | null;
  client_mfo: string | null;

  /** Хеш ссылки для заказчика. Самого токена в базе нет и быть не должно. */
  access_hash: string | null;

  sent_at: string | null;
  sent_by: string | null;
  notified_at: string | null;

  signed_path: string | null;
  signed_at: string | null;
  signed_by: string | null;
};

/** Готовить и править черновик может вся команда: это работа менеджера. */
export function preparesContract(role: Role): boolean {
  return role === "admin" || role === "head" || role === "manager";
}

/**
 * Подтверждать — только владелец.
 *
 * Это не вопрос иерархии, а вопрос подписи: подтверждение и есть момент,
 * когда под документом появляется подпись физического лица. Передать это
 * право руководителю проектов значит разрешить ему подписываться за
 * владельца.
 */
export function approvesContract(role: Role): boolean {
  return role === "admin";
}

/**
 * Видеть подпись может тот, кому договор и так открыт, — но только после
 * подтверждения. До него подписи нет ни у кого, включая владельца: пока он
 * не нажал, подписывать нечего.
 */
export function signatureVisible(contract: Pick<Contract, "status">): boolean {
  return contract.status === "approved";
}

/**
 * Правится только черновик.
 *
 * Отправленный на подпись заморожен намеренно: владельцу ушло уведомление
 * со ссылкой, и документ, изменившийся между уведомлением и нажатием
 * кнопки, — это подпись под тем, чего он не читал.
 */
export function editable(contract: Pick<Contract, "status">): boolean {
  return contract.status === "draft";
}

/** Отправить на подпись можно заполненный черновик. */
export function sendable(
  contract: Pick<Contract, "status"> & Parameters<typeof problemsBeforeApproval>[0],
): boolean {
  return contract.status === "draft" && problemsBeforeApproval(contract).length === 0;
}

/** Вернуть на доработку может владелец, и только то, что ему прислали. */
export function returnable(contract: Pick<Contract, "status">): boolean {
  return contract.status === "pending";
}

/** Скан с подписями грузится к подтверждённому договору. */
export function acceptsScan(contract: Pick<Contract, "status">): boolean {
  return contract.status === "approved";
}

/* ── Проверки перед подтверждением ──────────────────────────────────────── */

export type Problem = { field: string; text: string };

/**
 * Что должно быть заполнено, прежде чем владелец подтвердит.
 *
 * Список возвращается целиком, а не по первой ошибке: владелец должен один
 * раз увидеть всё, чего не хватает, а не выяснять это в пять заходов.
 *
 * Проверки здесь не про вкус, а про то, из-за чего договор оспаривается по
 * формальному признаку: неназванная сторона, неопределённый предмет,
 * несходящиеся этапы.
 */
/**
 * Реквизиты исполнителя приходят аргументом, а не читаются здесь.
 *
 * Они живут в переменных окружения, и функция, лезущая в `process.env`,
 * перестаёт быть проверяемой: тест не может подсунуть ей «счёт не заполнен».
 * Поле обязательное, не опциональное, — иначе вызывающий, забывший его
 * передать, получит договор без банковских реквизитов и не узнает об этом.
 */
export type SellerRequisites = {
  taxId: string;
  bankName: string;
  account: string;
  mfo: string;
} | null;

export function problemsBeforeApproval(
  contract: Pick<Contract, "client_name" | "client_details" | "subject" | "amount_usd" | "stages" | "number" | "signed_date"> & {
    estimateItems?: readonly EstimateItem[];
    deadlineText?: string | null;
    client_tax_id?: string | null;
    client_bank_name?: string | null;
    client_account?: string | null;
    client_mfo?: string | null;
    seller: SellerRequisites;
  },
): Problem[] {
  const out: Problem[] = [];

  if (!contract.number.trim()) out.push({ field: "number", text: "Нет номера договора" });
  if (!contract.signed_date) out.push({ field: "signed_date", text: "Нет даты договора" });

  // Пять знаков, а не три: «ООО» — это организационная форма, а не сторона
  // договора. Сторона, которую нельзя опознать по названию, — первое, за что
  // цепляются при оспаривании.
  if (contract.client_name.trim().length < 5) {
    out.push({ field: "client_name", text: "Не названа сторона заказчика" });
  }
  // Реквизиты заказчика — не формальность: без них некому предъявлять
  // претензию и некуда направлять уведомления, а договор с неустановленной
  // стороной оспаривается первым.
  if (contract.client_details.trim().length < 10) {
    out.push({ field: "client_details", text: "Нет реквизитов заказчика: адрес, идентификатор, контакт" });
  }

  if (contract.subject.trim().length < 20) {
    out.push({ field: "subject", text: "Предмет договора описан слишком общо — его нельзя проверить на исполнение" });
  }

  if (!(contract.amount_usd > 0)) out.push({ field: "amount_usd", text: "Сумма не указана" });

  if (!contract.estimateItems || contract.estimateItems.length === 0) {
    out.push({ field: "estimate", text: "Нет сметы: без неё в договоре не из чего собрать перечень работ" });
  }
  if (!contract.deadlineText || contract.deadlineText.trim().length < 5) {
    out.push({ field: "deadline", text: "Не указан согласованный срок выполнения" });
  }

  // Банк обеих сторон. Договор без счёта — это договор, по которому нельзя
  // заплатить и нельзя доказать, кому платили.
  if (!contract.seller) {
    out.push({
      field: "seller",
      text: "Не заполнены банковские реквизиты студии — договор без счёта исполнителя не подписывают",
    });
  }
  if (!(contract.client_tax_id ?? "").trim()) {
    out.push({ field: "client_tax_id", text: "Нет ИНН или ПИНФЛ заказчика" });
  }
  if (!(contract.client_bank_name ?? "").trim()) {
    out.push({ field: "client_bank_name", text: "Не указан банк заказчика" });
  }
  // Расчётный счёт в Узбекистане — двадцать цифр. Проверяем длину и то, что
  // это цифры: счёт с лишним пробелом или буквой не примет ни один банк, а
  // заметят это в день платежа, а не в день подписания.
  const account = (contract.client_account ?? "").replace(/\s/g, "");
  if (!account) {
    out.push({ field: "client_account", text: "Не указан расчётный счёт заказчика" });
  } else if (!/^\d{20}$/.test(account)) {
    out.push({ field: "client_account", text: "Расчётный счёт заказчика — двадцать цифр, сейчас там другое" });
  }
  // МФО — пять цифр. Это код банка, по нему платёж и находит отделение.
  const mfo = (contract.client_mfo ?? "").replace(/\s/g, "");
  if (!mfo) {
    out.push({ field: "client_mfo", text: "Не указан МФО — код банка заказчика" });
  } else if (!/^\d{5}$/.test(mfo)) {
    out.push({ field: "client_mfo", text: "МФО — пять цифр, сейчас там другое" });
  }

  if (contract.stages.length === 0) {
    out.push({ field: "stages", text: "Нет ни одного этапа" });
  } else {
    const total = contract.stages.reduce((sum, s) => sum + s.percent, 0);
    // Сравниваем с допуском: доли вводит человек, и 33,3 + 33,3 + 33,4
    // обязаны проходить, а 33 + 33 + 33 — нет.
    if (Math.abs(total - 100) > 0.05) {
      out.push({ field: "stages", text: `Доли этапов дают ${total}% вместо 100%` });
    }
    if (contract.stages.some((s) => s.percent <= 0)) {
      out.push({ field: "stages", text: "У этапа нулевая или отрицательная доля" });
    }
    if (contract.stages.some((s) => s.workdays <= 0)) {
      out.push({ field: "stages", text: "У этапа не указан срок" });
    }
    if (contract.stages.some((s) => !s.title.trim())) {
      out.push({ field: "stages", text: "У этапа нет названия" });
    }
  }

  return out;
}

/** Готов ли договор к подтверждению. */
export function readyForApproval(
  contract: Parameters<typeof problemsBeforeApproval>[0],
): boolean {
  return problemsBeforeApproval(contract).length === 0;
}

/* ── Номер договора ─────────────────────────────────────────────────────── */

/**
 * Номер вида «DU-2026-07».
 *
 * Сквозная нумерация внутри года, а не по проекту: номер должен говорить,
 * который это договор студии, и пропуск в нумерации виден сразу. Порядковый
 * номер приходит из базы, а не считается здесь, — иначе два менеджера,
 * готовящие договоры одновременно, получат один номер.
 */
export function contractNumber(year: number, sequence: number): string {
  return `DU-${year}-${String(sequence).padStart(2, "0")}`;
}

/* ── Запись базы → вход шаблона ─────────────────────────────────────────── */

/**
 * Переводит строку таблицы в то, из чего собирается текст.
 *
 * Отдельной функцией, а не сборкой на месте: страница печати, отправка
 * заказчику и предпросмотр обязаны показывать один и тот же текст. Собери
 * вход в трёх местах — и однажды они разойдутся, а заметит это заказчик.
 */
export function toContractInput(contract: Contract): ContractInput {
  return {
    number: contract.number,
    date: contract.signed_date,
    client: { name: contract.client_name, details: contract.client_details },
    subject: contract.subject,
    amountUsd: contract.amount_usd,
    stages: contract.stages,
    estimate: contract.estimate_items,
    deadline: contract.deadline_text ?? "",
  };
}

/**
 * Имя файла для скачивания скана с подписями.
 *
 * Расширение берётся из сохранённого пути, но только из имени файла:
 * скан с телефона легко приезжает без расширения вовсе, и поиск точки по
 * всему пути откусит тогда последнюю букву имени — заказчик получит
 * файл «dogovor-1-podpisann».
 */
export function signedFileName(number: string, path: string): string {
  const name = path.slice(path.lastIndexOf("/") + 1);
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 ? name.slice(dot) : "";
  return `dogovor-${number}-podpisan${ext}`;
}
