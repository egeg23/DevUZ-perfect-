import { safeBytes } from "@/lib/audit/fetch";
import { wants } from "@/lib/admin/notify-prefs";
import {
  OUTSIDE_REGION,
  PLATFORM,
  PLATFORMS,
  checkDue,
  generationHour,
  ourLinkOn,
  pickTopics,
  postizContent,
  toTelegraphNodes,
  weekCardText,
  weekOf,
  type CardLine,
  type Platform,
} from "@/lib/outside/posts";
import { POSTIZ_KEY, channelFor, postizChannels, postizPosts, postizPublish, releaseOf, type PostizChannel } from "@/lib/outside/postiz";
import {
  listPosts,
  markAutoFailed,
  markAutoPublished,
  markAutoSent,
  publishedPosts,
  readPublisher,
  saveLinkCheck,
  savePost,
  sentPosts,
} from "@/lib/outside/store";
import { telegraphPublish } from "@/lib/outside/telegraph";
import { appSecret } from "@/lib/secrets";
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
 * Площадки, которые публикуются сами (Telegraph, ВКонтакте и Telegram через
 * Postiz), получают черновик, только когда подключены: Telegraph — всегда
 * (ключ заводится сам), Postiz — если в нём есть канал площадки. Черновик
 * уходит сразу (publishAuto); не вышло — остаётся «Ждут публикации» с
 * причиной, и его публикует человек. Отданные в Postiz свип на каждом
 * проходе сверяет с ним и забирает ссылку (syncSent).
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

export type OutsideRun = { week: string | null; made: Platform[]; auto: Platform[]; errors: string[]; checked: number; synced: number };

/** Telegraph публикуется всегда: регистрации нет, ключ заводится сам. */
export const TELEGRAPH_ON = true;

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
  const run: OutsideRun = { week: null, made: [], auto: [], errors: [], checked: 0, synced: 0 };
  if (!serviceClient()) return run;
  run.synced = await syncSent(now);
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

  const waiting = posts.filter((p) => p.status === "ready" || p.status === "sent");
  const channels = await connectedChannels();
  const active = PLATFORMS.filter((p) => {
    const via = PLATFORM[p].via;
    return via === "hand" || (via === "telegraph" && TELEGRAPH_ON) || (via === "postiz" && channelFor(channels, p));
  });
  const topics = pickTopics(
    posts.map((p) => ({ platform: p.platform, topic_key: p.topic_key })),
    waiting.map((p) => p.platform),
    undefined,
    active,
  );
  const made: CardLine[] = [];
  const auto: CardLine[] = [];
  for (const platform of active) {
    const topic = topics[platform];
    if (!topic) continue;
    try {
      const research = await keywordResearch(topic.query, OUTSIDE_REGION);
      const draft = await writeDraft(topic, platform, research.related);
      if (typeof draft === "string") {
        run.errors.push(`${platform}: ${draft}`);
        continue;
      }
      const saved = await savePost({
        platform,
        topic_key: topic.key,
        query: topic.query,
        title: draft.title,
        body: draft.body,
        research,
        model: OUTSIDE_MODEL,
      });
      if ("error" in saved) {
        run.errors.push(`${platform}: не сохранилась: ${saved.error}`);
        continue;
      }
      if (PLATFORM[platform].via === "hand") {
        run.made.push(platform);
        made.push({ platform, title: draft.title });
        continue;
      }
      const failed = await publishAuto(saved.id, platform, topic.key, draft, channels, now);
      if (failed) {
        run.errors.push(`${platform}: сама не вышла: ${failed}`);
        made.push({ platform, title: draft.title });
      } else {
        run.auto.push(platform);
        auto.push({ platform, title: draft.title });
      }
    } catch (error) {
      run.errors.push(`${platform}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Темы кончились у всех площадок без черновика — сказать, а не молчать.
  const free = active.filter((p) => !waiting.some((w) => w.platform === p));
  if (free.length && free.every((p) => !topics[p])) {
    await report("Темы кончились: все темы из content/outside-topics.ts уже написаны для площадок. Добавьте новые — черновики пойдут со следующей недели.");
  }

  const stuck = waiting.filter((p) => p.status === "ready");
  if (made.length || stuck.length || auto.length) {
    await sendCard(made, stuck.map((p) => ({ platform: p.platform, title: p.title })), auto);
  }
  if (run.errors.length) await report(`Не все черновики готовы. ${run.errors.slice(0, 3).join("; ")}`);
  return run;
}

/**
 * Карточка недели: выбранному в разделе «Кто публикует» или, если никого не
 * выбрали, владельцу и руководителю (галочка «Отчёты»).
 */
async function sendCard(made: CardLine[], waiting: CardLine[], auto: CardLine[]): Promise<number> {
  const db = serviceClient();
  if (!db) return 0;
  const publisher = await readPublisher();
  const query = db.from("staff").select("id, telegram_user_id, notify_off").eq("is_active", true);
  const { data } = publisher ? await query.eq("id", publisher) : await query.in("role", ["admin", "head"]);
  const readers = (data ?? []).filter(
    (r) => Number(r.telegram_user_id) && (publisher || wants((r.notify_off as string[] | null) ?? [], "reports")),
  );
  const text = weekCardText(made, waiting, esc, auto);
  let sent = 0;
  for (const r of readers) {
    if (await sendWithButtons(Number(r.telegram_user_id), text, [{ text: "📝 Открыть статьи", panel: "/admin/outside" }])) sent += 1;
  }
  return sent;
}

/** Каналы Postiz, если ключ задан; нет ключа или Postiz не ответил — пусто, площадки Postiz ждут. */
async function connectedChannels(): Promise<PostizChannel[]> {
  if (!(await appSecret(POSTIZ_KEY))) return [];
  const channels = await postizChannels();
  return "error" in channels ? [] : channels;
}

/**
 * Опубликовать черновик площадки, которая публикуется сама. Строка — почему
 * не вышло: черновик тогда остаётся «Ждут публикации» с этой причиной.
 */
async function publishAuto(
  id: string,
  platform: Platform,
  topicKey: string,
  draft: { title: string; body: string },
  channels: readonly PostizChannel[],
  now: Date,
): Promise<string | null> {
  const spec = PLATFORM[platform];
  let reason: string;
  if (spec.via === "telegraph") {
    const page = await telegraphPublish(draft.title, toTelegraphNodes(draft.body, platform, topicKey));
    if ("url" in page && (await markAutoPublished(id, platform, "telegraph", page.url, now))) return null;
    reason = "error" in page ? page.error : `Telegraph дал адрес не своей площадки: ${page.url.slice(0, 80)}`;
  } else {
    const channel = channelFor(channels, platform);
    if (!channel) reason = `в Postiz нет канала ${spec.name}`;
    else {
      const post = await postizPublish(platform, channel.id, postizContent(draft.title, draft.body, platform, topicKey), now);
      if ("id" in post && (await markAutoSent(id, post.id, now))) return null;
      reason = "error" in post ? post.error : "номер поста не записался";
    }
  }
  await markAutoFailed(id, reason);
  return reason;
}

/** Окно запроса постов Postiz: от самого старого отданного минус сутки. */
const SYNC_BACK_MS = 86_400_000;
/** Отданный, но не вышедший за трое суток — возвращается человеку. */
export const SENT_GIVE_UP_MS = 3 * 86_400_000;

/**
 * Отданные в Postiz: вышел — ссылка и «Опубликованные» (дальше её
 * проверяет checkPublished), ошибка или трое суток тишины — обратно в
 * «Ждут публикации» с причиной. Один запрос к Postiz на все, и только когда
 * отданные есть.
 */
async function syncSent(now: Date): Promise<number> {
  const sent = await sentPosts();
  if (!sent.length) return 0;
  const oldest = Math.min(...sent.map((p) => Date.parse(p.sent_at ?? p.created_at)));
  const list = await postizPosts(new Date(oldest - SYNC_BACK_MS), new Date(now.getTime() + SYNC_BACK_MS));
  if ("error" in list) return 0;
  let synced = 0;
  for (const post of sent) {
    const release = post.external_id ? releaseOf(list.data, post.external_id) : null;
    if (release?.state === "published" && release.url && (await markAutoPublished(post.id, post.platform, "postiz", release.url, now))) {
      synced += 1;
      continue;
    }
    const waited = now.getTime() - Date.parse(post.sent_at ?? post.created_at);
    if (release?.state === "error" || (release?.state === "published" && release.url) || waited > SENT_GIVE_UP_MS) {
      await markAutoFailed(
        post.id,
        release?.state === "error" ? (release.error ?? "Postiz: ошибка публикации") : release?.url ? `адрес не площадки: ${release.url.slice(0, 80)}` : "Postiz трое суток не публикует",
      );
      synced += 1;
    }
  }
  return synced;
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
