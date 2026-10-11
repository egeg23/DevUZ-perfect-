import { MAX_IMAGES, type Image } from "@/lib/bloggers/audience";
import { handleBloggerMessage } from "@/lib/bloggers/converse";
import * as store from "@/lib/bloggers/store";
import { serviceClient } from "@/lib/supabase";

/**
 * Ответы агента блогерам в Telegram. Сообщение записывает скаут
 * (lib/bloggers/tg-queue.ts → bloggerInbound, ставит agent_due_at), ответ
 * пишет свип — модель живёт на сервере сайта, а не в скауте, — и кладёт в
 * tg_pending; отправляет скаут с того же рабочего аккаунта.
 */

/** Сколько разговоров за проход свипа: каждый — один-два вызова недорогой модели. */
export const TG_AGENT_PER_PASS = 3;

/** Что блогер написал после последнего нашего сообщения. */
export function unanswered(messages: readonly store.BloggerMessage[]): string {
  const out: string[] = [];
  for (let i = messages.length - 1; i >= 0 && messages[i].role === "blogger"; i--) out.unshift(messages[i].text);
  return out.join("\n");
}

export async function runTelegramAgent(now: Date = new Date()): Promise<{ answered: number; errors: string[] }> {
  const run = { answered: 0, errors: [] as string[] };
  const db = serviceClient();
  if (!db) return run;
  const { data } = await db
    .from("bloggers")
    .select("id")
    .lte("agent_due_at", now.toISOString())
    .order("agent_due_at", { ascending: true })
    .limit(TG_AGENT_PER_PASS);
  for (const row of data ?? []) {
    const blogger = await store.bloggerById(String(row.id));
    if (!blogger) continue;
    const images: Image[] = (blogger.inbox_images ?? []).slice(0, MAX_IMAGES) as Image[];
    // Снимаем отметку до модели: упадёт — повторять бесконечно не будем, разговор увидит человек.
    await store.updateBlogger(blogger.id, { agent_due_at: null, inbox_images: null });
    try {
      const turn = await handleBloggerMessage({ blogger, text: unanswered(blogger.messages), images, via: "telegram", recorded: true, now });
      if (turn.reply) await store.updateBlogger(blogger.id, { tg_pending: turn.reply, tg_pending_at: now.toISOString() });
      run.answered++;
    } catch (error) {
      run.errors.push(`@${blogger.handle}: ${(error as Error).message}`);
    }
  }
  return run;
}
