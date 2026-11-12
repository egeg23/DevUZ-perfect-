/**
 * «Макет в боте открыт всем» — один раз каждому сотруднику.
 *
 * Владелец, 12.11.2026: «Открываем для всех. Любой подписчик бота получает
 * только 1 макет. Менеджеры и сотрудники могут делать их без ограничений».
 * Лиды «макет в боте» и карточки «🔥 Нужен макет вручную» пойдут очередью, а
 * у каждого сотрудника появилась команда /maket: команда должна узнать это
 * от бота, а не от первого клиента. Свип зовёт после выкатки; сообщение — в
 * личку активным сотрудникам с привязанным Telegram, с 08:00 до 21:00 по
 * Ташкенту (messageWindow), отметка `instant-open:v1` в team_news_sent до
 * отправки. Не дошло — отметка снимается, следующий проход попробует снова.
 *
 * Пока поток закрыт (MOCKUP_BOT_OPEN = false, откат) — ничего не уходит.
 */
import { messageWindow } from "@/lib/admin/tasks";
import { MOCKUP_BOT_OPEN } from "@/lib/proto/instant/limits";
import { MANUAL_HOURS } from "@/lib/proto/instant/bot";
import { sendMessage } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

export const OPEN_NEWS = "instant-open:v1";

export const OPEN_TEXT = [
  "🚀 <b>Макет в боте открыт всем клиентам</b>",
  "",
  "Каждому, кто впервые пишет боту студии, бот теперь сам предлагает собрать макет сайта за 2 минуты: язык, адрес сайта или Instagram, сфера, и клиент получает ссылку на макет, админку и КП на 48 часов.",
  "",
  "• Клиенту — один макет на аккаунт. Собрал — вам приходит лид «макет в боте» обычной очередью, со ссылкой на макет.",
  `• Сферы нет в списке или сборка не прошла — карточка «🔥 Нужен макет вручную»: клиенту обещано ${MANUAL_HOURS} часов.`,
  "• Вам — без ограничений: напишите мне /maket и соберите макет для своего клиента. Такие сборки лидом не становятся, в «Макетах» они с пометкой «из бота, собрал сотрудник».",
].join("\n");

export async function sendInstantOpenNote(now: Date = new Date()): Promise<number> {
  if (!MOCKUP_BOT_OPEN || !messageWindow(now)) return 0;
  const db = serviceClient();
  if (!db) return 0;
  const [{ data: readers }, { data: done }] = await Promise.all([
    db.from("staff").select("id, telegram_user_id").eq("is_active", true).not("telegram_user_id", "is", null),
    db.from("team_news_sent").select("staff_id").eq("news_id", OPEN_NEWS),
  ]);
  const already = new Set((done ?? []).map((r) => r.staff_id as string));
  let sent = 0;
  for (const r of readers ?? []) {
    const chat = Number(r.telegram_user_id);
    if (!chat || already.has(r.id as string)) continue;
    const { data: claimed } = await db
      .from("team_news_sent")
      .upsert({ news_id: OPEN_NEWS, staff_id: r.id }, { onConflict: "news_id,staff_id", ignoreDuplicates: true })
      .select("staff_id");
    if (!claimed?.length) continue;
    if (await sendMessage(chat, OPEN_TEXT)) sent += 1;
    else await db.from("team_news_sent").delete().eq("news_id", OPEN_NEWS).eq("staff_id", r.id);
  }
  return sent;
}
