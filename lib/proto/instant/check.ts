/**
 * Проверка «Макета в боте» машиной: с непустым списком макет не отдаётся.
 *
 * - хвосты: ни строки прошлого клиента, из чьего макета собран шаблон
 *   (content/proto-instant/tails.json, пишет scripts/protos/instant/tails.mjs);
 * - защита: условия макета, видео DevUz, ловушки и метка числа скрипта до
 *   отпечатка (CLAUDE.md «Макеты и прототипы — всегда под защитой»);
 * - без длинных тире и штампов ИИ (pageProblems);
 * - числа на странице — только из данных клиента;
 * - без сети, кроме шрифтов: скриптов со стороны нет.
 */
import tails from "@/content/proto-instant/tails.json" with { type: "json" };
import { MOCKUP_TERMS_PATH } from "@/content/mockup-terms";
import { visibleText } from "@/lib/proto/check";
import { pageProblems } from "@/lib/proto/plain-text";
import { sitePool, type InstantSite } from "@/lib/proto/instant/types";
import { unsupportedNumbers } from "@/lib/razbor/shift";

export type InstantProblem = { code: string; text: string };

const lower = (s: string) => s.toLowerCase().replace(/ё/g, "е");

/**
 * Строки прошлых клиентов в странице. Прощается одно: клиент и есть та
 * клиника (его название, адрес или сайт совпали). Строка в услугах или
 * «о клинике» хвостом остаётся.
 */
export function tailsIn(html: string, site?: InstantSite): string[] {
  const page = lower(html);
  const own = site ? lower([site.name, site.address ?? "", site.source].join(" \n ")) : "";
  const found = tails.text.filter((tail) => page.includes(lower(tail)) && !own.includes(lower(tail)));
  const digits = html.replace(/(\d)[\s()\-.]+(?=\d)/g, "$1");
  for (const phone of tails.phones) if (digits.includes(phone.slice(-9))) found.push(phone);
  return found;
}

/** До отпечатка: в шаблоне стоят ловушки и метка числа. */
export function instantProblems(raw: string, site: InstantSite): InstantProblem[] {
  const out: InstantProblem[] = [];
  const left = tailsIn(raw, site);
  if (left.length) out.push({ code: "tail", text: `Хвост прошлого макета: ${left.slice(0, 3).join(", ")}` });
  if (!raw.includes(MOCKUP_TERMS_PATH)) out.push({ code: "terms", text: "Нет ссылки на условия макета." });
  if (!raw.includes('class="dz-vid"')) out.push({ code: "intro", text: "Нет видео DevUz." });
  if ((raw.match(/\[\[t:\d+\]\]/g) ?? []).length < 2) out.push({ code: "trap", text: "Меньше двух ловушек." });
  if (!/\/\*~\*\/\d/.test(raw)) out.push({ code: "jsmark", text: "Нет числа скрипта с меткой." });
  if (/<script[^>]+src=/i.test(raw)) out.push({ code: "net", text: "Скрипт со стороны." });
  if (/<iframe/i.test(raw)) out.push({ code: "net", text: "Встроенная чужая страница." });
  for (const p of pageProblems(raw, sitePool(site))) out.push(p);
  // Ловушки не видны в числах: в шаблоне стоят как [[t:N]] — убрать до счёта.
  // Счётчик загрузки пролёта («0%») — не утверждение о клинике.
  const text = visibleText(raw.replace(/<div class="hs-load"[\s\S]*?<\/div>/, " ")).replace(/\[\[t:\d+\]\]/g, " ");
  const extra = unsupportedNumbers(text, "", sitePool(site));
  if (extra.length) out.push({ code: "numbers", text: `Числа не из данных клиента: ${extra.slice(0, 5).join(", ")}` });
  return out;
}
