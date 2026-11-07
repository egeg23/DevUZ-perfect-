import { safeBytes } from "@/lib/audit/fetch";
import { wants } from "@/lib/admin/notify-prefs";
import {
  OUTSIDE_REGION,
  PLATFORMS,
  checkDue,
  generationHour,
  ourLinkOn,
  pickTopics,
  weekCardText,
  weekOf,
  type CardLine,
  type Platform,
} from "@/lib/outside/posts";
import { listPosts, publishedPosts, readPublisher, saveLinkCheck, savePost } from "@/lib/outside/store";
import { OUTSIDE_MODEL, writeDraft } from "@/lib/outside/write";
import { esc, sendWithButtons } from "@/lib/qualify/telegram";
import { keywordResearch } from "@/lib/seo/keywords";
import { serviceClient } from "@/lib/supabase";

/**
 * Неделя статей на площадках — из свипа.
 *
 * Раз в неделю, с 11:00 до 20:00 по Ташкенту: неделя забирается отметкой в
 * daily_claims (job «outside-posts», день — понедельник недели) до вызова
 * модели, поэтому второй проход свипа ту же неделю не начнёт. Каждой
 * площадке, у которой нет неопубликованного черновика, — тема (pickTopics),
 * запросы по России (Вордстат и Trends), черновик (writeDraft). Потом
 * карточка тому, кто публикует. Что не вышло — строкой владельцу через
 * отчёты смен.
 *
 * На каждом проходе — проверка одной-двух опубликованных статей: открыть
 * страницу, найти ссылку на нас, записать, передаёт ли она вес. Страница
 * открывается через lib/audit/fetch.ts (safeBytes): адрес вставил человек,
 * и запрос идёт только к проверенному IP, каждый редирект проверяется заново.
 */

export const OUTSIDE_SHIFT = "outside-posts";

/** Сколько опубликованных статей проверять за проход свипа. */
const CHECKS_PER_PASS = 2;
const PAGE_MAX_BYTES = 3 * 1024 * 1024;

export type OutsideRun = { week: string | null; made: Platform[]; errors: string[]; checked: number };

async function claimWeek(week: string): Promise<"ok" | "taken" | string> {
  const db = serviceClient();
  if (!db) return "база недоступна";
  const { data, error } = await db
    .from("daily_claims")
    .upsert({ job: OUTSIDE_SHIFT, day: week }, { onConflict: "job,day", ignoreDuplicates: true })
    .select("job");
  if (error) return `неделя не взята: ${error.message}`;
  return data?.length ? "ok" : "taken";
}

export async function runOutsidePosts(now = new Date()): Promise<OutsideRun> {
  const run: OutsideRun = { week: null, made: [], errors: [], checked: 0 };
  if (!serviceClient()) return run;
  run.checked = await checkPublished(now);
  if (!generationHour(now)) return run;

  // Таблицы нет — неделю не забираем: заработает сразу, как применят миграцию.
  const posts = await listPosts();
  if (!posts) return run;
  const week = weekOf(now);
  const claim = await claimWeek(week);
  if (claim === "taken") return run;
  if (claim !== "ok") {
    run.errors.push(claim);
    return run;
  }
  run.week = week;

  const waiting = posts.filter((p) => p.status === "ready");
  const topics = pickTopics(
    posts.map((p) => ({ platform: p.platform, topic_key: p.topic_key })),
    waiting.map((p) => p.platform),
  );
  const made: CardLine[] = [];
  for (const platform of PLATFORMS) {
    const topic = topics[platform];
    if (!topic) continue;
    try {
      const research = await keywordResearch(topic.query, OUTSIDE_REGION);
      const draft = await writeDraft(topic, platform, research.related);
      if (typeof draft === "string") {
        run.errors.push(`${platform}: ${draft}`);
        continue;
      }
      const failed = await savePost({
        platform,
        topic_key: topic.key,
        query: topic.query,
        title: draft.title,
        body: draft.body,
        research,
        model: OUTSIDE_MODEL,
      });
      if (failed) run.errors.push(`${platform}: не сохранилась: ${failed}`);
      else {
        run.made.push(platform);
        made.push({ platform, title: draft.title });
      }
    } catch (error) {
      run.errors.push(`${platform}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Темы кончились у всех площадок без черновика — сказать, а не молчать.
  const free = PLATFORMS.filter((p) => !waiting.some((w) => w.platform === p));
  if (free.length && free.every((p) => !topics[p])) {
    await report("Темы кончились: все темы из content/outside-topics.ts уже написаны для площадок. Добавьте новые — черновики пойдут со следующей недели.");
  }

  if (made.length || waiting.length) {
    await sendCard(made, waiting.map((p) => ({ platform: p.platform, title: p.title })));
  }
  if (run.errors.length) await report(`Не все черновики готовы. ${run.errors.slice(0, 3).join("; ")}`);
  return run;
}

/**
 * Карточка недели: выбранному в разделе «Кто публикует» или, если никого не
 * выбрали, владельцу и руководителю (галочка «Отчёты»).
 */
async function sendCard(made: CardLine[], waiting: CardLine[]): Promise<number> {
  const db = serviceClient();
  if (!db) return 0;
  const publisher = await readPublisher();
  const query = db.from("staff").select("id, telegram_user_id, notify_off").eq("is_active", true);
  const { data } = publisher ? await query.eq("id", publisher) : await query.in("role", ["admin", "head"]);
  const readers = (data ?? []).filter(
    (r) => Number(r.telegram_user_id) && (publisher || wants((r.notify_off as string[] | null) ?? [], "reports")),
  );
  const text = weekCardText(made, waiting, esc);
  let sent = 0;
  for (const r of readers) {
    if (await sendWithButtons(Number(r.telegram_user_id), text, [{ text: "📝 Открыть статьи", panel: "/admin/outside" }])) sent += 1;
  }
  return sent;
}

/** Проверка опубликованных: жива ли страница и стоит ли ссылка на нас. */
async function checkPublished(now: Date): Promise<number> {
  const due = (await publishedPosts()).filter((p) => p.published_url && checkDue(p, now)).slice(0, CHECKS_PER_PASS);
  let checked = 0;
  for (const post of due) {
    try {
      // Страницы площадок тяжёлые (vc.ru — больше полумегабайта): читаем до 3 МБ.
      const page = await safeBytes(post.published_url!, { maxBytes: PAGE_MAX_BYTES, accept: "text/html,*/*", browser: true });
      if (page.status >= 400) await saveLinkCheck(post.id, "unreachable", null, now);
      else {
        const link = ourLinkOn(page.bytes.toString("utf8"));
        await saveLinkCheck(post.id, link.state, link.rel, now);
      }
    } catch {
      await saveLinkCheck(post.id, "unreachable", null, now);
    }
    checked += 1;
  }
  return checked;
}

async function report(body: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db.from("shift_reports").insert({ shift: OUTSIDE_SHIFT, body: body.slice(0, 2000) });
}
