import { readAppSecret } from "@/lib/secrets";

/**
 * Реквизиты студии из хранилища секретов, когда в .env их нет.
 *
 * Владелец, 29.10.2026, прислал счёт студии в «Капиталбанке»: «Вот наши
 * реквизиты, запомни их, запиши». В git счёт не кладём (см. requisites.ts),
 * а .env выкатка не пишет — поэтому реквизиты лежат в хранилище
 * (`app.INVOICE_*`), и сервер при старте переносит их в окружение: дальше
 * `sellerBank()` читает их как обычно, синхронно, в договоре и счёте.
 *
 * Берутся связками, а не по одной: номер налогоплательщика — вместе с его
 * видом (ПИНФЛ под подписью «ИНН» бухгалтерия вернёт), банк — вместе со
 * счётом и МФО (счёт одного банка с МФО другого — платёж в никуда). Что
 * задано в .env, то главнее, как у всех секретов.
 */

/** Связки переменных: первая решает, брать ли связку из хранилища. */
export const SELLER_GROUPS: readonly (readonly string[])[] = [
  ["INVOICE_TAX_ID", "INVOICE_TAX_ID_KIND"],
  ["INVOICE_BANK_ACCOUNT", "INVOICE_BANK_NAME", "INVOICE_BANK_MFO"],
];

/** Сервер ждёт хранилище не дольше этого: старт важнее реквизитов. */
export const SELLER_LOAD_MS = 4000;

type Read = (name: string) => Promise<string | null>;

const fromVault: Read = async (name) => (await readAppSecret(name)).value;

/**
 * Переносит связки из хранилища в `env`. Возвращает имена, которые взяты
 * из хранилища. Хранилище молчит или связка неполная — ничего не трогает:
 * панель честно скажет «не хватает реквизитов».
 */
export async function loadSellerBank(
  env: Record<string, string | undefined> = process.env,
  read: Read = fromVault,
  timeoutMs = SELLER_LOAD_MS,
): Promise<string[]> {
  const work = (async () => {
    const taken: string[] = [];
    for (const group of SELLER_GROUPS) {
      if ((env[group[0]] ?? "").trim()) continue;
      const values = await Promise.all(group.map((name) => read(name)));
      // Связка целиком или никак: половина реквизитов из .env, половина из
      // хранилища — это счёт одного банка с МФО другого.
      if (values.some((v) => !v || !v.trim())) continue;
      group.forEach((name, i) => {
        env[name] = values[i]!.trim();
        taken.push(name);
      });
    }
    return taken;
  })();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<string[]>((resolve) => {
    timer = setTimeout(() => resolve([]), timeoutMs);
  });
  try {
    return await Promise.race([work, late]);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
