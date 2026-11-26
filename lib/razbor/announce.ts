import { buildPayload, freshRazborUrls, sendPing, type PingReport } from "@/lib/indexnow";
import { RAZBOR_LOCALES } from "@/lib/razbor/routing";
import { listRazbors } from "@/lib/razbor/store";
import { todayInTashkent } from "@/lib/admin/pulse";
import { siteUrl } from "@/lib/seo";
import { siteUrls } from "@/lib/seo/site-urls";
import { serviceClient } from "@/lib/supabase";

/**
 * Сказать Bing и Яндексу, что раздел изменился.
 *
 * Зовётся из двух мест: из выкатки (`app/api/indexnow/route.ts`) и из кнопки
 * «Опубликовать». Второе появилось потому, что разбор выходит не выкаткой:
 * смена складывает черновики ночью, владелец публикует их днём, и до
 * следующего деплоя — иногда через неделю — Bing и Яндекс о новой странице
 * не знали. Google протокол не поддерживает, туда страница попадает через
 * sitemap.xml, который кнопка сбрасывает отдельно.
 *
 * Собрать список и отправить — одна функция на оба вызова: разойдясь, они
 * стали бы пинговать разные наборы адресов, и понять, какой из них дошёл до
 * поисковика, было бы нечем.
 */
export type Announcement =
  | { state: "no-key" }
  | { state: "bad-input"; why: string }
  | { state: "sent"; report: PingReport };

export async function announceRazbors(): Promise<Announcement> {
  const key = (process.env.INDEXNOW_KEY || "").trim();
  // Без ключа пинговать нечем. Это не ошибка ни выкатки, ни публикации:
  // страница уже на сайте и уже в карте сайта.
  if (!key) return { state: "no-key" };

  let payload;
  try {
    const razbors = (
      await Promise.all(RAZBOR_LOCALES.map((locale) => listRazbors(locale)))
    ).flat();
    const urls = freshRazborUrls(siteUrl, { locales: RAZBOR_LOCALES, items: razbors });
    payload = buildPayload({ key, siteUrl, urls });
  } catch (error) {
    return { state: "bad-input", why: error instanceof Error ? error.message : String(error) };
  }

  return { state: "sent", report: await sendPing(payload) };
}

/**
 * Пинг после выкатки: свежие разборы всегда, главные страницы и проекты —
 * раз в сутки по Ташкенту (`daily_claims`, job «indexnow-site»). Выкаток бывает
 * несколько в день, а одни и те же адреса каждый час поисковику не нужны.
 * База не ответила — шлём только разборы, как раньше.
 */
export async function announceDeploy(now: Date = new Date()): Promise<Announcement & { site?: boolean }> {
  const key = (process.env.INDEXNOW_KEY || "").trim();
  if (!key) return { state: "no-key" };

  let site = false;
  const db = serviceClient();
  if (db) {
    const { data, error } = await db
      .from("daily_claims")
      .upsert({ job: "indexnow-site", day: todayInTashkent(now) }, { onConflict: "job,day", ignoreDuplicates: true })
      .select("job");
    site = !error && Boolean(data?.length);
  }

  let payload;
  try {
    const razbors = (
      await Promise.all(RAZBOR_LOCALES.map((locale) => listRazbors(locale)))
    ).flat();
    const urls = [
      ...freshRazborUrls(siteUrl, { locales: RAZBOR_LOCALES, items: razbors }),
      ...(site ? siteUrls(siteUrl) : []),
    ];
    payload = buildPayload({ key, siteUrl, urls: [...new Set(urls)] });
  } catch (error) {
    return { state: "bad-input", why: error instanceof Error ? error.message : String(error) };
  }

  return { state: "sent", report: await sendPing(payload), site };
}
