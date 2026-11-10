/**
 * «Макет в боте готов к просмотру» — один раз Егору и Александру.
 *
 * Владелец, 10.11.2026: «Пока что открой доступ только мне и Александру с
 * этой функцией, пусть бот пришлет нам уведомление, хочу посмотреть как это
 * выглядит». Свип зовёт после выкатки; сообщение — в личку активным admin и
 * head с привязанным Telegram, с 08:00 до 21:00 по Ташкенту (messageWindow),
 * отметка `instant-pilot:v1` в team_news_sent до отправки. Не дошло —
 * отметка снимается, следующий проход попробует снова.
 */
import { messageWindow } from "@/lib/admin/tasks";
import { MOCKUP_BOT_OPEN, PILOT_ROLES } from "@/lib/proto/instant/limits";
import { sendMessage } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

export const PILOT_NEWS = "instant-pilot:v1";

export const PILOT_TEXT = [
  "🧪 <b>Макет в боте готов к просмотру</b>",
  "",
  "Напишите мне /maket, пришлите адрес сайта стоматологии (или нажмите «Сайта нет») и выберите «Стоматология». Через минуту-две придёт ссылка на макет и цена, как увидит клиент.",
  "",
  "Пока функцию видите только вы с Александром, клиентам и менеджерам она закрыта. Ваши сборки без лимита, лид из них не заводится, в «Макетах» они с пометкой «тестовый, из бота».",
].join("\n");

export async function sendInstantPilotNote(now: Date = new Date()): Promise<number> {
  if (MOCKUP_BOT_OPEN || !messageWindow(now)) return 0;
  const db = serviceClient();
  if (!db) return 0;
  const [{ data: readers }, { data: done }] = await Promise.all([
    db.from("staff").select("id, telegram_user_id").eq("is_active", true).in("role", [...PILOT_ROLES]),
    db.from("team_news_sent").select("staff_id").eq("news_id", PILOT_NEWS),
  ]);
  const already = new Set((done ?? []).map((r) => r.staff_id as string));
  let sent = 0;
  for (const r of readers ?? []) {
    const chat = Number(r.telegram_user_id);
    if (!chat || already.has(r.id as string)) continue;
    const { data: claimed } = await db
      .from("team_news_sent")
      .upsert({ news_id: PILOT_NEWS, staff_id: r.id }, { onConflict: "news_id,staff_id", ignoreDuplicates: true })
      .select("staff_id");
    if (!claimed?.length) continue;
    if (await sendMessage(chat, PILOT_TEXT)) sent += 1;
    else await db.from("team_news_sent").delete().eq("news_id", PILOT_NEWS).eq("staff_id", r.id);
  }
  return sent;
}
