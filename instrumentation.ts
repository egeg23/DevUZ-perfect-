/**
 * Один раз при старте сервера, до первого запроса.
 *
 * Реквизиты студии для договоров и счетов — из хранилища секретов, если в
 * .env их нет (lib/store/requisites-vault.ts). Только в Node: в edge-среде
 * клиента базы нет.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { loadSellerBank } = await import("@/lib/store/requisites-vault");
  const taken = await loadSellerBank();
  if (taken.length) console.log(`реквизиты студии: из хранилища ${taken.join(", ")}`);
}
