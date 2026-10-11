import { TASHKENT_OFFSET_MS } from "@/lib/admin/pulse";
import { probe } from "@/lib/audit/fetch";
import { discover, type Profile } from "@/lib/bloggers/discovery";
import { judgeBlogger, type Judgement } from "@/lib/bloggers/judge";
import {
  candidatesFrom,
  channelFor,
  contactsFromBio,
  nextQuery,
  pitchLang,
  pitchText,
  scoreBlogger,
  type BloggerSettings,
} from "@/lib/bloggers/rules";
import * as store from "@/lib/bloggers/store";
import { dailyAllowance, firecrawlBalance, firecrawlKey, firecrawlSearch } from "@/lib/firecrawl";
import { siteUrl } from "@/lib/seo";

/**
 * ИИ-сотрудник «Блогеры» — один проход: найти новых, оценить найденных.
 *
 * Зовёт его свип каждые пять минут (app/api/reminders/sweep), пока агент
 * включён в панели, и кнопка «Найти сейчас». Тяжёлого здесь нет: один
 * поиск Firecrawl в несколько кредитов из дневного лимита, до трёх запросов
 * к Instagram и до трёх вызовов недорогой модели за проход.
 */

/** Ищем и оцениваем в рабочее время по Ташкенту: ночью некому отправлять. */
export const FROM_HOUR = 9;
export const TO_HOUR = 20;
/** Сколько найденных оценить за проход. */
export const JUDGE_PER_PASS = 3;
/** Один поиск — до 10 результатов; Firecrawl берёт около 2 кредитов. */
export const SEARCH_LIMIT = 10;
export const SEARCH_COST = 2;

export function tashkentHour(now: Date): number {
  return new Date(now.getTime() + TASHKENT_OFFSET_MS).getUTCHours();
}

/**
 * Сколько кредитов можно потратить на блогеров сейчас: своя дневная доля из
 * настроек, но не больше того, что осталось от общего дневного лимита.
 */
export function searchBudget(input: { own: number; usedByBloggers: number; allowance: number; usedAll: number }): number {
  return Math.max(0, Math.min(input.own - input.usedByBloggers, input.allowance - input.usedAll));
}

export type PassResult = {
  skipped?: "off" | "hours" | "offline";
  searched: string | null;
  added: number;
  judged: number;
  errors: string[];
};

/** Контакты с сайта блогера (часто это taplink или linktree): одна страница, своим обходом, без Firecrawl. */
async function siteContacts(url: string): Promise<{ telegram: string | null; email: string | null }> {
  try {
    const page = await probe(url);
    if (page.status >= 400) return { telegram: null, email: null };
    return contactsFromBio(page.html.replace(/mailto:/gi, " ").slice(0, 400_000));
  } catch {
    return { telegram: null, email: null };
  }
}

/**
 * Оценить одного блогера: цифры из Business Discovery (если подключён),
 * контакты из шапки и с сайта, модель — темы и Узбекистан, код — баллы.
 * Подходит — готовит первое сообщение и решает, куда его слать.
 */
export async function assess(
  blogger: store.Blogger,
  settings: BloggerSettings,
  deps: { discover?: typeof discover; judge?: typeof judgeBlogger; site?: typeof siteContacts } = {},
): Promise<store.Blogger | null> {
  const found = await (deps.discover ?? discover)(blogger.handle);
  const profile: Profile | null = found.ok ? found.profile : null;

  const merged = {
    name: profile?.name || blogger.name,
    bio: profile?.bio || blogger.bio,
    website: profile?.website ?? blogger.website,
    followers: profile?.followers ?? blogger.followers,
    following: profile?.following ?? blogger.following,
    posts: profile?.posts ?? blogger.posts,
  };
  let contacts = contactsFromBio(merged.bio);
  if ((!contacts.telegram || !contacts.email) && merged.website) {
    const more = await (deps.site ?? siteContacts)(merged.website);
    contacts = { telegram: contacts.telegram ?? more.telegram, email: contacts.email ?? more.email };
  }
  const telegram = blogger.telegram ?? contacts.telegram;
  const email = blogger.email ?? contacts.email;

  const judgement: Judgement = await (deps.judge ?? judgeBlogger)({
    handle: blogger.handle,
    name: merged.name,
    bio: merged.bio,
    captions: profile?.captions ?? [],
  });

  const scored = scoreBlogger(
    {
      followers: merged.followers,
      following: merged.following,
      engagement: profile?.engagement ?? blogger.engagement,
      postsPerWeek: profile?.postsPerWeek ?? blogger.posts_per_week,
      lastPostAt: profile?.lastPostAt ?? (blogger.last_post_at ? Date.parse(blogger.last_post_at) : null),
      uzbekistan: judgement.uzbekistan,
      lang: judgement.lang,
      fit: judgement.fit,
    },
    settings,
  );
  const lang = pitchLang(judgement.lang);
  const channel = channelFor({ telegram, email });
  if (!found.ok && found.reason !== "no_config") scored.notes.push("Instagram не отдал цифры профиля: личный аккаунт или ник сменился");

  const patch: Partial<store.Blogger> = {
    ...merged,
    avg_likes: profile?.avgLikes ?? blogger.avg_likes,
    avg_comments: profile?.avgComments ?? blogger.avg_comments,
    engagement: profile?.engagement ?? blogger.engagement,
    posts_per_week: profile?.postsPerWeek ?? blogger.posts_per_week,
    last_post_at: profile?.lastPostAt ? new Date(profile.lastPostAt).toISOString() : blogger.last_post_at,
    metrics_from: profile ? "ig" : blogger.metrics_from,
    topics: judgement.topics,
    lang: judgement.lang,
    city: judgement.city || null,
    fit: judgement.fit,
    why: judgement.why || null,
    telegram,
    email,
    score: scored.score,
    score_notes: scored.notes.join("; ") || null,
    status: scored.pass ? "ready" : "skipped",
    channel,
    pitch: pitchText({ name: merged.name, handle: blogger.handle }, lang, siteUrl),
    pitch_lang: lang,
    checked_at: new Date().toISOString(),
  };
  await store.updateBlogger(blogger.id, patch);
  return { ...blogger, ...patch } as store.Blogger;
}

/** Один поиск Firecrawl по следующему запросу из настроек. */
async function searchOnce(settings: BloggerSettings, now: Date, run: PassResult): Promise<void> {
  if (!settings.firecrawlDaily || !(await firecrawlKey())) return;
  const balance = await firecrawlBalance(now.getTime());
  if (!balance) return;
  const used = await store.firecrawlUsedToday(now);
  const allowance = dailyAllowance({ ...balance, usedToday: used.all, dayStart: store.dayStart(now).getTime() });
  if (searchBudget({ own: settings.firecrawlDaily, usedByBloggers: used.bloggers, allowance, usedAll: used.all }) < SEARCH_COST) return;

  const query = nextQuery(settings.queries, await store.queriesUsed());
  if (!query) return;
  const found = await firecrawlSearch(query, SEARCH_LIMIT);
  if (!found) return;
  const added = await store.addCandidates(candidatesFrom(found.results), query);
  await store.recordFirecrawl(null, { credits: found.credits, target: query, found: added });
  run.searched = query;
  run.added = added;
}

export async function bloggerPass(now: Date = new Date(), opts: { force?: boolean } = {}): Promise<PassResult> {
  const run: PassResult = { searched: null, added: 0, judged: 0, errors: [] };
  const settings = await store.loadSettings();
  if (!settings.enabled && !opts.force) return { ...run, skipped: "off" };
  const hour = tashkentHour(now);
  if (!opts.force && (hour < FROM_HOUR || hour >= TO_HOUR)) return { ...run, skipped: "hours" };

  // Сначала оценить уже найденных: поиск без оценки только копит очередь.
  const waiting = await store.bloggersByStatus(["found"], JUDGE_PER_PASS);
  for (const blogger of waiting) {
    try {
      await assess(blogger, settings);
      run.judged++;
    } catch (error) {
      run.errors.push(`@${blogger.handle}: ${(error as Error).message}`);
      break;
    }
  }
  if (waiting.length < JUDGE_PER_PASS) {
    await searchOnce(settings, now, run).catch((error) => run.errors.push(`поиск: ${(error as Error).message}`));
  }
  return run;
}
