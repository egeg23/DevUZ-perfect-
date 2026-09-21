import Anthropic from "@anthropic-ai/sdk";

/**
 * Отказ модели, переведённый на человеческий.
 *
 * 21 сентября менеджер нажал «Связаться» и увидел на карточке вот это:
 *
 *     400 {"type":"error","error":{"type":"invalid_request_error","message":
 *     "Your credit balance is too low to access the Anthropic API…"}}
 *
 * Строка верная и совершенно бесполезная: менеджер не знает ни что такое
 * credit balance, ни к кому с этим идти, и решает, что сломалась кнопка.
 * В тот же час чат на сайте отвечал посетителям `{"type":"error"}` — то
 * есть лид, который стоил денег, уходил с мыслью «у них не работает сайт».
 *
 * Поэтому одно место, которое отличает «у поставщика кончились деньги» от
 * «в коде ошибка». Первое — состояние, о нём говорят словами и предлагают
 * запасной путь. Второе — дефект, и его прятать нельзя.
 */

export type ModelTrouble = {
  /** Для решений в коде: показывать форму, повторять позже или звать владельца. */
  kind: "billing" | "auth" | "limit" | "down";
  /** Одна фраза: что случилось и что делать. Её видит сотрудник. */
  says: string;
};

/**
 * Признак нехватки денег ищется в тексте, а не по коду ответа.
 *
 * 400 у этого API означает «запрос неверен» — и наш собственный промах с
 * параметрами придёт тем же кодом. Отличает их только сообщение, поэтому
 * без совпадения по тексту 400 остаётся дефектом, а не «состоянием».
 */
const BILLING = /credit balance|billing|insufficient (funds|credit)|out of credit/i;

export function modelTrouble(error: unknown): ModelTrouble | null {
  // Сеть до поставщика не дошла: для сайта это то же самое, что молчащая
  // модель, и посетителю нужен тот же запасной путь.
  if (error instanceof Anthropic.APIConnectionError) {
    return { kind: "down", says: "Модель не отвечает — до поставщика не достучаться. Повторите через несколько минут." };
  }

  if (!(error instanceof Anthropic.APIError)) return null;

  const status = error.status;
  const text = `${error.message ?? ""}`;

  if (status === 400 && BILLING.test(text)) {
    return {
      kind: "billing",
      says:
        "На ключе модели кончились деньги. Пополните баланс в Anthropic Console — " +
        "всё заработает само, выкатывать ничего не нужно.",
    };
  }
  if (status === 401 || status === 403) {
    return { kind: "auth", says: "Ключ модели не принят. Проверьте ANTHROPIC_API_KEY на сервере." };
  }
  if (status === 429) {
    return { kind: "limit", says: "Модель отказывает по частоте запросов. Подождите минуту и повторите." };
  }
  if (typeof status === "number" && status >= 500) {
    return { kind: "down", says: "Модель временно недоступна — это на стороне поставщика. Повторите через несколько минут." };
  }

  return null;
}

/**
 * То же, но всегда строкой: для мест, где сотруднику нужно показать хоть
 * что-то. Дефект отдаётся как есть — прятать его за вежливой фразой значит
 * лишить себя единственной зацепки.
 */
export function modelTroubleSays(error: unknown): string {
  const trouble = modelTrouble(error);
  if (trouble) return trouble.says;
  return error instanceof Error ? error.message : String(error);
}
