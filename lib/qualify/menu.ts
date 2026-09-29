import { inQueue } from "@/lib/admin/lead-queue";
import type { Role } from "@/lib/admin/roles";
import { deleteMyCommands, setMyCommands, type BotCommand } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

/**
 * Меню команд бота.
 *
 * Telegram показывает список команд по кнопке «/» — без него человек не
 * узнает ни про /ref, ни про /payout. Список общий для всех личек, а
 * сотрудникам к нему добавляется /login (менеджерам и руководителям ещё и
 * /leads): команды назначаются на их чат отдельно, и клиент служебных
 * пунктов не видит.
 *
 * Синхронизируется при каждой выкатке, при заведении и отключении
 * сотрудника и кнопкой на странице команды. Идемпотентно: одинаковый
 * список можно ставить сколько угодно.
 */

const PUBLIC_RU: BotCommand[] = [
  { command: "start", description: "Начать разговор" },
  { command: "ref", description: "Партнёрская программа: ссылка и баланс" },
  { command: "payout", description: "Заявка на выплату партнёру" },
  { command: "cabinet", description: "Кабинет партнёра на сайте" },
  { command: "help", description: "Что умеет бот" },
  { command: "reset", description: "Начать разговор заново" },
];

const PUBLIC_EN: BotCommand[] = [
  { command: "start", description: "Start a conversation" },
  { command: "ref", description: "Partner program: your link and balance" },
  { command: "payout", description: "Partner payout request" },
  { command: "cabinet", description: "Partner dashboard on the website" },
  { command: "help", description: "What the bot can do" },
  { command: "reset", description: "Start over" },
];

const STAFF_EXTRA: BotCommand[] = [{ command: "login", description: "Вход в панель (для сотрудников)" }];

/**
 * Поток «Получать лиды» — тем, кто получает порцию: менеджерам и
 * руководителям. Владельцу команда ответила бы «не для вас».
 */
const QUEUE_EXTRA: BotCommand[] = [{ command: "leads", description: "Получать лиды: включить или выключить поток" }];

export type MenuSync = { ok: boolean; staff: number; failed: number };

export async function syncBotMenu(): Promise<MenuSync> {
  // Общее меню: русский по умолчанию, английский — для тех, у кого Telegram
  // на английском. Узбекский и китайский получают русский: Telegram отдаёт
  // список без language_code всем, для кого нет своего.
  const publicOk = (await setMyCommands(PUBLIC_RU)) && (await setMyCommands(PUBLIC_EN, { language_code: "en" }));

  const db = serviceClient();
  if (!db) return { ok: publicOk, staff: 0, failed: publicOk ? 0 : 1 };

  const { data } = await db.from("staff").select("telegram_user_id, is_active, role").limit(500);
  let staff = 0;
  let failed = publicOk ? 0 : 1;
  for (const row of data ?? []) {
    const chatId = Number(row.telegram_user_id);
    if (!Number.isFinite(chatId)) continue;
    const scope = { type: "chat" as const, chat_id: chatId };
    // Отключённому сотруднику /login в меню больше не нужен — а увидеть его
    // и получить «вас нет в списке» было бы обидно.
    const ok = row.is_active
      ? await setMyCommands(
          [...PUBLIC_RU, ...STAFF_EXTRA, ...(inQueue(row.role as Role) ? QUEUE_EXTRA : [])],
          { scope },
        )
      : await deleteMyCommands(scope);
    if (ok) staff++;
    else failed++;
  }

  return { ok: failed === 0, staff, failed };
}
